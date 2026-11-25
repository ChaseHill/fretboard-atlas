// One peg: the note marker shared by the neck and the keyboard.
// Every dimension lives in G.Peg.cfg, so the app and the design system's peg lab draw exactly the same thing.
(() => {
  'use strict';
  const G = (window.G = window.G || {});
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  // rx, ry: cap half-width and half-height. h: body height. inset: how far the inner ring sits inside the cap (0 = none).
  // font: label size for one or two characters. style: 'solid' (label on the role colour) or 'plate' (dark label on a light plate).
  // widen: grow the peg for labels of three or more characters instead of shrinking the label.
  const cfg = { rx: 14, ry: 8.1, h: 7, inset: 0, font: 13.5, style: 'solid', widen: false }; // draft two: a true isometric cylinder (ry = rx × 0.577)
  // Materials of the solid world. Front and end faces are worked out from these by shade(), so no drawing carries its own hex.
  const mat = { roast: '#c9995e', board: '#2f2723', boardHi: '#42362f', boardLo: '#221b18', bone: '#f1e7d0', hard: '#2c2c33', hardTop: '#4a4a55', nickel: '#cfc6b8', walnut: '#7a4f33', tolex: '#2c2c33' };
  // One light, upper left: a front face (+y) is the material darkened 18%, an end face (+x) 50%.
  const shade = (hex, t) => '#' + [1, 3, 5].map((i, k) => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - [0.92, 1, 1.06][k] * t)))).toString(16).padStart(2, '0')).join('');

  function shape(g, extra) {
    const p = g._peg, rx = cfg.rx + extra, ry = cfg.ry, h = cfg.h;
    const body = `M${-rx},${-h} V0 A${rx},${ry} 0 0 0 ${rx},0 V${-h} Z`;
    p.shadow.setAttribute('rx', rx); p.shadow.setAttribute('ry', ry); p.shadow.setAttribute('cx', (0.433 * h).toFixed(1)); p.shadow.setAttribute('cy', (0.75 * h).toFixed(1)); // a hard shadow, slid lower right
    const arc = (x0) => `M${x0.toFixed(2)},${-h} V${(ry * Math.sqrt(Math.max(0, 1 - (x0 / rx) * (x0 / rx)))).toFixed(2)} A${rx},${ry} 0 0 0 ${rx},0 V${-h} Z`;
    p.f1.setAttribute('d', arc(-rx * 0.3)); p.f2.setAttribute('d', arc(rx * 0.42)); // the body turns away from the light in two steps
    const la = rx - 2.6, lb = ry - 2, pt = (d) => `${(la * Math.cos(d * Math.PI / 180)).toFixed(2)},${(-h + lb * Math.sin(d * Math.PI / 180)).toFixed(2)}`;
    p.lip.setAttribute('d', `M${pt(196)} A${la.toFixed(2)},${lb.toFixed(2)} 0 0 1 ${pt(284)}`);
    p.side.setAttribute('d', body); p.shade.setAttribute('d', body);
    p.top.setAttribute('cy', -h); p.top.setAttribute('rx', rx); p.top.setAttribute('ry', ry);
    const on = cfg.inset > 0;
    p.cap.setAttribute('cy', -h); p.cap.setAttribute('rx', on ? Math.max(rx - cfg.inset, 0) : 0); p.cap.setAttribute('ry', on ? Math.max(ry - cfg.inset * 0.73, 0) : 0);
  }

  G.Peg = {
    cfg, mat, shade,
    make(layer) {
      const g = el('g', { class: 'peg off' }, layer), p = (g._peg = {});
      p.shadow = el('ellipse', { cx: 3, cy: 5, fill: '#000', opacity: '.3' }, g);
      const lift = el('g', { class: 'lift' }, g);
      p.side = el('path', { class: 'side', stroke: 'var(--ink)', 'stroke-width': 1.4, 'stroke-linejoin': 'round' }, lift);
      p.shade = el('path', { class: 'side-shade' }, lift);
      p.f1 = el('path', { fill: '#000', opacity: '.14', 'pointer-events': 'none' }, lift);
      p.f2 = el('path', { fill: '#000', opacity: '.2', 'pointer-events': 'none' }, lift);
      p.top = el('ellipse', { cx: 0, class: 'top', stroke: 'var(--ink)', 'stroke-width': 1.5 }, lift);
      p.cap = el('ellipse', { cx: 0, class: 'cap' }, lift);
      p.lip = el('path', { fill: 'none', stroke: '#fff', 'stroke-width': 1, 'stroke-linecap': 'round', opacity: '.55', 'pointer-events': 'none' }, lift);
      p.accEdge = el('path', { class: 'acc-edge' }, lift);
      p.text = el('text', { x: 0 }, lift);
      p.acc = el('path', { class: 'acc' }, lift);
      shape(g, 0);
      return g;
    },
    // n: {role, label, dim}; extra: more class names (' lh', ' cur' …)
    set(g, n, extra) {
      const lab = String(n.label == null ? '' : n.label), len = Array.from(lab).length, wide = cfg.widen && len > 2;
      g.setAttribute('class', `peg r-${n.role || 'ext'} s-${cfg.style}${n.dim ? ' dim' : ''}${extra || ''}`);
      shape(g, wide ? (len - 2) * 3.4 : 0);
      const size = wide ? cfg.font : len > 3 ? cfg.font * 8 / 13 : len > 2 ? cfg.font * 10 / 13 : cfg.font, t = g._peg.text;
      const by = -cfg.h + size * 0.354, p = g._peg;
      // The font's flat sign is too thin to read at this size (♭7 looks like 67), so flats are drawn here as a heavy stroke.
      const m = /^(♭*)([^♭]*)(♭*)$/.exec(lab), pre = m ? m[1].length : 0, post = m ? m[3].length : 0, k = pre + post;
      let d = '', tx = 0, txt = lab;
      if (k && !(pre && post)) {
        txt = m[2];
        const adv = size * 0.57, slot = size * 0.5, restW = Array.from(txt).length * adv, x0 = -(restW + k * slot) / 2;
        tx = pre ? x0 + k * slot + restW / 2 : x0 + restW / 2;
        for (let i = 0; i < k; i++) {
          const sx = (pre ? x0 : x0 + restW) + i * slot + size * 0.1, f = (n) => n.toFixed(2);
          d += `M${f(sx)},${f(by - size * 0.82)} V${f(by)} C${f(sx + size * 0.4)},${f(by - size * 0.17)} ${f(sx + size * 0.4)},${f(by - size * 0.52)} ${f(sx)},${f(by - size * 0.36)}`;
        }
      }
      const w = size * 0.125;
      p.acc.setAttribute('d', d); p.acc.style.strokeWidth = w.toFixed(2) + 'px';
      p.accEdge.setAttribute('d', d); p.accEdge.style.strokeWidth = `calc(${w.toFixed(2)}px + var(--peg-edge-w, 2.6px))`;
      t.textContent = txt;
      t.setAttribute('x', tx.toFixed(2));
      t.style.fontSize = size.toFixed(1) + 'px';
      t.setAttribute('y', by.toFixed(1));
    },
  };
})();
