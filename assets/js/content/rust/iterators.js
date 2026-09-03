import { Box, Text, Arrow, Tag } from '../../viz/primitives.js';

const wrapper = (key, x, w, label, tone = 'neutral') =>
  Box({ key, x, y: 150, w, h: 60, label, tone, mono: true, labelSize: 11 });

export default {
  oneLiner:
    'An adapter chain does nothing at all until something asks it for a value — and then it does exactly one element\'s worth of work at a time.',

  whyJob:
    'A `filter().map().take()` chain compiling down to the same machine code as a hand-written loop is the concrete proof that Rust\'s "zero-cost abstraction" claim is not marketing — and being able to say why is a fast way to sound like you actually understand the language rather than having memorised its syntax.',

  mentalModel:
    '`.filter().map()` does not build an intermediate filtered list and then a separate mapped list, the way it would visually appear to in a language with eager collections. Each adapter is a thin wrapper that *does nothing until pulled*. When the consumer finally asks for one value, that pull travels backward through every wrapper to the original source, and exactly one element travels forward through every transformation — like a bucket brigade that only moves when someone at the front asks for water, not one that fills every bucket in the chain up front.',

  scene: {
    id: 'iterator-pull',
    title: 'Nothing runs until the consumer pulls',
    width: 720,
    height: 380,
    legend: [
      { tone: 'borrowed', label: 'a lazy wrapper — does nothing yet' },
      { tone: 'owned', label: 'the value actually moving' },
    ],
    steps: [
      {
        say: 'The chain: a range, filtered to even numbers, then doubled, then the first two taken. Written top to bottom in the source, but that order is not the order anything executes.',
        mark: ['1-4'],
        shapes: () => [
          wrapper('src', 40, 130, '1..10', 'neutral'),
          wrapper('filt', 190, 150, '.filter(even)', 'borrowed'),
          wrapper('map', 360, 130, '.map(×2)', 'borrowed'),
          wrapper('take', 510, 150, '.take(2)', 'borrowed'),
          Text({ key: 'note', x: 360, y: 250, text: 'none of this has run yet — no numbers exist', size: 12, anchor: 'middle', mono: true, tone: 'neutral', opacity: 0.75 }),
        ],
      },
      {
        say: 'The `for` loop (or a `.collect()`) is what actually pulls. It asks `take` for its first value.',
        mark: ['6'],
        shapes: () => [
          wrapper('src', 40, 130, '1..10', 'neutral'),
          wrapper('filt', 190, 150, '.filter(even)', 'borrowed'),
          wrapper('map', 360, 130, '.map(×2)', 'borrowed'),
          wrapper('take', 510, 150, '.take(2)', 'borrowed'),
          Arrow({ key: 'pull', from: [660, 250], to: [590, 210], shape: 'straight', bend: 0, tone: 'highlight', label: 'next()?' }),
        ],
      },
      {
        say: '`take` does not have a value either. It asks `map` for one. `map` does not have one. It asks `filter`. `filter` does not have one. It asks the range. The pull travels all the way back to the source before any number exists anywhere.',
        mark: [],
        focus: ['src', 'filt', 'map', 'take', 'p1', 'p2', 'p3', 'p4'],
        shapes: () => [
          wrapper('src', 40, 130, '1..10', 'neutral'),
          wrapper('filt', 190, 150, '.filter(even)', 'borrowed'),
          wrapper('map', 360, 130, '.map(×2)', 'borrowed'),
          wrapper('take', 510, 150, '.take(2)', 'borrowed'),
          Arrow({ key: 'p1', from: [660, 180], to: [590, 180], shape: 'straight', bend: 0, tone: 'highlight', label: 'next()?' }),
          Arrow({ key: 'p2', from: [510, 180], to: [420, 180], shape: 'straight', bend: 0, tone: 'highlight', label: 'next()?' }),
          Arrow({ key: 'p3', from: [360, 180], to: [260, 180], shape: 'straight', bend: 0, tone: 'highlight', label: 'next()?' }),
          Arrow({ key: 'p4', from: [190, 180], to: [130, 180], shape: 'straight', bend: 0, tone: 'highlight', label: 'next()?' }),
        ],
      },
      {
        say: 'The source produces `1`. It travels forward. `filter` checks: odd — reject. It does NOT report a value to `map` at all; it goes back to the source and pulls again on its own, for `2`. `2` is even, passes through.',
        mark: [],
        predict: {
          ask: 'The source produces 1, then 2, then 3... When filter rejects an odd number, what does it do?',
          options: [
            { label: 'Reports "no value" up the chain, and the whole pull fails for this round', correct: false },
            { label: 'Silently pulls again from the source itself, without telling map anything happened', correct: true },
            { label: 'Buffers the rejected value in case it is needed later', correct: false },
          ],
          because:
            'filter\'s next() is a loop: pull from upstream, test the predicate, and if it fails, pull again — all inside its own call. Nothing downstream ever sees a rejected value or even knows a rejection happened.',
        },
        shapes: () => [
          wrapper('src', 40, 130, '1..10', 'neutral'),
          wrapper('filt', 190, 150, '.filter(even)', 'borrowed'),
          wrapper('map', 360, 130, '.map(×2)', 'borrowed'),
          wrapper('take', 510, 150, '.take(2)', 'borrowed'),
        ],
      },
      {
        say: 'So `2` travels forward through `map`, which doubles it to `4`, through `take`, which counts it as its first item, out to the loop. One full round trip for exactly one output value — and the loop body runs with `4`.',
        mark: [],
        focus: ['v1', 'v2', 'v3'],
        shapes: () => [
          wrapper('src', 40, 130, '1..10', 'neutral'),
          wrapper('filt', 190, 150, '.filter(even)', 'borrowed'),
          wrapper('map', 360, 130, '.map(×2)', 'borrowed'),
          wrapper('take', 510, 150, '.take(2)', 'borrowed'),
          Box({ key: 'v1', x: 100, y: 260, w: 60, h: 40, label: '2', tone: 'owned', mono: true }),
          Box({ key: 'v2', x: 400, y: 260, w: 60, h: 40, label: '4', tone: 'owned', mono: true }),
          Arrow({ key: 'af', from: [230, 260], to: [400, 260], shape: 'curve', bend: -20, tone: 'owned', label: '×2' }),
          Text({ key: 'out', x: 620, y: 280, text: 'yielded: 4', size: 12, anchor: 'middle', mono: true, tone: 'owned', weight: 650 }),
        ],
      },
      {
        say: 'The whole process repeats for the loop\'s second iteration — pull travels back, `3` is rejected by filter without a trace, `4` passes and becomes `8`. `take` has now yielded two items, so its next pull returns nothing and the loop ends. No `Vec` was ever built at any stage; only two numbers, `4` and `8`, ever existed at once.',
        mark: [],
        shapes: () => [
          Text({ key: 'summary', x: 360, y: 140, text: 'total work: exactly as many steps as needed, no intermediate collections', size: 13, anchor: 'middle', mono: true, tone: 'neutral', opacity: 0.85 }),
          Tag({ key: 'result', x: 300, y: 200, text: 'yields: 4, 8 — then stops', tone: 'owned' }),
        ],
      },
    ],
  },

  code: {
    lang: 'rust',
    filename: 'main.rs',
    source: `fn main() {
    let result: Vec<i32> = (1..10)
        .filter(|n| n % 2 == 0)   // lazy — nothing runs yet
        .map(|n| n * 2)           // still lazy
        .take(2)                  // still lazy
        .collect();               // THIS pulls, and drives everything

    println!("{result:?}");        // [4, 8]

    // Equivalent hand-written loop — compiles to the same assembly:
    let mut out = Vec::new();
    for n in 1..10 {
        if n % 2 != 0 { continue; }
        let v = n * 2;
        out.push(v);
        if out.len() == 2 { break; }
    }
    println!("{out:?}");           // [4, 8]
}`,
    annotations: [
      {
        lines: '3-5',
        text: 'Each adapter wraps the previous one. Nothing has iterated over anything yet — this builds a chain of types, not a result.',
      },
      {
        lines: '6',
        text: '`.collect()` is what actually pulls. Iteration, filtering and mapping all happen right here, one element at a time.',
      },
      {
        lines: '11-17',
        text: 'The compiler generates essentially this loop from the chain above. Closures are inlined, bounds checks are elided where provable — the abstraction costs nothing at runtime.',
      },
    ],
  },

  deeper: [
    '`Iterator` is a single required method: `fn next(&mut self) -> Option<Self::Item>`. Every adapter — `map`, `filter`, `take`, dozens more — is a struct implementing `next()` in terms of the iterator it wraps. `filter`\'s `next()`, concretely, is a small loop: call the inner iterator\'s `next()`, test the predicate, and if it fails, call `next()` again, until either the predicate passes or the inner iterator is exhausted.',
    'Because every adapter is a distinct generic type (`Filter<Map<Range<i32>, F>, P>` and so on), a chain of adapters monomorphizes into one specialized type with the entire pipeline known at compile time. The optimizer can then inline every closure and every `next()` call into one straight-line loop with no function-call overhead anywhere — which is exactly the hand-written loop shown in the code block, and is why the two versions produce identical assembly under `-O2`/`--release`.',
    'This laziness is also why an iterator chain built but never consumed does nothing and produces a compiler warning (`unused_must_use` on iterators is not universal, but many chains trigger `unused` lints) — `let _ = v.iter().map(|x| expensive(x));` never actually calls `expensive` on anything, because nothing ever pulled.',
    '`iter()` yields `&T` (borrowing), `iter_mut()` yields `&mut T` (borrowing mutably), and `into_iter()` yields `T` by value, consuming the collection. Reaching for the wrong one is a common source of "why does this need a clone" — very often the fix is realizing `.iter()` was borrowing when the code actually needed ownership via `.into_iter()`, or vice versa.',
    'The laziness also changes correctness, not just performance, for iterators with side effects. `map` with a side-effecting closure will only run that closure for elements actually pulled — if `take(2)` stops after two elements, `map`\'s closure never runs on the third, fourth, or any later element, even though the chain lexically mentions them.',
  ],

  gotchas: [
    'An iterator adapter chain that is built but never consumed by something that pulls (`collect`, a `for` loop, `sum`, `for_each`, and so on) does nothing at all — no side effects, no work, silently.',
    '`.iter()` borrows and yields references; using its output somewhere that needs an owned value forces a `.clone()` you may not have needed if `.into_iter()` (consuming, yields owned values) was the right call to begin with.',
    'Side effects inside `.map()` only run for elements that are actually pulled downstream — a `.map(|x| { println!("{x}"); x })` followed by `.take(2)` on a longer sequence only prints twice, which surprises people expecting `map` to run eagerly over everything.',
    '`.collect::<Vec<_>>()` does allocate — laziness applies to the adapter chain itself, not to the final consuming step, which by definition has to materialize something if you asked it to.',
  ],

  interview: {
    q: 'Does `v.iter().filter(f).map(g).collect()` build an intermediate filtered `Vec` before mapping it?',
    a: [
      'No. Every adapter in the chain — `filter`, `map` — is lazy: it is a thin struct wrapping the previous iterator, implementing `next()` by pulling from what it wraps. Nothing in the chain runs until `.collect()`, which is the one thing that actually calls `next()` and drives the whole pipeline.',
      'When it does, one element travels through the entire chain at a time: `filter`\'s `next()` pulls from the source and loops internally until the predicate passes, then hands that single value to `map`, which transforms it and hands it to `collect`, which pushes it into the output `Vec`. No intermediate `Vec` for the filtered elements ever exists — there is exactly one allocation, for the final `collect`ed result.',
      'The reason this is worth stating unprompted is what it implies for the generated code: because the whole chain is a nested generic type known completely at compile time, the compiler can monomorphize and inline it into one straight-line loop, indistinguishable in the generated assembly from a hand-written loop doing the filter-then-map logic directly. This is the standard example people point to for Rust\'s zero-cost abstraction claim being literally true rather than aspirational, and it is worth being able to name the mechanism — laziness plus monomorphization — rather than just the conclusion.',
    ],
  },

  exercise: [
    'Build the chain from the code block, and add a `println!` inside the `.map()` closure to print every value it processes. Run it and count the prints — confirm it is exactly two, not the nine you might expect from a chain that lexically mentions `1..10`.',
    'Then compile both the iterator-chain version and the hand-written loop version with `--release` and compare the assembly on [Compiler Explorer](https://godbolt.org) — the Rust playground\'s "ASM" view works too. Confirm they produce the same, or nearly the same, generated code.',
  ],
};
