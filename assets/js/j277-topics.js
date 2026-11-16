/**
 * j277-topics.js – OCR GCSE (9-1) Computer Science J277 topic list.
 *
 * Three levels: 1.1 (area) → 1.1.1 (spec point) → 1.1.1e (sub-topic).
 * Every test question and every mark is tagged at the sub-topic level, so
 * mistakes can be pinned down precisely. Draft from the J277 specification –
 * check and edit freely; codes are what the rest of the site stores.
 *
 * Also: command words and common mix-ups (used by the WCF, the Topic Codes
 * Guide and keyword marking).
 */
var J277 = (function () {
  var TREE = [
    ['1', 'Component 01: Computer systems', [
      ['1.1', 'Systems architecture', [
        ['1.1.1', 'Architecture of the CPU', [
          ['a', 'Purpose of the CPU and the fetch-execute cycle'],
          ['b', 'Arithmetic Logic Unit (ALU)'],
          ['c', 'Control Unit (CU)'],
          ['d', 'Cache'],
          ['e', 'Registers (PC, MAR, MDR, accumulator)'],
          ['f', 'How data and instructions are stored in memory']]],
        ['1.1.2', 'CPU performance', [
          ['a', 'Clock speed'],
          ['b', 'Cache size'],
          ['c', 'Number of cores']]],
        ['1.1.3', 'Embedded systems', [
          ['a', 'Purpose and characteristics of embedded systems'],
          ['b', 'Examples of embedded systems']]]]],
      ['1.2', 'Memory and storage', [
        ['1.2.1', 'Primary storage (memory)', [
          ['a', 'Need for primary storage'],
          ['b', 'Differences between RAM and ROM'],
          ['c', 'Purpose of ROM in a computer (boot-up / BIOS)'],
          ['d', 'Purpose of RAM in a computer'],
          ['e', 'Virtual memory']]],
        ['1.2.2', 'Secondary storage', [
          ['a', 'Need for secondary storage'],
          ['b', 'Optical storage'],
          ['c', 'Magnetic storage'],
          ['d', 'Solid state storage'],
          ['e', 'Characteristics: capacity, speed, portability, durability, reliability, cost'],
          ['f', 'Choosing a suitable storage device for a scenario']]],
        ['1.2.3', 'Units', [
          ['a', 'Units of data storage (bit, nibble, byte … petabyte)'],
          ['b', 'Why data is stored in binary'],
          ['c', 'Calculating file sizes and capacity requirements']]],
        ['1.2.4', 'Data storage', [
          ['a', 'Binary ↔ denary conversion'],
          ['b', 'Binary addition and overflow'],
          ['c', 'Hexadecimal conversions'],
          ['d', 'Binary shifts'],
          ['e', 'Characters and character sets (ASCII, Unicode)'],
          ['f', 'Images: pixels, colour depth, resolution, metadata'],
          ['g', 'Sound: sample rate, bit depth, duration']]],
        ['1.2.5', 'Compression', [
          ['a', 'Need for compression'],
          ['b', 'Lossy compression'],
          ['c', 'Lossless compression']]]]],
      ['1.3', 'Computer networks, connections and protocols', [
        ['1.3.1', 'Networks and topologies', [
          ['a', 'LANs and WANs'],
          ['b', 'Factors that affect network performance'],
          ['c', 'Client-server and peer-to-peer networks'],
          ['d', 'Network hardware (WAP, router, switch, NIC, transmission media)'],
          ['e', 'The Internet: DNS, hosting, the cloud, web servers and clients'],
          ['f', 'Star and mesh topologies']]],
        ['1.3.2', 'Wired and wireless networks, protocols and layers', [
          ['a', 'Ethernet, Wi-Fi and Bluetooth'],
          ['b', 'Encryption in networks'],
          ['c', 'IP addressing and MAC addressing'],
          ['d', 'Standards'],
          ['e', 'Common protocols (TCP/IP, HTTP, HTTPS, FTP, POP, IMAP, SMTP)'],
          ['f', 'The concept of layers']]]]],
      ['1.4', 'Network security', [
        ['1.4.1', 'Threats to computer systems and networks', [
          ['a', 'Malware'],
          ['b', 'Social engineering (e.g. phishing)'],
          ['c', 'Brute-force attacks'],
          ['d', 'Denial of service attacks'],
          ['e', 'Data interception and theft'],
          ['f', 'SQL injection']]],
        ['1.4.2', 'Identifying and preventing vulnerabilities', [
          ['a', 'Penetration testing'],
          ['b', 'Anti-malware software'],
          ['c', 'Firewalls'],
          ['d', 'User access levels'],
          ['e', 'Passwords'],
          ['f', 'Encryption'],
          ['g', 'Physical security']]]]],
      ['1.5', 'Systems software', [
        ['1.5.1', 'Operating systems', [
          ['a', 'User interface'],
          ['b', 'Memory management and multitasking'],
          ['c', 'Peripheral management and drivers'],
          ['d', 'User management'],
          ['e', 'File management']]],
        ['1.5.2', 'Utility software', [
          ['a', 'Encryption software'],
          ['b', 'Defragmentation'],
          ['c', 'Data compression software']]]]],
      ['1.6', 'Ethical, legal, cultural and environmental impacts', [
        ['1.6.1', 'Ethical, legal, cultural and environmental impact', [
          ['a', 'Ethical issues'],
          ['b', 'Legal issues'],
          ['c', 'Cultural issues'],
          ['d', 'Environmental issues'],
          ['e', 'Privacy issues'],
          ['f', 'Legislation (DPA 2018, CMA 1990, CDPA 1988)'],
          ['g', 'Software licences (open source vs proprietary)']]]]]]],
    ['2', 'Component 02: Computational thinking, algorithms and programming', [
      ['2.1', 'Algorithms', [
        ['2.1.1', 'Computational thinking', [
          ['a', 'Abstraction'],
          ['b', 'Decomposition'],
          ['c', 'Algorithmic thinking']]],
        ['2.1.2', 'Designing, creating and refining algorithms', [
          ['a', 'Identifying inputs, processes and outputs'],
          ['b', 'Structure diagrams'],
          ['c', 'Pseudocode / OCR Exam Reference Language'],
          ['d', 'Flowcharts'],
          ['e', 'Trace tables'],
          ['f', 'Identifying and correcting errors in algorithms']]],
        ['2.1.3', 'Searching and sorting algorithms', [
          ['a', 'Linear search'],
          ['b', 'Binary search'],
          ['c', 'Bubble sort'],
          ['d', 'Merge sort'],
          ['e', 'Insertion sort']]]]],
      ['2.2', 'Programming fundamentals', [
        ['2.2.1', 'Programming fundamentals', [
          ['a', 'Variables, constants, inputs, outputs and assignment'],
          ['b', 'Sequence'],
          ['c', 'Selection'],
          ['d', 'Iteration (count- and condition-controlled loops)'],
          ['e', 'Arithmetic operators (incl. MOD, DIV, ^)'],
          ['f', 'Comparison and Boolean operators']]],
        ['2.2.2', 'Data types', [
          ['a', 'Integer, real, Boolean, character and string'],
          ['b', 'Casting']]],
        ['2.2.3', 'Additional programming techniques', [
          ['a', 'String manipulation'],
          ['b', 'File handling'],
          ['c', 'Records and SQL'],
          ['d', 'Arrays (1D and 2D)'],
          ['e', 'Sub programs: functions, procedures, parameters, local/global variables'],
          ['f', 'Random number generation']]]]],
      ['2.3', 'Producing robust programs', [
        ['2.3.1', 'Defensive design', [
          ['a', 'Anticipating misuse'],
          ['b', 'Authentication'],
          ['c', 'Input validation'],
          ['d', 'Maintainability (comments, indentation, naming, sub programs)']]],
        ['2.3.2', 'Testing', [
          ['a', 'Purpose of testing'],
          ['b', 'Iterative and final/terminal testing'],
          ['c', 'Syntax errors and logic errors'],
          ['d', 'Test data: normal, boundary, invalid, erroneous'],
          ['e', 'Refining algorithms after testing']]]]],
      ['2.4', 'Boolean logic', [
        ['2.4.1', 'Boolean logic', [
          ['a', 'Logic gates AND, OR, NOT and their symbols'],
          ['b', 'Truth tables'],
          ['c', 'Combining operators / logic diagrams'],
          ['d', 'Applying logic to solve problems']]]]],
      ['2.5', 'Programming languages and IDEs', [
        ['2.5.1', 'Languages', [
          ['a', 'High-level and low-level languages'],
          ['b', 'Need for translators'],
          ['c', 'Compilers and interpreters']]],
        ['2.5.2', 'The Integrated Development Environment (IDE)', [
          ['a', 'Editors'],
          ['b', 'Error diagnostics'],
          ['c', 'Run-time environment'],
          ['d', 'Translators in the IDE']]]]]]]
  ];

  var COMMAND_WORDS = ['Add', 'Analyse', 'Calculate', 'Compare', 'Complete', 'Convert', 'Define', 'Describe',
    'Design', 'Discuss', 'Draw', 'Evaluate', 'Explain', 'Give', 'Identify', 'Justify', 'Label', 'List',
    'Outline', 'Refine', 'Show', 'State', 'Tick', 'Write'];

  // Common mix-ups per spec point / sub-topic – shown to teachers and in the guide.
  var MIXUPS = {
    '1.1.1a': ['Fetch-execute order is fetch → decode → execute (not decode first)'],
    '1.1.1b': ['The ALU does calculations and logic; the CU coordinates/decodes – not the other way round'],
    '1.1.1c': ['The CU decodes instructions and sends control signals; it does not do the arithmetic'],
    '1.1.1d': ['Cache is inside/near the CPU and faster than RAM; it is not secondary storage'],
    '1.1.1e': ['MAR holds an ADDRESS; MDR holds DATA or an INSTRUCTION',
               'PC holds the address of the NEXT instruction, not the current instruction',
               'The accumulator holds the result of calculations (from the ALU)'],
    '1.1.1f': ['Data and instructions are stored together in the same memory'],
    '1.1.2a': ['Clock speed = instructions (cycles) per second, measured in Hz – not storage size'],
    '1.1.2c': ['More cores only help if software can run tasks in parallel'],
    '1.2.1b': ['RAM is volatile; ROM is non-volatile', 'ROM is read-only; RAM is read/write'],
    '1.2.1e': ['Virtual memory uses secondary storage when RAM is full; it is slower, not extra RAM'],
    '1.2.2c': ['Magnetic storage has moving parts; solid state has none'],
    '1.2.3a': ['1 byte = 8 bits; 1 nibble = 4 bits; KB = 1000 bytes in J277'],
    '1.2.4d': ['Left shift multiplies by 2; right shift divides by 2'],
    '1.2.4f': ['Colour depth = bits per pixel; resolution = number of pixels'],
    '1.2.4g': ['Sample rate = samples per second (Hz); bit depth = bits per sample'],
    '1.2.5b': ['Lossy permanently removes data; lossless can restore the original exactly'],
    '1.3.1a': ['LAN covers a small geographical area; WAN a large one (owned by others)'],
    '1.3.1d': ['A switch sends data to the correct device on a LAN; a router sends data between networks'],
    '1.3.2c': ['IP addresses can change (logical); MAC addresses are fixed to the hardware (physical)'],
    '1.4.2c': ['A firewall filters network traffic; it does not remove viruses (anti-malware does)'],
    '1.5.2b': ['Defragmentation is for magnetic (HDD) drives, not SSDs'],
    '2.1.3b': ['Binary search needs SORTED data; linear search does not'],
    '2.2.2a': ['Real = decimal number; integer = whole number', 'A character is a single symbol; a string is several'],
    '2.3.2c': ['Syntax error = breaks the language rules (won\'t run); logic error = runs but gives the wrong result'],
    '2.3.2d': ['Boundary data is at the edge of the valid range; erroneous/invalid data should be rejected'],
    '2.5.1c': ['A compiler translates the whole program at once; an interpreter line by line']
  };

  // Feedback codes: one per common mix-up, plus exam technique. Used in marking, individual
  // feedback and the WCF. `subjects` + `wrong` let the marker suggest a code automatically
  // (e.g. a sentence about the MDR whose stored thing is "address" → R1).
  var FEEDBACK_CODES = [
    { id: 'C1', topics: ['1.1.1a'], text: 'Fetch-execute order is fetch → decode → execute' },
    { id: 'C2', topics: ['1.1.1b', '1.1.1c'], text: 'ALU does calculations/logic; CU decodes and sends control signals', subjects: ['alu', 'cu'], wrong: ['decode', 'signal', 'calculation', 'arithmetic'] },
    { id: 'C3', topics: ['1.1.1d'], text: 'Cache is fast memory in/near the CPU for frequently used data – not secondary storage' },
    { id: 'R1', topics: ['1.1.1e'], text: 'MAR holds an ADDRESS; MDR holds DATA or an INSTRUCTION', subjects: ['mar', 'mdr'], wrong: ['address', 'data', 'instruction'] },
    { id: 'R2', topics: ['1.1.1e'], text: 'PC holds the address of the NEXT instruction (not the current one)', subjects: ['pc'], wrong: ['instruction', 'address', 'data'] },
    { id: 'R3', topics: ['1.1.1e'], text: 'The accumulator holds the result of calculations from the ALU', subjects: ['acc'], wrong: ['address', 'instruction'] },
    { id: 'C4', topics: ['1.1.1f'], text: 'Data and instructions are stored together in the same memory' },
    { id: 'P1', topics: ['1.1.2a'], text: 'Clock speed = cycles/instructions per second (Hz), not storage' },
    { id: 'P2', topics: ['1.1.2c'], text: 'More cores only help if the program can run tasks in parallel' },
    { id: 'M1', topics: ['1.2.1b'], text: 'RAM is volatile and read/write; ROM is non-volatile and read-only' },
    { id: 'M2', topics: ['1.2.1e'], text: 'Virtual memory uses secondary storage when RAM is full – it is slower, not extra RAM' },
    { id: 'S1', topics: ['1.2.2c', '1.2.2d'], text: 'Magnetic storage has moving parts; solid state has none' },
    { id: 'D1', topics: ['1.2.3a'], text: 'Units: 1 nibble = 4 bits, 1 byte = 8 bits, 1 KB = 1000 bytes' },
    { id: 'D2', topics: ['1.2.4d'], text: 'Left shift multiplies by 2 per place; right shift divides' },
    { id: 'D3', topics: ['1.2.4f'], text: 'Colour depth = bits per pixel; resolution = number of pixels' },
    { id: 'D4', topics: ['1.2.4g'], text: 'Sample rate = samples per second; bit depth = bits per sample' },
    { id: 'D5', topics: ['1.2.5b', '1.2.5c'], text: 'Lossy permanently removes data; lossless can restore the original' },
    { id: 'N1', topics: ['1.3.1a'], text: 'LAN = small area; WAN = large area, using infrastructure owned by others' },
    { id: 'N2', topics: ['1.3.1d'], text: 'A switch sends data to devices on a LAN; a router sends data between networks', subjects: ['switch', 'router'] },
    { id: 'N3', topics: ['1.3.2c'], text: 'IP addresses are logical and can change; MAC addresses are fixed to the hardware' },
    { id: 'N4', topics: ['1.4.2c', '1.4.2b'], text: 'A firewall filters network traffic; anti-malware removes malware' },
    { id: 'O1', topics: ['1.5.2b'], text: 'Defragmentation is for magnetic hard drives, not SSDs' },
    { id: 'A1', topics: ['2.1.3a', '2.1.3b'], text: 'Binary search needs SORTED data; linear search does not' },
    { id: 'A2', topics: ['2.2.2a'], text: 'Real = decimal number, integer = whole number, character = one symbol, string = several' },
    { id: 'T1', topics: ['2.3.2c'], text: 'Syntax error = breaks the language rules (won\'t run); logic error = runs but wrong result' },
    { id: 'T2', topics: ['2.3.2d'], text: 'Boundary data is at the edge of the valid range; erroneous data should be rejected' },
    { id: 'L1', topics: ['2.5.1c'], text: 'Compiler translates the whole program at once; interpreter translates line by line', subjects: ['compiler', 'interpreter'], wrong: ['line', 'program', 'code'] },
    // Finer programming / data mix-ups (skill level)
    { id: 'I1', topics: ['2.2.1d'], skill: 'for', text: 'A for loop is count-controlled: it repeats a set number of times. In ERL "for i = 1 to 5" runs 5 times; in Python range(1, 5) stops BEFORE 5' },
    { id: 'I2', topics: ['2.2.1d'], skill: 'while', text: 'A while loop is condition-controlled: it repeats WHILE the condition is true, and something inside must change it or it never stops' },
    { id: 'I3', topics: ['2.2.1d'], skill: 'choose', text: 'Use a for loop when you know how many times to repeat; use a while (or do-until) loop when it depends on a condition' },
    { id: 'I4', topics: ['2.2.1d'], skill: 'while', text: 'A while loop checks its condition BEFORE each pass (it may run 0 times); do-until checks AFTER (it always runs at least once)' },
    { id: 'I5', topics: ['2.2.1d'], skill: 'nested', text: 'Nested loops: the inner loop runs completely for EACH pass of the outer loop (outer × inner times)' },
    { id: 'Q1', topics: ['2.2.1c'], text: 'if / elseif / else: only the FIRST true branch runs, then the rest are skipped' },
    { id: 'Q2', topics: ['2.2.1f'], text: '= assigns a value; == compares two values' },
    { id: 'Q3', topics: ['2.2.1f', '2.2.1c'], text: '< and <= are different: check whether the boundary value itself is included' },
    { id: 'Q4', topics: ['2.2.1e'], text: 'DIV gives the whole number part of a division; MOD gives the remainder' },
    { id: 'Q5', topics: ['2.2.3d'], text: 'Arrays start at index 0: the first item is array[0], the last is array[length - 1]' },
    { id: 'Q6', topics: ['2.2.3e'], text: 'A function returns a value; a procedure does not' },
    { id: 'Q7', topics: ['2.2.3e'], text: 'A local variable only exists inside its sub program; a global variable can be used anywhere' },
    { id: 'Q8', topics: ['2.2.3a'], text: 'String positions start at 0; .length counts characters; substring(start, n) takes n characters' },
    { id: 'Q9', topics: ['2.2.2b'], text: 'Input is a string: cast it with int() / float() before doing maths; str() before joining with text' },
    { id: 'B1', topics: ['2.4.1a', '2.4.1b', '2.4.1c'], text: 'AND is 1 only when BOTH inputs are 1; OR is 1 when AT LEAST one input is 1; NOT flips the input' },
    { id: 'B2', topics: ['1.2.4a', '1.2.4b'], text: 'Binary place values double from the right: 1, 2, 4, 8, 16, 32, 64, 128' },
    { id: 'B3', topics: ['1.2.4b'], text: 'In binary addition 1 + 1 = 10 (write 0, carry 1); 1 + 1 + 1 = 11 (write 1, carry 1). A carry out of 8 bits is overflow' },
    { id: 'B4', topics: ['1.2.4c'], text: 'Hex digits go 0–9 then A=10 … F=15; one hex digit = 4 bits (a nibble)' },
    { id: 'B5', topics: ['1.2.3c'], text: 'Image size = width × height × colour depth (bits); sound = sample rate × bit depth × seconds. Divide by 8 for bytes' },
    { id: 'G1', topics: ['2.1.3c', '2.1.3e', '2.1.3d'], text: 'Bubble sort swaps neighbouring pairs; insertion sort inserts each item into the sorted part; merge sort splits then merges' },
    { id: 'G2', topics: ['2.1.2e'], text: 'In a trace table write a new row each time a variable changes, and follow the loop condition exactly' },
    { id: 'H1', topics: ['1.4.1a', '1.4.1b'], text: 'Malware is software; phishing / social engineering tricks a PERSON into giving information' },
    { id: 'H2', topics: ['1.3.2e'], text: 'HTTP/HTTPS = web pages; SMTP = sending email; POP/IMAP = receiving email; FTP = transferring files' },
    // Exam technique (any topic)
    { id: 'E1', topics: [], exam: true, text: 'Explain = make a point AND say why (because / so / therefore)' },
    { id: 'E2', topics: [], exam: true, text: 'Use precise technical vocabulary' },
    { id: 'E3', topics: [], exam: true, text: 'Read the question and command word – answer what is asked' },
    { id: 'E4', topics: [], exam: true, text: 'Always attempt every question – a blank cannot score' },
    { id: 'E5', topics: [], exam: true, text: 'Show your working in calculations' },
    { id: 'E6', topics: [], exam: true, text: 'Give one clear answer – giving two answers (one wrong) loses the mark' }
  ];

  var list = [];      // every node: {code, title, level, parent}
  var byCode = {};
  function add(code, title, level, parent) {
    var node = { code: code, title: title, level: level, parent: parent || null };
    list.push(node); byCode[code] = node;
  }
  TREE.forEach(function (comp) {
    add(comp[0], comp[1], 0, null);
    comp[2].forEach(function (area) {
      add(area[0], area[1], 1, comp[0]);
      area[2].forEach(function (point) {
        add(point[0], point[1], 2, area[0]);
        point[2].forEach(function (sub) { add(point[0] + sub[0], sub[1], 3, point[0]); });
      });
    });
  });

  function normaliseCode(code) {
    return String(code || '').trim().toLowerCase().replace(/\s+/g, '');
  }
  function get(code) { return byCode[normaliseCode(code)] || null; }
  function isValid(code) { return !!get(code) && get(code).level >= 2; }
  function children(code) { return list.filter(function (n) { return n.parent === code; }); }
  function subTopics() { return list.filter(function (n) { return n.level === 3; }); }
  function specPoints() { return list.filter(function (n) { return n.level === 2; }); }
  function area(code) { var n = get(code); while (n && n.level > 1) n = byCode[n.parent]; return n; }
  function point(code) { var n = get(code); while (n && n.level > 2) n = byCode[n.parent]; return n; }
  // "1.1.1e Registers (…)"
  function label(code) { var n = get(code); return n ? n.code + ' ' + n.title : String(code || ''); }
  // Sub-topics covered by a code (a spec point covers all of its sub-topics).
  function expand(code) {
    var n = get(code);
    if (!n) return [];
    if (n.level === 3) return [n.code];
    var out = [];
    list.forEach(function (m) { if (m.level === 3 && (m.code.indexOf(n.code) === 0)) out.push(m.code); });
    return out;
  }
  function mixupsFor(code) {
    var n = get(code); var out = [];
    if (!n) return out;
    if (MIXUPS[n.code]) out = out.concat(MIXUPS[n.code]);
    var p = point(code);
    if (p && p.code !== n.code && MIXUPS[p.code]) out = out.concat(MIXUPS[p.code]);
    return out;
  }
  function isCommandWord(w) {
    return COMMAND_WORDS.some(function (c) { return c.toLowerCase() === String(w || '').trim().toLowerCase(); });
  }

  function feedbackCode(id) {
    return FEEDBACK_CODES.filter(function (c) { return c.id === String(id || '').trim().toUpperCase(); })[0] || null;
  }
  function codesForTopic(code) {
    var n = normaliseCode(code);
    var p = point(n);
    return FEEDBACK_CODES.filter(function (c) {
      return c.topics.some(function (t) { return t === n || (p && t === p.code) || n.indexOf(t) === 0; });
    });
  }

  // Skills: finer detail inside sub-topics that bundle different things (e.g. for vs while loops).
  // Mastery is tracked per topic + skill, so needs can be pinned down precisely.
  var SKILLS = {
    '2.2.1d': [['for', 'for loops (count-controlled)'], ['while', 'while loops (condition-controlled)'], ['dountil', 'do-until loops'], ['nested', 'nested loops'], ['choose', 'choosing the right loop']],
    '2.2.1c': [['if', 'if / else'], ['elif', 'elseif chains'], ['nested', 'nested selection'], ['switch', 'switch / case']],
    '2.2.1e': [['basic', '+ − * /'], ['divmod', 'DIV and MOD'], ['power', 'exponent ^']],
    '2.2.1f': [['compare', 'comparison operators'], ['boolean', 'AND / OR / NOT in conditions']],
    '2.2.1a': [['vars', 'variables and constants'], ['io', 'input and output'], ['assign', 'assignment']],
    '2.2.2a': [['numbers', 'integer and real'], ['bool', 'Boolean'], ['text', 'character and string']],
    '2.2.3a': [['length', 'length'], ['substring', 'substring / slicing'], ['case', 'upper / lower'], ['concat', 'concatenation'], ['ascii', 'ASC / CHR']],
    '2.2.3d': [['1d', '1D arrays'], ['2d', '2D arrays'], ['loop', 'looping through arrays']],
    '2.2.3e': [['func', 'functions (return values)'], ['proc', 'procedures'], ['params', 'parameters'], ['scope', 'local and global variables']],
    '2.2.3c': [['records', 'records and fields'], ['select', 'SQL SELECT … FROM … WHERE']],
    '2.4.1a': [['and', 'AND'], ['or', 'OR'], ['not', 'NOT'], ['symbols', 'gate symbols']],
    '2.4.1b': [['two', 'two-input truth tables'], ['three', 'three-input / combined truth tables']],
    '1.2.4a': [['b2d', 'binary → denary'], ['d2b', 'denary → binary']],
    '1.2.4b': [['add', 'binary addition'], ['overflow', 'overflow']],
    '1.2.4c': [['h2d', 'hex ↔ denary'], ['h2b', 'hex ↔ binary']],
    '1.2.4d': [['left', 'left shifts'], ['right', 'right shifts'], ['effect', 'effect / loss of bits']],
    '1.2.3c': [['image', 'image file size'], ['sound', 'sound file size'], ['text', 'text file size'], ['capacity', 'capacity needed']],
    '2.1.2e': [['loop', 'tracing loops'], ['selection', 'tracing selection'], ['output', 'predicting output']],
    '2.3.2d': [['normal', 'normal data'], ['boundary', 'boundary data'], ['invalid', 'invalid / erroneous data']],
    '1.3.2e': [['web', 'HTTP / HTTPS'], ['email', 'SMTP / POP / IMAP'], ['ftp', 'FTP'], ['tcpip', 'TCP/IP']]
  };
  function skillsFor(code) { return SKILLS[normaliseCode(code)] || []; }
  function skillLabel(code, skill) {
    var s = skillsFor(code).filter(function (x) { return x[0] === skill; })[0];
    return s ? s[1] : '';
  }

  return {
    SKILLS: SKILLS, skillsFor: skillsFor, skillLabel: skillLabel,
    FEEDBACK_CODES: FEEDBACK_CODES, feedbackCode: feedbackCode, codesForTopic: codesForTopic,
    list: list, get: get, isValid: isValid, children: children, subTopics: subTopics, specPoints: specPoints,
    area: area, point: point, label: label, expand: expand, normaliseCode: normaliseCode,
    COMMAND_WORDS: COMMAND_WORDS, MIXUPS: MIXUPS, mixupsFor: mixupsFor, isCommandWord: isCommandWord
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = J277;
