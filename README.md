# zerocost

**Learn C++ and Rust from zero, visually, for trading and ML infrastructure jobs.**

A from-scratch curriculum in systems programming, aimed squarely at getting hired
at quantitative trading firms and ML infrastructure teams. One concept at a time,
each with a diagram you step through yourself.

Live site: https://gouthamgo.github.io/cp/

---

## Why this exists, and the strategic call behind it

The market reality, from job postings and engineering blogs rather than vibes:

- **C++ is not merely ahead of Rust in trading — it is roughly five to one.**
  UK IT Jobs Watch has C++ at ~1,500 permanent postings against Rust at ~309,
  and Rust postings in London *fell* through 2025. HRT, Optiver, IMC, XTX and
  Citadel Securities all describe their core hiring in C++.

- **The strongest evidence against a Rust-first trading plan comes from a company
  that loves Rust.** Databento already runs more than half its core infrastructure
  in Rust. When they rewrote their feed handler — 14M messages/sec, sub-100µs —
  they evaluated Rust and chose C++.

- **Rust is a real career, through a different door.** Cloudflare replaced nginx
  fleet-wide with Pingora. AWS Firecracker, Dropbox sync, Discord read-states,
  Modal's container runtime, Polars and DataFusion are all Rust. That market is
  smaller but far more open to a self-taught candidate, because those teams hire
  visibly from open-source contributors.

So: **C++ first, deeply. Rust second.** The site is ordered accordingly, and
`#/path` lays out the honest timeline — 18–24 months to a first systems job,
3–5 years to a top-tier trading offer.

## How the teaching works

Every lesson has the same shape, because the shape is the method:

1. **The idea, plainly** — the mental model in ELI5 terms
2. **Watch it happen** — a step-through diagram you drive yourself
3. **The code** — annotated, with lines that highlight in sync with the diagram
4. **What is really going on** — the layer underneath
5. **Where people trip** — the specific gotchas
6. **If they ask you this** — a real interview question with a strong answer
7. **Your turn** — something to go build

### Three findings from the education research shaped the engine

These are counter-intuitive enough to be worth stating:

1. **Animation on its own does not teach.** Controlled studies repeatedly find
   animated graphics no better than well-designed static ones. What helps is
   *learner-paced discrete states*. So the Next button is the pedagogy, not the
   motion, and every step must make complete sense as a frozen frame.

2. **Passive viewing is the level at which visualisation stops helping.** Being
   asked to *predict* before the reveal is the cheapest fix. Steps can declare a
   `predict` prompt that gates forward movement.

3. **Attention must be directed.** On any step the thing being discussed is at
   full contrast and everything else dims. Steps declare a `focus` set.

Colour encodes *identity*; shape, stroke weight and dash pattern encode *state*.
That is simultaneously better pedagogy and free colour-blind accessibility — a
diagram that still reads when desaturated.

## Running it locally

No build step. It is flat files and ES modules.

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Modules need to be served over HTTP, so opening `index.html` from the filesystem
will not work.

## Layout

```
index.html                  app shell
assets/css/
  tokens.css                design tokens; light/dark is a token swap
  base.css                  reset and base typography
  app.css                   layout and components
  viz.css                   diagram chrome
assets/js/
  app.js                    hash router, sidebar, theme, progress
  render.js                 lesson renderer
  render-roadmap.js         the job-path page
  highlight.js              dependency-free C++/Rust highlighter
  store.js                  localStorage progress
  viz/engine.js             step-through diagram engine
  viz/primitives.js         drawing primitives
  content/index.js          curriculum manifest (metadata only)
  content/roadmap.js        the honest path to the job
  content/cpp/*.js          one file per lesson, loaded on demand
  content/rust/*.js
```

The manifest holds only enough metadata to draw the sidebar and route. Lesson
bodies load on demand, so opening the site costs one small module rather than the
whole curriculum.

## Writing a lesson

Add an entry to the track's `lessons` array in `content/index.js`, then create
the module it points at:

```js
export default {
  oneLiner: 'One sentence on what this gives you.',
  whyJob: 'Why an interviewer cares.',
  mentalModel: 'The ELI5 intuition. Two or three sentences.',

  scene: {
    id: 'call-stack',
    title: 'A function call, one frame at a time',
    width: 720, height: 400,
    legend: [{ tone: 'stack', label: 'live stack frame' }],
    steps: [
      {
        say: 'Narration. Complementary to the diagram, never a transcript of it.',
        mark: ['8-9'],            // highlights these lines in the code block
        focus: ['main'],          // everything else dims
        predict: {                // optional; gates forward movement
          ask: 'What happens to the frame when the function returns?',
          options: [
            { label: 'The bytes are zeroed', correct: false },
            { label: 'The stack pointer moves back up', correct: true },
          ],
          because: 'Nothing is erased — the space is just marked reusable.',
        },
        shapes: () => [ /* primitives */ ],
      },
    ],
  },

  code: { lang: 'cpp', filename: 'stack.cpp', source: '...', annotations: [] },
  deeper: ['...'],
  gotchas: ['...'],
  interview: { q: '...', a: ['...'] },
  exercise: ['...'],
};
```

Steps are **pure functions of the index** — a step returns the complete list of
shapes for that moment, and the engine diffs consecutive lists by `key`. A key
present in both keeps its DOM node and travels, which is what preserves object
identity so the learner never has to re-find anything. Because steps accumulate
no state, stepping backwards and deep-linking land in exactly the same place as
stepping forwards.

## Progress

Stored in `localStorage` under `zerocost:v1`. Nothing is uploaded anywhere.
