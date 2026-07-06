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
if (lo < 0) throw new Error('constants line not found');
const gi = html.indexOf('function generateBoard');
const geMark = 'return best || buildOnce(rng); }';
const ge = html.indexOf(geMark, gi) + geMark.length;
const genSrc = grabFn('mulberry32') + '\n' + grabFn('fnv') + '\n' + html.slice(lo, ge);
const drawSrc = [grabFn('center'), grabFn('polyD'), grabFn('headChevD'),
                 grabFn('bodyD'), grabFn('makeEl'), grabFn('buildSVG')].join('\n');

function el(tag) {
  return {
    tag, children: [], attrs: {},
    classList: { add() {}, toggle() {}, remove() {} },
    setAttribute(k, v) { this.attrs[k] = v; },
    appendChild(c) { this.children.push(c); return c; },
    addEventListener() {},
    set innerHTML(v) { this.children = []; },
    get innerHTML() { return ''; },
    querySelector() { return el('q'); },
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
    ${genSrc}
    ${drawSrc}
    const rng=mulberry32(fnv('${seed}'));
    const board=generateBoard(rng);
    buildSVG();
    for(const s of board.snakes) makeEl(s);
    return { board, inner };`;
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
  if (cells / (19 * 24) < 0.80) probs.push('coverage too low: ' + (cells / 456 * 100).toFixed(1) + '%');
  let mis = 0;
  for (const s of r.board.snakes) {
    if (s.cells.length < 2) { probs.push('1-cell nub piece'); continue; }
    const h = s.cells[0], n = s.cells[1];
    if (n.r !== h.r - DRl[s.dir] || n.c !== h.c - DCl[s.dir]) mis++;
  }
  if (mis) probs.push(mis + ' misaligned arrowhead(s)');

  if (probs.length) { console.error('✗ ' + seed + ' — ' + probs.join(' · ')); failed = true; }
  else console.log('✓ ' + seed + ' — ' + r.board.snakes.length + ' pieces · '
                   + (cells / 456 * 100).toFixed(1) + '% · attached · heads aligned');
}

if (failed) { console.error('\nSMOKE TEST FAILED — do not deploy.'); process.exit(1); }
console.log('\nSmoke test passed — safe to deploy.');
