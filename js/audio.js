// Plucked-string synth (Karplus-Strong) with a body EQ and reverb, plus the metronome clock.
(() => {
  'use strict';
  const G = (window.G = window.G || {});
  const TONES = {
    soft: { body: 0, shelf: 0 },
    steel: { bright: 0.9, sustain: 5.5, pick: 0.13, body: 1, shelf: 0 },
    nylon: { bright: 0.38, sustain: 3.6, pick: 0.2, body: 1.4, shelf: -5 },
    electric: { bright: 0.62, sustain: 7, pick: 0.09, body: 0.25, shelf: -3 },
  };
  let ctx, master, dry, bodyIn, eq = {}, clickBus, keysIn, tremDepth, panDepth;
  const cache = new Map(), voices = {}, keyVoices = {}, live = new Set(), timers = new Set();
  const A = (G.Audio = { settings: { tone: 'soft', volume: 0.8, keysTone: 'rhodes', tremolo: true } });

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const bq = (type, freq, q, gain) => { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = freq; b.Q.value = q; b.gain.value = gain || 0; return b; };
    master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 3; comp.attack.value = 0.004; comp.release.value = 0.22;
    bodyIn = ctx.createGain();
    const hp = bq('highpass', 68, 0.7);
    eq.low = bq('peaking', 105, 1.3, 3); eq.mid = bq('peaking', 215, 1.5, 2.5); eq.nasal = bq('peaking', 950, 0.9, -2.5); eq.shelf = bq('highshelf', 4200, 0.7, 0);
    dry = ctx.createGain();
    bodyIn.connect(hp); hp.connect(eq.low); eq.low.connect(eq.mid); eq.mid.connect(eq.nasal); eq.nasal.connect(eq.shelf);
    eq.shelf.connect(dry);
    dry.connect(comp); comp.connect(master); master.connect(ctx.destination);
    clickBus = ctx.createGain(); clickBus.connect(master);
    // keys path: no guitar body EQ; a slow tremolo that also drifts left and right, like a suitcase Rhodes
    keysIn = ctx.createGain();
    const trem = ctx.createGain(), lfo = ctx.createOscillator();
    tremDepth = ctx.createGain(); lfo.frequency.value = 4.6; lfo.connect(tremDepth); tremDepth.connect(trem.gain);
    const warm = bq('lowpass', 5200, 0.5), lowcut = bq('highpass', 45, 0.7);
    keysIn.connect(lowcut); lowcut.connect(warm); warm.connect(trem);
    if (ctx.createStereoPanner) {
      const pan = ctx.createStereoPanner();
      panDepth = ctx.createGain(); lfo.connect(panDepth); panDepth.connect(pan.pan);
      trem.connect(pan); pan.connect(comp);
    } else trem.connect(comp);
    lfo.start();
    A.apply();
    return ctx;
  }
  A.apply = () => {
    if (!ctx) return;
    const t = TONES[A.settings.tone] || TONES.steel;
    master.gain.value = A.settings.volume;
    tremDepth.gain.value = A.settings.tremolo ? 0.16 : 0; if (panDepth) panDepth.gain.value = A.settings.tremolo ? 0.45 : 0;
    eq.low.gain.value = 3 * t.body; eq.mid.gain.value = 2.5 * t.body; eq.nasal.gain.value = -2.5 * t.body; eq.shelf.gain.value = t.shelf;
  };
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* not supported */ }
  A.resume = () => { if (ensure() && ctx.state !== 'running') ctx.resume(); return ctx; };
  A.now = () => (ctx ? ctx.currentTime : 0);
  // Phones keep audio locked until a touch starts it. Start it on the very first touch or key press, with one silent sample,
  // so the first real note is never swallowed; and wake it again whenever the page comes back from the background.
  if (typeof document !== 'undefined') {
    const unlock = () => {
      if (!ensure()) return;
      if (ctx.state !== 'running') ctx.resume();
      try { const s = ctx.createBufferSource(); s.buffer = ctx.createBuffer(1, 1, ctx.sampleRate); s.connect(ctx.destination); s.start(0); } catch (e) { /* nothing to unlock */ }
    };
    ['touchend', 'pointerup', 'keydown'].forEach((ev) => document.addEventListener(ev, unlock, { once: true, capture: true }));
    document.addEventListener('visibilitychange', () => { if (!document.hidden && ctx && ctx.state !== 'running') ctx.resume().catch(() => {}); });
  }

  // One Karplus-Strong string, rendered once per pitch and tone, then replayed from cache.
  A.render = (midi, toneName, sr) => {
    const t = TONES[toneName] || TONES.steel, f = 440 * Math.pow(2, (midi - 69) / 12);
    if (toneName === 'rhodes') { // a struck tine: a bell-like ping that melts into a round tone, with some bark low down
      const reg = Math.max(0, Math.min(1, (midi - 28) / 72)); // 0 = lowest key, 1 = highest
      const tau = 3.4 - 2.6 * reg, n = Math.floor(sr * Math.min(6, tau * 3.6 + 0.4)), o = new Float32Array(n), w = 2 * Math.PI * f / sr;
      const bark = 1.7 - 1.3 * reg, body = 0.22, bellR = 7.11, bellOn = f * bellR < sr * 0.42, bellAmp = 0.2 * (1 - 0.6 * reg);
      for (let i = 0; i < n; i++) {
        const x = i / sr, env = (1 - Math.exp(-x / 0.003)) * Math.exp(-x / tau);
        const idx = bark * Math.exp(-x / 0.22) + body; // the pickup's distortion fades as the tine settles
        let v = Math.sin(w * i + idx * Math.sin(w * i)) + 0.12 * Math.exp(-x / (tau * 0.4)) * Math.sin(2 * w * i);
        if (bellOn) v += bellAmp * Math.exp(-x / 0.09) * Math.sin(bellR * w * i);
        o[i] = 0.62 * env * v;
      }
      for (let i = 0, fd = Math.floor(sr * 0.06); i < fd; i++) o[n - 1 - i] *= i / fd;
      return { data: o, rate: 1 };
    }
    if (toneName === 'soft') { // a rounded, mostly-sine tone: fundamental plus two quiet harmonics that fade first
      const tau = Math.max(0.45, 1.15 - (midi - 40) * 0.013), n = Math.floor(sr * Math.min(4, tau * 5)), o = new Float32Array(n), w = 2 * Math.PI * f / sr;
      for (let i = 0; i < n; i++) {
        const x = i / sr, env = (1 - Math.exp(-x / 0.005)) * Math.exp(-x / tau);
        o[i] = 0.8 * env * (Math.sin(w * i) + 0.2 * Math.exp(-x * 4) * Math.sin(2 * w * i) + 0.05 * Math.exp(-x * 9) * Math.sin(3 * w * i));
      }
      for (let i = 0, fd = Math.floor(sr * 0.05); i < fd; i++) o[n - 1 - i] *= i / fd;
      return { data: o, rate: 1 };
    }
    const S = Math.max(0.3, Math.min(0.5, 0.5 - (midi - 52) * 0.007)); // less loop damping up the neck
    const N = Math.max(2, Math.round(sr / f + S));
    const T60 = t.sustain * (1 - (midi - 40) / 90), rho = Math.exp(-6.9 / (f * T60));
    const len = Math.floor(sr * Math.min(4.5, T60 * 0.8 + 0.6)), out = new Float32Array(len);
    const e = new Float32Array(N), d = new Float32Array(N);
    let lp = 0, sum = 0, peak = 0;
    const a = t.bright * (midi < 50 ? 0.75 : 1); // wound strings start a little darker
    for (let i = 0; i < N; i++) { lp += a * (Math.random() * 2 - 1 - lp); e[i] = lp; sum += lp; }
    const k = Math.max(1, Math.round(t.pick * N)); // comb filter = where along the string it is picked
    for (let i = 0; i < N; i++) { d[i] = e[i] - sum / N - (e[(i - k + N) % N] - sum / N); peak = Math.max(peak, Math.abs(d[i])); }
    for (let i = 0; i < N; i++) d[i] /= peak || 1;
    for (let i = 0, p = 0; i < len; i++) {
      const c = d[p], nx = d[p + 1 === N ? 0 : p + 1];
      out[i] = c;
      d[p] = rho * ((1 - S) * c + S * nx);
      if (++p === N) p = 0;
    }
    const fade = Math.floor(sr * 0.05);
    for (let i = 0; i < fade; i++) out[len - 1 - i] *= i / fade;
    for (let i = 0; i < 24; i++) out[i] *= i / 24;
    return { data: out, rate: (f * (N - S)) / sr };
  };

  A.pluck = (midi, when, vel = 1, stringIdx) => {
    if (!A.resume()) return;
    const key = A.settings.tone + midi;
    let c = cache.get(key);
    if (!c) {
      const r = A.render(midi, A.settings.tone, ctx.sampleRate);
      const buf = ctx.createBuffer(1, r.data.length, ctx.sampleRate);
      buf.getChannelData(0).set(r.data);
      c = { buf, rate: r.rate }; cache.set(key, c);
    }
    const at = Math.max(when || 0, ctx.currentTime);
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = c.buf; src.playbackRate.value = c.rate * (1 + (Math.random() - 0.5) * 0.0015);
    g.gain.value = 0.42 * vel;
    src.connect(g); g.connect(bodyIn); src.start(at);
    const voice = { src, g }; live.add(voice); src.onended = () => live.delete(voice);
    if (stringIdx != null) { // a string can only sound one note: damp the previous one
      const prev = voices[stringIdx];
      if (prev) { try { prev.gain.setTargetAtTime(0, at, 0.012); } catch (err) { /* already ended */ } }
      voices[stringIdx] = g;
    }
  };
  // one key of the keyboard; striking a key again damps its previous note
  A.key = (midi, when, vel = 1) => {
    if (!A.resume()) return;
    const tone = A.settings.keysTone === 'soft' ? 'soft' : 'rhodes', id = 'k' + tone + midi;
    let c = cache.get(id);
    if (!c) {
      const r = A.render(midi, tone, ctx.sampleRate), buf = ctx.createBuffer(1, r.data.length, ctx.sampleRate);
      buf.getChannelData(0).set(r.data);
      c = { buf, rate: r.rate }; cache.set(id, c);
    }
    const at = Math.max(when || 0, ctx.currentTime), src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = c.buf; src.playbackRate.value = c.rate;
    g.gain.value = 0.36 * vel;
    src.connect(g); g.connect(keysIn); src.start(at);
    const voice = { src, g }; live.add(voice); src.onended = () => live.delete(voice);
    const prev = keyVoices[midi];
    if (prev) { try { prev.gain.setTargetAtTime(0, at, 0.015); } catch (err) { /* already ended */ } }
    keyVoices[midi] = g;
  };
  // frets: six entries, string 6 → 1, null = not played
  A.strum = (frets, { gap = 0.03, vel = 1, up = false, when } = {}) => {
    if (!A.resume()) return [];
    const t0 = Math.max(when || 0, ctx.currentTime) + 0.02, order = [0, 1, 2, 3, 4, 5].filter((i) => frets[i] !== null), hits = [];
    if (up) order.reverse();
    order.forEach((i, n) => {
      const at = t0 + n * gap * (0.85 + Math.random() * 0.3);
      A.pluck(G.T.TUNING[i] + frets[i], at, vel * (0.85 + Math.random() * 0.2), i);
      hits.push({ s: i, f: frets[i], at });
    });
    return hits;
  };
  // run fn when the audio clock reaches `time`
  A.at = (time, fn) => { const id = setTimeout(() => { timers.delete(id); fn(); }, Math.max(0, (time - A.now()) * 1000)); timers.add(id); return id; };
  // stop everything that is sounding or queued, with a short fade so it does not click
  A.hush = () => {
    timers.forEach(clearTimeout); timers.clear();
    if (!ctx) return;
    const t = ctx.currentTime;
    live.forEach(({ src, g }) => { try { g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0, t, 0.012); src.stop(t + 0.08); } catch (e) { /* already stopped */ } });
    live.clear();
  };

  // ---------- metronome ----------
  const M = (G.Metro = { bpm: 90, beats: 4, on: false, click: true, TPB: 4, onbeat: null, onstate: null });
  const listeners = new Set(), taps = [];
  let tick = 0, next = 0, timer = null;
  function clickSound(time, accent) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = accent ? 1760 : 1175;
    g.gain.setValueAtTime(0.0001, time); g.gain.exponentialRampToValueAtTime(accent ? 0.5 : 0.3, time + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);
    o.connect(g); g.connect(clickBus); o.start(time); o.stop(time + 0.08);
  }
  function sched() {
    while (next < ctx.currentTime + 0.12) {
      const t = tick, time = next;
      if (t % M.TPB === 0) {
        const beat = (t / M.TPB) % M.beats;
        if (M.click) clickSound(time, beat === 0);
        setTimeout(() => M.onbeat && M.on && M.onbeat(beat), Math.max(0, (time - ctx.currentTime) * 1000));
      }
      listeners.forEach((fn) => fn(t, time));
      tick++; next += 60 / M.bpm / M.TPB;
    }
  }
  M.start = () => { if (!A.resume() || M.on) return; M.on = true; tick = 0; next = ctx.currentTime + 0.1; timer = setInterval(sched, 25); sched(); if (M.onstate) M.onstate(); };
  M.stop = () => { if (!M.on) return; M.on = false; clearInterval(timer); if (M.onstate) M.onstate(); };
  M.toggle = () => (M.on ? M.stop() : M.start());
  M.onTick = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
  M.setBpm = (v) => { M.bpm = Math.max(30, Math.min(260, Math.round(v) || 90)); if (M.onstate) M.onstate(); };
  M.tap = () => {
    const now = performance.now();
    if (taps.length && now - taps[taps.length - 1] > 2000) taps.length = 0;
    taps.push(now); if (taps.length > 5) taps.shift();
    if (taps.length > 1) M.setBpm(60000 / ((taps[taps.length - 1] - taps[0]) / (taps.length - 1)));
  };
})();
