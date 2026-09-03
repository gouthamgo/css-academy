import { Box, Region, Arrow, Text, Tag } from '../../viz/primitives.js';

/* ------------------------------------------------------------------
   Shared geometry. The pipeline runs top to bottom in four bands:
   header -> translation units -> compilers -> object files -> linker.
   Two columns, one per .cpp, with a wall down the middle for the
   stages that genuinely cannot see across it.
   ------------------------------------------------------------------ */
const LX = 70;
const RX = 420;
const TW = 230;
const TU_Y = 64;
const CC_Y = 170;
const OBJ_Y = 232;
const HDR = { x: 250, y: 14, w: 220, h: 38 };

const hdr = (opts = {}) =>
  Box({
    key: 'hdr',
    x: HDR.x,
    y: HDR.y,
    w: HDR.w,
    h: HDR.h,
    label: 'order.h',
    labelSize: 12,
    sub: 'double fee(const Order&);',
    ...opts,
  });

const colX = (side) => (side === 'a' ? LX : RX);
const colName = (side) => (side === 'a' ? 'price.cpp' : 'main.cpp');

/* A .cpp before the preprocessor has touched it: short, with one
   #include line standing in for a whole file it has not seen yet. */
const tuSmall = (side) => {
  const x = colX(side);
  return [
    Box({ key: `tu.${side}`, x, y: TU_Y, w: TW, h: 44 }),
    Text({
      key: `tuname.${side}`,
      x: x + 12,
      y: TU_Y + 14,
      text: colName(side),
      size: 12,
      mono: true,
      weight: 700,
    }),
    Text({
      key: `inc.${side}`,
      x: x + 12,
      y: TU_Y + 32,
      text: '#include "order.h"',
      size: 10.5,
      mono: true,
      tone: 'highlight',
    }),
  ];
};

/* The same .cpp after the include has been pasted in: taller, with the
   header's text sitting inside it as real content. */
const tuBig = (side, body) => {
  const x = colX(side);
  return [
    Box({ key: `tu.${side}`, x, y: TU_Y, w: TW, h: 80 }),
    Text({
      key: `tuname.${side}`,
      x: x + 12,
      y: TU_Y + 14,
      text: colName(side),
      size: 12,
      mono: true,
      weight: 700,
    }),
    Box({
      key: `inj.${side}`,
      x: x + 12,
      y: TU_Y + 24,
      w: TW - 24,
      h: 28,
      dashed: true,
      tone: 'highlight',
      label: 'order.h, pasted in verbatim',
      labelSize: 9.5,
      mono: true,
    }),
    Text({
      key: `body.${side}`,
      x: x + 12,
      y: TU_Y + 66,
      text: body,
      size: 10,
      mono: true,
      opacity: 0.7,
    }),
  ];
};

const cc = (side) =>
  Box({
    key: `cc.${side}`,
    x: side === 'a' ? 110 : 460,
    y: CC_Y,
    w: 150,
    h: 40,
    label: 'compiler',
    labelSize: 12,
    sub: 'g++ -c',
    tone: 'stack',
  });

const feed = (side) => {
  const cx = colX(side) + TW / 2;
  return [
    Arrow({
      key: `a1.${side}`,
      from: [cx, TU_Y + 82],
      to: [cx, CC_Y - 2],
      shape: 'straight',
      bend: 0,
      tone: 'stack',
    }),
  ];
};

const emit = (side) => {
  const cx = colX(side) + TW / 2;
  return [
    Arrow({
      key: `a2.${side}`,
      from: [cx, CC_Y + 42],
      to: [cx, OBJ_Y - 2],
      shape: 'straight',
      bend: 0,
      tone: 'stack',
    }),
  ];
};

/* An object file drawn as what it actually is: a bag of machine code
   plus a table of names it provides and names it still owes. */
const objBox = (side, opts) => {
  const x = colX(side);
  const out = [
    Box({
      key: `o.${side}`,
      x,
      y: OBJ_Y,
      w: TW,
      h: 98,
      tone: opts.tone ?? 'neutral',
    }),
    Text({
      key: `oname.${side}`,
      x: x + 12,
      y: OBJ_Y + 16,
      text: opts.name,
      size: 12,
      mono: true,
      weight: 700,
    }),
    Text({
      key: `odl.${side}`,
      x: x + 12,
      y: OBJ_Y + 36,
      text: 'DEFINED',
      size: 9,
      weight: 700,
      tone: 'owned',
    }),
  ];
  opts.defs.forEach((d, i) =>
    out.push(
      Text({
        key: `od.${side}.${i}`,
        x: x + 12,
        y: OBJ_Y + 51 + i * 16,
        text: d.text,
        size: 10.5,
        mono: true,
        tone: d.tone ?? 'neutral',
        opacity: d.opacity ?? 1,
      })
    )
  );
  if (opts.needs) {
    const ny = OBJ_Y + 51 + opts.defs.length * 16 + 5;
    out.push(
      Text({
        key: `onl.${side}`,
        x: x + 12,
        y: ny,
        text: 'NEEDS',
        size: 9,
        weight: 700,
        tone: 'miss',
      })
    );
    opts.needs.forEach((n, i) =>
      out.push(
        Text({
          key: `on.${side}.${i}`,
          x: x + 12,
          y: ny + 15 + i * 16,
          text: n.text,
          size: 10.5,
          mono: true,
          tone: n.tone ?? 'neutral',
          opacity: n.opacity ?? 1,
        })
      )
    );
  }
  return out;
};

const wall = () => [
  Box({ key: 'wall', x: 358, y: 156, w: 4, h: 190, tone: 'freed' }),
  Text({
    key: 'wallcap',
    x: 360,
    y: 148,
    text: 'the compiler cannot see across this',
    size: 10,
    anchor: 'middle',
    tone: 'freed',
    opacity: 0.9,
  }),
];

const linkerRegion = () =>
  Region({
    key: 'link',
    x: 54,
    y: 214,
    w: 612,
    h: 152,
    label: 'THE LINKER — the first stage that sees every object file at once',
    tone: 'heap',
  });

const BODY_A = 'double fee(const Order& o) {...}';
const BODY_B = 'int main() { ... fee(o) ... }';

const GOOD_DEFS = [{ text: '_Z3feeRK5Order', tone: 'owned' }];
const NONE = [{ text: '— nothing —', opacity: 0.5 }];

export default {
  oneLiner:
    'What happens between pressing build and getting a binary, and why the linker is where things break.',

  whyJob:
    'Every "undefined reference to" and every "multiple definition of" on a real build system is this lesson, and interviewers use it to tell people who have shipped C++ from people who have only written it. Build times are also a first-order engineering cost at a trading firm, and they are governed by what you put in headers.',

  mentalModel:
    'Each `.cpp` is a *sealed room*. The compiler goes into one room at a time and can never see into any other, so when it meets a name it has only been *promised* — a declaration — it writes an IOU and carries on. The linker is the one stage standing outside all the rooms at once, and its entire job is to match every IOU to exactly *one* payment.',

  scene: {
    id: 'build-pipeline',
    title: 'From three text files to one executable',
    width: 720,
    height: 440,
    legend: [
      { tone: 'highlight', label: 'text pasted in by the preprocessor' },
      { tone: 'owned', label: 'symbol this object file defines' },
      { tone: 'miss', label: 'symbol it still owes' },
      { tone: 'freed', label: 'the link fails here' },
    ],
    steps: [
      {
        say: 'Three text files on disk. `order.h` contains a promise — a declaration with no body — and both `.cpp` files ask for it by name. Nothing has been compiled yet; at this point it is all still text.',
        mark: ['1-9'],
        shapes: () => [hdr(), ...tuSmall('a'), ...tuSmall('b')],
      },
      {
        say: '`#include` is not an import and it is not a module system. It is literal text substitution, done by a separate program before the compiler starts. Change one line of `order.h` and every file that includes it must be rebuilt — that is where your build time goes.',
        mark: ['12', '19'],
        shapes: () => [
          hdr({ tone: 'highlight' }),
          ...tuBig('a', BODY_A),
          ...tuBig('b', BODY_B),
          Arrow({
            key: 'flow.a',
            from: [HDR.x + 24, HDR.y + HDR.h],
            to: [190, TU_Y + 20],
            tone: 'highlight',
            bend: 26,
            label: 'copy',
          }),
          Arrow({
            key: 'flow.b',
            from: [HDR.x + HDR.w - 24, HDR.y + HDR.h],
            to: [532, TU_Y + 20],
            tone: 'highlight',
            bend: -26,
            label: 'copy',
          }),
        ],
      },
      {
        say: 'What comes out of the preprocessor is a *translation unit*: one self-contained blob of text. Each one is compiled by a completely separate process, in any order, possibly on a different machine. Neither compiler run knows the other exists.',
        mark: ['29-30'],
        focus: ['cc.a', 'cc.b', 'wall', 'wallcap', 'a1.a', 'a1.b'],
        shapes: () => [
          hdr(),
          ...tuBig('a', BODY_A),
          ...tuBig('b', BODY_B),
          ...wall(),
          cc('a'),
          cc('b'),
          ...feed('a'),
          ...feed('b'),
        ],
      },
      {
        say: 'Out come object files: machine code, plus a table of names. `main.o` has no idea where `fee` lives — it could not have known, so it left a hole and recorded what belongs in it. The mangled spelling is the compiler encoding the parameter types into the name so that overloads can coexist.',
        mark: ['9', '14'],
        focus: [
          'o.a', 'o.b', 'oname.a', 'oname.b', 'odl.a', 'odl.b',
          'od.a.0', 'od.b.0', 'onl.a', 'onl.b', 'on.a.0', 'on.b.0',
        ],
        shapes: () => [
          hdr(),
          ...tuBig('a', BODY_A),
          ...tuBig('b', BODY_B),
          ...wall(),
          cc('a'),
          cc('b'),
          ...feed('a'),
          ...feed('b'),
          ...emit('a'),
          ...emit('b'),
          ...objBox('a', { name: 'price.o', defs: GOOD_DEFS, needs: NONE }),
          ...objBox('b', {
            name: 'main.o',
            defs: [{ text: 'main', tone: 'owned' }],
            needs: [{ text: '_Z3feeRK5Order', tone: 'miss' }],
          }),
        ],
      },
      {
        say: 'The linker walks every NEEDS entry and looks for a byte-for-byte identical DEFINED entry somewhere in the whole program. When it finds one it patches the real address into the call site. It compares strings — it never re-reads your source, and it has no idea what a type is.',
        mark: ['31'],
        focus: ['link', 'o.a', 'o.b', 'od.a.0', 'on.b.0', 'resolve'],
        shapes: () => [
          hdr(),
          ...tuBig('a', BODY_A),
          ...tuBig('b', BODY_B),
          cc('a'),
          cc('b'),
          ...feed('a'),
          ...feed('b'),
          ...emit('a'),
          ...emit('b'),
          linkerRegion(),
          ...objBox('a', { name: 'price.o', defs: GOOD_DEFS, needs: NONE }),
          ...objBox('b', {
            name: 'main.o',
            defs: [{ text: 'main', tone: 'owned' }],
            needs: [{ text: '_Z3feeRK5Order', tone: 'miss' }],
          }),
          Arrow({
            key: 'resolve',
            from: [428, 318],
            to: [176, 287],
            bend: -55,
            tone: 'owned',
            thick: true,
            label: 'exact string match',
          }),
        ],
      },
      {
        say: 'Now suppose `price.cpp` had written `double fee(Order& o)` — the same function, one missing `const`. Both files still compile without a single warning, because neither compiler can see the other.',
        mark: ['14'],
        focus: ['od.a.0', 'on.b.0', 'fail', 'err1', 'err2', 'err3'],
        predict: {
          ask: 'The header declares `fee(const Order&)`; `price.cpp` defines `fee(Order&)`. What happens?',
          options: [
            {
              label: '`price.cpp` fails to compile — the definition does not match the declaration',
              correct: false,
            },
            {
              label: 'Both compile; the link fails with an undefined reference',
              correct: true,
            },
            { label: 'It all works — `const` is ignored on parameters', correct: false },
            {
              label: 'It links, and calling `fee` is undefined behaviour at run time',
              correct: false,
            },
          ],
          because:
            'The two signatures are a legal overload pair, so `price.cpp` is a valid file that declares one function and defines a different one. The mismatch only becomes visible when the two mangled names are compared, and that comparison happens in the linker — the last stage, with the least context, which is exactly why its errors feel so far from the mistake.',
        },
        shapes: () => [
          hdr(),
          ...tuBig('a', 'double fee(Order& o) {...}'),
          ...tuBig('b', BODY_B),
          cc('a'),
          cc('b'),
          ...feed('a'),
          ...feed('b'),
          ...emit('a'),
          ...emit('b'),
          linkerRegion(),
          ...objBox('a', {
            name: 'price.o',
            defs: [{ text: '_Z3feeR5Order', tone: 'freed' }],
            needs: NONE,
          }),
          ...objBox('b', {
            name: 'main.o',
            defs: [{ text: 'main', tone: 'owned' }],
            needs: [{ text: '_Z3feeRK5Order', tone: 'miss' }],
          }),
          Arrow({
            key: 'fail',
            from: [428, 318],
            to: [330, 362],
            bend: 26,
            tone: 'freed',
            thick: true,
          }),
          Tag({ key: 'nomatch', x: 236, y: 352, text: 'no match anywhere', tone: 'freed' }),
          Text({
            key: 'err1',
            x: 54,
            y: 392,
            text: "/usr/bin/ld: main.o: in function `main':",
            size: 10.5,
            mono: true,
            tone: 'freed',
          }),
          Text({
            key: 'err2',
            x: 54,
            y: 408,
            text: "undefined reference to `fee(Order const&)'",
            size: 10.5,
            mono: true,
            tone: 'freed',
          }),
          Text({
            key: 'err3',
            x: 54,
            y: 426,
            text: 'It names the type you never typed, because it is demangling a symbol.',
            size: 10,
            opacity: 0.7,
          }),
        ],
      },
      {
        say: 'The opposite failure is just as common: put a function *body* in a header without `inline`, and every file that includes it defines the same symbol. That is the One Definition Rule — one definition per program, no more and no less. `inline` is the escape hatch that says "many identical copies exist, keep one".',
        mark: ['9', '14'],
        focus: ['od.a.0', 'od.b.1', 'clash', 'err1', 'err2', 'err3', 'hdr'],
        shapes: () => [
          hdr({ tone: 'miss', sub: 'double fee(const Order&) { ... }' }),
          ...tuBig('a', BODY_A),
          ...tuBig('b', BODY_B),
          cc('a'),
          cc('b'),
          ...feed('a'),
          ...feed('b'),
          ...emit('a'),
          ...emit('b'),
          linkerRegion(),
          ...objBox('a', {
            name: 'price.o',
            defs: [{ text: '_Z3feeRK5Order', tone: 'freed' }],
            needs: NONE,
          }),
          ...objBox('b', {
            name: 'main.o',
            defs: [
              { text: 'main', tone: 'owned' },
              { text: '_Z3feeRK5Order', tone: 'freed' },
            ],
          }),
          Arrow({
            key: 'clash',
            from: [176, 287],
            to: [428, 302],
            bend: 52,
            tone: 'freed',
            thick: true,
            label: 'same name twice',
          }),
          Text({
            key: 'err1',
            x: 54,
            y: 392,
            text: "/usr/bin/ld: main.o: multiple definition of `fee(Order const&)';",
            size: 10.5,
            mono: true,
            tone: 'freed',
          }),
          Text({
            key: 'err2',
            x: 54,
            y: 408,
            text: 'price.o: first defined here',
            size: 10.5,
            mono: true,
            tone: 'freed',
          }),
          Text({
            key: 'err3',
            x: 54,
            y: 426,
            text: 'Fix: mark it inline in the header, or move the body into one .cpp.',
            size: 10,
            opacity: 0.7,
          }),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'three-files.cpp',
    source: `// ---------- order.h ----------
#pragma once

struct Order {
    long price_ticks;
    int  quantity;
};

double fee(const Order& o);   // declaration: a promise, no body

// ---------- price.cpp ----------
#include "order.h"

double fee(const Order& o) {  // definition: one, and only one
    return o.price_ticks * o.quantity * 0.0001;
}

// ---------- main.cpp ----------
#include "order.h"
#include <cstdio>

int main() {
    Order o{100250, 40};
    printf("%f\\n", fee(o));
    return 0;
}

// build it in three separate acts:
//   g++ -c price.cpp -o price.o     <- compile, alone
//   g++ -c main.cpp  -o main.o      <- compile, alone
//   g++ price.o main.o -o trade     <- link, together`,
    annotations: [
      {
        lines: '9',
        text: 'A declaration is enough to *call* the function. The compiler only needs the signature to know how to set up the call and what type comes back — it does not need the body.',
      },
      {
        lines: '14',
        text: 'This is the payment for every IOU in the program. Move it into `order.h` without `inline` and you break the One Definition Rule the moment a second file includes the header.',
      },
      {
        lines: '28-31',
        text: 'The two `-c` lines can run in parallel on different machines and in any order — that independence is exactly what the wall in the diagram buys you, and it is why C++ builds distribute well.',
      },
    ],
  },

  deeper: [
    'The preprocessor is a text tool that knows nothing about C++. `#include <vector>` on a typical libstdc++ pastes in roughly 40,000 lines. Run `g++ -E main.cpp | wc -l` on any real file and you will see why a header-heavy codebase compiles slowly: the compiler is not slow, it is re-parsing tens of megabytes of the same declarations once per `.cpp`. Precompiled headers, unity builds and C++20 modules all exist to attack that one number.',
    'An object file is not "half a program". It is machine code in sections — `.text` for instructions, `.rodata` for constants, `.data` and `.bss` for globals — plus a symbol table and a relocation table. The relocation table is the list of holes: "at byte 0x1f of `.text` there is a `call` whose 4-byte target is unknown; fill it with the address of `_Z3feeRK5Order`". The linker assigns final addresses to every section, then walks that list and writes the numbers in.',
    'C++ mangles names because the symbol table is a flat namespace of strings, while C++ has overloading, namespaces and templates. `_Z3feeRK5Order` decodes as "function `fee`, taking a reference-to-const `Order`". This is why linker errors mention types you never typed, and why calling into a C library needs `extern "C"` — that suppresses mangling so the name stays plain `fee`. `c++filt` turns a mangled name back into a signature, and `nm -C` does it for a whole object file.',
    'The One Definition Rule has two halves. The obvious half: exactly one definition of each non-inline function or variable across the whole program, or the link fails loudly. The dangerous half: where multiple definitions *are* allowed — inline functions, templates, class definitions — they must be *token-for-token identical*. If two translation units see different versions of the same class because one was compiled before you edited the header, the program links cleanly and then reads a member at the wrong offset. No diagnostic is required, and none is given.',
    'Linkers are order-sensitive in ways that surprise people. GNU `ld` processes its inputs left to right and only pulls an archive member out of a `.a` if something *already seen* needs it, so `g++ -lfoo main.o` fails where `g++ main.o -lfoo` succeeds. Modern alternatives — `lld`, `mold` — are dramatically faster on large binaries, and swapping the linker is often the cheapest build-time win available on a big C++ codebase.',
  ],

  gotchas: [
    'A definition whose signature differs from the declaration by one qualifier — a missing `const`, `int` instead of `long`, a reference instead of a value — compiles in both files and fails at link time with a demangled message that looks identical to what you wrote. Always read the *mangled* name when the demangled one makes no sense.',
    'A non-`inline` function body in a header produces "multiple definition of" as soon as two translation units include it. Class member functions defined *inside* the class body are implicitly inline, which is why that case works and the free function does not.',
    'Calling a C library without wrapping its header in `extern "C"` gives you undefined references to mangled names. If the error mentions a symbol starting `_Z`, that is what happened.',
    'Editing a header and rebuilding only some of the dependent files gives you an ODR violation, not a link error. Two translation units disagree about `sizeof` a class and read members at different offsets. This is silent memory corruption; when in doubt, do a clean build.',
    'With GNU `ld`, `-lfoo` must come *after* the object files that reference it. The same command with the arguments swapped produces undefined references to symbols that are unmistakably present in the library.',
  ],

  interview: {
    q: 'Walk me through what happens between `g++ main.cpp` and a running binary. Then tell me why "undefined reference" and "multiple definition" are both linker errors rather than compiler errors.',
    a: [
      'Four stages. The preprocessor does text substitution — includes, macros, conditional compilation — and emits one translation unit per `.cpp`. The compiler proper parses that unit, does semantic analysis and optimisation, and emits assembly. The assembler turns assembly into an object file: machine code in sections, plus a symbol table listing what this file defines and what it still needs, plus relocations marking the holes. The linker takes all the object files and libraries, assigns final addresses, resolves every needed symbol against a definition somewhere, patches the holes, and writes an executable.',
      'Both errors are linker errors for the same reason: the compiler physically cannot see across translation units. When `main.cpp` calls `fee`, the declaration is enough to generate the call — argument setup, return type, calling convention — so the compiler is finished and correct with just a promise. Whether that promise is ever kept is a whole-program question, and the linker is the first and only stage that has the whole program in front of it. Undefined reference means no object file paid the IOU; multiple definition means two of them did.',
      'The detail worth adding is that the linker compares *mangled strings*, not types. It does not know what an `Order` is and never re-reads your source. That is why a missing `const` shows up as a missing symbol rather than a type error, why `extern "C"` is needed for C interop, and why the One Definition Rule has a silent branch: if two units define the same inline function *differently*, the linker happily keeps one copy and the program is quietly wrong. That silent branch is the part most candidates miss.',
    ],
  },

  exercise: [
    'Build the three files above and confirm they link. Then run `g++ -E main.cpp | wc -l` and note the number — that is how many lines the compiler actually reads for a file you wrote in eight. Add `#include <vector>` and run it again; the difference is the real cost of a header.',
    'Now inspect the symbol tables: `nm -C price.o` and `nm -C main.o`. Find the `T` (defined in text) and `U` (undefined) entries and match them to the diagram. Drop the `-C` and look at the raw mangled names, then run one through `c++filt`.',
    'Finally, break it deliberately. Remove the `const` from the definition in `price.cpp`, rebuild, and read the linker error carefully. Then put the body of `fee` into `order.h` and rebuild to see the other failure. Being able to recognise both messages in under five seconds is worth more than it sounds.',
  ],
};
