// Isometric keyboard drawn in SVG, in the same projection and peg language as the neck: a slim cream controller,
// modelled on the owner's reference, with a touch strip, pads, a small display, three knobs and buttons behind the keys.
// It shows a three-octave window of the 73-key range, large enough to read, and slides to wherever the notes are.
(() => {
  'use strict';
  const G = (window.G = window.G || {});
  const NS = 'http://www.w3.org/2000/svg';
  const WW = 32, KD = 114, BW = 18, BD = 70, WH = 9, BH = 10, NW = 22, THICK = 14, OX = 128, OY = 82, VW = 800, VH = 561, DEP = 4; // DEP: how far a held key sinks
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
    const X0 = -16, X1 = L + 16, YB = -66, YF = KD + 13, BT = WH + 2, LIP = 3; // body top stands just proud of the white keys; the front lip sits low so the key fronts show
    const CREAM = '#efe9dc', sh = G.Peg.shade;
    const quad = (p, fill, parent = svg, sw = 1.2) => el('polygon', { points: pts(p), fill, stroke: 'var(--ink)', 'stroke-width': sw, 'stroke-linejoin': 'round' }, parent);
    // body: one slab with rounded corners. Its outline, walked right side -> front -> left -> back.
    const RC = 11, ring = [];
    [[X1 - RC, YF - RC, 0], [X0 + RC, YF - RC, 90], [X0 + RC, YB + RC, 180], [X1 - RC, YB + RC, 270]].forEach(([cx, cy, a0]) => { for (let k = 0; k <= 6; k++) { const a = (a0 + k * 15) * Math.PI / 180; ring.push([cx + RC * Math.cos(a), cy + RC * Math.sin(a)]); } });
    el('polygon', { points: pts(ring.map(([x, y]) => P(x + 20, y + 10, fz))), fill: '#000', opacity: '.15' }, svg); // one hard shadow, lower right
    lin('kBody', '0', '0', '1', '1', [['0', '#f7f2e8'], ['.55', '#efe9dc'], ['1', '#e6dfcf']]);
    { // walls that face the viewer, shaded round the corners, then one ink line along the foot and at each end
      const N = ring.length, vis = [];
      for (let i = 0; i < N; i++) { const p = ring[i], q = ring[(i + 1) % N], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, nx = dy / l, ny = -dx / l; vis.push(nx + ny > 0.02 ? nx : null); }
      let st = 0; while (!(vis[st] !== null && vis[(st + N - 1) % N] === null)) st++;
      const foot = [];
      for (let k = 0; k < N && vis[(st + k) % N] !== null; k++) { const i = (st + k) % N, p = ring[i], q = ring[(i + 1) % N], c = sh(CREAM, 0.1 + 0.17 * Math.max(0, vis[i]));
        el('polygon', { points: pts([P(p[0], p[1], BT), P(q[0], q[1], BT), P(q[0], q[1], fz), P(p[0], p[1], fz)]), fill: c, stroke: c, 'stroke-width': 0.7 }, svg);
        if (!k) foot.push(p); foot.push(q); }
      const a = foot[0], b = foot[foot.length - 1];
      el('polyline', { points: pts([P(a[0], a[1], BT)].concat(foot.map(([x, y]) => P(x, y, fz)), [P(b[0], b[1], BT)])), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.4, 'stroke-linejoin': 'round' }, svg);
      el('polyline', { points: pts(foot.map(([x, y]) => P(x, y, fz + 4))), fill: 'none', stroke: '#000', 'stroke-width': 1, opacity: '.1' }, svg); // seam where the base plate meets the shell
    }
    el('polygon', { points: pts(ring.map(([x, y]) => P(x, y, BT))), fill: 'url(#kBody)', stroke: 'var(--ink)', 'stroke-width': 1.4, 'stroke-linejoin': 'round' }, svg);
    el('polyline', { points: pts(ring.slice(8, 22).map(([x, y]) => P(x + (x < 0 ? 3 : 0), y + (y < YB + 4 ? 3 : 0), BT))), fill: 'none', stroke: '#fff', 'stroke-width': 1.3, opacity: '.7', 'stroke-linecap': 'round' }, svg); // light catching the far edges
    quad([P(0, -1, BT), P(L, -1, BT), P(L, -1, 0), P(0, -1, 0)], sh(CREAM, 0.3), svg, 1); // back wall of the recess
    quad([P(0, -1, BT), P(0, KD + 1, BT), P(0, KD + 1, 0), P(0, -1, 0)], sh(CREAM, 0.36), svg, 1); // its left wall
    // control strip behind the keys, left to right as on the reference
    const flat = (x0, x1, y0, y1, z, fill, sw = 0.9) => quad([P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z)], fill, svg, sw);
    const block = (x0, x1, y0, y1, h, top) => { quad([P(x0, y1, BT + h), P(x1, y1, BT + h), P(x1, y1, BT), P(x0, y1, BT)], sh(top, 0.16), svg, 0.9); quad([P(x1, y0, BT + h), P(x1, y1, BT + h), P(x1, y1, BT), P(x1, y0, BT)], sh(top, 0.3), svg, 0.9); flat(x0, x1, y0, y1, BT + h, top); };
    const ln = (a, b, stroke, w, op) => el('line', { x1: a[0].toFixed(1), y1: a[1].toFixed(1), x2: b[0].toFixed(1), y2: b[1].toFixed(1), stroke, 'stroke-width': w, opacity: op, 'stroke-linecap': 'round' }, svg);
    const cyl = (x, y, r, z0, z1, side, top) => { const a = P(x, y, z0), b = P(x, y, z1), rx = r * 1.2247, ry = r * 0.7071;
      el('path', { d: `M${(a[0] - rx).toFixed(1)} ${b[1].toFixed(1)} L${(a[0] - rx).toFixed(1)} ${a[1].toFixed(1)} A${rx.toFixed(1)} ${ry.toFixed(1)} 0 0 0 ${(a[0] + rx).toFixed(1)} ${a[1].toFixed(1)} L${(a[0] + rx).toFixed(1)} ${b[1].toFixed(1)} Z`, fill: side, stroke: 'var(--ink)', 'stroke-width': 0.9 }, svg);
      el('ellipse', { cx: b[0].toFixed(1), cy: b[1].toFixed(1), rx: rx.toFixed(1), ry: ry.toFixed(1), fill: top, stroke: 'var(--ink)', 'stroke-width': 0.9 }, svg); };
    // a button: a dark well in the panel, the cap standing in it, and light along the cap's far edge
    const pad = (x0, x1, y0, y1, top) => { flat(x0 - 1.6, x1 + 1.6, y0 - 1.6, y1 + 1.6, BT, sh(CREAM, 0.34), 0.6); block(x0, x1, y0, y1, 2.2, top); ln(P(x0 + 2, y0 + 2, BT + 2.2), P(x1 - 2, y0 + 2, BT + 2.2), '#fff', 1, '.6'); };
    // touch strip: a shallow recess with its shadow under the back and left edges, and a centre mark
    flat(12, 140, -56, -14, BT, sh(CREAM, 0.3), 0.8); flat(15, 140, -53, -14, BT, '#faf7f0', 0.5);
    ln(P(76, -47, BT), P(76, -20, BT), '#000', 1, '.13'); ln(P(22, -17.5, BT), P(132, -17.5, BT), '#fff', 1.2, '.8');
    pad(158, 176, -54, -40, '#c4c0b8'); pad(182, 200, -54, -40, '#c4c0b8'); pad(184, 200, -32, -18, '#c4c0b8');
    // small display: bezel, lit screen, two lines of readout
    flat(156, 178, -33, -17, BT, '#1d2150', 0.9); flat(158.5, 175.5, -30.5, -19.5, BT, '#4f86ea', 0.4);
    ln(P(161, -27.5, BT), P(171, -27.5, BT), '#dbe8ff', 1.3, '.95'); ln(P(161, -23, BT), P(167, -23, BT), '#dbe8ff', 1.3, '.8');
    [238, 290, 342].forEach((x, i) => { // three knobs: a printed scale, a skirt, a ribbed barrel and a cap with a pale pointer
      const y = -34, z = BT;
      for (let k = 0; k <= 8; k++) { const a = (135 + k * 33.75) * Math.PI / 180, p = P(x + 15.5 * Math.cos(a), y + 15.5 * Math.sin(a), z); el('circle', { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: k % 4 ? 0.7 : 1.1, fill: '#3a332c', opacity: '.6' }, svg); }
      cyl(x, y, 11.5, z, z + 2.2, '#0e0e11', '#24242a'); cyl(x, y, 9.4, z + 2.2, z + 14, '#17171b', '#2b2b32');
      const a = P(x, y, z + 2.2), b = P(x, y, z + 14), rx = 9.4 * 1.2247;
      [-0.62, -0.3, 0.1, 0.5].forEach((t, j) => ln([a[0] + rx * t, b[1] + 4.6], [a[0] + rx * t, a[1] + 4.2], j ? '#000' : '#fff', j ? 0.8 : 2, j ? '.35' : '.16'));
      cyl(x, y, 6.6, z + 14, z + 14.6, '#2b2b32', '#3d3d47');
      const ang = (200 + i * 55) * Math.PI / 180, p0 = P(x + 2 * Math.cos(ang), y + 2 * Math.sin(ang), z + 14.6), p1 = P(x + 8.2 * Math.cos(ang), y + 8.2 * Math.sin(ang), z + 14.2); ln(p0, p1, '#f1ece0', 1.8, '1');
    });
    [392, 418, 462, 488].forEach((x) => pad(x, x + 20, -42, -26, '#f8f4ec')); // four buttons, in two pairs
    { const o = P(566, -27, BT), t = el('text', { transform: `matrix(0.866 0.5 -0.866 0.5 ${o[0].toFixed(1)} ${o[1].toFixed(1)})`, class: 'kb-print' }, svg); t.textContent = 'ATLAS 37'; }
    el('polygon', { points: pts([P(0, 0, WH), P(L, 0, WH), P(L, KD, WH), P(0, KD, WH)]), class: 'kb-well' }, svg); // the dark of the key bed, seen beside a key that is held down
    const keyLayer = el('g', {}, svg), frontLayer = el('g', {}, svg), labelLayer = el('g', {}, svg), pegLayer = el('g', {}, svg);
    // the low front lip, and the inside faces of the cheeks that stand above it
    quad([P(0, YF, LIP), P(L, YF, LIP), P(L, YF, fz), P(0, YF, fz)], sh(CREAM, 0.1), frontLayer);
    quad([P(0, KD + 1, LIP), P(L, KD + 1, LIP), P(L, YF, LIP), P(0, YF, LIP)], CREAM, frontLayer);
    quad([P(0, KD + 1, BT), P(0, YF, BT), P(0, YF, LIP), P(0, KD + 1, LIP)], sh(CREAM, 0.36), frontLayer, 1);
    quad([P(L - 190, YF, -4), P(L - 30, YF, -4), P(L - 30, YF, -10), P(L - 190, YF, -10)], sh(CREAM, 0.42), frontLayer, 0.8);
    { const a = P(L - 188, YF, -4.8), b = P(L - 32, YF, -4.8); el('line', { x1: a[0].toFixed(1), y1: a[1].toFixed(1), x2: b[0].toFixed(1), y2: b[1].toFixed(1), stroke: '#000', 'stroke-width': 1.4, opacity: '.22' }, frontLayer); }

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
