import { Region, Box, Arrow, Text, Tag } from '../../viz/primitives.js';

/* ------------------------------------------------------------------
   Three panels that never move: what you wrote (top left), what the
   optimiser has proved (bottom left), what actually got emitted
   (right). Keeping the geometry fixed means the only thing that
   changes between steps is the content — and the content changing is
   the lesson.
   ------------------------------------------------------------------ */
const SRC = { x: 24, y: 48, w: 300, h: 150 };
const WB = { x: 24, y: 216, w: 300, h: 170 };
const ASM = { x: 372, y: 48, w: 330, h: 338 };

const SRC_LINE_X = 38;
const SRC_LINE_W = 272;
const SRC_LINE_Y = [76, 116, 156];

const ASM_X = 386;
const ASM_W = 302;
const ASM_Y = [86, 146, 206, 266];

const panels = (srcLabel) => [
  Region({ key: 'srcRegion', x: SRC.x, y: SRC.y, w: SRC.w, h: SRC.h, label: srcLabel, tone: 'neutral' }),
  Region({ key: 'wbRegion', x: WB.x, y: WB.y, w: WB.w, h: WB.h, label: 'WHAT THE OPTIMISER HAS PROVED', tone: 'highlight' }),
  Region({ key: 'asmRegion', x: ASM.x, y: ASM.y, w: ASM.w, h: ASM.h, label: 'MACHINE CODE ACTUALLY EMITTED', tone: 'stack' }),
];

/* A line of source, drawn as a box so it can be crossed out later. */
const srcLine = (i, label, opts = {}) =>
  Box({
    key: `src.${i}`,
    x: SRC_LINE_X,
    y: SRC_LINE_Y[i],
    w: SRC_LINE_W,
    h: 34,
    label,
    labelSize: 11.5,
    mono: true,
    tone: 'neutral',
    ...opts,
  });

const asmBlock = (i, label, sub, opts = {}) =>
  Box({
    key: `asm.${i}`,
    x: ASM_X,
    y: ASM_Y[i],
    w: ASM_W,
    h: 46,
    label,
    sub,
    labelSize: 11.5,
    mono: true,
    tone: 'neutral',
    ...opts,
  });

/* One fact on the whiteboard. Facts accumulate downward. */
const FACT_Y = [252, 280, 308, 336, 364];
const fact = (i, text, tone = 'highlight') =>
  Text({
    key: `wb.${i}`,
    x: WB.x + 16,
    y: FACT_Y[i],
    text,
    size: 11.5,
    mono: true,
    tone,
    weight: 600,
  });

/* The inference arrow: source line -> whiteboard, routed through the
   gap between the two columns so it never crosses a box. */
const infer = (fromY) =>
  Arrow({
    key: 'infer',
    from: [SRC_LINE_X + SRC_LINE_W + 4, fromY],
    to: [348, 244],
    shape: 'curve',
    bend: -20,
    tone: 'highlight',
    label: 'infers',
  });

export default {
  oneLiner:
    'Why undefined behaviour deletes code you wrote, instead of producing a wrong number.',

  whyJob:
    'Trading firms build at -O2 or -O3 with the sanitizers switched off in production, so a single signed overflow or null dereference can silently remove a safety check from a live order path. Interviewers ask this to find out whether you think UB means "unpredictable output" or "a fact the compiler is entitled to reason from".',

  mentalModel:
    'Undefined behaviour is not the compiler getting confused. It is a *promise you signed*: "this program will never do that." The optimiser reads your code as a witness statement and treats every operation as *evidence that the promise held*. Break the promise, and the conclusions it drew from that evidence — including whole branches it deleted — were built on a lie.',

  scene: {
    id: 'ub-inference',
    title: 'The optimiser reasons backwards from your code',
    width: 720,
    height: 410,
    legend: [
      { tone: 'highlight', label: 'a fact the optimiser derived' },
      { tone: 'moved', label: 'proved dead — deleted' },
      { tone: 'stack', label: 'code that survives to the binary' },
    ],
    steps: [
      {
        say: 'Here is the function you wrote, and the four blocks of machine code it looks like it ought to become. Read line 7: it is clearly meant as a guard against someone passing a null pointer.',
        mark: ['5-9'],
        shapes: () => [
          ...panels('SOURCE — as you wrote it'),
          srcLine(0, 'int v = *p;'),
          srcLine(1, 'if (!p) return -1;'),
          srcLine(2, 'return v;'),
          asmBlock(0, 'mov  eax, [rdi]', 'load *p into v'),
          asmBlock(1, 'test rdi, rdi', 'is p null?'),
          asmBlock(2, 'mov  eax, -1', 'the guard you wrote'),
          asmBlock(3, 'ret', 'return v'),
        ],
      },
      {
        say: 'The optimiser starts with line 6. Dereferencing a null pointer is undefined, and it is entitled to assume your program contains no undefined behaviour — so the mere presence of `*p` is proof that `p` was not null.',
        mark: ['6'],
        focus: ['srcRegion', 'src.0', 'wbRegion', 'wb.0', 'wb.1', 'wb.2', 'infer'],
        shapes: () => [
          ...panels('SOURCE — as you wrote it'),
          srcLine(0, 'int v = *p;', { tone: 'highlight' }),
          srcLine(1, 'if (!p) return -1;'),
          srcLine(2, 'return v;'),
          infer(SRC_LINE_Y[0] + 17),
          fact(0, 'line 6 executed  *p'),
          fact(1, 'a valid program never'),
          fact(2, 'dereferences null  ⇒  p != 0'),
          asmBlock(0, 'mov  eax, [rdi]', 'load *p into v'),
          asmBlock(1, 'test rdi, rdi', 'is p null?'),
          asmBlock(2, 'mov  eax, -1', 'the guard you wrote'),
          asmBlock(3, 'ret', 'return v'),
        ],
      },
      {
        say: 'Now it looks at line 7 holding that fact. `!p` is `p == 0`, and it has already written down that `p != 0`. The condition is not merely unlikely — it is a constant.',
        mark: ['6-7'],
        predict: {
          ask: 'The optimiser has `p != 0` on its whiteboard. What does it do with `if (!p) return -1;`?',
          options: [
            { label: 'Keeps it — a compare and a branch are nearly free, and safety is worth it', correct: false },
            { label: 'Deletes the branch and the entire `return -1` block', correct: true },
            { label: 'Moves the check above the dereference so the guard works as intended', correct: false },
            { label: 'Emits a diagnostic and leaves the code alone', correct: false },
          ],
          because:
            'There is no special "undefined behaviour" pass. The optimiser proved the condition is a constant, and the pass that removes provably dead code is the same ordinary pass that removes `if (1 == 2)`. Nothing warns you, because from the compiler’s point of view nothing unusual happened at all.',
        },
        shapes: () => [
          ...panels('SOURCE — as you wrote it'),
          srcLine(0, 'int v = *p;'),
          srcLine(1, 'if (!p) return -1;', { tone: 'highlight' }),
          srcLine(2, 'return v;'),
          infer(SRC_LINE_Y[1] + 17),
          fact(0, 'line 6 executed  *p'),
          fact(1, 'a valid program never'),
          fact(2, 'dereferences null  ⇒  p != 0'),
          fact(3, 'so  !p  is false. always.'),
          asmBlock(0, 'mov  eax, [rdi]', 'load *p into v'),
          asmBlock(1, 'test rdi, rdi', 'is p null?', { tone: 'moved', dashed: true }),
          asmBlock(2, 'mov  eax, -1', 'the guard you wrote', { tone: 'moved', dashed: true }),
          asmBlock(3, 'ret', 'return v'),
        ],
      },
      {
        say: 'Both blocks are gone from the binary. Notice the direction of causation: a check written *after* the dereference reached back and erased itself. That is why people call it time travel — in the source, the cause comes second.',
        mark: ['7'],
        shapes: () => [
          ...panels('SOURCE — as you wrote it'),
          srcLine(0, 'int v = *p;'),
          srcLine(1, 'if (!p) return -1;', { tone: 'moved', dashed: true }),
          srcLine(2, 'return v;'),
          Tag({ key: 'deleted', x: SRC_LINE_X + 90, y: SRC_LINE_Y[1] + 40, text: 'never emitted', tone: 'moved' }),
          fact(0, 'line 6 executed  *p'),
          fact(1, 'a valid program never'),
          fact(2, 'dereferences null  ⇒  p != 0'),
          fact(3, 'so  !p  is false. always.'),
          fact(4, 'dead code removed', 'moved'),
          asmBlock(0, 'mov  eax, [rdi]', 'the whole function', { tone: 'stack' }),
          asmBlock(1, 'ret', 'two instructions', { tone: 'stack' }),
        ],
      },
      {
        say: 'So `f(nullptr)` cannot return -1. There is no code path that produces -1 any more. What you get instead is whatever `mov eax, [rdi]` does with address zero on this machine — usually a segfault, but if the load gets folded away entirely, a plausible-looking wrong number.',
        mark: ['21'],
        focus: ['asmRegion', 'asm.0', 'asm.1', 'unreachable'],
        shapes: () => [
          ...panels('SOURCE — as you wrote it'),
          srcLine(0, 'int v = *p;'),
          srcLine(1, 'if (!p) return -1;', { tone: 'moved', dashed: true }),
          srcLine(2, 'return v;'),
          fact(0, 'line 6 executed  *p'),
          fact(1, 'a valid program never'),
          fact(2, 'dereferences null  ⇒  p != 0'),
          fact(3, 'so  !p  is false. always.'),
          fact(4, 'dead code removed', 'moved'),
          asmBlock(0, 'mov  eax, [rdi]', 'the whole function', { tone: 'stack' }),
          asmBlock(1, 'ret', 'two instructions', { tone: 'stack' }),
          Tag({ key: 'unreachable', x: ASM_X + 60, y: 240, text: '-1 is unreachable', tone: 'freed' }),
        ],
      },
      {
        say: 'The same machinery, a different promise. Signed integer overflow is undefined, so `++i` on a signed `int` is a promise that `i` never wraps. Watch what that does to a perfectly ordinary loop guard.',
        mark: ['12-16'],
        shapes: () => [
          ...panels('SOURCE — a second promise'),
          srcLine(0, 'int n = 0;'),
          srcLine(1, 'for (int i = start; i >= 0; ++i)'),
          srcLine(2, '    ++n;'),
          fact(0, 'signed ++ never wraps'),
          fact(1, 'i starts at start >= 0'),
          fact(2, 'and only ever increases'),
          asmBlock(0, 'xor  eax, eax', 'n = 0'),
          asmBlock(1, '.L2: add eax, 1', '++n'),
          asmBlock(2, 'cmp  edi, 0', 'is i >= 0?'),
          asmBlock(3, 'jge  .L2', 'loop back'),
        ],
      },
      {
        say: 'The guard is now a tautology, so the compare and the conditional jump collapse into an unconditional one. At -O0 this function wraps to negative after two increments and returns 3. At -O2 it never returns at all — and both are correct compilations of a program that was never valid.',
        mark: ['14'],
        shapes: () => [
          ...panels('SOURCE — a second promise'),
          srcLine(0, 'int n = 0;'),
          srcLine(1, 'for (int i = start; i >= 0; ++i)', { tone: 'moved', dashed: true }),
          srcLine(2, '    ++n;'),
          Tag({ key: 'deleted', x: SRC_LINE_X + 90, y: SRC_LINE_Y[1] + 40, text: 'guard is always true', tone: 'moved' }),
          fact(0, 'signed ++ never wraps'),
          fact(1, 'i starts at start >= 0'),
          fact(2, 'and only ever increases'),
          fact(3, '⇒  i >= 0  is an axiom'),
          fact(4, 'exit edge removed', 'moved'),
          asmBlock(0, 'xor  eax, eax', 'n = 0', { tone: 'stack' }),
          asmBlock(1, '.L2: add eax, 1', '++n', { tone: 'stack' }),
          asmBlock(2, 'jmp  .L2', 'unconditional. forever.', { tone: 'freed' }),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'ub.cpp',
    source: `#include <cstdio>
#include <climits>

// The optimiser may assume this program contains no undefined behaviour.
int f(int* p) {
    int v = *p;         // a dereference. so p is valid. so p != nullptr.
    if (!p) return -1;  // ...therefore this condition is provably false
    return v;
}

// Signed overflow is UB, so "i >= 0" is an axiom, not a computation.
int count(int start) {
    int n = 0;
    for (int i = start; i >= 0; ++i) ++n;
    return n;
}

int main() {
    int x = 42;
    printf("f(&x)      = %d\\n", f(&x));
    printf("f(nullptr) = %d\\n", f(nullptr));
    printf("count      = %d\\n", count(INT_MAX - 2));
    return 0;
}`,
    annotations: [
      {
        lines: '6',
        text: 'This is the load-bearing line, and it is load-bearing for a reason nobody expects: it is **evidence**, not just an operation. Everything after it may assume `p` was dereferenceable.',
      },
      {
        lines: '7',
        text: 'Written as a guard, compiled as nothing. Reordering the check above line 6 is the entire fix — the promise must be checked *before* it is relied upon.',
      },
      {
        lines: '14',
        text: 'At `-O0` this returns 3. At `-O2` it hangs. Add `-fwrapv` and it returns 3 again at every level, because that flag defines the overflow the standard leaves undefined.',
      },
      {
        lines: '22',
        text: 'Run this and the program will not finish. That is the point: the difference between optimisation levels is not speed, it is *behaviour*, once UB is in play.',
      },
    ],
  },

  deeper: [
    'The standard splits bad programs three ways and the distinction matters in interviews. *Implementation-defined* behaviour has a documented answer that varies by platform — `sizeof(int)`, the signedness of plain `char`. *Unspecified* behaviour has a small set of legal answers and the compiler need not tell you which it picked — the evaluation order of function arguments. *Undefined* behaviour has no constraints at all: the standard imposes no requirements on a program that exhibits it, including on the parts that ran before. Only the third one lets the optimiser delete your code.',
    'The mechanism is not a special case. Compilers carry a value-range and nullness analysis through every pass, and UB is where that analysis gets its strongest facts for free. Signed arithmetic is a rich source: because `int` overflow is undefined, LLVM can prove `i * 2 / 2 == i`, can widen a 32-bit induction variable to 64 bits so a loop indexes without a sign-extension every iteration, and can turn `i <= n - 1` into `i < n`. Making signed overflow wrap (`-fwrapv`) costs measurable performance in loop-heavy code, which is exactly why nobody switched the default.',
    'The common UB you will actually hit: signed overflow; dereferencing null or a dangling pointer; reading an uninitialised value; out-of-bounds indexing; strict-aliasing violations, where you write through an `int*` and read through a `float*`; shifting by more than the width of the type (`x << 32` on a 32-bit `int`); an infinite loop with no side effects, which the compiler may assume terminates; and returning nothing from a non-`void` function, which in Clang can fall through into whatever function was emitted next.',
    'Strict aliasing is the one that bites low-latency parsing code hardest. The compiler assumes two pointers of unrelated types never refer to the same bytes, so it feels free to keep a value in a register across a store through the other pointer. The correct tool is `std::memcpy` into a local of the target type — every mainstream compiler recognises the pattern and emits a single `mov`, so it is genuinely zero cost — or `std::bit_cast` in C++20. Casting a `char*` buffer to a `Header*` and reading fields through it is the wrong tool, even though it appears to work for years.',
    'Sanitizers are not the same as the optimiser. UBSan inserts runtime checks and tells you the moment a promise is broken; ASan catches memory errors; both find bugs at the point of the crime rather than at the point of the symptom. They cost roughly 2× (UBSan) to 3× (ASan) in runtime and are not for production, but they are how you find these bugs before the optimiser silently exploits them. A candidate who says "I run the test suite under `-fsanitize=address,undefined` in CI" has answered a question the interviewer did not have to ask.',
  ],

  gotchas: [
    'UB is not "the program does the wrong thing at that line". It is retroactive — output printed before the bad operation can vanish, because the optimiser may reorder or delete anything on a path it has proved cannot legally execute.',
    '"It works on my machine at -O0" is the classic trap. Debug builds hide UB because the optimiser is not drawing conclusions yet; the bug appears in release, in production, months later.',
    '`assert(p)` after the dereference is worthless, and `assert` compiles to nothing under `NDEBUG` anyway. The check has to come before the operation whose validity it establishes.',
    'Unsigned overflow is *defined* — it wraps modulo 2^n. Signed overflow is not. This is why `for (size_t i = n - 1; i >= 0; --i)` is an infinite loop while the signed version is undefined: two different bugs from the same typo.',
    'Sanitizers only see paths you actually execute. A clean UBSan run proves nothing about the branch your test data never took, which is why fuzzing and sanitizers are used together.',
  ],

  interview: {
    q: 'A colleague adds a null check to a hot function and reports that the branch "does not show up in the profile at all". Later the same function segfaults on a null input. What happened, and what would you have said in code review?',
    a: [
      'The check was almost certainly placed after something that already dereferences the pointer — even indirectly, through an inlined accessor or a reference parameter, since binding a reference to `*p` is itself a dereference. The optimiser used that operation as proof the pointer was non-null, folded the condition to a constant, and deleted the branch. It does not appear in the profile because it does not appear in the binary.',
      'The detail worth stating explicitly is that this is not a special undefined-behaviour rule firing. It is ordinary constant propagation followed by ordinary dead-code elimination. The compiler is allowed to assume the program has no UB, so a dereference is a *fact* it may propagate forwards. Once `p != nullptr` is a fact, `!p` is a constant, and removing a constant-false branch is the same optimisation that removes `if (false)`. That is why there is no warning: from the compiler’s side nothing anomalous occurred.',
      'In review I would say: move the check above every use, and prefer to make the invariant unrepresentable — take a reference or a `gsl::not_null` rather than a raw pointer, so a null can never arrive in the first place. Then I would ask for `-fsanitize=undefined,address` in CI, because this bug class is invisible in debug builds and expensive in production. If someone insists on the current ordering, `-fno-delete-null-pointer-checks` will keep the branch, but that is a workaround for a codebase you cannot fix today, not a design.',
    ],
  },

  exercise: [
    'Paste the code above into [Compiler Explorer](https://godbolt.org) with x86-64 GCC and `-O2`. Count the instructions in `f`. There should be two: a load and a return. Now switch to `-O0` and watch the `test`/`je` pair reappear. Then add `-fno-delete-null-pointer-checks` at `-O2` and confirm the branch survives. Three builds, three different binaries, one source file.',
    'Now compile and run the whole program with `-O2` and time it — it will not terminate, because `count` lost its exit edge. Recompile with `-O2 -fwrapv` and it prints 3 immediately. Finally build with `-O2 -fsanitize=undefined` and run: UBSan reports `signed integer overflow: 2147483647 + 1 cannot be represented in type int` with a file and line. That report, produced in under a second, is the difference between a two-hour debugging session and a two-minute one.',
  ],
};
