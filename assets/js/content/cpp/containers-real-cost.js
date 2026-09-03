import { Region, Cell, Cells, Box, Arrow, Bracket, Text, Tag } from '../../viz/primitives.js';

/* ------------------------------------------------------------------
   The same 8 (id -> price) pairs, stored four different ways. Every
   step keeps this data set so the only thing that ever changes is
   the layout — that repetition is the entire argument of the lesson.
   ------------------------------------------------------------------ */
const PRICE = [101, 205, 143, 88, 176, 52, 199, 67];

const REGION = { x: 20, y: 70, w: 680, h: 330 };
const heap = (label = 'THE HEAP') =>
  Region({ key: 'heap', x: REGION.x, y: REGION.y, w: REGION.w, h: REGION.h, label, tone: 'heap' });

const caption = (text) =>
  Text({ key: 'cap', x: 360, y: 40, text, size: 12.5, anchor: 'middle', opacity: 0.85 });

const missTag = (n, tone) =>
  Tag({ key: 'misses', x: 596, y: 96, text: `cache misses: ${n}`, tone });

export default {
  oneLiner:
    'The physical memory layout behind `vector`, `list`, `map` and `unordered_map` — and why the same lookup costs one cache miss in one of them and five in another.',

  whyJob:
    'Picking `map` out of habit, or reaching for `list` because "insertion in the middle is O(1)", is the single most common source of an unexplained 10x slowdown in a candidate\'s own submission. Interviewers ask "why is this slow" specifically to see whether you think about layout, not just Big-O.',

  mentalModel:
    'Picture the same 8 folders stored four ways: *stacked in one drawer* where you reach any folder by counting along (vector); *taped to desks scattered across the building*, each one bearing a sticky note pointing to the next desk (list); *filed into a tree of pigeonholes*, following left/right notes down three branches (map); *tossed into one of eight labelled bins*, each bin holding a short stack (unordered_map). The paper never changes. What changes is how far you *walk*, and that walk is what a cache miss actually costs — about 100 nanoseconds, roughly 300 CPU cycles of doing nothing.',

  scene: {
    id: 'container-layouts',
    title: 'The same 8 elements, four different homes',
    width: 720,
    height: 430,
    legend: [
      { tone: 'owned', label: 'live element, contiguous' },
      { tone: 'heap', label: 'a node — allocated on its own' },
      { tone: 'highlight', label: 'the lookup in progress' },
      { tone: 'miss', label: 'a step that costs a cache miss' },
    ],
    steps: [
      {
        say: 'Eight id/price pairs, nothing more. Every step from here stores exactly this data — the values never change, only the shape they are arranged in.',
        mark: [],
        shapes: () => [
          caption('Same 8 (id → price) pairs. Four homes, one lookup: find id 5.'),
          ...Cells({
            key: 'u',
            x: 76,
            y: 200,
            w: 64,
            h: 40,
            gap: 8,
            values: PRICE.map((p, i) => ({ value: String(p), name: `id ${i}`, tone: 'neutral', dashed: true })),
          }),
          Text({ key: 'note', x: 360, y: 270, text: 'not stored yet — this is just the data', size: 11, anchor: 'middle', opacity: 0.5 }),
        ],
      },
      {
        say: '`std::vector<int>` puts every element back to back in one block. Finding id 5 is `base + 5 * 4` — one piece of arithmetic, one address, and because all 8 values fit in a single 64-byte cache line, that address is almost certainly already in cache.',
        mark: ['19', '31'],
        shapes: () => [
          heap('THE HEAP — one contiguous block'),
          ...Cells({
            key: 'v',
            x: 76,
            y: 140,
            w: 64,
            h: 40,
            gap: 0,
            addrStart: 0x7000,
            addrStep: 4,
            values: PRICE.map((p, i) => ({
              value: String(p),
              name: `id ${i}`,
              tone: i === 5 ? 'highlight' : 'owned',
            })),
          }),
          Bracket({ key: 'line', x: 76, y: 212, w: 512, label: 'one 64-byte cache line — everything already lives here', tone: 'hit' }),
          Arrow({ key: 'look', from: [600, 92], to: [428, 140], shape: 'curve', bend: -20, tone: 'highlight', label: 'v[5]' }),
          missTag(1, 'hit'),
        ],
      },
      {
        say: 'A `std::list<int>` gives every element its own node, allocated at whatever address the allocator happened to hand out. Reaching position 5 means starting at the head and following five `next` pointers — five jumps to five unrelated addresses.',
        mark: [],
        focus: ['n0', 'n1', 'n2', 'n3', 'n4', 'n5', 'a0', 'a1', 'a2', 'a3', 'a4', 'misses', 'overhead'],
        shapes: () => [
          heap('THE HEAP — nodes scattered wherever the allocator put them'),
          Box({ key: 'n0', x: 56, y: 110, w: 76, h: 40, label: String(PRICE[0]), sub: 'id 0', tone: 'highlight', mono: true, labelSize: 13 }),
          Box({ key: 'n1', x: 560, y: 120, w: 76, h: 40, label: String(PRICE[1]), sub: 'id 1', tone: 'highlight', mono: true, labelSize: 13 }),
          Box({ key: 'n2', x: 220, y: 340, w: 76, h: 40, label: String(PRICE[2]), sub: 'id 2', tone: 'highlight', mono: true, labelSize: 13 }),
          Box({ key: 'n3', x: 420, y: 90, w: 76, h: 40, label: String(PRICE[3]), sub: 'id 3', tone: 'highlight', mono: true, labelSize: 13 }),
          Box({ key: 'n4', x: 120, y: 260, w: 76, h: 40, label: String(PRICE[4]), sub: 'id 4', tone: 'highlight', mono: true, labelSize: 13 }),
          Box({ key: 'n5', x: 620, y: 230, w: 76, h: 40, label: String(PRICE[5]), sub: 'id 5', tone: 'highlight', mono: true, labelSize: 13 }),
          Box({ key: 'n6', x: 300, y: 190, w: 76, h: 40, label: String(PRICE[6]), sub: 'id 6', tone: 'neutral', mono: true, labelSize: 13 }),
          Box({ key: 'n7', x: 480, y: 330, w: 76, h: 40, label: String(PRICE[7]), sub: 'id 7', tone: 'neutral', mono: true, labelSize: 13 }),
          Arrow({ key: 'a0', from: [132, 130], to: [560, 138], shape: 'curve', bend: -46, tone: 'miss', thick: true }),
          Arrow({ key: 'a1', from: [598, 160], to: [258, 350], shape: 'curve', bend: 60, tone: 'miss', thick: true }),
          Arrow({ key: 'a2', from: [296, 350], to: [420, 130], shape: 'curve', bend: -40, tone: 'miss', thick: true }),
          Arrow({ key: 'a3', from: [458, 110], to: [158, 270], shape: 'curve', bend: 40, tone: 'miss', thick: true }),
          Arrow({ key: 'a4', from: [196, 280], to: [620, 250], shape: 'curve', bend: -50, tone: 'miss', thick: true }),
          Arrow({ key: 'a5', from: [696, 250], to: [376, 200], shape: 'curve', bend: 30, tone: 'neutral', dashed: true }),
          Arrow({ key: 'a6', from: [300, 210], to: [480, 340], shape: 'curve', bend: 20, tone: 'neutral', dashed: true }),
          Text({ key: 'overhead', x: 360, y: 396, text: 'each node: 4 B value + 2 × 8 B pointers, padded to 24 B — 600% overhead per int', size: 10.5, anchor: 'middle', opacity: 0.7 }),
          missTag(5, 'miss'),
        ],
      },
      {
        say: 'A `std::map<int,int>` is a red-black tree: also node-per-element, but arranged so a search halves the remaining candidates at every step. Finding id 5 costs two hops from the root — fewer hops than the list, but each one is still a pointer chase to a node that was allocated on its own, somewhere else entirely.',
        mark: [],
        focus: ['r4', 'r6', 'r5', 'e46', 'e65', 'misses', 'overhead'],
        predict: {
          ask: 'The tree reaches id 5 in 2 hops from the root; the list needed 5. Does `std::map` actually win this lookup?',
          options: [
            { label: 'Yes — fewer hops always means faster', correct: false },
            { label: 'They tie, because both containers are O(log n) here', correct: false },
            {
              label: 'Barely, if at all — every hop in both is a full cache miss, so 2 misses beats 5 by only a few hundred nanoseconds at this size',
              correct: true,
            },
          ],
          because:
            'log2(8) = 3 is a genuine algorithmic win, and it is why `map` beats `list` decisively as n grows into the thousands. But at 8 elements the win barely registers, because what dominates the clock is not the hop *count* — it is that each hop is a pointer chase to an address the allocator handed out independently, so it is very unlikely to already be in cache. Fewer hops just means fewer *chances* to miss, not fewer misses avoided. That is the sense in which `map` is a cache disaster even though its Big-O is excellent: the ~100 ns constant factor per miss dominates until n is large enough for the hop count itself to matter.',
        },
        shapes: () => [
          heap('THE HEAP — a tree of nodes, still one allocation each'),
          Box({ key: 'r4', x: 342, y: 96, w: 76, h: 40, label: String(PRICE[4]), sub: 'id 4 · root', tone: 'highlight', mono: true, labelSize: 13 }),
          Box({ key: 'r1', x: 160, y: 176, w: 72, h: 38, label: String(PRICE[1]), sub: 'id 1', tone: 'neutral', mono: true, labelSize: 12 }),
          Box({ key: 'r6', x: 540, y: 176, w: 72, h: 38, label: String(PRICE[6]), sub: 'id 6', tone: 'highlight', mono: true, labelSize: 12 }),
          Box({ key: 'r0', x: 60, y: 268, w: 68, h: 36, label: String(PRICE[0]), sub: 'id 0', tone: 'neutral', mono: true, labelSize: 11.5 }),
          Box({ key: 'r2', x: 240, y: 268, w: 68, h: 36, label: String(PRICE[2]), sub: 'id 2', tone: 'neutral', mono: true, labelSize: 11.5 }),
          Box({ key: 'r3', x: 280, y: 352, w: 68, h: 36, label: String(PRICE[3]), sub: 'id 3', tone: 'neutral', mono: true, labelSize: 11.5 }),
          Box({ key: 'r5', x: 460, y: 268, w: 68, h: 36, label: String(PRICE[5]), sub: 'id 5', tone: 'highlight', mono: true, labelSize: 11.5 }),
          Box({ key: 'r7', x: 620, y: 268, w: 68, h: 36, label: String(PRICE[7]), sub: 'id 7', tone: 'neutral', mono: true, labelSize: 11.5 }),
          Arrow({ key: 'e41', from: [366, 136], to: [196, 176], shape: 'straight', bend: 0, tone: 'neutral' }),
          Arrow({ key: 'e46', from: [418, 136], to: [576, 176], shape: 'straight', bend: 0, tone: 'miss', thick: true }),
          Arrow({ key: 'e10', from: [186, 214], to: [94, 268], shape: 'straight', bend: 0, tone: 'neutral' }),
          Arrow({ key: 'e12', from: [214, 214], to: [274, 268], shape: 'straight', bend: 0, tone: 'neutral' }),
          Arrow({ key: 'e23', from: [274, 304], to: [314, 352], shape: 'straight', bend: 0, tone: 'neutral' }),
          Arrow({ key: 'e65', from: [560, 214], to: [494, 268], shape: 'straight', bend: 0, tone: 'miss', thick: true }),
          Arrow({ key: 'e67', from: [594, 214], to: [654, 268], shape: 'straight', bend: 0, tone: 'neutral' }),
          Text({ key: 'overhead', x: 360, y: 400, text: 'each node: 4 B key + 4 B value + 3 × 8 B pointers + colour, padded — 32 B', size: 10.5, anchor: 'middle', opacity: 0.7 }),
          missTag(3, 'miss'),
        ],
      },
      {
        say: 'A `std::unordered_map<int,int>` splits the work: a plain array of 8 bucket heads, contiguous like the vector, and each bucket points into a short chain of nodes. `hash(5)` lands straight on bucket 5 — one line already covers all eight buckets — and from there it is a single hop to the one node in that chain.',
        mark: [],
        focus: ['b5', 'n5b', 'lookarr', 'b0', 'nn0', 'nn7', 'chain', 'misses'],
        shapes: () => [
          heap('THE HEAP — a contiguous bucket array, plus short chains'),
          ...Cells({
            key: 'b',
            x: 76,
            y: 140,
            w: 64,
            h: 40,
            gap: 0,
            addrStart: 0xa000,
            addrStep: 8,
            values: [
              { value: '•', name: 'b0', tone: 'heap' },
              { value: '•', name: 'b1', tone: 'heap' },
              { value: '•', name: 'b2', tone: 'heap' },
              { value: '•', name: 'b3', tone: 'heap' },
              { value: '•', name: 'b4', tone: 'heap' },
              { value: '•', name: 'b5', tone: 'highlight' },
              { value: '•', name: 'b6', tone: 'heap' },
              { value: '∅', name: 'b7', tone: 'neutral', dashed: true },
            ],
          }),
          Bracket({ key: 'bline', x: 76, y: 212, w: 512, label: 'one 64-byte cache line — the whole bucket array', tone: 'hit' }),
          Box({ key: 'nn0', x: 76, y: 280, w: 68, h: 36, label: String(PRICE[0]), sub: 'id 0', tone: 'neutral', mono: true, labelSize: 11.5 }),
          Box({ key: 'nn1', x: 160, y: 340, w: 68, h: 36, label: String(PRICE[1]), sub: 'id 1', tone: 'neutral', mono: true, labelSize: 11.5 }),
          Box({ key: 'nn2', x: 224, y: 280, w: 68, h: 36, label: String(PRICE[2]), sub: 'id 2', tone: 'neutral', mono: true, labelSize: 11.5 }),
          Box({ key: 'nn3', x: 308, y: 340, w: 68, h: 36, label: String(PRICE[3]), sub: 'id 3', tone: 'neutral', mono: true, labelSize: 11.5 }),
          Box({ key: 'nn4', x: 372, y: 280, w: 68, h: 36, label: String(PRICE[4]), sub: 'id 4', tone: 'neutral', mono: true, labelSize: 11.5 }),
          Box({ key: 'n5b', x: 456, y: 280, w: 68, h: 36, label: String(PRICE[5]), sub: 'id 5', tone: 'highlight', mono: true, labelSize: 12 }),
          Box({ key: 'nn6', x: 540, y: 280, w: 68, h: 36, label: String(PRICE[6]), sub: 'id 6', tone: 'neutral', mono: true, labelSize: 11.5 }),
          Box({ key: 'nn7', x: 612, y: 340, w: 68, h: 36, label: String(PRICE[7]), sub: 'id 7 · chained', tone: 'neutral', mono: true, labelSize: 10.5 }),
          Arrow({ key: 'ptr0', from: [108, 180], to: [110, 280], shape: 'straight', bend: 0, tone: 'neutral' }),
          Arrow({ key: 'chain', from: [144, 300], to: [612, 350], shape: 'curve', bend: 30, tone: 'moved', dashed: true, label: 'collision chain' }),
          Arrow({ key: 'lookarr', from: [428, 180], to: [490, 280], shape: 'straight', bend: 0, tone: 'highlight', thick: true, label: 'hash(5)' }),
          missTag(2, 'hit'),
        ],
      },
      {
        say: 'Same 8 elements, same lookup, every time — the memory layout is the entire difference between 1 miss and 5. `map` and `unordered_map` still earn their keep when you need sorted iteration or a lookup by key with no random access at all; the container should follow the shape of the problem, not just this benchmark.',
        mark: [],
        shapes: () => [
          Box({ key: 's.v', x: 40, y: 160, w: 150, h: 60, label: 'vector', sub: '1 cache miss', tone: 'hit', labelSize: 14 }),
          Box({ key: 's.u', x: 210, y: 160, w: 150, h: 60, label: 'unordered_map', sub: '2 cache misses', tone: 'hit', labelSize: 12.5 }),
          Box({ key: 's.m', x: 400, y: 160, w: 130, h: 60, label: 'map', sub: '3 cache misses', tone: 'miss', labelSize: 14 }),
          Box({ key: 's.l', x: 550, y: 160, w: 130, h: 60, label: 'list', sub: '5 cache misses', tone: 'miss', labelSize: 14 }),
          Text({
            key: 'verdict',
            x: 360,
            y: 260,
            text: 'contiguity beats hop count — right up until you need what only the tree or the chain give you',
            size: 12.5,
            anchor: 'middle',
            opacity: 0.85,
          }),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'container_lookup.cpp',
    source: `#include <chrono>
#include <cstdio>
#include <map>
#include <unordered_map>
#include <vector>

using Clock = std::chrono::steady_clock;

template <class Fn>
double time_ms(Fn&& fn) {
    auto t0 = Clock::now();
    fn();
    auto t1 = Clock::now();
    return std::chrono::duration<double, std::milli>(t1 - t0).count();
}

int main() {
    constexpr int N = 2'000'000;
    std::vector<int> v(N);
    std::map<int, int> m;
    std::unordered_map<int, int> um;
    for (int i = 0; i < N; ++i) {
        v[i] = i;
        m[i] = i;
        um[i] = i;
    }

    volatile long sink = 0;

    double tv = time_ms([&] {
        for (int i = 0; i < N; i += 97) sink += v[i];
    });
    double tm = time_ms([&] {
        for (int i = 0; i < N; i += 97) sink += m.at(i);
    });
    double tu = time_ms([&] {
        for (int i = 0; i < N; i += 97) sink += um.at(i);
    });

    printf("vector:         %.2f ms\\n", tv);
    printf("map:            %.2f ms\\n", tm);
    printf("unordered_map:  %.2f ms\\n", tu);
    return 0;
}`,
    annotations: [
      {
        lines: '18',
        text: 'N is deliberately large enough that none of these containers fits in any level of cache — only then does the layout, not the working-set size, decide the result.',
      },
      {
        lines: '31',
        text: '`v[i]` is one add and one load. Neighbouring elements are already in the same line, so a strided walk like this one stays cheap.',
      },
      {
        lines: '34',
        text: '`m.at(i)` walks the tree — around `log2(2,000,000) ≈ 21` pointer hops, each one a likely miss to an unrelated address.',
      },
      {
        lines: '37',
        text: '`um.at(i)` hashes straight to a bucket (contiguous, usually one miss for a run of buckets) and then follows a chain that, at a sane load factor, holds about one element.',
      },
    ],
  },

  deeper: [
    'A cache miss is not a rounding error — it is the dominant cost. An L1 hit is 4-5 cycles, an L2 hit is around 12, an L3 hit is 30-40, and a genuine trip to DRAM is 100+ nanoseconds, which at 3 GHz is 300+ cycles doing nothing but waiting. A single `map::find` on a large tree can easily spend all of its time on those waits, because every one of its `log n` hops is a *dependent* load — the address for hop 3 is not known until hop 2 finishes, so the CPU cannot prefetch ahead or overlap the misses. A `vector` walk has no such dependency: the next address is known in advance, so the hardware prefetcher stays several lines ahead of the core and the misses mostly disappear.',
    'Node overhead is not a rounding error either. A `std::list<int>` node is a 4-byte value inside a 24-byte object once two 8-byte pointers and alignment are counted — six times the payload spent on bookkeeping. A `std::map<int,int>` node is worse: key, value, three pointers (parent, left, right) and a colour bit, typically 32 bytes for 8 bytes of actual data. None of that is a quality-of-implementation bug; it is the unavoidable price of "every element gets its own independently addressable block."',
    'Why `unordered_map` usually beats `map` on raw lookup speed: the bucket array is contiguous, so computing `hash(key) % bucket_count` and reading that slot behaves like a vector access, and at a reasonable load factor (the standard default targets around 1.0) the chain behind it holds roughly one element. That collapses the expected number of pointer chases from `log n` to close to 1, independent of how large the map grows — which is the entire point of hashing over ordering.',
    'None of this makes `map` obsolete. It gives you elements in sorted key order for free, which `unordered_map` cannot, and it gives *iterator and reference stability*: inserting or erasing one element never invalidates a pointer to another, which is also true of `unordered_map` for references but not for its iterators after a rehash. If your algorithm genuinely needs an ordered walk — a price ladder, a time-ordered event queue you iterate range by range — `map` is not a mistake, and reaching for `unordered_map` there just trades one cost for a subtler bug.',
    'The modern answer to "I want map-like semantics without the pointer chasing" is a flat, open-addressed container: `absl::flat_hash_map`, `boost::unordered_flat_map`, or a hand-rolled sorted `vector<pair<K,V>>` for read-mostly data. These keep the metadata contiguous and probe within it instead of chasing a chain, which is why they routinely beat `std::unordered_map` by two to three times on lookup-heavy workloads without changing the algorithmic complexity at all — the entire gain is memory layout.',
  ],

  gotchas: [
    'Reaching for `map` because you want "fast lookup" when you never actually need sorted order is the single most common misuse — swap it for `unordered_map` and remeasure before assuming you need a tree at all.',
    '`std::vector<bool>` is a bitset in disguise; it is contiguous but `operator[]` returns a proxy, not a `bool&`, which silently breaks generic code that expects a normal container.',
    '`unordered_map` iterators (not references, not pointers to elements) are invalidated by a rehash, which any `insert` can trigger once the load factor is exceeded. `map` gives you the strictly stronger guarantee that only the erased iterator itself is invalidated.',
    'Using a poor or attacker-controlled hash on `unordered_map` degrades every bucket to a single long chain — worst case O(n) per lookup, which is how hash-flooding denial-of-service attacks work against naively hashed containers.',
    '"Insertion in the middle is O(1) for `list`" is true and almost never the deciding factor. Finding *where* to insert is O(n) for a `list` (no random access) and the walk to get there will cost far more in cache misses than a `vector`\'s O(n) memmove of contiguous bytes, for anything short of a very large element.',
  ],

  interview: {
    q: 'You need a lookup table for roughly 10,000 order IDs. A candidate says "I\'ll use `std::map` because it\'s `log n`." What do you ask next, and what would you actually pick?',
    a: [
      'First I would ask whether iteration order matters — does anything downstream walk the container in sorted key order, or range-query between two keys? If nothing does, `log n` is solving a problem you do not have, because `unordered_map` gives expected O(1) lookup, which beats `log2(10,000) ≈ 13` pointer chases outright.',
      'Then I would push on what "log n" is hiding: each of those 13 steps in a `map` is a pointer chase to a node the allocator placed independently, so it is close to 13 likely cache misses — call it over a microsecond just in memory stalls, before any actual work happens. `unordered_map` at a sane load factor collapses that to roughly one hop, because the bucket array itself is contiguous and the chain behind the right bucket is short. That difference, not the asymptotic notation, is what shows up in a profiler.',
      'What I would actually pick depends on the access pattern I have not been told yet. If lookups vastly outnumber insertions and the key space is dense integers, I would consider a plain sorted `vector` with `std::lower_bound`, or even a direct-indexed `vector` keyed by ID if the IDs are small and dense — both keep everything in one contiguous block and beat a hash table\'s indirection entirely. Saying "it depends on the access pattern, and here is how I would measure it with `perf stat -e cache-misses`" is the part that distinguishes an understood answer from a memorised one.',
    ],
  },

  exercise: [
    'Build the code above with `g++ -O2 container_lookup.cpp -o container_lookup && ./container_lookup` and read the three numbers. Then run `perf stat -e cache-misses,cache-references ./container_lookup` and check that the ratio for `map` is dramatically worse than for `vector` — that ratio, not the wall-clock time alone, is the mechanism this lesson is about.',
    'Change `N` down to somewhere around 50 and rerun. Watch the gap between `map` and `unordered_map` shrink toward nothing — at that size everything fits inside L1 regardless of layout, which is exactly the nuance the `predict` step above is testing.',
  ],
};
