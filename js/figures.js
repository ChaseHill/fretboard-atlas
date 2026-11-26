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
  const HEEL = fretX(17), POCKET = 652, SADDLE = NUT + SCALE, FBEND = fretX(22) + 6;
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

  // Outlines traced from the owner's reference drawing (a front view), pixel by pixel, then scaled so nut to tail is 804 mm.
  const ring = [[536,112],[537,102],[549,98],[570,98],[579,96],[587,90],[591,90],[604,78],[612,63],[613,55],[610,37],[608,35],[616,29],[654,-28],[658,-37],[659,-67],[655,-78],[650,-85],[639,-94],[633,-94],[621,-100],[614,-100],[602,-105],[599,-113],[601,-119],[612,-128],[629,-132],[659,-131],[674,-128],[684,-123],[697,-120],[708,-113],[724,-109],[745,-108],[777,-116],[793,-125],[807,-129],[820,-136],[834,-143],[856,-150],[877,-154],[906,-155],[923,-153],[947,-143],[970,-123],[978,-110],[987,-89],[993,-59],[994,2],[991,56],[985,87],[979,101],[975,109],[968,120],[961,128],[953,136],[944,144],[934,150],[919,155],[913,157],[879,157],[861,154],[842,148],[826,143],[808,134],[795,128],[781,123],[766,116],[746,113],[742,110],[708,110],[623,135],[594,135],[585,138],[571,135],[563,134],[551,129],[541,123]];
  const guard = [[639,31],[633,43],[636,52],[673,45],[711,45],[739,52],[787,70],[800,73],[816,73],[834,68],[842,64],[850,56],[854,48],[856,30],[856,-45],[854,-59],[862,-83],[883,-100],[890,-115],[896,-127],[896,-134],[894,-138],[879,-140],[860,-136],[818,-121],[780,-104],[750,-96],[730,-96],[716,-98],[684,-112],[655,-120],[625,-120],[612,-113],[621,-110],[639,-106],[650,-101],[662,-90],[671,-74],[673,-51],[665,-29],[673,-25],[675,-14],[675,26],[669,31]];
  const head = [[176,22],[163,36],[155,37],[137,32],[128,29],[110,24],[91,17],[73,13],[64,10],[48,3],[41,2],[18,-3],[2,-12],[-5,-22],[-5,-37],[0,-47],[8,-54],[18,-56],[23,-56],[34,-52],[41,-47],[46,-37],[53,-33],[71,-35],[122,-47],[136,-47],[149,-29],[167,-20],[176,-18],[NUT - 5,-21.5],[NUT - 5,22]];

  function guitar() {
    let s = '';
    // hard shadow: the footprint slid lower right, flat
    s += `<path class="gx-shadow" d="${poly(ring, 0)}" transform="translate(${f1(TOP * 0.5)} ${f1(TOP * 0.29)})"/>`;
    s += walls(ring, 0, TOP, BODY) + `<path class="gx-sil" d="${poly(ring, 0)}" style="fill:none"/><path class="gx-sil" d="${poly(ring, TOP)}" style="fill:${BODY}"/>`;
    // pickguard with its screws, three pickups, selector, knobs, jack plate
    s += `<path class="gx-edge" style="fill:${GUARD}" d="${poly(guard, TOP + 0.6)}"/>`;
    [[644, 44], [740, 58], [836, 60], [640, -112], [760, -104], [884, -132], [668, -40], [848, -52]].forEach(([x, y]) => { s += disc(x, y, 1.8, TOP + 0.8, 'gx-detail', ` style="fill:${MAT.nickel}"`); });
    [684, 754].forEach((x) => {
      s += box([[x - 9, 36], [x + 9, 36], [x + 9, -36], [x - 9, -36]], TOP + 0.6, TOP + 6, COVER);
      for (let i = 0; i < 6; i++) s += disc(x, 26 - i * 10.4, 2.6, TOP + 6, 'gx-detail', ` style="fill:${MAT.nickel}"`);
    });
    s += box([[805, 37], [832, 37], [832, -37], [805, -37]], TOP + 0.6, TOP + 6, MAT.hard); // the bridge pickup is a humbucker: two coils under one cover
    [811, 826].forEach((x) => { for (let i = 0; i < 6; i++) s += disc(x, 26 - i * 10.4, 2.4, TOP + 6, 'gx-detail', ` style="fill:${MAT.nickel}"`); });
    s += seg([800, -70, TOP + 1], [818, -88, TOP + 1], 'gx-peg-out') + disc(809, -79, 3.4, TOP + 6, 'gx-detail', ` style="fill:${COVER}"`);
    [[838, -92], [860, -108], [880, -124]].forEach(([x, y]) => { for (let d = 0; d <= 7.5; d += 1.5) s += disc(x, y, 8.5, TOP + 1 + d, 'gx-detail', ` style="fill:${d >= 7.5 ? COVER : shade(COVER, 0.22)}"`); });
    s += `<path class="gx-detail" style="fill:${MAT.nickel}" d="${poly(smooth([[914, -72], [936, -84], [958, -110], [948, -122], [926, -110], [908, -86]], 4), TOP + 0.6)}"/>` + disc(934, -98, 6, TOP + 0.8, 'gx-detail', ` style="fill:${MAT.boardLo}"`);
    // bridge: plate, six saddles
    s += box([[834, 40], [884, 40], [884, -40], [834, -40]], TOP + 0.6, TOP + 3.5, MAT.nickel, 'gx-edge');
    for (let i = 0; i < 6; i++) { const y = 26 - i * 10.4; s += box([[SADDLE - 1, y + 4], [SADDLE + 15, y + 4], [SADDLE + 15, y - 4], [SADDLE - 1, y - 4]], TOP + 3.5, TOP + 9, shade(MAT.nickel, 0.08)); }
    // head: six tuners in a line along the far edge, drawn first so the head covers their shafts
    const post = (i) => [150 - i * 25.5, 22 - i * 7.4];
    for (let i = 5; i >= 0; i--) {
      const [x, y] = post(i), z = HZ - 6, a = [x, y + 8, z], b = [x - 9, y + 38, z], k1 = [x - 16, y + 39, z], k2 = [x - 3, y + 43, z];
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
    s += disc(118, -4, 2.8, HZ + 1.5, 'gx-detail', ` style="fill:${MAT.nickel}"`);
    // strings: wound for 6, 5 and 4, plain for 3, 2 and 1; string 6 is on the far (bass) side and has the nearest tuner to the nut
    for (let i = 0; i < 6; i++) {
      const yN = 17.5 - i * 7, yS = 26 - i * 10.4, p = post(i), w = f1(1.7 - i * 0.2), cls = i < 3 ? 'gx-string wound' : 'gx-string';
      s += seg([p[0], p[1], HZ + 3], [NUT - 2, yN, NZ + 4], cls, ` stroke-width="${w}"`) + seg([NUT - 2, yN, NZ + 4], [SADDLE, yS, SZ], cls, ` stroke-width="${w}"`);
    }
    // the arm, rising from the treble corner of the bridge
    s += seg([874, -34, TOP + 4], [868, -56, TOP + 24], 'gx-peg-out') + seg([868, -56, TOP + 24], [800, -64, TOP + 26], 'gx-peg-out') + seg([874, -34, TOP + 4], [868, -56, TOP + 24], 'gx-peg') + seg([868, -56, TOP + 24], [800, -64, TOP + 26], 'gx-peg') + disc(800, -64, 4.4, TOP + 26, 'gx-detail', ` style="fill:${COVER}"`);
    // labels: [name, note, the exact spot (gx, gy, z), where the text sits on screen, which way it reads]
    const parts = [
      ['Tuners', 'turn to tighten a string', [91, 46, HZ - 6], [472, 22], 'end'],
      ['Nut', 'where open strings begin', [NUT - 2.5, -21, NZ + 3], [650, 112], 'start'],
      ['Frets', 'each raises the note a half step', [fretX(5), -hw(fretX(5)), NZ], [560, 172], 'start'],
      ['Strings', 'string 6 is the thick one', [fretX(10), 18, NZ + 4], [336, 76], 'end'],
      ['Pickups', 'turn string movement into sound', [754, 30, TOP + 6], [252, 116], 'end'],
      ['Body', 'solid, so it needs an amp', [930, 120, TOP], [22, 168], 'start'],
      ['Bridge', 'where the strings end', [880, -38, TOP + 3.5], [150, 398], 'start'],
      ['Volume and tone', 'shape the sound', [880, -124, TOP + 8.5], [400, 392], 'start'],
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
