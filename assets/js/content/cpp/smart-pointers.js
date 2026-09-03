import { Region, Frame, Box, Arrow, Text, Tag } from '../../viz/primitives.js';

/* Two chapters share this canvas. Chapters 1-3 (unique_ptr) use only
   the top stack lane and one heap block. Chapters 4-7 (shared_ptr)
   add a second stack lane for a worker thread and a control block
   next to the object. The region keys stay the same throughout so
   only their contents change. */
const STACK = { x: 20, y: 50, w: 260, h: 340 };
const HEAP = { x: 310, y: 50, w: 390, h: 340 };
const LANE_A_Y = 88;
const LANE_B_Y = 236;
const FR_X = 40;
const FR_R = FR_X + 190 + 4;

const bg = () => [
  Region({ key: 'stack', ...STACK, label: 'THE STACK', tone: 'stack' }),
  Region({ key: 'heap', ...HEAP, label: 'THE HEAP', tone: 'heap' }),
];

export default {
  oneLiner:
    'How `unique_ptr` and `shared_ptr` turn "who frees this?" from a convention you must remember into a question the type answers for you.',

  whyJob:
    'A trading firm asking "why is `shared_ptr` banned on this hot path" is testing one specific fact: that copying it is an atomic operation, and atomics that cross cores are not free. Getting this wrong in an interview reads as having used the type without ever having read its cost.',

  mentalModel:
    'A `unique_ptr` is *a helium balloon on a single string* — one hand holds it, and letting go anywhere pops the balloon. A `shared_ptr` is the same balloon with several strings tied to it and *a little counter riveted on* that tracks how many hands are still holding a string; the balloon only pops when the counter reaches zero. The counter is the whole story — where it lives, who gets to touch it, and what happens when two objects each hold the other\'s string.',

  scene: {
    id: 'smart-pointer-ownership',
    title: 'One owner, shared owners, and a cycle that never frees',
    width: 720,
    height: 420,
    legend: [
      { tone: 'owned', label: 'live object / current owner' },
      { tone: 'moved', label: 'moved-from — empty, or popped' },
      { tone: 'freed', label: 'freed, refcount hit zero' },
      { tone: 'miss', label: 'atomic op — cross-core cost' },
    ],
    steps: [
      {
        say: '`std::unique_ptr<Order> a` holds exactly one thing: the pointer itself. `sizeof(a)` is `sizeof(Order*)` — one machine word. No refcount, no control block, nothing extra. That is what "zero-overhead" means here — not "cheap", but *literally nothing added*.',
        mark: ['10'],
        shapes: () => [
          ...bg(),
          Frame({ key: 'a', x: FR_X, y: LANE_A_Y, label: 'main()', vars: [{ name: 'a', value: '0x9000', tone: 'heap' }] }),
          Box({ key: 'order', x: 340, y: 100, w: 180, h: 64, tone: 'owned', label: 'Order', sub: '0x9000' }),
          Arrow({ key: 'ptr', from: [FR_R, LANE_A_Y + 44], to: [336, 132], tone: 'heap', bend: -14 }),
        ],
      },
      {
        say: '`std::unique_ptr<Order> b = std::move(a);` runs. Ownership transfers by copying that one word into `b` and zeroing `a`\'s copy of it. The compiler will not let you write `unique_ptr<Order> c = a;` instead — the copy constructor does not exist, so a second owner is not a runtime bug here, it is a compile error.',
        mark: ['11'],
        predict: {
          ask: 'What happens if you write `std::unique_ptr<Order> c = a;` (a copy, not a move) instead of line 10?',
          options: [
            { label: 'It compiles, and now `a` and `c` both point at the same Order', correct: false },
            { label: 'It fails to compile — `unique_ptr`\'s copy constructor is `= delete`d', correct: true },
            { label: 'It compiles, but crashes the first time either pointer is used', correct: false },
          ],
          because:
            '`unique_ptr` enforces "exactly one owner" at compile time by simply not having a copy constructor. This is the difference from a raw pointer: the double-free that a raw `Order*` lets you write by accident is not a bug you can write with `unique_ptr` at all — the build fails before the program exists.',
        },
        focus: ['stack', 'heap', 'a', 'b', 'order', 'ptr'],
        shapes: () => [
          ...bg(),
          Frame({ key: 'a', x: FR_X, y: LANE_A_Y, label: 'main()', vars: [{ name: 'a', value: 'nullptr', tone: 'moved' }] }),
          Frame({ key: 'b', x: FR_X, y: LANE_A_Y + 90, label: '(same scope)', vars: [{ name: 'b', value: '0x9000', tone: 'heap' }] }),
          Box({ key: 'order', x: 340, y: 100, w: 180, h: 64, tone: 'owned', label: 'Order', sub: '0x9000 — untouched' }),
          Arrow({ key: 'ptr', from: [FR_R, LANE_A_Y + 90 + 44], to: [336, 132], tone: 'heap', bend: -14, thick: true }),
        ],
      },
      {
        say: 'At the closing brace, both destructors run. `b`\'s runs `delete` on `0x9000` — one call, no branch on a refcount, because there was never anything to count. `a`\'s runs `delete` on `nullptr`, which the standard defines to do nothing.',
        mark: ['13'],
        shapes: () => [
          ...bg(),
          Box({ key: 'order', x: 340, y: 100, w: 180, h: 64, tone: 'freed', dashed: true, label: 'Order', sub: 'freed by ~unique_ptr — 1 delete, 0 refcounts' }),
        ],
      },
      {
        say: 'Now `std::make_shared<Order>(...)` builds `s1`. This time two things exist on the heap: the `Order` itself, and a *control block* holding a strong count and a weak count. `make_shared` places both in one allocation — a plain `shared_ptr<Order>(new Order(...))` would allocate them separately, and cost a second `malloc`.',
        mark: ['31'],
        shapes: () => [
          ...bg(),
          Frame({ key: 's1', x: FR_X, y: LANE_A_Y, label: 'main() — thread A', vars: [{ name: 's1', value: '0xB000', tone: 'heap' }] }),
          Box({ key: 'ctrl', x: 340, y: 100, w: 150, h: 74, tone: 'owned', label: 'control block', sub: 'strong: 1  weak: 0' }),
          Box({ key: 'order2', x: 520, y: 100, w: 170, h: 74, tone: 'owned', label: 'Order', sub: '0xB000' }),
          Text({ key: 'onealloc', x: 490, y: 190, text: 'one allocation (make_shared)', size: 10, mono: true, tone: 'owned', anchor: 'middle', opacity: 0.75 }),
          Arrow({ key: 's1ctrl', from: [FR_R, LANE_A_Y + 44], to: [336, 132], tone: 'heap', bend: -14 }),
          Arrow({ key: 'ctrlobj', from: [490, 137], to: [516, 137], shape: 'straight', tone: 'owned', bend: 0 }),
        ],
      },
      {
        say: 'A worker thread receives a copy: `std::shared_ptr<Order> s2 = s1;`. This does not touch the `Order`. It increments the strong count in the control block — and because another thread might be doing the exact same increment at the exact same instant, that increment has to be *atomic*: a locked bus operation, not a plain add, and one whose cache line now has to be shared coherently between two cores.',
        mark: ['34'],
        focus: ['stack', 'heap', 's1', 's2', 'ctrl', 'order2', 'atomictag'],
        shapes: () => [
          ...bg(),
          Frame({ key: 's1', x: FR_X, y: LANE_A_Y, label: 'main() — thread A', vars: [{ name: 's1', value: '0xB000', tone: 'heap' }] }),
          Frame({ key: 's2', x: FR_X, y: LANE_B_Y, label: 'worker() — thread B', vars: [{ name: 's2', value: '0xB000', tone: 'heap' }] }),
          Box({ key: 'ctrl', x: 340, y: 160, w: 150, h: 74, tone: 'miss', label: 'control block', sub: 'strong: 2  weak: 0' }),
          Box({ key: 'order2', x: 520, y: 160, w: 170, h: 74, tone: 'owned', label: 'Order', sub: '0xB000' }),
          Arrow({ key: 's1ctrl', from: [FR_R, LANE_A_Y + 44], to: [336, 192], tone: 'miss', bend: -22 }),
          Arrow({ key: 's2ctrl', from: [FR_R, LANE_B_Y + 44], to: [336, 197], tone: 'miss', bend: 22 }),
          Arrow({ key: 'ctrlobj', from: [490, 197], to: [516, 197], shape: 'straight', tone: 'owned', bend: 0 }),
          Tag({ key: 'atomictag', x: 340, y: 130, text: 'atomic ++, ~20-100 cycles, cross-core', tone: 'miss' }),
        ],
      },
      {
        say: 'Thread A finishes and `s1` goes out of scope. Its destructor decrements the strong count — atomically again — from 2 to 1. The count is still above zero, so nothing is freed: `s2` is still holding its string.',
        mark: ['36'],
        focus: ['stack', 'heap', 's2', 'ctrl', 'order2'],
        shapes: () => [
          ...bg(),
          Frame({ key: 's2', x: FR_X, y: LANE_B_Y, label: 'worker() — thread B', vars: [{ name: 's2', value: '0xB000', tone: 'heap' }] }),
          Box({ key: 'ctrl', x: 340, y: 160, w: 150, h: 74, tone: 'owned', label: 'control block', sub: 'strong: 1  weak: 0' }),
          Box({ key: 'order2', x: 520, y: 160, w: 170, h: 74, tone: 'owned', label: 'Order', sub: '0xB000' }),
          Arrow({ key: 's2ctrl', from: [FR_R, LANE_B_Y + 44], to: [336, 197], tone: 'heap', bend: 22 }),
          Arrow({ key: 'ctrlobj', from: [490, 197], to: [516, 197], shape: 'straight', tone: 'owned', bend: 0 }),
        ],
      },
      {
        say: 'Thread B finishes too. The last `shared_ptr` destructor decrements the count to zero, and *that* thread — whichever one happens to run the decrement that hits zero — is the one that runs `Order`\'s destructor and frees both the object and the control block in a single deallocation.',
        mark: ['41'],
        shapes: () => [
          ...bg(),
          Box({ key: 'ctrl', x: 340, y: 160, w: 150, h: 74, tone: 'freed', dashed: true, label: 'control block', sub: 'strong: 0 — freed' }),
          Box({ key: 'order2', x: 520, y: 160, w: 170, h: 74, tone: 'freed', dashed: true, label: 'Order', sub: 'freed' }),
        ],
      },
      {
        say: 'Now the trap `shared_ptr` cannot protect you from: two `Node`s, each holding a `shared_ptr` to the other. Both start with a stack owner, and both also hold one string tied to the *other* object. When `main` drops its own two references, both counts drop from 2 to 1 — and stop. Each object is still being kept alive by the other one.',
        mark: ['23-26'],
        predict: {
          ask: 'After `main()` returns and both of its local `shared_ptr`s go out of scope, do the two `Node` objects ever get destroyed?',
          options: [
            { label: 'Yes — once both locals are gone, nothing external holds them, so they free', correct: false },
            { label: 'No — each object\'s count is still 1, held by the other object, forever', correct: true },
            { label: 'Yes, but only after the program exits and cleans up the heap', correct: false },
          ],
          because:
            '`shared_ptr` frees on "strong count reaches zero", and it has no idea whether a reference is coming from a stack variable or from another object it is itself part of a cycle with. Neither count reaches zero, neither destructor ever runs, and this is a real, silent memory leak in an otherwise perfectly correct-looking program. The fix is to make one direction of the cycle a `weak_ptr`, which observes the object without adding to the strong count.',
        },
        shapes: () => [
          ...bg(),
          Box({ key: 'ctrlA', x: 340, y: 100, w: 150, h: 64, tone: 'freed', label: 'control block A', sub: 'strong: 1' }),
          Box({ key: 'nodeA', x: 520, y: 100, w: 170, h: 64, tone: 'freed', label: 'Node A', sub: '0xC000' }),
          Box({ key: 'ctrlB', x: 340, y: 220, w: 150, h: 64, tone: 'freed', label: 'control block B', sub: 'strong: 1' }),
          Box({ key: 'nodeB', x: 520, y: 220, w: 170, h: 64, tone: 'freed', label: 'Node B', sub: '0xD000' }),
          Arrow({ key: 'ab', from: [520, 148], to: [420, 220], tone: 'freed', bend: -20, label: 'other' }),
          Arrow({ key: 'ba', from: [520, 236], to: [420, 148], tone: 'freed', bend: 20, label: 'other' }),
          Tag({ key: 'leak', x: 190, y: 340, text: 'leaked — both counts stuck at 1, never reach 0', tone: 'freed' }),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'smart_pointers.cpp',
    source: `#include <cstdio>
#include <memory>

struct Order {
    double price;
    int    quantity;
};

void unique_demo() {
    std::unique_ptr<Order> a = std::make_unique<Order>(Order{101.5, 100});
    std::unique_ptr<Order> b = std::move(a);   // ownership transfers, a is null
    printf("a is %s\\n", a ? "non-null" : "null");
}   // b's destructor runs here: exactly one delete, no refcount

struct Node {
    int value;
    std::shared_ptr<Node> other;   // a cycle waiting to happen
};

void cycle_demo() {
    auto x = std::make_shared<Node>(Node{1, nullptr});
    auto y = std::make_shared<Node>(Node{2, nullptr});
    x->other = y;   // x's Node now holds a strong reference to y
    y->other = x;   // and y's Node holds one right back to x
    printf("use_count(x) = %ld\\n", x.use_count());   // 2, not 1
}   // both go out of scope here -- neither refcount reaches zero

int main() {
    unique_demo();

    auto s1 = std::make_shared<Order>(Order{55.0, 10});
    printf("use_count = %ld\\n", s1.use_count());       // 1
    {
        std::shared_ptr<Order> s2 = s1;                 // atomic increment
        printf("use_count = %ld\\n", s1.use_count());   // 2
    }                                                    // s2 destructed: atomic decrement
    printf("use_count = %ld\\n", s1.use_count());       // back to 1

    cycle_demo();   // leaks two Nodes -- nothing ever prints "destroyed"
    return 0;
}`,
    annotations: [
      {
        lines: '10',
        text: '`make_unique` is preferred over `new` directly because it has nowhere to leak a raw pointer if a later argument in the same expression throws.',
      },
      {
        lines: '11',
        text: 'The whole ownership transfer: no allocator call, three words moved into `b`, `a`\'s copy zeroed.',
      },
      {
        lines: '23-24',
        text: 'The cycle is created here. `x` and `y` are each kept alive by a stack variable *and* now referenced by the other\'s `Node` — removing the stack variables later removes one reference each, not both.',
      },
      {
        lines: '34',
        text: 'A copy of a `shared_ptr` is never just a pointer copy. It is a strong-count increment on the control block, and it has to be atomic because another thread could be copying the same `shared_ptr` concurrently.',
      },
      {
        lines: '39',
        text: 'This call leaks two `Node`s and prints nothing about it. `shared_ptr` cycles do not crash, warn, or show up in a quick test — they show up as memory that grows and never comes back down.',
      },
    ],
  },

  deeper: [
    '`unique_ptr<T>` with the default deleter compiles down to exactly the pointer it wraps — no vtable, no extra field, and its destructor is a conditional `delete`. This is why the standard library and every serious C++ codebase reach for it as the *default* way to own a heap allocation: there is no version of "just use a raw pointer" that is measurably faster, and the raw version is missing the compile-time single-owner guarantee entirely.',
    '`shared_ptr<T>` is two pointers wide — one to the object, one to the control block — which is already twice the size of `unique_ptr` before a single `Order` has been touched. The control block holds the strong count, the weak count, and (unless you used `make_shared`) a pointer back to the object plus the deleter. `make_shared` collapses the object and the control block into one allocation, which is both faster (one `malloc` instead of two) and friendlier to the cache (one cache line instead of two scattered ones) — the tradeoff is that the memory for the `Order` itself cannot be released until every `weak_ptr` referencing the control block is gone too, not just every `shared_ptr`.',
    'The atomic increment and decrement are the real cost, and they are not merely "a few extra instructions". On a multi-core machine, an atomic operation on a shared cache line forces that line to be exclusively owned by the core doing the increment, which means any other core with a cached copy has to invalidate it — the classic cache-line-bouncing pattern. Two threads passing the same `shared_ptr` back and forth can spend more time serialising over that one counter than doing anything with the object it points to. This is precisely why `shared_ptr` is treated as a hot-path liability: the cost is not proportional to what you are doing with the pointer, it is a tax paid on every copy and every destruction, and it scales *worse* as more cores contend for it, not better.',
    '`weak_ptr` observes an object without adding to the strong count. Calling `.lock()` on one either returns a `shared_ptr` (bumping the strong count temporarily, if the object is still alive) or an empty one (if it is not) — it is the only safe way to ask "is this still there?" without racing the object\'s destruction. The standard fix for the cycle in this lesson is to make the back-reference (a child pointing to its parent, say) a `weak_ptr`: the parent still strongly owns the child, the child can still reach the parent when it needs to, but the child no longer keeps the parent alive.',
    'A `unique_ptr` can always be converted into a `shared_ptr`, never the other way around — sharing is a one-way widening of a guarantee, not a reversible choice. The practical rule this suggests: default to `unique_ptr` everywhere, and reach for `shared_ptr` only at the specific point where more than one part of the program genuinely needs to decide, independently, when an object dies. Most code that "might need sharing later" never does.',
  ],

  gotchas: [
    'Constructing two independent `shared_ptr`s from the same raw pointer — `shared_ptr<Order> a(raw); shared_ptr<Order> b(raw);` — creates two unrelated control blocks, each convinced its count is the only one. Both eventually call `delete` on the same address.',
    'Calling `.get()` on a `shared_ptr` and storing the raw pointer past the `shared_ptr`\'s own lifetime brings back a dangling pointer, with none of the safety the wrapper was there to provide.',
    '`std::shared_ptr<Order>(new Order(...))` compiles fine and works, but costs a second allocation compared with `make_shared<Order>(...)` — a difference that shows up in a profiler as "why is this constructor twice as slow as the one two lines above it".',
    'A `shared_ptr` cycle produces no warning, no crash, and no sanitizer report in a short-lived test — `-fsanitize=leak` will not flag reachable memory. It only shows up as resident memory that keeps climbing in a long-running process.',
    'Passing a `shared_ptr` by value into a function that is called on every iteration of a hot loop pays the atomic increment and decrement on every single call, even when the callee never lets the object outlive the caller. Pass by `const&` instead when ownership is not actually changing hands.',
  ],

  interview: {
    q: 'A colleague wants to replace a raw `Order*` with a `shared_ptr<Order>` in the matching engine\'s order book, reasoning that it is "safer". What would you push back on?',
    a: [
      'The safety argument is real but incomplete — it trades a memory-safety bug you might write for a performance cost you will definitely pay. Every copy of that `shared_ptr` — passing it into a function, storing it in a second container, returning it — is an atomic increment on the control block, and every destruction is an atomic decrement. On a single core that is still slower than a plain add; across cores, with multiple threads touching orders concurrently, it becomes cache-line contention on that one counter, which is the kind of cost that does not show up until the system is under real load.',
      'If the order book has one clear owner — say, the book itself owns every `Order`, and everything else just needs to look at one — the safer and cheaper fix is `unique_ptr` for the owning side and a raw pointer or reference for the borrowing side, which has zero runtime cost and gets the "who deletes this" answer just as unambiguously as `shared_ptr` does. `shared_ptr` earns its cost only when ownership is genuinely ambiguous — more than one part of the system independently needs to decide when the object dies — and a matching engine\'s order book usually is not that case.',
      'I would also ask whether anything in the proposed design creates a cycle — an `Order` holding a `shared_ptr` back to something that holds a `shared_ptr` to it, directly or through a chain — because that fails silently rather than loudly, and "safer" is exactly the assumption that makes people stop checking for it.',
    ],
  },

  exercise: [
    'Build the code block and run it under `perf stat -e task-clock` in a loop that just does `shared_ptr` copy-and-destroy a few million times, once single-threaded and once with two threads each copying their own `shared_ptr` to the same object. Compare the wall time per operation — the multi-threaded case should be markedly worse per-copy even though each thread is doing "the same amount of work", and that gap is cache-line contention on the control block, made visible.',
    'Then take `cycle_demo()`, run it under `valgrind --tool=memcheck --leak-check=full`, and read the report. It will not flag the leak as a bug the way a use-after-free is flagged — "still reachable" is the phrase to look for, and understanding why the tool considers a permanently unreachable-in-practice cycle merely "reachable" is worth sitting with. Then fix it by making `Node::other` alternate between `shared_ptr` and `weak_ptr` on the two ends, rerun, and confirm the leak is gone.',
  ],
};
