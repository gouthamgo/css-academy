/* ============================================================
   Lesson renderer. Turns a lesson descriptor into DOM.
   ============================================================ */

import { highlightLines } from './highlight.js';
import { mountScene } from './viz/engine.js';

/* ---- Tiny inline formatter -------------------------------------
   Supports `code`, **strong**, *emphasis* and [text](url).
   Everything is escaped first, so lesson text can contain <, > and &
   without ceremony. */
const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export function fmt(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
}

const paras = (value) =>
  (Array.isArray(value) ? value : [value])
    .filter(Boolean)
    .map((p) => `<p>${fmt(p)}</p>`)
    .join('');

const TIER_NAMES = {
  foundations: 'Foundations',
  memory: 'Memory',
  ownership: 'Ownership',
  abstraction: 'Abstraction',
  performance: 'Performance',
  concurrency: 'Concurrency',
  applied: 'Applied',
};

/* ---- Playground links ------------------------------------------
   Rust Playground accepts the source in a query parameter. Compiler
   Explorer does not accept plain source in a URL without a saved
   state blob, so C++ links open Godbolt and the source is copied to
   the clipboard instead — an honest fallback rather than a link that
   silently loses the code. */
function runLink(code) {
  if (code.lang === 'rust') {
    const url =
      'https://play.rust-lang.org/?edition=2021&code=' +
      encodeURIComponent(code.source);
    return { href: url, label: 'Run in Playground' };
  }
  return { href: 'https://godbolt.org/', label: 'Open Godbolt', copyFirst: true };
}

function parseLineSpec(spec) {
  // "3", "3-5", "3,7-9"
  const out = [];
  for (const part of String(spec).split(',')) {
    const [a, b] = part.split('-').map((n) => parseInt(n.trim(), 10));
    if (Number.isNaN(a)) continue;
    if (Number.isNaN(b)) out.push(a);
    else for (let i = a; i <= b; i++) out.push(i);
  }
  return out;
}

function codeBlock(code) {
  const link = runLink(code);
  const annotated = (code.annotations ?? [])
    .map(
      (a) => `
      <div class="annotation">
        <span class="annotation__line">${escapeHtml(
          String(a.lines).includes('-') ? `L${a.lines}` : `L${a.lines}`
        )}</span>
        <span>${fmt(a.text)}</span>
      </div>`
    )
    .join('');

  return `
    <div class="codeblock" data-lang="${escapeHtml(code.lang)}">
      <div class="codeblock__bar">
        <span class="codeblock__name">${escapeHtml(
          code.filename ?? (code.lang === 'rust' ? 'main.rs' : 'main.cpp')
        )}</span>
        <div class="codeblock__actions">
          <button class="minibtn" data-act="copy">Copy</button>
          <a class="minibtn" href="${link.href}" target="_blank" rel="noopener noreferrer"
             ${link.copyFirst ? 'data-act="copy-then-open"' : ''}>${link.label}</a>
        </div>
      </div>
      <pre><code id="codeBody">${highlightLines(code.source, code.lang)}</code></pre>
      ${annotated ? `<div class="annotations">${annotated}</div>` : ''}
    </div>`;
}

function block(num, title, bodyHtml, extraClass = '') {
  return `
    <section class="block ${extraClass}">
      <div class="block__head">
        <span class="block__num">${num}</span>
        <h2 class="block__title">${escapeHtml(title)}</h2>
      </div>
      <div class="block__body">${bodyHtml}</div>
    </section>`;
}

/**
 * Render one lesson into `mount`.
 * Returns a teardown function.
 */
export function renderLesson(mount, { lesson, track, index, total, prev, next, store }) {
  const done = store.isDone(track.id, lesson.id);
  let n = 0;

  const legend = lesson.scene?.legend
    ? `<div class="viz-legend">${lesson.scene.legend
        .map(
          (l) =>
            `<span class="viz-legend__item" data-tone="${escapeHtml(l.tone)}">
               <span class="viz-legend__swatch"></span>${escapeHtml(l.label)}
             </span>`
        )
        .join('')}</div>`
    : '';

  mount.innerHTML = `
  <div class="wrap" data-track="${escapeHtml(track.id)}">
    <article class="lesson">

      <header class="lesson__head">
        <div class="lesson__crumbs">
          <span class="eyebrow">${escapeHtml(track.name)}</span>
          <span class="eyebrow">·</span>
          <span class="eyebrow">${escapeHtml(TIER_NAMES[lesson.tier] ?? lesson.tier)}</span>
          <span class="eyebrow">·</span>
          <span class="eyebrow">${index + 1} of ${total}</span>
          ${lesson.core ? '<span class="badge badge--core">Core</span>' : ''}
        </div>
        <h1 class="lesson__title">${escapeHtml(lesson.title)}</h1>
        <p class="lesson__lede">${fmt(lesson.oneLiner)}</p>
      </header>

      ${
        lesson.whyJob
          ? `<div class="callout">
               <span class="callout__icon">◆</span>
               <div>
                 <div class="callout__label">Why an interviewer cares</div>
                 <div class="callout__text">${fmt(lesson.whyJob)}</div>
               </div>
             </div>`
          : ''
      }

      ${block(
        ++n,
        'The idea, plainly',
        `<div class="model"><p class="model__text">${fmt(lesson.mentalModel)}</p></div>`
      )}

      ${
        lesson.scene
          ? block(
              ++n,
              'Watch it happen',
              `<div id="sceneMount"></div>${legend}
               <p class="viz__hint eyebrow">Use ← → to step, or press play.</p>`,
              'block--wide'
            )
          : ''
      }

      ${lesson.code ? block(++n, 'The code', codeBlock(lesson.code)) : ''}

      ${
        lesson.deeper?.length
          ? block(++n, 'What is really going on', paras(lesson.deeper))
          : ''
      }

      ${
        lesson.gotchas?.length
          ? block(
              ++n,
              'Where people trip',
              `<ul class="gotchas">${lesson.gotchas
                .map(
                  (g) =>
                    `<li class="gotcha"><span class="gotcha__mark">!</span><span>${fmt(
                      g
                    )}</span></li>`
                )
                .join('')}</ul>`
            )
          : ''
      }

      ${
        lesson.interview
          ? block(
              ++n,
              'If they ask you this',
              `<div class="interview">
                 <div class="interview__q">${fmt(lesson.interview.q)}</div>
                 <button class="interview__toggle" data-act="reveal" aria-expanded="false">
                   <span>Show a strong answer</span>
                 </button>
                 <div class="interview__a" id="answer">${paras(lesson.interview.a)}</div>
               </div>`
            )
          : ''
      }

      ${
        lesson.exercise
          ? block(
              ++n,
              'Your turn',
              `<div class="exercise">
                 <div class="exercise__label">Do this before moving on</div>
                 <div class="exercise__body">${paras(lesson.exercise)}</div>
               </div>`
            )
          : ''
      }

      <div class="lessonnav">
        <div class="lessonnav__side">
          ${
            prev
              ? `<a class="navlink" href="#/${track.id}/${prev.id}">
                   <span class="navlink__dir">← Previous</span>
                   <span class="navlink__title">${escapeHtml(prev.title)}</span>
                 </a>`
              : ''
          }
        </div>
        <button class="btn ${done ? 'btn--done' : 'btn--primary'}" data-act="complete">
          ${done ? '✓ Completed' : 'Mark complete'}
        </button>
        <div class="lessonnav__side lessonnav__side--next">
          ${
            next
              ? `<a class="navlink navlink--next" href="#/${track.id}/${next.id}">
                   <span class="navlink__dir">Next →</span>
                   <span class="navlink__title">${escapeHtml(next.title)}</span>
                 </a>`
              : ''
          }
        </div>
      </div>

    </article>
  </div>`;

  /* ---- Wire up behaviour ---- */
  let scene = null;
  const sceneMount = mount.querySelector('#sceneMount');
  if (sceneMount && lesson.scene) {
    scene = mountScene(sceneMount, lesson.scene);
  }

  // Sync diagram steps onto the code block.
  const codeBody = mount.querySelector('#codeBody');
  const onStep = (e) => {
    if (!codeBody || !lesson.code) return;
    const marks = e.detail.mark ?? [];
    codeBody.innerHTML = highlightLines(
      lesson.code.source,
      lesson.code.lang,
      marks.flatMap((m) => parseLineSpec(m))
    );
  };
  mount.addEventListener('viz:step', onStep);

  mount.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const act = btn.dataset.act;

    if (act === 'reveal') {
      const answer = mount.querySelector('#answer');
      const open = answer.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
      btn.querySelector('span').textContent = open
        ? 'Hide the answer'
        : 'Show a strong answer';
    }

    if (act === 'copy' || act === 'copy-then-open') {
      navigator.clipboard
        ?.writeText(lesson.code.source)
        .then(() => mount.dispatchEvent(
          new CustomEvent('app:toast', {
            bubbles: true,
            detail:
              act === 'copy-then-open'
                ? 'Code copied — paste it into Godbolt'
                : 'Code copied',
          })
        ))
        .catch(() => {});
    }

    if (act === 'complete') {
      const nowDone = !store.isDone(track.id, lesson.id);
      store.setDone(track.id, lesson.id, nowDone);
      btn.textContent = nowDone ? '✓ Completed' : 'Mark complete';
      btn.classList.toggle('btn--done', nowDone);
      btn.classList.toggle('btn--primary', !nowDone);
      mount.dispatchEvent(new CustomEvent('app:progress', { bubbles: true }));
      if (nowDone && next) {
        mount.dispatchEvent(
          new CustomEvent('app:toast', {
            bubbles: true,
            detail: `Done. Next up: ${next.title}`,
          })
        );
      }
    }
  });

  return () => {
    mount.removeEventListener('viz:step', onStep);
    scene?.destroy();
  };
}
