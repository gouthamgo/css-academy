import { Box, Cell, Cells, Region, Arrow, Text, Tag } from '../../viz/primitives.js';

/* ------------------------------------------------------------------
   Two panels, side by side, that stay at the same coordinates for
   every step: LEFT is the general-purpose allocator, RIGHT is the
   arena/slab pair we build ourselves. Only the contents inside each
   panel change — the frame they sit in never moves, so the contrast
   between "same request, different machinery" reads directly.
   ------------------------------------------------------------------ */
const LEFT = { x: 16, y: 56, w: 332, h: 230 };
const RIGHT = { x: 372, y: 56, w: 332, h: 230 };

const meterL = (label, sub, tone = 'neutral') =>
  Box({ key: 'costL', x: 16, y: 14, w: 332, h: 34, label, sub, tone, labelSize: 12 });
const meterR = (label, sub, tone = 'neutral') =>
  Box({ key: 'costR', x: 372, y: 14, w: 332, h: 34, label, sub, tone, labelSize: 12 });

const regionL = (label) => Region({ key: 'left', ...LEFT, label, tone: 'stack' });
const regionR = (label) => Region({ key: 'right', ...RIGHT, label, tone: 'heap' });

/* The free list: two used blocks that are never on the list, and two
   free blocks malloc actually walks. b1/b2 change tone and sub-text
   as the search proceeds and the fit gets split. */
const leftBlocks = ({ b1Tone = 'owned', b1Sub = '16B', b2Tone = 'owned', b2Sub = '64B', b2Label = 'free' } = {}) => [
  Box({ key: 'b0', x: 32, y: 96, w: 58, h: 52, tone: 'moved', label: 'used', sub: '32B', labelSize: 11, mono: true }),
  Box({ key: 'b1', x: 100, y: 96, w: 44, h: 52, tone: b1Tone, label: 'free', sub: b1Sub, labelSize: 11, mono: true }),
  Box({ key: 'b2', x: 154, y: 96, w: 86, h: 52, tone: b2Tone, label: b2Label, sub: b2Sub, labelSize: 11, mono: true }),
  Box({ key: 'b3', x: 250, y: 96, w: 58, h: 52, tone: 'moved', label: 'used', sub: '8B', labelSize: 11, mono: true }),
];

/* The arena: one contiguous buffer and a bump pointer sitting at the
   current offset. Advancing it is the entire allocation. */
const arena = (offset, tone = 'neutral') => [
  Box({ key: 'arenaBuf', x: 388, y: 100, w: 296, h: 36, tone: 'heap', label: 'ARENA', sub: `offset: ${offset}`, labelSize: 11 }),
  Arrow({
    key: 'bumpPtr', from: [388 + offset, 84], to: [388 + offset, 100],
    shape: 'straight', bend: 0, tone, thick: true, label: 'bump ptr',
  }),
];

/* The slab pool: five fixed-size nodes. usedCount of them are already
   popped off the free list. */
const slab = (usedCount = 0) => [
  Text({ key: 'slabLabel', x: 388, y: 158, text: 'SLAB POOL — fixed 64B blocks', size: 10, mono: true, opacity: 0.6 }),
  ...Cells({
    key: 'slab', x: 388, y: 170, w: 52, h: 40, gap: 8,
    values: Array.from({ length: 5 }, (_, i) => ({
      value: i < usedCount ? 'used' : 'free',
      tone: i < usedCount ? 'moved' : 'owned',
    })),
  }),
];

export default {
  oneLiner:
    'Why hot paths hand-roll their own memory instead of calling malloc, and how a bump allocator turns allocation into a single pointer add.',

  whyJob:
    'Trading systems and ML inference servers forbid `malloc` on the hot path for the same reason they forbid disk I/O there: the average call is fast, but the worst call can cost a lock, a syscall, and a cold cache line. Interviewers ask about custom allocators specifically to find out whether you reason about p99.9 latency or just about the mean.',

  mentalModel:
    'Picture a shared parking garage where every car is a different length, and an attendant has to *scan a clipboard of vacant spots and pick one big enough* — sometimes painting new lines to split a long spot in two. That is malloc. Now picture a private driveway where cars only ever park in the next open square, straight ahead: no clipboard, no comparing lengths — the attendant just points, and the line moves forward by *one number*. That is a bump allocator, and it is one instruction because there is nothing left to decide.',

  scene: {
    id: 'allocators-side-by-side',
    title: 'The same 24-byte request, two different machines',
    width: 720,
    height: 420,
    legend: [
      { tone: 'owned', label: 'free / cheap / available' },
      { tone: 'moved', label: 'used / consumed' },
      { tone: 'highlight', label: 'currently being examined' },
      { tone: 'miss', label: 'lock, syscall, or other cost' },
    ],
    steps: [
      {
        say: 'Two allocators are about to serve the same 24-byte request. The one on the left must stay ready for any size, from any thread, at any moment — the one on the right was shaped in advance for exactly this job.',
        mark: ['4', '20'],
        shapes: () => [
          meterL('malloc: idle', 'general-purpose heap'),
          meterR('arena / slab: idle', 'pre-shaped for this job'),
          regionL('MALLOC — FREE LIST'),
          ...leftBlocks(),
          regionR('ARENA (bump) + SLAB POOL'),
          ...arena(0),
          ...slab(0),
        ],
      },
      {
        say: 'The request for 24 bytes arrives. malloc walks its free list from the head, comparing each block’s size against 24 until one is large enough.',
        mark: [],
        shapes: () => [
          meterL('malloc: searching…', 'comparing block sizes', 'highlight'),
          meterR('arena / slab: idle', 'ready when called'),
          regionL('MALLOC — FREE LIST'),
          ...leftBlocks({ b1Tone: 'highlight', b1Sub: '16B — too small' }),
          Tag({ key: 'chk', x: 100, y: 152, text: '16 < 24', tone: 'freed' }),
          regionR('ARENA (bump) + SLAB POOL'),
          ...arena(0),
          ...slab(0),
        ],
      },
      {
        say: 'free64B is large enough, so malloc splits it — 24 bytes are handed back, 40 stay on the list — and in glibc that search-and-splice runs under the arena’s lock. The bump allocator, meanwhile, is already done: one comparison, one addition.',
        mark: ['9-12'],
        shapes: () => [
          meterL('malloc: found + split', '~35 ns, lock held (uncontended)', 'miss'),
          meterR('bump: allocate() done', '~1 ns — one pointer add', 'owned'),
          regionL('MALLOC — FREE LIST'),
          ...leftBlocks({ b2Tone: 'highlight', b2Sub: '24B used / 40B free', b2Label: 'split' }),
          Tag({ key: 'lock', x: 32, y: 200, w: 280, text: 'arena lock: CAS, ~35 ns uncontended', tone: 'miss' }),
          regionR('ARENA (bump) + SLAB POOL'),
          ...arena(40, 'owned'),
          ...slab(0),
        ],
      },
      {
        say: 'Both calls just returned a valid pointer. Now picture a second thread calling malloc on the same heap at the same instant, reaching for the lock thread A is still holding.',
        mark: [],
        predict: {
          ask: 'Thread A holds the arena lock. What happens to thread B’s malloc call?',
          options: [
            { label: 'It spins for a few cycles and proceeds — locks are cheap', correct: false },
            { label: 'It fails fast and returns null; the caller must retry', correct: false },
            { label: 'The kernel can take it off the CPU entirely and wake it later — a ~35 ns call can become microseconds', correct: true },
          ],
          because:
            'A short spin only pays off if the lock is held for a few cycles. glibc’s allocator lock backs off to a futex wait once contention drags on, which parks the thread and hands the core to someone else. Getting rescheduled afterwards is measured in microseconds — three orders of magnitude past the uncontended path, and exactly the long tail the closing histogram shows.',
        },
        focus: ['costL', 'lock', 'threadB'],
        shapes: () => [
          meterL('malloc: lock held by A', 'thread B about to call malloc', 'miss'),
          meterR('bump: allocate() done', '~1 ns — one pointer add', 'owned'),
          regionL('MALLOC — FREE LIST'),
          ...leftBlocks({ b2Tone: 'highlight', b2Sub: '24B used / 40B free', b2Label: 'split' }),
          Tag({ key: 'lock', x: 32, y: 200, w: 280, text: 'arena lock: CAS, ~35 ns uncontended', tone: 'miss' }),
          Tag({ key: 'threadB', x: 16, y: 300, w: 332, text: 'thread B: calling malloc right now…', tone: 'neutral' }),
          regionR('ARENA (bump) + SLAB POOL'),
          ...arena(40, 'owned'),
          ...slab(0),
        ],
      },
      {
        say: 'That parked wakeup is a cost a shared heap cannot avoid under contention. A thread-local slab pool sidesteps it completely — each thread keeps its own free list, so there is nothing to lock because nothing is shared.',
        mark: ['30-39'],
        shapes: () => [
          meterL('malloc: thread B parked', 'descheduled — waiting on the lock', 'freed'),
          meterR('slab: allocate() popped 1 node', 'no lock — thread-local pool', 'owned'),
          regionL('MALLOC — FREE LIST'),
          ...leftBlocks({ b2Tone: 'highlight', b2Sub: '24B used / 40B free', b2Label: 'split' }),
          Tag({ key: 'lock', x: 32, y: 200, w: 280, text: 'arena lock: CAS, ~35 ns uncontended', tone: 'miss' }),
          Tag({ key: 'threadB', x: 16, y: 300, w: 332, text: 'thread B: parked — off the CPU', tone: 'freed' }),
          regionR('ARENA (bump) + SLAB POOL'),
          ...arena(40, 'owned'),
          ...slab(1),
          Tag({ key: 'nolock', x: 388, y: 254, w: 296, text: 'each thread owns a free list like this one', tone: 'owned' }),
        ],
      },
      {
        say: 'Sometimes the free list has nothing big enough left, and malloc must ask the kernel for more memory — a `brk`/`mmap` syscall, usually landing on a cache-cold page. A slab pool avoids this on the hot path entirely: it was sized once, at startup.',
        mark: ['24-28'],
        shapes: () => [
          meterL('malloc: free list exhausted', 'mmap(...) — new pages from the kernel', 'freed'),
          meterR('slab: 4 of 5 blocks free', 'sized at startup — no syscall here', 'owned'),
          regionL('MALLOC — FREE LIST'),
          ...leftBlocks({ b1Tone: 'moved', b1Sub: '16B — too small', b2Tone: 'moved', b2Sub: '40B — too small', b2Label: 'free' }),
          Box({ key: 'grow', x: 32, y: 170, w: 276, h: 44, tone: 'freed', dashed: true, mono: true, labelSize: 11, label: 'mmap() — fresh, cache-cold pages' }),
          regionR('ARENA (bump) + SLAB POOL'),
          ...arena(40, 'owned'),
          ...slab(1),
          Tag({ key: 'presized', x: 388, y: 254, w: 296, text: 'pool exhaustion is a startup sizing bug, not a hot-path event', tone: 'owned' }),
        ],
      },
      {
        say: 'Run this millions of times and the shapes diverge completely. The general allocator clusters low but drags a long tail through lock waits and syscalls; the pool allocator stays in a narrow band because its worst case is its average case.',
        mark: [],
        shapes: () => [
          meterL('malloc: p50 ≈ 45 ns', 'p99.9 can exceed 2 µs', 'miss'),
          meterR('slab / bump: p50 ≈ 2 ns', 'p99.9 ≈ 3 ns — no tail', 'owned'),
          regionL('MALLOC — LATENCY, ONE DOT PER CALL'),
          Box({ key: 'histL.0', x: 32, y: 226, w: 18, h: 40, tone: 'miss' }),
          Box({ key: 'histL.1', x: 56, y: 146, w: 18, h: 120, tone: 'miss' }),
          Box({ key: 'histL.2', x: 80, y: 116, w: 18, h: 150, tone: 'miss' }),
          Box({ key: 'histL.3', x: 104, y: 176, w: 18, h: 90, tone: 'miss' }),
          Box({ key: 'histL.4', x: 128, y: 216, w: 18, h: 50, tone: 'miss' }),
          Box({ key: 'histL.5', x: 152, y: 246, w: 18, h: 20, tone: 'miss' }),
          Text({ key: 'gap', x: 195, y: 200, text: '⋯', size: 20, anchor: 'middle', opacity: 0.4 }),
          Box({ key: 'histL.tail0', x: 225, y: 251, w: 18, h: 15, tone: 'miss' }),
          Box({ key: 'histL.tail1', x: 260, y: 258, w: 18, h: 8, tone: 'miss' }),
          Text({ key: 'noteL', x: 16, y: 302, text: 'a cluster around 30–90 ns, then a rare tail out past 2 µs and 5 µs', size: 10.5, mono: true, opacity: 0.75 }),
          regionR('SLAB / BUMP — LATENCY, ONE DOT PER CALL'),
          Box({ key: 'histR.0', x: 430, y: 216, w: 22, h: 50, tone: 'owned' }),
          Box({ key: 'histR.1', x: 460, y: 116, w: 22, h: 150, tone: 'owned' }),
          Box({ key: 'histR.2', x: 490, y: 196, w: 22, h: 70, tone: 'owned' }),
          Text({ key: 'noteR', x: 372, y: 302, text: 'the entire distribution fits in about 1–3 ns — no tail to draw', size: 10.5, mono: true, opacity: 0.75 }),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'allocators.cpp',
    source: `#include <cstddef>
#include <memory>
// Bump (arena) allocator: allocation is one pointer add.
class Arena {
public:
    explicit Arena(std::size_t bytes)
        : buf_(new unsigned char[bytes]), cap_(bytes) {}
    void* allocate(std::size_t n) {
        std::size_t at = (used_ + 7) & ~std::size_t(7);  // 8-byte align
        if (at + n > cap_) return nullptr;               // out of room
        used_ = at + n;
        return buf_.get() + at;
    }
    void reset() { used_ = 0; }   // "free" everything at once
private:
    std::unique_ptr<unsigned char[]> buf_;
    std::size_t cap_, used_ = 0;
};
// Fixed-size slab pool: allocation pops one node off a free list.
class Slab {
public:
    Slab(std::size_t blockSize, std::size_t count)
        : storage_(new unsigned char[blockSize * count]) {
        for (std::size_t i = 0; i < count; ++i) {
            auto* n = reinterpret_cast<Node*>(storage_.get() + i * blockSize);
            n->next = free_;
            free_ = n;
        }
    }
    void* allocate() {
        if (!free_) return nullptr;   // pool exhausted — size it at startup
        Node* n = free_;
        free_ = n->next;
        return n;
    }
    void deallocate(void* p) {
        auto* n = static_cast<Node*>(p);
        n->next = free_;
        free_ = n;                    // O(1): no search, no syscall
    }
private:
    struct Node { Node* next; };
    std::unique_ptr<unsigned char[]> storage_;
    Node* free_ = nullptr;
};`,
    annotations: [
      {
        lines: '9-12',
        text: 'Allocation is arithmetic, not a lookup: round up to an 8-byte boundary, check it still fits, bump the offset, hand back the old value. Nothing here is shared, so nothing here needs a lock.',
      },
      {
        lines: '14',
        text: '`reset()` throws away every outstanding allocation at once by moving the offset back to zero. There is no way to free a single object — that trade is exactly what makes allocation this cheap.',
      },
      {
        lines: '24-28',
        text: 'The free list is built once, at construction, by threading each block’s own first bytes into a `next` pointer. Memory that was going to sit there anyway becomes the bookkeeping — there is no separate structure to allocate for it.',
      },
      {
        lines: '30-39',
        text: '`allocate()` and `deallocate()` are the same instruction in reverse: unlink or link one node. No size class to compute, no neighbour to check for coalescing, and if this `Slab` is thread-local, nothing here is ever contended.',
      },
    ],
  },

  deeper: [
    'A general-purpose allocator earns its complexity honestly: glibc’s `malloc` keeps several free lists ("bins") indexed by size class, splits and coalesces blocks as they are freed, and protects each arena with a mutex because more than one thread can call into it at once. Requests above a threshold (128 KB by default) skip the free list entirely and go straight to `mmap`, trading a syscall for never having to worry about fragmenting that block. Every one of those choices is correct for a library that has to serve arbitrary code — they are also every reason a single call to `malloc` does not have a fixed cost.',
    'A bump/arena allocator throws almost all of that away on purpose. There is no metadata next to your object beyond what alignment requires, and there is no way to free one allocation — only to reset or destroy the whole arena. That trade fits any workload with a natural "allocate many, free together" shape: one incoming request in a server, one tick of a trading strategy, one frame of a game loop. A useful side effect: because allocations are handed out in address order, consecutive objects from the same arena are physically adjacent, which is good for the cache in exactly the way a scattered heap is not.',
    'A fixed-size slab pool is the answer when objects need to be freed individually but their size never varies — order objects, packet buffers, tree nodes. The trick is that the free list needs no separate storage: each free block’s own bytes hold the pointer to the next free block, since nobody is using those bytes for anything else right now. Push and pop are both "touch one pointer," with no branch on size and nothing to coalesce, because every block is already the same size.',
    'The lock is the part a thread-local pool removes entirely, not just shrinks. Give each thread its own arena or slab, created once at startup, and `allocate`/`deallocate` never touch a structure any other thread can see — there is nothing to protect, so there is nothing to contend on. The cost that reappears is on the other side: an object allocated by thread A and freed by thread B needs somewhere to go, because it cannot simply rejoin a free list only A ever looks at. Production allocators like tcmalloc and jemalloc solve this with a small, occasionally-flushed cross-thread return path — hand-rolled pools usually solve it by design, keeping ownership on one thread for the object’s whole life.',
    'None of this shows up in an average. A microbenchmark that calls `malloc` a million times back to back, warm, uncontended, single-threaded, measures none of the costs that matter: the lock under real concurrency, the syscall when the free list runs dry, the cold cache line on memory nobody has touched recently. The entire argument for a custom allocator is a tail-latency argument, not a mean-latency one — `std::pmr::monotonic_buffer_resource` and `std::pmr::unsynchronized_pool_resource` (both in `<memory_resource>`, C++17) give you the arena and the pool pattern from the standard library, for exactly this reason.',
  ],

  gotchas: [
    'A bump allocator cannot free a single object — only reset the whole arena. Using one for objects with genuinely different lifetimes leaks everything until the next reset, silently.',
    'Forgetting to round the bump pointer to the right alignment produces a pointer that is technically wrong for its type, which is undefined behaviour and can fault outright on types that require strict alignment, like SIMD vectors.',
    'A slab pool sized for yesterday’s workload returns `nullptr` (or worse, is not checked and dereferences one) the moment demand exceeds it. Test the exhaustion path deliberately — do not assume the pool you sized in a meeting is the pool production will need.',
    'Mixing `std::pmr` containers with the wrong resource lifetime is a dangling-arena bug: if the `monotonic_buffer_resource` is destroyed while a container built on top of it is still alive, every element is now pointing at freed memory, and nothing about the container’s type says so.',
    'Benchmarking an allocator on a warm, single-threaded, low-pressure microbenchmark hides exactly the costs this lesson is about. Measure under the concurrency and the fragmentation the real system will actually see, or the mean you get back is not the number that will page someone at 3 a.m.',
  ],

  interview: {
    q: 'Why would you write your own allocator instead of just using `malloc`/`new`? Walk me through what actually gets expensive.',
    a: [
      'malloc has to serve arbitrary sizes from arbitrary threads at arbitrary times, and doing that safely means maintaining free lists, splitting and coalescing blocks, and — critically — taking a lock around the search and splice, because more than one thread can be inside it at once. Uncontended, that lock is a single atomic compare-and-exchange, tens of nanoseconds. Contended, the calling thread can be descheduled entirely and the cost balloons into microseconds. On top of that, when the free list cannot satisfy a request, malloc calls into the kernel for more pages, and those pages are almost always cache-cold.',
      'A bump or arena allocator sidesteps nearly all of that: it hands out memory by advancing one pointer, so allocation is a handful of instructions with no branch on size class and no lock, because there is no shared structure to protect — especially once the arena is thread-local. It gives that up wholesale on deallocation: you cannot free one object, only reset or destroy the whole arena, so it fits allocate-many/free-together lifetimes rather than general-purpose use. A fixed-size slab pool is the complementary tool for objects that do need individual frees but never change size: the free list lives inside the freed memory itself, so push and pop are both one pointer write.',
      'The detail that separates a memorised answer from an understood one: none of this is about making the average allocation faster. It is about making the worst case the same as the average case. A hot path does not care that malloc is usually 25 nanoseconds — it cares that it is sometimes 25 microseconds, and a custom allocator’s entire value is deleting that "sometimes" rather than shrinking it.',
    ],
  },

  exercise: [
    'Implement (or use) the `Arena` and `Slab` classes above and benchmark them against `malloc`/`free` for ten million calls of a small fixed size, using `std::chrono::steady_clock` per call. Print the p50, p99, and p99.9, not just the mean, and build with `g++ -O2 -pthread`. The gap between p50 and p99.9 for malloc is the whole subject of this lesson made visible.',
    'Then run the malloc benchmark from four threads sharing one heap at once and re-measure the tail. Compare it against four threads each using its own `Slab`. Watch the p99.9 for the shared case with `strace -c -f` running alongside — count the `futex` and `brk`/`mmap` calls, and note that the thread-local version makes none of either.',
  ],
};
