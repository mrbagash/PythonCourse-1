// Twin questions for "End of Unit Test 1 – Systems architecture and programming fundamentals" (55 marks).
// Three original twins for every question part: same skill and exam wording, different context.
// A pupil who drops marks on a part must answer a twin for FULL marks to pass it ("Redo my questions").
// Loaded LAST so the IDs of the rest of the bank never move.
var GCSE_PAPERS = (function (X) {
  var M = X.M, S = X.S, C = X.C, T = X.T, rows = X.rows;
  var KEY = 'EOU1';
  function tw(part, fn) { var n = rows.length; fn(); for (var i = n; i < rows.length; i++) rows[i].twin = KEY + ':' + part; }

  // ── Section A ───────────────────────────────────────────────
  var FDE = '=fetch|fetched|fetches|fetching|retrieved|collected & memory|ram|instruction|instructions|data\n=decode|decoded|decodes|decoding\n=execute|executed|executes|executing|carried out|carries out|performed|alu\nmax 2';
  var FDE_MS = 'Any two: the instruction/data is fetched from memory (1); the instruction is decoded (1); the instruction is executed / carried out (1); the ALU does any calculations (1).\nDo not credit "information" or "programs" being fetched.';
  var FDE_T = '2 | The instruction is fetched from memory and then decoded\n2 | The CPU fetches an instruction from RAM, decodes it and executes it\n1 | The instruction is decoded\n0 | The CPU stores all the files';
  tw('1a', function () {
    S('1.1.1a', '', 2, 'Describe', 2, 'A program is running on a computer.\nDescribe what the CPU does during one fetch-execute cycle.', FDE_MS, FDE, FDE_T, ['C1']);
    S('1.1.1a', '', 2, 'Describe', 2, 'The CPU repeats the fetch-execute cycle billions of times every second.\nDescribe two things that happen during this cycle.', FDE_MS, FDE, FDE_T, ['C1']);
    S('1.1.1a', '', 3, 'Describe', 2, 'A smartphone has a Central Processing Unit (CPU).\nDescribe how the CPU uses the fetch-execute cycle to run an app.', FDE_MS, FDE, FDE_T, ['C1']);
  });

  var PERF = '=clock speed|clock rate|speed of the clock\n=cache size|size of the cache|size of cache|amount of cache|bigger cache|larger cache|more cache|cache memory\n=number of cores|how many cores|amount of cores|more cores|multiple cores|dual core|quad core|cores it has';
  var PERF_MS = 'Clock speed (1). Cache size (1). Number of cores (1).\n"Clock", "cache", "speed" or "cores" on their own are not enough.';
  var PERF_T = '3 | Clock speed, cache size and number of cores\n3 | The number of cores, the size of the cache and the clock speed\n2 | Clock speed and cache size\n1 | Number of cores\n0 | The amount of storage and the screen';
  tw('1b', function () {
    S('1.1.2a', '', 2, 'State', 3, 'State three characteristics of a CPU that affect how quickly it can process instructions.', PERF_MS, PERF, PERF_T, ['P1']);
    S('1.1.2a', '', 2, 'Give', 3, 'A shop sells two laptops. One laptop has a CPU with better performance than the other.\nGive three characteristics of a CPU that can cause this difference in performance.', PERF_MS, PERF, PERF_T, ['P1']);
    S('1.1.2a', '', 2, 'Identify', 3, 'A buyer wants the CPU with the best performance.\nIdentify three characteristics of the CPUs that the buyer should compare.', PERF_MS, PERF, PERF_T, ['P1']);
  });

  tw('1c', function () {
    T('1.1.1e', '', 3, 4, 'Complete the table by writing the name of the register that matches each purpose.\nThese registers are all used in the fetch-execute cycle.',
      ['Purpose', 'Register'],
      [['Stores the address of the next instruction to be fetched', '?PC|program counter|program counter pc|pc program counter'],
       ['Stores the address of the memory location to be read from or written to', '?MAR|memory address register|memory address register mar|mar memory address register'],
       ['Stores the data or instruction that has just been fetched from memory', '?MDR|memory data register|memory data register mdr|mdr memory data register'],
       ['Stores the result of calculations carried out by the ALU', '?ACC|accumulator|accumulator acc|acc accumulator|ac']], { codes: ['R1', 'R2', 'R3'] });
    T('1.1.1e', '', 2, 4, 'Each register below stores one of these: an address, data or a result.\nComplete the table by writing address, data or result in each box to show what the register stores.',
      ['Register', 'What it stores'],
      [['Program counter (PC)', '?address|an address|addresses'], ['Memory address register (MAR)', '?address|an address|addresses'],
       ['Memory data register (MDR)', '?data|instruction|data or instruction|data or an instruction|an instruction'], ['Accumulator (ACC)', '?result|a result|results|the result']], { codes: ['R1', 'R2', 'R3'] });
    T('1.1.1e', '', 3, 4, 'A CPU is running a program. Complete the table by writing the name of the register used at each step.',
      ['Step', 'Register used'],
      [['The address of the next instruction is read from this register', '?PC|program counter|program counter pc|pc program counter'],
       ['That address is copied into this register so the memory location can be found', '?MAR|memory address register|memory address register mar|mar memory address register'],
       ['The instruction found at that address is copied into this register', '?MDR|memory data register|memory data register mdr|mdr memory data register'],
       ['The ALU adds two numbers and the answer is stored in this register', '?ACC|accumulator|accumulator acc|acc accumulator|ac']], { codes: ['R1', 'R2', 'R3'] });
  });

  var CLK = '=cycle|cycles|instruction|instructions & second';
  var CLK_MS = 'The number of fetch-execute cycles (instructions) the CPU can carry out each second (1).\nDo not accept "how fast the computer is" on its own.';
  var CLK_T = '1 | The number of instructions the CPU can carry out per second\n1 | How many fetch-execute cycles it does each second\n0 | How fast the computer is\n0 | The amount of storage it has';
  tw('2a', function () {
    S('1.1.2a', '', 2, 'State', 1, 'A CPU is advertised as having a clock speed of 3.6 GHz.\nState what is meant by clock speed.', CLK_MS, CLK, CLK_T, ['P1']);
    S('1.1.2a', '', 2, 'State', 1, 'State what the clock speed of a CPU measures.', CLK_MS, CLK, CLK_T, ['P1']);
    M('1.1.2a', '', 2, 'A tablet has a CPU with a clock speed of 2.4 GHz.\nWhich statement describes what clock speed means?',
      ['The amount of data the CPU can store', 'The number of fetch-execute cycles the CPU can carry out each second', 'The number of programs that can be open at once', 'The number of cores inside the CPU'], 'B',
      ['Clock speed is not storage – the CPU does not measure storage in hertz.', '', 'How many programs can be open depends mostly on RAM, not on clock speed.', 'The number of cores is a different characteristic of the CPU.'], ['P1']);
  });

  var CORES = '=not be written|not written|not be designed|not designed|not be programmed|not programmed|not be made|not made|not be coded|not coded|not be built|not built|not support|doesnt support|not be able to use|not able to use|cannot use|cant use|not use|not make use|not take advantage|only use one|only uses one|written for one core|designed for one core|single core|one core|must be written|has to be written|needs to be written|need to be written|have to be written|designed to use|written to use\n=cannot be split|cant be split|not be split|cannot split|cant split|not split|cannot be divided|not be divided|cannot be shared|cannot be done in parallel|cannot run in parallel|cannot be run in parallel|depend|depends|dependent|in order|one after|sequential|sequentially|previous instruction|result of the previous|wait for\n=communicate|communicating|communication|coordinate|coordinating|coordination|talk to each other\nmax 2';
  var CORES_MS = 'Any two: the software may not be written to use multiple cores (1); some tasks cannot be split / an instruction may depend on the result of the previous one (1); the cores need to communicate/coordinate, which takes time (1).\nAnswers must explain, not just restate the question.';
  var CORES_T = '2 | The software might not be written to use more than one core and some tasks cannot be split up\n2 | Some instructions depend on the one before so they cannot be split, and the cores have to communicate with each other which takes time\n1 | The program may not be designed to use multiple cores\n0 | Because it has more cores so it is faster';
  tw('2b', function () {
    S('1.1.2c', '', 4, 'Explain', 2, 'A games console is upgraded from a CPU with 2 cores to a CPU with 4 cores.\nExplain why games will not always run twice as fast on the new CPU.', CORES_MS, CORES, CORES_T, ['P2']);
    S('1.1.2c', '', 4, 'Explain', 2, 'CPU X has 4 cores. CPU Y has 8 cores.\nExplain why CPU Y will not always run programs twice as fast as CPU X.', CORES_MS, CORES, CORES_T, ['P2']);
    S('1.1.2c', '', 4, 'Explain', 2, 'A student says: "A CPU with twice as many cores always gets twice as much work done."\nExplain why the student is not correct.', CORES_MS, CORES, CORES_T, ['P2']);
  });

  var REC = '=cores|core & same time|simultaneously|at once|multitask|multitasking|parallel|each program|split|shared|different tasks|more than one\n=cache & frequently|often|regularly|quicker access|faster access|less time|ram|waiting|close to|quickly|nearby\n=clock & instructions|instruction|cycles|cycle|per second|each second|every second';
  var REC_MS = '1 mark for each justified point (max 3). No marks for a choice on its own.\n• More cores, so more instructions can be processed at the same time.\n• Larger cache, so more frequently used data/instructions are stored close to the CPU, so less time is spent waiting for RAM.\n• Higher clock speed, so more fetch-execute cycles are carried out per second.\nListing the numbers without saying what they mean for the user: max 1.';
  var REC_T = '3 | CPU Y because it has more cores so it can process more instructions at the same time. It has a larger cache so frequently used data can be accessed more quickly. Its clock speed is lower so it does fewer instructions per second but that matters less\n2 | CPU Y. More cores means tasks can be done at the same time. Bigger cache stores frequently used instructions\n1 | CPU Y because more cores lets it multitask\n0 | CPU Y because it is better';
  tw('2c', function () {
    S('1.1.2c', '', 4, 'Recommend', 3, 'An office is choosing between two CPUs.\nCPU X: clock speed 3.8 GHz, 2 cores, 4 MB cache.\nCPU Y: clock speed 3.0 GHz, 6 cores, 12 MB cache.\nThe computer will be used by a worker who has many programs open at the same time.\nRecommend which CPU the office should choose. Justify your answer by referring to the clock speed, the number of cores and the cache size.', REC_MS, REC, REC_T, ['P2']);
    S('1.1.2c', '', 4, 'Recommend', 3, 'A student is choosing between two CPUs.\nCPU X: clock speed 4.2 GHz, 4 cores, 6 MB cache.\nCPU Y: clock speed 3.4 GHz, 12 cores, 24 MB cache.\nThe student makes 3D animations. The animation software can share its work between cores.\nRecommend which CPU the student should choose. Justify your answer by referring to the clock speed, the number of cores and the cache size.', REC_MS, REC, REC_T, ['P2']);
    S('1.1.2c', '', 4, 'Recommend', 3, 'A gamer is choosing between two CPUs.\nCPU X: clock speed 3.0 GHz, 8 cores, 16 MB cache.\nCPU Y: clock speed 4.5 GHz, 2 cores, 4 MB cache.\nThe gamer plays a game and streams it live at the same time.\nRecommend which CPU the gamer should choose. Justify your answer by referring to the clock speed, the number of cores and the cache size.', REC_MS, REC, REC_T, ['P2']);
  });

  var EMB = '=one task|single task|specific task|specific purpose|specific function|dedicated|one job|one function|single function|single purpose|one purpose|limited function|one thing|only does|only performs|only controls\n=built into|built in|inside|within|part of|larger device|larger system|bigger device|embedded in\n=microprocessor|microcontroller|own hardware|dedicated hardware|sensor|sensors|firmware|rom|hard to change|difficult to change|cannot be changed|not easily changed|control system|automated|automatic|low power|little power';
  var EMB_MS = '1 mark each, max 3:\n• Has a specific purpose / only performs one task\n• Built within a larger device\n• Has its own dedicated hardware / sensors / microprocessor\n• Software is stored in firmware/ROM / its function is hard to change\n• It is a control system / it is automated';
  var EMB_T = '3 | It only does one task. It is built into a larger device. It has its own microprocessor\n3 | It has a dedicated function, it is part of a bigger device and its software is stored in ROM so it is hard to change\n2 | It is built into the device and only does one job\n1 | It has a specific purpose\n0 | It is a computer that can run any program';
  tw('3', function () {
    S('1.1.3a', '', 3, 'Explain', 3, 'A microwave oven has a system that controls the cooking time and the power level. The user sets the time and the system does the rest.\nThe system is an example of an embedded system.\nExplain the reasons why this system is an example of an embedded system.', EMB_MS, EMB, EMB_T, []);
    S('1.1.3a', '', 3, 'Explain', 3, 'A lift has a system that opens and closes the doors and moves the lift to the floor that was chosen.\nThe system is an example of an embedded system.\nExplain the reasons why this system is an example of an embedded system.', EMB_MS, EMB, EMB_T, []);
    S('1.1.3a', '', 3, 'Explain', 3, 'A smart doorbell has a system that detects movement, records a short video and sends an alert to the owner.\nThe system is an example of an embedded system.\nExplain the reasons why this system is an example of an embedded system.', EMB_MS, EMB, EMB_T, []);
  });

  var EX2 = '=one task|single task|specific task|specific purpose|specific function|dedicated function|dedicated task|dedicated purpose|one job|one function|single function|single purpose|one purpose|limited function|one thing|only does|only performs|only controls|only detects|only washes|only heats|only cools\n=microprocessor|microcontroller|firmware|rom|hard to change|difficult to change|cannot be changed|not easily changed|cannot do anything else|dedicated hardware|own hardware|cannot make it do';
  var EX_MS = '1 mark for a suitable example. 1 mark each (max 2) for the explanation:\n• Limited/single function, e.g. it only heats the water to the temperature set\n• Dedicated microprocessor / hardware\n• Its function is hard to change, e.g. the user cannot make it do anything else\nDo not award "built into" the place named in the question. Generic features not linked to the example: max 1 for the explanation.';
  tw('4', function () {
    S('1.1.3b', '', 3, 'Identify', 3, 'A kitchen contains many embedded systems, for example a microwave oven.\nIdentify one other embedded system that could be found in a kitchen and explain why it is an embedded system.', EX_MS,
      '=dishwasher|washing machine|fridge|freezer|oven|kettle|toaster|coffee machine|cooker|air fryer|hob|extractor|tumble dryer|blender|smart speaker|smoke alarm|timer|bread maker|slow cooker\n' + EX2,
      '3 | A dishwasher. It only does one task which is washing the dishes and it has a dedicated microprocessor\n3 | A fridge. It has a single function, keeping food cold, and its function is hard to change\n2 | A washing machine because it only does one job\n1 | A toaster\n0 | A laptop because it is a computer', []);
    S('1.1.3b', '', 3, 'Identify', 3, 'A school contains many embedded systems, for example a fire alarm.\nIdentify one other embedded system that could be found in a school and explain why it is an embedded system.', EX_MS,
      '=projector|printer|photocopier|vending machine|door entry|calculator|cctv|camera|interactive whiteboard|whiteboard|bell|thermostat|heating|microwave|dishwasher|water fountain|card reader|till|register|scanner|air conditioning|lift|elevator|burglar alarm|security alarm\n' + EX2,
      '3 | A vending machine. It only does one task which is giving out the snack chosen and it has its own microprocessor\n3 | A printer. It has a single function and the user cannot make it do anything else\n2 | A photocopier because it only does one job\n1 | The projector\n0 | A desktop computer because it runs programs', []);
    S('1.1.3b', '', 3, 'Identify', 3, 'A home contains many embedded systems, for example a washing machine.\nIdentify one other embedded system that could be found in a home and explain why it is an embedded system.', EX_MS,
      '=dishwasher|fridge|freezer|oven|kettle|toaster|microwave|coffee machine|cooker|air fryer|tumble dryer|smart speaker|smoke alarm|thermostat|central heating|heating|boiler|burglar alarm|security alarm|doorbell|television|tv|remote|router|digital clock|alarm clock|vacuum|smart meter|smart light|air conditioning\n' + EX2,
      '3 | A thermostat. It only does one task which is controlling the heating and it has a dedicated microprocessor\n3 | A smoke alarm. It has a single function and its function is hard to change\n2 | A microwave because it only does one job\n1 | A dishwasher\n0 | A games console because you can play lots of games', []);
  });

  // ── Section B ───────────────────────────────────────────────
  tw('5a', function () {
    M('2.2.1a', 'io', 2, 'A website asks a visitor for their username and their age. The values are stored in the variables userName and userAge.\nWhich OCR Exam Reference Language statements are correct for this task?',
      ['userName and userAge = input("enter username and age")', 'input("enter your username") = userName\ninput("enter your age") = userAge', 'userName = input("enter your username")\nuserAge = input("enter your age")', '"userName" = input("enter your username")\n"userAge" = input("enter your age")'], 'C',
      ['One input statement stores one value – you cannot fill two variables with "and".', 'The variable goes on the LEFT of the = sign; the value being stored goes on the right.', '', 'Speech marks make "userName" a string, not a variable, so nothing can be stored in it.'], []);
    M('2.2.1a', 'io', 2, 'A game asks the player for their name and their favourite colour. The values are stored in the variables player and colour.\nWhich OCR Exam Reference Language statements are correct for this task?',
      ['player = input("enter your name")\ncolour = input("enter your favourite colour")', '"player" = input("enter your name")\n"colour" = input("enter your favourite colour")', 'input("enter your name") = player\ninput("enter your favourite colour") = colour', 'player and colour = input("enter name and colour")'], 'A',
      ['', 'Speech marks make "player" a string, not a variable, so nothing can be stored in it.', 'The variable goes on the LEFT of the = sign; the value being stored goes on the right.', 'One input statement stores one value – you cannot fill two variables with "and".'], []);
    M('2.2.1a', 'io', 2, 'A ticket machine asks for a destination and then for the number of tickets. The values are stored in the variables dest and tickets.\nWhich OCR Exam Reference Language statements are correct for this task?',
      ['input("enter destination") = dest\ninput("enter number of tickets") = tickets', 'dest = input("enter destination")\ntickets = input("enter number of tickets")', 'dest and tickets = input("enter destination and tickets")', '"dest" = input("enter destination")\n"tickets" = input("enter number of tickets")'], 'B',
      ['The variable goes on the LEFT of the = sign; the value being stored goes on the right.', '', 'One input statement stores one value – you cannot fill two variables with "and".', 'Speech marks make "dest" a string, not a variable, so nothing can be stored in it.'], []);
  });

  tw('5b', function () {
    C('2.2.1c', 'if', 2, 3, 'A website asks a new user to enter their email address twice. The two values are stored in the variables emailA and emailB.\nWrite an algorithm that:\n• inputs the two email addresses\n• outputs emails match if they are the same\n• outputs emails do not match if they are not the same.',
      [[['sam@jh.org', 'sam@jh.org'], 'emails match'], [['sam@jh.org', 'sam@jh.com'], 'emails do not match'], [['a', 'a'], 'emails match'], [['Tom@x.uk', 'tom@x.uk'], 'emails do not match']],
      'emailA = input("Enter your email")\nemailB = input("Enter your email again")\nif emailA == emailB then\n    print("emails match")\nelse\n    print("emails do not match")\nendif', { codes: ['Q2'] });
    C('2.2.1c', 'if', 2, 3, 'A safe asks the user to enter a new code twice. The two values are stored in the variables codeA and codeB.\nWrite an algorithm that:\n• inputs the two codes\n• outputs codes are the same if they are the same\n• outputs codes are different if they are not the same.',
      [[['4471', '4471'], 'codes are the same'], [['4471', '4417'], 'codes are different'], [['0', '0'], 'codes are the same'], [['12', '21'], 'codes are different']],
      'codeA = input("Enter the code")\ncodeB = input("Enter the code again")\nif codeA == codeB then\n    print("codes are the same")\nelse\n    print("codes are different")\nendif', { codes: ['Q2'] });
    C('2.2.1c', 'if', 2, 3, 'Two players each type the name of the team they support. The two values are stored in the variables teamA and teamB.\nWrite an algorithm that:\n• inputs the two team names\n• outputs same team if they are the same\n• outputs different teams if they are not the same.',
      [[['Reds', 'Reds'], 'same team'], [['Reds', 'Blues'], 'different teams'], [['x', 'x'], 'same team'], [['City', 'United'], 'different teams']],
      'teamA = input("Player 1 team")\nteamB = input("Player 2 team")\nif teamA == teamB then\n    print("same team")\nelse\n    print("different teams")\nendif', { codes: ['Q2'] });
  });

  var DT = 'Write Boolean, Char, String, Integer or Real in each box to give the most appropriate data type for each variable.';
  tw('6', function () {
    T('2.2.2a', 'text', 2, 4, 'A library stores the following data about each book.\n' + DT, ['Data stored', 'Variable', 'Example data', 'Data type'],
      [['The title of the book', 'bookTitle', 'Holes', '?string|str'], ['The number of pages', 'pageCount', '233', '?integer|int'],
       ['Whether the book is on loan', 'onLoan', 'False', '?boolean|bool'], ['The fee for returning it late, in pounds', 'lateFee', '1.50', '?real|float']], { codes: ['A2'] });
    T('2.2.2a', 'text', 2, 4, 'A cinema stores the following data about each booking.\n' + DT, ['Data stored', 'Variable', 'Example data', 'Data type'],
      [['The letter of the seat row', 'seatRow', 'F', '?char|character'], ['The price of the ticket, in pounds', 'ticketPrice', '7.25', '?real|float'],
       ['The name of the film', 'filmName', 'Space Race', '?string|str'], ['How many seats are left', 'seatsLeft', '48', '?integer|int']], { codes: ['A2'] });
    T('2.2.2a', 'text', 2, 4, 'A weather station stores the following data.\n' + DT, ['Data stored', 'Variable', 'Example data', 'Data type'],
      [['The temperature in degrees Celsius', 'temperature', '14.6', '?real|float'], ['Whether it is raining', 'isRaining', 'True', '?boolean|bool'],
       ['The code of the station', 'stationCode', 'WX204B', '?string|str'], ['The number of days since it last rained', 'dryDays', '9', '?integer|int']], { codes: ['A2'] });
  });

  // Three short programs used by the twins of question 7.
  var P1 = 'A program makes a username for a student. The program is shown below.\n01 firstName = input("Enter your first name")\n02 year = input("Enter your year group")\n03 username = firstName + year\n04 if year == "10" or year == "11" then\n05    print("GCSE user " + username)\n06 else\n07    print("User " + username)\n08 endif\n';
  var P2 = 'A program checks if a product is in stock. The program is shown below.\n01 colour = input("Enter the colour code")\n02 size = input("Enter the size")\n03 productCode = colour + size\n04 if colour == "RD" or colour == "BL" then\n05    print("In stock: " + productCode)\n06 else\n07    print("Not available")\n08 endif\n';
  var P3 = 'A program prints a bus ticket. The program is shown below.\n01 route = input("Enter the route letter")\n02 stop = input("Enter the stop number")\n03 if route == "A" or route == "B" then\n04    ticket = route + stop\n05    print("Ticket " + ticket)\n06 else\n07    print("Unknown route")\n08 endif\n';
  tw('7a', function () {
    S('2.2.3a', 'concat', 2, 'Give', 1, P1 + 'Give the line number of one line where there is concatenation.', 'Line 03, 05 or 07 (1).', '=03|3|05|5|07|7|three|five|seven',
      '1 | 03\n1 | Line 5\n1 | line 07\n0 | 04\n0 | Line 1', ['Q7']);
    S('2.2.3a', 'concat', 2, 'Give', 1, P2 + 'Give the line number of one line where there is concatenation.', 'Line 03 or 05 (1).', '=03|3|05|5|three|five',
      '1 | 03\n1 | Line 5\n0 | 04\n0 | 07', ['Q7']);
    S('2.2.3a', 'concat', 2, 'Give', 1, P3 + 'Give the line number of one line where there is concatenation.', 'Line 04 or 05 (1).', '=04|4|05|5|four|five',
      '1 | 04\n1 | Line 5\n0 | 03\n0 | 01', ['Q7']);
  });
  tw('7b', function () {
    S('2.2.1a', 'vars', 2, 'Give', 1, P1 + 'Give the identifier of one variable used in the program.', 'Any one of: firstName, year, username (1).\nDo not penalise case, spacing or minor misspellings.', '=firstname|first name|year|username|user name',
      '1 | firstName\n1 | username\n1 | year\n0 | input\n0 | print', []);
    S('2.2.1a', 'vars', 2, 'Give', 1, P2 + 'Give the identifier of one variable used in the program.', 'Any one of: colour, size, productCode (1).\nDo not penalise case, spacing or minor misspellings.', '=colour|color|size|productcode|product code',
      '1 | colour\n1 | productCode\n1 | size\n0 | input\n0 | RD', []);
    S('2.2.1a', 'vars', 2, 'Give', 1, P3 + 'Give the identifier of one variable used in the program.', 'Any one of: route, stop, ticket (1).\nDo not penalise case, spacing or minor misspellings.', '=route|stop|ticket',
      '1 | route\n1 | ticket\n1 | stop\n0 | input\n0 | print', []);
  });
  var STR_MS = 'String (1). Accept str.\nDo not accept integer: input() always returns a string.';
  var STR_T = '1 | String\n1 | str\n0 | Integer\n0 | Real';
  tw('7c', function () {
    S('2.2.2a', 'text', 3, 'State', 1, P1 + 'State the data type of the value stored in year on line 02.', STR_MS, '=string|str', STR_T, ['Q9']);
    S('2.2.2a', 'text', 3, 'State', 1, P2 + 'State the data type of the value stored in size on line 02.', STR_MS, '=string|str', STR_T, ['Q9']);
    S('2.2.2a', 'text', 3, 'State', 1, P3 + 'State the data type of the value stored in stop on line 02.', STR_MS, '=string|str', STR_T, ['Q9']);
  });
  var CON_MS = 'Sequence (1). Selection (1).\nDo not accept examples (e.g. IF). Do not accept iteration: there is no loop.';
  var CON = '=sequence|sequencing\n=selection';
  var CON_T = '2 | Sequence and selection\n2 | selection, sequence\n1 | Selection and iteration\n1 | Sequence\n0 | An if statement and a loop';
  tw('7d', function () {
    S('2.2.1b', '', 2, 'Identify', 2, P1 + 'Identify two programming constructs that have been used in the program.', CON_MS, CON, CON_T, []);
    S('2.2.1b', '', 2, 'Identify', 2, P2 + 'Identify two programming constructs that have been used in the program.', CON_MS, CON, CON_T, []);
    S('2.2.1b', '', 2, 'Identify', 2, P3 + 'Identify two programming constructs that have been used in the program.', CON_MS, CON, CON_T, []);
  });

  var REAL_MS = 'A number with a decimal / fractional part (1). The decimal value from the list (1).\nDo not accept "float" as the meaning.';
  tw('8a', function () {
    S('2.2.2a', 'numbers', 2, 'State', 2, 'A shop program stores the price of each item using the real data type.\nState what is meant by a real data type, and state which one of these values is a real:   28     9.75     "nine"     True', REAL_MS,
      '=decimal|fraction|fractional|not a whole|not whole\n=75', '2 | A number with a decimal part. 9.75 is a real\n2 | It is a number that has a fractional part, for example 9.75\n1 | A number with a decimal point\n1 | 9.75\n0 | A whole number such as 28', ['A2']);
    S('2.2.2a', 'numbers', 2, 'State', 2, 'A fitness app stores the distance of each run using the real data type.\nState what is meant by a real data type, and state which one of these values is a real:   "12"     False     12     3.25', REAL_MS,
      '=decimal|fraction|fractional|not a whole|not whole\n=25', '2 | A number with a decimal part. 3.25 is a real\n2 | It is a number that has a fractional part, for example 3.25\n1 | A number with a decimal point\n0 | A whole number such as 12', ['A2']);
    S('2.2.2a', 'numbers', 2, 'State', 2, 'A science program stores the mass of each sample using the real data type.\nState what is meant by a real data type, and state which one of these values is a real:   True     40     6.85     "mass"', REAL_MS,
      '=decimal|fraction|fractional|not a whole|not whole\n=85', '2 | A number with a decimal part. 6.85 is a real\n2 | It is a number that has a fractional part, for example 6.85\n1 | A number with a decimal point\n0 | A whole number such as 40', ['A2']);
  });
  var VC_MS = 'The value of a variable can change while the program is running; the value of a constant cannot change (1).\nBoth sides are needed.';
  var VC = '=variable & change|changed|changes|vary|altered|updated & constant|cannot|fixed|stays the same|same|never';
  var VC_T = '1 | A variable can change while the program is running but a constant cannot\n1 | The value of a variable can be changed. The value of a constant stays the same\n0 | A variable stores data\n0 | A constant is a number';
  tw('8b', function () {
    S('2.2.1a', 'vars', 2, 'State', 1, 'A program stores the rate of VAT as a constant and the price of an item as a variable.\nState one difference between a variable and a constant.', VC_MS, VC, VC_T, []);
    S('2.2.1a', 'vars', 2, 'State', 1, 'A game stores the number of lives in a variable and the maximum number of players in a constant.\nState one difference between a constant and a variable.', VC_MS, VC, VC_T, []);
    S('2.2.1a', 'vars', 2, 'Describe', 1, 'Describe how a constant is different from a variable.', VC_MS, VC, VC_T, []);
  });

  function calc(part, op, list) {
    tw(part, function () {
      list.forEach(function (x) {
        T('2.2.1e', 'divmod', 2, 1, 'DIV and MOD are both operators used in computing-related mathematics.\nState the value of ' + x[0] + ' ' + op + ' ' + x[1], ['Calculation', 'Value'], [[x[0] + ' ' + op + ' ' + x[1], '?' + x[2]]], { codes: ['Q4'] });
      });
    });
  }
  calc('9a', 'DIV', [[17, 5, 3], [20, 3, 6], [29, 4, 7]]);
  calc('9b', 'MOD', [[17, 5, 2], [20, 3, 2], [29, 4, 1]]);

  var TR = 'State the value output by the program on each of the lines in the table.';
  tw('10', function () {
    T('2.1.2e', 'output', 3, 4, 'Ash writes the following program.\n01 lives = 7\n02 player = "Ash"\n03 print("player")\n04 print(lives)\n05 extra = lives * 3 - 1\n06 print(extra)\n07 print(lives)\n' + TR, ['Line', 'Program code', 'Value output'],
      [['03', 'print("player")', '?player'], ['04', 'print(lives)', '?7'], ['06', 'print(extra)', '?20'], ['07', 'print(lives)', '?7']], {});
    T('2.1.2e', 'output', 3, 4, 'Kit writes the following program.\n01 points = 12\n02 team = "Reds"\n03 print(points)\n04 total = points + 4 * 2\n05 print("team")\n06 print(total)\n07 print(points)\n' + TR, ['Line', 'Program code', 'Value output'],
      [['03', 'print(points)', '?12'], ['05', 'print("team")', '?team'], ['06', 'print(total)', '?20'], ['07', 'print(points)', '?12']], {});
    T('2.1.2e', 'output', 3, 4, 'Mo writes the following program.\n01 width = 6\n02 label = "Area"\n03 print("label")\n04 size = width * width + 2\n05 print(size)\n06 print(width)\n07 print(label)\n' + TR, ['Line', 'Program code', 'Value output'],
      [['03', 'print("label")', '?label'], ['05', 'print(size)', '?38'], ['06', 'print(width)', '?6'], ['07', 'print(label)', '?Area']], {});
  });

  var CAST_MS = 'input() returns a string / the numbers are stored as strings (1), so + concatenates (joins) the strings instead of adding them (1).\nMust refer to strings/text for the first mark.';
  var CAST = '=string|strings|str|text\n=concatenate|concatenates|concatenated|concatenation|concatenating|join|joins|joined|joining|stuck together|put together|puts together|next to each other|side by side';
  var CAST_T = '2 | The inputs are stored as strings so the + joins them together instead of adding them\n2 | input returns a string. Adding two strings concatenates them\n1 | The numbers are strings\n0 | The program has a bug in the addition';
  tw('11a', function () {
    S('2.2.2b', '', 3, 'Explain', 2, 'Jo writes a program that adds two ages together.\n01 age1 = input("Enter the first age")\n02 age2 = input("Enter the second age")\n03 total = age1 + age2\n04 print(total)\nJo runs the program and enters 12 for the first age and 14 for the second age. The program outputs 1214.\nExplain why the program outputs 1214 instead of 26.', CAST_MS, CAST, CAST_T, ['Q9']);
    S('2.2.2b', '', 3, 'Explain', 2, 'Ali writes a program that adds the prices of two items.\n01 price1 = input("Enter the first price")\n02 price2 = input("Enter the second price")\n03 total = price1 + price2\n04 print(total)\nAli runs the program and enters 3 for the first price and 4 for the second price. The program outputs 34.\nExplain why the program outputs 34 instead of 7.', CAST_MS, CAST, CAST_T, ['Q9']);
    S('2.2.2b', '', 3, 'Explain', 2, 'Bea writes a program that adds two scores together.\n01 score1 = input("Enter the first score")\n02 score2 = input("Enter the second score")\n03 total = score1 + score2\n04 print(total)\nBea runs the program and enters 20 for the first score and 30 for the second score. The program outputs 2030.\nExplain why the program outputs 2030 instead of 50.', CAST_MS, CAST, CAST_T, ['Q9']);
  });
  tw('11b', function () {
    C('2.2.2b', '', 3, 1, 'This program should add two ages together, but entering 12 and 14 outputs 1214.\nRewrite line 03 so that the program outputs 26.',
      [[['12', '14'], '26'], [['5', '5'], '10'], [['30', '7'], '37']], 'age1 = input("Enter the first age")\nage2 = input("Enter the second age")\ntotal = int(age1) + int(age2)\nprint(total)',
      { starter: 'age1 = input("Enter the first age")\nage2 = input("Enter the second age")\ntotal = age1 + age2\nprint(total)', codes: ['Q9'] });
    C('2.2.2b', '', 3, 1, 'This program should add the prices of two items, but entering 3 and 4 outputs 34.\nRewrite line 03 so that the program outputs 7.',
      [[['3', '4'], '7'], [['10', '10'], '20'], [['25', '6'], '31']], 'price1 = input("Enter the first price")\nprice2 = input("Enter the second price")\ntotal = int(price1) + int(price2)\nprint(total)',
      { starter: 'price1 = input("Enter the first price")\nprice2 = input("Enter the second price")\ntotal = price1 + price2\nprint(total)', codes: ['Q9'] });
    C('2.2.2b', '', 3, 1, 'This program should add two scores together, but entering 20 and 30 outputs 2030.\nRewrite line 03 so that the program outputs 50.',
      [[['20', '30'], '50'], [['1', '1'], '2'], [['45', '9'], '54']], 'score1 = input("Enter the first score")\nscore2 = input("Enter the second score")\ntotal = int(score1) + int(score2)\nprint(total)',
      { starter: 'score1 = input("Enter the first score")\nscore2 = input("Enter the second score")\ntotal = score1 + score2\nprint(total)', codes: ['Q9'] });
  });

  var LOOPS = [['range(2, 7)', 'count * 2', 5, [4, 6, 8, 10, 12]], ['range(0, 4)', 'count + 10', 4, [10, 11, 12, 13]], ['range(3, 6)', 'count * 5', 3, [15, 20, 25]]];
  tw('12a', function () {
    LOOPS.forEach(function (L) {
      T('2.2.1d', 'for', 3, 1, 'The following program is written in Python.\n01 for count in ' + L[0] + ':\n02     print(' + L[1] + ')\nState how many times line 02 is run.', ['Question', 'Answer'], [['Number of times line 02 is run', '?' + L[2]]], { codes: ['I1'] });
    });
  });
  tw('12b', function () {
    LOOPS.forEach(function (L) {
      var cells = [];
      for (var i = 0; i < 6; i++) cells.push([['1st', '2nd', '3rd', '4th', '5th', '6th'][i] + ' value output', '?' + (i < L[3].length ? L[3][i] : '-|none|nothing|x')]);
      T('2.2.1d', 'for', 3, 2, 'The following program is written in Python.\n01 for count in ' + L[0] + ':\n02     print(' + L[1] + ')\nState the output of the program. Write one value in each box, in order. Write a dash (-) in any box that is not needed.', ['Output', 'Value'], cells, { codes: ['I1'] });
    });
  });

  tw('13', function () {
    C('2.2.1c', 'if', 4, 6, 'A website asks each new user to choose a 6-character username. The username cannot be "abcdef" or "qwerty".\nCreate an algorithm that:\n• takes the username as input\n• checks that the username is 6 characters in length\n• checks that the username is not either "abcdef" or "qwerty"\n• outputs USERNAME ACCEPTED if the username meets all of the criteria\n• outputs USERNAME REJECTED if the username does not meet all of the criteria.\nHelp: in Python, len(name) gives the number of characters in name. In OCR Exam Reference Language this is written as name.length.',
      [[['sam123'], 'USERNAME ACCEPTED'], [['abcdef'], 'USERNAME REJECTED'], [['qwerty'], 'USERNAME REJECTED'], [['sam12'], 'USERNAME REJECTED'], [['sam1234'], 'USERNAME REJECTED'], [['zzzzzz'], 'USERNAME ACCEPTED']],
      'name = input("Enter username")\nif name.length == 6 and name != "abcdef" and name != "qwerty" then\n    print("USERNAME ACCEPTED")\nelse\n    print("USERNAME REJECTED")\nendif', { command: 'Write', codes: ['Q3', 'Q8'] });
    C('2.2.1c', 'if', 4, 6, 'A gym locker is opened with a 3-digit combination. The combination is stored as a string. It cannot be "000" or "123".\nCreate an algorithm that:\n• takes the combination as input as a string\n• checks that the combination is 3 characters in length\n• checks that the combination is not either "000" or "123"\n• outputs COMBINATION SET if the combination meets all of the criteria\n• outputs TRY AGAIN if the combination does not meet all of the criteria.\nYou do not need to check that the characters entered are digits.\nHelp: in Python, len(combo) gives the number of characters in combo. In OCR Exam Reference Language this is written as combo.length.',
      [[['582'], 'COMBINATION SET'], [['000'], 'TRY AGAIN'], [['123'], 'TRY AGAIN'], [['58'], 'TRY AGAIN'], [['5823'], 'TRY AGAIN'], [['321'], 'COMBINATION SET']],
      'combo = input("Enter combination")\nif combo.length == 3 and combo != "000" and combo != "123" then\n    print("COMBINATION SET")\nelse\n    print("TRY AGAIN")\nendif', { command: 'Write', codes: ['Q3', 'Q8'] });
    C('2.2.1c', 'if', 4, 6, 'A phone app asks the user to choose an 8-character password. The password cannot be "password" or "12345678".\nCreate an algorithm that:\n• takes the password as input\n• checks that the password is 8 characters in length\n• checks that the password is not either "password" or "12345678"\n• outputs PASSWORD SAVED if the password meets all of the criteria\n• outputs CHOOSE ANOTHER if the password does not meet all of the criteria.\nHelp: in Python, len(pw) gives the number of characters in pw. In OCR Exam Reference Language this is written as pw.length.',
      [[['blue42ok'], 'PASSWORD SAVED'], [['password'], 'CHOOSE ANOTHER'], [['12345678'], 'CHOOSE ANOTHER'], [['blue42'], 'CHOOSE ANOTHER'], [['blue42okay'], 'CHOOSE ANOTHER'], [['87654321'], 'PASSWORD SAVED']],
      'pw = input("Enter password")\nif pw.length == 8 and pw != "password" and pw != "12345678" then\n    print("PASSWORD SAVED")\nelse\n    print("CHOOSE ANOTHER")\nendif', { command: 'Write', codes: ['Q3', 'Q8'] });
  });

  // ── The paper itself (so a test can be created ready-made, and twins found from question numbers) ──
  function Q(id, marks, topics, command, type, text, scheme, model) { return { id: id, marks: marks, topics: topics, command: command, type: type, text: text, markScheme: scheme, model: model || '', twin: KEY + ':' + id }; }
  var EOU1 = {
    key: KEY, title: 'End of Unit Test 1 – Systems architecture and programming fundamentals', minutes: 60,
    questions: [
      Q('1a', 2, ['1.1.1a'], 'Describe', 'short', 'A computer has a Central Processing Unit (CPU).\nDescribe what happens during the fetch-execute cycle.', FDE_MS, 'An instruction is fetched from memory. It is then decoded and executed.'),
      Q('1b', 3, ['1.1.2a', '1.1.2b', '1.1.2c'], 'Give', 'short', 'Give three characteristics of a CPU that can affect its performance.', PERF_MS, 'Clock speed, cache size and the number of cores.'),
      Q('1c', 4, ['1.1.1e'], 'Complete', 'short', 'Complete the table by writing the name of two registers used in the fetch-execute cycle and the purpose of each register.', '1 mark for naming a register, 1 mark for its matching purpose, max 4:\n• Program counter (PC): stores the address of the next instruction to be fetched\n• Memory address register (MAR): stores the address of the data/instruction to be fetched from (or stored in) memory\n• Memory data register (MDR): stores the data/instruction fetched from memory / to be stored in memory\n• Accumulator (ACC): stores the result of calculations / the result from the ALU\nThe purpose must say what the register stores, not an action (fetches, takes, retrieves).', 'Program counter – stores the address of the next instruction to be fetched.\nAccumulator – stores the result of calculations done by the ALU.'),
      Q('2a', 1, ['1.1.2a'], 'State', 'short', 'State what is meant by clock speed.', CLK_MS, 'The number of fetch-execute cycles the CPU can carry out each second.'),
      Q('2b', 2, ['1.1.2c'], 'Explain', 'short', 'CPU B has twice as many cores as CPU A. Explain why CPU B will not always run programs twice as fast as CPU A.', CORES_MS + '\nAlso accept: CPU B has a lower clock speed, so each core carries out fewer instructions per second.', 'The software may not be written to use all of the cores, and some tasks cannot be split between cores.'),
      Q('2c', 3, ['1.1.2c', '1.1.2b'], 'Recommend', 'short', 'The computer will be used by a student who edits videos. Recommend which CPU the school should choose. Justify your answer.', REC_MS, 'CPU B. It has more cores, so more instructions can be processed at the same time and videos render faster. It has a larger cache, so frequently used instructions are stored close to the CPU and it spends less time waiting for RAM.'),
      Q('3', 3, ['1.1.3a'], 'Explain', 'short', 'Explain the reasons why the "Follow Me" system is an example of an embedded system.', EMB_MS, 'It has one specific purpose. It is built into a larger device (the car). It has its own dedicated microprocessor and sensors.'),
      Q('4', 3, ['1.1.3b'], 'Identify', 'short', 'Identify one other embedded system that could be found in a car and explain why it is an embedded system.', EX_MS, 'Automatic wipers. The system has a single function: it only detects rain and turns the wipers on or off. It has a dedicated microprocessor that only controls the wipers.'),
      Q('5a', 1, ['2.2.1a'], 'Identify', 'mcq', 'Tick one box to identify the correct OCR Exam Reference Language statements to enter two passwords.', 'Third box:\npassA = input("enter your password")\npassB = input("enter your password again")', ''),
      Q('5b', 3, ['2.2.1c'], 'Design', 'code', 'Design an algorithm that checks if the passwords stored in passA and passB are the same, and outputs passwords match or passwords do not match.', '1 mark each: checks if passA and passB are equal; correct output if true; correct output if false.\nDo not credit = for comparison.', 'if passA == passB then\n   print("passwords match")\nelse\n   print("passwords do not match")\nendif'),
      Q('6', 4, ['2.2.2a'], 'Identify', 'table', 'Tick one box in each row to identify the most appropriate data type for each variable.', 'UserName: String (1). EmergencyPhoneNumber: String (1). DoorSensorActive: Boolean (1). DoorActiveTime: Integer (1).', ''),
      Q('7a', 1, ['2.2.3a'], 'Give', 'short', 'Give the line number where there is concatenation.', 'Line 03 (1).', 'Line 03'),
      Q('7b', 1, ['2.2.1a'], 'Give', 'short', 'Give the identifier of one variable used in the program.', 'Any one of: sensorType, sensorNumber, sensorID (1).', 'sensorType'),
      Q('7c', 1, ['2.2.2a'], 'State', 'short', 'State the data type of the value stored in sensorNumber on line 02.', STR_MS, 'String'),
      Q('7d', 2, ['2.2.1b', '2.2.1c'], 'Identify', 'short', 'Identify two programming constructs that have been used in the program.', CON_MS, 'Sequence and selection.'),
      Q('8a', 2, ['2.2.2a'], 'State', 'short', 'State what is meant by a real data type and give an example of this data type.', 'A number with a decimal/fractional part (1). Suitable example, e.g. 17.24 (1).\nDo not accept "float" as the meaning.', 'A number with a decimal part, for example 17.24.'),
      Q('8b', 1, ['2.2.1a'], 'State', 'short', 'State one difference between a variable and a constant.', VC_MS, 'The value of a variable can change while the program is running; the value of a constant cannot.'),
      Q('9a', 1, ['2.2.1e'], 'State', 'short', 'State the value of 13 DIV 4', '3 (1).', '3'),
      Q('9b', 1, ['2.2.1e'], 'State', 'short', 'State the value of 13 MOD 4', '1 (1).', '1'),
      Q('10', 4, ['2.2.1a'], 'State', 'table', 'State the value output by the program on each of the lines in the table.', 'Line 03: 18 (1). Line 04: name (1). Line 06: 37 (1). Line 07: 18 (1).\nLine 04 must be the word name, not Dru. Line 06: multiplication is done before addition.', ''),
      Q('11a', 2, ['2.2.2b'], 'Explain', 'short', 'Explain why the program outputs 55 instead of 10.', CAST_MS, 'input() returns a string, so the two numbers are stored as strings. The + joins (concatenates) the strings instead of adding them.'),
      Q('11b', 1, ['2.2.2b'], 'Rewrite', 'short', 'Rewrite line 03 so that the program outputs 10.', 'total = int(num1) + int(num2) (1). Accept float() or real(). Both variables must be cast.', 'total = int(num1) + int(num2)'),
      Q('12a', 1, ['2.2.1d'], 'State', 'short', 'State how many times line 02 is run.', '4 (1). The end value in range is not included.', '4'),
      Q('12b', 2, ['2.2.1d'], 'State', 'short', 'State the output of the program.', '3  6  9  12\n2 marks: all four values correct, in order, nothing extra. 1 mark: one error.', '3\n6\n9\n12'),
      Q('13', 6, ['2.2.1c', '2.2.3a'], 'Create', 'code', 'Create an algorithm that takes the PIN as input as a string, checks it is 4 characters in length, checks it is not "1234" or "4321", and outputs VALID PIN or INVALID PIN.', '1 mark each: inputs and stores the PIN; attempt at selection; correctly checks for 4 characters; correctly checks for both 1234 and 4321; outputs INVALID PIN after a sensible attempt at all three checks; outputs VALID PIN only when fully valid.\nEach part of a combined condition must be a full comparison.', 'pin = input("Enter PIN")\nif len(pin) == 4 and pin != "1234" and pin != "4321" then\n   print("VALID PIN")\nelse\n   print("INVALID PIN")\nendif')
    ]
  };
  return { EOU1: EOU1 };
})(GCSE_BANK_X);
if (typeof module !== 'undefined' && module.exports) module.exports = GCSE_PAPERS;
