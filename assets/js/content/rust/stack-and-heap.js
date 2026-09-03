import { Region, Cell, Cells, Frame, Arrow, Text } from '../../viz/primitives.js';

/* ------------------------------------------------------------------
   One stack region, one heap region, for the whole scene. Rows are
   introduced one at a time and keep fixed y-slots so later steps can
   reference earlier rows without recomputing their geometry.
   ------------------------------------------------------------------ */
const STACK = { x: 24, y: 56, w: 300, h: 340 };
const HEAP = { x: 356, y: 56, w: 340, h: 340 };
const ROW = { a: 80, b: 144, c: 204, d: 264 };

const regions = () => [
  Region({ key: 'stack', ...STACK, label: 'STACK', tone: 'stack' }),
  Region({ key: 'heap', ...HEAP, label: 'HEAP', tone: 'heap' }),
];

const cellA = () => Cell({ key: 'a', x: 48, y: ROW.a, w: 120, h: 50, name: 'a: i32', value: '42', tone: 'owned' });
const cellB = () => [
  Text({ key: 'bLabel', x: 48, y: ROW.b - 14, text: 'b: [u8; 4]', size: 11, mono: true, opacity: 0.7 }),
  ...Cells({ key: 'b', x: 48, y: ROW.b, w: 34, h: 44, gap: 4, values: ['1', '2', '3', '4'], tone: 'owned' }),
];

export default {
  oneLiner:
    'The same machine as C++, but a different question about who is responsible for giving memory back — and why some Rust values never touch the heap at all.',

  whyJob:
    'Almost every Rust systems question at this level comes down to "where does this actually live, and what gets copied when I pass it." A candidate who cannot say offhand that a `String` is three machine words handed around by value has not yet built the model the rest of the language stands on.',

  mentalModel:
    'The stack and the heap are the same physical RAM — the difference is who is allowed to hand out space and who has to give it back. A stack value is *baked into the frame*: its size must be nailed down before the function even runs, the way a shipping label has to state a box\'s exact dimensions before it goes on the truck. `Box`, `String` and `Vec` are the mechanism for "I do not know how big this needs to be yet, or it needs to outlive this frame": you keep a small, *fixed-size claim ticket* on the stack, and the actual contents live on the heap, where their size is free to vary or grow.',

  scene: {
    id: 'stack-heap-rust',
    title: 'Four bindings, two very different footprints',
    width: 720,
    height: 420,
    legend: [
      { tone: 'owned', label: 'value lives entirely here' },
      { tone: 'heap', label: 'heap allocation / a pointer to one' },
    ],
    steps: [
      {
        say: 'An `i32` needs exactly 4 bytes, always. The compiler knows that before the program runs, so the whole value fits directly in the stack frame — no pointer, no separate allocation, nothing indirect about it.',
        mark: ['2'],
        shapes: () => [...regions(), cellA()],
      },
      {
        say: 'A fixed-size array is the same story generalised: `[u8; 4]` is 4 bytes because its length is part of the type itself, known at compile time. Same rule as `i32` — the value fits in the frame because its size was never in question.',
        mark: ['3'],
        shapes: () => [...regions(), cellA(), ...cellB()],
      },
      {
        say: '`Box::new(42)` is different: one pointer sits on the stack, and the `i32` it owns lives in one freshly allocated heap cell. This is the smallest possible heap allocation Rust offers.',
        mark: ['5-6'],
        focus: ['c', 'cHeap', 'cArrow'],
        predict: {
          ask: 'What is `std::mem::size_of::<Box<i32>>()` on a 64-bit machine?',
          options: [
            { label: '4 bytes — same as the i32 it holds', correct: false },
            { label: '8 bytes — one pointer, regardless of what it points at', correct: true },
            { label: '12 bytes — a pointer plus a stored size', correct: false },
          ],
          because:
            'A Box is exactly one pointer. The compiler already knows the size of the type it points at from the type itself — that is what `T: Sized` means — so nothing about that size needs to be stored alongside the pointer at runtime.',
        },
        shapes: () => [
          ...regions(),
          cellA(),
          ...cellB(),
          Cell({ key: 'c', x: 48, y: ROW.c, w: 120, h: 50, name: 'c: Box<i32>', value: '0x9a00', tone: 'heap' }),
          Cell({ key: 'cHeap', x: 430, y: ROW.c, w: 70, h: 50, value: '42', tone: 'heap', addr: '0x9a00' }),
          Arrow({ key: 'cArrow', from: [168, ROW.c + 25], to: [426, ROW.c + 25], tone: 'heap' }),
        ],
      },
      {
        say: 'Box a value a million times larger and the stack side does not move: `e: Box<[u8; 1_000_000]>` is still exactly one pointer, still 8 bytes. Only the heap side grew — from one byte to a million.',
        mark: ['8-13'],
        focus: ['c', 'e', 'eHeap', 'eArrow'],
        shapes: () => [
          ...regions(),
          Cell({ key: 'c', x: 48, y: 152, w: 120, h: 50, name: 'c: Box<i32>', value: '0x9a00', tone: 'heap' }),
          Cell({ key: 'e', x: 188, y: 152, w: 120, h: 50, name: 'e: Box<[u8;1M]>', value: '0xb200', tone: 'heap' }),
          Cell({ key: 'cHeap', x: 380, y: 152, w: 50, h: 50, value: '42', tone: 'heap', addr: '0x9a00' }),
          Region({ key: 'eHeap', x: 470, y: 96, w: 190, h: 220, label: '1,000,000 bytes', tone: 'heap' }),
          Arrow({ key: 'cArrow', from: [168, 177], to: [378, 177], tone: 'heap' }),
          Arrow({ key: 'eArrow', from: [308, 177], to: [468, 177], tone: 'heap' }),
          Text({ key: 'sameSize', x: 48, y: 300, text: 'both stack cells: 8 bytes, identical size_of::<Box<_>>()', size: 11, mono: true, opacity: 0.65 }),
        ],
      },
      {
        say: 'A `String` is a three-word header — pointer, length, capacity — pointing at a heap buffer of UTF-8 bytes. Grow the text to a thousand characters and this header on the stack is still exactly the same 24 bytes; only the buffer it points at gets bigger.',
        mark: ['15-21'],
        focus: ['dFrame', 'dHeap', 'dArrow'],
        shapes: () => [
          ...regions(),
          cellA(),
          ...cellB(),
          Frame({
            key: 'dFrame',
            x: 48,
            y: ROW.d,
            w: 220,
            label: 'd: String',
            vars: [
              { name: 'ptr', value: '0xA100', tone: 'heap' },
              { name: 'len', value: '5' },
              { name: 'cap', value: '5' },
            ],
          }),
          ...Cells({ key: 'dHeap', x: 430, y: ROW.d + 30, values: ['h', 'e', 'l', 'l', 'o'], w: 34, h: 40, tone: 'heap' }),
          Arrow({ key: 'dArrow', from: [268, ROW.d + 44], to: [426, ROW.d + 50], tone: 'heap', bend: -18 }),
        ],
      },
      {
        say: 'Four bindings, four very different heap footprints — zero, zero, one, and one growable buffer — and yet the stack cost of each is fixed the moment its type is written down. `Vec<T>` shares the exact same three-word shape as `String`; everything here applies to it directly.',
        mark: [],
        shapes: () => [
          Text({ key: 'th', x: 48, y: 90, text: 'binding        stack bytes     heap bytes', size: 13, mono: true, weight: 650, opacity: 0.85 }),
          Text({ key: 't1', x: 48, y: 126, text: 'a: i32          4               0', size: 12.5, mono: true, opacity: 0.8 }),
          Text({ key: 't2', x: 48, y: 158, text: 'b: [u8; 4]      4               0', size: 12.5, mono: true, opacity: 0.8 }),
          Text({ key: 't3', x: 48, y: 190, text: 'c: Box<i32>     8               1', size: 12.5, mono: true, opacity: 0.8 }),
          Text({ key: 't4', x: 48, y: 222, text: 'e: Box<[u8;1M]> 8               1,000,000', size: 12.5, mono: true, tone: 'highlight', opacity: 0.95 }),
          Text({ key: 't5', x: 48, y: 254, text: 'd: String       24              5 (grows with content)', size: 12.5, mono: true, opacity: 0.8 }),
          Text({ key: 'tf', x: 48, y: 300, text: 'stack cost: fixed at compile time. heap cost: decided at runtime.', size: 12, mono: true, tone: 'heap', weight: 650 }),
        ],
      },
    ],
  },

  code: {
    lang: 'rust',
    filename: 'main.rs',
    source: `fn main() {
    let a: i32 = 42;                        // entirely on the stack, 4 bytes
    let b: [u8; 4] = [1, 2, 3, 4];           // also entirely on the stack

    let c: Box<i32> = Box::new(42);          // one pointer on the stack...
    println!("c points at {:p}, holds {}", c, *c);   // ...to one i32 on the heap

    let e: Box<[u8; 1_000_000]> = Box::new([0; 1_000_000]);
    println!(
        "size_of::<Box<i32>>() = {}  size_of::<Box<[u8;1_000_000]>>() = {}",
        std::mem::size_of::<Box<i32>>(),
        std::mem::size_of::<Box<[u8; 1_000_000]>>()
    );

    let d: String = String::from("hello");   // three words: ptr, len, cap
    println!(
        "size_of::<String>() = {}  len = {}  cap = {}",
        std::mem::size_of::<String>(),
        d.len(),
        d.capacity()
    );

    println!("a={a} b={b:?}");
}`,
    annotations: [
      {
        lines: '2-3',
        text: '`i32` and `[u8; 4]` have sizes known at compile time, so the whole value fits in the frame — nothing here is ever "too big to know in advance."',
      },
      {
        lines: '5-6',
        text: '`Box<i32>` is the simplest possible heap allocation: one pointer, pointing at one heap-allocated `i32`.',
      },
      {
        lines: '8-13',
        text: '`size_of` proves it: `Box<i32>` and `Box<[u8; 1_000_000]>` are the *same* size on the stack, because a `Box` is always just a pointer once the pointee\'s size is fixed at compile time.',
      },
      {
        lines: '15-21',
        text: '`String`\'s three words — 24 bytes on a 64-bit machine — never depend on how long the text is. Only the heap buffer they point at grows.',
      },
    ],
  },

  deeper: [
    'A type can live as a plain local only if the compiler can compute its exact size before the program runs, because that size is baked directly into the generated code as an offset from the stack pointer. A type without a statically known size — `str` itself (not `&str`), a slice `[T]`, or `dyn Trait` — cannot be a bare local at all, and the compiler says so directly: "the size for values of type `str` cannot be known at compilation time." You always reach one through something with a fixed size that points at it — `&str`, `&[T]`, `Box<dyn Trait>` — which is exactly what `Sized` versus `?Sized` is encoding in the type system.',
    '`Box::new(v)` performs one heap allocation sized precisely for `v`\'s type, writes `v`\'s bytes into it, and hands back a pointer wrapped in a type that knows to clean up after itself. Dropping a `Box<T>` runs `T`\'s destructor if it has one, then deallocates — the entire value of `Box` over a raw `*mut T` is that this happens automatically, at a compiler-chosen point, the same deterministic-destruction story as the ownership lesson.',
    '`String` is, under the hood, a `Vec<u8>` with one added invariant: the bytes are guaranteed valid UTF-8. They share the identical three-word header, which is why every fact about `String`\'s stack footprint here applies to `Vec<T>` unchanged, and why converting between the two (`String::into_bytes`, `Vec::from` / `String::from_utf8`) can be a matter of just relabelling the same header rather than copying anything.',
    'Because the header is small and fixed, passing a `String` or `Vec<T>` by value costs exactly copying that header — 24 bytes — never the buffer. This is what lets Rust function signatures take and return owned `String`s and `Vec`s freely without the instinctive flinch a C++ programmer has about `std::string` by value; the move semantics from the ownership lesson mean the buffer itself is never duplicated on a plain move, only on an explicit `.clone()`.',
    'A stack overflow and a failed heap allocation are different failures with different symptoms. Blowing the stack — a `[u8; 1024]` local recursed too deep, typically past an 8MB default on Linux — aborts immediately with a signal, no `Result` involved anywhere. A heap allocation Rust\'s default global allocator cannot satisfy currently aborts the process too rather than returning an error, unless the code explicitly opted into fallible allocation with `try_reserve` — worth knowing these are two distinct limits that happen to fail in similarly abrupt ways.',
  ],

  gotchas: [
    'Calling a `Box`, `String` or `Vec` "a heap value" imprecisely. The *binding* is a small, fixed-size, stack-resident header; only what it points at is on the heap. Moving one of these by value still copies the stack header — the heap buffer is never touched by a plain move.',
    'Putting a `[u8; 1_000_000]` directly on the stack, unboxed, especially inside any recursive call. It will exhaust an 8MB default Linux stack in a handful of frames — large fixed-size arrays belong behind a `Box` or a `Vec`, exactly as in C++.',
    '`std::mem::size_of::<T>()` measures `T`\'s *own* size — for `String` or `Vec<T>` that is always the fixed header size, never anything about the length of what it currently holds. Expecting `size_of::<String>()` to grow with the string\'s contents is a natural but wrong first guess.',
    'Reading "moved" as "deallocated." Moving a `Box`, `String` or `Vec` copies its 1-to-3-word header to the new location and leaves the heap buffer completely untouched — the same story as ownership moves generally, just applied to a specific set of types.',
    '`str` and `[T]` cannot be bound directly — `let s: str = *"hi";` does not compile, and the error about size not being known at compile time is confusing the first time you hit it if you do not already know why: you always need `&str` or `Box<str>`, something with a statically known size, to hold one.',
  ],

  interview: {
    q: 'Without running anything, what is the exact size in bytes of a `String` value on a 64-bit machine, and why does that number not depend on the string\'s contents?',
    a: [
      'Three machine words: a pointer, a length, and a capacity — 24 bytes on 64-bit. The pointer addresses a heap buffer holding the UTF-8 bytes, `len` is how many of those bytes are currently used, and `cap` is how many the buffer can hold before the next push forces a reallocation.',
      'That number is fixed because `size_of` measures the *header*, not the buffer it points at. The header\'s layout — three words, always — is part of `String`\'s type definition and is known at compile time regardless of what the string holds at runtime; only the separately allocated buffer scales with the actual text, and that buffer is not part of the value `size_of` is measuring.',
      'A detail worth adding unprompted: `&str` is a *fat pointer* — a pointer and a length, 16 bytes, no capacity — because a borrowed string slice never owns a buffer it might need to grow. Volunteering that `&str` and `String` are different sizes, and why, is usually the difference between an answer that sounds recited and one that sounds understood.',
    ],
  },

  exercise: [
    'Print `std::mem::size_of` for `i32`, `[u8; 4]`, `Box<i32>`, `Box<[u8; 1_000_000]>`, `String`, `Vec<i32>`, `&str` and `&[i32]`, and write down what you expect *before* running it. Confirm the two `Box` sizes are identical and that `&str` comes out to 16 bytes, not 24.',
    'Write a function that recurses 100,000 levels deep with a `[u8; 1024]` local array in each frame, and watch it overflow the stack. Then change that local to `Box<[u8; 1024]>` and rerun at the same depth — it no longer crashes for the same reason, though sufficiently unbounded recursion will still eventually fail on running out of stack *frames* themselves, independent of what any one frame allocates on the heap.',
  ],
};
