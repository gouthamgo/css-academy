import { Region, Box, Cell, Arrow, Text, Tag } from '../../viz/primitives.js';

/* ------------------------------------------------------------------
   Two lanes, mirroring the layout data-races.js and atomics.js use,
   so the three lessons read as a family. A mutex cell sits between
   them because it belongs to neither thread — only the CAS on it
   decides who gets to keep going and who leaves the CPU.
   ------------------------------------------------------------------ */
const LANE_A = { x: 20, y: 70, w: 326, h: 300 };
const LANE_B = { x: 374, y: 70, w: 326, h: 300 };
const A_X = LANE_A.x + 16; // 36
const B_X = LANE_B.x + 16; // 390
const ROW_W = 294;

const SRC_Y = 100, SRC_H = 34;
const OP_Y = 150, OP_H = 42;
const CRIT_Y = 208, CRIT_H = 90;
const STATUS_Y = 316;

const costA = (label, sub, tone = 'neutral') =>
  Box({ key: 'costA', x: 20, y: 14, w: 206, h: 40, label, sub, tone, labelSize: 12 });
const costB = (label, sub, tone = 'neutral') =>
  Box({ key: 'costB', x: 494, y: 14, w: 206, h: 40, label, sub, tone, labelSize: 12 });
const mutexCell = (value, tone = 'neutral') =>
  Cell({ key: 'mutex', x: 300, y: 10, w: 120, h: 48, name: 'std::mutex mu_', value, tone });

const lanes = () => [
  Region({ ...LANE_A, key: 'laneA', label: 'THREAD A', tone: 'stack' }),
  Region({ ...LANE_B, key: 'laneB', label: 'THREAD B', tone: 'stack' }),
];

const srcBox = (key, x, tone = 'neutral') =>
  Box({ key, x, y: SRC_Y, w: ROW_W, h: SRC_H, label: 'lock_guard<mutex> lock(mu_);', labelSize: 11, mono: true, tone, dashed: true });
const opBox = (key, x, label, tone = 'neutral') =>
  Box({ key, x, y: OP_Y, w: ROW_W, h: OP_H, label, labelSize: 11.5, mono: true, tone });
const critBox = (key, x, label, tone = 'neutral', dashed = false) =>
  Box({ key, x, y: CRIT_Y, w: ROW_W, h: CRIT_H, label, labelSize: 11.5, mono: true, tone, dashed });
const statusTag = (key, x, text, tone = 'neutral') =>
  Tag({ key, x, y: STATUS_Y, w: ROW_W, text, tone });

export default {
  oneLiner:
    'What actually happens inside `lock()` — a single atomic compare-and-swap when nobody is waiting, and a trip through the kernel scheduler when somebody is.',

  whyJob:
    'Any system with more than one thread touching shared state eventually forces a candidate to explain why a lock that is "basically free" can suddenly cost a thread microseconds. Trading and ML-infra interviewers use this specifically to separate people who have read about mutexes from people who have profiled one.',

  mentalModel:
    'A mutex is a single locked door with one key hanging beside it. Taking the key when it is *hanging right there* costs the time to reach out and grab it — one atomic instruction. Arriving to find the key already gone means you do not stand at the door holding the handle: you *go sit down*, and someone taps you on the shoulder when the key comes back. That tap is a system call, and standing back up is a trip through the scheduler — which is why the two cases are not a little different, they are worlds apart.',

  scene: {
    id: 'mutex-contention',
    title: 'Two threads, one mutex: the fast path and the parked path',
    width: 720,
    height: 420,
    legend: [
      { tone: 'owned', label: 'uncontended / holding the lock' },
      { tone: 'highlight', label: 'attempting the lock' },
      { tone: 'miss', label: 'contended — the expensive path' },
      { tone: 'freed', label: 'blocked — off the CPU' },
    ],
    steps: [
      {
        say: 'A `std::mutex` starts unlocked. Both threads are about to construct a `lock_guard` around the same object — its constructor acquires the mutex, its destructor releases it, so no path through this function forgets to unlock.',
        mark: ['8-11'],
        shapes: () => [
          costA('thread A: —', 'not called yet'),
          costB('thread B: —', 'not called yet'),
          mutexCell('unlocked'),
          ...lanes(),
          srcBox('srcA', A_X),
          srcBox('srcB', B_X),
        ],
      },
      {
        say: 'Thread A reaches the mutex first and nobody else holds it. Acquiring it is one atomic compare-and-swap — flip the word from 0 to “locked” — entirely in user space. No system call happens on this path.',
        mark: ['9'],
        shapes: () => [
          costA('thread A: lock() done', 'CAS 0→1 succeeded — ~20 ns', 'owned'),
          costB('thread B: —', 'not called yet'),
          mutexCell('locked (A)', 'owned'),
          ...lanes(),
          srcBox('srcA', A_X, 'owned'),
          srcBox('srcB', B_X),
          opBox('opA', A_X, 'CAS mu_: 0 → locked', 'owned'),
        ],
      },
      {
        say: 'A is inside the critical section, doing the one line of real work this function has. B arrives at the same mutex a moment later — its compare-and-swap expects 0 and finds “locked by A”, so B’s fast path fails.',
        mark: ['9-10'],
        shapes: () => [
          costA('thread A: in critical section', 'holding the lock', 'owned'),
          costB('thread B: CAS failed', 'mutex already held', 'miss'),
          mutexCell('locked (A)', 'owned'),
          ...lanes(),
          opBox('opA', A_X, 'CAS mu_: 0 → locked', 'owned'),
          critBox('critA', A_X, 'adjust(amount);', 'owned'),
          opBox('opB', B_X, 'CAS mu_: 0 → locked', 'miss'),
        ],
      },
      {
        say: 'The fast path is gone for B. glibc spins a handful of iterations first, in case the lock frees up almost immediately — and when it does not, `lock()` makes a system call.',
        mark: [],
        predict: {
          ask: 'Thread B’s spin gives up and it calls into the kernel. What actually happens to thread B at that point?',
          options: [
            { label: 'It keeps spinning in a tight loop until the lock is free — that is what "blocking" means', correct: false },
            { label: 'It is put in the blocked state and taken off the CPU entirely via a `futex` wait, until it is woken', correct: true },
            { label: 'The OS grants it the lock immediately and boosts thread A’s priority instead', correct: false },
          ],
          because:
            'std::mutex on Linux is a thin wrapper over pthread_mutex, which is built on the `futex` syscall. After a short userspace spin, a still-contended `lock()` calls `futex(FUTEX_WAIT)`, and the kernel literally removes the thread from the run queue — it stops executing, consumes no CPU, and is not considered by the scheduler again until woken. That handoff, not the spin, is where the real cost lives: a context switch out, and later, back in.',
        },
        focus: ['costB', 'opB'],
        shapes: () => [
          costA('thread A: in critical section', 'holding the lock', 'owned'),
          costB('thread B: spinning…', 'a few tries, then a syscall', 'highlight'),
          mutexCell('locked (A)', 'owned'),
          ...lanes(),
          opBox('opA', A_X, 'CAS mu_: 0 → locked', 'owned'),
          critBox('critA', A_X, 'adjust(amount);', 'owned'),
          opBox('opB', B_X, 'CAS mu_: 0 → locked', 'miss'),
          statusTag('spinB', B_X, 'spin: ~40 tries, still locked', 'miss'),
        ],
      },
      {
        say: 'B leaves the CPU. `futex(FUTEX_WAIT)` tells the kernel to mark it blocked on this exact mutex address; the scheduler runs something else entirely — another thread, another process, or the core idles. Thread A has no idea anyone is waiting.',
        mark: [],
        shapes: () => [
          costA('thread A: in critical section', 'holding the lock', 'owned'),
          costB('thread B: BLOCKED', 'off the run queue — futex(WAIT)', 'freed'),
          mutexCell('locked (A)', 'owned'),
          ...lanes(),
          opBox('opA', A_X, 'CAS mu_: 0 → locked', 'owned'),
          critBox('critA', A_X, 'adjust(amount);', 'owned'),
          critBox('critB', B_X, 'parked in the kernel — 0% CPU', 'freed', true),
        ],
      },
      {
        say: 'A finishes and the `lock_guard` destructor calls `unlock()`. Because a waiter is queued, `unlock()` cannot just flip the bit back to 0 — it must also call `futex(FUTEX_WAKE)` so the kernel reconsiders B for scheduling.',
        mark: ['11'],
        shapes: () => [
          costA('thread A: unlock()', 'lock_guard destructor ran', 'owned'),
          costB('thread B: BLOCKED', 'waiting on futex(WAKE)', 'freed'),
          mutexCell('unlocked'),
          ...lanes(),
          critBox('critA', A_X, 'unlocked — scope ended', 'moved', true),
          critBox('critB', B_X, 'parked in the kernel — 0% CPU', 'freed', true),
          Arrow({
            key: 'wake', from: [A_X + ROW_W - 20, CRIT_Y + CRIT_H / 2], to: [B_X + 20, CRIT_Y + CRIT_H / 2],
            shape: 'curve', bend: -40, tone: 'highlight', label: 'futex(WAKE)',
          }),
        ],
      },
      {
        say: 'B is put back on the run queue, waits its turn for a core, and only then retries the same compare-and-swap — which now succeeds. Both threads ran the identical line of code; the cost was set entirely by whether the door was already open.',
        mark: ['9'],
        shapes: () => [
          costA('thread A: lock() ≈ 20 ns', 'uncontended — one CAS', 'owned'),
          costB('thread B: lock() ≈ 1,000–5,000 ns', 'contended — blocked + rescheduled', 'miss'),
          mutexCell('locked (B)', 'owned'),
          ...lanes(),
          opBox('opA', A_X, 'CAS mu_: 0 → locked', 'moved'),
          opBox('opB', B_X, 'CAS mu_: 0 → locked', 'owned'),
          statusTag('woken', B_X, 'woken → rescheduled → retried → success', 'miss'),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'mutex.cpp',
    source: `#include <mutex>
#include <thread>

class Account {
public:
    explicit Account(int balance) : balance_(balance) {}

    void deposit(int amount) {
        std::lock_guard<std::mutex> lock(mu_);   // acquired in the constructor
        adjust(amount);
    }                                             // released in the destructor

    int balance() const {
        std::lock_guard<std::mutex> lock(mu_);
        return balance_;
    }

    void adjust(int amount) { balance_ += amount; }  // caller must already hold mu_
    mutable std::mutex mu_;

private:
    int balance_;
};

// Two mutexes: scoped_lock acquires both atomically, choosing whichever
// order avoids deadlock — so two threads locking A-then-B and B-then-A
// at once can never deadlock each other.
void transfer(Account& from, Account& to, int amount) {
    std::scoped_lock lock(from.mu_, to.mu_);
    from.adjust(-amount);
    to.adjust(amount);
}

int main() {
    Account a(1000), b(1000);
    std::thread t1(transfer, std::ref(a), std::ref(b), 100);
    std::thread t2(transfer, std::ref(b), std::ref(a), 50);
    t1.join();
    t2.join();
    return a.balance() + b.balance();
}`,
    annotations: [
      {
        lines: '9',
        text: 'The constructor call is the whole acquisition: one atomic compare-and-swap on `mu_`’s internal word, done in user space when nobody else holds it.',
      },
      {
        lines: '11',
        text: 'The destructor releases the mutex when `lock` goes out of scope — including on an exception. That is the entire value of RAII here: no path through this function returns without unlocking.',
      },
      {
        lines: '18',
        text: '`adjust()` assumes the caller already holds `mu_`. It exists so `transfer()` can update both balances without trying to re-lock a mutex it is already holding, which would deadlock.',
      },
      {
        lines: '29',
        text: '`std::scoped_lock` takes both mutexes at once using a deadlock-avoidance algorithm — try one, back off, retry — instead of locking them one at a time in a fixed order, which is what actually causes the classic two-thread deadlock.',
      },
    ],
  },

  deeper: [
    'On Linux, `std::mutex` is a thin wrapper over `pthread_mutex_t`, which is built on a single kernel primitive: the futex, short for "fast userspace mutex." The name describes the whole design. An uncontended `lock()` never enters the kernel at all — it is one atomic compare-and-swap on a word in your own address space, typically 15 to 25 nanoseconds. The kernel only gets involved when there is contention, and — this is the part people miss — the uncontended `unlock()` also skips a syscall, because it first checks a bit recording whether anyone is waiting before deciding whether a wake is needed.',
    'When the fast path fails, glibc does not go straight to the kernel. It spins a small, fixed number of iterations first, betting that the holder is about to finish — cheap if it pays off, wasted cycles if it does not. Only after that does it call `futex(FUTEX_WAIT, addr, expected)`, which atomically checks the word is still what it expects and, if so, removes the calling thread from the run queue. The thread is now genuinely not running: it consumes no CPU and is invisible to the scheduler until something calls `futex(FUTEX_WAKE, addr)` on the same address.',
    'The cost of contention is not the syscall itself — a futex call is a few hundred nanoseconds of kernel time. It is everything downstream of being taken off a core: the woken thread has to wait its turn to be scheduled again, which can be immediate or can be milliseconds under load, and once it does run it finds an L1 and L2 cache that have moved on to whatever else was running there. That combination is why contended lock/unlock pairs show up as a wide, unpredictable distribution rather than a fixed penalty — the "microseconds" figure in this lesson is a typical case, not a ceiling.',
    'Lock ordering is the other classic mutex hazard, and it has nothing to do with contention cost. If thread 1 locks A then tries to lock B, while thread 2 locks B then tries to lock A, and both succeed their first lock before either attempts the second, neither can ever proceed — a deadlock, not a slowdown. `std::scoped_lock` (C++17) exists specifically to make this unrepresentable: given multiple mutexes, it acquires them using an algorithm that tries one, backs off and yields if a subsequent one is unavailable, and retries, so the actual acquisition order adapts at runtime instead of being fixed by argument order in the source.',
    'The reason this matters for a hot path specifically: holding a lock, even one held for a handful of instructions, creates a window in which any other thread that wants it pays the full contended cost — not proportional to how long you held it, but a roughly fixed penalty for the block-and-wake round trip. That is why low-latency systems treat "shrink the critical section" as close to a hard rule, and why the systems that cannot tolerate the tail at all reach for lock-free structures — atomics, single-producer/single-consumer ring buffers — instead of a mutex, no matter how short the section looks.',
  ],

  gotchas: [
    'A `std::mutex` is not recursive. Locking it a second time on the same thread — even indirectly, by calling a locking function from inside an already-locked section — is undefined behaviour, and in practice a self-deadlock: the thread waits forever for a lock it is already holding.',
    'Nesting two `lock_guard`s in a fixed order across two mutexes is the classic ABBA deadlock the instant another thread locks them in the opposite order. `std::scoped_lock` with both mutexes in one call removes the ordering question rather than trusting every call site to get it right.',
    'Holding a lock across a system call, I/O, logging, or another lock acquisition massively widens the window in which someone else pays the contended-path cost. The fix is always to shrink the critical section, not to add more locking around the problem.',
    'A contention benchmark run on an otherwise-idle machine understates the real cost, because rescheduling a woken thread is fast when nothing else wants the core. Measure under the CPU pressure the production system actually runs under.',
    '`std::atomic` is not automatically the faster answer to everything a mutex protects. For a single word, yes — for several related values that must change together, a mutex is often simpler and no slower, because the expensive part of a mutex is contention, not the acquire/release pair itself.',
  ],

  interview: {
    q: 'Two threads call the same mutex-protected function. One takes 20 nanoseconds, the other takes 2 microseconds. Same code, same mutex — why the hundred-fold difference, and what would you actually check?',
    a: [
      'The fast thread found the mutex unlocked, so `lock()` succeeded on a single userspace compare-and-swap — no system call at all. The slow thread found it already held, so after a short spin it called into the kernel via `futex(FUTEX_WAIT)`, which blocks the thread — takes it off the run queue entirely — until the holder calls `unlock()` and wakes it with `futex(FUTEX_WAKE)`. The 2 microseconds is not the mutex being slow; it is a full round trip through the scheduler: block, sleep, wake, get rescheduled, warm the cache back up.',
      'What I would check before changing anything: `perf stat -e context-switches` and `strace -c -f` for futex calls, to confirm contention is actually happening rather than assuming it from a slow trace. If it is, I would look at how long the critical section runs and whether it does anything avoidable while holding the lock — an allocation, a log line, a second lock acquisition — because shrinking the critical section directly shrinks the window in which a second thread can arrive and pay this cost.',
      'The detail that separates a memorised answer from an understood one is the asymmetry being deliberate. `std::mutex` on Linux only touches the kernel when there is contention, in both directions — an uncontended `unlock()` also skips the wake syscall, because it checks whether anyone is waiting first. That is what "futex" (fast userspace mutex) means, and it is why a correctly-used mutex is close to free until two threads actually collide on it.',
    ],
  },

  exercise: [
    'Build a microbenchmark: one run where a single thread locks and unlocks a mutex a million times uncontended, and a second run where two threads hammer the same mutex concurrently. Print the p50, p99, and max latency per `lock()` call using `std::chrono::steady_clock`, and watch the p99 jump by two to three orders of magnitude between the runs. Compile with `g++ -O2 -pthread`.',
    'Then run the contended version under `strace -c -f` and count the `futex` calls, and under `perf stat -e context-switches` to see how many times the OS actually moved a thread off and back onto a core. Correlate that count against your measured p99 — it is the mechanism you just read about, not a coincidence.',
  ],
};
