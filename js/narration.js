// What the guided lesson says, as a teacher would say it aloud. Shared by the app (which speaks it) and
// tools/narrate.js (which pre-records it). The written lesson text is turned into speech here: symbols become
// words, runs of notes and finger numbers are read out one by one, and stiff phrasing is loosened.
(() => {
  'use strict';
  const G = (window.G = window.G || {});
  const N = (G.Narr = {});
  N.plain = (html) => String(html).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

  const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const ROMAN = { I: 'one', II: 'two', III: 'three', IV: 'four', V: 'five', VI: 'six', VII: 'seven' };
  const roman = (r) => ROMAN[r.toUpperCase()] || r;
  const CONTRACT = [['do not', "don't"], ['does not', "doesn't"], ['cannot', "can't"], ['can not', "can't"], ['is not', "isn't"], ['are not', "aren't"], ['will not', "won't"],
    ['it is', "it's"], ['that is', "that's"], ['there is', "there's"], ['you are', "you're"], ['they are', "they're"], ['we are', "we're"], ['what is', "what's"], ['here is', "here's"], ['let us', "let's"]];
  const keepCase = (from, to) => (from[0] === from[0].toUpperCase() ? to[0].toUpperCase() + to.slice(1) : to);

  N.spoken = (text) => {
    let t = ' ' + text + ' ';
    // runs of notes: C–D–E–F–G → "C, D, E, F, G"; a pair, E–F → "E to F"
    t = t.replace(/(^|[\s(“"])([A-G][♯♭]?(?:[–-][A-G][♯♭]?)+)(?=[\s.,;:!?)”"])/g, (m, pre, run) => { const ns = run.split(/[–-]/); return pre + (ns.length === 2 ? ns.join(' to ') : ns.join(', ')); });
    // runs of finger or fret numbers: 1-2-3-5 → "one, two, three, five"
    t = t.replace(/\b\d+(?:-\d+)+\b/g, (run) => run.split('-').map((d) => NUM[+d] || d).join(', ')).replace(/-to-/g, ' to ').replace(/…/g, ', ');
    // plucking-finger letters: p-i-m-a → "P, I, M, A"
    t = t.replace(/\b[pima](?:-[pima])+\b/g, (run) => run.toUpperCase().split('-').join(', '));
    t = t.replace(/\b((?:[WH] ){2,}[WH])\b/g, (run) => run.split(' ').map((x) => (x === 'W' ? 'whole' : 'half')).join(', '));
    t = t.replace(/\b([2346])\/([48])\b/g, (m, a, b) => NUM[+a] + ' ' + NUM[+b]);
    // Roman numerals, only where they are clearly chords
    t = t.replace(/\b([IViv]{1,3})((?:\s*[–-]\s*[IViv]{1,3}(?:°|ø|7|maj7)?)+)/g, (m, a, rest) => roman(a) + rest.replace(/\s*[–-]\s*([IViv]{1,3})(°|ø|7|maj7)?/g, (x, r, q) => ', ' + roman(r) + (q === '7' ? ' seven' : q === 'maj7' ? ' major seven' : q || '')));
    t = t.replace(/\b(ii|iii|IV|V|vi|vii)(7?)(?= chord)/g, (m, r, s) => roman(r) + (s ? ' seven' : ''));
    t = t.replace(/\b(the|a|an|its|to|from|and|on) (ii|iii|IV|V|vi|vii)(7?)(?=[\s.,;:!?)])/g, (m, w, r, s) => w + ' ' + roman(r) + (s ? ' seven' : ''));
    t = t.replace(/\bI chord/g, 'one chord').replace(/\bthe I\b/g, 'the one');
    t = t.replace(/(?:\b[IViv]{1,3}[°ø]?[ ,]+){2,}[IViv]{1,3}[°ø]?/g, (run) => run.replace(/[IViv]{1,3}/g, roman).replace(/([a-z°ø]) (?=[a-z])/g, '$1, '));
    t = t.replace(/\b(ii|iii|IV|vi|vii|VII)\b/g, roman).replace(/\bI to seven\b/g, 'one to seven');
    // chord names
    t = t.replace(/([A-G][♯♭]?)maj(\d+)/g, '$1 major $2').replace(/\bmaj(\d+)/g, ' major $1').replace(/\b([A-G][♯♭]?)m\(maj(\d)\)/g, '$1 minor major $2').replace(/\b([A-G][♯♭]?)m(\d+)/g, '$1 minor $2').replace(/\b([A-G][♯♭]?)m\b/g, '$1 minor')
      .replace(/\bm7♭5\b/g, 'minor 7 flat 5').replace(/\bm(\d+)\b/g, 'minor $1').replace(/\bsus(\d)/g, ' sus $1').replace(/\badd(\d)/g, ' add $1');
    t = t.replace(/♯/g, ' sharp').replace(/♭/g, ' flat').replace(/𝄫/g, ' double flat').replace(/°/g, ' diminished').replace(/ø/g, ' half diminished')
      .replace(/→/g, ' to ').replace(/←/g, ' from ').replace(/×/g, ' muted ').replace(/\s[–—]\s/g, ', ').replace(/(\d)[–—](\d)/g, '$1 to $2').replace(/[–—]/g, ', ')
      .replace(/ = /g, ' means ').replace(/\bp i m a\b/g, 'P, I, M, A').replace(/\bBPM\b/g, 'beats per minute').replace(/[“”]/g, '"').replace(/›/g, ', ').replace(/\be\.g\./g, 'for example');
    CONTRACT.forEach(([a, b]) => { t = t.replace(new RegExp('\\b' + a + '(?= [a-z])', 'gi'), (m) => keepCase(m, b)); });
    return t.replace(/ ,/g, ',').replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim().replace(/([.!?:] )([a-z])/g, (m, a, b) => a + b.toUpperCase());
  };
  N.hash = (t) => { let h = 0x811c9dc5; for (const ch of t) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16).padStart(8, '0'); };

  const NEXT = ['Next:', 'Now,', 'Moving on:', 'Here’s the next piece:', 'On to this:'];
  const IDEA = ['Here’s the thing to remember.', 'Keep this in mind.', 'The key idea here:', 'This is the part that matters.'];
  const TRY = ['Now it’s your turn.', 'Okay, try it.', 'Your turn.', 'Now you.'];
  const lower = (s) => (/^[A-Z][a-z]/.test(s) && !/^(I|C|D|E|F|G|A|B)\b/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);
  // The lines for one step, in the order they are spoken. Short lines are folded into their neighbours:
  // a voice model reads a full sentence far more reliably than a single word.
  N.parts = (L, i, kb) => {
    const st = L.steps[i], p = N.plain, n = L.steps.length, last = i === n - 1;
    const opener = i === 0 ? 'First:' : last && n > 2 ? 'And finally:' : NEXT[(i - 1) % NEXT.length];
    return {
      intro: i === 0 ? `This lesson is ${L.title}. ${p(L.lede)}` : null,
      main: `${opener} ${lower(p(st.title))}. ${p(st.body)}${st.play ? ' Have a listen.' : ''}`,
      idea: st.idea ? `${IDEA[i % IDEA.length]} ${p(st.idea)}` : null,
      tryIt: `${TRY[i % TRY.length]} ${p(st.try)}${st.play ? ' Here it comes once more, so play along.' : ''}`,
      end: last ? `And that’s the end of ${L.title}. Nice work. Here’s what to practise: ${L.homework.map(p).join(' ')}` : null,
      play: !!st.play,
    };
  };
  N.fileFor = (text) => { const h = N.hash(N.spoken(text)); return G.NARR && G.NARR.files && G.NARR.files[h] ? G.NARR.dir + '/' + G.NARR.files[h] : null; };
})();
