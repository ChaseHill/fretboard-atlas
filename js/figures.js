// Annotated objects (design system: "Teaching layouts" → Annotated object). One isometric drawing with its parts named.
// Each label sits beside its own part: a bold name, one italic line, and a short 1px leader ending in a dot on the exact
// spot. Eight labels at most. Where there is no room for labels, they become a numbered list and the dots carry numbers.
(() => {
  'use strict';
  const G = (window.G = window.G || {});
  const MAT = (G.Peg && G.Peg.mat) || { roast: '#c9995e', board: '#2f2723', boardHi: '#42362f', boardLo: '#221b18', bone: '#f1e7d0', nickel: '#cfc6b8', hard: '#2c2c33', hardTop: '#4a4a55' };
  const shade = (G.Peg && G.Peg.shade) || ((hex) => hex);

  // A double-cutaway solid-body electric guitar. The body, pickguard and headstock outlines are traced from the owner's
  // reference drawing and scaled to real size (648 mm scale, nut to tail 804 mm). It lies face up with the body nearest
  // the viewer and the neck running away up to the right, as in the reference, so both cutaways and the whole top show.
  // Guitar coordinates: gx from the tip of the head to the end of the body; gy across, 0 on the centre line, +gy the bass
  // side; z up from the floor. All three axes are drawn at the same scale.
  const NUT = 190, SCALE = 648, fretX = (n) => NUT + SCALE * (1 - Math.pow(2, -n / 12));
  const HEEL = fretX(17), POCKET = 652, SADDLE = NUT + SCALE, FBEND = fretX(22) + 6;
  const K = 0.54, OX = 610, OY = 62, TOP = 44, NZ = TOP + 8, HZ = NZ - 5, SZ = TOP + 10;
  const BODY = '#cf4631', GUARD = '#f6f0e2', COVER = '#fbf7ee', MAPLE = '#dcae6a', CHROME = '#d9d4ca';
  const P = (gx, gy, z = 0) => [OX + (-gy - gx) * 0.866 * K, OY + (gx - gy) * 0.5 * K - z * K];
  const f1 = (n) => n.toFixed(1), pt = (x, y, z) => P(x, y, z).map(f1).join(' ');
  const poly = (pts, z) => 'M' + pts.map((p) => pt(p[0], p[1], p[2] == null ? z : p[2])).join(' L') + ' Z';
  const disc = (cx, cy, r, z, cls, extra = '') => { const [x, y] = P(cx, cy, z); return `<ellipse class="${cls}" cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r * 1.2247 * K)}" ry="${f1(r * 0.7071 * K)}"${extra}/>`; };
  const seg = (a, b, cls, extra = '') => { const p = P(a[0], a[1], a[2]), q = P(b[0], b[1], b[2]); return `<line class="${cls}" x1="${f1(p[0])}" y1="${f1(p[1])}" x2="${f1(q[0])}" y2="${f1(q[1])}"${extra}/>`; };
  const fill = (c) => ` style="fill:${c}"`;
  // a closed smooth curve through the given points
  const smooth = (c, n = 6) => {
    const out = [], m = c.length;
    for (let i = 0; i < m; i++) {
      const p0 = c[(i + m - 1) % m], p1 = c[i], p2 = c[(i + 1) % m], p3 = c[(i + 2) % m];
      for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; out.push([0, 1].map((a) => 0.5 * (2 * p1[a] + (p2[a] - p0[a]) * t + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 + (3 * p1[a] - p0[a] - 3 * p2[a] + p3[a]) * t3))); }
    }
    return out;
  };
  const turn = (ring) => { let a = 0; ring.forEach((p, i) => { const q = ring[(i + 1) % ring.length]; a += p[0] * q[1] - q[0] * p[1]; }); return a > 0 ? 1 : -1; };
  const normals = (ring) => { const s = turn(ring); return ring.map((a, i) => { const b = ring[(i + 1) % ring.length], nx = s * (b[1] - a[1]), ny = -s * (b[0] - a[0]), l = Math.hypot(nx, ny) || 1; return [nx / l, ny / l]; }); };
  // the same outline moved inward by d
  const inset = (ring, d) => { const n = normals(ring), m = ring.length; return ring.map((p, i) => { const a = n[(i + m - 1) % m], b = n[i], x = a[0] + b[0], y = a[1] + b[1], l = Math.hypot(x, y) || 1; return [p[0] - d * x / l, p[1] - d * y / l]; }); };
  // The walls of an upright solid that face the viewer, far ones first. The viewer stands toward the tail end (+gx) and
  // the treble side (−gy). Shading follows the wall's direction averaged over its neighbours, so a curved side turns
  // smoothly from the lit front (18% darker than the top) to the shaded end (50%).
  const walls = (ring, z0, z1, hex, line) => {
    const n = normals(ring), m = ring.length, out = [];
    ring.forEach((a, i) => {
      const b = ring[(i + 1) % m];
      if (n[i][0] - n[i][1] <= 0) return;
      let sx = 0, sy = 0; for (let k = -3; k <= 3; k++) { const q = n[(i + k + m) % m]; sx += q[0]; sy += q[1]; }
      const c = shade(hex, 0.18 + 0.32 * Math.max(0, -sy) / (Math.abs(sx) + Math.abs(sy) || 1));
      out.push([a[0] - a[1] + b[0] - b[1], `<path d="${poly([[a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1], [a[0], a[1], z1]])}" fill="${c}" stroke="${line ? 'var(--ink)' : c}" stroke-width=".8" stroke-linejoin="round"/>`]);
    });
    return out.sort((p, q) => p[0] - q[0]).map((p) => p[1]).join('');
  };
  const box = (c, z0, z1, hex, cls = 'gx-detail') => walls(c, z0, z1, hex, true) + `<path class="${cls}"${fill(hex)} d="${poly(c, z1)}"/>`;
  // an upright cylinder: side, then top
  const cyl = (cx, cy, r, z0, z1, side, top) => { const [x, y0] = P(cx, cy, z0), y1 = P(cx, cy, z1)[1], rx = r * 1.2247 * K, ry = r * 0.7071 * K;
    return `<path class="gx-detail" style="fill:${side}" d="M${f1(x - rx)} ${f1(y1)} L${f1(x - rx)} ${f1(y0)} A${f1(rx)} ${f1(ry)} 0 0 0 ${f1(x + rx)} ${f1(y0)} L${f1(x + rx)} ${f1(y1)} Z"/><ellipse class="gx-detail" style="fill:${top}" cx="${f1(x)}" cy="${f1(y1)}" rx="${f1(rx)}" ry="${f1(ry)}"/>`; };
  // a rectangle with rounded corners (r), or with fully round ends when r is half its width
  const rrect = (x0, x1, y0, y1, r) => { const out = [], c = [[x1 - r, y1 - r, 0], [x0 + r, y1 - r, 90], [x0 + r, y0 + r, 180], [x1 - r, y0 + r, 270]];
    c.forEach(([cx, cy, a0]) => { for (let k = 0; k <= 5; k++) { const a = (a0 + k * 18) * Math.PI / 180; out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } }); return out; };
  const pill = (x, hl, hw, sl = 0) => smooth([[x - hw - sl, hl - 5], [x - hw + 3 - sl, hl], [x + hw - 3 - sl, hl], [x + hw - sl, hl - 5], [x + hw + sl, -hl + 5], [x + hw - 3 + sl, -hl], [x - hw + 3 + sl, -hl], [x - hw + sl, -hl + 5]], 3);

  // Outlines traced from the reference drawing (a front view), pixel by pixel, then scaled so nut to tail is 804 mm.
  const ring = smooth([[536,112],[537,102],[549,98],[570,98],[579,96],[587,90],[591,90],[604,78],[612,63],[613,55],[610,37],[608,35],[616,29],[654,-28],[658,-37],[659,-67],[655,-78],[650,-85],[639,-94],[633,-94],[621,-100],[614,-100],[602,-105],[599,-113],[601,-119],[612,-128],[629,-132],[659,-131],[674,-128],[684,-123],[697,-120],[708,-113],[724,-109],[745,-108],[777,-116],[793,-125],[807,-129],[820,-136],[834,-143],[856,-150],[877,-154],[906,-155],[923,-153],[947,-143],[970,-123],[978,-110],[987,-89],[993,-59],[994,2],[991,56],[985,87],[979,101],[975,109],[968,120],[961,128],[953,136],[944,144],[934,150],[919,155],[913,157],[879,157],[861,154],[842,148],[826,143],[808,134],[795,128],[781,123],[766,116],[746,113],[742,110],[708,110],[623,135],[594,135],[585,138],[571,135],[563,134],[551,129],[541,123]], 2);
  const guard = smooth([[639,31],[633,43],[636,52],[673,45],[711,45],[739,52],[787,70],[800,73],[816,73],[834,68],[842,64],[850,56],[854,48],[856,30],[856,-45],[854,-59],[862,-83],[883,-100],[890,-115],[896,-127],[896,-134],[894,-138],[879,-140],[860,-136],[818,-121],[780,-104],[750,-96],[730,-96],[716,-98],[684,-112],[655,-120],[625,-120],[612,-113],[621,-110],[639,-106],[650,-101],[662,-90],[671,-74],[673,-51],[665,-29],[673,-25],[675,-14],[675,26],[669,31]], 2);
  const head = smooth([[176,22],[163,36],[155,37],[137,32],[128,29],[110,24],[91,17],[73,13],[64,10],[48,3],[41,2],[18,-3],[2,-12],[-5,-22],[-5,-37],[0,-47],[8,-54],[18,-56],[23,-56],[34,-52],[41,-47],[46,-37],[53,-33],[71,-35],[122,-47],[136,-47],[149,-29],[167,-20],[176,-18],[NUT - 5,-21.5],[NUT - 5,22]], 2);

  function guitar() {
    let s = `<defs><linearGradient id="gxBody" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(BODY, -0.16)}"/><stop offset=".55" stop-color="${BODY}"/><stop offset="1" stop-color="${shade(BODY, 0.16)}"/></linearGradient>
      <linearGradient id="gxBoard" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="${MAT.boardLo}"/><stop offset="1" stop-color="${MAT.boardHi}"/></linearGradient>
      <linearGradient id="gxMaple" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="${shade(MAPLE, 0.1)}"/><stop offset="1" stop-color="${shade(MAPLE, -0.12)}"/></linearGradient></defs>`;
    // hard shadow: the footprint slid lower right, flat
    s += `<path class="gx-shadow" d="${poly(ring, 0)}" transform="translate(${f1(TOP * K * 0.75)} ${f1(TOP * K * 0.43)})"/>`;
    // body: walls, the rolled edge, the top, and a band of gloss along the far (bass) side where the light falls
    s += walls(ring, 0, TOP - 3, BODY) + `<path class="gx-sil" d="${poly(ring, 0)}" style="fill:none"/>`;
    s += `<path class="gx-sil"${fill(shade(BODY, 0.14))} d="${poly(ring, TOP - 3)}"/><path d="${poly(inset(ring, 5), TOP)}" fill="url(#gxBody)"/>`;
    { const a = inset(ring, 12), b = inset(ring, 22), pick = (r) => r.filter((p, i) => ring[i][1] > 70 && ring[i][0] > 660 && ring[i][0] < 970);
      s += `<path d="${poly(pick(a).concat(pick(b).reverse()), TOP)}" fill="#fff" opacity=".26"/>`;
      const c = inset(ring, 9), d = inset(ring, 14), pk = (r) => r.filter((p, i) => ring[i][1] < -100 && ring[i][0] < 700 && ring[i][0] > 600);
      s += `<path d="${poly(pk(c).concat(pk(d).reverse()), TOP)}" fill="#fff" opacity=".2"/>`; }
    s += disc(545, 110, 4.5, TOP + 2, 'gx-detail', fill(CHROME)) + disc(989, 0, 4.5, TOP + 2, 'gx-detail', fill(CHROME)); // strap buttons
    // pickguard with a bevelled edge and its screws
    s += `<path class="gx-edge"${fill(shade(GUARD, 0.2))} d="${poly(guard, TOP + 0.8)}"/><path${fill(GUARD)} d="${poly(inset(guard, 2), TOP + 1.6)}"/>`;
    [[644, 44], [740, 58], [836, 60], [640, -112], [760, -104], [884, -132], [668, -40], [848, -52]].forEach(([x, y]) => { s += disc(x, y, 2, TOP + 1.8, 'gx-detail', fill(CHROME)); });
    // pickups: two single-coil covers with rounded ends, pole pieces and a mounting screw at each end; a bridge humbucker in its ring
    [684, 754].forEach((x) => {
      s += disc(x, 47, 2, TOP + 1.8, 'gx-detail', fill(CHROME)) + disc(x, -47, 2, TOP + 1.8, 'gx-detail', fill(CHROME));
      s += box(rrect(x - 9, x + 9, -42, 42, 9), TOP + 1.6, TOP + 8.5, COVER) + `<path d="${poly(rrect(x - 6, x + 6, -39, 39, 6), TOP + 8.5)}" fill="none" stroke="${shade(COVER, 0.2)}" stroke-width=".7"/>`;
      for (let i = 0; i < 6; i++) s += disc(x, 26 - i * 10.4, 2.5, TOP + 8.6, 'gx-detail', fill(shade(CHROME, 0.12)));
    });
    s += box(rrect(798, 838, -46, 46, 5), TOP + 1.6, TOP + 3.5, COVER) + box(rrect(803, 833, -36, 36, 4), TOP + 3.5, TOP + 9, MAT.hard);
    s += seg([818, -36, TOP + 9], [818, 36, TOP + 9], 'gx-fret');
    [810.5, 825.5].forEach((x) => { for (let i = 0; i < 6; i++) s += disc(x, 26 - i * 10.4, 2.3, TOP + 9.1, 'gx-detail', fill(CHROME)); });
    s += disc(818, 42, 1.8, TOP + 3.6, 'gx-detail', fill(CHROME)) + disc(818, -42, 1.8, TOP + 3.6, 'gx-detail', fill(CHROME));
    // selector in its slot; three knobs, each a flared skirt under a cylinder with a pointer line
    s += `<path class="gx-detail"${fill(MAT.boardLo)} d="${poly([[797, -67], [800, -64], [821, -85], [818, -88]], TOP + 1.8)}"/>` + seg([809, -77, TOP + 2], [805, -81, TOP + 13], 'gx-peg-out') + seg([809, -77, TOP + 2], [805, -81, TOP + 13], 'gx-peg') + cyl(805, -81, 3, TOP + 12, TOP + 15, shade(COVER, 0.25), COVER);
    [[838, -92], [860, -108], [880, -124]].forEach(([x, y]) => {
      s += cyl(x, y, 11.5, TOP + 1.6, TOP + 3.2, shade(COVER, 0.3), shade(COVER, 0.1)) + cyl(x, y, 9.4, TOP + 3.2, TOP + 5.2, shade(COVER, 0.28), shade(COVER, 0.08)) + cyl(x, y, 7.6, TOP + 5.2, TOP + 13, shade(COVER, 0.2), COVER);
      s += disc(x, y, 4.6, TOP + 13, 'gx-detail', fill(shade(COVER, 0.06))) + seg([x, y, TOP + 13], [x + 5.5, y - 3.5, TOP + 13], 'gx-peg-out');
    });
    s += `<path class="gx-detail"${fill(CHROME)} d="${poly(smooth([[914, -72], [936, -84], [958, -110], [948, -122], [926, -110], [908, -86]], 4), TOP + 0.6)}"/>` + disc(934, -98, 7, TOP + 0.8, 'gx-detail', fill(shade(CHROME, 0.35))) + disc(934, -98, 3.6, TOP + 0.8, 'gx-detail', fill(MAT.boardLo));
    // bridge: plate with its six mounting screws, six saddles each with a length screw
    s += box([[834, 40], [884, 40], [884, -40], [834, -40]], TOP + 0.6, TOP + 3.5, CHROME, 'gx-edge');
    for (let i = 0; i < 6; i++) {
      const y = 26 - i * 10.4;
      s += disc(837.5, y, 1.7, TOP + 3.7, 'gx-detail', fill(shade(CHROME, 0.3))) + seg([SADDLE + 14, y, TOP + 6], [880, y, TOP + 6], 'gx-fret');
      s += box([[SADDLE - 1, y + 4], [SADDLE + 14, y + 4], [SADDLE + 14, y - 4], [SADDLE - 1, y - 4]], TOP + 3.5, TOP + 9, shade(CHROME, 0.06));
    }
    // head: six machine heads in a line along the far edge; their buttons are drawn first so the head covers the shafts
    const post = (i) => [150 - i * 25.5, 22 - i * 7.4];
    for (let i = 5; i >= 0; i--) { // shafts run square to the slanted edge; each ends in an oval key
      const [x, y] = post(i), z = HZ - 6.5, ux = -0.279, uy = 0.96, a = [x + ux * 6, y + uy * 6, z], b = [x + ux * 31, y + uy * 31, z], c = P(x + ux * 38, y + uy * 38, z);
      const p = P(a[0], a[1], z), q = P(b[0], b[1], z), ang = Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI;
      s += seg(a, b, 'gx-peg-out') + seg(a, b, 'gx-peg') + `<ellipse class="gx-detail"${fill(CHROME)} cx="${f1(c[0])}" cy="${f1(c[1])}" rx="${f1(9.5 * K)}" ry="${f1(6.2 * K)}" transform="rotate(${f1(ang)} ${f1(c[0])} ${f1(c[1])})"/><ellipse cx="${f1(c[0] - 1)}" cy="${f1(c[1] - 1)}" rx="${f1(5 * K)}" ry="${f1(2.4 * K)}" fill="#fff" opacity=".55" transform="rotate(${f1(ang)} ${f1(c[0])} ${f1(c[1])})"/>`;
    }
    s += walls(head, HZ - 13, HZ, MAPLE) + `<path class="gx-sil" style="fill:url(#gxMaple)" d="${poly(head, HZ)}"/>`;
    // neck: its treble side, then the fingerboard; 22 frets; inlays at 3, 5, 7, 9, 12 (two), 15, 17, 19, 21
    const hw = (x) => 21 + (Math.min(x, HEEL) - NUT) / (HEEL - NUT) * 7, FW2 = 28.6;
    s += `<path class="gx-edge"${fill(shade(MAPLE, 0.42))} d="${poly([[NUT, -21, NZ], [POCKET, -28.4, NZ], [POCKET, -28.4, NZ - 27], [HEEL - 20, -27.6, NZ - 27], [HEEL - 70, -26.6, NZ - 24], [NUT + 60, -22, NZ - 20.5], [NUT + 14, -21.2, NZ - 19], [NUT, -21, NZ - 14]])}"/>`; // 19 mm deep by the nut, 24 at the twelfth fret, 27 at the heel
    s += `<path class="gx-edge"${fill(shade(MAT.boardHi, 0.5))} d="${poly([[NUT, -21, NZ], [FBEND, -FW2, NZ], [FBEND, -FW2, NZ - 4], [NUT, -21, NZ - 4]])}"/>`;
    s += `<path class="gx-edge"${fill(shade(MAT.boardHi, 0.18))} d="${poly([[FBEND, -FW2, NZ], [FBEND, FW2, NZ], [FBEND, FW2, NZ - 4], [FBEND, -FW2, NZ - 4]])}"/>`;
    s += `<path class="gx-sil" style="fill:url(#gxBoard)" d="${poly([[NUT, -21], [FBEND, -FW2], [FBEND, FW2], [NUT, 21]], NZ)}"/>`;
    for (let n = 1; n <= 22; n++) { const x = fretX(n), w = hw(x) + (x > HEEL ? 0.6 : 0); s += seg([x, -w, NZ], [x, w, NZ], 'gx-fret'); }
    [3, 5, 7, 9, 15, 17, 19, 21].forEach((f) => { s += disc((fretX(f - 1) + fretX(f)) / 2, 0, 3.2, NZ, 'gx-inlay'); });
    s += disc((fretX(11) + fretX(12)) / 2, -10, 3.2, NZ, 'gx-inlay') + disc((fretX(11) + fretX(12)) / 2, 10, 3.2, NZ, 'gx-inlay');
    // nut
    s += `<path class="gx-detail"${fill(shade(MAT.bone, 0.3))} d="${poly([[NUT - 5, -21.5, NZ + 3], [NUT, -21.5, NZ + 3], [NUT, -21.5, NZ - 2], [NUT - 5, -21.5, NZ - 2]])}"/><path class="gx-edge"${fill(MAT.bone)} d="${poly([[NUT - 5, -21.5], [NUT, -21.5], [NUT, 21.5], [NUT - 5, 21.5]], NZ + 3)}"/>`;
    // tuner posts on their washers, and the string tree for the two thinnest strings
    for (let i = 5; i >= 0; i--) { const [x, y] = post(i); s += cyl(x, y, 6, HZ, HZ + 1.4, shade(CHROME, 0.3), shade(CHROME, 0.12)) + cyl(x, y, 3.2, HZ + 1.4, HZ + 8, shade(CHROME, 0.25), CHROME); }
    s += disc(118, -4, 2.8, HZ + 2, 'gx-detail', fill(CHROME));
    // strings: wound for 6, 5 and 4, plain for 3, 2 and 1; string 6 is on the far (bass) side and has the nearest tuner to the nut
    for (let i = 0; i < 6; i++) {
      const yN = 17.5 - i * 7, yS = 26 - i * 10.4, p = post(i), w = f1(1.6 - i * 0.18), cls = i < 3 ? 'gx-string wound' : 'gx-string';
      s += seg([p[0], p[1], HZ + 6], [NUT - 2, yN, NZ + 4], cls, ` stroke-width="${w}"`) + seg([NUT - 2, yN, NZ + 4], [SADDLE + 6, yS, SZ], cls, ` stroke-width="${w}"`);
    }
    // labels: [name, note, the exact spot (gx, gy, z), where the text sits on screen, which way it reads]
    const parts = [
      ['Tuners', 'turn to tighten a string', [84, 44, HZ - 6], [470, 30], 'end'],
      ['Nut', 'where open strings begin', [NUT - 2.5, -21, NZ + 3], [640, 120], 'start'],
      ['Frets', 'each raises the note a half step', [fretX(5), -hw(fretX(5)), NZ], [560, 186], 'start'],
      ['Strings', 'string 6 is the thick one', [fretX(10), 18, NZ + 4], [330, 96], 'end'],
      ['Pickups', 'turn string movement into sound', [754, 30, TOP + 8.5], [250, 140], 'end'],
      ['Body', 'solid, so it needs an amp', [930, 120, TOP], [14, 180], 'start'],
      ['Bridge', 'where the strings end', [880, -38, TOP + 3.5], [150, 396], 'start'],
      ['Volume and tone', 'shape the sound', [880, -124, TOP + 13], [400, 392], 'start'],
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
