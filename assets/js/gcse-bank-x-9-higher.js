// Extended bank – Higher-level top-ups (levels 4–5) so every sub-topic has F and H questions,
// plus extra questions for thin skills (original exam-style questions).
(function (M, S) {
  M('1.2.1c', '', 4, 'Which describes what happens when a computer is switched on?', ['The CPU runs the boot instructions stored in ROM, which load the operating system from secondary storage into RAM', 'The operating system is loaded from ROM into cache', 'RAM loads the BIOS from the hard drive', 'The hard drive runs the CPU'], 'A',
    ['', 'The OS is loaded into RAM, not cache, and it is stored on secondary storage, not ROM.', 'The BIOS is in ROM, not on the hard drive.', 'The CPU runs instructions – storage does not run the CPU.'], ['M1']);
  S('1.2.2a', '', 4, 'Explain', 2, 'Explain why a computer cannot rely on RAM alone to store a user\'s files.',
    'RAM is volatile so its contents are lost when the power is turned off (1); files must be kept permanently, which needs non-volatile secondary storage (1).',
    '=volatile|lost|power|turned off|switched off\n=permanent|permanently|long term|non-volatile|non volatile|secondary|keep|kept',
    '2 | RAM is volatile so files would be lost when the power is off, so they need secondary storage\n2 | RAM loses its data when switched off and files must be kept permanently\n1 | RAM is volatile\n0 | RAM is too slow', ['M1', 'E1']);
  M('1.2.2c', '', 4, 'A company stores 50 TB of video archive that is rarely accessed. Why is magnetic storage a sensible choice?', ['It is the fastest storage available', 'It has a high capacity at a low cost per gigabyte, and speed is not important here', 'It has no moving parts', 'It is the most portable'], 'B',
    ['SSDs are faster, but speed does not matter much for a rarely used archive.', '', 'Magnetic storage DOES have moving parts.', 'Portability is not needed for an archive.'], ['S1']);
  M('1.2.3b', '', 4, 'Why can a computer store an image, a sound and a character, even though it only stores binary?', ['Each is converted into a pattern of bits using an agreed method (e.g. pixels, samples, character codes)', 'Images and sounds are stored as denary', 'Only text is really stored', 'The CPU converts them to hex'], 'A',
    ['', 'Everything is stored as binary.', 'Images and sound are stored too.', 'Hex is only a way for humans to read binary.'], []);
  S('1.2.5a', '', 4, 'Explain', 2, 'Explain why a music streaming service compresses its songs.',
    'Smaller files use less bandwidth / data (1) so songs start / stream faster without buffering / users on slower connections can listen (1).',
    '=smaller|less data|less bandwidth|bandwidth|reduce|reduces\n=faster|quicker|buffering|stream|streams|slower connection|load|loads',
    '2 | The files are smaller so they use less bandwidth and stream without buffering\n2 | Less data is sent so songs load faster\n1 | Smaller files\n0 | To improve the sound quality', ['E1']);
  S('1.3.2a', '', 4, 'Explain', 2, 'A gamer plays online games that need a fast, stable connection. Explain why a wired Ethernet connection may be better than Wi-Fi.',
    'Ethernet is faster / higher bandwidth (1) and suffers less interference / is more stable, giving lower lag (1).',
    '=faster|higher bandwidth|bandwidth|speed\n=interference|stable|reliable|lag|latency|drops|dropouts',
    '2 | Ethernet is faster and suffers less interference so there is less lag\n2 | It has higher bandwidth and is more reliable\n1 | It is faster\n0 | It does not need cables', ['E1']);
  S('1.4.1c', '', 4, 'Explain', 2, 'Explain why a longer password is harder to crack with a brute-force attack.',
    'There are many more possible combinations (1) so it takes much longer to try them all (1).',
    '=combinations|possibilities|possible passwords|options\n=longer|more time|takes longer|years|time',
    '2 | There are many more combinations so it takes longer to try them all\n2 | More possibilities means it would take years\n1 | More combinations\n0 | It is easier to remember', ['E1']);
  M('1.4.1e', '', 4, 'Data is sent over public Wi-Fi without encryption. What could an attacker on the same network do?', ['Use packet-sniffing software to capture and read the data', 'Physically damage the router', 'Make the data compress', 'Turn the data into hex'], 'A',
    ['', 'Interception does not need physical access.', 'Compression is not an attack.', 'Hex is just a number format.'], []);
  M('1.4.2b', '', 4, 'Why is anti-malware software alone not enough to protect a network?', ['It can only detect malware it knows about, and does not stop people being tricked or networks being attacked', 'It deletes all files', 'It slows the internet to zero', 'It only works on Macs'], 'A',
    ['', 'Anti-malware does not delete normal files.', 'It may slow a computer slightly, but that is not the issue.', 'It is available for many systems.'], ['N4']);
  M('1.4.2d', '', 4, 'A hospital gives nurses read-only access to patient records and doctors read/write access. Which is the main benefit?', ['It reduces the risk of records being changed incorrectly or by the wrong people', 'It makes the network faster', 'It stops viruses', 'It means records never need backing up'], 'A',
    ['', 'Access levels do not change speed.', 'Access levels do not stop viruses.', 'Backups are still needed.'], []);
  S('1.4.2e', '', 4, 'Explain', 2, 'Explain why users should not use the same password for every account.',
    'If one account is hacked / the password is leaked (1) the attacker could get into all the other accounts too (1).',
    '=hacked|leaked|stolen|found out|discovered|breach|one account\n=all|every|other accounts|all accounts|everything',
    '2 | If one account is hacked the attacker can get into all the other accounts\n2 | If the password is leaked every account is at risk\n1 | One account could be hacked\n0 | It is harder to remember', ['E1']);
  M('1.4.2g', '', 4, 'Why should backup tapes be stored in a different building from the main servers?', ['So that a fire or flood at the main site does not destroy the backups too', 'Because tapes are noisy', 'To make backups faster', 'Because tapes need Wi-Fi'], 'A',
    ['', 'Noise is not the reason.', 'Off-site storage does not speed up backups.', 'Tapes do not need Wi-Fi.'], []);
  M('1.5.1a', '', 4, 'Why might a network technician prefer a command-line interface to a GUI?', ['It can be faster for experts, uses fewer resources and allows tasks to be scripted', 'It is easier for beginners', 'It shows pictures of every file', 'It cannot be used remotely'], 'A',
    ['', 'Beginners usually find a GUI easier.', 'That describes a GUI.', 'Command lines are often used remotely.'], []);
  M('1.5.1c', '', 4, 'A user plugs in a new graphics tablet but it does not work until an update is installed. What has most likely been installed?', ['A device driver for the tablet', 'More RAM', 'A defragmenter', 'A firewall'], 'A',
    ['', 'RAM would not make a new device work.', 'Defragmentation is for hard drives.', 'A firewall controls network traffic.'], []);
  M('1.5.1d', '', 4, 'Why does an operating system keep each user\'s files separate?', ['So users cannot see or change other users\' files without permission', 'To make the disk bigger', 'To speed up the CPU', 'To compress the files'], 'A',
    ['', 'It does not change disk size.', 'It does not affect CPU speed.', 'Compression is a separate utility.'], []);
  M('1.5.1e', '', 4, 'Two users try to edit the same file at the same moment. Which OS feature helps prevent the file being corrupted?', ['File management, e.g. locking the file while it is being edited', 'Defragmentation', 'Compression', 'A firewall'], 'A',
    ['', 'Defragmentation rearranges files on a disk.', 'Compression makes files smaller.', 'A firewall filters network traffic.'], []);
  S('1.5.2a', '', 4, 'Explain', 2, 'Explain why a business should use encryption software on laptops used by staff working from home.',
    'Laptops may be lost or stolen (1); encryption means the data cannot be read without the key / password (1).',
    '=lost|stolen|theft|left|taken\n=cannot be read|cannot read|unreadable|key|password|scrambled|meaningless',
    '2 | If a laptop is stolen the data cannot be read without the key\n2 | Laptops can be lost but the data is scrambled\n1 | The laptop may be stolen\n0 | To make the laptop faster', ['E1']);
  M('1.5.2c', '', 4, 'Why might compressing an already-compressed JPEG image into a ZIP file save very little space?', ['The JPEG has already had redundant data removed, so there is little left to compress', 'ZIP files cannot store images', 'JPEGs are already the largest file type', 'ZIP uses lossy compression'], 'A',
    ['', 'ZIP files can store any file.', 'JPEGs are usually small.', 'ZIP is lossless.'], ['D5']);
  M('1.6.1b', '', 4, 'An employee uses a colleague\'s login without permission to look at salary records. Which law has been broken?', ['Computer Misuse Act 1990', 'Copyright, Designs and Patents Act 1988', 'Only a school rule', 'No law'], 'A',
    ['', 'Copyright is about copying creative work.', 'This is unauthorised access – a criminal offence.', 'Unauthorised access is illegal.'], []);
  S('1.6.1c', '', 4, 'Explain', 2, 'Explain one way the use of smartphones has changed how people communicate, and one possible negative effect.',
    'Change (1): instant messaging / video calls / social media / always contactable. Negative (1): less face-to-face contact / cyberbullying / addiction / pressure to always reply.',
    '=instant|messaging|video|social media|always contactable|anywhere|any time\n=face to face|face-to-face|cyberbullying|bullying|addiction|addicted|pressure|isolation|lonely',
    '2 | People can message instantly but there is less face to face contact\n2 | Social media lets people share anywhere but it can lead to cyberbullying\n1 | Instant messaging\n0 | Phones are expensive', []);
  S('1.6.1d', '', 4, 'Give', 2, 'Give two ways an organisation could reduce the environmental impact of its computers.',
    'Any two: recycle / refurbish old equipment (1); buy energy-efficient devices (1); turn devices off / sleep mode (1); use renewable energy (1); keep devices longer (1).',
    '=recycle|recycling|refurbish|donate|reuse\n=energy efficient|energy-efficient|efficient|low power\n=turn off|switch off|turn them off|switch them off|sleep|power down|standby\n=renewable|solar|wind|green energy\n=keep|longer|repair|upgrade less\nmax 2',
    '2 | Recycle old computers and turn them off at night\n2 | Buy energy efficient devices and use renewable energy\n1 | Recycle old equipment\n0 | Buy more computers', []);
  M('2.1.1b', '', 4, 'A student is planning a quiz app. Which shows decomposition?', ['Splitting it into: ask question, check answer, update score, show result', 'Ignoring the colour of the buttons', 'Writing the whole app in one file', 'Testing with invalid data'], 'A',
    ['', 'Ignoring detail is abstraction.', 'One big file is the opposite of decomposition.', 'That is testing.'], []);
  M('2.1.1c', '', 4, 'Which is the best example of algorithmic thinking?', ['Working out the exact steps, in order, to find the largest number in a list', 'Removing the colours from a map', 'Choosing a font for a program', 'Buying a faster computer'], 'A',
    ['', 'That is abstraction.', 'That is design detail, not an algorithm.', 'That is hardware, not an algorithm.'], []);
  M('2.1.2a', '', 4, 'A program reads a temperature in °C, converts it to °F and displays "Hot" if it is over 80°F. Which is a PROCESS?', ['Converting °C to °F', 'Reading the temperature', 'Displaying "Hot"', 'The keyboard'], 'A',
    ['', 'Reading the temperature is an input.', 'Displaying is an output.', 'The keyboard is hardware.'], []);
  M('2.1.2b', '', 4, 'What is a benefit of drawing a structure diagram before coding?', ['It shows how the problem breaks into modules that can be written and tested separately', 'It shows every variable value as the program runs', 'It finds syntax errors', 'It makes the code run faster'], 'A',
    ['', 'That is a trace table.', 'It is a design tool, not a translator.', 'It does not change speed.'], []);
  M('2.1.2c', '', 4, 'What is output by this ERL code?\nx = 3\nif x MOD 2 == 0 then\n    print(x * 2)\nelse\n    print(x + 2)\nendif', ['6', '5', '1', '3'], 'B',
    ['3 MOD 2 is 1, so the else branch runs.', '', '1 is x MOD 2, which is not printed.', '3 is x, which is changed before printing.'], ['Q4']);
  M('2.1.2d', '', 4, 'In a flowchart, a decision box has two arrows leaving it. What are they usually labelled?', ['Yes and No (True / False)', 'Input and Output', 'Start and Stop', 'Fetch and Execute'], 'A',
    ['', 'Input/output use parallelograms.', 'Start/stop use rounded rectangles.', 'That is the CPU cycle.'], []);
  M('2.2.1a', 'io', 4, 'What is output?\nname = "Ali"\nage = 15\nprint(name + " is " + str(age + 1))', ['Ali is 16', 'Ali is 151', 'name is age + 1', 'An error'], 'A',
    ['', 'age + 1 is calculated as a number (16) before str() makes it text.', 'The values of the variables are used, not their names.', 'str() makes it safe to join with text.'], ['Q9']);
  M('2.2.1b', '', 4, 'What is output?\na = 4\nb = a * 2\na = b - a\nprint(a + b)', ['12', '8', '16', '4'], 'A',
    ['', '8 is b only.', '16 would need a to still be 8.', '4 is a only.'], []);
  M('2.3.1b', '', 4, 'Why is two-factor authentication more secure than a password alone?', ['An attacker would need both the password and the second factor, e.g. the user\'s phone', 'It makes the password longer', 'It encrypts the hard drive', 'It removes malware'], 'A',
    ['', 'The password length does not change.', '2FA does not encrypt the drive.', '2FA does not remove malware.'], []);
  M('2.3.1d', '', 4, 'Why is using a constant like MAX_STUDENTS = 30 easier to maintain than typing 30 throughout the code?', ['If the value changes it only needs updating in one place', 'Constants run faster', 'Constants use less memory than all variables', 'Constants are required by every language'], 'A',
    ['', 'Speed is not the reason.', 'Memory is not the reason.', 'They are good practice, not a requirement.'], []);
  M('2.3.2a', '', 4, 'A program works for all the test data but crashes when a user enters a letter instead of a number. What does this show about the testing?', ['The test plan did not include erroneous data', 'The program has a syntax error', 'Testing is not needed', 'The computer is faulty'], 'A',
    ['', 'It ran, so it is not a syntax error.', 'Testing found nothing because the right data was not tested.', 'It is a software problem.'], ['T2']);
  M('2.4.1a', 'or', 4, 'Which gate gives the output 1 for inputs (0,1), (1,0) and (1,1), but 0 for (0,0)?', ['AND', 'OR', 'NOT', 'NOT (A OR B)'], 'B',
    ['AND would give 0 for (0,1) and (1,0).', '', 'NOT has only one input.', 'That gives 1 only for (0,0).'], ['B1']);
  M('2.5.1b', '', 4, 'Why can\'t the CPU run Python source code directly?', ['The CPU can only execute machine code (binary instructions)', 'Python is too new', 'Python has no variables', 'The CPU only runs assembly language'], 'A',
    ['', 'Age is not the reason.', 'Python does have variables.', 'Assembly must also be translated (by an assembler).'], ['L1']);
  M('2.5.2a', '', 4, 'How does syntax highlighting in an IDE editor help a programmer?', ['Keywords, strings and comments are shown in different colours, making mistakes easier to spot', 'It runs the program faster', 'It fixes logic errors', 'It translates the code'], 'A',
    ['', 'It does not change speed.', 'It cannot find logic errors.', 'That is the translator.'], []);
  M('2.5.2d', '', 4, 'A programmer clicks "Run" in an IDE and their Python program starts. Which IDE features have been used?', ['The translator (to convert the code) and the run-time environment (to run it)', 'Only the editor', 'Only error diagnostics', 'The firewall'], 'A',
    ['', 'The editor is for writing code, not running it.', 'Diagnostics only report errors.', 'A firewall is not part of an IDE.'], ['L1']);

  // Extra questions for thin skills
  M('2.2.1e', 'basic', 2, 'What is 20 / 8 in ERL?', ['2', '2.5', '4', '160'], 'B',
    ['2 is 20 DIV 8 – / gives the full answer with decimals.', '', '4 is 20 MOD 8.', '160 is 20 × 8.'], ['Q4']);
  M('2.2.2a', 'bool', 3, 'Which value could be stored in a Boolean variable called loggedIn?', ['True', '"Yes please"', '3.5', '1024'], 'A',
    ['', 'That is a string.', 'That is a real.', 'That is an integer.'], ['A2']);
  M('2.2.3a', 'length', 3, 'What is output?\nword = "Hello"\nprint(word.length + 1)', ['5', '6', 'Hello1', '"Hello" + 1'], 'B',
    ['5 is the length – 1 is added.', '', '.length is a number, so 1 is added, not joined.', 'The expression is evaluated.'], ['Q8']);
  M('2.2.3a', 'case', 3, 'A user types "YES", "yes" or "Yes". Which condition accepts all three?', ['answer.lower == "yes"', 'answer == "yes"', 'answer.upper == "yes"', 'answer.length == 3'], 'A',
    ['', 'This only accepts "yes" in lower case.', 'answer.upper gives "YES", which never equals "yes".', 'Any 3-letter word would pass.'], ['Q8']);
  M('2.2.3a', 'concat', 3, 'What is output?\nx = "5"\ny = "3"\nprint(x + y)', ['8', '53', '15', 'An error'], 'B',
    ['x and y are strings, so + joins them.', '', 'Strings are joined, not multiplied.', 'Joining two strings is allowed.'], ['Q8', 'Q9']);
  M('2.2.3e', 'proc', 4, 'procedure greet(name)\n    print("Hi " + name)\nendprocedure\nWhat happens with: x = greet("Bo")?', ['It is wrong: a procedure does not return a value to store', 'x stores "Hi Bo"', 'x stores "Bo"', 'x stores 2'], 'A',
    ['', 'Only a FUNCTION returns a value that can be stored.', 'Nothing is returned.', 'Nothing is returned.'], ['Q6']);
  M('2.2.3e', 'params', 4, 'function add(a, b)\n    return a + b\nendfunction\nWhat is printed by print(add(2, add(3, 4)))?', ['9', '7', '5', '234'], 'A',
    ['', '7 is the inner call only.', '5 is 2 + 3.', 'The numbers are added, not joined.'], ['Q6']);
  M('1.2.4d', 'effect', 4, 'The 8-bit number 11000000 has a 1-place LEFT shift. What happens?', ['The left-most 1 is lost, so the result (10000000) is not double the original', 'The result is exactly double', 'The number becomes negative', 'Nothing changes'], 'A',
    ['', 'Doubling 192 would need 9 bits – a bit falls off the end.', 'Unsigned binary at GCSE has no negative numbers.', 'The bits do move.'], ['D2']);
  M('1.2.3c', 'text', 4, 'A text file has 2,000 characters using 16-bit Unicode. How big is it?', ['2,000 bytes', '4,000 bytes', '16,000 bytes', '32,000 bytes'], 'B',
    ['16 bits = 2 bytes per character.', '', '16,000 is ×8 – each character is 2 bytes.', '32,000 is the size in BITS.'], ['B5']);
  S('2.1.2e', 'selection', 4, 'State', 1, 'State what is output when x = 7.\nif x > 5 AND x < 10 then\n    print("A")\nelseif x > 5 then\n    print("B")\nelse\n    print("C")\nendif',
    'A.',
    '=a',
    '1 | A\n1 | It prints A\n0 | B\n0 | C', ['Q1', 'G2']);
})(GCSE_BANK_X.M, GCSE_BANK_X.S);
