// Tunes to read and play. Each is a line of first-position notes with lengths in beats.
// The traditional melodies here are in the public domain; the reading studies were written for this app.
// Written as note names: lower-case letter, then an octave mark (none = the bass strings, 1 = middle, 2 = top), "s" for sharp,
// then ":beats" if not a quarter note. "r" is a rest. Bar lines are for the writer; the bars are worked out from the beats.
(() => {
  'use strict';
  const G = (window.G = window.G || {});
  const POS = { e: [6, 0], f: [6, 1], g: [6, 3], a: [5, 0], b: [5, 2], c: [5, 3], d: [4, 0], e1: [4, 2], f1: [4, 3], fs1: [4, 4], g1: [3, 0], a1: [3, 2], b1: [2, 0], c2: [2, 1], d2: [2, 3], e2: [1, 0], f2: [1, 1], fs2: [1, 2], g2: [1, 3], a2: [1, 5] };
  const parse = (str) => str.split(/\s+/).filter((t) => t && t !== '|').map((t) => { const [n, d] = t.split(':'), p = n === 'r' ? [0, 0] : POS[n]; if (!p) throw new Error('unknown note ' + n); return [p[0], p[1], d ? +d : 1]; });
  const list = [];
  // chords: one entry per full bar, 'C' or 'C G7' for two in a bar; they are what a second guitar strums under the tune
  const tune = (id, title, credit, level, notes, o) => { const t = Object.assign({ id, title, credit, level, time: 4, pickup: 0, notes: parse(notes) }, o || {}); if (typeof t.chords === 'string') t.chords = t.chords.split('|').map((b) => b.trim().split(/\s+/)); list.push(t); };
  const OWN = 'A reading study written for this app';

  // ---- reading studies, one string at a time ----
  tune('s1a', 'Three Notes Up', OWN, 1, 'e2 e2 f2 f2 | g2 g2 f2:2 | g2 f2 e2 f2 | e2:4', { strings: 'String 1: E, F and G' });
  tune('s1b', 'Long and Short', OWN, 1, 'e2:2 g2:2 | f2 f2 e2:2 | g2 g2 f2 e2 | f2:2 e2:2', { strings: 'String 1: E, F and G' });
  tune('s2a', 'Second String Walk', OWN, 1, 'b1 b1 c2 d2 | d2 c2 b1:2 | c2 c2 d2 c2 | b1:4', { strings: 'String 2: B, C and D' });
  tune('s2b', 'Across Two Strings', OWN, 1, 'b1 c2 d2 e2 | f2 e2 d2:2 | g2 f2 e2 d2 | c2:2 b1:2', { strings: 'Strings 2 and 1' });
  tune('s3a', 'Third String Song', OWN, 1, 'g1 a1 g1 a1 | b1 a1 g1:2 | a1 b1 c2 b1 | a1:2 g1:2', { strings: 'String 3: G and A' });
  tune('s4a', 'Fourth String Song', OWN, 2, 'd e1 f1 e1 | d:2 g1:2 | f1 e1 d e1 | d:4', { strings: 'String 4: D, E and F' });
  tune('s5a', 'Fifth String Bass', OWN, 2, 'a b c b | a:2 d:2 | c b a b | a:4', { strings: 'String 5: A, B and C' });
  tune('s6a', 'Sixth String Bass', OWN, 2, 'e f g f | e:2 a:2 | g a b a | e:4', { strings: 'String 6: E, F and G' });
  tune('s8a', 'Eighth-Note Steps', OWN, 2, 'c2:.5 d2:.5 e2 e2:.5 f2:.5 g2 | g2:.5 f2:.5 e2 d2:2 | c2:.5 d2:.5 e2:.5 f2:.5 g2 e2 | d2:2 c2:2', { strings: 'Strings 2 and 1, with eighth notes' });
  tune('srun', 'All Six Strings', OWN, 2, 'e:.5 f:.5 g:.5 a:.5 b:.5 c:.5 d:.5 e1:.5 | f1:.5 g1:.5 a1:.5 b1:.5 c2:.5 d2:.5 e2:.5 f2:.5 | g2:2 e2:2 | c2:2 g1:2 | e1:2 c:2 | e:4', { strings: 'Every natural note of first position' });

  // ---- composing models: a period, a sentence and a small three-part piece ----
  const MODEL = 'A composing model written for this app';
  tune('period', 'An Eight-Bar Period', MODEL, 2, 'c2 e2 g2:2 | f2 e2 d2:2 | e2:.5 f2:.5 g2 e2 c2 | d2:4 | c2 e2 g2:2 | f2 e2 d2:2 | e2 g2 f2 d2 | c2:4', { chords: 'C | G7 | C | G | C | G7 | C G7 | C' });
  tune('sentence', 'An Eight-Bar Sentence', MODEL, 2, 'g1 c2 e2 c2 | d2:2 g1:2 | g1 b1 d2 b1 | c2:2 g1:2 | e2 d2 c2 d2 | f2 e2 d2 e2 | g2 f2 e2 d2 | c2:4', { chords: 'C | G | G | C | C | Dm | G7 | C' });
  tune('ternary', 'A Small Three-Part Piece', MODEL, 2, 'c2 e2 g2:2 | f2 e2 d2:2 | e2:.5 f2:.5 g2 e2 c2 | d2:4 | c2 e2 g2:2 | f2 e2 d2:2 | e2 g2 f2 d2 | c2:4 | g1 b1 d2 f2 | e2:2 d2:2 | b1 d2 g2 a2 | g2:2 d2:2 | c2 e2 g2:2 | f2 e2 d2:2 | e2 g2 f2 d2 | c2:4', { chords: 'C | G7 | C | G | C | G7 | C G7 | C | G7 | G7 | G7 | G7 | C | G7 | C G7 | C' });

  // ---- traditional and classical melodies in the public domain ----
  tune('buns', 'Hot Cross Buns', 'Traditional', 1, 'e2 d2 c2:2 | e2 d2 c2:2 | c2:.5 c2:.5 c2:.5 c2:.5 d2:.5 d2:.5 d2:.5 d2:.5 | e2 d2 c2:2', { chords: 'C | C | C | G7 C' });
  tune('mary', 'Mary Had a Little Lamb', 'Traditional, 1830', 1, 'e2 d2 c2 d2 | e2 e2 e2:2 | d2 d2 d2:2 | e2 g2 g2:2 | e2 d2 c2 d2 | e2 e2 e2 e2 | d2 d2 e2 d2 | c2:4', { chords: 'C | C | G7 | C | C | C | G7 | C' });
  tune('clair', 'Au clair de la lune', 'Traditional French', 1, 'c2 c2 c2 d2 | e2:2 d2:2 | c2 e2 d2 d2 | c2:4', { chords: 'C | C G7 | C G7 | C' });
  tune('ode', 'Ode to Joy', 'Ludwig van Beethoven, 1824', 1, 'e2 e2 f2 g2 | g2 f2 e2 d2 | c2 c2 d2 e2 | e2:1.5 d2:.5 d2:2 | e2 e2 f2 g2 | g2 f2 e2 d2 | c2 c2 d2 e2 | d2:1.5 c2:.5 c2:2', { chords: 'C | G7 | C | G7 | C | G7 | C | G7 C' });
  tune('saints', 'When the Saints Go Marching In', 'Traditional', 1, 'r c2 e2 f2 | g2:4 | r c2 e2 f2 | g2:4 | r c2 e2 f2 | g2:2 e2:2 | c2:2 e2:2 | d2:4', { chords: 'C | C | C | C | C | C | C | G7' });
  tune('jingle', 'Jingle Bells', 'James Pierpont, 1857', 2, 'e2 e2 e2:2 | e2 e2 e2:2 | e2 g2 c2:1.5 d2:.5 | e2:4 | f2 f2 f2:1.5 f2:.5 | f2 e2 e2 e2:.5 e2:.5 | e2 d2 d2 e2 | d2:2 g2:2', { chords: 'C | C | C | C | F | C | G7 | G7' });
  tune('twinkle', 'Twinkle, Twinkle, Little Star', 'Traditional French melody', 1, 'g1 g1 d2 d2 | e2 e2 d2:2 | c2 c2 b1 b1 | a1 a1 g1:2 | d2 d2 c2 c2 | b1 b1 a1:2 | d2 d2 c2 c2 | b1 b1 a1:2 | g1 g1 d2 d2 | e2 e2 d2:2 | c2 c2 b1 b1 | a1 a1 g1:2', { chords: 'G | C G | C G | D7 G | G C | G D7 | G C | G D7 | G | C G | C G | D7 G' });
  tune('yankee', 'Yankee Doodle', 'Traditional', 2, 'g1 g1 a1 b1 | g1 b1 a1 d | g1 g1 a1 b1 | g1:2 fs1:2 | g1 g1 a1 b1 | c2 b1 a1 g1 | fs1 d e1 fs1 | g1:2 g1:2', { chords: 'G | G D7 | G | G D7 | G | C G | D7 | G' });
  tune('aura', 'Aura Lee', 'George R. Poulton, 1861', 2, 'd g1 fs1 g1 | a1 e1 a1:2 | g1 fs1 e1 fs1 | g1:4 | d g1 fs1 g1 | a1 e1 a1:2 | g1 fs1 e1 fs1 | g1:4', { chords: 'G | A7 | D7 | G | G | A7 | D7 | G' });
  tune('grace', 'Amazing Grace (first half)', 'Traditional melody, 1829', 2, 'd | g1:2 b1:.5 g1:.5 | b1:2 a1 | g1:2 e1 | d:2 d | g1:2 b1:.5 g1:.5 | b1:2 a1 | d2:3 | d2:2', { time: 3, pickup: 1, chords: 'G | G | C | G | G | G | D7 | D7' });

  const byId = Object.fromEntries(list.map((t) => [t.id, t]));
  G.Tunes = { list, byId, beats: (t) => t.notes.reduce((a, n) => a + n[2], 0) };
})();
