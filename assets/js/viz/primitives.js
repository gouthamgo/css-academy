/* ============================================================
   Drawing primitives for step-through diagrams.

   Every primitive is a plain descriptor object, not a DOM node.
   A step returns an array of descriptors; the engine diffs two
   arrays by `key` and animates the difference. That is what makes
   a box *move* between steps instead of disappearing and being
   redrawn somewhere else — which is the whole point, because the
   movement is the explanation.

   Coordinates are in a fixed 0..width / 0..height user space; the
   SVG viewBox scales it to whatever the container is.
   ============================================================ */

/** Tone -> CSS custom property stem. */
export const TONES = {
  neutral: 'line',
  stack: 'viz-stack',
  heap: 'viz-heap',
  owned: 'viz-owned',
  borrowed: 'viz-borrowed',
  moved: 'viz-moved',
  freed: 'viz-freed',
  hit: 'viz-hit',
  miss: 'viz-miss',
  highlight: 'viz-highlight',
};

export const stroke = (tone = 'neutral') =>
  tone === 'neutral' ? 'var(--line-strong)' : `var(--${TONES[tone] || 'line'})`;

export const fill = (tone = 'neutral') =>
  tone === 'neutral' ? 'var(--bg-inset)' : `var(--${TONES[tone]}-fill, transparent)`;

const id = (o) => o;

/* ---------------------------------------------------------------
   Boxes
   --------------------------------------------------------------- */

/**
 * A labelled rectangle. The workhorse.
 * @param {object} p
 * @param {string} p.key      stable identity across steps
 * @param {number} p.x,p.y    top-left
 * @param {number} p.w,p.h
 * @param {string} [p.label]  bold text, centred
 * @param {string} [p.sub]    smaller text under the label
 * @param {string} [p.tone]
 * @param {boolean}[p.dashed] draw a dashed border (use for "not real memory")
 * @param {number} [p.opacity]
 */
export const Box = (p) => ({ type: 'box', tone: 'neutral', opacity: 1, ...p });

/**
 * A memory cell: a box that shows a value and optionally an address.
 * Rendered with a monospace value, which reads as "this is bytes".
 */
export const Cell = (p) => ({
  type: 'cell',
  w: 64,
  h: 40,
  tone: 'neutral',
  opacity: 1,
  ...p,
});

/**
 * A horizontal or vertical run of cells sharing a prefix key.
 * @param {object} p
 * @param {string} p.key      prefix; cell i gets `${key}.${i}`
 * @param {Array}  p.values   value per cell (string | {value, tone, sub})
 * @param {'row'|'col'} [p.dir]
 * @param {number} [p.gap]
 */
export function Cells(p) {
  const {
    key, x, y, values, dir = 'row', w = 64, h = 40, gap = 0, tone = 'neutral',
    addrStart = null, addrStep = null,
  } = p;

  return values.map((v, i) => {
    const item = typeof v === 'object' && v !== null ? v : { value: v };
    const off = i * ((dir === 'row' ? w : h) + gap);
    return Cell({
      key: `${key}.${i}`,
      x: dir === 'row' ? x + off : x,
      y: dir === 'row' ? y : y + off,
      w,
      h,
      tone,
      addr:
        addrStart !== null
          ? `0x${(addrStart + i * (addrStep ?? 4)).toString(16)}`
          : undefined,
      ...item,
    });
  });
}

/**
 * A dashed, labelled container — "the stack", "the heap", "cache line 0".
 * Drawn behind everything else.
 */
export const Region = (p) => ({
  type: 'region',
  tone: 'neutral',
  opacity: 1,
  ...p,
});

/**
 * A stack frame: a titled box with a list of variable rows inside.
 * @param {Array<{name:string, value:string, tone?:string}>} p.vars
 */
export const Frame = (p) => ({
  type: 'frame',
  tone: 'stack',
  opacity: 1,
  rowH: 26,
  w: 190,
  ...p,
});

/* ---------------------------------------------------------------
   Connectors
   --------------------------------------------------------------- */

/**
 * An arrow between two points. Use for pointers, references, moves.
 * @param {[number,number]} p.from
 * @param {[number,number]} p.to
 * @param {'straight'|'curve'|'elbow'} [p.shape]
 * @param {number} [p.bend]   curve amount, signed
 * @param {boolean}[p.dashed] dashed = "borrow" / weak / conceptual
 */
export const Arrow = (p) => ({
  type: 'arrow',
  tone: 'neutral',
  shape: 'curve',
  bend: 40,
  opacity: 1,
  ...p,
});

/** A span bar with end caps — lifetimes, scopes, valid ranges. */
export const Bracket = (p) => ({
  type: 'bracket',
  tone: 'neutral',
  opacity: 1,
  side: 'bottom',
  ...p,
});

/* ---------------------------------------------------------------
   Text & annotation
   --------------------------------------------------------------- */

export const Text = (p) => ({
  type: 'text',
  tone: 'neutral',
  size: 13,
  anchor: 'start',
  mono: false,
  weight: 500,
  opacity: 1,
  ...p,
});

/** A small pill used to tag state: "owned", "moved", "dangling". */
export const Tag = (p) => ({ type: 'tag', tone: 'highlight', opacity: 1, ...p });

/* ---------------------------------------------------------------
   Renderers: descriptor -> SVG element
   --------------------------------------------------------------- */

const SVGNS = 'http://www.w3.org/2000/svg';
const el = (name, attrs = {}) => {
  const node = document.createElementNS(SVGNS, name);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== undefined && v !== null) node.setAttribute(k, String(v));
  }
  return node;
};

function textNode({ x, y, text, size, anchor, mono, weight, tone, opacity }) {
  const t = el('text', {
    x,
    y,
    'font-size': size,
    'text-anchor': anchor,
    'dominant-baseline': 'middle',
    'font-weight': weight,
    fill: tone === 'neutral' ? 'var(--ink)' : stroke(tone),
    'font-family': mono ? 'var(--font-mono)' : 'var(--font-sans)',
    opacity,
  });
  t.textContent = text;
  return t;
}

function renderBox(d) {
  const g = el('g');
  g.appendChild(
    el('rect', {
      x: 0,
      y: 0,
      width: d.w,
      height: d.h,
      rx: 6,
      fill: d.fillOverride ?? fill(d.tone),
      stroke: stroke(d.tone),
      'stroke-width': d.thick ? 2 : 1.5,
      'stroke-dasharray': d.dashed ? '5 4' : undefined,
    })
  );
  if (d.label) {
    g.appendChild(
      textNode({
        x: d.w / 2,
        y: d.sub ? d.h / 2 - 8 : d.h / 2,
        text: d.label,
        size: d.labelSize ?? 13,
        anchor: 'middle',
        mono: d.mono ?? false,
        weight: 600,
        tone: 'neutral',
        opacity: 1,
      })
    );
  }
  if (d.sub) {
    g.appendChild(
      textNode({
        x: d.w / 2,
        y: d.h / 2 + 10,
        text: d.sub,
        size: 10,
        anchor: 'middle',
        mono: true,
        weight: 500,
        tone: d.tone === 'neutral' ? 'neutral' : d.tone,
        opacity: 0.8,
      })
    );
  }
  return g;
}

function renderCell(d) {
  const g = el('g');
  g.appendChild(
    el('rect', {
      x: 0,
      y: 0,
      width: d.w,
      height: d.h,
      rx: 4,
      fill: fill(d.tone),
      stroke: stroke(d.tone),
      'stroke-width': 1.5,
      'stroke-dasharray': d.dashed ? '4 3' : undefined,
    })
  );
  if (d.name) {
    g.appendChild(
      textNode({
        x: d.w / 2,
        y: -10,
        text: d.name,
        size: 11,
        anchor: 'middle',
        mono: true,
        weight: 600,
        tone: 'neutral',
        opacity: 0.85,
      })
    );
  }
  g.appendChild(
    textNode({
      x: d.w / 2,
      y: d.h / 2,
      text: d.value ?? '',
      size: 13,
      anchor: 'middle',
      mono: true,
      weight: 600,
      tone: 'neutral',
      opacity: 1,
    })
  );
  if (d.addr) {
    g.appendChild(
      textNode({
        x: d.w / 2,
        y: d.h + 11,
        text: d.addr,
        size: 9,
        anchor: 'middle',
        mono: true,
        weight: 500,
        tone: 'neutral',
        opacity: 0.45,
      })
    );
  }
  if (d.sub) {
    g.appendChild(
      textNode({
        x: d.w / 2,
        y: d.h + (d.addr ? 23 : 11),
        text: d.sub,
        size: 9,
        anchor: 'middle',
        mono: true,
        weight: 500,
        tone: d.tone,
        opacity: 0.9,
      })
    );
  }
  return g;
}

function renderRegion(d) {
  const g = el('g');
  g.appendChild(
    el('rect', {
      x: 0,
      y: 0,
      width: d.w,
      height: d.h,
      rx: 10,
      fill: 'var(--bg-sunken)',
      stroke: stroke(d.tone),
      'stroke-width': 1.25,
      'stroke-dasharray': '6 5',
      opacity: 0.85,
    })
  );
  if (d.label) {
    g.appendChild(
      textNode({
        x: 12,
        y: 15,
        text: d.label,
        size: 10,
        anchor: 'start',
        mono: true,
        weight: 700,
        tone: d.tone,
        opacity: 0.95,
      })
    );
  }
  return g;
}

function renderFrame(d) {
  const rows = d.vars ?? [];
  const h = 30 + rows.length * d.rowH + 8;
  const g = el('g');

  g.appendChild(
    el('rect', {
      x: 0,
      y: 0,
      width: d.w,
      height: h,
      rx: 7,
      fill: fill(d.tone),
      stroke: stroke(d.tone),
      'stroke-width': 1.5,
      'stroke-dasharray': d.dashed ? '5 4' : undefined,
    })
  );
  g.appendChild(
    el('line', {
      x1: 0,
      y1: 27,
      x2: d.w,
      y2: 27,
      stroke: stroke(d.tone),
      'stroke-width': 1,
      opacity: 0.5,
    })
  );
  g.appendChild(
    textNode({
      x: 10,
      y: 14,
      text: d.label ?? '',
      size: 12,
      anchor: 'start',
      mono: true,
      weight: 700,
      tone: 'neutral',
      opacity: 1,
    })
  );

  rows.forEach((row, i) => {
    const y = 27 + 8 + i * d.rowH + d.rowH / 2 - 4;
    g.appendChild(
      textNode({
        x: 10,
        y,
        text: row.name,
        size: 11.5,
        anchor: 'start',
        mono: true,
        weight: 500,
        tone: 'neutral',
        opacity: 0.75,
      })
    );
    g.appendChild(
      textNode({
        x: d.w - 10,
        y,
        text: row.value,
        size: 11.5,
        anchor: 'end',
        mono: true,
        weight: 650,
        tone: row.tone ?? 'neutral',
        opacity: 1,
      })
    );
  });

  return g;
}

function arrowPath({ from, to, shape, bend }) {
  const [x1, y1] = from;
  const [x2, y2] = to;
  if (shape === 'straight') return `M ${x1} ${y1} L ${x2} ${y2}`;
  if (shape === 'elbow') {
    const midX = (x1 + x2) / 2;
    return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
  }
  // Curve: offset the control point perpendicular to the chord.
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  return `M ${x1} ${y1} Q ${mx + nx * bend} ${my + ny * bend} ${x2} ${y2}`;
}

function renderArrow(d) {
  const g = el('g');
  const path = el('path', {
    d: arrowPath(d),
    fill: 'none',
    stroke: stroke(d.tone),
    'stroke-width': d.thick ? 2.5 : 2,
    'stroke-dasharray': d.dashed ? '6 4' : undefined,
    'stroke-linecap': 'round',
    'marker-end': `url(#zc-arrow-${d.tone})`,
  });
  g.appendChild(path);

  if (d.label) {
    const [x1, y1] = d.from;
    const [x2, y2] = d.to;
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const t = el('text', {
      x: mx + (-dy / len) * (d.bend * 0.6) ,
      y: my + (dx / len) * (d.bend * 0.6) - 6,
      'font-size': 10.5,
      'text-anchor': 'middle',
      'dominant-baseline': 'middle',
      'font-family': 'var(--font-mono)',
      'font-weight': 650,
      fill: stroke(d.tone),
      'paint-order': 'stroke',
      stroke: 'var(--bg-base)',
      'stroke-width': 4,
      'stroke-linejoin': 'round',
    });
    t.textContent = d.label;
    g.appendChild(t);
  }
  return g;
}

function renderBracket(d) {
  const g = el('g');
  const cap = 7;
  const down = d.side === 'top' ? -1 : 1;
  g.appendChild(
    el('path', {
      d:
        `M 0 ${cap * down} L 0 0 L ${d.w} 0 L ${d.w} ${cap * down}`,
      fill: 'none',
      stroke: stroke(d.tone),
      'stroke-width': 2,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    })
  );
  if (d.label) {
    g.appendChild(
      textNode({
        x: d.w / 2,
        y: down > 0 ? 18 : -18,
        text: d.label,
        size: 11,
        anchor: 'middle',
        mono: true,
        weight: 650,
        tone: d.tone,
        opacity: 1,
      })
    );
  }
  return g;
}

function renderTag(d) {
  const g = el('g');
  const w = d.w ?? Math.max(38, d.text.length * 6.6 + 14);
  g.appendChild(
    el('rect', {
      x: 0,
      y: 0,
      width: w,
      height: 19,
      rx: 9.5,
      fill: fill(d.tone),
      stroke: stroke(d.tone),
      'stroke-width': 1.25,
    })
  );
  g.appendChild(
    textNode({
      x: w / 2,
      y: 10,
      text: d.text,
      size: 10,
      anchor: 'middle',
      mono: true,
      weight: 700,
      tone: d.tone,
      opacity: 1,
    })
  );
  return g;
}

const RENDERERS = {
  box: renderBox,
  cell: renderCell,
  region: renderRegion,
  frame: renderFrame,
  arrow: renderArrow,
  bracket: renderBracket,
  tag: renderTag,
  text: (d) => {
    const g = el('g');
    g.appendChild(textNode({ ...d, x: 0, y: 0 }));
    return g;
  },
};

/** Z-order: regions behind, then boxes/cells, then connectors, then text. */
export const LAYER = {
  region: 0,
  box: 1,
  frame: 1,
  cell: 2,
  bracket: 3,
  arrow: 4,
  tag: 5,
  text: 6,
};

/** Build the SVG group for one descriptor, positioned via transform. */
export function renderShape(d) {
  const render = RENDERERS[d.type];
  if (!render) return null;

  const g = el('g', { 'data-key': d.key, class: 'viz-shape' });
  // Arrows carry absolute coordinates in their path, so they are not translated.
  const tx = d.type === 'arrow' ? 0 : d.x ?? 0;
  const ty = d.type === 'arrow' ? 0 : d.y ?? 0;
  g.setAttribute('transform', `translate(${tx} ${ty})`);
  g.style.opacity = String(d.opacity ?? 1);
  g.appendChild(render(d));
  return g;
}

/** Arrowhead marker defs, one per tone so markers inherit the right colour. */
export function buildDefs() {
  const defs = el('defs');
  for (const tone of Object.keys(TONES)) {
    const marker = el('marker', {
      id: `zc-arrow-${tone}`,
      viewBox: '0 0 10 10',
      refX: 8,
      refY: 5,
      markerWidth: 6,
      markerHeight: 6,
      orient: 'auto-start-reverse',
    });
    marker.appendChild(
      el('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: stroke(tone) })
    );
    defs.appendChild(marker);
  }
  return defs;
}

export { id };
