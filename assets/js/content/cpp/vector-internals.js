import { Region, Frame, Box, Cells, Arrow, Text, Tag, Bracket } from '../../viz/primitives.js';

/* Fixed geometry so the two buffers stay put and only the pointers move. */
const STACK = { x: 18, y: 54, w: 200, h: 300 };
const HEAP = { x: 238, y: 54, w: 464, h: 300 };

const VEC = { x: 30, y: 96, w: 176 };        // 3 vars -> h = 116, so 96..212
const VROW = (i) => VEC.y + 44 + i * 26;     // ptr 140, size 166, cap 192
const VRIGHT = VEC.x + VEC.w + 2;

const CELL = { w: 44, h: 36 };
const OLD = { x: 268, y: 110 };              // 4 cells -> 268..444
const NEW = { x: 268, y: 248 };              // 8 cells -> 268..620

const bg = () => [
  Region({ key: 'stack', ...STACK, label: 'THE STACK', tone: 'stack' }),
  Region({ key: 'heap', ...HEAP, label: 'THE HEAP', tone: 'heap' }),
];

const control = (ptr, size, cap, ptrTone = 'heap') =>
  Frame({
    key: 'vec',
    x: VEC.x,
    y: VEC.y,
    w: VEC.w,
    label: 'std::vector<int> v',
    vars: [
      { name: 'ptr', value: ptr, tone: ptrTone },
      { name: 'size', value: size },
      { name: 'cap', value: cap, tone: size === cap ? 'freed' : 'neutral' },
    ],
  });

const oldCells = (values) =>
  Cells({ key: 'old', x: OLD.x, y: OLD.y, ...CELL, values });

const newCells = (values) =>
  Cells({ key: 'new', x: NEW.x, y: NEW.y, ...CELL, values });

const blank = { value: '', tone: 'neutral', dashed: true };
const live = (v) => ({ value: v, tone: 'owned' });
const dead = (v) => ({ value: v, tone: 'freed', dashed: true });

/* The vector's own pointer. One key, two destinations — the travel is the point. */
const vptrTo = (toY, bend, tone = 'heap') =>
  Arrow({
    key: 'vptr',
    from: [VRIGHT, VROW(0)],
    to: [OLD.x - 4, toY],
    tone,
    bend,
    thick: true,
  });

export default {
  oneLiner:
    'The three words behind `std::vector`, why `push_back` is cheap on average, and the one line that invalidates every iterator you are holding.',

  whyJob:
    'Iterator invalidation is the single most asked C++ container question, and "why is push_back amortised O(1)" is the standard follow-up. Both are really questions about whether you know that a vector is a pointer, a size and a capacity, and that growth means a new block at a new address.',

  mentalModel:
    'A vector is a *table booked for eight at a restaurant*: you have the table (capacity) and the people currently sitting at it (size). A ninth guest does not get a chair squeezed in — the whole party is walked to a *different, larger table*, and anyone who was told "we are at table 4" is now holding stale information.',

  scene: {
    id: 'vector-reallocation',
    title: 'A push_back that does not fit, and the iterator that pays for it',
    width: 720,
    height: 400,
    legend: [
      { tone: 'owned', label: 'live element' },
      { tone: 'freed', label: 'freed block / dangling pointer' },
      { tone: 'heap', label: 'buffer owned by the vector' },
    ],
    steps: [
      {
        say: 'The vector object itself is three words on the stack. Every element lives in one contiguous heap block, which is why `v[i]` is a single address computation and why a vector walk streams through cache perfectly.',
        mark: ['6'],
        shapes: () => [
          ...bg(),
          control('0x60a0', '4', '4'),
          ...oldCells([live('1'), live('2'), live('3'), live('4')]),
          Text({
            key: 'oldaddr',
            x: OLD.x,
            y: 166,
            text: 'block A @ 0x60a0 — 16 bytes, capacity 4',
            size: 10,
            mono: true,
            opacity: 0.6,
          }),
          vptrTo(OLD.y + 16, -20),
        ],
      },
      {
        say: 'You take an iterator. For a vector that is not an abstraction with a wrapper class in a release build — it is literally an `int*` into that block. `&v[1]`, a reference to an element, a range-for cursor and a `std::span` all reduce to the same address.',
        mark: ['9'],
        shapes: () => [
          ...bg(),
          control('0x60a0', '4', '4'),
          ...oldCells([live('1'), live('2'), live('3'), live('4')]),
          Text({
            key: 'oldaddr',
            x: OLD.x,
            y: 166,
            text: 'block A @ 0x60a0 — 16 bytes, capacity 4',
            size: 10,
            mono: true,
            opacity: 0.6,
          }),
          vptrTo(OLD.y + 16, -20),
          Tag({ key: 'it', x: 430, y: 72, text: 'it = &v[1]', tone: 'borrowed' }),
          Arrow({
            key: 'itarrow',
            from: [452, 92],
            to: [346, 106],
            tone: 'borrowed',
            bend: 14,
          }),
        ],
      },
      {
        say: 'Now `v.push_back(5)`. Size already equals capacity. The bytes immediately after the block are not spare room — they belong to the allocator, or to whatever it handed out next, and writing there is how you corrupt someone else’s data.',
        mark: ['12'],
        focus: ['vec', 'old.3', 'nextbyte', 'full'],
        shapes: () => [
          ...bg(),
          control('0x60a0', '4', '4'),
          ...oldCells([live('1'), live('2'), live('3'), live('4')]),
          Box({
            key: 'nextbyte',
            x: 448,
            y: OLD.y,
            w: 116,
            h: CELL.h,
            tone: 'freed',
            dashed: true,
            label: 'not yours',
            labelSize: 10,
            mono: true,
          }),
          Text({
            key: 'oldaddr',
            x: OLD.x,
            y: 166,
            text: 'block A @ 0x60a0 — 16 bytes, capacity 4',
            size: 10,
            mono: true,
            opacity: 0.6,
          }),
          vptrTo(OLD.y + 16, -20),
          Tag({ key: 'full', x: 580, y: 118, text: 'size == cap', tone: 'freed' }),
          Tag({ key: 'it', x: 430, y: 72, text: 'it = &v[1]', tone: 'borrowed' }),
          Arrow({
            key: 'itarrow',
            from: [452, 92],
            to: [346, 106],
            tone: 'borrowed',
            bend: 14,
          }),
        ],
      },
      {
        say: 'So the vector asks the allocator for a second block, twice the size, at a completely unrelated address. For this instant the program is holding both blocks at once — which is why growing a 1 GB vector needs 3 GB of address space free, not 2.',
        mark: ['12'],
        focus: ['vec', 'old.0', 'old.1', 'old.2', 'old.3', 'new.0', 'new.7', 'newaddr'],
        shapes: () => [
          ...bg(),
          control('0x60a0', '4', '4'),
          ...oldCells([live('1'), live('2'), live('3'), live('4')]),
          ...newCells([blank, blank, blank, blank, blank, blank, blank, blank]),
          Text({
            key: 'oldaddr',
            x: OLD.x,
            y: 166,
            text: 'block A @ 0x60a0 — still live',
            size: 10,
            mono: true,
            opacity: 0.6,
          }),
          Text({
            key: 'newaddr',
            x: OLD.x,
            y: 304,
            text: 'block B @ 0x9200 — 32 bytes, capacity 8',
            size: 10,
            mono: true,
            opacity: 0.6,
          }),
          vptrTo(OLD.y + 16, -20),
          Tag({ key: 'it', x: 430, y: 72, text: 'it = &v[1]', tone: 'borrowed' }),
          Arrow({
            key: 'itarrow',
            from: [452, 92],
            to: [346, 106],
            tone: 'borrowed',
            bend: 14,
          }),
        ],
      },
      {
        say: 'Elements are relocated one at a time — moved if the element’s move constructor is `noexcept`, copied otherwise. The originals are left as husks and will be destroyed in a moment. This is a per-element loop, not a `memcpy`, unless the type is trivially copyable.',
        mark: ['12'],
        focus: ['old.0', 'old.1', 'old.2', 'old.3', 'new.0', 'new.1', 'migrate'],
        predict: {
          ask: 'When the relocation finishes and block A is freed, what does `it` point at?',
          options: [
            { label: 'The value 2 in block B — the vector fixes it up', correct: false },
            { label: 'Freed memory in block A, and reading it is undefined behaviour', correct: true },
            { label: 'Null, so the mistake fails loudly', correct: false },
          ],
          because:
            '`it` is a bare address. The vector has no registry of outstanding iterators and no way to reach into your local variables, so nothing rewrites it. It keeps the number `0x60a4` forever — an address that now belongs to the allocator.',
        },
        shapes: () => [
          ...bg(),
          control('0x60a0', '4', '8'),
          ...oldCells([dead('1'), dead('2'), live('3'), live('4')]),
          ...newCells([live('1'), live('2'), blank, blank, blank, blank, blank, blank]),
          Text({
            key: 'oldaddr',
            x: OLD.x,
            y: 166,
            text: 'block A @ 0x60a0 — emptying',
            size: 10,
            mono: true,
            opacity: 0.6,
          }),
          Text({
            key: 'newaddr',
            x: OLD.x,
            y: 304,
            text: 'block B @ 0x9200 — filling',
            size: 10,
            mono: true,
            opacity: 0.6,
          }),
          vptrTo(OLD.y + 16, -20),
          Tag({ key: 'migrate', x: 470, y: 190, text: 'element by element', tone: 'highlight' }),
          Tag({ key: 'it', x: 430, y: 72, text: 'it = &v[1]', tone: 'borrowed' }),
          Arrow({
            key: 'itarrow',
            from: [452, 92],
            to: [346, 106],
            tone: 'borrowed',
            bend: 14,
          }),
        ],
      },
      {
        say: 'Block A goes back to the allocator and the new element is appended. `it` was never told. It is a perfectly valid-looking `int*` holding an address that is no longer yours — and dereferencing it will very often print `2`, because the bytes have not been reused yet. That is the worst possible outcome: a bug that passes your test.',
        mark: ['16', '15'],
        focus: ['it', 'itarrow', 'oldghost', 'vec', 'vptr'],
        shapes: () => [
          ...bg(),
          control('0x9200', '5', '8'),
          Box({
            key: 'oldghost',
            x: OLD.x,
            y: OLD.y,
            w: 4 * CELL.w,
            h: CELL.h,
            tone: 'freed',
            dashed: true,
            label: 'block A — freed',
            labelSize: 11,
            mono: true,
          }),
          ...newCells([
            live('1'),
            live('2'),
            live('3'),
            live('4'),
            live('5'),
            blank,
            blank,
            blank,
          ]),
          Text({
            key: 'oldaddr',
            x: OLD.x,
            y: 166,
            text: '0x60a0 belongs to the allocator again',
            size: 10,
            mono: true,
            tone: 'freed',
            opacity: 0.85,
          }),
          Text({
            key: 'newaddr',
            x: OLD.x,
            y: 304,
            text: 'block B @ 0x9200 — size 5, capacity 8',
            size: 10,
            mono: true,
            opacity: 0.6,
          }),
          vptrTo(NEW.y + 16, 34),
          Tag({ key: 'it', x: 430, y: 72, text: 'it — DANGLING', tone: 'freed' }),
          Arrow({
            key: 'itarrow',
            from: [452, 92],
            to: [346, 106],
            tone: 'freed',
            thick: true,
            bend: 14,
          }),
        ],
      },
      {
        say: 'The fix costs one line. `reserve(n)` buys the final capacity up front, so there is one allocation, no relocation loop, and no address ever changes. Reaching for it whenever you know the size is the cheapest performance win in C++.',
        mark: ['18-22'],
        shapes: () => [
          ...bg(),
          control('0x9200', '5', '8'),
          ...newCells([
            live('1'),
            live('2'),
            live('3'),
            live('4'),
            live('5'),
            blank,
            blank,
            blank,
          ]),
          Text({
            key: 'newaddr',
            x: OLD.x,
            y: 304,
            text: 'one block, allocated once, never moved',
            size: 10,
            mono: true,
            opacity: 0.6,
          }),
          Bracket({
            key: 'amort',
            x: OLD.x,
            y: 150,
            w: 352,
            label: 'doubling: N push_backs cost fewer than 2N moves in total',
            tone: 'hit',
          }),
          vptrTo(NEW.y + 16, 34),
          Tag({ key: 'it', x: 430, y: 210, text: 'it — still valid', tone: 'owned' }),
          Arrow({
            key: 'itarrow',
            from: [452, 230],
            to: [346, 244],
            tone: 'owned',
            bend: 14,
          }),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'vecgrow.cpp',
    source: `#include <cstddef>
#include <cstdio>
#include <vector>

int main() {
    std::vector<int> v{1, 2, 3, 4};
    printf("size=%zu cap=%zu\\n", v.size(), v.capacity());

    int* it = &v[1];              // an iterator is a pointer into the buffer
    printf("before %p -> %d\\n", (void*)it, *it);

    v.push_back(5);               // size == capacity, so this reallocates

    printf("size=%zu cap=%zu\\n", v.size(), v.capacity());
    printf("buffer moved to %p\\n", (void*)v.data());
    // printf("after %d\\n", *it);  // undefined behaviour: it is dangling

    std::vector<int> w;
    w.reserve(64);                // one allocation up front
    const int* base = w.data();
    for (int i = 0; i < 64; ++i) w.push_back(i);
    printf("base moved: %s\\n", base == w.data() ? "yes" : "no");

    std::vector<int> g;
    int grows = 0;
    std::size_t cap = 0;
    for (int i = 0; i < 1000; ++i) {
        g.push_back(i);
        if (g.capacity() != cap) { cap = g.capacity(); ++grows; }
    }
    printf("1000 push_backs caused %d reallocations\\n", grows);
    return 0;
}`,
    annotations: [
      {
        lines: '9',
        text: 'Deliberately an `int*` rather than `auto it = v.begin()`, to make the point that in an optimised build these are the same 8 bytes.',
      },
      {
        lines: '12',
        text: 'The whole lesson is on this line. Any operation that can change capacity invalidates everything: iterators, pointers, references, `data()`, and a `std::span` you built earlier.',
      },
      {
        lines: '16',
        text: 'Uncomment it under `-fsanitize=address` to get a `heap-use-after-free` report. Without the sanitizer it will usually print `2` and look fine.',
      },
      {
        lines: '18-22',
        text: 'The whole point of `reserve`: `base` and `w.data()` compare equal at the end, so no address the caller was holding ever went stale.',
      },
    ],
  },

  deeper: [
    'The vector object is three pointers, 24 bytes on a 64-bit machine: `begin`, `end` and `end_of_storage`. `size()` is `end - begin` and `capacity()` is `end_of_storage - begin`, both single subtractions and a shift. Nothing about a vector is stored alongside the elements — there is no header on the heap block — which is why `v.data()` can be handed straight to a C API expecting a bare array.',
    'Growth is geometric, and the factor matters. libstdc++ and libc++ double; MSVC uses 1.5. Doubling means that inserting N elements performs at most 2N element moves in total, because the geometric series 1 + 2 + 4 + … + N sums to less than 2N. That is what "amortised O(1)" means: any single `push_back` can be O(N), but the average over N of them is constant. A growth factor below 2 has an interesting property — the sum of all previously freed blocks can eventually exceed the next request, so the allocator can reuse the space in place. That is the argument for 1.5, and it is the reason the choice is not obviously settled.',
    'Relocation calls `std::move_if_noexcept` on every element, which is the same `noexcept` story as the move-semantics lesson: if your element type has a move constructor that can throw, the vector copies instead, so that a throw partway through leaves the source range intact and `push_back` can keep its strong exception guarantee. For trivially copyable types the whole loop collapses to a single `memmove`, which is why a `vector<int>` grows an order of magnitude faster than a `vector<std::string>`.',
    'Invalidation rules are more specific than "everything dies". Anything that may reallocate — `push_back`, `emplace_back`, `insert`, `resize`, `reserve` — invalidates all iterators, pointers and references if it actually reallocates. `erase` invalidates only from the erase point onward. `pop_back` invalidates only the iterator to the removed element. Crucially `reserve` never *shrinks* and never reallocates if the requested capacity is already available, so calling it in a loop is harmless. And `clear()` sets size to zero but leaves capacity untouched, which is why a vector reused across iterations of an outer loop stops allocating after the first pass — a genuinely useful trick in a hot path.',
    'The classic real-world version of this bug is not a raw pointer, it is a range-for loop that mutates: `for (auto& x : v) if (pred(x)) v.push_back(f(x));`. The range-for holds `begin` and `end` from before the loop body, so the first reallocation leaves both dangling and the loop walks freed memory. Sanitizers catch it instantly; a code review often does not.',
  ],

  gotchas: [
    'A range-for loop over a vector that you `push_back` into during the loop is a use-after-free the moment capacity is exceeded. It frequently appears to work for small inputs, because the initial capacity absorbed the growth.',
    '`v.data()` handed to a background thread or stored in a struct is exactly as fragile as an iterator. Any later growth in the owning thread makes the stored pointer dangle.',
    '`clear()` does not release memory; capacity stays. To actually free it you need `std::vector<T>().swap(v)`, or `shrink_to_fit()`, which is only a non-binding request.',
    '`reserve(n)` sets capacity but not size — `v.reserve(10); v[3] = 1;` is out-of-bounds. `resize(10)` is the one that creates elements.',
    '`std::vector<bool>` is a bitset in disguise, not a vector of bools. `operator[]` returns a proxy object, `&v[0]` does not give you a `bool*`, and `data()` does not exist. Use `std::vector<char>` or `std::deque<bool>`.',
  ],

  interview: {
    q: 'Explain why `push_back` is amortised O(1), and then tell me what happens to an iterator obtained before a `push_back`.',
    a: [
      'A vector keeps a pointer, a size and a capacity. When size is below capacity, `push_back` constructs one element in place and bumps a pointer — genuinely constant time. When size equals capacity it must allocate a new block, relocate every existing element, destroy the originals and free the old block, which is O(N). The reason the average stays constant is that the new capacity is a *multiple* of the old one rather than a fixed increment. With doubling, inserting N elements triggers reallocations at sizes 1, 2, 4, 8 and so on, and the total number of element moves is 1 + 2 + 4 + … + N, which is less than 2N. So N insertions cost O(N) work overall, hence O(1) each on average. If growth were additive — capacity plus 10 each time — the same argument gives a quadratic total and the amortisation collapses.',
      'The iterator is the other half of that trade. For a vector an iterator is a pointer into the buffer, and the vector keeps no record of who holds one. So on reallocation the block it points into is freed and the iterator becomes dangling: reading through it is undefined behaviour. It will very often still print the right value, because the allocator has not yet handed those bytes out again, and that is exactly what makes the bug expensive — it survives the test suite and fails in production. The same applies to references, to `data()`, and to a `std::span` built before the growth.',
      'Two things I would add to show I have used this in anger. First, relocation uses `std::move_if_noexcept`, so an element type with a non-`noexcept` move constructor gets copied on every growth, which turns a cheap resize into an expensive one with no warning. Second, the practical mitigation is `reserve`: if you know or can bound the final size, one `reserve` gives you a single allocation, no relocation, and no invalidation at all. In a latency-sensitive path I would also `clear()` and reuse a vector across iterations rather than constructing a fresh one, because `clear` keeps the capacity and the second pass then allocates nothing.',
    ],
  },

  exercise: [
    'Build and run the code block as it stands: `g++ -std=c++17 -O2 vecgrow.cpp -o vecgrow && ./vecgrow`. Read the last line — 1000 `push_back`s cause roughly ten reallocations, not a thousand. That number *is* the amortisation argument, and having seen it is worth more than the proof.',
    'Now uncomment line 16 and rebuild with `-fsanitize=address`. AddressSanitizer prints `heap-use-after-free` and, more usefully, shows the freed region and the stack that freed it — which will be the `push_back` on line 12. Then comment the sanitizer out and run it again: it prints `2` and exits cleanly. Sit with that difference for a moment; it is the reason sanitizers exist.',
    'Finally, time it. Fill a `std::vector<int>` with ten million values twice — once with no `reserve`, once with `reserve(10'+'000'+'000)` — and print both durations with `std::chrono::steady_clock`. Then repeat with `std::vector<std::string>` of short strings and compare the ratio. The gap between the two element types is the `memmove` fast path disappearing.',
  ],
};
