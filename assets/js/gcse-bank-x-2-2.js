// Extended bank – 2.2 Programming fundamentals (original exam-style questions, OCR Exam Reference Language).
// Every question is tagged with a SKILL so needs can be pinned down, e.g. while loops vs for loops.
(function (M, S) {
  // ── 2.2.1a Variables, constants, input/output, assignment ──
  M('2.2.1a', 'vars', 1, 'What is a variable?', ['A named location in memory whose value can change while the program runs', 'A value that can never change', 'A type of loop', 'An error in a program'], 'A',
    ['', 'That is a constant.', 'Loops repeat code; variables store values.', 'Errors are not variables.'], []);
  M('2.2.1a', 'vars', 2, 'Why would VAT_RATE = 0.2 be stored as a constant rather than a variable?', ['Constants run faster', 'The value should not change while the program runs, and it only needs updating in one place', 'Constants use less memory than any variable', 'Variables cannot store decimals'], 'B',
    ['Speed is not the reason.', '', 'Memory is not the reason.', 'Variables can store decimals (real numbers).'], []);
  S('2.2.1a', 'vars', 3, 'State', 1, 'State the difference between a variable and a constant.',
    'A variable\'s value can change while the program runs; a constant\'s value cannot change.',
    '=can change|changes|change while|vary|varies|fixed|cannot change|cannot be changed|stays the same|same value|does not change',
    '1 | A variable can change but a constant cannot change while the program runs\n1 | A constant stays the same\n0 | They are both the same\n0 | A constant is a type of loop', []);
  M('2.2.1a', 'assign', 2, 'What is the value of a after this code runs?\na = 5\nb = a\na = 9', ['5', '9', '14', 'b'], 'B',
    ['a was 5, but it is then assigned 9.', '', 'Assignment replaces the value; it does not add.', 'a stores a number, not the name b.'], ['Q2']);
  M('2.2.1a', 'assign', 3, 'What are the values of x and y after this code runs?\nx = 3\ny = 7\nx = y\ny = x', ['x = 7, y = 3', 'x = 7, y = 7', 'x = 3, y = 3', 'x = 3, y = 7'], 'B',
    ['To swap values you need a temporary variable – here y is set to the NEW x (7).', '', 'x is changed to 7 first.', 'Both lines change values.'], ['Q2']);
  M('2.2.1a', 'io', 1, 'Which ERL statement asks the user to type their name and stores it?', ['print(name)', 'name = input("Enter your name")', 'name == "Enter your name"', 'input = name'], 'B',
    ['print outputs; it does not store input.', '', '== compares; it does not assign.', 'This tries to assign to "input".'], ['Q2']);
  S('2.2.1a', 'io', 3, 'Write', 1, 'Write an ERL statement that outputs the message Hello followed by the contents of the variable name.',
    'print("Hello " + name)  (or print("Hello", name)).',
    '=print & hello & name',
    '1 | print("Hello " + name)\n1 | print("Hello", name)\n0 | input("Hello")\n0 | name = "Hello"', []);

  // ── 2.2.1b Sequence ──
  M('2.2.1b', '', 1, 'What is meant by "sequence" in programming?', ['Instructions are carried out one after another in order', 'A decision between two paths', 'Repeating instructions', 'A list of numbers'], 'A',
    ['', 'That is selection.', 'That is iteration.', 'That is an array.'], []);
  M('2.2.1b', '', 3, 'What is output?\nx = 2\nprint(x)\nx = x + 5\nprint(x)', ['2 then 7', '7 then 7', '2 then 2', '7 then 2'], 'A',
    ['', 'The first print runs BEFORE x is changed.', 'x is changed between the two prints.', 'Statements run top to bottom.'], []);

  // ── 2.2.1c Selection (skills: if, elif, nested, switch) ──
  M('2.2.1c', 'if', 1, 'Which programming construct is used to choose between two paths?', ['Sequence', 'Selection', 'Iteration', 'Assignment'], 'B',
    ['Sequence runs instructions in order.', '', 'Iteration repeats.', 'Assignment stores a value.'], []);
  M('2.2.1c', 'if', 2, 'What is output when age = 16?\nif age >= 17 then\n    print("Can drive")\nelse\n    print("Too young")\nendif', ['Can drive', 'Too young', 'Can drive Too young', 'Nothing'], 'B',
    ['16 is not >= 17.', '', 'Only one branch of if/else runs.', 'The else branch runs when the condition is false.'], ['Q3']);
  M('2.2.1c', 'if', 3, 'What is output when score = 50?\nif score > 50 then\n    print("Pass")\nelse\n    print("Fail")\nendif', ['Pass', 'Fail', 'Pass Fail', 'Error'], 'B',
    ['50 > 50 is FALSE – it would need >= to include 50.', '', 'Only one branch runs.', 'The code is valid.'], ['Q3']);
  M('2.2.1c', 'elif', 3, 'What is output when temp = 25?\nif temp > 30 then\n    print("Hot")\nelseif temp > 20 then\n    print("Warm")\nelseif temp > 10 then\n    print("Mild")\nelse\n    print("Cold")\nendif', ['Hot', 'Warm', 'Warm Mild', 'Mild'], 'B',
    ['25 > 30 is false.', '', 'Only the FIRST true branch runs – Mild is skipped.', '25 > 10 is true, but the earlier "Warm" branch already ran.'], ['Q1']);
  M('2.2.1c', 'elif', 4, 'This code gives a grade. What is output when mark = 75?\nif mark >= 50 then\n    print("C")\nelseif mark >= 70 then\n    print("B")\nelseif mark >= 90 then\n    print("A")\nendif', ['A', 'B', 'C', 'B and C'], 'C',
    ['75 is not >= 90.', 'The first condition (>= 50) is already true, so this branch is never reached for 75. The conditions are in the wrong order!', '', 'Only the first true branch runs.'], ['Q1']);
  S('2.2.1c', 'elif', 5, 'Explain', 2, 'This code should print "B" for marks of 70 or more, but prints "C" for every mark of 50 or more.\nif mark >= 50 then\n    print("C")\nelseif mark >= 70 then\n    print("B")\nendif\nExplain the problem and how to fix it.',
    'The first condition (>= 50) is also true for 70+, and only the first true branch runs (1). Check the highest boundary first / swap the order of the conditions (1).',
    '=first|only one|already true|also true|true first|stops|skipped|never reached|never runs\n=swap|order|reverse|70 first|highest first|check 70|before',
    '2 | Marks over 70 are also over 50 so the first branch always runs. Swap the order and check 70 first\n2 | The elseif is never reached so put the 70 condition before the 50 one\n1 | Swap the order\n0 | Change print to input', ['Q1', 'E1']);
  M('2.2.1c', 'nested', 4, 'What is output when x = 8 and y = 3?\nif x > 5 then\n    if y > 5 then\n        print("Both")\n    else\n        print("Only x")\n    endif\nelse\n    print("Not x")\nendif', ['Both', 'Only x', 'Not x', 'Only x Not x'], 'B',
    ['y is 3, so the inner condition y > 5 is false.', '', 'x > 5 is true, so the outer else does not run.', 'Only one path through the nested if runs.'], []);
  S('2.2.1c', 'nested', 3, 'State', 1, 'State what is meant by nested selection.',
    'An if statement inside another if statement.',
    '=inside|within|in another|inside another|in an if|nested inside|one if in another',
    '1 | An if statement inside another if statement\n1 | Selection within another selection\n0 | Two loops\n0 | An if after another if', []);
  M('2.2.1c', 'switch', 3, 'What is output when choice = "b"?\nswitch choice:\n    case "a":\n        print("Add")\n    case "b":\n        print("Delete")\n    default:\n        print("Invalid")\nendswitch', ['Add', 'Delete', 'Invalid', 'Delete Invalid'], 'B',
    ['"b" does not match case "a".', '', 'default only runs when no case matches.', 'In ERL only the matching case runs.'], []);
  M('2.2.1c', 'switch', 4, 'When is a switch/case statement a better choice than a long if/elseif chain?', ['When one variable is checked against many fixed values', 'When you need to repeat code', 'When comparing ranges such as > 70', 'Never – they are always worse'], 'A',
    ['', 'Repetition needs a loop.', 'Ranges are easier with if/elseif.', 'They are clearer for checking one value against many options.'], []);

  // ── 2.2.1d Iteration (skills: for, while, dountil, nested, choose) ──
  // for loops
  M('2.2.1d', 'for', 1, 'Which type of loop repeats a SET number of times?', ['Count-controlled (for)', 'Condition-controlled (while)', 'Selection', 'Sequence'], 'A',
    ['', 'A while loop repeats until a condition changes, not a set number of times.', 'Selection chooses a path; it does not repeat.', 'Sequence does not repeat.'], ['I3']);
  M('2.2.1d', 'for', 2, 'How many times is "Hi" printed?\nfor i = 1 to 5\n    print("Hi")\nnext i', ['4', '5', '6', '1'], 'B',
    ['In ERL "1 to 5" INCLUDES 5: i = 1, 2, 3, 4, 5.', '', 'It stops after i = 5.', 'print is inside the loop.'], ['I1']);
  M('2.2.1d', 'for', 2, 'How many times does this loop run?\nfor i = 0 to 4\n    print(i)\nnext i', ['4', '5', '3', '0'], 'B',
    ['Counting from 0: 0, 1, 2, 3, 4 – that is 5 values.', '', 'Count every value including 0 and 4.', 'The loop does run.'], ['I1']);
  M('2.2.1d', 'for', 3, 'In Python, how many numbers does this print?\nfor i in range(1, 5):\n    print(i)', ['5', '4', '6', '1'], 'B',
    ['range(1, 5) stops BEFORE 5, so it prints 1, 2, 3, 4.', '', 'It does not go past 5.', 'print is inside the loop.'], ['I1']);
  M('2.2.1d', 'for', 3, 'What is output?\nfor i = 10 to 0 step -5\n    print(i)\nnext i', ['10 5 0', '10 5', '0 5 10', '10 0'], 'A',
    ['', '"to 0" INCLUDES 0.', 'step -5 counts DOWN from 10.', 'It goes down in steps of 5, so 5 is printed too.'], ['I1']);
  S('2.2.1d', 'for', 3, 'Write', 2, 'Write an ERL for loop that prints the numbers 1 to 10.',
    'for i = 1 to 10 (1) / print(i) ... next i (1).',
    '=for & 1 & 10\n=print',
    '2 | for i = 1 to 10 print(i) next i\n2 | for x = 1 to 10 print(x) next x\n1 | for i = 1 to 10\n0 | while x < 10', ['I1']);
  S('2.2.1d', 'for', 4, 'State', 1, 'State the value printed.\ntotal = 0\nfor i = 1 to 4\n    total = total + i * 2\nnext i\nprint(total)',
    '20 (2 + 4 + 6 + 8).',
    '=20|twenty',
    '1 | 20\n1 | twenty\n0 | 10\n0 | 8', ['I1', 'G2']);
  // while loops
  M('2.2.1d', 'while', 1, 'Which type of loop repeats WHILE a condition is true?', ['for', 'while', 'switch', 'if'], 'B',
    ['A for loop repeats a set number of times.', '', 'switch is selection, not a loop.', 'if is selection, not a loop.'], ['I2']);
  M('2.2.1d', 'while', 2, 'What is output?\nx = 1\nwhile x < 10\n    x = x + 3\nendwhile\nprint(x)', ['7', '10', '9', '13'], 'B',
    ['After x = 7, the check 7 < 10 is true, so it runs again.', '', 'x goes 1, 4, 7, 10 – it never equals 9.', 'The loop stops at 10 because 10 < 10 is false.'], ['I2', 'G2']);
  M('2.2.1d', 'while', 3, 'How many times does the loop body run?\nx = 20\nwhile x < 10\n    x = x + 1\nendwhile', ['0', '1', '10', 'It never stops'], 'A',
    ['', 'A while loop checks its condition FIRST: 20 < 10 is false, so the body never runs.', 'It would never get started.', 'It stops straight away – the condition is false at the start.'], ['I4']);
  M('2.2.1d', 'while', 3, 'What is wrong with this loop?\ncount = 0\nwhile count < 5\n    print(count)\nendwhile', ['It should be a for loop', 'count never changes, so the loop never stops (infinite loop)', 'count should start at 1', 'print should be input'], 'B',
    ['A for loop would work, but the actual bug is that the condition never becomes false.', '', 'Starting at 1 would still loop forever.', 'The program is meant to output.'], ['I2']);
  S('2.2.1d', 'while', 4, 'Explain', 2, 'Explain why this loop never stops, and how to fix it.\nn = 1\nwhile n != 10\n    n = n + 2\nendwhile',
    'n goes 1, 3, 5, 7, 9, 11… and is never exactly 10 (1). Fix: use while n < 10 / start n at 0 / add 1 instead (1).',
    '=never equals|never 10|never exactly|skips 10|skips|odd|9 then 11|goes past|jumps over\n=n < 10|< 10|less than 10|start at 0|start n at 0|n = 0|add 1|+ 1|n + 1',
    '2 | n is always odd so it never equals 10. Change the condition to n < 10\n2 | It skips from 9 to 11 so start n at 0\n1 | n never equals 10\n0 | Use a for loop', ['I2', 'E1']);
  S('2.2.1d', 'while', 5, 'Write', 2, 'Write ERL code that keeps asking the user for a password until they type "letmein".',
    'A condition-controlled loop that checks the password (1) with input inside the loop (1). e.g. pw = "" / while pw != "letmein" / pw = input("Password") / endwhile.',
    '=while|do|until|repeat\n=input & letmein',
    '2 | pw = "" while pw != "letmein" pw = input("Password") endwhile\n2 | do pw = input("Password") until pw == "letmein"\n1 | while pw != "letmein"\n0 | for i = 1 to 3 print("letmein")', ['I2', 'I3']);
  // do-until
  M('2.2.1d', 'dountil', 3, 'What is output?\nx = 5\ndo\n    x = x + 1\nuntil x > 3\nprint(x)', ['5', '6', '4', 'Nothing – it never runs'], 'B',
    ['A do-until loop always runs at least once before checking.', '', 'x starts at 5 and goes UP.', 'do-until checks AFTER the body, so it runs once.'], ['I4']);
  M('2.2.1d', 'dountil', 4, 'What is the key difference between a while loop and a do-until loop?', ['A do-until loop always runs at least once; a while loop may not run at all', 'A while loop always runs at least once', 'Only do-until loops can be infinite', 'They are identical'], 'A',
    ['', 'It is the other way round – while checks first, so it may run 0 times.', 'Both can be infinite if the condition never changes.', 'They check the condition at different times.'], ['I4']);
  S('2.2.1d', 'dountil', 4, 'Explain', 1, 'Explain why a do-until loop is suitable for a menu that must be shown to the user at least once.',
    'A do-until loop checks its condition at the END, so the body (the menu) always runs at least once.',
    '=at least once|always runs|runs once|checks at the end|checked at the end|condition at the end|end of the loop|after',
    '1 | It checks the condition at the end so the menu always runs at least once\n1 | The menu is shown at least once\n0 | It is faster than a while loop\n0 | It runs a set number of times', ['I4']);
  // nested loops
  M('2.2.1d', 'nested', 3, 'How many times is "*" printed?\nfor i = 1 to 3\n    for j = 1 to 4\n        print("*")\n    next j\nnext i', ['7', '12', '4', '3'], 'B',
    ['The loops are nested, not one after another – multiply, do not add.', '', '4 is just one pass of the inner loop.', '3 is just the outer loop.'], ['I5']);
  M('2.2.1d', 'nested', 4, 'What is the LAST line output?\nfor i = 1 to 2\n    for j = 1 to 3\n        print(i * j)\n    next j\nnext i', ['3', '6', '2', '9'], 'B',
    ['3 is the last value when i = 1.', '', '2 is i, not i × j.', 'i only goes up to 2, so the largest is 2 × 3.'], ['I5']);
  S('2.2.1d', 'nested', 5, 'State', 1, 'State how many times "Go" is printed.\nfor a = 0 to 4\n    for b = 0 to a\n        print("Go")\n    next b\nnext a',
    '15 (1 + 2 + 3 + 4 + 5).',
    '=15|fifteen',
    '1 | 15\n1 | fifteen\n0 | 25\n0 | 10', ['I5']);
  // choosing the right loop
  M('2.2.1d', 'choose', 2, 'A program must print the 12 times table from 1 × 12 to 12 × 12. Which loop is most suitable?', ['A for loop, because the number of repeats (12) is known', 'A while loop, because it must stop', 'A do-until loop, because it must run at least once', 'No loop is needed'], 'A',
    ['', 'Every loop stops eventually – the number of repeats is known, so a for loop fits best.', 'A for loop already runs 12 times.', 'Without a loop you would need 12 print statements.'], ['I3']);
  M('2.2.1d', 'choose', 3, 'A game keeps asking "Play again?" until the user types "no". Which loop is most suitable?', ['A for loop', 'A condition-controlled loop (while or do-until)', 'Nested for loops', 'An if statement'], 'B',
    ['We do not know how many times they will play, so a for loop does not fit.', '', 'Nested loops are not needed.', 'An if statement does not repeat.'], ['I3']);
  S('2.2.1d', 'choose', 4, 'Explain', 2, 'A program reads numbers until the user enters 0. Explain why a while loop is more suitable than a for loop.',
    'The number of numbers is not known in advance (1); a while loop repeats until a condition is met (the user enters 0) (1).',
    '=not known|unknown|do not know|dont know|how many|number of times|in advance\n=condition|until|0|zero|stops when|met',
    '2 | We do not know how many numbers will be entered so it should loop until the user enters 0\n2 | The number of times is unknown and a while loop stops when a condition is met\n1 | We do not know how many times\n0 | A for loop cannot use numbers', ['I3', 'E1']);
  S('2.2.1d', 'choose', 3, 'State', 1, 'State the difference between a count-controlled loop and a condition-controlled loop.',
    'A count-controlled loop repeats a set / known number of times; a condition-controlled loop repeats until / while a condition is met.',
    '=set number|known number|fixed number|certain number|number of times|specific number',
    '1 | Count-controlled repeats a set number of times; condition-controlled repeats until a condition is met\n1 | A count controlled loop runs a fixed number of times\n0 | They are the same\n0 | A condition controlled loop runs once', ['I3']);

  // ── 2.2.1e Arithmetic (skills: basic, divmod, power) ──
  M('2.2.1e', 'basic', 1, 'What is the result of 7 * 3 - 1?', ['20', '14', '21', '28'], 'A',
    ['', 'Multiplication first: 21, then subtract 1.', '21 is before subtracting 1.', 'That would be 7 × (3 + 1).'], []);
  M('2.2.1e', 'divmod', 2, 'What is 17 DIV 5?', ['3', '2', '3.4', '12'], 'A',
    ['', '2 is the remainder – that is MOD.', 'DIV gives the whole-number part only.', '12 is 17 − 5.'], ['Q4']);
  M('2.2.1e', 'divmod', 2, 'What is 17 MOD 5?', ['3', '2', '3.4', '0'], 'B',
    ['3 is how many times 5 goes into 17 – that is DIV.', '', 'MOD gives the remainder, not a decimal.', '17 is not a multiple of 5, so the remainder is not 0.'], ['Q4']);
  M('2.2.1e', 'divmod', 3, 'Which condition checks whether the number n is EVEN?', ['n DIV 2 == 0', 'n MOD 2 == 0', 'n / 2 == 1', 'n MOD 2 == 1'], 'B',
    ['n DIV 2 is only 0 for n = 0 or 1.', '', 'That is only true for n = 2.', 'A remainder of 1 means n is ODD.'], ['Q4']);
  S('2.2.1e', 'divmod', 4, 'State', 2, 'A program converts 200 minutes into hours and minutes. State the result of 200 DIV 60 and of 200 MOD 60.',
    '200 DIV 60 = 3 (1). 200 MOD 60 = 20 (1).',
    '=3 hours|div 60 = 3|div 60 is 3|3 and\n=20|twenty',
    '2 | 3 hours and 20 minutes\n2 | 200 DIV 60 = 3 and 200 MOD 60 = 20\n1 | 3 hours\n0 | 3.33', ['Q4']);
  M('2.2.1e', 'power', 2, 'What is 2 ^ 3?', ['6', '8', '5', '9'], 'B',
    ['^ is "to the power of", not multiply.', '', '^ is not add.', '9 is 3 ^ 2.'], []);
  M('2.2.1e', 'power', 4, 'What is the value of x?\nx = 3 + 2 ^ 2 * 2', ['50', '11', '14', '25'], 'B',
    ['That ignores the order of operations.', '', 'Powers first: 2^2 = 4, then 4 × 2 = 8, then 3 + 8.', '25 is (3 + 2)^2.'], []);

  // ── 2.2.1f Comparison and Boolean operators (skills: compare, boolean) ──
  M('2.2.1f', 'compare', 1, 'Which operator means "not equal to" in ERL?', ['==', '!=', '<=', '='], 'B',
    ['== means "equal to".', '', '<= means less than or equal to.', '= is assignment.'], ['Q2']);
  M('2.2.1f', 'compare', 2, 'Which values of age make (age >= 13 AND age <= 19) true?', ['12 to 20', '13 to 19 including 13 and 19', '14 to 18 only', 'Any age'], 'B',
    ['12 and 20 are outside the range.', '', '>= and <= INCLUDE the end values.', 'Both parts must be true.'], ['Q3']);
  M('2.2.1f', 'compare', 3, 'What is the difference between = and == in ERL?', ['There is none', '= assigns a value; == compares two values', '= compares; == assigns', '== is only used in loops'], 'B',
    ['They do different jobs.', '', 'It is the other way round.', '== can be used in any condition.'], ['Q2']);
  M('2.2.1f', 'boolean', 2, 'When is (raining OR cold) true?', ['Only when both are true', 'When at least one is true', 'Only when both are false', 'Never'], 'B',
    ['That is AND.', '', 'Both false gives false.', 'OR is true whenever at least one is true.'], ['B1']);
  M('2.2.1f', 'boolean', 3, 'x = 5. Which condition is TRUE?', ['x > 3 AND x < 5', 'x > 3 OR x > 10', 'NOT (x == 5)', 'x < 3 AND x > 1'], 'B',
    ['x < 5 is false (5 is not less than 5).', '', 'x == 5 is true, so NOT makes it false.', 'x < 3 is false.'], ['B1', 'Q3']);
  S('2.2.1f', 'boolean', 4, 'Write', 1, 'Write a condition that is true when the variable temp is between 18 and 24 inclusive.',
    'temp >= 18 AND temp <= 24.',
    '=18 & 24 & and',
    '1 | temp >= 18 AND temp <= 24\n1 | (temp >= 18) and (temp <= 24)\n0 | temp > 18 OR temp < 24\n0 | temp == 18', ['Q3', 'B1']);

  // ── 2.2.2a Data types (skills: numbers, bool, text) ──
  M('2.2.2a', 'numbers', 1, 'Which data type is most suitable for storing the number of students in a class?', ['Real', 'Integer', 'String', 'Boolean'], 'B',
    ['You cannot have half a student, so a whole number type is best.', '', 'A string would stop you doing maths with it.', 'Boolean only stores True/False.'], ['A2']);
  M('2.2.2a', 'numbers', 2, 'Which data type is most suitable for storing someone\'s height in metres, e.g. 1.72?', ['Integer', 'Real (float)', 'Character', 'Boolean'], 'B',
    ['1.72 has a decimal part – an integer would lose it.', '', 'A character is a single symbol.', 'Boolean only stores True/False.'], ['A2']);
  M('2.2.2a', 'bool', 2, 'Which data type stores only True or False?', ['String', 'Integer', 'Boolean', 'Real'], 'C',
    ['A string can hold any text.', 'An integer stores whole numbers.', '', 'A real stores decimal numbers.'], ['A2']);
  M('2.2.2a', 'text', 2, 'Which data type is most suitable for a phone number such as 07700 900123?', ['Integer', 'Real', 'String', 'Boolean'], 'C',
    ['Storing it as an integer would lose the leading 0, and you never do maths with it.', 'It is not a decimal number.', '', 'It is not True/False.'], ['A2']);
  S('2.2.2a', 'text', 3, 'State', 1, 'State the difference between a character and a string.',
    'A character is a single letter / symbol; a string is a sequence of characters.',
    '=single|one character|one letter|one symbol|several|sequence|multiple|more than one|many|series',
    '1 | A character is a single symbol but a string is several characters\n1 | A string is a sequence of characters\n0 | They are the same\n0 | A string is a number', ['A2']);
  S('2.2.2a', 'numbers', 4, 'Explain', 2, 'Explain why a price such as £4.99 should be stored as a real and not an integer.',
    'A price can have a decimal part / pence (1); an integer only stores whole numbers so the .99 would be lost (1).',
    '=decimal|fraction|pence|point|.99\n=whole|lost|rounded|removed|cut off|integer cannot|only whole',
    '2 | A price has a decimal part and an integer only stores whole numbers\n2 | Integers would lose the pence because they are whole numbers\n1 | It has a decimal\n0 | Reals are faster', ['A2', 'E1']);

  // ── 2.2.2b Casting ──
  M('2.2.2b', '', 2, 'What is casting?', ['Converting a value from one data type to another', 'Printing a value', 'Repeating code', 'Storing a value in an array'], 'A',
    ['', 'That is output.', 'That is iteration.', 'That is array assignment.'], ['Q9']);
  M('2.2.2b', '', 3, 'age = input("Age?") stores "15". Which line correctly adds 1 to the age?', ['age = age + 1', 'age = int(age) + 1', 'age = str(age) + 1', 'age = age + "1"'], 'B',
    ['input returns a string – "15" + 1 causes an error.', '', 'str() keeps it as text.', '"15" + "1" joins the text to make "151".'], ['Q9']);
  M('2.2.2b', '', 4, 'What is output?\nx = 7\nprint("Total: " + str(x * 2))', ['Total: 14', 'Total: 77', 'Total: x * 2', 'An error'], 'A',
    ['', 'x * 2 is calculated first (14) and THEN cast to a string.', 'The expression is calculated, not printed as text.', 'str() makes it safe to join with text.'], ['Q9']);
  S('2.2.2b', '', 4, 'Explain', 2, 'Explain why the input from the user must be cast before it is used in a calculation.',
    'input() returns a string / text (1) and you cannot do maths with a string / it would cause an error or join the text, so it must be converted to an integer or real (1).',
    '=string|text|str\n=int|integer|real|float|number|error|join|joined|calculation|maths|convert|converted',
    '2 | Input is always a string so it must be converted to an integer to do maths\n2 | It is text and adding it would cause an error\n1 | Input is a string\n0 | Casting makes the program faster', ['Q9', 'E1']);

  // ── 2.2.3a String manipulation (skills: length, substring, case, concat, ascii) ──
  M('2.2.3a', 'length', 1, 'What is "Computer".length?', ['7', '8', '9', '"Computer"'], 'B',
    ['Count every letter: C-o-m-p-u-t-e-r.', '', 'There are 8 letters.', '.length gives a number.'], ['Q8']);
  M('2.2.3a', 'substring', 3, 'What is "Computer".substring(0, 3)?', ['"Com"', '"omp"', '"Comp"', '"Co"'], 'A',
    ['', 'Positions start at 0, so position 0 is "C".', 'substring(0, 3) takes 3 characters, not 4.', 'It takes 3 characters.'], ['Q8']);
  M('2.2.3a', 'substring', 4, 'What is "Computer".substring(3, 2)?', ['"mp"', '"pu"', '"put"', '"om"'], 'B',
    ['Position 3 is "p" (C=0, o=1, m=2, p=3).', '', 'It takes 2 characters, not 3.', 'That starts at position 1.'], ['Q8']);
  S('2.2.3a', 'substring', 5, 'Write', 1, 'Write an ERL expression that gives the LAST character of a string stored in word.',
    'word.substring(word.length - 1, 1)',
    '=substring & length & 1',
    '1 | word.substring(word.length - 1, 1)\n1 | word.substring(word.length-1, 1)\n0 | word.substring(0, 1)\n0 | word.length', ['Q8']);
  M('2.2.3a', 'case', 2, 'What is "Hello".upper?', ['"hello"', '"HELLO"', '"Hello"', '5'], 'B',
    ['.lower would give "hello".', '', '.upper changes the case.', '5 is the length.'], ['Q8']);
  M('2.2.3a', 'concat', 2, 'What is output?\nfirst = "Sam"\nlast = "Lee"\nprint(first + " " + last)', ['SamLee', 'Sam Lee', 'first last', 'Sam + Lee'], 'B',
    ['The " " adds a space between the names.', '', 'The variables are replaced by their values.', '+ joins the strings; it is not printed.'], ['Q8']);
  M('2.2.3a', 'ascii', 3, 'ASC("A") returns 65. What does CHR(67) return?', ['"B"', '"C"', '"D"', '67'], 'B',
    ['"B" is 66.', '', '"D" is 68.', 'CHR turns a number INTO a character.'], ['Q8']);
  S('2.2.3a', 'ascii', 4, 'State', 1, 'State the value returned by ASC("E"), given that ASC("A") is 65.',
    '69.',
    '=69',
    '1 | 69\n1 | 69 is returned\n0 | 70\n0 | 5', ['Q8']);

  // ── 2.2.3b File handling ──
  M('2.2.3b', '', 2, 'Why should a file be closed after it has been used?', ['To delete it', 'So the data is saved and other programs can use the file', 'To make it smaller', 'To encrypt it'], 'B',
    ['Closing does not delete the file.', '', 'Closing does not compress it.', 'Closing does not encrypt it.'], []);
  M('2.2.3b', '', 3, 'Which ERL code reads every line of a file and prints it?', ['f = open("data.txt")\nwhile NOT f.endOfFile()\n    print(f.readLine())\nendwhile\nf.close()', 'f = open("data.txt")\nprint(f)\nf.close()', 'f = newFile("data.txt")\nf.writeLine("data")', 'for i = 1 to f.length\n    print(i)\nnext i'], 'A',
    ['', 'This prints the file object, not its lines.', 'This creates a file and writes to it.', 'A file does not have a .length of lines in ERL.'], ['I2']);
  S('2.2.3b', '', 4, 'State', 2, 'State the three main steps a program must take to write a line of text to a file.',
    'Open the file (1); write the line, e.g. writeLine (1); close the file (1). Max 2 – all three for full marks shown as 2.',
    '=open|opens|newfile|new file\n=close|closes|closed\n=write|writeline|writes',
    '2 | Open the file, write the line, close the file\n1 | Open the file\n0 | Print the text', []);

  // ── 2.2.3c Records and SQL (skills: records, select) ──
  M('2.2.3c', 'records', 2, 'In a database table of students, what is a FIELD?', ['All the data about one student', 'One category of data, e.g. Surname', 'The whole table', 'A query'], 'B',
    ['All the data about one student is a record.', '', 'The table holds many records and fields.', 'A query searches the table.'], []);
  M('2.2.3c', 'records', 3, 'Why is a record data structure useful?', ['It can store related data of different data types together', 'It can only store integers', 'It is a type of loop', 'It sorts data automatically'], 'A',
    ['', 'Records can store many different data types.', 'A record stores data; it does not repeat.', 'Records do not sort themselves.'], []);
  M('2.2.3c', 'select', 3, 'Which SQL query returns the names of all students in Year 10 from the table Students?', ['SELECT Name FROM Students WHERE Year = 10', 'SELECT Students FROM Name WHERE Year = 10', 'FROM Students SELECT Name', 'SELECT * WHERE Year = 10'], 'A',
    ['', 'The table and field are the wrong way round.', 'SELECT comes before FROM.', 'The query is missing FROM Students.'], []);
  S('2.2.3c', 'select', 4, 'Write', 2, 'Write an SQL query to show all fields for products in the table Products where the Price is more than 10.',
    'SELECT * FROM Products (1) WHERE Price > 10 (1).',
    '=select & from products|from product\n=where & price & 10',
    '2 | SELECT * FROM Products WHERE Price > 10\n1 | SELECT * FROM Products\n0 | SHOW Products', []);

  // ── 2.2.3d Arrays (skills: 1d, 2d, loop) ──
  M('2.2.3d', '1d', 2, 'scores = [12, 7, 19, 4]. What is scores[2]?', ['7', '19', '12', '4'], 'B',
    ['7 is scores[1] – arrays start at index 0.', '', '12 is scores[0].', '4 is scores[3].'], ['Q5']);
  M('2.2.3d', '1d', 3, 'An array has 6 items. What is the index of the LAST item?', ['6', '5', '7', '0'], 'B',
    ['Index 6 does not exist – indexes go 0 to 5.', '', 'There is no index 7.', '0 is the FIRST item.'], ['Q5']);
  M('2.2.3d', '2d', 4, 'grid is a 2D array: row 0 = [3, 8, 1], row 1 = [5, 2, 9]. What is grid[1, 2]?', ['8', '9', '2', '1'], 'B',
    ['8 is grid[0, 1].', '', '2 is grid[1, 1].', '1 is grid[0, 2].'], ['Q5']);
  S('2.2.3d', '2d', 4, 'Give', 1, 'Give one reason for using a 2D array instead of a 1D array.',
    'To store data in a table / rows and columns, e.g. a grid or seating plan / marks for several students in several tests.',
    '=table|rows|columns|grid|row|column|two dimensions|seating|board',
    '1 | To store data in rows and columns\n1 | To store a grid such as a game board\n0 | It is faster\n0 | To store one list', ['Q5']);
  M('2.2.3d', 'loop', 3, 'Which code prints every item in the array names (which has 5 items)?', ['for i = 0 to 4\n    print(names[i])\nnext i', 'for i = 1 to 5\n    print(names[i])\nnext i', 'for i = 0 to 5\n    print(names[i])\nnext i', 'print(names[5])'], 'A',
    ['', 'This misses names[0] and tries names[5], which does not exist.', 'names[5] does not exist – the last index is 4.', 'This only tries to print one (non-existent) item.'], ['Q5', 'I1']);
  S('2.2.3d', 'loop', 5, 'State', 1, 'State what is output.\nnums = [4, 9, 2, 7]\nbig = nums[0]\nfor i = 1 to 3\n    if nums[i] > big then\n        big = nums[i]\n    endif\nnext i\nprint(big)',
    '9 (the largest value).',
    '=9|nine',
    '1 | 9\n1 | nine\n0 | 7\n0 | 4', ['Q5', 'G2']);

  // ── 2.2.3e Sub programs (skills: func, proc, params, scope) ──
  M('2.2.3e', 'func', 2, 'What is the difference between a function and a procedure?', ['A function returns a value; a procedure does not', 'A procedure returns a value; a function does not', 'Functions cannot have parameters', 'There is no difference'], 'A',
    ['', 'It is the other way round.', 'Both can have parameters.', 'Only functions return a value.'], ['Q6']);
  M('2.2.3e', 'func', 3, 'What is output?\nfunction double(n)\n    return n * 2\nendfunction\nprint(double(4) + 1)', ['8', '9', '10', '5'], 'B',
    ['8 is double(4) – then 1 is added.', '', 'The 1 is added AFTER doubling, not before.', '5 is 4 + 1, without doubling.'], ['Q6']);
  M('2.2.3e', 'proc', 3, 'Which is a procedure (not a function)?', ['procedure greet(name)\n    print("Hi " + name)\nendprocedure', 'function area(w, h)\n    return w * h\nendfunction', 'function max(a, b)\n    return a\nendfunction', 'x = 5'], 'A',
    ['', 'This returns a value – it is a function.', 'This returns a value – it is a function.', 'This is an assignment, not a sub program.'], ['Q6']);
  M('2.2.3e', 'params', 3, 'In function area(w, h), what are w and h?', ['Parameters', 'Constants', 'Return values', 'Arrays'], 'A',
    ['', 'They change each time the function is called.', 'The return value is what the function sends back.', 'They are single values here.'], []);
  M('2.2.3e', 'scope', 4, 'What is a local variable?', ['A variable that can only be used inside the sub program where it is declared', 'A variable that can be used anywhere in the program', 'A variable that never changes', 'A variable stored on the local network'], 'A',
    ['', 'That is a global variable.', 'That is a constant.', 'Local refers to scope, not the network.'], ['Q7']);
  S('2.2.3e', 'scope', 5, 'Explain', 2, 'Explain one advantage of using local variables instead of global variables.',
    'They only exist inside the sub program (1) so they cannot be changed accidentally by other parts of the program / the same name can be reused / memory is freed (1).',
    '=only|inside|within|in the sub|in the function|in the procedure|scope\n=accidentally|by mistake|other parts|reuse|reused|same name|memory|freed|errors|conflict',
    '2 | They only exist inside the function so other parts cannot change them by mistake\n2 | They are only in the sub program so the same name can be reused\n1 | They only exist in the function\n0 | They can be used anywhere', ['Q7', 'E1']);
  S('2.2.3e', 'func', 4, 'Give', 2, 'Give two benefits of using sub programs.',
    'Any two: code can be reused / called many times (1); easier to test / debug (1); easier to read / maintain (1); different people can write different sub programs (1); shorter programs (1).',
    '=reuse|reused|reusable|called|many times|again\n=test|tested|testing|debug|debugging\n=read|readable|maintain|maintenance|understand\n=team|different people|share|shared\n=shorter|less code|fewer lines\nmax 2',
    '2 | Code can be reused and it is easier to test\n2 | It is easier to read and less code is written\n1 | Code can be reused\n0 | The program runs faster', []);

  // ── 2.2.3f Random numbers ──
  M('2.2.3f', '', 2, 'Which ERL statement simulates rolling a six-sided dice?', ['roll = random(1, 6)', 'roll = random(0, 6)', 'roll = 6', 'roll = random(1, 7)'], 'A',
    ['', 'A dice cannot show 0.', 'This always gives 6.', 'A dice cannot show 7.'], []);
  S('2.2.3f', '', 4, 'Write', 1, 'Write an ERL statement that stores a random whole number from 1 to 100 in the variable guess.',
    'guess = random(1, 100)',
    '=random & 1 & 100',
    '1 | guess = random(1, 100)\n1 | guess = random(1,100)\n0 | guess = 100\n0 | random = guess', []);
})(GCSE_BANK_X.M, GCSE_BANK_X.S);
