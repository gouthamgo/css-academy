import { Box, Cell, Bracket, Text, Tag } from '../../viz/primitives.js';

/* ------------------------------------------------------------------
   Geometry. Order is deliberately sized to 64 bytes — eight 8-byte
   fields — so one AoS record is exactly one cache line, and eight
   SoA price values are exactly one cache line too. The numbers in
   this lesson are not rounded for effect; they fall out of the type.
   ------------------------------------------------------------------ */
const AOS = { x0: 70, y: 104, w: 64, h: 48, gap: 8 };
const recX = (i) => AOS.x0 + i * (AOS.w + AOS.gap);
const AOS_LAST = recX(7) + AOS.w; // right edge of record 7

/* Each record is drawn as two layers: the 56-byte "rest of the
   struct" and the 8-byte price field, sharing the record's x. Before
   a touch both read as not-yet-fetched (dashed, neutral); after a
   touch the price field fills in solid and the rest dims — fetched,
   but never read. */
const aosRecord = (i, touched) => [
  Box({
    key: `aos.rest.${i}`,
    x: recX(i) + 8,
    y: AOS.y,
    w: AOS.w - 8,
    h: AOS.h,
    tone: touched ? 'moved' : 'neutral',
    dashed: true,
    opacity: touched ? 0.5 : 1,
  }),
  Box({
    key: `aos.price.${i}`,
    x: recX(i),
    y: AOS.y,
    w: 8,
    h: AOS.h,
    tone: touched ? 'hit' : 'neutral',
    dashed: !touched,
  }),
];
const aosPanel = (touchedUpTo) => [
  Text({ key: 'aos.title', x: AOS.x0, y: 86, text: 'ARRAY OF STRUCTS — std::vector<Order>', size: 11, mono: true, opacity: 0.75 }),
  ...Array.from({ length: 8 }, (_, i) => aosRecord(i, i < touchedUpTo)).flat(),
];
const aosBracket = (touchedUpTo) =>
  touchedUpTo === 0
    ? []
    : touchedUpTo === 1
      ? [Bracket({ key: 'aos.bracket', x: recX(0), y: AOS.y + AOS.h + 10, w: AOS.w, label: '= one 64-byte cache line', tone: 'stack' })]
      : [Bracket({ key: 'aos.bracket', x: AOS.x0, y: AOS.y + AOS.h + 10, w: AOS_LAST - AOS.x0, label: '= eight separate cache lines', tone: 'moved' })];
const aosCounter = (text) =>
  Tag({ key: 'aos.counter', x: AOS.x0, y: 178, text, tone: 'neutral', w: Math.max(300, text.length * 6.1 + 20) });

const SOA = { x0: 150, y: 250, w: 54, h: 36, gap: 4 };
const soaX = (i) => SOA.x0 + i * (SOA.w + SOA.gap);
const SOA_LAST = soaX(7) + SOA.w;
const PRICES = ['101.25', '101.30', '101.18', '101.42', '101.05', '101.37', '101.22', '101.15'];

const soaPanel = (touched) => [
  Text({ key: 'soa.title', x: SOA.x0, y: 232, text: 'STRUCT OF ARRAYS — OrderSoA', size: 11, mono: true, opacity: 0.75 }),
  ...Array.from({ length: 8 }, (_, i) =>
    Cell({
      key: `soa.p.${i}`,
      x: soaX(i),
      y: SOA.y,
      w: SOA.w,
      h: SOA.h,
      value: touched ? PRICES[i] : '',
      tone: touched ? 'hit' : 'neutral',
      dashed: !touched,
    })
  ),
];
const soaBracket = (touched) =>
  touched
    ? [Bracket({ key: 'soa.bracket', x: SOA.x0, y: SOA.y + SOA.h + 10, w: SOA_LAST - SOA.x0, label: '= one 64-byte cache line — all eight values', tone: 'hit' })]
    : [];
const soaCounter = (text) =>
  text
    ? [Tag({ key: 'soa.counter', x: SOA.x0, y: 302, text, tone: 'neutral', w: Math.max(260, text.length * 6.1 + 20) })]
    : [];

const task = () =>
  Text({ key: 'task', x: 360, y: 44, text: "task: sum every order's price field", size: 12, weight: 600, anchor: 'middle', opacity: 0.85 });

export default {
  oneLiner:
    'Why laying eight records out by field instead of by object turns one scan into eight times less memory traffic — for the exact same arithmetic.',

  whyJob:
    'This is the concrete fix behind the abstract cache lesson: restructuring a hot type from array-of-structs to struct-of-arrays is a standard interview exercise at trading firms and ECS-heavy game and ML infrastructure teams alike, and "why does this help" separates people who memorised the term from people who can derive the ratio.',

  mentalModel:
    'An array of structs is a row of filing cabinets, one drawer per order, every field of that order in the same drawer. Summing everyone\'s salary means opening every drawer and thumbing past the name, the address and the ID to find the one number you wanted. A struct of arrays is a single binder with nothing in it but salaries — the same walk down the hallway now reads *only* the numbers you actually need.',

  scene: {
    id: 'aos-vs-soa',
    title: 'The same eight orders, laid out two ways',
    width: 720,
    height: 410,
    legend: [
      { tone: 'hit', label: 'fetched and used' },
      { tone: 'moved', label: 'fetched, never read — wasted' },
      { tone: 'stack', label: '64-byte cache line' },
    ],
    steps: [
      {
        say: 'This is what `std::vector<Order>` gives you by default: eight complete records, back to back in memory, 64 bytes each — exactly one cache line per order.',
        mark: ['5-8'],
        shapes: () => [task(), ...aosPanel(0), ...aosBracket(0)],
      },
      {
        say: 'Reading `orders[0].price` is an 8-byte access — but the cache does not fetch 8 bytes, it fetches the whole line. All 64 bytes of order 0 arrive, and only the highlighted eight are the field the loop actually wanted.',
        mark: ['17'],
        shapes: () => [task(), ...aosPanel(1), ...aosBracket(1), aosCounter('1 line fetched · 8 of 64 bytes used')],
      },
      {
        say: 'Repeat for the other seven orders and the pattern repeats exactly: one full line per record, seven-eighths of it unused, every single time.',
        mark: ['17'],
        shapes: () => [task(), ...aosPanel(8), ...aosBracket(8), aosCounter('8 lines · 512 bytes fetched · 64 used · 448 wasted (87.5%)')],
      },
      {
        say: 'The same eight prices, laid out by field instead of by record — a struct of arrays. Nothing about the numbers changed. Only which bytes sit next to which.',
        mark: ['10-13'],
        shapes: () => [
          task(),
          ...aosPanel(8),
          ...aosBracket(8),
          aosCounter('8 lines · 512 bytes fetched · 64 used · 448 wasted (87.5%)'),
          ...soaPanel(false),
        ],
      },
      {
        say: "Summing `price` here means reading eight `double`s that are contiguous with each other and with nothing else — no id, no quantity, no venue in between them.",
        mark: ['23'],
        predict: {
          ask: "Eight orders' price values, 8 bytes each, laid out contiguously. How many 64-byte cache lines does the sum need to fetch?",
          options: [
            { label: '8 — same as the array-of-structs version', correct: false },
            { label: '2', correct: false },
            { label: '1', correct: true },
          ],
          because:
            'Eight doubles at eight bytes each is exactly 64 bytes — one line, fetched once, with nothing wasted. The other seven fields of every order live in seven other arrays this loop never touches at all.',
        },
        shapes: () => [
          task(),
          ...aosPanel(8),
          ...aosBracket(8),
          aosCounter('8 lines · 512 bytes fetched · 64 used · 448 wasted (87.5%)'),
          ...soaPanel(true),
          ...soaBracket(true),
          ...soaCounter('1 line fetched · 64 of 64 bytes used · 0 wasted'),
        ],
      },
      {
        say: 'Same eight numbers, same arithmetic, same answer either way. Array-of-structs moves 512 bytes to deliver 64 bytes of signal. Struct-of-arrays moves 64 bytes to deliver the same 64 — eight times less traffic, for a change that touched no arithmetic at all.',
        mark: ['17', '23'],
        focus: ['cmp1', 'cmp2', 'aos.bracket', 'soa.bracket'],
        shapes: () => [
          task(),
          ...aosPanel(8),
          ...aosBracket(8),
          ...soaPanel(true),
          ...soaBracket(true),
          Text({ key: 'cmp1', x: 360, y: 356, text: 'AoS: 8 lines · 512 B fetched · 448 B wasted (87.5%)', size: 12, anchor: 'middle', tone: 'moved' }),
          Text({ key: 'cmp2', x: 360, y: 378, text: 'SoA: 1 line · 64 B fetched · 0 B wasted', size: 12, anchor: 'middle', tone: 'hit' }),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'soa.cpp',
    source: `#include <chrono>
#include <cstdio>
#include <vector>

struct Order {                  // 64 bytes — one cache line, one whole record
    double price, qty, filled, avgPrice;
    long   id, venueTs, flags, pad;
};

struct OrderSoA {                // same data, organised by field instead
    std::vector<double> price, qty, filled, avgPrice;
    std::vector<long>   id, venueTs, flags, pad;
};

double sum_price_aos(const std::vector<Order>& v) {
    double s = 0;
    for (const auto& o : v) s += o.price;      // touches 64B, uses 8
    return s;
}

double sum_price_soa(const OrderSoA& v) {
    double s = 0;
    for (double p : v.price) s += p;           // touches only price[]
    return s;
}

int main() {
    constexpr int N = 20'000'000;

    std::vector<Order> aos(N);
    OrderSoA soa;
    soa.price.assign(N, 1.0);

    auto t0 = std::chrono::steady_clock::now();
    double s1 = sum_price_aos(aos);
    auto t1 = std::chrono::steady_clock::now();
    double s2 = sum_price_soa(soa);
    auto t2 = std::chrono::steady_clock::now();

    printf("AoS: %.1f ms  sum=%.0f\\n",
           std::chrono::duration<double, std::milli>(t1 - t0).count(), s1);
    printf("SoA: %.1f ms  sum=%.0f\\n",
           std::chrono::duration<double, std::milli>(t2 - t1).count(), s2);
    return 0;
}`,
    annotations: [
      {
        lines: '5-8',
        text: 'Eight 8-byte fields, deliberately sized so `sizeof(Order)` is exactly 64 — one cache line holds one whole record, no more.',
      },
      {
        lines: '10-13',
        text: 'Same eight fields, but each is now its own contiguous array. `price[i]` holds the same value as `aos[i].price` — only the address it lives at has changed.',
      },
      {
        lines: '17',
        text: 'Every iteration touches a full 64-byte line to read 8 bytes. The cache has no finer granularity than a line — it cannot fetch less.',
      },
      {
        lines: '23',
        text: '`v.price` is a plain contiguous array of `double`. This is the textbook shape a compiler auto-vectorizes; the strided read in `sum_price_aos` usually is not.',
      },
    ],
  },

  deeper: [
    'Array-of-structs is the default not because it is fast but because it matches how people think: "an order is one thing," so `struct Order` bundles its fields and `vector<Order>` gives an array of things. The CPU has no concept of "things" — only bytes and 64-byte fetch units — so it charges by bytes moved per byte actually used, and a scan that wants one field pays for every field it did not ask for, on every single fetch.',
    'The ratio generalises past eight records. Array-of-structs\' used-to-fetched ratio for one field is fixed at `fieldSize / recordSize` no matter how large the array grows — 8/64, or 12.5%, forever, in this example. Struct-of-arrays\' ratio approaches 100% (minus at most one partially-used line at the very end). At twenty million orders the array-of-structs scan for `price` still moves roughly 1.28GB to deliver 160MB of useful doubles; the struct-of-arrays scan moves close to 160MB total. That gap is the entire benchmark result at the bottom of this lesson, derived from the type definition alone, before a single line runs.',
    'Struct-of-arrays does not vectorize code for you, but it removes the main obstacle to it. `sum_price_soa`\'s loop reads a plain `double*` at a fixed one-element stride — exactly what an auto-vectorizer looks for, and it typically compiles to packed SIMD loads and a horizontal reduction. `sum_price_aos`\'s loop reads `double`s at a 64-byte stride out of a larger struct; some compilers will still vectorize that as a gather, but a strided gather load is itself expensive enough that many will decide it is not worth it, and fall back to a scalar loop.',
    'The trade-off that makes this a design decision rather than a free win: struct-of-arrays loses the moment a loop needs several fields of the *same* record together. Updating a particle\'s position from its velocity needs x, y, z, vx, vy and vz for one entity — in array-of-structs that is one 64-byte fetch; in struct-of-arrays it can be six separate fetches to six different arrays, potentially six separate cache misses instead of one. Real performance-sensitive code is rarely "array-of-structs or struct-of-arrays" as a global choice — it is splitting a type into a small, struct-of-arrays "hot" section for the fields a specific loop scans by themselves, and leaving fields that are always read together, or almost never read at all, in their original record. The middle ground that groups a few hot fields into small fixed-width blocks is sometimes called AoSoA.',
    'This exact argument has a name outside games and trading too: it is what a columnar database — ClickHouse, KDB+, Arrow and Parquet — does to every table, for the same reason. A query that sums one column should not have to read every other column of every row to do it. Recognising this as "the columnar-storage argument, applied to one C++ struct" rather than only "a cache-line trick" is the detail that shows the idea generalises past this one benchmark.',
  ],

  gotchas: [
    'Struct-of-arrays turns a loop that reads several fields of one record into several separate cache misses instead of one. Do not restructure a type this way until you have confirmed which access pattern — single-field scan, or whole-record update — actually dominates your hot path.',
    'Deleting an entry from a struct-of-arrays layout means removing the same index from every parallel array and keeping them all in sync. Updating six arrays but forgetting the seventh does not crash — it quietly attaches one field to the wrong record.',
    'Struct-of-arrays breaks the ergonomic "get me the object" API: there is no single `Order&` to hand back any more, only a row index into several arrays, or a small proxy type you have to write and maintain yourself.',
    'Restructuring for cache behaviour before profiling is a common wasted week: if the hot loop already touches every field of every record, array-of-structs was already the right layout, and struct-of-arrays adds real complexity for no measured win.',
    'The `pad` fields used above to force `sizeof(Order) == 64` are themselves wasted bytes in the array-of-structs case — they exist purely to make the record divide evenly into cache lines, and they count against you in the wasted-bytes tally exactly like the padding in the struct-layout lesson.',
  ],

  interview: {
    q: 'A market data cache holds `std::vector<Tick>`, where `Tick` is about 96 bytes: price, size, venue, timestamp, sequence number, a few flags. The hot path recomputes a volume-weighted average price by scanning only `price` and `size` across the last million ticks. How would you restructure this, and what would you expect `perf stat` to show before and after?',
    a: [
      'I would pull just the two fields the hot loop touches — `price` and `size` — into their own contiguous arrays, either as a small dedicated struct of two vectors kept in step by index, or as members of a `TickHot` type. Everything else — venue, timestamp, sequence, flags — stays exactly where it already lives, because nothing in this loop reads it.',
      'The used-to-fetched ratio is the number to reason from before touching any code: two 8-byte fields out of a 96-byte record is 16/96, about 17%. The array-of-structs version pays for the full 96 bytes on every element regardless; the restructured version pays for close to 100% of every line it fetches. For a million ticks that is roughly a 6x reduction in bytes moved, and I would expect `perf stat -e cache-misses,instructions,cycles` to show a similar-order drop in misses and a rise in instructions-per-cycle. If the numbers do not move by roughly that ratio, something else was the actual bottleneck and the restructuring was not the fix.',
      'I would flag the trade-off before doing it, not after: if another part of the codebase needs a whole `Tick` at a time — serialising it to a downstream feed, say — that path now has to reassemble one from two or more arrays, or the type has to keep both a row-oriented and a column-oriented view in sync. A change that speeds up one hot loop should not be allowed to quietly make every other loop worse.',
    ],
  },

  exercise: [
    'Build the file above with `g++ -O2 -o soa soa.cpp` and run it — the SoA sum should finish several times faster on real hardware despite doing identical arithmetic on identical values.',
    'Run `perf stat -e cache-misses,instructions,cycles ./soa` and compute instructions-per-cycle for the run. Then comment out one of the two sums, rebuild, and rerun so each phase gets its own clean counter reading, and compare them directly.',
    "Change `sum_price_aos` to instead sum three fields — `price + qty + filled` — per order, and time the equivalent three-array SoA version against it. The gap should shrink, because array-of-structs is now paying for a much larger fraction of every line it fetches. Find, on your own machine, roughly how many fields per record it takes before array-of-structs stops losing.",
  ],
};
