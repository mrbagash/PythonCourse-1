// Extended bank – write / complete / fix the code (Paper 2, Section B style). Original questions.
// Marked by RUNNING the pupil's code (Python or ERL) against the tests: inputs → expected output.
//   C(topic, skill, level, marks, question, tests, model, opts)
//   tests: [[inputs], expected output]   (several output lines separated by \n)
//   opts:  { starter: code to complete / fix, codes: [...], command: 'Write' | 'Complete' | 'Refine' }
(function (C) {
  // ── 2.2.1a Input, output, assignment ──
  C('2.2.1a', 'io', 1, 2, 'Write a program that asks the user for their name and then outputs "Hello" followed by their name.\nExample: input Sam → output Hello Sam',
    [[['Sam'], 'Hello Sam'], [['Priya'], 'Hello Priya']],
    'name = input("Enter your name")\nprint("Hello " + name)');
  C('2.2.1a', 'io', 2, 3, 'Write a program that asks for two whole numbers and outputs their total.\nExample: inputs 3 and 4 → output 7',
    [[['3', '4'], '7'], [['10', '-2'], '8'], [['0', '0'], '0']],
    'a = int(input("First number"))\nb = int(input("Second number"))\nprint(a + b)', { codes: ['Q9'] });
  C('2.2.1a', 'assign', 3, 3, 'Write a program that asks for the length and width of a rectangle (whole numbers) and outputs its area and then its perimeter, each on its own line.\nExample: 5 and 3 → 15 then 16',
    [[['5', '3'], '15\n16'], [['10', '2'], '20\n24'], [['1', '1'], '1\n4']],
    'l = int(input("Length"))\nw = int(input("Width"))\nprint(l * w)\nprint(2 * (l + w))', { codes: ['Q9'] });
  C('2.2.2b', '', 3, 3, 'A program asks for a price in pounds (it may have pence, e.g. 2.50) and a quantity (a whole number). Write the program so it outputs the total cost.\nExample: 2.5 and 4 → 10.0',
    [[['2.5', '4'], '10'], [['1.25', '2'], '2.5'], [['3', '3'], '9']],
    'price = float(input("Price"))\nqty = int(input("Quantity"))\nprint(price * qty)', { codes: ['Q9', 'A2'] });

  // ── 2.2.1c Selection ──
  C('2.2.1c', 'if', 2, 3, 'Write a program that asks for an age. If the age is 17 or over it outputs "Can drive", otherwise it outputs "Too young".',
    [[['17'], 'Can drive'], [['16'], 'Too young'], [['40'], 'Can drive'], [['5'], 'Too young']],
    'age = int(input("Age"))\nif age >= 17 then\n    print("Can drive")\nelse\n    print("Too young")\nendif', { codes: ['Q3'] });
  C('2.2.1c', 'elif', 3, 4, 'Write a program that asks for a test mark (0–100) and outputs the grade:\n70 or more → "Distinction", 50 to 69 → "Merit", 40 to 49 → "Pass", below 40 → "Fail".',
    [[['85'], 'Distinction'], [['70'], 'Distinction'], [['69'], 'Merit'], [['50'], 'Merit'], [['40'], 'Pass'], [['39'], 'Fail']],
    'mark = int(input("Mark"))\nif mark >= 70 then\n    print("Distinction")\nelseif mark >= 50 then\n    print("Merit")\nelseif mark >= 40 then\n    print("Pass")\nelse\n    print("Fail")\nendif', { codes: ['Q1', 'Q3'] });
  C('2.2.1c', 'elif', 3, 3, 'Write a program that asks for a whole number and outputs "Positive", "Negative" or "Zero".',
    [[['5'], 'Positive'], [['-3'], 'Negative'], [['0'], 'Zero']],
    'n = int(input("Number"))\nif n > 0 then\n    print("Positive")\nelseif n < 0 then\n    print("Negative")\nelse\n    print("Zero")\nendif', { codes: ['Q1'] });
  C('2.2.1e', 'divmod', 3, 3, 'Write a program that asks for a whole number and outputs "Even" or "Odd". You must use MOD (or % in Python).',
    [[['4'], 'Even'], [['7'], 'Odd'], [['0'], 'Even'], [['-3'], 'Odd']],
    'n = int(input("Number"))\nif n MOD 2 == 0 then\n    print("Even")\nelse\n    print("Odd")\nendif', { codes: ['Q4'] });
  C('2.2.1f', 'boolean', 4, 4, 'A cinema ticket costs £5 for children under 12 or adults aged 65 and over. Everyone else pays £8. Write a program that asks for an age and outputs the price (just the number).',
    [[['8'], '5'], [['11'], '5'], [['12'], '8'], [['64'], '8'], [['65'], '5'], [['30'], '8']],
    'age = int(input("Age"))\nif age < 12 OR age >= 65 then\n    print(5)\nelse\n    print(8)\nendif', { codes: ['Q3'] });
  C('2.2.1f', 'boolean', 4, 4, 'A login is accepted only if the username is "admin" AND the password is "Pa55". Write a program that asks for a username then a password and outputs "Access granted" or "Access denied".',
    [[['admin', 'Pa55'], 'Access granted'], [['admin', 'pass'], 'Access denied'], [['bob', 'Pa55'], 'Access denied']],
    'user = input("Username")\npw = input("Password")\nif user == "admin" AND pw == "Pa55" then\n    print("Access granted")\nelse\n    print("Access denied")\nendif', { codes: ['Q2'] });
  C('2.2.1c', 'switch', 4, 4, 'Write a program that asks for a day of the week (e.g. "Saturday") and outputs "Weekend" for Saturday or Sunday and "Weekday" for any other day. You may use if or switch/case.',
    [[['Saturday'], 'Weekend'], [['Sunday'], 'Weekend'], [['Monday'], 'Weekday'], [['Friday'], 'Weekday']],
    'day = input("Day")\nswitch day:\n    case "Saturday":\n        print("Weekend")\n    case "Sunday":\n        print("Weekend")\n    default:\n        print("Weekday")\nendswitch');

  // ── 2.2.1d Iteration – for (count-controlled) ──
  C('2.2.1d', 'for', 2, 3, 'Write a program that uses a FOR loop to output the numbers 1 to 10, one per line.',
    [[[], '1\n2\n3\n4\n5\n6\n7\n8\n9\n10']],
    'for i = 1 to 10\n    print(i)\nnext i', { codes: ['I1'], exact: true });
  C('2.2.1d', 'for', 3, 3, 'Write a program that asks for a whole number n and outputs the n times table from 1 × n up to 12 × n, one answer per line.\nExample: 3 → 3, 6, 9 … 36',
    [[['3'], '3\n6\n9\n12\n15\n18\n21\n24\n27\n30\n33\n36'], [['7'], '7\n14\n21\n28\n35\n42\n49\n56\n63\n70\n77\n84']],
    'n = int(input("Number"))\nfor i = 1 to 12\n    print(i * n)\nnext i', { codes: ['I1'] });
  C('2.2.1d', 'for', 3, 4, 'Write a program that asks how many numbers will be entered, then asks for each number in turn and finally outputs their total.\nExample: 3, then 4, 5, 6 → 15',
    [[['3', '4', '5', '6'], '15'], [['1', '9'], '9'], [['4', '1', '1', '1', '1'], '4']],
    'count = int(input("How many?"))\ntotal = 0\nfor i = 1 to count\n    total = total + int(input("Number"))\nnext i\nprint(total)', { codes: ['I1', 'Q9'] });
  C('2.2.1d', 'for', 4, 4, 'Write a program that asks for a whole number n and outputs the total of all the whole numbers from 1 to n.\nExample: 4 → 10 (1 + 2 + 3 + 4)',
    [[['4'], '10'], [['1'], '1'], [['10'], '55'], [['100'], '5050']],
    'n = int(input("n"))\ntotal = 0\nfor i = 1 to n\n    total = total + i\nnext i\nprint(total)', { codes: ['I1'] });
  C('2.2.1d', 'for', 4, 3, 'Write a program that outputs the even numbers from 2 to 20, one per line.',
    [[[], '2\n4\n6\n8\n10\n12\n14\n16\n18\n20']],
    'for i = 2 to 20 step 2\n    print(i)\nnext i', { codes: ['I1'], exact: true });
  C('2.2.1d', 'for', 4, 3, 'Write a program that counts down from 10 to 1, one number per line, and then outputs "Lift off".',
    [[[], '10\n9\n8\n7\n6\n5\n4\n3\n2\n1\nLift off']],
    'for i = 10 to 1 step -1\n    print(i)\nnext i\nprint("Lift off")', { codes: ['I1'], exact: true });

  // ── while / do-until (condition-controlled) ──
  C('2.2.1d', 'while', 3, 4, 'Write a program that keeps asking the user to enter a password until they enter "letmein". It then outputs "Welcome".',
    [[['letmein'], 'Welcome'], [['abc', 'pass', 'letmein'], 'Welcome']],
    'pw = input("Password")\nwhile pw != "letmein"\n    pw = input("Password")\nendwhile\nprint("Welcome")', { codes: ['I2', 'I3'] });
  C('2.2.1d', 'while', 4, 4, 'Write a program that keeps asking for whole numbers and adds them up. When the user enters 0 it stops and outputs the total.\nExample: 5, 3, 0 → 8',
    [[['5', '3', '0'], '8'], [['0'], '0'], [['10', '-4', '1', '0'], '7']],
    'total = 0\nn = int(input("Number"))\nwhile n != 0\n    total = total + n\n    n = int(input("Number"))\nendwhile\nprint(total)', { codes: ['I2', 'Q9'] });
  C('2.2.1d', 'while', 4, 4, 'A number must be between 1 and 10. Write a program that asks for a number and keeps asking again while it is outside this range. When a valid number is entered, output "Thank you".',
    [[['5'], 'Thank you'], [['0', '11', '10'], 'Thank you'], [['-3', '1'], 'Thank you']],
    'n = int(input("1 to 10"))\nwhile n < 1 OR n > 10\n    n = int(input("1 to 10"))\nendwhile\nprint("Thank you")', { codes: ['I2', 'Q3'] });
  C('2.2.1d', 'dountil', 4, 4, 'Write a program using a do … until loop (or an equivalent loop in Python) that asks for numbers and stops when a negative number is entered. It then outputs how many numbers were entered BEFORE the negative one.\nExample: 4, 7, 2, -1 → 3',
    [[['4', '7', '2', '-1'], '3'], [['-5'], '0'], [['0', '-1'], '1']],
    'count = -1\ndo\n    n = int(input("Number"))\n    count = count + 1\nuntil n < 0\nprint(count)', { codes: ['I4'] });
  C('2.2.1d', 'while', 5, 5, 'Write a guessing game. The secret number is 7. The program asks for guesses until the user guesses 7. After each wrong guess it outputs "Too high" or "Too low". When correct it outputs "Correct in" followed by the number of guesses.\nExample: 3, 9, 7 → Too low, Too high, Correct in 3',
    [[['3', '9', '7'], 'Too low\nToo high\nCorrect in 3'], [['7'], 'Correct in 1'], [['10', '8', '1', '7'], 'Too high\nToo high\nToo low\nCorrect in 4']],
    'secret = 7\nguesses = 1\ng = int(input("Guess"))\nwhile g != secret\n    if g > secret then\n        print("Too high")\n    else\n        print("Too low")\n    endif\n    guesses = guesses + 1\n    g = int(input("Guess"))\nendwhile\nprint("Correct in " + str(guesses))', { codes: ['I2', 'Q9'] });
  C('2.2.1d', 'choose', 5, 5, 'Write a program that asks for 5 test marks and outputs the highest mark and then the average (total ÷ 5), each on its own line.\nExample: 4, 9, 6, 1, 5 → 9 then 5',
    [[['4', '9', '6', '1', '5'], '9\n5'], [['10', '10', '10', '10', '10'], '10\n10'], [['0', '2', '0', '3', '0'], '3\n1']],
    'highest = -1\ntotal = 0\nfor i = 1 to 5\n    m = int(input("Mark"))\n    total = total + m\n    if m > highest then\n        highest = m\n    endif\nnext i\nprint(highest)\nprint(total / 5)', { codes: ['I1'] });
  C('2.2.1d', 'nested', 5, 4, 'Write a program that uses nested loops to output a 3 × 3 grid of stars – three lines, each containing ***.',
    [[[], '***\n***\n***']],
    'for row = 1 to 3\n    line = ""\n    for col = 1 to 3\n        line = line + "*"\n    next col\n    print(line)\nnext row', { codes: ['I5'], exact: true });

  // ── 2.2.3a Strings ──
  C('2.2.3a', 'length', 2, 2, 'Write a program that asks for a word and outputs how many characters it has.',
    [[['computer'], '8'], [['hi'], '2'], [['a'], '1']],
    'word = input("Word")\nprint(word.length)', { codes: ['Q8'] });
  C('2.2.3a', 'substring', 3, 3, 'Write a program that asks for a first name and a surname and outputs a username made of the first 3 letters of the surname followed by the first letter of the first name.\nExample: Sam, Patel → PatS',
    [[['Sam', 'Patel'], 'PatS'], [['Ada', 'Lovelace'], 'LovA'], [['Li', 'Wong'], 'WonL']],
    'first = input("First name")\nsurname = input("Surname")\nprint(surname.substring(0, 3) + first.substring(0, 1))', { codes: ['Q8'], exact: true });
  C('2.2.3a', 'case', 3, 3, 'Write a program that asks for a word and outputs it in capital letters, and then outputs how many letters it has.\nExample: cat → CAT then 3',
    [[['cat'], 'CAT\n3'], [['Python'], 'PYTHON\n6']],
    'w = input("Word")\nprint(w.upper)\nprint(w.length)', { codes: ['Q8'] });
  C('2.2.3a', 'substring', 4, 4, 'Write a program that asks for a word and outputs it backwards.\nExample: code → edoc',
    [[['code'], 'edoc'], [['level'], 'level'], [['ab'], 'ba']],
    'w = input("Word")\nr = ""\nfor i = w.length - 1 to 0 step -1\n    r = r + w.substring(i, 1)\nnext i\nprint(r)', { codes: ['Q8', 'Q5'], exact: true });
  C('2.2.3a', 'substring', 5, 4, 'Write a program that asks for a sentence and outputs how many times the letter "e" appears in it (lower case only).\nExample: the bee needs → 5',
    [[['the bee needs'], '5'], [['xyz'], '0'], [['eeee'], '4']],
    's = input("Sentence")\ncount = 0\nfor i = 0 to s.length - 1\n    if s.substring(i, 1) == "e" then\n        count = count + 1\n    endif\nnext i\nprint(count)', { codes: ['Q8', 'Q5'] });
  C('2.2.3a', 'ascii', 5, 4, 'Write a program that asks for a single capital letter and outputs the letter that comes after it in the alphabet, using ASC and CHR (ord and chr in Python). Z should wrap round to A.\nExample: C → D, Z → A',
    [[['C'], 'D'], [['A'], 'B'], [['Z'], 'A']],
    'c = input("Letter")\nif c == "Z" then\n    print("A")\nelse\n    print(CHR(ASC(c) + 1))\nendif', { exact: true });

  // ── 2.2.3d Arrays ──
  C('2.2.3d', 'loop', 3, 4, 'An array holds the names ["Ali", "Bea", "Cal", "Dee"]. Write a program that asks for a name and outputs "Found" if it is in the array, otherwise "Not found".',
    [[['Cal'], 'Found'], [['Ali'], 'Found'], [['Dee'], 'Found'], [['Eve'], 'Not found']],
    'names = ["Ali", "Bea", "Cal", "Dee"]\ntarget = input("Name")\nfound = false\nfor i = 0 to names.length - 1\n    if names[i] == target then\n        found = true\n    endif\nnext i\nif found then\n    print("Found")\nelse\n    print("Not found")\nendif', { codes: ['Q5'] });
  C('2.2.3d', 'loop', 4, 4, 'Write a program that asks for 4 temperatures, stores them in an array, then outputs the lowest temperature.\nExample: 12, 9, 15, 11 → 9',
    [[['12', '9', '15', '11'], '9'], [['-2', '5', '-7', '0'], '-7'], [['3', '3', '3', '3'], '3']],
    'array temps[4]\nfor i = 0 to 3\n    temps[i] = int(input("Temperature"))\nnext i\nlowest = temps[0]\nfor i = 1 to 3\n    if temps[i] < lowest then\n        lowest = temps[i]\n    endif\nnext i\nprint(lowest)', { codes: ['Q5'] });
  C('2.2.3d', 'loop', 4, 3, 'scores = [12, 7, 19, 4, 10]. Write a program that outputs every score that is 10 or more, one per line.',
    [[[], '12\n19\n10']],
    'scores = [12, 7, 19, 4, 10]\nfor i = 0 to scores.length - 1\n    if scores[i] >= 10 then\n        print(scores[i])\n    endif\nnext i', { codes: ['Q5', 'Q3'], exact: true });
  C('2.2.3d', '2d', 5, 4, 'A 2D array marks has 3 rows (pupils) and 2 columns (tests):\nmarks = [[5, 7], [9, 2], [4, 4]]\nWrite a program that outputs each pupil\'s total, one per line.',
    [[[], '12\n11\n8']],
    'marks = [[5, 7], [9, 2], [4, 4]]\nfor p = 0 to 2\n    print(marks[p][0] + marks[p][1])\nnext p', { codes: ['Q5'], exact: true });

  // ── 2.2.3e Sub programs ──
  C('2.2.3e', 'func', 3, 3, 'Write a function called square that takes a number as a parameter and returns its square. Then use it to output the square of a number entered by the user.\nExample: 6 → 36',
    [[['6'], '36'], [['-3'], '9'], [['0'], '0']],
    'function square(n)\n    return n * n\nendfunction\nx = int(input("Number"))\nprint(square(x))', { codes: ['Q6'] });
  C('2.2.3e', 'func', 4, 4, 'Write a function isValid(age) that returns true if age is between 11 and 18 inclusive and false otherwise. The main program asks for an age and outputs "Valid" or "Invalid" using the function.',
    [[['11'], 'Valid'], [['18'], 'Valid'], [['10'], 'Invalid'], [['19'], 'Invalid'], [['15'], 'Valid']],
    'function isValid(age)\n    return age >= 11 AND age <= 18\nendfunction\na = int(input("Age"))\nif isValid(a) then\n    print("Valid")\nelse\n    print("Invalid")\nendif', { codes: ['Q6', 'Q3'] });
  C('2.2.3e', 'proc', 3, 3, 'Write a procedure called line that takes a number n and outputs a line of n dashes (-). Call it to output a line of 5 dashes and then a line of 3 dashes.',
    [[[], '-----\n---']],
    'procedure line(n)\n    s = ""\n    for i = 1 to n\n        s = s + "-"\n    next i\n    print(s)\nendprocedure\nline(5)\nline(3)', { codes: ['Q6'], exact: true });
  C('2.2.3e', 'params', 5, 5, 'Write a function vat(price, rate) that returns price + price × rate ÷ 100. The main program asks for a price and a VAT rate and outputs the result of the function.\nExample: 50 and 20 → 60',
    [[['50', '20'], '60'], [['10', '5'], '10.5'], [['80', '0'], '80']],
    'function vat(price, rate)\n    return price + price * rate / 100\nendfunction\np = float(input("Price"))\nr = float(input("Rate"))\nprint(vat(p, r))', { codes: ['Q6', 'Q9'] });

  // ── 2.3.1 Defensive design ──
  C('2.3.1c', '', 3, 4, 'Write a program that asks for a username. If it is between 5 and 12 characters long (inclusive) output "Accepted", otherwise output "Must be 5 to 12 characters".',
    [[['sammy'], 'Accepted'], [['abcdefghijkl'], 'Accepted'], [['sam'], 'Must be 5 to 12 characters'], [['abcdefghijklm'], 'Must be 5 to 12 characters']],
    'u = input("Username")\nif u.length >= 5 AND u.length <= 12 then\n    print("Accepted")\nelse\n    print("Must be 5 to 12 characters")\nendif', { codes: ['Q3', 'Q8'] });
  C('2.3.1b', '', 4, 5, 'The PIN is "1234". Write a program that gives the user up to 3 attempts to enter it. If they get it right output "Unlocked" (and stop asking). If all 3 attempts are wrong output "Locked".',
    [[['1234'], 'Unlocked'], [['1111', '1234'], 'Unlocked'], [['0', '1', '2'], 'Locked'], [['9', '8', '1234'], 'Unlocked']],
    'attempts = 0\nok = false\nwhile attempts < 3 AND NOT ok\n    pin = input("PIN")\n    attempts = attempts + 1\n    if pin == "1234" then\n        ok = true\n    endif\nendwhile\nif ok then\n    print("Unlocked")\nelse\n    print("Locked")\nendif', { codes: ['I2'] });

  // ── 2.1.3 Searching and sorting algorithms ──
  C('2.1.3a', '', 4, 5, 'Write a linear search. The array is [8, 3, 12, 5, 9]. The program asks for a number and outputs its index (position, starting at 0) or -1 if it is not in the array.\nExample: 12 → 2',
    [[['12'], '2'], [['8'], '0'], [['9'], '4'], [['7'], '-1']],
    'data = [8, 3, 12, 5, 9]\nt = int(input("Number"))\npos = -1\nfor i = 0 to data.length - 1\n    if data[i] == t AND pos == -1 then\n        pos = i\n    endif\nnext i\nprint(pos)', { codes: ['Q5', 'A1'] });
  C('2.1.3c', '', 5, 6, 'Write a bubble sort that sorts the array [5, 1, 4, 2, 8] into ascending order and then outputs the sorted values, one per line.',
    [[[], '1\n2\n4\n5\n8']],
    'a = [5, 1, 4, 2, 8]\nfor p = 1 to a.length - 1\n    for i = 0 to a.length - 2\n        if a[i] > a[i + 1] then\n            temp = a[i]\n            a[i] = a[i + 1]\n            a[i + 1] = temp\n        endif\n    next i\nnext p\nfor i = 0 to a.length - 1\n    print(a[i])\nnext i', { codes: ['G1'], exact: true });

  // ── Complete the code ──
  C('2.2.1d', 'for', 2, 2, 'Complete the program so it outputs the total of the numbers 1 to 5 (the answer is 15). Replace each ___.',
    [[[], '15']],
    'total = 0\nfor i = 1 to 5\n    total = total + i\nnext i\nprint(total)', { command: 'Complete', starter: 'total = ___\nfor i = 1 to ___\n    total = total + ___\nnext i\nprint(total)', codes: ['I1'], exact: true });
  C('2.2.1d', 'while', 3, 3, 'Complete the program so it keeps asking for a score until a score from 0 to 100 is entered, then outputs "Saved". Replace each ___.',
    [[['50'], 'Saved'], [['-1', '101', '100'], 'Saved'], [['0'], 'Saved']],
    'score = int(input("Score"))\nwhile score < 0 OR score > 100\n    score = int(input("Score"))\nendwhile\nprint("Saved")', { command: 'Complete', starter: 'score = int(input("Score"))\nwhile score < ___ OR score > ___\n    score = ___\nendwhile\nprint("Saved")', codes: ['I2', 'Q3'] });
  C('2.2.3d', 'loop', 3, 3, 'Complete the program so it outputs the average of the values in the array (the answer is 6). Replace each ___.',
    [[[], '6']],
    'nums = [4, 8, 6]\ntotal = 0\nfor i = 0 to nums.length - 1\n    total = total + nums[i]\nnext i\nprint(total / nums.length)', { command: 'Complete', starter: 'nums = [4, 8, 6]\ntotal = 0\nfor i = 0 to ___\n    total = total + ___\nnext i\nprint(total / ___)', codes: ['Q5'] });
  C('2.2.3e', 'func', 4, 3, 'Complete the function so it returns the larger of two numbers. The main program should output 9. Replace each ___.',
    [[[], '9']],
    'function bigger(a, b)\n    if a > b then\n        return a\n    else\n        return b\n    endif\nendfunction\nprint(bigger(4, 9))', { command: 'Complete', starter: 'function bigger(a, b)\n    if ___ then\n        return a\n    else\n        return ___\n    endif\nendfunction\nprint(bigger(4, 9))', codes: ['Q6'], exact: true });

  // ── Find and fix the errors (2.1.2f / 2.3.2e) ──
  C('2.1.2f', '', 3, 3, 'This program should output the numbers 1 to 5, but it has a logic error. Correct the program.',
    [[[], '1\n2\n3\n4\n5']],
    'for i = 1 to 5\n    print(i)\nnext i', { command: 'Refine', starter: 'for i = 0 to 4\n    print(i)\nnext i', codes: ['I1', 'T1'], exact: true });
  C('2.1.2f', '', 3, 3, 'This program should output "Adult" for ages 18 and over and "Child" otherwise, but 18 gives the wrong output. Correct the program.',
    [[['18'], 'Adult'], [['17'], 'Child'], [['30'], 'Adult']],
    'age = int(input("Age"))\nif age >= 18 then\n    print("Adult")\nelse\n    print("Child")\nendif', { command: 'Refine', starter: 'age = int(input("Age"))\nif age > 18 then\n    print("Adult")\nelse\n    print("Child")\nendif', codes: ['Q3', 'T1'] });
  C('2.1.2f', '', 4, 4, 'This program should add up numbers until 0 is entered, but it never stops. Correct the program.',
    [[['3', '4', '0'], '7'], [['0'], '0']],
    'total = 0\nn = int(input("Number"))\nwhile n != 0\n    total = total + n\n    n = int(input("Number"))\nendwhile\nprint(total)', { command: 'Refine', starter: 'total = 0\nn = int(input("Number"))\nwhile n != 0\n    total = total + n\nendwhile\nprint(total)', codes: ['I2'] });
  C('2.1.2f', '', 4, 4, 'This program should output the total of two numbers entered by the user, but entering 3 and 4 outputs 34. Correct the program.',
    [[['3', '4'], '7'], [['10', '5'], '15']],
    'a = int(input("First"))\nb = int(input("Second"))\nprint(a + b)', { command: 'Refine', starter: 'a = input("First")\nb = input("Second")\nprint(a + b)', codes: ['Q9', 'T1'] });
  C('2.3.2e', '', 5, 4, 'This program should find the largest number in the array (the answer is 9), but it outputs 6. Correct the program.',
    [[[], '9']],
    'nums = [3, 9, 2, 6]\nbig = nums[0]\nfor i = 1 to nums.length - 1\n    if nums[i] > big then\n        big = nums[i]\n    endif\nnext i\nprint(big)', { command: 'Refine', starter: 'nums = [3, 9, 2, 6]\nbig = nums[0]\nfor i = 1 to nums.length - 1\n    big = nums[i]\nnext i\nprint(big)', codes: ['T1'], exact: true });
  C('2.1.2f', '', 5, 4, 'This program should count how many marks in the array are passes (40 or more) – the answer is 3 – but it has two errors. Correct the program.',
    [[[], '3']],
    'marks = [55, 32, 40, 78, 12]\npasses = 0\nfor i = 0 to marks.length - 1\n    if marks[i] >= 40 then\n        passes = passes + 1\n    endif\nnext i\nprint(passes)', { command: 'Refine', starter: 'marks = [55, 32, 40, 78, 12]\npasses = 0\nfor i = 1 to marks.length - 1\n    if marks[i] > 40 then\n        passes = passes + 1\n    endif\nnext i\nprint(passes)', codes: ['Q5', 'Q3', 'T1'], exact: true });
})(GCSE_BANK_X.C);
