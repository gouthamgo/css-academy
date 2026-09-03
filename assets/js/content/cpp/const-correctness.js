import { Box, Frame, Arrow, Text, Tag } from '../../viz/primitives.js';

/* ------------------------------------------------------------------
   One object in the middle; three named paths on the left, each with
   its own arrow. Nothing about the object changes when a path is
   const — the padlock always sits on the arrow, never on the box.
   That placement is the entire lesson, so it is a layout constant.
   ------------------------------------------------------------------ */
const OBJ = { x: 286, y: 170, w: 190 };
const OTHER = { x: 286, y: 310, w: 190 };
const ROW_0_Y = OBJ.y + 44; // 214 — the `threshold` row
const ROW_1_Y = OBJ.y + 70; // 240 — the `reads` row

const PATH = { x: 36, w: 170, h: 48 };
const P1_Y = 84;
const P2_Y = 176;
const P3_Y = 268;

const path = (key, y, label, sub, tone) =>
  Box({
    key,
    x: PATH.x,
    y,
    w: PATH.w,
    h: PATH.h,
    label,
    sub,
    tone,
    labelSize: 13,
    mono: true,
  });

const lock = (key, x, y) =>
  Box({
    key,
    x,
    y,
    w: 50,
    h: 22,
    label: 'const',
    labelSize: 9,
    mono: true,
    tone: 'freed',
  });

const obj = (threshold, thresholdTone = 'neutral', readsTone = 'neutral', reads = '0') =>
  Frame({
    key: 'obj',
    x: OBJ.x,
    y: OBJ.y,
    w: OBJ.w,
    label: 'Config @0x1000',
    tone: 'owned',
    vars: [
      { name: 'threshold', value: threshold, tone: thresholdTone },
      { name: 'reads', value: reads, tone: readsTone },
    ],
  });

const other = (tone = 'neutral') =>
  Frame({
    key: 'other',
    x: OTHER.x,
    y: OTHER.y,
    w: OTHER.w,
    label: 'Config @0x2000',
    tone,
    vars: [{ name: 'threshold', value: '0' }],
  });

const a1 = (tone) =>
  Arrow({
    key: 'a1',
    from: [210, P1_Y + 24],
    to: [282, 192],
    shape: 'curve',
    bend: -16,
    tone,
    thick: true,
  });

const a2 = (tone) =>
  Arrow({
    key: 'a2',
    from: [210, P2_Y + 24],
    to: [282, ROW_0_Y],
    shape: 'straight',
    bend: 0,
    tone,
    thick: true,
  });

const a3 = (tone) =>
  Arrow({
    key: 'a3',
    from: [210, P3_Y + 24],
    to: [282, ROW_1_Y + 6],
    shape: 'curve',
    bend: 16,
    tone,
    thick: true,
  });

export default {
  oneLiner:
    '`const` is a promise attached to the route you took to the object, not a property of the object itself.',

  whyJob:
    'Getting `const` wrong turns a compile-time error into a runtime one, and misunderstanding what it promises leads people to expect optimisations the compiler is forbidden from making. Both come up in code review on day one.',

  mentalModel:
    'Think of a warehouse with several doors. The goods in the middle are the object. `const` is *a sign on one door* saying "no removals through here" — it says nothing about the goods and nothing about the other doors. So a `const&` guarantees that *you* will not write, not that the value will hold still.',

  scene: {
    id: 'const-paths',
    title: 'One object, three doors, three different promises',
    width: 720,
    height: 420,
    legend: [
      { tone: 'owned', label: 'write goes through' },
      { tone: 'freed', label: 'blocked at compile time' },
      { tone: 'borrowed', label: 'mutable — escapes the promise' },
    ],
    steps: [
      {
        say: 'Three names, one object. None of these is a copy — all three land on the same bytes at 0x1000. Nothing you can write on the left changes the object; it changes what you are permitted to do on the way in.',
        mark: ['20-23'],
        shapes: () => [
          path('p1', P1_Y, 'Config& r', 'read-write', 'owned'),
          path('p2', P2_Y, 'const Config& cr', 'read-only', 'freed'),
          path('p3', P3_Y, 'Config* const cp', 'fixed aim', 'borrowed'),
          obj('42'),
          a1('owned'),
          a2('freed'),
          a3('borrowed'),
        ],
      },
      {
        say: 'A write through the plain reference lands. Zero instructions were spent checking anything — `r` compiles to the same address `cfg` has, and the store is a store.',
        mark: ['25'],
        focus: ['p1', 'a1', 'obj', 'w'],
        shapes: () => [
          path('p1', P1_Y, 'Config& r', 'read-write', 'owned'),
          path('p2', P2_Y, 'const Config& cr', 'read-only', 'freed'),
          path('p3', P3_Y, 'Config* const cp', 'fixed aim', 'borrowed'),
          obj('99', 'owned'),
          a1('owned'),
          a2('freed'),
          a3('borrowed'),
          Tag({ key: 'w', x: 214, y: 86, text: '= 99', tone: 'owned' }),
        ],
      },
      {
        say: 'The same write through `cr` never reaches the machine. It is rejected while compiling, so it costs nothing at runtime: there is no flag in the object, no check in the generated code, nothing to strip out in a release build. `const` exists entirely in the compiler\'s head.',
        mark: ['26'],
        focus: ['p2', 'a2', 'lk2', 'obj', 'w', 'err'],
        shapes: () => [
          path('p1', P1_Y, 'Config& r', 'read-write', 'owned'),
          path('p2', P2_Y, 'const Config& cr', 'read-only', 'freed'),
          path('p3', P3_Y, 'Config* const cp', 'fixed aim', 'borrowed'),
          obj('99'),
          a1('owned'),
          a2('freed'),
          a3('borrowed'),
          lock('lk2', 224, 195),
          Tag({ key: 'w', x: 214, y: 168, text: '= 7', tone: 'freed' }),
          Text({
            key: 'err',
            x: 500,
            y: 120,
            text: 'error: cannot assign to',
            size: 12,
            mono: true,
            tone: 'freed',
          }),
          Text({
            key: 'err2',
            x: 500,
            y: 138,
            text: 'a variable with const-',
            size: 12,
            mono: true,
            tone: 'freed',
          }),
          Text({
            key: 'err3',
            x: 500,
            y: 156,
            text: 'qualified type',
            size: 12,
            mono: true,
            tone: 'freed',
          }),
        ],
      },
      {
        predict: {
          ask: '`cr` is a `const Config&` and it is still alive. Meanwhile the code writes `r.set(7)` through the other reference. What does `cr.threshold` read afterwards?',
          options: [
            { label: '99 — const means the value cannot change', correct: false },
            { label: '7 — the object changed under cr', correct: true },
            { label: 'Undefined behaviour, because the object is const', correct: false },
          ],
          because:
            'The padlock is on the door, not on the goods. `const Config&` promises that *this path* will not be used to write; it says nothing about the object, which was never const to begin with — only this reference to it is. Undefined behaviour would require the *object itself* to have been declared `const`, which is a different thing entirely.',
        },
        say: 'This is the point everyone gets wrong. Two live paths to one object, one of them read-only, and the value changed anyway. Because the compiler must assume this can happen, it cannot cache `cr.threshold` in a register across a call it cannot see inside — the reload after `observe()` is mandatory, not pessimism.',
        mark: ['25', '32'],
        focus: ['p1', 'p2', 'a1', 'a2', 'lk2', 'obj', 'w', 'alias'],
        shapes: () => [
          path('p1', P1_Y, 'Config& r', 'read-write', 'owned'),
          path('p2', P2_Y, 'const Config& cr', 'read-only', 'freed'),
          path('p3', P3_Y, 'Config* const cp', 'fixed aim', 'borrowed'),
          obj('7', 'highlight'),
          a1('owned'),
          a2('freed'),
          a3('borrowed'),
          lock('lk2', 224, 195),
          Tag({ key: 'w', x: 214, y: 86, text: '= 7', tone: 'owned' }),
          Text({
            key: 'alias',
            x: 500,
            y: 130,
            text: 'cr sees 7, and had',
            size: 12,
            mono: true,
            tone: 'highlight',
          }),
          Text({
            key: 'alias2',
            x: 500,
            y: 148,
            text: 'no say in it',
            size: 12,
            mono: true,
            tone: 'highlight',
          }),
        ],
      },
      {
        say: 'Read the declaration right to left, stopping at the `*`. `Config* const cp` is "cp is a *const pointer* to Config" — the const applies to the pointer. So writing through it is fine, and re-aiming it is the error, exactly the opposite of `cr`.',
        mark: ['22', '27-28'],
        focus: ['p3', 'a3', 'obj', 'other', 'reaim', 'lkr', 'w', 'rtl'],
        shapes: () => [
          path('p1', P1_Y, 'Config& r', 'read-write', 'owned'),
          path('p2', P2_Y, 'const Config& cr', 'read-only', 'freed'),
          path('p3', P3_Y, 'Config* const cp', 'fixed aim', 'borrowed'),
          obj('7', 'owned'),
          other(),
          a1('owned'),
          a2('freed'),
          a3('owned'),
          Arrow({
            key: 'reaim',
            from: [210, P3_Y + 38],
            to: [282, 336],
            shape: 'curve',
            bend: 18,
            tone: 'freed',
            dashed: true,
          }),
          lock('lkr', 218, 322),
          Tag({ key: 'w', x: 214, y: 250, text: '->set(7)', tone: 'owned' }),
          Text({
            key: 'rtl',
            x: 500,
            y: 244,
            text: 'Config * const cp',
            size: 12,
            mono: true,
            tone: 'borrowed',
          }),
          Text({
            key: 'rtl2',
            x: 500,
            y: 262,
            text: '  const pointer  <-',
            size: 12,
            mono: true,
            opacity: 0.75,
          }),
        ],
      },
      {
        say: 'Swap the two words and you swap the two permissions. `const Config* q` is "q is a pointer to a *const Config*" — re-aiming is fine, writing is not. Same characters, opposite meanings, and the right-to-left rule is what tells them apart without guessing.',
        mark: ['23', '29-30'],
        focus: ['p4', 'a3', 'obj', 'other', 'reaim', 'lk3', 'w', 'rtl'],
        shapes: () => [
          path('p1', P1_Y, 'Config& r', 'read-write', 'owned'),
          path('p2', P2_Y, 'const Config& cr', 'read-only', 'freed'),
          path('p4', P3_Y, 'const Config* q', 'free aim', 'borrowed'),
          obj('7'),
          other('owned'),
          a1('owned'),
          a2('freed'),
          a3('freed'),
          lock('lk3', 222, 255),
          Arrow({
            key: 'reaim',
            from: [210, P3_Y + 38],
            to: [282, 336],
            shape: 'curve',
            bend: 18,
            tone: 'owned',
          }),
          Tag({ key: 'w', x: 214, y: 250, text: '->set(1)', tone: 'freed' }),
          Text({
            key: 'rtl',
            x: 500,
            y: 244,
            text: 'const Config * q',
            size: 12,
            mono: true,
            tone: 'borrowed',
          }),
          Text({
            key: 'rtl2',
            x: 500,
            y: 262,
            text: 'pointer to const  <-',
            size: 12,
            mono: true,
            opacity: 0.75,
          }),
        ],
      },
      {
        say: 'Two escape hatches, both deliberate. Inside a `const` member function the hidden `this` becomes `const Config*`, which is how the promise reaches the member body. And a `mutable` field is exempt: it can be written through a const path, which is what makes caches, counters, memo tables and lazily-computed values possible without lying about the interface.',
        mark: ['5', '7-9'],
        focus: ['p2', 'a2', 'lk2', 'mut', 'obj', 'this'],
        shapes: () => [
          path('p2', P2_Y, 'const Config& cr', 'read-only', 'freed'),
          obj('7', 'neutral', 'borrowed', '1'),
          a2('freed'),
          lock('lk2', 224, 195),
          Arrow({
            key: 'mut',
            from: [210, P2_Y + 38],
            to: [282, ROW_1_Y + 4],
            shape: 'curve',
            bend: 22,
            tone: 'borrowed',
            dashed: true,
            label: 'mutable',
          }),
          Tag({
            key: 'this',
            x: 492,
            y: 176,
            text: 'this -> const Config*',
            tone: 'borrowed',
          }),
          Text({
            key: 'note',
            x: 492,
            y: 232,
            text: 'the promise is about the',
            size: 12,
            opacity: 0.8,
          }),
          Text({
            key: 'note2',
            x: 492,
            y: 250,
            text: 'observable state, and you',
            size: 12,
            opacity: 0.8,
          }),
          Text({
            key: 'note3',
            x: 492,
            y: 268,
            text: 'decide what that means',
            size: 12,
            opacity: 0.8,
          }),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'constness.cpp',
    source: `#include <cstdio>

struct Config {
    int threshold = 42;
    mutable int reads = 0;

    int get() const {
        ++reads;
        return threshold;
    }
    void set(int v) { threshold = v; }
};

void observe(const Config& c) {
    printf("%d\\n", c.get());
}

int main() {
    Config cfg;
    Config&       r  = cfg;
    const Config& cr = cfg;
    Config* const cp = &cfg;
    const Config* q  = &cfg;

    r.set(99);
    // cr.set(7);
    cp->set(7);
    // cp = nullptr;
    q = nullptr;
    // q->set(1);

    printf("%d\\n", cr.threshold);
    observe(cfg);
    return 0;
}`,
    annotations: [
      {
        lines: '5',
        text: '`mutable` is the one thing that can be written through a `const` path. Use it for caches and counters — state a caller cannot observe — and never for anything the interface promises is fixed.',
      },
      {
        lines: '7-9',
        text: 'Marking `get()` const makes `this` a `const Config*` for the whole body. `++reads` compiles only because `reads` is `mutable`; drop that keyword and this line is the error.',
      },
      {
        lines: '20-23',
        text: 'Four paths to one object. Uncomment any of the three commented lines to see which promise each declaration actually made.',
      },
      {
        lines: '32',
        text: 'Prints 7, not 99. The object changed while a `const` reference to it was in scope — which is legal, and is the reason `const&` alone does not license caching a load.',
      },
    ],
  },

  deeper: [
    'Top-level `const` on a local (`const int n = 5;`) genuinely constrains the *object*, and the compiler may put it in `.rodata` and constant-fold every use. `const` on a reference or pointer parameter constrains only that access path, and the object behind it may well be non-const. The distinction has teeth: casting away const with `const_cast` and then writing is undefined behaviour if and only if the underlying object was declared `const`. Writing through a `const_cast` to a genuinely non-const object is legal, if usually a design failure.',
    'The aliasing consequence is where `const` disappoints people. Given `void f(const int& a, int& b)`, the compiler cannot assume `a` and `b` name different objects, so a write through `b` forces a reload of `a` — `const` is not a no-alias promise. That is what `__restrict` (a compiler extension, spelled `restrict` in C) is for, and it is why hot loops in numerical code carry it. In Rust the equivalent guarantee falls out of `&`/`&mut` exclusivity for free, which is one of the few places where Rust genuinely generates better code than C++ by default.',
    'A `const` member function makes `this` a `const T*`, which propagates: inside it, every member is const, and you may only call other const member functions. This is why `const` correctness has to be applied from the leaves upward — one missing `const` on an accessor forces callers to give up const-ness all the way up the chain. Adding it late to a large codebase is genuinely painful, which is the practical argument for writing it from the start.',
    '`const` is part of the function signature for overload resolution, so `T& operator[](size_t)` and `const T& operator[](size_t) const` are two different functions and the compiler picks based on the constness of the object. This is how `std::vector` gives you a writable element from a `vector&` and a read-only one from a `const vector&` with the same syntax. When the bodies would be identical, the idiom is to implement the const one and have the non-const one call it through a `const_cast`, or in C++23 to write one `deducing this` template.',
    '`constexpr` and `const` are different axes and are routinely confused. `const` means "not writable through this name"; `constexpr` means "computable at compile time". A `const int n = f();` where `f` is a runtime call is perfectly valid and is not a compile-time constant. `constexpr` implies `const` for objects, but not the reverse.',
  ],

  gotchas: [
    '`const std::string& s` still forces a `std::string` to exist. Passing a `const char*` literal to it constructs a temporary and allocates. `std::string_view` takes the same call sites with no allocation, and is the right parameter type for a function that only reads.',
    'Returning `const T` by value (as opposed to `const T&`) is a mistake in modern C++: it blocks move construction at the call site, silently turning a move into a copy.',
    '`const` on a pointer member does not make the pointee const. A `const` member function of a class holding `T* p` can freely do `*p = x` — the constness stops at the pointer. This is the classic hole in a "const means immutable" mental model, and it is exactly why `std::experimental::propagate_const` exists.',
    'Marking a member function `const` is a promise about *logical* state and does not make it thread-safe by itself, but the standard library assumes const member functions are safe to call concurrently. If your const method mutates a `mutable` cache without a lock, you have created a data race that the type system will not flag.',
    '`const_cast` away from const followed by a write is undefined behaviour when the object was originally declared `const`. It will often appear to work in a debug build and then break at `-O2` when the compiler folds the original value into the instruction stream.',
  ],

  interview: {
    q: 'You have `void process(const std::vector<int>& in, std::vector<int>& out)`. Inside, you loop reading `in[i]` and writing `out[j]`. Why might the compiler reload `in.size()` on every iteration, and what would you do about it?',
    a: [
      'Because `const&` is not a no-aliasing promise. Nothing stops the caller from passing the same vector as both arguments, so the compiler must assume that a write through `out` may modify the object `in` refers to — including its size member. Every store to `out` therefore invalidates whatever the compiler had cached about `in`, and it emits a reload. The `const` did not fail; it never made that promise. It says "I will not write through this name", not "nobody will write to this object".',
      'The fixes, in order of preference. First, hoist the loop bound into a local: `const size_t n = in.size();` — a value in a register cannot be aliased, and this is usually all that is needed. Second, restructure so the write target is a local buffer that is swapped in at the end, which removes the aliasing question entirely. Third, if the loop is hot and measured, annotate with `__restrict` on the underlying pointers, but that is a promise you are making to the compiler with undefined behaviour as the penalty for breaking it — so it belongs behind a documented precondition, not sprinkled around.',
      'The detail worth adding is that you should confirm rather than assume. Put the function into Godbolt at `-O2` and look for a `mov` of the size out of memory inside the loop body, or check `perf stat` for the instruction count before and after hoisting. Plenty of the time the compiler proves non-aliasing by itself through inlining, and the "optimisation" is noise. Saying that you would measure before changing the code is part of the answer.',
    ],
  },

  exercise: [
    'Take the program above and uncomment the three error lines one at a time. Compile with `g++ -std=c++20 constness.cpp` and read each diagnostic carefully — the compiler names precisely which of the three promises you broke. Then delete `mutable` from line 5 and watch `get()` stop compiling; that single keyword is what separates a const member function from a useless one.',
    'Then do the aliasing experiment. Write `int sum(const std::vector<int>& in, std::vector<int>& out)` that loops `i < in.size()` and pushes into `out`, put it on [Godbolt](https://godbolt.org) at `-O2`, and find the load of the size field inside the loop. Hoist the bound into a `const size_t n` local and watch the load leave the loop. Count the instructions in the loop body before and after — the number is the argument.',
  ],
};
