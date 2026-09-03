import { Bracket, Text, Tag, Box } from '../../viz/primitives.js';

/* RustViz-style layout: time flows downward, one column per binding,
   one row per source line. Column x-positions and per-line y are fixed
   so every step agrees on geometry. */
const COL_V = 180;
const COL_R = 380;
const COL_W = 560;
const LINE_H = 34;
const Y0 = 70;

const y = (line) => Y0 + (line - 1) * LINE_H;

const lineNum = (n) =>
  Text({ key: `ln${n}`, x: 40, y: y(n) + 4, text: String(n), size: 11, anchor: 'end', mono: true, tone: 'neutral', opacity: 0.45 });

const lines = () => Array.from({ length: 9 }, (_, i) => lineNum(i + 1));

const colHeads = (labels) =>
  labels.map(([x, text, tone]) =>
    Text({ key: `h-${text}`, x, y: 44, text, size: 12, anchor: 'middle', mono: true, tone, weight: 650 })
  );

const life = (key, x, fromLine, toLine, tone) =>
  Bracket({
    key,
    x: x - 3,
    y: y(fromLine),
    w: 6,
    label: undefined,
    tone,
    side: 'top',
  });

/* Bracket doesn't do vertical spans directly — draw a thin box instead. */
const spanBar = (key, x, fromLine, toLine, tone, dashed = false) =>
  Box({
    key,
    x: x - 3,
    y: y(fromLine) - 6,
    w: 6,
    h: (toLine - fromLine) * LINE_H + 12,
    label: '',
    tone,
    dashed,
  });

export default {
  oneLiner:
    'Every rule from the last lesson, reframed as something mechanical you can predict instead of something you fight.',

  whyJob:
    'This is the reframe that turns Rust from "the compiler keeps rejecting my code" into "I can tell you exactly which line will fail before I compile" — which is the actual skill an interviewer is checking for when they hand you Rust code that does not build.',

  mentalModel:
    'A borrow is not a fixed reservation for its whole enclosing scope — it is a *span on the timeline of the program*, starting where it is created and ending at its very last use, which is very often long before the closing brace. Once you see borrows as spans that can end early rather than blocks that last until `}`, most "but I already stopped using it!" surprises disappear.',

  scene: {
    id: 'nll-timeline',
    title: 'A borrow ends at its last use, not at the closing brace',
    width: 720,
    height: 380,
    legend: [
      { tone: 'owned', label: 'owner — writable' },
      { tone: 'borrowed', label: 'shared borrow span' },
      { tone: 'freed', label: 'conflict' },
    ],
    steps: [
      {
        say: 'Time runs downward, one row per source line. `v` owns the vector and starts out fully writable — nothing is borrowing it yet.',
        mark: ['1-2'],
        shapes: () => [
          ...lines(),
          ...colHeads([[COL_V, 'v', 'owned']]),
          spanBar('vlife', COL_V, 1, 9, 'owned'),
        ],
      },
      {
        say: '`let r = &v;` on line 3 opens a shared borrow. Its span begins here and — this is the point of the lesson — it will end at whichever line last *reads* `r`, not at the closing brace of whatever block it is in.',
        mark: ['3'],
        shapes: () => [
          ...lines(),
          ...colHeads([[COL_V, 'v', 'owned'], [COL_R, 'r = &v', 'borrowed']]),
          spanBar('vlife', COL_V, 1, 9, 'owned'),
          spanBar('rlife', COL_R, 3, 4, 'borrowed'),
          Text({ key: 'note1', x: COL_R + 70, y: y(3) + 4, text: '← borrow starts', size: 11, mono: true, tone: 'borrowed', opacity: 0.85 }),
        ],
      },
      {
        say: 'Line 4 reads `r` in a `println!`. That is the *last* line that touches `r` anywhere in this function.',
        mark: ['4'],
        predict: {
          ask: 'Line 8 tries `v.push(4)`. Under non-lexical lifetimes, is `r`\'s borrow still considered "alive" at line 8?',
          options: [
            { label: 'Yes — a borrow lasts until its enclosing block ends', correct: false },
            { label: 'No — the borrow ended at line 4, its last use, four lines earlier', correct: true },
          ],
          because:
            'Non-lexical lifetimes means the compiler computes the borrow\'s span from actual uses, not from lexical scope. r\'s span is lines 3–4. By line 8 it has been over for a while, so v.push is completely legal.',
        },
        shapes: () => [
          ...lines(),
          ...colHeads([[COL_V, 'v', 'owned'], [COL_R, 'r = &v', 'borrowed']]),
          spanBar('vlife', COL_V, 1, 9, 'owned'),
          spanBar('rlife', COL_R, 3, 4, 'borrowed'),
          Text({ key: 'note2', x: COL_R + 70, y: y(4) + 4, text: '← last use — span ends here', size: 11, mono: true, tone: 'borrowed', opacity: 0.85 }),
        ],
      },
      {
        say: 'So by line 8, `r`\'s span has already closed — even though line 8 is still lexically inside the same function, possibly the same block. `v.push(4)` needs `&mut v`, and there is no live shared borrow left to conflict with. This compiles.',
        mark: ['8'],
        focus: ['vlife', 'w'],
        shapes: () => [
          ...lines(),
          ...colHeads([[COL_V, 'v', 'owned'], [COL_R, 'r = &v', 'borrowed'], [COL_W, 'push(4)', 'highlight']]),
          spanBar('vlife', COL_V, 1, 9, 'owned'),
          spanBar('rlife', COL_R, 3, 4, 'borrowed'),
          spanBar('w', COL_W, 8, 9, 'highlight'),
          Text({ key: 'ok', x: COL_W, y: y(8) - 16, text: 'OK — r is long dead', size: 11, anchor: 'middle', mono: true, tone: 'owned', weight: 650 }),
        ],
      },
      {
        say: 'Now move that same read of `r` down to line 8, *after* the push. The span has to stretch to cover it.',
        mark: ['3', '8', '9'],
        shapes: () => [
          ...lines(),
          ...colHeads([[COL_V, 'v', 'owned'], [COL_R, 'r = &v', 'borrowed']]),
          spanBar('vlife', COL_V, 1, 9, 'owned'),
          spanBar('rlife2', COL_R, 3, 9, 'borrowed'),
          Text({ key: 'note3', x: COL_R + 90, y: y(9) - 10, text: '← last use moved down here', size: 11, mono: true, tone: 'borrowed', opacity: 0.85 }),
        ],
      },
      {
        say: 'Now the two spans genuinely overlap: `r`\'s borrow is alive on line 8, and `push` needs exclusive access on that same line. This is the actual conflict — not "you used r somewhere in this function," but "these two specific spans overlap in time."',
        mark: ['8'],
        focus: ['rlife2', 'w2', 'overlap', 'err'],
        shapes: () => [
          ...lines(),
          ...colHeads([[COL_V, 'v', 'owned'], [COL_R, 'r = &v', 'borrowed'], [COL_W, 'push(4)', 'freed']]),
          spanBar('vlife', COL_V, 1, 9, 'owned'),
          spanBar('rlife2', COL_R, 3, 9, 'borrowed'),
          spanBar('w2', COL_W, 8, 9, 'freed'),
          Box({
            key: 'overlap',
            x: COL_R - 3,
            y: y(8) - 6,
            w: COL_W - COL_R + 6,
            h: LINE_H,
            label: 'overlap',
            tone: 'freed',
            dashed: true,
            labelSize: 10,
          }),
          Text({
            key: 'err',
            x: 380,
            y: 340,
            text: 'error[E0502]: cannot borrow `v` as mutable because it is also borrowed as immutable',
            size: 11,
            anchor: 'middle',
            mono: true,
            tone: 'freed',
            weight: 650,
          }),
        ],
      },
    ],
  },

  code: {
    lang: 'rust',
    filename: 'main.rs',
    source: `fn main() {
    let mut v = vec![1, 2, 3];

    let r = &v;
    println!("{r:?}");     // r's LAST use — its span ends here

    // ... lines with no mention of r ...

    v.push(4);              // fine: r's borrow already ended
    println!("{v:?}");
}

// Move the println! down to after push(), and the SAME code
// no longer compiles — because now r's span reaches line 8.`,
    annotations: [
      {
        lines: '4-5',
        text: '`r`\'s borrow starts at creation and ends at its last **use**, which is this `println!` — not the end of `main`.',
      },
      {
        lines: '8',
        text: 'By this line `r` is already dead under non-lexical lifetimes, so `v.push` — which needs `&mut v` — has nothing to conflict with.',
      },
      {
        lines: '13-14',
        text: 'Reorder so the read of `r` happens after `push`, and the borrow\'s span now overlaps the mutable borrow. Same lines of code, different order, different verdict.',
      },
    ],
  },

  deeper: [
    'This behaviour is called non-lexical lifetimes, shipped in the 2018 edition, and it replaced an earlier, stricter model where a borrow\'s scope really was tied to its enclosing lexical block. Before NLL, the very first version of this example — where the read happens before the push — would also have failed to compile, because the borrow checker used the block\'s braces as the boundary rather than computing actual last-use. A lot of "Rust is too strict" folklore online predates this change.',
    'The compiler computes these spans via a control-flow analysis, not a simple textual scan. It builds a graph of the function\'s possible execution paths and, for each borrow, finds every point the borrowed reference might still be read from any path forward. This is why the span can differ depending on branches — a borrow used inside only one arm of an `if` has a span that does not extend past that arm on the path where the other branch is taken.',
    'The practical upshot is that the ordering of otherwise-independent statements can be the entire difference between code compiling and not. This surprises people coming from languages where statement order rarely affects *type* correctness. In Rust it very much can, and the fix for a borrow-checker rejection is frequently not to restructure the data at all, but simply to move a read earlier so its span ends before the exclusive access begins.',
    'The error messages are built around this model directly — `error[E0502]` names the exact conflicting borrow and typically points at both the site where it was created and the site of the conflicting access. Reading the *second* location the compiler points to is usually more informative than the first, because it tells you exactly which use is keeping the span alive longer than you expected.',
  ],

  gotchas: [
    'A borrow held inside a struct or a closure keeps that borrow\'s span alive for as long as the struct or closure exists, even if the field or captured variable is never actually read again — because the compiler cannot in general prove a stored reference will not be read later.',
    'Reordering two independent-looking lines can silently fix or silently break compilation, because it changes where a borrow\'s last use falls relative to a conflicting access elsewhere.',
    'A borrow used inside a loop body typically has its span extended to cover every iteration, because the compiler must assume the loop could read it again on the next pass — even if, looking at the logic, you know it will not.',
    'The error always names the conflicting borrow\'s creation site and one of its uses, but the *actual* fix is frequently at a third location: the statement you need to move earlier or later to shrink the span.',
  ],

  interview: {
    q: 'This code fails to compile. Without changing what it computes, how do you fix it, and why does the fix work?\n\n```\nlet r = &v;\nsome_unrelated_setup();\nv.push(1);\nprintln!("{r:?}");\n```',
    a: [
      'The borrow `r` is created on the first line and its last use is the final `println!`, so under non-lexical lifetimes its span covers the entire snippet — including the `v.push(1)` in the middle, which needs `&mut v`. The two spans overlap on that line, so it is rejected.',
      'The fix is to move the `println!("{r:?}")` up, immediately after `r` is created and before `push` — which shrinks `r`\'s span to end right there, well before the mutable borrow begins. The computation is unchanged; only the order of two independent statements moved.',
      'The reason this works is the core idea of the lesson: a borrow\'s lifetime is not its enclosing block, it is the literal span from creation to last use, computed by the compiler\'s control-flow analysis. Moving the last use earlier in the source directly shrinks that computed span. This is also the answer to "the borrow checker rejected my code but I\'m not using the reference anymore" — very often you are, just later in the function than you realised, and the fix is almost always to move a read rather than to clone or restructure data.',
    ],
  },

  exercise: [
    'Type the exact snippet from the code block into the [Rust Playground](https://play.rust-lang.org) with the `println!` placed *after* `v.push(4)`, confirm it fails, then move the `println!` to immediately after `r` is created and confirm it now compiles with no other change.',
    'Then write a version where the borrow is stored in a struct field instead of a local variable, and observe that moving the read no longer helps — the struct itself now holds the borrow for as long as the struct exists. Understanding why that case is different from the simple local-variable case is most of what separates "I can use references" from "I understand lifetimes," which is exactly where the next lesson picks up.',
  ],
};
