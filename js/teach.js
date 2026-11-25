// Teaching layouts: the parts a lesson step can add around its text. Lesson opener, chord box with a key, numbered
// step strip, "what to look for" panel, tip, and a tab strip whose marked moments are tied to pictures of the hand.
// The rules for each are in the design system ("Teaching layouts").
(() => {
  'use strict';
  const G = (window.G = window.G || {});
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const NUT = [20, 10, 300, 200]; // the part of the neck drawing around the nut and the first four frets
  let specs = []; // neck pictures waiting to be drawn once the markup is on the page

  // Chord box: strings left to right 6 to 1, the heavy line is the nut, × not played, ○ open, numbered dots are fingers.
  // frets and fingers are arrays from string 6 to string 1 (null = not played).
  function chordBox({ frets, fingers = [], labels = false, name = '' }) {
    const sx = 22, fy = 26, x0 = labels ? 132 : 14, y0 = 34, w = sx * 5, h = fy * 4, W = labels ? 400 : w + 28, H = y0 + h + 14;
    let s = `<svg class="tl-box" viewBox="0 0 ${W} ${H}" role="img" aria-label="Chord box${name ? ' for ' + esc(name) : ''}">`;
    for (let i = 0; i < 6; i++) s += `<line class="g" x1="${x0 + i * sx}" y1="${y0}" x2="${x0 + i * sx}" y2="${y0 + h}"/>`;
    for (let r = 1; r <= 4; r++) s += `<line class="g" x1="${x0}" y1="${y0 + r * fy}" x2="${x0 + w}" y2="${y0 + r * fy}"/>`;
    s += `<line class="nut" x1="${x0 - 0.6}" y1="${y0}" x2="${x0 + w + 0.6}" y2="${y0}"/>`;
    frets.forEach((f, i) => {
      const cx = x0 + i * sx;
      if (f === null) s += `<text class="mk" x="${cx}" y="${y0 - 10}" font-size="14">×</text>`;
      else if (f === 0) s += `<circle class="op" cx="${cx}" cy="${y0 - 14}" r="5"/>`;
      else s += `<circle class="fd" cx="${cx}" cy="${y0 + (f - 0.5) * fy}" r="9"/><text class="fn" x="${cx}" y="${y0 + (f - 0.5) * fy + 4}" font-size="11">${fingers[i] || ''}</text>`;
    });
    if (labels) {
      const L = (x1, y1, x2, y2, nm, note, anchor) => `<line class="ld" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><circle class="dt" cx="${x1}" cy="${y1}" r="2"/><text class="nm" x="${x2 + (anchor === 'end' ? -5 : 5)}" y="${y2 + 1}" text-anchor="${anchor}">${nm}</text><text class="nt" x="${x2 + (anchor === 'end' ? -5 : 5)}" y="${y2 + 13}" text-anchor="${anchor}">${note}</text>`;
      const firstX = frets.indexOf(null), firstO = frets.indexOf(0), dot = frets.findIndex((f) => f > 0);
      if (firstX >= 0) s += L(x0 + firstX * sx, y0 - 14, x0 - 26, y0 - 22, 'Don’t play', 'mute or miss it', 'end');
      if (firstO >= 0) s += L(x0 + firstO * sx + 6, y0 - 14, x0 + w + 30, y0 - 22, 'Open string', 'played, not fretted', 'start');
      s += L(x0 + w, y0, x0 + w + 30, y0 + 12, 'Nut', 'the heavy top line', 'start');
      s += L(x0 + w, y0 + 2 * fy, x0 + w + 30, y0 + 2 * fy + 6, 'Fret wire', 'second fret', 'start');
      if (dot >= 0) s += L(x0 + dot * sx - 9, y0 + (frets[dot] - 0.5) * fy, x0 - 26, y0 + (frets[dot] - 0.5) * fy + 4, 'Finger number', '1 index · 4 little', 'end');
      s += L(x0, y0 + h, x0 - 26, y0 + h - 4, 'String 6', 'the thickest', 'end');
    }
    return s + '</svg>';
  }

  // Tab strip. notes: [[beat 0..7, string 1..6, fret], …] over two bars of four beats; moments: [{ beat }] get a keyed band.
  function tab({ notes, moments = [] }) {
    const W = 880, x0 = 96, step = 92, ty = 34, gap = 13, H = ty + 5 * gap + 66;
    const X = (b) => x0 + b * step + (b >= 4 ? 26 : 0), end = X(7) + 60, mid = (X(3) + X(4)) / 2;
    let s = `<svg class="tl-strip" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tablature, four beats in a bar">`;
    moments.forEach((m, k) => { s += `<rect class="k${k + 1}" x="${X(m.beat) - 11}" y="${ty - 10}" width="22" height="${5 * gap + 20}" rx="3" opacity=".34"/>`; });
    for (let i = 0; i < 6; i++) s += `<line class="ln" x1="24" y1="${ty + i * gap}" x2="${end}" y2="${ty + i * gap}"/>`;
    [24, mid, end].forEach((x) => { s += `<line class="bar" x1="${x}" y1="${ty}" x2="${x}" y2="${ty + 5 * gap}"/>`; });
    'TAB'.split('').forEach((c, i) => { s += `<text class="tab" x="38" y="${ty + 15 + i * 20}">${c}</text>`; });
    s += `<text class="ts" x="74" y="${ty + 28}">4</text><text class="ts" x="74" y="${ty + 54}">4</text>`;
    notes.forEach(([b, str, fr]) => {
      const cx = X(b), cy = ty + (str - 1) * gap;
      s += `<rect class="ko" x="${cx - 7}" y="${cy - 7}" width="14" height="14"/><text class="fr" x="${cx}" y="${cy + 4.5}">${fr}</text>`;
    });
    [...new Set(notes.map((n) => n[0]))].forEach((b) => { s += `<line class="stem" x1="${X(b)}" y1="${ty + 5 * gap + 6}" x2="${X(b)}" y2="${ty + 5 * gap + 28}"/><text class="ct" x="${X(b)}" y="${ty + 5 * gap + 46}">${(b % 4) + 1}</text>`; });
    moments.forEach((m, k) => { s += `<rect class="k${k + 1} kb" x="${X(m.beat) - 8}" y="${ty + 5 * gap + 52}" width="16" height="12" rx="2"/><text class="kn${k === 1 ? ' dark' : ''}" x="${X(m.beat)}" y="${ty + 5 * gap + 62}">${k + 1}</text>`; });
    return s + '</svg>';
  }

  const pic = (neck, box) => { specs.push({ neck, box: box || NUT }); return `<div class="tl-pic" data-tl-neck="${specs.length - 1}"></div>`; };
  const list = (items) => `<ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>`;

  G.Teach = {
    chordBox, tab,
    // the plate that opens a lesson: number, two-weight title, what is inside
    opener(L, n) {
      const words = String(L.title).split(' '), key = words.pop(), lead = words.join(' ');
      return `<div class="tl-open"><div class="tl-plate"><div class="tl-eyebrow">lesson ${n}</div>
        <div class="tl-title">${lead ? `<span>${esc(lead)}</span>` : ''}<b>${esc(key)}</b></div>
        <ol class="tl-contents">${L.steps.map((s, k) => `<li><button data-act="step" data-i="${k}">${s.title}</button></li>`).join('')}</ol></div>
        <p class="tl-lead">${L.lede}</p></div>`;
    },
    // everything a step adds beyond its text, in reading order
    extras(st) {
      let h = '';
      if (st.box) h += `<div class="tl-boxrow"><figure class="tl-small"><figcaption class="tl-eyebrow">${esc(st.box.name || '')}</figcaption>${chordBox(st.box)}</figure>${st.box.key ? `<figure class="tl-big">${chordBox(Object.assign({}, st.box, { labels: true }))}</figure>` : ''}</div>`;
      if (st.steps) h += `<div class="tl-steps">${st.steps.map((s, k) => `<div class="tl-step"><span class="n">${k + 1}</span><p>${s.text}</p>${pic(s.neck, s.box)}</div>`).join('')}</div>`;
      if (st.strip) h += `<div class="tl-stripwrap">${st.strip.title ? `<div class="tl-eyebrow">${esc(st.strip.title)}</div>` : ''}${tab(st.strip)}</div>` +
        ((st.strip.moments || []).length ? `<div class="tl-bar">Here’s how</div><div class="tl-how">${st.strip.moments.map((m, k) => `<div><div class="tl-pic-wrap">${pic(m.neck, m.box)}<span class="tl-key k${k + 1}">${k + 1}</span></div><p><span class="tl-key k${k + 1}">${k + 1}</span>${m.text}</p></div>`).join('')}</div>` : '');
      if (st.look) h += `<div class="tl-panel"><div class="tl-eyebrow">What to look for</div>${list(st.look)}</div>`;
      if (st.aside) h += `<div class="tl-tip"><div class="tl-eyebrow">Tip</div><b>${st.aside.title}</b><p>${st.aside.text}</p></div>`;
      return h ? `<div class="tl">${h}</div>` : '';
    },
    // draw the neck pictures the markup above asked for
    mount(root) {
      (root || document).querySelectorAll('[data-tl-neck]').forEach((el) => {
        const sp = specs[+el.dataset.tlNeck];
        if (!sp || el.firstChild || !G.Neck) return;
        const spec = typeof sp.neck === 'function' ? sp.neck() : sp.neck;
        G.Neck(el).show(spec);
        const svg = el.querySelector('svg');
        if (svg) { svg.setAttribute('viewBox', sp.box.join(' ')); svg.setAttribute('aria-hidden', 'true'); }
      });
    },
    reset() { specs = []; },
  };
})();
