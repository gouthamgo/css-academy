import { Cell, Box, Text, Tag } from '../../viz/primitives.js';

/* ------------------------------------------------------------------
   Two columns, same geometry throughout: left demonstrates shadowing
   (a NEW binding each `let`), right demonstrates mutation (the SAME
   binding, rewritten in place). Keeping 'x1'/'x2' as separate keys —
   never reusing one key for both — is what lets the old box visibly
   stay put underneath the new one instead of just changing value.
   ------------------------------------------------------------------ */
const LEFT_X = 90;
const RIGHT_X = 480;
const CELL_W = 150;
const CELL_H = 60;
const ROW1_Y = 110;
const ROW2_Y = 210;

const header = (x, text) =>
  Text({ key: `h.${x}`, x, y: 66, text, size: 12, mono: true, weight: 650, opacity: 0.75 });

export default {
  oneLiner:
    'Why Rust makes you opt into changing a variable at all, and the one letter of difference between rebinding a name and overwriting a box.',

  whyJob:
    'Shadowing looks like mutation and is not, and interviewers ask about it specifically because candidates who only skimmed the book conflate the two. Getting asked to explain why `let x = 5; let x = "five";` compiles — a type-changing *reassignment* never would — is a fast, cheap way to tell who actually understands bindings.',

  mentalModel:
    'A binding is a *sticky label* on a box, not the box itself. `let mut` lets you reuse one box and swap what is inside it — same address, and the new contents must be the same type and size as what was there. Writing `let` again with the same name does something else entirely: it sets down a brand-new label on a brand-new box, and the old box is *still sitting there*, just no longer wearing a label anyone can read.',

  scene: {
    id: 'shadow-vs-mutate',
    title: 'Two boxes named x, one box named y',
    width: 720,
    height: 400,
    legend: [
      { tone: 'owned', label: 'live, reachable by name' },
      { tone: 'moved', label: 'still in memory — no longer reachable' },
      { tone: 'highlight', label: 'just written' },
    ],
    steps: [
      {
        say: 'Two plain bindings. `x` holds 5, an i32. `y` also holds 5, but was declared `mut` — the only difference so far is a keyword neither box shows.',
        mark: ['2-3', '8'],
        shapes: () => [
          header(LEFT_X, 'let x = 5;'),
          header(RIGHT_X, 'let mut y = 5;'),
          Cell({ key: 'x1', x: LEFT_X, y: ROW1_Y, w: CELL_W, h: CELL_H, name: 'x', value: '5', addr: '0x7ffee214', sub: 'i32', tone: 'owned' }),
          Cell({ key: 'y', x: RIGHT_X, y: ROW1_Y, w: CELL_W, h: CELL_H, name: 'y (mut)', value: '5', addr: '0x7ffee258', sub: 'i32', tone: 'owned' }),
        ],
      },
      {
        say: 'Now `let x = "five";` on the left. A brand-new binding is created — same name, a completely different box, and even a different type.',
        mark: ['5'],
        focus: ['x1', 'x2', 'resolve'],
        predict: {
          ask: 'After `let x = "five";` runs, what happened to the original box holding 5?',
          options: [
            { label: 'It was overwritten with the string "five"', correct: false },
            { label: 'It was immediately freed, since x no longer points at it', correct: false },
            { label: 'It is still there in memory, just no longer reachable by the name x', correct: true },
          ],
          because:
            'Shadowing does not touch the first box at all — it adds a second binding and the compiler resolves any later use of `x` to the newest, innermost one. The old box is not specially freed either: it stays part of the stack frame exactly like any other local, and for a heap-owning type it would not actually drop until the enclosing scope ends, same as always.',
        },
        shapes: () => [
          header(LEFT_X, 'let x = 5; let x = "five";'),
          header(RIGHT_X, 'let mut y = 5;'),
          Cell({ key: 'x1', x: LEFT_X, y: ROW1_Y, w: CELL_W, h: CELL_H, name: 'x', value: '5', addr: '0x7ffee214', sub: 'still here, unreachable', tone: 'moved', dashed: true }),
          Cell({ key: 'x2', x: LEFT_X, y: ROW2_Y, w: CELL_W, h: CELL_H, name: 'x', value: '"five"', addr: '0x7ffee23c', sub: '&str', tone: 'highlight' }),
          Tag({ key: 'resolve', x: LEFT_X, y: ROW2_Y - 22, text: 'x now resolves here', tone: 'highlight' }),
          Cell({ key: 'y', x: RIGHT_X, y: ROW1_Y, w: CELL_W, h: CELL_H, name: 'y (mut)', value: '5', addr: '0x7ffee258', sub: 'i32', tone: 'owned' }),
        ],
      },
      {
        say: 'On the right, `y = 6;` does the opposite: no new box. The same four bytes at the same address are overwritten, and the type is not allowed to change — `mut` promises a new *value*, never a new *kind* of value.',
        mark: ['9'],
        focus: ['y', 'sameaddr'],
        shapes: () => [
          header(LEFT_X, 'let x = 5; let x = "five";'),
          header(RIGHT_X, 'let mut y = 5; y = 6;'),
          Cell({ key: 'x1', x: LEFT_X, y: ROW1_Y, w: CELL_W, h: CELL_H, name: 'x', value: '5', addr: '0x7ffee214', sub: 'still here, unreachable', tone: 'moved', dashed: true }),
          Cell({ key: 'x2', x: LEFT_X, y: ROW2_Y, w: CELL_W, h: CELL_H, name: 'x', value: '"five"', addr: '0x7ffee23c', sub: '&str', tone: 'highlight' }),
          Cell({ key: 'y', x: RIGHT_X, y: ROW1_Y, w: CELL_W, h: CELL_H, name: 'y (mut)', value: '6', addr: '0x7ffee258', sub: 'i32', tone: 'highlight' }),
          Text({ key: 'sameaddr', x: RIGHT_X, y: ROW1_Y + CELL_H + 24, text: 'same address as before — 0x7ffee258', size: 10.5, mono: true, opacity: 0.6 }),
        ],
      },
      {
        say: 'Two boxes for one name versus one box, two values. Shadowing is a new binding that happens to reuse a name; mutation is the same binding with new contents. Only one of them could ever change type.',
        mark: [],
        shapes: () => [
          header(LEFT_X, 'shadowing: 2 bindings'),
          header(RIGHT_X, 'mutation: 1 binding'),
          Cell({ key: 'x1', x: LEFT_X, y: ROW1_Y, w: CELL_W, h: CELL_H, name: 'x', value: '5', addr: '0x7ffee214', sub: 'i32 — dead end', tone: 'moved', dashed: true }),
          Cell({ key: 'x2', x: LEFT_X, y: ROW2_Y, w: CELL_W, h: CELL_H, name: 'x', value: '"five"', addr: '0x7ffee23c', sub: '&str — live', tone: 'owned' }),
          Cell({ key: 'y', x: RIGHT_X, y: ROW1_Y, w: CELL_W, h: CELL_H, name: 'y (mut)', value: '6', addr: '0x7ffee258', sub: 'i32 — same box throughout', tone: 'owned' }),
        ],
      },
      {
        say: 'A different kind of edit to the same box: `n` holds `i32::MAX`, the largest value four bytes can represent as a signed integer. The next line asks for one more.',
        mark: ['12-13'],
        shapes: () => [
          Text({ key: 'h2', x: 270, y: 66, text: 'let n: i32 = i32::MAX; n += 1;', size: 12, mono: true, weight: 650, opacity: 0.75 }),
          Cell({ key: 'maxCell', x: 270, y: 100, w: 180, h: 56, name: 'n: i32', value: '2147483647', sub: 'i32::MAX', tone: 'owned' }),
        ],
      },
      {
        say: 'The exact same source line means two different things depending on how it was compiled. A debug build inserts an overflow check on every arithmetic operation and panics the instant one fires; a release build strips that check for speed, so the bits simply wrap around to the smallest representable value.',
        mark: [],
        focus: ['debugPanel', 'releasePanel'],
        shapes: () => [
          Cell({ key: 'maxCell', x: 270, y: 60, w: 180, h: 50, name: 'n: i32', value: '2147483647', sub: 'i32::MAX', tone: 'owned' }),
          Box({ key: 'debugPanel', x: 100, y: 190, w: 240, h: 110, label: 'DEBUG BUILD', sub: "panicked: 'attempt to add with overflow'", tone: 'freed', labelSize: 13, mono: true }),
          Box({ key: 'releasePanel', x: 380, y: 190, w: 240, h: 110, label: 'RELEASE BUILD (--release)', sub: 'n = -2147483648  (i32::MIN)', tone: 'highlight', labelSize: 13, mono: true }),
          Tag({ key: 'wraptag', x: 400, y: 310, text: 'same bits, reinterpreted — this is two’s complement wraparound', tone: 'highlight' }),
        ],
      },
    ],
  },

  code: {
    lang: 'rust',
    filename: 'main.rs',
    source: `fn main() {
    let x = 5;
    println!("x = {x} (i32)");

    let x = "five";                 // shadowing: a brand-new binding
    println!("x = {x} (&str)");

    let mut y = 5;
    y = 6;                          // mutation: same binding, same type
    println!("y = {y}");

    let n: i32 = i32::MAX;
    println!("n starts at {n}");

    match n.checked_add(1) {
        Some(v) => println!("checked_add succeeded: {v}"),
        None => println!("checked_add caught the overflow: None"),
    }

    let wrapped = n.wrapping_add(1);
    println!("wrapping_add gives {wrapped} (== i32::MIN: {})", wrapped == i32::MIN);
}`,
    annotations: [
      {
        lines: '5',
        text: 'A second, independent binding. It is legal for this one to have a different type — `mut` could never allow that on the same binding.',
      },
      {
        lines: '8-9',
        text: '`mut` permits a new *value* into the same memory, never a new *type*. `y = "six";` here would not compile.',
      },
      {
        lines: '15-18',
        text: '`checked_add` gives you the overflow question as data — an `Option` you must handle — instead of an answer that silently depends on whether `--release` was passed.',
      },
      {
        lines: '20-21',
        text: '`wrapping_add` requests the release build\'s wraparound behaviour explicitly and unconditionally, so the result no longer depends on build mode at all.',
      },
    ],
  },

  deeper: [
    'Immutable-by-default is not a style preference; it sets up the borrow checker two lessons from now. A binding without `mut` cannot produce a `&mut` reference into it at all, so an entire category of aliasing bugs — two live paths to the same memory where one can write — is refused before you have written a single borrow. Requiring `mut` in the source turns "does this variable change anywhere?" from a search of the whole function into a keyword you can see at the declaration site.',
    'Mechanically, each `let` — even one reusing a name already in scope — introduces a fresh entry in the compiler\'s scope table, and name resolution always binds a use of `x` to the nearest enclosing declaration of `x`. That is the entire mechanism behind shadowing: nothing "shadows" in the sense of hiding at runtime, the old binding simply stops being what later source refers to. For a type that owns a heap allocation, the old value is not specially cleaned up either — Rust drops local values in reverse declaration order when their *scope* ends, so a shadowed `String`\'s buffer stays allocated for the rest of the block, exactly as if it were still reachable.',
    'Shadowing earns its keep in a specific, common pattern: progressively refining one piece of data without inventing a new name at each stage. `let input = read_line(); let input = input.trim(); let input: i32 = input.parse().unwrap();` reads as "this is still conceptually the same input, now trimmed, now parsed" — and only shadowing can do this, because each stage genuinely is a different type, which `mut` flatly disallows.',
    'The debug/release overflow split is a deliberate trade, not an inconsistency. An overflow check is a compare-and-branch on every single arithmetic instruction; in a hot loop that is measurable, and shipping it in every release build was judged not worth the cost given wraparound is well-defined behaviour, not undefined behaviour the way C++ signed overflow is. `wrapping_add`, `checked_add`, `saturating_add` and `overflowing_add` exist precisely so you can pick the behaviour you actually want at the call site, independent of which build profile happens to compile the code.',
    'Type inference fills in `i32` for `x` in `let x = 5;` only because nothing constrains it otherwise — an unsuffixed integer literal defaults to `i32` when no later use pins it to something else, and if that same literal were later passed to a function expecting `u8`, the compiler would infer `u8` for `x` instead. Shadowing plays no special role here: the second `let x` is inferred completely independently, which is exactly why it is free to land on `&str`.',
  ],

  gotchas: [
    'Reading `--release` wraparound as "unsafe" — it is not undefined behaviour, it is a fully specified two\'s-complement wrap. The danger is purely logical: an index or counter that silently becomes huge or negative and corrupts a calculation downstream, with no crash to point at the cause.',
    'Trusting debug-mode panics as your only overflow protection and then shipping `--release` unchanged. The panic — and the safety net it gave you during testing — disappears completely; the arithmetic does not stop being wrong, it just stops telling you.',
    'Expecting `let mut x = 5; x = "five";` to compile because `mut` sounds like it means "anything goes." It does not — the error is a type mismatch, because `mut` only ever permits a new value of the *same* type into the *same* storage.',
    'Shadowing inside a loop body that constructs a heap value each pass — `let s = format!("{i}");` — creates and drops a brand-new `String` on every iteration. The syntax looks identical to updating one variable, so the allocation cost is easy to miss during a review.',
    'Assuming a shadowed binding is somehow mutable because it "changed". `let x = 5; let x = x + 1;` compiles because each `x` is its own fresh, still perfectly immutable, binding — nothing about the first `x` was ever written to.',
  ],

  interview: {
    q: 'What is the difference between `let x = 5; let x = x + 1;` and `let mut x = 5; x = x + 1;`? Do they behave the same, and are they the same underneath?',
    a: [
      'Both compile, both leave `x` printing `6`, and at that level of description they look interchangeable. Underneath they are not: the shadowed version introduces a second, independent binding — a new stack slot as far as the language model is concerned — and name resolution simply points later code at the newest one. The `mut` version has exactly one binding for the whole time, and the second statement overwrites its existing storage in place.',
      'The difference shows up the moment the two sides of the assignment could differ in type. `let x = 5; let x = "five";` is completely ordinary shadowing. The equivalent with `mut` — `let mut x = 5; x = "five";` — is a compile error, because `mut` only ever grants permission to write a new value of the *same* type into the *same* memory; it says nothing about the type itself being allowed to change.',
      'Worth adding unprompted: for a case like this one, where both `x`s end up being the same primitive type, the compiler very often generates identical assembly for the two versions once optimised — the "old" slot is simply dead and its register or stack space gets reused. So the distinction is a language-level guarantee about names and bindings, not necessarily a runtime cost difference; conflating "different at the source level" with "different at the machine level" is exactly the kind of overclaim that makes an answer sound memorised rather than understood.',
    ],
  },

  exercise: [
    'In the [Rust Playground](https://play.rust-lang.org), write `let x = 5; let x = "five"; println!("{x}");` and confirm it compiles and prints `five`. Then change the setup to `let mut x = 5;` followed by `x = "five";` and read the exact type-mismatch error the compiler gives you.',
    'Write the overflow example from this lesson as its own file. Run it once as `cargo run` (debug) and once as `cargo run --release`, and confirm you get a panic in the first case and a silently wrapped `-2147483648` in the second. Then rewrite the increment using `checked_add` and handle the `None` case explicitly, so the program\'s behaviour no longer depends on which command you ran.',
  ],
};
