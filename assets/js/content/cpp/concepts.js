import { Box, Arrow, Text, Tag } from '../../viz/primitives.js';

/* ------------------------------------------------------------------
   Part 1: the waterfall. Five frames, each one instantiated only
   because the frame above it needed it, cascading down and to the
   right toward a header you never opened. Same keys reappear in the
   "gate" steps are intentionally NOT reused — it is a different world.
   ------------------------------------------------------------------ */
const frame = (key, x, y, w, text, tone = 'owned', labelSize = 10) =>
  Box({ key, x, y, w, h: 40, label: text, tone, mono: true, labelSize });

export default {
  oneLiner:
    'Why an unconstrained template fails three headers deep inside someone else\'s code, and how a `requires` clause moves that failure back to your own call site.',

  whyJob:
    'Concepts are what a modern trading or ML-infra C++ codebase actually ships with, and interviewers use them to see whether you can write a `requires` clause from scratch — not just say the word "concepts" — and whether you know that subsumption, not overload count, is what lets two constrained templates coexist without the ambiguity tricks `enable_if` needed.',

  mentalModel:
    'An unconstrained template is a *door with no sign on it*: anyone can walk in, and only three rooms deep does someone finally check whether they were allowed to be there, then throws them out from wherever they happen to be standing. A concept is a *sign on the door itself*, read before you are let in — if you do not qualify, you find out on the doorstep, not in the basement.',

  scene: {
    id: 'concepts-gate',
    title: 'Where the error is found, and how far you have to walk to fix it',
    width: 720,
    height: 420,
    legend: [
      { tone: 'owned', label: 'an instantiation frame — real code, just generated' },
      { tone: 'highlight', label: 'a requirement, checked before the call is even accepted' },
      { tone: 'freed', label: 'where the compiler actually stops' },
    ],
    steps: [
      {
        say: '`Order` has no `operator<`. `run_backtest_unchecked` is an ordinary, unconstrained template — nothing about its declaration says it needs one.',
        mark: ['6', '10-13'],
        shapes: () => [
          Box({ key: 'orderdef', x: 40, y: 30, w: 260, h: 44, label: 'struct Order { double price; int qty; };', sub: 'no operator<', tone: 'freed', mono: true, labelSize: 9.5 }),
          Box({ key: 'tmpldef', x: 340, y: 30, w: 340, h: 60, label: 'template<class T>\nvoid run_backtest_unchecked(vector<T>&)', sub: 'unconstrained — takes anything', tone: 'highlight', dashed: true, mono: true, labelSize: 8.5 }),
          Box({ key: 'call', x: 40, y: 130, w: 300, h: 40, label: 'run_backtest_unchecked(orders);', sub: 'your code, your line number', tone: 'owned', mono: true, labelSize: 9.5 }),
        ],
      },
      {
        say: 'The call is accepted immediately — a template only needs a plausible argument list to be instantiated, not a correct body. `run_backtest<Order>` gets stamped out, and it in turn calls `std::sort`.',
        mark: ['12'],
        shapes: () => [
          frame('f1', 40, 40, 280, 'main.cpp: run_backtest_unchecked(orders)', 'owned', 9),
          Arrow({ key: 'a1', from: [170, 80], to: [230, 100], shape: 'straight', bend: 0, tone: 'neutral', label: 'required from here' }),
          frame('f2', 130, 100, 320, 'run_backtest_unchecked<Order>() — backtest.hpp', 'owned', 8.5),
          Arrow({ key: 'a2', from: [280, 140], to: [340, 160], shape: 'straight', bend: 0, tone: 'neutral' }),
          frame('f3', 210, 160, 320, 'std::sort(...) — <bits/stl_algo.h>', 'owned', 9.5),
        ],
      },
      {
        say: '`std::sort` calls its own internal loop, which calls a comparator, which finally writes down `a < b` in your `Order` objects — and that is the line that actually fails. Everything above it is real, correctly-generated code that only exists because this one call happened.',
        mark: [],
        focus: ['f1', 'f2', 'f3', 'f4', 'f5', 'ferr', 'yourbug', 'reported'],
        predict: {
          ask: 'The compiler prints its error attached to the bottom frame, inside `<bits/predefined_ops.h>`. Where is the bug actually located?',
          options: [
            { label: 'Inside predefined_ops.h — that header needs fixing', correct: false },
            { label: 'Inside std::sort\'s implementation — it should check its arguments', correct: false },
            { label: 'At your own call site — Order is simply missing operator<, and every frame above it is innocent', correct: true },
          ],
          because:
            'Every one of those frames is correct, library-quality code doing exactly what it was written to do. The single fact that makes the whole cascade fail is one line you wrote: `Order` has no `operator<`. The compiler cannot say that directly, because two-phase lookup means `a < b` was never checked until this exact instantiation forced it to be — so the diagnosis is real, but it is filed under the last place the mismatch was noticed, not the first.',
        },
        shapes: () => [
          frame('f1', 40, 40, 280, 'main.cpp: run_backtest_unchecked(orders)', 'owned', 9),
          Arrow({ key: 'a1', from: [170, 80], to: [230, 100], shape: 'straight', bend: 0, tone: 'neutral' }),
          frame('f2', 130, 100, 320, 'run_backtest_unchecked<Order>() — backtest.hpp', 'owned', 8.5),
          Arrow({ key: 'a2', from: [280, 140], to: [340, 160], shape: 'straight', bend: 0, tone: 'neutral' }),
          frame('f3', 210, 160, 320, 'std::sort(...) — <bits/stl_algo.h>', 'owned', 9.5),
          Arrow({ key: 'a3', from: [370, 200], to: [420, 220], shape: 'straight', bend: 0, tone: 'neutral' }),
          frame('f4', 280, 220, 340, '__introsort_loop<...> — <bits/stl_algo.h>', 'owned', 9),
          Arrow({ key: 'a4', from: [450, 260], to: [500, 280], shape: 'straight', bend: 0, tone: 'freed' }),
          frame('f5', 350, 280, 340, '_Iter_less_iter::operator() — predefined_ops.h', 'owned', 8.5),
          Arrow({ key: 'a5', from: [520, 320], to: [520, 340], shape: 'straight', bend: 0, tone: 'freed', thick: true }),
          Box({ key: 'ferr', x: 380, y: 340, w: 300, h: 56, label: "error: no match for 'operator<'", sub: '(Order, Order) — five frames from your line', tone: 'freed', mono: true, labelSize: 10 }),
          Tag({ key: 'yourbug', x: 40, y: 90, text: 'the bug is here', tone: 'freed' }),
          Tag({ key: 'reported', x: 500, y: 386, text: 'reported here', tone: 'freed' }),
        ],
      },
      {
        say: 'Same problem, stated as a requirement instead of discovered by accident. `Sortable` names one expression the compiler can check against `Order` immediately, with nothing instantiated yet.',
        mark: ['16-19', '22-25'],
        shapes: () => [
          Box({ key: 'gate', x: 190, y: 60, w: 340, h: 110, label: 'template<Sortable T>\nvoid run_backtest(vector<T>&)', sub: 'checked before a single line of the body runs', tone: 'highlight', dashed: true, mono: true, labelSize: 10 }),
          Text({ key: 'chk', x: 360, y: 150, text: 'requires(a, b) { { a < b } -> convertible_to<bool>; }', size: 9.5, anchor: 'middle', mono: true, opacity: 0.8 }),
          Box({ key: 'call2', x: 20, y: 90, w: 150, h: 40, label: 'run_backtest(orders)', tone: 'owned', mono: true, labelSize: 8.5 }),
          Arrow({ key: 'try', from: [170, 110], to: [190, 115], shape: 'straight', bend: 0, tone: 'freed', thick: true }),
          Tag({ key: 'fail', x: 540, y: 95, text: '✗ no operator<', tone: 'freed' }),
          Box({ key: 'err2', x: 190, y: 280, w: 340, h: 66, label: 'error: constraints not satisfied', sub: 'required expression \'a < b\' is invalid — main.cpp, your line', tone: 'freed', mono: true, labelSize: 9.5 }),
          Arrow({ key: 'stop', from: [360, 170], to: [360, 280], shape: 'straight', bend: 0, tone: 'freed' }),
        ],
      },
      {
        say: 'A second, stricter concept can sit right next to the first. `FastSortable` is built as `Sortable<T> && is_trivially_copyable_v<T>` — because it is spelled as that conjunction, the compiler can prove it always implies `Sortable`, and picks it automatically whenever both match. No ambiguity, no `enable_if` priority trick.',
        mark: ['28-35'],
        shapes: () => [
          Box({ key: 'gateA', x: 30, y: 70, w: 280, h: 90, label: 'template<Sortable T>\nvoid report(vector<T>&)', sub: 'matches int — general', tone: 'owned', mono: true, labelSize: 9.5 }),
          Box({ key: 'gateB', x: 400, y: 70, w: 290, h: 90, label: 'template<FastSortable T>\nvoid report(vector<T>&)', sub: 'also matches int — more specific', tone: 'highlight', mono: true, labelSize: 9.5 }),
          Box({ key: 'call3', x: 260, y: 200, w: 200, h: 40, label: 'report(nums);', sub: 'nums is vector<int>', tone: 'owned', mono: true, labelSize: 11 }),
          Arrow({ key: 'toA', from: [280, 200], to: [170, 160], shape: 'curve', bend: -10, tone: 'neutral', dashed: true, label: 'viable' }),
          Arrow({ key: 'toB', from: [420, 200], to: [545, 160], shape: 'curve', bend: 10, tone: 'hit', thick: true, label: 'chosen — subsumes Sortable' }),
          Text({ key: 'why', x: 360, y: 290, text: 'FastSortable is a conjunction — the compiler can prove it implies Sortable', size: 11, anchor: 'middle', tone: 'hit', opacity: 0.9 }),
        ],
      },
      {
        say: 'Two different failures, same missing `operator<`. One names five frames of someone else\'s code before it tells you anything; the other stops at your own line, on the exact expression it could not find.',
        mark: [],
        shapes: () => [
          Box({ key: 'old', x: 40, y: 120, w: 280, h: 100, label: 'unconstrained template', sub: 'error 5 frames deep, in a header you never opened', tone: 'freed', labelSize: 12.5 }),
          Box({ key: 'new', x: 400, y: 120, w: 280, h: 100, label: 'requires Sortable<T>', sub: 'error on your own line, naming your own expression', tone: 'hit', labelSize: 12.5 }),
          Text({ key: 'closing', x: 360, y: 260, text: 'the requirement did not change what compiles — only where the compiler tells you it does not', size: 12, anchor: 'middle', opacity: 0.85 }),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'concepts.cpp',
    source: `#include <algorithm>
#include <concepts>
#include <type_traits>
#include <vector>

struct Order { double price; int qty; };   // no operator< — on purpose

// Unconstrained: the call is accepted, and std::sort discovers the
// missing operator< three frames into <bits/stl_algo.h>.
template <class T>
void run_backtest_unchecked(std::vector<T>& orders) {
    std::sort(orders.begin(), orders.end());
}

// A concept: one named, checkable expression.
template <class T>
concept Sortable = requires(const T& a, const T& b) {
    { a < b } -> std::convertible_to<bool>;
};

// Constrained: the same requirement now lives in the signature itself.
template <Sortable T>
void run_backtest(std::vector<T>& orders) {
    std::sort(orders.begin(), orders.end());
}

// A stricter concept, built as a conjunction, subsumes Sortable.
template <class T>
concept FastSortable = Sortable<T> && std::is_trivially_copyable_v<T>;

template <Sortable T>
void report(std::vector<T>&) { /* general path */ }

template <FastSortable T>
void report(std::vector<T>&) { /* preferred — no ambiguity */ }

int main() {
    std::vector<int> nums{3, 1, 2};
    run_backtest(nums);   // int has operator< — compiles
    report(nums);         // both overloads viable; FastSortable wins
    std::vector<Order> orders;
    // run_backtest(orders);            // fails AT THIS LINE
    // run_backtest_unchecked(orders);  // fails deep inside <bits/stl_algo.h>
    return 0;
}`,
    annotations: [
      {
        lines: '6',
        text: '`Order` is deliberately missing `operator<`. Nothing here is wrong C++ — a type is not required to be ordered.',
      },
      {
        lines: '10-13',
        text: 'This template will accept any `T`. The compiler cannot object here, because nothing in the signature says what `T` must support.',
      },
      {
        lines: '16-19',
        text: 'A `requires`-expression is itself a compile-time boolean: it asks "does this compile", not "run this". `{ a < b } -> convertible_to<bool>` additionally checks the *result type* of `a < b`, not merely that it compiles.',
      },
      {
        lines: '28-29',
        text: '`FastSortable` is written as `Sortable<T> && ...` — because that conjunction is visible in the source, the compiler can prove it implies `Sortable<T>` and use that proof to pick between the two `report` overloads.',
      },
    ],
  },

  deeper: [
    'A `requires`-expression (`requires(params) { ... }`) and a `requires`-clause (`template<class T> requires Expr` or `template<Concept T>`) are two different pieces of grammar that happen to share a keyword. The expression form is evaluated once, at compile time, to a single `bool` — it never runs anything, it only asks "would this compile". The clause form is what actually gates a template: it takes any boolean constant expression, commonly (but not only) a call to a concept or a `requires`-expression, and refuses the template if it evaluates to `false`. Writing `requires requires { ... }` — a clause wrapping an expression — is normal and correct; writing just `requires { ... }` where a clause was needed is a common typo that silently compiles into a constant-`true` clause and constrains nothing.',
    'A `requires`-expression supports more than the simple-requirement (`a < b;`, just "this compiles") used above. A type-requirement (`typename T::value_type;`) checks that a nested type exists. A compound-requirement (`{ a < b } -> std::convertible_to<bool>;`) checks both that the expression compiles and that its result satisfies a second concept. A nested-requirement (`requires std::same_as<decltype(a), decltype(b)>;`) lets one requires-expression invoke another constraint directly. Reaching for compound-requirements over simple ones is usually worth it: `{ a < b } -> std::convertible_to<bool>;` rejects an overloaded `operator<` that compiles but returns something nonsensical, which a bare `a < b;` would happily accept.',
    'Subsumption is a *syntactic* relationship, not a logical one, and that distinction is the part experienced C++ programmers still get wrong. The compiler normalises every constraint into a tree of conjunctions and disjunctions of atomic constraints, then checks whether one constraint\'s tree contains the other\'s as a sub-tree. `FastSortable = Sortable<T> && Trivial<T>` visibly contains `Sortable<T>`, so it subsumes it. But `concept A = X && Y;` and `concept B = Y && X;` do **not** subsume each other, even though they are logically identical, because the compiler compares syntax trees, not truth tables. Two overloads constrained by `A` and `B` respectively are genuinely ambiguous, and the fix is to define one concept in terms of the other rather than duplicating the expression.',
    'Concepts constrain which template is chosen; they do not replace two-phase lookup inside the body. A function template can satisfy its `requires` clause completely and still fail to compile once instantiated, if the body uses an expression the concept never checked. `Sortable<T>` only promises `a < b`, so a `run_backtest` body that also called `a.serialize()` would still produce an old-style, multi-frame error the moment `T` lacked that method — concepts move the errors you thought to name, not every error.',
    'Concepts were built specifically to replace `std::enable_if` and manual SFINAE, and the improvement is not only cosmetic. `enable_if`-based overloads are ordered by which template argument substitution happens to fail first, which is fragile and produces error messages about substitution failure deep inside `<type_traits>`. Concepts are checked directly, produce a diagnosis phrased in terms of the concept\'s own name ("constraints not satisfied: Sortable<Order>"), and — via subsumption — give the compiler an actual, provable ordering between overloads instead of relying on which SFINAE trick happened to fail last.',
  ],

  gotchas: [
    'A bare `requires { a < b; }` used where a `requires`-*clause* was intended (as opposed to a `requires requires { ... }`) compiles to a constant, always-`true` expression — the template accepts everything and the constraint silently does nothing.',
    'Subsumption is syntactic. Two concepts that are logically equivalent but spelled differently do not subsume each other, and overloads constrained by each will be ambiguous even though a human reading them can see they mean the same thing.',
    'Satisfying a concept is necessary, not sufficient. The function body can still fail to compile on an expression the concept never mentioned — a passing constraint check is not a promise that the whole function works for that type.',
    'A concept-constrained parameter written with `auto` (`void f(Sortable auto& x)`) is an abbreviated function template, and it is easy to forget that it is a template at all — including forgetting that it gets a fresh instantiation, and a fresh set of "which overload is more specialised" questions, per call.',
    'Constraining a class template\'s member functions individually, rather than the class template itself, means different members can be enabled or disabled per specialization — powerful, but it means `sizeof` and overload resolution can see a different set of valid operations depending on what `T` actually is, which is easy to lose track of in a large class.',
  ],

  interview: {
    q: 'Write a concept that requires a type support both `<` and `==` with `bool`-convertible results, and explain why the compiler can reject a call to a function constrained by it before generating any code for that function.',
    a: [
      '`template<class T> concept Comparable = requires(const T& a, const T& b) { { a < b } -> std::convertible_to<bool>; { a == b } -> std::convertible_to<bool>; };` — two compound-requirements inside one requires-expression, each checking both that the expression compiles and that its result is usable as a `bool`.',
      'The reason this can be checked before instantiation is that a concept is evaluated with the template parameter still abstract: the compiler substitutes the candidate type into the requires-expression alone, as a self-contained check, completely separately from compiling the function body. That is a much smaller, cheaper substitution than instantiating the whole function, and it is checked at overload resolution time — the same moment the compiler is already deciding whether this function is even a candidate for the call — rather than later, when the body is actually generated.',
      'What I would add to show this is understood, not memorised: a concept is a necessary condition, not a full contract. `Comparable<Order>` passing tells you `Order` supports `<` and `==` with sane result types; it says nothing about whether those operators are *consistent* with each other, or whether the function body needs some third operation the concept never checked. Concepts move the class of "wrong type" errors earlier and make them legible — they do not make the function\'s correctness provable for that type.',
    ],
  },

  exercise: [
    'Compile the code above twice: once with `run_backtest(orders)` uncommented, once with `run_backtest_unchecked(orders)` uncommented instead. Scroll each error to the very top and compare — the constrained version should name your own line and the word `Sortable`; the unconstrained version should end inside a header path containing `bits/`. Count how many "required from" lines the second one prints.',
    'Then define a second concept that is logically identical to `Sortable` but spelled differently — `concept SortableAgain = requires(const T& a, const T& b) { requires std::convertible_to<decltype(a < b), bool>; };` — and add a third `report` overload constrained by it alongside the existing two. Call `report` on an `int` vector and read the ambiguity error. That error is subsumption\'s syntactic rule made visible: two constraints a human would call "the same" are not the same constraint to the compiler.',
  ],
};
