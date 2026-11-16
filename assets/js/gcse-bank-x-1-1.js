// Extended bank – 1.1 Systems architecture (original exam-style questions).
(function (M, S) {
  // 1.1.1a Purpose of the CPU and the fetch-execute cycle
  M('1.1.1a', '', 1, 'What is the main purpose of the CPU?', ['To store files permanently', 'To process data and instructions', 'To display images on the screen', 'To connect the computer to a network'], 'B',
    ['Storing files permanently is the job of secondary storage, not the CPU.', '', 'The graphics card and monitor display images; the CPU processes instructions.', 'A network interface card connects to a network.'], []);
  M('1.1.1a', '', 2, 'In the fetch-execute cycle, what happens in the DECODE stage?', ['The instruction is copied from memory into the CPU', 'The Control Unit works out what the instruction means', 'The result is written back to secondary storage', 'The Program Counter is reset to 0'], 'B',
    ['Copying the instruction from memory is the FETCH stage.', '', 'Results are not written to secondary storage during the cycle.', 'The PC is incremented, not reset, during the cycle.'], ['C1']);
  M('1.1.1a', '', 3, 'Which happens during the FETCH stage of the fetch-execute cycle?', ['The ALU carries out a calculation', 'The address in the PC is copied to the MAR', 'The instruction is decoded by the CU', 'Data is saved to the hard drive'], 'B',
    ['Calculations happen in the EXECUTE stage.', '', 'Decoding is the stage AFTER fetch.', 'Nothing is saved to the hard drive during fetch.'], ['C1', 'R2']);
  S('1.1.1a', '', 2, 'State', 1, 'State the three stages of the CPU cycle, in order.',
    'Fetch, decode, execute (in that order).',
    '=fetch & decode & execute',
    '1 | fetch decode execute\n1 | Fetch, then decode, then execute\n0 | Input, process, output\n0 | decode and execute', ['C1']);
  S('1.1.1a', '', 4, 'Describe', 2, 'Describe what happens during the fetch stage of the fetch-execute cycle.',
    'The address in the PC is copied to the MAR (1). The instruction at that address is copied into the MDR (1). (Also accept: the PC is incremented.)',
    '=pc|program counter & mar|address\n=mdr|memory data register|instruction copied|incremented|increases',
    '2 | The address in the PC is copied to the MAR and the instruction is copied into the MDR\n2 | The program counter address goes to the MAR then the PC is incremented\n1 | The PC address is copied to the MAR\n0 | The CPU does a calculation\n0 | The instruction is carried out', ['C1', 'R2']);

  // 1.1.1b ALU
  M('1.1.1b', '', 1, 'What does the ALU do?', ['Decodes instructions', 'Carries out calculations and logical comparisons', 'Stores the address of the next instruction', 'Stores frequently used data'], 'B',
    ['Decoding is done by the Control Unit.', '', 'That is the Program Counter.', 'That is cache.'], ['C2']);
  M('1.1.1b', '', 3, 'Which of these operations would be carried out by the ALU?', ['Sending a signal to fetch the next instruction', 'Checking whether 17 > 12', 'Storing an address in the MAR', 'Loading the operating system from ROM'], 'B',
    ['Control signals come from the Control Unit.', '', 'Registers hold addresses; the ALU does not.', 'The boot process is not an ALU operation.'], ['C2']);
  S('1.1.1b', '', 2, 'State', 1, 'State one type of operation carried out by the ALU.',
    'Arithmetic (e.g. addition / subtraction) OR logical comparisons (e.g. greater than, AND).',
    '=arithmetic|add|addition|subtract|subtraction|calculation|calculations|maths|logic|logical|comparison|compare|comparisons',
    '1 | Arithmetic such as adding numbers\n1 | Logical comparisons\n0 | It decodes instructions\n0 | It stores data', ['C2']);
  S('1.1.1b', '', 4, 'Describe', 2, 'Describe the role of the ALU during the execute stage of the fetch-execute cycle.',
    'Carries out arithmetic calculations / logical operations (1). Stores the result in the accumulator (1).',
    '=arithmetic|calculation|calculations|add|subtract|logic|logical|comparison|compare\n=accumulator|acc|result|stores the result',
    '2 | It carries out the calculation and stores the result in the accumulator\n2 | Performs logical comparisons and puts the result in the accumulator\n1 | It does the arithmetic\n0 | It decodes the instruction', ['C2', 'R3']);

  // 1.1.1c Control Unit
  M('1.1.1c', '', 1, 'Which part of the CPU sends control signals to the other components?', ['ALU', 'Control Unit', 'Cache', 'MDR'], 'B',
    ['The ALU does calculations and comparisons.', '', 'Cache stores frequently used data.', 'The MDR holds data or instructions.'], ['C2']);
  M('1.1.1c', '', 3, 'Which statement about the Control Unit is correct?', ['It carries out all the calculations', 'It decodes instructions and controls the flow of data', 'It permanently stores the operating system', 'It is a type of secondary storage'], 'B',
    ['Calculations are done by the ALU.', '', 'The OS is stored in secondary storage (and the BIOS in ROM).', 'It is part of the CPU, not storage.'], ['C2']);
  S('1.1.1c', '', 2, 'State', 1, 'State one job of the Control Unit (CU).',
    'Decodes instructions / sends control signals / controls the flow of data / manages the fetch-execute cycle.',
    '=decode|decodes|decoding|control signal|control signals|signals|controls|coordinates|manages|flow',
    '1 | It decodes instructions\n1 | It sends control signals to other parts\n0 | It does calculations\n0 | It stores the data', ['C2']);
  S('1.1.1c', '', 4, 'Describe', 2, 'Describe two jobs of the Control Unit.',
    'Decodes instructions (1). Sends control signals / coordinates components / controls the flow of data (1).',
    '=decode|decodes|decoding\n=signal|signals|coordinates|controls|manages|flow|timing',
    '2 | It decodes instructions and sends control signals to other components\n2 | Decodes the instruction and manages the flow of data\n1 | It decodes instructions\n0 | It carries out calculations and stores data', ['C2']);

  // 1.1.1d Cache
  M('1.1.1d', '', 1, 'What is cache?', ['A type of secondary storage', 'Very fast memory in or near the CPU', 'A network device', 'Part of the ALU that adds numbers'], 'B',
    ['Cache is memory, not secondary storage – it is small, fast and volatile.', '', 'Cache is not a network device.', 'Adding numbers is done by the ALU.'], ['C3']);
  M('1.1.1d', '', 2, 'Why does the CPU use cache?', ['To store files when the computer is off', 'To hold frequently used data and instructions so they can be fetched quickly', 'To increase the size of RAM', 'To protect the computer from viruses'], 'B',
    ['Cache is volatile – its contents are lost when the power is off.', '', 'Cache does not increase RAM; it is a separate, smaller, faster memory.', 'Anti-malware protects against viruses.'], ['C3']);
  S('1.1.1d', '', 3, 'State', 1, 'State what is stored in cache.',
    'Frequently used / recently used data and instructions.',
    '=frequent|frequently|often|recent|recently|commonly|regularly|repeatedly',
    '1 | Frequently used data and instructions\n1 | Data that is used often\n0 | All the files on the computer\n0 | The operating system permanently', ['C3']);
  S('1.1.1d', '', 4, 'Explain', 2, 'Explain why having cache improves the performance of the CPU.',
    'Cache is faster to access than RAM (1) so frequently used data/instructions can be fetched more quickly / the CPU waits less (1).',
    '=faster|quicker|fast|quick|speed\n=frequent|frequently|often|wait|waiting|less time|ram|main memory|fetched',
    '2 | Cache is faster than RAM so frequently used instructions are fetched more quickly\n2 | It is quicker to access so the CPU waits less time\n1 | Cache is fast\n0 | It stores more files\n0 | It makes the computer bigger', ['C3', 'E1']);

  // 1.1.1e Registers
  M('1.1.1e', '', 2, 'Which register holds the result of a calculation done by the ALU?', ['Program Counter', 'Memory Address Register', 'Accumulator', 'Memory Data Register'], 'C',
    ['The PC holds the address of the next instruction.', 'The MAR holds an address.', '', 'The MDR holds data/instructions moving to or from memory.'], ['R3']);
  M('1.1.1e', '', 3, 'During the fetch stage, which register is the address copied INTO from the Program Counter?', ['MDR', 'MAR', 'Accumulator', 'Cache'], 'B',
    ['The MDR receives the data/instruction, not the address.', '', 'The accumulator holds results of calculations.', 'Cache is not a register.'], ['R1', 'R2']);
  M('1.1.1e', '', 4, 'The MDR currently holds the value 01101100. Which statement MUST be true?', ['It is the address of the next instruction', 'It is data or an instruction that has been fetched or is to be written to memory', 'It is the result of the last calculation', 'It is the address held in the MAR'], 'B',
    ['The address of the next instruction is in the PC.', '', 'Results of calculations go to the accumulator.', 'The MAR holds the address; the MDR holds what is AT that address.'], ['R1']);
  S('1.1.1e', '', 4, 'Describe', 2, 'Describe the difference between the MAR and the MDR.',
    'MAR holds the address of the memory location being accessed (1). MDR holds the data/instruction fetched from or written to that location (1).',
    '[MAR] holds|stores|contains|keeps -> address ! data|instruction\n[MDR] holds|stores|contains|keeps -> data|instruction ! address',
    '2 | The MAR holds the address. The MDR holds the data\n2 | The MAR stores the memory address being used. The MDR stores the instruction that was fetched\n1 | The MAR holds the address\n0 | The MAR holds the data and the MDR holds the address', ['R1']);

  // 1.1.1f How data and instructions are stored
  M('1.1.1f', '', 2, 'How does a computer store a program and the data it uses?', ['Data and instructions are stored in separate memories', 'Data and instructions are stored together in the same memory', 'The CPU has no registers', 'It only works with solid state drives'], 'B',
    ['Data and instructions are not kept in separate memories – they share the same memory.', '', 'The CPU uses registers such as the PC, MAR and MDR.', 'This is about the CPU and memory, not about drives.'], ['C4']);
  S('1.1.1f', '', 3, 'State', 1, 'State how data and instructions are stored in the memory of a computer.',
    'Together in the same memory (stored program concept).',
    '=same|together|single|shared|one memory',
    '1 | They are stored together in the same memory\n1 | Both are in one memory\n0 | In separate memories\n0 | In the CPU only', ['C4']);
  M('1.1.1f', '', 4, 'Which of these is NOT a register used in the fetch-execute cycle?', ['Program Counter', 'MAR', 'MDR', 'Graphics register'], 'D',
    ['The PC is used in the cycle: it holds the address of the next instruction.', 'The MAR is used in the cycle: it holds the address being accessed.', 'The MDR is used in the cycle: it holds the data or instruction fetched.', ''], ['C4']);

  // 1.1.2a Clock speed
  M('1.1.2a', '', 1, 'What does the clock speed of a CPU measure?', ['How much data the CPU can store', 'How many cycles (instructions) the CPU carries out per second', 'How many cores the CPU has', 'How hot the CPU gets'], 'B',
    ['Clock speed is not about storage.', '', 'That is the number of cores, which is different.', 'Temperature is not measured by clock speed.'], ['P1']);
  M('1.1.2a', '', 3, 'A CPU has a clock speed of 3.2 GHz. Approximately how many cycles is that per second?', ['3.2 thousand', '3.2 million', '3.2 billion', '3.2 trillion'], 'C',
    ['Thousand would be kHz.', 'Million would be MHz.', '', 'Trillion would be THz.'], ['P1']);
  S('1.1.2a', '', 3, 'Explain', 2, 'Explain how increasing the clock speed can improve the performance of a CPU.',
    'More cycles / instructions are carried out per second (1) so programs run faster / tasks finish sooner (1).',
    '=more instructions|more cycles|instructions per second|cycles per second|more per second|more operations|more often\n=faster|quicker|less time|sooner|speed up|performance',
    '2 | More instructions are carried out per second so the program runs faster\n2 | It does more cycles per second so tasks finish quicker\n1 | More cycles per second\n0 | It stores more data\n0 | The computer has more memory', ['P1', 'E1']);
  S('1.1.2a', '', 5, 'Explain', 2, 'A student says "doubling the clock speed will always make every program run twice as fast". Explain why this is not always true.',
    'Other factors limit performance, e.g. waiting for data from RAM / storage / cache misses / heat causing throttling (1) so the CPU cannot always use the extra cycles (1).',
    '=ram|memory|storage|cache|bottleneck|wait|waiting|heat|overheat|throttle|throttling|other factors|other components\n=cannot|limits|limited|slower|bottleneck|wait|waiting|held back|not used',
    '2 | The CPU may have to wait for data from RAM so the extra cycles are not used\n2 | Heat can cause throttling which limits the speed\n1 | It depends on RAM\n0 | Because clock speed is measured in GHz', ['P1', 'E1']);

  // 1.1.2b Cache size
  M('1.1.2b', '', 2, 'How can a larger cache improve CPU performance?', ['It increases the clock speed', 'More frequently used data can be stored close to the CPU, so fewer slow trips to RAM are needed', 'It adds more cores', 'It increases the size of the hard drive'], 'B',
    ['Cache size and clock speed are separate factors.', '', 'Cache size does not add cores.', 'Cache is not secondary storage.'], ['C3']);
  S('1.1.2b', '', 4, 'Explain', 2, 'Explain why increasing the cache size can improve the performance of a computer.',
    'More data/instructions can be stored in cache (1) so the CPU has to fetch from slower RAM less often (1).',
    '=more data|more instructions|store more|hold more|more can be stored|more space\n=ram|main memory|less often|fewer|faster|quicker|slower memory',
    '2 | More data can be stored in cache so the CPU fetches from slower RAM less often\n2 | It can hold more instructions so they are fetched faster\n1 | More data can be stored\n0 | It increases the clock speed', ['C3', 'E1']);
  M('1.1.2b', '', 4, 'Why is cache NOT made as large as RAM?', ['Cache is slower than RAM', 'Cache is expensive and physically small', 'Cache is non-volatile', 'Cache can only store instructions'], 'B',
    ['Cache is FASTER than RAM, not slower.', '', 'Cache is volatile.', 'Cache stores both data and instructions.'], ['C3']);

  // 1.1.2c Cores
  M('1.1.2c', '', 1, 'What is a core in a CPU?', ['A storage device', 'An independent processing unit that can fetch, decode and execute instructions', 'A type of cache', 'A cooling fan'], 'B',
    ['Cores process; they do not store files.', '', 'Cache stores frequently used data; a core processes.', 'A fan cools the CPU.'], ['P2']);
  M('1.1.2c', '', 3, 'A quad-core CPU runs a program that can only use one core at a time. What is the most likely result?', ['The program runs four times faster', 'The program runs at about the same speed as on a single-core CPU with the same clock speed', 'The program cannot run', 'The program uses four times more RAM'], 'B',
    ['Four times faster would need the program to split its work across all 4 cores.', '', 'It still runs – just on one core.', 'Cores do not change RAM use.'], ['P2']);
  S('1.1.2c', '', 4, 'Explain', 2, 'Explain why doubling the number of cores does not always double the performance.',
    'Some programs/tasks cannot be split up to run in parallel (1) so the extra cores are not used / cores must wait for each other (1).',
    '=parallel|split|divided|shared|not designed|cannot be split|single core|one core|depend\n=not used|unused|idle|wait|waiting|cannot use|only use one|not all',
    '2 | Some programs cannot be split to run in parallel so the extra cores are not used\n2 | The software may only use one core so the others are idle\n1 | Not all programs run in parallel\n0 | Because the clock speed is the same', ['P2', 'E1']);

  // 1.1.3a Embedded systems
  M('1.1.3a', '', 1, 'What is an embedded system?', ['A general-purpose computer such as a laptop', 'A computer system built into a larger device to do a dedicated task', 'A type of operating system', 'A network of computers'], 'B',
    ['A laptop is general-purpose – it can run many different programs.', '', 'An embedded system is hardware + software, not just an OS.', 'A network connects computers; that is not an embedded system.'], []);
  S('1.1.3a', '', 3, 'State', 2, 'State two characteristics of embedded systems.',
    'Any two: dedicated / single function (1); part of a larger device (1); small / low power (1); cheap to make (1); very reliable (1); software rarely changes (1).',
    '=dedicated|single|one task|specific|particular\n=small|low power|little power|cheap|reliable|larger device|built into|inside|rarely|firmware|hard to change\nmax 2',
    '2 | It has a dedicated function and is built into a larger device\n2 | It does one specific task and uses low power\n1 | It does one specific task\n0 | It can run any program', []);
  M('1.1.3a', '', 4, 'Why do embedded systems usually use less power than a desktop computer?', ['They have no software', 'They only need simple hardware for one dedicated task', 'They never turn off', 'They use magnetic storage'], 'B',
    ['They do have software (firmware).', '', 'Many embedded systems do stay on, but that would use MORE power.', 'They usually use flash/ROM, not magnetic storage.'], []);

  // 1.1.3b Examples of embedded systems
  M('1.1.3b', '', 1, 'Which of these is an example of an embedded system?', ['A desktop PC', 'A washing machine controller', 'A laptop', 'A games console used to browse the web and play games'], 'B',
    ['A desktop PC is general-purpose.', '', 'A laptop is general-purpose.', 'A device that runs many different programs is general-purpose.'], []);
  S('1.1.3b', '', 2, 'Give', 1, 'Give one example of a device that contains an embedded system.',
    'Any suitable device: washing machine, microwave, dishwasher, car engine management / satnav, central heating controller, traffic lights, fridge, digital watch.',
    '=washing machine|microwave|dishwasher|car|satnav|sat nav|heating|thermostat|traffic|fridge|freezer|watch|camera|router|tv|television|oven|kettle|alarm|calculator|pacemaker|printer|lift|elevator|vending',
    '1 | A washing machine\n1 | Microwave\n0 | A laptop\n0 | Windows', []);
  M('1.1.3b', '', 4, 'A smart thermostat can be controlled from a phone app. Why is it still classed as an embedded system?', ['Because it has a screen', 'Because it is a computer inside a larger device doing one dedicated job (controlling heating)', 'Because it connects to the internet', 'Because it runs many different apps'], 'B',
    ['Many general-purpose devices have screens too.', '', 'Being online does not make something embedded.', 'Running many apps is a general-purpose feature.'], []);
})(GCSE_BANK_X.M, GCSE_BANK_X.S);
