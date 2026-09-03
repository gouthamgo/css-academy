import { Region, Frame, Cells, Arrow, Text, Tag, Bracket } from '../../viz/primitives.js';

const HEAP_Y = 220;
const HEAP_X = 90;
const CW = 42;

const bytes = () =>
  Cells({
    key: 'buf',
    x: HEAP_X,
    y: HEAP_Y,
    values: ['h', 'e', 'l', 'l', 'ö', ' ', 'w', 'o', 'r', 'l', 'd'],
    w: CW,
    h: 38,
    tone: 'heap',
  });

export default {
  oneLiner:
    'A slice is a pointer and a length pointing into someone else\'s memory — a view, never an owner.',

  whyJob:
    'The three-way split between `String`, `&str` and `&\'static str` shows up in almost every real Rust function signature you will read in an interview, and "why can\'t I index a String by byte position" is a question that separates people who understand UTF-8 from people who have memorised a rule.',

  mentalModel:
    'A `String` is a librarian who owns a shelf of books and is responsible for it. A `&str` is a bookmark someone else placed in one of those books — it tells you exactly where to start reading and how far to go, but the bookmark owns nothing and the shelf can have many bookmarks in it at once, even overlapping ones, as long as nobody is rearranging the shelf while they are out.',

  scene: {
    id: 'slice-views',
    title: 'Two slices, one buffer',
    width: 720,
    height: 380,
    legend: [
      { tone: 'owned', label: 'owns the buffer' },
      { tone: 'borrowed', label: '&str — a view in' },
    ],
    steps: [
      {
        say: 'A `String` owns one heap buffer holding "helloö world" — but thatö is not one byte. UTF-8 encodes it as two bytes, so this eleven-character string is actually twelve bytes long. Keep that in mind.',
        mark: ['2'],
        shapes: () => [
          Region({ key: 'r', x: 44, y: 60, w: 630, h: 260, label: 'HEAP', tone: 'heap' }),
          Frame({ key: 's', x: 60, y: 84, w: 200, label: 's: String', tone: 'owned', vars: [{ name: 'ptr/len/cap', value: '→ buffer', tone: 'owned' }] }),
          ...bytes(),
        ],
      },
      {
        say: '`&s[0..5]` is a slice — its own tiny two-word header, pointer plus length, pointing five bytes into the *same* buffer `s` owns. Nothing was copied.',
        mark: ['4'],
        shapes: () => [
          Region({ key: 'r', x: 44, y: 60, w: 630, h: 260, label: 'HEAP', tone: 'heap' }),
          Frame({ key: 's', x: 60, y: 84, w: 200, label: 's: String', tone: 'owned', vars: [{ name: 'ptr/len/cap', value: '→ buffer', tone: 'owned' }] }),
          ...bytes(),
          Frame({ key: 'a', x: 320, y: 84, w: 200, label: 'a: &str  (0..5)', tone: 'borrowed', vars: [{ name: 'ptr, len', value: '→ +0, 5', tone: 'borrowed' }] }),
          Arrow({ key: 'aa', from: [400, 138], to: [HEAP_X + 22, HEAP_Y - 6], shape: 'curve', bend: -50, tone: 'borrowed' }),
          Bracket({ key: 'ab', x: HEAP_X, y: HEAP_Y + 46, w: CW * 5, label: '"hello"', tone: 'borrowed' }),
        ],
      },
      {
        say: 'A second slice, `&s[6..11]`, points *further into the same buffer*, past where the first one stops. Two independent views, overlapping the owner\'s data, coexisting freely — this is exactly the "many readers" rule from two lessons ago.',
        mark: ['5'],
        shapes: () => [
          Region({ key: 'r', x: 44, y: 60, w: 630, h: 260, label: 'HEAP', tone: 'heap' }),
          Frame({ key: 's', x: 60, y: 84, w: 200, label: 's: String', tone: 'owned', vars: [{ name: 'ptr/len/cap', value: '→ buffer', tone: 'owned' }] }),
          ...bytes(),
          Frame({ key: 'a', x: 320, y: 84, w: 200, label: 'a: &str  (0..5)', tone: 'borrowed', vars: [{ name: 'ptr, len', value: '→ +0, 5', tone: 'borrowed' }] }),
          Frame({ key: 'b', x: 320, y: 168, w: 200, label: 'b: &str  (6..11)', tone: 'borrowed', vars: [{ name: 'ptr, len', value: '→ +6, 5', tone: 'borrowed' }] }),
          Arrow({ key: 'aa', from: [400, 138], to: [HEAP_X + 22, HEAP_Y - 6], shape: 'curve', bend: -50, tone: 'borrowed' }),
          Arrow({ key: 'bb', from: [400, 222], to: [HEAP_X + CW * 6 + 22, HEAP_Y - 6], shape: 'curve', bend: -20, tone: 'borrowed' }),
          Bracket({ key: 'ab', x: HEAP_X, y: HEAP_Y + 46, w: CW * 5, label: '"hello"', tone: 'borrowed' }),
          Bracket({ key: 'bb2', x: HEAP_X + CW * 6, y: HEAP_Y + 46, w: CW * 5, label: '"world"', tone: 'borrowed' }),
        ],
      },
      {
        say: 'Now try to slice at byte 5.',
        mark: [],
        predict: {
          ask: 'Byte 5 falls in the MIDDLE of the two-byte ö encoding. What does `&s[4..6]` do?',
          options: [
            { label: 'Returns "ö" — Rust is smart enough to round to the character boundary', correct: false },
            { label: 'Panics at runtime — byte index 5 is not a char boundary', correct: true },
            { label: 'Silently returns one garbage byte', correct: false },
          ],
          because:
            'Rust checks at runtime that both slice endpoints land on character boundaries, because a &str must always be valid UTF-8. Landing inside a multi-byte character is rejected rather than silently producing invalid text.',
        },
        shapes: () => [
          Region({ key: 'r', x: 44, y: 60, w: 630, h: 260, label: 'HEAP', tone: 'heap' }),
          ...bytes(),
          Bracket({ key: 'mid', x: HEAP_X + CW * 4, y: HEAP_Y + 46, w: CW * 2, label: 'ö — 2 bytes, 1 char', tone: 'highlight' }),
        ],
      },
      {
        say: 'Byte offset 5 lands inside the two-byte encoding of ö. Rust checks both slice boundaries against the string\'s actual UTF-8 structure at runtime and refuses to hand back a slice that would split a character in half — because a `&str` carries the guarantee that its bytes are always valid UTF-8, unconditionally.',
        mark: ['7'],
        focus: ['mid', 'err'],
        shapes: () => [
          Region({ key: 'r', x: 44, y: 60, w: 630, h: 260, label: 'HEAP', tone: 'heap' }),
          ...bytes(),
          Bracket({ key: 'mid', x: HEAP_X + CW * 4, y: HEAP_Y + 46, w: CW * 2, label: 'byte 5 is HERE', tone: 'freed' }),
          Text({
            key: 'err',
            x: 380,
            y: 340,
            text: "thread 'main' panicked: byte index 5 is not a char boundary",
            size: 12,
            anchor: 'middle',
            mono: true,
            tone: 'freed',
            weight: 650,
          }),
        ],
      },
    ],
  },

  code: {
    lang: 'rust',
    filename: 'main.rs',
    source: `fn main() {
    let s = String::from("hellö world");

    let a: &str = &s[0..5];      // "hellö" — 5 bytes, 5 chars, fine
    let b: &str = &s[7..12];     // "world"    — a second, independent view

    println!("{a} / {b}");

    // let bad = &s[4..6];       // panics: 5 is not a char boundary
    println!("{}", s.chars().count()); // 11 characters
    println!("{}", s.len());           // 12 bytes — one more than chars()
}`,
    annotations: [
      {
        lines: '2',
        text: 'ö is one character but two bytes in UTF-8. Every slice index in this file is a **byte** offset, not a character offset.',
      },
      {
        lines: '4-5',
        text: 'Both slices borrow from `s`\'s buffer. Nothing is copied, and both can coexist because neither can mutate.',
      },
      {
        lines: '9',
        text: 'Uncomment this: byte 5 sits inside ö\'s two-byte encoding, so Rust panics rather than return a slice that would not be valid UTF-8.',
      },
    ],
  },

  deeper: [
    'A slice is, structurally, exactly the fat-pointer pattern you will meet again with trait objects: a pointer plus metadata, two words on the stack, pointing at data it does not own. For `&str` and `&[T]` the metadata is a length; the compiler knows the element size statically, so no stride needs to be stored.',
    'A `String` is really `Vec<u8>` with the additional, enforced invariant that its bytes are always valid UTF-8. Every public API that could break that invariant either validates its input (`String::from_utf8`, which returns a `Result`) or is marked `unsafe` (`String::from_utf8_unchecked`), because calling it with invalid bytes would produce a `String` whose fundamental guarantee is a lie — and every other piece of code that touches a `String` is trusting that guarantee unconditionally.',
    'This is exactly why byte-index slicing panics rather than silently rounding: rounding would mean the resulting `&str` no longer represents the substring you asked for, and returning a `&str` with a split multi-byte sequence would mean it is not valid UTF-8 at all, breaking the type\'s core promise for everyone downstream. A panic that happens immediately, at the site of the mistake, is considered far better than a `&str` that lies about its own contents three function calls later.',
    'The distinction between `String` and `&str` in a function signature is a genuine design decision, not decoration. Taking `&str` accepts anything that can produce a string slice — a `String`, a literal, a substring of another `String` — with zero allocation. Taking `String` demands ownership, which is right exactly when the function is going to store the value or hand it somewhere that needs to outlive the caller\'s borrow. The idiomatic default for a function that only reads is `&str`; APIs that take `String` when they only needed to read are a common early-Rust smell.',
    '`&\'static str` specifically means a string slice valid for the entire remainder of the program. String literals get this automatically because the compiler embeds them directly in the binary\'s read-only data section — there is no allocation, no owner, and no lifetime to track, because the data simply exists for as long as the program runs.',
  ],

  gotchas: [
    'Slice ranges are always byte offsets. `&s[0..1]` on a string starting with a multi-byte character does not panic because the range is invalid — it panics because byte 1 does not land on a character boundary.',
    '`.len()` on a `String` returns byte length, not character count. For any string containing non-ASCII characters, those two numbers differ, and code that assumes they are equal breaks silently on the first non-ASCII input.',
    'Indexing a `String` with `s[0]` does not compile at all — `String` deliberately does not implement `Index<usize>`, because there is no O(1) way to find "the nth character" in a variable-width encoding. You are pushed toward `.chars().nth(0)` (which is O(n)) or byte slicing (which is O(1) but requires you to already know a valid boundary).',
    'A `&str` slice borrowed from a `String` prevents that `String` from being mutated for as long as the slice is alive — pushing to the `String` while a slice into it is still in use is rejected by the same shared-versus-exclusive borrow rule from two lessons back, because a reallocation would leave the slice pointing at freed memory.',
  ],

  interview: {
    q: 'Why does `String` not implement direct indexing by integer, the way `Vec<T>` does?',
    a: [
      'Because `String` is UTF-8, a variable-width encoding — a character can be anywhere from one to four bytes — so there is no way to compute "the byte offset of the nth character" without walking the string from the beginning. `Vec<T>` supports `v[i]` because every element is the same fixed size, so the offset is a single multiplication. `String` cannot offer that same O(1) guarantee, and the language\'s design philosophy is that an operation whose cost people expect to be O(1) should not silently be O(n).',
      'So instead `String` exposes explicit, differently-costed operations: byte slicing with `&s[a..b]`, which is O(1) but requires the caller to supply valid character-boundary offsets and panics otherwise, and `.chars()`, which gives an iterator over actual Unicode scalar values at the honest cost of a linear walk.',
      'The panic-on-invalid-boundary behaviour of slicing is the other half of the same design decision: a `&str` type carries the invariant that its bytes are always valid UTF-8, unconditionally, for every piece of code that ever reads one. Silently rounding a bad slice index to the nearest boundary would violate the substring the caller actually asked for; returning a slice that splits a multi-byte character would violate the type\'s fundamental guarantee. Failing loudly and immediately at the mistake is the design that keeps that guarantee meaningful everywhere else in the ecosystem.',
    ],
  },

  exercise: [
    'Write a string containing at least one multi-byte character (an accented letter, an emoji), and print both `.len()` (bytes) and `.chars().count()` (characters) to see them diverge. Then deliberately slice at a byte offset that lands inside the multi-byte character and read the panic message.',
    'Then write a function `fn first_word(s: &str) -> &str` that returns everything up to the first space, taking `&str` rather than `String` so it works on both owned strings and literals with no allocation. Call it with both a `String` and a `"literal"` to confirm one signature genuinely covers both.',
  ],
};
