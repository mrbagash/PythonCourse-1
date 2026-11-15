// Extended bank – 1.4 Network security and 1.5 Systems software (original exam-style questions).
(function (M, S) {
  // 1.4.1a Malware
  M('1.4.1a', '', 1, 'What is malware?', ['Software designed to cause harm or gain unauthorised access', 'A faulty hardware component', 'A type of firewall', 'Software that speeds up a computer'], 'A',
    ['', 'Malware is software, not hardware.', 'A firewall protects against threats.', 'That would be utility software.'], ['H1']);
  M('1.4.1a', '', 2, 'Which type of malware locks or encrypts a user\'s files and demands payment?', ['Spyware', 'Ransomware', 'Worm', 'Adware'], 'B',
    ['Spyware secretly records what the user does.', '', 'A worm copies itself across a network.', 'Adware shows unwanted adverts.'], ['H1']);
  M('1.4.1a', '', 3, 'How is a worm different from a virus?', ['A worm needs the user to open a file to spread', 'A worm can copy itself and spread through a network on its own', 'A worm only affects phones', 'A worm cannot cause damage'], 'B',
    ['That is how a virus spreads (it attaches to files).', '', 'Worms can affect any networked device.', 'Worms can cause damage, e.g. using up bandwidth.'], ['H1']);
  S('1.4.1a', '', 4, 'Describe', 2, 'Describe what spyware is and what it can do.',
    'Malware that secretly monitors / records what the user does (1), e.g. records key presses (keylogger) to steal passwords / personal data (1).',
    '=secretly|monitors|monitoring|records|recording|tracks|tracking|watches|spies\n=key|keys|keylogger|keystrokes|passwords|password|personal data|bank|details|steal|steals',
    '2 | It secretly records key presses to steal passwords\n2 | Malware that monitors the user and steals their bank details\n1 | It tracks what you do\n0 | It shows adverts', ['H1']);

  // 1.4.1b Social engineering
  M('1.4.1b', '', 1, 'What is phishing?', ['A virus that deletes files', 'Fake emails or messages that trick people into giving personal information', 'Guessing every possible password', 'Flooding a server with traffic'], 'B',
    ['Phishing tricks a person; it is not a virus.', '', 'That is a brute-force attack.', 'That is a denial of service attack.'], ['H1']);
  S('1.4.1b', '', 3, 'Describe', 2, 'Describe what is meant by social engineering.',
    'Tricking / manipulating people (1) into giving away information / access, e.g. passwords (1).',
    '=trick|tricking|tricks|manipulate|manipulating|deceive|deceiving|persuade|pretend|pretending|fool\n=password|passwords|information|details|access|personal|confidential|data',
    '2 | Tricking people into giving away their passwords\n2 | Manipulating someone so they give access to confidential information\n1 | Tricking people\n0 | A virus that spreads by email', ['H1']);
  M('1.4.1b', '', 4, 'Someone phones an employee pretending to be from IT support and asks for their password. What type of attack is this?', ['Brute-force', 'Social engineering (blagging)', 'SQL injection', 'Denial of service'], 'B',
    ['Brute force tries every combination automatically.', '', 'SQL injection targets a database through an input box.', 'DoS floods a server with requests.'], ['H1']);

  // 1.4.1c Brute force
  M('1.4.1c', '', 2, 'What is a brute-force attack?', ['Trying every possible password until the right one is found', 'Physically damaging a server', 'Sending fake emails', 'Listening to network traffic'], 'A',
    ['', 'Brute force is about passwords, not physical damage.', 'That is phishing.', 'That is data interception.'], []);
  S('1.4.1c', '', 3, 'State', 2, 'State two ways to protect an account against a brute-force attack.',
    'Any two: strong / long / complex passwords (1); lock the account after a number of failed attempts (1); two-factor authentication (1); CAPTCHA (1).',
    '=strong|long|longer|complex|special characters|symbols|numbers\n=lock|locked|lockout|limit|attempts|tries\n=two factor|two-factor|2fa|code|biometric\n=captcha\nmax 2',
    '2 | Use a long complex password and lock the account after 3 failed attempts\n2 | Use two factor authentication and a strong password\n1 | Use a strong password\n0 | Install a firewall', []);

  // 1.4.1d DoS
  M('1.4.1d', '', 2, 'What does a denial of service (DoS) attack do?', ['Steals passwords', 'Floods a server with requests so that real users cannot access it', 'Encrypts files', 'Deletes the operating system'], 'B',
    ['DoS stops access; it does not steal passwords.', '', 'That is ransomware.', 'DoS does not delete files.'], []);
  S('1.4.1d', '', 4, 'Explain', 2, 'Explain why a denial of service attack can cost a company money even though no data is stolen.',
    'The website / server becomes unavailable / crashes (1) so customers cannot buy / the company loses sales / reputation (1).',
    '=unavailable|offline|down|crash|crashes|cannot access|slow|overloaded\n=sales|customers|money|income|orders|buy|reputation|trust|business',
    '2 | The website goes offline so customers cannot buy anything\n2 | The server crashes so the company loses sales and reputation\n1 | The website goes down\n0 | Hackers steal their files', ['E1']);

  // 1.4.1e Interception
  M('1.4.1e', '', 2, 'What is data interception?', ['Data being stolen as it travels across a network', 'Data being deleted by a virus', 'Data being backed up', 'Data being compressed'], 'A',
    ['', 'That is a virus attack.', 'Backing up protects data.', 'Compression makes data smaller.'], []);
  S('1.4.1e', '', 3, 'State', 1, 'State one way to protect data from being understood if it is intercepted.',
    'Encryption (e.g. HTTPS, WPA2 / encrypted Wi-Fi, VPN).',
    '=encrypt|encrypted|encryption|https|vpn|wpa|wpa2|wpa3',
    '1 | Encrypt the data\n1 | Use HTTPS\n0 | Use a firewall\n0 | Use anti-virus', []);

  // 1.4.1f SQL injection
  M('1.4.1f', '', 3, 'What is SQL injection?', ['Entering SQL code into an input box to access or change a database', 'Injecting a virus into a USB stick', 'Sending too many requests to a server', 'Guessing a password'], 'A',
    ['', 'SQL injection targets databases through input boxes.', 'That is DoS.', 'That is brute force.'], []);
  S('1.4.1f', '', 4, 'State', 1, 'State one way a programmer can prevent SQL injection.',
    'Input validation / sanitisation (remove special characters) / parameterised queries / limit access rights.',
    '=validation|validate|validating|sanitise|sanitize|sanitisation|parameterised|parameterized|prepared|special characters|check the input|checking input|access rights|access levels',
    '1 | Validate the input\n1 | Use parameterised queries\n0 | Use a firewall\n0 | Use a longer password', []);
  M('1.4.1f', '', 5, 'A login form builds this query: SELECT * FROM users WHERE name = \'(input)\'. An attacker types  \' OR \'1\'=\'1  into the box. Why is this dangerous?', ['It makes the query run slowly', 'The condition becomes always true, so data for every user may be returned', 'It deletes the database', 'It encrypts the table'], 'B',
    ['Speed is not the risk.', '', 'This input does not delete anything (other inputs could).', 'SQL injection does not encrypt data.'], []);

  // 1.4.2a Penetration testing
  M('1.4.2a', '', 2, 'What is penetration testing?', ['Testing how fast a network is', 'Authorised attempts to find and fix weaknesses in a system by attacking it', 'Testing new hardware', 'Checking the spelling in a program'], 'B',
    ['That is a speed test.', '', 'It tests security, not hardware.', 'That is proofreading.'], []);
  S('1.4.2a', '', 4, 'Describe', 2, 'Describe the purpose of penetration testing.',
    'To find weaknesses / vulnerabilities in a system (1) by simulating an attack, so they can be fixed before real attackers use them (1).',
    '=weakness|weaknesses|vulnerability|vulnerabilities|security holes|flaws\n=simulate|simulating|attack|attacking|hack|fix|fixed|before',
    '2 | To find vulnerabilities by simulating an attack so they can be fixed\n2 | Finding weaknesses before hackers do so they can be fixed\n1 | To find weaknesses\n0 | To test the speed of the network', []);

  // 1.4.2b Anti-malware
  M('1.4.2b', '', 1, 'What does anti-malware software do?', ['Detects and removes malware', 'Blocks all network traffic', 'Speeds up the internet', 'Backs up files'], 'A',
    ['', 'That is closer to a firewall, which filters traffic.', 'It does not change internet speed.', 'Backup software makes backups.'], ['N4']);
  S('1.4.2b', '', 3, 'Explain', 2, 'Explain why anti-malware software must be updated regularly.',
    'New malware is created all the time (1) so the software needs the latest definitions / signatures to detect it (1).',
    '=new|latest|recent|constantly|all the time\n=definitions|signatures|detect|recognise|recognize|identify|database',
    '2 | New malware is made all the time so it needs the latest definitions to detect it\n2 | New viruses appear so updates help it recognise them\n1 | New malware is created\n0 | To make the computer faster', ['N4', 'E1']);

  // 1.4.2c Firewalls
  M('1.4.2c', '', 2, 'What does a firewall do?', ['Removes viruses already on the computer', 'Monitors and filters incoming and outgoing network traffic using rules', 'Encrypts the hard drive', 'Backs up data'], 'B',
    ['Removing viruses is the job of anti-malware.', '', 'Encryption software encrypts drives.', 'Backup software backs up data.'], ['N4']);
  S('1.4.2c', '', 4, 'Describe', 2, 'Describe how a firewall protects a network.',
    'Monitors / checks incoming and outgoing traffic (1) and blocks / allows it based on rules (1).',
    '=monitor|monitors|monitoring|checks|checking|inspects|filters|filter|traffic|packets\n=block|blocks|blocking|allow|allows|rules|unauthorised|unauthorized|suspicious',
    '2 | It checks incoming traffic and blocks packets that break the rules\n2 | It filters traffic and allows only authorised data through\n1 | It monitors traffic\n0 | It deletes viruses', ['N4']);

  // 1.4.2d User access levels
  M('1.4.2d', '', 2, 'What is the purpose of user access levels?', ['To make passwords longer', 'To control what each user can see and change', 'To speed up the network', 'To remove malware'], 'B',
    ['Password rules are separate.', '', 'Access levels are about security, not speed.', 'Anti-malware removes malware.'], []);
  S('1.4.2d', '', 3, 'Explain', 2, 'Explain why a school gives students and teachers different access levels.',
    'Students should only access what they need / cannot change or see sensitive data, e.g. marks / other users\' files (1) which reduces the risk of data being changed, deleted or leaked (1).',
    '=only|need|cannot|limited|restricted|sensitive|marks|grades|confidential|other users\n=risk|accidental|accidentally|deleted|changed|cannot be changed|cannot change|leaked|protect|protects|security|secure',
    '2 | Students can only see what they need so sensitive marks cannot be changed\n2 | It restricts students so data is protected from being deleted\n1 | Students cannot see sensitive data\n0 | So teachers can use faster computers', ['E1']);

  // 1.4.2e Passwords
  M('1.4.2e', '', 1, 'Which is the strongest password?', ['password1', 'Sam2009', 'T7#qL!9vR2', 'qwerty'], 'C',
    ['A common word with a number is easy to guess.', 'A name and year is easy to guess.', '', 'A keyboard pattern is one of the first guesses.'], []);
  S('1.4.2e', '', 3, 'Give', 2, 'Give two rules for creating a strong password.',
    'Any two: long / at least 8 characters (1); mix of upper and lower case (1); include numbers (1); include symbols / special characters (1); not a dictionary word / personal information (1).',
    '=long|length|characters|8|12\n=upper|lower|capital|case\n=number|numbers|digits\n=symbol|symbols|special\n=dictionary|word|name|birthday|personal|guess\nmax 2',
    '2 | It should be long and use symbols\n2 | Use capital letters and numbers\n1 | Make it long\n0 | Write it down', []);

  // 1.4.2f Encryption
  M('1.4.2f', '', 2, 'What does encryption do to data?', ['Deletes it', 'Scrambles it so it cannot be understood without the key', 'Makes it smaller', 'Copies it to the cloud'], 'B',
    ['Encryption does not delete data.', '', 'That is compression.', 'That is a cloud backup.'], []);
  M('1.4.2f', '', 4, 'Why should a laptop that holds customer data have its hard drive encrypted?', ['So the laptop runs faster', 'So that if the laptop is stolen the data cannot be read', 'So it cannot get a virus', 'So it uses less battery'], 'B',
    ['Encryption can make it slightly slower, not faster.', '', 'Encryption does not stop malware.', 'Encryption does not save battery.'], []);

  // 1.4.2g Physical security
  M('1.4.2g', '', 1, 'Which is an example of physical security?', ['A firewall', 'A locked server room', 'Encryption', 'A strong password'], 'B',
    ['A firewall is software/network security.', '', 'Encryption is software security.', 'A password is software security.'], []);
  S('1.4.2g', '', 3, 'Give', 2, 'Give two examples of physical security for a server room.',
    'Any two: locks / keys (1); swipe cards / keypads (1); biometric scanners (1); CCTV (1); security guards (1); alarms (1).',
    '=lock|locks|locked|key|keys\n=swipe|card|cards|keypad|pin\n=biometric|fingerprint|face|retina\n=cctv|camera|cameras\n=guard|guards|security staff|alarm|alarms\nmax 2',
    '2 | A locked door and CCTV cameras\n2 | Swipe cards and a security guard\n1 | Locks\n0 | A firewall', []);

  // 1.5.1a User interface
  M('1.5.1a', '', 1, 'Which is a function of an operating system?', ['Providing a user interface', 'Designing websites', 'Editing photos', 'Writing essays'], 'A',
    ['', 'That is application software.', 'That is application software.', 'That is application software.'], []);
  M('1.5.1a', '', 3, 'Why is a graphical user interface (GUI) easier for a beginner than a command-line interface?', ['It uses less memory', 'It uses icons, menus and a pointer, so commands do not have to be remembered', 'It is faster for expert users', 'It needs no operating system'], 'B',
    ['A GUI usually uses MORE memory.', '', 'Experts are often faster with a command line.', 'A GUI is part of the operating system.'], []);

  // 1.5.1b Memory management
  M('1.5.1b', '', 2, 'What does memory management by the operating system include?', ['Deciding which programs and data are stored in RAM, and where', 'Defragmenting the hard drive', 'Encrypting files', 'Installing printer drivers'], 'A',
    ['', 'That is utility software.', 'That is encryption software.', 'That is peripheral management.'], ['M2']);
  S('1.5.1b', '', 4, 'Explain', 2, 'Explain how the operating system allows several programs to run at the same time (multitasking).',
    'It allocates memory to each program / keeps them separate in RAM (1) and gives each program a share of CPU time / switches quickly between them (1).',
    '=memory|ram|allocates|allocate|separate\n=cpu time|processor time|switches|switching|takes turns|share|scheduling|schedules',
    '2 | It allocates each program memory in RAM and switches CPU time between them\n2 | Programs are kept separate in memory and share processor time\n1 | It allocates memory\n0 | It runs everything on the hard drive', []);

  // 1.5.1c Peripherals / drivers
  M('1.5.1c', '', 2, 'What is a device driver?', ['A person who repairs computers', 'Software that allows the operating system to communicate with a piece of hardware', 'A type of malware', 'A storage device'], 'B',
    ['A driver is software.', '', 'Drivers are legitimate software.', 'A driver is not storage.'], []);
  S('1.5.1c', '', 3, 'Explain', 2, 'Explain why a new printer needs a device driver.',
    'The operating system needs to communicate with the printer (1) and the driver translates the OS instructions into commands the printer understands (1).',
    '=communicate|talk|interact|control\n=translate|translates|converts|commands|understand|understands|instructions',
    '2 | The OS needs to communicate with the printer, and the driver translates instructions into commands it understands\n1 | So the OS can communicate with the printer\n0 | To make the printer faster', ['E1']);

  // 1.5.1d User management
  M('1.5.1d', '', 2, 'Which is part of user management in an operating system?', ['Creating user accounts and setting their access rights', 'Compressing files', 'Running the fetch-execute cycle', 'Choosing a screen resolution'], 'A',
    ['', 'That is utility software.', 'That is the CPU.', 'That is a display setting.'], []);
  S('1.5.1d', '', 3, 'State', 2, 'State two tasks the operating system carries out as part of user management.',
    'Any two: creating / deleting user accounts (1); logins / authentication (1); setting access rights / permissions (1); keeping each user\'s files separate (1).',
    '=create|creates|creating|delete|deleting|accounts|account\n=login|logins|log in|log on|authentication|authenticate|password|passwords\n=access|rights|permissions|levels\n=separate|own files|private\nmax 2',
    '2 | Creating user accounts and setting access rights\n2 | Checking passwords when users log in and keeping files separate\n1 | Creating accounts\n0 | Defragmenting the disk', []);

  // 1.5.1e File management
  M('1.5.1e', '', 1, 'Which is a file management task of the operating system?', ['Moving, copying, renaming and deleting files', 'Translating code', 'Sending email', 'Calculating file sizes for images'], 'A',
    ['', 'That is a translator (compiler/interpreter).', 'That is an email client.', 'That is something you do by hand in exams!'], []);
  S('1.5.1e', '', 3, 'State', 2, 'State two file management tasks carried out by an operating system.',
    'Any two: create / name / rename files and folders (1); move / copy (1); delete (1); organise into folders / directories (1); set file permissions (1); save / open files (1).',
    '=create|name|rename|naming\n=move|moving|copy|copying\n=delete|deleting\n=folder|folders|directory|directories|organise|organize\n=permission|permissions|access\n=save|saving|open|opening\nmax 2',
    '2 | Renaming and deleting files\n2 | Moving files into folders\n1 | Deleting files\n0 | Sending emails', []);

  // 1.5.2a Encryption software
  M('1.5.2a', '', 2, 'Which is the purpose of encryption software?', ['To scramble data so unauthorised people cannot read it', 'To remove viruses', 'To make files smaller', 'To reorganise files on a disk'], 'A',
    ['', 'That is anti-malware.', 'That is compression software.', 'That is defragmentation.'], []);

  // 1.5.2b Defragmentation
  M('1.5.2b', '', 2, 'What does defragmentation do?', ['Removes viruses', 'Moves the parts of files on a hard disk so they are stored together', 'Encrypts the disk', 'Deletes unused files'], 'B',
    ['That is anti-malware.', '', 'That is encryption.', 'Defragmentation does not delete files.'], ['O1']);
  S('1.5.2b', '', 4, 'Explain', 2, 'Explain how defragmentation can improve the performance of a magnetic hard drive.',
    'Parts of each file are moved so they are stored together / next to each other (1) so the read/write head moves less and files are read faster (1).',
    '=together|next to each other|contiguous|in order|in one place|reorganised|rearranged\n=faster|quicker|less movement|moves less|read head|head|less time',
    '2 | It puts the parts of each file together so the read head moves less and it is faster\n2 | Files are rearranged in order so they are read quicker\n1 | It puts files together\n0 | It deletes old files', ['O1', 'E1']);
  M('1.5.2b', '', 4, 'Why should a solid state drive NOT be defragmented?', ['SSDs have moving parts that could be damaged', 'SSDs access all locations equally fast, and extra writes reduce their lifespan', 'SSDs cannot store files', 'Defragmenting an SSD deletes everything'], 'B',
    ['SSDs have NO moving parts.', '', 'SSDs do store files.', 'It does not delete files – it just wears the drive with no benefit.'], ['O1']);

  // 1.5.2c Compression software
  M('1.5.2c', '', 2, 'Why might a user run compression software on a folder before emailing it?', ['To encrypt it', 'To make the file smaller so it uploads faster and fits attachment limits', 'To remove viruses', 'To defragment it'], 'B',
    ['That is encryption software.', '', 'That is anti-malware.', 'That is defragmentation.'], []);
  S('1.5.2c', '', 3, 'State', 1, 'State the purpose of data compression software.',
    'To reduce the size of files.',
    '=reduce|reduces|smaller|less space|shrink|size',
    '1 | To make files smaller\n1 | It reduces file size\n0 | It makes files secure\n0 | It removes viruses', []);
})(GCSE_BANK_X.M, GCSE_BANK_X.S);
