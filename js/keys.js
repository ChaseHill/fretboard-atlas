// Isometric Rhodes keyboard drawn in SVG, in the same projection and peg language as the neck.
// It shows a three-octave window of the 73-key range, large enough to read, and slides to wherever the notes are.
(() => {
  'use strict';
  const G = (window.G = window.G || {});
  const NS = 'http://www.w3.org/2000/svg';
  const WW = 32, KD = 114, BW = 18, BD = 70, WH = 9, BH = 10, NW = 22, THICK = 14, OX = 128, OY = 66, VW = 800, VH = 545;
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
    const svg = el('svg', { viewBox: `0 0 ${VW} ${VH}`, role: 'img', 'aria-label': 'Rhodes keyboard' }, container);
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
    const X0 = -14, X1 = L + 14, YB = -50, YF = KD + 8, LID = 32;
    el('polygon', { points: pts([P(X0, YB, fz), P(X1, YB, fz), P(X1 + THICK, YB + THICK / 2, fz), P(X1 + THICK, YF + THICK / 2, fz), P(X0 + THICK, YF + THICK / 2, fz), P(X0, YF, fz)]), fill: '#000', opacity: '.16' }, svg); // one hard shadow, lower right
    // case: the tolex box the keys sit in, with chrome corner caps
    face([P(X0, YF), P(X1, YF), P(X1, YF, -THICK), P(X0, YF, -THICK)], 'kb-case-side');
    face([P(X1, YB), P(X1, YF), P(X1, YF, -THICK), P(X1, YB, -THICK)], 'kb-case-end');
    face([P(X0, YB), P(X1, YB), P(X1, YF), P(X0, YF)], 'kb-case');
    [[X0, X0 + 9], [X1 - 9, X1]].forEach(([a, b]) => face([P(a, YF, 0), P(b, YF, 0), P(b, YF, -THICK), P(a, YF, -THICK)], 'kb-chrome'));
    // harp cover behind the keys: a black lid, and the silver name rail facing the player
    face([P(X1, YB, LID), P(X1, -3, LID), P(X1, -3), P(X1, YB)], 'kb-case-end');
    face([P(X0, -3, LID), P(X1, -3, LID), P(X1, -3), P(X0, -3)], 'kb-rail');
    face([P(X0, YB, LID), P(X1, YB, LID), P(X1, -3, LID), P(X0, -3, LID)], 'kb-lid');
    seg(P(X0 + 2, -5, LID), P(X1 - 2, -5, LID), 'kb-lid-edge');
    // ribbed aluminium rail, with one control plate: name, input jack, two knobs with dotted scales
    for (let z = 3; z <= LID - 3; z += 2.6) { seg(P(X0 + 1.5, -3, z - 0.9), P(X1 - 1.5, -3, z - 0.9), 'kb-rail-lo'); seg(P(X0 + 1.5, -3, z), P(X1 - 1.5, -3, z), 'kb-rail-hi'); }
    const XP = 24, ZP = 4, PH = LID - 8, po = P(XP, -3, ZP), plate = el('g', { class: 'kb-plate', transform: `matrix(0.866 0.5 0 1 ${po[0].toFixed(1)} ${po[1].toFixed(1)})` }, svg); // sheared onto the rail's face
    el('rect', { x: 0, y: -PH, width: 250, height: PH, rx: 3, class: 'kb-plate-bg' }, plate);
    const ptext = (x, y, t, cls) => { el('text', { x, y, class: cls }, plate).textContent = t; };
    ptext(12, -11.5, 'ATLAS', 'kb-name'); ptext(12.5, -5, 'STAGE 73', 'kb-sub');
    el('circle', { cx: 96, cy: -14, r: 3.8, class: 'kb-jack' }, plate); el('circle', { cx: 96, cy: -14, r: 1.9, class: 'kb-jack-hole' }, plate); ptext(96, -3.4, 'INPUT', 'kb-lab');
    [[152, 'BASS BOOST'], [208, 'VOLUME']].forEach(([u, t]) => {
      for (let k = 0; k <= 10; k++) { const a = (135 + k * 27) * Math.PI / 180; el('circle', { cx: (u + 9.4 * Math.cos(a)).toFixed(1), cy: (-14 + 9.4 * Math.sin(a)).toFixed(1), r: 0.55, class: 'kb-tick' }, plate); }
      el('circle', { cx: u, cy: -14, r: 7.2, class: 'kb-skirt' }, plate); ptext(u, -3.4, t, 'kb-lab');
    });
    [152, 208].forEach((u) => { for (let d = 0; d <= 6; d += 1.5) { const p = P(XP + u, -3 + d, ZP + 14); el('circle', { r: 4.8, transform: `matrix(0.866 0.5 0 1 ${p[0].toFixed(1)} ${p[1].toFixed(1)})`, class: d >= 6 ? 'kb-knob-top' : d ? 'kb-knob in' : 'kb-knob' }, svg); } }); // knobs stand out from the plate
    seg(P(0, -1.5, WH + 0.8), P(L, -1.5, WH + 0.8), 'kb-felt');
    // walnut cheek blocks and a key slip: the keys sit inside the instrument
    const MAT = G.Peg.mat, sh = G.Peg.shade, CH = WH + 3;
    const solid = (parent, x0, x1, ya, yb, zb, zt, top, sw = 1.4) => { const f = (p, fill) => el('polygon', { points: pts(p), fill, stroke: 'var(--ink)', 'stroke-width': sw, 'stroke-linejoin': 'round' }, parent); f([P(x0, yb, zt), P(x1, yb, zt), P(x1, yb, zb), P(x0, yb, zb)], sh(top, 0.18)); f([P(x1, ya, zt), P(x1, yb, zt), P(x1, yb, zb), P(x1, ya, zb)], sh(top, 0.5)); f([P(x0, ya, zt), P(x1, ya, zt), P(x1, yb, zt), P(x0, yb, zt)], top); };
    solid(svg, X0 + 3, 0, -3, KD + 1, 0, CH, MAT.walnut);
    const keyLayer = el('g', {}, svg), frontLayer = el('g', {}, svg), labelLayer = el('g', {}, svg), pegLayer = el('g', {}, svg);
    solid(frontLayer, L, X1 - 3, -3, KD + 1, 0, CH, MAT.walnut);
    solid(frontLayer, 0, L, KD + 1, YF, 0, 5, MAT.tolex, 1);

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
        if (i === NW - 1) face([P(x1, 0, WH), P(x1, KD, WH), P(x1, KD), P(x1, 0)], 'k-front', g, 1);
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
        const [x, y] = P(n.at.x, n.at.y, n.at.z);
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
