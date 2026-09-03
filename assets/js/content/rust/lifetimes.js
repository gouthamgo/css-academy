import { Box, Bracket, Text, Tag, Arrow } from '../../viz/primitives.js';

const Y0 = 130;
const barH = 30;

const bar = (key, x, w, label, tone, y = Y0) =>
  Box({ key, x, y, w, h: barH, label, tone, mono: true, labelSize: 11 });

export default {
  oneLiner:
    'Not a mechanism — a description. A lifetime annotation tells the compiler how long an output stays valid, in terms of how long the inputs do.',

  whyJob:
    'Every function signature that returns a reference eventually needs this, and "why won\'t this compile" for a struct holding a reference is one of the most common real questions people bring to a Rust interview.',

  mentalModel:
    'A lifetime is not something you create or control — it is a *label for a span that already exists*, the same way a sticky note on a package saying "expires: same day as the milk" does not change when the milk expires, it just states the relationship. `fn longest<\'a>(x: &\'a str, y: &\'a str) -> &\'a str` is not creating a new lifetime called `\'a`; it is telling the compiler "whatever I return will not outlive the shorter of these two inputs" — a promise the compiler then checks at every call site.',

  scene: {
    id: 'lifetime-bounds',
    title: 'The output cannot outlive its shortest input',
    width: 720,
    height: 380,
    legend: [
      { tone: 'owned', label: 'valid span' },
      { tone: 'freed', label: 'the overhang — where it would dangle' },
    ],
    steps: [
      {
        say: 'Two strings, `x` and `y`, each with their own span of validity in the caller. `x` is a long-lived `String` in `main`; `y` is a short-lived one inside a nested block that ends early.',
        mark: ['8-11'],
        shapes: () => [
          Text({ key: 'hx', x: 40, y: Y0 + 5, text: 'x', size: 13, anchor: 'end', mono: true, weight: 650 }),
          bar('bx', 60, 560, 'x is valid — the whole function', 'owned', Y0),
          Text({ key: 'hy', x: 40, y: Y0 + barH + 30, text: 'y', size: 13, anchor: 'end', mono: true, weight: 650 }),
          bar('by', 60, 280, 'y is valid — only inside this block', 'owned', Y0 + barH + 20),
        ],
      },
      {
        say: '`longest(&x, &y)` is called while both are alive, and it returns whichever is longer. The function signature says the result cannot outlive *either* input — the shorter one sets the ceiling.',
        mark: ['1', '13'],
        shapes: () => [
          Text({ key: 'hx', x: 40, y: Y0 + 5, text: 'x', size: 13, anchor: 'end', mono: true, weight: 650 }),
          bar('bx', 60, 560, 'x', 'owned', Y0),
          Text({ key: 'hy', x: 40, y: Y0 + barH + 30, text: 'y', size: 13, anchor: 'end', mono: true, weight: 650 }),
          bar('by', 60, 280, 'y', 'owned', Y0 + barH + 20),
          Text({ key: 'hr', x: 40, y: Y0 + 2 * barH + 55, text: 'result', size: 13, anchor: 'end', mono: true, weight: 650, tone: 'highlight' }),
          bar('br', 60, 280, 'result — capped at the SHORTER input, y', 'highlight', Y0 + 2 * barH + 45),
          Arrow({ key: 'cap', from: [340, Y0 + barH + 20], to: [340, Y0 + 2 * barH + 45], shape: 'straight', bend: 0, tone: 'highlight', label: 'ceiling set by y' }),
        ],
      },
      {
        say: 'That is what `\'a` in the signature means: not a specific duration, but a rule — result\'s span is a subset of x\'s span AND a subset of y\'s span. The compiler checks every call against that rule.',
        mark: ['1'],
        predict: {
          ask: 'If `y` goes out of scope but the caller keeps using the returned `result` afterward, what happens?',
          options: [
            { label: 'It works if result actually came from x, since x is still alive', correct: false },
            { label: 'The compiler rejects it — the signature promised result cannot outlive the shorter input, so it enforces that regardless of which branch actually ran', correct: true },
          ],
          because:
            'The compiler does not know at compile time whether longest() returns x or y — it only has the signature\'s promise. So it must enforce the conservative bound for every call, even on the specific runs where the actual returned value happened to be the longer-lived one.',
        },
        shapes: () => [
          Text({ key: 'hx', x: 40, y: Y0 + 5, text: 'x', size: 13, anchor: 'end', mono: true, weight: 650 }),
          bar('bx', 60, 560, 'x', 'owned', Y0),
          Text({ key: 'hy', x: 40, y: Y0 + barH + 30, text: 'y', size: 13, anchor: 'end', mono: true, weight: 650 }),
          bar('by', 60, 280, 'y', 'owned', Y0 + barH + 20),
          Text({ key: 'hr', x: 40, y: Y0 + 2 * barH + 55, text: 'result', size: 13, anchor: 'end', mono: true, weight: 650, tone: 'highlight' }),
          bar('br', 60, 280, 'result — capped at y', 'highlight', Y0 + 2 * barH + 45),
        ],
      },
      {
        say: 'Try to use `result` past the point `y` ends and the compiler rejects it, drawn here as the usage reaching past the ceiling into territory the signature never promised was safe.',
        mark: ['15'],
        focus: ['br', 'overhang', 'err'],
        shapes: () => [
          Text({ key: 'hx', x: 40, y: Y0 + 5, text: 'x', size: 13, anchor: 'end', mono: true, weight: 650 }),
          bar('bx', 60, 560, 'x', 'owned', Y0),
          Text({ key: 'hy', x: 40, y: Y0 + barH + 30, text: 'y', size: 13, anchor: 'end', mono: true, weight: 650 }),
          bar('by', 60, 280, 'y ends here', 'owned', Y0 + barH + 20),
          Text({ key: 'hr', x: 40, y: Y0 + 2 * barH + 55, text: 'result', size: 13, anchor: 'end', mono: true, weight: 650, tone: 'freed' }),
          bar('br', 60, 280, 'result', 'highlight', Y0 + 2 * barH + 45),
          bar('overhang', 340, 220, 'used here — past the promise', 'freed', Y0 + 2 * barH + 45),
          Text({
            key: 'err',
            x: 380,
            y: 340,
            text: 'error[E0597]: `y` does not live long enough',
            size: 12,
            anchor: 'middle',
            mono: true,
            tone: 'freed',
            weight: 650,
          }),
        ],
      },
      {
        say: 'The extreme version of the same rule: a function that tries to return a reference to its own local. There is no input span to tie the output to — the local dies when the function returns, so any reference to it is dangling before the caller even gets it back.',
        mark: [],
        shapes: () => [
          Text({ key: 'hf', x: 40, y: Y0 + 5, text: 'the frame', size: 13, anchor: 'end', mono: true, weight: 650 }),
          bar('bf', 60, 220, 'local — dies when the function returns', 'freed', Y0),
          bar('overhang2', 60, 500, 'a returned reference to it — reaches into nothing', 'freed', Y0 + barH + 20, true),
          Text({
            key: 'err2',
            x: 320,
            y: 260,
            text: 'error: cannot return reference to local variable',
            size: 12,
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
    source: `fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

fn dangling() -> &'static str {
    let s = String::from("local");
    // &s              // ERROR: s dies here, cannot return a ref to it
    "use a literal or return String instead"
}

fn main() {
    let x = String::from("long string");
    let result;
    {
        let y = String::from("short");
        result = longest(&x, &y);
        println!("{result}");      // fine: y is still alive here
    }
    // println!("{result}");       // error[E0597]: \`y\` does not live long enough
}`,
    annotations: [
      {
        lines: '1',
        text: '`<\'a>` declares a lifetime *parameter*. Reading it: whatever this function returns lives no longer than both `x` and `y`.',
      },
      {
        lines: '5-9',
        text: 'No input reference to tie the output to — a local\'s address becomes invalid the instant the function returns. The compiler catches this even without you writing a lifetime at all.',
      },
      {
        lines: '17',
        text: 'Uncomment this and it fails: `y` — and therefore `result`, per the signature\'s promise — is dead by this point.',
      },
    ],
  },

  deeper: [
    'Most functions never need an explicit lifetime annotation because of elision rules: if there is exactly one reference parameter, its lifetime is assumed for the return type; if there are multiple parameters but one is `&self` or `&mut self`, the return is assumed to share the receiver\'s lifetime. `longest` needs an explicit `\'a` precisely because it has two independent reference parameters and the compiler has no rule for picking one over the other — you have to state the relationship yourself.',
    'A lifetime parameter does not make anything live longer. It is purely a description the compiler checks, not an instruction that changes runtime behaviour. `<\'a>` compiles to nothing at all — there is no lifetime value at runtime, no tag stored anywhere, no cost. This is worth saying explicitly because the syntax makes it look like you are declaring a variable, and you are not.',
    'The place lifetimes stop being optional is a struct holding a reference: `struct Excerpt<\'a> { text: &\'a str }`. Without the annotation the compiler cannot know how long an `Excerpt` is allowed to live relative to the string it borrows from, so it requires you to state it. Once stated, the compiler enforces that no `Excerpt` outlives the string it points into — which is the struct-level version of exactly the rule from this lesson\'s diagram.',
    '`\'static` is a special lifetime meaning "valid for the entire remainder of the program" — string literals have it automatically, because they are baked into the binary\'s read-only data section and exist as long as the program runs. It shows up as a return type on functions that hand back a literal, and it is sometimes reached for as a quick fix to a lifetime error — which usually just moves the problem, because it is a promise the compiler will hold you to just as strictly as any other lifetime.',
    'Lifetime bounds compose the same way trait bounds do, because they *are* a kind of bound: `fn f<\'a, T: \'a>(...)` says the type `T` must not contain any references shorter-lived than `\'a`. This is the mechanism generic containers use to guarantee a `Container<T>` cannot outlive borrowed data that `T` itself might be holding.',
  ],

  gotchas: [
    'A lifetime parameter on a function is not something you choose — it is inferred from the shortest input span that satisfies the body, and if you write it wrong the compiler tells you exactly where the mismatch is, which is usually easier to fix than to have predicted.',
    'The error "borrowed value does not live long enough" almost always points at where the value was created, and the fix is almost never to "add a lifetime" — it is to restructure so the borrowed value actually outlives its use, often by moving a `let` binding to an outer scope.',
    'Struct fields holding references force every method and every usage site of that struct to also carry the lifetime parameter, which tends to spread through a codebase. This is a real signal, not just syntax noise — it usually means the struct would be simpler if it owned its data (`String` instead of `&str`) rather than borrowing it.',
    '`\'static` on a return type is a strong promise — "this is valid for the rest of the program" — and reaching for it to silence an error is a common beginner move that usually just relocates the actual problem to wherever the caller tries to use a non-static value where you claimed a static one was fine.',
  ],

  interview: {
    q: 'What does the lifetime annotation in `fn first_word<\'a>(s: &\'a str) -> &\'a str` actually do?',
    a: [
      'It states a relationship, not an instruction. It says: whatever reference this function returns is valid for no longer than the input `s` is valid. It does not extend anyone\'s lifetime, allocate anything, or exist at runtime at all — it is purely information the compiler uses to check every call site.',
      'Concretely, this means a caller cannot keep using the returned slice after the string `s` borrowed from has gone out of scope or been dropped — the compiler will reject that exactly as if you had tried to use `s` itself after its scope ended, because the return value\'s validity is now tied to it.',
      'In this particular case the annotation is actually optional — the elision rules cover it automatically, since there is exactly one reference parameter and the compiler assumes the output shares its lifetime. Where you actually need to write it out is when a function takes more than one reference parameter and the output could plausibly be tied to either — like `longest(x: &str, y: &str)` — because then the compiler has no rule to guess from and needs you to state which relationship holds.',
    ],
  },

  exercise: [
    'Write `longest` exactly as shown, call it with a long-lived `x` and a `y` that goes out of scope early, and confirm the error when you try to use the result after `y` dies. Read the message carefully — it names `y`, not `result`, as the thing that does not live long enough, which is the compiler tracing the promise back to its source.',
    'Then write a struct `Excerpt<\'a> { text: &\'a str }` with a method that returns `&\'a str`, and try to construct one from a `String` that is dropped before the `Excerpt` is used. Watching the compiler catch a struct-level dangling reference, rather than just a function-return one, is what makes the general rule click.',
  ],
};
