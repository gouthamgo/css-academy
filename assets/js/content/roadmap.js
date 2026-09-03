/* ============================================================
   The honest roadmap.

   This page exists because the most expensive mistake a
   self-taught candidate makes is not studying the wrong topic —
   it is aiming at the wrong door for two years. Everything here
   is sourced from job postings, engineering blogs and published
   interview guidance rather than from vibes.
   ============================================================ */

export const roadmap = {
  title: 'The honest path to the job',
  lede: 'What the market actually looks like, what the timeline actually is, and what to build. Read this before lesson one.',

  reality: {
    heading: 'Start with the uncomfortable part',
    points: [
      {
        claim: 'C++ is not merely ahead of Rust in trading. It is roughly five to one.',
        detail:
          'UK IT Jobs Watch has C++ at ~1,500 permanent postings against Rust at ~309, and Rust postings in London actually *fell* through 2025. Hudson River Trading, Optiver, IMC, XTX and Citadel Securities all describe their core hiring in C++. Citadel Securities gives its engineers early access to C++26 and employs Herb Sutter — that is a firm doubling down, not hedging.',
      },
      {
        claim: 'The strongest evidence against a Rust-first trading plan comes from a company that loves Rust.',
        detail:
          'Databento already runs more than half its core infrastructure in Rust. When they rewrote their feed handler — 14 million messages a second, sub-100µs — they evaluated Rust and chose C++, citing template flexibility, control over resource sharing, and the fact that the ownership model "would add more friction than flexibility" for that specific job.',
      },
      {
        claim: 'Rust is a real career. It is just a different door.',
        detail:
          'Cloudflare replaced nginx fleet-wide with Pingora. AWS Firecracker, Dropbox sync, Discord read-states, Modal\'s container runtime, Polars and DataFusion are all Rust. Anthropic runs Python plus Rust. That market is smaller but far more open to a self-taught candidate, because those teams hire visibly from open-source contributors.',
      },
      {
        claim: 'The bar is not knowledge. It is shipped, latency-sensitive production work.',
        detail:
          'The rejection line quant recruiters relay most often is "good C++ fundamentals, but not enough experience with latency-sensitive systems." Citadel took roughly 108,000 internship applications for under 300 places. You do not beat that funnel with more study — you beat it by getting an adjacent systems job first.',
      },
    ],
  },

  phases: [
    {
      n: 1,
      window: 'Months 0–4',
      name: 'Become a real C++ programmer',
      goal: 'Write correct, modern, non-trivial C++ without looking things up constantly. Clear the automated screen.',
      does: [
        'Work the C++ track here end to end, foundations through abstraction.',
        'Read *Effective Modern C++* once you can already write the code.',
        'Grind data structures and algorithms to the point where NeetCode 150 is comfortable. This is not optional — the first gate at every firm is an auto-graded timed test, and no amount of systems depth saves you if you never reach a human.',
      ],
      trap: 'Skipping the algorithm practice because it feels less interesting than systems work. The OA is unskippable and it is where most self-taught candidates die.',
    },
    {
      n: 2,
      window: 'Months 4–10',
      name: 'Learn the machine',
      goal: 'Stop guessing about performance. Every "why is this slow" answer should bottom out in the memory hierarchy.',
      does: [
        'Work the Machine track here — cache lines, locality, branch prediction, false sharing, allocation cost.',
        'Read Drepper, *What Every Programmer Should Know About Memory*, and either CSAPP or OSTEP.',
        'Do every [perf-ninja](https://github.com/dendibakh/perf-ninja) lab and write a short post-mortem for each. It is third-party-verifiable evidence, which a personal repo is not.',
        'Live in [Compiler Explorer](https://godbolt.org) and `perf`. Learn to read the assembly your code becomes.',
        'Watch Carl Cook, *When a Microsecond Is an Eternity*, and David Gross, *When Nanoseconds Matter*. Then watch them again taking notes.',
      ],
      trap: 'Reading about caches without measuring anything. The skill being hired is measurement, and it only develops with a profiler open.',
    },
    {
      n: 3,
      window: 'Months 10–18',
      name: 'Concurrency, and build the portfolio',
      goal: 'A single coherent repo that a hiring manager can read in ten minutes and want to talk to you about.',
      does: [
        'Work the Concurrency tier: the memory model, atomics, orderings, lock-free structures.',
        'Read Anthony Williams, *C++ Concurrency in Action*.',
        'Build projects 1–4 below as **one system**, not four repos.',
        'Start contributing to a real systems codebase in parallel. It compounds and it takes months to land the first merge.',
      ],
      trap: 'Building four disconnected toy repos. One coherent system with real numbers beats a pile of half-finished ones.',
    },
    {
      n: 4,
      window: 'Months 12–24',
      name: 'Get an adjacent job — this is the actual target',
      goal: 'Any production role where latency and systems depth genuinely matter. Not the thirteen famous firms.',
      does: [
        '**Market data and trading infrastructure:** Databento, Exegy, Redline, MayStreet, Options IT.',
        '**Exchanges and brokers:** CME, Nasdaq, ICE, IEX, MEMX, Cboe, LSEG, Interactive Brokers, Tradeweb.',
        '**Database and streaming internals:** ClickHouse, QuestDB, Redpanda, ScyllaDB, DuckDB, InfluxDB. ClickHouse explicitly values performance engineering "in a database or areas like high-frequency trading" — that transfer runs both ways.',
        '**Crypto market makers and exchanges:** Wintermute, GSR, Kraken, Deribit. The most Rust-friendly corner and the most open to non-traditional backgrounds.',
        '**Infrastructure:** Cloudflare, Modal, Fly.io, Temporal.',
        '**Second-tier prop shops:** Belvedere, Peak6, Chicago Trading, Wolverine, Quantlab, Headlands, XR Trading. Real work, far wider funnel.',
        '**Bloomberg** — the classic C++ on-ramp, and a well-worn stepping stone into trading tech.',
      ],
      trap: 'Applying only to Jane Street, Citadel and HRT, getting silence for a year, and concluding you are not good enough. The funnel is the problem, not you.',
    },
    {
      n: 5,
      window: 'Years 2–4',
      name: 'Now you are an HFT candidate',
      goal: 'Two years of production latency-sensitive work converts the standard rejection line into a hire.',
      does: [
        'Apply to the top tier with production experience behind every résumé claim.',
        'By now you should be able to defend every performance decision you have shipped, with numbers.',
      ],
      trap: 'Nothing here is a shortcut. This is the reliable route without a top-school quantitative degree, and it works.',
    },
  ],

  projects: {
    heading: 'What to build, ranked by signal per hour',
    note: 'Every one of these needs a README with a benchmark methodology, a p50 / p99 / p99.9 histogram, and a section on what you tried that did not work. A repository without numbers is worth close to nothing. The write-up is the artifact; the code is the evidence.',
    items: [
      {
        rank: 1,
        name: 'Lock-free SPSC ring buffer',
        effort: '1–2 weeks',
        proves: 'Memory model, acquire/release ordering, false sharing, cache-line padding, cursor caching.',
        asked: '"Show me where you avoided a cross-core read." The highest signal per hour on this list.',
      },
      {
        rank: 2,
        name: 'Limit order book and matching engine',
        effort: '3–5 weeks',
        proves: 'Price-time priority, O(1) top-of-book, O(1) cancel-by-id, intrusive lists, no allocation in the hot path.',
        asked: '"Walk me through a cancel. How many cache misses?" It is also the most common take-home, so you arrive pre-solved.',
      },
      {
        rank: 3,
        name: 'ITCH / MoldUDP64 feed handler',
        effort: '2–4 weeks',
        proves: 'Zero-copy binary parsing, packed struct layout, UDP multicast, sequence-gap recovery, throughput discipline.',
        asked: '"What happens on a gap, and how do you handle it without allocating?"',
      },
      {
        rank: 4,
        name: 'A latency-measurement harness you would defend in review',
        effort: '1–2 weeks',
        proves: 'TSC timing, HdrHistogram, coordinated-omission awareness, pinned cores, C-states disabled.',
        asked: '"Your mean is 200ns — what is your p99.9, and how do you know your measurement is not the bottleneck?" Cheap to build and disproportionately impressive, because almost no candidate can benchmark correctly.',
      },
      {
        rank: 5,
        name: 'perf-ninja, completed, with a post-mortem per lab',
        effort: '3–6 weeks',
        proves: 'Cache misses, branch mispredictions, vectorization — demonstrated against a third-party bar rather than claimed.',
        asked: 'It doubles as the fastest way to actually learn the differentiator topics.',
      },
      {
        rank: 6,
        name: 'Merged pull requests to a real systems project',
        effort: 'ongoing',
        proves: 'Reading a large hostile codebase, writing tests, surviving code review.',
        asked: 'Beats every solo repository. This is what converts "self-taught" into "ships in production codebases", and it has the highest ceiling on the list. ClickHouse, DataFusion, arrow-rs, Polars, Redpanda, DuckDB, tokio.',
      },
      {
        rank: 7,
        name: 'Kernel-bypass or io_uring networking experiment',
        effort: '2–4 weeks',
        proves: 'Syscall cost, the busy-polling tradeoff, the NIC and driver model.',
        asked: '"Why is one core pinned at 100%, and is that acceptable?" Rare enough among candidates to be memorable.',
      },
      {
        rank: 8,
        name: 'Custom allocator or memory pool',
        effort: '1–2 weeks',
        proves: 'Why hot paths do not call malloc, measuring tail rather than mean, thread-local pools.',
        asked: 'Directly answers a question you will be asked anyway.',
      },
      {
        rank: 9,
        name: 'The same component in both C++ and Rust',
        effort: '+1–2 weeks on existing work',
        proves: 'Language judgment rather than language tribalism — the posture Databento and ClickHouse both take publicly.',
        asked: '"When would you *not* use Rust?" One piece of work that makes you interesting to both markets.',
      },
      {
        rank: 10,
        name: 'A CUDA kernel — fused op or tiled GEMM',
        effort: '3–5 weeks',
        proves: 'Opens the ML-infrastructure door instead of the trading one. Only build it if that is a real target.',
        asked: 'Orthogonal to HFT. High value at NVIDIA and inference-engine startups.',
      },
    ],
    avoid: [
      'Another crypto trading bot.',
      'Another backtester.',
      'Another "HFT strategy with an LSTM".',
      'These read as finance hobbyist rather than systems engineer, and there are thousands of them.',
    ],
  },

  offer: {
    heading: 'What actually decides the offer',
    wins: [
      '**Measurement over assertion.** "I would guess the hash map is the bottleneck" loses to "this is pointer chasing, one cache miss per node, roughly 100ns each, three per lookup."',
      '**Owning the tradeoff.** Jane Street says it plainly: they want candidates who note where tradeoffs exist and explain which side they took and why.',
      '**The journey, not the snapshot.** Interviews are run as simulations of working with you. How you take a hint matters more than whether you needed it.',
      '**Knowing what your code compiles to.** If your answer to "why is this slow" never reaches the memory hierarchy, you are capped.',
      '**Coachability.** You will be shipping to a live trading system, sometimes the same day. Arrogance is scored as risk.',
    ],
    kills: [
      'Reciting the definition of `memory_order_acquire` but being unable to write a correct SPSC queue.',
      'Optimising without measuring.',
      'Reacting defensively to a hint. Interviewers add requirements mid-problem on purpose.',
      'Claiming depth on a résumé that has nothing behind it. These interviewers hunt résumé claims specifically.',
    ],
  },

  closing:
    'Eighteen to twenty-four months of hard, focused work to a first systems job. Three to five years to a top-tier trading offer. Anyone promising six months is selling a course. The single best predictor of whether you get there is whether you are still doing perf-ninja labs in month fourteen.',
};
