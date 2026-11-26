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

  // A double-cutaway solid-body electric guitar, modelled on the owner's reference drawings, in millimetres: 648 scale,
  // 22 frets, bolt-on neck, six tuners in a line, three single-coil pickups on a pickguard, a six-saddle bridge with an
  // arm, three knobs, a selector and a jack plate. It lies face up with the body nearest the viewer and the neck running
  // away up to the right, so both cutaways and the whole top are seen.
  // Guitar coordinates: gx from the tip of the head to the end of the body; gy across, 0 on the centre line, +gy the bass
  // side; z up from the floor. On the floor the guitar's length runs along the far-to-near axis.
  const NUT = 190, SCALE = 648, fretX = (n) => NUT + SCALE * (1 - Math.pow(2, -n / 12));
  const HEEL = fretX(17), POCKET = 640, SADDLE = NUT + SCALE, FBEND = fretX(22) + 6;
  const K = 0.6, OX = 640, OY = 58, TOP = 44, NZ = TOP + 8, HZ = NZ - 5, SZ = TOP + 10;
  const BODY = '#c8412f', GUARD = '#f4eee0', COVER = '#fbf7ee', MAPLE = '#d9a964';
  const P = (gx, gy, z = 0) => [OX + (-gy - gx) * 0.866 * K, OY + (gx - gy) * 0.5 * K - z];
  const f1 = (n) => n.toFixed(1), pt = (x, y, z) => P(x, y, z).map(f1).join(' ');
  const poly = (pts, z) => 'M' + pts.map((p) => pt(p[0], p[1], p[2] == null ? z : p[2])).join(' L') + ' Z';
  const disc = (cx, cy, r, z, cls, extra = '') => { const [x, y] = P(cx, cy, z); return `<ellipse class="${cls}" cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r * 1.2247 * K)}" ry="${f1(r * 0.7071 * K)}"${extra}/>`; };
  const seg = (a, b, cls, extra = '') => { const p = P(a[0], a[1], a[2]), q = P(b[0], b[1], b[2]); return `<line class="${cls}" x1="${f1(p[0])}" y1="${f1(p[1])}" x2="${f1(q[0])}" y2="${f1(q[1])}"${extra}/>`; };
  // a closed smooth curve through the given points
  const smooth = (c, n = 6) => {
    const out = [], m = c.length;
    for (let i = 0; i < m; i++) {
      const p0 = c[(i + m - 1) % m], p1 = c[i], p2 = c[(i + 1) % m], p3 = c[(i + 2) % m];
      for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; out.push([0, 1].map((a) => 0.5 * (2 * p1[a] + (p2[a] - p0[a]) * t + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 + (3 * p1[a] - p0[a] - 3 * p2[a] + p3[a]) * t3))); }
    }
    return out;
  };
  // The walls of an upright solid that face the viewer, far ones first. The viewer stands toward the tail end (+gx) and
  // the treble side (−gy): walls facing the tail are the "front" (18% darker), walls facing the treble side the "end" (50%).
  const walls = (ring, z0, z1, hex, line) => {
    let area = 0;
    ring.forEach((a, i) => { const b = ring[(i + 1) % ring.length]; area += a[0] * b[1] - b[0] * a[1]; });
    const out = [];
    ring.forEach((a, i) => {
      const b = ring[(i + 1) % ring.length], s = area > 0 ? 1 : -1, nx = s * (b[1] - a[1]), ny = -s * (b[0] - a[0]);
      if (nx - ny <= 0) return;
      const c = shade(hex, 0.18 + 0.32 * Math.max(0, -ny) / (Math.abs(nx) + Math.abs(ny) || 1));
      out.push([a[0] - a[1] + b[0] - b[1], `<path d="${poly([[a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1], [a[0], a[1], z1]])}" fill="${c}" stroke="${line ? 'var(--ink)' : c}" stroke-width=".7" stroke-linejoin="round"/>`]);
    });
    return out.sort((p, q) => p[0] - q[0]).map((p) => p[1]).join('');
  };
  const box = (c, z0, z1, hex, cls = 'gx-detail') => walls(c, z0, z1, hex, true) + `<path class="${cls}" style="fill:${hex}" d="${poly(c, z1)}"/>`;

  const ring = smooth([[632, 31], [604, 36], [580, 48], [556, 70], [538, 98], [522, 124], [512, 140], [522, 158], [548, 166], [590, 165], [640, 154], [690, 138], [740, 140], [800, 158], [870, 168], [935, 152], [975, 108], [991, 50], [994, 0],
    [991, -50], [976, -106], [940, -150], [880, -166], [815, -158], [755, -134], [705, -124], [668, -134], [636, -150], [604, -156], [576, -146], [570, -128], [582, -104], [604, -78], [626, -52], [POCKET, -31]]);
  const guard = smooth([[644, 34], [628, 70], [640, 112], [680, 120], [720, 98], [750, 62], [800, 50], [822, 34], [824, -40], [850, -58], [900, -92], [922, -134], [884, -150], [800, -142], [735, -118], [690, -112], [660, -124], [636, -134], [622, -110], [636, -70], [646, -36]], 4);
  const head = smooth([[NUT - 5, 22], [160, 32], [104, 40], [44, 44], [16, 38], [5, 20], [10, -2], [34, -16], [70, -12], [110, -20], [150, -22], [NUT - 5, -21.5]], 4);

  function guitar() {
    let s = '';
    // hard shadow: the footprint slid lower right, flat
    s += `<path class="gx-shadow" d="${poly(ring, 0)}" transform="translate(${f1(TOP * 0.5)} ${f1(TOP * 0.29)})"/>`;
    s += walls(ring, 0, TOP, BODY) + `<path class="gx-sil" d="${poly(ring, 0)}" style="fill:none"/><path class="gx-sil" d="${poly(ring, TOP)}" style="fill:${BODY}"/>`;
    // pickguard with its screws, three pickups, selector, knobs, jack plate
    s += `<path class="gx-edge" style="fill:${GUARD}" d="${poly(guard, TOP + 0.6)}"/>`;
    [[650, 100], [742, 62], [816, 40], [660, -116], [800, -134], [912, -124], [650, -44], [836, -50]].forEach(([x, y]) => { s += disc(x, y, 1.8, TOP + 0.8, 'gx-detail', ` style="fill:${MAT.nickel}"`); });
    [[668, 0], [742, 0], [806, 8]].forEach(([x, sl]) => {
      s += box([[x - 9 - sl, 36], [x + 9 - sl, 36], [x + 9 + sl, -36], [x - 9 + sl, -36]], TOP + 0.6, TOP + 6, COVER);
      for (let i = 0; i < 6; i++) { const y = 26 - i * 10.4; s += disc(x - sl * y / 36, y, 2.6, TOP + 6, 'gx-detail', ` style="fill:${MAT.nickel}"`); }
    });
    s += seg([824, -64, TOP + 1], [842, -84, TOP + 1], 'gx-peg-out') + disc(833, -74, 3.4, TOP + 6, 'gx-detail', ` style="fill:${COVER}"`);
    [[850, -84], [880, -106], [904, -126]].forEach(([x, y]) => { for (let d = 0; d <= 7.5; d += 1.5) s += disc(x, y, 9, TOP + 1 + d, 'gx-detail', ` style="fill:${d >= 7.5 ? COVER : shade(COVER, 0.22)}"`); });
    s += `<path class="gx-detail" style="fill:${MAT.nickel}" d="${poly(smooth([[926, -66], [948, -78], [972, -104], [962, -116], [938, -104], [920, -80]], 4), TOP + 0.6)}"/>` + disc(948, -92, 6, TOP + 0.8, 'gx-detail', ` style="fill:${MAT.boardLo}"`);
    // bridge: plate, six saddles
    s += box([[826, 40], [876, 40], [876, -40], [826, -40]], TOP + 0.6, TOP + 3.5, MAT.nickel, 'gx-edge');
    for (let i = 0; i < 6; i++) { const y = 26 - i * 10.4; s += box([[SADDLE - 7, y + 4], [SADDLE + 9, y + 4], [SADDLE + 9, y - 4], [SADDLE - 7, y - 4]], TOP + 3.5, TOP + 9, shade(MAT.nickel, 0.08)); }
    // head: six tuners in a line along the far edge, drawn first so the head covers their shafts
    const post = (i) => [150 - i * 24, 13 + i * 1.8];
    for (let i = 5; i >= 0; i--) {
      const [x, y] = post(i), z = HZ - 6, a = [x, y + 16, z], b = [x, 60, z], k1 = [x - 8, 64, z], k2 = [x + 8, 64, z];
      s += seg(a, b, 'gx-peg-out') + seg(k1, k2, 'gx-key-out') + seg(a, b, 'gx-peg') + seg(k1, k2, 'gx-key');
    }
    s += walls(head, HZ - 13, HZ, MAPLE) + `<path class="gx-sil" style="fill:${MAPLE}" d="${poly(head, HZ)}"/>`;
    // neck: its treble side, then the fingerboard; 22 frets; inlays at 3, 5, 7, 9, 12 (two), 15, 17, 19, 21
    const hw = (x) => 21 + (Math.min(x, HEEL) - NUT) / (HEEL - NUT) * 7, FW2 = 28.6;
    s += `<path class="gx-edge" style="fill:${shade(MAPLE, 0.5)}" d="${poly([[NUT, -21, NZ], [POCKET, -28.4, NZ], [POCKET, -28.4, TOP], [NUT, -21, NZ - 20]])}"/>`;
    s += `<path class="gx-edge" style="fill:${shade(MAT.boardHi, 0.5)}" d="${poly([[NUT, -21, NZ], [FBEND, -FW2, NZ], [FBEND, -FW2, NZ - 4], [NUT, -21, NZ - 4]])}"/>`;
    s += `<path class="gx-edge" style="fill:${shade(MAT.boardHi, 0.18)}" d="${poly([[FBEND, -FW2, NZ], [FBEND, FW2, NZ], [FBEND, FW2, NZ - 4], [FBEND, -FW2, NZ - 4]])}"/>`;
    s += `<path class="gx-sil" style="fill:${MAT.boardHi}" d="${poly([[NUT, -21], [FBEND, -FW2], [FBEND, FW2], [NUT, 21]], NZ)}"/>`;
    for (let n = 1; n <= 22; n++) { const x = fretX(n), w = hw(x) + (x > HEEL ? 0.6 : 0); s += seg([x, -w, NZ], [x, w, NZ], 'gx-fret'); }
    [3, 5, 7, 9, 15, 17, 19, 21].forEach((f) => { s += disc((fretX(f - 1) + fretX(f)) / 2, 0, 3.2, NZ, 'gx-inlay'); });
    s += disc((fretX(11) + fretX(12)) / 2, -10, 3.2, NZ, 'gx-inlay') + disc((fretX(11) + fretX(12)) / 2, 10, 3.2, NZ, 'gx-inlay');
    // nut
    s += `<path class="gx-detail" style="fill:${shade(MAT.bone, 0.3)}" d="${poly([[NUT - 5, -21.5, NZ + 3], [NUT, -21.5, NZ + 3], [NUT, -21.5, NZ - 2], [NUT - 5, -21.5, NZ - 2]])}"/><path class="gx-edge" style="fill:${MAT.bone}" d="${poly([[NUT - 5, -21.5], [NUT, -21.5], [NUT, 21.5], [NUT - 5, 21.5]], NZ + 3)}"/>`;
    // tuner posts and the string tree for the two thinnest strings
    for (let i = 5; i >= 0; i--) { const [x, y] = post(i); s += disc(x, y, 4.2, HZ + 2, 'gx-detail', ` style="fill:${MAT.nickel}"`); }
    s += disc(112, -9, 2.8, HZ + 1.5, 'gx-detail', ` style="fill:${MAT.nickel}"`);
    // strings: wound for 6, 5 and 4, plain for 3, 2 and 1; string 6 is on the far (bass) side and has the nearest tuner to the nut
    for (let i = 0; i < 6; i++) {
      const yN = 17.5 - i * 7, yS = 26 - i * 10.4, p = post(i), w = f1(1.7 - i * 0.2), cls = i < 3 ? 'gx-string wound' : 'gx-string';
      s += seg([p[0], p[1], HZ + 3], [NUT - 2, yN, NZ + 4], cls, ` stroke-width="${w}"`) + seg([NUT - 2, yN, NZ + 4], [SADDLE, yS, SZ], cls, ` stroke-width="${w}"`);
    }
    // the arm, rising from the treble corner of the bridge
    s += seg([866, -34, TOP + 4], [856, -60, TOP + 24], 'gx-peg-out') + seg([856, -60, TOP + 24], [790, -96, TOP + 26], 'gx-peg-out') + seg([866, -34, TOP + 4], [856, -60, TOP + 24], 'gx-peg') + seg([856, -60, TOP + 24], [790, -96, TOP + 26], 'gx-peg') + disc(790, -96, 4.4, TOP + 26, 'gx-detail', ` style="fill:${COVER}"`);
    // labels: [name, note, the exact spot (gx, gy, z), where the text sits on screen, which way it reads]
    const parts = [
      ['Tuners', 'turn to tighten a string', [102, 64, HZ - 6], [472, 22], 'end'],
      ['Nut', 'where open strings begin', [NUT - 2.5, -21, NZ + 3], [650, 112], 'start'],
      ['Frets', 'each raises the note a half step', [fretX(5), -hw(fretX(5)), NZ], [560, 172], 'start'],
      ['Strings', 'string 6 is the thick one', [fretX(10), 18, NZ + 4], [336, 76], 'end'],
      ['Pickups', 'turn string movement into sound', [742, 30, TOP + 6], [252, 116], 'end'],
      ['Body', 'solid, so it needs an amp', [930, 120, TOP], [22, 168], 'start'],
      ['Bridge', 'where the strings end', [872, -38, TOP + 3.5], [150, 398], 'start'],
      ['Volume and tone', 'shape the sound', [904, -126, TOP + 8.5], [400, 392], 'start'],
    ];
    let labels = '', marks = '';
    parts.forEach(([name, note, at, to, anchor], k) => {
      const [px, py] = P(at[0], at[1], at[2]), tx = to[0] + (anchor === 'end' ? -6 : 6);
      labels += `<g class="ao-lab"><line class="ao-lead" x1="${f1(px)}" y1="${f1(py)}" x2="${to[0]}" y2="${to[1]}"/><text class="ao-name" x="${tx}" y="${to[1] + 2}" text-anchor="${anchor}">${name}</text><text class="ao-note" x="${tx}" y="${to[1] + 15}" text-anchor="${anchor}">${note}</text></g>`;
      marks += `<g class="ao-mark"><circle class="ao-dot" cx="${f1(px)}" cy="${f1(py)}" r="2.4"/><g class="ao-num"><circle cx="${f1(px)}" cy="${f1(py)}" r="10"/><text x="${f1(px)}" y="${f1(py + 3.8)}">${k + 1}</text></g></g>`;
    });
    return `<figure class="ao"><svg class="ao-svg" viewBox="0 0 860 430" role="img" aria-label="A solid-body electric guitar with eight parts named">${s}${labels}${marks}</svg>
      <ol class="ao-list">${parts.map(([name, note]) => `<li><span><b>${name}.</b> ${note[0].toUpperCase() + note.slice(1)}.</span></li>`).join('')}</ol></figure>`;
  }
  G.Figures = { guitar };
})();
