import { Box, Text, Tag, Arrow } from '../../viz/primitives.js';

const stencil = (key, x, y, label) =>
  Box({ key, x, y, w: 260, h: 74, label, tone: 'highlight', dashed: true, mono: true, labelSize: 13 });

const stamped = (key, x, y, label, tone = 'owned') =>
  Box({ key, x, y, w: 200, h: 54, label, tone, mono: true, labelSize: 12 });

export default {
  oneLiner:
    'A generic function is a stencil. The compiler stamps out a separate, fully concrete copy for every type you actually call it with.',

  whyJob:
    'This is the mechanism that makes Rust\'s "zero-cost abstraction" claim literally true for generics — and the honest cost that comes with it is exactly the kind of tradeoff an interviewer wants to hear you name unprompted.',

  mentalModel:
    'A function written over `<T>` is not compiled as generic machine code that branches on type at runtime — it is a stencil. The compiler does not produce anything runnable from the stencil alone; only when you call `largest::<i32>(...)` does it press the stencil down and stamp out a genuine, ordinary, fully-specialized `fn largest_i32(...)`, then compile that. Call it again with `f64` and you get a second, completely separate stamped copy.',

  scene: {
    id: 'monomorphization',
    title: 'One stencil, one stamp per type',
    width: 720,
    height: 380,
    legend: [
      { tone: 'highlight', label: 'the generic stencil — never runs directly' },
      { tone: 'owned', label: 'a stamped, concrete instantiation' },
    ],
    steps: [
      {
        say: 'The source has one generic function. Nothing here is executable yet — `T` is a placeholder, not a type.',
        mark: ['1-3'],
        shapes: () => [
          stencil('s', 230, 60, 'fn largest<T: PartialOrd>(list: &[T]) -> T'),
        ],
      },
      {
        say: 'Call it with `&[i32]`. The compiler presses the stencil down for `T = i32` and stamps out a real function — this one, and only this one, gets compiled to machine code.',
        mark: ['7'],
        shapes: () => [
          stencil('s', 230, 60, 'fn largest<T: PartialOrd>(...)'),
          stamped('i32v', 90, 190, 'largest::<i32>\n(compiled)', 'owned'),
          Arrow({ key: 'a1', from: [230, 134], to: [190, 190], shape: 'straight', bend: 0, tone: 'owned', label: 'T = i32' }),
        ],
      },
      {
        say: 'Call it again with `&[f64]` elsewhere in the program. That is a *different* type, so the compiler presses the stencil a second time and produces a second, entirely separate function.',
        mark: ['8'],
        shapes: () => [
          stencil('s', 230, 60, 'fn largest<T: PartialOrd>(...)'),
          stamped('i32v', 90, 190, 'largest::<i32>\n(compiled)', 'owned'),
          stamped('f64v', 340, 190, 'largest::<f64>\n(compiled)', 'owned'),
          Arrow({ key: 'a1', from: [230, 134], to: [190, 190], shape: 'straight', bend: 0, tone: 'owned', label: 'T = i32' }),
          Arrow({ key: 'a2', from: [270, 134], to: [400, 190], shape: 'straight', bend: 0, tone: 'owned', label: 'T = f64' }),
        ],
      },
      {
        say: 'Call `largest::<i32>` a second time somewhere else in the program.',
        mark: [],
        predict: {
          ask: 'A second, unrelated call site also uses `largest::<i32>`. Does the compiler stamp out a THIRD function?',
          options: [
            { label: 'Yes — every call site gets its own stamped copy', correct: false },
            { label: 'No — it reuses the existing largest::<i32> instantiation, since the type is identical', correct: true },
          ],
          because:
            'Monomorphization keys off the concrete type, not the call site. Every call with T = i32 shares the one i32 instantiation; a distinct copy only appears for a genuinely distinct type.',
        },
        shapes: () => [
          stencil('s', 230, 60, 'fn largest<T: PartialOrd>(...)'),
          stamped('i32v', 90, 190, 'largest::<i32>\n(compiled)', 'owned'),
          stamped('f64v', 340, 190, 'largest::<f64>\n(compiled)', 'owned'),
        ],
      },
      {
        say: 'Reused, not restamped. Every call site passing `i32` shares this one instantiation — the compiler keys purely off the concrete type, never off where in the source the call happens to appear.',
        mark: [],
        focus: ['i32v', 'reuse'],
        shapes: () => [
          stencil('s', 230, 60, 'fn largest<T: PartialOrd>(...)'),
          stamped('i32v', 90, 190, 'largest::<i32>\n(compiled, shared)', 'owned'),
          stamped('f64v', 340, 190, 'largest::<f64>\n(compiled)', 'owned'),
          Tag({ key: 'reuse', x: 90, y: 262, text: 'every i32 call reuses this', tone: 'owned' }),
        ],
      },
      {
        say: 'Inside each stamped copy the comparison `a > b` is not a runtime dispatch of any kind — it is resolved at compile time to `i32`\'s comparison, or `f64`\'s, exactly as if you had written two separate non-generic functions by hand. This is what "zero-cost" means here: no vtable, no branch, nothing left over at runtime that names `T`.',
        mark: ['3'],
        shapes: () => [
          stamped('i32v', 90, 130, 'largest::<i32>', 'owned'),
          Text({ key: 'i1', x: 190, y: 210, text: 'a > b  →  i32::gt', size: 12, anchor: 'middle', mono: true, tone: 'owned', weight: 600 }),
          stamped('f64v', 400, 130, 'largest::<f64>', 'owned'),
          Text({ key: 'f1', x: 500, y: 210, text: 'a > b  →  f64::gt', size: 12, anchor: 'middle', mono: true, tone: 'owned', weight: 600 }),
          Text({ key: 'note', x: 340, y: 280, text: 'two ordinary, unrelated functions — nothing generic left at runtime', size: 12, anchor: 'middle', mono: true, tone: 'neutral', opacity: 0.75 }),
        ],
      },
      {
        say: 'The honest cost is on the other side of the ledger: every distinct type you instantiate a generic with is more machine code in the binary. A generic function used with twenty different types produces roughly twenty copies of its body, and that is real binary size and real compile time, even though none of it is runtime overhead.',
        mark: [],
        shapes: () => [
          Text({ key: 'l', x: 60, y: 90, text: 'instantiations →', size: 12, mono: true, tone: 'neutral', anchor: 'start', opacity: 0.7 }),
          ...['i32', 'f64', 'u8', 'String', '...'].map((t, i) =>
            stamped(`bloat${i}`, 220 + i * 70, 70, t, i < 3 ? 'owned' : 'highlight')
          ),
          Text({ key: 'meter', x: 340, y: 220, text: 'binary size: growing with each new T', size: 13, anchor: 'middle', mono: true, tone: 'freed', weight: 650 }),
        ],
      },
    ],
  },

  code: {
    lang: 'rust',
    filename: 'main.rs',
    source: `fn largest<T: PartialOrd + Copy>(list: &[T]) -> T {
    let mut biggest = list[0];
    for &item in list {
        if item > biggest { biggest = item; }
    }
    biggest
}

fn main() {
    let ints = vec![10, 25, 3, 47, 8];
    let floats = vec![1.2, 5.5, 0.3];

    println!("{}", largest(&ints));      // stamps largest::<i32>
    println!("{}", largest(&floats));    // stamps largest::<f64>
    println!("{}", largest(&[99, 2, 4])); // reuses largest::<i32>
}`,
    annotations: [
      {
        lines: '1',
        text: '`T: PartialOrd + Copy` is a trait bound — it restricts which types `T` may be to ones that support `>` and are cheap to duplicate. Without it, `item > biggest` would not compile for an unconstrained `T`.',
      },
      {
        lines: '11-12',
        text: 'Two calls, two different concrete types, two separate stamped functions compiled — neither knows the other exists.',
      },
      {
        lines: '13',
        text: 'Same type as the first call. The compiler reuses the existing `largest::<i32>` rather than stamping a third copy.',
      },
    ],
  },

  deeper: [
    'This process is called monomorphization — literally "making into one shape" — and it runs during compilation, well before any machine code is emitted for the generic body itself. The generic function as written is never directly compiled to an executable form; it exists only as a template the compiler consults once per distinct type parameter combination actually used in the program.',
    'The trait bound (`T: PartialOrd`) is not a runtime check of any kind — it is purely a compile-time gate on which types are even allowed to be stamped. If you tried to call `largest` with a type that does not implement `PartialOrd`, the *call site* fails to compile, with an error naming the missing trait, rather than the failure surfacing at some later, harder-to-trace point.',
    'This is the direct cause of two things people notice about Rust: slow-feeling compile times on large generic-heavy codebases, and binary size that grows with the number of distinct types a generic API is used with. Both are the same phenomenon — every instantiation is genuinely separate code, generated and optimized independently. `cargo bloat` is the standard tool for finding out which instantiations are actually taking up the space.',
    'The alternative is trait objects (`dyn Trait`), covered in the next lesson, which trade this compile-time cost for a runtime one: one shared function operating through an indirect call, at the cost of that indirection and the loss of inlining. Generics and trait objects are the same tradeoff C++ templates versus virtual functions make, and for the same underlying reason — the question is always whether the dispatch decision is knowable at compile time.',
    'Rust\'s standard library leans heavily on monomorphization specifically because so much of it — `Vec<T>`, `Option<T>`, iterators — needs to be genuinely zero-cost. A `Vec<i32>` and a `Vec<String>` share no code at runtime whatsoever; each is compiled as if you had hand-written a completely separate, specialized vector type for exactly that element type.',
  ],

  gotchas: [
    'A large generic function instantiated with many types can noticeably slow down compilation and bloat the binary, even though every individual instantiation is fast at runtime. This tradeoff is invisible until you profile `cargo build` times or binary size on a real project.',
    'Trait bounds are checked at the definition, not just at each call site — but the actual monomorphized code is only generated lazily, for combinations that are genuinely used. An unused generic function with an unsatisfiable bound for some hypothetical type is not an error, because that instantiation never happens.',
    '`impl Trait` in argument position (`fn f(x: impl Display)`) is sugar for a generic parameter and monomorphizes exactly like `<T: Display>` does — it is easy to mistake for dynamic dispatch because it reads similarly to a trait object, but it is not one.',
    'Const generics (`struct Buf<const N: usize>`) monomorphize the same way ordinary type generics do — `Buf<4>` and `Buf<8>` are two entirely separate stamped types, which is exactly why a fixed-size array type can be zero-cost at any size.',
  ],

  interview: {
    q: 'Rust generics are described as "zero-cost". What does that actually mean, and what do you pay for it?',
    a: [
      'It means that at runtime, a generic function call carries no more overhead than if you had hand-written a separate, non-generic version for each type you actually use — no runtime type check, no dispatch table, no branch on which type `T` is. This is achieved through monomorphization: the compiler treats the generic definition as a stencil and, for every distinct combination of type parameters actually invoked in the program, stamps out and independently compiles a fully concrete copy.',
      'So the comparison inside a generic `largest<T: PartialOrd>` resolves at compile time to exactly `i32`\'s comparison operator for the `i32` instantiation, with nothing left over that mentions `T` — the optimizer sees it exactly as it would see a hand-specialized function, and can inline it, vectorize it, whatever it would do for ordinary code.',
      'What is not free is compile time and binary size. Every distinct type parameter combination is genuinely separate generated code, so a generic function used across twenty different types produces roughly twenty copies of its body in the binary, each compiled and optimized independently. This is the same fundamental tradeoff C++ templates make versus virtual dispatch — pay at compile time and in code size, in exchange for zero runtime indirection. If that tradeoff is wrong for a given case — say, a very large function used with many types where code size actually matters more than the last few nanoseconds — `dyn Trait` is the escape hatch that moves the cost back to runtime in exchange for one shared implementation.',
    ],
  },

  exercise: [
    'Write `largest<T: PartialOrd + Copy>` as shown, call it with three different types (`i32`, `f64`, and a custom struct implementing `PartialOrd`), and run `cargo build --release` followed by `nm` or `cargo bloat` to confirm three separate compiled symbols exist for the three instantiations.',
    'Then call it fifteen more times with fifteen more distinct types (wrapper newtypes around `i32` work fine for this) and watch both the binary size and the compile time grow. Seeing the cost show up as a real, measurable number rather than an abstract warning is the point of the exercise.',
  ],
};
