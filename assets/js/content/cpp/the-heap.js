import { Region, Box, Arrow, Text, Tag } from '../../viz/primitives.js';

/* Fixed geometry for the whole scene. The heap region and the row of
   blocks inside it keep the same coordinates throughout — only the
   blocks themselves (and what points at them) change. */
const REGION = { x: 30, y: 64, w: 660, h: 210 };
const ROW_Y = 150;
const ROW_H = 70;

/* Address-order block layout. b0/b2/b4/b6 are used and never move.
   b1, b3 and b5 are the free-list nodes the allocator walks. */
const B0 = { x: 44, w: 70 };
const B1 = { x: 120, w: 50 };
const B2 = { x: 176, w: 90 };
const B3 = { x: 272, w: 40 };
const B4 = { x: 318, w: 60 };
const B5 = { x: 384, w: 110 };
const B6 = { x: 500, w: 80 };
const midX = (b) => b.x + b.w / 2;

const region = (label) => [
  Region({ key: 'region', ...REGION, label: label ?? 'THE HEAP', tone: 'heap' }),
];

const usedBlocks = () => [
  Box({ key: 'b0', x: B0.x, y: ROW_Y, w: B0.w, h: ROW_H, tone: 'owned', label: 'used', labelSize: 10 }),
  Box({ key: 'b2', x: B2.x, y: ROW_Y, w: B2.w, h: ROW_H, tone: 'owned', label: 'used', labelSize: 10 }),
  Box({ key: 'b4', x: B4.x, y: ROW_Y, w: B4.w, h: ROW_H, tone: 'owned', label: 'used', labelSize: 10 }),
  Box({ key: 'b6', x: B6.x, y: ROW_Y, w: B6.w, h: ROW_H, tone: 'owned', label: 'used', labelSize: 10 }),
];

/* The free list is drawn as arcs under the row connecting only the
   free blocks — not the array itself. Skipping the used blocks
   entirely is the point: they are not on this list at all. */
const nextArrows = () => [
  Arrow({
    key: 'next1',
    from: [midX(B1), ROW_Y + ROW_H],
    to: [midX(B3), ROW_Y + ROW_H],
    shape: 'curve',
    bend: 40,
    tone: 'moved',
    dashed: true,
    label: 'next',
  }),
  Arrow({
    key: 'next2',
    from: [midX(B3), ROW_Y + ROW_H],
    to: [midX(B5), ROW_Y + ROW_H],
    shape: 'curve',
    bend: 40,
    tone: 'moved',
    dashed: true,
  }),
];

const cursor = (targetX) =>
  Arrow({
    key: 'cursor',
    from: [targetX, 96],
    to: [targetX, ROW_Y - 2],
    shape: 'straight',
    bend: 0,
    tone: 'highlight',
    thick: true,
    label: 'search',
  });

const FOCUS_SEARCH = ['region', 'b1', 'b3', 'b5', 'cursor', 'need', 'cost', 'reject1', 'reject2'];

export default {
  oneLiner:
    'Why `new` is not free the way stack allocation is free — it is a search through whatever is left of a shared, mutable pool.',

  whyJob:
    'Every "the mean is fine but P99.9 blows the SLA" incident in a trading system traces back to something on this page — a search that is usually short and occasionally is not. Interviewers ask what `malloc` actually does specifically to find out whether you know it is a search.',

  mentalModel:
    'The stack was a stack of plates — one rule, one end, no thinking required. The heap is *a parking garage with cars of every size and drivers who leave whenever they want*. Finding a spot for a new car means *walking the rows* until one is free and big enough; there is no shortcut, and how long that walk takes depends entirely on what the garage looks like right now.',

  scene: {
    id: 'heap-free-list',
    title: 'Finding a fit, one free-list node at a time',
    width: 720,
    height: 400,
    legend: [
      { tone: 'owned', label: 'allocated block' },
      { tone: 'moved', label: 'free block — on the free list' },
      { tone: 'highlight', label: 'block currently being examined' },
      { tone: 'hit', label: 'fit found' },
    ],
    steps: [
      {
        say: 'Unlike the stack, the heap has no single end. Blocks are allocated and freed in any order, by any part of the program, so the allocator keeps its own bookkeeping: a linked list threading only through the blocks that are currently free.',
        mark: [],
        shapes: () => [
          ...region(),
          ...usedBlocks(),
          Box({ key: 'b1', x: B1.x, y: ROW_Y, w: B1.w, h: ROW_H, tone: 'moved', label: 'free', sub: '16B', labelSize: 10 }),
          Box({ key: 'b3', x: B3.x, y: ROW_Y, w: B3.w, h: ROW_H, tone: 'moved', label: 'free', sub: '8B', labelSize: 10 }),
          Box({ key: 'b5', x: B5.x, y: ROW_Y, w: B5.w, h: ROW_H, tone: 'moved', label: 'free', sub: '96B', labelSize: 10 }),
          ...nextArrows(),
        ],
      },
      {
        say: 'A request for 48 bytes arrives. The allocator does not know where a fit is — it has to start at the head of the free list and check, one node at a time. The first node is 16 bytes. Too small.',
        mark: ['14-16'],
        focus: FOCUS_SEARCH,
        predict: {
          ask: 'What mainly determines how long this call to `new` takes, right now?',
          options: [
            { label: 'The number of bytes being requested', correct: false },
            { label: 'How many free-list nodes the allocator has to visit before one is big enough', correct: true },
            { label: 'How much total RAM the machine has', correct: false },
            { label: 'Whether `Order` has a constructor', correct: false },
          ],
          because:
            'Finding space is a search over whatever the free list happens to look like at that moment. A tiny request can be slow if the front of the list is full of blocks too small for it; a large request can be fast if the very first node happens to fit. That dependence on the *current, mutable state of the list* — not on the size of the request — is why heap allocation cannot be timed the way stack allocation can.',
        },
        shapes: () => [
          ...region(),
          ...usedBlocks(),
          Box({ key: 'b1', x: B1.x, y: ROW_Y, w: B1.w, h: ROW_H, tone: 'highlight', label: 'free', sub: '16B — too small', labelSize: 10 }),
          Box({ key: 'b3', x: B3.x, y: ROW_Y, w: B3.w, h: ROW_H, tone: 'moved', label: 'free', sub: '8B', labelSize: 10 }),
          Box({ key: 'b5', x: B5.x, y: ROW_Y, w: B5.w, h: ROW_H, tone: 'moved', label: 'free', sub: '96B', labelSize: 10 }),
          ...nextArrows(),
          cursor(midX(B1)),
          Tag({ key: 'need', x: 596, y: 96, text: 'need 48B', tone: 'highlight' }),
          Text({ key: 'cost', x: 596, y: 126, text: '~100ns so far (1 hop)', size: 10.5, mono: true, tone: 'highlight' }),
        ],
      },
      {
        say: 'That 16-byte node was a cache miss to even reach — free-list nodes are scattered wherever their blocks happen to sit, not lined up in memory. The next hop follows the same pointer chase to an 8-byte node. Also too small.',
        mark: ['14-16'],
        focus: FOCUS_SEARCH,
        shapes: () => [
          ...region(),
          ...usedBlocks(),
          Box({ key: 'b1', x: B1.x, y: ROW_Y, w: B1.w, h: ROW_H, tone: 'moved', label: 'free', sub: '16B', labelSize: 10 }),
          Box({ key: 'b3', x: B3.x, y: ROW_Y, w: B3.w, h: ROW_H, tone: 'highlight', label: 'free', sub: '8B — too small', labelSize: 10 }),
          Box({ key: 'b5', x: B5.x, y: ROW_Y, w: B5.w, h: ROW_H, tone: 'moved', label: 'free', sub: '96B', labelSize: 10 }),
          ...nextArrows(),
          cursor(midX(B3)),
          Tag({ key: 'reject1', x: B1.x + 6, y: ROW_Y - 22, text: '✗', tone: 'freed' }),
          Tag({ key: 'need', x: 596, y: 96, text: 'need 48B', tone: 'highlight' }),
          Text({ key: 'cost', x: 596, y: 126, text: '~200ns so far (2 hops)', size: 10.5, mono: true, tone: 'highlight' }),
        ],
      },
      {
        say: 'The third node is 96 bytes — enough. The search stops here, but notice what just happened: three separate pointer chases, each one a potential cache miss, before a single byte was handed back.',
        mark: ['14-16'],
        focus: FOCUS_SEARCH,
        shapes: () => [
          ...region(),
          ...usedBlocks(),
          Box({ key: 'b1', x: B1.x, y: ROW_Y, w: B1.w, h: ROW_H, tone: 'moved', label: 'free', sub: '16B', labelSize: 10 }),
          Box({ key: 'b3', x: B3.x, y: ROW_Y, w: B3.w, h: ROW_H, tone: 'moved', label: 'free', sub: '8B', labelSize: 10 }),
          Box({ key: 'b5', x: B5.x, y: ROW_Y, w: B5.w, h: ROW_H, tone: 'highlight', label: 'free', sub: '96B — fits', labelSize: 10 }),
          ...nextArrows(),
          cursor(midX(B5)),
          Tag({ key: 'reject1', x: B1.x + 6, y: ROW_Y - 22, text: '✗', tone: 'freed' }),
          Tag({ key: 'reject2', x: B3.x + 2, y: ROW_Y - 22, text: '✗', tone: 'freed' }),
          Tag({ key: 'fit', x: B5.x + 40, y: ROW_Y - 22, text: 'FIT', tone: 'hit' }),
          Tag({ key: 'need', x: 596, y: 96, text: 'need 48B', tone: 'highlight' }),
          Text({ key: 'cost', x: 596, y: 126, text: '~300ns total (3 hops)', size: 10.5, mono: true, tone: 'hit' }),
        ],
      },
      {
        say: 'The block is bigger than needed, so it is split: 48 bytes are carved off the front and handed back as a raw address, and the remaining 48 bytes stay on the free list as a smaller node. Splitting is why the free list changes shape after almost every allocation.',
        mark: ['14-16'],
        shapes: () => [
          ...region(),
          ...usedBlocks(),
          Box({ key: 'b1', x: B1.x, y: ROW_Y, w: B1.w, h: ROW_H, tone: 'moved', label: 'free', sub: '16B', labelSize: 10 }),
          Box({ key: 'b3', x: B3.x, y: ROW_Y, w: B3.w, h: ROW_H, tone: 'moved', label: 'free', sub: '8B', labelSize: 10 }),
          Box({ key: 'alloc', x: B5.x, y: ROW_Y, w: 54, h: ROW_H, tone: 'owned', label: 'used', sub: '48B — new', labelSize: 10 }),
          Box({ key: 'b5', x: B5.x + 58, y: ROW_Y, w: 52, h: ROW_H, tone: 'moved', label: 'free', sub: '48B', labelSize: 10 }),
          Box({ key: 'pvar', x: B5.x, y: 20, w: 110, h: 30, tone: 'owned', label: 'Order* p', labelSize: 11 }),
          Arrow({ key: 'ptr', from: [B5.x + 55, 50], to: [B5.x + 27, ROW_Y], shape: 'curve', bend: -10, tone: 'owned', thick: true }),
        ],
      },
      {
        say: 'Later, `delete p` runs. The 48 bytes go back on the free list — and because the allocator checks the block right next to it and finds that neighbour is also free, the two are coalesced back into a single 96-byte node immediately, before anyone asks for memory again.',
        mark: ['18'],
        shapes: () => [
          ...region(),
          ...usedBlocks(),
          Box({ key: 'b1', x: B1.x, y: ROW_Y, w: B1.w, h: ROW_H, tone: 'moved', label: 'free', sub: '16B', labelSize: 10 }),
          Box({ key: 'b3', x: B3.x, y: ROW_Y, w: B3.w, h: ROW_H, tone: 'moved', label: 'free', sub: '8B', labelSize: 10 }),
          Box({ key: 'b5', x: B5.x, y: ROW_Y, w: B5.w, h: ROW_H, tone: 'moved', label: 'free', sub: '96B — merged', labelSize: 10 }),
          Tag({ key: 'merged', x: B5.x + 30, y: ROW_Y - 22, text: 'coalesced', tone: 'moved' }),
        ],
      },
      {
        say: 'Run that pattern — allocate, free, allocate something a different size — a few thousand times over a trading session, and the heap ends up looking like this: plenty of free bytes in total, none of them next to each other. A request for 64 contiguous bytes fails, not from lack of memory, but from lack of a single big-enough hole.',
        mark: ['24'],
        shapes: () => [
          ...region('THE HEAP — after 10,000 alloc/free cycles'),
          Box({ key: 'u0', x: 44, y: ROW_Y, w: 60, h: ROW_H, tone: 'owned', label: 'used', labelSize: 10 }),
          Box({ key: 'g0', x: 110, y: ROW_Y, w: 24, h: ROW_H, tone: 'moved', label: '12B', labelSize: 10 }),
          Box({ key: 'u1', x: 140, y: ROW_Y, w: 55, h: ROW_H, tone: 'owned', label: 'used', labelSize: 10 }),
          Box({ key: 'g1', x: 201, y: ROW_Y, w: 40, h: ROW_H, tone: 'moved', label: '20B', labelSize: 10 }),
          Box({ key: 'u2', x: 247, y: ROW_Y, w: 50, h: ROW_H, tone: 'owned', label: 'used', labelSize: 10 }),
          Box({ key: 'g2', x: 303, y: ROW_Y, w: 28, h: ROW_H, tone: 'moved', label: '14B', labelSize: 10 }),
          Box({ key: 'u3', x: 337, y: ROW_Y, w: 65, h: ROW_H, tone: 'owned', label: 'used', labelSize: 10 }),
          Box({ key: 'g3', x: 408, y: ROW_Y, w: 36, h: ROW_H, tone: 'moved', label: '18B', labelSize: 10 }),
          Box({ key: 'u4', x: 450, y: ROW_Y, w: 45, h: ROW_H, tone: 'owned', label: 'used', labelSize: 10 }),
          Box({ key: 'g4', x: 501, y: ROW_Y, w: 32, h: ROW_H, tone: 'moved', label: '16B', labelSize: 10 }),
          Box({ key: 'u5', x: 539, y: ROW_Y, w: 58, h: ROW_H, tone: 'owned', label: 'used', labelSize: 10 }),
          Tag({ key: 'need2', x: 596, y: 96, text: 'need 64B', tone: 'freed' }),
          Text({ key: 'sum', x: 596, y: 126, text: 'total free: 80B', size: 10.5, mono: true, tone: 'moved' }),
          Text({ key: 'largest', x: 596, y: 144, text: 'largest block: 20B', size: 10.5, mono: true, tone: 'freed' }),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'heap.cpp',
    source: `#include <cstdio>
#include <cstdlib>
#include <chrono>

struct Order {
    double price;
    int    quantity;
    char   symbol[8];
};

int main() {
    // Three allocations of different sizes -- each one is a fresh
    // search through the allocator's free list, not a fixed-cost op.
    Order* a = new Order{101.5, 100, "AAPL"};
    Order* b = new Order{ 55.2,  50, "MSFT"};
    Order* c = new Order{310.0,  10, "GOOG"};

    delete b;              // frees the middle block -- a hole opens up
    b = nullptr;

    // This request needs four Orders back-to-back. If the hole above
    // is too small, the search keeps walking past it looking for one
    // that fits -- or, failing that, asks the OS for more memory.
    Order* big = new Order[4];

    auto t0 = std::chrono::steady_clock::now();
    Order* hot = new Order{99.9, 1, "SPY"};
    auto t1 = std::chrono::steady_clock::now();
    printf("that allocation took %lld ns\\n",
           (long long)std::chrono::duration_cast<std::chrono::nanoseconds>(t1 - t0).count());

    delete hot;
    delete[] big;
    delete a;
    delete c;
    return 0;
}`,
    annotations: [
      {
        lines: '14-16',
        text: 'Three calls to `new`. Each one asks the allocator to find a free block big enough — a search, not a subtraction — and the cost depends on what the free list looks like *right now*, which depends on everything the program has allocated and freed before this line.',
      },
      {
        lines: '18',
        text: '`delete b` returns its bytes to the free list. The hole it leaves might be an exact fit for the next request, or it might sit there being slightly the wrong size for the rest of the program\'s life.',
      },
      {
        lines: '24',
        text: 'A run of four `Order`s needs one contiguous block. If nothing on the free list is big enough — even if the *total* free memory would cover it — the allocator has to ask the OS for a fresh region, which is thousands of times slower than reusing one.',
      },
      {
        lines: '26-28',
        text: '`std::chrono::steady_clock` is precise enough to catch the gap between a fast-path hit and a slow-path search. Run this allocation a few thousand times in a loop and look at the *spread* of the numbers, not the average.',
      },
    ],
  },

  deeper: [
    '`new` is not a syscall. It calls `operator new`, which on most platforms calls `malloc`, which is a substantial piece of software — glibc\'s allocator, for instance, keeps separate free lists ("bins") for different size ranges, so a request for 32 bytes does not have to walk past every 4KB block on the heap. This lesson draws one flat free list to make the search visible; a real allocator is a small search engine sitting between your code and the operating system.',
    'Allocators fight the search cost with per-thread caches. tcmalloc and jemalloc keep small pools of already-sized blocks local to each thread, so the common case is closer to a stack pop — no search, no lock, just take the top of a local list. The slow path — a cache miss on the local pool, a lock on a shared central list, or a `mmap` call for something large — is rare but not eliminated, and it is exactly the part that shows up as tail latency rather than average latency.',
    'Fragmentation comes in two flavours. *Internal* fragmentation is the allocator rounding your request up to the nearest size class and wasting the remainder inside your own block. *External* fragmentation — the kind on this page — is free space that exists but is split into pieces too small to satisfy a request. Coalescing adjacent free blocks on every `delete` fights external fragmentation, but it only helps when the free neighbour happens to be adjacent; two free blocks separated by one live object never merge no matter how long the program runs.',
    'This is why the mean is the wrong number to optimise in a trading system. A `new` that averages 25 nanoseconds but occasionally takes 40 microseconds — because that one call happened to need a search, or a lock, or a fresh page from the OS — has a mean that looks perfectly fine and a P99.9 that blows every latency budget. The fix used industry-wide is to stop asking the general-purpose allocator questions on the hot path at all: pre-allocate a pool or arena once at startup, hand out fixed-size slots from it with no search, and let the allocator do its slow, careful work only during setup and teardown, when nobody is timing you.',
  ],

  gotchas: [
    'Pairing `new` with `delete[]`, or `new[]` with `delete`, is undefined behaviour — the allocator was told the wrong thing about the block\'s size or layout. It often does not crash immediately, which is worse than if it did.',
    'A leaked allocation on an early-return or exception path does not show up in a five-minute test run. It shows up as resident memory climbing slowly over an eight-hour trading session, and it is almost always found in production, not in review.',
    'The first allocation of a given size after a long run of different sizes is disproportionately likely to hit the slow path — the free list has drifted away from having anything that shape lying around. Warm-up allocations at startup exist specifically to avoid discovering this live.',
    'Fragmentation is monotonic under a naive allocator: it only ever gets worse across the life of a long-running process unless the allocation pattern is regular enough for coalescing to keep up. A service that has been "a bit slower every day this week" is a classic fragmentation symptom.',
  ],

  interview: {
    q: 'You\'ve profiled a trading engine\'s order path and the mean cost of `new Order()` is 25 nanoseconds — comfortably inside budget. The engine still misses its P99.9 latency SLA roughly once every few thousand orders. What is happening, and what would you change?',
    a: [
      'The mean and the tail are measuring different things. A mean of 25 nanoseconds is almost certainly the fast path — a thread-local free list, no search, no lock. The occasional multi-microsecond outlier is the slow path: a search that had to walk several free-list nodes because the heap happened to be fragmented at that moment, a lock briefly held by another thread doing its own allocation, or in the worst case a page fault or `mmap` because the process needed more address space from the OS. All three are rare per call and therefore invisible in a mean, but a trading system does not get to average away its worst decision — one order delayed past the SLA is the one that matters.',
      'I\'d confirm the theory before changing anything, by histogramming allocation latency rather than trusting the mean, and by checking whether the outliers correlate with allocations of a size the engine rarely requests, or with contention from other threads sharing the same heap.',
      'The fix is to remove the general-purpose allocator from the hot path entirely rather than try to make it more predictable. Pre-allocate a fixed-size pool of `Order` objects at startup — one allocation, one contiguous region — and hand out and return slots from a free list with no search, because every slot is the same size and coalescing is never needed. `std::pmr::monotonic_buffer_resource` or a hand-written pool are the usual tools. The allocator is still there; it just does its work once, before the market opens, instead of once per order.',
    ],
  },

  exercise: [
    'Build the code block with `g++ -O2 heap.cpp -o heap` and run it a few thousand times in a shell loop, capturing the printed nanosecond figure each time into a file. Sort the numbers and print the 50th, 99th and 99.9th percentiles — the gap between the mean and the P99.9 is exactly the effect this lesson describes, and you will have measured it yourself rather than taken it on faith.',
    'Then write a small loop that allocates and frees objects of alternating sizes (say, 16 bytes and 256 bytes) a few hundred thousand times, and run it under `valgrind --tool=massif`. Read the resulting graph — watch whether resident memory climbs even though every allocation was eventually freed. That climb is fragmentation you can see.',
  ],
};
