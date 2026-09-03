import { Region, Frame, Box, Arrow, Text, Tag } from '../../viz/primitives.js';

/* Shared geometry. STACK holds the handles (thin, stack-sized). HEAP holds
   whatever those handles point at -- a bare value for Box, a control block
   plus data for Rc/Arc, a flag plus data for RefCell. */
const STACK = { x: 40, y: 56, w: 300, h: 340 };
const HEAP = { x: 396, y: 56, w: 284, h: 340 };

const regions = () => [
  Region({ key: 'r.stack', ...STACK, label: 'STACK', tone: 'stack' }),
  Region({ key: 'r.heap', ...HEAP, label: 'HEAP', tone: 'heap' }),
];

const ownerFrame = (key, y, label, tone = 'owned') =>
  Frame({
    key,
    x: 64,
    y,
    w: 190,
    label,
    tone,
    vars: [{ name: 'ptr', value: '0x7f01', tone: 'heap' }],
  });

const ptrArrow = (key, y, to = [430, 148], tone = 'heap') =>
  Arrow({
    key,
    from: [64 + 190, y + 27],
    to,
    shape: 'curve',
    bend: y < 200 ? 30 : -30,
    tone,
  });

export default {
  oneLiner:
    'The four ways to hand ownership rules a value the type system alone cannot manage — a heap box, a shared count, an atomic count, and a runtime borrow check.',

  whyJob:
    'A real codebase is not a tree of single owners; it has caches, graphs and shared config that outlive any one function. An interviewer wants to know you reach for the cheapest of these four that solves the actual problem, not `Arc<Mutex<T>>` by reflex.',

  mentalModel:
    'A `Box` is a locker with exactly one key — simple, and someone owns it. An `Rc` is a locker with several keys and a sign-in sheet at the door that anyone can *read and write with a pencil*: fast, but only safe because only one person is ever in the room. An `Arc` is the same locker with a sign-in sheet bolted down and signed with a tamper-proof stamp each time — slower to sign, but safe when several rooms share the door. A `RefCell` is a locker where the "one key at a time" rule is enforced by a guard checking a logbook *as you walk in*, instead of a rule the building\'s architect (the compiler) enforced before it was built.',

  scene: {
    id: 'smart-pointers-costs',
    title: 'Four ways to own a heap value',
    width: 720,
    height: 420,
    legend: [
      { tone: 'owned', label: 'live handle' },
      { tone: 'heap', label: 'heap allocation' },
      { tone: 'highlight', label: 'atomic operation' },
      { tone: 'freed', label: 'runtime check failed' },
    ],
    steps: [
      {
        say: '`Box::new` does exactly one thing: allocate room on the heap and hand you the pointer. One stack word, one allocation, no counting, no locking. This is the whole cost model — everything past this step is extra machinery for a problem `Box` cannot solve, which is more than one owner.',
        mark: ['7-8'],
        shapes: () => [
          ...regions(),
          ownerFrame('h', 140, 'b: Box<i32>', 'owned'),
          Box({ key: 'val', x: 460, y: 152, w: 160, h: 64, label: '42', sub: 'i32, alone on the heap', tone: 'heap' }),
          ptrArrow('h.a', 140, [460, 184]),
        ],
      },
      {
        say: '`Rc::new` allocates the value *and* a pair of counters together, in one block. The counters are separate fields, not a separate allocation — drawn apart here only so you can see both halves of what one `Rc::clone` touches.',
        mark: ['11'],
        shapes: () => [
          ...regions(),
          ownerFrame('a', 96, 'a: Rc<String>', 'owned'),
          Region({ key: 'rcbox', x: 418, y: 92, w: 248, h: 232, label: 'RcBox<T> — one allocation', tone: 'heap' }),
          Frame({
            key: 'ctrl',
            x: 434,
            y: 116,
            w: 216,
            label: 'control block',
            tone: 'heap',
            vars: [
              { name: 'strong', value: '1', tone: 'owned' },
              { name: 'weak', value: '0', tone: 'neutral' },
            ],
          }),
          Box({ key: 'data', x: 434, y: 236, w: 216, h: 70, label: 'String', sub: '"hello"', tone: 'heap' }),
          ptrArrow('a.p', 96, [434, 150]),
        ],
      },
      {
        say: '`Rc::clone(&a)` does not touch the string at all — it writes a second handle on the stack and increments the counter with ordinary addition, `n = n + 1`. Three instructions: load, add, store. No allocation, no copy, and nothing atomic about it.',
        mark: ['12'],
        focus: ['a', 'b', 'a.p', 'b.p', 'ctrl', 'data', 'rcbox', 'inc'],
        shapes: () => [
          ...regions(),
          ownerFrame('a', 96, 'a: Rc<String>', 'owned'),
          ownerFrame('b', 280, 'b: Rc<String>', 'owned'),
          Region({ key: 'rcbox', x: 418, y: 92, w: 248, h: 232, label: 'RcBox<T> — one allocation', tone: 'heap' }),
          Frame({
            key: 'ctrl',
            x: 434,
            y: 116,
            w: 216,
            label: 'control block',
            tone: 'heap',
            vars: [
              { name: 'strong', value: '2', tone: 'owned' },
              { name: 'weak', value: '0', tone: 'neutral' },
            ],
          }),
          Box({ key: 'data', x: 434, y: 236, w: 216, h: 70, label: 'String', sub: '"hello"', tone: 'heap' }),
          ptrArrow('a.p', 96, [434, 150]),
          ptrArrow('b.p', 280, [434, 172], 'owned'),
          Tag({ key: 'inc', x: 434, y: 196, text: 'n = n + 1, no lock', tone: 'owned' }),
        ],
      },
      {
        say: 'Swap in `Arc` and the shape is identical — the difference is entirely inside `clone`. `fetch_add` compiles to a single `lock xadd`: the core takes the cache line in exclusive state so no other core can observe a half-finished update. That safety is why `Arc` is allowed across threads and `Rc` is not.',
        mark: ['15-17'],
        focus: ['a', 'b', 'a.p', 'b.p', 'ctrl', 'data', 'rcbox', 'atom'],
        shapes: () => [
          ...regions(),
          ownerFrame('a', 96, 'a2: Arc<String>', 'owned'),
          ownerFrame('b', 280, 'b2: Arc<String>', 'owned'),
          Region({ key: 'rcbox', x: 418, y: 92, w: 248, h: 232, label: 'ArcInner<T> — one allocation', tone: 'heap' }),
          Frame({
            key: 'ctrl',
            x: 434,
            y: 116,
            w: 216,
            label: 'control block',
            tone: 'heap',
            vars: [
              { name: 'strong', value: 'AtomicUsize: 2', tone: 'highlight' },
              { name: 'weak', value: '0', tone: 'neutral' },
            ],
          }),
          Box({ key: 'data', x: 434, y: 236, w: 216, h: 70, label: 'String', sub: '"hello"', tone: 'heap' }),
          ptrArrow('a.p', 96, [434, 150]),
          ptrArrow('b.p', 280, [434, 172], 'highlight'),
          Tag({ key: 'atom', x: 434, y: 196, text: 'lock xadd — ~20 cycles, more if cores contend', tone: 'highlight' }),
        ],
      },
      {
        say: '`RefCell<T>` is a different problem: not "who owns this" but "is anyone else touching this right now". It carries a hidden flag next to the value and checks it every time you call `.borrow()` or `.borrow_mut()` — the compile-time rule from earlier lessons, reimplemented as a run-time counter.',
        mark: ['21'],
        shapes: () => [
          Region({ key: 'r.stack', ...STACK, label: 'STACK', tone: 'stack' }),
          Frame({
            key: 'cell',
            x: 64,
            y: 150,
            w: 260,
            label: 'cell: RefCell<i32>',
            tone: 'owned',
            vars: [
              { name: 'borrow flag', value: 'UNBORROWED', tone: 'owned' },
              { name: 'value', value: '5', tone: 'neutral' },
            ],
          }),
        ],
      },
      {
        say: 'The first `borrow_mut()` succeeds and flips the flag to "mutably borrowed", handing out an exclusive `&mut i32` while it holds that state.',
        mark: ['23'],
        shapes: () => [
          Region({ key: 'r.stack', ...STACK, label: 'STACK', tone: 'stack' }),
          Frame({
            key: 'cell',
            x: 64,
            y: 150,
            w: 260,
            label: 'cell: RefCell<i32>',
            tone: 'owned',
            vars: [
              { name: 'borrow flag', value: 'MUT BORROWED', tone: 'highlight' },
              { name: 'value', value: '5', tone: 'neutral' },
            ],
          }),
          Tag({ key: 'held', x: 64, y: 240, text: 'first: &mut i32, still alive', tone: 'highlight' }),
        ],
      },
      {
        say: 'Now a second `.borrow_mut()` runs while `first` is still in scope.',
        mark: ['24'],
        predict: {
          ask: 'What happens when this second `.borrow_mut()` runs while the first borrow is still alive?',
          options: [
            { label: 'It fails to compile, the same error the borrow checker gives at compile time', correct: false },
            { label: 'It runs and hands back a second `&mut i32` aliasing the first', correct: false },
            { label: 'It panics at runtime — `already borrowed: BorrowMutError`', correct: true },
          ],
          because:
            'There is no compiler in the loop here. `borrow_mut` reads the flag, sees MUT BORROWED, and panics instead of handing out a second exclusive reference. The rule Rust enforced at compile time for `&mut` is the exact rule this flag enforces at runtime — moved, not removed.',
        },
        shapes: () => [
          Region({ key: 'r.stack', ...STACK, label: 'STACK', tone: 'stack' }),
          Frame({
            key: 'cell',
            x: 64,
            y: 150,
            w: 260,
            label: 'cell: RefCell<i32>',
            tone: 'freed',
            vars: [
              { name: 'borrow flag', value: 'MUT BORROWED', tone: 'freed' },
              { name: 'value', value: '5', tone: 'neutral' },
            ],
          }),
          Tag({ key: 'held', x: 64, y: 240, text: 'first: &mut i32, still alive', tone: 'highlight' }),
          Text({
            key: 'panic',
            x: 64,
            y: 290,
            text: "thread panicked: already borrowed: BorrowMutError",
            size: 12,
            mono: true,
            tone: 'freed',
            weight: 650,
          }),
        ],
      },
      {
        say: 'Put them together and you get the standard escape hatch: `Rc<RefCell<T>>` gives you many owners *and* interior mutability. It also stacks every cost — a pointer indirection through `Rc`, then a flag check through `RefCell`, before you reach the value — and neither half is thread-safe, which is why the cross-thread version is `Arc<Mutex<T>>`, not this.',
        mark: ['28-30'],
        shapes: () => [
          ...regions(),
          ownerFrame('a', 96, 's: Rc<RefCell<Vec>>', 'owned'),
          ownerFrame('b', 280, 's2: Rc<RefCell<Vec>>', 'owned'),
          Region({ key: 'rcbox', x: 418, y: 92, w: 248, h: 232, label: 'RcBox<RefCell<Vec>>', tone: 'heap' }),
          Frame({
            key: 'ctrl',
            x: 434,
            y: 116,
            w: 216,
            label: 'control block',
            tone: 'heap',
            vars: [
              { name: 'strong', value: '2', tone: 'owned' },
              { name: 'borrow flag', value: 'free', tone: 'owned' },
            ],
          }),
          Box({ key: 'data', x: 434, y: 236, w: 216, h: 70, label: 'Vec<i32>', sub: '[1, 2, 3, 4]', tone: 'heap' }),
          ptrArrow('a.p', 96, [434, 150]),
          ptrArrow('b.p', 280, [434, 172], 'owned'),
        ],
      },
    ],
  },

  code: {
    lang: 'rust',
    filename: 'main.rs',
    source: `use std::cell::RefCell;
use std::rc::Rc;
use std::sync::Arc;

fn main() {
    // Box: one pointer, one heap allocation, nothing else.
    let boxed: Box<i32> = Box::new(42);
    println!("{boxed}");

    // Rc: shared ownership, plain (non-atomic) reference count.
    let a = Rc::new(String::from("hello"));
    let b = Rc::clone(&a);                 // strong count: 1 -> 2
    println!("owners: {}", Rc::strong_count(&a));

    // Arc: identical API, atomic reference count -- safe across threads.
    let a2 = Arc::new(String::from("hello"));
    let b2 = Arc::clone(&a2);               // lock xadd, not a plain add
    println!("owners: {}", Arc::strong_count(&a2));

    // RefCell: the borrow rule enforced at run time instead of compile time.
    let cell = RefCell::new(5);
    {
        let first = cell.borrow_mut();      // flag: mutably borrowed
        // let second = cell.borrow_mut();  // panics: already borrowed
        drop(first);                         // flag cleared here
    }

    // The standard escape hatch: shared AND mutable, checked at runtime.
    let shared = Rc::new(RefCell::new(vec![1, 2, 3]));
    let s2 = Rc::clone(&shared);
    shared.borrow_mut().push(4);
    println!("{:?}", s2.borrow());
}`,
    annotations: [
      {
        lines: '7',
        text: '`Box::new` is one call to the allocator. There is nothing else in the type — `size_of::<Box<i32>>()` is one pointer.',
      },
      {
        lines: '12',
        text: 'Only the three-word `Rc` header is copied. The clone increments a plain `usize` field it shares with `a` — no lock, no allocation.',
      },
      {
        lines: '17',
        text: 'Same call, different instruction underneath: `Arc::clone` is `fetch_add`, one `lock xadd`, so concurrent clones cannot lose an increment.',
      },
      {
        lines: '23-25',
        text: 'Uncomment line 24 and the program builds fine, then panics the moment it runs — `RefCell` cannot refuse this at compile time, so it refuses it live.',
      },
    ],
  },

  deeper: [
    'None of these types change what a reference is at the machine level. A `Box<T>`, the data pointer inside an `Rc<T>`, and a plain `&T` are all one pointer-sized value; the differences are entirely in what surrounds them. `Box` adds an owning-drop obligation the compiler tracks statically. `Rc`/`Arc` add a heap-resident counter next to the data, allocated once with it as a single `RcBox<T>` / `ArcInner<T>`, and every clone or drop touches that counter. `RefCell` adds a `Cell<BorrowFlag>` sitting next to the value, checked on every `borrow` and `borrow_mut` call. You are always paying for exactly the guarantee you asked for and nothing you did not.',
    '`Rc::clone` versus `Arc::clone` is the cleanest illustration of what "atomic" costs on real hardware. A non-atomic `n += 1` is a load, an add, and a store — the core can keep the cache line in a shared or exclusive state as convenient, and the store buffer can even reorder it relative to other work. `fetch_add` forces the core to take the line in the *Modified* state via the cache-coherence protocol before it can complete, and forbids reordering around it. Uncontended that costs roughly 15-25 cycles versus 1-2 for the plain add; contended, when several cores clone the same `Arc` in a hot loop, the cache line bounces between cores and the cost climbs into the hundreds of cycles per clone. This is why hot-path code clones an `Arc` once outside a loop rather than once per iteration inside it.',
    '`RefCell` does not make your program thread-safe — it makes a *single-threaded* aliasing violation into a panic instead of undefined behaviour. The flag it checks is a plain `Cell<isize>`: positive for some number of live shared borrows, `isize::MIN`-based sentinel for one exclusive borrow, checked and updated with ordinary (non-atomic) reads and writes. Two threads calling `borrow_mut()` on the same `RefCell` at once are back to the exact race `Rc`\'s non-atomic count has — which is precisely why `RefCell<T>` is `Send` but not `Sync`, and the compiler refuses to let two threads share a `&RefCell<T>` in the first place.',
    'The runtime borrow check is not free even when nothing panics. Every `.borrow()` and `.borrow_mut()` is a conditional branch on the flag plus a write to update it, and the return value is a guard type (`Ref`/`RefMut`) whose `Drop` impl writes the flag back down — so a hot loop calling `.borrow_mut()` per element pays that pair of checks per element, on top of the `Rc` pointer chase to get there. Profile before assuming this matters; on a cold path it never will, and rewriting it away for speed you do not need is how "clever" Rust gets written.',
    'Reach for the cheapest tool that is actually sound for your data shape: `Box` when there is one owner and you only needed the heap for size or recursion; `Rc<RefCell<T>>` for a single-threaded graph with genuinely shared, sometimes-mutated nodes — GUI widget trees and single-threaded caches are the canonical case; `Arc<Mutex<T>>` or `Arc<RwLock<T>>` the moment a second thread needs in. Reaching for `Arc<Mutex<T>>` by default when nothing crosses a thread boundary is a common tell in an interview — it works, but it is paying an atomic increment and a lock acquisition for a guarantee nobody needed.',
  ],

  gotchas: [
    '`Rc::clone(&a)` and `a.clone()` compile to the same code, but the explicit form is idiomatic precisely because it is unambiguous at a glance whether you are cloning the `Rc` (cheap, a counter bump) or the inner `T` (potentially expensive) — Clippy will not warn you either way.',
    'A `RefCell` panic happens at the call to `.borrow()`/`.borrow_mut()`, not at the point where the conflicting borrow was taken. The stack trace points at the *second* borrow; finding the first one that is still alive is a manual search through whatever is holding a `Ref`/`RefMut` guard past where you expect it to have dropped.',
    'An `Rc` cycle — two nodes each holding a strong `Rc` to the other — never reaches a strong count of zero, so neither is ever dropped. This is a real, silent memory leak, not UB; the fix is `Weak<T>` for the back-reference, via `Rc::downgrade`.',
    'Cloning an `Rc<RefCell<T>>` gives you a second handle to the *same* `RefCell`, not a copy of the data. `shared.borrow_mut().push(4)` from `a` is visible immediately through `b` — which is the point, but it surprises people expecting value semantics from something that looks like ordinary Rust.',
  ],

  interview: {
    q: 'When would you reach for `Rc<RefCell<T>>` instead of just passing `&mut T` around, and what does it cost you?',
    a: [
      'When the ownership shape is not a tree. `&mut T` requires the borrow checker to prove, at compile time, that exactly one path to the data is live at once — which works for a call stack but not for a graph where two nodes need to reach the same child, or a callback registered against a shared cache. `Rc<RefCell<T>>` moves both questions to runtime: "who owns this" becomes a reference count, and "am I allowed to mutate this right now" becomes a flag checked on each borrow.',
      'The cost has two parts, and a strong answer names both. First, every clone is a non-atomic counter bump and every access is a pointer chase through the `Rc` plus a branch-and-flag-write through the `RefCell` — cheap individually, but real if it is in a hot loop. Second, and more important, the compiler no longer catches a borrow conflict for you; it becomes a runtime panic, discovered only on the code path that triggers it, possibly the first time in production rather than at `cargo build`.',
      'The detail that separates a memorised answer from an understood one: `Rc<RefCell<T>>` does not make anything thread-safe. It is a single-threaded pattern, full stop — `Rc` is not `Sync` and the compiler refuses to share it across threads, which is the escape hatch working correctly rather than a limitation. The moment a second thread needs access, the honest swap is `Arc<Mutex<T>>` (or `RwLock`), which pays an atomic increment for the handle and a lock acquisition for the access, not a bigger `RefCell`.',
    ],
  },

  exercise: [
    'Build an `Rc` cycle on purpose: two structs, each holding a `RefCell<Option<Rc<Other>>>` pointing at the other, set both links after construction, then drop both variables and print `Rc::strong_count` on each before they go out of scope. Confirm the count never reaches zero and the `Drop` impls (add one to print from each) never run — you have built a real leak. Then fix it by making one direction a `Weak<T>` via `Rc::downgrade`, and watch both drops fire.',
    'Trigger the panic from the predict step yourself: create a `RefCell<Vec<i32>>`, take a `borrow_mut()`, and while it is still in scope take a second one. Run it and read the panic message and the line it points to versus the line where the first borrow was actually taken — that gap is the real cost of moving the check to runtime.',
  ],
};
