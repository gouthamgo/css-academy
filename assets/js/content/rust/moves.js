import { Region, Frame, Arrow, Text, Tag, Box } from '../../viz/primitives.js';

const STACK = { x: 46, y: 56, w: 628, h: 300 };
const FW = 210;

const struct2 = (key, x, y, label, fields, tone) =>
  Frame({ key, x, y, w: FW, label, tone, vars: fields });

export default {
  oneLiner:
    'Moves reach further than one assignment: into functions, out of struct fields, and through loops — and the compiler tracks every one of them.',

  whyJob:
    'A field-by-field move out of a struct is the thing that trips people up right after they think they understand ownership — you will hit it in your first real program and an interviewer will hit you with it in the first five minutes.',

  mentalModel:
    'Passing a value into a function is the same move you already know, just with a function boundary instead of a semicolon. And a struct is not one atomic thing to the borrow checker — it is a bundle of fields, so moving *one field* out leaves the rest of the struct alive but the whole no longer usable, like pulling one book off a shelf that was being loaned out as a set.',

  scene: {
    id: 'move-in-out-partial',
    title: 'Moving into a function, and moving out of a struct',
    width: 720,
    height: 400,
    legend: [
      { tone: 'owned', label: 'owns its data' },
      { tone: 'moved', label: 'moved-from' },
    ],
    steps: [
      {
        say: '`consume(s)` passes a `String` into a function. This is exactly the move from the previous lesson — the three-word header travels, the caller loses the name.',
        mark: ['2-3'],
        shapes: () => [
          Region({ key: 'r', ...STACK, label: 'STACK', tone: 'stack' }),
          struct2('s', 70, 90, 's: String', [{ name: 'ptr/len/cap', value: '→ heap', tone: 'owned' }], 'owned'),
        ],
      },
      {
        say: 'Inside `consume`, the parameter owns the buffer now. `s` in `main` cannot be named again.',
        mark: ['3', '7'],
        focus: ['s', 'param'],
        shapes: () => [
          Region({ key: 'r', ...STACK, label: 'STACK', tone: 'stack' }),
          struct2('s', 70, 90, 's', [{ name: 'ptr/len/cap', value: '—', tone: 'moved' }], 'moved'),
          struct2('param', 320, 90, 'consume(s: String)', [{ name: 'ptr/len/cap', value: '→ heap', tone: 'owned' }], 'owned'),
          Arrow({
            key: 'a',
            from: [280, 106],
            to: [320, 106],
            shape: 'straight',
            bend: 0,
            tone: 'owned',
            label: 'moved in',
          }),
        ],
      },
      {
        say: 'Now a struct with two `String` fields. Nothing new yet — the whole struct is owned by `p`.',
        mark: ['10-13'],
        shapes: () => [
          Region({ key: 'r', ...STACK, label: 'STACK', tone: 'stack' }),
          struct2('p', 200, 100, 'p: Person', [
            { name: 'name', value: '→ heap', tone: 'owned' },
            { name: 'email', value: '→ heap', tone: 'owned' },
          ], 'owned'),
        ],
      },
      {
        say: 'Move just the `name` field out — `let n = p.name;`.',
        mark: ['15'],
        predict: {
          ask: 'After `let n = p.name;`, can you still write `p.email`?',
          options: [
            { label: 'No — moving any field kills the whole struct', correct: false },
            { label: 'Yes — only `name` is gone, `email` is untouched', correct: true },
            { label: 'No — this does not compile at all', correct: false },
          ],
          because:
            'The compiler tracks moves field by field, not object by object. `p.email` is perfectly fine to read after this. What you lose is the ability to use `p` as a *whole* — you cannot pass `p` itself anywhere, only its remaining field.',
        },
        shapes: () => [
          Region({ key: 'r', ...STACK, label: 'STACK', tone: 'stack' }),
          struct2('p', 200, 100, 'p: Person', [
            { name: 'name', value: '→ heap', tone: 'owned' },
            { name: 'email', value: '→ heap', tone: 'owned' },
          ], 'owned'),
        ],
      },
      {
        say: 'One field moves out; the other stays exactly where it was. `p.name` is now unusable, `p.email` is fine, and `p` as a whole is "partially moved" — you can no longer pass it anywhere that wants a complete `Person`.',
        mark: ['15', '18'],
        focus: ['p', 'n'],
        shapes: () => [
          Region({ key: 'r', ...STACK, label: 'STACK', tone: 'stack' }),
          struct2('p', 200, 100, 'p: Person (partially moved)', [
            { name: 'name', value: '—', tone: 'moved' },
            { name: 'email', value: '→ heap', tone: 'owned' },
          ], 'highlight'),
          struct2('n', 460, 100, 'n: String', [{ name: 'ptr/len/cap', value: '→ heap', tone: 'owned' }], 'owned'),
          Arrow({
            key: 'a',
            from: [200, 116],
            to: [460, 116],
            shape: 'curve',
            bend: -40,
            tone: 'owned',
            label: 'name moved to n',
          }),
        ],
      },
      {
        say: '`std::mem::take` is the escape hatch: it moves the value out and leaves a fresh default (`String::new()`, empty) behind, so the struct stays whole and usable instead of partially dead.',
        mark: ['22'],
        shapes: () => [
          Region({ key: 'r', ...STACK, label: 'STACK', tone: 'stack' }),
          struct2('p2', 200, 100, 'p2: Person', [
            { name: 'name', value: '"" (fresh)', tone: 'borrowed' },
            { name: 'email', value: '→ heap', tone: 'owned' },
          ], 'owned'),
          struct2('n2', 460, 100, 'n2: String', [{ name: 'ptr/len/cap', value: '→ heap', tone: 'owned' }], 'owned'),
          Tag({ key: 'tt', x: 200, y: 172, text: 'take() leaves a default', tone: 'borrowed' }),
        ],
      },
    ],
  },

  code: {
    lang: 'rust',
    filename: 'main.rs',
    source: `struct Person { name: String, email: String }

fn consume(s: String) {
    println!("took ownership of {s}");
}

fn main() {
    let s = String::from("hi");
    consume(s);                   // moved in — s is dead here on

    let mut p = Person {
        name: String::from("Ada"),
        email: String::from("ada@example.com"),
    };

    let n = p.name;                // moves ONLY p.name out
    println!("{}", p.email);       // fine — email untouched
    // println!("{}", p.name);     // error: p.name was moved

    p.name = std::mem::take(&mut p.name); // no-op, but shows the pattern
    println!("{n}");
}`,
    annotations: [
      {
        lines: '9',
        text: 'Passing `s` to `consume` moves it, identically to `let t = s;`. `s` is unusable in `main` after this line.',
      },
      {
        lines: '15',
        text: 'Moving `p.name` does not move `p`. The compiler tracks ownership per field once you start pulling fields out individually.',
      },
      {
        lines: '20',
        text: '`std::mem::take` swaps in `Default::default()` and hands you the old value — the struct stays fully usable instead of partially moved.',
      },
    ],
  },

  deeper: [
    'Field-level move tracking is implemented in the borrow checker as a set of "moved-out paths", not a single bit on the object. `p.name` and `p.email` are tracked as two separate paths, and reading a path is only rejected if that exact path (or a prefix of it) was moved. This is why `p.email` still works but `p` as a whole does not — using `p` would require reading both fields, and one of them is on the moved list.',
    'This falls apart the moment the type does not let you name the pieces separately — a `Vec<String>` indexed at position 0 cannot be moved out with `v[0]`, because that would leave a hole in a data structure that has no representation for "missing element in the middle". The compiler rejects it outright, and pushes you toward `v.remove(0)` (shifts everything down), `v.swap_remove(0)` (O(1), reorders), or cloning.',
    '`std::mem::take` and `std::mem::replace` exist because "partially moved struct" is often not what you want — you want the field gone from here but the struct to stay whole. `take` swaps in `T::default()`; `replace` swaps in a value you supply. Both return the old value by move, so you get ownership of exactly what you asked for without leaving the container half-alive.',
    'In a loop, a move of the same binding on every iteration is rejected on the *second* iteration, not the first — the compiler proves that path is dead after one pass and refuses to compile a second use. The usual fix is `.clone()` if you truly need N independent copies, or restructuring so you move once, immutably borrow N times, and only move at the very end.',
    'None of this costs anything at runtime beyond the actual `memcpy` of the value\'s own bytes — usually a handful of words. The field-tracking, the partial-move analysis, all of it is compile-time bookkeeping the compiler discards once it has proven your program sound. What you are paying for is authoring effort, not cycles.',
  ],

  gotchas: [
    'Moving out of a struct through a shared reference (`&Person`) is rejected — you cannot move data you only have temporary read access to. This is one of the more confusing early errors because the message talks about "cannot move out of `*self`" rather than anything you wrote directly.',
    'You cannot move out of an indexed collection element (`v[0]`) even when the element type is not `Copy`, because that would leave a gap the collection cannot represent. Use `.remove()`, `.swap_remove()`, or an `Option<T>` slot you can `.take()` from.',
    'A partially-moved struct cannot be passed by value, returned, or matched as a whole — only the still-live fields remain accessible, individually.',
    'Moves inside a loop body are evaluated per iteration by the compiler\'s control-flow analysis, so a move that would be fine "once" is rejected the moment the analysis sees it could execute more than once with the same source still needed.',
  ],

  interview: {
    q: 'You have a struct with a `Vec<u8>` field. Why does `let buf = my_struct.buffer;` sometimes compile and sometimes not, depending on what you do afterward?',
    a: [
      'It always compiles as a move at that line — `my_struct.buffer` is moved into `buf`, and `my_struct.buffer` specifically becomes unusable. What varies is whether the rest of your program tries to use `my_struct` as a *whole* afterward. If you only ever touch its other fields individually, the borrow checker is satisfied. If you try to pass `my_struct` itself to a function, return it, or match it as a complete value, the compiler rejects it because one of its fields has an unresolved move.',
      'The underlying mechanism is that the borrow checker tracks moved-out state per field path rather than per object, so `my_struct.buffer` and `my_struct.other_field` are independent as far as move analysis is concerned. This is deliberate — it is what lets you write destructuring patterns and partial extraction without fighting the checker for something that is obviously sound.',
      'If the goal is to take the buffer out while keeping the struct fully usable — say, to swap in a fresh empty `Vec` and keep processing — `std::mem::take(&mut my_struct.buffer)` is the idiom: it moves the old value out and immediately replaces it with `Default::default()`, so the struct never enters a partially-moved state at all.',
    ],
  },

  exercise: [
    'Write the `Person` struct above, move `name` out, and try to pass `p` itself into a function that takes `Person` by value. Read the exact error — it names the specific field that is missing, which is worth seeing once so you recognise it instantly later.',
    'Then rewrite the same code using `std::mem::take` so `p` stays fully usable throughout, and confirm you can now pass `p` around freely even after "taking" the name out of it.',
  ],
};
