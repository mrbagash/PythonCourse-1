/**
 * gcse-core.js – pure logic for the GCSE features (no DOM, no Firebase):
 *   • keyword marking that checks WHAT is said about WHAT (not just which words appear)
 *   • test-map parsing, grade boundaries, Definite Purpose suggestions
 *   • question-bank row validation (past-paper / reworded only, tested before going live)
 *
 * ── Marking rules (one mark point per line) ───────────────────────────────
 *   [MDR] holds|stores|contains -> data|instruction ! address
 *       subject in [ ] (optional) · verbs · -> accepted things stored · ! rejected things
 *       A thing can need a qualifier word:  address+next   (address AND "next" nearby)
 *   =fetch & decode & execute      keyword point: ALL of these words
 *   =lossless|no data lost         keyword point: ANY of these words / phrases
 *   2: =...                        a mark point worth 2 marks
 *   max 2                          cap the total (defaults to the question's marks)
 *
 * Rules applied:
 *   1. Checks the thing that is actually stored/held, not just keywords:
 *      "MDR stores the address of the instruction" → the thing stored is an address → no mark.
 *      "…data fetched FROM the address in the MAR" → 'address' is where it came from → ignored.
 *   2. Common mix-ups (rejected words, other components as the subject) are never accepted.
 *   3. Hedging ("the address or data") → no mark for that point, like OCR mark schemes.
 *   4. Unsure (verb with no recognisable object, contradictions, long rambling answers)
 *      → no mark + needsCheck, never a guess.
 *   5. Bank questions must pass their own test answers before they go live (validateBankRow).
 */
var GcseCore = (function () {
  // ── Text normalisation ───────────────────────────────────────
  var PHRASES = [
    ['memory address register', 'mar'], ['memory data register', 'mdr'], ['memory buffer register', 'mdr'],
    ['programme counter', 'pc'], ['program counter', 'pc'], ['current instruction register', 'cir'],
    ['arithmetic and logic unit', 'alu'], ['arithmetic logic unit', 'alu'], ['control unit', 'cu'],
    ['random access memory', 'ram'], ['read only memory', 'rom'], ['read-only memory', 'rom'],
    ['central processing unit', 'cpu'], ['accumulator', 'acc']
  ];
  var CONFUSABLE_SUBJECTS = ['mar', 'mdr', 'pc', 'acc', 'cir', 'alu', 'cu', 'cache', 'ram', 'rom', 'cpu', 'gpu', 'register', 'hdd', 'ssd',
    'compiler', 'interpreter', 'assembler', 'router', 'switch', 'lan', 'wan'];
  var NEGATIONS = ['not', 'dont', 'doesnt', 'never', 'cannot', 'cant', 'isnt', 'arent', 'wont', 'no'];
  var PREPOSITIONS = ['of', 'from', 'to', 'in', 'at', 'by', 'for', 'into', 'with', 'on', 'about', 'within', 'inside', 'via', 'through', 'onto'];
  var COORDINATORS = ['and', 'or', 'nor'];
  var AUX = ['is', 'are', 'was', 'were', 'be', 'been', 'being', 'get', 'gets', 'got'];
  var STOPS = ['that', 'which', 'who', 'when', 'so', 'because', 'then', 'where', 'while', 'whereas', 'but', 'if', 'until', 'before', 'after', 'however', 'whilst'];

  function normaliseText(text) {
    var t = ' ' + String(text || '').toLowerCase().replace(/[’`]/g, "'") + ' ';
    t = t.replace(/'/g, '');                       // doesn't → doesnt
    t = t.replace(/[^a-z0-9.,;:!?\n+|&=\[\]\-> ]/g, ' ');
    PHRASES.forEach(function (p) {
      t = t.split(p[0]).join(p[1]);
    });
    return t.replace(/[ \t]+/g, ' ').trim();
  }

  function stem(word) {
    var w = String(word || '').toLowerCase();
    if (w.length > 5 && /ing$/.test(w)) w = w.slice(0, -3);
    else if (w.length > 4 && /ed$/.test(w)) w = w.slice(0, -2);
    else if (w.length > 4 && /(ses|xes|zes|ches|shes)$/.test(w)) w = w.slice(0, -2);
    else if (w.length > 4 && /ies$/.test(w)) w = w.slice(0, -3) + 'y';
    else if (w.length > 3 && /s$/.test(w) && !/ss$/.test(w)) w = w.slice(0, -1);
    if (w.length > 4 && /e$/.test(w)) w = w.slice(0, -1);
    return w;
  }

  // Damerau-Levenshtein distance (small strings only).
  function editDistance(a, b) {
    if (a === b) return 0;
    var d = [];
    for (var i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (var j = 0; j <= b.length; j++) { d[0][j] = j; }
    for (i = 1; i <= a.length; i++) {
      for (j = 1; j <= b.length; j++) {
        var cost = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
    return d[a.length][b.length];
  }

  // Does an answer token match a rule word? Exact stem, or a small typo on longer words.
  function wordMatches(token, ruleStem) {
    var s = stem(token);
    if (s === ruleStem) return true;
    // Numbers (denary, binary, hex with digits) must match exactly – 10011101 is not 10011100.
    if (/\d/.test(ruleStem) || /\d/.test(s)) return false;
    if (ruleStem.length >= 5 && s.length >= 4) {
      var allowed = ruleStem.length >= 8 ? 2 : 1;
      if (Math.abs(s.length - ruleStem.length) <= allowed && editDistance(s, ruleStem) <= allowed) return 'fuzzy';
    }
    return false;
  }

  function tokens(text) {
    return (String(text || '').match(/[a-z0-9]+/g) || []);
  }

  function splitClauses(normalised) {
    return normalised.split(/[.;!?\n,:]+|\s(?:but|whereas|however|whilst)\s/).map(function (c) { return tokens(c); })
      .filter(function (t) { return t.length; });
  }

  // ── Rule parsing ─────────────────────────────────────────────
  function parseSpecList(text) {
    return String(text || '').split('|').map(function (s) { return s.trim(); }).filter(Boolean).map(function (s) {
      var parts = s.split('+').map(function (p) { return p.trim(); }).filter(Boolean);
      return { main: stem(parts[0]), quals: parts.slice(1).map(stem), raw: s };
    });
  }

  function parseRules(rulesText) {
    var out = { points: [], max: null, errors: [] };
    String(rulesText || '').split(/\n/).forEach(function (rawLine, idx) {
      var line = rawLine.trim();
      if (!line || /^#/.test(line)) return;
      var m = line.match(/^max\s+(\d+)$/i);
      if (m) { out.max = Number(m[1]); return; }
      var weight = 1;
      m = line.match(/^(\d+)\s*:\s*(.*)$/);
      if (m) { weight = Number(m[1]); line = m[2].trim(); }
      var norm = normaliseText(line);
      if (norm.charAt(0) === '=') {
        // "=a|b"      → any of a, b
        // "=a & b|c"  → a AND (b or c)
        var groups = norm.slice(1).split('&').map(function (part) {
          return part.split('|').map(function (t) { return tokens(t).map(stem); }).filter(function (t) { return t.length; });
        }).filter(function (g) { return g.length; });
        if (!groups.length) { out.errors.push('Line ' + (idx + 1) + ': keyword point has no words'); return; }
        out.points.push({ kind: 'keyword', groups: groups, weight: weight, line: rawLine.trim() });
        return;
      }
      var subject = null;
      m = norm.match(/^\[([^\]]+)\]\s*(.*)$/);
      if (m) { subject = tokens(m[1]).map(stem); norm = m[2]; }
      var arrow = norm.split('->');
      if (arrow.length !== 2) { out.errors.push('Line ' + (idx + 1) + ': expected "verbs -> things" or "=keywords"'); return; }
      var verbs = arrow[0].split('|').map(function (v) { return stem(v.trim()); }).filter(Boolean);
      var rest = arrow[1].split('!');
      var accept = parseSpecList(rest[0]);
      var reject = parseSpecList(rest.slice(1).join('|'));
      if (!verbs.length || !accept.length) { out.errors.push('Line ' + (idx + 1) + ': needs at least one verb and one accepted thing'); return; }
      out.points.push({ kind: 'relation', subject: subject, verbs: verbs, accept: accept, reject: reject, weight: weight, line: rawLine.trim() });
    });
    if (!out.points.length && !out.errors.length) out.errors.push('No mark points found');
    return out;
  }

  // ── Marking ──────────────────────────────────────────────────
  function isNegated(clause, idx, windowSize) {
    for (var k = Math.max(0, idx - (windowSize || 3)); k < idx; k++) if (NEGATIONS.indexOf(clause[k]) !== -1) return true;
    return false;
  }

  function hasStemIn(list, token) { return list.some(function (s) { return wordMatches(token, s); }); }

  function specMatches(spec, region, pos) {
    if (!wordMatches(region[pos], spec.main)) return false;
    return spec.quals.every(function (q) { return region.some(function (t) { return wordMatches(t, q) === true; }); });
  }

  // Classify one verb occurrence.
  function evaluateOccurrence(point, clause, vIdx) {
    var negated = isNegated(clause, vIdx);
    var passive = vIdx > 0 && (AUX.indexOf(clause[vIdx - 1]) !== -1 || (vIdx > 1 && AUX.indexOf(clause[vIdx - 2]) !== -1 && /ly$/.test(clause[vIdx - 1])));
    var region, subjectRegion;
    if (passive) {
      var auxIdx = AUX.indexOf(clause[vIdx - 1]) !== -1 ? vIdx - 1 : vIdx - 2;
      var start = 0;
      for (var s = auxIdx - 1; s >= 0; s--) if (STOPS.indexOf(clause[s]) !== -1) { start = s + 1; break; }
      region = clause.slice(start, auxIdx);
      subjectRegion = clause.slice(vIdx + 1);
    } else {
      region = [];
      for (var k = vIdx + 1; k < clause.length; k++) {
        if (STOPS.indexOf(clause[k]) !== -1) break;
        if (hasStemIn(point.verbs, clause[k])) break;
        region.push(clause[k]);
      }
      subjectRegion = clause.slice(0, vIdx);
    }
    // Is this sentence about a different component?
    if (point.subject && point.subject.length) {
      var mentionsRequired = subjectRegion.some(function (t) { return hasStemIn(point.subject, t); });
      var mentionsOther = subjectRegion.some(function (t) {
        return CONFUSABLE_SUBJECTS.indexOf(t) !== -1 && !hasStemIn(point.subject, t);
      });
      if (mentionsOther && !mentionsRequired) return { result: 'other-subject' };
    }
    // Direct objects (not governed by a preposition).
    var accepted = [], rejected = [], fuzzy = false, anyKey = false, lastDirect = null;
    for (var i = 0; i < region.length; i++) {
      var acc = point.accept.filter(function (sp) { return specMatches(sp, region, i); });
      var rej = point.reject.filter(function (sp) { return specMatches(sp, region, i); });
      var isKeyNoun = point.accept.concat(point.reject).some(function (sp) { return wordMatches(region[i], sp.main); });
      if (!isKeyNoun) continue;
      anyKey = true;
      var direct = true;
      for (var b = i - 1, steps = 0; b >= 0 && steps < 3; b--, steps++) {
        if (PREPOSITIONS.indexOf(region[b]) !== -1) { direct = false; break; }
        // "X of the data or instruction": a word joined by and/or takes the role of the word before it.
        if (COORDINATORS.indexOf(region[b]) !== -1) { if (lastDirect !== null) direct = lastDirect; break; }
      }
      lastDirect = direct;
      if (!direct) continue;
      if (acc.length) { accepted.push(region[i]); if (acc.some(function (sp) { return wordMatches(region[i], sp.main) === 'fuzzy'; })) fuzzy = true; }
      // A key noun that matches neither (e.g. "address" without "next") is incomplete, not wrong.
      if (rej.length && !acc.length) rejected.push(region[i]);
    }
    if (negated) return { result: accepted.length ? 'denies-correct' : 'neutral' };
    if (accepted.length && rejected.length) return { result: 'hedge' };
    if (accepted.length) return { result: 'accept', fuzzy: fuzzy };
    if (rejected.length) return { result: 'reject', wrong: rejected[0] };
    return { result: anyKey ? 'neutral' : 'unclear' };
  }

  function markRelationPoint(point, clauses) {
    var outcomes = [];
    clauses.forEach(function (clause) {
      clause.forEach(function (tok, idx) {
        if (hasStemIn(point.verbs, tok)) outcomes.push(evaluateOccurrence(point, clause, idx));
      });
    });
    var has = function (r) { return outcomes.some(function (o) { return o.result === r; }); };
    if (has('hedge')) return { awarded: 0, reason: 'Gave both a right and a wrong answer together (no mark)', hedge: true, subject: point.subject };
    if (has('accept') && (has('reject') || has('denies-correct'))) return { awarded: 0, reason: 'Contradicts itself', needsCheck: true, hedge: true, subject: point.subject };
    if (has('accept')) {
      var fz = outcomes.some(function (o) { return o.result === 'accept' && o.fuzzy; });
      return { awarded: point.weight, reason: fz ? 'Correct (allowing for spelling)' : 'Correct' };
    }
    if (has('reject')) {
      var wrong = outcomes.filter(function (o) { return o.result === 'reject'; })[0].wrong;
      return { awarded: 0, reason: 'Says it is "' + wrong + '" – that is not right', wrong: wrong, subject: point.subject };
    }
    if (has('denies-correct')) return { awarded: 0, reason: 'Says the correct thing does NOT happen' };
    if (has('unclear')) return { awarded: 0, reason: 'Not clear what is meant', needsCheck: true };
    return { awarded: 0, reason: 'Not mentioned' };
  }

  function phraseIn(clause, phrase) {
    for (var i = 0; i + phrase.length <= clause.length; i++) {
      var ok = true;
      for (var j = 0; j < phrase.length; j++) if (!wordMatches(clause[i + j], phrase[j])) { ok = false; break; }
      if (ok) return i;
    }
    return -1;
  }

  function markKeywordPoint(point, clauses) {
    function found(term) {
      return clauses.some(function (c) {
        var at = phraseIn(c, term);
        return at !== -1 && !isNegated(c, at, 5);
      });
    }
    var ok = point.groups.every(function (alternatives) { return alternatives.some(found); });
    return ok ? { awarded: point.weight, reason: 'Correct' } : { awarded: 0, reason: 'Key idea missing' };
  }

  function mark(rules, answer, maxMarks) {
    var parsed = typeof rules === 'string' ? parseRules(rules) : rules;
    var cap = parsed.max || maxMarks || parsed.points.reduce(function (t, p) { return t + p.weight; }, 0);
    var result = { marks: 0, max: cap, points: [], needsCheck: false, reasons: [] };
    if (parsed.errors.length) { result.needsCheck = true; result.reasons.push('Marking rules have errors'); return result; }
    var norm = normaliseText(answer);
    var words = tokens(norm);
    if (!words.length) { result.points = parsed.points.map(function (p) { return { line: p.line, awarded: 0, reason: 'No answer' }; }); return result; }
    var clauses = splitClauses(norm);
    var total = 0;
    parsed.points.forEach(function (p) {
      var r = p.kind === 'keyword' ? markKeywordPoint(p, clauses) : markRelationPoint(p, clauses);
      r.line = p.line;
      result.points.push(r);
      total += r.awarded;
      if (r.needsCheck) { result.needsCheck = true; result.reasons.push(r.reason); }
    });
    result.marks = Math.min(total, cap);
    if (words.length > 40 && result.marks < cap) { result.needsCheck = true; result.reasons.push('Long answer – worth a human check'); }
    return result;
  }

  // Long answers are teacher-marked; this only SUGGESTS a mark: a mark-scheme line counts as
  // "mentioned" when most of its key words (4+ letters) appear in the answer.
  var SCHEME_STOP = ['that', 'this', 'with', 'from', 'they', 'them', 'have', 'will', 'into', 'than', 'then', 'their', 'there', 'which', 'what', 'when', 'where', 'more', 'less', 'each', 'also', 'only', 'must', 'used', 'uses', 'item', 'items'];
  function suggestLongMark(markScheme, answer, marks) {
    var lines = String(markScheme || '').split(/\n|;/).map(function (l) { return l.trim(); }).filter(Boolean);
    var ans = tokens(normaliseText(answer)).map(stem);
    var matched = [];
    lines.forEach(function (line, i) {
      var words = tokens(normaliseText(line)).filter(function (w) { return w.length >= 4 && SCHEME_STOP.indexOf(w) === -1; }).map(stem);
      if (!words.length) return;
      var hits = words.filter(function (w) { return ans.some(function (a) { return a === w || (w.length >= 6 && editDistance(a, w) <= 1); }); }).length;
      if (hits >= Math.min(2, words.length) && hits / words.length >= 0.5) matched.push(i);
    });
    return { marks: Math.min(matched.length, marks || matched.length), matched: matched, lines: lines };
  }

  // Suggest feedback codes (J277.FEEDBACK_CODES) for a marked answer.
  //   q: { type, command, topics, codes, marks }  result: from mark() (or { marks, max } for MCQ)
  // Firebase can hand lists back as objects ({0:..,1:..}) – accept either.
  function asList(v) {
    if (Array.isArray(v)) return v;
    if (v && typeof v === 'object') return Object.keys(v).map(function (k) { return v[k]; });
    return v ? [v] : [];
  }
  function suggestFeedbackCodes(q, answer, result, J) {
    q = Object.assign({}, q, { codes: asList(q.codes), topics: asList(q.topics) });
    var out = [];
    var add = function (id) { if (id && out.indexOf(id) === -1) out.push(id); };
    if (!J || !J.FEEDBACK_CODES) return out;
    if (!String(answer == null ? '' : answer).trim()) { add('E4'); return out; }
    if (result && result.marks >= result.max) return out;
    ((result && result.points) || []).forEach(function (p) {
      if (p.hedge) add('E6');
      if (!p.subject || !p.subject.length) return;
      J.FEEDBACK_CODES.forEach(function (c) {
        if (!c.subjects) return;
        var subjectHit = c.subjects.some(function (sub) { return p.subject.indexOf(stem(sub)) !== -1; });
        var wrongHit = !c.wrong || !p.wrong || c.wrong.some(function (w) { return stem(w) === stem(p.wrong); });
        if (subjectHit && wrongHit && (p.wrong || p.hedge)) add(c.id);
      });
    });
    if (/^explain/i.test(String(q.command || '')) && !/\b(because|so|therefore|this means|which means|as a result)\b/i.test(String(answer))) add('E1');
    if (q.type === 'mcq') {
      var explicit = (q.codes || []).filter(function (id) { return J.feedbackCode(id); });
      if (explicit.length) explicit.forEach(add);
      else (q.topics || []).forEach(function (tc) { J.codesForTopic(tc).filter(function (c) { return !c.exam; }).slice(0, 2).forEach(function (c) { add(c.id); }); });
    } else if (!out.length) {
      (q.codes || []).forEach(add);
    }
    return out;
  }

  // "2 | The MDR stores data" per line
  function parseTestAnswers(text) {
    return String(text || '').split(/\n/).map(function (line) {
      var m = line.match(/^\s*(\d+)\s*\|\s*(.+)$/);
      return m ? { expected: Number(m[1]), answer: m[2].trim() } : null;
    }).filter(Boolean);
  }

  // ── Test map ─────────────────────────────────────────────────
  function splitRow(line) {
    if (line.indexOf('\t') !== -1) return line.split('\t').map(function (c) { return c.trim(); });
    var out = [], cur = '', q = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch === '"') { q = !q; continue; }
      if (ch === ',' && !q) { out.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    out.push(cur.trim());
    return out;
  }

  function suggestTopic(code, J) {
    if (!J) return null;
    var c = String(code || '').toLowerCase().replace(/\s+/g, '');
    var best = null, bestD = 99;
    J.list.forEach(function (n) { if (n.level >= 2) { var d = editDistance(c, n.code); if (d < bestD) { bestD = d; best = n.code; } } });
    return bestD <= 2 ? best : null;
  }

  // Parse "Question,Max marks,Topic,Second topic,Command word" rows (CSV or tab separated).
  function parseTestMap(text, J, paperTotal) {
    var res = { questions: [], errors: [], warnings: [], total: 0 };
    var lines = String(text || '').split(/\r?\n/).map(function (l) { return l.replace(/^\s*```.*$/, ''); }).filter(function (l) { return l.trim(); });
    var seen = {};
    lines.forEach(function (line, idx) {
      var cells = splitRow(line);
      if (idx === 0 && /question/i.test(cells[0]) && isNaN(Number(cells[1]))) return; // header
      var id = String(cells[0] || '').trim().replace(/^q(?=\d)/i, 'Q');
      if (!id) return;
      if (!/^Q/i.test(id)) id = 'Q' + id;
      var marks = Number(cells[1]);
      var topics = [cells[2], cells[3]].map(function (c) { return J ? J.normaliseCode(c) : String(c || '').trim(); }).filter(Boolean);
      var command = String(cells[4] || '').trim();
      var row = { id: id, marks: marks, topics: topics, command: command, line: idx + 1 };
      if (seen[id.toLowerCase()]) res.errors.push('Line ' + (idx + 1) + ': duplicate question ' + id);
      seen[id.toLowerCase()] = true;
      if (!(marks > 0) || Math.round(marks) !== marks) res.errors.push('Line ' + (idx + 1) + ': ' + id + ' has invalid marks "' + cells[1] + '"');
      if (!topics.length) res.errors.push('Line ' + (idx + 1) + ': ' + id + ' has no topic');
      topics.forEach(function (t) {
        if (J && !J.isValid(t)) {
          var s = suggestTopic(t, J);
          res.errors.push('Line ' + (idx + 1) + ': ' + id + ' unknown topic "' + t + '"' + (s ? ' – did you mean ' + s + '?' : ''));
        }
      });
      if (command && J && !J.isCommandWord(command)) res.warnings.push(id + ': "' + command + '" is not a standard command word');
      res.questions.push(row);
      res.total += marks > 0 ? marks : 0;
    });
    if (!res.questions.length) res.errors.push('No questions found');
    if (paperTotal && res.total !== Number(paperTotal)) res.errors.push('Marks add up to ' + res.total + ', but the paper total is ' + paperTotal);
    return res;
  }

  // ── Grades and Definite Purpose ──────────────────────────────
  // boundaries: { "9": 50, "8": 45, …, "1": 5 } = minimum marks for each grade. 0 = U.
  function gradeFor(score, boundaries) {
    if (score == null || !boundaries) return null;
    var any = false;
    for (var g = 9; g >= 1; g--) {
      var b = boundaries[g];
      if (b === '' || b == null || isNaN(Number(b))) continue;
      any = true;
      if (score >= Number(b)) return g;
    }
    return any ? 0 : null;
  }
  // Default boundaries: OCR J277 June 2024 overall boundaries (out of 160) as percentages,
  // scaled to the test's total. 9:136 8:126 7:117 6:102 5:87 4:72 3:52 2:32 1:13
  var DEFAULT_BOUNDARY_SOURCE = { max: 160, label: 'OCR J277 June 2024', marks: { 9: 136, 8: 126, 7: 117, 6: 102, 5: 87, 4: 72, 3: 52, 2: 32, 1: 13 } };
  function defaultBoundaries(total) {
    return scaleBoundaries(DEFAULT_BOUNDARY_SOURCE, total);
  }
  // Component (paper) boundaries, OCR J277 June 2024, each out of 80.
  var COMPONENT_BOUNDARY_SOURCE = {
    '1': { max: 80, label: 'Paper 1 (J277/01 Computer systems)', marks: { 9: 65, 8: 61, 7: 58, 6: 51, 5: 44, 4: 38, 3: 27, 2: 17, 1: 7 } },
    '2': { max: 80, label: 'Paper 2 (J277/02 Computational thinking, algorithms and programming)', marks: { 9: 71, 8: 65, 7: 59, 6: 51, 5: 43, 4: 34, 3: 25, 2: 15, 1: 6 } }
  };
  // Each boundary = the minimum whole mark that reaches OCR's percentage for that grade.
  // Exact for any total (160 marks gives OCR's own boundaries); on short tests some grades
  // may share a mark, which is better than inventing differences that are not there.
  function scaleBoundaries(src, total) {
    total = Number(total);
    if (!(total > 0)) return null;
    var out = {};
    for (var g = 9; g >= 1; g--) out[g] = Math.max(1, Math.ceil(src.marks[g] / src.max * total - 1e-9));
    return out;
  }
  function componentBoundaries(paper, total) {
    var src = COMPONENT_BOUNDARY_SOURCE[String(paper)];
    return src ? scaleBoundaries(src, total) : null;
  }
  // "1.4.2c" → "1", "2.1.3b" → "2"
  function paperOf(topicCode) {
    var c = String(topicCode || '').trim().charAt(0);
    return c === '1' || c === '2' ? c : null;
  }
  function gradeLabel(g) { return g == null || g === '' ? '–' : (Number(g) === 0 ? 'U' : String(g)); }
  function parseGrade(v) {
    var s = String(v == null ? '' : v).trim().toUpperCase();
    if (!s) return null;
    if (s === 'U') return 0;
    var n = Number(s);
    return n >= 0 && n <= 9 && Math.round(n) === n ? n : undefined;
  }
  // DP: 1 best … 4 worst. At/above target = 1, each grade below adds 1 (max 4).
  // Leaving ≥25% of questions not attempted drops it one level.
  function suggestDp(target, working, notAttemptedShare) {
    if (target == null || working == null) return null;
    var diff = target - working;
    var dp = diff <= 0 ? 1 : (diff === 1 ? 2 : (diff === 2 ? 3 : 4));
    if (notAttemptedShare >= 0.25) dp = Math.min(4, dp + 1);
    return dp;
  }

  // ── Question bank validation ────────────────────────────────
  var BANK_HEADERS = ['ID', 'Paper', 'Topics', 'Command word', 'Marks', 'Type', 'Question', 'Options', 'Answer', 'Mark scheme', 'Marking rules', 'Test answers', 'Source', 'Reworded from', 'Difficulty', 'Feedback codes'];
  // "F" / "Foundation" → F, "H" / "Higher" → H, anything else → '' (both tiers)
  function normaliseDifficulty(v) {
    var x = String(v || '').trim().toLowerCase();
    if (x === 'f' || x.indexOf('found') === 0) return 'F';
    if (x === 'h' || x.indexOf('high') === 0) return 'H';
    return '';
  }
  var BANK_TYPES = ['mcq', 'short', 'long', 'paper'];

  function bankRowFromCells(cells, headerIdx) {
    function get(name) { var i = headerIdx[name.toLowerCase()]; return i == null ? '' : String(cells[i] == null ? '' : cells[i]).trim(); }
    return {
      id: get('ID'), paper: get('Paper'), topics: get('Topics').split(/[;,\s]+/).filter(Boolean),
      command: get('Command word'), marks: Number(get('Marks')), type: get('Type').toLowerCase(),
      question: get('Question'), options: get('Options').split('|').map(function (o) { return o.trim(); }).filter(Boolean),
      answer: get('Answer'), markScheme: get('Mark scheme'), rules: get('Marking rules'), tests: get('Test answers'),
      source: get('Source'), rewordedFrom: get('Reworded from'),
      difficulty: normaliseDifficulty(get('Difficulty')),
      codes: get('Feedback codes').split(/[\s,;]+/).map(function (c) { return c.trim().toUpperCase(); }).filter(Boolean)
    };
  }

  // rows: array of bank row objects; returns per-row {live, quizUsable, errors, testResults}
  function validateBank(rows, J) {
    var byId = {};
    rows.forEach(function (r) { if (r.id) byId[r.id.toLowerCase()] = r; });
    return rows.map(function (r) {
      var errors = [], testResults = [];
      if (!r.id) errors.push('Missing ID');
      if (!r.question) errors.push('Missing question');
      if (!(r.marks > 0)) errors.push('Missing marks');
      if (BANK_TYPES.indexOf(r.type) === -1) errors.push('Type must be mcq, short, long or paper');
      if (!r.topics.length) errors.push('Missing topic');
      r.difficulty = normaliseDifficulty(r.difficulty);
      (r.codes || []).forEach(function (c) { if (J && J.feedbackCode && !J.feedbackCode(c)) errors.push('Unknown feedback code ' + c); });
      r.topics = r.topics.map(function (t) { return J ? J.normaliseCode(t) : t; });
      r.topics.forEach(function (t) { if (J && !J.isValid(t)) errors.push('Unknown topic ' + t); });
      // Real exam questions only: a past-paper source, or reworded from one that has a source.
      if (!r.source && !r.rewordedFrom) errors.push('Needs a past-paper Source (or Reworded from)');
      if (!r.source && r.rewordedFrom) {
        var orig = byId[r.rewordedFrom.toLowerCase()];
        if (!orig) errors.push('Reworded from "' + r.rewordedFrom + '", which is not in the bank');
        else if (!orig.source) errors.push('The original question ' + orig.id + ' has no Source');
      }
      if (r.type === 'mcq') {
        if (r.options.length < 2) errors.push('MCQ needs at least 2 options (separate with |)');
        var letter = String(r.answer || '').trim().toUpperCase();
        var idx = letter.length === 1 ? letter.charCodeAt(0) - 65 : -1;
        if (idx < 0 || idx >= r.options.length) errors.push('MCQ answer must be a letter A–' + String.fromCharCode(64 + Math.max(r.options.length, 1)));
        r.answerIndex = idx;
      }
      if (r.type === 'short') {
        var parsed = parseRules(r.rules);
        if (parsed.errors.length) errors = errors.concat(parsed.errors.map(function (e) { return 'Rules: ' + e; }));
        var tests = parseTestAnswers(r.tests);
        var hasFull = tests.some(function (t) { return t.expected === r.marks; });
        var hasZero = tests.some(function (t) { return t.expected === 0; });
        if (tests.length < 3 || !hasFull || !hasZero) errors.push('Needs at least 3 test answers, including a full-mark and a 0-mark answer');
        if (!parsed.errors.length) {
          tests.forEach(function (t) {
            var m = mark(parsed, t.answer, r.marks);
            var pass = m.marks === t.expected && !(m.needsCheck && t.expected > 0);
            testResults.push({ answer: t.answer, expected: t.expected, got: m.marks, pass: pass });
          });
          var failed = testResults.filter(function (t) { return !t.pass; });
          if (failed.length) errors.push(failed.length + ' test answer(s) marked wrongly');
        }
      }
      if ((r.type === 'long' || r.type === 'short') && !r.markScheme) errors.push('Needs a mark scheme');
      var live = !errors.length;
      return { row: r, live: live, quizUsable: live && (r.type === 'mcq' || r.type === 'short' || r.type === 'long'), errors: errors, testResults: testResults };
    });
  }

  return {
    normaliseText: normaliseText, stem: stem, editDistance: editDistance, parseRules: parseRules, mark: mark,
    parseTestAnswers: parseTestAnswers, parseTestMap: parseTestMap, splitRow: splitRow,
    gradeFor: gradeFor, gradeLabel: gradeLabel, defaultBoundaries: defaultBoundaries, DEFAULT_BOUNDARY_SOURCE: DEFAULT_BOUNDARY_SOURCE,
    componentBoundaries: componentBoundaries, COMPONENT_BOUNDARY_SOURCE: COMPONENT_BOUNDARY_SOURCE, paperOf: paperOf,
    suggestFeedbackCodes: suggestFeedbackCodes, normaliseDifficulty: normaliseDifficulty, asList: asList, suggestLongMark: suggestLongMark, parseGrade: parseGrade, suggestDp: suggestDp,
    BANK_HEADERS: BANK_HEADERS, BANK_TYPES: BANK_TYPES, bankRowFromCells: bankRowFromCells, validateBank: validateBank
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = GcseCore;
