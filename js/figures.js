// Annotated objects (design system: "Teaching layouts" → Annotated object). One isometric drawing with its parts named:
// labels left and right with a thin leader line to the exact spot, at most eight. On a phone the labels become a
// numbered list under the drawing and the dots carry the numbers.
(() => {
  'use strict';
  const G = (window.G = window.G || {});
  // The guitar is drawn flat, then laid on the isometric floor with the same projection the neck uses.
  const S = 0.6, OX = 262, OY = 6, iso = (x, y) => [OX + (x - y) * 0.866 * S, OY + (x + y) * 0.5 * S];
  const M = `matrix(${(0.866 * S).toFixed(4)} ${(0.5 * S).toFixed(4)} ${(-0.866 * S).toFixed(4)} ${(0.5 * S).toFixed(4)} ${OX} ${OY})`;
  const BODY = 'M430 62 C470 36 520 44 548 66 C580 44 660 40 706 84 C748 124 748 168 706 206 C660 250 580 246 548 224 C520 246 470 254 430 228 C404 210 398 176 406 150 L406 130 C398 104 404 80 430 62 Z';
  const NECK = 'M126 115 L470 111 L470 159 L126 155 Z', HEAD = 'M124 112 L96 100 L34 100 C24 100 20 108 20 116 L20 154 C20 162 24 170 34 170 L96 170 L124 158 Z';

  function guitar() {
    const fx = (n) => 128 + 300 * (1 - Math.pow(2, -n / 12)) / (1 - Math.pow(2, -14 / 12));
    const frets = Array.from({ length: 14 }, (_, k) => `<line class="ao-fret" x1="${fx(k + 1).toFixed(1)}" y1="115" x2="${fx(k + 1).toFixed(1)}" y2="155"/>`).join('');
    const dots = [3, 5, 7, 9, 12].map((f) => { const x = ((fx(f - 1) + fx(f)) / 2).toFixed(1); return f === 12 ? `<circle class="ao-inlay" cx="${x}" cy="126" r="2.6"/><circle class="ao-inlay" cx="${x}" cy="144" r="2.6"/>` : `<circle class="ao-inlay" cx="${x}" cy="135" r="2.6"/>`; }).join('');
    const strings = [0, 1, 2, 3, 4, 5].map((i) => { const y = 121 + i * 5.6; return `<line class="ao-string" x1="64" y1="${(y + (i - 2.5) * 1.1).toFixed(1)}" x2="636" y2="${y.toFixed(1)}" stroke-width="${(1.7 - i * 0.18).toFixed(2)}"/>`; }).join('');
    const pegs = [0, 1, 2].map((i) => `<rect class="ao-metal" x="${40 + i * 24}" y="90" width="11" height="12" rx="3"/><rect class="ao-metal" x="${40 + i * 24}" y="168" width="11" height="12" rx="3"/><circle class="ao-post" cx="${45.5 + i * 24}" cy="122" r="2.6"/><circle class="ao-post" cx="${45.5 + i * 24}" cy="148" r="2.6"/>`).join('');
    // name, one-line note, the spot on the flat drawing, which side its label sits on
    const parts = [
      ['Head', 'holds the tuning pegs', [40, 112], 'R'],
      ['Tuning pegs', 'tighter is higher in pitch', [70, 176], 'L'],
      ['Nut', 'where an open string starts', [125, 150], 'L'],
      ['Frets', 'each one raises the note a half step', [236, 153], 'L'],
      ['Strings', 'string 6 is the thick one', [384, 149], 'L'],
      ['Sound hole', 'lets the sound out of the body', [500, 120], 'R'],
      ['Bridge and saddle', 'where every string ends', [640, 112], 'R'],
      ['Body', 'its thin top makes the guitar loud', [700, 96], 'R'],
    ];
    let left = 0, right = 0, labels = '', marks = '';
    parts.forEach(([name, note, at, side], k) => {
      const [px, py] = iso(at[0], at[1]), lx = side === 'L' ? 158 : 604, ly = side === 'L' ? 172 + left++ * 38 : 30 + right++ * 38;
      labels += `<g class="ao-lab"><line class="ao-lead" x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="${lx + (side === 'L' ? 6 : -6)}" y2="${ly}"/><text class="ao-name" x="${lx}" y="${ly + 1}" text-anchor="${side === 'L' ? 'end' : 'start'}">${name}</text><text class="ao-note" x="${lx}" y="${ly + 14}" text-anchor="${side === 'L' ? 'end' : 'start'}">${note}</text></g>`;
      marks += `<g class="ao-mark"><circle class="ao-dot" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="2.2"/><g class="ao-num"><circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="9"/><text x="${px.toFixed(1)}" y="${(py + 3.6).toFixed(1)}">${k + 1}</text></g></g>`;
    });
    return `<figure class="ao"><svg class="ao-svg" viewBox="0 0 760 330" role="img" aria-label="An acoustic guitar with eight parts named">
      <g transform="translate(0 12)"><g transform="${M}"><path class="ao-side" d="${BODY}"/><path class="ao-side" d="${NECK}"/><path class="ao-side" d="${HEAD}"/></g></g>
      <g transform="${M}">
        <path class="ao-body" d="${BODY}"/><circle class="ao-rosette" cx="500" cy="135" r="34"/><circle class="ao-hole" cx="500" cy="135" r="27"/>
        <rect class="ao-dark" x="628" y="106" width="24" height="58" rx="4"/><rect class="ao-bone" x="632" y="112" width="4.5" height="46" rx="1.5"/>
        <path class="ao-dark" d="${NECK}"/>${frets}${dots}<rect class="ao-bone" x="122" y="114" width="6" height="42" rx="1.5"/>
        <path class="ao-headp" d="${HEAD}"/>${pegs}${strings}
      </g>${labels}${marks}</svg>
      <ol class="ao-list">${parts.map(([name, note]) => `<li><span><b>${name}.</b> ${note[0].toUpperCase() + note.slice(1)}.</span></li>`).join('')}</ol></figure>`;
  }
  G.Figures = { guitar };
})();
