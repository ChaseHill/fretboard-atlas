// The keyboard drill library: the same idea as js/drills.js, written for two hands on the keys.
// A drill is a list of timed events; each event is one or more keys (MIDI numbers) with a label, a colour role and a hand.
// Every exercise here is written for this app. Durations are in beats.
(() => {
  'use strict';
  const G = (window.G = window.G || {}), T = G.T;
  if (!T || !T.keyVoicings) return;
  const mod = T.mod, pcOf = T.pc;
  const baseOf = (key) => { const rp = pcOf(key); return 60 + (rp <= 5 ? rp : rp - 12); }; // the key note nearest middle C
  // a scale as something to index into: note(i) is the i-th step above the root, any number of octaves
  const scale = (key, id) => {
    const sc = T.scale(key, id || 'major'), rp = pcOf(key), sem = sc.tones.map((t) => mod(t.pc - rp)), n = sem.length, base = baseOf(key);
    const at = (i, o) => { const k = ((i % n) + n) % n, oct = Math.floor(i / n); return Object.assign({ midi: base + 12 * oct + sem[k], label: sc.tones[k].deg, note: sc.tones[k].note, role: sc.tones[k].role, hand: 'R' }, o || {}); };
    return { sc, n, base, at };
  };
  const K = (midi, label, role, hand, note) => ({ midi, label: String(label), role: role || 'ext', hand: hand || 'R', note: note || T.noteName(midi) });
  const E = (n, d, o) => Object.assign({ n: [].concat(n), d: d == null ? 0.5 : d }, o || {});
  const R = (d) => ({ n: [], d });
  const run = (notes, d, o) => notes.map((n) => E(n, d, o));
  const updown = (a) => a.concat(a.slice(0, -1).reverse());
  const fing = (n, f) => Object.assign({}, n, { finger: f });
  const left = (n, f) => Object.assign({}, n, { midi: n.midi - 12, hand: 'L', finger: f });
  // voicings from the keyboard chord library
  const voicings = (root, q) => T.keyVoicings(root, T.baseQuality ? T.baseQuality(root, q) : q) || [];
  const named = (root, q, re) => voicings(root, q).find((v) => re.test(v.name || '')) || voicings(root, q)[0];
  const notesOf = (v) => v.notes.map((n) => ({ midi: n.midi, label: n.deg, note: n.note, role: n.role, hand: n.hand, finger: n.finger }));
  const cname = (root, q) => T.chord(root, q).name;
  const C = (root, q, re, d, o) => E(notesOf(named(root, q, re)), d, Object.assign({ name: cname(root, q) }, o || {}));
  const dia = (key) => T.diatonic(key);
  const twoFive = (key) => { const d = dia(key); return [[d[1].root, d[1].sev], [d[4].root, d[4].sev], [d[0].root, d[0].sev], [d[0].root, d[0].sev]]; };
  const cycle = (key) => Array(12).fill(0).map((_, k) => T.KEYS[mod(pcOf(key) + k * 5)]);
  const rh = (v) => notesOf(v).filter((n) => n.hand === 'R'), lh = (v) => notesOf(v).filter((n) => n.hand === 'L');
  // the smoothest rootless ii–V–I: A form, B form, A form (or the other way round)
  const rootless = (key, startB) => { const f = startB ? [/B form/, /A form/, /B form/, /B form/] : [/A form/, /B form/, /A form/, /A form/]; return twoFive(key).map(([r, q], k) => Object.assign({}, named(r, q, f[k]), { name: cname(r, q) })); };
  const shells = (key) => { const f = [/3 above/, /7 above/, /3 above/, /3 above/]; return twoFive(key).map(([r, q], k) => Object.assign({}, named(r, q, f[k]), { name: cname(r, q) })); };

  const list = [];
  const D = (id, group, name, level, from, text, tip, make, o) => list.push(Object.assign({ id, group, name, level, from, text, tip, make, tempo: [60, 100] }, o || {}));
  const TQ = 'Technique', FD = 'Foundations', CH = 'Chords', SC = 'Scales & keys', JZ = 'Jazz';

  // ======================= Technique =======================
  D('kdcontra', TQ, 'Five fingers in contrary motion', 'Beginner', ['khands', 'kfive'], 'Both thumbs start on the key note. The right hand walks up five notes while the left walks down five, then both come home.', 'The two hands mirror each other, so the same fingers play at the same time. That makes this easier than playing in parallel.',
    (c) => { const s = scale(c.key); return updown([0, 1, 2, 3, 4].map((i) => [fing(s.at(i), i + 1), Object.assign(fing(s.at(-i), i + 1), { hand: 'L' })])).map((p) => E(p, 1)); }, { tempo: [60, 100] });
  D('kdindep', TQ, 'Finger independence', 'Beginner', ['khands', 'kfive'], 'The five-finger position in a broken order: 1 3 2 4 3 5 4 2. Hands together, an octave apart.', 'Keep the fingers that are not playing resting on their keys. Only one finger moves at a time.',
    (c) => { const s = scale(c.key); return [0, 2, 1, 3, 2, 4, 3, 1].map((i) => E([fing(s.at(i), i + 1), left(s.at(i), 5 - i)], 0.5)); }, { tempo: [60, 110] });
  D('kdthirds', TQ, 'Broken thirds', 'Beginner', ['kfive', 'kintervals'], 'Skips inside the five-finger position: 1 to 3, 2 to 4, 3 to 5, and back down.', 'A third is a skip of one key. Let the hand rock gently from finger to finger.',
    (c) => { const s = scale(c.key); return [0, 2, 1, 3, 2, 4, 2, 4, 1, 3, 0, 2].map((i) => E([fing(s.at(i), i + 1), left(s.at(i), 5 - i)], 0.5)); }, { tempo: [60, 110] });
  D('kdscale2', TQ, 'Scale, two octaves', 'Intermediate', ['kmajor', 'kmusic'], 'The major scale up two octaves and back with the right hand. The thumb passes under twice on the way up.', 'Move the thumb under early, while finger 2 is still playing, so it is waiting over its key.',
    (c) => { const s = scale(c.key), f = T.keyFingering(c.key, 'major'), fs = f ? T.fingerOctaves(f.rh, 2, 'R') : []; return run(updown(Array(15).fill(0).map((_, i) => fing(s.at(i), fs[i] || ''))), 0.5); }, { tempo: [60, 120] });
  D('kdscaleht', TQ, 'Scale, hands together', 'Intermediate', ['kmajor'], 'One octave of the major scale with both hands, an octave apart. The hands cross their thumbs at different moments.', 'Learn each hand alone first. Together, go slowly enough to say the finger numbers of both hands.',
    (c) => { const s = scale(c.key), f = T.keyFingering(c.key, 'major') || { rh: [], lh: [] }; return updown(Array(8).fill(0).map((_, i) => [fing(s.at(i), f.rh[i] || ''), left(s.at(i), f.lh[i] || '')])).map((p) => E(p, 1)); }, { tempo: [50, 100] });
  D('kdchrom', TQ, 'Chromatic scale', 'Intermediate', ['kmap', 'kintervals'], 'Every key, black and white, for one octave up and back. Finger 3 plays every black key.', 'Thumb on white keys, 3 on black keys, and 2 only where two white keys sit together: at E–F and B–C.',
    (c) => { const b = baseOf(c.key), isB = (m) => [1, 3, 6, 8, 10].includes(mod(m)); return run(updown(Array(13).fill(0).map((_, i) => { const m = b + i; return Object.assign(K(m, isB(m) ? 3 : !isB(m - 1) && i ? 2 : 1, i % 12 ? 'ext' : 'root'), { finger: isB(m) ? 3 : !isB(m - 1) && i ? 2 : 1 }); })), 0.5); }, { tempo: [60, 120] });
  D('kdarp2', TQ, 'Arpeggio, two octaves', 'Intermediate', ['ktriads', 'kinversions'], 'The notes of the home chord climbing two octaves and returning. The thumb passes under after finger 3.', 'Turn the wrist slightly in the direction of travel and let the arm carry the hand. Do not reach with the fingers.',
    (c) => { const s = scale(c.key), f = [1, 2, 3, 1, 2, 3, 5]; return run(updown([0, 2, 4, 7, 9, 11, 14].map((i, k) => fing(s.at(i), f[k]))), 0.5); }, { tempo: [60, 110] });
  D('kdalberti', TQ, 'A broken-chord left hand', 'Intermediate', ['ktriads', 'kdiatonic', 'kinversions'], 'The left hand breaks each chord into low, high, middle, high. Four chords: I, IV, V and I, each in the shape nearest the last.', 'Keep the hand still and rock it. The little finger and thumb are the hinges.',
    (c) => { const s = scale(c.key), sh = [[0, 2, 4, 'I'], [0, 3, 5, 'IV'], [-1, 1, 4, 'V'], [0, 2, 4, 'I']]; return sh.flatMap(([a, b, t, nm]) => [a, t, b, t, a, t, b, t].map((i) => E(left(s.at(i), i === a ? 5 : i === t ? 1 : 3), 0.5, { name: nm }))); }, { tempo: [60, 110] });
  D('kddyn', TQ, 'Louder, then softer', 'Beginner', ['khands', 'kmusic'], 'One octave of the scale, growing on the way up and fading on the way down.', 'Loudness on a keyboard is the speed of the key going down, not how hard you press once it is there.',
    (c) => { const s = scale(c.key); return updown(Array(8).fill(0).map((_, i) => s.at(i))).map((n, k) => E(n, 0.5, { vel: 0.3 + 0.7 * (1 - Math.abs(k - 7) / 7) })); }, { tempo: [60, 100] });

  // ======================= Foundations =======================
  const IVS = ['m2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'];
  D('kdivs', FD, 'Every interval from one key', 'Beginner', ['kintervals'], 'The key note, then a note one half step further away each time, then the two together. From a minor 2nd to the octave.', 'Count the half steps for each one, black keys included, then learn the sound so you can stop counting.',
    (c) => { const b = baseOf(c.key); return IVS.flatMap((nm, k) => [E(K(b, c.key, 'root', 'R', c.key), 1), E(K(b + k + 1, nm), 1), E([K(b, c.key, 'root', 'R', c.key), K(b + k + 1, nm)], 2)]); }, { tempo: [60, 90] });
  D('kdrhythm', FD, 'The rhythm ladder', 'Beginner', ['khands', 'kfive'], 'One key, one bar at each length: a whole note, two halves, four quarters, eight eighths, twelve triplets, sixteen sixteenths.', 'Count aloud and keep the beat steady. Use fingers 3-2-1 in turn for the fast notes if one finger tires.',
    (c) => { const b = baseOf(c.key); return [[4, 1], [2, 2], [1, 4], [0.5, 8], [1 / 3, 12], [0.25, 16]].flatMap(([d, n]) => Array(n).fill(0).map((_, k) => E(K(b, c.key, 'root', 'R', c.key), d, { vel: (k * d) % 1 < 1e-6 ? 0.9 : 0.55 }))); }, { tempo: [60, 90] });
  D('kdsteps', FD, 'Whole steps and half steps', 'Beginner', ['kmap', 'kmajor'], 'The major scale, one note to a beat, with its two half steps marked. Say “whole” or “half” as you move to each note.', 'Whole, whole, half, whole, whole, whole, half. The half steps are between 3 and 4 and between 7 and 1.',
    (c) => { const s = scale(c.key); return run(updown(Array(8).fill(0).map((_, i) => s.at(i))), 1); }, { tempo: [60, 100] });

  // ======================= Chords =======================
  const INV = [/Root position/, /First inversion/, /Second inversion/, /Third inversion/];
  D('kdinv', CH, 'Triad inversions', 'Beginner', ['ktriads', 'kinversions'], 'A triad in root position, first inversion and second inversion, up and back. The same three notes each time, in a new order.', 'The top note of one shape becomes the middle note of the next. Follow it with your eye.',
    (c) => { const q = c.v ? 'm' : 'maj'; return updown([0, 1, 2].map((k) => C(c.key, q, INV[k], 2, { g: k }))); }, { vars: ['Major', 'Minor'], tempo: [60, 90] });
  const Q7 = ['maj7', '7', 'm7', 'm7b5'];
  D('kdinv7', CH, 'Seventh chord inversions', 'Intermediate', ['ksevenths', 'kinversions'], 'A four-note chord in its four positions. In each inversion two of the notes sit a step apart: that pair is the 7th and the root.', 'Find the close pair in each shape. The upper note of the pair is always the root.',
    (c) => updown([0, 1, 2, 3].map((k) => C(c.key, Q7[c.v], INV[k], 2, { g: k }))), { vars: ['Major 7', 'Dominant 7', 'Minor 7', 'Half-diminished'], tempo: [60, 90] });
  D('kdcadence', CH, 'I, IV, V and I, close together', 'Beginner', ['kinversions', 'kdiatonic'], 'The three main chords of the key with the right hand barely moving: each chord takes the inversion nearest the one before. The left hand plays the roots.', 'Notes that two chords share stay where they are. Only the others move, and only by a step.',
    (c) => { const s = scale(c.key), sh = [[0, 2, 4, 0, 'I'], [0, 3, 5, 3, 'IV'], [-1, 1, 4, 4, 'V'], [0, 2, 4, 0, 'I']]; return sh.map(([a, b, t, r, nm], g) => E([fing(s.at(a), 1), fing(s.at(b), t - b > 2 ? 2 : 3), fing(s.at(t), 5), Object.assign(left(s.at(r > 2 ? r - 7 : r), 5), { role: 'root' })], 2, { g, name: nm })); }, { tempo: [60, 90] });
  D('kddia', CH, 'The seven triads of the key', 'Beginner', ['kdiatonic', 'ktriads'], 'A triad on each note of the scale, up to the octave and back: major, minor, minor, major, major, minor, diminished.', 'The hand keeps one shape, 1-3-5, and simply moves up a key. The scale decides which chords come out major or minor.',
    (c) => { const s = scale(c.key), d = dia(c.key); return updown(Array(8).fill(0).map((_, i) => E([fing(s.at(i), 1), fing(s.at(i + 2), 3), fing(s.at(i + 4), 5)], 2, { g: i, name: d[i % 7].roman + ' · ' + cname(d[i % 7].root, d[i % 7].tri) }))); }, { tempo: [60, 90] });
  D('kddia7', CH, 'The key in seventh chords', 'Intermediate', ['kdiatonic', 'ksevenths'], 'A four-note chord on each note of the scale. Two are major sevenths, three are minor sevenths, one is a dominant seventh and one is half-diminished.', 'The only dominant seventh in the key is on the fifth note. Listen for how it leans toward home.',
    (c) => { const s = scale(c.key), d = dia(c.key); return Array(8).fill(0).map((_, i) => E([fing(s.at(i), 1), fing(s.at(i + 2), 2), fing(s.at(i + 4), 3), fing(s.at(i + 6), 5)], 2, { g: i, name: d[i % 7].roman + ' · ' + cname(d[i % 7].root, d[i % 7].sev) })); }, { tempo: [60, 90] });
  D('kdchange', CH, 'One note at a time', 'Intermediate', ['ksevenths'], 'One root, four chords: major 7, dominant 7, minor 7, half-diminished. Each lowers a single note of the last by a half step.', 'Say which note moved: the 7th, then the 3rd, then the 5th.',
    (c) => Q7.flatMap((q, g) => [C(c.key, q, INV[0], 2, { g }), C(c.key, q, INV[0], 2, { g, vel: 0.6 })]), { tempo: [60, 90] });
  D('kdbroken', CH, 'Broken chords over a bass', 'Beginner', ['ktriads', 'kdiatonic', 'kmusic'], 'The left hand holds the root while the right hand breaks the chord into 1-3-5-3. Four chords: I, vi, IV, V.', 'Let the left-hand note ring for the whole bar. The right hand should be lighter than the left.',
    (c) => { const s = scale(c.key); return [[0, 'I'], [5 - 7, 'vi'], [3 - 7, 'IV'], [4 - 7, 'V']].flatMap(([r, nm], g) => [0, 2, 4, 2, 0, 2, 4, 2].map((x, k) => E(k ? fing(s.at(r + x), x === 0 ? 1 : x === 2 ? 3 : 5) : [fing(s.at(r), 1), Object.assign(left(s.at(r), 5), { role: 'root' })], 0.5, { g, name: nm }))); }, { tempo: [60, 110] });

  // ======================= Scales & keys =======================
  D('kdcycle', SC, 'One scale through the keys', 'Intermediate', ['kcircle', 'kmajor'], 'One octave of the major scale in all twelve keys, each a fourth above the last. Every new key adds a flat or removes a sharp.', 'Say the name of the key before it starts, and how many sharps or flats it has.',
    (c) => cycle(c.key).flatMap((k, g) => { const s = scale(k), f = T.keyFingering(k, 'major'); return run(updown(Array(8).fill(0).map((_, i) => fing(s.at(i), f ? f.rh[i] : ''))), 0.5, { g, name: k + ' major' }).concat([Object.assign(R(0.5), { g })]); }), { tempo: [60, 110] });
  D('kdminor3', SC, 'Three minor scales side by side', 'Intermediate', ['kminor'], 'Natural, harmonic and melodic minor from the same key note. Only the 6th and 7th notes change.', 'Natural has a lowered 6th and 7th. Harmonic raises the 7th. Melodic raises both.',
    (c) => ['minor', 'harm', 'mel'].flatMap((id, g) => { const s = scale(c.key, id); return run(updown(Array(8).fill(0).map((_, i) => s.at(i))), 0.5, { g, name: c.key + ' ' + s.sc.def.name.toLowerCase() }).concat([Object.assign(R(0.5), { g })]); }), { tempo: [60, 100] });
  const MODES = ['lydian', 'major', 'mixo', 'dorian', 'minor', 'phrygian', 'locrian'];
  D('kdmodes', SC, 'Modes from one key, bright to dark', 'Advanced', ['kmodes'], 'All seven modes on the same key note, from Lydian down to Locrian. Each lowers one more note than the last.', 'Watch one key go from white to black, or black to white, at each change. That one key is the whole difference.',
    (c) => MODES.flatMap((id, g) => { const s = scale(c.key, id); return run(Array(8).fill(0).map((_, i) => s.at(i)), 0.5, { g, name: c.key + ' ' + (id === 'major' ? 'Ionian (major)' : id === 'minor' ? 'Aeolian (natural minor)' : s.sc.def.name) }); }), { tempo: [60, 100] });
  D('kdpent', SC, 'Pentatonic and blues scales', 'Beginner', ['kpent'], 'Five notes up and back, then the same with the blue note added. Choose minor or major pentatonic.', 'The blue note is for passing through. Slide off it onto the note above or below.',
    (c) => { const a = scale(c.key, c.v ? 'majpent' : 'minpent'), up = (s) => updown(Array(s.n + 1).fill(0).map((_, i) => s.at(i))); return c.v ? run(up(a), 0.5) : run(up(a), 0.5, { g: 0, name: c.key + ' minor pentatonic' }).concat([Object.assign(R(0.5), { g: 0 })], run(up(scale(c.key, 'blues')), 0.5, { g: 1, name: c.key + ' blues' }), [Object.assign(R(0.5), { g: 1 })]); }, { vars: ['Minor pentatonic, then blues', 'Major pentatonic'], tempo: [60, 110] });
  D('kdcontrasc', SC, 'Scale in contrary motion', 'Intermediate', ['kmajor', 'kmusic'], 'Both thumbs on the key note. The right hand plays the scale upward while the left plays it downward, one octave each, then both return.', 'In C the two hands use the same fingers at the same time. In other keys they differ: go slowly and watch the black keys.',
    (c) => { const s = scale(c.key), f = T.keyFingering(c.key, 'major') || { rh: [] }; return updown(Array(8).fill(0).map((_, i) => [fing(s.at(i), f.rh[i] || ''), Object.assign(s.at(-i), { hand: 'L' })])).map((p) => E(p, 1)); }, { tempo: [50, 100] });
  D('kdarps', SC, 'Every chord of the key as an arpeggio', 'Intermediate', ['kmusic', 'kdiatonic'], 'Root, 3rd, 5th and octave of each chord of the key in turn, up and back.', 'Say “major” or “minor” as each one starts.',
    (c) => { const s = scale(c.key), d = dia(c.key); return d.flatMap((x, i) => run([i, i + 2, i + 4, i + 7, i + 4, i + 2, i].map((k) => s.at(k)), 0.5, { g: i, name: x.roman + ' · ' + cname(x.root, x.tri) }).concat([Object.assign(R(0.5), { g: i })])); }, { tempo: [60, 110] });

  // ======================= Jazz =======================
  D('kdshell', JZ, 'Shells through ii–V–I', 'Intermediate', ['kjazz', 'ksevenths'], 'Root and one guide tone in the left hand, the rest in the right. The two shell shapes alternate so the hands hardly move.', 'Watch the 7th of each chord fall a step to become the 3rd of the next.',
    (c) => shells(c.key).flatMap((v, g) => [E(notesOf(v), 2, { g, name: v.name }), E(notesOf(v), 2, { g, name: v.name, vel: 0.6 })]), { tempo: [60, 110] });
  D('kdrootless', JZ, 'Rootless voicings, A and B', 'Advanced', ['kjazz'], 'The left hand plays the root on beat one; the right hand answers with a four-note chord that leaves the root out. The A and B forms alternate for the smoothest motion.', 'In a group the bass player has the root, and the right-hand shape moves down into the left hand.',
    (c) => rootless(c.key, c.v === 1).flatMap((v, g) => [E(lh(v), 1, { g, name: v.name }), E(rh(v), 3, { g, name: v.name })]), { vars: ['Start on the A form', 'Start on the B form'], tempo: [60, 110] });
  D('kdguide', JZ, 'Guide tones over the root', 'Intermediate', ['kjazz', 'ksevenths'], 'Just three notes: the root below and the 3rd and 7th above. One guide tone stays and the other falls a half step at each change.', 'These two notes are the chord. Everything else is colour.',
    (c) => shells(c.key).flatMap((v, g) => { const n = notesOf(v), gt = n.filter((x) => /3|7/.test(x.label)), rt = n.filter((x) => x.label === '1'); return [E(rt, 1, { g, name: v.name }), E(gt, 3, { g, name: v.name })]; }), { tempo: [60, 110] });
  D('kdcharl', JZ, 'Comping: one, and of two', 'Advanced', ['kjazz'], 'Rootless chords in the classic two-hit rhythm: long on beat 1, short on the “and” of 2, swung. The left hand marks the root on beat one.', 'Say “daah, dit”, then leave the rest of the bar empty.',
    (c) => ({ ev: rootless(c.key).flatMap((v, g) => [E(notesOf(v), 1.5, { g, name: v.name }), E(rh(v), 0.5, { g, name: v.name, vel: 0.7 }), Object.assign(R(2), { g })]), swing: true }), { tempo: [60, 120] });
  D('kd24', JZ, 'Comping: beats 2 and 4', 'Intermediate', ['kjazz'], 'The left hand plays the root on beats 1 and 3 and the right hand answers on 2 and 4.', 'Left, right, left, right, like walking. Keep the right-hand chords short.',
    (c) => rootless(c.key).flatMap((v, g) => [E(lh(v), 1, { g, name: v.name }), E(rh(v), 1, { g, name: v.name, vel: 0.75 }), E(lh(v), 1, { g, name: v.name }), E(rh(v), 1, { g, name: v.name, vel: 0.75 })]), { tempo: [60, 120] });
  D('kdcyc7', JZ, 'Dominants round the cycle', 'Advanced', ['kjazz', 'kcircle'], 'Twelve dominant sevenths as shells, each a fourth above the last. The two shell shapes alternate and the guide tones sink a half step at a time.', 'The 3rd of each chord becomes the 7th of the next.',
    (c) => cycle(c.key).map((r, g) => { const v = named(r, '7', g % 2 ? /7 above/ : /3 above/); return E(notesOf(v).filter((n) => !/5/.test(n.label)), 2, { g, name: cname(r, '7') }); }), { tempo: [60, 100] });
  D('kdarp251', JZ, 'Arpeggios through ii–V–I', 'Advanced', ['kjazz', 'kmusic'], 'The seventh arpeggio of each chord, up four notes and back, with the right hand. Two bars on the I chord.', 'Each arpeggio starts a different distance from home but uses only notes of the key.',
    (c) => { const s = scale(c.key), d = dia(c.key); return [[1, d[1]], [4 - 7, d[4]], [0, d[0]], [0, d[0]]].flatMap(([i, x], g) => run([i, i + 2, i + 4, i + 6, i + 4, i + 2, i].map((k) => s.at(k)), 0.5, { g, name: cname(x.root, x.sev) }).concat([Object.assign(R(0.5), { g })])); }, { tempo: [60, 120] });
  D('kdcells', JZ, 'Four-note cells: 1 2 3 5', 'Advanced', ['kjazz', 'kmusic'], 'The 1st, 2nd, 3rd and 5th notes above each chord’s root, up and back, through ii–V–I.', 'A tiny vocabulary that fits any chord. Drill it until you can start it on any beat.',
    (c) => { const s = scale(c.key), d = dia(c.key); return [[1, d[1]], [4 - 7, d[4]], [0, d[0]], [0, d[0]]].flatMap(([i, x], g) => run([i, i + 1, i + 2, i + 4, i + 4, i + 2, i + 1, i].map((k) => s.at(k)), 0.5, { g, name: cname(x.root, x.sev) })); }, { tempo: [60, 120] });
  D('kdenclose', JZ, 'Enclosures', 'Advanced', ['kjazz'], 'Each note of the home chord is surrounded: the scale note above, the key a half step below, then the target on the beat.', 'Above, below, home. The half step below can be any key, black or white.',
    (c) => { const s = scale(c.key); return [0, 2, 4, 7].flatMap((k) => { const t = s.at(k); return [E(s.at(k + 1), 0.5, { vel: 0.7 }), E(K(t.midi - 1, '↗', 'fifth'), 0.5, { vel: 0.6 }), E(t, 1), R(2)]; }); }, { tempo: [60, 110] });
  D('kdbebop', JZ, 'A passing note on the V chord', 'Advanced', ['kjazz', 'kmodes'], 'The scale of the V chord coming down from its root with one extra key between the root and the 7th. Eight notes fill the bar and the chord tones land on the beat.', 'Tap your foot: root, 7th, 5th and 3rd fall on the taps.',
    (c) => { const s = scale(c.key), top = s.at(4), nm = cname(dia(c.key)[4].root, '7'); return run([top, K(top.midi - 1, '•', 'fifth'), s.at(3), s.at(2), s.at(1), s.at(0), s.at(-1), s.at(-2)], 0.5, { name: nm }).concat([E(s.at(-3), 2, { name: nm }), R(2)]); }, { tempo: [60, 120] });
  D('kdbossa', JZ, 'Bossa nova through ii–V–I', 'Intermediate', ['kjazz'], 'The left hand plays the root on beats 1 and 3. The right hand plays its chord on beat 1, the “and” of 2, and beat 4, in even eighths.', 'The right-hand rhythm never changes. Keep it going through the chord changes.',
    (c) => rootless(c.key).flatMap((v, g) => [E(notesOf(v), 1.5, { g, name: v.name }), E(rh(v), 0.5, { g, name: v.name, vel: 0.7 }), E(lh(v), 1, { g, name: v.name }), E(rh(v), 1, { g, name: v.name, vel: 0.7 })]), { tempo: [60, 110] });
  D('kddrop2', JZ, 'Drop 2 voicings', 'Advanced', ['kjazz', 'kinversions'], 'A seventh chord spread across two hands: the second note from the top is dropped an octave into the left hand. Four voicings, each with a different note on top.', 'Name the top note of each one. That is the melody note the voicing gives you.',
    (c) => { const v = voicings(c.key, Q7[c.v]).filter((x) => /Drop-2/.test(x.name || '')); return updown(v.map((x, g) => E(notesOf(x), 2, { g, name: cname(c.key, Q7[c.v]) }))); }, { vars: ['Major 7', 'Dominant 7', 'Minor 7', 'Half-diminished'], tempo: [60, 90] });
  D('kdtritone', JZ, 'A dominant and its substitute', 'Advanced', ['kjazz', 'kcircle'], 'The V chord, then the dominant a tritone away, then home. The right hand’s guide tones are the same two keys for both dominants; only the left-hand root moves.', 'Hold the right hand still and listen to the bass slide down a half step into the I chord.',
    (c) => { const d = dia(c.key), sub = T.KEYS[mod(pcOf(d[4].root) + 6)], gt = (r, re) => notesOf(named(r, '7', re)).filter((n) => !/5/.test(n.label)); return [E(gt(d[4].root, /3 above/), 2, { g: 0, name: cname(d[4].root, '7') }), E(gt(sub, /7 above/), 2, { g: 1, name: cname(sub, '7') }), C(d[0].root, d[0].sev, /3 above/, 4, { g: 2 })]; }, { tempo: [60, 100] });

  const byId = Object.fromEntries(list.map((d) => [d.id, d]));
  // practice items the keyboard side already had, filed under the lessons they belong to
  const OTHER = {
    khands: ['kfive'], kfive: ['kfive', 'kscale'], kmap: ['kname', 'kfind'], kintervals: ['kiv', 'kear'], kmajor: ['kscale'], ktriads: ['karp'], kdiatonic: ['three', 'pop', 'fifties', 'canon', 'kearfn'], ksevenths: ['jazz', 'turn', 'kearch'],
    kminor: ['m145', 'andalu', 'mpop', 'borrow'], kjazz: ['jazz', 'turn', 'm251', 'turn6', 'three6', 'tritone', 'cycle4'], kcircle: ['cycle4', 'kkeyq'], kpent: ['blues'],
  };
  G.KeyDrills = { list, byId, groups: [TQ, FD, CH, SC, JZ], forLesson: (id) => list.filter((d) => d.from.includes(id)).map((d) => d.id).concat(OTHER[id] || []) };
})();
