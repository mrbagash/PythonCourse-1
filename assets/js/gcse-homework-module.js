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
var HW = { size: 20, dueDays: 7, minMs: { mcq: 2500, short: 4000 }, minAwayMs: 1000, retries: 2, session: null };

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
    if (!v.quizUsable || (r.type !== 'mcq' && r.type !== 'short')) return;
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
function hwUpdateMastery(m, level, correct, now) {
  m = Object.assign({ n: 0, c: 0, box: 0 }, m);
  m.t = Math.round(hwClamp(m.t + 0.6 * ((correct ? 1 : 0) - hwP(m.t, level)), 0.5, 6) * 100) / 100;
  m.n++; if (correct) m.c++;
  m.last = now;
  if (correct) { m.box = Math.min((m.box || 0) + 1, 4); m.next = now + [7, 14, 28, 56][m.box - 1] * 864e5; }
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
function hwSuspectWords(q, codes) {
  var words = {};
  try {
    GcseCore.parseRules(q.rules || '').points.forEach(function (p) { (p.reject || []).forEach(function (sp) { if (sp && sp.main) words[sp.main] = true; }); });
  } catch (e) {}
  (codes || []).forEach(function (id) { var c = J277.feedbackCode(id); (c && c.wrong || []).forEach(function (w) { words[GcseCore.stem(w)] = true; }); });
  return words;
}
function hwHighlight(text, words) {
  var safe = gEsc(text);
  if (!Object.keys(words).length) return safe;
  return safe.replace(/[A-Za-z][A-Za-z0-9]{1,}/g, function (w) { return words[GcseCore.stem(w.toLowerCase())] ? '<mark class="bg-red-100 text-red-800 underline decoration-red-500 rounded px-0.5">' + w + '</mark>' : w; });
}
// res = { ok, mark, max, points, codes, chosen }
function hwFeedbackHtml(q, answer, res) {
  if (res.ok) {
    return '<div class="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-900"><b>✓ Correct!</b>' +
      (res.points && res.points.length ? '<ul class="text-xs list-disc ml-5 mt-1">' + res.points.map(function (p) { return '<li>' + (p.awarded ? '✓ ' : '✗ ') + gEsc(p.reason) + '</li>'; }).join('') + '</ul>' : '') + '</div>';
  }
  var codes = (res.codes || []).map(function (id) { return J277.feedbackCode(id); }).filter(Boolean);
  // No code on the question? Use the topic's own misconception / mix-up so there is always a reason.
  if (!codes.length) {
    var tc = (q.topics || [])[0], sk = q.skill || '';
    var all = J277.codesForTopic(tc).filter(function (c) { return !c.exam; });
    var topicCodes = all.filter(function (c) { return sk ? (!c.skill || c.skill === sk) : true; });
    if (!topicCodes.length) topicCodes = all;
    if (topicCodes.length) codes = topicCodes.slice(0, 1);
    else { var mix = J277.mixupsFor(tc); if (mix.length) codes = [{ id: '', text: mix[0] }]; }
  }
  var h = '<div class="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 space-y-2"><div><b>Not quite</b>' + (res.max > 1 ? ' – ' + res.mark + ' / ' + res.max : '') + '</div>';
  if (q.type === 'mcq') {
    var why = (q.why || [])[res.chosen];
    h += '<div><span class="font-semibold">You chose:</span> ' + gEsc(String.fromCharCode(65 + res.chosen) + '. ' + (q.options[res.chosen] || '')) + '</div>' +
      '<div class="hw-why"><span class="font-semibold">Why that is wrong:</span> ' + gEsc(why || (codes[0] ? codes[0].text : 'Compare it carefully with the correct answer below.')) + '</div>' +
      '<div><span class="font-semibold">Correct answer:</span> ' + gEsc(String.fromCharCode(65 + q.answerIndex) + '. ' + q.options[q.answerIndex]) + '</div>';
  } else {
    var words = hwSuspectWords(q, res.codes);
    var numeric = /^[=\s\d|,.\-]+$/.test(String(q.rules || '').split('\n')[0]);
    h += '<div class="hw-where"><span class="font-semibold">Where:</span> ' + (answer ? '<span class="bg-white rounded px-1">' + hwHighlight(answer, words) + '</span>' : '<i>no answer</i>') +
      (Object.keys(words).length && answer && /<mark/.test(hwHighlight(answer, words)) ? ' <span class="text-xs">(the highlighted words are where it goes wrong)</span>' : '') + '</div>';
    if (numeric) h += '<div><span class="font-semibold">Check:</span> you wrote <b>' + gEsc(answer || '–') + '</b>; the answer is <b>' + gEsc(String(q.markScheme || '').split(/[.(]/)[0]) + '</b>. Work through it again step by step.</div>';
    if (res.points && res.points.length) h += '<div><span class="font-semibold">Mark points:</span><ul class="text-xs list-disc ml-5">' + res.points.map(function (p) { return '<li>' + (p.awarded ? '✓ ' : '✗ missing: ') + gEsc(p.reason) + '</li>'; }).join('') + '</ul></div>';
    if (codes.length) h += '<div class="hw-why"><span class="font-semibold">Why:</span> ' + codes.map(function (c) { return gEsc(c.text); }).join(' · ') + '</div>';
  }
  if (q.markScheme && q.type !== 'mcq') h += '<details class="text-xs"><summary class="cursor-pointer font-semibold">Mark scheme</summary><div class="whitespace-pre-wrap mt-1">' + gEsc(q.markScheme) + '</div></details>';
  h += '<div class="text-xs text-amber-800">A similar question will come back later in this homework.</div></div>';
  return h;
}
function hwMarkAnswer(q, answer) {
  if (q.type === 'mcq') {
    var chosen = Number(answer), ok = chosen === q.answerIndex;
    var codes = ok ? [] : GcseCore.asList(q.codes).slice();
    return { ok: ok, mark: ok ? q.marks : 0, max: q.marks, chosen: chosen, codes: codes, points: [] };
  }
  var m = GcseCore.mark(q.rules, answer, q.marks);
  var codes2 = m.marks >= m.max ? [] : GcseCore.suggestFeedbackCodes({ type: 'short', topics: q.topics, codes: q.codes, command: q.command, marks: q.marks }, answer, m, J277);
  return { ok: m.marks >= m.max, mark: m.marks, max: m.max, points: m.points, codes: GcseCore.asList(codes2) };
}

// ── H3 pupil ────────────────────────────────────────────────────────────────
async function hwStudentContext() {
  var uid = state.uid, cls = state.className;
  var r = await Promise.all([
    state.db.ref('classes/' + cls + '/homework').get().then(function (s) { return s.val() || {}; }).catch(function () { return {}; }),
    state.db.ref('classes/' + cls + '/settings/covered').get().then(function (s) { return s.val() || {}; }).catch(function () { return {}; }),
    state.db.ref('progress/' + uid).get().then(function (s) { return s.val() || {}; }).catch(function () { return {}; })
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
    misc: prog.gcseMisconceptions || {}, plc: plcOver };
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
    var plan = hwBuildPlan(ctx, meta.size || HW.size);
    if (!plan.length) { body.innerHTML = '<p class="text-sm text-gray-500">There are no questions for the topics you have been taught yet. Ask your teacher.</p>'; return; }
    rec = { startedAt: Date.now(), size: plan.length, queue: plan.map(function (k, i) { return { k: k, s: i, r: 0 }; }), pos: 0, cleared: 0, ms: 0, slots: {} };
    await ref.set(rec);
  }
  rec.queue = GcseCore.asList(rec.queue); rec.slots = rec.slots || {};
  var seen = {};
  Object.keys(ctx.hw).forEach(function (id) { Object.keys((ctx.hw[id] || {}).answers || {}).forEach(function (n) { var a = ctx.hw[id].answers[n]; if (a && a.qid) seen[a.qid] = true; }); });
  HW.session = { id: hwId, meta: meta, rec: rec, ctx: ctx, ref: ref, seen: seen, used: {}, streak: {}, bump: {} };
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
  body.innerHTML = '<div class="text-xs text-gray-500 mb-1">Question ' + Math.min(num, rec.size) + ' of ' + rec.size + ' · ' + gEsc(hwKeyLabel(item.k)) + ' · ' + q.marks + ' mark' + (q.marks === 1 ? '' : 's') + (item.r ? ' · <span class="text-amber-700">try again</span>' : '') + '</div>' +
    '<div id="hw-q" class="font-semibold text-gray-800 mb-3 whitespace-pre-wrap' + (code ? ' font-mono text-sm bg-gray-50 rounded p-2' : '') + '">' + gEsc(q.question) + '</div>' +
    (q.type === 'mcq' ? '<div class="grid gap-2">' + q.options.map(function (o, i) { return '<button type="button" class="hw-opt text-left px-3 py-2 rounded border border-gray-300 hover:bg-gray-50 whitespace-pre-wrap" data-i="' + i + '">' + String.fromCharCode(65 + i) + '. ' + gEsc(o) + '</button>'; }).join('') + '</div>'
      : '<textarea id="hw-answer" rows="3" class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="Type your answer"></textarea><button type="button" id="hw-submit" class="jhncc-primary mt-2 px-4 py-1.5 rounded text-sm font-semibold">Check</button>') +
    '<div id="hw-result" class="mt-3"></div>';
  hwStartTracking();
  if (q.type === 'mcq') body.querySelectorAll('.hw-opt').forEach(function (b) { b.onclick = function () { body.querySelectorAll('.hw-opt').forEach(function (x) { x.disabled = true; }); hwSubmit(b.dataset.i); }; });
  else gEl('hw-submit').onclick = function () { var a = gEl('hw-answer').value.trim(); if (!a) return; gEl('hw-submit').disabled = true; gEl('hw-answer').disabled = true; hwSubmit(a); };
}
async function hwSubmit(answer) {
  var S = HW.session, q = S.q, item = S.item, rec = S.rec, now = Date.now();
  var track = hwStopTracking();
  var ms = now - track.shownAt;
  var minMs = HW.minMs[q.type] != null ? HW.minMs[q.type] : 3000;
  if (ms < minMs) hwLogEvent('fast', { ms: ms }, track);
  var independent = !track.flags;
  var res = hwMarkAnswer(q, answer);
  // Mastery only changes for answers that look independent (pupils are not told).
  var key = item.k, m0 = S.ctx.mastery[key];
  var level = hwLevelOf(q);
  if (independent) {
    var base = m0 && m0.t != null ? m0 : { t: hwSeedTheta(key, S.ctx.grade, S.ctx.topicPct), t0: hwSeedTheta(key, S.ctx.grade, S.ctx.topicPct) };
    var m1 = hwUpdateMastery(base, level, res.ok, now);
    if (m1.t0 == null) m1.t0 = base.t;
    S.ctx.mastery[key] = m1;
    state.db.ref('progress/' + state.uid + '/mastery/' + key).set(m1).catch(function () {});
  }
  // Streak → step up a level after two right in a row; wrong → step back.
  if (res.ok) { S.streak[key] = (S.streak[key] || 0) + 1; if (S.streak[key] % 2 === 0) S.bump[key] = (S.bump[key] || 0) + 1; }
  else { S.streak[key] = 0; S.bump[key] = Math.min(0, (S.bump[key] || 0) - 1); }
  var n = Object.keys(rec.answers || {}).length;
  var upd = {};
  upd['answers/' + n] = { qid: q.id, k: key, lvl: level, ok: res.ok, mk: res.mark, mx: res.max, ms: ms, at: now, retry: item.r || 0, codes: res.codes && res.codes.length ? res.codes : null };
  rec.answers = rec.answers || {}; rec.answers[n] = upd['answers/' + n];
  rec.ms = (rec.ms || 0) + ms; upd.ms = rec.ms;
  if (res.ok) { rec.slots[item.s] = { cleared: true }; rec.cleared = (rec.cleared || 0) + 1; upd['slots/' + item.s] = { cleared: true }; upd.cleared = rec.cleared; }
  else if ((item.r || 0) < HW.retries) {
    var again = { k: key, s: item.s, r: (item.r || 0) + 1 };
    rec.queue.splice(Math.min(rec.pos + 4, rec.queue.length), 0, again); upd.queue = rec.queue;
  } else { rec.slots[item.s] = { cleared: true, gaveUp: true }; rec.cleared = (rec.cleared || 0) + 1; upd['slots/' + item.s] = rec.slots[item.s]; upd.cleared = rec.cleared; }
  rec.pos++; upd.pos = rec.pos;
  S.ref.update(upd).catch(function () {});
  if (typeof gcseRecordQuizAttempt === 'function' && independent) { try { gcseRecordQuizAttempt({ gcseQid: q.id, gcseTopics: q.topics, q: q.question, gcseCodes: res.codes }, q.type === 'mcq' ? q.options[Number(answer)] : answer, { marks: res.mark, max: res.max }, 'practice'); } catch (e) {} }
  gEl('hw-result').innerHTML = hwFeedbackHtml(q, q.type === 'mcq' ? '' : answer, res) + '<button type="button" id="hw-next" class="mt-3 px-4 py-1.5 rounded border border-gray-300 text-sm font-semibold">Next →</button>';
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
  return { className: className, codes: codes, homework: homework, progs: progs, logs: logs, created: created };
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
    acc: first.length ? Math.round(first.filter(function (a) { return a.ok; }).length / first.length * 100) : null, mins: rec ? Math.round((rec.ms || 0) / 60000) : 0, log: log };
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
      '<div class="overflow-x-auto"><table class="w-full text-xs"><tr class="bg-gray-50 text-left"><th class="p-1">Pupil</th><th class="p-1">Status</th><th class="p-1 text-center">Progress</th><th class="p-1 text-center">Right first time</th><th class="p-1 text-center">Minutes</th><th class="p-1">Activity (only you can see this)</th></tr>' +
      rows.map(function (r) {
        var st = { done: 'text-green-700', late: 'text-amber-700', partial: 'text-blue-700', 'not started': 'text-gray-500' }[r.status];
        return '<tr class="hw-row border-t" data-code="' + gEsc(r.code) + '"><td class="p-1"><button type="button" class="gcse-profile-link hover:underline" data-code="' + gEsc(r.code) + '">' + gEsc(r.name) + '</button></td><td class="p-1 ' + st + '">' + r.status + '</td>' +
          '<td class="p-1 text-center">' + r.cleared + '/' + r.size + '</td><td class="p-1 text-center">' + (r.acc == null ? '–' : r.acc + '%') + '</td><td class="p-1 text-center">' + r.mins + '</td>' +
          '<td class="p-1 hw-activity ' + (r.log.count ? 'text-red-800' : 'text-gray-400') + '">' + (r.log.count ? gEsc(r.log.text) : 'nothing unusual') + '</td></tr>';
      }).join('') + '</table></div><p class="text-[11px] text-gray-500 mt-1">Activity is logged silently during homework only. Treat it as something to look into, not proof – answers flagged here do not count towards mastery.</p></div></details>';
  });
  h += '<div class="grid grid-cols-1 lg:grid-cols-2 gap-4"><div class="border border-gray-200 rounded-lg p-3">' + hwClassNeedsHtml(H) + '</div><div class="border border-gray-200 rounded-lg p-3" id="hw-class-impact"><p class="text-xs text-gray-400">Working out whether homework is helping…</p></div></div>';
  body.innerHTML = h;
  body.querySelectorAll('.gcse-profile-link').forEach(function (b) { b.onclick = function () { openGcseProfile(b.dataset.code); }; });
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
