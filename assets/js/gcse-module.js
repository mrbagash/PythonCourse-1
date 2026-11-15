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
      if (t.mode === 'online') { try { await gcseSyncOnlineResults(id); } catch (e) {} }
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
// What students receive for an online test: questions only – no answers, mark schemes or rules.
function gcseOnlineSpec(id, t) {
  return {
    id: id, title: t.title, type: 'gcse', className: t.className, hideResults: true, timeLimit: t.timeLimit || null,
    brief: 'Answer every question. Your answers save automatically. Your teacher marks this test and releases your results.',
    maxScore: gcseTestTotal(t),
    criteria: (t.questions || []).map(function (q) { return { id: q.id, text: q.id + ' – ' + ((J277.get((q.topics || [])[0]) || {}).title || ''), marks: q.marks }; }),
    questions: (t.questions || []).map(function (q) {
      return {
        id: q.id, title: (J277.get((q.topics || [])[0]) || {}).title || 'GCSE', marks: q.marks,
        prompt: gEsc(q.text || '') + ' <span class="text-xs text-yellow-300">[' + q.marks + ' mark' + (q.marks === 1 ? '' : 's') + ']</span>',
        type: q.type === 'mcq' ? 'mcq' : (q.type === 'long' ? 'gcse_long' : 'gcse_text'), options: q.type === 'mcq' ? (q.options || []) : null
      };
    })
  };
}
async function gcseRegisterOnlineTests() {
  var tests = await gcseLoadTests();
  Object.keys(tests).forEach(function (id) { if (tests[id] && tests[id].mode === 'online') ASSESSMENTS[id] = gcseOnlineSpec(id, tests[id]); });
}
// { code: true } for students with 25% extra time in this class (Class page → access arrangements).
async function gcseExtraTimeFor(className) {
  try {
    var s = await classSettings(className, true);
    var out = {};
    Object.keys(s.access || {}).forEach(function (c) { if (s.access[c] && s.access[c].extraTime) out[c] = true; });
    return Object.keys(out).length ? out : null;
  } catch (e) { return null; }
}

// ── Online tests: collect submissions → auto-mark → staff-only results (teacher checks later) ──
// Per question: marks (current), auto (computer's mark), status, responses, codes, reasons.
// Status: 'auto' (blue) · 'needs' (orange) · 'unmarked' (grey) · 'checked' (green) · 'changed' (purple)
function gcseAutoMarkQuestion(q, answer) {
  var text = String(answer == null ? '' : answer);
  if (!text.trim()) return { mark: null, status: 'auto', reason: 'Not attempted', codes: ['E4'] };
  if (q.type === 'mcq') {
    var right = String(Number(text)) === String(q.answerIndex);
    var res = { marks: right ? q.marks : 0, max: q.marks };
    return { mark: res.marks, status: 'auto', reason: right ? 'Correct option' : 'Wrong option', codes: right ? [] : GcseCore.suggestFeedbackCodes({ type: 'mcq', topics: q.topics, codes: q.codes }, text, res, J277) };
  }
  if (q.type === 'short' && q.rules) {
    var m = GcseCore.mark(q.rules, text, q.marks);
    return { mark: m.marks, status: m.needsCheck ? 'needs' : 'auto', reason: m.points.map(function (p) { return (p.awarded ? '✓ ' : '✗ ') + p.reason; }).join(' · '),
      codes: GcseCore.suggestFeedbackCodes({ type: 'short', topics: q.topics, codes: q.codes, command: q.command, marks: q.marks }, text, m, J277) };
  }
  if (q.markScheme) {
    var sug = GcseCore.suggestLongMark(q.markScheme, text, q.marks);
    return { mark: sug.marks, status: 'needs', reason: 'Suggested from the mark scheme' + (sug.matched.length ? ': mentions ' + sug.matched.map(function (i) { return '"' + sug.lines[i] + '"'; }).join(', ') : ' – nothing matched'),
      codes: GcseCore.suggestFeedbackCodes({ type: 'long', topics: q.topics, codes: q.codes, command: q.command, marks: q.marks }, text, { marks: sug.marks, max: q.marks, points: [] }, J277) };
  }
  return { mark: null, status: 'unmarked', reason: 'Needs marking', codes: [] };
}
function gcseResultFromQuestions(t, rec) {
  var score = 0, notAttempted = 0;
  (t.questions || []).forEach(function (q) { var v = rec.marks[q.id]; if (v == null) notAttempted++; else score += Number(v) || 0; });
  rec.score = score; rec.maxScore = gcseTestTotal(t); rec.notAttempted = notAttempted;
  rec.grade = GcseCore.gradeFor(score, gcseBoundaries(t));
  return rec;
}
async function gcseSyncOnlineResults(testId) {
  var t = gcse.tests[testId];
  if (!t || t.mode !== 'online') return 0;
  // Always read the latest list – Force AP adds sessions after the page has loaded.
  var ss = await state.db.ref('gcse/tests/' + testId + '/sessions').get();
  var sessions = ss.exists() ? Object.keys(ss.val() || {}) : [];
  t.sessions = ss.exists() ? ss.val() : null;
  if (!sessions.length) return 0;
  var existing = await gcseLoadResults(testId);
  var updates = {}, n = 0;
  for (var i = 0; i < sessions.length; i++) {
    var snap = await state.db.ref('quizSessions/' + sessions[i] + '/answers/0').get();
    var all = snap.exists() ? (snap.val() || {}) : {};
    Object.keys(all).forEach(function (code) {
      var resp = all[code];
      if (!resp || !resp.completed) return;
      var prev = existing[code];
      if (prev && prev.submittedAt && prev.submittedAt >= (resp.completedAt || 0)) return; // already collected
      var answers = resp.answers || {};
      var rec = { online: true, absent: false, className: t.className, submittedAt: resp.completedAt || Date.now(), importedAt: resp.completedAt || Date.now(),
        marks: {}, auto: {}, status: {}, responses: {}, reasons: {}, codes: {}, tabLeaves: Object.keys(resp.tabLeaves || {}).length, session: sessions[i],
        dp: prev && prev.dp != null ? prev.dp : null };
      (t.questions || []).forEach(function (q) {
        var a = answers[q.id];
        var prevStatus = prev && prev.status && prev.status[q.id];
        var am = gcseAutoMarkQuestion(q, a);
        rec.responses[q.id] = a == null ? '' : String(a);
        rec.auto[q.id] = am.mark;
        rec.reasons[q.id] = am.reason;
        if (am.codes.length) rec.codes[q.id] = am.codes;
        if (prevStatus === 'checked' || prevStatus === 'changed') {      // keep the teacher's decision
          rec.marks[q.id] = prev.marks ? prev.marks[q.id] : am.mark;
          rec.status[q.id] = prevStatus;
          if (prev.codes && prev.codes[q.id]) rec.codes[q.id] = prev.codes[q.id];
        } else {
          rec.marks[q.id] = am.mark;
          rec.status[q.id] = am.status;
        }
      });
      gcseResultFromQuestions(t, rec);
      updates['gcse/results/' + testId + '/' + code] = rec;
      n++;
    });
  }
  if (n) await state.db.ref().update(updates);
  return n;
}

function gcseRegisterAssessment(id, t) {
  if (typeof ASSESSMENTS === 'undefined' || !t) return;
  if (t.mode === 'online') { ASSESSMENTS[id] = gcseOnlineSpec(id, t); return; }
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
    L.push('Difficulty: F (Foundation-style) or H (Higher-style).');
    L.push('Feedback codes (optional): the common mix-up(s) the question tests, e.g. R1. Codes:');
    J277.FEEDBACK_CODES.forEach(function (c) { L.push('  ' + c.id + '  ' + c.text); });
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
  if (panel.dataset.ready !== '2') {
    panel.innerHTML = '<div id="gcse-nav" class="mb-2"></div><div id="gcse-status" class="text-xs mb-2"></div><div id="gcse-body"></div>';
    panel.dataset.ready = '2';
  }
  gcseSetView(gcse.view);
}
function gcseStatus(msg, isError) {
  var el = gEl('gcse-status'); if (!el) return;
  el.textContent = msg || '';
  el.className = 'text-xs mb-2 ' + (isError ? 'text-red-600' : 'text-gray-500');
}
var GCSE_VIEW_TITLES = { bank: 'Question bank', generate: 'Test generator', review: '"I think I\'m right" requests' };
function gcseSetView(view) {
  gcse.view = view;
  var nav = gEl('gcse-nav');
  if (nav) {
    nav.innerHTML = view === 'tests' ? '' : '<button type="button" id="gcse-back" class="text-sm text-blue-700 hover:underline">← Back to tests</button><span class="font-bold text-gray-800 ml-3">' + gEsc(GCSE_VIEW_TITLES[view] || '') + '</span>';
    var back = gEl('gcse-back'); if (back) back.onclick = function () { gcseSetView('tests'); };
  }
  gcseStatus('');
  if (view === 'tests') return gcseRenderTestsView();
  if (view === 'bank') return gcseRenderBankView();
  if (view === 'generate') { gcse.view = 'tests'; return Promise.resolve(gcseRenderTestsView()).then(function () { gcseOpenBuilder('mock'); }); }
  if (view === 'review') return gcseRenderReviewView();
}
async function gcseClassOptions(selected) {
  // Only GCSE classes (set in Classroom Management → class page → Type).
  var names = typeof gcseClassNamesOnly === 'function' ? await gcseClassNamesOnly() : (typeof getClassNames === 'function' ? await getClassNames() : []);
  if (!names.length) return '<option value="">No GCSE classes yet – set a class type in Classroom Management</option>';
  return '<option value="">— select GCSE class —</option>' + names.map(function (n) {
    return '<option value="' + gEsc(n) + '"' + (n === selected ? ' selected' : '') + '>' + gEsc(n) + '</option>';
  }).join('');
}

// ── Tests: list per class → ▸ View (Grades · Class feedback · Release) ──
async function gcseRenderTestsView() {
  var body = gEl('gcse-body');
  body.innerHTML = '<p class="text-gray-400 text-sm">Loading…</p>';
  try {
    await gcseLoadTests();
  } catch (e) { if (gcse.view === 'tests') body.innerHTML = '<p class="text-red-600 text-sm">' + gEsc(gDbError(e)) + '</p>'; return; }
  var classOpts = await gcseClassOptions(gcse.className);
  if (gcse.view !== 'tests') return; // user switched view while loading
  var menuItem = function (inner) { return '<div class="block w-full text-left px-2 py-1.5 rounded hover:bg-gray-50">' + inner + '</div>'; };
  body.innerHTML =
    '<div class="flex flex-wrap items-end gap-3 mb-4">' +
      '<div><label class="block text-xs text-gray-500 mb-1">GCSE class</label><select id="gcse-class" class="border border-gray-300 rounded px-2 py-1.5 text-sm min-w-[220px]">' + classOpts + '</select></div>' +
      '<details id="gcse-new-menu" class="relative"><summary class="jhncc-primary px-3 py-1.5 rounded text-sm font-semibold cursor-pointer list-none">+ New test ▾</summary>' +
        '<div class="absolute z-20 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-2 text-sm">' +
          menuItem('<button type="button" id="gcse-new-eou" class="w-full text-left"><b>End of unit test</b><span class="block text-xs text-gray-500">Pick a unit (1.1–2.5) – questions generated for you</span></button>') +
          menuItem('<button type="button" id="gcse-new-mock" class="w-full text-left"><b>Mock</b><span class="block text-xs text-gray-500">Paper 1, Paper 2 or both – everything covered so far</span></button>') +
          '<div class="border-t border-gray-100 my-1"></div><div class="px-2 pt-1 text-xs text-gray-500">Already sat a test on paper?</div>' +
          menuItem('<button type="button" id="gcse-blank-template" class="w-full text-left"><b>1. Download blank test spreadsheet</b><span class="block text-xs text-gray-500">Has this class\'s names and codes</span></button>') +
          menuItem('<label class="block cursor-pointer"><b>2. Import test spreadsheet</b><span class="block text-xs text-gray-500">Questions + everyone\'s marks in one file</span><input type="file" id="gcse-import-whole" accept=".xlsx,.xls,.csv" class="hidden"></label>') +
          menuItem('<button type="button" id="gcse-new-test" class="w-full text-left"><b>Paste a test map</b><span class="block text-xs text-gray-500">Advanced – from the Topic Codes Guide</span></button>') +
        '</div></details>' +
      '<button type="button" id="gcse-class-settings" class="px-3 py-1.5 rounded border border-gray-300 bg-white text-sm">Class page</button>' +
    '</div><div id="gcse-test-body"></div>' +
    '<details class="mt-6 border border-gray-200 rounded-lg"><summary class="cursor-pointer px-3 py-2 text-sm font-semibold text-gray-700">More tools</summary><div class="flex flex-wrap gap-2 p-3">' +
      '<button type="button" class="gcse-more px-3 py-1.5 rounded border border-gray-300 text-sm" data-view="bank">Question bank</button>' +

      '<button type="button" class="gcse-more px-3 py-1.5 rounded border border-gray-300 text-sm" data-view="review">"I think I\'m right" requests</button>' +
      '<button type="button" id="gcse-guide" class="px-3 py-1.5 rounded border border-gray-300 text-sm">Download Topic Codes Guide</button>' +
    '</div></details>';
  gEl('gcse-class').onchange = function () { gcse.className = this.value; gcse.testId = ''; gcseRenderTest(); };
  gEl('gcse-new-test').onclick = function () { gEl('gcse-new-menu').open = false; gcseRenderNewTestForm(); };
  gEl('gcse-new-eou').onclick = function () { gEl('gcse-new-menu').open = false; gcseOpenBuilder('eou'); };
  gEl('gcse-new-mock').onclick = function () { gEl('gcse-new-menu').open = false; gcseOpenBuilder('mock'); };
  gEl('gcse-blank-template').onclick = function () { gEl('gcse-new-menu').open = false; gcseDownloadBlankTemplate(); };
  gEl('gcse-import-whole').onchange = function () { gEl('gcse-new-menu').open = false; if (this.files[0]) gcseHandleWholeImport(this.files[0]); this.value = ''; };
  gEl('gcse-guide').onclick = function () { gDownload('Topic Codes Guide.txt', gcseTopicCodesGuide('test')); };
  gEl('gcse-class-settings').onclick = function () { if (gcse.className) openClassPage(gcse.className); else gcseStatus('Choose a class first.', true); };
  document.querySelectorAll('.gcse-more').forEach(function (b) { b.onclick = function () { gcseSetView(b.dataset.view); }; });
  await gcseRenderTest();
}
function gcseTestsForClass(className) {
  return Object.keys(gcse.tests).filter(function (id) { return gcse.tests[id] && gcse.tests[id].className === className; })
    .sort(function (a, b) { return (gcse.tests[b].createdAt || 0) - (gcse.tests[a].createdAt || 0); });
}
// Keeps gcse.testId valid for the chosen class (the list / view are drawn by gcseRenderTest).
function gcseFillTestSelect() {
  var ids = gcse.className ? gcseTestsForClass(gcse.className) : [];
  if (gcse.testId && ids.indexOf(gcse.testId) === -1) gcse.testId = '';
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
      gcse.tests[id] = test; gcse.testId = id; gcse.viewTab = 'grades';
      gcseFillTestSelect(); gcseRenderTest();
      gcseStatus('Saved "' + title + '". Next: download the template, fill in the marks and upload it.');
    } catch (e) { gcseStatus(gDbError(e), true); }
  };
}

async function gcseRenderTest() {
  var box = gEl('gcse-test-body'); if (!box) return;
  var seq = gcse.renderSeq = (gcse.renderSeq || 0) + 1;   // a newer render wins
  gcseFillTestSelect();
  if (!gcse.className) { box.innerHTML = '<p class="text-gray-400 text-sm py-6 text-center">Choose a GCSE class.</p>'; return; }
  if (!gcse.testId) return gcseRenderTestList(box, seq);
  return gcseRenderTestView(box, seq);
}

async function gcseRenderTestList(box, seq) {
  var ids = gcseTestsForClass(gcse.className);
  if (!ids.length) {
    box.innerHTML = '<div class="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"><b>No tests for this class yet.</b><ol class="list-decimal ml-5 mt-1 space-y-0.5">' +
      '<li>Click <b>+ New test → Download blank test spreadsheet</b>.</li><li>Fill in the questions (number, marks, topic) and everyone\'s marks.</li>' +
      '<li>Click <b>+ New test → Import test spreadsheet</b>.</li></ol></div>';
    return;
  }
  box.innerHTML = '<p class="text-gray-400 text-sm">Loading tests…</p>';
  var data = await Promise.all([
    Promise.all(ids.map(function (id) { return gcseLoadResults(id).catch(function () { return {}; }); })),
    state.db.ref('classes/' + gcse.className + '/apFeedback').get().then(function (s) { return s.exists() ? s.val() : {}; }).catch(function () { return {}; })
  ]);
  if (seq !== gcse.renderSeq || !box.isConnected) return;
  var released = data[1] || {};
  box.innerHTML = '<div class="border border-gray-200 rounded-lg overflow-hidden"><table class="w-full text-sm"><tr class="bg-gray-50 text-left text-xs text-gray-500"><th class="p-2">Test</th><th class="p-2">Added</th><th class="p-2 text-center">Students</th><th class="p-2 text-center">Average</th><th class="p-2">Feedback</th><th class="p-2"></th></tr>' +
    ids.map(function (id, i) {
      var t = gcse.tests[id], res = data[0][i] || {};
      var sat = Object.keys(res).filter(function (c) { return res[c] && !res[c].absent; });
      var max = gcseTestTotal(t);
      var avg = sat.length ? Math.round(sat.reduce(function (s, c) { return s + (Number(res[c].score) || 0); }, 0) / sat.length / Math.max(max, 1) * 100) : null;
      var fb = released[id] && released[id].released;
      var kind = t.kind === 'eou' ? 'End of unit' : t.kind === 'mock' ? 'Mock' : 'Test';
      return '<tr class="border-t hover:bg-gray-50"><td class="p-2 font-semibold">' + gEsc(t.title) + '<div class="text-xs font-normal text-gray-500">' + kind + (t.mode === 'online' ? ' · online' : t.mode === 'paper' ? ' · on paper' : '') + '</div></td><td class="p-2 text-xs text-gray-500">' + (t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-GB') : '') + '</td>' +
        '<td class="p-2 text-center">' + (sat.length ? sat.length : '<span class="text-gray-400">no marks yet</span>') + '</td>' +
        '<td class="p-2 text-center">' + (avg == null ? '–' : '<span class="px-1.5 rounded font-bold text-xs" style="' + gRag(avg) + '">' + avg + '%</span>') + '</td>' +
        '<td class="p-2 text-xs">' + (fb ? '<span class="text-green-700">✓ Released</span>' : '<span class="text-gray-500">Not released</span>') + '</td>' +
        '<td class="p-2 text-right"><button type="button" class="gcse-open-test px-3 py-1 rounded border border-gray-300 text-sm font-semibold hover:bg-white" data-id="' + gEsc(id) + '">▸ View</button></td></tr>';
    }).join('') + '</table></div>';
  box.querySelectorAll('.gcse-open-test').forEach(function (b) {
    b.onclick = function () { gcse.testId = b.dataset.id; gcse.viewTab = null; gcseRenderTest(); };
  });
}

async function gcseRenderTestView(box, seq) {
  var t = gcse.tests[gcse.testId];
  box.innerHTML = '<p class="text-gray-400 text-sm">Loading results…</p>';
  var fbInfo = null, collected = 0;
  if (t.mode === 'online') { try { collected = await gcseSyncOnlineResults(gcse.testId); } catch (e) {} }
  try {
    var data = await Promise.all([gcseLoadResults(gcse.testId), gcseLoadTargets(), gcseLoadClassCodes(gcse.className),
      state.db.ref('classes/' + gcse.className + '/apFeedback/' + gcse.testId).get().then(function (s) { return s.exists() ? s.val() : null; }).catch(function () { return null; })]);
    if (seq !== gcse.renderSeq || !box.isConnected) return;
    gcse.results = data[0]; gcse.codes = data[2]; fbInfo = data[3];
  } catch (e) { if (box.isConnected) box.innerHTML = '<p class="text-red-600 text-sm">' + gEsc(gDbError(e)) + '</p>'; return; }
  var rows = gcseStudentRows(t, gcse.results, gcse.targets, gcse.codes);
  var hasResults = rows.some(function (r) { return !r.missing; });
  var online = t.mode === 'online';
  var toCheck = online && hasResults && typeof gcseMarkUncheckedSummary === 'function' ? gcseMarkUncheckedSummary(t).mustCheck : 0;
  var tab = hasResults ? (gcse.viewTab || (toCheck ? 'mark' : 'grades')) : 'marks';
  if (tab === 'mark' && !(online && hasResults)) tab = 'grades';
  if (collected) gcseStatus('Collected ' + collected + ' new submission' + (collected === 1 ? '' : 's') + ' – auto-marked; check them in Mark answers.');
  var tabBtn = function (k, label) {
    var on = tab === k;
    return '<button type="button" class="gcse-vtab px-3 py-1.5 text-sm font-semibold border-b-2 ' + (on ? 'border-[rgb(176,28,35)] text-[rgb(176,28,35)]' : 'border-transparent text-gray-500 hover:text-gray-800') + '" data-tab="' + k + '">' + label + '</button>';
  };
  var menu = '<details id="gcse-more-menu" class="relative ml-auto"><summary class="px-3 py-1.5 rounded border border-gray-300 text-sm cursor-pointer list-none" title="More">⋯</summary>' +
    '<div class="absolute right-0 z-20 mt-1 w-60 bg-white border border-gray-200 rounded-lg shadow-lg p-1 text-sm">' +
      (hasResults ? '<button type="button" id="gcse-dl-template" class="block w-full text-left px-2 py-1.5 rounded hover:bg-gray-50">Download marks spreadsheet</button>' +
        '<label class="block px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">Upload corrected marks<input type="file" id="gcse-upload" accept=".xlsx,.xls,.csv" class="hidden"></label>' +
        '<button type="button" id="gcse-print-slips" class="block w-full text-left px-2 py-1.5 rounded hover:bg-gray-50">Print feedback slips</button>' +
        '<button type="button" id="gcse-export" class="block w-full text-left px-2 py-1.5 rounded hover:bg-gray-50">Export grades (CSV)</button>' : '') +
      ((t.questions || []).some(function (q) { return q.text; }) ? '<button type="button" id="gcse-print-paper" class="block w-full text-left px-2 py-1.5 rounded hover:bg-gray-50">Print paper</button>' +
        '<button type="button" id="gcse-print-scheme" class="block w-full text-left px-2 py-1.5 rounded hover:bg-gray-50">Print mark scheme</button>' : '') +
      '<button type="button" id="gcse-edit-test" class="block w-full text-left px-2 py-1.5 rounded hover:bg-gray-50">Grade boundaries / rename / delete</button>' +
    '</div></details>';
  var h = '<div class="flex items-center gap-3 mb-1"><button type="button" id="gcse-back-list" class="text-sm text-blue-700 hover:underline">← All tests</button>' +
    '<h3 class="text-lg font-bold text-gray-800">' + gEsc(t.title) + '</h3><span class="text-xs text-gray-500">' + gcseTestTotal(t) + ' marks · ' + (t.questions || []).length + ' questions</span></div>' +
    '<div class="flex items-center gap-1 border-b border-gray-200 mb-3">' +
      (hasResults ? (online && typeof gcseMarkRender === 'function' ? tabBtn('mark', 'Mark answers' + (toCheck ? ' <span class="ml-1 px-1.5 rounded-full text-[11px] bg-orange-100 text-orange-800">' + toCheck + '</span>' : ' ✓')) : '') + tabBtn('grades', 'Grades') + tabBtn('feedback', 'Class feedback') + tabBtn('release', fbInfo && fbInfo.released ? 'Release ✓' : 'Release') + (typeof wcfRenderActions === 'function' && fbInfo && fbInfo.wcf ? tabBtn('actions', 'Actions') : '') : tabBtn('marks', 'Add marks')) +
      menu + '</div><div id="gcse-import-out"></div><div id="gcse-settings-out"></div><div id="gcse-tab-body">';
  if (tab === 'marks' && t.mode === 'online') {
    h += '<div class="rounded border border-green-200 bg-green-50 p-4 text-sm text-green-900 mb-3"><b>Online test – ready to run.</b> Start it with the class from <b>Classes → Start AP</b>, or give it to absent students with <b>Force AP</b>. Results appear here as students submit.</div>';
  }
  if (tab === 'marks') {
    h += '<div class="rounded border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"><b>No marks yet.</b> Download the marks spreadsheet (every student\'s name and code is already in it), type in the marks, then upload it.' +
      ' Use <b>ABS</b> for absent students and leave a cell <b>blank</b> if a question was not attempted.' +
      '<div class="flex gap-2 mt-3"><button type="button" id="gcse-dl-template" class="jhncc-primary px-3 py-1.5 rounded text-sm font-semibold">Download marks spreadsheet</button>' +
      '<label class="px-3 py-1.5 rounded border border-blue-400 text-blue-700 bg-white text-sm font-semibold cursor-pointer">Upload filled spreadsheet<input type="file" id="gcse-upload" accept=".xlsx,.xls,.csv" class="hidden"></label></div></div>';
  } else if (tab === 'mark') {
    h += '<div id="gcse-mark-root"></div>';
  } else if (tab === 'grades') {
    h += gcseGradesTabHtml(t, rows);
  } else if (tab === 'feedback') {
    h += (typeof wcfRender === 'function' ? '<div id="wcf-root"></div><div id="wcf-analysis">' : '<div>') + gcseFeedbackTabHtml(t, rows) + '</div>';
  } else if (tab === 'actions') {
    h += '<div id="wcf-actions-root"></div>';
  } else {
    h += gcseReleaseTabHtml(t, rows, fbInfo);
  }
  box.innerHTML = h + '</div>';
  gEl('gcse-back-list').onclick = function () { gcse.testId = ''; gcseRenderTest(); };
  box.querySelectorAll('.gcse-vtab').forEach(function (b) { b.onclick = function () { gcse.viewTab = b.dataset.tab; gcseRenderTest(); }; });
  gEl('gcse-dl-template').onclick = function () { var m = gEl('gcse-more-menu'); if (m) m.open = false; gcseDownloadTemplate(t, rows); };
  gEl('gcse-upload').onchange = function () { var m = gEl('gcse-more-menu'); if (m) m.open = false; if (this.files[0]) gcseHandleUpload(this.files[0]); this.value = ''; };
  gEl('gcse-edit-test').onclick = function () { gEl('gcse-more-menu').open = false; gcseRenderSettings(t); };
  if (gEl('gcse-print-paper')) gEl('gcse-print-paper').onclick = function () { gEl('gcse-more-menu').open = false; gcsePrintPaper(t, false); };
  if (gEl('gcse-print-scheme')) gEl('gcse-print-scheme').onclick = function () { gEl('gcse-more-menu').open = false; gcsePrintPaper(t, true); };
  if (hasResults) gcseBindWcf(t, rows);
  if (tab === 'mark') gcseMarkRender(t);
  if (tab === 'feedback' && typeof wcfRender === 'function') wcfRender(t, rows);
  if (tab === 'actions' && typeof wcfRenderActions === 'function') wcfRenderActions(t, rows);
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
      ['Names are optional: you can delete the Name column (e.g. before sharing the sheet). Only Code and the question columns are needed; Target grade and DP can be removed too.'],
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

// The student header row: the first row with a "Code" cell. Name, Target grade and DP are optional
// and can be in any column – a sheet with only Code + question columns works (no names needed).
function gcseFindHeader(grid) {
  var norm = function (v) { return String(v == null ? '' : v).trim().toLowerCase(); };
  var hi = grid.findIndex(function (r) { return (r || []).some(function (c) { return /^(student )?code$/.test(norm(c)); }); });
  if (hi === -1) return null;
  var col = { code: -1, name: -1, target: -1, dp: -1 };
  (grid[hi] || []).forEach(function (c, i) {
    var h = norm(c);
    if (col.code === -1 && /^(student )?code$/.test(h)) col.code = i;
    else if (col.name === -1 && /^(student )?name$/.test(h)) col.name = i;
    else if (col.target === -1 && /^target( grade)?$/.test(h)) col.target = i;
    else if (col.dp === -1 && /^dp( \(1-4\))?$/.test(h)) col.dp = i;
  });
  var fixed = {}; Object.keys(col).forEach(function (k) { if (col[k] !== -1) fixed[col[k]] = true; });
  return { hi: hi, col: col, fixed: fixed };
}
// Pure: turn the uploaded grid into checked rows.
function gcseParseUpload(t, grid, classCodes) {
  var res = { rows: [], errors: [], warnings: [] };
  var H = gcseFindHeader(grid);
  if (!H) { res.errors.push('Could not find a "Code" column header – use the downloaded template, or put "Code" above the student codes.'); return res; }
  var hi = H.hi, C = H.col;
  var header = grid[hi].map(function (c) { return String(c || '').trim(); });
  var qcol = {};
  (t.questions || []).forEach(function (q) {
    var idx = header.findIndex(function (h, i) { return !H.fixed[i] && h.toLowerCase() === q.id.toLowerCase(); });
    if (idx === -1) res.errors.push('Column for ' + q.id + ' is missing from the file.');
    else qcol[q.id] = idx;
  });
  header.forEach(function (h, i) {
    if (!H.fixed[i] && h && !(t.questions || []).some(function (q) { return q.id.toLowerCase() === h.toLowerCase(); })) res.warnings.push('Column "' + h + '" is not in this test and was ignored.');
  });
  var at = function (line, i) { return i === -1 ? '' : String(line[i] == null ? '' : line[i]).trim(); };
  var lowerCodes = {}; classCodes.forEach(function (c) { lowerCodes[c.toLowerCase()] = c; });
  var seen = {};
  var nq = (t.questions || []).length || 1;
  for (var r = hi + 1; r < grid.length; r++) {
    var line = grid[r] || [];
    var rawCode = at(line, C.code);
    var rawName = at(line, C.name);
    if (!rawCode && !rawName) continue;
    var matched = lowerCodes[rawCode.toLowerCase()] || rawCode;
    var row = { line: r + 1, name: rawName || gName(matched) || '', code: matched, problems: [], marks: {}, absent: false };
    if (!rawCode) row.problems.push('No code');
    else if (!lowerCodes[rawCode.toLowerCase()]) row.problems.push('Code not in ' + t.className);
    if (seen[row.code.toLowerCase()]) row.problems.push('Duplicate row');
    seen[row.code.toLowerCase()] = true;
    var tgRaw = at(line, C.target);
    var tg = GcseCore.parseGrade(tgRaw);
    if (tg === undefined) row.problems.push('Target grade "' + tgRaw + '" should be U or 1–9');
    row.target = tg === undefined ? null : tg;
    var dpRaw = at(line, C.dp);
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
  var H = gcseFindHeader(grid);
  if (!H) { out.errors.push('Could not find the "Code" header row – use the blank test spreadsheet.'); return out; }
  var hi = H.hi;
  var rowOf = {};
  for (var r = 0; r < hi; r++) {
    var key = String(grid[r][0] || '').trim().toLowerCase();
    if (['question', 'max marks', 'topic', 'second topic', 'command word'].indexOf(key) !== -1) rowOf[key] = r;
  }
  if (rowOf.question == null || rowOf['max marks'] == null || rowOf.topic == null) {
    out.errors.push('The spreadsheet needs "Question", "Max marks" and "Topic" rows above the Name/Code row.'); return out;
  }
  var cols = [];
  (grid[rowOf.question] || []).forEach(function (v, c) { if (c > 0 && !H.fixed[c] && String(v || '').trim()) cols.push(c); });
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
      gcse.tests[id] = t; gcse.testId = id; gcse.viewTab = 'grades';
      gcseFillTestSelect();
      await gcseSaveImport(t, finalImp);
      gcseStatus('Created "' + t.title + '" and saved ' + finalImp.rows.length + ' students. Students see their results once you click Release feedback.');
    } catch (e) { gcseStatus(gDbError(e), true); }
  };
}

// ── WCF + grades rendering ──────────────────────────────────────
function gcseClassSplit(t, sat) {
  var classMarks = {};
  var classQs = (t.questions || []).map(function (q) { return { id: q.id, marks: q.marks * sat.length, topics: q.topics }; });
  (t.questions || []).forEach(function (q) { classMarks[q.id] = sat.reduce(function (s, r) { return s + (Number(r.marks[q.id]) || 0); }, 0); });
  return gcsePaperSplit(classQs, classMarks);
}

// Tab 1 – Grades
function gcseGradesTabHtml(t, rows) {
  var stats = gcseTopicStats(t, rows);
  var sat = stats.sat;
  var absent = rows.filter(function (r) { return r.absent; }).length;
  var avg = sat.length ? sat.reduce(function (s, r) { return s + r.score; }, 0) / sat.length : 0;
  var graded = sat.filter(function (r) { return r.grade != null; });
  var avgGrade = graded.length ? (graded.reduce(function (s, r) { return s + r.grade; }, 0) / graded.length).toFixed(1) : '–';
  var below = sat.filter(function (r) { return r.gap != null && r.gap < 0; });
  var lowDpBelow = below.filter(function (r) { var d = gcseDp(r); return d != null && d >= 3; });
  var card = function (v, l, c) { return '<div class="rounded-lg border p-3 text-center ' + c + '"><div class="text-2xl font-bold">' + v + '</div><div class="text-xs">' + l + '</div></div>'; };
  var classSplit = gcseClassSplit(t, sat);
  var hasSplit = classSplit.both;
  var h = '<div class="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">' +
    card(sat.length + (absent ? ' <span class="text-sm font-normal">(+' + absent + ' absent)</span>' : ''), 'Sat the test', 'bg-blue-50 border-blue-100 text-blue-700') +
    card(Math.round(avg * 10) / 10 + ' / ' + gcseTestTotal(t), 'Average score', 'bg-purple-50 border-purple-100 text-purple-700') +
    card(avgGrade, 'Average grade' + (t.boundaries ? '' : ' (J277 default boundaries)'), 'bg-indigo-50 border-indigo-100 text-indigo-700') +
    card(below.length, 'Below target', 'bg-red-50 border-red-100 text-red-700') +
    card(lowDpBelow.length, 'Low DP & below target', 'bg-amber-50 border-amber-100 text-amber-800') + '</div>';
  if (hasSplit) {
    var cp = classSplit.papers;
    h += '<div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">' + ['1', '2'].map(function (k) {
      var weak = classSplit.focus === k;
      return '<div class="rounded-lg border p-3 ' + (weak ? 'border-red-300 bg-red-50' : 'border-gray-200') + '"><div class="flex justify-between text-sm"><b>Paper ' + k + (k === '1' ? ' – Computer systems' : ' – Algorithms & programming') + '</b>' +
        (weak ? '<span class="text-xs text-red-700 font-semibold">Focus reteaching here</span>' : '') + '</div>' +
        '<div class="h-2 bg-gray-200 rounded mt-2"><div class="h-2 rounded" style="width:' + cp[k].pct + '%;background:' + (cp[k].pct >= 70 ? '#16a34a' : cp[k].pct >= 40 ? '#d97706' : '#dc2626') + '"></div></div>' +
        '<div class="text-xs text-gray-600 mt-1">Class average ' + cp[k].pct + '%</div></div>';
    }).join('') + '</div>';
  }
  h += '<div class="border border-gray-200 rounded-lg p-3"><div class="flex flex-wrap items-center justify-between gap-2 mb-2"><h4 class="font-bold text-gray-800">Students</h4>' +
    '<select id="gcse-grade-filter" class="border border-gray-300 rounded px-2 py-1 text-xs"><option value="all">Everyone</option><option value="below">Below target</option><option value="lowdp">Low DP (3–4) & below target</option></select></div>' +
    gcseGradeDistributionHtml(sat) +
    '<div class="overflow-x-auto"><table class="w-full text-xs border border-gray-200" id="gcse-grade-table"><tr class="bg-gray-50"><th class="p-1 text-left">Student</th><th class="p-1">Score</th><th class="p-1">%</th><th class="p-1">Overall</th>' + (hasSplit ? '<th class="p-1">Paper 1</th><th class="p-1">Paper 2</th>' : '') + '<th class="p-1">Target</th><th class="p-1">Gap</th><th class="p-1">Not attempted</th><th class="p-1">DP (1 best – 4 worst)</th></tr>' +
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
  return h;
}

// Tab 2 – Class feedback (WCF)
function gcseFeedbackTabHtml(t, rows) {
  var stats = gcseTopicStats(t, rows);
  var sat = stats.sat;
  var paper = gcse.heatPaper || 'all';
  var topics = stats.topics.filter(function (T) { return paper === 'all' || GcseCore.paperOf(T.code) === paper; });
  var hasBoth = stats.topics.some(function (T) { return GcseCore.paperOf(T.code) === '1'; }) && stats.topics.some(function (T) { return GcseCore.paperOf(T.code) === '2'; });
  var h = '<div class="flex justify-end mb-2"><button type="button" id="gcse-print-wcf" class="px-3 py-1.5 rounded border border-gray-300 text-sm">Print WCF sheet</button></div>';
  h += '<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4"><div class="border border-gray-200 rounded-lg p-3"><h4 class="font-bold text-gray-800 mb-2">Reteach these <span class="text-xs font-normal text-gray-500">(most marks lost)</span></h4>' +
    (stats.reteach.length ? '<ol class="space-y-1 text-sm">' + stats.reteach.map(function (T) {
      return '<li class="flex items-center justify-between gap-2"><span><span class="px-1.5 rounded text-xs font-bold" style="' + gRag(T.pct) + '">' + T.pct + '%</span> ' + gEsc(T.label) + ' <span class="text-xs text-gray-500">– ' + T.lost + ' marks lost</span></span>' +
        '<button type="button" class="gcse-quiz-topic text-xs px-2 py-0.5 rounded border border-purple-300 text-purple-700" data-topics="' + gEsc(T.code) + '">Quiz class</button></li>';
    }).join('') + '</ol><button type="button" class="gcse-quiz-topic mt-2 text-xs px-2 py-1 rounded border border-purple-400 text-purple-700 bg-purple-50 font-semibold" data-topics="' + gEsc(stats.reteach.map(function (T) { return T.code; }).join(',')) + '">Quiz the class on all of these</button>' : '<p class="text-sm text-gray-500">No marks lost – nothing to reteach.</p>') +
    '</div><div class="border border-gray-200 rounded-lg p-3"><h4 class="font-bold text-gray-800 mb-2">Intervention groups <span class="text-xs font-normal text-gray-500">(weakest topic under 50%)</span></h4>';
  var groups = gcseInterventionGroups(stats);
  h += groups.length ? groups.map(function (g) {
    return '<div class="mb-2 text-sm"><div class="font-semibold">' + gEsc(J277.label(g.topic)) + ' <span class="text-xs text-gray-500">(' + g.students.length + ')</span></div><div class="text-xs text-gray-600">' +
      g.students.map(function (r) { return gEsc(r.name || r.code); }).join(', ') + '</div></div>';
  }).join('') : '<p class="text-sm text-gray-500">Nobody is below 50% on any topic.</p>';
  h += '</div></div>';
  // Heatmap with paper switch
  h += '<div class="border border-gray-200 rounded-lg p-3 mb-4"><div class="flex flex-wrap items-center justify-between gap-2 mb-2"><h4 class="font-bold text-gray-800">Topic heatmap</h4>' +
    (hasBoth ? '<div class="flex gap-1 text-xs">' + [['all', 'Overall'], ['1', 'Paper 1'], ['2', 'Paper 2']].map(function (p) {
      return '<button type="button" class="gcse-heat-paper px-2 py-1 rounded border ' + (paper === p[0] ? 'border-[rgb(176,28,35)] text-[rgb(176,28,35)] bg-red-50 font-semibold' : 'border-gray-300') + '" data-paper="' + p[0] + '">' + p[1] + '</button>';
    }).join('') + '</div>' : '') + '</div>' +
    (topics.length ? '<div class="overflow-x-auto"><table class="text-xs border-collapse"><tr><th class="p-1 text-left sticky left-0 bg-white">Student</th>' +
      topics.map(function (T) { return '<th class="p-1 font-mono" title="' + gEsc(T.label) + '">' + gEsc(T.code) + '</th>'; }).join('') + '</tr>' +
      '<tr class="font-bold"><td class="p-1 sticky left-0 bg-white">Class</td>' + topics.map(function (T) { return '<td class="p-1 text-center" style="' + gRag(T.pct) + '">' + T.pct + '%</td>'; }).join('') + '</tr>' +
      sat.map(function (r) {
        return '<tr><td class="p-1 whitespace-nowrap sticky left-0 bg-white">' + gEsc(r.name || r.code) + '</td>' + topics.map(function (T) {
          var pp = T.per[r.code]; var pct = pp ? gPct(pp.a, pp.p) : null;
          return '<td class="p-1 text-center" style="' + gRag(pct) + '" title="' + gEsc(T.label) + '">' + (pct == null ? '' : pct) + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</table></div><p class="text-xs text-gray-500 mt-1">Hover a code to see the topic. Green ≥ 70%, amber 40–69%, red &lt; 40%.</p>' : '<p class="text-sm text-gray-500">No questions from this paper in the test.</p>') + '</div>';
  // Questions + command words
  h += '<div class="grid grid-cols-1 lg:grid-cols-3 gap-4"><div class="lg:col-span-2 border border-gray-200 rounded-lg p-3"><h4 class="font-bold text-gray-800 mb-2">Questions</h4><div class="overflow-x-auto"><table class="w-full text-xs border border-gray-200"><tr class="bg-gray-50"><th class="p-1">Q</th><th class="p-1 text-left">Topic</th><th class="p-1">Avg</th><th class="p-1">%</th><th class="p-1">Not attempted</th><th class="p-1 text-left">Common mistake (your note)</th></tr>' +
    stats.questions.map(function (q) {
      return '<tr class="border-t"><td class="p-1 font-semibold">' + gEsc(q.id) + '</td><td class="p-1">' + q.topics.map(function (tc) { return gEsc(J277.label(tc)); }).join('<br>') + '</td>' +
        '<td class="p-1 text-center">' + (Math.round(q.avg * 10) / 10) + ' / ' + q.marks + '</td><td class="p-1 text-center" style="' + gRag(q.pct) + '">' + q.pct + '%</td>' +
        '<td class="p-1 text-center' + (q.notAttempted >= Math.max(2, stats.sat.length * 0.2) ? ' text-red-700 font-bold' : '') + '">' + (q.notAttempted || '') + '</td>' +
        '<td class="p-1"><input class="gcse-note w-full border border-gray-200 rounded px-1 py-0.5" data-q="' + gEsc(q.id) + '" value="' + gEsc((t.notes || {})[q.id] || '') + '" placeholder="e.g. mixed up MAR and MDR"></td></tr>';
    }).join('') + '</table></div></div><div class="border border-gray-200 rounded-lg p-3"><h4 class="font-bold text-gray-800 mb-2">Exam technique (command words)</h4>' +
    (stats.commands.length ? '<table class="w-full text-xs">' + stats.commands.map(function (C) {
      return '<tr><td class="p-1">' + gEsc(C.word) + '</td><td class="p-1 text-right"><span class="px-1.5 rounded font-bold" style="' + gRag(C.pct) + '">' + C.pct + '%</span></td></tr>';
    }).join('') + '</table>' : '<p class="text-xs text-gray-500">Add command words to the test to see this.</p>') + '</div></div>';
  return h;
}

// Tab 3 – Release
function gcseReleaseTabHtml(t, rows, fbInfo) {
  var released = fbInfo && fbInfo.released;
  return '<div class="max-w-2xl space-y-3"><div class="rounded-lg border p-4 ' + (released ? 'border-green-200 bg-green-50' : 'border-gray-200') + '">' +
    (released ? '<b class="text-green-800">Released ' + new Date(fbInfo.releasedAt).toLocaleString('en-GB') + '.</b> Students can see it under <b>AP Feedback</b>. Release again after changing marks.' :
      '<b>Not released yet.</b> Students cannot see their results until you release them.') + '</div>' +
    '<div class="border border-gray-200 rounded-lg p-4 text-sm space-y-2"><div class="font-semibold">Each student will see:</div><ul class="list-disc ml-5 text-gray-700">' +
      '<li>their score, and what went well / even better if by topic</li><li>Paper 1 vs Paper 2 and which paper to focus on</li><li>a <b>Fix my mistakes</b> practice button for their weak topics</li><li>the topics the class will revisit</li></ul>' +
    '<label class="flex items-center gap-2 mt-2"><input type="checkbox" id="gcse-show-grades"' + (t.showGrades ? ' checked' : '') + '> Also show their grades (overall, Paper 1, Paper 2)</label></div>' +
    '<button type="button" id="gcse-release" class="jhncc-primary px-5 py-2 rounded font-semibold">' + (released ? 'Release again' : 'Release feedback') + '</button></div>';
}

function gcseGradeDistributionHtml(sat) {
  var counts = {}; var max = 1;
  sat.forEach(function (r) { if (r.grade == null) return; counts[r.grade] = (counts[r.grade] || 0) + 1; max = Math.max(max, counts[r.grade]); });
  if (!Object.keys(counts).length) return '';
  var h = '<div class="flex items-end gap-1 h-20 mb-2">';
  for (var g = 0; g <= 9; g++) {
    var c = counts[g] || 0;
    h += '<div class="flex flex-col items-center justify-end flex-1"><div class="text-[10px] text-gray-600">' + (c || '') + '</div><div style="height:' + Math.round(c / max * 52) + 'px;background:rgb(176,28,35);width:100%;border-radius:3px 3px 0 0"></div><div class="text-[10px] font-bold">' + GcseCore.gradeLabel(g) + '</div></div>';
  }
  return h + '</div>';
}

function gcseBindWcf(t, rows) {
  var on = function (id, ev, fn) { var el = gEl(id); if (el) el[ev] = fn; };
  on('gcse-grade-filter', 'onchange', function () {
    var f = this.value;
    document.querySelectorAll('.gcse-grade-row').forEach(function (tr) {
      var gap = tr.dataset.gap === '' ? null : Number(tr.dataset.gap), dp = tr.dataset.dp === '' ? null : Number(tr.dataset.dp);
      var show = f === 'all' || (f === 'below' && gap != null && gap < 0) || (f === 'lowdp' && gap != null && gap < 0 && dp != null && dp >= 3);
      tr.classList.toggle('hidden', !show);
    });
  });
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
  document.querySelectorAll('.gcse-heat-paper').forEach(function (b) {
    b.onclick = function () { gcse.heatPaper = b.dataset.paper; gcseRenderTest(); };
  });
  on('gcse-print-wcf', 'onclick', function () { gcsePrintWcf(t, rows); });
  on('gcse-print-slips', 'onclick', function () { gEl('gcse-more-menu').open = false; gcsePrintSlips(t, rows); });
  on('gcse-export', 'onclick', function () { gEl('gcse-more-menu').open = false; gcseExport(t, rows); });
  on('gcse-show-grades', 'onchange', async function () {
    try { await state.db.ref('gcse/tests/' + gcse.testId + '/showGrades').set(this.checked); t.showGrades = this.checked; gcseStatus('Saved. Click Release to update what students see.'); }
    catch (e) { gcseStatus(gDbError(e), true); }
  });
  on('gcse-release', 'onclick', async function () { await gcseRelease(t, rows); gcseRenderTest(); });
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
  var unchecked = typeof gcseMarkUncheckedSummary === 'function' ? gcseMarkUncheckedSummary(t) : null;
  if (unchecked && (unchecked.mustCheck || unchecked.autoOnly)) {
    var msg = (unchecked.mustCheck ? unchecked.mustCheck + ' answer' + (unchecked.mustCheck === 1 ? '' : 's') + ' still need marking or checking (grey/orange).\n' : '') +
      (unchecked.autoOnly ? unchecked.autoOnly + ' auto-mark' + (unchecked.autoOnly === 1 ? ' has' : 's have') + ' not been checked (blue).\n' : '') +
      '\nRelease anyway? Students will see the marks as they are now.';
    if (!confirm(msg)) { gcseStatus('Release cancelled – finish checking in Mark answers.'); return; }
  }
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
  if (typeof wcfReleaseUpdates === 'function') { try { await wcfReleaseUpdates(t, rows, updates, feedback); } catch (e) {} }
  updates['classes/' + t.className + '/apFeedback/' + gcse.testId] = feedback;
  var releasedAt = Date.now();
  rows.forEach(function (r) {
    if (r.missing || r.absent) return;
    var res = gcse.results[r.code] || {};
    updates['progress/' + r.code + '/assessments/' + gcse.testId] = {
      type: 'paper', title: t.title, completedAt: res.submittedAt || res.importedAt || releasedAt, score: r.score, maxScore: r.max,
      className: t.className, rubric: gcseRubric(t, { marks: r.marks }), grade: t.showGrades && r.grade != null ? r.grade : null, releasedAt: releasedAt
    };
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
  // Grade after feedback tasks: hide grades until this pupil's tasks are done.
  if (feedback.wcf && feedback.wcf.gradeAfter && feedback.showGrades && !feedback._tasksChecked && typeof wcfTasksLeft === 'function') {
    body.innerHTML = '<p class="text-gray-400 text-sm">Loading…</p>';
    wcfTasksLeft(feedback.assessmentId || rec.assessmentId).then(function (n) { feedback._tasksChecked = true; feedback._tasksLeft = n; gcseRenderStudentPaperFeedback(body, feedback, rec); });
    return;
  }
  var gradesOn = !!feedback.showGrades && !feedback._tasksLeft;
  var h = '<div class="border border-gray-200 rounded-lg p-4 space-y-4">' +
    (feedback._tasksLeft ? '<div class="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">📝 Finish your <b>feedback tasks</b> (' + feedback._tasksLeft + ' left) to see your grade. <button type="button" id="gcse-open-tasks" class="ml-2 jhncc-primary px-3 py-1 rounded text-xs font-semibold">Start</button></div>' : '') +
    '<div><h3 class="text-lg font-bold">' + gEsc(rec.title || feedback.title || 'Test') + '</h3><p class="text-sm text-gray-600">Score: <b>' + rec.score + ' / ' + rec.maxScore + '</b>' +
    (gradesOn && rec.grade != null ? ' · Working grade: <b>' + GcseCore.gradeLabel(rec.grade) + '</b>' : '') + '</p></div>' +
    gcseStudentSplitHtml(t.questions, marks, gradesOn) +
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
  if (gEl('gcse-open-tasks')) gEl('gcse-open-tasks').onclick = function () { var m = gEl('modal-student-ap-feedback'); if (m) m.classList.add('hidden'); wcfOpenTasks(); };
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
          var mcqResult = { marks: right ? q.marks : 0, max: q.marks, needsCheck: false };
          var mcqCodes = right ? [] : GcseCore.suggestFeedbackCodes({ type: 'mcq', topics: q.topics, codes: q.codes }, q.options[Number(b.dataset.i)], mcqResult, J277);
          gcseRecordQuizAttempt({ gcseQid: q.id, gcseTopics: q.topics, q: q.q, gcseCodes: mcqCodes }, q.options[Number(b.dataset.i)], mcqResult, 'practice');
          gEl('gcse-practice-result').innerHTML = '<div class="rounded p-2 ' + (right ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800') + '">' + (right ? 'Correct!' : 'Not quite. The answer is ' + String.fromCharCode(65 + q.answerIndex) + '. ' + gEsc(q.options[q.answerIndex])) + gcseCodeHtml(mcqCodes) + '</div>' + nextBtn;
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
        var codes = GcseCore.suggestFeedbackCodes({ type: 'short', topics: q.topics, codes: q.codes, command: q.command, marks: q.marks }, answer, m, J277);
        gcseRecordQuizAttempt({ gcseQid: q.id, gcseTopics: q.topics, q: q.q, gcseCodes: codes }, answer, m, 'practice');
        res.innerHTML = '<div class="rounded p-2 ' + (m.marks >= m.max ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900') + '"><b>' + m.marks + ' / ' + m.max + '</b>' +
          (m.needsCheck ? ' – your teacher will check this one.' : '') + '<ul class="text-xs list-disc ml-5 mt-1">' +
          m.points.map(function (p) { return '<li>' + (p.awarded ? '✓ ' : '✗ ') + gEsc(p.reason) + '</li>'; }).join('') + '</ul>' + gcseCodeHtml(codes) + '</div>' + scheme +
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
      cur.src = cur.src || {};
      var bucket = cur.src[source] || (cur.src[source] = { a: 0, c: 0 });
      bucket.a = (bucket.a || 0) + 1;
      if (full) bucket.c = (bucket.c || 0) + 1;
      cur.lastAt = Date.now();
      return cur;
    }, null, false);
  });
  // Misconceptions (feedback codes) this student has shown – used by profiles and class progress.
  (q.gcseCodes || []).forEach(function (id) {
    if (!result || result.marks >= result.max) return;
    state.db.ref('progress/' + state.uid + '/gcseMisconceptions/' + id).transaction(function (cur) {
      cur = cur || { count: 0 };
      cur.count = (cur.count || 0) + 1; cur.lastAt = Date.now(); cur.source = source;
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
  return { id: r.id, type: r.type, q: r.question, options: r.options, answerIndex: r.answerIndex, marks: r.marks, rules: r.rules || '', markScheme: r.markScheme || '',
    topics: r.topics, command: r.command || '', codes: r.codes || [], difficulty: r.difficulty || '' };
}
// Quiz-usable bank questions for these topics (a spec point includes its sub-topics).
// difficulty: '' (any) | 'F' | 'H' – questions with no difficulty count as both.
function gcseQuestionsForTopics(topicCodes, types, difficulty) {
  var wanted = {};
  topicCodes.forEach(function (c) { J277.expand(c).concat([J277.normaliseCode(c)]).forEach(function (s) { wanted[s] = true; }); });
  return gcseBankUsable().filter(function (v) {
    if (difficulty && v.row.difficulty && v.row.difficulty !== difficulty) return false;
    return v.quizUsable && (!types || types.indexOf(v.row.type) !== -1) && v.row.topics.some(function (tc) { return wanted[tc] || J277.expand(tc).some(function (s) { return wanted[s]; }); });
  });
}
function gcseCodeHtml(ids) {
  return (ids || []).map(function (id) {
    var c = J277.feedbackCode(id);
    return c ? '<div class="text-xs mt-1"><span class="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">' + gEsc(c.id) + '</span> ' + gEsc(c.text) + '</div>' : '';
  }).join('');
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
    '<p class="text-xs text-gray-600 mb-1">Difficulty: <b>' + live.filter(function (v) { return v.row.difficulty === 'F'; }).length + '</b> Foundation-style · <b>' +
      live.filter(function (v) { return v.row.difficulty === 'H'; }).length + '</b> Higher-style · <b>' + live.filter(function (v) { return !v.row.difficulty; }).length + '</b> not set</p>' +
    '<details class="mb-3 text-xs"><summary class="cursor-pointer text-gray-700 font-semibold">Feedback codes (' + J277.FEEDBACK_CODES.length + ')</summary><table class="mt-1 w-full">' +
      J277.FEEDBACK_CODES.map(function (c) { return '<tr class="border-t"><td class="p-1 font-bold">' + gEsc(c.id) + '</td><td class="p-1">' + gEsc(c.text) + '</td><td class="p-1 text-gray-500">' + gEsc(c.exam ? 'Exam technique' : c.topics.join(', ')) + '</td></tr>'; }).join('') + '</table></details>' +
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
  var types = opts.types || (opts.includeShort === false ? ['mcq'] : ['mcq', 'short']);
  // Live quizzes show at most 4 answer buttons.
  var all = gcseQuestionsForTopics(topics, types, opts.difficulty || '').filter(function (v) { return v.row.type !== 'mcq' || v.row.options.length <= 4; });
  var pool;
  if (opts.ids) {            // teacher picked the questions: keep their order
    var byId = {}; all.forEach(function (v) { byId[v.row.id] = v; });
    pool = opts.ids.map(function (id) { return byId[id]; }).filter(Boolean);
  } else {
    var avoid = opts.avoid || {};
    var fresh = all.filter(function (v) { return !avoid[v.row.id]; });
    if (fresh.length < count) fresh = fresh.concat(all.filter(function (v) { return avoid[v.row.id]; }));
    pool = fresh.slice().sort(function () { return Math.random() - 0.5; }).slice(0, count);
  }
  return pool.map(function (v) {
    var r = v.row;
    if (r.type === 'mcq') return { type: 'mcq', q: r.question + ' (' + r.marks + ' mark' + (r.marks === 1 ? '' : 's') + ')', options: r.options.slice(0, 4), answer: r.answerIndex, duration: opts.seconds || 45, gcseQid: r.id, gcseTopics: r.topics, gcseCodes: r.codes || [] };
    return { type: 'text_input', q: r.question + ' (' + r.marks + ' mark' + (r.marks === 1 ? '' : 's') + ')', answer: r.markScheme, gcseRules: r.rules, gcseMarks: r.marks, gcseQid: r.id, gcseTopics: r.topics,
      gcseCodes: r.codes || [], gcseCommand: r.command || '', duration: Math.max(opts.seconds || 90, 60) };
  });
}
async function gcseStartLiveQuiz(className, topics, qs, force) {
  var labels = topics.slice(0, 3).map(function (c) { return (J277.get(c) || {}).title || c; }).join(', ') + (topics.length > 3 ? '…' : '');
  quiz.className = className;
  var lesson = { meta: { id: 'gcse-topics' }, data: { title: 'GCSE topic quiz: ' + labels } };
  var adminModal = gEl('modal-admin'); if (adminModal) adminModal.classList.add('hidden');
  await createHostedQuizLobby(lesson, qs, !!force);
}

function gcseHostTypes() {
  var v = (gEl('quiz-gcse-type') || {}).value || 'all';
  return v === 'mcq' ? ['mcq'] : v === 'short' ? ['short'] : ['mcq', 'short'];
}
function gcseHostCounts(types, difficulty) {
  var counts = {};
  gcseBankUsable().forEach(function (v) {
    var r = v.row;
    if (difficulty && r.difficulty && r.difficulty !== difficulty) return;
    if (types.indexOf(r.type) === -1) return;
    if (r.type === 'mcq' && r.options.length > 4) return;
    r.topics.forEach(function (tc) { J277.expand(tc).forEach(function (s) { counts[s] = (counts[s] || 0) + 1; }); });
  });
  return counts;
}
function gcseRenderHostTopics() {
  var box = gEl('quiz-gcse-topics'); if (!box) return;
  var prev = {};
  document.querySelectorAll('.gcse-host-topic:checked').forEach(function (cb) { prev[cb.dataset.code] = true; });
  var types = gcseHostTypes();
  var difficulty = (gEl('quiz-gcse-difficulty') || {}).value || '';
  box.innerHTML = gcseTopicPickerHtml('gcse-host', prev, gcseHostCounts(types, difficulty));
  gcseBindTopicPicker('gcse-host');
  var update = function () {
    var picked = gcsePickedTopics('gcse-host');
    var n = picked.length ? gcseQuestionsForTopics(picked, types, difficulty).filter(function (v) { return v.row.type !== 'mcq' || v.row.options.length <= 4; }).length : 0;
    gEl('quiz-gcse-summary').textContent = picked.length ? picked.length + ' topic' + (picked.length === 1 ? '' : 's') + ' ticked · ' + n + ' matching question' + (n === 1 ? '' : 's') + ' in the bank' : 'Tick at least one topic.';
    if (typeof gcseHostRenderPick === 'function') gcseHostRenderPick();
  };
  box.addEventListener('change', update);
  update();
}
async function gcseStartFromHostSetup() {
  var picked = gcsePickedTopics('gcse-host');
  if (!picked.length) { alert('Tick at least one GCSE topic.'); return; }
  var opts = { types: gcseHostTypes(), seconds: Number(gEl('quiz-gcse-time').value) || 60, difficulty: (gEl('quiz-gcse-difficulty') || {}).value || '' };
  var chosen = typeof gcseHostChosenIds === 'function' ? gcseHostChosenIds() : null;
  if (chosen) opts.ids = chosen;
  if (chosen && !chosen.length) { alert('Tick at least one question, or switch to Random.'); return; }
  var qs = gcseBuildLiveQuizQuestions(picked, chosen ? chosen.length : (Number(gEl('quiz-gcse-count').value) || 10), opts);
  if (!qs.length) { alert('There are no bank questions for those topics yet.'); return; }
  gEl('modal-quiz-setup').classList.add('hidden');
  if (typeof gcseHostRemember === 'function') gcseHostRemember(quiz.className, picked, opts, qs);
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
  gEl('quiz-gcse-type').onchange = gcseRenderHostTopics;
  if (gEl('quiz-gcse-difficulty')) gEl('quiz-gcse-difficulty').onchange = gcseRenderHostTopics;
  var originalStart = start.onclick;
  start.onclick = function (e) {
    if (gcse.hostSource === 'gcse') return gcseStartFromHostSetup();
    return originalStart.call(this, e);
  };
  if (typeof openQuizSetup === 'function') {
    var originalOpen = openQuizSetup;
    openQuizSetup = function (className) {
      var r = originalOpen.apply(this, arguments);
      setSource(gcse.hostSource || 'lesson');
      gcseBtn.classList.add('hidden');
      if (typeof classSettings === 'function') {
        classSettings(className).then(function (s) {
          var isGcse = s && s.type === 'gcse';
          gcseBtn.classList.toggle('hidden', !isGcse);
          if (!isGcse && gcse.hostSource === 'gcse') setSource('lesson');
        }).catch(function () {});
      }
      return r;
    };
  }
  setSource('lesson');
})();

// ── Test builder: End of unit test / Mock (online or paper) ─────────────
var GCSE_QTYPES = [
  { k: 'mcq', label: 'Multiple choice', match: function (r) { return r.type === 'mcq'; } },
  { k: 'w1', label: '1-mark written', match: function (r) { return r.type === 'short' && r.marks === 1; } },
  { k: 'w2', label: '2-mark written', match: function (r) { return r.type === 'short' && r.marks >= 2; } },
  { k: 'long', label: 'Longer written (3+ marks)', match: function (r) { return r.type === 'long'; } },
  { k: 'paper', label: 'Paper-only (diagrams, trace tables)', match: function (r) { return r.type === 'paper'; }, paperOnly: true }
];
function gcseUnits() { return J277.list.filter(function (n) { return n.level === 1; }); }

async function gcseOpenBuilder(kind) {
  if (!gcse.className) { gcseStatus('Choose a class first.', true); return; }
  var covered = [];
  try { covered = await classCoveredTopics(gcse.className); } catch (e) {}
  gcse.builder = {
    kind: kind, unit: '', paper: '', mode: 'online', types: { mcq: true, w1: true, w2: true, long: true, paper: false },
    marks: kind === 'eou' ? 30 : 60, difficulty: '', includeStarter: true, topics: {}, items: [], covered: covered
  };
  gcseRenderBuilder();
}
function gcseBuilderPool() {
  var b = gcse.builder;
  return gcseBankUsable().filter(function (v) {
    var r = v.row;
    if (!b.includeStarter && r.starter) return false;
    if (b.difficulty && r.difficulty && r.difficulty !== b.difficulty) return false;
    if (b.mode === 'online' && r.type === 'paper') return false;
    return GCSE_QTYPES.some(function (t) { return b.types[t.k] && t.match(r); });
  });
}
function gcseBuilderTopics() {
  var b = gcse.builder;
  if (b.kind === 'eou') return b.unit ? J277.subTopics().filter(function (s) { return s.code.indexOf(b.unit + '.') === 0; }).map(function (s) { return s.code; }) : [];
  return Object.keys(b.topics).filter(function (k) { return b.topics[k]; });
}
function gcseBuilderTotal() { return gcse.builder.items.reduce(function (s, it) { return s + (Number(it.marks) || 0); }, 0); }

function gcseRenderBuilder() {
  var b = gcse.builder, box = gEl('gcse-test-body');
  if (!box || !b) return;
  var isEou = b.kind === 'eou';
  var h = '<div class="border border-gray-200 rounded-lg p-4 space-y-4"><div class="flex items-center gap-3"><button type="button" id="gcse-b-cancel" class="text-sm text-blue-700 hover:underline">← All tests</button>' +
    '<h3 class="text-lg font-bold text-gray-800">' + (isEou ? 'New end of unit test' : 'New mock') + ' – ' + gEsc(gcse.className) + '</h3></div>';
  // 1. What
  h += '<div><div class="text-sm font-semibold mb-1">1. What is it on?</div>';
  if (isEou) {
    h += '<select id="gcse-b-unit" class="border border-gray-300 rounded px-2 py-1.5 text-sm"><option value="">— choose unit —</option>' +
      gcseUnits().map(function (u) { return '<option value="' + gEsc(u.code) + '"' + (b.unit === u.code ? ' selected' : '') + '>' + gEsc(u.code + ' ' + u.title) + '</option>'; }).join('') + '</select>';
  } else {
    h += '<div class="flex flex-wrap gap-2 items-center mb-2"><select id="gcse-b-paper" class="border border-gray-300 rounded px-2 py-1.5 text-sm"><option value="">Paper 1 and Paper 2</option><option value="1"' + (b.paper === '1' ? ' selected' : '') + '>Paper 1 only</option><option value="2"' + (b.paper === '2' ? ' selected' : '') + '>Paper 2 only</option></select>' +
      '<button type="button" id="gcse-b-covered" class="px-3 py-1.5 rounded border border-gray-300 text-sm"' + (b.covered.length ? '' : ' disabled title="Set content covered on the Class page first"') + '>Everything covered so far (' + b.covered.length + ' topics)</button>' +
      '<span class="text-xs text-gray-500">or tick topics:</span></div>' + gcseTopicPickerHtml('gcse-b', b.topics);
  }
  h += '</div>';
  // 2. How
  h += '<div class="flex flex-wrap gap-6"><div><div class="text-sm font-semibold mb-1">2. How will they sit it?</div>' +
    ['online:On the website', 'paper:On paper'].map(function (o) { var k = o.split(':'); return '<label class="mr-3 text-sm"><input type="radio" name="gcse-b-mode" value="' + k[0] + '"' + (b.mode === k[0] ? ' checked' : '') + '> ' + k[1] + '</label>'; }).join('') + '</div>' +
    '<div><div class="text-sm font-semibold mb-1">3. Question types</div><div class="flex flex-wrap gap-x-3 gap-y-1">' + GCSE_QTYPES.filter(function (t) { return !(t.paperOnly && b.mode === 'online'); }).map(function (t) {
      return '<label class="text-sm"><input type="checkbox" class="gcse-b-type" data-k="' + t.k + '"' + (b.types[t.k] ? ' checked' : '') + '> ' + t.label + '</label>';
    }).join('') + '</div></div>' +
    '<label class="text-sm font-semibold">Total marks<input id="gcse-b-marks" type="number" min="5" max="200" value="' + b.marks + '" class="block w-24 border border-gray-300 rounded px-2 py-1 text-sm font-normal"></label>' +
    (b.mode === 'online' ? '<label class="text-sm font-semibold">Time limit (min)<input id="gcse-b-time" type="number" min="0" max="240" value="' + (b.timeLimit != null ? b.timeLimit : Math.round(b.marks * 1.1)) + '" class="block w-24 border border-gray-300 rounded px-2 py-1 text-sm font-normal" title="0 = no limit. Students with extra time get 25% more."></label>' : '') +
    '<label class="text-sm font-semibold">Difficulty<select id="gcse-b-difficulty" class="block border border-gray-300 rounded px-2 py-1 text-sm font-normal"><option value="">Any</option><option value="F"' + (b.difficulty === 'F' ? ' selected' : '') + '>Foundation-style</option><option value="H"' + (b.difficulty === 'H' ? ' selected' : '') + '>Higher-style</option></select></label></div>' +
    '<label class="text-xs text-gray-600 flex items-center gap-1.5"><input type="checkbox" id="gcse-b-starter"' + (b.includeStarter ? ' checked' : '') + '> Use the built-in J277 exam-style starter questions as well as your past papers</label>' +
    '<div><button type="button" id="gcse-b-generate" class="jhncc-primary px-4 py-1.5 rounded text-sm font-semibold">' + (b.items.length ? 'Regenerate' : 'Generate questions') + '</button> <span id="gcse-b-msg" class="text-xs text-red-600"></span></div>';
  // 4. Questions
  if (b.items.length) h += gcseBuilderListHtml();
  h += '</div>';
  box.innerHTML = h;
  gcseBindBuilder();
}

function gcseBuilderListHtml() {
  var b = gcse.builder;
  var total = gcseBuilderTotal();
  var cov = {};
  b.items.forEach(function (it) { (it.topics || []).forEach(function (t) { cov[t] = (cov[t] || 0) + (Number(it.marks) || 0); }); });
  var h = '<div class="border-t pt-3"><div class="flex flex-wrap items-center justify-between gap-2 mb-2"><div class="text-sm font-semibold">4. Check and customise the questions</div>' +
    '<div class="text-sm">Total: <b id="gcse-b-total">' + total + '</b> / ' + b.marks + ' marks · ' + b.items.length + ' questions</div></div>' +
    '<div class="flex flex-wrap gap-1 mb-2">' + Object.keys(cov).sort().map(function (t) { return '<span class="text-[11px] px-1.5 py-0.5 rounded bg-gray-100" title="' + gEsc(J277.label(t)) + '">' + gEsc(t) + ' · ' + cov[t] + 'm</span>'; }).join('') + '</div><div class="space-y-2">';
  b.items.forEach(function (it, i) {
    h += '<div class="border border-gray-200 rounded p-2 text-sm"><div class="flex items-start gap-2"><b class="w-8 shrink-0">Q' + (i + 1) + '</b>' +
      '<textarea class="gcse-b-text flex-1 border border-gray-200 rounded px-2 py-1 text-sm" rows="2" data-i="' + i + '">' + gEsc(it.text) + '</textarea>' +
      '<label class="text-xs text-gray-500 shrink-0">marks<input type="number" min="1" max="20" class="gcse-b-qmarks block w-14 border border-gray-300 rounded px-1 py-0.5 text-sm" data-i="' + i + '" value="' + it.marks + '"></label></div>' +
      (it.type === 'mcq' ? '<div class="ml-10 text-xs text-gray-600">' + it.options.map(function (o, k) { return (k === it.answerIndex ? '<b>' : '') + String.fromCharCode(65 + k) + '. ' + gEsc(o) + (k === it.answerIndex ? ' ✓</b>' : ''); }).join(' · ') + '</div>' : '') +
      '<div class="ml-10 mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500"><span>' + gEsc(J277.label(it.topics[0])) + '</span><span>· ' + gEsc(it.typeLabel) + '</span><span>· ' + gEsc(it.source) + '</span>' +
      '<span class="ml-auto flex gap-1"><button type="button" class="gcse-b-up px-1.5 rounded border border-gray-300" data-i="' + i + '" title="Move up">↑</button>' +
      '<button type="button" class="gcse-b-down px-1.5 rounded border border-gray-300" data-i="' + i + '" title="Move down">↓</button>' +
      '<button type="button" class="gcse-b-swap px-1.5 rounded border border-gray-300" data-i="' + i + '" title="Swap for another question on this topic">Swap</button>' +
      '<button type="button" class="gcse-b-remove px-1.5 rounded border border-red-300 text-red-600" data-i="' + i + '">Remove</button></span></div></div>';
  });
  h += '</div><div class="flex flex-wrap items-center gap-2 mt-2"><select id="gcse-b-add-topic" class="border border-gray-300 rounded px-2 py-1 text-sm"><option value="">+ Add a question on…</option>' +
    gcseBuilderTopics().map(function (t) { return '<option value="' + gEsc(t) + '">' + gEsc(J277.label(t)) + '</option>'; }).join('') + '</select><div id="gcse-b-add-list" class="w-full"></div></div>' +
    '<div class="flex flex-wrap items-end gap-2 mt-4 border-t pt-3"><label class="text-xs text-gray-600">Title<input id="gcse-b-title" class="block w-80 border border-gray-300 rounded px-2 py-1.5 text-sm" value="' + gEsc(b.title || gcseBuilderDefaultTitle()) + '"></label>' +
    '<button type="button" id="gcse-b-save" class="jhncc-primary px-4 py-1.5 rounded text-sm font-semibold">Save test</button>' +
    '<button type="button" id="gcse-b-print" class="px-3 py-1.5 rounded border border-gray-300 text-sm">Print paper</button>' +
    '<button type="button" id="gcse-b-scheme" class="px-3 py-1.5 rounded border border-gray-300 text-sm">Print mark scheme</button></div></div>';
  return h;
}
function gcseBuilderDefaultTitle() {
  var b = gcse.builder;
  if (b.kind === 'eou') { var u = J277.get(b.unit); return (u ? 'Unit ' + u.code + ' ' + u.title : 'Unit') + ' – End of unit test'; }
  return 'Mock' + (b.paper ? ' – Paper ' + b.paper : ' – Paper 1 & 2') + ' – ' + new Date().toLocaleDateString('en-GB');
}
function gcseBuilderItem(v) {
  var r = v.row;
  var t = GCSE_QTYPES.filter(function (x) { return x.match(r); })[0];
  return { bankId: r.id, type: r.type, typeLabel: t ? t.label : r.type, text: r.question, marks: r.marks, topics: r.topics.slice(), command: r.command || '',
    options: r.options.slice(), answerIndex: r.answerIndex, rules: r.rules || '', markScheme: r.markScheme || '', codes: (r.codes || []).slice(),
    source: r.source || ('reworded from ' + r.rewordedFrom), family: (r.rewordedFrom || r.id).toLowerCase(), difficulty: r.difficulty || '' };
}
function gcseBuilderGenerate() {
  var b = gcse.builder;
  var topics = gcseBuilderTopics();
  var msg = gEl('gcse-b-msg');
  if (!topics.length) { msg.textContent = b.kind === 'eou' ? 'Choose a unit.' : 'Tick topics or use "Everything covered so far".'; return; }
  var res = gcseGenerate(gcseBuilderPool(), topics, b.marks, b.kind === 'mock' ? b.paper : '', gcseCoverage(gcse.className), {});
  if (!res.questions.length) { msg.textContent = 'No bank questions match – tick more question types, or the starter questions.'; return; }
  b.items = res.questions.map(gcseBuilderItem);
  b.title = '';
  gcseRenderBuilder();
  if (res.shortBy) gEl('gcse-b-msg').textContent = 'Only ' + res.total + ' marks available for these settings (' + res.shortBy + ' short). Add more past-paper questions or tick more types.';
}
function gcseBuilderReadEdits() {
  var b = gcse.builder;
  document.querySelectorAll('.gcse-b-text').forEach(function (el) { b.items[Number(el.dataset.i)].text = el.value; });
  document.querySelectorAll('.gcse-b-qmarks').forEach(function (el) { var n = Number(el.value); if (n > 0) b.items[Number(el.dataset.i)].marks = n; });
  var title = gEl('gcse-b-title'); if (title) b.title = title.value;
}
function gcseBindBuilder() {
  var b = gcse.builder;
  var rerender = function () { gcseBuilderReadEdits(); gcseRenderBuilder(); };
  gEl('gcse-b-cancel').onclick = function () { gcse.builder = null; gcseRenderTest(); };
  var unit = gEl('gcse-b-unit'); if (unit) unit.onchange = function () { b.unit = this.value; b.title = ''; };
  var paper = gEl('gcse-b-paper'); if (paper) paper.onchange = function () { b.paper = this.value; b.title = ''; };
  if (gEl('gcse-b-covered')) gEl('gcse-b-covered').onclick = function () {
    b.topics = {};
    b.covered.forEach(function (t) { if (!b.paper || GcseCore.paperOf(t) === b.paper) b.topics[t] = true; });
    rerender();
  };
  if (document.querySelector('.gcse-b-topic')) {
    gcseBindTopicPicker('gcse-b');
    document.querySelectorAll('.gcse-b-topic').forEach(function (cb) {
      cb.addEventListener('change', function () { b.topics = {}; gcsePickedTopics('gcse-b').forEach(function (t) { b.topics[t] = true; }); });
    });
  }
  document.querySelectorAll('input[name="gcse-b-mode"]').forEach(function (r) { r.onchange = function () { b.mode = this.value; if (b.mode === 'online') b.types.paper = false; rerender(); }; });
  document.querySelectorAll('.gcse-b-type').forEach(function (cb) { cb.onchange = function () { b.types[cb.dataset.k] = cb.checked; }; });
  gEl('gcse-b-marks').onchange = function () { b.marks = Number(this.value) || b.marks; };
  if (gEl('gcse-b-time')) gEl('gcse-b-time').onchange = function () { b.timeLimit = Math.max(0, Number(this.value) || 0); };
  gEl('gcse-b-difficulty').onchange = function () { b.difficulty = this.value; };
  gEl('gcse-b-starter').onchange = function () { b.includeStarter = this.checked; };
  gEl('gcse-b-generate').onclick = gcseBuilderGenerate;
  if (!b.items.length) return;
  document.querySelectorAll('.gcse-b-text, .gcse-b-qmarks').forEach(function (el) {
    el.addEventListener('input', function () { gcseBuilderReadEdits(); var t = gEl('gcse-b-total'); if (t) t.textContent = gcseBuilderTotal(); });
  });
  var move = function (i, d) { var j = i + d; if (j < 0 || j >= b.items.length) return; var x = b.items[i]; b.items[i] = b.items[j]; b.items[j] = x; };
  document.querySelectorAll('.gcse-b-up').forEach(function (el) { el.onclick = function () { gcseBuilderReadEdits(); move(Number(el.dataset.i), -1); gcseRenderBuilder(); }; });
  document.querySelectorAll('.gcse-b-down').forEach(function (el) { el.onclick = function () { gcseBuilderReadEdits(); move(Number(el.dataset.i), 1); gcseRenderBuilder(); }; });
  document.querySelectorAll('.gcse-b-remove').forEach(function (el) { el.onclick = function () { gcseBuilderReadEdits(); b.items.splice(Number(el.dataset.i), 1); gcseRenderBuilder(); }; });
  document.querySelectorAll('.gcse-b-swap').forEach(function (el) {
    el.onclick = function () {
      gcseBuilderReadEdits();
      var i = Number(el.dataset.i), cur = b.items[i];
      var used = {}; b.items.forEach(function (it) { used[it.family] = true; });
      var options = gcseBuilderPool().filter(function (v) { return v.row.topics[0] === cur.topics[0] && !used[(v.row.rewordedFrom || v.row.id).toLowerCase()]; });
      if (!options.length) { gEl('gcse-b-msg').textContent = 'No other questions on ' + J277.label(cur.topics[0]) + ' – try "+ Add a question on…".'; return; }
      b.items[i] = gcseBuilderItem(options[Math.floor(Math.random() * options.length)]);
      gcseRenderBuilder();
    };
  });
  gEl('gcse-b-add-topic').onchange = function () {
    var topic = this.value, list = gEl('gcse-b-add-list');
    if (!topic) { list.innerHTML = ''; return; }
    var used = {}; b.items.forEach(function (it) { used[it.family] = true; });
    var options = gcseBuilderPool().filter(function (v) { return v.row.topics[0] === topic && !used[(v.row.rewordedFrom || v.row.id).toLowerCase()]; });
    list.innerHTML = options.length ? options.map(function (v, k) {
      return '<div class="flex items-center gap-2 border-t py-1 text-xs"><button type="button" class="gcse-b-add px-2 py-0.5 rounded border border-gray-300" data-k="' + k + '">Add</button><span>' + gEsc(v.row.question) + '</span><span class="text-gray-500">[' + v.row.marks + ']</span></div>';
    }).join('') : '<p class="text-xs text-gray-500">No more questions on this topic.</p>';
    list.querySelectorAll('.gcse-b-add').forEach(function (btn) {
      btn.onclick = function () { gcseBuilderReadEdits(); b.items.push(gcseBuilderItem(options[Number(btn.dataset.k)])); gcseRenderBuilder(); };
    });
  };
  gEl('gcse-b-print').onclick = function () { gcseBuilderReadEdits(); gcsePrintPaper(gcseBuilderToTest(), false); };
  gEl('gcse-b-scheme').onclick = function () { gcseBuilderReadEdits(); gcsePrintPaper(gcseBuilderToTest(), true); };
  gEl('gcse-b-save').onclick = gcseBuilderSave;
}
function gcseBuilderToTest() {
  var b = gcse.builder;
  var total = gcseBuilderTotal();
  return {
    title: (b.title || gcseBuilderDefaultTitle()).trim(), className: gcse.className, createdAt: Date.now(), kind: b.kind, unit: b.unit || null,
    paper: b.kind === 'mock' ? (b.paper || 'both') : null, mode: b.mode, paperTotal: total, showGrades: false,
    timeLimit: b.mode === 'online' ? (b.timeLimit != null ? b.timeLimit : Math.round(b.marks * 1.1)) || null : null,
    boundaries: GcseCore.defaultBoundaries(total),
    questions: b.items.map(function (it, i) {
      return { id: 'Q' + (i + 1), marks: Number(it.marks) || 1, topics: it.topics, command: it.command, bankId: it.bankId, type: it.type, text: it.text,
        options: it.options, answerIndex: it.answerIndex == null ? null : it.answerIndex, rules: it.rules, markScheme: it.markScheme, codes: it.codes, source: it.source };
    })
  };
}
async function gcseBuilderSave() {
  gcseBuilderReadEdits();
  var t = gcseBuilderToTest();
  if (!t.questions.length) return;
  var id = 'gcse-' + Date.now().toString(36);
  try {
    await state.db.ref('gcse/tests/' + id).set(t);
    gcse.tests[id] = t; gcse.testId = id; gcse.viewTab = 'grades'; gcse.builder = null;
    await gcseRenderTest();
    gcseStatus('Saved "' + t.title + '" (' + gcseTestTotal(t) + ' marks).' + (t.mode === 'paper' ? ' Print it from the ⋯ menu, then download the marks spreadsheet.' : ''));
  } catch (e) { gcseStatus(gDbError(e), true); }
}
// Print a saved/built test – the paper, or its mark scheme.
function gcsePrintPaper(t, scheme) {
  var qs = t.questions || [];
  var body = '<h1>' + gEsc(t.title) + (scheme ? ' – Mark scheme' : '') + '</h1><div class="muted">' + gEsc(t.className || '') + ' · ' + gcseTestTotal(t) + ' marks</div>' +
    (scheme ? '' : '<p>Name: ______________________________</p>') +
    qs.map(function (q, i) {
      if (scheme) {
        return '<div class="q"><b>' + gEsc(q.id) + '</b> [' + q.marks + '] <span class="muted">' + gEsc(J277.label((q.topics || [])[0])) + (q.source ? ' · ' + gEsc(q.source) : '') + '</span><br>' +
          (q.type === 'mcq' && q.options ? 'Answer: ' + String.fromCharCode(65 + q.answerIndex) + '. ' + gEsc(q.options[q.answerIndex]) : gEsc(q.markScheme || '').replace(/\n/g, '<br>')) + '</div>';
      }
      var lines = new Array(Math.max(2, (q.marks || 1) * 2) + 1).join('<div class="lines"></div>');
      return '<div class="q"><b>' + gEsc(q.id) + '.</b> ' + gEsc(q.text || '').replace(/\n/g, '<br>') + ' <b>[' + q.marks + ']</b>' +
        (q.type === 'mcq' && q.options ? '<ol type="A">' + q.options.map(function (o) { return '<li>' + gEsc(o) + '</li>'; }).join('') + '</ol>' : lines) + '</div>';
    }).join('');
  gPrint(t.title + (scheme ? ' – Mark scheme' : ''), body);
}

// ── Test generator (past-paper questions only) ──────────────────
function gcseGeneratorPool() {
  var includeStarter = gcse.genIncludeStarter === true;
  var difficulty = gcse.genDifficulty || '';
  return gcseBankUsable().filter(function (v) {
    if (difficulty && v.row.difficulty && v.row.difficulty !== difficulty) return false;
    return includeStarter || !v.row.starter;
  });
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
    '<label class="text-xs text-gray-600">Difficulty<select id="gcse-gen-difficulty" class="block border border-gray-300 rounded px-2 py-1 text-sm"><option value="">Any</option><option value="F"' + (gcse.genDifficulty === 'F' ? ' selected' : '') + '>Foundation-style</option><option value="H"' + (gcse.genDifficulty === 'H' ? ' selected' : '') + '>Higher-style</option></select></label>' +
    '<label class="text-xs text-gray-600">Title<input id="gcse-gen-title" class="block border border-gray-300 rounded px-2 py-1 text-sm" placeholder="Y10 Test – Systems architecture"></label></div>' +
    '<div class="text-xs text-gray-600 mb-1">Tick what they have learnt so far:</div>' + gcseTopicPickerHtml('gcse-gen', {}, counts, coverage) +
    '<button type="button" id="gcse-gen-go" class="jhncc-primary mt-3 px-4 py-1.5 rounded text-sm font-semibold">Generate test</button></div><div id="gcse-gen-out"></div></div>';
  gcseBindTopicPicker('gcse-gen');
  gEl('gcse-gen-starter').onchange = function () { gcse.genIncludeStarter = this.checked; gcseRenderGenerateView(); };
  gEl('gcse-gen-difficulty').onchange = function () { gcse.genDifficulty = this.value; gcseRenderGenerateView(); };
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
  gcse.profileOpts = gcse.profileOpts || { quizzes: false, practice: false, showHidden: false };
  try {
    gcse.profileData = await gcseLoadProfileData(code);
    gcseRenderProfile();
  } catch (e) {
    body.innerHTML = '<p class="text-red-600 text-sm">' + gEsc(gDbError(e)) + '</p>';
  }
}

// Everything a profile needs, loaded once (toggles re-render without reloading).
async function gcseLoadProfileData(code) {
  var snaps = await Promise.all([
    state.db.ref('codeIndex/' + code.toLowerCase()).get(),
    state.db.ref('progress/' + code).get(),
    state.db.ref('accessLog/' + code).get(),
    state.db.ref('gcse/targets/' + code).get().catch(function () { return null; }),
    gcseLoadTests().catch(function () { return {}; })
  ]);
  var idx = snaps[0].val() || {}, prog = snaps[1].val() || {}, access = snaps[2].val() || {};
  var className = idx.className || '';
  var settings = {}, flags = {}, classData = null;
  if (className) {
    try { settings = await classSettings(className); } catch (e) {}
    try { flags = await loadAssessmentFlags(className); } catch (e) {}
    try { classData = await classAssessmentData(className); } catch (e) {}
  }
  var target = snaps[3] && snaps[3].exists() && snaps[3].val() ? Number(snaps[3].val().grade) : null;
  var tests = gcse.tests || {};
  var testIds = Object.keys(tests);
  var resSnaps = await Promise.all(testIds.map(function (id) { return state.db.ref('gcse/results/' + id + '/' + code).get().catch(function () { return null; }); }));
  var isGcse = settings.type === 'gcse';
  // DP by class ranking (as in AP Results) when no DP is stored.
  var rankDp = function (id, score) {
    if (!classData || score == null || typeof definitePurposeGrades !== 'function') return null;
    var scores = classData.codes.map(function (c) { var r = (classData.recs[c] || {})[id]; return r && !resultNotSubmitted(r) ? Number(r.score) || 0 : null; })
      .filter(function (v) { return v != null; }).sort(function (x, y) { return y - x; });
    if (!scores.length) return null;
    var grades = definitePurposeGrades(scores);
    var i = scores.indexOf(Number(score));
    return i === -1 ? null : grades[i];
  };
  var history = [];
  testIds.forEach(function (id, i) {
    var sn = resSnaps[i]; if (!sn || !sn.exists()) return;
    var r = sn.val(), t = tests[id];
    var base = { kind: 'paper', id: id, title: t.title, type: t.kind === 'eou' ? 'End of unit' : t.kind === 'mock' ? 'Mock' : 'GCSE test', at: r.submittedAt || r.importedAt || t.createdAt,
      practice: assessmentIsPractice(id, flags), archived: assessmentIsArchived(id, flags) };
    if (r.absent) { history.push(Object.assign(base, { absent: true })); return; }
    var dp = r.dp != null ? r.dp : (r.dpSuggested != null ? r.dpSuggested : rankDp(id, r.score));
    history.push(Object.assign(base, { score: r.score, max: gcseTestTotal(t), pct: gPct(r.score, gcseTestTotal(t)), grade: GcseCore.gradeFor(r.score, gcseBoundaries(t)),
      dp: dp, marks: r.marks || {}, test: t }));
  });
  var aps = prog.assessments || {};
  Object.keys(aps).forEach(function (id) {
    var a0 = aps[id];
    if (!a0 || a0.type === 'paper') return;
    var a = a0;
    if (a0.attempts) Object.keys(a0.attempts).forEach(function (k) { var x = a0.attempts[k]; if (x && x.completedAt && (!a.completedAt || x.completedAt > a.completedAt)) a = x; });
    if (!a.completedAt || a.pending || a.type === 'gcse-online') return;
    var target2 = (ASSESSMENTS[id] && ASSESSMENTS[id].legacyOf) || id;
    var est = isGcse && a.maxScore ? GcseCore.gradeFor(a.score, GcseCore.defaultBoundaries(a.maxScore)) : null;
    history.push({ kind: 'ap', id: target2, title: (ASSESSMENTS[target2] && ASSESSMENTS[target2].title) || a.title || id, type: 'AP', at: a.completedAt, score: a.score, max: a.maxScore,
      pct: gPct(a.score, a.maxScore), grade: est, gradeEst: est != null, dp: rankDp(target2, a.score), notSubmitted: resultNotSubmitted(a),
      practice: assessmentIsPractice(target2, flags), archived: assessmentIsArchived(target2, flags) });
  });
  history.sort(function (x, y) { return x.at - y.at; });
  var steps = 0, ms = 0;
  Object.keys(prog).forEach(function (k) {
    if (['assessments', 'gcseQuiz', 'gcseReview', 'gcseMisconceptions', 'forcedAPAssignment', 'plc', 'dirt'].indexOf(k) !== -1) return;
    var lesson = prog[k]; if (!lesson || typeof lesson !== 'object') return;
    Object.keys(lesson).forEach(function (st) { var x = lesson[st]; if (x && x.completed) steps++; if (x && x.totalMs) ms += x.totalMs; });
  });
  var covered = Object.keys(settings.covered || {}).map(gFromTopicKey);
  return { code: code, className: className, isGcse: isGcse, settings: settings, target: target, access: access, history: history, quiz: prog.gcseQuiz || {},
    misconceptions: prog.gcseMisconceptions || {}, plc: prog.plc || {}, dirt: prog.dirt || {}, steps: steps, ms: ms, covered: covered };
}

// Topic scores from official assessments, plus (optionally) live quizzes / practice.
function gcseProfileTopicAgg(D, opts) {
  var agg = {};
  var add = function (tc, a, p, src) { var A = agg[tc] || (agg[tc] = { a: 0, p: 0, src: {} }); A.a += a; A.p += p; A.src[src] = true; };
  D.history.forEach(function (x) {
    if (x.kind !== 'paper' || x.absent || x.practice) return;
    (x.test.questions || []).forEach(function (q) {
      var v = x.marks[q.id];
      (q.topics || []).forEach(function (tc) { add(tc, v == null ? 0 : Number(v), q.marks, 'test'); });
    });
  });
  Object.keys(D.quiz).forEach(function (k) {
    var tc = gFromTopicKey(k), st = D.quiz[k] || {};
    if (st.src) {
      if (opts.quizzes && st.src.live) add(tc, st.src.live.c || 0, st.src.live.a || 0, 'quiz');
      if (opts.practice) ['practice', 'self'].forEach(function (s2) { if (st.src[s2]) add(tc, st.src[s2].c || 0, st.src[s2].a || 0, 'practice'); });
    } else if (opts.quizzes) {
      add(tc, st.correct || 0, st.attempted || 0, 'quiz');   // older records: source not known
    }
  });
  return agg;
}
// ↑ / → / ↓ from the last 3 official assessments (last vs the average of the ones before).
function gcseTrend(history) {
  var pts = history.filter(function (x) { return !x.absent && !x.practice && !x.archived && !x.notSubmitted && x.pct != null; }).slice(-3);
  if (pts.length < 2) return { arrow: '–', label: 'Not enough assessments yet', cls: 'text-gray-400' };
  var last = pts[pts.length - 1].pct;
  var prev = pts.slice(0, -1).reduce(function (s2, x) { return s2 + x.pct; }, 0) / (pts.length - 1);
  var diff = Math.round(last - prev);
  if (diff >= 5) return { arrow: '↑', label: 'Improving (+' + diff + '%)', cls: 'text-green-700' };
  if (diff <= -5) return { arrow: '↓', label: 'Dropping (' + diff + '%)', cls: 'text-red-700' };
  return { arrow: '→', label: 'Steady', cls: 'text-gray-700' };
}

function gcseRenderProfile() {
  var D = gcse.profileData, o = gcse.profileOpts, body = gEl('gcse-profile-body');
  if (!D || !body) return;
  var official = D.history.filter(function (x) { return x.kind === 'paper' && !x.absent && !x.practice; });
  var working = gcseWorkingGradeFromHistory(official);
  var latest = D.history.filter(function (x) { return !x.absent && !x.practice && x.dp != null; }).slice(-1)[0];
  var trend = gcseTrend(D.history);
  var gap = working != null && D.target != null ? working - D.target : null;
  var card = function (v, l, cls) { return '<div class="rounded-lg border border-gray-200 p-3 text-center"><div class="text-2xl font-bold ' + (cls || '') + '">' + v + '</div><div class="text-xs text-gray-500">' + l + '</div></div>'; };
  var h = '<div class="text-sm text-gray-500 mb-3">' + gEsc(D.code) + ' · ' + gEsc(D.className || 'No class') + '</div>' +
    '<div class="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">' +
      card(GcseCore.gradeLabel(working), 'Working grade') + card(GcseCore.gradeLabel(D.target), 'Target grade') +
      card(gap == null ? '–' : (gap >= 0 ? '▲ ' + (gap > 0 ? '+' + gap : '0') : '▼ ' + gap), 'Gap', gap == null ? '' : gap >= 0 ? 'text-green-700' : 'text-red-700') +
      card(latest ? latest.dp : '–', 'Latest DP (1–4)') + card(trend.arrow, trend.label, trend.cls) +
      card(D.access.lastSeen ? new Date(D.access.lastSeen).toLocaleDateString('en-GB') : '–', 'Last login') + '</div>';
  // Data source toggles
  h += '<div class="flex flex-wrap items-center gap-3 mb-3 text-sm rounded border border-gray-200 bg-gray-50 px-3 py-2"><span class="font-semibold">Topic data from:</span>' +
    '<span class="px-2 py-0.5 rounded bg-white border border-gray-300 text-xs">✓ Assessments</span>' +
    '<label class="text-xs"><input type="checkbox" class="gp-opt" data-k="quizzes"' + (o.quizzes ? ' checked' : '') + '> Live quizzes</label>' +
    '<label class="text-xs"><input type="checkbox" class="gp-opt" data-k="practice"' + (o.practice ? ' checked' : '') + '> Practice (Fix my mistakes)</label>' +
    (o.quizzes || o.practice ? '<span class="text-xs font-semibold text-amber-700">Including ' + [o.quizzes ? 'quiz' : '', o.practice ? 'practice' : ''].filter(Boolean).join(' + ') + ' data</span>' : '<span class="text-xs text-gray-500">Assessments only (most reliable)</span>') + '</div>';
  // Paper split (official tests)
  var allQs = [], allMarks = {};
  official.forEach(function (x) { (x.test.questions || []).forEach(function (q) { var key = x.id + ':' + q.id; allQs.push({ id: key, marks: q.marks, topics: q.topics }); allMarks[key] = x.marks[q.id]; }); });
  if (allQs.length) h += '<div class="border border-gray-200 rounded-lg p-3 mb-4"><h4 class="font-bold mb-2">Paper 1 vs Paper 2</h4>' + gcseStudentSplitHtml(allQs, allMarks, true) + '</div>';
  // Topics: named bars, weakest first, untaught hidden
  var agg = gcseProfileTopicAgg(D, o);
  var hiddenCount = 0;
  var visibleTopic = function (tc) {
    if (o.showHidden || !D.covered.length) return true;
    var taught = D.covered.indexOf(tc) !== -1 || D.covered.some(function (c) { return J277.expand(tc).indexOf(c) !== -1; });
    return taught || (agg[tc] && agg[tc].src.test);
  };
  var bars = Object.keys(agg).map(function (tc) { return { code: tc, pct: gPct(agg[tc].a, agg[tc].p), src: agg[tc].src }; })
    .filter(function (x) { if (x.pct == null) return false; if (!visibleTopic(x.code)) { hiddenCount++; return false; } return true; })
    .sort(function (x, y) { return x.pct - y.pct; });
  var showAll = o.allTopics;
  h += '<div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4"><div class="lg:col-span-2 border border-gray-200 rounded-lg p-3"><div class="flex flex-wrap justify-between items-center gap-2 mb-2"><h4 class="font-bold">Topics – weakest first</h4>' +
    (D.covered.length ? '<label class="text-xs text-gray-600"><input type="checkbox" class="gp-opt" data-k="showHidden"' + (o.showHidden ? ' checked' : '') + '> Show topics not taught yet' + (hiddenCount ? ' (' + hiddenCount + ')' : '') + '</label>' : '') + '</div>' +
    (bars.length ? bars.slice(0, showAll ? bars.length : 8).map(function (x) {
      var col = x.pct >= 70 ? '#16a34a' : x.pct >= 40 ? '#d97706' : '#dc2626';
      return '<div class="flex items-center gap-2 text-sm mb-1"><span class="w-64 truncate" title="' + gEsc(J277.label(x.code)) + '">' + gEsc(J277.label(x.code)) + '</span>' +
        '<div class="flex-1 h-3 bg-gray-100 rounded"><div class="h-3 rounded" style="width:' + x.pct + '%;background:' + col + '"></div></div><span class="w-10 text-right text-xs font-bold">' + x.pct + '%</span>' +
        (x.src.quiz || x.src.practice ? '<span class="text-[10px] text-amber-700" title="includes quiz/practice data">*</span>' : '') + '</div>';
    }).join('') + (bars.length > 8 ? '<button type="button" class="gp-opt-btn text-xs text-blue-700 mt-1" data-k="allTopics">' + (showAll ? 'Show weakest 8 only' : 'Show all ' + bars.length + ' topics') + '</button>' : '') :
      '<p class="text-sm text-gray-500">No assessment data on GCSE topics yet' + (o.quizzes || o.practice ? '' : ' – tick Live quizzes or Practice to see quiz data') + '.</p>') +
    '</div><div class="border border-gray-200 rounded-lg p-3"><h4 class="font-bold mb-2">Misconceptions</h4>' + gcseProfileMisconceptionsHtml(D) +
    '<h4 class="font-bold mt-4 mb-1">Website activity</h4><p class="text-sm">' + D.steps + ' lesson steps completed · ' + Math.round(D.ms / 60000) + ' minutes on lessons</p></div></div>';
  if (typeof plcProfileHtml === 'function') h += plcProfileHtml(D);
  h += '<div class="border border-gray-200 rounded-lg p-3 mb-4"><h4 class="font-bold mb-2">Progress over time <span class="text-xs font-normal text-gray-500">(official assessments)</span></h4>' +
    gcseProfileChart(D.history.filter(function (x) { return !x.practice && !x.notSubmitted; })) + '</div>';
  // History
  h += '<div class="border border-gray-200 rounded-lg p-3 mb-4"><h4 class="font-bold mb-2">History</h4><div class="overflow-x-auto"><table class="w-full text-xs"><tr class="bg-gray-50"><th class="p-1 text-left">Date</th><th class="p-1 text-left">Year</th><th class="p-1 text-left">Assessment</th><th class="p-1">Score</th><th class="p-1">Grade</th><th class="p-1">DP</th><th class="p-1 text-left"></th></tr>' +
    D.history.slice().reverse().map(function (x) {
      var tags = [x.practice ? 'practice' : '', x.archived ? 'archived' : '', x.notSubmitted ? 'not submitted' : ''].filter(Boolean);
      var grade = x.absent ? '' : (x.grade != null ? GcseCore.gradeLabel(x.grade) + (x.gradeEst ? ' <span class="text-gray-400">est.</span>' : '') : '–');
      return '<tr class="border-t ' + (x.practice || x.archived ? 'text-gray-500' : '') + '"><td class="p-1">' + (x.at ? new Date(x.at).toLocaleDateString('en-GB') : '') + '</td>' +
        '<td class="p-1">' + (x.at && typeof academicYearLabel === 'function' ? academicYearLabel(academicYearStart(x.at)) : '') + '</td>' +
        '<td class="p-1">' + gEsc(x.title) + ' <span class="text-gray-400">· ' + gEsc(x.type) + '</span></td>' +
        '<td class="p-1 text-center">' + (x.absent ? 'ABS' : (x.score != null ? x.score + ' / ' + x.max : '')) + '</td><td class="p-1 text-center">' + grade + '</td>' +
        '<td class="p-1 text-center">' + (x.dp != null ? x.dp : '–') + '</td><td class="p-1 text-gray-500">' + tags.join(', ') + '</td></tr>';
    }).join('') + '</table></div><p class="text-[11px] text-gray-500 mt-1">Grades use each test\'s boundaries, or the J277 defaults when none are set. "est." = estimated from the AP percentage. DP: your DP, the suggested DP, or the class ranking (as in AP Results).</p></div>';
  // Notes
  h += '<div class="border border-gray-200 rounded-lg p-3"><div class="flex justify-between items-center mb-2"><h4 class="font-bold">Teacher notes <span class="text-xs font-normal text-gray-500">(saved in your private Google sheet "' + GCSE_NOTES_NAME + '", not Firebase)</span></h4>' +
    '<button type="button" id="gcse-notes-load" class="text-xs px-2 py-1 rounded border border-gray-300">Load notes</button></div><div id="gcse-notes-list" class="text-sm text-gray-500">Click "Load notes" (needs Google sign-in).</div>' +
    '<div class="flex gap-2 mt-2"><input id="gcse-note-new" class="flex-1 border border-gray-300 rounded px-2 py-1 text-sm" placeholder="Add a note…"><button type="button" id="gcse-note-add" class="jhncc-primary px-3 py-1 rounded text-sm">Add</button></div></div>';
  body.innerHTML = h;
  body.querySelectorAll('.gp-opt').forEach(function (cb) { cb.onchange = function () { o[cb.dataset.k] = cb.checked; gcseRenderProfile(); }; });
  body.querySelectorAll('.gp-opt-btn').forEach(function (b) { b.onclick = function () { o[b.dataset.k] = !o[b.dataset.k]; gcseRenderProfile(); }; });
  gEl('gcse-notes-load').onclick = function () { gcseProfileLoadNotes(D.code); };
  gEl('gcse-note-add').onclick = function () { gcseProfileAddNote(D.code); };
}
function gcseProfileMisconceptionsHtml(D) {
  var ids = Object.keys(D.misconceptions || {}).sort(function (x, y) { return (D.misconceptions[y].count || 0) - (D.misconceptions[x].count || 0); });
  if (!ids.length) return '<p class="text-sm text-gray-500">None recorded yet.</p>';
  return ids.slice(0, 6).map(function (id) {
    var c = J277.feedbackCode(id);
    return '<div class="text-sm mb-1"><span class="px-1.5 rounded bg-amber-100 text-amber-900 font-bold text-xs">' + gEsc(id) + '</span> ' + gEsc(c ? c.text : '') + ' <span class="text-xs text-gray-500">×' + (D.misconceptions[id].count || 1) + '</span></div>';
  }).join('');
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
