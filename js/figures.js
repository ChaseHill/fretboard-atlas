// Annotated objects (design system: "Teaching layouts" → Annotated object). One isometric drawing with its parts named.
// Each label sits beside its own part: a bold name, one italic line, and a short 1px leader ending in a dot on the exact
// spot. Eight labels at most. Where there is no room for labels, they become a numbered list and the dots carry numbers.
//
// The guitar obeys the six isometric rules: one projection; the top face is the material itself; side faces are the
// material darkened (front 18%, end 50%, curved sides blending between); a hard shadow lower right; ink outlines in
// three weights (1.5 silhouette, 1 edge, 0.75 detail); labels upright.
(() => {
  'use strict';
  const G = (window.G = window.G || {});
  const MAT = (G.Peg && G.Peg.mat) || { roast: '#c9995e', board: '#2f2723', boardHi: '#42362f', boardLo: '#221b18', bone: '#f1e7d0', nickel: '#cfc6b8', hard: '#2c2c33', hardTop: '#4a4a55' };
  const shade = (G.Peg && G.Peg.shade) || ((hex) => hex);

  // A steel-string acoustic guitar from real measurements, in millimetres. x runs from the tip of the head to the end of
  // the body; y across, 0 on the centre line (+y is the side nearest the viewer); z up from the floor.
  const NUT = 180, SCALE = 650, fretX = (n) => NUT + SCALE * (1 - Math.pow(2, -n / 12));
  const JOIN = fretX(14), END = JOIN + 500, SADDLE = NUT + SCALE, HOLE = fretX(20) + 62;
  const K = 0.55, OX = 196, OY = 4, TOP = 44, NZ = TOP + 6, HZ = NZ - 4;
  const P = (x, y, z = 0) => [OX + (x - y) * 0.866 * K, OY + (x + y + 200) * 0.5 * K - z];
  const f1 = (n) => n.toFixed(1), pt = (x, y, z) => P(x, y, z).map(f1).join(' ');
  const poly = (pts, z) => 'M' + pts.map((p) => pt(p[0], p[1], p[2] == null ? z : p[2])).join(' L') + ' Z';
  const disc = (cx, cy, r, z, cls, extra = '') => { const [x, y] = P(cx, cy, z); return `<ellipse class="${cls}" cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r * 1.2247 * K)}" ry="${f1(r * 0.7071 * K)}"${extra}/>`; };
  const seg = (a, b, cls, extra = '') => { const p = P(a[0], a[1], a[2]), q = P(b[0], b[1], b[2]); return `<line class="${cls}" x1="${f1(p[0])}" y1="${f1(p[1])}" x2="${f1(q[0])}" y2="${f1(q[1])}"${extra}/>`; };

  // The body outline as a ring of points: upper bout 290 wide, waist 240, lower bout 395.
  const HALF = [[[JOIN, -32]], [[JOIN + 4, -112], [JOIN + 44, -145], [JOIN + 104, -145]], [[JOIN + 156, -145], [JOIN + 168, -120], [JOIN + 204, -120]],
    [[JOIN + 250, -120], [JOIN + 262, -197], [JOIN + 348, -197]], [[JOIN + 446, -197], [END, -108], [END, 0]]];
  const ring = (() => {
    const pts = [HALF[0][0]];
    HALF.slice(1).forEach((c) => { const a = pts[pts.length - 1]; for (let t = 1; t <= 12; t++) { const u = t / 12, v = 1 - u; pts.push([v * v * v * a[0] + 3 * v * v * u * c[0][0] + 3 * v * u * u * c[1][0] + u * u * u * c[2][0], v * v * v * a[1] + 3 * v * v * u * c[0][1] + 3 * v * u * u * c[1][1] + u * u * u * c[2][1]]); } });
    return pts.concat(pts.slice(0, -1).reverse().map(([x, y]) => [x, -y])); // mirror for the near side
  })();
  const CX = JOIN + 250;
  const ringPath = (z, k = 1) => 'M' + ring.map(([x, y]) => pt(CX + (x - CX) * k, y * k, z)).join(' L') + ' Z';

  function guitar() {
    let s = '';
    // hard shadow: the footprint slid lower right, flat
    s += `<path class="gx-shadow" d="${ringPath(0)}" transform="translate(${f1(TOP * 0.433)} ${f1(TOP * 0.25)})"/>`;
    // side wall: one panel per outline segment that faces the viewer, shaded by which way it faces
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length];
      let nx = b[1] - a[1], ny = -(b[0] - a[0]);
      if (nx * ((a[0] + b[0]) / 2 - CX) + ny * ((a[1] + b[1]) / 2) < 0) { nx = -nx; ny = -ny; } // make it the outward normal
      if (nx + ny <= 0) continue; // faces away from the viewer
      const t = 0.18 + 0.32 * Math.max(0, nx) / (Math.abs(nx) + Math.abs(ny) || 1), c = shade(MAT.roast, t);
      s += `<path d="${poly([[a[0], a[1], 0], [b[0], b[1], 0], [b[0], b[1], TOP], [a[0], a[1], TOP]])}" fill="${c}" stroke="${c}" stroke-width=".7"/>`;
    }
    s += `<path class="gx-sil" d="${ringPath(0)}"/>`; // where the side meets the floor
    s += `<path class="gx-sil" d="${ringPath(TOP)}" style="fill:${MAT.roast}"/><path class="gx-bind" d="${ringPath(TOP, 0.965)}"/>`;
    // sound hole and rosette, pick guard, bridge, saddle, pins
    s += disc(HOLE, 0, 66, TOP, 'gx-rosette') + disc(HOLE, 0, 50, TOP, 'gx-edge', ` style="fill:${MAT.boardLo}"`);
    s += `<path class="gx-edge" style="fill:${MAT.hardTop}" d="M${pt(HOLE - 34, -58, TOP)} C${pt(HOLE + 30, -62, TOP)} ${pt(HOLE + 100, -92, TOP)} ${pt(HOLE + 108, -136, TOP)} C${pt(HOLE + 62, -150, TOP)} ${pt(HOLE - 12, -124, TOP)} ${pt(HOLE - 34, -58, TOP)} Z"/>`;
    const br = [[SADDLE - 14, -78], [SADDLE + 22, -78], [SADDLE + 22, 78], [SADDLE - 14, 78]];
    s += `<path class="gx-edge" style="fill:${shade(MAT.boardHi, 0.18)}" d="${poly([[br[3][0], br[3][1], TOP], [br[2][0], br[2][1], TOP], [br[2][0], br[2][1], TOP + 4], [br[3][0], br[3][1], TOP + 4]])}"/>`;
    s += `<path class="gx-edge" style="fill:${shade(MAT.boardHi, 0.5)}" d="${poly([[br[1][0], br[1][1], TOP], [br[2][0], br[2][1], TOP], [br[2][0], br[2][1], TOP + 4], [br[1][0], br[1][1], TOP + 4]])}"/>`;
    s += `<path class="gx-edge" style="fill:${MAT.boardHi}" d="${poly(br, TOP + 4)}"/>`;
    s += `<path class="gx-detail" style="fill:${MAT.bone}" d="${poly([[SADDLE - 3, -40], [SADDLE + 2, -40], [SADDLE + 4, 40], [SADDLE - 1, 40]], TOP + 7)}"/>`;
    for (let i = 0; i < 6; i++) s += disc(SADDLE + 13, -27 + i * 10.8, 3.2, TOP + 5, 'gx-detail', ` style="fill:${MAT.bone}"`);
    // neck: its near side, then the fingerboard; 20 frets; inlays at 3, 5, 7, 9, 12 (two), 15, 17
    const hw = (x) => 22.5 + (Math.min(x, JOIN) - NUT) / (JOIN - NUT) * 6, fbEnd = fretX(20) + 6;
    s += `<path class="gx-edge" style="fill:${shade(MAT.roast, 0.18)}" d="${poly([[NUT, 22.5, NZ], [JOIN, 28.5, NZ], [JOIN, 28.5, NZ - 18], [NUT, 22.5, NZ - 14]])}"/>`;
    s += `<path class="gx-edge" style="fill:${shade(MAT.boardHi, 0.18)}" d="${poly([[NUT, 22.5, NZ], [fbEnd, 29.5, NZ], [fbEnd, 29.5, NZ - 5], [NUT, 22.5, NZ - 5]])}"/>`;
    s += `<path class="gx-edge" style="fill:${shade(MAT.boardHi, 0.5)}" d="${poly([[fbEnd, -29.5, NZ], [fbEnd, 29.5, NZ], [fbEnd, 29.5, NZ - 5], [fbEnd, -29.5, NZ - 5]])}"/>`;
    s += `<path class="gx-sil" style="fill:${MAT.boardHi}" d="${poly([[NUT, -22.5], [fbEnd, -29.5], [fbEnd, 29.5], [NUT, 22.5]], NZ)}"/>`;
    for (let n = 1; n <= 20; n++) { const x = fretX(n), w = hw(x) + (x > JOIN ? 1 : 0); s += seg([x, -w, NZ], [x, w, NZ], 'gx-fret'); }
    [3, 5, 7, 9, 15, 17].forEach((f) => { s += disc((fretX(f - 1) + fretX(f)) / 2, 0, 3.6, NZ, 'gx-inlay'); });
    s += disc((fretX(11) + fretX(12)) / 2, -11, 3.6, NZ, 'gx-inlay') + disc((fretX(11) + fretX(12)) / 2, 11, 3.6, NZ, 'gx-inlay');
    // nut
    s += `<path class="gx-detail" style="fill:${shade(MAT.bone, 0.18)}" d="${poly([[NUT - 5, 23, NZ + 3], [NUT, 23, NZ + 3], [NUT, 23, NZ - 2], [NUT - 5, 23, NZ - 2]])}"/><path class="gx-edge" style="fill:${MAT.bone}" d="${poly([[NUT - 5, -23], [NUT, -23], [NUT, 23], [NUT - 5, 23]], NZ + 3)}"/>`;
    // head: near edge, tip, face; six posts; three tuner buttons a side
    const head = [[NUT - 5, -24], [NUT - 30, -36], [14, -42], [4, -30], [4, 30], [14, 42], [NUT - 30, 36], [NUT - 5, 24]];
    s += `<path class="gx-edge" style="fill:${shade(MAT.roast, 0.18)}" d="${poly([[14, 42, HZ], [NUT - 30, 36, HZ], [NUT - 5, 24, HZ], [NUT - 5, 24, HZ - 12], [NUT - 30, 36, HZ - 12], [14, 42, HZ - 12]])}"/>`;
    s += `<path class="gx-edge" style="fill:${shade(MAT.roast, 0.3)}" d="${poly([[4, 30, HZ], [14, 42, HZ], [14, 42, HZ - 12], [4, 30, HZ - 12]])}"/>`;
    s += `<path class="gx-sil" style="fill:${MAT.roast}" d="${poly(head, HZ)}"/>`;
    const posts = [44, 88, 132];
    posts.forEach((x) => [-1, 1].forEach((side) => {
      const z = HZ - 6, a = [x, side * 38, z], b = [x, side * 56, z], k1 = [x - 9, side * 60, z], k2 = [x + 9, side * 60, z];
      s += seg(a, b, 'gx-peg-out') + seg(k1, k2, 'gx-key-out') + seg(a, b, 'gx-peg') + seg(k1, k2, 'gx-key');
      s += disc(x, side * 26, 4.4, HZ + 2, 'gx-detail', ` style="fill:${MAT.nickel}"`);
    }));
    // strings: wound (bronze) for 6, 5 and 4, plain for 3, 2 and 1; string 6 is nearest the viewer
    for (let i = 0; i < 6; i++) {
      const yN = 18 - i * 7.2, yS = 27 - i * 10.8, post = [posts[i < 3 ? 2 - i : i - 3], (i < 3 ? 1 : -1) * 26], w = f1(1.7 - i * 0.2), cls = i < 3 ? 'gx-string wound' : 'gx-string';
      s += seg([post[0], post[1], HZ + 3], [NUT - 2, yN, NZ + 4], cls, ` stroke-width="${w}"`) + seg([NUT - 2, yN, NZ + 4], [SADDLE, yS, TOP + 9], cls, ` stroke-width="${w}"`);
    }
    // labels: [name, note, the exact spot (x, y, z), where the text sits on screen, which way it reads]
    // where string i sits at distance x along the neck (i = 0 is string 6, nearest the viewer)
    const sy = (i, x) => { const t = (x - NUT) / (SADDLE - NUT); return (18 - i * 7.2) + ((27 - i * 10.8) - (18 - i * 7.2)) * t; };
    const parts = [
      ['Head', 'holds the tuners', [26, 0, HZ], [286, 20], 'start'],
      ['Tuning pegs', 'turn to tighten a string', [88, 60, HZ - 6], [168, 150], 'end'],
      ['Nut', 'where open strings begin', [NUT - 2.5, -22, NZ + 3], [356, 50], 'start'],
      ['Frets', 'each raises the note a half step', [fretX(5), hw(fretX(5)), NZ], [262, 226], 'end'],
      ['Strings', 'string 6 is the thick one', [fretX(10), sy(5, fretX(10)), NZ + 4], [510, 100], 'start'],
      ['Sound hole', 'lets the sound out', [HOLE, -34, TOP], [628, 150], 'start'],
      ['Bridge and saddle', 'where the strings end', [SADDLE + 20, -70, TOP + 4], [720, 204], 'start'],
      ['Body', 'its thin top makes it loud', [END - 120, 150, TOP], [470, 396], 'end'],
    ];
    let labels = '', marks = '';
    parts.forEach(([name, note, at, to, anchor], k) => {
      const [px, py] = P(at[0], at[1], at[2]), tx = to[0] + (anchor === 'end' ? -6 : 6);
      labels += `<g class="ao-lab"><line class="ao-lead" x1="${f1(px)}" y1="${f1(py)}" x2="${to[0]}" y2="${to[1]}"/><text class="ao-name" x="${tx}" y="${to[1] + 2}" text-anchor="${anchor}">${name}</text><text class="ao-note" x="${tx}" y="${to[1] + 15}" text-anchor="${anchor}">${note}</text></g>`;
      marks += `<g class="ao-mark"><circle class="ao-dot" cx="${f1(px)}" cy="${f1(py)}" r="2.4"/><g class="ao-num"><circle cx="${f1(px)}" cy="${f1(py)}" r="10"/><text x="${f1(px)}" y="${f1(py + 3.8)}">${k + 1}</text></g></g>`;
    });
    return `<figure class="ao"><svg class="ao-svg" viewBox="0 0 860 430" role="img" aria-label="A steel-string acoustic guitar with eight parts named">${s}${labels}${marks}</svg>
      <ol class="ao-list">${parts.map(([name, note]) => `<li><span><b>${name}.</b> ${note[0].toUpperCase() + note.slice(1)}.</span></li>`).join('')}</ol></figure>`;
  }
  G.Figures = { guitar };
})();
