/**
 * gcse-code.js – run and mark "write / complete the code" answers by TESTING them.
 *
 * There are many correct ways to write a program, so code answers are never marked on keywords:
 * the pupil's code is run against test cases (inputs → expected output) and the marks come from
 * how many tests pass. Pupils can answer in Python or in OCR Exam Reference Language (ERL);
 * ERL is translated to Python first, then everything runs in the browser with Skulpt.
 *
 *   GcseCode.isErl(src)                 → true when the code looks like ERL
 *   GcseCode.toPython(src)              → { py, lineMap, errors }
 *   GcseCode.run(src, inputs)           → Promise<{ output, error, timedOut }>
 *   GcseCode.mark(q, src)               → Promise<{ marks, max, passed, total, results[], lines[], error }>
 *   GcseCode.outputMatches(expected, output, exact)
 *
 * Question rows (type 'code'): codeTests = [{ in: ['3', '4'], out: '7' }, …] (out may have several
 * lines, separated by \n), model = a model answer (ERL) that must pass every test, starter = optional
 * code to complete. Marks = the share of tests passed (rounded down), so partial programs earn partial marks.
 */
var GcseCode = (function () {
  'use strict';

  var ERL_HINT = /^\s*(endif|endwhile|endfunction|endprocedure|endswitch|next\s+[A-Za-z_]\w*|until\b|procedure\b|do\s*$)|\bthen\s*$|^\s*for\s+[A-Za-z_]\w*\s*=\s*.+\s+to\s+/im;
  // Things Python never has: MOD / DIV, array / const declarations, "global x = …", .length / .substring, ASC / CHR.
  var ERL_ONLY = /\b(MOD|DIV)\b|^\s*(array|const)\s+[A-Za-z_]|^\s*global\s+[A-Za-z_]\w*\s*=|\.length\b(?!\s*\()|\.(substring|left|right)\s*\(|\b(ASC|CHR)\s*\(|\.(upper|lower)\b(?!\s*\()/m;
  function isErl(src) { var s = stripStrings(String(src || '')); return ERL_HINT.test(s) || ERL_ONLY.test(s); }
  function stripStrings(s) { return s.replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, '""'); }

  // Split a line into code and string-literal pieces so replacements never touch text inside quotes.
  function mapCode(line, fn) {
    var out = '', buf = '', q = null;
    for (var i = 0; i < line.length; i++) {
      var ch = line.charAt(i);
      if (q) { out += ch; if (ch === '\\') { out += line.charAt(++i); continue; } if (ch === q) q = null; continue; }
      if (ch === '"' || ch === "'") { out += fn(buf); buf = ''; q = ch; out += ch; continue; }
      buf += ch;
    }
    return out + fn(buf);
  }
  function stripComment(line) {
    var q = null;
    for (var i = 0; i < line.length; i++) {
      var ch = line.charAt(i);
      if (q) { if (ch === '\\') { i++; continue; } if (ch === q) q = null; continue; }
      if (ch === '"' || ch === "'") { q = ch; continue; }
      if (ch === '/' && line.charAt(i + 1) === '/') return line.slice(0, i);
      if (ch === '#') return line.slice(0, i);
    }
    return line;
  }
  // ERL expression → Python expression.
  function expr(e, isCond) {
    return mapCode(e, function (c) {
      c = c.replace(/\bAND\b/gi, 'and').replace(/\bOR\b/gi, 'or').replace(/\bNOT\b/gi, 'not')
        .replace(/\bMOD\b/gi, '%').replace(/\bDIV\b/gi, '//').replace(/\^/g, '**')
        .replace(/\btrue\b/gi, 'True').replace(/\bfalse\b/gi, 'False').replace(/\bnull\b/gi, 'None')
        .replace(/<>/g, '!=')
        .replace(/\bASC\s*\(/gi, 'ord(').replace(/\bCHR\s*\(/gi, 'chr(').replace(/\breal\s*\(/gi, 'float(')
        .replace(/\brandom\s*\(/gi, '_erl_random(')
        .replace(/([A-Za-z_][\w]*(?:\[[^\]]*\])*)\.length\b(?!\s*\()/g, 'len($1)')
        .replace(/([A-Za-z_][\w]*(?:\[[^\]]*\])*)\.(upper|lower)\b(?!\s*\()/g, '$1.$2()')
        .replace(/([A-Za-z_][\w]*(?:\[[^\]]*\])*)\.substring\s*\(/g, '_erl_substring($1, ')
        .replace(/([A-Za-z_][\w]*(?:\[[^\]]*\])*)\.left\s*\(/g, '_erl_left($1, ')
        .replace(/([A-Za-z_][\w]*(?:\[[^\]]*\])*)\.right\s*\(/g, '_erl_right($1, ')
        .replace(/(\w)\[([^\[\],]+),([^\[\],]+)\]/g, '$1[$2][$3]');      // 2D array grid[r, c] → grid[r][c]
      // In a condition a single "=" means comparison (pupils often write it).
      if (isCond) c = c.replace(/([^=!<>])=(?!=)/g, '$1==');
      return c;
    });
  }
  var PRELUDE = [
    'import random as _erl_rnd',
    'def _erl_substring(s, a, n):',
    '    return s[a:a + n]',
    'def _erl_left(s, n):',
    '    return s[:n]',
    'def _erl_right(s, n):',
    '    return s[len(s) - n:]',
    'def _erl_random(a, b):',
    '    if isinstance(a, float) or isinstance(b, float):',
    '        return _erl_rnd.uniform(a, b)',
    '    return _erl_rnd.randint(a, b)'
  ];

  function toPython(src) {
    var lines = String(src || '').replace(/\r/g, '').replace(/\t/g, '    ').split('\n');
    var out = [], map = [], errors = [], depth = 0, stack = [], swN = 0, globals = [];
    var emit = function (code, ln, d) { out.push(new Array((d == null ? depth : d) + 1).join('    ') + code); map.push(ln); };
    lines.forEach(function (raw) { var m = stripComment(raw).trim().match(/^global\s+([A-Za-z_]\w*)/i); if (m) globals.push(m[1]); });
    lines.forEach(function (raw, idx) {
      var ln = idx + 1;
      var line = stripComment(raw).trim();
      if (!line) return;
      var m;
      if ((m = line.match(/^(?:const|global)\s+(.*)$/i))) { emit(expr(m[1]), ln); return; }
      if ((m = line.match(/^array\s+([A-Za-z_]\w*)\s*\[\s*([^\],]+)\s*,\s*([^\]]+)\]\s*(?:=\s*(.*))?$/i))) {
        emit(m[1] + ' = ' + (m[4] ? expr(m[4]) : '[[None] * (' + expr(m[3]) + ') for _ in range(' + expr(m[2]) + ')]'), ln); return;
      }
      if ((m = line.match(/^array\s+([A-Za-z_]\w*)\s*\[\s*([^\]]*)\]\s*(?:=\s*(.*))?$/i))) {
        emit(m[1] + ' = ' + (m[3] ? expr(m[3]) : '[None] * (' + expr(m[2] || '0') + ')'), ln); return;
      }
      if ((m = line.match(/^for\s+([A-Za-z_]\w*)\s*=\s*(.+?)\s+to\s+(.+?)(?:\s+step\s+(.+?))?\s*:?\s*$/i))) {
        var step = m[4] ? expr(m[4]) : null, neg = step && /^\s*-/.test(step);
        emit('for ' + m[1] + ' in range(' + expr(m[2]) + ', (' + expr(m[3]) + ')' + (neg ? ' - 1' : ' + 1') + (step ? ', ' + step : '') + '):', ln);
        stack.push('for'); depth++; return;
      }
      if ((m = line.match(/^next(\s+\w+)?$/i))) { if (stack.pop() !== 'for') errors.push({ line: ln, msg: '"next" without a matching "for"' }); depth = Math.max(0, depth - 1); return; }
      if ((m = line.match(/^while\s+(.+?)\s*:?\s*$/i))) { emit('while ' + expr(m[1], true) + ':', ln); stack.push('while'); depth++; return; }
      if (/^endwhile$/i.test(line)) { if (stack.pop() !== 'while') errors.push({ line: ln, msg: '"endwhile" without a matching "while"' }); depth = Math.max(0, depth - 1); return; }
      if (/^do\s*:?$/i.test(line)) { emit('while True:', ln); stack.push('do'); depth++; return; }
      if ((m = line.match(/^until\s+(.+)$/i))) { emit('if ' + expr(m[1], true) + ':', ln); emit('break', ln, depth + 1); if (stack.pop() !== 'do') errors.push({ line: ln, msg: '"until" without a matching "do"' }); depth = Math.max(0, depth - 1); return; }
      if ((m = line.match(/^if\s+(.+?)\s*(?:then)?\s*:?\s*$/i))) { emit('if ' + expr(m[1], true) + ':', ln); stack.push('if'); depth++; return; }
      if ((m = line.match(/^else\s*if\s+(.+?)\s*(?:then)?\s*:?\s*$/i)) || (m = line.match(/^elif\s+(.+?)\s*:?\s*$/i))) { emit('elif ' + expr(m[1], true) + ':', ln, depth - 1); return; }
      if (/^else\s*:?$/i.test(line)) { emit('else:', ln, depth - 1); return; }
      if (/^endif$/i.test(line)) { if (stack.pop() !== 'if') errors.push({ line: ln, msg: '"endif" without a matching "if"' }); depth = Math.max(0, depth - 1); return; }
      if ((m = line.match(/^switch\s+(.+?)\s*:?\s*$/i))) { swN++; emit('_erl_sw' + swN + ' = ' + expr(m[1]), ln); stack.push({ sw: swN, first: true }); return; }
      if ((m = line.match(/^case\s+(.+?)\s*:?\s*$/i))) {
        var top = stack[stack.length - 1];
        if (!top || !top.sw) { errors.push({ line: ln, msg: '"case" outside a switch' }); return; }
        if (!top.first) depth--;
        emit((top.first ? 'if ' : 'elif ') + '_erl_sw' + top.sw + ' == ' + expr(m[1]) + ':', ln); top.first = false; depth++; return;
      }
      if (/^default\s*:?$/i.test(line)) {
        var t2 = stack[stack.length - 1];
        if (!t2 || !t2.sw) { errors.push({ line: ln, msg: '"default" outside a switch' }); return; }
        if (!t2.first) depth--;
        emit(t2.first ? 'if True:' : 'else:', ln); t2.first = false; depth++; return;
      }
      if (/^endswitch$/i.test(line)) { var t3 = stack.pop(); if (!t3 || !t3.sw) errors.push({ line: ln, msg: '"endswitch" without a matching "switch"' }); else if (!t3.first) depth = Math.max(0, depth - 1); return; }
      if ((m = line.match(/^(function|procedure)\s+([A-Za-z_]\w*)\s*\((.*)\)\s*:?\s*$/i))) {
        var params = m[3].split(',').map(function (p) { return p.replace(/:\s*by(val|ref)/i, '').trim(); }).filter(Boolean).join(', ');
        emit('def ' + m[2] + '(' + params + '):', ln); stack.push('def'); depth++;
        if (globals.length) emit('global ' + globals.join(', '), ln);
        return;
      }
      if (/^end(function|procedure)$/i.test(line)) { if (stack.pop() !== 'def') errors.push({ line: ln, msg: '"' + line + '" without a matching function/procedure' }); depth = Math.max(0, depth - 1); return; }
      if ((m = line.match(/^return\s*(.*)$/i))) { emit('return ' + expr(m[1]), ln); return; }
      emit(expr(line), ln);
    });
    stack.forEach(function (s) { errors.push({ line: lines.length, msg: 'A "' + (s.sw ? 'switch' : s) + '" is never closed (missing ' + ({ 'for': 'next', 'while': 'endwhile', 'do': 'until', 'if': 'endif', 'def': 'endfunction / endprocedure' }[s] || 'endswitch') + ')' }); });
    // Empty blocks need "pass" in Python.
    var fixed = [], fmap = [];
    for (var i = 0; i < out.length; i++) {
      fixed.push(out[i]); fmap.push(map[i]);
      if (/:\s*$/.test(out[i])) {
        var ind = out[i].match(/^ */)[0].length, next = out[i + 1];
        if (next == null || next.match(/^ */)[0].length <= ind) { fixed.push(new Array(ind / 4 + 2).join('    ') + 'pass'); fmap.push(map[i]); }
      }
    }
    return { py: PRELUDE.join('\n') + '\n' + fixed.join('\n') + '\n', lineMap: fmap, offset: PRELUDE.length, errors: errors };
  }

  function prepare(src) {
    if (isErl(src)) return toPython(src);
    var lines = String(src || '').replace(/\r/g, '').replace(/\t/g, '    ').split('\n');
    return { py: lines.join('\n') + '\n', lineMap: lines.map(function (l, i) { return i + 1; }), offset: 0, errors: [], python: true };
  }
  // "on line 12" in a Skulpt error → the pupil's own line number.
  // PyLearn.runPython puts a 9-line input() shim in front of the code when inputs are given.
  var SHIM_LINES = 9;
  function fixErrorLine(err, prep) {
    return String(err || '').replace(/on line (\d+)/, function (all, n) {
      var i = Number(n) - 1 - prep.offset - SHIM_LINES;
      return i >= 0 && prep.lineMap[i] ? 'on line ' + prep.lineMap[i] : all;
    });
  }

  // Run with pre-supplied inputs (prompts are not printed, so only print() output is compared).
  var queue = Promise.resolve();
  function run(src, inputs, opts) {
    opts = opts || {};
    var prep = prepare(src);
    if (prep.errors.length) return Promise.resolve({ output: '', error: prep.errors.map(function (e) { return 'Line ' + e.line + ': ' + e.msg; }).join('; '), timedOut: false, structural: true });
    var job = function () {
      if (typeof window === 'undefined' || !window.PyLearn) return Promise.resolve({ output: '', error: 'Python runner not available', timedOut: false });
      return window.PyLearn.runPython(prep.py, { inputs: (inputs || []).map(String), execLimit: opts.execLimit || 3000 }).then(function (r) {
        var err = r.error ? fixErrorLine(r.error, prep) : null;
        return { output: r.output || '', error: err, timedOut: !!err && /TimeLimitError|time ?limit|timed out/i.test(err) };
      });
    };
    // Skulpt is global: run one program at a time.
    var p = queue.then(job, job);
    queue = p.catch(function () {});
    return p;
  }

  function norm(s) { return String(s == null ? '' : s).trim().replace(/\s+/g, ' ').toLowerCase(); }
  function numEq(a, b) { var x = Number(a), y = Number(b); return a !== '' && b !== '' && !isNaN(x) && !isNaN(y) && Math.abs(x - y) < 1e-9; }
  function lineMatches(exp, got, exact) {
    var e = norm(exp), g = norm(got);
    if (e === g || numEq(e, g)) return true;
    if (exact) return false;
    // A single expected word/number may be inside a friendlier line ("The total is 7").
    if (!/\s/.test(e)) return g.split(/[\s,:;=()]+/).some(function (t) { return t === e || numEq(t, e) || t.replace(/[.!?"']+$/, '') === e; });
    return g.indexOf(e) !== -1;
  }
  // Every expected line must appear, in order, in the output.
  function outputMatches(expected, output, exact) {
    var exp = String(expected == null ? '' : expected).split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
    var got = String(output || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
    if (exact && got.length !== exp.length) return false;
    var j = 0;
    for (var i = 0; i < got.length && j < exp.length; i++) if (lineMatches(exp[j], got[i], exact)) j++;
    return j === exp.length;
  }
  function testsOf(q) {
    var t = q.codeTests;
    if (typeof t === 'string') { try { t = JSON.parse(t); } catch (e) { t = []; } }
    return Array.isArray(t) ? t : [];
  }
  function inputText(ins) { return ins && ins.length ? ins.map(function (x) { return '“' + x + '”'; }).join(', ') : 'no input'; }
  // Explain a failed test in pupil language.
  function explain(test, r) {
    var lines = [];
    var exp = String(test.out).split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
    var got = String(r.output || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
    if (r.timedOut) lines.push('Your program never finished – a loop probably never stops. Check that something inside the loop changes the condition.');
    else if (r.error) {
      var e = r.error;
      if (/NameError/.test(e)) lines.push('A name is used before it has a value (or is spelt differently): ' + e.replace(/^.*NameError:\s*/, '') + '.');
      else if (/TypeError/.test(e) && /concatenate|str|int|unsupported operand/.test(e)) lines.push('You mixed text and numbers. Use int() / float() on input before doing maths, and str() before joining a number to text.');
      else if (/ValueError/.test(e) && /int\(\)|float\(\)|literal/.test(e)) lines.push('Your program tried to turn text into a number with int() / float(), but that input was not a number. Check which inputs are numbers and which are text (' + e.replace(/^.*ValueError:\s*/, '') + ').');
      else if (/IndexError/.test(e)) lines.push('You used a position that does not exist. Arrays and strings start at 0, so the last item is at length − 1.');
      else if (/SyntaxError|IndentationError/.test(e) || r.structural) lines.push('The code cannot run: ' + e.replace(/^.*?(SyntaxError|IndentationError):\s*/, '') + (r.structural ? '' : ''));
      else if (/ZeroDivisionError/.test(e)) lines.push('Your program divides by zero.');
      else lines.push('Your program stopped with an error: ' + e);
    } else if (!got.length) lines.push('Your program did not print anything for this test.');
    else if (exp.length > 1 && got.length >= 1) {
      var gotNums = got.filter(function (g) { return !isNaN(Number(g)); });
      if (gotNums.length === exp.length - 1 && exp.slice(0, -1).every(function (x, i) { return numEq(x, gotNums[i]); })) lines.push('Your loop stops one time too early – check the end value (e.g. < instead of <=, or range stopping before the end).');
      else if (gotNums.length === exp.length + 1 && exp.every(function (x, i) { return numEq(x, gotNums[i]); })) lines.push('Your loop runs one time too many – check the end value of the loop.');
      else if (gotNums.length === exp.length - 1 && exp.slice(1).every(function (x, i) { return numEq(x, gotNums[i]); })) lines.push('Your loop starts one too late – check the start value.');
    }
    return lines;
  }
  function mark(q, src) {
    var tests = testsOf(q), max = Number(q.marks) || 1;
    if (!String(src || '').trim()) return Promise.resolve({ marks: 0, max: max, passed: 0, total: tests.length, results: [], lines: ['You did not write any code.'], error: null });
    var results = [];
    var chain = Promise.resolve();
    tests.forEach(function (t) {
      chain = chain.then(function () {
        return run(src, t.in || []).then(function (r) {
          var pass = !r.error && outputMatches(t.out, r.output, !!t.exact);
          results.push({ test: t, pass: pass, output: r.output, error: r.error, timedOut: r.timedOut, structural: r.structural });
        });
      });
    });
    return chain.then(function () {
      var passed = results.filter(function (x) { return x.pass; }).length;
      var marks = tests.length ? Math.floor(passed / tests.length * max) : 0;
      if (passed === tests.length && tests.length) marks = max;
      var firstFail = results.filter(function (x) { return !x.pass; })[0];
      var lines = firstFail ? explain(firstFail.test, firstFail) : [];
      return { marks: marks, max: max, passed: passed, total: tests.length, results: results, lines: lines, error: firstFail ? firstFail.error : null };
    });
  }
  function resultsHtml(res, esc) {
    esc = esc || function (s) { return String(s); };
    return '<table class="text-xs w-full my-1"><tr class="text-left text-gray-500"><th class="pr-2">Test input</th><th class="pr-2">Should print</th><th class="pr-2">Your program printed</th><th></th></tr>' +
      res.results.map(function (x) {
        return '<tr class="align-top border-t"><td class="pr-2 py-0.5">' + esc(inputText(x.test.in)) + '</td><td class="pr-2 py-0.5 font-mono whitespace-pre">' + esc(x.test.out) + '</td><td class="pr-2 py-0.5 font-mono whitespace-pre' + (x.pass ? '' : ' text-red-800') + '">' + esc(x.error ? (x.timedOut ? '(never finished)' : '(error)') : String(x.output || '').trim() || '(nothing)') + '</td><td>' + (x.pass ? '✓' : '✗') + '</td></tr>';
      }).join('') + '</table>';
  }
  return { isErl: isErl, toPython: toPython, prepare: prepare, run: run, mark: mark, outputMatches: outputMatches, testsOf: testsOf, resultsHtml: resultsHtml, explain: explain };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = GcseCode;
