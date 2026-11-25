// Annotated objects (design system: "Teaching layouts" → Annotated object). One isometric drawing with its parts named:
// labels left and right with a thin leader line to the exact spot, at most eight. On a phone the labels become a
// numbered list under the drawing and the dots carry the numbers.
(() => {
  'use strict';
  const G = (window.G = window.G || {});

  // A steel-string acoustic guitar, drawn from real measurements in millimetres and laid on the isometric floor with the
  // projection the neck uses. x runs from the tip of the head to the end of the body; y across, 0 on the centre line.
  // Scale 650 (nut to saddle), neck meets the body at fret 14, body 500 long, bouts 290 and 395 wide, waist 240.
  const NUT = 180, SCALE = 650, JOIN = NUT + SCALE * (1 - Math.pow(2, -14 / 12)), END = JOIN + 500, SADDLE = NUT + SCALE;
  const K = 0.55, OX = 132, OY = 8, DEPTH = 44; // millimetres to drawing units; where the head's tip lands; how deep the body is drawn
  const P = (x, y, z = 0) => [OX + (x - y) * 0.866 * K, OY + (x + y + 200) * 0.5 * K - z];
  const pt = (x, y, z) => P(x, y, z).map((n) => n.toFixed(1)).join(' ');
  const fretX = (n) => NUT + SCALE * (1 - Math.pow(2, -n / 12));
  // one side of the body outline (y < 0), as cubic segments from the neck joint round to the end pin
  const HALF = [[[JOIN, -32]], [[JOIN + 4, -112], [JOIN + 44, -145], [JOIN + 104, -145]], [[JOIN + 156, -145], [JOIN + 168, -120], [JOIN + 204, -120]],
    [[JOIN + 250, -120], [JOIN + 262, -197], [JOIN + 348, -197]], [[JOIN + 446, -197], [END, -108], [END, 0]]];
  const mirror = HALF.slice(1).reverse().map((seg, i, all) => { const prevEnd = i + 1 < all.length ? all[i + 1][2] : HALF[0][0]; return [[seg[1][0], -seg[1][1]], [seg[0][0], -seg[0][1]], [prevEnd[0], -prevEnd[1]]]; });
  const bodyPath = (z) => `M${pt(HALF[0][0][0], HALF[0][0][1], z)} ` + HALF.slice(1).concat(mirror).map((s) => `C${pt(s[0][0], s[0][1], z)} ${pt(s[1][0], s[1][1], z)} ${pt(s[2][0], s[2][1], z)}`).join(' ') + ' Z';
  const poly = (pts, z) => 'M' + pts.map(([x, y]) => pt(x, y, z)).join(' L') + ' Z';
  const ellipse = (cx, cy, r, z = 0) => { const [x, y] = P(cx, cy, z); return `cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(r * 1.225 * K).toFixed(1)}" ry="${(r * 0.707 * K).toFixed(1)}"`; };
  const line = (a, b, cls, extra = '') => { const [x1, y1] = P(a[0], a[1], a[2] || 0), [x2, y2] = P(b[0], b[1], b[2] || 0); return `<line class="${cls}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"${extra}/>`; };

  function guitar() {
    const TOP = DEPTH, NECK_Z = TOP + 6; // the fingerboard sits a little proud of the top
    const hw = (x) => 22.5 + (x - NUT) / (JOIN - NUT) * 6; // half-width of the neck: 45 at the nut, 57 at the body
    const board = [[NUT, -22.5], [fretX(20), -hw(fretX(20)) - 1], [fretX(20), hw(fretX(20)) + 1], [NUT, 22.5]];
    const head = [[NUT, -24], [NUT - 26, -36], [14, -42], [4, -30], [4, 30], [14, 42], [NUT - 26, 36], [NUT, 24]];
    let s = '';
    // floor shadow, then the body's side wall built from stacked outlines, then its top
    s += `<path class="ao-shadow" d="${bodyPath(0)}" transform="translate(10 8)"/>`;
    for (let z = 0; z < TOP; z += 2) s += `<path class="ao-side" d="${bodyPath(z)}"/>`;
    s += `<path class="ao-edge" d="${bodyPath(0)}"/><path class="ao-body" d="${bodyPath(TOP)}"/>`;
    // binding: a pale line just inside the edge of the top
    s += `<path class="ao-binding" d="${bodyPath(TOP)}"/>`;
    // sound hole with its rosette, pick guard, bridge, saddle and pins
    const hx = fretX(20) + 62;
    s += `<ellipse class="ao-rosette" ${ellipse(hx, 0, 64, TOP)}/><ellipse class="ao-hole" ${ellipse(hx, 0, 50, TOP)}/>`;
    s += `<path class="ao-guard" d="M${pt(hx - 30, 58, TOP)} C${pt(hx + 30, 66, TOP)} ${pt(hx + 96, 96, TOP)} ${pt(hx + 104, 138, TOP)} C${pt(hx + 60, 150, TOP)} ${pt(hx - 10, 120, TOP)} ${pt(hx - 30, 58, TOP)} Z"/>`;
    s += `<path class="ao-dark" d="${poly([[SADDLE - 14, -78], [SADDLE + 22, -78], [SADDLE + 22, 78], [SADDLE - 14, 78]], TOP + 3)}"/>`;
    s += `<path class="ao-bone" d="${poly([[SADDLE - 3, -40], [SADDLE + 2, -40], [SADDLE + 4, 40], [SADDLE - 1, 40]], TOP + 6)}"/>`;
    for (let i = 0; i < 6; i++) s += `<ellipse class="ao-pin" ${ellipse(SADDLE + 13, -27 + i * 10.8, 3.2, TOP + 4)}/>`;
    // neck: the heel and underside first, then the fingerboard on top
    s += `<path class="ao-neckside" d="${poly([[NUT - 4, 22.5], [JOIN, hw(JOIN)], [JOIN, hw(JOIN)], [NUT - 4, 22.5]].map((p, i) => p).concat([]), NECK_Z - 16)} "/>`;
    s += `<path class="ao-neckside" d="M${pt(NUT, 22.5, NECK_Z)} L${pt(JOIN, hw(JOIN), NECK_Z)} L${pt(JOIN, hw(JOIN), NECK_Z - 16)} L${pt(NUT, 22.5, NECK_Z - 16)} Z"/>`;
    s += `<path class="ao-dark" d="${poly(board, NECK_Z)}"/>`;
    for (let n = 1; n <= 20; n++) { const x = fretX(n), w = hw(Math.min(x, fretX(20))) + (x > JOIN ? 1 : 0); s += line([x, -w, NECK_Z], [x, w, NECK_Z], 'ao-fret'); }
    [3, 5, 7, 9, 15, 17].forEach((f) => { s += `<ellipse class="ao-inlay" ${ellipse((fretX(f - 1) + fretX(f)) / 2, 0, 3.6, NECK_Z)}/>`; });
    s += `<ellipse class="ao-inlay" ${ellipse((fretX(11) + fretX(12)) / 2, -11, 3.6, NECK_Z)}/><ellipse class="ao-inlay" ${ellipse((fretX(11) + fretX(12)) / 2, 11, 3.6, NECK_Z)}/>`;
    s += `<path class="ao-bone" d="${poly([[NUT - 5, -23], [NUT, -23], [NUT, 23], [NUT - 5, 23]], NECK_Z + 2)}"/>`;
    // head: its edge, its face, six posts and the tuner buttons standing out at each side
    const HZ = NECK_Z - 4;
    s += `<path class="ao-neckside" d="M${pt(4, 30, HZ)} L${pt(14, 42, HZ)} L${pt(NUT - 26, 36, HZ)} L${pt(NUT, 24, HZ)} L${pt(NUT, 24, HZ - 12)} L${pt(NUT - 26, 36, HZ - 12)} L${pt(14, 42, HZ - 12)} L${pt(4, 30, HZ - 12)} Z"/>`;
    s += `<path class="ao-headp" d="${poly(head, HZ)}"/>`;
    const posts = [0, 1, 2].map((i) => 44 + i * 44);
    posts.forEach((x) => [-1, 1].forEach((side) => {
      s += line([x, side * 40, HZ - 6], [x, side * 58, HZ - 6], 'ao-shaft');
      s += `<ellipse class="ao-metal" ${ellipse(x, side * 62, 8, HZ - 6)}/><ellipse class="ao-post" ${ellipse(x, side * 26, 4.2, HZ + 2)}/>`;
    }));
    // strings: from each post, over the nut, down the board to the saddle
    for (let i = 0; i < 6; i++) {
      const yN = -18 + i * 7.2, yS = -27 + i * 10.8, post = [posts[i < 3 ? 2 - i : i - 3], (i < 3 ? -1 : 1) * 26];
      s += line([post[0], post[1], HZ + 2], [NUT - 2, yN, NECK_Z + 3], 'ao-string', ` stroke-width="${(1.5 - i * 0.16).toFixed(2)}"`);
      s += line([NUT - 2, yN, NECK_Z + 3], [SADDLE, yS, TOP + 8], 'ao-string', ` stroke-width="${(1.5 - i * 0.16).toFixed(2)}"`);
    }
    // name, one-line note, the spot (millimetres, height), which side its label sits on
    const parts = [
      ['Head', 'holds the tuning machines', [70, -6, HZ], 'R'],
      ['Tuning pegs', 'tighter is higher in pitch', [88, 62, HZ - 6], 'L'],
      ['Nut', 'where an open string starts', [NUT - 2, 20, NECK_Z + 2], 'L'],
      ['Frets', 'each one raises the note a half step', [fretX(5), 24, NECK_Z], 'L'],
      ['Strings', 'string 6 is the thick one', [fretX(10) + 10, -19, NECK_Z + 3], 'R'],
      ['Sound hole', 'lets the sound out of the body', [hx, -30, TOP], 'R'],
      ['Bridge and saddle', 'where every string ends', [SADDLE + 8, 60, TOP + 4], 'L'],
      ['Body', 'its thin top makes the guitar loud', [END - 150, 120, TOP], 'L'],
    ];
    let left = 0, right = 0, labels = '', marks = '';
    parts.forEach(([name, note, at, side], k) => {
      const [px, py] = P(at[0], at[1], at[2]), lx = side === 'L' ? 236 : 486, ly = side === 'L' ? 236 + left++ * 38 : 26 + right++ * 38;
      labels += `<g class="ao-lab"><line class="ao-lead" x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="${lx + (side === 'L' ? 6 : -6)}" y2="${ly}"/><text class="ao-name" x="${lx}" y="${ly + 1}" text-anchor="${side === 'L' ? 'end' : 'start'}">${name}</text><text class="ao-note" x="${lx}" y="${ly + 14}" text-anchor="${side === 'L' ? 'end' : 'start'}">${note}</text></g>`;
      marks += `<g class="ao-mark"><circle class="ao-dot" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="2.4"/><g class="ao-num"><circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="10"/><text x="${px.toFixed(1)}" y="${(py + 3.8).toFixed(1)}">${k + 1}</text></g></g>`;
    });
    return `<figure class="ao"><svg class="ao-svg" viewBox="0 0 770 430" role="img" aria-label="A steel-string acoustic guitar with eight parts named">${s}${labels}${marks}</svg>
      <ol class="ao-list">${parts.map(([name, note]) => `<li><span><b>${name}.</b> ${note[0].toUpperCase() + note.slice(1)}.</span></li>`).join('')}</ol></figure>`;
  }
  G.Figures = { guitar };
})();
