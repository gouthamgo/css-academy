import { Region, Box, Arrow, Bracket, Text, Tag } from '../../viz/primitives.js';

/* ------------------------------------------------------------------
   The workbench. The stencil sits above; every stamped function lands
   in a fixed slot in the tray below, so the tray filling up *is* the
   code-bloat lesson without a word of narration.
   ------------------------------------------------------------------ */
const BENCH = { x: 24, y: 150, w: 672, h: 250 };
const PLATE_W = 300;
const PLATE_X = 210;
const SLOT_Y = 196;
const SLOT_W = 196;
const SLOT_H = 80;
const SLOT_X = [48, 262, 476];

const plate = (y) =>
  Box({
    key: 'plate',
    x: PLATE_X,
    y,
    w: PLATE_W,
    h: 76,
    label: 'template<class T>  T max_of(T, T)',
    sub: 'a stencil — not code yet',
    tone: 'highlight',
    dashed: true,
    labelSize: 11,
    mono: true,
  });

const bench = () =>
  Region({
    key: 'bench',
    ...BENCH,
    label: 'THE TRAY — one real function per distinct T',
  });

const callsite = (text) =>
  Tag({ key: 'callsite', x: 40, y: 46, text, tone: 'highlight' });

const stampInt = (tone = 'owned') =>
  Box({
    key: 'stamp.int',
    x: SLOT_X[0],
    y: SLOT_Y,
    w: SLOT_W,
    h: SLOT_H,
    label: 'int max_of(int,int)',
    sub: 'real machine code',
    tone,
    labelSize: 11,
    mono: true,
  });

const stampDbl = () =>
  Box({
    key: 'stamp.dbl',
    x: SLOT_X[1],
    y: SLOT_Y,
    w: SLOT_W,
    h: SLOT_H,
    label: 'double max_of(double,double)',
    sub: 'a separate function body',
    tone: 'owned',
    labelSize: 9.5,
    mono: true,
  });

export default {
  oneLiner:
    'What a template actually is — a stencil the compiler stamps out once per set of type arguments, and never before.',

  whyJob:
    'Every container, every algorithm and every allocator you will touch on a trading desk is a template, and “why is my build 40 seconds and my binary 90 MB?” is a real question with a real answer. Interviewers probe it by asking why template definitions cannot live in a `.cpp` file.',

  mentalModel:
    'A template is a *stencil*, not a function. It is a shape cut into a plate, and nothing exists until you press it onto metal — and the press happens *once per distinct type*, not once per call. The compiler holds the plate; your call site is what pushes it down.',

  scene: {
    id: 'template-stamping',
    title: 'Stamping a function out of a stencil',
    width: 720,
    height: 420,
    legend: [
      { tone: 'highlight', label: 'the stencil — no code emitted' },
      { tone: 'owned', label: 'a stamped instantiation' },
      { tone: 'freed', label: 'stamped, then failed' },
    ],
    steps: [
      {
        say: 'This is the state of the world after the compiler has read your template and before it has seen a single call. It has parsed the shape and checked the syntax, and that is all. The tray is empty.',
        mark: ['5-8'],
        shapes: () => [
          bench(),
          plate(34),
          Text({
            key: 'empty',
            x: 360,
            y: 270,
            text: 'zero bytes of machine code so far — a template is not a function',
            size: 12,
            anchor: 'middle',
            opacity: 0.5,
          }),
        ],
      },
      {
        say: 'The first call supplies `T = int` by deduction. Only now does the compiler substitute, type-check the body, and emit a genuine function with a genuine symbol in the object file.',
        mark: ['13'],
        shapes: () => [
          bench(),
          plate(62),
          callsite('max_of(3, 5)'),
          Arrow({
            key: 'press',
            from: [330, 142],
            to: [150, 190],
            shape: 'curve',
            bend: -30,
            tone: 'highlight',
            label: 'instantiate',
          }),
          stampInt(),
        ],
      },
      {
        say: 'A second call with `double` presses the plate again. This is a whole second function body — not a shared one with a type tag, not a runtime check. Different `T`, different code.',
        mark: ['14'],
        shapes: () => [
          bench(),
          plate(62),
          callsite('max_of(1.5, 2.5)'),
          Arrow({
            key: 'press',
            from: [360, 142],
            to: [360, 190],
            shape: 'straight',
            bend: 0,
            tone: 'highlight',
            label: 'instantiate',
          }),
          stampInt(),
          stampDbl(),
        ],
      },
      {
        say: 'A third call, `int` again. The compiler looks in the tray, finds `max_of<int>` already there, and reuses it. Instantiation is keyed on the arguments, not on the call.',
        mark: ['15'],
        focus: ['stamp.int', 'press', 'callsite', 'reuse'],
        predict: {
          ask: 'After `max_of(3,5)`, `max_of(1.5,2.5)` and `max_of(9,1)`, how many `max_of` function bodies end up in the object file?',
          options: [
            { label: 'One — templates are generic code', correct: false },
            { label: 'Two — one per distinct type argument', correct: true },
            { label: 'Three — one per call site', correct: false },
          ],
          because:
            'Instantiation is keyed on the template arguments. The third call finds `max_of<int>` already stamped and reuses it, so two distinct `T`s means exactly two bodies. If five different `.cpp` files all instantiate `max_of<int>`, each object file gets its own copy — emitted as a *weak* symbol — and the linker folds them back down to one. That folding is why templates in headers do not break the one-definition rule.',
        },
        shapes: () => [
          bench(),
          plate(62),
          callsite('max_of(9, 1)'),
          Arrow({
            key: 'press',
            from: [300, 142],
            to: [150, 190],
            shape: 'curve',
            bend: -30,
            tone: 'hit',
            dashed: true,
            label: 'already stamped',
          }),
          stampInt('hit'),
          stampDbl(),
          Tag({ key: 'reuse', x: 48, y: 290, text: 'found — reused', tone: 'hit' }),
        ],
      },
      {
        say: 'Add `std::string` and you have three. Every instantiation is a distinct block of instructions competing for the same 32 KB of L1 instruction cache — this is what people mean by code bloat.',
        mark: ['13-17'],
        shapes: () => [
          bench(),
          plate(62),
          callsite('max_of(std::string, std::string)'),
          stampInt(),
          stampDbl(),
          Box({
            key: 'stamp.str',
            x: SLOT_X[2],
            y: SLOT_Y,
            w: SLOT_W,
            h: SLOT_H,
            label: 'string max_of(string,string)',
            sub: 'and it is not small',
            tone: 'owned',
            labelSize: 9.5,
            mono: true,
          }),
          Bracket({
            key: 'bloat',
            x: 48,
            y: 292,
            w: 624,
            label: 'three function bodies, three symbols, three claims on the instruction cache',
            tone: 'moved',
          }),
          Text({
            key: 'bloatnote',
            x: 360,
            y: 348,
            text: 'Each one is also compiled from scratch — which is why heavy template code is slow to build.',
            size: 11.5,
            anchor: 'middle',
            opacity: 0.85,
          }),
        ],
      },
      {
        say: 'Now feed it a `Point`, which has no `operator<`. The compiler still stamps the body first, then type-checks it — so the failure is reported at the line `a < b`, in a function you never wrote.',
        mark: ['21'],
        focus: ['stamp.pt', 'errline', 'errline2', 'callsite', 'errline3'],
        shapes: () => [
          bench(),
          plate(62),
          callsite('max_of(Point, Point)'),
          stampInt(),
          stampDbl(),
          Box({
            key: 'stamp.pt',
            x: SLOT_X[2],
            y: SLOT_Y,
            w: SLOT_W,
            h: SLOT_H,
            label: 'Point max_of(Point,Point)',
            sub: 'return a < b ? b : a;',
            tone: 'freed',
            labelSize: 10,
            mono: true,
          }),
          Text({
            key: 'errline',
            x: 574,
            y: 300,
            text: 'error: no match for operator<',
            size: 10.5,
            anchor: 'middle',
            mono: true,
            tone: 'freed',
          }),
          Text({
            key: 'errline2',
            x: 574,
            y: 320,
            text: 'in max_of<Point> — a line you never wrote',
            size: 10,
            anchor: 'middle',
            mono: true,
            opacity: 0.8,
          }),
          Text({
            key: 'errline3',
            x: 360,
            y: 366,
            text: 'The error is real and the diagnosis is correct. It is just being delivered from inside generated code, with your call site buried in the “required from here” trail.',
            size: 11,
            anchor: 'middle',
            opacity: 0.85,
          }),
        ],
      },
      {
        say: 'This also explains the header rule. Instantiation needs the body and the call in the same translation unit — put the body in a `.cpp` and the stamp is never made, so the linker finds nothing.',
        mark: ['5-8'],
        shapes: () => [
          Box({
            key: 'tu1',
            x: 60,
            y: 90,
            w: 240,
            h: 120,
            label: 'main.cpp',
            sub: 'calls max_of(3, 5)',
            tone: 'highlight',
          }),
          Box({
            key: 'tu2',
            x: 420,
            y: 90,
            w: 240,
            h: 120,
            label: 'max_of.cpp',
            sub: 'the template body lives here',
            tone: 'moved',
          }),
          Arrow({
            key: 'need',
            from: [302, 150],
            to: [418, 150],
            shape: 'straight',
            bend: 0,
            tone: 'freed',
            label: 'needs max_of<int>',
          }),
          Tag({
            key: 'nope',
            x: 470,
            y: 226,
            text: 'never instantiated — no call was ever seen here',
            tone: 'freed',
          }),
          Text({
            key: 'linkerr',
            x: 360,
            y: 278,
            text: 'undefined reference to `int max_of<int>(int, int)`',
            size: 11.5,
            anchor: 'middle',
            mono: true,
            tone: 'freed',
          }),
          Text({
            key: 'fix1',
            x: 360,
            y: 330,
            text: 'The compiler stamps a template only where it can see the body and the call together.',
            size: 12,
            anchor: 'middle',
          }),
          Text({
            key: 'fix2',
            x: 360,
            y: 354,
            text: 'That is the entire reason template definitions live in headers.',
            size: 12,
            anchor: 'middle',
          }),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'stencil.cpp',
    source: `#include <cstdio>
#include <string>

// A stencil, not a function. No code is emitted from these lines.
template <class T>
T max_of(T a, T b) {
    return a < b ? b : a;
}

struct Point { int x, y; };

int main() {
    int    i = max_of(3, 5);       // stamps max_of<int>
    double d = max_of(1.5, 2.5);   // stamps max_of<double>
    int    j = max_of(9, 1);       // reuses max_of<int>

    std::string s = max_of(std::string("ab"), std::string("cd"));

    // Point has no operator<, so this fails - but the error is
    // reported inside max_of, on a line you never wrote.
    // Point p = max_of(Point{1,2}, Point{3,4});

    std::printf("%d %f %d %s\\n", i, d, j, s.c_str());
    return 0;
}`,
    annotations: [
      {
        lines: '5-8',
        text: 'Parsed and syntax-checked now; type-checked only later, per instantiation. `a < b` is not verified until a concrete `T` arrives.',
      },
      {
        lines: '13-15',
        text: 'Three calls, two stamps. The compiler keys the tray on the argument list, so the third call is free.',
      },
      {
        lines: '21',
        text: 'Uncomment this and read the *last* line of the error first — that is your call site. Everything above it is the trail through generated code.',
      },
    ],
  },

  deeper: [
    'Compilation of a template happens in two passes. At definition time the compiler checks only what it can check without knowing `T`: the syntax, and any name that does not depend on the template parameters. Names that do depend on `T` — `a < b`, `T::value_type`, `a.size()` — are held back until instantiation. This is called two-phase lookup, and it is why `typename` and `template` disambiguators exist: at phase one the compiler genuinely cannot tell whether `T::foo` is a type or a value.',
    'An instantiation is emitted as a *weak* (COMDAT) symbol rather than a strong one. Ten translation units that all use `std::vector<int>::push_back` each emit their own copy; the linker keeps one and discards the rest. That is what makes headers-only templates legal under the one-definition rule, and it is also why link times get long — the linker is doing real deduplication work on tens of thousands of near-identical symbols.',
    'Code bloat is measurable and occasionally serious. `std::vector<int>`, `std::vector<long>` and `std::vector<Order*>` are three unrelated blocks of code even though the pointer versions are byte-for-byte identical. The classic fix is to write the type-independent bulk once against `void*` or a base class and keep only a thin typed wrapper as a template; `std::unique_ptr` and many `std::function` implementations do exactly this. Identical Code Folding in the linker (`-Wl,--icf=all` with lld or gold) recovers some of it automatically.',
    'A template is not the same thing as a runtime generic. There is no boxing, no vtable, no type tag: `max_of<int>` compiles to the same two instructions a hand-written `int max_of(int,int)` would. That is the trade — you pay in compile time and binary size to pay nothing at runtime. Java generics and Go interfaces make the opposite trade. Knowing which trade you are making is most of what “zero-cost abstraction” means.',
    'Explicit instantiation gives you a middle road. Writing `template int max_of<int>(int, int);` in one `.cpp` forces the stamp there, and `extern template int max_of<int>(int, int);` in the header tells every other translation unit not to bother. For a heavily used template in a large codebase this can cut build times substantially, at the cost of having to list the types up front.',
  ],

  gotchas: [
    'Putting a template definition in a `.cpp` file compiles cleanly and fails at link with “undefined reference”. The error names the mangled instantiation, not the missing definition, so it reads like a build-system problem when it is not.',
    'Read template errors from the bottom up. The last “required from here” frame is your call site; everything above it is the compiler walking down through generated code. GCC’s `-fmax-errors=1` and `-ftemplate-backtrace-limit=0` make this bearable.',
    'A dependent name needs `typename` (`typename T::iterator it;`) or `template` (`obj.template get<0>()`). Without them the compiler assumes “value”, and the error mentions a comparison operator you never wrote.',
    'Template argument deduction does no conversions. `max_of(3, 5.0)` fails with “deduced conflicting types for T” — it will not silently promote the `int`. Either write `max_of<double>(3, 5.0)` or give the template two parameters.',
    'Every distinct instantiation is a distinct symbol in the debugger and the profiler. A flame graph full of `std::__introsort_loop<...>` names is not a bug; it is monomorphisation being visible.',
  ],

  interview: {
    q: 'Why can a template definition not live in a `.cpp` file the way an ordinary function definition can, and what are your options if you want it to?',
    a: [
      'Because a template is not code yet. The compiler emits a function body only when it sees a call that fixes the template arguments, and it can only do that if the body is visible in the same translation unit as the call. If the body is in `max_of.cpp` and the call is in `main.cpp`, then `main.cpp` compiles fine — the declaration is enough to type-check the call — but no object file ever contains `max_of<int>`, so the link fails with an undefined reference to the mangled name.',
      'The usual answer is: put the definition in the header. That is safe under the one-definition rule because instantiations are emitted as weak COMDAT symbols, so the linker collapses the duplicates rather than complaining about them. The cost is compile time — every translation unit that includes the header re-instantiates and re-optimises the same code.',
      'The other option is explicit instantiation. Keep the definition in the `.cpp`, and add `template int max_of<int>(int,int);` there for each type you want, plus `extern template ...` in the header so other translation units skip the work. This is the right shape when the set of types is small and known — a matrix class over `float` and `double`, say — and it is a genuine build-time win on a large codebase. It stops working the moment a caller wants a type you did not list.',
    ],
  },

  exercise: [
    'Compile the file above and run `nm -C --defined-only stencil.o | grep max_of`. You will see two or three mangled entries, one per instantiated type, each marked `W` for weak rather than `T` for a normal text symbol. Add a fourth call with a new type and watch the list grow by exactly one.',
    'Then uncomment the `Point` line and compile with `-fmax-errors=1`. Scroll to the *bottom* of the output and find the “required from here” line that names line 21 of your own file — that is the habit worth building, because it turns a 300-line diagnostic into a two-second read. Compile it a third time with `-ftime-report` and look at where the seconds go; template instantiation will be near the top.',
  ],
};
