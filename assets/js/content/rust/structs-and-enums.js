import { Box, Text, Arrow } from '../../viz/primitives.js';

/* ------------------------------------------------------------------
   One byte-strip geometry reused for every variant of Message: a tag
   segment, a padding segment, and a payload segment whose USED width
   changes per variant while its TOTAL width never does. That fixed
   total width is the entire lesson.
   ------------------------------------------------------------------ */
const TAG = { x: 40, y: 150, w: 56, h: 64 };
const PAD = { x: 104, y: 150, w: 70, h: 64 };
const PAYLOAD = { x: 182, y: 150, w: 240, h: 64 };
const SCALE = PAYLOAD.w / 24; // px per byte, 24 = size of the String payload

const strip = (tagValue, usedBytes, usedLabel) => {
  const usedW = Math.max(usedBytes * SCALE, 2);
  const wastedW = PAYLOAD.w - usedW;
  const shapes = [
    Box({ key: 'tag', ...TAG, label: String(tagValue), sub: 'tag', tone: 'owned', mono: true, labelSize: 16 }),
    Box({ key: 'pad', ...PAD, label: 'padding', sub: '7 bytes', tone: 'neutral', dashed: true, opacity: 0.5, mono: true, labelSize: 10 }),
  ];
  if (usedBytes > 0) {
    shapes.push(Box({ key: 'payUsed', x: PAYLOAD.x, y: PAYLOAD.y, w: usedW, h: PAYLOAD.h, label: usedLabel, tone: 'owned', mono: true, labelSize: 10.5 }));
  }
  if (wastedW > 2) {
    shapes.push(Box({ key: 'payWasted', x: PAYLOAD.x + usedW, y: PAYLOAD.y, w: wastedW, h: PAYLOAD.h, label: 'wasted', tone: 'moved', dashed: true, opacity: 0.32, mono: true, labelSize: 10 }));
  }
  return shapes;
};

const byteLabels = () => [
  Text({ key: 'lTag', x: 68, y: 226, text: 'byte 0', size: 9.5, anchor: 'middle', mono: true, opacity: 0.55 }),
  Text({ key: 'lPad', x: 139, y: 226, text: 'bytes 1-7', size: 9.5, anchor: 'middle', mono: true, opacity: 0.55 }),
  Text({ key: 'lPay', x: 302, y: 226, text: 'bytes 8-31 — sized for the LARGEST variant', size: 9.5, anchor: 'middle', mono: true, opacity: 0.55 }),
];

export default {
  oneLiner:
    'A struct is every field, all the time. An enum is one field at a time — but its footprint is sized for the biggest one it could ever hold.',

  whyJob:
    'Rust enums are the language\'s signature feature, and "why is `size_of::<Message>()` the same no matter which variant is stored" is one of the fastest ways an interviewer checks whether you have actually reasoned about layout, rather than just used `match` without asking what it compiles to.',

  mentalModel:
    'A struct is a *filing cabinet*: every drawer exists all the time, side by side, and the cabinet\'s size is just the sum of its drawers, plus a sliver of unused space to keep each one aligned on a tidy boundary. An enum is a *single drawer that changes shape*: only one variant occupies it at any moment, but the drawer itself has to be built large enough for the biggest shape that could ever go in it — and a one-byte *tag* sitting beside the drawer is how the program remembers, at runtime, which shape is actually in there right now.',

  scene: {
    id: 'enum-tagged-union',
    title: 'One enum, three variants, one fixed footprint',
    width: 720,
    height: 400,
    legend: [
      { tone: 'owned', label: 'live tag / in-use payload bytes' },
      { tone: 'moved', label: 'wasted — reserved but unused by this variant' },
      { tone: 'highlight', label: 'the arm this value\'s tag selects' },
    ],
    steps: [
      {
        say: 'Three variants, three different amounts of data. `Quit` carries nothing. `Move` carries two `i32`s. `Write` carries a whole `String` — the biggest of the three by far.',
        mark: ['3-7'],
        shapes: () => [
          Box({ key: 'vQuit', x: 40, y: 90, w: 150, h: 54, label: 'Quit', sub: 'no data — 0 bytes', tone: 'neutral', labelSize: 13, mono: true }),
          Box({ key: 'vMove', x: 210, y: 90, w: 190, h: 54, label: 'Move { x, y }', sub: '2 × i32 — 8 bytes', tone: 'neutral', labelSize: 13, mono: true }),
          Box({ key: 'vWrite', x: 420, y: 90, w: 220, h: 54, label: 'Write(String)', sub: 'String — 24 bytes', tone: 'neutral', labelSize: 13, mono: true }),
        ],
      },
      {
        say: 'A value holding `Write`: tag 2, then padding to keep the payload on an 8-byte boundary, then the full 24-byte `String` header, entirely used. Nothing wasted here — this variant is exactly what the layout was sized for.',
        mark: ['6'],
        shapes: () => [
          Text({ key: 'title', x: 40, y: 60, text: 'size_of::<Message>() = 32 bytes, always', size: 13, mono: true, weight: 650 }),
          ...strip(2, 24, 'String — ptr/len/cap'),
          ...byteLabels(),
        ],
      },
      {
        say: 'The same 32 bytes, now holding `Move { x: 3, y: 4 }`: tag 1, the same 7 bytes of padding, and only the first 8 of the 24 payload bytes actually mean anything. The rest is reserved space this variant has no use for.',
        mark: ['5'],
        focus: ['tag', 'payUsed', 'payWasted'],
        shapes: () => [
          Text({ key: 'title', x: 40, y: 60, text: 'size_of::<Message>() = 32 bytes, always', size: 13, mono: true, weight: 650 }),
          ...strip(1, 8, 'x, y'),
          ...byteLabels(),
        ],
      },
      {
        say: 'And `Quit`: tag 0, and the entire 24-byte payload region sits empty. Same total size as the other two.',
        mark: ['4'],
        focus: ['tag', 'payWasted'],
        predict: {
          ask: 'This value is currently `Message::Quit`, which carries no data at all. What is `std::mem::size_of::<Message>()` right now?',
          options: [
            { label: '1 byte — just the tag, since Quit has nothing else', correct: false },
            { label: '32 bytes — identical to every other Message, because size is a property of the type, not the value', correct: true },
            { label: 'It depends on the variant, checked at runtime', correct: false },
          ],
          because:
            '`size_of` is decided once, at compile time, for the type `Message` as a whole — it has to be, because the compiler needs one fixed answer to lay out a `Vec<Message>` or a struct field of type `Message` before any particular value exists. The layout is built to fit the largest variant every single time, whether or not that variant is the one actually stored right now.',
        },
        shapes: () => [
          Text({ key: 'title', x: 40, y: 60, text: 'size_of::<Message>() = 32 bytes, always', size: 13, mono: true, weight: 650 }),
          ...strip(0, 0, ''),
          ...byteLabels(),
        ],
      },
      {
        say: '`match` does not inspect the payload to guess which variant this is — it reads the tag byte and jumps straight to the matching arm. Tag 1 selects `Move` directly; the other two arms are never even considered.',
        mark: ['10-14'],
        focus: ['tag', 'armMove'],
        shapes: () => [
          Box({ key: 'tag', x: 40, y: 90, w: 70, h: 54, label: '1', sub: 'tag', tone: 'highlight', mono: true, labelSize: 16 }),
          Arrow({ key: 'a1', from: [75, 144], to: [130, 210], tone: 'neutral', dashed: true, shape: 'curve', bend: -10 }),
          Arrow({ key: 'a2', from: [75, 144], to: [370, 210], tone: 'highlight', thick: true, shape: 'curve', bend: 0 }),
          Arrow({ key: 'a3', from: [75, 144], to: [610, 210], tone: 'neutral', dashed: true, shape: 'curve', bend: 10 }),
          Box({ key: 'armQuit', x: 40, y: 210, w: 180, h: 46, label: 'Quit => ..', tone: 'neutral', opacity: 0.4, mono: true, labelSize: 11.5 }),
          Box({ key: 'armMove', x: 260, y: 210, w: 220, h: 46, label: 'Move { x, y } => ..', tone: 'highlight', mono: true, labelSize: 11.5 }),
          Box({ key: 'armWrite', x: 500, y: 210, w: 180, h: 46, label: 'Write(s) => ..', tone: 'neutral', opacity: 0.4, mono: true, labelSize: 11.5 }),
          Text({ key: 'note', x: 40, y: 288, text: 'one branch on one tag value — not a chain of type checks', size: 11.5, mono: true, opacity: 0.65 }),
        ],
      },
      {
        say: 'Delete the `Write` arm and the program refuses to compile at all — not a warning, a hard error naming the exact variant left uncovered. Add every arm back, or add a genuine wildcard, and the gate opens.',
        mark: [],
        shapes: () => [
          Box({ key: 'gateBad', x: 40, y: 100, w: 300, h: 100, label: 'match missing Write(_) arm', sub: "error[E0004]: non-exhaustive patterns", tone: 'freed', mono: true, labelSize: 12 }),
          Text({ key: 'badX', x: 190, y: 236, text: 'REJECTED — will not compile', size: 12, mono: true, tone: 'freed', anchor: 'middle', weight: 700 }),
          Box({ key: 'gateGood', x: 380, y: 100, w: 300, h: 100, label: 'match with all 3 arms', sub: 'every variant explicitly handled', tone: 'owned', mono: true, labelSize: 12 }),
          Text({ key: 'goodCheck', x: 530, y: 236, text: 'compiles', size: 12, mono: true, tone: 'owned', anchor: 'middle', weight: 700 }),
        ],
      },
    ],
  },

  code: {
    lang: 'rust',
    filename: 'main.rs',
    source: `struct Point { x: i32, y: i32 }   // fields laid out in declared order here

enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
}

fn handle(msg: Message) {
    match msg {
        Message::Quit => println!("quit"),
        Message::Move { x, y } => println!("move to ({x}, {y})"),
        Message::Write(text) => println!("write: {text}"),
        // remove any one arm above and this stops compiling
    }
}

fn main() {
    println!("size_of::<Point>()   = {}", std::mem::size_of::<Point>());
    println!("size_of::<Message>() = {}", std::mem::size_of::<Message>());

    handle(Message::Quit);
    handle(Message::Move { x: 3, y: 4 });
    handle(Message::Write(String::from("hello")));
}`,
    annotations: [
      {
        lines: '1',
        text: '`Point`\'s two `i32` fields already share the same size and alignment, so there is no padding to insert — 8 bytes total, no waste.',
      },
      {
        lines: '3-7',
        text: 'The enum\'s footprint is set by its largest variant, `Write(String)`. Every other variant is sized as if it might also be a `String`, whether or not it ever is.',
      },
      {
        lines: '10-13',
        text: '`match` compiles to a branch on the stored tag, not a sequence of type checks — one jump, regardless of how far down the list the matching arm sits.',
      },
      {
        lines: '11-13',
        text: 'Delete any one of these three arms and the program stops compiling — not a warning, a hard error naming exactly the variant you missed. That guarantee is what "exhaustive" means.',
      },
    ],
  },

  deeper: [
    'Default Rust struct layout is explicitly *unspecified* — unlike C, the compiler is free to reorder fields to shrink padding, so nothing about field declaration order is guaranteed to match memory order. Relying on a specific layout (for FFI, or for reinterpreting bytes) requires opting in with `#[repr(C)]`, which pins the layout to C\'s declaration-order rules specifically so it can be shared safely across a language boundary.',
    'The general padding rule: every field must sit at an offset that is a multiple of its own alignment, a struct\'s overall alignment is the maximum of its fields\' alignments, and the struct\'s total size is rounded up to a multiple of that alignment. This is why `{bool, i64, bool}` declared in that order can cost 24 bytes rather than 10 if laid out naively — each `bool` before the `i64` forces padding out to an 8-byte boundary — and exactly why the compiler is allowed to reorder the two `bool`s next to each other instead.',
    'The enum tag itself is usually the smallest integer type that can index every variant — a `u8` covers up to 256 of them — but the tag and payload together still get padded so the *whole* value aligns to its most-aligned field. That is precisely why the `Message` in this lesson is 32 bytes rather than a tighter 25 (1 tag byte + 24 payload bytes): 7 bytes of padding sit between the tag and the payload purely so the `String`\'s 8-byte-aligned pointer field lands on a valid boundary.',
    'Some enums avoid storing a separate tag byte at all, when a value the payload could never legitimately hold is available to double as the tag — a null pointer, for instance. `Option<Box<T>>` and `Option<&T>` use this *niche optimisation* and end up the exact same size as the pointer alone, no tag, no padding. The tagged layout in this lesson is the ordinary case; niche optimisation is the specific exception the next lesson covers in depth.',
    'When an enum\'s tag is a small, dense integer starting at zero, LLVM frequently compiles a `match` on it into a jump table — one indirect branch straight to the matching arm\'s code, regardless of how many variants exist. This is not a language guarantee, it is an optimisation that depends on the tag shape being favourable, but for a plain enum like `Message` it is routinely what actually happens.',
  ],

  gotchas: [
    'Assuming struct fields keep their declared order in memory. Without `#[repr(C)]`, that is not guaranteed — the compiler may reorder fields to reduce padding, so any code that assumes a specific byte offset for a field is relying on something the language does not promise.',
    'Being surprised that `size_of::<Message>()` does not shrink for a `Quit` value. Size is a property of the *type*, fixed once for every possible value of that type — it cannot depend on which variant a particular instance happens to hold, because the compiler needs one answer before any instance exists.',
    'Adding a new variant to a widely `match`-ed enum and expecting existing code to keep compiling unchanged. It will not — every non-wildcard `match` on that enum now has to account for the new variant, which is usually the entire point (a compiler-generated checklist of every call site that needs attention), but it surprises people the first time a one-line enum change breaks forty files.',
    'Reaching for a wildcard `_ => {}` arm purely to silence the exhaustiveness check. It compiles, but it also silently swallows any variant added later — the whole safety guarantee `match` offers exists only as long as wildcards are used deliberately, not as a reflex.',
    'Underestimating struct padding as "just a few wasted bytes." A `{bool, i64, bool}` struct in that declaration order can genuinely cost more than double the 10 bytes its fields would need standing alone — padding is real, measurable memory, not a rounding footnote.',
  ],

  interview: {
    q: 'Why does `size_of::<Message>()` not change depending on which variant a particular value is currently holding, and what determines its exact number?',
    a: [
      'Size is a compile-time property of the type, not a runtime property of any one value. The compiler needs a single fixed answer before it can lay out a `Vec<Message>`, place a `Message` field inside another struct, or push one onto the stack — it cannot wait to see which variant shows up at runtime. So it computes the size once, sized to fit the *largest* variant, and every value of type `Message` — `Quit`, `Move`, or `Write` — occupies exactly that many bytes regardless of which one it actually is.',
      'The exact number comes from three pieces: a discriminant tag (the smallest integer type that can distinguish the variants — a `u8` here, since there are only three), alignment padding between the tag and the payload so the payload\'s own fields land on valid boundaries, and a payload region sized for the largest variant\'s data. For a `String` payload that needs 8-byte alignment, the tag plus padding costs a full 8 bytes even though the tag itself is one byte, giving 8 + 24 = 32 total.',
      'Worth adding unprompted: this tagged layout is the default case, not the only one. When a payload has a value it could never legitimately take — most commonly a null pointer — the compiler can use that value as the tag instead of storing one separately. `Option<Box<T>>` and `Option<&T>` use exactly this niche optimisation and end up precisely the size of the pointer, with no tag and no padding at all — a detail that shows you have gone past "enums are tagged unions" into actually reasoning about when the tag disappears.',
    ],
  },

  exercise: [
    'Define `Message` as above and print `size_of::<Message>()`. Then remove the `Write(String)` variant entirely, leaving only `Quit` and `Move`, and rerun — watch the size drop sharply, since the layout is no longer built to fit a 24-byte payload.',
    'Delete the `Message::Write` arm from `handle`\'s `match` and read the exact compiler error. Then replace it with a wildcard `_ => {}`, add a fourth variant to the enum, and confirm the match now compiles silently without ever mentioning the new variant — a direct demonstration of exactly the guarantee a wildcard gives up.',
  ],
};
