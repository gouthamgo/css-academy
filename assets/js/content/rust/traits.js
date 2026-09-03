import { Region, Frame, Box, Arrow, Text, Tag } from '../../viz/primitives.js';

/* Shared geometry. Two unrelated types sit at the far edges; the trait
   card lives between them and belongs to neither. That gap is the lesson. */
const TYPE_W = 210;
const LEFT_X = 34;
const RIGHT_X = 476;
const TYPE_Y = 76;
const IMPL_Y = 210;

const CARD = { x: 270, y: 64, w: 180, h: 132 };

const orderType = (tone = 'neutral') =>
  Frame({
    key: 'order',
    x: LEFT_X,
    y: TYPE_Y,
    w: TYPE_W,
    label: 'struct Order',
    tone,
    vars: [
      { name: 'price', value: 'u64' },
      { name: 'qty', value: 'u32' },
    ],
  });

const heartbeatType = (tone = 'neutral') =>
  Frame({
    key: 'hb',
    x: RIGHT_X,
    y: TYPE_Y,
    w: TYPE_W,
    label: 'struct Heartbeat',
    tone,
    vars: [
      { name: 'seq', value: 'u64' },
      { name: 'ts', value: 'u64' },
    ],
  });

/* The contract itself: a card, drawn as a box with hand-placed lines so
   the required half and the defaulted half read as two separate things. */
const traitCard = (tone = 'highlight') => [
  Box({ key: 'card', ...CARD, tone, dashed: true }),
  Text({
    key: 'card.t',
    x: 360,
    y: 84,
    text: 'trait Describe',
    size: 12.5,
    anchor: 'middle',
    mono: true,
    weight: 700,
  }),
  Text({ key: 'card.h1', x: 282, y: 100, text: 'required:', size: 9, mono: true, opacity: 0.55 }),
  Text({ key: 'card.l1', x: 282, y: 114, text: 'fn describe(&self);', size: 10.5, mono: true }),
  Text({ key: 'card.l2', x: 282, y: 130, text: 'fn zero() -> Self;', size: 10.5, mono: true }),
  Text({ key: 'card.h2', x: 282, y: 148, text: 'default body:', size: 9, mono: true, opacity: 0.55 }),
  Text({ key: 'card.l3', x: 282, y: 162, text: 'fn kind(&self) {', size: 10.5, mono: true }),
  Text({ key: 'card.l4', x: 282, y: 176, text: '    "record"', size: 10.5, mono: true, opacity: 0.8 }),
  Text({ key: 'card.l5', x: 282, y: 190, text: '}', size: 10.5, mono: true, opacity: 0.8 }),
];

const implOrder = () =>
  Box({
    key: 'impl.o',
    x: LEFT_X,
    y: IMPL_Y,
    w: TYPE_W,
    h: 66,
    label: 'impl Describe for Order',
    labelSize: 10.5,
    mono: true,
    tone: 'owned',
    sub: 'writes all three',
  });

const implHb = () =>
  Box({
    key: 'impl.h',
    x: RIGHT_X,
    y: IMPL_Y,
    w: TYPE_W,
    h: 66,
    label: 'impl Describe for Heartbeat',
    labelSize: 10.5,
    mono: true,
    tone: 'owned',
    sub: 'kind() comes free',
  });

export default {
  oneLiner:
    'How Rust shares behaviour between types that know nothing about each other, and why nothing is inherited.',

  whyJob:
    'Traits are how every real Rust API is shaped — `Iterator`, `Serialize`, `From`, `Ord`. An interviewer will hand you a C++ class hierarchy and ask how you would model it in Rust; the answer is almost never "a base class", and knowing why is the point.',

  mentalModel:
    'A trait is a *certification*, not a bloodline. A restaurant does not have to be born into a family to get a food-safety certificate — an inspector shows up, checks it meets the listed requirements, and staples the certificate on. `impl Describe for Order` is that stapling: `Order` was already a complete type, and gains a certificate *afterwards* without changing its layout, its size, or anything it already did.',

  scene: {
    id: 'trait-contract',
    title: 'A contract stapled onto types that never met',
    width: 720,
    height: 420,
    legend: [
      { tone: 'highlight', label: 'the trait — a contract' },
      { tone: 'owned', label: 'a type that satisfies it' },
      { tone: 'freed', label: 'rejected by the compiler' },
    ],
    steps: [
      {
        say: 'Two structs written by two different people on two different days. No shared field, no shared header, no common ancestor. In C++ this is the point where you would start planning a base class.',
        mark: ['1', '4'],
        shapes: () => [orderType(), heartbeatType()],
      },
      {
        say: 'The trait is a separate declaration listing what a type must be able to do. It is not a type, it has no fields, and no value is ever of type `Describe`. It is a list of requirements plus, sometimes, ready-made implementations of them.',
        mark: ['6-15'],
        shapes: () => [orderType(), heartbeatType(), ...traitCard()],
      },
      {
        say: '`impl Describe for Order` is a third, separate item — not part of the struct and not part of the trait. It can live in another file. `Order` itself was not edited, recompiled differently, or made larger.',
        mark: ['17-21'],
        focus: ['order', 'impl.o', 'a.o', 'card'],
        shapes: () => [
          orderType('owned'),
          heartbeatType(),
          ...traitCard(),
          implOrder(),
          Arrow({
            key: 'a.o',
            from: [286, 196],
            to: [182, 208],
            shape: 'curve',
            bend: 26,
            tone: 'highlight',
            label: 'impl',
          }),
        ],
      },
      {
        say: '`Heartbeat` gets the same certificate independently. It writes `describe` and `zero`, and leaves `kind` out — so it silently picks up the default body from the trait. Neither type learned anything about the other in the process.',
        mark: ['23-27'],
        focus: ['hb', 'impl.h', 'a.h', 'card.l3', 'card.l4', 'card.l5'],
        shapes: () => [
          orderType('owned'),
          heartbeatType('owned'),
          ...traitCard(),
          implOrder(),
          implHb(),
          Arrow({
            key: 'a.o',
            from: [286, 196],
            to: [182, 208],
            shape: 'curve',
            bend: 26,
            tone: 'highlight',
            label: 'impl',
          }),
          Arrow({
            key: 'a.h',
            from: [434, 196],
            to: [538, 208],
            shape: 'curve',
            bend: -26,
            tone: 'highlight',
            label: 'impl',
          }),
        ],
      },
      {
        say: 'Now one function accepts both, because the bound `T: Describe` asks for the certificate rather than for an ancestor. The compiler stamps out a copy of `report` for each type, and each copy calls the right method by name — decided at compile time, no lookup at runtime.',
        mark: ['29-31'],
        predict: {
          ask: 'After `impl Describe for Order`, what is `size_of::<Order>()`?',
          options: [
            { label: '16 bytes — the same as before; the impl adds nothing', correct: true },
            { label: '24 bytes — a pointer to the trait is stored in the struct', correct: false },
            { label: 'It grows by 8 bytes for every trait Order implements', correct: false },
          ],
          because:
            'A trait impl is a compile-time fact about a type, not a field inside it. `Order` is 8 bytes of `price` plus 4 of `qty` plus 4 of padding, before and after. Nothing is added to the value — which is exactly why implementing twenty traits costs zero bytes at runtime.',
        },
        shapes: () => [
          orderType('owned'),
          heartbeatType('owned'),
          ...traitCard(),
          implOrder(),
          implHb(),
          Tag({ key: 'sz.o', x: LEFT_X, y: 176, text: 'size_of = 16 bytes', tone: 'owned' }),
          Tag({ key: 'sz.h', x: RIGHT_X, y: 176, text: 'size_of = 16 bytes', tone: 'owned' }),
          Box({
            key: 'gen',
            x: 230,
            y: 310,
            w: 260,
            h: 64,
            label: 'fn report<T: Describe>(&T)',
            labelSize: 10.5,
            mono: true,
            tone: 'heap',
            sub: 'takes either — no base class',
          }),
          Arrow({ key: 'g.o', from: [180, 278], to: [252, 310], shape: 'curve', bend: -22, tone: 'heap' }),
          Arrow({ key: 'g.h', from: [540, 278], to: [468, 310], shape: 'curve', bend: 22, tone: 'heap' }),
        ],
      },
      {
        say: 'The one restriction: an impl is only allowed if the trait or the type is defined in your crate. Otherwise two unrelated libraries could both claim to implement `Display for Vec<T>` and the linker would have no way to choose.',
        mark: [],
        shapes: () => [
          Region({ key: 'o.mine', x: 34, y: 64, w: 310, h: 150, label: 'YOUR CRATE', tone: 'owned' }),
          Region({ key: 'o.std', x: 376, y: 64, w: 310, h: 150, label: 'ANOTHER CRATE', tone: 'stack' }),
          Box({ key: 'o.t1', x: 56, y: 110, w: 130, h: 56, label: 'trait Describe', labelSize: 11, mono: true, tone: 'highlight' }),
          Box({ key: 'o.y1', x: 202, y: 110, w: 120, h: 56, label: 'struct Order', labelSize: 11, mono: true }),
          Box({ key: 'o.t2', x: 398, y: 110, w: 130, h: 56, label: 'trait Display', labelSize: 11, mono: true, tone: 'highlight' }),
          Box({ key: 'o.y2', x: 544, y: 110, w: 120, h: 56, label: 'Vec<T>', labelSize: 11, mono: true }),
          Box({
            key: 'o.v1',
            x: 40,
            y: 236,
            w: 640,
            h: 38,
            tone: 'owned',
            label: 'impl Describe for Vec<T>     allowed — the trait is yours',
            labelSize: 11,
            mono: true,
          }),
          Box({
            key: 'o.v2',
            x: 40,
            y: 282,
            w: 640,
            h: 38,
            tone: 'owned',
            label: 'impl Display for Order       allowed — the type is yours',
            labelSize: 11,
            mono: true,
          }),
          Box({
            key: 'o.v3',
            x: 40,
            y: 328,
            w: 640,
            h: 38,
            tone: 'freed',
            label: 'impl Display for Vec<T>      rejected — neither is yours',
            labelSize: 11,
            mono: true,
          }),
        ],
      },
      {
        say: 'The C++ answer to the same problem is inheritance, and the differences are not stylistic. You must own the type to give it a parent, the parent is chosen once and forever, and every object grows a hidden pointer whether or not you ever call through it.',
        mark: [],
        shapes: () => [
          Text({
            key: 'x.h',
            x: 40,
            y: 44,
            text: 'the same problem in C++: a type must be born under the base',
            size: 12,
            mono: true,
            tone: 'freed',
            weight: 650,
          }),
          Box({
            key: 'x.base',
            x: 268,
            y: 74,
            w: 184,
            h: 60,
            label: 'class Describable',
            labelSize: 11,
            mono: true,
            tone: 'stack',
            sub: 'virtual describe() = 0',
          }),
          Box({
            key: 'x.a',
            x: 70,
            y: 192,
            w: 190,
            h: 74,
            label: 'class Order',
            labelSize: 11.5,
            mono: true,
            tone: 'moved',
            sub: ': public Describable',
          }),
          Box({
            key: 'x.b',
            x: 460,
            y: 192,
            w: 190,
            h: 74,
            label: 'class Heartbeat',
            labelSize: 11.5,
            mono: true,
            tone: 'moved',
            sub: ': public Describable',
          }),
          Arrow({ key: 'x.e1', from: [286, 134], to: [180, 190], shape: 'curve', bend: 24, tone: 'moved' }),
          Arrow({ key: 'x.e2', from: [434, 134], to: [540, 190], shape: 'curve', bend: -24, tone: 'moved' }),
          Tag({ key: 'x.sz', x: 70, y: 274, text: 'size_of = 24 bytes (vptr added)', tone: 'freed' }),
          Text({ key: 'x.n1', x: 40, y: 322, text: 'you cannot give a parent to a type you did not write', size: 11.5, mono: true, opacity: 0.85 }),
          Text({ key: 'x.n2', x: 40, y: 344, text: 'the hierarchy is fixed at definition, once, forever', size: 11.5, mono: true, opacity: 0.85 }),
          Text({ key: 'x.n3', x: 40, y: 366, text: 'a trait can be added later, to any type, any number of times', size: 11.5, mono: true, tone: 'owned', weight: 650 }),
        ],
      },
    ],
  },

  code: {
    lang: 'rust',
    filename: 'main.rs',
    source: `struct Order { price: u64, qty: u32 }

#[derive(Debug, Default)]
struct Heartbeat { seq: u64, ts: u64 }

trait Describe {
    fn describe(&self) -> String;          // required, takes self

    fn zero() -> Self;                     // associated fn: no self

    fn kind(&self) -> &'static str {       // default body
        "record"
    }
}

impl Describe for Order {
    fn describe(&self) -> String { format!("{} @ {}", self.qty, self.price) }
    fn zero() -> Self { Order { price: 0, qty: 0 } }
    fn kind(&self) -> &'static str { "order" }
}

impl Describe for Heartbeat {
    fn describe(&self) -> String { format!("hb {} @ {}", self.seq, self.ts) }
    fn zero() -> Self { Heartbeat::default() }
    // kind() is deliberately absent — the default body is used
}

fn report<T: Describe>(x: &T) {
    println!("[{}] {}", x.kind(), x.describe());
}

fn main() {
    report(&Order { price: 10_150, qty: 5 });
    report(&Heartbeat::zero());
    println!("{:?}", Heartbeat::zero());   // Debug came from #[derive]
    println!("{}", std::mem::size_of::<Order>());   // 16, impls or not
}`,
    annotations: [
      {
        lines: '3',
        text: '`#[derive]` writes an `impl` for you. `Debug` and `Default` are ordinary traits — the macro just fills in the obvious body field by field, which is why it fails the moment a field does not implement them too.',
      },
      {
        lines: '8',
        text: '`zero` has no `self`, so it is an *associated function*, called as `Order::zero()` rather than on a value. `new` is the same thing by convention — Rust has no constructors, only associated functions returning `Self`.',
      },
      {
        lines: '10-12',
        text: 'A default body means implementers get this for free. It is how `Iterator` gives you seventy methods when you write one — and any implementer can still override it.',
      },
      {
        lines: '29',
        text: '`T: Describe` is a *bound*, not a base class. The compiler checks the bound once and then generates a separate copy of `report` per concrete `T`, each calling the right method directly.',
      },
    ],
  },

  deeper: [
    'A trait impl adds nothing to a value at runtime. There is no per-object trait table, no hidden field, no tag. `size_of::<Order>()` is 16 bytes whether it implements zero traits or forty. All the trait system does is teach the compiler that a particular method name resolves to a particular function body for a particular type, and that resolution is finished before the linker runs. This is the reason `impl Ord for MyKey` costs you nothing while `class MyKey : public Comparable` costs you eight bytes per object and an indirect call per comparison.',
    'Method resolution follows a fixed order and it is worth knowing, because the error messages assume you do. For `x.kind()` the compiler tries inherent methods on the type first (anything in a plain `impl Order { .. }` block), then trait methods for traits that are *in scope*. That last clause is the one that bites: an impl that exists but whose trait you have not imported is invisible, which is why you see `no method named read_exact found` and the fix is `use std::io::Read;`. The impl was always there — the name just was not.',
    'The orphan rule is coherence, not bureaucracy. Rust guarantees that for any (trait, type) pair there is at most one impl in the entire program, so `HashMap<K, V>` can rely on `K: Hash` meaning one specific hash function everywhere. If two crates could each write `impl Display for Vec<u8>`, a third crate depending on both would have two candidate bodies and no principled way to pick, and the answer would silently change when you reordered dependencies. The escape hatch is the newtype: `struct Bytes(Vec<u8>);` is your type, so you may implement anything on it.',
    'Blanket impls are where traits stop resembling interfaces at all. `impl<T: Display> ToString for T` in the standard library gives `to_string()` to every type that can already be displayed — one impl covering an unbounded set of types, written by someone who never heard of your type. There is no inheritance mechanism anywhere that can do that, and it is why the trait system feels different once it clicks: you are writing rules over types, not decorating individual ones.',
    'Supertraits look like inheritance and are not. `trait Ord: Eq` means "anything implementing `Ord` must also implement `Eq`", a requirement on implementers rather than a shared parent with shared data. `Ord` inherits no fields and no layout from `Eq`; it just gets to call `Eq` methods in its default bodies. A type still has exactly one layout, chosen by its own definition.',
  ],

  gotchas: [
    'A trait method is invisible unless the trait is in scope. The symptom is `no method named X found for struct Y` on a type you can see has the method — the fix is a `use` of the trait, not a change to the type.',
    'You cannot write `impl ForeignTrait for ForeignType`. The compiler says `only traits defined in the current crate can be implemented for types defined outside of the crate`, and the standard answer is a newtype wrapper, which costs zero bytes but does mean forwarding the methods you still want.',
    '`#[derive(PartialOrd)]` on a struct compares fields in *declaration order*, lexicographically. Reorder two fields for packing reasons and you silently change your sort order — a real source of bugs in order books, where reordering `price` and `timestamp` inverts priority.',
    'A default method body can only call other methods of the same trait and its supertraits. It cannot touch fields, because the trait has no idea what fields exist — this is the usual wall people hit when porting an abstract base class that had protected data.',
    '`impl Trait for &T` and `impl Trait for T` are different impls. Forgetting this is how you end up with a bound that is satisfied by `String` but not by `&String` and an error that seems to be about nothing.',
  ],

  interview: {
    q: 'I have a C++ hierarchy: an abstract `Instrument` base with `Equity`, `Future` and `Option` deriving from it. How would you model that in Rust, and what changes?',
    a: [
      'The first question I would ask is whether the set of instrument kinds is closed. If it is — and for a trading system it usually is — I would use an `enum` with three variants rather than a trait at all. That gives me exhaustive `match`, so adding a fourth instrument produces compile errors at every site that needs updating, and it stores everything inline with no allocation and no indirect call. C++ pushes you toward inheritance here because it has no good sum type; Rust does, and reaching for a trait first is the most common porting mistake.',
      'If the set is genuinely open — a plugin boundary, or user-supplied strategies — then I would define `trait Instrument` with the required methods and write one `impl Instrument for X` per type. The important difference from the C++ version is that the impl is a separate item from the struct. The struct gains no vptr and no size, the trait can be implemented for types I did not write, and a single type can implement `Instrument`, `Serialize` and `Ord` without any diamond problem, because traits carry behaviour and never data.',
      'The cost I would flag is that a trait is only free while dispatch stays static. `fn price<T: Instrument>(x: &T)` is monomorphized and inlines; `fn price(x: &dyn Instrument)` is a fat pointer and an indirect call, which is where the C++ virtual cost reappears — I would only pay it where I actually need a heterogeneous collection. And I would mention coherence: because of the orphan rule I cannot implement a foreign trait on a foreign type, so if I need `Display` for `Vec<Fill>` I wrap it in a newtype rather than fighting it.',
    ],
  },

  exercise: [
    'Paste the program into the [Rust Playground](https://play.rust-lang.org) and delete the `fn kind` body from the `Order` impl. It still compiles, and the output changes from `[order]` to `[record]` — you have just watched a default body take over. Then delete `fn zero` from the `Heartbeat` impl and read the error: it names the missing item explicitly, which is what a required method buys you over a base class with a body you forgot to override.',
    'Now add `#[derive(PartialEq, PartialOrd)]` to `Order`, sort a `Vec<Order>`, and then swap the declaration order of `price` and `qty`. Sort the same data again and diff the output. Derived ordering is field order, and this is the exact bug that shows up in an order book when someone repacks a struct for cache reasons.',
    'Finally, run `cargo expand` (`cargo install cargo-expand`) on the file and read what `#[derive(Debug)]` actually generated. It is an ordinary `impl Debug for Heartbeat` block with no magic in it, and seeing that once removes most of the mystery from derive macros.',
  ],
};
