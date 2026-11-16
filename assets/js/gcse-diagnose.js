/**
 * gcse-diagnose.js – tells a pupil exactly what went wrong with a GCSE answer.
 *
 *   GcseDiagnose.diagnose(q, answer, res)  →  {
 *     lines:   ['You read the bits from the wrong end …'],   what went wrong (specific)
 *     misc:    [{ id, belief, fix, phrase }],                misconceptions with EVIDENCE only
 *     missing: ['A variable can change …'],                  mark points still needed, in pupil words
 *     marks:   ['address'] / bits,                           what to highlight in the answer
 *     working: 'html',                                       worked method (numbers) or model answer
 *   }
 *
 * A misconception is only named when the pupil's own words (or the option they chose) show it –
 * never guessed from the topic. If there is no evidence, the pupil gets the missing points and a
 * model answer instead.
 */
var GcseDiagnose = (function () {
  'use strict';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var NEG = /\b(not|no|never|cannot|can't|cant|won't|wont|doesn't|doesnt|don't|dont|isn't|isnt|aren't|arent|without|nothing)\b/;

  // Split an answer into clauses so "RAM is volatile, ROM is permanent" is two separate claims.
  function clauses(text) {
    return String(text || '').toLowerCase().replace(/\s+/g, ' ').split(/[.;!?\n]+|,\s*|\s+but\s+|\s+whereas\s+|\s+however\s+|\s+unlike\s+/).map(function (c) { return c.trim(); }).filter(Boolean);
  }
  // First match of re in clause that is NOT negated by the 3 words before it.
  function hit(clause, re) {
    var g = new RegExp(re.source, 'g'), m;
    while ((m = g.exec(clause))) {
      var before = clause.slice(0, m.index).split(' ').slice(-4).join(' ');
      if (!NEG.test(before)) return m[0];
      if (!m[0].length) g.lastIndex++;
    }
    return null;
  }
  function firstOf(clause, words, after) {
    var start = 0;
    if (after) { var am = clause.match(after); if (!am) return null; start = am.index + am[0].length; }
    var rest = clause.slice(start), best = null, at = Infinity;
    words.forEach(function (w) { var m = rest.match(new RegExp('\\b' + w)); if (m && m.index < at) { at = m.index; best = w; } });
    return best;
  }
  var HOLD = /\b(hold|holds|holding|store|stores|storing|contain|contains|keep|keeps|has|have|is|are|=)\b/;

  // Misconception detectors. subj: what the claim is about; other: the thing it gets mixed up with
  // (used when the clause has no subject of its own – then the question decides the subject).
  // test(clause) returns the wrong phrase (to highlight) or null.
  var D = [
    { id: 'C1', belief: 'the fetch–execute cycle happens in a different order', subj: /fetch|decode|execut/, test: function (c) {
      var f = c.search(/\bfetch/), d = c.search(/\bdecod/), e = c.search(/\bexecut/);
      if ((d !== -1 && f !== -1 && d < f) || (e !== -1 && d !== -1 && e < d) || (e !== -1 && f !== -1 && e < f)) return c.match(/\b(fetch|decod|execut)\w*/)[0];
      return null; } },
    { id: 'C2', belief: 'the ALU decodes instructions / sends control signals', subj: /\balu\b|arithmetic logic/, other: /\bcu\b|control unit/, test: function (c) { return hit(c, /decod\w*|control signals?|coordinat\w*|controls? the/); } },
    { id: 'C2', belief: 'the Control Unit does the calculations', subj: /\bcu\b|control unit/, other: /\balu\b|arithmetic logic/, test: function (c) { return hit(c, /calculat\w*|arithmetic|adds? (up )?numbers|maths|logical (operations?|comparisons?)/); } },
    { id: 'C3', belief: 'cache is secondary storage or slower than RAM', subj: /cache/, test: function (c) { return hit(c, /secondary( storage)?|hard (disk|drive)|permanent\w*|non.?volatile|slower than (the )?ram|stores? files/); } },
    { id: 'R1', belief: 'the MAR holds data (it holds an ADDRESS)', subj: /\bmar\b|memory address register/, other: /\bmdr\b|memory data register/, test: function (c) {
      var w = firstOf(c, ['address', 'data', 'instruction', 'result'], HOLD); return w && w !== 'address' && !/address/.test(c) ? w : null; } },
    { id: 'R1', belief: 'the MDR holds an address (it holds DATA or an INSTRUCTION)', subj: /\bmdr\b|memory data register/, other: /\bmar\b|memory address register/, test: function (c) {
      var w = firstOf(c, ['address', 'data', 'instruction', 'result'], HOLD); return w === 'address' ? w : null; } },
    { id: 'R2', belief: 'the Program Counter holds the current instruction (it holds the ADDRESS of the NEXT one)', subj: /\bpc\b|program counter/, other: /\bmar\b|\bmdr\b|memory (address|data) register|\bcir\b/, test: function (c) {
      var cur = hit(c, /current( instruction)?|instruction being (run|executed|processed)/); if (cur) return cur;
      var w = firstOf(c, ['address', 'data', 'instruction', 'result'], HOLD); return w && w !== 'address' ? w : null; } },
    { id: 'R3', belief: 'the accumulator holds an address or instruction (it holds RESULTS from the ALU)', subj: /accumulator|\bacc\b/, test: function (c) {
      var w = firstOf(c, ['address', 'data', 'instruction', 'result', 'answer'], HOLD); return w === 'address' || w === 'instruction' ? w : null; } },
    { id: 'C4', belief: 'Von Neumann keeps data and instructions in separate memories', subj: /von neumann|data and instructions/, test: function (c) { return hit(c, /separate\w*|different memor\w*/); } },
    { id: 'P1', belief: 'clock speed measures storage or memory size', subj: /clock|hz|hertz|ghz/, test: function (c) { return hit(c, /storage|how much (data|ram|memory)|memory size|bytes|\bgb\b|space/); } },
    { id: 'P2', belief: 'more cores always make every program faster', subj: /core/, test: function (c) { return hit(c, /always( be)? (faster|quicker)|(twice|double|four times|4 times|2 times) (as )?(fast|quick)|every program (runs? )?faster/); } },
    { id: 'M1', belief: 'RAM keeps its contents without power (it is volatile)', subj: /\bram\b/, other: /\brom\b/, test: function (c) { var nv = c.match(/(is not|isn't) volatile/); if (nv) return nv[0]; if (/\b(loses?|lost|wiped|erased)\b|(^|[^n-])volatile/.test(c.replace(/non.?volatile/g, 'nonvol'))) return null; return hit(c, /non.?volatile|(is|are) (\w+ )?permanent\w*|stores? (\w+ )?permanently|keeps? (its |the )?(data|contents)|retains?|never lost|read.only|cannot be (changed|written)/); } },
    { id: 'M1', belief: 'ROM loses its contents without power or can be written to (it is non-volatile, read-only)', subj: /\brom\b/, other: /\bram\b/, test: function (c) { return hit(c.replace(/non.?volatile/g, 'nonvol'), /\bvolatile|loses?|lost|erased|wiped|temporar\w*|read and write|read\/write|can be (changed|written|edited)/); } },
    { id: 'M2', belief: 'virtual memory is extra RAM or makes the computer faster', subj: /virtual/, test: function (c) { return hit(c, /extra ram|more ram|adds? (more )?ram|new ram|(makes?|is) (it |the computer |things )?(faster|quicker)|speeds? (it |things )?up/); } },
    { id: 'S1', belief: 'solid state storage has moving parts', subj: /\bssd\b|solid.?state|flash/, other: /\bhdd\b|hard (disk|drive)|magnetic/, test: function (c) { if (/\bno moving parts|not have (any )?moving parts|without moving parts/.test(c)) return null; return hit(c, /(has|have|uses?|with) (some |many )?moving parts|spins?|platters?|read.?write head|magnet\w*/); } },
    { id: 'S1', belief: 'magnetic hard drives have no moving parts', subj: /\bhdd\b|hard (disk|drive)|magnetic/, other: /\bssd\b|solid.?state|flash/, test: function (c) { var m = c.match(/no moving parts|(does not|doesn't|don't) have (any )?moving parts/); return m ? m[0] : null; } },
    { id: 'D1', belief: 'the data units are different sizes (nibble = 4 bits, byte = 8 bits, KB = 1000 bytes)', subj: /nibble|byte|kilobyte|\bkb\b/, test: function (c) { return hit(c, /nibble (is|=|has) (8|2|16)|byte (is|=|has) (4|16|10)\b|(kilobyte|\bkb\b) (is|=) (100|10|8)\b/); } },
    { id: 'D2', belief: 'a left shift divides (left multiplies, right divides)', subj: /left/, other: /right/, test: function (c) { return hit(c, /divid\w*|halv\w*|smaller/); } },
    { id: 'D2', belief: 'a right shift multiplies (right divides, left multiplies)', subj: /right/, other: /left/, test: function (c) { return hit(c, /multipl\w*|doubl\w*|bigger|larger/); } },
    { id: 'D3', belief: 'colour depth is the number of pixels (that is resolution)', subj: /colou?r depth/, other: /resolution/, test: function (c) { return hit(c, /number of pixels|how many pixels|resolution|height|width|size of the (image|picture)/); } },
    { id: 'D3', belief: 'resolution is the number of colours / bits per pixel (that is colour depth)', subj: /resolution/, other: /colou?r depth/, test: function (c) { return hit(c, /bits? per pixel|number of colou?rs|how many colou?rs/); } },
    { id: 'D4', belief: 'sample rate is the bits per sample (that is bit depth)', subj: /sample rate|sampling rate/, other: /bit depth/, test: function (c) { return hit(c, /bits? (per|for each|in each) sample|volume|loud\w*|bit depth/); } },
    { id: 'D4', belief: 'bit depth is how many samples are taken each second (that is sample rate)', subj: /bit depth/, other: /sample rate|sampling rate/, test: function (c) { return hit(c, /(samples?|times) (taken )?(per|each|a) second|how often|per second/); } },
    { id: 'D5', belief: 'lossy compression can restore the original file', subj: /lossy/, other: /lossless/, test: function (c) { return hit(c, /restor\w*|get (it )?back|recover\w*|reorder\w*|no data (is )?(lost|removed)|exactly the same/); } },
    { id: 'D5', belief: 'lossless compression removes data permanently', subj: /lossless/, other: /lossy/, test: function (c) { return hit(c, /remov\w*|delet\w*|permanent\w*|discard\w*|loses? (some )?data|data is lost/); } },
    { id: 'N1', belief: 'a LAN covers a large area (LAN = small area, WAN = large)', subj: /\blan\b|local area/, other: /\bwan\b|wide area/, test: function (c) { return hit(c, /large|wide|countr\w*|world|long distances?|across (the )?(country|world|cities)/); } },
    { id: 'N1', belief: 'a WAN covers a small area (WAN = large area)', subj: /\bwan\b|wide area/, other: /\blan\b|local area/, test: function (c) { return hit(c, /small|one (building|site|room)|single (building|site)|same building/); } },
    { id: 'N2', belief: 'a switch sends data between networks (that is a router)', subj: /switch/, other: /router/, test: function (c) { return hit(c, /between (different )?networks|to the internet|connects? (different )?networks|other networks/); } },
    { id: 'N2', belief: 'a router sends data to devices on the same LAN (that is a switch)', subj: /router/, other: /switch/, test: function (c) { return hit(c, /(same|one|the) (lan|local network)|within (a|the) (lan|network)|devices? on the (same )?(lan|network)/); } },
    { id: 'N3', belief: 'MAC addresses change (MAC is fixed; IP can change)', subj: /\bmac\b/, other: /\bip\b/, test: function (c) { return hit(c, /chang\w*|logical|assigned by (the )?(router|network|isp|dhcp)|temporar\w*/); } },
    { id: 'N3', belief: 'IP addresses are fixed to the hardware (that is MAC)', subj: /\bip\b/, other: /\bmac\b/, test: function (c) { return hit(c, /fixed|permanent\w*|physical|never change\w*|(set|given) (by|at) (the )?(manufactur\w*|factory)|burn\w* in/); } },
    { id: 'N4', belief: 'a firewall removes viruses (that is anti-malware)', subj: /firewall/, test: function (c) { return hit(c, /(remov|delet|clean|quarantin)\w* (the )?(virus|viruses|malware)|scans? (the )?(files|computer)|anti.?(virus|malware)/); } },
    { id: 'O1', belief: 'defragmentation is for solid state drives (it is for magnetic drives)', subj: /defrag/, test: function (c) { return hit(c, /\bssd\b|solid.?state|flash/) || hit(c, /delet\w*|compress\w*|frees? up (space|storage)|removes? (files|unwanted)/); } },
    { id: 'A1', belief: 'binary search works on unsorted data', subj: /binary search/, other: /linear/, test: function (c) { var m = c.match(/unsorted|any order|(does not|doesn't|don't) (need|have) to be sorted|not sorted|no need to sort/); return m ? m[0] : null; } },
    { id: 'A1', belief: 'linear search needs sorted data', subj: /linear search/, other: /binary/, test: function (c) { return hit(c, /(must|needs?|has) (to )?be sorted|sorted first|in order first/); } },
    { id: 'T1', belief: 'a syntax error still lets the program run (it stops it running)', subj: /syntax/, other: /logic/, test: function (c) { return hit(c, /\bruns?\b (but|and)|wrong (output|result|answer)|unexpected (output|result)/); } },
    { id: 'T1', belief: 'a logic error stops the program running (that is a syntax error)', subj: /logic/, other: /syntax/, test: function (c) { var m = c.match(/won't run|will not run|doesn't run|does not run|cannot run|can't run|crash\w*|breaks? the rules|spelling|grammar|typo/); return m ? m[0] : null; } },
    { id: 'T2', belief: 'boundary data is wrong-type or typical data', subj: /boundary/, test: function (c) { return hit(c, /wrong (data )?type|letters?|erroneous|middle of|typical|normal/); } },
    { id: 'L1', belief: 'a compiler translates line by line (that is an interpreter)', subj: /compiler/, other: /interpreter/, test: function (c) { return hit(c, /line by line|one line at a time|each line|a line at a time/); } },
    { id: 'L1', belief: 'an interpreter translates the whole program at once (that is a compiler)', subj: /interpreter/, other: /compiler/, test: function (c) { return hit(c, /whole (program|code)|all at once|entire (program|code)|in one go|executable|\.exe/); } },
    { id: 'I3', belief: 'a for loop is condition-controlled (it is count-controlled)', subj: /\bfor\b( loop)?/, other: /\bwhile\b/, test: function (c) { return /\bfor loop|\bfor\b.*count/.test(c) || /\bfor\b/.test(c) ? hit(c, /condition.controlled|until (a|the) condition|while (a|the) condition is true/) : null; } },
    { id: 'I3', belief: 'a while loop is count-controlled (it is condition-controlled)', subj: /\bwhile\b/, other: /\bfor\b/, test: function (c) { return hit(c, /count.controlled|(set|fixed|known|certain|specific) number of times/); } },
    { id: 'I2', belief: 'a while loop stops by itself (something inside must make the condition false)', subj: /\bwhile\b/, test: function (c) { return hit(c, /stops? (on its own|by itself|automatically)|always stops|ends? automatically/); } },
    { id: 'I4', belief: 'a while loop always runs at least once (it checks first, so it may run 0 times)', subj: /\bwhile\b/, other: /do.?until/, test: function (c) { return hit(c, /always runs? at least once|runs? at least once|checks? (the condition )?(at the )?end|after each/); } },
    { id: 'I4', belief: 'a do-until loop might not run at all (it always runs at least once)', subj: /do.?until/, other: /\bwhile\b/, test: function (c) { return hit(c, /(may|might|could) (not run|never run|run (0|zero) times)|checks? (the condition )?(at the )?(start|beginning|first)/); } },
    { id: 'Q4', belief: 'MOD gives the whole-number part (it gives the REMAINDER)', subj: /\bmod\b/, other: /\bdiv\b/, test: function (c) { return hit(c, /whole number|quotient|how many times|integer division|rounds? down/); } },
    { id: 'Q4', belief: 'DIV gives the remainder (it gives the whole-number part)', subj: /\bdiv\b/, other: /\bmod\b/, test: function (c) { return hit(c, /remainder|left ?over/); } },
    { id: 'Q5', belief: 'arrays start at index 1 (they start at 0)', subj: /array|index|position|list/, test: function (c) { return hit(c, /(starts?|begins?) (at|from) (index |position )?1\b|first (item|element|value) is (at )?(index |position )?1\b|\[1\] is the first/); } },
    { id: 'Q6', belief: 'a procedure returns a value (only a function does)', subj: /procedure/, other: /function/, test: function (c) { return hit(c, /returns? (a )?(value|result)|gives back (a )?value/); } },
    { id: 'Q6', belief: 'a function does not return a value (it does)', subj: /function/, other: /procedure/, test: function (c) { var m = c.match(/(does not|doesn't|don't|never|cannot|can't) return/); return m ? m[0] : null; } },
    { id: 'Q7', belief: 'a local variable can be used anywhere (only inside its sub program)', subj: /local/, other: /global/, test: function (c) { return hit(c, /anywhere|whole program|everywhere|any (part|sub ?program)|all (sub ?programs|parts)/); } },
    { id: 'Q7', belief: 'a global variable only works inside one sub program (that is local)', subj: /global/, other: /local/, test: function (c) { return hit(c, /only (inside|in|within) (one|the|a) (sub ?program|function|procedure)|only (inside|in|within) where/); } },
    { id: 'B1', belief: 'AND outputs 1 when at least one input is 1 (that is OR)', subj: /\band\b gate|\band\b outputs?|\band\b gives?/, other: /\bor\b/, test: function (c) { return hit(c, /at least one|either (input|one)|one (of the )?inputs? (is|=) ?1|any input/); } },
    { id: 'B1', belief: 'OR only outputs 1 when both inputs are 1 (that is AND)', subj: /\bor\b gate|\bor\b outputs?|\bor\b gives?/, other: /\band\b/, test: function (c) { return hit(c, /only (when|if) both|both (inputs )?(are|=|must be) ?1/); } },
    { id: 'H1', belief: 'phishing is a type of software/virus (it tricks a PERSON)', subj: /phish/, test: function (c) { return hit(c, /virus|software|a program\b|malware that|code that|infects?/); } },
    { id: 'H2', belief: 'SMTP is for receiving email (SMTP SENDS; POP/IMAP receive)', subj: /smtp/, test: function (c) { return hit(c, /receiv\w*|download\w*|read(ing)? (the )?emails?|web ?pages?/); } },
    { id: 'H2', belief: 'POP/IMAP send email (they RECEIVE it; SMTP sends)', subj: /\bpop\b|imap/, test: function (c) { return hit(c, /send(s|ing)? (an )?e?mails?|web ?pages?/); } },
    { id: 'H2', belief: 'HTTP/HTTPS is for email or file transfer (it is for web pages)', subj: /\bhttps?\b/, test: function (c) { return hit(c, /e?mails?|file transfer|transfers? files/); } },
    { id: 'G1', belief: 'bubble sort splits/merges or inserts (it swaps neighbouring pairs)', subj: /bubble/, test: function (c) { return hit(c, /split\w*|merg\w*|halv\w*|insert\w*/); } },
    { id: 'G1', belief: 'merge sort swaps neighbouring pairs (it splits then merges)', subj: /merge sort/, test: function (c) { return hit(c, /swaps? (adjacent|neighbou?ring|next)|compares? (each )?(adjacent )?pairs?|insert\w*/); } }
  ];
  // Question-aware detectors (the answer alone is not enough).
  function contextual(q, answer) {
    var out = [], a = String(answer || '').toLowerCase().trim(), qt = String(q.question || '').toLowerCase();
    if (/data type/.test(qt)) {
      if (/\d+\.\d+|price|cost|£|average|height|weight|temperature|decimal/.test(qt) && /^(an? )?(integer|int)\b/.test(a)) out.push({ id: 'A2', belief: 'a number with a decimal point can be stored as an integer', phrase: a.match(/integer|int/)[0] });
      if (/whole number|age|count|number of|how many/.test(qt) && !/\d+\.\d+/.test(qt) && /^(a )?(real|float)\b/.test(a)) out.push({ id: 'A2', belief: 'whole numbers need a real/float type (integer is the best fit)', phrase: a.match(/real|float/)[0] });
      if (/true or false|yes or no|whether/.test(qt) && /^(a )?(string|char)/.test(a)) out.push({ id: 'A2', belief: 'true/false values are strings (they are Boolean)', phrase: a.match(/string|char\w*/)[0] });
      if (/(phone|telephone|mobile) number|postcode/.test(qt) && /^(an? )?(integer|int|real|float)\b/.test(a)) out.push({ id: 'A2', belief: 'phone numbers/postcodes are numbers (they are strings – no maths, may start with 0)', phrase: a.match(/integer|int|real|float/)[0] });
    }
    if (/boundary/.test(qt)) {
      var range = qt.match(/(\d+)\s*(?:to|and|-|–)\s*(\d+)/), n = a.match(/-?\d+/);
      if (range && n) {
        var lo = +range[1], hi = +range[2], v = +n[0];
        if (v > lo + 1 && v < hi - 1) out.push({ id: 'T2', belief: 'any valid value is boundary data (boundary data is at the EDGE of the range)', phrase: n[0] });
      }
    }
    return out;
  }

  function detect(q, text, codesAllowed) {
    var found = [], seen = {};
    var qText = String(q.question || '').toLowerCase();
    clauses(text).forEach(function (whole) {
      D.forEach(function (d) {
        var c = whole;
        if (codesAllowed && codesAllowed.indexOf(d.id) === -1) return;
        var subjHere = d.subj.test(c);
        var subjFromQ = !subjHere && d.subj.test(qText) && !(d.other && (d.other.test(qText) || d.other.test(c)));
        if (!subjHere && !subjFromQ) return;
        if (subjHere && d.other && d.other.test(c)) {
          // "the MDR holds the data from the address in the MAR": judge only the part about this subject.
          var cut = c.search(d.other), s0 = c.search(d.subj);
          c = s0 < cut ? c.slice(0, cut) : c.slice(s0);
        }
        var m = d.test(c);
        if (m && !seen[d.belief]) { seen[d.belief] = true; found.push({ id: d.id, belief: d.belief, phrase: m }); }
      });
    });
    return found;
  }
  function codeText(id) { var c = typeof J277 !== 'undefined' && J277.feedbackCode(id); return c ? c.text : ''; }
  function relevantCodes(q) {
    var ids = [];
    (q.topics || []).forEach(function (t) { if (typeof J277 !== 'undefined') J277.codesForTopic(t).forEach(function (c) { if (!c.exam) ids.push(c.id); }); });
    (Array.isArray(q.codes) ? q.codes : []).forEach(function (id) { ids.push(id); });
    return ids;
  }

  // ── Numbers: work out WHICH step went wrong ────────────────────────────────
  function bits(v, n) { var s = (v >>> 0).toString(2); while (s.length < (n || 8)) s = '0' + s; return s; }
  function bval(s) { return parseInt(s, 2); }
  var PV = [128, 64, 32, 16, 8, 4, 2, 1];
  function lastBin(a) { var m = String(a).replace(/(\d)\s+(?=[01]{4}\b)/g, '$1').match(/[01]{4,}/g); return m ? m[m.length - 1] : null; }
  function lastNum(a) { var m = String(a).replace(/(\d),(?=\d{3}\b)/g, '$1').match(/-?\d+(\.\d+)?/g); return m ? Number(m[m.length - 1]) : null; }
  function lastHex(a) { var m = String(a).toUpperCase().match(/\b[0-9A-F]{1,4}\b/g); return m ? m[m.length - 1] : null; }
  function expectedOf(q) {
    var lines = String(q.rules || '').split('\n').map(function (l) { return l.trim(); }).filter(function (l) { return l.charAt(0) === '='; });
    if (!lines.length) return null;
    return lines[lines.length - 1].slice(1).split('|')[0].replace(/[\s,]/g, '');
  }
  function bitTable(b, wrongCols) {
    var head = PV.map(function (p) { return '<th class="px-1.5 font-normal text-gray-500">' + p + '</th>'; }).join('');
    var row = b.split('').map(function (d, i) { return '<td class="px-1.5 text-center font-mono' + (wrongCols && wrongCols.indexOf(i) !== -1 ? ' bg-red-100 text-red-800 font-bold' : '') + '">' + d + '</td>'; }).join('');
    return '<table class="text-xs my-1 border-collapse"><tr>' + head + '</tr><tr>' + row + '</tr></table>';
  }
  function sumOf(b) { var parts = []; b.split('').forEach(function (d, i) { if (d === '1') parts.push(PV[i]); }); return parts.length ? parts.join(' + ') : '0'; }
  function diffCols(a, b) { var out = []; for (var i = 0; i < 8; i++) if (a.charAt(i) !== b.charAt(i)) out.push(i); return out; }
  function colsText(cols) { return cols.map(function (i) { return PV[i]; }).join(' and ') + ' column' + (cols.length > 1 ? 's' : ''); }
  function hexDigitVal(ch) { return parseInt(ch, 16); }

  function numeric(q, answer) {
    var topic = (q.topics || [])[0] || '', skill = q.skill || '', qt = String(q.question || '');
    var exp = expectedOf(q);
    if (!exp || !String(answer || '').trim()) return null;
    var out = { lines: [], marks: [], working: '', bitsHtml: '' };
    var binsInQ = qt.match(/\b[01]{8}\b/g) || [];
    // Binary → denary
    if (topic === '1.2.4a' && skill === 'b2d' && binsInQ.length) {
      var B = binsInQ[0], C = bval(B), P = lastNum(answer);
      if (P == null) return null;
      if (/^\s*[01]{5,}\s*$/.test(answer)) out.lines.push('Your answer is still in binary. Give it as a denary (ordinary) number.');
      else if (P === bval(B.split('').reverse().join(''))) out.lines.push('You read the place values from the wrong end. The 1s column is on the RIGHT: 128, 64, 32, 16, 8, 4, 2, 1.');
      else if (P === C * 2) out.lines.push('Your place values start at 2 instead of 1, so every column is doubled. The right-hand column is worth 1.');
      else if (Math.abs(P - C) && (Math.abs(P - C) & (Math.abs(P - C) - 1)) === 0 && Math.abs(P - C) <= 128) out.lines.push((P > C ? 'You added the ' : 'You missed the ') + Math.abs(P - C) + ' column. Check each 1 again.');
      else out.lines.push('You wrote ' + P + ' but ' + B + ' is worth ' + C + '.');
      out.working = 'Write the place values over the bits, then add the columns with a 1:' + bitTable(B) + sumOf(B) + ' = <b>' + C + '</b>';
      return out;
    }
    // Denary → binary
    if (topic === '1.2.4a' && skill === 'd2b') {
      var N = Number((qt.match(/denary number (\d+)/i) || [])[1]), Pb = lastBin(answer);
      if (!N && N !== 0) return null;
      var Cb = bits(N);
      if (!Pb) { out.lines.push('Your answer should be in binary (only 0s and 1s), with 8 bits.'); out.working = N + ' = ' + sumOf(Cb) + bitTable(Cb) + '→ <b>' + Cb + '</b>'; return out; }
      var Pb8 = Pb.length < 8 ? bits(bval(Pb)) : Pb.slice(-8);
      if (Pb8.split('').reverse().join('') === Cb) out.lines.push('Your bits are in the reverse order. The biggest place value (128) goes on the LEFT.');
      else {
        var cols = diffCols(Pb8, Cb);
        out.lines.push('Your binary is worth ' + bval(Pb8) + ', not ' + N + '. The ' + colsText(cols) + ' ' + (cols.length > 1 ? 'are' : 'is') + ' wrong.');
        out.bitsHtml = bitTable(Pb8, cols);
      }
      out.working = 'Take away the biggest place value that fits, again and again: ' + N + ' = ' + sumOf(Cb) + bitTable(Cb) + '→ <b>' + Cb + '</b>';
      return out;
    }
    // Binary addition
    if (topic === '1.2.4b' && binsInQ.length >= 2) {
      var A = binsInQ[0], Bb = binsInQ[1], sum = bval(A) + bval(Bb), Pa = lastBin(answer);
      if (!Pa) return null;
      var Pa8 = Pa.length < 8 ? bits(bval(Pa)) : Pa;
      if (Pa8 === bits(bval(A) ^ bval(Bb))) out.lines.push('You did not carry. In binary 1 + 1 = 10: write 0 and carry 1 to the next column on the left.');
      else if (Pa8.length === 8) {
        var cols2 = diffCols(Pa8, bits(sum & 255));
        out.lines.push('The ' + colsText(cols2) + ' ' + (cols2.length > 1 ? 'are' : 'is') + ' wrong – check the carries going into ' + (cols2.length > 1 ? 'those columns' : 'that column') + '.');
        out.bitsHtml = bitTable(Pa8, cols2);
      }
      if (sum > 255) out.lines.push('The answer needs 9 bits, so in 8 bits there is an overflow error.');
      var carry = '', c0 = 0, a2 = A.split('').reverse(), b2 = Bb.split('').reverse(), carries = [];
      for (var i = 0; i < 8; i++) { carries.unshift(c0 ? '1' : ' '); var t = +a2[i] + +b2[i] + c0; c0 = t > 1 ? 1 : 0; }
      carry = carries.join('');
      out.working = 'Add from the RIGHT. 1 + 1 = 10 (write 0, carry 1); 1 + 1 + 1 = 11 (write 1, carry 1).<pre class="font-mono text-xs leading-tight my-1">  ' + A + '\n+ ' + Bb + '\n  ' + carry.replace(/ /g, '·') + '  ← carries\n  ' + bits(sum & 255) + '</pre>';
      return out;
    }
    // Shifts
    if (topic === '1.2.4d' && binsInQ.length) {
      var Bs = binsInQ[0], k = Number((qt.match(/(\d)[- ]place/) || [])[1] || 1), left = /left/i.test(qt), Ps = lastBin(answer);
      if (!Ps) return null;
      var other = bits(left ? bval(Bs) >> k : (bval(Bs) << k) & 255), right = bits(left ? (bval(Bs) << k) & 255 : bval(Bs) >> k);
      if (Ps === other) out.lines.push('You shifted the wrong way. This is a ' + (left ? 'LEFT' : 'RIGHT') + ' shift: every bit moves ' + k + ' place' + (k > 1 ? 's' : '') + ' to the ' + (left ? 'left' : 'right') + '.');
      else for (var kk = 1; kk <= 4; kk++) if (kk !== k && Ps === bits(left ? (bval(Bs) << kk) & 255 : bval(Bs) >> kk)) { out.lines.push('You shifted ' + kk + ' place' + (kk > 1 ? 's' : '') + '; the question asks for ' + k + '.'); break; }
      if (!out.lines.length) { var cols3 = diffCols(Ps.length === 8 ? Ps : bits(bval(Ps)), right); out.lines.push('The ' + colsText(cols3) + ' ' + (cols3.length > 1 ? 'are' : 'is') + ' wrong. Move every bit, and fill the gap with 0s.'); }
      out.working = Bs + ' → move every bit ' + k + ' place' + (k > 1 ? 's' : '') + ' ' + (left ? 'left' : 'right') + ', fill with 0s → <b>' + right + '</b> (' + bval(Bs) + ' ' + (left ? '×' : '÷') + ' ' + Math.pow(2, k) + ' = ' + bval(right) + ')';
      return out;
    }
    // Hex
    if (topic === '1.2.4c') {
      var hexQ = (qt.match(/hexadecimal number ([0-9A-F]+)/i) || [])[1], denQ = (qt.match(/denary number (\d+)/i) || [])[1];
      if (hexQ && skill === 'h2d') {
        var Hc = parseInt(hexQ, 16), Ph = lastNum(answer); if (Ph == null) return null;
        var asDen = hexQ.split('').reduce(function (t, ch) { return t * 10 + hexDigitVal(ch); }, 0);
        var off = hexQ.split('').reduce(function (t, ch) { return t * 16 + (/[A-F]/i.test(ch) ? hexDigitVal(ch) + 1 : hexDigitVal(ch)); }, 0);
        if (Ph === asDen) out.lines.push('You multiplied the left digit by 10. In hex the left digit is worth 16s.');
        else if (Ph === off) out.lines.push('Your letter values are one too high. A = 10, B = 11, C = 12, D = 13, E = 14, F = 15.');
        else if (Ph === parseInt(hexQ.split('').reverse().join(''), 16)) out.lines.push('You used the digits the wrong way round – the LEFT digit is the 16s.');
        else out.lines.push('You wrote ' + Ph + ' but ' + hexQ.toUpperCase() + ' is ' + Hc + '.');
        out.working = hexQ.toUpperCase().split('').map(function (ch, i, arr) { return ch + ' (' + hexDigitVal(ch) + ') × ' + Math.pow(16, arr.length - 1 - i); }).join(' + ') + ' = <b>' + Hc + '</b>';
        return out;
      }
      if (denQ && /hexadecimal/i.test(qt)) {
        var Nd = +denQ, Ch = Nd.toString(16).toUpperCase(), Pq = lastHex(answer); if (!Pq) return null;
        if (Pq === Ch.split('').reverse().join('')) out.lines.push('Your digits are the wrong way round – the number of 16s goes on the LEFT.');
        else if (Pq.length === Ch.length && Pq.split('').some(function (ch, i) { return /[A-F]/.test(Ch[i]) && Math.abs(hexDigitVal(ch) - hexDigitVal(Ch[i])) === 1; })) out.lines.push('One of your letters is one out. A = 10, B = 11, C = 12, D = 13, E = 14, F = 15.');
        else out.lines.push('You wrote ' + Pq + ' but ' + Nd + ' is ' + Ch + ' in hex.');
        out.working = Nd + ' ÷ 16 = ' + Math.floor(Nd / 16) + ' remainder ' + (Nd % 16) + ' → ' + Math.floor(Nd / 16) + ' = ' + (Math.floor(Nd / 16)).toString(16).toUpperCase() + ', ' + (Nd % 16) + ' = ' + (Nd % 16).toString(16).toUpperCase() + ' → <b>' + Ch + '</b>';
        return out;
      }
      if (binsInQ.length && /hexadecimal/i.test(qt)) {
        var Bh = binsInQ[0], Chx = bval(Bh).toString(16).toUpperCase(), Px = lastHex(answer); if (!Px) return null;
        if (Px === Chx.split('').reverse().join('')) out.lines.push('Your two hex digits are the wrong way round – the LEFT nibble gives the LEFT digit.');
        else out.lines.push('You wrote ' + Px + ' but ' + Bh + ' is ' + Chx + '.');
        out.working = 'Split into nibbles: ' + Bh.slice(0, 4) + ' = ' + bval(Bh.slice(0, 4)) + ' = ' + Chx.charAt(0) + ', ' + Bh.slice(4) + ' = ' + bval(Bh.slice(4)) + ' = ' + Chx.charAt(1) + ' → <b>' + Chx + '</b>';
        return out;
      }
    }
    // Character codes
    if (/ASC\(/i.test(qt)) {
      var Pc = lastNum(answer), Cc = Number(exp); if (Pc == null) return null;
      if (Math.abs(Pc - Cc) === 1) out.lines.push('You are one out – count on carefully from the code you are given.');
      else out.lines.push('You wrote ' + Pc + '; the answer is ' + Cc + '.');
      var base = qt.match(/ASC\("(.)"\) is (\d+)/i);
      if (base) { var steps = [], b0 = base[1].charCodeAt(0), v0 = +base[2]; for (var j = 0; j <= Cc - v0 && j < 26; j++) steps.push(String.fromCharCode(b0 + j) + ' = ' + (v0 + j)); out.working = steps.join(', '); }
      return out;
    }
    // File sizes and capacity
    if (topic === '1.2.3c' || /\b(bytes?|kilobytes?|kb|mb|gb)\b/i.test(qt)) {
      var Pn = lastNum(answer), Cn = Number(exp);
      if (Pn == null || !isFinite(Cn) || !Cn) return null;
      var r = Pn / Cn;
      var near = function (x) { return Math.abs(r - x) / x < 0.002; };
      if (near(8)) out.lines.push('Your answer is 8 times too big – you left it in BITS. Divide by 8 to get bytes.');
      else if (near(1 / 8)) out.lines.push('Your answer is 8 times too small – you divided by 8 when it was not needed (or twice).');
      else if (near(1000) || near(1 / 1000) || near(1e6) || near(1e-6)) out.lines.push('Your units are off by ×1000. Check the unit the question asks for: 1 KB = 1000 bytes, 1 MB = 1000 KB, 1 GB = 1000 MB.');
      else if (near(8000) || near(1 / 8000)) out.lines.push('You need to change units twice: bits ÷ 8 = bytes, then bytes ÷ 1000 = KB.');
      else if (near(1.024) || near(1 / 1.024) || near(1.024 * 1.024) || near(1 / (1.024 * 1.024))) out.lines.push('You used 1024. This question uses 1000 (1 KB = 1000 bytes) – both are accepted in the exam if your working shows it.');
      else out.lines.push('You wrote ' + Pn + '; the answer is ' + Cn + '. Check each number in your multiplication.');
      out.working = String(q.markScheme || '').replace(/\s*\(1\)/g, '');
      return out;
    }
    return null;
  }

  // Mark points in pupil words: use the matching mark-scheme line when there is one.
  function pointTexts(q, res) {
    var pts = (res && res.points) || [];
    var scheme = String(q.markScheme || '').replace(/\r/g, '');
    var parts = scheme.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    if (parts.length !== pts.length) parts = scheme.split(/\(\d\)\.?/).map(function (s) { return s.trim().replace(/^[.;,]\s*/, ''); }).filter(Boolean);
    var clean = function (s) { return s.replace(/\s*\(\d\)\s*$/, '').replace(/^[-•*]\s*/, '').trim(); };
    return pts.map(function (p, i) {
      if (parts.length === pts.length) return clean(parts[i]);
      var parsed = null;
      try { parsed = typeof GcseCore !== 'undefined' ? GcseCore.parseRules(p.line || '').points[0] : null; } catch (e) {}
      if (parsed && parsed.kind === 'keyword') return 'Mention ' + parsed.groups.map(function (g) { return '“' + g[0].join(' ') + '”'; }).join(' and ');
      return clean(parts[i] || scheme);
    });
  }
  function subjName(s) { var w = (s || []).join(' '); return w.length <= 4 ? w.toUpperCase() : w; }

  function diagnose(q, answer, res) {
    var out = { lines: [], misc: [], missing: [], marks: [], working: '', bitsHtml: '' };
    res = res || {};
    if (res.ok) return out;
    var allowed = relevantCodes(q);
    if (q.type === 'mcq') {
      var opt = (q.options || [])[res.chosen] || '';
      var text = opt.split(' ').length <= 4 ? q.question.replace(/^which (of these )?/i, '').replace(/\?.*$/, '') + ' ' + opt : opt;
      out.misc = detect(q, text, allowed).concat(detect(q, opt, allowed)).filter(function (m, i, arr) { return arr.findIndex(function (x) { return x.belief === m.belief; }) === i; }).slice(0, 1);
      return finish(out);
    }
    if (!String(answer || '').trim()) { out.lines.push('You did not write an answer. Always have a go – a blank cannot score.'); }
    var num = numeric(q, answer);
    if (num) { out.lines = out.lines.concat(num.lines); out.working = num.working; out.bitsHtml = num.bitsHtml; }
    out.misc = detect(q, answer, allowed).concat(contextual(q, answer));
    out.misc.forEach(function (m) { if (m.phrase) out.marks.push(m.phrase); });
    var hedged = false;
    (res.points || []).forEach(function (p) {
      if (p.wrong) {
        out.marks.push(p.wrong);
        // Already explained by a misconception? Then don't say it twice.
        if (!out.misc.some(function (m) { return String(m.phrase).indexOf(p.wrong) !== -1 || String(p.wrong).indexOf(m.phrase) !== -1; }))
          out.lines.push('You linked the ' + subjName(p.subject) + ' to “' + p.wrong + '” – that is the mix-up.');
      } else if (p.hedge && !hedged) { hedged = true; out.lines.push('You gave a right answer AND a wrong one together. Give one clear answer – the examiner cannot pick for you.'); }
    });
    if (/^explain/i.test(q.command || '') && String(answer || '').trim() && !/\b(because|so|therefore|this means|which means|as a result|so that)\b/i.test(answer) && (res.mark || 0) < (res.max || 1))
      out.lines.push('“Explain” needs a reason: make your point, then add “because…” or “so…”.');
    if (!num) {
      var texts = pointTexts(q, res), seenT = {};
      (res.points || []).forEach(function (p, i) { if (!p.awarded && texts[i] && !seenT[texts[i]]) { seenT[texts[i]] = true; out.missing.push(texts[i]); } });
      // "max 1" style questions: the points are alternatives, so any one of them would do.
      var awarded = (res.points || []).filter(function (p) { return p.awarded; }).length;
      if ((res.points || []).length > (res.max || 0) && out.missing.length > 1) out.missingAny = Math.max(1, (res.max || 1) - awarded);
      out.working = '';
    }
    return finish(out);
  }
  function finish(out) {
    out.misc = out.misc.map(function (m) { return { id: m.id, belief: m.belief, fix: codeText(m.id), phrase: m.phrase }; });
    return out;
  }

  // Wrap the given phrases in the (escaped) answer.
  function highlight(answer, phrases) {
    var text = String(answer == null ? '' : answer), low = text.toLowerCase(), spans = [];
    (phrases || []).filter(Boolean).map(String).sort(function (a, b) { return b.length - a.length; }).forEach(function (ph) {
      var at = low.indexOf(ph.toLowerCase());
      if (at === -1) return;
      var end = at + ph.length;
      if (spans.some(function (s) { return at < s[1] && end > s[0]; })) return;   // already inside a highlight
      spans.push([at, end]);
    });
    spans.sort(function (a, b) { return a[0] - b[0]; });
    var html = '', pos = 0;
    spans.forEach(function (s) { html += esc(text.slice(pos, s[0])) + '<mark class="bg-red-100 text-red-800 underline decoration-red-500 rounded px-0.5">' + esc(text.slice(s[0], s[1])) + '</mark>'; pos = s[1]; });
    return html + esc(text.slice(pos));
  }

  return { diagnose: diagnose, detect: detect, numeric: numeric, highlight: highlight, pointTexts: pointTexts, DETECTORS: D, esc: esc };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = GcseDiagnose;
