// Extended bank – 6 and 8 mark extended-response questions (levels of response). Original questions.
// The app SUGGESTS a level and mark from the indicative content it finds; the teacher always confirms.
//   L(topic, level, marks, command, question, indicative[], opts)   – opts.sides = true for "discuss" questions
(function (L) {
  // ── 1.6 Ethical, legal, cultural, environmental and privacy issues (8 marks) ──
  L('1.6.1a', 4, 8, 'Discuss', 'A supermarket is replacing most of its checkout staff with self-service tills and is planning to use AI cameras to spot shoplifting.\nDiscuss the ethical, legal and privacy issues the supermarket should consider.', [
    'Staff may lose their jobs / unemployment / people need to retrain',
    'Self-service is faster and cheaper for the supermarket, open longer hours',
    'Some customers (elderly, disabled, less confident with technology) find self-service tills hard to use – digital divide',
    'AI cameras collect images of customers – this is personal data (Data Protection Act 2018)',
    'Customers must be told they are being recorded; data must be stored securely and not kept longer than needed',
    'AI may make mistakes / be biased and wrongly accuse innocent customers',
    'Who is responsible when the AI is wrong – accountability',
    'Recordings could be hacked or leaked – privacy risk',
    'Benefit: reduces theft, so prices could stay lower and staff are safer',
    'Conclusion weighing the benefits against the drawbacks'
  ], { sides: true });
  L('1.6.1d', 4, 8, 'Discuss', 'Many people replace their mobile phone every year.\nDiscuss the environmental impact of the manufacture, use and disposal of mobile phones.', [
    'Mining rare / precious metals uses energy and damages habitats',
    'Manufacturing uses a lot of energy and water and causes pollution / carbon emissions',
    'Phones use electricity when charging; data centres and networks use energy',
    'E-waste: old phones are often thrown away or sent to landfill',
    'Toxic materials (lead, mercury, batteries) can leak into soil and water',
    'E-waste is sometimes shipped to developing countries and processed unsafely',
    'Recycling and refurbishing phones recovers materials and reduces waste',
    'Phones can reduce environmental impact: fewer printed documents, less travel (video calls), smart devices save energy',
    'Keeping phones longer / repairable designs reduce the impact',
    'Conclusion weighing the impacts'
  ], { sides: true });
  L('1.6.1e', 4, 8, 'Discuss', 'A school wants pupils to use a fingerprint scanner to pay for lunch and to register in lessons.\nDiscuss the benefits and the privacy and legal issues of this system.', [
    'Faster queues – no cash or cards to lose',
    'Cannot forget or share a fingerprint – more secure than cards or PINs',
    'Accurate attendance records automatically',
    'Fingerprints are biometric personal data – special category under the Data Protection Act 2018',
    'Consent is needed (parents / pupils) and an alternative should be offered',
    'Data must be stored securely and encrypted; only kept as long as needed',
    'If biometric data is stolen it cannot be changed like a password',
    'Pupils may feel monitored / tracked all day – privacy concerns',
    'Cost of buying and maintaining the scanners',
    'Conclusion weighing benefits against issues'
  ], { sides: true });
  L('1.6.1b', 4, 8, 'Discuss', 'A teenager downloads films from an illegal website and shares them with friends. They also guess a friend\'s password and read their messages.\nDiscuss the legal and ethical issues involved.', [
    'Downloading and sharing films breaks the Copyright, Designs and Patents Act 1988',
    'The film makers / artists lose income – it is unfair to the creators',
    'Illegal download sites often contain malware',
    'Guessing a password and reading messages is unauthorised access – Computer Misuse Act 1990',
    'The friend\'s privacy is invaded; trust is broken',
    'Possible penalties: fines or prison; consequences for future',
    'Some people argue films are too expensive or not available legally – but this does not make it legal',
    'Legal alternatives: streaming services, libraries',
    'Conclusion'
  ], { sides: true });
  L('1.6.1c', 4, 8, 'Discuss', 'More and more services, such as banking, shopping and booking doctor\'s appointments, are only available online.\nDiscuss the cultural and ethical impact of this.', [
    'Convenient – available 24/7 from anywhere',
    'Saves travel time and cost; good for people with mobility problems',
    'Digital divide: people without internet access, devices or skills are excluded',
    'Older people or those who cannot afford devices may be left behind',
    'Fewer local branches / shops close – loss of jobs and community',
    'Less face-to-face contact; loneliness for some people',
    'Risk of scams / fraud for less confident users',
    'Personal data collected by companies – privacy',
    'Conclusion weighing benefits and drawbacks'
  ], { sides: true });
  L('1.6.1a', 5, 8, 'Discuss', 'Self-driving cars are being tested on public roads.\nDiscuss the ethical, legal and environmental issues of using self-driving cars.', [
    'Could reduce accidents caused by human error (tiredness, drink-driving)',
    'Gives independence to people who cannot drive (elderly, disabled)',
    'Who is responsible / liable when a self-driving car crashes – the owner, the manufacturer or the programmer',
    'Ethical decisions in an unavoidable crash – how should the car be programmed to choose',
    'Jobs lost for taxi, bus and lorry drivers',
    'Cars collect location data – privacy',
    'Could be hacked – safety and security risk',
    'Smoother driving can reduce fuel use / emissions; often electric',
    'Laws and insurance need to change',
    'Conclusion'
  ], { sides: true });
  L('1.6.1g', 4, 8, 'Discuss', 'A small charity needs new software for its office. It is choosing between open source software and proprietary software.\nDiscuss the advantages and disadvantages of each option for the charity.', [
    'Open source is usually free – saves the charity money',
    'Open source code can be viewed and changed to suit the charity',
    'Open source has community support but may have no official help desk',
    'Open source may be less user-friendly or have fewer features; may need technical skill',
    'Proprietary software costs money for a licence / subscription',
    'Proprietary comes with support, updates and training from the company',
    'Proprietary is usually well tested and widely used, so staff may already know it',
    'Proprietary source code cannot be changed; restricted by the licence',
    'Conclusion recommending an option for the charity with reasons'
  ], { sides: true });
  L('1.6.1f', 4, 8, 'Discuss', 'An online shop stores customers\' names, addresses, card details and buying history.\nDiscuss how the Data Protection Act 2018 and the Computer Misuse Act 1990 affect the shop.', [
    'Data Protection Act: personal data must be used fairly, lawfully and for a stated purpose',
    'Data must be accurate and kept up to date',
    'Data must not be kept longer than necessary',
    'Data must be kept secure, e.g. encrypted, protected by firewalls and access levels',
    'Customers have the right to see / correct the data held about them',
    'The shop can be fined if data is lost or misused',
    'Computer Misuse Act: hacking into the shop\'s system is illegal',
    'Unauthorised access with intent to commit further crime (e.g. stealing card details) and modifying data / spreading malware are offences',
    'The shop must still protect itself – the law alone does not stop attacks',
    'Conclusion'
  ], { sides: true });
  L('1.6.1e', 5, 8, 'Discuss', 'Some people wear smart watches that record their location, heart rate and sleep, and upload this data to the cloud.\nDiscuss the benefits and the privacy and security issues.', [
    'Helps people track fitness and health; can spot health problems early',
    'Location can help in emergencies / find lost people',
    'Data stored in the cloud can be accessed from any device and backed up',
    'Health and location data are personal / sensitive data',
    'The company may share or sell the data to advertisers or insurers',
    'Cloud data could be hacked or intercepted; needs encryption',
    'Location data could reveal where someone lives or when they are away',
    'Users may not read or understand the terms and conditions',
    'Conclusion'
  ], { sides: true });
  L('1.6.1d', 5, 8, 'Discuss', 'A company is deciding whether to move its servers to a cloud provider\'s large data centre or keep them in its own office.\nDiscuss the environmental and other impacts of each choice.', [
    'Large data centres can be more energy efficient (better cooling, shared hardware)',
    'Data centres use huge amounts of electricity and water for cooling',
    'Some cloud providers use renewable energy',
    'Own servers: the company controls the hardware and security',
    'Own servers may be under-used, wasting energy; old hardware becomes e-waste',
    'Cloud: data is stored by a third party – security and privacy depend on them',
    'Cloud needs a reliable internet connection',
    'Cloud costs a subscription but saves buying hardware and staff',
    'Conclusion'
  ], { sides: true });

  // ── Paper 1 scenario questions (6 marks) ──
  L('1.3.1c', 4, 6, 'Discuss', 'A school is choosing between a client-server network and a peer-to-peer network for 300 computers.\nDiscuss which type of network the school should choose.', [
    'Client-server: files stored centrally on a server – pupils can log on from any computer',
    'Client-server: central backups and security / user access levels managed in one place',
    'Client-server: updates and software installed centrally',
    'Client-server: expensive server hardware and a network manager needed',
    'Client-server: if the server fails, users cannot access files – single point of failure',
    'Peer-to-peer: cheaper and easier to set up, no server needed',
    'Peer-to-peer: hard to manage, back up and secure 300 computers individually',
    'Conclusion: client-server is better for a large school, with reasons'
  ], { sides: true });
  L('1.3.1f', 4, 6, 'Compare', 'A small office is setting up a network. Compare a star topology with a mesh topology for the office.', [
    'Star: every device connects to a central switch',
    'Star: if one cable fails only that device is affected',
    'Star: if the central switch fails the whole network fails',
    'Star: easy to add new devices; fast because data goes only to the device it is for',
    'Mesh: devices connect to many others – many routes for data',
    'Mesh: very reliable – if one connection fails data can take another route',
    'Mesh: expensive and needs a lot of cabling (wired mesh)',
    'Recommendation for the office with a reason'
  ]);
  L('1.4.2a', 4, 6, 'Explain', 'A company has suffered a data breach. Explain how the company could protect its network against attack. Refer to at least three methods.', [
    'Firewall to monitor and block unauthorised network traffic',
    'Anti-malware software to detect and remove malware; keep it updated',
    'Strong passwords and limits on login attempts to stop brute-force attacks',
    'User access levels so staff can only reach the data they need',
    'Encryption so intercepted data cannot be understood',
    'Penetration testing to find weaknesses before attackers do',
    'Staff training to spot phishing / social engineering',
    'Physical security for servers (locks, key cards)',
    'Input validation to prevent SQL injection'
  ]);
  L('1.2.2f', 4, 6, 'Explain', 'A photographer travels the world taking thousands of high-resolution photos. Explain what secondary storage they should use while travelling and to keep a backup at home. Justify your choices.', [
    'While travelling: solid state (SSD / SD card / USB) – portable, small and light',
    'Solid state is durable – no moving parts so it is not damaged if dropped',
    'Solid state is fast for copying large photo files',
    'At home: magnetic hard drive – very high capacity for thousands of photos',
    'Magnetic has a low cost per gigabyte – cheap to store a lot',
    'Could also use cloud storage as an off-site backup',
    'Keep more than one copy in case a device fails'
  ]);
  L('1.1.2a', 4, 6, 'Explain', 'A student wants their computer to run games faster. Explain how clock speed, number of cores and cache size each affect the performance of the CPU.', [
    'Higher clock speed – more fetch-execute cycles per second, so instructions are processed faster',
    'More cores – more instructions processed at the same time (in parallel)',
    'Extra cores only help if the game / software is written to use them',
    'More cache – more frequently used data and instructions stored close to the CPU',
    'Fewer slow trips to RAM, so data is accessed faster',
    'Higher clock speed can cause more heat',
    'Comment on which change would help most for games'
  ]);
  L('1.5.1b', 4, 6, 'Describe', 'Describe the role of the operating system in managing memory, peripherals and users.', [
    'Memory management: moves programs and data into and out of RAM',
    'Memory management: allocates memory to each program and keeps programs separate',
    'Allows multitasking / several programs to run at once; uses virtual memory if RAM is full',
    'Peripheral management: communicates with hardware devices using device drivers',
    'Manages input and output devices / buffers and queues (e.g. printing)',
    'User management: user accounts, logins and passwords',
    'Sets access rights / permissions for each user'
  ]);

  // ── Paper 2 (6 marks) ──
  L('2.5.1c', 4, 6, 'Compare', 'A games company is developing a new game. Compare using a compiler with using an interpreter while developing and when releasing the game.', [
    'Interpreter translates and runs the code one line at a time',
    'Interpreter stops at the first error and shows where it is – easier to debug during development',
    'Interpreter needed every time the program runs; runs more slowly',
    'Compiler translates the whole program at once into an executable file',
    'Compiled program runs faster and does not need the compiler to run',
    'Compiler reports all errors at the end, which can be harder to fix',
    'Source code is hidden when releasing a compiled game – protects it from copying',
    'Conclusion: interpreter during development, compiler for release'
  ]);
  L('2.3.1a', 4, 6, 'Explain', 'A website has a login page and a form where users type their address. Explain how defensive design could make the website more robust and secure.', [
    'Anticipate misuse: think about how users might enter wrong data or attack the site',
    'Input validation: range, length, type, presence and format checks on the form',
    'Sanitise inputs to prevent SQL injection',
    'Authentication: username and password, possibly two-factor authentication',
    'Limit login attempts to stop brute-force attacks',
    'Maintainability: comments, sensible names, indentation and sub programs make the code easier to fix',
    'Testing with normal, boundary, invalid and erroneous data'
  ]);
  L('2.3.2b', 4, 6, 'Explain', 'Explain why a programmer should use both iterative testing and final testing, and the role of test data in each.', [
    'Iterative testing: each module is tested as it is developed',
    'Errors are found and fixed early, when they are easier to locate',
    'Final / terminal testing: the whole program is tested at the end',
    'Checks all parts work together and the program meets the requirements',
    'Normal data checks the program works with typical inputs',
    'Boundary data checks the edges of valid ranges',
    'Invalid and erroneous data check the program rejects bad input without crashing'
  ]);
  L('2.1.3b', 4, 6, 'Compare', 'Compare a linear search with a binary search.', [
    'Linear search checks each item in turn from the start',
    'Linear search works on unsorted data',
    'Linear search is simple to code but slow for large lists',
    'Binary search needs the data to be sorted first',
    'Binary search looks at the middle item and discards half of the list each time',
    'Binary search is much faster / fewer comparisons for large lists',
    'Binary search is more complex to code'
  ]);
  L('2.1.3d', 5, 6, 'Compare', 'Compare a bubble sort with a merge sort.', [
    'Bubble sort compares neighbouring items and swaps them if they are in the wrong order',
    'Bubble sort repeats passes until no swaps are made',
    'Bubble sort is simple to code and uses little extra memory',
    'Bubble sort is slow / inefficient for large lists',
    'Merge sort splits the list into single items then merges them back in order',
    'Merge sort is much faster for large lists',
    'Merge sort needs more memory (extra lists) and is more complex to code'
  ]);
  L('2.5.1a', 4, 6, 'Compare', 'Compare high-level languages with low-level languages.', [
    'High-level languages are close to English – easier to read, write and debug',
    'High-level code is portable – runs on different types of computer',
    'One high-level statement can stand for many machine code instructions',
    'High-level code must be translated by a compiler or interpreter',
    'Low-level languages (machine code / assembly) are close to the hardware',
    'Low-level gives direct control of hardware and memory; can be faster and use less memory',
    'Low-level code is specific to one type of processor and is hard to write'
  ]);
  L('2.1.1a', 4, 6, 'Explain', 'A programmer is creating a revision quiz app. Explain how they could use abstraction, decomposition and algorithmic thinking to design it.', [
    'Abstraction: remove unnecessary detail, e.g. only store the question, answers and score',
    'Abstraction: ignore details such as the colour of the screen at the design stage',
    'Decomposition: break the app into smaller parts, e.g. login, choose topic, ask questions, score',
    'Each smaller part is easier to solve, test and can be shared between programmers',
    'Algorithmic thinking: work out the steps needed, in order, e.g. loop through questions, check answer, add to score',
    'Can be shown as a flowchart or pseudocode'
  ]);
})(GCSE_BANK_X.L);
