import { Box, Text, Tag, Arrow } from '../../viz/primitives.js';

const structPanel = (key, x, title, fields, tone) =>
  Box({ key, x, y: 120, w: 200, h: 40 + fields.length * 22, label: title, sub: fields.join('\n'), tone, mono: true, labelSize: 12 });

export default {
  oneLiner:
    'A closure is a compiler-generated struct holding its captured variables, with the closure body as one method — and what it does with those captures decides which of three traits it implements.',

  whyJob:
    'Fn/FnMut/FnOnce trips up almost everyone the first time a closure is passed into an API expecting a specific one, and being able to say *why* a given closure only implements one of the three is a fast, concrete way to demonstrate real understanding rather than memorised syntax.',

  mentalModel:
    'A closure that reads a captured variable is a struct holding a reference to it, with a method that reads through that reference — call it as many times as you like. A closure that mutates a capture is the same idea with a mutable reference. A closure that *consumes* a capture — moves it out, drops it — can only be called once, because the second call would need to consume something that is already gone. `Fn`, `FnMut`, `FnOnce` are exactly these three shapes, and the compiler picks the trait based on what the closure body actually does, not on how you wrote it.',

  scene: {
    id: 'closure-desugar',
    title: 'What a closure really is',
    width: 720,
    height: 400,
    legend: [
      { tone: 'borrowed', label: 'Fn — reads via &' },
      { tone: 'highlight', label: 'FnMut — writes via &mut' },
      { tone: 'freed', label: 'FnOnce — consumes, callable once' },
    ],
    steps: [
      {
        say: 'A closure that reads a captured `String`: `let greet = || println!("hi {name}");`. The compiler generates a hidden struct with `name` as a field, holding a *shared reference* to it, and an `operator()`-like method that reads through that reference.',
        mark: ['2'],
        shapes: () => [
          Text({ key: 'src', x: 360, y: 60, text: '|| println!("hi {name}")', size: 13, anchor: 'middle', mono: true, tone: 'neutral', weight: 600 }),
          Arrow({ key: 'ar', from: [360, 76], to: [360, 108], shape: 'straight', bend: 0, tone: 'borrowed', label: 'desugars to' }),
          structPanel('s1', 260, 'struct Closure1', ['name: &String'], 'borrowed'),
          Tag({ key: 't1', x: 300, y: 250, text: 'implements Fn — callable any number of times', tone: 'borrowed' }),
        ],
      },
      {
        say: 'A closure that mutates a captured counter: `|| { count += 1; }`. The generated struct now holds a *mutable* reference, because that is what the body needs.',
        mark: [],
        shapes: () => [
          Text({ key: 'src', x: 360, y: 60, text: '|| { count += 1; }', size: 13, anchor: 'middle', mono: true, tone: 'neutral', weight: 600 }),
          Arrow({ key: 'ar', from: [360, 76], to: [360, 108], shape: 'straight', bend: 0, tone: 'highlight', label: 'desugars to' }),
          structPanel('s2', 260, 'struct Closure2', ['count: &mut i32'], 'highlight'),
          Tag({ key: 't2', x: 280, y: 250, text: 'implements FnMut — callable repeatedly, needs &mut', tone: 'highlight' }),
        ],
      },
      {
        say: 'A closure that consumes its capture: `move || drop(buffer)`. Now the field is the *owned* value itself, not a reference.',
        mark: [],
        predict: {
          ask: 'This closure moves `buffer` out and drops it inside its body. What happens if you call it a second time?',
          options: [
            { label: 'It runs again fine — buffer is recreated each call', correct: false },
            { label: 'It does not compile — calling it twice would consume buffer twice', correct: true },
            { label: 'It panics at runtime on the second call', correct: false },
          ],
          because:
            'A closure that consumes a capture only implements FnOnce, and the type system enforces "callable once" at compile time — a second call site is rejected, not a runtime panic.',
        },
        shapes: () => [
          Text({ key: 'src', x: 360, y: 60, text: 'move || drop(buffer)', size: 13, anchor: 'middle', mono: true, tone: 'neutral', weight: 600 }),
          Arrow({ key: 'ar', from: [360, 76], to: [360, 108], shape: 'straight', bend: 0, tone: 'freed', label: 'desugars to' }),
          structPanel('s3', 260, 'struct Closure3', ['buffer: Vec<u8>'], 'freed'),
        ],
      },
      {
        say: 'This one implements only `FnOnce` — its call method takes `self` *by value*, because calling it necessarily consumes `buffer`. There is no way to call it a second time; the second call site simply does not compile, because the closure itself no longer exists after the first call.',
        mark: [],
        focus: ['s3', 't3', 'err'],
        shapes: () => [
          structPanel('s3', 260, 'struct Closure3', ['buffer: Vec<u8>'], 'freed'),
          Tag({ key: 't3', x: 280, y: 250, text: 'implements FnOnce only — one call, ever', tone: 'freed' }),
          Text({
            key: 'err',
            x: 360,
            y: 300,
            text: 'error: use of moved value — closure was already called',
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
    source: `fn call_fn(f: impl Fn())          { f(); f(); }        // needs Fn
fn call_fn_mut(mut f: impl FnMut()) { f(); f(); }        // needs FnMut
fn call_fn_once(f: impl FnOnce())  { f(); }               // needs FnOnce

fn main() {
    let name = String::from("Ada");
    call_fn(|| println!("hi {name}"));        // only reads -> Fn

    let mut count = 0;
    call_fn_mut(|| count += 1);               // mutates -> FnMut
    println!("{count}");

    let buffer = vec![1, 2, 3];
    call_fn_once(move || drop(buffer));       // consumes -> FnOnce only
    // call_fn_once(move || drop(buffer));    // error: buffer already moved
}`,
    annotations: [
      {
        lines: '1-3',
        text: 'Three functions, each requiring a different closure trait bound. `Fn` is the strictest (most callers accept it); `FnOnce` is the loosest.',
      },
      {
        lines: '7',
        text: 'This closure only reads `name` — the compiler infers `Fn`, the least restrictive trait it satisfies.',
      },
      {
        lines: '15',
        text: '`move` forces the closure to take ownership of `buffer` rather than borrow it. Combined with `drop` inside, this closure can only implement `FnOnce`.',
      },
    ],
  },

  deeper: [
    'The three traits form a hierarchy in capability, not in restriction: every `Fn` is also an `FnMut` (calling it repeatedly with only shared access is a special case of calling it repeatedly with the option of mutable access), and every `FnMut` is also an `FnOnce` (calling it repeatedly is a special case of calling it once). This is why `call_fn_once` in the example above happily accepts closures that also implement `Fn` — accepting the loosest bound a function actually needs is the idiomatic default, exactly parallel to preferring `&T` over `&mut T` when read access is all that is required.',
    'The compiler chooses which trait(s) a given closure implements entirely by inspecting the body — there is no syntax to declare it explicitly. A closure that merely happens not to mutate its captures gets `Fn` even if you never intended it that way; if you later add a line that mutates a capture, the same closure literal silently becomes `FnMut`-only, and any call site that required `Fn` specifically will stop compiling.',
    '`move` controls *how* variables are captured — by reference (the default) or by value — which is a separate axis from the Fn/FnMut/FnOnce trait, though the two interact. `move || count += 1` still only implements `FnMut`, because moving `count` in and then mutating it in place does not consume it; the closure owns `count` now, but each call still just mutates the same owned value rather than using it up.',
    'Returning a closure from a function requires naming its type somehow, and because every closure is a distinct, compiler-generated, unnameable type, the two idioms are `impl Fn() -> i32` (works when there is exactly one concrete closure type being returned, resolved at compile time) or `Box<dyn Fn() -> i32>` (works when different branches might return different closures, at the cost of a heap allocation and dynamic dispatch — the trait-object tradeoff from two lessons ago, applied to closures specifically).',
    'Closures capture only the variables their body actually references, and (since the 2021 edition) can capture individual struct fields rather than the whole struct when that is all the body touches — `|| self.x + 1` captures `self.x`, not all of `self`, which matters for whether other fields of `self` remain independently usable.',
  ],

  gotchas: [
    'A closure that reads a capture through a method that happens to require `&mut self` internally — like calling `.push()` on a captured `Vec` — implements `FnMut`, even though the closure body only "reads" the vector conceptually; `push` needs exclusive access, so the closure does too.',
    'Functions that take `impl Fn()` reject `FnMut` and `FnOnce` closures outright, which surprises people used to thinking of the three as interchangeable — a closure that mutates anything cannot satisfy an `Fn` bound, full stop, no matter how the caller intends to use it.',
    '`move` closures still only borrow if the body never mutates or consumes the moved-in value — `move` changes how the *variable* is captured (by value into the closure), not automatically which trait the closure implements.',
    'A `Box<dyn FnMut()>` stored somewhere and called repeatedly needs to be stored as `mut` (or behind a `RefCell`/`Mutex`) because each call needs `&mut self` on the boxed closure — a very common friction point when building a simple callback registry.',
  ],

  interview: {
    q: 'A closure captures a `String` by reference and only reads it inside its body. Which of Fn, FnMut, FnOnce does it implement, and why does that matter for a function accepting it as a parameter?',
    a: [
      'Just reading a capture means the compiler-generated struct holds a shared reference to it, and its call method only needs `&self` to invoke — so it implements `Fn`, and by the hierarchy, `FnMut` and `FnOnce` as well, since `Fn` is the strictest and most capable of the three.',
      'What that means for an API accepting it: a function parameter typed `impl Fn()` can be called any number of times through a shared reference to the closure, which is why `Fn` is the right bound for something like a comparator passed to `sort_by` — the sort needs to call it repeatedly and has no reason to need exclusive access to it.',
      'The detail worth adding: this is inferred entirely from the body, not declared. If someone later edits that closure to also mutate a captured variable, it silently downgrades to `FnMut`-only, and any call site that specifically required `Fn` will stop compiling with an error at the call site rather than at the closure definition — which is a genuinely useful thing to know when debugging a "why did this suddenly break" report after what looked like an unrelated change.',
    ],
  },

  exercise: [
    'Write the three functions from the code block (`call_fn`, `call_fn_mut`, `call_fn_once`) and three matching closures, then try passing the `FnMut` closure to `call_fn` and read the exact trait-bound error. Understanding that error message on sight is worth more than memorising the rule.',
    'Then write a function that returns a closure two different ways — once as `impl Fn() -> i32` when there is only one possible closure body, and once as `Box<dyn Fn() -> i32>` when an `if` branches between two different closure literals — and confirm the `impl Fn` version fails to compile for the branching case, forcing you to reach for the boxed trait object instead.',
  ],
};
