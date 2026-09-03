import { Region, Cell, Cells, Arrow, Text, Tag } from '../../viz/primitives.js';

/* ------------------------------------------------------------------
   Layout constants. The drawing is to scale: 16 pixels per byte.
   A house is 4 bytes wide (64px) because that is what an `int` needs;
   the pointer's house is 8 bytes wide (128px) because that is what a
   pointer needs on x86-64. Keeping the scale honest is the point.
   ------------------------------------------------------------------ */
const STREET = { x: 28, y: 48, w: 664, h: 112 };
const HOUSE_Y = 90;
const HOUSE_H = 44;
const HOUSE_W = 64;
const houseX = (i) => 44 + i * HOUSE_W;
const P_X = houseX(6); // 428 — the very next address after house 5
const P_W = 128; // 8 bytes at 16px/byte

const ZOOM = { x: 28, y: 214, w: 664, h: 164 };
const BYTE_Y = 260;
const BYTE_H = 38;
const BYTE_PITCH = 39;
const LEFT_BASE = 44;
const RIGHT_BASE = 376;
const byteCx = (base, i) => base + i * BYTE_PITCH + 18;

const streetRegion = () => [
  Region({
    key: 'street',
    x: STREET.x,
    y: STREET.y,
    w: STREET.w,
    h: STREET.h,
    label: 'MEMORY — ONE NUMBERED HOUSE PER BYTE, DRAWN FOUR AT A TIME',
    tone: 'stack',
  }),
];

/* A house on the street. Same key across every step, so a value
   changing inside it reads as "this house changed", not "a new
   house appeared". */
const house = (i, extra = {}) =>
  Cell({
    key: `h${i}`,
    x: houseX(i),
    y: HOUSE_Y,
    w: HOUSE_W,
    h: HOUSE_H,
    value: '??',
    addr: `0x${(0x1000 + i * 4).toString(16)}`,
    ...extra,
  });

const emptyHouses = (skip = []) =>
  [0, 1, 2, 3, 4, 5].filter((i) => !skip.includes(i)).map((i) => house(i));

/* The pointer's own house. It is a house like any other — that is the
   entire lesson — it just happens to hold a number that is an address. */
const pHouse = (extra = {}) =>
  Cell({
    key: 'p',
    x: P_X,
    y: HOUSE_Y,
    w: P_W,
    h: HOUSE_H,
    name: 'p',
    value: '0x1000',
    addr: '0x1018',
    tone: 'borrowed',
    ...extra,
  });

const pArrow = (tone = 'borrowed', label = 'p') =>
  Arrow({
    key: 'parrow',
    from: [P_X + 64, 164],
    to: [houseX(0) + 32, 164],
    shape: 'curve',
    bend: -30,
    tone,
    label,
    thick: true,
  });

const byteStrip = (key, base, tone) =>
  Cells({
    key,
    x: base,
    y: BYTE_Y,
    w: 36,
    h: BYTE_H,
    gap: 3,
    tone,
    values: [
      { value: '07', addr: '..00' },
      { value: '00', addr: '..01' },
      { value: '00', addr: '..02' },
      { value: '00', addr: '..03' },
      { value: '??', addr: '..04' },
      { value: '??', addr: '..05' },
      { value: '??', addr: '..06' },
      { value: '??', addr: '..07' },
    ],
  });

const zoomFrame = () => [
  Region({
    key: 'zoom',
    x: ZOOM.x,
    y: ZOOM.y,
    w: ZOOM.w,
    h: ZOOM.h,
    label: 'THE SAME EIGHT BYTES, TWICE — ONLY THE TYPE DIFFERS',
    tone: 'neutral',
  }),
  Text({
    key: 'lh',
    x: LEFT_BASE,
    y: 236,
    text: 'int* ip = &x;',
    size: 12,
    mono: true,
    tone: 'owned',
    weight: 700,
  }),
  Text({
    key: 'rh',
    x: RIGHT_BASE,
    y: 236,
    text: 'char* cp = (char*)&x;',
    size: 12,
    mono: true,
    tone: 'borrowed',
    weight: 700,
  }),
  ...byteStrip('lb', LEFT_BASE, 'owned'),
  ...byteStrip('rb', RIGHT_BASE, 'borrowed'),
];

export default {
  oneLiner:
    'An address is an ordinary integer; a pointer is that integer plus a type telling the compiler how wide one step is.',

  whyJob:
    'Interviewers use pointers to find out whether you think in bytes or in slogans. "What does `p + 1` add?" and "who deletes this?" are asked constantly, and both have exactly one right answer.',

  mentalModel:
    'Picture a street of numbered houses. `int x = 42` puts 42 inside house 0x1000. A pointer to `x` is *a separate house* that holds the text "0x1000" — a note with an address written on it. The note is real memory with a number of its own, which is why `&p` means something, and why the note can outlive the house it names.',

  scene: {
    id: 'memory-street',
    title: 'A pointer is a house that holds a house number',
    width: 720,
    height: 400,
    legend: [
      { tone: 'owned', label: 'the object' },
      { tone: 'borrowed', label: 'a pointer — non-owning' },
      { tone: 'freed', label: 'dangling — do not follow' },
    ],
    steps: [
      {
        say: 'Memory is one long street. Every byte has a number — its address — and nothing else distinguishes one byte from another. The numbers are consecutive by construction, not by luck.',
        mark: ['3'],
        shapes: () => [...streetRegion(), ...emptyHouses()],
      },
      {
        say: 'Declaring `int x = 42` picks one house and writes 42 into it. You never chose 0x1000; the compiler assigned it while laying out the frame. The address is real, but it is not yours to pick.',
        mark: ['4'],
        shapes: () => [
          ...streetRegion(),
          ...emptyHouses([0]),
          house(0, { value: '42', name: 'x', tone: 'owned' }),
        ],
      },
      {
        say: 'This is the step everything else rests on. `p` is not an arrow the machine knows about — it is a *second house*, eight bytes wide, containing the number 0x1000. Print it and you get a number. Take `&p` and you get 0x1018, because `p` is as much an object as `x` is.',
        mark: ['5', '10-11'],
        shapes: () => [
          ...streetRegion(),
          ...emptyHouses([0]),
          house(0, { value: '42', name: 'x', tone: 'owned' }),
          pHouse(),
          pArrow(),
          Text({
            key: 'note1',
            x: 566,
            y: 100,
            text: 'p is 8 bytes',
            size: 11,
            mono: true,
            opacity: 0.7,
          }),
          Text({
            key: 'note2',
            x: 566,
            y: 116,
            text: 'twice a house',
            size: 11,
            mono: true,
            opacity: 0.7,
          }),
        ],
      },
      {
        say: 'The arrow costs something. `*p = 7` is two trips to memory: load the eight-byte number out of house 0x1018, then use that number as an address and store into whatever it names. Writing `x = 7` directly is one trip. This is why chasing pointers is slower than it looks on the page.',
        mark: ['13-14'],
        focus: ['h0', 'p', 'parrow', 'street', 'deref'],
        shapes: () => [
          ...streetRegion(),
          ...emptyHouses([0]),
          house(0, { value: '7', name: 'x', tone: 'highlight' }),
          pHouse(),
          pArrow('highlight', '*p = 7'),
          Tag({
            key: 'deref',
            x: 566,
            y: 100,
            text: 'two loads',
            tone: 'highlight',
          }),
        ],
      },
      {
        say: 'Now the type. Two pointers, both holding the number 0x1000, both aimed at the identical eight bytes below. Nothing about the bytes says which is which — the difference lives entirely in the compiler.',
        mark: ['16-17'],
        focus: [
          'zoom',
          'lh',
          'rh',
          ...[0, 1, 2, 3, 4, 5, 6, 7].flatMap((i) => [`lb.${i}`, `rb.${i}`]),
        ],
        shapes: () => [
          ...streetRegion(),
          ...emptyHouses([0]),
          house(0, { value: '7', name: 'x', tone: 'owned' }),
          pHouse(),
          ...zoomFrame(),
        ],
      },
      {
        predict: {
          ask: 'Both pointers hold the number 0x1000. What does `ip + 1` evaluate to, and what does `cp + 1` evaluate to?',
          options: [
            { label: 'Both give 0x1001 — addition is addition', correct: false },
            { label: '`ip + 1` is 0x1004, `cp + 1` is 0x1001', correct: true },
            { label: '`ip + 1` is 0x1008, because a pointer is 8 bytes', correct: false },
            { label: 'Neither compiles without a cast', correct: false },
          ],
          because:
            'Pointer arithmetic is scaled by the pointee type. `ip + 1` is `0x1000 + 1 * sizeof(int)`. The `8` in the third option is `sizeof(int*)`, which is the size of the *note*, not of the thing it names — mixing those two up is the most common way this question is failed.',
        },
        say: 'The type is the stride. `p + n` compiles to `p + n * sizeof(*p)`, and the multiply is usually folded into a single addressing mode on x86, so the scaling is free at runtime. `a[i]` is defined as `*(a + i)`, which is why indexing an array is one multiply-and-add and no search.',
        mark: ['18-19'],
        focus: [
          'zoom',
          'lh',
          'rh',
          'iarrow',
          'carrow',
          ...[0, 1, 2, 3, 4, 5, 6, 7].flatMap((i) => [`lb.${i}`, `rb.${i}`]),
        ],
        shapes: () => [
          ...streetRegion(),
          ...emptyHouses([0]),
          house(0, { value: '7', name: 'x', tone: 'owned' }),
          pHouse(),
          ...zoomFrame(),
          Arrow({
            key: 'iarrow',
            from: [byteCx(LEFT_BASE, 0), 338],
            to: [byteCx(LEFT_BASE, 4), 338],
            shape: 'curve',
            bend: 22,
            tone: 'owned',
            label: 'ip + 1  =  0x1004',
            thick: true,
          }),
          Arrow({
            key: 'carrow',
            from: [byteCx(RIGHT_BASE, 0), 338],
            to: [byteCx(RIGHT_BASE, 1), 338],
            shape: 'curve',
            bend: 22,
            tone: 'borrowed',
            label: 'cp + 1  =  0x1001',
            thick: true,
          }),
        ],
      },
      {
        say: 'Two ways for a pointer to be wrong, and only one of them is checkable. `nullptr` is the number 0 — you can test for it. A dangling pointer still holds 0x1000 after that house stopped being yours, and nothing in the number itself has changed. There is no test you can write.',
        mark: ['21-22'],
        focus: ['h0', 'p', 'parrow', 'dang', 'street'],
        shapes: () => [
          ...streetRegion(),
          ...emptyHouses([0]),
          house(0, {
            value: '??',
            name: 'x',
            tone: 'freed',
            dashed: true,
            sub: 'gone',
          }),
          pHouse({ tone: 'freed' }),
          pArrow('freed', 'still 0x1000'),
          Tag({
            key: 'dang',
            x: 566,
            y: 100,
            text: 'dangling',
            tone: 'freed',
          }),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'pointers.cpp',
    source: `#include <cstdio>

int main() {
    int x = 42;
    int* p = &x;

    printf("x  = %d\\n", x);
    printf("&x = %p\\n", (void*)&x);
    printf("p  = %p\\n", (void*)p);
    printf("&p = %p\\n", (void*)&p);
    printf("sizeof(p) = %zu\\n", sizeof(p));

    *p = 7;
    printf("x  = %d\\n", x);

    int*  ip = p;
    char* cp = reinterpret_cast<char*>(p);
    printf("ip + 1 = %p\\n", (void*)(ip + 1));
    printf("cp + 1 = %p\\n", (void*)(cp + 1));

    int* nothing = nullptr;
    if (nothing == nullptr) printf("null is testable\\n");

    return 0;
}`,
    annotations: [
      {
        lines: '10-11',
        text: '`&p` and `sizeof(p)` are the two lines that prove a pointer is an object. If it were a magic link rather than storage, neither would have an answer.',
      },
      {
        lines: '13',
        text: 'The write goes *through* `p`. Nothing about `p` changes here — the eight bytes at `&p` still hold 0x1000 afterwards.',
      },
      {
        lines: '18-19',
        text: 'Run this. The two printed addresses differ by 4 and by 1 respectively, from the same starting number. That difference is the type, made visible.',
      },
      {
        lines: '21-22',
        text: 'A null pointer is the only invalid pointer you can detect. Everything else — dangling, uninitialised, freed — looks exactly like a good one.',
      },
    ],
  },

  deeper: [
    'A pointer on x86-64 is an eight-byte integer held in a general-purpose register when it is hot, and it is loaded, added and compared by the same instructions that handle any other 64-bit integer. There is no pointer unit. `mov rax, [rbx]` is the dereference: take the number in `rbx`, use it as an address, load eight bytes. The `[...]` addressing mode can also do `[rbx + rcx*4 + 8]` in one instruction, which is why `p[i]` on an `int*` costs the same as `*p` — the scale factor of 4 is encoded in the instruction, not computed separately.',
    'Only 48 bits of a 64-bit pointer are actually used for addressing on current hardware (57 with five-level paging). The top bits must be a sign-extension of bit 47, which is what makes a pointer like `0x0000555500001234` normal and `0xdeadbeefdeadbeef` an immediate fault. It is also why "tagged pointer" tricks — stuffing a few flag bits into the unused top or into the low bits guaranteed zero by alignment — appear in real trading and database code.',
    'Typed arithmetic has a hard rule attached: a pointer is only allowed to move within a single array object, plus one position past its end. `&a[16]` on an `int a[16]` is legal to *form* and to compare against, but not to dereference. Stepping outside that range, even without dereferencing, is undefined behaviour, and it is not a theoretical worry — it is why comparing two unrelated pointers with `<` is not portable, and why the optimiser is allowed to assume a loop induction variable never wraps.',
    'The ownership convention matters more than the syntax. In modern C++ a raw pointer means "I am looking at something someone else is responsible for". It does not delete, it does not know the lifetime, and it may be null. Ownership is spelled `std::unique_ptr<T>` (one owner) or `std::shared_ptr<T>` (reference-counted). When you see a raw `T*` in a well-written codebase, you should read it as "borrowed, non-owning, may be null" without having to check — and when you write one, you should mean that.',
    'A reference is a pointer with the syntax hidden and two guarantees added: it must be bound at creation and it cannot be re-seated. That is a real difference in what you can express, but not usually a difference in the generated code — the compiler passes references in registers as addresses, exactly like pointers. The reason to prefer `T&` is that it removes null from the space of possibilities the reader has to consider, not that it is faster.',
  ],

  gotchas: [
    'An uninitialised pointer (`int* p;` with no initialiser) holds whatever bytes were on the stack. It is not null, so a null check passes, and dereferencing it corrupts something at a plausible-looking address. Always write `int* p = nullptr;` if you cannot initialise it properly.',
    '`int* a, b;` declares one pointer and one plain `int`. The `*` binds to the declarator, not the type. This is why the house style in most low-latency codebases is one declaration per line.',
    'Deleting a pointer does not change the pointer. After `delete p;` the variable `p` still holds the same number, and using it is undefined behaviour that frequently appears to work — the allocator has not reused that block yet. Set it to `nullptr` or, better, stop using owning raw pointers.',
    '`void*` throws away the stride. Arithmetic on it is a GCC/Clang extension that treats it as `char*`; it is not standard C++, and code that relies on it will not port.',
    'Casting a `char*` back to an `int*` and dereferencing is undefined unless the alignment and the original type match. On x86 it usually works, which is exactly why it survives code review and then breaks on ARM or under `-fsanitize=alignment`.',
  ],

  interview: {
    q: 'What is the difference between `const char* p`, `char* const p` and `const char* const p`? And what does `p + 1` add in each case?',
    a: [
      'Read the declaration right to left, stopping at the `*`. `const char* p` is "p is a pointer to a char that is const" — you can re-aim `p`, you cannot write through it. `char* const p` is "p is a const pointer to char" — you can write through it, you cannot re-aim it, and it must be initialised at the point of declaration. `const char* const p` is both: neither the pointer nor the pointee can be changed.',
      'The arithmetic answer is the same in all three: `p + 1` adds `sizeof(char)`, which is 1 by definition. `const` is a compile-time access rule attached to the path; it has no representation at runtime and no effect on the stride. The stride comes from the pointee type only. It is worth stating that explicitly, because the question is testing whether you know that `const` and the type-for-arithmetic purposes are separate axes.',
      'The detail that separates a strong answer: `const` on the pointee is a promise about *this path*, not about the object. Another non-const pointer to the same memory may legally write to it, and the compiler must assume that unless it can prove otherwise. That is why marking a parameter `const T*` does not by itself let the optimiser cache a loaded value across an opaque function call — the object might change underneath. `__restrict` is the keyword that makes the stronger, no-aliasing promise, and it is the one that actually changes the generated code.',
    ],
  },

  exercise: [
    'Compile and run the program above with `g++ -O0 -g pointers.cpp -o pointers && ./pointers`. Write down the four printed addresses. Confirm that `&p` is a different number from `p`, and that `ip + 1` and `cp + 1` differ from the base by 4 and by 1. Seeing the actual hex is what turns "a pointer holds an address" into something you believe rather than recite.',
    'Then break it deliberately. Write `int* leak() { int n = 1; return &n; }`, call it, and dereference the result. Build once plainly and note that it often prints 1. Build again with `g++ -fsanitize=address,undefined -g` and read the `stack-use-after-return` report. The gap between those two runs — silently fine versus precisely diagnosed — is the reason sanitizers are non-negotiable in this kind of code.',
    'Finally, paste the program into [Godbolt](https://godbolt.org) at `-O2` and find the instruction that implements `*p = 7`. In an optimised build the compiler will very likely have removed `p` entirely and stored straight into `x`, because it can see the whole story. That disappearance is worth staring at: the pointer is a model, and the machine only materialises it when it has to.',
  ],
};
