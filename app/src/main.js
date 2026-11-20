// Neon Cover Studio: wires the editor — photos, layout, grade, caption, panels,
// export. A `?shot=` query sets up a fixed scene for a screenshot (./shots.js).
import { drawCover, LAYOUTS, GRADES, blankPanel, panelRects } from './cover.js';
import { runShot } from './shots.js';

export const SIZES = [
  { id: 'square', name: '1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', name: '1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', name: '1920 × 1080', w: 1920, h: 1080 },
];

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const subcaptionInput = document.getElementById('subcaption');
const zoomInput = document.getElementById('zoom');
const statusEl = document.getElementById('status');

const state = {
  layout: 'hero',
  grade: 'sunset',
  size: 'square',
  caption: 'Sunset Heist',
  subcaption: 'One last job in Vice City',
  photos: [], // { name, img }
  panels: [blankPanel()],
  selected: 0,
};

function sizeDef() {
  return SIZES.find((s) => s.id === state.size) ?? SIZES[0];
}

function syncCanvasSize() {
  const s = sizeDef();
  if (canvas.width !== s.w || canvas.height !== s.h) {
    canvas.width = s.w;
    canvas.height = s.h;
  }
}

/** Rebuilds the panel list for the current layout, keeping photo picks by index. */
function rebuildPanels() {
  const count = panelRects(state.layout).length;
  const old = state.panels;
  state.panels = Array.from({ length: count }, (_, i) => {
    const p = old[i] ?? blankPanel();
    return { photo: p.photo ?? null, photoIndex: p.photoIndex ?? -1, zoom: p.zoom ?? 1, dx: p.dx ?? 0, dy: p.dy ?? 0 };
  });
  if (state.selected >= count) state.selected = 0;
}

/** Assigns photos to panels that have none: panel i takes photo i, else photo 0. */
function fillPanels() {
  state.panels.forEach((p, i) => {
    if (p.photo) return;
    const pick = state.photos[i] ?? state.photos[0];
    if (pick) {
      p.photo = pick.img;
      p.photoIndex = state.photos.indexOf(pick);
    }
  });
}

function redraw() {
  syncCanvasSize();
  fillPanels();
  // The cover scene shows the clean exported cover: no selection outline there.
  const highlight = !document.body.classList.contains('shot-cover');
  drawCover(canvas, state, { highlight });
  zoomInput.value = String(Math.round((state.panels[state.selected]?.zoom ?? 1) * 100));
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load ' + url));
    img.src = url;
  });
}

async function addPhoto(name, img) {
  state.photos.push({ name, img });
  renderThumbs();
  redraw();
}

function renderThumbs() {
  const box = document.getElementById('photos');
  box.textContent = '';
  state.photos.forEach((p, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'thumb';
    btn.title = p.name + ' — click to use in the selected panel';
    btn.setAttribute('aria-pressed', String(state.panels[state.selected]?.photoIndex === idx));
    const img = document.createElement('img');
    img.src = p.img.src;
    img.alt = p.name;
    btn.appendChild(img);
    const x = document.createElement('span');
    x.className = 'x';
    x.textContent = '×';
    x.title = 'Remove this photo';
    x.addEventListener('click', (e) => {
      e.stopPropagation();
      state.photos.splice(idx, 1);
      state.panels.forEach((panel) => {
        if (panel.photoIndex === idx) { panel.photo = null; panel.photoIndex = -1; }
        else if (panel.photoIndex > idx) panel.photoIndex -= 1;
      });
      renderThumbs();
      redraw();
    });
    btn.appendChild(x);
    btn.addEventListener('click', () => {
      const panel = state.panels[state.selected];
      panel.photo = p.img;
      panel.photoIndex = idx;
      renderThumbs();
      redraw();
    });
    box.appendChild(btn);
  });
}

function buildChoices(el, items, current, onPick) {
  el.textContent = '';
  for (const [id, def] of Object.entries(items)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'choice';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(id === current));
    b.innerHTML = def.swatch ? `<span class="swatch" style="background:${def.swatch}"></span>${def.name}` : def.name;
    b.addEventListener('click', () => {
      onPick(id);
      buildChoices(el, items, id, onPick);
    });
    el.appendChild(b);
  }
}

/** (Re)builds the layout / grade / size pickers from the current state. */
function renderChoices() {
  buildChoices(document.getElementById('layouts'), Object.fromEntries(Object.entries(LAYOUTS).map(([k, v]) => [k, { name: v.name }])), state.layout, (id) => {
    state.layout = id;
    rebuildPanels();
    renderChoices();
    redraw();
  });
  buildChoices(document.getElementById('grades'), Object.fromEntries(Object.entries(GRADES).map(([k, v]) => [k, { name: v.name, swatch: `linear-gradient(90deg, ${v.sky[1]}, ${v.sky[2]})` }])), state.grade, (id) => {
    state.grade = id;
    renderChoices();
    redraw();
  });
  buildChoices(document.getElementById('sizes'), Object.fromEntries(SIZES.map((s) => [s.id, { name: s.name }])), state.size, (id) => {
    state.size = id;
    renderChoices();
    redraw();
  });
}
renderChoices();

document.getElementById('photoInput').addEventListener('change', async (e) => {
  for (const file of e.target.files) {
    try {
      const img = await loadImage(URL.createObjectURL(file));
      await addPhoto(file.name, img);
    } catch { /* skip unreadable files */ }
  }
  e.target.value = '';
});
document.querySelectorAll('[data-sample]').forEach((b) => {
  b.addEventListener('click', async () => {
    const name = b.dataset.sample;
    try {
      const img = await loadImage(`samples/${name}.jpg`);
      await addPhoto(name, img);
    } catch { /* sample missing */ }
  });
});
captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subcaptionInput.addEventListener('input', () => { state.subcaption = subcaptionInput.value; redraw(); });
zoomInput.addEventListener('input', () => {
  const panel = state.panels[state.selected];
  if (panel) panel.zoom = Number(zoomInput.value) / 100;
  redraw();
});

// Panel picking + panning on the preview canvas.
let drag = null;
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
}
function hitPanel(pt) {
  const rects = panelRects(state.layout);
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (pt.x >= r.x * canvas.width && pt.x < (r.x + r.w) * canvas.width && pt.y >= r.y * canvas.height && pt.y < (r.y + r.h) * canvas.height) return i;
  }
  return 0;
}
canvas.addEventListener('pointerdown', (e) => {
  const pt = canvasPoint(e);
  state.selected = hitPanel(pt);
  drag = { x: pt.x, y: pt.y };
  canvas.setPointerCapture(e.pointerId);
  renderThumbs();
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const pt = canvasPoint(e);
  const panel = state.panels[state.selected];
  const rect = panelRects(state.layout)[state.selected];
  panel.dx = clamp((panel.dx || 0) + (pt.x - drag.x) / (rect.w * canvas.width), -0.45, 0.45);
  panel.dy = clamp((panel.dy || 0) + (pt.y - drag.y) / (rect.h * canvas.height), -0.45, 0.45);
  drag = { x: pt.x, y: pt.y };
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

document.getElementById('export').addEventListener('click', () => {
  const s = sizeDef();
  const off = document.createElement('canvas');
  off.width = s.w;
  off.height = s.h;
  drawCover(off, state, { highlight: false });
  off.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-cover-${s.w}x${s.h}.png`;
    a.click();
    statusEl.textContent = `Saved neon-cover-${s.w}x${s.h}.png`;
    window.__exported = a.download;
  }, 'image/png');
});

// First paint after the Anton face is ready, so the caption never falls back.
async function firstPaint() {
  try {
    await document.fonts.load('100px Anton');
    await document.fonts.ready;
  } catch { /* fall back to system fonts */ }
  redraw();
}

const query = new URLSearchParams(location.search);
if (query.get('shot')) {
  runShot(query, {
    loadSample: async (name) => {
      const img = await loadImage(`samples/${name}.jpg`);
      await addPhoto(name, img);
      return img;
    },
    apply: (patch) => {
      if (patch.layout) { state.layout = patch.layout; rebuildPanels(); }
      if (patch.grade) state.grade = patch.grade;
      if (patch.size) state.size = patch.size;
      if (patch.caption !== undefined) { state.caption = patch.caption; captionInput.value = patch.caption; }
      if (patch.subcaption !== undefined) { state.subcaption = patch.subcaption; subcaptionInput.value = patch.subcaption; }
      renderChoices();
      redraw();
    },
    ready: async () => {
      try { await document.fonts.load('100px Anton'); await document.fonts.ready; } catch { /* ok */ }
      redraw();
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      window.__shotReady = true;
    },
  });
} else {
  firstPaint();
}
