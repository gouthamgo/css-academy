import { roadmap } from './content/roadmap.js';
import { fmt } from './render.js';

const list = (items, cls = '') =>
  `<ul class="${cls}">${items.map((i) => `<li>${fmt(i)}</li>`).join('')}</ul>`;

export function renderRoadmap(mount) {
  document.documentElement.removeAttribute('data-track');

  mount.innerHTML = `
  <div class="wrap">
    <div class="hero">
      <span class="eyebrow">Read this first</span>
      <h1>${roadmap.title}</h1>
      <p class="hero__lede">${fmt(roadmap.lede)}</p>
    </div>

    <section class="block">
      <div class="block__head">
        <span class="block__num">01</span>
        <h2 class="block__title">${roadmap.reality.heading}</h2>
      </div>
      <div class="block__body">
        ${roadmap.reality.points
          .map(
            (p) => `
          <div class="reality">
            <h3 class="reality__claim">${fmt(p.claim)}</h3>
            <p class="reality__detail">${fmt(p.detail)}</p>
          </div>`
          )
          .join('')}
      </div>
    </section>

    <section class="block">
      <div class="block__head">
        <span class="block__num">02</span>
        <h2 class="block__title">The five phases</h2>
      </div>
      <div class="block__body block__body--wide">
        ${roadmap.phases
          .map(
            (ph) => `
          <div class="phase">
            <div class="phase__rail">
              <span class="phase__n">${ph.n}</span>
              <span class="phase__line"></span>
            </div>
            <div class="phase__body">
              <div class="phase__window eyebrow">${ph.window}</div>
              <h3 class="phase__name">${fmt(ph.name)}</h3>
              <p class="phase__goal">${fmt(ph.goal)}</p>
              ${list(ph.does, 'phase__does')}
              <p class="phase__trap"><span class="phase__traplabel">The trap</span> ${fmt(
                ph.trap
              )}</p>
            </div>
          </div>`
          )
          .join('')}
      </div>
    </section>

    <section class="block">
      <div class="block__head">
        <span class="block__num">03</span>
        <h2 class="block__title">${roadmap.projects.heading}</h2>
      </div>
      <div class="block__body block__body--wide">
        <p class="prose" style="margin-bottom:var(--s-5)">${fmt(roadmap.projects.note)}</p>
        <div class="projects">
          ${roadmap.projects.items
            .map(
              (p) => `
            <div class="project">
              <span class="project__rank mono">${String(p.rank).padStart(2, '0')}</span>
              <div class="project__body">
                <div class="project__top">
                  <h3 class="project__name">${fmt(p.name)}</h3>
                  <span class="project__effort mono">${p.effort}</span>
                </div>
                <p class="project__proves">${fmt(p.proves)}</p>
                <p class="project__asked">${fmt(p.asked)}</p>
              </div>
            </div>`
            )
            .join('')}
        </div>
        <div class="exercise" style="margin-top:var(--s-5)">
          <div class="exercise__label">Do not build</div>
          <div class="exercise__body">${list(roadmap.projects.avoid)}</div>
        </div>
      </div>
    </section>

    <section class="block">
      <div class="block__head">
        <span class="block__num">04</span>
        <h2 class="block__title">${roadmap.offer.heading}</h2>
      </div>
      <div class="block__body">
        <div class="scorecard">
          <div class="scorecard__col scorecard__col--win">
            <div class="scorecard__label">Wins the offer</div>
            ${list(roadmap.offer.wins)}
          </div>
          <div class="scorecard__col scorecard__col--kill">
            <div class="scorecard__label">Ends the interview</div>
            ${list(roadmap.offer.kills)}
          </div>
        </div>
      </div>
    </section>

    <div class="closing">
      <p>${fmt(roadmap.closing)}</p>
      <a class="btn btn--primary" href="#/cpp">Start with C++</a>
    </div>
  </div>`;
}
