/**
 * gcse-wcf-module.js – Whole-class feedback cycle for GCSE tests.
 *
 * Built on the EEF feedback guidance (2021): focus on the few misconceptions
 * that affect most pupils, show what good looks like, make pupils ACT on the
 * feedback, test transfer on a new question, and check it stuck later.
 *
 *  1 Analyse  – misconceptions (feedback codes) by number of pupils, what went
 *               well with anonymised best answers, not-attempted kept separate.
 *  2 Plan     – at most 3 focuses: explanation, model answer, a NEW transfer
 *               question and a later check question; pupils sorted into
 *               secure (stretch) / misconception (correct it) / big gap
 *               (worked example first).
 *  3 Deliver  – presenter view (no names) and a printable WCF sheet.
 *  4 Act      – pupils: see their answer → correct it → say why it was wrong
 *               → answer the new question. Grade shown after the tasks.
 *               Teachers: Actions tab.
 *  5 Check    – 14 days later one question per focus; Impact line.
 *
 * Data (codes only, never names):
 *   gcse/wcf/{testId}                          the plan (staff only)
 *   classes/{class}/apFeedback/{testId}/wcf    what pupils need (on release)
 *   progress/{code}/dirt/{testId}/{focusId}    tier, original answer, their work
 */
var WCF_CHECK_DAYS = 14;
var WCF_TIERS = { secure: { label: 'Secure – stretch', short: 'Secure', cls: 'bg-green-100 text-green-800' }, misc: { label: 'Misconception – correct it', short: 'Correct it', cls: 'bg-amber-100 text-amber-900' }, gap: { label: 'Big gap – worked example first', short: 'Big gap', cls: 'bg-red-100 text-red-800' } };
var wcf = { plan: null, testId: null, step: 'analyse' };

function wEsc(v) { return gEsc(v); }
function wList(v) { return GcseCore.asList(v); }

// ── 1. Analyse ──────────────────────────────────────────────────────────────
function wcfAnalyse(t, rows) {
  var res = gcse.results || {};
  var sat = rows.filter(function (r) { return !r.missing && !r.absent; });
  var qById = {}; (t.questions || []).forEach(function (q) { qById[q.id] = q; });
  var codes = {};
  sat.forEach(function (r) {
    var rc = (res[r.code] && res[r.code].codes) || {};
    Object.keys(rc).forEach(function (qid) {
      wList(rc[qid]).forEach(function (id) {
        id = String(id).toUpperCase();
        var C = codes[id] || (codes[id] = { id: id, info: J277.feedbackCode(id), students: {}, questions: {}, examples: [] });
        C.students[r.code] = true; C.questions[qid] = true;
        var resp = res[r.code].responses ? res[r.code].responses[qid] : '';
        if (resp && qById[qid] && qById[qid].type !== 'mcq' && C.examples.length < 3) C.examples.push({ qid: qid, text: String(resp) });
      });
    });
  });
  var misconceptions = Object.keys(codes).map(function (k) { var C = codes[k]; C.n = Object.keys(C.students).length; C.qids = Object.keys(C.questions); return C; })
    .sort(function (a, b) { return (a.id === 'E4') - (b.id === 'E4') || b.n - a.n; });
  // Best (full-mark) answers to written questions, anonymised.
  var best = [];
  (t.questions || []).forEach(function (q) {
    if (q.type === 'mcq') return;
    var top = null;
    sat.forEach(function (r) {
      var rr = res[r.code]; if (!rr || !rr.responses || !rr.responses[q.id]) return;
      var m = rr.marks ? rr.marks[q.id] : null;
      if (m != null && (!top || m > top.mark)) top = { qid: q.id, mark: Number(m), max: q.marks, text: String(rr.responses[q.id]) };
    });
    if (top && top.mark >= q.marks && q.marks > 0) best.push(top);
  });
  var stats = gcseTopicStats(t, rows);
  var notAttempted = stats.questions.filter(function (q) { return q.notAttempted; }).map(function (q) { return { id: q.id, n: q.notAttempted }; }).sort(function (a, b) { return b.n - a.n; });
  var wrongCount = stats.questions.map(function (q) {
    var wrong = sat.filter(function (r) { var v = r.marks[q.id]; return v != null && Number(v) < q.marks; }).length;
    return { id: q.id, wrong: wrong };
  });
  return { sat: sat, misconceptions: misconceptions, best: best, stats: stats, notAttempted: notAttempted, wrongCount: wrongCount };
}

function wcfAnalyseHtml(t, A) {
  var n = A.sat.length;
  var h = '<div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">';
  h += '<div class="lg:col-span-2 border border-gray-200 rounded-lg p-3"><h4 class="font-bold text-gray-800 mb-2">Misconceptions <span class="text-xs font-normal text-gray-500">(from the feedback codes on marked answers – most pupils first)</span></h4>' +
    (A.misconceptions.length ? '<table class="w-full text-sm"><tr class="text-xs text-gray-500 text-left"><th class="p-1">Code</th><th class="p-1">Misconception</th><th class="p-1 text-center">Pupils</th><th class="p-1">Questions</th></tr>' +
      A.misconceptions.slice(0, 8).map(function (C) {
        return '<tr class="border-t"><td class="p-1"><span class="px-1.5 rounded bg-amber-100 text-amber-900 font-bold text-xs">' + wEsc(C.id) + '</span></td><td class="p-1">' + wEsc(C.info ? C.info.text : '') + '</td>' +
          '<td class="p-1 text-center"><b>' + C.n + '</b> <span class="text-xs text-gray-500">of ' + n + '</span></td><td class="p-1 text-xs">' + wEsc(C.qids.join(', ')) + '</td></tr>';
      }).join('') + '</table>' : '<p class="text-sm text-gray-500">No feedback codes yet. Codes are suggested automatically on online tests and you can add them in <b>Mark answers</b>. Topics below still show where marks were lost.</p>') + '</div>';
  h += '<div class="border border-gray-200 rounded-lg p-3"><h4 class="font-bold text-gray-800 mb-2">What went well</h4><ul class="text-sm list-disc ml-5">' +
    (A.stats.best.length ? A.stats.best.map(function (T) { return '<li>' + wEsc(T.label) + ' (' + T.pct + '%)</li>'; }).join('') : '<li>–</li>') + '</ul>' +
    (A.best.length ? '<div class="text-xs text-gray-500 mt-2 mb-1">Full-mark answers (anonymised – use as examples):</div>' + A.best.slice(0, 2).map(function (b) {
      return '<div class="text-xs bg-green-50 border border-green-200 rounded p-2 mb-1"><b>' + wEsc(b.qid) + '</b> ' + wEsc(b.text.slice(0, 220)) + '</div>';
    }).join('') : '') +
    (A.notAttempted.length ? '<h4 class="font-bold text-gray-800 mt-3 mb-1 text-sm">Not attempted <span class="text-xs font-normal text-gray-500">(time / exam technique, not knowledge)</span></h4><div class="text-xs">' +
      A.notAttempted.slice(0, 5).map(function (q) { return wEsc(q.id) + ': ' + q.n; }).join(' · ') + '</div>' : '') + '</div></div>';
  return h;
}

// ── 2. Plan ─────────────────────────────────────────────────────────────────
function wcfCandidates(t, A) {
  var out = [];
  A.misconceptions.forEach(function (C) {
    if (!C.info) return;
    var topic = (C.info.topics || [])[0] || ((t.questions || []).filter(function (q) { return C.qids.indexOf(q.id) !== -1; })[0] || {}).topics && ((t.questions || []).filter(function (q) { return C.qids.indexOf(q.id) !== -1; })[0].topics || [])[0];
    out.push({ key: 'code:' + C.id, code: C.id, topic: topic || '', title: C.info.text, n: C.n, qids: C.qids });
  });
  A.stats.reteach.forEach(function (T) {
    var qids = (t.questions || []).filter(function (q) { return (q.topics || []).indexOf(T.code) !== -1; }).map(function (q) { return q.id; });
    var n = A.sat.filter(function (r) { var p = T.per[r.code]; return p && p.a < p.p; }).length;
    out.push({ key: 'topic:' + T.code, code: null, topic: T.code, title: J277.label(T.code), n: n, qids: qids });
  });
  return out;
}
function wcfBankChoices(t, topic) {
  if (!topic || typeof gcseQuestionsForTopics !== 'function') return [];
  var used = {}; (t.questions || []).forEach(function (q) { if (q.bankId) used[String(q.bankId).toLowerCase()] = true; });
  var list = [];
  try { list = gcseQuestionsForTopics([topic], ['mcq', 'short']); } catch (e) { list = []; }
  if (!list.length) { var pt = J277.point(topic); if (pt) try { list = gcseQuestionsForTopics([pt.code], ['mcq', 'short']); } catch (e) { list = []; } }
  return list.filter(function (v) { return !used[String(v.row.id).toLowerCase()]; }).map(gcsePracticeItem);
}
function wcfTiers(t, focus, rows) {
  var res = gcse.results || {}, tiers = {};
  var qs = (t.questions || []).filter(function (q) { return focus.qids.indexOf(q.id) !== -1; });
  rows.filter(function (r) { return !r.missing && !r.absent; }).forEach(function (r) {
    var a = 0, p = 0, attempted = 0, hasCode = false;
    qs.forEach(function (q) {
      var v = r.marks[q.id];
      if (v != null) { attempted++; a += Number(v) || 0; }
      p += q.marks;
      if (focus.code && wList(((res[r.code] || {}).codes || {})[q.id]).map(function (x) { return String(x).toUpperCase(); }).indexOf(focus.code) !== -1) hasCode = true;
    });
    var pct = p ? a / p : 0;
    // A named misconception → "correct it"; nothing written, or very low with no specific misconception → big gap.
    tiers[r.code] = (!attempted || (pct < 0.3 && !hasCode)) ? 'gap' : (hasCode || pct < 0.8) ? 'misc' : 'secure';
  });
  return tiers;
}
function wcfNewFocus(t, cand, rows, idx) {
  var q0 = (t.questions || []).filter(function (q) { return cand.qids.indexOf(q.id) !== -1; })[0] || {};
  var info = cand.code ? J277.feedbackCode(cand.code) : null;
  var choices = wcfBankChoices(t, cand.topic);
  var f = {
    id: 'f' + (idx + 1) + '_' + Date.now().toString(36).slice(-4), key: cand.key, code: cand.code, topic: cand.topic, qids: cand.qids,
    title: cand.code ? cand.code + ' – ' + (info ? info.text : '') : cand.title,
    explain: info ? info.text : 'Revisit ' + J277.label(cand.topic) + '.',
    model: q0.markScheme || '',
    transfer: choices[0] || null, check: choices[1] || choices[0] || null
  };
  f.tiers = wcfTiers(t, f, rows);
  return f;
}
function wcfSuggestPlan(t, rows, A) {
  var cands = wcfCandidates(t, A).filter(function (c) { return c.n > 0; });
  var picked = [], topics = {};
  cands.forEach(function (c) { if (picked.length < 3 && !topics[c.key] && !(c.code === null && topics['t:' + c.topic])) { picked.push(c); topics[c.key] = true; topics['t:' + c.topic] = true; } });
  return { gradeAfter: true, focuses: picked.map(function (c, i) { return wcfNewFocus(t, c, rows, i); }), createdAt: Date.now() };
}
async function wcfLoadPlan(testId) {
  try { var s = await state.db.ref('gcse/wcf/' + testId).get(); return s.exists() ? s.val() : null; } catch (e) { return null; }
}
function wcfNormalisePlan(plan) {
  if (!plan) return null;
  plan.focuses = wList(plan.focuses).map(function (f) { f.qids = wList(f.qids); f.tiers = f.tiers || {}; return f; });
  return plan;
}
async function wcfSavePlan(testId, plan) {
  plan.savedAt = Date.now();
  await state.db.ref('gcse/wcf/' + testId).set(JSON.parse(JSON.stringify(plan)));
}

function wcfStepper(step, released) {
  var steps = [['analyse', '1 Analyse'], ['plan', '2 Plan'], ['deliver', '3 Deliver'], ['act', '4 Pupils act'], ['check', '5 Check it stuck']];
  return '<div class="flex flex-wrap gap-1 mb-3">' + steps.map(function (s) {
    var on = s[0] === step;
    return '<button type="button" class="wcf-step text-xs px-3 py-1.5 rounded-full border ' + (on ? 'border-[rgb(176,28,35)] bg-[rgb(176,28,35)] text-white font-semibold' : 'border-gray-300 bg-white text-gray-700') + '" data-step="' + s[0] + '">' + s[1] + '</button>';
  }).join('') + '<span class="text-xs text-gray-500 self-center ml-2">' + (released ? 'Tasks released to pupils.' : 'Plan, then release from the Release tab.') + '</span></div>';
}

// Called after the Class feedback tab renders.
async function wcfRender(t, rows) {
  var root = gEl('wcf-root'); if (!root) return;
  if (wcf.testId !== gcse.testId) { wcf = { plan: null, testId: gcse.testId, step: 'analyse' }; }
  var A = wcfAnalyse(t, rows);
  if (!wcf.plan) {
    root.innerHTML = '<p class="text-xs text-gray-400">Loading plan…</p>';
    var saved = wcfNormalisePlan(await wcfLoadPlan(gcse.testId));
    if (!gEl('wcf-root')) return;
    wcf.plan = saved || wcfSuggestPlan(t, rows, A);
    wcf.saved = !!saved;
  }
  wcfDraw(t, rows, A);
}
function wcfDraw(t, rows, A) {
  var root = gEl('wcf-root'); if (!root) return;
  var plan = wcf.plan;
  var released = !!plan.releasedAt;
  var h = wcfStepper(wcf.step, released);
  var analysisBox = gEl('wcf-analysis');
  if (analysisBox) analysisBox.classList.toggle('hidden', wcf.step !== 'analyse');
  if (wcf.step === 'analyse') {
    h += wcfAnalyseHtml(t, A) + '<p class="text-xs text-gray-500 mb-2">Below: topics, intervention groups, heatmap and questions. Next: <button type="button" class="wcf-step underline text-blue-700" data-step="plan">2 Plan</button>.</p>';
  } else if (wcf.step === 'plan') {
    h += wcfPlanHtml(t, rows, A);
  } else if (wcf.step === 'deliver') {
    h += '<div class="border border-gray-200 rounded-lg p-4 text-sm space-y-3"><p><b>Deliver the feedback (about 15–20 minutes).</b> Show what went well, re-teach each focus with the model answer, fix an anonymous wrong answer together, then pupils do their tasks.</p>' +
      '<div class="flex flex-wrap gap-2"><button type="button" id="wcf-present" class="jhncc-primary px-4 py-2 rounded font-semibold">▶ Present (no names)</button><button type="button" id="wcf-print" class="px-4 py-2 rounded border border-gray-300 font-semibold">Print WCF sheet</button></div>' +
      (plan.focuses.length ? '' : '<p class="text-amber-700">Add at least one focus in 2 Plan first.</p>') + '</div>';
  } else if (wcf.step === 'act') {
    h += '<div class="border border-gray-200 rounded-lg p-4 text-sm"><p>' + (released ? 'Pupils have their tasks. Follow their progress in the <button type="button" class="wcf-go-actions underline text-blue-700">Actions</button> tab.' :
      'When you click <b>Release feedback</b> (Release tab), each pupil gets a <b>Feedback tasks</b> banner when they log in: see their answer → correct it → say why it was wrong → answer a new question.' + (plan.gradeAfter ? ' Their grade appears once the tasks are done.' : '')) + '</p></div>';
  } else {
    h += '<div class="border border-gray-200 rounded-lg p-4 text-sm">' + (released ? '<p>Check it stuck opens for pupils on <b>' + new Date(plan.releasedAt + WCF_CHECK_DAYS * 864e5).toLocaleDateString('en-GB') + '</b> (' + WCF_CHECK_DAYS + ' days after release): one new question per focus. Results and the impact of this feedback are in the <button type="button" class="wcf-go-actions underline text-blue-700">Actions</button> tab.</p>' :
      '<p>' + WCF_CHECK_DAYS + ' days after release each pupil gets one new question per focus, to see whether the correction stuck.</p>') + '</div>';
  }
  root.innerHTML = h;
  root.querySelectorAll('.wcf-step').forEach(function (b) { b.onclick = function () { wcf.step = b.dataset.step; wcfDraw(t, rows, A); }; });
  root.querySelectorAll('.wcf-go-actions').forEach(function (b) { b.onclick = function () { gcse.viewTab = 'actions'; gcseRenderTest(); }; });
  if (gEl('wcf-present')) gEl('wcf-present').onclick = function () { wcfPresent(t, rows, A); };
  if (gEl('wcf-print')) gEl('wcf-print').onclick = function () { wcfPrintSheet(t, rows, A); };
  if (wcf.step === 'plan') wcfBindPlan(t, rows, A);
}

function wcfQuestionLabel(item) {
  if (!item) return 'None';
  return (item.type === 'mcq' ? 'MCQ' : 'Short') + ' · ' + String(item.q || '').slice(0, 70);
}
function wcfPlanHtml(t, rows, A) {
  var plan = wcf.plan;
  var cands = wcfCandidates(t, A);
  var sat = rows.filter(function (r) { return !r.missing && !r.absent; });
  var h = '<div class="rounded border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 mb-3">Pick <b>up to 3</b> focuses – the misconceptions affecting most pupils. For each, give a short explanation and a model answer, and choose a <b>new question</b> on the same idea (transfer) plus one for the 2-week check. Pupils are sorted automatically; change anyone\'s group if needed.</div>';
  h += plan.focuses.map(function (f, i) {
    var choices = wcfBankChoices(t, f.topic);
    var opts = function (sel) {
      var ids = {}; var all = choices.slice(); if (sel && !choices.some(function (c) { return c.id === sel.id; })) all.unshift(sel);
      return '<option value="">– none –</option>' + all.filter(function (c) { if (ids[c.id]) return false; ids[c.id] = true; return true; }).map(function (c) {
        return '<option value="' + wEsc(c.id) + '"' + (sel && sel.id === c.id ? ' selected' : '') + '>' + wEsc(wcfQuestionLabel(c)) + '</option>';
      }).join('');
    };
    var counts = { secure: 0, misc: 0, gap: 0 }; Object.keys(f.tiers || {}).forEach(function (c) { counts[f.tiers[c]] = (counts[f.tiers[c]] || 0) + 1; });
    return '<div class="wcf-focus border border-gray-200 rounded-lg p-3 mb-3" data-i="' + i + '"><div class="flex flex-wrap items-center gap-2 mb-2"><span class="font-bold">Focus ' + (i + 1) + '</span>' +
      '<select class="wcf-f-cand border border-gray-300 rounded px-2 py-1 text-xs max-w-md" data-i="' + i + '">' + cands.map(function (c) {
        return '<option value="' + wEsc(c.key) + '"' + (c.key === f.key ? ' selected' : '') + '>' + wEsc((c.code ? c.code + ' ' : '') + c.title.slice(0, 70)) + ' – ' + c.n + ' pupil' + (c.n === 1 ? '' : 's') + '</option>';
      }).join('') + '</select><button type="button" class="wcf-f-del ml-auto text-xs text-red-600" data-i="' + i + '">Remove</button></div>' +
      '<div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs"><label>Title (pupils see this)<input class="wcf-f-field w-full border border-gray-300 rounded px-2 py-1 text-sm" data-i="' + i + '" data-k="title" value="' + wEsc(f.title) + '"></label>' +
      '<label>Questions it came from<input class="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-gray-50" value="' + wEsc(f.qids.join(', ')) + '" disabled></label>' +
      '<label class="md:col-span-1">Explanation – what is wrong and why<textarea class="wcf-f-field w-full border border-gray-300 rounded px-2 py-1 text-sm" rows="3" data-i="' + i + '" data-k="explain">' + wEsc(f.explain) + '</textarea></label>' +
      '<label>Model answer – what good looks like<textarea class="wcf-f-field w-full border border-gray-300 rounded px-2 py-1 text-sm" rows="3" data-i="' + i + '" data-k="model">' + wEsc(f.model) + '</textarea></label>' +
      '<label>New question (transfer)<select class="wcf-f-q w-full border border-gray-300 rounded px-2 py-1 text-sm" data-i="' + i + '" data-k="transfer">' + opts(f.transfer) + '</select></label>' +
      '<label>2-week check question<select class="wcf-f-q w-full border border-gray-300 rounded px-2 py-1 text-sm" data-i="' + i + '" data-k="check">' + opts(f.check) + '</select></label></div>' +
      (choices.length ? '' : '<p class="text-xs text-amber-700 mt-1">No bank questions for ' + wEsc(J277.label(f.topic)) + ' yet – load the question bank (More tools) to add a new question. Pupils will still correct their answer.</p>') +
      '<details class="mt-2"><summary class="text-xs cursor-pointer text-gray-700">Groups: <span class="px-1 rounded ' + WCF_TIERS.secure.cls + '">Secure ' + counts.secure + '</span> <span class="px-1 rounded ' + WCF_TIERS.misc.cls + '">Correct it ' + counts.misc + '</span> <span class="px-1 rounded ' + WCF_TIERS.gap.cls + '">Big gap ' + counts.gap + '</span> – change</summary>' +
      '<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1 mt-1">' + sat.map(function (r) {
        return '<label class="text-xs flex items-center justify-between gap-1 border border-gray-100 rounded px-1"><span class="truncate">' + wEsc(r.name || r.code) + '</span><select class="wcf-f-tier border border-gray-300 rounded text-xs" data-i="' + i + '" data-code="' + wEsc(r.code) + '">' +
          ['secure', 'misc', 'gap'].map(function (k) { return '<option value="' + k + '"' + (f.tiers[r.code] === k ? ' selected' : '') + '>' + WCF_TIERS[k].short + '</option>'; }).join('') + '</select></label>';
      }).join('') + '</div></details></div>';
  }).join('');
  h += '<div class="flex flex-wrap items-center gap-2">' + (plan.focuses.length < 3 ? '<button type="button" id="wcf-add" class="px-3 py-1.5 rounded border border-gray-300 text-sm">+ Add focus</button>' : '<span class="text-xs text-gray-500">3 focuses is the maximum – more dilutes the feedback.</span>') +
    '<label class="text-sm flex items-center gap-1 ml-2"><input type="checkbox" id="wcf-grade-after"' + (plan.gradeAfter ? ' checked' : '') + '> Show grades only after the tasks are done</label>' +
    '<button type="button" id="wcf-save" class="jhncc-primary px-4 py-1.5 rounded text-sm font-semibold ml-auto">Save plan</button>' +
    '<button type="button" id="wcf-reset" class="px-3 py-1.5 rounded border border-gray-300 text-xs">Re-suggest</button><span id="wcf-msg" class="text-xs text-gray-500">' + (wcf.saved ? 'Saved.' : 'Suggested – not saved yet.') + '</span></div>';
  return h;
}
function wcfBindPlan(t, rows, A) {
  var plan = wcf.plan, root = gEl('wcf-root');
  var dirty = function () { wcf.saved = false; var m = gEl('wcf-msg'); if (m) m.textContent = 'Unsaved changes.'; };
  var cands = wcfCandidates(t, A);
  root.querySelectorAll('.wcf-f-field').forEach(function (el) { el.oninput = function () { plan.focuses[Number(el.dataset.i)][el.dataset.k] = el.value; dirty(); }; });
  root.querySelectorAll('.wcf-f-cand').forEach(function (el) {
    el.onchange = function () {
      var c = cands.filter(function (x) { return x.key === el.value; })[0]; if (!c) return;
      plan.focuses[Number(el.dataset.i)] = wcfNewFocus(t, c, rows, Number(el.dataset.i)); dirty(); wcfDraw(t, rows, A);
    };
  });
  root.querySelectorAll('.wcf-f-q').forEach(function (el) {
    el.onchange = function () {
      var f = plan.focuses[Number(el.dataset.i)];
      var all = wcfBankChoices(t, f.topic);
      f[el.dataset.k] = all.filter(function (c) { return c.id === el.value; })[0] || null; dirty();
    };
  });
  root.querySelectorAll('.wcf-f-tier').forEach(function (el) { el.onchange = function () { plan.focuses[Number(el.dataset.i)].tiers[el.dataset.code] = el.value; dirty(); wcfDraw(t, rows, A); }; });
  root.querySelectorAll('.wcf-f-del').forEach(function (b) { b.onclick = function () { plan.focuses.splice(Number(b.dataset.i), 1); dirty(); wcfDraw(t, rows, A); }; });
  if (gEl('wcf-add')) gEl('wcf-add').onclick = function () {
    var used = {}; plan.focuses.forEach(function (f) { used[f.key] = true; });
    var c = cands.filter(function (x) { return !used[x.key]; })[0];
    if (!c) { gEl('wcf-msg').textContent = 'No more misconceptions or weak topics to add.'; return; }
    plan.focuses.push(wcfNewFocus(t, c, rows, plan.focuses.length)); dirty(); wcfDraw(t, rows, A);
  };
  gEl('wcf-grade-after').onchange = function () { plan.gradeAfter = this.checked; dirty(); };
  gEl('wcf-reset').onclick = function () { var keep = plan.releasedAt; wcf.plan = wcfSuggestPlan(t, rows, A); if (keep) wcf.plan.releasedAt = keep; dirty(); wcfDraw(t, rows, A); };
  gEl('wcf-save').onclick = async function () {
    try { await wcfSavePlan(gcse.testId, plan); wcf.saved = true; gEl('wcf-msg').textContent = 'Saved. Release from the Release tab to give pupils their tasks.'; }
    catch (e) { gEl('wcf-msg').textContent = gDbError(e); }
  };
}

// ── 3. Deliver: presenter + sheet ───────────────────────────────────────────
function wcfSlides(t, rows, A) {
  var plan = wcf.plan, n = A.sat.length, res = gcse.results || {};
  var slides = [];
  slides.push('<div class="text-sm uppercase tracking-wide text-gray-400">Whole-class feedback</div><h1 class="text-4xl font-bold mb-6">' + wEsc(t.title) + '</h1>' +
    '<h2 class="text-2xl font-bold text-green-700 mb-2">What went well</h2><ul class="text-2xl list-disc ml-8">' + A.stats.best.map(function (T) { return '<li>' + wEsc(T.label) + '</li>'; }).join('') + '</ul>' +
    (A.best[0] ? '<div class="mt-6 text-lg bg-green-50 border border-green-200 rounded p-4"><div class="text-sm text-green-800 font-semibold mb-1">A full-mark answer (' + wEsc(A.best[0].qid) + ')</div>' + wEsc(A.best[0].text) + '</div>' : ''));
  plan.focuses.forEach(function (f, i) {
    var count = Object.keys(f.tiers || {}).filter(function (c) { return f.tiers[c] !== 'secure'; }).length;
    var wrong = null;
    Object.keys(res).some(function (code) {
      var rr = res[code]; if (!rr || !rr.responses) return false;
      return f.qids.some(function (qid) {
        var has = f.code ? wList((rr.codes || {})[qid]).map(function (x) { return String(x).toUpperCase(); }).indexOf(f.code) !== -1 : (rr.marks && rr.marks[qid] != null && Number(rr.marks[qid]) === 0);
        if (has && rr.responses[qid] && gmQuestionType(t, qid) !== 'mcq') { wrong = { qid: qid, text: String(rr.responses[qid]) }; return true; }
        return false;
      });
    });
    slides.push('<div class="text-sm uppercase tracking-wide text-gray-400">Focus ' + (i + 1) + ' of ' + plan.focuses.length + '</div><h1 class="text-4xl font-bold mb-4">' + wEsc(f.title) + '</h1>' +
      '<div class="text-xl text-gray-600 mb-6">' + count + ' of ' + n + ' of you need this one.</div><div class="text-2xl leading-relaxed">' + wEsc(f.explain) + '</div>');
    if (f.model) slides.push('<div class="text-sm uppercase tracking-wide text-gray-400">Focus ' + (i + 1) + ' – what good looks like</div><h1 class="text-3xl font-bold mb-4">Model answer</h1><div class="text-2xl whitespace-pre-wrap leading-relaxed bg-gray-50 border rounded p-6">' + wEsc(f.model) + '</div>');
    if (wrong) slides.push('<div class="text-sm uppercase tracking-wide text-gray-400">Focus ' + (i + 1) + ' – together</div><h1 class="text-3xl font-bold mb-4">Fix this answer</h1><div class="text-2xl whitespace-pre-wrap bg-red-50 border border-red-200 rounded p-6">' + wEsc(wrong.text) + '</div><p class="text-lg text-gray-500 mt-4">What is wrong? How would you improve it?</p>');
  });
  slides.push('<h1 class="text-4xl font-bold mb-6">Your tasks</h1><ol class="text-2xl list-decimal ml-8 space-y-3"><li>Log in – you have a <b>Feedback tasks</b> banner.</li><li><b>Correct</b> your original answer.</li><li>Say <b>why</b> your first answer was wrong.</li><li>Answer a <b>new question</b> on the same idea.</li></ol><p class="text-xl text-gray-600 mt-6">Already secure? You get a stretch question instead.</p>' +
    (plan.gradeAfter ? '<p class="text-xl text-gray-600 mt-2">Your grade appears once your tasks are done.</p>' : ''));
  return slides;
}
function gmQuestionType(t, qid) { var q = (t.questions || []).filter(function (x) { return x.id === qid; })[0]; return q ? q.type : ''; }
function wcfPresent(t, rows, A) {
  var slides = wcfSlides(t, rows, A), i = 0;
  var ov = document.createElement('div');
  ov.id = 'wcf-presenter';
  ov.className = 'fixed inset-0 z-[100] bg-white flex flex-col';
  document.body.appendChild(ov);
  var close = function () { document.removeEventListener('keydown', key); ov.remove(); };
  var draw = function () {
    ov.innerHTML = '<div class="flex-1 overflow-auto p-10 max-w-5xl mx-auto w-full">' + slides[i] + '</div><div class="flex items-center justify-between px-6 py-3 border-t text-sm text-gray-500">' +
      '<button type="button" id="wcf-prev" class="px-3 py-1 rounded border">← Back</button><span>' + (i + 1) + ' / ' + slides.length + ' · arrow keys · Esc to close</span><div class="flex gap-2"><button type="button" id="wcf-next" class="px-3 py-1 rounded border">Next →</button><button type="button" id="wcf-close" class="px-3 py-1 rounded border">Close</button></div></div>';
    gEl('wcf-prev').onclick = function () { if (i > 0) { i--; draw(); } };
    gEl('wcf-next').onclick = function () { if (i < slides.length - 1) { i++; draw(); } };
    gEl('wcf-close').onclick = close;
  };
  var key = function (e) {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); if (i < slides.length - 1) { i++; draw(); } }
    else if (e.key === 'ArrowLeft') { if (i > 0) { i--; draw(); } }
  };
  document.addEventListener('keydown', key);
  draw();
}
function wcfPrintSheet(t, rows, A) {
  var plan = wcf.plan;
  var html = '<h1>Whole-class feedback: ' + wEsc(t.title) + '</h1><div class="muted">' + wEsc(t.className) + '</div>' +
    '<h2>What went well</h2><ul>' + A.stats.best.map(function (T) { return '<li>' + wEsc(T.label) + '</li>'; }).join('') + '</ul>' +
    '<h2>Common misconceptions</h2><ol>' + plan.focuses.map(function (f) { return '<li><b>' + wEsc(f.title) + '</b><br>' + wEsc(f.explain) + (f.model ? '<br><i>Model answer:</i> ' + wEsc(f.model).replace(/\n/g, '<br>') : '') + '</li>'; }).join('') + '</ol>' +
    '<h2>Your improvements</h2><ol>' + plan.focuses.map(function (f) { return '<li>Correct your answer to ' + wEsc(f.qids.join(', ')) + '. Then explain why your first answer was wrong.<div class="lines"></div><div class="lines"></div></li>'; }).join('') + '</ol>' +
    '<h2>Apply your knowledge</h2><ol>' + plan.focuses.filter(function (f) { return f.transfer; }).map(function (f) {
      var q = f.transfer;
      return '<li>' + wEsc(q.q) + (q.type === 'mcq' ? '<br>' + (q.options || []).map(function (o, k) { return String.fromCharCode(65 + k) + '. ' + wEsc(o); }).join(' &nbsp; ') : '<div class="lines"></div><div class="lines"></div>') + '</li>';
    }).join('') + '</ol>';
  gPrint('WCF – ' + t.title, html);
}

// ── 4. Release hook (called from gcseRelease) ───────────────────────────────
async function wcfReleaseUpdates(t, rows, updates, feedback) {
  var plan = wcfNormalisePlan(await wcfLoadPlan(gcse.testId));
  if (!plan || !plan.focuses.length) return;
  var now = Date.now();
  plan.releasedAt = plan.releasedAt || now;
  var qById = {}; (t.questions || []).forEach(function (q) { qById[q.id] = q; });
  feedback.wcf = {
    title: t.title, gradeAfter: !!plan.gradeAfter, releasedAt: plan.releasedAt, checkAfter: plan.releasedAt + WCF_CHECK_DAYS * 864e5,
    focuses: plan.focuses.map(function (f) {
      var q = qById[f.qids[0]] || {};
      return { id: f.id, title: f.title, explain: f.explain, model: f.model || '', topic: f.topic || '', code: f.code || null,
        orig: { qid: q.id || '', text: q.text || '', marks: q.marks || 0, type: q.type || 'short', options: q.options || null, answerIndex: q.answerIndex == null ? null : q.answerIndex, rules: q.rules || '', markScheme: q.markScheme || '' },
        transfer: f.transfer || null, check: f.check || f.transfer || null };
    })
  };
  var res = gcse.results || {};
  rows.forEach(function (r) {
    if (r.missing || r.absent) return;
    plan.focuses.forEach(function (f) {
      var base = 'progress/' + r.code + '/dirt/' + gcse.testId + '/' + f.id + '/';
      var qid = f.qids[0], rr = res[r.code] || {};
      updates[base + 'tier'] = f.tiers[r.code] || 'misc';
      updates[base + 'title'] = f.title;
      updates[base + 'className'] = t.className;
      updates[base + 'releasedAt'] = plan.releasedAt;
      updates[base + 'orig'] = { qid: qid || '', answer: rr.responses && rr.responses[qid] != null ? String(rr.responses[qid]) : '', mark: r.marks[qid] == null ? null : Number(r.marks[qid]), max: (qById[qid] || {}).marks || 0 };
    });
  });
  updates['gcse/wcf/' + gcse.testId + '/releasedAt'] = plan.releasedAt;
  if (wcf.plan && wcf.testId === gcse.testId) wcf.plan.releasedAt = plan.releasedAt;
}

// ── Teacher: Actions tab ────────────────────────────────────────────────────
function wcfFocusOutcome(d, f) {
  // d = progress dirt record for one focus
  if (!d) return { state: 'none' };
  var tr = d.transfer, ck = d.check;
  return {
    tier: d.tier, corrected: d.correction != null, why: !!d.why,
    transferOk: tr ? tr.mark >= tr.max : null, transferDone: !!tr, done: !!d.doneAt,
    checkOk: ck ? ck.mark >= ck.max : null, checkDone: !!ck
  };
}
async function wcfRenderActions(t, rows) {
  var root = gEl('wcf-actions-root'); if (!root) return;
  root.innerHTML = '<p class="text-gray-400 text-sm">Loading pupils\' tasks…</p>';
  var plan = wcfNormalisePlan(await wcfLoadPlan(gcse.testId));
  if (!plan || !plan.focuses.length) { root.innerHTML = '<p class="text-sm text-gray-500">No feedback plan yet. Make one in <b>Class feedback → 2 Plan</b>, then release.</p>'; return; }
  var sat = rows.filter(function (r) { return !r.missing && !r.absent; });
  var dirt = {};
  await Promise.all(sat.map(function (r) {
    return state.db.ref('progress/' + r.code + '/dirt/' + gcse.testId).get().then(function (s) { dirt[r.code] = s.val() || {}; }).catch(function () { dirt[r.code] = {}; });
  }));
  if (!gEl('wcf-actions-root')) return;
  var released = !!plan.releasedAt, checkOpen = released && Date.now() >= plan.releasedAt + WCF_CHECK_DAYS * 864e5;
  var h = '<div class="text-sm mb-3">' + (released ? 'Released ' + new Date(plan.releasedAt).toLocaleDateString('en-GB') + ' · check it stuck ' + (checkOpen ? '<b>open now</b>' : 'opens ' + new Date(plan.releasedAt + WCF_CHECK_DAYS * 864e5).toLocaleDateString('en-GB')) : '<b class="text-amber-700">Not released yet</b> – pupils get their tasks when you release.') + '</div>';
  // Impact per focus
  h += '<div class="grid grid-cols-1 md:grid-cols-' + Math.min(3, plan.focuses.length) + ' gap-3 mb-4">' + plan.focuses.map(function (f) {
    var need = sat.filter(function (r) { return (f.tiers[r.code] || 'misc') !== 'secure'; });
    var fixed = need.filter(function (r) { var o = wcfFocusOutcome((dirt[r.code] || {})[f.id], f); return o.transferOk; });
    var stuck = need.filter(function (r) { var o = wcfFocusOutcome((dirt[r.code] || {})[f.id], f); return o.checkOk; });
    var checked = need.filter(function (r) { var o = wcfFocusOutcome((dirt[r.code] || {})[f.id], f); return o.checkDone; });
    var done = sat.filter(function (r) { var d = (dirt[r.code] || {})[f.id]; return d && d.doneAt; }).length;
    return '<div class="wcf-impact border border-gray-200 rounded-lg p-3"><div class="font-semibold text-sm mb-1">' + wEsc(f.title) + '</div>' +
      '<div class="text-xs text-gray-600">Tasks done: <b>' + done + '/' + sat.length + '</b></div>' +
      '<div class="text-sm mt-1"><b>Impact:</b> ' + need.length + ' had it wrong → <b>' + fixed.length + '</b> fixed it on the new question → <b>' + stuck.length + '</b> still right after ' + WCF_CHECK_DAYS + ' days' + (checked.length < need.length && released ? ' <span class="text-xs text-gray-500">(' + checked.length + ' checked so far)</span>' : '') + '</div></div>';
  }).join('') + '</div>';
  var icon = function (v, done) { return v === true ? '<span class="text-green-700">✓</span>' : v === false ? '<span class="text-red-700">✗</span>' : done ? '<span class="text-gray-500">…</span>' : '<span class="text-gray-300">–</span>'; };
  h += '<div class="overflow-x-auto"><table class="w-full text-xs border border-gray-200"><tr class="bg-gray-50"><th class="p-1 text-left">Pupil</th>' + plan.focuses.map(function (f, i) { return '<th class="p-1" title="' + wEsc(f.title) + '">Focus ' + (i + 1) + '<div class="font-normal text-gray-500">group · corrected · why · new Q · 2 weeks</div></th>'; }).join('') + '<th class="p-1">Stuck?</th></tr>' +
    sat.map(function (r) {
      var stuckAny = false;
      var cells = plan.focuses.map(function (f) {
        var d = (dirt[r.code] || {})[f.id], o = wcfFocusOutcome(d, f), tier = (d && d.tier) || f.tiers[r.code] || 'misc';
        if (o.checkOk === false || (o.transferOk === false && !o.checkDone)) stuckAny = true;
        return '<td class="p-1 text-center whitespace-nowrap"><span class="px-1 rounded ' + WCF_TIERS[tier].cls + '">' + WCF_TIERS[tier].short + '</span> ' +
          (tier === 'secure' ? '' : icon(o.corrected ? true : null) + ' ' + icon(o.why ? true : null) + ' ') + icon(o.transferOk, o.transferDone) + ' ' + icon(o.checkOk, o.checkDone) + '</td>';
      }).join('');
      return '<tr class="border-t wcf-act-row" data-code="' + wEsc(r.code) + '"><td class="p-1"><button type="button" class="gcse-profile-link hover:underline" data-code="' + wEsc(r.code) + '">' + wEsc(r.name || r.code) + '</button></td>' + cells +
        '<td class="p-1 text-center">' + (stuckAny ? '<span class="text-red-700 font-semibold">Needs support</span>' : '') + '</td></tr>';
    }).join('') + '</table></div><p class="text-xs text-gray-500 mt-2">✓ done / right · ✗ wrong · – not yet. "Needs support": got the new question or the 2-week check wrong – they also appear under Needs attention on the class Overview.</p>';
  root.innerHTML = h;
  root.querySelectorAll('.gcse-profile-link').forEach(function (b) { b.onclick = function () { openGcseProfile(b.dataset.code); }; });
}

// ── Pupil side ──────────────────────────────────────────────────────────────
async function wcfStudentTasks() {
  if (!state || !state.uid || !state.className || state.isTeacher || state.isAdmin) return [];
  var dirtSnap = await state.db.ref('progress/' + state.uid + '/dirt').get();
  var dirt = dirtSnap.exists() ? (dirtSnap.val() || {}) : {};
  var out = [];
  await Promise.all(Object.keys(dirt).map(function (testId) {
    return state.db.ref('classes/' + state.className + '/apFeedback/' + testId + '/wcf').get().then(function (s) {
      var w = s.val(); if (!w) return;
      wList(w.focuses).forEach(function (f) {
        var d = dirt[testId][f.id]; if (!d) return;
        var checkDue = Date.now() >= (w.checkAfter || Infinity);
        out.push({ testId: testId, focus: f, d: d, wcf: w, todo: !d.doneAt, checkTodo: !!d.doneAt && checkDue && !d.check && !!f.check });
      });
    }).catch(function () {});
  }));
  return out;
}
async function wcfStudentBanner() {
  var old = gEl('wcf-banner'); if (old) old.remove();
  var tasks;
  try { tasks = await wcfStudentTasks(); } catch (e) { return; }
  var todo = tasks.filter(function (x) { return x.todo; }), checks = tasks.filter(function (x) { return x.checkTodo; });
  if (!todo.length && !checks.length) return;
  var host = gEl('app-content'); if (!host) return;
  var b = document.createElement('div');
  b.id = 'wcf-banner';
  b.className = 'mx-auto max-w-5xl mt-2 mb-2 px-4 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 flex flex-wrap items-center gap-3 text-sm';
  b.innerHTML = '<span class="text-lg">📝</span><span>' + (todo.length ? '<b>Feedback tasks:</b> ' + todo.length + ' to do' : '') + (todo.length && checks.length ? ' · ' : '') + (checks.length ? '<b>Check it stuck:</b> ' + checks.length + ' question' + (checks.length === 1 ? '' : 's') : '') + '</span>' +
    '<button type="button" id="wcf-banner-go" class="jhncc-primary px-3 py-1 rounded font-semibold text-sm ml-auto">Start</button>';
  host.insertBefore(b, host.firstChild);
  gEl('wcf-banner-go').onclick = function () { wcfOpenTasks(); };
}
function wcfModal() {
  var m = gEl('modal-wcf-tasks');
  if (!m) {
    m = document.createElement('div');
    m.id = 'modal-wcf-tasks';
    m.className = 'fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto';
    m.innerHTML = '<div class="bg-white rounded-xl shadow-xl w-full max-w-2xl mt-8"><div class="flex justify-between items-center px-5 py-3 border-b"><h2 class="font-bold text-lg">Feedback tasks</h2><button type="button" id="wcf-tasks-close" class="text-gray-400 text-xl">✕</button></div><div id="wcf-tasks-body" class="p-5"></div></div>';
    document.body.appendChild(m);
  }
  m.classList.remove('hidden');
  gEl('wcf-tasks-close').onclick = function () { m.classList.add('hidden'); wcfStudentBanner(); };
  return gEl('wcf-tasks-body');
}
async function wcfOpenTasks() {
  var body = wcfModal();
  body.innerHTML = '<p class="text-gray-400 text-sm">Loading…</p>';
  var tasks = await wcfStudentTasks();
  var next = tasks.filter(function (x) { return x.todo; })[0] || tasks.filter(function (x) { return x.checkTodo; })[0];
  if (!next) { body.innerHTML = '<div class="text-center py-6"><div class="text-3xl mb-2">🎉</div><p class="font-semibold">All your feedback tasks are done.</p></div>'; return; }
  if (next.todo) wcfRenderTask(body, next); else wcfRenderCheck(body, next);
}
function wcfDirtRef(task) { return state.db.ref('progress/' + state.uid + '/dirt/' + task.testId + '/' + task.focus.id); }
function wcfAnswerBox(q, id, rows) {
  if (q.type === 'mcq') return (q.options || []).map(function (o, i) { return '<label class="flex items-center gap-2 border rounded px-2 py-1 mb-1 text-sm"><input type="radio" name="' + id + '" value="' + i + '"> ' + String.fromCharCode(65 + i) + '. ' + wEsc(o) + '</label>'; }).join('');
  return '<textarea id="' + id + '" rows="' + (rows || 3) + '" class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="Type your answer"></textarea>';
}
function wcfReadAnswer(q, id) {
  if (q.type === 'mcq') { var c = document.querySelector('input[name="' + id + '"]:checked'); return c ? c.value : ''; }
  var el = gEl(id); return el ? el.value.trim() : '';
}
// Mark a pupil answer on the client: MCQ, keyword rules, or (no rules) null = self-check.
function wcfMark(q, answer) {
  if (!answer) return { mark: 0, max: q.marks || 1, points: [] };
  if (q.type === 'mcq') return { mark: String(answer) === String(q.answerIndex != null ? q.answerIndex : q.answer) ? (q.marks || 1) : 0, max: q.marks || 1, points: [] };
  if (q.rules) { var m = GcseCore.mark(q.rules, answer, q.marks || 1); return { mark: m.marks, max: m.max, points: m.points }; }
  return null;
}
function wcfResultHtml(r, q) {
  if (!r) return '';
  var good = r.mark >= r.max;
  return '<div class="rounded p-2 mt-2 text-sm ' + (good ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900') + '"><b>' + r.mark + ' / ' + r.max + '</b> ' + (good ? '– correct!' : '– not quite.') +
    (r.points && r.points.length ? '<ul class="text-xs list-disc ml-5 mt-1">' + r.points.map(function (p) { return '<li>' + (p.awarded ? '✓ ' : '✗ ') + wEsc(p.reason) + '</li>'; }).join('') + '</ul>' : '') +
    (!good && q.type === 'mcq' && q.options ? '<div class="text-xs mt-1">Answer: ' + String.fromCharCode(65 + Number(q.answerIndex)) + '. ' + wEsc(q.options[q.answerIndex]) + '</div>' : '') + '</div>';
}
function wcfSelfCheckHtml(q, id) {
  var pts = String(q.markScheme || '').split(/\n|;/).map(function (s) { return s.trim(); }).filter(Boolean);
  if (!pts.length) return '';
  return '<div class="rounded border border-gray-200 p-2 text-sm mt-2"><b>Tick each point your answer now makes:</b>' + pts.map(function (p, i) { return '<label class="flex gap-2 items-start mt-1"><input type="checkbox" class="' + id + '"> <span>' + wEsc(p) + '</span></label>'; }).join('') + '</div>';
}
function wcfRenderTask(body, task) {
  var f = task.focus, d = task.d, tier = d.tier || 'misc', orig = f.orig || {}, mine = d.orig || {};
  var origQ = { type: orig.type, options: orig.options, answerIndex: orig.answerIndex, rules: orig.rules, marks: orig.marks || 1, markScheme: orig.markScheme };
  var stage = tier === 'secure' ? 'transfer' : (d.correction == null ? 'correct' : !d.why ? 'why' : 'transfer');
  if (stage === 'transfer' && !f.transfer) stage = 'finish';
  var yourAnswer = mine.answer ? (orig.type === 'mcq' && orig.options ? String.fromCharCode(65 + Number(mine.answer)) + '. ' + orig.options[Number(mine.answer)] : mine.answer) : '';
  var h = '<div class="text-xs text-gray-500 mb-1">' + wEsc((task.wcf && task.wcf.title) || '') + '</div><h3 class="text-lg font-bold mb-1">' + wEsc(f.title) + '</h3>' +
    '<span class="text-xs px-2 py-0.5 rounded ' + WCF_TIERS[tier].cls + '">' + (tier === 'secure' ? 'You got this – stretch question' : tier === 'gap' ? 'Study the worked example first' : 'Correct your answer') + '</span>' +
    '<div class="flex gap-1 my-3 text-[11px]">' + (tier === 'secure' ? [['transfer', 'Stretch question']] : [['correct', '1 Correct it'], ['why', '2 Why?'], ['transfer', '3 New question']]).map(function (s) {
      return '<span class="px-2 py-0.5 rounded-full border ' + (s[0] === stage ? 'bg-[rgb(176,28,35)] text-white border-[rgb(176,28,35)]' : 'border-gray-300 text-gray-500') + '">' + s[1] + '</span>';
    }).join('') + '</div>';
  if (tier !== 'secure' && stage !== 'finish') {
    h += '<div class="rounded border border-gray-200 p-3 mb-3 text-sm"><div class="font-semibold mb-1">' + wEsc(orig.qid || 'Question') + (orig.text ? ': ' + wEsc(orig.text) : '') + '</div>' +
      '<div class="text-xs text-gray-500">Your answer' + (mine.mark != null ? ' (' + mine.mark + '/' + mine.max + ')' : '') + ':</div><div class="bg-gray-50 rounded p-2 whitespace-pre-wrap">' + (yourAnswer ? wEsc(yourAnswer) : '<i class="text-gray-400">No answer</i>') + '</div>' +
      '<div class="mt-2 rounded bg-amber-50 border border-amber-200 p-2"><b>Feedback:</b> ' + wEsc(f.explain) + '</div>' +
      ((tier === 'gap' || stage !== 'correct') && f.model ? '<div class="mt-2 rounded bg-green-50 border border-green-200 p-2"><b>' + (tier === 'gap' ? 'Worked example' : 'Model answer') + ':</b><div class="whitespace-pre-wrap">' + wEsc(f.model) + '</div></div>' : '') + '</div>';
  }
  if (stage === 'correct') {
    h += '<div class="font-semibold text-sm mb-1">1. Write a better answer' + (tier === 'gap' ? ' in your own words (don\'t copy the example)' : '') + ':</div>' + wcfAnswerBox(origQ, 'wcf-correct', 4) +
      (origQ.type !== 'mcq' && !origQ.rules ? wcfSelfCheckHtml(origQ, 'wcf-self') : '') +
      '<button type="button" id="wcf-submit" class="jhncc-primary mt-2 px-4 py-1.5 rounded text-sm font-semibold">Check</button><div id="wcf-out"></div>';
  } else if (stage === 'why') {
    h += '<div class="font-semibold text-sm mb-1">2. What was wrong with your first answer, and why is your new one better?</div><textarea id="wcf-why" rows="3" class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="My first answer was wrong because…"></textarea>' +
      '<button type="button" id="wcf-submit" class="jhncc-primary mt-2 px-4 py-1.5 rounded text-sm font-semibold">Save</button><div id="wcf-out"></div>';
  } else if (stage === 'transfer') {
    var q = f.transfer;
    h += '<div class="font-semibold text-sm mb-1">' + (tier === 'secure' ? 'Stretch question' : '3. A new question on the same idea') + ' <span class="text-xs text-gray-500">[' + (q.marks || 1) + ' mark' + ((q.marks || 1) === 1 ? '' : 's') + ']</span></div><div class="text-sm mb-2">' + wEsc(q.q) + '</div>' +
      wcfAnswerBox(q, 'wcf-transfer', 3) + '<button type="button" id="wcf-submit" class="jhncc-primary mt-2 px-4 py-1.5 rounded text-sm font-semibold">Check</button><div id="wcf-out"></div>';
  } else {
    h += '<p class="text-sm">Task complete.</p>';
  }
  body.innerHTML = h;
  var out = gEl('wcf-out'), btn = gEl('wcf-submit');
  var nextBtn = function () { out.innerHTML += '<button type="button" id="wcf-next" class="mt-3 px-4 py-1.5 rounded border border-gray-300 text-sm font-semibold">Next →</button>'; gEl('wcf-next').onclick = function () { wcfOpenTasks(); }; };
  if (stage === 'finish') { wcfDirtRef(task).update({ doneAt: Date.now() }).then(function () { wcfOpenTasks(); }); return; }
  btn.onclick = async function () {
    if (stage === 'correct') {
      var ans = wcfReadAnswer(origQ, 'wcf-correct');
      if (!ans) { out.innerHTML = '<p class="text-xs text-red-700 mt-1">Write your corrected answer first.</p>'; return; }
      var r = wcfMark(origQ, ans);
      if (!r) { var ticked = document.querySelectorAll('.wcf-self:checked').length; r = { mark: Math.min(ticked, origQ.marks), max: origQ.marks, self: true }; }
      btn.disabled = true;
      await wcfDirtRef(task).update({ correction: ans, correctionMark: r.mark, correctionMax: r.max, correctedAt: Date.now() });
      task.d.correction = ans;
      out.innerHTML = wcfResultHtml(r, origQ) + (f.model ? '<div class="mt-2 rounded bg-green-50 border border-green-200 p-2 text-sm"><b>Model answer:</b><div class="whitespace-pre-wrap">' + wEsc(f.model) + '</div></div>' : '');
      nextBtn();
    } else if (stage === 'why') {
      var why = gEl('wcf-why').value.trim();
      if (why.split(/\s+/).filter(Boolean).length < 5) { out.innerHTML = '<p class="text-xs text-red-700 mt-1">Write at least a sentence (5+ words) – explaining it is what makes it stick.</p>'; return; }
      btn.disabled = true;
      await wcfDirtRef(task).update(f.transfer ? { why: why } : { why: why, doneAt: Date.now() });
      wcfOpenTasks();
    } else {
      var q2 = f.transfer, a2 = wcfReadAnswer(q2, 'wcf-transfer');
      if (!a2) { out.innerHTML = '<p class="text-xs text-red-700 mt-1">Answer the question first.</p>'; return; }
      var r2 = wcfMark(q2, a2) || { mark: 0, max: q2.marks || 1 };
      btn.disabled = true;
      await wcfDirtRef(task).update({ transfer: { answer: a2, mark: r2.mark, max: r2.max, at: Date.now() }, doneAt: Date.now() });
      if (typeof gcseRecordQuizAttempt === 'function') { try { gcseRecordQuizAttempt({ gcseQid: q2.id, gcseTopics: q2.topics || [], q: q2.q, gcseCodes: [] }, a2, { marks: r2.mark, max: r2.max }, 'practice'); } catch (e) {} }
      out.innerHTML = wcfResultHtml(r2, q2) + (q2.markScheme ? '<div class="mt-2 rounded border border-gray-200 bg-gray-50 p-2 text-xs"><b>Mark scheme:</b><div class="whitespace-pre-wrap">' + wEsc(q2.markScheme) + '</div></div>' : '');
      nextBtn();
    }
  };
}
function wcfRenderCheck(body, task) {
  var f = task.focus, q = f.check;
  body.innerHTML = '<div class="text-xs text-gray-500 mb-1">Check it stuck · ' + WCF_CHECK_DAYS + ' days on</div><h3 class="text-lg font-bold mb-2">' + wEsc(f.title) + '</h3>' +
    '<p class="text-sm text-gray-600 mb-2">One quick question – no notes. It shows whether your correction stuck.</p><div class="text-sm mb-2">' + wEsc(q.q) + '</div>' +
    wcfAnswerBox(q, 'wcf-check', 3) + '<button type="button" id="wcf-submit" class="jhncc-primary mt-2 px-4 py-1.5 rounded text-sm font-semibold">Check</button><div id="wcf-out"></div>';
  gEl('wcf-submit').onclick = async function () {
    var a = wcfReadAnswer(q, 'wcf-check'), out = gEl('wcf-out');
    if (!a) { out.innerHTML = '<p class="text-xs text-red-700 mt-1">Answer the question first.</p>'; return; }
    var r = wcfMark(q, a) || { mark: 0, max: q.marks || 1 };
    this.disabled = true;
    await wcfDirtRef(task).update({ check: { answer: a, mark: r.mark, max: r.max, at: Date.now() } });
    out.innerHTML = wcfResultHtml(r, q) + '<button type="button" id="wcf-next" class="mt-3 px-4 py-1.5 rounded border border-gray-300 text-sm font-semibold">Next →</button>';
    gEl('wcf-next').onclick = function () { wcfOpenTasks(); };
  };
}
// Grade after tasks: does this pupil still have tasks for this test?
async function wcfTasksLeft(testId) {
  try {
    var s = await state.db.ref('progress/' + state.uid + '/dirt/' + testId).get();
    var v = s.val() || {};
    return Object.keys(v).filter(function (k) { return v[k] && !v[k].doneAt; }).length;
  } catch (e) { return 0; }
}

// Show the banner after a pupil logs in (wraps updateAuthUI like the quiz module does).
(function () {
  if (typeof updateAuthUI !== 'function') return;
  var orig = updateAuthUI;
  updateAuthUI = function (first, last, isAdmin, isTeacher) {
    var r = orig.apply(this, arguments);
    var b = gEl('wcf-banner'); if (b) b.remove();
    if (!isAdmin && !isTeacher) setTimeout(function () { if (state.uid && !state.isTeacher && !state.isAdmin) wcfStudentBanner(); }, 600);
    return r;
  };
})();
