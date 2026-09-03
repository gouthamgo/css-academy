import { Region, Cells, Box, Arrow, Text, Tag, Bracket } from '../../viz/primitives.js';

/* One incoming buffer, drawn once at the top, never moved. Everything
   below it either allocates fresh heap blocks (naive) or points back
   into the same seven bytes (zero-copy) -- that contrast is the lesson. */
const BUF_X = 60;
const BUF_Y = 80;
const BUF_BYTES = [
  { value: '42', sub: "'B'" },
  { value: '54', sub: "'T'" },
  { value: '43', sub: "'C'" },
  { value: '64', sub: '0x64' },
  { value: '00', sub: '' },
  { value: '00', sub: '' },
  { value: '00', sub: '' },
];

const buffer = (dim = false) => [
  Text({ key: 'buf.lbl', x: BUF_X, y: BUF_Y - 22, text: 'buf: &[u8]  —  wire message, 7 bytes, received once', size: 12, mono: true, weight: 650, opacity: dim ? 0.5 : 1 }),
  ...Cells({ key: 'buf', x: BUF_X, y: BUF_Y, values: BUF_BYTES, w: 58, h: 42, tone: dim ? 'neutral' : 'stack', addrStart: 0x2000, addrStep: 1 }),
  Bracket({ key: 'sym.b', x: BUF_X, y: BUF_Y + 60, w: 174, label: 'symbol: 3 bytes', tone: 'neutral' }),
  Bracket({ key: 'price.b', x: BUF_X + 174, y: BUF_Y + 60, w: 232, label: 'price_cents: u32 LE', tone: 'neutral' }),
];

const counter = (n, tone) =>
  Box({ key: 'ctr', x: 560, y: 40, w: 120, h: 44, label: `allocations: ${n}`, tone, mono: true, labelSize: 12 });

export default {
  oneLiner:
    'Turning bytes off the wire into typed fields by pointing into the buffer instead of copying out of it — and the lifetime that discipline forces on you.',

  whyJob:
    'A market-data feed handler parses millions of messages a second; an allocation per field is the difference between a design that keeps up and one that falls behind the wire under load. Interviewers ask this to see if you know `&[u8]` and slicing, not just that "Rust is fast".',

  mentalModel:
    'A naive parser reads a letter off a postcard and *copies it onto a fresh index card* for every field, then hands you a stack of cards. A zero-copy parser hands you the *original postcard back with sticky tabs* pointing at each field — nothing is transcribed, but you cannot burn the postcard while the tabs are still stuck to it. That last part is not a metaphor: it is a borrow, and the lifetime is the promise that the postcard outlives every tab.',

  scene: {
    id: 'zero-copy-parse',
    title: 'Parsing bytes without copying them',
    width: 720,
    height: 420,
    legend: [
      { tone: 'stack', label: 'original buffer' },
      { tone: 'freed', label: 'fresh heap allocation' },
      { tone: 'owned', label: 'slice into the buffer' },
    ],
    steps: [
      {
        say: 'One message, seven bytes, already in memory because something read it off a socket. Three bytes of ticker symbol, four bytes of price as a little-endian `u32`. Both parsers below start from exactly this.',
        mark: [],
        shapes: () => [...buffer(), counter(0, 'neutral')],
      },
      {
        say: 'The naive parser reads the symbol bytes and calls `String::from_utf8`, which owns its bytes — so it allocates a fresh buffer and copies the three bytes into it.',
        mark: ['20'],
        focus: ['buf.0', 'buf.1', 'buf.2', 'sym.b', 'alloc1', 'a1', 'ctr'],
        shapes: () => [
          ...buffer(),
          Box({ key: 'alloc1', x: 300, y: 220, w: 150, h: 56, label: 'String', sub: '"BTC" (new heap block)', tone: 'freed' }),
          Arrow({ key: 'a1', from: [BUF_X + 87, BUF_Y + 42], to: [375, 220], tone: 'freed', bend: 30 }),
          counter(1, 'freed'),
        ],
      },
      {
        say: 'It reads the four price bytes the same way — `.to_vec()` owns its bytes too, so a second fresh block appears just to hold a temporary copy of four bytes it is about to consume and discard.',
        mark: ['21'],
        focus: ['buf.3', 'buf.4', 'buf.5', 'buf.6', 'price.b', 'alloc1', 'alloc2', 'a1', 'a2', 'ctr'],
        shapes: () => [
          ...buffer(),
          Box({ key: 'alloc1', x: 300, y: 220, w: 150, h: 56, label: 'String', sub: '"BTC" (new heap block)', tone: 'freed' }),
          Arrow({ key: 'a1', from: [BUF_X + 87, BUF_Y + 42], to: [375, 220], tone: 'freed', bend: 30 }),
          Box({ key: 'alloc2', x: 470, y: 220, w: 150, h: 56, label: 'Vec<u8>', sub: '[0x64,0,0,0] (new)', tone: 'freed' }),
          Arrow({ key: 'a2', from: [BUF_X + 348, BUF_Y + 42], to: [545, 220], tone: 'freed', bend: -30 }),
          counter(2, 'freed'),
        ],
      },
      {
        say: 'Two allocations, two frees, and two `memcpy`s — to produce a struct that is thrown away a few lines later. At a million messages a second that is two million round trips through the allocator for data that was already sitting in memory in the right shape.',
        mark: ['18-23'],
        shapes: () => [
          ...buffer(true),
          Box({ key: 'alloc1', x: 300, y: 220, w: 150, h: 56, label: 'String', sub: 'freed almost at once', tone: 'freed' }),
          Box({ key: 'alloc2', x: 470, y: 220, w: 150, h: 56, label: 'Vec<u8>', sub: 'freed almost at once', tone: 'freed' }),
          counter(2, 'freed'),
          Tag({ key: 'cost', x: 300, y: 300, text: '2 allocator round trips per message', tone: 'freed' }),
        ],
      },
      {
        say: 'The zero-copy version reads the same bytes, but `str::from_utf8(&buf[0..3])` *borrows* — it checks the bytes are valid UTF-8 and hands back a `&str` that points at addresses `0x2000..0x2003`, still inside `buf`. No new memory anywhere.',
        mark: ['11'],
        focus: ['buf.0', 'buf.1', 'buf.2', 'sym.b', 'slice1', 'a3', 'ctr'],
        shapes: () => [
          ...buffer(),
          Box({ key: 'slice1', x: 300, y: 220, w: 150, h: 56, label: '&str', sub: 'points at 0x2000..0x2003', tone: 'owned' }),
          Arrow({ key: 'a3', from: [BUF_X + 87, BUF_Y + 42], to: [375, 220], tone: 'owned', bend: 30, dashed: true }),
          counter(0, 'owned'),
        ],
      },
      {
        say: 'The price field is read with `u32::from_le_bytes(buf[3..7].try_into().unwrap())`. That copies four bytes into a plain `u32` sitting in a CPU register — a value copy, not a heap allocation, because a `u32` was never going to be a pointer to anything.',
        mark: ['12-14'],
        focus: ['buf.3', 'buf.4', 'buf.5', 'buf.6', 'price.b', 'slice1', 'reg', 'a4', 'ctr'],
        shapes: () => [
          ...buffer(),
          Box({ key: 'slice1', x: 300, y: 220, w: 150, h: 56, label: '&str', sub: 'points at 0x2000..0x2003', tone: 'owned' }),
          Box({ key: 'reg', x: 470, y: 220, w: 150, h: 56, label: 'u32', sub: '100 (register, not heap)', tone: 'owned' }),
          Arrow({ key: 'a4', from: [BUF_X + 348, BUF_Y + 42], to: [545, 220], tone: 'owned', bend: -30 }),
          counter(0, 'owned'),
        ],
      },
      {
        say: 'The returned `Quote<\'a>` is two machine words: a fat pointer for the `&str` and a `u32`. The heap allocator was never called. This is the entire technique — every field is either a slice back into `buf`, or a value small enough to copy for free.',
        mark: ['5-8'],
        shapes: () => [
          ...buffer(),
          Box({ key: 'slice1', x: 300, y: 220, w: 150, h: 56, label: '&str', sub: 'symbol', tone: 'owned' }),
          Box({ key: 'reg', x: 470, y: 220, w: 150, h: 56, label: 'u32', sub: 'price_cents', tone: 'owned' }),
          Tag({ key: 'result', x: 300, y: 300, text: 'Quote { symbol, price_cents } — zero allocations', tone: 'owned' }),
          counter(0, 'owned'),
        ],
      },
      {
        say: 'This is why `Quote` in the code is `Quote<\'a>`, not `Quote`. Its `symbol` field is only valid for as long as `buf` is — the compiler ties the struct\'s lifetime to the slice\'s, so returning a `Quote` after `buf` is dropped is a compile error, not a dangling pointer discovered in production.',
        mark: ['5-6'],
        predict: {
          ask: 'A `#[repr(C, packed)]` struct puts `price_cents: u32` at a byte offset that is not a multiple of 4. What happens if you write `let p = &packed.price_cents;`?',
          options: [
            { label: 'It compiles and works; Rust reads unaligned fields transparently', correct: false },
            { label: 'It fails to compile: taking a reference to an unaligned field is denied by default', correct: true },
            { label: 'It compiles, but only panics if the field is ever dereferenced', correct: false },
          ],
          because:
            'A `&u32` promises the pointer is 4-byte aligned; the language is allowed to assume that and generate an aligned load. A field of a packed struct may sit at any offset, so handing out that reference could produce a pointer the hardware faults on and is UB regardless. The compiler now refuses it outright — the safe fix is `buf[3..7].try_into()` as shown here, or `std::ptr::read_unaligned` when you truly must read through the packed layout.',
        },
        shapes: () => [
          ...buffer(),
          Box({ key: 'slice1', x: 300, y: 220, w: 150, h: 56, label: '&str', sub: "symbol: &'a str", tone: 'owned' }),
          Box({ key: 'reg', x: 470, y: 220, w: 150, h: 56, label: 'u32', sub: 'price_cents', tone: 'owned' }),
          Bracket({ key: 'life', x: BUF_X, y: BUF_Y - 40, w: 490, label: "'a — buf must outlive Quote<'a>", tone: 'highlight' }),
        ],
      },
    ],
  },

  code: {
    lang: 'rust',
    filename: 'main.rs',
    source: `use std::str;

/// Borrows straight from the wire buffer -- no allocation, no copy of
/// anything bigger than a u32. Cannot outlive the buffer it borrows.
struct Quote<'a> {
    symbol: &'a str,
    price_cents: u32,
}

fn parse(buf: &[u8]) -> Quote<'_> {
    let symbol = str::from_utf8(&buf[0..3]).unwrap();     // borrow, not copy
    let price_cents = u32::from_le_bytes(
        buf[3..7].try_into().unwrap(),                     // 4 bytes -> register
    );
    Quote { symbol, price_cents }                           // zero allocations
}

/// Same message, parsed the way most people write it first.
fn parse_naive(buf: &[u8]) -> (String, u32) {
    let symbol = String::from_utf8(buf[0..3].to_vec()).unwrap(); // heap alloc #1
    let rest: Vec<u8> = buf[3..7].to_vec();                       // heap alloc #2
    let price_cents = u32::from_le_bytes(rest.try_into().unwrap());
    (symbol, price_cents)
}

fn main() {
    let buf = [b'B', b'T', b'C', 0x64, 0x00, 0x00, 0x00]; // "BTC", 100 cents

    let q = parse(&buf);
    println!("{} @ {}", q.symbol, q.price_cents);

    let (s, p) = parse_naive(&buf);
    println!("{s} @ {p}");
}`,
    annotations: [
      {
        lines: '4-7',
        text: 'The `<\'a>` is not decoration. It is the compiler\'s proof that `symbol` cannot be read after the bytes it points at are gone.',
      },
      {
        lines: '11',
        text: '`from_utf8` validates in place and returns a `&str` aimed at the same bytes — the check costs a scan, not an allocation.',
      },
      {
        lines: '12-14',
        text: '`try_into()` on a slice copies exactly 4 bytes into a `[u8; 4]` on the stack. Safe on any alignment, unlike casting the buffer to a `*const u32` directly.',
      },
      {
        lines: '20-21',
        text: '`.to_vec()` and `String::from_utf8` both take ownership of their bytes, which means allocate-and-copy. Nothing here is wrong Rust — it is just not zero-copy Rust.',
      },
    ],
  },

  deeper: [
    'A `&[u8]` slice is a fat pointer: a data pointer plus a length, sixteen bytes on a 64-bit target, carrying no ownership of what it points at. Slicing `buf[0..3]` does not touch the heap at all — it computes a new pointer (`buf.as_ptr()`, unchanged) and a new length (3), both arithmetic on values already in registers. Every zero-copy technique in this lesson is a variation on handing out more of these instead of allocating.',
    '`bytes::Bytes`, from the `bytes` crate, generalises the same idea to *owned but shared* data. It wraps a reference-counted heap buffer, and calling `.slice(3..7)` on a `Bytes` does not copy — it returns a new `Bytes` sharing the same allocation with an adjusted offset and length, bumping the count exactly like `Rc`. It exists because a `&[u8]` cannot outlive its buffer, and network code frequently needs to hold onto a fragment of a message after the function that received it has returned; `Bytes` buys that at the cost of one atomic increment per clone, the same trade `Arc` makes.',
    '`#[repr(Rust)]`, the default, gives the compiler permission to reorder fields, insert padding, and even change layout between compiler versions — exactly what you want for an in-memory struct, and exactly what you cannot use for a wire format, because the sender and receiver would silently disagree about which bytes mean what. `#[repr(C)]` fixes field order and padding to match a C compiler\'s rules, which is enough for a struct you intend to memory-map if every field is already aligned. `#[repr(C, packed)]` additionally removes all padding, matching a byte-exact wire layout — but every field then sits at whatever offset the previous fields\' sizes add up to, aligned or not, which is what makes touching those fields directly hazardous.',
    'The alignment hazard is not pedantry. x86 tolerates most unaligned loads with a small performance penalty; ARM and other architectures can fault outright on an unaligned access to certain instructions, and the Rust reference specifies that producing a `&T` to underaligned data is undefined behaviour regardless of what any particular CPU tolerates today, because the compiler is free to *assume* alignment when optimising, including in ways that only misbehave on some future codegen. The safe pattern is to never form a reference into packed data: read the field with `std::ptr::read_unaligned`, or — the pattern this lesson uses — treat the whole message as `&[u8]` and reconstruct multi-byte fields with `from_le_bytes`/`from_be_bytes` on a byte-array copy, which cannot be unaligned because it is not a reference at all.',
    '`Cow<\'a, T>` (clone-on-write) covers the case in between: a format that is *usually* valid to borrow but occasionally needs escaping, decompressing, or fixing up, and you do not want to pay for an owned copy on the common path. A parser returns `Cow::Borrowed(&input[..])` when the field can be used as-is, and only calls `.to_owned()` — producing `Cow::Owned` — on the rare input that needs it, such as a string containing an escape sequence. Callers write ordinary code against the `Cow` (`Deref`s to `&T`) without needing to know which case they got, and the allocation only happens on the path that actually needs one.',
  ],

  gotchas: [
    'Slicing a `&[u8]` with a range that runs past the end panics with an index-out-of-bounds message rather than returning a parse error — wire data is adversarial input, so use `buf.get(0..3)` (returns `Option<&[u8]>`) instead of `buf[0..3]` at every boundary a remote peer controls.',
    'A struct holding a borrowed field forces every containing type to grow a lifetime parameter, and that parameter propagates outward through every function signature that touches it. This is the real reason people reach for `String`/`Vec` instead of borrowing — not laziness, but that a borrowed design threads a lifetime through the whole call chain, and that is a real API cost to weigh against the allocation cost it avoids.',
    '`from_utf8` on a slice that happens to contain valid UTF-8 by accident will succeed even when the wire format was never meant to be text — validate the *protocol\'s* rules (fixed-width ASCII symbol, say) rather than relying on UTF-8 validity as your correctness check.',
    'Reading a multi-byte field with a pointer cast (`*(buf.as_ptr() as *const u32)`) instead of `from_le_bytes` compiles, often runs fine on x86 in testing, and is UB the language reference does not qualify by CPU — the failure mode is a target you have not tested on yet, or a future compiler version that optimises differently.',
  ],

  interview: {
    q: 'Design a parser for a fixed binary message format that needs to keep up with a multi-million-message-per-second feed. What does "zero-copy" actually mean here, and where does it stop applying?',
    a: [
      'It means the parsed struct holds slices and small `Copy` fields that point into or are copied cheaply out of the original receive buffer, instead of allocating a `String` or `Vec` per field. `&[u8]` slicing is pointer-plus-length arithmetic, and multi-byte numeric fields are read with `from_le_bytes`/`from_be_bytes` on a fixed-size array, which is a stack-to-stack copy, not a heap allocation. The parsed value ends up with a lifetime tied to the buffer — `Quote<\'a>` — and the compiler enforces that it cannot outlive the bytes it borrows.',
      'It stops applying the moment you need to keep the parsed data around after the buffer it came from is reused or freed, which is normal for a ring buffer of receive slots. At that point either the buffer\'s lifetime has to extend to match (holding the whole slot alive longer than you would like), or you pay for an owned copy somewhere — a `String`, or a `bytes::Bytes` if you want the copy to be shared and reference-counted rather than duplicated per consumer.',
      'The answer that shows real experience: zero-copy is a lifetime-management problem wearing a performance costume. The interesting engineering is not the slicing, which is mechanical — it is deciding where in the pipeline ownership has to become real, and reaching for `Bytes` or an arena rather than reflexively allocating a fresh `String` the first time a borrow becomes inconvenient to thread through the types.',
    ],
  },

  exercise: [
    'Take the `parse` and `parse_naive` functions above, wrap each in a loop of one million iterations over the same seven-byte buffer, and time both with `std::time::Instant` (or better, `criterion` — see the next lesson). Confirm the naive version is dominated by allocator time, then run both under `valgrind --tool=massif` or `heaptrack` and confirm the zero-copy version shows zero heap activity in the loop.',
    'Change `Quote` to hold a `String` instead of `&str` for the symbol, delete the lifetime parameter, and try to return a `Quote` built from a temporary local `Vec<u8>` buffer that is dropped at the end of the function. Watch it compile — then put the lifetime back, keep the borrowed `&str`, and try the same thing. Read the borrow-checker error closely: it names the exact line the temporary buffer goes out of scope, which is the compiler doing, at compile time, the bug-hunting a segfault would otherwise leave to you at 3am.',
  ],
};
