// Extended bank – multi-mark written questions (3–4 marks), Paper 1. Original exam-style questions.
// Each mark-scheme line matches one marking-rule line, so pupils are told exactly which point they missed.
(function (S) {
  // ── 1.1 Systems architecture ──
  S('1.1.1a', '', 3, 'Describe', 3, 'Describe the stages of the fetch-execute cycle.',
    'Fetch: the next instruction is copied from memory (RAM) into the CPU (1)\nDecode: the control unit works out what the instruction means (1)\nExecute: the instruction is carried out (1)',
    '=fetch|fetched|fetches & memory|ram|main memory\n=decode|decoded|decodes|interpret|understand|works out\n=execute|executed|executes|carried out|carries out|performed|run',
    '3 | The instruction is fetched from memory, then it is decoded by the control unit and then it is executed\n2 | It fetches the instruction from RAM and then executes it\n1 | The instruction is decoded\n0 | The CPU processes data', ['C1']);
  S('1.1.1e', '', 4, 'Describe', 4, 'Describe how the Program Counter (PC), Memory Address Register (MAR) and Memory Data Register (MDR) are used during the fetch stage.',
    'The address in the PC is copied to the MAR (1)\nThe PC is incremented / goes up by one to point to the next instruction (1)\nThe instruction at that address is fetched from memory (1)\nThe instruction is copied into the MDR (1)',
    '=pc & mar|memory address register\n=increment|incremented|increases|goes up|add one|adds one|plus one|next instruction\n=fetched from|from memory|from ram|read from memory|sent from memory|copied from memory|memory location\n=mdr|memory data register',
    '4 | The address in the PC is copied into the MAR and the PC is incremented. The instruction is then fetched from memory at that address and stored in the MDR\n2 | The PC address goes to the MAR and the PC increments\n1 | The MDR holds the instruction\n0 | The ALU does the calculations', ['R1', 'R2']);
  S('1.1.1d', '', 3, 'Explain', 2, 'Explain how cache improves the performance of the CPU.',
    'Cache stores frequently used data / instructions (1)\nso the CPU does not have to wait to fetch them from slower RAM / they are accessed faster (1)',
    '=frequently|often|regularly|commonly|recently\n=faster|quicker|quickly|slower ram|than ram|wait less|less time',
    '2 | Cache stores frequently used instructions so the CPU can access them faster than from RAM\n1 | It holds data that is used often\n1 | It is quicker than RAM\n0 | Cache is a type of secondary storage', ['C3']);
  S('1.1.1f', '', 3, 'Describe', 2, 'Describe how a computer stores a program and its data, and how the CPU works through the instructions.',
    'Data and instructions are stored together in the same memory (1)\nInstructions are fetched and executed one at a time / in sequence, using registers such as the PC, MAR and MDR (1)',
    '=same memory|together|single memory|shared memory|one memory|both stored in memory|stored in the same\n=one at a time|in sequence|sequentially|in turn|registers|pc|mar|mdr|fetch execute|fetch-execute',
    '2 | Data and instructions are stored in the same memory and instructions are fetched one at a time\n1 | Data and instructions are stored together\n0 | It has lots of cores', ['C4']);
  S('1.1.2c', '', 4, 'Explain', 3, 'A computer\'s CPU is upgraded from 2 cores to 4 cores. Explain why this may not double the speed of every program.',
    'Each core can process instructions at the same time / in parallel (1)\nSome programs are not written to use more than one core / cannot be split into parallel tasks (1)\nSome tasks depend on the result of a previous task, so they must be done in order (1)',
    '=same time|parallel|simultaneously|at once|independently\n=not be designed|not be split|not designed|designed|written to|split up|split into|cannot be split|single thread|one core|single core|use more than one|multiple cores\n=depend|depends|dependent|previous|in order|sequence|wait for',
    '3 | More cores can process instructions at the same time, but some programs are not written to use more than one core, and some tasks depend on the result of a previous task\n2 | Cores work in parallel but programs may not be designed to be split up\n1 | Each core can work at the same time\n0 | More cores means more storage', ['P2']);
  S('1.1.2a', '', 3, 'Explain', 2, 'Explain how increasing the clock speed of a CPU affects performance.',
    'More fetch-execute cycles happen each second (1)\nso more instructions are processed per second / programs run faster (1)',
    '=cycles|cycle|hz|hertz|ghz|ticks\n=faster|quicker|more instructions|instructions per second|more processed|better performance|improves performance',
    '2 | More cycles happen each second so more instructions are processed per second\n1 | It carries out more cycles per second\n1 | The computer runs faster\n0 | It stores more data', ['P1']);
  S('1.1.3a', '', 3, 'Describe', 3, 'A washing machine contains an embedded system. Describe three characteristics of embedded systems.',
    'It has one dedicated function / does one specific job (1)\nIt is small / built into a larger device (1)\nIt is cheap / low power / reliable (1)',
    '=dedicated|specific|single|one job|one function|one task|particular\n=small|built in|built into|inside|part of a larger|within\n=cheap|low cost|low power|little power|less power|reliable|rarely fails|robust',
    '3 | It has a dedicated function, it is small and built into the washing machine, and it is cheap and uses little power\n2 | It does one job and is reliable\n1 | It is cheap\n0 | It is a general purpose computer');

  // ── 1.2 Memory and storage ──
  S('1.2.1b', '', 3, 'Compare', 3, 'Compare RAM and ROM.',
    'RAM is volatile; ROM is non-volatile (1)\nRAM can be read and written; ROM is read-only (1)\nRAM holds programs and data in use; ROM holds the boot-up instructions / BIOS (1)',
    '=volatile|power|switched off|turned off\n=read only|read-only|written|write|changed|edited\n=boot|bios|start up|startup|start-up|in use|currently running|running programs',
    '3 | RAM is volatile but ROM is non-volatile. RAM can be written to but ROM is read only. RAM holds programs in use while ROM holds the boot up instructions\n2 | RAM loses data when the power is off and ROM is read only\n1 | ROM stores the BIOS\n0 | They are both secondary storage', ['M1']);
  S('1.2.1e', '', 4, 'Explain', 3, 'Explain how virtual memory works and why it can slow a computer down.',
    'When RAM is full, part of secondary storage is used as extra memory (1)\nData / programs not currently needed are moved (swapped) from RAM to secondary storage (1)\nSecondary storage is much slower to access than RAM, so the computer slows down (1)',
    '=full|run out|not enough ram|ram is used up\n=moved|swapped|transferred|paged|copied|sent\n=slower|slow|takes longer|longer to access',
    '3 | When RAM is full some data is moved to secondary storage as virtual memory, but secondary storage is slower than RAM so the computer slows down\n2 | When RAM is full the hard drive is used, which is slower\n1 | It is used when RAM is full\n0 | It adds more RAM to the computer', ['M2']);
  S('1.2.2c', '', 3, 'Describe', 3, 'Describe how magnetic storage works and give one disadvantage.',
    'Data is stored on spinning platters / disks that are magnetised (1)\nA read/write head moves across the platters to read and write the data (1)\nDisadvantage: moving parts can be damaged if dropped / noisy / slower than solid state (1)',
    '=platter|platters|disk|disks|spinning|spins|tape\n=head|arm\n=damaged|break|broken|dropped|fragile|noisy|noise|slower|heavy|power',
    '3 | Data is stored on spinning magnetic platters and a read/write head moves across them. It can be damaged if dropped because it has moving parts\n2 | It has spinning disks and a read write head\n1 | It can break if you drop it\n0 | It uses a laser to read pits', ['S1']);
  S('1.2.2d', '', 3, 'Explain', 3, 'A delivery driver uses a tablet computer all day. Explain why solid state storage is suitable for the tablet.',
    'No moving parts, so it is durable / not damaged if dropped (1)\nIt is small and light / portable (1)\nIt is fast to access / uses little power so the battery lasts longer (1)',
    '=durable|robust|not damaged|won\'t break|will not break|drop|dropped|shock|moving parts\n=small|light|lightweight|portable|thin\n=fast|quick|quicker|faster|little power|low power|less power|battery',
    '3 | It has no moving parts so it is durable if dropped, it is small and light, and it uses little power so the battery lasts\n2 | It is portable and fast\n1 | It is durable\n0 | It has a very high capacity for a low cost', ['S1']);
  S('1.2.2f', '', 4, 'Justify', 3, 'A hospital needs to back up 50 TB of patient records every night and keep the backups for years. Justify a suitable type of secondary storage.',
    'Magnetic storage (hard disk / tape) (1)\nVery high capacity for the large amount of data (1)\nLow cost per gigabyte / cheap for so much data (1)',
    '=magnetic|tape|hard disk|hard drive|hdd\n=capacity|large amount|lots of data|50 tb|terabytes|store a lot|huge amount\n=cheap|low cost|cost per|inexpensive|cheaper',
    '3 | Magnetic tape, because it has a very high capacity for the large amount of data and a low cost per gigabyte\n2 | Magnetic hard disk because it is cheap\n1 | A hard drive\n0 | A USB stick because it is portable');
  S('1.2.3b', '', 3, 'Explain', 2, 'Explain why computers store data in binary.',
    'Computers are made of switches / transistors / circuits (1)\nwhich have only two states: on and off (1 and 0) (1)',
    '=switch|switches|transistor|transistors|circuit|circuits|logic gates|electrical\n=two states|on and off|on or off|1 and 0|1 or 0|0 and 1|0 or 1|two values',
    '2 | Computers are made of transistors which can only be on or off, which is 1 and 0\n1 | The circuits use switches\n1 | There are only two states\n0 | Binary is quicker to type');
  S('1.2.4e', '', 4, 'Explain', 3, 'Explain why Unicode is used instead of ASCII for a website used around the world.',
    'ASCII uses fewer bits (7/8), so it can only represent 128/256 characters (1)\nUnicode uses more bits per character, so it can represent many more characters (1)\nso it includes the characters / alphabets of other languages and symbols (emoji) (1)',
    '=128|256|7 bits|8 bits|limited|fewer characters|english\n=more bits|16|32|more characters|many more|thousands|millions\n=languages|language|alphabets|symbols|emoji|chinese|arabic|world',
    '3 | ASCII only has 128 characters but Unicode uses more bits so it has many more characters, including other languages\n2 | Unicode has more characters so it can show other languages\n1 | It has emoji\n0 | Unicode makes the website faster', []);
  S('1.2.4f', '', 3, 'Explain', 3, 'Explain how increasing the colour depth and the resolution of an image affects the image and its file size.',
    'Higher colour depth: more bits per pixel, so more colours can be shown (1)\nHigher resolution: more pixels, so the image is more detailed / sharper (1)\nBoth make the file size bigger (1)',
    '=colours|colour range|shades\n=more pixels|detail|detailed|sharper|clearer|quality\n=bigger|larger|increase|increases|more storage|more space',
    '3 | More colour depth means more colours can be shown, more resolution means more pixels so it is more detailed, and both make the file size bigger\n2 | More colours and a bigger file\n1 | The file is larger\n0 | The image gets smaller', ['D3']);
  S('1.2.4g', '', 3, 'Explain', 3, 'Explain how the sample rate and bit depth affect a sound recording.',
    'Higher sample rate: more samples are taken each second (1)\nHigher bit depth: more bits for each sample, so each sample is more accurate (1)\nThe recording is closer to the original sound but the file is bigger (1)',
    '=samples per second|samples each second|more samples|more often\n=accurate|precise|more values|more bits per sample|range of values\n=quality|closer|bigger|larger|file size',
    '3 | A higher sample rate takes more samples per second and a higher bit depth makes each sample more accurate, so the sound is closer to the original but the file is bigger\n2 | More samples are taken so the quality is better\n1 | The file size is bigger\n0 | It makes the sound louder', ['D4']);
  S('1.2.5a', '', 3, 'Explain', 3, 'Explain two reasons why files are compressed before being sent over the internet.',
    'The file is smaller (1)\nso it takes less time to upload / download / transfer (1)\nand uses less bandwidth / data / storage space (1)',
    '=smaller|reduced|less space|reduces the size|size\n=quicker|faster|less time|speed\n=bandwidth|data allowance|storage|less data',
    '3 | Compression makes the file smaller so it downloads faster and uses less bandwidth\n2 | The file is smaller so it uploads quicker\n1 | It saves storage\n0 | It makes the file more secure', []);
  S('1.2.5c', '', 3, 'Explain', 2, 'Explain why lossless compression must be used for a program file or a text document.',
    'Lossless compression does not lose any data / the original can be restored exactly (1)\nIf any data were lost the program would not run / the text would have errors (1)',
    '=exactly|original|restored|no data|nothing is lost|identical|all the data\n=not run|wouldn\'t work|would not work|crash|errors|corrupt|missing|meaning',
    '2 | Lossless restores the original exactly, and if data was lost the program would not run\n1 | No data is lost\n0 | It makes the file much smaller than lossy', ['D5']);

  // ── 1.3 Networks ──
  S('1.3.1b', '', 3, 'Explain', 3, 'Explain three factors that can affect the performance of a network.',
    'Bandwidth: more bandwidth means more data can be sent at once (1)\nNumber of users / devices: more users share the bandwidth so it slows down (1)\nTransmission media / interference / distance: wireless is affected by walls and distance; fibre is faster (1)',
    '=bandwidth\n=users|devices|people|traffic|congestion\n=media|cable|wireless|wifi|wi-fi|interference|distance|walls|fibre|fiber|latency|errors',
    '3 | More bandwidth means more data can be sent, lots of users slow it down, and wireless signals suffer from interference\n2 | Bandwidth and the number of users\n1 | The type of cable\n0 | The size of the monitor', []);
  S('1.3.1c', '', 3, 'Describe', 3, 'Describe a client-server network.',
    'A central server provides services / files to the clients (1)\nClients send requests to the server (1)\nFiles, security and backups are managed centrally (1)',
    '=server provides|server stores|server holds|central server|server manages|server|servers\n=request|requests|ask|asks\n=central|centrally|backup|backups|security|managed|manages',
    '3 | A central server stores files and clients send requests to it, and backups and security are managed centrally\n2 | Clients request files from the server\n1 | There is a server\n0 | All computers are equal', []);
  S('1.3.1e', '', 4, 'Describe', 3, 'Describe how DNS is used when a user types a web address into a browser.',
    'The browser sends the domain name / URL to a DNS server (1)\nThe DNS server looks up the matching IP address (and asks another DNS server if it does not have it) (1)\nThe IP address is returned so the browser can contact the web server (1)',
    '=dns server|domain name server|sends the domain|sends the url|sent to dns|dns\n=ip address|look up|looks up|lookup|finds|matches\n=returned|returns|sent back|sends back|connect|contact|request the page|web server',
    '3 | The domain name is sent to a DNS server, which looks up the IP address and returns it so the browser can contact the web server\n2 | The DNS finds the IP address for the domain name\n1 | It uses DNS\n0 | It encrypts the website', []);
  S('1.3.1f', '', 3, 'Describe', 3, 'Describe a mesh topology and give one advantage.',
    'Each device is connected to several / all other devices (1)\nThere are many routes for data to travel (1)\nAdvantage: if one connection fails the data can take another route / very reliable (1)',
    '=each other|other devices|several devices|many devices|all other|every other\n=routes|paths|ways\n=reliable|fails|failure|another route|still works|keeps working|fault tolerant',
    '3 | Each device connects to several other devices so there are many routes, and if one link fails the data takes another route\n2 | Every device is connected to each other and it is reliable\n1 | It is reliable\n0 | All devices connect to a central switch', []);
  S('1.3.2c', '', 4, 'Compare', 3, 'Compare IP addresses and MAC addresses.',
    'IP addresses are logical and can change; MAC addresses are physical and fixed (1)\nIP addresses are used to route data across networks / the internet; MAC addresses identify a device on a local network (1)\nIPv4 is written in denary (e.g. 192.168.0.1); MAC addresses are written in hexadecimal (1)',
    '=change|changes|fixed|permanent|logical|physical\n=route|routing|internet|across networks|local network|lan|identify\n=hex|hexadecimal|denary|decimal|dots|colons',
    '3 | IP addresses can change but MAC addresses are fixed. IP addresses route data across the internet while MAC addresses identify a device on a local network. MAC is written in hexadecimal\n2 | MAC addresses are fixed and written in hex\n1 | IP addresses can change\n0 | They are the same thing', ['N3']);
  S('1.3.2e', 'tcpip', 4, 'Describe', 3, 'Describe how data is sent across the internet using packets.',
    'Data is split into packets (1)\nEach packet has a header with the destination IP address / sequence number (1)\nPackets may take different routes and are reassembled in order at the destination (1)',
    '=split|broken|divided|packets\n=header|ip address|destination|address|sequence number|packet number\n=different routes|reassembled|reordered|put back together|in order|correct order',
    '3 | Data is split into packets, each with the destination IP address in its header, and they take different routes and are reassembled in order\n2 | Data is broken into packets which are put back together\n1 | It uses packets\n0 | The whole file is sent at once', ['H2']);
  S('1.3.2f', '', 4, 'Explain', 2, 'Explain one benefit of dividing network protocols into layers.',
    'Each layer has its own job / can be developed separately (1)\nso one layer can be changed without affecting the others (1)',
    '=own job|separate|separately|independent|specific|focus|self-contained|own role\n=without affecting|does not affect|doesn\'t affect|without changing|other layers|others',
    '2 | Each layer can be developed separately, so one layer can be changed without affecting the other layers\n1 | Each layer has its own job\n0 | It makes the network cheaper', []);
  S('1.3.2b', '', 3, 'Explain', 2, 'Explain why data sent over a wireless network should be encrypted.',
    'Wireless signals can be intercepted by anyone in range (1)\nEncrypted data cannot be understood without the key (1)',
    '=intercepted|intercept|captured|picked up|stolen|hackers|anyone in range\n=key|unreadable|cannot be understood|can\'t be understood|meaningless|scrambled|cannot be read|can\'t be read',
    '2 | Wireless data can be intercepted, but if it is encrypted it cannot be understood without the key\n1 | Hackers can intercept it\n0 | Encryption makes it faster', ['N4']);

  // ── 1.4 Security ──
  S('1.4.1b', '', 3, 'Describe', 3, 'Describe what is meant by phishing and how a user can avoid being caught out.',
    'A fake email / message pretends to be from a trusted organisation (1)\nIt tries to trick the user into giving personal details / clicking a link (1)\nAvoid: check the sender / spelling, do not click links, contact the organisation directly (1)',
    '=fake|pretend|pretends|pretending|disguised|trusted|bank\n=trick|tricks|personal|details|password|click|link\n=check|sender|spelling|grammar|directly|ignore|report|hover|do not click|don\'t click',
    '3 | A fake email pretends to be from a bank to trick you into giving your password. Check the sender address and do not click links\n2 | A fake message that tricks you into giving details\n1 | It is a fake email\n0 | It is a type of virus', ['H1']);
  S('1.4.1f', '', 4, 'Explain', 3, 'Explain how SQL injection works and how it can be prevented.',
    'An attacker types SQL code into an input box on a website (1)\nThe code runs on the database, so data can be viewed, changed or deleted (1)\nPrevent it with input validation / sanitisation / parameterised queries (1)',
    '=types|entered|enters|input box|input field|form|login box\n=database|tables|data\n=validation|validate|sanitise|sanitize|sanitisation|parameterised|parameterized|check the input|checks the input',
    '3 | The attacker types SQL code into an input box, which runs on the database and can delete data. Input validation and sanitisation stop it\n2 | SQL is entered into a form to access the database\n1 | Validate inputs\n0 | It floods the server with requests', []);
  S('1.4.1d', '', 3, 'Describe', 2, 'Describe what happens in a denial of service attack.',
    'A server is flooded with huge numbers of requests (1)\nso it cannot respond / genuine users cannot access the service (1)',
    '=flood|flooded|floods|lots of requests|many requests|huge number|overload|overloaded|overwhelm\n=cannot respond|can\'t respond|crash|crashes|slows|genuine users|real users|unavailable|cannot access|can\'t access',
    '2 | The server is flooded with requests so real users cannot access the website\n1 | Lots of requests are sent\n0 | A virus is installed on the server', []);
  S('1.4.2d', '', 3, 'Explain', 2, 'Explain why a school gives teachers and pupils different user access levels.',
    'Each user can only access the files / data they need (1)\nso pupils cannot see or change sensitive data such as other pupils\' records / marks (1)',
    '=only access|only the files|only see|only what they need|need|permissions\n=sensitive|confidential|personal|records|marks|reports|change|delete|edit',
    '2 | Users can only access the data they need, so pupils are stopped from changing sensitive data like marks\n1 | Each user only sees the files they need\n0 | It makes the network faster', []);
  S('1.4.2e', '', 3, 'Describe', 3, 'Describe three rules for a strong password policy.',
    'At least a minimum length, e.g. 8 or more characters (1)\nMix of upper case, lower case, numbers and symbols (1)\nChanged regularly / not reused / not a dictionary word or personal information (1)',
    '=length|long|characters|minimum|at least\n=upper|lower|numbers|symbols|special|mix\n=change|changed|regularly|reuse|reused|dictionary|personal|name|birthday',
    '3 | Passwords must be at least 8 characters, use a mix of upper case letters, numbers and symbols, and be changed regularly\n2 | Long and with symbols\n1 | Use numbers\n0 | Write it down', []);
  S('1.4.2b', '', 3, 'Describe', 2, 'Describe how anti-malware software protects a computer.',
    'It scans files and compares them with a database of known malware (signatures) (1)\nIt quarantines / removes / deletes malware it finds (1)',
    '=scan|scans|scanning|checks|signatures|database|known\n=quarantine|quarantines|remove|removes|delete|deletes|isolate',
    '2 | It scans files against known malware signatures and quarantines anything it finds\n1 | It scans the computer\n0 | It blocks network traffic', ['N4']);

  // ── 1.5 Systems software ──
  S('1.5.1e', '', 3, 'Describe', 3, 'Describe three things the operating system does as part of file management.',
    'Lets users create, name and rename files and folders (1)\nMoves, copies and deletes files (1)\nOrganises files into folders / directories and controls access permissions (1)',
    '=create|creates|name|rename|save\n=move|moves|copy|copies|delete|deletes\n=folder|folders|directories|directory|organise|organises|permissions|access',
    '3 | It lets users create and rename files, copy and delete them, and organise them into folders\n2 | It lets you save and delete files\n1 | It organises folders\n0 | It defragments the hard drive', []);
  S('1.5.1d', '', 3, 'Describe', 2, 'Describe the role of user management in an operating system.',
    'Creates user accounts with usernames and passwords (1)\nControls the access rights / permissions of each user (1)',
    '=account|accounts|username|login|log in|password\n=access|rights|permissions|levels|allowed',
    '2 | It creates user accounts with passwords and controls what each user is allowed to access\n1 | It creates accounts\n0 | It manages the printer', []);
  S('1.5.2b', '', 4, 'Explain', 3, 'Explain why defragmenting a magnetic hard drive makes files load faster.',
    'Over time, parts of files are stored in different places on the disk (fragmented) (1)\nDefragmentation moves the parts of each file so they are stored together (1)\nso the read/write head moves less and files are read faster (1)',
    '=different places|spread out|scattered|fragmented|fragments|split\n=together|next to each other|contiguous|in order\n=head moves less|less movement|faster|quicker',
    '3 | Over time file parts get spread out, so defragmenting moves them together, which means the read write head moves less and files load faster\n2 | It puts the fragments next to each other\n1 | Files load quicker\n0 | It deletes unused files', ['O1']);

  // ── 1.6 Ethical, legal, cultural and environmental ──
  S('1.6.1f', '', 3, 'Describe', 3, 'Describe three things the Computer Misuse Act 1990 makes illegal.',
    'Unauthorised access to computer material (hacking) (1)\nUnauthorised access with intent to commit further crimes (1)\nUnauthorised modification of computer material, e.g. spreading malware / deleting files (1)',
    '=unauthorised access|unauthorized access|hacking|access without permission|accessing without permission\n=further crime|further offence|intent|commit a crime|commit another\n=modification|modify|change|changing|delete|deleting|malware|virus|viruses|spreading',
    '3 | Unauthorised access to computer material, unauthorised access with intent to commit further crime, and unauthorised modification such as spreading a virus\n2 | Hacking and spreading viruses\n1 | Hacking\n0 | Copying music', []);
  S('1.6.1g', '', 3, 'Compare', 3, 'Compare open source and proprietary software.',
    'Open source: the source code can be viewed and changed; proprietary: the code is hidden / cannot be changed (1)\nOpen source is usually free; proprietary software has a cost / licence fee (1)\nProprietary usually comes with official support and updates; open source relies on the community (1)',
    '=source code|code|modify|modified|changed|edit\n=free|cost|costs|pay|paid|licence|license|price\n=support|updates|help|community|tested',
    '3 | Open source code can be changed but proprietary code is hidden. Open source is usually free while proprietary costs money, and proprietary software comes with support\n2 | Open source is free and you can change the code\n1 | Proprietary has support\n0 | They are the same', []);
  S('1.6.1d', '', 3, 'Describe', 3, 'Describe three ways the use of computers can harm the environment.',
    'Mining rare metals / manufacturing uses resources and energy (1)\nComputers and data centres use a lot of electricity (1)\nE-waste: toxic materials go to landfill (1)',
    '=mining|metals|raw materials|resources|manufacture|manufacturing|making\n=electricity|energy|power|data centres|data centers|carbon\n=waste|e-waste|landfill|toxic|thrown away|disposed',
    '3 | Mining metals to make computers damages habitats, data centres use lots of electricity, and old computers end up as toxic e-waste in landfill\n2 | They use electricity and create e-waste\n1 | They go to landfill\n0 | Computers are good for the environment', []);
})(GCSE_BANK_X.S);
