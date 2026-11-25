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
    const W = X0 + cols.length * CW + 14, H = Y0 + 5 * LH + 16;
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="The same notes written as tablature">`;
    for (let i = 0; i < 6; i++) s += `<line class="tab-line" x1="26" y1="${Y0 + i * LH}" x2="${W - 6}" y2="${Y0 + i * LH}"/><text class="tab-name" x="12" y="${Y0 + i * LH + 3}">${NAMES[i]}</text>`;
    s += `<line class="tab-bar" x1="26" y1="${Y0}" x2="26" y2="${Y0 + 5 * LH}"/><line class="tab-bar" x1="${W - 6}" y1="${Y0}" x2="${W - 6}" y2="${Y0 + 5 * LH}"/>`;
    let step = 0;
    cols.forEach((c, k) => {
      const x = X0 + k * CW + CW / 2, first = c.notes[0];
      s += `<g class="tab-col" data-k="${k}"><rect class="hit" x="${x - CW / 2 + 1}" y="2" width="${CW - 2}" height="${H - 4}" rx="5"/>`;
      s += c.chord ? `<text class="tab-name" x="${x}" y="11">all</text>` : `<g class="tab-step r-${first.role || 'ext'}"><circle cx="${x}" cy="9" r="7"/><text x="${x}" y="12">${++step}</text></g>`;
      c.notes.forEach((n) => { const y = Y0 + (5 - n.s) * LH, t = String(n.f); s += `<g class="tab-num"><rect x="${x - 4 - t.length * 2.6}" y="${y - 6}" width="${8 + t.length * 5.2}" height="12" rx="2"/><text x="${x}" y="${y + 4}">${t}</text></g>`; });
      s += '</g>';
    });
    el.innerHTML = `<div class="tab-cap"><span><b>Tab</b> · lines are strings (thin string on top), numbers are frets</span><span>tap a column to hear it</span></div>${s}</svg>`;
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
    const g = e.target.closest && e.target.closest('.tab-col');
    if (!g) return;
    document.querySelectorAll('.tab-col.on').forEach((n) => n.classList.remove('on'));
    g.classList.add('on'); sound(+g.dataset.k);
  });
})();
