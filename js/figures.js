// Labelled drawings used inside lessons. Each figure is drawn here, in the app's own ink-outline style, with numbered
// markers on the picture and a numbered key underneath, so the labels stay readable at any screen size.
(() => {
  'use strict';
  const G = (window.G = window.G || {});
  const mark = (n, x, y) => `<g class="fig-mark"><circle cx="${x}" cy="${y}" r="9.5"/><text x="${x}" y="${y + 3.6}">${n}</text></g>`;
  const key = (items) => `<ol class="fig-key">${items.map(([name, text]) => `<li><span><b>${name}.</b> ${text}</span></li>`).join('')}</ol>`;

  // An acoustic guitar seen from the front, lying on its side: head to the left, body to the right.
  function guitar() {
    const strings = [0, 1, 2, 3, 4, 5].map((i) => { const y = 121 + i * 5.6; return `<line class="fig-string" x1="64" y1="${(y + (i - 2.5) * 1.1).toFixed(1)}" x2="566" y2="${y.toFixed(1)}" stroke-width="${(1.5 - i * 0.16).toFixed(2)}"/>`; }).join('');
    const frets = Array.from({ length: 14 }, (_, k) => { const x = 128 + 300 * (1 - Math.pow(2, -(k + 1) / 12)) / (1 - Math.pow(2, -14 / 12)); return `<line class="fig-fret" x1="${x.toFixed(1)}" y1="115" x2="${x.toFixed(1)}" y2="155"/>`; }).join('');
    const dots = [3, 5, 7, 9, 12].map((f) => { const p = (n) => 128 + 300 * (1 - Math.pow(2, -n / 12)) / (1 - Math.pow(2, -14 / 12)), x = (p(f - 1) + p(f)) / 2; return f === 12 ? `<circle class="fig-dot" cx="${x.toFixed(1)}" cy="126" r="2.4"/><circle class="fig-dot" cx="${x.toFixed(1)}" cy="144" r="2.4"/>` : `<circle class="fig-dot" cx="${x.toFixed(1)}" cy="135" r="2.4"/>`; }).join('');
    const pegs = [0, 1, 2].map((i) => `<rect class="fig-metal" x="${40 + i * 24}" y="94" width="11" height="13" rx="3"/><rect class="fig-metal" x="${40 + i * 24}" y="163" width="11" height="13" rx="3"/><circle class="fig-post" cx="${45.5 + i * 24}" cy="${122 + i * 0}" r="2.6"/><circle class="fig-post" cx="${45.5 + i * 24}" cy="148" r="2.6"/>`).join('');
    const svg = `<svg class="fig" viewBox="0 0 760 270" role="img" aria-label="The parts of a guitar, numbered 1 to 12">
      <path class="fig-shadow" d="M430 62 C470 36 520 44 548 66 C580 44 660 40 706 84 C748 124 748 168 706 206 C660 250 580 246 548 224 C520 246 470 254 430 228 C404 210 398 176 406 150 L406 130 C398 104 404 80 430 62 Z" transform="translate(6 7)"/>
      <path class="fig-body" d="M430 62 C470 36 520 44 548 66 C580 44 660 40 706 84 C748 124 748 168 706 206 C660 250 580 246 548 224 C520 246 470 254 430 228 C404 210 398 176 406 150 L406 130 C398 104 404 80 430 62 Z"/>
      <circle class="fig-rosette" cx="500" cy="135" r="34"/><circle class="fig-hole" cx="500" cy="135" r="27"/>
      <path class="fig-guard" d="M506 166 C540 176 566 196 560 214 C534 220 504 206 494 186 Z"/>
      <rect class="fig-bridge" x="628" y="106" width="24" height="58" rx="4"/><rect class="fig-saddle" x="632" y="112" width="4.5" height="46" rx="1.5"/>
      ${[0, 1, 2, 3, 4, 5].map((i) => `<circle class="fig-pin" cx="644" cy="${121 + i * 5.6}" r="1.9"/>`).join('')}
      <path class="fig-neck" d="M126 115 L470 111 L470 159 L126 155 Z"/>
      ${frets}${dots}
      <rect class="fig-nut" x="122" y="114" width="6" height="42" rx="1.5"/>
      <path class="fig-head" d="M124 112 L96 100 L34 100 C24 100 20 108 20 116 L20 154 C20 162 24 170 34 170 L96 170 L124 158 Z"/>
      ${pegs}
      ${strings.replace(/x2="566"/g, 'x2="636"')}
      ${mark(1, 62, 135)}${mark(2, 46, 78)}${mark(3, 125, 96)}${mark(4, 214, 96)}${mark(5, 300, 176)}${mark(6, 356, 96)}
      ${mark(7, 500, 135)}${mark(8, 466, 60)}${mark(9, 640, 88)}${mark(10, 664, 135)}${mark(11, 590, 208)}${mark(12, 530, 196)}
    </svg>`;
    return svg + key([
      ['Head', 'Holds the tuning machines. Also called the headstock.'],
      ['Tuning pegs', 'Turn one to tighten or loosen its string. Tighter is higher in pitch.'],
      ['Nut', 'The grooved strip where the strings leave the head. An open string sounds from here to the saddle.'],
      ['Frets', 'Metal strips across the neck. Press just behind one and the string sounds from that fret instead of from the nut.'],
      ['Strings', 'Six of them. The thickest, lowest one is string 6; the thinnest, highest is string 1.'],
      ['Neck and fingerboard', 'Where the fretting hand works. The dots mark frets 3, 5, 7, 9 and 12.'],
      ['Sound hole', 'Lets the sound out of the hollow body. Pluck near it for a warm tone, nearer the bridge for a bright one.'],
      ['Shoulder', 'Where the neck joins the body, around fret 12 or 14.'],
      ['Bridge', 'Anchors the strings to the top of the guitar.'],
      ['Saddle', 'The thin strip in the bridge that the strings rest on: the other end of every note.'],
      ['Body and top', 'The thin wooden top vibrates with the strings. This is what makes an acoustic guitar loud.'],
      ['Pick guard', 'Protects the top from the pick. Classical guitars usually have none.'],
    ]);
  }
  // Cards that set out the choices side by side: [{name, for, good: [], watch: []}]
  const cards = (list) => `<div class="fig-cards">${list.map((c) => `<section class="fig-card"><h4>${c.name}</h4><p>${c.text}</p><h5>Good</h5><ul>${c.good.map((x) => `<li>${x}</li>`).join('')}</ul><h5>Watch for</h5><ul>${c.watch.map((x) => `<li>${x}</li>`).join('')}</ul></section>`).join('')}</div>`;
  const kinds = () => cards([
    { name: 'Classical (nylon strings)', text: 'Wide, flat neck and soft strings. The usual first guitar for classical, bossa nova and fingerstyle.', good: ['Kind to the fingertips', 'Wide string spacing for the plucking hand'], watch: ['Chords are a longer reach', 'Quieter, with a short sustain'] },
    { name: 'Steel-string acoustic', text: 'Narrower neck and bright, loud strings. Folk, country, blues and song accompaniment.', good: ['Full, ringing sound with no amplifier', 'Narrow neck suits small hands'], watch: ['Strings are hard on the fingers at first', 'A big body can be awkward to hold'] },
    { name: 'Electric', text: 'Thin body, light strings, needs an amplifier. Rock, blues, funk and most jazz.', good: ['Easiest to press down', 'Silent practice through headphones'], watch: ['An amplifier and lead are extra', 'Every small noise is amplified too'] },
  ]);
  G.Figures = { guitar, kinds };
})();
