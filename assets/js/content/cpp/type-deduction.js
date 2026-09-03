import { Box, Arrow, Text, Tag } from '../../viz/primitives.js';

/* ------------------------------------------------------------------
   Part 1: the deduction machine. One source, three declarations
   fed the same const std::string&. Columns reveal left to right so
   the comparison — copy vs. bind vs. bind — reads as one picture.
   ------------------------------------------------------------------ */
const source = () =>
  Box({
    key: 'src',
    x: 260,
    y: 16,
    w: 200,
    h: 46,
    label: 'const std::string& peek_name()',
    sub: 'returns a reference to an existing "Alice Johnson"',
    tone: 'owned',
    mono: true,
    labelSize: 10,
  });

const decl = (key, x, w, text) =>
  Box({ key, x, y: 96, w, h: 40, label: text, tone: 'highlight', dashed: true, mono: true, labelSize: 10 });

const declarations = () => [
  decl('declA', 16, 180, 'auto a = peek_name();'),
  decl('declB', 270, 180, 'auto& b = peek_name();'),
  decl('declC', 470, 234, 'decltype(auto) c = peek_name();'),
];

const unresolved = (key, x, w) =>
  Tag({ key, x: x + w / 2 - 12, y: 220, text: '?', tone: 'neutral', w: 24 });

export default {
  oneLiner:
    'Why `auto` silently copies when you meant to bind, what a forwarding reference actually forwards, and why the fix at the call site is `std::forward` and never `std::move`.',

  whyJob:
    'This is how an interviewer tells apart someone who has memorised "auto deduces the type" from someone who knows it deduces the type *as if passed by value*. The forwarding half is tested directly by asking why a generic wrapper function calls `std::forward` and not `std::move` — get it backwards and you ship a use-after-move bug that only shows up when the caller passes an lvalue.',

  mentalModel:
    '`auto` is a *copy machine* by default: it asks "what brand-new object should live here", not "what does this expression already refer to". `auto&` and `decltype(auto)` ask the second question instead, which is why neither one allocates. Inside a generic function, a parameter named `x` is a *name tag that always says "I am an lvalue"* to anyone who asks — no matter what it is bound to — and `std::forward` is the one call allowed to correct it, exactly once, using what the compiler already worked out at the call site.',

  scene: {
    id: 'deduction-and-forwarding',
    title: 'What auto keeps, what it drops, and what forward restores',
    width: 720,
    height: 420,
    legend: [
      { tone: 'highlight', label: 'a declaration — the question being asked' },
      { tone: 'hit', label: 'binds — no new object' },
      { tone: 'freed', label: 'copies, or costs a copy it did not need to' },
    ],
    steps: [
      {
        say: 'One function, `peek_name()`, hands back a reference to a string that already exists. Three declarations are about to ask three slightly different questions of that same return value.',
        mark: ['7-10'],
        shapes: () => [source(), ...declarations()],
      },
      {
        say: 'Each declaration deduces its own type from the identical expression on the right. Two of the three end up as `const std::string&`. Only one allocates.',
        mark: ['22-24'],
        predict: {
          ask: 'Which of `a`, `b`, `c` ends up as a brand-new, heap-allocated `std::string`?',
          options: [
            { label: '`a` — plain `auto` strips the reference and the const', correct: true },
            { label: '`b` — `auto&` still copies, the `&` just names the copy', correct: false },
            { label: '`c` — `decltype(auto)` always deduces by value', correct: false },
          ],
          because:
            '`auto` deduces exactly the way a template parameter deduces for a *by-value* function parameter: top-level const and references are both stripped, so `a` is a fresh `std::string`. `auto&` deduces the way `T&` deduces — cv-qualifiers survive — so `b` becomes `const std::string&`. `decltype(auto)` does not use auto\'s rules at all; it applies `decltype` to the initializer expression, and a function call returning `const std::string&` is itself an lvalue expression of that same reference type, so `c` matches `b` exactly.',
        },
        shapes: () => [
          source(),
          ...declarations(),
          unresolved('qA', 16, 180),
          unresolved('qB', 270, 180),
          unresolved('qC', 470, 234),
        ],
      },
      {
        say: '`a` is deduced as if `peek_name()`\'s result were handed to a function taking `std::string` by value — the reference and the const both disappear, and disappearing them is what forces the copy.',
        mark: ['22'],
        shapes: () => [
          source(),
          ...declarations(),
          Arrow({ key: 'arrA', from: [110, 62], to: [110, 96], shape: 'straight', bend: 0, tone: 'freed', label: 'copy' }),
          Box({ key: 'resA', x: 16, y: 214, w: 180, h: 52, label: 'a : std::string', sub: 'a brand-new object', tone: 'freed', mono: true, labelSize: 11 }),
          Tag({ key: 'heapA', x: 16, y: 276, text: 'heap allocation — a copy nothing asked for', tone: 'freed' }),
          unresolved('qB', 270, 180),
          unresolved('qC', 470, 234),
        ],
      },
      {
        say: '`b` deduces `auto` as `const std::string` and then adds the `&` you wrote — so the const you get to keep is the very thing plain `auto` would have thrown away.',
        mark: ['23'],
        shapes: () => [
          source(),
          ...declarations(),
          Arrow({ key: 'arrA', from: [110, 62], to: [110, 96], shape: 'straight', bend: 0, tone: 'freed', label: 'copy' }),
          Box({ key: 'resA', x: 16, y: 214, w: 180, h: 52, label: 'a : std::string', sub: 'a brand-new object', tone: 'freed', mono: true, labelSize: 11 }),
          Tag({ key: 'heapA', x: 16, y: 276, text: 'heap allocation — a copy nothing asked for', tone: 'freed' }),
          Arrow({ key: 'arrB', from: [340, 62], to: [340, 214], shape: 'curve', bend: 30, tone: 'hit', label: 'binds' }),
          Box({ key: 'resB', x: 270, y: 214, w: 180, h: 44, label: 'b : const std::string&', sub: 'the same object', tone: 'hit', mono: true, labelSize: 9.5 }),
          unresolved('qC', 470, 234),
        ],
      },
      {
        say: '`decltype(auto)` never asks "what new object" at all — it looks at the expression `peek_name()`, sees an lvalue of type `const std::string&`, and reproduces that type exactly. `b` and `c` are not similar by coincidence; they are two different roads to the same rule.',
        mark: ['24'],
        shapes: () => [
          source(),
          ...declarations(),
          Arrow({ key: 'arrA', from: [110, 62], to: [110, 96], shape: 'straight', bend: 0, tone: 'freed', label: 'copy' }),
          Box({ key: 'resA', x: 16, y: 214, w: 180, h: 52, label: 'a : std::string', sub: 'a brand-new object', tone: 'freed', mono: true, labelSize: 11 }),
          Tag({ key: 'heapA', x: 16, y: 276, text: 'heap allocation — a copy nothing asked for', tone: 'freed' }),
          Arrow({ key: 'arrB', from: [340, 62], to: [340, 214], shape: 'curve', bend: 30, tone: 'hit', label: 'binds' }),
          Box({ key: 'resB', x: 270, y: 214, w: 180, h: 44, label: 'b : const std::string&', sub: 'the same object', tone: 'hit', mono: true, labelSize: 9.5 }),
          Arrow({ key: 'arrC', from: [520, 62], to: [560, 214], shape: 'curve', bend: -30, tone: 'hit', label: 'binds' }),
          Box({ key: 'resC', x: 470, y: 214, w: 234, h: 44, label: 'c : const std::string&', sub: 'decltype sees an lvalue expression', tone: 'hit', mono: true, labelSize: 9.5 }),
          Text({ key: 'summary', x: 360, y: 300, text: '`auto` asks what new object to build. `auto&` and `decltype(auto)` ask what the expression already refers to.', size: 11, anchor: 'middle', opacity: 0.85 }),
        ],
      },
      {
        say: 'A different question now: what does the parameter itself look like from inside a generic function. `relay(std::string("Bob"))` passes an rvalue in — but once it has a name, that stops being visible to the code that touches it.',
        mark: ['16', '17'],
        shapes: () => [
          Box({ key: 'wrapperSig', x: 20, y: 30, w: 330, h: 50, label: 'template<class T> void relay(T&& x)', tone: 'highlight', dashed: true, mono: true, labelSize: 10.5 }),
          Box({ key: 'callsite', x: 380, y: 30, w: 320, h: 50, label: 'relay(std::string("Bob"))', sub: 'the argument is an rvalue', tone: 'owned', mono: true, labelSize: 10.5 }),
          Arrow({ key: 'bind', from: [400, 80], to: [340, 130], shape: 'curve', bend: -20, tone: 'owned', label: 'T = std::string' }),
          Box({ key: 'xvar', x: 300, y: 130, w: 120, h: 44, label: 'x', sub: 'T&& x', tone: 'neutral', mono: true, labelSize: 13 }),
          Tag({ key: 'xbadge', x: 440, y: 138, text: 'lvalue — it has a name', tone: 'freed' }),
          Arrow({ key: 'gcall', from: [420, 174], to: [560, 260], shape: 'curve', bend: 30, tone: 'freed', label: 'log_it(x)' }),
          Box({ key: 'gbox', x: 500, y: 260, w: 200, h: 56, label: 'log_it(const string&)', sub: 'copies', tone: 'freed', mono: true, labelSize: 10.5 }),
          Tag({ key: 'costTag', x: 460, y: 328, text: 'heap allocation — unwanted copy', tone: 'freed' }),
        ],
      },
      {
        say: 'Only `std::forward<T>` is told what the compiler already knows: `T` was deduced as `std::string`, not `std::string&`, which is the compiler\'s own record that the original argument was an rvalue. Forward turns that record back into a cast, and the right overload runs.',
        mark: ['18'],
        focus: ['wrapperSig', 'callsite', 'bind', 'xvar', 'xbadge', 'gcall', 'gbox', 'costTag'],
        shapes: () => [
          Box({ key: 'wrapperSig', x: 20, y: 30, w: 330, h: 50, label: 'template<class T> void relay(T&& x)', tone: 'highlight', dashed: true, mono: true, labelSize: 10.5 }),
          Box({ key: 'callsite', x: 380, y: 30, w: 320, h: 50, label: 'relay(std::string("Bob"))', sub: 'the argument is an rvalue', tone: 'owned', mono: true, labelSize: 10.5 }),
          Arrow({ key: 'bind', from: [400, 80], to: [340, 130], shape: 'curve', bend: -20, tone: 'owned', label: 'T = std::string' }),
          Box({ key: 'xvar', x: 300, y: 130, w: 120, h: 44, label: 'x', sub: 'T&& x', tone: 'neutral', mono: true, labelSize: 13 }),
          Tag({ key: 'xbadge', x: 440, y: 138, text: 'rvalue — forward restored it', tone: 'hit' }),
          Arrow({ key: 'gcall', from: [420, 174], to: [560, 260], shape: 'curve', bend: 30, tone: 'hit', label: 'log_it(forward<T>(x))' }),
          Box({ key: 'gbox', x: 500, y: 260, w: 200, h: 56, label: 'log_it(string&&)', sub: 'moves', tone: 'hit', mono: true, labelSize: 10.5 }),
          Tag({ key: 'costTag', x: 460, y: 328, text: 'no allocation — moved instead', tone: 'hit' }),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'deduce.cpp',
    source: `#include <cstdio>
#include <string>
#include <utility>

std::string make_name() { return "Alice Johnson"; }

const std::string& peek_name() {
    static std::string cached = make_name();
    return cached;
}

void log_it(const std::string& s) { std::printf("copy-path: %s\\n", s.c_str()); }
void log_it(std::string&& s)      { std::printf("move-path: %s\\n", s.c_str()); }

template <class T>
void relay(T&& x) {
    log_it(x);                     // x is a name -> always an lvalue here
    log_it(std::forward<T>(x));    // forward restores the original category
}

int main() {
    auto a           = peek_name();  // copies: auto drops the reference
    auto& b          = peek_name();  // binds: reference is preserved
    decltype(auto) c = peek_name();  // binds: decltype(auto) preserves it too

    std::printf("a==b: %s\\n", (a == b) ? "true, but a is a distinct object" : "false");

    relay(std::string("Bob"));       // an rvalue argument
    return 0;
}`,
    annotations: [
      {
        lines: '22',
        text: '`auto` deduces exactly as if `peek_name()`\'s result were passed to a function taking `std::string` by value: the reference and the top-level const both vanish, and `a` is a fresh object.',
      },
      {
        lines: '23-24',
        text: '`auto&` and `decltype(auto)` reach the same answer by different rules — deduction for `T&` preserves cv-qualifiers; `decltype` on a call returning a reference reproduces that reference exactly.',
      },
      {
        lines: '17',
        text: '`x` has a name, so `log_it(x)` sees an lvalue no matter what argument `relay` was called with — the reference-ness in `T&&` is invisible once you refer to `x` by name.',
      },
      {
        lines: '18',
        text: '`std::forward<T>(x)` uses `T` — deduced as plain `std::string`, not `std::string&`, because the caller passed an rvalue — to cast `x` back to an rvalue exactly once, at exactly this call.',
      },
    ],
  },

  deeper: [
    'The rule behind `auto` is not a special case invented for the keyword — it is template argument deduction, reused. `auto x = expr;` deduces exactly as `template<class T> void f(T);` would deduce from `f(expr)`: top-level `const`, `volatile` and reference are all stripped from the initializer\'s type before `T` is chosen. `auto& x = expr;` instead mirrors `f(T&)`, which preserves cv-qualification, and `auto&& x = expr;` mirrors the forwarding-reference case discussed below. Once you see `auto` as "the deduction rules you already know from templates, applied to a variable declaration," every one of its surprises stops being a surprise.',
    '`decltype` runs on a different axis entirely: it does not deduce from a value, it inspects an *expression*. `decltype(x)` where `x` is a plain identifier gives you the declared type of `x`. `decltype((x))` — the same identifier wrapped in an extra pair of parentheses — is a different expression, an lvalue, and decltype gives you `T&` instead. `decltype(auto)` inherits this behaviour wholesale: it decltype\'s the initializer expression itself, so a function call returning `const std::string&` reproduces exactly that reference, while a function call returning `std::string` by value reproduces exactly that value type. It is the one deduction context in the language that never strips anything on your behalf.',
    'A forwarding reference exists in exactly one grammatical position: `T&&` where `T` is deduced *right there*, either a template parameter of the function being called or `auto&&`. Passing an lvalue makes `T` deduce as `U&`; passing an rvalue makes `T` deduce as `U`. Reference collapsing then turns `T&&` into the parameter\'s real type: `U& &&` collapses to `U&`, and `U&&` stays `U&&`. Those two collapsing rules — "any lvalue reference wins" — are the entire mechanism; there is no additional magic inside the compiler for forwarding references beyond ordinary deduction plus ordinary collapsing applied to a case the language happens to make possible.',
    '`std::forward<T>(x)` is a cast, not a function that does work at runtime — it compiles down to nothing but a `static_cast` to `T&&`. Its entire value is that it is handed `T`, the exact deduced type from the call site, so it can reconstruct whichever category the original argument had: `std::forward<U&>(x)` casts to `U&` (an lvalue), `std::forward<U>(x)` casts to `U&&` (an rvalue). `std::move(x)` has no such information — it unconditionally casts to an rvalue reference regardless of what `x` started as, which is exactly correct when you own `x` outright and precisely wrong when `x` might be an lvalue the caller still intends to use.',
    'Named rvalue references being lvalues is not an inconsistency, it is what makes multi-statement functions possible at all. If `x` inside `relay` behaved as an rvalue merely because its *type* was `std::string&&`, then the first statement that touched it could move from it, and every subsequent statement would be operating on a moved-from object without any syntax marking that it happened. Requiring an explicit `std::move` or `std::forward` at each point of use is what keeps "this line consumes the value" a visible, searchable event in the source rather than an invisible consequence of a type annotation two lines up.',
  ],

  gotchas: [
    '`auto x = container[i];` on a proxy-returning `operator[]` — `std::vector<bool>` being the standard example — copies the proxy, not the element. Mutating `x` afterwards may not touch the container at all, and the bug is invisible at the call site.',
    'A range-for without a reference, `for (auto x : big_vector_of_string)`, copies every single element on every iteration. `for (const auto& x : ...)` or `for (auto&& x : ...)` is one character away and easy to forget under deadline pressure.',
    '`decltype(x)` and `decltype((x))` differ on purpose, and `decltype(auto)` inherits the sharp edge: wrapping the initializer in an extra pair of parentheses can silently change a deduced value type into a deduced reference type.',
    'Calling `std::move` instead of `std::forward` inside a forwarding-reference function unconditionally turns every argument into an rvalue — including one the caller passed as an lvalue and still plans to read — which is a legal, silent move-from-under-you.',
    '`T&&` is a forwarding reference only when `T` is deduced directly at that declaration. `typename std::vector<T>::value_type&&`, or any `T&&` where `T` is not itself being deduced right there, is an ordinary rvalue reference — no collapsing, no lvalue-binding, and `std::forward` on it does nothing useful.',
  ],

  interview: {
    q: 'Explain what `template<class T> void f(T&& x)` really is, and why a correct implementation calls `std::forward<T>(x)` rather than `std::move(x)`.',
    a: [
      '`T&&` here is a forwarding reference, not a plain rvalue reference, because `T` is deduced at this exact declaration. If the caller passes an lvalue, `T` deduces as `U&` and reference collapsing (`U& &&` → `U&`) makes the parameter an lvalue reference; if the caller passes an rvalue, `T` deduces as `U` and the parameter stays `U&&`. So `f` can bind to anything, and the compiler has, at the moment of the call, already recorded which case happened — encoded entirely in what `T` was deduced as.',
      'Inside the function body, `x` has a name, and a named entity is always an lvalue expression regardless of its declared reference type. So any direct use of `x` — including passing it to another function — is an lvalue use. `std::forward<T>(x)` is the mechanism that reads back the recording the compiler made during deduction: it casts to `T&&`, which is `U&` when the caller passed an lvalue and `U&&` when the caller passed an rvalue. It reproduces the original category exactly once, exactly here.',
      '`std::move(x)` throws that recording away. It always casts to an rvalue reference, so if a caller passed an lvalue they expected to keep using, the function silently moves from it anyway — legal, and a genuine bug the moment the caller reads that variable again. The rule I would state out loud in an interview: use `std::forward<T>` on a forwarding-reference parameter, and reserve `std::move` for the cases where you have unconditional ownership of the object you are casting, such as a local variable at the end of its scope.',
    ],
  },

  exercise: [
    'Add `static_assert(std::is_same_v<decltype(a), std::string>);`, one for `b` as `const std::string&`, and one for `c` as `const std::string&`, right after the three declarations in the code above. They should all compile silently — if one fails, you have found a case where your mental model of the deduction rule and the compiler\'s disagree, which is worth chasing down before moving on.',
    'Write a tiny type with a constructor, copy constructor and move constructor that each `printf` their own name, then call `relay` on both an lvalue and a temporary of that type. Read the four lines of output in order and match each one to the `log_it(x)` versus `log_it(std::forward<T>(x))` call that produced it — seeing "copy-path" and "move-path" appear on cue is what turns reference collapsing from an abstract rule into something you can watch happen.',
  ],
};
