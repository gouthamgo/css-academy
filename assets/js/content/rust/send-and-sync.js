import { Region, Box, Cell, Frame, Arrow, Bracket, Text, Tag } from '../../viz/primitives.js';

/* Shared geometry. Two thread lanes with a hard boundary between them,
   and one heap allocation underneath that both lanes can reach — because
   that is exactly the asymmetry the two traits are about. */
const LANE_A = { x: 30, y: 60, w: 310, h: 212 };
const LANE_B = { x: 380, y: 60, w: 310, h: 212 };
const HEAP = { x: 150, y: 298, w: 420, h: 112 };

const ROW1 = 96; // y of the upper box in each lane
const ROW2 = 192; // y of the lower box in each lane
const BOX_W = 210;
const A_X = 54;
const B_X = 446;

const lanes = () => [
  Region({ key: 'r.a', ...LANE_A, label: 'THREAD A', tone: 'stack' }),
  Region({ key: 'r.b', ...LANE_B, label: 'THREAD B', tone: 'stack' }),
  Box({ key: 'wall', x: 352, y: 52, w: 12, h: 228, tone: 'freed', dashed: true }),
  Text({
    key: 'wall.lbl',
    x: 358,
    y: 36,
    text: 'thread boundary',
    size: 10,
    mono: true,
    anchor: 'middle',
    tone: 'freed',
    weight: 700,
  }),
];

const heap = (label, countValue, countSub, countTone = 'heap') => [
  Region({ key: 'r.heap', ...HEAP, label: 'HEAP — reachable from both threads', tone: 'heap' }),
  Box({
    key: 'inner',
    x: 176,
    y: 326,
    w: 180,
    h: 62,
    label,
    sub: 'the actual data',
    tone: 'heap',
  }),
  Cell({
    key: 'count',
    x: 392,
    y: 334,
    w: 130,
    h: 46,
    value: countValue,
    name: 'strong count',
    sub: countSub,
    tone: countTone,
  }),
];

export default {
  oneLiner:
    'The two empty traits that decide, at compile time, which of your types are allowed near a thread.',

  whyJob:
    'This is the single most-asked senior Rust question, and the interviewer is not testing vocabulary — they want to hear you explain why `Rc` is rejected and `Arc` is not, in terms of one instruction being atomic and the other not.',

  mentalModel:
    'Think of a secure building with a door between two rooms. `Send` answers "may this object be *carried through* the door?" — you hand it over and it is no longer yours. `Sync` answers "may people in both rooms *look at it at once* through a window?" — which is the same question as "may a `&T` be carried through the door", and that is literally how `Sync` is defined: `T: Sync` if and only if `&T: Send`. The guard at the door is the compiler, and it checks before the program runs, not while it is running.',

  scene: {
    id: 'send-sync-boundary',
    title: 'What may cross a thread boundary',
    width: 720,
    height: 430,
    legend: [
      { tone: 'owned', label: 'crosses safely' },
      { tone: 'heap', label: 'shared allocation' },
      { tone: 'freed', label: 'refused at the boundary' },
    ],
    steps: [
      {
        say: 'Two separate questions, and people collapse them into one. `Send` is about handing the whole value over. `Sync` is about two threads touching the same value at the same time — and it is not a second idea, it is `Send` applied to `&T`.',
        mark: ['30-31'],
        shapes: () => [
          ...lanes(),
          Box({
            key: 'send.src',
            x: A_X,
            y: ROW1,
            w: BOX_W,
            h: 54,
            label: 'T',
            sub: 'A gives it up entirely',
            tone: 'owned',
          }),
          Box({
            key: 'send.dst',
            x: B_X,
            y: ROW1,
            w: BOX_W,
            h: 54,
            label: 'T',
            sub: 'B owns it now',
            tone: 'owned',
            dashed: true,
          }),
          Arrow({
            key: 'a.send',
            from: [268, ROW1 + 27],
            to: [442, ROW1 + 27],
            shape: 'straight',
            bend: 0,
            tone: 'owned',
            label: 'Send: move it',
          }),
          Box({
            key: 'sync.src',
            x: A_X,
            y: ROW2,
            w: BOX_W,
            h: 54,
            label: 'T',
            sub: 'stays where it is',
            tone: 'heap',
          }),
          Box({
            key: 'sync.dst',
            x: B_X,
            y: ROW2,
            w: BOX_W,
            h: 54,
            label: '&T',
            sub: 'B reads through it',
            tone: 'borrowed',
            dashed: true,
          }),
          Arrow({
            key: 'a.sync',
            from: [268, ROW2 + 27],
            to: [442, ROW2 + 27],
            shape: 'straight',
            bend: 0,
            tone: 'borrowed',
            dashed: true,
            label: 'Sync: share &T',
          }),
        ],
      },
      {
        say: 'You almost never write either trait. They are *auto traits*: the compiler derives them field by field, and one bad field poisons the whole struct. That is why the error usually names a type you did not think you were using.',
        mark: ['5', '29-31'],
        focus: ['st', 'br', 'e1', 'e2', 'e3'],
        shapes: () => [
          ...lanes(),
          Frame({
            key: 'st',
            x: 52,
            y: 88,
            w: 236,
            label: 'struct Feed',
            tone: 'stack',
            vars: [
              { name: 'seq: u64', value: 'Send+Sync', tone: 'owned' },
              { name: 'sym: String', value: 'Send+Sync', tone: 'owned' },
              { name: 'log: Rc<Book>', value: 'neither', tone: 'freed' },
            ],
          }),
          Bracket({
            key: 'br',
            x: 52,
            y: 218,
            w: 236,
            label: 'Send only if every field is',
            tone: 'freed',
          }),
          Text({
            key: 'e1',
            x: 396,
            y: 108,
            text: 'error[E0277]: `Rc<Book>` cannot be',
            size: 11,
            mono: true,
            tone: 'freed',
            weight: 650,
          }),
          Text({
            key: 'e2',
            x: 396,
            y: 126,
            text: 'sent between threads safely',
            size: 11,
            mono: true,
            tone: 'freed',
            weight: 650,
          }),
          Text({
            key: 'e3',
            x: 396,
            y: 152,
            text: 'note: required because it appears',
            size: 11,
            mono: true,
            tone: 'neutral',
            opacity: 0.75,
          }),
        ],
      },
      {
        say: 'Now the concrete case. `Arc` is a handle; the data and a reference count sit in one heap allocation. Cloning the handle does not copy the data — it adds one to that count.',
        mark: ['8', '12'],
        shapes: () => [
          ...lanes(),
          Box({
            key: 'arc.a',
            x: A_X,
            y: ROW1,
            w: BOX_W,
            h: 54,
            label: 'Arc<Book>',
            sub: 'handle held by A',
            tone: 'owned',
          }),
          Box({
            key: 'arc.b',
            x: B_X,
            y: ROW1,
            w: BOX_W,
            h: 54,
            label: 'Arc<Book>',
            sub: 'clone sent to B',
            tone: 'owned',
          }),
          Arrow({
            key: 'a.cross',
            from: [268, ROW1 + 27],
            to: [442, ROW1 + 27],
            shape: 'straight',
            bend: 0,
            tone: 'owned',
            label: 'Send',
          }),
          ...heap('Book', '2', 'AtomicUsize'),
          Arrow({ key: 'p.a', from: [159, 152], to: [250, 322], tone: 'heap', bend: 34 }),
          Arrow({ key: 'p.b', from: [551, 152], to: [430, 322], tone: 'heap', bend: -34 }),
        ],
      },
      {
        say: 'Both threads clone at the same instant. `fetch_add` compiles to a single `lock xadd` — the core takes the cache line in exclusive state and no other core can observe a half-finished update. The count is 3 because it cannot be anything else.',
        mark: ['12'],
        focus: ['count', 'fa.a', 'fa.b', 'inner', 'r.heap'],
        shapes: () => [
          ...lanes(),
          Box({
            key: 'arc.a',
            x: A_X,
            y: ROW1,
            w: BOX_W,
            h: 54,
            label: 'Arc<Book>',
            sub: 'Arc::clone',
            tone: 'owned',
          }),
          Box({
            key: 'arc.b',
            x: B_X,
            y: ROW1,
            w: BOX_W,
            h: 54,
            label: 'Arc<Book>',
            sub: 'Arc::clone',
            tone: 'owned',
          }),
          ...heap('Book', '3', 'lock xadd — indivisible', 'owned'),
          Arrow({
            key: 'fa.a',
            from: [200, 152],
            to: [416, 328],
            tone: 'highlight',
            bend: 70,
            label: 'fetch_add(1)',
          }),
          Arrow({
            key: 'fa.b',
            from: [520, 152],
            to: [492, 328],
            tone: 'highlight',
            bend: -46,
            label: 'fetch_add(1)',
          }),
        ],
      },
      {
        say: 'Swap in `Rc`. Identical shape, identical API — except the count is a plain `usize` and `clone` is `n = n + 1`, which is three instructions: load, add, store. Both threads have just executed the load.',
        mark: ['24-25'],
        focus: ['count.rc', 'rd.a', 'rd.b', 'note', 'rcbox'],
        predict: {
          ask: 'Both threads read 1, both add one, both store. What does the count hold afterwards?',
          options: [
            { label: '3 — the hardware serialises the two writes', correct: false },
            { label: '2 — one of the two increments is silently lost', correct: true },
            { label: 'Undefined; the counter could hold any value at all', correct: false },
          ],
          because:
            'Each thread loaded 1, computed 2 in its own register, and stored 2. Both stores are well-formed, so the memory ends up holding 2 — the loss is not corruption, it is arithmetic on a stale read. Two handles exist but the allocation believes there is one.',
        },
        shapes: () => [
          ...lanes(),
          Box({
            key: 'rc.a',
            x: A_X,
            y: ROW1,
            w: BOX_W,
            h: 54,
            label: 'Rc<Book>',
            sub: 'Rc::clone in A',
            tone: 'borrowed',
          }),
          Box({
            key: 'rc.b',
            x: B_X,
            y: ROW1,
            w: BOX_W,
            h: 54,
            label: 'Rc<Book>',
            sub: 'Rc::clone in B',
            tone: 'borrowed',
          }),
          Region({ key: 'r.heap', ...HEAP, label: 'HEAP — reachable from both threads', tone: 'heap' }),
          Box({
            key: 'rcbox',
            x: 176,
            y: 326,
            w: 180,
            h: 62,
            label: 'RcBox<Book>',
            sub: 'the actual data',
            tone: 'heap',
          }),
          Cell({
            key: 'count.rc',
            x: 392,
            y: 334,
            w: 130,
            h: 46,
            value: '1',
            name: 'strong count',
            sub: 'plain usize',
            tone: 'heap',
          }),
          Arrow({
            key: 'rd.a',
            from: [420, 330],
            to: [180, 152],
            tone: 'moved',
            dashed: true,
            bend: 40,
            label: 'reads 1',
          }),
          Arrow({
            key: 'rd.b',
            from: [478, 330],
            to: [545, 152],
            tone: 'moved',
            dashed: true,
            bend: 40,
            label: 'reads 1',
          }),
          Text({
            key: 'note',
            x: 360,
            y: 290,
            text: 'both threads are inside `clone` at the same instant',
            size: 11,
            mono: true,
            anchor: 'middle',
            tone: 'neutral',
            opacity: 0.8,
          }),
        ],
      },
      {
        say: 'Two handles, count 2 — and later, two drops. The second drop takes it to zero, frees the `Book`, and the third handle is still out there holding a pointer into freed memory. A missed increment does not crash where it happens; it crashes minutes later somewhere unrelated.',
        mark: ['24-25'],
        focus: ['count.rc', 'wr.a', 'wr.b', 'lost', 'note'],
        shapes: () => [
          ...lanes(),
          Box({
            key: 'rc.a',
            x: A_X,
            y: ROW1,
            w: BOX_W,
            h: 54,
            label: 'Rc<Book>',
            sub: 'alive',
            tone: 'borrowed',
          }),
          Box({
            key: 'rc.b',
            x: B_X,
            y: ROW1,
            w: BOX_W,
            h: 54,
            label: 'Rc<Book>',
            sub: 'alive',
            tone: 'borrowed',
          }),
          Region({ key: 'r.heap', ...HEAP, label: 'HEAP — reachable from both threads', tone: 'heap' }),
          Box({
            key: 'rcbox',
            x: 176,
            y: 326,
            w: 180,
            h: 62,
            label: 'RcBox<Book>',
            sub: 'freed too early',
            tone: 'freed',
          }),
          Cell({
            key: 'count.rc',
            x: 392,
            y: 334,
            w: 130,
            h: 46,
            value: '2',
            name: 'strong count',
            sub: 'should have been 3',
            tone: 'freed',
          }),
          Arrow({
            key: 'wr.a',
            from: [180, 152],
            to: [420, 330],
            tone: 'freed',
            bend: -40,
            label: 'writes 2',
          }),
          Arrow({
            key: 'wr.b',
            from: [545, 152],
            to: [478, 330],
            tone: 'freed',
            bend: -40,
            label: 'writes 2',
          }),
          Tag({ key: 'lost', x: 392, y: 400, text: 'one increment lost', tone: 'freed' }),
          Text({
            key: 'note',
            x: 360,
            y: 290,
            text: 'later: two drops -> count 0 -> free, with a live handle remaining',
            size: 11,
            mono: true,
            anchor: 'middle',
            tone: 'freed',
            weight: 650,
          }),
        ],
      },
      {
        say: 'None of that can happen, because `Rc` is not `Send` and `thread::spawn` demands `Send`. The rejection is a type error at the boundary — no runtime check, no cost, and no chance to get it wrong at 3am under load.',
        mark: ['26', '34-36'],
        focus: ['rc.a', 'a.reject', 'no', 'e1', 'e2'],
        shapes: () => [
          ...lanes(),
          Box({
            key: 'rc.a',
            x: A_X,
            y: ROW1,
            w: BOX_W,
            h: 54,
            label: 'Rc<Book>',
            sub: 'single-thread only',
            tone: 'borrowed',
          }),
          Box({
            key: 'rc.b',
            x: B_X,
            y: ROW1,
            w: BOX_W,
            h: 54,
            label: 'never exists',
            tone: 'freed',
            dashed: true,
          }),
          Arrow({
            key: 'a.reject',
            from: [268, ROW1 + 27],
            to: [442, ROW1 + 27],
            shape: 'straight',
            bend: 0,
            tone: 'freed',
            dashed: true,
          }),
          Tag({ key: 'no', x: 316, y: 160, text: 'refused', tone: 'freed' }),
          Region({ key: 'r.heap', ...HEAP, label: 'HEAP — reachable from both threads', tone: 'heap' }),
          Box({
            key: 'rcbox',
            x: 176,
            y: 326,
            w: 180,
            h: 62,
            label: 'RcBox<Book>',
            sub: 'never at risk',
            tone: 'heap',
          }),
          Cell({
            key: 'count.rc',
            x: 392,
            y: 334,
            w: 130,
            h: 46,
            value: '1',
            name: 'strong count',
            sub: 'still exact',
            tone: 'owned',
          }),
          Text({
            key: 'e1',
            x: 360,
            y: 240,
            text: 'error[E0277]: `Rc<Book>` cannot be sent between threads safely',
            size: 11,
            mono: true,
            anchor: 'middle',
            tone: 'freed',
            weight: 650,
          }),
          Text({
            key: 'e2',
            x: 360,
            y: 260,
            text: 'required by a bound in `std::thread::spawn`',
            size: 11,
            mono: true,
            anchor: 'middle',
            tone: 'neutral',
            opacity: 0.75,
          }),
        ],
      },
    ],
  },

  code: {
    lang: 'rust',
    filename: 'main.rs',
    source: `use std::rc::Rc;
use std::sync::Arc;
use std::thread;

struct Book { rows: Vec<u64> }

fn main() {
    let shared = Arc::new(Book { rows: vec![1, 2, 3] });

    let handles: Vec<_> = (0..4)
        .map(|_| {
            let mine = Arc::clone(&shared);   // atomic increment: lock xadd
            thread::spawn(move || {
                // \`mine\` moved in   -> Arc<Book> must be Send
                // \`&Book\` read here -> Book must be Sync
                mine.rows.iter().sum::<u64>()
            })
        })
        .collect();

    let total: u64 = handles.into_iter().map(|h| h.join().unwrap()).sum();
    println!("{total}");

    // let local = Rc::new(Book { rows: vec![1] });
    // thread::spawn(move || local.rows.len());
    // error[E0277]: \`Rc<Book>\` cannot be sent between threads safely
}

// Both traits are empty. There is nothing to implement.
//     unsafe auto trait Send {}   // safe to MOVE to another thread
//     unsafe auto trait Sync {}   // &T: Send  =>  safe to SHARE by reference
//
// You promise by hand only when you know what the compiler cannot see:
struct Ring { head: *mut u8 }
unsafe impl Send for Ring {}      // "this raw pointer is exclusively ours"
unsafe impl Sync for Ring {}      // "concurrent &Ring access is race-free"`,
    annotations: [
      {
        lines: '12',
        text: 'One `lock xadd`. It costs roughly 20 cycles uncontended and far more when several cores fight over the line — which is why you clone an `Arc` outside the hot loop, not inside it.',
      },
      {
        lines: '13-16',
        text: 'Two separate requirements hide in these four lines. Moving the handle in needs `Arc<Book>: Send`; reading through it from four threads at once needs `Book: Sync`.',
      },
      {
        lines: '24-26',
        text: 'Uncomment and the build fails. The interesting part is *where*: at `spawn`, not at the increment, so the unsafe program never reaches a machine.',
      },
      {
        lines: '34-36',
        text: 'A raw pointer is deliberately neither `Send` nor `Sync`, so any struct holding one loses both. These two lines are you signing for it — and `unsafe impl` means the compiler stops checking, not that it verified you.',
      },
    ],
  },

  deeper: [
    '`Send` and `Sync` have no methods and no bodies. They are *auto traits*: the compiler implements them for your type automatically if every field implements them, and the derivation runs all the way down through generics. The consequence people miss is that these traits are structural, not nominal — you did not opt in, and you cannot opt out by forgetting to write something. If you want to opt out you add a `PhantomData<*const ()>` field, which is what most single-thread-only wrappers do.',
    'The definition of `Sync` really is that short: `T` is `Sync` if and only if `&T` is `Send`. Everything else follows. `&T` shared across threads means several threads can call `&self` methods concurrently, so `Sync` is exactly the promise "concurrent `&self` use is race-free". That is why `Mutex<T>` is `Sync` for any `T: Send` — its `&self` API hands out access one thread at a time — and why `Cell<T>` and `RefCell<T>` are `Send` but not `Sync`: moving one to another thread is fine, but two threads mutating through `&self` with no synchronisation is a data race.',
    'The `Rc` versus `Arc` split is a real performance decision, not a safety tax. `Rc::clone` is `self.count += 1` — a load, an add and a store on a line your core already owns, typically a couple of cycles. `Arc::clone` is `lock xadd`, which takes exclusive ownership of the cache line and cannot be reordered around by the store buffer; uncontended it is around 20 cycles, and under contention from several cores it collapses to the cost of cache-line ping-pong, which is hundreds. Rust makes you pay that price only where it is needed, and refuses to let you skip it where it is.',
    'The traits are `unsafe` for a reason: implementing one is a *promise*, and the compiler cannot check it. `unsafe impl Send for T` is you asserting that no thread can observe a torn or aliased state through `T` after it moves. This is how the standard library itself is built — `Arc`, `Mutex` and `mpsc::Sender` all reach for raw pointers internally and then hand-write the impls, because the auto-derivation would (correctly) refuse. The wrong reason to write one is "the compiler was complaining"; the right one is "here is the invariant, here is why concurrent access cannot break it", written in a comment above the impl.',
    'None of this exists at runtime. There is no marker byte in the layout, no vtable entry, no check. `Send` and `Sync` are erased entirely once type-checking is done, so the generated code for an `Arc<Mutex<T>>` pipeline is byte-for-byte what a careful C++ engineer would write with `std::shared_ptr` and `std::mutex`. The difference is that the C++ version also compiles if you use `boost::intrusive_ptr` with a non-atomic count across threads, and yours does not.',
  ],

  gotchas: [
    '`MutexGuard<T>` is `Sync` but deliberately **not** `Send`, because some platforms require the same thread that locked a mutex to unlock it. That is the real reason holding a guard across an `.await` in Tokio fails to compile — the future stops being `Send`, and the error names the guard rather than the await point.',
    '`Cell` and `RefCell` are `Send` but not `Sync`. People read "not thread safe" and assume neither, then get confused when moving one into a thread works fine. Moving is fine; *sharing* is the problem, and `RefCell` would only detect the double-borrow on the thread that happens to lose the race.',
    'Raw pointers are neither, so any struct containing one silently loses both, and the error surfaces far from the field — usually at a `spawn` several modules away. The fix is a `PhantomData` marker plus a hand-written impl with a comment, not deleting the pointer.',
    '`Arc<T>` is only `Send` when `T: Send + Sync`, and both halves are needed. `Send` because the last `Arc` to drop destroys the `T` on whatever thread that happens to be; `Sync` because every clone can read it concurrently. `Arc<RefCell<i32>>` compiles right up until you try to spawn with it.',
    '`Sync` says nothing about whether concurrent use is *correct*, only that it is not a data race. An `AtomicUsize` counter is `Sync`, and a pair of threads doing `load` then `store` on it will still lose updates. `Sync` rules out undefined behaviour, not logic bugs.',
  ],

  interview: {
    q: 'Explain `Send` and `Sync`, and then tell me precisely why `Rc<T>` implements neither while `Arc<T>` implements both.',
    a: [
      '`Send` means a value can be moved to another thread; `Sync` means it can be shared by reference, and `Sync` is defined as `&T: Send`, so it is really one idea applied twice. Both are auto traits — the compiler derives them structurally from a type\'s fields, so a single non-`Send` field makes the whole struct non-`Send`. Neither has any runtime representation; they are erased after type-checking.',
      '`Rc` and `Arc` are the same data structure with one difference: the reference count. `Rc::clone` does a plain `count += 1`, which is a load, an increment in a register, and a store. If two threads clone concurrently, both can load the same value, both compute the same result, and both store it — one increment vanishes. The count is then lower than the number of live handles, so the drops reach zero early, the allocation is freed while a handle is still pointing at it, and you get a use-after-free followed by a double free. `Arc::clone` uses `fetch_add`, which lowers to a single `lock xadd`; the read-modify-write is indivisible at the cache-coherence level, so the count cannot be lost.',
      'The part worth adding, because it shows you understand the design rather than the rule: this is a deliberate performance split, not redundancy. Non-atomic increments cost a couple of cycles; the atomic version costs around twenty uncontended and much more when cores contend for the line. Rust gives you the cheap one by default and uses the type system to make sure you cannot accidentally take it across a boundary where it is unsound. And `Rc` is not `Sync` for the same reason it is not `Send` — sharing `&Rc<T>` lets the other thread clone from it, which is the identical unsynchronised increment.',
    ],
  },

  exercise: [
    'Write a five-line program that puts an `Rc<Vec<u64>>` into a `thread::spawn` closure and read the full error on the [Rust Playground](https://play.rust-lang.org). Note carefully that the error points at `spawn`, not at the clone, and that it names the closure type — that indirection is what makes these errors feel mysterious until you have seen one.',
    'Then reproduce the bug the trait exists to prevent. Take the same program, replace `Rc` with a hand-rolled `struct MyRc { count: *mut usize, .. }`, write `unsafe impl Send for MyRc {}` to silence the compiler, and increment the count non-atomically from eight threads in a loop. Run it under `cargo +nightly miri run`, or build with `-Z sanitizer=thread` and run under ThreadSanitizer. You should get a race report naming the exact two instructions. Seeing the tool point at your own load and store is worth more than a paragraph about it.',
    'Finally, run the atomic version and measure the difference: clone an `Arc` ten million times in one thread, then have eight threads clone the same `Arc` in parallel, and time both with `criterion`. The parallel version will be dramatically *slower* per operation. Being able to explain that number — cache-line ping-pong, not lock contention — is a strong answer to the follow-up question.',
  ],
};
