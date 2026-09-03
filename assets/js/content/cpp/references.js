import { Region, Frame, Arrow, Text, Tag, Box } from '../../viz/primitives.js';

const CALLER_X = 62;
const CALLER_Y = 76;
const CALLEE_X = 398;
const CALLEE_Y = 232;
const FW = 244;

const caller = (px = '10.5', tone = 'stack') =>
  Frame({
    key: 'caller',
    x: CALLER_X,
    y: CALLER_Y,
    w: FW,
    label: 'main()',
    tone,
    vars: [
      { name: 't.id', value: '1' },
      { name: 't.px', value: px, tone: px === '10.5' ? 'neutral' : 'owned' },
      { name: 't.sym', value: '"AAPL"' },
    ],
  });

const frameH = 30 + 3 * 26 + 8;

const cost = (text, tone) =>
  Tag({ key: 'cost', x: CALLEE_X, y: CALLEE_Y - 34, text, tone });

export default {
  oneLiner:
    'The default way to hand something to a function without paying to duplicate it.',

  whyJob:
    'Passing a large struct by value on a hot path is the single most common performance defect caught in code review at a trading firm, and "when would you pass by value instead of const-reference" is a standard screening question.',

  mentalModel:
    'A reference is a nickname. If your friend Robert also answers to Bob, there is still only one person — writing "Bob is thirty" changes Robert. A reference is not a new object; it is a *second label glued onto an existing one*. Because it is a label rather than a box, it can never be peeled off and stuck onto something else.',

  scene: {
    id: 'value-vs-reference',
    title: 'Passing a struct two ways',
    width: 720,
    height: 400,
    legend: [
      { tone: 'stack', label: 'live frame' },
      { tone: 'freed', label: 'copy — discarded on return' },
      { tone: 'owned', label: 'the original, modified' },
    ],
    steps: [
      {
        say: 'One `Trade` lives in `main`\'s frame. It is 40-odd bytes, and one of its members is a `std::string` that owns a heap buffer of its own.',
        mark: ['11'],
        shapes: () => [
          Region({ key: 'r', x: 40, y: 50, w: 640, h: 320, label: 'THE STACK', tone: 'stack' }),
          caller(),
        ],
      },
      {
        say: 'Call `by_value(t)` and the machine builds a whole second Trade in the callee\'s frame. Every byte is duplicated, and the string member allocates a second heap buffer to hold its own copy of "AAPL".',
        mark: ['6', '13'],
        shapes: () => [
          Region({ key: 'r', x: 40, y: 50, w: 640, h: 320, label: 'THE STACK', tone: 'stack' }),
          caller(),
          Frame({
            key: 'callee',
            x: CALLEE_X,
            y: CALLEE_Y,
            w: FW,
            label: 'by_value(Trade t)',
            tone: 'freed',
            vars: [
              { name: 't.id', value: '1' },
              { name: 't.px', value: '10.5' },
              { name: 't.sym', value: '"AAPL"' },
            ],
          }),
          cost('40 bytes + 1 allocation', 'freed'),
        ],
      },
      {
        say: 'The callee sets the price to 99 — on its own copy. Then the frame pops and that work is thrown away. `main`\'s trade never knew anything happened.',
        mark: ['6', '14'],
        focus: ['callee', 'caller', 'gone'],
        shapes: () => [
          Region({ key: 'r', x: 40, y: 50, w: 640, h: 320, label: 'THE STACK', tone: 'stack' }),
          caller('10.5'),
          Box({
            key: 'callee',
            x: CALLEE_X,
            y: CALLEE_Y,
            w: FW,
            h: frameH,
            label: 'copy discarded',
            tone: 'freed',
            dashed: true,
            mono: true,
            labelSize: 12,
          }),
          Tag({ key: 'gone', x: CALLEE_X, y: CALLEE_Y - 34, text: 'work thrown away', tone: 'freed' }),
        ],
      },
      {
        say: 'Now the same call taking `Trade&`.',
        mark: ['7', '16'],
        predict: {
          ask: 'How many bytes does the machine copy to pass a 40-byte struct by reference?',
          options: [
            { label: '40 — the struct still has to get there somehow', correct: false },
            { label: '8 — just an address', correct: true },
            { label: 'Zero — nothing is copied at all', correct: false },
          ],
          because:
            'A reference is an address under the hood, and an address is 8 bytes on a 64-bit machine. It usually travels in a register rather than on the stack, so the cost is closer to zero than to eight — but the thing being copied is the address, not the struct.',
        },
        shapes: () => [
          Region({ key: 'r', x: 40, y: 50, w: 640, h: 320, label: 'THE STACK', tone: 'stack' }),
          caller(),
        ],
      },
      {
        say: 'No second Trade is built. The callee\'s parameter is a label pointing back at `main`\'s object, and the only thing that travelled was an address — normally in a register, never touching memory at all.',
        mark: ['7', '16'],
        shapes: () => [
          Region({ key: 'r', x: 40, y: 50, w: 640, h: 320, label: 'THE STACK', tone: 'stack' }),
          caller(),
          Box({
            key: 'callee',
            x: CALLEE_X,
            y: CALLEE_Y,
            w: FW,
            h: 52,
            label: 'by_ref(Trade& t)',
            sub: 'no object here — only a name',
            tone: 'borrowed',
            mono: true,
            labelSize: 12,
          }),
          Arrow({
            key: 'ref',
            from: [CALLEE_X + 8, CALLEE_Y + 26],
            to: [CALLER_X + FW + 4, CALLER_Y + frameH / 2],
            shape: 'curve',
            bend: 52,
            tone: 'borrowed',
            label: '&t',
          }),
          cost('8 bytes, in a register', 'owned'),
        ],
      },
      {
        say: 'So when the callee writes 99, it writes through the label into `main`\'s object. That is the whole difference: one call mutated a copy nobody kept, the other mutated the real thing.',
        mark: ['7', '17'],
        focus: ['caller', 'ref', 'cost'],
        shapes: () => [
          Region({ key: 'r', x: 40, y: 50, w: 640, h: 320, label: 'THE STACK', tone: 'stack' }),
          caller('99.0'),
          Box({
            key: 'callee',
            x: CALLEE_X,
            y: CALLEE_Y,
            w: FW,
            h: 52,
            label: 'by_ref(Trade& t)',
            sub: 't.px = 99.0',
            tone: 'borrowed',
            mono: true,
            labelSize: 12,
          }),
          Arrow({
            key: 'ref',
            from: [CALLEE_X + 8, CALLEE_Y + 26],
            to: [CALLER_X + FW + 4, CALLER_Y + frameH / 2],
            shape: 'curve',
            bend: 52,
            tone: 'owned',
            label: 'writes through',
          }),
          cost('original changed', 'owned'),
        ],
      },
      {
        say: 'Add `const` and the same free access becomes read-only. The callee can look at every byte at zero cost and the compiler guarantees it cannot alter anything. This — `const T&` — is the default you should reach for.',
        mark: ['8', '19'],
        shapes: () => [
          Region({ key: 'r', x: 40, y: 50, w: 640, h: 320, label: 'THE STACK', tone: 'stack' }),
          caller('99.0'),
          Box({
            key: 'callee',
            x: CALLEE_X,
            y: CALLEE_Y,
            w: FW,
            h: 52,
            label: 'by_cref(const Trade& t)',
            sub: 't.px = 0;  // will not compile',
            tone: 'freed',
            mono: true,
            labelSize: 12,
          }),
          Arrow({
            key: 'ref',
            from: [CALLEE_X + 8, CALLEE_Y + 26],
            to: [CALLER_X + FW + 4, CALLER_Y + frameH / 2],
            shape: 'curve',
            bend: 52,
            tone: 'borrowed',
            label: 'read only',
            dashed: true,
          }),
          cost('0 bytes, 0 risk', 'owned'),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'refs.cpp',
    source: `#include <cstdio>
#include <string>

struct Trade { long id; double px; std::string sym; };

void by_value(Trade t)       { t.px = 99.0; }
void by_ref(Trade& t)        { t.px = 99.0; }
void by_cref(const Trade& t) { std::printf("%.1f\\n", t.px); }

int main() {
    Trade t{1, 10.5, "AAPL"};

    by_value(t);
    std::printf("%.1f\\n", t.px);   // 10.5 — the copy was modified

    by_ref(t);
    std::printf("%.1f\\n", t.px);   // 99.0 — the original was modified

    by_cref(t);                     // read-only, still no copy

    int x = 1;
    int& r = x;
    r = 7;                          // writes THROUGH r, into x
    std::printf("%d\\n", x);        // 7
}`,
    annotations: [
      {
        lines: '6',
        text: 'Taking `Trade` by value copies the struct **and** runs `std::string`\'s copy constructor, which allocates. The parameter is a brand-new object.',
      },
      {
        lines: '8',
        text: '`const Trade&` is the default for anything bigger than a couple of registers. Free to pass, impossible to modify by accident.',
      },
      {
        lines: '23',
        text: 'This is the line that catches people. `r = 7` does **not** re-point `r` — it assigns 7 into `x`. References can never be reseated.',
      },
    ],
  },

  deeper: [
    'Under the hood a reference is almost always an address, exactly like a pointer. The difference is entirely in what the language permits: a reference must be initialised at the point of declaration, can never be made to refer to something else, and cannot legally be null. Those restrictions are what let the compiler reason about it more aggressively, and they are why a reference is the right default and a pointer is the exception.',
    'The compiler is also allowed to make the address disappear. For a small function that gets inlined, there is no address and no indirection — the callee\'s parameter simply becomes another name for the caller\'s variable during optimisation. This is why the reference-versus-value question is not about the mechanics at all, it is about how much *copy construction* you asked for.',
    'Passing by value is not automatically worse. For a type that fits in one or two registers — `int`, `double`, `std::string_view`, `std::span` — a reference forces the value out to memory so there is an address to take, and then forces a load on every use. A `const int&` parameter is strictly worse than an `int` one. The rough threshold is around sixteen bytes, and above it, or for anything with a nontrivial copy constructor, `const&` wins.',
    'There is a second, subtler cost to references: aliasing. When a function takes two `const Trade&` parameters, the compiler generally cannot prove they refer to different objects, so a write through one may invalidate a value it had cached from the other. Passing by value eliminates that doubt entirely, which occasionally makes the copying version faster despite the copy. This is the sort of thing you discover with a profiler, never by reasoning.',
    'The one case where taking by value is clearly right for an expensive type is the sink parameter. If a function is going to store a copy anyway, taking the parameter by value lets a caller with a temporary *move* into it for free, while a caller with an lvalue pays exactly the one copy they were always going to pay. `void set(std::string s) { member = std::move(s); }` is the idiom.',
  ],

  gotchas: [
    '`r = y` never rebinds a reference. It assigns `y`\'s value through `r` into whatever `r` already refers to. If you want something you can re-aim, you want a pointer.',
    'Returning a reference to a local is undefined behaviour and will often appear to work, because the stack bytes survive briefly after the frame pops. Returning a reference to a member of `*this` is fine — until someone calls it on a temporary.',
    '`for (auto x : container)` copies every element. The reflex should be `const auto&`, or `auto&` when you intend to modify. On a container of strings this is the difference between zero allocations and one per element.',
    'A `const&` parameter can bind to a temporary and will extend its lifetime to the end of the full expression — but only for the *parameter*. Storing that reference in a member outlives the temporary and dangles.',
  ],

  interview: {
    q: 'When would you pass by value instead of by `const&`?',
    a: [
      'The default is `const&` for anything larger than about two registers or with a nontrivial copy constructor. But there are three cases where by value is right. First, small trivially-copyable types — `int`, `double`, `std::string_view`, `std::span`. These travel in registers, and taking them by reference forces the value into memory so there is an address to pass, then adds a load at every use. `const int&` is strictly worse than `int`.',
      'Second, the sink parameter. If the function is going to keep a copy regardless, taking the argument by value and then moving from it means a caller holding a temporary pays nothing extra, while a caller holding an lvalue pays exactly the one copy that was always required. Taking `const&` and copying inside forces that copy on everyone.',
      'Third — and this is the one that separates a memorised answer — aliasing. With reference parameters the compiler usually cannot prove two of them do not refer to the same object, so it must reload after every write through either. A by-value parameter is provably independent, which sometimes lets the optimiser keep it in a register across a loop and win back more than the copy cost. I would not guess at that one though; I would measure it, because which way it falls depends on the function.',
    ],
  },

  exercise: [
    'Write a `struct Big` containing a 1 KB array and a `std::string`, then time ten million calls each through by-value, `&` and `const&` using `std::chrono::steady_clock`. Confirm the gap, then shrink `Big` down to a single `int` and re-run — find the size at which by-value stops losing, and explain the crossover using the calling convention.',
    'Then compile both versions on [Compiler Explorer](https://godbolt.org) at `-O2` and read the generated assembly. For the small type you should see the by-value version passing in a register while the `const&` version passes an address and dereferences it. Being able to point at that in the disassembly is worth more in an interview than being able to quote the rule.',
  ],
};
