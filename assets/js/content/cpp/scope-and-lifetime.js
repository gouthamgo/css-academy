import { Box, Text, Arrow, Tag, Bracket } from '../../viz/primitives.js';

/* Program timeline. x is time, left to right. */
const T0 = 92;   // before main
const T1 = 214;  // demo() call 1
const T2 = 336;  // demo() call 2
const T3 = 458;  // demo() call 3
const TE = 632;  // exit
const CALL_W = 62;

const ROW = { global: 104, staticN: 156, local: 208, scope: 268 };

const axis = () => [
  Arrow({
    key: 'axis',
    from: [72, 322],
    to: [660, 322],
    shape: 'straight',
    bend: 0,
    tone: 'neutral',
    label: 'program execution',
  }),
  ...[
    [T0, 'start'],
    [T1, 'demo() 1'],
    [T2, 'demo() 2'],
    [T3, 'demo() 3'],
    [TE, 'exit'],
  ].map(([x, t], i) =>
    Text({
      key: `t${i}`,
      x,
      y: 340,
      text: t,
      size: 10,
      anchor: 'middle',
      mono: true,
      opacity: 0.6,
    })
  ),
];

const bar = (key, x, w, y, label, tone, dashed = false) =>
  Box({
    key,
    x,
    y,
    w,
    h: 26,
    label,
    tone,
    dashed,
    mono: true,
    labelSize: 11,
  });

const rowLabel = (key, y, text, tone = 'neutral') =>
  Text({ key, x: 68, y: y + 13, text, size: 11, anchor: 'end', mono: true, tone, opacity: 0.85 });

export default {
  oneLiner:
    'Three separate questions that beginners fuse into one — and the keyword that answers a different one depending on where you write it.',

  whyJob:
    'The static initialization order fiasco and accidental hidden global state are recurring causes of production incidents in large C++ codebases, and a function-local `static` on a hot path costs a guard check on every single call.',

  mentalModel:
    'Every declaration gets asked three independent questions, and people collapse them into one. *Scope* is which lines can spell the name. *Storage duration* is when the object is born and when it dies. *Linkage* is whether another translation unit can find the symbol. A variable can be nameable in three lines of code and still live for the entire program — which is exactly what a function-local `static` is.',

  scene: {
    id: 'scope-vs-lifetime',
    title: 'Lifetime is not scope',
    width: 720,
    height: 380,
    legend: [
      { tone: 'stack', label: 'automatic — dies at the brace' },
      { tone: 'owned', label: 'static — lives to program exit' },
      { tone: 'highlight', label: 'where the name is spellable' },
    ],
    steps: [
      {
        say: 'Time runs left to right: the program starts, calls `demo()` three times, and exits. Every declaration in the file gets a bar somewhere on this chart.',
        mark: [],
        shapes: () => [...axis()],
      },
      {
        say: 'The two file-scope variables are already constructed before `main` even begins, and they survive until the program ends. Nothing you write inside a function affects them.',
        mark: ['3-4'],
        shapes: () => [
          ...axis(),
          rowLabel('lg', ROW.global, 'g_external, g_internal'),
          bar('g', T0, TE - T0, ROW.global, 'static storage duration — whole program', 'owned'),
        ],
      },
      {
        say: 'The first call to `demo()` creates `local`. It is born at the opening brace and destroyed at the closing one, and its storage is the frame you saw two lessons ago.',
        mark: ['12'],
        focus: ['l1', 'll'],
        shapes: () => [
          ...axis(),
          rowLabel('lg', ROW.global, 'g_external, g_internal'),
          bar('g', T0, TE - T0, ROW.global, 'static storage duration — whole program', 'owned'),
          rowLabel('ll', ROW.local, 'local'),
          bar('l1', T1, CALL_W, ROW.local, 'born, dies', 'stack'),
        ],
      },
      {
        say: 'The second call creates a *different* `local`. It happens to reuse the same address, which is why it always prints 1 — it is not the same variable remembering nothing, it is a brand-new variable each time.',
        mark: ['12-13', '19'],
        focus: ['l1', 'l2', 'll'],
        shapes: () => [
          ...axis(),
          rowLabel('lg', ROW.global, 'g_external, g_internal'),
          bar('g', T0, TE - T0, ROW.global, 'static storage duration — whole program', 'owned'),
          rowLabel('ll', ROW.local, 'local'),
          bar('l1', T1, CALL_W, ROW.local, 'born, dies', 'stack'),
          bar('l2', T2, CALL_W, ROW.local, 'born, dies', 'stack'),
        ],
      },
      {
        say: 'Now the interesting one. `counter()` has a `static int n` inside it. It is constructed on the *first* call — not before `main` — and from then on it persists across every later call, which is why it counts 1, 2, 3.',
        mark: ['7'],
        focus: ['sn', 'ls'],
        shapes: () => [
          ...axis(),
          rowLabel('lg', ROW.global, 'g_external, g_internal'),
          bar('g', T0, TE - T0, ROW.global, 'static storage duration — whole program', 'owned'),
          rowLabel('ls', ROW.staticN, 'n (static, inside counter)'),
          bar('sn', T1, TE - T1, ROW.staticN, 'constructed on first call, then persists', 'owned'),
          rowLabel('ll', ROW.local, 'local'),
          bar('l1', T1, CALL_W, ROW.local, 'born, dies', 'stack'),
          bar('l2', T2, CALL_W, ROW.local, 'born, dies', 'stack'),
          bar('l3', T3, CALL_W, ROW.local, 'born, dies', 'stack'),
        ],
      },
      {
        say: 'So `n` lives almost as long as the program does.',
        mark: ['6-9'],
        predict: {
          ask: 'From how much of the program can you write the name `n`?',
          options: [
            { label: 'Anywhere after line 7 — it has static duration', correct: false },
            { label: 'Only inside `counter()`', correct: true },
            { label: 'Anywhere in this file, but not other files', correct: false },
          ],
          because:
            'Lifetime and scope are answering different questions. `n` lives until the program exits, but its name is only spellable inside the function that declares it. That gap is the whole point of the lesson.',
        },
        shapes: () => [
          ...axis(),
          rowLabel('lg', ROW.global, 'g_external, g_internal'),
          bar('g', T0, TE - T0, ROW.global, 'static storage duration — whole program', 'owned'),
          rowLabel('ls', ROW.staticN, 'n (static, inside counter)'),
          bar('sn', T1, TE - T1, ROW.staticN, 'constructed on first call, then persists', 'owned'),
          rowLabel('ll', ROW.local, 'local'),
          bar('l1', T1, CALL_W, ROW.local, 'born, dies', 'stack'),
          bar('l2', T2, CALL_W, ROW.local, 'born, dies', 'stack'),
          bar('l3', T3, CALL_W, ROW.local, 'born, dies', 'stack'),
        ],
      },
      {
        say: 'A long life and a tiny name. That combination is exactly what makes the function-local static the standard fix for the initialization order problem: it is global state that nothing else can reach, constructed lazily and — since C++11 — safely even under threads.',
        mark: ['7'],
        focus: ['sn', 'vis', 'vist'],
        shapes: () => [
          ...axis(),
          rowLabel('lg', ROW.global, 'g_external, g_internal'),
          bar('g', T0, TE - T0, ROW.global, 'static storage duration — whole program', 'owned'),
          rowLabel('ls', ROW.staticN, 'n — lifetime'),
          bar('sn', T1, TE - T1, ROW.staticN, 'constructed on first call, then persists', 'owned'),
          rowLabel('ll', ROW.local, 'local'),
          bar('l1', T1, CALL_W, ROW.local, 'born, dies', 'stack'),
          bar('l2', T2, CALL_W, ROW.local, 'born, dies', 'stack'),
          bar('l3', T3, CALL_W, ROW.local, 'born, dies', 'stack'),
          rowLabel('vist', ROW.scope, 'n — scope', 'highlight'),
          Bracket({
            key: 'vis',
            x: T1,
            y: ROW.scope + 12,
            w: 96,
            label: 'only inside counter()',
            tone: 'highlight',
            side: 'top',
          }),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'scope.cpp',
    source: `#include <cstdio>

int g_external = 1;            // static duration, external linkage
static int g_internal = 2;     // static duration, INTERNAL linkage

int counter() {
    static int n = 0;          // static duration, LOCAL scope
    return ++n;                // 1, then 2, then 3
}

void demo() {
    int local = 0;             // automatic duration
    ++local;                   // always 1 — reborn every call
    std::printf("local=%d counter=%d\\n", local, counter());
}

int main() {
    demo();
    demo();
    demo();
    std::printf("%d %d\\n", g_external, g_internal);
}`,
    annotations: [
      {
        lines: '4',
        text: '`static` here means **internal linkage** — invisible to other translation units. Nothing to do with lifetime.',
      },
      {
        lines: '7',
        text: '`static` here means **static storage duration** — a completely different meaning of the same keyword. This is the construct-on-first-use idiom.',
      },
      {
        lines: '12-13',
        text: '`local` prints 1 every time. Not because it resets, but because it is a different object on each call.',
      },
    ],
  },

  deeper: [
    'The word `static` has three unrelated meanings depending on where it appears. At file scope it means internal linkage — this symbol is private to the translation unit. Inside a function it means static storage duration — one object, constructed once, living until exit. Inside a class it means one instance shared by all objects of that class. None of these implies the others, and the overload is purely historical.',
    'Namespace-scope objects with dynamic initializers are initialized in an unspecified order *across* translation units. Within a single file it is declaration order, but between files the linker decides, and the order can change when you reorder object files on the link line. If a global in `a.cpp` uses a global in `b.cpp` during its constructor, you may read an object whose storage is zeroed but whose constructor has not run. That is the static initialization order fiasco.',
    'The fix is the construct-on-first-use idiom: wrap the object in a function that returns a reference to a function-local `static`. Because the initialization happens on first call rather than at load time, the dependency order is forced to be correct by the call order. Since C++11 that initialization is also guaranteed thread-safe — the standard requires the implementation to serialise concurrent first calls.',
    'That thread safety is not free. The compiler emits a guard variable and checks it on *every* call, which is an acquire load and a predictable branch. It is cheap, but on a hot path called millions of times per second it is measurable, and it is a reason low-latency code often prefers `constinit` — which guarantees static initialization with no dynamic phase and therefore no guard at all.',
    'In modern C++ prefer an anonymous namespace to file-scope `static`. It achieves the same internal linkage, it works for types and templates as well as variables, and it does not overload a keyword that already means three things.',
  ],

  gotchas: [
    'A function-local `static` is a global variable wearing a disguise. It makes the function non-reentrant and turns it into shared mutable state the moment two threads call it — the *initialization* is thread-safe, subsequent access is not.',
    'The initialization order fiasco can be triggered purely by changing the order of `.o` files on the link line, which means it can appear in CI and not locally, or vice versa.',
    'Locals of built-in type are not zeroed but globals and statics are, so a bug caused by an uninitialized read can vanish when you move the variable to file scope.',
    'Destructors of static objects run in reverse order of construction, *after* `main` returns. Anything that touches other statics during destruction has the same ordering problem in reverse, which is why logging from a static destructor is a classic way to crash at exit.',
  ],

  interview: {
    q: 'What is the static initialization order fiasco, and how do you avoid it?',
    a: [
      'Objects at namespace scope with dynamic initializers are initialized in an unspecified order across translation units. Within one file it is declaration order, but between files the standard says nothing. So if a global in one file uses a global from another during its constructor, you may be reading an object that has had its storage zeroed but whose constructor has not yet run. The failure is order-dependent, so it can appear or disappear when you reorder object files on the link line.',
      'The standard fix is construct-on-first-use: replace the global with a function that returns a reference to a function-local `static`. Initialization then happens on first call, so the call order forces the correct dependency order, and since C++11 that first-call initialization is guaranteed thread-safe.',
      'The detail worth adding is that it is not free, and in a latency-sensitive context you might not want it. The thread-safe guarantee is implemented with a guard variable checked on every call. If the object can be initialized at compile time, `constexpr` or `constinit` is strictly better — it removes the dynamic initialization phase entirely, so there is no ordering question and no per-call guard. `constinit` in particular exists to let you say "I want this initialized statically, and I want a compile error if it cannot be", which is exactly the guarantee you want for a lookup table on a hot path.',
    ],
  },

  exercise: [
    'Build a two-translation-unit program that reproduces the fiasco: a global object in `a.cpp` whose constructor reads a global in `b.cpp`. Get it to print the wrong answer by changing *only* the order of the `.o` files passed to the linker. Watching a link-order change alter your program\'s output is the kind of thing you only need to see once.',
    'Then fix it twice — first with the Meyers singleton, then with `constinit` — and compare the generated assembly for the access path on [Compiler Explorer](https://godbolt.org). You should be able to see the guard variable check in one version and its complete absence in the other.',
  ],
};
