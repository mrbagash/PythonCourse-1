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
  return { M: M, S: S, rows: rows };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = GCSE_BANK_X;
