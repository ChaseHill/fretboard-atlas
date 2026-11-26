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

  // Notation strip. notes: [[beat 0..7, string 1..6, fret], …] over two bars of four beats; moments: [{ beat }] get a keyed band.
  // Each bar is its own drawing, so on a narrow screen the strip wraps at the bar line and never scrolls sideways.
  function tab({ notes, moments = [] }) {
    const step = 84, ty = 34, gap = 13, H = ty + 5 * gap + 66;
    const bars = [0, 1].filter((b) => b === 0 || notes.some((n) => n[0] >= 4));
    return '<div class="tl-bars">' + bars.map((b) => {
      const lead = b === 0 ? 96 : 44, X = (beat) => lead + (beat - b * 4) * step, W = lead + 3 * step + 52;
      let s = `<svg class="tl-strip" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tablature, bar ${b + 1}, four beats">`;
      moments.forEach((m, k) => { if (Math.floor(m.beat / 4) === b) s += `<rect class="k${k + 1}" x="${X(m.beat) - 9}" y="${ty - 10}" width="18" height="${5 * gap + 20}" rx="3" opacity=".3"/>`; });
      for (let i = 0; i < 6; i++) s += `<line class="ln" x1="14" y1="${ty + i * gap}" x2="${W - 8}" y2="${ty + i * gap}"/>`;
      [14, W - 8].forEach((x) => { s += `<line class="bar" x1="${x}" y1="${ty}" x2="${x}" y2="${ty + 5 * gap}"/>`; });
      if (b === 0) { 'TAB'.split('').forEach((c, i) => { s += `<text class="tab" x="30" y="${ty + 15 + i * 20}">${c}</text>`; }); s += `<text class="ts" x="64" y="${ty + 28}">4</text><text class="ts" x="64" y="${ty + 54}">4</text>`; }
      const mine = notes.filter((n) => Math.floor(n[0] / 4) === b);
      mine.forEach(([bt, str, fr]) => { const cx = X(bt), cy = ty + (str - 1) * gap; s += `<rect class="ko" x="${cx - 7}" y="${cy - 7}" width="14" height="14"/><text class="fr" x="${cx}" y="${cy + 4.5}">${fr}</text>`; });
      [...new Set(mine.map((n) => n[0]))].forEach((bt) => { s += `<line class="stem" x1="${X(bt)}" y1="${ty + 5 * gap + 6}" x2="${X(bt)}" y2="${ty + 5 * gap + 28}"/><text class="ct" x="${X(bt)}" y="${ty + 5 * gap + 46}">${(bt % 4) + 1}</text>`; });
      moments.forEach((m, k) => { if (Math.floor(m.beat / 4) === b) s += `<rect class="k${k + 1} kb" x="${X(m.beat) - 8}" y="${ty + 5 * gap + 52}" width="16" height="12" rx="2"/><text class="kn${k === 1 ? ' dark' : ''}" x="${X(m.beat)}" y="${ty + 5 * gap + 62}">${k + 1}</text>`; });
      return s + '</svg>';
    }).join('') + '</div>';
  }

  // Staff over tab, one drawing per bar so it wraps on a narrow screen. t: { notes: [[string 1..6 (0 = rest), fret, beats], …], time, pickup }.
  // Guitar music is written an octave above where it sounds, so the open first string sits in the top space.
  function score(t) {
    const T = G.T, time = t.time || 4, bars = [], INK = 'var(--ink)', step = 46, sy = 80, ty = 134, tg = 11;
    let cur = [], pos = 0, left = t.pickup || time, first = true;
    let full = 0;
    t.notes.forEach(([s, f, d]) => { cur.push({ s, f, d, at: pos }); pos += d; left -= d; if (left <= 1e-6) { const pick = first && !!t.pickup; bars.push({ notes: cur, len: pos, pick, chords: pick || !t.chords ? null : t.chords[full] }); if (!pick) full++; cur = []; pos = 0; left = time; first = false; } });
    if (cur.length) bars.push({ notes: cur, len: pos, chords: t.chords ? t.chords[full] : null });
    return '<div class="tl-bars">' + bars.map((b, bi) => {
      const lead = bi === 0 ? 76 : 26, W = 76 + time * step + 14, X = (at) => lead + at * ((W - lead - 14) / time) + 12, H = t.noTab ? 128 : 222, // without the tab, the drawing is cut off below the staff
        off = b.pick ? time - t.pickup : 0;
      let s = `<svg class="tl-strip tl-score" viewBox="0 0 ${W} ${H}" role="img" aria-label="Staff and tablature, bar ${bi + 1}">`;
      for (let i = 0; i < 5; i++) s += `<line class="ln" x1="8" y1="${sy - i * 10}" x2="${W - 6}" y2="${sy - i * 10}"/>`;
      for (let i = 0; i < 6; i++) s += `<line class="ln" x1="8" y1="${ty + i * tg}" x2="${W - 6}" y2="${ty + i * tg}"/>`;
      [8, W - 6].forEach((x) => { s += `<line class="bar" x1="${x}" y1="${sy - 40}" x2="${x}" y2="${sy}"/><line class="bar" x1="${x}" y1="${ty}" x2="${x}" y2="${ty + 5 * tg}"/>`; });
      (b.chords || []).forEach((c, k, a) => { s += `<text class="fr" x="${X(k * time / a.length)}" y="16" style="font-size:13px">${esc(c)}</text>`; });
      if (bi === 0) {
        s += `<text x="12" y="${sy - 1}" font-size="44" style="font-family:'Segoe UI Symbol','Noto Music','Apple Symbols',serif">𝄞</text><text class="ts" x="60" y="${sy - 21}">${time}</text><text class="ts" x="60" y="${sy - 1}">4</text>`;
        'TAB'.split('').forEach((c, i) => { s += `<text class="tab" x="22" y="${ty + 14 + i * 16}">${c}</text>`; });
      }
      b.notes.forEach((n) => {
        const cx = X(n.at), beat = n.at + off, whole = Math.abs(beat - Math.round(beat)) < 1e-6;
        s += `<text class="ct" x="${cx}" y="${H - 8}">${whole ? (Math.round(beat) % time) + 1 : Math.abs(beat % 1 - 0.5) < 1e-6 ? '&amp;' : ''}</text>`;
        if (!n.s) { // a rest
          const my = sy - 20;
          if (n.d >= 4 - 1e-6 || (n.d >= time - 1e-6)) s += `<rect x="${cx - 6}" y="${my - 10}" width="12" height="5" fill="${INK}"/>`;
          else if (n.d >= 2) s += `<rect x="${cx - 6}" y="${my - 5}" width="12" height="5" fill="${INK}"/>`;
          else if (n.d >= 1) s += `<path d="M${cx - 3} ${my - 12} l6 8 l-6 6 l6 8 q-8 -3 -4 7" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
          else s += `<path d="M${cx - 4} ${my - 4} q5 3 8 -1 l-5 15" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/><circle cx="${cx - 3}" cy="${my - 4}" r="2.2" fill="${INK}"/>`;
          return;
        }
        const midi = T.TUNING[6 - n.s] + n.f + 12, nm = T.noteName(midi), st = (Math.floor(midi / 12) - 1) * 7 + 'CDEFGAB'.indexOf(nm[0]), cy = sy - (st - 30) * 5, up = st < 34;
        for (let k = 28; k >= st; k -= 2) s += `<line class="bar" x1="${cx - 10}" y1="${sy - (k - 30) * 5}" x2="${cx + 10}" y2="${sy - (k - 30) * 5}"/>`;
        for (let k = 40; k <= st; k += 2) s += `<line class="bar" x1="${cx - 10}" y1="${sy - (k - 30) * 5}" x2="${cx + 10}" y2="${sy - (k - 30) * 5}"/>`;
        if (nm.length > 1) s += `<text x="${cx - 17}" y="${cy + 5}" font-size="15" style="font-family:serif">${nm[1]}</text>`;
        s += `<ellipse cx="${cx}" cy="${cy}" rx="6.2" ry="4.4" transform="rotate(-20 ${cx} ${cy})" fill="${n.d >= 2 ? 'var(--paper, var(--card))' : INK}" stroke="${INK}" stroke-width="1.6"/>`;
        if (n.d < 4 - 1e-6 && !(n.d === 3 && time === 3 && false)) {
          const x = up ? cx + 5.7 : cx - 5.7, y2 = up ? cy - 31 : cy + 31;
          if (n.d !== 4) s += `<line class="stem" x1="${x}" y1="${cy + (up ? -1.5 : 1.5)}" x2="${x}" y2="${y2}"/>`;
          if (n.d < 1) s += `<path d="M${x} ${y2} q9 ${up ? 6 : -6} 6 ${up ? 17 : -17}" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`;
        }
        if (Math.abs(n.d - 1.5) < 1e-6 || Math.abs(n.d - 3) < 1e-6) s += `<circle cx="${cx + 11}" cy="${cy - (st % 2 ? 0 : 5)}" r="1.9" fill="${INK}"/>`;
        const y = ty + (n.s - 1) * tg;
        s += `<rect class="ko" x="${cx - 7}" y="${y - 7}" width="14" height="14"/><text class="fr" x="${cx}" y="${y + 4.5}">${n.f}</text>`;
      });
      return s + '</svg>';
    }).join('') + '</div>';
  }

  const pic = (neck, box) => { specs.push({ neck, box: box || NUT }); return `<div class="tl-pic" data-tl-neck="${specs.length - 1}"></div>`; };
  const list = (items) => `<ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>`;

  G.Teach = {
    chordBox, tab, score,
    // the plate that opens a lesson: number, two-weight title, what is inside
    opener(L, n, tint) {
      const words = String(L.title).split(' '), key = words.pop(), lead = words.join(' '), first = L.steps[0];
      // the first step's text in two short columns, split between sentences
      const sentences = String(first.body).match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [first.body], half = Math.ceil(sentences.length / 2);
      specs.push({ neck: { notes: [] }, box: [0, 0, 800, 545] });
      return `<div class="tl tl-open"><div class="tl-plate"${tint ? ` style="--tint:${tint}"` : ''}><div class="ghost" data-tl-neck="${specs.length - 1}"></div>
        <div class="tl-eyebrow">lesson ${n}</div>
        <h2 class="tl-title">${lead ? `<span>${esc(lead)}</span>` : ''}<b>${esc(key)}</b></h2>
        <div class="tl-contents">${L.steps.map((s, k) => `<button data-act="step" data-i="${k}">${s.title}</button>`).join('')}</div></div>
        <div class="tl-open-side"><p class="tl-lead">${L.lede}</p>
          <h3 class="tl-h"><small>Step ${n}.1</small>${first.title}</h3>
          <div class="tl-cols tl-two"><p>${sentences.slice(0, half).join('').trim()}</p>${sentences.length > 1 ? `<p>${sentences.slice(half).join('').trim()}</p>` : ''}</div></div></div>`;
    },
    // everything a step adds beyond its text, in reading order
    extras(st) {
      let h = '';
      if (st.box) h += `<div class="tl-boxrow"><figure class="tl-small"><figcaption class="tl-eyebrow">${esc(st.box.name || '')}</figcaption>${chordBox(st.box)}</figure>${st.box.key ? `<figure class="tl-big">${chordBox(Object.assign({}, st.box, { labels: true }))}</figure>` : ''}</div>`;
      if (st.steps) h += `<div class="tl-steps">${st.steps.map((s, k) => `<div class="tl-step"><span class="n">${k + 1}</span><p>${s.text}</p>${s.neck ? pic(s.neck, s.box) : ''}</div>`).join('')}</div>`;
      if (st.strip) h += `<div class="tl-stripwrap">${st.strip.title ? `<div class="tl-eyebrow">${esc(st.strip.title)}</div>` : ''}${tab(st.strip)}</div>` +
        ((st.strip.moments || []).length ? `<div class="tl-bar">Here’s how</div><div class="tl-how">${st.strip.moments.map((m, k) => `<div><div class="tl-pic-wrap">${pic(m.neck, m.box)}<span class="tl-key k${k + 1}">${k + 1}</span></div><p><span class="tl-key k${k + 1}">${k + 1}</span>${m.text}</p></div>`).join('')}</div>` : '');
      if (st.score) h += `<div class="tl-stripwrap"><div class="tl-eyebrow">${esc(st.score.title)}${st.score.credit ? ' · ' + esc(st.score.credit) : ''}</div>${score(st.score)}</div>`;
      if (st.how) h += `<div class="tl-steps tl-steps-text">${st.how.map((t, k) => `<div class="tl-step"><span class="n">${k + 1}</span><p>${t}</p></div>`).join('')}</div>`;
      if (st.facts) h += `<div class="tl-panel">${st.facts.map(([head, items]) => `<div class="tl-eyebrow">${esc(head)}</div>${list(items)}`).join('')}</div>`;
      if (st.look) h += `<div class="tl-panel"><div class="tl-eyebrow">What to look for</div>${list(st.look)}</div>`;
      if (st.aside) h += `<div class="tl-tip"><div class="tl-eyebrow">Tip</div><b>${st.aside.title}</b><p>${st.aside.text}</p></div>`;
      if (st.tip) h += `<div class="tl-tip"><div class="tl-eyebrow">Tip</div><p>${st.tip}</p></div>`;
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
