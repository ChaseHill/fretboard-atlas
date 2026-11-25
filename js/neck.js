// Isometric guitar neck drawn in SVG. Notes are raised pegs that slide between states.
(() => {
  'use strict';
  const G = (window.G = window.G || {});
  const NS = 'http://www.w3.org/2000/svg';
  const FW = 42, SW = 24, NFRET = 17, HEAD = 34, EDGE = 11, THICK = 15, OX = 170, OY = 44, VW = 800, VH = 545;
  const P = (x, y, z = 0) => [OX + (x - y) * 0.866, OY + (x + y) * 0.5 - z];
  const pts = (arr) => arr.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ');
  const stringY = (i) => (5 - i) * SW; // string 6 (i = 0) sits on the front edge
  const fretX = (f) => (f === 0 ? -22.5 : (f - 0.5) * FW); // an open string's peg stands on the lock block
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };

  G.Neck = function (container) {
    const L = NFRET * FW, y0 = -EDGE, y1 = 5 * SW + EDGE;
    const svg = el('svg', { viewBox: `0 0 ${VW} ${VH}`, role: 'img', 'aria-label': 'Guitar neck' }, container);
    const strs = [], glows = [], labels = [], fretnos = [], pegs = [];
    let byKey = {}, cur = null;

    // floor grid on the ground plane, fading out toward the edges, to give the neck something to sit on
    const defs = el('defs', {}, svg), rg = el('radialGradient', { id: 'floorFade', cx: '50%', cy: '52%', r: '58%' }, defs);
    el('stop', { offset: '35%', 'stop-color': '#fff', 'stop-opacity': 1 }, rg);
    el('stop', { offset: '100%', 'stop-color': '#fff', 'stop-opacity': 0 }, rg);
    const mask = el('mask', { id: 'floorMask' }, defs);
    el('rect', { x: 0, y: 0, width: VW, height: VH, fill: 'url(#floorFade)' }, mask);
    const floor = el('g', { class: 'floor', mask: 'url(#floorMask)' }, svg), fz = -THICK, step = FW; // the neck rests on the floor
    for (let v = -22 * step; v <= 30 * step; v += step) {
      const a = P(v, -700, fz), b = P(v, 900, fz), c = P(-700, v, fz), d = P(1500, v, fz);
      el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, floor);
      el('line', { x1: c[0], y1: c[1], x2: d[0], y2: d[1] }, floor);
    }

    // one hard shadow: the footprint slid along x by the height and along y by half of it
    el('polygon', { points: pts([P(-HEAD, y0, fz), P(L, y0, fz), P(L + THICK, y0 + THICK / 2, fz), P(L + THICK, y1 + THICK / 2, fz), P(-HEAD + THICK, y1 + THICK / 2, fz), P(-HEAD, y1, fz)]), fill: '#000', opacity: '.16' }, svg);
    const MAT = G.Peg.mat, sh = G.Peg.shade, FB = 4; // a 4-unit fretboard on a roasted-maple neck
    const face = (p, fill, sw = 1.5) => el('polygon', { points: pts(p), fill, stroke: 'var(--ink)', 'stroke-width': sw, 'stroke-linejoin': 'round' }, svg);
    const box = (x0, x1, ya, yb, zb, zt, top, side, sw = 1) => { face([P(x0, yb, zt), P(x1, yb, zt), P(x1, yb, zb), P(x0, yb, zb)], sh(side, 0.18), sw); face([P(x1, ya, zt), P(x1, yb, zt), P(x1, yb, zb), P(x1, ya, zb)], sh(side, 0.5), sw); face([P(x0, ya, zt), P(x1, ya, zt), P(x1, yb, zt), P(x0, yb, zt)], top, sw); };
    face([P(-HEAD, y1), P(L, y1), P(L, y1, -THICK), P(-HEAD, y1, -THICK)], sh(MAT.roast, 0.18));
    el('polygon', { points: pts([P(-HEAD, y1, -THICK + 4), P(L, y1, -THICK + 4), P(L, y1, -THICK), P(-HEAD, y1, -THICK)]), fill: sh(MAT.roast, 0.36) }, svg); // the underside turning away
    face([P(L, y0), P(L, y1), P(L, y1, -THICK), P(L, y0, -THICK)], sh(MAT.roast, 0.5));
    face([P(0, y1), P(L, y1), P(L, y1, -FB), P(0, y1, -FB)], sh(MAT.boardHi, 0.1), 1);
    face([P(L, y0), P(L, y1), P(L, y1, -FB), P(L, y0, -FB)], sh(MAT.board, 0.5), 1);
    el('polyline', { points: pts([P(-HEAD, y1, -THICK), P(L, y1, -THICK), P(L, y0, -THICK)]), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);
    for (let f = 1; f <= NFRET; f++) { const a = P(f * FW, y1, 0.3), b = P(f * FW, y1, -FB + 0.6); el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: 'var(--fret)', 'stroke-width': 2, 'stroke-linecap': 'round' }, svg); } // fret ends
    const lg = el('linearGradient', { id: 'woodGrad', x1: '0', y1: '0', x2: '1', y2: '1' }, defs);
    [['0', MAT.boardHi], ['.55', MAT.board], ['1', MAT.boardLo]].forEach(([o, c]) => el('stop', { offset: o, style: 'stop-color:' + c }, lg));
    face([P(-HEAD, y0), P(0, y0), P(0, y1), P(-HEAD, y1)], sh(MAT.roast, 0.04)); // head: neck wood
    face([P(0, y0), P(L, y0), P(L, y1), P(0, y1)], 'url(#woodGrad)');
    // wood grain: long, slightly wandering lines, dark and light
    for (let k = 0; k < 13; k++) {
      const gy = y0 + 4 + k * ((y1 - y0 - 8) / 12), w = ((k * 37) % 7) - 3, a = P(3, gy, 0.1), m = P(L * (0.3 + (k % 4) * 0.12), gy + w * 0.6, 0.1), b = P(L - 3, gy + w * 0.25, 0.1);
      el('polyline', { points: pts([a, m, b]), class: k % 3 === 1 ? 'grain light' : 'grain' }, svg);
    }
    // side dots on the front face, where a player actually looks to find a fret
    [3, 5, 7, 9, 12, 15, 17].forEach((f) => (f === 12 ? [-5, 5] : [0]).forEach((dx) => { const [cx, cy] = P((f - 0.5) * FW + dx, y1, -FB / 2); el('ellipse', { cx, cy, rx: 1.4, ry: 1.3, class: 'side-dot' }, svg); }));
    const win = el('polygon', { class: 'window', points: '' }, svg);
    [3, 5, 7, 9, 12, 15, 17].forEach((f) => (f === 12 ? [SW * 1.5, SW * 3.5] : [SW * 2.5]).forEach((y) => {
      const [cx, cy] = P((f - 0.5) * FW, y);
      el('ellipse', { cx, cy, rx: 8, ry: 4.6, class: 'inlay' }, svg);
      el('ellipse', { cx: cx - 1.6, cy: cy - 1, rx: 3.6, ry: 1.7, class: 'inlay-shine' }, svg);
    }));
    for (let f = 1; f <= NFRET; f++) {
      const a = P(f * FW, y0), b = P(f * FW, y1);
      el('line', { x1: a[0] + 1, y1: a[1] + 1.2, x2: b[0] + 1, y2: b[1] + 1.2, class: 'fret-shadow' }, svg);
      el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#1c1014', 'stroke-width': 3.6, 'stroke-linecap': 'round', opacity: '.55' }, svg); // ink keyline under the wire
      el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: 'var(--fret)', 'stroke-width': 2.3, 'stroke-linecap': 'round' }, svg);
      el('line', { x1: a[0] - 0.6, y1: a[1] - 0.5, x2: b[0] - 0.6, y2: b[1] - 0.5, class: 'fret-shine' }, svg);
      const [x, y] = P((f - 0.5) * FW, y1 + 38, -THICK); // clear of the slab's shadow, so the number sits on plain floor
      fretnos[f] = el('text', { class: 'fretno', x, y: y + 4 }, svg);
      fretnos[f].textContent = f;
    }
    { const a = P(0, y0), b = P(0, y1); el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#1c1014', 'stroke-width': 3.6, 'stroke-linecap': 'round', opacity: '.55' }, svg); el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: 'var(--fret)', 'stroke-width': 2.3, 'stroke-linecap': 'round' }, svg); } // zero fret
    box(-9, -2.5, y0, y1, 0, 4, MAT.bone, MAT.bone); // bone nut, 4 units tall
    box(-32, -13, y0 + 3, y1 - 3, 0, 7, MAT.hardTop, MAT.hard, 1.5); // string lock block
    const ghosts = el('g', {}, svg);
    for (let i = 5; i >= 0; i--) {
      const a = P(-6, stringY(i), 4.2), b = P(L, stringY(i), 2.5), sw = 1.1 + (5 - i) * 0.36, at = { x1: a[0], y1: a[1], x2: b[0], y2: b[1] };
      { const h = P(-22.5, stringY(i), 7.4); el('line', { class: i < 3 ? 'str wound' : 'str', x1: h[0], y1: h[1], x2: a[0], y2: a[1], 'stroke-width': sw, 'stroke-linecap': 'round' }, svg); el('ellipse', { cx: h[0], cy: h[1], rx: 3.2, ry: 1.85, fill: MAT.nickel, stroke: 'var(--ink)', 'stroke-width': 0.75 }, svg); } // from its lock screw to the nut
      el('line', { class: 'str-shadow', x1: a[0] + 1.2, y1: a[1] + 2.6, x2: b[0] + 1.2, y2: b[1] + 2.6, 'stroke-width': 1 + (5 - i) * 0.32 }, svg);
      glows[i] = el('line', Object.assign({ class: 'str-glow', 'stroke-width': sw + 3.4, 'stroke-linecap': 'round' }, at), svg); // a flat halo, shown while the string carries a note
      strs[i] = el('line', Object.assign({ class: i < 3 ? 'str wound' : 'str', 'stroke-width': sw, 'stroke-linecap': 'round' }, at), svg);
      if (i < 3) el('line', Object.assign({ class: 'wind', 'stroke-width': sw }, at), svg); // winding on the bass strings
      el('line', { class: 'str-shine', x1: a[0], y1: a[1] - sw * 0.3, x2: b[0], y2: b[1] - sw * 0.3, 'stroke-width': Math.max(0.4, sw * 0.26) }, svg); // the light along the top of the string
      const [lx, ly] = P(-HEAD - 16, stringY(i), 0);
      labels[i] = el('text', { class: 'nlabel', x: lx, y: ly + 4 }, svg);
    }
    // capo: a padded bar across the strings with a clamp over the front edge; it slides along the neck
    const capoG = el('g', { class: 'capo off' }, svg), CX0 = -11, CX1 = -2, CZ = 11, cy0 = y0 - 3, cy1 = y1 + 3;
    const cface = (p, cls) => el('polygon', { points: pts(p), class: cls, stroke: 'var(--ink)', 'stroke-width': 1.4, 'stroke-linejoin': 'round' }, capoG);
    cface([P(CX0, cy1 + 7, CZ), P(CX1, cy1 + 7, CZ), P(CX1, cy1 + 7, -THICK - 3), P(CX0, cy1 + 7, -THICK - 3)], 'capo-side');
    cface([P(CX1, cy1, CZ), P(CX1, cy1 + 7, CZ), P(CX1, cy1 + 7, -THICK - 3), P(CX1, cy1, -THICK - 3)], 'capo-end');
    cface([P(CX1, cy0, CZ), P(CX1, cy1 + 7, CZ), P(CX1, cy1 + 7, 2.5), P(CX1, cy0, 2.5)], 'capo-end');
    cface([P(CX0, cy0, CZ), P(CX1, cy0, CZ), P(CX1, cy1 + 7, CZ), P(CX0, cy1 + 7, CZ)], 'capo-top');
    const pegLayer = el('g', {}, svg);
    let capoAt = 0;

    const makePeg = () => G.Peg.make(pegLayer);

    // clicking the neck reports the string and fret (used by the fretboard exercises)
    let pick = null;
    svg.addEventListener('click', (e) => {
      if (!pick) return;
      const peg = e.target.closest && e.target.closest('.peg');
      if (peg && !peg.classList.contains('off')) return pick(+peg.dataset.s, +peg.dataset.f);
      const m = svg.getScreenCTM();
      if (!m) return;
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
      const u = (p.x - OX) / 0.866, w = (p.y - OY + 2.5) / 0.5, x = (u + w) / 2, y = (w - u) / 2;
      const s = Math.round(5 - y / SW), f = x < 0 ? 0 : Math.ceil(x / FW);
      if (s >= 0 && s <= 5 && x > -HEAD && f <= NFRET && Math.abs(5 - y / SW - s) < 0.5) pick(s, f);
    });
    const api = {
      setPick(fn) { pick = fn; svg.classList.toggle('pickable', !!fn); },
      // notes: [{s: 0..5 (string 6→1), f, label, role, dim}], window: [lo, hi] frets, mute: mark unused strings ×, ghosts: [{s, f, label}]
      show({ notes = [], window: w = null, mute = false, ghosts: gh = [], capo = 0 } = {}) {
        capoAt = capo;
        capoG.classList.toggle('off', !capo);
        const cdx = (capo ? capo : -1.6) * FW;
        capoG.style.transform = `translate(${(cdx * 0.866).toFixed(1)}px, ${(cdx * 0.5).toFixed(1)}px)`;
        const sorted = notes.slice().sort((a, b) => (fretX(a.f) + stringY(a.s)) - (fretX(b.f) + stringY(b.s)));
        while (pegs.length < sorted.length) pegs.push(makePeg());
        byKey = {}; cur = null;
        pegs.forEach((g, i) => {
          const n = sorted[i];
          g.classList.remove('cur', 'ring');
          g.classList.toggle('off', !n);
          if (!n) return;
          const onCapo = capo && n.f === capo; // a string left open rings from the capo
          const [x, y] = onCapo ? P(capo * FW - 6.5, stringY(n.s), 11) : P(fretX(n.f), stringY(n.s), n.f === 0 ? 7 : 2.5);
          g.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
          G.Peg.set(g, n);
          byKey[n.s + ':' + n.f] = g; g.dataset.s = n.s; g.dataset.f = n.f;
        });
        const used = new Set(notes.map((n) => n.s));
        for (let i = 0; i < 6; i++) {
          const on = used.has(i) || !mute;
          strs[i].classList.toggle('on', used.has(i)); glows[i].classList.toggle('on', used.has(i));
          labels[i].classList.toggle('on', on);
          labels[i].textContent = on ? G.T.OPEN[i] : '×';
        }
        if (w) win.setAttribute('points', pts([P((Math.max(w[0], 1) - 1) * FW, y0, 0.5), P(w[1] * FW, y0, 0.5), P(w[1] * FW, y1, 0.5), P((Math.max(w[0], 1) - 1) * FW, y1, 0.5)]));
        win.style.opacity = w ? '' : '0';
        for (let f = 1; f <= NFRET; f++) fretnos[f].classList.toggle('on', !!w && f >= w[0] && f <= w[1]);
        ghosts.replaceChildren();
        gh.forEach((n) => {
          const [cx, cy] = P(fretX(n.f), stringY(n.s), 0.6);
          el('ellipse', { class: 'ghost-root', cx, cy, rx: 11.6, ry: 6.7 }, ghosts);
          el('text', { class: 'ghost-root-t', x: cx, y: cy + 2.8 }, ghosts).textContent = n.label || 'R';
        });
        // on narrow screens the neck scrolls sideways: keep the action in view
        const sc = container.closest('.instruments') || container;
        if (container.getClientRects().length && sc.scrollWidth > sc.clientWidth + 4 && notes.length) { // not while the neck is hidden behind the keyboard
          const fs = notes.map((n) => n.f), mid = P(((Math.min(...fs) + Math.max(...fs)) / 2 - 0.5) * FW, 2.5 * SW)[0] / VW * sc.scrollWidth;
          // on a phone the instrument sits in a short window, so follow the notes down the neck as well as along it
          const midY = P(((Math.min(...fs) + Math.max(...fs)) / 2 - 0.5) * FW, 2.5 * SW)[1] / VH * svg.getBoundingClientRect().height;
          sc.scrollTo({ left: mid - sc.clientWidth / 2, top: midY - sc.clientHeight / 2, behavior: 'smooth' });
        }
      },
      // flash a note and its string (when it sounds)
      pulse(s, f) {
        const g = byKey[s + ':' + f];
        if (!g) { const [cx, cy] = P(fretX(f), stringY(s), 2.5), r = el('ellipse', { class: 'tap', cx, cy, rx: 12, ry: 8 }, svg); setTimeout(() => r.remove(), 450); }
        [[strs[s], 'pluck'], [g, 'ring']].forEach(([node, cls]) => { if (!node) return; node.classList.remove(cls); void node.getBoundingClientRect(); node.classList.add(cls); });
      },
      // mark the note being played in a drill
      setActive(s, f) {
        if (cur) cur.classList.remove('cur');
        cur = s == null ? null : byKey[s + ':' + f];
        if (cur) cur.classList.add('cur');
        if (s != null) api.pulse(s, f);
      },
    };
    return api;
  };
})();
