import { Region, Frame, Cells, Arrow, Text, Tag, Box } from '../../viz/primitives.js';

/* Shared geometry so every step agrees where things live. */
const STACK = { x: 46, y: 56, w: 300, h: 300 };
const HEAP = { x: 396, y: 56, w: 278, h: 300 };
const S_Y = 104;
const T_Y = 236;
const FRAME_W = 214;
const FRAME_H = 30 + 3 * 26 + 8; // ptr / len / cap

const regions = () => [
  Region({ key: 'r.stack', ...STACK, label: 'STACK', tone: 'stack' }),
  Region({ key: 'r.heap', ...HEAP, label: 'HEAP', tone: 'heap' }),
];

const heapBytes = (tone = 'heap') =>
  Cells({
    key: 'bytes',
    x: 418,
    y: 168,
    values: ['h', 'e', 'l', 'l', 'o'],
    w: 46,
    h: 42,
    tone,
  });

/* The String itself is only ever three words on the stack. The bytes
   live elsewhere — that split is the whole lesson. */
const triple = (key, y, label, tone, greyed = false) =>
  Frame({
    key,
    x: 70,
    y,
    w: FRAME_W,
    label,
    tone,
    dashed: greyed,
    vars: [
      { name: 'ptr', value: greyed ? '—' : '0x5f2a', tone: greyed ? 'moved' : 'heap' },
      { name: 'len', value: greyed ? '—' : '5', tone: greyed ? 'moved' : 'neutral' },
      { name: 'cap', value: greyed ? '—' : '5', tone: greyed ? 'moved' : 'neutral' },
    ],
  });

const pointsToHeap = (key, y, tone = 'heap', dashed = false) =>
  Arrow({
    key,
    from: [70 + FRAME_W, y + 30 + 8 + 13],
    to: [414, 189],
    shape: 'curve',
    bend: y < 180 ? 26 : -34,
    tone,
    dashed,
  });

export default {
  oneLiner:
    'The one rule that replaces the garbage collector and the manual free, and why the compiler can enforce it.',

  whyJob:
    'Everything else in Rust is downstream of this. An interviewer will not ask you to define ownership — they will hand you code that does not compile and watch whether you can say *why* in one sentence.',

  mentalModel:
    'Think of a library book. Exactly *one* person has it checked out at a time, and when they leave the building it goes back on the shelf automatically. Rust applies that to every piece of heap memory: each value has exactly one *owner*, and when the owner goes out of scope the memory is released — not by a garbage collector deciding later, but at a line the compiler picked in advance.',

  scene: {
    id: 'ownership-move',
    title: 'One value, one owner',
    width: 720,
    height: 400,
    legend: [
      { tone: 'owned', label: 'owns the buffer' },
      { tone: 'heap', label: 'heap allocation' },
      { tone: 'moved', label: 'moved-from, unusable' },
    ],
    steps: [
      {
        say: 'A String is two separate things. Three words on the stack — a pointer, a length, a capacity — and the actual text somewhere on the heap. Almost every confusion about Rust starts with forgetting that split.',
        mark: ['2'],
        shapes: () => [
          ...regions(),
          triple('s', S_Y, 's: String', 'stack'),
          ...heapBytes(),
          pointsToHeap('a.s', S_Y),
        ],
      },
      {
        say: 'The rule: exactly one variable is responsible for that heap buffer. Right now it is `s`. Not "s can see it" — s is on the hook for freeing it.',
        mark: ['2'],
        focus: ['s', 'tag.s', 'a.s'],
        shapes: () => [
          ...regions(),
          triple('s', S_Y, 's: String', 'owned'),
          ...heapBytes(),
          pointsToHeap('a.s', S_Y, 'owned'),
          Tag({ key: 'tag.s', x: 292, y: S_Y + 6, text: 'owner', tone: 'owned' }),
        ],
      },
      {
        say: 'Now `let t = s;`. In most languages this either copies the text or makes a second reference to it. Rust does neither.',
        mark: ['3'],
        predict: {
          ask: 'What does `let t = s;` do with the five bytes on the heap?',
          options: [
            { label: 'Copies them, so there are two buffers', correct: false },
            { label: 'Nothing — only the three stack words are copied, and `s` stops being usable', correct: true },
            { label: 'Makes both `s` and `t` point at the same buffer, and it is freed twice', correct: false },
          ],
          because:
            'The heap bytes are never touched. Rust copies the three-word header to `t` and then marks `s` as moved-from, so there is still exactly one owner and still exactly one free.',
        },
        shapes: () => [
          ...regions(),
          triple('s', S_Y, 's: String', 'owned'),
          ...heapBytes(),
          pointsToHeap('a.s', S_Y, 'owned'),
          Tag({ key: 'tag.s', x: 292, y: S_Y + 6, text: 'owner', tone: 'owned' }),
          Box({
            key: 't.ghost',
            x: 70,
            y: T_Y,
            w: FRAME_W,
            h: FRAME_H,
            label: 't = ?',
            tone: 'neutral',
            dashed: true,
            mono: true,
            labelSize: 12,
          }),
        ],
      },
      {
        say: 'The three stack words are copied to `t`, and the responsibility goes with them. The heap bytes never moved — nothing was allocated, nothing was copied, and this is why a move costs three word-writes rather than a memcpy.',
        mark: ['3'],
        focus: ['t', 'tag.t', 'a.t', 'bytes.0', 'bytes.1', 'bytes.2', 'bytes.3', 'bytes.4'],
        shapes: () => [
          ...regions(),
          triple('s', S_Y, 's: String', 'moved', true),
          triple('t', T_Y, 't: String', 'owned'),
          ...heapBytes(),
          pointsToHeap('a.t', T_Y, 'owned'),
          Tag({ key: 'tag.t', x: 292, y: T_Y + 6, text: 'owner', tone: 'owned' }),
          Tag({ key: 'tag.s', x: 292, y: S_Y + 6, text: 'moved', tone: 'moved' }),
        ],
      },
      {
        say: 'Reach for `s` now and the compiler stops you: "borrow of moved value". This is not a runtime check and it costs nothing — the compiler simply refuses to build a program in which two names could free the same buffer.',
        mark: ['5'],
        focus: ['s', 'tag.s', 'err'],
        shapes: () => [
          ...regions(),
          triple('s', S_Y, 's: String', 'moved', true),
          triple('t', T_Y, 't: String', 'owned'),
          ...heapBytes(),
          pointsToHeap('a.t', T_Y, 'owned'),
          Tag({ key: 'tag.t', x: 292, y: T_Y + 6, text: 'owner', tone: 'owned' }),
          Tag({ key: 'tag.s', x: 292, y: S_Y + 6, text: 'moved', tone: 'moved' }),
          Text({
            key: 'err',
            x: 396,
            y: 300,
            text: 'error[E0382]: borrow of moved value: `s`',
            size: 12,
            mono: true,
            tone: 'freed',
            weight: 650,
          }),
        ],
      },
      {
        say: 'At the closing brace `t` goes out of scope, so `drop` runs and the buffer is released. Exactly once, at a line you can point at in the source. No collector, no `free` call you could forget.',
        mark: ['7'],
        shapes: () => [
          ...regions(),
          triple('s', S_Y, 's: String', 'moved', true),
          triple('t', T_Y, 't: String', 'moved', true),
          ...heapBytes('freed'),
          Tag({ key: 'tag.t', x: 292, y: T_Y + 6, text: 'dropped', tone: 'freed' }),
          Text({
            key: 'freed',
            x: 396,
            y: 300,
            text: 'buffer freed once, at line 7',
            size: 12,
            mono: true,
            tone: 'freed',
            weight: 650,
          }),
        ],
      },
      {
        say: 'The alternative is what C++ does by default: copy the three words and leave both names pointing at one buffer. Both destructors run, the second free hits memory that is already gone, and you have a double free. Ownership is the rule that makes that unrepresentable.',
        mark: [],
        shapes: () => [
          Text({
            key: 'h',
            x: 46,
            y: 40,
            text: 'What the same assignment would do without the rule',
            size: 12,
            mono: true,
            tone: 'freed',
            weight: 650,
          }),
          Region({ key: 'r.stack', ...STACK, y: 66, h: 280, label: 'STACK', tone: 'stack' }),
          Region({ key: 'r.heap', ...HEAP, y: 66, h: 280, label: 'HEAP', tone: 'heap' }),
          triple('s', 110, 's', 'freed'),
          triple('t', 236, 't', 'freed'),
          ...heapBytes('freed'),
          pointsToHeap('a.s', 110, 'freed'),
          pointsToHeap('a.t', 236, 'freed'),
          Tag({ key: 'x1', x: 292, y: 116, text: 'free()', tone: 'freed' }),
          Tag({ key: 'x2', x: 292, y: 242, text: 'free() again', tone: 'freed' }),
          Text({
            key: 'boom',
            x: 534,
            y: 296,
            text: 'double free',
            size: 13,
            mono: true,
            anchor: 'middle',
            tone: 'freed',
            weight: 700,
          }),
        ],
      },
    ],
  },

  code: {
    lang: 'rust',
    filename: 'main.rs',
    source: `fn main() {
    let s = String::from("hello");
    let t = s;              // move: the three stack words go to t

    // println!("{s}");     // error[E0382]: borrow of moved value: \`s\`
    println!("{t}");        // fine — t owns the buffer now
    println!("{}", t.len());
}                           // t drops here; the buffer is freed exactly once`,
    annotations: [
      {
        lines: '2',
        text: '`String::from` allocates on the heap. `s` holds the pointer, length and capacity — **not** the text.',
      },
      {
        lines: '3',
        text: 'This is a *move*, not a copy. Three words are written; the heap is untouched. `s` is dead from this line onward.',
      },
      {
        lines: '5',
        text: 'Uncomment this and it will not compile. The check happens at build time and costs nothing at runtime.',
      },
      {
        lines: '8',
        text: 'The compiler inserted the free here. You can point at the exact line memory is released — that is what "deterministic" means.',
      },
    ],
  },

  deeper: [
    'Ownership is a *compile-time* discipline. There is no ownership flag in the binary, no reference count, no runtime bookkeeping of any kind. The compiler tracks which variable owns what while it is type-checking, inserts a call to `drop` at the point the owner goes out of scope, and then throws the tracking away. The generated machine code looks like well-written C++ with a destructor call — because that is exactly what it is.',
    'A move is a `memcpy` of the value itself, which for a `String` means 24 bytes on a 64-bit machine: pointer, length, capacity. The heap buffer is never read or written. The optimiser usually removes even that copy when the source is dead immediately afterwards, so a move frequently compiles to nothing at all.',
    'The moved-from variable is not zeroed and there is no runtime flag saying "this was moved". The compiler simply refuses to let you name it. This is why a move is free in a way that C++ moves are not — a C++ moved-from object must be left in a valid, destructible state, so its move constructor has to null out the source pointer. Rust does not need to, because the source can never be touched again.',
    'The rule generalises past assignment. Passing a value to a function by value moves it in; returning it moves it back out. That is why you often see a function signature take a `String` and return it — the author needed ownership temporarily and is handing it back. Once borrowing is available (two lessons from here) you will almost never write that, but it is worth recognising.',
    'What ownership buys, concretely: no use-after-free, no double free, no data races on shared mutable state, and no garbage collector pause. What it costs is that you must express your data\'s ownership structure explicitly, and when your structure is genuinely a graph rather than a tree you have to reach for `Rc`, `Arc` or indices. That trade is the entire argument about Rust, and it is why Databento chose C++ for their feed handler while choosing Rust for their internet-facing gateway.',
  ],

  gotchas: [
    'Not every assignment is a move. Types that implement `Copy` — integers, floats, `bool`, `char`, and tuples of those — are copied instead, so `let b = a;` leaves `a` perfectly usable. The difference is invisible in the syntax, which is why the next lessons cover it directly.',
    'Passing a value to a function moves it. `takes(s); println!("{s}");` fails for exactly the same reason `let t = s;` does, and the error surprises people because the call *looks* like it should just read the value.',
    'Indexing out of a `Vec` cannot move: `let x = v[0];` fails for a non-`Copy` element type, because that would leave a hole in the vector. Use `v[0].clone()`, `&v[0]`, `v.remove(0)` or `std::mem::take`.',
    'A move in a loop is a common early stumble. Move something out of a variable inside a `for` body and the second iteration has nothing left to move, so the compiler rejects the whole loop rather than the second pass.',
  ],

  interview: {
    q: 'Why does Rust not need a garbage collector, and what does it give up to avoid one?',
    a: [
      'Because the compiler already knows the exact point at which every value dies. Each value has one owner, ownership is tracked statically through moves, and when the owner goes out of scope the compiler inserts the release right there. A garbage collector exists to answer the question "is anyone still using this?" at runtime — Rust arranges the type system so the answer is known at compile time, so the question never has to be asked.',
      'The concrete payoff is deterministic destruction and no pause. There is no tracing phase, no stop-the-world, no allocation-rate-dependent tail latency. For anything latency-sensitive that matters enormously — it is precisely the reason Discord moved their read-states service from Go to Rust, since the Go GC was producing periodic latency spikes that no amount of tuning removed.',
      'What it gives up is expressiveness for a specific shape of data. Ownership is a tree; a garbage collector handles arbitrary graphs for free. Doubly-linked lists, back-pointers from child to parent, and observer patterns all require `Rc`/`Weak`, `Arc`, arena indices, or `unsafe` — and each of those is either a runtime cost or an escape hatch. The honest framing is that Rust moved a cost from runtime to *authoring* time: you pay by having to state the ownership structure up front, and you are refunded in predictable performance. A strong answer names both halves rather than selling one.',
    ],
  },

  exercise: [
    'Type the program above into the [Rust Playground](https://play.rust-lang.org) and uncomment line 5. Read the full error, including the note about where the value was moved and the help text suggesting `clone`. Rust\'s errors are unusually good and learning to read them properly now will save you weeks — the compiler is telling you the ownership story of your own program.',
    'Then make it compile three different ways and note what each one costs: clone `s` before the move, borrow with `&s` instead of moving, and reorder so the last use of `s` comes before the move. Only one of those allocates. Being able to say which, and why, is the whole point of this lesson.',
  ],
};
