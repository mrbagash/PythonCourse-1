// Extended bank – 2.3 Robust programs, 2.4 Boolean logic, 2.5 Languages and IDEs (original exam-style questions).
(function (M, S) {
  // 2.3.1a Anticipating misuse
  M('2.3.1a', '', 2, 'What does "anticipating misuse" mean in defensive design?', ['Planning for ways users might accidentally or deliberately break the program', 'Making the program run faster', 'Adding comments', 'Choosing a programming language'], 'A',
    ['', 'Speed is not part of misuse.', 'Comments are about maintainability.', 'Language choice is not misuse.'], []);
  S('2.3.1a', '', 4, 'Give', 2, 'Give two ways a login system could be misused, and how the program could prevent each.',
    'Any two pairs, e.g. brute-force guessing → lock after 3 attempts (1); leaving the box blank → presence check (1); entering SQL → sanitise input (1); entering very long text → length check (1).',
    '=guess|guessing|brute|attempts|lock|locked\n=blank|empty|nothing|presence\n=sql|injection|sanitise|sanitize|special characters\n=long|length|too many characters\nmax 2',
    '2 | Someone could keep guessing passwords so lock the account after 3 attempts, and leave the box blank so use a presence check\n1 | Lock the account after 3 attempts\n0 | Add comments', []);

  // 2.3.1b Authentication
  M('2.3.1b', '', 1, 'What is authentication?', ['Checking that a user is who they claim to be', 'Checking that data is sensible', 'Making a backup', 'Compressing a file'], 'A',
    ['', 'That is validation.', 'That is a backup.', 'That is compression.'], []);
  S('2.3.1b', '', 3, 'Give', 2, 'Give two methods of authentication.',
    'Any two: username and password (1); PIN (1); biometrics e.g. fingerprint / face (1); two-factor / code sent to phone (1); security questions (1); swipe card / key fob (1).',
    '=password|passwords|username\n=pin\n=biometric|biometrics|fingerprint|face|retina|iris|voice\n=two factor|two-factor|2fa|code|text message|authenticator\n=security question|security questions\n=card|swipe|fob|token\nmax 2',
    '2 | A password and a fingerprint scan\n2 | Two factor authentication and a PIN\n1 | A password\n0 | A firewall', []);

  // 2.3.1c Input validation
  M('2.3.1c', '', 2, 'A program only accepts ages from 11 to 18. Which type of validation check is this?', ['Presence check', 'Range check', 'Format check', 'Length check'], 'B',
    ['A presence check only checks something was entered.', '', 'A format check checks a pattern, e.g. a postcode.', 'A length check counts characters.'], ['T2']);
  M('2.3.1c', '', 3, 'Which check makes sure a password has at least 8 characters?', ['Range check', 'Length check', 'Presence check', 'Type check'], 'B',
    ['A range check is for values such as numbers between limits.', '', 'A presence check only checks it is not blank.', 'A type check checks the data type.'], []);
  S('2.3.1c', '', 4, 'Write', 2, 'Write ERL code that keeps asking for a mark until the user enters a whole number from 0 to 100.',
    'A loop (1) with the condition checking 0 and 100 / mark < 0 OR mark > 100 (1).',
    '=while|do|until|repeat\n=0 & 100',
    '2 | mark = int(input("Mark")) while mark < 0 OR mark > 100 mark = int(input("Mark")) endwhile\n2 | do mark = int(input("Mark")) until mark >= 0 AND mark <= 100\n1 | if mark < 0 or mark > 100 then print("Invalid")\n0 | print("Enter a mark")', ['I2']);
  M('2.3.1c', '', 4, 'Validation checks that data is sensible. Why does it NOT guarantee the data is correct?', ['Validation is too slow', 'A value can be sensible but still wrong, e.g. a valid date of birth typed incorrectly', 'Validation only works on numbers', 'Validation deletes data'], 'B',
    ['Speed is not the reason.', '', 'Validation works on text too (length, format, presence).', 'Validation does not delete data.'], []);

  // 2.3.1d Maintainability
  M('2.3.1d', '', 1, 'Which of these makes a program easier to maintain?', ['Using single-letter variable names', 'Adding comments to explain the code', 'Writing all the code on one line', 'Avoiding sub programs'], 'B',
    ['Meaningful names are easier to understand.', '', 'Indentation and spacing make code readable.', 'Sub programs make code easier to maintain.'], []);
  S('2.3.1d', '', 3, 'Give', 2, 'Give two ways a programmer can make their code easier for others to maintain.',
    'Any two: comments (1); meaningful variable / sub program names (1); indentation (1); sub programs / functions (1); constants (1).',
    '=comment|comments|commenting\n=meaningful|descriptive|sensible|clear names|naming|names\n=indent|indentation|indented|whitespace\n=sub program|sub programs|subroutine|functions|procedures\n=constant|constants\nmax 2',
    '2 | Use comments and meaningful variable names\n2 | Indent the code and use sub programs\n1 | Add comments\n0 | Make the code shorter by removing spaces', []);

  // 2.3.2a Purpose of testing
  M('2.3.2a', '', 1, 'What is the main purpose of testing a program?', ['To find errors and check it meets the requirements', 'To make the program run faster', 'To add new features', 'To compress the code'], 'A',
    ['', 'Testing does not make it faster.', 'New features are development, not testing.', 'Testing does not compress code.'], []);
  S('2.3.2a', '', 3, 'Give', 2, 'Give two reasons why programs are tested.',
    'Any two: to find and fix errors / bugs (1); to check it meets the requirements / does what it should (1); to make sure it does not crash with unexpected input (1); to check it is robust / secure (1).',
    '=error|errors|bug|bugs|fix\n=requirements|meets|does what|works as|specification|intended\n=crash|crashes|unexpected|invalid|robust|secure\nmax 2',
    '2 | To find errors and check it meets the requirements\n2 | To fix bugs and make sure invalid input does not crash it\n1 | To find bugs\n0 | To make it faster', []);

  // 2.3.2b Iterative and final testing
  M('2.3.2b', '', 2, 'What is iterative testing?', ['Testing each part of the program while it is being developed', 'Testing only once at the end', 'Testing with users who are paid', 'Testing hardware'], 'A',
    ['', 'That is final/terminal testing.', 'Who does it is not the point.', 'This is about software testing.'], []);
  S('2.3.2b', '', 4, 'Describe', 2, 'Describe the difference between iterative testing and final (terminal) testing.',
    'Iterative: carried out during development, on each part / module as it is written (1). Final: carried out at the end on the whole program (1).',
    '=during|while|as it is|each part|each module|modules|developed|development\n=end|finished|complete|whole program|all together|once',
    '2 | Iterative testing happens during development and final testing is done at the end on the whole program\n1 | Final testing is at the end\n0 | They are the same', []);

  // 2.3.2c Syntax and logic errors
  M('2.3.2c', '', 1, 'What is a syntax error?', ['An error that breaks the rules of the programming language, so the program will not run', 'An error that gives the wrong answer', 'A hardware fault', 'A virus'], 'A',
    ['', 'That is a logic error.', 'That is not a programming error.', 'A virus is malware.'], ['T1']);
  M('2.3.2c', '', 2, 'Which line contains a SYNTAX error?', ['print("Hello")', 'x = 5', 'if x > 3 then', 'pirnt("Done")'], 'D',
    ['This is valid.', 'This is valid.', 'This is valid ERL.', ''], ['T1']);
  M('2.3.2c', '', 3, 'A program to calculate an average adds three numbers and divides by 2. What type of error is this?', ['Syntax error', 'Logic error', 'Overflow error', 'No error'], 'B',
    ['It will run, so it is not a syntax error.', '', 'Overflow is when a number is too big for its bits.', 'The answer will be wrong.'], ['T1']);
  S('2.3.2c', '', 4, 'Explain', 2, 'Explain why logic errors are usually harder to find than syntax errors.',
    'The program still runs / the translator does not report them (1) so you only notice from wrong output / need testing with known results (1).',
    '=still runs|runs|no error message|not reported|translator|compiler|interpreter|does not stop\n=wrong output|wrong result|wrong answer|output is wrong|incorrect|wrong|notice|testing|test|unexpected',
    '2 | The program still runs so you only notice when the output is wrong\n2 | The compiler does not report them so you need to test\n1 | The program still runs\n0 | They stop the program running', ['T1', 'E1']);

  // 2.3.2d Test data (skills)
  M('2.3.2d', 'normal', 2, 'A program accepts ages 11 to 16. Which is NORMAL test data?', ['13', '11', '17', '"eleven"'], 'A',
    ['', '11 is on the edge of the range – that is boundary data.', '17 is outside the range – invalid.', 'Text is the wrong type – erroneous.'], ['T2']);
  M('2.3.2d', 'normal', 3, 'Why is normal test data used?', ['To check the program works with typical, valid data', 'To try to crash the program', 'To test the edges of a range', 'To test the hardware'], 'A',
    ['', 'That is erroneous/invalid data.', 'That is boundary data.', 'Test data tests software.'], ['T2']);
  M('2.3.2d', 'boundary', 3, 'A program accepts quantities from 1 to 50. Which pair of values are BOTH boundary data?', ['1 and 50', '25 and 30', '0 and 100', '"a" and "b"'], 'A',
    ['', 'These are normal data.', 'These are outside the range – invalid.', 'These are erroneous (wrong type).'], ['T2']);
  S('2.3.2d', 'boundary', 4, 'State', 1, 'A program accepts percentages from 0 to 100. State one item of boundary test data.',
    '0 or 100 (also accept -1 or 101 as just outside the boundary).',
    '=0|100|101|-1|minus 1',
    '1 | 100\n1 | 0\n0 | 50\n0 | abc', ['T2']);
  M('2.3.2d', 'invalid', 3, 'A program accepts whole numbers from 1 to 10. Which is ERRONEOUS test data?', ['5', '10', '11', 'seven'], 'D',
    ['5 is normal data.', '10 is boundary data.', '11 is the correct type but out of range – invalid data.', ''], ['T2']);
  S('2.3.2d', 'invalid', 4, 'Explain', 2, 'Explain why a program should be tested with invalid / erroneous data.',
    'To check it rejects the data / gives an error message (1) rather than crashing / accepting it / giving wrong results (1).',
    '=reject|rejects|rejected|error message|not accepted|refuses|handles|validation\n=crash|crashing|crashes|wrong result|wrong results|break|robust|accepting',
    '2 | To make sure it rejects the data instead of crashing\n2 | It should give an error message so the program is robust\n1 | To check it rejects it\n0 | To check typical data works', ['T2', 'E1']);

  // 2.3.2e Refining algorithms
  M('2.3.2e', '', 3, 'After testing, a programmer finds the program accepts negative ages. What is the best refinement?', ['Delete the age question', 'Add a range check so ages must be 0 or more', 'Add comments', 'Change the variable name'], 'B',
    ['The program still needs the age.', '', 'Comments do not change what is accepted.', 'Renaming does not fix the problem.'], []);
  S('2.3.2e', '', 4, 'Describe', 2, 'Describe what is meant by refining an algorithm after testing.',
    'Changing / improving the algorithm (1) to fix the errors found or to make it more efficient / robust (1).',
    '=change|changes|changing|improve|improving|improved|modify|modifying|update\n=fix|errors|bugs|efficient|robust|problems|found',
    '2 | Changing the algorithm to fix the errors found in testing\n2 | Improving it so it is more efficient\n1 | Improving the algorithm\n0 | Testing it again', []);

  // 2.4.1a Gates (skills: and, or, not, symbols)
  M('2.4.1a', 'and', 1, 'An AND gate has inputs A = 1 and B = 0. What is the output?', ['0', '1', '2', '10'], 'A',
    ['', 'AND only outputs 1 when BOTH inputs are 1.', 'Logic gates only output 0 or 1.', 'Logic gates only output 0 or 1.'], ['B1']);
  M('2.4.1a', 'and', 2, 'When does an AND gate output 1?', ['When both inputs are 1', 'When at least one input is 1', 'When both inputs are 0', 'Always'], 'A',
    ['', 'That is an OR gate.', 'Both 0 gives 0.', 'It outputs 0 for three of the four input pairs.'], ['B1']);
  M('2.4.1a', 'or', 1, 'An OR gate has inputs A = 1 and B = 0. What is the output?', ['0', '1', '2', 'It depends'], 'B',
    ['OR outputs 1 when at least one input is 1.', '', 'Logic gates only output 0 or 1.', 'The output is fixed by the inputs.'], ['B1']);
  M('2.4.1a', 'or', 2, 'For which inputs does an OR gate output 0?', ['A = 0, B = 0 only', 'A = 1, B = 1 only', 'A = 1, B = 0', 'Never'], 'A',
    ['', 'Both 1 gives 1 for OR.', 'One input is 1, so the output is 1.', 'Both 0 gives 0.'], ['B1']);
  M('2.4.1a', 'not', 1, 'A NOT gate has input 1. What is the output?', ['1', '0', '2', '-1'], 'B',
    ['NOT reverses the input.', '', 'Logic gates only output 0 or 1.', 'Logic gates only output 0 or 1.'], ['B1']);
  M('2.4.1a', 'not', 3, 'How many inputs does a NOT gate have?', ['1', '2', '3', 'Any number'], 'A',
    ['', 'AND and OR gates have two inputs at GCSE; NOT has one.', 'NOT has one input.', 'NOT has exactly one input.'], ['B1']);
  M('2.4.1a', 'symbols', 2, 'Which shape is the symbol for a NOT gate?', ['A triangle with a small circle on the output', 'A D shape with a flat back', 'A curved shield shape', 'A rectangle'], 'A',
    ['', 'That is an AND gate.', 'That is an OR gate.', 'Rectangles are not used for J277 gate symbols.'], ['B1']);
  M('2.4.1a', 'symbols', 3, 'A gate symbol has a flat back and a rounded (D-shaped) front. Which gate is it?', ['AND', 'OR', 'NOT', 'XOR'], 'A',
    ['', 'OR has a curved back and a pointed front.', 'NOT is a triangle with a circle.', 'XOR is not on the J277 specification.'], ['B1']);

  // 2.4.1b Truth tables (skills: two, three)
  M('2.4.1b', 'two', 2, 'How many rows (not counting the header) does a truth table for a 2-input gate have?', ['2', '4', '8', '3'], 'B',
    ['There are 2 inputs, each 0 or 1: 2 × 2 = 4 combinations.', '', '8 is for 3 inputs.', 'Count all combinations: 00, 01, 10, 11.'], ['B1']);
  M('2.4.1b', 'two', 3, 'Which output column (for rows A,B = 00, 01, 10, 11) is an OR gate?', ['0, 0, 0, 1', '0, 1, 1, 1', '1, 0, 0, 0', '1, 1, 1, 0'], 'B',
    ['That is AND.', '', 'That is NOT (A OR B).', 'That is NOT (A AND B).'], ['B1']);
  S('2.4.1b', 'two', 3, 'State', 1, 'State the output of an AND gate when A = 1 and B = 1.',
    '1.',
    '=1|one|true',
    '1 | 1\n1 | The output is 1\n0 | 0\n0 | 2', ['B1']);
  M('2.4.1b', 'three', 3, 'How many rows (not counting the header) does a truth table with 3 inputs have?', ['3', '6', '8', '9'], 'C',
    ['Each input doubles the rows: 2 × 2 × 2.', '6 is 3 × 2 – it should be 2 × 2 × 2.', '', '9 is 3 × 3.'], ['B1']);
  M('2.4.1b', 'three', 4, 'P = (A AND B) OR C. What is P when A = 1, B = 0, C = 1?', ['0', '1', '2', 'Cannot tell'], 'B',
    ['A AND B = 0, but OR with C = 1 gives 1.', '', 'Logic outputs are only 0 or 1.', 'All the inputs are given.'], ['B1']);
  S('2.4.1b', 'three', 5, 'State', 1, 'State the output of P = NOT (A OR B) AND C when A = 0, B = 0 and C = 1.',
    '1 (A OR B = 0, NOT gives 1, 1 AND 1 = 1).',
    '=1|one|true',
    '1 | 1\n1 | P = 1\n0 | 0\n0 | false', ['B1']);

  // 2.4.1c Combining operators / diagrams
  M('2.4.1c', '', 3, 'A logic diagram has A and B going into an AND gate, and the output of that going into a NOT gate. Which expression matches?', ['NOT (A AND B)', '(NOT A) AND B', 'A OR B', 'NOT A OR NOT B AND C'], 'A',
    ['', 'The NOT is applied to the output of the AND gate, not just to A.', 'There is no OR gate.', 'There is no input C.'], ['B1']);
  M('2.4.1c', '', 4, 'What is NOT (A OR B) when A = 0 and B = 1?', ['0', '1', '2', 'Cannot tell'], 'A',
    ['', 'A OR B = 1, then NOT gives 0.', 'Logic outputs are only 0 or 1.', 'All inputs are given.'], ['B1']);
  S('2.4.1c', '', 4, 'Write', 1, 'Write the logic expression for: an alarm (Q) sounds if a door is open (D) AND the system is armed (S).',
    'Q = D AND S.',
    '=d & and & s',
    '1 | Q = D AND S\n1 | D and S\n0 | Q = D OR S\n0 | NOT D', ['B1']);

  // 2.4.1d Applying logic
  M('2.4.1d', '', 3, 'A fan (F) should turn on if it is hot (H) OR the user presses the button (B), but never if the window is open (W). Which expression is correct?', ['F = (H OR B) AND NOT W', 'F = H AND B AND W', 'F = H OR B OR W', 'F = NOT (H OR B) AND W'], 'A',
    ['', 'AND would need hot AND button pressed, and an open window would turn it on.', 'An open window would turn the fan ON.', 'This turns the fan on only when neither is true and the window is open.'], ['B1']);
  S('2.4.1d', '', 5, 'Write', 2, 'A car alarm (A) sounds if the car is locked (L) and either a door is opened (D) or movement is detected (M). Write a logic expression for A.',
    'A = L AND (D OR M): L AND … (1); (D OR M) (1).',
    '=l & and\n=d & or & m',
    '2 | A = L AND (D OR M)\n2 | L and (D or M)\n1 | D OR M\n0 | A = NOT L', ['B1']);

  // 2.5.1a High / low level
  M('2.5.1a', '', 1, 'Which is an example of a high-level language?', ['Python', 'Machine code', 'Assembly language', 'Binary'], 'A',
    ['', 'Machine code is low level.', 'Assembly language is low level.', 'Binary is machine code – low level.'], []);
  M('2.5.1a', '', 3, 'Why might a programmer write in a low-level language?', ['It is easier to read', 'It gives direct control of the hardware and can run very efficiently', 'It works on every type of CPU', 'It has more built-in functions'], 'B',
    ['High-level languages are easier to read.', '', 'Low-level code is specific to a CPU type.', 'High-level languages have more built-in functions.'], []);
  S('2.5.1a', '', 4, 'Give', 2, 'Give two advantages of writing a program in a high-level language rather than a low-level language.',
    'Any two: easier to read / write / understand (1); easier to debug / maintain (1); portable – runs on different CPUs (1); faster to write / built-in functions (1).',
    '=easier to read|easier to write|easier to understand|english|readable|easier to learn\n=debug|maintain|fix|errors\n=portable|different cpu|different processors|different computers|different machines|any computer\n=faster to write|quicker to write|built-in|libraries|functions\nmax 2',
    '2 | It is easier to read and it can run on different processors\n2 | Easier to debug and quicker to write\n1 | It is easier to understand\n0 | It runs faster than machine code', []);

  // 2.5.1b Translators
  M('2.5.1b', '', 2, 'Why is a translator needed?', ['To convert high-level or assembly code into machine code the CPU can execute', 'To translate between English and French', 'To compress the code', 'To find logic errors automatically'], 'A',
    ['', 'Translators in computing convert code, not human languages.', 'Translators do not compress code.', 'Translators find syntax errors, not logic errors.'], ['L1']);
  M('2.5.1b', '', 3, 'Which translator converts assembly language into machine code?', ['Compiler', 'Interpreter', 'Assembler', 'Linker'], 'C',
    ['A compiler translates high-level languages.', 'An interpreter translates high-level languages line by line.', '', 'A linker is not on the J277 specification.'], ['L1']);

  // 2.5.1c Compilers and interpreters
  M('2.5.1c', '', 2, 'Which translator stops at the first error it finds while running the code line by line?', ['Compiler', 'Interpreter', 'Assembler', 'Editor'], 'B',
    ['A compiler reports errors after trying to translate the whole program.', '', 'An assembler translates assembly language.', 'An editor is where code is written.'], ['L1']);
  M('2.5.1c', '', 3, 'A company sells a game and does not want customers to see its source code. Which translator should it use?', ['Interpreter', 'Compiler', 'Assembler', 'Either – it makes no difference'], 'B',
    ['An interpreter needs the source code to be given to the user.', '', 'Assemblers are for assembly language.', 'A compiler produces an executable, so the source code is not shared.'], ['L1']);
  S('2.5.1c', '', 4, 'Give', 2, 'Give one advantage of a compiler and one advantage of an interpreter.',
    'Compiler (1): produces an executable / runs faster once compiled / source code not shared / no translator needed to run. Interpreter (1): errors found line by line / easier to debug / no need to compile before testing / runs on different platforms.',
    '=executable|exe|faster|quicker|source code|no translator|without the compiler|distribute\n=line by line|each line|debug|debugging|errors|stops at|test|testing|straight away|immediately',
    '2 | A compiler makes an executable that runs faster and an interpreter is easier to debug line by line\n1 | A compiled program runs faster\n0 | They are both the same', ['L1']);

  // 2.5.2 IDE
  M('2.5.2a', '', 1, 'Which IDE feature is used to write and change code?', ['Editor', 'Run-time environment', 'Translator', 'Error diagnostics'], 'A',
    ['', 'The run-time environment runs the program.', 'The translator converts it to machine code.', 'Error diagnostics report problems.'], []);
  S('2.5.2a', '', 3, 'Give', 1, 'Give one feature of an IDE editor that helps a programmer write code.',
    'Any one: syntax highlighting / colour coding (1); auto-indentation (1); auto-complete (1); line numbers (1); bracket matching (1).',
    '=highlight|highlighting|colour|color|coloured|indent|indentation|auto-complete|autocomplete|complete|line numbers|bracket|brackets',
    '1 | Syntax highlighting\n1 | Auto-complete\n0 | A compiler\n0 | It runs the code', []);
  M('2.5.2b', '', 2, 'What do error diagnostics in an IDE do?', ['Show where errors are and what type they are, to help debugging', 'Make the program run faster', 'Remove all logic errors automatically', 'Back up the code'], 'A',
    ['', 'Diagnostics do not change speed.', 'They cannot find every logic error.', 'They do not make backups.'], []);
  S('2.5.2b', '', 4, 'Describe', 2, 'Describe two IDE tools that help a programmer find and fix errors.',
    'Any two: error messages / diagnostics showing the line and type of error (1); breakpoints to pause the program (1); stepping through code line by line (1); watching / inspecting variables (1).',
    '=error message|error messages|diagnostic|diagnostics|line number|highlights errors\n=breakpoint|breakpoints|pause\n=step|stepping|line by line\n=watch|variables|inspect|variable values\nmax 2',
    '2 | Breakpoints to pause the program and watching the values of variables\n2 | Error messages show the line number and you can step through line by line\n1 | Breakpoints\n0 | Syntax highlighting', []);
  M('2.5.2c', '', 2, 'What is the run-time environment in an IDE?', ['A place to run and test the program within the IDE', 'The part where code is typed', 'A type of virus', 'The hardware the code runs on'], 'A',
    ['', 'That is the editor.', 'It is a feature of the IDE.', 'It is software in the IDE.'], []);
  S('2.5.2c', '', 4, 'Explain', 1, 'Explain one benefit of a run-time environment for testing a program.',
    'The program can be run / tested inside the IDE, showing output and errors as it runs, without needing to build a separate executable.',
    '=run|runs|running|test|tested|testing|output|executable|inside|within',
    '1 | The program can be run inside the IDE so you can see the output\n1 | You can test it without making an executable\n0 | It makes the code shorter\n0 | It highlights keywords', []);
  M('2.5.2d', '', 3, 'Why does an IDE include a translator?', ['So the code can be converted to machine code and run without leaving the IDE', 'To check spelling in comments', 'To translate the menus', 'To encrypt the code'], 'A',
    ['', 'It translates code, not comments.', 'It is not about the menu language.', 'It does not encrypt code.'], ['L1']);
})(GCSE_BANK_X.M, GCSE_BANK_X.S);
