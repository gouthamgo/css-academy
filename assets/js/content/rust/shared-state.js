import { Region, Box, Cell, Frame, Arrow, Bracket, Text, Tag } from '../../viz/primitives.js';

/* First act contrasts a C++-shaped diagram (mutex and data as two
   independent siblings) against Rust's (data lives inside the Mutex
   box). Second act is two thread lanes showing contention and
   poisoning; third is a compact RwLock panel. Different acts get
   different keys — they are genuinely different diagrams, not one
   diagram evolving. */
const LANE_A = { x: 20, y: 130, w: 330, h: 250 };
const LANE_B = { x: 370, y: 130, w: 330, h: 250 };

const lanes = (labelA, labelB, toneA = 'stack', toneB = 'stack') => [
  Region({ key: 'r.a', ...LANE_A, label: labelA, tone: toneA }),
  Region({ key: 'r.b', ...LANE_B, label: labelB, tone: toneB }),
];

export default {
  oneLiner:
    '`Mutex<T>` wraps the data itself, not the code path to it — a compile-time guarantee that C++\'s `std::mutex` never gives you.',

  whyJob:
    'This is the single detail that separates "I have used a mutex" from "I understand what Rust adds": a strong candidate can explain precisely why `balance_ += 1;` compiles in C++ without the lock and cannot compile in Rust at all.',

  mentalModel:
    'In C++, a mutex is a padlock sitting *next to* a filing cabinet — nothing about the cabinet\'s drawer stops you opening it without touching the lock; the discipline lives entirely in the programmer\'s head and the code reviewer\'s attention. In Rust, `Mutex<T>` *is* the cabinet: the drawer has no other handle, and `.lock()` is the only door in. The compiler enforces the discipline C++ can only ask you to remember.',

  scene: {
    id: 'mutex-owns-data',
    title: 'Where the data actually lives',
    width: 720,
    height: 420,
    legend: [
      { tone: 'owned', label: 'holds the lock / valid access' },
      { tone: 'heap', label: 'the Mutex itself' },
      { tone: 'freed', label: 'refused, blocked, or poisoned' },
    ],
    steps: [
      {
        say: 'In C++, `std::mutex mu_` and `int balance_` are two separate class members. Nothing in the type system connects them — every function that touches `balance_` has to *remember* to lock `mu_` first, and nothing stops one that forgets.',
        mark: [],
        shapes: () => [
          Text({ key: 'h', x: 30, y: 40, text: 'C++: the mutex and the data are independent members', size: 12, mono: true, weight: 650, tone: 'freed' }),
          Box({ key: 'mu', x: 90, y: 150, w: 200, h: 70, label: 'std::mutex mu_', tone: 'neutral' }),
          Box({ key: 'data', x: 430, y: 150, w: 200, h: 70, label: 'int balance_', tone: 'owned' }),
          Arrow({
            key: 'bypass', from: [290, 185], to: [430, 185], shape: 'straight', bend: 0,
            tone: 'freed', dashed: true, label: 'balance_ += 10;  // mu_ untouched',
          }),
          Tag({ key: 'legal', x: 430, y: 240, text: 'compiles fine — races at runtime', tone: 'freed' }),
        ],
      },
      {
        say: 'Rust\'s `Mutex<T>` owns `T` directly — there is no `balance` field sitting beside it for a call site to forget. The struct you write has one field, and it is the mutex.',
        mark: ['4', '5', '6'],
        shapes: () => [
          Text({ key: 'h', x: 30, y: 40, text: 'Rust: the data lives INSIDE the Mutex', size: 12, mono: true, weight: 650, tone: 'owned' }),
          Box({ key: 'mutex.outer', x: 210, y: 90, w: 300, h: 180, label: 'Mutex<Ledger>', labelSize: 13, tone: 'heap' }),
          Box({ key: 'data.inner', x: 260, y: 190, w: 200, h: 60, label: 'Ledger { balance }', labelSize: 11, tone: 'owned' }),
          Tag({ key: 'blocked', x: 240, y: 300, text: 'no field access — it does not exist', tone: 'freed' }),
        ],
      },
      {
        say: '`.lock()` blocks until the mutex is free, then hands back a `MutexGuard<T>` — a smart pointer whose `Deref` and `DerefMut` are the only way to reach the `Ledger` inside.',
        mark: ['15'],
        predict: {
          ask: 'Is there any way to read the `i64` inside `ledger` in Rust without going through `.lock()`?',
          options: [
            { label: 'Yes — holding a `&Mutex<T>` lets you dereference it directly', correct: false },
            { label: 'No — Mutex<T> never exposes T itself, only .lock() returning a guard', correct: true },
            { label: 'Yes, but only from the thread that created the Mutex', correct: false },
          ],
          because:
            '`Mutex<T>` has exactly one accessor that reaches `T`: `lock(&self) -> LockResult<MutexGuard<T>>`. There is no `get()`, no public field, no `&T` method at all. Forgetting to call `.lock()` first is not a race you might get lucky on — it is a value you do not have, caught the same way any other missing variable is caught, at compile time.',
        },
        focus: ['mutex.outer', 'data.inner', 'call', 'guard', 'a.call', 'a.guard'],
        shapes: () => [
          Box({ key: 'mutex.outer', x: 210, y: 90, w: 300, h: 180, label: 'Mutex<Ledger>', labelSize: 13, tone: 'heap' }),
          Box({ key: 'data.inner', x: 260, y: 190, w: 200, h: 60, label: 'Ledger { balance }', labelSize: 11, tone: 'owned' }),
          Box({ key: 'call', x: 20, y: 200, w: 150, h: 50, label: 'ledger.lock()', tone: 'highlight' }),
          Arrow({ key: 'a.call', from: [170, 225], to: [210, 210], shape: 'straight', bend: 0, tone: 'highlight' }),
          Box({ key: 'guard', x: 550, y: 200, w: 150, h: 50, label: 'MutexGuard<Ledger>', labelSize: 11, tone: 'owned' }),
          Arrow({ key: 'a.guard', from: [510, 210], to: [550, 225], shape: 'straight', bend: 0, tone: 'owned', label: 'returned' }),
          Arrow({ key: 'a.deref', from: [550, 240], to: [460, 220], shape: 'curve', bend: -20, tone: 'owned', dashed: true, label: 'Deref' }),
        ],
      },
      {
        say: 'The guard is an ordinary value with a lifetime — its `Drop` impl unlocks the mutex, so the unlock happens at the closing brace. This is the same RAII pattern C++\'s `lock_guard` gives you, except in Rust it is not an optional courtesy: it is the *only* code path that can produce access at all.',
        mark: ['15', '16', '17'],
        shapes: () => [
          Box({ key: 'stmt1', x: 220, y: 110, w: 280, h: 36, label: 'let mut guard = ledger.lock().unwrap();', mono: true, labelSize: 11, tone: 'owned' }),
          Box({ key: 'stmt2', x: 220, y: 156, w: 280, h: 36, label: 'guard.balance -= 10;', mono: true, labelSize: 11, tone: 'owned' }),
          Bracket({ key: 'scope', x: 220, y: 206, w: 280, label: 'guard scope', tone: 'highlight' }),
          Tag({ key: 'unlocked', x: 300, y: 236, text: 'unlock happens automatically here', tone: 'owned' }),
        ],
      },
      {
        say: 'Clone the `Arc` and send it to another thread, and the same rule holds across threads: whichever `.lock()` call returns first holds the only `MutexGuard` in existence. The second thread\'s `.lock()` does not read stale data or skip the wait — it blocks, full stop, until that guard is dropped.',
        mark: ['13', '14', '15'],
        shapes: () => [
          ...lanes('THREAD A', 'THREAD B'),
          Box({ key: 'mu.mid', x: 300, y: 60, w: 120, h: 50, label: 'Mutex<Ledger>', labelSize: 11, tone: 'heap' }),
          Box({ key: 'gA', x: 60, y: 220, w: 220, h: 60, label: 'guard held', sub: 'balance -= 10', tone: 'owned' }),
          Box({ key: 'gB', x: 420, y: 220, w: 220, h: 60, label: '.lock() — BLOCKED', sub: 'waiting for the guard', tone: 'freed' }),
          Arrow({ key: 'aLine', from: [360, 110], to: [170, 220], shape: 'curve', bend: 24, tone: 'owned' }),
          Arrow({ key: 'bLine', from: [360, 110], to: [530, 220], shape: 'curve', bend: -24, tone: 'freed', dashed: true }),
        ],
      },
      {
        say: 'If Thread A panics while holding the guard, Rust does not silently unlock into data that might be half-updated. The mutex is marked *poisoned*; the next `.lock()` still succeeds in acquiring it, but returns `Err`, forcing the caller to decide whether the data can still be trusted.',
        mark: [],
        shapes: () => [
          ...lanes('THREAD A — panicked', 'THREAD B', 'freed', 'stack'),
          Box({ key: 'mu.mid', x: 300, y: 60, w: 120, h: 50, label: 'Mutex<Ledger>', labelSize: 11, tone: 'freed' }),
          Tag({ key: 'poison', x: 300, y: 118, text: 'poisoned', tone: 'freed' }),
          Box({ key: 'gA', x: 60, y: 220, w: 220, h: 60, label: 'panic! mid-update', sub: 'guard dropped during unwind', tone: 'freed' }),
          Box({ key: 'gB', x: 420, y: 220, w: 220, h: 60, label: 'lock() -> Err(Poisoned)', sub: 'balance may be inconsistent', tone: 'freed' }),
        ],
      },
      {
        say: 'A `Mutex` grants exactly one holder, reader or writer. `RwLock<T>` adds a second mode: any number of readers at once, or exactly one writer, never both — worth reaching for only when reads vastly outnumber writes, since tracking "how many readers" costs more per access than a plain mutex\'s single bit.',
        mark: ['27', '32'],
        shapes: () => [
          Box({ key: 'rw', x: 270, y: 130, w: 180, h: 60, label: 'RwLock<Vec<i32>>', labelSize: 11, tone: 'heap' }),
          Box({ key: 'r1', x: 30, y: 240, w: 140, h: 44, label: 'reader A', sub: '.read()', tone: 'owned' }),
          Box({ key: 'r2', x: 190, y: 240, w: 140, h: 44, label: 'reader B', sub: '.read()', tone: 'owned' }),
          Box({ key: 'r3', x: 350, y: 240, w: 140, h: 44, label: 'reader C', sub: '.read()', tone: 'owned' }),
          Box({ key: 'w1', x: 550, y: 240, w: 140, h: 44, label: 'writer', sub: '.write() — waits its turn', tone: 'freed' }),
          Arrow({ key: 'e1', from: [100, 240], to: [320, 190], shape: 'curve', bend: 30, tone: 'owned' }),
          Arrow({ key: 'e2', from: [260, 240], to: [340, 190], shape: 'curve', bend: 14, tone: 'owned' }),
          Arrow({ key: 'e3', from: [420, 240], to: [400, 190], shape: 'curve', bend: -14, tone: 'owned' }),
          Arrow({ key: 'e4', from: [620, 240], to: [440, 190], shape: 'curve', bend: -30, tone: 'freed', dashed: true }),
        ],
      },
    ],
  },

  code: {
    lang: 'rust',
    filename: 'main.rs',
    source: `use std::sync::{Arc, Mutex, RwLock};
use std::thread;

struct Ledger {
    balance: i64,       // lives INSIDE the Mutex — no side-by-side data
}

fn main() {
    let ledger = Arc::new(Mutex::new(Ledger { balance: 1_000 }));

    let mut handles = Vec::new();
    for _ in 0..4 {
        let ledger = Arc::clone(&ledger);
        handles.push(thread::spawn(move || {
            let mut guard = ledger.lock().unwrap();  // blocks until free
            guard.balance -= 10;                     // only path to the data
        }));                                          // guard drops here -> unlock
    }
    for h in handles {
        h.join().unwrap();
    }

    let final_balance = ledger.lock().unwrap().balance;
    println!("balance: {final_balance}");

    // RwLock: many readers OR one writer, never both
    let cache = Arc::new(RwLock::new(vec![1, 2, 3]));
    {
        let snapshot: Vec<i32> = cache.read().unwrap().clone(); // many can hold this
        println!("{snapshot:?}");
    }
    cache.write().unwrap().push(4);                             // exclusive
}`,
    annotations: [
      {
        lines: '4-6',
        text: '`balance` is a private field of `Ledger`, and `Ledger` only ever exists inside the `Mutex`. There is no second name anywhere in the program that reaches this `i64` without going through `.lock()`.',
      },
      {
        lines: '9',
        text: '`Arc<Mutex<T>>` is the standard combination for state genuinely shared by ownership across threads: `Arc` clones the *handle*, `Mutex` serialises access to the one allocation all the handles point at.',
      },
      {
        lines: '15',
        text: '`.lock()` returns `LockResult<MutexGuard<T>>`, not `MutexGuard<T>` directly — `.unwrap()` here panics if the mutex is poisoned, which is the correct default: silently proceeding on data a previous thread panicked while updating is rarely the safe choice.',
      },
      {
        lines: '27-32',
        text: '`.read()` can be held by any number of callers simultaneously; `.write()` requires that no `.read()` or `.write()` guard exists anywhere. Both still return a `LockResult`, so `RwLock` is poisoned by a panicking writer exactly like `Mutex` is.',
      },
    ],
  },

  deeper: [
    'The type-level trick is smaller than it looks: `Mutex<T>` has no method that returns `&T` or `&mut T`. Its entire public surface for reaching the payload is `lock(&self) -> LockResult<MutexGuard<\'_, T>>`, and `MutexGuard` is the only thing that implements `Deref<Target = T>` and `DerefMut<Target = T>` pointing at it. Because ordinary field access requires a name to dot into, and there is no field, "read the data without locking" is not a discipline you have to maintain — it is a program that does not exist to write.',
    '`Arc<Mutex<T>>` splits two separate jobs that are easy to conflate. `Arc` is about *reference counting a handle* — cloning it is cheap (an atomic increment) and gives every thread its own handle to the same heap allocation. `Mutex` is about *serialising access* to what that allocation holds. You need both: `Arc` alone would let two threads mutate through `&T` concurrently (which `Mutex<T>: Sync` specifically forbids by requiring the lock), and `Mutex` alone has no story for how the mutex itself gets to more than one thread, since it is not `Clone`.',
    'Poisoning exists because Rust refuses to let a panic silently corrupt shared state. If a thread panics while holding a `MutexGuard`, the guard\'s `Drop` runs during unwinding and marks the mutex poisoned before releasing the underlying lock. The *next* `.lock()` call still succeeds at acquiring the lock — poisoning is not a second lock — but it returns `Err(PoisonError<MutexGuard<T>>)` instead of `Ok`. Calling `.into_inner()` on that error hands you the guard anyway, which is the escape hatch for code that can prove the invariant was not actually broken; blind `.unwrap()`, which is what most code does, simply propagates the panic to every subsequent locker, which is often exactly right for state you cannot safely reason about half-updated.',
    '`RwLock<T>` costs more per access than `Mutex<T>` does, which is the detail that gets skipped in "just use RwLock for read-heavy workloads" advice. Tracking "how many readers currently hold this" needs its own atomic state distinct from the single locked bit a mutex needs, and on contended workloads with short critical sections a `RwLock` can lose to a plain `Mutex` because writer-starvation avoidance and reader-count bookkeeping add overhead a mutex never pays. Reach for it when reads meaningfully outnumber writes and the critical section is long enough that letting readers run concurrently is worth the extra bookkeeping — not by default.',
    'Deadlock is the one class of bug none of this prevents. Two mutexes locked in opposite orders by two threads deadlock in Rust exactly as in C++ — the type system guarantees you cannot touch the data without the lock, it says nothing about the order in which you take multiple locks. The fix is the same discipline as C++: a fixed global lock order, or acquiring both at once the way `std::scoped_lock` does — Rust\'s standard library has no built-in multi-lock primitive, so this is usually solved by structuring the data so one `Mutex` protects everything that must change together, rather than reaching for several.',
  ],

  gotchas: [
    'A `MutexGuard<T>` is `Sync` but deliberately **not** `Send` on some implementations, because certain platforms require the same thread that locked a mutex to unlock it. Holding a guard across an `.await` point is the classic symptom — the future stops being `Send`, and the compiler error names the guard rather than the await.',
    '`.lock().unwrap()` is the idiomatic default, but it means a poisoned mutex takes down every subsequent caller with a panic, not just the one that observed the original failure. For code that can tolerate possibly-stale data — a metrics counter, a cache — call `.unwrap_or_else(|e| e.into_inner())` deliberately, and comment why it is safe to ignore the poison.',
    'Locking two mutexes in different orders on different threads deadlocks in Rust exactly as in C++. The type system prevents unsynchronised access, not lock ordering — this is still entirely the programmer\'s responsibility.',
    'A guard that outlives the statement it was meant for — `let guard = ledger.lock().unwrap(); do_other_work();` — holds the lock for the whole remaining scope, not just the line that touched the data. This is a common accidental-contention bug: the fix is a tighter block, `{ let guard = ...; ... }`, so `Drop` runs sooner.',
    '`RwLock` does not guarantee readers or writers get priority — the standard library\'s implementation can, under sustained read load, starve a waiting writer indefinitely, or vice versa depending on platform. Do not assume fairness; measure it if latency tails matter.',
  ],

  interview: {
    q: 'In C++, `mu_.lock(); balance_ += 1; mu_.unlock();` compiles even if you forget the lock entirely. Why can that not happen in Rust, and what does `Mutex<T>` actually guard?',
    a: [
      'Because C++\'s `std::mutex` and the data it protects are two unrelated class members connected only by convention — nothing stops any function from touching `balance_` directly. Rust\'s `Mutex<T>` inverts the relationship: the data is a type parameter *owned by* the mutex, not a sibling of it. `Mutex<T>` exposes exactly one way to reach the `T` — `lock()`, returning a `MutexGuard<T>` — and there is no other method, no public field, nothing else that names the value. You cannot write code that touches the data without holding the lock, because there is no expression in the language that would do it.',
      'What `Mutex<T>` guards, precisely, is concurrent access to `T` through `&self` and `&mut self` — it is `Sync` for any `T: Send`, meaning many threads can hold a `&Mutex<T>` at once, but only one of them can turn that into a live reference to the inner value at a time, enforced by the guard\'s lifetime. Dropping the guard is what releases the lock, tied to ordinary Rust scoping rather than a manual unlock call, so the same RAII discipline C++\'s `lock_guard` gives you optionally is, in Rust, the only path that exists.',
      'The detail that separates a memorised answer from an understood one: this guarantees *no unsynchronised access*, not correctness in general. Deadlock from inconsistent lock ordering is still entirely possible and entirely the programmer\'s problem — the type system has nothing to say about the order two mutexes are acquired in, only about whether the data behind either one can be touched without going through its lock.',
    ],
  },

  exercise: [
    'Take the `Ledger` example, remove `Mutex` and share `Arc<Ledger>` with a `balance: i64` field directly across four threads that each do `unsafe { ... }` writes (or, more realistically, try to compile the non-`Mutex` version and read exactly which `Sync` bound fails). Note where the compiler stops you versus where C++ would have let the same program build and race silently.',
    'Then trigger poisoning on purpose: spawn a thread that locks the mutex and panics before unlocking (`panic!("boom")` inside the critical section), join it, and call `.lock()` again from `main`. Match on the `Err` variant and print what `into_inner()` gives you — seeing an `Err(PoisonError { .. })` come back from a successful lock acquisition is the detail people get wrong when explaining poisoning from memory.',
    'Finally, benchmark `Mutex<Vec<i32>>` against `RwLock<Vec<i32>>` under a workload with nine reader threads for every one writer thread, using `criterion`. Confirm `RwLock` wins there, then flip the ratio to mostly writers and confirm `Mutex` wins instead — the number, not the advice, is what should decide which one you reach for.',
  ],
};
