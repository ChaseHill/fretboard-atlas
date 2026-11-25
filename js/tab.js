// Tab strip: whatever the neck is showing, written as tablature under it. Six lines are the six strings (string 1 on top,
// as tab is always written), a number is the fret to press, and columns are read left to right. Tap a column to hear it
// and see it flash on the neck. Numbered markers above the columns match the order the notes are played in.
(() => {
  'use strict';
  const G = (window.G = window.G || {});
  const NAMES = ['e', 'B', 'G', 'D', 'A', 'E']; // top line to bottom line
  const X0 = 40, CW = 30, Y0 = 26, LH = 12.5;
  let cols = [];

  // Decide what to write: an ordered sequence as it is played; a chord as one stacked column, then its notes one by one;
  // a position of a scale as a run from the lowest note to the highest. Whole-neck maps are not tab, so they are left out.
  function columns(spec) {
    const T = G.T, pitch = (n) => T.TUNING[n.s] + n.f, live = (spec.notes || []).filter((n) => !n.dim && n.f != null);
    if (spec.seq && spec.seq.length) return spec.seq.slice(0, 16).map((n) => ({ notes: [n] }));
    if (spec.byPitch || !live.length || live.length > 24) return [];
    const perString = new Set(live.map((n) => n.s)).size === live.length;
    const run = live.slice().sort((a, b) => pitch(a) - pitch(b) || a.s - b.s).map((n) => ({ notes: [n] }));
    return perString && live.length <= 6 && live.length > 1 ? [{ notes: live.slice().sort((a, b) => a.s - b.s), chord: true }].concat(run) : run;
  }
  function draw(el, spec) {
    cols = columns(spec);
    const lay = document.getElementById('layout'), keysOnly = lay && lay.dataset.show === 'keys';
    if (!cols.length || keysOnly) { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;
    // Notation strip (design system): T A B at the left edge, the time signature drawn large, fret numbers on a
    // knock-out so the line does not run through them, a stem and a count under every beat. One bar per drawing, so the
    // strip wraps at bar lines and never scrolls sideways.
    const step = 84, ty = 34, gap = 13, H = ty + 5 * gap + 52, bars = [];
    for (let i = 0; i < cols.length; i += 4) bars.push(cols.slice(i, i + 4));
    const svgs = bars.map((bar, b) => {
      const lead = b === 0 ? 96 : 44, X = (j) => lead + j * step, W = lead + 3 * step + 52;
      let s = `<svg class="tl-strip" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tablature, bar ${b + 1}">`;
      bar.forEach((c, j) => { s += `<rect class="tab-hit" data-k="${b * 4 + j}" x="${X(j) - 20}" y="${ty - 12}" width="40" height="${5 * gap + 60}" rx="4"/>`; });
      for (let i = 0; i < 6; i++) s += `<line class="ln" x1="14" y1="${ty + i * gap}" x2="${W - 8}" y2="${ty + i * gap}"/>`;
      [14, W - 8].forEach((x) => { s += `<line class="bar" x1="${x}" y1="${ty}" x2="${x}" y2="${ty + 5 * gap}"/>`; });
      if (b === 0) { 'TAB'.split('').forEach((ch, i) => { s += `<text class="tab" x="30" y="${ty + 15 + i * 20}">${ch}</text>`; }); s += `<text class="ts" x="64" y="${ty + 28}">4</text><text class="ts" x="64" y="${ty + 54}">4</text>`; }
      bar.forEach((c, j) => {
        c.notes.forEach((n) => { const cy = ty + (5 - n.s) * gap, t = String(n.f); s += `<rect class="ko" x="${X(j) - 4 - t.length * 3}" y="${cy - 7}" width="${8 + t.length * 6}" height="14"/><text class="fr" x="${X(j)}" y="${cy + 4.5}">${t}</text>`; });
        s += `<line class="stem" x1="${X(j)}" y1="${ty + 5 * gap + 6}" x2="${X(j)}" y2="${ty + 5 * gap + 28}"/><text class="ct" x="${X(j)}" y="${ty + 5 * gap + 46}">${j + 1}</text>`;
      });
      return s + '</svg>';
    });
    const what = spec.seq && spec.seq.length ? 'In the order it is played' : cols[0].chord ? 'The whole shape, then one string at a time' : 'From the lowest note to the highest';
    el.innerHTML = `<div class="tl"><div class="tl-eyebrow" style="margin-bottom: 6px">${what}</div><div class="tl-bars">${svgs.join('')}</div></div>`;
  }
  function sound(k) {
    const c = cols[k], A = G.Audio, T = G.T, neck = G.App && G.App.neck;
    if (!c || !A || !A.resume()) return;
    const t0 = A.now() + 0.02;
    c.notes.forEach((n, i) => { const at = t0 + i * (c.chord ? 0.035 : 0); A.pluck(T.TUNING[n.s] + n.f, at, 0.9, n.s); if (neck && neck.pulse) A.at(at, () => neck.pulse(n.s, n.f)); });
  }
  G.Tab = {
    columns,
    update(spec) { const el = typeof document !== 'undefined' && document.getElementById('tabstrip'); if (el) draw(el, spec || {}); },
  };
  if (typeof document === 'undefined') return;
  document.addEventListener('click', (e) => {
    const g = e.target.closest && e.target.closest('.tab-hit');
    if (!g) return;
    document.querySelectorAll('.tab-hit.on').forEach((n) => n.classList.remove('on'));
    g.classList.add('on'); sound(+g.dataset.k);
  });
})();
