import { Box, Cells, Region, Arrow, Text, Tag } from '../../viz/primitives.js';

/* ------------------------------------------------------------------
   Two rows, hand-placed rather than scaled 1px-per-byte: at true
   scale a 1-byte field would be a few pixels wide and unreadable.
   Every box still carries its real wire offset and size in `sub`,
   so the numbers are honest even though the widths are not to scale.
   ------------------------------------------------------------------ */
const ROW_H = 50;
const HDR_Y = 128;
const MSG_Y = 248;

const HDR = {
  session:  { x: 40,  w: 108, off: '0',  size: '10B' },
  sequence: { x: 156, w: 96,  off: '10', size: '8B' },
  count:    { x: 260, w: 52,  off: '18', size: '2B' },
  len:      { x: 320, w: 52,  off: '20', size: '2B' },
};

const MSG = {
  type:     { x: 40,  w: 40,  off: '22', size: '1B' },
  other:    { x: 88,  w: 118, off: '23', size: '10B' },
  orderRef: { x: 214, w: 108, off: '33', size: '8B' },
  side:     { x: 330, w: 40,  off: '41', size: '1B' },
  shares:   { x: 378, w: 66,  off: '42', size: '4B' },
  stock:    { x: 452, w: 108, off: '46', size: '8B' },
  price:    { x: 568, w: 66,  off: '54', size: '4B' },
};

/** One field box, positioned from the hand-placed tables above. */
const hdrField = (key, name, tone = 'stack') => {
  const f = HDR[key];
  return Box({
    key: `h.${key}`,
    x: f.x,
    y: HDR_Y,
    w: f.w,
    h: ROW_H,
    label: name,
    sub: `off ${f.off} · ${f.size}`,
    tone,
    mono: true,
    labelSize: 11,
  });
};

const msgField = (key, name, tone = 'owned') => {
  const f = MSG[key];
  return Box({
    key: `m.${key}`,
    x: f.x,
    y: MSG_Y,
    w: f.w,
    h: ROW_H,
    label: name,
    sub: `off ${f.off} · ${f.size}`,
    tone,
    mono: true,
    labelSize: 10.5,
  });
};

const bufNote = () =>
  Text({
    key: 'bufnote',
    x: 40,
    y: 96,
    text: 'uint8_t buf[2048];  — stack, allocated once, reused for every packet',
    size: 11,
    mono: true,
    opacity: 0.55,
  });

export default {
  oneLiner:
    'Turning a raw UDP packet into typed order data with zero allocations, and why the bytes lie about their own numbers until you swap them.',

  whyJob:
    'This exact exercise, or something a hair away from it, is the most-issued take-home in the industry, because it tests three things at once: fixed-layout binary parsing, code that never calls `malloc` on the hot path, and honest handling of a dropped packet instead of pretending UDP never loses one.',

  mentalModel:
    'A market data feed is not a stream of objects — it is a delivery manifest where "the fourth line is always the weight in kilograms," agreed in advance and never labelled inline. Parsing one is not deserialising JSON; it is *naming byte ranges* in a buffer that already exists, which is exactly why it costs nothing to do.',

  scene: {
    id: 'itch-parse',
    title: 'One UDP payload, named one field at a time',
    width: 720,
    height: 430,
    legend: [
      { tone: 'stack', label: 'MoldUDP64 header field' },
      { tone: 'owned', label: 'ITCH message field' },
      { tone: 'highlight', label: 'in focus this step' },
      { tone: 'freed', label: 'missing / gap' },
    ],
    steps: [
      {
        say: 'One `recvfrom()` call drops the packet into a buffer that already existed before the packet arrived. Nothing has been parsed yet — it is 58 undifferentiated bytes, and the size on the wire is the only thing known about them.',
        mark: [],
        shapes: () => [
          Box({
            key: 'raw',
            x: 40,
            y: 248,
            w: 610,
            h: 50,
            label: '58 bytes — no structure yet',
            tone: 'neutral',
            dashed: true,
            mono: true,
            labelSize: 12,
          }),
          bufNote(),
        ],
      },
      {
        say: 'The first 20 bytes are always the same shape, on every packet, from every venue that speaks MoldUDP64: a session id, a sequence number, and a count of how many messages ride inside. Peeling it off is naming, not copying — the bytes never move.',
        mark: ['6-13'],
        shapes: () => [
          hdrField('session', 'session'),
          hdrField('sequence', 'sequence'),
          hdrField('count', 'msg count'),
          Box({
            key: 'rest',
            x: 320,
            y: 128,
            w: 330,
            h: 50,
            label: 'message block',
            tone: 'neutral',
            dashed: true,
            mono: true,
            labelSize: 11,
          }),
          bufNote(),
        ],
      },
      {
        say: 'Inside the block, every message is prefixed by its own 2-byte length. Reading it means walking a pointer forward by that many bytes — there is no scan, no copy, and nothing is ever handed to `new`.',
        mark: ['36-44'],
        shapes: () => [
          hdrField('session', 'session'),
          hdrField('sequence', 'sequence'),
          hdrField('count', 'msg count'),
          hdrField('len', 'length', 'highlight'),
          Box({
            key: 'msgblock',
            x: 40,
            y: 248,
            w: 594,
            h: 50,
            label: 'message (36B)',
            tone: 'owned',
            mono: true,
            labelSize: 12,
          }),
        ],
      },
      {
        say: 'Name the ranges inside that block and you have a message: a one-byte type, ten bytes we are not parsing today, an 8-byte order reference, one byte for side, then shares, the stock symbol, and the price. Not one bit moved — only names were added.',
        mark: ['27-35'],
        predict: {
          ask: 'Instead of the offsets shown, you write `auto* m = reinterpret_cast<const ItchAddOrder*>(msg);` and read `m->orderRef` directly, with the struct declared `#pragma pack(1)`. What actually happens?',
          options: [
            { label: 'Nothing — pack(1) makes any cast onto raw bytes safe', correct: false },
            { label: 'It fails to compile, because you cannot pack a struct containing a uint64_t', correct: false },
            { label: 'orderRef starts at byte 11 inside the struct, an offset that is not a multiple of 8, so the load is unaligned — slow on x86, undefined behaviour everywhere, and a fault on stricter hardware', correct: true },
          ],
          because:
            'Packing removes the padding that normally keeps every member aligned — it does not grant the pointer permission to be unaligned in memory. `msg` itself came from an offset inside a UDP buffer with no alignment guarantee at all, so `m->orderRef` is an 8-byte access that can legally start on any byte. `memcpy` has none of this problem, because it is defined for every alignment by the language itself.',
        },
        shapes: () => [
          msgField('type', 'type'),
          msgField('other', 'other', 'neutral'),
          msgField('orderRef', 'orderRef', 'highlight'),
          msgField('side', 'side'),
          msgField('shares', 'shares'),
          msgField('stock', 'stock'),
          msgField('price', 'price'),
        ],
      },
      {
        say: 'ITCH is big-endian on the wire, like most exchange protocols going back decades. x86 is little-endian. Read those four price bytes in the order they arrived and you get a number nothing like the real price.',
        mark: ['15-24', '32'],
        focus: ['m.price', 'rawbytes.0', 'rawbytes.1', 'rawbytes.2', 'rawbytes.3', 'hostbytes.0', 'hostbytes.1', 'hostbytes.2', 'hostbytes.3', 'swaparrow', 'rawlbl', 'hostlbl', 'valtext'],
        shapes: () => [
          msgField('type', 'type'),
          msgField('other', 'other', 'neutral'),
          msgField('orderRef', 'orderRef'),
          msgField('side', 'side'),
          msgField('shares', 'shares'),
          msgField('stock', 'stock'),
          msgField('price', 'price', 'highlight'),
          Text({ key: 'rawlbl', x: 300, y: 328, text: 'as received — network order', size: 10.5, mono: true, opacity: 0.6, anchor: 'middle' },),
          ...Cells({ key: 'rawbytes', x: 250, y: 336, values: ['00', '00', '27', '10'], w: 34, h: 30, gap: 2, tone: 'miss' }),
          Arrow({ key: 'swaparrow', from: [317, 372], to: [317, 404], shape: 'straight', bend: 0, tone: 'highlight', label: 'reverse the bytes' }),
          ...Cells({ key: 'hostbytes', x: 250, y: 404, values: ['10', '27', '00', '00'], w: 34, h: 30, gap: 2, tone: 'hit' }),
          Text({ key: 'hostlbl', x: 300, y: 440, text: 'host order — now a real integer', size: 10.5, mono: true, opacity: 0.6, anchor: 'middle' },),
          Text({ key: 'valtext', x: 480, y: 420, text: '10000  ×  $0.0001  =  $1.0000', size: 14, mono: true, weight: 700, tone: 'owned', anchor: 'middle' },),
        ],
      },
      {
        say: 'Every datagram carries the sequence number of its first message. 1000, 1001, 1002 arrive in order. Then a packet says 1004. 1003 did not necessarily arrive late — it may never arrive — and from here those two situations look identical.',
        mark: [],
        predict: {
          ask: 'You just applied sequence 1002 to the order book, and the next packet you read says 1004. What do you do?',
          options: [
            { label: 'Apply 1004 and move on — UDP drops packets, this is expected', correct: false },
            { label: 'Discard 1004 and wait silently for 1003 to show up', correct: false },
            { label: 'Buffer 1004, request retransmission of 1003 over the feed\'s recovery channel, and only release 1004 once 1003 has been applied or the request times out', correct: true },
          ],
          because:
            'MoldUDP64 has no retransmission of its own — that is deliberately pushed up to a separate request/response channel, precisely because the order book is a state machine. Applying 1004 before 1003 does not crash anything; it silently produces a book with the wrong liquidity at some price level, and nothing downstream will tell you that happened.',
        },
        shapes: () => [
          Box({ key: 's1000', x: 190, y: 248, w: 74, h: 50, label: '1000', tone: 'hit', mono: true, labelSize: 13 }),
          Box({ key: 's1001', x: 268, y: 248, w: 74, h: 50, label: '1001', tone: 'hit', mono: true, labelSize: 13 }),
          Box({ key: 's1002', x: 346, y: 248, w: 74, h: 50, label: '1002', tone: 'hit', mono: true, labelSize: 13 }),
          Box({ key: 's1003', x: 424, y: 248, w: 74, h: 50, label: '1003', sub: 'never arrived?', tone: 'freed', dashed: true, mono: true, labelSize: 13 }),
          Box({ key: 's1004', x: 502, y: 248, w: 74, h: 50, label: '1004', tone: 'highlight', mono: true, labelSize: 13 }),
          Tag({ key: 'gaptag', x: 424, y: 312, text: 'gap detected — do not apply 1004 yet', tone: 'freed' }),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'itch_parser.cpp',
    source: `#include <cstdint>
#include <cstring>
#include <cstdio>

// Wire layout: no padding allowed, or every offset below is wrong.
#pragma pack(push, 1)
struct MoldHeader {
    uint8_t  session[10];
    uint64_t sequence;        // big-endian on the wire
    uint16_t messageCount;
};
#pragma pack(pop)
static_assert(sizeof(MoldHeader) == 20, "wire size must match exactly");
// memcpy, not a cast: msg+11 is not guaranteed 8-byte aligned in buf.
static inline uint64_t be64(const uint8_t* p) {
    uint64_t v;
    std::memcpy(&v, p, 8);
    return __builtin_bswap64(v);
}
static inline uint32_t be32(const uint8_t* p) {
    uint32_t v;
    std::memcpy(&v, p, 4);
    return __builtin_bswap32(v);
}

// ITCH 'A' — Add Order. Offsets match the real ITCH 5.0 layout.
void handle_add_order(const uint8_t* msg, uint16_t len) {
    if (len < 36) return;
    uint64_t orderRef = be64(msg + 11);
    uint8_t  side     = msg[19];             // 'B' or 'S', 1 byte, no swap
    uint32_t shares   = be32(msg + 20);
    uint32_t price    = be32(msg + 32);      // 4 implied decimal places
    printf("%c %llu %u @ %.4f\\n", side,
           (unsigned long long)orderRef, shares, price / 10000.0);
}
void handle_datagram(const uint8_t* buf, size_t n) {
    uint16_t count = (uint16_t(buf[18]) << 8) | buf[19];
    const uint8_t* p = buf + 20;             // past the MoldUDP64 header
    for (uint16_t i = 0; i < count && p < buf + n; ++i) {
        uint16_t msgLen = (uint16_t(p[0]) << 8) | p[1];
        const uint8_t* msg = p + 2;
        if (msg[0] == 'A') handle_add_order(msg, msgLen);
        p += 2 + msgLen;                     // next message, zero allocation
    }
}`,
    annotations: [
      {
        lines: '6-13',
        text: '`#pragma pack(1)` makes the struct match the wire byte for byte. The `static_assert` turns that claim into a compile error the moment it stops being true — for instance if a member gets reordered by an edit six months from now.',
      },
      {
        lines: '15-24',
        text: 'Fields are pulled out with `memcpy` and swapped by hand rather than read through a pointer cast, because `msg + 11` is not promised to be 8-byte aligned — it is 11 bytes into a buffer whose starting address you do not control. `memcpy` is defined for any alignment; a `uint64_t*` dereference is not.',
      },
      {
        lines: '29-32',
        text: 'These four lines are the entire schema for one message type. No lookup table, no virtual dispatch, no allocation — arithmetic on a pointer that was already valid.',
      },
      {
        lines: '36-44',
        text: '`p` never resets and the buffer is never copied. Each iteration reads the 2-byte length that precedes every message and jumps past it; the parser\'s only piece of state is this one pointer.',
      },
    ],
  },

  deeper: [
    'The reason none of this allocates is a latency budget, not a style preference. A feed handler that receives a packet, parses it and updates an order book is typically trying to do the whole thing in a few hundred nanoseconds to a few microseconds. `malloc` and `new` are not usually slow in the average case, but they are unpredictable in the tail — a lock, a free-list walk, occasionally a call into the kernel for more pages — and tail latency is precisely what this workload cannot tolerate. The fix is to never call them in the hot path at all: one fixed buffer, reused for every packet, and messages that are read in place rather than copied into freshly allocated objects.',
    'The alignment hazard is the same one from struct layout, just self-inflicted through casting instead of through padding. `reinterpret_cast<const T*>(ptr)` followed by a dereference asks the CPU to load `sizeof(T)` bytes starting exactly at `ptr`, and the load instruction assumes that address obeys `T`\'s alignment. A `uint8_t*` walking through a UDP buffer gives you no such guarantee — it can point anywhere. On x86-64 an unaligned scalar load is legal and merely slower; on stricter architectures, and for SIMD loads even on x86, it can fault outright. `memcpy` into a local variable sidesteps the question entirely, because copying single bytes has no alignment requirement, and modern compilers recognise the pattern and emit the same load instructions a cast would have — so the safe version is not even slower once optimisations are on.',
    'Endianness is a historical accident that never went away. Network protocols standardised on big-endian in the 1980s, x86 stayed little-endian, and every wire parser since has had to reconcile the two. `__builtin_bswap32`/`64` (GCC and Clang) or `_byteswap_ulong` (MSVC) compile to a single `bswap` instruction — there is no performance argument for hand-rolling the shifts, only a correctness one for getting the byte count right. The bug this produces when you forget it is the dangerous kind: the resulting number is not garbage, it is a different, plausible-looking number. A forgotten swap on a price field does not crash; it prints a value that is merely very wrong, and it is easy to not notice until a fill happens at it.',
    'A sequence gap is a control-flow decision, not a logging event. NASDAQ and most other venues run MoldUDP64 in pairs — an "A" line and a "B" line, carrying an identical sequenced stream over two independently routed multicast paths, specifically so that a packet lost on one line is very likely present on the other. A real feed handler keeps a small reorder buffer per line and a single next-expected-sequence counter; it takes whichever line delivers a given sequence number first and drops the duplicate that shows up on the other line moments later. Only when *both* lines have failed to deliver a sequence number for some timeout does it fall back to the venue\'s separate TCP retransmission-request channel, which is slow by comparison and exists as the backstop, not the primary path.',
    'Everything above assumes the length field itself is trustworthy, and a take-home grader will specifically check whether you assumed that. `msgLen` comes off the wire like everything else; a corrupted or truncated packet can claim a length that walks `p` past the end of the buffer. The one-line fix — checking `p + 2 + msgLen <= buf + n` before dereferencing `msg` — is exactly the kind of line an interviewer looks for and a candidate under time pressure forgets.',
  ],

  gotchas: [
    'Forgetting `#pragma pack(1)` (or `__attribute__((packed))` on the equivalent GCC/Clang struct) means `sizeof` on your wire struct includes host padding that does not exist on the wire — your by-hand offset math and the struct\'s actual layout silently disagree, and it can compile and mostly work for months before a compiler upgrade or a new field exposes it.',
    'Casting a raw buffer pointer to a packed struct pointer and dereferencing a multi-byte member is undefined behaviour even with packing applied, because packing only removes the compiler\'s padding — it does not change what the CPU requires of the address itself. Build with `-fsanitize=undefined,alignment` while developing and this class of bug reports itself.',
    'Byte-swapping a field that does not need it, or forgetting to swap one that does, both produce a number that looks like data rather than an error. Keep a single table of which fields are multi-byte network-order integers and which are raw bytes (like a 1-byte side flag or an ASCII symbol) — do not trust memory for this under deadline pressure.',
    'Trusting `msgLen` without a bounds check turns one corrupted packet into an out-of-bounds read that walks off the end of your buffer and starts interpreting unrelated memory as message data. AddressSanitizer catches this instantly in a test; a naive production build silently reads garbage or crashes far from the cause.',
    'Silently skipping a sequence gap instead of buffering and requesting retransmission produces a book that is wrong but not obviously wrong — price levels that never clear, or liquidity that appears to vanish and later reappears when a later message happens to fix it by coincidence. Nothing in the process crashes to tell you this happened; you find it in a P&L reconciliation days later.',
  ],

  interview: {
    q: 'Design a parser for a fixed-layout binary market data feed delivered over UDP. It must not allocate on the hot path and must not perform a single unaligned load. Walk through it.',
    a: [
      'Start with the buffer: one fixed-size array, declared once outside the receive loop, reused for every datagram — never a `std::vector` sized per packet, never a `new` per message. `recvfrom` writes into it directly. Everything downstream operates on pointers and offsets into that same memory; nothing is copied until a field is pulled out into a local variable for use.',
      'Parsing is peeling off known-size ranges in sequence: the transport header first (session, sequence number, message count, in MoldUDP64\'s case), then for each message a 2-byte length prefix that tells you exactly how far to advance the pointer for the next one. Every multi-byte field is extracted with `memcpy` into a local of the right width and then byte-swapped with a `bswap` intrinsic, never read through a cast pointer — a cast onto an arbitrary buffer offset has no alignment guarantee, and an 8-byte load at an odd address is either slow or a fault depending on the target, and undefined behaviour either way in the language.',
      'The detail that separates a memorised answer from an understood one is what happens when the sequence number does not increment by exactly one: that is not an edge case to handle eventually, it is the core of the design. The handler tracks the next expected sequence number, and on a gap it must not apply anything past it — it buffers what arrived, requests retransmission of the missing range, and only then replays in order. On a UDP feed with no gap handling, a parser that looks correct in every unit test will produce a subtly wrong order book the first time a real network drops a packet, which given enough runtime is not an if.',
    ],
  },

  exercise: [
    'Write the parser above in full, including the length-checked loop and a `handle_add_order` that prints each field. Feed it a byte buffer you construct by hand in a unit test — including one deliberately truncated message — and confirm the bounds check rejects it instead of reading past the end.',
    'Then compile with `-fsanitize=undefined,alignment -g` and deliberately introduce the bug from the predict question: `reinterpret_cast` the message pointer to a packed struct and read `orderRef` directly instead of using `be64`. Run it and read what UBSan reports at the exact offset where it happens. Remove the cast, go back to `memcpy`, and confirm the report disappears — seeing the sanitizer catch the exact bug you were warned about is worth more than reading the warning.',
    'Finally, simulate a dropped packet: build a small sequence of fake datagrams with sequence numbers 1000 through 1005, remove 1003 from the list, and feed them through a handler that tracks next-expected-sequence. Confirm it detects the gap on the first message after the hole rather than after the fact, and print what it would send on a retransmission-request channel.',
  ],
};
