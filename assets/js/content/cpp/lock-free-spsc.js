import { Region, Cells, Cell, Box, Arrow, Text, Tag } from '../../viz/primitives.js';

/* ------------------------------------------------------------------
   One ring of 8 slots. head/tail pointer tags float above/below the
   slot they currently name, and because they keep the same key across
   steps they slide along the ring rather than jumping — that motion
   is the whole point of a ring buffer.
   ------------------------------------------------------------------ */
const CAP = 8;
const SLOT = { x: 88, y: 190, w: 60, h: 50, gap: 8 };
const slotX = (i) => SLOT.x + i * (SLOT.w + SLOT.gap);

const ring = (values) => [
  Region({ x: 68, y: 168, w: 576, h: 116, key: 'ring', label: 'RING BUFFER — capacity 8, mask = 7', tone: 'stack' }),
  ...Cells({ key: 'slot', x: SLOT.x, y: SLOT.y, dir: 'row', w: SLOT.w, h: SLOT.h, gap: SLOT.gap, values }),
];

const headPtr = (idx) =>
  Tag({ key: 'headPtr', x: slotX(idx) + SLOT.w / 2 - 22, y: SLOT.y - 30, w: 44, text: 'head', tone: 'highlight' });
const tailPtr = (idx) =>
  Tag({ key: 'tailPtr', x: slotX(idx) + SLOT.w / 2 - 22, y: SLOT.y + SLOT.h + 10, w: 44, text: 'tail', tone: 'owned' });

const headCell = (v, tone = 'highlight') =>
  Cell({ key: 'headCell', x: 20, y: 60, w: 78, h: 40, name: 'head', value: String(v), tone });
const tailCell = (v, tone = 'owned') =>
  Cell({ key: 'tailCell', x: 20, y: 300, w: 78, h: 40, name: 'tail', value: String(v), tone });

const roles = () => [
  Text({ key: 'roleP', x: 59, y: 32, text: 'PRODUCER', anchor: 'middle', size: 10, mono: true, tone: 'highlight', opacity: 0.85 }),
  Text({ key: 'roleC', x: 59, y: 352, text: 'CONSUMER', anchor: 'middle', size: 10, mono: true, tone: 'owned', opacity: 0.85 }),
];

const empty = { value: '·', tone: 'neutral', opacity: 0.35 };
const own = (v) => ({ value: v, tone: 'owned' });
const gone = (v) => ({ value: v, tone: 'moved' });

export default {
  oneLiner:
    'A ring buffer between exactly one producer and one consumer, made safe with no lock at all because a release/acquire pair on the two cursors is enough.',

  whyJob:
    'This is the single most common live-coding exercise at a firm that touches market data: implement the queue that sits under every feed handler, on a whiteboard, correctly, in twenty minutes. Getting the empty/full check or the ordering wrong is the most common way to fail it.',

  mentalModel:
    'A rotating conveyor belt with exactly one person loading it and one unloading it, each watching only the *other person\'s last confirmed position* rather than reaching over to inspect items directly. Because there is only ever one writer for each cursor, neither person ever needs to negotiate or retry — they just need to publish their new position in a way the other is guaranteed to see, which is exactly what a release store paired with an acquire load buys you for free.',

  scene: {
    id: 'spsc-ring',
    title: 'One producer, one consumer, two cursors',
    width: 720,
    height: 400,
    legend: [
      { tone: 'owned', label: 'live, unread' },
      { tone: 'moved', label: 'consumed — reusable' },
      { tone: 'highlight', label: 'just written / just read' },
    ],
    steps: [
      {
        say: 'One array, one producer that only ever writes `head`, one consumer that only ever writes `tail`. That split — one writer per cursor — is what lets this queue skip locks and compare-and-swap loops entirely.',
        mark: ['9', '10'],
        shapes: () => [...ring(Array(CAP).fill(empty)), ...roles(), headPtr(0), tailPtr(0), headCell(0), tailCell(0)],
      },
      {
        say: 'Producer writes \'A\' into slot 0 — an ordinary, non-atomic write — then release-stores the new `head`. Publishing the slot and publishing the index happen together: the release is what makes the write visible, not the write itself.',
        mark: ['21', '22'],
        focus: ['slot.0', 'headCell', 'headPtr'],
        shapes: () => [
          ...ring([own('A'), empty, empty, empty, empty, empty, empty, empty]),
          ...roles(),
          headPtr(1),
          tailPtr(0),
          headCell(1, 'highlight'),
          tailCell(0),
        ],
      },
      {
        say: 'Consumer acquire-loads `head`, sees it is ahead of `tail`, and only *then* reads slot 0. That ordering is not optional — it is the one thing standing between this code and a read of a slot the producer has not finished writing yet.',
        mark: ['27', '28', '29', '30'],
        predict: {
          ask: 'Why must the consumer\'s load of `head` in `pop()` use acquire rather than relaxed?',
          options: [
            { label: 'Relaxed would risk a torn read of the index itself', correct: false },
            { label: 'Acquire is what guarantees the slot write from push() is visible before this read of it', correct: true },
            { label: 'It is only a style convention — relaxed works identically here', correct: false },
          ],
          because:
            'The index itself is a small integer and would be atomic either way — that was never the risk. The real risk is `buf_[tail]`, an ordinary non-atomic array element. Only the acquire load, paired with the producer\'s release store of `head`, creates a happens-before edge that makes the producer\'s write to that slot visible before the consumer reads it. Drop to relaxed on either side and reading `buf_[tail]` becomes an honest data race, even though `head` and `tail` stay perfectly atomic.',
        },
        focus: ['slot.0', 'headCell', 'tailCell'],
        shapes: () => [
          ...ring([gone('A'), empty, empty, empty, empty, empty, empty, empty]),
          ...roles(),
          headPtr(1),
          tailPtr(1),
          headCell(1),
          tailCell(1, 'highlight'),
        ],
      },
      {
        say: '`head == tail`. The consumer\'s next acquire-load of `head` reads 1, compares equal to its own `tail`, and returns "empty" without touching `buf_` at all — there is nothing unread to race against.',
        mark: ['27', '28'],
        shapes: () => [
          ...ring([gone('A'), empty, empty, empty, empty, empty, empty, empty]),
          ...roles(),
          headPtr(1),
          tailPtr(1),
          headCell(1),
          tailCell(1),
          Tag({ key: 'emptyTag', x: 300, y: 224, text: 'empty — nothing to read', tone: 'moved' }),
        ],
      },
      {
        say: 'Seven more pushes later, `head` has wrapped past the end of the array back to slot 0 — `(head + 1) & 7`, one instruction, because 8 is a power of two. The old \'A\' at slot 0 is safely overwritten with \'I\': it was popped three steps ago, so it is outside the live range.',
        mark: ['16', '21', '22'],
        focus: ['slot.0', 'slot.7', 'headCell', 'headPtr'],
        shapes: () => [
          ...ring([own('I'), gone('B'), gone('C'), own('D'), own('E'), own('F'), own('G'), own('H')]),
          ...roles(),
          headPtr(1),
          tailPtr(3),
          headCell(9, 'highlight'),
          tailCell(3),
          Tag({ key: 'wrapTag', x: 300, y: 356, text: 'head wrapped: index shown is head & 7', tone: 'highlight' }),
        ],
      },
      {
        say: 'The queue is now full by the ring\'s own definition: `(head + 1) & 7 == tail`. A naive `push()` would check this by loading the real `tail` — an atomic, but one written by a different core — on every single call, even on the millions of calls where there is obviously room.',
        mark: ['15', '17', '18'],
        focus: ['expensiveArrow', 'tailCell'],
        shapes: () => [
          ...ring([own('I'), gone('B'), gone('C'), own('D'), own('E'), own('F'), own('G'), own('H')]),
          ...roles(),
          headPtr(1),
          tailPtr(3),
          headCell(9),
          tailCell(3, 'highlight'),
          Box({ key: 'checkBox', x: 130, y: 56, w: 190, h: 44, label: 'if (next == tail_.load(acquire))', labelSize: 10, mono: true, tone: 'highlight', dashed: true }),
          Arrow({ key: 'expensiveArrow', from: [225, 100], to: [59, 300], shape: 'curve', bend: -40, tone: 'highlight', label: 'cross-core, every push' }),
        ],
      },
      {
        say: 'Cache to cache, that check costs tens of nanoseconds — and it runs on every push. Caching a local, non-atomic copy of `tail` turns the common case into a plain register comparison, and only falls back to the real load when the cache says "maybe full."',
        mark: ['11', '17', '18', '19'],
        focus: ['cacheBox', 'checkBox2'],
        shapes: () => [
          ...ring([own('I'), gone('B'), gone('C'), own('D'), own('E'), own('F'), own('G'), own('H')]),
          ...roles(),
          headPtr(1),
          tailPtr(3),
          headCell(9),
          tailCell(3),
          Box({ key: 'cacheBox', x: 130, y: 40, w: 190, h: 54, label: 'producer local', sub: 'cachedTail_ = 3', tone: 'neutral', dashed: true }),
          Box({ key: 'checkBox2', x: 130, y: 108, w: 190, h: 40, label: 'if (next == cachedTail_)', labelSize: 10, mono: true, tone: 'owned', dashed: true }),
          Tag({ key: 'cheapTag', x: 130, y: 154, text: 'no cross-core read on this path', tone: 'owned' }),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'spsc_queue.h',
    source: `#include <array>
#include <atomic>
#include <cstddef>

template <typename T, size_t Capacity>
class SpscQueue {
    static_assert((Capacity & (Capacity - 1)) == 0, "capacity must be a power of two");
    std::array<T, Capacity> buf_;
    std::atomic<size_t> head_{0};   // next slot to write — producer only
    std::atomic<size_t> tail_{0};   // next slot to read  — consumer only
    size_t cachedTail_ = 0;         // producer's stale local copy

public:
    bool push(const T& v) {
        size_t head = head_.load(std::memory_order_relaxed);
        size_t next = (head + 1) & (Capacity - 1);
        if (next == cachedTail_) {                       // maybe full
            cachedTail_ = tail_.load(std::memory_order_acquire);
            if (next == cachedTail_) return false;        // really full
        }
        buf_[head] = v;                                    // plain write
        head_.store(next, std::memory_order_release);       // publish
        return true;
    }

    bool pop(T& out) {
        size_t tail = tail_.load(std::memory_order_relaxed);
        if (tail == head_.load(std::memory_order_acquire)) return false; // empty
        out = buf_[tail];
        tail_.store((tail + 1) & (Capacity - 1), std::memory_order_release);
        return true;
    }
};

int main() {
    SpscQueue<int, 8> q;
    q.push(42);
    int v = 0;
    q.pop(v);
}`,
    annotations: [
      { lines: '9-10', text: 'One writer per cursor. This is the entire reason SPSC needs no compare-and-swap loop anywhere — MPMC, where multiple threads race to advance the same cursor, is a different and harder problem.' },
      { lines: '17-20', text: 'The cheap check runs first, against a local copy that costs nothing to read. The real, cross-core load only happens on the rare call where the cheap check says "maybe full" — this is the cursor-caching optimisation.' },
      { lines: '21-22', text: 'Order matters: write the slot, then release the new `head`. Reversed, the consumer could see `head` advance and read a slot that has not been written yet.' },
      { lines: '27-28', text: 'This acquire load is the pairing partner for line 22\'s release. Without it, the read of `buf_[tail]` two lines down would race the producer\'s write with no ordering at all.' },
    ],
  },

  deeper: [
    'The one-writer-per-cursor structure is what makes SPSC categorically simpler than a general lock-free queue. `head_` is written only by the producer, so its own `load(relaxed)` inside `push()` never needs to be anything stronger — a thread always sees its own prior writes in program order, atomics or not. The acquire is needed only where a thread reads a cursor *the other thread* owns, which is exactly `head_.load(acquire)` in `pop()` and `tail_.load(acquire)` in `push()`, and nowhere else.',
    'What the release/acquire pair actually buys you is visibility of `buf_`, not of the index. The index is a `size_t`, naturally atomic-sized on every relevant target regardless of ordering. The payload, `buf_[i]`, is an ordinary array element with no atomicity of its own — its safety is borrowed entirely from the happens-before edge the index\'s release/acquire creates, precisely as in the atomics lesson\'s release/acquire scene.',
    '`head_` and `tail_` should themselves live on separate cache lines (`alignas(std::hardware_destructive_interference_size)` on each), or every push and pop bounces one line between the two cores regardless of how clever the cursor caching is — the caching optimisation reduces how often the *far* cursor is read, but the *near* cursor is still written on every single call and will false-share with its neighbor if they are adjacent. This is the same mechanism as the false sharing lesson, just applied to the two fields that make this queue lock-free in the first place.',
    'The economics of the caching trick: a cross-core acquire load that misses the writing core\'s cache costs tens of nanoseconds — call it a few dozen to a couple of hundred cycles depending on topology. A feed handler pushing tens of millions of messages a second cannot spend that on every single push just to confirm "yes, there is still room," which is true the overwhelming majority of the time. Caching turns that into a branch-predictable local comparison and defers the real, expensive load to the rare call where the queue is genuinely close to full.',
    'This exact structure — array, two atomic cursors, release/acquire, cursor caching — appears almost unchanged in kernel-bypass NIC ring drivers, the LMAX Disruptor, and most in-house feed handlers. An interviewer who asks for a lock-free queue is very often asking for precisely this, including the empty/full disambiguation and the correct orderings, inside a twenty-minute whiteboard window.',
  ],

  gotchas: [
    'Marking every load and store `seq_cst` "to be safe" is not wrong, but it is not free either — on ARM and POWER it adds real fence instructions that acquire/release for this specific single-producer/single-consumer pattern does not need. Know that acquire/release is sufficient here and be ready to say why.',
    'Forgetting to separate `head_` and `tail_` onto different cache lines turns an otherwise-correct lock-free queue into a false-sharing bottleneck — "lock-free" describes the synchronization strategy, not the cache behaviour.',
    'The cached cursor must only ever gate the decision to do a fresh, real load — never stand in for the actual full/empty check itself. Trusting a stale `cachedTail_` as the final answer instead of refreshing it can let `push()` silently overwrite a slot the consumer has not read yet.',
    'Capacity must be an actual power of two for `& (Capacity - 1)` to equal `% Capacity`. A capacity template argument that is not a power of two makes the mask wrong and the `static_assert` exists specifically to catch that at compile time rather than at 2 a.m.',
    'This design is SPSC only. Two producers calling `push()` concurrently both read the same `head_`, both compute the same `next`, and both write `buf_[head]` — that is a genuine race with no fix short of switching to compare-and-swap on `head_`, which is a different, more expensive queue.',
  ],

  interview: {
    q: 'Design a lock-free single-producer, single-consumer queue. Walk me through `push` and `pop`, and tell me what memory ordering you would use and why.',
    a: [
      'A fixed-size array plus two cursors, `head_` for the next slot to write and `tail_` for the next slot to read, each a `std::atomic<size_t>` but each written by exactly one of the two threads. `push` writes the slot, then release-stores the new `head_`; `pop` acquire-loads `head_`, and only if it differs from its own `tail_` does it read the slot and release-store the new `tail_`. Empty is `head_ == tail_`; full is defined by convention — I\'d keep one slot permanently unused so `(head + 1) & mask == tail` unambiguously means full, avoiding a separate counter that both threads would otherwise need to touch.',
      'The ordering choice is acquire/release, not relaxed and not seq_cst. Relaxed would leave the index atomic but the slot read racing the slot write with no ordering at all — a real data race on the payload even though the index itself never tears. Seq_cst would be correct too, just paying for a fence on weak hardware that this specific single-writer-per-cursor pattern does not need; acquire/release is the precise tool for "this thread\'s prior writes must be visible once that thread\'s specific read happens," which is exactly the shape of this problem.',
      'The detail that shows real experience rather than a memorized template: caching the *other* thread\'s cursor locally. The producer keeps a stale, non-atomic `cachedTail_` and only falls back to a real, cross-core `tail_.load(acquire)` when the cheap local check suggests the queue might be full — because a cross-core cache-line fetch costs tens of nanoseconds and a naive implementation pays it on every single push, most of which are nowhere near full.',
    ],
  },

  exercise: [
    'Implement the `SpscQueue` above, spin up one producer thread and one consumer thread pushing and popping a few million integers, and confirm every value comes out in order with none dropped or duplicated. Then replace every `acquire`/`release` with `relaxed` and rerun under `-fsanitize=thread`. ThreadSanitizer will flag a race on `buf_` even though `head_` and `tail_` remain perfectly atomic the whole time — direct proof that atomicity of the index and visibility of the payload are two separate guarantees.',
    'Restore the correct orderings, then benchmark push/pop throughput with the `cachedTail_` optimisation as written versus a version that always calls `tail_.load(acquire)` directly on every push. The gap between the two numbers is the cross-core read cost you are actually paying for.',
  ],
};
