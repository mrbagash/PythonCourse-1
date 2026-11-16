// Extended bank – fill-in tables: trace tables, truth tables, sort / search steps, test data. Original questions.
//   T(topic, skill, level, marks, question, head, rows, opts)
//   rows: cells; a cell starting with "?" is a box for the pupil – the rest of it is the answer
//         ("?a|b" accepts a or b). Other cells are given. Marks = share of boxes right (rounded down).
(function (T) {
  // ── 2.1.2e Trace tables ──
  T('2.1.2e', 'loop', 3, 3, 'Complete the trace table for this algorithm. Each row shows the values at the END of one pass of the loop; the last row is the output.\nx = 1\ntotal = 0\nwhile x < 5\n    total = total + x\n    x = x + 2\nendwhile\nprint(total)',
    ['x', 'total', 'output'], [['1', '0', ''], ['?3', '?1', ''], ['?5', '?4', ''], ['', '', '?4']], { codes: ['G2', 'I2'] });
  T('2.1.2e', 'loop', 2, 3, 'Complete the trace table. Each row shows n at the end of one pass of the loop.\nn = 3\nfor i = 1 to 4\n    n = n * 2\nnext i\nprint(n)',
    ['i', 'n', 'output'], [['', '3', ''], ['1', '?6', ''], ['2', '?12', ''], ['3', '?24', ''], ['4', '?48', ''], ['', '', '?48']], { codes: ['G2', 'I1'] });
  T('2.1.2e', 'loop', 3, 3, 'Complete the trace table. Fill in the value of count at the end of each pass.\ncount = 0\nfor i = 1 to 6\n    if i MOD 2 == 0 then\n        count = count + 1\n    endif\nnext i\nprint(count)',
    ['i', 'count', 'output'], [['', '0', ''], ['1', '?0', ''], ['2', '?1', ''], ['3', '?1', ''], ['4', '?2', ''], ['5', '?2', ''], ['6', '?3', ''], ['', '', '?3']], { codes: ['G2', 'Q4'] });
  T('2.1.2e', 'loop', 3, 3, 'Complete the trace table for this do … until loop. Each row shows x at the end of one pass.\nx = 10\ndo\n    x = x - 3\nuntil x < 0\nprint(x)',
    ['x', 'output'], [['10', ''], ['?7', ''], ['?4', ''], ['?1', ''], ['?-2', ''], ['', '?-2']], { codes: ['G2', 'I4'] });
  T('2.1.2e', 'loop', 4, 3, 'Complete the trace table. Each row shows result at the end of one pass.\nword = "LOOP"\nresult = ""\nfor i = 0 to word.length - 1\n    result = word.substring(i, 1) + result\nnext i\nprint(result)',
    ['i', 'result', 'output'], [['0', '?L', ''], ['1', '?OL', ''], ['2', '?OOL', ''], ['3', '?POOL', ''], ['', '', '?POOL']], { codes: ['G2', 'Q8'] });
  T('2.1.2e', 'loop', 4, 3, 'Complete the trace table. Each row shows a at the end of one pass.\na = 20\nb = 6\nwhile a >= b\n    a = a - b\nendwhile\nprint(a)',
    ['a', 'b', 'output'], [['20', '6', ''], ['?14', '6', ''], ['?8', '6', ''], ['?2', '6', ''], ['', '', '?2']], { codes: ['G2', 'I2'] });
  T('2.1.2e', 'loop', 5, 4, 'Complete the trace table for these nested loops. Each row shows total after the inner loop line runs.\ntotal = 0\nfor i = 1 to 2\n    for j = 1 to 3\n        total = total + j\n    next j\nnext i\nprint(total)',
    ['i', 'j', 'total', 'output'], [['', '', '0', ''], ['1', '1', '?1', ''], ['1', '2', '?3', ''], ['1', '3', '?6', ''], ['2', '1', '?7', ''], ['2', '2', '?9', ''], ['2', '3', '?12', ''], ['', '', '', '?12']], { codes: ['G2', 'I5'] });
  T('2.1.2e', 'loop', 4, 3, 'Complete the trace table. Each row shows big at the end of one pass.\nnums = [4, 9, 2, 7]\nbig = nums[0]\nfor i = 1 to 3\n    if nums[i] > big then\n        big = nums[i]\n    endif\nnext i\nprint(big)',
    ['i', 'big', 'output'], [['', '4', ''], ['1', '?9', ''], ['2', '?9', ''], ['3', '?9', ''], ['', '', '?9']], { codes: ['G2', 'Q5'] });
  T('2.1.2e', 'loop', 5, 4, 'Complete the trace table. Each row shows n and total at the end of one pass.\nn = 472\ntotal = 0\nwhile n > 0\n    total = total + n MOD 10\n    n = n DIV 10\nendwhile\nprint(total)',
    ['n', 'total', 'output'], [['472', '0', ''], ['?47', '?2', ''], ['?4', '?9', ''], ['?0', '?13', ''], ['', '', '?13']], { codes: ['G2', 'Q4'] });
  T('2.1.2e', 'loop', 4, 4, 'Complete the trace table. Each row shows i and found at the end of one pass.\nitems = ["cat", "dog", "emu", "fox"]\ntarget = "emu"\ni = 0\nfound = false\nwhile found == false AND i < 4\n    if items[i] == target then\n        found = true\n    else\n        i = i + 1\n    endif\nendwhile\nprint(i)',
    ['i', 'found', 'output'], [['0', 'false', ''], ['?1', '?false', ''], ['?2', '?false', ''], ['?2', '?true', ''], ['', '', '?2']], { codes: ['G2', 'A1'] });
  T('2.1.2e', 'selection', 3, 3, 'Complete the table to show what this code outputs for each value of score.\nif score >= 70 then\n    print("A")\nelseif score >= 50 then\n    print("B")\nelse\n    print("C")\nendif',
    ['score', 'output'], [['85', '?A'], ['70', '?A'], ['69', '?B'], ['50', '?B'], ['12', '?C']], { codes: ['Q1', 'Q3'] });
  T('2.1.2e', 'output', 3, 2, 'Complete the table to show what is output on each pass of the loop.\nfor i = 1 to 10 step 3\n    print(i)\nnext i',
    ['Pass', 'Output'], [['1', '?1'], ['2', '?4'], ['3', '?7'], ['4', '?10']], { codes: ['I1'] });
  T('2.1.2e', 'loop', 4, 4, 'Complete the trace table for each pass of the loop.\ns = "banana"\ncount = 0\nfor i = 0 to s.length - 1\n    if s.substring(i, 1) == "a" then\n        count = count + 1\n    endif\nnext i\nprint(count)',
    ['i', 'character', 'count'], [['0', '?b', '?0'], ['1', '?a', '?1'], ['2', '?n', '?1'], ['3', '?a', '?2'], ['4', '?n', '?2'], ['5', '?a', '?3']], { codes: ['G2', 'Q8'] });
  T('2.1.2e', 'output', 5, 3, 'Complete the table to show the value stored in each variable and the output.\nfunction f(x)\n    if x > 10 then\n        return x - 10\n    else\n        return x * 2\n    endif\nendfunction\na = f(3)\nb = f(a)\nc = f(b)\nprint(c)',
    ['Variable', 'Value'], [['a', '?6'], ['b', '?12'], ['c', '?2'], ['output', '?2']], { codes: ['Q6'] });
  T('2.1.2e', 'loop', 4, 4, 'The user enters 4, then 6, then -1. Complete the trace table: each row shows the values at the end of one pass (n is the next number entered).\ntotal = 0\ncount = 0\nn = int(input())\nwhile n >= 0\n    total = total + n\n    count = count + 1\n    n = int(input())\nendwhile\nprint(total / count)',
    ['n', 'total', 'count', 'output'], [['4', '0', '0', ''], ['?6', '?4', '?1', ''], ['?-1', '?10', '?2', ''], ['', '', '', '?5']], { codes: ['G2', 'I2'] });

  // ── 2.4.1 Truth tables ──
  T('2.4.1b', 'two', 1, 2, 'Complete the truth table for P = A AND B.', ['A', 'B', 'P'], [['0', '0', '?0'], ['0', '1', '?0'], ['1', '0', '?0'], ['1', '1', '?1']], { codes: ['B1'] });
  T('2.4.1b', 'two', 1, 2, 'Complete the truth table for P = A OR B.', ['A', 'B', 'P'], [['0', '0', '?0'], ['0', '1', '?1'], ['1', '0', '?1'], ['1', '1', '?1']], { codes: ['B1'] });
  T('2.4.1b', 'two', 1, 1, 'Complete the truth table for P = NOT A.', ['A', 'P'], [['0', '?1'], ['1', '?0']], { codes: ['B1'] });
  T('2.4.1c', '', 3, 2, 'Complete the truth table for P = NOT (A AND B).', ['A', 'B', 'P'], [['0', '0', '?1'], ['0', '1', '?1'], ['1', '0', '?1'], ['1', '1', '?0']], { codes: ['B1'] });
  T('2.4.1c', '', 3, 2, 'Complete the truth table for P = A AND NOT B.', ['A', 'B', 'P'], [['0', '0', '?0'], ['0', '1', '?0'], ['1', '0', '?1'], ['1', '1', '?0']], { codes: ['B1'] });
  T('2.4.1c', '', 3, 2, 'Complete the truth table for P = NOT A OR B.', ['A', 'B', 'P'], [['0', '0', '?1'], ['0', '1', '?1'], ['1', '0', '?0'], ['1', '1', '?1']], { codes: ['B1'] });
  T('2.4.1c', '', 3, 3, 'Complete the truth table. Work out NOT A first, then P = NOT A AND B.', ['A', 'B', 'NOT A', 'P'], [['0', '0', '?1', '?0'], ['0', '1', '?1', '?1'], ['1', '0', '?0', '?0'], ['1', '1', '?0', '?0']], { codes: ['B1'] });
  T('2.4.1b', 'three', 4, 4, 'Complete the truth table for P = (A OR B) AND C.', ['A', 'B', 'C', 'P'],
    [['0', '0', '0', '?0'], ['0', '0', '1', '?0'], ['0', '1', '0', '?0'], ['0', '1', '1', '?1'], ['1', '0', '0', '?0'], ['1', '0', '1', '?1'], ['1', '1', '0', '?0'], ['1', '1', '1', '?1']], { codes: ['B1'] });
  T('2.4.1b', 'three', 5, 4, 'Complete the truth table for P = (A AND B) OR (NOT C).', ['A', 'B', 'C', 'P'],
    [['0', '0', '0', '?1'], ['0', '0', '1', '?0'], ['0', '1', '0', '?1'], ['0', '1', '1', '?0'], ['1', '0', '0', '?1'], ['1', '0', '1', '?0'], ['1', '1', '0', '?1'], ['1', '1', '1', '?1']], { codes: ['B1'] });
  T('2.4.1d', '', 4, 4, 'An alarm Z sounds when the door is open (D = 1) AND the system is armed (S = 1), OR when the panic button is pressed (P = 1). So Z = (D AND S) OR P. Complete the truth table.', ['D', 'S', 'P', 'Z'],
    [['0', '0', '0', '?0'], ['0', '0', '1', '?1'], ['0', '1', '0', '?0'], ['0', '1', '1', '?1'], ['1', '0', '0', '?0'], ['1', '0', '1', '?1'], ['1', '1', '0', '?1'], ['1', '1', '1', '?1']], { codes: ['B1'] });

  // ── 2.1.3 Sorting and searching steps ──
  T('2.1.3c', '', 4, 3, 'A bubble sort puts [6, 2, 9, 4, 1] into ascending order. Write the list after each of the first three passes (numbers separated by spaces).', ['After pass', 'List'],
    [['1', '?2 6 4 1 9'], ['2', '?2 4 1 6 9'], ['3', '?2 1 4 6 9']], { codes: ['G1'] });
  T('2.1.3e', '', 4, 3, 'An insertion sort puts [5, 3, 8, 1] into ascending order. Write the list after each item has been inserted into the sorted part.', ['Step', 'List'],
    [['After inserting the 2nd item', '?3 5 8 1'], ['After inserting the 3rd item', '?3 5 8 1'], ['After inserting the 4th item', '?1 3 5 8']], { codes: ['G1'] });
  T('2.1.3d', '', 4, 3, 'A merge sort puts [7, 3, 9, 1] into ascending order. Write the lists at each stage, separating lists with / (e.g. 1 2 / 3 4).', ['Stage', 'Lists'],
    [['Split into single items', '?7 / 3 / 9 / 1'], ['After the first merge', '?3 7 / 1 9'], ['After the final merge', '?1 3 7 9']], { codes: ['G1'] });
  T('2.1.3b', '', 4, 3, 'A binary search looks for 21 in [3, 8, 12, 15, 21, 27, 30]. Positions start at 0 and the middle is (low + high) DIV 2. Write the middle item checked at each step.', ['Step', 'Middle item checked'],
    [['1', '?15'], ['2', '?27'], ['3', '?21']], { codes: ['A1'] });
  T('2.1.3b', '', 5, 3, 'A binary search looks for 9 in [2, 5, 9, 14, 20, 25, 31, 40, 48]. Positions start at 0 and the middle is (low + high) DIV 2. Write the middle item checked at each step.', ['Step', 'Middle item checked'],
    [['1', '?20'], ['2', '?5'], ['3', '?9']], { codes: ['A1'] });

  // ── 2.3.2d Test data ──
  T('2.3.2d', 'boundary', 3, 3, 'A program accepts whole-number ages from 11 to 16 inclusive. Complete the table with the type of each test: normal, boundary, invalid or erroneous.', ['Test data', 'Type'],
    [['14', '?normal'], ['11', '?boundary|extreme'], ['16', '?boundary|extreme'], ['20', '?invalid'], ['"twelve"', '?erroneous']], { codes: ['T2'] });
  T('2.3.2d', 'invalid', 4, 4, 'A password must be 8 to 12 characters long. Complete the test plan.', ['Test data', 'Type of test', 'Expected outcome'],
    [['"sunshine1" (9 characters)', '?normal', '?accepted|accept|valid|allowed'], ['"abcdefgh" (8 characters)', '?boundary|extreme', '?accepted|accept|valid|allowed'], ['"abc" (3 characters)', '?invalid', '?rejected|reject|error|invalid|not accepted|refused']], { codes: ['T2'] });
})(GCSE_BANK_X.T);
