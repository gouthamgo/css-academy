import { Box, Text, Tag } from '../../viz/primitives.js';

/* ------------------------------------------------------------------
   Geometry. The x-axis is latency in nanoseconds on a LOG scale,
   because the numbers on it span three orders of magnitude — a
   linear axis would put every interesting bar on top of the y-axis.
   nsToX is the one function every other helper goes through, so the
   histogram, the ruler and every percentile marker always agree.
   ------------------------------------------------------------------ */
const AXIS = { x0: 54, x1: 690, y: 300 };
const NS_MIN = 50;
const NS_MAX = 1800;
const LOG_MIN = Math.log10(NS_MIN);
const LOG_SPAN = Math.log10(NS_MAX) - LOG_MIN;

const nsToX = (ns) => AXIS.x0 + ((Math.log10(ns) - LOG_MIN) / LOG_SPAN) * (AXIS.x1 - AXIS.x0);
const clampX = (x, w) => Math.max(10, Math.min(x, 710 - w));

/* Sample buckets for one run of 50,000 calls to sum_to(1000). The
   shape is deliberately realistic: a tight fast cluster, then three
   buckets so small they are almost invisible on a linear count axis
   — and it is exactly those invisible buckets that own p99.9. */
const BINS = [
  { lo: 55, hi: 70, count: 12000 },
  { lo: 70, hi: 85, count: 30000 },
  { lo: 85, hi: 105, count: 28000 },
  { lo: 105, hi: 140, count: 16000 },
  { lo: 140, hi: 200, count: 6000 },
  { lo: 200, hi: 400, count: 1500 },
  { lo: 400, hi: 1400, count: 300 },
];
const MAX_COUNT = 30000;
const BAR_MAX_H = 168;

const bar = (i) => {
  const b = BINS[i];
  const x0 = nsToX(b.lo);
  const x1 = nsToX(b.hi);
  const h = Math.max(3, (b.count / MAX_COUNT) * BAR_MAX_H);
  return Box({
    key: `bin.${i}`,
    x: x0,
    y: AXIS.y - h,
    w: Math.max(2, x1 - x0 - 1),
    h,
    tone: 'stack',
    dashed: h < 8,
  });
};
const histogram = (n) => Array.from({ length: n }, (_, i) => bar(i));

const REF_NS = [60, 100, 200, 500, 1000];
const ruler = () => [
  Box({ key: 'baseline', x: AXIS.x0, y: AXIS.y, w: AXIS.x1 - AXIS.x0, h: 1.5, opacity: 0.4 }),
  ...REF_NS.map((n) =>
    Box({ key: `tick.${n}`, x: nsToX(n) - 0.75, y: AXIS.y, w: 1.5, h: 9, opacity: 0.5 })
  ),
  ...REF_NS.map((n) =>
    Text({
      key: `tickl.${n}`,
      x: nsToX(n),
      y: 322,
      text: `${n}`,
      size: 9.5,
      anchor: 'middle',
      mono: true,
      opacity: 0.55,
    })
  ),
  Text({
    key: 'ax.label',
    x: (AXIS.x0 + AXIS.x1) / 2,
    y: 336,
    text: 'latency per call, nanoseconds — log scale',
    size: 10.5,
    anchor: 'middle',
    opacity: 0.55,
  }),
];

/* A percentile marker: a vertical line plus a floating tag, both
   under the same key prefix so a marker that moves between steps
   slides rather than reappears. */
const marker = (key, ns, label, tone, tagY = 96) => {
  const x = nsToX(ns);
  const w = Math.max(58, label.length * 6.1 + 16);
  const tx = clampX(x - w / 2, w);
  return [
    Box({ key: `${key}.line`, x: x - 1, y: 116, w: 2, h: AXIS.y - 116, tone }),
    Tag({ key: `${key}.tag`, x: tx, y: tagY, text: label, tone, w }),
  ];
};

const counter = (text) =>
  Tag({ key: 'counter', x: 40, y: 40, text, tone: 'neutral', w: Math.max(140, text.length * 6.3 + 20) });

/* The sampling loop plotted against time, not latency — this is the
   only way to show a stall in the loop *itself*, which the latency
   histogram above can never reveal because no sample exists for it. */
const TL = { x: 54, x1: 690, y: 354, h: 24 };
const timeline = (gapFrom, gapTo) => {
  const shapes = [
    Box({ key: 'tl.region', x: TL.x, y: TL.y, w: TL.x1 - TL.x, h: TL.h, dashed: true }),
    Text({
      key: 'tl.label',
      x: TL.x,
      y: TL.y - 10,
      text: 'THE SAMPLING LOOP ITSELF, PLOTTED OVER TIME',
      size: 9.5,
      mono: true,
      opacity: 0.55,
    }),
  ];
  for (let i = 0; i <= 16; i++) {
    if (i >= gapFrom && i <= gapTo) continue;
    const x = TL.x + (i / 16) * (TL.x1 - TL.x);
    shapes.push(Box({ key: `tl.tick.${i}`, x: x - 1, y: TL.y + 5, w: 2, h: 14, tone: 'hit' }));
  }
  const gx0 = TL.x + (gapFrom / 16) * (TL.x1 - TL.x);
  const gx1 = TL.x + (gapTo / 16) * (TL.x1 - TL.x);
  shapes.push(
    Box({
      key: 'tl.gap',
      x: gx0,
      y: TL.y + 1,
      w: gx1 - gx0,
      h: TL.h - 2,
      tone: 'miss',
      dashed: true,
      label: 'stalled',
      labelSize: 9,
      mono: true,
    })
  );
  return shapes;
};

export default {
  oneLiner:
    'How to turn "it feels faster" into a number you can defend — and why that number is never a single average.',

  whyJob:
    'Every claim in the rest of this tier rests on a benchmark, and a broken one makes every later lesson look believable when it is not. Interviewers ask candidates to design a benchmark specifically because most people report a mean and stop.',

  mentalModel:
    'Judging a function from one run is like judging a restaurant from one meal — you might have caught their best night, or the night the kitchen caught fire. A *histogram* built from thousands of runs is the only way to see both, and in a system running a million times a second, the night the kitchen caught fire is the one you get paged for.',

  scene: {
    id: 'latency-histogram',
    title: 'A latency histogram, one percentile at a time',
    width: 720,
    height: 430,
    legend: [
      { tone: 'stack', label: 'samples per latency bucket' },
      { tone: 'owned', label: 'mean / median' },
      { tone: 'miss', label: 'p99.9 — set by the rare events' },
    ],
    steps: [
      {
        say: 'This is `sum_to`, a deliberately tiny function, timed 50,000 separate times. The x-axis is how long one call took, on a log scale because the numbers span three orders of magnitude; the y-axis is how many calls took that long.',
        mark: ['13-17'],
        shapes: () => [...ruler(), counter('0 calls timed')],
      },
      {
        say: 'The first few hundred calls cluster tightly between about 70 and 105 nanoseconds. Stop measuring here — which is tempting, because it is fast and it is done — and you report a clean, boring number.',
        mark: ['26-32'],
        shapes: () => [...ruler(), ...histogram(4), counter('~400 calls timed')],
      },
      {
        say: 'Keep going to the full 50,000 and three more bars appear, each shorter than the last — a cache miss here, a context switch there, once in a great while a page fault. On this axis they are nearly invisible, and that invisibility is exactly the trap.',
        mark: ['26-32'],
        shapes: () => [...ruler(), ...histogram(7), counter('50,000 calls timed')],
      },
      {
        say: 'The mean and the median both land right in the thick of the distribution, around 90 nanoseconds. Report either one on its own and the function looks fast and perfectly consistent.',
        mark: ['34-38'],
        shapes: () => [
          ...ruler(),
          ...histogram(7),
          ...marker('mean', 98, 'mean 98ns', 'owned', 74),
          ...marker('p50', 85, 'p50 85ns', 'owned', 96),
        ],
      },
      {
        say: 'The 99th percentile is already more than three times the mean — one call in a hundred is paying for something the bulk of the distribution never touches.',
        mark: ['39-43'],
        shapes: () => [
          ...ruler(),
          ...histogram(7),
          ...marker('mean', 98, 'mean 98ns', 'owned', 74),
          ...marker('p50', 85, 'p50 85ns', 'owned', 96),
          ...marker('p99', 310, 'p99 310ns', 'borrowed', 74),
        ],
      },
      {
        say: 'One call in a thousand pays far more again — and that call is not a fluke, it is a guarantee. At a million calls a second, one in a thousand is roughly a thousand of these every single second.',
        mark: ['39-43'],
        predict: {
          ask: 'The mean here is about 98ns and every sample so far has looked tame. Where does p99.9 land?',
          options: [
            { label: 'About the same as p99 — tails flatten out near the top', correct: false },
            { label: 'Roughly double the mean — worse, but not dramatic', correct: false },
            { label: 'An order of magnitude past the mean, set by a tiny fraction of samples', correct: true },
          ],
          because:
            'p99.9 is decided by 1 call in 1,000 — rare enough to barely nudge the mean, but common enough to matter at scale. It is exactly the buckets too small to see on a linear count axis that set this number: the one cache miss, page fault or scheduler preemption per thousand calls.',
        },
        shapes: () => [
          ...ruler(),
          ...histogram(7),
          ...marker('mean', 98, 'mean 98ns', 'owned', 74),
          ...marker('p50', 85, 'p50 85ns', 'owned', 96),
          ...marker('p99', 310, 'p99 310ns', 'borrowed', 74),
          ...marker('p999', 980, 'p99.9 980ns', 'miss', 96),
        ],
      },
      {
        say: 'The loop above measures back to back: call, stamp, call, stamp. If that loop itself is ever paused — swapped off the core, blocked on a page fault — no sample is taken while it is gone, no matter how long the pause lasts.',
        mark: ['26-32'],
        focus: ['tl.region', 'tl.label', 'tl.gap', 'note', 'p999.line', 'p999.tag', 'p999c.line', 'p999c.tag'],
        shapes: () => [
          ...ruler(),
          ...histogram(7),
          ...marker('mean', 98, 'mean 98ns', 'owned', 74),
          ...marker('p50', 85, 'p50 85ns', 'owned', 96),
          ...marker('p99', 310, 'p99 310ns', 'borrowed', 74),
          ...marker('p999', 980, 'measured (naive) 980ns', 'miss', 96),
          ...marker('p999c', 1600, 'corrected ~1600ns', 'freed', 74),
          ...timeline(6, 10),
          Text({
            key: 'note',
            x: (TL.x + TL.x1) / 2,
            y: 400,
            text: 'requests that would have queued during the stall never became a sample — the true tail is worse than the measured one',
            size: 11,
            anchor: 'middle',
            opacity: 0.7,
          }),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'bench.cpp',
    source: `#include <algorithm>
#include <chrono>
#include <cstdio>
#include <vector>

// Stops the optimizer from proving the result is unused and deleting
// the call that produced it, like Google Benchmark's DoNotOptimize.
template <class T>
inline void DoNotOptimize(T const& value) {
    asm volatile("" : : "r,m"(value) : "memory");
}

long long sum_to(long long n) {
    long long s = 0;
    for (long long i = 0; i < n; ++i) s += i;
    return s;
}

int main() {
    constexpr int kWarmup = 2000;
    constexpr int kSamples = 50000;

    for (int i = 0; i < kWarmup; ++i) DoNotOptimize(sum_to(1000));

    std::vector<double> ns(kSamples);
    for (int i = 0; i < kSamples; ++i) {
        auto t0 = std::chrono::steady_clock::now();
        long long r = sum_to(1000);
        auto t1 = std::chrono::steady_clock::now();
        DoNotOptimize(r);
        ns[i] = std::chrono::duration<double, std::nano>(t1 - t0).count();
    }

    std::sort(ns.begin(), ns.end());
    double mean = 0;
    for (double v : ns) mean += v;
    mean /= kSamples;

    auto pct = [&](double p) { return ns[(size_t)(p * (kSamples - 1))]; };
    printf("mean  %8.1f ns\\n", mean);
    printf("p50   %8.1f ns\\n", pct(0.50));
    printf("p99   %8.1f ns\\n", pct(0.99));
    printf("p99.9 %8.1f ns\\n", pct(0.999));
    return 0;
}`,
    annotations: [
      {
        lines: '9-11',
        text: 'The inline-asm barrier tells the compiler the value has been read from memory, so it cannot prove `value` is dead and delete the computation that produced it.',
      },
      {
        lines: '23',
        text: 'Warm-up runs, discarded before any sample is recorded. First touch of each page, cold caches, and the CPU ramping up from an idle clock speed all belong here, not in the data.',
      },
      {
        lines: '26-32',
        text: 'One sample per call, stamped immediately before and after. This loop is also the one that can stall and cause coordinated omission — see the last step of the diagram.',
      },
      {
        lines: '39-43',
        text: 'Percentiles read straight off the sorted array. Printing all four together, not just the mean, is the entire point of this file.',
      },
    ],
  },

  deeper: [
    '`std::chrono::steady_clock` on Linux is normally backed by `clock_gettime(CLOCK_MONOTONIC)` through the vDSO, so a call does not trap into the kernel — but it still costs on the order of 20 to 30 nanoseconds, which matters enormously if the thing you are timing is itself only a few nanoseconds. `rdtsc` (or better, the serializing `rdtscp`) reads a per-core cycle counter directly in a handful of cycles, roughly an order of magnitude cheaper, but on modern x86 the "invariant TSC" ticks at a fixed reference rate regardless of turbo boost, and it keeps counting across a thread migration or a context switch — a large TSC delta does not mean the thread ran continuously for that whole span. `high_resolution_clock` is often just an alias for `system_clock` depending on the standard library, and `system_clock` is not guaranteed to be monotonic; never use it to measure a duration.',
    'The optimizer deleting your benchmark is not a bug, it is the optimizer doing exactly what it is supposed to do. If nothing observable depends on a computed value, the abstract machine says computing it has no effect, so removing it is a legal transformation — at `-O2` a loop that calls a function and discards the result frequently measures an empty loop and reports something like 0.3 nanoseconds. `DoNotOptimize` works by handing the compiler an inline-asm block that claims to read the value; the compiler must assume that block might do anything with it, so the value can no longer be proven dead, and neither can the computation that produced it.',
    'Warm-up exists because the first calls into any code path pay one-time costs that will never repeat: the pages backing the code and its data have not been touched yet, so the very first access to each one faults; the instruction and data caches are cold; branch predictor history for branches inside the function does not exist yet; and on a laptop or a shared cloud core, the CPU may still be ramping up from an idle power state, which on some parts takes tens of microseconds to reach full turbo. None of that describes steady-state behaviour, so it has to run and be thrown away before the first sample is ever recorded.',
    'The mean lies because it treats a once-in-a-thousand event and a nine-times-out-of-ten event as equally informative, when they are not. Real tail latency comes from specific, nameable causes — an L3 miss out to DRAM at roughly 100ns, a TLB miss that triggers a page-table walk, the OS scheduler handing the core to another process for a slice measured in microseconds, a NUMA-remote memory access. Each is individually rare, so none of them move the mean by much, but a system doing a million operations a second and mispredicting its tail even 0.1% of the time hits one of these every millisecond — often enough to be the reason an order arrives after the price has already moved.',
    'Coordinated omission, a term coined by Gil Tene, is what happens when the measuring loop\'s own pauses erase the worst data it would have collected. A request/response loop that sends the next request only after the previous one returns will, during any stall in the system under test, simply send fewer requests — every request that "should" have gone out during the stall never becomes a data point, even though a real system under real load would have had it queued and suffering. The fix is either to issue load at a fixed rate that does not wait on the system\'s own responsiveness, so a stall shows up as a growing backlog of high latencies instead of missing samples, or to correct the recorded histogram after the fact by assuming any gap longer than the expected inter-arrival time hid samples interpolated across it — which is what HdrHistogram\'s correction does.',
  ],

  gotchas: [
    'Reporting only a mean, or a "feels fast" from a handful of manual runs, hides the exact tail that determines your worst case. Look at p99 and p99.9, not just the average, before you claim a change helped.',
    '`high_resolution_clock` is not guaranteed to be steady on every standard library implementation. Use `steady_clock` for measuring a duration, always, and reserve `system_clock` for wall-clock timestamps you intend to compare against real-world time.',
    'Timing without pinning the thread to a core (`taskset`, or `SetThreadAffinityMask` on Windows) mixes migration and frequency-scaling noise into numbers that are supposed to describe the code, not the scheduler.',
    'Forgetting to also pass the *input* through a `DoNotOptimize`-style barrier lets the compiler constant-fold the entire computation at compile time when the input is a literal — the benchmark then measures nothing whatsoever and still prints a confident-looking number.',
    'A load generator built as "send, wait for the reply, send again" undercounts its own worst latencies whenever the system it is testing stalls. That is coordinated omission, and left uncorrected it makes a struggling system look healthier than it is, right up until it is in production.',
  ],

  interview: {
    q: 'You benchmark a function and it reports 0.4 nanoseconds — faster than a single L1 cache access. What is actually going on, and how do you find out?',
    a: [
      'Nothing physically executes in 0.4ns on a roughly 3GHz core — that is about one cycle, not enough time for even a register-only operation to survive a clock call that itself costs tens of nanoseconds. The near-certain explanation is that the optimizer proved the result was never observed and deleted the call entirely, so the loop is timing nothing at all.',
      'I would confirm it by reading the generated assembly — `-O2 -S`, or a Compiler Explorer link — and checking whether the call and its arithmetic are actually present inside the loop, or whether the loop body is empty. If it is empty, the fix is to make the result escape: route it through something like `DoNotOptimize`, an inline-asm barrier that tells the compiler the value has been read so it cannot be proven dead, and do the same to the input if it is a compile-time constant the compiler could otherwise fold away before the loop even starts.',
      'The detail that separates a memorised answer from an understood one is naming *why* this is legal in the first place: as far as the abstract machine is concerned, a computation nobody observes has no observable effect, so removing it changes nothing about defined program behaviour. The benchmark is not lying about the code as compiled — it is honestly reporting the runtime of a program that no longer contains the computation you meant to measure.',
    ],
  },

  exercise: [
    'Build the file above with `g++ -O2 -o bench bench.cpp` and run it. Then delete every `DoNotOptimize` call, rebuild, and run again — the reported numbers should collapse toward zero. Compare the generated assembly (`g++ -O2 -S`) for `main` between the two versions and find the loop that disappeared.',
    'Run `perf stat -e cycles,instructions,cache-misses,branch-misses ./bench` on the working version. Divide cycles by instructions to get IPC (instructions per cycle) — a value well under 1 on a loop this small is a sign that something other than raw arithmetic is the bottleneck.',
    'Change `kSamples` to 200 and rerun several times. Watch p99.9 swing wildly between runs while the mean barely moves. Knowing roughly how many samples a tail percentile needs before it means anything is part of using one honestly.',
  ],
};
