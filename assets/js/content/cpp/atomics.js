import { Region, Box, Cell, Arrow, Text, Tag } from '../../viz/primitives.js';

/* ------------------------------------------------------------------
   Two lanes, mirroring the layout of the data-races scene so the two
   lessons read as a pair. A single edge — the release/acquire arrow —
   is the entire lesson; every other shape exists to give that edge
   somewhere to land.
   ------------------------------------------------------------------ */
const LANE_A = { x: 36, y: 112, w: 304, h: 290 };
const LANE_B = { x: 380, y: 112, w: 304, h: 290 };
const OP_W = 232;
const A_X = 52;
const B_X = 396;
const ROW1 = 176;
const ROW2 = 226;

const lanes = () => [
  Region({ ...LANE_A, key: 'laneA', label: 'THREAD A — publishes', tone: 'stack' }),
  Region({ ...LANE_B, key: 'laneB', label: 'THREAD B — subscribes', tone: 'stack' }),
];

const header = (dataVal, dataTone, readyVal, readyTone) => [
  Text({ key: 'hdr', x: 360, y: 18, text: 'shared state', size: 10, anchor: 'middle', mono: true, opacity: 0.5 }),
  Cell({ key: 'dataCell', x: 226, y: 32, w: 100, h: 42, name: 'data', sub: 'plain int', value: dataVal, tone: dataTone }),
  Cell({ key: 'readyCell', x: 394, y: 32, w: 110, h: 42, name: 'ready', sub: 'atomic<bool>', value: readyVal, tone: readyTone }),
];

const op = (key, x, y, label, tone = 'neutral', dashed = false) =>
  Box({ key, x, y, w: OP_W, h: 40, label, labelSize: 11.5, mono: true, tone, dashed });

export default {
  oneLiner:
    'What `std::atomic` actually promises — indivisible operations — and the separate promise, ordering, that most of the failure modes come from.',

  whyJob:
    'Every lock-free structure in a low-latency system leans on exactly one pattern: a release store paired with an acquire load. Interviewers ask you to name the ordering and justify it, not just recite "use atomic" — getting relaxed and acquire confused is the fastest way to reveal you memorised the keyword without the model.',

  mentalModel:
    'A release store is *sealing a box and putting a note on the shelf*: "everything I did before this is safe to read now." An acquire load is *reading that note before you touch the box*. If you never read the note — if you just grab the box (relaxed) — nothing stops you from seeing an empty box that was filled five nanoseconds after you looked. Atomicity guarantees the note itself cannot be read half-written; ordering is the separate, stronger promise about *what else* becomes visible when you read it.',

  scene: {
    id: 'release-acquire',
    title: 'One store, one load, one edge between two threads',
    width: 720,
    height: 420,
    legend: [
      { tone: 'highlight', label: 'currently executing / the edge' },
      { tone: 'owned', label: 'safely visible' },
      { tone: 'freed', label: 'stale — no ordering guarantee' },
    ],
    steps: [
      {
        say: 'Two threads share an ordinary `int data` and one `std::atomic<bool> ready` used purely as a signal. Nothing about `data` is special — it is `ready` that will do all the work.',
        mark: ['5', '6'],
        shapes: () => [
          ...header('0', 'neutral', 'false', 'neutral'),
          ...lanes(),
          op('dataWrite', A_X, ROW1, 'data = 42;'),
          op('relStore', A_X, ROW2, 'ready.store(true, release);'),
          op('acqLoad', B_X, ROW1, 'while (!ready.load(acquire));'),
          op('readData', B_X, ROW2, 'printf(data);', 'neutral', true),
        ],
      },
      {
        say: 'Thread A writes 42 into `data`. This store is completely ordinary — nothing here stops the compiler or the CPU from delaying when, or whether, another core can see it.',
        mark: ['9'],
        focus: ['dataWrite', 'dataCell'],
        shapes: () => [
          ...header('42', 'highlight', 'false', 'neutral'),
          ...lanes(),
          op('dataWrite', A_X, ROW1, 'data = 42;', 'highlight'),
          op('relStore', A_X, ROW2, 'ready.store(true, release);'),
          op('acqLoad', B_X, ROW1, 'while (!ready.load(acquire));'),
          op('readData', B_X, ROW2, 'printf(data);', 'neutral', true),
        ],
      },
      {
        say: 'A stores `true` into `ready` with `memory_order_release`. That single store does two jobs: it publishes its own new value, and it stamps every ordinary write before it in program order — including `data = 42` — as safe to hand off.',
        mark: ['10'],
        focus: ['relStore', 'readyCell', 'dataCell'],
        shapes: () => [
          ...header('42', 'owned', 'true', 'highlight'),
          ...lanes(),
          op('dataWrite', A_X, ROW1, 'data = 42;', 'owned'),
          op('relStore', A_X, ROW2, 'ready.store(true, release);', 'highlight'),
          op('acqLoad', B_X, ROW1, 'while (!ready.load(acquire));'),
          op('readData', B_X, ROW2, 'printf(data);', 'neutral', true),
        ],
      },
      {
        say: 'B\'s acquire load finally reads `true`. The moment it does, a synchronizes-with edge exists between A\'s release and this exact load — and that edge is what drags "data = 42" into "happened before" B\'s next line, not any property of `data` itself.',
        mark: ['10', '14'],
        predict: {
          ask: 'B\'s acquire load just read `true`. What does the standard guarantee about the value B will see when it next reads `data`?',
          options: [
            { label: 'Nothing — `data` is a plain int, so it is still undefined across threads', correct: false },
            { label: 'B is guaranteed to see 42, even though `data` is not atomic', correct: true },
            { label: 'B might see a torn, half-written value of `data`', correct: false },
          ],
          because:
            'Atomicity only ever protects `ready` itself. The guarantee about `data` comes entirely from the happens-before edge: a release synchronizes-with the acquire that observes its value, and that edge carries every ordinary write before the release into "happened before" every ordinary read after the acquire. This is the whole mechanism — it is not that `data` became special, it is that an edge now connects the two sides.',
        },
        focus: ['relStore', 'acqLoad', 'edge', 'shadeA', 'shadeB'],
        shapes: () => [
          ...header('42', 'owned', 'true', 'owned'),
          ...lanes(),
          Box({ key: 'shadeA', x: 44, y: 160, w: 248, h: 112, tone: 'owned', dashed: true, opacity: 0.35 }),
          Box({ key: 'shadeB', x: 388, y: 160, w: 248, h: 112, tone: 'owned', dashed: true, opacity: 0.35 }),
          op('dataWrite', A_X, ROW1, 'data = 42;', 'owned'),
          op('relStore', A_X, ROW2, 'ready.store(true, release);', 'highlight'),
          op('acqLoad', B_X, ROW1, 'while (!ready.load(acquire));', 'highlight'),
          op('readData', B_X, ROW2, 'printf(data);', 'neutral', true),
          Arrow({
            key: 'edge', from: [284, 246], to: [396, 196], shape: 'curve', bend: -60,
            tone: 'highlight', thick: true, label: 'synchronizes-with',
          }),
        ],
      },
      {
        say: 'B reads `data` and gets 42 — guaranteed, not merely likely. B never touched `data` with an atomic operation; every bit of the ordering came from the `ready` handshake alone.',
        mark: ['16'],
        shapes: () => [
          ...header('42', 'owned', 'true', 'owned'),
          ...lanes(),
          op('dataWrite', A_X, ROW1, 'data = 42;', 'owned'),
          op('relStore', A_X, ROW2, 'ready.store(true, release);', 'owned'),
          op('acqLoad', B_X, ROW1, 'while (!ready.load(acquire));', 'owned'),
          op('readData', B_X, ROW2, 'printf(data);', 'owned'),
          Arrow({
            key: 'edge', from: [284, 246], to: [396, 196], shape: 'curve', bend: -60,
            tone: 'owned', thick: true, label: 'synchronizes-with',
          }),
          Tag({ key: 'safe', x: 500, y: 260, text: 'reads 42, always', tone: 'owned' }),
        ],
      },
      {
        say: 'Now the same code with both orderings weakened to `memory_order_relaxed`. `ready` is still atomic — B will still eventually see `true` — but there is no synchronizes-with edge any more, and nothing forces A\'s write to `data` to arrive on schedule.',
        mark: [],
        focus: ['relStore', 'acqLoad', 'noEdge', 'bView'],
        shapes: () => [
          ...header('42', 'neutral', 'true', 'owned'),
          ...lanes(),
          op('dataWrite', A_X, ROW1, 'data = 42;', 'neutral'),
          op('relStore', A_X, ROW2, 'ready.store(true, relaxed);', 'neutral'),
          op('acqLoad', B_X, ROW1, 'while (!ready.load(relaxed));', 'owned'),
          op('readData', B_X, ROW2, 'printf(data);', 'freed', true),
          Cell({ key: 'bView', x: 396, y: 290, w: 130, h: 40, name: "B's read of data", value: '0', tone: 'freed' }),
          Tag({ key: 'noEdge', x: 300, y: 190, text: 'no happens-before edge', tone: 'freed' }),
          Tag({ key: 'stale', x: 386, y: 342, text: 'stale, torn, or eventually 42 — unordered', tone: 'freed' }),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'atomics.cpp',
    source: `#include <atomic>
#include <cstdio>
#include <thread>

int data = 0;                        // plain int, not atomic
std::atomic<bool> ready{false};

void producer() {
    data = 42;                                    // 1. ordinary write
    ready.store(true, std::memory_order_release);  // 2. publish
}

void consumer() {
    while (!ready.load(std::memory_order_acquire)) // 3. subscribe
        ;                                          // spin
    printf("%d\\n", data);            // guaranteed to see 42
}

int main() {
    std::thread p(producer);
    std::thread c(consumer);
    p.join();
    c.join();
}`,
    annotations: [
      { lines: '5-6', text: '`data` is a plain int; `ready` is the only atomic. The lesson is that ordering on `ready` ends up protecting `data` too — atomicity and ordering are separate promises.' },
      { lines: '9-10', text: 'Order matters here: the plain write happens first, the release happens second. Swap them and the release would publish nothing worth reading.' },
      { lines: '14', text: 'The acquire load is only meaningful when it actually reads the value the release wrote. An acquire load that reads a stale `false` has synchronized with nothing yet.' },
      { lines: '16', text: 'This read of `data` is not atomic and does not need to be — its safety is inherited entirely from the release/acquire pair above it.' },
    ],
  },

  deeper: [
    'An atomic operation guarantees two things and only two things: it cannot be observed half-done (no torn reads or writes), and a read-modify-write like `fetch_add` happens as one indivisible step even under contention. Neither of those says anything about *when* another thread sees the result, or what else becomes visible alongside it — that second question is entirely the job of the memory order argument, and it is a separate axis from atomicity.',
    'The six orderings collapse to three ideas in practice. `relaxed` gives you atomicity only — no torn values, no ordering guarantee about anything else. `acquire` (on a load) and `release` (on a store) are a matched pair that create a one-directional happens-before edge, exactly as drawn above; `acq_rel` is both roles at once, used on a read-modify-write that both reads and writes the same atomic. `seq_cst` is the default for a reason: it adds a single global total order over every seq_cst operation in the program, so you cannot reason yourself into a contradiction, at the cost of a real fence on weaker hardware.',
    'On x86-64 this is almost free: stores and loads are already strongly ordered by the hardware (total store order), so a `release` store and an `acquire` load compile to the exact same plain `mov` instructions as `relaxed` ones would — the ordering is enforced by the CPU for free, and the compiler\'s job is only to stop *itself* from reordering across the operation. `seq_cst` costs a little more on x86 (typically a store gets an `mfence` or becomes a `lock`-prefixed instruction). On ARM or POWER the difference is not free at all: acquire and release compile to real fence instructions (`ldar`/`stlr` on ARM), and relaxed genuinely is cheaper. Code that "just works" on your x86 laptop and breaks on an ARM server is very often a missing acquire/release that x86\'s strong default silently covered for.',
    'The practical rule interviewers want to hear: default to `seq_cst` until you have a specific, measured reason not to — it is never wrong, only sometimes slower. Reach for `acquire`/`release` once you can name the exact pair of operations that must synchronize, as in the diagram above. Reach for `relaxed` only when you need a number to be atomic — a statistics counter, a reference count where you never act on the observation — and you can prove nothing else depends on ordering relative to it.',
    'A compare-and-swap operation like `compare_exchange_weak` takes two orderings, one for success and one for failure, because a failed CAS did not modify memory and does not need to publish anything — a common mistake is passing the same strong ordering to both and paying for a fence that a failed attempt never needed.',
  ],

  gotchas: [
    '"Relaxed is faster" is only true insofar as it removes fence instructions on weak hardware; on x86 it usually compiles to the identical instruction as acquire/release, so choosing relaxed for a supposed speed win without checking the ordering requirement is a bug wearing a performance justification.',
    'Release and acquire only synchronize with each other when the acquire actually reads the value the release wrote. An acquire load that reads an older value, or a release that nobody ever acquires, forms no edge at all — the pairing is about the specific runtime read, not the presence of the keywords in the source.',
    'Mixing an atomic flag with a non-atomic payload is only safe if every write to the payload happens-before the release and every read of the payload happens-after the matching acquire. Reordering the store and the release — or reading the payload before checking the flag — reintroduces the exact data race the atomic was meant to prevent.',
    '`seq_cst` gives you a single total order across all seq_cst operations, but that guarantee evaporates the instant you mix in a relaxed or acquire/release operation on the same variable — do not assume seq_cst reasoning extends to weaker accesses of the same atomic.',
    'A spin loop on `load(memory_order_relaxed)` is not the same bug as a spin on a plain non-atomic bool — the atomic load cannot be hoisted out of the loop by the compiler, because the standard requires it to actually observe memory each time. Do not diagnose it as the compiler-hoisting bug from the data races lesson; it is a genuinely different failure, a missing ordering guarantee about *other* memory.',
  ],

  interview: {
    q: 'Why does a spin lock built as `while (!flag.load(std::memory_order_acquire)) {}` followed by reading shared data need the acquire — wouldn\'t relaxed be enough, since `flag` is atomic either way?',
    a: [
      'Relaxed would keep `flag` itself correctly atomic — no torn reads, the spin loop still terminates once the other thread sets it — but atomicity of the flag was never the problem being solved. The reason for the acquire is everything *else*: the data the flag is guarding. Without the acquire pairing with a release on the writer\'s side, there is no happens-before edge, and the writes the other thread made before setting the flag are not guaranteed to be visible once the spin exits.',
      'The detail that separates a memorised answer from an understood one is naming the specific pairing: it is not "acquire is safer," it is "this acquire load, if it reads the value written by a specific release store, creates a synchronizes-with edge to that exact store, and drags every ordinary write before that store into happens-before every ordinary read after this load." Change either side to relaxed and the edge disappears even though both operations remain individually atomic.',
      'Worth adding unprompted: on x86-64 this distinction is often invisible in the generated assembly, because acquire/release and relaxed loads of a bool compile to the same `mov`. The bug would only surface on weaker hardware (ARM, POWER) or under aggressive compiler reordering — which is exactly why relaxed-when-you-needed-acquire is a bug that survives code review and CI on x86 and then reproduces in production on different silicon.',
    ],
  },

  exercise: [
    'Build the `atomics.cpp` program above and confirm it prints 42 every time. Then change both orderings to `memory_order_relaxed`, rebuild, and run it in a loop a few hundred times — on x86 you will likely never see it fail, which is itself the point: the bug is real but the hardware is hiding it from you locally.',
    'Open the release/acquire and the relaxed versions side by side in Compiler Explorer (godbolt.org) targeting both `x86-64 gcc` and `ARM64 gcc`. On x86-64 the release store and the relaxed store should compile to the identical `mov`. On ARM64 they will not — the release store gets `stlr` and the relaxed store gets a plain `str`. Seeing that difference in real generated assembly is what turns "ARM is weaker" from a fact you repeat into something you have watched happen.',
  ],
};
