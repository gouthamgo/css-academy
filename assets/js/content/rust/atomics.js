import { Region, Box, Cell, Arrow, Text, Tag } from '../../viz/primitives.js';

/* Two lanes, deliberately laid out like the C++ atomics scene this
   lesson pairs with — same shape, same edge, same reveal — because
   the memory model underneath is literally the same one. A header
   above the lanes holds the two pieces of "shared state": the
   AtomicPtr itself and the heap Config it points at. */
const LANE_A = { x: 36, y: 112, w: 304, h: 290 };
const LANE_B = { x: 380, y: 112, w: 304, h: 290 };
const OP_W = 232;
const A_X = 52;
const B_X = 396;
const ROW1 = 176;
const ROW2 = 226;

const lanes = () => [
  Region({ ...LANE_A, key: 'laneA', label: 'THREAD writer — publishes', tone: 'stack' }),
  Region({ ...LANE_B, key: 'laneB', label: 'THREAD reader — subscribes', tone: 'stack' }),
];

const header = (ptrVal, ptrTone, fieldVal, fieldTone) => [
  Text({ key: 'hdr', x: 360, y: 14, text: 'shared state', size: 10, anchor: 'middle', mono: true, opacity: 0.5 }),
  Box({ key: 'heapCfg', x: 210, y: 26, w: 190, h: 54, label: 'Config (heap)', sub: `rate_limit: ${fieldVal}`, labelSize: 11, tone: fieldTone }),
  Cell({ key: 'ptrCell', x: 420, y: 26, w: 130, h: 54, name: 'CONFIG', sub: 'AtomicPtr<Config>', value: ptrVal, tone: ptrTone }),
];

const op = (key, x, y, label, tone = 'neutral', dashed = false) =>
  Box({ key, x, y, w: OP_W, h: 40, label, labelSize: 11, mono: true, tone, dashed });

export default {
  oneLiner:
    'What `AtomicUsize`, `fetch_add`, and compare-and-swap actually promise — and why `Relaxed`/`Acquire`/`Release`/`SeqCst` are the exact same six orderings C++ uses, not a Rust reinvention.',

  whyJob:
    'This is asked identically in a Rust interview and a C++ interview, because it is the same memory model with the same names — the interviewer wants to hear you name the ordering and justify it, not just say "make it atomic" and hope contention never comes up.',

  mentalModel:
    'A release store is *sealing a box and leaving a note on the shelf*: "everything I did before this is safe to read now." An acquire load is *reading that note before you touch the box*. Skip the note — `Relaxed` — and nothing stops you from opening a box that looks delivered but was packed five nanoseconds after you looked. Rust did not invent a second version of this idea: `std::sync::atomic::Ordering` is the C++11 memory model imported wholesale, variant for variant.',

  scene: {
    id: 'rust-release-acquire',
    title: 'One store, one load, one edge between two threads',
    width: 720,
    height: 420,
    legend: [
      { tone: 'highlight', label: 'currently executing / the edge' },
      { tone: 'owned', label: 'safely visible' },
      { tone: 'freed', label: 'stale — no ordering guarantee' },
    ],
    steps: [
      {
        say: 'A writer thread will build a `Config` on the heap and publish a pointer to it through a `static AtomicPtr`. A reader thread spins on that pointer. Neither has run yet — `CONFIG` is null, and no `Config` exists.',
        mark: ['7', '11'],
        shapes: () => [
          ...header('null', 'neutral', '—', 'neutral'),
          ...lanes(),
          op('build', A_X, ROW1, 'Box::new(Config{rate_limit:500})'),
          op('store', A_X, ROW2, 'CONFIG.store(cfg, Release);'),
          op('load', B_X, ROW1, 'loop { CONFIG.load(Acquire) }'),
          op('read', B_X, ROW2, '(*p).rate_limit', 'neutral', true),
        ],
      },
      {
        say: 'The writer allocates `Config { rate_limit: 500 }` on the heap. This write is completely ordinary — nothing here stops the compiler or another core from delaying when, or whether, a different thread can see it.',
        mark: ['11'],
        focus: ['build', 'heapCfg'],
        shapes: () => [
          ...header('null', 'neutral', '500', 'highlight'),
          ...lanes(),
          op('build', A_X, ROW1, 'Box::new(Config{rate_limit:500})', 'highlight'),
          op('store', A_X, ROW2, 'CONFIG.store(cfg, Release);'),
          op('load', B_X, ROW1, 'loop { CONFIG.load(Acquire) }'),
          op('read', B_X, ROW2, '(*p).rate_limit', 'neutral', true),
        ],
      },
      {
        say: 'The writer stores the pointer into `CONFIG` with `Ordering::Release`. That single store does two jobs: it publishes its own new value, and it stamps every ordinary write before it in program order — including building the `Config` — as safe to hand off.',
        mark: ['12'],
        focus: ['store', 'ptrCell', 'heapCfg'],
        shapes: () => [
          ...header('0x7f2a…', 'highlight', '500', 'owned'),
          ...lanes(),
          op('build', A_X, ROW1, 'Box::new(Config{rate_limit:500})', 'owned'),
          op('store', A_X, ROW2, 'CONFIG.store(cfg, Release);', 'highlight'),
          op('load', B_X, ROW1, 'loop { CONFIG.load(Acquire) }'),
          op('read', B_X, ROW2, '(*p).rate_limit', 'neutral', true),
        ],
      },
      {
        say: 'The reader\'s acquire load finally reads the non-null pointer. The instant it does, a synchronizes-with edge exists between the writer\'s release and this exact load — and that edge, not any property of `Config` itself, is what drags "build the Config" into "happened before" the reader\'s next line.',
        mark: ['17'],
        focus: ['store', 'load', 'edge', 'shadeA', 'shadeB'],
        shapes: () => [
          ...header('0x7f2a…', 'owned', '500', 'owned'),
          ...lanes(),
          Box({ key: 'shadeA', x: 44, y: 160, w: 248, h: 112, tone: 'owned', dashed: true, opacity: 0.35 }),
          Box({ key: 'shadeB', x: 388, y: 160, w: 248, h: 112, tone: 'owned', dashed: true, opacity: 0.35 }),
          op('build', A_X, ROW1, 'Box::new(Config{rate_limit:500})', 'owned'),
          op('store', A_X, ROW2, 'CONFIG.store(cfg, Release);', 'highlight'),
          op('load', B_X, ROW1, 'loop { CONFIG.load(Acquire) }', 'highlight'),
          op('read', B_X, ROW2, '(*p).rate_limit', 'neutral', true),
          Arrow({
            key: 'edge', from: [284, 246], to: [396, 196], shape: 'curve', bend: -60,
            tone: 'highlight', thick: true, label: 'synchronizes-with',
          }),
        ],
      },
      {
        say: 'The reader dereferences the pointer and reads `rate_limit = 500` — guaranteed, not merely likely. `p` itself was the only atomic thing here; every bit of the safety on the field it points to was inherited from the release/acquire pair.',
        mark: ['19'],
        shapes: () => [
          ...header('0x7f2a…', 'owned', '500', 'owned'),
          ...lanes(),
          op('build', A_X, ROW1, 'Box::new(Config{rate_limit:500})', 'owned'),
          op('store', A_X, ROW2, 'CONFIG.store(cfg, Release);', 'owned'),
          op('load', B_X, ROW1, 'loop { CONFIG.load(Acquire) }', 'owned'),
          op('read', B_X, ROW2, '(*p).rate_limit', 'owned'),
          Arrow({
            key: 'edge', from: [284, 246], to: [396, 196], shape: 'curve', bend: -60,
            tone: 'owned', thick: true, label: 'synchronizes-with',
          }),
          Tag({ key: 'safe', x: 500, y: 260, text: 'reads 500, always', tone: 'owned' }),
        ],
      },
      {
        say: 'Now the same code with both orderings weakened to `Ordering::Relaxed`. `CONFIG` is still atomic — the reader will still eventually see a non-null pointer — but there is no synchronizes-with edge any more.',
        mark: [],
        predict: {
          ask: 'With both the store and the load on Relaxed, once the reader observes the non-null CONFIG pointer, what does Rust guarantee about the Config data behind it?',
          options: [
            { label: 'The write to rate_limit is still guaranteed visible — it happened first in program order', correct: false },
            { label: 'Nothing beyond the pointer bits themselves — reading through it can see stale memory', correct: true },
            { label: 'Relaxed still orders every access to the same atomic, so rate_limit is safe by extension', correct: false },
          ],
          because:
            '`Relaxed` guarantees only that operations on this one atomic are indivisible and observed in a single per-object modification order — it says nothing about any *other* memory. There is no happens-before edge carrying "the Config was built" across to the reader, so a reordering by the compiler or simply a slow cache line can let the pointer arrive before the bytes it points to do. This is precisely the class of bug release/acquire exists to close, and the rule is identical in C++: a relaxed atomic never carries other writes across threads with it.',
        },
        focus: ['store', 'load', 'noEdge', 'read'],
        shapes: () => [
          ...header('0x7f2a… (relaxed)', 'owned', '?', 'neutral'),
          ...lanes(),
          op('build', A_X, ROW1, 'Box::new(Config{rate_limit:500})', 'neutral'),
          op('store', A_X, ROW2, 'CONFIG.store(cfg, Relaxed);', 'neutral'),
          op('load', B_X, ROW1, 'loop { CONFIG.load(Relaxed) }', 'owned'),
          op('read', B_X, ROW2, '(*p).rate_limit', 'freed', true),
          Tag({ key: 'noEdge', x: 300, y: 190, text: 'no happens-before edge', tone: 'freed' }),
        ],
      },
      {
        say: 'On real hardware this happens: the reader\'s core can see the updated `CONFIG` pointer through cache coherence before the write to `rate_limit`, five bytes away, has propagated through that same path. `Relaxed` never promised otherwise — the reader dereferences a perfectly valid, non-null pointer into memory that has not caught up yet.',
        mark: [],
        focus: ['ptrCell', 'heapCfg', 'stale', 'bView'],
        shapes: () => [
          ...header('0x7f2a…', 'neutral', '0', 'freed'),
          ...lanes(),
          op('build', A_X, ROW1, 'Box::new(Config{rate_limit:500})', 'neutral'),
          op('store', A_X, ROW2, 'CONFIG.store(cfg, Relaxed);', 'neutral'),
          op('load', B_X, ROW1, 'loop { CONFIG.load(Relaxed) }', 'owned'),
          op('read', B_X, ROW2, '(*p).rate_limit', 'freed'),
          Cell({ key: 'bView', x: 396, y: 290, w: 150, h: 40, name: "reader's rate_limit", value: '0', tone: 'freed' }),
          Tag({ key: 'stale', x: 386, y: 342, text: 'stale contents behind a published pointer', tone: 'freed' }),
        ],
      },
    ],
  },

  code: {
    lang: 'rust',
    filename: 'main.rs',
    source: `use std::sync::atomic::{AtomicPtr, AtomicUsize, Ordering};
use std::thread;
use std::ptr;

struct Config { rate_limit: u64 }

static CONFIG: AtomicPtr<Config> = AtomicPtr::new(ptr::null_mut());

fn main() {
    let writer = thread::spawn(|| {
        let cfg = Box::into_raw(Box::new(Config { rate_limit: 500 }));
        CONFIG.store(cfg, Ordering::Release);
    });

    let reader = thread::spawn(|| {
        loop {
            let p = CONFIG.load(Ordering::Acquire);
            if !p.is_null() {
                println!("rate_limit = {}", unsafe { (*p).rate_limit });
                break;
            }
        }
    });

    writer.join().unwrap();
    reader.join().unwrap();

    // fetch_add: a plain atomic counter, no ordering story needed
    let hits = AtomicUsize::new(0);
    hits.fetch_add(1, Ordering::Relaxed);

    // compare-and-swap loop: retry until nobody raced us
    let mut current = hits.load(Ordering::Relaxed);
    loop {
        let new = current + 1;
        match hits.compare_exchange_weak(current, new, Ordering::AcqRel, Ordering::Relaxed) {
            Ok(_) => break,
            Err(observed) => current = observed,
        }
    }
    println!("hits = {}", hits.load(Ordering::Relaxed));
}`,
    annotations: [
      {
        lines: '11-12',
        text: 'Order matters here exactly as in C++: build the `Config` fully first, publish the pointer second. Swap them and the release would publish a pointer to memory that is not finished yet.',
      },
      {
        lines: '17',
        text: 'The acquire load only synchronizes when it actually reads the value the release wrote. A load that reads a stale null has synchronized with nothing — the loop exists precisely to keep trying until it does.',
      },
      {
        lines: '19',
        text: 'This dereference is not atomic and does not need to be — its safety is inherited entirely from the release/acquire pair above it, not from anything about `Config`.',
      },
      {
        lines: '33-39',
        text: '`compare_exchange_weak` takes two orderings on purpose: one for success, one for failure. A failed attempt did not modify memory and publishes nothing, so it can use the cheaper `Relaxed` even when success needs `AcqRel`.',
      },
    ],
  },

  deeper: [
    'This is not "a memory model like C++\'s" — it is the same one. `std::sync::atomic::Ordering` has the same six variants as `std::memory_order`, defined with the same happens-before rules, because Rust\'s specification deliberately reuses the C++11 memory model rather than inventing a competing one. A candidate who has internalised release/acquire for one language already knows it for the other; the keywords are `Ordering::Release` instead of `std::memory_order_release`, and nothing about the reasoning changes.',
    'An atomic operation guarantees exactly two things: it cannot be observed half-done (no torn reads or writes), and a read-modify-write like `fetch_add` happens as one indivisible step even under contention. Neither says anything about *when* another thread sees the result, or what else becomes visible alongside it — that second question is entirely the job of the `Ordering` argument, a separate axis from atomicity itself. `Relaxed` gives you the first guarantee and nothing else; `Acquire`/`Release` add a one-directional happens-before edge between a matched pair; `AcqRel` is both roles on one read-modify-write; `SeqCst` adds a single global total order over every `SeqCst` operation in the program, at the highest cost.',
    'On x86-64 this is nearly free: loads and stores are already strongly ordered by the hardware, so a `Release` store and an `Acquire` load compile to the same plain `mov` a `Relaxed` one would — the CPU enforces the ordering for free, and the compiler\'s job is only to stop *itself* reordering across the operation. On ARM64 the difference is real: `Release`/`Acquire` lower to `stlr`/`ldar`, genuine fence-carrying instructions, while `Relaxed` lowers to a plain `str`/`ldr`. Code that "just works" on an x86 laptop and breaks on an ARM server is very often a missing `Acquire`/`Release` that x86\'s strong default silently covered for — this is the exact same trap the C++ version of this lesson warns about, because it is the exact same hardware underneath either language.',
    'A compare-and-swap loop is how you build a lock-free update without a mutex: read the current value, compute the new one, and try to swap it in only if nobody else changed it first — retrying from a fresh read on failure. `compare_exchange_weak` may fail spuriously even when the comparison would have succeeded (useful in a loop, where a spurious failure just costs one extra iteration); `compare_exchange` (the "strong" version) never does, which matters for a one-shot attempt outside a loop.',
    'The practical rule interviewers want to hear: default to `SeqCst` until you have a specific, measured reason not to — it is never wrong, only sometimes slower. Reach for `Acquire`/`Release` once you can name the exact pair of operations that must synchronize, as in the diagram above. Reach for `Relaxed` only when you need a number to be atomic — a statistics counter, a reference count you never act on the observation of — and you can prove nothing else in the program depends on ordering relative to it.',
  ],

  gotchas: [
    '"Relaxed is faster" is only true insofar as it removes fence instructions on weak hardware; on x86 it usually compiles to the identical instruction as `Acquire`/`Release`, so choosing `Relaxed` for a supposed speed win without checking the actual ordering requirement is a correctness bug wearing a performance justification.',
    'Release and acquire only synchronize with each other when the acquire actually reads the value the release wrote. A load that reads an older value, or a release nobody ever acquires, forms no edge at all — the pairing is about the specific runtime read, not the presence of the right words in the source.',
    'Publishing a pointer with `Release` protects everything written *before* the store in program order. Writing to the pointee *after* the release — or reading it before checking the pointer is non-null — reintroduces the exact race the release was meant to prevent.',
    '`SeqCst` gives a single total order across all `SeqCst` operations, but that guarantee evaporates the instant you mix in a `Relaxed` or `Acquire`/`Release` access to the same atomic — do not assume `SeqCst` reasoning extends to weaker accesses of the same variable.',
    'A spin loop on `load(Ordering::Relaxed)` is not the same bug as spinning on a plain non-atomic value — the atomic load cannot be hoisted out of the loop by the compiler, because the standard requires it to actually observe memory each time. The missing guarantee is about *other* memory becoming visible, not about the loop terminating.',
  ],

  interview: {
    q: 'A spin loop reads `CONFIG.load(Ordering::Acquire)` and then dereferences the pointer it gets. Would `Relaxed` be just as safe, since the `AtomicPtr` load is atomic either way?',
    a: [
      'Relaxed would keep the pointer load itself correctly atomic — no torn pointer value, the loop still eventually sees the new value — but atomicity of the pointer was never the problem being solved. The reason for `Acquire` is everything the pointer points *at*. Without it pairing with a `Release` on the writer\'s side, there is no happens-before edge, and the writes the writer made before publishing the pointer are not guaranteed visible once the reader dereferences it.',
      'The detail that separates a memorised answer from an understood one is naming the specific pairing: it is not "acquire is safer," it is "this acquire load, if it reads the value written by a specific release store, creates a synchronizes-with edge to that exact store, and drags every ordinary write before that store into happens-before every ordinary read after this load." Swap either side to `Relaxed` and the edge disappears even though both operations remain individually atomic.',
      'Worth adding unprompted: this is not a Rust-specific rule to memorise separately from C++ — `std::sync::atomic::Ordering` is a direct port of `std::memory_order`, same six variants, same happens-before definition. An engineer who has profiled this in one language can walk into the other and give the identical answer; interviewers at firms running both languages use exactly this question to check that the understanding, not the syntax, transferred.',
    ],
  },

  exercise: [
    'Build the `main.rs` above and confirm it prints `rate_limit = 500` every run. Then change both orderings to `Ordering::Relaxed`, rebuild, and run it in a loop a few hundred times — on x86-64 you will likely never see it fail, which is the point: the bug is real, the hardware is just hiding it from you locally.',
    'Open the release/acquire and relaxed versions side by side in [Compiler Explorer](https://godbolt.org) targeting `rustc` for both `x86-64` and `ARM64`. On x86-64 the release store and the relaxed store should compile to the identical `mov`. On ARM64 they will not — the release store gets `stlr` and the relaxed store gets a plain `str`. Then open the equivalent C++ `atomic_store_explicit` calls in the same tool and compare the generated assembly directly — this is the fastest way to see for yourself that the two languages are compiling the same model, not two different ones that happen to use similar words.',
  ],
};
