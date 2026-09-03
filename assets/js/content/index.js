/* ============================================================
   Curriculum manifest.

   Only metadata lives here — enough to draw the sidebar and route
   without pulling in every lesson. The lesson body is fetched on
   demand via `load()`, so opening the site costs one small module
   rather than the whole curriculum.

   `core: true` marks the lessons that come up in interviews over
   and over. The order is deliberate: each lesson assumes the one
   before it.
   ============================================================ */

const cpp = (id, title, tier, core = false) => ({
  id,
  title,
  tier,
  core,
  load: () => import(`./cpp/${id}.js`),
});

const rust = (id, title, tier, core = false) => ({
  id,
  title,
  tier,
  core,
  load: () => import(`./rust/${id}.js`),
});

export const tracks = [
  {
    id: 'cpp',
    name: 'C++',
    tagline:
      'The language the trading floor actually runs on. Roughly five times the job market of Rust, and the one every low-latency interview is conducted in.',
    blurb:
      'Start here. Not because C++ is more pleasant than Rust — it is not — but because Hudson River Trading, Optiver, IMC, XTX, Citadel Securities, ClickHouse and NVIDIA all hire in it, and because the machine-level thinking you build here transfers to everything else.',
    tiers: {
      foundations:
        'What a program is, how it becomes machine code, and where your data physically sits.',
      memory:
        'Pointers, the heap, layout, and who is responsible for cleaning up. This tier is where most C++ bugs are born and killed.',
      abstraction:
        'Classes, templates and polymorphism — and, more importantly, what each one costs at runtime.',
      performance:
        'The differentiator tier. Caches, branches, allocation and measurement. This is what separates a candidate who gets an offer from one who does not.',
      concurrency:
        'Threads, the memory model, atomics and lock-free structures. Expect to write a queue on a whiteboard.',
      applied:
        'The things you will actually be asked to build: a ring buffer, a feed parser, an order book.',
    },
    lessons: [
      // ---- foundations ----
      cpp('build-pipeline', 'How C++ becomes a program', 'foundations', true),
      cpp('types-and-bits', 'Types, values and the bits underneath', 'foundations', true),
      cpp('initialization', 'Initialization and the uninitialized grenade', 'foundations', true),
      cpp('the-stack', 'The stack', 'foundations', true),
      cpp('scope-and-lifetime', 'Scope, storage duration and linkage', 'foundations'),
      cpp('references', 'References: another name for the same thing', 'foundations', true),

      // ---- memory ----
      cpp('pointers', 'Pointers: references with the lid off', 'memory', true),
      cpp('arrays-and-contiguity', 'Arrays, contiguity and std::span', 'memory', true),
      cpp('const-correctness', 'const correctness', 'memory'),
      cpp('the-heap', 'The heap, and what it really costs', 'memory', true),
      cpp('struct-layout', 'Struct layout, padding and alignment', 'memory', true),
      cpp('raii', 'RAII: the load-bearing idea', 'memory', true),
      cpp('smart-pointers', 'Smart pointers', 'memory', true),

      // ---- abstraction ----
      cpp('copy-semantics', 'Copy semantics and the rule of three', 'abstraction', true),
      cpp('move-semantics', 'Move semantics', 'abstraction', true),
      cpp('vector-internals', 'Inside std::vector', 'abstraction', true),
      cpp('containers-real-cost', 'The containers and their real cost', 'abstraction', true),
      cpp('algorithms-and-lambdas', 'Algorithms, lambdas and inlining', 'abstraction'),
      cpp('templates', 'Templates: code that writes code', 'abstraction', true),
      cpp('type-deduction', 'auto, decltype and perfect forwarding', 'abstraction', true),
      cpp('concepts', 'Concepts', 'abstraction'),
      cpp('virtual-dispatch', 'Inheritance, vtables and object layout', 'abstraction', true),

      // ---- performance ----
      cpp('undefined-behavior', 'Undefined behaviour', 'performance', true),
      cpp('measure-first', 'Measure first: benchmarking and perf', 'performance', true),
      cpp('memory-hierarchy', 'The memory hierarchy and cache lines', 'performance', true),
      cpp('data-oriented-design', 'Data-oriented design: SoA versus AoS', 'performance', true),
      cpp('branch-prediction', 'Branch prediction', 'performance', true),
      cpp('cost-of-virtual', 'What virtual dispatch actually costs', 'performance', true),
      cpp('allocators', 'Custom allocators and memory pools', 'performance', true),

      // ---- concurrency ----
      cpp('threads', 'Threads and what they share', 'concurrency', true),
      cpp('data-races', 'Data races and the memory model', 'concurrency', true),
      cpp('mutexes', 'Mutexes and what they cost', 'concurrency', true),
      cpp('atomics', 'Atomics and memory ordering', 'concurrency', true),
      cpp('false-sharing', 'False sharing', 'concurrency', true),
      cpp('lock-free-spsc', 'A lock-free SPSC queue', 'concurrency', true),

      // ---- applied ----
      cpp('ring-buffer', 'Building a ring buffer', 'applied', true),
      cpp('market-data-parser', 'Parsing a binary market data feed', 'applied', true),
      cpp('order-book', 'Building an order book', 'applied', true),
      cpp('latency-measurement', 'Measuring latency honestly', 'applied', true),
    ],
  },

  {
    id: 'rust',
    name: 'Rust',
    tagline:
      'The infrastructure language. Cloudflare, AWS, Modal, Dropbox, Discord and the data-engine world hire here — and they hire from open source.',
    blurb:
      'A smaller market than C++, but a more open one for a self-taught candidate, because those teams read your merged pull requests rather than your degree. Take this track second, or first if infrastructure rather than trading is the real target.',
    tiers: {
      foundations: 'The toolchain, values, and how Rust thinks about data.',
      ownership:
        'The part everyone drops out at. Take it slowly — every later tier depends on it.',
      abstraction: 'Traits, generics, iterators and closures.',
      performance: 'Allocation, zero-copy parsing, unsafe, and honest benchmarking.',
      concurrency:
        'Send, Sync, atomics, and why the compiler can prove your threading is sound.',
    },
    lessons: [
      // ---- foundations ----
      rust('toolchain', 'Cargo and the toolchain', 'foundations'),
      rust('values-and-types', 'Values, types and shadowing', 'foundations', true),
      rust('stack-and-heap', 'Stack and heap in Rust', 'foundations', true),
      rust('structs-and-enums', 'Structs, enums and pattern matching', 'foundations', true),
      rust('option-and-result', 'Option, Result and the ? operator', 'foundations', true),

      // ---- ownership ----
      rust('ownership', 'Ownership', 'ownership', true),
      rust('moves', 'Moves', 'ownership', true),
      rust('copy-vs-clone', 'Copy versus Clone', 'ownership', true),
      rust('borrowing', 'Borrowing', 'ownership', true),
      rust('borrow-checker', 'The borrow checker as a state machine', 'ownership', true),
      rust('lifetimes', 'Lifetimes', 'ownership', true),
      rust('slices-and-str', 'Slices, String and &str', 'ownership', true),

      // ---- abstraction ----
      rust('traits', 'Traits', 'abstraction', true),
      rust('generics', 'Generics and monomorphization', 'abstraction', true),
      rust('trait-objects', 'Trait objects and dynamic dispatch', 'abstraction', true),
      rust('iterators', 'Iterators and laziness', 'abstraction', true),
      rust('closures', 'Closures: Fn, FnMut and FnOnce', 'abstraction', true),
      rust('smart-pointers', 'Box, Rc, Arc and RefCell', 'abstraction', true),

      // ---- performance ----
      rust('allocation', 'Where Rust allocates', 'performance', true),
      rust('zero-copy', 'Zero-copy parsing', 'performance', true),
      rust('unsafe', 'unsafe Rust and the aliasing rules', 'performance', true),
      rust('benchmarking', 'Benchmarking with criterion', 'performance', true),

      // ---- concurrency ----
      rust('send-and-sync', 'Send and Sync', 'concurrency', true),
      rust('threads-and-channels', 'Threads and channels', 'concurrency', true),
      rust('shared-state', 'Mutex, RwLock and shared state', 'concurrency', true),
      rust('atomics', 'Atomics and ordering', 'concurrency', true),
    ],
  },
];
