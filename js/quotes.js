// Players' own words, shown beside a lesson when they bear on it. The quotes themselves live in quotes-data.js,
// each with the interview or book it came from; nothing is shown without a source.
(() => {
  'use strict';
  const G = (window.G = window.G || {});
  const D = G.QUOTE_DATA || { quotes: [], ideas: [] };
  // Which subjects each lesson (guitar id, then its keyboard twin) and each tab touches.
  const TOPICS = {
    hands: ['hands'], khands: ['keys-touch', 'hands'], fingerstyle: ['fingerstyle', 'practice'], kfive: ['practice', 'keys-touch'],
    openchords: ['practice', 'hands', 'triads'], fretboard: ['fretboard'], kmap: ['fretboard'], intervals: ['intervals', 'ear'], kintervals: ['intervals', 'ear'],
    majorscale: ['majorscale', 'practice'], kmajor: ['majorscale', 'practice'], triads: ['triads'], ktriads: ['triads'],
    caged: ['caged', 'fretboard'], kinversions: ['keys-touch', 'triads'], diatonic: ['diatonic', 'composing'], kdiatonic: ['diatonic', 'composing'],
    sevenths: ['sevenths'], ksevenths: ['sevenths'], pentatonic: ['pentatonic'], kpent: ['pentatonic'],
    scalesmusic: ['scalesmusic', 'ear'], kmusic: ['scalesmusic', 'ear'], modes: ['modes'], kmodes: ['modes'],
    minorkeys: ['minorkeys', 'composing'], kminor: ['minorkeys', 'composing'], circle: ['circle', 'composing'], kcircle: ['circle', 'composing'],
    jazz: ['jazz'], kjazz: ['jazz', 'keys-touch'],
    'view:chords': ['jazz', 'sevenths', 'triads'], 'view:scales': ['scalesmusic', 'modes', 'pentatonic'], 'view:circle': ['circle', 'composing', 'diatonic'], 'view:practice': ['practice', 'ear'],
  };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const link = (q) => { const t = esc([q.source, q.year].filter(Boolean).join(', ')); return /^https?:\/\//.test(q.url || '') ? `<a href="${esc(q.url)}" target="_blank" rel="noopener noreferrer">${t}</a>` : t; };
  const role = (q) => (q.instrument === 'piano' ? 'pianist' : q.instrument === 'guitar' ? 'guitarist' : '');
  // Everything that fits a lesson or tab: an exact topic match first, then the lesson's secondary topics. Keyboard pages lead with pianists.
  function pool(id, keys) {
    const want = TOPICS[id] || [], all = D.quotes.map((q) => Object.assign({ kind: 'quote' }, q)).concat(D.ideas.map((q) => Object.assign({ kind: 'idea' }, q)));
    const score = (q) => { const k = want.findIndex((t) => (q.topics || []).includes(t)); return k < 0 ? -1 : k * 4 + (q.kind === 'idea' ? 2 : 0) + ((q.instrument === 'piano') === !!keys ? 0 : 1); };
    return all.map((q) => [score(q), q]).filter((x) => x[0] >= 0).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  }
  G.Quotes = {
    TOPICS, pool,
    // One card for this lesson step (or tab). n picks which: a different voice on each step, the same one each time you return to it.
    card(id, n, keys) {
      const p = pool(id, keys);
      if (!p.length) return '';
      const q = p[((n | 0) % p.length + p.length) % p.length], who = `${esc(q.who)}${role(q) ? ', ' + role(q) : ''}`;
      return q.kind === 'quote'
        ? `<section class="card voice"><b>In their words</b><blockquote>“${esc(q.text)}”</blockquote><p class="who">${who} · ${link(q)}</p></section>`
        : `<section class="card voice"><b>How the players do it</b><p class="idea-t">${esc(q.idea)}</p><p class="who">${who} · ${link(q)}</p></section>`;
    },
  };
})();
