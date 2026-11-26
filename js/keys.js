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
    el('polygon', { points: pts([P(X0, YB, fz), P(X1, YB, fz), P(X1 + 20, YB + 10, fz), P(X1 + 20, YF + 10, fz), P(X0 + 20, YF + 10, fz), P(X0, YF, fz)]), fill: '#000', opacity: '.15' }, svg); // one hard shadow, lower right
    // body: one slab with a recess for the keys. End face, the two cheek fronts, then the top as a single U-shaped sheet.
    quad([P(X1, YB, BT), P(X1, YF, BT), P(X1, YF, fz), P(X1, YB, fz)], sh(CREAM, 0.24));
    quad([P(X0, YF, BT), P(0, YF, BT), P(0, YF, fz), P(X0, YF, fz)], sh(CREAM, 0.1));
    quad([P(L, YF, BT), P(X1, YF, BT), P(X1, YF, fz), P(L, YF, fz)], sh(CREAM, 0.1));
    quad([P(X0, YB, BT), P(X1, YB, BT), P(X1, YF, BT), P(L, YF, BT), P(L, -1, BT), P(0, -1, BT), P(0, YF, BT), P(X0, YF, BT)], CREAM, svg, 1.4);
    quad([P(0, -1, BT), P(L, -1, BT), P(L, -1, 0), P(0, -1, 0)], sh(CREAM, 0.3), svg, 1); // back wall of the recess
    quad([P(0, -1, BT), P(0, KD + 1, BT), P(0, KD + 1, 0), P(0, -1, 0)], sh(CREAM, 0.36), svg, 1); // its left wall
    // control strip behind the keys, left to right as on the reference
    const flat = (x0, x1, y0, y1, z, fill, sw = 0.9) => quad([P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z)], fill, svg, sw);
    const block = (x0, x1, y0, y1, h, top) => { quad([P(x0, y1, BT + h), P(x1, y1, BT + h), P(x1, y1, BT), P(x0, y1, BT)], sh(top, 0.16), svg, 0.9); quad([P(x1, y0, BT + h), P(x1, y1, BT + h), P(x1, y1, BT), P(x1, y0, BT)], sh(top, 0.3), svg, 0.9); flat(x0, x1, y0, y1, BT + h, top); };
    flat(12, 138, -54, -14, BT, sh(CREAM, 0.12)); flat(15, 138, -51, -14, BT, '#f8f5ee', 0.7); // touch strip: a shallow recess, lit from the left
    block(158, 176, -54, -40, 1.6, '#bdb9b1'); block(182, 200, -54, -40, 1.6, '#bdb9b1'); // two pads
    flat(158, 178, -32, -18, BT, '#2a2f6e'); flat(160, 176, -30, -20, BT, '#4a7fe0', 0.6); // small display
    block(184, 200, -32, -18, 1.6, '#bdb9b1');
    [238, 290, 342].forEach((x) => { // three knobs: a black cylinder with a pale pointer
      const y = -34, r = 10, h = 13, a = P(x, y, BT), b = P(x, y, BT + h), rx = r * 1.2247, ry = r * 0.7071;
      el('path', { d: `M${(a[0] - rx).toFixed(1)} ${b[1].toFixed(1)} L${(a[0] - rx).toFixed(1)} ${a[1].toFixed(1)} A${rx.toFixed(1)} ${ry.toFixed(1)} 0 0 0 ${(a[0] + rx).toFixed(1)} ${a[1].toFixed(1)} L${(a[0] + rx).toFixed(1)} ${b[1].toFixed(1)} Z`, fill: '#17171b', stroke: 'var(--ink)', 'stroke-width': 1 }, svg);
      el('ellipse', { cx: b[0].toFixed(1), cy: b[1].toFixed(1), rx: rx.toFixed(1), ry: ry.toFixed(1), fill: '#34343c', stroke: 'var(--ink)', 'stroke-width': 1 }, svg);
      const p0 = P(x, y, BT + h), p1 = P(x - 5, y - 6, BT + h); el('line', { x1: p0[0].toFixed(1), y1: p0[1].toFixed(1), x2: p1[0].toFixed(1), y2: p1[1].toFixed(1), stroke: '#e9e4d8', 'stroke-width': 1.6, 'stroke-linecap': 'round' }, svg);
    });
    [392, 418, 462, 488].forEach((x) => block(x, x + 20, -42, -26, 1.6, '#f6f2e9')); // four buttons, in two pairs
    el('polygon', { points: pts([P(0, 0, WH), P(L, 0, WH), P(L, KD, WH), P(0, KD, WH)]), class: 'kb-well' }, svg); // the dark of the key bed, seen beside a key that is held down
    const keyLayer = el('g', {}, svg), frontLayer = el('g', {}, svg), labelLayer = el('g', {}, svg), pegLayer = el('g', {}, svg);
    // the low front lip, and the inside faces of the cheeks that stand above it
    quad([P(0, YF, LIP), P(L, YF, LIP), P(L, YF, fz), P(0, YF, fz)], sh(CREAM, 0.1), frontLayer);
    quad([P(0, KD + 1, LIP), P(L, KD + 1, LIP), P(L, YF, LIP), P(0, YF, LIP)], CREAM, frontLayer);
    quad([P(0, KD + 1, BT), P(0, YF, BT), P(0, YF, LIP), P(0, KD + 1, LIP)], sh(CREAM, 0.36), frontLayer, 1);
    { const a = P(8, YF, -5), b = P(L - 8, YF, -5); el('line', { x1: a[0].toFixed(1), y1: a[1].toFixed(1), x2: b[0].toFixed(1), y2: b[1].toFixed(1), stroke: '#000', 'stroke-width': 1, opacity: '.14' }, frontLayer); } // the groove along the front edge

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
        const [x, y] = P(n.at.x, n.at.y, n.at.z - (n.dim ? 0 : DEP)); // a held key is down, and its peg rides down with it
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
