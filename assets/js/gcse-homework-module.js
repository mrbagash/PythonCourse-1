/**
 * gcse-homework-module.js – adaptive GCSE homework.
 *
 *  H1 Mastery engine   progress/{code}/mastery/{topicKey~skill} = { t, t0, n, c, last, box, next }
 *                      t = ability on the 1–5 question-level scale (a simple rating model): answering a
 *                      hard question right raises it a lot, an easy one wrong lowers it a lot.
 *                      Seeded from the pupil's working grade (never a cap – it only sets the start)
 *                      and their released test marks on each topic. Spaced review: right → 1, 2, 4,
 *                      8 weeks; wrong → back in 2 days.
 *  H2 Generator        ~60% weakest skills (boosted by misconceptions, over-confidence, teacher pins),
 *                      ~25% due for review, ~15% recently taught / interleaved. Taught topics only.
 *                      Difficulty aims for ~80% success; two right in a row steps up a level.
 *  H3 Pupil session    one question at a time; wrong → WHERE (highlighted), WHY (misconception /
 *                      why this option is wrong), WHAT was missing (mark points), then a similar
 *                      question comes back later. Silent activity log (tab leaves, window switches,
 *                      paste, copy, too-fast answers, sudden text bursts) is written to a write-only
 *                      path gcse/hwLog/{hw}/{code} – pupils are never told. Flagged answers do not
 *                      change mastery.
 *  H4 Teacher tab      set / auto-weekly homework, tracker, activity log, chase list.
 *  H5 Needs list + "Is homework helping?" (profile + class).
 *  Homework is practice: it never changes official averages, grades or DP.
 */
var HW = { size: 20, dueDays: 7, minMs: { mcq: 2500, short: 4000, code: 15000, table: 8000 }, minAwayMs: 1000, retries: 2, session: null };

function hwKey(topic, skill) { return gTopicKey(topic) + (skill ? '~' + skill : ''); }
function hwKeyParts(k) { var p = String(k).split('~'); return { topic: gFromTopicKey(p[0]), skill: p[1] || '' }; }
function hwKeyLabel(k) { var x = hwKeyParts(k); var n = J277.get(x.topic); var base = n ? n.title : x.topic; return x.skill ? (J277.skillLabel(x.topic, x.skill) || x.skill) + ' (' + x.topic + ')' : base + ' (' + x.topic + ')'; }
function hwP(t, level) { return 1 / (1 + Math.exp(-1.4 * (t - level))); }
function hwClamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function hwLevelOf(r) { return r.level || (r.difficulty === 'H' ? 4 : r.difficulty === 'F' ? 2 : 3); }
function hwFmtDate(ts) { return ts ? new Date(ts).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : ''; }

// Auto-markable bank questions grouped by key.
function hwBankByKey() {
  var by = {};
  (typeof gcseBankUsable === 'function' ? gcseBankUsable() : []).forEach(function (v) {
    var r = v.row;
    // Auto-markable: multiple choice, short written, code (run against tests) and fill-in tables.
    if (!v.live || ['mcq', 'short', 'code', 'table'].indexOf(r.type) === -1) return;
    var k = hwKey(r.topics[0], r.skill || '');
    (by[k] = by[k] || []).push(r);
  });
  return by;
}

// ── H1 mastery ──────────────────────────────────────────────────────────────
function hwStartTheta(grade) { return grade == null ? 2.5 : hwClamp(1 + (Number(grade) - 1) * 0.5, 1, 5); }
function hwSeedTheta(key, grade, topicPct) {
  var t = hwStartTheta(grade);
  var tp = topicPct[hwKeyParts(key).topic];
  if (tp && tp.p >= 2) t += (tp.pct - 60) / 40 * 1.2;
  return Math.round(hwClamp(t, 0.5, 5.5) * 100) / 100;
}
// correct: true / false, or 0.5 for "right, but with help" (half credit; review again in 3 days).
function hwUpdateMastery(m, level, correct, now) {
  m = Object.assign({ n: 0, c: 0, box: 0 }, m);
  var r = correct === true ? 1 : correct === false ? 0 : hwClamp(Number(correct) || 0, 0, 1);
  m.t = Math.round(hwClamp(m.t + 0.6 * (r - hwP(m.t, level)), 0.5, 6) * 100) / 100;
  m.n++; if (r >= 1) m.c++;
  m.last = now;
  if (r >= 1) { m.box = Math.min((m.box || 0) + 1, 4); m.next = now + [7, 14, 28, 56][m.box - 1] * 864e5; }
  else if (r > 0) { m.next = now + 3 * 864e5; }
  else { m.box = 0; m.next = now + 2 * 864e5; }
  return m;
}

// ── H2 generator ────────────────────────────────────────────────────────────
// ctx = { bank, mastery, covered[], grade, topicPct, misc{codeId}, plc{key}, pins[], excludes[], recent[] }
function hwEligibleKeys(ctx) {
  var taught = {};
  (ctx.covered || []).forEach(function (c) { J277.expand(c).forEach(function (s) { taught[s] = true; }); });
  var anyTaught = Object.keys(taught).length > 0;
  (ctx.pins || []).forEach(function (c) { J277.expand(c).forEach(function (s) { taught[s] = true; }); });
  var excl = {}; (ctx.excludes || []).forEach(function (c) { J277.expand(c).forEach(function (s) { excl[s] = true; }); });
  return Object.keys(ctx.bank).filter(function (k) {
    var tc = hwKeyParts(k).topic;
    if (excl[tc]) return false;
    if (anyTaught) return !!taught[tc];
    return !!(ctx.topicPct[tc]);        // nothing marked as taught: topics already tested
  });
}
function hwBuildPlan(ctx, size, rand) {
  rand = rand || Math.random;
  var keys = hwEligibleKeys(ctx);
  if (!keys.length) return [];
  var now = Date.now();
  var theta = function (k) { var m = ctx.mastery[k]; return m && m.t != null ? m.t : hwSeedTheta(k, ctx.grade, ctx.topicPct); };
  var pinned = {}; (ctx.pins || []).forEach(function (c) { J277.expand(c).forEach(function (s) { pinned[s] = true; }); });
  var boost = function (k) {
    var tc = hwKeyParts(k).topic, b = 0;
    Object.keys(ctx.misc || {}).forEach(function (id) { var c = J277.feedbackCode(id); if (c && (c.topics || []).some(function (t) { return tc.indexOf(t) === 0; }) && (!c.skill || c.skill === hwKeyParts(k).skill)) b += 0.6; });
    if (ctx.plc && ctx.plc[tc]) b += 0.6;
    if (pinned[tc]) b += 1.5;
    return Math.min(b, 2.5);
  };
  var weak = keys.map(function (k) { return { k: k, s: (5 - theta(k)) + boost(k) + rand() * 0.3 }; }).sort(function (a, b) { return b.s - a.s; }).map(function (x) { return x.k; });
  var due = keys.filter(function (k) { var m = ctx.mastery[k]; return m && m.n > 0 && m.next && m.next <= now; })
    .sort(function (a, b) { return ctx.mastery[a].next - ctx.mastery[b].next; });
  var recentTopics = (ctx.recent || []).slice(0, 6);
  var recent = keys.filter(function (k) { return recentTopics.indexOf(hwKeyParts(k).topic) !== -1; });
  var nW = Math.round(size * 0.6), nD = Math.round(size * 0.25), nR = size - nW - nD;
  var out = [];
  var take = function (list, n, spread) {
    if (!list.length) return 0;
    var pool = spread ? list.slice(0, Math.max(3, Math.min(5, list.length))) : list;
    for (var i = 0; i < n; i++) out.push(pool[i % pool.length]);
    return n;
  };
  take(weak, nW, true);
  if (due.length) take(due, nD); else take(weak.slice(5).length ? weak.slice(5) : weak, nD);
  if (recent.length) take(recent.sort(function () { return rand() - 0.5; }), nR); else take(keys.slice().sort(function () { return rand() - 0.5; }), nR);
  // Interleave: avoid the same key twice in a row where possible.
  var shuffled = out.sort(function () { return rand() - 0.5; });
  for (var i = 1; i < shuffled.length; i++) {
    if (shuffled[i] === shuffled[i - 1]) {
      for (var j = i + 1; j < shuffled.length; j++) if (shuffled[j] !== shuffled[i]) { var tmp = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = tmp; break; }
    }
  }
  return shuffled;
}
// Pick a question for a key at the target level, preferring unseen ones.
function hwPickQuestion(list, target, used, seen, rand) {
  rand = rand || Math.random;
  if (!list || !list.length) return null;
  var avail = list.filter(function (r) { return !used[r.id]; });
  if (!avail.length) avail = list;
  // Prefer questions that can explain mistakes (MCQs with why-this-is-wrong notes).
  var noWhy = function (r) { return r.type === 'mcq' && !(r.why && r.why.some(Boolean)) ? 0.6 : 0; };
  return avail.map(function (r) { return { r: r, s: Math.abs(hwLevelOf(r) - target) + (seen[r.id] ? 0.8 : 0) + noWhy(r) + rand() * 0.2 }; })
    .sort(function (a, b) { return a.s - b.s; })[0].r;
}
function hwTargetLevel(t, bump) { return hwClamp(Math.round(t - 0.8) + (bump || 0), 1, 5); }

// ── Why / where feedback ────────────────────────────────────────────────────
// res = { ok, mark, max, points, codes, chosen }
// Wrong answers: what went wrong (specific), the misconception if the pupil's own words show one,
// what was still needed (in pupil words), and the working / a full-mark answer.
function hwMiscHtml(m) {
  return '<div class="hw-misc rounded border border-red-200 bg-white p-2"><div><span class="font-semibold text-red-800">Misconception:</span> it looks like you think ' + gEsc(m.belief.replace(/\s*\(.*\)$/, '')) + '.</div>' +
    (m.fix ? '<div class="mt-0.5"><span class="font-semibold text-green-800">Actually:</span> ' + gEsc(m.fix) + '</div>' : '') + '</div>';
}
function hwCodeTableFeedbackHtml(q, answer, res) {
  var key = (Array.isArray(q.codes) ? q.codes : []).map(function (id) { return J277.feedbackCode(id); }).filter(function (c) { return c && !c.exam; })[0];
  if (q.type === 'code') {
    var c = res.code || { results: [], lines: [], passed: 0, total: 0 };
    var table = '<details class="text-xs mt-1"' + (res.ok ? '' : ' open') + '><summary class="cursor-pointer font-semibold">Test results</summary>' + GcseCode.resultsHtml(c, gEsc) + '</details>';
    if (res.ok) return '<div class="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-900"><b>✓ Your program passed all ' + c.total + ' tests!</b>' + table + '</div>';
    return '<div class="hw-feedback rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 space-y-2"><div><b>Not quite</b> – your program passed ' + c.passed + ' of ' + c.total + ' tests (' + res.mark + ' / ' + res.max + ' marks)</div>' +
      (c.lines.length ? '<div class="hw-wrong"><span class="font-semibold">What went wrong:</span><ul class="list-disc ml-5">' + c.lines.map(function (l) { return '<li>' + gEsc(l) + '</li>'; }).join('') + '</ul></div>' : '') + table +
      (key ? '<div class="text-xs"><span class="font-semibold">Remember:</span> ' + gEsc(key.text) + '</div>' : '') +
      '<div class="hw-model rounded border border-amber-200 bg-white p-2"><div class="font-semibold">One way to write it (there are others)</div><pre class="mt-1 text-xs font-mono whitespace-pre-wrap">' + gEsc(q.model || '') + '</pre></div>' +
      '<div class="text-xs text-amber-800">A similar question will come back later in this homework.</div></div>';
  }
  var t = res.table || { cells: [], correct: 0, total: 0 };
  var vals = []; try { vals = JSON.parse(answer || '[]'); } catch (e) {}
  if (res.ok) return '<div class="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-900"><b>✓ All ' + t.total + ' boxes right!</b></div>';
  return '<div class="hw-feedback rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 space-y-2"><div><b>Not quite</b> – ' + t.correct + ' of ' + t.total + ' boxes right (' + res.mark + ' / ' + res.max + ' marks)</div>' +
    '<div class="hw-where"><span class="font-semibold">Your table</span> (wrong boxes in red, with the right answer):' + hwTableInputHtml(q, { values: vals, marked: t.cells }) + '</div>' +
    (key ? '<div class="text-xs"><span class="font-semibold">Remember:</span> ' + gEsc(key.text) + '</div>' : '') +
    '<div class="text-xs text-amber-800">A similar question will come back later in this homework.</div></div>';
}
function hwFeedbackHtml(q, answer, res) {
  if (q.type === 'code' || q.type === 'table') return hwCodeTableFeedbackHtml(q, answer, res);
  if (res.ok) {
    return '<div class="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-900"><b>✓ Correct!</b>' +
      (res.points && res.points.length > 1 ? '<ul class="text-xs list-disc ml-5 mt-1">' + res.points.map(function (p) { return '<li>' + (p.awarded ? '✓ ' : '✗ ') + gEsc(p.reason) + '</li>'; }).join('') + '</ul>' : '') + '</div>';
  }
  var dg = typeof GcseDiagnose !== 'undefined' ? GcseDiagnose.diagnose(q, answer, res) : { lines: [], misc: [], missing: [], marks: [], working: '' };
  var h = '<div class="hw-feedback rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 space-y-2"><div><b>Not quite</b>' + (res.max > 1 ? ' – ' + res.mark + ' / ' + res.max + ' marks' : '') + '</div>';
  if (q.type === 'mcq') {
    var why = (q.why || [])[res.chosen];
    h += '<div><span class="font-semibold">You chose:</span> ' + gEsc(String.fromCharCode(65 + res.chosen) + '. ' + (q.options[res.chosen] || '')) + '</div>' +
      '<div class="hw-why"><span class="font-semibold">Why that is wrong:</span> ' + gEsc(why || 'Compare it with the correct answer below – what is different?') + '</div>';
    dg.misc.forEach(function (m) { h += hwMiscHtml(m); });
    h += '<div><span class="font-semibold">Correct answer:</span> ' + gEsc(String.fromCharCode(65 + q.answerIndex) + '. ' + q.options[q.answerIndex]) + '</div>';
    if (!dg.misc.length) {
      var key = (Array.isArray(q.codes) ? q.codes : []).map(function (id) { return J277.feedbackCode(id); }).filter(function (c) { return c && !c.exam; })[0];
      if (key) h += '<div class="text-xs"><span class="font-semibold">Remember:</span> ' + gEsc(key.text) + '</div>';
    }
  } else {
    h += '<div class="hw-where"><span class="font-semibold">Your answer:</span> ' + (String(answer || '').trim() ? '<span class="bg-white rounded px-1 whitespace-pre-wrap">' + GcseDiagnose.highlight(answer, dg.marks) + '</span>' : '<i>no answer</i>') + '</div>';
    if (dg.bitsHtml) h += '<div class="text-xs">Your bits (wrong ones in red):' + dg.bitsHtml + '</div>';
    if (dg.lines.length) h += '<div class="hw-wrong"><span class="font-semibold">What went wrong:</span><ul class="list-disc ml-5">' + dg.lines.map(function (l) { return '<li>' + gEsc(l) + '</li>'; }).join('') + '</ul></div>';
    dg.misc.forEach(function (m) { h += hwMiscHtml(m); });
    if (dg.missing.length) h += '<div class="hw-missing"><span class="font-semibold">' + (dg.missingAny ? 'To get the mark' + (dg.missingAny > 1 ? 's' : '') + ' you needed ' + (dg.missingAny > 1 ? 'any ' + dg.missingAny : 'one') + ' of these:' : 'What you still needed:') + '</span><ul class="list-disc ml-5">' + dg.missing.map(function (l) { return '<li>' + gEsc(l) + '</li>'; }).join('') + '</ul></div>';
    if (dg.working) h += '<div class="hw-working rounded border border-amber-200 bg-white p-2"><div class="font-semibold">How to work it out</div><div class="mt-1">' + dg.working + '</div></div>';
    else if (q.model && q.type !== 'code') h += '<div class="hw-model rounded border border-amber-200 bg-white p-2"><div class="font-semibold">A full-mark answer</div><div class="mt-1 whitespace-pre-wrap">' + gEsc(q.model) + '</div></div>';
    else if (q.markScheme && !(dg.missing.length === 1 && String(q.markScheme).replace(/\s*\(\d\)/g, '').trim() === dg.missing[0])) h += '<div class="hw-model rounded border border-amber-200 bg-white p-2"><div class="font-semibold">A full-mark answer</div><div class="mt-1 whitespace-pre-wrap">' + gEsc(String(q.markScheme).replace(/\s*\(\d\)/g, '')) + '</div></div>';
  }
  h += '<div class="text-xs text-amber-800">A similar question will come back later in this homework.</div></div>';
  return h;
}
function hwMarkAnswer(q, answer) {
  var res;
  if (q.type === 'mcq') {
    var chosen = Number(answer), ok = chosen === q.answerIndex;
    res = { ok: ok, mark: ok ? q.marks : 0, max: q.marks, chosen: chosen, codes: ok ? [] : GcseCore.asList(q.codes).slice(), points: [] };
  } else {
    var m = GcseCore.mark(q.rules, answer, q.marks);
    var codes2 = m.marks >= m.max ? [] : GcseCore.suggestFeedbackCodes({ type: 'short', topics: q.topics, codes: q.codes, command: q.command, marks: q.marks }, answer, m, J277);
    res = { ok: m.marks >= m.max, mark: m.marks, max: m.max, points: m.points, codes: GcseCore.asList(codes2) };
  }
  // Misconceptions shown by the pupil's own words go first, so the profile's needs list is precise.
  if (!res.ok && typeof GcseDiagnose !== 'undefined') {
    var seen = GcseDiagnose.diagnose(q, answer, res).misc.map(function (x) { return x.id; });
    if (seen.length) res.codes = seen.concat(res.codes.filter(function (id) { return seen.indexOf(id) === -1 && /^E/.test(id); }));
    res.misc = seen;
  }
  return res;
}

// ── H7 scaffolding ──────────────────────────────────────────────────────────
// Support levels (set by the teacher, suggested by the app): 0 none · 1 some help · 2 lots of help.
// Every question has a help ladder; more help is shown up front at higher levels, and it fades
// skill by skill: two right in a row with only the up-front help → one step less next time.
// A right answer that used help counts half towards mastery. Pupils can always ask for a hint.
var HW_SUPPORT = [{ id: 0, label: 'None', auto: 0 }, { id: 1, label: 'Some help', auto: 1 }, { id: 2, label: 'Lots of help', auto: 3 }];
function hwHashPick(id, n) { var h = 0; String(id).split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) >>> 0; }); return n ? h % n : 0; }
function hwReminderFor(q) {
  var t = (q.topics || [])[0] || '', sk = q.skill || '';
  if (q.hint) return q.hint;   // the teacher's own hint (bank sheet "Hint" column) comes first
  if (typeof GCSE_REMIND === 'undefined') return '';
  return GCSE_REMIND[t + '~' + sk] || GCSE_REMIND[t] || '';
}
// Gap-fill version of the mark scheme: key words become "v_______" (first letter kept).
function hwCloze(q) {
  var keys = {};
  try {
    GcseCore.parseRules(q.rules || '').points.forEach(function (p) {
      if (p.kind === 'keyword') p.groups.forEach(function (g) { g.forEach(function (alt) { alt.forEach(function (w) { if (w.length >= 3) keys[w] = true; }); }); });
      else (p.accept || []).forEach(function (a) { if (a.main && a.main.length >= 3) keys[a.main] = true; });
    });
  } catch (e) {}
  var lines = String(q.markScheme || '').replace(/\s*\(\d\)/g, '').split(/\n|;\s*/).map(function (l) { return l.trim(); }).filter(Boolean).slice(0, Math.max(1, q.marks || 1));
  var blanked = 0;
  var out = lines.map(function (line) {
    return line.replace(/[A-Za-z][A-Za-z'-]{2,}/g, function (w) {
      if (!keys[GcseCore.stem(w.toLowerCase())]) return w;
      blanked++;
      return w.charAt(0) + '<span class="tracking-widest text-gray-400">' + new Array(Math.min(w.length, 10)).join('_') + '</span>';
    });
  });
  return blanked ? out : null;
}
// Method without the answer, for number questions.
function hwMethodHint(q) {
  var t = (q.topics || [])[0] || '', sk = q.skill || '', qt = String(q.question || '');
  var bin = qt.match(/\b[01]{8}\b/g) || [];
  var head = '<tr>' + [128, 64, 32, 16, 8, 4, 2, 1].map(function (p) { return '<th class="px-1.5 font-normal text-gray-500">' + p + '</th>'; }).join('') + '</tr>';
  var cells = function (b) { return '<tr>' + b.split('').map(function (d) { return '<td class="px-1.5 text-center font-mono">' + d + '</td>'; }).join('') + '</tr>'; };
  if (t === '1.2.4a' && sk === 'b2d' && bin.length) return 'Put the place values over the bits, then add up the place values that have a 1:<table class="text-xs my-1">' + head + cells(bin[0]) + '</table>';
  if (t === '1.2.4a' && sk === 'd2b') { var n = (qt.match(/denary number (\d+)/i) || [])[1]; return 'Start at 128. Does it fit into ' + gEsc(n || 'the number') + '? If yes write 1 and take it away; if no write 0. Then try 64, 32 … down to 1.<table class="text-xs my-1">' + head + cells('________') + '</table>'; }
  if (t === '1.2.4b' && bin.length >= 2) return 'Line them up and add from the RIGHT, writing each carry above the next column:<pre class="font-mono text-xs my-1">  ' + bin[0] + '\n+ ' + bin[1] + '\n  ________</pre>';
  if (t === '1.2.4d' && bin.length) { var k = (qt.match(/(\d)[- ]place/) || [])[1] || '1', left = /left/i.test(qt); return 'Write ' + bin[0] + ', then move EVERY bit ' + k + ' place' + (k === '1' ? '' : 's') + ' to the ' + (left ? 'left' : 'right') + '. Fill the empty places with 0s.'; }
  if (t === '1.2.4c') {
    if (/hexadecimal number/i.test(qt)) return '(Left digit × 16) + right digit. Letters: A = 10, B = 11, C = 12, D = 13, E = 14, F = 15.';
    if (/denary number/i.test(qt)) return 'Divide by 16. The whole-number answer is the LEFT hex digit; the remainder is the RIGHT digit (10–15 become A–F).';
    if (bin.length) return 'Split into two nibbles: <span class="font-mono">' + bin[0].slice(0, 4) + ' ' + bin[0].slice(4) + '</span>. Convert each one using 8 4 2 1, then turn 10–15 into A–F.';
  }
  if (t === '1.2.3c') return 'Multiply the numbers that describe the file (e.g. width × height × colour depth, or sample rate × bit depth × seconds) to get BITS. ÷ 8 → bytes. ÷ 1000 → KB, ÷ 1000 again → MB.';
  if (/ASC\(/i.test(qt)) return 'Character codes are in alphabetical order: count on one at a time from the code you are given.';
  return '';
}
// Keep the keywords and layout of the model answer, blank out the rest: "for ___ to ___" / "print(___)".
function hwCodeSkeleton(model) {
  var KEEP = /^(for|while|do|until|if|elseif|else|endif|endwhile|next|switch|case|default|endswitch|function|procedure|endfunction|endprocedure|return|print|input|array|const|global)\b/i;
  return String(model || '').split('\n').map(function (line) {
    var ind = line.match(/^\s*/)[0], t = line.trim();
    if (!t) return line;
    var m;
    if (/^(else|endif|endwhile|endswitch|endfunction|endprocedure|do|default:?)$/i.test(t)) return line;
    if ((m = t.match(/^(for)\s+(\w+)\s*=.*\bto\b.*$/i))) return ind + 'for ' + m[2] + ' = ___ to ___';
    if ((m = t.match(/^next\s+(\w+)/i))) return ind + 'next ' + m[1];
    if ((m = t.match(/^(while|until|if|elseif|switch|case)\b/i))) return ind + m[1] + ' ___' + (/then\s*$/i.test(t) ? ' then' : '') + (/:\s*$/.test(t) ? ':' : '');
    if ((m = t.match(/^(function|procedure)\s+(\w+)\s*\(([^)]*)\)/i))) return ind + m[1] + ' ' + m[2] + '(' + m[3] + ')';
    if (/^return\b/i.test(t)) return ind + 'return ___';
    if ((m = t.match(/^(\w+(?:\[[^\]]*\])?)\s*=\s*(input|int|float)\s*\(/i))) return ind + m[1] + ' = ' + m[2] + '(___)';
    if ((m = t.match(/^(\w+(?:\[[^\]]*\])?)\s*=/))) return ind + m[1] + ' = ___';
    if (/^print\s*\(/i.test(t)) return ind + 'print(___)';
    return KEEP.test(t) ? ind + t.split(/\s+/)[0] + ' ___' : ind + '___';
  }).join('\n');
}
function hwSimilar(q) {
  var S = HW.session, list = (S && S.ctx.bank[hwKey(q.topics[0], q.skill || '')]) || [];
  var others = list.filter(function (r) { return r.id !== q.id && !(S.used || {})[r.id]; });
  if (!others.length) others = gcseStarterRows().filter(function (r) { return r.id !== q.id && r.topics[0] === q.topics[0] && (r.type === 'mcq' || r.type === 'short'); });
  if (!others.length) return null;
  others.sort(function (a, b) { return (a.type === q.type ? 0 : 1) - (b.type === q.type ? 0 : 1) || Math.abs(hwLevelOf(a) - hwLevelOf(q)) - Math.abs(hwLevelOf(b) - hwLevelOf(q)); });
  return others[0];
}
// The ladder for one question: [{ key, label, html, apply? }]
function hwScaffolds(q) {
  var steps = [];
  var frame = (typeof GCSE_FRAMES !== 'undefined' && GCSE_FRAMES[q.command]) || null;
  var what = q.type === 'mcq' ? 'Pick ONE answer. Read every option before you choose – cover the options and try to answer first.'
    : q.type === 'code' ? (frame ? frame.means : '') + ' Your program is run with test inputs – the more tests it passes, the more of the ' + q.marks + ' marks you get. Use the example in the question to check it first.'
    : q.type === 'table' ? 'Fill in every box. Work through the code one line at a time, writing each value as it changes. Each box right earns part of the ' + q.marks + ' marks.'
    : (frame ? frame.means : 'Answer exactly what the question asks.') + (q.marks > 1 ? ' It is worth ' + q.marks + ' marks, so make ' + q.marks + ' separate points.' : '');
  steps.push({ key: 'what', label: 'What the question wants', html: gEsc(what) });
  var rem = hwReminderFor(q);
  if (rem) steps.push({ key: 'remind', label: 'Remember', html: gEsc(rem) });
  if (q.type === 'mcq') {
    if ((q.options || []).length >= 4) steps.push({ key: 'fifty', label: 'Two wrong answers removed', html: 'Two of the wrong answers have been crossed out. Choose between the two that are left.', apply: function () {
      var ai = q.answerIndex, wrong = q.options.map(function (o, i) { return i; }).filter(function (i) { return i !== ai; });
      var keep = wrong[hwHashPick(q.id, wrong.length)];
      document.querySelectorAll('.hw-opt').forEach(function (b) { var i = Number(b.dataset.i); if (i !== ai && i !== keep) { b.disabled = true; b.classList.add('line-through', 'opacity-40'); } });
    } });
  } else if (q.type === 'code') {
    var skel = hwCodeSkeleton(q.model || '');
    if (skel && !q.starterCode) steps.push({ key: 'skeleton', label: 'The shape of an answer', html: 'Fill in each ___ (one way to do it):<pre class="mt-1 text-xs font-mono whitespace-pre-wrap bg-white rounded p-1">' + gEsc(skel) + '</pre>' });
    else if (q.starterCode) steps.push({ key: 'tests', label: 'Check it like a computer', html: 'Trace the code with the example in the question, line by line. Where does it first do something different from what it should?' });
  } else if (q.type === 'table') {
    steps.push({ key: 'firstrow', label: 'First row done for you', html: 'The first row of boxes has been filled in. Use it to see the pattern, then carry on line by line.', apply: function () {
      var tb = q.table, ans = q.answers || [];
      for (var i = 0; i < tb.blanks.length; i++) {
        if (!tb.blanks[i].some(Boolean)) continue;
        tb.blanks[i].forEach(function (b, j) { if (!b) return; var inp = document.querySelector('.hw-cell[data-r="' + i + '"][data-c="' + j + '"]'); if (inp) { inp.value = String(ans[i][j]).split('|')[0]; inp.readOnly = true; inp.classList.add('bg-blue-50'); } });
        break;
      }
    } });
  } else {
    var method = hwMethodHint(q);
    if (method) steps.push({ key: 'method', label: 'How to do it', html: method });
    else {
      var cloze = hwCloze(q);
      if (cloze) steps.push({ key: 'cloze', label: 'Fill the gaps', html: 'A good answer looks like this – work out the missing words:<ul class="list-disc ml-5 mt-1">' + cloze.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ul>' });
      else if (frame && frame.starter) steps.push({ key: 'starter', label: 'Sentence starter', html: 'Start like this: <i>' + gEsc(frame.starter) + '</i>' });
    }
  }
  var ex = hwSimilar(q);
  if (ex) {
    var exAns = ex.type === 'mcq' ? (function () { var ai = ex.answer ? ex.answer.charCodeAt(0) - 65 : ex.answerIndex; var wi = ex.options.map(function (o, i) { return i; }).filter(function (i) { return i !== ai && (ex.why || [])[i]; })[0]; return 'Answer: <b>' + gEsc(ex.options[ai]) + '</b>' + (wi != null ? '<div class="text-xs text-gray-600">Not “' + gEsc(ex.options[wi]) + '”: ' + gEsc(ex.why[wi]) + '</div>' : ''); })()
      : ex.type === 'code' ? 'One way to write it:<pre class="mt-1 text-xs font-mono whitespace-pre-wrap bg-white rounded p-1">' + gEsc(ex.model || '') + '</pre>'
      : ex.type === 'table' ? 'Answers:<pre class="mt-1 text-xs font-mono whitespace-pre-wrap bg-white rounded p-1">' + gEsc(String(ex.markScheme || '').split('\n').slice(1).join('\n')) + '</pre>'
      : 'A full-mark answer: <div class="whitespace-pre-wrap">' + gEsc(String(ex.markScheme || '').replace(/\s*\(\d\)/g, '')) + '</div>';
    steps.push({ key: 'example', label: 'Worked example (a similar question)', html: '<div class="whitespace-pre-wrap italic' + (/\n/.test(ex.question) ? ' font-mono text-xs' : '') + '">' + gEsc(ex.question) + '</div><div class="mt-1">' + exAns + '</div>' });
  }
  return steps;
}
function hwShowStep(i) {
  var S = HW.session, H = S.help, st = H.steps[i]; if (!st) return;
  var box = gEl('hw-help-steps'); if (!box) return;
  var div = document.createElement('div');
  div.className = 'hw-step rounded border border-blue-200 bg-blue-50 text-blue-950 p-2 text-sm';
  div.dataset.key = st.key;
  div.innerHTML = '<div class="text-xs font-semibold text-blue-800">💡 ' + gEsc(st.label) + '</div><div class="mt-0.5">' + st.html + '</div>';
  box.appendChild(div);
  if (st.apply) try { st.apply(); } catch (e) {}
  H.shown = i + 1;
  var btn = gEl('hw-hint');
  if (btn) { var left = H.steps.length - H.shown; btn.textContent = left ? '💡 ' + (H.shown ? 'More help' : 'Need a hint?') + ' (' + left + ' left)' : '💡 No more hints'; btn.disabled = !left; }
}
function hwAutoHelp(key) {
  var S = HW.session, lvl = HW_SUPPORT[S.support || 0] || HW_SUPPORT[0];
  var f = ((S.fade || {})[key] || {}).f || 0;
  return Math.max(0, lvl.auto - f);
}
// Two right in a row with only the up-front help → one step less next time; wrong → one step more.
function hwUpdateFade(prev, ok, usedExtra) {
  var x = { f: (prev && prev.f) || 0, s: (prev && prev.s) || 0 };
  if (ok && !usedExtra) { x.s++; if (x.s >= 2) { x.f = Math.min(x.f + 1, 3); x.s = 0; } }
  else if (!ok) { x.s = 0; x.f = Math.max(0, x.f - 1); }
  else x.s = 0;
  return x;
}
// Reading support (all pupils): read aloud + easier reading (bigger, spaced text on a cream background).
function hwEasyRead(on) {
  if (!gEl('hw-easy-style')) { var st = document.createElement('style'); st.id = 'hw-easy-style'; st.textContent = '#modal-hw .hw-easy{font-size:1.08rem;line-height:1.85;letter-spacing:.03em;word-spacing:.12em;background:#fbf5e6}#modal-hw .hw-easy .font-mono{letter-spacing:0}'; document.head.appendChild(st); }
  var b = gEl('hw-body'); if (b) b.classList.toggle('hw-easy', !!on);
  try { localStorage.setItem('hwEasyRead', on ? '1' : ''); } catch (e) {}
}
function hwEasyReadOn() { try { return localStorage.getItem('hwEasyRead') === '1'; } catch (e) { return false; } }
function hwSpeak(text) {
  try {
    if (!window.speechSynthesis) return false;
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text); u.lang = 'en-GB'; u.rate = 0.95;
    window.speechSynthesis.speak(u);
    return true;
  } catch (e) { return false; }
}
// Suggested support level from the last 3 homeworks (right first time + how often help was needed).
function hwSuggestSupport(hw, current) {
  var ids = Object.keys(hw || {}).filter(function (id) { return hw[id] && hw[id].answers; }).sort(function (a, b) { return (hw[b].startedAt || 0) - (hw[a].startedAt || 0); }).slice(0, 3);
  var first = [];
  ids.forEach(function (id) { Object.keys(hw[id].answers).forEach(function (n) { var a = hw[id].answers[n]; if (a && !a.retry) first.push(a); }); });
  if (first.length < 5) return { level: null, acc: null, help: null, n: first.length };
  var acc = first.filter(function (a) { return a.ok; }).length / first.length;
  var help = first.filter(function (a) { return a.h; }).length / first.length;
  var lvl = acc < 0.4 ? 2 : (acc < 0.6 || help > 0.5) ? 1 : (acc >= 0.75 && help < 0.2) ? 0 : (current || 0);
  return { level: lvl, acc: Math.round(acc * 100), help: Math.round(help * 100), n: first.length };
}
function hwSupportCardHtml(H) {
  var rows = H.codes.map(function (c) {
    var cur = Number((H.support || {})[c]) || 0, sg = hwSuggestSupport((H.progs[c] || {}).hw, cur);
    return { code: c, name: gName(c) || c, cur: cur, sg: sg };
  }).sort(function (a, b) { return a.name.localeCompare(b.name); });
  var pending = rows.filter(function (r) { return r.sg.level != null && r.sg.level !== r.cur; });
  return '<details class="hw-support border border-gray-200 rounded-lg mb-4"' + (pending.length ? ' open' : '') + '><summary class="cursor-pointer px-3 py-2 text-sm"><b>Support levels</b> <span class="text-xs text-gray-500">– how much help each pupil gets in homework' + (pending.length ? ' · <span class="text-amber-700">' + pending.length + ' suggestion' + (pending.length === 1 ? '' : 's') + '</span>' : '') + '</span></summary><div class="px-3 pb-3">' +
    '<p class="text-xs text-gray-600 mb-2"><b>None</b>: hints only when asked. <b>Some help</b>: what the question wants is shown up front. <b>Lots of help</b>: what it wants, a reminder and a structure (gap-fill, method or two options removed) up front, and shorter homework (12 max). Help fades skill by skill after two right in a row. Suggestions come from the last 3 homeworks – nothing changes until you choose.</p>' +
    (pending.length ? '<button type="button" id="hw-support-all" class="text-xs px-2 py-1 rounded border border-amber-300 bg-amber-50 text-amber-900 mb-2">Use all ' + pending.length + ' suggestions</button>' : '') +
    '<div class="overflow-x-auto"><table class="w-full text-xs"><tr class="bg-gray-50 text-left"><th class="p-1">Pupil</th><th class="p-1">Support</th><th class="p-1 text-center">Right first time</th><th class="p-1 text-center">Needed help</th><th class="p-1">Suggestion</th></tr>' +
    rows.map(function (r) {
      return '<tr class="hw-sup-row border-t" data-code="' + gEsc(r.code) + '"><td class="p-1">' + gEsc(r.name) + '</td><td class="p-1"><select class="hw-sup-sel border border-gray-300 rounded px-1 py-0.5" data-code="' + gEsc(r.code) + '">' + HW_SUPPORT.map(function (s) { return '<option value="' + s.id + '"' + (s.id === r.cur ? ' selected' : '') + '>' + s.label + '</option>'; }).join('') + '</select></td>' +
        '<td class="p-1 text-center">' + (r.sg.acc == null ? '–' : r.sg.acc + '%') + '</td><td class="p-1 text-center">' + (r.sg.help == null ? '–' : r.sg.help + '%') + '</td>' +
        '<td class="p-1">' + (r.sg.level != null && r.sg.level !== r.cur ? '<button type="button" class="hw-sup-use underline text-amber-800" data-code="' + gEsc(r.code) + '" data-level="' + r.sg.level + '">' + HW_SUPPORT[r.sg.level].label + ' – use</button>' : '<span class="text-gray-400">' + (r.sg.level == null ? 'not enough homework yet' : 'keep') + '</span>') + '</td></tr>';
    }).join('') + '</table></div></div></details>';
}
async function hwSetSupport(className, code, level) {
  await state.db.ref('classes/' + className + '/hwSupport/' + code).set(Number(level) ? Number(level) : null);
}
// Independence: share of first-try answers given without help, per homework.
function hwIndependenceHtml(hw, set, setIds, level) {
  var rows = setIds.filter(function (id) { return hw[id] && hw[id].answers; }).map(function (id) {
    var first = Object.keys(hw[id].answers).map(function (n) { return hw[id].answers[n]; }).filter(function (a) { return a && !a.retry; });
    return { title: set[id].title, pct: first.length ? Math.round(first.filter(function (a) { return !a.h; }).length / first.length * 100) : null, helped: first.filter(function (a) { return a.h; }).length, n: first.length };
  });
  return '<div class="text-xs text-gray-600 mb-2">Support level: <b>' + gEsc((HW_SUPPORT[level || 0] || HW_SUPPORT[0]).label) + '</b> · questions answered without any help:</div>' + (rows.length ? rows.map(function (x) {
    return '<div class="hw-indep flex items-center gap-2 text-sm mb-1"><span class="w-40 truncate">' + gEsc(x.title) + '</span><div class="flex-1 h-2.5 bg-gray-100 rounded"><div class="h-2.5 rounded bg-blue-600" style="width:' + (x.pct || 0) + '%"></div></div><span class="w-16 text-right text-xs">' + (x.pct == null ? '–' : x.pct + '%') + '</span></div>';
  }).join('') : '<p class="text-sm text-gray-500">No homework answers yet.</p>');
}

// ── H3 pupil ────────────────────────────────────────────────────────────────
async function hwStudentContext() {
  var uid = state.uid, cls = state.className;
  var r = await Promise.all([
    state.db.ref('classes/' + cls + '/homework').get().then(function (s) { return s.val() || {}; }).catch(function () { return {}; }),
    state.db.ref('classes/' + cls + '/settings/covered').get().then(function (s) { return s.val() || {}; }).catch(function () { return {}; }),
    state.db.ref('progress/' + uid).get().then(function (s) { return s.val() || {}; }).catch(function () { return {}; }),
    state.db.ref('classes/' + cls + '/hwSupport/' + uid).get().then(function (s) { return Number(s.val()) || 0; }).catch(function () { return 0; })
  ]);
  var prog = r[2];
  var assessments = prog.assessments || {};
  var grade = null, latest = 0;
  Object.keys(assessments).forEach(function (id) { var a = assessments[id]; if (a && a.type === 'paper' && a.releasedAt && a.grade != null && (a.completedAt || 0) >= latest) { latest = a.completedAt || 0; grade = Number(a.grade); } });
  var topicPct = typeof plcScoresFromAssessments === 'function' ? plcScoresFromAssessments(assessments) : {};
  var covered = Object.keys(r[1]).map(gFromTopicKey);
  var recent = Object.keys(r[1]).sort(function (a, b) { return ((r[1][b] || {}).at || 0) - ((r[1][a] || {}).at || 0); }).map(gFromTopicKey);
  var plcOver = {};
  Object.keys(prog.plc || {}).forEach(function (k) { var tc = gFromTopicKey(k), sc = topicPct[tc]; if (prog.plc[k] && prog.plc[k].r === 'green' && sc && sc.pct < 50) plcOver[tc] = true; });
  return { homework: r[0], covered: covered, recent: recent, mastery: prog.mastery || {}, hw: prog.hw || {}, grade: grade, topicPct: topicPct,
    misc: prog.gcseMisconceptions || {}, plc: plcOver, support: hwClamp(r[3], 0, 2), fade: prog.hwFade || {} };
}
function hwOpenList(ctx) {
  var now = Date.now();
  return Object.keys(ctx.homework).map(function (id) { return Object.assign({ id: id }, ctx.homework[id]); })
    .filter(function (h) { return h.setAt <= now && !(ctx.hw[h.id] && ctx.hw[h.id].doneAt); })
    .sort(function (a, b) { return a.dueAt - b.dueAt; });
}
async function hwStudentBanner() {
  var old = gEl('hw-banner'); if (old) old.remove();
  if (!state.uid || !state.className || state.isTeacher || state.isAdmin) return;
  var ctx; try { ctx = await hwStudentContext(); } catch (e) { return; }
  var open = hwOpenList(ctx);
  if (!open.length) return;
  var h = open[0], mine = ctx.hw[h.id] || {};
  var host = gEl('app-content'); if (!host) return;
  var b = document.createElement('div');
  b.id = 'hw-banner';
  var late = h.dueAt < Date.now();
  b.className = 'mx-auto max-w-5xl mt-2 mb-1 px-4 py-2 rounded-lg border ' + (late ? 'border-red-300 bg-red-50 text-red-900' : 'border-blue-300 bg-blue-50 text-blue-900') + ' flex flex-wrap items-center gap-3 text-sm';
  b.innerHTML = '<span class="text-lg">📚</span><span><b>Homework</b> ' + (late ? '<b>overdue</b> (was due ' : 'due ') + gEsc(hwFmtDate(h.dueAt)) + (late ? ')' : '') + ' · ' + (mine.cleared || 0) + ' / ' + (h.size || HW.size) + ' done' + (open.length > 1 ? ' · ' + (open.length - 1) + ' more' : '') + '</span>' +
    '<button type="button" id="hw-banner-go" class="jhncc-primary px-3 py-1 rounded font-semibold text-sm ml-auto">' + (mine.startedAt ? 'Continue' : 'Start') + '</button>';
  host.insertBefore(b, host.firstChild);
  gEl('hw-banner-go').onclick = function () { hwOpen(h.id); };
}
function hwModal() {
  var m = gEl('modal-hw');
  if (!m) {
    m = document.createElement('div');
    m.id = 'modal-hw';
    m.className = 'fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto';
    m.innerHTML = '<div class="bg-white rounded-xl shadow-xl w-full max-w-2xl mt-6"><div class="flex justify-between items-center px-5 py-3 border-b"><div><h2 class="font-bold text-lg">Homework</h2><div id="hw-sub" class="text-xs text-gray-500"></div></div><button type="button" id="hw-close" class="text-gray-400 text-xl">✕</button></div>' +
      '<div class="px-5 pt-3"><div class="h-2 bg-gray-100 rounded"><div id="hw-bar" class="h-2 rounded bg-[rgb(176,28,35)]" style="width:0%"></div></div></div><div id="hw-body" class="p-5"></div></div>';
    document.body.appendChild(m);
  }
  m.classList.remove('hidden');
  gEl('hw-close').onclick = function () { hwStopTracking(); m.classList.add('hidden'); hwStudentBanner(); };
  return gEl('hw-body');
}
async function hwOpen(hwId) {
  var body = hwModal();
  body.innerHTML = '<p class="text-gray-400 text-sm">Building your homework…</p>';
  var ctx = await hwStudentContext();
  var meta = ctx.homework[hwId]; if (!meta) { body.innerHTML = '<p class="text-sm text-gray-500">This homework is no longer set.</p>'; return; }
  var bank = hwBankByKey();
  ctx.bank = bank; ctx.pins = GcseCore.asList(meta.pins); ctx.excludes = GcseCore.asList(meta.excludes);
  var rec = ctx.hw[hwId];
  var ref = state.db.ref('progress/' + state.uid + '/hw/' + hwId);
  if (!rec || !rec.queue) {
    // Lots of help → a shorter homework (at most 12).
    var plan = hwBuildPlan(ctx, ctx.support >= 2 ? Math.min(meta.size || HW.size, 12) : meta.size || HW.size);
    if (!plan.length) { body.innerHTML = '<p class="text-sm text-gray-500">There are no questions for the topics you have been taught yet. Ask your teacher.</p>'; return; }
    rec = { startedAt: Date.now(), size: plan.length, queue: plan.map(function (k, i) { return { k: k, s: i, r: 0 }; }), pos: 0, cleared: 0, ms: 0, slots: {} };
    await ref.set(rec);
  }
  rec.queue = GcseCore.asList(rec.queue); rec.slots = rec.slots || {};
  var seen = {};
  Object.keys(ctx.hw).forEach(function (id) { Object.keys((ctx.hw[id] || {}).answers || {}).forEach(function (n) { var a = ctx.hw[id].answers[n]; if (a && a.qid) seen[a.qid] = true; }); });
  HW.session = { id: hwId, meta: meta, rec: rec, ctx: ctx, ref: ref, seen: seen, used: {}, streak: {}, bump: {}, support: ctx.support || 0, fade: ctx.fade || {} };
  Object.keys(rec.answers || {}).forEach(function (n) { var a = rec.answers[n]; if (a && a.qid) HW.session.used[a.qid] = true; });
  gEl('hw-sub').textContent = 'Due ' + hwFmtDate(meta.dueAt) + ' · questions picked for you';
  hwNext();
}
function hwProgressBar() {
  var S = HW.session; if (!S) return;
  var pct = Math.round((S.rec.cleared || 0) / (S.rec.size || 1) * 100);
  var bar = gEl('hw-bar'); if (bar) bar.style.width = pct + '%';
}
function hwNext() {
  var S = HW.session, rec = S.rec, body = gEl('hw-body');
  hwProgressBar();
  while (rec.pos < rec.queue.length && rec.slots[rec.queue[rec.pos].s] && rec.slots[rec.queue[rec.pos].s].cleared) rec.pos++;
  if (rec.pos >= rec.queue.length) { hwFinish(); return; }
  var item = rec.queue[rec.pos];
  var list = S.ctx.bank[item.k] || [];
  var m = S.ctx.mastery[item.k];
  var t = m && m.t != null ? m.t : hwSeedTheta(item.k, S.ctx.grade, S.ctx.topicPct);
  var q = hwPickQuestion(list, hwTargetLevel(t, S.bump[item.k] || 0), S.used, S.seen);
  if (!q) { rec.pos++; hwNext(); return; }
  S.q = q; S.item = item; S.used[q.id] = true;
  var code = String(q.question).indexOf('\n') !== -1;
  var num = (rec.cleared || 0) + 1;
  S.help = { steps: hwScaffolds(q), shown: 0, auto: 0 };
  body.innerHTML = '<div class="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-1"><span>Question ' + Math.min(num, rec.size) + ' of ' + rec.size + ' · ' + gEsc(hwKeyLabel(item.k)) + ' · ' + q.marks + ' mark' + (q.marks === 1 ? '' : 's') + (item.r ? ' · <span class="text-amber-700">try again</span>' : '') + '</span>' +
    '<span class="ml-auto flex gap-1"><button type="button" id="hw-read" class="px-2 py-0.5 rounded border border-gray-300 hover:bg-gray-50" title="Read the question aloud">🔊 Read aloud</button><button type="button" id="hw-easy" class="px-2 py-0.5 rounded border border-gray-300 hover:bg-gray-50" title="Bigger, more spaced text">Aa Easier reading</button></span></div>' +
    '<div id="hw-q" class="font-semibold text-gray-800 mb-3 whitespace-pre-wrap' + (code ? ' font-mono text-sm bg-gray-50 rounded p-2' : '') + '">' + gEsc(q.question) + '</div>' +
    '<div id="hw-help" class="mb-3"><div id="hw-help-steps" class="space-y-2"></div>' + (S.help.steps.length ? '<button type="button" id="hw-hint" class="mt-2 text-xs px-2 py-1 rounded border border-blue-300 text-blue-800 bg-white hover:bg-blue-50">💡 Need a hint? (' + S.help.steps.length + ' left)</button>' : '') + '</div>' +
    (q.type === 'mcq' ? '<div class="grid gap-2">' + q.options.map(function (o, i) { return '<button type="button" class="hw-opt text-left px-3 py-2 rounded border border-gray-300 hover:bg-gray-50 whitespace-pre-wrap" data-i="' + i + '">' + String.fromCharCode(65 + i) + '. ' + gEsc(o) + '</button>'; }).join('') + '</div>'
      : q.type === 'code' ? hwCodeInputHtml(q)
      : q.type === 'table' ? hwTableInputHtml(q) + '<button type="button" id="hw-submit" class="jhncc-primary mt-2 px-4 py-1.5 rounded text-sm font-semibold">Check</button>'
      : '<textarea id="hw-answer" rows="3" class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="Type your answer"></textarea><button type="button" id="hw-submit" class="jhncc-primary mt-2 px-4 py-1.5 rounded text-sm font-semibold">Check</button>') +
    '<div id="hw-result" class="mt-3"></div>';
  hwEasyRead(hwEasyReadOn());
  gEl('hw-easy').onclick = function () { hwEasyRead(!hwEasyReadOn()); };
  gEl('hw-read').onclick = function () { hwSpeak(q.question.replace(/\n/g, '. ') + (q.type === 'mcq' ? '. ' + q.options.map(function (o, i) { return String.fromCharCode(65 + i) + ': ' + o; }).join('. ') : '')); };
  // Help shown up front for this pupil's support level (less as they get things right on this skill).
  var autoN = Math.min(hwAutoHelp(item.k), S.help.steps.length);
  for (var i = 0; i < autoN; i++) hwShowStep(i);
  S.help.auto = S.help.shown;
  if (gEl('hw-hint')) gEl('hw-hint').onclick = function () { hwShowStep(S.help.shown); };
  hwStartTracking();
  if (q.type === 'mcq') body.querySelectorAll('.hw-opt').forEach(function (b) { b.onclick = function () { body.querySelectorAll('.hw-opt').forEach(function (x) { x.disabled = true; }); hwSubmit(b.dataset.i); }; });
  else if (q.type === 'code') hwBindCodeInput(q);
  else if (q.type === 'table') gEl('hw-submit').onclick = function () {
    var cells = hwReadTable(); if (!cells.some(function (row) { return row.some(function (c) { return c; }); })) return;
    gEl('hw-submit').disabled = true; document.querySelectorAll('.hw-cell').forEach(function (x) { x.disabled = true; }); hwSubmit(JSON.stringify(cells));
  };
  else gEl('hw-submit').onclick = function () { var a = gEl('hw-answer').value.trim(); if (!a) return; gEl('hw-submit').disabled = true; gEl('hw-answer').disabled = true; hwSubmit(a); };
}
// ── Code and table questions ────────────────────────────────────────────────
function hwCodeInputHtml(q) {
  return '<div class="text-xs text-gray-500 mb-1">Write your answer in Python or in OCR Exam Reference Language – both are accepted. Your program is checked by running it with test inputs.</div>' +
    '<textarea id="hw-answer" rows="' + Math.max(8, String(q.starterCode || '').split('\n').length + 2) + '" spellcheck="false" class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono" placeholder="Write your code here">' + gEsc(q.starterCode || '') + '</textarea>' +
    '<div class="flex flex-wrap items-center gap-2 mt-2"><button type="button" id="hw-submit" class="jhncc-primary px-4 py-1.5 rounded text-sm font-semibold">Check</button>' +
    '<span class="text-xs text-gray-500 ml-2">Try it first:</span><input id="hw-try-in" class="border border-gray-300 rounded px-2 py-1 text-xs w-40" placeholder="inputs, e.g. 3, 4"><button type="button" id="hw-try" class="px-2 py-1 rounded border border-gray-300 text-xs">▶ Run</button></div>' +
    '<pre id="hw-try-out" class="hidden mt-2 text-xs bg-gray-900 text-green-200 rounded p-2 whitespace-pre-wrap"></pre>';
}
function hwBindCodeInput(q) {
  var ta = gEl('hw-answer');
  ta.onkeydown = function (e) {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    var s = ta.selectionStart, en = ta.selectionEnd;
    ta.value = ta.value.slice(0, s) + '    ' + ta.value.slice(en); ta.selectionStart = ta.selectionEnd = s + 4;
  };
  gEl('hw-try').onclick = async function () {
    var out = gEl('hw-try-out'); out.classList.remove('hidden'); out.textContent = 'Running…';
    var ins = String(gEl('hw-try-in').value || '').split(',').map(function (x) { return x.trim(); }).filter(function (x) { return x !== ''; });
    var r = await GcseCode.run(ta.value, ins);
    out.textContent = (r.output || '') + (r.error ? (r.output ? '\n' : '') + (r.timedOut ? 'Stopped: the program took too long – does a loop never end?' : r.error) : '') || '(no output)';
  };
  gEl('hw-submit').onclick = function () {
    var a = ta.value; if (!a.trim() || a === (q.starterCode || '')) return;
    gEl('hw-submit').disabled = true; ta.disabled = true; gEl('hw-submit').textContent = 'Testing…'; hwSubmit(a);
  };
}
function hwTableInputHtml(q, opts) {
  opts = opts || {};
  var tb = q.table || { head: [], rows: [], blanks: [] };
  return '<div class="overflow-x-auto"><table class="hw-table text-sm border-collapse"><tr>' + tb.head.map(function (h) { return '<th class="border border-gray-300 bg-gray-50 px-2 py-1 font-semibold">' + gEsc(h) + '</th>'; }).join('') + '</tr>' +
    tb.rows.map(function (row, i) {
      return '<tr>' + row.map(function (c, j) {
        if (!(tb.blanks[i] || [])[j]) return '<td class="border border-gray-300 px-2 py-1 text-center font-mono">' + gEsc(c) + '</td>';
        var val = opts.values ? ((opts.values[i] || [])[j] || '') : '';
        var mark = opts.marked ? opts.marked[i][j] : null;
        return '<td class="border border-gray-300 p-0.5' + (mark === true ? ' bg-green-50' : mark === false ? ' bg-red-50' : '') + '">' +
          (opts.marked ? '<div class="px-1 font-mono text-center">' + (mark ? '✓ ' : '✗ ') + gEsc(val || '–') + (mark === false ? ' <span class="text-green-800">→ ' + gEsc(String(((q.answers || [])[i] || [])[j]).split('|')[0]) + '</span>' : '') + '</div>'
            : '<input class="hw-cell w-24 border border-blue-300 rounded px-1 py-0.5 text-center font-mono" data-r="' + i + '" data-c="' + j + '" autocomplete="off">') + '</td>';
      }).join('') + '</tr>';
    }).join('') + '</table></div>';
}
function hwReadTable() {
  var tb = (HW.session.q && HW.session.q.table) || { rows: [] };
  var cells = tb.rows.map(function (row) { return row.map(function () { return ''; }); });
  document.querySelectorAll('.hw-cell').forEach(function (inp) { cells[Number(inp.dataset.r)][Number(inp.dataset.c)] = inp.value.trim(); });
  return cells;
}
// Marks any question type (code questions run their tests, so this is async).
async function hwMarkAny(q, answer) {
  if (q.type === 'code') {
    var r = await GcseCode.mark(q, answer);
    var codes = [];
    (r.lines || []).forEach(function (l) {
      if (/never finished|never stops/.test(l)) codes.push('I2');
      if (/mixed text and numbers/.test(l)) codes.push('Q9');
      if (/position that does not exist/.test(l)) codes.push('Q5');
      if (/one time too|starts one too late/.test(l)) codes.push('I1');
    });
    if (!codes.length && r.marks < r.max) codes = GcseCore.asList(q.codes).slice();
    return { ok: r.max > 0 && r.marks >= r.max, mark: r.marks, max: r.max, code: r, codes: codes, points: [] };
  }
  if (q.type === 'table') {
    var t = GcseCore.markTable(q, answer);
    return { ok: t.marks >= t.max, mark: t.marks, max: t.max, table: t, codes: t.marks >= t.max ? [] : GcseCore.asList(q.codes).slice(), points: [] };
  }
  return hwMarkAnswer(q, answer);
}
async function hwSubmit(answer) {
  var S = HW.session, q = S.q, item = S.item, rec = S.rec, now = Date.now();
  var track = hwStopTracking();
  var ms = now - track.shownAt;
  var minMs = HW.minMs[q.type] != null ? HW.minMs[q.type] : 3000;
  if (ms < minMs) hwLogEvent('fast', { ms: ms }, track);
  var independent = !track.flags;
  var res = await hwMarkAny(q, answer);
  // Mastery only changes for answers that look independent (pupils are not told).
  var key = item.k, m0 = S.ctx.mastery[key];
  var level = hwLevelOf(q);
  var help = S.help || { shown: 0, auto: 0 };
  var helped = help.shown > 0;
  // Help fades skill by skill (visible to the pupil – unlike the activity log).
  S.fade[key] = hwUpdateFade(S.fade[key], res.ok, help.shown > help.auto);
  state.db.ref('progress/' + state.uid + '/hwFade/' + key).set(S.fade[key]).catch(function () {});
  if (independent) {
    var base = m0 && m0.t != null ? m0 : { t: hwSeedTheta(key, S.ctx.grade, S.ctx.topicPct), t0: hwSeedTheta(key, S.ctx.grade, S.ctx.topicPct) };
    var m1 = hwUpdateMastery(base, level, res.ok ? (helped ? 0.5 : true) : false, now);
    if (m1.t0 == null) m1.t0 = base.t;
    S.ctx.mastery[key] = m1;
    state.db.ref('progress/' + state.uid + '/mastery/' + key).set(m1).catch(function () {});
  }
  // Streak → step up a level after two right in a row; wrong → step back.
  if (res.ok) { S.streak[key] = (S.streak[key] || 0) + 1; if (S.streak[key] % 2 === 0) S.bump[key] = (S.bump[key] || 0) + 1; }
  else { S.streak[key] = 0; S.bump[key] = Math.min(0, (S.bump[key] || 0) - 1); }
  var n = Object.keys(rec.answers || {}).length;
  var upd = {};
  upd['answers/' + n] = { qid: q.id, k: key, lvl: level, ok: res.ok, mk: res.mark, mx: res.max, ms: ms, at: now, retry: item.r || 0, codes: res.codes && res.codes.length ? res.codes : null, h: help.shown || null, ha: help.auto || null };
  rec.answers = rec.answers || {}; rec.answers[n] = upd['answers/' + n];
  rec.ms = (rec.ms || 0) + ms; upd.ms = rec.ms;
  if (res.ok) { rec.slots[item.s] = { cleared: true }; rec.cleared = (rec.cleared || 0) + 1; upd['slots/' + item.s] = { cleared: true }; upd.cleared = rec.cleared; }
  else if ((item.r || 0) < HW.retries) {
    var again = { k: key, s: item.s, r: (item.r || 0) + 1 };
    rec.queue.splice(Math.min(rec.pos + 4, rec.queue.length), 0, again); upd.queue = rec.queue;
  } else { rec.slots[item.s] = { cleared: true, gaveUp: true }; rec.cleared = (rec.cleared || 0) + 1; upd['slots/' + item.s] = rec.slots[item.s]; upd.cleared = rec.cleared; }
  rec.pos++; upd.pos = rec.pos;
  S.ref.update(upd).catch(function () {});
  if (typeof gcseRecordQuizAttempt === 'function' && independent && (q.type === 'mcq' || q.type === 'short')) { try { gcseRecordQuizAttempt({ gcseQid: q.id, gcseTopics: q.topics, q: q.question, gcseCodes: res.codes }, q.type === 'mcq' ? q.options[Number(answer)] : answer, { marks: res.mark, max: res.max }, 'practice'); } catch (e) {} }
  if (gEl('hw-hint')) gEl('hw-hint').disabled = true;
  if (gEl('hw-submit')) gEl('hw-submit').textContent = 'Checked';
  if (gEl('hw-try')) gEl('hw-try').disabled = true;
  gEl('hw-result').innerHTML = hwFeedbackHtml(q, q.type === 'mcq' ? '' : answer, res) + (res.ok && helped ? '<div class="text-xs text-blue-800 mt-1">You used ' + help.shown + ' hint' + (help.shown === 1 ? '' : 's') + ' – next time try with one fewer.</div>' : '') + '<button type="button" id="hw-next" class="mt-3 px-4 py-1.5 rounded border border-gray-300 text-sm font-semibold">Next →</button>';
  hwProgressBar();
  gEl('hw-next').onclick = hwNext;
}
async function hwFinish() {
  var S = HW.session, body = gEl('hw-body');
  if (!S.rec.doneAt) { S.rec.doneAt = Date.now(); await S.ref.update({ doneAt: S.rec.doneAt }).catch(function () {}); }
  var answers = Object.keys(S.rec.answers || {}).map(function (n) { return S.rec.answers[n]; });
  var first = answers.filter(function (a) { return !a.retry; });
  var right = first.filter(function (a) { return a.ok; }).length;
  body.innerHTML = '<div class="text-center py-6"><div class="text-4xl mb-2">🎉</div><p class="font-bold text-lg">Homework complete</p><p class="text-sm text-gray-600 mt-1">' + right + ' of ' + first.length + ' right first time · ' + Math.round((S.rec.ms || 0) / 60000) + ' minutes</p></div>';
  hwProgressBar();
}

// Silent activity tracking (only while a homework question is on screen; never shown to pupils).
function hwStartTracking() {
  hwStopTracking();
  var T = HW.track = { shownAt: Date.now(), flags: 0, hiddenAt: null, blurAt: null, handlers: [] };
  var on = function (target, ev, fn) { target.addEventListener(ev, fn, true); T.handlers.push([target, ev, fn]); };
  on(document, 'visibilitychange', function () {
    if (document.hidden) T.hiddenAt = Date.now();
    else if (T.hiddenAt) { var away = Date.now() - T.hiddenAt; if (away >= HW.minAwayMs) hwLogEvent('tab', { ms: away }, T); T.hiddenAt = null; }
  });
  // Window switches shorter than a second are ignored (focus flickers, notifications).
  on(window, 'blur', function () { if (!document.hidden) T.blurAt = Date.now(); });
  on(window, 'focus', function () { if (T.blurAt && !T.hiddenAt && Date.now() - T.blurAt >= HW.minAwayMs) hwLogEvent('window', { ms: Date.now() - T.blurAt }, T); T.blurAt = null; });
  on(document, 'paste', function (e) { var txt = (e.clipboardData && e.clipboardData.getData('text')) || ''; hwLogEvent('paste', { len: txt.length }, T); });
  on(document, 'copy', function () { hwLogEvent('copy', {}, T); });
  var lastLen = 0;
  on(document, 'input', function (e) {
    if (!e.target || e.target.id !== 'hw-answer') return;
    var len = e.target.value.length, jump = len - lastLen; lastLen = len;
    if (jump >= 15 && e.inputType !== 'insertFromPaste') hwLogEvent('burst', { len: jump }, T);
  });
}
function hwStopTracking() {
  var T = HW.track; HW.track = null;
  if (!T) return { shownAt: Date.now(), flags: 0 };
  T.handlers.forEach(function (h) { h[0].removeEventListener(h[1], h[2], true); });
  if (T.hiddenAt) hwLogEvent('tab', { ms: Date.now() - T.hiddenAt }, T);
  return T;
}
function hwLogEvent(type, extra, T) {
  var S = HW.session; if (!S || !S.q) return;
  if (T) T.flags = (T.flags || 0) + 1;
  var entry = Object.assign({ ev: type, q: (S.rec.answers ? Object.keys(S.rec.answers).length : 0) + 1, qid: S.q.id, at: Date.now() }, extra || {});
  try { state.db.ref('gcse/hwLog/' + S.id + '/' + state.uid).push(entry).catch(function () {}); } catch (e) {}
}

// ── H4 teacher: class page → Homework tab ───────────────────────────────────
async function hwSetHomework(className, opts) {
  var now = Date.now();
  var id = 'hw' + now.toString(36);
  var rec = { title: opts.title || ('Homework – week of ' + new Date(now).toLocaleDateString('en-GB')), setAt: now, dueAt: opts.dueAt || now + HW.dueDays * 864e5,
    size: opts.size || HW.size, pins: opts.pins && opts.pins.length ? opts.pins : null, excludes: opts.excludes && opts.excludes.length ? opts.excludes : null, auto: !!opts.auto };
  await state.db.ref('classes/' + className + '/homework/' + id).set(rec);
  return id;
}
async function hwAutoWeekly(className, homework) {
  var a = (await state.db.ref('classes/' + className + '/homeworkAuto').get()).val();
  if (!a || !a.on) return null;
  var last = Object.keys(homework).map(function (k) { return homework[k].setAt || 0; }).sort(function (x, y) { return y - x; })[0] || 0;
  if (Date.now() - last < 6.5 * 864e5) return null;
  return hwSetHomework(className, { size: a.size || HW.size, auto: true });
}
async function hwLoadClass(className) {
  var codesSnap = await state.db.ref('classes/' + className + '/codes').get();
  var codes = Object.keys(codesSnap.val() || {});
  var homework = (await state.db.ref('classes/' + className + '/homework').get()).val() || {};
  var created = await hwAutoWeekly(className, homework).catch(function () { return null; });
  if (created) homework = (await state.db.ref('classes/' + className + '/homework').get()).val() || {};
  var progs = {};
  await Promise.all(codes.map(function (c) {
    return Promise.all([
      state.db.ref('progress/' + c + '/hw').get().then(function (s) { return s.val() || {}; }).catch(function () { return {}; }),
      state.db.ref('progress/' + c + '/mastery').get().then(function (s) { return s.val() || {}; }).catch(function () { return {}; })
    ]).then(function (r) { progs[c] = { hw: r[0], mastery: r[1] }; });
  }));
  var logs = {};
  await Promise.all(Object.keys(homework).map(function (id) {
    return state.db.ref('gcse/hwLog/' + id).get().then(function (s) { logs[id] = s.val() || {}; }).catch(function () { logs[id] = {}; });
  }));
  var support = (await state.db.ref('classes/' + className + '/hwSupport').get().catch(function () { return null; }));
  support = support && support.val ? support.val() || {} : {};
  return { className: className, codes: codes, homework: homework, progs: progs, logs: logs, created: created, support: support };
}
function hwActivitySummary(logEntries) {
  var by = {};
  Object.keys(logEntries || {}).forEach(function (k) { var e = logEntries[k]; if (!e) return; (by[e.ev] = by[e.ev] || []).push(e); });
  var names = { tab: 'Left the tab', window: 'Switched window', paste: 'Pasted', copy: 'Copied question', fast: 'Too fast', burst: 'Text appeared suddenly' };
  var parts = Object.keys(by).map(function (ev) {
    var qs = {}; by[ev].forEach(function (e) { qs['Q' + e.q] = (qs['Q' + e.q] || 0) + 1; });
    return (names[ev] || ev) + ' ' + by[ev].length + ' (' + Object.keys(qs).map(function (q) { return q + (qs[q] > 1 ? ' ×' + qs[q] : ''); }).join(', ') + ')';
  });
  return { count: Object.keys(logEntries || {}).length, text: parts.join(' · '), flaggedQ: Object.keys(by).reduce(function (s, ev) { by[ev].forEach(function (e) { s[e.q] = true; }); return s; }, {}) };
}
function hwPupilRow(H, id, code) {
  var meta = H.homework[id], rec = (H.progs[code] || {}).hw ? H.progs[code].hw[id] : null;
  var answers = rec && rec.answers ? Object.keys(rec.answers).map(function (n) { return rec.answers[n]; }) : [];
  var first = answers.filter(function (a) { return !a.retry; });
  var log = hwActivitySummary((H.logs[id] || {})[code]);
  var status = rec && rec.doneAt ? (rec.doneAt > meta.dueAt ? 'late' : 'done') : rec && rec.startedAt ? 'partial' : 'not started';
  return { code: code, name: gName(code) || code, status: status, cleared: rec ? rec.cleared || 0 : 0, size: rec ? rec.size || meta.size : meta.size,
    acc: first.length ? Math.round(first.filter(function (a) { return a.ok; }).length / first.length * 100) : null, mins: rec ? Math.round((rec.ms || 0) / 60000) : 0, log: log,
    helped: first.filter(function (a) { return a.h; }).length, answered: first.length, support: Number((H.support || {})[code]) || 0 };
}
async function hwClassTabRender(body, className, settings) {
  body.innerHTML = '<p class="text-gray-400 text-sm">Loading homework…</p>';
  var H = await hwLoadClass(className);
  HW.classData = H;
  if (!gEl('class-page-body') || classPage.tab !== 'homework') return;
  var auto = (await state.db.ref('classes/' + className + '/homeworkAuto').get()).val() || {};
  var ids = Object.keys(H.homework).sort(function (a, b) { return H.homework[b].setAt - H.homework[a].setAt; });
  var due = new Date(Date.now() + HW.dueDays * 864e5).toISOString().slice(0, 10);
  var h = '<div class="border border-gray-200 rounded-lg p-3 mb-4"><h4 class="font-bold text-gray-800 mb-2">Set homework <span class="text-xs font-normal text-gray-500">– every pupil gets their own questions, weakest skills first</span></h4>' +
    '<div class="flex flex-wrap items-end gap-3 text-sm"><label class="text-xs text-gray-600">Due<input type="date" id="hw-due" value="' + due + '" class="block border border-gray-300 rounded px-2 py-1 text-sm"></label>' +
    '<label class="text-xs text-gray-600">Questions<input type="number" id="hw-size" min="5" max="40" value="' + HW.size + '" class="block w-20 border border-gray-300 rounded px-2 py-1 text-sm"></label>' +
    '<label class="text-xs text-gray-600">Focus on (optional)<input id="hw-pins" placeholder="e.g. 2.2.1d, 1.2.4" class="block w-44 border border-gray-300 rounded px-2 py-1 text-sm"></label>' +
    '<label class="text-xs text-gray-600">Leave out (optional)<input id="hw-excl" placeholder="e.g. 1.6" class="block w-36 border border-gray-300 rounded px-2 py-1 text-sm"></label>' +
    '<button type="button" id="hw-set" class="jhncc-primary px-4 py-1.5 rounded font-semibold">Set homework</button>' +
    '<label class="text-xs flex items-center gap-1 ml-auto"><input type="checkbox" id="hw-auto"' + (auto.on ? ' checked' : '') + '> Auto-set weekly</label><span id="hw-msg" class="text-xs text-gray-600">' + (H.created ? 'This week\'s homework was set automatically.' : '') + '</span></div></div>';
  h += hwSupportCardHtml(H);
  if (!ids.length) h += '<p class="text-sm text-gray-500 mb-4">No homework set yet.</p>';
  ids.forEach(function (id, i) {
    var meta = H.homework[id];
    var rows = H.codes.map(function (c) { return hwPupilRow(H, id, c); }).sort(function (a, b) { return a.name.localeCompare(b.name); });
    var done = rows.filter(function (r) { return r.status === 'done' || r.status === 'late'; }).length;
    var overdue = meta.dueAt < Date.now();
    var chase = rows.filter(function (r) { return r.status === 'not started' || r.status === 'partial'; });
    h += '<details class="hw-item border border-gray-200 rounded-lg mb-3"' + (i === 0 ? ' open' : '') + '><summary class="cursor-pointer px-3 py-2 flex flex-wrap items-center gap-2 text-sm"><b>' + gEsc(meta.title) + '</b><span class="text-xs text-gray-500">due ' + gEsc(hwFmtDate(meta.dueAt)) + ' · ' + (meta.size || HW.size) + ' questions' + (meta.pins ? ' · focus ' + gEsc(GcseCore.asList(meta.pins).join(', ')) : '') + '</span>' +
      '<span class="ml-auto text-xs ' + (done === rows.length ? 'text-green-700' : overdue ? 'text-red-700' : 'text-gray-600') + '">' + done + '/' + rows.length + ' done</span></summary><div class="px-3 pb-3">' +
      (overdue && chase.length ? '<div class="text-xs text-red-800 bg-red-50 border border-red-200 rounded px-2 py-1 mb-2"><b>Chase (' + chase.length + '):</b> ' + chase.map(function (r) { return gEsc(r.name) + (r.status === 'partial' ? ' (' + r.cleared + '/' + r.size + ')' : ''); }).join(', ') + '</div>' : '') +
      '<div class="overflow-x-auto"><table class="w-full text-xs"><tr class="bg-gray-50 text-left"><th class="p-1">Pupil</th><th class="p-1">Status</th><th class="p-1 text-center">Progress</th><th class="p-1 text-center">Right first time</th><th class="p-1 text-center">Minutes</th><th class="p-1 text-center">Help used</th><th class="p-1">Activity (only you can see this)</th></tr>' +
      rows.map(function (r) {
        var st = { done: 'text-green-700', late: 'text-amber-700', partial: 'text-blue-700', 'not started': 'text-gray-500' }[r.status];
        return '<tr class="hw-row border-t" data-code="' + gEsc(r.code) + '"><td class="p-1"><button type="button" class="gcse-profile-link hover:underline" data-code="' + gEsc(r.code) + '">' + gEsc(r.name) + '</button></td><td class="p-1 ' + st + '">' + r.status + '</td>' +
          '<td class="p-1 text-center">' + r.cleared + '/' + r.size + '</td><td class="p-1 text-center">' + (r.acc == null ? '–' : r.acc + '%') + '</td><td class="p-1 text-center">' + r.mins + '</td><td class="p-1 text-center hw-helped">' + (r.answered ? r.helped + '/' + r.answered : '–') + (r.support ? ' <span class="text-blue-700" title="Support level">(' + HW_SUPPORT[r.support].label.toLowerCase() + ')</span>' : '') + '</td>' +
          '<td class="p-1 hw-activity ' + (r.log.count ? 'text-red-800' : 'text-gray-400') + '">' + (r.log.count ? gEsc(r.log.text) : 'nothing unusual') + '</td></tr>';
      }).join('') + '</table></div><p class="text-[11px] text-gray-500 mt-1">Activity is logged silently during homework only. Treat it as something to look into, not proof – answers flagged here do not count towards mastery.</p></div></details>';
  });
  h += '<div class="grid grid-cols-1 lg:grid-cols-2 gap-4"><div class="border border-gray-200 rounded-lg p-3">' + hwClassNeedsHtml(H) + '</div><div class="border border-gray-200 rounded-lg p-3" id="hw-class-impact"><p class="text-xs text-gray-400">Working out whether homework is helping…</p></div></div>';
  body.innerHTML = h;
  body.querySelectorAll('.gcse-profile-link').forEach(function (b) { b.onclick = function () { openGcseProfile(b.dataset.code); }; });
  var rerender = function () { hwClassTabRender(body, className, settings); };
  body.querySelectorAll('.hw-sup-sel').forEach(function (sel) { sel.onchange = async function () { try { await hwSetSupport(className, sel.dataset.code, sel.value); rerender(); } catch (e) { gEl('hw-msg').textContent = gDbError(e); } }; });
  body.querySelectorAll('.hw-sup-use').forEach(function (b) { b.onclick = async function () { try { await hwSetSupport(className, b.dataset.code, b.dataset.level); rerender(); } catch (e) { gEl('hw-msg').textContent = gDbError(e); } }; });
  if (gEl('hw-support-all')) gEl('hw-support-all').onclick = async function () {
    var btns = Array.prototype.slice.call(body.querySelectorAll('.hw-sup-use'));
    try { await Promise.all(btns.map(function (b) { return hwSetSupport(className, b.dataset.code, b.dataset.level); })); rerender(); } catch (e) { gEl('hw-msg').textContent = gDbError(e); }
  };
  var parseCodes = function (v) { return String(v || '').split(/[,\s]+/).map(function (x) { return x.trim(); }).filter(function (x) { return x && J277.get(x); }); };
  gEl('hw-set').onclick = async function () {
    var dueAt = new Date(gEl('hw-due').value + 'T21:00:00').getTime() || Date.now() + HW.dueDays * 864e5;
    try {
      await hwSetHomework(className, { dueAt: dueAt, size: Number(gEl('hw-size').value) || HW.size, pins: parseCodes(gEl('hw-pins').value), excludes: parseCodes(gEl('hw-excl').value) });
      hwClassTabRender(body, className, settings);
    } catch (e) { gEl('hw-msg').textContent = gDbError(e); }
  };
  gEl('hw-auto').onchange = async function () {
    await state.db.ref('classes/' + className + '/homeworkAuto').set(this.checked ? { on: true, size: Number(gEl('hw-size').value) || HW.size, setAt: Date.now() } : null);
    gEl('hw-msg').textContent = this.checked ? 'Auto-weekly on: a new homework is set when 7 days have passed (checked whenever a teacher opens this tab).' : 'Auto-weekly off.';
  };
  hwClassImpactRender(className, H);
}

// ── H5 needs + "is it helping?" ─────────────────────────────────────────────
// Needs from mastery: skills with enough evidence and a low rating, weakest first, with their common mistakes.
function hwNeeds(mastery, hw) {
  var mistakes = {};
  Object.keys(hw || {}).forEach(function (id) {
    Object.keys((hw[id] || {}).answers || {}).forEach(function (n) {
      var a = hw[id].answers[n]; if (!a || a.ok) return;
      GcseCore.asList(a.codes).forEach(function (c) { var M = mistakes[a.k] = mistakes[a.k] || {}; M[c] = (M[c] || 0) + 1; });
    });
  });
  var list = Object.keys(mastery || {}).map(function (k) { var m = mastery[k]; return { k: k, t: m.t, n: m.n || 0, c: m.c || 0, t0: m.t0 }; });
  var needs = list.filter(function (x) { return x.n >= 2 && x.t < 3; }).sort(function (a, b) { return a.t - b.t; });
  var secure = list.filter(function (x) { return x.n >= 3 && x.t >= 3.8; }).sort(function (a, b) { return b.t - a.t; });
  needs.forEach(function (x) { var M = mistakes[x.k] || {}; x.mistakes = Object.keys(M).sort(function (a, b) { return M[b] - M[a]; }).slice(0, 2).map(function (c) { var f = J277.feedbackCode(c); return { id: c, text: f ? f.text : c, n: M[c] }; }); });
  return { needs: needs, secure: secure };
}
function hwNeedsHtml(N, max) {
  if (!N.needs.length && !N.secure.length) return '<p class="text-sm text-gray-500">Not enough homework yet to pin down needs.</p>';
  return (N.needs.length ? '<div class="text-sm"><b class="text-red-800">Needs:</b><ul class="list-disc ml-5">' + N.needs.slice(0, max || 6).map(function (x) {
    return '<li class="hw-need">' + gEsc(hwKeyLabel(x.k)) + ' <span class="text-xs text-gray-500">– ' + x.c + '/' + x.n + ' right</span>' + (x.mistakes.length ? '<div class="text-xs text-gray-600">often: ' + x.mistakes.map(function (m) { return gEsc(m.text) + ' (×' + m.n + ')'; }).join('; ') + '</div>' : '') + '</li>';
  }).join('') + '</ul></div>' : '') +
    (N.secure.length ? '<div class="text-sm mt-1"><b class="text-green-800">Secure:</b> ' + N.secure.slice(0, 6).map(function (x) { return gEsc(hwKeyLabel(x.k)); }).join(', ') + '</div>' : '');
}
function hwClassNeedsHtml(H) {
  var count = {};
  H.codes.forEach(function (c) { hwNeeds((H.progs[c] || {}).mastery, (H.progs[c] || {}).hw).needs.forEach(function (x) { (count[x.k] = count[x.k] || []).push(c); }); });
  var keys = Object.keys(count).sort(function (a, b) { return count[b].length - count[a].length; }).slice(0, 8);
  return '<h4 class="font-bold text-gray-800 mb-2">Class needs <span class="text-xs font-normal text-gray-500">(from homework)</span></h4>' + (keys.length ? keys.map(function (k) {
    return '<div class="hw-class-need text-sm mb-1"><b>' + count[k].length + ' pupil' + (count[k].length === 1 ? '' : 's') + '</b> weak on ' + gEsc(hwKeyLabel(k)) + '<div class="text-[11px] text-gray-500">' + count[k].map(function (c) { return gEsc(gName(c) || c); }).join(', ') + '</div></div>';
  }).join('') : '<p class="text-sm text-gray-500">Not enough homework yet.</p>');
}
// Topic % per official paper test from a rubric-like list.
function hwTopicPcts(items) {
  var per = {};
  items.forEach(function (q) { GcseCore.asList(q.topics).forEach(function (tc) { J277.expand(tc).forEach(function (s) { var P = per[s] || (per[s] = { a: 0, p: 0 }); P.a += Number(q.a) || 0; P.p += Number(q.p) || 0; }); }); });
  var out = {}; Object.keys(per).forEach(function (k) { if (per[k].p) out[k] = Math.round(per[k].a / per[k].p * 100); });
  return out;
}
// tests: [{at, pct:{topic:%}}] sorted; answers: [{at, topic, flagged}] → carry-over comparison.
function hwImpact(tests, answers, homeworkCount) {
  var used = answers.filter(function (a) { return !a.flagged; });
  var firstAt = used.length ? Math.min.apply(null, used.map(function (a) { return a.at; })) : Infinity;
  var prac = [], un = [];
  for (var j = 1; j < tests.length; j++) {
    if (tests[j].at <= firstAt) continue;
    Object.keys(tests[j].pct).forEach(function (tc) {
      var pre = null, preAt = 0;
      for (var i = j - 1; i >= 0; i--) if (tests[i].pct[tc] != null) { pre = tests[i].pct[tc]; preAt = tests[i].at; break; }
      if (pre == null) return;
      var n = used.filter(function (a) { return a.topic === tc && a.at > preAt && a.at < tests[j].at; }).length;
      (n >= 2 ? prac : un).push(tests[j].pct[tc] - pre);
    });
  }
  var mean = function (a) { return a.length ? Math.round(a.reduce(function (s, x) { return s + x; }, 0) / a.length) : null; };
  var r = { prac: prac.length, un: un.length, pracMean: mean(prac), unMean: mean(un) };
  if ((homeworkCount || 0) < 3 || prac.length < 2 || un.length < 1) { r.verdict = 'Not enough data yet'; r.cls = 'text-gray-600'; r.note = 'Needs at least 3 homeworks and a test afterwards that covers topics practised and not practised.'; return r; }
  r.diff = r.pracMean - r.unMean;
  if (r.diff >= 5) { r.verdict = 'Likely helping'; r.cls = 'text-green-700'; }
  else if (r.diff <= -5) { r.verdict = 'Not helping – check effort or difficulty'; r.cls = 'text-red-700'; }
  else { r.verdict = 'No clear effect yet'; r.cls = 'text-amber-700'; }
  return r;
}
function hwImpactHtml(I) {
  return '<div class="hw-impact"><div class="text-lg font-bold ' + I.cls + '">' + gEsc(I.verdict) + '</div>' +
    (I.pracMean != null || I.unMean != null ? '<div class="text-sm">In the next test, topics <b>practised in homework</b> changed by <b>' + (I.pracMean == null ? '–' : (I.pracMean >= 0 ? '+' : '') + I.pracMean + '%') + '</b> (' + I.prac + ' topic' + (I.prac === 1 ? '' : 's') + '), topics <b>not practised</b> by <b>' + (I.unMean == null ? '–' : (I.unMean >= 0 ? '+' : '') + I.unMean + '%') + '</b> (' + I.un + ').</div>' : '') +
    (I.note ? '<div class="text-xs text-gray-500">' + gEsc(I.note) + '</div>' : '') +
    '<div class="text-[11px] text-gray-500 mt-1">Evidence, not proof: practised and unpractised topics are not a perfect comparison. Flagged answers are left out.</div></div>';
}
// Profile → Homework tab
async function hwProfileRender(D) {
  var box = gEl('hw-prof'); if (!box) return;
  var hw = D.hw || {}, mastery = D.mastery || {};
  var ids = Object.keys(hw);
  var logs = {};
  await Promise.all(ids.map(function (id) { return state.db.ref('gcse/hwLog/' + id + '/' + D.code).get().then(function (s) { logs[id] = s.val() || {}; }).catch(function () { logs[id] = {}; }); }));
  var setSnap = D.className ? await state.db.ref('classes/' + D.className + '/homework').get().catch(function () { return null; }) : null;
  var set = setSnap && setSnap.val ? setSnap.val() || {} : {};
  var setIds = Object.keys(set).sort(function (a, b) { return set[a].setAt - set[b].setAt; });
  if (!gEl('hw-prof')) return;
  var done = setIds.filter(function (id) { return hw[id] && hw[id].doneAt; }).length;
  var onTime = setIds.filter(function (id) { return hw[id] && hw[id].doneAt && hw[id].doneAt <= set[id].dueAt; }).length;
  var answers = [], flaggedN = 0, totalN = 0;
  ids.forEach(function (id) {
    var flagged = hwActivitySummary(logs[id]).flaggedQ;
    Object.keys((hw[id] || {}).answers || {}).forEach(function (n) {
      var a = hw[id].answers[n]; if (!a) return;
      totalN++;
      var f = !!flagged[Number(n) + 1]; if (f) flaggedN++;
      answers.push({ at: a.at, topic: hwKeyParts(a.k).topic, k: a.k, ok: a.ok, retry: a.retry, flagged: f, hw: id });
    });
  });
  var mins = ids.reduce(function (s, id) { return s + ((hw[id] || {}).ms || 0); }, 0) / 60000;
  var card = function (v, l, cls) { return '<div class="rounded-lg border border-gray-200 p-3 text-center"><div class="text-2xl font-bold ' + (cls || '') + '">' + v + '</div><div class="text-xs text-gray-500">' + l + '</div></div>'; };
  var h = '<div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">' + card(setIds.length ? done + '/' + setIds.length : '–', 'Homeworks done') + card(setIds.length ? onTime + '/' + setIds.length : '–', 'On time') +
    card(ids.length ? Math.round(mins / Math.max(1, ids.length)) : '–', 'Minutes per homework') + card(totalN ? Math.round(flaggedN / totalN * 100) + '%' : '–', 'Answers flagged (activity)', flaggedN ? 'text-red-700' : '') + '</div>';
  // Learning inside homework: first-try accuracy per homework
  var perHw = setIds.filter(function (id) { return hw[id] && hw[id].answers; }).map(function (id) {
    var first = answers.filter(function (a) { return a.hw === id && !a.retry && !a.flagged; });
    return { id: id, title: set[id].title, pct: first.length ? Math.round(first.filter(function (a) { return a.ok; }).length / first.length * 100) : null };
  });
  h += '<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4"><div class="border border-gray-200 rounded-lg p-3"><h4 class="font-bold mb-2">Needs</h4>' + hwNeedsHtml(hwNeeds(mastery, hw)) + '</div>' +
    '<div class="border border-gray-200 rounded-lg p-3"><h4 class="font-bold mb-2">Is homework helping?</h4>' + hwImpactHtml(hwImpact(hwTestsFromHistory(D.history || []), answers, setIds.length)) + '</div></div>';
  h += '<div class="grid grid-cols-1 lg:grid-cols-2 gap-4"><div class="border border-gray-200 rounded-lg p-3"><h4 class="font-bold mb-2">Right first time, per homework</h4>' + (perHw.length ? perHw.map(function (x) {
    return '<div class="flex items-center gap-2 text-sm mb-1"><span class="w-40 truncate">' + gEsc(x.title) + '</span><div class="flex-1 h-2.5 bg-gray-100 rounded"><div class="h-2.5 rounded" style="width:' + (x.pct || 0) + '%;background:rgb(176,28,35)"></div></div><span class="w-10 text-right text-xs">' + (x.pct == null ? '–' : x.pct + '%') + '</span></div>';
  }).join('') : '<p class="text-sm text-gray-500">No homework answers yet.</p>') + '</div>' +
    '<div class="border border-gray-200 rounded-lg p-3"><h4 class="font-bold mb-2">Retention</h4>' + hwRetentionHtml(answers) + '</div></div>';
  var supLevel = 0;
  if (D.className) { var sv = await state.db.ref('classes/' + D.className + '/hwSupport/' + D.code).get().catch(function () { return null; }); supLevel = sv && sv.val ? Number(sv.val()) || 0 : 0; }
  if (!gEl('hw-prof')) return;
  h += '<div class="border border-gray-200 rounded-lg p-3 mt-4"><h4 class="font-bold mb-1">Independence</h4>' + hwIndependenceHtml(hw, set, setIds, supLevel) + '</div>';
  box.innerHTML = h;
}
function hwTestsFromHistory(history) {
  return history.filter(function (x) { return x.kind === 'paper' && !x.absent && !x.practice && x.test; }).map(function (x) {
    return { at: x.at, pct: hwTopicPcts((x.test.questions || []).map(function (q) { var v = x.marks[q.id]; return { topics: q.topics, a: v == null ? 0 : v, p: q.marks }; })) };
  }).sort(function (a, b) { return a.at - b.at; });
}
function hwRetentionHtml(answers) {
  var byKey = {}, rows = [];
  answers.filter(function (a) { return !a.flagged; }).sort(function (a, b) { return a.at - b.at; }).forEach(function (a) {
    var prev = byKey[a.k];
    if (prev && prev.lastOk && a.at - prev.lastOk >= 14 * 864e5 && !a.retry) rows.push(a.ok);
    if (a.ok) byKey[a.k] = { lastOk: a.at }; else byKey[a.k] = byKey[a.k] || {};
  });
  if (rows.length < 3) return '<p class="text-sm text-gray-500">Shown once skills come back for review 2+ weeks after being answered correctly.</p>';
  var pct = Math.round(rows.filter(Boolean).length / rows.length * 100);
  return '<div class="text-2xl font-bold">' + pct + '%</div><div class="text-xs text-gray-500">still right when a skill came back 2+ weeks later (' + rows.length + ' questions)</div>';
}
// Class version: carry-over across every pupil + minutes vs change.
async function hwClassImpactRender(className, H) {
  var box = gEl('hw-class-impact'); if (!box) return;
  var data; try { data = await classAssessmentData(className); } catch (e) { box.innerHTML = ''; return; }
  var allPrac = [], allUn = [], points = [], hwCount = Object.keys(H.homework).length;
  H.codes.forEach(function (c) {
    var recs = data.recs[c] || {};
    var tests = Object.keys(recs).map(function (id) { return recs[id]; }).filter(function (r) { return r.type === 'paper' && !assessmentIsPractice(r.id || '', data.flags); })
      .map(function (r) { return { at: r.completedAt, pct: hwTopicPcts(GcseCore.asList(r.rubric).map(function (q) { return { topics: q.topics, a: q.awarded, p: q.marks }; })) }; }).sort(function (a, b) { return a.at - b.at; });
    var hw = (H.progs[c] || {}).hw || {};
    var answers = [], mins = 0;
    Object.keys(hw).forEach(function (id) {
      var flagged = hwActivitySummary((H.logs[id] || {})[c]).flaggedQ;
      mins += (hw[id].ms || 0) / 60000;
      Object.keys(hw[id].answers || {}).forEach(function (n) { var a = hw[id].answers[n]; if (a) answers.push({ at: a.at, topic: hwKeyParts(a.k).topic, flagged: !!flagged[Number(n) + 1] }); });
    });
    var I = hwImpact(tests, answers, hwCount);
    if (I.pracMean != null) allPrac.push(I.pracMean);
    if (I.unMean != null) allUn.push(I.unMean);
    var both = [I.pracMean, I.unMean].filter(function (v) { return v != null; });
    if (both.length) points.push({ code: c, mins: Math.round(mins), change: Math.round(both.reduce(function (s, v) { return s + v; }, 0) / both.length) });
  });
  var mean = function (a) { return a.length ? Math.round(a.reduce(function (s, x) { return s + x; }, 0) / a.length) : null; };
  var I = { prac: allPrac.length, un: allUn.length, pracMean: mean(allPrac), unMean: mean(allUn) };
  if (hwCount < 3 || allPrac.length < 2 || allUn.length < 1) { I.verdict = 'Not enough data yet'; I.cls = 'text-gray-600'; I.note = 'Needs at least 3 homeworks and a test afterwards.'; }
  else { I.diff = I.pracMean - I.unMean; I.verdict = I.diff >= 5 ? 'Likely helping' : I.diff <= -5 ? 'Not helping – check effort or difficulty' : 'No clear effect yet'; I.cls = I.diff >= 5 ? 'text-green-700' : I.diff <= -5 ? 'text-red-700' : 'text-amber-700'; }
  var h = '<h4 class="font-bold text-gray-800 mb-2">Is homework helping the class?</h4>' + hwImpactHtml(I).replace(/(\d+) topics?\)/g, '$1 pupil averages)');
  if (points.length >= 3) {
    var W = 300, Hh = 140, P = 26, maxM = Math.max.apply(null, points.map(function (p) { return p.mins; }).concat([10]));
    var minC = Math.min.apply(null, points.map(function (p) { return p.change; }).concat([-10])), maxC = Math.max.apply(null, points.map(function (p) { return p.change; }).concat([10]));
    var x = function (v) { return P + v / maxM * (W - 2 * P); }, y = function (v) { return Hh - P - (v - minC) / (maxC - minC || 1) * (Hh - 2 * P); };
    h += '<svg viewBox="0 0 ' + W + ' ' + Hh + '" class="w-full mt-2" style="max-height:170px"><line x1="' + P + '" x2="' + (W - P) + '" y1="' + y(0) + '" y2="' + y(0) + '" stroke="#d1d5db"/>' +
      points.map(function (p) { return '<circle cx="' + x(p.mins) + '" cy="' + y(p.change) + '" r="4" fill="rgb(176,28,35)" stroke="#fff" stroke-width="1.5"><title>' + gEsc((gName(p.code) || p.code) + ': ' + p.mins + ' min, ' + (p.change >= 0 ? '+' : '') + p.change + '%') + '</title></circle>'; }).join('') +
      '<text x="' + (W - P) + '" y="' + (Hh - 6) + '" font-size="9" text-anchor="end" fill="#6b7280">homework minutes →</text><text x="4" y="12" font-size="9" fill="#6b7280">change in test %</text></svg>';
  }
  box.innerHTML = h;
}

// Pupil "My progress" add-on and banner wiring
function hwMyProgressHtml(hw, mastery, setMeta) {
  var ids = Object.keys(setMeta || {});
  if (!ids.length) return '';
  var done = ids.filter(function (id) { return hw[id] && hw[id].doneAt; }).length;
  var improved = Object.keys(mastery || {}).map(function (k) { var m = mastery[k]; return { k: k, d: (m.t || 0) - (m.t0 != null ? m.t0 : m.t) }; }).filter(function (x) { return x.d >= 0.5; }).sort(function (a, b) { return b.d - a.d; }).slice(0, 3);
  return '<div class="border border-gray-200 rounded-lg p-3 mb-3"><h4 class="font-bold mb-1">Homework</h4><div class="text-sm">' + done + ' of ' + ids.length + ' homeworks done.</div>' +
    (improved.length ? '<div class="text-sm mt-1"><b class="text-green-800">Improved:</b> ' + improved.map(function (x) { return gEsc(hwKeyLabel(x.k)); }).join(', ') + '</div>' : '') + '</div>';
}
(function () {
  if (typeof updateAuthUI !== 'function') return;
  var orig = updateAuthUI;
  updateAuthUI = function (first, last, isAdmin, isTeacher) {
    var r = orig.apply(this, arguments);
    var b = gEl('hw-banner'); if (b) b.remove();
    if (!isAdmin && !isTeacher) setTimeout(function () { if (state.uid && !state.isTeacher && !state.isAdmin) hwStudentBanner(); }, 700);
    return r;
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = { hwBuildPlan: hwBuildPlan, hwUpdateMastery: hwUpdateMastery, hwImpact: hwImpact, hwPickQuestion: hwPickQuestion, hwTargetLevel: hwTargetLevel };
