// Keyed moments under the neck (design system: Notation strip + Keyed moments). Whatever the neck is showing is written
// as tablature; each moment in it (one hand position) gets a soft band in a key colour, and below the strip, under a
// "Here's how" bar, one picture per moment carries the same number and colour with a short caption.
// Tap a beat to hear it; tap a picture to hear that whole moment.
(() => {
  'use strict';
  const G = (window.G = window.G || {});
  const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'], FING = ['', 'index', 'middle', 'ring', 'little'];
  let cols = [], moments = [], pics = [];

  // What to write: an ordered sequence as it is played; a chord as the whole shape, then one string at a time;
  // one position of a scale as a run from its lowest note to its highest. Whole-neck maps are not tab.
  function columns(spec) {
    const T = G.T, pitch = (n) => T.TUNING[n.s] + n.f, live = (spec.notes || []).filter((n) => !n.dim && n.f != null);
    if (spec.seq && spec.seq.length) return spec.seq.slice(0, 16).map((n) => ({ notes: [n] }));
    if (spec.byPitch || !live.length || live.length > 24) return [];
    const perString = new Set(live.map((n) => n.s)).size === live.length;
    const run = live.slice().sort((a, b) => pitch(a) - pitch(b) || a.s - b.s).map((n) => ({ notes: [n] }));
    return perString && live.length <= 6 && live.length > 1 ? [{ notes: live.slice().sort((a, b) => a.s - b.s), chord: true }].concat(run) : run;
  }
  // The moments: for a chord, the shape itself; otherwise one per string the line visits, in order, six at most.
  function findMoments(list) {
    const out = [], str = (n) => 6 - n.s, frets = (ns) => [...new Set(ns.map((n) => n.f))].sort((a, b) => a - b).map((f) => (f === 0 ? 'open' : f)).join(', ');
    if (list[0] && list[0].chord) {
      const ns = list[0].notes, fr = ns.filter((n) => n.f > 0).map((n) => n.f), lo = fr.length ? Math.min(...fr) : 0, hi = fr.length ? Math.max(...fr) : 0;
      out.push({ at: 0, cols: [0], notes: ns, text: `<b>The whole shape.</b> Strings ${str(ns[0])} to ${str(ns[ns.length - 1])}${fr.length ? `, ${lo === hi ? 'fret ' + lo : 'frets ' + lo + ' to ' + hi}` : ', all open'}. Place every finger before you play.` });
      return out;
    }
    list.forEach((c, k) => {
      const n = c.notes[0], last = out[out.length - 1];
      if (last && last.s === n.s) { last.cols.push(k); last.notes.push(n); } else out.push({ at: k, cols: [k], notes: [n], s: n.s });
    });
    if (out.length > 6) return []; // too many hand positions for one strip: show the tab without keys
    out.forEach((m, i) => { m.text = `<b>String ${str(m.notes[0])}.</b> ${m.notes.length > 1 ? 'Frets' : m.notes[0].f === 0 ? 'Played' : 'Fret'} ${frets(m.notes)}${i ? '' : ': start here'}.`; });
    return out;
  }
  // the part of the neck drawing around a set of notes, at the size the design's pictures use
  function box(notes) {
    const fs = notes.map((n) => n.f), mid = (Math.min(...fs) + Math.max(...fs)) / 2, x = mid <= 0 ? -22.5 : (mid - 0.5) * 42, cx = 170 + (x - 60) * 0.866, cy = 44 + (x + 60) * 0.5;
    return [Math.max(0, Math.round(cx - 150)), Math.max(0, Math.round(cy - 96)), 300, 200];
  }
  function draw(el, spec) {
    cols = columns(spec); moments = []; pics = [];
    const lay = document.getElementById('layout'), keysOnly = lay && lay.dataset.show === 'keys';
    if (!cols.length || keysOnly) { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;
    moments = findMoments(cols);
    const keyOf = {}; moments.forEach((m, i) => { keyOf[m.at] = i; });
    const step = 84, ty = 34, gap = 13, H = ty + 5 * gap + 66, bars = [];
    for (let i = 0; i < cols.length; i += 4) bars.push(cols.slice(i, i + 4));
    const svgs = bars.map((bar, b) => {
      const lead = b === 0 ? 96 : 44, X = (j) => lead + j * step, W = lead + 3 * step + 52;
      let s = `<svg class="tl-strip" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tablature, bar ${b + 1}">`;
      bar.forEach((c, j) => { const k = b * 4 + j; if (keyOf[k] != null) s += `<rect class="k${keyOf[k] + 1}" x="${X(j) - 9}" y="${ty - 10}" width="18" height="${5 * gap + 20}" rx="3" opacity=".3"/>`; });
      for (let i = 0; i < 6; i++) s += `<line class="ln" x1="14" y1="${ty + i * gap}" x2="${W - 8}" y2="${ty + i * gap}"/>`;
      [14, W - 8].forEach((x) => { s += `<line class="bar" x1="${x}" y1="${ty}" x2="${x}" y2="${ty + 5 * gap}"/>`; });
      if (b === 0) { 'TAB'.split('').forEach((ch, i) => { s += `<text class="tab" x="30" y="${ty + 15 + i * 20}">${ch}</text>`; }); s += `<text class="ts" x="64" y="${ty + 28}">4</text><text class="ts" x="64" y="${ty + 54}">4</text>`; }
      bar.forEach((c, j) => {
        const k = b * 4 + j;
        c.notes.forEach((n) => { const cy = ty + (5 - n.s) * gap, t = String(n.f); s += `<rect class="ko" x="${X(j) - 4 - t.length * 3}" y="${cy - 7}" width="${8 + t.length * 6}" height="14"/><text class="fr" x="${X(j)}" y="${cy + 4.5}">${t}</text>`; });
        s += `<line class="stem" x1="${X(j)}" y1="${ty + 5 * gap + 6}" x2="${X(j)}" y2="${ty + 5 * gap + 28}"/><text class="ct" x="${X(j)}" y="${ty + 5 * gap + 46}">${j + 1}</text>`;
        if (keyOf[k] != null) s += `<rect class="k${keyOf[k] + 1} kb" x="${X(j) - 8}" y="${ty + 5 * gap + 52}" width="16" height="12" rx="2"/><text class="kn${keyOf[k] === 1 ? ' dark' : ''}" x="${X(j)}" y="${ty + 5 * gap + 62}">${keyOf[k] + 1}</text>`;
        s += `<rect class="tab-hit" data-k="${k}" x="${X(j) - 20}" y="${ty - 12}" width="40" height="${5 * gap + 60}" rx="4"/>`;
      });
      return s + '</svg>';
    });
    const title = spec.seq && spec.seq.length ? 'In the order it is played' : cols[0].chord ? 'The whole shape, then one string at a time' : 'From the lowest note to the highest';
    const how = moments.length ? `<div class="tl-bar">Here’s how</div><div class="tl-how">${moments.map((m, i) => {
      pics.push({ notes: m.notes.map((n) => ({ s: n.s, f: n.f, role: n.role || 'ext', label: n.label })), box: box(m.notes) });
      return `<div class="tab-moment" data-m="${i}"><div class="tl-pic-wrap"><div class="tl-pic" data-tab-pic="${i}"></div><span class="tl-key k${i + 1}">${i + 1}</span></div><p><span class="tl-key k${i + 1}">${i + 1}</span>${m.text}</p></div>`;
    }).join('')}</div>` : '';
    el.innerHTML = `<div class="tl"><div class="tl-eyebrow" style="margin-bottom: 6px">${title}</div><div class="tl-bars">${svgs.join('')}</div>${how}</div>`;
    // the pictures: the same neck drawing, cropped to the moment
    if (G.Neck) el.querySelectorAll('[data-tab-pic]').forEach((d) => {
      const p = pics[+d.dataset.tabPic];
      G.Neck(d).show({ notes: p.notes, mute: false });
      const svg = d.querySelector('svg'); if (svg) { svg.setAttribute('viewBox', p.box.join(' ')); svg.setAttribute('aria-hidden', 'true'); }
    });
  }
  function sound(list) {
    const A = G.Audio, T = G.T, neck = G.App && G.App.neck;
    if (!A || !A.resume()) return;
    let t = A.now() + 0.02;
    list.forEach((k) => { const c = cols[k]; if (!c) return; c.notes.forEach((n, i) => { const at = t + i * (c.chord ? 0.035 : 0); A.pluck(T.TUNING[n.s] + n.f, at, 0.9, n.s); if (neck && neck.pulse) A.at(at, () => neck.pulse(n.s, n.f)); }); t += 0.34; });
  }
  G.Tab = {
    columns, findMoments,
    update(spec) { const el = typeof document !== 'undefined' && document.getElementById('tabstrip'); if (el) draw(el, spec || {}); },
  };
  if (typeof document === 'undefined') return;
  document.addEventListener('click', (e) => {
    const hit = e.target.closest && e.target.closest('.tab-hit'), mom = e.target.closest && e.target.closest('.tab-moment');
    if (hit) { document.querySelectorAll('.tab-hit.on').forEach((n) => n.classList.remove('on')); hit.classList.add('on'); sound([+hit.dataset.k]); }
    else if (mom && moments[+mom.dataset.m]) sound(moments[+mom.dataset.m].cols);
  });
})();
