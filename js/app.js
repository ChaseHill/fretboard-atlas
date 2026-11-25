(() => {
  'use strict';
  const { T, Audio, Metro, LESSONS } = window.G;
  const $ = (id) => document.getElementById(id);
  const esc = T.esc;
  const store = {
    get(k, d) { try { const v = localStorage.getItem('fa.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('fa.' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
  };
  const FAM_COLORS = ['#e0a84a', '#f2543a', '#168f9e', '#7b63c9', '#6f6f7a', '#c2596b', '#5a9a52', '#3f7fc4', '#b0803a', '#8a6fb0'];
  const folder = (i) => `<svg class="folder" viewBox="0 0 16 13"><path d="M1 2.5A1.5 1.5 0 0 1 2.5 1H6l1.6 2H13.5A1.5 1.5 0 0 1 15 4.5v6A1.5 1.5 0 0 1 13.5 12h-11A1.5 1.5 0 0 1 1 10.5Z" fill="${FAM_COLORS[i % FAM_COLORS.length]}" stroke="var(--ink)" stroke-width="1.1"/></svg>`;

  const state = {
    view: 'learn', key: 'C', capo: 0, inst: store.get('inst', 'guitar') === 'keys' ? 'keys' : 'guitar', both: store.get('pair', false) === true,
    labels: ['deg', 'note', 'finger'].includes(store.get('labels', 'deg')) ? store.get('labels', 'deg') : 'deg', ghost: store.get('ghost', true) !== false,
    learn: { id: LESSONS[0].id, step: 0 }, klearn: { id: (window.G.KEYLESSONS[0] || {}).id, step: 0 },
    chords: { id: 'maj7', vi: 0, chart: false },
    scales: { id: 'major', pos: 1, pattern: 'updown', rate: 2, chord: -1, oct: 1, hand: 'R' },
    circle: { ci: 0, sev: false },
    practice: { id: 'chromatic', fret: 5, rate: 2, bar: 0, level: 1, string: 6 },
  };
  const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  const cleanDone = (o) => { for (const k in o) if (!Array.isArray(o[k])) delete o[k]; return o; };
  const done = cleanDone(obj(store.get('done', {}))), kdone = cleanDone(obj(store.get('kdone', {})));
  const KL = window.G.KEYLESSONS || [];
  // One atlas. "Keys" is a way of looking at a page, chosen on the page; Practice is guitar-only for now.
  const lead = () => state.inst; // every page, Practice included, has a guitar and a keyboard version
  const onKeys = () => lead() === 'keys';
  const course = () => (onKeys() ? KL : LESSONS);
  const lk = () => (onKeys() ? 'klearn' : 'learn');
  const LS = () => state[lk()];
  const doneOf = () => (onKeys() ? kdone : done);
  const saveDone = () => store.set(onKeys() ? 'kdone' : 'done', doneOf());
  const openFolders = new Set();
  const neck = window.G.Neck($('neck')), keys = window.G.Keys($('keys'));
  // The keyboard mirrors whatever the neck shows: the same pitches in the same colours.
  const neckShow = neck.show, neckPulse = neck.pulse, neckActive = neck.setActive;
  const mirror = (spec) => {
    const seen = new Map();
    (spec.notes || []).forEach((n) => { const midi = T.TUNING[n.s] + n.f, p = seen.get(midi); if (!p || (p.dim && !n.dim)) seen.set(midi, { midi, label: n.klabel != null ? n.klabel : n.label, role: n.role, dim: n.dim }); });
    return { notes: [...seen.values()] };
  };
  neck.show = (spec = {}, keySpec) => { neckShow(spec); keys.show(keySpec || mirror(spec)); };
  neck.pulse = (s, f) => { neckPulse(s, f); keys.pulse(T.TUNING[s] + f); };
  neck.setActive = (s, f) => { neckActive(s, f); keys.setActive(s == null ? null : T.TUNING[s] + f); };
  // Whatever plays, plays on the lead instrument.
  const sound = (s, f, time, vel = 0.9) => (lead() === 'keys' ? Audio.key(T.TUNING[s] + f, time, vel) : Audio.pluck(T.TUNING[s] + f, time, vel, s));
  const strum = (frets, o = {}) => {
    if (lead() !== 'keys') return Audio.strum(frets, o);
    if (!Audio.resume()) return [];
    const t0 = Math.max(o.when || 0, Audio.now()) + 0.02, gap = o.gap > 0.1 ? o.gap : 0.012, hits = [];
    frets.forEach((f, i) => { if (f === null) return; const at = t0 + hits.length * gap; Audio.key(T.TUNING[i] + f, at, (o.vel || 1) * 0.8); hits.push({ s: i, f, at }); });
    return hits;
  };
  let cur = {}; // what the keyboard and play buttons act on in the current view
  let quiz = null, confirmReset = false;

  // ---------- shared pieces ----------
  const label = (tone) => esc(state.labels === 'note' ? tone.note : tone.deg);
  const chipsHTML = (tones) => tones.map((t) => `<span class="chip"><b class="${t.role}-bg">${esc(t.deg)}</b>${esc(t.note)}</span>`).join('');
  const pill = (txt) => `<span class="chip plain">${txt}</span>`;
  const tilesHTML = (list) => list.map(([a, b]) => `<div class="tile"><small>${a}</small><b>${b}</b></div>`).join('');
  const keysHTML = () => `<div class="side-head"><span>Key</span></div><div class="keys">${T.KEYS.map((k) => `<button class="key${k === state.key ? ' on' : ''}" data-act="key" data-k="${k}">${k}</button>`).join('')}</div>`;
  const capoHTML = () => (lead() === 'keys' ? '' : `<div class="stepper" title="Capo position"><span>Capo</span><button data-act="capo" data-d="-1" aria-label="Capo down">−</button><b>${state.capo || 'off'}</b><button data-act="capo" data-d="1" aria-label="Capo up">+</button></div>`);
  const noteLine = (v) => v.notes.filter(Boolean).map((t) => esc(t.note)).join(' ');
  const voicingNotes = (v) => {
    const fg = state.labels === 'finger' ? T.guitarFingers(v.frets, state.capo).fingers : null; // finger numbers on the neck, note names on the keys
    return v.frets.map((f, s) => (f === null ? null : { s, f, role: v.notes[s].role, label: fg ? fg[s] || '○' : label(v.notes[s]), klabel: fg ? esc(v.notes[s].note) : undefined })).filter(Boolean);
  };
  const FNAME = ['', 'Index', 'Middle', 'Ring', 'Little'];
  function fingerLine(v) {
    const r = T.guitarFingers(v.frets, state.capo), parts = [];
    if (r.barre) parts.push(`Index finger (1) lies flat across fret ${r.barre.fret}, strings ${6 - r.barre.from} to ${6 - r.barre.to}`);
    for (let fg = r.barre ? 2 : 1; fg <= 4; fg++) {
      const ss = []; r.fingers.forEach((x, i) => { if (x === fg) ss.push(i); });
      if (ss.length) parts.push(`${FNAME[fg]} (${fg}) on string${ss.length > 1 ? 's' : ''} ${ss.map((i) => 6 - i).join(' and ')}, fret ${v.frets[ss[0]]}`);
    }
    const open = r.fingers.filter((x) => x === 0).length;
    return (parts.join('. ') || 'No fretting fingers needed') + '.' + (open ? ` ${open} open string${open > 1 ? 's ring' : ' rings'}.` : '');
  }
  const chordOf = (root, id) => { const c = T.chord(root, id, state.capo); return c.voicings.length ? c : T.chord(root, id); };

  function chordBox(v) {
    const start = v.hi <= 5 ? 1 : Math.max(v.lo, 1), rows = v.hi - start + 1 > 5 ? 6 : 5;
    const sx = 5.6, fy = 7.4, x0 = 8, y0 = 10, w = sx * 5, h = fy * rows;
    let s = `<svg viewBox="0 0 48 ${y0 + h + 4}" aria-hidden="true">`;
    for (let i = 0; i < 6; i++) {
      s += `<line class="cb-grid" x1="${x0 + i * sx}" y1="${y0}" x2="${x0 + i * sx}" y2="${y0 + h}"/>`;
      if (v.frets[i] === null) s += `<text class="cb-x" x="${x0 + i * sx}" y="${y0 - 3}">×</text>`;
      else if (v.frets[i] < start) s += `<circle class="cb-open f-${v.notes[i].role}" cx="${x0 + i * sx}" cy="${y0 - 5}" r="2"/>`;
    }
    for (let r = 0; r <= rows; r++) s += `<line class="${r === 0 && start === 1 ? 'cb-nut' : 'cb-grid'}" x1="${x0}" y1="${y0 + r * fy}" x2="${x0 + w}" y2="${y0 + r * fy}"/>`;
    if (start > 1) s += `<text class="cb-fret" x="${x0 + w + 6}" y="${y0 + fy * 0.5 + 2.3}">${start}</text>`;
    v.frets.forEach((f, i) => {
      if (f === null || f < start) return;
      const cx = x0 + i * sx, cy = y0 + (f - start + 0.5) * fy, d = esc(v.notes[i].deg);
      s += `<circle class="f-${v.notes[i].role}" cx="${cx}" cy="${cy}" r="3.3"/><text class="cb-deg t-${v.notes[i].role}" x="${cx}" y="${cy + 2}" ${d.length > 2 ? 'style="font-size:4.2px"' : ''}>${d}</text>`;
    });
    return s + '</svg>';
  }
  const capLine = (v) => (v.kind === 'caged' ? `${v.form} shape` : `${esc(v.bass.deg)} in bass`);
  function thumbHTML(v, attrs, on, num, top) {
    return `<button class="thumb${on ? ' on' : ''}" ${attrs}>${num != null ? `<span class="num">${num}</span>` : ''}${chordBox(v)}
      <span class="cap">${top || capLine(v)}</span><span class="cap2">${top ? capLine(v) : 'strings ' + v.strings}</span>
      <span class="cap2">${noteLine(v)}</span>${v.stretch ? `<span class="stretch">${v.wide ? 'big stretch' : 'stretch'}</span>` : ''}</button>`;
  }
  function ghostsFor(chord, v) {
    if (!state.ghost || !v.rootless) return [];
    const out = [], bassIdx = v.frets.findIndex((f) => f !== null), bassPitch = T.TUNING[bassIdx] + v.frets[bassIdx];
    for (let i = 0; i < 6; i++) {
      if (v.frets[i] !== null) continue;
      for (let f = Math.max(1, v.lo - 2); f <= Math.min(17, v.hi + 2); f++) {
        if ((T.TUNING[i] + f) % 12 === chord.rootPc && !(i > bassIdx && T.TUNING[i] + f > bassPitch)) out.push({ s: i, f });
      }
    }
    return out;
  }
  const showVoicing = (chord, v) => neck.show({ notes: voicingNotes(v), mute: true, window: [v.lo || 1, v.hi], ghosts: ghostsFor(chord, v), capo: state.capo });
  // one-shot playback locked to the metronome: starts on the next beat, then fires every `rate` ticks
  let timedOff = null;
  const cancelTimed = () => { if (timedOff) { timedOff(); timedOff = null; } };
  function inTime(n, rate, fn) {
    cancelTimed();
    let start = null, k = 0;
    timedOff = Metro.onTick((tick, time) => {
      if (start === null) { if (tick % Metro.TPB) return; start = tick; }
      if ((tick - start) % rate) return;
      fn(k++, time);
      if (k >= n) cancelTimed();
    });
  }
  const onClock = () => Metro.on && !drill.off;
  // Only one thing plays at a time. Starting something new fades out whatever was sounding;
  // pressing play again while a run of notes is still going stops it instead of stacking another on top.
  let busyUntil = 0, busyTimer = null, lastPlay = 0;
  const playLabel = (on) => document.querySelectorAll('[data-act="play"]').forEach((b) => {
    if (on) { if (!b.dataset.label) b.dataset.label = b.textContent; b.textContent = '■ Stop'; } else if (b.dataset.label) { b.textContent = b.dataset.label; delete b.dataset.label; }
  });
  function stopPlayback() { cancelTimed(); Audio.hush(); busyUntil = 0; clearTimeout(busyTimer); playLabel(false); }
  function busyFor(seconds, showStop) {
    busyUntil = performance.now() + seconds * 1000;
    if (showStop) playLabel(true);
    busyTimer = setTimeout(() => { busyUntil = 0; playLabel(false); }, seconds * 1000);
  }
  const tooSoon = () => { const now = performance.now(); if (now - lastPlay < 140) return true; lastPlay = now; return false; };
  function playVoicing(v, gap = 0.035) {
    if (tooSoon() || !Audio.resume()) return;
    const arp = gap > 0.1, clock = onClock(), beat = 60 / Metro.bpm;
    if ((arp || clock) && performance.now() < busyUntil) return stopPlayback();
    stopPlayback();
    const up = [0, 1, 2, 3, 4, 5].filter((i) => v.frets[i] !== null);
    if (clock && arp) { // metronome running: arpeggios move in eighth notes from the next beat
      const order = up.concat(up.slice(1, -1).reverse());
      inTime(order.length, Metro.TPB / 2, (k, time) => { const s = order[k]; sound(s, v.frets[s], time); Audio.at(time, () => neck.pulse(s, v.frets[s])); });
      busyFor((order.length / 2 + 1) * beat);
    } else if (clock) { // ...and strums land on each beat of one bar
      inTime(Metro.beats, Metro.TPB, (k, time) => strum(v.frets, { when: time, gap: 0.016, vel: k ? 0.6 : 1 }).forEach((h) => Audio.at(h.at, () => neck.pulse(h.s, h.f))));
      busyFor((Metro.beats + 1) * beat);
    } else {
      strum(v.frets, { gap }).forEach((h) => Audio.at(h.at, () => neck.pulse(h.s, h.f)));
      if (arp) busyFor(up.length * gap);
    }
  }
  function playNotes(notes, gap = 0.3, ordered) { // single notes one after another, in pitch order unless `ordered`
    if (tooSoon() || !Audio.resume()) return;
    if (notes.length > 1 && performance.now() < busyUntil) return stopPlayback();
    stopPlayback();
    const list = ordered ? notes : notes.slice().sort((a, b) => T.TUNING[a.s] + a.f - (T.TUNING[b.s] + b.f));
    const hit = (n, time) => { sound(n.s, n.f, time); Audio.at(time, () => neck.pulse(n.s, n.f)); };
    if (onClock()) {
      inTime(list.length, Metro.TPB / 2, (k, time) => hit(list[k], time));
      if (list.length > 1) busyFor((list.length / 2 + 1) * 60 / Metro.bpm, true);
    } else {
      const t0 = Audio.now() + 0.05;
      list.forEach((n, i) => hit(n, t0 + i * gap));
      if (list.length > 1) busyFor(list.length * gap, true);
    }
  }
  const stringTable = (v) => '<table class="strings"><tr><th>String</th><th>Fret</th><th>Finger</th><th>Note</th><th>Degree</th></tr>' + v.frets.map((f, i, all) => (f === null
    ? `<tr class="mute"><td>${6 - i} · ${T.OPEN[i]}</td><td>×</td><td></td><td></td><td></td></tr>`
    : `<tr><td>${6 - i} · ${T.OPEN[i]}</td><td><b>${f === 0 ? 'open' : state.capo && f === state.capo ? 'capo' : f}</b></td><td>${T.guitarFingers(all, state.capo).fingers[i] || '–'}</td><td>${esc(v.notes[i].note)}</td><td><span class="deg ${v.notes[i].role}-bg">${esc(v.notes[i].deg)}</span></td></tr>`)).reverse().join('') + '</table>';
  const navHTML = (prevOff, nextOff, nextLabel = 'Next →') => `<div class="nav"><button class="btn ghost" data-act="prev" ${prevOff ? 'disabled' : ''}>← Back</button><button class="btn primary" data-act="next" ${nextOff ? 'disabled' : ''}>${nextLabel}</button></div>`;
  const stepCard = ({ no, tag, warn, title, body, idea, more = '', hint = '' }) => `<section class="card step">
    <div class="step-head"><span>${no}</span>${tag ? `<span class="tag${warn ? ' warn' : ''}">${tag}</span>` : ''}</div>
    <h2>${title}</h2><div class="body">${body}</div>${idea ? `<div class="idea"><b>Key idea</b><p>${idea}</p></div>` : ''}${more}
    ${hint ? `<p class="hint">${hint}</p>` : ''}</section>`;
  const KB = '<kbd>←</kbd><kbd>→</kbd> step · <kbd>Space</kbd> play · <kbd>M</kbd> metronome';
  function ui(p) {
    $('side').innerHTML = p.side; $('crumbs').textContent = p.crumbs; $('title').textContent = p.title;
    $('chips').innerHTML = p.chips || ''; $('lede').innerHTML = p.lede || '';
    $('tiles').innerHTML = p.tiles || ''; $('actions').innerHTML = p.actions || '';
    $('extra').innerHTML = p.extra || ''; $('railHead').innerHTML = p.railHead || ''; $('rail').innerHTML = p.rail || '';
    // a player's own words, when one bears on this lesson step or tab (js/quotes.js)
    const Q = window.G.Quotes, voice = Q ? (state.view === 'learn' ? Q.card(LS().id, LS().step | 0, lk() !== 'learn') : Q.card('view:' + state.view, String(p.title || '').length + (p.crumbs || '').length, state.inst === 'keys')) : '';
    $('panel').innerHTML = (p.panel || '') + voice;
    $('stage').hidden = !!p.noStage;
  }

  // ---------- drills (anything that plays in time with the metronome) ----------
  const drill = { off: null, own: false, i: 0 };
  function stopDrill() {
    if (!drill.off) return;
    drill.off(); drill.off = null;
    if (drill.own) Metro.stop();
    Audio.hush();
    neck.setActive(null);
    document.querySelectorAll('[data-act="drill"]').forEach((b) => { b.textContent = '▶ Play'; });
  }
  function startDrill(rate, onStep) {
    stopDrill(); stopPlayback();
    if (!Audio.resume()) return;
    drill.i = 0; drill.own = !Metro.on;
    drill.off = Metro.onTick((tick, time) => { if (tick % rate === 0) onStep(drill.i++, time); });
    if (!Metro.on) Metro.start();
    document.querySelectorAll('[data-act="drill"]').forEach((b) => { b.textContent = '■ Stop'; });
  }
  const rateSelect = (val) => `<select data-change="rate" aria-label="Note length">${[[4, 'Quarter notes'], [2, 'Eighth notes'], [1, 'Sixteenths']].map(([v, n]) => `<option value="${v}"${v === val ? ' selected' : ''}>${n}</option>`).join('')}</select>`;
  function runSequence(seq, rate) {
    startDrill(rate, (i, time) => {
      const n = seq[i % seq.length];
      sound(n.s, n.f, time);
      Audio.at(time, () => drill.off && neck.setActive(n.s, n.f));
    });
  }

  // ---------- guided lesson ----------
  // A lesson is a line of parts: for each step, Explain → Listen → Key idea → Your turn → Play along.
  // The guide plays them in order. It can be paused and resumed mid-sentence, and any part can be jumped to.
  const gpos = obj(store.get('gpos', {}));
  for (const k in gpos) if (!Number.isInteger(gpos[k]) || gpos[k] < 0) delete gpos[k];
  const Guide = { on: false, run: 0, idx: 0, lesson: null, at: 0, audio: null, tl: [], rate: [0.8, 1, 1.2].includes(+store.get('grate', 1)) ? +store.get('grate', 1) : 1, voice: String(store.get('gvoice', '') || '') };
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));
  const { spoken } = window.G.Narr;
  const SEG = { intro: ['Intro', '#lede'], main: ['Explain', '.step .body'], listen: ['Listen', '#stage'], idea: ['Key idea', '.step .idea'], tryIt: ['Your turn', '.step .try'], along: ['Play along', '#stage'], end: ['Wrap-up', '.howto:last-of-type'] };
  function guideLine(L) {
    const kb = onKeys(), out = [];
    L.steps.forEach((_, i) => {
      const P = window.G.Narr.parts(L, i, kb), add = (kind, text) => out.push({ step: i, kind, text });
      if (P.intro) add('intro', P.intro);
      add('main', P.main); if (P.play) add('listen');
      if (P.idea) add('idea', P.idea);
      add('tryIt', P.tryIt); if (P.play) add('along');
      if (P.end) add('end', P.end);
    });
    return out;
  }
  const savePos = () => { gpos[Guide.lesson] = Guide.idx; store.set('gpos', gpos); };
  // keep the playhead honest: a different lesson starts from its saved place; a step chosen by hand moves the playhead to that step
  function guideSync() {
    const L = lesson(), tl = (Guide.tl = guideLine(L));
    Guide.allRec = tl.every((x) => !x.text || recFor(x.text));
    if (Guide.lesson !== L.id) { Guide.lesson = L.id; Guide.idx = Math.min(gpos[L.id] || 0, tl.length - 1); Guide.at = 0; }
    if (tl[Guide.idx].step !== LS().step) { Guide.idx = tl.findIndex((x) => x.step === LS().step); Guide.at = 0; }
  }
  const guideWord = () => (Guide.on ? '❚❚ Pause guide' : Guide.idx > 0 || Guide.at > 0 ? '▶ Resume guide' : '▶ Guided lesson');
  function guideBarHTML() {
    guideSync();
    const tl = Guide.tl;
    return `<div class="gbar${Guide.on ? ' on' : ''}" role="group" aria-label="Guided lesson"><button class="gbtn" data-act="gprev" aria-label="Previous part" title="Previous part">⏮</button><button class="gbtn main" data-act="guide" aria-label="Play or pause the guided lesson">${Guide.on ? '❚❚' : '▶'}</button><button class="gbtn" data-act="gnext" aria-label="Next part" title="Next part">⏭</button>
      <div class="gtrack">${tl.map((x, j) => `<button class="gtick k-${x.kind}${j < Guide.idx ? ' past' : j === Guide.idx ? ' now' : ''}${j && tl[j - 1].step !== x.step ? ' gap' : ''}" data-act="gseek" data-i="${j}" title="Step ${x.step + 1}: ${SEG[x.kind][0]}" aria-label="Step ${x.step + 1}: ${SEG[x.kind][0]}"></button>`).join('')}</div><span class="glabel" id="glabel">Step ${tl[Guide.idx].step + 1} of ${lesson().steps.length} · ${SEG[tl[Guide.idx].kind][0]}</span></div>`;
  }
  function paintBar() {
    const x = Guide.tl[Guide.idx], lab = $('glabel');
    document.querySelectorAll('.gtick').forEach((t, j) => { t.classList.toggle('past', j < Guide.idx); t.classList.toggle('now', j === Guide.idx); });
    if (lab && x) lab.textContent = `Step ${x.step + 1} of ${lesson().steps.length} · ${SEG[x.kind][0]}`;
    document.querySelectorAll('.gbar').forEach((n) => n.classList.toggle('on', Guide.on));
    document.querySelectorAll('[data-act="guide"]').forEach((n) => { if (n.classList.contains('main')) n.textContent = Guide.on ? '❚❚' : '▶'; else { n.textContent = guideWord(); n.classList.toggle('on', Guide.on); } });
  }
  function spot(sel) {
    document.querySelectorAll('.reading').forEach((n) => n.classList.remove('reading'));
    const n = sel && document.querySelector(sel);
    if (n) { n.classList.add('reading'); n.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  }
  // recorded narration first, the browser's voice as the fallback; `from` resumes a recording part-way through
  const recFor = (text) => { const file = window.G.Narr.fileFor(text), id = file && file.split('/').pop().split('.')[0]; return file && !(window.G.NARR_SKIP || []).includes(id) ? file : null; };
  function say(text, sel, my, from = 0) {
    if (!Guide.on || my !== Guide.run) return Promise.resolve();
    spot(sel);
    const rec = Guide.recorded === false || !Guide.allRec ? null : recFor(text), id = rec && rec.split('/').pop().split('.')[0];
    if (rec) return new Promise((res) => {
      const au = new window.Audio(rec);
      Guide.audio = au; au.playbackRate = Guide.rate;
      // the volume slider governs narration too, and each recording carries a small trim so they all sit at one level
      au.volume = Math.max(0, Math.min(1, Audio.settings.volume * Math.pow(10, ((window.G.NARR_GAIN || {})[id] || 0) / 20)));
      let fell = false;
      const fallback = () => { if (fell) return; fell = true; Guide.audio = null; sayAloud(text, my).then(res); };
      au.onended = () => { Guide.audio = null; res(); }; au.onerror = fallback;
      if (from > 0.3) au.addEventListener('loadedmetadata', () => { try { au.currentTime = Math.max(0, from - 0.6); } catch (e) { /* start from the top */ } }, { once: true });
      au.play().catch(fallback);
    });
    return sayAloud(text, my);
  }
  // One narrator for the whole app: the best English voice this device has, chosen once and kept, so timbre and level never change.
  // Natural or enhanced voices first, then the well-known good ones, then any English voice; US English before other accents.
  let voicePick = null;
  function bestVoice() {
    if (!('speechSynthesis' in window)) return null;
    const vs = speechSynthesis.getVoices().filter((v) => /^en([-_]|$)/i.test(v.lang));
    if (!vs.length) return null;
    if (voicePick && vs.some((v) => v.name === voicePick.name)) return voicePick;
    const rank = (v) => (/natural|neural|enhanced|premium/i.test(v.name) ? 0 : /siri|google us english|samantha|ava|allison|aria|jenny|zira|daniel|karen/i.test(v.name) ? 1 : 2) * 10 + (/en[-_]US/i.test(v.lang) ? 0 : /en[-_]GB/i.test(v.lang) ? 1 : 2) * 2 + (v.localService ? 0 : 1);
    voicePick = vs.slice().sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))[0];
    return voicePick;
  }
  function sayAloud(text, my) {
    if (!Guide.on || my !== Guide.run) return Promise.resolve();
    const parts = spoken(text).match(/[^.!?]+[.!?]*/g) || [];
    if (!('speechSynthesis' in window) || !window.SpeechSynthesisUtterance) return wait(text.length * 62 / Guide.rate); // no voice available: still pace the lesson
    return parts.reduce((p, part) => p.then(() => new Promise((res) => {
      if (!Guide.on || my !== Guide.run || !part.trim()) return res();
      const u = new SpeechSynthesisUtterance(part.trim()), v = bestVoice();
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-US'; // phones ignore the voice unless the language is set with it
      u.rate = Guide.rate; u.pitch = 1; u.volume = Math.max(0, Math.min(1, Audio.settings.volume / 0.8)); u.onend = res; u.onerror = res;
      speechSynthesis.speak(u);
    })), Promise.resolve());
  }
  function pauseGuide() {
    if (!Guide.on) return;
    Guide.on = false; Guide.run++;
    Guide.at = 0;
    if (Guide.audio) { Guide.at = Guide.audio.currentTime || 0; Guide.audio.onended = null; Guide.audio.onerror = null; Guide.audio.pause(); Guide.audio = null; }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    stopPlayback(); savePos(); paintBar();
  }
  async function demo(my) { // play the step's example and wait for it to finish
    if (!Guide.on || my !== Guide.run || !cur.play) return;
    spot('#stage'); lastPlay = 0; busyUntil = 0; cur.play();
    await wait(Math.max(1900, busyUntil - performance.now() + 800));
  }
  async function playGuide() {
    if (Guide.on) return;
    Guide.on = true; const my = ++Guide.run;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    Audio.resume(); paintBar();
    const alive = () => Guide.on && my === Guide.run && state.view === 'learn';
    while (alive()) {
      const x = Guide.tl[Guide.idx];
      if (!x) break;
      if (LS().step !== x.step) { go({ [lk()]: { step: x.step } }); await wait(650); if (!alive()) return; }
      paintBar();
      const from = Guide.at; Guide.at = 0;
      if (x.text) await say(x.text, SEG[x.kind][1], my, from); else await demo(my);
      if (!alive()) return;
      if (x.kind === 'tryIt' || x.kind === 'along') { await wait(1200); if (!alive()) return; }
      if (Guide.idx >= Guide.tl.length - 1) { Guide.idx = 0; savePos(); go({ [lk()]: { step: 0 } }); break; } // finished: rewind for next time
      Guide.idx++; savePos();
    }
    if (my === Guide.run) { Guide.on = false; spot(null); paintBar(); }
  }
  // jump to a part: keeps playing if it was playing, stays paused if it was paused
  function seekGuide(j) {
    const was = Guide.on;
    pauseGuide();
    Guide.idx = Math.max(0, Math.min(Guide.tl.length - 1, j)); Guide.at = 0; savePos();
    const x = Guide.tl[Guide.idx];
    if (LS().step !== x.step) go({ [lk()]: { step: x.step } }); else paintBar();
    if (was) playGuide(); else spot(SEG[x.kind][1]);
  }

  // ---------- Learn ----------
  // keyboard lesson playback: a run of notes, one chord, or several chords in turn (the keys move as they change)
  function playKeys(spec, mode) {
    if (tooSoon() || !Audio.resume()) return;
    if (performance.now() < busyUntil) return stopPlayback();
    stopPlayback();
    const t0 = Audio.now() + 0.05, hit = (n, at, vel = 0.85) => { Audio.key(n.midi, at, vel); Audio.at(at, () => keys.pulse(n.midi)); };
    if (mode === 'groups' && spec.groups) {
      const gap = 1.25;
      spec.groups.forEach((g, k) => { const at = t0 + k * gap; Audio.at(at - 0.02, () => keys.show({ notes: g })); g.filter((n) => !n.dim).forEach((n, j) => hit(n, at + j * 0.012)); });
      Audio.at(t0 + spec.groups.length * gap + 0.4, () => keys.show({ notes: spec.groups[0] }));
      busyFor(spec.groups.length * gap + 0.4, true);
    } else if (mode === 'chord') {
      spec.notes.filter((n) => !n.dim).sort((x, y) => x.midi - y.midi).forEach((n, j) => hit(n, t0 + j * 0.014));
      busyFor(1.6);
    } else {
      const list = spec.seq || spec.notes.filter((n) => !n.dim);
      list.forEach((n, j) => hit(n, t0 + j * 0.42));
      busyFor(list.length * 0.42, true);
    }
  }
  const lesson = () => course().find((l) => l.id === LS().id) || course()[0];
  function renderLearn() {
    const LESSONS = course(), done = doneOf(), kb = onKeys();
    const L = lesson(), i = Math.min(LS().step, L.steps.length - 1), st = L.steps[i];
    LS().step = i;
    const gbar = guideBarHTML();
    (done[L.id] = done[L.id] || [])[i] = 1; saveDone();
    const groups = [...new Set(LESSONS.map((l) => l.group))], inGroup = LESSONS.filter((l) => l.group === L.group);
    const total = LESSONS.reduce((a, l) => a + l.steps.length, 0), seen = LESSONS.reduce((a, l) => a + (done[l.id] || []).filter(Boolean).length, 0);
    const side = `<div class="course-tabs"><button data-act="inst" data-i="guitar" class="${kb ? '' : 'on'}">Guitar course</button><button data-act="inst" data-i="keys" class="${kb ? 'on' : ''}">Keyboard course</button></div><div class="side-head"><span>${kb ? 'Keyboard' : 'Guitar'} course</span><small>${LESSONS.length} lessons</small></div><div class="tree always">` + groups.map((g, gi) => {
      const ls = LESSONS.filter((l) => l.group === g), open = g === L.group || openFolders.has('L' + g);
      return `<div class="fam${open ? ' open' : ''}" data-fold="L${g}"><button data-act="fold"><span class="chev">›</span>${folder(gi)}<span>${String(gi + 1).padStart(2, '0')}. ${g}</span><small>${ls.length}</small></button><ul>` +
        ls.map((l) => { const n = (done[l.id] || []).filter(Boolean).length; return `<li><button data-act="lesson" data-id="${l.id}" class="${l.id === L.id ? 'on' : ''}">${l.title}<small>${n === l.steps.length ? '✓' : n + '/' + l.steps.length}</small></button></li>`; }).join('') + '</ul></div>';
    }).join('') + `</div><div class="progress"><span>Progress</span><b>${seen} / ${total}</b><i style="--p:${(seen / total * 100).toFixed(0)}%"></i>
      <div class="reset">${confirmReset ? `<span>Clear all lesson progress?</span><button class="btn small primary" data-act="reset-all">Yes, reset</button><button class="btn small" data-act="reset-no">Cancel</button>` : `<button class="btn small" data-act="restart">↺ Restart this lesson</button><button class="btn small" data-act="reset-ask">Reset all progress</button>`}</div></div>`;
    const spec = kb ? st.keys() : st.neck(), nSeen = (done[L.id] || []).filter(Boolean).length;
    const li = LESSONS.indexOf(L), lastStep = i === L.steps.length - 1, nextL = LESSONS[li + 1];
    ui({
      side, crumbs: `${L.group} / Lesson ${inGroup.indexOf(L) + 1} of ${inGroup.length}`, title: L.title,
      chips: pill(`${L.mins} min`) + pill(L.level) + pill(`${L.steps.length} steps`), lede: L.lede,
      extra: gbar, actions: `<button class="btn guide-btn${Guide.on ? ' on' : ''}" data-act="guide" title="Reads the lesson aloud, plays each example and moves on by itself. Pause any time; it picks up where it stopped.">${guideWord()}</button>` + (st.play ? `<button class="btn" data-act="play">▶ Hear it</button>` : ''),
      railHead: `<span>In this lesson</span><button class="btn small" data-act="restart">↺ Restart lesson</button>`,
      rail: `<ol class="steps">${L.steps.map((s, k) => `<li class="${k === i ? 'on' : k < i ? 'past' : ''}"><button data-act="step" data-i="${k}"><b>${k + 1}</b><span>${s.title}</span></button></li>`).join('')}</ol>`,
      panel: stepCard({ no: `Step ${i + 1} / ${L.steps.length}`, tag: st.tag, title: st.title, body: `<p>${st.body}</p>`, idea: st.idea,
        more: `<div class="try"><b>${kb ? 'At the keyboard' : 'On your guitar'}</b><p>${st.try}</p></div>${st.link ? `<button class="btn linkbtn" data-act="goto" data-h="${st.link.hash}">${st.link.label} ↗</button>` : ''}` +
          navHTML(i === 0 && li === 0, lastStep && !nextL, lastStep && nextL ? `Next lesson →` : 'Next →'), hint: KB }) +
        `<section class="card howto"><b>You’ll learn</b><ul class="check">${L.learn.map((g, k) => `<li class="${nSeen >= Math.ceil((k + 1) * L.steps.length / L.learn.length) ? 'ok' : ''}">${g}</li>`).join('')}</ul></section>
         <section class="card howto"><b>Practice routine</b><ul>${L.homework.map((h) => `<li>${h}</li>`).join('')}</ul></section>`,
    });
    if (kb) neck.show({ notes: [] }, { notes: spec.notes }); else neck.show(spec);
    const play = () => {
      if (!st.play) return;
      if (kb) return playKeys(spec, st.play);
      if (spec.seq) playNotes(spec.seq, 0.36, true);
      else if (st.play === 'strum') { const fr = [null, null, null, null, null, null]; spec.notes.forEach((n) => { fr[n.s] = n.f; }); playVoicing({ frets: fr }, 0.05); }
      else playNotes(spec.notes.filter((n) => !n.dim), 0.34, !spec.byPitch); // in the order the lesson wrote them, at an unhurried pace
    };
    cur = { play, next: () => (lastStep ? nextL && go({ [lk()]: { id: nextL.id, step: 0 } }) : go({ [lk()]: { id: L.id, step: i + 1 } })),
      prev: () => (i > 0 ? go({ [lk()]: { id: L.id, step: i - 1 } }) : li > 0 && go({ [lk()]: { id: LESSONS[li - 1].id, step: LESSONS[li - 1].steps.length - 1 } })) };
  }

  // ---------- chord insights ----------
  // play this chord, then the one it leads to
  function hearMove(from, to) {
    lastPlay = 0; playVoicing(from);
    if (to) Audio.at(Audio.now() + 1.0, () => { lastPlay = 0; playVoicing(to); });
  }
  function insightCard(root, id) {
    const x = window.G.Insights.forChord(root, id);
    if (!x) return '';
    const name = esc(root + T.QUALS.find((q) => q.id === id).suf), k = T.slug(root);
    const chordLi = (m) => `<li><button class="ins-play" data-act="hear-move" data-root="${m.root}" data-id="${m.id}" aria-label="Hear ${name} then ${esc(m.name)}">▶</button><button class="ins-link" data-act="open-chord" data-root="${m.root}" data-id="${m.id}">${esc(m.name)}</button><span><b>${m.label}.</b> ${m.why}</span></li>`;
    const sec = (title, body, open) => (body ? `<details class="ins-sec"${open ? ' open' : ''}><summary>${title}</summary>${body}</details>` : '');
    const jobs = x.jobs.slice(0, 8).map((j) => `<li><b class="ins-rom">${esc(j.roman)}</b><span>in ${esc(j.key)} ${j.mode} · <i class="fn-${j.fn}">${j.text}</i></span></li>`).join('');
    const kinds = [['same', 'Same notes, other name'], ['rootless', 'Without its root'], ['step', 'One note away'], ['sub', 'Stand-ins']];
    const rel = kinds.map(([kind, title]) => { const items = x.relatives.filter((r) => r.kind === kind); return items.length ? `<h4>${title}</h4><ul class="ins">${items.map(chordLi).join('')}</ul>` : ''; }).join('');
    return `<section class="card insight"><div class="step-head"><span>In use</span><span class="tag">What ${name} is for</span></div>
      ${sec('Its job', jobs ? `<ul class="ins jobs">${jobs}</ul>` : '<p class="muted">A power chord has no 3rd, so it takes whatever job the song gives it.</p>', true)}
      ${sec('Where it goes', x.moves.length ? `<ul class="ins">${x.moves.map(chordLi).join('')}</ul><p class="muted">▶ plays ${name}, then the chord it moves to.</p>` : '', true)}
      ${sec('Relatives', rel)}
      ${sec('Play over it', `<ul class="ins">${x.scales.map((s) => `<li><button class="ins-link" data-act="goto" data-h="#scales-${T.slug(s.root)}-${s.id}-0">${esc(s.root)} ${T.SCALES.find((z) => z.id === s.id).name}</button><span>${s.why}</span></li>`).join('')}</ul>`)}
      ${sec('Progressions', x.progs.length ? `<ul class="ins">${x.progs.map((p) => `<li><span><b>${p.name}</b> ${p.keys.slice(0, 4).map((kk) => `<button class="ins-link" data-act="goto" data-h="#practice-${T.slug(kk.key)}-${p.id}">${esc(kk.roman)} in ${esc(kk.key)}</button>`).join(' ')}</span></li>`).join('')}</ul>` : '')}
      ${sec('Sound and style', `<p>${x.style.sound}</p><p><b>Heard in.</b> ${x.style.heard}</p><p><b>Carries the colour.</b> ${x.style.core}</p><p><b>Can be left out.</b> ${x.style.drop}</p>`, true)}
    </section>`;
  }

  // ---------- Chords ----------
  const FORM_IDEA = {
    E: 'Root on string 6. The fret under your first finger names the chord, so this one shape gives you twelve chords.',
    A: 'Root on string 5. Together with the E shape it covers most rhythm playing.',
    C: 'Root on string 5 under the ring finger, with the rest of the shape reaching back toward the nut.',
    G: 'Roots on strings 6 and 1. Hard to hold in full; players usually take the top or bottom half.',
    D: 'Root on string 4. A compact shape on the top strings that cuts through.',
  };
  function describe(c, v) {
    const name = esc(c.name), bass = T.ordinal(v.bass.deg), frets = v.lo === v.hi ? `fret ${v.hi}` : `frets ${v.lo || 'open'}–${v.hi}`;
    const where = `Strings ${[...v.strings].join('-')}, ${frets}.`;
    const g3 = c.tones.find((t) => /^\D*3$/.test(t.deg)), g7 = c.tones.find((t) => /^\D*7$/.test(t.deg)) || c.tones.find((t) => t.deg === '6');
    let o;
    if (v.kind === 'caged') o = { tag: v.open ? 'Open' : v.form + ' shape', title: v.open ? `Open ${name}${state.capo ? ' (from the capo)' : ''}` : `${name}, ${v.form} shape`, body: `${v.open ? 'An open-position chord built on' : 'A movable barre form built on'} the ${v.form} shape. ${where}`, idea: FORM_IDEA[v.form] };
    else if (v.kind === 'triad') o = { tag: 'Triad', title: `${{ 1: 'Root position', 3: 'First inversion', 5: 'Second inversion' }[v.bass.deg.replace(/\D/g, '')]} triad`, body: `Three notes on three adjacent strings with the ${bass} on the bottom. ${where}`, idea: 'Root position, first inversion and second inversion are the same three notes re-stacked. Classical pieces and jazz comping both lean on these small shapes.' };
    else if (v.kind === 'shellR') o = { tag: 'Shell', title: 'Shell voicing with the root', body: `Root, ${esc(g3.deg)} and ${esc(g7.deg)}. No 5th. ${where}`, idea: 'Three notes are enough to state a seventh chord. Shells leave room for a bass line or a melody.' };
    else if (v.kind === 'drop2') o = { tag: 'Drop-2', title: `Drop-2, ${bass} in the bass`, body: `All four chord tones on four adjacent strings. ${where}`, idea: 'Take a close-position chord and drop its second-highest note an octave. The result falls one note per string, with the melody note on top.' };
    else if (v.kind === 'drop3') o = { tag: 'Drop-3', title: `Drop-3, ${bass} in the bass`, body: `A bass note, a skipped string, then three notes together. ${where}`, idea: 'Drop the third-highest note an octave. The wide gap separates bass from chord, which suits solo guitar and bossa nova.' };
    else if (v.kind === 'shell') o = { tag: 'Rootless shell', title: `Guide tones, ${bass} in the bass`, body: `Only ${esc(g3.note)} (${esc(g3.deg)}) and ${esc(g7.note)} (${esc(g7.deg)}). ${where}`, idea: `The 3rd and 7th tell the ear which seventh chord this is. Leave the root to the bass player and these two still say “${name}”.` };
    else if (v.kind === 'close') o = { tag: 'Rootless', title: `Three-note inversion, ${bass} in the bass`, body: `The 3rd, 5th and 7th in close position on three adjacent strings. ${where}`, idea: `Without its root, ${name} is a plain triad built on its 3rd. Any shape you know for that triad is a ${name} voicing.` };
    else if (v.kind === 'shellx') { const xt = v.notes.find((t) => t && t.role !== 'guide') || v.bass; o = { tag: 'Shell + ' + esc(xt.deg), title: `Shell plus the ${T.ordinal(xt.deg)}`, body: `Guide tones underneath, with ${esc(xt.note)} (${esc(xt.deg)}) on top as the colour note. ${where}`, idea: 'The shell names the chord; one extension on top gives it its colour.' }; }
    else o = { tag: 'Rootless drop-2', title: `Rootless drop-2, ${bass} in the bass`, body: `Four chord tones, none of them the root, on four adjacent strings. ${where}`, idea: 'With the root gone there is room for an extension. These are the standard small-group jazz comping shapes.' };
    if (v.wide) o.body += ` It spans ${v.reach} frets: a big stretch that few hands manage low on the neck. Treat it as a shape to arpeggiate, or pick a neighbouring voicing.`;
    else if (v.stretch) o.body += ` It spans ${v.reach} frets, so it is a stretch.`;
    if (state.capo && c.shape) o.body += ` With the capo on fret ${state.capo} you are fingering ${esc(c.shape)} shapes.`;
    return o;
  }
  function renderChords() {
    const list = T.chordList(state.key);
    if (!list.some((x) => x.id === state.chords.id)) state.chords.id = list[0].id;
    const ci = list.findIndex((x) => x.id === state.chords.id), c = chordOf(state.key, state.chords.id);
    state.chords.vi = Math.max(0, Math.min(state.chords.vi, c.voicings.length - 1));
    const vi = state.chords.vi, v = c.voicings[vi], cats = [...new Set(list.map((x) => x.cat))], inCat = list.filter((x) => x.cat === c.cat);
    const side = keysHTML() + `<div class="side-head"><span>Chords</span><small>${list.length}</small></div>
      <select class="chord-select" data-change="chord" aria-label="Chord">${cats.map((cat) => `<optgroup label="${cat}">${list.filter((x) => x.cat === cat).map((x) => `<option value="${x.id}"${x.id === c.id ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</optgroup>`).join('')}</select>
      <div class="tree">` + cats.map((cat, k) => {
        const items = list.filter((x) => x.cat === cat), open = cat === c.cat || openFolders.has('C' + cat);
        return `<div class="fam${open ? ' open' : ''}" data-fold="C${cat}"><button data-act="fold"><span class="chev">›</span>${folder(k)}<span>${cat}</span><small>${items.length}</small></button><ul>` +
          items.map((x) => `<li><button data-act="chord" data-id="${x.id}" class="${x.id === c.id ? 'on' : ''}">${esc(x.name)}</button></li>`).join('') + '</ul></div>';
      }).join('') + '</div>';
    const head = { side, crumbs: `${state.key} · ${c.cat} / Chord ${inCat.findIndex((x) => x.id === c.id) + 1} of ${inCat.length}`, title: esc(c.name), chips: chipsHTML(c.tones),
      lede: `${c.quality}.${state.capo ? ` Capo on fret ${state.capo}: finger <b>${esc(c.shape)}</b> shapes.` : ''}` };
    if (state.chords.chart) {
      ui(Object.assign(head, { noStage: true, title: `${state.key} · ${c.cat}`, chips: '', crumbs: 'Chart · every voicing in this group', lede: 'Strings run 6 (left) to 1 (right). A number beside the top fret is the starting fret; a thick top line is the nut. Click a diagram to open it on the neck.',
        railHead: `<span>Chart</span><button class="btn small" data-act="chart">Back to the neck</button>`,
        rail: inCat.map((x) => { const cc = chordOf(state.key, x.id); let n = 0; return `<div class="chart-chord"><div class="chart-chord-head"><h3>${esc(cc.name)}</h3><div class="chips">${chipsHTML(cc.tones)}</div></div>` +
          cc.groups.map((g) => `<div class="group-label"><b>${esc(g.label)}</b></div><div class="thumbs">${g.items.map((it) => thumbHTML(it, `data-act="voicing" data-id="${x.id}" data-i="${n}"`, false, ++n)).join('')}</div>`).join('') + '</div>'; }).join('') }));
      cur = {};
      return;
    }
    const d = describe(c, v);
    let n = 0;
    ui(Object.assign(head, {
      tiles: tilesHTML([['Bass note', `${esc(v.bass.deg)} · ${esc(v.bass.note)}`], ['Strings', [...v.strings].join('-')], ['Frets', v.lo === v.hi ? v.hi : `${v.lo || 'open'}–${v.hi}`], ['Notes', noteLine(v)]]),
      actions: capoHTML() + `<button class="btn" data-act="play">▶ Strum</button><button class="btn" data-act="alt">♪ Arpeggio</button><button class="btn" data-act="chart">▦ Chart</button>`,
      railHead: `<span>Voicings of ${esc(c.name)}</span><small>${vi + 1} of ${c.voicings.length}</small>`,
      rail: c.groups.map((g) => `<div class="group-label"><b>${esc(g.label)}</b>${g.hint ? ` · ${g.hint}` : ''}</div><div class="thumbs">${g.items.map((it) => thumbHTML(it, `data-act="voicing" data-i="${n}"`, n === vi, ++n)).join('')}</div>`).join(''),
      panel: stepCard({ no: `Voicing ${vi + 1} / ${c.voicings.length}`, tag: v.wide ? 'Big stretch' : v.stretch ? 'Stretch' : d.tag, warn: v.stretch, title: d.title, body: `<p>${d.body}</p><p class="fingers"><b>Suggested fingering.</b> ${fingerLine(v)}</p>`, idea: d.idea,
        more: stringTable(v) + navHTML(vi === 0 && ci === 0, vi === c.voicings.length - 1 && ci === list.length - 1, vi === c.voicings.length - 1 && ci < list.length - 1 ? `Next: ${esc(list[ci + 1].name)} →` : 'Next →'),
        hint: '<kbd>←</kbd><kbd>→</kbd> voicing · <kbd>↑</kbd><kbd>↓</kbd> chord · <kbd>Space</kbd> strum' }) + (/^r\d+$/.test(c.id) ? '' : insightCard(state.key, c.id)),
    }));
    showVoicing(c, v);
    cur = { play: () => playVoicing(v), alt: () => playVoicing(v, 0.24), hear: (r, i) => hearMove(v, chordOf(r, i).voicings[0]),
      next: () => (vi < c.voicings.length - 1 ? go({ chords: { vi: vi + 1 } }) : ci < list.length - 1 && go({ chords: { id: list[ci + 1].id, vi: 0 } })),
      prev: () => (vi > 0 ? go({ chords: { vi: vi - 1 } }) : ci > 0 && go({ chords: { id: list[ci - 1].id, vi: 1e3 } })),
      down: () => ci < list.length - 1 && go({ chords: { id: list[ci + 1].id, vi: 0 } }), up: () => ci > 0 && go({ chords: { id: list[ci - 1].id, vi: 0 } }) };
  }

  // ---------- Scales ----------
  // Triads built by stacking thirds inside a seven-note scale: the chords that "live in" the scale.
  function scaleChords(sc) {
    if (sc.tones.length !== 7) return [];
    const ROM = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
    return sc.tones.map((t, i) => {
      const tones = [t, sc.tones[(i + 2) % 7], sc.tones[(i + 4) % 7]], a = T.mod(tones[1].pc - t.pc), b = T.mod(tones[2].pc - tones[1].pc);
      const q = a === 4 && b === 3 ? ['', 'u', ''] : a === 3 && b === 4 ? ['m', 'l', ''] : a === 3 && b === 3 ? ['°', 'l', '°'] : ['+', 'u', '+'];
      const acc = t.deg.replace(/\d/g, ''), rom = ROM[i];
      return { tones, degs: tones.map((x) => x.deg), name: esc(t.note) + q[0], roman: esc(acc) + (q[1] === 'u' ? rom : rom.toLowerCase()) + q[2] };
    });
  }
  function renderScales() {
    const sc = T.scale(state.key, state.scales.id), capo = state.capo;
    // With a capo you finger the patterns of a lower key, measured from the capo, and they sound `capo` frets higher.
    const shape = capo ? T.scale(T.KEYS[T.mod(T.pc(state.key) - capo)], state.scales.id) : sc;
    const positions = T.scalePositions(shape).map((p) => {
      const drop = capo && Math.max(...p.map((n) => n.f)) + capo > 17 && Math.min(...p.map((n) => n.f)) >= 12 ? 12 : 0;
      return p.map((n) => ({ s: n.s, f: n.f + capo - drop, tone: sc.tones.find((t) => t.deg === n.tone.deg), pitch: n.pitch + capo - drop }));
    }).filter((p) => Math.max(...p.map((n) => n.f)) <= 17).sort((a, b) => a[0].f - b[0].f);
    const pos = Math.max(0, Math.min(state.scales.pos, positions.length));
    state.scales.pos = pos;
    const chords = scaleChords(sc), chi = chords.length ? Math.min(state.scales.chord, chords.length - 1) : -1, chord = chi >= 0 ? chords[chi] : null;
    const raw = pos ? positions[pos - 1] : T.scaleAll(sc, 15).filter((n) => n.f >= capo);
    const inChord = (n) => !chord || chord.degs.includes(n.tone.deg);
    const notes = raw.map((n) => ({ s: n.s, f: n.f, role: n.tone.role, label: label(n.tone), dim: !inChord(n) }));
    const groups = [...new Set(T.SCALES.map((x) => x.group))], fs = raw.map((n) => n.f);
    const side = keysHTML() + `<div class="side-head"><span>Scales</span><small>${T.SCALES.length}</small></div><div class="tree always">` + groups.map((g, k) =>
      `<div class="fam open"><button disabled>${folder(k + 2)}<span>${g}</span></button><ul>${T.SCALES.filter((x) => x.group === g).map((x) => `<li><button data-act="scale" data-id="${x.id}" class="${x.id === sc.id ? 'on' : ''}">${x.name}</button></li>`).join('')}</ul></div>`).join('') + '</div>';
    const drillNotes = (pos ? positions[pos - 1] : positions.find((p) => p[0].tone.deg === '1') || positions[0] || []).filter(inChord);
    const capoNote = capo ? ` Capo on fret ${capo}: these are the <b>${esc(shape.root)} ${sc.def.name.toLowerCase()}</b> patterns you already know, played from the capo.` : '';
    ui({
      side, crumbs: `${state.key} · ${sc.def.group}`, title: `${state.key} ${sc.def.name}`, chips: chipsHTML(sc.tones), lede: sc.def.blurb + capoNote,
      tiles: tilesHTML([['Steps', T.stepFormula(sc)], ['Showing', pos ? `Position ${pos}` : 'Whole neck'], ['Frets', fs.length ? `${Math.min(...fs)}–${Math.max(...fs)}` : '–']].concat(chord ? [['Chord', `${chord.roman} · ${chord.name}`]] : [])),
      actions: capoHTML() + `<button class="btn" data-act="drill">▶ Play</button>`,
      railHead: `<span>Positions and drill</span><small>${sc.id === 'blues' ? 'two or three notes per string' : sc.tones.length === 5 ? 'two notes per string' : 'three notes per string'}</small>`,
      rail: `<div class="thumbs"><button class="posbtn${pos === 0 ? ' on' : ''}" data-act="pos" data-i="0">Whole neck</button>${positions.map((p, k) => `<button class="posbtn${pos === k + 1 ? ' on' : ''}" data-act="pos" data-i="${k + 1}">Position ${k + 1}<small>fret ${p[0].f}${p[0].tone.deg === '1' ? ' · root' : ''}</small></button>`).join('')}</div>` +
        (chords.length ? `<div class="group-label"><b>Chords inside this scale</b> · pick one and its notes stay lit in the position. Play then runs its arpeggio.</div>
          <div class="thumbs"><button class="posbtn${!chord ? ' on' : ''}" data-act="schord" data-i="-1">Whole scale</button>${chords.map((c, k) => `<button class="posbtn${k === chi ? ' on' : ''}" data-act="schord" data-i="${k}">${c.name}<small>${c.roman}</small></button>`).join('')}</div>` : '') +
        `<div class="drillbar"><label>Pattern <select data-change="pattern">${T.PATTERNS.map(([id, nm]) => `<option value="${id}"${id === state.scales.pattern ? ' selected' : ''}>${nm}</option>`).join('')}</select></label><label>Speed ${rateSelect(state.scales.rate)}</label><span class="muted">Play runs the pattern in time with the metronome at the top.</span></div>`,
      panel: stepCard({ no: sc.def.group, tag: `${sc.tones.length} notes`, title: chord ? `${chord.name} inside ${state.key} ${sc.def.name.toLowerCase()}` : `${state.key} ${sc.def.name}`,
        body: chord ? `<p>${chord.roman} is built from scale notes ${chord.degs.map(esc).join(', ')}: <b>${chord.tones.map((t) => esc(t.note)).join(' ')}</b>. The dimmed pegs are the rest of the scale.</p><p>Play the arpeggio, then the whole scale, and hear how the chord tones sound like resting points.</p>` : `<p>${sc.def.blurb}</p><p>Formula: <b>${sc.tones.map((t) => esc(t.deg)).join(' ')}</b>. Use it over ${sc.def.over}.</p>`,
        idea: chord ? 'When this chord is sounding, aim your phrases at its lit notes. The dimmed notes are how you travel between them.' : pos ? 'Learn one position until you can play it without looking, then learn the one next to it. Neighbouring positions share a column of notes.' : 'Find the gold root pegs first. Every position is built around one or two of them.',
        more: `<table class="strings"><tr><th>Degree</th><th>Note</th><th>From the root</th></tr>${sc.tones.map((t) => `<tr class="${chord && !chord.degs.includes(t.deg) ? 'mute' : ''}"><td><span class="deg ${t.role}-bg">${esc(t.deg)}</span></td><td>${esc(t.note)}</td><td>${T.mod(t.pc - T.pc(state.key))} frets</td></tr>`).join('')}</table>` +
          `<button class="btn linkbtn" data-act="goto" data-h="#learn-scalesmusic-1">Lesson: Scales into Music ↗</button>` + navHTML(pos === 0, pos === positions.length),
        hint: '<kbd>←</kbd><kbd>→</kbd> position · <kbd>Space</kbd> play or stop' }),
    });
    neck.show({ notes, window: pos && fs.length ? [Math.max(1, Math.min(...fs)), Math.max(...fs)] : null, capo });
    const toggle = () => (drill.off ? stopDrill() : drillNotes.length && runSequence(T.pattern(drillNotes.length, state.scales.pattern).map((k) => drillNotes[k]), state.scales.rate));
    cur = { play: toggle, drill: toggle, next: () => pos < positions.length && go({ scales: { pos: pos + 1 } }), prev: () => pos > 0 && go({ scales: { pos: pos - 1 } }) };
  }

  // ---------- Circle of fifths ----------
  function circleSVG(sel) {
    const pol = (r, a) => [(r * Math.cos(a * Math.PI / 180)).toFixed(1), (r * Math.sin(a * Math.PI / 180)).toFixed(1)];
    const wedge = (r0, r1, a0, a1) => `M${pol(r1, a0)} A${r1},${r1} 0 0 1 ${pol(r1, a1)} L${pol(r0, a1)} A${r0},${r0} 0 0 0 ${pol(r0, a0)} Z`;
    let s = '<svg class="circle" viewBox="-172 -172 344 344" role="img" aria-label="Circle of fifths">';
    T.CIRCLE.forEach((k, i) => {
      const a0 = i * 30 - 105, d = (i - sel + 12) % 12, cls = d === 0 ? ' sel' : d === 1 || d === 11 ? ' nb' : '';
      const [tx, ty] = pol(138, a0 + 15), [mx, my] = pol(90, a0 + 15);
      s += `<g data-act="key" data-k="${k}" class="wedge${cls}"><path class="maj" d="${wedge(112, 165, a0, a0 + 30)}"/><path class="min" d="${wedge(68, 112, a0, a0 + 30)}"/>
        <text class="cmaj" x="${tx}" y="${+ty + 6}">${k}</text><text class="cmin" x="${mx}" y="${+my + 4}">${esc(T.spell(k, '6'))}m</text></g>`;
    });
    return s + `<circle r="68" class="hub"/><text class="hub-a" y="-4">${T.sigShort(T.CIRCLE[sel])}</text><text class="hub-b" y="18">key of ${T.CIRCLE[sel]}</text></svg>`;
  }
  const FN_TEXT = { Tonic: 'Home. Progressions start here and come back here.', Subdominant: 'Moves away from home, and often leads on to the V chord.', Dominant: 'Tension. It wants to resolve to the I chord.' };
  function renderCircle() {
    const sel = T.CIRCLE.indexOf(state.key), dia = T.diatonic(state.key), sev = state.circle.sev, ci = state.circle.ci;
    const chords = dia.map((d) => chordOf(d.root, sev ? d.sev : d.tri)), c = chords[ci], v = c.voicings[0], d = dia[ci];
    const sc = T.scale(state.key, 'major'), sig = T.signature(state.key);
    ui({
      side: `<div class="side-head"><span>How to read it</span></div><ul class="plain-list">
        <li><b>Clockwise</b> goes up a fifth and adds one sharp.</li><li><b>Anticlockwise</b> goes up a fourth and adds one flat.</li>
        <li>The <b>outer ring</b> is major keys. The <b>inner ring</b> is each one’s relative minor.</li>
        <li>The keys either side of yours are its <b>IV</b> and <b>V</b> chords.</li>
        <li>Three steps anticlockwise in a row is a <b>ii–V–I</b>.</li></ul>`,
      crumbs: 'Circle of fifths', title: `Key of ${state.key} major`, chips: chipsHTML(sc.tones), lede: `${sig[0].toUpperCase() + sig.slice(1)}. Relative minor: ${esc(dia[5].root)} minor. Click any key on the circle.`,
      tiles: tilesHTML([['Signature', sig], ['IV · I · V', `${esc(dia[3].root)} · ${state.key} · ${esc(dia[4].root)}`], ['Relative minor', esc(dia[5].root) + 'm']]),
      actions: capoHTML() + `<button class="btn" data-act="play">▶ Strum</button><button class="btn" data-act="sev">${sev ? 'Show triads' : 'Show 7th chords'}</button>`,
      extra: `<div class="circle-wrap">${circleSVG(sel)}</div>`,
      railHead: `<span>The seven chords of ${state.key} major</span><small>${sev ? 'seventh chords' : 'triads'}</small>`,
      rail: `<div class="thumbs">${chords.map((cc, k) => thumbHTML(cc.voicings[0], `data-act="dia" data-i="${k}"`, k === ci, null, `${dia[k].roman} · ${esc(cc.name)}`)).join('')}</div>`,
      panel: stepCard({ no: `Chord ${ci + 1} / 7`, tag: d.fn, title: `${d.roman}: ${esc(c.name)}`, body: `<p>${FN_TEXT[d.fn]}</p><p>Built on note ${ci + 1} of the ${state.key} major scale, using only notes from that scale.</p>`,
        idea: 'Every major key has the same pattern of chords: I ii iii IV V vi vii°. Learn it once as numerals.',
        more: stringTable(v) + `<div class="nav"><button class="btn ghost" data-act="prev" ${ci === 0 ? 'disabled' : ''}>←</button><button class="btn primary" data-act="open-chord" data-root="${d.root}" data-id="${c.id}">All ${esc(c.name)} voicings</button><button class="btn ghost" data-act="next" ${ci === 6 ? 'disabled' : ''}>→</button></div>` }),
    });
    showVoicing(c, v);
    cur = { play: () => playVoicing(v), next: () => ci < 6 && go({ circle: { ci: ci + 1 } }), prev: () => ci > 0 && go({ circle: { ci: ci - 1 } }) };
  }

  // ---------- Practice ----------
  function practiceSide() {
    const id = state.practice.id, item = (pid, name) => `<li><button data-act="practice" data-id="${pid}" class="${pid === id ? 'on' : ''}">${name}</button></li>`;
    return `<div class="side-head"><span>Practice</span></div><div class="tree always">
      <div class="fam open"><button disabled>${folder(0)}<span>Warm-ups</span></button><ul>${T.WARMUPS.map((w) => item(w.id, w.name)).join('')}</ul></div>
      <div class="fam open"><button disabled>${folder(2)}<span>Chord changes</span></button><ul>${T.PROGS.map((p) => item(p.id, p.name)).join('')}</ul></div>
      <div class="fam open"><button disabled>${folder(3)}<span>Fretboard</span></button><ul>${EXS.map((x) => item(x.id, x.name)).join('')}</ul></div></div>`;
  }
  function renderWarmup(w) {
    const p = state.practice, seq = w.make(p.fret), fs = seq.map((n) => n.f);
    ui({
      side: practiceSide(), crumbs: 'Practice / Warm-ups', title: w.name, chips: pill('Both hands') + pill('2 to 5 minutes'), lede: w.text,
      tiles: tilesHTML([['Start fret', p.fret], ['Notes', seq.length], ['Tempo', Metro.bpm + ' BPM']]),
      actions: `<div class="stepper"><span>Fret</span><button data-act="wfret" data-d="-1">−</button><b>${p.fret}</b><button data-act="wfret" data-d="1">+</button></div><button class="btn" data-act="drill">▶ Play</button>`,
      railHead: '<span>Settings</span>', rail: `<div class="drillbar"><label>Speed ${rateSelect(p.rate)}</label><span class="muted">Pegs show which finger to use: 1 index, 2 middle, 3 ring, 4 pinky. Set the tempo with the metronome at the top.</span></div>`,
      panel: stepCard({ no: 'Warm-up', tag: 'Technique', title: w.name, body: `<p>${w.text}</p><p>Start around 60 BPM in eighth notes. Raise the tempo by 5 only when a full pass is clean.</p>`, idea: w.tip,
        more: '<ul class="plain-list"><li>Thumb behind the neck, roughly opposite the middle finger.</li><li>Press just behind the fret, with only as much force as the note needs.</li><li>Stop if anything hurts. Warm-ups should feel easy.</li></ul>', hint: '<kbd>Space</kbd> play or stop · <kbd>M</kbd> metronome' }),
    });
    neck.show({ notes: seq.filter((n, i) => seq.findIndex((m) => m.s === n.s && m.f === n.f) === i).map((n) => ({ s: n.s, f: n.f, label: n.finger, role: 'ext' })), window: [Math.min(...fs), Math.max(...fs)] });
    const toggle = () => (drill.off ? stopDrill() : runSequence(seq, p.rate));
    cur = { play: toggle, drill: toggle };
  }
  const progBars = (prog) => T.progChords(state.key, prog).map((b) => ({ roman: b.roman, chord: chordOf(b.chord.root, b.chord.id) }));
  function renderProg(prog) {
    const bars = progBars(prog), p = state.practice;
    p.bar = Math.min(p.bar, bars.length - 1);
    const b = bars[p.bar], v = b.chord.voicings[0];
    ui({
      side: keysHTML() + practiceSide(), crumbs: 'Practice / Chord changes', title: `${prog.name} in ${state.key}`, chips: pill(`${bars.length} bars`) + pill('one chord per bar'), lede: prog.text,
      tiles: tilesHTML([['Now', `${b.roman} · ${esc(b.chord.name)}`], ['Next', esc(bars[(p.bar + 1) % bars.length].chord.name)], ['Tempo', Metro.bpm + ' BPM']]),
      actions: capoHTML() + `<button class="btn" data-act="drill">▶ Play</button>`,
      railHead: `<span>Progression</span><small>${bars.length} bars</small>`,
      rail: `<div class="thumbs">${bars.map((x, k) => thumbHTML(x.chord.voicings[0], `data-act="bar" data-i="${k}"`, k === p.bar, k + 1, `${x.roman} · ${esc(x.chord.name)}`)).join('')}</div>`,
      panel: stepCard({ no: 'Chord changes', tag: `${bars.length} bars`, title: prog.name, body: `<p>${prog.text}</p><p>Press Play. The chord changes on beat one of each bar and is strummed on every beat.</p>`,
        idea: 'Change chords in time even if a finger lands late. Keeping the beat matters more than a perfect chord.', more: `<div class="nav"><button class="btn primary" data-act="open-chord" data-root="${b.chord.root}" data-id="${b.chord.id}">All ${esc(b.chord.name)} voicings</button></div>`, hint: '<kbd>Space</kbd> play or stop · <kbd>M</kbd> metronome' }),
    });
    showVoicing(b.chord, v);
    const toggle = () => {
      if (drill.off) return stopDrill();
      startDrill(Metro.TPB, (i, time) => {
        const beat = i % Metro.beats, bar = Math.floor(i / Metro.beats) % bars.length, x = bars[bar].chord.voicings[0];
        if (beat === 0) Audio.at(time - 0.03, () => {
          if (!drill.off) return;
          p.bar = bar; showVoicing(bars[bar].chord, x);
          document.querySelectorAll('#rail .thumb').forEach((t, k) => t.classList.toggle('on', k === bar));
          const tiles = $('tiles').children;
          tiles[0].lastElementChild.innerHTML = `${bars[bar].roman} · ${esc(bars[bar].chord.name)}`;
          tiles[1].lastElementChild.innerHTML = esc(bars[(bar + 1) % bars.length].chord.name);
        });
        strum(x.frets, { when: time, gap: 0.016, vel: beat === 0 ? 1 : 0.55 }).forEach((h) => Audio.at(h.at, () => neck.pulse(h.s, h.f)));
      });
    };
    cur = { play: toggle, drill: toggle, next: () => go({ practice: { bar: (p.bar + 1) % bars.length } }), prev: () => go({ practice: { bar: (p.bar + bars.length - 1) % bars.length } }) };
  }
  // ---------- fretboard exercises ----------
  const IVN = ['unison', 'minor 2nd', 'major 2nd', 'minor 3rd', 'major 3rd', 'perfect 4th', 'tritone', 'perfect 5th', 'minor 6th', 'major 6th', 'minor 7th', 'major 7th', 'octave'];
  const IVS = ['P1', 'm2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'];
  const IV_LEVEL = [[4, 5, 7, 12], [2, 3, 4, 5, 7, 10, 11, 12], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]];
  const LEVELS = ['Natural notes, frets 0–5', 'Natural notes, frets 0–12', 'All twelve notes, frets 0–12'];
  const IV_LEVELS = ['3rd, 4th, 5th, octave', 'Common intervals', 'All twelve intervals'];
  const EXS = [
    { id: 'quiz', name: 'Name that note', lede: 'One peg appears on the neck. Pick its note name, and say it out loud as you answer.',
      title: 'Finding notes fast', body: 'Work from landmarks instead of counting up from the nut every time.', idea: 'Know the open strings, fret 5 (the next string’s open note, except on string 3) and fret 12 (the open note again). Everything else is one or two frets from a landmark.',
      tips: ['B–C and E–F are one fret apart. All other natural notes are two.', 'Strings 6 and 1 have the same note names at every fret.', 'Aim for under two seconds per answer before raising the level.'] },
    { id: 'find', name: 'Find the note', lede: 'You are given a note and a string. Click the fret where that note lives.',
      title: 'From name to place', body: 'Naming a note you can see is recognition. Finding a note you are asked for is recall, and it is the skill you use when reading or improvising.', idea: 'Start from the open string and walk the natural notes: on the A string, A-B-C is frets 0-2-3. With practice you jump straight there.',
      tips: ['Do this with the guitar in your hands: click, then play the note.', 'Work one string per day for a week.', 'Sharps are one fret above the natural; flats one fret below.'] },
    { id: 'findall', name: 'Find them all', lede: 'Find the same note once on every string. Click the six places.',
      title: 'One note, six strings', body: 'This is the exercise guitar teachers assign more than any other, because it ties the whole neck together.', idea: 'Use octave shapes: from strings 6 or 5, go two strings up and two frets up. From strings 4 or 3, two strings up and three frets up. Strings 6 and 1 share the same fret.',
      tips: ['On the instrument, do it with a metronome: one note per click, low string to high and back.', 'Jazz teachers call this the “note of the day”.', 'Each note appears once per string below fret 12.'] },
    { id: 'interval', name: 'Find the interval', lede: 'From the gold root, click the note that is the named interval above it.',
      title: 'Intervals from a root', body: 'Chords and melodies are intervals. If you can find a 3rd or a 7th from any root, you can build any chord anywhere without a chart.', idea: 'Next string, same fret is a 4th. One fret back from that is a major 3rd; two frets up from it is a 5th. Add one fret whenever you cross from string 3 to string 2.',
      tips: ['There is often more than one right place. Any of them counts.', 'After each answer, play both notes on your guitar and sing the upper one.', 'Minor intervals are one fret below their major versions.'] },
    { id: 'nameiv', name: 'Name the interval', lede: 'Two notes appear. Name the distance from the gold one up to the other.',
      title: 'Seeing and hearing distance', body: 'Press “Hear it” before you answer. The goal is to recognise the shape and the sound together.', idea: 'Count frets if you must: 3 = minor 3rd, 4 = major 3rd, 5 = 4th, 7 = 5th, 12 = octave. Then learn each as a shape so you stop counting.',
      tips: ['Song cues help: a 4th is “Here Comes the Bride”, a 5th is “Twinkle Twinkle”, an octave is “Somewhere Over the Rainbow”.', 'A tritone is three whole steps, exactly half an octave.', 'Sing the top note back after you hear it.'] },
    { id: 'walk', name: 'Note walk', lede: 'The natural notes along one string, played in time. Say each name as it sounds.',
      title: 'One string at a time', body: 'Segovia taught the neck one string at a time, and so do most jazz teachers. Play along on your own guitar: one finger is fine.', idea: 'Notice the two half steps, B–C and E–F. On every string they are the only places where two natural notes sit on neighbouring frets.',
      tips: ['Say the names out loud. Speaking is what makes them stick.', 'When it is easy, say the names going down as well as up.', 'Then do it with your eyes closed.'] },
  ];
  const rnd = (n) => Math.floor(Math.random() * n), pickOf = (a) => a[rnd(a.length)];
  const pcAt = (s, f) => T.mod(T.TUNING[s] + f), isNat = (pcv) => T.noteName(pcv).length === 1;
  const same = (a, b) => a && b && a.s === b.s && a.f === b.f;
  function newQuestion(id) {
    const lv = state.practice.level, maxF = lv === 1 ? 5 : 12, pool = [];
    for (let s = 0; s < 6; s++) for (let f = 0; f <= maxF; f++) if (lv === 3 || isNat(pcAt(s, f))) pool.push({ s, f });
    let q;
    if (id === 'quiz') q = pickOf(pool);
    else if (id === 'find') { const c = pickOf(pool); q = { s: c.s, pc: pcAt(c.s, c.f) }; }
    else if (id === 'findall') q = { pc: pickOf([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].filter((p) => lv === 3 || isNat(p))), found: [], miss: 0 };
    else {
      const iv = pickOf(IV_LEVEL[lv - 1]), s = rnd(5), f = 1 + rnd(9), targets = [];
      for (let t = 0; t < 6; t++) { const ft = T.TUNING[s] + f + iv - T.TUNING[t]; if (ft >= 0 && ft <= 15) targets.push({ s: t, f: ft }); }
      const second = targets.slice().sort((a, b) => Math.abs(a.f - f) - Math.abs(b.f - f) || (a.s === s) - (b.s === s))[0];
      q = { s, f, iv, targets, second };
    }
    const keep = quiz && quiz.id === id ? quiz : { id, score: 0, total: 0, streak: 0, best: +store.get('best-' + id, 0) || 0 };
    quiz = Object.assign(keep, { q, done: false, ok: false, pick: null, wrong: null, msg: '' });
  }
  function mark(ok) {
    quiz.done = true; quiz.ok = ok; quiz.total++;
    if (ok) { quiz.score++; quiz.streak++; if (quiz.streak > quiz.best) { quiz.best = quiz.streak; store.set('best-' + quiz.id, quiz.best); } } else quiz.streak = 0;
  }
  function renderExercise(ex) {
    if (!quiz || quiz.id !== ex.id) newQuestion(ex.id);
    const q = quiz.q, id = ex.id, isIv = id === 'interval' || id === 'nameiv', lv = state.practice.level;
    const strName = (s) => `string ${6 - s} (${T.OPEN[s]})`;
    let prompt, notes = [], rail = '', win = null, hear = null;
    const next = quiz.done ? '<button class="btn primary" data-act="next">Next →</button>' : '<button class="btn ghost" data-act="skip">Skip</button>';
    const verdict = quiz.done ? `<span class="verdict ${quiz.ok ? 'good' : 'bad'}">${quiz.ok ? 'Correct' : 'Not quite'}</span>` : '';
    if (id === 'quiz') {
      const pcv = pcAt(q.s, q.f);
      prompt = `Which note is on ${strName(q.s)}, ${q.f ? 'fret ' + q.f : 'open'}?`;
      notes = [{ s: q.s, f: q.f, label: quiz.done ? T.noteName(pcv) : '?', role: !quiz.done ? 'fifth' : quiz.ok ? 'root' : 'guide' }];
      rail = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].filter((n) => lv === 3 || isNat(n)).map((n) => `<button class="posbtn ans${quiz.done && n === pcv ? ' good' : quiz.pick === n ? ' bad' : ''}" data-act="answer" data-i="${n}" ${quiz.done ? 'disabled' : ''}>${T.noteName(n)}</button>`).join('');
      hear = () => playNotes([q]);
    } else if (id === 'find') {
      prompt = `Find <b>${T.noteName(q.pc)}</b> on ${strName(q.s)}.`;
      if (quiz.done) { for (let f = 0; f <= 15; f++) if (pcAt(q.s, f) === q.pc) notes.push({ s: q.s, f, label: T.noteName(q.pc), role: 'root' }); if (!quiz.ok) notes.push({ s: quiz.pick.s, f: quiz.pick.f, label: T.noteName(pcAt(quiz.pick.s, quiz.pick.f)), role: 'guide' }); }
    } else if (id === 'findall') {
      prompt = `Find <b>${T.noteName(q.pc)}</b> on every string. ${new Set(q.found.map((n) => n.s)).size} of 6 found${q.miss ? `, ${q.miss} miss${q.miss > 1 ? 'es' : ''}` : ''}.`;
      notes = q.found.map((n) => ({ s: n.s, f: n.f, label: T.noteName(q.pc), role: 'root' }));
      if (quiz.wrong) notes.push({ s: quiz.wrong.s, f: quiz.wrong.f, label: T.noteName(pcAt(quiz.wrong.s, quiz.wrong.f)), role: 'guide' });
    } else {
      const rootName = T.noteName(pcAt(q.s, q.f));
      if (id === 'interval') {
        prompt = `From ${rootName}, find a <b>${IVN[q.iv]}</b> above.`;
        notes = [{ s: q.s, f: q.f, label: rootName, role: 'root' }];
        if (quiz.done) { q.targets.forEach((t) => notes.push({ s: t.s, f: t.f, label: IVS[q.iv], role: 'ext' })); if (!quiz.ok) notes.push({ s: quiz.pick.s, f: quiz.pick.f, label: '×', role: 'guide' }); }
        hear = () => playNotes([q, q.targets[0]]);
      } else {
        prompt = `What is the interval from ${rootName} up to the other note?`;
        notes = [{ s: q.s, f: q.f, label: rootName, role: 'root' }, { s: q.second.s, f: q.second.f, label: quiz.done ? IVS[q.iv] : '?', role: quiz.done ? 'ext' : 'fifth' }];
        rail = IV_LEVEL[lv - 1].map((n) => `<button class="posbtn ans wide${quiz.done && n === q.iv ? ' good' : quiz.pick === n ? ' bad' : ''}" data-act="answer" data-i="${n}" ${quiz.done ? 'disabled' : ''}>${IVS[n]}<small>${IVN[n]}</small></button>`).join('');
        hear = () => playNotes([q, q.second]);
      }
      win = [Math.max(1, q.f - 1), q.f + 1];
    }
    ui({
      side: practiceSide(), crumbs: 'Practice / Fretboard', title: ex.name, chips: pill(isIv ? IV_LEVELS[lv - 1] : LEVELS[lv - 1]), lede: ex.lede,
      tiles: tilesHTML([['Score', `${quiz.score} / ${quiz.total}`], ['Streak', quiz.streak], ['Best streak', quiz.best]]),
      actions: `<div class="stepper"><span>Level</span><button data-act="level" data-d="-1">−</button><b>${lv}</b><button data-act="level" data-d="1">+</button></div>${hear ? '<button class="btn" data-act="play">▶ Hear it</button>' : ''}<button class="btn" data-act="reset-score">↺ Reset score</button>`,
      railHead: `<span>Question ${quiz.total + (quiz.done ? 0 : 1)}</span>${verdict}`,
      rail: `<p class="prompt">${prompt}</p>${quiz.msg ? `<p class="muted">${quiz.msg}</p>` : ''}<div class="thumbs">${rail}${next}</div>${rail ? '' : '<p class="muted">Click the neck where the note is. Fret numbers run along the front edge; the low E string is nearest you.</p>'}`,
      panel: stepCard({ no: 'Exercise', tag: 'Fretboard', title: ex.title, body: `<p>${ex.body}</p>`, idea: ex.idea, more: `<ul class="plain-list">${ex.tips.map((t) => `<li>${t}</li>`).join('')}</ul>`, hint: '<kbd>→</kbd> next question' + (hear ? ' · <kbd>Space</kbd> hear it' : '') }),
    });
    neck.show({ notes, window: id === 'quiz' ? (q.f ? [q.f, q.f] : null) : win });
    if (!rail) neck.setPick((s, f) => {
      if (quiz.done) return;
      quiz.msg = '';
      if (id === 'find') {
        if (s !== q.s) quiz.msg = `That was ${strName(s)}. Look on ${strName(q.s)}.`;
        else { quiz.pick = { s, f }; mark(pcAt(s, f) === q.pc); }
      } else if (id === 'findall') {
        if (pcAt(s, f) === q.pc) { quiz.wrong = null; if (!q.found.some((n) => n.s === s)) q.found.push({ s, f }); if (new Set(q.found.map((n) => n.s)).size === 6) mark(q.miss === 0); }
        else { q.miss++; quiz.wrong = { s, f }; }
      } else { quiz.pick = { s, f }; mark(q.targets.some((t) => same(t, { s, f }))); }
      render();
      Audio.pluck(T.TUNING[s] + f, 0, 0.9, s); neck.pulse(s, f);
    });
    cur = { play: hear || undefined, ok: (a) => a !== 'next' || quiz.done, next: () => { if (quiz.done) { newQuestion(id); render(); if (cur.play && id !== 'interval') cur.play(); } } };
  }
  function renderWalk(ex) {
    const p = state.practice, s = 6 - p.string, up = [];
    for (let f = 0; f <= 12; f++) if (isNat(pcAt(s, f))) up.push({ s, f, label: T.noteName(pcAt(s, f)), role: f === 0 || f === 12 ? 'root' : 'ext' });
    const seqn = up.concat(up.slice(1, -1).reverse());
    ui({
      side: practiceSide(), crumbs: 'Practice / Fretboard', title: `${ex.name}: string ${p.string}`, chips: pill('Natural notes') + pill('Frets 0 to 12'), lede: ex.lede,
      tiles: tilesHTML([['String', `${p.string} · ${T.OPEN[s]}`], ['Notes', up.map((n) => n.label).join(' ')], ['Tempo', Metro.bpm + ' BPM']]),
      actions: `<div class="stepper"><span>String</span><button data-act="wstring" data-d="1">−</button><b>${p.string}</b><button data-act="wstring" data-d="-1">+</button></div><button class="btn" data-act="drill">▶ Play</button>`,
      railHead: '<span>Settings</span>', rail: `<div class="drillbar"><label>Speed ${rateSelect(p.rate)}</label><span class="muted">Start with quarter notes at 60 BPM. Play along on your own guitar and say each name.</span></div>`,
      panel: stepCard({ no: 'Drill', tag: 'Fretboard', title: ex.title, body: `<p>${ex.body}</p>`, idea: ex.idea, more: `<ul class="plain-list">${ex.tips.map((t) => `<li>${t}</li>`).join('')}</ul>`, hint: '<kbd>Space</kbd> play or stop · <kbd>M</kbd> metronome' }),
    });
    neck.show({ notes: up, window: [1, 12] });
    const toggle = () => (drill.off ? stopDrill() : runSequence(seqn, p.rate));
    cur = { play: toggle, drill: toggle };
  }
  function renderPractice() {
    if (((window.G.KeyViews || {}).practiceIds || []).includes(state.practice.id)) state.practice.id = T.WARMUPS[0].id; // arriving from a keyboard-only exercise
    const id = state.practice.id, w = T.WARMUPS.find((x) => x.id === id), prog = T.PROGS.find((x) => x.id === id), ex = EXS.find((x) => x.id === id) || EXS[0];
    if (w) renderWarmup(w); else if (prog) renderProg(prog); else if (ex.id === 'walk') renderWalk(ex); else renderExercise(ex);
  }

  // what the keyboard views (keysviews.js) are given to work with
  const CTX = { state, go: (p) => go(p), ui, keys, neck, esc, chipsHTML, pill, tilesHTML, keysHTML, stepCard, navHTML, folder, openFolders, scaleChords, circleSVG, rateSelect,
    startDrill, stopDrill, drill, stopPlayback, busyFor, tooSoon, untooSoon: () => { lastPlay = 0; }, insightCard, FN_TEXT, setCur: (o) => { cur = o; } };

  // ---------- routing ----------
  const VIEWS = { learn: renderLearn, chords: renderChords, scales: renderScales, circle: renderCircle, practice: renderPractice };
  function hashFor() {
    const k = T.slug(state.key), s = state;
    return '#' + (lead() === 'keys' ? 'k-' : '') + ({ learn: `learn-${LS().id}-${LS().step + 1}`, chords: `chords-${k}-${s.chords.id}-${s.chords.vi + 1}`, scales: `scales-${k}-${s.scales.id}-${s.scales.pos}`, circle: `circle-${k}`, practice: `practice-${k}-${s.practice.id}` })[s.view];
  }
  function readHash() {
    let raw = ''; try { raw = decodeURIComponent(location.hash); } catch (e) { /* malformed link: open the default page */ }
    const p = raw.replace(/^#\/?/, '').split('-');
    const hadK = p[0] === 'k';
    if (hadK) { p.shift(); if (VIEWS[p[0]]) state.inst = 'keys'; }
    if (!VIEWS[p[0]]) return;
    state.view = p[0];
    const key = (x) => { const k = T.KEYS.find((n) => T.slug(n) === x); if (k) state.key = k; };
    if (p[0] === 'learn') {
      const st = { id: p[1], step: (parseInt(p[2], 10) || 1) - 1 };
      if (KL.some((l) => l.id === p[1])) { state.klearn = st; state.inst = 'keys'; } else if (LESSONS.some((l) => l.id === p[1])) { state.learn = st; if (!hadK) state.inst = 'guitar'; }
    }
    else if (p[0] === 'chords') { key(p[1]); if (p[2]) state.chords.id = p[2]; state.chords.vi = (parseInt(p[3], 10) || 1) - 1; }
    else if (p[0] === 'scales') { key(p[1]); if (T.SCALES.some((s) => s.id === p[2])) state.scales.id = p[2]; state.scales.pos = parseInt(p[3], 10) || 0; }
    else if (p[0] === 'circle') key(p[1]);
    else if (p[0] === 'practice') { key(p[1]); if (p[2]) state.practice.id = p[2]; }
  }
  function render() {
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('on', t.dataset.v === state.view));
    const lay = $('layout');
    const li = lead(), learnKeys = state.view === 'learn' && li === 'keys';
    lay.dataset.view = state.view; lay.dataset.inst = li; lay.dataset.show = learnKeys ? 'keys' : state.both ? 'both' : li;
    document.querySelectorAll('#inst button').forEach((b) => b.classList.toggle('on', b.dataset.i === li));
    $('inst').hidden = state.view === 'learn';
    $('bothBtn').hidden = learnKeys;
    const other = li === 'keys' ? 'guitar neck' : 'keyboard';
    $('bothBtn').textContent = state.both ? `Hide the ${other}` : `Also show the ${other}`;
    $('bothBtn').title = `Sound comes from the ${li === 'keys' ? 'keyboard' : 'guitar'}; the ${other} only shows the same notes.`;
    keys.setPick((midi) => { Audio.key(midi, 0, 0.9); keys.pulse(midi); }); // click any key to hear it
    neck.setPick((s, f) => { const fr = Math.max(f, state.view === 'learn' ? 0 : state.capo); Audio.pluck(T.TUNING[s] + fr, 0, 0.9, s); neck.pulse(s, fr); }); // click any note to hear it
    const kv = li === 'keys' && window.G.KeyViews[state.view];
    if (kv) kv(CTX); else VIEWS[state.view]();
    const atlas = 'Fretboard';
    const h = hashFor();
    if (location.hash !== h) history.replaceState(null, '', h);
    document.title = `${$('title').textContent} · ${atlas} Atlas`;
  }
  // merge a patch into state (one level deep) and redraw
  function go(patch) {
    stopDrill(); stopPlayback();
    for (const k in patch) { if (patch[k] && typeof patch[k] === 'object') Object.assign(state[k], patch[k]); else state[k] = patch[k]; }
    render();
  }

  // ---------- events ----------
  const ACT = {
    view: (d) => go({ view: d.v }),
    guide: () => (Guide.on ? pauseGuide() : playGuide()),
    gseek: (d) => seekGuide(+d.i), gprev: () => seekGuide(Guide.idx - 1), gnext: () => seekGuide(Guide.idx + 1),
    inst: (d) => { store.set('inst', d.i); quiz = null; go({ inst: d.i, capo: d.i === 'keys' ? 0 : state.capo }); },
    both: () => { store.set('pair', !state.both); go({ both: !state.both }); },
    'hear-move': (d) => cur.hear && cur.hear(d.root, d.id),
    soct: (d) => go({ scales: { oct: +d.i } }),
    shand: (d) => go({ scales: { hand: d.h } }),
    key: (d) => { go({ key: d.k, circle: { ci: 0 }, practice: { bar: 0 } }); if (state.view === 'circle' && cur.play) cur.play(); }, // picking a key on the circle sounds its home chord
    capo: (d) => go({ capo: Math.max(0, Math.min(9, state.capo + +d.d)) }),
    fold: (d, el) => { const f = el.closest('.fam'), open = f.classList.toggle('open'); openFolders[open ? 'add' : 'delete'](f.dataset.fold); },
    lesson: (d) => go({ [lk()]: { id: d.id, step: 0 } }),
    step: (d) => go({ [lk()]: { step: +d.i } }),
    chord: (d) => go({ chords: { id: d.id, vi: 0, chart: false } }),
    voicing: (d) => { go({ chords: Object.assign({ vi: +d.i, chart: false }, d.id ? { id: d.id } : {}) }); cur.play && cur.play(); if (d.id) window.scrollTo(0, 0); },
    chart: () => go({ chords: { chart: !state.chords.chart } }),
    scale: (d) => go({ scales: { id: d.id, pos: 1, chord: -1 } }),
    schord: (d) => go({ scales: { chord: +d.i } }),
    restart: () => { delete doneOf()[LS().id]; saveDone(); go({ [lk()]: { step: 0 } }); window.scrollTo(0, 0); },
    'reset-ask': () => { confirmReset = true; render(); },
    'reset-no': () => { confirmReset = false; render(); },
    'reset-all': () => { const dn = doneOf(); for (const k in dn) delete dn[k]; saveDone(); confirmReset = false; go({ [lk()]: { id: course()[0].id, step: 0 } }); },
    'reset-score': () => { quiz = null; render(); },
    pos: (d) => go({ scales: { pos: +d.i } }),
    sev: () => go({ circle: { sev: !state.circle.sev } }),
    dia: (d) => { go({ circle: { ci: +d.i } }); cur.play(); },
    'open-chord': (d) => { go({ view: 'chords', key: T.KEYS[T.pc(d.root)], chords: { id: d.id, vi: 0, chart: false } }); window.scrollTo(0, 0); },
    practice: (d) => { quiz = null; go({ practice: { id: d.id, bar: 0 } }); },
    wfret: (d) => go({ practice: { fret: Math.max(1, Math.min(12, state.practice.fret + +d.d)) } }),
    bar: (d) => { go({ practice: { bar: +d.i } }); playVoicing(progBars(T.PROGS.find((x) => x.id === state.practice.id))[+d.i].chord.voicings[0]); },
    answer: (d) => { quiz.pick = +d.i; mark(quiz.pick === (quiz.id === 'quiz' ? pcAt(quiz.q.s, quiz.q.f) : quiz.q.iv)); render(); },
    skip: () => { newQuestion(quiz.id); render(); },
    level: (d) => { quiz = null; go({ practice: { level: Math.max(1, Math.min(3, state.practice.level + +d.d)) } }); },
    wstring: (d) => go({ practice: { string: Math.max(1, Math.min(6, state.practice.string + +d.d)) } }),
    goto: (d) => { location.hash = d.h; window.scrollTo(0, 0); },
    play: () => cur.play && cur.play(), alt: () => cur.alt && cur.alt(), drill: () => cur.drill && cur.drill(),
    next: () => cur.next && cur.next(), prev: () => cur.prev && cur.prev(), up: () => cur.up && cur.up(), down: () => cur.down && cur.down(),
    bpm: (d) => Metro.setBpm(Metro.bpm + +d.d),
  };
  window.G.App = { can: (a) => typeof cur[a] === 'function' && (!cur.ok || cur.ok(a)) };
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (Guide.on && el && !['guide', 'gseek', 'gprev', 'gnext', 'bpm', 'fold'].includes(el.dataset.act)) pauseGuide(); // taking the wheel pauses the guide; it resumes from here
    if (el && !el.disabled && ACT[el.dataset.act]) ACT[el.dataset.act](el.dataset, el);
    const set = $('settings');
    if (set.open && !e.target.closest('#settings')) set.open = false;
  });
  document.addEventListener('change', (e) => {
    const c = e.target.dataset.change;
    if (c === 'chord') go({ chords: { id: e.target.value, vi: 0 } });
    else if (c === 'pattern') go({ scales: { pattern: e.target.value } });
    else if (c === 'rate') go(state.view === 'scales' ? { scales: { rate: +e.target.value } } : { practice: { rate: +e.target.value } });
  });
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    const map = { ArrowRight: 'next', ArrowLeft: 'prev', ArrowDown: 'down', ArrowUp: 'up', ' ': 'play' };
    if (e.repeat) { if (e.key === ' ') e.preventDefault(); return; }
    if (Guide.on && (e.key === 'Escape' || e.key.startsWith('Arrow') || e.key === ' ')) { pauseGuide(); if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') { e.preventDefault(); return; } } // holding a key down must not retrigger
    if (e.key === 'm' || e.key === 'M') $('mPlay').click();
    else if (map[e.key] && cur[map[e.key]]) cur[map[e.key]]();
    else return;
    e.preventDefault();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { pauseGuide(); stopDrill(); stopPlayback(); if (Metro.on) Metro.stop(); } });
  window.addEventListener('hashchange', () => { if (location.hash !== hashFor()) { pauseGuide(); stopDrill(); stopPlayback(); quiz = null; readHash(); render(); } });

  // metronome widget
  function metroUI() {
    $('mPlay').textContent = Metro.on ? '■' : '▶';
    $('metro').classList.toggle('on', Metro.on);
    if (document.activeElement !== $('mBpm')) $('mBpm').value = Metro.bpm;
    if ($('mDots').children.length !== Metro.beats) $('mDots').innerHTML = Array.from({ length: Metro.beats }, () => '<i></i>').join('');
    if (!Metro.on) [...$('mDots').children].forEach((d) => d.classList.remove('on'));
    document.querySelectorAll('.tile').forEach((t) => { if (t.firstElementChild.textContent === 'Tempo') t.lastElementChild.textContent = Metro.bpm + ' BPM'; });
    store.set('bpm', Metro.bpm);
  }
  Metro.onstate = metroUI;
  Metro.onbeat = (beat) => { const dots = $('mDots').children; for (let i = 0; i < dots.length; i++) dots[i].classList.toggle('on', i === beat); };
  $('mPlay').addEventListener('click', () => { stopPlayback(); if (Metro.on) { stopDrill(); Metro.stop(); } else Metro.start(); });
  $('mTap').addEventListener('click', () => Metro.tap());
  $('mBpm').addEventListener('change', (e) => Metro.setBpm(+e.target.value));
  $('mSig').addEventListener('change', (e) => { Metro.beats = +e.target.value; metroUI(); });

  // settings
  { const a = obj(store.get('audio2', {})), s = Audio.settings; // each field checked: a bad volume would otherwise silence everything
    if (typeof a.tone === 'string') s.tone = a.tone; if (typeof a.keysTone === 'string') s.keysTone = a.keysTone; if (typeof a.tremolo === 'boolean') s.tremolo = a.tremolo;
    if (Number.isFinite(a.volume)) s.volume = Math.max(0, Math.min(1, a.volume)); }
  Metro.bpm = Math.max(30, Math.min(260, +store.get('bpm', 90) || 90)); Metro.click = store.get('click', true) !== false;
  $('sKeysTone').value = Audio.settings.keysTone; $('sTrem').checked = Audio.settings.tremolo;
  $('sKeysTone').addEventListener('change', (e) => { Audio.settings.keysTone = e.target.value; saveAudio(); });
  $('sTrem').addEventListener('change', (e) => { Audio.settings.tremolo = e.target.checked; saveAudio(); });
  const fillVoices = () => {
    const nv = $('sNarr'); if (nv) { const b = bestVoice(); nv.textContent = b ? b.name.replace(/Microsoft | Online \(Natural\)| - English.*/g, '') : ('speechSynthesis' in window ? 'your device’s voice' : 'no voice on this browser'); }
    if (!$('sVoice')) return;
    if (!('speechSynthesis' in window)) { $('sVoice').innerHTML = '<option>No voices on this browser</option>'; $('sVoice').disabled = true; return; }
    const vs = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang));
    $('sVoice').innerHTML = '<option value="">Default voice</option>' + vs.map((v) => `<option value="${esc(v.name)}"${v.name === Guide.voice ? ' selected' : ''}>${esc(v.name.replace(/Microsoft | Online \(Natural\)| - English.*/g, ''))}</option>`).join('');
  };
  fillVoices();
  if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = fillVoices;
  Guide.recorded = store.get('grec2', false) === true; $('sRec').checked = Guide.recorded; // off unless chosen: the studio takes vary from line to line
  $('sRec').addEventListener('change', (e) => { Guide.recorded = e.target.checked; store.set('grec2', Guide.recorded); });
  $('sRate').value = Guide.rate;
  $('sRate').addEventListener('change', (e) => { Guide.rate = +e.target.value; store.set('grate', Guide.rate); });
  $('sTone').value = Audio.settings.tone; $('sVol').value = Audio.settings.volume;
  $('sLabels').value = state.labels; $('sClick').checked = Metro.click; $('sGhost').checked = state.ghost;
  const saveAudio = () => { Audio.apply(); store.set('audio2', Audio.settings); };
  $('sTone').addEventListener('change', (e) => { Audio.settings.tone = e.target.value; saveAudio(); if (!drill.off && cur.play) cur.play(); });
  $('sVol').addEventListener('input', (e) => { Audio.settings.volume = +e.target.value; saveAudio(); });
  $('sLabels').addEventListener('change', (e) => { state.labels = e.target.value; store.set('labels', state.labels); go({}); });
  $('sClick').addEventListener('change', (e) => { Metro.click = e.target.checked; store.set('click', Metro.click); });
  $('sGhost').addEventListener('change', (e) => { state.ghost = e.target.checked; store.set('ghost', state.ghost); go({}); });
  $('themeBtn').addEventListener('click', () => {
    const now = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = now === 'dark' ? 'light' : 'dark';
    store.set('theme', document.documentElement.dataset.theme);
  });
  const savedTheme = store.get('theme', null);
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;

  readHash();
  metroUI();
  render();
})();
