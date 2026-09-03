import { Box, Bracket, Text, Tag } from '../../viz/primitives.js';

/* ------------------------------------------------------------------
   Geometry. The whole scene is one horizontal byte strip, 24 bytes
   wide, so every step can address a byte by its offset alone.
   ------------------------------------------------------------------ */
const BYTE = 27;
const STRIP_X = 48;
const STRIP_Y = 152;
const STRIP_H = 44;
const TOTAL = 24;

/** x coordinate of byte `i` in the strip. */
const BX = (i) => STRIP_X + i * BYTE;

/* The ruler: tick marks at multiples of 8, the alignment of the
   strictest member. Fields visibly start on a tick or they do not. */
const ruler = () => [
  Text({
    key: 'r.cap',
    x: STRIP_X,
    y: 84,
    text: 'byte offset — ticks are multiples of 8, the alignment of the widest member',
    size: 10.5,
    opacity: 0.55,
  }),
  ...[0, 8, 16, 24].map((n) =>
    Text({
      key: `r.n${n}`,
      x: BX(n),
      y: 108,
      text: String(n),
      size: 10,
      anchor: 'middle',
      mono: true,
      opacity: 0.6,
    })
  ),
  ...[0, 8, 16, 24].map((n) =>
    Box({ key: `r.t${n}`, x: BX(n) - 0.75, y: 118, w: 1.5, h: 14, tone: 'highlight' })
  ),
  Box({ key: 'r.line', x: BX(0), y: 134, w: TOTAL * BYTE, h: 1.5, tone: 'neutral' }),
];

/** One declared member, drawn as a coloured span over the bytes it occupies. */
const field = (name, off, size, tone = 'owned') =>
  Box({
    key: `f.${name}`,
    x: BX(off),
    y: STRIP_Y,
    w: size * BYTE,
    h: STRIP_H,
    label: name,
    sub: `${size} B`,
    tone,
    mono: true,
    labelSize: size === 1 ? 8.5 : 11,
  });

/** One byte of padding. Keyed by offset, so pads that vanish, vanish. */
const pad = (off) =>
  Box({
    key: `pad.${off}`,
    x: BX(off),
    y: STRIP_Y,
    w: BYTE,
    h: STRIP_H,
    label: 'pad',
    tone: 'freed',
    dashed: true,
    mono: true,
    labelSize: 8.5,
  });

/** The tail of the strip nothing has claimed yet. Shrinks as fields land. */
const unplaced = (from) =>
  Box({
    key: 'unplaced',
    x: BX(from),
    y: STRIP_Y,
    w: (TOTAL - from) * BYTE,
    h: STRIP_H,
    label: from <= 20 ? 'not yet placed' : '',
    tone: 'neutral',
    dashed: true,
    mono: true,
    labelSize: 10,
  });

const sizeBar = (used, label) =>
  Bracket({ key: 'size', x: BX(0), y: 208, w: used * BYTE, label, tone: 'stack' });

const wasted = (n) =>
  Tag({ key: 'wasted', x: STRIP_X, y: 246, text: `wasted: ${n} bytes`, tone: 'freed' });

const note = (text) => Text({ key: 'note', x: 182, y: 256, text, size: 11, opacity: 0.6 });

export default {
  oneLiner:
    'Why a struct is bigger than the sum of its members, and how reordering three lines gets the bytes back.',

  whyJob:
    'Trading firms put a struct on the whiteboard and ask what `sizeof` reports, then ask you to shrink it without dropping a field. The follow-up — why the compiler will not reorder the members for you — is where most candidates run out of answer.',

  mentalModel:
    'Think of memory as numbered parking bays. A one-byte `char` is a scooter and fits in any bay. An eight-byte `double` is a lorry that may *only* start in a bay whose number is a multiple of eight. If the lorry arrives when the next free bay is 1, bays 1 to 7 stay empty forever — not used, not usable, but *paid for* in every copy, every cache line and every array element.',

  scene: {
    id: 'struct-padding',
    title: 'Laying out one struct, byte by byte',
    width: 720,
    height: 430,
    legend: [
      { tone: 'owned', label: 'field data' },
      { tone: 'freed', label: 'padding — paid for, unusable' },
      { tone: 'highlight', label: 'just placed' },
    ],
    steps: [
      {
        say: 'Memory is a numbered line of bytes, and the hardware cares which number a value starts on. Members are placed in the order you wrote them, left to right, each one pushed forward until it reaches an offset it is allowed to begin at.',
        mark: ['4-9'],
        shapes: () => [...ruler(), unplaced(0)],
      },
      {
        say: '`side` is a `char`. Its alignment is 1, which means every offset is legal for it, so it takes byte 0 and nothing is skipped.',
        mark: ['5'],
        shapes: () => [...ruler(), field('side', 0, 1, 'highlight'), unplaced(1)],
      },
      {
        say: 'Seven bytes are burned to get `price` onto a tick. Nothing is ever stored in them — they exist only because the field after them refused to begin anywhere else.',
        mark: ['6'],
        predict: {
          ask: '`side` ends at byte 0. `price` is a `double`. Which byte does it start on?',
          options: [
            { label: 'Byte 1 — members are packed end to end', correct: false },
            { label: 'Byte 4 — the compiler rounds up to the nearest 4', correct: false },
            { label: 'Byte 8 — the next multiple of its own alignment', correct: true },
          ],
          because:
            'A `double` has an alignment of 8, so it may only begin at an offset that is a multiple of 8. Byte 1 is not one, so the compiler walks forward to byte 8. Everything skipped on the way becomes padding.',
        },
        shapes: () => [
          ...ruler(),
          field('side', 0, 1),
          ...[1, 2, 3, 4, 5, 6, 7].map(pad),
          field('price', 8, 8, 'highlight'),
          unplaced(16),
          sizeBar(16, 'bytes used: 16'),
          wasted(7),
          note('seven bytes in the middle of your object, structurally unusable'),
        ],
      },
      {
        say: '`qty` is an `int`, alignment 4, and byte 16 is already a multiple of 4 — it slots straight in with no gap. `flag` is another `char`, so it lands on byte 20. Twenty-one bytes now hold real data.',
        mark: ['7-8'],
        shapes: () => [
          ...ruler(),
          field('side', 0, 1),
          ...[1, 2, 3, 4, 5, 6, 7].map(pad),
          field('price', 8, 8),
          field('qty', 16, 4, 'highlight'),
          field('flag', 20, 1, 'highlight'),
          unplaced(21),
          sizeBar(21, 'bytes used: 21'),
          wasted(7),
          note('order of declaration is order of layout — the compiler may not shuffle it'),
        ],
      },
      {
        say: 'Three more bytes of padding appear after the last member, and no member will ever touch them. They are there so that the *next* `Order` in an array still begins on a tick.',
        mark: ['9'],
        predict: {
          ask: '`flag` occupies byte 20, so the last useful byte is 20. What does `sizeof(Order)` report?',
          options: [
            { label: '21 — the last used byte, plus one', correct: false },
            { label: '24 — rounded up to a multiple of the struct’s alignment', correct: true },
            { label: '32 — rounded up to the next power of two', correct: false },
          ],
          because:
            '`sizeof` is always a multiple of the type’s alignment, which here is 8 because of the `double`. That is what makes `Order arr[2]` work at all: `arr[1]` starts at byte 24, still a multiple of 8, so its `double` is still aligned. Tail padding exists to keep arrays honest, which is also why `sizeof` is exactly the stride between elements.',
        },
        shapes: () => [
          ...ruler(),
          field('side', 0, 1),
          ...[1, 2, 3, 4, 5, 6, 7].map(pad),
          field('price', 8, 8),
          field('qty', 16, 4),
          field('flag', 20, 1),
          ...[21, 22, 23].map(pad),
          sizeBar(24, 'sizeof(Order) = 24'),
          wasted(10),
          note('10 of 24 bytes carry nothing at all'),
        ],
      },
      {
        say: 'Same four members, same four types, declared widest-alignment first. Every field now lands on a legal offset with nothing skipped, and the only padding left is the two bytes that round 14 up to 16. No data was removed — the holes were.',
        mark: ['11-16'],
        shapes: () => [
          ...ruler(),
          field('price', 0, 8, 'highlight'),
          field('qty', 8, 4),
          field('side', 12, 1),
          field('flag', 13, 1),
          pad(14),
          pad(15),
          sizeBar(16, 'sizeof(Order) = 16'),
          wasted(2),
          note('a third smaller, with the same fields and the same code'),
        ],
      },
      {
        say: 'A cache line is 64 bytes, and it is the unit the CPU actually fetches from memory. Four of the 16-byte layout land inside one line; the 24-byte version fits two and leaves the third straddling the boundary, so touching it costs two fetches instead of one. Over a million-element array that is 8 MB of bandwidth you never have to spend — and when you want the opposite, `alignas(64)` gives an object a line to itself.',
        mark: ['18-20'],
        focus: ['cl', 'a0', 'a1', 'a2', 'a3', 'b0', 'b1', 'b2', 'cmp.a'],
        shapes: () => [
          ...ruler(),
          field('price', 0, 8),
          field('qty', 8, 4),
          field('side', 12, 1),
          field('flag', 13, 1),
          pad(14),
          pad(15),
          sizeBar(16, 'sizeof(Order) = 16'),
          wasted(2),
          Bracket({
            key: 'cl',
            x: 110,
            y: 306,
            w: 480,
            side: 'top',
            label: 'one 64-byte cache line',
            tone: 'hit',
          }),
          ...[0, 1, 2, 3].map((i) =>
            Box({
              key: `a${i}`,
              x: 110 + i * 120,
              y: 316,
              w: 120,
              h: 34,
              label: 'Order',
              sub: '16 B',
              tone: 'owned',
              mono: true,
              labelSize: 10,
            })
          ),
          ...[0, 1, 2].map((i) =>
            Box({
              key: `b${i}`,
              x: 110 + i * 180,
              y: 362,
              w: 180,
              h: 34,
              label: 'Order',
              sub: i === 2 ? 'split across lines' : '24 B',
              tone: i === 2 ? 'miss' : 'moved',
              mono: true,
              labelSize: 10,
            })
          ),
          Text({
            key: 'cmp.a',
            x: 600,
            y: 333,
            text: 'exactly 4',
            size: 10.5,
            mono: true,
            tone: 'owned',
          }),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'layout.cpp',
    source: `#include <cstdio>
#include <cstddef>

struct Order {          // 24 bytes
    char   side;        // offset 0
    double price;       // offset 8 — 7 bytes of padding sit before it
    int    qty;         // offset 16
    char   flag;        // offset 20
};                      // 3 bytes of tail padding after flag

struct OrderPacked {    // 16 bytes — identical members, better order
    double price;       // offset 0
    int    qty;         // offset 8
    char   side;        // offset 12
    char   flag;        // offset 13
};                      // 2 bytes of tail padding

struct alignas(64) Slot {   // forced onto a cache line of its own
    OrderPacked o;
};

int main() {
    printf("Order       %zu (align %zu)\\n", sizeof(Order), alignof(Order));
    printf("OrderPacked %zu (align %zu)\\n", sizeof(OrderPacked), alignof(OrderPacked));
    printf("Slot        %zu (align %zu)\\n", sizeof(Slot), alignof(Slot));
    printf("price at    %zu\\n", offsetof(Order, price));
    printf("flag  at    %zu\\n", offsetof(Order, flag));
    return 0;
}`,
    annotations: [
      {
        lines: '6',
        text: 'One `double` in the wrong place sets the alignment of the whole struct to 8, which is what creates both the hole in front of it and the tail padding at the end.',
      },
      {
        lines: '9',
        text: 'Tail padding is not waste the compiler forgot to clean up. It is the guarantee that `&arr[1] - &arr[0] == sizeof(Order)` and that `arr[1].price` is still aligned.',
      },
      {
        lines: '11-16',
        text: 'The only change is declaration order. Sorting members by descending alignment is close to optimal and costs nothing at runtime.',
      },
      {
        lines: '18',
        text: '`alignas` deliberately *adds* padding. You reach for it when two threads must not share a line — see the false sharing lesson.',
      },
    ],
  },

  deeper: [
    'Alignment comes from the hardware, not from taste. A load is issued against a cache line, and a value that straddles two lines needs two accesses that the core then has to stitch together. On x86-64 an unaligned scalar load is legal and usually cheap, but a line-splitting one is not, and a `lock`-prefixed read-modify-write that crosses a line boundary is catastrophically slow. On some ARM configurations and for most SIMD loads it is not legal at all — it faults. The C++ rule is the conservative version of that hardware reality: every object of type `T` lives at an address that is a multiple of `alignof(T)`.',
    'Two rules generate every number in the diagram above. The alignment of a struct is the largest alignment among its members. Its size is rounded up to a multiple of that alignment. The first rule is why `price` cannot start at byte 1; the second is why `sizeof(Order)` is 24 and not 21. Both exist so that `T*` arithmetic works: if `sizeof` were not a multiple of `alignof`, `arr[1]` would be misaligned and the whole pointer model would break.',
    'C++ does not let the compiler reorder your members. Within one access-control section, members must be laid out in declaration order — the standard guarantees increasing addresses. A compiler is technically free to reorder *across* `public:`/`private:` boundaries, but no mainstream one does, because doing so would break every existing ABI. That is the difference from Rust, where the default `repr(Rust)` layout is unspecified and rustc silently sorts fields for you. In C++ the sorting is your job, which is exactly why it is an interview question.',
    'The payoff is a bandwidth payoff, not an instruction-count payoff. Shrinking `Order` from 24 to 16 bytes does not make any individual field access faster. It means a 64-byte line brings in four orders instead of two and a bit, so a scan over a million of them touches 16 MB instead of 24 MB of DRAM. When a loop is memory-bound — and a hot loop over an array of structs almost always is — that ratio is the runtime. Measure it with `perf stat -e cache-misses,LLC-load-misses` rather than assuming it.',
    'The padding bytes themselves hold indeterminate values. Nothing initialises them: not `= {}`, not the constructor, not `memset` unless you call it yourself. That makes three common operations wrong. `memcmp(&a, &b, sizeof a)` can report a difference between two structs whose every member is equal. Hashing a struct by its raw bytes gives unstable results. And writing a struct straight to a socket or a file both leaks whatever was on the stack in those bytes and produces a format that changes when someone adds a member or you switch compilers. Wire formats get an explicit serialise function, field by field.',
  ],

  gotchas: [
    'Adding one `bool` to a struct can grow it by 8 bytes or by 0, depending entirely on whether a padding hole happened to be sitting there. The symptom is a commit that adds a single flag and doubles your cache misses.',
    '`memcmp` on two structs is not a value comparison, because padding bytes are indeterminate. Write `operator==` member by member and let the compiler default it (`= default`) where it can.',
    'Serialising a struct with `write(fd, &s, sizeof s)` writes your uninitialised padding onto the wire. It is an information leak, it is not portable across compilers or architectures, and it silently breaks the moment anyone reorders a field.',
    '`#pragma pack(1)` and `__attribute__((packed))` remove padding by making members unaligned. Taking a pointer or reference to a packed member is then undefined behaviour, the compiler falls back to byte-wise loads, and vectorisation stops. Use it only for genuinely external formats, and copy fields out before touching them.',
    'An empty struct has `sizeof == 1`, not 0, because two distinct objects must have distinct addresses. As a *base class* it can occupy zero bytes — that is the empty base optimisation, and it is how `unique_ptr` stays one pointer wide.',
  ],

  interview: {
    q: 'Here is a struct used for every message in a market data feed:\n\n`struct Tick { char venue; double price; int size; char side; bool cancelled; };`\n\nWhat is `sizeof(Tick)`, why, and what would you change?',
    a: [
      'Walk it byte by byte out loud, because that is what is being tested. `venue` takes byte 0. `price` is a `double`, alignment 8, so it is pushed to byte 8 and bytes 1 to 7 become padding. `size` is an `int` and byte 16 is already a multiple of 4, so it takes 16 to 19. `side` takes 20, `cancelled` takes 21. The struct’s alignment is 8, so the size is rounded up from 22 to 24. That is 24 bytes carrying 15 bytes of data.',
      'The fix is to declare the members in descending order of alignment: `double price; int size; char venue; char side; bool cancelled;`. That gives `price` at 0, `size` at 8, the three single-byte members at 12, 13 and 14, and one byte of tail padding — 16 bytes total. No field was dropped and no code changes. The detail that separates a memorised answer here is knowing *why* you have to do this by hand: C++ guarantees declaration order, so the compiler is not allowed to sort the fields the way Rust does.',
      'Then say what you would measure, because "it is smaller" is not the same as "it is faster". A 64-byte cache line now holds four ticks instead of two, so a sequential scan over a day of ticks touches a third less memory. I would confirm it with `pahole` on the debug binary to see the holes disappear, and with `perf stat -e cache-misses` on the real scan loop before and after. If the loop turns out to be compute-bound rather than memory-bound, the win will not show up, and that is worth knowing before you spend a review cycle on it.',
    ],
  },

  exercise: [
    'Build the file above with `g++ -g -O2 layout.cpp -o layout` and run it, so the sizes stop being a claim and become numbers on your screen. Then run `pahole ./layout` (from the `dwarves` package). It prints every struct in the binary with the exact holes marked, in bytes, along with a summary line telling you how much you would save. This is the tool people actually use to do this work; ten minutes with it on a real codebase is worth more than reading another explanation.',
    'Now add `bool cancelled;` to `OrderPacked` and check `sizeof` again — it stays 16, because the byte slid into existing tail padding and cost nothing. Add a second `double` instead and watch it jump to 24. Finally, compile with `clang++ -Wpadded` and read the warnings: clang names every hole and its size at the point it is introduced, which is the fastest way to audit a header you did not write.',
  ],
};
