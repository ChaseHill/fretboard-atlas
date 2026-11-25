// Keyboard-side theory: chord voicings for two hands and standard scale fingerings.
(() => {
  'use strict';
  const T = window.G.T;
  const QBY = Object.fromEntries(T.QUALS.map((q) => [q.id, q]));
  const numOf = (deg) => +deg.replace(/\D/g, '');
  const up = (deg) => T.degSemi(deg) + (numOf(deg) > 7 ? 12 : 0); // 9ths and 13ths sit an octave up

  // Rootless voicings add the colours players actually use: a 9th on major and minor sevenths, 9th and 13th on dominants.
  // Listed bottom to top for the A form; three entries = a three-note voicing.
  const ROOTLESS = {
    6: ['3', '5', '6', '9'], 69: ['3', '5', '6', '9'], maj7: ['3', '5', '7', '9'], maj9: ['3', '5', '7', '9'],
    m6: ['♭3', '5', '6', '9'], m7: ['♭3', '5', '♭7', '9'], m9: ['♭3', '5', '♭7', '9'], mMaj7: ['♭3', '5', '7', '9'],
    7: ['3', '13', '♭7', '9'], 9: ['3', '13', '♭7', '9'], 13: ['3', '13', '♭7', '9'], '7b9': ['3', '13', '♭7', '♭9'], '7s9': ['3', '13', '♭7', '♯9'],
    m7b5: ['♭3', '♭5', '♭7'], dim7: ['♭3', '♭5', '𝄫7'],
  };
  const AS = { 6: '6/9', maj7: 'maj9', m7: 'm9', m6: 'm6/9', mMaj7: 'm(maj9)', 7: '13', 9: '13' };
  const INV = ['Root position', 'First inversion', 'Second inversion', 'Third inversion'];
  const cache = new Map();

  T.keyVoicings = (root, id) => {
    const ck = root + '|' + id;
    if (cache.has(ck)) return cache.get(ck);
    const q = QBY[id], rp = T.pc(root), degs = q.degs, out = [];
    const bass = 36 + rp, mid = rp <= 5 ? 60 + rp : 48 + rp; // left-hand root C2–B2; right-hand chords built from F♯3–F4
    const tone = (deg, base, hand) => ({ midi: base + up(deg), deg, note: T.spell(root, deg), role: T.role(deg), hand });
    const uniq = (ns) => ns.filter((n, i) => ns.findIndex((m) => m.midi === n.midi) === i);
    const add = (kind, group, name, lh, rh, extra = {}) => {
      lh.sort((a, b) => a.midi - b.midi); rh.sort((a, b) => a.midi - b.midi);
      while (rh.length && lh.length && lh[lh.length - 1].midi >= rh[0].midi) lh.forEach((n) => { n.midi -= 12; });
      // keep the two hands within three octaves, so the whole voicing fits the keyboard on screen: the bass sits a fourth or more below the right hand
      while (rh.length && lh.length && rh[0].midi - lh[lh.length - 1].midi >= 17 && lh[0].midi + 12 >= 36) lh.forEach((n) => { n.midi += 12; });
      while (rh.length && rh[rh.length - 1].midi > 84) [...lh, ...rh].forEach((n) => { n.midi -= 12; });
      [['L', lh], ['R', rh]].forEach(([h, ns]) => { const fg = T.handFingers(ns.map((n) => n.midi), h); ns.forEach((n, i) => { n.finger = fg[i]; }); });
      out.push(Object.assign({ kind, group, name, lh: lh.map((n) => n.midi), rh: rh.map((n) => n.midi), notes: [...lh, ...rh] }, extra));
    };
    if (degs.length <= 4) { // close position and its inversions, right hand alone
      for (let k = 0; k < degs.length; k++) {
        const rh = degs.map((d, i) => { const n = tone(d, mid, 'R'); if (i < k) n.midi += 12; return n; });
        if (Math.max(...rh.map((n) => n.midi)) > mid + 17) rh.forEach((n) => { n.midi -= 12; });
        add(k ? 'inv' : 'close', 'Close position, right hand', INV[k], [], rh, { inv: k });
      }
    }
    if (degs.length <= 3) add('lhroot', 'Two hands', 'Root in the left hand, chord in the right', [tone('1', bass, 'L')], degs.map((d) => tone(d, mid, 'R')));
    const third = degs.find((d) => numOf(d) === 3), sev = degs.find((d) => numOf(d) === 7) || (degs.includes('6') ? '6' : null);
    if (third && sev) {
      const colours = degs.filter((d) => d !== '1' && d !== third && d !== sev);
      const above = (list, floor) => list.map((d) => { const n = tone(d, 36 + rp, 'R'); while (n.midi <= floor) n.midi += 12; return n; }).sort((a, b) => a.midi - b.midi)
        .map((n, i, a) => { if (i && n.midi <= a[i - 1].midi) n.midi += 12; return n; });
      const sb = rp <= 4 ? 48 + rp : 36 + rp; // shell roots from F2 to E3
      const lhA = [tone('1', sb, 'L'), tone(sev, sb, 'L')], t3 = tone(third, sb + 12, 'R');
      add('shell', 'Shells: the left hand names the chord', `Shell 1–${T.esc(sev)}, ${T.esc(third)} above`, lhA, uniq([t3, ...above(colours.length ? colours : ['5'], t3.midi)]).slice(0, 4));
      const sb3 = sb < 45 ? sb + 12 : sb, lhB = [tone('1', sb3, 'L'), tone(third, sb3, 'L')], t7 = tone(sev, sb3, 'R');
      add('shell', 'Shells: the left hand names the chord', `Shell 1–${T.esc(third)}, ${T.esc(sev)} above`, lhB, uniq([t7, ...above(colours.length ? colours : ['5'], t7.midi)]).slice(0, 4));
    }
    const rl = ROOTLESS[id];
    if (rl) {
      const added = (d) => !degs.includes(d);
      const build = (order) => { // stack the degrees upward in the order given, then put the lowest note between E3 and E♭4
        let prev = -Infinity;
        const ns = order.map((d) => { const n = tone(d, 48 + rp, 'R'); n.midi = 48 + rp + T.degSemi(d); while (n.midi <= prev) n.midi += 12; prev = n.midi; if (added(d)) n.role = 'ext'; return n; });
        while (ns[0].midi < 52) ns.forEach((n) => { n.midi += 12; });
        while (ns[0].midi > 63) ns.forEach((n) => { n.midi -= 12; });
        return ns;
      };
      const as = rl.some(added) && AS[id] ? root + AS[id] : null;
      const B = rl.length === 4 ? [rl[2], rl[3], rl[0], rl[1]] : [rl[2], rl[0], rl[1]];
      add('rootlessA', 'Rootless: the jazz comping voicings', 'Rootless A form (3rd on the bottom)', [tone('1', bass, 'L')], build(rl), { as, rootless: true });
      add('rootlessB', 'Rootless: the jazz comping voicings', 'Rootless B form (7th on the bottom)', [tone('1', bass, 'L')], build(B), { as, rootless: true });
    }
    if (degs.length === 4) { // drop-2 across two hands: the second note from the top goes down an octave to the left hand
      for (let k = 0; k < 4; k++) {
        const close = degs.map((d, i) => { const n = tone(d, mid, 'R'); if (i < k) n.midi += 12; return n; }).sort((a, b) => a.midi - b.midi);
        const dropped = close.splice(2, 1)[0]; dropped.midi -= 12; dropped.hand = 'L';
        add('drop2', 'Drop-2, spread over two hands', `Drop-2, ${T.esc(close[close.length - 1].deg)} on top`, [dropped], close);
      }
    }
    if (!out.length) add('lhroot', 'Two hands', 'Root in the left hand, the rest in the right', [tone('1', bass, 'L')], degs.slice(1).map((d) => { const n = tone(d, mid, 'R'); if (numOf(d) > 7) n.midi -= 12; return n; }));
    cache.set(ck, out);
    return out;
  };

  // Standard one-octave scale fingerings (ascending, eight notes). Only the ones that are not in dispute.
  const FIVE = { rh: '12312345', lh: '54321321' };
  const MAJ = { C: FIVE, G: FIVE, D: FIVE, A: FIVE, E: FIVE, B: { rh: '12312345', lh: '43214321' }, F: { rh: '12341234', lh: '54321321' },
    'B♭': { rh: '21231234', lh: '32143213' }, 'E♭': { rh: '21234123', lh: '32143213' }, 'A♭': { rh: '23123123', lh: '32143213' }, 'D♭': { rh: '23123412', lh: '32143213' }, 'F♯': { rh: '23412312', lh: '43213214' } };
  const MIN = { A: FIVE, E: FIVE, D: FIVE, G: FIVE, C: FIVE, B: { rh: '12312345', lh: '43214321' }, F: { rh: '12341234', lh: '54321321' } };
  T.keyFingering = (root, scaleId) => {
    const t = scaleId === 'major' ? MAJ[root] : ['minor', 'harm', 'mel'].includes(scaleId) ? MIN[root] : null;
    return t ? { rh: [...t.rh].map(Number), lh: [...t.lh].map(Number) } : null;
  };
  // The same fingering carried over more octaves: the thumb (or the finger that began) takes each new tonic.
  T.fingerOctaves = (one, octaves, hand) => {
    let out = one.slice(0, 7);
    for (let o = 1; o < octaves; o++) out = out.concat([hand === 'R' && one[0] === 1 ? 1 : one[7]], one.slice(1, 7));
    return out.concat(one[7]);
  };
  // Mode → the major scale with the same notes (semitones down from the mode's root).
  T.PARENT = { dorian: 2, phrygian: 4, lydian: 5, mixo: 7, minor: 9, locrian: 11 };
})();
