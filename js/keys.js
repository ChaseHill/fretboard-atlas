// Isometric keyboard drawn in SVG, in the same projection and peg language as the neck: a black 88-key stage piano,
// modelled part for part on the owner's reference. The whole instrument is laid out at key scale (every control sits over
// the key it sits over on the real one, measured off the maker's top view); the drawing shows a three-octave stretch of
// it, and the body and panel slide behind the keys as the window moves, fading where the instrument runs on.
(() => {
  'use strict';
  const G = (window.G = window.G || {});
  const NS = 'http://www.w3.org/2000/svg';
  const WW = 32, KD = 114, BW = 18, BD = 70, WH = 9, BH = 10, NW = 22, THICK = 24, OX = 132, OY = 112, VW = 884, VH = 612, GHOST = 3;
  const P = (x, y, z = 0) => [OX + (x - y) * 0.866, OY + (x + y) * 0.5 - z];
  const pts = (arr) => arr.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ');
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const isWhite = (m) => [0, 2, 4, 5, 7, 9, 11].includes(((m % 12) + 12) % 12);
  const WHITES = []; for (let m = 21; m <= 108; m++) if (isWhite(m)) WHITES.push(m); // A0 to C8: 52 white keys

  G.Keys = function (container) {
    const T = G.T, L = NW * WW, FULL = WHITES.length * WW, LO_MIN = T.KEY_LO, LO_MAX = 64; // windows run from E1… up to E4–E7
    const svg = el('svg', { viewBox: `0 0 ${VW} ${VH}`, role: 'img', 'aria-label': 'Keyboard' }, container);
    const pegs = [];
    let lo = 41, hi = 0, at = {}, byMidi = {}, cur = null, last = { notes: [] }, pick = null;

    const defs = el('defs', {}, svg), rg = el('radialGradient', { id: 'kFloorFade', cx: '50%', cy: '54%', r: '58%' }, defs);
    el('stop', { offset: '35%', 'stop-color': '#fff', 'stop-opacity': 1 }, rg);
    el('stop', { offset: '100%', 'stop-color': '#fff', 'stop-opacity': 0 }, rg);
    const mask = el('mask', { id: 'kFloorMask' }, defs);
    el('rect', { x: 0, y: 0, width: VW, height: VH, fill: 'url(#kFloorFade)' }, mask);
    const lin = (id, x1, y1, x2, y2, stops, extra = {}) => { const g = el('linearGradient', Object.assign({ id, x1, y1, x2, y2 }, extra), defs); stops.forEach(([o, c, op]) => el('stop', { offset: o, style: 'stop-color:' + c + (op === undefined ? '' : ';stop-opacity:' + op) }, g)); };
    lin('kIvory', '0', '0', '1', '1', [['0', 'var(--ivory)'], ['1', 'var(--ivory-lo)']]);
    lin('kEbony', '0', '0', '1', '1', [['0', 'var(--ebony-hi)'], ['1', 'var(--ebony)']]);
    lin('kIvoryLit', '0', '0', '1', '1', [['0', '#ffe39a'], ['1', '#f3cc6a']]); // a lit key keeps its gradient
    lin('kEbonyLit', '0', '0', '1', '1', [['0', '#96707f'], ['1', '#7a5563']]);
    lin('kBody', '0', '0', '1', '1', [['0', '#3b3b42'], ['.5', '#2f2f35'], ['1', '#27272c']]);
    { // the instrument runs on past both ends of the window: fade it out along its length
      const a = P(-GHOST * WW - 6, 0), b = P(L + GHOST * WW + 6, 0);
      lin('kEnds', a[0].toFixed(1), a[1].toFixed(1), b[0].toFixed(1), b[1].toFixed(1), [['0', '#fff', 0], ['.085', '#fff', 1], ['.915', '#fff', 1], ['1', '#fff', 0]], { gradientUnits: 'userSpaceOnUse' });
      el('rect', { x: -200, y: -200, width: VW + 400, height: VH + 400, fill: 'url(#kEnds)' }, el('mask', { id: 'kEndsMask', maskUnits: 'userSpaceOnUse', x: -200, y: -200, width: VW + 400, height: VH + 400 }, defs));
    }
    const floor = el('g', { class: 'floor', mask: 'url(#kFloorMask)' }, svg), fz = -THICK, step = 42; // the case rests on the floor
    for (let v = -22 * step; v <= 30 * step; v += step) {
      const a = P(v, -700, fz), b = P(v, 900, fz), c = P(-700, v, fz), d = P(1500, v, fz);
      el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, floor);
      el('line', { x1: c[0], y1: c[1], x2: d[0], y2: d[1] }, floor);
    }
    const inst = el('g', { mask: 'url(#kEndsMask)' }, svg), back = el('g', {}, inst); // `back` and `front` hold the body and slide with the window
    let tgt = back;
    const face = (p, cls, parent, sw = 1.4) => el('polygon', { points: pts(p), class: cls, stroke: 'var(--ink)', 'stroke-width': sw, 'stroke-linejoin': 'round' }, parent);
    const seg = (a, b, cls, parent) => el('line', { x1: a[0].toFixed(1), y1: a[1].toFixed(1), x2: b[0].toFixed(1), y2: b[1].toFixed(1), class: cls }, parent);

    // ---- the instrument, in its own coordinates: x runs along the keys from the left edge of the lowest A, y toward the player ----
    const PD = 120, K = (k) => k * WW, Y = (p) => -2 - p * PD / 100; // panel positions are given as (white keys from the left, percent of panel depth from the felt)
    const X0 = K(-1.6), X1 = FULL + K(1.6), YB = Y(100) - 7, YF = KD + 12, BT = WH + 3, LIP = 4;
    const BODY = '#2d2d32', EDGE = '#63636b', PLATE = '#111113', LAMP = '#ff4a35', OFF = '#4a4a50', INK = '#d9d5cb', sh = G.Peg.shade;
    const quad = (p, fill, sw = 1.2, stroke = 'var(--ink)') => el('polygon', { points: pts(p), fill, stroke, 'stroke-width': sw, 'stroke-linejoin': 'round' }, tgt);
    const RC = 6, ring = [];
    [[X1 - RC, YF - RC, 0], [X0 + RC, YF - RC, 90], [X0 + RC, YB + RC, 180], [X1 - RC, YB + RC, 270]].forEach(([cx, cy, a0]) => { for (let k = 0; k <= 4; k++) { const a = (a0 + k * 22.5) * Math.PI / 180; ring.push([cx + RC * Math.cos(a), cy + RC * Math.sin(a)]); } });
    el('polygon', { points: pts(ring.map(([x, y]) => P(x + 26, y + 13, fz))), fill: '#000', opacity: '.17' }, back); // one hard shadow, lower right
    { // walls that face the viewer, the underside rolling away darker, then one ink line along the foot and at each end
      const N = ring.length, vis = [];
      for (let i = 0; i < N; i++) { const p = ring[i], q = ring[(i + 1) % N], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, nx = dy / l, ny = -dx / l; vis.push(nx + ny > 0.02 ? nx : null); }
      let st = 0; while (!(vis[st] !== null && vis[(st + N - 1) % N] === null)) st++;
      const foot = [];
      for (let k = 0; k < N && vis[(st + k) % N] !== null; k++) { const i = (st + k) % N, p = ring[i], q = ring[(i + 1) % N], t = Math.max(0, vis[i]);
        [[BT, fz, 0.2 + 0.32 * t], [fz + 9, fz, 0.46 + 0.3 * t]].forEach(([z1, z0, d]) => { const c = sh(BODY, d); el('polygon', { points: pts([P(p[0], p[1], z1), P(q[0], q[1], z1), P(q[0], q[1], z0), P(p[0], p[1], z0)]), fill: c, stroke: c, 'stroke-width': 0.7 }, back); });
        if (!k) foot.push(p); foot.push(q); }
      const a = foot[0], b = foot[foot.length - 1];
      el('polyline', { points: pts([P(a[0], a[1], BT)].concat(foot.map(([x, y]) => P(x, y, fz)), [P(b[0], b[1], BT)])), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.4, 'stroke-linejoin': 'round' }, back);
      el('polyline', { points: pts(foot.map(([x, y]) => P(x, y, fz + 9))), fill: 'none', stroke: '#fff', 'stroke-width': 0.8, opacity: '.14' }, back);
    }
    el('polygon', { points: pts(ring.map(([x, y]) => P(x, y, BT))), fill: 'url(#kBody)', stroke: 'var(--ink)', 'stroke-width': 1.4, 'stroke-linejoin': 'round' }, back);
    el('polyline', { points: pts([P(X0 + 2.5, YF - RC, BT), P(X0 + 2.5, YB + 2.5, BT), P(X1 - RC, YB + 2.5, BT)]), fill: 'none', stroke: '#fff', 'stroke-width': 1.1, opacity: '.24', 'stroke-linejoin': 'round' }, back); // light on the far edges
    { const a = P(X0 + 4, YB + 7, BT), b = P(X1 - 4, YB + 7, BT); el('line', { x1: a[0].toFixed(1), y1: a[1].toFixed(1), x2: b[0].toFixed(1), y2: b[1].toFixed(1), stroke: '#000', 'stroke-width': 1, opacity: '.3' }, back); } // where the panel breaks over to the rear
    quad([P(0, -1, BT), P(FULL, -1, BT), P(FULL, -1, 0), P(0, -1, 0)], sh(BODY, 0.5), 1); // back wall of the key recess
    quad([P(0, -1, BT), P(0, KD + 1, BT), P(0, KD + 1, 0), P(0, -1, 0)], sh(BODY, 0.6), 1); // its left wall
    el('polygon', { points: pts([P(0, 0, WH), P(FULL, 0, WH), P(FULL, KD, WH), P(0, KD, WH)]), class: 'kb-well' }, back); // the dark of the key bed
    seg(P(0, -1.5, WH + 0.8), P(FULL, -1.5, WH + 0.8), 'kb-felt', back); // the red felt behind the keys

    // ---- panel parts ----
    const flat = (x0, x1, y0, y1, fill, stroke = EDGE, sw = 0.8, z = BT) => quad([P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z)], fill, sw, stroke);
    const block = (x0, x1, y0, y1, h, top, stroke = EDGE) => { quad([P(x0, y1, BT + h), P(x1, y1, BT + h), P(x1, y1, BT), P(x0, y1, BT)], sh(top, 0.22), 0.7, stroke); quad([P(x1, y0, BT + h), P(x1, y1, BT + h), P(x1, y1, BT), P(x1, y0, BT)], sh(top, 0.4), 0.7, stroke); flat(x0, x1, y0, y1, top, stroke, 0.7, BT + h); };
    const ln = (a, b, stroke, w, op = '1') => el('line', { x1: a[0].toFixed(1), y1: a[1].toFixed(1), x2: b[0].toFixed(1), y2: b[1].toFixed(1), stroke, 'stroke-width': w, opacity: op, 'stroke-linecap': 'round' }, tgt);
    const gl = (x0, y0, x1, y1, stroke, w, op = '1', z = BT) => ln(P(x0, y0, z), P(x1, y1, z), stroke, w, op); // a line lying on the panel
    const dotAt = (x, y, r, fill, op = '1', z = BT) => { const p = P(x, y, z); el('ellipse', { cx: p[0].toFixed(1), cy: p[1].toFixed(1), rx: (r * 1.2247).toFixed(2), ry: (r * 0.7071).toFixed(2), fill, opacity: op }, tgt); };
    const cyl = (x, y, r, z0, z1, side, top) => { const a = P(x, y, z0), b = P(x, y, z1), rx = r * 1.2247, ry = r * 0.7071;
      el('path', { d: `M${(a[0] - rx).toFixed(1)} ${b[1].toFixed(1)} L${(a[0] - rx).toFixed(1)} ${a[1].toFixed(1)} A${rx.toFixed(1)} ${ry.toFixed(1)} 0 0 0 ${(a[0] + rx).toFixed(1)} ${a[1].toFixed(1)} L${(a[0] + rx).toFixed(1)} ${b[1].toFixed(1)} Z`, fill: side, stroke: EDGE, 'stroke-width': 0.8 }, tgt);
      el('ellipse', { cx: b[0].toFixed(1), cy: b[1].toFixed(1), rx: rx.toFixed(1), ry: ry.toFixed(1), fill: top, stroke: EDGE, 'stroke-width': 0.8 }, tgt); };
    const print = (x, y, t, size, fill = INK, weight = 700, anchor = 'start') => { const o = P(x, y, BT), n = el('text', { transform: `matrix(0.866 0.5 -0.866 0.5 ${o[0].toFixed(1)} ${o[1].toFixed(1)})`, 'text-anchor': anchor, style: `font:${weight} ${size}px var(--mono);fill:${fill};pointer-events:none` }, tgt); n.textContent = t; };
    const jobs = []; // raised parts are drawn back to front, whatever order they are listed in
    const put = (x, y, fn) => jobs.push([x + y, fn]);
    const screw = (k, p) => { dotAt(K(k), Y(p), 2.3, '#0c0c0e'); dotAt(K(k), Y(p), 1.5, '#5c5c64'); };
    const plate = (k0, k1, p0, p1, fill = PLATE) => flat(K(k0), K(k1), Y(p0), Y(p1), fill);
    const lamp = (k, p, on, col = LAMP) => dotAt(K(k), Y(p), 1.25, on ? col : OFF);
    // a knob. kind: 'big' selector, 'mid' with a dark tick ring, 'small', 'vol'. `deg` turns the pointer; `mark` colours it
    const knob = (k, p, kind, deg, label, mark = '#f4f1ea') => { const x = K(k), y = Y(p), r = kind === 'big' ? 12.6 : kind === 'small' ? 6.6 : kind === 'vol' ? 11 : 10, h = kind === 'small' ? 8 : r + 1;
      if (kind === 'vol') for (let j = 0; j <= 6; j++) { const a = (150 + j * 40) * Math.PI / 180; gl(x + (r + 4) * Math.cos(a), y + (r + 4) * Math.sin(a), x + (r + 10) * Math.cos(a), y + (r + 10) * Math.sin(a), '#f4f1ea', 1.5); }
      if (kind === 'mid') { dotAt(x, y, r + 4, '#08080a'); for (let j = 0; j <= 10; j++) { const a = (135 + j * 27) * Math.PI / 180; gl(x + (r + 1) * Math.cos(a), y + (r + 1) * Math.sin(a), x + (r + 3.4) * Math.cos(a), y + (r + 3.4) * Math.sin(a), '#55555d', 0.9); } const a = (deg + 8) * Math.PI / 180; gl(x + (r + 1) * Math.cos(a), y + (r + 1) * Math.sin(a), x + (r + 3.6) * Math.cos(a), y + (r + 3.6) * Math.sin(a), LAMP, 1.8); }
      if (label) print(x, y + r + (kind === 'mid' ? 10 : 8), label, 3.5, INK, 700, 'middle');
      put(x, y, () => { const z = BT; cyl(x, y, r, z, z + h, '#131316', '#2c2c33');
        const a = P(x, y, z), b = P(x, y, z + h), rx = r * 1.2247; [-0.6, -0.25, 0.2, 0.6].forEach((t, j) => ln([a[0] + rx * t, b[1] + r * 0.5], [a[0] + rx * t, a[1] + r * 0.42], j ? '#000' : '#fff', j ? 0.7 : 1.7, j ? '.4' : '.2'));
        cyl(x, y, r * 0.68, z + h, z + h + 0.5, '#2c2c33', kind === 'big' ? '#4a4a54' : '#3f3f48');
        const g = deg * Math.PI / 180; ln(P(x + 1.2 * Math.cos(g), y + 1.2 * Math.sin(g), z + h + 0.5), P(x + r * 0.9 * Math.cos(g), y + r * 0.9 * Math.sin(g), z + h + 0.2), mark, kind === 'big' ? 2 : 1.5); }); };
    // a square button with a lamp in its far half; a pill; a rocker; a toggle
    const btn = (k, p, top, lit, label) => { const x = K(k), y = Y(p); flat(x - 9.2, x + 9.2, y - 5.2, y + 5.2, '#060607', EDGE, 0.6); if (label) print(x, y + 12, label, 3.3, INK, 700, 'middle');
      put(x, y, () => { block(x - 8, x + 8, y - 4, y + 4, 2, top); gl(x - 6.5, y, x + 6.5, y, '#000', 0.6, '.35', BT + 2); if (lit !== undefined) dotAt(x, y - 2, 1.1, lit ? LAMP : '#1c1c20', '1', BT + 2); }); };
    const pill = (k, p, top = '#8f8f96') => { const x = K(k), y = Y(p); put(x, y, () => block(x - 8.5, x + 8.5, y - 1.9, y + 1.9, 1.2, top)); };
    const rocker = (k0, k1, p0, p1, col) => { const x0 = K(k0), x1 = K(k1), y0 = Y(p0), y1 = Y(p1), mx = (x0 + x1) / 2; flat(x0 - 1.5, x1 + 1.5, y0 - 1.5, y1 + 1.5, '#060607', EDGE, 0.6);
      put(mx, y1, () => { block(x0, x1, y0, y1, 3.6, col, sh(col, 0.5)); gl(x0 + 2, y0 + 2, x1 - 2, y0 + 2, '#fff', 1.1, '.55', BT + 3.6);
        [[y0 + 4.5, 1.6], [y1 - 4.5, -1.6]].forEach(([y, d]) => { gl(mx - 2.4, y + d, mx, y - d, sh(col, 0.55), 1, '1', BT + 3.6); gl(mx, y - d, mx + 2.4, y + d, sh(col, 0.55), 1, '1', BT + 3.6); }); }); };
    const toggle = (k, p) => { const x = K(k), y = Y(p); lamp(k + 0.4, p, true); print(x, y + 9, 'ON/OFF', 3.3, INK, 700, 'middle');
      put(x, y, () => { dotAt(x, y, 4.6, '#0b0b0d'); dotAt(x, y, 3.5, '#b9b4aa'); dotAt(x, y, 2, '#6c6860'); ln(P(x, y, BT + 1), P(x - 1.5, y - 3, BT + 9), '#3a3a40', 4.4); ln(P(x, y, BT + 1), P(x - 1.5, y - 3, BT + 9), '#dedad0', 2.8); ln(P(x - 0.8, y - 1.5, BT + 4), P(x - 1.5, y - 3, BT + 9), '#fff', 1, '.7'); }); };
    // a column of lamps with their names, the first one lit
    const list = (k, ps, names, on = 0, col = LAMP, left = false) => ps.forEach((p, j) => { lamp(k, p, j === on, col); if (names) print(K(k) + (left ? -3 : 3.5), Y(p) + 1.3, names[j], 3.3, INK, 700, left ? 'end' : 'start'); });

    // far left: two levers in their slots, the name where the maker's badge sits, a screw at each corner
    [[0.75, 82], [0.75, 22], [41.15, 85], [41.15, 22], [10.6, 85], [10.6, 22], [52.3, 82], [52.3, 22]].forEach(([k, p]) => screw(k, p));
    [[1.15, 55, 80], [2.3, 62, 86]].forEach(([k, p0, p1]) => { const x = K(k), y0 = Y(p1), y1 = Y(p0); flat(x - 4, x + 4, y0, y1, '#060607'); screw(k - 0.3, p1 + 3); screw(k + 0.3, p0 - 3);
      put(x, y1, () => { const a = P(x, (y0 + y1) / 2 + 4, BT), b = P(x + 2, (y0 + y1) / 2 - 6, BT + 17); ln(a, b, '#5a5a62', 7); ln(a, b, '#101012', 5.4); ln([a[0] - 1.4, a[1] - 5], [b[0] - 1.4, b[1] + 1], '#fff', 1, '.22'); ln(b, b, '#c9c5bb', 4.6); }); });
    print(K(0.1), Y(10), 'ATLAS', 12, '#e9e5dc', 800);
    print(K(49.2), Y(10), 'STAGE PIANO', 4.6, '#e9e5dc', 700); print(K(50.9), Y(10), '88', 10, '#e9e5dc', 800);
    knob(11.38, 66, 'vol', 268, null); print(K(11.38), Y(51), 'MASTER VOLUME', 3.5, INK, 700, 'middle');
    // display block: encoder in its well, the screen, EXIT, then the live-set buttons and function keys
    plate(12.47, 16.75, 78, 20); gl(K(12.47), Y(48), K(16.75), Y(48), '#fff', 0.7, '.16');
    flat(K(12.62), K(13.86), Y(67), Y(54), '#060607', EDGE, 0.5); knob(13.15, 66, 'big', 250, null); print(K(13.6), Y(55.5), 'ENTER', 3.3); print(K(12.88), Y(53.5), 'EXIT', 3.3, INK, 700, 'middle'); pill(12.88, 50);
    flat(K(14.14), K(16.43), Y(72), Y(54), '#0b0d26'); flat(K(14.24), K(16.33), Y(70.8), Y(55.2), '#1a2f8f', '#0b0d26', 0.5);
    print(K(14.38), Y(66.4), '1-1.Natural CFX', 4.4, '#e6eeff', 700); gl(K(14.36), Y(65), K(16.2), Y(65), '#9fb6ff', 0.6, '.7');
    [['P', 'CFX', 62.5], ['E', '78Rd', 59.4], ['S', 'Mellow Pad', 56.3]].forEach(([a, t, p]) => { print(K(14.42), Y(p), a, 4.2, '#e6eeff'); gl(K(14.64), Y(p + 1.2), K(14.86), Y(p + 1.2), '#5da0ff', 2.2); print(K(15.0), Y(p), t, 4.2, '#e6eeff'); });
    print(K(12.75), Y(42.6), 'LIVE SET', 4.4, '#f1ede4', 800); print(K(14.52), Y(41.8), 'PAGE', 3.1, INK, 700, 'middle');
    [14.19, 14.84].forEach((k) => pill(k, 43)); pill(15.5, 43, '#e9e6de');
    [[15.5, 36], [15.5, 29.5], [15.5, 22.5], [16.3, 43], [16.3, 36], [16.3, 29.5], [16.3, 22.5]].forEach(([k, p]) => pill(k, p));
    [34, 24.6].forEach((p, r) => [12.88, 13.55, 14.19, 14.86].forEach((k, j) => btn(k, p, '#74747c', !r && !j)));
    // the three sound sections share one layout: selector and voices, number display, rocker, then split, octave, volume, tone and the toggle
    const section = (k0, k1, name, col, seg7, voices) => {
      plate(k0, k1, 78, 20); screw(k0 + 0.14, 76); print(K(k0 + 0.34), Y(74.2), name, 5.6, '#f4f0e7', 800);
      flat(K(k0 + 0.04), K(k0 + 2.6), Y(56), Y(21), '#0b0b0d', '#3a3a41', 0.6);
      [72, 68, 64, 59].forEach((p) => gl(K(k0 + 1.0), Y(66 + (p - 66) * 0.25), K(k0 + 1.4), Y(p), '#f4f1ea', 0.7, '.7')); list(k0 + 1.48, [72, 68, 64, 59], voices, 0, seg7 === '#4fe38e' ? '#4fe38e' : LAMP);
      knob(k0 + 0.57, 66, 'big', 232, null, col);
      flat(K(k0 + 2.73), K(k0 + 3.43), Y(78), Y(68), '#160606', '#3a1a1a'); print(K(k0 + 2.8), Y(69.6), '01', 9.5, seg7, 800);
      rocker(k0 + 2.8, k0 + 3.36, 65, 53, col);
      [[k0 + 0.56, 'SPLIT'], [k0 + 1.42, null], [k0 + 2.17, null]].forEach(([k, t], j) => { const x = K(k), y = Y(48); flat(x - 8.6, x + 8.6, y - 4.6, y + 4.6, '#060607', EDGE, 0.6); put(x, y, () => { block(x - 7.4, x + 7.4, y - 3.4, y + 3.4, 1.6, '#232327'); [-3, 3].forEach((d) => dotAt(x + d, y, 1, j ? '#55555d' : LAMP, '1', BT + 1.6)); }); if (t) print(x, y + 11, t, 3.3, INK, 700, 'middle'); });
      print(K(k0 + 0.4), Y(52.6), 'L', 3.3); print(K(k0 + 0.64), Y(52.6), 'R', 3.3); print(K(k0 + 1.8), Y(52.6), '-2 -1  0 +1 +2', 3.2, INK, 700, 'middle'); print(K(k0 + 1.8), Y(48) + 11, 'OCTAVE', 3.3, INK, 700, 'middle');
      knob(k0 + 0.56, 33, 'mid', 30, 'VOLUME'); knob(k0 + 1.8, 34, 'mid', 275, 'TONE');
      toggle(k0 + 1.16, 20);
    };
    section(16.9, 21.8, 'Piano', '#e9c52c', '#ff7a2c', ['Grand Piano', 'Upright Piano', 'CP', 'Layered Piano']);
    gl(K(19.52), Y(56), K(19.52), Y(21), '#fff', 0.7, '.14'); gl(K(20.58), Y(77), K(20.58), Y(21), '#fff', 0.7, '.14');
    btn(19.99, 26, '#8f8f96', true); print(K(19.99), Y(31.5), 'DAMPER', 3.2, INK, 700, 'middle'); print(K(19.99), Y(29.2), 'RESONANCE', 3.2, INK, 700, 'middle');
    list(20.8, [73, 69.5, 66, 62], ['Compressor', 'Distortion', 'Drive', 'Chorus'], -1); btn(21.17, 55, '#1d1d21'); knob(21.17, 42, 'mid', 270, 'DEPTH'); btn(21.17, 26.6, '#8f8f96', false, 'ON/OFF');
    section(21.95, 28.83, 'E.Piano', '#d9332b', '#ff3b30', ['Rd', 'Wr', 'Clv', 'DX']);
    gl(K(24.55), Y(56), K(24.55), Y(21), '#fff', 0.7, '.14'); gl(K(25.6), Y(77), K(25.6), Y(21), '#fff', 0.7, '.14'); gl(K(25.6), Y(47.5), K(28.8), Y(47.5), '#fff', 0.7, '.14');
    [[28.64, 76], [28.64, 22], [25.82, 42]].forEach(([k, p]) => screw(k, p));
    knob(25.0, 42, 'mid', 270, 'DRIVE'); btn(25.0, 26.6, '#8f8f96', false, 'ON/OFF');
    knob(26.56, 71.5, 'mid', 275, 'DEPTH'); knob(27.91, 71.5, 'mid', 235, 'RATE');
    list(26.1, [59, 55, 51.5], ['A.Pan', 'Trem', 'R.Mod'], 0, LAMP, true); btn(26.56, 55, '#1d1d21'); list(27.05, [59, 55, 51.5], ['T.Wah', 'P.Wah', 'Comp'], -1); btn(27.91, 55, '#8f8f96', true, 'ON/OFF');
    knob(26.56, 42, 'mid', 270, 'DEPTH'); knob(27.91, 42, 'mid', 270, 'SPEED');
    list(26.1, [30, 26, 22.5], ['Cho 1', 'Cho 2', 'Flang'], -1, LAMP, true); btn(26.56, 26.3, '#1d1d21'); list(27.05, [30, 26, 22.5], ['Pha 1', 'Pha 2', 'Pha 3'], -1); btn(27.91, 26.3, '#8f8f96', false, 'ON/OFF');
    section(29.0, 33.95, 'Sub', '#3f9b7b', '#4fe38e', ['Pad/Strings', 'Organ', 'Chromatic Perc.', 'Others']);
    gl(K(31.6), Y(56), K(31.6), Y(21), '#fff', 0.7, '.14'); gl(K(32.86), Y(77), K(32.86), Y(21), '#fff', 0.7, '.14');
    [[33.72, 76], [29.14, 22]].forEach(([k, p]) => screw(k, p));
    knob(32.02, 42, 'mid', 270, 'DEPTH'); btn(32.02, 26.6, '#1d1d21'); list(32.5, [32.5, 28.7, 25, 21.4], ['Cho/Fla', 'Rotary', 'Trem', 'Dist'], -1);
    knob(33.41, 74, 'small', 270, 'ATTACK'); knob(33.41, 58.5, 'small', 270, 'RELEASE'); knob(33.41, 42, 'mid', 270, 'SPEED'); btn(33.41, 26.6, '#8f8f96', false, 'ON/OFF');
    // delay and reverb: which section they act on, then a plate each
    plate(34.08, 34.85, 79, 61); list(34.17, [73.7, 70, 66.6], ['Piano', 'E.Piano', 'Sub']); btn(34.45, 55.6, '#1d1d21'); screw(34.45, 42);
    plate(35.0, 37.19, 79, 20, '#17171a'); flat(K(35.0), K(37.19), Y(79), Y(61), PLATE, EDGE, 0.5);
    knob(36.09, 71, 'mid', 205, 'DEPTH'); knob(35.45, 52, 'mid', 268, 'FEEDBACK'); knob(36.68, 52, 'mid', 250, 'TIME');
    btn(35.45, 33, '#1d1d21'); list(36.0, [34.7, 31], ['Analog', 'Digital']); print(K(36.06), Y(25.4), 'DELAY', 4.6, '#f1ede4', 800, 'middle'); toggle(36.06, 20);
    plate(37.32, 38.52, 79, 20, '#17171a'); flat(K(37.32), K(38.52), Y(79), Y(61), PLATE, EDGE, 0.5);
    knob(37.89, 71, 'mid', 205, 'DEPTH'); knob(37.89, 52, 'mid', 250, 'TIME'); print(K(37.89), Y(25.4), 'REVERB', 4.6, '#f1ede4', 800, 'middle'); toggle(37.89, 20); screw(38.76, 42);
    // master equaliser, printed straight on the panel
    print(K(39.0), Y(77), 'MASTER EQUALIZER', 3.6);
    knob(39.16, 70.8, 'small', 265, 'HIGH'); knob(39.16, 52, 'small', 265, 'MID'); knob(39.16, 33, 'small', 265, 'LOW'); knob(40.26, 52, 'small', 265, 'FREQUENCY');
    gl(K(39.5), Y(52), K(39.95), Y(52), '#f4f1ea', 0.8, '.8'); btn(40.26, 33, '#8f8f96', false, 'ON/OFF');
    jobs.sort((a, b) => a[0] - b[0]).forEach(([, fn]) => fn());

    const keyLayer = el('g', {}, inst), front = el('g', {}, inst), labelLayer = el('g', {}, svg), pegLayer = el('g', {}, svg);
    // the low key slip in front, with the underside band and foot line carried across it, and the inside face of the left end block
    tgt = front;
    quad([P(0, YF, LIP), P(FULL, YF, LIP), P(FULL, YF, fz), P(0, YF, fz)], sh(BODY, 0.2));
    quad([P(0, YF, fz + 9), P(FULL, YF, fz + 9), P(FULL, YF, fz), P(0, YF, fz)], sh(BODY, 0.46), 0.01);
    ln(P(0, YF, fz + 9), P(FULL, YF, fz + 9), '#fff', 0.8, '.14'); ln(P(0, YF, fz), P(FULL, YF, fz), 'var(--ink)', 1.4);
    quad([P(0, KD + 1, LIP), P(FULL, KD + 1, LIP), P(FULL, YF, LIP), P(0, YF, LIP)], '#34343a');
    quad([P(0, KD + 1, BT), P(0, YF, BT), P(0, YF, LIP), P(0, KD + 1, LIP)], sh(BODY, 0.6), 1);

    const makePeg = () => G.Peg.make(pegLayer);
    // build the keys for a window starting on white key `v`, with a few more either side that fade out with the body
    function setWindow(v) {
      v = Math.max(LO_MIN, Math.min(LO_MAX, v));
      while (!isWhite(v)) v--;
      lo = v; at = {};
      keyLayer.replaceChildren(); labelLayer.replaceChildren();
      const w0 = WHITES.indexOf(lo), a = Math.max(0, w0 - GHOST), b = Math.min(WHITES.length, w0 + NW + GHOST), slide = `translate(${(-w0 * WW * 0.866).toFixed(1)} ${(-w0 * WW * 0.5).toFixed(1)})`;
      back.setAttribute('transform', slide); front.setAttribute('transform', slide);
      hi = WHITES[w0 + NW - 1];
      for (let w = a; w < b; w++) {
        const m = WHITES[w], i = w - w0, live = i >= 0 && i < NW, g = el('g', { class: 'key white' }, keyLayer), x0 = i * WW, x1 = x0 + WW;
        face([P(x0, KD, WH), P(x1, KD, WH), P(x1, KD), P(x0, KD)], 'k-front', g, 1);
        if (w === b - 1) face([P(x1, 0, WH), P(x1, KD, WH), P(x1, KD), P(x1, 0)], 'k-front', g, 1);
        face([P(x0, 0, WH), P(x1, 0, WH), P(x1, KD, WH), P(x0, KD, WH)], 'k-top', g, 1);
        seg(P(x0 + 2.5, KD - 2.5, WH), P(x1 - 2.5, KD - 2.5, WH), 'k-lip', g);
        if (!live) continue;
        g.dataset.midi = m; at[m] = { x: (i + 0.5) * WW, y: KD - 23, z: WH, node: g };
        if (m % 12 === 0) { const [x, y] = P((i + 0.5) * WW, KD + 27, -THICK), t = el('text', { class: 'fretno on' + (m === 60 ? ' mid' : ''), x, y: y + 4 }, labelLayer); t.textContent = 'C' + (m / 12 - 1); }
      }
      for (let w = a; w < b - 1; w++) {
        const m = WHITES[w], i = w - w0;
        if (WHITES[w + 1] - m !== 2) continue;
        const g = el('g', { class: 'key black' }, keyLayer), cx = (i + 1) * WW, x0 = cx - BW / 2, x1 = cx + BW / 2, z = WH + BH;
        face([P(x1, 0, z), P(x1, BD - 9, z), P(x1, BD, WH), P(x1, 0, WH)], 'k-side', g, 1); // sloped front
        face([P(x0, BD - 9, z), P(x1, BD - 9, z), P(x1, BD, WH), P(x0, BD, WH)], 'k-front', g, 1);
        face([P(x0, 0, z), P(x1, 0, z), P(x1, BD - 9, z), P(x0, BD - 9, z)], 'k-top', g, 1);
        seg(P(x0 + 3, 4, z), P(x0 + 3, BD - 13, z), 'k-gloss', g);
        if (i >= 0 && i < NW - 1) { g.dataset.midi = m + 1; at[m + 1] = { x: cx, y: BD - 25, z, node: g }; }
      }
      nav.querySelector(':scope > span').textContent = `${T.midiName(lo)} – ${T.midiName(hi)}`;
      nav.children[0].disabled = lo <= LO_MIN; nav.children[2].disabled = lo >= LO_MAX;
    }
    const nav = document.createElement('div');
    nav.className = 'kb-nav';
    nav.innerHTML = '<button type="button" data-d="-12" aria-label="Lower octave">‹</button><span></span><button type="button" data-d="12" aria-label="Higher octave">›</button>';
    container.appendChild(nav);
    nav.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { setWindow(lo + +b.dataset.d); draw(); } });
    svg.addEventListener('click', (e) => {
      const k = e.target.closest && e.target.closest('[data-midi]');
      if (pick && k && !k.classList.contains('off')) pick(+k.dataset.midi);
    });

    function draw() {
      const notes = (last.notes || []).filter((n) => at[n.midi]).map((n) => Object.assign({ at: at[n.midi] }, n)).sort((a, b) => (a.at.x + a.at.y) - (b.at.x + b.at.y));
      while (pegs.length < notes.length) pegs.push(makePeg());
      byMidi = {}; cur = null;
      pegs.forEach((g, i) => {
        const n = notes[i];
        g.classList.toggle('off', !n);
        if (!n) return;
        const [x, y] = P(n.at.x, n.at.y, n.at.z); // the peg rests on the key; both dip only while the note sounds
        g.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        G.Peg.set(g, n, n.hand === 'L' ? ' lh' : '');
        byMidi[n.midi] = g; g.dataset.midi = n.midi;
        if (!n.dim) n.at.node.classList.add('lit');
      });
    }
    const api = {
      setPick(fn) { pick = fn; svg.classList.toggle('pickable', !!fn); },
      // notes: [{midi, label, role, dim, hand: 'L'|'R'}]
      show(spec = {}) {
        last = spec;
        const ms = (spec.notes || []).filter((n) => !n.dim).map((n) => n.midi).filter((m) => m >= T.KEY_LO && m <= T.KEY_HI);
        const all = ms.length ? ms : (spec.notes || []).map((n) => n.midi);
        if (all.length) {
          const a = Math.min(...all), b = Math.max(...all);
          if (a < lo || b > hi) setWindow(a - Math.max(0, Math.floor((36 - (b - a)) / 2))); // slide only when something would fall outside; then centre it
          else setWindow(lo);
        } else setWindow(lo);
        draw();
      },
      pulse(midi) {
        const k = at[midi], g = byMidi[midi];
        [[k && k.node, 'hit'], [g, 'ring']].forEach(([node, cls]) => { if (!node) return; node.classList.remove(cls); void node.getBoundingClientRect(); node.classList.add(cls); });
      },
      setActive(midi) {
        if (cur) cur.classList.remove('cur');
        cur = midi == null ? null : byMidi[midi];
        if (cur) cur.classList.add('cur');
        if (midi != null) api.pulse(midi);
      },
      window: () => [lo, hi],
    };
    setWindow(lo);
    return api;
  };
})();
