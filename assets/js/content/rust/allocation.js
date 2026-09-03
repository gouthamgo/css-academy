import { Region, Frame, Cells, Box, Arrow, Bracket, Text } from '../../viz/primitives.js';

/* Shared geometry. The Vec header never moves; only the heap changes,
   which is the point of the whole lesson. */
const STACK = { x: 40, y: 66, w: 250, h: 262 };
const HEAP = { x: 316, y: 66, w: 360, h: 262 };

const V_X = 60;
const V_Y = 96;
const V_W = 208;
const PTR_Y = V_Y + 44; // the `ptr` row inside the frame

const H0 = { x: 336, y: 96, w: 88, h: 40 };
const H1 = { x: 336, y: 156, w: 176, h: 40 };
const H2 = { x: 336, y: 216, w: 320, h: 40 };

const regions = () => [
  Region({ key: 'r.stack', ...STACK, label: 'STACK', tone: 'stack' }),
  Region({ key: 'r.heap', ...HEAP, label: 'HEAP', tone: 'heap' }),
];

/* The Vec is three words. Everything else in the picture is the buffer
   those three words happen to be describing right now. */
const vec = (len, cap, ptr, tone = 'stack') =>
  Frame({
    key: 'vec',
    x: V_X,
    y: V_Y,
    w: V_W,
    label: 'v: Vec<i32>',
    tone,
    vars: [
      { name: 'ptr', value: ptr, tone: ptr === 'dangling' ? 'moved' : 'heap' },
      { name: 'len', value: String(len) },
      { name: 'cap', value: String(cap) },
    ],
  });

const block = (key, geom, cap, bytes, tone = 'heap', dashed = false) =>
  Box({
    key,
    ...geom,
    label: `cap ${cap}`,
    sub: `${bytes} B`,
    tone,
    dashed,
  });

const ptrTo = (geom, bend) =>
  Arrow({
    key: 'a.ptr',
    from: [V_X + V_W, PTR_Y],
    to: [geom.x - 4, geom.y + geom.h / 2],
    shape: 'curve',
    bend,
    tone: 'heap',
  });

const counter = (calls, copied) => [
  Text({
    key: 'ctr',
    x: 40,
    y: 358,
    text: `allocator calls: ${calls}`,
    size: 15,
    mono: true,
    weight: 700,
    tone: calls > 1 ? 'miss' : 'hit',
  }),
  Text({
    key: 'copied',
    x: 330,
    y: 358,
    text: `bytes copied: ${copied}`,
    size: 15,
    mono: true,
    weight: 700,
    tone: copied > 0 ? 'miss' : 'hit',
  }),
];

const note = (text) =>
  Text({ key: 'note', x: 40, y: 390, text, size: 12, mono: true, tone: 'neutral', opacity: 0.9 });

const loopLine = (text) =>
  Text({ key: 'loop', x: 40, y: 40, text, size: 12.5, mono: true, weight: 650, tone: 'highlight' });

export default {
  oneLiner:
    'Which lines call the allocator, which do not, and how to move the ones that do out of your hot loop.',

  whyJob:
    'Allocation is the single most common reason a Rust service is slower than the C it replaced. An infrastructure interviewer will show you a hot loop and ask which lines touch `malloc` — the answer separates people who have profiled from people who have read.',

  mentalModel:
    'Think of the allocator as a warehouse clerk you have to queue for. Reading and writing memory you already hold is free — walking to the counter is not. A `Vec` that outgrows its shelf does not get a bigger shelf: it gets a *whole new shelf*, everything is carried across, and the old one is handed back. `with_capacity` is asking for the right shelf once, at the start.',

  scene: {
    id: 'vec-growth-allocation',
    title: 'Growing a Vec, one allocator call at a time',
    width: 720,
    height: 420,
    legend: [
      { tone: 'heap', label: 'live heap block' },
      { tone: 'freed', label: 'released block' },
      { tone: 'miss', label: 'allocator was called' },
    ],
    steps: [
      {
        say: 'An empty `Vec` has not been to the warehouse. The pointer is a non-null, correctly aligned sentinel that is never dereferenced, and `Vec::new()` is a `const fn` — it can be evaluated at compile time because there is nothing to evaluate.',
        mark: ['4'],
        shapes: () => [
          ...regions(),
          loopLine('let mut v: Vec<i32> = Vec::new();'),
          vec(0, 0, 'dangling'),
          Text({
            key: 'empty',
            x: 496,
            y: 190,
            text: 'the heap is untouched',
            size: 12.5,
            mono: true,
            anchor: 'middle',
            tone: 'neutral',
            opacity: 0.75,
          }),
          ...counter(0, 0),
          note('Vec::new() is a const fn. No allocator call, no heap block, cap = 0.'),
        ],
      },
      {
        say: 'The first `push` finds capacity zero and has to ask. Rust does not start at one element — for a type this small `RawVec` opens at four slots, because a four-byte allocation would be regretted on the very next push.',
        mark: ['6'],
        shapes: () => [
          ...regions(),
          loopLine('for i in 0..16 { v.push(i); }        // i = 0'),
          vec(1, 4, '0x5a00'),
          block('h0', H0, 4, 16),
          ptrTo(H0, 22),
          ...counter(1, 0),
          note('First push: alloc(16 bytes). RawVec opens at 4 slots for a 4-byte type.'),
        ],
      },
      {
        say: 'Push number five has nowhere to go. You do not get a bigger block — you get a *different* one, the old contents are memcpy’d across, and the old block goes back. Every reference and every raw pointer into the old buffer is dangling from this instant, which is exactly the rule the borrow checker enforces at compile time.',
        mark: ['6'],
        focus: ['h0', 'h1', 'm0', 'a.ptr', 'ctr', 'copied'],
        shapes: () => [
          ...regions(),
          loopLine('for i in 0..16 { v.push(i); }        // i = 4'),
          vec(5, 8, '0x6100'),
          block('h0', H0, 4, 16, 'freed', true),
          block('h1', H1, 8, 32),
          Arrow({
            key: 'm0',
            from: [H0.x + H0.w, H0.y + H0.h],
            to: [H1.x + H1.w, H1.y + 6],
            shape: 'curve',
            bend: -18,
            tone: 'miss',
            label: 'copy 16 B',
          }),
          ptrTo(H1, -24),
          ...counter(2, 16),
          note('Every pointer into the old block is now dangling — hence the borrow rule.'),
        ],
      },
      {
        say: 'Push nine does it again. The capacity sequence is 4, 8, 16, 32 — each block is twice the last, so the number of trips to the allocator is logarithmic in the final length rather than proportional to it.',
        mark: ['6'],
        predict: {
          ask: 'You push 1000 `i32`s into a `Vec::new()`. How many times does the allocator run?',
          options: [
            { label: '1000 — once per element', correct: false },
            { label: '9 — capacity doubles: 4, 8, 16 … 512, 1024', correct: true },
            { label: '1 — the compiler works out the final length', correct: false },
          ],
          because:
            'Capacity doubles, so allocator calls grow like log2(n). Nine calls get you from 4 to 1024. The compiler cannot pre-size it: `push` is a runtime call in a runtime loop and nothing in the type says how many times it runs.',
        },
        shapes: () => [
          ...regions(),
          loopLine('for i in 0..16 { v.push(i); }        // i = 8'),
          vec(9, 16, '0x7400'),
          block('h0', H0, 4, 16, 'freed', true),
          block('h1', H1, 8, 32, 'freed', true),
          block('h2', H2, 16, 64),
          Arrow({
            key: 'm0',
            from: [H0.x + H0.w, H0.y + H0.h],
            to: [H1.x + H1.w, H1.y + 6],
            shape: 'curve',
            bend: -18,
            tone: 'moved',
            label: 'copy 16 B',
          }),
          Arrow({
            key: 'm1',
            from: [H1.x + H1.w, H1.y + H1.h],
            to: [H2.x + H2.w, H2.y + 6],
            shape: 'curve',
            bend: -18,
            tone: 'miss',
            label: 'copy 32 B',
          }),
          ptrTo(H2, -30),
          ...counter(3, 48),
          note('Caps go 4, 8, 16, 32 … so allocator calls grow like log2(n), not n.'),
        ],
      },
      {
        say: 'Now add up the copying. Four elements moved, then eight. A doubling series sums to one short of its last term, so growing to *n* elements copies about *n* elements in total across every move you will ever do — not n², and not n per push.',
        mark: ['26'],
        focus: ['h0', 'h1', 'h2', 'sum', 'law', 'ctr', 'copied'],
        shapes: () => [
          ...regions(),
          loopLine('for i in 0..16 { v.push(i); }        // done'),
          vec(16, 16, '0x7400'),
          block('h0', H0, 4, 16, 'freed', true),
          block('h1', H1, 8, 32, 'freed', true),
          block('h2', H2, 16, 64),
          ptrTo(H2, -30),
          Bracket({
            key: 'sum',
            x: H2.x,
            y: 274,
            w: H2.w,
            label: '16 + 32 = 48 B copied',
            tone: 'miss',
          }),
          Text({
            key: 'law',
            x: H2.x,
            y: 312,
            text: 'total copies ~ n',
            size: 12,
            mono: true,
            tone: 'miss',
            weight: 650,
          }),
          ...counter(3, 48),
          note('Sum of a doubling series is one short of its last term: total copies ~ n.'),
        ],
      },
      {
        say: 'Same sixteen elements, one trip to the counter, nothing copied, and one block that stays put for the life of the vector. If you know the length — or even a loose upper bound — this is the highest-value single-line change in the lesson.',
        mark: ['12'],
        shapes: () => [
          ...regions(),
          loopLine('let mut v = Vec::with_capacity(16);'),
          vec(16, 16, '0x7400', 'owned'),
          block('h2', H2, 16, 64, 'owned'),
          ptrTo(H2, -30),
          ...counter(1, 0),
          note('with_capacity(16): one call, zero copies, one block for the whole life.'),
        ],
      },
      {
        say: '`SmallVec<[i32; 16]>` goes further and puts the first sixteen elements inside the struct itself, on the stack. Under the threshold there is no allocator call at all; over it, it spills to the heap and behaves like a `Vec`. You pay 72 bytes of struct instead of 24, and a branch on every element access.',
        mark: [],
        shapes: () => [
          ...regions(),
          loopLine('let mut v: SmallVec<[i32; 16]> = smallvec![];'),
          Box({
            key: 'sv',
            x: V_X,
            y: V_Y,
            w: V_W,
            h: 116,
            label: 'SmallVec<[i32; 16]>',
            sub: '72 B · 16 slots inline',
            tone: 'owned',
            labelSize: 12,
            mono: true,
          }),
          ...Cells({
            key: 'inl',
            x: V_X + 14,
            y: 178,
            values: ['0', '1', '2', '3', '4', '5', '6', '7'],
            w: 22,
            h: 26,
            tone: 'owned',
          }),
          Text({
            key: 'empty',
            x: 496,
            y: 190,
            text: 'still untouched',
            size: 12.5,
            mono: true,
            anchor: 'middle',
            tone: 'neutral',
            opacity: 0.75,
          }),
          ...counter(0, 0),
          note('ArrayVec is the stricter cousin: it cannot spill, so push past N panics.'),
        ],
      },
    ],
  },

  code: {
    lang: 'rust',
    filename: 'main.rs',
    source: `use std::time::Instant;

fn naive(n: usize) -> Vec<u64> {
    let mut v = Vec::new();             // no allocation yet
    for i in 0..n {
        v.push(i as u64);               // reallocates ~log2(n) times
    }
    v
}

fn hoisted(n: usize) -> Vec<u64> {
    let mut v = Vec::with_capacity(n);  // one allocation, exact size
    for i in 0..n {
        v.push(i as u64);               // never reallocates
    }
    v
}

fn watch_growth() {
    let mut v: Vec<u64> = Vec::new();
    let mut cap = v.capacity();
    for i in 0..1_000u64 {
        v.push(i);
        if v.capacity() != cap {
            cap = v.capacity();
            println!("realloc -> cap {cap}");   // 4, 8, 16, ... 1024
        }
    }
}

fn main() {
    watch_growth();

    let t = Instant::now();
    let a = naive(10_000_000);
    println!("naive:   {:?}", t.elapsed());

    let t = Instant::now();
    let b = hoisted(10_000_000);
    println!("hoisted: {:?}", t.elapsed());

    assert_eq!(a.len(), b.len());
}`,
    annotations: [
      {
        lines: '4',
        text: 'This line does **not** allocate, and neither does `Vec::with_capacity(0)`. An empty vector is three words on the stack and nothing else.',
      },
      {
        lines: '12',
        text: 'One allocator call for the whole function. The win is not only the saved calls — it is that the buffer never moves, so the CPU keeps the same physical pages warm in the TLB and the prefetcher keeps its stride.',
      },
      {
        lines: '26',
        text: 'Print the capacity every time it changes and you can watch the doubling with your own eyes. Do this once; it makes the rest of the lesson permanent.',
      },
      {
        lines: '35-40',
        text: 'Expect the hoisted version to win by roughly 25–40% on ten million elements. Almost none of that is the allocator calls themselves — it is the ~80 MB of copying the naive version does on the way up.',
      },
    ],
  },

  deeper: [
    'The complete list of things that reach the allocator is shorter than people fear. `Box::new`, `Rc::new`, `Arc::new`, `Vec::with_capacity`, a `push`/`insert`/`extend` past capacity, `String` growth, `format!` and `to_string` and `to_owned` and `to_vec`, `collect` into any owned container, `clone` on a heap-owning type, boxing a closure or a trait object, and spawning a thread (which mmaps a 2 MiB stack by default). Everything else you write all day — struct literals, `&` borrows, slicing, moves, iterator adapters before the final `collect`, arithmetic, `Copy` types, pattern matching — touches no allocator at all. Rust has no hidden boxing: if you cannot point at one of the calls above, the line is allocation-free.',
    'Underneath, every one of those goes through the `GlobalAlloc` trait, and by default that is `std::alloc::System`, which is `malloc`/`free` from your libc. On glibc a small allocation that hits the per-thread `tcache` is on the order of 15–30 ns; one that misses and has to take an arena lock is several times that; and one over the 128 KiB `M_MMAP_THRESHOLD` becomes an `mmap` syscall whose pages are not backed until you touch them, so you pay a page fault of a few microseconds per 4 KiB page on first write. That last effect is why a freshly allocated 1 GB buffer "takes no time" and then the first pass over it is mysteriously slow.',
    'You can swap the whole thing out in three lines: `#[global_allocator] static A: MiMalloc = MiMalloc;` with the `mimalloc` crate, or `tikv-jemallocator` for jemalloc. Rust shipped jemalloc as the default until 1.32 and then dropped it to keep binaries small and to stop shadowing the system allocator. On multithreaded, allocation-heavy servers both replacements usually recover low-double-digit percentage throughput over glibc and, more importantly, hold resident memory far flatter under a fragmenting workload — which is why so many Rust services in production carry one of those three lines. Measure it on your workload; on a single-threaded batch job the difference is often nil.',
    '`collect` is smarter than it looks and it matters. An iterator that implements `ExactSizeIterator` or `TrustedLen` — `slice.iter().map(f)`, a `Range`, `vec.into_iter()` — reports an exact `size_hint`, and `collect` uses it to allocate the final buffer once. Put a `.filter()` in the chain and the upper bound disappears, so `collect` falls back to growing, and you are back to nine allocations. That is why `v.iter().map(f).collect::<Vec<_>>()` is allocation-optimal and `v.iter().filter(p).collect::<Vec<_>>()` is not — and why `Vec::with_capacity(v.len())` plus `extend` is the fix when you know the filter usually keeps everything.',
    'To get numbers rather than opinions, install a counting allocator: a struct that wraps `System`, increments an `AtomicUsize` in `alloc`, and forwards. Twenty lines, and it turns "I think this allocates" into a count per request. For the fuller picture use `dhat-rs` (a Rust-native heap profiler that reports total blocks, total bytes and peak) or `heaptrack` on Linux. A profile that says 4.2 million allocations for 2 million messages tells you the number to aim at — zero, or one per batch — far better than a flamegraph does.',
  ],

  gotchas: [
    '`with_capacity` on the wrong side of the loop does nothing. If you write `for _ in 0..n { let mut v = Vec::with_capacity(k); ... }` you have moved the allocation *into* the loop, not out of it. The fix is to allocate once outside and call `v.clear()` at the top of each iteration — `clear` drops the elements but keeps the capacity, which is the entire trick.',
    '`format!` allocates a fresh `String` on every single call, and it is the most common accidental allocation in Rust logging and serialisation code. In a hot path, keep one `String`, `write!(&mut s, ...)` into it with `use std::fmt::Write`, and `s.clear()` between uses. Assigning `s = String::new()` instead of calling `clear()` throws the capacity away and puts the allocation right back.',
    '`Box::new([0u8; 1 << 20])` may build the megabyte array on the stack first and then copy it into the box. The optimiser usually elides that in release, and reliably does not in debug — so this line is a classic "works in release, stack overflow in `cargo test`". Use `vec![0u8; 1 << 20].into_boxed_slice()` when the size is large.',
    '`shrink_to_fit` is not free and is not a hint: it allocates a correctly sized block, copies everything into it, and frees the old one. Calling it in a loop is strictly worse than leaving the slack alone.',
    '`clone()` means very different things depending on the type. `Arc::clone` is one relaxed atomic increment and no allocation; `Vec::clone` and `String::clone` allocate and copy every byte. When a reviewer says "this clone is fine", they are making a claim about which of those two it is.',
  ],

  interview: {
    q: 'A Rust service you own is spending 30% of its CPU in `malloc` and `free` according to the flamegraph. Walk me through what you would do.',
    a: [
      'First I would find out *what* is allocating, not guess. A counting global allocator gives me allocations-per-request in about twenty lines, and `dhat` or `heaptrack` gives me the call sites ranked by block count. Thirty percent in the allocator almost always means many small short-lived allocations rather than a few big ones, so the number I want is allocations per unit of work — if it is four per message and the message is 64 bytes, that is the bug, not the allocator.',
      'Then I would attack it in a fixed order, cheapest first. Hoist: replace `Vec::new()` in a loop with one `with_capacity` outside it and `clear()` inside, so the buffer is reused. Borrow instead of own: if a parsed field is only read, make it a `&[u8]` into the input rather than a `String`, which usually deletes the allocation entirely. Inline the small case: `SmallVec` or `ArrayVec` when the length is nearly always under some small bound, which trades a fatter struct and a branch for zero allocator traffic. Only after all that would I reach for pooling or an arena like `bumpalo`, because a pool is real complexity and a lifetime problem you have to keep solving.',
      'Swapping the global allocator to mimalloc or jemalloc is the last thing I would do, not the first, and I would be explicit about why: it is a two-line change that typically buys low double digits on a threaded workload and much steadier RSS, but it makes an expensive operation cheaper rather than making it stop happening. If the answer is "we now do four million mallocs a second slightly faster", the real fix is still ahead of us. The strongest version of this answer names a target — one allocation per batch, not per message — and measures against it.',
    ],
  },

  exercise: [
    'Paste the program above into a project and run `cargo run --release`. Note the two timings. Then change `10_000_000` to `100_000` and run it again — the gap should shrink sharply, because the copying is proportional to n while the allocator calls are only logarithmic. Being able to explain *that* shape is worth more than memorising the API.',
    'Then write the counting allocator. Wrap `std::alloc::System` in a struct, implement `GlobalAlloc` so `alloc` does `COUNT.fetch_add(1, Ordering::Relaxed)` before delegating, mark it `#[global_allocator]`, and print the count at the end of `main`. Run it against `naive(1000)` and `hoisted(1000)` and check that you get 9 and 1. Then point it at whatever code you actually care about and see what number comes back — the answer is usually a surprise.',
    'Finally, add `smallvec = "1"` and rewrite a function of yours that builds a short `Vec` to use `SmallVec<[T; 8]>`. Benchmark it. If the length is genuinely under 8 nearly always, expect the allocator count to hit zero and the wall time to drop; if it is not, expect it to get slower, because you added a branch and a bigger struct for nothing. Both outcomes are the lesson.',
  ],
};
