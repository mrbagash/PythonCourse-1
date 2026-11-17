/**
 * gcse-redo-module.js – "Redo my questions": every pupil redoes the questions THEY dropped marks on.
 *
 *  Pupil   AP Feedback → Redo my questions. Each question part they dropped marks on becomes a twin
 *          question (same skill and marks, new context and wording), laid out like an exam paper.
 *          A part is passed only with FULL marks on a twin. Not full marks → what was missing, then a
 *          different twin. Two failed tries → a revision link and a "needs you" flag for the teacher.
 *          Written answers can be appealed ("I think I'm right") – the pupil moves on, the teacher decides.
 *          14 days after finishing: one fresh twin per redone part ("check it stuck").
 *  Teacher Class feedback page: live tracker (progress, needs-you flags, before → after by topic),
 *          printable personal twin papers. GCSE tab: notifications (needs you + appeals), all classes.
 *
 *  Which twins?  1 the question's twin family (built-in papers: GCSE_PAPERS, found from question
 *                  numbers + marks, so nothing has to be set up);
 *                2 the bank IDs in the test's "Similar questions" row;
 *                3 otherwise bank questions on the same sub-topic, closest in marks.
 *
 *  Data (codes only, never names):
 *    classes/{class}/apFeedback/{testId}/redo   what the questions were + any non-built-in twins
 *    progress/{code}/redo/{testId}              { title, total, done, parts/{q}: { ok, tries, used, stuck, seen, appeal }, doneAt, check }
 */
var REDO = { stuckAfter: 2, checkDays: 14, session: null, notify: null };

// Teach-ICT (OCR J277) revision pages, by sub-topic first, then spec point.
var REDO_TI = 'https://www.teach-ict.com/2016/GCSE_Computing/OCR_J277/';
var REDO_LINKS = {
  '1.1.1': '1_1_systems_architecture/cpu/home_cpu.html', '1.1.1a': '1_1_systems_architecture/fetch_execute_cycle/home_fetch.html',
  '1.1.2': '1_1_systems_architecture/performance/home_performance.html', '1.1.3': '1_1_systems_architecture/embedded_system/home_embedded.html',
  '1.2.1': '1_2_memory/memory_types/home_memory.html', '1.2.2': '1_2_storage/secondary/home_secondary.html', '1.2.3': '1_2_units/units/home_units.html',
  '1.2.4': '1_2_numbers/binary/home_binary.html', '1.2.5': '1_2_numbers/compression/home_compression.html',
  '1.3.1': '1_3_networks/types/home_types.html', '1.3.2': '1_3_networks/protocol/home_protocol.html',
  '1.4.1': '1_4_issues/methods/home_methods.html', '1.4.2': '1_4_issues/prevention/home_prevention.html',
  '1.5.1': '1_5_op/op/home_op.html', '1.5.2': '1_5_op/util/home_util.html', '1.6.1': '1_6_law/law/home_law.html',
  '2.1.1': '2_1_algorithms/think/home_think.html', '2.1.2': '2_1_algorithms/pseudo/home_pseudo.html', '2.1.3': '2_1_sortsearch/search/home_search.html',
  '2.2.1': '2_2_programming/var/home_var.html', '2.2.1b': '2_2_programming/seq_iter_sel/home_seq.html', '2.2.1c': '2_2_programming/seq_iter_sel/home_seq.html', '2.2.1d': '2_2_programming/seq_iter_sel/home_seq.html',
  '2.2.2': '2_2_programming/types/home_types.html', '2.2.3': '2_2_programming/string/home_string.html', '2.2.3e': '2_2_programming/subs/home_sub.html',
  '2.3.1': '2_3_design/defense/home_defense.html', '2.3.2': '2_3_design/test/home_testing.html', '2.4.1': '2_4_computational_logic/logic/home_logic.html',
  '2.5.1': '2_5_language/languages/home_lang.html', '2.5.2': '2_5_language/languages/home_lang.html'
};
function redoLink(topic) {
  var tc = String(topic || ''), pt = (tc.match(/^\d\.\d\.\d/) || [''])[0];
  return REDO_TI + (REDO_LINKS[tc] || REDO_LINKS[pt] || 'OCR_J277_home.html');
}

// ── Which twins? ────────────────────────────────────────────────────────────
function redoKey(id) { return gSafeKey(id) || 'q'; }
function redoNormId(id) { return String(id || '').toLowerCase().replace(/^q(uestion)?\s*/, '').replace(/[^a-z0-9]/g, ''); }
// A built-in paper is recognised from its question numbers and marks: { questionId: paperQuestion }.
function redoPaperMap(questions) {
  if (typeof GCSE_PAPERS === 'undefined') return {};
  var out = {}, best = 0;
  Object.keys(GCSE_PAPERS).forEach(function (k) {
    var P = GCSE_PAPERS[k], by = {};
    P.questions.forEach(function (q) { by[redoNormId(q.id)] = q; });
    var m = {}, n = 0;
    (questions || []).forEach(function (q) { var pq = by[redoNormId(q.id)]; if (pq && Number(pq.marks) === Number(q.marks)) { m[q.id] = pq; n++; } });
    if (n >= Math.max(5, P.questions.length * 0.8) && n > best) { best = n; out = m; }
  });
  return out;
}
function redoRows() {
  var key = (typeof gcse !== 'undefined' && gcse._validatedKey) || 0;
  if (REDO._rows && REDO._rowsKey === key && REDO._rows.length) return REDO._rows;
  var rows = [];
  try { rows = gcseBankUsable().filter(function (v) { return ['mcq', 'short', 'code', 'table'].indexOf(v.row.type) !== -1; }).map(function (v) { return v.row; }); } catch (e) { rows = []; }
  REDO._rows = rows; REDO._rowsKey = (typeof gcse !== 'undefined' && gcse._validatedKey) || 0;
  return rows;
}
function redoTopicHit(a, b) { return a === b || String(a).indexOf(b) === 0 || String(b).indexOf(a) === 0; }
// Everything a twin needs to be asked and marked on a pupil's device (used for non-built-in bank questions).
function redoItem(r) {
  var it = { id: r.id, type: r.type, question: r.question, marks: r.marks, topics: r.topics || [], command: r.command || '', markScheme: r.markScheme || '', codes: r.codes || [], level: r.level || 3 };
  ['options', 'answerIndex', 'why', 'rules', 'model', 'codeTests', 'starterCode', 'table', 'answers', 'twin'].forEach(function (k) { if (r[k] != null && r[k] !== '') it[k] = r[k]; });
  return it;
}
// part = { id, marks, topics, tw, sim }. extra = { bankId: item } sent with the feedback.
function redoCandidates(part, extra) {
  var rows = redoRows(), out = [], seen = {};
  var add = function (r) { if (r && !seen[r.id]) { seen[r.id] = true; out.push(r); } };
  if (part.tw) rows.filter(function (r) { return r.twin === part.tw; }).forEach(add);
  var sim = GcseCore.asList(part.sim).map(function (x) { return String(x).toLowerCase(); });
  if (sim.length) {
    rows.filter(function (r) { return sim.indexOf(String(r.id).toLowerCase()) !== -1; }).forEach(add);
    Object.keys(extra || {}).forEach(function (k) { var it = extra[k]; if (it && sim.indexOf(String(it.id).toLowerCase()) !== -1) add(it); });
  }
  if (out.length) return out;
  var topics = part.topics || [];
  var pool = rows.filter(function (r) { return (r.topics || []).some(function (t) { return topics.some(function (pt) { return redoTopicHit(t, pt); }); }); });
  Object.keys(extra || {}).forEach(function (k) { var it = extra[k]; if (it && (it.topics || []).some(function (t) { return topics.some(function (pt) { return redoTopicHit(t, pt); }); })) pool.push(it); });
  pool.map(function (r) { return { r: r, s: Math.abs((Number(r.marks) || 1) - (Number(part.marks) || 1)) * 2 + Math.abs((r.level || 3) - 3) + (r.twin ? 0.5 : 0) }; })
    .sort(function (a, b) { return a.s - b.s; }).slice(0, 6).forEach(function (x) { add(x.r); });
  return out;
}
// The parts a pupil dropped marks on, from their released rubric.
function redoParts(rec, feedback) {
  var rubric = GcseCore.asList(rec && rec.rubric);
  var info = (feedback && feedback.redo && feedback.redo.qs) || {};
  var paper = redoPaperMap(rubric.map(function (c) { return { id: c.id, marks: c.marks }; }));
  return rubric.filter(function (c) { return Number(c.marks) > 0 && (c.attempted === false || Number(c.awarded) < Number(c.marks)); }).map(function (c) {
    var k = redoKey(c.id), I = info[k] || {}, pq = paper[c.id] || {};
    return { key: k, id: c.id, marks: Number(c.marks), awarded: c.attempted === false ? 0 : Number(c.awarded) || 0, attempted: c.attempted !== false, topics: c.topics || [],
      tw: I.tw || pq.twin || '', sim: I.sim || [], text: I.text || pq.text || '', ms: I.ms || pq.markScheme || '', model: I.model || pq.model || '' };
  });
}
function redoLabel(id) { var s = String(id || ''); return /^q/i.test(s) ? s : 'Q' + s; }
function redoLeft(parts, rec) { var P = (rec && rec.parts) || {}; return parts.filter(function (p) { return !(P[p.key] && P[p.key].ok); }).length; }

// ── Teacher: what goes out with the release ─────────────────────────────────
function redoReleaseInfo(t) {
  var paper = redoPaperMap(t.questions || []), qs = {}, bank = {}, ready = 0;
  (t.questions || []).forEach(function (q) {
    var pq = paper[q.id] || {};
    var part = { id: q.id, marks: q.marks, topics: q.topics || [], tw: q.twin || pq.twin || '', sim: GcseCore.asList(q.similar) };
    var I = { id: q.id };
    if (part.tw) I.tw = part.tw;
    if (part.sim.length) I.sim = part.sim;
    var text = q.text || pq.text, ms = q.markScheme || pq.markScheme, model = q.model || pq.model;
    if (text) I.text = String(text).slice(0, 1500);
    if (ms) I.ms = String(ms).slice(0, 1500);
    if (model) I.model = String(model).slice(0, 1500);
    var cands = redoCandidates(part, null);
    if (cands.length) ready++;
    // Questions from the teacher's own bank sheet are not on pupils' devices – send them along.
    cands.filter(function (r) { return !r.starter; }).slice(0, 4).forEach(function (r) { bank[redoKey(r.id)] = redoItem(r); });
    qs[redoKey(q.id)] = I;
  });
  return { qs: qs, bank: Object.keys(bank).length ? bank : null, ready: ready, total: (t.questions || []).length, at: Date.now() };
}

// ── Pupil: state ────────────────────────────────────────────────────────────
function redoRef(testId) { return state.db.ref('progress/' + state.uid + '/redo/' + testId); }
async function redoLoad(testId) {
  try { var s = await redoRef(testId).get(); return s.exists() ? (s.val() || {}) : {}; } catch (e) { return {}; }
}
function redoCheckDue(rec, parts) { return !!(rec && rec.doneAt && !rec.check && parts.length && Date.now() >= rec.doneAt + REDO.checkDays * 864e5); }

// The panel inside AP Feedback (below the checklist).
function redoPanelHtml(parts, rec, feedback) {
  var P = (rec && rec.parts) || {}, left = redoLeft(parts, rec);
  if (!parts.length) {
    return '<div id="gcse-redo" class="rounded-lg border border-green-200 bg-green-50 p-4"><div class="font-semibold text-green-900">Full marks on every question – nothing to redo.</div>' +
      '<button type="button" id="redo-stretch" class="mt-2 px-4 py-2 rounded-lg border border-green-700 text-green-900 font-semibold text-sm">Try the stretch questions</button></div>';
  }
  var chips = parts.map(function (p) {
    var d = P[p.key] || {};
    var cls = d.ok ? 'bg-green-100 text-green-800 border-green-300' : d.stuck ? 'bg-red-50 text-red-800 border-red-300' : 'bg-white text-gray-700 border-gray-300';
    return '<span class="redo-chip inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ' + cls + '" data-part="' + gEsc(p.key) + '" title="' + gEsc(p.topics.map(gTopicName).join(', ')) + ' – you got ' + p.awarded + ' / ' + p.marks + '">' +
      (d.ok ? '✅' : '🔁') + ' ' + gEsc(redoLabel(p.id)) + '</span>';
  }).join(' ');
  var due = redoCheckDue(rec, parts);
  return '<div id="gcse-redo" class="rounded-lg border-2 ' + (left ? 'border-[rgb(176,28,35)]' : 'border-green-300 bg-green-50') + ' p-4">' +
    '<div class="flex flex-wrap items-center gap-3"><div><div class="font-bold text-gray-900">' + (left ? 'Even better if – redo the questions you dropped marks on' : '🎉 Every question redone for full marks') + '</div>' +
    '<div class="text-sm text-gray-600">' + (left ? '<b>' + (parts.length - left) + ' of ' + parts.length + '</b> passed. Each one is a new version of your test question – you need <b>full marks</b> to pass it.' :
      (rec.check ? 'Check it stuck: ' + rec.check.right + ' of ' + rec.check.total + ' still right.' : due ? 'Two weeks on – can you still do them?' : 'In two weeks you will get one check question for each.')) + '</div></div>' +
    (left ? '<button type="button" id="redo-start" class="jhncc-primary ml-auto px-5 py-2.5 rounded-lg font-bold">' + (rec && rec.startedAt ? 'Carry on' : 'Redo my questions') + ' →</button>'
      : due ? '<button type="button" id="redo-check" class="jhncc-primary ml-auto px-5 py-2.5 rounded-lg font-bold">Check it stuck →</button>'
      : '<button type="button" id="redo-stretch" class="ml-auto px-4 py-2 rounded-lg border border-gray-400 font-semibold text-sm">Stretch questions</button>') + '</div>' +
    '<div class="mt-3 flex flex-wrap gap-1.5">' + chips + '</div></div>';
}
function redoBindPanel(root, feedback, rec, parts, state0, rerender) {
  var testId = feedback.assessmentId || rec.assessmentId;
  var hide = function () { var m = gEl('modal-student-ap-feedback'); if (m) m.classList.add('hidden'); };
  var show = function () { var m = gEl('modal-student-ap-feedback'); if (m) m.classList.remove('hidden'); if (rerender) rerender(); };
  var go = function (mode, key) { hide(); redoOpen({ testId: testId, feedback: feedback, rec: rec, parts: parts, mode: mode, startKey: key, onClose: show }); };
  if (gEl('redo-start')) gEl('redo-start').onclick = function () { go('redo'); };
  if (gEl('redo-check')) gEl('redo-check').onclick = function () { go('check'); };
  if (gEl('redo-stretch')) gEl('redo-stretch').onclick = function () { go('stretch'); };
  root.querySelectorAll('.redo-chip').forEach(function (c) {
    var d = ((state0 || {}).parts || {})[c.dataset.part] || {};
    if (d.ok) return;
    c.style.cursor = 'pointer';
    c.onclick = function () { go('redo', c.dataset.part); };
  });
}

// ── Pupil: the redo session ─────────────────────────────────────────────────
function redoModal(title) {
  hwCss();
  var m = gEl('modal-redo');
  if (!m) {
    m = document.createElement('div');
    m.id = 'modal-redo';
    m.className = 'fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-3 sm:p-6 overflow-y-auto';
    m.innerHTML = '<div class="xp-shell mt-2"><div class="xp-top"><div><h2 id="redo-title">Redo my questions</h2><div id="redo-sub" class="xp-sub"></div></div><span id="redo-count" class="xp-count"></span><button type="button" id="redo-close" class="xp-x" title="Close – your progress is saved">✕</button></div>' +
      '<div class="xp-track"><div id="redo-bar" class="xp-bar" style="width:0%"></div></div><div id="redo-chips" class="px-5 pt-3 flex flex-wrap gap-1.5"></div><div id="redo-body" class="xp-body"></div></div>';
    document.body.appendChild(m);
  }
  m.classList.remove('hidden');
  gEl('redo-sub').textContent = title || '';
  gEl('redo-close').onclick = function () { m.classList.add('hidden'); var S = REDO.session; REDO.session = null; redoStudentBanner(); if (S && S.onClose) S.onClose(); };
  return gEl('redo-body');
}
async function redoOpen(o) {
  var body = redoModal(o.rec.title || o.feedback.title || '');
  body.innerHTML = '<p class="text-gray-400 text-sm">Getting your questions…</p>';
  var rec = await redoLoad(o.testId);
  rec.parts = rec.parts || {};
  var S = REDO.session = { testId: o.testId, feedback: o.feedback, arec: o.rec, parts: o.parts, rec: rec, ref: redoRef(o.testId), mode: o.mode || 'redo', onClose: o.onClose, extra: (o.feedback.redo && o.feedback.redo.bank) || null, cur: o.startKey || null };
  if (S.mode === 'redo') {
    gEl('redo-title').textContent = 'Redo my questions';
    if (!rec.startedAt) {
      rec.startedAt = Date.now(); rec.total = S.parts.length; rec.done = S.parts.length - redoLeft(S.parts, rec); rec.title = o.rec.title || o.feedback.title || ''; rec.className = state.className || '';
      S.ref.update({ startedAt: rec.startedAt, total: rec.total, done: rec.done, title: rec.title, className: rec.className }).catch(function () {});
    }
    redoNext();
  } else redoStartList(S.mode);
}
function redoChips() {
  var S = REDO.session, box = gEl('redo-chips'); if (!box || !S) return;
  var done = S.parts.length - redoLeft(S.parts, S.rec);
  if (S.mode !== 'redo') { box.innerHTML = ''; return; }
  box.innerHTML = S.parts.map(function (p) {
    var d = S.rec.parts[p.key] || {}, cur = S.cur === p.key;
    return '<button type="button" class="redo-jump px-2 py-0.5 rounded-full border text-xs font-semibold ' + (d.ok ? 'bg-green-100 text-green-800 border-green-300' : cur ? 'bg-[rgb(176,28,35)] text-white border-[rgb(176,28,35)]' : 'bg-white text-gray-600 border-gray-300') + '" data-part="' + gEsc(p.key) + '"' + (d.ok ? ' disabled' : '') + '>' + (d.ok ? '✅ ' : '') + gEsc(redoLabel(p.id)) + '</button>';
  }).join('');
  box.querySelectorAll('.redo-jump').forEach(function (b) { b.onclick = function () { S.cur = b.dataset.part; redoNext(); }; });
  gEl('redo-bar').style.width = Math.round(done / (S.parts.length || 1) * 100) + '%';
  gEl('redo-count').textContent = done + ' of ' + S.parts.length + ' passed';
}
function redoPick(part) {
  var S = REDO.session, d = S.rec.parts[part.key] || {};
  var cands = redoCandidates(part, S.extra), used = GcseCore.asList(d.used);
  if (!cands.length) return null;
  var fresh = cands.filter(function (r) { return used.indexOf(r.id) === -1; });
  // All versions tried → start again from the one tried longest ago.
  return fresh[0] || cands.filter(function (r) { return r.id === used[0]; })[0] || cands[0];
}
function redoNext() {
  var S = REDO.session, body = gEl('redo-body'); if (!S || !body) return;
  var open = S.parts.filter(function (p) { return !(S.rec.parts[p.key] && S.rec.parts[p.key].ok); });
  if (!open.length) { S.cur = null; redoChips(); redoFinish(); return; }
  var part = open.filter(function (p) { return p.key === S.cur; })[0] || open[0];
  S.cur = part.key; S.part = part;
  redoChips();
  var q = redoPick(part), d = S.rec.parts[part.key] || {};
  S.q = q;
  var head = '<div class="xp-head"><span class="xp-num">Question ' + gEsc(String(part.id).replace(/^q/i, '')) + '</span><span class="xp-topic">' + gEsc(part.topics.map(gTopicName).slice(0, 2).join(' · ')) + '</span>' +
    (d.tries ? '<span class="xp-chip">try ' + (d.tries + 1) + '</span>' : '') + '<span class="xp-marks">[' + (q ? q.marks : part.marks) + ' mark' + ((q ? q.marks : part.marks) === 1 ? '' : 's') + ']</span></div>' +
    '<div class="text-xs text-gray-500 -mt-2 mb-3">In the test you got <b>' + part.awarded + ' / ' + part.marks + '</b>' + (part.attempted ? '' : ' (left blank)') + '. This is a new version of the same question – get <b>full marks</b> to pass it.</div>';
  if (!q) {
    // No matching question in the bank: correct the original against its mark scheme.
    body.innerHTML = head + (part.text ? '<div class="xp-q">' + hwQuestionTextHtml(part.text) + '</div>' : '<div class="xp-q"><p>Look at this question on your test paper.</p></div>') +
      '<div class="xp-label">Mark scheme</div><div class="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm whitespace-pre-wrap">' + gEsc(part.ms || part.model || 'Ask your teacher for the mark scheme for this question.') + '</div>' +
      '<div class="xp-label">Write the corrected answer</div><textarea id="hw-answer" rows="4" class="xp-lines" placeholder="Write a full-mark answer in your own words"></textarea>' +
      '<div class="xp-actions"><button type="button" id="redo-self" class="xp-check">I have corrected it</button><a class="xp-tool" target="_blank" rel="noopener" href="' + redoLink(part.topics[0]) + '">📘 Revise this on Teach-ICT</a></div>';
    gEl('redo-self').onclick = function () { var a = gEl('hw-answer').value.trim(); if (a.length < 8) { gEl('hw-answer').focus(); return; } redoSave(part, { ok: true, self: true, answer: a.slice(0, 600) }); redoNext(); };
    return;
  }
  body.innerHTML = head + '<div id="hw-q" class="xp-q">' + hwQuestionTextHtml(q.question) + '</div>' + hwAnswerHtml(q) +
    (d.tries >= REDO.stuckAfter ? redoHelpHtml(part) : '') + '<div id="hw-result" class="mt-3"></div>';
  hwBindAnswer(q, body, redoSubmit);
}
function redoHelpHtml(part) {
  return '<div class="redo-help mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950"><b>Stuck?</b> Revise this topic first, then try again. Your teacher has been told you need help with this one.' +
    (typeof gtRevisionLink !== 'function' || gtRevisionLink(part.topics[0]) ? '<div class="mt-2"><a class="inline-block px-3 py-1.5 rounded-lg bg-white border border-blue-300 font-semibold text-blue-800" target="_blank" rel="noopener" href="' + gEsc(typeof gtRevisionLink === 'function' ? gtRevisionLink(part.topics[0]) : redoLink(part.topics[0])) + '">📘 Revise ' + gEsc(gTopicName(part.topics[0] || '')) + (typeof gtRevisionLink === 'function' && !/teach-ict/.test(gtRevisionLink(part.topics[0])) ? '' : ' on Teach-ICT') + '</a></div>' : '') +
    (part.model ? '<details class="mt-2"><summary class="cursor-pointer font-semibold">Model answer to the question on your test</summary><div class="mt-1 whitespace-pre-wrap bg-white rounded p-2 border border-blue-100">' + gEsc(part.model) + '</div></details>' : '') + '</div>';
}
// Save one part's progress (and the done count the teacher's tracker reads).
function redoSave(part, change) {
  var S = REDO.session, d = S.rec.parts[part.key] || (S.rec.parts[part.key] = {});
  Object.keys(change).forEach(function (k) { d[k] = change[k]; });
  d.at = Date.now();
  var upd = {};
  upd['parts/' + part.key] = d;
  S.rec.done = S.parts.length - redoLeft(S.parts, S.rec);
  upd.done = S.rec.done; upd.total = S.parts.length; upd.lastAt = d.at;
  var needs = S.parts.filter(function (p) { var x = S.rec.parts[p.key]; return x && x.stuck && !x.ok; }).length;
  upd.needs = needs || null;
  if (!redoLeft(S.parts, S.rec) && !S.rec.doneAt) { S.rec.doneAt = Date.now(); upd.doneAt = S.rec.doneAt; }
  S.ref.update(upd).catch(function () {});
}
async function redoSubmit(answer) {
  var S = REDO.session, q = S.q, part = S.part, d = S.rec.parts[part.key] || {};
  var res = await hwMarkAny(q, answer);
  if (!REDO.session || REDO.session !== S) return;
  var used = GcseCore.asList(d.used).filter(function (id) { return id !== q.id; }); used.push(q.id);
  var tries = (d.tries || 0) + 1;
  if (gEl('hw-submit')) gEl('hw-submit').textContent = 'Checked';
  if (gEl('hw-try')) gEl('hw-try').disabled = true;
  if (typeof gcseRecordQuizAttempt === 'function' && (q.type === 'mcq' || q.type === 'short')) { try { gcseRecordQuizAttempt({ gcseQid: q.id, gcseTopics: q.topics, q: q.question, gcseCodes: res.codes }, q.type === 'mcq' ? q.options[Number(answer)] : answer, { marks: res.mark, max: res.max }, 'practice'); } catch (e) {} }
  var fb = hwFeedbackHtml(q, q.type === 'mcq' ? '' : answer, res).replace(/<div class="text-xs text-amber-800">A similar question will come back later in this homework\.<\/div>/, '');
  var box = gEl('hw-result');
  if (res.ok) {
    redoSave(part, { ok: true, tries: tries, used: used, stuck: null });
    var left = redoLeft(S.parts, S.rec);
    box.innerHTML = fb + '<div class="mt-2 rounded-lg bg-green-600 text-white font-bold px-3 py-2">✅ ' + gEsc(redoLabel(part.id)) + ' passed – full marks.</div>' +
      '<div class="xp-actions"><button type="button" id="redo-next" class="xp-check">' + (left ? 'Next question →' : 'Finish') + '</button></div>';
    redoChips();
    gEl('redo-next').onclick = function () { S.cur = null; redoNext(); };
    return;
  }
  var stuck = tries >= REDO.stuckAfter;
  redoSave(part, { ok: false, tries: tries, used: used, stuck: stuck ? true : (d.stuck || null), seen: stuck ? (d.seen || null) : null });
  var canAppeal = q.type === 'short';
  box.innerHTML = fb + '<div class="mt-2 text-sm font-semibold text-gray-800">' + res.mark + ' / ' + res.max + ' – you need full marks to pass. Read what was missing, then try a different version.</div>' +
    (stuck ? redoHelpHtml(part) : (typeof gtRevisionLinkHtml === 'function' && gtRevisionLink(part.topics[0]) ? '<div class="mt-2">' + gtRevisionLinkHtml(part.topics[0]) + '</div>' : '')) +
    '<div class="xp-actions"><button type="button" id="redo-again" class="xp-check">Try a different version →</button>' +
    (canAppeal ? '<button type="button" id="redo-appeal" class="xp-tool" style="border-color:#93c5fd;color:#1e40af">I think I\'m right – ask my teacher</button>' : '') +
    '<button type="button" id="redo-skip" class="xp-tool">Do another question first</button></div>';
  gEl('redo-again').onclick = function () { redoNext(); };
  gEl('redo-skip').onclick = function () {
    var open = S.parts.filter(function (p) { return !(S.rec.parts[p.key] && S.rec.parts[p.key].ok); });
    var i = open.map(function (p) { return p.key; }).indexOf(part.key);
    S.cur = open.length > 1 ? open[(i + 1) % open.length].key : part.key; redoNext();
  };
  if (gEl('redo-appeal')) gEl('redo-appeal').onclick = function () {
    try { gcseAddReview({ gcseQid: q.id, gcseTopics: q.topics, q: q.question, redo: { t: S.testId, k: part.key, id: part.id } }, answer, { marks: res.mark, max: res.max }, 'appeal'); } catch (e) {}
    redoSave(part, { ok: true, appeal: 'pending', stuck: null });
    S.cur = null; redoNext();
  };
}
function redoFinish() {
  var S = REDO.session, body = gEl('redo-body');
  gEl('redo-bar').style.width = '100%';
  gEl('redo-count').textContent = S.parts.length + ' of ' + S.parts.length + ' passed';
  var appeals = S.parts.filter(function (p) { return (S.rec.parts[p.key] || {}).appeal === 'pending'; }).length;
  body.innerHTML = '<div class="text-center py-6"><div class="text-5xl mb-2">🎉</div><p class="font-extrabold text-xl">Every question redone for full marks</p>' +
    '<p class="text-sm text-gray-600 mt-1">Your checklist has been updated.' + (appeals ? ' ' + appeals + ' answer' + (appeals === 1 ? ' is' : 's are') + ' waiting for your teacher to check.' : '') + ' In two weeks you will get one check question for each.</p>' +
    '<div class="xp-actions justify-center"><button type="button" id="redo-go-stretch" class="xp-check">Try the stretch questions →</button><button type="button" id="redo-done" class="xp-next">Back to my feedback</button></div></div>';
  gEl('redo-done').onclick = function () { gEl('redo-close').click(); };
  gEl('redo-go-stretch').onclick = function () { redoStartList('stretch'); };
}
// Stretch (harder questions on the test's topics) and the 14-day check: one go at each, no pass mark.
function redoStartList(mode) {
  var S = REDO.session; S.mode = mode;
  var items = [];
  if (mode === 'check') {
    S.parts.slice(0, 8).forEach(function (p) { var q = redoPick(p); if (q) items.push({ part: p, q: q }); });
    gEl('redo-title').textContent = 'Check it stuck';
  } else {
    var topics = {}; GcseCore.asList(S.arec.rubric).forEach(function (c) { (c.topics || []).forEach(function (t) { topics[t] = true; }); });
    var pool = redoRows().filter(function (r) { return (r.level || 3) >= 4 && !r.twin && (r.topics || []).some(function (t) { return Object.keys(topics).some(function (pt) { return redoTopicHit(t, pt); }); }); });
    pool.sort(function () { return Math.random() - 0.5; }).slice(0, 6).forEach(function (r) { items.push({ q: r }); });
    gEl('redo-title').textContent = 'Stretch questions';
  }
  S.list = { items: items, i: 0, right: 0, results: {} };
  redoChips();
  redoListNext();
}
function redoListNext() {
  var S = REDO.session, L = S.list, body = gEl('redo-body');
  gEl('redo-bar').style.width = Math.round(L.i / (L.items.length || 1) * 100) + '%';
  gEl('redo-count').textContent = L.i + ' of ' + L.items.length + ' done';
  if (L.i >= L.items.length) {
    var out = { at: Date.now(), right: L.right, total: L.items.length };
    if (S.mode === 'check') { out.parts = L.results; S.rec.check = out; S.ref.update({ check: out }).catch(function () {}); }
    else if (L.items.length) S.ref.update({ stretch: out }).catch(function () {});
    body.innerHTML = '<div class="text-center py-6">' + (L.items.length ? '<div class="text-4xl font-extrabold mb-1">' + L.right + ' / ' + L.items.length + '</div><p class="text-sm text-gray-600">' + (S.mode === 'check' ? 'still right two weeks later.' + (L.right < L.items.length ? ' The ones you missed will come back in your homework.' : '') : 'stretch questions right.') + '</p>'
      : '<p class="text-sm text-gray-600">There are no harder questions for these topics yet.</p>') + '<div class="xp-actions justify-center"><button type="button" id="redo-done" class="xp-next">Back to my feedback</button></div></div>';
    gEl('redo-done').onclick = function () { gEl('redo-close').click(); };
    return;
  }
  var it = L.items[L.i], q = it.q;
  S.q = q;
  body.innerHTML = '<div class="xp-head"><span class="xp-num">Question ' + (L.i + 1) + '</span><span class="xp-topic">of ' + L.items.length + ' · ' + gEsc((q.topics || []).map(gTopicName).slice(0, 2).join(' · ')) + '</span><span class="xp-marks">[' + q.marks + ' mark' + (q.marks === 1 ? '' : 's') + ']</span></div>' +
    '<div id="hw-q" class="xp-q">' + hwQuestionTextHtml(q.question) + '</div>' + hwAnswerHtml(q) + '<div id="hw-result" class="mt-3"></div>';
  hwBindAnswer(q, body, async function (answer) {
    var res = await hwMarkAny(q, answer);
    if (REDO.session !== S) return;
    if (res.ok) L.right++;
    if (it.part) L.results[it.part.key] = !!res.ok;
    if (gEl('hw-submit')) gEl('hw-submit').textContent = 'Checked';
    gEl('hw-result').innerHTML = hwFeedbackHtml(q, q.type === 'mcq' ? '' : answer, res).replace(/<div class="text-xs text-amber-800">A similar question will come back later in this homework\.<\/div>/, '') +
      '<div class="xp-actions"><button type="button" id="redo-next" class="xp-check">Next →</button></div>';
    gEl('redo-next').onclick = function () { L.i++; redoListNext(); };
  });
}

// Banner on the pupil's home screen: the newest released paper test with questions still to redo.
async function redoStudentBanner() {
  var old = gEl('redo-banner'); if (old) old.remove();
  if (!state || !state.uid || !state.className || state.isTeacher || state.isAdmin) return;
  var data;
  try {
    data = await Promise.all([state.db.ref('progress/' + state.uid + '/assessments').get(), state.db.ref('classes/' + state.className + '/apFeedback').get(), state.db.ref('progress/' + state.uid + '/redo').get()]);
  } catch (e) { return; }
  var ass = data[0].val() || {}, fbs = data[1].val() || {}, redo = data[2].val() || {};
  var pick = null;
  Object.keys(ass).forEach(function (id) {
    var rec = ass[id], fb = fbs[id];
    if (!rec || rec.type !== 'paper' || !fb || !fb.released) return;
    rec = Object.assign({ assessmentId: id }, rec);
    var parts = redoParts(rec, fb), st = redo[id] || {};
    var left = redoLeft(parts, st), due = redoCheckDue(st, parts);
    if (!left && !due) return;
    var at = fb.releasedAt || rec.completedAt || 0;
    if (!pick || at > pick.at) pick = { id: id, rec: rec, fb: Object.assign({ assessmentId: id }, fb), parts: parts, left: left, due: due, at: at, started: !!st.startedAt };
  });
  if (!pick) return;
  var host = gEl('app-content'); if (!host) return;
  var b = document.createElement('div');
  b.id = 'redo-banner';
  b.className = 'mx-auto max-w-5xl mt-2 mb-1 px-4 py-2 rounded-lg border border-red-300 bg-red-50 text-red-900 flex flex-wrap items-center gap-3 text-sm';
  b.innerHTML = '<span class="text-lg">🔁</span><span><b>' + gEsc(pick.rec.title || pick.fb.title || 'Your test') + ':</b> ' + (pick.left ? pick.left + ' question' + (pick.left === 1 ? '' : 's') + ' to redo for full marks' : 'check it stuck – ' + Math.min(8, pick.parts.length) + ' quick questions') + '</span>' +
    '<button type="button" id="redo-banner-go" class="jhncc-primary px-3 py-1 rounded font-semibold text-sm ml-auto">' + (pick.left ? (pick.started ? 'Carry on' : 'Start') : 'Start') + '</button>';
  host.insertBefore(b, host.firstChild);
  gEl('redo-banner-go').onclick = function () { redoOpen({ testId: pick.id, feedback: pick.fb, rec: pick.rec, parts: pick.parts, mode: pick.left ? 'redo' : 'check' }); };
}

// ── Teacher: live tracker on the Class feedback page ────────────────────────
function redoDroppedFor(t, row) {
  return redoParts({ rubric: gcseRubric(t, { marks: row.marks }) }, null);
}
async function redoRenderTracker(t, rows) {
  var root = gEl('redo-tracker'); if (!root) return;
  var sat = rows.filter(function (r) { return !r.missing && !r.absent; });
  var redo = {};
  await Promise.all(sat.map(function (r) { return state.db.ref('progress/' + r.code + '/redo/' + gcse.testId).get().then(function (s) { redo[r.code] = s.val() || {}; }).catch(function () { redo[r.code] = {}; }); }));
  root = gEl('redo-tracker'); if (!root) return;
  var info = sat.map(function (r) {
    var parts = redoDroppedFor(t, r), st = redo[r.code] || {}, P = st.parts || {};
    var done = parts.filter(function (p) { return P[p.key] && P[p.key].ok; }).length;
    var stuck = parts.filter(function (p) { return P[p.key] && P[p.key].stuck && !P[p.key].ok; });
    var appeals = parts.filter(function (p) { return P[p.key] && P[p.key].appeal === 'pending'; }).length;
    return { r: r, parts: parts, st: st, P: P, done: done, stuck: stuck, appeals: appeals };
  });
  var need = info.filter(function (x) { return x.parts.length; });
  var finished = need.filter(function (x) { return x.done === x.parts.length; }).length;
  var started = need.filter(function (x) { return x.st.startedAt && x.done < x.parts.length; }).length;
  var flags = info.filter(function (x) { return x.stuck.length; }).length;
  // Before → after, by topic: pupils who dropped marks on it → pupils who have now passed every one of those questions.
  var topics = {};
  info.forEach(function (x) {
    var mine = {};
    x.parts.forEach(function (p) { p.topics.forEach(function (tc) { var m = mine[tc] || (mine[tc] = { n: 0, ok: 0 }); m.n++; if (x.P[p.key] && x.P[p.key].ok) m.ok++; }); });
    Object.keys(mine).forEach(function (tc) { var T = topics[tc] || (topics[tc] = { code: tc, need: 0, fixed: 0 }); T.need++; if (mine[tc].ok === mine[tc].n) T.fixed++; });
  });
  var tlist = Object.keys(topics).map(function (k) { return topics[k]; }).sort(function (a, b) { return b.need - a.need; });
  var stat = function (n, label, cls) { return '<div class="rounded-lg border px-3 py-2 ' + (cls || 'border-gray-200') + '"><div class="text-xl font-extrabold leading-tight">' + n + '</div><div class="text-xs text-gray-600">' + label + '</div></div>'; };
  var h = '<div class="flex flex-wrap items-center gap-2 mb-2"><h4 class="font-bold text-gray-800">Pupils redoing their questions</h4><span class="text-xs text-gray-500">updates every 30 seconds</span><button type="button" id="redo-refresh" class="ml-auto text-xs px-2 py-1 rounded border border-gray-300">Refresh</button></div>' +
    '<div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">' + stat(finished + ' / ' + need.length, 'finished') + stat(started, 'working on it') + stat(need.length - finished - started, 'not started') + stat(flags, '🚩 need you', flags ? 'border-red-300 bg-red-50' : 'border-gray-200') + '</div>' +
    '<div class="overflow-x-auto"><table class="w-full text-sm border border-gray-200"><tr class="bg-gray-50 text-xs"><th class="p-1.5 text-left">Pupil</th><th class="p-1.5 text-left" style="min-width:11rem">Questions passed</th><th class="p-1.5 text-left">Needs you</th><th class="p-1.5">After 2 weeks</th></tr>' +
    info.slice().sort(function (a, b) { return (b.stuck.length - a.stuck.length) || ((a.parts.length ? a.done / a.parts.length : 2) - (b.parts.length ? b.done / b.parts.length : 2)); }).map(function (x) {
      var pct = x.parts.length ? Math.round(x.done / x.parts.length * 100) : 100;
      return '<tr class="border-t redo-row" data-code="' + gEsc(x.r.code) + '"><td class="p-1.5 whitespace-nowrap"><button type="button" class="gcse-profile-link hover:underline" data-code="' + gEsc(x.r.code) + '">' + gEsc(x.r.name || x.r.code) + '</button></td>' +
        '<td class="p-1.5">' + (x.parts.length ? '<div class="flex items-center gap-2"><div class="flex-1 h-2 bg-gray-200 rounded"><div class="h-2 rounded" style="width:' + pct + '%;background:' + (pct === 100 ? '#16a34a' : '#d97706') + '"></div></div><span class="text-xs whitespace-nowrap">' + x.done + ' / ' + x.parts.length + (x.st.startedAt ? '' : ' · not started') + '</span></div>' : '<span class="text-xs text-green-700">nothing to redo</span>') + '</td>' +
        '<td class="p-1.5">' + (x.stuck.length ? x.stuck.map(function (p) { return '<span class="redo-flag inline-block px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-xs font-semibold mr-1" title="' + gEsc(p.topics.map(gTopicName).join(', ')) + ' – ' + (x.P[p.key].tries || 0) + ' tries">🚩 ' + gEsc(redoLabel(p.id)) + '</span>'; }).join('') : '') +
          (x.appeals ? '<span class="inline-block px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-semibold">✋ ' + x.appeals + ' to check</span>' : '') + '</td>' +
        '<td class="p-1.5 text-center text-xs">' + (x.st.check ? x.st.check.right + ' / ' + x.st.check.total : '') + '</td></tr>';
    }).join('') + '</table></div>' +
    (tlist.length ? '<details class="mt-3"><summary class="cursor-pointer text-sm font-semibold text-blue-700">Before → after, by topic</summary><table class="w-full text-xs border border-gray-200 mt-2"><tr class="bg-gray-50"><th class="p-1 text-left">Topic</th><th class="p-1">Dropped marks</th><th class="p-1">Now fixed</th></tr>' +
      tlist.map(function (T) { return '<tr class="border-t"><td class="p-1">' + gEsc(gTopicName(T.code)) + '</td><td class="p-1 text-center">' + T.need + '</td><td class="p-1 text-center font-semibold" style="' + gRag(T.need ? T.fixed / T.need * 100 : 100) + '">' + T.fixed + '</td></tr>'; }).join('') + '</table></details>' : '');
  root.innerHTML = h;
  root.querySelectorAll('.gcse-profile-link').forEach(function (b) { b.onclick = function () { openGcseProfile(b.dataset.code); }; });
  gEl('redo-refresh').onclick = function () { redoRenderTracker(t, rows); };
  clearTimeout(REDO._timer);
  REDO._timer = setTimeout(function () { if (gEl('redo-tracker') && !document.hidden) redoRenderTracker(t, rows); }, 30000);
}

// Printable personal twin paper (for pupils without a device): one twin for every part they dropped marks on.
function redoPrintPapers(t, rows) {
  var paper = redoPaperMap(t.questions || []);
  var html = rows.filter(function (r) { return !r.missing && !r.absent; }).map(function (r) {
    var parts = redoDroppedFor(t, r).map(function (p) {
      var q = (t.questions || []).filter(function (x) { return x.id === p.id; })[0] || {};
      p.tw = q.twin || (paper[p.id] || {}).twin || ''; p.sim = GcseCore.asList(q.similar);
      return p;
    });
    if (!parts.length) return '';
    var total = 0;
    var body = parts.map(function (p, i) {
      var c = redoCandidates(p, null), q = c.length ? c[(String(r.code).length + i) % c.length] : null;
      if (!q) return '<div class="q"><b>' + gEsc(redoLabel(p.id)) + '</b> – correct this question on your test paper using the mark scheme. <b>[' + p.marks + ']</b><div class="lines"></div><div class="lines"></div><div class="lines"></div></div>';
      total += Number(q.marks) || 0;
      var ans = '';
      if (q.type === 'mcq') ans = '<div>' + q.options.map(function (o, k) { return '<div style="margin:3px 0;white-space:pre-wrap">☐ <b>' + String.fromCharCode(65 + k) + '</b> ' + gEsc(o) + '</div>'; }).join('') + '</div>';
      else if (q.type === 'table' && q.table) ans = '<table><tr>' + q.table.head.map(function (hd) { return '<th>' + gEsc(hd) + '</th>'; }).join('') + '</tr>' + q.table.rows.map(function (row) { return '<tr>' + row.map(function (c2) { return '<td style="height:24px">' + gEsc(c2) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>';
      else { for (var n = 0; n < Math.max(2, Math.min(12, (Number(q.marks) || 1) * 2)); n++) ans += '<div class="lines"></div>'; }
      return '<div class="q"><div style="white-space:pre-wrap"><b>' + (i + 1) + '</b> &nbsp;<span class="muted">(redo of ' + gEsc(redoLabel(p.id)) + ')</span><br>' + gEsc(q.question) + '</div>' + ans + '<div style="text-align:right"><b>[' + q.marks + ']</b></div></div>';
    }).join('');
    return '<div class="slip"><h1>' + gEsc(r.name || r.code) + '</h1><div class="muted">' + gEsc(t.title) + ' · redo paper · ' + parts.length + ' question' + (parts.length === 1 ? '' : 's') + ' · ' + total + ' marks · you need full marks on each question to pass it</div>' + body + '</div>';
  }).join('');
  gPrint('Redo papers – ' + t.title, html || '<p>Nobody has anything to redo.</p>');
}

// ── Teacher: notifications (GCSE tab) – needs-you flags and "I think I'm right" requests, all GCSE classes ──
async function redoLoadNotifications(force) {
  if (REDO.notify && !force && Date.now() - REDO.notify.at < 30000) return REDO.notify;
  var classes = [];
  try { classes = typeof gcseClassNamesOnly === 'function' ? await gcseClassNamesOnly() : []; } catch (e) { classes = []; }
  var items = [];
  await Promise.all(classes.map(async function (cls) {
    var codes = []; try { codes = await gcseLoadClassCodes(cls); } catch (e) { codes = []; }
    await Promise.all(codes.map(async function (code) {
      var r = await Promise.all([state.db.ref('progress/' + code + '/redo').get().catch(function () { return null; }), state.db.ref('progress/' + code + '/gcseReview').get().catch(function () { return null; })]);
      var redo = (r[0] && r[0].val()) || {}, rev = (r[1] && r[1].val()) || {};
      Object.keys(redo).forEach(function (testId) {
        var st = redo[testId] || {};
        Object.keys(st.parts || {}).forEach(function (k) {
          var d = st.parts[k];
          if (d && d.stuck && !d.ok && !d.seen) items.push({ kind: 'needs', cls: cls, code: code, testId: testId, part: k, tries: d.tries || 0, title: st.title || 'Test', at: d.at || st.lastAt || 0 });
        });
      });
      Object.keys(rev).forEach(function (k) { var v = rev[k]; if (v && v.status === 'pending') items.push(Object.assign({ kind: 'review', cls: cls, code: code, key: k }, v)); });
    }));
  }));
  items.sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
  REDO.notify = { at: Date.now(), items: items };
  return REDO.notify;
}
// Accept / reject an "I think I'm right" (or marker-unsure) answer. Rejecting a redo answer re-opens that question.
async function gcseDecideReview(it, ok) {
  var updates = {};
  updates['progress/' + it.code + '/gcseReview/' + it.key + '/status'] = ok ? 'accepted' : 'rejected';
  updates['progress/' + it.code + '/gcseReview/' + it.key + '/decidedAt'] = Date.now();
  if (it.redo && it.redo.t && it.redo.k) {
    var base = 'progress/' + it.code + '/redo/' + it.redo.t + '/';
    updates[base + 'parts/' + it.redo.k + '/appeal'] = ok ? 'accepted' : 'rejected';
    if (!ok) { updates[base + 'parts/' + it.redo.k + '/ok'] = false; updates[base + 'doneAt'] = null; }
  }
  await state.db.ref().update(updates);
  if (!ok && it.redo && it.redo.t) { try { await state.db.ref('progress/' + it.code + '/redo/' + it.redo.t + '/done').transaction(function (n) { return Math.max(0, (n || 0) - 1); }); } catch (e) {} }
  if (ok && it.auto < it.max) (it.topics || []).forEach(function (tc) { state.db.ref('progress/' + it.code + '/gcseQuiz/' + gTopicKey(tc) + '/correct').transaction(function (c) { return (c || 0) + 1; }, null, false); });
}
(function () {
  if (typeof updateAuthUI !== 'function') return;
  var orig = updateAuthUI;
  updateAuthUI = function (first, last, isAdmin, isTeacher) {
    var r = orig.apply(this, arguments);
    var b = gEl('redo-banner'); if (b) b.remove();
    REDO.notify = null; REDO._rows = null;
    if (!isAdmin && !isTeacher) setTimeout(function () { if (state.uid && !state.isTeacher && !state.isAdmin) redoStudentBanner(); }, 900);
    return r;
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = { redoPaperMap: redoPaperMap, redoNormId: redoNormId, redoLink: redoLink };
