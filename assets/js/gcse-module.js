/**
 * gcse-module.js – GCSE J277 tests, whole-class feedback, grades, profiles,
 * question bank, topic quizzes and test generator.
 *
 * Data (Firebase – codes only, never names or emails):
 *   gcse/tests/{testId}            test map, boundaries, notes            (staff only)
 *   gcse/results/{testId}/{code}   canonical marks, grade, DP             (staff only)
 *   gcse/targets/{code}            target grade                           (staff only)
 *   progress/{code}/assessments/{testId}   student-visible copy (AP format)
 *   classes/{class}/apFeedback/{testId}    released whole-class feedback + practice pool
 *   progress/{code}/gcseQuiz/{topic}       practice stats   ·   progress/{code}/gcseReview/{id}
 * Google Drive (teacher's account): "GCSE Question Bank" and "GCSE Teacher Notes" sheets.
 */
var gcse = {
  view: 'tests', className: '', testId: '', tests: {}, results: {}, targets: {}, codes: [],
  bank: null, pendingMap: null, pendingImport: null, filter: 'all'
};
var GCSE_BANK_NAME = 'GCSE Question Bank';
var GCSE_NOTES_NAME = 'GCSE Teacher Notes';

// ── Small helpers ───────────────────────────────────────────────
function gEsc(v) {
  return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function gEl(id) { return document.getElementById(id); }
function gTopicKey(code) { return String(code).replace(/\./g, '_'); }
function gFromTopicKey(key) { return String(key).replace(/_/g, '.'); }
function gSafeKey(v) { return String(v || '').trim().replace(/[.#$/\[\]]/g, '-'); }
function gName(code) { return (typeof studentName === 'function' && studentName(code)) || ''; }
function gIsStaff() { return !!(state && (state.isAdmin || state.isTeacher)); }
function gPct(a, p) { return p ? Math.round(a / p * 100) : null; }
function gRag(pct) {
  if (pct == null) return 'background:#f3f4f6;color:#9ca3af';
  if (pct >= 70) return 'background:#dcfce7;color:#166534';
  if (pct >= 40) return 'background:#fef3c7;color:#92400e';
  return 'background:#fee2e2;color:#991b1b';
}
function gDbError(e) {
  var msg = (e && e.message) || String(e);
  if (/permission/i.test(msg)) {
    return 'Firebase blocked this. Publish the updated rules first: copy firebase-rules.json into Firebase console → Realtime Database → Rules → Publish (it adds the new "gcse" section).';
  }
  return msg;
}
function gDownload(filename, text, type) {
  var blob = new Blob([text], { type: type || 'text/plain;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
function gCsv(rows) {
  return rows.map(function (r) {
    return r.map(function (c) { var s = String(c == null ? '' : c); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',');
  }).join('\n');
}
function gPrint(title, bodyHtml) {
  var w = window.open('', '_blank');
  if (!w) { alert('Allow pop-ups to print.'); return null; }
  w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>' + gEsc(title) + '</title><style>' +
    'body{font-family:system-ui,Segoe UI,Arial,sans-serif;color:#111;margin:24px;font-size:13px}h1{font-size:20px;margin:0 0 4px}h2{font-size:15px;margin:18px 0 6px}' +
    'table{border-collapse:collapse;width:100%;margin:6px 0}td,th{border:1px solid #ccc;padding:4px 6px;text-align:left;vertical-align:top}th{background:#f3f4f6}' +
    '.slip{page-break-after:always;border:1px solid #999;border-radius:8px;padding:14px;margin-bottom:16px}.muted{color:#666}.q{margin:14px 0;page-break-inside:avoid}' +
    '.lines{border-bottom:1px solid #bbb;height:22px}.noprint{margin-bottom:12px}@media print{.noprint{display:none}}</style></head><body>' +
    '<div class="noprint"><button onclick="window.print()">Print</button></div>' + bodyHtml + '</body></html>');
  w.document.close();
  return w;
}
function gGradeOptions(selected, allowBlank) {
  var html = allowBlank ? '<option value="">–</option>' : '';
  ['U', '1', '2', '3', '4', '5', '6', '7', '8', '9'].forEach(function (g) {
    var v = g === 'U' ? 0 : Number(g);
    html += '<option value="' + g + '"' + (selected === v ? ' selected' : '') + '>' + g + '</option>';
  });
  return html;
}

// ── Firebase loading ────────────────────────────────────────────
async function gcseLoadTests() {
  var snap = await state.db.ref('gcse/tests').get();
  gcse.tests = snap.exists() ? (snap.val() || {}) : {};
  return gcse.tests;
}
async function gcseLoadTargets() {
  var snap = await state.db.ref('gcse/targets').get();
  gcse.targets = snap.exists() ? (snap.val() || {}) : {};
  return gcse.targets;
}
async function gcseLoadClassCodes(className) {
  var snap = await state.db.ref('classes/' + className + '/codes').get();
  var codes = snap.exists() ? Object.keys(snap.val() || {}) : [];
  return codes.sort(function (a, b) { return (gName(a) || a).localeCompare(gName(b) || b); });
}
async function gcseLoadResults(testId) {
  var snap = await state.db.ref('gcse/results/' + testId).get();
  return snap.exists() ? (snap.val() || {}) : {};
}

// Used by AP Results: register paper tests for a class and return their canonical results.
async function gcseLoadPaperTestsForClass(className) {
  var out = { results: {} };
  try {
    var tests = await gcseLoadTests();
    var ids = Object.keys(tests).filter(function (id) { return tests[id] && tests[id].className === className; });
    await Promise.all(ids.map(async function (id) {
      var t = tests[id];
      gcseRegisterAssessment(id, t);
      var res = await gcseLoadResults(id);
      out.results[id] = {};
      Object.keys(res).forEach(function (code) {
        var r = res[code];
        if (!r || r.absent) return;
        out.results[id][code] = {
          completedAt: r.importedAt || t.createdAt, score: r.score, maxScore: r.maxScore,
          rubric: gcseRubric(t, r), className: className, type: 'paper', title: t.title, dp: r.dp || r.dpSuggested || null
        };
      });
    }));
  } catch (e) { /* rules not published yet, or no access – AP Results still works */ }
  return out;
}
function gcseRegisterAssessment(id, t) {
  if (typeof ASSESSMENTS === 'undefined' || !t) return;
  ASSESSMENTS[id] = {
    id: id, title: t.title, type: 'paper', hidden: true, maxScore: gcseTestTotal(t),
    criteria: (t.questions || []).map(function (q) { return { id: q.id, text: q.id + ' (' + (q.topics || []).join(', ') + ')', marks: q.marks }; })
  };
}
// The test's own boundaries, or the J277 default scaled to the test total.
function gcseBoundaries(t) {
  return (t && t.boundaries) || GcseCore.defaultBoundaries(t && (t.paperTotal || gcseTestTotal(t)));
}
// Paper 1 vs Paper 2: each question belongs to the paper of its first topic (1.x / 2.x).
// Each paper is graded on the OCR J277 component boundaries scaled to that paper's marks.
function gcsePaperSplit(questions, marks) {
  var papers = {};
  (questions || []).forEach(function (q) {
    var p = GcseCore.paperOf((q.topics || [])[0]);
    if (!p) return;
    var P = papers[p] || (papers[p] = { paper: p, a: 0, p: 0 });
    var v = marks ? marks[q.id] : null;
    P.a += v == null ? 0 : Number(v); P.p += Number(q.marks) || 0;
  });
  Object.keys(papers).forEach(function (k) {
    var P = papers[k];
    P.pct = gPct(P.a, P.p);
    P.grade = GcseCore.gradeFor(P.a, GcseCore.componentBoundaries(k, P.p));
  });
  var both = !!(papers['1'] && papers['2']);
  var focus = null;
  if (both && papers['1'].pct !== papers['2'].pct) focus = papers['1'].pct < papers['2'].pct ? '1' : '2';
  return { papers: papers, both: both, focus: focus };
}
function gcsePaperCell(P, showGrade) {
  if (!P) return '';
  return P.a + ' / ' + P.p + ' (' + P.pct + '%)' + (showGrade !== false && P.grade != null ? ' · <b>' + GcseCore.gradeLabel(P.grade) + '</b>' : '');
}
function gcseTestTotal(t) { return (t.questions || []).reduce(function (s, q) { return s + (Number(q.marks) || 0); }, 0); }
function gcseRubric(t, r) {
  return (t.questions || []).map(function (q) {
    var v = r.marks ? r.marks[q.id] : null;
    return { id: q.id, text: q.id, marks: q.marks, awarded: v == null ? 0 : v, attempted: v != null, topics: q.topics || [], command: q.command || '' };
  });
}

// ── Calculations ────────────────────────────────────────────────
function gcseStudentRows(t, results, targets, codes) {
  var all = codes.slice();
  Object.keys(results || {}).forEach(function (c) { if (all.indexOf(c) === -1) all.push(c); });
  var nq = (t.questions || []).length || 1;
  return all.map(function (code) {
    var r = results[code];
    var target = targets[code] && targets[code].grade != null ? Number(targets[code].grade) : null;
    if (!r) return { code: code, name: gName(code), missing: true, target: target };
    var grade = r.absent ? null : GcseCore.gradeFor(r.score, gcseBoundaries(t));
    var notAttempted = r.absent ? 0 : (t.questions || []).filter(function (q) { return !r.marks || r.marks[q.id] == null; }).length;
    var suggested = r.absent ? null : GcseCore.suggestDp(target, grade, notAttempted / nq);
    return {
      code: code, name: gName(code), absent: !!r.absent, marks: r.marks || {}, score: r.score, max: gcseTestTotal(t),
      pct: r.absent ? null : gPct(r.score, gcseTestTotal(t)), grade: grade, target: target,
      gap: (grade != null && target != null) ? grade - target : null,
      dp: r.dp != null ? Number(r.dp) : null, dpSuggested: suggested, notAttempted: notAttempted,
      split: r.absent ? null : gcsePaperSplit(t.questions, r.marks || {})
    };
  }).sort(function (a, b) { return (a.name || a.code).localeCompare(b.name || b.code); });
}
function gcseDp(row) { return row.dp != null ? row.dp : row.dpSuggested; }

function gcseTopicStats(t, rows) {
  var topics = {}, questions = [], commands = {};
  var sat = rows.filter(function (r) { return !r.missing && !r.absent; });
  (t.questions || []).forEach(function (q) {
    var total = 0, notAttempted = 0;
    sat.forEach(function (r) {
      var v = r.marks[q.id];
      if (v == null) notAttempted++; else total += Number(v) || 0;
      (q.topics || []).forEach(function (tc) {
        var T = topics[tc] || (topics[tc] = { code: tc, label: J277.label(tc), awarded: 0, possible: 0, per: {} });
        T.awarded += v == null ? 0 : Number(v); T.possible += q.marks;
        var p = T.per[r.code] || (T.per[r.code] = { a: 0, p: 0 });
        p.a += v == null ? 0 : Number(v); p.p += q.marks;
      });
    });
    var possible = q.marks * sat.length;
    questions.push({ id: q.id, marks: q.marks, topics: q.topics || [], command: q.command || '', avg: sat.length ? total / sat.length : 0, pct: gPct(total, possible), notAttempted: notAttempted });
    if (q.command) {
      var C = commands[q.command] || (commands[q.command] = { word: q.command, awarded: 0, possible: 0 });
      C.awarded += total; C.possible += possible;
    }
  });
  var list = Object.keys(topics).map(function (k) { var T = topics[k]; T.pct = gPct(T.awarded, T.possible); T.lost = T.possible - T.awarded; return T; })
    .sort(function (a, b) { return a.code.localeCompare(b.code, undefined, { numeric: true }); });
  return {
    topics: list, questions: questions,
    commands: Object.keys(commands).map(function (k) { var C = commands[k]; C.pct = gPct(C.awarded, C.possible); return C; }).sort(function (a, b) { return a.pct - b.pct; }),
    reteach: list.slice().sort(function (a, b) { return b.lost - a.lost; }).filter(function (T) { return T.lost > 0; }).slice(0, 5),
    best: list.slice().sort(function (a, b) { return b.pct - a.pct; }).slice(0, 3),
    sat: sat
  };
}
// Each student's weakest topic → intervention groups.
function gcseInterventionGroups(stats) {
  var groups = {};
  stats.sat.forEach(function (r) {
    var worst = null;
    stats.topics.forEach(function (T) {
      var p = T.per[r.code]; if (!p || p.p < 1) return;
      var pct = p.a / p.p;
      if (pct < 0.5 && (!worst || pct < worst.pct)) worst = { code: T.code, pct: pct };
    });
    if (worst) (groups[worst.code] = groups[worst.code] || []).push(r);
  });
  return Object.keys(groups).map(function (k) { return { topic: k, students: groups[k] }; })
    .sort(function (a, b) { return b.students.length - a.students.length; });
}
function gcseWorkingGradeFromHistory(history) {
  var withGrade = history.filter(function (h) { return h.grade != null; }).sort(function (a, b) { return a.at - b.at; });
  return withGrade.length ? withGrade[withGrade.length - 1].grade : null;
}

// ── Topic Codes Guide ───────────────────────────────────────────
function gcseTopicCodesGuide(kind) {
  var L = [];
  L.push('TOPIC CODES GUIDE – OCR GCSE Computer Science (J277)');
  L.push('');
  if (kind === 'bank') {
    L.push('TASK: Turn the attached past paper (and mark scheme) into question-bank rows.');
    L.push('Only use real past-paper questions. Put the paper and question number in Source, e.g. "J277/01 June 2023 Q3b".');
    L.push('A reworded question must leave Source blank and put the original question\'s ID in "Reworded from".');
    L.push('');
    L.push('OUTPUT: tab-separated rows with these columns (copy straight into the "Questions" tab):');
    L.push(GcseCore.BANK_HEADERS.join('\t'));
    L.push('');
    L.push('Type: mcq (options in Options separated by |, Answer = A/B/C/D), short (1–2 marks, auto-marked),');
    L.push('      long (3+ marks, self-marked with the mark scheme), paper (paper-only, e.g. drawing/trace tables).');
    L.push('Marking rules (short only, one mark point per line – use \\n between lines inside a cell):');
    L.push('  [MDR] holds|stores|contains -> data|instruction ! address');
    L.push('     (subject in brackets, verbs, -> what it must hold, ! common wrong answers)');
    L.push('  [PC] holds|stores -> address+next ! instruction|address+current   (+next = must also say "next")');
    L.push('  =fetch & decode & execute        (all of these words)');
    L.push('  =lossless|no data lost           (any of these words)');
    L.push('Test answers (short only, one per line "marks | answer"): at least 3, including one full-mark and one 0-mark');
    L.push('answer, plus tricky wrong answers students really write, e.g. "0 | The MDR stores the address of the instruction".');
  } else {
    L.push('TASK: Read the attached question paper and list EVERY question part.');
    L.push('For each part give: question number, maximum marks, the most specific topic code from the list below,');
    L.push('an optional second topic code (only if the question clearly needs two topics), and the command word.');
    L.push('Rules: only use codes from the list. Prefer sub-topic codes (e.g. 1.1.1e) over spec points (1.1.1).');
    L.push('Do not invent topics. Do not include student names or marks.');
    L.push('');
    L.push('OUTPUT FORMAT (CSV, exactly these columns, one row per question part):');
    L.push('Question,Max marks,Topic,Second topic,Command word');
    L.push('Q1a,2,1.1.1e,,State');
    L.push('Q1b,3,1.1.2a,1.1.2c,Explain');
    L.push('');
    L.push('FINAL CHECK: add up the Max marks column and confirm it equals the paper total. Say if it does not.');
  }
  L.push('');
  L.push('COMMAND WORDS: ' + J277.COMMAND_WORDS.join(', '));
  L.push('');
  L.push('TOPIC CODES:');
  J277.list.forEach(function (n) {
    if (n.level === 0) { L.push(''); L.push('== ' + n.title + ' =='); return; }
    var pad = n.level === 1 ? '' : (n.level === 2 ? '  ' : '    ');
    L.push(pad + n.code + '  ' + n.title);
    if (n.level === 3 && J277.MIXUPS[n.code]) J277.MIXUPS[n.code].forEach(function (m) { L.push(pad + '        common mix-up: ' + m); });
  });
  return L.join('\n');
}

// ── Tab shell ───────────────────────────────────────────────────
async function gcseOpenTab() {
  var panel = gEl('admin-gcse-tab');
  if (!panel) return;
  if (!panel.dataset.ready) {
    panel.innerHTML =
      '<div class="flex flex-wrap gap-2 mb-3">' +
        ['tests:Tests & WCF', 'bank:Question Bank', 'generate:Generate Test', 'review:Review answers'].map(function (p) {
          var k = p.split(':');
          return '<button type="button" class="gcse-subtab px-3 py-1.5 rounded border text-sm font-semibold" data-view="' + k[0] + '">' + k[1] + '</button>';
        }).join('') +
      '</div><div id="gcse-status" class="text-xs mb-2"></div><div id="gcse-body"></div>';
    panel.dataset.ready = '1';
    panel.querySelectorAll('.gcse-subtab').forEach(function (b) { b.onclick = function () { gcseSetView(b.dataset.view); }; });
  }
  gcseSetView(gcse.view);
}
function gcseStatus(msg, isError) {
  var el = gEl('gcse-status'); if (!el) return;
  el.textContent = msg || '';
  el.className = 'text-xs mb-2 ' + (isError ? 'text-red-600' : 'text-gray-500');
}
function gcseSetView(view) {
  gcse.view = view;
  document.querySelectorAll('.gcse-subtab').forEach(function (b) {
    var on = b.dataset.view === view;
    b.className = 'gcse-subtab px-3 py-1.5 rounded border text-sm font-semibold ' + (on ? 'border-[rgb(176,28,35)] text-[rgb(176,28,35)] bg-red-50' : 'border-gray-300 text-gray-600 bg-white');
  });
  gcseStatus('');
  if (view === 'tests') return gcseRenderTestsView();
  if (view === 'bank') return gcseRenderBankView();
  if (view === 'generate') return gcseRenderGenerateView();
  if (view === 'review') return gcseRenderReviewView();
}
async function gcseClassOptions(selected) {
  var names = typeof getClassNames === 'function' ? await getClassNames() : [];
  return '<option value="">— select class —</option>' + names.map(function (n) {
    return '<option value="' + gEsc(n) + '"' + (n === selected ? ' selected' : '') + '>' + gEsc(n) + '</option>';
  }).join('');
}

// ── Tests & WCF view ────────────────────────────────────────────
async function gcseRenderTestsView() {
  var body = gEl('gcse-body');
  body.innerHTML = '<p class="text-gray-400 text-sm">Loading…</p>';
  try {
    await gcseLoadTests();
  } catch (e) { if (gcse.view === 'tests') body.innerHTML = '<p class="text-red-600 text-sm">' + gEsc(gDbError(e)) + '</p>'; return; }
  var classOpts = await gcseClassOptions(gcse.className);
  if (gcse.view !== 'tests') return; // user switched sub-tab while loading
  body.innerHTML =
    '<div class="flex flex-wrap items-end gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">' +
      '<div><label class="block text-xs text-gray-500 mb-1">Class</label><select id="gcse-class" class="border border-gray-300 rounded px-2 py-1.5 text-sm">' + classOpts + '</select></div>' +
      '<div><label class="block text-xs text-gray-500 mb-1">Test</label><select id="gcse-test" class="border border-gray-300 rounded px-2 py-1.5 text-sm min-w-[260px]"></select></div>' +
      '<label class="jhncc-primary px-3 py-1.5 rounded text-sm font-semibold cursor-pointer" title="One spreadsheet with the questions (number, marks, topic) and every student\'s marks">Import test spreadsheet<input type="file" id="gcse-import-whole" accept=".xlsx,.xls,.csv" class="hidden"></label>' +
      '<button type="button" id="gcse-blank-template" class="px-3 py-1.5 rounded border border-gray-300 bg-white text-sm">Download blank test spreadsheet</button>' +
      '<button type="button" id="gcse-new-test" class="px-3 py-1.5 rounded border border-gray-300 bg-white text-sm">New test (paste map)</button>' +
      '<button type="button" id="gcse-guide" class="px-3 py-1.5 rounded border border-gray-300 bg-white text-sm">Download Topic Codes Guide</button>' +
    '</div><div id="gcse-test-body"></div>';
  gEl('gcse-class').onchange = function () { gcse.className = this.value; gcse.testId = ''; gcseFillTestSelect(); gcseRenderTest(); };
  gEl('gcse-test').onchange = function () { gcse.testId = this.value; gcseRenderTest(); };
  gEl('gcse-new-test').onclick = function () { gcseRenderNewTestForm(); };
  gEl('gcse-blank-template').onclick = function () { gcseDownloadBlankTemplate(); };
  gEl('gcse-import-whole').onchange = function () { if (this.files[0]) gcseHandleWholeImport(this.files[0]); this.value = ''; };
  gEl('gcse-guide').onclick = function () { gDownload('Topic Codes Guide.txt', gcseTopicCodesGuide('test')); };
  gcseFillTestSelect();
  await gcseRenderTest();
}
function gcseTestsForClass(className) {
  return Object.keys(gcse.tests).filter(function (id) { return gcse.tests[id] && gcse.tests[id].className === className; })
    .sort(function (a, b) { return (gcse.tests[b].createdAt || 0) - (gcse.tests[a].createdAt || 0); });
}
function gcseFillTestSelect() {
  var sel = gEl('gcse-test'); if (!sel) return;
  var ids = gcse.className ? gcseTestsForClass(gcse.className) : [];
  sel.innerHTML = ids.length ? ids.map(function (id) {
    return '<option value="' + gEsc(id) + '"' + (id === gcse.testId ? ' selected' : '') + '>' + gEsc(gcse.tests[id].title) + '</option>';
  }).join('') : '<option value="">' + (gcse.className ? 'No paper tests yet – click "New paper test"' : 'Choose a class first') + '</option>';
  if (ids.length && ids.indexOf(gcse.testId) === -1) gcse.testId = ids[0];
  if (!ids.length) gcse.testId = '';
  sel.value = gcse.testId;
}

function gcseBoundaryInputs(prefix, b) {
  b = b || {};
  var h = '<div class="flex flex-wrap gap-2">';
  for (var g = 9; g >= 1; g--) {
    h += '<label class="text-xs text-gray-600 flex flex-col items-center">Grade ' + g +
      '<input type="number" min="0" class="' + prefix + '-boundary w-16 border border-gray-300 rounded px-1 py-1 text-sm text-center" data-grade="' + g + '" value="' + (b[g] != null ? gEsc(b[g]) : '') + '"></label>';
  }
  return h + '</div>';
}
function gcseReadBoundaries(prefix) {
  var b = {}, any = false;
  document.querySelectorAll('.' + prefix + '-boundary').forEach(function (inp) {
    if (inp.value !== '') { b[inp.dataset.grade] = Number(inp.value); any = true; }
  });
  return any ? b : null;
}

function gcseRenderNewTestForm(prefill) {
  var box = gEl('gcse-test-body');
  if (!gcse.className) { gcseStatus('Choose a class first.', true); return; }
  prefill = prefill || {};
  var others = Object.keys(gcse.tests).filter(function (id) { return gcse.tests[id].boundaries || gcse.tests[id].questions; });
  box.innerHTML =
    '<div class="border border-gray-200 rounded-lg p-4 space-y-3">' +
      '<h3 class="font-bold text-gray-800">New paper test for ' + gEsc(gcse.className) + '</h3>' +
      '<div class="grid grid-cols-1 md:grid-cols-3 gap-3">' +
        '<label class="text-xs text-gray-600">Title<input id="gcse-nt-title" class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="Y10 Mock 1 – Nov 2026" value="' + gEsc(prefill.title || '') + '"></label>' +
        '<label class="text-xs text-gray-600">Paper total (marks)<input id="gcse-nt-total" type="number" min="1" class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" value="' + gEsc(prefill.total || '') + '"></label>' +
        '<label class="text-xs text-gray-600">Copy from another test<select id="gcse-nt-copy" class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"><option value="">—</option>' +
          others.map(function (id) { return '<option value="' + gEsc(id) + '">' + gEsc(gcse.tests[id].title + ' (' + gcse.tests[id].className + ')') + '</option>'; }).join('') + '</select></label>' +
      '</div>' +
      '<div><div class="text-xs text-gray-600 mb-1">Grade boundaries (minimum marks). Filled with the ' + GcseCore.DEFAULT_BOUNDARY_SOURCE.label + ' boundaries as percentages – change them if you have real ones. ' +
        '<button type="button" id="gcse-nt-defaults" class="underline text-blue-700">Use J277 default</button></div>' + gcseBoundaryInputs('gcse-nt', prefill.boundaries || GcseCore.defaultBoundaries(prefill.total)) + '</div>' +
      '<div><div class="text-xs text-gray-600 mb-1">Test map – paste the table from the Topic Codes Guide (Question, Max marks, Topic, Second topic, Command word)</div>' +
        '<textarea id="gcse-nt-map" rows="8" class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono" placeholder="Question,Max marks,Topic,Second topic,Command word&#10;Q1a,2,1.1.1e,,State">' + gEsc(prefill.map || '') + '</textarea></div>' +
      '<div class="flex gap-2"><button type="button" id="gcse-nt-check" class="px-3 py-1.5 rounded border border-blue-400 text-blue-700 bg-blue-50 text-sm font-semibold">Check test map</button>' +
        '<button type="button" id="gcse-nt-save" class="jhncc-primary px-3 py-1.5 rounded text-sm font-semibold" disabled>Save test</button>' +
        '<button type="button" id="gcse-nt-cancel" class="px-3 py-1.5 rounded border border-gray-300 text-sm">Cancel</button></div>' +
      '<div id="gcse-nt-check-out"></div>' +
    '</div>';
  gEl('gcse-nt-copy').onchange = function () {
    var t = gcse.tests[this.value]; if (!t) return;
    if (t.boundaries) document.querySelectorAll('.gcse-nt-boundary').forEach(function (inp) { inp.value = t.boundaries[inp.dataset.grade] != null ? t.boundaries[inp.dataset.grade] : ''; });
    if (t.questions) gEl('gcse-nt-map').value = 'Question,Max marks,Topic,Second topic,Command word\n' + t.questions.map(function (q) {
      return [q.id, q.marks, q.topics[0] || '', q.topics[1] || '', q.command || ''].join(',');
    }).join('\n');
    if (!gEl('gcse-nt-total').value) gEl('gcse-nt-total').value = gcseTestTotal(t);
    if (!gEl('gcse-nt-title').value) gEl('gcse-nt-title').value = t.title;
  };
  gEl('gcse-nt-cancel').onclick = gcseRenderTest;
  var fillDefaults = function (force) {
    var total = Number(gEl('gcse-nt-total').value) || (gcse.pendingMap && gcse.pendingMap.total);
    var b = GcseCore.defaultBoundaries(total); if (!b) return;
    var inputs = document.querySelectorAll('.gcse-nt-boundary');
    var auto = Array.prototype.every.call(inputs, function (i) { return i.value === '' || i.dataset.auto === '1'; });
    if (!force && !auto) return;
    inputs.forEach(function (i) { i.value = b[i.dataset.grade]; i.dataset.auto = '1'; });
  };
  document.querySelectorAll('.gcse-nt-boundary').forEach(function (i) {
    if (!prefill.boundaries && i.value !== '') i.dataset.auto = '1';
    i.addEventListener('input', function () { i.dataset.auto = ''; });
  });
  gEl('gcse-nt-total').addEventListener('input', function () { fillDefaults(false); });
  gEl('gcse-nt-defaults').onclick = function () { fillDefaults(true); };
  gEl('gcse-nt-map').oninput = function () { gEl('gcse-nt-save').disabled = true; };
  gEl('gcse-nt-check').onclick = function () {
    var res = GcseCore.parseTestMap(gEl('gcse-nt-map').value, J277, Number(gEl('gcse-nt-total').value) || null);
    gcse.pendingMap = res;
    var out = gEl('gcse-nt-check-out');
    var h = '';
    if (res.errors.length) h += '<div class="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700 mb-2"><b>Fix these first:</b><ul class="list-disc ml-5">' + res.errors.map(function (e) { return '<li>' + gEsc(e) + '</li>'; }).join('') + '</ul></div>';
    if (res.warnings.length) h += '<div class="rounded border border-amber-200 bg-amber-50 p-2 text-sm text-amber-800 mb-2"><ul class="list-disc ml-5">' + res.warnings.map(function (e) { return '<li>' + gEsc(e) + '</li>'; }).join('') + '</ul></div>';
    h += '<p class="text-sm mb-1"><b>' + res.questions.length + '</b> questions, <b>' + res.total + '</b> marks. Scan the topic names below:</p>';
    h += '<table class="w-full text-xs border border-gray-200"><tr class="bg-gray-50"><th class="p-1 text-left">Q</th><th class="p-1">Marks</th><th class="p-1 text-left">Topic(s)</th><th class="p-1">Command</th></tr>' +
      res.questions.map(function (q) {
        return '<tr class="border-t"><td class="p-1 font-semibold">' + gEsc(q.id) + '</td><td class="p-1 text-center">' + gEsc(q.marks) + '</td><td class="p-1">' +
          q.topics.map(function (t) { return J277.isValid(t) ? gEsc(J277.label(t)) : '<span class="text-red-600">' + gEsc(t) + ' (unknown)</span>'; }).join('<br>') +
          '</td><td class="p-1 text-center">' + gEsc(q.command) + '</td></tr>';
      }).join('') + '</table>';
    out.innerHTML = h;
    gEl('gcse-nt-save').disabled = !!res.errors.length;
  };
  gEl('gcse-nt-save').onclick = async function () {
    var title = gEl('gcse-nt-title').value.trim();
    if (!title) { gcseStatus('Give the test a title.', true); return; }
    var res = gcse.pendingMap;
    if (!res || res.errors.length) return;
    var id = 'gcse-' + Date.now().toString(36);
    var test = {
      title: title, className: gcse.className, createdAt: Date.now(), paperTotal: Number(gEl('gcse-nt-total').value) || res.total,
      questions: res.questions.map(function (q) { return { id: gSafeKey(q.id), marks: q.marks, topics: q.topics, command: q.command || '' }; }),
      boundaries: gcseReadBoundaries('gcse-nt'), showGrades: false
    };
    if (prefill.bankIds) test.questions.forEach(function (q, i) { if (prefill.bankIds[i]) q.bankId = prefill.bankIds[i]; });
    try {
      await state.db.ref('gcse/tests/' + id).set(test);
      gcse.tests[id] = test; gcse.testId = id;
      gcseFillTestSelect(); gcseRenderTest();
      gcseStatus('Saved "' + title + '". Next: download the template, fill in the marks and upload it.');
    } catch (e) { gcseStatus(gDbError(e), true); }
  };
}

async function gcseRenderTest() {
  var box = gEl('gcse-test-body'); if (!box) return;
  var seq = gcse.renderSeq = (gcse.renderSeq || 0) + 1;   // a newer render wins
  var t = gcse.tests[gcse.testId];
  if (!gcse.className) { box.innerHTML = '<p class="text-gray-400 text-sm py-6 text-center">Choose a class.</p>'; return; }
  if (!t) { box.innerHTML = '<p class="text-gray-400 text-sm py-6 text-center">No paper test selected. Click "New paper test" to add the mock you have just done.</p>'; return; }
  box.innerHTML = '<p class="text-gray-400 text-sm">Loading results…</p>';
  try {
    var data = await Promise.all([gcseLoadResults(gcse.testId), gcseLoadTargets(), gcseLoadClassCodes(gcse.className)]);
    if (seq !== gcse.renderSeq || !box.isConnected) return;
    gcse.results = data[0]; gcse.codes = data[2];
  } catch (e) { if (box.isConnected) box.innerHTML = '<p class="text-red-600 text-sm">' + gEsc(gDbError(e)) + '</p>'; return; }
  var rows = gcseStudentRows(t, gcse.results, gcse.targets, gcse.codes);
  var hasResults = rows.some(function (r) { return !r.missing; });
  var h = '<div class="flex flex-wrap gap-2 mb-3">' +
    '<button type="button" id="gcse-dl-template" class="jhncc-primary px-3 py-1.5 rounded text-sm font-semibold">Download template</button>' +
    '<label class="px-3 py-1.5 rounded border border-blue-400 text-blue-700 bg-blue-50 text-sm font-semibold cursor-pointer">Upload filled template<input type="file" id="gcse-upload" accept=".xlsx,.xls,.csv" class="hidden"></label>' +
    (hasResults ? '<button type="button" id="gcse-print-wcf" class="px-3 py-1.5 rounded border border-gray-300 text-sm">Print WCF sheet</button>' +
      '<button type="button" id="gcse-print-slips" class="px-3 py-1.5 rounded border border-gray-300 text-sm">Print feedback slips</button>' +
      '<button type="button" id="gcse-export" class="px-3 py-1.5 rounded border border-gray-300 text-sm">Export grades</button>' +
      '<button type="button" id="gcse-release" class="px-3 py-1.5 rounded border border-green-500 text-green-700 bg-green-50 text-sm font-semibold">Release feedback</button>' +
      '<label class="flex items-center gap-1 text-xs text-gray-600"><input type="checkbox" id="gcse-show-grades"' + (t.showGrades ? ' checked' : '') + '> Show grades to students</label>' : '') +
    '<button type="button" id="gcse-edit-test" class="px-3 py-1.5 rounded border border-gray-300 text-sm">Boundaries / settings</button>' +
    '</div><div id="gcse-import-out"></div><div id="gcse-settings-out"></div>';
  if (!hasResults) {
    h += '<div class="rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">No marks yet. <b>Download template</b> (it has every student\'s name and code), type in the marks, then <b>Upload filled template</b>.' +
      ' Use <b>ABS</b> for absent students and leave a cell <b>blank</b> if a question was not attempted.</div>';
  } else {
    h += gcseWcfHtml(t, rows);
  }
  box.innerHTML = h;
  gEl('gcse-dl-template').onclick = function () { gcseDownloadTemplate(t, rows); };
  gEl('gcse-upload').onchange = function () { if (this.files[0]) gcseHandleUpload(this.files[0]); this.value = ''; };
  gEl('gcse-edit-test').onclick = function () { gcseRenderSettings(t); };
  if (hasResults) gcseBindWcf(t, rows);
}

function gcseRenderSettings(t) {
  var out = gEl('gcse-settings-out');
  out.innerHTML = '<div class="border border-gray-200 rounded-lg p-3 mb-3 space-y-2">' +
    '<label class="text-xs text-gray-600 block">Title<input id="gcse-st-title" class="w-full border border-gray-300 rounded px-2 py-1 text-sm" value="' + gEsc(t.title) + '"></label>' +
    '<div class="text-xs text-gray-600">Grade boundaries (minimum marks)' + (t.boundaries ? '' : ' – currently the J277 default') +
      ' <button type="button" id="gcse-st-defaults" class="underline text-blue-700">Reset to J277 default</button></div>' + gcseBoundaryInputs('gcse-st', gcseBoundaries(t)) +
    '<div class="flex gap-2"><button type="button" id="gcse-st-save" class="jhncc-primary px-3 py-1 rounded text-sm">Save</button>' +
    '<button type="button" id="gcse-st-delete" class="px-3 py-1 rounded border border-red-400 text-red-600 text-sm">Delete test</button></div></div>';
  gEl('gcse-st-defaults').onclick = function () {
    var b = GcseCore.defaultBoundaries(t.paperTotal || gcseTestTotal(t));
    document.querySelectorAll('.gcse-st-boundary').forEach(function (i) { i.value = b[i.dataset.grade]; });
  };
  gEl('gcse-st-save').onclick = async function () {
    try {
      await state.db.ref('gcse/tests/' + gcse.testId).update({ title: gEl('gcse-st-title').value.trim() || t.title, boundaries: gcseReadBoundaries('gcse-st') });
      await gcseLoadTests(); gcseFillTestSelect(); gcseRenderTest(); gcseStatus('Saved.');
    } catch (e) { gcseStatus(gDbError(e), true); }
  };
  gEl('gcse-st-delete').onclick = async function () {
    if (!confirm('Delete "' + t.title + '" and all its marks? Students\' copies and released feedback are removed too.')) return;
    var updates = {};
    updates['gcse/tests/' + gcse.testId] = null;
    updates['gcse/results/' + gcse.testId] = null;
    updates['classes/' + t.className + '/apFeedback/' + gcse.testId] = null;
    Object.keys(gcse.results || {}).forEach(function (code) { updates['progress/' + code + '/assessments/' + gcse.testId] = null; });
    try { await state.db.ref().update(updates); delete gcse.tests[gcse.testId]; gcse.testId = ''; gcseFillTestSelect(); gcseRenderTest(); gcseStatus('Deleted.'); }
    catch (e) { gcseStatus(gDbError(e), true); }
  };
}

// ── Template download / upload ──────────────────────────────────
function gcseDownloadTemplate(t, rows) {
  var qs = t.questions || [];
  var aoa = [
    ['Question', '', '', ''].concat(qs.map(function (q) { return q.id; })),
    ['Max marks', '', '', ''].concat(qs.map(function (q) { return q.marks; })),
    ['Topic', '', '', ''].concat(qs.map(function (q) { return (q.topics || []).join(' + '); })),
    ['Command word', '', '', ''].concat(qs.map(function (q) { return q.command || ''; })),
    ['Name', 'Code', 'Target grade', 'DP (1-4)'].concat(qs.map(function (q) { return q.id; }))
  ];
  rows.forEach(function (r) {
    var line = [r.name || '', r.code, r.target == null ? '' : GcseCore.gradeLabel(r.target), r.dp != null ? r.dp : ''];
    qs.forEach(function (q) {
      if (r.missing) { line.push(''); return; }
      if (r.absent) { line.push('ABS'); return; }
      line.push(r.marks[q.id] == null ? '' : r.marks[q.id]);
    });
    aoa.push(line);
  });
  gcseWriteTemplate((t.title + ' - ' + t.className).replace(/[\\/:*?"<>|]/g, '-'), aoa, qs.length);
}
function gcseWriteTemplate(file, aoa, nq) {
  if (typeof XLSX !== 'undefined') {
    var wb = XLSX.utils.book_new();
    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 24 }, { wch: 22 }, { wch: 12 }, { wch: 9 }].concat(new Array(nq).fill(0).map(function () { return { wch: 8 }; }));
    XLSX.utils.book_append_sheet(wb, ws, 'Marks');
    var topics = [['Code', 'Topic']].concat(J277.list.filter(function (n) { return n.level >= 2; }).map(function (n) { return [n.code, n.title]; }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(topics), 'Topics');
    var help = [['How to fill this in'], ['Rows 1-4 describe the test: question number, max marks, topic code(s) from the Topics tab (use + for two), command word (optional).'],
      ['Type each student\'s mark for each question.'], ['ABS = absent (left out of averages and grades).'],
      ['Leave a cell blank if the question was NOT attempted (different from 0).'], ['Do not change the Code column – it is how students are matched.'],
      ['Target grade: U or 1-9 (optional). DP: 1 (best) to 4 (worst) – optional, the site suggests one from the target grade.']];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(help), 'Help');
    XLSX.writeFile(wb, file + '.xlsx');
  } else {
    gDownload(file + '.csv', gCsv(aoa), 'text/csv');
  }
}

function gcseReadUploadRows(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onerror = function () { reject(new Error('Could not read the file.')); };
    if (/\.csv$/i.test(file.name) || typeof XLSX === 'undefined') {
      reader.onload = function () {
        resolve(String(reader.result).split(/\r?\n/).map(function (l) { return GcseCore.splitRow(l); }));
      };
      reader.readAsText(file);
    } else {
      reader.onload = function () {
        try {
          var wb = XLSX.read(new Uint8Array(reader.result), { type: 'array' });
          var ws = wb.Sheets.Marks || wb.Sheets[wb.SheetNames[0]];
          resolve(XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' }));
        } catch (e) { reject(e); }
      };
      reader.readAsArrayBuffer(file);
    }
  });
}

async function gcseHandleUpload(file) {
  var t = gcse.tests[gcse.testId]; if (!t) return;
  var out = gEl('gcse-import-out');
  out.innerHTML = '<p class="text-gray-400 text-sm">Reading ' + gEsc(file.name) + '…</p>';
  var grid;
  try { grid = await gcseReadUploadRows(file); } catch (e) { out.innerHTML = '<p class="text-red-600 text-sm">' + gEsc(e.message) + '</p>'; return; }
  var imp = gcseParseUpload(t, grid, gcse.codes);
  gcse.pendingImport = imp;
  gcseRenderImportCheck(t, imp);
}

// Pure: turn the uploaded grid into checked rows.
function gcseParseUpload(t, grid, classCodes) {
  var res = { rows: [], errors: [], warnings: [] };
  var hi = grid.findIndex(function (r) { return String(r[0] || '').trim().toLowerCase() === 'name' && String(r[1] || '').trim().toLowerCase() === 'code'; });
  if (hi === -1) { res.errors.push('Could not find the "Name | Code" header row – use the downloaded template.'); return res; }
  var header = grid[hi].map(function (c) { return String(c || '').trim(); });
  var qcol = {};
  (t.questions || []).forEach(function (q) {
    var idx = header.findIndex(function (h, i) { return i >= 4 && h.toLowerCase() === q.id.toLowerCase(); });
    if (idx === -1) res.errors.push('Column for ' + q.id + ' is missing from the file.');
    else qcol[q.id] = idx;
  });
  header.forEach(function (h, i) {
    if (i >= 4 && h && !(t.questions || []).some(function (q) { return q.id.toLowerCase() === h.toLowerCase(); })) res.warnings.push('Column "' + h + '" is not in this test and was ignored.');
  });
  var lowerCodes = {}; classCodes.forEach(function (c) { lowerCodes[c.toLowerCase()] = c; });
  var seen = {};
  var nq = (t.questions || []).length || 1;
  for (var r = hi + 1; r < grid.length; r++) {
    var line = grid[r] || [];
    var rawCode = String(line[1] || '').trim();
    if (!rawCode && !String(line[0] || '').trim()) continue;
    var row = { line: r + 1, name: String(line[0] || '').trim(), code: lowerCodes[rawCode.toLowerCase()] || rawCode, problems: [], marks: {}, absent: false };
    if (!rawCode) row.problems.push('No code');
    else if (!lowerCodes[rawCode.toLowerCase()]) row.problems.push('Code not in ' + t.className);
    if (seen[row.code.toLowerCase()]) row.problems.push('Duplicate row');
    seen[row.code.toLowerCase()] = true;
    var tg = GcseCore.parseGrade(line[2]);
    if (tg === undefined) row.problems.push('Target grade "' + line[2] + '" should be U or 1–9');
    row.target = tg === undefined ? null : tg;
    var dpRaw = String(line[3] || '').trim();
    row.dp = dpRaw ? Number(dpRaw) : null;
    if (dpRaw && !(row.dp >= 1 && row.dp <= 4 && Math.round(row.dp) === row.dp)) { row.problems.push('DP must be 1–4'); row.dp = null; }
    var abs = 0, score = 0, na = 0;
    (t.questions || []).forEach(function (q) {
      var v = qcol[q.id] == null ? '' : String(line[qcol[q.id]] == null ? '' : line[qcol[q.id]]).trim();
      if (/^abs(ent)?$/i.test(v)) { abs++; row.marks[q.id] = null; return; }
      if (v === '') { row.marks[q.id] = null; na++; return; }
      var n = Number(v);
      if (isNaN(n) || n < 0) { row.problems.push(q.id + ': "' + v + '" is not a mark'); row.marks[q.id] = null; return; }
      if (n > q.marks) row.problems.push(q.id + ': ' + n + ' is more than ' + q.marks);
      row.marks[q.id] = n; score += n;
    });
    row.absent = abs > 0 && abs + na === nq && score === 0;
    if (abs > 0 && !row.absent) row.problems.push('ABS in some questions but not all');
    row.score = row.absent ? null : score;
    row.notAttempted = row.absent ? 0 : na;
    row.grade = row.absent ? null : GcseCore.gradeFor(score, gcseBoundaries(t));
    var target = row.target != null ? row.target : (gcse.targets[row.code] && gcse.targets[row.code].grade != null ? Number(gcse.targets[row.code].grade) : null);
    row.effectiveTarget = target;
    row.dpSuggested = row.absent ? null : GcseCore.suggestDp(target, row.grade, na / nq);
    res.rows.push(row);
  }
  classCodes.forEach(function (c) { if (!seen[c.toLowerCase()]) res.warnings.push((gName(c) || c) + ' is in the class but not in the file.'); });
  if (!res.rows.length) res.errors.push('No student rows found.');
  return res;
}

function gcseRenderImportCheck(t, imp) {
  var out = gEl('gcse-import-out');
  var blocking = imp.errors.length || imp.rows.some(function (r) { return r.problems.length; });
  var h = '<div class="border border-gray-200 rounded-lg p-3 mb-4"><h4 class="font-bold text-gray-800 mb-2">Check before saving</h4>';
  h += gcseImportTableHtml(t, imp);
  h += '<div class="flex gap-2 mt-3"><button type="button" id="gcse-import-save" class="jhncc-primary px-3 py-1.5 rounded text-sm font-semibold"' + (blocking ? ' disabled' : '') + '>Save results</button>' +
    '<button type="button" id="gcse-import-cancel" class="px-3 py-1.5 rounded border border-gray-300 text-sm">Cancel</button>' +
    (blocking ? '<span class="text-xs text-red-600 self-center">Fix the highlighted rows in the file and upload it again.</span>' : '<span class="text-xs text-gray-500 self-center">Re-uploading later updates these results (it never duplicates them).</span>') + '</div></div>';
  out.innerHTML = h;
  gEl('gcse-import-cancel').onclick = function () { out.innerHTML = ''; gcse.pendingImport = null; };
  if (!blocking) gEl('gcse-import-save').onclick = function () { gcseSaveImport(t, imp); };
}

function gcseImportTableHtml(t, imp) {
  var h = '';
  if (imp.errors.length) h += '<div class="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700 mb-2"><ul class="list-disc ml-5">' + imp.errors.map(function (e) { return '<li>' + gEsc(e) + '</li>'; }).join('') + '</ul></div>';
  if (imp.warnings.length) h += '<div class="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 mb-2"><ul class="list-disc ml-5">' + imp.warnings.map(function (e) { return '<li>' + gEsc(e) + '</li>'; }).join('') + '</ul></div>';
  return h + '<div class="overflow-x-auto"><table class="w-full text-xs border border-gray-200"><tr class="bg-gray-50"><th class="p-1 text-left">Student</th><th class="p-1">Score</th><th class="p-1">Grade</th><th class="p-1">Target</th><th class="p-1">Not attempted</th><th class="p-1">DP</th><th class="p-1 text-left">Problems</th></tr>' +
    imp.rows.map(function (r) {
      var dpCell = r.dp != null ? '<b>' + r.dp + '</b>' : (r.dpSuggested != null ? r.dpSuggested + ' <span class="text-gray-400">(suggested)</span>' : '–');
      return '<tr class="border-t ' + (r.problems.length ? 'bg-red-50' : '') + '"><td class="p-1">' + gEsc(r.name || '') + ' <span class="text-gray-400">' + gEsc(r.code) + '</span></td>' +
        '<td class="p-1 text-center">' + (r.absent ? 'ABS' : r.score + ' / ' + gcseTestTotal(t)) + '</td>' +
        '<td class="p-1 text-center">' + GcseCore.gradeLabel(r.grade) + '</td><td class="p-1 text-center">' + GcseCore.gradeLabel(r.effectiveTarget) + '</td>' +
        '<td class="p-1 text-center">' + (r.notAttempted || '') + '</td><td class="p-1 text-center">' + dpCell + '</td>' +
        '<td class="p-1 text-red-700">' + gEsc(r.problems.join('; ')) + '</td></tr>';
    }).join('') + '</table></div>';
}

async function gcseSaveImport(t, imp) {
  var updates = {}, now = Date.now(), max = gcseTestTotal(t);
  imp.rows.forEach(function (r) {
    var marks = {};
    (t.questions || []).forEach(function (q) { if (r.marks[q.id] != null) marks[q.id] = r.marks[q.id]; });
    updates['gcse/results/' + gcse.testId + '/' + r.code] = {
      absent: r.absent, marks: marks, score: r.absent ? 0 : r.score, maxScore: max, notAttempted: r.notAttempted,
      grade: r.grade, dp: r.dp, dpSuggested: r.dpSuggested, className: t.className, importedAt: now
    };
    if (r.target != null) updates['gcse/targets/' + r.code] = { grade: r.target, setAt: now };
    // Student-visible copy (AP format). Grades are only added when feedback is released with grades on.
    updates['progress/' + r.code + '/assessments/' + gcse.testId] = r.absent ? null : {
      type: 'paper', title: t.title, completedAt: now, score: r.score, maxScore: max, className: t.className,
      rubric: gcseRubric(t, { marks: marks }), grade: null
    };
  });
  try {
    await state.db.ref().update(updates);
    var importOut = gEl('gcse-import-out');
    if (importOut) importOut.innerHTML = '';
    gcse.pendingImport = null;
    gcseStatus('Saved ' + imp.rows.length + ' students. Students see their results once you click Release feedback.');
    gcseRenderTest();
  } catch (e) { gcseStatus(gDbError(e), true); }
}

// ── One-step import: questions + every student's marks in one spreadsheet ──
async function gcseDownloadBlankTemplate() {
  if (!gcse.className) { gcseStatus('Choose a class first.', true); return; }
  var codes = await gcseLoadClassCodes(gcse.className);
  try { await gcseLoadTargets(); } catch (e) {}
  var n = 40, blanks = new Array(n).fill('');
  var aoa = [
    ['Question', '', '', ''].concat(blanks), ['Max marks', '', '', ''].concat(blanks),
    ['Topic', '', '', ''].concat(blanks), ['Command word', '', '', ''].concat(blanks),
    ['Name', 'Code', 'Target grade', 'DP (1-4)'].concat(blanks)
  ];
  codes.forEach(function (c) {
    var tg = gcse.targets[c] && gcse.targets[c].grade != null ? GcseCore.gradeLabel(gcse.targets[c].grade) : '';
    aoa.push([gName(c), c, tg, ''].concat(blanks));
  });
  gcseWriteTemplate(('New test - ' + gcse.className).replace(/[\\/:*?"<>|]/g, '-'), aoa, n);
  gcseStatus('Fill in rows 1–4 with the questions (Q1a, 2 marks, 1.1.1e, State …), type everyone\'s marks, then click "Import test spreadsheet".');
}

// Pure: read a whole test spreadsheet (question rows above the Name/Code row).
function gcseParseTestSheet(grid, title, className, classCodes) {
  var out = { map: null, imp: null, test: null, errors: [] };
  var hi = grid.findIndex(function (r) { return String(r[0] || '').trim().toLowerCase() === 'name' && String(r[1] || '').trim().toLowerCase() === 'code'; });
  if (hi === -1) { out.errors.push('Could not find the "Name | Code" row – use the blank test spreadsheet.'); return out; }
  var rowOf = {};
  for (var r = 0; r < hi; r++) {
    var key = String(grid[r][0] || '').trim().toLowerCase();
    if (['question', 'max marks', 'topic', 'second topic', 'command word'].indexOf(key) !== -1) rowOf[key] = r;
  }
  if (rowOf.question == null || rowOf['max marks'] == null || rowOf.topic == null) {
    out.errors.push('The spreadsheet needs "Question", "Max marks" and "Topic" rows above the Name/Code row.'); return out;
  }
  var cols = [];
  (grid[rowOf.question] || []).forEach(function (v, c) { if (c >= 4 && String(v || '').trim()) cols.push(c); });
  var cell = function (row, c) { return row == null ? '' : String((grid[row] || [])[c] == null ? '' : grid[row][c]).trim(); };
  var lines = ['Question,Max marks,Topic,Second topic,Command word'].concat(cols.map(function (c) {
    var topics = cell(rowOf.topic, c).split(/[+,;]/).map(function (x) { return x.trim(); }).filter(Boolean);
    var second = cell(rowOf['second topic'], c);
    if (second) topics.push(second);
    return [cell(rowOf.question, c), cell(rowOf['max marks'], c), topics[0] || '', topics[1] || '', cell(rowOf['command word'], c)].map(function (x) { return String(x).replace(/,/g, ' '); }).join(',');
  }));
  out.map = GcseCore.parseTestMap(lines.join('\n'), J277, null);
  out.test = {
    title: title, className: className, createdAt: Date.now(), paperTotal: out.map.total, showGrades: false,
    questions: out.map.questions.map(function (q) { return { id: gSafeKey(q.id), marks: q.marks, topics: q.topics, command: q.command || '' }; })
  };
  // Put the question ids into the Name/Code row so the student parser finds each column.
  var g2 = grid.map(function (row) { return (row || []).slice(); });
  cols.forEach(function (c, i) { if (out.test.questions[i]) g2[hi][c] = out.test.questions[i].id; });
  out.grid = g2;
  out.imp = gcseParseUpload(out.test, g2, classCodes);
  return out;
}

async function gcseHandleWholeImport(file) {
  if (!gcse.className) { gcseStatus('Choose a class first.', true); return; }
  var box = gEl('gcse-test-body');
  box.innerHTML = '<p class="text-gray-400 text-sm">Reading ' + gEsc(file.name) + '…</p>';
  var grid;
  try { grid = await gcseReadUploadRows(file); } catch (e) { box.innerHTML = '<p class="text-red-600 text-sm">' + gEsc(e.message) + '</p>'; return; }
  try { await gcseLoadTargets(); } catch (e) {}
  var codes = await gcseLoadClassCodes(gcse.className);
  var title = file.name.replace(/\.(xlsx|xls|csv)$/i, '').replace(/\s*-\s*$/, '').replace(/^New test - .*$/i, '') || 'Test ' + new Date().toLocaleDateString('en-GB');
  var parsed = gcseParseTestSheet(grid, title, gcse.className, codes);
  gcseRenderWholeImport(parsed, codes);
}

function gcseRenderWholeImport(parsed, codes) {
  var box = gEl('gcse-test-body');
  if (parsed.errors.length) { box.innerHTML = '<div class="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">' + parsed.errors.map(gEsc).join('<br>') + '</div>'; return; }
  var t = parsed.test, map = parsed.map, imp = parsed.imp;
  var mapBlocking = map.errors.length > 0;
  var blocking = mapBlocking || imp.errors.length || imp.rows.some(function (r) { return r.problems.length; });
  var h = '<div class="border border-gray-200 rounded-lg p-4 space-y-3"><h3 class="font-bold text-gray-800">Import test for ' + gEsc(t.className) + '</h3>' +
    '<div class="grid grid-cols-1 md:grid-cols-3 gap-3"><label class="text-xs text-gray-600">Title<input id="gcse-wi-title" class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" value="' + gEsc(t.title) + '"></label>' +
    '<div class="text-sm self-end"><b>' + map.questions.length + '</b> questions · <b>' + map.total + '</b> marks · <b>' + imp.rows.length + '</b> students</div></div>' +
    '<div><div class="text-xs text-gray-600 mb-1">Grade boundaries – pre-filled from ' + GcseCore.DEFAULT_BOUNDARY_SOURCE.label + ' (as percentages of ' + map.total + ' marks). Change them if you have real ones.</div>' + gcseBoundaryInputs('gcse-wi', GcseCore.defaultBoundaries(map.total)) + '</div>' +
    '<h4 class="font-semibold">1. The test paper</h4>';
  if (map.errors.length) h += '<div class="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700"><ul class="list-disc ml-5">' + map.errors.map(function (e) { return '<li>' + gEsc(e) + '</li>'; }).join('') + '</ul></div>';
  if (map.warnings.length) h += '<div class="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800"><ul class="list-disc ml-5">' + map.warnings.map(function (e) { return '<li>' + gEsc(e) + '</li>'; }).join('') + '</ul></div>';
  h += '<table class="w-full text-xs border border-gray-200"><tr class="bg-gray-50"><th class="p-1 text-left">Q</th><th class="p-1">Marks</th><th class="p-1 text-left">Topic(s)</th><th class="p-1">Command</th></tr>' +
    map.questions.map(function (q) {
      return '<tr class="border-t"><td class="p-1 font-semibold">' + gEsc(q.id) + '</td><td class="p-1 text-center">' + gEsc(q.marks) + '</td><td class="p-1">' +
        q.topics.map(function (tc) { return J277.isValid(tc) ? gEsc(J277.label(tc)) : '<span class="text-red-600">' + gEsc(tc) + ' (unknown)</span>'; }).join('<br>') + '</td><td class="p-1 text-center">' + gEsc(q.command) + '</td></tr>';
    }).join('') + '</table><h4 class="font-semibold">2. Everyone\'s marks</h4>' + (mapBlocking ? '<p class="text-xs text-gray-500">Fix the test paper rows first.</p>' : gcseImportTableHtml(t, imp)) +
    '<div class="flex gap-2"><button type="button" id="gcse-wi-save" class="jhncc-primary px-3 py-1.5 rounded text-sm font-semibold"' + (blocking ? ' disabled' : '') + '>Create test and save results</button>' +
    '<button type="button" id="gcse-wi-cancel" class="px-3 py-1.5 rounded border border-gray-300 text-sm">Cancel</button>' +
    (blocking ? '<span class="text-xs text-red-600 self-center">Fix the highlighted problems in the spreadsheet and import it again.</span>' : '') + '</div></div>';
  box.innerHTML = h;
  gEl('gcse-wi-cancel').onclick = gcseRenderTest;
  if (blocking) return;
  gEl('gcse-wi-save').onclick = async function () {
    t.title = gEl('gcse-wi-title').value.trim() || t.title;
    t.boundaries = gcseReadBoundaries('gcse-wi');
    var finalImp = gcseParseUpload(t, parsed.grid, codes);   // recompute grades/DP with the chosen boundaries
    var id = 'gcse-' + Date.now().toString(36);
    try {
      await state.db.ref('gcse/tests/' + id).set(t);
      gcse.tests[id] = t; gcse.testId = id;
      gcseFillTestSelect();
      await gcseSaveImport(t, finalImp);
      gcseStatus('Created "' + t.title + '" and saved ' + finalImp.rows.length + ' students. Students see their results once you click Release feedback.');
    } catch (e) { gcseStatus(gDbError(e), true); }
  };
}

// ── WCF + grades rendering ──────────────────────────────────────
function gcseWcfHtml(t, rows) {
  var stats = gcseTopicStats(t, rows);
  var sat = stats.sat;
  var absent = rows.filter(function (r) { return r.absent; }).length;
  var avg = sat.length ? sat.reduce(function (s, r) { return s + r.score; }, 0) / sat.length : 0;
  var graded = sat.filter(function (r) { return r.grade != null; });
  var avgGrade = graded.length ? (graded.reduce(function (s, r) { return s + r.grade; }, 0) / graded.length).toFixed(1) : '–';
  var below = sat.filter(function (r) { return r.gap != null && r.gap < 0; });
  var lowDpBelow = below.filter(function (r) { var d = gcseDp(r); return d != null && d >= 3; });
  var card = function (v, l, c) { return '<div class="rounded-lg border p-3 text-center ' + c + '"><div class="text-2xl font-bold">' + v + '</div><div class="text-xs">' + l + '</div></div>'; };
  var h = '<div class="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">' +
    card(sat.length, 'Sat the test', 'bg-blue-50 border-blue-100 text-blue-700') +
    card(absent, 'Absent', 'bg-gray-50 border-gray-200 text-gray-600') +
    card(Math.round(avg * 10) / 10 + ' / ' + gcseTestTotal(t), 'Average score', 'bg-purple-50 border-purple-100 text-purple-700') +
    card(avgGrade, 'Average grade' + (t.boundaries ? '' : ' (J277 default boundaries)'), 'bg-indigo-50 border-indigo-100 text-indigo-700') +
    card(below.length, 'Below target', 'bg-red-50 border-red-100 text-red-700') +
    card(lowDpBelow.length, 'Low DP & below target', 'bg-amber-50 border-amber-100 text-amber-800') + '</div>';

  // Reteach list
  h += '<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4"><div class="border border-gray-200 rounded-lg p-3"><h4 class="font-bold text-gray-800 mb-2">Reteach list <span class="text-xs font-normal text-gray-500">(most marks lost by the class)</span></h4>' +
    (stats.reteach.length ? '<ol class="space-y-1 text-sm">' + stats.reteach.map(function (T) {
      return '<li class="flex items-center justify-between gap-2"><span><span class="px-1.5 rounded text-xs font-bold" style="' + gRag(T.pct) + '">' + T.pct + '%</span> ' + gEsc(T.label) + ' <span class="text-xs text-gray-500">– ' + T.lost + ' marks lost</span></span>' +
        '<button type="button" class="gcse-quiz-topic text-xs px-2 py-0.5 rounded border border-purple-300 text-purple-700" data-topics="' + gEsc(T.code) + '">Quiz class</button></li>';
    }).join('') + '</ol><button type="button" class="gcse-quiz-topic mt-2 text-xs px-2 py-1 rounded border border-purple-400 text-purple-700 bg-purple-50 font-semibold" data-topics="' + gEsc(stats.reteach.map(function (T) { return T.code; }).join(',')) + '">Quiz the class on the whole reteach list</button>' : '<p class="text-sm text-gray-500">No marks lost – nothing to reteach.</p>') +
    '</div><div class="border border-gray-200 rounded-lg p-3"><h4 class="font-bold text-gray-800 mb-2">Intervention groups <span class="text-xs font-normal text-gray-500">(weakest topic under 50%)</span></h4>';
  var groups = gcseInterventionGroups(stats);
  h += groups.length ? groups.map(function (g) {
    return '<div class="mb-2 text-sm"><div class="font-semibold">' + gEsc(J277.label(g.topic)) + ' <span class="text-xs text-gray-500">(' + g.students.length + ')</span></div><div class="text-xs text-gray-600">' +
      g.students.map(function (r) { return gEsc(r.name || r.code); }).join(', ') + '</div></div>';
  }).join('') : '<p class="text-sm text-gray-500">Nobody is below 50% on any topic.</p>';
  h += '</div></div>';

  // Paper 1 vs Paper 2 (class)
  var classMarks = {}; var classQs = (t.questions || []).map(function (q) { return { id: q.id, marks: q.marks * sat.length, topics: q.topics }; });
  (t.questions || []).forEach(function (q) { classMarks[q.id] = sat.reduce(function (s, r) { return s + (Number(r.marks[q.id]) || 0); }, 0); });
  var classSplit = gcsePaperSplit(classQs, classMarks);
  var hasSplit = classSplit.both;
  if (hasSplit) {
    var cp = classSplit.papers;
    var perStudentGrade = function (k) {
      var gs = sat.map(function (r) { return r.split && r.split.papers[k] && r.split.papers[k].grade; }).filter(function (g) { return g != null; });
      return gs.length ? (gs.reduce(function (a, b) { return a + b; }, 0) / gs.length).toFixed(1) : '–';
    };
    h += '<div class="border border-gray-200 rounded-lg p-3 mb-4"><h4 class="font-bold text-gray-800 mb-2">Paper 1 vs Paper 2</h4><div class="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">' +
      ['1', '2'].map(function (k) {
        return '<div class="rounded border p-2' + (classSplit.focus === k ? ' border-red-300 bg-red-50' : ' border-gray-200') + '"><div class="font-semibold">Paper ' + k + (k === '1' ? ' – Computer systems' : ' – Algorithms & programming') + '</div>' +
          '<div>Class average <b>' + cp[k].pct + '%</b> · average grade <b>' + perStudentGrade(k) + '</b></div><div class="text-xs text-gray-500">' + (cp[k].p / Math.max(sat.length, 1)) + ' marks of this paper in the test</div></div>';
      }).join('') +
      '<div class="rounded border border-gray-200 p-2 text-sm">' + (classSplit.focus ? 'Focus reteaching on <b>Paper ' + classSplit.focus + '</b>.' : 'Both papers are level.') +
      '<div class="text-xs text-gray-500 mt-1">Paper grades use the OCR J277 June 2024 paper boundaries, scaled to the marks in this test.</div></div></div></div>';
  }

  // Grades table
  h += '<div class="border border-gray-200 rounded-lg p-3 mb-4"><div class="flex flex-wrap items-center justify-between gap-2 mb-2"><h4 class="font-bold text-gray-800">Grades and Definite Purpose</h4>' +
    '<select id="gcse-grade-filter" class="border border-gray-300 rounded px-2 py-1 text-xs"><option value="all">Everyone</option><option value="below">Below target</option><option value="lowdp">Low DP (3–4) & below target</option></select></div>' +
    gcseGradeDistributionHtml(sat) +
    '<div class="overflow-x-auto"><table class="w-full text-xs border border-gray-200" id="gcse-grade-table"><tr class="bg-gray-50"><th class="p-1 text-left">Student</th><th class="p-1">Score</th><th class="p-1">%</th><th class="p-1">Working</th>' + (hasSplit ? '<th class="p-1">Paper 1</th><th class="p-1">Paper 2</th>' : '') + '<th class="p-1">Target</th><th class="p-1">Gap</th><th class="p-1">Not attempted</th><th class="p-1">DP (1 best – 4 worst)</th></tr>' +
    rows.filter(function (r) { return !r.missing; }).map(function (r) {
      var gap = r.gap == null ? '' : (r.gap >= 0 ? '<span class="text-green-700 font-bold">▲ ' + (r.gap > 0 ? '+' + r.gap : '0') + '</span>' : '<span class="text-red-700 font-bold">▼ ' + r.gap + '</span>');
      var dpSel = '<select class="gcse-dp border border-gray-300 rounded px-1 text-xs" data-code="' + gEsc(r.code) + '"><option value="">' + (r.dpSuggested != null ? 'Suggested: ' + r.dpSuggested : '–') + '</option>' +
        [1, 2, 3, 4].map(function (n) { return '<option value="' + n + '"' + (r.dp === n ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select>';
      return '<tr class="border-t gcse-grade-row" data-gap="' + (r.gap == null ? '' : r.gap) + '" data-dp="' + (gcseDp(r) == null ? '' : gcseDp(r)) + '">' +
        '<td class="p-1"><button type="button" class="gcse-profile-link hover:underline font-medium text-left" data-code="' + gEsc(r.code) + '">' + gEsc(r.name || r.code) + '</button></td>' +
        '<td class="p-1 text-center">' + (r.absent ? 'ABS' : r.score + ' / ' + r.max) + '</td><td class="p-1 text-center">' + (r.pct == null ? '' : r.pct + '%') + '</td>' +
        '<td class="p-1 text-center font-bold">' + GcseCore.gradeLabel(r.grade) + '</td>' +
        (hasSplit ? ['1', '2'].map(function (k) {
          var P = r.split && r.split.papers[k];
          var weak = r.split && r.split.focus === k;
          return '<td class="p-1 text-center whitespace-nowrap' + (weak ? ' text-red-700' : '') + '">' + (P ? gcsePaperCell(P) : '') + '</td>';
        }).join('') : '') +
        '<td class="p-1 text-center"><select class="gcse-target border border-gray-300 rounded px-1 text-xs" data-code="' + gEsc(r.code) + '">' + gGradeOptions(r.target, true) + '</select></td>' +
        '<td class="p-1 text-center">' + gap + '</td><td class="p-1 text-center">' + (r.absent ? '' : (r.notAttempted || '')) + '</td><td class="p-1 text-center">' + (r.absent ? '' : dpSel) + '</td></tr>';
    }).join('') + '</table></div></div>';

  // Topic heatmap
  h += '<div class="border border-gray-200 rounded-lg p-3 mb-4"><h4 class="font-bold text-gray-800 mb-2">Topic heatmap</h4><div class="overflow-x-auto"><table class="text-xs border-collapse"><tr><th class="p-1 text-left sticky left-0 bg-white">Student</th>' +
    stats.topics.map(function (T) { return '<th class="p-1 font-mono" title="' + gEsc(T.label) + '">' + gEsc(T.code) + '</th>'; }).join('') + '</tr>' +
    '<tr class="font-bold"><td class="p-1 sticky left-0 bg-white">Class</td>' + stats.topics.map(function (T) { return '<td class="p-1 text-center" style="' + gRag(T.pct) + '">' + T.pct + '%</td>'; }).join('') + '</tr>' +
    sat.map(function (r) {
      return '<tr><td class="p-1 whitespace-nowrap sticky left-0 bg-white">' + gEsc(r.name || r.code) + '</td>' + stats.topics.map(function (T) {
        var p = T.per[r.code]; var pct = p ? gPct(p.a, p.p) : null;
        return '<td class="p-1 text-center" style="' + gRag(pct) + '" title="' + gEsc(T.label) + '">' + (pct == null ? '' : pct) + '</td>';
      }).join('') + '</tr>';
    }).join('') + '</table></div><p class="text-xs text-gray-500 mt-1">Hover a code to see the topic name. Green ≥ 70%, amber 40–69%, red &lt; 40%.</p></div>';

  // Questions + command words
  h += '<div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4"><div class="lg:col-span-2 border border-gray-200 rounded-lg p-3"><h4 class="font-bold text-gray-800 mb-2">Per question</h4><div class="overflow-x-auto"><table class="w-full text-xs border border-gray-200"><tr class="bg-gray-50"><th class="p-1">Q</th><th class="p-1 text-left">Topic</th><th class="p-1">Avg</th><th class="p-1">%</th><th class="p-1">Not attempted</th><th class="p-1 text-left">Common mistake (your note)</th></tr>' +
    stats.questions.map(function (q) {
      return '<tr class="border-t"><td class="p-1 font-semibold">' + gEsc(q.id) + '</td><td class="p-1">' + q.topics.map(function (tc) { return gEsc(J277.label(tc)); }).join('<br>') + '</td>' +
        '<td class="p-1 text-center">' + (Math.round(q.avg * 10) / 10) + ' / ' + q.marks + '</td><td class="p-1 text-center" style="' + gRag(q.pct) + '">' + q.pct + '%</td>' +
        '<td class="p-1 text-center' + (q.notAttempted >= Math.max(2, stats.sat.length * 0.2) ? ' text-red-700 font-bold' : '') + '">' + (q.notAttempted || '') + '</td>' +
        '<td class="p-1"><input class="gcse-note w-full border border-gray-200 rounded px-1 py-0.5" data-q="' + gEsc(q.id) + '" value="' + gEsc((t.notes || {})[q.id] || '') + '" placeholder="e.g. mixed up MAR and MDR"></td></tr>';
    }).join('') + '</table></div></div><div class="border border-gray-200 rounded-lg p-3"><h4 class="font-bold text-gray-800 mb-2">Exam technique (command words)</h4>' +
    (stats.commands.length ? '<table class="w-full text-xs">' + stats.commands.map(function (C) {
      return '<tr><td class="p-1">' + gEsc(C.word) + '</td><td class="p-1 text-right"><span class="px-1.5 rounded font-bold" style="' + gRag(C.pct) + '">' + C.pct + '%</span></td></tr>';
    }).join('') + '</table>' : '<p class="text-xs text-gray-500">Add command words to the test map to see this.</p>') + '</div></div>';
  return h;
}
function gcseGradeDistributionHtml(sat) {
  var counts = {}; var max = 1;
  sat.forEach(function (r) { if (r.grade == null) return; counts[r.grade] = (counts[r.grade] || 0) + 1; max = Math.max(max, counts[r.grade]); });
  if (!Object.keys(counts).length) return '<p class="text-xs text-gray-500 mb-2">Add grade boundaries (Boundaries / settings) to see working grades.</p>';
  var h = '<div class="flex items-end gap-1 h-20 mb-2">';
  for (var g = 0; g <= 9; g++) {
    var c = counts[g] || 0;
    h += '<div class="flex flex-col items-center justify-end flex-1"><div class="text-[10px] text-gray-600">' + (c || '') + '</div><div style="height:' + Math.round(c / max * 52) + 'px;background:rgb(176,28,35);width:100%;border-radius:3px 3px 0 0"></div><div class="text-[10px] font-bold">' + GcseCore.gradeLabel(g) + '</div></div>';
  }
  return h + '</div>';
}

function gcseBindWcf(t, rows) {
  gEl('gcse-grade-filter').onchange = function () {
    var f = this.value;
    document.querySelectorAll('.gcse-grade-row').forEach(function (tr) {
      var gap = tr.dataset.gap === '' ? null : Number(tr.dataset.gap), dp = tr.dataset.dp === '' ? null : Number(tr.dataset.dp);
      var show = f === 'all' || (f === 'below' && gap != null && gap < 0) || (f === 'lowdp' && gap != null && gap < 0 && dp != null && dp >= 3);
      tr.classList.toggle('hidden', !show);
    });
  };
  document.querySelectorAll('.gcse-target').forEach(function (sel) {
    sel.onchange = async function () {
      var g = GcseCore.parseGrade(sel.value);
      try {
        await state.db.ref('gcse/targets/' + sel.dataset.code).set(g == null ? null : { grade: g, setAt: Date.now() });
        gcseStatus('Target saved.'); gcseRenderTest();
      } catch (e) { gcseStatus(gDbError(e), true); }
    };
  });
  document.querySelectorAll('.gcse-dp').forEach(function (sel) {
    sel.onchange = async function () {
      try {
        await state.db.ref('gcse/results/' + gcse.testId + '/' + sel.dataset.code + '/dp').set(sel.value ? Number(sel.value) : null);
        gcseStatus('DP saved.'); gcseRenderTest();
      } catch (e) { gcseStatus(gDbError(e), true); }
    };
  });
  document.querySelectorAll('.gcse-note').forEach(function (inp) {
    inp.onchange = async function () {
      try { await state.db.ref('gcse/tests/' + gcse.testId + '/notes/' + inp.dataset.q).set(inp.value.trim() || null); t.notes = t.notes || {}; t.notes[inp.dataset.q] = inp.value.trim(); gcseStatus('Note saved.'); }
      catch (e) { gcseStatus(gDbError(e), true); }
    };
  });
  document.querySelectorAll('#gcse-test-body .gcse-quiz-topic').forEach(function (b) {
    b.onclick = function () { gcseOpenTopicQuiz(gcse.className, b.dataset.topics.split(',')); };
  });
  gEl('gcse-print-wcf').onclick = function () { gcsePrintWcf(t, rows); };
  gEl('gcse-print-slips').onclick = function () { gcsePrintSlips(t, rows); };
  gEl('gcse-export').onclick = function () { gcseExport(t, rows); };
  gEl('gcse-show-grades').onchange = async function () {
    try { await state.db.ref('gcse/tests/' + gcse.testId + '/showGrades').set(this.checked); t.showGrades = this.checked; gcseStatus('Saved. Click Release feedback to update what students see.'); }
    catch (e) { gcseStatus(gDbError(e), true); }
  };
  gEl('gcse-release').onclick = function () { gcseRelease(t, rows); };
}

function gcseStudentTopicSummary(t, marks) {
  var per = {};
  (t.questions || []).forEach(function (q) {
    var v = marks ? marks[q.id] : null;
    (q.topics || []).forEach(function (tc) {
      var p = per[tc] || (per[tc] = { code: tc, a: 0, p: 0 });
      p.a += v == null ? 0 : Number(v); p.p += q.marks;
    });
  });
  var list = Object.keys(per).map(function (k) { var p = per[k]; p.pct = gPct(p.a, p.p); return p; });
  return {
    list: list.sort(function (a, b) { return a.code.localeCompare(b.code, undefined, { numeric: true }); }),
    www: list.filter(function (p) { return p.pct >= 70; }).sort(function (a, b) { return b.pct - a.pct; }).slice(0, 3),
    ebi: list.filter(function (p) { return p.pct < 70; }).sort(function (a, b) { return a.pct - b.pct; }).slice(0, 3)
  };
}

function gcsePrintWcf(t, rows) {
  var stats = gcseTopicStats(t, rows);
  var notes = Object.keys(t.notes || {}).filter(function (k) { return t.notes[k]; });
  var html = '<h1>Whole-class feedback: ' + gEsc(t.title) + '</h1><div class="muted">' + gEsc(t.className) + ' · ' + stats.sat.length + ' students</div>' +
    '<h2>What went well</h2><ul>' + stats.best.map(function (T) { return '<li>' + gEsc(T.label) + ' (' + T.pct + '%)</li>'; }).join('') + '</ul>' +
    '<h2>Topics to reteach</h2><ol>' + stats.reteach.map(function (T) { return '<li>' + gEsc(T.label) + ' – class ' + T.pct + '%</li>'; }).join('') + '</ol>' +
    (notes.length ? '<h2>Common mistakes</h2><ul>' + notes.map(function (k) { return '<li><b>' + gEsc(k) + ':</b> ' + gEsc(t.notes[k]) + '</li>'; }).join('') + '</ul>' : '') +
    (stats.commands.length ? '<h2>Exam technique</h2><ul>' + stats.commands.map(function (C) { return '<li>' + gEsc(C.word) + ' questions: ' + C.pct + '%</li>'; }).join('') + '</ul>' : '') +
    '<h2>DIRT task</h2><p>Re-answer every question you dropped marks on from: <b>' + stats.reteach.slice(0, 3).map(function (T) { return gEsc(T.label); }).join(', ') +
    '</b>. Then use “Fix my mistakes” on the website.</p><div class="lines"></div><div class="lines"></div><div class="lines"></div><div class="lines"></div>';
  gPrint('WCF – ' + t.title, html);
}
function gcsePrintSlips(t, rows) {
  var html = rows.filter(function (r) { return !r.missing && !r.absent; }).map(function (r) {
    var s = gcseStudentTopicSummary(t, r.marks);
    return '<div class="slip"><h1>' + gEsc(r.name || r.code) + '</h1><div class="muted">' + gEsc(t.title) + ' · ' + gEsc(t.className) + '</div>' +
      '<p><b>Score:</b> ' + r.score + ' / ' + r.max + (r.grade != null ? ' · <b>Working grade:</b> ' + GcseCore.gradeLabel(r.grade) : '') + (r.target != null ? ' · <b>Target:</b> ' + GcseCore.gradeLabel(r.target) : '') + '</p>' +
      (r.split && r.split.both ? '<p><b>Paper 1:</b> ' + gcsePaperCell(r.split.papers['1']) + ' · <b>Paper 2:</b> ' + gcsePaperCell(r.split.papers['2']) +
        (r.split.focus ? ' – <b>focus on Paper ' + r.split.focus + '</b>' : '') + '</p>' : '') +
      '<h2>What went well</h2><ul>' + (s.www.length ? s.www.map(function (p) { return '<li>' + gEsc(J277.label(p.code)) + ' (' + p.pct + '%)</li>'; }).join('') : '<li>Keep going – every topic has room to improve.</li>') + '</ul>' +
      '<h2>Even better if – fix these</h2><ul>' + (s.ebi.length ? s.ebi.map(function (p) { return '<li>' + gEsc(J277.label(p.code)) + ' (' + p.pct + '%)</li>'; }).join('') : '<li>No weak topics – try harder past-paper questions.</li>') + '</ul></div>';
  }).join('');
  gPrint('Feedback slips – ' + t.title, html || '<p>No results.</p>');
}
function gcseExport(t, rows) {
  var data = [['Name', 'Code', 'Score', 'Max', '%', 'Working grade', 'Paper 1 %', 'Paper 1 grade', 'Paper 2 %', 'Paper 2 grade', 'Target grade', 'Gap', 'DP', 'Absent']];
  rows.filter(function (r) { return !r.missing; }).forEach(function (r) {
    var p1 = r.split && r.split.papers['1'], p2 = r.split && r.split.papers['2'];
    data.push([r.name, r.code, r.absent ? '' : r.score, r.max, r.pct == null ? '' : r.pct, r.absent ? '' : GcseCore.gradeLabel(r.grade),
      p1 ? p1.pct : '', p1 ? GcseCore.gradeLabel(p1.grade) : '', p2 ? p2.pct : '', p2 ? GcseCore.gradeLabel(p2.grade) : '',
      r.target == null ? '' : GcseCore.gradeLabel(r.target), r.gap == null ? '' : r.gap, gcseDp(r) == null ? '' : gcseDp(r), r.absent ? 'ABS' : '']);
  });
  gDownload((t.title + ' - ' + t.className + ' grades.csv').replace(/[\\/:*?"<>|]/g, '-'), gCsv(data), 'text/csv');
}

async function gcseRelease(t, rows) {
  var stats = gcseTopicStats(t, rows);
  var testTopics = {};
  (t.questions || []).forEach(function (q) { (q.topics || []).forEach(function (tc) { testTopics[tc] = true; }); });
  var practice = gcsePracticePoolFor(Object.keys(testTopics));
  var feedback = {
    released: true, releasedAt: Date.now(), type: 'paper', title: t.title, className: t.className, assessmentId: gcse.testId,
    studentCount: stats.sat.length, showGrades: !!t.showGrades,
    topicStats: stats.topics.map(function (T) { return { code: T.code, label: T.label, pct: T.pct }; }),
    reteach: stats.reteach.map(function (T) { return { code: T.code, label: T.label, pct: T.pct }; }),
    best: stats.best.map(function (T) { return { code: T.code, label: T.label, pct: T.pct }; }),
    struggle: stats.reteach.slice(0, 3).map(function (T) { return { id: T.code, text: T.label, percent: T.pct }; }),
    commands: stats.commands.map(function (C) { return { word: C.word, pct: C.pct }; }),
    notes: t.notes || null,
    practice: practice
  };
  var updates = {};
  updates['classes/' + t.className + '/apFeedback/' + gcse.testId] = feedback;
  rows.forEach(function (r) {
    if (r.missing || r.absent) return;
    updates['progress/' + r.code + '/assessments/' + gcse.testId + '/grade'] = t.showGrades && r.grade != null ? r.grade : null;
  });
  try {
    await state.db.ref().update(updates);
    gcseStatus('Feedback released to ' + t.className + (t.showGrades ? ' (with grades)' : ' (grades hidden)') + '. ' +
      (practice.length ? practice.length + ' practice questions attached for "Fix my mistakes".' : 'Load the question bank before releasing to attach "Fix my mistakes" practice.'));
  } catch (e) { gcseStatus(gDbError(e), true); }
}

// ── Student view of a paper test (inside "AP Feedback") ─────────
function gcseRenderStudentPaperFeedback(body, feedback, rec) {
  var t = { questions: (rec.rubric || []).map(function (c) { return { id: c.id, marks: c.marks, topics: c.topics || [] }; }) };
  var marks = {};
  (rec.rubric || []).forEach(function (c) { marks[c.id] = c.attempted === false ? null : c.awarded; });
  var s = gcseStudentTopicSummary(t, marks);
  var h = '<div class="border border-gray-200 rounded-lg p-4 space-y-4">' +
    '<div><h3 class="text-lg font-bold">' + gEsc(rec.title || feedback.title || 'Test') + '</h3><p class="text-sm text-gray-600">Score: <b>' + rec.score + ' / ' + rec.maxScore + '</b>' +
    (feedback.showGrades && rec.grade != null ? ' · Working grade: <b>' + GcseCore.gradeLabel(rec.grade) + '</b>' : '') + '</p></div>' +
    gcseStudentSplitHtml(t.questions, marks, !!feedback.showGrades) +
    '<div class="grid grid-cols-1 md:grid-cols-2 gap-3"><div class="rounded border border-green-200 bg-green-50 p-3"><div class="font-semibold text-green-800 mb-1">What went well</div><ul class="text-sm list-disc ml-5">' +
    (s.www.length ? s.www.map(function (p) { return '<li>' + gEsc(J277.label(p.code)) + ' (' + p.pct + '%)</li>'; }).join('') : '<li>Keep going – every topic has room to improve.</li>') + '</ul></div>' +
    '<div class="rounded border border-amber-200 bg-amber-50 p-3"><div class="font-semibold text-amber-800 mb-1">Even better if – fix these</div><ul class="text-sm list-disc ml-5">' +
    (s.ebi.length ? s.ebi.map(function (p) { return '<li>' + gEsc(J277.label(p.code)) + ' (' + p.pct + '%)</li>'; }).join('') : '<li>No weak topics – brilliant!</li>') + '</ul></div></div>' +
    '<div><div class="font-semibold mb-1">Your topics</div><div class="flex flex-wrap gap-1">' + s.list.map(function (p) {
      return '<span class="text-xs px-2 py-1 rounded" style="' + gRag(p.pct) + '" title="' + gEsc(J277.label(p.code)) + '">' + gEsc(p.code) + ' ' + p.pct + '%</span>';
    }).join('') + '</div></div>' +
    (feedback.reteach && feedback.reteach.length ? '<div class="text-sm text-gray-600"><b>Whole class:</b> we will revisit ' + feedback.reteach.slice(0, 3).map(function (T) { return gEsc(T.label); }).join(', ') + '.</div>' : '') +
    '<div id="gcse-fix-box"></div></div>';
  body.innerHTML = h;
  var weak = s.list.filter(function (p) { return p.pct < 100; }).map(function (p) { return p.code; });
  var pool = (feedback.practice || []).filter(function (q) { return (q.topics || []).some(function (tc) { return weak.indexOf(tc) !== -1; }); });
  var box = gEl('gcse-fix-box');
  if (pool.length) {
    box.innerHTML = '<button type="button" id="gcse-fix-btn" class="jhncc-primary px-4 py-2 rounded font-semibold text-sm">Fix my mistakes (' + Math.min(pool.length, 8) + ' questions)</button>';
    gEl('gcse-fix-btn').onclick = function () { gcseStartPractice(pool, rec.title || feedback.title); };
  } else if (weak.length) {
    box.innerHTML = '<p class="text-xs text-gray-500">Practice questions for your topics will appear here when your teacher adds them.</p>';
  }
}

function gcseStudentSplitHtml(questions, marks, showGrades) {
  var sp = gcsePaperSplit(questions, marks);
  var keys = Object.keys(sp.papers).sort();
  if (!keys.length) return '';
  var names = { '1': 'Paper 1 – Computer systems', '2': 'Paper 2 – Algorithms & programming' };
  return '<div class="grid grid-cols-1 md:grid-cols-' + (keys.length > 1 ? '2' : '1') + ' gap-3">' + keys.map(function (k) {
    var P = sp.papers[k];
    var weak = sp.focus === k;
    return '<div class="rounded border p-3 ' + (weak ? 'border-red-300 bg-red-50' : 'border-gray-200') + '"><div class="font-semibold">' + names[k] + (weak ? ' <span class="text-xs text-red-700">← focus here</span>' : '') + '</div>' +
      '<div class="text-sm">' + P.a + ' / ' + P.p + ' marks (' + P.pct + '%)' + (showGrades && P.grade != null ? ' · grade <b>' + GcseCore.gradeLabel(P.grade) + '</b>' : '') + '</div>' +
      '<div class="h-2 bg-gray-200 rounded mt-1"><div class="h-2 rounded" style="width:' + P.pct + '%;background:' + (P.pct >= 70 ? '#16a34a' : P.pct >= 40 ? '#d97706' : '#dc2626') + '"></div></div></div>';
  }).join('') + '</div>';
}

// ── Practice ("Fix my mistakes") – self-paced, client-side ─────
function gcseStartPractice(pool, title) {
  var qs = pool.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 8);
  var modal = gEl('modal-gcse-practice');
  var idx = 0, score = 0, max = 0;
  modal.classList.remove('hidden');
  gEl('gcse-practice-title').textContent = 'Fix my mistakes – ' + (title || '');
  gEl('gcse-practice-close').onclick = function () { modal.classList.add('hidden'); };
  function render() {
    var box = gEl('gcse-practice-body');
    if (idx >= qs.length) {
      box.innerHTML = '<div class="text-center py-6"><div class="text-3xl font-bold mb-2">' + score + ' / ' + max + '</div><p class="text-gray-600">Practice finished. Your topic scores have been updated.</p></div>';
      return;
    }
    var q = qs[idx];
    var h = '<div class="text-xs text-gray-500 mb-1">Question ' + (idx + 1) + ' of ' + qs.length + ' · ' + q.topics.map(function (tc) { return gEsc(J277.label(tc)); }).join(', ') + ' · ' + q.marks + ' mark' + (q.marks === 1 ? '' : 's') + '</div>' +
      '<div class="font-semibold text-gray-800 mb-3 whitespace-pre-wrap">' + gEsc(q.q) + '</div>';
    if (q.type === 'mcq') {
      h += '<div class="grid gap-2">' + q.options.map(function (o, i) { return '<button type="button" class="gcse-mcq text-left px-3 py-2 rounded border border-gray-300 hover:bg-gray-50" data-i="' + i + '">' + String.fromCharCode(65 + i) + '. ' + gEsc(o) + '</button>'; }).join('') + '</div>';
    } else {
      h += '<textarea id="gcse-practice-answer" rows="' + (q.type === 'long' ? 7 : 3) + '" class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="Type your answer"></textarea>' +
        '<button type="button" id="gcse-practice-submit" class="jhncc-primary mt-2 px-4 py-1.5 rounded text-sm font-semibold">Check answer</button>';
    }
    h += '<div id="gcse-practice-result" class="mt-3"></div>';
    box.innerHTML = h;
    var next = function () { idx++; render(); };
    var nextBtn = '<button type="button" id="gcse-practice-next" class="mt-3 px-4 py-1.5 rounded border border-gray-300 text-sm font-semibold">Next</button>';
    if (q.type === 'mcq') {
      box.querySelectorAll('.gcse-mcq').forEach(function (b) {
        b.onclick = function () {
          box.querySelectorAll('.gcse-mcq').forEach(function (x) { x.disabled = true; });
          var right = Number(b.dataset.i) === q.answerIndex;
          max += q.marks; if (right) score += q.marks;
          gcseRecordQuizAttempt({ gcseQid: q.id, gcseTopics: q.topics, q: q.q }, q.options[Number(b.dataset.i)], { marks: right ? q.marks : 0, max: q.marks, needsCheck: false }, 'practice');
          gEl('gcse-practice-result').innerHTML = '<div class="rounded p-2 ' + (right ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800') + '">' + (right ? 'Correct!' : 'Not quite. The answer is ' + String.fromCharCode(65 + q.answerIndex) + '. ' + gEsc(q.options[q.answerIndex])) + '</div>' + nextBtn;
          gEl('gcse-practice-next').onclick = next;
        };
      });
      return;
    }
    gEl('gcse-practice-submit').onclick = function () {
      var answer = gEl('gcse-practice-answer').value.trim();
      if (!answer) return;
      gEl('gcse-practice-submit').disabled = true;
      gEl('gcse-practice-answer').disabled = true;
      var res = gEl('gcse-practice-result');
      var scheme = '<div class="mt-2 rounded border border-gray-200 bg-gray-50 p-2 text-sm"><b>Mark scheme:</b><div class="whitespace-pre-wrap">' + gEsc(q.markScheme) + '</div></div>';
      if (q.type === 'short') {
        var m = GcseCore.mark(q.rules, answer, q.marks);
        max += q.marks; score += m.marks;
        gcseRecordQuizAttempt({ gcseQid: q.id, gcseTopics: q.topics, q: q.q }, answer, m, 'practice');
        res.innerHTML = '<div class="rounded p-2 ' + (m.marks >= m.max ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900') + '"><b>' + m.marks + ' / ' + m.max + '</b>' +
          (m.needsCheck ? ' – your teacher will check this one.' : '') + '<ul class="text-xs list-disc ml-5 mt-1">' +
          m.points.map(function (p) { return '<li>' + (p.awarded ? '✓ ' : '✗ ') + gEsc(p.reason) + '</li>'; }).join('') + '</ul></div>' + scheme +
          (!m.needsCheck && m.marks < m.max ? '<button type="button" id="gcse-appeal" class="mt-2 text-xs px-2 py-1 rounded border border-blue-300 text-blue-700">I think I\'m right – ask my teacher</button>' : '') + nextBtn;
        var ap = gEl('gcse-appeal');
        if (ap) ap.onclick = function () {
          gcseAddReview({ gcseQid: q.id, gcseTopics: q.topics, q: q.q }, answer, m, 'appeal');
          ap.disabled = true; ap.textContent = 'Sent to your teacher';
        };
      } else {
        // Long answer: tick the mark-scheme points you made.
        var points = String(q.markScheme || '').split(/\n|;/).map(function (s) { return s.trim(); }).filter(Boolean);
        res.innerHTML = '<div class="rounded border border-gray-200 p-2 text-sm"><b>Tick each mark-scheme point you made:</b>' +
          points.map(function (p, i) { return '<label class="flex gap-2 items-start mt-1"><input type="checkbox" class="gcse-self" data-i="' + i + '"> <span>' + gEsc(p) + '</span></label>'; }).join('') +
          '<button type="button" id="gcse-self-done" class="mt-2 px-3 py-1 rounded border border-gray-300 text-sm font-semibold">Done</button></div>';
        gEl('gcse-self-done').onclick = function () {
          var ticked = document.querySelectorAll('.gcse-self:checked').length;
          var got = Math.min(ticked, q.marks);
          max += q.marks; score += got;
          gcseRecordQuizAttempt({ gcseQid: q.id, gcseTopics: q.topics, q: q.q }, answer, { marks: got, max: q.marks, needsCheck: got === q.marks && points.length > q.marks }, 'self');
          res.innerHTML += '<div class="mt-2 text-sm">You gave yourself <b>' + got + ' / ' + q.marks + '</b>.</div>' + nextBtn;
          gEl('gcse-practice-next').onclick = next;
        };
        return;
      }
      gEl('gcse-practice-next').onclick = next;
    };
  }
  render();
}

// Student side: practice stats per topic + teacher-check entries.
function gcseRecordQuizAttempt(q, answer, result, source) {
  if (!state || !state.db || !state.uid || gIsStaff()) return;
  var topics = q.gcseTopics || [];
  var full = result.marks >= result.max;
  topics.forEach(function (tc) {
    state.db.ref('progress/' + state.uid + '/gcseQuiz/' + gTopicKey(tc)).transaction(function (cur) {
      cur = cur || { attempted: 0, correct: 0 };
      cur.attempted = (cur.attempted || 0) + 1;
      if (full) cur.correct = (cur.correct || 0) + 1;
      cur.lastAt = Date.now();
      return cur;
    }, null, false);
  });
  if (result.needsCheck) gcseAddReview(q, answer, result, source);
}
function gcseAddReview(q, answer, result, source) {
  if (!state || !state.db || !state.uid) return;
  state.db.ref('progress/' + state.uid + '/gcseReview').push({
    qid: q.gcseQid || '', question: q.q || '', answer: String(answer || '').slice(0, 2000), auto: result.marks, max: result.max,
    reason: (result.reasons || []).join('; ') || (source === 'appeal' ? 'Student thinks they are right' : ''),
    topics: q.gcseTopics || [], source: source, status: 'pending', at: Date.now(), className: state.className || ''
  }).catch(function () {});
}

// ── Question bank (Google Sheet in the Course Website folder) ───
function gcseLoadBankCache() {
  if (gcse.bank) return gcse.bank;
  try {
    var raw = localStorage.getItem('gcse_bank_cache');
    if (raw) { var c = JSON.parse(raw); gcse.bank = c; }
  } catch (e) {}
  return gcse.bank;
}
function gcseStarterRows() {
  return (typeof GCSE_STARTER_BANK !== 'undefined' ? GCSE_STARTER_BANK : []).map(function (r) {
    return Object.assign({}, r, { topics: r.topics.slice(), options: r.options.slice() });
  });
}
// Every bank question (your Drive sheet first; starter questions with the same ID are replaced).
function gcseAllValidated() {
  var b = gcseLoadBankCache();
  var key = (b && b.loadedAt) || 0;
  if (gcse._validated && gcse._validatedKey === key) return gcse._validated;
  var driveRows = (b && b.rows) || [];
  var ids = {};
  driveRows.forEach(function (r) { if (r.id) ids[r.id.toLowerCase()] = true; });
  var rows = driveRows.map(function (r) { return Object.assign({}, r, { topics: (r.topics || []).slice(), options: (r.options || []).slice() }); })
    .concat(gcseStarterRows().filter(function (r) { return !ids[r.id.toLowerCase()]; }));
  gcse._validated = GcseCore.validateBank(rows, J277);
  gcse._validatedKey = key;
  return gcse._validated;
}
function gcseBankUsable() {
  return gcseAllValidated().filter(function (v) { return v.live; });
}
async function gcseFindBankSheet(create) {
  var pinned = state.config && state.config.questionBankSpreadsheetId;
  if (pinned) return { id: pinned };
  var folderId = state.config && state.config.driveFolderId;
  var q = "mimeType='application/vnd.google-apps.spreadsheet' and name='" + GCSE_BANK_NAME + "' and trashed=false" + (folderId ? " and '" + folderId + "' in parents" : '');
  var files = await classroomFetchDriveFiles(q, 'files(id,name)', 5);
  if (files[0]) return files[0];
  if (!create) return null;
  var file = await classroomRequest('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id,name', {
    method: 'POST', body: JSON.stringify({ name: GCSE_BANK_NAME, mimeType: 'application/vnd.google-apps.spreadsheet', parents: folderId ? [folderId] : undefined })
  });
  await classroomEnsureSheets(file.id, ['Questions', 'How to fill']);
  await classroomWriteValues(file.id, "'Questions'!A1", [GcseCore.BANK_HEADERS]);
  await classroomWriteValues(file.id, "'How to fill'!A1", gcseTopicCodesGuide('bank').split('\n').map(function (l) { return [l]; }));
  return file;
}
async function gcseLoadBankFromDrive() {
  await getClassroomToken();
  var file = await gcseFindBankSheet(false);
  if (!file) throw new Error('No "' + GCSE_BANK_NAME + '" sheet in the Course Website folder yet – click "Create bank sheet".');
  var meta = await classroomSpreadsheetMetadata(file.id);
  var titles = (meta.sheets || []).map(function (s) { return s.properties.title; });
  var tab = titles.indexOf('Questions') !== -1 ? 'Questions' : titles[0];
  var values = await classroomReadValues(file.id, classroomQuoteSheet(tab) + '!A1:N3000');
  var header = (values[0] || []).map(function (h) { return String(h || '').trim().toLowerCase(); });
  var idx = {}; header.forEach(function (h, i) { idx[h] = i; });
  var rows = values.slice(1).filter(function (r) { return r.some(function (c) { return String(c || '').trim(); }); })
    .map(function (r) { return GcseCore.bankRowFromCells(r, idx); });
  gcse.bank = { rows: rows, loadedAt: Date.now(), spreadsheetId: file.id };
  try { localStorage.setItem('gcse_bank_cache', JSON.stringify({ rows: rows, loadedAt: gcse.bank.loadedAt, spreadsheetId: file.id })); } catch (e) {}
  return gcse.bank;
}
function gcsePracticeItem(v) {
  var r = v.row;
  return { id: r.id, type: r.type, q: r.question, options: r.options, answerIndex: r.answerIndex, marks: r.marks, rules: r.rules || '', markScheme: r.markScheme || '', topics: r.topics };
}
// Quiz-usable bank questions for these topics (a spec point includes its sub-topics).
function gcseQuestionsForTopics(topicCodes, types) {
  var wanted = {};
  topicCodes.forEach(function (c) { J277.expand(c).concat([J277.normaliseCode(c)]).forEach(function (s) { wanted[s] = true; }); });
  return gcseBankUsable().filter(function (v) {
    return v.quizUsable && (!types || types.indexOf(v.row.type) !== -1) && v.row.topics.some(function (tc) { return wanted[tc] || J277.expand(tc).some(function (s) { return wanted[s]; }); });
  });
}
function gcsePracticePoolFor(topicCodes) {
  var byTopic = {};
  gcseQuestionsForTopics(topicCodes, ['mcq', 'short', 'long']).forEach(function (v) {
    var k = v.row.topics[0];
    (byTopic[k] = byTopic[k] || []).push(gcsePracticeItem(v));
  });
  var out = [];
  Object.keys(byTopic).forEach(function (k) { out = out.concat(byTopic[k].slice(0, 6)); });
  return out;
}

async function gcseRenderBankView() {
  var body = gEl('gcse-body');
  var b = gcseLoadBankCache();
  var h = '<div class="flex flex-wrap gap-2 mb-3">' +
    '<button type="button" id="gcse-bank-load" class="jhncc-primary px-3 py-1.5 rounded text-sm font-semibold">Load / refresh bank from Google Drive</button>' +
    '<button type="button" id="gcse-bank-create" class="px-3 py-1.5 rounded border border-gray-300 text-sm">Create bank sheet</button>' +
    '<button type="button" id="gcse-bank-guide" class="px-3 py-1.5 rounded border border-gray-300 text-sm">Download Topic Codes Guide (for the bank)</button>' +
    (b && b.spreadsheetId ? '<a class="px-3 py-1.5 rounded border border-gray-300 text-sm text-blue-700" target="_blank" rel="noopener" href="https://docs.google.com/spreadsheets/d/' + gEsc(b.spreadsheetId) + '/edit">Open bank in Google Sheets</a>' : '') +
    '</div><p class="text-xs text-gray-500 mb-3">Only real past-paper questions (with a Source) or reworded versions of them can be used. Short questions only go live once they pass their own test answers.</p><div id="gcse-bank-out"></div>';
  body.innerHTML = h;
  gEl('gcse-bank-guide').onclick = function () { gDownload('Topic Codes Guide - Question Bank.txt', gcseTopicCodesGuide('bank')); };
  gEl('gcse-bank-load').onclick = async function () {
    gcseStatus('Loading the question bank…');
    try { await gcseLoadBankFromDrive(); gcseStatus('Bank loaded.'); gcseRenderBankView(); }
    catch (e) { gcseStatus(e.message, true); }
  };
  gEl('gcse-bank-create').onclick = async function () {
    gcseStatus('Creating "' + GCSE_BANK_NAME + '" in the Course Website folder…');
    try { await getClassroomToken(); var f = await gcseFindBankSheet(true); gcse.bank = { rows: [], spreadsheetId: f.id, loadedAt: Date.now() }; gcseStatus('Bank sheet ready. Fill in the "Questions" tab, then click Load.'); gcseRenderBankView(); }
    catch (e) { gcseStatus(e.message, true); }
  };
  gcseRenderBankHealth(b);
}
function gcseRenderBankHealth(b) {
  var out = gEl('gcse-bank-out');
  var all = gcseAllValidated();
  var live = all.filter(function (v) { return v.live; });
  var off = all.filter(function (v) { return !v.live; });
  var starterLive = live.filter(function (v) { return v.row.starter; }).length;
  var driveCount = all.length - all.filter(function (v) { return v.row.starter; }).length;
  var perTopic = {};
  live.forEach(function (v) { v.row.topics.forEach(function (tc) { perTopic[tc] = (perTopic[tc] || 0) + 1; }); });
  var h = '<div class="grid grid-cols-3 gap-2 mb-3 text-center"><div class="rounded border bg-green-50 border-green-100 p-2"><div class="text-xl font-bold text-green-700">' + live.length + '</div><div class="text-xs">Live questions</div></div>' +
    '<div class="rounded border bg-red-50 border-red-100 p-2"><div class="text-xl font-bold text-red-700">' + off.length + '</div><div class="text-xs">Not live (need fixing)</div></div>' +
    '<div class="rounded border bg-blue-50 border-blue-100 p-2"><div class="text-xl font-bold text-blue-700">' + Object.keys(perTopic).length + '</div><div class="text-xs">Topics covered</div></div></div>' +
    '<p class="text-xs text-gray-600 mb-3">' + starterLive + ' built-in starter questions (original J277 exam-style, labelled as such) + ' + driveCount + ' from your Google Sheet' +
    (b && b.loadedAt ? '' : ' (not loaded yet – click Load to add your past papers)') + '.</p>';
  if (off.length) h += '<div class="border border-red-200 rounded-lg p-3 mb-3"><h4 class="font-bold text-red-700 mb-2">Not live yet</h4><table class="w-full text-xs">' + off.map(function (v) {
    var fails = v.testResults.filter(function (t) { return !t.pass; }).map(function (t) { return 'expected ' + t.expected + ', got ' + t.got + ': "' + gEsc(t.answer) + '"'; });
    return '<tr class="border-t align-top"><td class="p-1 font-semibold">' + gEsc(v.row.id || '?') + '</td><td class="p-1">' + gEsc(v.errors.join('; ')) + (fails.length ? '<div class="text-gray-600">' + fails.join('<br>') + '</div>' : '') + '</td></tr>';
  }).join('') + '</table></div>';
  h += '<div class="border border-gray-200 rounded-lg p-3"><h4 class="font-bold text-gray-800 mb-2">Live questions by topic</h4><div class="flex flex-wrap gap-1">' +
    Object.keys(perTopic).sort().map(function (tc) { return '<span class="text-xs px-2 py-1 rounded bg-gray-100" title="' + gEsc(J277.label(tc)) + '">' + gEsc(tc) + ' × ' + perTopic[tc] + '</span>'; }).join('') + '</div>' +
    '<div class="mt-3"><button type="button" id="gcse-bank-quiz" class="px-3 py-1.5 rounded border border-purple-400 text-purple-700 bg-purple-50 text-sm font-semibold">Run a topic quiz…</button></div></div>';
  out.innerHTML = h;
  var qb = gEl('gcse-bank-quiz');
  if (qb) qb.onclick = function () { gcseOpenTopicQuiz(gcse.className, []); };
}

// ── Topic picker (shared by topic quizzes and the test generator) ──
function gcseTopicPickerHtml(prefix, selected, counts, coverage) {
  selected = selected || {};
  var h = '<div class="max-h-80 overflow-y-auto border border-gray-200 rounded p-2 text-sm">';
  J277.list.forEach(function (n) {
    if (n.level === 0) { h += '<div class="font-bold text-gray-700 mt-2">' + gEsc(n.title) + '</div>'; return; }
    if (n.level === 1) { h += '<div class="font-semibold text-gray-700 mt-1">' + gEsc(n.code + ' ' + n.title) + '</div>'; return; }
    var indent = n.level === 2 ? 'ml-2' : 'ml-7';
    var c = counts ? (counts[n.code] || 0) : null;
    var cov = coverage ? (coverage[n.code] || 0) : null;
    h += '<label class="flex items-center gap-1.5 ' + indent + '"><input type="checkbox" class="' + prefix + '-topic" data-code="' + gEsc(n.code) + '" data-level="' + n.level + '"' + (selected[n.code] ? ' checked' : '') + '>' +
      '<span class="' + (n.level === 2 ? 'font-medium' : 'text-gray-700') + '">' + gEsc(n.code + ' ' + n.title) + '</span>' +
      (c != null && n.level === 3 ? ' <span class="text-[10px] text-gray-400">' + c + ' q</span>' : '') +
      (cov != null && n.level === 3 ? (cov ? ' <span class="text-[10px] text-green-700">tested ×' + cov + '</span>' : ' <span class="text-[10px] text-amber-700">not tested yet</span>') : '') + '</label>';
  });
  return h + '</div>';
}
function gcseBindTopicPicker(prefix) {
  document.querySelectorAll('.' + prefix + '-topic[data-level="2"]').forEach(function (cb) {
    cb.onchange = function () {
      document.querySelectorAll('.' + prefix + '-topic[data-level="3"]').forEach(function (s) {
        if (s.dataset.code.indexOf(cb.dataset.code) === 0) s.checked = cb.checked;
      });
    };
  });
}
function gcsePickedTopics(prefix) {
  return Array.from(document.querySelectorAll('.' + prefix + '-topic[data-level="3"]:checked')).map(function (cb) { return cb.dataset.code; });
}

// ── Live / forced topic quiz (runs through the normal quiz system) ──
async function gcseOpenTopicQuiz(className, topics) {
  var modal = gEl('modal-gcse-quiz');
  modal.classList.remove('hidden');
  var sel = {}; (topics || []).forEach(function (c) { J277.expand(c).forEach(function (s) { sel[s] = true; }); });
  var counts = {};
  gcseBankUsable().forEach(function (v) { if (v.quizUsable && v.row.type !== 'long') v.row.topics.forEach(function (tc) { J277.expand(tc).forEach(function (s) { counts[s] = (counts[s] || 0) + 1; }); }); });
  gEl('gcse-quiz-body').innerHTML =
    '' +
    '<div class="flex flex-wrap gap-3 items-end mb-2"><label class="text-xs text-gray-600">Class<select id="gcse-quiz-class" class="block border border-gray-300 rounded px-2 py-1 text-sm">' + await gcseClassOptions(className) + '</select></label>' +
    '<label class="text-xs text-gray-600">Questions<input id="gcse-quiz-count" type="number" min="1" max="30" value="8" class="block w-20 border border-gray-300 rounded px-2 py-1 text-sm"></label>' +
    '<label class="flex items-center gap-1 text-sm"><input type="checkbox" id="gcse-quiz-force" checked> Force the class into it</label></div>' +
    gcseTopicPickerHtml('gcse-quiz', sel, counts) +
    '<div class="flex gap-2 mt-3"><button type="button" id="gcse-quiz-start" class="jhncc-primary px-4 py-1.5 rounded text-sm font-semibold">Start quiz</button><span id="gcse-quiz-msg" class="text-xs text-red-600 self-center"></span></div>';
  gcseBindTopicPicker('gcse-quiz');
  gEl('gcse-quiz-close').onclick = function () { modal.classList.add('hidden'); };
  gEl('gcse-quiz-start').onclick = async function () {
    var cls = gEl('gcse-quiz-class').value;
    var picked = gcsePickedTopics('gcse-quiz');
    var msg = gEl('gcse-quiz-msg');
    if (!cls) { msg.textContent = 'Choose a class.'; return; }
    if (!picked.length) { msg.textContent = 'Tick at least one topic.'; return; }
    var qs = gcseBuildLiveQuizQuestions(picked, Number(gEl('gcse-quiz-count').value) || 8);
    if (!qs.length) { msg.textContent = 'No live multiple-choice or short-answer bank questions for those topics yet.'; return; }
    modal.classList.add('hidden');
    await gcseStartLiveQuiz(cls, picked, qs, gEl('gcse-quiz-force').checked);
  };
}
function gcseBuildLiveQuizQuestions(topics, count, opts) {
  opts = opts || {};
  var types = opts.includeShort === false ? ['mcq'] : ['mcq', 'short'];
  // Live quizzes show at most 4 answer buttons.
  var pool = gcseQuestionsForTopics(topics, types).filter(function (v) { return v.row.type !== 'mcq' || v.row.options.length <= 4; })
    .slice().sort(function () { return Math.random() - 0.5; }).slice(0, count);
  return pool.map(function (v) {
    var r = v.row;
    if (r.type === 'mcq') return { type: 'mcq', q: r.question, options: r.options.slice(0, 4), answer: r.answerIndex, duration: opts.seconds || 45, gcseQid: r.id, gcseTopics: r.topics };
    return { type: 'text_input', q: r.question + ' (' + r.marks + ' mark' + (r.marks === 1 ? '' : 's') + ')', answer: r.markScheme, gcseRules: r.rules, gcseMarks: r.marks, gcseQid: r.id, gcseTopics: r.topics, duration: Math.max(opts.seconds || 90, 60) };
  });
}
async function gcseStartLiveQuiz(className, topics, qs, force) {
  var labels = topics.slice(0, 3).map(function (c) { return (J277.get(c) || {}).title || c; }).join(', ') + (topics.length > 3 ? '…' : '');
  quiz.className = className;
  var lesson = { meta: { id: 'gcse-topics' }, data: { title: 'GCSE topic quiz: ' + labels } };
  var adminModal = gEl('modal-admin'); if (adminModal) adminModal.classList.add('hidden');
  await createHostedQuizLobby(lesson, qs, !!force);
}

function gcseHostCounts(includeShort) {
  var counts = {};
  gcseBankUsable().forEach(function (v) {
    var r = v.row;
    if (r.type !== 'mcq' && !(includeShort && r.type === 'short')) return;
    if (r.type === 'mcq' && r.options.length > 4) return;
    r.topics.forEach(function (tc) { J277.expand(tc).forEach(function (s) { counts[s] = (counts[s] || 0) + 1; }); });
  });
  return counts;
}
function gcseRenderHostTopics() {
  var box = gEl('quiz-gcse-topics'); if (!box) return;
  var prev = {};
  document.querySelectorAll('.gcse-host-topic:checked').forEach(function (cb) { prev[cb.dataset.code] = true; });
  var includeShort = gEl('quiz-gcse-short').checked;
  box.innerHTML = gcseTopicPickerHtml('gcse-host', prev, gcseHostCounts(includeShort));
  gcseBindTopicPicker('gcse-host');
  var update = function () {
    var picked = gcsePickedTopics('gcse-host');
    var n = picked.length ? gcseQuestionsForTopics(picked, includeShort ? ['mcq', 'short'] : ['mcq']).filter(function (v) { return v.row.type !== 'mcq' || v.row.options.length <= 4; }).length : 0;
    gEl('quiz-gcse-summary').textContent = picked.length ? picked.length + ' topic' + (picked.length === 1 ? '' : 's') + ' ticked · ' + n + ' matching question' + (n === 1 ? '' : 's') + ' in the bank' : 'Tick at least one topic.';
  };
  box.addEventListener('change', update);
  update();
}
async function gcseStartFromHostSetup() {
  var picked = gcsePickedTopics('gcse-host');
  if (!picked.length) { alert('Tick at least one GCSE topic.'); return; }
  var qs = gcseBuildLiveQuizQuestions(picked, Number(gEl('quiz-gcse-count').value) || 10, {
    includeShort: gEl('quiz-gcse-short').checked, seconds: Number(gEl('quiz-gcse-time').value) || 60
  });
  if (!qs.length) { alert('There are no bank questions for those topics yet.'); return; }
  gEl('modal-quiz-setup').classList.add('hidden');
  await gcseStartLiveQuiz(quiz.className, picked, qs, gEl('quiz-force-class').checked);
}
(function gcseInitHostQuizSource() {
  var lessonBtn = gEl('quiz-source-lesson-btn'), gcseBtn = gEl('quiz-source-gcse-btn'), start = gEl('btn-quiz-start-host');
  if (!lessonBtn || !gcseBtn || !start) return;
  function setSource(src) {
    gcse.hostSource = src;
    gEl('quiz-source-lesson').classList.toggle('hidden', src !== 'lesson');
    gEl('quiz-source-gcse').classList.toggle('hidden', src !== 'gcse');
    [[lessonBtn, 'lesson'], [gcseBtn, 'gcse']].forEach(function (p) {
      p[0].className = 'flex-1 px-3 py-1.5 rounded border text-sm font-semibold ' + (src === p[1] ? 'border-[rgb(176,28,35)] text-[rgb(176,28,35)] bg-red-50' : 'border-gray-300 text-gray-600 bg-white');
    });
    if (src === 'gcse') { start.disabled = false; start.classList.remove('opacity-60'); gcseRenderHostTopics(); }
    else if (typeof refreshQuizSetupQuestions === 'function') refreshQuizSetupQuestions();
  }
  lessonBtn.onclick = function () { setSource('lesson'); };
  gcseBtn.onclick = function () { setSource('gcse'); };
  gEl('quiz-gcse-short').onchange = gcseRenderHostTopics;
  var originalStart = start.onclick;
  start.onclick = function (e) {
    if (gcse.hostSource === 'gcse') return gcseStartFromHostSetup();
    return originalStart.call(this, e);
  };
  if (typeof openQuizSetup === 'function') {
    var originalOpen = openQuizSetup;
    openQuizSetup = function () {
      var r = originalOpen.apply(this, arguments);
      setSource(gcse.hostSource || 'lesson');
      return r;
    };
  }
  setSource('lesson');
})();

// ── Test generator (past-paper questions only) ──────────────────
function gcseGeneratorPool() {
  var includeStarter = gcse.genIncludeStarter === true;
  return gcseBankUsable().filter(function (v) { return includeStarter || !v.row.starter; });
}
async function gcseRenderGenerateView() {
  var body = gEl('gcse-body');
  var usable = gcseGeneratorPool();
  var counts = {};
  usable.forEach(function (v) { v.row.topics.forEach(function (tc) { J277.expand(tc).forEach(function (s) { counts[s] = (counts[s] || 0) + 1; }); }); });
  try { await gcseLoadTests(); } catch (e) {}
  var coverage = gcseCoverage(gcse.className);
  var classOpts = await gcseClassOptions(gcse.className);
  if (gcse.view !== 'generate') return;
  body.innerHTML = '<p class="text-xs text-gray-600 mb-2">Only uses real past-paper (and reworded past-paper) questions from your Google Sheet bank – load it in the Question Bank tab. ' + usable.length + ' usable questions.</p>' +
    '<label class="flex items-center gap-1.5 text-xs text-gray-600 mb-3"><input type="checkbox" id="gcse-gen-starter"' + (gcse.genIncludeStarter ? ' checked' : '') + '> Also use the built-in J277 exam-style starter questions (not real past papers)</label>' +
    '<div class="grid grid-cols-1 lg:grid-cols-2 gap-4"><div><div class="flex flex-wrap gap-3 mb-2 items-end">' +
    '<label class="text-xs text-gray-600">Class<select id="gcse-gen-class" class="block border border-gray-300 rounded px-2 py-1 text-sm">' + classOpts + '</select></label>' +
    '<label class="text-xs text-gray-600">Total marks<input id="gcse-gen-marks" type="number" min="5" value="50" class="block w-20 border border-gray-300 rounded px-2 py-1 text-sm"></label>' +
    '<label class="text-xs text-gray-600">Paper<select id="gcse-gen-paper" class="block border border-gray-300 rounded px-2 py-1 text-sm"><option value="">Mix</option><option value="1">Paper 1</option><option value="2">Paper 2</option></select></label>' +
    '<label class="text-xs text-gray-600">Title<input id="gcse-gen-title" class="block border border-gray-300 rounded px-2 py-1 text-sm" placeholder="Y10 Test – Systems architecture"></label></div>' +
    '<div class="text-xs text-gray-600 mb-1">Tick what they have learnt so far:</div>' + gcseTopicPickerHtml('gcse-gen', {}, counts, coverage) +
    '<button type="button" id="gcse-gen-go" class="jhncc-primary mt-3 px-4 py-1.5 rounded text-sm font-semibold">Generate test</button></div><div id="gcse-gen-out"></div></div>';
  gcseBindTopicPicker('gcse-gen');
  gEl('gcse-gen-starter').onchange = function () { gcse.genIncludeStarter = this.checked; gcseRenderGenerateView(); };
  gEl('gcse-gen-class').onchange = function () { gcse.className = this.value; gcseRenderGenerateView(); };
  gEl('gcse-gen-go').onclick = function () { gcseRunGenerator(); };
}
function gcseCoverage(className) {
  var cov = {};
  Object.keys(gcse.tests || {}).forEach(function (id) {
    var t = gcse.tests[id];
    if (!t || (className && t.className !== className)) return;
    (t.questions || []).forEach(function (q) { (q.topics || []).forEach(function (tc) { J277.expand(tc).forEach(function (s) { cov[s] = (cov[s] || 0) + 1; }); }); });
  });
  return cov;
}
// Pure: pick past-paper questions covering the topics fairly, fitting the mark total.
function gcseGenerate(usable, topics, totalMarks, paper, coverage, usedIds, rand) {
  rand = rand || Math.random;
  var wanted = {}; topics.forEach(function (c) { wanted[c] = true; });
  var cands = usable.filter(function (v) {
    var r = v.row;
    return (!paper || String(r.paper) === String(paper)) && r.topics.some(function (tc) { return J277.expand(tc).some(function (s) { return wanted[s]; }); });
  });
  var fresh = cands.filter(function (v) { return !usedIds[v.row.id]; });
  if (fresh.reduce(function (s, v) { return s + v.row.marks; }, 0) >= totalMarks) cands = fresh;
  var byTopic = {};
  cands.forEach(function (v) {
    var tc = J277.expand(v.row.topics[0]).filter(function (s) { return wanted[s]; })[0] || v.row.topics[0];
    (byTopic[tc] = byTopic[tc] || []).push(v);
  });
  Object.keys(byTopic).forEach(function (k) { byTopic[k].sort(function () { return rand() - 0.5; }); });
  // Untested topics first, then least tested.
  var order = Object.keys(byTopic).sort(function (a, b) { return (coverage[a] || 0) - (coverage[b] || 0) || (rand() - 0.5); });
  var picked = [], used = {}, families = {}, remaining = totalMarks, wantBig = false, guard = 0;
  function family(v) { return (v.row.rewordedFrom || v.row.id).toLowerCase(); }
  while (remaining > 0 && guard++ < 500) {
    var progress = false;
    for (var i = 0; i < order.length && remaining > 0; i++) {
      var list = byTopic[order[i]].filter(function (v) { return !used[v.row.id] && !families[family(v)] && v.row.marks <= remaining; });
      if (!list.length) continue;
      list.sort(function (a, b) { return wantBig ? b.row.marks - a.row.marks : a.row.marks - b.row.marks; });
      var v = list[Math.floor(rand() * Math.min(2, list.length))];
      picked.push(v); used[v.row.id] = true; families[family(v)] = true; remaining -= v.row.marks; wantBig = !wantBig; progress = true;
    }
    if (!progress) break;
  }
  return { questions: picked, total: totalMarks - remaining, shortBy: remaining };
}
function gcseRunGenerator() {
  var out = gEl('gcse-gen-out');
  var topics = gcsePickedTopics('gcse-gen');
  if (!topics.length) { out.innerHTML = '<p class="text-red-600 text-sm">Tick at least one topic.</p>'; return; }
  var usedIds = {};
  Object.keys(gcse.tests).forEach(function (id) {
    var t = gcse.tests[id]; if (t.className !== gcse.className) return;
    (t.questions || []).forEach(function (q) { if (q.bankId) usedIds[q.bankId] = true; });
  });
  var res = gcseGenerate(gcseGeneratorPool(), topics, Number(gEl('gcse-gen-marks').value) || 50, gEl('gcse-gen-paper').value, gcseCoverage(gcse.className), usedIds);
  gcse.generated = res;
  if (!res.questions.length) { out.innerHTML = '<p class="text-red-600 text-sm">No live past-paper questions match those topics yet.</p>'; return; }
  var h = '<div class="border border-gray-200 rounded-lg p-3"><h4 class="font-bold mb-1">' + res.questions.length + ' questions · ' + res.total + ' marks</h4>' +
    (res.shortBy ? '<p class="text-xs text-amber-700 mb-2">Not enough bank questions to reach the total – ' + res.shortBy + ' marks short. Add more past-paper questions for these topics.</p>' : '') +
    '<table class="w-full text-xs"><tr class="bg-gray-50"><th class="p-1">Q</th><th class="p-1 text-left">Topic</th><th class="p-1">Marks</th><th class="p-1 text-left">Source</th></tr>' +
    res.questions.map(function (v, i) {
      return '<tr class="border-t"><td class="p-1 font-semibold">Q' + (i + 1) + '</td><td class="p-1">' + v.row.topics.map(function (tc) { return gEsc(J277.label(tc)); }).join('<br>') + '</td><td class="p-1 text-center">' + v.row.marks + '</td><td class="p-1">' + gEsc(v.row.source || ('reworded from ' + v.row.rewordedFrom)) + '</td></tr>';
    }).join('') + '</table><div class="flex flex-wrap gap-2 mt-3">' +
    '<button type="button" id="gcse-gen-again" class="px-3 py-1.5 rounded border border-gray-300 text-sm">Regenerate</button>' +
    '<button type="button" id="gcse-gen-print" class="px-3 py-1.5 rounded border border-gray-300 text-sm">Print test</button>' +
    '<button type="button" id="gcse-gen-scheme" class="px-3 py-1.5 rounded border border-gray-300 text-sm">Print mark scheme</button>' +
    '<button type="button" id="gcse-gen-save" class="jhncc-primary px-3 py-1.5 rounded text-sm font-semibold">Save as test for ' + gEsc(gcse.className || '…') + '</button></div></div>';
  out.innerHTML = h;
  var title = function () { return gEl('gcse-gen-title').value.trim() || 'Generated test – ' + new Date().toLocaleDateString('en-GB'); };
  gEl('gcse-gen-again').onclick = gcseRunGenerator;
  gEl('gcse-gen-print').onclick = function () {
    gPrint(title(), '<h1>' + gEsc(title()) + '</h1><div class="muted">Total: ' + res.total + ' marks</div>' + res.questions.map(function (v, i) {
      var r = v.row;
      var lines = new Array(Math.max(2, r.marks * 2) + 1).join('<div class="lines"></div>');
      return '<div class="q"><b>Q' + (i + 1) + '.</b> ' + gEsc(r.question).replace(/\n/g, '<br>') + ' <b>[' + r.marks + ']</b>' +
        (r.type === 'mcq' ? '<ol type="A">' + r.options.map(function (o) { return '<li>' + gEsc(o) + '</li>'; }).join('') + '</ol>' : lines) + '</div>';
    }).join(''));
  };
  gEl('gcse-gen-scheme').onclick = function () {
    gPrint('Mark scheme – ' + title(), '<h1>Mark scheme: ' + gEsc(title()) + '</h1>' + res.questions.map(function (v, i) {
      var r = v.row;
      return '<div class="q"><b>Q' + (i + 1) + '</b> [' + r.marks + '] <span class="muted">' + gEsc(r.source || ('reworded from ' + r.rewordedFrom)) + '</span><br>' +
        (r.type === 'mcq' ? 'Answer: ' + String.fromCharCode(65 + r.answerIndex) + '. ' + gEsc(r.options[r.answerIndex]) : gEsc(r.markScheme).replace(/\n/g, '<br>')) + '</div>';
    }).join(''));
  };
  gEl('gcse-gen-save').onclick = function () {
    if (!gcse.className) { alert('Choose a class first.'); return; }
    var savedTitle = title(); // read before the view (and this input) is replaced
    gcse.view = 'tests';
    Promise.resolve(gcseSetView('tests')).then(function () {
      gcseRenderNewTestForm({
        title: savedTitle, total: res.total,
        map: 'Question,Max marks,Topic,Second topic,Command word\n' + res.questions.map(function (v, i) { return ['Q' + (i + 1), v.row.marks, v.row.topics[0], v.row.topics[1] || '', v.row.command || ''].join(','); }).join('\n'),
        bankIds: res.questions.map(function (v) { return v.row.id; })
      });
      gEl('gcse-nt-check').click();
    });
  };
}

// ── Teacher review list ─────────────────────────────────────────
async function gcseRenderReviewView() {
  var body = gEl('gcse-body');
  var classOpts = await gcseClassOptions(gcse.className);
  if (gcse.view !== 'review') return;
  body.innerHTML = '<div class="flex gap-3 items-end mb-3"><label class="text-xs text-gray-600">Class<select id="gcse-rev-class" class="block border border-gray-300 rounded px-2 py-1 text-sm">' + classOpts + '</select></label></div><div id="gcse-rev-out"></div>';
  gEl('gcse-rev-class').onchange = function () { gcse.className = this.value; gcseLoadReview(); };
  gcseLoadReview();
}
async function gcseLoadReview() {
  var out = gEl('gcse-rev-out');
  if (!gcse.className) { out.innerHTML = '<p class="text-gray-400 text-sm">Choose a class.</p>'; return; }
  out.innerHTML = '<p class="text-gray-400 text-sm">Loading…</p>';
  var codes = await gcseLoadClassCodes(gcse.className);
  var items = [];
  await Promise.all(codes.map(async function (code) {
    var snap = await state.db.ref('progress/' + code + '/gcseReview').get();
    var v = snap.exists() ? snap.val() : {};
    Object.keys(v || {}).forEach(function (k) { if (v[k] && v[k].status === 'pending') items.push(Object.assign({ key: k, code: code }, v[k])); });
  }));
  items.sort(function (a, b) { return a.at - b.at; });
  if (gcse.view !== 'review' || !gEl('gcse-rev-out')) return;
  out = gEl('gcse-rev-out');
  if (!items.length) { out.innerHTML = '<p class="text-gray-500 text-sm">Nothing to check. Answers the marker is unsure about, and "I think I\'m right" requests, appear here.</p>'; return; }
  out.innerHTML = items.map(function (it, i) {
    return '<div class="border border-gray-200 rounded-lg p-3 mb-2 text-sm"><div class="flex justify-between gap-2"><b>' + gEsc(gName(it.code) || it.code) + '</b><span class="text-xs text-gray-500">' + gEsc(it.source === 'appeal' ? 'Student thinks they are right' : 'Marker unsure') + ' · ' + new Date(it.at).toLocaleString('en-GB') + '</span></div>' +
      '<div class="text-gray-600 mt-1">' + gEsc(it.question) + '</div><div class="mt-1 bg-gray-50 rounded p-2 whitespace-pre-wrap">' + gEsc(it.answer) + '</div>' +
      '<div class="text-xs text-gray-500 mt-1">Auto mark: ' + it.auto + ' / ' + it.max + (it.reason ? ' – ' + gEsc(it.reason) : '') + '</div>' +
      '<div class="flex gap-2 mt-2"><button type="button" class="gcse-rev-btn px-2 py-1 rounded border border-green-500 text-green-700 text-xs font-semibold" data-i="' + i + '" data-ok="1">Award full marks</button>' +
      '<button type="button" class="gcse-rev-btn px-2 py-1 rounded border border-gray-300 text-xs" data-i="' + i + '" data-ok="0">Keep the auto mark</button></div></div>';
  }).join('');
  out.querySelectorAll('.gcse-rev-btn').forEach(function (b) {
    b.onclick = async function () {
      var it = items[Number(b.dataset.i)];
      var ok = b.dataset.ok === '1';
      var updates = {};
      updates['progress/' + it.code + '/gcseReview/' + it.key + '/status'] = ok ? 'accepted' : 'rejected';
      updates['progress/' + it.code + '/gcseReview/' + it.key + '/decidedAt'] = Date.now();
      try {
        await state.db.ref().update(updates);
        if (ok && it.auto < it.max) {
          (it.topics || []).forEach(function (tc) {
            state.db.ref('progress/' + it.code + '/gcseQuiz/' + gTopicKey(tc) + '/correct').transaction(function (c) { return (c || 0) + 1; }, null, false);
          });
        }
        gcseLoadReview();
      } catch (e) { gcseStatus(gDbError(e), true); }
    };
  });
}

// ── Student profile (teachers / admins only) ────────────────────
async function openGcseProfile(code) {
  if (!gIsStaff() || !code) return;
  var modal = gEl('modal-gcse-profile');
  modal.classList.remove('hidden');
  gEl('gcse-profile-close').onclick = function () { modal.classList.add('hidden'); };
  gEl('gcse-profile-title').textContent = gName(code) || code;
  var body = gEl('gcse-profile-body');
  body.innerHTML = '<p class="text-gray-400 text-sm">Loading profile…</p>';
  try {
    var snaps = await Promise.all([
      state.db.ref('codeIndex/' + code.toLowerCase()).get(),
      state.db.ref('progress/' + code).get(),
      state.db.ref('accessLog/' + code).get(),
      state.db.ref('gcse/targets/' + code).get().catch(function () { return null; }),
      gcseLoadTests().catch(function () { return {}; })
    ]);
    var idx = snaps[0].val() || {}, prog = snaps[1].val() || {}, access = snaps[2].val() || {};
    var target = snaps[3] && snaps[3].exists() && snaps[3].val() ? Number(snaps[3].val().grade) : null;
    var tests = gcse.tests || {};
    var testIds = Object.keys(tests);
    var resSnaps = await Promise.all(testIds.map(function (id) { return state.db.ref('gcse/results/' + id + '/' + code).get().catch(function () { return null; }); }));
    var history = [], topicAgg = {};
    testIds.forEach(function (id, i) {
      var s = resSnaps[i]; if (!s || !s.exists()) return;
      var r = s.val(), t = tests[id];
      if (r.absent) { history.push({ kind: 'paper', title: t.title, at: r.importedAt || t.createdAt, absent: true }); return; }
      var grade = GcseCore.gradeFor(r.score, gcseBoundaries(t));
      history.push({ kind: 'paper', id: id, title: t.title, at: r.importedAt || t.createdAt, score: r.score, max: gcseTestTotal(t), pct: gPct(r.score, gcseTestTotal(t)), grade: grade, dp: r.dp != null ? r.dp : r.dpSuggested, marks: r.marks || {}, test: t });
      (t.questions || []).forEach(function (q) {
        var v = r.marks ? r.marks[q.id] : null;
        (q.topics || []).forEach(function (tc) {
          var A = topicAgg[tc] || (topicAgg[tc] = { a: 0, p: 0 });
          A.a += v == null ? 0 : Number(v); A.p += q.marks;
        });
      });
    });
    var aps = prog.assessments || {};
    Object.keys(aps).forEach(function (id) {
      var a = aps[id];
      if (!a || !a.completedAt || a.type === 'paper') return;
      history.push({ kind: 'ap', title: (ASSESSMENTS[id] && ASSESSMENTS[id].title) || id, at: a.completedAt, score: a.score, max: a.maxScore, pct: gPct(a.score, a.maxScore) });
    });
    var quizStats = prog.gcseQuiz || {};
    Object.keys(quizStats).forEach(function (k) {
      var tc = gFromTopicKey(k), s = quizStats[k] || {};
      var A = topicAgg[tc] || (topicAgg[tc] = { a: 0, p: 0 });
      A.a += s.correct || 0; A.p += s.attempted || 0;
    });
    history.sort(function (a, b) { return a.at - b.at; });
    var steps = 0, ms = 0;
    Object.keys(prog).forEach(function (k) {
      if (['assessments', 'gcseQuiz', 'gcseReview'].indexOf(k) !== -1) return;
      var lesson = prog[k]; if (!lesson || typeof lesson !== 'object') return;
      Object.keys(lesson).forEach(function (s) { var st = lesson[s]; if (st && st.completed) steps++; if (st && st.totalMs) ms += st.totalMs; });
    });
    var working = gcseWorkingGradeFromHistory(history.filter(function (h) { return h.kind === 'paper' && !h.absent; }));
    var latestPaper = history.filter(function (h) { return h.kind === 'paper' && !h.absent; }).slice(-1)[0];
    var weakest = Object.keys(topicAgg).map(function (tc) { return { code: tc, pct: gPct(topicAgg[tc].a, topicAgg[tc].p) }; })
      .filter(function (x) { return x.pct != null; }).sort(function (a, b) { return a.pct - b.pct; }).slice(0, 5);
    var card = function (v, l) { return '<div class="rounded-lg border border-gray-200 p-3 text-center"><div class="text-2xl font-bold">' + v + '</div><div class="text-xs text-gray-500">' + l + '</div></div>'; };
    var gap = working != null && target != null ? working - target : null;
    var h = '<div class="text-sm text-gray-500 mb-3">' + gEsc(code) + ' · ' + gEsc(idx.className || 'No class') + '</div>' +
      '<div class="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">' + card(GcseCore.gradeLabel(working), 'Working grade') + card(GcseCore.gradeLabel(target), 'Target grade') +
      card(gap == null ? '–' : (gap >= 0 ? '▲ ' + (gap > 0 ? '+' + gap : '0') : '▼ ' + gap), 'Gap') + card(latestPaper && latestPaper.dp != null ? latestPaper.dp : '–', 'Latest DP (1–4)') +
      card(access.lastSeen ? new Date(access.lastSeen).toLocaleDateString('en-GB') : '–', 'Last login') + '</div>';
    var allPaperQs = [], allPaperMarks = {};
    history.filter(function (x) { return x.kind === 'paper' && !x.absent; }).forEach(function (x) {
      (x.test.questions || []).forEach(function (q) { var key = x.id + ':' + q.id; allPaperQs.push({ id: key, marks: q.marks, topics: q.topics }); allPaperMarks[key] = x.marks[q.id]; });
    });
    if (allPaperQs.length) {
      h += '<div class="border border-gray-200 rounded-lg p-3 mb-4"><h4 class="font-bold mb-2">Paper 1 vs Paper 2 <span class="text-xs font-normal text-gray-500">(all paper tests combined)</span></h4>' +
        gcseStudentSplitHtml(allPaperQs, allPaperMarks, true) + '</div>';
    }
    h += '<div class="border border-gray-200 rounded-lg p-3 mb-4"><h4 class="font-bold mb-2">Progress over time</h4>' + gcseProfileChart(history) + '</div>';
    h += '<div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4"><div class="lg:col-span-2 border border-gray-200 rounded-lg p-3"><h4 class="font-bold mb-2">Topic map</h4>' + gcseProfileTopicMap(topicAgg) + '</div>' +
      '<div class="border border-gray-200 rounded-lg p-3"><h4 class="font-bold mb-2">Weakest topics now</h4>' + (weakest.length ? '<ol class="text-sm space-y-1">' + weakest.map(function (w) {
        return '<li><span class="px-1.5 rounded text-xs font-bold" style="' + gRag(w.pct) + '">' + w.pct + '%</span> ' + gEsc(J277.label(w.code)) + '</li>';
      }).join('') + '</ol>' : '<p class="text-sm text-gray-500">No GCSE data yet.</p>') +
      '<h4 class="font-bold mt-4 mb-1">Website activity</h4><p class="text-sm">' + steps + ' lesson steps completed · ' + Math.round(ms / 60000) + ' minutes on lessons</p></div></div>';
    h += '<div class="border border-gray-200 rounded-lg p-3 mb-4"><h4 class="font-bold mb-2">History</h4><table class="w-full text-xs"><tr class="bg-gray-50"><th class="p-1 text-left">Date</th><th class="p-1 text-left">What</th><th class="p-1">Score</th><th class="p-1">Grade</th><th class="p-1">DP</th></tr>' +
      history.slice().reverse().map(function (x) {
        return '<tr class="border-t"><td class="p-1">' + (x.at ? new Date(x.at).toLocaleDateString('en-GB') : '') + '</td><td class="p-1">' + gEsc((x.kind === 'paper' ? 'Paper test: ' : 'AP: ') + x.title) + '</td>' +
          '<td class="p-1 text-center">' + (x.absent ? 'ABS' : (x.score != null ? x.score + ' / ' + x.max : '')) + '</td><td class="p-1 text-center">' + (x.kind === 'paper' && !x.absent ? GcseCore.gradeLabel(x.grade) : '') + '</td><td class="p-1 text-center">' + (x.dp != null ? x.dp : '') + '</td></tr>';
      }).join('') + '</table></div>';
    h += '<div class="border border-gray-200 rounded-lg p-3"><div class="flex justify-between items-center mb-2"><h4 class="font-bold">Teacher notes <span class="text-xs font-normal text-gray-500">(saved in your private Google sheet "' + GCSE_NOTES_NAME + '", not Firebase)</span></h4>' +
      '<button type="button" id="gcse-notes-load" class="text-xs px-2 py-1 rounded border border-gray-300">Load notes</button></div><div id="gcse-notes-list" class="text-sm text-gray-500">Click "Load notes" (needs Google sign-in).</div>' +
      '<div class="flex gap-2 mt-2"><input id="gcse-note-new" class="flex-1 border border-gray-300 rounded px-2 py-1 text-sm" placeholder="Add a note…"><button type="button" id="gcse-note-add" class="jhncc-primary px-3 py-1 rounded text-sm">Add</button></div></div>';
    body.innerHTML = h;
    gEl('gcse-notes-load').onclick = function () { gcseProfileLoadNotes(code); };
    gEl('gcse-note-add').onclick = function () { gcseProfileAddNote(code); };
  } catch (e) {
    body.innerHTML = '<p class="text-red-600 text-sm">' + gEsc(gDbError(e)) + '</p>';
  }
}
function gcseProfileChart(history) {
  var pts = history.filter(function (x) { return !x.absent && x.pct != null; });
  if (!pts.length) return '<p class="text-sm text-gray-500">No scores yet.</p>';
  var W = 640, H = 180, pad = 30;
  var x = function (i) { return pad + (pts.length === 1 ? (W - 2 * pad) / 2 : i * (W - 2 * pad) / (pts.length - 1)); };
  var y = function (pct) { return H - pad - pct / 100 * (H - 2 * pad); };
  var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.pct).toFixed(1); }).join(' ');
  var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="w-full" style="max-height:220px">' +
    [0, 50, 100].map(function (v) { return '<line x1="' + pad + '" x2="' + (W - pad) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="#e5e7eb"/><text x="4" y="' + (y(v) + 4) + '" font-size="10" fill="#6b7280">' + v + '%</text>'; }).join('') +
    '<path d="' + line + '" fill="none" stroke="rgb(176,28,35)" stroke-width="2"/>' +
    pts.map(function (p, i) {
      var label = p.kind === 'paper' && p.grade != null ? 'G' + GcseCore.gradeLabel(p.grade) + (p.dp != null ? ' · DP' + p.dp : '') : p.pct + '%';
      return '<circle cx="' + x(i) + '" cy="' + y(p.pct) + '" r="4" fill="' + (p.kind === 'paper' ? 'rgb(176,28,35)' : '#2563eb') + '"><title>' + gEsc(p.title + ': ' + p.pct + '%') + '</title></circle>' +
        '<text x="' + x(i) + '" y="' + (y(p.pct) - 8) + '" font-size="10" text-anchor="middle" fill="#374151">' + gEsc(label) + '</text>';
    }).join('') + '</svg><div class="text-xs text-gray-500">Red = paper tests (with working grade and DP), blue = APs.</div>';
  return svg;
}
function gcseProfileTopicMap(agg) {
  var pointPct = {};
  Object.keys(agg).forEach(function (tc) {
    J277.expand(tc).forEach(function (s) { var A = pointPct[s] || (pointPct[s] = { a: 0, p: 0 }); A.a += agg[tc].a; A.p += agg[tc].p; });
  });
  var h = '';
  J277.list.filter(function (n) { return n.level === 1; }).forEach(function (area) {
    var subs = J277.subTopics().filter(function (s) { return s.code.indexOf(area.code + '.') === 0; });
    h += '<div class="mb-2"><div class="text-xs font-semibold text-gray-700">' + gEsc(area.code + ' ' + area.title) + '</div><div class="flex flex-wrap gap-1 mt-0.5">' + subs.map(function (s) {
      var A = pointPct[s.code]; var pct = A && A.p ? gPct(A.a, A.p) : null;
      return '<span class="text-[10px] px-1.5 py-0.5 rounded" style="' + gRag(pct) + '" title="' + gEsc(J277.label(s.code)) + (pct == null ? ' – no data' : ' – ' + pct + '%') + '">' + gEsc(s.code) + '</span>';
    }).join('') + '</div></div>';
  });
  return h + '<div class="text-xs text-gray-500">Grey = no data yet. Combines paper tests and practice quizzes.</div>';
}
async function gcseNotesSheet() {
  await getClassroomToken();
  var folderId = state.config && state.config.driveFolderId;
  var q = "mimeType='application/vnd.google-apps.spreadsheet' and name='" + GCSE_NOTES_NAME + "' and trashed=false" + (folderId ? " and '" + folderId + "' in parents" : '');
  var files = await classroomFetchDriveFiles(q, 'files(id,name)', 5);
  if (files[0]) return files[0];
  var file = await classroomRequest('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id,name', {
    method: 'POST', body: JSON.stringify({ name: GCSE_NOTES_NAME, mimeType: 'application/vnd.google-apps.spreadsheet', parents: folderId ? [folderId] : undefined })
  });
  await classroomEnsureSheets(file.id, ['Notes']);
  await classroomWriteValues(file.id, "'Notes'!A1", [['Code', 'Date', 'Teacher', 'Note']]);
  return file;
}
async function gcseProfileLoadNotes(code) {
  var list = gEl('gcse-notes-list');
  list.textContent = 'Loading…';
  try {
    var f = await gcseNotesSheet();
    var rows = await classroomReadValues(f.id, "'Notes'!A2:D5000");
    var mine = rows.filter(function (r) { return String(r[0] || '').toLowerCase() === code.toLowerCase(); }).reverse();
    list.innerHTML = mine.length ? mine.map(function (r) { return '<div class="border-t py-1"><span class="text-xs text-gray-500">' + gEsc(r[1]) + ' · ' + gEsc(r[2]) + '</span><div class="text-gray-800">' + gEsc(r[3]) + '</div></div>'; }).join('') : 'No notes yet.';
  } catch (e) { list.textContent = 'Could not load notes: ' + e.message; }
}
async function gcseProfileAddNote(code) {
  var inp = gEl('gcse-note-new');
  var text = inp.value.trim(); if (!text) return;
  try {
    var f = await gcseNotesSheet();
    var who = state.teacherCode || (state.isAdmin ? 'admin' : '');
    await classroomRequest('https://sheets.googleapis.com/v4/spreadsheets/' + encodeURIComponent(f.id) + "/values/'Notes'!A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS", {
      method: 'POST', body: JSON.stringify({ values: [[code, new Date().toLocaleString('en-GB'), who, text]] })
    });
    inp.value = '';
    gcseProfileLoadNotes(code);
  } catch (e) { gEl('gcse-notes-list').textContent = 'Could not save the note: ' + e.message; }
}

// Click any student name with .gcse-profile-link to open their profile (staff only).
document.addEventListener('click', function (e) {
  var el = e.target && e.target.closest && e.target.closest('.gcse-profile-link');
  if (!el || !gIsStaff()) return;
  e.preventDefault();
  openGcseProfile(el.dataset.code);
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { gcseParseUpload: gcseParseUpload, gcseStudentRows: gcseStudentRows, gcseTopicStats: gcseTopicStats, gcseGenerate: gcseGenerate, gcseTopicCodesGuide: gcseTopicCodesGuide };
}
