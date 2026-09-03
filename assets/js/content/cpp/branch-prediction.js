import { Region, Box, Cell, Arrow, Text, Tag } from '../../viz/primitives.js';

/* ------------------------------------------------------------------
   Scene geometry. The pipeline is five fixed stage slots; instructions
   are Cells that keep their key as they move from slot to slot, so the
   engine slides them along the line instead of redrawing them. That
   sliding is the lesson: work is in flight, and in-flight work can be
   thrown away.
   ------------------------------------------------------------------ */
const PIPE = { x: 18, y: 92, w: 684, h: 128 };
const STAGE_Y = 120;
const STAGE_H = 64;
const STAGE_W = 124;
const STAGE_X = [30, 166, 302, 438, 574];
const STAGE_NAME = ['fetch', 'decode', 'execute', 'memory', 'write-back'];

const INSTR_W = 92;
const INSTR_H = 36;
const INSTR_Y = STAGE_Y + 14;

/** The empty machine: the region, the five slots and their names. */
const pipeline = () => [
  Region({
    key: 'pipe',
    x: PIPE.x,
    y: PIPE.y,
    w: PIPE.w,
    h: PIPE.h,
    label: 'CPU PIPELINE — 5 STAGES SHOWN, A REAL CORE IS 15–20 DEEP',
    tone: 'stack',
  }),
  ...STAGE_X.map((x, i) =>
    Box({
      key: `stage.${i}`,
      x,
      y: STAGE_Y,
      w: STAGE_W,
      h: STAGE_H,
      dashed: true,
    })
  ),
  ...STAGE_NAME.map((name, i) =>
    Text({
      key: `sname.${i}`,
      x: STAGE_X[i] + STAGE_W / 2,
      y: 200,
      text: name,
      size: 10.5,
      anchor: 'middle',
      mono: true,
      opacity: 0.6,
    })
  ),
];

/** One instruction sitting in stage `k`. */
const instr = (key, k, value, extra = {}) =>
  Cell({
    key,
    x: STAGE_X[k] + (STAGE_W - INSTR_W) / 2,
    y: INSTR_Y,
    w: INSTR_W,
    h: INSTR_H,
    value,
    ...extra,
  });

/** A drained instruction, fallen out of the pipe into the scrap area. */
const drained = (key, k, value) =>
  Cell({
    key,
    x: STAGE_X[k] + (STAGE_W - INSTR_W) / 2,
    y: 256,
    w: INSTR_W,
    h: INSTR_H,
    value,
    tone: 'freed',
    dashed: true,
  });

/** An empty stage — a bubble. Nothing in it will retire. */
const bubble = (key, k) =>
  Box({
    key,
    x: STAGE_X[k] + (STAGE_W - INSTR_W) / 2,
    y: INSTR_Y,
    w: INSTR_W,
    h: INSTR_H,
    label: 'bubble',
    labelSize: 10.5,
    mono: true,
    tone: 'moved',
    dashed: true,
  });

/** The running cost meter, top left. Same key all the way through. */
const meter = (label, sub, tone = 'neutral') =>
  Box({
    key: 'cyc',
    x: 18,
    y: 26,
    w: 210,
    h: 48,
    label,
    sub,
    tone,
    labelSize: 12.5,
  });

/** The predictor's own scoreboard, top right. */
const scoreboard = (label, sub, tone = 'neutral') =>
  Box({
    key: 'acc',
    x: 430,
    y: 26,
    w: 272,
    h: 48,
    label,
    sub,
    tone,
    labelSize: 12.5,
  });

const source = () =>
  Text({
    key: 'src',
    x: 329,
    y: 50,
    text: 'if (v[i] >= 128) sum += v[i];',
    size: 11.5,
    anchor: 'middle',
    mono: true,
    opacity: 0.75,
  });

/* Eight elements, filtered against 128. Each keeps its own key, so when
   the array is sorted the same eight cells physically slide into order. */
const DATA_Y = 296;
const datum = (key, slot, value, sub, tone) =>
  Cell({
    key,
    x: 40 + slot * 80,
    y: DATA_Y,
    w: 74,
    h: 44,
    value,
    sub,
    tone,
  });

export default {
  oneLiner:
    'Why the CPU guesses which way an if will go, and what it costs you when the guess is wrong.',

  whyJob:
    'A filter over unsorted data can run six times slower than the identical filter over sorted data, with no change to the code. Trading interviewers use exactly this example to find out whether you think in instructions or in pipelines.',

  mentalModel:
    'A kitchen where the food takes twenty minutes to cook cannot wait for you to order. The chef *starts cooking what he thinks you will ask for* the moment you walk in. When he guesses right, your food arrives instantly. When he guesses wrong, everything already on the pass gets thrown in the bin and he starts from raw ingredients — and it is that *bin*, not the guessing, that costs you.',

  scene: {
    id: 'branch-pipeline',
    title: 'A branch through the pipeline, right and then wrong',
    width: 720,
    height: 430,
    legend: [
      { tone: 'borrowed', label: 'speculative — executed, not yet committed' },
      { tone: 'hit', label: 'predicted correctly' },
      { tone: 'miss', label: 'mispredicted — thrown away' },
    ],
    steps: [
      {
        say: 'A core does not run one instruction at a time. It runs an assembly line, with a different instruction in each stage at once. Five stages are drawn here; a real x86 core is 15 to 20 deep and can have several hundred instructions in flight.',
        mark: ['11-13'],
        shapes: () => [
          ...pipeline(),
          meter('cycles lost: 0', 'nothing in flight yet'),
          scoreboard('predictor: idle', 'no branch seen yet'),
          source(),
        ],
      },
      {
        say: 'The loop body is loaded and compared. But the branch is only in *decode* — its condition will not be known for another two or three cycles, and the fetch stage needs the address of the next instruction right now. The front of the line has to guess where the back of the line is going.',
        mark: ['12'],
        shapes: () => [
          ...pipeline(),
          meter('cycles lost: 0', 'the line is full'),
          scoreboard('predictor: consulted', 'indexed by the branch address + history'),
          source(),
          instr('ld', 3, 'ld v[i]'),
          instr('cmp', 2, 'cmp 128', { tone: 'highlight' }),
          instr('br', 1, 'jl skip', { tone: 'highlight' }),
          Tag({ key: 'q', x: 46, y: INSTR_Y + 8, text: 'fetch what?', tone: 'miss' }),
        ],
      },
      {
        say: 'The predictor answers from a few kilobytes of history tables kept per branch address. On ordinary code it is right 97 to 99 percent of the time. The two instructions behind the branch are fetched and executed on the strength of that guess — their results are held aside, not yet written to any register you can name.',
        mark: ['12'],
        shapes: () => [
          ...pipeline(),
          meter('cycles lost: 0', 'the line is still full'),
          scoreboard('predictor: NOT TAKEN', 'confidence high — 97% on this branch'),
          source(),
          instr('ld', 4, 'ld v[i]'),
          instr('cmp', 3, 'cmp 128'),
          instr('br', 2, 'jl skip', { tone: 'highlight' }),
          instr('add', 1, 'add sum', { tone: 'borrowed', dashed: true }),
          instr('inc', 0, 'inc i', { tone: 'borrowed', dashed: true }),
        ],
      },
      {
        say: 'The comparison resolves and the guess was right. The speculative work becomes real work — it was already done, so the branch cost nothing measurable. A well-predicted branch is under one cycle of throughput; a modern core can retire two of them per cycle.',
        mark: ['12'],
        shapes: () => [
          ...pipeline(),
          meter('cycles lost: 0', 'branch resolved — guess confirmed'),
          scoreboard('predictor: correct', 'counter saturates further toward NOT TAKEN'),
          source(),
          instr('cmp', 4, 'cmp 128'),
          instr('br', 3, 'jl skip', { tone: 'hit' }),
          instr('add', 2, 'add sum', { tone: 'owned' }),
          instr('inc', 1, 'inc i', { tone: 'owned' }),
        ],
      },
      {
        say: 'Next element, same branch, different data — and this time the comparison resolves the other way. Everything the core fetched after the branch belongs to a path that is not being taken.',
        mark: ['12'],
        predict: {
          ask: 'The branch resolves against the prediction. What happens to the two instructions already sitting in the pipeline behind it?',
          options: [
            {
              label: 'They are kept — the work was valid, the core just reorders it',
              correct: false,
            },
            {
              label: 'They finish, and their results are ignored, so only energy is wasted',
              correct: false,
            },
            {
              label: 'They are squashed, fetch restarts from the correct address, and nothing retires for 15–20 cycles',
              correct: true,
            },
          ],
          because:
            'Their results were never architecturally visible, so discarding them is cheap and correct. The expense is the empty pipeline afterwards: on Skylake the recovery is about 16–17 cycles, on Zen closer to 19. At 3 GHz that is roughly 5 ns, and on a 4-wide core it is around 70 issue slots that produced nothing.',
        },
        shapes: () => [
          ...pipeline(),
          meter('cycles lost: 0', 'branch resolving now…', 'highlight'),
          scoreboard('predictor: NOT TAKEN', 'but v[i] is 231 — the branch IS taken', 'miss'),
          source(),
          instr('ld2', 4, 'ld v[i]'),
          instr('cmp2', 3, 'cmp 128'),
          instr('br2', 2, 'jl skip', { tone: 'miss' }),
          instr('add2', 1, 'add sum', { tone: 'borrowed', dashed: true }),
          instr('inc2', 0, 'inc i', { tone: 'borrowed', dashed: true }),
        ],
      },
      {
        say: 'The two speculative instructions are drained and the front of the pipe refills from the correct address. Nothing retires while the bubbles walk through. This is not queueing delay you can overlap with other work — it is dead time on this core.',
        mark: ['12'],
        focus: ['cyc', 'add2', 'inc2', 'bub0', 'bub1', 'squashed', 'penalty'],
        shapes: () => [
          ...pipeline(),
          meter('cycles lost: ~17', 'per mispredict, per branch', 'miss'),
          scoreboard('predictor: updated', 'the history table now leans TAKEN', 'miss'),
          source(),
          instr('ld2', 4, 'ld v[i]'),
          instr('cmp2', 3, 'cmp 128'),
          instr('br2', 2, 'jl skip', { tone: 'miss' }),
          bubble('bub1', 1),
          bubble('bub0', 0),
          drained('add2', 1, 'add sum'),
          drained('inc2', 0, 'inc i'),
          Tag({
            key: 'squashed',
            x: 300,
            y: 266,
            text: 'squashed — none of this is kept',
            tone: 'freed',
          }),
          Text({
            key: 'penalty',
            x: 360,
            y: 330,
            text: '≈17 cycles ≈ 5 ns at 3 GHz ≈ 70 wasted issue slots on a 4-wide core',
            size: 12,
            anchor: 'middle',
            tone: 'miss',
          }),
        ],
      },
      {
        say: 'Now the same loop over eight unsorted values. Every element is an independent coin flip, so the history tables have nothing to learn and roughly half the branches are wrong. The loop body is two cycles of arithmetic carrying nine cycles of penalty.',
        mark: ['12', '30'],
        focus: [
          'cyc', 'acc', 'v231', 'v178', 'v61', 'v250', 'v12', 'v99', 'v140', 'v33', 'note',
        ],
        shapes: () => [
          ...pipeline(),
          meter('~10.5 cycles / element', 'measured over 4 M elements', 'miss'),
          scoreboard('predictor: ~50% correct', 'random data — nothing to learn', 'miss'),
          source(),
          datum('v231', 0, '231', 'take ✗', 'miss'),
          datum('v178', 1, '178', 'take ✓', 'hit'),
          datum('v61', 2, '61', 'skip ✗', 'miss'),
          datum('v250', 3, '250', 'take ✗', 'miss'),
          datum('v12', 4, '12', 'skip ✓', 'hit'),
          datum('v99', 5, '99', 'skip ✓', 'hit'),
          datum('v140', 6, '140', 'take ✗', 'miss'),
          datum('v33', 7, '33', 'skip ✓', 'hit'),
          Text({
            key: 'note',
            x: 360,
            y: 384,
            text: '2 cycles of work + 0.5 mispredicts × 17 cycles ≈ 10.5 cycles per element',
            size: 12,
            anchor: 'middle',
            tone: 'miss',
          }),
        ],
      },
      {
        say: 'Sort the array first and the same eight values slide into order. The branch now goes one way for a long run and then the other way for a long run, so exactly one prediction in the whole array is wrong. Not one instruction changed — only the order of the data did.',
        mark: ['38'],
        focus: [
          'cyc', 'acc', 'v231', 'v178', 'v61', 'v250', 'v12', 'v99', 'v140', 'v33', 'note',
        ],
        shapes: () => [
          ...pipeline(),
          meter('~2.1 cycles / element', 'same code, sorted input', 'hit'),
          scoreboard('predictor: >99% correct', 'one flip in the whole array', 'hit'),
          source(),
          datum('v12', 0, '12', 'skip ✓', 'hit'),
          datum('v33', 1, '33', 'skip ✓', 'hit'),
          datum('v61', 2, '61', 'skip ✓', 'hit'),
          datum('v99', 3, '99', 'skip ✓', 'hit'),
          datum('v140', 4, '140', 'take ✗', 'miss'),
          datum('v178', 5, '178', 'take ✓', 'hit'),
          datum('v231', 6, '231', 'take ✓', 'hit'),
          datum('v250', 7, '250', 'take ✓', 'hit'),
          Text({
            key: 'note',
            x: 360,
            y: 384,
            text: 'the classic benchmark: 11.5 s unsorted versus 1.9 s sorted, byte-identical code',
            size: 12,
            anchor: 'middle',
            tone: 'hit',
          }),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'branches.cpp',
    source: `#include <algorithm>
#include <chrono>
#include <cstdio>
#include <random>
#include <vector>

// Sums the elements >= 128. The work is identical either way;
// only the order of the data changes.
long long filter_sum(const std::vector<int>& v) {
    long long sum = 0;
    for (int x : v) {
        if (x >= 128) sum += x;          // the unpredictable branch
    }
    return sum;
}

// Same answer, no branch: build a mask of all-ones or all-zeros.
long long filter_sum_branchless(const std::vector<int>& v) {
    long long sum = 0;
    for (int x : v) {
        long long mask = -(long long)(x >= 128);
        sum += x & mask;
    }
    return sum;
}

int main() {
    std::vector<int> v(1 << 22);
    std::mt19937 rng(42);
    for (int& x : v) x = rng() % 256;

    for (int pass = 0; pass < 2; ++pass) {
        auto t0 = std::chrono::steady_clock::now();
        long long s = filter_sum(v);
        auto t1 = std::chrono::steady_clock::now();
        double ms = std::chrono::duration<double, std::milli>(t1 - t0).count();
        printf("%-8s %7.1f ms  sum=%lld\\n", pass ? "sorted" : "unsorted", ms, s);
        std::sort(v.begin(), v.end());
    }
    printf("branchless: %lld\\n", filter_sum_branchless(v));
    return 0;
}`,
    annotations: [
      {
        lines: '12',
        text: 'The condition depends on data the CPU has not looked at yet, so the front end must guess. With random values in `v`, the guess is a coin flip.',
      },
      {
        lines: '21-22',
        text: '`-(x >= 128)` is `0` or `-1`, which as a bit pattern is all zeros or all ones. Anding with it adds `x` or adds nothing — the *same* instructions run for every element, so there is no branch to mispredict.',
      },
      {
        lines: '30',
        text: 'Values in `[0, 256)` around a threshold of 128 is the worst case on purpose: half above, half below, in no pattern the history tables can capture.',
      },
      {
        lines: '38',
        text: 'The sort is the only difference between the two passes. It costs O(n log n) once, and it changes nothing about the loop except which way the branch goes.',
      },
    ],
  },

  deeper: [
    'The predictor is a real piece of silicon with a budget: a few kilobytes of tables indexed by a hash of the branch address and a global history register recording the last few dozen branch outcomes. The textbook model is a two-bit saturating counter per branch — it takes two wrong guesses in a row to change its mind, so a loop that runs 1000 iterations mispredicts only on the final exit. Modern cores use TAGE-style predictors that keep several history lengths at once and pick whichever is currently most accurate, which is why they nail patterns like "taken, taken, not taken, repeating" that a two-bit counter cannot.',
    'The penalty is not the cost of guessing, it is the cost of the empty pipeline. When the branch resolves in the execute stage and disagrees with the prediction, every instruction fetched after it is squashed, the front end is redirected, and the machine runs on nothing until the first correct instruction reaches the back. Measured recovery is about 16–17 cycles on Skylake and 18–19 on Zen. On a 4-wide core those cycles could have retired around 70 instructions, which is why a mispredict costs so much more than the two instructions actually thrown away.',
    'Branchless code converts a *control* dependency into a *data* dependency. `cmov` (or the mask trick in the code above) always executes both possibilities and selects one, so there is nothing to predict. The catch is that the select now sits on the critical dependency chain: with a well-predicted branch, speculation lets the machine run ahead of the condition entirely, while `cmov` forces it to wait for the comparison. The break-even is roughly a 5–10 percent mispredict rate. Below that, the branch is faster. This is why compilers refuse to emit `cmov` unless profile data or a very obvious pattern says the branch is unpredictable, and why `-O3` sometimes makes a benchmark slower.',
    '`[[likely]]` and `[[unlikely]]` do not talk to the predictor at all — nothing in the instruction stream can. They tell the *compiler* which side is the fall-through path, so the hot code is laid out contiguously and the cold path is moved to the end of the function or another section. The wins are in instruction-cache density and in fewer taken branches, not in prediction accuracy. Profile-guided optimisation does the same job from measurement instead of from your guess, and does it better; reach for `-fprofile-generate` / `-fprofile-use` before you reach for the attributes.',
    'The best branch is one that is not there. Sorting or partitioning the data makes the branch predictable; a branchless mask removes it; `std::partition` once before a loop that runs many times amortises the sort away; and replacing a per-element `if` with two tight loops over pre-separated ranges removes both the branch and the mispredict. Notice that all four of these are changes to *data layout*, not to the arithmetic. That is the recurring theme of this tier.',
  ],

  gotchas: [
    'At `-O3` with AVX2, GCC and Clang often turn the classic sorted-versus-unsorted example branchless on their own, and then both versions run at the same speed. If your benchmark shows no difference, check the assembly for `vpcmpgtd`/`blend` or `cmov` before concluding that branch prediction does not matter.',
    'Making a *predictable* branch branchless is a pessimisation. `cmov` puts the comparison on the dependency chain and blocks speculation, so a 99-percent-predicted branch that took under a cycle can become a 3–4 cycle serialised select.',
    '`[[likely]]` is a layout hint to the compiler, not a hint to the hardware predictor. Putting it on a branch that is actually a coin flip changes nothing about the mispredict rate and can hurt by pushing the real hot path into cold code.',
    'Sorting to gain predictability costs O(n log n). It pays only when you iterate over the sorted data many times, or when the sort was going to happen anyway. Measure the sort inside the benchmark, not outside it.',
    'Indirect branches — virtual calls, function pointers, `switch` jump tables — are predicted by a separate structure, the branch target buffer, and pay the same 15–20 cycle penalty when the target changes unpredictably. That is the subject of the next lesson, and it is where most real-world mispredicts in C++ code live.',
  ],

  interview: {
    q: 'You have profiled a hot loop that walks a vector of ints and accumulates only the ones above a threshold. `perf` says the loop is the bottleneck. What do you look at, and what do you try?',
    a: [
      'First I would confirm the diagnosis rather than assume it: `perf stat -e branches,branch-misses,instructions,cycles` on the loop. If branch-misses over branches is up near 40–50 percent and IPC is under 1, the machine is spending its time refilling the pipeline rather than doing arithmetic. If the mispredict rate is one or two percent, branch prediction is not my problem and I would go look at cache misses instead.',
      'Assuming it is mispredicts, the fixes in order of preference. Remove the branch by making it arithmetic: `sum += x & -(long long)(x >= threshold)`, or let the compiler do it by writing the loop in a form it will vectorize, which is branchless by construction because the compare becomes a mask. Remove the branch by changing the data: partition once so the loop becomes two branch-free loops over contiguous ranges. Or make the branch predictable by sorting, if the data is going to be traversed repeatedly. I would then re-measure, because branchless code is not automatically faster.',
      'The detail I would want to be sure to say is that the penalty is a pipeline refill, not an instruction cost — roughly 15 to 20 cycles on current x86, which on a 4-wide core is about 70 instruction slots that produced nothing. That framing is what tells you the break-even: if the branch predicts at 99 percent, its expected cost is about 0.2 cycles and no branchless trick will beat it, so the branchless rewrite is only a win once the mispredict rate is somewhere above five percent or so. I would also check whether the compiler already went branchless before touching anything, because at `-O3` it very often has.',
    ],
  },

  exercise: [
    'Build the file above with `g++ -O2 -o branches branches.cpp` and run it. You should see the sorted pass finish several times faster than the unsorted pass on identical data. Then run `perf stat -e branches,branch-misses ./branches` and read the mispredict percentage — it is the number the whole lesson is about.',
    'Now rebuild with `-O3 -march=native` and run again. On many machines the gap collapses, because the compiler vectorized the loop and there is no longer a branch. Confirm it by looking at the assembly: `g++ -O3 -march=native -S -masm=intel branches.cpp` and search for `cmov`, `vpcmpgtd` or `vblendvps` in `filter_sum`. Learning to check the assembly before believing a benchmark is the habit this exercise is really teaching.',
    'Finally, time `filter_sum_branchless` against `filter_sum` on *sorted* data. It should be slower. Write down why in one sentence — if you can, you understand speculation.',
  ],
};
