// Practice at the keyboard: warm-ups that run in time, chord changes in two-hand voicings, and three keyboard drills.
// app.js calls G.KeyViews.practice when Keys is the instrument, exactly as it does for Chords, Scales and Circle.
(() => {
  'use strict';
  const G = window.G, T = G.T, Audio = G.Audio, V = G.KeyViews, esc = T.esc;
  if (!V) return;
  const WARM = [
    { id: 'kfive', name: 'Five-finger pattern', text: 'The first five notes of the scale, up and back, one finger per key. Both hands play the same notes an octave apart.',
      tip: 'Let each finger fall from the knuckle and release the key before the next one goes down. Even sound matters more than speed.' },
    { id: 'kscale', name: 'One-octave scale', text: 'The major scale up and back with the standard fingering, right hand alone.',
      tip: 'The thumb passes under after finger 3 on the way up, and finger 3 crosses over the thumb on the way down. Keep the wrist level while it happens.' },
    { id: 'karp', name: 'Triad arpeggio', text: 'Root, 3rd, 5th and the root above, up and back. The hand opens to span the octave.',
      tip: 'Rotate the forearm slightly toward each note instead of stretching the fingers flat. The hand stays loose.' },
  ];
  const DRILLS = [
    { id: 'kname', name: 'Name that key', title: 'Which key is it?', lede: 'One key lights up. Pick its name, and say it out loud as you answer.',
      body: 'Read the keyboard from its black keys: every group of two black keys has C just to its left, and every group of three has F.',
      idea: 'You are not counting up from C. You are recognising where a key sits against the nearest group of black keys.',
      tips: ['C, D and E surround the two black keys.', 'F, G, A and B surround the three black keys.', 'A black key takes its name from its neighbour: the one right of C is C♯ or D♭.'] },
    { id: 'kfind', name: 'Find the note', title: 'Find it on the keys', lede: 'You are given a note name. Tap any key with that name.',
      body: 'The same seven letters repeat in every octave, so there are several right answers. Find the nearest one, then find another.',
      idea: 'Knowing a note in one octave is not enough. Aim to see every C, every F♯, at a glance.',
      tips: ['Find the black-key group first, then the note beside it.', 'Tap a key at any time to hear it.', 'Say the note name before you tap.'] },
    { id: 'kiv', name: 'Name the interval', title: 'How far apart?', lede: 'Two keys light up and sound. Pick the distance between them.',
      body: 'Count the half steps from the lower key to the upper one, black keys included, then learn to recognise the sound without counting.',
      idea: 'Chords are stacks of intervals. Hear a major 3rd and a minor 3rd apart and you can hear major from minor.',
      tips: ['Minor 3rd: 3 half steps. Major 3rd: 4.', '4th: 5 half steps. 5th: 7.', 'Hear it again as often as you like before answering.'] },
  ];
  const IV = { 1: 'minor 2nd', 2: 'major 2nd', 3: 'minor 3rd', 4: 'major 3rd', 5: '4th', 6: 'tritone', 7: '5th', 8: 'minor 6th', 9: 'major 6th', 10: 'minor 7th', 11: 'major 7th', 12: 'octave' };
  const IV_LEVELS = [[3, 4, 5, 7, 12], [2, 3, 4, 5, 7, 9, 12], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]], IV_NAMES = ['3rds, 4th, 5th, octave', 'Common intervals', 'All twelve intervals'];
  const NAT = [0, 2, 4, 5, 7, 9, 11], NOTE_LEVELS = ['White keys', 'All twelve keys'];
  const KD = G.KeyDrills || { list: [], byId: {}, forLesson: () => [] };
  const IDS = WARM.map((w) => w.id).concat(DRILLS.map((d) => d.id), KD.list.map((d) => d.id));
  const best = (id) => { try { return +JSON.parse(localStorage.getItem('fa.best-' + id)) || 0; } catch (e) { return 0; } };
  const saveBest = (id, n) => { try { localStorage.setItem('fa.best-' + id, JSON.stringify(n)); } catch (e) { /* storage unavailable */ } };
  const rnd = (list, not) => { let x; do x = list[Math.floor(Math.random() * list.length)]; while (list.length > 1 && x === not); return x; };
  let quiz = null, ctx = null;

  const side = (A, id) => {
    const item = (pid, name) => `<li><button data-act="practice" data-id="${pid}" class="${pid === id ? 'on' : ''}">${name}</button></li>`;
    const secs = sections(), n = secs.reduce((a, s) => a + s[1].length, 0);
    return `<div class="side-head"><span>Practice</span><small>${n} drills</small></div><div class="tree always">` + secs.map(([g, items], gi) => {
      const open = items.some((x) => x[0] === id) || A.openFolders.has('K' + g);
      return `<div class="fam${open ? ' open' : ''}" data-fold="K${g}"><button data-act="fold"><span class="chev">›</span>${A.folder(gi + 1)}<span>${String(gi + 1).padStart(2, '0')}. ${g}</span><small>${items.length}</small></button><ul>${items.map((x) => item(x[0], x[1])).join('')}</ul></div>`;
    }).join('') + '</div>';
  };
  // everything in keyboard Practice, filed under the lesson sections: [section, [[id, name], ...]]
  const sections = () => {
    const lib = (g) => KD.list.filter((d) => d.group === g).map((d) => [d.id, d.name]), pg = (g) => T.PROGS.filter((p) => (p.group || 'Chord changes') === g).map((p) => [p.id, p.name]);
    return [
      ['Technique', WARM.map((w) => [w.id, w.name]).concat(lib('Technique'))],
      ['Foundations', DRILLS.map((d) => [d.id, d.name]).concat(lib('Foundations'))],
      ['Chords', lib('Chords').concat(pg('Chord changes'), pg('Minor keys'))],
      ['Scales & keys', lib('Scales & keys')],
      ['Jazz', pg('Jazz changes').concat(lib('Jazz'))],
    ];
  };
  V.practiceName = (id) => { for (const s of sections()) { const x = s[1].find((y) => y[0] === id); if (x) return x[1]; } return ''; };
  V.lessonDrills = (lessonId) => [...new Set(KD.forLesson(lessonId))].map((d) => [d, V.practiceName(d)]).filter((x) => x[1]);

  // ---------- the keyboard drill library (js/keydrills.js) ----------
  function libDrill(A, d) {
    const st = A.state, p = st.practice, Metro = G.Metro, nv = (d.vars || []).length, vi = Math.max(0, Math.min(nv - 1, (p.vars || {})[d.id] | 0));
    const made = d.make({ key: st.key, v: vi }), evs = Array.isArray(made) ? made : made.ev, swing = !Array.isArray(made) && made.swing;
    const lab = (n) => (st.labels === 'note' ? esc(n.note) : n.finger != null && n.finger !== '' && (d.group === 'Technique' || st.labels === 'finger') ? n.finger : esc(n.label));
    let t = 0, key = null; const fk = evs.find((e) => e.g != null || e.name) || {}, kOf = (e) => (e.g != null ? 'g' + e.g : e.name ? 'n' + e.name : null);
    const segs = [], tl = evs.map((e) => { const k = kOf(e) || (key == null ? kOf(fk) || '' : key); key = k; const o = Object.assign({ t, k }, e); t += e.d; return o; });
    const len = Math.max(1, Math.ceil(t - 1e-6));
    tl.forEach((e) => { let sg = segs.find((x) => x.k === e.k); if (!sg) segs.push((sg = { k: e.k, name: '', notes: [] })); e.seg = sg; if (e.name) sg.name = e.name; (e.n || []).forEach((n) => { if (!sg.notes.some((m) => m.midi === n.midi)) sg.notes.push({ midi: n.midi, label: lab(n), role: n.role, hand: n.hand }); }); });
    const first = tl.length ? tl[0].seg : { notes: [], name: '' }, from = d.from.map((id) => (G.KEYLESSONS || []).find((l) => l.id === id)).filter(Boolean);
    A.ui({
      side: A.keysHTML() + side(A, d.id), crumbs: 'Practice / ' + d.group, title: `${d.name} in ${st.key}`, chips: A.pill(d.level) + A.pill(len + ' beats') + (swing ? A.pill('swung') : ''), lede: d.text,
      tiles: A.tilesHTML([['Now', `<span id="drillNow">${esc(first.name || (nv ? d.vars[vi] : st.key + ' major'))}</span>`], ['Start at', d.tempo[0] + ' BPM'], ['Aim for', d.tempo[1] + ' BPM']]),
      actions: '<button class="btn" data-act="drill">▶ Play</button>',
      railHead: '<span>This drill</span><small>' + d.group + '</small>',
      rail: (nv ? `<div class="drillbar"><label>Variation <select data-change="dvar" aria-label="Variation">${d.vars.map((nm, k) => `<option value="${k}"${k === vi ? ' selected' : ''}>${esc(nm)}</option>`).join('')}</select></label></div>` : '') +
        `<p class="muted">Start at ${d.tempo[0]} beats a minute. When three passes in a row are even and relaxed, add four. The target is ${d.tempo[1]}. Pick the key in the list.</p>` +
        (from.length ? `<p class="muted">It goes with ${from.length > 1 ? 'these lessons' : 'this lesson'}:</p><p>${from.map((l) => `<button class="ins-link" data-act="goto" data-h="#k-learn-${l.id}-1">${l.title}</button>`).join(' ')}</p>` : ''),
      panel: A.stepCard({ no: 'Drill', tag: d.group, title: d.name, body: `<p>${d.text}</p>`, idea: d.tip, more: '<ul class="plain-list"><li>Play along at your own keyboard. The app keeps time and lights the keys.</li><li>Hands separately first, then together.</li><li>Stop if anything aches.</li></ul>', hint: '<kbd>Space</kbd> play or stop · <kbd>M</kbd> metronome' }),
    });
    show(A, first.notes);
    let shown = first;
    const toggle = () => {
      if (A.drill.off) return A.stopDrill();
      A.startDrill(Metro.TPB, (i, time) => {
        const b = i % len, beat = 60 / Metro.bpm;
        tl.forEach((e) => {
          if (e.t < b - 1e-6 || e.t >= b + 1 - 1e-6) return;
          let off = e.t - b; if (swing && Math.abs(off - 0.5) < 1e-6) off = 2 / 3;
          const when = time + off * beat;
          if (e.seg !== shown) { const sg = e.seg; shown = sg; Audio.at(when - 0.03, () => { if (!A.drill.off) return; show(A, sg.notes); const el = document.getElementById('drillNow'); if (el && sg.name) el.textContent = sg.name; }); }
          (e.n || []).forEach((n, k) => { Audio.key(n.midi, when, (e.vel || 0.85) * (n.hand === 'L' ? 0.85 : 1)); Audio.at(when, () => A.drill.off && (k || e.n.length > 1 ? A.keys.pulse(n.midi) : A.keys.setActive(n.midi))); });
        });
      });
    };
    A.setCur({ play: toggle, drill: toggle });
  }
  const show = (A, notes) => A.neck.show({ notes: [] }, { notes });
  const voicingOf = (root, id) => { const vs = T.keyVoicings(root, T.baseQuality(root, id)); return vs && vs[0]; };

  function warmup(A, w) {
    const st = A.state, p = st.practice, sc = T.scale(st.key, 'major'), rp = T.pc(st.key), base = 60 + (rp <= 5 ? rp : rp - 12), sem = sc.tones.map((t) => T.mod(t.pc - rp));
    let seq = [], shown = [], chips = '';
    const tone = (i) => sc.tones[i % 7], lab = (n) => (st.labels === 'note' ? esc(n.tone.note) : n.finger);
    if (w.id === 'kfive') {
      const up = [0, 1, 2, 3, 4].map((i) => ({ midi: base + sem[i], tone: tone(i), finger: i + 1, hand: 'R', pair: { midi: base - 12 + sem[i], finger: 5 - i } }));
      seq = up.concat([up[3], up[2], up[1]]);
      shown = up.map((n) => ({ midi: n.midi, label: lab(n), role: n.tone.role, hand: 'R' })).concat(up.map((n) => ({ midi: n.pair.midi, label: st.labels === 'note' ? esc(n.tone.note) : n.pair.finger, role: n.tone.role, hand: 'L' })));
      chips = A.pill('Both hands') + A.pill('2 to 5 minutes');
    } else if (w.id === 'kscale') {
      const fing = T.keyFingering(st.key, 'major'), fs = fing ? T.fingerOctaves(fing.rh, 1, 'R') : [1, 2, 3, 1, 2, 3, 4, 5];
      const up = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ midi: base + (i === 7 ? 12 : sem[i]), tone: tone(i), finger: fs[i], hand: 'R' }));
      seq = up.concat(up.slice(1, 7).reverse());
      shown = up.map((n) => ({ midi: n.midi, label: lab(n), role: n.tone.role, hand: 'R' }));
      chips = A.pill('Right hand') + A.pill('2 to 5 minutes');
    } else {
      const fs = [1, 2, 3, 5], up = [0, 2, 4, 7].map((i, k) => ({ midi: base + (i === 7 ? 12 : sem[i]), tone: tone(i), finger: fs[k], hand: 'R' }));
      seq = up.concat([up[2], up[1]]);
      shown = up.map((n) => ({ midi: n.midi, label: lab(n), role: n.tone.role, hand: 'R' }));
      chips = A.pill('Right hand') + A.pill('2 to 5 minutes');
    }
    A.ui({
      side: A.keysHTML() + side(A, w.id), crumbs: 'Practice / Warm-ups', title: `${w.name} in ${st.key}`, chips, lede: w.text,
      tiles: A.tilesHTML([['Key', esc(st.key) + ' major'], ['Notes', seq.length], ['Fingers', shown.filter((n) => n.hand === 'R').map((n, i) => seq[i] ? seq[i].finger : '').join(' ')]]),
      actions: '<button class="btn" data-act="drill">▶ Play</button>',
      railHead: '<span>Settings</span>',
      rail: `<div class="drillbar"><label>Speed ${A.rateSelect(p.rate)}</label><span class="muted">Pegs show which finger to use: 1 is the thumb, 5 the little finger. Pick the key in the list; set the tempo with the metronome at the top.</span></div>`,
      panel: A.stepCard({ no: 'Warm-up', tag: 'Technique', title: w.name, body: `<p>${w.text}</p><p>Start around 60 BPM in eighth notes. Raise the tempo by 5 only when a full pass is even and relaxed.</p>`, idea: w.tip,
        more: '<ul class="plain-list"><li>Sit so your forearms are level with the keys.</li><li>Curve the fingers as if holding a small ball.</li><li>Stop if anything aches. Warm-ups should feel easy.</li></ul>', hint: '<kbd>Space</kbd> play or stop · <kbd>M</kbd> metronome' }),
    });
    show(A, shown);
    const toggle = () => {
      if (A.drill.off) return A.stopDrill();
      A.startDrill(p.rate, (i, time) => { const n = seq[i % seq.length]; Audio.key(n.midi, time, 0.85); if (n.pair) Audio.key(n.pair.midi, time, 0.7); Audio.at(time, () => A.drill.off && A.keys.setActive(n.midi)); });
    };
    A.setCur({ play: toggle, drill: toggle });
  }

  function changes(A, prog) {
    const st = A.state, p = st.practice, bars = T.progChords(st.key, prog).map((b) => ({ roman: b.roman, root: b.chord.root, id: b.chord.id, v: voicingOf(b.chord.root, b.chord.id) })).filter((b) => b.v);
    if (!bars.length) return warmup(A, WARM[0]);
    p.bar = Math.min(p.bar, bars.length - 1);
    const name = (b) => esc(b.root + ((T.QUALS.find((q) => q.id === T.baseQuality(b.root, b.id)) || {}).suf || ''));
    const notesOf = (b) => b.v.notes.map((n) => ({ midi: n.midi, label: st.labels === 'note' ? esc(n.note) : st.labels === 'finger' ? n.finger : esc(n.deg), role: n.role, hand: n.hand }));
    const b = bars[p.bar], Metro = G.Metro;
    A.ui({
      side: A.keysHTML() + side(A, prog.id), crumbs: 'Practice / Chord changes', title: `${prog.name} in ${st.key}${prog.minor ? " minor" : ""}`, chips: A.pill(`${bars.length} bars`) + A.pill('one chord per bar'), lede: prog.text,
      tiles: A.tilesHTML([['Now', `${b.roman} · ${name(b)}`], ['Next', name(bars[(p.bar + 1) % bars.length])], ['Tempo', Metro.bpm + ' BPM']]),
      actions: '<button class="btn" data-act="drill">▶ Play</button>',
      railHead: `<span>Progression</span><small>${bars.length} bars</small>`,
      rail: `<div class="thumbs">${bars.map((x, k) => `<button class="thumb kthumb${k === p.bar ? ' on' : ''}" data-kp="bar" data-i="${k}"><span class="num">${k + 1}</span>${V.mini ? V.mini(x.v.notes) : ''}<span class="cap">${x.roman} · ${name(x)}</span></button>`).join('')}</div>`,
      panel: A.stepCard({ no: 'Chord changes', tag: `${bars.length} bars`, title: prog.name, body: `<p>${prog.text}</p><p>Press Play. The chord changes on beat one of each bar and sounds on every beat. Left hand takes the low notes, right hand the rest.</p>`,
        idea: 'Move to the next chord in time even if a finger lands late. Keeping the beat matters more than a perfect chord.', more: A.navHTML(false, false), hint: '<kbd>Space</kbd> play or stop · <kbd>M</kbd> metronome' }),
    });
    show(A, notesOf(b));
    const sound = (x, time) => x.v.notes.forEach((n) => Audio.key(n.midi, time, 0.8));
    const paint = (k) => {
      p.bar = k; show(A, notesOf(bars[k]));
      document.querySelectorAll('#rail .thumb, .under-q .thumb').forEach((t) => t.classList.toggle('on', +t.dataset.i === k));
      const tiles = document.getElementById('tiles').children;
      if (tiles[0]) tiles[0].lastElementChild.innerHTML = `${bars[k].roman} · ${name(bars[k])}`;
      if (tiles[1]) tiles[1].lastElementChild.innerHTML = name(bars[(k + 1) % bars.length]);
    };
    const toggle = () => {
      if (A.drill.off) return A.stopDrill();
      A.startDrill(Metro.TPB, (i, time) => {
        const beat = i % Metro.beats, bar = Math.floor(i / Metro.beats) % bars.length;
        if (beat === 0) Audio.at(time - 0.03, () => A.drill.off && paint(bar));
        sound(bars[bar], time);
      });
    };
    ctx = { bar: (k) => { A.stopDrill(); paint(k); if (Audio.resume()) { sound(bars[k], Audio.now() + 0.02); bars[k].v.notes.forEach((n) => A.keys.pulse(n.midi)); } } };
    A.setCur({ play: toggle, drill: toggle, next: () => ctx.bar((p.bar + 1) % bars.length), prev: () => ctx.bar((p.bar + bars.length - 1) % bars.length) });
  }

  function ask(id, lv) {
    const prev = quiz && quiz.q;
    if (id === 'kname' || id === 'kfind') {
      const pcs = lv === 1 ? NAT : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], pc = rnd(pcs, prev && prev.pc);
      return { pc, midi: 48 + 12 * Math.floor(Math.random() * 2) + pc };
    }
    const iv = rnd(IV_LEVELS[lv - 1], prev && prev.iv), root = 55 + Math.floor(Math.random() * 10);
    return { iv, root, top: root + iv };
  }
  function drillPage(A, d) {
    const st = A.state, levels = d.id === 'kiv' ? IV_NAMES : NOTE_LEVELS;
    if (!quiz || quiz.id !== d.id) quiz = { id: d.id, lv: 1, score: 0, total: 0, streak: 0, best: best(d.id), done: false, ok: false, pick: null, q: null };
    quiz.lv = Math.max(1, Math.min(levels.length, quiz.lv));
    if (!quiz.q) quiz.q = ask(d.id, quiz.lv);
    const q = quiz.q, nm = (pc) => esc(T.noteName(pc));
    const mark = (ok, pick) => {
      quiz.done = true; quiz.ok = ok; quiz.pick = pick; quiz.total++;
      if (ok) { quiz.score++; quiz.streak++; if (quiz.streak > quiz.best) { quiz.best = quiz.streak; saveBest(d.id, quiz.best); } } else quiz.streak = 0;
      A.go({});
    };
    const hear = d.id === 'kfind' ? null : () => {
      if (!Audio.resume()) return;
      const t = Audio.now() + 0.03;
      if (d.id === 'kname') { Audio.key(q.midi, t, 0.9); A.keys.pulse(q.midi); }
      else { Audio.key(q.root, t, 0.85); Audio.key(q.top, t + 0.5, 0.85); Audio.key(q.root, t + 1.1, 0.7); Audio.key(q.top, t + 1.1, 0.7); A.keys.pulse(q.root); Audio.at(t + 0.5, () => A.keys.pulse(q.top)); }
    };
    let prompt, answers = '', notes = [];
    const btn = (val, label, right) => `<button class="posbtn ans${quiz.done && right ? ' good' : quiz.done && quiz.pick === val ? ' bad' : ''}" data-kp="answer" data-v="${val}" ${quiz.done ? 'disabled' : ''}>${label}</button>`;
    if (d.id === 'kname') {
      prompt = 'Which key is lit?';
      notes = [{ midi: q.midi, label: quiz.done ? nm(q.pc) : '?', role: quiz.done ? 'root' : 'fifth', hand: 'R' }];
      answers = (quiz.lv === 1 ? NAT : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]).map((pc) => btn(pc, nm(pc), pc === q.pc)).join('');
    } else if (d.id === 'kfind') {
      prompt = `Find ${nm(q.pc)}. Tap any key with that name.`;
      if (quiz.done) { const [lo, hi] = A.keys.window(); for (let m = lo; m <= hi; m++) if (T.mod(m) === q.pc) notes.push({ midi: m, label: nm(q.pc), role: 'root', hand: 'R' }); if (!quiz.ok && quiz.pick != null) notes.push({ midi: quiz.pick, label: nm(T.mod(quiz.pick)), role: 'guide', hand: 'R' }); }
    } else {
      prompt = 'How far apart are these two keys?';
      notes = [{ midi: q.root, label: nm(T.mod(q.root)), role: 'root', hand: 'R' }, { midi: q.top, label: quiz.done ? nm(T.mod(q.top)) : '?', role: quiz.done ? 'ext' : 'fifth', hand: 'R' }];
      answers = IV_LEVELS[quiz.lv - 1].map((iv) => btn(iv, IV[iv], iv === q.iv)).join('');
    }
    const verdict = quiz.done ? `<span class="verdict ${quiz.ok ? 'good' : 'bad'}">${quiz.ok ? 'Correct' : 'Not quite'}</span>` : '';
    const msg = quiz.done ? (d.id === 'kiv' ? `${nm(T.mod(q.root))} up to ${nm(T.mod(q.top))} is a <b>${IV[q.iv]}</b>: ${q.iv} half step${q.iv === 1 ? '' : 's'}.` : d.id === 'kname' ? `That key is <b>${nm(q.pc)}</b>.` : quiz.ok ? `Yes. Every ${nm(q.pc)} is marked.` : `That was ${nm(T.mod(quiz.pick))}. Every ${nm(q.pc)} is marked in gold.`) : '';
    const next = quiz.done ? '<button class="btn primary" data-act="next">Next ›</button>' : '<button class="btn ghost" data-kp="skip">Skip</button>';
    A.ui({
      side: side(A, d.id), crumbs: 'Practice / Keyboard', title: d.name, chips: A.pill(levels[quiz.lv - 1]), lede: d.lede,
      tiles: A.tilesHTML([['Score', `${quiz.score} / ${quiz.total}`], ['Streak', quiz.streak], ['Best streak', quiz.best]]),
      actions: `<div class="stepper"><span>Level</span><button data-kp="level" data-d="-1" aria-label="Easier">−</button><b>${quiz.lv}</b><button data-kp="level" data-d="1" aria-label="Harder">+</button></div>${hear ? '<button class="btn" data-act="play">▶ Hear it</button>' : ''}<button class="btn" data-kp="reset">↺ Reset score</button>`,
      railHead: `<span>Question ${quiz.total + (quiz.done ? 0 : 1)}</span>${verdict}`,
      rail: `<p class="prompt">${prompt}</p>${msg ? `<p class="muted">${msg}</p>` : ''}<div class="thumbs">${answers}${next}</div>`,
      panel: A.stepCard({ no: 'Exercise', tag: 'Keyboard', title: d.title, body: `<p>${d.body}</p>`, idea: d.idea, more: `<ul class="plain-list">${d.tips.map((t) => `<li>${t}</li>`).join('')}</ul>`, hint: '<kbd>→</kbd> next question' + (hear ? ' · <kbd>Space</kbd> hear it' : '') }),
    });
    show(A, notes);
    A.keys.setPick((midi) => {
      Audio.key(midi, 0, 0.9); A.keys.pulse(midi);
      if (d.id === 'kfind' && !quiz.done) mark(T.mod(midi) === q.pc, midi);
    });
    const fresh = () => { quiz.q = ask(d.id, quiz.lv); quiz.done = false; quiz.pick = null; A.go({}); };
    ctx = {
      answer: (v) => { if (!quiz.done) mark(d.id === 'kname' ? +v === q.pc : +v === q.iv, +v); },
      skip: () => fresh(),
      level: (dlt) => { const lv = Math.max(1, Math.min(levels.length, quiz.lv + dlt)); if (lv !== quiz.lv) { quiz.lv = lv; fresh(); } },
      reset: () => { quiz.score = quiz.total = quiz.streak = 0; A.go({}); },
    };
    A.setCur({ play: hear || undefined, ok: (a) => a !== 'next' || quiz.done, next: () => { if (quiz.done) { fresh(); if (hear && G.App && G.App.can('play')) setTimeout(() => document.querySelector('#actions [data-act="play"]') && document.querySelector('#actions [data-act="play"]').click(), 60); } } });
  }

  V.practice = (A) => {
    const p = A.state.practice;
    ctx = null;
    const prog = T.PROGS.find((x) => x.id === p.id);
    if (!prog && !IDS.includes(p.id)) p.id = WARM[0].id; // arriving from a guitar-only exercise
    const w = WARM.find((x) => x.id === p.id), d = DRILLS.find((x) => x.id === p.id), lib = KD.byId[p.id];
    if (lib) libDrill(A, lib); else if (w) warmup(A, w); else if (prog) changes(A, prog); else drillPage(A, d);
  };
  V.practiceIds = IDS;
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('[data-kp]');
    if (!b || b.disabled || !ctx) return;
    const k = b.dataset.kp;
    if (k === 'bar' && ctx.bar) ctx.bar(+b.dataset.i);
    else if (k === 'answer' && ctx.answer) ctx.answer(b.dataset.v);
    else if (k === 'skip' && ctx.skip) ctx.skip();
    else if (k === 'level' && ctx.level) ctx.level(+b.dataset.d);
    else if (k === 'reset' && ctx.reset) ctx.reset();
  });
})();
