/**
 * gcse-hostquiz-module.js – Host a Quiz: GCSE question picker, send to a group,
 * and "Start another quiz" that stays on GCSE.
 *
 *  - Choose questions yourself (type / difficulty filters, marks shown) or random.
 *  - "Send to a group": a forced quiz only pulls in the ticked pupils
 *    (classes/{class}/forcedQuiz/only = {code: true}); others can still join with the code.
 *    Quick picks come from the latest feedback plan's groups.
 *  - After a GCSE quiz, "Start another quiz" offers new questions on the same topics.
 */
gcse.hostPick = gcse.hostPick || {};

// ── Question picker ─────────────────────────────────────────────────────────
function gcseHostPickMode() { var r = document.querySelector('input[name="quiz-gcse-pickmode"]:checked'); return r ? r.value : 'random'; }
function gcseHostPickList() {
  var picked = gcsePickedTopics('gcse-host');
  if (!picked.length) return [];
  return gcseQuestionsForTopics(picked, gcseHostTypes(), (gEl('quiz-gcse-difficulty') || {}).value || '')
    .filter(function (v) { return v.row.type !== 'mcq' || v.row.options.length <= 4; });
}
function gcseHostRenderPick() {
  var box = gEl('quiz-gcse-pick'); if (!box) return;
  var mode = gcseHostPickMode();
  var countEl = gEl('quiz-gcse-count');
  if (countEl) { countEl.disabled = mode === 'pick'; countEl.classList.toggle('opacity-50', mode === 'pick'); }
  box.classList.toggle('hidden', mode !== 'pick');
  if (mode !== 'pick') return;
  var list = gcseHostPickList();
  var valid = {}; list.forEach(function (v) { valid[v.row.id] = true; });
  Object.keys(gcse.hostPick).forEach(function (id) { if (!valid[id]) delete gcse.hostPick[id]; });
  var chosen = list.filter(function (v) { return gcse.hostPick[v.row.id]; });
  var marks = chosen.reduce(function (s, v) { return s + (Number(v.row.marks) || 0); }, 0);
  if (!list.length) { box.innerHTML = '<p class="text-xs text-gray-500">Tick topics above to see their questions.</p>'; return; }
  box.innerHTML = '<div class="flex items-center gap-2 mb-1 text-xs"><b id="quiz-gcse-pick-count">' + chosen.length + ' chosen · ' + marks + ' mark' + (marks === 1 ? '' : 's') + '</b>' +
    '<button type="button" id="quiz-gcse-pick-all" class="px-2 py-0.5 rounded border border-gray-300">Tick all</button><button type="button" id="quiz-gcse-pick-none" class="px-2 py-0.5 rounded border border-gray-300">None</button></div>' +
    '<div class="border border-gray-200 rounded max-h-56 overflow-y-auto divide-y">' + list.map(function (v) {
      var r = v.row;
      var type = r.type === 'mcq' ? 'MCQ' : 'Written';
      return '<label class="quiz-gcse-pick-row flex items-start gap-2 px-2 py-1.5 text-xs hover:bg-gray-50 cursor-pointer"><input type="checkbox" class="quiz-gcse-pick-cb mt-0.5" value="' + gEsc(r.id) + '"' + (gcse.hostPick[r.id] ? ' checked' : '') + '>' +
        '<span class="flex-1">' + gEsc(r.question) + '<span class="block text-[11px] text-gray-500">' + gEsc(r.topics.map(function (tc) { return tc; }).join(', ')) + '</span></span>' +
        '<span class="whitespace-nowrap text-[11px]"><span class="px-1 rounded bg-gray-100">' + type + '</span>' + (r.difficulty ? ' <span class="px-1 rounded ' + (r.difficulty === 'H' ? 'bg-purple-100 text-purple-800' : 'bg-sky-100 text-sky-800') + '">' + (r.difficulty === 'H' ? 'Higher' : 'Foundation') + '</span>' : '') +
        ' <b>' + r.marks + ' mark' + (r.marks === 1 ? '' : 's') + '</b></span></label>';
    }).join('') + '</div>';
  box.querySelectorAll('.quiz-gcse-pick-cb').forEach(function (cb) {
    cb.onchange = function () { if (cb.checked) gcse.hostPick[cb.value] = true; else delete gcse.hostPick[cb.value]; gcseHostRenderPick(); };
  });
  gEl('quiz-gcse-pick-all').onclick = function () { list.forEach(function (v) { gcse.hostPick[v.row.id] = true; }); gcseHostRenderPick(); };
  gEl('quiz-gcse-pick-none').onclick = function () { gcse.hostPick = {}; gcseHostRenderPick(); };
}
// null = random; otherwise the ticked question ids (in list order).
function gcseHostChosenIds() {
  if (gcseHostPickMode() !== 'pick') return null;
  return gcseHostPickList().filter(function (v) { return gcse.hostPick[v.row.id]; }).map(function (v) { return v.row.id; });
}
function gcseHostRemember(className, topics, opts, qs) {
  gcse._hostOpts = { types: opts.types, seconds: opts.seconds, difficulty: opts.difficulty };
}
// Remember the last GCSE quiz (topics, settings, questions used) for "Start another".
(function () {
  if (typeof gcseStartLiveQuiz !== 'function') return;
  var orig = gcseStartLiveQuiz;
  gcseStartLiveQuiz = function (className, topics, qs, force) {
    var used = {};
    var prev = gcse.lastHost && gcse.lastHost.className === className && JSON.stringify(gcse.lastHost.topics) === JSON.stringify(topics) ? gcse.lastHost.used : {};
    Object.keys(prev || {}).forEach(function (k) { used[k] = true; });
    (qs || []).forEach(function (q) { if (q.gcseQid) used[q.gcseQid] = true; });
    gcse.lastHost = { className: className, topics: topics.slice(), opts: gcse._hostOpts || { types: ['mcq', 'short'], seconds: 60, difficulty: '' }, used: used, count: (qs || []).length, force: !!force };
    gcse._hostOpts = null;
    return orig.apply(this, arguments);
  };
})();

(function bindPickMode() {
  document.querySelectorAll('input[name="quiz-gcse-pickmode"]').forEach(function (r) { r.addEventListener('change', gcseHostRenderPick); });
  var diff = gEl('quiz-gcse-difficulty'); if (diff) diff.addEventListener('change', function () { setTimeout(gcseHostRenderPick, 0); });
})();

// ── Send to a group ─────────────────────────────────────────────────────────
async function gcseHostGroupRender(className) {
  var force = gEl('quiz-force-class'); if (!force) return;
  var host = gEl('quiz-group-box');
  if (!host) {
    host = document.createElement('div');
    host.id = 'quiz-group-box';
    host.className = 'mb-3 -mt-1';
    var lbl = force.closest('label');
    lbl.parentNode.insertBefore(host, lbl.nextSibling);
  }
  quiz.forceOnly = null;
  host.innerHTML = '<details id="quiz-group-details" class="border border-gray-200 rounded-lg px-3 py-2 text-sm"><summary class="cursor-pointer font-semibold text-gray-700">Send to a group only <span id="quiz-group-summary" class="font-normal text-xs text-gray-500">– everyone</span></summary><div id="quiz-group-body" class="mt-2 text-xs text-gray-500">Loading pupils…</div></details>';
  var codes = [];
  try { var s = await state.db.ref('classes/' + className + '/codes').get(); codes = Object.keys(s.val() || {}); } catch (e) {}
  codes.sort(function (a, b) { return ((typeof studentName === 'function' && studentName(a)) || a).localeCompare((typeof studentName === 'function' && studentName(b)) || b); });
  // Quick groups from the latest released feedback plan for this class.
  var groups = [];
  try {
    var tests = gcse.tests || {};
    var ids = Object.keys(tests).filter(function (id) { return tests[id] && tests[id].className === className; }).sort(function (a, b) { return (tests[b].createdAt || 0) - (tests[a].createdAt || 0); });
    for (var i = 0; i < ids.length && !groups.length; i++) {
      var ps = await state.db.ref('gcse/wcf/' + ids[i]).get();
      var plan = ps.val();
      if (!plan || !plan.focuses) continue;
      GcseCore.asList(plan.focuses).forEach(function (f, k) {
        ['gap', 'misc'].forEach(function (tier) {
          var members = Object.keys(f.tiers || {}).filter(function (c) { return f.tiers[c] === tier; });
          if (members.length) groups.push({ label: 'Focus ' + (k + 1) + ' – ' + (tier === 'gap' ? 'Big gap' : 'Correct it') + ' (' + members.length + ')', title: f.title, codes: members });
        });
      });
    }
  } catch (e) {}
  var body = gEl('quiz-group-body'); if (!body) return;
  if (!codes.length) { body.textContent = 'No pupils in this class.'; return; }
  body.innerHTML = '<p class="mb-1">Tick pupils to force the quiz on <b>only them</b> (needs "Force quiz" ticked). Leave all unticked for the whole class.</p>' +
    (groups.length ? '<div class="flex flex-wrap gap-1 mb-2">' + groups.map(function (g, i) { return '<button type="button" class="quiz-group-quick px-2 py-0.5 rounded border border-purple-300 text-purple-700" data-i="' + i + '" title="' + gEsc(g.title) + '">' + gEsc(g.label) + '</button>'; }).join('') + '<button type="button" id="quiz-group-clear" class="px-2 py-0.5 rounded border border-gray-300">Clear</button></div>' : '') +
    '<div class="grid grid-cols-2 gap-x-3 max-h-40 overflow-y-auto">' + codes.map(function (c) {
      return '<label class="flex items-center gap-1 py-0.5 text-gray-700"><input type="checkbox" class="quiz-group-cb" value="' + gEsc(c) + '"> ' + gEsc((typeof studentName === 'function' && studentName(c)) || c) + '</label>';
    }).join('') + '</div>';
  var sync = function () {
    var on = {}; body.querySelectorAll('.quiz-group-cb:checked').forEach(function (cb) { on[cb.value] = true; });
    var n = Object.keys(on).length;
    quiz.forceOnly = n ? on : null;
    gEl('quiz-group-summary').textContent = n ? '– ' + n + ' pupil' + (n === 1 ? '' : 's') : '– everyone';
    if (n && !force.checked) force.checked = true;
  };
  body.querySelectorAll('.quiz-group-cb').forEach(function (cb) { cb.onchange = sync; });
  body.querySelectorAll('.quiz-group-quick').forEach(function (b) {
    b.onclick = function () { var g = groups[Number(b.dataset.i)]; body.querySelectorAll('.quiz-group-cb').forEach(function (cb) { cb.checked = g.codes.indexOf(cb.value) !== -1; }); sync(); };
  });
  if (gEl('quiz-group-clear')) gEl('quiz-group-clear').onclick = function () { body.querySelectorAll('.quiz-group-cb').forEach(function (cb) { cb.checked = false; }); sync(); };
}
(function () {
  if (typeof openQuizSetup !== 'function') return;
  var orig = openQuizSetup;
  openQuizSetup = function (className) {
    var r = orig.apply(this, arguments);
    gcse.hostPick = {};
    gcseHostGroupRender(className);
    return r;
  };
})();

// ── Start another quiz: stays on GCSE ───────────────────────────────────────
(function () {
  if (typeof prepareFinishedQuizPanel !== 'function') return;
  var orig = prepareFinishedQuizPanel;
  prepareFinishedQuizPanel = function () {
    var r = orig.apply(this, arguments);
    var panel = gEl('qh-next-quiz-panel'); if (!panel) return r;
    var isGcse = quiz.lessonId === 'gcse-topics' && gcse.lastHost;
    Array.prototype.forEach.call(panel.children, function (el) {
      if (el.tagName === 'H3' || el.id === 'qh-next-gcse' || (el.tagName === 'LABEL' && el.querySelector('#qh-next-force-class'))) return;
      if (el.tagName === 'P' && !el.querySelector('select')) return;
      el.classList.toggle('hidden', !!isGcse);
    });
    var box = gEl('qh-next-gcse');
    if (!isGcse) { if (box) box.remove(); return r; }
    var L = gcse.lastHost;
    if (!box) { box = document.createElement('div'); box.id = 'qh-next-gcse'; panel.insertBefore(box, panel.children[2] || null); }
    var labels = L.topics.slice(0, 4).map(function (c) { return J277.label(c); }).join(', ') + (L.topics.length > 4 ? '…' : '');
    box.innerHTML = '<div class="text-xs text-gray-300 mb-2"><b class="text-white">GCSE topics:</b> ' + gEsc(labels) + '</div>' +
      '<div class="grid grid-cols-2 gap-2 mb-2"><label class="text-xs text-gray-400">Questions<input id="qh-gcse-count" type="number" min="1" max="30" value="' + (L.count || 10) + '" class="w-full border border-gray-600 bg-gray-900 text-gray-100 rounded px-3 py-1.5 text-sm"></label>' +
      '<label class="text-xs text-gray-400">Seconds<input id="qh-gcse-time" type="number" min="10" max="300" value="' + (L.opts.seconds || 60) + '" class="w-full border border-gray-600 bg-gray-900 text-gray-100 rounded px-3 py-1.5 text-sm"></label></div>' +
      (quiz.forceOnly ? '<div class="text-xs text-purple-200 mb-2">Group: ' + Object.keys(quiz.forceOnly).length + ' pupils (same as last quiz)</div>' : '') +
      '<button type="button" id="qh-gcse-again" class="jhncc-primary w-full py-2 rounded font-semibold mb-2">New questions, same topics</button>' +
      '<button type="button" id="qh-gcse-choose" class="w-full py-1.5 rounded border border-gray-500 text-gray-200 text-sm">Choose topics / questions…</button><div id="qh-gcse-msg" class="text-xs text-red-300 mt-1"></div>';
    gEl('qh-gcse-again').onclick = async function () {
      var qs = gcseBuildLiveQuizQuestions(L.topics, Number(gEl('qh-gcse-count').value) || 10, { types: L.opts.types, difficulty: L.opts.difficulty, seconds: Number(gEl('qh-gcse-time').value) || 60, avoid: L.used });
      if (!qs.length) { gEl('qh-gcse-msg').textContent = 'No bank questions left for these topics.'; return; }
      gcse._hostOpts = { types: L.opts.types, seconds: Number(gEl('qh-gcse-time').value) || 60, difficulty: L.opts.difficulty };
      await gcseStartLiveQuiz(L.className, L.topics, qs, gEl('qh-next-force-class').checked);
    };
    gEl('qh-gcse-choose').onclick = function () {
      var cls = L.className;
      if (typeof exitHostQuizScreen === 'function') exitHostQuizScreen();
      gcse.hostSource = 'gcse';
      openQuizSetup(cls);
    };
    return r;
  };
})();
