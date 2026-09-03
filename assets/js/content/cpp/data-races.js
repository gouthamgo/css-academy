import { Region, Box, Cell, Text, Tag } from '../../viz/primitives.js';

/* ------------------------------------------------------------------
   Two lanes, time flowing downwards. The counter sits above both of
   them because it belongs to neither. Row positions are shared so the
   two lanes stay in lockstep and an interleaving reads left-to-right.
   ------------------------------------------------------------------ */
const LANE_A = { x: 36, y: 112, w: 304, h: 290 };
const LANE_B = { x: 380, y: 112, w: 304, h: 290 };
const OP_W = 232;
const ROW = [176, 226, 276];
const A = { src: 52, ops: 52, tag: 294, reg: 126 };
const B = { src: 396, ops: 396, tag: 638, reg: 470 };

const counter = (value, tone = 'neutral', sub) => [
  Text({
    key: 'sharedLabel',
    x: 360,
    y: 22,
    text: 'one object, two writers',
    size: 10,
    anchor: 'middle',
    mono: true,
    opacity: 0.6,
  }),
  Cell({
    key: 'counter',
    x: 304,
    y: 44,
    w: 112,
    h: 46,
    name: 'counter',
    value,
    tone,
    sub,
  }),
];

const lanes = () => [
  Region({ ...LANE_A, key: 'laneA', label: 'THREAD A — TIME ↓', tone: 'stack' }),
  Region({ ...LANE_B, key: 'laneB', label: 'THREAD B — TIME ↓', tone: 'stack' }),
];

const op = (key, x, y, label, tone = 'neutral', dashed = false) =>
  Box({ key, x, y, w: OP_W, h: 42, label, labelSize: 11.5, mono: true, tone, dashed });

const order = (key, x, y, text, tone = 'highlight') =>
  Tag({ key, x, y: y + 11, w: 30, text, tone });

const reg = (key, x, value, tone = 'neutral') =>
  Cell({ key, x, y: 344, w: 124, h: 40, name: 'register', value, tone });

export default {
  oneLiner:
    'Why two threads touching one variable is not a wrong number but a program with no defined meaning at all.',

  whyJob:
    'The wrong answer — "you might lose an increment" — sounds informed and is disqualifying. Interviewers are listening for the words "undefined behaviour", because a candidate who thinks a race merely produces a stale value will write code the optimiser is allowed to delete.',

  mentalModel:
    'Two people updating the same tally on a whiteboard. Each one *reads the number, adds one in their head, and writes it back* — and if they both read 41 before either writes, the board ends at 42 instead of 43. The C++ twist is harsher than a lost tally: the standard does not promise you 42 *or* 43. A racing program has *no defined behaviour whatsoever*, and the compiler optimised it on the assumption that the race could never happen.',

  scene: {
    id: 'lost-update',
    title: 'Two increments, one of them silently gone',
    width: 720,
    height: 420,
    legend: [
      { tone: 'highlight', label: 'executing now' },
      { tone: 'freed', label: 'the damage' },
      { tone: 'owned', label: 'made safe' },
    ],
    steps: [
      {
        say: 'One global, two threads, and the same single line of C++ in each. Nothing here looks dangerous — that is exactly the problem, because the danger is in the machine code this line becomes.',
        mark: ['4', '8'],
        shapes: () => [
          ...counter('0'),
          ...lanes(),
          op('srcA', A.src, 196, '++counter;', 'neutral', true),
          op('srcB', B.src, 196, '++counter;', 'neutral', true),
        ],
      },
      {
        say: '`++counter` is one token and three machine operations. There is no x86 instruction that increments memory atomically unless you ask for one with a `lock` prefix, and the compiler does not add it for a plain `int`.',
        mark: ['8'],
        shapes: () => [
          ...counter('0'),
          ...lanes(),
          Box({ key: 'srcA', x: A.src, y: 126, w: OP_W, h: 34, label: '++counter;', labelSize: 11.5, mono: true, dashed: true }),
          Box({ key: 'srcB', x: B.src, y: 126, w: OP_W, h: 34, label: '++counter;', labelSize: 11.5, mono: true, dashed: true }),
          op('a1', A.ops, ROW[0], 'load   counter → r'),
          op('a2', A.ops, ROW[1], 'add    r, 1'),
          op('a3', A.ops, ROW[2], 'store  r → counter'),
          op('b1', B.ops, ROW[0], 'load   counter → r'),
          op('b2', B.ops, ROW[1], 'add    r, 1'),
          op('b3', B.ops, ROW[2], 'store  r → counter'),
          reg('regA', A.reg, '—'),
          reg('regB', B.reg, '—'),
        ],
      },
      {
        say: 'Thread A runs its load. The value 0 is now sitting in a register that only A can see — and A has not yet told memory anything.',
        focus: ['a1', 'regA', 'counter', 'ordA1'],
        shapes: () => [
          ...counter('0', 'highlight'),
          ...lanes(),
          Box({ key: 'srcA', x: A.src, y: 126, w: OP_W, h: 34, label: '++counter;', labelSize: 11.5, mono: true, dashed: true }),
          Box({ key: 'srcB', x: B.src, y: 126, w: OP_W, h: 34, label: '++counter;', labelSize: 11.5, mono: true, dashed: true }),
          op('a1', A.ops, ROW[0], 'load   counter → r', 'highlight'),
          op('a2', A.ops, ROW[1], 'add    r, 1'),
          op('a3', A.ops, ROW[2], 'store  r → counter'),
          op('b1', B.ops, ROW[0], 'load   counter → r'),
          op('b2', B.ops, ROW[1], 'add    r, 1'),
          op('b3', B.ops, ROW[2], 'store  r → counter'),
          order('ordA1', A.tag, ROW[0], '1st'),
          reg('regA', A.reg, '0', 'highlight'),
          reg('regB', B.reg, '—'),
        ],
      },
      {
        say: 'Before A gets to its store, the scheduler runs B — or B was already running on another core. B loads the same 0. Both threads are now holding the same stale value and neither of them can tell.',
        focus: ['b1', 'regA', 'regB', 'counter', 'ordB1'],
        shapes: () => [
          ...counter('0', 'highlight'),
          ...lanes(),
          Box({ key: 'srcA', x: A.src, y: 126, w: OP_W, h: 34, label: '++counter;', labelSize: 11.5, mono: true, dashed: true }),
          Box({ key: 'srcB', x: B.src, y: 126, w: OP_W, h: 34, label: '++counter;', labelSize: 11.5, mono: true, dashed: true }),
          op('a1', A.ops, ROW[0], 'load   counter → r', 'moved'),
          op('a2', A.ops, ROW[1], 'add    r, 1'),
          op('a3', A.ops, ROW[2], 'store  r → counter'),
          op('b1', B.ops, ROW[0], 'load   counter → r', 'highlight'),
          op('b2', B.ops, ROW[1], 'add    r, 1'),
          op('b3', B.ops, ROW[2], 'store  r → counter'),
          order('ordA1', A.tag, ROW[0], '1st', 'moved'),
          order('ordB1', B.tag, ROW[0], '2nd'),
          reg('regA', A.reg, '0'),
          reg('regB', B.reg, '0', 'highlight'),
        ],
      },
      {
        say: 'Both registers hold 1 and both stores land. Two increments went in; one came out. Nothing crashed, nothing warned, and on a small test run this program prints the right answer often enough to look correct.',
        mark: ['18'],
        predict: {
          ask: 'Both threads loaded 0, added 1, and stored. What does the standard promise `counter` holds afterwards?',
          options: [
            { label: 'Exactly 2 — the stores are independent', correct: false },
            { label: '1 or 2, whichever the timing gives you', correct: false },
            { label: 'Nothing at all — the program has undefined behaviour', correct: true },
          ],
          because:
            'The picture shows 1, which is what you will usually observe. But a data race is undefined behaviour, not a race between two defined outcomes. The compiler is entitled to assume no other thread touches `counter`, so it may keep it in a register across the whole loop, or delete the loop, or produce a value that was never stored by anyone.',
        },
        focus: ['a3', 'b3', 'counter', 'lost'],
        shapes: () => [
          ...counter('1', 'freed', 'expected 2'),
          ...lanes(),
          Box({ key: 'srcA', x: A.src, y: 126, w: OP_W, h: 34, label: '++counter;', labelSize: 11.5, mono: true, dashed: true }),
          Box({ key: 'srcB', x: B.src, y: 126, w: OP_W, h: 34, label: '++counter;', labelSize: 11.5, mono: true, dashed: true }),
          op('a1', A.ops, ROW[0], 'load   counter → r', 'moved'),
          op('a2', A.ops, ROW[1], 'add    r, 1', 'moved'),
          op('a3', A.ops, ROW[2], 'store  r → counter', 'freed'),
          op('b1', B.ops, ROW[0], 'load   counter → r', 'moved'),
          op('b2', B.ops, ROW[1], 'add    r, 1', 'moved'),
          op('b3', B.ops, ROW[2], 'store  r → counter', 'freed'),
          order('ordA1', A.tag, ROW[0], '1st', 'moved'),
          order('ordB1', B.tag, ROW[0], '2nd', 'moved'),
          order('ordA3', A.tag, ROW[2], '3rd', 'freed'),
          order('ordB3', B.tag, ROW[2], '4th', 'freed'),
          reg('regA', A.reg, '1'),
          reg('regB', B.reg, '1'),
          Tag({ key: 'lost', x: 440, y: 56, w: 176, text: 'one increment vanished', tone: 'freed' }),
        ],
      },
      {
        say: 'Now the part people miss. Because a race is undefined, the compiler is allowed to assume nobody else writes `counter` — so it hoists the load out of the loop entirely and never reads memory again. A thread spinning on a plain `bool` flag can spin forever for exactly this reason.',
        mark: ['7-8'],
        focus: ['a1', 'srcA', 'hoisted', 'regA'],
        shapes: () => [
          ...counter('1', 'freed'),
          ...lanes(),
          Box({ key: 'srcA', x: A.src, y: 126, w: OP_W, h: 34, label: 'for (…) ++counter;', labelSize: 11.5, mono: true, dashed: true }),
          Box({ key: 'srcB', x: B.src, y: 126, w: OP_W, h: 34, label: 'for (…) ++counter;', labelSize: 11.5, mono: true, dashed: true }),
          op('a1', A.ops, ROW[0], 'load   counter → r', 'moved', true),
          op('a2', A.ops, ROW[1], 'add    r, 100000', 'highlight'),
          op('a3', A.ops, ROW[2], 'store  r → counter', 'moved'),
          op('b1', B.ops, ROW[0], 'load   counter → r', 'moved', true),
          op('b2', B.ops, ROW[1], 'add    r, 100000', 'highlight'),
          op('b3', B.ops, ROW[2], 'store  r → counter', 'moved'),
          Tag({ key: 'hoisted', x: 100, y: 306, w: 176, text: 'hoisted out of the loop', tone: 'freed' }),
          reg('regA', A.reg, 'r', 'freed'),
          reg('regB', B.reg, 'r', 'freed'),
        ],
      },
      {
        say: 'The repair is not a smarter interleaving — there is no interleaving that fixes an undefined program. You change the object so that the three operations become one indivisible instruction, and the compiler loses permission to assume it is alone.',
        focus: ['rmwA', 'rmwB', 'counter', 'srcA', 'srcB'],
        shapes: () => [
          ...counter('2', 'owned', 'std::atomic<int>'),
          ...lanes(),
          Box({ key: 'srcA', x: A.src, y: 126, w: OP_W, h: 34, label: 'counter.fetch_add(1);', labelSize: 11.5, mono: true, dashed: true }),
          Box({ key: 'srcB', x: B.src, y: 126, w: OP_W, h: 34, label: 'counter.fetch_add(1);', labelSize: 11.5, mono: true, dashed: true }),
          op('rmwA', A.ops, ROW[1], 'lock xadd  counter, 1', 'owned'),
          op('rmwB', B.ops, ROW[1], 'lock xadd  counter, 1', 'owned'),
          Tag({ key: 'indiv', x: 100, y: 306, w: 176, text: 'one indivisible step', tone: 'owned' }),
          reg('regA', A.reg, '0', 'owned'),
          reg('regB', B.reg, '1', 'owned'),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'race.cpp',
    source: `#include <cstdio>
#include <thread>

int counter = 0;          // plain int, two writers, no synchronisation

void bump(int times) {
    for (int i = 0; i < times; ++i)
        ++counter;        // one token, three machine operations
}

int main() {
    std::thread a(bump, 100000);
    std::thread b(bump, 100000);
    a.join();
    b.join();

    // You expect 200000. You will not reliably get it.
    printf("%d\\n", counter);
    return 0;
}`,
    annotations: [
      {
        lines: '4',
        text: 'Two threads, at least one writing, no synchronisation between them. That is the standard’s definition of a data race, word for word.',
      },
      {
        lines: '8',
        text: 'Read-modify-write. The window between the load and the store is where the other thread gets in — and it is only a couple of nanoseconds wide, which is why the bug is rare enough to reach production.',
      },
      {
        lines: '18',
        text: 'Do not reason about *which* wrong number you get. Once the program is undefined, the output is not evidence of anything.',
      },
    ],
  },

  deeper: [
    'The standard’s wording matters because it is what the optimiser is built on. Two accesses to the same memory location conflict if at least one is a write; if two conflicting accesses happen in different threads and neither happens-before the other, the program has a data race and the behaviour is undefined. Note what is absent: any mention of how wrong the value gets. Undefined means the compiler owes you nothing.',
    'The compiler reorders because it is allowed to. Within a single thread it must preserve observable behaviour *as if* executed in order — but "observable" is defined for one thread only. So it will keep a variable in a register across a loop, sink a store past a call, merge two loads into one, or delete a loop whose result is never read. Every one of those transformations is correct for a single thread and catastrophic for a racing one.',
    'The CPU reorders too, and for different reasons. Stores go into a store buffer so the core does not stall waiting for the cache; loads issue speculatively and out of order. x86-64 is relatively strict — it gives you total store order, so the only reordering you normally see is a store followed by a load to a different address. ARM and POWER are far weaker: a store can become visible to one core before another. Code that "works" on your x86 laptop and fails on an ARM server is usually this.',
    'This is why the bug is so expensive. The window between the load and the store is a couple of nanoseconds wide, so the race fires perhaps once in millions of iterations. It passes review, it passes CI, and then it corrupts an order book at 09:31 on a busy morning. The failure appears far from the cause, because the damage is a wrong number that gets carried forward.',
    'The two legal repairs are a mutex or an atomic. Both work by creating a happens-before relationship where none existed — unlocking a mutex synchronises-with the next lock of it, and a release store synchronises-with the acquire load that reads it. `volatile` is not one of the repairs. It stops the compiler caching the variable in a register and does nothing about CPU reordering or atomicity, which makes it the most confidently wrong answer available in a concurrency interview.',
  ],

  gotchas: [
    'The program printing 200000 on your machine is not evidence that it is correct. It means the window did not open during that run. Run it on a machine with more cores, or under different load, and it will.',
    '`volatile` does not make anything thread-safe in C++. It was designed for memory-mapped hardware registers. Saying "I would make it volatile" is one of the fastest ways to end a concurrency interview.',
    'A race on a `bool` is still a race. There is no size below which the standard grants you atomicity, even though a byte store is atomic on every CPU you will ever meet — the undefined behaviour comes from the language rules, not the hardware.',
    'Reading a value while another thread writes it is a race even if you never write. A torn read of a 64-bit value on a 32-bit target gives you a number that was never stored by anybody.',
    'ThreadSanitizer only reports races it actually observed. A clean run proves nothing about the paths it did not take, so keep it on in CI rather than running it once.',
  ],

  interview: {
    q: 'Two threads each run `for (int i = 0; i < 1000000; ++i) ++counter;` on a plain `int counter`. What is the final value, and what would you change?',
    a: [
      'The honest answer is that the standard does not define a final value, because this is a data race and therefore undefined behaviour. In practice you will observe something between one million and two million, because `++counter` compiles to a load, an add and a store, and any interleaving where both threads load before either stores loses an increment. But quoting a range is answering a different, easier question than the one asked.',
      'The reason the distinction is not pedantry is the optimiser. Since the compiler may assume no other thread touches `counter`, it is free to keep it in a register for the whole loop and store once at the end — turning a million tiny races into one enormous one — or to delete the loop if the result is unused. The same permission is why a thread spinning on a plain `bool done` flag can spin forever: the compiler hoisted the load and the thread is now reading a register, not memory.',
      'The fix is to give the two accesses an ordering the language recognises. Make it `std::atomic<int>` and use `fetch_add`, which on x86-64 becomes a single `lock xadd` — the cache line is held exclusively for the duration of the instruction, so no interleaving is possible. If the counter is contended and only the total matters, a better answer still is per-thread counters summed at the end, which removes the contention rather than serialising it. A mutex also works and is the right choice when the critical section is more than one integer, but it costs far more than an atomic for a single increment.',
    ],
  },

  exercise: [
    'Build the program above with `g++ -O2 -pthread race.cpp` and run it twenty times in a loop. Note how the answer moves. Then rebuild with `-O0` and run it again — the numbers change character, because at `-O0` the compiler reloads from memory every iteration and the race window is different. Two different sets of wrong answers from the same source is the most direct demonstration that the behaviour is undefined rather than merely racy.',
    'Now rebuild with `-fsanitize=thread -g` and run it once. ThreadSanitizer prints both stacks, the address, and which access was the write. Read the report carefully — it is the tool you will reach for every time something is intermittently wrong, and it is far easier to learn on a bug you already understand.',
    'Finally, change `int counter` to `std::atomic<int> counter` and time both versions with `-O2`. The atomic version is correct and noticeably slower, because every `lock xadd` takes the cache line exclusively. That number is the price of contention, and it is the reason the next few lessons exist.',
  ],
};
