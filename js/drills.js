// The drill library. Each drill is a short list of timed events (single notes, notes together, or strums) that the
// Practice tab plays against the metronome. Drills are grouped by the same six sections as the lessons and each one
// names the lessons it belongs to, so a lesson can point at its drills and a drill back at its lessons.
// Every exercise here is written for this app. Durations are in beats.
(() => {
  'use strict';
  const G = (window.G = window.G || {}), T = G.T;
  if (!T) return;
  const TUN = T.TUNING, mod = T.mod, pcOf = T.pc;
  const nn = (s, f) => T.noteName(TUN[s] + f);
  // one note: string 6..1, fret, label (note name by default), colour role
  const N = (string, fret, label, role) => ({ s: 6 - string, f: fret, label: label == null ? nn(6 - string, fret) : String(label), role: role || 'ext' });
  const E = (n, d, o) => Object.assign({ n: [].concat(n), d: d == null ? 0.5 : d }, o || {});
  const R = (d) => ({ n: [], d });
  const run = (notes, d, o) => notes.map((n) => E(n, d, o));
  const updown = (a) => a.concat(a.slice(0, -1).reverse());
  const fr = (x) => (typeof x === 'string' ? [...x].map((c) => (c === 'x' ? null : +c)) : x);
  const S = (frets, d, o) => Object.assign({ frets: fr(frets), d: d == null ? 1 : d }, o || {});
  const top = (frets, n) => fr(frets).map((f, s) => (s >= 6 - n ? f : null));
  const at = (frets, string) => { const f = fr(frets)[6 - string]; return f == null ? null : N(string, f); };
  const rootFret6 = (key) => mod(pcOf(key) - 4);                       // fret of the key note on string 6 (0 to 11)
  const lowRoot = (key) => { const f = rootFret6(key); return f <= 6 ? [6, f] : [5, f - 5]; }; // nearest low root: string, fret
  const naturals = (string, hi) => { const out = []; for (let f = 0; f <= hi; f++) if (nn(6 - string, f).length === 1) out.push(N(string, f)); return out; };

  // open chords the beginner drills use: frets, root string, a second bass string
  const OPEN = {
    G: ['320003', 6, 4], C: ['x32010', 5, 4], D: ['x00232', 4, 5], Em: ['022000', 6, 5], Am: ['x02210', 5, 4], E: ['022100', 6, 5], A: ['x02220', 5, 4],
    Dm: ['x00231', 4, 5], F: ['xx3211', 4, 3], A7: ['x02020', 5, 4], E7: ['020100', 6, 5], D7: ['x00212', 4, 5], G7: ['320001', 6, 4], C7: ['x32310', 5, 4], B7: ['x21202', 5, 4],
  };
  const OC = ['G', 'C', 'D', 'Em', 'Am', 'E', 'A'];
  const PAIRS = [['C', 'Am'], ['A', 'D'], ['A', 'E'], ['D', 'E'], ['G', 'C'], ['G', 'D'], ['C', 'G'], ['Em', 'G'], ['Am', 'Dm'], ['Am', 'E'], ['C', 'F'], ['G', 'Em'], ['D', 'Em'], ['E7', 'A7']];
  const oc = (name) => OPEN[name][0];
  const tag = (name) => ({ name });

  // scale positions as plain notes, sorted low to high, labelled by degree
  const posOf = (root, id, deg) => {
    const sc = T.scale(root, id), all = T.scalePositions(sc), p = (deg && all.find((x) => x[0].tone.deg === deg)) || all[0];
    return p.map((n) => ({ s: n.s, f: n.f, label: n.tone.deg, role: n.tone.role, pitch: n.pitch })).sort((a, b) => a.pitch - b.pitch);
  };
  const lift = (ns) => (Math.min(...ns.map((n) => n.f)) < 1 && Math.max(...ns.map((n) => n.f)) <= 5 ? ns.map((n) => Object.assign({}, n, { f: n.f + 12, pitch: n.pitch + 12 })) : ns);
  const octave = (root, id) => posOf(root, id, '1').slice(0, T.scale(root, id).tones.length + 1);
  const boxes = (key, id) => ['1', '♭3', '4', '5', '♭7'].map((d) => posOf(key, id || 'minpent', d));

  // voicings from the chord library, nearest to a place on the neck
  const mid = (v) => ((v.lo || 0) + v.hi) / 2;
  const KINDS = { shell: (v) => v.kind === 'shellR' && v.frets[2] !== null && v.frets[3] !== null, guide: (v) => v.kind === 'shell' && v.rootless, rootless: (v) => v.rootless && v.kind !== 'shell', drop2: (v) => v.kind === 'drop2' && v.frets[0] === null && v.frets[1] === null, caged: (v) => v.kind === 'caged', triad: (v) => v.kind === 'triad' && v.frets[5] !== null };
  const voice = (root, q, style, near) => {
    const c = T.chord(root, q), pool = c.voicings.filter((v) => KINDS[style](v) && !v.stretch);
    const v = (pool.length ? pool : c.voicings).slice().sort((a, b) => Math.abs(mid(a) - near) - Math.abs(mid(b) - near))[0];
    return Object.assign({ name: c.name }, v);
  };
  // a line of chords, each placed as near as possible to the one before
  const lead = (chords, style, start) => { let near = start == null ? 5 : start; return chords.map(([root, q]) => { const v = voice(root, q, style, near); near = mid(v); return v; }); };
  const dia = (key) => T.diatonic(key);
  const twoFive = (key) => { const d = dia(key); return [[d[1].root, d[1].sev], [d[4].root, d[4].sev], [d[0].root, d[0].sev], [d[0].root, d[0].sev]]; };
  const SV = (v, d, o) => S(v.frets, d, Object.assign({ name: v.name }, o || {}));
  const bassOf = (v) => { const s = v.frets.findIndex((f) => f !== null); return { s, f: v.frets[s], label: nn(s, v.frets[s]), role: 'root' }; };
  const upperOf = (v) => { const s0 = v.frets.findIndex((f) => f !== null); return v.frets.map((f, s) => (f === null || s === s0 ? null : { s, f, label: v.notes[s] ? v.notes[s].deg : nn(s, f), role: 'guide' })).filter(Boolean); };

  const list = [];
  const D = (id, group, name, level, from, text, tip, make, o) => list.push(Object.assign({ id, group, name, level, from, text, tip, make, tempo: [60, 100] }, o || {}));
  const GS = 'Getting started', TQ = 'Technique', FD = 'Foundations', CH = 'Chords', SC = 'Scales & keys', JZ = 'Jazz';

  // ======================= Getting started =======================
  D('gsopen', GS, 'Open strings by name', 'Beginner', ['meet', 'tuning', 'firstnotes'], 'The six open strings from the thickest to the thinnest and back, one to a beat. Say each letter as it sounds.', 'E, A, D, G, B, E. If you can say them in both directions without thinking, every later lesson gets easier.',
    () => run(updown([6, 5, 4, 3, 2, 1].map((s) => N(s, 0))), 1), { tempo: [60, 90] });
  D('gsstring', GS, 'First notes, one string', 'Beginner', ['firstnotes', 'reading'], 'The natural notes in the first three frets of one string, up and back. Choose the string with the stepper.', 'Fret number equals finger number. Keep each finger down until the next note has sounded.',
    (c) => run(updown(naturals(c.string, 3)), 1), { opts: ['string'], tempo: [60, 90] });
  D('gsrun', GS, 'First position, all six strings', 'Beginner', ['firstnotes', 'staff', 'openscales'], 'Every natural note of first position as one long run, from the low E to the G on string 1 and back.', 'This is the whole first position: seventeen notes. Name them aloud going up, then coming down.',
    () => run(updown([6, 5, 4, 3, 2, 1].flatMap((s) => naturals(s, 3))), 0.5), { tempo: [60, 110] });
  D('gsfingers', GS, 'One finger for each fret', 'Beginner', ['hold', 'firstnotes', 'warmups'], 'Frets 1, 2, 3 and 4 with fingers 1, 2, 3 and 4 on one string, then back down. The pegs show the finger numbers.', 'Place each finger just behind its fret and leave it there while the next one lands.',
    (c) => run(updown([1, 2, 3, 4].map((f) => N(c.string, f, f))), 1), { opts: ['string'], tempo: [50, 90] });
  D('gstune', GS, 'Fifth-fret tuning check', 'Beginner', ['tuning'], 'A fretted note, then the open string that should match it. Five pairs. On your own guitar the two should sound as one note with no wobble.', 'Fret 5 gives the next string’s open note everywhere except string 3, where it is fret 4.',
    () => [[6, 5, 5], [5, 5, 4], [4, 5, 3], [3, 4, 2], [2, 5, 1]].flatMap(([s, f, o]) => [E(N(s, f, null, 'root'), 2), E(N(o, 0), 2)]), { tempo: [60, 60] });
  D('gscount', GS, 'Quarters, then eighths', 'Beginner', ['firstnotes', 'rhythm', 'picking'], 'One open string. A bar of four quarter notes, then a bar of eight eighth notes, round and round. Count “1 2 3 4”, then “1 and 2 and 3 and 4 and”.', 'The beat does not change when the notes get shorter. Tap your foot the same way through both bars.',
    (c) => run(Array(4).fill(N(c.string, 0)), 1).concat(run(Array(8).fill(N(c.string, 0)), 0.5)), { opts: ['string'], tempo: [60, 100] });
  D('gsstrum', GS, 'First strums on open strings', 'Beginner', ['hold', 'strum'], 'All six open strings. A bar of four down-strums, then a bar of down-up strums in eighth notes.', 'Swing the arm from the elbow like a pendulum. The up-strum only needs to catch the top three or four strings.',
    () => Array(4).fill(0).map(() => S('000000', 1, tag('Open strings'))).concat(Array(8).fill(0).map((_, k) => S(k % 2 ? 'xx0000' : '000000', 0.5, { up: !!(k % 2), vel: k % 2 ? 0.5 : 0.85, name: 'Open strings' }))), { tempo: [60, 90] });

  // ======================= Technique =======================
  D('wupairs', TQ, 'Finger pairs', 'Beginner', ['warmups'], 'Two fingers at a time on every string: 1-2, 1-3, 1-4, 2-3, 2-4, then 3-4. The last two pairs are the weak ones.', 'Fingers 3 and 4 share a tendon and resist moving apart. Slow, even pairs are how you separate them.',
    (c) => [[1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]].flatMap(([a, b]) => [6, 5, 4, 3, 2, 1].flatMap((s) => [E(N(s, c.fret + a - 1, a)), E(N(s, c.fret + b - 1, b))])), { opts: ['fret'], tempo: [60, 110] });
  D('wuperm', TQ, 'Finger orders', 'Intermediate', ['warmups'], 'The same four frets in a different finger order on each pass. Choose the order from the list.', 'There are twenty-four orders of four fingers. Six begin with finger 1; work through them over a week.',
    (c) => { const o = [[1, 2, 3, 4], [1, 2, 4, 3], [1, 3, 2, 4], [1, 3, 4, 2], [1, 4, 2, 3], [1, 4, 3, 2]][c.v]; return [6, 5, 4, 3, 2, 1].flatMap((s) => o.map((k) => E(N(s, c.fret + k - 1, k)))); },
    { opts: ['fret'], vars: ['1-2-3-4', '1-2-4-3', '1-3-2-4', '1-3-4-2', '1-4-2-3', '1-4-3-2'], tempo: [60, 110] });
  D('pkalt', TQ, 'Down on the beat, up between', 'Beginner', ['picking', 'firstnotes'], 'Each note twice, in eighth notes: a downstroke on the beat and an upstroke on the “and”. Up the first four frets and back.', 'The pick moves down-up without a break, whether or not the fretting hand is changing note.',
    (c) => [0, 1, 2, 3, 4, 3, 2, 1].flatMap((f) => [E(N(c.string, f, f || 'o'), 0.5, { vel: 0.95 }), E(N(c.string, f, f || 'o'), 0.5, { vel: 0.65 })]), { opts: ['string'], tempo: [60, 120] });
  D('pkcross', TQ, 'Crossing strings', 'Beginner', ['picking'], 'Two notes on each string, two frets apart, across all six strings and back, in strict down-up picking.', 'Going up the strings the pick leaves a string on an upstroke and has to hop over it. That hop is the skill.',
    (c) => run(updown([6, 5, 4, 3, 2, 1].flatMap((s) => [N(s, c.fret, 1), N(s, c.fret + 2, 3)])), 0.5), { opts: ['fret'], tempo: [60, 120] });
  D('pkskip', TQ, 'Open-string skipping', 'Beginner', ['picking'], 'Open strings only: skip one, come back one. The fretting hand rests so the picking hand gets all your attention.', 'Rest the heel of the hand lightly near the bridge so it always knows where the strings are.',
    () => run(updown([6, 4, 5, 3, 4, 2, 3, 1].map((s) => N(s, 0))), 0.5), { tempo: [60, 120] });
  const strumBar = (name, slots, d, o) => slots.map((x, k) => (x === '-' ? R(d) : S(x === 'U' || x === 'u' ? top(oc(name), 4) : oc(name), d, Object.assign({ up: x === 'U' || x === 'u', vel: x === 'D' ? 0.9 : x === 'U' ? 0.55 : 0.4, name }, o || {}))));
  const chordVar = { vars: OC, tempo: [60, 100] };
  D('stdown', TQ, 'Four down-strums', 'Beginner', ['strum', 'openchords'], 'One chord, four even downstrokes to the bar. Choose the chord from the list.', 'Strum from the root string of the chord, not always from string 6.',
    (c) => strumBar(OC[c.v], ['D', 'D', 'D', 'D'], 1), chordVar);
  D('stdu', TQ, 'Down-up eighths', 'Beginner', ['strum'], 'Down on every beat, up on every “and”. The upstroke is lighter and catches only the top strings.', 'Down, up, down, up, like walking. The hand never stops, so it never has to restart.',
    (c) => strumBar(OC[c.v], ['D', 'U', 'D', 'U', 'D', 'U', 'D', 'U'], 0.5), chordVar);
  D('stmiss', TQ, 'Missing strokes', 'Beginner', ['strum'], 'The hand keeps its down-up swing but misses the strings on two of the eight strokes. That gives the most used strum pattern in popular music.', 'Count “1, 2 and, and 4 and”. Your hand still moves on the silent strokes; it just passes clear of the strings.',
    (c) => strumBar(OC[c.v], ['D', '-', 'D', 'U', '-', 'U', 'D', 'U'], 0.5), chordVar);
  D('stback', TQ, 'The backbeat', 'Beginner', ['strum', 'tone'], 'Four downstrokes with beats 2 and 4 played harder. This is where a drummer’s snare falls.', 'Soft, loud, soft, loud. Make the difference bigger than feels natural.',
    (c) => [0.45, 1, 0.45, 1].map((v) => S(oc(OC[c.v]), 1, { vel: v, name: OC[c.v] })), chordVar);
  D('st16', TQ, 'Sixteenth-note strumming', 'Intermediate', ['strum'], 'The hand now swings four times to the beat, and the pattern is made by leaving strokes out. Count “1 e and a”.', 'Keep the wrist loose and the motion small. Speed comes from a smaller swing, not a faster arm.',
    () => strumBar('A7', ['D', '-', 'D', 'U', '-', 'U', 'D', '-', 'D', 'U', '-', 'U', 'D', '-', 'D', 'U'], 0.25), { tempo: [50, 90] });
  const bassStrum = (name, alt) => { const [f, r, a] = OPEN[name]; return [E(Object.assign(at(f, r), { role: 'root' }), 1, { name }), S(top(f, 3), 1, { name }), E(at(f, alt ? a : r) || at(f, r), 1, { name }), S(top(f, 3), 1, { name })]; };
  D('stbass', TQ, 'Bass note, then strum', 'Beginner', ['strum', 'fingerstyle', 'slash'], 'Pick the root of the chord alone on beats 1 and 3, and strum the top three strings on beats 2 and 4.', 'Boom, chick, boom, chick. Aim the pick at one string for the bass note, then let it fall through the top three.',
    (c) => bassStrum(OC[c.v]), chordVar);
  D('staltbass', TQ, 'Alternating bass and strum', 'Intermediate', ['strum', 'fingerstyle', 'slash'], 'As before, but the bass moves: the root on beat 1 and another note of the chord on beat 3.', 'The bass notes are part of the chord you are already holding. Only the picking hand has to change.',
    (c) => bassStrum(OC[c.v], true), chordVar);
  D('stswing', TQ, 'Straight against swung', 'Intermediate', ['strum', 'rhythm', 'swing', 'blues'], 'The same down-up strum played two ways. Straight: the eighth notes are even. Swung: the first of each pair is long and the second short.', 'Switch between the two with the list. Tap your foot the same way for both; only the upstroke moves.',
    (c) => ({ ev: strumBar('A7', ['D', 'U', 'D', 'U', 'D', 'U', 'D', 'U'], 0.5), swing: c.v === 1 }), { vars: ['Straight', 'Swung'], tempo: [60, 110] });
  const boogie = (rs, base) => [0, 0, 2, 2, 0, 0, 2, 2].map((x) => E([N(rs, base, null, 'root'), N(rs - 1, base + 2 + x)], 0.5));
  D('stshuffle', TQ, 'The shuffle', 'Beginner', ['blues', 'strum', 'muting'], 'Two strings at a time in swung eighths: the root with its fifth, then the root with its sixth. Choose the chord from the list.', 'Reach for the sixth with finger 3 and keep finger 1 down throughout. Rest the palm lightly on the strings at the bridge.',
    (c) => ({ ev: boogie([5, 6, 4][c.v], 0), swing: true }), { vars: ['A (strings 5 and 4)', 'E (strings 6 and 5)', 'D (strings 4 and 3)'], tempo: [60, 110] });
  D('mustop', TQ, 'Strum and stop', 'Beginner', ['muting'], 'A chord on each beat, cut short. After every strum, relax the fretting fingers without lifting them off the strings.', 'The silence is made by the fretting hand letting go, not by the picking hand.',
    (c) => [0, 1, 2, 3].flatMap(() => [S(oc(OC[c.v]), 0.5, { name: OC[c.v] }), R(0.5)]), chordVar);
  D('mupalm', TQ, 'Palm-muted eighths', 'Beginner', ['muting', 'barre'], 'A power chord in steady eighth-note downstrokes with the edge of the picking hand resting on the strings at the bridge.', 'Too far forward and the notes die; too far back and nothing is muted. Find the spot where they thud but still have pitch.',
    (c) => Array(8).fill(0).map((_, k) => S([c.fret, c.fret + 2, c.fret + 2, null, null, null], 0.5, { vel: k % 2 ? 0.5 : 0.75, name: nn(0, c.fret) + '5' })), { opts: ['fret'], tempo: [70, 130] });
  D('fsthumb', TQ, 'Thumb alone', 'Beginner', ['fingerstyle', 'bossa'], 'The thumb plays the root and one other bass note of the chord, one to a beat. Nothing else.', 'Do not add the fingers until the thumb keeps time without your attention.',
    (c) => { const [f, r, a] = OPEN[OC[c.v]]; return [r, a, r, a].map((s) => E(Object.assign(at(f, s), { label: 'p' }), 1)); }, chordVar);
  const pat = (name, strings, d) => { const [f, r] = OPEN[name], L = { 3: 'i', 2: 'm', 1: 'a' }; return strings.map((x) => E([].concat(x).map((s) => Object.assign(at(f, s === 'p' ? r : s), { label: s === 'p' ? 'p' : L[s], role: s === 'p' ? 'root' : 'ext' })), d)); };
  D('fspima', TQ, 'p-i-m-a', 'Beginner', ['fingerstyle', 'openchords'], 'Thumb on the root, then index, middle and ring on strings 3, 2 and 1, in eighth notes.', 'Plant all four fingers on their strings before you start, and let every note ring.',
    (c) => pat(OC[c.v], ['p', 3, 2, 1, 'p', 3, 2, 1], 0.5), chordVar);
  D('fsroll', TQ, 'Up and back: p-i-m-a-m-i', 'Beginner', ['fingerstyle'], 'The broken chord climbs to string 1 and comes back. Eight eighth notes fill the bar.', 'Keep the volume of all the fingers equal. The ring finger is usually the quiet one.',
    (c) => pat(OC[c.v], ['p', 3, 2, 1, 2, 3, 2, 3], 0.5), chordVar);
  D('fspinch', TQ, 'The pinch', 'Beginner', ['fingerstyle'], 'Thumb and ring finger pluck together on the beat, a bass note and string 1 at once. Index and middle fill in between.', 'Thumb moves down, finger moves up, like closing a hand. They must sound as one.',
    (c) => pat(OC[c.v], [['p', 1], 3, 2, 3, ['p', 1], 3, 2, 3], 0.5), chordVar);
  D('fsalt', TQ, 'Alternating thumb', 'Intermediate', ['fingerstyle'], 'The thumb plays two bass strings in turn on every beat while the index and middle fingers play between the beats.', 'The thumb is the rhythm section. Get it steady first, then drop the fingers in around it.',
    (c) => { const [f, r, a] = OPEN[OC[c.v]]; const p = (s) => Object.assign(at(f, s), { label: 'p', role: 'root' }); return [E(p(r)), E(Object.assign(at(f, 3), { label: 'i' })), E(p(a)), E(Object.assign(at(f, 2), { label: 'm' })), E(p(r)), E(Object.assign(at(f, 3), { label: 'i' })), E(p(a)), E(Object.assign(at(f, 2), { label: 'm' }))]; }, chordVar);
  const slur = (c, a, b) => [E(N(c.string, c.fret + a, a + 1)), E(N(c.string, c.fret + b, b + 1), 0.5, { vel: 0.6 }), R(1)];
  D('slhammer', TQ, 'Hammer-on pairs', 'Beginner', ['slurs'], 'Pick the first note and hammer the second with no second pick stroke: finger 1 to 2, 1 to 3, then 1 to 4.', 'Hammer with the fingertip from a short height, fast, not hard. The second note should be nearly as loud as the first.',
    (c) => [[0, 1], [0, 2], [0, 3]].flatMap(([a, b]) => slur(c, a, b).concat(slur(c, a, b))), { opts: ['fret', 'string'], tempo: [60, 100] });
  D('slpull', TQ, 'Pull-off pairs', 'Beginner', ['slurs'], 'Both fingers down. Pick the higher note, then pull that finger off sideways so it plucks the lower one.', 'A pull-off is a small pluck with the fretting finger, down toward the floor.',
    (c) => [[1, 0], [2, 0], [3, 0]].flatMap(([a, b]) => slur(c, a, b).concat(slur(c, a, b))), { opts: ['fret', 'string'], tempo: [60, 100] });
  D('sltrill', TQ, 'Hammer and pull in triplets', 'Intermediate', ['slurs', 'rhythm'], 'Three notes to the beat with one pick stroke: pick, hammer on, pull off.', 'Only the first note of each beat is picked. Keep the three notes even.',
    (c) => [2, 2, 3, 3].flatMap((x) => [E(N(c.string, c.fret, 1), 1 / 3), E(N(c.string, c.fret + x, x + 1), 1 / 3, { vel: 0.6 }), E(N(c.string, c.fret, 1), 1 / 3, { vel: 0.55 })]), { opts: ['fret', 'string'], tempo: [50, 90] });
  D('slslide', TQ, 'Slides along a string', 'Beginner', ['slurs', 'fivepent'], 'One finger, one string. Play a note, keep the pressure on and slide up two frets, then two more, then back.', 'Keep pressing as you move and look at the fret you are going to, not the one you are leaving.',
    (c) => run([0, 2, 4, 2].map((x) => N(c.string, c.fret + x, 1)), 1), { opts: ['fret', 'string'], tempo: [60, 90] });
  D('slbend', TQ, 'Bend to pitch', 'Intermediate', ['slurs', 'phrasing'], 'The app plays the target note, then the note you bend from. On your guitar, bend the second until it matches the first. Three bends from A minor pentatonic.', 'Bend with finger 3, with fingers 1 and 2 behind it on the same string. Sing the target first.',
    (c) => { const [s, f] = [[3, 7], [2, 8], [1, 8]][c.v]; return [E(N(s, f + 2, null, 'root'), 2), E(N(s, f, 3), 2)]; }, { vars: ['String 3, fret 7, up to E', 'String 2, fret 8, up to A', 'String 1, fret 8, up to D'], tempo: [60, 60] });
  D('tndyn', TQ, 'Louder, then softer', 'Beginner', ['tone', 'scalesmusic'], 'One octave of the major scale, growing louder on the way up and fading on the way down.', 'Volume comes from how far the pick or finger pushes the string, not from tension in the hand.',
    (c) => { const a = updown(octave(c.key, 'major')); return a.map((n, k) => E(n, 0.5, { vel: 0.35 + 0.65 * (1 - Math.abs(k - 7) / 7) })); }, { opts: ['key'], tempo: [60, 100] });
  D('tnaccent', TQ, 'Moving accents', 'Intermediate', ['tone', 'scalesmusic', 'picking'], 'A scale position in even eighth notes with an accent on every third note, or every fourth. The accents make a rhythm of their own.', 'Play the unaccented notes genuinely soft. An accent is a contrast, not just a louder note.',
    (c) => { const a = updown(posOf(c.key, 'major', '1')), k = c.v ? 4 : 3; return a.slice(0, a.length - (a.length % k)).map((n, i) => E(n, 0.5, { vel: i % k ? 0.45 : 1 })); }, { opts: ['key'], vars: ['Every third note', 'Every fourth note'], tempo: [60, 100] });

  // ======================= Foundations =======================
  D('fbchrom', FD, 'Chromatic scale on one string', 'Beginner', ['alphabet', 'fretboard'], 'Every fret from the open string to fret 12 and back. Say sharps on the way up and flats on the way down.', 'B to C and E to F have no note between them. Everywhere else, a sharp or flat sits in the gap.',
    (c) => run(updown(Array(13).fill(0).map((_, f) => N(c.string, f))), 1), { opts: ['string'], tempo: [60, 100] });
  D('fboct', FD, 'One note, every octave', 'Beginner', ['fretboard', 'intervals'], 'The key note everywhere it lives below fret 15, from the lowest to the highest. Choose the note with the key buttons.', 'From strings 6 and 5 the octave is two strings up and two frets up. From strings 4 and 3 it is two strings up and three frets up.',
    (c) => { const out = []; for (let s = 0; s < 6; s++) for (let f = 0; f <= 15; f++) if (mod(TUN[s] + f) === pcOf(c.key)) out.push({ s, f, label: c.key, role: 'root', p: TUN[s] + f }); return run(out.sort((a, b) => a.p - b.p || a.s - b.s), 2); }, { opts: ['key'], tempo: [60, 90] });
  D('fbroots', FD, 'Roots on strings 6 and 5', 'Beginner', ['fretboard', 'barre', 'caged'], 'The natural notes along string 6, then along string 5, up to fret 12. These two strings name every barre chord and power chord.', 'Learn frets 3, 5, 7, 8 and 10 on both strings first: G A B C D on string 6, C D E F G on string 5.',
    () => run(naturals(6, 12).concat(naturals(5, 12)), 1), { tempo: [60, 100] });
  const IVS = ['m2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'];
  D('ivladder', FD, 'Every interval from one root', 'Intermediate', ['intervals', 'ear'], 'The root, then a note one fret further away each time, from a minor 2nd to the octave. Sing each interval after you hear it.', 'Learn each as a shape from the root: next string same fret is a 4th, next string two frets up is a 5th, two strings up two frets up is an octave.',
    (c) => { const [rs, rf] = lowRoot(c.key), s0 = 6 - rs, base = TUN[s0] + rf; return IVS.flatMap((nm, k) => { const p = base + k + 1; let t = s0; while (t < 5 && p - TUN[t] > rf + 4) t++; return [E({ s: s0, f: rf, label: c.key, role: 'root' }, 1), E({ s: t, f: p - TUN[t], label: nm, role: 'ext' }, 1)]; }); }, { opts: ['key'], tempo: [60, 80] });
  D('msstring', FD, 'Major scale along one string', 'Beginner', ['majorscale', 'scalepos'], 'The notes of the key along a single string, numbered by degree. Two frets is a whole step, one fret a half step.', 'The half steps fall between 3 and 4 and between 7 and 1. Find them and the rest are whole steps.',
    (c) => { const sc = T.scale(c.key, 'major'), s = 6 - c.string, out = []; for (let f = 0; f <= 12; f++) { const t = sc.tones.find((x) => x.pc === mod(TUN[s] + f)); if (t) out.push({ s, f, label: t.deg, role: t.role }); } return run(updown(out), 1); }, { opts: ['key', 'string'], tempo: [60, 100] });
  // a scale in two voices: lower voice along one string, upper voice a fixed number of scale steps above on another
  const harm = (key, lowS, upS, steps) => {
    const sc = T.scale(key, 'major'), pcs = sc.tones.map((t) => t.pc), s = 6 - lowS, u = 6 - upS, low = [];
    for (let f = 1; f <= 16 && low.length < 8; f++) { const i = pcs.indexOf(mod(TUN[s] + f)); if (i >= 0) low.push({ f, i }); }
    return low.map(({ f, i }) => { const p = TUN[s] + f; let q = p; for (let k = 0, j = i; k < steps; k++) { const nx = (j + 1) % 7; q += mod(pcs[nx] - pcs[j]) || 12; j = nx; } return E([{ s, f, label: sc.tones[i].deg, role: sc.tones[i].role }, { s: u, f: q - TUN[u], label: sc.tones[(i + steps) % 7].deg, role: sc.tones[(i + steps) % 7].role }], 1); }).filter((e) => e.n[1].f >= 0 && e.n[1].f <= 17);
  };
  D('ms3rds', FD, 'The scale in thirds', 'Intermediate', ['intervals', 'majorscale', 'scalesmusic'], 'Two notes at once, a third apart, up the scale on strings 3 and 2. Some thirds are major and some minor; the key decides which.', 'On this pair of strings a major third is both notes at one fret and a minor third is a diagonal.',
    (c) => updown(harm(c.key, 3, 2, 2)), { opts: ['key'], tempo: [60, 90] });
  D('ms6ths', FD, 'The scale in sixths', 'Intermediate', ['intervals', 'majorscale'], 'A sixth apart on strings 3 and 1, skipping the string between. Sixths are thirds turned upside down, and sound sweeter and wider.', 'Pluck with thumb and middle finger, or pick and middle finger. Let the unused string 2 stay silent.',
    (c) => updown(harm(c.key, 3, 1, 5)), { opts: ['key'], tempo: [60, 90] });
  D('ms10ths', FD, 'The scale in tenths', 'Intermediate', ['intervals', 'fingerstyle'], 'A third with an octave added, on strings 5 and 2. The wide gap gives a full, piano-like sound from two notes.', 'Thumb on the low note, a finger on the high one, plucked together.',
    (c) => updown(harm(c.key, 5, 2, 9)), { opts: ['key'], tempo: [60, 90] });
  D('msoct', FD, 'The scale in octaves', 'Intermediate', ['intervals', 'fretboard'], 'The same scale note in two octaves at once, on strings 5 and 3. The shape never changes: two strings up, two frets up.', 'Mute the string between with the underside of your first finger.',
    (c) => updown(harm(c.key, 5, 3, 7)), { opts: ['key'], tempo: [60, 90] });
  const g3 = (d) => N(3, 0, 'G');
  D('rhladder', FD, 'The rhythm ladder', 'Beginner', ['rhythm', 'firstnotes'], 'One note, one bar at each length: a whole note, two halves, four quarters, eight eighths, twelve triplets, sixteen sixteenths. The beat never moves.', 'Count aloud: “1 2 3 4”, “1 and”, “1 and a”, “1 e and a”. Your foot taps the same four beats all the way through.',
    () => [[4, 1], [2, 2], [1, 4], [0.5, 8], [1 / 3, 12], [0.25, 16]].flatMap(([d, n]) => Array(n).fill(0).map((_, k) => E(g3(), d, { vel: (k * d) % 1 < 1e-6 ? 0.9 : 0.55 }))), { tempo: [60, 90] });
  D('rhrests', FD, 'Notes and rests', 'Beginner', ['rhythm'], 'Four bars of quarter notes with rests in different places. Count every beat aloud, sounding or silent.', 'A rest is played: stop the string with either hand so the silence is clean.',
    () => ['x-x-', 'xx-x', '-x-x', 'x--x'].flatMap((b) => [...b].map((ch) => (ch === 'x' ? E(g3(), 1) : R(1)))), { tempo: [60, 100] });
  D('rhdot', FD, 'Dotted quarters and ties', 'Intermediate', ['rhythm'], 'A dotted quarter lasts a beat and a half, so the next note falls on an “and”. The second bar ties a note across the middle of the bar.', 'Count “1 (2) and 3 (4) and”. Say the bracketed beats silently while the note rings through them.',
    () => [1.5, 0.5, 1.5, 0.5, 1, 0.5, 1, 0.5, 1].map((d) => E(g3(), d)), { tempo: [60, 100] });
  D('rhsync', FD, 'Offbeats', 'Intermediate', ['rhythm', 'swing'], 'First a bar with every note on the “and”. Then a bar that starts on the beat and slips onto the offbeats.', 'Tap your foot on the beat and play between the taps. If the foot follows the notes, slow down.',
    () => [0, 1, 2, 3].flatMap(() => [R(0.5), E(g3(), 0.5)]).concat([0.5, 1, 1, 1, 0.5].map((d) => E(g3(), d))), { tempo: [60, 100] });
  D('rhtrip', FD, 'Eighths against triplets', 'Intermediate', ['rhythm', 'blues'], 'A bar of two notes to the beat, then a bar of three. Feel the beat divide a different way without speeding up.', 'Say “1 and 2 and”, then “1 and a 2 and a”. The numbers land in the same place in both bars.',
    () => Array(8).fill(0).map((_, k) => E(g3(), 0.5, { vel: k % 2 ? 0.55 : 0.9 })).concat(Array(12).fill(0).map((_, k) => E(g3(), 1 / 3, { vel: k % 3 ? 0.55 : 0.9 }))), { tempo: [60, 100] });

  // ======================= Chords =======================
  const CV = ['G', 'C', 'D', 'Em', 'Am', 'E', 'A', 'Dm', 'F', 'A7', 'E7', 'D7', 'G7', 'C7', 'B7'];
  D('chcheck', CH, 'Test every string', 'Beginner', ['openchords', 'colour', 'blues'], 'Hold the chord and hear each string on its own, low to high, then the whole chord strummed. Choose the chord from the list.', 'A dull thud means a finger is touching that string. A buzz means a finger is too far from its fret.',
    (c) => { const f = fr(oc(CV[c.v])); return f.map((x, s) => (x === null ? null : E(N(6 - s, x), 1))).filter(Boolean).concat([S(f, 2, { name: CV[c.v] }), S(f, 2, { name: CV[c.v] })]); }, { vars: CV, tempo: [60, 80] });
  D('chgrow', CH, 'Growing a chord', 'Beginner', ['openchords'], 'The chord on its top two strings, then three, then four, then all of them. Add fingers as you need them.', 'Small chords are real chords. If the full shape will not come yet, play the top three strings and keep time.',
    (c) => [2, 3, 4, 6].flatMap((n) => [S(top(oc(OC[c.v]), n), 1, { name: OC[c.v] }), S(top(oc(OC[c.v]), n), 1, { name: OC[c.v] })]), chordVar);
  const pairVars = PAIRS.map((p) => p.join(' and '));
  D('chpairs', CH, 'Two-chord changes', 'Beginner', ['changes', 'openchords'], 'One bar of each chord, four strums, round and round. Fourteen pairs to choose from. Count how many clean changes you make in a minute and beat it tomorrow.', 'Move all the fingers together and aim to land on beat one. An open-string strum on the last upstroke is allowed.',
    (c) => PAIRS[c.v].flatMap((nm) => [1, 0.6, 0.6, 0.6].map((v) => S(oc(nm), 1, { vel: v, name: nm }))), { vars: pairVars, tempo: [60, 110] });
  D('chsilent', CH, 'One strum a bar', 'Beginner', ['changes'], 'Strum once on beat one and use the other three beats to get to the next chord. The same fourteen pairs.', 'Form the new shape in the air and place it whole. When this is easy, switch to Two-chord changes.',
    (c) => PAIRS[c.v].flatMap((nm) => [S(oc(nm), 1, { name: nm }), R(3)]), { vars: pairVars, tempo: [60, 100] });
  D('chanchor', CH, 'Anchor fingers', 'Beginner', ['changes', 'colour'], 'G, Cadd9, Dsus4 and back through Cadd9. Fingers 3 and 4 stay on strings 2 and 1 at fret 3 for the whole loop.', 'Fingers that two chords share never lift. Look for them in every change you learn.',
    () => [['G', '320033'], ['Cadd9', 'x32033'], ['Dsus4', 'xx0233'], ['Cadd9', 'x32033']].flatMap(([nm, f]) => [1, 0.6, 0.6, 0.6].map((v) => S(f, 1, { vel: v, name: nm }))), { tempo: [60, 110] });
  D('chsus', CH, 'Decorating one chord', 'Beginner', ['colour'], 'The chord, its sus4, the chord, its sus2, two beats each. One finger does all the work.', 'The sus4 leans down onto the 3rd and the sus2 rises up to it. Hearing that pull is the point.',
    (c) => [[['D', 'xx0232'], ['Dsus4', 'xx0233'], ['D', 'xx0232'], ['Dsus2', 'xx0230']], [['A', 'x02220'], ['Asus4', 'x02230'], ['A', 'x02220'], ['Asus2', 'x02200']], [['E', '022100'], ['Esus4', '022200'], ['E', '022100'], ['Esus4', '022200']]][c.v].flatMap(([nm, f]) => [S(f, 1, { name: nm }), S(f, 1, { vel: 0.6, name: nm })]), { vars: ['D', 'A', 'E'], tempo: [60, 100] });
  D('chwalk', CH, 'A walking bass under chords', 'Intermediate', ['slash', 'strum'], 'The bass note alone on beat one, then three strums. The bass notes step down a scale while the chords change above them.', 'Listen to the lowest note of each bar. The line it makes is what holds the sequence together.',
    (c) => [[['C', 'x32010', 5], ['G/B', 'x20003', 5], ['Am', 'x02210', 5], ['Am', 'x02210', 5]], [['G', '320003', 6], ['D/F♯', '2x0232', 6], ['Em', '022000', 6], ['Em', '022000', 6]]][c.v].flatMap(([nm, f, b]) => [E(Object.assign(at(f, b), { role: 'root' }), 1, { name: nm })].concat([0, 1, 2].map(() => S(top(f, 4), 1, { vel: 0.6, name: nm })))), { vars: ['C, G/B, A minor', 'G, D/F♯, E minor'], tempo: [60, 100] });
  D('charp', CH, 'Picking orders on a held chord', 'Intermediate', ['openchords', 'fingerstyle', 'triads'], 'Hold each chord and play its notes one at a time in a set order. Six orders to choose from, over C, A minor, F major 7 and G.', 'Each order trains a different finger to lead. The awkward ones are the ones worth the time.',
    (c) => { const o = [[0, 1, 2, 3], [0, 3, 2, 1], [0, 2, 1, 3], [0, 1, 3, 2], [0, 3, 1, 2], [0, 2, 3, 1]][c.v]; return [['C', 'x32010', 5], ['Am', 'x02210', 5], ['Fmaj7', 'xx3210', 4], ['G', '320003', 6]].flatMap(([nm, f, r]) => { const st = [r, 3, 2, 1]; return o.concat(o).map((k) => E(Object.assign(at(f, st[k]), { role: k ? 'ext' : 'root' }), 0.5, { name: nm })); }); },
    { vars: ['p i m a', 'p a m i', 'p m i a', 'p i a m', 'p a i m', 'p m a i'], tempo: [60, 110] });
  const p5 = (string, f) => { const a = [null, null, null, null, null, null], s = 6 - string; a[s] = f; a[s + 1] = f + 2; a[s + 2] = f + 2; return a; };
  D('chpower', CH, 'Power chords: I, IV and V', 'Beginner', ['barre', 'families', 'muting'], 'A power chord on the key note on string 6, then the IV on string 5 at the same fret and the V two frets higher. Eight downstrokes to the bar.', 'Keep the hand in its shape and move it as one piece. Only the first finger needs to find its fret.',
    (c) => { const f = rootFret6(c.key) || 12, d = dia(c.key); return [[6, f, d[0].root], [6, f, d[0].root], [5, f, d[3].root], [5, f + 2, d[4].root]].flatMap(([s, x, nm]) => Array(8).fill(0).map((_, k) => S(p5(s, x), 0.5, { vel: k ? 0.6 : 0.9, name: nm + '5' }))); }, { opts: ['key'], tempo: [70, 130] });
  D('chbarre', CH, 'Six clean notes from a barre', 'Beginner', ['barre'], 'Lay the first finger across all six strings at one fret and play them one at a time. No other fingers.', 'Roll the finger slightly onto its bony edge and keep it close behind the fret. Start at fret 5, where it is easiest.',
    (c) => run(updown([6, 5, 4, 3, 2, 1].map((s) => N(s, c.fret, 1))), 1), { opts: ['fret'], tempo: [60, 90] });
  const BAR = [(f) => [f, f + 2, f + 2, f + 1, f, f], (f) => [f, f + 2, f + 2, f, f, f], (f) => [null, f, f + 2, f + 2, f + 2, f], (f) => [null, f, f + 2, f + 2, f + 1, f], (f) => [f, f + 2, f, f + 1, f, f], (f) => [f, f + 2, f, f, f, f]];
  const barName = (k, f) => nn(k === 2 || k === 3 ? 1 : 0, f) + ['', 'm', '', 'm', '7', 'm7'][k];
  D('chbarremove', CH, 'One barre shape, moved', 'Intermediate', ['barre', 'caged'], 'A single barre shape played at four places on the neck, a bar each. The shape never changes; only the fret, and so the name.', 'Release the pressure, slide, and squeeze again. Do not lift the fingers off the strings as you move.',
    (c) => [0, 2, 4, 2].flatMap((x) => [1, 0.6, 0.6, 0.6].map((v) => S(BAR[c.v](Math.min(c.fret, 9) + x), 1, { vel: v, name: barName(c.v, Math.min(c.fret, 9) + x) }))), { opts: ['fret'], vars: ['E form, major', 'E form, minor', 'A form, major', 'A form, minor'], tempo: [60, 100] });
  D('chbarrefam', CH, 'Four chords from one barre', 'Intermediate', ['barre', 'sevenths'], 'The E-form barre as a major chord, a seventh, a minor and a minor seventh. Each is made by lifting one finger from the last.', 'Know what each finger adds: the little finger holds the upper root, the middle finger holds the major 3rd.',
    (c) => [0, 4, 1, 5].flatMap((k) => [S(BAR[k](c.fret), 2, { name: barName(k, c.fret) }), S(BAR[k](c.fret), 2, { vel: 0.6, name: barName(k, c.fret) })]), { opts: ['fret'], tempo: [60, 90] });
  D('blshuffle', CH, 'Twelve-bar shuffle', 'Intermediate', ['blues', 'strum'], 'The whole twelve-bar blues played as a two-string shuffle. In A all three chords have an open root.', 'Say the bar numbers as you play. Bars 5, 9 and 10 are where the chord moves; know them before you start.',
    (c) => { const I = [5, 0], IV = [4, 0], V = [6, 0], I2 = [6, 0], IV2 = [5, 0], V2 = [5, 2], k = c.v ? [I2, IV2, V2] : [I, IV, V]; return { ev: [0, 0, 0, 0, 1, 1, 0, 0, 2, 1, 0, 2].flatMap((x) => boogie(k[x][0], k[x][1])), swing: true }; }, { vars: ['In A', 'In E'], tempo: [60, 110] });
  const triads = (key, q, set) => T.chord(key, q).voicings.filter((v) => v.kind === 'triad' && v.frets[set] !== null && v.frets[set + 2] !== null).sort((a, b) => a.hi - b.hi);
  D('trinv', CH, 'Triad inversions up the neck', 'Intermediate', ['triads', 'triadscale'], 'The same three notes in their three orders, climbing one set of strings. Each shape has a different note at the bottom.', 'Find the root in each shape and say where it is: bottom, middle or top.',
    (c) => { const v = triads(c.key, c.v > 1 ? 'm' : 'maj', c.v % 2 ? 2 : 3); return updown(v.map((x, g) => S(x.frets, 2, { g, name: c.key + (c.v > 1 ? 'm' : '') }))); }, { opts: ['key'], vars: ['Major, strings 3-2-1', 'Major, strings 4-3-2', 'Minor, strings 3-2-1', 'Minor, strings 4-3-2'], tempo: [60, 90] });
  const cycle = (key, dir) => Array(12).fill(0).map((_, k) => T.KEYS[mod(pcOf(key) + k * (dir || 5))]);
  D('trcycle', CH, 'Triads round the cycle', 'Advanced', ['triads', 'circle', 'triadscale'], 'A major triad on each of the twelve roots, moving up a fourth each time and always taking the nearest shape on the top three strings.', 'You never have to jump: one of the three shapes of the next chord is always within a fret or two.',
    (c) => { let near = 5; return cycle(c.key).map((r) => { const v = triads(r, 'maj', 3).sort((a, b) => Math.abs(mid(a) - near) - Math.abs(mid(b) - near))[0]; near = mid(v); return S(v.frets, 2, { name: r }); }); }, { opts: ['key'], tempo: [60, 90] });
  D('cgfive', CH, 'Five shapes of one chord', 'Intermediate', ['caged', 'barre'], 'The chord in each of its CAGED shapes in turn, from the lowest on the neck to the highest.', 'Each shape begins where the last one ended. Name the form as you land on it.',
    (c) => { const ch = T.chord(c.key, c.v ? 'm' : 'maj'), v = ch.voicings.filter((x) => x.kind === 'caged').sort((a, b) => mid(a) - mid(b)); return v.map((x) => S(x.frets, 2, { name: ch.name + (x.form ? ', ' + x.form + ' shape' : '') })); }, { opts: ['key'], vars: ['Major', 'Minor'], tempo: [60, 80] });
  D('dia7', CH, 'The key in seventh chords', 'Intermediate', ['diatonic', 'sevenths', 'drop2'], 'A seventh chord on each note of the scale, climbing the neck: major 7, minor 7, minor 7, major 7, dominant 7, minor 7, half-diminished.', 'There is one dominant seventh in a key and it is always the V. Listen for it.',
    (c) => { let near = 2; const d = dia(c.key); return d.concat(d[0]).map((x, k) => { const v = voice(x.root, x.sev, c.v ? 'drop2' : 'shell', near + (k ? 1.6 : 0)); near = mid(v); return SV(v, 2, { g: k }); }); }, { opts: ['key'], vars: ['Shells', 'Drop 2'], tempo: [60, 80] });
  D('svchange', CH, 'One note at a time', 'Intermediate', ['sevenths', 'extensions'], 'One root, four chords: major 7, dominant 7, minor 7, half-diminished. Each differs from the last by a single note lowered a fret.', 'Say which note moved: the 7th, then the 3rd, then the 5th.',
    (c) => { let near = 5; return ['maj7', '7', 'm7', 'm7b5'].map((q, k) => { const v = voice(c.key, q, 'drop2', near); if (!k) near = mid(v); return SV(v, 2); }).flatMap((e) => [e, Object.assign({}, e, { vel: 0.6 })]); }, { opts: ['key'], tempo: [60, 80] });

  // ======================= Scales & keys =======================
  const OPENSC = { C: '5:3 4:0 4:2 4:3 3:0 3:2 2:0 2:1', G: '6:3 5:0 5:2 5:3 4:0 4:2 4:4 3:0', D: '4:0 4:2 4:4 3:0 3:2 2:0 2:2 2:3', A: '5:0 5:2 5:4 4:0 4:2 4:4 3:1 3:2', E: '6:0 6:2 6:4 5:0 5:2 5:4 4:1 4:2', F: '4:3 3:0 3:2 3:3 2:1 2:3 1:0 1:1' };
  const spec = (root, str) => str.split(' ').map((t) => { const [s, f] = t.split(':').map(Number); return N(s, f, T.spell(root, T.DEG[mod(TUN[6 - s] + f - pcOf(root))]), mod(TUN[6 - s] + f - pcOf(root)) ? 'ext' : 'root'); });
  D('scopen', SC, 'Open-position scales', 'Beginner', ['openscales', 'keysig', 'majorscale'], 'One octave of a major scale in open position, up and back, framed by its home chord. Six keys to choose from.', 'Say the sharps or flats of the key before you start, and listen for them as you play.',
    (c) => { const k = Object.keys(OPENSC)[c.v], f = k === 'F' ? 'xx3211' : oc(k); return [S(f, 2, { name: k })].concat(run(updown(spec(k, OPENSC[k])), 0.5), [R(0.5), S(f, 2, { name: k })]); }, { vars: ['C major', 'G major: F♯', 'D major: F♯ C♯', 'A major: F♯ C♯ G♯', 'E major: F♯ C♯ G♯ D♯', 'F major: B♭'], tempo: [60, 110] });
  D('scframe', SC, 'Chord, scale, chord', 'Beginner', ['scalesmusic', 'majorscale'], 'The home chord, one octave of the scale, and the home chord again. The chord tells your ear where home is before the scale begins.', 'End the scale on the root and hear the chord confirm it.',
    (c) => { const v = voice(c.key, 'maj', 'caged', 3); return [SV(v, 2)].concat(run(updown(octave(c.key, 'major')), 0.5), [R(0.5), SV(v, 2)]); }, { opts: ['key'], tempo: [60, 110] });
  D('sccycle', SC, 'One scale through the keys', 'Intermediate', ['circle', 'majorscale', 'keysig'], 'One octave of the major scale in every key, moving round the circle. Fourths add a flat each time; fifths add a sharp.', 'Say the name of the new key in the gap before it starts.',
    (c) => cycle(c.key, c.v ? 7 : 5).flatMap((k, g) => run(updown(lift(octave(k, 'major'))), 0.5, { g, name: k + ' major' }).concat([Object.assign(R(0.5), { g })])), { opts: ['key'], vars: ['In fourths', 'In fifths'], tempo: [60, 110] });
  D('scbox', SC, 'The five pentatonic boxes', 'Intermediate', ['fivepent', 'pentatonic'], 'One box of the minor pentatonic scale, up and back. Step through all five with the list.', 'In every box, find the roots first. They are the gold pegs.',
    (c) => run(updown(lift(boxes(c.key)[c.v])), 0.5), { opts: ['key'], vars: ['Box 1', 'Box 2', 'Box 3', 'Box 4', 'Box 5'], tempo: [60, 120] });
  D('scdiag', SC, 'A run through three boxes', 'Intermediate', ['fivepent', 'slurs'], 'Two octaves of the minor pentatonic that start in box 1 and slide up through boxes 2 and 3.', 'The two slides are on string 4 and string 2. Slide with the finger that is already there.',
    (c) => { const r = rootFret6(c.key), sc = T.scale(c.key, 'minpent'); return run(updown([[6, 0], [6, 3], [5, 0], [5, 2], [4, 0], [4, 2], [4, 5], [3, 2], [3, 4], [2, 3], [2, 5], [2, 8], [1, 5], [1, 7]].filter(([, x]) => r + x <= 17).map(([s, x]) => { const t = sc.tones.find((y) => y.pc === mod(TUN[6 - s] + r + x)); return N(s, r + x, t ? t.deg : '', t ? t.role : 'ext'); })), 0.5); }, { opts: ['key'], tempo: [60, 110] });
  D('scpent1', SC, 'Pentatonic along one string', 'Intermediate', ['fivepent', 'phrasing'], 'The five notes of the minor pentatonic along a single string, up to fret 15 and back.', 'Each pair of neighbouring notes is the seam between two boxes.',
    (c) => { const sc = T.scale(c.key, 'minpent'), s = 6 - c.string, out = []; for (let f = 0; f <= 15; f++) { const t = sc.tones.find((x) => x.pc === mod(TUN[s] + f)); if (t) out.push({ s, f, label: t.deg, role: t.role }); } return run(updown(out), 1); }, { opts: ['key', 'string'], tempo: [60, 100] });
  D('scblue', SC, 'The blues scale', 'Beginner', ['pentatonic', 'phrasing', 'blues'], 'Box 1 with the blue note added, up and back. The flat 5th is a note to pass through.', 'Never stop on the blue note. Lean on it and move on.',
    (c) => run(updown(lift(posOf(c.key, 'blues', '1'))), 0.5), { opts: ['key'], tempo: [60, 120] });
  const PH = [
    [[3, 2, 0.5], [3, 0, 0.5], [4, 2, 1], 2], [[4, 2, 0.5], [3, 0, 0.5], [3, 2, 0.5], [2, 0, 1.5], 1], [[2, 3, 0.5], [2, 0, 0.5], [3, 2, 0.5], [3, 0, 0.5], [4, 2, 2]], [[1, 0, 1], [2, 3, 0.5], [2, 0, 0.5], [3, 2, 1], 1],
    [[5, 2, 0.5], [4, 0, 0.5], [4, 2, 0.5], [3, 0, 0.5], [3, 2, 0.5], [2, 0, 0.5], [1, 0, 1]], [[1, 3, 1.5], [1, 0, 0.5], [2, 3, 0.5], [2, 0, 0.5], [3, 2, 1]], [[6, 0, 0.5], [6, 3, 0.5], [5, 0, 0.5], [5, 2, 0.5], [4, 0, 0.5], [4, 2, 1.5]], [[3, 2, 0.5], [2, 0, 0.5], [3, 2, 0.5], [2, 0, 0.5], [1, 0, 0.5], [2, 3, 0.5], [2, 0, 1]],
  ];
  D('scphrase', SC, 'Phrase bank', 'Intermediate', ['phrasing', 'pentatonic', 'blues'], 'A short phrase in box 1, then a bar of silence for your answer. Eight phrases to choose from. Play it back, then answer it with one of your own.', 'A phrase that ends away from the root asks a question. End your answer on a root.',
    (c) => { const r = rootFret6(c.key), sc = T.scale(c.key, 'minpent'); return PH[c.v].map((x) => { if (typeof x === 'number') return R(x); const t = sc.tones.find((y) => y.pc === mod(TUN[6 - x[0]] + r + x[1])); return E(N(x[0], r + x[1], t ? t.deg : '', t ? t.role : 'ext'), x[2]); }).concat([R(4)]); }, { opts: ['key'], vars: PH.map((_, k) => 'Phrase ' + (k + 1)), tempo: [60, 100] });
  D('scdouble', SC, 'Double stops in the box', 'Intermediate', ['phrasing', 'slurs'], 'Pairs of neighbouring strings at one fret, all inside box 1. One finger laid flat plays both notes.', 'Slide into each pair from a fret below for the classic sound.',
    (c) => { const r = rootFret6(c.key) || 12; return [[2, 1, 0], [3, 2, 0], [4, 3, 2], [2, 1, 3], [4, 3, 2], [3, 2, 0], [2, 1, 0]].map(([a, b, x]) => E([N(a, r + x), N(b, r + x)], 1)).concat([R(1)]); }, { opts: ['key'], tempo: [60, 100] });
  D('sctarget', SC, 'The 3rd of every chord', 'Intermediate', ['phrasing', 'blues', 'jazzlines'], 'A twelve-bar blues reduced to two notes a bar: the root of the chord, then its 3rd held for three beats.', 'The 3rd is the note that tells a listener the chord has changed. Find all three before you solo.',
    (c) => { const r = rootFret6(c.key) || 12, d = dia(c.key), ch = [[6, r, 3, r + 1, d[0].root], [5, r, 4, r - 1, d[3].root], [5, r + 2, 4, r + 1, d[4].root]]; return [0, 0, 0, 0, 1, 1, 0, 0, 2, 1, 0, 2].flatMap((k, g) => { const [rs, rf, ts, tf, nm] = ch[k]; return [E(N(rs, rf, nm, 'root'), 1, { name: nm + '7' }), E(N(ts, tf, '3', 'guide'), 3, { name: nm + '7' })]; }); }, { opts: ['key'], tempo: [60, 100] });
  D('sclink', SC, 'Up one position, down the next', 'Intermediate', ['scalepos', 'scalesmusic'], 'A three-note-per-string position of the major scale going up, and its upstairs neighbour coming down. Step along the neck with the list.', 'Shift on string 1 by sliding the first finger up to the next note of the scale.',
    (c) => { const sc = T.scale(c.key, 'major'), all = T.scalePositions(sc).map((p) => p.map((n) => ({ s: n.s, f: n.f, label: n.tone.deg, role: n.tone.role, pitch: n.pitch })).sort((a, b) => a.pitch - b.pitch)); const a = all[c.v], b = all[c.v + 1]; return run(a, 0.5, { g: 0 }).concat(run(b.slice().reverse(), 0.5, { g: 1 })); }, { opts: ['key'], vars: ['1st and 2nd', '2nd and 3rd', '3rd and 4th', '4th and 5th', '5th and 6th', '6th and 7th'], tempo: [60, 110] });
  D('scarps', SC, 'Every chord of the key as an arpeggio', 'Intermediate', ['arps', 'scalesmusic', 'diatonic'], 'One scale position, seven arpeggios. Each bar plays root, 3rd, 5th and octave of the next chord of the key and comes back down.', 'Say “major” or “minor” as each one starts. The hand never leaves the position.',
    (c) => { const p = lift(posOf(c.key, 'major', '1')), d = dia(c.key); return d.flatMap((x, i) => run([i, i + 2, i + 4, i + 7, i + 4, i + 2, i].map((k) => p[k]), 0.5, { name: x.roman + ' · ' + x.root + (x.tri === 'm' ? 'm' : x.tri === 'dim' ? '°' : '') }).concat([R(0.5)])); }, { opts: ['key'], tempo: [60, 110] });
  D('scarpscale', SC, 'Arpeggio up, scale down', 'Intermediate', ['arps', 'jazzlines', 'scalesmusic'], 'For each chord of the key: its seventh arpeggio going up, then the scale coming back down. The commonest outline in melody.', 'The arpeggio states the chord; the scale walks you to the next one.',
    (c) => { const p = lift(posOf(c.key, 'major', '1')), d = dia(c.key); return d.flatMap((x, i) => run([i, i + 2, i + 4, i + 6, i + 5, i + 4, i + 3, i + 2].map((k) => p[k]), 0.5, { name: x.roman + ' · ' + T.chord(x.root, x.sev).name })); }, { opts: ['key'], tempo: [60, 110] });
  D('scminor3', SC, 'Three minor scales side by side', 'Intermediate', ['minorscales', 'minorkeys'], 'Natural, harmonic and melodic minor from the same root, one octave each. Only the 6th and 7th change.', 'Natural has ♭6 and ♭7. Harmonic raises the 7th. Melodic raises the 6th as well.',
    (c) => ['minor', 'harm', 'mel'].flatMap((id, g) => run(updown(lift(octave(c.key, id))), 0.5, { g, name: c.key + ' ' + T.scale(c.key, id).def.name.toLowerCase() }).concat([Object.assign(R(0.5), { g })])), { opts: ['key'], tempo: [60, 100] });
  const MODES = ['lydian', 'major', 'mixo', 'dorian', 'minor', 'phrygian', 'locrian'];
  D('scmodes', SC, 'Modes from one root, bright to dark', 'Advanced', ['modes'], 'All seven modes on the same root, one octave each, from Lydian down to Locrian. Each lowers one more note than the last.', 'Name the note that changed as each new mode begins: ♯4 gone, then ♭7, ♭3, ♭6, ♭2, ♭5.',
    (c) => MODES.flatMap((id, g) => run(lift(octave(c.key, id)), 0.5, { g, name: c.key + ' ' + (id === 'major' ? 'Ionian (major)' : id === 'minor' ? 'Aeolian (natural minor)' : T.scale(c.key, id).def.name) })), { opts: ['key'], tempo: [60, 100] });
  const DRONE = ['dorian', 'mixo', 'lydian', 'phrygian', 'minor'];
  D('scdrone', SC, 'A mode over a drone', 'Advanced', ['modes'], 'The root sounds low on beat one of every bar while the mode climbs and falls above it. The drone is what makes your ear hear the mode.', 'Linger on the mode’s special note: the 6th in Dorian, the ♭7 in Mixolydian, the ♯4 in Lydian, the ♭2 in Phrygian.',
    (c) => { const a = updown(lift(octave(c.key, DRONE[c.v]))).concat([null]), low = a[0]; return a.map((n, k) => (n ? E(k % 8 === 0 && k ? [n, low] : n, 0.5) : R(0.5))); }, { opts: ['key'], vars: ['Dorian', 'Mixolydian', 'Lydian', 'Phrygian', 'Aeolian'], tempo: [60, 100] });
  D('scroots', SC, 'Roots round the circle', 'Intermediate', ['circle', 'iivi', 'fretboard'], 'The twelve key notes in circle order on strings 6 and 5. In fourths the roots zig-zag down the neck two frets at a time.', 'Say each name as you play it. This is the bass line of most jazz harmony.',
    (c) => { const a = [[6, 8], [5, 8], [6, 6], [5, 6], [6, 4], [5, 4], [6, 2], [5, 2], [6, 0], [5, 0], [5, 5], [6, 3]].map(([s, f]) => N(s, f, T.KEYS[mod(TUN[6 - s] + f)], 'root')); return run(c.v ? [a[0]].concat(a.slice(1).reverse()) : a, 2); }, { vars: ['Fourths: C F B♭ E♭…', 'Fifths: C G D A…'], tempo: [60, 100] });

  // ======================= Jazz =======================
  const jz = { opts: ['key'], tempo: [60, 120] };
  D('jzguide', JZ, 'Guide tones over the root', 'Intermediate', ['jazz', 'rootless', 'iivi'], 'ii, V and I. The root sounds alone on beat one; the 3rd and 7th follow together and hold. Watch one of them stay and the other fall a fret at each change.', 'Play only the two upper notes on your guitar and let the app be the bass player.',
    (c) => lead(twoFive(c.key), 'shell').flatMap((v) => [E(bassOf(v), 1, { name: v.name }), E(upperOf(v), 3, { name: v.name })]), jz);
  D('jzcycle', JZ, 'Dominants round the cycle', 'Advanced', ['rootless', 'circle', 'turnarounds'], 'Twelve dominant sevenths, each a fourth above the last: root, then guide tones. The two upper notes sink by a single fret from chord to chord.', 'The 3rd of each chord becomes the 7th of the next. That is why the shape hardly moves.',
    (c) => lead(cycle(c.key).map((r) => [r, '7']), 'shell', 8).flatMap((v) => [E(bassOf(v), 1, { name: v.name }), E(upperOf(v), 1, { name: v.name })]), jz);
  D('jzladder', JZ, 'One progression, four ways', 'Advanced', ['jazz', 'rootless', 'drop2'], 'The same ii–V–I four times: as shells, as guide tones alone, as rootless chords with a colour, and as drop 2 chords.', 'Each pass keeps the 3rds and 7ths and changes what surrounds them.',
    (c) => ['shell', 'guide', 'rootless', 'drop2'].flatMap((st, a) => lead(twoFive(c.key), st).flatMap((v, b) => [SV(v, 2, { g: a * 4 + b }), SV(v, 2, { g: a * 4 + b, vel: 0.6 })])), jz);
  const comp = (key, bar) => { const v = lead(twoFive(key), 'shell'); return v.flatMap((x) => bar(x)); };
  D('jzfour', JZ, 'Four to the bar', 'Intermediate', ['swing'], 'A short shell on every beat through ii–V–I, with beats 2 and 4 a little stronger.', 'Squeeze to sound the chord, relax to stop it. The left hand makes the rhythm.',
    (c) => comp(c.key, (v) => [0.6, 0.85, 0.6, 0.85].flatMap((vel) => [SV(v, 0.5, { vel }), R(0.5)])), jz);
  D('jz24', JZ, 'Beats 2 and 4', 'Intermediate', ['swing'], 'Chords on the backbeat only, leaving beats 1 and 3 to the bass.', 'Tap your foot on 1 and 3 and play on 2 and 4. It should feel like clapping along.',
    (c) => comp(c.key, (v) => [R(1), SV(v, 0.5), R(1.5), SV(v, 0.5), R(0.5)]), jz);
  D('jzcharl', JZ, 'One, and of two', 'Intermediate', ['swing'], 'The classic two-hit comping figure: a long chord on beat 1 and a short one on the “and” of beat 2, swung.', 'Say “daah, dit” and then stay out of the way for the rest of the bar.',
    (c) => ({ ev: comp(c.key, (v) => [SV(v, 1.5), SV(v, 0.5, { vel: 0.7 }), R(2)]), swing: true }), jz);
  D('jzpush', JZ, 'Pushing the chord', 'Advanced', ['swing', 'iivi'], 'Each new chord arrives an eighth note early, on the last “and” of the bar before, and rings across the bar line.', 'The pushed chord belongs to the bar after it. Count on through it.',
    (c) => { const v = lead(twoFive(c.key), 'shell'); return { ev: [SV(v[0], 3.5), SV(v[1], 4), SV(v[2], 4), SV(v[3], 4.5, { vel: 0.6 })], swing: true }; }, jz);
  D('jz2bar', JZ, 'A two-bar comping pattern', 'Advanced', ['swing'], 'Bar one: a long chord on beat 1 and a short one on the “and” of 2. Bar two answers off the beat. One chord of the ii–V–I per two bars.', 'Think of the two bars as a question and its answer.',
    (c) => { const v = lead(twoFive(c.key).slice(0, 3), 'shell'); return { ev: v.flatMap((x) => [SV(x, 1.5), SV(x, 0.5, { vel: 0.7 }), R(2), R(1.5), SV(x, 1, { vel: 0.7 }), SV(x, 1.5)]), swing: true }; }, jz);
  const JQ = ['maj7', '7', 'm7', 'm7b5'];
  D('jzdrop2', JZ, 'Drop 2 inversions', 'Advanced', ['drop2'], 'One chord in its four inversions up the top four strings and back. Each has a different chord tone on top.', 'Name the top note of each shape: it is the melody note that shape gives you.',
    (c) => { const ch = T.chord(c.key, JQ[c.v]), v = ch.voicings.filter(KINDS.drop2).sort((a, b) => a.hi - b.hi); return updown(v.map((x, g) => S(x.frets, 2, { g, name: ch.name }))); }, { opts: ['key'], vars: ['Major 7', 'Dominant 7', 'Minor 7', 'Half-diminished'], tempo: [60, 90] });
  D('jzdrop2scale', JZ, 'The key in drop 2 chords', 'Advanced', ['drop2', 'diatonic'], 'The seven seventh chords of the key as drop 2 shapes climbing the top four strings.', 'Three shapes do most of the work. Notice which chord of the key takes which shape.',
    (c) => { let near = 2; const d = dia(c.key); return d.concat(d[0]).map((x, k) => { const v = voice(x.root, x.sev, 'drop2', near + (k ? 1.7 : 0)); near = mid(v); return SV(v, 2, { g: k }); }); }, { opts: ['key'], tempo: [60, 90] });
  const p7 = (key) => lift(posOf(key, 'major', '7'));
  const II = 2, V = 5, I = 1; // index of each chord's root in a position that starts on the 7th
  D('jzarps', JZ, 'Arpeggios through ii–V–I', 'Advanced', ['arps', 'jazzlines', 'iivi'], 'The seventh arpeggio of each chord in one hand position: up four notes and back. Two bars on the I chord.', 'The hand stays put. Only the notes you pick out of the position change.',
    (c) => { const p = p7(c.key), d = dia(c.key); return [[II, d[1]], [V, d[4]], [I, d[0]], [I, d[0]]].flatMap(([i, x]) => run([i, i + 2, i + 4, i + 6, i + 4, i + 2, i].map((k) => p[k]), 0.5, { name: T.chord(x.root, x.sev).name }).concat([R(0.5)])); }, jz);
  D('jzcells', JZ, 'Four-note cells: 1 2 3 5', 'Advanced', ['jazzlines', 'arps'], 'A tiny vocabulary: the 1st, 2nd, 3rd and 5th notes above each chord’s root, up and then back, through ii–V–I.', 'Four notes that fit any chord. Drill them until you can start one on any beat.',
    (c) => { const p = p7(c.key), d = dia(c.key); return [[II, d[1]], [V, d[4]], [I, d[0]], [I, d[0]]].flatMap(([i, x]) => run([i, i + 1, i + 2, i + 4, i + 4, i + 2, i + 1, i].map((k) => p[k]), 0.5, { name: T.chord(x.root, x.sev).name })); }, jz);
  D('jz7to3', JZ, 'The 7th falls to the 3rd', 'Intermediate', ['jazzlines', 'iivi', 'rootless'], 'Through ii–V–I, the 7th of each chord steps down to become the 3rd of the next. Roots are played first so you hear each chord.', 'Two half steps carry the whole progression. Sing them.',
    (c) => { const p = p7(c.key), d = dia(c.key), nm = (x) => T.chord(x.root, x.sev).name; return [E(p[II], 1, { name: nm(d[1]) }), E(p[II + 6], 3, { name: nm(d[1]) }), E(p[V], 1, { name: nm(d[4]) }), E(p[V + 2], 1, { name: nm(d[4]) }), E(p[V + 6], 2, { name: nm(d[4]) }), E(p[I], 1, { name: nm(d[0]) }), E(p[I + 9], 3, { name: nm(d[0]) }), R(4)]; }, jz);
  const below = (n, label) => (n.f > 0 || n.s === 0 ? { s: n.s, f: Math.max(0, n.f - 1), label: label || '↗', role: 'fifth' } : { s: n.s - 1, f: TUN[n.s] - 1 - TUN[n.s - 1], label: label || '↗', role: 'fifth' });
  D('jzapproach', JZ, 'Approach from a half step below', 'Advanced', ['jazzlines'], 'Each note of the I chord’s arpeggio, reached from one fret beneath it. The approach note is short and the chord tone long.', 'The outside note is right because it resolves at once. Play it lightly and land firmly.',
    (c) => { const p = p7(c.key); return [I, I + 2, I + 4, I + 6, I + 7].flatMap((k) => [E(below(p[k]), 0.5, { vel: 0.6 }), E(p[k], 1.5)]); }, jz);
  D('jzenclose', JZ, 'Enclosures', 'Advanced', ['jazzlines'], 'Each chord tone of the I chord is surrounded: the scale note above, the note a half step below, then the target on the beat.', 'Above, below, home. Bebop players wrap almost every important note this way.',
    (c) => { const p = p7(c.key); return [I, I + 2, I + 4, I + 7].flatMap((k) => [E(p[k + 1], 0.5, { vel: 0.7 }), E(below(p[k]), 0.5, { vel: 0.6 }), E(p[k], 1), R(2)]); }, jz);
  D('jzbebop', JZ, 'A passing note on the V chord', 'Advanced', ['jazzlines', 'modes'], 'The scale of the V chord coming down from its root, with one extra note slipped between the root and the 7th. With eight notes to the bar, the chord tones all land on the beat.', 'Tap your foot and check: root, 7th, 5th and 3rd fall on the taps.',
    (c) => { const p = p7(c.key), top8 = p[V + 7], d = dia(c.key), nm = T.chord(d[4].root, '7').name; return run([top8, below(top8, '•'), p[V + 6], p[V + 5], p[V + 4], p[V + 3], p[V + 2], p[V + 1]], 0.5, { name: nm }).concat([E(p[V], 2, { name: nm }), R(2)]); }, jz);
  D('jzdim', JZ, 'Diminished sevenths in minor thirds', 'Advanced', ['sevenths', 'turnarounds'], 'One diminished seventh shape moved up three frets at a time. Each move gives the same four notes in a new order.', 'A diminished seventh divides the octave into four equal parts, so every inversion has the same fingering.',
    (c) => { const ch = T.chord(c.key, 'dim7'), v = ch.voicings.filter(KINDS.drop2).sort((a, b) => a.hi - b.hi); return updown(v.map((x, g) => S(x.frets, 2, { g, name: ch.name }))); }, { opts: ['key'], tempo: [60, 90] });
  D('jztritone', JZ, 'A dominant and its substitute', 'Advanced', ['turnarounds', 'rootless'], 'The V chord, then the dominant a tritone away, then home. The two upper notes are the same for both dominants; only the bass moves.', 'Hold the guide tones still and listen to the bass slide down a half step into the I chord.',
    (c) => { const d = dia(c.key), sub = T.KEYS[mod(pcOf(d[4].root) + 6)], v = lead([[d[4].root, '7'], [sub, '7'], [d[0].root, d[0].sev]], 'shell', 3); return [E(bassOf(v[0]), 1, { name: v[0].name }), E(upperOf(v[0]), 1, { name: v[0].name }), E(bassOf(v[1]), 1, { name: v[1].name }), E(upperOf(v[1]), 1, { name: v[1].name }), SV(v[2], 4)]; }, jz);
  D('jzbossa', JZ, 'Bossa nova through ii–V–I', 'Intermediate', ['bossa', 'fingerstyle', 'iivi'], 'Thumb on beats 1 and 3, fingers on beat 1, the “and” of 2, and beat 4, in even eighth notes.', 'The right hand repeats without change. Keep it going even when the left hand is late.',
    (c) => lead(twoFive(c.key), 'shell').flatMap((v) => { const b = bassOf(v), u = upperOf(v); return [E([b].concat(u), 1.5, { name: v.name }), E(u, 0.5, { vel: 0.7, name: v.name }), E(b, 1, { name: v.name }), E(u, 1, { vel: 0.7, name: v.name })]; }), jz);

  // ======================= tunes to read (js/tunes.js), each also a drill that plays in time =======================
  const TUNE_FROM = { s1a: ['read1'], s1b: ['read1'], s2a: ['read2'], s2b: ['read2'], buns: ['read2'], mary: ['read2'], clair: ['read2'], ode: ['read2', 'staff'], saints: ['read2'], s3a: ['read3'], twinkle: ['read3'], jingle: ['read3', 'rhythm'], s8a: ['read3', 'rhythm'], s4a: ['read4'], aura: ['read4', 'keysig'], yankee: ['read4'], grace: ['read4', 'rhythm'], s5a: ['read5'], s6a: ['read5'], srun: ['read5', 'firstnotes'] };
  (G.Tunes ? G.Tunes.list : []).forEach((t) => D('tn' + t.id, FD, (/written for this app/.test(t.credit) ? 'Study: ' : 'Tune: ') + t.title, t.level > 1 ? 'Intermediate' : 'Beginner', TUNE_FROM[t.id] || ['staff'],
    `${t.title}. ${t.credit}. Read it from the staff in its lesson, then play it here in time.${t.chords ? ' The list on the right adds a second guitar: strum the chords while the app plays the tune, or play the tune while the app strums.' : ''}${t.time === 3 ? ' It is in three: set the metronome to 3/4 at the top.' : ''}`, 'Count one bar before you start, and keep your eyes a note ahead of your fingers.',
    (c) => {
      if (!t.chords || !c.v) return t.notes.map(([s, f, d]) => (s ? E(N(s, f), d) : R(d)));
      // two parts on one timeline: the tune, and a chord strummed on every beat of each full bar
      const tm = new Map(), put = (x, k, v) => { const key = Math.round(x * 12); if (!tm.has(key)) tm.set(key, { x }); tm.get(key)[k] = v; };
      const solo = c.v === 3;
      let x = 0; t.notes.forEach(([s, f, d]) => { if (s && (c.v === 1 || solo)) put(x, 'n', N(s, f)); else put(x, 'r', 1); x += d; });
      const total = x; let bar = 0;
      for (let b = t.pickup || 0; b < total - 1e-6; b += t.time, bar++) { const names = t.chords[bar] || t.chords[t.chords.length - 1]; for (let k = 0; k < t.time && b + k < total - 1e-6; k++) { const nm = names[Math.min(names.length - 1, Math.floor(k * names.length / t.time))]; if (!solo) put(b + k, 'ch', { nm, vel: k ? 0.4 : 0.6 }); else if (k === 0 || (t.time === 4 && k === 2)) put(b + k, 'bs', Object.assign(at(oc(nm), OPEN[nm][1]), { label: 'p', role: 'root', nm })); } }
      const pts = [...tm.values()].sort((a, b) => a.x - b.x);
      return pts.map((p, i) => { const d = (i + 1 < pts.length ? pts[i + 1].x : total) - p.x, e = p.n || p.bs ? E([p.n, p.bs].filter(Boolean), d) : R(d); if (p.ch) { e.frets = fr(oc(p.ch.nm)); e.name = p.ch.nm; e.svel = p.ch.vel; } return e; });
    }, Object.assign({ tempo: [60, 100] }, t.chords ? { vars: ['The tune alone', 'The tune with chords: a duet', 'Chords only: you play the tune'].concat(t.notes.every((n) => n[0] <= 3) ? ['Fingerstyle solo: the tune over a thumb bass'] : []) } : {})));

  // ---------- what the rest of the app sees ----------
  const byId = Object.fromEntries(list.map((d) => [d.id, d]));
  // practice items that existed before the library, filed under the lessons they belong to
  const OTHER = {
    changes: ['minute'], openchords: ['minute'], colour: ['minute'], solobass: ['tnclair', 'tnmary', 'tnode', 'tntwinkle', 'tnsaints', 'tnjingle', 'fspinch', 'fsalt', 'ms6ths'],
    warmups: ['chromatic', 'spider', 'skip', 'climb'], hands: ['gsfingers', 'pkalt', 'fspima'], practise: ['gscount', 'chromatic', 'chpairs', 'rhladder'], picking: ['chromatic', 'skip'], fretboard: ['quiz', 'find', 'findall', 'walk'], alphabet: ['quiz', 'find'], intervals: ['interval', 'nameiv', 'eariv'], ear: ['eariv', 'earchord', 'earfn'],
    keysig: ['keyquiz'], circle: ['keyquiz'], families: ['three', 'pop', 'fifties', 'earfn'], diatonic: ['canon', 'sens', 'cycle4', 'earfn'], blues: ['blues', 'quick'], triadscale: ['triads'], triads: ['triads'],
    sevenths: ['namechord', 'chordtone', 'earchord'], minorkeys: ['m145', 'andalu', 'mpop', 'borrow'], iivi: ['jazz', 'm251', 'chain'], turnarounds: ['turn', 'turn6', 'three6', 'tritone', 'jblues', 'fast', 'rhythm'],
    function: ['earfn', 'fnq', 'cycle4', 'three'], secdom: ['secq', 'turn6', 'exdom', 'jzcycle'], relatedii: ['secq', 'three6', 'chain'], interchange: ['borrow', 'backdoor', 'cliche'], bluesvar: ['blues', 'quick', 'jblues', 'mblues', 'sctarget'], extensions: ['tensq', 'chordtone'],
    jazz: ['jazz'], rootless: ['jazz', 'turn'], drop2: ['jazz', 'cycle4'], swing: ['jazz'],
  };
  G.Drills = {
    list, byId, groups: [GS, TQ, FD, CH, SC, JZ],
    pairs: PAIRS.map((p) => ({ names: p, frets: p.map((n) => fr(oc(n))) })),
    forLesson: (id) => list.filter((d) => d.from.includes(id)).map((d) => d.id).concat(OTHER[id] || []),
  };
})();
