import { Cells, Text, Bracket, Tag, Box } from '../../viz/primitives.js';

/* 0x40490FDB — the IEEE-754 single-precision encoding of pi.
   The whole scene rests on this row never changing. */
const BITS = '01000000010010010000111111011011'.split('');

const BX = 40;
const BY = 128;
const BW = 20;

const bitRow = (tones = {}) =>
  Cells({
    key: 'b',
    x: BX,
    y: BY,
    values: BITS.map((v, i) => ({ value: v, tone: tones[i] ?? 'neutral' })),
    w: BW,
    h: 36,
  });

/* Tone every bit in [from, to) — used to show the float partition. */
const range = (from, to, tone, into = {}) => {
  for (let i = from; i < to; i++) into[i] = tone;
  return into;
};

const label = (key, text, tone = 'neutral', size = 12) =>
  Text({
    key,
    x: 360,
    y: 92,
    text,
    size,
    anchor: 'middle',
    mono: true,
    tone,
    weight: 650,
  });

const reading = (key, text, tone) =>
  Text({
    key,
    x: 360,
    y: 258,
    text,
    size: 19,
    anchor: 'middle',
    mono: true,
    tone,
    weight: 700,
  });

export default {
  oneLiner:
    'A type is not a property of the bits. It is a pair of instructions for how to read them.',

  whyJob:
    'Trading systems represent prices as scaled integers rather than doubles, and you will be asked why. The answer requires knowing what a float actually is, and a candidate who cannot explain two\'s complement overflow will eventually cost the firm money.',

  mentalModel:
    'Memory holds nothing but switches. A byte is eight of them, and it has no idea what it "is". A type is two instructions you hand the compiler: *how many switches to grab*, and *how to read the pattern*. The very same 32 switches are the integer 1078530011 or the number 3.14159 depending only on which pair of glasses you put on.',

  scene: {
    id: 'bits-lens',
    title: 'One bit pattern, four readings',
    width: 720,
    height: 400,
    legend: [
      { tone: 'highlight', label: 'sign' },
      { tone: 'stack', label: 'exponent' },
      { tone: 'heap', label: 'mantissa' },
    ],
    steps: [
      {
        say: 'Thirty-two switches. That is all that is physically there. No number, no type, no meaning — the meaning is entirely something the compiler adds.',
        mark: ['5'],
        shapes: () => [
          label('l', 'raw memory — 32 bits, no interpretation'),
          ...bitRow(),
        ],
      },
      {
        say: 'Read them as an unsigned 32-bit integer and you get one billion and change. Nothing was converted. The compiler just agreed to treat the leftmost switch as worth 2³¹.',
        mark: ['6'],
        shapes: () => [
          label('l', 'lens: uint32_t', 'owned'),
          ...bitRow(),
          reading('v', '1078530011', 'owned'),
        ],
      },
      {
        say: 'Now put on different glasses. Same switches, untouched.',
        mark: ['7'],
        predict: {
          ask: 'Reading those identical 32 bits as a `float` instead, what comes out?',
          options: [
            { label: '1078530011.0 — the same number, with a decimal point', correct: false },
            { label: 'Roughly 3.14159', correct: true },
            { label: 'Nothing meaningful — the bits are not a valid float', correct: false },
          ],
          because:
            'Every 32-bit pattern is a valid float. This particular one happens to be the IEEE-754 encoding of pi, which is why it was chosen — the two readings share no digits at all.',
        },
        shapes: () => [
          label('l', 'lens: ?', 'highlight'),
          ...bitRow(),
        ],
      },
      {
        say: 'The float lens carves the row into three fields and applies a formula. The bits did not move; only the reading rule changed.',
        mark: ['8'],
        shapes: () => {
          const tones = range(0, 1, 'highlight');
          range(1, 9, 'stack', tones);
          range(9, 32, 'heap', tones);
          return [
            label('l', 'lens: float', 'owned'),
            ...bitRow(tones),
            Bracket({ key: 'bs', x: BX, y: BY + 46, w: BW, label: 'sign', tone: 'highlight' }),
            Bracket({ key: 'be', x: BX + BW, y: BY + 46, w: BW * 8, label: 'exponent', tone: 'stack' }),
            Bracket({ key: 'bm', x: BX + BW * 9, y: BY + 46, w: BW * 23, label: 'mantissa', tone: 'heap' }),
            Text({
              key: 'f',
              x: 360,
              y: 224,
              text: '(-1)^s  ×  1.mantissa  ×  2^(exponent - 127)',
              size: 12,
              anchor: 'middle',
              mono: true,
              tone: 'neutral',
              opacity: 0.75,
            }),
            reading('v', '3.14159274', 'owned'),
          ];
        },
      },
      {
        say: 'A third lens: four bytes of text. This is what a network parser does — it points a struct at bytes that arrived off the wire and reads them in place, with no conversion step at all.',
        mark: ['9-10'],
        shapes: () => [
          label('l', 'lens: char[4]', 'owned'),
          ...bitRow(),
          Bracket({ key: 'c0', x: BX, y: BY + 46, w: BW * 8, label: '0x40', tone: 'borrowed' }),
          Bracket({ key: 'c1', x: BX + BW * 8, y: BY + 46, w: BW * 8, label: '0x49', tone: 'borrowed' }),
          Bracket({ key: 'c2', x: BX + BW * 16, y: BY + 46, w: BW * 8, label: '0x0F', tone: 'borrowed' }),
          Bracket({ key: 'c3', x: BX + BW * 24, y: BY + 46, w: BW * 8, label: '0xDB', tone: 'borrowed' }),
          reading('v', "'@'  'I'  '\\x0f'  '\\xdb'", 'owned'),
        ],
      },
      {
        say: 'Second act, and the one that actually bites. Eight bits holding 126, read as a signed byte. The leftmost switch is the sign, and right now it is off.',
        mark: ['13'],
        shapes: () => [
          label('l', 'int8_t — the leftmost bit carries the sign', 'stack'),
          ...Cells({
            key: 'c',
            x: 220,
            y: BY,
            values: '01111110'.split('').map((v, i) => ({
              value: v,
              tone: i === 0 ? 'highlight' : 'neutral',
            })),
            w: 34,
            h: 40,
          }),
          reading('v', '126', 'owned'),
        ],
      },
      {
        say: 'Add two. The carry rolls all the way up and lands in the sign bit, so the value does not become 128 — it becomes −128. In C++ that overflow is undefined behaviour, which means the optimiser is entitled to assume it never happened.',
        mark: ['14-15'],
        focus: ['c.0', 'v', 'warn'],
        shapes: () => [
          label('l', 'the carry reaches the sign bit', 'freed'),
          ...Cells({
            key: 'c',
            x: 220,
            y: BY,
            values: '10000000'.split('').map((v, i) => ({
              value: v,
              tone: i === 0 ? 'freed' : 'neutral',
            })),
            w: 34,
            h: 40,
          }),
          reading('v', '-128', 'freed'),
          Tag({ key: 'warn', x: 296, y: 300, text: 'signed overflow is UB', tone: 'freed' }),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'bits.cpp',
    source: `#include <bit>
#include <cstdint>
#include <cstdio>

int main() {
    std::uint32_t bits = 0x40490FDB;          // one fixed pattern
    std::printf("as uint32 : %u\\n", bits);

    float f = std::bit_cast<float>(bits);      // C++20: reinterpret, no UB
    std::printf("as float  : %.8f\\n", f);     // 3.14159274

    auto* c = reinterpret_cast<unsigned char*>(&bits);
    std::printf("as bytes  : %02x %02x %02x %02x\\n", c[0], c[1], c[2], c[3]);

    std::int8_t n = 126;
    std::printf("%d ", +n);
    n = n + 2;                                 // wraps to -128
    std::printf("-> %d\\n", +n);
}`,
    annotations: [
      {
        lines: '9',
        text: '`std::bit_cast` reinterprets the bytes with no conversion and no undefined behaviour. Doing this with a `reinterpret_cast` between unrelated types breaks the strict aliasing rule.',
      },
      {
        lines: '12',
        text: 'Byte order here is your machine\'s. On x86 it is little-endian, so the bytes come out reversed relative to the hex literal — which is exactly the trap when parsing a big-endian wire protocol.',
      },
      {
        lines: '15-17',
        text: 'This wraps in practice, but the standard says signed overflow is **undefined**. That is a licence the optimiser uses, not a promise about the result.',
      },
    ],
  },

  deeper: [
    'Two\'s complement is why the wrap lands on −128 rather than on some other value. In an 8-bit signed byte the top bit is worth −128 instead of +128, and every other bit keeps its usual positive weight. So `10000000` is −128 + 0 = −128, and `11111111` is −128 + 127 = −1. The elegant consequence is that the CPU needs only one adder: signed and unsigned addition are the identical instruction, and only the *interpretation* of the result differs.',
    'Floating point is a sign, an exponent and a fraction, which means the representable values are not evenly spaced — they cluster densely near zero and thin out as the magnitude grows. Past 2²⁴ a `float` cannot represent consecutive integers at all. This is why `0.1 + 0.2 != 0.3`: neither 0.1 nor 0.2 has an exact binary representation, in the same way that one third has no exact decimal one.',
    'That inexactness is the whole argument for integer prices. Prices are quantised to a tick size anyway, so an integer count of ticks is both exact and faster — integer compare and add are single-cycle with no floating-point pipeline latency, the values sort and hash as raw bit patterns, and two systems can never disagree about whether a price crossed a limit. It also means the wire format and the in-memory format can be identical, which is what makes zero-copy parsing possible.',
    'Unsigned overflow is defined to wrap; signed overflow is undefined. The asymmetry looks arbitrary and is not: because signed overflow cannot legally happen, the compiler may assume `i + 1 > i` is always true for signed `i`, which lets it prove loops terminate and promote induction variables to wider registers. You get faster code in exchange for a sharp edge, and `-fsanitize=undefined` is how you find out whether you stepped on it.',
    'Fixed-width types exist for exactly this reason. `int` is not guaranteed to be 32 bits — the standard only promises at least 16. Any value that touches a file format, a network protocol or shared memory should use `<cstdint>` types, where `std::int32_t` means precisely 32 bits with two\'s complement representation.',
  ],

  gotchas: [
    'Mixing signed and unsigned in a comparison silently converts the signed operand to unsigned, so `-1 < 1u` evaluates to **false**. Compile with `-Wsign-compare -Werror` and the whole family of these bugs disappears.',
    '`v.size()` is unsigned, so `v.size() - 1` on an empty container is not −1, it is roughly 18 quintillion, and the loop that follows reads far out of bounds.',
    'Never compare floats with `==`. Compare against a tolerance, or better, do not use floats for the quantity in the first place if exactness matters.',
    'Byte order is not the same as bit order, and neither is visible in your source. A struct memcpy\'d out of a network buffer needs an explicit `ntohl`-style swap on a little-endian machine, and forgetting it produces values that look like garbage rather than like an off-by-one.',
  ],

  interview: {
    q: 'Why do exchanges and trading systems represent prices as integers rather than as doubles?',
    a: [
      'Because binary floating point cannot exactly represent most decimal fractions, so arithmetic accumulates representation error. Worse than the error itself is the disagreement: two systems performing the same operations in a different order can land on different values, and then they disagree about whether a price crossed a limit. In a domain where that decision moves money, "close enough" is not a property you can ship.',
      'Prices are quantised to a tick size anyway, so nothing is lost by storing an integer count of ticks, or a fixed-point value scaled by 10⁴ or 10⁸. The representation is then exact by construction and there is no rounding policy to argue about.',
      'The performance argument is secondary but real, and a strong candidate raises it. Integer compare and add are single-cycle and have no floating-point pipeline latency; the values sort and hash directly as bit patterns; and because the wire format and the in-memory format can be made identical, a parser can point a struct at the received bytes and read the price in place with no conversion at all. That last point is the one that connects this to feed-handler design, and it is what distinguishes an answer that was understood from one that was memorised.',
    ],
  },

  exercise: [
    'Write a program that prints the raw bytes of an `int`, a `float` and a `double` holding the same numeric value, using `std::bit_cast` and a loop over `unsigned char`. Seeing that the same value has completely different byte patterns under different types is the point.',
    'Then find the smallest positive `float` for which `x + 1.0f == x`, and explain the result in terms of the 23-bit mantissa. Finally, compile a signed-overflow loop with `-O2` and then again with `-fsanitize=undefined`, and compare what each build does. The first will surprise you; the second will tell you why.',
  ],
};
