import { Region, Box, Frame, Arrow, Text, Tag, Bracket } from '../../viz/primitives.js';

/* One boundary box represents a safe function. A small inner box is the
   unsafe block. The second half of the scene reuses the same "one cell,
   two claims" shape from ownership.js's double-free panel, because that
   is exactly what an aliasing violation is -- just not caught this time. */
const OUTER = { x: 60, y: 70, w: 300, h: 190 };
const CELL_X = 470;
const CELL_Y = 150;

const boundary = (label = 'fn get_two_mut(...) -> (&mut T, &mut T)', tone = 'stack') =>
  Box({ key: 'outer', ...OUTER, label, tone, labelSize: 12 });

export default {
  oneLiner:
    'What the `unsafe` keyword actually unlocks — five specific abilities, not a switch that turns the borrow checker off.',

  whyJob:
    'Interviewers use this to separate people who have read one blog post from people who have written FFI bindings. Getting "unsafe disables the borrow checker" wrong in an interview is a strong negative signal at a firm that ships Rust talking to a C matching engine.',

  mentalModel:
    'An `unsafe` block is a note stapled to a small piece of code that says "I checked this by hand; the compiler cannot." It does not turn off the building\'s fire alarms — the borrow checker still runs on every ordinary reference in that block. It hands you five specific keys the compiler otherwise withholds: deref a raw pointer, call an `unsafe fn`, touch a mutable static, implement an `unsafe trait`, read a `union` field. Everything else about Rust still applies, including the rule that makes those five keys dangerous in the first place: two `&mut` to the same memory at once is undefined behaviour, whether or not `unsafe` is the reason you have them.',

  scene: {
    id: 'unsafe-boundary',
    title: 'What unsafe actually unlocks',
    width: 720,
    height: 420,
    legend: [
      { tone: 'stack', label: 'safe code, checked as always' },
      { tone: 'highlight', label: 'unsafe block, hand-verified' },
      { tone: 'freed', label: 'undefined behaviour, not caught' },
    ],
    steps: [
      {
        say: 'A safe function can contain an `unsafe` block. Only the code inside that block gets the five extra abilities — the rest of the function, and everyone who calls it, is ordinary checked Rust.',
        mark: ['4', '7-9'],
        shapes: () => [
          boundary(),
          Box({ key: 'inner', x: 90, y: 170, w: 240, h: 60, label: 'unsafe { ... }', tone: 'highlight', labelSize: 12, mono: true }),
          Tag({ key: 't1', x: 400, y: 90, text: 'deref raw pointer', tone: 'highlight' }),
          Tag({ key: 't2', x: 400, y: 118, text: 'call unsafe fn', tone: 'highlight' }),
          Tag({ key: 't3', x: 400, y: 146, text: 'read/write mutable static', tone: 'highlight' }),
          Tag({ key: 't4', x: 400, y: 174, text: 'impl unsafe trait', tone: 'highlight' }),
          Tag({ key: 't5', x: 400, y: 202, text: 'access union field', tone: 'highlight' }),
          Text({ key: 't5.lbl', x: 400, y: 74, text: 'the five things unsafe unlocks', size: 11, mono: true, weight: 650, opacity: 0.85 }),
        ],
      },
      {
        say: 'A sound `unsafe` block earns its safety from an invariant, written down, that the surrounding code guarantees is true every time the block runs. Here: `i != j`, both in bounds — checked one line above, by ordinary safe code, before the unsafe block ever executes.',
        mark: ['2-3', '5', '7-9'],
        focus: ['outer', 'inner', 'contract'],
        shapes: () => [
          boundary(),
          Box({ key: 'inner', x: 90, y: 170, w: 240, h: 60, label: 'unsafe { ... }', tone: 'highlight', labelSize: 12, mono: true }),
          Text({
            key: 'contract',
            x: 60,
            y: 280,
            text: '// SAFETY: i != j, i < len, j < len -- disjoint by construction',
            size: 11,
            mono: true,
            tone: 'stack',
            weight: 600,
          }),
        ],
      },
      {
        say: 'Inside that same `unsafe` block, an ordinary safe reference is still checked. `let a = &mut *v; let b = &mut *v;` where `v` is a plain `&mut Vec<i32>` fails to compile whether or not it sits inside `unsafe` — `unsafe` did not add double-mutable-borrow to its list of five abilities.',
        predict: {
          ask: 'Does writing `unsafe { }` around a block of code disable the borrow checker for the safe references inside it?',
          options: [
            { label: 'Yes — inside unsafe, the borrow checker stops running entirely', correct: false },
            { label: 'No — unsafe only unlocks five specific abilities; ordinary borrows are still checked', correct: true },
            { label: 'It disables checking only for `&mut`, not `&`', correct: false },
          ],
          because:
            'The borrow checker is not one of the five things `unsafe` turns off. What changes inside the block is that the compiler additionally permits raw-pointer deref, unsafe-fn calls, mutable statics, unsafe trait impls, and union fields. A plain `&mut v` conflicting with another `&mut v` is still an ordinary compile error — `unsafe` is not a way around it. The only way around it is a raw pointer, which is the next step.',
        },
        mark: [],
        shapes: () => [
          boundary('fn still_checked(v: &mut Vec<i32>)'),
          Box({ key: 'inner', x: 90, y: 170, w: 240, h: 60, label: 'unsafe { &mut *v; &mut *v }', tone: 'highlight', labelSize: 11, mono: true }),
          Text({
            key: 'err',
            x: 60,
            y: 280,
            text: 'error[E0499]: cannot borrow `*v` as mutable more than once',
            size: 11,
            mono: true,
            tone: 'freed',
            weight: 650,
          }),
        ],
      },
      {
        say: 'Raw pointers are how you actually get around it — because `*mut T` is not a reference at all, forming two of them is not a borrow-checker question. `let p1: *mut i32 = &mut v[0]; let p2: *mut i32 = &mut v[0];` compiles without complaint; both are just addresses, and the compiler tracks no exclusivity on a raw pointer.',
        mark: ['15-16'],
        shapes: () => [
          Region({ key: 'r', x: 60, y: 70, w: 300, h: 220, label: 'fn unsound_alias(v: &mut Vec<i32>)', tone: 'stack' }),
          Box({ key: 'p1', x: 90, y: 130, w: 220, h: 44, label: 'p1: *mut i32', sub: '0x3000', tone: 'neutral', mono: true }),
          Box({ key: 'p2', x: 90, y: 200, w: 220, h: 44, label: 'p2: *mut i32', sub: '0x3000', tone: 'neutral', mono: true }),
          Box({ key: 'cell', x: CELL_X, y: CELL_Y, w: 140, h: 60, label: 'v[0]', sub: '0x3000', tone: 'heap' }),
          Arrow({ key: 'a1', from: [310, 152], to: [470, 172], tone: 'neutral', bend: 20 }),
          Arrow({ key: 'a2', from: [310, 222], to: [470, 188], tone: 'neutral', bend: -20 }),
        ],
      },
      {
        say: 'Now both are dereferenced inside `unsafe { }`: `let a = &mut *p1; let b = &mut *p2;`. This compiles clean — no warning, no error. `a` and `b` are two live `&mut i32`, each one a claim that says "nothing else touches this byte while I exist", pointed at the identical address.',
        mark: ['18-19'],
        focus: ['cell', 'claimA', 'claimB'],
        shapes: () => [
          Region({ key: 'r', x: 60, y: 70, w: 300, h: 220, label: 'unsafe { ... }', tone: 'highlight' }),
          Box({ key: 'cell', x: CELL_X, y: CELL_Y, w: 140, h: 60, label: 'v[0]', sub: '0x3000', tone: 'freed' }),
          Tag({ key: 'claimA', x: 90, y: 120, text: 'a: &mut i32 — exclusive', tone: 'highlight' }),
          Tag({ key: 'claimB', x: 90, y: 160, text: 'b: &mut i32 — exclusive', tone: 'highlight' }),
          Arrow({ key: 'a1', from: [300, 130], to: [470, 168], tone: 'highlight', bend: 18 }),
          Arrow({ key: 'a2', from: [300, 170], to: [470, 190], tone: 'highlight', bend: -18 }),
        ],
      },
      {
        say: '`*a = 1; *b = 2;` runs, both compile, both execute. Two "exclusive" claims on one byte is exactly the state the aliasing rule says must never exist — the optimiser is entitled to assume it never does, and may reorder, cache, or eliminate either write. There is no crash to point at; the value you read back afterwards is unspecified.',
        mark: ['20-21'],
        shapes: () => [
          Region({ key: 'r', x: 60, y: 70, w: 300, h: 220, label: 'unsafe { ... }', tone: 'freed' }),
          Box({ key: 'cell', x: CELL_X, y: CELL_Y, w: 140, h: 60, label: '???', sub: 'UB — no defined value', tone: 'freed' }),
          Tag({ key: 'claimA', x: 90, y: 120, text: 'a writes 1', tone: 'freed' }),
          Tag({ key: 'claimB', x: 90, y: 160, text: 'b writes 2', tone: 'freed' }),
          Text({ key: 'boom', x: 60, y: 280, text: 'compiles clean. runs. rustc never saw the conflict.', size: 12, mono: true, tone: 'freed', weight: 650 }),
        ],
      },
      {
        say: 'The compiler cannot catch this because raw-pointer aliasing is not a static property it tracks at all — that is the whole reason raw pointers exist. Tools built for exactly this gap can: `cargo miri run` interprets the program and flags the second `&mut` the instant it is created, long before `main` returns.',
        mark: [],
        shapes: () => [
          Bracket({ key: 'span', x: 60, y: 120, w: 600, label: 'rustc: 0 errors, 0 warnings', tone: 'freed' }),
          Text({ key: 'miri', x: 60, y: 180, text: '$ cargo miri run', size: 13, mono: true, tone: 'stack', weight: 650 }),
          Text({ key: 'miriout', x: 60, y: 210, text: 'error: Undefined Behavior: attempting a write access using <tag> at 0x3000,', size: 11, mono: true, tone: 'freed' }),
          Text({ key: 'miriout2', x: 60, y: 230, text: 'but that tag does not exist in the borrow stack for this location', size: 11, mono: true, tone: 'freed' }),
        ],
      },
    ],
  },

  code: {
    lang: 'rust',
    filename: 'main.rs',
    source: `/// Returns mutable references to two DISTINCT elements of \`slice\`.
/// SAFETY invariant this function enforces before the unsafe block runs:
/// \`i != j\` and both are in bounds, so the two pointers name disjoint bytes.
fn get_two_mut<T>(slice: &mut [T], i: usize, j: usize) -> (&mut T, &mut T) {
    assert!(i != j && i < slice.len() && j < slice.len());
    let ptr = slice.as_mut_ptr();
    unsafe {
        (&mut *ptr.add(i), &mut *ptr.add(j))
    }
}

/// The violation: two raw pointers at the SAME address, both turned
/// into live &mut references. Compiles. Undefined behaviour.
fn unsound_alias(v: &mut Vec<i32>) {
    let p1: *mut i32 = &mut v[0];
    let p2: *mut i32 = &mut v[0];      // same address -- legal for raw pointers
    unsafe {
        let a: &mut i32 = &mut *p1;    // exclusive claim #1
        let b: &mut i32 = &mut *p2;    // exclusive claim #2, same byte
        *a = 1;
        *b = 2;                         // UB: rustc assumes this cannot alias
        println!("{a} {b}");
    }
}

fn main() {
    let mut xs = vec![10, 20, 30];
    let (a, b) = get_two_mut(&mut xs, 0, 2);
    *a += 1;
    *b += 1;
    println!("{xs:?}");

    let mut ys = vec![0];
    unsound_alias(&mut ys); // do not run this under anything but miri
}`,
    annotations: [
      {
        lines: '5,7-9',
        text: 'The `assert!` on line 5 is what makes the `unsafe` block on 7-9 sound — it runs in checked, safe Rust and cannot be skipped. Delete it and the function is unsound even though nothing else changes.',
      },
      {
        lines: '16',
        text: 'Two raw pointers at one address compile without complaint. This line alone is not the bug — raw pointers carry no aliasing guarantee to violate yet.',
      },
      {
        lines: '18-19',
        text: 'This is the actual violation: two live `&mut` bindings aiming at the same byte. The compiler performed zero checks here, because raw-pointer deref is one of the five things `unsafe` turns off.',
      },
      {
        lines: '34',
        text: 'Run this under plain `cargo run` and it will very likely print `1 2` and look fine — which is the trap. UB does not promise to look wrong; it promises nothing at all.',
      },
    ],
  },

  deeper: [
    'The Rust reference is specific about the five abilities because that list is the entire contract: raw pointer dereference, calling a function marked `unsafe fn`, reading or writing a `static mut`, implementing a trait marked `unsafe trait`, and accessing a field of a `union`. Everything else — move semantics, `&`/`&mut` exclusivity on ordinary references, lifetime checking, exhaustiveness of `match` — keeps running inside an `unsafe` block exactly as it does outside one. This is why the step in the scene where two safe `&mut` references still fail to compile inside `unsafe` surprises people the first time they see it, and it is the single fact that separates "I read the keyword" from "I understand the keyword".',
    'The aliasing rule — at most one `&mut` to a place, or any number of `&` but no `&mut`, at any given moment — is not a borrow-checker invention that stops applying once you go around the checker. It is a promise the *whole language* makes to the optimiser: LLVM is told, via `noalias` attributes derived from Rust\'s `&mut`, that a mutable reference does not overlap any other live reference, and it uses that promise to reorder loads and stores, keep values in registers across calls, and vectorise loops. `unsafe` lets you construct two `&mut` to the same place without the compiler noticing; it does not revoke the promise already made to the optimiser. The result is not "the program does something surprising" — it is undefined behaviour in the same category as C\'s strict aliasing violations, and a sufficiently aggressive optimiser is entitled to produce any output at all, including one that looks correct on today\'s compiler and breaks on tomorrow\'s.',
    '`UnsafeCell<T>` is the one legitimate way to get aliased mutability, and understanding why it is different from the raw-pointer violation above is the crux of writing sound `unsafe` code. Ordinary `&T` tells the optimiser "this memory will not change while I hold this reference" — that is the `noalias`/immutability promise `UnsafeCell` exists to opt out of. `Cell`, `RefCell`, `Mutex`, and every other interior-mutability type are built on an `UnsafeCell<T>` at the bottom, which tells the compiler explicitly "mutation through a shared reference to this specific memory is expected; do not assume it stays constant." The unsound example in this lesson never opted out of that promise anywhere — it just built two `&mut` and hoped, which is why it is UB and a `Cell`-based design of the same idea would not be.',
    'ClickHouse\'s own public account of introducing Rust into its C++ codebase is worth reading precisely because it is not a success story about `unsafe` being safe by nature. Their first attempt at an FFI boundary between the two languages segfaulted, not because Rust\'s safety guarantees failed, but because the *wrapper* — the hand-written `unsafe` code translating between a C++ object\'s lifetime and Rust\'s ownership rules — encoded an invariant that turned out to be false under real usage. The lesson they draw, and the one worth internalising here, is that `unsafe` moves the proof obligation from the compiler to the author, and an FFI boundary is exactly where that obligation is hardest to discharge correctly the first time, because both sides\' invariants have to be reconciled by a human.',
    'Miri interprets your MIR (mid-level IR) rather than compiling to native code, and while doing so it tracks a "borrow stack" per byte of memory — a runtime reconstruction of exactly the aliasing history the borrow checker would have verified statically, applied to raw pointers too. That is why `cargo miri run` catches the violation in this lesson\'s scene the instant the second `&mut` is formed, without needing the UB to visibly misbehave first. It is slow — often 10-50x slower than native execution — which is why it runs in CI and test suites rather than production, but for any crate with a meaningful amount of `unsafe`, treating a clean `cargo test` as sufficient without also running `cargo miri test` is a common and expensive gap.',
  ],

  gotchas: [
    '`unsafe fn` marks a function as having a precondition the *caller* must uphold — calling it requires an `unsafe` block, but that block only proves you acknowledged the contract, not that you satisfied it. Reading the doc comment above an `unsafe fn` for its `# Safety` section is not optional.',
    'A crate with zero `#[forbid(unsafe_code)]` violations can still contain `unsafe` deep inside a dependency you never audited. `cargo geiger` counts unsafe usage across your dependency tree; it is worth running once on anything going into a low-latency or safety-relevant path.',
    'Debug builds and release builds can both "work" with a real aliasing violation and still be unsound — passing tests is evidence of nothing here, because UB is permitted to happen to look correct. Treat a passing test suite around `unsafe` code as necessary, not sufficient; miri or it did not happen.',
    'Overflow, out-of-bounds indexing on a slice via safe `[]`, and division by zero all panic in **safe** Rust — they are bugs, not undefined behaviour, and are a completely different category from what this lesson covers. Do not let "my safe code panicked" and "my unsafe code has UB" collapse into the same mental bucket; the former is caught and controlled, the latter is not caught at all.',
  ],

  interview: {
    q: 'Does `unsafe` disable the borrow checker? Walk me through what it actually changes.',
    a: [
      'No. `unsafe` unlocks exactly five abilities the compiler otherwise refuses: dereferencing a raw pointer, calling an `unsafe fn`, reading or writing a mutable static, implementing an `unsafe trait`, and accessing a `union` field. Every other rule Rust enforces — move checking, lifetime checking, and the exclusivity of ordinary `&`/`&mut` references — keeps running inside an `unsafe` block exactly as it does outside one.',
      'What actually gets dangerous is that raw pointers are not subject to the aliasing rule the borrow checker enforces on references, so `unsafe` gives you the tools to construct two `&mut` to the same memory by routing through raw pointers — the checker never sees a raw pointer as a claim on anything, so it has nothing to reject. The compiler still assumes, everywhere, that any `&mut` it does see is genuinely exclusive; that assumption feeds directly into optimisations like `noalias`-based reordering. Break it through `unsafe` and you have not disabled a check, you have produced a program the compiler is entitled to miscompile.',
      'The part that shows real depth: `unsafe` is a proof-shifting mechanism, not a safety-off switch. Writing `unsafe { }` is you asserting, by hand, that the five newly-unlocked operations inside it uphold every invariant the rest of the language assumes — bounds, alignment, exclusivity, initialization. A well-written `unsafe` block is small, has a `// SAFETY:` comment stating exactly which invariant it relies on and why the surrounding code guarantees it, and is wrapped in a safe function whose signature makes violating that invariant from the outside impossible. That discipline is the entire difference between `unsafe` code that is sound and `unsafe` code that merely compiled.',
    ],
  },

  exercise: [
    'Type the `unsound_alias` function from the code block into a real project and run it three ways: `cargo run` (note what it prints — probably the value you expect), `cargo run --release` (note whether the answer changes), and `cargo miri run`. Read the miri error closely; it names the exact address and the exact "tag" — its term for a specific reference\'s claim to that memory — that got violated, and it does so without your program ever crashing on its own.',
    'Then write the sound version yourself: reimplement the standard library\'s `<[T]>::split_at_mut` from scratch using `unsafe` and raw-pointer arithmetic, with a `// SAFETY:` comment stating exactly why the two halves cannot overlap. Compare your implementation against the real one in the standard library source — the shape should be nearly identical, which is the point: the standard library is not magic, it is the same `unsafe` you just wrote, audited harder.',
  ],
};
