import { Region, Cells, Box, Frame, Arrow, Bracket, Text, Tag } from '../../viz/primitives.js';

/* ------------------------------------------------------------------
   The array is drawn to scale in the only dimension that matters:
   sixteen 4-byte ints, laid end to end with no gap, come to exactly
   64 bytes — one cache line. The bracket in step 4 is therefore not
   a decoration, it is the same width as the array.
   ------------------------------------------------------------------ */
const ARR = { x: 36, y: 80, w: 640, h: 36 };
const CELL_W = 40;
const cellCx = (i) => ARR.x + i * CELL_W + CELL_W / 2;
const SQUARES = [0, 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225];
const AKEYS = SQUARES.map((_, i) => `a.${i}`);

/* Ten heap nodes holding the first ten of the same values. The
   positions are deliberately unhelpful — that is what "scattered"
   means, and the address order is not the traversal order. */
const NODES = [
  { key: 'n0', x: 64, y: 232, v: '0' },
  { key: 'n1', x: 300, y: 212, v: '1' },
  { key: 'n2', x: 146, y: 302, v: '4' },
  { key: 'n3', x: 474, y: 250, v: '9' },
  { key: 'n4', x: 238, y: 352, v: '16' },
  { key: 'n5', x: 604, y: 214, v: '25' },
  { key: 'n6', x: 386, y: 330, v: '36' },
  { key: 'n7', x: 62, y: 356, v: '49' },
  { key: 'n8', x: 516, y: 356, v: '64' },
  { key: 'n9', x: 612, y: 296, v: '81' },
];
const NODE_W = 54;
const NODE_H = 34;
const nodeCx = (n) => n.x + NODE_W / 2;
const nodeCy = (n) => n.y + NODE_H / 2;
const NKEYS = NODES.map((n) => n.key).concat(
  NODES.slice(0, -1).map((_, i) => `hop${i}`)
);

const arrayRegion = () =>
  Region({
    key: 'arr',
    x: 28,
    y: 44,
    w: 664,
    h: 136,
    label: 'int a[16]  —  ONE ALLOCATION, ADDRESSES CONSECUTIVE BY CONSTRUCTION',
    tone: 'stack',
  });

const arrayCells = (tone = 'owned', overrides = {}) =>
  Cells({
    key: 'a',
    x: ARR.x,
    y: ARR.y,
    w: CELL_W,
    h: ARR.h,
    gap: 0,
    tone,
    addrStart: 0x1000,
    addrStep: 4,
    values: SQUARES.map((v, i) =>
      overrides[i] ? { value: String(v), ...overrides[i] } : String(v)
    ),
  });

const listRegion = () =>
  Region({
    key: 'lst',
    x: 28,
    y: 196,
    w: 664,
    h: 216,
    label: 'THE SAME VALUES IN A LINKED LIST  —  ONE ALLOCATION EACH, SCATTERED',
    tone: 'heap',
  });

const listNodes = (tone = 'heap') =>
  NODES.map((n) =>
    Box({
      key: n.key,
      x: n.x,
      y: n.y,
      w: NODE_W,
      h: NODE_H,
      label: n.v,
      tone,
      labelSize: 12,
      mono: true,
    })
  );

const listHops = (tone = 'miss') =>
  NODES.slice(0, -1).map((n, i) =>
    Arrow({
      key: `hop${i}`,
      from: [nodeCx(n), nodeCy(n)],
      to: [nodeCx(NODES[i + 1]), nodeCy(NODES[i + 1])],
      shape: 'straight',
      bend: 0,
      tone,
    })
  );

export default {
  oneLiner:
    'Why laying data out end to end beats a cleverer algorithm on modern hardware, and what you lose when an array decays.',

  whyJob:
    'Every low-latency shop will ask why a `std::vector` outruns a `std::list` even when the list has better asymptotics. The answer is the cache line, and a candidate who can draw it gets the offer.',

  mentalModel:
    'A contiguous array is a tape measure: to find element six you *compute* where it is — `base + 6 × 4` — and go straight there. A linked list is a treasure hunt where each clue holds the location of the next; you cannot read clue six until you have read clue five. The machine does not care about your big-O; it cares that *it can only guess the next address when the addresses are predictable*.',

  scene: {
    id: 'contiguity',
    title: 'One hop versus nine, and what a cache line pays for',
    width: 720,
    height: 440,
    legend: [
      { tone: 'owned', label: 'contiguous array' },
      { tone: 'heap', label: 'separately allocated nodes' },
      { tone: 'hit', label: 'already in L1 — free' },
      { tone: 'miss', label: 'a fetch from RAM, ~80–100 ns' },
    ],
    steps: [
      {
        say: 'Sixteen ints in a row. There is no index structure and no header — the layout *is* the index. Each address is four higher than the last because the compiler put them there, and that fact is what everything below is built on.',
        mark: ['20-21'],
        shapes: () => [arrayRegion(), ...arrayCells()],
      },
      {
        say: 'Indexing is arithmetic, not searching. The compiler emits one multiply and one add, and on x86 both fold into a single addressing mode: `mov eax, [rdi + rsi*4]`. There is no version of this that gets faster, because there is nothing left to remove.',
        mark: ['25'],
        focus: ['arr', 'a.6', 'formula', 'fx'],
        shapes: () => [
          arrayRegion(),
          ...arrayCells('owned', { 6: { tone: 'highlight' } }),
          Text({
            key: 'formula',
            x: 300,
            y: 226,
            text: 'a[6]   =   *(0x1000 + 6 * 4)   =   *0x1018',
            size: 14,
            mono: true,
            weight: 700,
            tone: 'highlight',
            anchor: 'middle',
          }),
          Arrow({
            key: 'fx',
            from: [cellCx(6), 208],
            to: [cellCx(6), 134],
            shape: 'straight',
            bend: 0,
            tone: 'highlight',
            thick: true,
          }),
        ],
      },
      {
        say: 'The same numbers, one `new` per node. Reaching the tenth value takes nine dependent loads: the address of node five is *inside* node four, so the CPU cannot start load five until load four has come back. The stalls cannot overlap.',
        mark: [],
        focus: ['lst', ...NKEYS],
        shapes: () => [
          arrayRegion(),
          ...arrayCells(),
          listRegion(),
          ...listNodes(),
          ...listHops(),
          Tag({ key: 'hops', x: 566, y: 402, text: '9 dependent loads', tone: 'miss' }),
        ],
      },
      {
        predict: {
          ask: 'You have just read `a[0]`, and it was a cache miss. How many of the other fifteen elements now have to be fetched from RAM?',
          options: [
            { label: 'All fifteen — each one is a separate load', correct: false },
            { label: 'Three more, one per 16 bytes', correct: false },
            { label: 'None. All sixteen arrived together', correct: true },
          ],
          because:
            'The smallest thing the CPU can move between RAM and L1 is a 64-byte cache line. Sixteen ints is exactly 64 bytes, so one miss brings the entire array. The other fifteen loads hit L1 at about 4 cycles each. You did not make them fast — you got them for free by putting them next to each other.',
        },
        say: 'This is the whole argument. The hardware never fetches four bytes; it fetches 64. Paying once for the line and then using all of it is what "cache friendly" means, and it is a property of your data layout, not of your loop.',
        mark: ['23'],
        focus: ['arr', 'line', 'oneline', ...AKEYS],
        shapes: () => [
          arrayRegion(),
          ...arrayCells('hit'),
          Bracket({
            key: 'line',
            x: ARR.x,
            y: 150,
            w: ARR.w,
            label: 'one 64-byte cache line  —  16 ints for the price of one fetch',
            tone: 'hit',
          }),
          listRegion(),
          ...listNodes(),
          ...listHops(),
        ],
      },
      {
        say: 'The list pays the same 64 bytes per node and throws most of it away — a node is 16 bytes of value and pointer, so roughly three quarters of every line is somebody else\'s data. Nine misses at ~80 ns, and they serialise, so you are looking at most of a microsecond to walk ten elements.',
        mark: ['30-32'],
        focus: ['lst', 'w0', 'w1', 'w2', 'waste', ...NKEYS],
        shapes: () => [
          arrayRegion(),
          ...arrayCells(),
          listRegion(),
          Box({ key: 'w0', x: 30, y: 222, w: 128, h: 54, tone: 'miss', dashed: true }),
          Box({ key: 'w1', x: 263, y: 202, w: 128, h: 54, tone: 'miss', dashed: true }),
          Box({ key: 'w2', x: 109, y: 292, w: 128, h: 54, tone: 'miss', dashed: true }),
          ...listNodes(),
          ...listHops(),
          Tag({ key: 'waste', x: 500, y: 402, text: '64 B fetched, 16 B used', tone: 'miss' }),
        ],
      },
      {
        say: 'Now the C++ trap. Pass the array to a function and it *decays*: the type becomes `int*` and the 16 is gone. Not "hidden" — gone. `sizeof` inside the callee reports 8, the size of the pointer, and every out-of-bounds bug you have ever heard of starts here.',
        mark: ['6', '27'],
        focus: ['arr', 'decay', 'lost', 'dtext', ...AKEYS],
        shapes: () => [
          arrayRegion(),
          ...arrayCells(),
          Box({
            key: 'decay',
            x: 210,
            y: 250,
            w: 210,
            h: 62,
            label: 'const int*',
            sub: '0x1000',
            tone: 'borrowed',
          }),
          Tag({ key: 'lost', x: 440, y: 270, text: 'length: gone', tone: 'freed' }),
          Text({
            key: 'dtext',
            x: 360,
            y: 350,
            text: 'the callee now has to be told the 16 by hand, and believe it',
            size: 12,
            anchor: 'middle',
            opacity: 0.8,
          }),
        ],
      },
      {
        say: 'A `std::span` is the fix, and it is not clever: it is a struct holding exactly the pointer and the length, passed in two registers. No allocation, no copy, no indirection — the same machine code as the raw pointer version, with the size travelling alongside so `.size()`, range-`for` and bounds-checked builds all work.',
        mark: ['13', '28'],
        focus: ['arr', 'span', 'sarrow', 'spanbr', ...AKEYS],
        shapes: () => [
          arrayRegion(),
          ...arrayCells('hit'),
          Bracket({
            key: 'spanbr',
            x: ARR.x,
            y: 150,
            w: ARR.w,
            label: 'exactly these, and the compiler knows it',
            tone: 'hit',
          }),
          Frame({
            key: 'span',
            x: 250,
            y: 250,
            w: 220,
            label: 'std::span<const int>',
            tone: 'owned',
            vars: [
              { name: 'ptr', value: '0x1000' },
              { name: 'size', value: '16', tone: 'owned' },
            ],
          }),
          Arrow({
            key: 'sarrow',
            from: [360, 246],
            to: [cellCx(0), 138],
            shape: 'curve',
            bend: -46,
            tone: 'owned',
            thick: true,
          }),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'contiguity.cpp',
    source: `#include <cstdio>
#include <span>
#include <vector>

// Decay: the array becomes a bare pointer and the length is gone.
int sum_decayed(const int* a, int n) {
    int t = 0;
    for (int i = 0; i < n; ++i) t += a[i];
    return t;
}

// A span is exactly a pointer and a length, travelling together.
int sum_span(std::span<const int> a) {
    int t = 0;
    for (int v : a) t += v;
    return t;
}

int main() {
    int a[16];
    for (int i = 0; i < 16; ++i) a[i] = i * i;

    printf("sizeof(a)     = %zu\\n", sizeof(a));
    printf("&a[0]         = %p\\n", (void*)&a[0]);
    printf("&a[6] - &a[0] = %td\\n", &a[6] - &a[0]);

    printf("%d\\n", sum_decayed(a, 16));
    printf("%d\\n", sum_span(a));

    std::vector<std::vector<int>> g(4, std::vector<int>(4));
    printf("row0 %p  row1 %p\\n",
           (void*)g[0].data(), (void*)g[1].data());
    return 0;
}`,
    annotations: [
      {
        lines: '6',
        text: 'The `16` is not in the type any more, so the `n` parameter exists purely because the language threw the length away. Every caller is now a place the wrong number can be passed.',
      },
      {
        lines: '13',
        text: 'Two words on the stack or in registers. `-O2` produces the same loop as the pointer version — the safety is free, which is the only reason to insist on it.',
      },
      {
        lines: '23',
        text: 'Prints 64 here and 8 inside `sum_decayed`. Same array, different answer, because `sizeof` sees the *type*, and the type changed at the call.',
      },
      {
        lines: '30-32',
        text: 'The two row addresses will be far apart and in no particular order. A `vector<vector<int>>` is 4 separate heap blocks plus one for the outer vector — a grid of pointers, not a grid of ints.',
      },
    ],
  },

  deeper: [
    'The hardware prefetcher is the second half of the contiguity story. When it sees two or three loads at a constant stride it starts fetching ahead, so by the time your loop reaches element 32 the line containing it is already in L1. Sequential access over an array therefore costs close to nothing beyond the memory bandwidth. A linked list defeats this completely: the stride between nodes is whatever the allocator happened to hand back, so there is no pattern to detect and every node is a fresh cold miss.',
    'The numbers are worth memorising because interviewers use them as a shibboleth. An L1 hit is about 4 cycles, L2 about 12, L3 about 40, and main memory 200–300 cycles — call it 80–100 ns. A cache line is 64 bytes on essentially every x86-64 and ARM64 part you will meet. So a linked-list traversal of a million nodes is on the order of 100 ms of pure stall, while summing a million-int vector is a few milliseconds and is limited by bandwidth, not latency.',
    '`std::vector<T>` is contiguous and guaranteed so by the standard — `&v[0] + i == &v[i]` — which is why you can hand `v.data()` to a C API or a socket. `std::vector<std::vector<T>>` is not: each inner vector owns its own separate heap block, so a 1000×1000 "matrix" is 1001 allocations, 1000 unrelated addresses, and a pointer chase on every row change. The fix is one flat `std::vector<T>` of size `rows * cols` with manual `i * cols + j` indexing, which is what every serious numerics library does.',
    '`std::span<T>` is a C++20 type, but the idea predates it by decades: it is the same pointer-plus-length pair as `std::string_view`, Rust\'s `&[T]`, and Go\'s slice header. It is a *non-owning view*, so all the lifetime rules of a raw pointer still apply — a span outliving the vector it was made from is a dangling pointer with extra steps. It is 16 bytes, trivially copyable, and passed in registers, so take it by value.',
    'Contiguity beats asymptotics far past the point where the big-O table says it should not. Inserting into the middle of a `std::vector` is O(n) and into a `std::list` is O(1), yet up to tens of thousands of elements the vector usually wins, because the O(n) is a `memmove` running at many gigabytes per second while the O(1) is a cold cache miss plus an allocation. Bjarne Stroustrup\'s standard demonstration of this is worth reproducing yourself rather than taking on trust.',
  ],

  gotchas: [
    'Array decay is silent. `void f(int a[16])` looks like it takes a 16-element array; the language rewrites it to `int* a` and does not check anything. Take `std::span<int>` or `T (&a)[16]` if you actually want the size enforced.',
    '`sizeof(arr) / sizeof(arr[0])` is correct in the scope that declared the array and quietly wrong — usually yielding 2 — anywhere the array has decayed. `std::size(arr)` fails to compile on a decayed pointer instead, which is the behaviour you want.',
    'A `span` or an iterator into a `std::vector` is invalidated by any reallocation. `push_back` inside a loop that also holds a span over the same vector is a use-after-free that AddressSanitizer will catch and a normal build will not.',
    '`std::deque` is *not* contiguous — it is a set of fixed-size chunks — so `&d[0]` is not the address of a contiguous block and you cannot pass `d` to a C API. It also cannot be turned into a span.',
    'Beware benchmarks that fit in L1. A "list versus vector" test over 100 elements measures nothing, because both fit in 4 KB and every access hits. Size your test past the L2 capacity, typically a few megabytes, before believing any number.',
  ],

  interview: {
    q: 'A candidate says a linked list is better than a vector for a workload with frequent insertions in the middle. You have 50,000 elements of 8 bytes each. What do you say?',
    a: [
      'I would ask what the insertion is preceded by. You almost never insert at a position you already hold an iterator to — you find it first, and finding it in a list is a linear pointer chase where every node is a separate cache miss. The vector\'s find is a linear scan over contiguous memory that the prefetcher services for free, so the search alone is typically an order of magnitude faster, and that usually dominates the insertion entirely.',
      'Then the insertion itself. The vector shifts the tail with `memmove`, which on 50,000 8-byte elements is 400 KB moving at maybe 10 GB/s — tens of microseconds worst case, and on average half that. The list does one allocation, which is a search through a free list with unpredictable tail latency, plus two pointer writes that each touch a cold line. The list also pays 16 bytes of `next`/`prev` per node on top of the 8 bytes of payload, tripling the footprint and therefore tripling the number of lines the whole structure occupies.',
      'The detail that shows understanding is naming the conditions under which the list actually wins: elements that are expensive or impossible to move, references that must remain stable across insertions, splicing whole ranges between containers in O(1), or an intrusive list where the nodes are already allocated for other reasons. If none of those apply, I would benchmark `std::vector` first and reach for a flat structure with a free-list of indices — a slot map — before reaching for `std::list`.',
    ],
  },

  exercise: [
    'Build a benchmark that sums 10 million ints held in a `std::vector<int>` and then the same 10 million held in a `std::list<int>`, timing both with `std::chrono::steady_clock`. Shuffle the list nodes before timing — allocate them, then link them in a random order — otherwise the allocator hands you nearly-sequential blocks and you will measure a flattering lie. Expect a 10–30x gap.',
    'Then measure *why* with `perf stat -e cache-misses,cache-references,instructions,cycles ./bench`. The instruction counts will be within a factor of two of each other; the cache-miss counts will not be close. Being able to say "same instructions, 40x the misses" in an interview is much stronger than "lists are slow".',
    'Finally, take a `std::vector<std::vector<float>>` of 1024×1024, sum it, then replace it with a single flat `std::vector<float>` of 1024*1024 indexed as `i * 1024 + j` and sum that. Print `(void*)row.data()` for the first few rows of the nested version to see how far apart they land. The flat version is usually 2–5x faster for a change that touches four lines of code.',
  ],
};
