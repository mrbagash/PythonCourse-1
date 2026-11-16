// Extended bank – multi-mark written questions, Paper 2 (algorithms, programming, SQL, testing, logic, languages). Original questions.
(function (S) {
  // ── 2.1 Algorithms ──
  S('2.1.1a', '', 3, 'Explain', 2, 'A satnav app shows a map of roads. Explain how abstraction has been used to create the map.',
    'Unnecessary detail has been removed / left out, e.g. buildings, trees, colours of houses (1)\nOnly the details needed are kept, e.g. roads, junctions, names, distances (1)',
    '=removed|remove|left out|leave out|ignored|ignore|hidden|hide|unnecessary|irrelevant\n=roads|junctions|road names|distances|routes|only the|only shows|important',
    '2 | Unnecessary details like buildings have been removed so only the roads and junctions are shown\n1 | Details are removed\n0 | The problem is broken down into smaller parts');
  S('2.1.1b', '', 3, 'Explain', 3, 'A programmer is writing a quiz game. Explain how decomposition would help them.',
    'The problem is broken down into smaller sub-problems, e.g. ask questions, check answers, keep score (1)\nEach smaller part is easier to solve / code / test (1)\nParts can be shared between programmers / reused (1)',
    '=broken down|break down|breaking down|split|smaller|sub-problems|sub problems|parts\n=easier|simpler|test|debug|manageable\n=shared|share|team|different programmers|reused|reuse|at the same time',
    '3 | The game is broken down into smaller parts such as asking questions and keeping score, each part is easier to code and test, and parts can be shared between programmers\n2 | It is split into smaller parts which are easier to solve\n1 | Smaller parts\n0 | Unnecessary detail is removed');
  S('2.1.2a', '', 3, 'Identify', 3, 'A program asks for the lengths of the sides of a rectangle, calculates the area and displays it. Identify the input, the process and the output.',
    'Input: the length and the width (1)\nProcess: multiply length × width (1)\nOutput: display the area (1)',
    '=length|lengths|sides|width\n=multiply|times|x|×|calculate the area|calculates|work out\n=display|output|print|show',
    '3 | Input is the length and width, the process is multiplying them, and the output is displaying the area\n2 | The input is the sides and it multiplies them\n1 | It displays the area\n0 | The computer');
  S('2.1.3a', '', 3, 'Describe', 3, 'Describe how a linear search finds an item in a list.',
    'Start at the first item (1)\nCompare each item in turn with the item being searched for (1)\nStop when it is found, or when the end of the list is reached (not found) (1)',
    '=first|start|beginning\n=each item|every item|in turn|one by one|one at a time|next item\n=found|stop|end of the list|reaches the end|not in the list',
    '3 | Start at the first item and compare each item in turn with the target until it is found or the end of the list is reached\n2 | It checks each item one by one until it is found\n1 | It starts at the beginning\n0 | It looks at the middle item', ['A1']);
  S('2.1.3b', '', 4, 'Describe', 4, 'Describe how a binary search finds an item in a sorted list.',
    'Look at the middle item (1)\nIf it is the item being searched for, stop (1)\nIf the target is smaller, discard the right half; if bigger, discard the left half (1)\nRepeat with the remaining half until found or the list is empty (1)',
    '=middle|midpoint|centre|center\n=stop|found|match|matches|same as\n=discard|half|halves|ignore|remove|left|right|lower|upper\n=repeat|repeats|again|until',
    '4 | Look at the middle item and stop if it matches. If the target is smaller discard the right half, otherwise discard the left half, and repeat until found\n2 | Find the middle item and get rid of half the list\n1 | It looks at the middle\n0 | It checks every item in turn', ['A1']);
  S('2.1.3c', '', 3, 'Describe', 3, 'Describe how a bubble sort puts a list into ascending order.',
    'Compare the first two items / each pair of neighbouring items (1)\nSwap them if they are in the wrong order (1)\nRepeat passes through the list until no swaps are made (1)',
    '=pair|pairs|adjacent|neighbouring|next to|first two|two items\n=swap|swapped|swaps|switch\n=repeat|passes|pass|until no swaps|no more swaps|until sorted',
    '3 | Compare each pair of adjacent items and swap them if they are in the wrong order, repeating passes until no swaps are made\n2 | It compares adjacent items and swaps them\n1 | It swaps items\n0 | It splits the list in half', ['G1']);
  S('2.1.3d', '', 4, 'Describe', 3, 'Describe how a merge sort puts a list into order.',
    'The list is split in half repeatedly until each list has one item (1)\nPairs of lists are merged together, putting the items in order (1)\nThis is repeated until there is one sorted list (1)',
    '=split|divided|divide|halves|half|one item|single items\n=merge|merged|merges|combine|combined|put back together\n=repeat|until|one list|single list|sorted list|whole list',
    '3 | The list is split in half until each list has one item, then pairs are merged in order, repeated until there is one sorted list\n2 | It splits the list then merges it back together\n1 | It splits the list\n0 | It swaps adjacent items', ['G1']);
  S('2.1.3e', '', 4, 'Describe', 3, 'Describe how an insertion sort puts a list into order.',
    'The first item is treated as a sorted list (1)\nEach next item is taken in turn (1)\nand inserted into the correct position in the sorted part (1)',
    '=first item|sorted part|sorted list|sorted section|left\n=next item|each item|in turn|one at a time\n=insert|inserted|inserts|correct position|right place|correct place',
    '3 | The first item is the sorted part, then each next item is taken in turn and inserted into the correct position in the sorted part\n2 | Each item is inserted into the right place\n1 | Items are inserted\n0 | The list is split into halves', ['G1']);
  S('2.1.2d', '', 3, 'Describe', 3, 'Describe what each of these flowchart symbols is used for: a parallelogram, a diamond and a rectangle.',
    'Parallelogram: input or output (1)\nDiamond: a decision (yes / no question) (1)\nRectangle: a process (1)',
    '=input|output|inputs|outputs\n=decision|yes no|question|condition|choice\n=process|calculation|action',
    '3 | A parallelogram is input or output, a diamond is a decision and a rectangle is a process\n2 | Diamond is a decision and rectangle is a process\n1 | Diamond means decision\n0 | They are all the same');

  // ── 2.2 Programming fundamentals ──
  S('2.2.1d', 'choose', 4, 'Explain', 3, 'A program must keep asking a user for their password until they type it correctly. Explain why a while loop is more suitable than a for loop.',
    'A for loop repeats a set / known number of times (count-controlled) (1)\nThe number of attempts needed is not known in advance (1)\nA while loop repeats until a condition is met / is condition-controlled (1)',
    '=set number|fixed number|known number|certain number|count-controlled|count controlled\n=not known|don\'t know|unknown|any number|how many times|how many attempts\n=condition|until|correct|condition-controlled|condition controlled',
    '3 | A for loop repeats a set number of times but we do not know how many attempts are needed, so a while loop repeats until the condition is met\n2 | A for loop runs a fixed number of times but the number of attempts is unknown\n1 | A while loop is condition controlled and repeats until the password is correct\n0 | While loops are faster', ['I3']);
  S('2.2.1d', 'while', 4, 'Explain', 2, 'Explain the difference between a while loop and a do … until loop.',
    'A while loop checks the condition at the start, so it may not run at all (1)\nA do … until loop checks the condition at the end, so it always runs at least once (1)',
    '=start|beginning|before|first & while\n=end|after|at least once',
    '2 | A while loop checks the condition at the start so might not run, but a do until loop checks at the end so always runs at least once\n1 | Do until always runs at least once\n0 | They are the same', ['I4']);
  S('2.2.1e', 'divmod', 3, 'Explain', 2, 'Explain the difference between the DIV and MOD operators, using 23 and 4 as an example.',
    'DIV gives the whole number result of a division: 23 DIV 4 = 5 (1)\nMOD gives the remainder: 23 MOD 4 = 3 (1)',
    '=div & 5|whole number|quotient\n=mod & 3|remainder',
    '2 | 23 DIV 4 is 5 which is the whole number part and 23 MOD 4 is 3 which is the remainder\n1 | MOD gives the remainder\n0 | DIV divides and MOD multiplies', ['Q4']);
  S('2.2.1a', 'vars', 3, 'Explain', 2, 'Explain why a programmer might use a constant for the VAT rate in a shop program.',
    'The value does not change while the program runs (1)\nIt only needs updating in one place if the rate changes / prevents accidental changes (1)',
    '=does not change|doesn\'t change|stays the same|fixed|same value|never changes|can\'t change|cannot change|cannot be changed\n=one place|once|update|accident|accidentally|by mistake',
    '2 | The VAT rate stays the same while the program runs and it only needs updating in one place\n1 | The value is fixed\n0 | Constants are faster');
  S('2.2.2a', 'text', 3, 'Explain', 2, 'A mobile phone number such as 07700 900123 is stored. Explain why it should be stored as a string, not an integer.',
    'It starts with 0, which would be lost if stored as an integer (1)\nNo maths is done with it / it may contain spaces or a + sign (1)',
    '=0|zero|leading\n=never do maths|no maths|not do maths|do not do calculations|not used in calculations|no calculations|not used for calculations|maths|calculations|arithmetic|spaces|space|plus|symbols',
    '2 | It starts with a 0 which would be lost as an integer, and you never do maths with a phone number\n1 | You do not do calculations on it\n0 | Strings use less memory', ['A2']);
  S('2.2.2b', '', 3, 'Explain', 2, 'Explain why the result of input() must be cast before it is added to another number.',
    'input() returns a string / text (1)\nIt must be cast to an integer / real (int() or float()) so it can be added as a number, otherwise it is joined (concatenated) (1)',
    '=string|text\n=int|integer|float|real|number|numeric|concatenat|joined|join',
    '2 | Input is a string so it must be cast to an integer, otherwise the numbers are joined together\n1 | Input is always text\n0 | To make it faster', ['Q9']);
  S('2.2.3a', 'substring', 4, 'Describe', 3, 'username = "Alexander". Describe what each of these returns: username.length, username.substring(0, 4), username.upper',
    'username.length returns 9 (1)\nusername.substring(0, 4) returns "Alex" (1)\nusername.upper returns "ALEXANDER" (1)',
    '=9|nine\n=alex\n=alexander & upper|capital|capitals|uppercase|upper case|alexander',
    '3 | length is 9, substring gives Alex and upper gives ALEXANDER in capitals\n2 | 9 and Alex\n1 | The length is 9\n0 | It returns the name', ['Q8']);
  S('2.2.3d', '1d', 3, 'Describe', 2, 'Describe what an array is and why it is useful.',
    'An array stores several values / items of the same data type under one name (1)\nItems can be accessed using an index, so a loop can process them all (1)',
    '=several|many|multiple|list|collection|more than one\n=index|indexes|position|iterate',
    '2 | An array stores many values under one name, and each item can be accessed by its index using a loop\n1 | It stores a list of items\n0 | It is a type of loop', ['Q5']);
  S('2.2.3d', '2d', 4, 'Describe', 2, 'A 2D array called seats stores the names of people booked in a cinema by row and seat number. Describe how a 2D array is structured and how one name is accessed.',
    'A 2D array is like a table with rows and columns (1)\nOne element is accessed with two indexes, e.g. seats[row, column] / seats[2, 5] (1)',
    '=rows|columns|table|grid\n=two indexes|two indices|two numbers|row and column|seats[|[2|two index',
    '2 | It is a table of rows and columns and one name is accessed with two indexes such as seats[2, 5]\n1 | It is like a grid\n0 | It holds one value', ['Q5']);
  S('2.2.3e', 'func', 3, 'Explain', 3, 'Explain two benefits of using sub programs (functions and procedures).',
    'Code is written once and reused / called many times, so programs are shorter (1)\nThe program is easier to read, test and debug / maintain (1)\nDifferent programmers can work on different sub programs / decomposition (1)',
    '=reused|reuse|called|used again|many times|more than once|shorter|less code|repeat\n=easier|read|test|debug|maintain|fix\n=team|different programmers|share|work on|decomposition|library|libraries',
    '3 | Code can be reused many times so the program is shorter, it is easier to test and debug, and different programmers can work on different sub programs\n2 | It can be reused and is easier to debug\n1 | Less code\n0 | It makes the program run faster', ['Q6']);
  S('2.2.3e', 'scope', 4, 'Explain', 2, 'Explain why it is good practice to use local variables rather than global variables.',
    'A local variable only exists inside its sub program (1)\nso it cannot be changed by mistake elsewhere / uses memory only while needed / same name can be reused (1)',
    '=only exists|only used|only inside|inside the sub|inside the function|inside the procedure|within\n=by mistake|accidentally|accidental|memory|same name|elsewhere|other parts|bugs|errors',
    '2 | A local variable only exists inside its sub program so it cannot be changed by mistake by other parts of the program\n1 | It only exists inside the function\n0 | Global variables are faster', ['Q7']);
  S('2.2.3b', '', 3, 'Describe', 3, 'Describe the steps a program must follow to read every line from a text file.',
    'Open the file (1)\nRead the lines one at a time / in a loop until the end of the file (1)\nClose the file (1)',
    '=open|opens|opened\n=read|readline|readLine|lines|loop|end of file|endoffile\n=close|closes|closed',
    '3 | Open the file, read each line in a loop until the end of the file, then close the file\n2 | Open the file and read the lines\n1 | Close the file\n0 | Delete the file');
  S('2.2.3c', 'select', 3, 'Write', 3, 'A table called Students has the fields Name, Form and Age. Write an SQL query to show the Name and Form of every student older than 14.',
    'SELECT Name, Form (1)\nFROM Students (1)\nWHERE Age > 14 (1)',
    '=select & name & form\n=from students\n=where & age & 14',
    '3 | SELECT Name, Form FROM Students WHERE Age > 14\n2 | SELECT Name, Form FROM Students\n1 | FROM Students\n0 | Show all the students');
  S('2.2.3c', 'select', 4, 'Write', 3, 'A table called Films has the fields Title, Genre and Rating. Write an SQL query to show all the fields for every film whose Genre is "Comedy".',
    'SELECT * (1)\nFROM Films (1)\nWHERE Genre = "Comedy" (1)',
    '=select\n=from films\n=where & genre & comedy',
    '3 | SELECT * FROM Films WHERE Genre = "Comedy"\n2 | SELECT * FROM Films\n1 | WHERE Genre = Comedy\n0 | FIND comedy films');
  S('2.2.3c', 'records', 3, 'Explain', 2, 'Explain why a record is used to store the details of a book (title, author, price, in stock) rather than four separate variables.',
    'A record groups related fields about one item together (1)\nThe fields can be different data types (1)',
    '=related|together|group|groups|one item|one book|single\n=different data types|different types|string and real|mixed types|types',
    '2 | A record groups related fields about one book together and the fields can be different data types\n1 | It keeps the data together\n0 | Records are faster than variables');
  S('2.2.3f', '', 3, 'Write', 2, 'Write a line of OCR Exam Reference Language that stores a random whole number from 1 to 6 in a variable called dice.',
    'dice = (1)\nrandom(1, 6) (1)',
    '=dice random\n=random & 1 & 6',
    '2 | dice = random(1, 6)\n1 | random(1, 6)\n0 | dice = 6');

  // ── 2.3 Producing robust programs ──
  S('2.3.1c', '', 3, 'Describe', 3, 'Describe three different validation checks a program could use on a date of birth entered by a user.',
    'Presence check: something has been entered (1)\nFormat check: e.g. DD/MM/YYYY (1)\nRange check: e.g. the date is not in the future / age is between limits (1)',
    '=presence|entered|not empty|not blank|empty\n=format|dd|mm|yyyy|pattern|slashes|type check|length check|length\n=range|future|between|limit|limits|realistic',
    '3 | A presence check makes sure something was entered, a format check checks it is DD/MM/YYYY and a range check makes sure it is not in the future\n2 | Presence check and range check\n1 | Range check\n0 | Encrypt the date');
  S('2.3.1d', '', 3, 'Describe', 3, 'Describe three ways a programmer can make their code easier to maintain.',
    'Comments to explain what the code does (1)\nSensible / meaningful variable names and indentation (1)\nUse sub programs / constants (1)',
    '=comment|comments|annotate|annotation\n=names|naming|meaningful|sensible|indentation|indent|indented|white space|whitespace\n=sub programs|subprograms|subroutines|functions|procedures|constants',
    '3 | Add comments, use meaningful variable names with indentation, and use sub programs\n2 | Comments and sensible names\n1 | Comments\n0 | Make the code shorter by removing spaces');
  S('2.3.1b', '', 3, 'Explain', 2, 'Explain what authentication is and give one example.',
    'Checking that a user is who they say they are (1)\nExample: username and password / two-factor / biometrics / PIN (1)',
    '=who they say|identity|identify|confirm|verify|genuine|allowed\n=password|username|two factor|two-factor|biometric|fingerprint|pin|face',
    '2 | Authentication checks the user is who they say they are, for example a username and password\n1 | A password\n0 | Checking data is sensible');
  S('2.3.2a', '', 3, 'Explain', 2, 'Explain why programs are tested.',
    'To find and fix errors / bugs (1)\nTo make sure the program meets the requirements / works as intended for all inputs (1)',
    '=errors|bugs|mistakes|faults\n=requirements|meets|works|intended|expected|correctly|users',
    '2 | To find errors and make sure the program meets the user\'s requirements\n1 | To find bugs\n0 | To make it look nice');
  S('2.3.2c', '', 3, 'Describe', 2, 'Describe the difference between a syntax error and a logic error.',
    'A syntax error breaks the rules of the language, so the program will not run (1)\nA logic error lets the program run but it gives the wrong / unexpected result (1)',
    '=rules|grammar|spelling|will not run|won\'t run|cannot run|translate\n=runs|run but|wrong|incorrect|unexpected',
    '2 | A syntax error breaks the rules of the language so it will not run, but a logic error runs and gives the wrong result\n1 | A logic error gives the wrong output\n0 | They are the same', ['T1']);
  S('2.3.2d', 'boundary', 4, 'Explain', 2, 'A program accepts exam marks from 0 to 100. Explain why the programmer should test it with boundary data, giving an example.',
    'Boundary data checks the values at the edge of the valid range are handled correctly (1)\nExample: 0 or 100 (or -1 / 101 just outside) (1)',
    '=edge|edges|limit|limits|ends|extremes|either end|boundary\n=0|100|101|-1|99|1',
    '2 | It checks the values at the edge of the range work, for example 0 and 100\n1 | 100\n0 | To check it works with letters', ['T2']);
  S('2.3.2e', '', 4, 'Describe', 2, 'Describe how a programmer refines an algorithm after testing.',
    'Use the test results to find what is wrong / inefficient (1)\nChange / fix the code and then test it again (1)',
    '=test results|results|failed|fails|inefficient|find the errors|find errors|what is wrong|identify\n=fix|change|improve|correct|test again|retest|re-test',
    '2 | They use the test results to find the errors, then fix the code and test it again\n1 | Fix the errors\n0 | Write a new program');

  // ── 2.4 Boolean logic ──
  S('2.4.1a', 'and', 2, 'Describe', 3, 'Describe what each of the logic gates AND, OR and NOT does.',
    'AND: outputs 1 only when both inputs are 1 (1)\nOR: outputs 1 when at least one input is 1 (1)\nNOT: reverses / flips the input (1)',
    '=both\n=at least one|either|one input|any input|one or both\n=not reverses|not flips|not gives the opposite|not inverts|not changes|not outputs the opposite|not gate|reverses|reverse|flips|flip|opposite|inverts|inverse',
    '3 | AND outputs 1 when both inputs are 1, OR outputs 1 when at least one input is 1, and NOT flips the input\n2 | AND needs both inputs and NOT gives the opposite\n1 | NOT reverses the input\n0 | They are all the same', ['B1']);
  S('2.4.1d', '', 4, 'Describe', 2, 'A heating system turns on (H = 1) when it is cold (C = 1) AND someone is home (P = 1). Describe the logic gate needed and write the Boolean expression.',
    'An AND gate is needed because both conditions must be true (1)\nH = C AND P (1)',
    '=and gate|an and\n=h & c & p',
    '2 | An AND gate because both must be true, H = C AND P\n1 | An AND gate\n0 | An OR gate', ['B1']);

  // ── 2.5 Languages and IDEs ──
  S('2.5.1a', '', 3, 'Describe', 2, 'Describe two advantages of writing a program in a high-level language rather than a low-level language.',
    'Easier to read, write and understand / closer to English (1)\nPortable – can run on different types of computer / easier to debug (1)',
    '=easier|english|understand|read|readable|write\n=portable|different computers|different processors|different types|debug|fewer lines',
    '2 | It is closer to English so easier to write, and it is portable to different computers\n1 | It is easier to read\n0 | It runs faster than machine code');
  S('2.5.1c', '', 4, 'Describe', 3, 'Describe how a compiler translates a program.',
    'It translates the whole program at once (1)\ninto an executable file / machine code (1)\nwhich can then run without the compiler / it reports all the errors at the end (1)',
    '=whole|all at once|entire|in one go\n=executable|machine code|exe|object code\n=without the compiler|without compiler|again|errors at the end|list of errors|run many times|runs on its own',
    '3 | A compiler translates the whole program at once into an executable file of machine code, which can run without the compiler\n2 | It translates the whole program into machine code\n1 | It makes an executable\n0 | It translates line by line', ['L1']);
  S('2.5.2a', '', 3, 'Describe', 3, 'Describe three features of an IDE that help a programmer write and fix code.',
    'Editor features: syntax highlighting / colour coding, auto-indent, auto-complete, line numbers (1)\nError diagnostics: point out errors and show the line they are on (1)\nRun-time environment / translator: run and test the code inside the IDE / debugger with breakpoints (1)',
    '=highlighting|colour|color|auto-complete|autocomplete|auto complete|indent|indentation|line numbers\n=error|errors|diagnostics|debug|debugger|breakpoint|breakpoints\n=run|runtime|run-time|translator|compiler|interpreter|test',
    '3 | Syntax highlighting, error diagnostics that show the line of the error, and a run time environment to test the code\n2 | Colour coding and error messages\n1 | Line numbers\n0 | A spell checker for essays');
})(GCSE_BANK_X.S);
