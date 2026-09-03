import { Region, Cells, Arrow, Text, Tag } from '../../viz/primitives.js';

/* ------------------------------------------------------------------
   One 64-byte line, drawn twice — once per core's private cache. The
   two Cells calls share indices, so a cell in Core 0's copy and the
   same-index cell in Core 1's copy read as "the same bytes, two
   places" even though they are two separate shape arrays.
   ------------------------------------------------------------------ */
const CORE0 = { x: 40, y: 108, w: 300, h: 190 };
const CORE1 = { x: 380, y: 108, w: 300, h: 190 };
const CELL_W = 26;
const CELL_H = 46;
const LINE_Y = 156;
const LINE0_X = 66;
const LINE1_X = 406;
// counter `a` lives at byte offset 24 (cell 3), counter `b` at offset 32 (cell 4) — 8 bytes apart, same line.
const A_IDX = 3;
const B_IDX = 4;

const line = (key, x, aVal, bVal, aTone, bTone) =>
  Cells({
    key,
    x,
    y: LINE_Y,
    dir: 'row',
    w: CELL_W,
    h: CELL_H,
    gap: 2,
    tone: 'neutral',
    values: Array.from({ length: 8 }, (_, i) => {
      if (i === A_IDX) return { value: aVal, tone: aTone, name: 'a' };
      if (i === B_IDX) return { value: bVal, tone: bTone, name: 'b' };
      return { value: '·', tone: 'neutral', opacity: 0.3 };
    }),
  });

const cores = () => [
  Region({ ...CORE0, key: 'core0', label: 'CORE 0 CACHE', tone: 'stack' }),
  Region({ ...CORE1, key: 'core1', label: 'CORE 1 CACHE', tone: 'stack' }),
  Text({ key: 'lineLabel0', x: LINE0_X, y: LINE_Y - 12, text: 'cache line (64 bytes)', size: 9, mono: true, opacity: 0.5 }),
  Text({ key: 'lineLabel1', x: LINE1_X, y: LINE_Y - 12, text: 'cache line (64 bytes)', size: 9, mono: true, opacity: 0.5 }),
];

const traffic = (n) =>
  Tag({ key: 'traffic', x: 300, y: 372, w: 120, text: `line transfers: ${n}`, tone: n > 0 ? 'freed' : 'owned' });

const state = (key, x, letter, tone) =>
  Tag({ key, x, y: LINE_Y + CELL_H + 10, w: 26, text: letter, tone });

export default {
  oneLiner:
    'Two threads writing to two unrelated variables that happen to share a 64-byte cache line pay for a full cross-core handoff on every write.',

  whyJob:
    'This is the classic "I parallelized it and it got slower" interview question. The candidate who blames the mutex or the scheduler fails it; the one who asks "how far apart are those two variables in memory" passes it.',

  mentalModel:
    'Two people writing on opposite corners of the same whiteboard. Every time either one writes a word, the whole sheet has to be physically handed to the other person before they can write theirs — even though neither one ever reads what the other wrote. The cache moves the *whole 64-byte line* on every write, never the four or eight bytes you actually touched, and it has no idea the two halves of that line are logically unrelated.',

  scene: {
    id: 'ping-pong',
    title: 'One line, two writers, no reader in sight',
    width: 720,
    height: 420,
    legend: [
      { tone: 'highlight', label: 'just written' },
      { tone: 'freed', label: 'invalidated / stale' },
      { tone: 'owned', label: 'exclusive, no contention' },
    ],
    steps: [
      {
        say: 'Two independent counters, `a` and `b`, sit eight bytes apart in memory — close enough that both land inside the same 64-byte cache line. Both cores currently hold a shared, read-only copy of that line.',
        mark: ['7', '8'],
        shapes: () => [
          ...cores(),
          line('lineA', LINE0_X, '0', '0', 'neutral', 'neutral'),
          line('lineB', LINE1_X, '0', '0', 'neutral', 'neutral'),
          state('stateA', LINE0_X + 200, 'S', 'neutral'),
          state('stateB', LINE1_X + 200, 'S', 'neutral'),
          traffic(0),
        ],
      },
      {
        say: 'Core 0 increments `a`. Before it can write, it must invalidate every other cached copy of this line — including Core 1\'s, even though Core 1 has never once touched `a`.',
        mark: ['14', '15'],
        focus: ['lineA.3', 'stateA', 'invalidate1', 'traffic'],
        shapes: () => [
          ...cores(),
          line('lineA', LINE0_X, '1', '0', 'highlight', 'neutral'),
          line('lineB', LINE1_X, '·', '·', 'freed', 'freed'),
          state('stateA', LINE0_X + 200, 'M', 'highlight'),
          state('stateB', LINE1_X + 200, 'I', 'freed'),
          Arrow({ key: 'invalidate1', from: [340, 200], to: [380, 200], shape: 'straight', bend: 0, tone: 'freed', label: 'invalidate' }),
          traffic(1),
        ],
      },
      {
        say: 'Core 1 wants to increment `b`, but its copy of the line is gone. It has to pull all 64 bytes across the chip interconnect just to change the 8 it actually cares about — and Core 0\'s copy becomes invalid instead.',
        mark: ['14', '15'],
        focus: ['lineB.4', 'stateB', 'fetch1', 'traffic'],
        shapes: () => [
          ...cores(),
          line('lineA', LINE0_X, '·', '·', 'freed', 'freed'),
          line('lineB', LINE1_X, '1', '1', 'highlight', 'highlight'),
          state('stateA', LINE0_X + 200, 'I', 'freed'),
          state('stateB', LINE1_X + 200, 'M', 'highlight'),
          Arrow({ key: 'fetch1', from: [380, 220], to: [340, 220], shape: 'straight', bend: 0, tone: 'highlight', label: 'request + transfer' }),
          traffic(2),
        ],
      },
      {
        say: 'Core 0 increments `a` again — and pays the full round trip a second time, pulling the line back from Core 1. Neither core ever reads the other\'s counter. The traffic is pure overhead created by proximity in memory, nothing else.',
        mark: ['14', '15'],
        predict: {
          ask: 'Both threads only ever touch their own counter and never read the other\'s. If each increments a million times, roughly how many of those two million writes require a fresh cache-line transfer?',
          options: [
            { label: 'Close to zero — the counters are independent variables', correct: false },
            { label: 'Close to two million — almost every write bounces the line', correct: true },
            { label: 'Exactly one — the line only ever needs to move once', correct: false },
          ],
          because:
            'Ownership of the line ping-pongs on nearly every single write, because the hardware tracks the *line*, not the *variable*. Nothing about `a` and `b` being logically unrelated is visible to the cache coherence protocol — it sees one 64-byte block that only one core may hold for writing at a time.',
        },
        focus: ['lineA.3', 'stateA', 'fetch2', 'traffic'],
        shapes: () => [
          ...cores(),
          line('lineA', LINE0_X, '2', '1', 'highlight', 'freed'),
          line('lineB', LINE1_X, '·', '·', 'freed', 'freed'),
          state('stateA', LINE0_X + 200, 'M', 'highlight'),
          state('stateB', LINE1_X + 200, 'I', 'freed'),
          Arrow({ key: 'fetch2', from: [340, 200], to: [380, 200], shape: 'straight', bend: 0, tone: 'freed', label: 'invalidate again' }),
          traffic(3),
        ],
      },
      {
        say: 'The fix is not a smarter algorithm — it is moving the variables apart. Padding each counter out to `alignas(hardware_destructive_interference_size)` gives each core a line to own outright, so writing `a` never touches a byte Core 1 has ever looked at.',
        mark: ['18', '19', '20'],
        focus: ['lineA.3', 'lineB.4'],
        shapes: () => [
          ...cores(),
          line('lineA', LINE0_X, '2', '·', 'owned', 'neutral'),
          line('lineB', LINE1_X, '·', '1', 'neutral', 'owned'),
          state('stateA', LINE0_X + 200, 'M', 'owned'),
          state('stateB', LINE1_X + 200, 'M', 'owned'),
          traffic(3),
        ],
      },
      {
        say: 'Both counters keep climbing from here with zero further cache-line transfers between the two cores. Measured, not imagined: this exact pattern regularly turns a 10–30x slowdown into two threads running at full independent speed.',
        mark: [],
        shapes: () => [
          ...cores(),
          line('lineA', LINE0_X, '9', '·', 'owned', 'neutral'),
          line('lineB', LINE1_X, '·', '7', 'neutral', 'owned'),
          state('stateA', LINE0_X + 200, 'M', 'owned'),
          state('stateB', LINE1_X + 200, 'M', 'owned'),
          traffic(3),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'false_sharing.cpp',
    source: `#include <atomic>
#include <cstdio>
#include <functional>
#include <thread>

struct Counters {
    std::atomic<long> a{0};
    std::atomic<long> b{0};        // 8 bytes from a, same cache line
};

Counters c;

void bump(std::atomic<long>& n) {
    for (long i = 0; i < 100'000'000; ++i)
        n.fetch_add(1, std::memory_order_relaxed);
}

int main() {
    std::thread t0(bump, std::ref(c.a));
    std::thread t1(bump, std::ref(c.b));
    t0.join();
    t1.join();
    printf("%ld %ld\\n", c.a.load(), c.b.load());
}`,
    annotations: [
      { lines: '7-8', text: '`a` and `b` are adjacent — likely the same 64-byte cache line on every mainstream desktop and server CPU. Nothing in the type system flags this.' },
      { lines: '11', text: 'One global instance, no padding anywhere. This is the entire bug — everything downstream is a consequence of this layout decision.' },
      { lines: '14-15', text: '`memory_order_relaxed` is the *correct* choice here — this program has no ordering requirement between the two counters. Do not mistake false sharing for a memory-ordering problem; it is purely about physical layout.' },
      { lines: '19-20', text: 'Each thread touches only its own field and never reads the other\'s — logically fully independent work. That independence is exactly what makes the slowdown surprising.' },
    ],
  },

  deeper: [
    'The unit of cache coherence on every mainstream CPU is the line, not the byte or the variable — 64 bytes on essentially all x86-64 and ARM64 parts you will meet. The MESI protocol (Modified / Exclusive / Shared / Invalid, with real implementations adding states like Owned or Forward) tracks ownership of whole lines. A core that wants to write a line it does not hold Modified or Exclusive must first invalidate every other cached copy — a Request For Ownership — and that message goes out regardless of which byte within the line actually changed.',
    'The cost is a cache-to-cache transfer, not a cache miss to memory, so it is often faster than a genuine DRAM access — but it still runs to the tens of nanoseconds on a modern multi-socket or many-core part, versus roughly one nanosecond for an L1-resident add. When two cores fight over one line on every iteration of a hot loop, that tens-of-nanoseconds round trip *is* the loop; the arithmetic is noise by comparison.',
    'The fix is `alignas(std::hardware_destructive_interference_size)` (`<new>`, C++17) on each field that is written by a different thread than its neighbors — it pads the field out to its own line so no two independently-written fields can ever share one. There is a matching `hardware_constructive_interference_size` for the opposite goal: packing fields that *are* read together onto one line on purpose, so a single fetch warms all of them.',
    'Padding is not free — each isolated field now costs a full cache line (typically 64 bytes, sometimes more) instead of 4 or 8, and a struct with a dozen independently-written counters becomes a struct with a dozen cache lines. This is a real memory and cache-footprint trade, worth making deliberately for hot per-thread counters and not applying reflexively to every struct in the codebase.',
    'False sharing is invisible in the source and in a debugger — the code is correct, produces the right numbers, and just runs slowly. The tool that actually finds it is `perf c2c` (cache-to-cache) on Linux, which attributes cache-line bouncing to specific source lines; a generic `perf stat -e cache-misses` will show elevated numbers but will not tell you it is *this specific pair of variables* doing it.',
  ],

  gotchas: [
    'Only writes cause invalidation. Two cores that both merely *read* the same line share it happily in the Shared state with zero traffic — false sharing needs a writer on at least one side, ideally both, to produce the ping-pong.',
    '`hardware_destructive_interference_size` is not guaranteed to be 64 by the standard, only to be a reasonable value for the target — some ARM parts report 128 or more because of adjacent-line prefetching. Hardcoding `64` compiles and usually works, but reading the constant is the technically correct answer in an interview.',
    '`alignas` on the *struct* aligns the struct\'s start address; it does not space out individual members. Padding two adjacent fields apart requires `alignas` on each field (or an explicit padding array between them), not one `alignas` at the top.',
    'Padding trades memory for throughput. Applying it to every field "just in case" bloats cache footprint and can make a *different* part of the program slower by evicting genuinely hot data — pad only fields you have identified as independently written and contended.',
    'A single global counter incremented by many threads is not false sharing, it is true sharing — every thread genuinely needs the same value. Padding does not help that case at all; the fix there is per-thread counters summed at the end, or accepting the contention if the counter is cold.',
  ],

  interview: {
    q: 'You split a hot loop across two threads, each one only ever touching its own element of a small array, and the two-thread version is measurably slower than one thread doing both halves sequentially. Walk me through why, and how you would confirm it.',
    a: [
      'The immediate suspicion is false sharing: the two array elements are close enough together to share a 64-byte cache line, and every write from either thread forces the cache coherence protocol to invalidate the other core\'s copy of the whole line before it can proceed. Neither thread\'s logic is wrong and neither ever reads the other\'s data — the cost is pure hardware overhead from physical proximity in memory, invisible in the source.',
      'To confirm it rather than guess, I would either check the addresses directly (`&arr[0]` and `&arr[1]` differing by less than 64 bytes is the smoking gun) or reach for `perf c2c record` / `perf c2c report` on Linux, which specifically attributes cache-line contention to source locations rather than just reporting elevated cache-miss counts generically.',
      'The fix is padding each thread\'s element out to its own cache line with `alignas(std::hardware_destructive_interference_size)`, verified by rerunning the same benchmark. The detail worth stating unprompted: this constant is not guaranteed to be exactly 64 on every target, and the padded version costs real memory — one line per field instead of a handful of bytes — so it is a trade to apply to identified hot, independently-written fields, not a reflex to sprinkle across every struct.',
    ],
  },

  exercise: [
    'Build the `false_sharing.cpp` program above with `g++ -O2 -pthread` and time it. Then insert `alignas(64)` before each `std::atomic<long>` field (or wrap each in its own padded struct) and time it again — expect a large, easily visible difference, often 10x or more depending on core topology.',
    'If you are on Linux with `perf` available, run `perf c2c record -- ./false_sharing` on the unpadded version, then `perf c2c report`. Find the line in the report that names your struct and shows it as a hot HITM (hit-modified) cache line — that is the tool doing exactly what you just reasoned through by hand, and it is the one you will reach for when the false sharing is not this obvious.',
  ],
};
