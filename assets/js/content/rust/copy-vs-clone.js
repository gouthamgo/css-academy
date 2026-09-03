import { Box, Region, Cells, Arrow, Text, Tag } from '../../viz/primitives.js';

const box = (key, x, y, label, value, tone) =>
  Box({ key, x, y, w: 130, h: 60, label: value, sub: label, tone, mono: true, labelSize: 16 });

export default {
  oneLiner:
    'The same line of code, `let b = a;`, either copies or moves — and nothing in the syntax tells you which.',

  whyJob:
    'This is the gap between "I read the ownership chapter" and "I understand ownership". Interviewers use exactly this pair of examples because the identical syntax producing different outcomes is what actually separates memorised from understood.',

  mentalModel:
    'Some values are cheap to duplicate exactly by copying their bits — an `i32` is just four bytes with no relationships to anything else, so copying it is indistinguishable from having two independent values. A `String` is not: copying its three-word header naively would leave two owners pointing at one buffer. `Copy` is Rust\'s label for "duplicating the bits *is* a valid duplicate"; when a type cannot honestly wear that label, assignment moves instead, and you must ask explicitly with `.clone()` for a real duplicate.',

  scene: {
    id: 'copy-vs-move-side-by-side',
    title: 'Identical code, two different types',
    width: 720,
    height: 400,
    legend: [
      { tone: 'owned', label: 'valid, usable' },
      { tone: 'moved', label: 'moved-from' },
    ],
    steps: [
      {
        say: 'Two panels, same source line: `let b = a;`. On the left `a` is an `i32`. On the right `a` is a `String`. Watch what happens to each `a` after the line runs.',
        mark: ['2', '7'],
        shapes: () => [
          Text({ key: 'h1', x: 170, y: 40, text: 'a: i32', size: 13, anchor: 'middle', mono: true, tone: 'neutral', weight: 650 }),
          Text({ key: 'h2', x: 550, y: 40, text: 'a: String', size: 13, anchor: 'middle', mono: true, tone: 'neutral', weight: 650 }),
          box('a1', 105, 90, 'a', '5', 'owned'),
          box('a2', 485, 90, 'a', 'ptr/len/cap', 'owned'),
          ...Cells({ key: 'h', x: 485, y: 200, values: ['h', 'i'], w: 40, h: 34, tone: 'heap' }),
          Arrow({ key: 'arr2', from: [550, 150], to: [505, 200], shape: 'curve', bend: 20, tone: 'heap' }),
        ],
      },
      {
        say: '`let b = a;` runs on both sides.',
        mark: ['3', '8'],
        predict: {
          ask: 'After `let b = a;` runs on both sides, which `a` is still usable?',
          options: [
            { label: 'Neither — both are moved', correct: false },
            { label: 'Both — i32 and String behave the same way', correct: false },
            { label: 'Only the i32 — the String\'s `a` is moved-from', correct: true },
          ],
          because:
            'i32 implements Copy, so the bits are duplicated and both a and b hold independent 5s. String does not implement Copy — it owns a heap buffer, so the assignment moves ownership and the left-hand a becomes unusable.',
        },
        shapes: () => [
          Text({ key: 'h1', x: 170, y: 40, text: 'a: i32', size: 13, anchor: 'middle', mono: true, tone: 'neutral', weight: 650 }),
          Text({ key: 'h2', x: 550, y: 40, text: 'a: String', size: 13, anchor: 'middle', mono: true, tone: 'neutral', weight: 650 }),
          box('a1', 105, 90, 'a', '5', 'owned'),
          box('a2', 485, 90, 'a', 'ptr/len/cap', 'owned'),
          ...Cells({ key: 'h', x: 485, y: 200, values: ['h', 'i'], w: 40, h: 34, tone: 'heap' }),
          Arrow({ key: 'arr2', from: [550, 150], to: [505, 200], shape: 'curve', bend: 20, tone: 'heap' }),
        ],
      },
      {
        say: 'On the left, `i32` implements `Copy`: the compiler duplicates the four bytes, and both `a` and `b` are fully independent, valid `5`s. Nothing was allocated — this is indistinguishable from writing `5` twice.',
        mark: ['3'],
        focus: ['a1', 'b1'],
        shapes: () => [
          Text({ key: 'h1', x: 170, y: 40, text: 'a: i32 — Copy', size: 13, anchor: 'middle', mono: true, tone: 'owned', weight: 650 }),
          box('a1', 105, 90, 'a', '5', 'owned'),
          box('b1', 245, 90, 'b', '5', 'owned'),
          Tag({ key: 't1', x: 105, y: 168, text: 'both valid', tone: 'owned' }),
        ],
      },
      {
        say: 'On the right, `String` has no `Copy` implementation — it owns a heap buffer, and duplicating three words while leaving `a` alive would mean two owners for one buffer. So the compiler moves instead: `b` takes the header, `a` is marked dead. Identical syntax, opposite outcome, because the *type* decided.',
        mark: ['8'],
        focus: ['a2', 'b2', 'h'],
        shapes: () => [
          Text({ key: 'h2', x: 550, y: 40, text: 'a: String — not Copy', size: 13, anchor: 'middle', mono: true, tone: 'moved', weight: 650 }),
          box('a2', 445, 90, 'a', '—', 'moved'),
          box('b2', 605, 90, 'b', 'ptr/len/cap', 'owned'),
          ...Cells({ key: 'h', x: 525, y: 200, values: ['h', 'i'], w: 40, h: 34, tone: 'heap' }),
          Arrow({ key: 'arr3', from: [670, 150], to: [565, 200], shape: 'curve', bend: -30, tone: 'heap' }),
        ],
      },
      {
        say: 'To get a genuine second `String`, ask explicitly: `.clone()`. Now a *second* heap buffer exists, `a` stays alive, and you paid for it — an allocation and a byte-for-byte copy — with a method call you can see in the source.',
        mark: ['12'],
        shapes: () => [
          Text({ key: 'h2', x: 550, y: 40, text: 'a.clone()', size: 13, anchor: 'middle', mono: true, tone: 'owned', weight: 650 }),
          box('a2', 445, 90, 'a', 'ptr/len/cap', 'owned'),
          box('c2', 605, 90, 'c', 'ptr/len/cap', 'owned'),
          ...Cells({ key: 'h1', x: 405, y: 200, values: ['h', 'i'], w: 40, h: 34, tone: 'heap' }),
          ...Cells({ key: 'h2c', x: 605, y: 200, values: ['h', 'i'], w: 40, h: 34, tone: 'heap' }),
          Arrow({ key: 'arr4', from: [465, 150], to: [425, 200], shape: 'curve', bend: 20, tone: 'heap' }),
          Arrow({ key: 'arr5', from: [645, 150], to: [625, 200], shape: 'curve', bend: -20, tone: 'heap' }),
          Tag({ key: 't2', x: 470, y: 260, text: 'two independent buffers', tone: 'owned' }),
        ],
      },
    ],
  },

  code: {
    lang: 'rust',
    filename: 'main.rs',
    source: `fn main() {
    let a = 5;
    let b = a;
    println!("{a} {b}");         // fine — both valid, i32 is Copy

    let a = String::from("hi");
    let b = a;
    // println!("{a}");          // error: value moved into b
    println!("{b}");

    let a = String::from("hi");
    let c = a.clone();            // explicit, visible allocation
    println!("{a} {c}");          // both valid — two separate buffers
}`,
    annotations: [
      {
        lines: '2-3',
        text: '`i32` is `Copy`. The assignment duplicates four bytes; `a` stays valid.',
      },
      {
        lines: '6-7',
        text: '`String` is not `Copy`. The identical syntax moves instead — `a` becomes unusable.',
      },
      {
        lines: '12',
        text: '`.clone()` is the explicit request for a real, independent duplicate. It is visible in the source precisely because it costs something.',
      },
    ],
  },

  deeper: [
    '`Copy` is a marker trait — it adds no methods, it only changes what the compiler does with `let b = a;` for that type. A type may implement `Copy` only if every one of its fields is also `Copy`, and only if it does not implement `Drop`. That second restriction is load-bearing: if a type has a destructor, the compiler assumes it owns a resource that must not be silently duplicated, so `Copy` and `Drop` are mutually exclusive by construction.',
    'The rule "small and self-contained" is a good rule of thumb, but the real criterion is whether *bitwise duplication is a valid duplicate of the value*. Integers, floats, `bool`, `char`, and tuples or arrays of `Copy` types all qualify. Anything holding a pointer it is responsible for freeing — `String`, `Vec<T>`, `Box<T>` — cannot, because two copies of the pointer with only one of them responsible for freeing it is exactly the double-free scenario ownership exists to prevent.',
    '`Clone` is the general-purpose escape hatch and is deliberately more expensive and more visible than `Copy`. Every `Copy` type also implements `Clone` (cloning a `Copy` type is just a copy), but the reverse is not true — `String` is `Clone` but not `Copy`, because a clone can be arbitrarily expensive and the language wants that cost to be visible at every call site as an explicit `.clone()`, never hidden inside a plain assignment.',
    'The cost asymmetry matters in practice: a `Copy` of an `i32` is a single register move, essentially free. A `.clone()` of a `String` is a heap allocation plus a byte-for-byte copy of the contents, and cloning a `Vec<String>` clones every element\'s own buffer recursively. Reaching for `.clone()` to silence a borrow-checker error without thinking about what it actually does is one of the most common ways beginner Rust code becomes slow.',
    'You can `#[derive(Clone, Copy)]` on your own struct if every field qualifies, and the compiler will generate the marker for you — but only if it is actually true that duplicating the bits is safe. Deriving `Copy` on a struct that later grows a `String` field is a compile error waiting to surface the moment someone adds that field, which is a useful kind of forcing function.',
  ],

  gotchas: [
    'References are `Copy` even though the type they point at might not be. `&String` is trivially copyable — you are duplicating an address, not the buffer — which is part of why borrowing is cheap.',
    '`.clone()` on an `Rc<T>` or `Arc<T>` does not duplicate the underlying data at all — it increments a reference count and hands back a new smart pointer to the *same* allocation. The name is the same word but the cost is utterly different from cloning a `String`.',
    'A struct cannot derive `Copy` if any field is not `Copy`, and the compiler error for this is usually about the derive itself rather than pointing at the offending field, so it can take a moment to spot which field broke it.',
    '`Copy` types can still be expensive if they are large — a `[u8; 4096]` is `Copy`, and every assignment duplicates all four kilobytes. `Copy` says nothing about size, only about whether bitwise duplication is semantically valid.',
  ],

  interview: {
    q: 'Why can `String` not implement `Copy`, and what would go wrong if it could?',
    a: [
      '`String` owns a heap allocation — its three-word header is a pointer, a length, and a capacity, and the pointer is a promise that this value is responsible for freeing that memory exactly once. `Copy` means the compiler silently duplicates the bits on every assignment with no other bookkeeping. If `String` were `Copy`, `let b = a;` would produce two headers with identical pointers, and now two separate `String` values both believe they own the same buffer.',
      'The failure shows up at the end of both their lifetimes: each one\'s destructor runs and each one calls the allocator to free the same address. The first free succeeds; the second is a double free, which is undefined behaviour and, in the presence of an allocator that reuses freed memory quickly, can corrupt unrelated data that has since been allocated at that address.',
      'This is exactly why `Copy` and `Drop` are defined to be mutually exclusive in the language — a type with a destructor is, by that fact, declaring that it owns something that needs cleanup, and the compiler will not let you also claim that duplicating its bits is a valid, ownership-preserving operation. `String` needs `Drop` to free its buffer, so it cannot be `Copy`, full stop — and that is enforced by the compiler, not by convention.',
    ],
  },

  exercise: [
    'Write a struct with all `Copy`-eligible fields (a couple of `i32`s and a `bool`), derive `Copy` and `Clone` on it, and confirm two independent variables both work after `let b = a;`. Then add a `String` field and watch the derive fail to compile — read the exact error.',
    'Then time cloning a `Vec<String>` of 100,000 short strings versus wrapping the same data in an `Rc<Vec<String>>` and cloning the `Rc` instead. The gap between those two numbers is the entire argument for knowing which kind of "clone" you are paying for.',
  ],
};
