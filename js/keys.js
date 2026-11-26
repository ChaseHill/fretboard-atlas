// Isometric keyboard drawn in SVG, in the same projection and peg language as the neck: a black stage piano modelled on
// the owner's reference (an 88-key stage piano), showing a three-octave window of it. Behind the keys, left to right: two
// levers, master volume, the display with its live-set buttons, then three sound sections (yellow, red, green), each with a
// selector, a number display, a coloured rocker, volume and tone, an on/off toggle and its effects.
(() => {
  'use strict';
  const G = (window.G = window.G || {});
  const NS = 'http://www.w3.org/2000/svg';
  const WW = 32, KD = 114, BW = 18, BD = 70, WH = 9, BH = 10, NW = 22, THICK = 14, OX = 130, OY = 82, VW = 852, VH = 561, DEP = 4; // DEP: how far a held key sinks
  const P = (x, y, z = 0) => [OX + (x - y) * 0.866, OY + (x + y) * 0.5 - z];
  const pts = (arr) => arr.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ');
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const isWhite = (m) => [0, 2, 4, 5, 7, 9, 11].includes(((m % 12) + 12) % 12);

  G.Keys = function (container) {
    const T = G.T, L = NW * WW, LO_MIN = T.KEY_LO, LO_MAX = 64; // windows run from E1… up to E4–E7
    const svg = el('svg', { viewBox: `0 0 ${VW} ${VH}`, role: 'img', 'aria-label': 'Keyboard' }, container);
    const pegs = [];
    let lo = 41, hi = 0, at = {}, byMidi = {}, cur = null, last = { notes: [] }, pick = null;

    const defs = el('defs', {}, svg), rg = el('radialGradient', { id: 'kFloorFade', cx: '50%', cy: '54%', r: '58%' }, defs);
    el('stop', { offset: '35%', 'stop-color': '#fff', 'stop-opacity': 1 }, rg);
    el('stop', { offset: '100%', 'stop-color': '#fff', 'stop-opacity': 0 }, rg);
    const mask = el('mask', { id: 'kFloorMask' }, defs);
    el('rect', { x: 0, y: 0, width: VW, height: VH, fill: 'url(#kFloorFade)' }, mask);
    const lin = (id, x1, y1, x2, y2, stops) => { const g = el('linearGradient', { id, x1, y1, x2, y2 }, defs); stops.forEach(([o, c]) => el('stop', { offset: o, style: 'stop-color:' + c }, g)); };
    lin('kIvory', '0', '0', '1', '1', [['0', 'var(--ivory)'], ['1', 'var(--ivory-lo)']]);
    lin('kEbony', '0', '0', '1', '1', [['0', 'var(--ebony-hi)'], ['1', 'var(--ebony)']]);
    lin('kIvoryLit', '0', '0', '1', '1', [['0', '#ffe39a'], ['1', '#f3cc6a']]); // a lit key keeps its gradient
    lin('kEbonyLit', '0', '0', '1', '1', [['0', '#96707f'], ['1', '#7a5563']]);
    lin('kRail', '0', '0', '0', '1', [['0', '#ece6da'], ['.5', '#bdb4a6'], ['1', '#d9d1c4']]);
    lin('kLid', '0', '0', '1', '1', [['0', '#3b3b44'], ['1', '#2a2a31']]);
    const floor = el('g', { class: 'floor', mask: 'url(#kFloorMask)' }, svg), fz = -THICK, step = 42; // the case rests on the floor
    for (let v = -22 * step; v <= 30 * step; v += step) {
      const a = P(v, -700, fz), b = P(v, 900, fz), c = P(-700, v, fz), d = P(1500, v, fz);
      el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, floor);
      el('line', { x1: c[0], y1: c[1], x2: d[0], y2: d[1] }, floor);
    }
    const face = (p, cls, parent = svg, sw = 1.4) => el('polygon', { points: pts(p), class: cls, stroke: 'var(--ink)', 'stroke-width': sw, 'stroke-linejoin': 'round' }, parent);
    const seg = (a, b, cls, parent = svg) => el('line', { x1: a[0].toFixed(1), y1: a[1].toFixed(1), x2: b[0].toFixed(1), y2: b[1].toFixed(1), class: cls }, parent);
    const X0 = -18, X1 = L + 18, YB = -102, YF = KD + 12, BT = WH + 3, LIP = 4; // a deep flat panel behind the keys; the key slip in front sits low so the key fronts show
    const BODY = '#2d2d32', EDGE = '#63636b', sh = G.Peg.shade;
    const quad = (p, fill, parent = svg, sw = 1.2, stroke = 'var(--ink)') => el('polygon', { points: pts(p), fill, stroke, 'stroke-width': sw, 'stroke-linejoin': 'round' }, parent);
    // body: one slab with tight corners. Its outline, walked right side -> front -> left -> back.
    const RC = 5, ring = [];
    [[X1 - RC, YF - RC, 0], [X0 + RC, YF - RC, 90], [X0 + RC, YB + RC, 180], [X1 - RC, YB + RC, 270]].forEach(([cx, cy, a0]) => { for (let k = 0; k <= 4; k++) { const a = (a0 + k * 22.5) * Math.PI / 180; ring.push([cx + RC * Math.cos(a), cy + RC * Math.sin(a)]); } });
    el('polygon', { points: pts(ring.map(([x, y]) => P(x + 22, y + 11, fz))), fill: '#000', opacity: '.17' }, svg); // one hard shadow, lower right
    lin('kBody', '0', '0', '1', '1', [['0', '#3b3b42'], ['.6', '#2d2d32'], ['1', '#242428']]);
    { // walls that face the viewer, shaded round the corners, then one ink line along the foot and at each end
      const N = ring.length, vis = [];
      for (let i = 0; i < N; i++) { const p = ring[i], q = ring[(i + 1) % N], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, nx = dy / l, ny = -dx / l; vis.push(nx + ny > 0.02 ? nx : null); }
      let st = 0; while (!(vis[st] !== null && vis[(st + N - 1) % N] === null)) st++;
      const foot = [];
      for (let k = 0; k < N && vis[(st + k) % N] !== null; k++) { const i = (st + k) % N, p = ring[i], q = ring[(i + 1) % N], c = sh(BODY, 0.2 + 0.32 * Math.max(0, vis[i]));
        el('polygon', { points: pts([P(p[0], p[1], BT), P(q[0], q[1], BT), P(q[0], q[1], fz), P(p[0], p[1], fz)]), fill: c, stroke: c, 'stroke-width': 0.7 }, svg);
        if (!k) foot.push(p); foot.push(q); }
      const a = foot[0], b = foot[foot.length - 1];
      el('polyline', { points: pts([P(a[0], a[1], BT)].concat(foot.map(([x, y]) => P(x, y, fz)), [P(b[0], b[1], BT)])), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.4, 'stroke-linejoin': 'round' }, svg);
      el('polyline', { points: pts(foot.map(([x, y]) => P(x, y, fz + 5))), fill: 'none', stroke: '#fff', 'stroke-width': 0.8, opacity: '.12' }, svg); // seam where the base meets the shell
    }
    el('polygon', { points: pts(ring.map(([x, y]) => P(x, y, BT))), fill: 'url(#kBody)', stroke: 'var(--ink)', 'stroke-width': 1.4, 'stroke-linejoin': 'round' }, svg);
    el('polyline', { points: pts(ring.slice(6, 15).map(([x, y]) => P(x + (x < 0 ? 2.5 : 0), y + (y < YB + 4 ? 2.5 : 0), BT))), fill: 'none', stroke: '#fff', 'stroke-width': 1.1, opacity: '.26', 'stroke-linecap': 'round' }, svg); // light catching the far edges
    quad([P(0, -1, BT), P(L, -1, BT), P(L, -1, 0), P(0, -1, 0)], sh(BODY, 0.5), svg, 1); // back wall of the recess
    quad([P(0, -1, BT), P(0, KD + 1, BT), P(0, KD + 1, 0), P(0, -1, 0)], sh(BODY, 0.6), svg, 1); // its left wall
    seg(P(0, -1.5, WH + 0.8), P(L, -1.5, WH + 0.8), 'kb-felt'); // the red felt behind the keys
    // ---- panel ----
    const flat = (x0, x1, y0, y1, fill, stroke = EDGE, sw = 0.8, z = BT) => quad([P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z)], fill, svg, sw, stroke);
    const block = (x0, x1, y0, y1, h, top, stroke = EDGE) => { quad([P(x0, y1, BT + h), P(x1, y1, BT + h), P(x1, y1, BT), P(x0, y1, BT)], sh(top, 0.22), svg, 0.7, stroke); quad([P(x1, y0, BT + h), P(x1, y1, BT + h), P(x1, y1, BT), P(x1, y0, BT)], sh(top, 0.4), svg, 0.7, stroke); flat(x0, x1, y0, y1, top, stroke, 0.7, BT + h); };
    const ln = (a, b, stroke, w, op = '1') => el('line', { x1: a[0].toFixed(1), y1: a[1].toFixed(1), x2: b[0].toFixed(1), y2: b[1].toFixed(1), stroke, 'stroke-width': w, opacity: op, 'stroke-linecap': 'round' }, svg);
    const dotAt = (x, y, r, fill, op = '1', z = BT) => { const p = P(x, y, z); el('circle', { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r, fill, opacity: op }, svg); };
    const cyl = (x, y, r, z0, z1, side, top) => { const a = P(x, y, z0), b = P(x, y, z1), rx = r * 1.2247, ry = r * 0.7071;
      el('path', { d: `M${(a[0] - rx).toFixed(1)} ${b[1].toFixed(1)} L${(a[0] - rx).toFixed(1)} ${a[1].toFixed(1)} A${rx.toFixed(1)} ${ry.toFixed(1)} 0 0 0 ${(a[0] + rx).toFixed(1)} ${a[1].toFixed(1)} L${(a[0] + rx).toFixed(1)} ${b[1].toFixed(1)} Z`, fill: side, stroke: EDGE, 'stroke-width': 0.8 }, svg);
      el('ellipse', { cx: b[0].toFixed(1), cy: b[1].toFixed(1), rx: rx.toFixed(1), ry: ry.toFixed(1), fill: top, stroke: EDGE, 'stroke-width': 0.8 }, svg); };
    const print = (x, y, t, size, fill, weight = 700) => { const o = P(x, y, BT), n = el('text', { transform: `matrix(0.866 0.5 -0.866 0.5 ${o[0].toFixed(1)} ${o[1].toFixed(1)})`, style: `font:${weight} ${size}px var(--mono);fill:${fill};letter-spacing:.06em;pointer-events:none` }, svg); n.textContent = t; };
    // a knob: printed ticks, a ribbed barrel, a cap and a white pointer at angle `deg`; an optional lamp beside it
    const knob = (x, y, r, deg, lamp) => { const z = BT, h = r + 3.5;
      for (let k = 0; k <= 6; k++) { const a = (135 + k * 45) * Math.PI / 180; dotAt(x + (r + 4.2) * Math.cos(a), y + (r + 4.2) * Math.sin(a), 0.65, '#fff', '.5'); }
      cyl(x, y, r, z, z + h, '#131316', '#2c2c33');
      const a = P(x, y, z), b = P(x, y, z + h), rx = r * 1.2247; [-0.6, -0.25, 0.2, 0.6].forEach((t, j) => ln([a[0] + rx * t, b[1] + r * 0.5], [a[0] + rx * t, a[1] + r * 0.42], j ? '#000' : '#fff', j ? 0.7 : 1.7, j ? '.4' : '.2'));
      cyl(x, y, r * 0.66, z + h, z + h + 0.5, '#2c2c33', '#3f3f48');
      const g = deg * Math.PI / 180; ln(P(x + 1.2 * Math.cos(g), y + 1.2 * Math.sin(g), z + h + 0.5), P(x + r * 0.86 * Math.cos(g), y + r * 0.86 * Math.sin(g), z + h + 0.2), '#f4f1ea', 1.5);
      if (lamp) dotAt(x + r + 5, y + r + 1, 1.3, '#ff4a35'); };
    const toggle = (x, y) => { dotAt(x, y, 4.2, '#0b0b0d'); const p = P(x, y, BT); el('ellipse', { cx: p[0].toFixed(1), cy: p[1].toFixed(1), rx: 4.4, ry: 2.6, fill: '#b9b4aa', stroke: EDGE, 'stroke-width': 0.7 }, svg);
      ln(P(x, y, BT + 1), P(x - 1.5, y - 3, BT + 9), '#3a3a40', 4.4); ln(P(x, y, BT + 1), P(x - 1.5, y - 3, BT + 9), '#dedad0', 2.8); ln(P(x - 0.8, y - 1.5, BT + 4), P(x - 1.5, y - 3, BT + 9), '#fff', 1, '.7'); dotAt(x + 11, y, 1.3, '#ff4a35'); print(x - 8, y + 9, 'ON/OFF', 3.4, '#b9b4aa'); };
    // far left: two levers in their slots, then master volume
    [26, 46].forEach((x) => { flat(x - 3.5, x + 3.5, -82, -54, '#09090a'); ln(P(x, -66, BT), P(x, -74, BT + 15), '#5a5a62', 6.6); ln(P(x, -66, BT), P(x, -74, BT + 15), '#0f0f11', 5); ln(P(x - 1.4, -68, BT + 4), P(x - 1.4, -73.4, BT + 14), '#fff', 1, '.22'); });
    print(13, -22, 'ATLAS', 11, '#c9c4b9', 800);
    knob(78, -70, 9.5, 235, false); print(62, -50, 'MASTER VOLUME', 3.4, '#b9b4aa');
    // display module: encoder, blue screen with three lines, eight live-set buttons, three function keys
    flat(96, 192, -94, -12, '#111113');
    flat(126, 188, -90, -62, '#0b0d26'); flat(129, 185, -87, -65, '#1f3aa8', '#0b0d26', 0.5);
    ln(P(133, -81, BT), P(170, -81, BT), '#dfe8ff', 1.3, '.95'); ln(P(137, -75, BT), P(160, -75, BT), '#9fc0ff', 1.2, '.9'); ln(P(137, -70, BT), P(166, -70, BT), '#9fc0ff', 1.2, '.9');
    knob(111, -76, 8, 250, false);
    print(100, -52, 'LIVE SET', 3.8, '#e6e2d8');
    [-48, -32].forEach((y, r) => [0, 1, 2, 3].forEach((k) => { block(102 + k * 14, 113 + k * 14, y, y + 10, 1.5, '#74747c'); if (!r && !k) dotAt(107.5, y + 3, 1, '#ff4a35', '1', BT + 1.5); }));
    [-50, -38, -26].forEach((y) => block(164, 186, y, y + 7, 1.3, '#8f8f96'));
    // three sound sections
    const section = (x, name, col, segCol, voices) => {
      flat(x, x + 160, -94, -12, '#111113'); print(x + 5, -86, name, 5.2, '#f1ede4', 800);
      ln(P(x + 88, -92, BT), P(x + 88, -14, BT), '#fff', 0.7, '.16'); ln(P(x + 4, -50, BT), P(x + 86, -50, BT), '#fff', 0.7, '.16');
      for (let j = 0; j < 4; j++) { ln(P(x + 30, -78 + j * 6.4, BT), P(x + 38, -78 + j * 6.4, BT), '#fff', 0.7, '.5'); dotAt(x + 41, -78 + j * 6.4, 1, j === voices ? '#ff4a35' : '#4a4a50'); ln(P(x + 44.5, -78 + j * 6.4, BT), P(x + 52 - (j % 2) * 2, -78 + j * 6.4, BT), '#d9d5cb', 1, '.7'); }
      knob(x + 17, -68, 8.5, 215 + voices * 22, false);
      flat(x + 60, x + 82, -90, -74, '#1a0707', '#3a1a1a'); print(x + 62.5, -77, '01', 9, segCol, 800);
      block(x + 62, x + 80, -70, -54, 3.4, col, sh(col, 0.5)); ln(P(x + 64.5, -67.5, BT + 3.4), P(x + 77.5, -67.5, BT + 3.4), '#fff', 1.1, '.55');
      knob(x + 106, -74, 7, 250, true); knob(x + 138, -74, 7, 300, true);
      block(x + 97, x + 113, -52, -44, 1.5, '#2a2a30'); block(x + 129, x + 145, -52, -44, 1.5, '#8f8f96'); dotAt(x + 137, -41, 1, '#ff4a35');
      [[x + 12, 'L'], [x + 22, 'R']].forEach(([u, t]) => { block(u, u + 7, -45, -38, 1.2, '#3a1512', '#5a2a26'); dotAt(u + 3.5, -41.5, 1, '#ff4a35', '1', BT + 1.2); });
      block(x + 40, x + 58, -45, -38, 1.2, '#2a2a30'); block(x + 62, x + 80, -45, -38, 1.2, '#2a2a30');
      knob(x + 20, -27, 7.5, 240, true); knob(x + 52, -27, 7.5, 280, true);
      knob(x + 106, -30, 7, 230, true); knob(x + 138, -30, 7, 270, true);
      toggle(x + 74, -19);
    };
    section(198, 'Piano', '#e9c52c', '#ff5a3c', 0); section(366, 'E.Piano', '#d9332b', '#ff5a3c', 0); section(534, 'Sub', '#3f9b7b', '#4fe38e', 0);
    el('polygon', { points: pts([P(0, 0, WH), P(L, 0, WH), P(L, KD, WH), P(0, KD, WH)]), class: 'kb-well' }, svg); // the dark of the key bed, seen beside a key that is held down
    const keyLayer = el('g', {}, svg), frontLayer = el('g', {}, svg), labelLayer = el('g', {}, svg), pegLayer = el('g', {}, svg);
    // the low key slip in front, and the inside face of the left end block that stands above it
    quad([P(0, YF, LIP), P(L, YF, LIP), P(L, YF, fz), P(0, YF, fz)], sh(BODY, 0.2), frontLayer);
    quad([P(0, KD + 1, LIP), P(L, KD + 1, LIP), P(L, YF, LIP), P(0, YF, LIP)], '#34343a', frontLayer);
    quad([P(0, KD + 1, BT), P(0, YF, BT), P(0, YF, LIP), P(0, KD + 1, LIP)], sh(BODY, 0.6), frontLayer, 1);

    const makePeg = () => G.Peg.make(pegLayer);
    // build the keys for a window starting on white key `v`
    function setWindow(v) {
      v = Math.max(LO_MIN, Math.min(LO_MAX, v));
      while (!isWhite(v)) v--;
      lo = v; at = {};
      keyLayer.replaceChildren(); labelLayer.replaceChildren();
      const whites = [];
      for (let m = lo; whites.length < NW; m++) if (isWhite(m)) whites.push(m);
      hi = whites[NW - 1];
      whites.forEach((m, i) => {
        const g = el('g', { class: 'key white' }, keyLayer), x0 = i * WW, x1 = x0 + WW;
        face([P(x0, KD, WH), P(x1, KD, WH), P(x1, KD), P(x0, KD)], 'k-front', g, 1);
        face([P(x0, 0, WH), P(x1, 0, WH), P(x1, KD, WH), P(x0, KD, WH)], 'k-top', g, 1);
        seg(P(x0 + 2.5, KD - 2.5, WH), P(x1 - 2.5, KD - 2.5, WH), 'k-lip', g);
        g.dataset.midi = m; at[m] = { x: (i + 0.5) * WW, y: KD - 23, z: WH, node: g };
        if (m % 12 === 0) { const [x, y] = P((i + 0.5) * WW, KD + 27, -THICK), t = el('text', { class: 'fretno on' + (m === 60 ? ' mid' : ''), x, y: y + 4 }, labelLayer); t.textContent = 'C' + (m / 12 - 1); }
      });
      whites.forEach((m, i) => {
        if (i === NW - 1 || whites[i + 1] - m !== 2) return;
        const g = el('g', { class: 'key black' }, keyLayer), cx = (i + 1) * WW, x0 = cx - BW / 2, x1 = cx + BW / 2, z = WH + BH;
        face([P(x1, 0, z), P(x1, BD - 9, z), P(x1, BD, WH), P(x1, 0, WH)], 'k-side', g, 1); // sloped front
        face([P(x0, BD - 9, z), P(x1, BD - 9, z), P(x1, BD, WH), P(x0, BD, WH)], 'k-front', g, 1);
        face([P(x0, 0, z), P(x1, 0, z), P(x1, BD - 9, z), P(x0, BD - 9, z)], 'k-top', g, 1);
        seg(P(x0 + 3, 4, z), P(x0 + 3, BD - 13, z), 'k-gloss', g);
        g.dataset.midi = m + 1; at[m + 1] = { x: cx, y: BD - 25, z, node: g };
      });
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
