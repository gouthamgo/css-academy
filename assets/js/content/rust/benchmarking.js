import { Box, Frame, Arrow, Text, Tag, Bracket } from '../../viz/primitives.js';

/* One "loop body" box that the optimiser inspects, condemns, and empties.
   Same box, same key, across the naive half of the scene -- so watching
   it hollow out IS the explanation. The black_box half gets a fresh
   diagram: a wall the optimiser cannot see past. */
const LOOP_X = 90;
const LOOP_Y = 130;
const LOOP_W = 280;
const LOOP_H = 130;

export default {
  oneLiner:
    'Why timing a debug build tells you nothing, why the optimiser will delete your benchmark if you let it, and how criterion measures the number that is actually left.',

  whyJob:
    'Every performance claim in a trading or ML-infra interview lives or dies on whether the benchmark that produced it is real. "I benchmarked it and it was 0ns" is not a fast result — it is a benchmark the compiler deleted, and knowing the difference on sight is the actual skill being tested.',

  mentalModel:
    'Imagine timing how long it takes a chef to chop an onion, but the onion is never handed to anyone and the chopped pieces are thrown straight in the bin unseen. A sufficiently observant assistant *skips the chopping entirely* — nobody downstream can tell the difference, and the reported time is however long it takes to do nothing. The Rust optimiser is that assistant: if it can prove a computation\'s result is never used, it is not merely allowed to delete it, deleting it is the correct optimisation. `black_box` is the trick of handing the onion to someone whose reaction the assistant cannot predict, which forces the chopping to actually happen.',

  scene: {
    id: 'benchmark-elision',
    title: 'The optimiser deletes what you never use',
    width: 720,
    height: 400,
    legend: [
      { tone: 'stack', label: 'code as written' },
      { tone: 'freed', label: 'eliminated by the optimiser' },
      { tone: 'owned', label: 'survives, actually measured' },
    ],
    steps: [
      {
        say: 'A first attempt at a benchmark: time a loop that calls `fib(20)` a thousand times, using nothing but `Instant::now()`. It looks reasonable — call the function, do it in a loop, measure the elapsed time.',
        mark: ['9-13'],
        shapes: () => [
          Box({ key: 'loop', x: LOOP_X, y: LOOP_Y, w: LOOP_W, h: LOOP_H, label: 'for _ in 0..1_000 { fib(20); }', tone: 'stack', mono: true, labelSize: 12 }),
          Text({ key: 'code.lbl', x: LOOP_X, y: LOOP_Y - 22, text: 'naive_bench()', size: 12, mono: true, weight: 650 }),
        ],
      },
      {
        say: 'The optimiser looks at that loop before it ever reaches a benchmark. Its job is to find work whose result nothing downstream reads, and this loop is exactly that shape: `fib(20)` is called, and the return value is discarded on every single iteration.',
        mark: ['10-12'],
        focus: ['loop', 'inspect'],
        shapes: () => [
          Box({ key: 'loop', x: LOOP_X, y: LOOP_Y, w: LOOP_W, h: LOOP_H, label: 'for _ in 0..1_000 { fib(20); }', tone: 'stack', mono: true, labelSize: 12 }),
          Text({ key: 'code.lbl', x: LOOP_X, y: LOOP_Y - 22, text: 'naive_bench()', size: 12, mono: true, weight: 650 }),
          Tag({ key: 'inspect', x: 420, y: 150, text: 'optimiser inspects the loop', tone: 'highlight' }),
          Arrow({ key: 'look', from: [420, 165], to: [LOOP_X + LOOP_W, LOOP_Y + 40], tone: 'highlight', bend: -20 }),
        ],
      },
      {
        say: '`fib` is a pure function — no side effects, nothing written to memory or a file, nothing printed. Combined with the discarded return value, the optimiser now has a proof: the entire loop can be removed and the observable behaviour of the program does not change.',
        mark: ['3-5', '11'],
        focus: ['loop', 'proof'],
        shapes: () => [
          Box({ key: 'loop', x: LOOP_X, y: LOOP_Y, w: LOOP_W, h: LOOP_H, label: 'for _ in 0..1_000 { fib(20); }', tone: 'stack', mono: true, labelSize: 12 }),
          Text({ key: 'code.lbl', x: LOOP_X, y: LOOP_Y - 22, text: 'naive_bench()', size: 12, mono: true, weight: 650 }),
          Tag({ key: 'proof', x: 420, y: 150, text: 'result unused + pure fn = dead code', tone: 'freed' }),
          Arrow({ key: 'look', from: [420, 165], to: [LOOP_X + LOOP_W, LOOP_Y + 40], tone: 'freed', bend: -20 }),
        ],
      },
      {
        say: 'The loop is about to be deleted entirely — not slimmed down, not simplified, gone. Only the two timer calls that surround it will survive into the compiled binary.',
        mark: ['10', '13'],
        predict: {
          ask: 'After the optimiser removes the loop, what will `start.elapsed()` report?',
          options: [
            { label: 'Roughly the real cost of computing fib(20) one thousand times', correct: false },
            { label: 'A number close to zero — there is nothing left between the two timer calls to take time', correct: true },
            { label: 'The program fails to compile, because the loop has no effect', correct: false },
          ],
          because:
            'Deleting dead code is legal precisely because it does not change what the program does — and this program does nothing else. `start` and `elapsed()` are still real calls, but with the loop gone there is no work between them, so the measurement converges on whatever a nearly-empty function costs: often a handful of nanoseconds, sometimes reported as flat zero depending on clock resolution. It is not a fast fib — it is a benchmark of an empty function that used to call fib.',
          },
        shapes: () => [
          Box({ key: 'loop', x: LOOP_X, y: LOOP_Y, w: LOOP_W, h: LOOP_H, label: 'for _ in 0..1_000 { fib(20); }', tone: 'freed', dashed: true, mono: true, labelSize: 12 }),
          Text({ key: 'code.lbl', x: LOOP_X, y: LOOP_Y - 22, text: 'naive_bench() — about to be gutted', size: 12, mono: true, weight: 650, tone: 'freed' }),
        ],
      },
      {
        say: 'And this is the compiled result: the loop body is gone, only `Instant::now()` twice remains, and the printed time reflects exactly that — nanoseconds, not the cost of computing a recursive `fib(20)` a thousand times over.',
        mark: ['9-13'],
        shapes: () => [
          Box({ key: 'loop', x: LOOP_X, y: LOOP_Y, w: LOOP_W, h: LOOP_H, label: '(nothing here)', tone: 'freed', dashed: true, mono: true, labelSize: 12 }),
          Text({ key: 'code.lbl', x: LOOP_X, y: LOOP_Y - 22, text: 'naive_bench() — compiled', size: 12, mono: true, weight: 650, tone: 'freed' }),
          Text({ key: 'report', x: LOOP_X, y: LOOP_Y + LOOP_H + 30, text: 'elapsed: 41ns   <- measuring an empty loop, not fib', size: 13, mono: true, tone: 'freed', weight: 650 }),
        ],
      },
      {
        say: '`black_box` is an opaque barrier the optimiser is specifically told not to see through: it may not assume anything about what goes in or reason about what comes out. Wrap the input in it and the call can no longer be proven equal to "20" at compile time; wrap the output in it and the call can no longer be proven unused.',
        mark: ['17-19'],
        shapes: () => [
          Box({ key: 'wall', x: 300, y: 120, w: 16, h: 160, tone: 'highlight', thick: true }),
          Text({ key: 'wall.lbl', x: 308, y: 100, text: 'black_box', size: 11, mono: true, anchor: 'middle', tone: 'highlight', weight: 700 }),
          Box({ key: 'in', x: 100, y: 170, w: 170, h: 56, label: '20', sub: 'input, opaque to optimiser', tone: 'highlight' }),
          Box({ key: 'call', x: 340, y: 170, w: 190, h: 56, label: 'fib(20)', sub: 'must actually run', tone: 'stack', mono: true }),
          Arrow({ key: 'a1', from: [270, 198], to: [340, 198], tone: 'highlight', shape: 'straight', bend: 0 }),
        ],
      },
      {
        say: 'With the barrier in place, `fib(20)` cannot be elided — the optimiser has no proof the input is a compile-time constant and no proof the output is unused, because `black_box` has hidden both facts from it deliberately. The recursion actually executes, every time.',
        mark: ['17-19'],
        shapes: () => [
          Box({ key: 'wall', x: 300, y: 120, w: 16, h: 160, tone: 'highlight', thick: true }),
          Text({ key: 'wall.lbl', x: 308, y: 100, text: 'black_box', size: 11, mono: true, anchor: 'middle', tone: 'highlight', weight: 700 }),
          Box({ key: 'in', x: 100, y: 170, w: 170, h: 56, label: '20', sub: 'input, opaque to optimiser', tone: 'highlight' }),
          Box({ key: 'call', x: 340, y: 170, w: 190, h: 56, label: 'fib(20)', sub: 'runs for real, every iteration', tone: 'owned', mono: true }),
          Arrow({ key: 'a1', from: [270, 198], to: [340, 198], tone: 'highlight', shape: 'straight', bend: 0 }),
          Text({ key: 'report', x: 100, y: 270, text: 'criterion: 8.21 µs/iter  (±0.04 µs)', size: 13, mono: true, tone: 'owned', weight: 650 }),
        ],
      },
      {
        say: 'That range is the other half of what `criterion` gives you over a hand-rolled timer: it runs many samples, discards a warm-up period while caches and branch predictors settle, and reports a mean with a confidence interval instead of one number that could have landed on a scheduler hiccup.',
        mark: [],
        shapes: () => [
          Bracket({ key: 'samples', x: 100, y: 120, w: 480, label: '100 samples, outliers flagged, mean ± noise reported', tone: 'stack' }),
          Text({ key: 'warmup', x: 100, y: 180, text: 'warm-up: 3s spent NOT counted, so the CPU is already at speed', size: 12, mono: true, tone: 'neutral', opacity: 0.85 }),
          Text({ key: 'thr', x: 100, y: 220, text: 'latency: 8.21 µs per call   |   throughput: ~122,000 calls/sec', size: 12, mono: true, tone: 'owned', weight: 600 }),
        ],
      },
    ],
  },

  code: {
    lang: 'rust',
    filename: 'benches/fib.rs',
    source: `use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn fib(n: u64) -> u64 {
    if n < 2 { n } else { fib(n - 1) + fib(n - 2) }
}

/// What most people write first. It compiles, it runs, and it lies.
fn naive_bench() {
    let start = std::time::Instant::now();
    for _ in 0..1_000 {
        fib(20);                        // return value discarded
    }
    println!("{:?}", start.elapsed());  // measures an empty loop
}

fn correct_bench(c: &mut Criterion) {
    c.bench_function("fib 20", |b| {
        b.iter(|| fib(black_box(20)));  // input and result both opaque
    });
}

criterion_group!(benches, correct_bench);
criterion_main!(benches);`,
    annotations: [
      {
        lines: '3-5',
        text: 'A pure function with a discarded return value is the exact shape the optimiser is built to eliminate — nothing about `fib` itself is the problem.',
      },
      {
        lines: '9-13',
        text: 'This compiles and runs, and on a release build it reports a number near zero, because there is nothing left between the two `Instant` calls by the time codegen finishes.',
      },
      {
        lines: '18',
        text: '`black_box(20)` stops the compiler treating the argument as a known constant it could fold at compile time; wrapping the closure result the same way stops it discarding the output.',
      },
      {
        lines: '17',
        text: '`c.bench_function` is what does the actual work: many timed samples, a warm-up phase excluded from the result, and statistical outlier rejection — one call to `Instant::now()` around a loop gives you none of that.',
      },
    ],
  },

  deeper: [
    'Timing a debug build (`cargo run` or a manual `rustc` with no `-O`) is close to meaningless as an optimisation signal: debug builds disable inlining, keep every intermediate value alive in memory rather than a register, insert overflow checks on every arithmetic operation, and do not perform the dead-code elimination that this lesson is entirely about. The relative ranking of two approaches can even flip between debug and release, because the codegen strategies differ enough that a technique cheap in one is expensive in the other. Always benchmark `--release`, and be aware that `--release` is exactly what makes the elision problem in this lesson real — a debug build would not have deleted the naive loop, which is part of why the mistake goes unnoticed until someone benchmarks the right build.',
    'Dead-code elimination is not a special case reserved for toy benchmarks; it is one of the most basic and aggressive passes any optimising compiler runs, because "the result is provably unused" is one of the cheapest, highest-confidence facts LLVM can establish. The same reasoning chain applies to constant folding: if `black_box` does not also hide the *input*, the compiler may notice `fib(20)` always receives the literal `20`, evaluate it once at compile time, and replace every call with the precomputed answer — a different way to end up measuring nothing, and one that survives even if you use the return value, because the value is now a compile-time constant rather than a runtime computation.',
    'Criterion\'s statistical model exists because a single wall-clock measurement is a sample from a noisy distribution, not a fact about your code. It runs the benchmarked closure for an initial warm-up period (three seconds by default) that is measured but discarded, so branch predictors, caches, and — on some systems — CPU frequency scaling have already settled before a sample counts. It then collects on the order of a hundred timed samples, fits them, flags points far outside the bulk as likely-noise outliers (a context switch, a page fault, a neighbouring process), and reports a mean with a confidence interval rather than a single number a reader might mistake for exact.',
    'Latency and throughput answer different questions and criterion supports both. Latency — what most of this lesson measures — is how long one call takes, `b.iter(...)`, useful when a single operation sits on a request\'s critical path. Throughput is work done per unit time, which criterion reports via `c.throughput(Throughput::Elements(n))` alongside a benchmark that processes `n` items per iteration, useful for a batch pipeline where individual latency matters less than aggregate rate. A component can have excellent throughput and poor tail latency, or the reverse — a batching network layer is the classic example — so naming which one a number describes is part of reporting it honestly.',
    'The optimiser is not being adversarial; it is doing exactly what an optimiser is supposed to do, which is why blaming "the compiler being too smart" misses the actual lesson. The contract of `-O` is "produce a program with the same observable behaviour, as fast as you can" — and a loop whose result nothing reads and which has no side effects is, by that contract, indistinguishable from no loop at all. `black_box` is not a workaround for a bug; it is the standard, documented mechanism for telling the optimiser "the observable behaviour includes this value, trust me" for code whose only job is to be measured rather than to compute something a real caller needs.',
  ],

  gotchas: [
    'Wrapping only the *input* in `black_box` is a common half-measure: the call can no longer be constant-folded, but if the return value is still discarded, the optimiser can still prove the call has no effect and delete it anyway. Wrap the result of `b.iter(|| ...)`, the input, or both — criterion\'s own `iter` closure convention handles this correctly when you return the value from the closure.',
    'System noise dwarfs small differences on a busy machine: another process stealing a core, thermal throttling, or a laptop switching power profiles mid-run can each shift results by more than the effect you are trying to measure. Run comparative benchmarks on a quiet machine, or at minimum run each variant multiple times and look at criterion\'s own noise threshold warning rather than trusting one run.',
    'Benchmarking allocation-heavy code without accounting for allocator warm state produces numbers that do not match steady-state production, because the first few allocations from a fresh allocator can behave differently (fresh pages, no free-list reuse) than the millionth. Criterion\'s warm-up phase helps, but only if your setup code (`b.iter_batched` with a fresh input per sample) matches how the real system actually allocates.',
    'A `criterion` regression report ("Performance has regressed") compares against the *last run on this machine*, stored in `target/criterion`, not against some absolute baseline — deleting that directory, switching machines, or running under different background load silently invalidates the comparison, and the tool will not warn you that the baseline changed for a reason unrelated to your code.',
  ],

  interview: {
    q: 'You benchmark a function with `Instant::now()` around a loop and get suspiciously fast results — under a nanosecond per call. What is happening, and how would you fix the benchmark?',
    a: [
      'The near-certain cause is that the optimiser proved the loop\'s work has no observable effect and deleted it. That happens whenever the function being called is pure (or at least has no visible side effect the compiler can see) and its return value is discarded — both true of a typical `for _ in 0..n { compute(x); }` micro-benchmark written by hand. What survives compilation is just the two timer calls, so the "result" measures how long it takes to call `Instant::now()` twice, not the function under test.',
      'The fix is `std::hint::black_box` (or `criterion::black_box`, which wraps the same intrinsic): pass the input through it so the compiler cannot treat it as a known constant to fold away, and pass the output through it — or simply return it from the closure criterion measures — so the compiler cannot prove it is unused. Both halves matter; fixing only one still leaves the other optimisation available.',
      'The stronger answer adds why a hand-rolled timer is the wrong tool even once elision is fixed: one measurement is one sample from a noisy distribution, sensitive to scheduler jitter, cache state, and whatever else the OS is doing at that instant. `criterion` runs many samples after an explicit warm-up, reports a mean with a confidence interval, and flags statistical outliers — which is the difference between "I got a number" and "I have evidence this is faster," and interviewers at a performance-sensitive shop are listening for exactly that distinction.',
    ],
  },

  exercise: [
    'Build the `naive_bench` function from the code block above in a release binary (`cargo build --release`), run it, and record the elapsed time it prints. Then look at the generated assembly for that function with `cargo asm` (or paste it into Godbolt with `-O`) and confirm the loop body is genuinely absent — find the two `Instant`-related calls and nothing resembling `fib` between them.',
    'Add a `criterion` dev-dependency, write `correct_bench` as shown, and run `cargo bench`. Compare its reported per-iteration time against a hand-corrected version of the naive benchmark that sums the results of all thousand calls into a variable you print at the end (which prevents elision without needing `black_box`). The two should roughly agree — if they diverge by an order of magnitude, suspect that one of them is still being partially optimised away, and go back to the assembly to check.',
  ],
};
