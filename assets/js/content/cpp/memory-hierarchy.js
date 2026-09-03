import { Box, Cell, Region, Arrow, Text, Tag } from '../../viz/primitives.js';

/* ------------------------------------------------------------------
   Geometry. The array is 64 ints — exactly four 64-byte cache lines
   at 16 ints each — drawn as one persistent 4x16 grid. Every step
   only changes the TONE of cells already on screen, so the engine's
   diff makes each read visibly land on a specific cell rather than
   redrawing the whole grid.
   ------------------------------------------------------------------ */
const GRID = { x: 96, y: 156, cellW: 30, cellH: 24, rowGap: 8 };
const ROWS = 4;
const COLS = 16;
const rowY = (r) => GRID.y + r * (GRID.cellH + GRID.rowGap);
const cellX = (c) => GRID.x + c * GRID.cellW;

/* State of every one of the 64 cells: 'blank' (never read), 'hit',
   'miss', or 'wasted' (fetched into the line, never actually read). */
const grid = (state) =>
  Array.from({ length: ROWS * COLS }, (_, i) => {
    const r = Math.floor(i / COLS);
    const c = i % COLS;
    const st = state[i] ?? 'blank';
    const tone = { blank: 'neutral', hit: 'hit', miss: 'miss', wasted: 'moved', asked: 'highlight' }[st];
    const value = st === 'hit' || st === 'asked' ? '✓' : st === 'miss' ? '✗' : '';
    return Cell({
      key: `c.${i}`,
      x: cellX(c),
      y: rowY(r),
      w: GRID.cellW - 2,
      h: GRID.cellH,
      value,
      tone,
      dashed: st === 'miss',
      opacity: st === 'wasted' ? 0.4 : 1,
    });
  });

const rowLabels = () =>
  Array.from({ length: ROWS }, (_, r) =>
    Text({
      key: `rl.${r}`,
      x: GRID.x - 10,
      y: rowY(r) + GRID.cellH / 2,
      text: `LINE ${r}`,
      size: 9.5,
      anchor: 'end',
      mono: true,
      opacity: 0.55,
    })
  );

/* Address decomposition: one example address split into tag, index
   and offset, with the index visibly pointing at the row it selects. */
const ADDR = { x: 170, y: 62, w: 380, h: 32 };
const addrStrip = (rowSelected, label) => {
  const tagW = 220;
  const idxW = 60;
  const offW = 100;
  const idxX = ADDR.x + tagW;
  const shapes = [
    Box({ key: 'addr.tag', x: ADDR.x, y: ADDR.y, w: tagW, h: ADDR.h, label: 'TAG', sub: 'which line, in general', labelSize: 11, mono: true },),
    Box({ key: 'addr.idx', x: idxX, y: ADDR.y, w: idxW, h: ADDR.h, label: 'INDEX', tone: 'highlight', labelSize: 11, mono: true }),
    Box({ key: 'addr.off', x: idxX + idxW, y: ADDR.y, w: offW, h: ADDR.h, label: 'OFFSET', sub: 'byte within the line', labelSize: 11, mono: true }),
    Text({ key: 'addr.cap', x: ADDR.x, y: ADDR.y - 14, text: `one address, decomposed — reading ${label}`, size: 10.5, opacity: 0.6 }),
  ];
  if (rowSelected !== null) {
    shapes.push(
      Arrow({
        key: 'addr.arrow',
        from: [idxX + idxW / 2, ADDR.y + ADDR.h],
        to: [GRID.x - 16, rowY(rowSelected) + GRID.cellH / 2],
        shape: 'elbow',
        tone: 'highlight',
        label: 'selects the row',
      })
    );
  }
  return shapes;
};

/* The latency ladder: five boxes, one per level, with the level that
   served the current access thickened and coloured. */
const LEVELS = [
  { key: 'reg', label: 'REGISTER', sub: '< 1 cycle' },
  { key: 'l1', label: 'L1', sub: '~1ns (4 cy) 32KB' },
  { key: 'l2', label: 'L2', sub: '~4ns (12 cy) 1MB' },
  { key: 'l3', label: 'L3', sub: '~15ns (40 cy) shared' },
  { key: 'dram', label: 'DRAM', sub: '~100ns (300 cy)' },
];
const LADDER_Y = 300;
const ladder = (activeKey) =>
  LEVELS.map((lv, i) =>
    Box({
      key: `lv.${lv.key}`,
      x: 40 + i * 130,
      y: LADDER_Y,
      w: 118,
      h: 46,
      label: lv.label,
      sub: lv.sub,
      tone: activeKey === lv.key ? 'highlight' : 'neutral',
      thick: activeKey === lv.key,
      labelSize: 11.5,
    })
  );

const counter = (hits, misses, wasted) =>
  Tag({
    key: 'counter',
    x: 40,
    y: 362,
    text: `hits: ${hits}   misses: ${misses}${wasted !== undefined ? `   fetched-but-unused: ${wasted}` : ''}`,
    tone: 'neutral',
    w: 340,
  });

export default {
  oneLiner:
    'Why the same read can cost one cycle or three hundred, depending only on where the byte already happens to be sitting.',

  whyJob:
    'Cache behaviour, not raw instruction count, decides the speed of almost every hot loop in trading and ML infrastructure. It is the single most-asked systems question because it separates people who think in cycles from people who think in cache lines.',

  mentalModel:
    'A register is an ingredient already in your hand. L1 is the counter in front of you. L2 is the fridge across the kitchen. L3 is the pantry down the hall, shared with your housemates. DRAM is a delivery that has to be driven over from the store. And here is the part that matters: when you walk to the fridge for one egg, you *carry back the whole shelf* — the other eleven eggs on it arrive for free, whether you asked for them or not.',

  scene: {
    id: 'cache-lines',
    title: 'One array, two access patterns',
    width: 720,
    height: 400,
    legend: [
      { tone: 'hit', label: 'hit — resident, served from cache' },
      { tone: 'miss', label: 'miss — not resident, round trip required' },
      { tone: 'moved', label: 'fetched into the line, never read' },
    ],
    steps: [
      {
        say: 'Sixty-four ints, sitting in DRAM, drawn as four rows of sixteen — each row is exactly one 64-byte cache line. A register access is a fraction of a cycle; everything else has to be found first, and finding it costs real, measured time.',
        mark: ['9'],
        shapes: () => [...rowLabels(), ...grid([]), ...addrStrip(null, 'nothing yet'), ...ladder(null), counter(0, 0)],
      },
      {
        say: '`arr[0]` is read for the first time. Its address decomposes into a tag, an index that names which of the four lines it belongs to, and an offset within that line — and the index points at line 0, which is empty. Nothing to find there: this is a miss, and the request falls all the way through to DRAM.',
        mark: ['13'],
        shapes: () => [
          ...rowLabels(),
          ...grid(Array(64).fill('blank').map((v, i) => (i === 0 ? 'miss' : v))),
          ...addrStrip(0, 'arr[0]'),
          ...ladder('dram'),
          counter(0, 1),
        ],
      },
      {
        say: 'The answer that comes back is not one int — it is the entire 64-byte line, `arr[0]` through `arr[15]`, because that is the smallest unit DRAM and every cache level ever move in. All sixteen are now resident in L1, whether they were asked for or not.',
        mark: ['13'],
        predict: {
          ask: 'After the miss on `arr[0]` fills line 0, what happens when the loop goes on to read `arr[1]` through `arr[15]`?',
          options: [
            { label: 'Each is its own miss — only the requested byte was ever fetched', correct: false },
            { label: 'All fifteen are hits — they arrived for free with `arr[0]`', correct: true },
            { label: 'Half are hits, half are misses, depending on alignment', correct: false },
          ],
          because:
            'A cache line is the unit of transfer, not a byte. Reading `arr[0]` pulled bytes 0 through 63 into L1 as one block, so `arr[1..15]` are already sitting there. This is spatial locality, and it is the entire reason sequential access is fast: one trip to DRAM buys sixteen reads.',
        },
        shapes: () => [
          ...rowLabels(),
          ...grid(Array.from({ length: 64 }, (_, i) => (i === 0 ? 'asked' : i < 16 ? 'hit' : 'blank'))),
          ...addrStrip(0, 'arr[1..15]'),
          ...ladder('l1'),
          counter(15, 1),
        ],
      },
      {
        say: 'The scan reaches `arr[16]`, the first int of line 1. New line, same story: a fresh miss, then fifteen more free hits as the rest of line 1 comes along with it.',
        mark: ['13'],
        shapes: () => [
          ...rowLabels(),
          ...grid(Array.from({ length: 64 }, (_, i) => (i < 16 ? 'hit' : i < 32 ? 'hit' : 'blank'))),
          ...addrStrip(1, 'arr[16..31]'),
          ...ladder('l1'),
          counter(30, 2),
        ],
      },
      {
        say: 'Lines 2 and 3 cost the same again. Across all 64 elements the sequential scan pays for DRAM exactly four times — once per line — and every other read is served from L1.',
        mark: ['13'],
        shapes: () => [
          ...rowLabels(),
          ...grid(Array(64).fill('hit')),
          ...addrStrip(3, 'arr[48..63]'),
          ...ladder('l1'),
          counter(60, 4),
        ],
      },
      {
        say: 'Same 64 elements, now read with a stride of 16 — `arr[0]`, `arr[16]`, `arr[32]`, `arr[48]` — the first int of every line and nothing else. Reset the grid: nothing is resident yet.',
        mark: ['17'],
        shapes: () => [...rowLabels(), ...grid([]), ...addrStrip(null, 'nothing yet'), ...ladder(null), counter(0, 0)],
      },
      {
        say: 'Every one of the four reads is the first touch of a brand-new line, so every one of them misses. The other fifteen values in each line — sixty bytes out of every sixty-four fetched — are pulled in and then simply never looked at.',
        mark: ['17'],
        predict: {
          ask: 'With a stride equal to one full cache line, what fraction of reads miss — no matter how large the array grows?',
          options: [
            { label: 'About 6%, same as the sequential scan', correct: false },
            { label: 'Around 50%', correct: false },
            { label: '100% — every single read lands in a line never touched before', correct: true },
          ],
          because:
            'This is not a quirk of a small four-line example. When the stride equals the line size, every access is guaranteed to be the first — and only — touch of its line, forever, regardless of array length. Sequential access amortises one miss over sixteen reads; this pattern amortises it over none.',
        },
        shapes: () => [
          ...rowLabels(),
          ...grid(
            Array.from({ length: 64 }, (_, i) =>
              i === 0 || i === 16 || i === 32 || i === 48 ? 'miss' : i < 49 ? 'wasted' : 'blank'
            )
          ),
          ...addrStrip(3, 'arr[0], arr[16], arr[32], arr[48]'),
          ...ladder('dram'),
          counter(0, 4, 240),
        ],
      },
      {
        say: 'Same code shape, same 64 elements, same number of reads. Sequential: four misses, sixty hits. Strided by one line: four misses, zero hits, 240 bytes fetched and thrown away unread. The only thing that changed is the order the bytes were touched in.',
        mark: ['13', '17'],
        focus: ['counter'],
        shapes: () => [
          ...rowLabels(),
          ...grid(
            Array.from({ length: 64 }, (_, i) =>
              i === 0 || i === 16 || i === 32 || i === 48 ? 'miss' : i < 49 ? 'wasted' : 'blank'
            )
          ),
          ...addrStrip(3, 'arr[0], arr[16], arr[32], arr[48]'),
          ...ladder('dram'),
          counter(0, 4, 240),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'stride.cpp',
    source: `#include <chrono>
#include <cstdio>
#include <vector>

constexpr int N = 1 << 26;       // 64M ints, 256MB — far bigger than any cache
constexpr int STRIDE = 16;       // 16 ints = 64 bytes = one cache line

int main() {
    std::vector<int> arr(N, 1);

    auto t0 = std::chrono::steady_clock::now();
    long long seq = 0;
    for (int i = 0; i < N; ++i) seq += arr[i];              // sequential
    auto t1 = std::chrono::steady_clock::now();

    long long str = 0;
    for (int i = 0; i < N; i += STRIDE) str += arr[i];      // one touch per line
    auto t2 = std::chrono::steady_clock::now();

    double seqNs = std::chrono::duration<double, std::nano>(t1 - t0).count() / N;
    double strNs = std::chrono::duration<double, std::nano>(t2 - t1).count() / (N / STRIDE);

    printf("sequential: %.2f ns/element  sum=%lld\\n", seqNs, seq);
    printf("strided:    %.2f ns/element  sum=%lld\\n", strNs, str);
    return 0;
}`,
    annotations: [
      {
        lines: '5-6',
        text: 'The array is deliberately far bigger than L3 (typically 8-32MB), so both loops are genuinely fetching from DRAM rather than replaying a warm cache. The stride is chosen to equal one full cache line.',
      },
      {
        lines: '13',
        text: '`arr[i]` and `arr[i+1]` are 4 bytes apart, so sixteen consecutive reads share one 64-byte fetch.',
      },
      {
        lines: '17',
        text: '`arr[i]` and `arr[i+STRIDE]` are 64 bytes apart — exactly one line — so this loop never reuses a fetch. Fewer total reads, but almost none of them are free.',
      },
    ],
  },

  deeper: [
    'The hierarchy exists because fast memory is small and cheap-per-bit memory is slow, and no single technology gives you both. A register file is a handful of transistors wired directly into the execute stage — effectively instantaneous, and there are only a few dozen of them. SRAM, used for L1 through L3, trades density for speed: L1 is typically 32-48KB per core and answers in about a nanosecond; L2 is a few hundred KB to a couple of MB per core at three to four times that latency; L3 is several to tens of megabytes, shared across all cores on the chip, at ten to fifteen nanoseconds. DRAM holds gigabytes cheaply but is physically further away and electrically slower to access, at roughly 100 nanoseconds — around 300 CPU cycles spent waiting for a value that a register would have handed over immediately.',
    'A cache line, 64 bytes on essentially every mainstream x86 and ARM chip today, is the actual unit every level of the hierarchy moves in — never a single byte, never a single int. This is what makes spatial locality free rather than merely convenient: touching one element of a tightly packed array pulls its fifteen int-sized (or seven double-sized) neighbours into L1 as a side effect of the same fetch, at no extra cost, because the hardware was going to move those bytes regardless of whether you asked for them.',
    'Temporal locality is the other half: a value read recently is likely to still be resident when read again soon, because caches evict by recency, not by request count. A loop that revisits the same small working set — an accumulator, a lookup table that fits in L1 — pays its DRAM cost once and then runs entirely out of cache on every later pass. This is why "does it fit in cache" is not a yes/no property of a data structure; it is a property of the *access pattern*, specifically how much distinct memory gets touched between one visit to an address and the next.',
    'The address decomposition in the diagram is the simplified, direct-mapped picture: an address splits into a tag, an index that names one line slot, and an offset for the byte within that line. Real L1 caches are set-associative, typically 8-way, meaning the index selects a *set* of several candidate lines and all of their tags are checked in parallel — this is what lets two frequently used addresses that happen to share an index coexist instead of evicting each other on every access, at the cost of a small amount of extra comparison hardware per lookup.',
    'Hardware stream prefetchers can detect a simple, constant stride and start fetching ahead of the demand access, which narrows but does not remove the gap the diagram shows — they still cannot manufacture locality that is not there, they cannot help at all with an irregular or data-dependent stride like pointer chasing through a linked structure, and they compete with real demand traffic for the same memory bandwidth while doing it. Sequential access remains the pattern every prefetcher is best at, which is exactly why it stays the baseline to compare against.',
  ],

  gotchas: [
    'Treating "the cache" as one blob rather than three private-then-shared levels leads to wrong predictions: a value another thread just touched is fast for *that* thread\'s L1, but this thread still has to go find it, typically from L3 or by snooping the other core\'s cache — not instantly.',
    'A working set that "fits in cache" by total size can still miss constantly if the access pattern jumps around inside it faster than temporal locality can help; size alone does not predict hit rate, access order does.',
    'Benchmarking cache effects at `-O0` measures the compiler\'s lack of optimization, not the hardware. Always compare at `-O2` or `-O3`, and check the assembly, because the compiler may have already reordered or vectorized the access pattern you thought you were testing.',
    'Assuming the hardware prefetcher "handles it" for any strided access is only true for small, regular strides it can lock onto quickly; a stride at or beyond the cache line size, or one that changes, defeats it just as thoroughly as random access.',
    'Reading `perf stat` cache-miss counters without pinning the process to a core, or on a busy shared machine, mixes in misses caused by other processes contending for the same L3 — pin with `taskset` before trusting the number.',
  ],

  interview: {
    q: 'You sum a 4096x4096 `int` matrix two ways — `for (i) for (j) sum += m[i][j];` and the loops swapped, `for (j) for (i) sum += m[i][j];`. Same additions, same total memory touched. Why is one roughly an order of magnitude slower?',
    a: [
      'C++ arrays are row-major: `m[i][j]` and `m[i][j+1]` sit 4 bytes apart in memory. The `i`-outer, `j`-inner loop walks memory sequentially, so it is the pattern from the first half of this lesson — one miss buys sixteen free hits, roughly a 94% hit rate.',
      'Swap the loops and consecutive accesses become `m[i][j]` then `m[i+1][j]` — 4096 columns times 4 bytes apart, which is 16KB, far more than one cache line and typically larger than L1 itself. Every single access is a first touch to a new line; the working set for one column pass is the whole 16MB matrix, which does not fit in any level below DRAM. This is the strided pattern from the diagram, just with a bigger stride and a real matrix behind it instead of four toy lines.',
      'The number worth stating out loud: with 64-byte lines, the good order does roughly 16x less memory traffic for identical arithmetic. I would confirm it with `perf stat -e cache-misses,LLC-load-misses` on both versions rather than asserting it, and I\'d mention that this is also exactly the bug tiling and blocked matrix multiplication exist to fix at a larger scale.',
    ],
  },

  exercise: [
    'Build the file above with `g++ -O2 -o stride stride.cpp` and run it — you should see the strided pass report several times the nanoseconds-per-element of the sequential one, on identical hardware, identical data. Then run `perf stat -e cache-references,cache-misses,LLC-load-misses ./stride` and read the miss rate for each phase.',
    'Change `STRIDE` to 1, 4 and 32 and rerun. Watch the ns/element climb as the stride approaches and then exceeds the line size, and notice it does not keep climbing forever — once the stride is at least one line wide, every access is already a full miss, and a bigger stride cannot make a 100% miss rate any worse.',
    'Swap the loop order in a small hand-written `m[i][j]` sum over a matrix around 4096x4096 and confirm the effect from the interview question yourself, with real numbers on your own machine.',
  ],
};
