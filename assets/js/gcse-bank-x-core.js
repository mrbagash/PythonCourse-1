/**
 * gcse-bank-x-core.js – helpers for the extended GCSE question bank (gcse-bank-x-*.js).
 *
 * Original exam-style questions covering every J277 sub-topic (NOT copies of OCR papers).
 * Every question has:
 *   level 1–5  1 = recall, 3 = typical grade 5 question, 5 = hardest grade 8/9 style.
 *              Difficulty F = levels 1–3, H = levels 4–5 (the adaptive homework uses the level).
 *   skill      finer detail inside a sub-topic (J277.SKILLS), e.g. 2.2.1d for / while loops.
 *   codes      the misconception(s) it targets (J277.FEEDBACK_CODES).
 * Multiple choice: why[i] explains why option i is wrong ('' for the right answer), so a pupil
 * who picks a wrong option is told why THAT option is wrong.
 * Short answers: keyword marking rules + test answers; they only go live if every test passes.
 *
 *   M(topic, skill, level, question, options, answerLetter, why, codes)
 *   S(topic, skill, level, command, marks, question, markScheme, rules, tests, codes)
 */
var GCSE_BANK_X = (function () {
  var SRC = 'J277 exam-style (extended bank)';
  var rows = [], seq = {};
  function id(topic) { seq[topic] = (seq[topic] || 0) + 1; return 'X' + topic + '-' + String(seq[topic]).padStart(2, '0'); }
  function base(topic, skill, level, type, command, marks, question, codes) {
    return {
      id: id(topic), paper: topic.charAt(0), topics: [topic], skill: skill || '', level: level, difficulty: level <= 3 ? 'F' : 'H',
      command: command, marks: marks, type: type, question: question, options: [], answer: '', why: [], markScheme: '', rules: '', tests: '',
      source: SRC, rewordedFrom: '', starter: true, extended: true, codes: codes || []
    };
  }
  function M(topic, skill, level, question, options, letter, why, codes) {
    var r = base(topic, skill, level, 'mcq', 'Identify', 1, question, codes);
    r.options = options; r.answer = letter; r.why = why || [];
    var i = letter.charCodeAt(0) - 65;
    r.markScheme = options[i] || '';
    rows.push(r);
  }
  function S(topic, skill, level, command, marks, question, scheme, rules, tests, codes) {
    var r = base(topic, skill, level, 'short', command, marks, question, codes);
    r.markScheme = scheme; r.rules = rules; r.tests = tests;
    rows.push(r);
  }
  // Write / complete / fix the code – marked by running tests (GcseCode).
  function C(topic, skill, level, marks, question, tests, model, opts) {
    opts = opts || {};
    var r = base(topic, skill, level, 'code', opts.command || (opts.starter ? 'Complete' : 'Write'), marks, question, opts.codes);
    r.codeTests = tests.map(function (t) { return { in: (t[0] || []).map(String), out: String(t[1]), exact: !!opts.exact }; });
    r.model = model; r.starterCode = opts.starter || '';
    r.markScheme = 'Marked by running the program against ' + tests.length + ' test' + (tests.length === 1 ? '' : 's') + ' (any correct code scores – there are many ways to write it).\nTests:\n' +
      r.codeTests.map(function (t) { return '• input ' + (t.in.length ? t.in.join(', ') : '(none)') + ' → output ' + t.out.replace(/\n/g, ' / '); }).join('\n') + '\nExample answer (ERL):\n' + model;
    rows.push(r);
  }
  // Fill-in table (trace / truth table / steps). A cell "?x" is a box whose answer is x ("?a|b": a or b).
  function T(topic, skill, level, marks, question, head, cells, opts) {
    opts = opts || {};
    var r = base(topic, skill, level, 'table', 'Complete', marks, question, opts.codes);
    r.table = { head: head, rows: cells.map(function (row) { return row.map(function (c) { return String(c).charAt(0) === '?' ? '' : String(c); }); }),
      blanks: cells.map(function (row) { return row.map(function (c) { return String(c).charAt(0) === '?'; }); }) };
    r.answers = cells.map(function (row) { return row.map(function (c) { return String(c).charAt(0) === '?' ? String(c).slice(1) : ''; }); });
    r.markScheme = 'One box = one share of the marks (' + marks + ' mark' + (marks === 1 ? '' : 's') + ' for all boxes right).\n' + head.join(' | ') + '\n' +
      cells.map(function (row) { return row.map(function (c) { return String(c).charAt(0) === '?' ? '[' + String(c).slice(1).split('|')[0] + ']' : (c || '–'); }).join(' | '); }).join('\n');
    rows.push(r);
  }
  // Extended response (6 / 8 marks): indicative content + levels; the app suggests, the teacher decides.
  function L(topic, level, marks, command, question, indicative, opts) {
    opts = opts || {};
    var r = base(topic, '', level, 'long', command, marks, question, opts.codes);
    r.indicative = indicative.slice(); r.sides = !!opts.sides;
    var top = marks >= 8 ? [6, 8] : [5, 6], mid = marks >= 8 ? [3, 5] : [3, 4];
    r.markScheme = 'Indicative content (credit other valid points):\n' + indicative.map(function (p) { return '• ' + p; }).join('\n') +
      '\nLevels:\nLevel 3 (' + top[0] + '–' + top[1] + ' marks): thorough knowledge; points developed and applied to the context' + (opts.sides ? '; both sides discussed; a supported conclusion' : '') + '.' +
      '\nLevel 2 (' + mid[0] + '–' + mid[1] + ' marks): reasonable knowledge; some points developed' + (opts.sides ? '; may be one-sided' : '') + '.' +
      '\nLevel 1 (1–2 marks): basic points, little development.\n0 marks: nothing worthy of credit.';
    rows.push(r);
  }
  return { M: M, S: S, C: C, T: T, L: L, rows: rows };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = GCSE_BANK_X;
