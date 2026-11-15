/**
 * gcse-starter-bank.js – built-in starter questions for the GCSE question bank.
 *
 * Original exam-style questions written in the style of the questions that come up
 * year after year on OCR J277 papers. They are NOT copies of OCR past papers (those
 * are OCR's copyright), so each is labelled "J277 exam-style" instead of a paper/question
 * reference. Real past-paper questions go in the "GCSE Question Bank" Google Sheet and are
 * used alongside these. Short-answer questions only go live if they pass their test answers.
 */
var GCSE_STARTER_BANK = (function () {
  var SRC = 'J277 exam-style (starter bank)';
  var rows = [];
  var n = 0;
  function id() { n++; return 'S-' + String(n).padStart(3, '0'); }
  function base(paper, topic, command, marks, type, question) {
    return { id: id(), paper: String(paper), topics: [topic], command: command, marks: marks, type: type, question: question,
      options: [], answer: '', markScheme: '', rules: '', tests: '', source: SRC, rewordedFrom: '', starter: true };
  }
  function mcq(paper, topic, question, options, letter) {
    var r = base(paper, topic, 'Identify', 1, 'mcq', question);
    r.options = options; r.answer = letter;
    rows.push(r);
  }
  function short(paper, topic, command, marks, question, scheme, rules, tests) {
    var r = base(paper, topic, command, marks, 'short', question);
    r.markScheme = scheme; r.rules = rules; r.tests = tests;
    rows.push(r);
  }
  function long(paper, topic, command, marks, question, scheme) {
    var r = base(paper, topic, command, marks, 'long', question);
    r.markScheme = scheme;
    rows.push(r);
  }

  // ── Paper 1: Computer systems ───────────────────────────────
  mcq(1, '1.1.1a', 'Which is the correct order of the stages the CPU repeats to run instructions?', ['Decode, fetch, execute', 'Fetch, decode, execute', 'Execute, fetch, decode', 'Fetch, execute, decode'], 'B');
  mcq(1, '1.1.1b', 'Which part of the CPU carries out calculations and logical comparisons?', ['Control Unit', 'Arithmetic Logic Unit', 'Cache', 'Memory Address Register'], 'B');
  mcq(1, '1.1.1c', 'Which part of the CPU decodes instructions and sends out control signals?', ['ALU', 'Cache', 'Control Unit', 'Accumulator'], 'C');
  mcq(1, '1.1.1e', 'Which register holds the address of the next instruction to be fetched?', ['MAR', 'MDR', 'Program Counter', 'Accumulator'], 'C');
  mcq(1, '1.1.1e', 'Which register holds the data or instruction that has just been fetched from memory?', ['MDR', 'Program Counter', 'MAR', 'ALU'], 'A');
  mcq(1, '1.1.1f', 'In Von Neumann architecture, data and instructions are…', ['stored in separate memories', 'stored together in the same memory', 'only stored in cache', 'only stored in secondary storage'], 'B');
  mcq(1, '1.1.2a', 'What unit is clock speed measured in?', ['Bytes', 'Hertz (Hz)', 'Pixels', 'Bits per pixel'], 'B');
  mcq(1, '1.1.2c', 'Why might a quad-core CPU not run a program four times faster than a single-core CPU?', ['The program may not be able to be split into tasks that run at the same time', 'Each core has less RAM', 'Extra cores reduce the clock speed', 'Quad-core CPUs have no cache'], 'A');
  mcq(1, '1.1.3a', 'Which is the best description of an embedded system?', ['A computer system with a dedicated function inside a larger device', 'A general-purpose desktop computer', 'A type of secondary storage', 'A program that translates code'], 'A');
  mcq(1, '1.2.1b', 'Which of these is volatile?', ['ROM', 'RAM', 'SSD', 'HDD'], 'B');
  mcq(1, '1.2.1c', 'Which type of memory stores the start-up (boot) instructions?', ['RAM', 'Cache', 'ROM', 'Virtual memory'], 'C');
  mcq(1, '1.2.1e', 'When is virtual memory used?', ['When RAM is full', 'When the CPU overheats', 'When ROM is full', 'When the hard disk is empty'], 'A');
  mcq(1, '1.2.2d', 'Which type of storage has no moving parts?', ['Magnetic hard disk', 'Solid state drive', 'Optical disc', 'Magnetic tape'], 'B');
  mcq(1, '1.2.2b', 'Which of these is an example of optical storage?', ['USB flash drive', 'Blu-ray disc', 'Hard disk drive', 'SD card'], 'B');
  mcq(1, '1.2.3a', 'How many bits are in a nibble?', ['2', '4', '8', '16'], 'B');
  mcq(1, '1.2.3a', 'In J277, how many bytes are in 1 kilobyte?', ['8', '1000', '100', '10'], 'B');
  mcq(1, '1.2.4a', 'What is the binary number 1010 1100 in denary?', ['172', '168', '202', '236'], 'A');
  mcq(1, '1.2.4c', 'What is the denary number 200 in hexadecimal?', ['C8', 'B8', '8C', 'D0'], 'A');
  mcq(1, '1.2.4d', 'What is the effect of a 2-place left binary shift?', ['Divides the number by 4', 'Multiplies the number by 4', 'Multiplies the number by 2', 'Adds 2 to the number'], 'B');
  mcq(1, '1.2.4b', 'What is an overflow error in binary addition?', ['When the result needs more bits than are available', 'When the result is negative', 'When the answer is zero', 'When both numbers are the same'], 'A');
  mcq(1, '1.2.4e', 'Why does Unicode use more bits per character than ASCII?', ['To represent many more characters, including other languages', 'To make text files smaller', 'Because it is an older character set', 'To store images in text'], 'A');
  mcq(1, '1.2.4f', 'What is meant by colour depth?', ['The number of bits used for each pixel', 'The number of pixels in the image', 'The height of the image', 'The file size of the image'], 'A');
  mcq(1, '1.2.4g', 'What is meant by sample rate?', ['The number of samples taken each second', 'The number of bits used for each sample', 'The length of the recording', 'The volume of the sound'], 'A');
  mcq(1, '1.2.5c', 'Which type of compression lets the original file be restored exactly?', ['Lossy', 'Lossless', 'Both', 'Neither'], 'B');
  mcq(1, '1.3.1a', 'Which type of network covers a large geographical area?', ['LAN', 'WAN', 'Star', 'Mesh'], 'B');
  mcq(1, '1.3.1d', 'Which device sends data to the correct device within a LAN?', ['Router', 'Switch', 'Wireless access point', 'Modem'], 'B');
  mcq(1, '1.3.1e', 'What does DNS do?', ['Converts domain names into IP addresses', 'Encrypts web pages', 'Stores web pages', 'Blocks malware'], 'A');
  mcq(1, '1.3.1f', 'Which describes a mesh topology?', ['Every device connects to one central switch', 'Devices are connected to each other with more than one possible route', 'All devices share one cable', 'There is only one route between any two devices'], 'B');
  mcq(1, '1.3.2c', 'Which address is fixed to the network hardware when it is made?', ['IP address', 'MAC address', 'URL', 'Domain name'], 'B');
  mcq(1, '1.3.2e', 'Which protocol is used to send emails to a mail server?', ['SMTP', 'HTTP', 'FTP', 'IMAP'], 'A');
  mcq(1, '1.3.2e', 'Which protocol encrypts web traffic between a browser and a web server?', ['HTTP', 'HTTPS', 'FTP', 'POP'], 'B');
  mcq(1, '1.4.1b', 'An email pretending to be from a bank and asking for your password is an example of…', ['A brute-force attack', 'Phishing', 'SQL injection', 'Denial of service'], 'B');
  mcq(1, '1.4.1c', 'Which describes a brute-force attack?', ['Trying many possible passwords until one works', 'Flooding a server with requests', 'Entering database code into an input box', 'Tricking people into giving their details'], 'A');
  mcq(1, '1.4.1d', 'Which attack floods a server with requests so it cannot respond to real users?', ['Phishing', 'Denial of service', 'SQL injection', 'Data interception'], 'B');
  mcq(1, '1.4.1f', 'Which attack enters database commands into a website\'s input box?', ['SQL injection', 'Brute force', 'Phishing', 'Data interception'], 'A');
  mcq(1, '1.4.2a', 'What is penetration testing?', ['Testing a system\'s security by trying to find and exploit weaknesses', 'Testing how fast a network is', 'Removing malware from a computer', 'Checking a program for syntax errors'], 'A');
  mcq(1, '1.5.1b', 'Which operating system function allows several programs to be open at the same time?', ['User management', 'Memory management / multitasking', 'File management', 'Encryption'], 'B');
  mcq(1, '1.5.1c', 'What does a device driver do?', ['Lets the operating system communicate with a hardware device', 'Defragments the hard disk', 'Compresses files', 'Encrypts data'], 'A');
  mcq(1, '1.6.1f', 'Which law makes it illegal to gain unauthorised access to computer material?', ['Data Protection Act 2018', 'Computer Misuse Act 1990', 'Copyright, Designs and Patents Act 1988', 'Freedom of Information Act 2000'], 'B');
  mcq(1, '1.6.1g', 'Which statement about open source software is true?', ['Users can view and change the source code', 'It can never be used by businesses', 'It always costs money', 'It has no licence at all'], 'A');

  short(1, '1.1.1e', 'State', 1, 'State the purpose of the Memory Address Register (MAR).',
    'Holds the address (of the data/instruction) to be fetched from or written to memory.',
    '[MAR] holds|stores|contains|keeps -> address ! data|instruction',
    '1 | The MAR holds the address of the data or instruction to be fetched\n1 | It stores the memory address that is about to be used\n0 | The MAR stores the data being fetched\n0 | It holds the address or the data\n0 | The MDR holds the address');
  short(1, '1.1.1e', 'State', 1, 'State the purpose of the Memory Data Register (MDR).',
    'Holds the data or instruction fetched from memory / waiting to be written to memory.',
    '[MDR] holds|stores|contains|keeps -> data|instruction ! address',
    '1 | The MDR stores the data fetched from memory\n1 | It holds the data fetched from the address in the MAR\n0 | The MDR stores the address of the current instruction to be fetched\n0 | It stores the address or data\n0 | The MAR holds the data');
  short(1, '1.1.1e', 'State', 1, 'State the purpose of the Program Counter (PC).',
    'Holds the address of the next instruction to be fetched.',
    '[PC] holds|stores|contains|keeps -> address+next ! instruction|address+current|data',
    '1 | The PC holds the address of the next instruction\n1 | The program counter stores the address of the next instruction to be fetched\n0 | The PC holds the current instruction\n0 | It stores the address of the current instruction\n0 | The PC holds data');
  short(1, '1.1.1e', 'State', 1, 'State the purpose of the accumulator.',
    'Holds the result of calculations carried out by the ALU.',
    '[ACC] holds|stores|contains|keeps -> result|answer ! address|instruction',
    '1 | The accumulator stores the result of calculations done by the ALU\n1 | It holds the results from the ALU\n0 | The accumulator stores the address of the next instruction\n0 | It holds the result or the address');
  short(1, '1.1.1d', 'Describe', 2, 'Describe the purpose of cache in the CPU.',
    'Stores frequently used data/instructions (1)\nso they can be accessed faster than from RAM (1)',
    '=frequently|often|regularly|commonly|recently\n=faster|quicker|quickly|speed|speeds up',
    '2 | Cache stores frequently used data so the CPU can access it faster\n1 | Cache stores data that is used often\n1 | It makes the CPU access instructions more quickly\n0 | Cache is a type of secondary storage\n0 | It stores the operating system when the computer is off');
  short(1, '1.1.2a', 'State', 1, 'State what the clock speed of a CPU measures.',
    'The number of (fetch-execute) cycles / instructions processed each second.',
    '=second|hz|hertz & cycle|instruction',
    '1 | The number of fetch-execute cycles carried out each second\n1 | How many instructions the CPU can process per second\n0 | The amount of data the CPU can store\n0 | How much RAM the computer has');
  short(1, '1.2.5b', 'Describe', 2, 'Describe what is meant by lossy compression.',
    'Some data is removed / deleted from the file (1)\nThe removal is permanent – the original cannot be restored (1)',
    '=remove|removes|removed|delete|deletes|deleted|discard|discards|discarded|lost|lose|loses|thrown away\n=permanent|permanently|cannot be restored|cannot be recovered|cannot be got back|not be restored',
    '2 | Lossy compression permanently removes some data from the file\n1 | Some data is removed to make the file smaller\n0 | The file is made smaller and the original can be restored exactly\n0 | It reorders the data to save space');
  short(1, '1.3.1d', 'State', 1, 'State the purpose of a router.',
    'Sends/forwards data (packets) between different networks, e.g. a LAN and the internet.',
    '=between networks|between different networks|different networks|other networks|connects networks|connect networks|lan to the internet|lan to a wan|to the internet',
    '1 | A router sends data packets between different networks\n1 | It connects a LAN to the internet\n0 | It sends data to the correct device on the same LAN\n0 | It stores websites');
  short(1, '1.4.2c', 'State', 1, 'State what a firewall does.',
    'Monitors/filters incoming and outgoing network traffic, blocking unauthorised access.',
    '=traffic|incoming|outgoing|unauthorised access|unauthorized access',
    '1 | It monitors incoming and outgoing network traffic\n1 | It blocks unauthorised access to the network\n0 | It removes viruses from the computer\n0 | It scans files for malware');
  short(1, '1.5.2b', 'Describe', 2, 'Describe what defragmentation software does.',
    'Moves the parts (fragments) of files so they are stored next to each other / together (1)\nso files can be read faster (1)',
    '=together|next to each other|contiguous|same area|same place|in order\n=faster|quicker|quickly|speed|less time',
    '2 | It moves parts of files so they are stored together, so files can be read faster\n1 | It puts file fragments back next to each other\n0 | It deletes unwanted files to free up space\n0 | It compresses files');

  long(1, '1.1.2a', 'Explain', 2, 'Explain how increasing the clock speed can improve the performance of a CPU.',
    'More fetch-execute cycles / instructions can be carried out per second\nSo programs / tasks are completed faster');
  long(1, '1.4.2a', 'Describe', 4, 'Describe two ways a company could protect its network from attack.',
    'Firewall – filters incoming/outgoing traffic, blocking unauthorised access\nAnti-malware – scans for and removes malware\nStrong passwords – harder to guess / brute force\nUser access levels – users can only access what they need\nEncryption – intercepted data cannot be understood\nPenetration testing – finds weaknesses before attackers do');
  long(1, '1.6.1d', 'Discuss', 4, 'Discuss the environmental impact of people replacing their smartphones every year.',
    'E-waste: old devices dumped / sent to landfill, toxic materials\nMining rare metals damages the environment\nManufacturing and charging use energy / carbon emissions\nRecycling / refurbishing reduces the impact\nBalanced point: new phones may be more energy efficient');
  long(1, '1.2.2f', 'Justify', 3, 'Justify a suitable type of storage for a digital camera.',
    'Solid state (e.g. SD card)\nDurable / no moving parts so it is not damaged if dropped\nSmall and light / portable\nLarge enough capacity and fast to write photos');

  // ── Paper 2: Computational thinking, algorithms and programming ─
  mcq(2, '2.1.3a', 'Which search checks each item in turn from the start of the list?', ['Binary search', 'Linear search', 'Merge search', 'Bubble search'], 'B');
  mcq(2, '2.1.3b', 'Which search needs the data to be sorted first?', ['Linear search', 'Binary search'], 'B');
  mcq(2, '2.1.3c', 'Which sort repeatedly swaps adjacent items that are in the wrong order?', ['Merge sort', 'Insertion sort', 'Bubble sort', 'Binary sort'], 'C');
  mcq(2, '2.1.3d', 'Which sort splits the list into single items and then merges them back together in order?', ['Bubble sort', 'Merge sort', 'Insertion sort', 'Linear sort'], 'B');
  mcq(2, '2.2.1e', 'What is 17 MOD 5?', ['3', '2', '12', '85'], 'B');
  mcq(2, '2.2.1e', 'What is 17 DIV 5?', ['3', '2', '3.4', '12'], 'A');
  mcq(2, '2.2.1d', 'Which of these is a condition-controlled loop?', ['for i = 0 to 9', 'while answer != "yes"', 'for each item in list', 'None of these'], 'B');
  mcq(2, '2.2.2b', 'Converting the string "42" into the integer 42 is called…', ['Concatenation', 'Casting', 'Validation', 'Iteration'], 'B');
  mcq(2, '2.2.3e', 'Which statement about a local variable is true?', ['It can only be used inside the sub program where it is declared', 'It can be used anywhere in the program', 'Its value can never change', 'It is stored in ROM'], 'A');
  mcq(2, '2.3.2d', 'A program accepts ages from 11 to 16. Which is boundary test data?', ['13', '16', 'abc', '-5'], 'B');
  mcq(2, '2.4.1a', 'Which logic gate outputs 1 only when both inputs are 1?', ['OR', 'NOT', 'AND', 'XOR'], 'C');
  mcq(2, '2.4.1b', 'What is the output of NOT (1 OR 0)?', ['1', '0'], 'B');
  mcq(2, '2.5.1b', 'Why are translators needed?', ['Computers can only run machine code', 'To make programs run more slowly', 'To store programs', 'To encrypt programs'], 'A');
  mcq(2, '2.5.2b', 'Which IDE feature helps find and explain errors in code?', ['Error diagnostics', 'Run-time environment', 'Colour themes', 'Auto-save'], 'A');

  short(2, '2.1.1a', 'Define', 1, 'Define the term abstraction.',
    'Removing / hiding unnecessary detail from a problem (to focus on what is important).',
    '=remove|removing|removed|ignore|ignoring|hide|hiding|leave out|leaving out|filter|filtering & detail|details|unnecessary|irrelevant',
    '1 | Removing unnecessary detail from a problem\n1 | Hiding details that are not important\n0 | Breaking a problem down into smaller parts\n0 | Writing the steps to solve a problem');
  short(2, '2.1.1b', 'Define', 1, 'Define the term decomposition.',
    'Breaking a problem down into smaller (sub-)problems.',
    '=break|breaking|split|splitting|divide|dividing & smaller|sub|parts|problems',
    '1 | Breaking a problem down into smaller parts\n1 | Splitting a big problem into sub-problems\n0 | Removing unnecessary detail\n0 | Hiding details from the user');
  short(2, '2.1.3b', 'State', 1, 'State one requirement for a binary search to be used.',
    'The data must be sorted / in order.',
    '=sorted|ordered|in order',
    '1 | The data must be sorted\n1 | The list has to be in order\n0 | The data does not need to be sorted\n0 | It checks every item one by one');
  short(2, '2.2.2a', 'State', 1, 'State the most suitable data type to store the price of an item, such as 4.99.',
    'Real / float.',
    '=real|float|decimal',
    '1 | Real\n1 | float\n0 | Integer\n0 | String');
  short(2, '2.3.1c', 'State', 1, 'State what is meant by input validation.',
    'Checking that data entered is sensible / reasonable / meets set rules (e.g. range, format, length) before it is used.',
    '=sensible|reasonable|meets|criteria|rules|valid|range|format|acceptable|allowed|presence|length',
    '1 | Checking that the data entered is sensible and within range\n1 | Making sure input meets set rules before it is used\n0 | Making a backup of the data\n0 | Encrypting the data');
  short(2, '2.3.2c', 'Describe', 1, 'Describe what is meant by a logic error.',
    'The program runs but gives an unexpected / incorrect output or result.',
    '=wrong output|wrong result|wrong answer|incorrect output|incorrect result|unexpected output|unexpected result|not as intended|not what was expected',
    '1 | The program runs but gives the wrong result\n1 | The code produces an unexpected output\n0 | The code breaks the rules of the language so it will not run\n0 | A typing mistake');
  short(2, '2.5.1c', 'State', 1, 'State one difference between a compiler and an interpreter.',
    'A compiler translates the whole program at once; an interpreter translates (and runs) it one line at a time.',
    '[compiler] translates|converts|compiles -> program+whole|code+whole|program+all|code+all|program+once|code+once|program+go|code+go ! line\n[interpreter] translates|converts|runs|executes -> line ! program+whole|code+whole|program+once|code+once\nmax 1',
    '1 | A compiler translates the whole program at once\n1 | An interpreter translates the code line by line\n0 | A compiler translates the code line by line\n0 | An interpreter translates the whole program at once\n0 | They are both translators');

  long(2, '2.1.3b', 'Describe', 4, 'Describe how a binary search finds an item in a list.',
    'Look at / find the middle item\nCompare it with the item being searched for\nIf it is not a match, discard the half that cannot contain the item\nRepeat until the item is found or there are no items left');
  long(2, '2.3.1a', 'Describe', 4, 'Describe two methods of defensive design.',
    'Input validation – checking data entered is sensible before it is used\nAuthentication – e.g. usernames and passwords to confirm identity\nAnticipating misuse – planning for how users might break the program\nMaintainability – comments, indentation, sensible names, sub programs');

  // Difficulty: recall / 1-mark questions are Foundation-style; 2+ mark written answers are Higher-style.
  // Feedback codes: the common mix-up each question targets (shown when a student gets it wrong).
  rows.forEach(function (r) {
    r.difficulty = (r.type === 'mcq' || (r.type === 'short' && r.marks === 1)) ? 'F' : 'H';
    var t = r.topics[0], q = r.question;
    var codes = [];
    if (t === '1.1.1e') {
      if (/Address Register|\bMAR\b|data or instruction that has just been fetched|Data Register|\bMDR\b/.test(q)) codes.push('R1');
      if (/Program Counter|next instruction/.test(q)) codes.push('R2');
      if (/accumulator/i.test(q)) codes.push('R3');
    }
    if (/^Explain/.test(r.command)) codes.push('E1');
    r.codes = codes;
  });
  return rows;
})();
if (typeof module !== 'undefined' && module.exports) module.exports = GCSE_STARTER_BANK;
