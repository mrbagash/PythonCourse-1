/**
 * gcse-marking-module.js – GCSE test → "Mark answers" (online tests).
 *
 * Status colours: grey = unmarked, blue = auto-marked, orange = needs checking,
 * green = checked, purple = changed by the teacher.
 * Mark by question (identical answers grouped – one decision marks them all)
 * or by student. Keyboard: 0–9 mark · Enter accept · A accept all auto-marks
 * in view · N next to check · J/K or ↓/↑ move · letter keys toggle feedback
 * codes · U or Ctrl+Z undo.
 * Everything is saved to gcse/results/{test}/{code} (codes only, no names).
 */
var gcseMark = { testId: null, mode: 'question', cat: 'todo', q: null, student: null, cursor: 0, undo: [], history: [] };

var GM_STATUS = {
  unmarked: { label: 'Unmarked', bg: '#f3f4f6', bar: '#9ca3af', fg: '#374151' },
  auto: { label: 'Auto-marked', bg: '#dbeafe', bar: '#2563eb', fg: '#1e3a8a' },
  needs: { label: 'Needs checking', bg: '#ffedd5', bar: '#ea580c', fg: '#7c2d12' },
  checked: { label: 'Checked', bg: '#dcfce7', bar: '#16a34a', fg: '#14532d' },
  changed: { label: 'Changed', bg: '#f3e8ff', bar: '#9333ea', fg: '#581c87' }
};
var GM_ORDER = ['unmarked', 'needs', 'auto', 'checked', 'changed'];
var GM_CATS = [['todo', 'To check', ['unmarked', 'needs']], ['auto', 'Auto-marked', ['auto']], ['checked', 'Checked', ['checked']], ['changed', 'Changed', ['changed']], ['all', 'All', GM_ORDER]];
var GM_CODE_KEYS = 'qwertyiopl';   // no U (undo), A, N, J, K
var GM_STOP = { the: 1, and: 1, for: 1, with: 1, that: 1, this: 1, from: 1, are: 1, was: 1, has: 1, have: 1, not: 1, any: 1, one: 1, two: 1, mark: 1, marks: 1, each: 1, max: 1, accept: 1, allow: 1, award: 1, also: 1, e: 1, eg: 1, can: 1, will: 1, its: 1, into: 1, which: 1, when: 1, there: 1, their: 1, them: 1, than: 1, then: 1, but: 1, all: 1, more: 1, used: 1, use: 1 };

function gmEsc(v) { return typeof gEsc === 'function' ? gEsc(v) : String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function gmStatusOf(rec, qid) {
  var s = rec && rec.status && rec.status[qid];
  if (s && GM_STATUS[s]) return s;
  var resp = rec && rec.responses ? rec.responses[qid] : null;
  if (rec && rec.marks && rec.marks[qid] != null) return 'auto';
  return resp ? 'unmarked' : 'auto';
}
function gmStudents(t) {
  var res = gcse.results || {};
  return Object.keys(res).filter(function (c) { var r = res[c]; return r && !r.absent && r.responses; })
    .sort(function (a, b) { return (gName(a) || a).localeCompare(gName(b) || b); });
}
function gmQuestion(t, qid) { return (t.questions || []).filter(function (q) { return q.id === qid; })[0] || null; }
function gmAnswerText(q, resp) {
  if (resp == null || resp === '') return '';
  if (q.type === 'mcq') {
    var i = Number(resp); var L = 'ABCDEFGH'.charAt(i);
    return (L ? L + ') ' : '') + ((q.options || [])[i] != null ? q.options[i] : String(resp));
  }
  return String(resp);
}
function gmKeywords(q) {
  var words = {};
  var add = function (txt) {
    String(txt || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).forEach(function (w) {
      if (w.length >= 3 && !GM_STOP[w] && !/^\d+$/.test(w)) words[GcseCore.stem(w)] = true;
    });
  };
  add(q.rules); add(q.markScheme);
  return words;
}
function gmHighlight(text, kw) {
  var safe = gmEsc(text);
  if (!Object.keys(kw).length) return safe;
  return safe.replace(/[A-Za-z][A-Za-z0-9]{2,}/g, function (w) { return kw[GcseCore.stem(w.toLowerCase())] ? '<mark class="bg-yellow-200 rounded px-0.5">' + w + '</mark>' : w; });
}
function gmCodeChoices(q) {
  var out = [], seen = {};
  var push = function (c) { if (c && !seen[c.id]) { seen[c.id] = true; out.push(c); } };
  (q.codes ? GcseCore.asList(q.codes) : []).forEach(function (id) { push(J277.feedbackCode(id)); });
  (q.topics || []).forEach(function (tc) { J277.codesForTopic(tc).forEach(push); });
  J277.FEEDBACK_CODES.filter(function (c) { return c.exam; }).forEach(push);
  return out.slice(0, GM_CODE_KEYS.length);
}

// Units: one card each. By question → identical answers grouped; by student → one per question.
function gmUnits(t) {
  var res = gcse.results || {}, studs = gmStudents(t);
  var cat = GM_CATS.filter(function (c) { return c[0] === gcseMark.cat; })[0] || GM_CATS[0];
  var units = [];
  if (gcseMark.mode === 'question') {
    var q = gmQuestion(t, gcseMark.q); if (!q) return [];
    var groups = {}, order = [];
    studs.forEach(function (code) {
      var r = res[code]; var resp = r.responses[q.id];
      var key = q.type === 'mcq' ? 'mcq:' + resp : 'txt:' + GcseCore.normaliseText(resp || '').replace(/[.,;:!?]+/g, ' ').replace(/\s+/g, ' ').trim();
      if (!groups[key]) { groups[key] = { q: q, codes: [], answer: resp }; order.push(key); }
      groups[key].codes.push(code);
    });
    units = order.map(function (k) { return groups[k]; });
  } else {
    var code = gcseMark.student; if (!res[code]) return [];
    units = (t.questions || []).map(function (q2) { return { q: q2, codes: [code], answer: res[code].responses[q2.id] }; });
  }
  units.forEach(function (u) {
    var sts = u.codes.map(function (c) { return gmStatusOf(res[c], u.q.id); });
    u.statuses = sts;
    u.status = GM_ORDER.filter(function (s) { return sts.indexOf(s) !== -1; })[0];
    var ms = u.codes.map(function (c) { var m = res[c].marks ? res[c].marks[u.q.id] : null; return m == null ? null : Number(m); });
    u.mark = ms.every(function (m) { return m === ms[0]; }) ? ms[0] : 'mixed';
    var a0 = res[u.codes[0]].auto ? res[u.codes[0]].auto[u.q.id] : null;
    u.auto = a0 == null ? null : Number(a0);
    u.reason = res[u.codes[0]].reasons ? res[u.codes[0]].reasons[u.q.id] : '';
    var cs = {};
    u.codes.forEach(function (c) { GcseCore.asList((res[c].codes || {})[u.q.id]).forEach(function (id) { cs[id] = (cs[id] || 0) + 1; }); });
    u.fcodes = cs;
  });
  units = units.filter(function (u) { return u.statuses.some(function (s) { return cat[2].indexOf(s) !== -1; }); });
  if (gcseMark.mode === 'question') units.sort(function (a, b) { return GM_ORDER.indexOf(a.status) - GM_ORDER.indexOf(b.status) || b.codes.length - a.codes.length; });
  return units;
}

function gmCounts(t, filterFn) {
  var res = gcse.results || {}, c = { unmarked: 0, auto: 0, needs: 0, checked: 0, changed: 0, total: 0 };
  gmStudents(t).forEach(function (code) {
    (t.questions || []).forEach(function (q) {
      if (filterFn && !filterFn(code, q)) return;
      c[gmStatusOf(res[code], q.id)]++; c.total++;
    });
  });
  return c;
}
function gcseMarkUncheckedSummary(t) {
  if (!t || t.mode !== 'online') return null;
  var c = gmCounts(t);
  return { mustCheck: c.unmarked + c.needs, autoOnly: c.auto, total: c.total };
}

// ── Changes (all undoable) ──────────────────────────────────────────────────
async function gmApply(t, items, label) {
  // items: [{code, qid, mark?, status?, codes?}]
  var res = gcse.results, testId = gcse.testId;
  var before = items.map(function (it) {
    var r = res[it.code];
    return { code: it.code, qid: it.qid, mark: r.marks ? r.marks[it.qid] : null, status: (r.status || {})[it.qid] || null, codes: GcseCore.asList((r.codes || {})[it.qid]).slice() };
  });
  var updates = {}, touched = {};
  items.forEach(function (it) {
    var r = res[it.code];
    r.marks = r.marks || {}; r.status = r.status || {}; r.codes = r.codes || {};
    if ('mark' in it) r.marks[it.qid] = it.mark;
    if ('status' in it) r.status[it.qid] = it.status;
    if ('codes' in it) r.codes[it.qid] = it.codes && it.codes.length ? it.codes : null;
    var base = 'gcse/results/' + testId + '/' + it.code + '/';
    updates[base + 'marks/' + it.qid] = r.marks[it.qid] == null ? null : r.marks[it.qid];
    updates[base + 'status/' + it.qid] = r.status[it.qid] || null;
    updates[base + 'codes/' + it.qid] = r.codes[it.qid] || null;
    touched[it.code] = true;
  });
  Object.keys(touched).forEach(function (code) {
    var r = res[code];
    gcseResultFromQuestions(t, r);
    var base = 'gcse/results/' + testId + '/' + code + '/';
    updates[base + 'score'] = r.score; updates[base + 'maxScore'] = r.maxScore; updates[base + 'notAttempted'] = r.notAttempted;
    updates[base + 'grade'] = r.grade == null ? null : r.grade; updates[base + 'markedAt'] = Date.now();
  });
  gcseMark.undo.push({ before: before, label: label });
  if (gcseMark.undo.length > 100) gcseMark.undo.shift();
  gcseMark.history.unshift({ at: Date.now(), label: label });
  if (gcseMark.history.length > 30) gcseMark.history.pop();
  try { await state.db.ref().update(updates); gmFlash('Saved – ' + label); }
  catch (e) { gmFlash(gDbError(e), true); }
}
async function gmUndo(t) {
  var step = gcseMark.undo.pop();
  if (!step) { gmFlash('Nothing to undo.'); return; }
  var items = step.before.map(function (b) { return { code: b.code, qid: b.qid, mark: b.mark, status: b.status, codes: b.codes }; });
  await gmApply(t, items, 'Undo: ' + step.label);
  gcseMark.undo.pop();   // the undo itself is not undoable
  gmRender(t);
}
function gmWho(u) { return u.codes.length === 1 ? (gName(u.codes[0]) || u.codes[0]) : u.codes.length + ' students'; }
function gmSetMark(t, u, v) {
  if (v > u.q.marks) { gmFlash(u.q.id + ' is out of ' + u.q.marks + '.', true); return Promise.resolve(); }
  var items = u.codes.map(function (c) {
    var auto = gcse.results[c].auto ? gcse.results[c].auto[u.q.id] : null;
    return { code: c, qid: u.q.id, mark: v, status: auto != null && Number(auto) === v ? 'checked' : 'changed' };
  });
  return gmApply(t, items, u.q.id + ' · ' + gmWho(u) + ' → ' + v + '/' + u.q.marks);
}
function gmAccept(t, units, label) {
  var items = [];
  units.forEach(function (u) {
    u.codes.forEach(function (c) {
      var r = gcse.results[c], st = gmStatusOf(r, u.q.id);
      if (st === 'checked' || st === 'changed') return;
      var m = r.marks ? r.marks[u.q.id] : null;
      if (m == null && r.responses[u.q.id]) return;   // unmarked answer – needs a mark first
      items.push({ code: c, qid: u.q.id, status: 'checked' });
    });
  });
  if (!items.length) { gmFlash('Nothing to accept here – give unmarked answers a mark first.'); return Promise.resolve(false); }
  return gmApply(t, items, label || ('Accepted ' + items.length + ' answer' + (items.length === 1 ? '' : 's'))).then(function () { return true; });
}
function gmToggleCode(t, u, id) {
  var allHave = u.codes.every(function (c) { return GcseCore.asList((gcse.results[c].codes || {})[u.q.id]).indexOf(id) !== -1; });
  var items = u.codes.map(function (c) {
    var cur = GcseCore.asList((gcse.results[c].codes || {})[u.q.id]).slice();
    if (allHave) cur = cur.filter(function (x) { return x !== id; }); else if (cur.indexOf(id) === -1) cur.push(id);
    return { code: c, qid: u.q.id, codes: cur };
  });
  return gmApply(t, items, (allHave ? 'Removed ' : 'Added ') + id + ' · ' + u.q.id + ' · ' + gmWho(u));
}
function gmFlash(msg, err) {
  var el = gEl('gm-flash'); if (!el) return;
  el.textContent = msg; el.className = 'text-xs ' + (err ? 'text-red-700' : 'text-gray-500');
}

// ── Render ─────────────────────────────────────────────────────────────────
function gcseMarkRender(t) {
  if (gcseMark.testId !== gcse.testId) {
    gcseMark = { testId: gcse.testId, mode: 'question', cat: 'todo', q: (t.questions || [])[0] ? t.questions[0].id : null, student: null, cursor: 0, undo: [], history: [] };
  }
  var studs = gmStudents(t);
  if (!gcseMark.student || studs.indexOf(gcseMark.student) === -1) gcseMark.student = studs[0] || null;
  gmRender(t);
  gmBindKeys(t);
}
function gmRender(t) {
  var root = gEl('gcse-mark-root'); if (!root) return;
  var studs = gmStudents(t);
  if (!studs.length) { root.innerHTML = '<p class="text-sm text-gray-500 py-4">No online answers yet. They appear here when students submit.</p>'; return; }
  var c = gmCounts(t);
  var done = c.checked + c.changed;
  var units = gmUnits(t);
  if (gcseMark.cursor >= units.length) gcseMark.cursor = Math.max(0, units.length - 1);
  var h = '<div class="mb-3"><div class="flex items-center justify-between text-xs mb-1"><span><b>' + done + ' of ' + c.total + '</b> answers checked (' + (c.total ? Math.round(done / c.total * 100) : 0) + '%)</span><span id="gm-flash" class="text-xs text-gray-500"></span></div>' +
    '<div class="flex h-3 rounded overflow-hidden gap-[2px] bg-white" id="gm-progress">' + GM_ORDER.map(function (s) {
      return c[s] ? '<div title="' + GM_STATUS[s].label + ': ' + c[s] + '" style="flex:' + c[s] + ';background:' + GM_STATUS[s].bar + '"></div>' : '';
    }).join('') + '</div><div class="flex flex-wrap gap-3 text-[11px] text-gray-600 mt-1">' + GM_ORDER.map(function (s) {
      return '<span><span class="inline-block w-2.5 h-2.5 rounded-sm align-middle" style="background:' + GM_STATUS[s].bar + '"></span> ' + GM_STATUS[s].label + ' <b>' + c[s] + '</b></span>';
    }).join('') + '</div></div>';
  // Mode + categories
  h += '<div class="flex flex-wrap items-center gap-2 mb-2"><div class="flex rounded border border-gray-300 overflow-hidden text-xs">' +
    [['question', 'By question'], ['student', 'By student']].map(function (m) {
      return '<button type="button" class="gm-mode px-3 py-1 ' + (gcseMark.mode === m[0] ? 'bg-[rgb(176,28,35)] text-white font-semibold' : 'bg-white') + '" data-mode="' + m[0] + '">' + m[1] + '</button>';
    }).join('') + '</div>' +
    GM_CATS.map(function (k) {
      var n = k[2].reduce(function (s, x) { return s + c[x]; }, 0);
      return '<button type="button" class="gm-cat text-xs px-2 py-1 rounded-full border ' + (gcseMark.cat === k[0] ? 'border-[rgb(176,28,35)] text-[rgb(176,28,35)] bg-red-50 font-semibold' : 'border-gray-300 text-gray-600') + '" data-cat="' + k[0] + '">' + k[1] + ' ' + n + '</button>';
    }).join('') +
    '<button type="button" id="gm-bulk" class="ml-auto text-xs px-2 py-1 rounded border border-blue-400 text-blue-700 bg-blue-50 font-semibold" title="Key: A">Accept all auto-marks in view</button>' +
    '<button type="button" id="gm-undo" class="text-xs px-2 py-1 rounded border border-gray-300" title="Key: U or Ctrl+Z"' + (gcseMark.undo.length ? '' : ' disabled') + '>↶ Undo</button></div>';
  // Navigator: questions or students, each with its own mini progress
  if (gcseMark.mode === 'question') {
    h += '<div class="flex flex-wrap gap-1 mb-3">' + (t.questions || []).map(function (q) {
      var qc = gmCounts(t, function (code, qq) { return qq.id === q.id; });
      var todo = qc.unmarked + qc.needs;
      return '<button type="button" class="gm-q text-xs px-2 py-1 rounded border ' + (gcseMark.q === q.id ? 'border-[rgb(176,28,35)] font-bold bg-red-50' : 'border-gray-300 bg-white') + '" data-q="' + gmEsc(q.id) + '">' + gmEsc(q.id) +
        ' <span class="' + (todo ? 'text-orange-700' : (qc.auto ? 'text-blue-700' : 'text-green-700')) + '">' + (todo ? todo + ' to check' : (qc.auto ? qc.auto + ' auto' : '✓')) + '</span></button>';
    }).join('') + '</div>';
    var q = gmQuestion(t, gcseMark.q);
    if (q) h += '<div class="rounded border border-gray-200 bg-gray-50 p-3 mb-3 text-sm"><div class="flex justify-between gap-2"><b>' + gmEsc(q.id) + ' [' + q.marks + ' mark' + (q.marks === 1 ? '' : 's') + ']</b><span class="text-xs text-gray-500">' + (q.topics || []).map(function (tc) { return gmEsc(J277.label(tc)); }).join(', ') + '</span></div>' +
      (q.text ? '<div class="mt-1">' + gmEsc(q.text) + '</div>' : '') +
      (q.type === 'mcq' ? '<div class="text-xs text-gray-600 mt-1">Correct: <b>' + gmEsc(gmAnswerText(q, q.answerIndex)) + '</b></div>' : '') +
      (q.markScheme ? '<details class="mt-1 text-xs"><summary class="cursor-pointer text-gray-600">Mark scheme</summary><div class="whitespace-pre-wrap mt-1">' + gmEsc(q.markScheme) + '</div></details>' : '') + '</div>';
  } else {
    h += '<div class="flex flex-wrap items-center gap-2 mb-3"><select id="gm-student" class="border border-gray-300 rounded px-2 py-1 text-sm">' + studs.map(function (code) {
      var sc = gmCounts(t, function (cc) { return cc === code; });
      return '<option value="' + gmEsc(code) + '"' + (code === gcseMark.student ? ' selected' : '') + '>' + gmEsc(gName(code) || code) + ' – ' + (sc.unmarked + sc.needs ? (sc.unmarked + sc.needs) + ' to check' : '✓') + '</option>';
    }).join('') + '</select><button type="button" id="gm-next-student" class="text-xs px-2 py-1 rounded border border-gray-300">Next student →</button></div>';
  }
  // Cards
  if (!units.length) {
    h += '<p class="text-sm text-gray-500 py-6 text-center">Nothing in "' + (GM_CATS.filter(function (k) { return k[0] === gcseMark.cat; })[0] || [])[1] + '" here. ' + (gcseMark.cat === 'todo' ? '🎉 All checked – try another question, or see Auto-marked.' : '') + '</p>';
  } else {
    h += '<div id="gm-cards" class="space-y-2">' + units.map(function (u, i) {
      var st = GM_STATUS[u.status], on = i === gcseMark.cursor, kw = gmKeywords(u.q);
      var text = gmAnswerText(u.q, u.answer);
      var choices = gmCodeChoices(u.q);
      var mixed = u.mark === 'mixed';
      return '<div class="gm-card rounded-lg border p-3 ' + (on ? 'ring-2 ring-[rgb(176,28,35)]' : '') + '" data-i="' + i + '" data-status="' + u.status + '" style="border-left:6px solid ' + st.bar + ';background:' + (on ? '#fff' : '#fff') + '">' +
        '<div class="flex flex-wrap justify-between gap-2 text-xs mb-1"><span><span class="px-1.5 py-0.5 rounded font-semibold" style="background:' + st.bg + ';color:' + st.fg + '">' + st.label + '</span> ' +
          (gcseMark.mode === 'question' ? '<b>' + (u.codes.length > 1 ? '×' + u.codes.length + ' identical' : '') + '</b> <span class="text-gray-600" title="' + gmEsc(u.codes.map(function (c) { return gName(c) || c; }).join(', ')) + '">' + gmEsc(u.codes.slice(0, 6).map(function (c) { return gName(c) || c; }).join(', ') + (u.codes.length > 6 ? ' +' + (u.codes.length - 6) : '')) + '</span>' : '<b>' + gmEsc(u.q.id) + '</b> <span class="text-gray-500">[' + u.q.marks + ']</span> ' + gmEsc((u.q.text || '').slice(0, 90))) +
        '</span><span class="text-gray-500">' + (u.auto != null ? 'Auto: ' + u.auto + '/' + u.q.marks : 'No auto mark') + '</span></div>' +
        '<div class="gm-answer text-sm whitespace-pre-wrap rounded bg-gray-50 p-2 ' + (text ? '' : 'italic text-gray-400') + '">' + (text ? gmHighlight(text, kw) : 'Not attempted') + '</div>' +
        (u.reason ? '<div class="text-[11px] text-gray-500 mt-1">' + gmEsc(u.reason) + '</div>' : '') +
        '<div class="flex flex-wrap items-center gap-1 mt-2"><span class="text-xs text-gray-500 mr-1">Mark:</span>' +
          Array.apply(null, Array(u.q.marks + 1)).map(function (_, v) {
            var sel = !mixed && u.mark === v;
            return '<button type="button" class="gm-mark w-7 h-7 rounded border text-xs font-bold ' + (sel ? 'bg-[rgb(176,28,35)] text-white border-[rgb(176,28,35)]' : 'bg-white border-gray-300') + '" data-i="' + i + '" data-v="' + v + '">' + v + '</button>';
          }).join('') +
          (mixed ? '<span class="text-xs text-purple-700 ml-1">mixed marks</span>' : '') +
          '<button type="button" class="gm-accept ml-2 text-xs px-2 py-1 rounded border border-green-500 text-green-700" data-i="' + i + '" title="Key: Enter">✓ Accept</button></div>' +
        '<div class="flex flex-wrap gap-1 mt-2">' + choices.map(function (fc, k) {
          var n = u.fcodes[fc.id] || 0, all = n === u.codes.length;
          return '<button type="button" class="gm-code text-[11px] px-1.5 py-0.5 rounded border ' + (all ? 'bg-amber-100 border-amber-400 text-amber-900 font-semibold' : n ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200 text-gray-600') + '" data-i="' + i + '" data-code="' + gmEsc(fc.id) + '" title="' + gmEsc(fc.text) + '"><kbd class="text-gray-400">' + GM_CODE_KEYS.charAt(k).toUpperCase() + '</kbd> ' + gmEsc(fc.id) + (n && !all ? ' (' + n + ')' : '') + '</button>';
        }).join('') + '</div></div>';
    }).join('') + '</div>';
  }
  h += '<div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3"><div class="text-[11px] text-gray-500 rounded border border-gray-200 p-2"><b>Keys:</b> 0–9 mark · Enter accept · A accept all auto-marks in view · N next to check · J/K or ↓/↑ move · Q W E R T Y I O P L toggle feedback code · U or Ctrl+Z undo. Highlighted words match the mark scheme.</div>' +
    '<div class="text-[11px] text-gray-600 rounded border border-gray-200 p-2 max-h-28 overflow-y-auto" id="gm-history"><b>History</b>' + (gcseMark.history.length ? gcseMark.history.map(function (x) { return '<div>' + new Date(x.at).toLocaleTimeString('en-GB') + ' – ' + gmEsc(x.label) + '</div>'; }).join('') : '<div class="text-gray-400">No changes yet.</div>') + '</div></div>';
  root.innerHTML = h;
  gcseMark.units = units;
  // Bind
  root.querySelectorAll('.gm-mode').forEach(function (b) { b.onclick = function () { gcseMark.mode = b.dataset.mode; gcseMark.cursor = 0; gmRender(t); }; });
  root.querySelectorAll('.gm-cat').forEach(function (b) { b.onclick = function () { gcseMark.cat = b.dataset.cat; gcseMark.cursor = 0; gmRender(t); }; });
  root.querySelectorAll('.gm-q').forEach(function (b) { b.onclick = function () { gcseMark.q = b.dataset.q; gcseMark.cursor = 0; gmRender(t); }; });
  var ss = gEl('gm-student'); if (ss) ss.onchange = function () { gcseMark.student = ss.value; gcseMark.cursor = 0; gmRender(t); };
  var ns = gEl('gm-next-student'); if (ns) ns.onclick = function () { var i = studs.indexOf(gcseMark.student); gcseMark.student = studs[(i + 1) % studs.length]; gcseMark.cursor = 0; gmRender(t); };
  root.querySelectorAll('.gm-card').forEach(function (el) { el.onmousedown = function () { gcseMark.cursor = Number(el.dataset.i); root.querySelectorAll('.gm-card').forEach(function (x) { x.classList.toggle('ring-2', x === el); x.classList.toggle('ring-[rgb(176,28,35)]', x === el); }); }; });
  root.querySelectorAll('.gm-mark').forEach(function (b) { b.onclick = function () { var u = units[Number(b.dataset.i)]; gcseMark.cursor = Number(b.dataset.i); gmSetMark(t, u, Number(b.dataset.v)).then(function () { gmRender(t); }); }; });
  root.querySelectorAll('.gm-accept').forEach(function (b) { b.onclick = function () { gcseMark.cursor = Number(b.dataset.i); gmAccept(t, [units[Number(b.dataset.i)]]).then(function () { gmRender(t); }); }; });
  root.querySelectorAll('.gm-code').forEach(function (b) { b.onclick = function () { gcseMark.cursor = Number(b.dataset.i); gmToggleCode(t, units[Number(b.dataset.i)], b.dataset.code).then(function () { gmRender(t); }); }; });
  gEl('gm-bulk').onclick = function () { gmAccept(t, units.filter(function (u) { return u.statuses.indexOf('auto') !== -1; }).map(function (u) { return u; }), 'Accepted all auto-marks in view').then(function () { gmRender(t); }); };
  gEl('gm-undo').onclick = function () { gmUndo(t); };
}

// After a change: stay on the same card position (the list re-sorts / filters), or move on.
function gmAdvance(t, oldLen) {
  var units = gmUnits(t);
  if (units.length === oldLen) gcseMark.cursor = Math.min(gcseMark.cursor + 1, units.length - 1);
  gmRender(t);
  var card = document.querySelector('.gm-card[data-i="' + gcseMark.cursor + '"]');
  if (card && card.scrollIntoView) card.scrollIntoView({ block: 'nearest' });
}

function gmBindKeys(t) {
  if (gcseMark.keyHandler) document.removeEventListener('keydown', gcseMark.keyHandler);
  gcseMark.keyHandler = function (e) {
    var root = gEl('gcse-mark-root');
    if (!root || !root.isConnected || root.offsetParent === null) return;
    var tag = (e.target && e.target.tagName) || '';
    if (/INPUT|TEXTAREA|SELECT/.test(tag) || (e.target && e.target.isContentEditable)) return;
    var t2 = gcse.tests[gcse.testId]; if (!t2 || gcseMark.testId !== gcse.testId) return;
    var units = gcseMark.units || [], u = units[gcseMark.cursor];
    var k = e.key, lower = String(k).toLowerCase();
    if ((e.ctrlKey || e.metaKey) && lower === 'z') { e.preventDefault(); gmUndo(t2); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var len = units.length;
    if (/^[0-9]$/.test(k) && u) { e.preventDefault(); gmSetMark(t2, u, Number(k)).then(function () { gmAdvance(t2, len); }); return; }
    if (k === 'Enter' && u) { e.preventDefault(); gmAccept(t2, [u]).then(function () { gmAdvance(t2, len); }); return; }
    if (lower === 'a') { e.preventDefault(); gEl('gm-bulk') && gEl('gm-bulk').click(); return; }
    if (lower === 'u') { e.preventDefault(); gmUndo(t2); return; }
    if (lower === 'j' || k === 'ArrowDown') { e.preventDefault(); gcseMark.cursor = Math.min(gcseMark.cursor + 1, len - 1); gmRender(t2); return; }
    if (lower === 'k' || k === 'ArrowUp') { e.preventDefault(); gcseMark.cursor = Math.max(gcseMark.cursor - 1, 0); gmRender(t2); return; }
    if (lower === 'n') {
      e.preventDefault();
      for (var s = 1; s <= len; s++) {
        var j = (gcseMark.cursor + s) % len;
        if (units[j].statuses.some(function (x) { return x === 'unmarked' || x === 'needs'; })) { gcseMark.cursor = j; gmRender(t2); return; }
      }
      // nothing left in this view: jump to the next question (or student) with work to do
      if (gcseMark.mode === 'question') {
        var qs = t2.questions || [], qi = qs.map(function (q) { return q.id; }).indexOf(gcseMark.q);
        for (var m = 1; m <= qs.length; m++) {
          var q = qs[(qi + m) % qs.length], qc = gmCounts(t2, function (c2, qq) { return qq.id === q.id; });
          if (qc.unmarked + qc.needs) { gcseMark.q = q.id; gcseMark.cursor = 0; gmRender(t2); return; }
        }
      }
      gmFlash('Nothing left to check. 🎉');
      return;
    }
    var ci = GM_CODE_KEYS.indexOf(lower);
    if (ci !== -1 && u) {
      var fc = gmCodeChoices(u.q)[ci];
      if (fc) { e.preventDefault(); gmToggleCode(t2, u, fc.id).then(function () { gmRender(t2); }); }
    }
  };
  document.addEventListener('keydown', gcseMark.keyHandler);
}
