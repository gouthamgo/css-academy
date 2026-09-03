import { Region, Box, Cell, Frame, Arrow, Bracket, Text, Tag } from '../../viz/primitives.js';

/* Two lanes for the move-into-closure and channel acts; a stacked
   parent/scope pair for the scoped-threads act. Region keys r.a / r.b
   are reused across the first two acts — same box on screen, new
   meaning — because it reads as one continuous "left thread / right
   thread" stage rather than three unrelated diagrams. */
const LANE_A = { x: 20, y: 66, w: 290, h: 296 };
const LANE_B = { x: 410, y: 66, w: 290, h: 296 };

const lanes = (labelA, labelB) => [
  Region({ key: 'r.a', ...LANE_A, label: labelA, tone: 'stack' }),
  Region({ key: 'r.b', ...LANE_B, label: labelB, tone: 'stack' }),
];

const wall = () => [
  Box({ key: 'wall', x: 352, y: 60, w: 16, h: 308, tone: 'freed', dashed: true }),
  Text({
    key: 'wall.lbl', x: 360, y: 46, text: 'thread boundary', size: 10, mono: true,
    anchor: 'middle', tone: 'freed', weight: 700,
  }),
];

export default {
  oneLiner:
    'How to hand data to a spawned thread without a lock — `move` transfers ownership, and channels make that transfer the whole communication protocol.',

  whyJob:
    'Interviewers use this to check that "Rust prevents data races" is not magic to you: the actual mechanism is that `thread::spawn` and channels force ownership itself to move, so there is nothing left for two threads to race over.',

  mentalModel:
    'Handing a value to `thread::spawn` is *posting a letter*, not lending a book — the closure has to own everything inside it, because it may still be running long after the function that launched it has returned and its stack is gone. A channel keeps that same rule at runtime: `send` posts the letter into a queue, so there is never a moment where two threads both hold it, and *no shared mutable state means no race to prevent*.',

  scene: {
    id: 'threads-and-channels',
    title: 'Ownership crossing a thread boundary',
    width: 720,
    height: 420,
    legend: [
      { tone: 'owned', label: 'owns it now' },
      { tone: 'moved', label: 'moved-from, unusable' },
      { tone: 'borrowed', label: 'borrowed, not owned' },
    ],
    steps: [
      {
        say: '`thread::spawn` needs a closure that owns everything it captures, because the spawned thread might outlive the stack frame that created it. A plain borrow of a local cannot promise that — so the closure has to take `data` by value.',
        mark: ['6', '7'],
        shapes: () => [
          ...lanes('MAIN THREAD', 'SPAWNED THREAD'),
          ...wall(),
          Frame({
            key: 'main.frame', x: 44, y: 110, w: 220, label: 'main()', tone: 'stack',
            vars: [{ name: 'data', value: '"42 orders filled"', tone: 'owned' }],
          }),
          Box({
            key: 'closure.ghost', x: 434, y: 110, w: 220, h: 64, label: 'closure',
            sub: 'not started', tone: 'neutral', dashed: true,
          }),
        ],
      },
      {
        say: 'The `move` keyword is what makes this legal: the closure\'s environment gets its own copy of the three-word `String` header, and `data` in `main` has nothing left to hand out a second time. Without `move`, this would try to borrow `data` and fail to compile — the borrow could not be proven to outlive the thread.',
        mark: ['7', '8', '9'],
        focus: ['main.frame', 'worker.frame', 'a.move', 'tag.moved'],
        shapes: () => [
          ...lanes('MAIN THREAD', 'SPAWNED THREAD'),
          ...wall(),
          Frame({
            key: 'main.frame', x: 44, y: 110, w: 220, label: 'main()', tone: 'moved', dashed: true,
            vars: [{ name: 'data', value: '—', tone: 'moved' }],
          }),
          Frame({
            key: 'worker.frame', x: 434, y: 110, w: 220, label: 'spawned closure', tone: 'owned',
            vars: [{ name: 'data', value: '"42 orders filled"', tone: 'owned' }],
          }),
          Arrow({
            key: 'a.move', from: [264, 142], to: [434, 142], shape: 'straight', bend: 0,
            tone: 'owned', label: 'move',
          }),
          Tag({ key: 'tag.moved', x: 44, y: 184, text: 'moved — unusable here', tone: 'moved' }),
        ],
      },
      {
        say: '`mpsc::channel()` creates one queue with two ends: `tx` to send, `rx` to receive. Both endpoints can cross a `move` closure boundary the same way `data` just did — the queue itself lives on the heap, reachable from either thread.',
        mark: ['13'],
        shapes: () => [
          ...lanes('SENDER THREAD', 'MAIN THREAD — receiver'),
          Box({ key: 'chan', x: 322, y: 150, w: 76, h: 120, label: 'channel', sub: 'empty queue', tone: 'heap' }),
          Frame({
            key: 'sender.frame', x: 44, y: 150, w: 220, label: 'sender closure', tone: 'stack',
            vars: [{ name: 'tx', value: 'Sender<String>', tone: 'neutral' }],
          }),
          Frame({
            key: 'recv.frame', x: 434, y: 150, w: 220, label: 'main()', tone: 'stack',
            vars: [{ name: 'rx', value: 'Receiver<String>', tone: 'neutral' }],
          }),
        ],
      },
      {
        say: '`tx.send(msg)` takes `msg` by value — exactly the same move as handing a value into a closure, just landing in a queue instead of an environment.',
        mark: ['15', '16', '17'],
        predict: {
          ask: 'After `tx.send(msg)` returns, can the sender thread still use `msg`?',
          options: [
            { label: 'Yes — send() only copies a reference into the channel', correct: false },
            { label: 'No — send() takes msg by value, so ownership moved into the channel', correct: true },
            { label: 'Only until the receiver actually calls recv()', correct: false },
          ],
          because:
            '`Sender<T>::send` is `fn send(&self, t: T) -> Result<(), SendError<T>>` — `T` by value, not by reference. The compiler treats the call exactly like any other move: `msg` is gone from the sender the instant the call is made, whether or not anyone has received it yet. That is the whole trick — the channel is not a shared buffer two threads both peek into, it is a relay for ownership itself.',
          },
        focus: ['sender.frame', 'chan', 'item', 'a.send', 'tag.dead'],
        shapes: () => [
          ...lanes('SENDER THREAD', 'MAIN THREAD — receiver'),
          Box({ key: 'chan', x: 322, y: 150, w: 76, h: 120, label: 'channel', sub: 'msg queued', tone: 'owned' }),
          Cell({ key: 'item', x: 328, y: 172, w: 64, h: 40, value: 'msg', tone: 'owned' }),
          Frame({
            key: 'sender.frame', x: 44, y: 150, w: 220, label: 'sender closure', tone: 'moved', dashed: true,
            vars: [{ name: 'msg', value: '—', tone: 'moved' }],
          }),
          Frame({
            key: 'recv.frame', x: 434, y: 150, w: 220, label: 'main()', tone: 'stack',
            vars: [{ name: 'rx', value: 'Receiver<String>', tone: 'neutral' }],
          }),
          Arrow({
            key: 'a.send', from: [264, 190], to: [322, 190], shape: 'straight', bend: 0,
            tone: 'owned', label: 'send() moves it',
          }),
          Tag({ key: 'tag.dead', x: 44, y: 224, text: 'msg is gone here', tone: 'moved' }),
        ],
      },
      {
        say: '`rx.recv()` blocks until an item is queued, then hands ownership out the other side. There is no window where sender and receiver both hold `msg` — one owner, the whole time, same as any other move.',
        mark: ['19', '20'],
        shapes: () => [
          ...lanes('SENDER THREAD', 'MAIN THREAD — receiver'),
          Box({ key: 'chan', x: 322, y: 150, w: 76, h: 120, label: 'channel', sub: 'empty again', tone: 'heap' }),
          Frame({
            key: 'sender.frame', x: 44, y: 150, w: 220, label: 'sender closure', tone: 'moved', dashed: true,
            vars: [{ name: 'msg', value: '—', tone: 'moved' }],
          }),
          Frame({
            key: 'recv.frame', x: 434, y: 150, w: 220, label: 'main()', tone: 'owned',
            vars: [{ name: 'received', value: '"fill: 100 @ 101.25"', tone: 'owned' }],
          }),
          Arrow({
            key: 'a.recv', from: [398, 190], to: [434, 190], shape: 'straight', bend: 0,
            tone: 'owned', label: 'recv() moves it out',
          }),
        ],
      },
      {
        say: '`thread::scope` is different: it hands the closure a `Scope`, and threads spawned through it may *borrow* from the enclosing stack frame — `&orders` — because the API can prove, at compile time, that every spawned thread finishes before the scope itself returns.',
        mark: ['24', '25', '26'],
        shapes: () => [
          Region({ key: 'r.parent', x: 20, y: 50, w: 680, h: 96, label: "main() — owns `orders`", tone: 'stack' }),
          Box({ key: 'orders', x: 44, y: 82, w: 200, h: 50, label: 'orders: Vec<i32>', sub: '[1, 2, 3]', tone: 'owned' }),
          Region({ key: 'r.scope', x: 20, y: 166, w: 680, h: 200, label: 'thread::scope(|s| { ... })', tone: 'heap' }),
          Frame({
            key: 'child', x: 280, y: 206, w: 220, label: 's.spawn(|| ...)', tone: 'borrowed',
            vars: [{ name: 'orders', value: '&Vec<i32>', tone: 'borrowed' }],
          }),
          Arrow({
            key: 'a.borrow', from: [144, 132], to: [300, 206], shape: 'curve', bend: 30,
            tone: 'borrowed', dashed: true, label: '&orders',
          }),
        ],
      },
      {
        say: 'Reaching the closing brace does not just return — `scope` blocks there until every thread it spawned has finished, an implicit join built into the API rather than something you have to remember. Only after that barrier does control return to `main`, so the borrow can never outlive `orders`.',
        mark: ['27', '28', '29'],
        focus: ['r.scope', 'child', 'barrier'],
        shapes: () => [
          Region({ key: 'r.parent', x: 20, y: 50, w: 680, h: 96, label: "main() — owns `orders`", tone: 'stack' }),
          Box({ key: 'orders', x: 44, y: 82, w: 200, h: 50, label: 'orders: Vec<i32>', sub: '[1, 2, 3]', tone: 'owned' }),
          Region({ key: 'r.scope', x: 20, y: 166, w: 680, h: 200, label: 'thread::scope — joined', tone: 'moved' }),
          Frame({
            key: 'child', x: 280, y: 206, w: 220, label: 's.spawn — finished', tone: 'moved', dashed: true,
            vars: [{ name: 'orders', value: 'sum = 6', tone: 'moved' }],
          }),
          Bracket({ key: 'barrier', x: 280, y: 282, w: 220, label: 'join barrier — borrow ends here', tone: 'highlight' }),
        ],
      },
    ],
  },

  code: {
    lang: 'rust',
    filename: 'main.rs',
    source: `use std::sync::mpsc;
use std::thread;

fn main() {
    // 1. \`move\` hands the closure ownership of \`data\`
    let data = String::from("42 orders filled");
    let handle = thread::spawn(move || {
        println!("worker sees: {data}");
    });
    handle.join().unwrap();

    // 2. channels: send() MOVES the value into the queue
    let (tx, rx) = mpsc::channel::<String>();
    let sender = thread::spawn(move || {
        let msg = String::from("fill: 100 @ 101.25");
        tx.send(msg).unwrap();
        // println!("{msg}");   // error[E0382]: value moved
    });
    let received = rx.recv().unwrap();
    println!("main got: {received}");
    sender.join().unwrap();

    // 3. scoped threads: borrow the parent stack safely
    let orders = vec![1, 2, 3];
    thread::scope(|s| {
        s.spawn(|| {
            println!("sum = {}", orders.iter().sum::<i32>());
        });
    }); // every spawned thread is joined here, before \`orders\` drops
}`,
    annotations: [
      {
        lines: '7-9',
        text: '`move` is required, not optional: without it the closure would try to borrow `data`, and `thread::spawn`\'s `F: Send + \'static` bound rejects any capture that cannot outlive the current stack frame.',
      },
      {
        lines: '13, 16',
        text: '`send` takes `T` by value. The value is gone from the sending thread the moment the call returns — this is the same move semantics as passing an argument, just crossing into a queue.',
      },
      {
        lines: '17',
        text: 'Uncomment this and it fails to compile with the same "borrow of moved value" error `let t = s;` produces — a channel send is ownership transfer, not a copy into shared storage.',
      },
      {
        lines: '24-29',
        text: '`thread::scope` blocks at its closing brace until every `s.spawn`ed thread has finished. That guarantee is what lets the borrow checker allow `&orders` to cross into the closure at all.',
      },
    ],
  },

  deeper: [
    '`thread::spawn`\'s real signature is `fn spawn<F, T>(f: F) -> JoinHandle<T> where F: FnOnce() -> T + Send + \'static`. The `\'static` bound is the part people trip over: it does not mean "lives forever", it means "contains no borrows of anything shorter-lived than the whole program." A `move` closure that owns a `String` satisfies it trivially, because an owned `String` has no lifetime parameter to bound. A closure that captured `&data` would need `data` itself to be `\'static`, which a stack local almost never is — hence the compile error, and hence `move` being almost always required.',
    '`JoinHandle<T>` is the return value of `spawn`, and it is the only way to get `T` back out or to observe a panic. Unlike C++\'s `std::thread`, dropping a `JoinHandle` without calling `.join()` is not an error — the thread simply detaches and keeps running unsupervised. `.join()` returns `Result<T, Box<dyn Any + Send>>`; the `Err` case is exactly what happens if the spawned closure panicked, and it is why production code almost always matches on the join result rather than blindly unwrapping.',
    'A channel send does not just look like a move syntactically — it is one, all the way down. `mpsc::Sender<T>::send` is `fn send(&self, t: T) -> Result<(), SendError<T>>`; `t` is consumed by value. If the channel has been disconnected (every `Receiver` dropped), the value is not silently lost — it comes back to you inside the `Err`, so a failed send never leaks or destroys data you might have wanted to recover. `mpsc` stands for multi-producer, single-consumer: `Sender` implements `Clone` so many threads can hold their own handle, but `Receiver` does not, because only one thread is meant to be dequeuing.',
    '`thread::scope` (stable since Rust 1.63) is implemented with a lifetime trick rather than magic: the closure receives a `Scope<\'scope, \'env>`, and `s.spawn`\'s bound requires captures to outlive `\'scope`, while `\'scope` itself is tied to the block the compiler can see ends with an implicit join. That is enough for the borrow checker to accept `&orders` in the spawned closure — it can prove the borrow cannot outlive the data, the same proof `\'static` gives `thread::spawn`, just scoped tighter.',
    'The throughline across all three mechanisms — move closures, channel sends, scoped borrows — is that Rust never needs runtime synchronization to prevent a data race on the handed-off value, because there is only ever one owner able to reach it at any given moment. A mutex exists to serialize *concurrent* access to something two threads both hold; a move avoids the problem entirely by making sure two threads never both hold it in the first place.',
  ],

  gotchas: [
    'If you need `data` in the spawning thread *after* the `thread::spawn` call, `move` has already taken it — the fix is `data.clone()` before spawning, or restructuring so the last use in the parent happens first, exactly like any other move.',
    'Dropping a `JoinHandle` without calling `.join()` does not panic or terminate, unlike a joinable `std::thread` destructor in C++. The thread just keeps running detached. Tests that spawn a thread and forget to join it are a common source of flaky output that appears to finish "by luck".',
    'A `Receiver::recv()` call blocks until either a value arrives or every `Sender` has been dropped, at which point it returns `Err`. Keeping an unused `Sender` clone alive somewhere — in a struct field, a stray closure capture — silently prevents that `Err` from ever firing, and the receiving thread hangs forever waiting for a send that will never come.',
    '`mpsc::Sender` is cloneable for multiple producers, but `mpsc::Receiver` is not — only one thread may consume. Reaching for multiple consumers means restructuring around a single dispatcher, or a different crate (`crossbeam-channel` supports multi-consumer) — do not fight the type system by wrapping `Receiver` in `Arc<Mutex<_>>` without first asking whether a single consumer would do.',
    'A panic inside a `thread::scope`-spawned closure is not silently swallowed: the panic propagates when the scope\'s implicit join runs, so the enclosing `thread::scope(...)` call itself panics. Code that assumed scoped threads "just work" is often surprised the first time one of them fails.',
  ],

  interview: {
    q: 'Why does `thread::spawn` require the closure to be `move` and `\'static`, and how do channels let you avoid wrapping shared data in `Arc<Mutex<T>>`?',
    a: [
      '`thread::spawn`\'s bound is `F: FnOnce() -> T + Send + \'static`. The `\'static` part exists because the spawned thread\'s lifetime is not tied to the caller\'s stack frame at all — the function that called `spawn` might return and its locals might be gone long before the thread finishes. A closure that only borrowed a local could not honour that, so the compiler requires the closure to own everything it touches, which in practice means writing `move` so captures are taken by value instead of by reference.',
      'Channels sidestep synchronization by making ownership itself the message. `Sender::send` takes `T` by value and moves it into the queue; `Receiver::recv` moves it back out on the other side. At no point do two threads hold a live reference to the same value at the same time, so there is nothing for a `Mutex` to protect — the "lock" is really just "only one side of the channel has it right now," enforced by the type system instead of a runtime primitive.',
      'The detail worth adding unprompted: this is a design choice, not a limitation you route around when you can. `Arc<Mutex<T>>` is for state that must genuinely be read and mutated from multiple places over time — a shared counter, a connection pool. A channel is the better fit whenever the real shape of the problem is "produce a value here, consume it there" — a pipeline, not shared state — and reaching for a mutex in that case adds contention and complexity a move-based handoff never needed.',
    ],
  },

  exercise: [
    'Take the `main.rs` above, delete the `move` keyword from the first closure, and read the compiler error on the [Rust Playground](https://play.rust-lang.org). It names the exact `\'static` bound you are violating and suggests `move` itself — notice that the fix the compiler proposes is the fix that actually is correct here.',
    'Then write a second version where the spawning thread keeps a `Sender` clone alive in a `Vec` that never gets dropped, while another thread\'s `Receiver::recv()` waits in a loop for the channel to close. Run it and watch it hang — this is the "forgotten sender clone" gotcha from a stalled terminal rather than a paragraph about it, which is a faster way to remember it.',
    'Finally, measure the cost difference: spawn ten thousand short-lived threads that each send one `usize` back through its own one-shot channel, and time it with `std::time::Instant`, then compare against reusing a fixed pool of four threads pulling work from one shared channel. The pooled version should be dramatically faster — being able to say why (thread creation is 10-30 microseconds; a channel send is nanoseconds) is the point of the exercise.',
  ],
};
