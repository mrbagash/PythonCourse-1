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
          ['f', 'Von Neumann architecture']]],
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
    '1.1.1f': ['Von Neumann: data and instructions stored together in the same memory'],
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

  return {
    list: list, get: get, isValid: isValid, children: children, subTopics: subTopics, specPoints: specPoints,
    area: area, point: point, label: label, expand: expand, normaliseCode: normaliseCode,
    COMMAND_WORDS: COMMAND_WORDS, MIXUPS: MIXUPS, mixupsFor: mixupsFor, isCommandWord: isCommandWord
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = J277;
