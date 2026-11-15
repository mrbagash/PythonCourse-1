// Extended bank – 1.2.1 Primary storage and 1.2.2 Secondary storage (original exam-style questions).
(function (M, S) {
  // 1.2.1a Need for primary storage
  M('1.2.1a', '', 1, 'Why does a computer need primary storage (memory)?', ['To keep files safe when the power is off', 'To hold the data and instructions the CPU is currently using', 'To connect to the internet', 'To make backups'], 'B',
    ['Keeping files when the power is off is the job of secondary storage.', '', 'Network hardware connects to the internet.', 'Backups go to secondary storage.'], []);
  S('1.2.1a', '', 3, 'Explain', 2, 'Explain why programs are loaded into RAM before they are run, rather than run directly from the hard drive.',
    'RAM is much faster to access than secondary storage (1) so the CPU can fetch the instructions/data quickly / does not have to wait (1).',
    '=faster|quicker|fast|quick|speed\n=cpu|fetch|fetched|access|wait|waiting|less time|run quickly',
    '2 | RAM is faster than the hard drive so the CPU can fetch instructions quickly\n2 | Memory is much quicker to access so the CPU does not have to wait\n1 | RAM is faster\n0 | RAM stores files permanently', ['E1']);
  M('1.2.1a', '', 4, 'Which statement about primary storage is correct?', ['It is accessed directly by the CPU', 'It is always non-volatile', 'It includes hard disk drives', 'It is slower than secondary storage'], 'A',
    ['', 'RAM (the main primary storage) is volatile.', 'Hard disk drives are secondary storage.', 'Primary storage is faster than secondary storage.'], []);

  // 1.2.1b RAM vs ROM
  M('1.2.1b', '', 1, 'Which of these describes RAM?', ['Non-volatile and read-only', 'Volatile and can be read from and written to', 'Non-volatile and used for backups', 'Volatile and read-only'], 'B',
    ['That describes ROM.', '', 'RAM is volatile and is not used for backups.', 'RAM can be written to, not just read.'], ['M1']);
  M('1.2.1b', '', 2, 'What does "volatile" mean?', ['The memory is very fast', 'The contents are lost when the power is switched off', 'The memory cannot be changed', 'The memory is very large'], 'B',
    ['Volatile is about losing data without power, not speed.', '', 'Memory that cannot be changed is read-only.', 'Volatile has nothing to do with size.'], ['M1']);
  S('1.2.1b', '', 3, 'State', 2, 'State two differences between RAM and ROM.',
    'Any two: RAM is volatile, ROM is non-volatile (1); RAM can be written to, ROM is read-only (1); RAM holds programs/data in use, ROM holds the boot-up instructions/BIOS (1); RAM is usually larger (1).',
    '=volatile|lost|power|non-volatile|keeps|retains\n=read only|read-only|written|write|change|changed|edited\n=boot|bios|start up|startup|in use|being used|running programs|programs that are running|open programs\n=larger|bigger|smaller|more capacity|size\nmax 2',
    '2 | RAM is volatile but ROM is non-volatile. RAM can be written to but ROM is read only\n2 | ROM stores the boot instructions and RAM is volatile\n1 | RAM is volatile\n0 | They are both types of storage', ['M1']);
  S('1.2.1b', '', 4, 'Explain', 2, 'Explain why the start-up (boot) instructions are stored in ROM and not in RAM.',
    'ROM is non-volatile so the instructions are kept when the power is off (1) and they are needed as soon as the computer is switched on / cannot be changed accidentally (1).',
    '=non-volatile|non volatile|kept|keeps|retained|retains|not lost|power off|switched off|turned off\n=switched on|turned on|start|starts|startup|boot|cannot be changed|read only|read-only|accidentally',
    '2 | ROM is non-volatile so the instructions are not lost when it is switched off, and they are needed when it starts\n2 | They are kept when the power is off and cannot be changed accidentally\n1 | ROM is non-volatile\n0 | ROM is faster than RAM', ['M1', 'E1']);

  // 1.2.1c Purpose of ROM
  M('1.2.1c', '', 1, 'What is ROM mainly used for in a computer?', ['Storing the programs currently running', 'Storing the instructions needed to boot the computer', 'Storing photos and documents', 'Speeding up the CPU'], 'B',
    ['Programs currently running are in RAM.', '', 'Photos and documents are saved on secondary storage.', 'Cache speeds up the CPU.'], ['M1']);
  S('1.2.1c', '', 2, 'State', 1, 'State what is stored in ROM.',
    'The boot-up / start-up instructions (BIOS / bootstrap / firmware).',
    '=boot|bios|start|startup|bootstrap|firmware|uefi',
    '1 | The boot up instructions\n1 | The BIOS\n0 | The programs that are running\n0 | Documents', ['M1']);
  M('1.2.1c', '', 3, 'Why can the user not save their files to ROM?', ['ROM is volatile', 'ROM is read-only so it cannot be written to', 'ROM is too fast', 'ROM is part of the ALU'], 'B',
    ['ROM is non-volatile.', '', 'Speed is not the reason.', 'ROM is not part of the ALU.'], ['M1']);

  // 1.2.1d Purpose of RAM
  M('1.2.1d', '', 1, 'What is stored in RAM?', ['The BIOS', 'The operating system, programs and data currently in use', 'Files that need to be kept for years', 'Only the operating system'], 'B',
    ['The BIOS is stored in ROM.', '', 'Long-term files are kept on secondary storage.', 'RAM also holds the programs and data in use, not just the OS.'], ['M1']);
  S('1.2.1d', '', 3, 'State', 1, 'State the purpose of RAM in a computer.',
    'Stores the programs / data / OS that are currently in use (running).',
    '=currently|in use|running|being used|open|use now|being run|being processed',
    '1 | It stores the programs that are currently running\n1 | Holds data that is in use\n0 | It stores the boot instructions\n0 | It keeps files after the computer is turned off', ['M1']);
  M('1.2.1d', '', 4, 'A computer with more RAM can often run more programs at the same time without slowing down. Why?', ['More RAM increases the clock speed', 'More programs and data fit in RAM, so less virtual memory is needed', 'More RAM adds extra cores', 'RAM stores data permanently'], 'B',
    ['RAM does not change the clock speed.', '', 'RAM does not add cores.', 'RAM is volatile.'], ['M2']);

  // 1.2.1e Virtual memory
  M('1.2.1e', '', 2, 'When is virtual memory used?', ['When the CPU is too hot', 'When RAM is full', 'When the computer is turned off', 'When cache is empty'], 'B',
    ['Heat is not what triggers virtual memory.', '', 'Nothing runs when the computer is turned off.', 'Virtual memory is about RAM being full, not cache.'], ['M2']);
  S('1.2.1e', '', 3, 'Describe', 2, 'Describe what virtual memory is.',
    'Part of secondary storage (1) used as extra memory when RAM is full (1).',
    '=secondary|hard drive|hard disk|hdd|ssd|storage|disk\n=full|run out|runs out|no space',
    '2 | Part of the hard drive used as extra memory when RAM is full\n2 | Secondary storage used when RAM runs out\n1 | It is used when RAM is full\n0 | It is extra RAM that makes the computer faster', ['M2']);
  S('1.2.1e', '', 5, 'Explain', 2, 'Explain why a computer that uses virtual memory a lot will run slowly.',
    'Secondary storage is much slower to access than RAM (1) and data has to be moved / swapped between RAM and storage (1).',
    '=slower|slow|takes longer\n=swap|swapped|swapping|moved|transferred|copied|back and forth|between',
    '2 | Secondary storage is slower than RAM and data has to be swapped between them\n2 | Data is moved back and forth which is slower than RAM\n1 | The hard drive is slower than RAM\n0 | Virtual memory is volatile', ['M2', 'E1']);

  // 1.2.2a Need for secondary storage
  M('1.2.2a', '', 1, 'Why is secondary storage needed?', ['To store data and programs permanently, even when the power is off', 'To run the CPU faster', 'To decode instructions', 'To replace RAM'], 'A',
    ['', 'Secondary storage does not make the CPU faster.', 'Decoding is done by the Control Unit.', 'It does not replace RAM – it is too slow.'], []);
  S('1.2.2a', '', 2, 'State', 1, 'State why a computer needs secondary storage.',
    'To store data / programs permanently (non-volatile) / when the power is off.',
    '=permanent|permanently|long term|long-term|non-volatile|non volatile|power is off|power off|turned off|switched off|keep|kept|save',
    '1 | To store files permanently\n1 | To keep data when the power is off\n0 | To make the CPU faster\n0 | To hold the data in use', []);

  // 1.2.2b Optical
  M('1.2.2b', '', 1, 'Which of these is optical storage?', ['USB memory stick', 'Blu-ray disc', 'Hard disk drive', 'SD card'], 'B',
    ['A USB stick is solid state.', '', 'A hard disk drive is magnetic.', 'An SD card is solid state.'], []);
  M('1.2.2b', '', 3, 'How is data read from an optical disc?', ['Using a magnetic read/write head', 'Using a laser that detects pits and lands', 'Using electrical charges in transistors', 'Using radio waves'], 'B',
    ['Magnetic heads are used by hard disk drives.', '', 'Electrical charges are used by solid state storage.', 'Radio waves are not used to read discs.'], []);
  S('1.2.2b', '', 4, 'Give', 2, 'Give one advantage and one disadvantage of optical discs for distributing a film.',
    'Advantage (1): cheap to produce / portable / light / durable enough to post. Disadvantage (1): low capacity compared to others / slow to access / can be scratched / need an optical drive.',
    '=cheap|low cost|inexpensive|portable|light|lightweight|easy to post|easy to distribute\n=scratch|scratched|scratches|low capacity|small capacity|slow|slower|drive|damaged|fragile|break',
    '2 | They are cheap to produce but they can be scratched\n2 | Discs are lightweight but have a low capacity\n1 | They are cheap\n0 | They are magnetic', []);

  // 1.2.2c Magnetic
  M('1.2.2c', '', 1, 'Which storage device contains moving parts?', ['Solid state drive', 'Hard disk drive', 'USB stick', 'SD card'], 'B',
    ['An SSD has no moving parts.', '', 'A USB stick is solid state – no moving parts.', 'An SD card is solid state.'], ['S1']);
  M('1.2.2c', '', 3, 'Why are hard disk drives still used in many servers?', ['They are the fastest storage', 'They give a high capacity at a low cost per gigabyte', 'They have no moving parts', 'They are the most portable'], 'B',
    ['SSDs are faster.', '', 'HDDs DO have moving parts.', 'HDDs are not chosen for portability in servers.'], ['S1']);
  S('1.2.2c', '', 3, 'Give', 1, 'Give one disadvantage of magnetic storage compared to solid state storage.',
    'Slower access speed / moving parts that can break / less durable if dropped / heavier / noisier / uses more power.',
    '=slower|slow|moving parts|moving|break|damaged|less durable|not durable|dropped|heavier|heavy|noisy|noise|more power',
    '1 | It is slower\n1 | It has moving parts that can be damaged if dropped\n0 | It is more expensive per gigabyte\n0 | It can store more data', ['S1']);

  // 1.2.2d Solid state
  M('1.2.2d', '', 1, 'Which is an example of solid state storage?', ['DVD', 'Hard disk drive', 'SSD', 'Magnetic tape'], 'C',
    ['A DVD is optical.', 'A hard disk drive is magnetic.', '', 'Tape is magnetic.'], ['S1']);
  S('1.2.2d', '', 3, 'Explain', 2, 'Explain why solid state storage is used in most mobile phones.',
    'No moving parts so it is durable / not damaged if dropped (1). Also any one of: small / light, fast, low power use (battery) (1).',
    '=no moving parts|durable|robust|shock|withstand\n=small|light|lightweight|fast|faster|quick|low power|little power|battery|compact|thin',
    '2 | It has no moving parts so it is not damaged if dropped and it is small\n2 | It is durable and uses little power so the battery lasts longer\n1 | It has no moving parts\n0 | It has the biggest capacity', ['S1', 'E1']);
  M('1.2.2d', '', 4, 'Which is a disadvantage of solid state storage compared to magnetic storage?', ['It is slower', 'It has a higher cost per gigabyte', 'It has moving parts', 'It is heavier'], 'B',
    ['SSDs are faster than HDDs.', '', 'SSDs have NO moving parts.', 'SSDs are lighter.'], ['S1']);

  // 1.2.2e Characteristics
  M('1.2.2e', '', 2, 'Which characteristic describes how well a storage device survives being dropped or knocked?', ['Capacity', 'Durability', 'Speed', 'Cost'], 'B',
    ['Capacity is how much it can store.', '', 'Speed is how fast data can be read/written.', 'Cost is how much it costs.'], []);
  M('1.2.2e', '', 3, 'What does the "portability" of a storage device mean?', ['How quickly data can be read', 'How easy it is to carry around', 'How long it lasts', 'How much it can store'], 'B',
    ['That is speed.', '', 'That is closer to reliability/durability.', 'That is capacity.'], []);
  S('1.2.2e', '', 4, 'Describe', 2, 'Describe what is meant by the "capacity" and the "reliability" of a storage device.',
    'Capacity: how much data it can store (1). Reliability: whether it keeps working / stores data correctly over time without failing (1).',
    '=how much|amount|space|size|store\n=fail|failing|failure|working|consistently|over time|without errors|keeps data|trusted|dependable|lasts',
    '2 | Capacity is how much data it can store. Reliability is whether it keeps working without failing\n1 | Capacity is how much data it can store\n0 | Capacity is how fast it is', []);

  // 1.2.2f Choosing storage
  M('1.2.2f', '', 2, 'A photographer wants to carry 500 GB of photos between home and work. Which device is most suitable?', ['A DVD', 'A portable SSD', 'An internal hard disk drive', 'A CD'], 'B',
    ['A DVD only holds a few GB.', '', 'An internal drive is not designed to be carried around.', 'A CD only holds about 700 MB.'], []);
  M('1.2.2f', '', 4, 'A school needs to back up 20 TB of data each night as cheaply as possible. Which is most suitable?', ['Blu-ray discs', 'Magnetic storage (hard drives or tape)', 'USB sticks', 'RAM'], 'B',
    ['Blu-ray would need hundreds of discs and lots of time.', '', 'USB sticks would be expensive per TB and slow to manage.', 'RAM is volatile – it cannot keep a backup.'], ['S1']);
  S('1.2.2f', '', 5, 'Explain', 2, 'A delivery driver needs a storage device in a handheld scanner that is carried in a van all day. Explain why solid state storage is more suitable than magnetic storage.',
    'Solid state has no moving parts so it is durable / will not be damaged by bumps or drops (1). It is also small / light / low power so suits a handheld battery device (1).',
    '=no moving parts|durable|robust|vibration|shock|withstand\n=small|light|lightweight|low power|battery|compact|portable',
    '2 | It has no moving parts so it will not be damaged by bumps and it is light\n2 | It is durable and low power so the battery lasts\n1 | It is durable\n0 | It has a larger capacity', ['S1', 'E1']);
})(GCSE_BANK_X.M, GCSE_BANK_X.S);
