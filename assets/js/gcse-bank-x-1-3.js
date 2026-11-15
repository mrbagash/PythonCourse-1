// Extended bank – 1.3 Computer networks, connections and protocols (original exam-style questions).
(function (M, S) {
  // 1.3.1a LAN / WAN
  M('1.3.1a', '', 1, 'What does LAN stand for?', ['Large Area Network', 'Local Area Network', 'Linked Access Network', 'Long Area Network'], 'B',
    ['"Large" is not part of the name – a LAN covers a SMALL area.', '', 'Not a real term.', 'Not a real term.'], ['N1']);
  M('1.3.1a', '', 2, 'Which is an example of a WAN?', ['The computers in one classroom', 'The Internet', 'A printer connected by USB', 'Two phones paired by Bluetooth'], 'B',
    ['One classroom is a small area – a LAN.', '', 'USB is a direct connection, not a network.', 'Bluetooth pairing is a personal connection, not a WAN.'], ['N1']);
  S('1.3.1a', '', 3, 'Describe', 2, 'Describe two differences between a LAN and a WAN.',
    'LAN covers a small geographical area, WAN a large one (1). LAN hardware is owned by the organisation; a WAN uses infrastructure owned by others / telecoms companies (1).',
    '=small|large|area|geographical|building|site|country|countries|world\n=owned|own|telecom|telecoms|third party|leased|infrastructure|other companies|isp\nmax 2',
    '2 | A LAN covers a small area but a WAN covers a large area. A WAN uses infrastructure owned by other companies\n1 | A LAN is in a small area\n0 | A WAN is faster than a LAN', ['N1']);
  M('1.3.1a', '', 4, 'A company has offices in London and Manchester connected together. Why is this a WAN?', ['Because it uses Wi-Fi', 'Because it covers a large geographical area and uses connections owned by a telecoms company', 'Because it has more than 10 computers', 'Because it uses a star topology'], 'B',
    ['Wi-Fi can be used in a LAN.', '', 'The number of computers does not make it a WAN.', 'Topology does not decide LAN or WAN.'], ['N1']);

  // 1.3.1b Performance
  M('1.3.1b', '', 2, 'Which of these would most likely slow down a network?', ['More users streaming video at the same time', 'Using fibre optic cable', 'Upgrading the switch', 'Fewer devices connected'], 'A',
    ['', 'Fibre optic cable has high bandwidth – it speeds a network up.', 'A better switch improves performance.', 'Fewer devices means less traffic.'], []);
  S('1.3.1b', '', 3, 'State', 2, 'State two factors that can affect the performance of a network.',
    'Any two: bandwidth (1); number of users / devices (1); transmission media (e.g. cable vs wireless) (1); interference / distance (1); errors / collisions (1).',
    '=bandwidth|speed of the connection\n=number of users|users|devices|traffic\n=media|cable|wired|wireless|fibre|copper|transmission\n=interference|distance|walls|obstacles|errors|collisions\nmax 2',
    '2 | Bandwidth and the number of users\n2 | The type of cable and interference\n1 | Bandwidth\n0 | The size of the monitor', []);
  M('1.3.1b', '', 4, 'What is bandwidth?', ['The physical length of a network cable', 'The amount of data that can be transferred in a given time', 'The number of computers on a network', 'The range of a Wi-Fi signal'], 'B',
    ['Cable length is not bandwidth.', '', 'That is the number of devices.', 'Range is not bandwidth.'], []);

  // 1.3.1c Client-server / P2P
  M('1.3.1c', '', 1, 'In a client-server network, what does the server do?', ['It requests services from clients', 'It provides services and resources (e.g. files, logins) to clients', 'It is used by only one person', 'It has no storage'], 'B',
    ['Clients request; servers provide.', '', 'Servers are shared by many users.', 'Servers usually have lots of storage.'], []);
  M('1.3.1c', '', 2, 'Which describes a peer-to-peer network?', ['All computers have equal status and share resources directly', 'One central server controls all the computers', 'It must cover a large area', 'It cannot share files'], 'A',
    ['', 'That is client-server.', 'Peer-to-peer networks are often small.', 'Peers share files directly.'], []);
  S('1.3.1c', '', 4, 'Give', 2, 'Give two advantages of a client-server network for a school.',
    'Any two: central backups (1); central security / user accounts / access levels (1); software installed / updated centrally (1); files accessible from any computer (1).',
    '=backup|backups|backed up\n=security|secure|accounts|logins|access levels|permissions\n=updates|updated|install|installed|software\n=any computer|anywhere|any device|shared files|share files\nmax 2',
    '2 | Files are backed up centrally and security can be managed\n2 | Software can be updated centrally and users can log in on any computer\n1 | Central backups\n0 | It is cheaper and needs no server', []);
  M('1.3.1c', '', 4, 'What is a disadvantage of a client-server network?', ['Files cannot be shared', 'If the server fails, clients may lose access to files and services', 'There is no security', 'Backups cannot be made'], 'B',
    ['Client-server networks share files.', '', 'Client-server networks usually have better security.', 'Backups are easy to manage centrally.'], []);

  // 1.3.1d Hardware
  M('1.3.1d', '', 1, 'Which device allows a computer to connect to a network?', ['NIC (network interface card)', 'Monitor', 'Keyboard', 'Sound card'], 'A',
    ['', 'A monitor is an output device.', 'A keyboard is an input device.', 'A sound card handles audio.'], ['N2']);
  M('1.3.1d', '', 2, 'Which device sends data between DIFFERENT networks, e.g. a home network and the Internet?', ['Switch', 'Router', 'NIC', 'Hub'], 'B',
    ['A switch sends data between devices on the SAME LAN.', '', 'A NIC connects one device to a network.', 'A hub connects devices on one LAN.'], ['N2']);
  S('1.3.1d', '', 3, 'Describe', 1, 'Describe the purpose of a switch in a LAN.',
    'Connects devices on a LAN and sends data to the correct device (using MAC addresses).',
    '=correct device|right device|intended device|correct computer|mac address|destination|specific device',
    '1 | It sends data to the correct device on the network\n1 | It uses the MAC address to send data to the right computer\n0 | It connects the LAN to the internet\n0 | It sends data to every device', ['N2']);
  M('1.3.1d', '', 4, 'What is the purpose of a Wireless Access Point (WAP)?', ['To connect devices to a wired network using Wi-Fi', 'To protect the network from viruses', 'To store websites', 'To translate domain names into IP addresses'], 'A',
    ['', 'Anti-malware / firewalls protect the network.', 'Web servers store websites.', 'DNS translates domain names.'], ['N2']);
  M('1.3.1d', '', 3, 'Which transmission media gives the highest bandwidth over long distances?', ['Copper cable', 'Fibre optic cable', 'Bluetooth', 'Infrared'], 'B',
    ['Copper suffers more from interference and loss over long distances.', '', 'Bluetooth only works over short distances.', 'Infrared needs line of sight and is short range.'], []);

  // 1.3.1e Internet, DNS, cloud
  M('1.3.1e', '', 2, 'What does a DNS server do?', ['Stores all websites', 'Translates a domain name (e.g. www.example.com) into an IP address', 'Blocks viruses', 'Assigns MAC addresses'], 'B',
    ['Web servers store websites.', '', 'Anti-malware/firewalls protect against threats.', 'MAC addresses are set by the manufacturer.'], []);
  S('1.3.1e', '', 3, 'State', 1, 'State what is meant by "the cloud".',
    'Remote servers (storage / software / services) accessed over the Internet.',
    '=remote|internet|online|someone else|third party|data centre|data center|other servers',
    '1 | Storage on remote servers that you access over the internet\n1 | Services provided online by a third party\n0 | A type of local hard drive\n0 | Wi-Fi', []);
  S('1.3.1e', '', 4, 'Give', 2, 'Give one advantage and one disadvantage of storing files in the cloud.',
    'Advantage (1): access from anywhere / any device; automatic backup; scalable; no need to buy hardware. Disadvantage (1): needs an internet connection; security / privacy concerns; ongoing cost; provider controls the data.',
    '=anywhere|any device|any computer|backup|backed up|scalable|no hardware|sharing|share|collaborate\n=internet connection|connection|security|hacked|privacy|cost|subscription|provider|offline|outage',
    '2 | You can access files from anywhere but you need an internet connection\n2 | Files are backed up automatically but there are privacy concerns\n1 | Access from anywhere\n0 | It is faster than a hard drive', []);
  M('1.3.1e', '', 4, 'What is web hosting?', ['Designing a website', 'Storing a website on a server so that it can be accessed over the Internet', 'Buying a domain name', 'Browsing websites'], 'B',
    ['Designing is creating the pages, not hosting them.', '', 'Buying a domain name is registration, not hosting.', 'Browsing is done by clients.'], []);

  // 1.3.1f Topologies
  M('1.3.1f', '', 1, 'In a star topology, each device is connected to…', ['every other device', 'a central switch', 'a single shared cable', 'only one other device'], 'B',
    ['That is a (full) mesh topology.', '', 'A single shared cable is a bus topology (not on J277).', 'That would be a chain, not a star.'], []);
  M('1.3.1f', '', 3, 'What is an advantage of a mesh topology?', ['It uses the least cable', 'There are multiple routes for data, so one broken link does not stop the network', 'It needs no switches or routers', 'It is the cheapest to set up'], 'B',
    ['Mesh uses MORE cable than star.', '', 'Mesh networks still use networking hardware.', 'Mesh is usually more expensive.'], []);
  S('1.3.1f', '', 4, 'Explain', 2, 'Explain one advantage and one disadvantage of a star topology.',
    'Advantage (1): if one cable/device fails the others still work / easy to add devices / fast as data goes only to its destination. Disadvantage (1): if the central switch fails the whole network fails / needs lots of cable.',
    '=one cable|one device|others still work|rest still work|easy to add|add devices|fast|reliable\n=central|switch fails|switch breaks|whole network|lots of cable|more cable|expensive',
    '2 | If one cable fails the others still work, but if the central switch fails the whole network goes down\n1 | If the switch fails the whole network fails\n0 | Every device is connected to every other device', []);

  // 1.3.2a Ethernet, Wi-Fi, Bluetooth
  M('1.3.2a', '', 1, 'Which is a WIRED connection?', ['Wi-Fi', 'Bluetooth', 'Ethernet', '4G'], 'C',
    ['Wi-Fi is wireless.', 'Bluetooth is wireless.', '', '4G is a wireless mobile network.'], []);
  S('1.3.2a', '', 3, 'Give', 2, 'Give one advantage of a wired (Ethernet) connection and one advantage of a wireless (Wi-Fi) connection.',
    'Wired (1): faster / more reliable / less interference / more secure. Wireless (1): no cables / devices can move around / easier to add devices / cheaper to install.',
    '=faster|reliable|stable|interference|secure|security\n=no cables|without cables|cables|move|mobile|portable|easier to add|anywhere|cheaper to install',
    '2 | Wired is faster and wireless lets you move around\n2 | Ethernet is more reliable and Wi-Fi needs no cables\n1 | Ethernet is faster\n0 | Both are the same', []);
  M('1.3.2a', '', 3, 'Which connection is most suitable for connecting wireless headphones to a phone?', ['Ethernet', 'Bluetooth', 'Fibre optic', 'Wi-Fi to a router'], 'B',
    ['Ethernet is wired.', '', 'Fibre is a cable.', 'Headphones pair directly with the phone over a short range, which is Bluetooth.'], []);

  // 1.3.2b Encryption in networks
  M('1.3.2b', '', 2, 'Why is data encrypted before it is sent over a network?', ['To make it smaller', 'So that if it is intercepted it cannot be understood', 'So it travels faster', 'To remove viruses'], 'B',
    ['Compression makes data smaller.', '', 'Encryption does not speed up transfer.', 'Anti-malware removes viruses.'], []);
  S('1.3.2b', '', 4, 'Explain', 2, 'Explain how encryption protects data sent over Wi-Fi.',
    'Data is scrambled using a key / algorithm (1) so if it is intercepted it cannot be understood without the key (1).',
    '=scrambled|scramble|encoded|unreadable|key|algorithm|cipher\n=cannot be understood|cannot understand|cannot be read|cannot read|meaningless|without the key|useless',
    '2 | The data is scrambled with a key so if it is intercepted it cannot be read\n2 | It is made unreadable so a hacker who intercepts it cannot understand it\n1 | The data is scrambled\n0 | It stops the data being intercepted', ['E1']);

  // 1.3.2c IP and MAC
  M('1.3.2c', '', 2, 'Which is an example of an IPv4 address?', ['192.168.1.20', '00:1A:2B:3C:4D:5E', 'www.example.com', '2001:db8::1:7'], 'A',
    ['', 'This is a MAC address (6 pairs of hex).', 'This is a domain name.', 'This is an IPv6 address.'], ['N3']);
  M('1.3.2c', '', 3, 'Which statement about MAC addresses is correct?', ['They change every time you connect', 'They are assigned to the network hardware by the manufacturer and do not change', 'They are written as four denary numbers', 'They are used to find websites'], 'B',
    ['That describes a dynamic IP address.', '', 'Four denary numbers is IPv4.', 'Domain names and IP addresses are used to find websites.'], ['N3']);
  S('1.3.2c', '', 4, 'Describe', 2, 'Describe one difference between an IP address and a MAC address.',
    'IP address is assigned by the network / can change / logical (1). MAC address is fixed to the hardware / set by the manufacturer / physical (1).',
    '=ip & change|changes|changed|assigned|logical|router|dynamic\n=mac & fixed|hardware|manufacturer|physical|permanent|nic',
    '2 | An IP address can change. A MAC address is fixed to the hardware\n1 | A MAC address is set by the manufacturer\n0 | They are both the same', ['N3']);

  // 1.3.2d Standards
  M('1.3.2d', '', 2, 'Why are standards important in networking?', ['They make cables cheaper', 'They allow hardware and software from different manufacturers to work together', 'They stop hackers', 'They make networks wireless'], 'B',
    ['Cost is not the main purpose of standards.', '', 'Security needs other measures.', 'Standards apply to wired and wireless.'], []);
  S('1.3.2d', '', 4, 'Explain', 2, 'Explain why it is important that manufacturers follow agreed standards.',
    'Devices / software from different manufacturers can work together / communicate (1) so users can choose any compatible product / everything is compatible (1).',
    '=different manufacturers|different companies|work together|compatible|communicate|interoperate\n=choose|choice|any|buy|connect|everything|anywhere|world',
    '2 | Devices from different manufacturers can work together so you can buy any brand\n2 | Everything is compatible so devices can communicate anywhere in the world\n1 | Different manufacturers can work together\n0 | It makes them more expensive', ['E1']);

  // 1.3.2e Protocols (skills)
  M('1.3.2e', 'web', 1, 'Which protocol is used to send web pages securely?', ['FTP', 'HTTPS', 'SMTP', 'POP'], 'B',
    ['FTP transfers files.', '', 'SMTP sends email.', 'POP receives email.'], ['H2']);
  M('1.3.2e', 'web', 3, 'What is the difference between HTTP and HTTPS?', ['HTTPS is used for email', 'HTTPS encrypts the data sent between the browser and the web server', 'HTTP is faster because it uses fibre', 'There is no difference'], 'B',
    ['Email uses SMTP, POP and IMAP.', '', 'Speed and cabling are not the difference.', 'HTTPS adds encryption.'], ['H2']);
  M('1.3.2e', 'email', 2, 'Which protocol is used to SEND email?', ['IMAP', 'POP', 'SMTP', 'HTTP'], 'C',
    ['IMAP is for receiving/accessing email.', 'POP is for receiving email.', '', 'HTTP is for web pages.'], ['H2']);
  S('1.3.2e', 'email', 4, 'Describe', 1, 'Describe the difference between POP and IMAP.',
    'POP downloads emails to the device and usually deletes them from the server; IMAP keeps emails on the server so they are synced across devices.',
    '=delete|deleted|removes|removed|downloads|kept on the server|stays on the server|stay on the server|synced|sync|synchronised|multiple devices|several devices',
    '1 | POP downloads the email and deletes it from the server but IMAP keeps it on the server\n1 | IMAP keeps emails synced across multiple devices\n0 | They are both for sending email\n0 | POP is for web pages', ['H2']);
  M('1.3.2e', 'ftp', 2, 'What is FTP used for?', ['Sending email', 'Transferring files between computers over a network', 'Browsing web pages', 'Translating domain names'], 'B',
    ['Email uses SMTP.', '', 'Web pages use HTTP/HTTPS.', 'That is DNS.'], ['H2']);
  S('1.3.2e', 'ftp', 3, 'State', 1, 'State the purpose of FTP.',
    'To transfer files between computers / to and from a server.',
    '=transfer files|transferring files|upload|download|move files|send files|copy files',
    '1 | Transferring files between computers\n1 | To upload files to a web server\n0 | To send emails\n0 | To browse websites', ['H2']);
  M('1.3.2e', 'tcpip', 3, 'What does TCP do when data is sent over the Internet?', ['Translates domain names', 'Splits data into packets, numbers them and checks they all arrive', 'Encrypts web pages', 'Sends email'], 'B',
    ['That is DNS.', '', 'That is HTTPS.', 'That is SMTP.'], ['H2']);
  S('1.3.2e', 'tcpip', 4, 'State', 1, 'State the role of IP in the TCP/IP protocol stack.',
    'Routes / addresses packets across networks to the correct destination.',
    '=route|routes|routing|routed|address|addresses|destination|direct|directs',
    '1 | It routes packets to the right destination\n1 | It addresses each packet\n0 | It encrypts the data\n0 | It sends email', ['H2']);

  // 1.3.2f Layers
  M('1.3.2f', '', 2, 'Why are network protocols organised into layers?', ['To make data travel faster', 'Each layer deals with one part of communication, so layers can be developed and changed separately', 'To use less cable', 'So that only one manufacturer can make network devices'], 'B',
    ['Layering is about design, not speed.', '', 'Layering does not change cabling.', 'Layers help many manufacturers work together.'], []);
  S('1.3.2f', '', 4, 'Give', 2, 'Give two advantages of using layers in networking.',
    'Any two: each layer can be changed / developed without affecting others (1); simplifies a complex problem / easier to understand (1); different manufacturers can make products for one layer / interoperability (1); easier to find and fix problems (1).',
    '=without affecting|independently|separately|changed|change one|replace\n=simpler|simplify|easier to understand|broken down|smaller parts|manageable\n=manufacturers|companies|compatible|work together|standard|standards\n=fix|troubleshoot|find problems|debug\nmax 2',
    '2 | One layer can be changed without affecting the others and it breaks the problem into smaller parts\n2 | Different manufacturers can make compatible products and it is easier to fix problems\n1 | Layers can be changed separately\n0 | It makes the cables shorter', []);
})(GCSE_BANK_X.M, GCSE_BANK_X.S);
