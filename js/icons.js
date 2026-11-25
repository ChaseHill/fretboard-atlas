// The design system's icon set: 16 px grid, 1.5 stroke, round joins, drawn in the current text colour.
// Buttons in the app are written with plain characters (▶ ■ ↺ …); this file swaps each for its drawn icon wherever
// it appears inside a control, including when a control's label is rewritten later.
(() => {
  'use strict';
  const G = (window.G = window.G || {});
  const P = {
    play: '<path d="M5 3.5 12.5 8 5 12.5Z" fill="currentColor"/>',
    pause: '<path d="M5.5 3.5v9M10.5 3.5v9"/>',
    stop: '<rect x="4" y="4" width="8" height="8" rx="1" fill="currentColor"/>',
    prev: '<path d="M12 3.5 6 8l6 4.5ZM4 3.5v9" fill="currentColor"/>',
    next: '<path d="M4 3.5 10 8l-6 4.5ZM12 3.5v9" fill="currentColor"/>',
    note: '<circle cx="5.5" cy="11.5" r="2"/><path d="M7.5 11.5V3l4.5 1.5"/>',
    metro: '<path d="M5.5 13.5h5L9 2.5H7ZM8 10l3-5"/>',
    keys: '<rect x="2" y="4" width="12" height="8" rx="1"/><path d="M6 4v4.5M10 4v4.5"/>',
    neck: '<path d="M2.5 10 10.5 3.5l3 3L5.5 13ZM6 7.2l3 3M8.3 5.3l3 3"/>',
    tuner: '<path d="M5 1.5v5a3 3 0 0 0 6 0v-5M8 9.5v5"/>',
    chart: '<rect x="3" y="3" width="10" height="10" rx="1"/><path d="M3 8h10M8 3v10"/>',
    reset: '<path d="M3.5 8a4.5 4.5 0 1 0 1.4-3.3M3.5 2.8v2.4h2.4"/>',
    settings: '<path d="M2.5 5h5M11.5 5h2M2.5 11h2M8.5 11h5"/><circle cx="9.5" cy="5" r="1.8"/><circle cx="6.5" cy="11" r="1.8"/>',
    theme: '<circle cx="8" cy="8" r="5"/><path d="M8 3a5 5 0 0 1 0 10Z" fill="currentColor"/>',
    chev: '<path d="M6 3.5 10.5 8 6 12.5"/>',
    chevl: '<path d="M10 3.5 5.5 8 10 12.5"/>',
    // drawn to the same rules for controls the first set did not cover
    menu: '<path d="M3 4.5h10M3 8h10M3 11.5h10"/>',
    right: '<path d="M3 8h10M9 4l4 4-4 4"/>',
    left: '<path d="M13 8H3M7 4 3 8l4 4"/>',
    close: '<path d="M4 4l8 8M12 4l-8 8"/>',
    out: '<path d="M6 4h6v6M12 4 4.5 11.5"/>',
  };
  const svg = (name) => `<svg class="ic" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${P[name] || ''}</svg>`;
  const MAP = { '▶': 'play', '■': 'stop', '⏮': 'prev', '⏭': 'next', '↺': 'reset', '◐': 'theme', '⚙': 'settings', '▦': 'chart', '♪': 'note', '☰': 'menu', '›': 'chev', '‹': 'chevl', '→': 'right', '←': 'left', '×': 'close', '↗': 'out' };
  const RE = /❚❚|[▶■⏮⏭↺◐⚙▦♪☰›‹→←×↗]/g;
  G.icon = svg;
  if (typeof document === 'undefined') return;

  // Replace the characters inside one control with icons. Text around them is kept as it was.
  function swap(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), hits = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) if (RE.test(n.nodeValue)) hits.push(n); else RE.lastIndex = 0;
    hits.forEach((n) => {
      RE.lastIndex = 0;
      if (n.parentNode.closest('svg, select, option, input, textarea')) return;
      const frag = document.createDocumentFragment(), text = n.nodeValue;
      let last = 0, m;
      // each icon sits in its own element name, so rules and scripts that look for a control's <span> label are not confused by it
      while ((m = RE.exec(text))) {
        if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        const span = document.createElement('fa-icon'); span.className = 'ic-wrap'; span.innerHTML = svg(m[0] === '❚❚' ? 'pause' : MAP[m[0]]);
        frag.appendChild(span); last = m.index + m[0].length;
      }
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      n.parentNode.replaceChild(frag, n);
    });
  }
  const CONTROLS = 'button, summary, .btn, .tab';
  const scan = (root) => { if (root.nodeType !== 1) return; if (root.matches(CONTROLS)) swap(root); root.querySelectorAll(CONTROLS).forEach(swap); };
  let queued = false; const pending = new Set();
  const flush = () => { queued = false; pending.forEach((n) => { if (n.isConnected) { const c = n.nodeType === 1 ? n : n.parentElement; if (c) { const ctl = c.closest(CONTROLS); if (ctl) swap(ctl); else scan(c); } } }); pending.clear(); };
  new MutationObserver((recs) => {
    recs.forEach((r) => { if (r.type === 'characterData') pending.add(r.target); else r.addedNodes.forEach((n) => pending.add(n)); });
    if (pending.size && !queued) { queued = true; Promise.resolve().then(flush); }
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => scan(document.body)); else scan(document.body);
})();
