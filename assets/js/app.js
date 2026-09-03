/* ============================================================
   ZEROCOST — application shell.

   Hash routing so the whole thing works as flat files on GitHub
   Pages with no server rewrites:
     #/                     home
     #/<track>              track overview
     #/<track>/<lessonId>   a lesson
   ============================================================ */

import { tracks } from './content/index.js';
import { store } from './store.js';
import { renderLesson, fmt } from './render.js';
import { renderRoadmap } from './render-roadmap.js';

const $ = (sel, root = document) => root.querySelector(sel);

const view = $('#view');
const navTree = $('#navTree');
const sidebar = $('#sidebar');
const scrim = $('#scrim');
const searchBox = $('#searchBox');
const toastEl = $('#toast');
const toastText = $('#toastText');

const trackById = (id) => tracks.find((t) => t.id === id);

const TIER_ORDER = [
  'foundations',
  'memory',
  'ownership',
  'abstraction',
  'performance',
  'concurrency',
  'applied',
];
const TIER_NAMES = {
  foundations: 'Foundations',
  memory: 'Memory',
  ownership: 'Ownership',
  abstraction: 'Abstraction',
  performance: 'Performance',
  concurrency: 'Concurrency',
  applied: 'Applied',
};

let teardown = null;

/* ---------------------------------------------------------------
   Theme
   --------------------------------------------------------------- */
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const icon = $('#themeIcon');
  icon.innerHTML =
    theme === 'dark'
      ? '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'
      : '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
}

$('#themeBtn').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  store.setTheme(next);
  applyTheme(next);
});

/* ---------------------------------------------------------------
   Toast
   --------------------------------------------------------------- */
let toastTimer = null;
function toast(message) {
  toastText.textContent = message;
  toastEl.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2600);
}
document.addEventListener('app:toast', (e) => toast(e.detail));

/* ---------------------------------------------------------------
   Sidebar
   --------------------------------------------------------------- */
function navLinks(active) {
  const items = [
    { href: '#/', ico: '◇', label: 'Overview' },
    { href: '#/path', ico: '◆', label: 'The path to the job' },
  ];
  return `<div class="sidebar__links">${items
    .map(
      (i) =>
        `<a class="sidelink" href="${i.href}" ${
          active === i.href ? 'aria-current="page"' : ''
        }><span class="sidelink__ico">${i.ico}</span>${i.label}</a>`
    )
    .join('')}</div>`;
}

function buildNav(track, activeId, filter = '') {
  const q = filter.trim().toLowerCase();
  const match = (l) =>
    !q ||
    l.title.toLowerCase().includes(q) ||
    (l.tier ?? '').toLowerCase().includes(q);

  const visible = track.lessons.filter(match);

  const links = navLinks(location.hash === '#/path' ? '#/path' : location.hash === '' || location.hash === '#/' ? '#/' : null);

  if (!visible.length) {
    navTree.innerHTML =
      links +
      `<p class="eyebrow" style="padding:var(--s-5)">No lesson matches “${fmt(
        filter
      )}”.</p>`;
    return;
  }

  const byTier = new Map();
  visible.forEach((lesson) => {
    const tier = lesson.tier ?? 'foundations';
    if (!byTier.has(tier)) byTier.set(tier, []);
    byTier.get(tier).push(lesson);
  });

  const ordered = [...byTier.entries()].sort(
    (a, b) => TIER_ORDER.indexOf(a[0]) - TIER_ORDER.indexOf(b[0])
  );

  navTree.innerHTML = links + ordered
    .map(([tier, lessons]) => {
      const doneInTier = lessons.filter((l) => store.isDone(track.id, l.id)).length;
      return `
        <div class="tier">
          <div class="tier__head">
            <span class="tier__name">${TIER_NAMES[tier] ?? tier}</span>
            <span class="tier__rule"></span>
            <span class="tier__count">${doneInTier}/${lessons.length}</span>
          </div>
          ${lessons
            .map((lesson) => {
              const n = track.lessons.indexOf(lesson) + 1;
              const isDone = store.isDone(track.id, lesson.id);
              return `
                <a class="navitem ${isDone ? 'is-done' : ''}"
                   href="#/${track.id}/${lesson.id}"
                   ${lesson.id === activeId ? 'aria-current="page"' : ''}>
                  <span class="navitem__num">${isDone ? '✓' : String(n).padStart(2, '0')}</span>
                  <span class="navitem__title">
                    <span>${lesson.title}</span>
                    ${lesson.core ? '<span class="navitem__core" title="Core interview topic"></span>' : ''}
                  </span>
                </a>`;
            })
            .join('')}
        </div>`;
    })
    .join('');
}

searchBox.addEventListener('input', () => {
  const { trackId, lessonId } = parseHash();
  const track = trackById(trackId) ?? trackById(store.track) ?? tracks[0];
  buildNav(track, lessonId, searchBox.value);
});

/* Mobile drawer */
function setDrawer(open) {
  sidebar.classList.toggle('is-open', open);
  scrim.classList.toggle('is-open', open);
  scrim.hidden = !open;
  $('#menuBtn').setAttribute('aria-expanded', String(open));
}
$('#menuBtn').addEventListener('click', () => setDrawer(!sidebar.classList.contains('is-open')));
scrim.addEventListener('click', () => setDrawer(false));
navTree.addEventListener('click', (e) => {
  if (e.target.closest('.navitem')) setDrawer(false);
});

/* ---------------------------------------------------------------
   Progress
   --------------------------------------------------------------- */
function updateProgress(track) {
  const total = track.lessons.length;
  const done = track.lessons.filter((l) => store.isDone(track.id, l.id)).length;
  $('#progText').textContent = `${done} / ${total}`;
  $('#progFill').style.width = total ? `${(done / total) * 100}%` : '0%';
}

document.addEventListener('app:progress', () => {
  const { trackId, lessonId } = parseHash();
  const track = trackById(trackId) ?? tracks[0];
  updateProgress(track);
  buildNav(track, lessonId, searchBox.value);
});

/* ---------------------------------------------------------------
   Track switcher
   --------------------------------------------------------------- */
document.querySelectorAll('.trackswitch__btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.trackId;
    store.setTrack(id);
    const resume = store.lastSeen(id);
    location.hash = resume ? `#/${id}/${resume}` : `#/${id}`;
  });
});

function markTrackSwitch(trackId) {
  document.querySelectorAll('.trackswitch__btn').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.trackId === trackId));
  });
}

/* ---------------------------------------------------------------
   Views
   --------------------------------------------------------------- */
function renderHome() {
  document.documentElement.removeAttribute('data-track');
  view.innerHTML = `
  <div class="wrap">
    <div class="hero">
      <span class="eyebrow">C++ · Rust · systems</span>
      <h1>Learn the languages that trading floors and ML infrastructure actually run on.</h1>
      <p class="hero__lede">
        From zero. One concept at a time, each with a diagram you step through
        yourself. No prior systems programming assumed — and nothing hand-waved
        either.
      </p>
      <div style="display:flex;gap:var(--s-3);margin-top:var(--s-5);flex-wrap:wrap">
        <a class="btn btn--primary" href="#/path">Read the path to the job first</a>
        <a class="btn" href="#/cpp">Jump into C++</a>
      </div>
    </div>

    <div class="trackcards">
      ${tracks
        .map(
          (t) => `
        <a class="trackcard" href="#/${t.id}" data-track="${t.id}">
          <div class="trackcard__name">${t.name}</div>
          <p class="trackcard__desc">${fmt(t.tagline)}</p>
          <div class="trackcard__meta">
            <span>${t.lessons.length} lessons</span>
            <span>${t.lessons.filter((l) => l.core).length} core</span>
            <span>${store.doneCount(t.id)} done</span>
          </div>
        </a>`
        )
        .join('')}
    </div>

    <h2 class="section-title">How this works</h2>
    <div class="prose">
      <p>
        Every lesson has the same shape, because the shape is the method:
        <strong>the idea in plain words</strong>, then <strong>a diagram you
        drive yourself</strong>, then <strong>the code</strong>, then what is
        really going on underneath, the places people trip, an
        <strong>interview question</strong> on the topic, and something to go
        build.
      </p>
      <p>
        Lessons marked <span class="badge badge--core">Core</span> are the ones
        that come up in interviews over and over. If you are short on time, do
        those first — but the order is deliberate, and each lesson assumes the
        one before it.
      </p>
      <p>
        Progress is saved in this browser only. Nothing is uploaded anywhere.
      </p>
    </div>
  </div>`;
}

function renderTrackHome(track) {
  document.documentElement.dataset.track = track.id;
  const done = store.doneCount(track.id);
  const resume = store.lastSeen(track.id);
  const first = track.lessons[0];

  const byTier = new Map();
  track.lessons.forEach((l) => {
    const tier = l.tier ?? 'foundations';
    if (!byTier.has(tier)) byTier.set(tier, []);
    byTier.get(tier).push(l);
  });
  const ordered = [...byTier.entries()].sort(
    (a, b) => TIER_ORDER.indexOf(a[0]) - TIER_ORDER.indexOf(b[0])
  );

  view.innerHTML = `
  <div class="wrap" data-track="${track.id}">
    <div class="hero">
      <span class="eyebrow">Track</span>
      <h1>${track.name}</h1>
      <p class="hero__lede">${fmt(track.blurb)}</p>
      <div style="display:flex;gap:var(--s-3);margin-top:var(--s-5);flex-wrap:wrap">
        <a class="btn btn--primary" href="#/${track.id}/${
    resume || first.id
  }">${resume ? 'Resume' : 'Start from the beginning'}</a>
        <span class="btn btn--ghost" style="cursor:default">${done} of ${
    track.lessons.length
  } complete</span>
      </div>
    </div>

    ${ordered
      .map(
        ([tier, lessons]) => `
      <h2 class="section-title">${TIER_NAMES[tier] ?? tier}</h2>
      <div class="prose" style="margin-bottom:var(--s-4)">${fmt(
        track.tiers?.[tier] ?? ''
      )}</div>
      <div class="trackcards" style="grid-template-columns:1fr">
        ${lessons
          .map((l) => {
            const n = track.lessons.indexOf(l) + 1;
            const isDone = store.isDone(track.id, l.id);
            return `
            <a class="trackcard" href="#/${track.id}/${l.id}"
               style="padding:var(--s-4);display:grid;grid-template-columns:auto 1fr auto;gap:var(--s-4);align-items:center">
              <span class="mono" style="color:${
                isDone ? 'var(--viz-owned)' : 'var(--ink-faint)'
              };font-size:var(--t-sm)">${isDone ? '✓' : String(n).padStart(2, '0')}</span>
              <span>
                <span style="font-weight:600;color:var(--ink)">${l.title}</span>
                ${l.core ? '<span class="badge badge--core" style="margin-left:var(--s-2)">Core</span>' : ''}
              </span>
              <span class="mono" style="color:var(--ink-faint);font-size:var(--t-xs)">→</span>
            </a>`;
          })
          .join('')}
      </div>`
      )
      .join('')}
  </div>`;
}

function renderMissing(message) {
  view.innerHTML = `
  <div class="wrap">
    <div class="hero">
      <span class="eyebrow">404</span>
      <h1>Not here.</h1>
      <p class="hero__lede">${fmt(message)}</p>
      <p style="margin-top:var(--s-5)"><a class="btn" href="#/">Back to the start</a></p>
    </div>
  </div>`;
}

async function showLesson(track, lessonId) {
  const idx = track.lessons.findIndex((l) => l.id === lessonId);
  if (idx === -1) {
    renderMissing(`There is no lesson called “${lessonId}” in the ${track.name} track.`);
    return;
  }

  const meta = track.lessons[idx];
  document.documentElement.dataset.track = track.id;

  view.innerHTML = `<div class="wrap"><p class="eyebrow">Loading ${meta.title}…</p></div>`;

  let lesson;
  try {
    const mod = await meta.load();
    lesson = { ...meta, ...(mod.default ?? mod) };
  } catch (err) {
    renderMissing(
      `“${meta.title}” could not be loaded. It may not be written yet.`
    );
    return;
  }

  store.setLastSeen(track.id, lesson.id);

  teardown?.();
  teardown = renderLesson(view, {
    lesson,
    track,
    index: idx,
    total: track.lessons.length,
    prev: track.lessons[idx - 1] ?? null,
    next: track.lessons[idx + 1] ?? null,
    store,
  });
}

/* ---------------------------------------------------------------
   Router
   --------------------------------------------------------------- */
function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [trackId, lessonId] = raw.split('/').filter(Boolean);
  return { trackId, lessonId };
}

async function route() {
  teardown?.();
  teardown = null;

  const { trackId, lessonId } = parseHash();

  if (!trackId || trackId === 'path') {
    markTrackSwitch(null);
    const fallback = trackById(store.track) ?? tracks[0];
    buildNav(fallback, null, searchBox.value);
    updateProgress(fallback);
    if (trackId === 'path') renderRoadmap(view);
    else renderHome();
    $('#main').scrollTop = 0;
    return;
  }

  const track = trackById(trackId);
  if (!track) {
    renderMissing(`There is no track called “${trackId}”.`);
    return;
  }

  store.setTrack(track.id);
  markTrackSwitch(track.id);
  buildNav(track, lessonId, searchBox.value);
  updateProgress(track);

  if (lessonId) await showLesson(track, lessonId);
  else renderTrackHome(track);

  $('#main').scrollTop = 0;
}

window.addEventListener('hashchange', route);

/* Global keyboard shortcuts: j/k or [ ] move between lessons. */
window.addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea')) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  const { trackId, lessonId } = parseHash();
  const track = trackById(trackId);
  if (!track || !lessonId) return;

  const idx = track.lessons.findIndex((l) => l.id === lessonId);
  if (idx === -1) return;

  if (e.key === ']' || e.key === 'J') {
    const next = track.lessons[idx + 1];
    if (next) location.hash = `#/${track.id}/${next.id}`;
  } else if (e.key === '[' || e.key === 'K') {
    const prev = track.lessons[idx - 1];
    if (prev) location.hash = `#/${track.id}/${prev.id}`;
  }
});

/* ---------------------------------------------------------------
   Boot
   --------------------------------------------------------------- */
applyTheme(store.theme);
route();
