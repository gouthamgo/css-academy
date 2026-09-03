import { Region, Frame, Box, Cell, Arrow, Text, Tag } from '../../viz/primitives.js';

/* ------------------------------------------------------------------
   Layout constants. One process box; a shared column on the left;
   two thread lanes on the right. Everything a thread OWNS is drawn
   inside its lane; everything it SHARES is drawn outside all lanes.
   ------------------------------------------------------------------ */
const PROC = { x: 26, y: 30, w: 676, h: 322 };
const SHARED = { x: 40, y: 58, w: 196, h: 282 };
const LANE1 = { x: 254, y: 58, w: 210, h: 282 };
const LANE2 = { x: 478, y: 58, w: 210, h: 282 };

/* The process shell and everything inside it that all threads can reach.
   `counter` is a parameter because its value is the thing that changes. */
const shell = (counterValue, counterTone = 'neutral') => [
  Region({
    key: 'proc',
    x: PROC.x,
    y: PROC.y,
    w: PROC.w,
    h: PROC.h,
    label: 'PROCESS — ONE ADDRESS SPACE',
  }),
  Region({
    key: 'shared',
    x: SHARED.x,
    y: SHARED.y,
    w: SHARED.w,
    h: SHARED.h,
    label: 'SHARED BY EVERY THREAD',
    tone: 'heap',
  }),
  Text({
    key: 'globalsLabel',
    x: SHARED.x + SHARED.w / 2,
    y: 84,
    text: 'globals / statics',
    size: 10,
    anchor: 'middle',
    mono: true,
    opacity: 0.6,
  }),
  Cell({
    key: 'counter',
    x: 76,
    y: 100,
    w: 124,
    h: 44,
    name: 'counter',
    value: counterValue,
    tone: counterTone,
  }),
  Box({
    key: 'heap',
    x: 52,
    y: 170,
    w: 172,
    h: 66,
    label: 'THE HEAP',
    sub: 'new Order[…]',
    tone: 'heap',
    labelSize: 12,
  }),
  Box({
    key: 'fds',
    x: 52,
    y: 256,
    w: 172,
    h: 64,
    label: 'file descriptors',
    sub: 'sockets, stdout',
    labelSize: 12,
  }),
];

/* One thread lane: a private stack frame, a private register file, and a
   tag showing what that thread currently reads out of the global. */
const lane = ({ key, box, title, tone, local, sees, seesTone }) => [
  Region({
    key,
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h,
    label: title,
    tone,
  }),
  Frame({
    key: `${key}.stack`,
    x: box.x + 14,
    y: 88,
    w: 182,
    label: 'stack (private)',
    tone: 'stack',
    vars: [{ name: 'local', value: local }],
  }),
  Box({
    key: `${key}.regs`,
    x: box.x + 14,
    y: 170,
    w: 182,
    h: 64,
    label: 'registers (private)',
    sub: 'rsp  rip  rax …',
    labelSize: 11,
    tone: 'stack',
  }),
  Tag({
    key: `${key}.sees`,
    x: box.x + 14,
    y: 252,
    w: 182,
    text: sees,
    tone: seesTone ?? 'neutral',
  }),
];

export default {
  oneLiner:
    'What a thread really is, what it shares with its siblings, and the small part it keeps to itself.',

  whyJob:
    'Every concurrency interview starts from one question: which memory is shared. A candidate who cannot say precisely what two threads share cannot reason about the race that comes next, and the interviewer finds that out in about ninety seconds.',

  mentalModel:
    'A process is a workshop: one set of shelves, one set of tools, one door to the street. A thread is *a worker in that workshop*. Hire a second worker and they share every shelf — the heap, the globals, the open sockets — but each gets *their own bench and their own hands*: a private stack and a private set of CPU registers. Nearly every threading bug is two workers reaching for the same shelf at the same moment.',

  scene: {
    id: 'threads-share',
    title: 'One process, two threads, and the line between shared and private',
    width: 720,
    height: 400,
    legend: [
      { tone: 'heap', label: 'shared by all threads' },
      { tone: 'stack', label: 'private to one thread' },
      { tone: 'freed', label: 'dangerous across threads' },
    ],
    steps: [
      {
        say: 'A process is an address space plus the resources the operating system gave it. Right now one thread runs inside it — the one that entered main(). It has a stack and a register set of its own, and it can reach everything in the shared column.',
        mark: ['12'],
        shapes: () => [
          ...shell('0'),
          ...lane({
            key: 'lane1',
            box: LANE1,
            title: 'THREAD 1 — main()',
            tone: 'stack',
            local: '0',
            sees: 'reads counter → 0',
          }),
        ],
      },
      {
        say: 'std::thread t1 asks the kernel for a second thread. The kernel does not copy the address space — it makes a new stack and a new register set and points them at the same memory. That is the whole difference between a thread and a process.',
        mark: ['13-14'],
        focus: ['lane2', 'lane2.stack', 'lane2.regs', 'lane2.sees', 'shared'],
        shapes: () => [
          ...shell('0'),
          ...lane({
            key: 'lane1',
            box: LANE1,
            title: 'THREAD 1 — main()',
            tone: 'stack',
            local: '0',
            sees: 'reads counter → 0',
          }),
          ...lane({
            key: 'lane2',
            box: LANE2,
            title: 'THREAD 2 — worker()',
            tone: 'stack',
            local: '0',
            sees: 'reads counter → 0',
          }),
        ],
      },
      {
        say: 'Thread 1 writes to the global. There is exactly one `counter` object in the whole program, so there is nothing to synchronise or copy — the write lands, and the other thread is now looking at different bytes than it was a moment ago.',
        mark: ['8'],
        focus: ['counter', 'lane1.sees', 'lane2.sees', 'shared', 'globalsLabel'],
        shapes: () => [
          ...shell('1', 'owned'),
          ...lane({
            key: 'lane1',
            box: LANE1,
            title: 'THREAD 1 — main()',
            tone: 'stack',
            local: '0',
            sees: 'reads counter → 1',
            seesTone: 'owned',
          }),
          ...lane({
            key: 'lane2',
            box: LANE2,
            title: 'THREAD 2 — worker()',
            tone: 'stack',
            local: '0',
            sees: 'reads counter → 1',
            seesTone: 'owned',
          }),
          Arrow({
            key: 'write1',
            from: [266, 118],
            to: [206, 122],
            shape: 'curve',
            bend: 18,
            tone: 'owned',
            label: 'counter += 1',
          }),
        ],
      },
      {
        say: 'Now thread 1 writes to `local`. Both threads are running the same function, so both have a variable spelled `local` — but they are two different objects at two different addresses, roughly eight megabytes apart. Thread 2 does not see this change because there is nothing to see.',
        mark: ['7'],
        focus: ['lane1.stack', 'lane2.stack', 'lane1', 'lane2'],
        shapes: () => [
          ...shell('1', 'owned'),
          ...lane({
            key: 'lane1',
            box: LANE1,
            title: 'THREAD 1 — main()',
            tone: 'stack',
            local: '7',
            sees: 'reads counter → 1',
            seesTone: 'owned',
          }),
          ...lane({
            key: 'lane2',
            box: LANE2,
            title: 'THREAD 2 — worker()',
            tone: 'stack',
            local: '0',
            sees: 'reads counter → 1',
            seesTone: 'owned',
          }),
        ],
      },
      {
        say: 'Private is a convention, not a wall. The stacks sit in the same address space — the hardware has no idea one belongs to thread 1. Hand thread 2 the address and it can read and write thread 1’s local happily, right up until that frame is popped.',
        predict: {
          ask: 'Thread 1 takes `&local` and passes it to thread 2. What stops thread 2 from writing through it?',
          options: [
            { label: 'The MMU faults — each thread has its own page table', correct: false },
            { label: 'Nothing stops it; it is the same address space', correct: true },
            { label: 'The write succeeds but only thread 2 sees it', correct: false },
          ],
          because:
            'Threads differ from processes precisely in that they do not get separate page tables. A stack is private only because nobody else usually knows its address. This is also exactly how a detached thread ends up writing into a frame that no longer exists.',
        },
        focus: ['lane1.stack', 'lane2.stack', 'ptr'],
        shapes: () => [
          ...shell('1', 'owned'),
          ...lane({
            key: 'lane1',
            box: LANE1,
            title: 'THREAD 1 — main()',
            tone: 'stack',
            local: '7',
            sees: 'reads counter → 1',
            seesTone: 'owned',
          }),
          ...lane({
            key: 'lane2',
            box: LANE2,
            title: 'THREAD 2 — worker()',
            tone: 'stack',
            local: '0',
            sees: 'reads counter → 1',
            seesTone: 'owned',
          }),
          Arrow({
            key: 'ptr',
            from: [560, 128],
            to: [454, 112],
            shape: 'curve',
            bend: -22,
            tone: 'freed',
            dashed: true,
            label: '&local',
          }),
        ],
      },
      {
        say: 'join() blocks until thread 2 finishes, then reclaims its stack. Everything in the shared column survives; everything in the lane is gone. Skip the join and the std::thread destructor calls std::terminate — the language would rather kill the program than let you guess.',
        mark: ['16-17'],
        focus: ['lane2', 'lane2.gone', 'lane2.sees', 'shared', 'counter'],
        shapes: () => [
          ...shell('2', 'owned'),
          ...lane({
            key: 'lane1',
            box: LANE1,
            title: 'THREAD 1 — main()',
            tone: 'stack',
            local: '7',
            sees: 'reads counter → 2',
            seesTone: 'owned',
          }),
          Region({
            key: 'lane2',
            x: LANE2.x,
            y: LANE2.y,
            w: LANE2.w,
            h: LANE2.h,
            label: 'THREAD 2 — JOINED',
            tone: 'moved',
          }),
          Box({
            key: 'lane2.gone',
            x: LANE2.x + 14,
            y: 88,
            w: 182,
            h: 146,
            label: 'stack + registers reclaimed',
            labelSize: 11,
            mono: true,
            tone: 'moved',
            dashed: true,
          }),
          Tag({
            key: 'lane2.sees',
            x: LANE2.x + 14,
            y: 252,
            w: 182,
            text: 'its writes are still visible',
            tone: 'owned',
          }),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'threads.cpp',
    source: `#include <cstdio>
#include <thread>

int shared_counter = 0;      // one object, every thread sees it

void worker(int id) {
    int local = id;          // one object PER THREAD, on its own stack
    shared_counter += 1;     // one object TOTAL - and a data race
    printf("thread %d local=%d\\n", id, local);
}

int main() {
    std::thread t1(worker, 1);
    std::thread t2(worker, 2);

    t1.join();               // block until it finishes
    t2.join();               // forget this and ~thread() terminates

    printf("counter=%d\\n", shared_counter);

    {                        // C++20: joins in its own destructor
        std::jthread t3(worker, 3);
    }                        // <- the join happens right here

    return 0;
}`,
    annotations: [
      {
        lines: '7',
        text: 'Every thread running `worker` gets its **own** `local`. Same name in the source, different address at runtime.',
      },
      {
        lines: '8',
        text: 'One object, two writers, no synchronisation. This line is a data race and therefore undefined behaviour — the next lesson takes it apart.',
      },
      {
        lines: '16-17',
        text: '`join()` is not politeness, it is a requirement. A `std::thread` destroyed while still joinable calls `std::terminate` immediately.',
      },
      {
        lines: '20-22',
        text: '`std::jthread` joins in its destructor and carries a `stop_token`. Prefer it — it removes an entire class of bug.',
      },
    ],
  },

  deeper: [
    'On Linux there is no separate "thread" object in the kernel. `std::thread` calls `pthread_create`, which calls `clone(2)` with `CLONE_VM | CLONE_FILES | CLONE_FS | CLONE_SIGHAND`. Those flags say "share the address space, share the file descriptor table, share the signal handlers". A `fork()` is the same call without them. The scheduler treats the result as an ordinary schedulable task, which is why `ps -eLf` shows threads next to processes.',
    'The private part is small: a stack, a register set (including the stack pointer and instruction pointer), the thread-local storage block reached through the `fs` segment base on x86-64, and an errno. Everything else — code, globals, the heap, mapped files, sockets — is one copy shared by all of them. `thread_local` variables live in that TLS block, which is why they are the cheap way to give each thread a scratch buffer.',
    'Creating a thread is not free. The kernel maps a fresh stack — 8 MB of virtual address space on Linux by default, committed lazily a page at a time — sets up the TLS block, and adds a task to the run queue. Measured end to end that is roughly 10–30 microseconds. In a hot path that is an eternity, which is why trading systems create a fixed pool of threads at startup, pin each one to a core, and never create another.',
    'A context switch between two threads of the same process is cheaper than between processes — no page table swap, so the TLB survives — but it is still on the order of 1–3 microseconds once you count the cold L1 and L2 the woken thread finds. Running more threads than you have cores does not make anything faster; it makes the scheduler shuffle work between caches. `std::thread::hardware_concurrency()` is the number to size a pool against.',
    'Detaching is almost always the wrong answer. `t.detach()` severs the handle and lets the thread run on unsupervised, which means there is no moment at which you know it has stopped touching your data. If the object it captured lives on a stack frame that returns, you have a use-after-free with no stack trace pointing at the guilty line. Prefer `jthread`, or a pool that outlives everything it touches.',
  ],

  gotchas: [
    'A `std::thread` destroyed while still joinable calls `std::terminate` — not an exception, not a leak, an immediate abort. Any early return or thrown exception between construction and `join()` kills the process. `std::jthread` exists to close this hole.',
    '`std::thread t(f, x)` copies `x`. If `f` takes a reference, you get a compile error or a reference to the copy — wrap it in `std::ref(x)` deliberately, and then make sure `x` outlives the thread.',
    'A lambda capturing by reference (`[&]`) and handed to a thread is the classic dangling capture. The launching function returns, its frame is reused, and the thread writes into whatever now lives there.',
    'Threads are not free and not fast to start. Spawning one per work item is a common benchmark mistake that hides the real cost of the work you were trying to measure.',
    '`thread_local` at namespace scope is initialised lazily on first use in each thread, and destroyed at thread exit. Putting an expensive object there quietly adds that cost to every thread you create.',
  ],

  interview: {
    q: 'Two threads in the same process. Tell me exactly what they share and what they do not — and what happens if a `std::thread` object goes out of scope while the thread is still running.',
    a: [
      'They share the entire address space: the code, the globals and statics, the heap, memory-mapped files, and the file descriptor table. Any pointer valid in one thread is valid in the other, because there is a single page table. What each thread gets privately is a stack, a register set including `rsp` and `rip`, a thread-local storage block, and its own `errno`. That is essentially the whole list.',
      'The detail worth adding is that "private stack" is a convention rather than a protection. Nothing in the hardware marks those pages as belonging to one thread — if thread A hands thread B the address of one of its locals, thread B can read and write it. That is precisely how detached-thread bugs happen: the launching frame returns, the stack region is reused by the next call, and the still-running thread writes into a stranger’s locals.',
      'On the destructor question: `~thread()` checks `joinable()` and calls `std::terminate` if it is still true. The rationale is that neither alternative is safe — implicitly joining would silently block in a destructor, and implicitly detaching would leave a thread pointing at objects that are about to be destroyed. The committee chose to make the mistake loud. In modern code you avoid the whole question by using `std::jthread`, which joins in its destructor and also gives you a `stop_token` so the thread can be asked to finish rather than merely waited on.',
    ],
  },

  exercise: [
    'Write a program that starts four threads, each printing the address of a local variable and the address of a shared global. Run it a few times. The global address is identical everywhere; the stack addresses differ by megabytes, which is the eight-megabyte default stack size showing itself. Now add a `thread_local int` and print its address too — one per thread, like the stack, but it survives across function calls.',
    'Then measure what a thread costs. Time a loop that creates and joins ten thousand threads with `std::chrono::steady_clock`, and divide. You should land somewhere around 10–30 microseconds each. Compare that with the time to push one item onto a queue, and you will understand why every low-latency system pins a fixed set of threads at startup and never creates another one.',
  ],
};
