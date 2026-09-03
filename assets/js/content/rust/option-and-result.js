import { Box, Text, Arrow } from '../../viz/primitives.js';

/* ------------------------------------------------------------------
   Same byte-strip idiom as the structs-and-enums lesson: a tag
   segment, a padding segment, a payload segment. The reveal of this
   lesson is a step where the tag and padding segments simply do not
   exist — the payload region alone fills the whole footprint.
   ------------------------------------------------------------------ */
const TAG = { x: 60, y: 150, w: 50, h: 64 };
const PAD = { x: 114, y: 150, w: 44, h: 64 };
const PAYLOAD = { x: 162, y: 150, w: 92, h: 64 };
const FULL_W = 194; // TAG.w + PAD.w + PAYLOAD.w — one shared "8 bytes" span

export default {
  oneLiner:
    'Null does not exist in Rust. Absence is a value you have to unwrap — and sometimes the compiler makes checking for it cost nothing at all.',

  whyJob:
    '"Why doesn\'t Rust have null" and "walk me through what `?` actually does" are two of the fastest ways an interviewer tells apart a candidate who has internalised Rust\'s error handling from one who has only seen the syntax in a tutorial.',

  mentalModel:
    'Other languages let almost any reference secretly mean "nothing" — null — so every single use of one is a landmine you have to remember to check by hand. Rust makes "nothing" an ordinary value you have to ask for explicitly: `Option<T>` is a box with two labelled compartments, *Something* and *Nothing*, and the compiler will not let you reach into the Something compartment without first proving you checked which one you have. The elegant part is that the check is sometimes *free*: a reference can never legitimately be the all-zero bit pattern, so Rust reuses that otherwise-impossible pattern as the Nothing label itself — no extra space spent asking the question.',

  scene: {
    id: 'option-niche-and-try',
    title: 'Absence as a value, and the ? operator',
    width: 720,
    height: 400,
    legend: [
      { tone: 'owned', label: 'live tag / in-use bytes' },
      { tone: 'moved', label: 'wasted — reserved but unused' },
      { tone: 'highlight', label: 'the branch actually taken' },
    ],
    steps: [
      {
        say: 'An `Option<i32>` holding `Some(5)`: a tag saying which case this is, some padding, then the `i32` itself. Eight bytes total, and every one of them is doing something.',
        mark: ['17'],
        shapes: () => [
          Text({ key: 'title', x: 60, y: 108, text: 'size_of::<Option<i32>>() = 8 bytes', size: 13, mono: true, weight: 650 }),
          Box({ key: 'tag', ...TAG, label: '1', sub: 'Some', tone: 'owned', mono: true, labelSize: 16 }),
          Box({ key: 'pad', ...PAD, label: 'pad', sub: '3 bytes', tone: 'neutral', dashed: true, opacity: 0.5, mono: true, labelSize: 10 }),
          Box({ key: 'payload', ...PAYLOAD, label: '5', sub: 'i32 payload', tone: 'owned', mono: true, labelSize: 14 }),
        ],
      },
      {
        say: 'The same eight bytes holding `None`: the tag flips to say so, but the four payload bytes are still sitting there, reserved — an `i32` has no bit pattern it does not already use for a real number, so there is nothing that pattern could double as, and the space simply goes to waste.',
        mark: [],
        focus: ['tag', 'payload'],
        shapes: () => [
          Text({ key: 'title', x: 60, y: 108, text: 'size_of::<Option<i32>>() = 8 bytes', size: 13, mono: true, weight: 650 }),
          Box({ key: 'tag', ...TAG, label: '0', sub: 'None', tone: 'owned', mono: true, labelSize: 16 }),
          Box({ key: 'pad', ...PAD, label: 'pad', sub: '3 bytes', tone: 'neutral', dashed: true, opacity: 0.5, mono: true, labelSize: 10 }),
          Box({ key: 'payload', ...PAYLOAD, label: 'wasted', sub: '4 bytes unused', tone: 'moved', dashed: true, opacity: 0.32, mono: true, labelSize: 10 }),
        ],
      },
      {
        say: '`Option<&i32>` is a different story. A valid reference is a real address — it can never legitimately be zero — so Rust reuses the all-zero pattern itself as `None`. There is no separate tag to store at all.',
        mark: ['19'],
        predict: {
          ask: 'How does size_of::<Option<&i32>>() compare to size_of::<&i32>() on its own?',
          options: [
            { label: 'Larger by at least one byte, for the tag', correct: false },
            { label: 'Identical — a reference can never be null, so that impossible bit pattern IS None', correct: true },
            { label: 'Smaller, because Option strips some information from the pointer', correct: false },
          ],
          because:
            'This is the niche optimisation: the compiler knows the full range of bit patterns a valid `&i32` can hold, notices all-zero is never among them, and assigns that one otherwise-wasted pattern to `None`. No tag byte, no padding, nothing added — `Option<&i32>` and `&i32` occupy exactly the same memory.',
        },
        shapes: () => [
          Text({ key: 'title', x: 60, y: 108, text: 'size_of::<Option<&i32>>() = size_of::<&i32>()', size: 13, mono: true, weight: 650 }),
          Box({ key: 'refBox', x: 60, y: 150, w: FULL_W, h: 64, label: 'Option<&i32>', sub: 'Some(0x7ffc50) — a real address', tone: 'owned', mono: true, labelSize: 12.5 }),
          Text({ key: 'callout', x: 60, y: 232, text: 'no tag segment, no padding segment — none needed', size: 11, mono: true, opacity: 0.65 }),
        ],
      },
      {
        say: 'Laid side by side: a bare `&i32`, an `Option<i32>` that had to spend real bytes on a tag, and an `Option<&i32>` that spent nothing extra at all. All three are eight bytes — reached by two completely different routes.',
        mark: [],
        shapes: () => [
          Text({ key: 'rowA', x: 60, y: 90, text: '&i32', size: 12, mono: true, weight: 650, opacity: 0.85 }),
          Box({ key: 'barA', x: 60, y: 100, w: FULL_W, h: 40, tone: 'owned', mono: true, labelSize: 11 }),
          Text({ key: 'sizeA', x: 270, y: 120, text: '8 bytes', size: 12, mono: true, opacity: 0.75 }),

          Text({ key: 'rowB', x: 60, y: 156, text: 'Option<i32>', size: 12, mono: true, weight: 650, opacity: 0.85 }),
          Box({ key: 'barB1', x: 60, y: 166, w: 50, h: 40, label: 'tag', tone: 'owned', mono: true, labelSize: 10 }),
          Box({ key: 'barB2', x: 114, y: 166, w: 44, h: 40, label: 'pad', tone: 'neutral', dashed: true, opacity: 0.5, mono: true, labelSize: 9.5 }),
          Box({ key: 'barB3', x: 162, y: 166, w: 92, h: 40, label: 'i32', tone: 'owned', mono: true, labelSize: 10 }),
          Text({ key: 'sizeB', x: 270, y: 186, text: '8 bytes', size: 12, mono: true, opacity: 0.75 }),

          Text({ key: 'rowC', x: 60, y: 222, text: 'Option<&i32>', size: 12, mono: true, weight: 650, opacity: 0.85 }),
          Box({ key: 'barC', x: 60, y: 232, w: FULL_W, h: 40, label: 'no tag needed', tone: 'owned', mono: true, labelSize: 10.5 }),
          Text({ key: 'sizeC', x: 270, y: 252, text: '8 bytes', size: 12, mono: true, opacity: 0.75 }),
        ],
      },
      {
        say: '`Result<T, E>` is the same tagged union, just named for success and failure instead of presence and absence. `Ok(21)` barely fills its payload region; `Err("bad digit")` — a `String` — fills all of it. The larger variant still decides the whole type\'s footprint, exactly as with any enum.',
        mark: ['3'],
        shapes: () => [
          Text({ key: 'title2', x: 60, y: 100, text: 'Result<i32, String> — Ok and Err share one layout', size: 12.5, mono: true, weight: 650 }),
          Box({ key: 'okTag', x: 60, y: 132, w: 50, h: 50, label: '0', sub: 'Ok', tone: 'owned', mono: true, labelSize: 14 }),
          Box({ key: 'okPad', x: 114, y: 132, w: 60, h: 50, label: 'pad', tone: 'neutral', dashed: true, opacity: 0.5, mono: true, labelSize: 9.5 }),
          Box({ key: 'okUsed', x: 178, y: 132, w: 40, h: 50, label: '21', tone: 'owned', mono: true, labelSize: 12 }),
          Box({ key: 'okWasted', x: 218, y: 132, w: 200, h: 50, label: 'wasted', tone: 'moved', dashed: true, opacity: 0.32, mono: true, labelSize: 10 }),

          Box({ key: 'errTag', x: 60, y: 202, w: 50, h: 50, label: '1', sub: 'Err', tone: 'owned', mono: true, labelSize: 14 }),
          Box({ key: 'errPad', x: 114, y: 202, w: 60, h: 50, label: 'pad', tone: 'neutral', dashed: true, opacity: 0.5, mono: true, labelSize: 9.5 }),
          Box({ key: 'errUsed', x: 178, y: 202, w: 240, h: 50, label: 'String — "bad digit"', tone: 'owned', mono: true, labelSize: 11 }),
        ],
      },
      {
        say: 'Now the other half: `s.parse()?`. Written this way it reads as one step, but it is quietly deciding between two completely different outcomes on every single call.',
        mark: ['4'],
        shapes: () => [
          Box({ key: 'sugar', x: 190, y: 130, w: 340, h: 70, label: 'let n: i32 = s.parse()?;', sub: 'one line — what you write', tone: 'highlight', mono: true, labelSize: 15 }),
          Text({ key: 'q', x: 360, y: 232, text: 'what does the "?" actually do?', size: 12, mono: true, anchor: 'middle', opacity: 0.65 }),
        ],
      },
      {
        say: '`?` is exactly this `match`: on `Ok`, unwrap and keep going as if nothing happened. On `Err`, `return` — not "skip this line", *return from the entire enclosing function*, right here, with that error.',
        mark: ['9-12'],
        focus: ['matchBox', 'okArm', 'errArm'],
        shapes: () => [
          Box({ key: 'matchBox', x: 220, y: 60, w: 280, h: 44, label: 'match s.parse() {', tone: 'neutral', mono: true, labelSize: 12.5 }),
          Arrow({ key: 'toOk', from: [300, 104], to: [140, 180], tone: 'highlight', thick: true, shape: 'curve', bend: -10 }),
          Arrow({ key: 'toErr', from: [420, 104], to: [560, 180], tone: 'freed', thick: true, shape: 'curve', bend: 10 }),
          Box({ key: 'okArm', x: 40, y: 180, w: 200, h: 60, label: 'Ok(v) => v', sub: 'keep going in this function', tone: 'highlight', mono: true, labelSize: 12.5 }),
          Box({ key: 'errArm', x: 460, y: 180, w: 220, h: 60, label: 'Err(e) => return Err(e)', sub: 'exits the WHOLE function now', tone: 'freed', mono: true, labelSize: 11.5 }),
          Text({ key: 'exit', x: 570, y: 268, text: 'the caller sees this Err — nothing after ? ever ran', size: 10.5, mono: true, opacity: 0.65 }),
        ],
      },
    ],
  },

  code: {
    lang: 'rust',
    filename: 'main.rs',
    source: `use std::num::ParseIntError;

fn parse_and_double(s: &str) -> Result<i32, ParseIntError> {
    let n: i32 = s.parse()?;      // sugar: unwrap Ok, or return the Err early
    Ok(n * 2)
}

fn parse_and_double_desugared(s: &str) -> Result<i32, ParseIntError> {
    let n: i32 = match s.parse() {          // what "?" expands to
        Ok(v) => v,                          // Ok: unwrap and keep going
        Err(e) => return Err(e),             // Err: return, right here
    };
    Ok(n * 2)
}

fn main() {
    println!("size_of::<Option<i32>>()  = {}", std::mem::size_of::<Option<i32>>());
    println!("size_of::<&i32>()         = {}", std::mem::size_of::<&i32>());
    println!("size_of::<Option<&i32>>() = {}", std::mem::size_of::<Option<&i32>>());

    let five = 5;
    let some_ref: Option<&i32> = Some(&five);
    let none_ref: Option<&i32> = None;
    println!("{:?} {:?}", some_ref, none_ref);

    assert_eq!(parse_and_double("21").unwrap(), parse_and_double_desugared("21").unwrap());
    match parse_and_double("nope") {
        Ok(v) => println!("doubled: {v}"),
        Err(e) => println!("parse failed: {e}"),
    }
}`,
    annotations: [
      {
        lines: '4',
        text: '`?`: on `Ok`, unwraps to the value and execution continues. On `Err`, it returns from the *whole function* immediately, converting the error type with `From` if the caller\'s error type differs.',
      },
      {
        lines: '9-12',
        text: 'This is exactly what line 4 expands to — a `match` where one arm is an ordinary expression and the other is a `return`, not a plain value.',
      },
      {
        lines: '17, 19',
        text: '`Option<i32>` and `Option<&i32>` are both 8 bytes here, but for different reasons — one spent bytes on a tag, the other did not need to.',
      },
      {
        lines: '26',
        text: 'The sugared and hand-desugared versions produce an identical result on identical input — `?` is not doing anything the second function does not also do, just without writing it out.',
      },
    ],
  },

  deeper: [
    'The standard library defines `Option<T>` as an ordinary enum: `enum Option<T> { None, Some(T) }`. There is nothing magic about it beyond being built in — the reason it eliminates an entire class of null-pointer bugs is that the compiler statically forbids extracting the `T` without first proving, via `match`, `if let`, or an explicit `.unwrap()`, that you handled both cases. "I forgot to check for null" is not a runtime mistake in Rust; it is a program that does not compile.',
    'The niche optimisation applies whenever the compiler can prove a type has at least one bit pattern that is never a valid value: references (`&T`, `&mut T`), `Box<T>`, `NonNull<T>`, and the `NonZero*` integer family all qualify, and it composes through nested enums built from them. It does *not* apply to raw pointers — `*const T` and `*mut T` are legitimately allowed to be null, so `Option<*const T>` is not niche-optimised and does carry a real tag. That distinction is a genuinely useful thing to know: it is part of why the language nudges you toward references over raw pointers whenever ownership rules allow it.',
    '`Result<T, E>` is Rust\'s mechanism for *recoverable* errors, deliberately distinct from `panic!`, which is reserved for bugs the program cannot sensibly continue past. As a plain two-variant enum, it follows the exact same tagged-union layout rules as any other enum: its size is the tag plus padding plus room for whichever of `T` or `E` is larger, which is why a `Result<(), HugeError>` can be surprisingly large even though the success case carries nothing at all.',
    'Under the hood `?` is built on the `Try` trait (`FromResidual` since the operator was stabilised for more than `Result`), but the useful mental model is simpler: on the error path, it calls `From::from` on the error before returning, which is exactly why a function can propagate an inner error type into a different outer error type as long as a `From` conversion exists between them — the mechanism error-handling crates like `anyhow` and `thiserror` lean on heavily. `?` also works on `Option<T>` inside a function returning `Option`, desugaring analogously: `Some(v) => v`, `None => return None`.',
    'None of this costs anything at runtime beyond an ordinary branch. There is no exception object, no stack unwinding machinery, and — thanks to the niche optimisation — sometimes not even any extra memory. Checking whether something is present is compiled down to the same comparison-and-jump as any other `if`, which is the concrete sense in which "no null" is a zero-cost guarantee rather than a safety feature you pay for.',
  ],

  gotchas: [
    'Reaching for `.unwrap()` reflexively to make a type error disappear. It converts a check the compiler was forcing you to make into a panic waiting to happen at exactly the moment you were most confident it would not — fine while prototyping, a liability in anything meant to run unattended.',
    'Expecting the niche optimisation on every `Option<SomeEnum>`. It only fires when the payload type provably has an unused bit pattern. `Option<i32>` genuinely needs the extra tag space, because ordinary integers use every possible bit pattern as a legitimate value — there is nothing spare to steal.',
    'Using `?` where the surrounding function\'s return type does not support it. `?` inside `fn main() { ... }` on a `Result`-returning call is a compile error until `main` itself returns `Result<(), E>` — the operator needs somewhere compatible to return early *to*.',
    'Mixing up which container `?` propagates through. `?` on an `Option` only works in a function returning `Option`; `?` on a `Result` only works in a function returning a compatible `Result`. Reaching for `?` on a `Result` inside a function returning `Option` needs an explicit `.ok()` conversion first.',
    'Treating an unhandled `Err` as somehow automatically logged or dealt with. It is inert data. A `Result` that is never matched, propagated with `?`, or explicitly discarded produces a `#[must_use]` compiler warning specifically because silently dropping a fallible outcome on the floor is such an easy and consequential mistake.',
  ],

  interview: {
    q: 'Why can `Option<&T>` be exactly the same size as `&T`, but `Option<i32>` cannot be the same size as `i32`?',
    a: [
      'It comes down to spare bit patterns. A valid `&T` is a real memory address and can never legitimately be all zeroes, so that one otherwise-impossible pattern is available for the compiler to repurpose as `None` — no separate tag needs to exist, and `Option<&T>` occupies precisely the bytes `&T` would have anyway.',
      'An `i32`, by contrast, uses every one of its bit patterns as a genuine, meaningful value — there is no spare pattern to hand to `None`. The compiler is forced to add an explicit discriminant alongside the payload, and because that discriminant plus its alignment padding takes a whole extra word in practice, `Option<i32>` ends up costing more than `i32` alone.',
      'The generalisation worth stating unprompted: this "niche optimisation" applies to any type with a provably unused bit pattern — references, `Box<T>`, and the `NonZero*` integer types all get it, and it composes through nested enums built from them. Raw pointers are the pointed exception: `*const T` is legitimately allowed to be null, so `Option<*const T>` does not qualify and carries a real tag, which is a small, specific fact that reliably distinguishes someone who has actually looked this up from someone repeating "Option is free" as a slogan.',
    ],
  },

  exercise: [
    'Print `std::mem::size_of` for `i32`, `Option<i32>`, `&i32`, `Option<&i32>`, `Box<i32>`, `Option<Box<i32>>`, `*const i32`, and `Option<*const i32>`. Predict each value before running it, then explain every pair that turns out *not* to match — the raw-pointer case is the one most people get wrong first.',
    'Write the sugared and hand-desugared `?` functions from this lesson side by side, exactly as shown, and confirm with `assert_eq!` that they behave identically on both a valid and an invalid input. Then delete the `return` keyword from the desugared version\'s `Err` arm and read the type error the compiler gives you — it is not a small hint that something is wrong, it is proof that `return` was doing real, load-bearing work in that arm.',
  ],
};
