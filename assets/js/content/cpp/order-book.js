import { Region, Box, Cells, Arrow, Text, Tag } from '../../viz/primitives.js';

/* ------------------------------------------------------------------
   Two ladders, three price levels each, three order slots per level.
   Every level keeps a fixed-length slot array (blank slots for unused
   capacity) so the engine's key-based diff never has to reinterpret
   what a shifted index means — a cancelled order goes blank *in place*
   and gets relinked around, it never causes its neighbours to slide.
   ------------------------------------------------------------------ */
const BID = { x: 16, y: 56, w: 330, h: 300 };
const ASK = { x: 366, y: 56, w: 330, h: 300 };
const ROWS_Y = [104, 180, 256];
const BID_PRICE_X = 54;
const ASK_PRICE_X = 404;
const BID_Q_X = 130;
const ASK_Q_X = 480;
const CELL = { w: 42, h: 34, gap: 6 };

const regions = () => [
  Region({ key: 'bidRegion', ...BID, label: 'BIDS — descending', tone: 'stack' }),
  Region({ key: 'askRegion', ...ASK, label: 'ASKS — ascending', tone: 'heap' }),
];

const slot = (v) =>
  v === null
    ? { value: '', tone: 'neutral', dashed: true, opacity: 0.28 }
    : { value: String(v), tone: v.tone ?? 'owned' };

const level = (side, i, price, qtys, priceTone = 'neutral') => {
  const priceX = side === 'bid' ? BID_PRICE_X : ASK_PRICE_X;
  const qX = side === 'bid' ? BID_Q_X : ASK_Q_X;
  const y = ROWS_Y[i];
  return [
    Box({ key: `${side}p.${i}`, x: priceX, y, w: 64, h: CELL.h, label: price, tone: priceTone, mono: true, labelSize: 12 }),
    ...Cells({
      key: `${side}q.${i}`,
      x: qX,
      y,
      w: CELL.w,
      h: CELL.h,
      gap: CELL.gap,
      values: qtys.map((v) => (typeof v === 'object' && v !== null ? v : slot(v))),
    }),
  ];
};

const bestTag = (key, side, i, text) =>
  Tag({
    key,
    x: (side === 'bid' ? BID_PRICE_X : ASK_PRICE_X) + 2,
    y: ROWS_Y[i] - 24,
    text,
    tone: 'highlight',
  });

const cellCenter = (side, row, col) => {
  const qX = side === 'bid' ? BID_Q_X : ASK_Q_X;
  return [qX + col * (CELL.w + CELL.gap) + CELL.w / 2, ROWS_Y[row] + CELL.h / 2];
};

export default {
  oneLiner:
    'The most common take-home in trading: an order book that adds, cancels and matches without ever scanning a list.',

  whyJob:
    'This exact exercise — "build me a limit order book" — is handed to nearly every quant developer candidate. Graders are not scoring whether it matches; they are scoring whether add, cancel and best-bid-or-offer are all *O(1)*, because a `std::map<price, level>` version that "works" is the single most common way to fail this interview.',

  mentalModel:
    'A price level is a *deli counter ticket queue*: whoever pulled the lowest ticket number is served first, no matter how many people are behind them. The book itself is a *coat check with one numbered peg per price* — you never search the room for a coat, you go straight to peg 500, because the tick *is* the peg number. That direct indexing is the whole trick: a `std::map` makes you compare your way down a tree to find the shelf; an array just multiplies.',

  scene: {
    id: 'order-book-mechanics',
    title: 'Price-time priority, three operations',
    width: 720,
    height: 400,
    legend: [
      { tone: 'owned', label: 'resting order' },
      { tone: 'highlight', label: 'newly arrived / being touched' },
      { tone: 'moved', label: 'filled or cancelled — gone' },
    ],
    steps: [
      {
        say: 'Two ladders. Bids get worse going down on the left, asks get worse going down on the right. Each price level is a plain FIFO queue — first order in at that price is first order filled at that price.',
        mark: ['5-22'],
        shapes: () => [
          ...regions(),
          ...level('bid', 0, '100.25', [120, 80, 45]),
          ...level('bid', 1, '100.24', [60, 90, null]),
          ...level('bid', 2, '100.23', [200, null, null]),
          ...level('ask', 0, '100.26', [90, 60, null]),
          ...level('ask', 1, '100.27', [150, null, null]),
          ...level('ask', 2, '100.28', [40, null, null]),
          bestTag('bestBid', 'bid', 0, 'best bid'),
          bestTag('bestAsk', 'ask', 0, 'best ask'),
        ],
      },
      {
        say: 'A new buy order for 30 arrives at 100.24, an existing level. It does not jump the queue — it lands in the first open slot after everyone already resting there, at the *back*.',
        mark: ['26-30'],
        focus: ['bidq.1.0', 'bidq.1.1', 'bidq.1.2'],
        shapes: () => [
          ...regions(),
          ...level('bid', 0, '100.25', [120, 80, 45]),
          ...level('bid', 1, '100.24', [60, 90, { value: '30', tone: 'highlight' }]),
          ...level('bid', 2, '100.23', [200, null, null]),
          ...level('ask', 0, '100.26', [90, 60, null]),
          ...level('ask', 1, '100.27', [150, null, null]),
          ...level('ask', 2, '100.28', [40, null, null]),
          bestTag('bestBid', 'bid', 0, 'best bid'),
          bestTag('bestAsk', 'ask', 0, 'best ask'),
        ],
      },
      {
        say: 'Now cancel the order worth 80, sitting in the *middle* of the 100.25 queue. The id map hands back a pointer straight to its node — nothing walks the level to find it.',
        mark: ['31-36'],
        focus: ['idmap', 'bidq.0.1', 'arrToCancel'],
        predict: {
          ask: "The id map hands you the node for the order worth 80 directly, wherever it sits in its level's queue. What does cancelling it cost?",
          options: [
            { label: 'O(n): the level still has to be scanned to find the node', correct: false },
            { label: 'O(1): one hash lookup, then two pointer rewrites — no matter how deep in the queue it is', correct: true },
            { label: 'O(log n): the level is stored as a balanced tree', correct: false },
          ],
          because:
            '`byId` returns the `Order*` directly; `unlink` only rewrites its two neighbours\' `prev`/`next`. Cancelling the order 500 places deep in a queue costs exactly the same two pointer writes as cancelling the front one — depth never enters into it.',
        },
        shapes: () => [
          ...regions(),
          Box({ key: 'idmap', x: 172, y: 14, w: 168, h: 30, label: 'byId[7] → node*', tone: 'highlight', mono: true, labelSize: 11 }),
          Arrow({ key: 'arrToCancel', from: [220, 44], to: cellCenter('bid', 0, 1), tone: 'highlight', shape: 'curve', bend: 30 }),
          ...level('bid', 0, '100.25', [120, { value: '80', tone: 'highlight' }, 45]),
          ...level('bid', 1, '100.24', [60, 90, { value: '30', tone: 'owned' }]),
          ...level('bid', 2, '100.23', [200, null, null]),
          ...level('ask', 0, '100.26', [90, 60, null]),
          ...level('ask', 1, '100.27', [150, null, null]),
          ...level('ask', 2, '100.28', [40, null, null]),
          bestTag('bestBid', 'bid', 0, 'best bid'),
          bestTag('bestAsk', 'ask', 0, 'best ask'),
        ],
      },
      {
        say: 'The slot goes empty in place — nothing shifts. `unlink` rewrote exactly two pointers so the order worth 120 now points directly at the order worth 45, skipping straight over the gap.',
        mark: ['19-20'],
        focus: ['bidq.0.0', 'bidq.0.1', 'bidq.0.2', 'relink'],
        shapes: () => [
          ...regions(),
          Arrow({ key: 'relink', from: cellCenter('bid', 0, 0), to: cellCenter('bid', 0, 2), tone: 'highlight', shape: 'curve', bend: -32, label: 'next' }),
          ...level('bid', 0, '100.25', [120, null, 45]),
          ...level('bid', 1, '100.24', [60, 90, { value: '30', tone: 'owned' }]),
          ...level('bid', 2, '100.23', [200, null, null]),
          ...level('ask', 0, '100.26', [90, 60, null]),
          ...level('ask', 1, '100.27', [150, null, null]),
          ...level('ask', 2, '100.28', [40, null, null]),
          bestTag('bestBid', 'bid', 0, 'best bid'),
          bestTag('bestAsk', 'ask', 0, 'best ask'),
        ],
      },
      {
        say: 'A marketable sell for 250 arrives — it crosses the spread, so it walks the bid side from the best price down. It clears 100.25 completely (120 then 45, both gone), then hits 100.24: the front order for 60 is fully filled, and the next one is only partly — cut from 90 down to 65.',
        mark: [],
        focus: ['bidp.0', 'bidq.0.0', 'bidq.0.2', 'bidq.1.0', 'bidq.1.1', 'sweep'],
        shapes: () => [
          ...regions(),
          Arrow({ key: 'sweep', from: [200, 30], to: [86, 100], tone: 'highlight', thick: true, shape: 'curve', bend: -10, label: 'SELL 250, marketable' }),
          ...level('bid', 0, '100.25', [{ value: '', tone: 'moved' }, null, { value: '', tone: 'moved' }], 'moved'),
          ...level('bid', 1, '100.24', [{ value: '', tone: 'moved' }, { value: '65', tone: 'highlight' }, { value: '30', tone: 'owned' }]),
          ...level('bid', 2, '100.23', [200, null, null]),
          ...level('ask', 0, '100.26', [90, 60, null]),
          ...level('ask', 1, '100.27', [150, null, null]),
          ...level('ask', 2, '100.28', [40, null, null]),
          bestTag('bestBid', 'bid', 0, 'best bid'),
          bestTag('bestAsk', 'ask', 0, 'best ask'),
        ],
      },
      {
        say: '100.25 is now completely empty, so `best bid` cannot stay pointed at it. It steps down to the next occupied level — one pointer update, not a re-scan of the whole ladder.',
        mark: [],
        focus: ['bestBid', 'bidp.0', 'bidp.1'],
        shapes: () => [
          ...regions(),
          Box({ key: 'bidp.0', x: BID_PRICE_X, y: ROWS_Y[0], w: 64, h: CELL.h, label: '100.25', tone: 'moved', dashed: true, mono: true, labelSize: 12 }),
          Text({ key: 'emptyLabel', x: BID_Q_X, y: ROWS_Y[0] + CELL.h / 2, text: 'level empty', size: 11, mono: true, tone: 'moved', opacity: 0.8 }),
          ...level('bid', 1, '100.24', [{ value: '', tone: 'moved' }, { value: '65', tone: 'owned' }, { value: '30', tone: 'owned' }], 'highlight'),
          ...level('bid', 2, '100.23', [200, null, null]),
          ...level('ask', 0, '100.26', [90, 60, null]),
          ...level('ask', 1, '100.27', [150, null, null]),
          ...level('ask', 2, '100.28', [40, null, null]),
          bestTag('bestBid', 'bid', 1, 'best bid'),
          bestTag('bestAsk', 'ask', 0, 'best ask'),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'order_book.cpp',
    source: `#include <cstdio>
#include <unordered_map>
#include <vector>

struct Order {
    int id, qty, tick;
    Order* prev = nullptr;
    Order* next = nullptr;
};
struct PriceLevel {
    Order* head = nullptr;   // front: fills first
    Order* tail = nullptr;   // back: newest order
    void push_back(Order* o) {
        o->prev = tail;
        if (tail) tail->next = o; else head = o;
        tail = o;
    }
    void unlink(Order* o) {
        if (o->prev) o->prev->next = o->next; else head = o->next;
        if (o->next) o->next->prev = o->prev; else tail = o->prev;
    }
};
struct OrderBook {
    std::vector<PriceLevel> bids;            // indexed by price tick
    std::unordered_map<int, Order*> byId;    // id -> intrusive node, O(1)
    void add(int id, int tick, int qty) {
        Order* o = new Order{id, qty, tick};
        bids[tick].push_back(o);
        byId[id] = o;
    }
    void cancel(int id) {                    // one lookup, no scan
        Order* o = byId.at(id);
        bids[o->tick].unlink(o);
        byId.erase(id);
        delete o;
    }
};

int main() {
    OrderBook book;
    book.bids.resize(1000);
    book.add(1, 500, 100);
    book.cancel(1);
    printf("cancel done\\n");
}`,
    annotations: [
      {
        lines: '24',
        text: 'A flat `std::vector` indexed directly by price tick. Indexing is one multiply-add; a `std::map<price, level>` would cost `O(log n)` comparisons and a pointer chase through a red-black tree for the same lookup.',
      },
      {
        lines: '10-22',
        text: '`PriceLevel` is an intrusive doubly-linked list — `push_back` always lands at `tail`, the back of the queue, which is what "price-time priority" means for adding.',
      },
      {
        lines: '25',
        text: '`byId` maps an order id straight to its node. Combined with `tick` stored on the `Order` itself, `cancel` never has to know which level to search.',
      },
      {
        lines: '31-36',
        text: 'One hash lookup plus two pointer rewrites — never a walk of the queue the order lives in, no matter how many orders are ahead of it.',
      },
    ],
  },

  deeper: [
    'The tick is an integer, not the price itself: `tick = round((price - minPrice) / tickSize)`. Choosing the array size means choosing a price band up front — typically a few thousand ticks either side of the last trade — which is a real constraint a `std::map` does not have. In exchange you get an index that is a single multiply-add instead of a tree walk, and the levels near the touch, the ones actually being read on every single message, sit in a handful of contiguous cache lines rather than scattered across heap-allocated tree nodes.',
    'The intrusive list costs exactly one allocation per order — the `Order` object itself doubles as its own list node, `prev` and `next` living right next to `qty`. There is no separate `Node` wrapper, and no second allocation the way `std::list<Order>` would need. That matters at the message rates real venues push: allocating twice per order instead of once is a doubled trip through `malloc` on every single add.',
    'The "best bid" pointer in the scene is only *amortised* O(1), and a careful answer says so unprompted. Draining one level and stepping to the next is one comparison; draining a long unbroken run of empty levels in a thin, wide market means walking each of them. Real implementations bound this with an auxiliary occupancy structure — commonly a bitset, one bit per tick, with a hardware `find-first-set` (`__builtin_ctzll` on x86) locating the next non-empty level in a handful of instructions regardless of how many ticks are empty in between.',
    'Time priority within a level is what makes the FIFO queue non-negotiable rather than a design choice: it is the rule that rewards being first to quote a price, and any structure that reorders resting orders at the same price — a heap, an unordered container — breaks the fairness guarantee the exchange is contractually offering, not just the performance target.',
    'A production book pools `Order` objects instead of calling `new`/`delete` per message, for the same reason a hot loop avoids `malloc`: a general-purpose allocator takes a lock and walks free lists, and at order-of-magnitude tens of thousands of messages per second that cost dominates everything else in this file. A fixed-size slab keyed by a free-list of recycled slots turns `new Order{...}` into a pointer bump.',
  ],

  gotchas: [
    'Forgetting to advance the best-bid/ask pointer when its level fully drains is the classic bug: the book keeps quoting a price with nothing resting on it, and every "is this marketable" check downstream is now wrong.',
    'A price that converts to a tick outside the array\'s allocated range is not a graceful failure — `std::vector::operator[]` is unchecked, so it reads or writes past the end of the buffer silently. Use `.at()` while developing, and decide explicitly what happens at the edge of your price band before going live.',
    'Reaching for `std::map<double, PriceLevel>` because comparing prices "just works" defeats the entire point of the exercise — floating-point prices as map keys also risk two economically identical prices comparing unequal, which ticks avoid entirely by construction.',
    'A resting order and an incoming order from the same participant matching each other — a self-trade — is not handled by anything in this file. It is a near-guaranteed interview follow-up: most real books either reject the incoming order or cancel the resting one rather than let it execute.',
    'Draining a level to empty and then adding a new order at that exact price without re-establishing `head`/`tail` correctly is an easy way to leave a dangling pointer — `unlink` on the last order in a level must set both to `nullptr`, not just one.',
  ],

  interview: {
    q: 'Design a limit order book with O(1) add, O(1) cancel and O(1) best-bid/ask. Walk me through the data structures, and tell me where the O(1) claim actually holds.',
    a: [
      'Price levels live in a flat array indexed by an integer tick rather than the price itself, which turns level lookup into a multiply-add instead of the `O(log n)` comparisons a `std::map` would cost. Each level is an intrusive doubly-linked list of orders — the order object holds its own `prev`/`next`, so there is one allocation per order, not two — and a hash map from order id to a raw pointer into that list. Adding appends at the tail; cancelling looks the id up in the hash map and unlinks the two neighbouring pointers directly, without walking the queue.',
      'I would be explicit that "best bid is O(1)" is the weakest of the three claims. Reading the cached best-bid pointer is O(1). *Maintaining* it is only amortised O(1): when the top level drains, something has to find the next occupied one, and in a thin market that can mean stepping past several empty levels in a row. A bitset with one bit per tick and a hardware find-first-set instruction bounds that step to a small constant number of instructions regardless of how many ticks are empty, which is the detail that turns "usually fast" into an actual guarantee.',
      'The part that separates a memorised answer from an understood one is naming the trade the tick array makes: you commit to a price band and pay for the whole array up front, in exchange for O(1) indexing and cache-friendly locality near the touch, where nearly all the traffic is. A `std::map` gives you an unbounded price range for free and loses on every single access. Given the choice between "always correct, sometimes slow" and "fast, with an explicit bound I chose," the second is what the interview is actually testing for.',
    ],
  },

  exercise: [
    'Implement the `OrderBook` above in full: add a `match(int qty)` that walks levels from the best price, consuming resting orders in queue order and partially filling the last one it touches, exactly like the scene. Confirm with a test that FIFO order is preserved — the first order added at a price is always the first one filled.',
    'Then prove the O(1) cancel claim yourself: build a level with 100,000 resting orders, and time cancelling the very first one against cancelling the very last one. The two numbers should be indistinguishable — if cancelling the last one is dramatically slower, you have accidentally written a scan somewhere.',
  ],
};
