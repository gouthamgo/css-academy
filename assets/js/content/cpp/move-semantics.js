import { Region, Frame, Box, Arrow, Text, Tag } from '../../viz/primitives.js';

/* Fixed geometry. The stack objects never move; the only thing that
   travels between steps is the pointer, and that travel is the lesson. */
const STACK = { x: 22, y: 52, w: 302, h: 296 };
const HEAP = { x: 362, y: 52, w: 338, h: 296 };

const SRC_Y = 88;   // 3 vars -> h = 30 + 3*26 + 8 = 116, so 88..204
const DST_Y = 222;  //                                       222..338
const FR_X = 44;
const FR_W = 190;
const FR_R = FR_X + FR_W + 2;
const ROW = (frameY, i) => frameY + 44 + i * 26;

const BLK1 = { x: 392, y: 96, w: 282, h: 58 };
const BLK2 = { x: 392, y: 232, w: 282, h: 58 };

const bg = () => [
  Region({ key: 'stack', ...STACK, label: 'THE STACK', tone: 'stack' }),
  Region({ key: 'heap', ...HEAP, label: 'THE HEAP', tone: 'heap' }),
];

const strFrame = (key, y, label, ptr, len, cap, tone = 'stack') =>
  Frame({
    key,
    x: FR_X,
    y,
    w: FR_W,
    tone,
    label,
    vars: [
      { name: 'ptr', value: ptr, tone: tone === 'stack' ? 'heap' : tone },
      { name: 'len', value: len },
      { name: 'cap', value: cap },
    ],
  });

/* One cost meter, redrawn at a different width each step. Same keys, so the
   bar grows and shrinks rather than jumping. */
const meter = (name, w, tone, text) => [
  Text({ key: 'metername', x: 22, y: 372, text: name, size: 11, weight: 700, tone }),
  Box({ key: 'meterbg', x: 76, y: 360, w: 290, h: 24, dashed: true }),
  Box({ key: 'meterfill', x: 78, y: 362, w, h: 20, tone }),
  Text({ key: 'metertext', x: 376, y: 372, text, size: 11, mono: true, tone }),
];

export default {
  oneLiner:
    'How to hand over an owned resource without copying it, and what the source object looks like afterwards.',

  whyJob:
    'Every hot path in a trading system is built on not copying things. Interviewers ask why `std::vector` copies your elements on growth even though you wrote a move constructor — the answer is one missing `noexcept`, and knowing it is a reliable signal that you have actually read the standard library.',

  mentalModel:
    'Copying a resource-owning object is *photocopying a house*; moving it is *handing over the keys*. The house does not move — you change whose pocket the key sits in, then make sure the old owner’s pocket is empty so they cannot walk back in. Everything expensive stays exactly where it was.',

  scene: {
    id: 'move-vs-copy',
    title: 'Copying 40 bytes, versus moving three words',
    width: 720,
    height: 420,
    legend: [
      { tone: 'heap', label: 'live heap buffer' },
      { tone: 'miss', label: 'expensive — allocation and byte copy' },
      { tone: 'moved', label: 'moved-from: valid, empty' },
    ],
    steps: [
      {
        say: 'A `std::string` on the stack is three machine words — a pointer, a length and a capacity. The 40 characters are not in the object at all; the object is a handle. Sizeof this thing is 32 bytes no matter how long the text is.',
        mark: ['28'],
        shapes: () => [
          ...bg(),
          strFrame('src', SRC_Y, 'std::string s', '0x60a0', '40', '40'),
          Box({
            key: 'blk1',
            ...BLK1,
            tone: 'heap',
            label: '"the quick brown fox jumps over lazy dogs"',
            sub: '41 bytes @ 0x60a0  (40 chars + NUL)',
            labelSize: 10.5,
            mono: true,
          }),
          Arrow({
            key: 'buf',
            from: [FR_R, ROW(SRC_Y, 0)],
            to: [BLK1.x - 4, BLK1.y + 20],
            tone: 'heap',
            bend: -12,
          }),
          ...meter('idle', 8, 'neutral', 'nothing has happened yet'),
        ],
      },
      {
        say: 'A copy has to be a *deep* copy, because two strings that share a buffer would double-free it. So the copy constructor asks the allocator for a second block and walks 41 bytes across. On a cold allocator that is a few hundred nanoseconds.',
        mark: ['29', '16-18'],
        focus: ['src', 'dst', 'blk1', 'blk2', 'buf', 'copybuf', 'meterfill', 'metertext', 'metername', 'meterbg'],
        shapes: () => [
          ...bg(),
          strFrame('src', SRC_Y, 'std::string s', '0x60a0', '40', '40'),
          strFrame('dst', DST_Y, 'std::string a', '0x8300', '40', '40'),
          Box({
            key: 'blk1',
            ...BLK1,
            tone: 'heap',
            label: '"the quick brown fox jumps over lazy dogs"',
            sub: '41 bytes @ 0x60a0',
            labelSize: 10.5,
            mono: true,
          }),
          Box({
            key: 'blk2',
            ...BLK2,
            tone: 'miss',
            label: '"the quick brown fox jumps over lazy dogs"',
            sub: 'a whole second block @ 0x8300',
            labelSize: 10.5,
            mono: true,
          }),
          Arrow({
            key: 'buf',
            from: [FR_R, ROW(SRC_Y, 0)],
            to: [BLK1.x - 4, BLK1.y + 20],
            tone: 'heap',
            bend: -12,
          }),
          Arrow({
            key: 'copybuf',
            from: [FR_R, ROW(DST_Y, 0)],
            to: [BLK2.x - 4, BLK2.y + 20],
            tone: 'miss',
            bend: -12,
          }),
          ...meter('copy', 286, 'miss', '1 malloc + 41-byte memcpy'),
        ],
      },
      {
        say: 'Now undo that and look at the case that actually dominates real code: the source is a temporary, or you have finished with it. Nobody needs two buffers. `std::move` is how you say so — and it is a cast, not an instruction. It generates no code at all.',
        mark: ['30'],
        predict: {
          ask: '`std::string b = std::move(s);` runs. What happens to the 41 heap bytes at `0x60a0`?',
          options: [
            { label: 'They are copied into a fresh block owned by `b`', correct: false },
            { label: 'They are not touched — `b` takes over the existing block', correct: true },
            { label: 'They are freed, and `b` starts empty', correct: false },
            { label: 'They are shared, with a reference count of two', correct: false },
          ],
          because:
            'A move never touches the resource. It copies the three words that describe the resource, and then blanks the source’s copy of them so that exactly one object still claims ownership. No allocator call is involved in either direction.',
        },
        shapes: () => [
          ...bg(),
          strFrame('src', SRC_Y, 'std::string s', '0x60a0', '40', '40'),
          Box({
            key: 'blk1',
            ...BLK1,
            tone: 'heap',
            label: '"the quick brown fox jumps over lazy dogs"',
            sub: '41 bytes @ 0x60a0',
            labelSize: 10.5,
            mono: true,
          }),
          Arrow({
            key: 'buf',
            from: [FR_R, ROW(SRC_Y, 0)],
            to: [BLK1.x - 4, BLK1.y + 20],
            tone: 'heap',
            bend: -12,
          }),
          ...meter('idle', 8, 'neutral', 'std::move by itself costs zero'),
        ],
      },
      {
        say: 'The move constructor’s initialiser list has run: `b` now holds the same three numbers `s` held. Three stores into a register-width field each. The allocator was never consulted, and the characters never moved a byte.',
        mark: ['21'],
        focus: ['src', 'dst', 'blk1', 'buf', 'nosteal', 'meterfill', 'metertext', 'metername', 'meterbg'],
        predict: {
          ask: 'The constructor body has not run yet. What must it do before it finishes?',
          options: [
            { label: 'Free `s`’s old buffer, so it is not leaked', correct: false },
            { label: 'Set `s`’s pointer to null and its length to zero', correct: true },
            { label: 'Nothing — `s` is dead the moment you write `std::move`', correct: false },
          ],
          because:
            '`s` is an ordinary local. Its destructor will still run at the closing brace. If its pointer is left holding `0x60a0` you get the double free from the previous lesson — so blanking the source is not politeness, it is the half of the move that makes the other half safe.',
        },
        shapes: () => [
          ...bg(),
          strFrame('src', SRC_Y, 'std::string s', '0x60a0', '40', '40', 'moved'),
          strFrame('dst', DST_Y, 'std::string b', '0x60a0', '40', '40', 'owned'),
          Box({
            key: 'blk1',
            ...BLK1,
            tone: 'heap',
            label: '"the quick brown fox jumps over lazy dogs"',
            sub: 'same block, same address, untouched',
            labelSize: 10.5,
            mono: true,
          }),
          Arrow({
            key: 'buf',
            from: [FR_R, ROW(DST_Y, 0)],
            to: [BLK1.x - 4, BLK1.y + 44],
            tone: 'owned',
            thick: true,
            bend: 26,
          }),
          Tag({ key: 'nosteal', x: 244, y: 196, text: 'no allocation', tone: 'owned' }),
          ...meter('move', 14, 'hit', '3 word writes, ~1 ns'),
        ],
      },
      {
        say: 'The constructor body finishes the job. `s` is not destroyed and it is not poison — it is an empty string, which is a perfectly ordinary thing to be. You may destroy it, assign a new value into it, or ask its size. What you may not do is assume it still says "the quick brown fox".',
        mark: ['22-23', '32'],
        focus: ['src', 'dst', 'blk1', 'buf', 'empty'],
        shapes: () => [
          ...bg(),
          strFrame('src', SRC_Y, 'std::string s', 'nullptr', '0', '0', 'moved'),
          strFrame('dst', DST_Y, 'std::string b', '0x60a0', '40', '40', 'owned'),
          Box({
            key: 'blk1',
            ...BLK1,
            tone: 'heap',
            label: '"the quick brown fox jumps over lazy dogs"',
            sub: 'exactly one owner',
            labelSize: 10.5,
            mono: true,
          }),
          Arrow({
            key: 'buf',
            from: [FR_R, ROW(DST_Y, 0)],
            to: [BLK1.x - 4, BLK1.y + 44],
            tone: 'owned',
            thick: true,
            bend: 26,
          }),
          Tag({ key: 'empty', x: 244, y: 130, text: 'valid, empty', tone: 'moved' }),
        ],
      },
      {
        say: 'At the closing brace both destructors run, as they always do. `s` calls the deallocator on a null pointer, which is defined to do nothing. `b` releases the block. One allocation, one free — the arithmetic finally balances.',
        mark: ['13'],
        shapes: () => [
          ...bg(),
          strFrame('src', SRC_Y, 'std::string s', 'nullptr', '0', '0', 'moved'),
          strFrame('dst', DST_Y, 'std::string b', '—', '0', '0', 'moved'),
          Box({
            key: 'blk1',
            ...BLK1,
            tone: 'moved',
            dashed: true,
            label: 'released once',
            sub: 'freed by ~string of b',
            labelSize: 11,
            mono: true,
          }),
          Tag({ key: 'empty', x: 244, y: 130, text: 'delete nullptr: no-op', tone: 'moved' }),
          ...meter('total', 14, 'hit', '1 malloc, 1 free, 0 memcpy'),
        ],
      },
      {
        say: 'Side by side, that is the whole argument. And there is a catch worth memorising: when `std::vector` grows it will only use your move constructor if it is marked `noexcept`. Without that keyword it silently falls back to the top bar, because a throwing move mid-relocation would leave the vector with elements it can neither restore nor destroy.',
        mark: ['21', '37'],
        focus: ['metername', 'meterbg', 'meterfill', 'metertext', 'm2name', 'm2bg', 'm2fill', 'm2text', 'noex'],
        shapes: () => [
          ...bg(),
          strFrame('src', SRC_Y, 'std::string s', 'nullptr', '0', '0', 'moved'),
          strFrame('dst', DST_Y, 'std::string b', '—', '0', '0', 'moved'),
          Box({
            key: 'blk1',
            ...BLK1,
            tone: 'moved',
            dashed: true,
            label: 'released once',
            sub: 'freed by ~string of b',
            labelSize: 11,
            mono: true,
          }),
          Tag({
            key: 'noex',
            x: 392,
            y: 190,
            text: 'vector checks noexcept',
            tone: 'highlight',
          }),
          Text({ key: 'm2name', x: 22, y: 372, text: 'copy', size: 11, weight: 700, tone: 'miss' }),
          Box({ key: 'm2bg', x: 76, y: 360, w: 290, h: 24, dashed: true }),
          Box({ key: 'm2fill', x: 78, y: 362, w: 286, h: 20, tone: 'miss' }),
          Text({
            key: 'm2text',
            x: 376,
            y: 372,
            text: 'grows with the string',
            size: 11,
            mono: true,
            tone: 'miss',
          }),
          Text({ key: 'metername', x: 22, y: 398, text: 'move', size: 11, weight: 700, tone: 'hit' }),
          Box({ key: 'meterbg', x: 76, y: 386, w: 290, h: 24, dashed: true }),
          Box({ key: 'meterfill', x: 78, y: 388, w: 14, h: 20, tone: 'hit' }),
          Text({
            key: 'metertext',
            x: 376,
            y: 398,
            text: 'constant, whatever the size',
            size: 11,
            mono: true,
            tone: 'hit',
          }),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'move.cpp',
    source: `#include <algorithm>
#include <cstddef>
#include <cstdio>
#include <string>
#include <utility>
#include <vector>

struct Buffer {
    char*       data = nullptr;
    std::size_t len  = 0;

    explicit Buffer(std::size_t n) : data(new char[n]), len(n) {}
    ~Buffer() { delete[] data; }

    // Copy: a second allocation, then every byte.
    Buffer(const Buffer& o) : data(new char[o.len]), len(o.len) {
        std::copy(o.data, o.data + o.len, data);
    }

    // Move: take the pointer, then blank the source.
    Buffer(Buffer&& o) noexcept : data(o.data), len(o.len) {
        o.data = nullptr;
        o.len  = 0;
    }
};

int main() {
    std::string s = "the quick brown fox jumps over lazy dogs";
    std::string a = s;              // malloc + 41-byte memcpy
    std::string b = std::move(s);   // three word writes, no allocation

    printf("s is now %zu chars, and safe to read\\n", s.size());

    std::vector<Buffer> v;
    v.reserve(1);
    v.emplace_back(64);
    v.emplace_back(64);   // growth relocates by move: line 21 is noexcept
    printf("%zu %zu %zu\\n", a.size(), b.size(), v.size());
    return 0;
}`,
    annotations: [
      {
        lines: '21',
        text: 'The `&&` parameter means "bind only to something the caller has agreed to gut". The `noexcept` is what lets `std::vector` and `std::swap` actually use it.',
      },
      {
        lines: '22-23',
        text: 'Not tidiness. `o`’s destructor still runs, so leaving `o.data` pointing at the stolen block is the double free from the previous lesson.',
      },
      {
        lines: '30',
        text: '`std::move` compiles to nothing. It is a cast to `Buffer&&` that changes which constructor overload the compiler picks — the work happens in the constructor, not here.',
      },
      {
        lines: '37',
        text: 'Delete `noexcept` on line 21, rebuild, and this line copies 64 bytes instead of moving. Nothing warns you; the only symptom is a slower profile.',
      },
    ],
  },

  deeper: [
    'An rvalue reference `T&&` is a promise from the caller, not a new kind of pointer. At the machine level `Buffer&&` and `Buffer&` are the same thing — an address in a register. The difference is entirely in overload resolution: the compiler binds `T&&` only to values the caller has marked as expiring, which is why `std::move` is nothing but `static_cast<T&&>`. It generates zero instructions. The name is a small tragedy of C++ history; `std::rvalue_cast` would have prevented years of confusion.',
    'A moved-from standard library object is in a "valid but unspecified state". Valid means the invariants hold, so the destructor works and any operation with no preconditions works — `clear()`, `size()`, assigning a fresh value. Unspecified means you may not assume *which* valid state. For `std::string` and `std::vector` in libstdc++ the moved-from object is always empty in practice, but relying on that is relying on an implementation detail. Assigning a new value to a moved-from variable is completely legal and is how loop bodies reuse buffers.',
    '`noexcept` on the move constructor is load-bearing for a specific reason. When `std::vector` reallocates it must relocate every existing element into the new block. If it is halfway through and the seventh element’s move constructor throws, the first six have already been gutted — the source elements are blanked and the destination is incomplete, and there is no way to put the vector back the way it was. So `vector` uses `std::move_if_noexcept`, which hands back an rvalue reference when the move is `noexcept` and a const lvalue reference otherwise. Copy is slower but it leaves the source intact, so a throw is recoverable. A missing `noexcept` therefore turns every growth into a full copy, silently.',
    'Most of the time you should not write a move constructor at all. If every member is itself movable — `std::string`, `std::vector`, `std::unique_ptr` — the compiler generates a memberwise move that is exactly correct and automatically `noexcept` if all the member moves are. The move constructor in the code block exists only because the class holds a raw `char*`, and the better version of that class holds a `std::unique_ptr<char[]>` and declares nothing.',
    'Return statements rarely need `std::move`, and adding it usually makes things worse. `return local;` is first tried as a move, and before that the compiler tries to elide the construction entirely — with guaranteed copy elision in C++17, `return Buffer(64);` constructs the object directly in the caller’s storage and no constructor of any kind runs. Writing `return std::move(local);` turns the named return value into an expression that cannot be elided, so you convert a zero-cost return into a real move.',
  ],

  gotchas: [
    'Using a variable after moving from it compiles cleanly and often appears to work, because the moved-from state happens to be reasonable. `clang-tidy bugprone-use-after-move` finds these; the compiler will not.',
    '`const T&&` cannot be moved from. A function returning `const T` blocks moves at every call site, which is the usual reason a seemingly fine return path shows up as a copy in the profiler.',
    'Forgetting `noexcept` on a move constructor makes `std::vector` growth copy instead of move, with no diagnostic. Check it with `static_assert(std::is_nothrow_move_constructible_v<T>);`.',
    'Declaring a destructor or a copy constructor suppresses the implicit move operations. A class that grew a destructor last quarter may have stopped being movable without anyone noticing.',
    '`std::move` on a `const` object silently produces a `const&&`, which binds to the copy constructor. Your move disappears and nothing complains.',
  ],

  interview: {
    q: 'You have written a move constructor for a class held in a `std::vector`. A colleague benchmarks `push_back` in a loop and finds that growth is still copying every element. The move constructor is definitely being compiled. What would you look at?',
    a: [
      'The first thing I would check is whether the move constructor is marked `noexcept`. `std::vector` does not call your move constructor directly during reallocation — it calls `std::move_if_noexcept`, which returns an rvalue reference only if the type is nothing-throw move constructible. If your move constructor can throw, `vector` deliberately falls back to copying, because copying leaves the source elements intact and therefore leaves the reallocation recoverable if an exception escapes halfway through. A move, by contrast, gutted the first six sources before element seven threw, and there is no way to undo that. The strong exception guarantee on `push_back` is bought exactly here.',
      'I would confirm it rather than assume it, with `static_assert(std::is_nothrow_move_constructible_v<T>);` next to the class. If that fires, the cause is usually one of two things: a missing `noexcept` on the move constructor itself, or a member whose move can throw and which therefore poisons the implicitly generated move. A `std::string` member is fine; a member holding a container with a non-propagating stateful allocator is not.',
      'If `noexcept` is present and correct, the next suspects are all about the move never being selected in the first place. A declared destructor or a declared copy constructor suppresses the implicit move operations, so a class that looks movable may not be. A `const` member makes the memberwise move degrade to a copy for that member. And if the element type is `const T`, no move is possible at all. The general shape of the answer is that moves are chosen by overload resolution, so the bug is almost never inside the move constructor — it is in what the compiler was allowed to pick.',
    ],
  },

  exercise: [
    'Build the code block with `g++ -O2 -std=c++17 move.cpp -o move` and count allocations by running it under `valgrind --tool=memcheck ./move` — note the total number of allocs. Then delete `noexcept` from line 21, rebuild, and run again. The alloc count goes up, and that difference is the entire cost of one missing keyword.',
    'Add `printf("%p\\n", (void*)b.data());` before and `%p` after a move to prove to yourself that the address is identical. Do the same across a copy and watch it change. Seeing the same hexadecimal number appear in the destination is what converts "moves transfer ownership" from a phrase into a fact you have observed.',
    'Then instrument the `Buffer` class: put a `printf` in the copy constructor and a different one in the move constructor, push ten `Buffer`s into a vector with no `reserve`, and read the trace. You will see the growth pattern, the relocation of every existing element, and — if you removed `noexcept` — the copies. This one trace explains more about `std::vector` than any amount of reading.',
  ],
};
