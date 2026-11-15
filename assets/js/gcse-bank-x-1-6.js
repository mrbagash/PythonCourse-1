// Extended bank – 1.6 Impacts and 2.1 Algorithms (original exam-style questions).
// Code is written in OCR Exam Reference Language (ERL).
(function (M, S) {
  // 1.6.1a Ethical
  M('1.6.1a', '', 2, 'Which is an ETHICAL issue with using AI to choose which job applicants get an interview?', ['The software may be expensive', 'The AI may be biased and treat some groups unfairly', 'The computer may need more RAM', 'The software may need updating'], 'B',
    ['Cost is not an ethical issue.', '', 'Hardware is not an ethical issue.', 'Updates are a technical issue.'], []);
  S('1.6.1a', '', 4, 'Discuss', 2, 'Give two ethical issues with a company replacing its checkout staff with self-service machines.',
    'Any two: job losses / unemployment (1); people without tech skills / elderly / disabled excluded (1); less human contact / customer service (1); data collected about shoppers (1).',
    '=job|jobs|unemployment|redundant|redundancy|staff lose\n=elderly|older|disabled|disability|skills|excluded|struggle|confusing\n=human contact|social|lonely|customer service|help\n=data|tracking|privacy\nmax 2',
    '2 | Staff lose their jobs and older people may struggle to use them\n2 | Job losses and less human contact for customers\n1 | People lose their jobs\n0 | The machines are expensive', []);

  // 1.6.1b Legal
  M('1.6.1b', '', 2, 'Which is a LEGAL issue?', ['Copying and sharing a film without permission', 'Using a computer for too long', 'Recycling an old phone', 'Choosing a strong password'], 'A',
    ['', 'That is a health issue.', 'That is an environmental issue.', 'That is good security practice.'], []);

  // 1.6.1c Cultural
  M('1.6.1c', '', 2, 'What is meant by the "digital divide"?', ['The gap between people who have access to technology and those who do not', 'Splitting a hard drive into partitions', 'The difference between binary and denary', 'A type of network topology'], 'A',
    ['', 'That is partitioning.', 'That is number systems.', 'That is a topology.'], []);
  S('1.6.1c', '', 3, 'Give', 1, 'Give one reason why some people are on the wrong side of the digital divide.',
    'Any one: cannot afford devices / internet (1); no broadband in rural areas (1); lack of skills / training (1); age / disability (1).',
    '=afford|cannot afford|cost|money|poverty|expensive|income\n=rural|broadband|no broadband|signal|coverage|connection|internet access|no internet\n=skills|training|knowledge|confidence|age|elderly|older|disability\nmax 1',
    '1 | They cannot afford a computer\n1 | There is no broadband where they live\n0 | They have too many computers\n0 | Their computer is fast', []);

  // 1.6.1d Environmental
  M('1.6.1d', '', 2, 'Which is an environmental impact of technology?', ['Hackers stealing data', 'Old devices sent to landfill releasing toxic chemicals', 'People spending less time outdoors', 'Copyright being broken'], 'B',
    ['That is a security/legal issue.', '', 'That is a health/social issue.', 'That is a legal issue.'], []);
  S('1.6.1d', '', 3, 'Give', 2, 'Give two ways technology can harm the environment.',
    'Any two: e-waste / landfill / toxic chemicals (1); energy use / CO2 from devices and data centres (1); mining rare metals / raw materials (1); short device lifespans / frequent upgrades (1).',
    '=waste|landfill|toxic|chemicals|e-waste|dumped\n=energy|electricity|power|carbon|co2|emissions|data centres|data centers\n=mining|metals|raw materials|resources|minerals\n=upgrade|upgrades|replaced|lifespan|new phone\nmax 2',
    '2 | Old phones go to landfill and data centres use lots of electricity\n2 | Mining for metals and toxic e-waste\n1 | It uses a lot of energy\n0 | People get addicted to games', []);

  // 1.6.1e Privacy
  M('1.6.1e', '', 2, 'Which is a privacy concern about smartphone apps?', ['Apps take up storage', 'Apps may collect and share location data without the user realising', 'Apps can be expensive', 'Apps need updates'], 'B',
    ['Storage is a technical issue.', '', 'Cost is not a privacy issue.', 'Updates are a technical issue.'], []);
  S('1.6.1e', '', 4, 'Explain', 2, 'Explain one privacy concern about CCTV cameras with face recognition in town centres.',
    'People are tracked / recorded without consent (1) and the data could be stored / misused / shared / hacked (1).',
    '=tracked|tracking|recorded|recording|watched|monitored|identified|consent|without permission|without knowing\n=stored|misused|misuse|shared|sold|hacked|leaked|wrong person|mistakes',
    '2 | People are tracked without consent and the data could be misused\n2 | Everyone is identified and the images could be hacked\n1 | People are watched without consent\n0 | The cameras are expensive', ['E1']);

  // 1.6.1f Legislation
  M('1.6.1f', '', 1, 'Which law makes it illegal to gain unauthorised access to a computer system?', ['Data Protection Act 2018', 'Computer Misuse Act 1990', 'Copyright, Designs and Patents Act 1988', 'Freedom of Information Act'], 'B',
    ['The DPA is about how personal data is stored and used.', '', 'The CDPA is about copying creative work.', 'Not on the J277 specification.'], []);
  M('1.6.1f', '', 2, 'A company keeps customers\' personal data for 20 years after they leave and never checks it is accurate. Which law is it most likely breaking?', ['Computer Misuse Act 1990', 'Data Protection Act 2018', 'Copyright, Designs and Patents Act 1988', 'None'], 'B',
    ['The CMA is about hacking and malware.', '', 'The CDPA is about copying creative work.', 'Keeping inaccurate data too long breaks data protection principles.'], []);
  M('1.6.1f', '', 3, 'A student downloads a song and shares it with friends without paying. Which law is broken?', ['Data Protection Act 2018', 'Computer Misuse Act 1990', 'Copyright, Designs and Patents Act 1988', 'No law'], 'C',
    ['The DPA is about personal data.', 'The CMA is about unauthorised access and malware.', '', 'Sharing copyrighted music without permission is illegal.'], []);
  S('1.6.1f', '', 4, 'State', 2, 'State two principles of the Data Protection Act 2018.',
    'Any two: used fairly, lawfully and transparently (1); for specified purposes only (1); adequate, relevant, limited (1); accurate and up to date (1); kept no longer than necessary (1); kept secure (1).',
    '=fair|fairly|lawful|lawfully|transparent|legally\n=purpose|purposes|specified|stated\n=relevant|adequate|limited|necessary data|only what\n=accurate|up to date|up-to-date|correct\n=no longer|too long|longer than necessary|not kept longer|not kept for longer|deleted when\n=secure|securely|safe|protected\nmax 2',
    '2 | Data must be kept secure and kept accurate\n2 | It must only be used for the stated purpose and not kept longer than necessary\n1 | Kept secure\n0 | Data can be sold to anyone', []);

  // 1.6.1g Licences
  M('1.6.1g', '', 2, 'What is open source software?', ['Software whose source code is available to view and change', 'Software that is always paid for', 'Software with no bugs', 'Software that only runs online'], 'A',
    ['', 'Open source is usually free; proprietary is usually paid.', 'Open source can have bugs like any software.', 'It can run offline.'], []);
  S('1.6.1g', '', 4, 'Give', 2, 'Give one advantage and one disadvantage of proprietary software for a business.',
    'Advantage (1): professional support / well tested / regular updates / reliable. Disadvantage (1): cost / licence fees / cannot change the code / tied to one company.',
    '=support|tested|updates|reliable|professional|warranty\n=cost|costs|expensive|licence|license|fee|fees|paid|cannot change|cannot modify|cannot edit',
    '2 | It comes with professional support but it costs money\n2 | It is well tested but you cannot change the source code\n1 | It is expensive\n0 | The source code is free to change', []);

  // 2.1.1a Abstraction
  M('2.1.1a', '', 1, 'What is abstraction?', ['Breaking a problem into smaller parts', 'Removing unnecessary detail to focus on what is important', 'Writing code in a high-level language', 'Testing a program'], 'B',
    ['That is decomposition.', '', 'That is not abstraction.', 'That is testing.'], []);
  M('2.1.1a', '', 3, 'A London Underground map shows stations and lines but not exact distances or streets. This is an example of…', ['decomposition', 'abstraction', 'iteration', 'validation'], 'B',
    ['Decomposition breaks a problem into parts.', '', 'Iteration is repetition.', 'Validation checks input.'], []);
  S('2.1.1a', '', 4, 'Describe', 2, 'Describe how abstraction could be used when creating a computer game of football.',
    'Unnecessary detail is removed, e.g. crowd / weather / player names (1). Only important details are kept, e.g. ball position / players / score (1).',
    '=remove|removed|removing|ignore|ignored|leave out|left out|unnecessary|not needed\n=keep|kept|important|ball|score|players|position|rules|focus',
    '2 | Remove unnecessary detail like the crowd and keep the important things like the ball and score\n1 | Remove unnecessary details\n0 | Break the game into smaller parts', []);

  // 2.1.1b Decomposition
  M('2.1.1b', '', 1, 'What is decomposition?', ['Breaking a problem down into smaller, more manageable parts', 'Removing unnecessary detail', 'Repeating code', 'Converting to binary'], 'A',
    ['', 'That is abstraction.', 'That is iteration.', 'That is data representation.'], []);
  S('2.1.1b', '', 3, 'Give', 2, 'Give two benefits of decomposition when writing a large program.',
    'Any two: each part is easier to solve / understand (1); parts can be worked on by different people / at the same time (1); parts can be tested separately (1); parts can be reused (1).',
    '=easier|simpler|manageable|understand\n=different people|team|teams|same time|parallel|shared\n=test|tested|testing|debug\n=reuse|reused|reusable\nmax 2',
    '2 | Each part is easier to solve and parts can be tested separately\n2 | Different people can work on parts at the same time and code can be reused\n1 | It is easier\n0 | It removes unnecessary detail', []);

  // 2.1.1c Algorithmic thinking
  M('2.1.1c', '', 2, 'What is algorithmic thinking?', ['Identifying the steps needed to solve a problem', 'Writing code without planning', 'Removing detail', 'Testing with erroneous data'], 'A',
    ['', 'Algorithmic thinking IS planning the steps.', 'That is abstraction.', 'That is testing.'], []);

  // 2.1.2a Inputs, processes, outputs
  M('2.1.2a', '', 1, 'A program asks for two numbers and displays their total. What is the OUTPUT?', ['The two numbers', 'Adding the numbers', 'The total displayed', 'The keyboard'], 'C',
    ['The two numbers are inputs.', 'Adding is the process.', '', 'The keyboard is an input device, not the output.'], []);
  S('2.1.2a', '', 3, 'Identify', 2, 'A program calculates the area of a rectangle. Identify the inputs and the output.',
    'Inputs: width / length and height (1). Output: the area (1).',
    '=width|length|height|sides|base\n=output is the area|output is area|outputs the area|output the area|area is the output|area is output|output area',
    '2 | The inputs are the width and height and the output is the area\n1 | The output is the area\n0 | The input is the area', []);

  // 2.1.2b Structure diagrams
  M('2.1.2b', '', 2, 'What does a structure diagram show?', ['The order of every instruction', 'How a problem is broken down into smaller sub-sections', 'The values of variables as a program runs', 'The binary code of a program'], 'B',
    ['That is a flowchart or pseudocode.', '', 'That is a trace table.', 'Structure diagrams are a design tool, not machine code.'], []);

  // 2.1.2c Pseudocode / ERL
  M('2.1.2c', '', 2, 'Why do programmers write pseudocode before writing a program?', ['Pseudocode runs faster', 'To plan the logic of an algorithm without worrying about exact syntax', 'It can be compiled directly', 'It finds syntax errors'], 'B',
    ['Pseudocode cannot be run.', '', 'Pseudocode is not compiled.', 'Pseudocode is not checked by a translator.'], []);
  M('2.1.2c', '', 3, 'What is output by this ERL code?\nx = 4\ny = x * 3\nprint(y - 2)', ['10', '12', '4', '14'], 'A',
    ['', '12 is y, but 2 is subtracted before printing.', '4 is x.', 'The program subtracts 2 – it does not add.'], []);

  // 2.1.2d Flowcharts
  M('2.1.2d', '', 1, 'Which flowchart symbol is used for a DECISION?', ['Rectangle', 'Diamond', 'Parallelogram', 'Rounded rectangle'], 'B',
    ['A rectangle is a process.', '', 'A parallelogram is input/output.', 'A rounded rectangle is start/stop.'], []);
  M('2.1.2d', '', 2, 'Which flowchart symbol is used for INPUT or OUTPUT?', ['Diamond', 'Parallelogram', 'Rectangle', 'Circle'], 'B',
    ['A diamond is a decision.', '', 'A rectangle is a process.', 'Circles are not used for input/output in J277 flowcharts.'], []);

  // 2.1.2e Trace tables (skills)
  M('2.1.2e', 'loop', 2, 'What is the final value of total?\ntotal = 0\nfor i = 1 to 3\n    total = total + i\nnext i', ['3', '5', '6', '0'], 'C',
    ['3 is the last value of i, not the total.', '5 would be 2 + 3 – you missed adding 1.', '', 'The loop does change total.'], ['G2', 'I1']);
  M('2.1.2e', 'loop', 3, 'What is output?\nn = 10\nwhile n > 3\n    n = n - 4\nendwhile\nprint(n)', ['6', '2', '-2', '3'], 'B',
    ['6 is after one pass – but 6 > 3, so the loop runs again.', '', 'The loop stops when n = 2 because 2 > 3 is false.', 'n never equals 3.'], ['G2', 'I2']);
  S('2.1.2e', 'loop', 4, 'State', 1, 'State the value printed by this algorithm.\ncount = 0\nfor i = 2 to 10 step 2\n    count = count + 1\nnext i\nprint(count)',
    '5 (i = 2, 4, 6, 8, 10).',
    '=5|five',
    '1 | 5\n1 | five\n0 | 10\n0 | 4', ['G2', 'I1']);
  M('2.1.2e', 'selection', 2, 'What is output when mark = 65?\nif mark >= 70 then\n    print("A")\nelseif mark >= 60 then\n    print("B")\nelse\n    print("C")\nendif', ['A', 'B', 'C', 'B and C'], 'B',
    ['65 is not >= 70.', '', '65 >= 60 is true, so the elseif branch runs and the else is skipped.', 'Only one branch of an if/elseif/else ever runs.'], ['G2', 'Q1']);
  M('2.1.2e', 'output', 4, 'What is output?\nx = 1\nfor i = 1 to 3\n    x = x * 2\n    print(x)\nnext i', ['1 2 3', '2 4 8', '2 4 6', '8'], 'B',
    ['The program prints x, not i.', '', 'x is multiplied by 2 each time, not increased by 2.', 'print is inside the loop, so it prints 3 times.'], ['G2']);
  S('2.1.2e', 'output', 5, 'State', 1, 'State what is output by this algorithm.\nword = "LOOP"\nresult = ""\nfor i = 0 to word.length - 1\n    result = word.substring(i, 1) + result\nnext i\nprint(result)',
    'POOL (the word reversed).',
    '=pool',
    '1 | POOL\n1 | pool\n0 | LOOP\n0 | PLOO', ['G2', 'Q8']);

  // 2.1.2f Errors in algorithms
  M('2.1.2f', '', 3, 'This algorithm should print the numbers 1 to 5:\nfor i = 1 to 4\n    print(i)\nnext i\nWhat is the error?', ['print should be input', 'The loop should go to 5, not 4', 'i should start at 0', 'next i should be endwhile'], 'B',
    ['The program outputs numbers, so print is correct.', '', 'Starting at 0 would print 0 to 4.', 'A for loop ends with next, not endwhile.'], ['I1']);
  M('2.1.2f', '', 4, 'This algorithm should keep asking for a password until it is "abc":\npw = ""\nwhile pw == "abc"\n    pw = input("Password")\nendwhile\nWhat is wrong?', ['The condition should be pw != "abc"', 'It should use a for loop', 'pw should start as "abc"', 'input should be print'], 'A',
    ['', 'A for loop is wrong here: we do not know how many attempts the user will need.', 'Changing the start value does not fix it – the loop would then repeat while the password IS correct. The condition is the error.', 'The program needs input from the user.'], ['I2', 'I3']);
  S('2.1.2f', '', 4, 'Identify', 1, 'This algorithm should add up 5 numbers entered by the user, but always outputs the last number only.\nfor i = 1 to 5\n    total = 0\n    total = total + int(input("Number"))\nnext i\nprint(total)\nIdentify the error.',
    'total = 0 is inside the loop, so it is reset each time – it should be before the loop.',
    '=inside the loop|in the loop|reset|resets|set to 0 each time|before the loop|outside the loop|move total|moved',
    '1 | total = 0 is inside the loop so it resets each time\n1 | total should be set to 0 before the loop\n0 | The loop should go to 6\n0 | input should be print', ['I1', 'G2']);

  // 2.1.3a Linear search
  M('2.1.3a', '', 1, 'How does a linear search work?', ['It checks each item in turn from the start until it finds the target or reaches the end', 'It checks the middle item and discards half the list', 'It sorts the list first', 'It only works on numbers'], 'A',
    ['', 'That is a binary search.', 'Linear search does not need to sort.', 'It works on any data type.'], ['A1']);
  M('2.1.3a', '', 3, 'A linear search looks for 9 in [4, 7, 9, 2, 9]. How many items are checked?', ['1', '2', '3', '5'], 'C',
    ['Item 1 is 4, not 9.', 'Item 2 is 7, not 9.', '', 'The search stops at the FIRST 9 it finds.'], ['A1']);
  S('2.1.3a', '', 4, 'Give', 1, 'Give one advantage of a linear search over a binary search.',
    'The data does not need to be sorted / simpler to program / works well on small lists.',
    '=not have to be sorted|not need to be sorted|not be sorted|not sorted|unsorted|any order|simpler|simple|easier|small',
    '1 | The data does not have to be sorted\n1 | It is simpler to code\n0 | It is always faster\n0 | It halves the list each time', ['A1']);

  // 2.1.3b Binary search
  M('2.1.3b', '', 2, 'What must be true before a binary search can be used?', ['The list must be sorted', 'The list must have an even number of items', 'The list must contain numbers', 'The list must have fewer than 100 items'], 'A',
    ['', 'Binary search works with any length.', 'It works with any data that can be sorted, e.g. names.', 'It works with any size – it is BEST for large lists.'], ['A1']);
  M('2.1.3b', '', 4, 'A binary search looks for 31 in [3, 8, 15, 22, 31, 40, 47]. Which items are compared, in order?', ['3, 8, 15, 22, 31', '22, 40, 31', '22, 31', '31'], 'B',
    ['That is a linear search.', '', 'After 22 the middle of [31, 40, 47] is 40, not 31.', 'The search starts in the middle, not at the target.'], ['A1']);
  S('2.1.3b', '', 3, 'Explain', 2, 'Explain why a binary search is usually faster than a linear search for a large sorted list.',
    'Half of the remaining items are discarded after each comparison (1) so far fewer items need to be checked (1).',
    '=half|halves|halving|discard|discards|discarded|removes|eliminates\n=fewer|less|not every|far fewer|smaller number|less comparisons|fewer comparisons',
    '2 | It discards half the list each time so far fewer items are checked\n2 | It halves the data so it needs fewer comparisons\n1 | It halves the list\n0 | It checks every item', ['A1', 'E1']);

  // 2.1.3c Bubble sort
  M('2.1.3c', '', 2, 'How does a bubble sort work?', ['It compares pairs of neighbouring items and swaps them if they are in the wrong order, repeating until no swaps are needed', 'It splits the list in half repeatedly', 'It inserts each item into a sorted part of the list', 'It checks the middle item'], 'A',
    ['', 'That is merge sort.', 'That is insertion sort.', 'That is binary search.'], ['G1']);
  M('2.1.3c', '', 4, 'After the FIRST pass of a bubble sort (ascending), what is [5, 1, 4, 2]?', ['[1, 4, 2, 5]', '[1, 2, 4, 5]', '[1, 5, 4, 2]', '[5, 4, 2, 1]'], 'A',
    ['', 'This is the fully sorted list – it takes more than one pass.', 'Only the first comparison has been done here.', 'This is descending order.'], ['G1']);
  S('2.1.3c', '', 3, 'State', 1, 'State how a bubble sort knows that the list is sorted.',
    'A whole pass is completed with no swaps.',
    '=no swaps|without swapping|no swap|without any swaps|nothing swapped|zero swaps',
    '1 | When a full pass is made with no swaps\n1 | It goes through without any swaps\n0 | When it reaches the end once\n0 | When the middle item is found', ['G1']);

  // 2.1.3d Merge sort
  M('2.1.3d', '', 2, 'What are the two main stages of a merge sort?', ['Compare and swap', 'Split the list into single items, then merge them back together in order', 'Search and insert', 'Sort the middle, then the ends'], 'B',
    ['That is bubble sort.', '', 'That is closer to insertion sort.', 'That is not merge sort.'], ['G1']);
  S('2.1.3d', '', 4, 'Give', 1, 'Give one advantage of a merge sort compared to a bubble sort.',
    'Faster / more efficient for large lists.',
    '=faster|quicker|efficient|large|larger|big|bigger|fewer comparisons',
    '1 | It is faster for large lists\n1 | More efficient\n0 | It uses less memory\n0 | It is easier to code', ['G1']);

  // 2.1.3e Insertion sort
  M('2.1.3e', '', 3, 'How does an insertion sort work?', ['Each item is taken in turn and inserted into the correct place in the sorted part of the list', 'Neighbouring items are swapped until no swaps are needed', 'The list is split into single items', 'The middle item is compared'], 'A',
    ['', 'That is bubble sort.', 'That is merge sort.', 'That is binary search.'], ['G1']);
  M('2.1.3e', '', 4, 'An insertion sort (ascending) is part-way through [2, 6, 9, 4, 1]: the first three items are sorted. What does the list look like after the next item is inserted?', ['[2, 4, 6, 9, 1]', '[2, 6, 4, 9, 1]', '[1, 2, 4, 6, 9]', '[4, 2, 6, 9, 1]'], 'A',
    ['', 'That is one bubble-sort swap, not an insertion.', 'That is the fully sorted list – only one more item has been inserted.', '4 belongs after 2, not before it.'], ['G1']);
})(GCSE_BANK_X.M, GCSE_BANK_X.S);
