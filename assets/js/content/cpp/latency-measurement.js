import { Box, Arrow, Text, Tag, Cells } from '../../viz/primitives.js';

/* ------------------------------------------------------------------
   One shared x-grid serves both the intended-request timeline (top)
   and the latency histogram (bottom), so the two rows visually line
   up. Bars are keyed by bucket index and keep that key across every
   step — a bar changing height or tone is the same bucket, still.
   ------------------------------------------------------------------ */
const BUCKETS = ['1µs', '2µs', '5µs', '10µs', '20µs', '50µs', '100µs', '200µs', '500µs', '1000+µs'];
const X0 = 48;
const BW = 52;
const STEP = 64;
const BASE_Y = 340;
const barX = (i) => X0 + i * STEP;
const barCenter = (i) => barX(i) + BW / 2;

const bars = (counts, toneOverride = {}) =>
  counts.map((c, i) =>
    Box({
      key: `bar.${i}`,
      x: barX(i),
      y: BASE_Y - Math.max(c * 2, 2),
      w: BW,
      h: Math.max(c * 2, 2),
      tone: toneOverride[i] ?? (c > 0 ? 'owned' : 'neutral'),
      dashed: c === 0,
      opacity: c === 0 ? 0.22 : 1,
    })
  );

const bucketLabels = () =>
  BUCKETS.map((b, i) =>
    Text({ key: `lbl.${i}`, x: barCenter(i), y: BASE_Y + 16, text: b, size: 9, anchor: 'middle', mono: true, opacity: 0.55 })
  );

const marker = (key, i, text, tone) => [
  Arrow({ key: `${key}Line`, from: [barCenter(i), 96], to: [barCenter(i), BASE_Y], shape: 'straight', bend: 0, tone, dashed: true }),
  Tag({ key: `${key}Tag`, x: barCenter(i) - 24, y: 78, text, tone }),
];

const ticks = (stallFrom, stallTo) =>
  Cells({
    key: 'tick',
    x: X0 + (BW - 14) / 2,
    y: 52,
    w: 14,
    h: 14,
    gap: STEP - 14,
    values: Array.from({ length: 10 }, (_, i) =>
      i >= stallFrom && i <= stallTo ? { value: '', tone: 'freed', dashed: true } : { value: '', tone: 'owned' }
    ),
  });

export default {
  oneLiner:
    'How to measure nanoseconds without lying to yourself — and the one measurement bug that quietly hides the failures that matter most.',

  whyJob:
    'A portfolio repo that reports "average latency: 40ns" with no further detail reads, to anyone who has actually operated a trading system, as either naive or dishonest. Interviewers specifically probe for coordinated omission and for whether you report p99.9 rather than the mean, because it is the fastest way to tell a candidate who has measured a real system from one who has only read about one.',

  mentalModel:
    'Picture timing a drive-through only by clocking cars from the moment they reach the window to the moment they leave — but a car that is still waiting outside when the kitchen backs up never starts its stopwatch at all, because nobody has waved it forward yet to *begin* measuring. Every number you collect describes only the cars lucky enough to get through cleanly. *Coordinated omission* is exactly this: the measurement stalls in lockstep with the system being measured, so precisely the requests hurt worst by the stall are the ones that never get a timestamp.',

  scene: {
    id: 'latency-histogram-and-omission',
    title: 'A histogram, and the tail it can quietly lose',
    width: 720,
    height: 420,
    legend: [
      { tone: 'hit', label: 'p50 — typical' },
      { tone: 'highlight', label: 'p99' },
      { tone: 'miss', label: 'p99.9 — the number that matters' },
    ],
    steps: [
      {
        say: 'One operation, timed with `__rdtscp` — a serializing read of the CPU\'s own cycle counter, calibrated once against a clock you trust for absolute time, not for short intervals. That single sample lands in the bucket matching its duration.',
        mark: ['10-19', '27-30'],
        shapes: () => [...bars([0, 0, 1, 0, 0, 0, 0, 0, 0, 0]), ...bucketLabels()],
      },
      {
        say: 'A hundred thousand samples later, a real shape emerges. Most operations finish fast — that hump sits at the left — and `p50`, the median, lands right where the bulk of the mass is: 10µs.',
        mark: ['26-33'],
        shapes: () => [
          ...bars([4, 10, 35, 80, 70, 15, 4, 2, 1, 0]),
          ...bucketLabels(),
          ...marker('p50', 3, 'p50 ≈ 10µs', 'hit'),
        ],
      },
      {
        say: 'p99 and p99.9 sit far out past that hump, over buckets with only a handful of samples each. That gap between p50 and p99.9 — 10µs versus 500µs, a fifty-fold difference in this run alone — is the entire reason a single average is worthless for latency.',
        mark: [],
        shapes: () => [
          ...bars([4, 10, 35, 80, 70, 15, 4, 2, 1, 0]),
          ...bucketLabels(),
          ...marker('p50', 3, 'p50 ≈ 10µs', 'hit'),
          ...marker('p99', 7, 'p99 ≈ 200µs', 'highlight'),
          ...marker('p999', 8, 'p99.9 ≈ 500µs', 'miss'),
        ],
      },
      {
        say: 'Now the same loop, but the process occasionally stalls — a GC pause, a page fault, a lock held too long. Four intended requests, back to back, never actually get issued while the stall holds the thread.',
        mark: [],
        shapes: () => [
          Text({ key: 'tlabel', x: X0, y: 36, text: 'intended request timeline', size: 10, mono: true, opacity: 0.55 }),
          ticks(4, 7),
          Box({ key: 'stallBox', x: barX(4) - 6, y: 44, w: barX(7) + 14 - (barX(4) - 6) + 6, h: 26, tone: 'freed', dashed: true, label: 'STALL ~40ms', labelSize: 9, mono: true }),
          ...bars([4, 10, 35, 80, 70, 15, 4, 2, 0, 0], { 8: 'neutral', 9: 'neutral' }),
          ...bucketLabels(),
          ...marker('p50', 3, 'p50 ≈ 10µs', 'hit'),
        ],
      },
      {
        say: 'The naive loop only records operations it actually got to measure. Those four skipped intervals do not appear as huge samples — they simply never appear at all, so the histogram\'s tail is missing exactly where the damage happened.',
        mark: [],
        focus: ['bar.8', 'bar.9', 'p999Line', 'p999Tag'],
        predict: {
          ask: 'During and after the stall, what does this loop\'s reported p99.9 actually look like?',
          options: [
            { label: 'It correctly shows a huge value — around 40ms', correct: false },
            { label: 'It looks artificially low, around 200µs — the same as before the stall', correct: true },
            { label: 'The program has no data at all and reports an error', correct: false },
          ],
          because:
            'The harness can only compute percentiles over samples it actually recorded, and it never got to record the four requests that were queued up behind the stall — it was still blocked when they should have started. Their absence is silently read as "nothing bad happened" instead of what it is: missing data, standing in for the worst latencies in the run.',
        },
        shapes: () => [
          ...bars([4, 10, 35, 80, 70, 15, 4, 2, 0, 0], { 8: 'neutral', 9: 'neutral' }),
          ...bucketLabels(),
          ...marker('p50', 3, 'p50 ≈ 10µs', 'hit'),
          ...marker('p999', 7, 'p99.9 ≈ 200µs — WRONG', 'miss'),
        ],
      },
      {
        say: 'Correcting for it means synthesising the samples that should have existed: for each interval skipped during the stall, record the wait time it would actually have measured, backdated to when it should have started. The tail reappears — and it dwarfs everything else in the histogram.',
        mark: [],
        focus: ['bar.8', 'bar.9', 'p999Line', 'p999Tag'],
        shapes: () => [
          ...bars([4, 10, 35, 80, 70, 15, 4, 2, 25, 35]),
          ...bucketLabels(),
          ...marker('p50', 3, 'p50 ≈ 10µs', 'hit'),
          ...marker('p999', 9, 'p99.9 ≈ 2,300µs', 'miss'),
        ],
      },
      {
        say: 'p50 barely moved — a rare stall does not touch the bulk of fast operations. p99.9 moved from a falsely reassuring 200µs to a real 2.3ms, an eleven-fold jump. That is precisely why p99.9 is the number that gets reported, not the average: it is the one sensitive to exactly the failures p50 is built to hide.',
        mark: [],
        shapes: () => [
          ...bars([4, 10, 35, 80, 70, 15, 4, 2, 25, 35]),
          ...bucketLabels(),
          ...marker('p50', 3, 'p50 ≈ 10µs', 'hit'),
          ...marker('p99', 8, 'p99 ≈ 550µs', 'highlight'),
          ...marker('p999', 9, 'p99.9 ≈ 2,300µs', 'miss'),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'latency.cpp',
    source: `#include <x86intrin.h>
#include <chrono>
#include <cstdio>
#include <cstdint>
#include <array>
#include <thread>

// Calibrate: TSC ticks per nanosecond, measured against a clock we
// trust for absolute time -- not for short intervals.
double calibrate_ns_per_tick() {
    unsigned aux;
    auto t0 = std::chrono::steady_clock::now();
    uint64_t c0 = __rdtscp(&aux);
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
    auto t1 = std::chrono::steady_clock::now();
    uint64_t c1 = __rdtscp(&aux);
    double ns = std::chrono::duration<double, std::nano>(t1 - t0).count();
    return ns / static_cast<double>(c1 - c0);
}

int main() {
    double ns_per_tick = calibrate_ns_per_tick();
    std::array<uint32_t, 3> buckets{};       // simplified: fast/medium/slow
    unsigned aux;

    for (int i = 0; i < 100000; ++i) {
        uint64_t start = __rdtscp(&aux);
        // ... the operation being measured goes here ...
        uint64_t end = __rdtscp(&aux);
        double ns = static_cast<double>(end - start) * ns_per_tick;
        int b = ns < 1000.0 ? 0 : ns < 10000.0 ? 1 : 2;
        ++buckets[b];
    }

    printf("ns/tick=%.4f  fast=%u med=%u slow=%u\\n",
           ns_per_tick, buckets[0], buckets[1], buckets[2]);
    return 0;
}`,
    annotations: [
      {
        lines: '10-19',
        text: 'The TSC increments at a fixed but unknown-to-you rate. You measure that rate once, against a clock that is trustworthy over 50ms even if it is too noisy to trust over 50ns.',
      },
      {
        lines: '13, 16, 27, 29',
        text: '`__rdtscp` is a *serializing* read: it waits for prior instructions to actually retire before reading the counter, so you are not timing work that has not happened yet. It costs roughly 20-30 cycles itself — cheap, but not free.',
      },
      {
        lines: '26-33',
        text: 'A fixed iteration count with no real-time pacing is a closed-loop measurement — the exact shape that goes silent during a stall instead of recording a huge sample, which is the coordinated-omission bug this lesson is about.',
      },
      {
        lines: '31',
        text: 'Three buckets is a toy simplification. A real histogram needs fine, roughly logarithmic resolution near the tail specifically, because that is where the percentile you actually report lives.',
      },
    ],
  },

  deeper: [
    '`__rdtscp` versus `clock_gettime(CLOCK_MONOTONIC)` is not a stylistic choice. `rdtscp` reads a register directly, serialized so it cannot be reordered around the code you are timing, at a cost of roughly 20-30 cycles on modern x86. `clock_gettime` on Linux usually resolves through the vDSO without a full syscall trap, but still costs on the order of 20-40 nanoseconds — an order of magnitude more overhead than a raw TSC read, and comparable to or larger than many of the operations a low-latency system actually cares about timing. Measuring a 15ns function with a 30ns clock call is measuring your clock, not your function.',
    'The TSC itself does not tell you nanoseconds — it tells you ticks, at whatever rate the specific CPU happens to run its counter, which is why calibration is not optional. Modern x86 exposes an "invariant TSC" that ticks at a constant rate regardless of frequency scaling or C-state transitions and stays synchronized across cores on the same socket, which is what makes measuring the ratio once at startup, rather than re-deriving it per sample, both valid and cheap.',
    'A real percentile-accurate histogram cannot be a flat array of nanosecond-wide buckets — a system with a 10-second tail would need ten billion buckets to keep 1ns resolution everywhere. HdrHistogram-style structures instead use buckets that grow geometrically with magnitude, giving a fixed *relative* error (commonly configured around 0.1%) at every scale, so a value near 1µs and a value near 10ms are both represented to the same precision without the memory blowing up.',
    'The corrected recording in the final steps of the scene is exactly what `recordValueWithExpectedInterval` does in HdrHistogram: given the interval you expected between requests, it detects a gap larger than that interval and backfills synthetic samples at the expected cadence between the last recorded time and now, standing in for the requests that should have been measured during the gap. It is not a hack bolted onto the histogram — it is the correction for a measurement methodology that was wrong from the start.',
    'Environment matters as much as the code. CPU C-states let an idle core sleep to save power, and waking from a deep one can cost tens of microseconds before the first instruction even runs — invisible in your code, glaring in your p99.9. Turbo boost ramps frequency up and down based on thermal and power headroom shared across cores, injecting run-to-run variance that has nothing to do with what you changed. Pinning the measuring thread to an isolated core, setting the CPU governor to `performance`, and disabling C-states below C1 are the baseline for a number anyone should trust.',
  ],

  gotchas: [
    'Reporting only the mean. A system with a beautiful 200ns average can have a 50ms p99.9 — the mean is dominated by the huge count of fast samples and is mathematically incapable of surfacing a rare outlier, however catastrophic.',
    'Skipping warm-up. The first thousands of iterations pay for cold caches, an unresolved branch predictor, and first-touch page faults on freshly allocated memory. Folding those samples into your real measurement inflates every percentile with one-time costs.',
    'Leaving turbo boost and C-states enabled "because it is faster". It is also *noisier* — for a benchmark you want a locked, boring frequency, not the fastest possible one, because the goal is a trustworthy number, not a good-looking one.',
    'Writing a closed-loop harness — call the function, wait for it to finish, call it again — and treating its percentiles as representative of an open system. Real request arrival does not wait for the previous request to finish; a harness that does is coordinated omission waiting to happen the moment anything stalls.',
    'Quoting a latency number with no context. "p99.9 = 40µs" means nothing without the hardware, the isolation (was the core pinned? was anything else running?), the sample count, and whether the measurement was open-loop or corrected for coordinated omission.',
  ],

  interview: {
    q: 'You built a lock-free queue and report p99 latency of 80ns. What is the first question I should ask you, and why might your number be wrong?',
    a: [
      'The first question is how the benchmark generated load: closed-loop, where the harness submits the next operation only after the previous one completes, or open-loop, where operations are submitted at a fixed rate regardless of how long any individual one takes. A closed-loop harness under-reports the tail by construction — if the system under test ever stalls, the harness stalls with it and simply never submits, and therefore never measures, the requests that were queued up behind that stall. The number it reports describes only the operations lucky enough to run cleanly.',
      'I would want to know the sample count and whether percentiles were computed over a histogram with adequate resolution near the tail, not a coarse fixed-width bucket scheme that rounds away exactly the values p99.9 depends on. I would also ask about the measurement mechanism itself: `rdtscp`, calibrated once against a trusted clock, versus repeated `clock_gettime` calls whose own overhead can rival the thing being measured — and whether the benchmarking thread was pinned, with turbo and C-states disabled, since frequency scaling alone can produce run-to-run variance larger than the effect being studied.',
      'The detail that shows real experience is naming the fix, not just the bug: either restructure the harness to be genuinely open-loop, submitting at a fixed cadence independent of completion, or keep it closed-loop but record backfilled samples for any gap larger than the expected interval — what HdrHistogram\'s `recordValueWithExpectedInterval` does. Either one turns a number that looks great by accident into one that is actually defensible.',
    ],
  },

  exercise: [
    'Build the calibration code above and, on the same machine, write a second version that uses `clock_gettime(CLOCK_MONOTONIC)` instead of `__rdtscp`. Time ten million calls to each timing mechanism back to back — not the operation under test, the *measurement itself* — and report the per-call overhead difference. That number is why the choice of clock matters before you have measured anything else.',
    'Then build the coordinated-omission bug on purpose: a closed-loop harness that submits work only when the previous unit finishes, with an artificial `sleep_for(50ms)` injected every 10,000 iterations. Compute p99.9 naively, then again using expected-interval backfilling (HdrHistogram\'s `recordValueWithExpectedInterval`, or a hand-rolled equivalent that fills in samples for any gap larger than the intended interval). Confirm the two p99.9 values differ by roughly the order of magnitude the scene shows.',
  ],
};
