/* CGMascot decorative adapter: approved supplied-art rolling stamp. Contract: LEGACY-CONTRACT.md. */
(function (root) {
  'use strict';
  var doc = root.document;
  var assetBase = new URL('.', (doc.currentScript && doc.currentScript.src) || root.location.href);
  var SRC = new URL('stamp.jpeg', assetBase).href;
  var N = 1254;
  // Timeline (ms) — identical to approved-preview.js
  var ROLL_END = 1200, WINK_START = 1600, WINK_MS = 280, WINK_END = WINK_START + WINK_MS, DURATION = 2200;
  var EYE = { x0: 630, y0: 540, x1: 694, y1: 624 };
  EYE.cx = (EYE.x0 + EYE.x1) / 2; EYE.cy = (EYE.y0 + EYE.y1) / 2;
  EYE.rx = (EYE.x1 - EYE.x0) / 2; EYE.ry = (EYE.y1 - EYE.y0) / 2;
  var eyeW = EYE.x1 - EYE.x0, eyeH = EYE.y1 - EYE.y0;
  var C_LO = 40, C_HI = 170;
  var SAFETY_MS = DURATION + 1000;

  var sessions = new WeakMap();
  var controllers = new WeakMap(); // figure -> controller
  var mask = null; // memoized Uint8ClampedArray alpha, N*N

  function buildMask(img) {
    if (mask) return mask;
    var c = doc.createElement('canvas'); c.width = c.height = N;
    var x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0, N, N);
    var d = x.getImageData(0, 0, N, N).data;
    var m = new Uint8ClampedArray(N * N);
    for (var i = 0, p = 0; i < m.length; i++, p += 4) {
      var chroma = d[p] - Math.max(d[p + 1], d[p + 2]);
      m[i] = chroma <= C_LO ? 0 : chroma >= C_HI ? 255 : Math.round(255 * (chroma - C_LO) / (C_HI - C_LO));
    }
    mask = m;
    return mask;
  }

  // Parse a computed CSS color via canvas. Returns [r,g,b,a] or null when missing/invalid/transparent.
  var probe = null;
  function parseColor(value) {
    value = (value || '').trim();
    if (!value) return null;
    if (!probe) { var pc = doc.createElement('canvas'); pc.width = pc.height = 1; probe = pc.getContext('2d', { willReadFrequently: true }); }
    probe.fillStyle = '#010203'; probe.fillStyle = value; var a = probe.fillStyle;
    probe.fillStyle = '#040506'; probe.fillStyle = value; var b = probe.fillStyle;
    if (a !== b) return null; // invalid value left the sentinel in place
    probe.clearRect(0, 0, 1, 1); probe.fillRect(0, 0, 1, 1);
    var px = probe.getImageData(0, 0, 1, 1).data;
    if (!px[3]) return null;
    return [px[0], px[1], px[2], px[3]];
  }

  function ease(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }
  function reveal(t) { return t >= ROLL_END ? 1 : Math.max(0, ease(t / ROLL_END)); }
  function eyeOpen(t) {
    if (t <= WINK_START || t >= WINK_END) return 1;
    var p = (t - WINK_START) / WINK_MS;
    return 1 - 0.94 * Math.sin(Math.PI * p);
  }
  function phaseAt(t) {
    if (t < ROLL_END) return 'rolling';
    if (t < WINK_START) return 'hold';
    if (t < WINK_END) return 'winking';
    return 'static';
  }

  function Controller(fig, canvas, img, onLayout, host) {
    var self = this;
    var ctx = canvas.getContext('2d');
    var full = doc.createElement('canvas'); full.width = full.height = N;
    var fctx = full.getContext('2d');
    var eyeImg = null, rgb = null, colorKey = '';
    var raf = 0, timer = 0, t0 = 0, t = 0, ready = false, settled = false, started = false, dead = false, visible = false;
    var io = null, themeMo = null, removalMo = null, colorPending = false;
    var mqlReduced = root.matchMedia ? root.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var mqlScheme = root.matchMedia ? root.matchMedia('(prefers-color-scheme: dark)') : null;

    function reduced() { return !!(mqlReduced && mqlReduced.matches); }
    function setData(motion, time) {
      fig.dataset.motion = motion;
      fig.dataset.reveal = reveal(time).toFixed(3);
      fig.dataset.eye = eyeOpen(time).toFixed(3);
    }

    function readColor() {
      var c = parseColor(root.getComputedStyle(fig).getPropertyValue('--accent'));
      return c;
    }
    function tint() {
      var im = fctx.createImageData(N, N), o = im.data, ca = rgb[3] / 255;
      for (var i = 0, p = 0; i < mask.length; i++, p += 4) {
        var a = mask[i];
        if (a) { o[p] = rgb[0]; o[p + 1] = rgb[1]; o[p + 2] = rgb[2]; o[p + 3] = ca === 1 ? a : Math.round(a * ca); }
      }
      fctx.putImageData(im, 0, 0);
      eyeImg = fctx.createImageData(eyeW, eyeH);
    }
    function drawEye(open) {
      var o = eyeImg.data, ca = rgb[3] / 255;
      var closed = Math.max(0, Math.min(1, (0.45 - open) / 0.35));
      for (var y = 0; y < eyeH; y++) {
        var sy = EYE.y0 + y + 0.5;
        for (var x = 0; x < eyeW; x++) {
          var sx = EYE.x0 + x + 0.5, gi = (EYE.y0 + y) * N + EYE.x0 + x, p = (y * eyeW + x) * 4;
          var ex = (sx - EYE.cx) / EYE.rx, ey = (sy - EYE.cy) / EYE.ry;
          var a;
          if (ex * ex + ey * ey > 1) a = mask[gi];
          else {
            var srcY = EYE.cy + (sy - EYE.cy) / open;
            var ry = Math.round(srcY - 0.5);
            var sex = ex, sey = (srcY - EYE.cy) / EYE.ry;
            a = (ry >= EYE.y0 && ry < EYE.y1 && sex * sex + sey * sey <= 1) ? mask[ry * N + EYE.x0 + x] : 0;
            if (closed > 0) {
              var dx = sx - EYE.cx, half = EYE.rx * 0.82;
              if (Math.abs(dx) <= half) {
                var cy = EYE.cy + 6 - 14 * (dx * dx) / (half * half);
                var d = Math.abs(sy - cy);
                var s = Math.max(0, Math.min(1, 5.5 - d)) * closed * 255;
                if (s > a) a = s;
              }
            }
          }
          o[p] = rgb[0]; o[p + 1] = rgb[1]; o[p + 2] = rgb[2]; o[p + 3] = ca === 1 ? a : Math.round(a * ca);
        }
      }
      ctx.putImageData(eyeImg, EYE.x0, EYE.y0);
    }
    function paint(time) {
      ctx.clearRect(0, 0, N, N);
      var r = reveal(time);
      if (r >= 1) ctx.drawImage(full, 0, 0);
      else if (r > 0) {
        var margin = 60, fx = -margin + r * (N + 2 * margin);
        ctx.save(); ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(fx - 18, 0);
        ctx.quadraticCurveTo(fx + 18, N / 2, fx - 18, N); ctx.lineTo(0, N); ctx.closePath();
        ctx.clip(); ctx.drawImage(full, 0, 0); ctx.restore();
      }
      var open = eyeOpen(time);
      if (r >= 1 && open < 1) drawEye(open);
    }

    function stopFrames() {
      if (raf) root.cancelAnimationFrame(raf); raf = 0;
      if (timer) root.clearTimeout(timer); timer = 0;
    }
    function disconnectIO() { if (io) { io.disconnect(); io = null; } }
    function settle() {
      if (dead) return;
      stopFrames(); disconnectIO();
      settled = true; t = DURATION;
      if (ready) { paint(DURATION); setData('static', DURATION); }
    }
    function tick(now) {
      raf = 0;
      if (dead) return;
      if (doc.hidden || reduced()) { settle(); return; }
      t = now - t0;
      if (t >= DURATION) { settle(); return; }
      paint(t); setData(phaseAt(t), t);
      raf = root.requestAnimationFrame(tick);
    }
    function start() {
      if (dead || started || settled || !ready) return;
      started = true; // keep IO so leaving view settles; settle/cleanup disconnect it
      if (reduced() || doc.hidden) { settle(); return; }
      t = 0; paint(0); setData('rolling', 0);
      t0 = root.performance.now();
      raf = root.requestAnimationFrame(tick);
      timer = root.setTimeout(settle, SAFETY_MS); // bounded fallback if RAF stalls
    }

    function recolor() {
      colorPending = false;
      if (dead) return;
      if (!fig.isConnected) { self.cleanup(); return; }
      var c = readColor();
      if (!c) { self.cleanup(true); return; } // never invent a color
      var key = c.join(',');
      if (key === colorKey) return;
      rgb = c; colorKey = key; fig.dataset.ink = 'rgba(' + key + ')';
      if (!ready) return;
      tint();
      if (settled) paint(DURATION); // static retint, no replay
    }
    function scheduleRecolor() {
      if (colorPending || dead) return;
      colorPending = true;
      Promise.resolve().then(recolor);
    }
    this.refreshInk = function () { recolor(); };

    function onVisibility() { if (doc.hidden) settle(); }
    function onPageHide() { settle(); }
    function onReducedChange() { if (reduced()) settle(); }
    function onIntersect(entries) {
      for (var i = 0; i < entries.length; i++) visible = entries[i].isIntersecting;
      if (visible && !started && !settled) start();
      else if (!visible && started && !settled) settle();
    }
    function mqlOn(m, fn) { if (!m) return; if (m.addEventListener) m.addEventListener('change', fn); else if (m.addListener) m.addListener(fn); }
    function mqlOff(m, fn) { if (!m) return; if (m.removeEventListener) m.removeEventListener('change', fn); else if (m.removeListener) m.removeListener(fn); }

    this.cleanup = function (removeFigure) {
      if (dead) return;
      dead = true;
      stopFrames(); disconnectIO();
      if (themeMo) { themeMo.disconnect(); themeMo = null; }
      if (removalMo) { removalMo.disconnect(); removalMo = null; }
      doc.removeEventListener('visibilitychange', onVisibility);
      root.removeEventListener('pagehide', onPageHide);
      mqlOff(mqlReduced, onReducedChange);
      mqlOff(mqlScheme, scheduleRecolor);
      img.onload = img.onerror = null;
      controllers.delete(fig);
      if (removeFigure && fig.parentNode) fig.parentNode.removeChild(fig);
    };

    function callLayout() { if (typeof onLayout === 'function') { try { onLayout(); } catch (e) { /* decorative */ } } }

    // Lifecycle listeners from creation so late decodes still settle.
    doc.addEventListener('visibilitychange', onVisibility);
    root.addEventListener('pagehide', onPageHide);
    mqlOn(mqlReduced, onReducedChange);
    mqlOn(mqlScheme, scheduleRecolor);
    if (root.MutationObserver) {
      // Theme/context: attribute changes on the figure's ancestors only (not subtree).
      themeMo = new MutationObserver(scheduleRecolor);
      for (var el = host; el && el.nodeType === 1; el = el.parentElement) themeMo.observe(el, { attributes: true });
      // Removal: callback only checks connectivity.
      removalMo = new MutationObserver(function () { if (!fig.isConnected) self.cleanup(); });
      removalMo.observe(doc.documentElement, { childList: true, subtree: true });
    }

    img.onload = function () {
      img.onload = img.onerror = null;
      if (dead) return;
      if (!fig.isConnected) { self.cleanup(); return; }
      try { buildMask(img); } catch (e) { self.cleanup(true); callLayout(); return; }
      rgb = null; colorKey = '';
      recolor();
      if (dead) { callLayout(); return; }
      tint(); ready = true; fig.dataset.ready = '1';
      fig.hidden = false;
      callLayout();
      if (dead) return;
      if (settled || reduced() || doc.hidden) { settle(); return; } // honor pre-load settle; never restart
      paint(0); setData('waiting', 0);
      if (root.IntersectionObserver) { io = new IntersectionObserver(onIntersect); io.observe(fig); }
      else start();
    };
    img.onerror = function () {
      img.onload = img.onerror = null;
      if (dead) return;
      self.cleanup(true); callLayout();
    };
  }

  function directFigures(host) {
    var out = [];
    for (var i = 0; i < host.children.length; i++) if (host.children[i].classList.contains('cg-daily-mascot')) out.push(host.children[i]);
    return out;
  }
  function removeFigure(fig) {
    var c = controllers.get(fig);
    if (c) c.cleanup(true); else if (fig.parentNode) fig.parentNode.removeChild(fig);
  }

  function render(options) {
    options = options || {};
    var host = typeof options.host === 'string' ? doc.querySelector(options.host) : null;
    if (!host) return null;
    var scope = options.scope instanceof HTMLElement ? options.scope : host;
    var prev = directFigures(host);
    var DM = root.DailyMascot;
    if (!options.eligible || !DM) { prev.forEach(removeFigure); return null; }
    var chosen = options.freeze && sessions.has(scope) ? sessions.get(scope) : DM.capture(options.day, options.mode);
    if (!chosen) { prev.forEach(removeFigure); return null; }
    if (options.freeze && prev.length === 1 && prev[0].dataset.day === chosen.day && prev[0].dataset.mode === options.mode) {
      var existing = controllers.get(prev[0]);
      if (existing) existing.refreshInk();
      return chosen;
    }
    prev.forEach(removeFigure);
    sessions.set(scope, chosen);

    var fig = doc.createElement('figure');
    fig.className = 'cg-daily-mascot';
    fig.hidden = true;
    fig.setAttribute('aria-hidden', 'true');
    fig.dataset.pose = chosen.pose;
    fig.dataset.day = chosen.day;
    fig.dataset.mode = options.mode;
    fig.dataset.motion = 'waiting';
    fig.dataset.ready = '0';
    var canvas = doc.createElement('canvas');
    canvas.className = 'cg-stamp-canvas';
    canvas.width = canvas.height = N;
    var img = doc.createElement('img');
    img.className = 'cg-stamp-source';
    img.hidden = true;
    img.alt = '';
    img.decoding = 'async';
    fig.appendChild(canvas);
    fig.appendChild(img);

    var ref = null;
    if (typeof options.before === 'string') { try { ref = host.querySelector(options.before); } catch (e) { ref = null; } }
    if (ref && ref.parentNode === host) host.insertBefore(fig, ref); else host.appendChild(fig);

    if (root.getComputedStyle(fig).getPropertyValue('--cg-mascot-ready').trim() !== '1') {
      fig.parentNode.removeChild(fig);
      return null;
    }
    controllers.set(fig, new Controller(fig, canvas, img, options.onLayout, host));
    img.src = SRC;
    return chosen;
  }

  function clear(scope, keepHost) {
    var s = scope && scope.querySelectorAll ? scope : doc;
    var keep = typeof keepHost === 'string' ? doc.querySelector(keepHost) : null;
    var figs = s.querySelectorAll('.cg-daily-mascot');
    for (var i = 0; i < figs.length; i++) if (!keep || figs[i].parentNode !== keep) removeFigure(figs[i]);
  }

  root.CGMascot = Object.freeze({ render: render, clear: clear });
})(window);
