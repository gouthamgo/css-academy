/* ============================================================
   Curriculum manifest.

   Only metadata lives here — enough to draw the sidebar and route
   without pulling in every lesson. The lesson body is fetched on
   demand via `load()`, so opening the site costs one small module
   rather than the whole curriculum.
   ============================================================ */

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
        'The stack, the heap, and who is responsible for cleaning up. This tier is where most C++ bugs are born and killed.',
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
      {
        id: 'the-stack',
        title: 'The stack',
        tier: 'memory',
        core: true,
        load: () => import('./cpp/the-stack.js'),
      },
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
      performance: 'Allocation, zero-copy parsing, SIMD and honest benchmarking.',
      concurrency:
        'Send, Sync, atomics, and why the compiler can prove your threading is sound.',
      applied: 'Parsers, queues and the systems people actually pay for.',
    },
    lessons: [],
  },
];
