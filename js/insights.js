// What a chord is for: its job in each key, where it goes, what it is related to, what to play over it, where you hear it.
// Everything except the STYLE prose is computed from the chord's notes.
(() => {
  'use strict';
  const G = (window.G = window.G || {});
  const T = G.T, mod = T.mod, I = (G.Insights = {});
  const QBY = Object.fromEntries(T.QUALS.map((q) => [q.id, q]));
  const FAMILY = { maj: 'maj', 6: 'maj', maj7: 'maj', add9: 'maj', 69: 'maj', maj9: 'maj', m: 'min', m6: 'min', m7: 'min', m9: 'min', mMaj7: 'min',
    7: 'dom', 9: 'dom', 13: 'dom', '7b9': 'dom', '7s9': 'dom', '7sus4': 'dom', m7b5: 'hdim', dim: 'dim', dim7: 'dim', aug: 'aug', sus2: 'sus', sus4: 'sus', 5: 'power' };
  I.family = (id) => FAMILY[id];
  const semis = (id) => QBY[id].degs.map(T.degSemi);
  I.pcs = (root, id) => new Set(semis(id).map((s) => mod(T.pc(root) + s)));
  const keyOf = (s) => [...s].sort((a, b) => a - b).join(',');
  // a chord `semi` semitones above `root`, spelled the way that interval is normally written
  const at = (root, semi, id) => {
    let name = T.spell(root, T.DEG[mod(semi)]);
    const pc = mod(T.pc(root) + semi);
    if (/[𝄫𝄪]|♭♭|♯♯/.test(name) || name === 'C♭' || name === 'F♭' || name === 'E♯' || name === 'B♯') name = T.KEYS[pc];
    return { root: T.KEYS[pc], id, name: name + QBY[id].suf };
  };
  const simple = (id) => QBY[id].group === 'Triads'; // answer triads with triads, sevenths with sevenths

  // ---- its job: every key the chord fits in, and what it does there ----
  const MAJ = [0, 2, 4, 5, 7, 9, 11], MAJ_ROM = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'], MAJ_FN = ['home', 'away', 'home', 'away', 'tension', 'home', 'tension'];
  const MIN = [0, 2, 3, 5, 7, 8, 10], MIN_ROM = ['I', 'II', '♭III', 'IV', 'V', '♭VI', '♭VII'], MIN_FN = ['home', 'away', 'home', 'away', 'tension', 'away', 'away'];
  const FN_WORD = { home: 'home', away: 'away from home', tension: 'wants to resolve' };
  const roman = (num, id) => {
    const s = semis(id), minor3 = s.includes(3) && !s.includes(4);
    return (minor3 ? num.toLowerCase() : num) + (FAMILY[id] === 'dim' ? '°' : FAMILY[id] === 'hdim' ? 'ø' : '');
  };
  I.jobs = (root, id) => {
    const rp = T.pc(root), pcs = [...I.pcs(root, id)], out = [];
    if (FAMILY[id] === 'power') return out;
    T.CIRCLE.forEach((K) => {
      const kp = T.pc(K), scale = MAJ.map((s) => mod(kp + s)), d = scale.indexOf(rp);
      const sus = /sus/.test(id), main = (k) => !sus || k === 0 || k === 3 || k === 4;
      if (d >= 0 && main(d) && pcs.every((p) => scale.includes(p))) out.push({ key: K, mode: 'major', roman: roman(MAJ_ROM[d], id), fn: MAJ_FN[d] });
      const mk = T.spell(K, '6'), mp = T.pc(mk), nat = MIN.map((s) => mod(mp + s)), lead = mod(mp + 11), harm = nat.concat(lead), dm = nat.indexOf(rp);
      const usesLead = pcs.includes(lead);
      if (dm >= 0 && main(dm) && !usesLead && pcs.every((p) => nat.includes(p))) out.push({ key: mk, mode: 'minor', roman: roman(MIN_ROM[dm], id), fn: MIN_FN[dm] });
      else if (usesLead && pcs.every((p) => harm.includes(p)) && (dm === 4 || dm === 0 || (rp === lead && FAMILY[id] !== 'aug') || (dm === 2 && FAMILY[id] === 'aug'))) out.push({ key: mk, mode: 'minor', roman: roman(rp === lead ? 'VII' : MIN_ROM[dm], id), fn: dm === 0 ? 'home' : 'tension' });
    });
    const rank = { home: 0, tension: 1, away: 2 };
    return out.sort((a, b) => (a.mode === b.mode ? 0 : a.mode === 'major' ? -1 : 1) || rank[a.fn] - rank[b.fn]).map((j) => Object.assign(j, { text: FN_WORD[j.fn] }));
  };

  // ---- where it goes ----
  I.moves = (root, id) => {
    const f = FAMILY[id], tri = simple(id), M = tri ? 'maj' : 'maj7', m = tri ? 'm' : 'm7', out = [];
    const go = (semi, qid, label, why) => out.push(Object.assign(at(root, semi, qid), { label, why }));
    if (id === '7sus4') {
      go(0, '7', 'Let the 4th fall', 'The suspended 4th drops a half step to the 3rd, and the chord becomes a plain dominant 7.');
      go(5, M, 'Resolve home', 'Its root falls a fifth. The suspended 4th is already the root of the home chord, so the landing is soft.');
      go(7, 'm7', 'Usually comes after', 'The ii chord. Keep its notes, put this root under them, and you have this chord: the smoothest way in.');
    } else if (f === 'dom') {
      go(5, M, 'Resolve home', 'Its root falls a fifth. The 3rd and 7th, a tritone apart, each move one step inward.');
      go(5, m, 'Resolve to minor', 'The same pull, landing on a minor chord.');
      go(2, m, 'Deceptive move', 'The ear expects home and gets the vi chord of that key instead, a whole step above this chord. It shares two notes with the home chord, so it sounds like a near miss.');
      go(6, '7', 'Tritone substitute', 'A dominant 7 a tritone away has the same 3rd and 7th, swapped. Either chord can stand in for the other.');
      go(7, 'm7', 'Usually comes after', 'The ii chord. ii → V → I is the most common three-chord move in jazz.');
    } else if (f === 'maj') {
      go(5, M, 'Up a fourth (I → IV)', 'The most common move away from home.');
      go(7, tri ? 'maj' : '7', 'To the V', tri ? 'Sets up the return home.' : 'Sets up the return home. It is also the chord that most often comes just before this one.');
      go(9, m, 'To the relative minor (vi)', 'Shares most of its notes, so the change is gentle.');
      go(2, m, 'To the ii', 'The start of a ii–V–I back to this chord.');
      if (tri) go(7, '7', 'Usually comes after', 'Its own V7, the chord that points at it.');
    } else if (f === 'min') {
      go(5, '7', 'ii → V', 'Treat it as a ii chord: the V7 is a fourth up.');
      go(5, m, 'Up a fourth (i → iv, or vi → ii)', 'Roots moving in fourths is the engine of most progressions.');
      go(3, M, 'To the relative major', 'Same notes of the scale, brighter home.');
      go(7, '7', 'Usually comes after', 'Its own V7. In a minor key that chord often carries a ♭9.');
    } else if (f === 'hdim') {
      go(5, '7b9', 'Minor ii → V', 'Half-diminished is the ii chord of a minor key. Its ♭5 becomes the ♭9 of the V.');
      go(10, 'm7', 'Then home (i)', 'Two fourths up from here: iiø → V7♭9 → i.');
    } else if (f === 'dim') {
      go(1, tri ? 'maj' : 'maj7', 'Resolve up a half step', 'A diminished chord is a leading-note chord: its root sits a half step below the root of the next chord and pulls up into it.');
      go(1, tri ? 'm' : 'm7', 'Or up to a minor chord', 'The same push, into minor.');
      if (id === 'dim7') go(11, '7b9', 'It is a hidden dominant', 'Put this note under it and the diminished 7th becomes a 7♭9 chord.');
    } else if (f === 'aug') {
      go(5, 'maj', 'Resolve up a fourth', 'The raised 5th is a leading note: it climbs a half step into the 3rd of the next chord.');
      go(0, 'maj', 'Or let the 5th fall back', 'Major → augmented → major (or on to a 6th) is a classic inner-line move.');
    } else if (f === 'sus') {
      go(0, 'maj', 'Resolve to major', id === 'sus4' ? 'The 4th falls a half step to the 3rd.' : 'The 2nd rises a whole step to the 3rd.');
      go(0, 'm', 'Or to minor', 'A sus chord has no 3rd, so it can go either way.');
    } else if (f === 'power') {
      go(0, 'maj', 'Add a major 3rd', 'A power chord has no 3rd. Add one and it takes a side.');
      go(0, 'm', 'Add a minor 3rd', 'The same two notes sit inside the minor chord.');
    }
    return out;
  };

  // ---- relatives ----
  const ALL = []; // every chord of every root, by pitch-class set
  T.KEYS.forEach((r) => T.QUALS.forEach((q) => ALL.push({ root: r, id: q.id, name: r + q.suf, key: keyOf(I.pcs(r, q.id)), n: q.degs.length })));
  const PREF = ['maj', 'm', 'dim', 'aug', 'maj7', '7', 'm7', 'm7b5', 'dim7', '6', 'm6', 'mMaj7', 'sus4', 'sus2'];
  const MOVE_WORD = { 1: 'root', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th', 6: '6th', 7: '7th', 9: '9th', 13: '13th' };
  I.relatives = (root, id) => {
    const out = [], rp = T.pc(root), mine = keyOf(I.pcs(root, id)), q = QBY[id], f = FAMILY[id];
    ALL.filter((c) => c.key === mine && !(T.pc(c.root) === rp && c.id === id)).forEach((c) => {
      const semi = mod(T.pc(c.root) - rp);
      out.push(Object.assign(at(root, semi, c.id), { kind: 'same', label: 'Same notes, other name', why: `The notes are identical. Which name fits depends on the bass note: with ${at(root, semi, c.id).name.replace(QBY[c.id].suf, '')} underneath it is heard as this chord.` }));
    });
    if (q.degs.length >= 4) { // take the root away
      const rest = new Set(I.pcs(root, id)); rest.delete(rp);
      const k = keyOf(rest), hit = ALL.filter((c) => c.key === k).sort((a, b) => PREF.indexOf(a.id) - PREF.indexOf(b.id))[0];
      if (hit) out.push(Object.assign(at(root, mod(T.pc(hit.root) - rp), hit.id), { kind: 'rootless', label: 'Without its root', why: 'Leave the root to the bass and what remains is this smaller chord. Any shape you know for it is a rootless voicing of the big one.' }));
    }
    T.QUALS.forEach((o) => { // same root, one note moved
      if (o.id === id || o.degs.length !== q.degs.length) return;
      const a = semis(id), b = semis(o.id), diff = a.map((s, i) => b[i] - s).map((d, i) => [d, i]).filter(([d]) => d !== 0);
      if (diff.length !== 1 || Math.abs(diff[0][0]) > 2) return;
      const [d, i] = diff[0], num = +q.degs[i].replace(/\D/g, '');
      out.push(Object.assign(at(root, 0, o.id), { kind: 'step', label: `${d < 0 ? 'Lower' : 'Raise'} the ${MOVE_WORD[num] || num}`, why: `One note moves ${Math.abs(d) === 1 ? 'a half step' : 'a whole step'}; everything else stays.` }));
    });
    const sub = (semi, qid, label, why) => out.push(Object.assign(at(root, semi, qid), { kind: 'sub', label, why }));
    if (f === 'maj') { sub(9, simple(id) ? 'm' : 'm7', 'Relative minor', 'Built a 6th up (three frets down). It can replace this chord, or extend it.'); sub(4, simple(id) ? 'm' : 'm7', 'Mediant', simple(id) ? 'The iii chord: it shares this chord’s 3rd and 5th.' : 'The iii chord: this chord’s 3rd, 5th and 7th, with its 9th on top.'); }
    if (f === 'min' && id !== 'mMaj7' && id !== 'm6') sub(3, simple(id) ? 'maj' : 'maj7', 'Relative major', 'Built a minor 3rd up. The same scale, heard from its bright side.');
    if (f === 'dom' && id !== '7sus4') { sub(6, '7', 'Tritone substitute', 'Same 3rd and 7th, with the root a tritone away. Gives a bass line that falls by half step.'); sub(4, 'dim7', 'Diminished on the 3rd', 'A diminished 7th built on this chord’s 3rd is this chord with a ♭9 and no root.'); }
    const seen = new Set();
    return out.filter((r) => { const k = r.root + r.id; if (seen.has(k)) return false; seen.add(k); return true; });
  };

  // ---- what to play over it ----
  I.scales = (root, id) => {
    const f = FAMILY[id], out = [], add = (semi, sid, why) => out.push({ root: T.KEYS[mod(T.pc(root) + semi)], id: sid, why });
    if (f === 'maj') { add(0, 'major', 'The plain choice when this is the I chord.'); add(0, 'lydian', 'Raises the 4th so no note clashes. The sound of a IV chord, or a dreamy I.'); add(0, 'majpent', 'Five safe notes.'); }
    else if (id === 'mMaj7' || id === 'm6') { add(0, 'mel', 'Minor with a natural 6th and 7th: every note of the chord is in it.'); if (id === 'mMaj7') add(0, 'harm', 'Darker, with the flat 6th.'); else add(0, 'dorian', 'Also has the natural 6th.'); }
    else if (f === 'min') { add(0, 'dorian', 'The usual choice on a ii chord or a minor vamp.'); add(0, 'minor', 'When this is the vi or the i chord.'); add(0, 'minpent', 'Five notes that never clash.'); }
    else if (id === '7b9') { add(5, 'harm', 'Play the harmonic minor of the chord it resolves to. That scale contains this chord’s ♭9.'); add(0, 'mixo', 'Works if you avoid the natural 2nd.'); }
    else if (id === '7s9') { add(0, 'blues', 'The ♯9 is the blues scale’s ♭3 sitting on top of a major 3rd.'); add(0, 'minpent', 'The same clash, with fewer notes.'); }
    else if (id === '7sus4') { add(0, 'mixo', 'The scale this chord is built from. Lean on the 4th; touch the 3rd only in passing.'); add(7, 'dorian', 'The same seven notes, heard from the 5th: this chord is that minor 7 chord with this root in the bass.'); add(10, 'majpent', 'The major pentatonic a whole step below the root: it gives this chord its root, 2nd, 4th, 5th and ♭7th, and leaves the 3rd out.'); }
    else if (f === 'dom') { add(0, 'mixo', 'Major with a flat 7th: the scale this chord is built from.'); add(0, 'blues', 'Rub the ♭3 against the chord’s major 3rd.'); add(0, 'majpent', 'The sweet side of a dominant chord.'); }
    else if (f === 'hdim') add(0, 'locrian', 'The seventh mode of the major scale a half step up.');
    else if (f === 'dim') add(1, 'harm', 'The harmonic minor scale a half step up contains every note of the chord.');
    else if (f === 'aug') add(9, 'harm', 'This is the III+ chord of that harmonic minor scale.');
    else if (id === 'sus2') { add(0, 'major', 'No 3rd in the chord, so major…'); add(0, 'dorian', '…or minor both fit.'); }
    else if (f === 'sus') { add(0, 'mixo', 'Lean on the 4th; touch the 3rd only in passing.'); add(0, 'major', 'With no 3rd in the chord, the major scale fits as well.'); }
    else { add(0, 'minpent', 'Rock and blues.'); add(0, 'majpent', 'Brighter.'); }
    return out;
  };

  // ---- progressions that use it ----
  const LOOSE = { maj: ['maj', 'maj7', '6', 'add9', '69', 'maj9'], m: ['m', 'm7', 'm9'], 7: ['7', '9', '13'], maj7: ['maj7', 'maj9', '6', '69'], m7: ['m7', 'm9'], m7b5: ['m7b5'], dim: ['dim'] };
  I.progs = (root, id) => {
    const rp = T.pc(root), out = [];
    T.PROGS.forEach((p) => {
      const keys = [];
      T.KEYS.forEach((K) => {
        const bars = T.progChords(K, p), hit = [];
        bars.forEach((b, i) => { if (T.pc(b.chord.root) === rp && (LOOSE[b.chord.id] || [b.chord.id]).includes(id)) hit.push(i); });
        if (hit.length) keys.push({ key: K, at: hit, roman: bars[hit[0]].roman });
      });
      if (keys.length) out.push({ id: p.id, name: p.name, keys });
    });
    return out;
  };

  // ---- sound and style: the only hand-written part ----
  const S = (sound, heard, core, drop) => ({ sound, heard, core, drop });
  I.STYLE = {
    maj: S('Stable and bright. The sound of arrival.', 'Everything: folk, pop, rock, country, classical.', 'The 3rd makes it major.', 'The 5th can go; the root can move to the bass.'),
    m: S('Stable but dark.', 'Everything, especially ballads, folk and rock.', 'The flat 3rd makes it minor.', 'The 5th.'),
    5: S('Hollow and strong: neither major nor minor.', 'Rock, punk and metal, usually with distortion, where a full chord would turn to mud.', 'Root and 5th are the whole chord.', 'Nothing to spare.'),
    sus2: S('Open and unresolved, without tension.', 'Pop and rock intros, ambient guitar, hymn-like piano.', 'The 2nd standing where the 3rd should be.', 'The 5th.'),
    sus4: S('Held breath. It wants its 4th to fall to the 3rd.', 'Rock anthems, gospel, and the “amen” at the end of a hymn.', 'The 4th.', 'The 5th.'),
    dim: S('Tense and unstable.', 'Passing chords in gospel, ragtime and old jazz; the vii° chord of a key.', 'The flat 5th against the root.', 'Nothing: it is only three notes.'),
    aug: S('Bright and strange, pulling upward.', 'Passing chords in 1960s pop and soul, show tunes, the “dream sequence” sound.', 'The raised 5th.', 'Nothing.'),
    6: S('Sweet, settled, a little old-fashioned.', 'Swing, western swing, bossa nova, and the last chord of a jazz tune.', 'The 6th on top of a major triad.', 'The 5th.'),
    m6: S('Minor with a bittersweet lift.', 'Gypsy jazz, bossa nova, film noir, tango.', 'The natural 6th against the flat 3rd.', 'The 5th.'),
    maj7: S('Warm, soft, slightly wistful.', 'Jazz ballads, bossa nova, soul, city pop, and the electric-piano sound of 1970s records.', 'The 3rd and the 7th.', 'The 5th, and the root if a bass is playing.'),
    7: S('Restless. It leans toward the chord a fourth above.', 'Blues, where it is every chord; and as the V chord in every style.', 'The 3rd and flat 7th, a tritone apart.', 'The 5th, and the root if a bass is playing.'),
    m7: S('Mellow and smooth; minor without the weight.', 'Soul, funk, R&B, jazz, and most Rhodes comping.', 'The flat 3rd and flat 7th.', 'The 5th.'),
    mMaj7: S('Dark and unsettled: a minor chord with a bright, clashing 7th.', 'Spy-film endings, the first step of a falling line (Am → Am(maj7) → Am7), minor-key jazz.', 'The flat 3rd against the major 7th.', 'The 5th.'),
    m7b5: S('Sad and unresolved.', 'The ii chord of every minor-key jazz tune; ballads and bossa nova.', 'The flat 5th.', 'Nothing comfortably: all four notes matter.'),
    dim7: S('Maximum tension, and the same in every inversion.', 'Silent-film drama, gospel passing chords, and as a hidden dominant in jazz.', 'It is two tritones stacked. Every note is equally important.', 'Nothing.'),
    '7sus4': S('Floating: a dominant chord that does not push.', 'Modal jazz, gospel, 1970s soul and fusion. A whole tune can sit on it.', 'The 4th and the flat 7th.', 'The 5th.'),
    add9: S('A major chord with sparkle.', 'Pop, rock ballads, country, worship music.', 'The 9th ringing against the 3rd.', 'The 5th.'),
    69: S('Rich and completely at rest.', 'Bossa nova, and the final chord of countless jazz and funk tunes.', 'The 6th and 9th together.', 'The 5th, and the root with a bass player.'),
    maj9: S('Lush, wide and airy.', 'Neo-soul, R&B, jazz ballads, lo-fi. A signature Rhodes chord.', 'The 3rd, 7th and 9th.', 'The 5th, then the root.'),
    9: S('A dominant 7 with a funkier, fuller top.', 'Funk rhythm guitar, jump blues, soul horn sections.', 'The 3rd, flat 7th and 9th.', 'The 5th, then the root.'),
    m9: S('Deep, smooth, late-night.', 'Neo-soul, jazz-funk, house. The classic Rhodes ballad chord.', 'The flat 3rd, flat 7th and 9th.', 'The 5th, then the root.'),
    13: S('Big, bright and bluesy at once.', 'Big-band shout chords, jazz-blues, funk stabs.', 'The 3rd, flat 7th and 13th.', 'The 5th, the 9th, and the root with a bass player.'),
    '7b9': S('Dark, urgent, pointing hard at a minor chord.', 'The V chord in minor-key jazz, flamenco, tango, film scores.', 'The 3rd, flat 7th and flat 9th.', 'The 5th, and the root: without it, it is a diminished 7th.'),
    '7s9': S('Gritty: major and minor 3rds at the same time.', 'Blues-rock, funk, and jazz when the V chord needs teeth.', 'The 3rd low down and the sharp 9th on top.', 'The 5th.'),
  };

  I.forChord = (root, id) => (QBY[id] ? { jobs: I.jobs(root, id), moves: I.moves(root, id), relatives: I.relatives(root, id), scales: I.scales(root, id), progs: I.progs(root, id), style: I.STYLE[id] } : null);
})();
