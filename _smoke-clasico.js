#!/usr/bin/env node
/* =============================================================
   Clásico — pre-deploy smoke test (render path)
   Born from the 2026-07-06 blank-board incident: a mid-line //
   comment swallowed inner.appendChild(svg), so the board built
   but never attached. Syntax checks and page fetches passed;
   only EXECUTING the render path catches that class of bug.

   What it does — with the game's own code, verbatim:
     1. generateBoard(seed) for TODAY + 3 fixed seeds
     2. buildSVG() + makeEl() into a tracked fake DOM
     3. asserts: svg attached to the board, one piece element
        per snake, valid viewBox, no misaligned arrowheads,
        sane piece count and coverage.

   Usage:  node _smoke-clasico.js       (exit 0 = safe to deploy)
   Wired into _deploy.command — deploy aborts if this fails.
   ============================================================= */
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'clasico.html'), 'utf8');

function grabFn(n) {
  const i = html.indexOf('function ' + n);
  if (i < 0) throw new Error('extraction failed: ' + n);
  let d = 0, j = html.indexOf('{', i);
  for (let k = j; k < html.length; k++) {
    if (html[k] === '{') d++;
    else if (html[k] === '}') { d--; if (!d) return html.slice(i, k + 1); }
  }
  throw new Error('unbalanced braces: ' + n);
}

const lo = html.indexOf('const U=100,');
const dims = html.match(/const U=100, W=(\d+), H=(\d+);/);
const BW = +dims[1], BH = +dims[2], NCELLS = BW * BH;
if (lo < 0) throw new Error('constants line not found');
const gi = html.indexOf('function generateBoard');
const geMark = 'return best || buildOnce(rng); }';
const ge = html.indexOf(geMark, gi) + geMark.length;
const genSrc = grabFn('mulberry32') + '\n' + grabFn('fnv') + '\n' + html.slice(lo, ge);
const drawSrc = [grabFn('center'), grabFn('polyD'), grabFn('polyLen'), grabFn('distToBorder'),
                 grabFn('headChevD'), grabFn('trackData'), grabFn('makeEl'), grabFn('buildSVG'),
                 grabFn('fireVisual'), grabFn('bounceVisual')].join('\n');

function el(tag) {
  return {
    tag, children: [], attrs: {}, animations: [],
    classList: { add() {}, toggle() {}, remove() {} },
    setAttribute(k, v) { this.attrs[k] = v; },
    appendChild(c) { this.children.push(c); return c; },
    addEventListener() {},
    animate(kf, opts) { this.animations.push({ kf, opts }); return { cancel() {} }; },
    set innerHTML(v) { this.children = []; },
    get innerHTML() { return ''; },
    querySelector(sel) {
      const cls = sel.replace('.', '');
      return this.children.find(c => (c.attrs.class || '') === cls) || el('q');
    },
  };
}

const DRl = [-1, 0, 1, 0], DCl = [0, 1, 0, -1];
const today = new Date().toISOString().slice(0, 10);
const seeds = ['clasico-' + today, 'clasico-2026-07-10', 'clasico-2026-07-12', 'clasico-2026-07-14'];
let failed = false;

for (const seed of seeds) {
  const inner = el('div');
  const harness = `
    const SVGNS='http://www.w3.org/2000/svg';
    const document={ createElementNS:(ns,t)=>__el(t) };
    let svg=null, layer=null, snakes={};
    const inner=__inner;
    function tapSnake(){}
    function resetView(){}      // viewport wiring stubbed here;
    function initGestures(){}   // its math is tested separately below
    ${genSrc}
    ${drawSrc}
    const rng=mulberry32(fnv('${seed}'));
    const board=generateBoard(rng);
    buildSVG();
    for(const s of board.snakes) makeEl(s);
    // exercise the firing visuals on the first piece (parity feature, 2026-07-06)
    const s0=board.snakes[0], g0=s0.el||inner.children[0].children[0].children[0];
    const fireT=fireVisual(g0, s0._F, s0._move, s0._v);
    const g1=inner.children[0].children[0].children[1];
    const s1=board.snakes[1];
    const bounceT=bounceVisual(g1, s1._v, 126);
    return { board, inner, s0, fireT, bounceT };`;
  let r;
  try { r = new Function('__el', '__inner', harness)(el, inner); }
  catch (e) { console.error('✗ ' + seed + ' — render path THREW: ' + e.message); failed = true; continue; }

  const svg = r.inner.children[0];
  const probs = [];
  if (r.inner.children.length !== 1 || !svg || svg.tag !== 'svg') probs.push('svg NOT attached to board');
  else {
    const vb = (svg.attrs.viewBox || '').split(/\s+/).map(Number);
    if (vb.length !== 4 || vb.some(isNaN) || vb[2] <= 0 || vb[3] <= 0) probs.push('invalid viewBox "' + svg.attrs.viewBox + '"');
    const layerKids = svg.children[0] ? svg.children[0].children.length : 0;
    if (layerKids !== r.board.snakes.length) probs.push('pieces in layer ' + layerKids + ' ≠ snakes ' + r.board.snakes.length);
  }
  if (r.board.snakes.length < 20) probs.push('suspiciously few pieces: ' + r.board.snakes.length);
  const cells = r.board.snakes.reduce((a, s) => a + s.cells.length, 0);
  if (cells / NCELLS < 0.80) probs.push('coverage too low: ' + (cells / NCELLS * 100).toFixed(1) + '%');
  let mis = 0;
  for (const s of r.board.snakes) {
    if (s.cells.length < 2) { probs.push('1-cell nub piece'); continue; }
    const h = s.cells[0], n = s.cells[1];
    if (n.r !== h.r - DRl[s.dir] || n.c !== h.c - DCl[s.dir]) mis++;
  }
  if (mis) probs.push(mis + ' misaligned arrowhead(s)');

  // firing visuals: tip-first discharge + trailing body + crash bounce
  if (svg) {
    const g0 = svg.children[0].children[0];
    const line0 = g0.children.find(c => c.attrs.class === 'pline');
    const head0 = g0.children.find(c => c.attrs.class === 'phead');
    const dash = (line0.attrs['stroke-dasharray'] || '').split(/\s+/).map(Number);
    if (dash.length !== 2 || !(dash[1] > dash[0])) probs.push('bad dasharray (track window): ' + line0.attrs['stroke-dasharray']);
    const fa = line0.animations[0];
    if (!fa) probs.push('fire: line never animated');
    else {
      const off = parseFloat(fa.kf[1].strokeDashoffset);
      if (!(off < 0 && Math.abs(-off - r.s0._F) < 1)) probs.push('fire: dash slide ' + off + ' ≠ −F(' + r.s0._F.toFixed(1) + ') — not tip-first');
    }
    const ha = head0.animations[0];
    if (!ha) probs.push('fire: head never animated');
    else if (!ha.kf[1].transform.includes((r.s0._move * r.s0._v[0]) + 'px')) probs.push('fire: head travel ≠ move·v');
    if (!(r.fireT >= 200)) probs.push('fire duration too short: ' + r.fireT);
    const g1 = svg.children[0].children[1];
    const line1 = g1.children.find(c => c.attrs.class === 'pline');
    const ba = line1.animations[0];
    if (!ba || parseFloat(ba.kf[1].strokeDashoffset) !== -126) probs.push('bounce: no −dist slide on crash');
  }
  // state colors present in CSS: green on clear, red on crash, for BOTH shaft and head
  for (const rule of ['.piece.firing .pline', '.piece.firing .phead', '.piece.blocked .pline', '.piece.blocked .phead'])
    if (!html.includes(rule)) probs.push('missing CSS state rule: ' + rule);
  if (!/\.piece\.firing \.pline \{ stroke:var\(--clear\)/.test(html)) probs.push('firing pline not green');
  if (!/\.piece\.blocked \.pline \{ stroke:var\(--error\)/.test(html)) probs.push('blocked pline not red');

  if (probs.length) { console.error('✗ ' + seed + ' — ' + probs.join(' · ')); failed = true; }
  else console.log('✓ ' + seed + ' — ' + r.board.snakes.length + ' pieces · '
                   + (cells / NCELLS * 100).toFixed(1) + '% · attached · heads aligned · fire/bounce OK');
}

// ---------- viewport math (v8 zoom/pan) ----------
(function () {
  const mi = html.indexOf('const VIEW_FULL=');
  const mj = html.indexOf('function initGestures', mi);
  if (mi < 0 || mj < 0) { console.error('✗ viewport: module not found'); failed = true; return; }
  const mathSrc = 'const U=100,W='+BW+',H='+BH+'; let svg=null; const $=()=>null;\n' + html.slice(mi, mj);
  const V = new Function(mathSrc + `
    return { VIEW_FULL, VIEW_HOME, VIEW_START, VIEW_WMIN, VIEW_WMAX, VIEW_RATIO, clampView, zoomAt, panBy, isTap, isHomeView, hintViewAt };`)();
  const probs = [];
  const boxW = 390, boxH = 390 * V.VIEW_RATIO;
  // 1) zoom keeps the point under the pointer fixed
  const v1 = V.zoomAt({ ...V.VIEW_FULL }, 2, 130, 300, boxW, boxH);
  const before = { x: V.VIEW_FULL.x + (130 / boxW) * V.VIEW_FULL.w, y: V.VIEW_FULL.y + (300 / boxH) * V.VIEW_FULL.h };
  const after  = { x: v1.x + (130 / boxW) * v1.w,                   y: v1.y + (300 / boxH) * v1.h };
  if (Math.abs(before.x - after.x) > 0.5 || Math.abs(before.y - after.y) > 0.5) probs.push('zoom anchor drifts');
  // 2) limits
  if (V.zoomAt({ ...V.VIEW_FULL }, 100, 200, 200, boxW, boxH).w !== V.VIEW_WMIN) probs.push('no max-zoom-in clamp');
  if (V.zoomAt(v1, 0.01, 200, 200, boxW, boxH).w !== V.VIEW_WMAX) probs.push('no max-zoom-out clamp');
  // 3) aspect ratio preserved everywhere
  for (const v of [v1, V.panBy(v1, 50, -80, boxW, boxH)])
    if (Math.abs(v.h / v.w - V.VIEW_RATIO) > 1e-9) probs.push('aspect drift');
  // 4) pan clamps at board edges
  const vl = V.panBy(v1, 1e6, 0, boxW, boxH);
  if (vl.x !== V.VIEW_FULL.x) probs.push('pan does not clamp left');
  const vr = V.panBy(v1, -1e6, 0, boxW, boxH);
  if (Math.abs(vr.x - (V.VIEW_FULL.x + V.VIEW_FULL.w - vr.w)) > 1e-6) probs.push('pan does not clamp right');
  // 5) tap discrimination
  if (!V.isTap(200, 5) || V.isTap(200, 20) || V.isTap(600, 2)) probs.push('tap/drag thresholds wrong');
  // 6) home-view detection (recenter button visibility) + home window inside board
  if (!V.isHomeView({ ...V.VIEW_HOME }) || V.isHomeView(v1)) probs.push('isHomeView wrong');
  const hm = V.VIEW_HOME;
  if (hm.x < V.VIEW_FULL.x || hm.y < V.VIEW_FULL.y || hm.x + hm.w > V.VIEW_FULL.x + V.VIEW_FULL.w + 1e-6
      || hm.y + hm.h > V.VIEW_FULL.y + V.VIEW_FULL.h + 1e-6) probs.push('VIEW_HOME exceeds board bounds');
  if (Math.abs(hm.w - V.VIEW_FULL.w) > 1e-6) probs.push('VIEW_HOME (⌖ target) should be the FULL view (v9.9)');
  const st = V.VIEW_START;
  if (Math.abs(st.w - (14 * 100 + 60)) > 1e-6) probs.push('VIEW_START should be the 14-column family-scale window (v9.9)');
  if (st.x < V.VIEW_FULL.x || st.y < V.VIEW_FULL.y || st.x + st.w > V.VIEW_FULL.x + V.VIEW_FULL.w + 1e-6
      || st.y + st.h > V.VIEW_FULL.y + V.VIEW_FULL.h + 1e-6) probs.push('VIEW_START exceeds board bounds');
  if (Math.abs((st.x - V.VIEW_FULL.x) - (V.VIEW_FULL.w - st.w) / 2) > 1e-6) probs.push('VIEW_START should be horizontally centered');
  // 7) breathing-hint curve: exactly home at both ends, zoomed & clamped mid-way
  const h0 = V.hintViewAt(0), h5 = V.hintViewAt(0.5), h1 = V.hintViewAt(1);
  const atStart = (v) => Math.abs(v.w - st.w) < 1 && Math.abs(v.x - st.x) < 1 && Math.abs(v.y - st.y) < 1;
  if (!atStart(h0) || !atStart(h1)) probs.push('hint does not start/end at VIEW_START');
  if (!(h5.w < st.w * 0.95)) probs.push('hint mid-zoom too weak');
  if (Math.abs(h5.h / h5.w - V.VIEW_RATIO) > 1e-9) probs.push('hint aspect drift');
  if (h5.x < V.VIEW_FULL.x || h5.y < V.VIEW_FULL.y) probs.push('hint escapes bounds');
  if (probs.length) { console.error('✗ viewport math — ' + probs.join(' · ')); failed = true; }
  else console.log('✓ viewport math — anchor, limits, aspect, clamps, tap thresholds OK');
})();

if (failed) { console.error('\nSMOKE TEST FAILED — do not deploy.'); process.exit(1); }
console.log('\nSmoke test passed — safe to deploy.');
