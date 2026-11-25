// Phone layout helper: the list of lessons and chords opens as a drawer. (The neck keeps its own notes in view: see show() in neck.js.)
(() => {
  'use strict';
  // the phone's browser bar takes the page's own paper colour, in light and dark
  const tc = document.querySelector('meta[name="theme-color"]');
  if (tc) { const paint = () => { const c = getComputedStyle(document.documentElement).getPropertyValue('--paper-2').trim(); if (c) tc.setAttribute('content', c); };
    new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    if (window.matchMedia) { const d = window.matchMedia('(prefers-color-scheme: dark)'); (d.addEventListener ? d.addEventListener('change', paint) : d.addListener(paint)); }
    paint(); }
  const btn = document.getElementById('sideBtn');
  const open = (on) => { document.body.classList.toggle('side-open', on); if (btn) btn.setAttribute('aria-expanded', on ? 'true' : 'false'); };
  if (btn) {
    btn.addEventListener('click', (e) => { e.stopPropagation(); open(!document.body.classList.contains('side-open')); });
    document.addEventListener('click', (e) => { if (document.body.classList.contains('side-open') && !e.target.closest('#side')) open(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') open(false); });
    window.addEventListener('hashchange', () => open(false));
  }
  // On a phone, whatever you need while looking at the instrument sits right under it: the fingering table for a chord,
  // and on Practice the question, the answer buttons and the bars of a progression.
  const panel = document.getElementById('panel'), under = document.getElementById('under'), narrow = window.matchMedia('(max-width: 760px)');
  const railBox = document.getElementById('rail'), railHead = document.getElementById('railHead'), layout = document.getElementById('layout'), pager = document.getElementById('pager');
  const syncPager = () => {
    if (!pager || !window.G || !window.G.App) return;
    let any = false;
    pager.querySelectorAll('[data-act]').forEach((b) => { const on = window.G.App.can(b.dataset.act); b.disabled = !on; any = any || on; });
    pager.classList.toggle('idle', !any); document.body.classList.toggle('no-pager', !any);
  };
  if (panel && under) {
    const lift = () => {
      syncPager();
      const t = panel.querySelector('table.strings');
      if (!narrow.matches) { if (t) under.replaceChildren(); return; } // on a wide screen everything stays where it was drawn
      under.replaceChildren();
      const view = layout ? layout.dataset.view : '', step = panel.querySelector('.step');
      if (view === 'learn' && step) { step.classList.add('under-step'); under.appendChild(step); }
      else if ((view === 'practice' || view === 'circle') && railBox) {
        const q = document.createElement('div'); q.className = 'under-q';
        if (railHead) { const h = document.createElement('div'); h.className = 'rail-head'; h.append(...railHead.childNodes); q.appendChild(h); }
        q.append(...railBox.childNodes); under.appendChild(q);
      } else if (t) under.appendChild(t);
    };
    new MutationObserver((recs) => { if (recs.some((r) => r.addedNodes.length)) lift(); }).observe(panel, { childList: true }); // only when the app draws the panel, not when a part is lifted out of it
    document.addEventListener('click', () => setTimeout(syncPager, 0));
    // turning the phone, or a window narrowing to phone width, needs the app to draw the page again in the other arrangement
    const redraw = () => window.dispatchEvent(new Event('hashchange'));
    (narrow.addEventListener ? narrow.addEventListener('change', relayout) : narrow.addListener(relayout));
    function relayout() { if (window.G && window.G.App && window.G.App.redraw) window.G.App.redraw(); else redraw(); }
    lift();
  }
  // On a phone the tiles that say where a shape sits scroll out of sight, so the same facts ride on the corner of the instrument.
  const tiles = document.getElementById('tiles'), badge = document.getElementById('posBadge'), title = document.getElementById('title');
  if (tiles && badge) {
    const WANT = ['frets', 'strings', 'showing', 'now', 'left hand', 'right hand'];
    const label = () => {
      const bits = [];
      tiles.querySelectorAll('.tile').forEach((t) => { const k = t.querySelector('small'), v = t.querySelector('b'); if (k && v && WANT.includes(k.textContent.trim().toLowerCase())) { const val = v.textContent.trim(); if (val && val !== '–' && val !== '-' && val.length <= 16) bits.push([k.textContent.trim().toLowerCase(), val]); } });
      badge.replaceChildren();
      const lay2 = document.getElementById('layout'), view = lay2 ? lay2.dataset.view : '', h2 = document.querySelector('#panel .step h2, #under .step h2');
      if (view === 'learn' || (!bits.length && view !== 'circle')) return;
      const name = document.createElement('b'); name.textContent = view === 'circle' && h2 ? h2.textContent : title ? title.textContent : ''; badge.appendChild(name);
      bits.forEach(([k, v]) => { const s = document.createElement('span'), l = document.createElement('small'); l.textContent = k + ' '; s.append(l, v); badge.appendChild(s); });
    };
    new MutationObserver(label).observe(tiles, { childList: true, subtree: true, characterData: true });
    label();
  }
  // The voicing pictures sit in one sideways row on a phone: keep the chosen one in the middle of it.
  const rail = document.getElementById('rail');
  if (rail) {
    const seek = () => { const t = rail.querySelector('.thumb.on'), r = t && t.parentElement; if (r && r.scrollWidth > r.clientWidth + 4) r.scrollLeft = t.offsetLeft - r.offsetLeft - (r.clientWidth - t.offsetWidth) / 2; };
    new MutationObserver(seek).observe(rail, { childList: true, subtree: true });
    seek();
  }
  const pop = document.querySelector('#settings .pop'), metro = document.getElementById('metro'), themeBtn = document.getElementById('themeBtn');
  if (pop && metro && themeBtn) {
    const row = document.createElement('div'); row.className = 'pop-metro'; row.innerHTML = '<span>Metronome</span>';
    const trow = document.createElement('div'); trow.className = 'pop-theme'; trow.innerHTML = '<span>Light or dark</span>';
    const extras = ['mTap', 'mSig', 'mDots'].map((id) => document.getElementById(id)).filter(Boolean), home = themeBtn.parentElement;
    const place = () => {
      if (narrow.matches) { row.append(...extras); trow.appendChild(themeBtn); pop.prepend(row, trow); }
      else { metro.append(...extras); home.appendChild(themeBtn); row.remove(); trow.remove(); }
    };
    (narrow.addEventListener ? narrow.addEventListener('change', place) : narrow.addListener(place));
    place();
  }
  // When only the keyboard is showing and it is wider than the screen, slide it so the lit notes sit in the middle.
  const box = document.getElementById('instruments'), keys = document.getElementById('keys'), lay = document.getElementById('layout');
  if (!box || !keys || !lay) return;
  let timer = 0, last = '', jump = false;
  const centre = () => {
    // The neck follows its own notes as they change (neck.js); it only needs help on first load, before the layout has settled.
    const onKeys = lay.dataset.show === 'keys', host = onKeys ? keys : document.getElementById('neck');
    if ((!onKeys && !jump) || !host || (box.scrollWidth <= box.clientWidth + 4 && box.scrollHeight <= box.clientHeight + 4)) return;
    const all = Array.from(host.querySelectorAll('.peg:not(.off)')), lit = all.filter((p) => !p.classList.contains('dim'));
    const svg = host.querySelector('svg'), sr = svg && svg.getBoundingClientRect();
    if (!sr || !sr.width) return;
    // Read where each peg is going (its transform), not where it is: pegs slide, and a measurement mid-slide would be wrong.
    const vb = svg.viewBox.baseVal, k = sr.width / vb.width, off = sr.left - (box.getBoundingClientRect().left - box.scrollLeft), half = 16 * k;
    let lo = Infinity, hi = -Infinity, ySum = 0, yN = 0;
    (lit.length ? lit : all).forEach((p) => { const m = /translate\(\s*(-?[\d.]+)px,\s*(-?[\d.]+)/.exec(p.style.transform); if (!m) return; const x = off + (+m[1] - vb.x) * k; lo = Math.min(lo, x - half); hi = Math.max(hi, x + half); ySum += (+m[2] - vb.y) * k; yN++; });
    const key = Math.round(lo) + ':' + Math.round(hi);
    if (lo === Infinity || key === last) return; // same notes as before: leave the view where the player put it
    last = key;
    const w = box.clientWidth, left = (lo + hi) / 2 - w / 2;
    const top = sr.top - (box.getBoundingClientRect().top - box.scrollTop) + ySum / yN - box.clientHeight / 2;
    box.scrollTo({ left: Math.max(0, Math.min(box.scrollWidth - w, left)), top: Math.max(0, top), behavior: jump ? 'instant' : 'smooth' });
    jump = false;
  };
  const later = () => { if (!timer) timer = setTimeout(() => { timer = 0; centre(); }, 450); }; // wait out the pegs' slide, but never be starved by further changes
  new MutationObserver(later).observe(keys, { subtree: true, attributes: true, attributeFilter: ['class'] });
  window.addEventListener('resize', () => { last = ''; later(); });
  // On first load the layout is still settling (fonts, restored scroll position), so check again once it has.
  const again = () => { last = ''; jump = true; later(); };
  window.addEventListener('load', () => { again(); setTimeout(again, 1200); });
  later();
})();
