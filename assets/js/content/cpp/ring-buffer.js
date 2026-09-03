import { Region, Cells, Cell, Text, Tag } from '../../viz/primitives.js';

/* ------------------------------------------------------------------
   Same ring geometry throughout. write/read pointer tags keep their
   keys across steps so they slide along the ring rather than jump —
   the wraparound step is the payoff of that choice.
   ------------------------------------------------------------------ */
const CAP = 8;
const SLOT = { x: 88, y: 190, w: 60, h: 50, gap: 8 };
const slotX = (i) => SLOT.x + i * (SLOT.w + SLOT.gap);

const ring = (values, label = 'RING BUFFER — capacity 8, mask = 7') => [
  Region({ x: 68, y: 168, w: 576, h: 116, key: 'ring', label, tone: 'stack' }),
  ...Cells({ key: 'slot', x: SLOT.x, y: SLOT.y, dir: 'row', w: SLOT.w, h: SLOT.h, gap: SLOT.gap, values }),
];

const writePtr = (idx) =>
  Tag({ key: 'writePtr', x: slotX(idx) + SLOT.w / 2 - 24, y: SLOT.y - 30, w: 48, text: 'write', tone: 'highlight' });
const readPtr = (idx) =>
  Tag({ key: 'readPtr', x: slotX(idx) + SLOT.w / 2 - 22, y: SLOT.y + SLOT.h + 10, w: 44, text: 'read', tone: 'owned' });

const writeCell = (v, tone = 'highlight') =>
  Cell({ key: 'writeVal', x: 20, y: 60, w: 78, h: 40, name: 'write', value: String(v), tone });
const readCell = (v, tone = 'owned') =>
  Cell({ key: 'readVal', x: 20, y: 300, w: 78, h: 40, name: 'read', value: String(v), tone });

const empty = { value: '·', tone: 'neutral', opacity: 0.35 };
const own = (v) => ({ value: v, tone: 'owned' });
const gone = (v) => ({ value: v, tone: 'moved' });

export default {
  oneLiner:
    'A fixed-size array that wraps instead of shifting elements — and why its capacity should always be a power of two.',

  whyJob:
    'This is the structure underneath every bounded queue in a low-latency system, and "implement one from scratch" is a standard warm-up question. The trap almost everyone falls into live is the empty-versus-full check — get it wrong and your buffer either drops the last item silently or reports full when it is empty.',

  mentalModel:
    'A circular parking garage with one ramp for cars coming in and one for cars going out. When the last space loops back around to the first, cars keep driving in circles instead of the garage growing a new level. The reason the capacity is always a power of two is a smaller trick: wrapping around a clock face — mod 12 — takes real division, but wrapping around a power-of-two ring is just *clearing the high bits*, one AND instruction instead of one division.',

  scene: {
    id: 'ring-basics',
    title: 'Two indices chasing each other around a fixed array',
    width: 720,
    height: 400,
    legend: [
      { tone: 'owned', label: 'live, unread' },
      { tone: 'moved', label: 'popped — reusable' },
      { tone: 'highlight', label: 'just written' },
    ],
    steps: [
      {
        say: 'A plain 8-element array, nothing rotating about it yet — just two indices, both starting at 0, that will do all the work.',
        mark: ['9', '10'],
        shapes: () => [...ring(Array(CAP).fill(empty)), writePtr(0), readPtr(0), writeCell(0), readCell(0)],
      },
      {
        say: 'Five pushes: A through E land in slots 0 through 4, and `write` moves on by one each time. `read` has not moved — nothing has been consumed yet.',
        mark: ['16', '17', '18'],
        focus: ['slot.0', 'slot.1', 'slot.2', 'slot.3', 'slot.4', 'writeVal', 'writePtr'],
        shapes: () => [
          ...ring([own('A'), own('B'), own('C'), own('D'), own('E'), empty, empty, empty]),
          writePtr(5),
          readPtr(0),
          writeCell(5),
          readCell(0),
        ],
      },
      {
        say: 'Three pops: A, B, C come out in the order they went in, and `read` catches up behind `write` by three. D and E are still sitting there, live and unread.',
        mark: ['24', '25', '26'],
        focus: ['slot.0', 'slot.1', 'slot.2', 'readVal', 'readPtr'],
        shapes: () => [
          ...ring([gone('A'), gone('B'), gone('C'), own('D'), own('E'), empty, empty, empty]),
          writePtr(5),
          readPtr(3),
          writeCell(5),
          readCell(3),
        ],
      },
      {
        say: 'Four more pushes — F, G, H, I — run `write` off the end of the array and back to the start: `(write + 1) & 7` instead of `% 8`, one AND instruction. Slot 0\'s old \'A\' is safely overwritten, because it was popped two steps ago and sits outside the live range.',
        mark: ['16', '17', '18'],
        focus: ['slot.5', 'slot.6', 'slot.7', 'slot.0', 'writeVal'],
        shapes: () => [
          ...ring([own('I'), gone('B'), gone('C'), own('D'), own('E'), own('F'), own('G'), own('H')]),
          writePtr(1),
          readPtr(3),
          writeCell(9),
          readCell(3),
          Tag({ key: 'wrapTag', x: 300, y: 356, text: 'write wrapped: shown index is write & 7', tone: 'highlight' }),
        ],
      },
      {
        say: 'Six pops later, `read` has caught all the way up to `write` — both now sit on slot 1. The array itself cannot tell you what that means.',
        mark: [],
        predict: {
          ask: 'The stored `write` and `read` indices are now equal. What does that tell you about the buffer?',
          options: [
            { label: 'It is definitely empty', correct: false },
            { label: 'It is definitely full', correct: false },
            { label: 'Nothing — this exact picture is also what a full buffer looks like', correct: true },
          ],
          because:
            'If a naive implementation stores `write` and `read` only as values already wrapped into [0, 8), then draining the buffer completely and filling it completely both end with `write == read` at the same slot — the two histories are indistinguishable from the indices alone. A single equality check has thrown away the one bit of information that would tell them apart.',
        },
        focus: ['writePtr', 'readPtr', 'writeVal', 'readVal'],
        shapes: () => [
          ...ring([gone('I'), gone('B'), gone('C'), gone('D'), gone('E'), gone('F'), gone('G'), gone('H')]),
          writePtr(1),
          readPtr(1),
          writeCell(1),
          readCell(1),
          Text({ key: 'ambig', x: 360, y: 356, text: 'same slot, same value — empty or full, indistinguishable', size: 11, mono: true, anchor: 'middle', tone: 'freed', opacity: 0.9 }),
        ],
      },
      {
        say: 'Rewind to the six-items moment — but now `write` and `read` are never wrapped in storage, only masked at the point of indexing into the array. Size falls straight out of subtraction, and the two histories above stop being confusable: 9 − 3 is unambiguously 6, never 0.',
        mark: ['10', '11', '17'],
        focus: ['writeVal', 'readVal', 'sizeVal'],
        shapes: () => [
          ...ring([own('I'), gone('B'), gone('C'), own('D'), own('E'), own('F'), own('G'), own('H')]),
          writePtr(1),
          readPtr(3),
          writeCell(9),
          readCell(3),
          Cell({ key: 'sizeVal', x: 610, y: 60, w: 92, h: 40, name: 'write − read', value: '6', tone: 'owned' }),
          Text({ key: 'wIdx', x: 20, y: 112, text: 'slot = write & 7 = 1', size: 10, mono: true, opacity: 0.6 }),
          Text({ key: 'rIdx', x: 20, y: 352, text: 'slot = read & 7 = 3', size: 10, mono: true, opacity: 0.6 }),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'ring_buffer.h',
    source: `#include <array>
#include <cstddef>
#include <cstdio>

template <typename T, size_t Capacity>
class RingBuffer {
    static_assert((Capacity & (Capacity - 1)) == 0, "capacity must be a power of two");
    std::array<T, Capacity> buf_{};
    size_t write_ = 0;   // next slot to write, always in [0, Capacity)
    size_t read_  = 0;   // next slot to read,  always in [0, Capacity)
    size_t size_  = 0;   // how many live elements — resolves the ambiguity

public:
    bool push(const T& v) {
        if (size_ == Capacity) return false;      // full
        buf_[write_] = v;
        write_ = (write_ + 1) & (Capacity - 1);    // mask, not modulo
        ++size_;
        return true;
    }

    bool pop(T& out) {
        if (size_ == 0) return false;              // empty
        out = buf_[read_];
        read_ = (read_ + 1) & (Capacity - 1);
        --size_;
        return true;
    }

    size_t size() const { return size_; }
};

int main() {
    RingBuffer<char, 8> rb;
    for (char c : {'A', 'B', 'C', 'D', 'E'}) rb.push(c);
    char out;
    rb.pop(out);
    printf("%c, size=%zu\\n", out, rb.size());
}`,
    annotations: [
      { lines: '9-11', text: 'Three fields, not two. `size_` is the extra bit of state that makes `write_ == read_` unambiguous — it costs one word and one increment or decrement per operation.' },
      { lines: '15, 23', text: 'The check is against `size_`, never a comparison of `write_` and `read_` directly — that comparison is exactly the trap from the scene above.' },
      { lines: '17, 25', text: '`& (Capacity - 1)` is the wraparound. It only equals `% Capacity` because `Capacity` is a power of two — try it with capacity 10 and it silently corrupts the sequence.' },
      { lines: '7', text: 'The `static_assert` catches a non-power-of-two capacity at compile time, not at 2 a.m. in production.' },
    ],
  },

  deeper: [
    'The mask-versus-modulo difference is not cosmetic. `%` against a runtime or non-power-of-two value is a genuine division instruction, historically tens of cycles; `&` against `Capacity - 1` is a single-cycle bitwise AND. For a fixed, compile-time power-of-two capacity a good compiler will turn `%` into the equivalent mask automatically — but relying on that is fragile the moment `Capacity` stops being a compile-time constant, and explicit masking is the version every low-latency codebase actually writes.',
    'There are three standard ways to resolve the empty/full ambiguity, and this lesson uses the first. **Keep a count**: an explicit `size_` field, as above — simple, cheap, one extra word. **Waste a slot**: never let `write_` catch `read_` by defining full as `(write_ + 1) & mask == read_`; capacity is then effectively `Capacity - 1` usable slots and no extra field is needed. **Free-running indices**: never wrap `write_`/`read_` in storage at all, only mask them at the point of indexing into the array; `size_` becomes `write_ - read_` directly, computed on demand, and the subtraction is correct even across unsigned integer wraparound after enormous run counts.',
    'That third option is the one the concurrent version of this structure — the lock-free SPSC queue — actually uses, and the reason is concurrency, not cleverness. A shared `size_` field would need writes from *both* the producer and the consumer, which reintroduces exactly the kind of shared mutable state a lock-free queue is built to avoid; free-running indices or the wasted-slot trick let each thread own one cursor outright and never touch the other\'s.',
    'A ring buffer\'s contents are contiguous in the underlying array, which is the same cache-friendliness argument as any array over a linked structure: iterating the live range touches consecutive memory, and the whole structure fits in a handful of cache lines rather than being scattered across the heap.',
    'Capacity is a real trade, not just "bigger is safer." Too small and the buffer fills under bursty load, forcing you to drop, block, or grow it; too large wastes memory and hurts cache locality of the part that actually matters — the small working set of slots being touched right now, not the whole allocation.',
  ],

  gotchas: [
    'Comparing `write_ == read_` directly for "full" without a count, a wasted slot, or free-running indices is the classic bug — that check always reports empty, even when the buffer is completely full, and pushes silently start overwriting unread data.',
    'Using `%` with a capacity that is not actually a power of two — often introduced later when someone "rounds up" a configured size without updating the mask logic — corrupts the index sequence silently rather than crashing, which is what makes it expensive to find.',
    'The wasted-slot resolution has its own off-by-one: usable capacity is `Capacity - 1`, not `Capacity`. Code that asserts or expects the full `Capacity` items will overflow by exactly one under load.',
    'Free-running `size_ = write_ - read_` relies on unsigned wraparound arithmetic. Doing the equivalent with signed integers and manually correcting negative results is an easy way to introduce the exact bug the unsigned version avoids for free.',
    'This structure is single-threaded. Sharing one instance across threads without synchronization is an ordinary data race on `write_`, `read_`, and the array — nothing here is safe to call concurrently, which is exactly the gap the lock-free SPSC lesson fills with atomics.',
  ],

  interview: {
    q: 'Implement a fixed-capacity ring buffer with `push` and `pop`. What is the first bug most people ship, and how do you avoid it?',
    a: [
      'The bug is checking `write_ == read_` and calling that "empty," with no other state. That comparison is true both when the buffer has nothing in it and when it is completely full, because both states leave the two indices pointing at the same slot — the indices alone do not carry enough information to tell the histories apart.',
      'I would resolve it with an explicit `size_` counter incremented on push and decremented on pop, checked against `Capacity` and `0` respectively instead of comparing the two indices to each other. It costs one extra word and one extra increment or decrement per call, which is a fine trade for a single-threaded structure.',
      'The detail worth adding unprompted: I would use `& (Capacity - 1)` rather than `% Capacity` for the wraparound, which requires `Capacity` to be a power of two — worth a `static_assert` — and I would mention that the concurrent version of this same structure cannot use a shared `size_` field at all, because that field would need writes from both a producer and a consumer thread; it uses free-running indices or a wasted slot instead, so each thread can own exactly one cursor.',
    ],
  },

  exercise: [
    'Implement the `RingBuffer` above and write a test that pushes exactly `Capacity` items, confirms push number `Capacity + 1` fails, then pops exactly `Capacity` items back out in the same order they went in.',
    'Then deliberately break it: change `& (Capacity - 1)` to `% Capacity` and instantiate with `Capacity = 10`. Print the sequence of physical slot indices `push` writes to across 15 pushes and compare it against what you expected — the corruption is silent until you look for it, which is the whole point.',
  ],
};
