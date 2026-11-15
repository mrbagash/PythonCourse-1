// Extended bank – 1.2.3 Units, 1.2.4 Data storage, 1.2.5 Compression (original exam-style questions).
(function (M, S) {
  // 1.2.3a Units
  M('1.2.3a', '', 1, 'How many bits are in a nibble?', ['2', '4', '8', '16'], 'B',
    ['2 bits is not a named unit at GCSE.', '', '8 bits is a byte.', '16 bits is two bytes.'], ['D1']);
  M('1.2.3a', '', 1, 'How many bits are in a byte?', ['4', '8', '10', '1000'], 'B',
    ['4 bits is a nibble.', '', 'There is no 10-bit unit at GCSE.', '1000 is how many bytes are in a kilobyte.'], ['D1']);
  M('1.2.3a', '', 2, 'Which list is in order from SMALLEST to LARGEST?', ['KB, MB, GB, TB', 'MB, KB, GB, TB', 'GB, MB, KB, TB', 'KB, GB, MB, TB'], 'A',
    ['', 'A kilobyte is smaller than a megabyte.', 'A gigabyte is larger than a megabyte and a kilobyte.', 'A megabyte comes before a gigabyte.'], ['D1']);
  S('1.2.3a', '', 3, 'State', 1, 'State how many kilobytes are in one megabyte (using the units in the J277 specification).',
    '1000.',
    '=1000|thousand|1 000|1,000',
    '1 | 1000\n1 | one thousand\n0 | 1024\n0 | 100', ['D1']);
  M('1.2.3a', '', 4, 'Which is the LARGEST amount of data?', ['3000 MB', '2 GB', '1,500,000 KB', '0.001 TB'], 'A',
    ['', '2 GB = 2000 MB, which is less than 3000 MB.', '1,500,000 KB = 1500 MB.', '0.001 TB = 1 GB = 1000 MB.'], ['D1', 'E5']);
  M('1.2.3a', '', 5, 'A file is 2.5 GB. How many megabytes is this?', ['25', '250', '2500', '25,000'], 'C',
    ['Multiply by 1000, not 10.', 'Multiply by 1000, not 100.', '', 'That is ×10,000 – one zero too many.'], ['D1', 'E5']);

  // 1.2.3b Why binary
  M('1.2.3b', '', 1, 'Why do computers store data in binary?', ['Binary is easier for humans to read', 'Computers are made of switches (transistors) that have two states: on and off', 'Binary uses less electricity than denary in every case', 'Binary can only store numbers'], 'B',
    ['Binary is harder for humans to read – that is why we use hex.', '', 'This is not the reason given at GCSE.', 'Binary can represent text, images and sound too.'], []);
  S('1.2.3b', '', 3, 'Explain', 2, 'Explain why computers use binary to represent data.',
    'Computers are made from switches / transistors / logic gates (1) which only have two states, on and off / 1 and 0 (1).',
    '=switch|switches|transistor|transistors|circuit|circuits|logic gates|electrical\n=two states|2 states|on and off|on or off|1 and 0|0 and 1|two values',
    '2 | Computers use transistors which only have two states, on and off\n2 | Circuits are switches that can be on and off\n1 | They have two states\n0 | Binary is easier to read', ['E1']);

  // 1.2.3c File sizes
  M('1.2.3c', 'image', 3, 'An image is 800 × 600 pixels with a colour depth of 8 bits. What is its file size in bytes?', ['480,000 bytes', '3,840,000 bytes', '60,000 bytes', '4,800 bytes'], 'A',
    ['', '3,840,000 is the size in BITS – divide by 8 for bytes.', 'Only divide by 8 once.', 'You have lost two zeros: 800 × 600 = 480,000.'], ['B5', 'E5']);
  S('1.2.3c', 'image', 4, 'Calculate', 2, 'An image is 100 pixels wide and 50 pixels high. Each pixel uses 4 bits. Calculate the file size in BYTES. Show your working.',
    '100 × 50 × 4 = 20,000 bits (1). ÷ 8 = 2,500 bytes (1).',
    '=20000|20 000|20,000\n=2500|2 500|2,500',
    '2 | 100 x 50 x 4 = 20000 bits, divided by 8 = 2500 bytes\n1 | 20000\n1 | 2500 bytes\n0 | 5000 bytes', ['B5', 'E5']);
  M('1.2.3c', 'sound', 4, 'A sound is recorded for 10 seconds at 44,100 Hz with a bit depth of 16 bits. Which calculation gives its size in BYTES?', ['44,100 × 16 × 10', '(44,100 × 16 × 10) ÷ 8', '(44,100 + 16 + 10) ÷ 8', '44,100 × 10 ÷ 16'], 'B',
    ['This gives the size in bits – divide by 8 for bytes.', '', 'The values are multiplied, not added.', 'Bit depth multiplies; it does not divide.'], ['B5', 'D4']);
  S('1.2.3c', 'sound', 5, 'Calculate', 2, 'A sound file is sampled 1,000 times a second, with a bit depth of 8 bits, for 60 seconds. Calculate its size in kilobytes. Show your working.',
    '1000 × 8 × 60 = 480,000 bits (or 1000 × 60 = 60,000 bytes) (1). = 60 KB (1).',
    '=480000|480 000|480,000|60000|60 000|60,000\n=60 kb|60kb|60 kilobytes',
    '2 | 1000 x 8 x 60 = 480000 bits = 60000 bytes = 60 KB\n1 | 480000 bits\n1 | 60 KB\n0 | 480 KB', ['B5', 'E5']);
  M('1.2.3c', 'text', 3, 'A text file contains 500 characters. Each character uses 8 bits. How big is the file?', ['500 bits', '500 bytes', '4,000 bytes', '62.5 bytes'], 'B',
    ['500 × 8 = 4,000 bits, which is 500 bytes – not 500 bits.', '', '4,000 is the number of BITS.', 'Divide the bits by 8, not the characters.'], ['B5']);
  M('1.2.3c', 'capacity', 4, 'A 2 GB memory card stores photos that are each 4 MB. About how many photos fit on it?', ['50', '500', '5,000', '8'], 'B',
    ['2 GB = 2000 MB; 2000 ÷ 4 = 500.', '', 'That would need 20 GB.', '8 would be 2 × 4 – you must divide.'], ['B5', 'D1']);
  S('1.2.3c', 'capacity', 5, 'Calculate', 2, 'A USB stick has 16 GB free. A student wants to store videos that are each 800 MB. Calculate how many videos will fit. Show your working.',
    '16 GB = 16,000 MB (1). 16,000 ÷ 800 = 20 videos (1).',
    '=16000|16 000|16,000\n=20 videos|20',
    '2 | 16 GB is 16000 MB and 16000 / 800 = 20 videos\n1 | 20\n1 | 16000 MB\n0 | 2 videos', ['B5', 'E5']);

  // 1.2.4a Binary ↔ denary
  M('1.2.4a', 'b2d', 1, 'What is the binary number 00000101 in denary?', ['3', '5', '6', '101'], 'B',
    ['Check the place values: the 1s are in the 4 and 1 columns.', '', '6 would be 00000110.', '101 is just the digits read as denary – work out the place values.'], ['B2']);
  M('1.2.4a', 'b2d', 2, 'Convert the binary number 00101101 to denary.', ['45', '44', '90', '23'], 'A',
    ['', '44 would be 00101100 – you missed the 1 in the units column.', '90 would be 01011010.', 'Place values double from the right: 32 + 8 + 4 + 1.'], ['B2']);
  S('1.2.4a', 'b2d', 3, 'Convert', 1, 'Convert the binary number 10011100 into denary.',
    '156 (128 + 16 + 8 + 4).',
    '=156',
    '1 | 156\n1 | The answer is 156\n0 | 155\n0 | 10011100', ['B2']);
  M('1.2.4a', 'b2d', 2, 'What is the largest denary number that can be stored in 8 bits?', ['128', '255', '256', '512'], 'B',
    ['128 is the value of the left-most bit alone.', '', '256 needs 9 bits (100000000).', '512 needs 10 bits.'], ['B2']);
  M('1.2.4a', 'd2b', 2, 'Convert the denary number 12 to 8-bit binary.', ['00001100', '00001010', '00011000', '11000000'], 'A',
    ['', '00001010 is 10.', '00011000 is 24.', 'The bits are in the wrong end: 11000000 is 192.'], ['B2']);
  S('1.2.4a', 'd2b', 3, 'Convert', 1, 'Convert the denary number 200 into 8-bit binary.',
    '11001000 (128 + 64 + 8).',
    '=11001000|1100 1000',
    '1 | 11001000\n1 | 1100 1000\n0 | 11001001\n0 | 200', ['B2']);
  S('1.2.4a', 'd2b', 4, 'Convert', 1, 'Convert the denary number 77 into 8-bit binary.',
    '01001101 (64 + 8 + 4 + 1).',
    '=01001101|0100 1101|1001101',
    '1 | 01001101\n1 | 0100 1101\n0 | 01001100\n0 | 10110010', ['B2']);

  // 1.2.4b Binary addition and overflow
  M('1.2.4b', 'add', 2, 'What is 1 + 1 in binary?', ['2', '10', '11', '01'], 'B',
    ['There is no digit 2 in binary.', '', '11 is 1 + 1 + 1 (three).', '01 is just 1.'], ['B3']);
  M('1.2.4b', 'add', 3, 'Add the binary numbers 00110101 and 00011010.', ['01001111', '00101111', '01001101', '01010111'], 'A',
    ['', 'Check your carries – you lost the carry into the 64 column.', 'Check the units column: 1 + 0 = 1.', 'Check the 2s column: 0 + 1 = 1 with no carry.'], ['B3']);
  S('1.2.4b', 'add', 4, 'Add', 1, 'Add the 8-bit binary numbers 01101001 and 00110110. Give your answer in 8-bit binary.',
    '10011111.',
    '=10011111|1001 1111',
    '1 | 10011111\n1 | 1001 1111\n0 | 10011110\n0 | 159', ['B3']);
  M('1.2.4b', 'overflow', 3, 'What is an overflow error?', ['When a number is too large to fit in the number of bits available', 'When a file is too big for the hard drive', 'When the CPU gets too hot', 'When binary is converted to hex'], 'A',
    ['', 'That is running out of storage, not overflow.', 'Heat is not an overflow error.', 'Converting to hex does not cause overflow.'], ['B3']);
  S('1.2.4b', 'overflow', 5, 'Explain', 2, 'The 8-bit binary numbers 11000000 and 01000001 are added. Explain what happens.',
    'The answer (257) needs 9 bits / there is a carry out of the 8th bit (1) so an overflow error occurs / the extra bit is lost and the result is wrong (00000001) (1).',
    '=9 bits|nine bits|9th bit|ninth bit|carry|257|too big|too large|does not fit\n=overflow|lost|wrong|incorrect|00000001',
    '2 | The result is 257 which is too big for 8 bits so an overflow error happens\n2 | There is a carry out of the 8th bit so the extra bit is lost\n1 | It causes an overflow\n0 | The answer is 11000001', ['B3', 'E1']);

  // 1.2.4c Hexadecimal
  M('1.2.4c', 'h2d', 1, 'Which hex digit represents the denary number 11?', ['A', 'B', 'C', '11'], 'B',
    ['A is 10.', '', 'C is 12.', 'Each hex digit must be a single character: 0–9 then A–F.'], ['B4']);
  M('1.2.4c', 'h2d', 2, 'What is the hexadecimal number 2F in denary?', ['47', '32', '215', '17'], 'A',
    ['', '32 would be 20 in hex – you forgot the F (15).', '2F is not 2 then 15 written side by side.', 'F is 15, not 1.'], ['B4']);
  S('1.2.4c', 'h2d', 3, 'Convert', 1, 'Convert the hexadecimal number 3F into denary.',
    '63 (3 × 16 + 15).',
    '=63',
    '1 | 63\n1 | 3F is 63\n0 | 315\n0 | 48', ['B4']);
  S('1.2.4c', 'h2d', 4, 'Convert', 1, 'Convert the denary number 200 into hexadecimal.',
    'C8 (12 × 16 = 192, remainder 8).',
    '=c8',
    '1 | C8\n1 | c8\n0 | 128\n0 | CB', ['B4']);
  M('1.2.4c', 'h2b', 3, 'Convert the hexadecimal number A7 into 8-bit binary.', ['10100111', '10100110', '01110101', '10101111'], 'A',
    ['', 'Check the last nibble: 7 is 0111.', 'You reversed the nibbles: A (1010) comes first.', 'Check the second nibble: 7 is 0111 not 1111.'], ['B4']);
  S('1.2.4c', 'h2b', 4, 'Convert', 1, 'Convert the binary number 10110110 into hexadecimal.',
    'B6 (1011 = B, 0110 = 6).',
    '=b6',
    '1 | B6\n1 | b6\n0 | 182\n0 | B5', ['B4']);
  M('1.2.4c', 'h2b', 4, 'Why do programmers often use hexadecimal instead of binary?', ['Computers process hex faster than binary', 'Hex is shorter and easier for humans to read, with fewer mistakes', 'Hex uses less storage space', 'Hex can store negative numbers but binary cannot'], 'B',
    ['Computers still process binary – hex is only for humans.', '', 'Hex is stored as binary, so it takes the same space.', 'This is not why hex is used.'], ['B4']);

  // 1.2.4d Binary shifts
  M('1.2.4d', 'left', 2, 'What is the effect of a 1-place LEFT shift on a binary number?', ['It halves the number', 'It doubles the number', 'It adds 1', 'It reverses the bits'], 'B',
    ['A RIGHT shift halves the number.', '', 'A shift moves the bits; it does not add 1.', 'Shifting does not reverse the order.'], ['D2']);
  S('1.2.4d', 'left', 3, 'Shift', 1, 'Carry out a 2-place left shift on the binary number 00010110.',
    '01011000.',
    '=01011000|0101 1000',
    '1 | 01011000\n1 | 0101 1000\n0 | 00000101\n0 | 00101100', ['D2']);
  M('1.2.4d', 'right', 3, 'What is the result of a 1-place RIGHT shift on 00010110?', ['00001011', '00101100', '00010111', '00000101'], 'A',
    ['', '00101100 is a LEFT shift.', 'A shift does not add 1.', 'That is a 2-place right shift.'], ['D2']);
  M('1.2.4d', 'right', 4, 'A 3-place right shift is applied to a binary number. By what has the number been divided?', ['3', '6', '8', '9'], 'C',
    ['Each place halves the number: ÷2 three times.', 'Each place halves: 2 × 2 × 2 = 8, not 6.', '', '9 would be 3 × 3 – shifts use powers of 2.'], ['D2']);
  S('1.2.4d', 'effect', 5, 'Explain', 2, 'The binary number 00000111 (denary 7) has a 2-place right shift applied. Explain why the result is not exactly 7 ÷ 4.',
    'The two right-most 1 bits are shifted out / lost (1) so the result is 00000001 (1) not 1.75 – the fraction is lost / it rounds down (1). Max 2.',
    '=lost|lose|loses|shifted out|fall off|falls off|removed|dropped|discarded\n=00000001|1.75|rounded|rounds down|fraction|remainder|decimal|precision',
    '2 | The bits on the right are lost so the answer is 00000001 not 1.75\n2 | Two 1s fall off the end so it rounds down\n1 | Some bits are lost\n0 | It multiplies by 4', ['D2', 'E1']);

  // 1.2.4e Characters
  M('1.2.4e', '', 1, 'What is a character set?', ['The fonts installed on a computer', 'A defined list of characters and the binary code that represents each one', 'A type of compression', 'The keys on a keyboard'], 'B',
    ['Fonts change how characters look, not their binary codes.', '', 'Compression makes files smaller.', 'A keyboard is hardware, not a character set.'], []);
  M('1.2.4e', '', 3, 'The ASCII code for "A" is 65. What is the ASCII code for "D"?', ['66', '67', '68', '69'], 'C',
    ['66 is "B".', '67 is "C".', '', '69 is "E".'], []);
  S('1.2.4e', '', 3, 'Explain', 2, 'Explain why Unicode is used instead of ASCII for many modern documents.',
    'Unicode uses more bits per character (1) so it can represent many more characters, e.g. other languages / emoji (1).',
    '=more bits|16 bits|32 bits|bigger|larger|more bits per character\n=more characters|other languages|languages|emoji|symbols|alphabets|thousands',
    '2 | Unicode uses more bits per character so it can represent other languages\n2 | It has more bits so it can store emoji and symbols\n1 | It can store other languages\n0 | ASCII is newer than Unicode', ['E1']);
  M('1.2.4e', '', 4, 'How many different characters can 7-bit ASCII represent?', ['7', '64', '128', '256'], 'C',
    ['7 is the number of bits, not characters.', '64 would be 6 bits.', '', '256 is 8-bit (extended) ASCII.'], ['B2']);

  // 1.2.4f Images
  M('1.2.4f', '', 1, 'What is a pixel?', ['A single dot of colour in an image', 'The number of colours in an image', 'A type of compression', 'Information about the image'], 'A',
    ['', 'That is related to colour depth.', 'Compression makes files smaller.', 'Information about the image is metadata.'], ['D3']);
  M('1.2.4f', '', 2, 'What is colour depth?', ['The number of pixels in an image', 'The number of bits used to store the colour of each pixel', 'The width of an image', 'How bright an image is'], 'B',
    ['The number of pixels is the resolution.', '', 'Width is part of the resolution.', 'Brightness is not colour depth.'], ['D3']);
  M('1.2.4f', '', 3, 'An image uses a colour depth of 4 bits. How many different colours can it show?', ['4', '8', '16', '256'], 'C',
    ['4 is the number of bits; colours = 2⁴.', '8 would be 3 bits.', '', '256 would be 8 bits.'], ['D3', 'B2']);
  S('1.2.4f', '', 3, 'State', 1, 'State what is meant by metadata in an image file.',
    'Data about the image / extra information, e.g. width, height, colour depth, date taken.',
    '=data about|information about|details about|width|height|resolution|colour depth|date|location|camera',
    '1 | Data about the image such as its width and height\n1 | Information about the file like the date it was taken\n0 | The colours of the pixels\n0 | Compressed data', ['D3']);
  S('1.2.4f', '', 4, 'Explain', 2, 'Explain the effect of increasing the colour depth of an image.',
    'More colours can be shown / better quality, more realistic (1). The file size increases (1).',
    '=more colours|more colors|better quality|higher quality|better|more realistic|more detail|more shades\n=file size|bigger file|larger file|bigger|larger|more storage|more space',
    '2 | More colours can be shown but the file size increases\n2 | The quality is better and the file is bigger\n1 | More colours can be shown\n0 | More pixels are added', ['D3']);

  // 1.2.4g Sound
  M('1.2.4g', '', 1, 'What is the sample rate of a sound file?', ['The number of bits per sample', 'The number of samples taken each second', 'The length of the sound', 'How loud the sound is'], 'B',
    ['That is the bit depth.', '', 'That is the duration.', 'Loudness is not the sample rate.'], ['D4']);
  M('1.2.4g', '', 2, 'Which change makes a sound recording more accurate?', ['Lowering the sample rate', 'Increasing the bit depth', 'Making the recording shorter', 'Using lossy compression'], 'B',
    ['A lower sample rate is LESS accurate.', '', 'Duration does not change accuracy.', 'Lossy compression removes data.'], ['D4']);
  S('1.2.4g', '', 4, 'Explain', 2, 'Explain how increasing the sample rate affects a sound file.',
    'The sound is closer to the original / better quality (1). The file size increases (1).',
    '=better quality|higher quality|more accurate|closer to the original|more realistic|more detail|sounds better\n=file size|bigger file|larger file|bigger|larger|more storage|more space',
    '2 | It is more accurate but the file size increases\n2 | Better quality sound and a larger file\n1 | The file is bigger\n0 | It makes the sound louder', ['D4']);
  S('1.2.4g', '', 3, 'State', 1, 'State what is meant by the bit depth of a sound file.',
    'The number of bits used to store each sample.',
    '=bits per sample|bits for each sample|bits used for each sample|bits used to store each sample|bits in each sample|number of bits',
    '1 | The number of bits used to store each sample\n1 | How many bits per sample\n0 | The number of samples per second\n0 | How long the sound is', ['D4']);

  // 1.2.5a Need for compression
  M('1.2.5a', '', 1, 'Why are files compressed?', ['To make them more secure', 'To reduce their file size', 'To improve their quality', 'To convert them to binary'], 'B',
    ['Encryption makes files secure.', '', 'Compression never improves quality.', 'Files are already stored in binary.'], []);
  S('1.2.5a', '', 2, 'Give', 2, 'Give two reasons why files are compressed before being sent over the internet.',
    'Any two: smaller files take up less storage (1); they transfer / download / upload faster (1); use less bandwidth / data allowance (1); meet email attachment limits (1).',
    '=faster|quicker|less time|speed\n=less storage|less space|storage|bandwidth|data allowance|less data|limit|limits|attachment\nmax 2',
    '2 | They download faster and use less bandwidth\n2 | Quicker to send and take up less storage space\n1 | They are quicker to send\n0 | They are more secure', []);

  // 1.2.5b Lossy
  M('1.2.5b', '', 2, 'Which statement about lossy compression is correct?', ['The original file can be restored exactly', 'Some data is permanently removed', 'It is used for program files', 'It makes files bigger'], 'B',
    ['That describes lossless compression.', '', 'Program files must use lossless – losing data would break them.', 'All compression aims to make files smaller.'], ['D5']);
  M('1.2.5b', '', 3, 'Which type of file is most suitable for lossy compression?', ['A program (.exe)', 'A music track for streaming', 'A spreadsheet of exam results', 'A text document'], 'B',
    ['Losing data would stop a program working.', '', 'Changing data in a spreadsheet would give wrong results.', 'Text must not lose any characters.'], ['D5']);
  S('1.2.5b', '', 4, 'Explain', 2, 'Explain why lossy compression is often used for images on websites.',
    'It gives a much smaller file size (1) so pages load faster, and the small loss in quality is not noticeable (1).',
    '=smaller|reduces|reduce|less space|much smaller|small\n=faster|quicker|load|loads|not noticeable|unnoticeable|cannot tell|hardly notice|bandwidth',
    '2 | It makes the files much smaller so the web page loads faster\n2 | The file is smaller and the loss in quality is hardly noticeable\n1 | The file is smaller\n0 | The image can be restored exactly', ['D5', 'E1']);

  // 1.2.5c Lossless
  M('1.2.5c', '', 2, 'Which is a feature of lossless compression?', ['Data is permanently removed', 'The original file can be rebuilt exactly', 'It always makes files smaller than lossy compression', 'It is only used for images'], 'B',
    ['That is lossy compression.', '', 'Lossless files are usually LARGER than lossy ones.', 'Lossless is used for text, programs and more.'], ['D5']);
  S('1.2.5c', '', 3, 'Explain', 2, 'Explain why a program file must be compressed using lossless compression.',
    'No data can be lost / the original must be restored exactly (1) otherwise the program would not run / would contain errors (1).',
    '=exactly|original|restored|rebuilt|all the data|every bit|identical|no data lost|nothing\n=not run|not work|stop working|break|broken|errors|corrupt|crash',
    '2 | The original must be restored exactly or the program will not run\n2 | Nothing must be lost otherwise the program could crash\n1 | It must be restored exactly\n0 | Lossless makes the file smaller', ['D5', 'E1']);
  M('1.2.5c', '', 4, 'A file of 100 KB is compressed with lossless compression to 60 KB. What happens when it is decompressed?', ['It is 60 KB with lower quality', 'It is exactly the same as the 100 KB original', 'It is about 90 KB', 'It cannot be decompressed'], 'B',
    ['Lossless files are restored to the original – no quality is lost.', '', 'Lossless restores the file exactly, not approximately.', 'Compressed files can be decompressed.'], ['D5']);
})(GCSE_BANK_X.M, GCSE_BANK_X.S);
