// Keyboard Atlas views: Chords, Scales and Circle as a pianist needs them. app.js calls these when Keys is the instrument.
(() => {
  'use strict';
  const G = window.G, T = G.T, Audio = G.Audio, esc = T.esc;
  const V = (G.KeyViews = {});
  const HAND = { L: 'Left', R: 'Right' };
  const lab = (A, n) => (A.state.labels === 'note' ? esc(n.note) : A.state.labels === 'finger' ? n.finger : esc(n.deg));
  const keyName = (n) => esc(n.note) + (Math.floor(n.midi / 12) - 1);

  function play(A, notes, gap = 0.012) {
    if (A.tooSoon() || !Audio.resume()) return;
    A.stopPlayback();
    const t0 = Audio.now() + 0.03;
    notes.slice().sort((a, b) => a.midi - b.midi).forEach((n, i) => { const at = t0 + i * gap; Audio.key(n.midi, at, 0.85); Audio.at(at, () => A.keys.pulse(n.midi)); });
    if (gap > 0.1) A.busyFor(notes.length * gap, true);
  }
  // a small flat keyboard with the voicing's keys marked, for the voicing list
  function mini(notes) {
    const ms = notes.map((n) => n.midi), lo = 12 * Math.floor(Math.min(...ms) / 12), octs = Math.max(2, Math.ceil((Math.max(...ms) + 1 - lo) / 12)), W = 5, H = 22;
    const WH = [0, 2, 4, 5, 7, 9, 11], BL = { 1: 1, 3: 2, 6: 4, 8: 5, 10: 6 };
    let s = `<svg class="mini-kb" viewBox="0 0 ${octs * 7 * W + 2} ${H + 2}" aria-hidden="true">`, dots = '';
    for (let o = 0; o < octs; o++) for (let i = 0; i < 7; i++) s += `<rect class="mk-w" x="${1 + (o * 7 + i) * W}" y="1" width="${W}" height="${H}"/>`;
    for (let o = 0; o < octs; o++) for (const b of [1, 2, 4, 5, 6]) s += `<rect class="mk-b" x="${1 + (o * 7 + b) * W - 1.6}" y="1" width="3.2" height="${H * 0.6}"/>`;
    notes.forEach((n) => {
      const rel = n.midi - lo, o = Math.floor(rel / 12), pc = rel % 12, white = WH.indexOf(pc);
      const cx = white >= 0 ? 1 + (o * 7 + white + 0.5) * W : 1 + (o * 7 + BL[pc]) * W, cy = white >= 0 ? H - 4 : H * 0.6 - 3.5;
      dots += `<circle class="f-${n.role}${n.hand === 'L' ? ' mk-l' : ''}" cx="${cx}" cy="${cy}" r="2.1"/>`;
    });
    return s + dots + '</svg>';
  }
  V.mini = mini;
  const handLine = (v, h) => v.notes.filter((n) => n.hand === h).map(keyName).join(' ') || '–';
  const fingerSentence = (v) => ['L', 'R'].map((h) => {
    const ns = v.notes.filter((n) => n.hand === h);
    return ns.length ? `${HAND[h]} hand: ${ns.map((n) => `<b>${n.finger}</b> on ${keyName(n)}`).join(', ')}.` : '';
  }).filter(Boolean).join(' ');
  const noteTable = (v) => '<table class="strings"><tr><th>Hand</th><th>Key</th><th>Finger</th><th>Degree</th></tr>' + v.notes.slice().reverse().map((n) =>
    `<tr><td>${HAND[n.hand]}</td><td><b>${keyName(n)}</b></td><td>${n.finger}</td><td><span class="deg ${n.role}-bg">${esc(n.deg)}</span></td></tr>`).join('') + '</table>';
  // the same notes on the neck, for anyone who has the guitar switched on beside the keys
  function neckFor(tones, midis) {
    const out = [], on = new Set(midis);
    for (let s = 0; s < 6; s++) for (let f = 0; f <= 15; f++) { const t = tones.find((x) => x.pc === T.mod(T.TUNING[s] + f)); if (t) out.push({ s, f, role: t.role, label: esc(t.deg), dim: !on.has(T.TUNING[s] + f) }); }
    return { notes: out };
  }
  const BASE = { 'Major 7': 'maj7', 'Dominant 7': '7', 'Minor 7': 'm7', 'Half-diminished': 'm7b5', 'Diminished 7': 'dim7', 'Minor-major 7': 'mMaj7', 'Augmented 7': '7' };
  // a chord from the guitar-only rootless library → the plain quality it is built on
  T.baseQuality = (root, id) => {
    if (!/^r\d+$/.test(id)) return T.QUALS.some((q) => q.id === id) ? id : 'maj7';
    const c = T.chord(root, id), b = BASE[c.family] || 'maj7';
    return b !== '7' ? b : c.suffix.includes('♯9') ? '7s9' : c.suffix.includes('♭9') ? '7b9' : c.suffix.includes('13') ? '13' : c.suffix.includes('9') ? '9' : '7';
  };

  const DESC = {
    close: ['Close position', 'Every note of the chord stacked in thirds, inside one hand span.', 'Root position is the reference shape. Every other voicing is these same notes rearranged.'],
    inv: ['Inversion', 'The same notes with a different one on the bottom.', 'Inversions let you reach the next chord without jumping: keep the notes two chords share and move the rest by step.'],
    lhroot: ['Two hands', 'The left hand plays the root as a bass note and the right hand plays the chord.', 'This is how most songs are accompanied. The left hand says where you are; the right hand says what kind of chord it is.'],
    shell: ['Shell', 'The left hand plays only two notes, and the right hand adds the rest above.', 'Root, 3rd and 7th are enough to name any seventh chord. The 5th adds almost nothing, so it is the first note to leave out.'],
    rootlessA: ['Rootless A', 'No root in the right hand: the bass player, or your left hand, supplies it.', 'A and B forms are the same four notes with the top two moved to the bottom. Alternate them through a ii–V–I and no finger moves more than a step.'],
    rootlessB: ['Rootless B', 'No root in the right hand: the bass player, or your left hand, supplies it.', 'A and B forms are the same four notes with the top two moved to the bottom. Alternate them through a ii–V–I and no finger moves more than a step.'],
    drop2: ['Drop-2', 'Take the close-position chord and drop its second note from the top an octave, into the left hand.', 'The wider spacing sounds fuller than a block chord, and the top note is free to be the melody.'],
  };

  V.chords = (A) => {
    const st = A.state, key = st.key;
    st.chords.id = T.baseQuality(key, st.chords.id);
    const list = T.QUALS.map((q) => ({ id: q.id, name: key + q.suf, cat: q.group })), ci = list.findIndex((x) => x.id === st.chords.id);
    const q = T.QUALS[ci], tones = T.tones(key, q.degs), vs = T.keyVoicings(key, q.id), name = key + q.suf;
    st.chords.vi = Math.max(0, Math.min(st.chords.vi, vs.length - 1)); st.chords.chart = false;
    const vi = st.chords.vi, v = vs[vi], cats = [...new Set(list.map((x) => x.cat))], inCat = list.filter((x) => x.cat === q.group), groups = [...new Set(vs.map((x) => x.group))];
    const d = DESC[v.kind], bottom = v.notes[0];
    const side = A.keysHTML() + `<div class="side-head"><span>Chords</span><small>${list.length}</small></div><div class="tree">` + cats.map((cat, k) => {
      const items = list.filter((x) => x.cat === cat), open = cat === q.group || A.openFolders.has('K' + cat);
      return `<div class="fam${open ? ' open' : ''}" data-fold="K${cat}"><button data-act="fold"><span class="chev">›</span>${A.folder(k)}<span>${cat}</span><small>${items.length}</small></button><ul>` +
        items.map((x) => `<li><button data-act="chord" data-id="${x.id}" class="${x.id === q.id ? 'on' : ''}">${esc(x.name)}</button></li>`).join('') + '</ul></div>';
    }).join('') + '</div>';
    let n = 0;
    A.ui({
      side, crumbs: `${key} · ${q.group} / Chord ${inCat.findIndex((x) => x.id === q.id) + 1} of ${inCat.length}`, title: esc(name), chips: A.chipsHTML(tones), lede: `${q.name}. ${vs.length} ways to play it on the keyboard.`,
      tiles: A.tilesHTML([['Left hand', handLine(v, 'L')], ['Right hand', handLine(v, 'R')], ['Bottom note', `${esc(bottom.deg)} · ${esc(bottom.note)}`]].concat(v.as ? [['Sounds as', esc(v.as)]] : [])),
      actions: `<button class="btn" data-act="play">▶ Play</button><button class="btn" data-act="alt">♪ Arpeggio</button>`,
      railHead: `<span>Voicings of ${esc(name)}</span><small>${vi + 1} of ${vs.length}</small>`,
      rail: groups.map((g) => `<div class="group-label"><b>${g}</b></div><div class="thumbs">${vs.filter((x) => x.group === g).map((x) => { const i = vs.indexOf(x); return `<button class="thumb kthumb${i === vi ? ' on' : ''}" data-act="voicing" data-i="${i}"><span class="num">${++n}</span>${mini(x.notes)}<span class="cap">${x.name.replace(/ \(.*/, '')}</span><span class="cap2">${x.notes.map((t) => esc(t.note)).join(' ')}</span></button>`; }).join('')}</div>`).join(''),
      panel: A.stepCard({ no: `Voicing ${vi + 1} / ${vs.length}`, tag: d[0], title: v.name,
        body: `<p>${d[1]}${v.kind === 'inv' ? ` Here the ${T.ordinal(bottom.deg)} is lowest.` : ''}${v.as ? ` The added notes turn ${esc(name)} into <b>${esc(v.as)}</b>, which is how players usually voice it.` : ''}</p><p class="fingers"><b>Suggested fingering.</b> ${fingerSentence(v)}</p>`,
        idea: d[2], more: noteTable(v) + A.navHTML(vi === 0 && ci === 0, vi === vs.length - 1 && ci === list.length - 1, vi === vs.length - 1 && ci < list.length - 1 ? `Next: ${esc(list[ci + 1].name)} →` : 'Next →'),
        hint: '<kbd>←</kbd><kbd>→</kbd> voicing · <kbd>↑</kbd><kbd>↓</kbd> chord · <kbd>Space</kbd> play' }) + A.insightCard(key, q.id),
    });
    A.neck.show(neckFor(tones, v.notes.map((x) => x.midi)), { notes: v.notes.map((x) => ({ midi: x.midi, label: lab(A, x), role: x.role, hand: x.hand })) });
    const first = (r, i) => T.keyVoicings(r, i).find((x) => x.kind === v.kind) || T.keyVoicings(r, i)[0];
    A.setCur({ play: () => play(A, v.notes), alt: () => play(A, v.notes, 0.24),
      hear: (r, i) => { const t = first(r, i).notes; play(A, v.notes); Audio.at(Audio.now() + 1.0, () => { A.keys.show({ notes: t.map((x) => ({ midi: x.midi, label: esc(x.deg), role: x.role, hand: x.hand })) }); A.untooSoon(); play(A, t); }); },
      next: () => (vi < vs.length - 1 ? A.go({ chords: { vi: vi + 1 } }) : ci < list.length - 1 && A.go({ chords: { id: list[ci + 1].id, vi: 0 } })),
      prev: () => (vi > 0 ? A.go({ chords: { vi: vi - 1 } }) : ci > 0 && A.go({ chords: { id: list[ci - 1].id, vi: 1e3 } })),
      down: () => ci < list.length - 1 && A.go({ chords: { id: list[ci + 1].id, vi: 0 } }), up: () => ci > 0 && A.go({ chords: { id: list[ci - 1].id, vi: 0 } }) });
  };

  const KBLURB = { minpent: 'Five notes with no half steps. In E♭ minor it is simply the five black keys.', phrygian: 'Minor with a flat 2nd, a half step above the root. Spanish and metal colour.' };
  V.scales = (A) => {
    const st = A.state, sc = T.scale(st.key, st.scales.id), rp = T.pc(st.key), octs = st.scales.oct === 2 ? 2 : 1, hand = st.scales.hand === 'L' ? 'L' : 'R';
    const start = (hand === 'L' ? 48 : 60) + (rp <= 5 ? rp : rp - 12), sem = sc.tones.map((t) => T.mod(t.pc - rp));
    const run = [];
    for (let o = 0; o < octs; o++) sc.tones.forEach((t, i) => run.push({ midi: start + 12 * o + sem[i], tone: t }));
    run.push({ midi: start + 12 * octs, tone: sc.tones[0] });
    const fing = T.keyFingering(st.key, sc.id), fingers = fing && sc.tones.length === 7 ? T.fingerOctaves(hand === 'L' ? fing.lh : fing.rh, octs, hand) : null;
    const chords = A.scaleChords(sc), chi = chords.length ? Math.min(st.scales.chord, chords.length - 1) : -1, chord = chi >= 0 ? chords[chi] : null;
    const inChord = (n) => !chord || chord.degs.includes(n.tone.deg);
    const label = (n, i) => (st.labels === 'finger' && fingers ? fingers[i] : st.labels === 'note' ? esc(n.tone.note) : esc(n.tone.deg));
    const groups = [...new Set(T.SCALES.map((x) => x.group))], blurb = KBLURB[sc.id] || sc.def.blurb;
    const parent = T.PARENT[sc.id] != null ? T.KEYS[T.mod(rp - T.PARENT[sc.id])] : null;
    const side = A.keysHTML() + `<div class="side-head"><span>Scales</span><small>${T.SCALES.length}</small></div><div class="tree always">` + groups.map((g, k) =>
      `<div class="fam open"><button disabled>${A.folder(k + 2)}<span>${g}</span></button><ul>${T.SCALES.filter((x) => x.group === g).map((x) => `<li><button data-act="scale" data-id="${x.id}" class="${x.id === sc.id ? 'on' : ''}">${x.name}</button></li>`).join('')}</ul></div>`).join('') + '</div>';
    const fRow = (h) => (fing && sc.tones.length === 7 ? fing[h].join(' ') : '–');
    const drillNotes = run.filter(inChord);
    A.ui({
      side, crumbs: `${st.key} · ${sc.def.group}`, title: `${st.key} ${sc.def.name}`, chips: A.chipsHTML(sc.tones), lede: blurb,
      tiles: A.tilesHTML([['Steps', T.stepFormula(sc)], ['Right hand', fRow('rh')], ['Left hand', fRow('lh')]].concat(chord ? [['Chord', `${chord.roman} · ${chord.name}`]] : [])),
      actions: `<button class="btn" data-act="drill">▶ Play</button>`,
      railHead: `<span>Range, hand and drill</span><small>${fingers ? 'standard fingering' : 'notes only'}</small>`,
      rail: `<div class="thumbs"><button class="posbtn${octs === 1 ? ' on' : ''}" data-act="soct" data-i="1">One octave</button><button class="posbtn${octs === 2 ? ' on' : ''}" data-act="soct" data-i="2">Two octaves</button>
          <button class="posbtn${hand === 'R' ? ' on' : ''}" data-act="shand" data-h="R">Right hand<small>from ${T.midiName(60 + (rp <= 5 ? rp : rp - 12))}</small></button><button class="posbtn${hand === 'L' ? ' on' : ''}" data-act="shand" data-h="L">Left hand<small>an octave lower</small></button></div>` +
        (chords.length ? `<div class="group-label"><b>Chords inside this scale</b> · pick one and its notes stay lit. Play then runs its arpeggio.</div>
          <div class="thumbs"><button class="posbtn${!chord ? ' on' : ''}" data-act="schord" data-i="-1">Whole scale</button>${chords.map((c, k) => `<button class="posbtn${k === chi ? ' on' : ''}" data-act="schord" data-i="${k}">${c.name}<small>${c.roman}</small></button>`).join('')}</div>` : '') +
        `<div class="drillbar"><label>Pattern <select data-change="pattern">${T.PATTERNS.map(([id, nm]) => `<option value="${id}"${id === st.scales.pattern ? ' selected' : ''}>${nm}</option>`).join('')}</select></label><label>Speed ${A.rateSelect(st.scales.rate)}</label><span class="muted">Play runs the pattern in time with the metronome at the top.</span></div>`,
      panel: A.stepCard({ no: sc.def.group, tag: `${sc.tones.length} notes`, title: chord ? `${chord.name} inside ${st.key} ${sc.def.name.toLowerCase()}` : `${st.key} ${sc.def.name}`,
        body: chord ? `<p>${chord.roman} is built from scale notes ${chord.degs.map(esc).join(', ')}: <b>${chord.tones.map((t) => esc(t.note)).join(' ')}</b>. The dimmed pegs are the rest of the scale.</p><p>Play the arpeggio, then the whole scale, and hear how the chord tones sound like resting points.</p>`
          : `<p>${blurb}</p><p>Formula: <b>${sc.tones.map((t) => esc(t.deg)).join(' ')}</b>. Use it over ${sc.def.over}.</p>` +
            (fingers ? `<p class="fingers"><b>Fingering.</b> Right hand ${fing.rh.join(' ')}, left hand ${fing.lh.join(' ')}, one octave up. Set peg labels to “Fingers” in ⚙ to see them on the keys.</p>`
              : parent && sc.id !== 'minor' ? `<p class="fingers"><b>Fingering.</b> ${st.key} ${sc.def.name.toLowerCase()} has the same notes as <b>${parent} major</b>. Start from that scale’s fingering and begin on ${st.key}.</p>` : `<p class="fingers"><b>Fingering.</b> No single standard fingering here; keep the thumb off the black keys where you can.</p>`),
        idea: chord ? 'When this chord is sounding, aim your phrases at its lit notes. The dimmed notes are how you travel between them.' : fingers ? 'The thumb passes under after finger 3 or 4 so the hand never runs out of fingers. Practise that one motion slowly and every scale gets easier.' : 'Find the root keys first, then notice which black keys the scale uses. That pattern of black and white is the shape to remember.',
        more: `<table class="strings"><tr><th>Degree</th><th>Note</th><th>From the root</th></tr>${sc.tones.map((t) => `<tr class="${chord && !chord.degs.includes(t.deg) ? 'mute' : ''}"><td><span class="deg ${t.role}-bg">${esc(t.deg)}</span></td><td>${esc(t.note)}</td><td>${T.mod(t.pc - rp)} half steps</td></tr>`).join('')}</table>` + A.navHTML(true, true),
        hint: '<kbd>Space</kbd> play or stop · <kbd>M</kbd> metronome' }),
    });
    const on = new Set(run.filter(inChord).map((n) => n.midi));
    A.neck.show(neckFor(sc.tones, [...on]), { notes: run.map((n, i) => ({ midi: n.midi, label: label(n, i), role: n.tone.role, dim: !inChord(n), hand })) });
    const toggle = () => {
      if (A.drill.off) return A.stopDrill();
      const seq = T.pattern(drillNotes.length, st.scales.pattern).map((k) => drillNotes[k]);
      A.startDrill(st.scales.rate, (i, time) => { const n = seq[i % seq.length]; Audio.key(n.midi, time, 0.85); Audio.at(time, () => A.drill.off && A.keys.setActive(n.midi)); });
    };
    A.setCur({ play: toggle, drill: toggle });
  };

  V.circle = (A) => {
    const st = A.state, sel = T.CIRCLE.indexOf(st.key), dia = T.diatonic(st.key), sev = st.circle.sev, ci = st.circle.ci, d = dia[ci], id = sev ? d.sev : d.tri;
    const sc = T.scale(st.key, 'major'), sig = T.signature(st.key), kroot = T.KEYS[T.pc(d.root)];
    const voicing = (x) => { const r = T.KEYS[T.pc(x.root)], vs = T.keyVoicings(r, sev ? x.sev : x.tri); return vs.find((v) => v.kind === 'lhroot') || Object.assign({}, vs[0], { notes: vs[0].notes }); };
    const v = voicing(d), q = T.QUALS.find((x) => x.id === id), name = d.root + q.suf;
    A.ui({
      side: `<div class="side-head"><span>How to read it</span></div><ul class="plain-list">
        <li><b>Clockwise</b> goes up a fifth and adds one sharp.</li><li><b>Anticlockwise</b> goes up a fourth and adds one flat.</li>
        <li>The <b>outer ring</b> is major keys. The <b>inner ring</b> is each one’s relative minor.</li>
        <li>The keys either side of yours are its <b>IV</b> and <b>V</b> chords.</li>
        <li>Each sharp or flat in the signature is one more <b>black key</b> in the scale.</li></ul>`,
      crumbs: 'Circle of fifths', title: `Key of ${st.key} major`, chips: A.chipsHTML(sc.tones), lede: `${sig[0].toUpperCase() + sig.slice(1)}. Relative minor: ${esc(dia[5].root)} minor. Click any key on the circle.`,
      tiles: A.tilesHTML([['Signature', sig], ['IV · I · V', `${esc(dia[3].root)} · ${st.key} · ${esc(dia[4].root)}`], ['Relative minor', esc(dia[5].root) + 'm']]),
      actions: `<button class="btn" data-act="play">▶ Play</button><button class="btn" data-act="sev">${sev ? 'Show triads' : 'Show 7th chords'}</button>`,
      extra: `<div class="circle-wrap">${A.circleSVG(sel)}</div>`,
      railHead: `<span>The seven chords of ${st.key} major</span><small>${sev ? 'seventh chords' : 'triads'}</small>`,
      rail: `<div class="thumbs">${dia.map((x, k) => { const vv = voicing(x), qq = T.QUALS.find((z) => z.id === (sev ? x.sev : x.tri)); return `<button class="thumb kthumb${k === ci ? ' on' : ''}" data-act="dia" data-i="${k}">${mini(vv.notes)}<span class="cap">${x.roman} · ${esc(x.root + qq.suf)}</span><span class="cap2">${vv.notes.filter((t) => t.hand === 'R').map((t) => esc(t.note)).join(' ')}</span></button>`; }).join('')}</div>`,
      panel: A.stepCard({ no: `Chord ${ci + 1} / 7`, tag: d.fn, title: `${d.roman}: ${esc(name)}`, body: `<p>${A.FN_TEXT[d.fn]}</p><p>Built on note ${ci + 1} of the ${st.key} major scale, using only notes from that scale: play every other white-or-black key of the scale, starting there.</p><p class="fingers"><b>Suggested fingering.</b> ${fingerSentence(v)}</p>`,
        idea: 'Every major key has the same pattern of chords: I ii iii IV V vi vii°. Learn it once as numerals and it works in all twelve keys.',
        more: noteTable(v) + `<div class="nav"><button class="btn ghost" data-act="prev" ${ci === 0 ? 'disabled' : ''}>←</button><button class="btn primary" data-act="open-chord" data-root="${kroot}" data-id="${id}">All ${esc(name)} voicings</button><button class="btn ghost" data-act="next" ${ci === 6 ? 'disabled' : ''}>→</button></div>` }) + A.insightCard(kroot, id),
    });
    A.neck.show(neckFor(T.tones(kroot, q.degs), v.notes.map((x) => x.midi)), { notes: v.notes.map((x) => ({ midi: x.midi, label: lab(A, x), role: x.role, hand: x.hand })) });
    A.setCur({ play: () => play(A, v.notes), next: () => ci < 6 && A.go({ circle: { ci: ci + 1 } }), prev: () => ci > 0 && A.go({ circle: { ci: ci - 1 } }),
      hear: (r, i) => { const t = (T.keyVoicings(r, i).find((x) => x.kind === 'lhroot') || T.keyVoicings(r, i)[0]).notes; play(A, v.notes); Audio.at(Audio.now() + 1.0, () => { A.untooSoon(); play(A, t); }); } });
  };

})();
