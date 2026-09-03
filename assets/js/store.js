/* ============================================================
   Local persistence. Every accessor is defensive: private-mode
   browsers and blocked site-data both make localStorage throw on
   access, not just on write.
   ============================================================ */

const KEY = 'zerocost:v1';

const DEFAULTS = {
  theme: 'dark',
  track: 'cpp',
  done: {},       // `${track}/${lessonId}` -> true
  lastSeen: {},   // track -> lessonId
};

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function write(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* Nothing we can do; the session still works, it just won't persist. */
  }
}

let state = read();

export const store = {
  get theme() {
    return state.theme;
  },
  setTheme(theme) {
    state.theme = theme;
    write(state);
  },

  get track() {
    return state.track;
  },
  setTrack(track) {
    state.track = track;
    write(state);
  },

  isDone(track, id) {
    return Boolean(state.done[`${track}/${id}`]);
  },
  setDone(track, id, done) {
    const key = `${track}/${id}`;
    if (done) state.done[key] = true;
    else delete state.done[key];
    write(state);
  },
  doneCount(track) {
    const prefix = `${track}/`;
    return Object.keys(state.done).filter((k) => k.startsWith(prefix)).length;
  },

  lastSeen(track) {
    return state.lastSeen[track] || null;
  },
  setLastSeen(track, id) {
    state.lastSeen[track] = id;
    write(state);
  },

  reset() {
    state = { ...DEFAULTS, theme: state.theme };
    write(state);
  },
};
