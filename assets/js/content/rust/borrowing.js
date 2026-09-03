import { Region, Frame, Arrow, Text, Tag, Box } from '../../viz/primitives.js';

const REGION = { x: 60, y: 56, w: 600, h: 300 };
const OWNER_X = 320;
const OWNER_Y = 90;

const owner = (tone = 'owned') =>
  Frame({
    key: 'owner',
    x: OWNER_X,
    y: OWNER_Y,
    w: 180,
    label: 'v: Vec<i32>',
    tone,
    vars: [{ name: 'ptr/len/cap', value: '→ heap', tone: tone === 'moved' ? 'moved' : 'owned' }],
  });

const borrowArrow = (key, fromY, tone = 'borrowed', label = '&v') =>
  Arrow({
    key,
    from: [OWNER_X + 90, fromY],
    to: [OWNER_X + 90, OWNER_Y - 6],
    shape: 'straight',
    bend: 0,
    tone,
    dashed: true,
    label,
  });

export default {
  oneLiner:
    'Temporary access to a value without taking responsibility for it — and one rule that makes shared mutable state structurally impossible.',

  whyJob:
    'This is the mechanism that lets Rust make "no data races" a compile-time guarantee rather than a discipline you hope everyone follows. Every concurrency claim Rust makes rests on this one rule.',

  mentalModel:
    'Owning a book means you can lend it, write in it, or throw it away. Borrowing it means you can read it — and if the owner says you can *write* in it, they hand it to you alone and cannot touch it themselves until you give it back. The rule that falls out: any number of people can be reading the same book at once, but if anyone is writing in it, they must be the only one holding it.',

  scene: {
    id: 'shared-vs-exclusive',
    title: 'Any number of readers, or exactly one writer',
    width: 720,
    height: 400,
    legend: [
      { tone: 'owned', label: 'owner' },
      { tone: 'borrowed', label: 'shared borrow — &T' },
      { tone: 'highlight', label: 'exclusive borrow — &mut T' },
    ],
    steps: [
      {
        say: '`v` owns a `Vec`. Right now nothing else has any access to it at all.',
        mark: ['2'],
        shapes: () => [Region({ key: 'r', ...REGION, label: 'STACK', tone: 'stack' }), owner()],
      },
      {
        say: 'A shared borrow, `&v`, is a dashed arrow — it points at the data without taking it. The owner keeps its label; the borrow is temporary access layered on top.',
        mark: ['4'],
        shapes: () => [
          Region({ key: 'r', ...REGION, label: 'STACK', tone: 'stack' }),
          owner(),
          Frame({ key: 'r1', x: 90, y: 200, w: 150, label: 'r1: &Vec<i32>', tone: 'borrowed', vars: [{ name: 'points to', value: 'v', tone: 'borrowed' }] }),
          borrowArrow('a1', 200),
        ],
      },
      {
        say: 'Shared borrows stack freely. `r2`, `r3` — any number of readers can coexist, because none of them can write, so there is nothing for them to disagree about.',
        mark: ['5-6'],
        shapes: () => [
          Region({ key: 'r', ...REGION, label: 'STACK', tone: 'stack' }),
          owner(),
          Frame({ key: 'r1', x: 70, y: 200, w: 130, label: 'r1: &Vec', tone: 'borrowed', vars: [{ name: 'points to', value: 'v', tone: 'borrowed' }] }),
          Frame({ key: 'r2', x: 220, y: 200, w: 130, label: 'r2: &Vec', tone: 'borrowed', vars: [{ name: 'points to', value: 'v', tone: 'borrowed' }] }),
          Frame({ key: 'r3', x: 370, y: 200, w: 130, label: 'r3: &Vec', tone: 'borrowed', vars: [{ name: 'points to', value: 'v', tone: 'borrowed' }] }),
          borrowArrow('a1', 200, 'borrowed', ''),
          borrowArrow('a2', 200, 'borrowed', ''),
          borrowArrow('a3', 200, 'borrowed', ''),
        ],
      },
      {
        say: 'Now try to also take `&mut v` while those shared borrows are alive.',
        mark: ['8'],
        predict: {
          ask: 'Three shared borrows (`r1`, `r2`, `r3`) are still alive. Can you also create `&mut v` right now?',
          options: [
            { label: 'Yes — mutable borrows just queue behind the readers', correct: false },
            { label: 'No — the compiler rejects it while any shared borrow is alive', correct: true },
            { label: 'Yes, but only if you use `unsafe`', correct: false },
          ],
          because:
            'The rule is exactly "any number of readers, or exactly one writer, never both." A mutable borrow needs to be the ONLY access path, so it cannot coexist with even one shared borrow, let alone three.',
        },
        shapes: () => [
          Region({ key: 'r', ...REGION, label: 'STACK', tone: 'stack' }),
          owner(),
          Frame({ key: 'r1', x: 70, y: 200, w: 130, label: 'r1: &Vec', tone: 'borrowed', vars: [{ name: 'points to', value: 'v', tone: 'borrowed' }] }),
          Frame({ key: 'r2', x: 220, y: 200, w: 130, label: 'r2: &Vec', tone: 'borrowed', vars: [{ name: 'points to', value: 'v', tone: 'borrowed' }] }),
          Frame({ key: 'r3', x: 370, y: 200, w: 130, label: 'r3: &Vec', tone: 'borrowed', vars: [{ name: 'points to', value: 'v', tone: 'borrowed' }] }),
          borrowArrow('a1', 200, 'borrowed', ''),
          borrowArrow('a2', 200, 'borrowed', ''),
          borrowArrow('a3', 200, 'borrowed', ''),
        ],
      },
      {
        say: 'Rejected. `&mut v` needs exclusive access — no one else, not even another reader, is allowed to touch `v` while it is out. The compiler will not compile a program where that promise could be broken.',
        mark: ['8'],
        focus: ['r1', 'r2', 'r3', 'mw', 'err'],
        shapes: () => [
          Region({ key: 'r', ...REGION, label: 'STACK', tone: 'stack' }),
          owner('highlight'),
          Frame({ key: 'r1', x: 70, y: 200, w: 130, label: 'r1: &Vec', tone: 'borrowed', vars: [{ name: 'points to', value: 'v', tone: 'borrowed' }] }),
          Frame({ key: 'r2', x: 220, y: 200, w: 130, label: 'r2: &Vec', tone: 'borrowed', vars: [{ name: 'points to', value: 'v', tone: 'borrowed' }] }),
          Frame({ key: 'r3', x: 370, y: 200, w: 130, label: 'r3: &Vec', tone: 'borrowed', vars: [{ name: 'points to', value: 'v', tone: 'borrowed' }] }),
          borrowArrow('a1', 200, 'borrowed', ''),
          borrowArrow('a2', 200, 'borrowed', ''),
          borrowArrow('a3', 200, 'borrowed', ''),
          Text({
            key: 'err',
            x: 386,
            y: 300,
            text: 'error[E0502]: cannot borrow `v` as mutable\\nbecause it is also borrowed as immutable',
            size: 11.5,
            anchor: 'middle',
            mono: true,
            tone: 'freed',
            weight: 650,
          }),
        ],
      },
      {
        say: 'Once every shared borrow is out of use, `&mut v` is granted. It is drawn solid, not dashed, because for as long as it is alive it is the *only* path to `v` — the owner itself cannot be read or written except through it.',
        mark: ['12'],
        shapes: () => [
          Region({ key: 'r', ...REGION, label: 'STACK', tone: 'stack' }),
          owner('highlight'),
          Frame({
            key: 'mw',
            x: 90,
            y: 200,
            w: 190,
            label: 'w: &mut Vec<i32>',
            tone: 'highlight',
            vars: [{ name: 'exclusive access to', value: 'v', tone: 'highlight' }],
          }),
          Arrow({
            key: 'am',
            from: [185, 200],
            to: [365, 96],
            shape: 'curve',
            bend: -30,
            tone: 'highlight',
            label: '&mut v — only path in',
          }),
        ],
      },
    ],
  },

  code: {
    lang: 'rust',
    filename: 'main.rs',
    source: `fn main() {
    let mut v = vec![1, 2, 3];

    let r1 = &v;
    let r2 = &v;
    println!("{r1:?} {r2:?}");     // many readers: fine

    // let w = &mut v;             // error while r1, r2 are still used
    // r1 and r2's last use was the println! above

    {
        let w = &mut v;             // now the only borrow alive
        w.push(4);
    }                                // w's borrow ends here

    println!("{v:?}");              // v is fully usable again
}`,
    annotations: [
      {
        lines: '4-5',
        text: 'Two shared borrows of the same `v` at once. This is fine — neither can write, so there is nothing to race.',
      },
      {
        lines: '8',
        text: 'Uncomment this while `r1`/`r2` are still going to be used and it will not compile. Move it after their last use and it will.',
      },
      {
        lines: '12',
        text: '`w` is the *only* way to touch `v` for the length of this block. `v` itself is inaccessible until `w` goes out of scope.',
      },
    ],
  },

  deeper: [
    'A borrow is, at the machine level, exactly a pointer — the compiler is not inserting any runtime check here at all. `&v` and `&mut v` compile to the same load-an-address instruction you would write by hand in C. What differs entirely at compile time is what the *type system* allows you to do with that pointer afterward, and whether it is allowed to coexist with other pointers to the same data.',
    'The reason "many readers, one writer, never both" is exactly the right rule rather than an arbitrary restriction is that it is precisely the condition under which concurrent access is safe without synchronization. Two threads reading the same memory can never observe a torn or half-written value. One thread writing while nothing else reads or writes cannot race with anything. The moment you allow a second accessor while a write is possible, you need a lock, an atomic, or a data race — Rust\'s borrow rules are the single-threaded shadow of exactly the rule you need for multithreaded safety, which is why the same discipline extends cleanly to `Send`/`Sync` later.',
    'This generalizes past variables to fields and to nested structures. Borrowing `&mut s.a` while separately borrowing `&s.b` on the same struct is fine — the compiler can see the two borrows touch disjoint fields, so there is no actual conflict, even though `s` is "one object". This is called disjoint borrowing, and it is a real capability the borrow checker has, not a limitation people commonly assume it lacks.',
    'A shared reference is not a promise that the data cannot change — it is a promise that *you* cannot change it through that reference. Interior mutability types like `Cell` and `RefCell`, covered in a later lesson, let a type mutate through a `&` by moving the check from compile time to runtime. That is the deliberate, narrow escape hatch for the cases where the compile-time rule is provably too conservative.',
  ],

  gotchas: [
    'A `&mut` reference does not merely forbid *other code* from mutating through a different path — it forbids you from reading the owner directly too, for as long as the mutable borrow is alive. The owner is not just "protected from writes", it is unreachable except through that one reference.',
    'Method calls that look read-only can secretly require `&mut self`. `Vec::push` takes `&mut self` because it may reallocate, so `v.push(x)` requires exclusive access even though "pushing one element" does not sound like it should conflict with an existing reader.',
    'A borrow\'s scope is not always the enclosing braces — it ends at its *last use*, which the next lesson covers in depth. This is why sometimes reordering two lines with no other change makes previously-rejected code compile.',
    'Borrowing through a method that returns `&mut self.field` ties up `self` as a whole for as long as that returned reference lives, even though only one field is actually being touched — unless the method is structured so the compiler can see the field access directly.',
  ],

  interview: {
    q: 'Why does Rust allow many shared references but only one mutable reference at a time?',
    a: [
      'Because that is exactly the condition under which concurrent access to memory is safe with no synchronization primitive involved. Any number of readers can observe the same bytes simultaneously with no possibility of a torn read, because none of them are writing. A single writer with no concurrent readers cannot race with anything either, because there is only one accessor. The moment you allow a second accessor while a write is possible, you need a lock or an atomic to make it safe — so Rust\'s rule is not an arbitrary restriction, it is the precise boundary of "safe without synchronization".',
      'The reason this is enforced even in ordinary single-threaded code, where a race could not literally happen, is that it is the same discipline that makes the multithreaded story work later. `Send` and `Sync`, covered further into the course, build directly on this: a type is `Sync` if `&T` is safe to share across threads, and the aliasing rule already established here is exactly what makes that true or false.',
      'The mechanical reason it has to be *exactly* one writer and not, say, "one writer plus readers who promise not to look during the write" is that promises are not something a type system can verify. The compiler cannot check "the readers politely wait" — it can only check "no other reference exists". So the rule is stated in terms of reference existence rather than intended behaviour, which is what makes it something the compiler can actually enforce at compile time rather than merely document.',
    ],
  },

  exercise: [
    'Write a function that takes `&Vec<i32>` and prints its sum, and call it twice with two live shared borrows of the same vector at once. Then try adding a `&mut` borrow while both are still in scope and read the exact error — note which line it blames as the conflicting borrow.',
    'Then write a struct with two fields and confirm you can hold `&mut` to one field and `&` to the other simultaneously without conflict. Seeing the compiler accept that is the clearest evidence that the rule tracks *what is actually reachable*, not merely which variable name you typed.',
  ],
};
