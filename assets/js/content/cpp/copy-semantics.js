import { Region, Frame, Box, Arrow, Text, Tag } from '../../viz/primitives.js';

/* Shared geometry. Every step agrees on where the stack and the heap are,
   so the only thing that moves between steps is the thing being explained. */
const STACK = { x: 24, y: 48, w: 300, h: 312 };
const HEAP = { x: 372, y: 48, w: 328, h: 312 };

const A_Y = 92;   // frame for `a`  (2 vars -> h = 30 + 2*26 + 8 = 90)
const B_Y = 222;  // frame for `b`
const FRAME_X = 48;
const FRAME_W = 190;
const ROW = (frameY, i) => frameY + 44 + i * 26; // baseline of var row i

const BLK1 = { x: 400, y: 104, w: 272, h: 56 };
const BLK2 = { x: 400, y: 236, w: 272, h: 56 };

const bg = () => [
  Region({ key: 'stack', ...STACK, label: 'THE STACK', tone: 'stack' }),
  Region({ key: 'heap', ...HEAP, label: 'THE HEAP', tone: 'heap' }),
];

/* `a` is the same object in every step, so it keeps one key throughout. */
const frameA = (tone = 'stack', ptr = '0x60a0') =>
  Frame({
    key: 'a',
    x: FRAME_X,
    y: A_Y,
    w: FRAME_W,
    tone,
    label: 'Blob a',
    vars: [
      { name: 'data_', value: ptr, tone: tone === 'stack' ? 'heap' : tone },
      { name: 'len_', value: '5' },
    ],
  });

const frameB = (tone = 'stack', ptr = '0x60a0') =>
  Frame({
    key: 'b',
    x: FRAME_X,
    y: B_Y,
    w: FRAME_W,
    tone,
    label: 'Blob b',
    vars: [
      { name: 'data_', value: ptr, tone: tone === 'stack' ? 'heap' : tone },
      { name: 'len_', value: '5' },
    ],
  });

const block1 = (tone, dashed, label, sub) =>
  Box({
    key: 'blk1',
    ...BLK1,
    tone,
    dashed,
    label,
    sub,
    labelSize: 12,
    mono: true,
  });

const block2 = (tone, dashed, label, sub) =>
  Box({
    key: 'blk2',
    ...BLK2,
    tone,
    dashed,
    label,
    sub,
    labelSize: 12,
    mono: true,
  });

export default {
  oneLiner:
    'What `Blob b = a;` really does when your class owns memory, and why the default is a crash.',

  whyJob:
    'A class that owns a raw resource and has no copy constructor is the most common trap in a C++ take-home. Interviewers show you a five-line class with a destructor and ask what the compiler generated for you — getting "a memberwise copy, so two objects free the same block" wrong ends the conversation.',

  mentalModel:
    'A resource-owning object is a *cloakroom ticket*, not the coat. Photocopying the ticket does not give you a second coat — it gives two people a claim on *one* coat, and whoever arrives second finds an empty hook. The default copy in C++ photocopies the ticket: it duplicates the pointer, never the thing pointed at.',

  scene: {
    id: 'shallow-vs-deep-copy',
    title: 'One block, two owners, two destructors',
    width: 720,
    height: 400,
    legend: [
      { tone: 'heap', label: 'live heap block' },
      { tone: 'freed', label: 'already freed — do not touch' },
      { tone: 'moved', label: 'cleanly released' },
    ],
    steps: [
      {
        say: 'A `Blob` is two words on the stack: a length and a pointer. The five bytes it owns are somewhere else entirely — the object and its resource are separate things that happen to be linked by one number.',
        mark: ['34', '6-7'],
        shapes: () => [
          ...bg(),
          frameA(),
          block1('heap', false, 'heap block #1', '5 bytes  @ 0x60a0'),
          Arrow({
            key: 'ap',
            from: [FRAME_X + FRAME_W + 2, ROW(A_Y, 0)],
            to: [BLK1.x - 4, BLK1.y + 22],
            tone: 'heap',
            bend: -14,
          }),
        ],
      },
      {
        say: 'You write `Blob b = a;` and you did not define a copy constructor, so the compiler supplied one. It copies each member in turn. `len_` is a number, so 5 is copied. `data_` is also just a number.',
        mark: ['35'],
        shapes: () => [
          ...bg(),
          frameA(),
          frameB('highlight'),
          block1('heap', false, 'heap block #1', '5 bytes  @ 0x60a0'),
          Arrow({
            key: 'ap',
            from: [FRAME_X + FRAME_W + 2, ROW(A_Y, 0)],
            to: [BLK1.x - 4, BLK1.y + 22],
            tone: 'heap',
            bend: -14,
          }),
          Arrow({
            key: 'bp',
            from: [FRAME_X + FRAME_W + 2, ROW(B_Y, 0)],
            to: [BLK1.x - 4, BLK1.y + 40],
            tone: 'highlight',
            bend: 26,
          }),
        ],
      },
      {
        say: 'Nothing was allocated. `b` did not get a copy of the bytes — it got a copy of the address of someone else’s bytes. Neither object has any way to discover that the other exists.',
        mark: ['35', '29-30'],
        focus: ['a', 'b', 'blk1', 'ap', 'bp', 'alias'],
        predict: {
          ask: 'Both objects go out of scope at the closing brace of `main`. What happens?',
          options: [
            {
              label: 'The block is freed once — C++ notices the duplicate',
              correct: false,
            },
            {
              label: 'Two destructors run and both call `delete[]` on the same address',
              correct: true,
            },
            { label: 'The block leaks, because neither owner is sure', correct: false },
          ],
          because:
            'Destructors are unconditional. Each object runs `delete[] data_` on whatever address it holds, and both hold the same one. There is no reference count anywhere — you did not write one, and the compiler does not add one.',
        },
        shapes: () => [
          ...bg(),
          frameA(),
          frameB(),
          block1('heap', false, 'heap block #1', 'one owner too many'),
          Arrow({
            key: 'ap',
            from: [FRAME_X + FRAME_W + 2, ROW(A_Y, 0)],
            to: [BLK1.x - 4, BLK1.y + 22],
            tone: 'heap',
            bend: -14,
          }),
          Arrow({
            key: 'bp',
            from: [FRAME_X + FRAME_W + 2, ROW(B_Y, 0)],
            to: [BLK1.x - 4, BLK1.y + 40],
            tone: 'heap',
            bend: 26,
          }),
          Tag({ key: 'alias', x: 246, y: 194, text: 'same address', tone: 'freed' }),
        ],
      },
      {
        say: 'The scope ends. Locals are destroyed in reverse order of construction, so `b` goes first. Its destructor hands the block back to the allocator, which immediately writes its own bookkeeping into those bytes.',
        mark: ['9'],
        focus: ['b', 'blk1', 'bp', 'ap', 'a', 'freed1'],
        shapes: () => [
          ...bg(),
          frameA(),
          frameB('moved', 'dangling'),
          block1('freed', true, 'returned to the allocator', 'bytes now hold free-list data'),
          Arrow({
            key: 'ap',
            from: [FRAME_X + FRAME_W + 2, ROW(A_Y, 0)],
            to: [BLK1.x - 4, BLK1.y + 22],
            tone: 'freed',
            dashed: true,
            bend: -14,
          }),
          Arrow({
            key: 'bp',
            from: [FRAME_X + FRAME_W + 2, ROW(B_Y, 0)],
            to: [BLK1.x - 4, BLK1.y + 40],
            tone: 'moved',
            dashed: true,
            bend: 26,
          }),
          Tag({ key: 'freed1', x: 246, y: 194, text: 'freed once', tone: 'moved' }),
        ],
      },
      {
        say: 'Then `a` is destroyed and runs the identical line on the identical address. glibc usually detects the corrupted free-list header and aborts with "double free or corruption"; when it does not, the heap is quietly poisoned and the program dies somewhere unrelated an hour later.',
        mark: ['9'],
        focus: ['a', 'blk1', 'ap', 'boom', 'boom2'],
        shapes: () => [
          ...bg(),
          frameA('freed', '0x60a0'),
          frameB('moved', 'dangling'),
          block1('freed', true, 'ALREADY FREE', 'second delete[] lands here'),
          Arrow({
            key: 'ap',
            from: [FRAME_X + FRAME_W + 2, ROW(A_Y, 0)],
            to: [BLK1.x - 4, BLK1.y + 22],
            tone: 'freed',
            thick: true,
            bend: -14,
          }),
          Arrow({
            key: 'bp',
            from: [FRAME_X + FRAME_W + 2, ROW(B_Y, 0)],
            to: [BLK1.x - 4, BLK1.y + 40],
            tone: 'moved',
            dashed: true,
            bend: 26,
          }),
          Tag({ key: 'boom', x: 414, y: 174, text: 'DOUBLE FREE', tone: 'freed' }),
          Text({
            key: 'boom2',
            x: 414,
            y: 206,
            text: 'heap metadata corrupted',
            size: 11,
            mono: true,
            tone: 'freed',
          }),
        ],
      },
      {
        say: 'Now the fix. You write the copy constructor yourself: allocate a fresh block of the same size, then `memcpy` the bytes across. The rule of three says that a class needing a destructor almost always needs this and the copy assignment operator too.',
        mark: ['12-15'],
        focus: ['a', 'b', 'blk1', 'blk2', 'ap', 'bp', 'deep'],
        shapes: () => [
          ...bg(),
          frameA(),
          frameB('stack', '0x7120'),
          block1('heap', false, 'heap block #1', '5 bytes  @ 0x60a0'),
          block2('heap', false, 'heap block #2', '5 bytes  @ 0x7120'),
          Arrow({
            key: 'ap',
            from: [FRAME_X + FRAME_W + 2, ROW(A_Y, 0)],
            to: [BLK1.x - 4, BLK1.y + 22],
            tone: 'heap',
            bend: -14,
          }),
          Arrow({
            key: 'bp',
            from: [FRAME_X + FRAME_W + 2, ROW(B_Y, 0)],
            to: [BLK2.x - 4, BLK2.y + 26],
            tone: 'heap',
            bend: -14,
          }),
          Tag({ key: 'deep', x: 246, y: 194, text: 'one owner each', tone: 'owned' }),
        ],
      },
      {
        say: 'Both destructors now run without incident, because each one frees a block that only it ever held. The copy cost you a second allocation and five bytes of `memcpy` — that price is exactly what move semantics, the next lesson, exists to avoid paying twice.',
        mark: ['9', '36'],
        shapes: () => [
          ...bg(),
          frameA('moved', '—'),
          frameB('moved', '—'),
          block1('moved', true, 'released', 'freed by ~Blob of a'),
          block2('moved', true, 'released', 'freed by ~Blob of b'),
          Tag({ key: 'deep', x: 246, y: 194, text: 'no collision', tone: 'owned' }),
        ],
      },
    ],
  },

  code: {
    lang: 'cpp',
    filename: 'blob.cpp',
    source: `#include <cstddef>
#include <cstring>

class Blob {
public:
    explicit Blob(std::size_t n)
        : len_(n), data_(new char[n]) {}

    ~Blob() { delete[] data_; }

    // Rule of three, part 2: the copy constructor.
    Blob(const Blob& other)
        : len_(other.len_), data_(new char[other.len_]) {
        std::memcpy(data_, other.data_, len_);
    }

    // Rule of three, part 3: copy assignment.
    Blob& operator=(const Blob& other) {
        if (this == &other) return *this;
        char* fresh = new char[other.len_];
        std::memcpy(fresh, other.data_, other.len_);
        delete[] data_;
        data_ = fresh;
        len_  = other.len_;
        return *this;
    }

private:
    std::size_t len_;
    char*       data_;
};

int main() {
    Blob a(5);
    Blob b = a;   // delete lines 12-26 and both destructors free one block
    return 0;
}`,
    annotations: [
      {
        lines: '9',
        text: 'Declaring a destructor is the signal. If cleanup is your job, so is copying — the compiler will not infer the second from the first.',
      },
      {
        lines: '12-15',
        text: 'The allocation is the whole point. Without `new char[]` here, the generated version copies the *value of the pointer* and you get two owners.',
      },
      {
        lines: '19',
        text: 'The self-assignment guard matters because line 22 frees `data_`. Without it, `x = x` frees the block and then copies from the corpse.',
      },
      {
        lines: '20-23',
        text: 'Allocate first, free second. If `new` throws, the object is still intact — this ordering is what makes the operator exception-safe.',
      },
    ],
  },

  deeper: [
    'When you write nothing, the compiler still emits six special member functions: default constructor, destructor, copy constructor, copy assignment, move constructor, move assignment. The generated copy is *memberwise*, which means it calls the copy constructor of every member in turn. For an `int` that is a load and a store; for a `char*` it is also a load and a store, because a pointer is a number and copying a number is exactly what the compiler thinks you asked for. The pointer has no idea it owns anything.',
    'The failure is not the second `delete[]` in the abstract — it is what the allocator does with the block in between. glibc `malloc` writes the freed chunk onto a bin free-list, storing forward and backward links *inside the user bytes*. The second free then reads those bytes as if they were a live chunk header and links a corrupted node into the list. That is why the crash message is `free(): double free detected in tcache 2` or `malloc(): unsorted double linked list corrupted`, and why the abort so often fires in a later, innocent allocation rather than at the offending `delete`.',
    'The rule of three became the rule of five in C++11: if you write any of destructor, copy constructor or copy assignment, you should think about the move constructor and move assignment as well. There is a sting in the tail — declaring a destructor *suppresses* the implicit move operations. A class with a hand-written destructor and no move constructor silently falls back to copying everywhere you thought you were moving, which is a performance bug with no symptom other than a profile that looks wrong.',
    'The rule of zero is the answer you want to reach for in real code: do not manage the resource by hand at all. Hold a `std::vector<char>` or a `std::unique_ptr<char[]>` and write none of the five, because the member already implements correct copy or correct move-only semantics and the compiler-generated versions do the right thing by delegation. Every hand-written copy constructor is a place a future edit can add a member and forget to copy it.',
    'Copy assignment has a subtlety the copy constructor does not: the target already owns a resource. The canonical safe shape is copy-and-swap — take the parameter *by value*, then `swap` your guts with it and let its destructor clean up your old state. It is self-assignment safe and exception safe for free, at the cost of one extra move. The hand-rolled version in the code block is faster but you have to get the ordering right yourself.',
  ],

  gotchas: [
    'Passing a resource-owning object to a function by value silently invokes the copy constructor. A missing or wrong copy constructor does not fail at the declaration — it fails at whatever line first passes the object around, which may be in a header you did not write.',
    'A `std::vector<Blob>` copies its elements when it reallocates. With a broken copy constructor the crash appears at a `push_back` that looks entirely innocent, several thousand elements in.',
    'Writing a destructor suppresses the implicit move constructor. Your carefully placed `std::move` calls then resolve to copies, and nothing warns you.',
    '`if (this == &other) return *this;` is not decoration. Without it, copy assignment on `x = x` frees the source buffer and then reads from it — a use-after-free with no double free in sight.',
    'If copying genuinely makes no sense for a type — a mutex holder, a file handle, a socket — write `Blob(const Blob&) = delete;`. A compile error at the call site is enormously cheaper than a runtime double free.',
  ],

  interview: {
    q: 'Here is a class with a constructor that calls `new[]` and a destructor that calls `delete[]`, and nothing else. I copy an instance into a `std::vector` and the program crashes. Walk me through what the compiler generated and what actually happens.',
    a: [
      'Because the class declares no copy constructor, the compiler generated one, and the generated one is memberwise. The `char*` member is copied the way any 8-byte value is copied — the address is duplicated. So after the copy there are two objects holding the same heap address, and neither has any record of the other. Nothing has gone wrong yet; the object is merely in a state where its invariant, "I am the sole owner of `data_`", is false.',
      'The crash comes from the destructor, which runs unconditionally on each object. The first `delete[]` returns the block to the allocator, which writes free-list links into those very bytes. The second `delete[]` on the same address then treats that bookkeeping as a live chunk header. Under glibc this usually aborts with a double-free diagnostic, but it is undefined behaviour, so the honest answer is that it may also corrupt the heap silently and kill the process later at an unrelated allocation. In the `std::vector` case the trigger is reallocation: growth copies every element into the new buffer and then destroys the originals, so one push_back can produce both the copy and the fatal destructor call.',
      'The fixes, in the order I would actually reach for them. First, rule of zero — replace `char*` with `std::vector<char>` or `std::unique_ptr<char[]>`, and then write none of the special members, because the member already has correct semantics. Second, if the raw pointer must stay, write the copy constructor and copy assignment to deep-copy, and remember that declaring the destructor suppressed the implicit move operations, so add those explicitly and mark the move constructor `noexcept` or `vector` will keep copying on growth. Third, if the type should not be copyable at all, `= delete` the copy operations so the mistake becomes a compile error.',
    ],
  },

  exercise: [
    'Paste the class from the code block into a file, delete lines 11 through 26 so only the constructor and destructor remain, then build it with `g++ -g -fsanitize=address blob.cpp -o blob && ./blob`. AddressSanitizer prints `attempting double-free`, and — the part worth reading carefully — it prints three stacks: where the block was allocated, where it was first freed, and where the second free came from. Learning to read that triple is worth more than the lesson text.',
    'Now restore the copy constructor and run it again under `valgrind --tool=memcheck ./blob`. Confirm "All heap blocks were freed" and note that the block count went from one to two — you can see the price of the deep copy in the allocation count, not just in the theory.',
    'Finally, add `Blob(const Blob&) = delete;` and try to build a `std::vector<Blob>` and `push_back` into it. Read the compiler error and find the line that names the copy constructor as the deleted function. That error message is the shape of a bug caught at 9am instead of at 3am.',
  ],
};
