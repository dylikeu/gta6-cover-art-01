// Draws the GTA-style cover: photo panels with white gutters, a colour grade,
// and the caption in huge condensed Anton capitals along the foot.
//
// State shape:
//   { layout: 'hero'|'split'|'trio'|'strip',
//     grade: 'sunset'|'neon'|'noir'|'gold',
//     caption: string, subcaption: string,
//     panels: [{ photo: Image|null, zoom: number, dx: number, dy: number }],
//     selected: number|null }   // selected panel index, editor only
// drawCover(canvas, state, { highlight: boolean }) draws to the canvas's own size.

export const LAYOUTS = {
  hero: { name: 'Hero', panels: [{ x: 0, y: 0, w: 1, h: 1 }] },
  split: { name: 'Split', panels: [{ x: 0, y: 0, w: 0.5, h: 1 }, { x: 0.5, y: 0, w: 0.5, h: 1 }] },
  trio: { name: 'Trio', panels: [{ x: 0, y: 0, w: 0.62, h: 1 }, { x: 0.62, y: 0, w: 0.38, h: 0.5 }, { x: 0.62, y: 0.5, w: 0.38, h: 0.5 }] },
  strip: { name: 'Strip', panels: [{ x: 0, y: 0, w: 1 / 3, h: 1 }, { x: 1 / 3, y: 0, w: 1 / 3, h: 1 }, { x: 2 / 3, y: 0, w: 1 / 3, h: 1 }] },
};

export const GRADES = {
  sunset: { name: 'Sunset', sky: ['#2b1055', '#ff7e5f', '#feb47b'], tint: 'rgba(255,110,80,0.30)', accent: '#ff7e5f', ink: '#ffd166' },
  neon: { name: 'Neon', sky: ['#0b1035', '#c724ff', '#00e5ff'], tint: 'rgba(199,36,255,0.26)', accent: '#00e5ff', ink: '#ff7ad9' },
  noir: { name: 'Noir', sky: ['#0d1b1e', '#3a6b7c', '#9db8c4'], tint: 'rgba(20,60,80,0.32)', accent: '#9db8c4', ink: '#e8f1f2' },
  gold: { name: 'Gold', sky: ['#2a1503', '#e07b39', '#ffc46b'], tint: 'rgba(224,123,57,0.30)', accent: '#ffc46b', ink: '#fff3d6' },
};

const FONT = 'Anton, sans-serif';

/** Panels of a layout, as fractions of the cover. */
export function panelRects(layout) {
  return LAYOUTS[layout].panels;
}

/** A fresh panel state (no photo yet). */
export function blankPanel() {
  return { photo: null, zoom: 1, dx: 0, dy: 0 };
}

/** Draws `state` onto the canvas at its own size. */
export function drawCover(canvas, state, opts = {}) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const rects = panelRects(state.layout);

  // Sky: the grade gradient, seen in the gutters and behind empty panels.
  const sky = ctx.createLinearGradient(0, 0, w * 0.3, h);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(0.55, grade.sky[1]);
  sky.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  drawSun(ctx, w, h, grade);

  // Panels: photos cover-fit, panned and zoomed, with white gutters.
  const gutter = Math.max(4, Math.round(Math.min(w, h) * 0.008));
  rects.forEach((r, i) => {
    const px = r.x * w + (r.x > 0 ? gutter / 2 : 0);
    const py = r.y * h + (r.y > 0 ? gutter / 2 : 0);
    const pw = r.w * w - (r.x > 0 ? gutter / 2 : 0) - (r.x + r.w < 1 ? gutter / 2 : 0);
    const ph = r.h * h - (r.y > 0 ? gutter / 2 : 0) - (r.y + r.h < 1 ? gutter / 2 : 0);
    const panel = state.panels[i] ?? blankPanel();
    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.clip();
    if (panel.photo) {
      drawPhoto(ctx, panel, px, py, pw, ph);
    } else {
      // Empty panel: a darker slice of the sky so the layout still reads.
      const g = ctx.createLinearGradient(px, py, px, py + ph);
      g.addColorStop(0, grade.sky[0]);
      g.addColorStop(1, grade.sky[1]);
      ctx.fillStyle = g;
      ctx.fillRect(px, py, pw, ph);
    }
    // Grade tint over the photo, then a soft dark foot for the caption.
    ctx.fillStyle = grade.tint;
    ctx.fillRect(px, py, pw, ph);
    ctx.restore();
    // White gutter frame around the panel.
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = gutter;
    ctx.strokeRect(px, py, pw, ph);
    // Editor highlight on the selected panel.
    if (opts.highlight && state.selected === i) {
      ctx.strokeStyle = '#ff7ad9';
      ctx.lineWidth = Math.max(4, gutter * 1.5);
      ctx.strokeRect(px, py, pw, ph);
    }
  });

  // Caption band: dark gradient rising from the foot, then the lettering.
  const band = ctx.createLinearGradient(0, h * 0.55, 0, h);
  band.addColorStop(0, 'rgba(0,0,0,0)');
  band.addColorStop(1, 'rgba(0,0,0,0.62)');
  ctx.fillStyle = band;
  ctx.fillRect(0, 0, w, h);

  drawCaption(ctx, w, h, state.caption, state.subcaption, grade);
}

/** A synthwave sun in the top corner, half-hidden behind the panels. */
function drawSun(ctx, w, h, grade) {
  const cx = w * 0.82;
  const cy = h * 0.16;
  const r = Math.min(w, h) * 0.16;
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.8);
  glow.addColorStop(0, grade.sky[2]);
  glow.addColorStop(0.5, grade.sky[1] + '55');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4);
  const disc = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  disc.addColorStop(0, '#fff3d6');
  disc.addColorStop(0.55, grade.sky[2]);
  disc.addColorStop(1, grade.sky[1]);
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Slits across the lower half, in the sky colour.
  ctx.fillStyle = grade.sky[0];
  for (let i = 0; i < 4; i++) {
    const y = cy + r * (0.05 + i * 0.22);
    const half = Math.sqrt(Math.max(0, r * r - (y - cy) * (y - cy)));
    ctx.fillRect(cx - half, y, half * 2, r * 0.07);
  }
}

/** Draws one photo cover-fit into its panel, panned and zoomed. */
function drawPhoto(ctx, panel, px, py, pw, ph) {
  const img = panel.photo;
  const base = Math.max(pw / img.naturalWidth, ph / img.naturalHeight);
  const scale = base * (panel.zoom || 1);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const ox = px + (pw - dw) / 2 + (panel.dx || 0) * pw;
  const oy = py + (ph - dh) / 2 + (panel.dy || 0) * ph;
  ctx.drawImage(img, ox, oy, dw, dh);
}

/** The caption: huge Anton capitals, white with a black outline, tilted -2deg.
 *  The whole block is anchored so its bottom (the sub-caption) lands inside
 *  the canvas, with the accent rule sitting just above the title. */
function drawCaption(ctx, w, h, caption, subcaption, grade) {
  const text = (caption || '').trim().toUpperCase();
  if (!text) return;
  const maxW = w * 0.88;
  const x0 = w * 0.06;
  let size = h * 0.115;
  let lines = wrapLines(ctx, text, size, maxW);
  while ((lines.length > 2 || lines.some((l) => ctx.measureText(l).width > maxW)) && size > 14) {
    size -= 2;
    lines = wrapLines(ctx, text, size, maxW);
  }
  const shown = lines.slice(-2);
  const lineH = size * 1.02;
  const sub = (subcaption || '').trim();
  const subSize = sub ? Math.max(14, size * 0.22) : 0;
  const baseline = h * 0.97 - (sub ? subSize * 1.15 : 0);
  // Accent rule just above the title block.
  ctx.fillStyle = grade.accent;
  ctx.fillRect(x0, baseline - shown.length * lineH - size * 0.22, w * 0.16, Math.max(4, h * 0.008));
  ctx.save();
  ctx.translate(x0, baseline);
  ctx.rotate(-0.035);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${size}px ${FONT}`;
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = size * 0.16;
  ctx.fillStyle = '#ffffff';
  shown.reverse().forEach((line, k) => {
    const y = -k * lineH;
    ctx.strokeText(line, 0, y);
    ctx.fillText(line, 0, y);
  });
  // Sub-caption in the grade's ink colour, tucked under the title.
  if (sub) {
    ctx.font = `700 ${subSize}px system-ui, sans-serif`;
    ctx.fillStyle = grade.ink;
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = subSize * 0.12;
    ctx.strokeText(sub.toUpperCase(), 0, subSize * 1.15);
    ctx.fillText(sub.toUpperCase(), 0, subSize * 1.15);
  }
  ctx.restore();
}

/** Wraps `text` into lines that fit `maxW` at `size` in the Anton face. */
function wrapLines(ctx, text, size, maxW) {
  ctx.font = `${size}px ${FONT}`;
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? line + ' ' + word : word;
    if (ctx.measureText(next).width <= maxW || !line) {
      line = next;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}
