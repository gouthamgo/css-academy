import { Box, Text, Tag } from '../../viz/primitives.js';

/* ------------------------------------------------------------------
   Geometry. Four bar slots across the canvas, each with a bar that
   grows from the baseline and a small assembly panel beneath it.
   Heights are proportional to a per-element cost multiplier, on a
   scale where the inlined direct call is ~1x.
   ------------------------------------------------------------------ */
const BASE_Y = 250;
const MAX_H = 176; // corresponds to 16x
const PX_PER_X = MAX_H / 16;
const SLOT_X = [100, 280, 460, 640];
const BAR_W = 74;

const bar = (key, slot, mult, tone) => {
  const h = Math.max(6, mult * PX_PER_X);
  return Box({ key, x: SLOT_X[slot] - BAR_W / 2, y: BASE_Y - h, w: BAR_W, h, tone });
};

const barLabel = (key, slot, text, y = BASE_Y - MAX_H - 14) =>
  Text({ key, x: SLOT_X[slot], y, text, size: 12.5, anchor: 'middle', weight: 700 });

const caption = (key, slot, text, tone) =>
  Text({ key, x: SLOT_X[slot], y: BASE_Y + 16, text, size: 10.5, anchor: 'middle', mono: true, tone });

/* An assembly panel: a box with a few stacked mono lines inside. */
const asmPanel = (key, slot, lines, tone = 'neutral') => {
  const w = 156;
  const x = SLOT_X[slot] - w / 2;
  const y = 288;
  const h = 20 + lines.length * 15;
  return [
    Box({ key, x, y, w, h, tone, dashed: tone === 'neutral' }),
    ...lines.map((t, i) =>
      Text({
        key: `${key}.l${i}`,
        x: x + 8,
        y: y + 14 + i * 15,
        text: t,
        size: 9,
        mono: true,
        opacity: 0.85,
      })
    ),
  ];
};

const flag = (key, slot, text, tone) =>
  Tag({ key, x: SLOT_X[slot] - 46, y: 388, text, tone, w: 92 });

export default {
  oneLiner:
    'The vtable indirection itself costs a couple of cycles — the real bill is the inlining it blocks, and on an unpredictable call site, the misprediction on top of that.',

  whyJob:
    'Trading and ML-infra interviewers ask "why is a virtual call slow" specifically to catch the memorised answer. The candidate who separates the two-cycle indirection from the lost-inlining cost from the branch-predictor cost is the one who has actually looked at the assembly.',

  mentalModel:
    'A direct call is walking straight to a desk you already know. A virtual call is checking a directory first — quick, a couple of seconds — then walking to whichever desk it names. The checking is not what slows you down: it is that you can no longer *plan your route in advance*, and if the directory keeps sending you somewhere different every single time, your feet start guessing wrong too.',

  scene: {
    id: 'virtual-cost-bars',
    title: 'Four ways to call area(), same arithmetic, four different costs',
    width: 720,
    height: 420,
    legend: [
      { tone: 'neutral', label: 'direct call, fully inlined' },
      { tone: 'hit', label: 'indirect call, predicted' },
      { tone: 'miss', label: 'indirect call, mispredicted' },
    ],
    steps: [
      {
        say: 'The setup: a loop calling `shape->area()` a million times, through a `Shape*`. Four ways to write that call site, timed against each other. First, the baseline — call through a `Circle` directly, with nothing virtual about it at all.',
        mark: ['24-25'],
        shapes: () => [
          Text({ key: 'src', x: 360, y: 22, text: 'for (auto& s : shapes) sum += s->area();', size: 11.5, anchor: 'middle', mono: true, opacity: 0.7 }),
          bar('bar.direct', 0, 1, 'neutral'),
          barLabel('lab.direct', 0, '1.0x'),
          caption('cap.direct', 0, 'direct, inlined'),
          ...asmPanel('asm.direct', 0, ['vaddpd ymm0,[rdi]', '; folded into the loop', '; no call at all'], 'neutral'),
        ],
      },
      {
        say: 'The compiler can see every byte of `Circle::area()` at the call site, so it inlines the body, keeps `r` in a register across the whole loop, and vectorizes four elements at a time. There is no call instruction left to measure the cost of.',
        mark: ['9-12'],
        shapes: () => [
          Text({ key: 'src', x: 360, y: 22, text: 'for (auto& s : shapes) sum += s->area();', size: 11.5, anchor: 'middle', mono: true, opacity: 0.7 }),
          bar('bar.direct', 0, 1, 'neutral'),
          barLabel('lab.direct', 0, '1.0x'),
          caption('cap.direct', 0, 'direct, inlined'),
          ...asmPanel('asm.direct', 0, ['vaddpd ymm0,[rdi]', '; folded into the loop', '; no call at all'], 'neutral'),
          bar('bar.mono', 1, 4, 'hit'),
          barLabel('lab.mono', 1, '~4x'),
          caption('cap.mono', 1, 'virtual — monomorphic'),
          ...asmPanel('asm.mono', 1, ['mov rax,[rdi]   ; vptr', 'call [rax+16]   ; slot + jmp', '; target: Circle::area', '; every single time'], 'hit'),
          flag('flag.mono', 1, 'predicted', 'hit'),
        ],
      },
      {
        say: 'Every call in `circles` targets `Circle::area`. The branch target buffer — the predictor for *indirect* branches — learns that address after the first call and predicts it correctly on essentially every one after.',
        mark: ['26-27'],
        predict: {
          ask: 'The vtable load and the indirect call together are maybe two extra instructions over a direct call. Why is the real measured cost here about 4x, not roughly 1.1x?',
          options: [
            { label: 'The vtable itself is usually a cold cache line', correct: false },
            { label: 'An indirect jump always mispredicts, even when the target repeats', correct: false },
            { label: 'The call can no longer be inlined, so the surrounding loop loses register-keeping and vectorization', correct: true },
          ],
          because:
            "The two extra loads and the indirect jump cost a small, roughly constant number of cycles when predicted correctly — that part really is cheap. What is not cheap is that the compiler can no longer see into area() from this call site, so it cannot fold the arithmetic into the loop, keep values in registers across the call, or pack four calls into one vector instruction. The lost optimisation context, not the indirection, is most of the 4x.",
        },
        shapes: () => [
          Text({ key: 'src', x: 360, y: 22, text: 'for (auto& s : shapes) sum += s->area();', size: 11.5, anchor: 'middle', mono: true, opacity: 0.7 }),
          bar('bar.direct', 0, 1, 'neutral'),
          barLabel('lab.direct', 0, '1.0x'),
          caption('cap.direct', 0, 'direct, inlined'),
          ...asmPanel('asm.direct', 0, ['vaddpd ymm0,[rdi]', '; folded into the loop', '; no call at all'], 'neutral'),
          bar('bar.mono', 1, 4, 'hit'),
          barLabel('lab.mono', 1, '~4x'),
          caption('cap.mono', 1, 'virtual — monomorphic'),
          ...asmPanel('asm.mono', 1, ['mov rax,[rdi]   ; vptr', 'call [rax+16]   ; slot + jmp', '; target: Circle::area', '; every single time'], 'hit'),
          flag('flag.mono', 1, 'predicted', 'hit'),
        ],
      },
      {
        say: 'Now `mixed`: the vector alternates `Circle` and `Square` objects, so the very same call site targets a different `area()` on every other iteration.',
        mark: ['28-32'],
        focus: ['bar.mega', 'lab.mega', 'cap.mega', 'asm.mega', 'flag.mega'],
        shapes: () => [
          Text({ key: 'src', x: 360, y: 22, text: 'for (auto& s : shapes) sum += s->area();', size: 11.5, anchor: 'middle', mono: true, opacity: 0.7 }),
          bar('bar.direct', 0, 1, 'neutral'),
          caption('cap.direct', 0, 'direct, inlined'),
          bar('bar.mono', 1, 4, 'hit'),
          caption('cap.mono', 1, 'virtual — monomorphic'),
          bar('bar.mega', 2, 16, 'miss'),
          barLabel('lab.mega', 2, '~16x'),
          caption('cap.mega', 2, 'virtual — megamorphic'),
          ...asmPanel('asm.mega', 2, ['mov rax,[rdi]   ; vptr', 'call [rax+16]   ; slot + jmp', '; target alternates', '; every call'], 'miss'),
          flag('flag.mega', 2, 'mispredicts', 'miss'),
        ],
      },
      {
        say: 'Same two instructions as the monomorphic case — the assembly did not change. What changed is that the target buffer cannot learn a single answer, so a large fraction of these calls now pay a full pipeline flush, roughly 15-20 cycles, stacked on top of the same lost inlining as before.',
        mark: ['28-32'],
        shapes: () => [
          Text({ key: 'src', x: 360, y: 22, text: 'for (auto& s : shapes) sum += s->area();', size: 11.5, anchor: 'middle', mono: true, opacity: 0.7 }),
          bar('bar.direct', 0, 1, 'neutral'),
          caption('cap.direct', 0, 'direct, inlined'),
          bar('bar.mono', 1, 4, 'hit'),
          caption('cap.mono', 1, 'virtual — monomorphic'),
          bar('bar.mega', 2, 16, 'miss'),
          barLabel('lab.mega', 2, '~16x'),
          caption('cap.mega', 2, 'virtual — megamorphic'),
          ...asmPanel('asm.mega', 2, ['mov rax,[rdi]   ; vptr', 'call [rax+16]   ; slot + jmp', '; target alternates', '; every call'], 'miss'),
          flag('flag.mega', 2, 'mispredicts', 'miss'),
          bar('bar.variant', 3, 6, 'borrowed'),
          barLabel('lab.variant', 3, '~6x'),
          caption('cap.variant', 3, 'std::variant + visit'),
          ...asmPanel('asm.variant', 3, ['cmp index,1', 'je .square', 'call Circle::area', '; closed set, no vptr'], 'borrowed'),
        ],
      },
      {
        say: 'A closed, known-in-advance set of alternatives — `std::variant<Circle, Square>` visited with `std::visit` — compiles to a short type check or a jump table instead of a pointer chase through a vtable. It still is not free: every call still dispatches. But a jump table over a fixed, small set of cases predicts far better than an indirect call whose target is unbounded.',
        mark: ['9-12'],
        shapes: () => [
          Text({ key: 'src', x: 360, y: 22, text: 'for (auto& s : shapes) sum += s->area();', size: 11.5, anchor: 'middle', mono: true, opacity: 0.7 }),
          bar('bar.direct', 0, 1, 'neutral'),
          caption('cap.direct', 0, 'direct, inlined'),
          bar('bar.mono', 1, 4, 'hit'),
          caption('cap.mono', 1, 'virtual — monomorphic'),
          bar('bar.mega', 2, 16, 'miss'),
          caption('cap.mega', 2, 'virtual — megamorphic'),
          bar('bar.variant', 3, 6, 'borrowed'),
          barLabel('lab.variant', 3, '~6x'),
          caption('cap.variant', 3, 'std::variant + visit'),
          ...asmPanel('asm.variant', 3, ['cmp index,1', 'je .square', 'call Circle::area', '; closed set, no vptr'], 'borrowed'),
        ],
      },
      {
        say: 'None of this requires giving up runtime polymorphism. Sort `mixed` by concrete type before the scan and the same call site sees a long run of `Circle` calls, then a long run of `Square` calls — monomorphic again, for free, without touching a single virtual function.',
        mark: ['28-32'],
        focus: ['bar.mega', 'lab.mega', 'cap.mega', 'flag.mega', 'sorted.note'],
        shapes: () => [
          Text({ key: 'src', x: 360, y: 22, text: 'std::sort(mixed.begin(), mixed.end(), by_type);', size: 11.5, anchor: 'middle', mono: true, opacity: 0.7 }),
          bar('bar.direct', 0, 1, 'neutral'),
          caption('cap.direct', 0, 'direct, inlined'),
          bar('bar.mono', 1, 4, 'hit'),
          caption('cap.mono', 1, 'virtual — monomorphic'),
          bar('bar.mega', 2, 4, 'hit'),
          barLabel('lab.mega', 2, '~4x'),
          caption('cap.mega', 2, 'megamorphic, sorted first'),
          flag('flag.mega', 2, 'predicted', 'hit'),
          bar('bar.variant', 3, 6, 'borrowed'),
          caption('cap.variant', 3, 'std::variant + visit'),
          Text({
            key: 'sorted.note',
            x: 360,
            y: 400,
            text: 'the sort costs O(n log n) once — the same trick as sorting for branch prediction, applied to an indirect branch',
            size: 11,
            anchor: 'middle',
            opacity: 0.65,
          }),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'shapes.cpp',
    source: `#include <cstdio>
#include <memory>
#include <vector>

struct Shape {
    virtual double area() const = 0;
    virtual ~Shape() = default;
};

struct Circle final : Shape {
    double r;
    double area() const override { return 3.14159265 * r * r; }
};

struct Square final : Shape {
    double s;
    double area() const override { return s * s; }
};

double total_area(const std::vector<std::unique_ptr<Shape>>& shapes) {
    double sum = 0;
    for (const auto& s : shapes) sum += s->area();   // indirect, every element
    return sum;
}

int main() {
    // Monomorphic: every call at this site targets Circle::area.
    std::vector<std::unique_ptr<Shape>> circles;
    for (int i = 0; i < 1'000'000; ++i)
        circles.push_back(std::make_unique<Circle>(Circle{1.0}));

    // Megamorphic: the target alternates, unpredictably, every call.
    std::vector<std::unique_ptr<Shape>> mixed;
    for (int i = 0; i < 1'000'000; ++i) {
        if (i % 2 == 0) mixed.push_back(std::make_unique<Circle>(Circle{1.0}));
        else            mixed.push_back(std::make_unique<Square>(Square{1.0}));
    }

    printf("mono  sum=%.0f\\n", total_area(circles));
    printf("mixed sum=%.0f\\n", total_area(mixed));
    return 0;
}`,
    annotations: [
      {
        lines: '10',
        text: '`final` tells the compiler no further override of `Circle` can exist. That alone only devirtualizes a call where the compiler can also prove the concrete type at that call site — it does not, by itself, change anything about a call made through the generic `Shape&` in `total_area`.',
      },
      {
        lines: '5-7',
        text: 'The hidden vptr lives here, conceptually — every `Shape` carries a pointer to a table of function addresses, set by the constructor that ran.',
      },
      {
        lines: '20',
        text: 'One line, one indirect call, run a million times. Everything this lesson measures comes from what the compiler can and cannot do with this single statement.',
      },
      {
        lines: '26-32',
        text: '`circles` is monomorphic by construction; `mixed` alternates by construction. Nothing else differs between the two benchmarked calls to `total_area`.',
      },
    ],
  },

  deeper: [
    "A virtual call compiles to exactly two extra memory operations and one indirect branch, in the common Itanium ABI GCC and Clang both use. The object's first eight bytes hold a pointer to a static vtable — an array of function pointers, one per virtual function, laid out once per class and shared by every instance. The call loads that pointer, loads the function pointer at a fixed offset into the table, and jumps through it. When both loads hit cache and the indirect branch predicts correctly, this costs perhaps one to three cycles more than a direct call — genuinely cheap, and not where the 4x in this lesson comes from.",
    'The real cost is the optimisation the compiler can no longer do. A direct or inlined call lets the compiler see straight through into the callee: fold constants across it, keep values live in registers instead of spilling them across a call that might clobber anything, and — critically for a tight loop — fuse several iterations into one vector instruction. Once the target is unknown at compile time, none of that is legal, because the compiler cannot prove what the callee does to the machine state. A one-line `area()` that would have cost a single instruction inlined instead pays a full call and return, plus everything the surrounding loop loses by no longer vectorizing. This is usually most of the difference between the direct and the monomorphic-virtual bars.',
    'Indirect branches are predicted by a structure separate from the conditional-branch predictor, generally called a branch target buffer, indexed by the call site and often blended with recent history. A call site that always jumps to the same address — monomorphic — is learned and predicted correctly at close to the same accuracy as an ordinary well-behaved conditional branch. A megamorphic call site, one whose target genuinely varies in a pattern the BTB cannot capture, cannot be learned, and each misprediction pays the same roughly 15-to-20-cycle pipeline flush a mispredicted `if` does — stacked directly on top of the lost inlining, which is why the megamorphic bar is not merely worse than the monomorphic one, it compounds two separate costs.',
    "`final` and devirtualization, CRTP, and `std::variant` solve this in different places. `final` lets the compiler devirtualize *when it can also prove the concrete type* at a given call site — most reliably with link-time optimisation across translation units, or when the object is a local the compiler just constructed. CRTP (a template base parameterised on the derived class) resolves dispatch entirely at compile time, so there is no vptr, no indirection and no misprediction risk at all — the cost instead is a template instantiation per derived type, and the loss of a single ordinary base pointer that can hold any of them at runtime without type erasure. `std::variant` plus `std::visit` keeps a closed, known set of alternatives stored inline, with no separate heap allocation or vptr; dispatch is typically a short type-check chain or a jump table, which predicts close to as well as a monomorphic virtual call once the mix of active types is stable, at the cost of `sizeof` being the size of the largest alternative.",
    "Sorting a megamorphic container by concrete type before a hot scan is the one fix that keeps true runtime polymorphism intact. It converts one call site with an unpredictable target into long, predictable runs of the same target — literally the same idea as sorting data before a branch-heavy filter, applied to an indirect branch instead of a conditional one. It only pays for itself if the sorted order survives many scans, or the sort would have happened anyway; a one-shot pass does not recoup an O(n log n) sort.",
  ],

  gotchas: [
    "`final` on a class does not guarantee devirtualization at every call site that uses it — only where the compiler can also prove the concrete type. A call made through a `Shape&` of unknown provenance stays a real virtual call regardless of what `final` says about `Circle`.",
    'Benchmarking "virtual is slow" at `-O0` measures nothing about virtual dispatch, because at `-O0` nothing gets inlined anyway — the direct-call baseline is artificially slow, and the whole comparison collapses.',
    "`std::variant` degrades badly when its alternatives have very different sizes, since its footprint is the size of the largest one plus a discriminant. A `visit` with many `if constexpr` branches inlined at the call site can itself become a source of instruction-cache pressure if the variant is visited from many places.",
    'A CRTP type cannot be stored in a single heterogeneous container without type erasure of some kind — that erasure typically reintroduces a vtable or an equivalent indirect call, which defeats the reason CRTP was chosen in the first place. CRTP is for dispatch that is known at compile time, not for a runtime-mixed collection.',
    'Sorting by type to fix a megamorphic call site pays off only when the resulting order is scanned many times, or the sort was already needed for another reason. Measure the sort as part of the benchmark, not separately from it, before crediting it with the speedup.',
  ],

  interview: {
    q: '"Why is a virtual function call slow?" — a candidate answers "because of the vtable lookup." How do you push on that answer, and what does a strong response add?',
    a: [
      "I'd ask whether the lookup itself is actually the bottleneck, and how they would find out. The way to separate the claims is a three-way microbenchmark: a direct call, a virtual call through a container that only ever holds one concrete type, and a virtual call through a container mixing several types at the same call site. If the monomorphic-virtual number is close to the direct one, the indirection alone is cheap and the real cost is something else — almost always lost inlining. If the megamorphic number is dramatically worse than the monomorphic one, that gap is misprediction, specifically caused by unpredictability, not by virtual dispatch as such.",
      "The stronger answer names both effects and orders them correctly: the vptr load, the vtable-slot load and the indirect jump cost a small, roughly constant handful of cycles when predicted, which is genuinely minor; the larger and more consistent cost is that the call can no longer be inlined, so the compiler loses constant propagation, register-keeping across the call, and vectorization of the surrounding loop; and on top of both of those, an unpredictable — megamorphic — call site adds a roughly 15-to-20-cycle pipeline flush on a large fraction of calls, because the branch target buffer has nothing stable to learn.",
      "I would confirm it with `perf stat`, and specifically mention that a generic `branch-misses` counter mixes conditional and indirect mispredicts together — isolating the indirect ones needs a more specific counter, `br_misp_retired.indirect` on Intel, or the equivalent on the target architecture. Then I'd name the fixes in order of applicability: `final` plus LTO where the compiler can actually prove the concrete type, CRTP where the type set is fully known at compile time, `std::variant` and `visit` where it is known but needs to be closed-set-heterogeneous at runtime, and sorting by type where the polymorphism genuinely has to stay open-ended.",
    ],
  },

  exercise: [
    'Build the file above with `g++ -O2 -o shapes shapes.cpp` and run `perf stat -e cycles,instructions,branch-misses ./shapes` on the `circles` call and the `mixed` call separately (comment one out, rebuild, repeat). Compare instructions-per-cycle and the branch-miss count between the two.',
    'Look at the generated assembly for `total_area` with `g++ -O2 -S -masm=intel shapes.cpp` and find the `call [rax+...]` — confirm for yourself that the instructions are identical for the monomorphic and megamorphic cases, and that the only difference between the two runs is which addresses actually show up at runtime.',
    'Rewrite `Shape`/`Circle`/`Square` as `std::variant<Circle, Square>` with a free `area(const auto&)` visited by `std::visit`, re-run the same benchmark, and place its number on the same scale as the other three.',
  ],
};
