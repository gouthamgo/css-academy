import { Box, Text, Tag, Arrow, Frame } from '../../viz/primitives.js';

const fatPtr = (key, x, y, dataLabel, vtLabel) =>
  [
    Box({ key: `${key}box`, x, y, w: 168, h: 62, label: '&dyn Shape', tone: 'highlight', mono: true, labelSize: 12 }),
    Text({ key: `${key}d`, x: x + 6, y: y + 78, text: `data →  ${dataLabel}`, size: 10.5, mono: true, tone: 'owned', anchor: 'start' }),
    Text({ key: `${key}v`, x: x + 6, y: y + 94, text: `vtbl →  ${vtLabel}`, size: 10.5, mono: true, tone: 'borrowed', anchor: 'start' }),
  ];

export default {
  oneLiner:
    '`dyn Trait` is two pointers stapled together — one to the data, one to a table of function addresses.',

  whyJob:
    'People expect a Rust reference to be one word, and `&dyn Trait` being two is the single most common "wait, what?" moment when reading disassembly or `size_of` output — and it is exactly the mechanism you need when a container has to hold genuinely different types.',

  mentalModel:
    'A generic function is a stencil pressed once per type — but sometimes you cannot know the types in advance, because you want one `Vec` holding a `Circle`, a `Square`, and whatever new shape someone adds next year. `dyn Trait` is the answer: instead of picking the function to call at compile time, you carry *two* addresses everywhere the value goes — one to the actual data, one to a table listing where each of its methods lives — and you look the function up at the moment you call it.',

  scene: {
    id: 'fat-pointer',
    title: 'One word for a generic call, two for a trait object',
    width: 720,
    height: 400,
    legend: [
      { tone: 'owned', label: 'the concrete data' },
      { tone: 'borrowed', label: 'the vtable — method addresses' },
      { tone: 'highlight', label: 'the fat pointer itself' },
    ],
    steps: [
      {
        say: 'A generic call, `fn draw<T: Shape>(s: &T)`, is monomorphized — the compiler knows exactly which type\'s `area()` to call at compile time, so `&T` is one ordinary, single-word pointer.',
        mark: [],
        shapes: () => [
          Text({ key: 'h', x: 360, y: 40, text: 'generic: &T  (one word)', size: 13, anchor: 'middle', mono: true, tone: 'owned', weight: 650 }),
          Box({ key: 'ref', x: 280, y: 90, w: 160, h: 50, label: '&Circle', tone: 'owned', mono: true, labelSize: 13 }),
          Text({ key: 'r2', x: 360, y: 170, text: 'call resolved at compile time — a direct jump', size: 12, anchor: 'middle', mono: true, tone: 'owned', opacity: 0.8 }),
        ],
      },
      {
        say: 'Now the same call written as `&dyn Shape` instead. Which type is behind it is not known until runtime.',
        mark: [],
        predict: {
          ask: 'How many machine words does a `&dyn Shape` reference occupy on the stack?',
          options: [
            { label: 'One — same as any reference', correct: false },
            { label: 'Two — a data pointer and a vtable pointer', correct: true },
            { label: 'It varies depending on which type is behind it', correct: false },
          ],
          because:
            'Every &dyn Shape is exactly two words no matter which concrete type is behind it — that fixed size is what lets it be stored uniformly in a Vec alongside other trait objects of different underlying types.',
        },
        shapes: () => [
          Text({ key: 'h', x: 360, y: 40, text: '&dyn Shape', size: 13, anchor: 'middle', mono: true, tone: 'highlight', weight: 650 }),
          Box({ key: 'ref', x: 280, y: 90, w: 160, h: 50, label: '&Circle', tone: 'owned', mono: true, labelSize: 13, dashed: true }),
        ],
      },
      {
        say: 'Two words, always. The first points at the actual `Circle` data sitting on the heap. The second points at a *vtable* — a small, fixed table of function addresses, one per method `Shape` requires.',
        mark: [],
        focus: ['fpbox', 'data', 'vt'],
        shapes: () => [
          ...fatPtr('fp', 280, 90, '0x7f01', '0x4020'),
          Box({ key: 'data', x: 90, y: 240, w: 150, h: 60, label: 'Circle { r: 4.0 }', tone: 'owned', mono: true, labelSize: 12 }),
          Frame({
            key: 'vt',
            x: 440,
            y: 200,
            w: 190,
            label: 'Circle_vtable',
            tone: 'borrowed',
            vars: [
              { name: 'area', value: '→ Circle::area' },
              { name: 'perimeter', value: '→ Circle::perimeter' },
              { name: 'drop', value: '→ Circle::drop' },
            ],
          }),
        ],
      },
      {
        say: 'Calling `.area()` through the trait object is two hops: follow the vtable pointer to find the table, read the `area` slot, then jump to whatever address is stored there. Two loads and an indirect call — versus zero loads and a direct call for the generic version two steps ago.',
        mark: [],
        focus: ['fpbox', 'vt', 'hop1', 'hop2'],
        shapes: () => [
          ...fatPtr('fp', 280, 90, '0x7f01', '0x4020'),
          Box({ key: 'data', x: 90, y: 260, w: 150, h: 50, label: 'Circle { r: 4.0 }', tone: 'owned', mono: true, labelSize: 12 }),
          Frame({
            key: 'vt',
            x: 440,
            y: 200,
            w: 190,
            label: 'Circle_vtable',
            tone: 'highlight',
            vars: [
              { name: 'area', value: '→ Circle::area', tone: 'highlight' },
              { name: 'perimeter', value: '→ Circle::perimeter' },
              { name: 'drop', value: '→ Circle::drop' },
            ],
          }),
          Arrow({ key: 'hop1', from: [400, 130], to: [440, 220], shape: 'curve', bend: 20, tone: 'highlight', label: '1' }),
          Arrow({ key: 'hop2', from: [510, 246], to: [630, 320], shape: 'curve', bend: 30, tone: 'highlight', label: '2' }),
          Text({ key: 'dest', x: 630, y: 336, text: 'Circle::area()', size: 11, anchor: 'middle', mono: true, tone: 'highlight', weight: 650 }),
        ],
      },
      {
        say: 'This is exactly what buys you a `Vec<Box<dyn Shape>>` — a `Circle` and a `Square` are different sizes and have different `area()` bodies, but every trait object referring to either one is the identical two words, so they line up in one uniform array. The generic version could never do this: `fn draw<T: Shape>` produces one function per concrete `T`, and a `Vec` needs every element to be the same type.',
        mark: [],
        shapes: () => [
          Text({ key: 'h', x: 360, y: 40, text: 'Vec<Box<dyn Shape>>', size: 13, anchor: 'middle', mono: true, tone: 'neutral', weight: 650 }),
          Box({ key: 'c1', x: 80, y: 100, w: 160, h: 60, label: 'dyn Shape', sub: '→ Circle', tone: 'highlight', mono: true, labelSize: 12 }),
          Box({ key: 'c2', x: 280, y: 100, w: 160, h: 60, label: 'dyn Shape', sub: '→ Square', tone: 'highlight', mono: true, labelSize: 12 }),
          Box({ key: 'c3', x: 480, y: 100, w: 160, h: 60, label: 'dyn Shape', sub: '→ Triangle', tone: 'highlight', mono: true, labelSize: 12 }),
          Text({ key: 'note', x: 360, y: 210, text: 'three different concrete types, one uniform element type', size: 12, anchor: 'middle', mono: true, tone: 'neutral', opacity: 0.8 }),
        ],
      },
    ],
  },

  code: {
    lang: 'rust',
    filename: 'main.rs',
    source: `trait Shape {
    fn area(&self) -> f64;
}

struct Circle { r: f64 }
struct Square { side: f64 }

impl Shape for Circle {
    fn area(&self) -> f64 { std::f64::consts::PI * self.r * self.r }
}
impl Shape for Square {
    fn area(&self) -> f64 { self.side * self.side }
}

fn main() {
    let shapes: Vec<Box<dyn Shape>> = vec![
        Box::new(Circle { r: 2.0 }),
        Box::new(Square { side: 3.0 }),
    ];

    for s in &shapes {
        println!("{:.2}", s.area()); // vtable lookup, then indirect call
    }
}`,
    annotations: [
      {
        lines: '16',
        text: '`Box<dyn Shape>` — the box owns the heap data; `dyn Shape` is the trait-object type, always exactly two words wide regardless of the concrete type inside.',
      },
      {
        lines: '17-19',
        text: 'A `Circle` and a `Square` have different sizes and different `area()` code, but as trait objects they are the same width and sit in the same `Vec` uniformly.',
      },
      {
        lines: '21-23',
        text: 'Each `.area()` call is a vtable load followed by an indirect call — resolved at runtime, and not inlinable, unlike the monomorphized generic version.',
      },
    ],
  },

  deeper: [
    'The "fat pointer" name is literal: an ordinary Rust reference like `&i32` is one machine word, exactly a raw address. `&dyn Trait` and `&[T]` (a slice) are both "fat" because they carry a second word of metadata alongside the address — a vtable pointer for trait objects, a length for slices. This is a general pattern in Rust, not something special-cased just for traits.',
    'The vtable itself is generated once per (concrete type, trait) pair by the compiler and placed in static, read-only memory — there is exactly one `Circle`-implements-`Shape` vtable in the whole binary, no matter how many `Circle` trait objects exist at runtime. Every `&dyn Shape` pointing at a `Circle` shares that same vtable pointer.',
    'Not every trait can be made into a trait object — the rules are called object safety. Roughly: the trait\'s methods must not take `Self` by value, must not have generic type parameters of their own, and must not return `Self`. The reasoning traces directly back to the fat-pointer picture — if a method took `self` by value, the compiler would need to know the concrete type\'s size to move it, which is exactly the information a trait object has deliberately erased.',
    'This is the same fundamental tradeoff as C++ virtual dispatch versus templates, for the identical underlying reason: generics resolve at compile time and pay in code size, trait objects resolve at runtime and pay in an indirect call plus the inlining opportunities it forecloses. Rust just makes the choice more visible in the type signature — `T: Shape` versus `dyn Shape` — where C++ leaves it implicit in whether you wrote a template or a virtual function.',
    'The `drop` slot in the vtable is what makes `Box<dyn Trait>` able to free the right amount of memory and run the right destructor when dropped, even though the `Box` itself only knows it is holding "something that implements `Shape`" — it does not know the concrete size or destructor at compile time, so that information has to travel with the vtable too.',
  ],

  gotchas: [
    '`size_of::<&dyn Shape>()` is two words (16 bytes on 64-bit), which surprises people expecting every reference to be pointer-sized. `size_of::<Box<dyn Shape>>()` is the same two words — the box itself is fat, even though it is heap-allocating the data behind it.',
    'A trait with a generic method (`fn process<T>(&self, x: T)`) cannot be made into a trait object at all — there is no way to put every possible monomorphization of that method into one fixed-size vtable. The compiler error names this directly as an object-safety violation.',
    '`dyn Trait` requires the trait\'s methods to not consume `self` by value, because the vtable-based call has no way to move a value whose concrete size is unknown at the call site. Prefer `&self` or `Box<Self>` for methods on traits meant to be used as trait objects.',
    'Calling through a trait object is not inlinable in the general case, because the compiler cannot know at the call site which concrete implementation will run. In a hot loop over a `Vec<Box<dyn Trait>>`, this is exactly the "megamorphic call site" cost the C++ virtual-dispatch lesson covers — the same phenomenon, same fix (sort by type, or switch to an enum with `match` if the type set is closed).',
  ],

  interview: {
    q: 'What is the actual memory layout of `&dyn Trait`, and why does it need to look like that?',
    a: [
      'It is a fat pointer — two machine words rather than one. The first word is an ordinary pointer to the concrete data. The second is a pointer to a vtable: a fixed, per-(type, trait) table of function pointers, one slot per method the trait requires, generated once by the compiler and placed in static memory.',
      'It has to be two words because a trait object deliberately erases the concrete type — the whole point is to let a `Circle` and a `Square` be stored and passed around uniformly as "something implementing `Shape`". But calling `.area()` still has to reach the right code, and with the type erased, the compiler cannot resolve that at compile time the way it does for a generic. So the address of the right function has to travel alongside the data at runtime, which is exactly what the vtable pointer carries.',
      'The consequence worth naming unprompted: a call through `&dyn Trait` is a vtable load followed by an indirect call, which the compiler cannot inline across, because at the call site it does not know which concrete implementation is behind the pointer. This is the direct Rust analogue of C++ virtual dispatch, and the same fix applies when it shows up as a real bottleneck — restructure so the call site is monomorphic, or replace the open trait-object hierarchy with a closed `enum` and `match`, which the compiler can jump-table or fully resolve.',
    ],
  },

  exercise: [
    'Write the `Shape` trait with `Circle` and `Square`, build a `Vec<Box<dyn Shape>>` containing both, and print `std::mem::size_of::<&dyn Shape>()` to confirm it is 16 bytes regardless of which concrete type is behind any given reference.',
    'Then write the same program two ways — once with `Vec<Box<dyn Shape>>` and once with `fn total_area<T: Shape>(shapes: &[T])` called separately for a `Vec<Circle>` and a `Vec<Square>` — and explain in one sentence why the generic version cannot hold both shapes in a single collection while the trait-object version can.',
  ],
};
