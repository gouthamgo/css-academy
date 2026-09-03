import { Box, Frame, Region, Arrow, Text, Tag } from '../../viz/primitives.js';

export default {
  oneLiner:
    'The hidden pointer every polymorphic object carries, what a virtual call actually costs in three hops, and the two ways inheritance quietly breaks — slicing, and a non-virtual destructor.',

  whyJob:
    'Trading and ML-infra codebases lean on class hierarchies for order types, layers and event handlers, and "draw the memory layout of this hierarchy and tell me what `delete` does here" is a standard whiteboard question. It separates people who have used virtual functions from people who know what the compiler actually generated underneath them.',

  mentalModel:
    'Every object with a virtual function carries a *forwarding address* as an invisible first field — the vptr — pointing at one shared instruction sheet per class, the vtable. Calling a virtual function means *reading that address, walking to the sheet, and following whichever line it names* — three separate steps, not one. Slicing an object down to its base type does not just drop the extra fields; it hands the copy a *fresh forwarding address to the base sheet*, because the base class\'s own constructor has never heard of any other one.',

  scene: {
    id: 'vptr-and-vtable',
    title: 'The pointer you did not write, and the sheet it points to',
    width: 720,
    height: 430,
    legend: [
      { tone: 'highlight', label: 'vptr — inserted by the compiler' },
      { tone: 'owned', label: 'a field you actually wrote' },
      { tone: 'hit', label: 'the function actually reached' },
      { tone: 'freed', label: 'lost, reset, or never run' },
    ],
    steps: [
      {
        say: 'A plain struct with one `int` and nothing virtual. Its layout is exactly what you wrote — four bytes, nothing more.',
        mark: ['3-5'],
        shapes: () => [
          Text({ key: 'title', x: 360, y: 40, text: 'struct Instrument { int id; };', size: 12, anchor: 'middle', mono: true, opacity: 0.85 }),
          Box({ key: 'idBox', x: 328, y: 140, w: 64, h: 56, label: 'id', sub: '4 B · int', tone: 'owned', mono: true, labelSize: 13 }),
          Text({ key: 'sizeofText', x: 360, y: 240, text: 'sizeof(Instrument) = 4', size: 14, anchor: 'middle', opacity: 0.9 }),
        ],
      },
      {
        say: 'Add one `virtual` keyword and the compiler inserts a field before anything you declared — a pointer, aligned first, taking the full 8 bytes a pointer needs on a 64-bit machine. Your `id` gets pushed over to make room for it.',
        mark: ['7-11'],
        predict: {
          ask: '`int id` alone was 4 bytes. Add one virtual function to the same struct. What does `sizeof` become?',
          options: [
            { label: '8 — the vptr replaces the need for the int', correct: false },
            { label: '12 — the vptr is 4 bytes, same as any other pointer', correct: false },
            { label: '16 — an 8-byte vptr, the 4-byte int, and 4 bytes of tail padding so the struct stays a multiple of 8', correct: true },
          ],
          because:
            'The vptr is a real pointer, 8 bytes on a 64-bit target, and it is placed first. `id` then sits at offset 8, and because the struct now contains an 8-byte member its overall alignment is 8, so the compiler adds 4 bytes of tail padding after `id` to round 12 up to 16 — the same tail-padding rule from the struct-layout lesson, just triggered by a field you never wrote.',
        },
        shapes: () => [
          Text({ key: 'title', x: 360, y: 40, text: 'struct Instrument { virtual double price() const; int id; };', size: 9, anchor: 'middle', mono: true, opacity: 0.85 }),
          Box({ key: 'vptrBox', x: 232, y: 140, w: 128, h: 56, label: 'vptr', sub: '8 B — hidden, you did not write this', tone: 'highlight', mono: true, labelSize: 10 }),
          Box({ key: 'idBox', x: 360, y: 140, w: 64, h: 56, label: 'id', sub: '4 B', tone: 'owned', mono: true, labelSize: 13 }),
          Box({ key: 'padBox', x: 424, y: 140, w: 64, h: 56, label: 'pad', sub: '4 B', tone: 'freed', dashed: true, mono: true, labelSize: 11 }),
          Text({ key: 'sizeofText', x: 360, y: 240, text: 'sizeof(Instrument): 4 → 16', size: 14, anchor: 'middle', tone: 'highlight' }),
        ],
      },
      {
        say: 'The vptr is not the function table itself — it is a pointer *to* one. There is exactly one table per class, shared by every instance of that class, sitting in read-only memory the process cannot accidentally write to.',
        mark: ['9', '13-16'],
        shapes: () => [
          Region({ key: 'rodata', x: 300, y: 50, w: 380, h: 300, label: '.rodata — one table per class, read-only', tone: 'heap' }),
          Frame({ key: 'instObj', x: 30, y: 70, w: 190, label: 'Instrument inst', vars: [{ name: 'vptr', value: '●', tone: 'highlight' }, { name: 'id', value: '7' }] }),
          Frame({ key: 'bondObj', x: 30, y: 210, w: 190, label: 'Bond bond', vars: [{ name: 'vptr', value: '●', tone: 'highlight' }, { name: 'id', value: '7' }, { name: 'coupon', value: '4.25' }] }),
          Frame({ key: 'vtInst', x: 330, y: 80, w: 200, label: 'Instrument_vtable', vars: [{ name: '[0] price', value: '0x4010' }, { name: '[1] ~dtor', value: '0x4030' }] }),
          Frame({ key: 'vtBond', x: 330, y: 210, w: 200, label: 'Bond_vtable', vars: [{ name: '[0] price', value: '0x4050', tone: 'hit' }, { name: '[1] ~dtor', value: '0x4060' }] }),
          Arrow({ key: 'vi', from: [220, 114], to: [330, 124], shape: 'straight', bend: 0, tone: 'highlight' }),
          Arrow({ key: 'vb', from: [220, 254], to: [330, 254], shape: 'straight', bend: 0, tone: 'highlight' }),
        ],
      },
      {
        say: 'Through `Instrument* p = &bond;`, calling `p->price()` cannot be resolved at compile time — the compiler only knows `p`\'s *static* type. It has to ask the object itself, at runtime, three separate times.',
        mark: ['18-19'],
        focus: ['pvar', 'callsite', 'bondObj', 'vtBond', 'fnbody', 'hop1', 'hop2', 'hop3', 'c1', 'c2', 'c3'],
        shapes: () => [
          Region({ key: 'rodata', x: 300, y: 50, w: 380, h: 300, label: '.rodata — one table per class, read-only', tone: 'heap' }),
          Box({ key: 'pvar', x: 30, y: 60, w: 190, h: 36, label: 'Instrument* p = &bond;', tone: 'owned', mono: true, labelSize: 9 }),
          Box({ key: 'callsite', x: 30, y: 106, w: 190, h: 36, label: 'p->price();', tone: 'highlight', mono: true, labelSize: 12 }),
          Frame({ key: 'bondObj', x: 30, y: 210, w: 190, label: 'Bond bond', vars: [{ name: 'vptr', value: '●', tone: 'highlight' }, { name: 'id', value: '7' }, { name: 'coupon', value: '4.25' }] }),
          Frame({ key: 'vtBond', x: 330, y: 210, w: 200, label: 'Bond_vtable', vars: [{ name: '[0] price', value: '0x4050', tone: 'hit' }, { name: '[1] ~dtor', value: '0x4060' }] }),
          Box({ key: 'fnbody', x: 600, y: 226, w: 100, h: 56, label: 'Bond::price()', sub: 'the actual code', tone: 'hit', mono: true, labelSize: 9 }),
          Arrow({ key: 'hop1', from: [125, 142], to: [125, 210], shape: 'straight', bend: 0, tone: 'owned', thick: true, label: '① load vptr' }),
          Arrow({ key: 'hop2', from: [220, 254], to: [330, 254], shape: 'straight', bend: 0, tone: 'owned', thick: true, label: '② index [0]' }),
          Arrow({ key: 'hop3', from: [530, 254], to: [600, 254], shape: 'straight', bend: 0, tone: 'owned', thick: true, label: '③ jump' }),
          Tag({ key: 'c1', x: 135, y: 172, text: '~4 cyc', tone: 'neutral' }),
          Tag({ key: 'c2', x: 250, y: 236, text: '~1 cyc', tone: 'neutral' }),
          Tag({ key: 'c3', x: 545, y: 236, text: 'predicted', tone: 'hit' }),
        ],
      },
      {
        say: 'Assigning a `Bond` to an `Instrument` by value calls `Instrument`\'s own copy constructor — the only one the compiler will pick, because the destination\'s static type is `Instrument`. That constructor knows nothing about `coupon`, and it initialises the vptr to `Instrument`\'s own table, because that is the only table it has ever heard of.',
        mark: ['30'],
        shapes: () => [
          Text({ key: 'assign', x: 325, y: 55, text: 'Instrument copy = bond;', size: 11.5, anchor: 'middle', mono: true, opacity: 0.85 }),
          Frame({ key: 'bondObj2', x: 30, y: 90, w: 190, label: 'Bond bond', vars: [{ name: 'vptr', value: '● Bond', tone: 'highlight' }, { name: 'id', value: '7' }, { name: 'coupon', value: '4.25' }] }),
          Frame({ key: 'copyObj', x: 430, y: 90, w: 190, label: 'Instrument copy', vars: [{ name: 'vptr', value: '● Instrument', tone: 'freed' }, { name: 'id', value: '7' }] }),
          Box({ key: 'chopped', x: 430, y: 215, w: 190, h: 40, label: 'coupon — sliced off', sub: 'never copied', tone: 'freed', dashed: true, mono: true, labelSize: 10 }),
          Arrow({ key: 'sliceArrow', from: [220, 134], to: [430, 134], shape: 'curve', bend: -18, tone: 'freed', label: 'base copy ctor only' }),
          Tag({ key: 'resetTag', x: 430, y: 186, text: 'vptr reset to Instrument_vtable', tone: 'freed' }),
        ],
      },
      {
        say: 'This `Bond` was made through `new`, reached only through an `Instrument*`, and its destructor was never marked `virtual`. `delete p` resolves `~Instrument()` the same way any ordinary, non-virtual call resolves — from `p`\'s static type, at compile time. The vptr is never even read.',
        mark: ['10', '33-34'],
        shapes: () => [
          Box({ key: 'pvar2', x: 30, y: 60, w: 250, h: 36, label: 'Instrument* p = new Bond();', tone: 'owned', mono: true, labelSize: 8.5 }),
          Box({ key: 'delcall', x: 30, y: 106, w: 250, h: 36, label: 'delete p;  // ~Instrument() is not virtual', tone: 'highlight', mono: true, labelSize: 7.5 }),
          Frame({ key: 'bondObj3', x: 30, y: 190, w: 190, label: 'Bond bond', vars: [{ name: 'vptr', value: '● Bond' }, { name: 'id', value: '0' }, { name: 'coupon', value: '4.25', tone: 'freed' }] }),
          Tag({ key: 'ignored', x: 30, y: 170, text: 'never consulted', tone: 'freed' }),
          Box({ key: 'dtorRun', x: 280, y: 210, w: 190, h: 56, label: '~Instrument()', sub: 'the only dtor that runs', tone: 'freed', mono: true, labelSize: 11 }),
          Box({ key: 'leak', x: 500, y: 210, w: 190, h: 56, label: 'coupon never freed', sub: 'Bond had no chance to clean up', tone: 'freed', dashed: true, mono: true, labelSize: 10 }),
          Arrow({ key: 'staticCall', from: [155, 142], to: [375, 210], shape: 'curve', bend: -14, tone: 'freed', thick: true, label: 'static call — no vptr read' }),
          Arrow({ key: 'noRun', from: [220, 286], to: [500, 238], shape: 'straight', bend: 0, tone: 'freed', dashed: true, label: 'never reached' }),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'dispatch.cpp',
    source: `#include <cstdio>

struct Instrument {                    // no virtual functions
    int id = 0;
};                                      // sizeof == 4

struct PricedInstrument {              // one virtual function
    int id = 0;
    virtual double price() const { return 0.0; }
    virtual ~PricedInstrument() = default;  // remove \`virtual\` to reproduce the leak
};                                      // sizeof == 16: vptr(8) + id(4) + pad(4)

struct Bond : PricedInstrument {
    double coupon = 0.0;
    double price() const override { return 100.0 + coupon; }
};

void quote(const PricedInstrument& x) {
    std::printf("price = %.2f\\n", x.price());  // three hops: vptr, table, jump
}

int main() {
    std::printf("sizeof(Instrument)       = %zu\\n", sizeof(Instrument));
    std::printf("sizeof(PricedInstrument) = %zu\\n", sizeof(PricedInstrument));

    Bond bond;
    bond.coupon = 4.25;
    quote(bond);                         // dispatches to Bond::price() -> 104.25

    PricedInstrument copy = bond;        // sliced: coupon dropped, vptr reset
    quote(copy);                         // dispatches to base price() -> 0.00

    PricedInstrument* p = new Bond();
    delete p;                            // virtual dtor: ~Bond() then ~PricedInstrument()
    return 0;
}`,
    annotations: [
      {
        lines: '7-11',
        text: 'One `virtual` function is enough to add the hidden vptr and push `sizeof` from 4 to 16 — the cost is paid whether or not you ever call the function polymorphically.',
      },
      {
        lines: '10',
        text: 'Delete the word `virtual` here and rebuild: the code still compiles, `quote` still runs, and only the final `delete` silently stops calling `~Bond()` — the bug this lesson\'s last step draws out.',
      },
      {
        lines: '30',
        text: '`PricedInstrument copy = bond;` invokes `PricedInstrument`\'s copy constructor, chosen from `copy`\'s static type. `coupon` is dropped and the vptr is (re)initialised to `PricedInstrument_vtable` — not left pointing at `Bond`\'s.',
      },
      {
        lines: '33-34',
        text: 'With the destructor `virtual`, `delete p` performs the same three-hop dispatch as `quote` did: it finds `~Bond()` first, which then chains up to `~PricedInstrument()` automatically.',
      },
    ],
  },

  deeper: [
    'The vptr is written by every constructor, not just the outermost one, and it changes value *during* construction. While `Bond`\'s base subobject is being built, the vptr temporarily points at `PricedInstrument_vtable`; only once `Bond`\'s own constructor body starts does it get rewritten to `Bond_vtable`. This is exactly why calling a virtual function from a base class constructor never reaches an override in the derived class — the derived part of the object does not exist yet, so dispatching there would run code against uninitialised memory, and the standard defines it to call the base version instead.',
    'A vtable slot holds a plain function address, so an indirect call through it is exactly as fast as any other indirect call on the CPU — the overhead is not "slow", it is *un-inlineable*. A normal, non-virtual call can be inlined because the compiler knows the target at compile time; a virtual call through an unknown dynamic type cannot be, unless the compiler can prove the concrete type some other way (devirtualization). In a hot loop that calls a small virtual function millions of times, the lost inlining — not the indirect jump itself — is usually the larger cost.',
    'Modern CPUs predict indirect branches with a dedicated structure (part of the branch target buffer), keyed on the call site, not just the target. A call site that always dispatches to the same concrete type (monomorphic) predicts correctly almost every time, so the steady-state cost really is close to a normal call plus one extra memory load. A call site that cycles through many different concrete types (megamorphic) — a classic pattern in interpreters and plugin systems — defeats that predictor and pays a real misprediction penalty, in the same 15-20 cycle range as the mispredicted branches from the branch-prediction lesson.',
    'Marking a class or an override `final` tells the compiler no further derived class can override it, which is sometimes enough for the compiler to devirtualize a call it can otherwise prove is safe — turning three hops back into a direct, inlinable call. This is a real, measurable optimisation in performance-sensitive code, not just documentation, and it is one of the few places `final` earns its keep beyond expressing intent.',
    'Multiple inheritance complicates the picture: an object can carry more than one vptr, one per base subobject that introduces virtual functions, and calling through a pointer to a non-primary base can require adjusting `this` by a fixed offset before the call (a "thunk"). None of that changes the three-step mental model — load, index, jump — it just means "the object" and "the vptr" are no longer quite as simple as a single pointer at offset zero once multiple inheritance is in the picture.',
  ],

  gotchas: [
    'Deleting a derived object through a base pointer whose destructor is not `virtual` is undefined behaviour, not merely a leak in the best case — in practice it usually manifests as exactly the derived class\'s resources never being released, which is why any base class meant to be deleted polymorphically needs a virtual destructor even if it does nothing else virtual.',
    'Slicing compiles silently and produces no warning by default. Passing a derived object *by value* into a function that takes the base type by value is the same bug wearing a different hat — the parameter is a full, separate, sliced copy, not the object you thought you passed.',
    'A virtual function called from inside a constructor or destructor never reaches a derived override, even if the object\'s ultimate dynamic type has one — the vptr, at that point in construction, still names the class currently being built.',
    'Forgetting `override` on an intended override is not an error by itself; if the signature does not match exactly (a missing `const`, a different parameter type), the new function silently *hides* the base one instead of overriding it, and calls through a base pointer keep calling the old base implementation. Writing `override` on every intended override turns that mistake into a compile error.',
    'The 8 (or 16, once padding is counted) extra bytes per polymorphic object are not free at scale: an array of a million small polymorphic objects pays that overhead a million times over, which is one of the standard arguments for preferring a `std::variant` or a tagged struct over inheritance when the concrete type set is small, fixed, and known up front.',
  ],

  interview: {
    q: 'Walk through exactly what happens, mechanically, when `base_ptr->f()` is called on a polymorphic type — and then explain why `delete base_ptr` can leak even though `f()` dispatches correctly.',
    a: [
      'Three steps, all at runtime. First, load the vptr out of the object `base_ptr` points at — it is always the first thing in the object\'s layout, so this is a fixed-offset read. Second, index into the vtable that vptr points at, at the fixed slot number `f` was assigned at compile time (the same slot in every override, which is exactly what makes overriding work — the slot number is fixed, only the address stored in it changes). Third, jump to whatever address was read out of that slot. None of this consults the object\'s declared type at the call site — `base_ptr`\'s *static* type only decides which slot number to use; the object\'s *dynamic* type decides which address is sitting in that slot.',
      '`delete` is different because it is not one virtual call, it is a decision about *which function to call at all* — and that decision is made from `base_ptr`\'s static type, at compile time, exactly like calling any other member function. If the destructor is `virtual`, the compiler generates the same three-hop dispatch for it, and the runtime table lookup correctly finds the derived destructor. If it is not `virtual`, the compiler never generates a dispatch — it hard-codes a direct call to the base destructor, full stop, because that is the only destructor the static type `Instrument*` is allowed to know about.',
      'The detail worth adding without being asked: this is why `f()` and `delete` can behave completely differently on the identical pointer in the identical program. `f()`\'s dispatch depends on whether `f` itself is `virtual` in the base; `delete`\'s dispatch depends on whether the *destructor* is `virtual` in the base — two independent switches. A class can have every other member function correctly virtual and still leak on delete because exactly one keyword was left off exactly one declaration.',
    ],
  },

  exercise: [
    'Build the code above, then delete the word `virtual` from the destructor and rebuild under `g++ -fsanitize=address -std=c++20 dispatch.cpp -o dispatch && ./dispatch`. If `Bond` owned a heap allocation (add a `char* buf = new char[64];` and free it in `Bond`\'s destructor) you will get a clean `LeakSanitizer` report naming the exact allocation that never got freed — a much more convincing demonstration than reading about it.',
    'Compile with `-fdump-lang-class` (GCC) or inspect the disassembly on Compiler Explorer and find the actual vtable: search for a symbol containing `_ZTV` (the Itanium ABI mangling for a vtable) and look at the section it lives in — it should be `.rodata` or `.data.rel.ro`, never `.data` or the stack. Then compare the assembly for `quote(bond)` against a version of `quote` that takes a `const Bond&` directly and calls `Bond::price()` by name — the second should show a single direct `call`, with no load-then-jump sequence at all.',
  ],
};
