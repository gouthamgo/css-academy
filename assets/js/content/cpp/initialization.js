import { Box, Text, Tag, Arrow, Region } from '../../viz/primitives.js';

const SLOT_Y = 150;
const SLOT_W = 128;
const SLOT_H = 62;
const XS = [66, 226, 386, 546];

/* A stack slot. Junk is what the previous tenant left behind. */
const slot = (key, x, label, value, tone, dashed = false) =>
  Box({
    key,
    x,
    y: SLOT_Y,
    w: SLOT_W,
    h: SLOT_H,
    label: value,
    sub: label,
    tone,
    dashed,
    mono: true,
    labelSize: 15,
  });

const bed = () => [
  Region({
    key: 'r',
    x: 44,
    y: 108,
    w: 620,
    h: 150,
    label: 'ONE FUNCTION’S STACK FRAME',
    tone: 'stack',
  }),
];

export default {
  oneLiner:
    'Declaring a variable reserves space. Initializing it is the separate step that puts a legal value there.',

  whyJob:
    'Uninitialized reads are among the top causes of bugs that reproduce on one machine and not another, and "what is the difference between `T x;` and `T x{};`" is a standard screening question with a surprising amount of depth behind it.',

  mentalModel:
    'A declaration is reserving a parking space; initialization is the separate act of *parking something legal in it*. Skip the second step and the space still holds whatever the previous tenant left — and reading that is not "getting a random number", it is undefined behaviour, which licenses the compiler to assume it never happens and delete the code around it.',

  scene: {
    id: 'init-forms',
    title: 'Four ways to declare an int, and what each leaves behind',
    width: 720,
    height: 340,
    legend: [
      { tone: 'freed', label: 'indeterminate — do not read' },
      { tone: 'owned', label: 'initialized' },
      { tone: 'borrowed', label: 'converted on the way in' },
    ],
    steps: [
      {
        say: 'A frame starts out full of whatever the last function to use these addresses left there. Not zeros — leftovers.',
        mark: [],
        shapes: () => [
          ...bed(),
          slot('s0', XS[0], 'junk', '0x7ffd', 'moved'),
          slot('s1', XS[1], 'junk', '0x0042', 'moved'),
          slot('s2', XS[2], 'junk', '0xbe11', 'moved'),
          slot('s3', XS[3], 'junk', '0xcafe', 'moved'),
        ],
      },
      {
        say: '`int a;` fences off a slot and names it. It does not clean it. The bytes are exactly as they were, and the standard calls the value indeterminate — reading it is undefined behaviour, not "reading garbage".',
        mark: ['7'],
        focus: ['s0', 'w0'],
        shapes: () => [
          ...bed(),
          slot('s0', XS[0], 'int a;', '0x7ffd', 'freed'),
          slot('s1', XS[1], 'junk', '0x0042', 'moved'),
          slot('s2', XS[2], 'junk', '0xbe11', 'moved'),
          slot('s3', XS[3], 'junk', '0xcafe', 'moved'),
          Tag({ key: 'w0', x: XS[0] + 14, y: SLOT_Y + 74, text: 'indeterminate', tone: 'freed' }),
        ],
      },
      {
        say: '`int b{};` reserves the same space and then value-initializes it. The leftovers are swept out and a zero goes in. Two characters of typing, and the entire class of uninitialized-read bugs disappears.',
        mark: ['8'],
        focus: ['s1', 'w1'],
        shapes: () => [
          ...bed(),
          slot('s0', XS[0], 'int a;', '0x7ffd', 'freed'),
          slot('s1', XS[1], 'int b{};', '0', 'owned'),
          slot('s2', XS[2], 'junk', '0xbe11', 'moved'),
          slot('s3', XS[3], 'junk', '0xcafe', 'moved'),
          Tag({ key: 'w0', x: XS[0] + 14, y: SLOT_Y + 74, text: 'indeterminate', tone: 'freed' }),
          Tag({ key: 'w1', x: XS[1] + 26, y: SLOT_Y + 74, text: 'zeroed', tone: 'owned' }),
        ],
      },
      {
        say: '`int c = 3.9;` compiles. The value passes through a conversion on the way in and arrives as 3 — the fraction is gone and nothing warned you by default.',
        mark: ['9'],
        focus: ['s2', 'gate', 'w2'],
        shapes: () => [
          ...bed(),
          slot('s0', XS[0], 'int a;', '0x7ffd', 'freed'),
          slot('s1', XS[1], 'int b{};', '0', 'owned'),
          slot('s2', XS[2], 'int c = 3.9;', '3', 'borrowed'),
          slot('s3', XS[3], 'junk', '0xcafe', 'moved'),
          Tag({ key: 'w0', x: XS[0] + 14, y: SLOT_Y + 74, text: 'indeterminate', tone: 'freed' }),
          Tag({ key: 'w1', x: XS[1] + 26, y: SLOT_Y + 74, text: 'zeroed', tone: 'owned' }),
          Arrow({
            key: 'gate',
            from: [XS[2] + SLOT_W / 2, 96],
            to: [XS[2] + SLOT_W / 2, SLOT_Y - 6],
            shape: 'straight',
            bend: 0,
            tone: 'borrowed',
            label: '3.9 → 3',
          }),
          Tag({ key: 'w2', x: XS[2] + 6, y: SLOT_Y + 74, text: 'silently truncated', tone: 'borrowed' }),
        ],
      },
      {
        say: 'Now the same value, but written with braces instead of an equals sign.',
        mark: ['10'],
        predict: {
          ask: 'What does `int d{3.9};` do?',
          options: [
            { label: 'The same as `= 3.9` — stores 3', correct: false },
            { label: 'Rounds to 4 instead of truncating', correct: false },
            { label: 'Refuses to compile', correct: true },
          ],
          because:
            'Braces reject narrowing conversions. That is the real reason to prefer them: the compiler catches a lossy conversion you did not intend, rather than performing it quietly.',
        },
        shapes: () => [
          ...bed(),
          slot('s0', XS[0], 'int a;', '0x7ffd', 'freed'),
          slot('s1', XS[1], 'int b{};', '0', 'owned'),
          slot('s2', XS[2], 'int c = 3.9;', '3', 'borrowed'),
          slot('s3', XS[3], 'int d{3.9};', '?', 'highlight'),
        ],
      },
      {
        say: 'It does not compile at all. Braces refuse any conversion that could lose information, so the mistake is caught at build time instead of becoming a wrong number three modules downstream.',
        mark: ['10'],
        focus: ['s3', 'err'],
        shapes: () => [
          ...bed(),
          slot('s0', XS[0], 'int a;', '0x7ffd', 'freed'),
          slot('s1', XS[1], 'int b{};', '0', 'owned'),
          slot('s2', XS[2], 'int c = 3.9;', '3', 'borrowed'),
          slot('s3', XS[3], 'int d{3.9};', '✗', 'freed', true),
          Text({
            key: 'err',
            x: 354,
            y: 292,
            text: 'error: narrowing conversion of 3.9e+0 from double to int',
            size: 12,
            anchor: 'middle',
            mono: true,
            tone: 'freed',
            weight: 650,
          }),
        ],
      },
      {
        say: 'One last trap, and it is the reason `{}` beats `()` for an empty initializer. `Widget w();` does not make a Widget — the compiler reads it as declaring a function that takes nothing and returns one. `Widget w{};` is what you meant.',
        mark: ['12-13'],
        shapes: () => [
          Region({
            key: 'r',
            x: 44,
            y: 108,
            w: 620,
            h: 150,
            label: 'ONE FUNCTION’S STACK FRAME',
            tone: 'stack',
          }),
          Box({
            key: 'mvp',
            x: 84,
            y: SLOT_Y - 8,
            w: 250,
            h: 78,
            label: 'Widget w();',
            sub: 'no object — a function declaration',
            tone: 'freed',
            dashed: true,
            mono: true,
            labelSize: 14,
          }),
          Box({
            key: 'good',
            x: 380,
            y: SLOT_Y - 8,
            w: 250,
            h: 78,
            label: 'Widget w{};',
            sub: 'an actual Widget, n = 7',
            tone: 'owned',
            mono: true,
            labelSize: 14,
          }),
          Tag({ key: 'mvpt', x: 148, y: 282, text: 'most vexing parse', tone: 'freed' }),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'init.cpp',
    source: `#include <cstdio>
#include <vector>

struct Widget { int n = 7; };

int main() {
    int a;           // indeterminate — reading it is undefined behaviour
    int b{};         // value-initialised to 0
    int c = 3.9;     // narrows silently to 3
    // int d{3.9};   // error: narrowing conversion

    // Widget w();   // declares a FUNCTION, not an object
    Widget w{};      // this is what you meant

    std::vector<int> v1(3, 7);   // three elements, each 7
    std::vector<int> v2{3, 7};   // two elements: 3 and 7

    std::printf("%d %d %zu %zu %d\\n", b, c, v1.size(), v2.size(), w.n);
    (void)a;         // never read it
}`,
    annotations: [
      {
        lines: '7-8',
        text: 'One character apart, and one of them is undefined behaviour. Make `{}` the reflex.',
      },
      {
        lines: '12-13',
        text: 'The Most Vexing Parse. Anything that *could* be read as a declaration will be, so empty parentheses declare a function.',
      },
      {
        lines: '15-16',
        text: 'The sharpest edge in the language. Braces prefer an `initializer_list` constructor over every other overload, so these two lines build completely different vectors.',
      },
    ],
  },

  deeper: [
    'An object in C++ is formally a region of storage with a type and a lifetime. Declaring one reserves the storage and starts the lifetime; initialization is what puts a determinate value in it. The two are separate steps, and the language lets you skip the second — a deliberate choice, because zeroing memory you are about to overwrite costs real time in a tight loop.',
    'Locals of built-in type are not zeroed, but globals and `static`s are. This asymmetry produces one of the more maddening debugging experiences available: a bug that vanishes when you move a variable to file scope, because the variable is now zero-initialized before the program starts and the uninitialized read that caused the problem is reading a zero instead of leftovers.',
    'Braces do three useful things at once. They reject narrowing conversions, they sidestep the Most Vexing Parse, and they work uniformly across aggregates, class types and built-ins. They do one harmful thing: they prefer an `initializer_list` constructor over everything else, which is why `std::vector<int> v(3, 7)` gives you `{7, 7, 7}` while `v{3, 7}` gives you `{3, 7}`. The rule that follows is to use braces everywhere except when calling a constructor whose arguments describe *how to build* the object rather than *what is in it*.',
    'Members are initialized in declaration order, not in the order you write them in the member initializer list. Writing them out of order compiles and produces a member initialized from another member that has not been constructed yet. `-Wreorder` catches it and belongs in your warning set.',
    'Under `-O2` the compiler will often eliminate a redundant zero-initialization entirely when it can prove the value is overwritten before any read. So the habit of writing `{}` usually costs nothing at runtime while removing an entire category of bug — which is close to the definition of a free win.',
  ],

  gotchas: [
    '`std::vector<int> v(3, 7)` and `v{3, 7}` are different vectors. Parentheses call the count-and-value constructor; braces pass the elements directly.',
    '`Widget w();` declares a function. `Widget w{};` declares an object. The compiler will not warn you, and the error you eventually get will be about calling a member on a function type.',
    'An uninitialized local holds whatever the previous frame left at that address, so its value changes when you edit *unrelated* code. A bug that moves when you add a `printf` is very often this.',
    'Debug builds frequently paint fresh stack memory with a recognisable pattern, so an uninitialized read may look deterministic under `-O0` and behave completely differently under `-O2`. Test both.',
  ],

  interview: {
    q: 'What is the difference between `T x;`, `T x{};`, and `T x = T();`?',
    a: [
      'It depends entirely on what `T` is. For a class type with a user-provided default constructor, all three run that constructor and are equivalent. For a built-in type or a trivial aggregate they diverge sharply: `T x;` performs default-initialization, which for these types means *nothing at all* — the object holds indeterminate bytes and reading it is undefined behaviour. `T x{}` and `T x = T()` both value-initialize, which zero-initializes.',
      'So the practical rule is that `{}` is the safe default. It is also the only one of the three that rejects narrowing conversions, and it avoids the Most Vexing Parse that `T x()` falls into.',
      'The detail worth volunteering is that this is not free advice being given for its own sake — the reason C++ leaves `T x;` uninitialized is that zeroing memory you are about to overwrite is wasted work, and in a tight loop that matters. But under optimization the compiler can usually prove the initialization is dead and remove it, so in practice you get the safety without paying for it. I would still write `{}` by default and only drop it somewhere I had measured and could point at the assembly.',
    ],
  },

  exercise: [
    'Write a struct with four members of mixed types and instantiate it five ways — `S s;`, `S s{};`, `S s = {};`, `S s{1,2,3,4};` and `S s = S();`. Print every member under `-O0`, then again under `-O2`, and note which forms produce garbage and whether the garbage differs between optimization levels.',
    'Then run the whole thing under `-fsanitize=memory` (Clang) or valgrind, and confirm the tool names the exact line of the uninitialized read. Learning to reach for a sanitizer before a debugger is a habit worth forming now — it is also the thing that turns "it crashes sometimes" into a one-line answer.',
  ],
};
