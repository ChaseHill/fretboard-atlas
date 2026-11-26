// Music theory helpers and generators: note spelling, chord voicings, scales, drills.
(() => {
  'use strict';
  const G = (window.G = window.G || {});
  const T = (G.T = {});
  T.TUNING = [40, 45, 50, 55, 59, 64]; // string 6 → string 1 (MIDI)
  T.OPEN = ['E', 'A', 'D', 'G', 'B', 'E'];
  T.KEYS = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
  T.CIRCLE = ['C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'D♭', 'A♭', 'E♭', 'B♭', 'F'];
  T.DEG = ['1', '♭2', '2', '♭3', '3', '4', '♭5', '5', '♭6', '6', '♭7', '7'];
  const L = 'CDEFGAB', LS = [0, 2, 4, 5, 7, 9, 11], ACC = { '♭': -1, '♯': 1, '𝄫': -2, '𝄪': 2 };
  const B36 = '0123456789abcdefghijklmnopqrstuvwxyz';
  const mod = (n, m = 12) => ((n % m) + m) % m;
  T.mod = mod;
  T.esc = (s) => String(s).replace(/𝄫/g, '♭♭').replace(/𝄪/g, '♯♯');
  T.slug = (k) => k.replace(/♭/g, 'b').replace(/♯/g, 's');
  T.pc = (name) => mod([...name].slice(1).reduce((a, c) => a + ACC[c], LS[L.indexOf(name[0])]));
  const parseDeg = (d) => { const m = d.match(/^(\D*)(\d+)$/); return { acc: [...m[1]].reduce((a, c) => a + ACC[c], 0), num: +m[2] }; };
  T.degSemi = (d) => { const { acc, num } = parseDeg(d); return mod(LS[(num - 1) % 7] + acc); };
  T.spell = (root, deg) => {
    const { num } = parseDeg(deg);
    const li = (L.indexOf(root[0]) + num - 1) % 7;
    const diff = mod(T.pc(root) + T.degSemi(deg) - LS[li] + 6) - 6;
    return L[li] + (diff < 0 ? '♭'.repeat(-diff) : '♯'.repeat(diff));
  };
  T.role = (deg) => (deg === '1' ? 'root' : /^\D*[37]$/.test(deg) ? 'guide' : /^\D*5$/.test(deg) ? 'fifth' : 'ext');
  T.ordinal = (deg) => {
    const { num } = parseDeg(deg), acc = deg.replace(/\d+$/, '');
    const n = { 1: 'root', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th', 6: '6th', 7: '7th', 9: '9th', 11: '11th', 13: '13th' }[num];
    return ({ '': '', '♭': 'flat ', '♯': 'sharp ', '𝄫': 'diminished ' }[acc] || '') + n;
  };
  T.tones = (root, degs) => degs.map((deg) => ({ deg, note: T.spell(root, deg), pc: mod(T.pc(root) + T.degSemi(deg)), role: T.role(deg) }));

  // A voicing: frets for strings 6→1 (null = not played) resolved against a chord's tones.
  T.voicing = (tones, frets, meta = {}) => {
    const byPc = {};
    tones.forEach((t) => { if (!(t.pc in byPc)) byPc[t.pc] = t; });
    const notes = frets.map((f, i) => (f === null ? null : byPc[mod(T.TUNING[i] + f)] || undefined));
    if (notes.includes(undefined)) return null;
    const used = frets.filter((f) => f !== null), fretted = used.filter((f) => f > 0);
    const hi = Math.max(...used), lo = fretted.length ? Math.min(...fretted) : 0;
    const bassIdx = frets.findIndex((f) => f !== null);
    // Reach, counted in frets the hand must cover (open strings cost nothing): five frets is a stretch, six or more a big one.
    // Frets narrow up the neck, so from fret 9 a five-fret shape is no longer counted.
    const reach = fretted.length > 1 ? hi - lo + 1 : 1, wide = reach >= 6, tight = reach === 5 && lo < 9;
    const v = Object.assign({
      frets, notes, n: used.length, min: Math.min(...used), max: hi, lo, hi,
      bass: notes[bassIdx], strings: frets.map((f, i) => (f === null ? '' : 6 - i)).join(''),
      open: used.includes(0),
    }, meta);
    v.reach = reach; v.wide = wide; v.stretch = !!(meta && meta.stretch) || wide || tight;
    return v;
  };

  // ---------- chord qualities ----------
  const Q = (id, suf, name, group, degs, jazz) => ({ id, suf, name, group, degs: degs.split(' '), jazz: !!jazz });
  T.QUALS = [
    Q('maj', '', 'Major', 'Triads', '1 3 5'),
    Q('m', 'm', 'Minor', 'Triads', '1 ♭3 5'),
    Q('5', '5', 'Power chord', 'Triads', '1 5'),
    Q('sus2', 'sus2', 'Suspended 2nd', 'Triads', '1 2 5'),
    Q('sus4', 'sus4', 'Suspended 4th', 'Triads', '1 4 5'),
    Q('dim', '°', 'Diminished', 'Triads', '1 ♭3 ♭5'),
    Q('aug', '+', 'Augmented', 'Triads', '1 3 ♯5'),
    Q('6', '6', 'Major 6th', 'Sixths & sevenths', '1 3 5 6', true),
    Q('m6', 'm6', 'Minor 6th', 'Sixths & sevenths', '1 ♭3 5 6', true),
    Q('maj7', 'maj7', 'Major 7th', 'Sixths & sevenths', '1 3 5 7', true),
    Q('7', '7', 'Dominant 7th', 'Sixths & sevenths', '1 3 5 ♭7', true),
    Q('m7', 'm7', 'Minor 7th', 'Sixths & sevenths', '1 ♭3 5 ♭7', true),
    Q('mMaj7', 'm(maj7)', 'Minor-major 7th', 'Sixths & sevenths', '1 ♭3 5 7', true),
    Q('m7b5', 'm7♭5', 'Half-diminished', 'Sixths & sevenths', '1 ♭3 ♭5 ♭7', true),
    Q('dim7', '°7', 'Diminished 7th', 'Sixths & sevenths', '1 ♭3 ♭5 𝄫7', true),
    Q('7sus4', '7sus4', 'Dominant 7 sus4', 'Sixths & sevenths', '1 4 5 ♭7'),
    Q('add9', 'add9', 'Add 9', 'Extended', '1 3 5 9'),
    Q('69', '6/9', 'Six-nine', 'Extended', '1 3 5 6 9'),
    Q('maj9', 'maj9', 'Major 9th', 'Extended', '1 3 5 7 9'),
    Q('9', '9', 'Dominant 9th', 'Extended', '1 3 5 ♭7 9'),
    Q('m9', 'm9', 'Minor 9th', 'Extended', '1 ♭3 5 ♭7 9'),
    Q('13', '13', 'Dominant 13th', 'Extended', '1 3 5 ♭7 9 13'),
    Q('7b9', '7♭9', 'Dominant 7 flat 9', 'Extended', '1 3 5 ♭7 ♭9'),
    Q('7s9', '7♯9', 'Dominant 7 sharp 9', 'Extended', '1 3 5 ♭7 ♯9'),
  ];
  const QBY = Object.fromEntries(T.QUALS.map((q) => [q.id, q]));
  // General quality → suffix of the matching chord in the rootless library.
  const ROOTLESS_OF = { maj7: 'maj7', 7: '7', m7: 'm7', mMaj7: 'm(maj7)', m7b5: 'm7♭5', dim7: '°7', maj9: 'maj9', 9: '9', m9: 'm9', 13: '13', '7b9': '7♭9', '7s9': '7♯9' };

  // CAGED forms: fret offsets from the root fret, strings 6→1. x = not played.
  const x = null;
  T.FORMS = {
    E: { s: 0, t: {
      maj: [0, 2, 2, 1, 0, 0], m: [0, 2, 2, 0, 0, 0], 5: [0, 2, 2, x, x, x], sus4: [0, 2, 2, 2, 0, 0], dim: [0, 1, 2, 0, x, x], aug: [0, 3, 2, 1, 1, 0],
      6: [0, 2, 2, 1, 2, 0], m6: [0, 2, 2, 0, 2, 0], maj7: [0, 2, 1, 1, 0, 0], 7: [0, 2, 0, 1, 0, 0], m7: [0, 2, 0, 0, 0, 0], mMaj7: [0, 2, 1, 0, 0, 0],
      m7b5: [0, x, 0, 0, -1, x], dim7: [0, x, -1, 0, -1, x], '7sus4': [0, 2, 0, 2, 0, 0], 9: [0, 2, 0, 1, 0, 2], m9: [0, 2, 0, 0, 0, 2], maj9: [0, x, 1, 1, 0, 2], 13: [0, x, 0, 1, 2, x],
    } },
    A: { s: 1, t: {
      maj: [x, 0, 2, 2, 2, 0], m: [x, 0, 2, 2, 1, 0], 5: [x, 0, 2, 2, x, x], sus2: [x, 0, 2, 2, 0, 0], sus4: [x, 0, 2, 2, 3, 0], dim: [x, 0, 1, 2, 1, x], aug: [x, 0, 3, 2, 2, 1],
      6: [x, 0, 2, 2, 2, 2], m6: [x, 0, 2, 2, 1, 2], maj7: [x, 0, 2, 1, 2, 0], 7: [x, 0, 2, 0, 2, 0], m7: [x, 0, 2, 0, 1, 0], mMaj7: [x, 0, 2, 1, 1, 0],
      m7b5: [x, 0, 1, 0, 1, x], dim7: [x, 0, 1, 2, 1, 2], '7sus4': [x, 0, 2, 0, 3, 0], 69: [x, 0, -1, -1, 0, 0], maj9: [x, 0, -1, 1, 0, x], 9: [x, 0, -1, 0, 0, 0],
      m9: [x, 0, -2, 0, 0, x], 13: [x, 0, -1, 0, 0, 2], '7b9': [x, 0, -1, 0, -1, x], '7s9': [x, 0, -1, 0, 1, x],
    } },
    C: { s: 1, t: { maj: [x, 0, -1, -3, -2, -3], m: [x, 0, -2, -3, -2, x], 6: [x, 0, -1, -1, -2, -3], maj7: [x, 0, -1, -3, -3, -3], 7: [x, 0, -1, 0, -2, x], add9: [x, 0, -1, -3, 0, -3] } },
    G: { s: 0, t: { maj: [0, -1, -3, -3, -3, 0], m: [0, -2, -3, -3, 0, 0], sus4: [0, x, -3, -3, -2, 0], 6: [0, -1, -3, -3, -3, -3], maj7: [0, -1, -3, -3, -3, -1], 7: [0, -1, -3, -3, -3, -2] } },
    D: { s: 2, t: {
      maj: [x, x, 0, 2, 3, 2], m: [x, x, 0, 2, 3, 1], 5: [x, x, 0, 2, 3, x], sus2: [x, x, 0, 2, 3, 0], sus4: [x, x, 0, 2, 3, 3], dim: [x, x, 0, 1, 3, 1], aug: [x, x, 0, 3, 3, 2],
      6: [x, x, 0, 2, 0, 2], m6: [x, x, 0, 2, 0, 1], maj7: [x, x, 0, 2, 2, 2], 7: [x, x, 0, 2, 1, 2], m7: [x, x, 0, 2, 1, 1], mMaj7: [x, x, 0, 2, 2, 1], m7b5: [x, x, 0, 1, 1, 1], dim7: [x, x, 0, 1, 0, 1],
    } },
  };

  // Put a list of pitches (semitones above the root, ascending) on the given strings, as low on the neck as it fits.
  function place(rootPc, rel, strings, minFret = 1) {
    const f0 = mod(rootPc + rel[0] - T.TUNING[strings[0]]);
    for (const oct of [0, 12]) {
      const p0 = T.TUNING[strings[0]] + f0 + oct;
      const fr = rel.map((r, i) => p0 + (r - rel[0]) - T.TUNING[strings[i]]);
      const lo = Math.min(...fr), hi = Math.max(...fr);
      if (lo >= minFret && hi <= 16 && hi - lo <= 4) {
        const frets = [null, null, null, null, null, null];
        strings.forEach((s, i) => { frets[s] = fr[i]; });
        return frets;
      }
    }
    return null;
  }

  const raw = () => window.CHORD_DATA;
  function rootlessGroups(root, rc, prefix) {
    const tones = T.tones(root, rc.t.map((t) => t[0])), plain = tones.length === 3;
    const vs = rc.v.map((code) => {
      const frets = [...code.slice(0, 6)].map((c) => (c === '-' ? null : B36.indexOf(c)));
      const n = frets.filter((f) => f !== null).length;
      const kind = plain ? (n === 2 ? 'shell' : 'close') : n === 3 ? 'shellx' : 'drop2r';
      return T.voicing(tones, frets, { stretch: code.endsWith('!'), kind, rootless: true });
    }).filter(Boolean);
    const sx = vs.find((v) => v.kind === 'shellx');
    const ext = sx && sx.notes.find((n) => n && n.role !== 'guide');
    const defs = plain
      ? [['shell', 'Guide-tone shells'], ['close', 'All inversions, three adjacent strings']]
      : [['shellx', 'Shell + ' + (ext ? ext.deg : 'extension')], ['drop2r', 'All inversions, drop-2']];
    const hints = { shell: 'Just the 3rd and 7th. The smallest shape that still names the chord.', close: 'The chord without its root is a plain triad. Good for comping over a bass player.', shellx: 'Guide tones plus one colour note on top.', drop2r: 'Four-note rootless chords for small-group jazz.' };
    return { tones, groups: defs.map(([kind, label]) => ({ kind, label: prefix + label, hint: hints[kind], items: vs.filter((v) => v.kind === kind) })).filter((g) => g.items.length) };
  }
  const rawKey = (root) => T.KEYS[T.pc(root)];
  const rawChords = (root) => raw().chords.filter((c) => c.k === rawKey(root));

  const cache = new Map();
  // Any chord by root name and id: a quality id from T.QUALS, or "r<n>" for the nth chord of the rootless library.
  T.chord = (root, id, capo = 0) => {
    const key = root + '|' + id + '|' + capo;
    if (cache.has(key)) return cache.get(key);
    let c;
    if (capo) { // with a capo you finger the shapes of a lower chord; everything sounds `capo` frets higher
      const base = T.chord(T.KEYS[mod(T.pc(root) - capo)], id), sounding = T.chord(root, id);
      c = Object.assign({}, sounding, { capo, shape: base.name, groups: base.groups.map((g) => ({ kind: g.kind, label: g.label, hint: g.hint,
        items: g.items.map((v) => T.voicing(sounding.tones, v.frets.map((f) => (f === null ? null : f + capo - (v.hi + capo > 16 && v.min >= 12 ? 12 : 0))), { kind: v.kind, form: v.form, rootless: v.rootless, stretch: v.stretch, open: v.open, capo })).filter((v) => v && v.hi <= 17) })).filter((g) => g.items.length) });
      c.voicings = [].concat(...c.groups.map((g) => g.items.map((v) => Object.assign(v, { group: g.label }))));
      cache.set(key, c);
      return c;
    }
    if (/^r\d+$/.test(id)) {
      const rc = rawChords(root)[+id.slice(1)], suffix = rc.n.slice(rc.k.length);
      const { tones, groups } = rootlessGroups(root, rc, '');
      c = { id, root, suffix, name: root + suffix, quality: 'Rootless ' + rc.f.toLowerCase(), cat: 'Rootless · ' + rc.f, family: rc.f, tones, groups, rootless: true, rootPc: T.pc(root) };
    } else {
      const q = QBY[id], tones = T.tones(root, q.degs), rootPc = T.pc(root), groups = [];
      const caged = [];
      for (const form of 'CAGED') {
        const F = T.FORMS[form], off = F.t[id];
        if (!off) continue;
        let r = mod(rootPc - T.TUNING[F.s]);
        if (r + Math.min(...off.filter((o) => o !== null)) < 0) r += 12;
        const v = T.voicing(tones, off.map((o) => (o === null ? null : r + o)), { kind: 'caged', form, rootFret: r });
        if (v && v.hi <= 16) caged.push(v);
      }
      caged.sort((a, b) => a.lo - b.lo || a.hi - b.hi);
      const open = caged.filter((v) => v.open), mov = caged.filter((v) => !v.open);
      if (open.length) groups.push({ kind: 'caged', label: 'Open position', hint: 'Open strings ring on. Fingerstyle, classical accompaniment and song playing.', items: open });
      if (mov.length) groups.push({ kind: 'caged', label: 'Movable shapes (CAGED)', hint: 'Barre forms, named after the open chord each one comes from.', items: mov });
      if (['maj', 'm', 'dim', 'aug'].includes(id)) {
        const tr = q.degs.map((d) => T.degSemi(d)), items = [];
        for (const strs of [[3, 4, 5], [2, 3, 4], [1, 2, 3]]) for (let inv = 0; inv < 3; inv++) {
          const fr = place(rootPc, [0, 1, 2].map((j) => tr[(inv + j) % 3] + (inv + j >= 3 ? 12 : 0)), strs, 0);
          const v = fr && T.voicing(tones, fr, { kind: 'triad' });
          if (v) items.push(v);
        }
        groups.push({ kind: 'triad', label: 'Triad inversions on three strings', hint: 'Small shapes for fingerstyle and classical parts, and the upper half of bigger jazz chords.', items });
      }
      const semi = (d) => T.degSemi(d);
      if (q.jazz) {
        const third = q.degs[1], sev = q.degs[3], s3 = semi(third), s7 = semi(sev);
        const shells = [[[0, s7, s3 + 12], [0, 2, 3]], [[0, s3, s7], [0, 1, 2]], [[0, s3, s7], [1, 2, 3]], [[0, s7, s3 + 12], [1, 3, 4]]]
          .map(([rel, strs]) => { const fr = place(rootPc, rel, strs); return fr && T.voicing(tones, fr, { kind: 'shellR' }); }).filter(Boolean);
        if (shells.length) groups.push({ kind: 'shellR', label: `Shell voicings (root, ${third}, ${T.esc(sev)})`, hint: 'Three notes, no 5th. Swing rhythm guitar and comping.', items: shells });
        const st = q.degs.map(semi).sort((a, b) => a - b);
        const drops = (which, sets, kind) => {
          const out = [];
          for (const strs of sets) for (let inv = 0; inv < 4; inv++) {
            const close = [0, 1, 2, 3].map((j) => st[(inv + j) % 4] + (inv + j >= 4 ? 12 : 0));
            const d = close.splice(4 - which, 1)[0] - 12;
            const fr = place(rootPc, [d, ...close], strs);
            const v = fr && T.voicing(tones, fr, { kind });
            if (v) out.push(v);
          }
          return out;
        };
        [[[2, 3, 4, 5], 'Drop-2 · top strings (4-3-2-1)', 'The standard jazz voicing for comping and chord melody: the melody note sits on top.'],
          [[1, 2, 3, 4], 'Drop-2 · middle strings (5-4-3-2)', 'A warmer register. Good under a singer or a horn.'],
          [[0, 1, 2, 3], 'Drop-2 · low strings (6-5-4-3)', 'Thick and dark. Use sparingly.']].forEach(([strs, label, hint]) => {
          const items = drops(2, [strs], 'drop2');
          if (items.length) groups.push({ kind: 'drop2', label, hint, items });
        });
        [[[0, 2, 3, 4], 'Drop-3 · bass on string 6'], [[1, 3, 4, 5], 'Drop-3 · bass on string 5']].forEach(([strs, label]) => {
          const items = drops(3, [strs], 'drop3');
          if (items.length) groups.push({ kind: 'drop3', label, hint: 'A bass note, a skipped string, then three notes. Solo guitar and bossa nova.', items });
        });
      }
      const rs = ROOTLESS_OF[id], rc = rs !== undefined && rawChords(root).find((cc) => cc.n.slice(cc.k.length) === rs);
      if (rc) groups.push(...rootlessGroups(root, rc, 'Rootless · ').groups);
      c = { id, root, suffix: q.suf, name: root + q.suf, quality: q.name, cat: q.group, tones, groups, rootPc };
    }
    c.voicings = [].concat(...c.groups.map((g) => g.items.map((v) => Object.assign(v, { group: g.label }))));
    cache.set(key, c);
    return c;
  };
  // Every chord offered for a key, in sidebar order.
  T.chordList = (root) => T.QUALS.map((q) => ({ id: q.id, name: root + q.suf, cat: q.group }))
    .concat(rawChords(root).map((rc, i) => ({ id: 'r' + i, name: root + rc.n.slice(rc.k.length), cat: 'Rootless · ' + rc.f })));

  // ---------- scales ----------
  const S = (id, name, group, degs, blurb, over) => ({ id, name, group, degs: degs.split(' '), blurb, over });
  T.SCALES = [
    S('major', 'Major', 'Essentials', '1 2 3 4 5 6 7', 'The reference scale. Every other scale and chord is described by how it differs from this one.', 'major and maj7 chords'),
    S('minor', 'Natural minor', 'Essentials', '1 2 ♭3 4 5 ♭6 ♭7', 'The major scale started from its 6th note. Darker, with flat 3rd, 6th and 7th.', 'minor and m7 chords'),
    S('majpent', 'Major pentatonic', 'Essentials', '1 2 3 5 6', 'The major scale without its 4th and 7th. No half steps, so nothing clashes.', 'major chords; country and pop melodies'),
    S('minpent', 'Minor pentatonic', 'Essentials', '1 ♭3 4 5 ♭7', 'Five notes, two per string. The first scale most guitarists solo with.', 'minor chords and blues'),
    S('blues', 'Blues', 'Essentials', '1 ♭3 4 ♭5 5 ♭7', 'Minor pentatonic plus the flat 5th, the “blue note”. Pass through it rather than rest on it.', 'dominant 7 and minor chords'),
    S('dorian', 'Dorian', 'Modes', '1 2 ♭3 4 5 6 ♭7', 'Minor with a natural 6th. Brighter than natural minor; the sound of a ii chord.', 'm7 chords'),
    S('phrygian', 'Phrygian', 'Modes', '1 ♭2 ♭3 4 5 ♭6 ♭7', 'Minor with a flat 2nd, one fret above the root. Spanish and metal colour.', 'minor chords, sus♭9'),
    S('lydian', 'Lydian', 'Modes', '1 2 3 ♯4 5 6 7', 'Major with a raised 4th. Floating and bright.', 'maj7 and maj7♯11 chords'),
    S('mixo', 'Mixolydian', 'Modes', '1 2 3 4 5 6 ♭7', 'Major with a flat 7th. The scale of a dominant 7 chord.', 'dominant 7 chords'),
    S('locrian', 'Locrian', 'Modes', '1 ♭2 ♭3 4 ♭5 ♭6 ♭7', 'The darkest mode: flat 2nd and flat 5th.', 'm7♭5 chords'),
    S('harm', 'Harmonic minor', 'Minor colours', '1 2 ♭3 4 5 ♭6 7', 'Natural minor with a raised 7th, which gives minor keys their V7 chord.', 'V7 in a minor key, m(maj7)'),
    S('mel', 'Melodic minor', 'Minor colours', '1 2 ♭3 4 5 6 7', 'A major scale with a flat 3rd. The parent of the altered and lydian-dominant sounds.', 'm(maj7), m6'),
  ];
  T.scale = (root, id) => {
    const def = T.SCALES.find((s) => s.id === id);
    return { root, id, def, name: root + ' ' + def.name.toLowerCase(), tones: T.tones(root, def.degs) };
  };
  const toneAt = (sc, pitch) => sc.tones.find((t) => t.pc === mod(pitch));
  T.scaleAll = (sc, maxFret = 15, minFret = 0) => {
    const out = [];
    for (let s = 0; s < 6; s++) for (let f = minFret; f <= maxFret; f++) { const tone = toneAt(sc, T.TUNING[s] + f); if (tone) out.push({ s, f, tone, pitch: T.TUNING[s] + f }); }
    return out;
  };
  // Position boxes: three notes per string (two for pentatonics), one box starting on each scale degree.
  T.scalePositions = (sc) => {
    const base = sc.id === 'blues' ? sc.tones.filter((t) => t.deg !== '♭5') : sc.tones;
    const nb = base.length, nps = nb === 5 ? 2 : 3, rootPc = T.pc(sc.root), sem = base.map((t) => mod(t.pc - rootPc));
    return base.map((_, k) => {
      let notes = [], idx = k, pitch = 40 + mod(base[k].pc - 40);
      for (let s = 0; s < 6; s++) for (let j = 0; j < nps; j++) {
        notes.push({ s, f: pitch - T.TUNING[s], tone: base[idx], pitch });
        const nx = (idx + 1) % nb;
        pitch += mod(sem[nx] - sem[idx]) || 12;
        idx = nx;
      }
      if (notes.some((n) => n.f < 0)) notes = notes.map((n) => Object.assign(n, { f: n.f + 12, pitch: n.pitch + 12 }));
      if (sc.id === 'blues') {
        const blue = sc.tones.find((t) => t.deg === '♭5');
        for (let s = 0; s < 6; s++) {
          const fs = notes.filter((n) => n.s === s).map((n) => n.f);
          for (let f = Math.min(...fs) + 1; f < Math.max(...fs); f++) if (mod(T.TUNING[s] + f) === blue.pc) notes.push({ s, f, tone: blue, pitch: T.TUNING[s] + f });
        }
        notes.sort((a, b) => a.pitch - b.pitch);
      }
      return notes;
    }).sort((a, b) => a[0].f - b[0].f);
  };
  T.stepFormula = (sc) => {
    const sem = sc.tones.map((t) => mod(t.pc - T.pc(sc.root))).concat(12);
    return sem.slice(1).map((v, i) => ({ 1: 'H', 2: 'W', 3: 'W+H' }[v - sem[i]] || v - sem[i])).join(' ');
  };
  T.PATTERNS = [['updown', 'Up and down'], ['thirds', 'In thirds'], ['threes', 'Groups of three'], ['fours', 'Groups of four']];
  T.pattern = (n, id) => {
    const up = [];
    if (id === 'thirds') for (let i = 0; i + 2 < n; i++) up.push(i, i + 2);
    else if (id === 'threes') for (let i = 0; i + 2 < n; i++) up.push(i, i + 1, i + 2);
    else if (id === 'fours') for (let i = 0; i + 3 < n; i++) up.push(i, i + 1, i + 2, i + 3);
    else { for (let i = 0; i < n; i++) up.push(i); return up.concat(up.slice(1, -1).reverse()); }
    return up.concat(up.map((i) => n - 1 - i));
  };

  // ---------- keys ----------
  T.diatonic = (key) => {
    const tri = ['maj', 'm', 'm', 'maj', 'maj', 'm', 'dim'], sev = ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'];
    const rom = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'], fn = ['Tonic', 'Subdominant', 'Tonic', 'Subdominant', 'Dominant', 'Tonic', 'Dominant'];
    return ['1', '2', '3', '4', '5', '6', '7'].map((d, i) => ({ roman: rom[i], root: T.spell(key, d), tri: tri[i], sev: sev[i], fn: fn[i] }));
  };
  T.signature = (key) => { const i = T.CIRCLE.indexOf(key); return i === 0 ? 'no sharps or flats' : i <= 6 ? `${i} sharp${i > 1 ? 's' : ''}` : `${12 - i} flat${12 - i > 1 ? 's' : ''}`; };
  T.sigShort = (key) => { const i = T.CIRCLE.indexOf(key); return i === 0 ? '0' : i <= 6 ? i + '♯' : 12 - i + '♭'; };

  // ---------- warm-ups ----------
  const fingerRun = (order, strings, fret, climb) => {
    const out = [];
    strings.forEach((s, k) => order.forEach((o) => out.push({ s, f: fret + o + (climb ? k : 0), finger: o + 1 })));
    return out;
  };
  const upDown = (order, fret, climb) => fingerRun(order, [0, 1, 2, 3, 4, 5], fret, climb).concat(fingerRun(order.slice().reverse(), [5, 4, 3, 2, 1, 0], fret, climb && 0));
  T.WARMUPS = [
    { id: 'chromatic', name: 'Chromatic 1-2-3-4', make: (f) => upDown([0, 1, 2, 3], f), text: 'One finger per fret, four notes on each string, low E to high E and back.', tip: 'Keep each finger down until the next string. Slow and even beats fast and uneven.' },
    { id: 'spider', name: 'Spider 1-3-2-4', make: (f) => upDown([0, 2, 1, 3], f), text: 'The same four frets, but fingers 1-3-2-4. It separates the ring finger from the pinky.', tip: 'Fingers that are not playing stay close to the strings.' },
    { id: 'skip', name: 'String skipping', make: (f) => fingerRun([0, 1, 2, 3], [0, 2, 1, 3, 2, 4, 3, 5], f), text: 'Four notes, skip a string, come back one. It trains the picking hand to find strings without looking.', tip: 'Use strict alternate picking: down, up, down, up.' },
    { id: 'climb', name: 'Diagonal climb', make: (f) => fingerRun([0, 1, 2, 3], [0, 1, 2, 3, 4, 5], f, true), text: 'Chromatic four-note groups that shift up one fret on every string.', tip: 'Move the whole hand as a unit when you change string; do not reach.' },
  ];
  // a chord named outright: semitones above the key note, quality, numeral
  const X = (o, q, r) => ({ o, q, r });
  T.PROGS = [
    { id: 'three', name: 'I – IV – V – I', bars: [[0], [3], [4], [0]], text: 'The three primary chords. Thousands of folk, rock and country songs use nothing else.' },
    { id: 'pop', name: 'I – V – vi – IV', bars: [[0], [4], [5], [3]], text: 'The four-chord pop progression.' },
    { id: 'fifties', name: 'I – vi – IV – V', bars: [[0], [5], [3], [4]], text: 'The doo-wop changes.' },
    { id: 'jazz', name: 'ii7 – V7 – Imaj7', bars: [[1, 's'], [4, 's'], [0, 's'], [0, 's']], text: 'The basic unit of jazz harmony. Watch the 3rds and 7ths move by a fret or stay put.' },
    { id: 'turn', name: 'Imaj7 – vi7 – ii7 – V7', bars: [[0, 's'], [5, 's'], [1, 's'], [4, 's']], text: 'The jazz turnaround: from the vi onward, each root falls a fifth to the next (vi to ii to V to I).' },
    { id: 'blues', name: '12-bar blues', bars: [[0, '7'], [0, '7'], [0, '7'], [0, '7'], [3, '7'], [3, '7'], [0, '7'], [0, '7'], [4, '7'], [3, '7'], [0, '7'], [4, '7']], text: 'Twelve bars, three dominant 7 chords.' },
    { id: 'quick', name: '12-bar blues, quick change', bars: [[0, '7'], [3, '7'], [0, '7'], [0, '7'], [3, '7'], [3, '7'], [0, '7'], [0, '7'], [4, '7'], [3, '7'], [0, '7'], [4, '7']], text: 'The same twelve bars with a visit to the IV chord in bar 2.' },
    { id: 'canon', name: 'I – V – vi – iii – IV – I – IV – V', bars: [[0], [4], [5], [2], [3], [0], [3], [4]], text: 'Eight bars over a bass that falls by step. One of the oldest sequences still in daily use.' },
    { id: 'sens', name: 'vi – IV – I – V', bars: [[5], [3], [0], [4]], text: 'The four-chord progression started from its minor chord. Same chords, darker story.' },
    { id: 'm145', group: 'Minor keys', minor: true, name: 'i – iv – V7 – i', bars: [X(0, 'm', 'i'), X(5, 'm', 'iv'), X(7, '7', 'V7'), X(0, 'm', 'i')], text: 'The three primary chords of a minor key. The V is major, borrowed from the harmonic minor, so it pulls home.' },
    { id: 'andalu', group: 'Minor keys', minor: true, name: 'i – ♭VII – ♭VI – V', bars: [X(0, 'm', 'i'), X(10, 'maj', '♭VII'), X(8, 'maj', '♭VI'), X(7, 'maj', 'V')], text: 'The falling bass of flamenco and a great deal of rock: three steps down, then the major V.' },
    { id: 'mpop', group: 'Minor keys', minor: true, name: 'i – ♭VI – ♭III – ♭VII', bars: [X(0, 'm', 'i'), X(8, 'maj', '♭VI'), X(3, 'maj', '♭III'), X(10, 'maj', '♭VII')], text: 'A minor-key loop built only from the natural minor scale.' },
    { id: 'borrow', group: 'Minor keys', name: 'I – IV – iv – I', bars: [[0], [3], X(5, 'm', 'iv'), [0]], text: 'The IV chord turns minor on its way home: a chord borrowed from the parallel minor.' },
    { id: 'm251', group: 'Jazz changes', minor: true, name: 'iiø7 – V7 – i7', bars: [X(2, 'm7b5', 'iiø7'), X(7, '7', 'V7'), X(0, 'm7', 'i7'), X(0, 'm7', 'i7')], text: 'The minor ii–V–i: half-diminished, dominant, minor.' },
    { id: 'turn6', group: 'Jazz changes', name: 'Imaj7 – VI7 – ii7 – V7', bars: [[0, 's'], X(9, '7', 'VI7'), [1, 's'], [4, 's']], text: 'The turnaround with its vi chord made dominant. VI7 is the V of ii, so every chord now pulls into the next.' },
    { id: 'three6', group: 'Jazz changes', name: 'iii7 – VI7 – ii7 – V7', bars: [[2, 's'], X(9, '7', 'VI7'), [1, 's'], [4, 's']], text: 'Two ii–Vs back to back, a whole step apart. The usual last two bars of a standard.' },
    { id: 'tritone', group: 'Jazz changes', name: 'ii7 – ♭II7 – Imaj7', bars: [[1, 's'], X(1, '7', '♭II7'), [0, 's'], [0, 's']], text: 'The V chord replaced by the dominant a tritone away. The guide tones are the same two notes; the bass slides down by half steps.' },
    { id: 'chain', group: 'Jazz changes', name: 'ii–V–I, then down a whole step', bars: [[1, 's'], [4, 's'], [0, 's'], [0, 's'], X(0, 'm7', 'i7'), X(5, '7', 'IV7'), X(10, 'maj7', '♭VIImaj7'), X(10, 'maj7', '♭VIImaj7')], text: 'Arrive on I, turn it minor, and it becomes the ii of a key a whole step lower.' },
    { id: 'jblues', group: 'Jazz changes', name: 'Jazz blues', bars: [[0, '7'], [3, '7'], [0, '7'], [0, '7'], [3, '7'], X(6, 'dim7', '♯IV°7'), [0, '7'], X(9, '7', 'VI7'), [1, 's'], [4, '7'], [0, '7'], [4, '7']], text: 'The twelve-bar blues as jazz players dress it: a diminished passing chord in bar 6 and a ii–V in bars 9 and 10.' },
    { id: 'cycle4', group: 'Jazz changes', name: 'Diatonic cycle of fourths', bars: [[0, 's'], [3, 's'], [6, 's'], [2, 's'], [5, 's'], [1, 's'], [4, 's'], [0, 's']], text: 'All seven seventh chords of the key, each root a fourth above the last. It ends with ii–V–I.' },
    { id: 'fast', group: 'Jazz changes', half: true, name: 'Turnaround, two beats a chord', bars: [[0, 's'], X(9, '7', 'VI7'), [1, 's'], [4, 's']], text: 'The same turnaround at working speed: each chord lasts two beats.' },
    { id: 'rhythm', group: 'Jazz changes', half: true, name: 'Rhythm changes, A section', bars: [[0, 's'], X(9, '7', 'VI7'), [1, 's'], [4, 's'], [2, 's'], X(9, '7', 'VI7'), [1, 's'], [4, 's'], X(7, 'm7', 'v7'), X(0, '7', 'I7'), [3, 's'], X(6, 'dim7', '♯IV°7'), [2, 's'], X(9, '7', 'VI7'), [1, 's'], [4, 's']], text: 'Eight bars, two chords to a bar: turnarounds end to end with a quick trip to the IV chord. One common version of the sequence behind hundreds of jazz tunes.' },
  ];
  T.progChords = (key, prog) => {
    const d = T.diatonic(key);
    return prog.bars.map((bar) => (Array.isArray(bar) ? bar : [bar])).map(([i, mode]) => (typeof i === 'object' ? { roman: i.r, chord: T.chord(i.o === 6 ? T.KEYS[mod(T.pc(key) + 6)] : T.spell(key, T.DEG[i.o]), i.q) } : { roman: mode === '7' ? d[i].roman.toUpperCase().replace('°', '') + '7' : mode === 's' ? d[i].roman.replace('°', 'ø') + (d[i].sev === 'maj7' ? 'maj7' : '7') : d[i].roman, chord: T.chord(d[i].root, mode === '7' ? '7' : mode === 's' ? d[i].sev : d[i].tri) }));
  };
  T.progGroups = () => { const out = []; T.PROGS.forEach((p) => { const g = p.group || 'Chord changes'; (out.find((x) => x[0] === g) || out[out.push([g, []]) - 1])[1].push(p); }); return out;
  };
  T.noteName = (pcv) => ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'][mod(pcv)];

  // ---------- keyboard pitches ----------
  T.KEY_LO = 28; T.KEY_HI = 100; // Rhodes Stage 73: E1 to E7
  T.midiName = (m) => T.noteName(m) + (Math.floor(m / 12) - 1); // 60 → C4
  T.parseNote = (s) => { // "E♭3" → 51
    const m = String(s).match(/^([A-G])([♭♯𝄫𝄪b#]*)(-?\d)$/);
    if (!m) return null;
    const acc = [...m[2]].reduce((a, c) => a + (ACC[c] || (c === 'b' ? -1 : 1)), 0);
    return LS[L.indexOf(m[1])] + acc + 12 * (+m[3] + 1);
  };

  // ---------- fingering ----------
  // Guitar: which fretting finger (1 index … 4 pinky) takes each string. 0 = open (or the capo), null = not played.
  // The lowest fret becomes a first-finger barre when the shape needs it; the rest go to the nearest free finger.
  T.guitarFingers = (frets, capo = 0) => {
    const fingers = frets.map((f) => (f === null ? null : 0));
    const fretted = [];
    frets.forEach((f, s) => { if (f !== null && f > capo) fretted.push({ s, f }); });
    if (!fretted.length) return { fingers, barre: null };
    fretted.sort((a, b) => a.f - b.f || a.s - b.s);
    const lo = fretted[0].f, atLo = fretted.filter((n) => n.f === lo);
    const openAbove = frets.some((f, s) => f !== null && f <= capo && s > atLo[0].s);
    let barre = null, rest = fretted, next = 1;
    if (atLo.length >= 2 && !openAbove && (fretted.length > 4 || atLo.length >= 3)) {
      barre = { finger: 1, fret: lo, from: atLo[0].s, to: atLo[atLo.length - 1].s };
      atLo.forEach((n) => { fingers[n.s] = 1; });
      rest = fretted.filter((n) => n.f !== lo); next = 2;
    }
    const free = 5 - next; // fingers left for `rest`
    if (rest.length > free) { // more notes than fingers: neighbours on one fret share a finger (a small barre)
      const groups = [];
      rest.forEach((n) => { const g = groups[groups.length - 1]; if (g && g[0].f === n.f && n.s - g[g.length - 1].s === 1) g.push(n); else groups.push([n]); });
      while (groups.length > free) { // still too many: merge the two closest groups on the same fret
        let k = groups.findIndex((g, i) => i && groups[i - 1][0].f === g[0].f);
        if (k < 1) k = groups.length - 1;
        groups[k - 1].push(...groups.splice(k, 1)[0]);
      }
      let prev = next - 1;
      groups.forEach((g, i) => { const f = Math.min(4 - (groups.length - 1 - i), Math.max(prev + 1, g[0].f - lo + 1)); g.forEach((n) => { fingers[n.s] = f; }); prev = f; });
      return { fingers, barre };
    }
    let last = next - 1;
    rest.forEach((n, i) => { // prefer one finger per fret, never reuse a finger, leave enough for the notes still to come
      const f = Math.min(4 - (rest.length - 1 - i), Math.max(last + 1, n.f - lo + 1));
      fingers[n.s] = f; last = f;
    });
    return { fingers, barre };
  };
  // Keyboard: fingers 1 (thumb) … 5 for the notes of one hand, lowest note first.
  // The standard chord fingerings, stated as rules on the gaps between notes (counted from the thumb outward):
  // three notes are 1-3-5, or 1-2-5 when the outer gap is a fourth or more; four notes are 1-2-3-5, or 1-2-4-5 when the top two are a step apart.
  T.handFingers = (midis, hand = 'R') => {
    const n = midis.length;
    if (!n) return [];
    const gaps = midis.slice(1).map((m, i) => m - midis[i]);
    const g = hand === 'L' ? gaps.slice().reverse() : gaps; // the left hand mirrors the right: thumb on the top note
    let f;
    if (n === 1) f = [hand === 'L' ? 5 : 1];
    else if (n === 2) f = [1, g[0] >= 7 ? 5 : g[0] >= 5 ? 4 : g[0] >= 3 ? 3 : 2];
    else if (n === 3) f = [1, g[1] <= 2 ? 4 : g[1] >= 5 && g[0] <= 4 ? 2 : 3, 5];
    else if (n === 4) f = [1, 2, g[2] <= 2 ? 4 : 3, 5];
    else f = midis.map((_, i) => Math.min(5, i + 1));
    if (n === 1) return f;
    return hand === 'L' ? f.reverse() : f;
  };
})();
