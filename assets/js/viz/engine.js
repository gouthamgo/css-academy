/* ============================================================
   Step-through diagram engine.

   Three findings from the education research shape this design,
   and it is worth stating them because they are counter-intuitive:

   1. Animation, on its own, does not teach. Controlled studies
      repeatedly find animated graphics no better than good static
      ones. What helps is *learner-paced discrete states* — so the
      Next button, not the motion, is the pedagogy. Every step must
      make complete sense as a frozen frame.

   2. Passive viewing is the level at which visualisation stops
      helping. Being asked to *predict* before the reveal is the
      cheapest intervention that moves a learner past it. Hence
      `predict` on a step.

   3. Attention must be directed. On any step, the thing being
      talked about is at full contrast and everything else is
      dimmed. Hence `focus`.

   Mechanically: a step returns the COMPLETE list of shapes for
   that moment. The engine diffs consecutive lists by `key`. A key
   present in both keeps its DOM node and travels; that travel is
   what preserves object identity so the learner never has to
   re-find anything. Steps are pure functions of the index, so
   stepping backwards and deep-linking both land in the same place
   as stepping forwards.
   ============================================================ */

import { renderShape, buildDefs, LAYER } from './primitives.js';
import { fmt } from '../format.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const AUTOPLAY_MS = 2600;
const BURST_MS = 250; // rapid clicks skip tweens — the learner wants to arrive

const reduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Content identity, ignoring position and opacity. */
function signature(d) {
  const { x, y, opacity, ...rest } = d;
  return JSON.stringify(rest);
}

export function mountScene(container, scene) {
  const width = scene.width ?? 720;
  const height = scene.height ?? 400;
  const steps = scene.steps ?? [];

  container.innerHTML = '';
  container.classList.add('viz');

  container.innerHTML = `
    <div class="viz__head">
      <div class="viz__titles">
        <span class="viz__label">Figure</span>
        <h4 class="viz__title"></h4>
      </div>
      <div class="viz__counter mono"></div>
    </div>
    <div class="viz__stage"></div>
    <div class="viz__predict" hidden>
      <p class="viz__predict-q"></p>
      <div class="viz__predict-opts"></div>
      <p class="viz__predict-fb" hidden></p>
    </div>
    <p class="viz__say" role="status" aria-live="polite"></p>
    <div class="viz__controls">
      <button class="viz__btn" data-act="prev" aria-label="Previous step">
        <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <div class="viz__dots" role="tablist" aria-label="Steps"></div>
      <button class="viz__btn viz__btn--text" data-act="restart">Restart</button>
      <button class="viz__btn viz__btn--text" data-act="table" aria-expanded="false">Show as text</button>
      <button class="viz__btn viz__btn--play" data-act="play" aria-label="Play through the steps">
        <svg viewBox="0 0 24 24" class="ico-play"><path d="M6 4l14 8-14 8z" fill="currentColor" stroke="none"/></svg>
        <svg viewBox="0 0 24 24" class="ico-pause" hidden><path d="M7 4v16M17 4v16"/></svg>
      </button>
      <button class="viz__btn viz__btn--next" data-act="next">
        Next <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    </div>
    <div class="viz__table" hidden></div>
  `;

  const q = (sel) => container.querySelector(sel);
  q('.viz__title').textContent = scene.title ?? '';

  const stageEl = q('.viz__stage');
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.appendChild(buildDefs());
  const titleNode = document.createElementNS(SVGNS, 'title');
  titleNode.textContent = scene.title ?? 'Diagram';
  svg.appendChild(titleNode);
  stageEl.appendChild(svg);

  const sayEl = q('.viz__say');
  const counterEl = q('.viz__counter');
  const dotsEl = q('.viz__dots');
  const playBtn = q('[data-act="play"]');
  const predictEl = q('.viz__predict');
  const predictQ = q('.viz__predict-q');
  const predictOpts = q('.viz__predict-opts');
  const predictFb = q('.viz__predict-fb');
  const tableEl = q('.viz__table');

  dotsEl.innerHTML = steps
    .map(
      (_, i) =>
        `<button class="viz__dot" data-step="${i}" role="tab" aria-label="Step ${i + 1}"></button>`
    )
    .join('');

  /* ---- State ---- */
  const live = new Map(); // key -> { node, sig }
  const answered = new Set(); // step indices whose prediction is done
  let index = -1;
  let timer = null;
  let anims = [];
  let lastNav = 0;

  const shapesFor = (i) => {
    const step = steps[i];
    if (!step) return [];
    const raw = typeof step.shapes === 'function' ? step.shapes() : step.shapes;
    return (raw ?? []).flat(Infinity).filter(Boolean);
  };

  function cancelAnims() {
    anims.forEach((a) => {
      try {
        a.cancel();
      } catch {
        /* already finished */
      }
    });
    anims = [];
  }

  function render(i, animate) {
    const step = steps[i];
    const next = shapesFor(i);
    const focus = new Set(step?.focus ?? []);
    const seen = new Set();

    next.sort((a, b) => (LAYER[a.type] ?? 0) - (LAYER[b.type] ?? 0));

    for (const d of next) {
      seen.add(d.key);
      // Signalling: when a step names a focus set, everything else recedes.
      const dim = focus.size > 0 && !focus.has(d.key);
      const existing = live.get(d.key);
      const sig = signature(d);

      if (!existing) {
        const node = renderShape(d);
        if (!node) continue;
        node.classList.toggle('is-dim', dim);
        svg.appendChild(node);
        node.style.opacity = String(d.opacity ?? 1);
        if (animate && !reduced()) {
          anims.push(
            node.animate(
              [{ opacity: 0 }, { opacity: String(d.opacity ?? 1) }],
              { duration: 260, easing: 'cubic-bezier(0,.55,.45,1)', fill: 'both' }
            )
          );
        }
        live.set(d.key, { node, sig });
        continue;
      }

      const { node } = existing;
      node.classList.toggle('is-dim', dim);
      if (d.type !== 'arrow') {
        node.setAttribute('transform', `translate(${d.x ?? 0} ${d.y ?? 0})`);
      }
      node.style.opacity = String(d.opacity ?? 1);

      if (existing.sig !== sig) {
        // Interior changed: a value, a colour, a label. Cross-fade the
        // interior while the group itself keeps travelling. Numbers are
        // never tweened — the machine had no intermediate value.
        const fresh = renderShape(d);
        const oldInner = node.firstElementChild;
        const newInner = fresh?.firstElementChild;
        if (newInner) {
          if (animate && !reduced()) {
            newInner.style.opacity = '0';
            node.appendChild(newInner);
            requestAnimationFrame(() => {
              newInner.style.opacity = '1';
              if (oldInner) oldInner.style.opacity = '0';
            });
            setTimeout(() => oldInner?.remove(), 180);
          } else {
            oldInner?.remove();
            node.appendChild(newInner);
          }
        }
        existing.sig = sig;
      }

      svg.appendChild(node);
    }

    for (const [key, entry] of live) {
      if (seen.has(key)) continue;
      const { node } = entry;
      live.delete(key);
      if (animate && !reduced()) {
        node.style.opacity = '0';
        setTimeout(() => node.remove(), 180);
      } else {
        node.remove();
      }
    }
  }

  /* ---- The text alternative ----
     Serves screen readers, serves anyone who finds six arrows harder
     to read than a list, and doubles as a debugging view. */
  function buildTable(i) {
    const rows = shapesFor(i)
      .filter((d) => ['frame', 'cell', 'box', 'tag'].includes(d.type))
      .map((d) => {
        const what =
          d.type === 'frame'
            ? `${d.label}: ${(d.vars ?? [])
                .map((v) => `${v.name} = ${v.value}`)
                .join(', ')}`
            : `${d.name ?? d.label ?? d.text ?? d.key} ${
                d.value !== undefined ? `= ${d.value}` : ''
              }`;
        return `<tr><td class="mono">${d.type}</td><td>${what}</td><td class="mono">${
          d.tone ?? ''
        }</td></tr>`;
      })
      .join('');
    const links = shapesFor(i)
      .filter((d) => d.type === 'arrow')
      .map(
        (d) =>
          `<tr><td class="mono">arrow</td><td>${d.label ?? 'points to'}</td><td class="mono">${
            d.tone ?? ''
          }</td></tr>`
      )
      .join('');
    tableEl.innerHTML = `
      <table>
        <caption>State at step ${i + 1}</caption>
        <thead><tr><th>Kind</th><th>What it holds</th><th>State</th></tr></thead>
        <tbody>${rows}${links}</tbody>
      </table>`;
  }

  /* ---- Prediction prompt ----
     Shown on the way *into* a step that declares one. The learner
     commits to an answer before seeing the reveal. */
  function showPredict(i) {
    const p = steps[i].predict;
    predictQ.innerHTML = fmt(p.ask);
    predictFb.hidden = true;
    predictOpts.innerHTML = p.options
      .map(
        (o, oi) =>
          `<button class="predict-opt" data-opt="${oi}">${fmt(o.label)}</button>`
      )
      .join('');
    predictEl.hidden = false;
    predictEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  predictOpts.addEventListener('click', (e) => {
    const btn = e.target.closest('.predict-opt');
    if (!btn) return;
    const target = index + 1;
    const p = steps[target]?.predict;
    if (!p) return;

    const chosen = p.options[Number(btn.dataset.opt)];
    predictOpts
      .querySelectorAll('.predict-opt')
      .forEach((b, bi) => {
        b.disabled = true;
        b.classList.toggle('is-right', p.options[bi].correct);
        b.classList.toggle('is-wrong', bi === Number(btn.dataset.opt) && !chosen.correct);
      });

    predictFb.innerHTML = fmt(
      `${chosen.correct ? 'Right.' : 'Not quite.'} ${p.because ?? ''}`
    );
    predictFb.classList.toggle('is-right', Boolean(chosen.correct));
    predictFb.hidden = false;

    answered.add(target);
    setTimeout(() => {
      predictEl.hidden = true;
      go(target, { fromUser: true });
    }, chosen.correct ? 900 : 2200);
  });

  /* ---- Navigation ---- */
  function go(i, { fromUser = false, animate = true } = {}) {
    const target = Math.max(0, Math.min(steps.length - 1, i));
    if (target === index) return;

    // Gate forward movement on an unanswered prediction.
    if (fromUser && target === index + 1 && steps[target]?.predict && !answered.has(target)) {
      showPredict(target);
      return;
    }
    predictEl.hidden = true;

    const now = Date.now();
    const burst = now - lastNav < BURST_MS;
    lastNav = now;

    cancelAnims();
    index = target;
    render(index, animate && !burst);

    const step = steps[index];
    sayEl.innerHTML = fmt(step?.say ?? '');
    counterEl.textContent = `${index + 1} / ${steps.length}`;
    titleNode.textContent = `${scene.title ?? 'Diagram'}. Step ${index + 1}: ${step?.say ?? ''}`;

    dotsEl.querySelectorAll('.viz__dot').forEach((dot, di) => {
      dot.classList.toggle('is-active', di === index);
      dot.classList.toggle('is-past', di < index);
      dot.setAttribute('aria-selected', di === index ? 'true' : 'false');
    });

    q('[data-act="prev"]').disabled = index === 0;
    q('[data-act="next"]').disabled = index === steps.length - 1;

    if (!tableEl.hidden) buildTable(index);

    container.dispatchEvent(
      new CustomEvent('viz:step', {
        bubbles: true,
        detail: { index, mark: step?.mark ?? [], sceneId: scene.id },
      })
    );

    if (fromUser && timer) stopPlay();
    if (timer && index === steps.length - 1) stopPlay();
  }

  function stopPlay() {
    clearInterval(timer);
    timer = null;
    playBtn.querySelector('.ico-play').hidden = false;
    playBtn.querySelector('.ico-pause').hidden = true;
    playBtn.setAttribute('aria-label', 'Play through the steps');
  }

  function play() {
    if (timer) return stopPlay();
    if (index >= steps.length - 1) go(0);
    playBtn.querySelector('.ico-play').hidden = true;
    playBtn.querySelector('.ico-pause').hidden = false;
    playBtn.setAttribute('aria-label', 'Pause');
    timer = setInterval(() => {
      // Never blow past a prediction on autoplay.
      if (steps[index + 1]?.predict && !answered.has(index + 1)) return stopPlay();
      go(index + 1);
    }, AUTOPLAY_MS);
  }

  container.querySelector('.viz__controls').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === 'prev') go(index - 1, { fromUser: true });
    else if (act === 'next') go(index + 1, { fromUser: true });
    else if (act === 'play') play();
    else if (act === 'restart') {
      stopPlay();
      index = -1;
      go(0, { fromUser: true, animate: false });
    } else if (act === 'table') {
      const open = tableEl.hidden;
      tableEl.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? 'Hide text' : 'Show as text';
      if (open) buildTable(index);
    } else if (btn.dataset.step !== undefined) {
      go(Number(btn.dataset.step), { fromUser: true });
    }
  });

  container.tabIndex = 0;
  container.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(index + 1, { fromUser: true });
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(index - 1, { fromUser: true });
    } else if (e.key === 'Home') {
      e.preventDefault();
      go(0, { fromUser: true });
    } else if (e.key === 'End') {
      e.preventDefault();
      go(steps.length - 1, { fromUser: true });
    }
  });

  go(0, { animate: false });

  return {
    destroy() {
      stopPlay();
      cancelAnims();
      container.innerHTML = '';
      live.clear();
    },
    goTo: (i) => go(i, { fromUser: true }),
  };
}
