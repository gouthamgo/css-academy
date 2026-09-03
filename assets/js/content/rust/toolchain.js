import { Region, Box, Arrow, Text, Tag } from '../../viz/primitives.js';

/* Shared geometry. Four columns: manifest, crate graph, the compiler,
   the artifacts it produces. Every step agrees on these numbers so a
   box that stays put across steps really does stay put. */
const CARGO = { x: 20, y: 52, w: 678, h: 240 };

const COL_MANIFEST = { x: 30, w: 124 };
const COL_CRATE = { x: 178, w: 136 };
const COL_RUSTC = { x: 340, w: 104 };
const COL_ART = { x: 470, w: 150 };

const ROW = [84, 152, 220]; // app / serde_json / serde
const ROW_H = 52;
const MID = (r) => ROW[r] + ROW_H / 2;

const cargoRegion = () =>
  Region({ key: 'r.cargo', ...CARGO, label: 'CARGO — resolve, schedule, cache', tone: 'highlight' });

const rustcBox = (tone = 'highlight') =>
  Box({
    key: 'rustc',
    x: COL_RUSTC.x,
    y: 136,
    w: COL_RUSTC.w,
    h: 104,
    label: 'rustc',
    sub: 'one crate',
    tone,
    thick: true,
  });

/* One crate box in the dependency column. */
const crate = (key, row, label, sub, tone = 'neutral') =>
  Box({ key, x: COL_CRATE.x, y: ROW[row], w: COL_CRATE.w, h: ROW_H, label, sub, tone, labelSize: 12 });

/* One artifact box in the output column. */
const artifact = (key, row, label, sub, tone = 'owned') =>
  Box({ key, x: COL_ART.x, y: ROW[row], w: COL_ART.w, h: ROW_H, label, sub, tone, labelSize: 12, mono: true });

const intoRustc = (key, row, tone = 'neutral') =>
  Arrow({
    key,
    from: [COL_CRATE.x + COL_CRATE.w, MID(row)],
    to: [COL_RUSTC.x - 4, 178 + (row - 1) * 14],
    shape: 'curve',
    bend: row === 1 ? 0 : row === 0 ? 16 : -16,
    tone,
  });

const outOfRustc = (key, row, tone = 'owned') =>
  Arrow({
    key,
    from: [COL_RUSTC.x + COL_RUSTC.w + 4, 178 + (row - 1) * 14],
    to: [COL_ART.x - 4, MID(row)],
    shape: 'curve',
    bend: row === 1 ? 0 : row === 0 ? 16 : -16,
    tone,
  });

/* Debug / release comparison panels, used by the last two steps. */
const PANEL_DBG = { x: 30, y: 72, w: 322, h: 250 };
const PANEL_REL = { x: 368, y: 72, w: 322, h: 250 };

export default {
  oneLiner:
    'What each tool in the Rust toolchain actually does, and why a debug build tells you nothing about speed.',

  whyJob:
    'Half of the "Rust is slow" claims you will read come from someone timing a debug build. An interviewer who hands you a benchmark is often checking whether you notice the missing `--release` before you say anything about the number.',

  mentalModel:
    'Think of `rustc` as a single machinist who can make exactly one part, and `cargo` as the foreman who reads the order sheet, works out which parts are needed and in what order, walks each one to the machinist, and *keeps the finished parts on a shelf* so the same part is never made twice. The compiler is the thing that knows Rust; cargo is the thing that knows your project.',

  scene: {
    id: 'cargo-pipeline',
    title: 'From source to binary, and who is driving',
    width: 720,
    height: 400,
    legend: [
      { tone: 'highlight', label: 'rustc — the actual compiler' },
      { tone: 'owned', label: 'freshly compiled' },
      { tone: 'moved', label: 'cached, not rebuilt' },
    ],
    steps: [
      {
        say: 'Start with what `rustc` alone does. You hand it one crate — one root source file and everything it pulls in with `mod` — and it hands back one artifact. It does not fetch anything, does not read `Cargo.toml`, and has no idea your project has dependencies.',
        mark: ['1', '3'],
        shapes: () => [
          crate('c.app', 1, 'main.rs', 'one crate'),
          rustcBox(),
          artifact('a.app', 1, 'app', 'executable'),
          intoRustc('in.1', 1),
          outOfRustc('out.1', 1),
          Text({
            key: 'note1',
            x: 360,
            y: 300,
            text: 'a crate is the unit of compilation. a module is not.',
            size: 11.5,
            mono: true,
            anchor: 'middle',
            opacity: 0.75,
          }),
        ],
      },
      {
        say: 'Now add a dependency. `Cargo.toml` states what you want — `serde_json = "1"` means any 1.x. Cargo resolves that into one exact version per crate, writes the answer into `Cargo.lock`, and from then on every machine that builds this project gets byte-identical inputs.',
        mark: [],
        focus: ['r.cargo', 'toml', 'lock', 'c.app', 'c.json', 'c.serde', 'a.resolve', 'a.feed'],
        shapes: () => [
          cargoRegion(),
          Box({
            key: 'toml',
            x: COL_MANIFEST.x,
            y: 96,
            w: COL_MANIFEST.w,
            h: 58,
            label: 'Cargo.toml',
            sub: 'serde_json = "1"',
            tone: 'neutral',
            labelSize: 12,
          }),
          Box({
            key: 'lock',
            x: COL_MANIFEST.x,
            y: 176,
            w: COL_MANIFEST.w,
            h: 58,
            label: 'Cargo.lock',
            sub: '1.0.140 exactly',
            tone: 'owned',
            labelSize: 12,
          }),
          Arrow({ key: 'a.resolve', from: [92, 158], to: [92, 172], shape: 'straight', bend: 0, tone: 'highlight' }),
          Arrow({
            key: 'a.feed',
            from: [COL_MANIFEST.x + COL_MANIFEST.w, 205],
            to: [COL_CRATE.x - 4, 190],
            shape: 'curve',
            bend: -18,
            tone: 'highlight',
          }),
          crate('c.app', 0, 'app', 'v0.1.0'),
          crate('c.json', 1, 'serde_json', 'v1.0.140'),
          crate('c.serde', 2, 'serde', 'v1.0.219'),
          Text({
            key: 'note2',
            x: 360,
            y: 320,
            text: 'Cargo.toml is what you asked for. Cargo.lock is what you got.',
            size: 11.5,
            mono: true,
            anchor: 'middle',
            opacity: 0.8,
          }),
        ],
      },
      {
        say: 'Cargo now walks the graph bottom-up. `serde` has no dependency on the others, so it compiles first; `serde_json` compiles against the finished `libserde.rlib`; your crate compiles last and gets linked into an executable. Three separate `rustc` invocations, three separate compilation units.',
        mark: [],
        shapes: () => [
          cargoRegion(),
          crate('c.app', 0, 'app', 'v0.1.0'),
          crate('c.json', 1, 'serde_json', 'v1.0.140'),
          crate('c.serde', 2, 'serde', 'v1.0.219'),
          rustcBox(),
          intoRustc('in.0', 0),
          intoRustc('in.1', 1),
          intoRustc('in.2', 2),
          artifact('a.app', 0, 'app', 'executable'),
          artifact('a.json', 1, 'libserde_json.rlib'),
          artifact('a.serde', 2, 'libserde.rlib'),
          outOfRustc('out.0', 0),
          outOfRustc('out.1', 1),
          outOfRustc('out.2', 2),
          Text({
            key: 'order',
            x: 360,
            y: 314,
            text: 'compiled in dependency order: serde, then serde_json, then app',
            size: 11.5,
            mono: true,
            anchor: 'middle',
            opacity: 0.8,
          }),
        ],
      },
      {
        say: 'Everything lands in `target/`, and cargo fingerprints each artifact against its inputs. Edit only your own code and the two dependency `.rlib` files are reused untouched — which is why the first build of a project takes minutes and the second takes a second and a half.',
        mark: [],
        focus: ['a.serde', 'a.json', 'a.app', 't.serde', 't.json', 't.app', 'out.0'],
        shapes: () => [
          cargoRegion(),
          crate('c.app', 0, 'app', 'v0.1.0', 'highlight'),
          crate('c.json', 1, 'serde_json', 'v1.0.140'),
          crate('c.serde', 2, 'serde', 'v1.0.219'),
          rustcBox(),
          intoRustc('in.0', 0, 'highlight'),
          artifact('a.app', 0, 'app', 'executable'),
          artifact('a.json', 1, 'libserde_json.rlib', undefined, 'moved'),
          artifact('a.serde', 2, 'libserde.rlib', undefined, 'moved'),
          outOfRustc('out.0', 0),
          Tag({ key: 't.app', x: 628, y: 100, text: 'rebuilt', tone: 'owned' }),
          Tag({ key: 't.json', x: 628, y: 168, text: 'cached', tone: 'moved' }),
          Tag({ key: 't.serde', x: 628, y: 236, text: 'cached', tone: 'moved' }),
          Text({
            key: 'cache',
            x: 360,
            y: 314,
            text: 'a change to a crate rebuilds it and everything above it, nothing below',
            size: 11.5,
            mono: true,
            anchor: 'middle',
            opacity: 0.8,
          }),
        ],
      },
      {
        say: 'Two commands run before any of that, and both are non-negotiable on a real team. `cargo fmt` ends every argument about layout by having no opinions left to argue about. `cargo clippy` is a second compiler pass with roughly 750 lints, many of which catch genuine bugs rather than style.',
        mark: [],
        shapes: () => [
          Box({
            key: 'fmt',
            x: 46,
            y: 124,
            w: 178,
            h: 84,
            label: 'cargo fmt',
            sub: 'one canonical layout',
            tone: 'neutral',
            labelSize: 14,
          }),
          Box({
            key: 'clippy',
            x: 268,
            y: 124,
            w: 184,
            h: 84,
            label: 'cargo clippy',
            sub: '~750 lints',
            tone: 'highlight',
            labelSize: 14,
          }),
          Box({
            key: 'build',
            x: 496,
            y: 124,
            w: 178,
            h: 84,
            label: 'cargo build',
            sub: 'only now',
            tone: 'owned',
            labelSize: 14,
          }),
          Arrow({ key: 'g1', from: [228, 166], to: [264, 166], shape: 'straight', bend: 0 }),
          Arrow({ key: 'g2', from: [456, 166], to: [492, 166], shape: 'straight', bend: 0 }),
          Text({
            key: 'ci',
            x: 360,
            y: 250,
            text: 'cargo clippy -- -D warnings',
            size: 13,
            mono: true,
            anchor: 'middle',
            tone: 'highlight',
            weight: 650,
          }),
          Text({
            key: 'ci2',
            x: 360,
            y: 280,
            text: 'turns every lint into a build failure. put this in CI on day one.',
            size: 11.5,
            anchor: 'middle',
            opacity: 0.8,
          }),
          Text({
            key: 'ci3',
            x: 360,
            y: 316,
            text: 'clippy catches needless clones, redundant allocations and integer casts that lose data',
            size: 11,
            anchor: 'middle',
            opacity: 0.7,
          }),
        ],
      },
      {
        say: 'Here is a plain `cargo build`. It is the default, it is what you get when you type `cargo run`, and it is the profile almost every casual benchmark is accidentally measuring.',
        mark: ['16-19'],
        predict: {
          ask: 'The fold above takes 1.9 seconds in this debug build. What does that tell you about the release build?',
          options: [
            { label: 'About the same — it is the same source code', correct: false },
            { label: 'Maybe 20–30% faster; optimisers give you percentages, not multiples', correct: false },
            {
              label: 'Nothing useful. Debug inlines nothing and keeps every check; release is routinely 10–100× faster',
              correct: true,
            },
          ],
          because:
            'At `opt-level = 0` every iterator method is a real function call, every arithmetic op carries an overflow check, and nothing is vectorised. The release build collapses the whole loop into a handful of instructions. The two numbers are not on the same scale.',
        },
        shapes: () => [
          Region({ key: 'p.dbg', ...PANEL_DBG, label: 'cargo build', tone: 'stack' }),
          Text({
            key: 'd.prof',
            x: 191,
            y: 110,
            text: 'opt-level = 0, debug = true',
            size: 11,
            mono: true,
            anchor: 'middle',
            opacity: 0.7,
          }),
          Box({
            key: 'd.bin',
            x: 62,
            y: 132,
            w: 258,
            h: 66,
            label: 'target/debug/app',
            sub: '4.2 MB',
            tone: 'stack',
            labelSize: 12,
            mono: true,
          }),
          Text({
            key: 'd.time',
            x: 191,
            y: 232,
            text: 'fold(10M): 1.9 s',
            size: 14,
            mono: true,
            anchor: 'middle',
            tone: 'freed',
            weight: 700,
          }),
          Text({
            key: 'd.why',
            x: 191,
            y: 264,
            text: 'nothing inlined, every check kept',
            size: 11,
            anchor: 'middle',
            opacity: 0.75,
          }),
          Text({
            key: 'd.why2',
            x: 191,
            y: 290,
            text: 'debug symbols make up most of the size',
            size: 11,
            anchor: 'middle',
            opacity: 0.75,
          }),
        ],
      },
      {
        say: 'Same source, same machine, one flag. The binary shrank by an order of magnitude because the debug symbols went, and the loop got roughly 160× faster because the optimiser could finally see through the iterator. A debug timing is not a slow measurement of your program — it is a measurement of a different program.',
        mark: ['16-19'],
        shapes: () => [
          Region({ key: 'p.dbg', ...PANEL_DBG, label: 'cargo build', tone: 'stack' }),
          Region({ key: 'p.rel', ...PANEL_REL, label: 'cargo build --release', tone: 'owned' }),
          Text({
            key: 'd.prof',
            x: 191,
            y: 110,
            text: 'opt-level = 0, debug = true',
            size: 11,
            mono: true,
            anchor: 'middle',
            opacity: 0.7,
          }),
          Box({
            key: 'd.bin',
            x: 62,
            y: 132,
            w: 258,
            h: 66,
            label: 'target/debug/app',
            sub: '4.2 MB',
            tone: 'stack',
            labelSize: 12,
            mono: true,
          }),
          Text({
            key: 'd.time',
            x: 191,
            y: 232,
            text: 'fold(10M): 1.9 s',
            size: 14,
            mono: true,
            anchor: 'middle',
            tone: 'freed',
            weight: 700,
          }),
          Text({
            key: 'r.prof',
            x: 529,
            y: 110,
            text: 'opt-level = 3, debug = false',
            size: 11,
            mono: true,
            anchor: 'middle',
            opacity: 0.7,
          }),
          Box({
            key: 'r.bin',
            x: 400,
            y: 132,
            w: 258,
            h: 66,
            label: 'target/release/app',
            sub: '430 KB',
            tone: 'owned',
            labelSize: 12,
            mono: true,
          }),
          Text({
            key: 'r.time',
            x: 529,
            y: 232,
            text: 'fold(10M): 12 ms',
            size: 14,
            mono: true,
            anchor: 'middle',
            tone: 'owned',
            weight: 700,
          }),
          Tag({ key: 'ratio', x: 470, y: 258, text: 'about 160x faster', tone: 'highlight' }),
          Text({
            key: 'r.why',
            x: 529,
            y: 300,
            text: 'the iterator inlined away; the loop is now a few instructions',
            size: 11,
            anchor: 'middle',
            opacity: 0.8,
          }),
          Text({
            key: 'warn',
            x: 360,
            y: 344,
            text: 'never publish, compare or reason about a number produced by a debug build',
            size: 12,
            anchor: 'middle',
            tone: 'freed',
            weight: 650,
          }),
        ],
      },
    ],
  },

  code: {
    lang: 'rust',
    filename: 'src/main.rs',
    source: `// src/main.rs — the crate root of a binary crate.
use std::time::Instant;

mod checksum {              // a module: a namespace inside this crate
    pub fn fold(data: &[u64]) -> u64 {
        let mut acc = 0u64;
        for &x in data {
            acc = acc.wrapping_mul(31).wrapping_add(x);
        }
        acc
    }
}

fn main() {
    let data: Vec<u64> = (0..10_000_000).collect();

    let t = Instant::now();
    let h = checksum::fold(&data);
    let dt = t.elapsed();

    println!("{h} in {dt:?}");
}`,
    annotations: [
      {
        lines: '1',
        text: 'This one file is the *crate root*. `rustc` is handed this path and nothing else — everything the crate contains is reachable from here.',
      },
      {
        lines: '4',
        text: 'A module is a namespace **inside** a crate, not a separate compilation unit. Splitting into modules does not give you parallel compilation; splitting into crates does.',
      },
      {
        lines: '7-9',
        text: 'In debug this loop is real function calls into `Iterator::next` with an overflow check on every operation. In release it becomes a handful of instructions.',
      },
      {
        lines: '16-19',
        text: 'Time both profiles. The gap between them is the whole reason `--release` exists, and the reason a debug timing is not evidence of anything.',
      },
    ],
  },

  deeper: [
    'The pieces do genuinely different jobs and it is worth keeping them separate in your head. `rustup` installs and switches toolchains — stable, beta, nightly, and cross-compilation targets — and everything you type as `cargo` or `rustc` is actually a rustup shim that looks at the directory you are in, checks for a `rust-toolchain.toml`, and forwards to the right version. `rustc` compiles exactly one crate per invocation. `cargo` reads the manifest, resolves versions, downloads sources, decides the compilation order, invokes `rustc` once per crate, and manages the cache in `target/`.',
    'The crate is the unit of compilation, and that has a direct effect on your build times. `rustc` optimises across a whole crate by default, so a single enormous crate compiles slowly and serially, while several smaller crates compile in parallel and cache independently. This is why large Rust projects are split into workspaces of many small crates — it is a build-time decision as much as an organisational one. Modules (`mod`) cost nothing at build time; they are purely namespacing within one crate.',
    'The debug profile is `opt-level = 0` with `debug-assertions = true` and `overflow-checks = true`. Nothing is inlined, so every `Iterator::next`, every `Deref`, every small helper is an actual call with an actual stack frame; every integer operation carries a check. The release profile is `opt-level = 3`, no debug assertions, and no overflow checks. The generic and iterator-heavy code that Rust encourages you to write depends entirely on inlining to become fast, which is why the debug/release gap in Rust is dramatically larger than in C — 10× is normal, 100× is common, and 500× happens in iterator-heavy numeric code.',
    'Release is not the last stop. `lto = "thin"` in `[profile.release]` lets the optimiser work across crate boundaries, which matters because otherwise a call into a dependency cannot be inlined. `codegen-units = 1` gives up parallel codegen for a few more percent. `panic = "abort"` removes the unwinding tables and shrinks the binary. And `-C target-cpu=native` lets the compiler use AVX-512 or whatever your machine actually has instead of the conservative baseline. Each of these is a line in `Cargo.toml`, and none of them is on by default.',
    'On the cache: cargo fingerprints each unit by its source, its dependencies, the compiler version, the profile and the enabled features. Change any of those and the unit is recompiled together with everything that depends on it. This is why `cargo build` after `cargo build --release` does not reuse anything — different profile, different fingerprint, different directory. It is also why bumping your toolchain rebuilds the world.',
  ],

  gotchas: [
    'Benchmarking a debug build. This is the single most common mistake, and it produces numbers that are wrong by one or two orders of magnitude. `cargo run` is a debug build. `cargo test` is a debug build. If a number is going to leave your machine, it came from `--release`.',
    'Assuming `cargo build` and `cargo build --release` share a cache. They do not — different profiles are fingerprinted separately and written to `target/debug` and `target/release`. Switching back and forth on a large project recompiles everything each time.',
    '`Cargo.lock` belongs in version control for binaries and, since Rust 1.84 changed the guidance, is harmless to commit for libraries too. Leaving it out of a binary project means two developers can silently be building against different dependency versions.',
    'Deleting `target/` to "fix" a build is almost always the wrong move and costs you minutes. `cargo clean -p <crate>` clears one unit; a full clean is for when the toolchain itself changed.',
    'Debug builds keep overflow checks, so an arithmetic bug panics in development and silently wraps in production. That is deliberate, but it means your release binary can take a code path your tests never did.',
  ],

  interview: {
    q: 'A colleague reports that a Rust rewrite of a hot loop is slower than the C++ original. What do you check first, and how do you get a number you would actually defend?',
    a: [
      'First question: which profile. `cargo run` and `cargo test` are debug builds at `opt-level = 0`, and idiomatic Rust leans hard on inlining — iterator adapters, `Deref`, small generic helpers are all real calls until the optimiser removes them. A debug build of iterator-heavy code is routinely 50–200× slower than the release build, so if the comparison was against an optimised C++ binary the measurement is meaningless before you look at anything else.',
      'Second, the flags on both sides. C++ compiled with `-O2` against Rust release is a fair start, but Rust does not enable cross-crate LTO by default while a single-translation-unit C++ build effectively has it. Adding `lto = "thin"` and `codegen-units = 1` to `[profile.release]` closes a real gap. `-C target-cpu=native` matters if the C++ side was built with `-march=native`. And confirm `panic = "unwind"` versus `abort` is not skewing code size in a way that changes inlining decisions.',
      'Then get a number you can defend: use `criterion`, which runs the loop many times, discards warm-up, reports a confidence interval, and uses `black_box` so the optimiser cannot delete the work you are trying to time. The trap specific to Rust benchmarking is that a release build will happily const-fold your entire benchmark into nothing if the input is known at compile time, and you get a suspiciously round number near zero. If the answer comes back as one nanosecond, you measured the compiler, not the code.',
    ],
  },

  exercise: [
    'Create a project with `cargo new fold && cd fold`, paste the program above into `src/main.rs`, and run it twice: `cargo run` and then `cargo run --release`. Write both times down. Then run `ls -l target/debug/fold target/release/fold` and write down both sizes. You now have two numbers and a ratio that you will remember for the rest of your career, and they are yours rather than something you read.',
    'Now add `[profile.release]` with `lto = "thin"` and `codegen-units = 1` to `Cargo.toml`, rebuild, and time it again. Note both the build time and the run time — you are paying one to buy the other, and knowing roughly what that exchange rate is on your own machine is genuinely useful.',
    'Finally run `cargo clippy -- -D warnings` on the same project and then deliberately break something clippy dislikes: write `let v: Vec<u64> = data.iter().map(|x| *x).collect();` and watch it tell you to use `.copied()`. Read the lint name it gives you and look it up. Getting used to clippy as a teacher rather than a nag is the fastest way to learn idiomatic Rust.',
  ],
};
