// Listening to a real guitar. Sound comes in from an audio input (an interface such as a Scarlett, or a microphone),
// the pitch of each note is measured, and a "follow" run steps through a list of expected notes as they are played.
// Nothing is recorded or sent anywhere: the samples are analysed in the page and thrown away.
(() => {
  'use strict';
  const G = (window.G = window.G || {});
  const hzToMidi = (hz) => 69 + 12 * Math.log2(hz / 440);

  // Pitch of one frame of samples by the YIN method. Returns { hz, clarity } or null when there is no clear pitch.
  // Range about 70 Hz to 1400 Hz: the low E string up to the top of the neck.
  function detect(buf, sr) {
    const n = buf.length, half = Math.floor(n / 2), tMin = Math.max(2, Math.floor(sr / 1400)), tMax = Math.min(half - 1, Math.ceil(sr / 68));
    const d = new Float32Array(tMax + 2);
    let run = 0, best = -1;
    for (let tau = 1; tau <= tMax + 1; tau++) {
      let s = 0;
      for (let i = 0; i < half; i++) { const x = buf[i] - buf[i + tau]; s += x * x; }
      run += s; d[tau] = run ? (s * tau) / run : 1;
    }
    for (let tau = tMin; tau <= tMax; tau++) { if (d[tau] < 0.14) { while (tau + 1 <= tMax && d[tau + 1] < d[tau]) tau++; best = tau; break; } }
    if (best < 0) { let m = 1; for (let tau = tMin; tau <= tMax; tau++) if (d[tau] < m) { m = d[tau]; best = tau; } if (m > 0.3) return null; }
    const a = d[best - 1], b = d[best], c = d[best + 1], den = a - 2 * b + c, shift = den ? (a - c) / (2 * den) : 0;
    return { hz: sr / (best + (Math.abs(shift) < 1 ? shift : 0)), clarity: 1 - b };
  }

  const L = { supported: !!(typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia), on: false, error: '', last: null, level: 0 };
  let ctx = null, stream = null, src = null, taps = [], timer = null, subs = new Set(), floor = 0, lastAttack = 0, prevNote = null, steady = 0;
  const N = 2048;

  function wire(node, audioCtx) {
    ctx = audioCtx; src = node;
    const ch = Math.min(2, node.channelCount || 2), split = ctx.createChannelSplitter(2);
    node.connect(split);
    taps = [0, 1].slice(0, Math.max(1, ch)).map((k) => { const an = ctx.createAnalyser(); an.fftSize = N; an.smoothingTimeConstant = 0; split.connect(an, k); return { an, buf: new Float32Array(N) }; });
    floor = 0; lastAttack = 0; prevNote = null; steady = 0;
    clearInterval(timer); timer = setInterval(frame, 28);
    L.on = true; L.error = '';
  }
  function frame() {
    if (!taps.length) return;
    // an interface puts a guitar on one input, so use whichever channel is louder
    let pick = null, rms = 0;
    taps.forEach((t) => { t.an.getFloatTimeDomainData(t.buf); let s = 0; for (let i = 0; i < N; i++) s += t.buf[i] * t.buf[i]; const r = Math.sqrt(s / N); if (r >= rms) { rms = r; pick = t; } });
    L.level = rms;
    const now = performance.now(), out = { rms, t: now, note: null, midi: null, cents: 0, hz: 0, attack: false, steady: 0 };
    if (rms > 0.006 && pick) {
      const p = detect(pick.buf, ctx.sampleRate);
      if (p && p.hz > 60 && p.hz < 1500) { const m = hzToMidi(p.hz); out.midi = m; out.note = Math.round(m); out.cents = Math.round((m - out.note) * 100); out.hz = p.hz; }
    }
    // a new pluck shows as a jump in loudness after the last note has started to die away
    // (for a moment after a pluck the level is still rising, so the reference follows it up to its peak, then down as the note fades)
    if (now - lastAttack < 110) floor = Math.max(floor, rms); else if (rms < floor || !floor) floor = rms;
    if (rms > floor * 1.6 + 0.004 && now - lastAttack > 110) { out.attack = true; lastAttack = now; floor = rms; }
    // steadiness is counted afresh from each pluck: the frame that catches a pluck still mostly holds the note before it
    if (out.attack) steady = 0; else if (out.note != null && out.note === prevNote) steady++; else steady = out.note != null ? 1 : 0;
    prevNote = out.note; out.steady = steady;
    L.last = out;
    subs.forEach((fn) => { try { fn(out); } catch (e) { /* a listener's own error must not stop the loop */ } });
  }

  L.detect = detect;
  L.subscribe = (fn) => { subs.add(fn); return () => subs.delete(fn); };
  L.devices = async () => { try { return (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'audioinput'); } catch (e) { return []; } };
  L.start = async (deviceId) => {
    if (L.on) return true;
    if (!L.supported) { L.error = 'This browser cannot open an audio input.'; return false; }
    const A = G.Audio && G.Audio.resume && G.Audio.resume();
    if (!A) { L.error = 'Sound is not available in this browser.'; return false; }
    // raw input: the browser's voice processing would bend and gate a guitar
    const want = { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: { ideal: 2 } };
    try {
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: deviceId ? Object.assign({ deviceId: { exact: deviceId } }, want) : want }); }
      catch (e) { if (!deviceId) throw e; stream = await navigator.mediaDevices.getUserMedia({ audio: want }); }
      wire(A.createMediaStreamSource(stream), A);
      return true;
    } catch (e) { L.error = e && e.name === 'NotAllowedError' ? 'The browser was not given permission to use the audio input.' : 'No audio input could be opened. Check that the interface is connected and chosen.'; L.on = false; return false; }
  };
  L.stop = () => {
    clearInterval(timer); timer = null;
    try { if (src) src.disconnect(); } catch (e) { /* already gone */ }
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null; src = null; taps = []; L.on = false; L.last = null; L.level = 0;
  };
  // for testing without a guitar: analyse any audio node instead of an input
  L.attach = (node, audioCtx) => { L.stop(); wire(node, audioCtx); };

  // Step through expected notes as they are played. targets: [{ midis: [..] }] where any of the pitches (in any octave) counts.
  // on({ type: 'hit' | 'miss' | 'heard' | 'done', index, note, hits, misses }). Returns a function that stops the run.
  L.follow = (targets, on) => {
    let i = 0, hits = 0, misses = 0, used = null, t0 = performance.now();
    const off = L.subscribe((p) => {
      if (i >= targets.length) return;
      if (p.attack) used = null; // a new pluck may be judged again, even on the same pitch
      if (p.note == null || p.steady < 2) return;
      on({ type: 'heard', index: i, note: p.note, cents: p.cents, hits, misses });
      if (used === p.note) return;
      const ok = targets[i].midis.some((m) => ((m - p.note) % 12 + 12) % 12 === 0);
      if (!ok && p.steady < 4) return; // a wrong note must ring a little longer than a right one before it counts, so pick noise is not punished
      used = p.note;
      if (ok) { hits++; i++; on({ type: 'hit', index: i - 1, note: p.note, hits, misses }); if (i >= targets.length) { off(); on({ type: 'done', index: i, hits, misses, ms: performance.now() - t0 }); } }
      else { misses++; on({ type: 'miss', index: i, note: p.note, hits, misses }); }
    });
    return off;
  };
  G.Listen = L;

  // ---- the input chooser in the settings menu ----
  if (typeof document === 'undefined') return;
  const pop = document.querySelector('#settings .pop');
  if (!pop || !L.supported) return;
  const saved = () => { try { return JSON.parse(localStorage.getItem('fa.micdev') || '""'); } catch (e) { return ''; } };
  const box = document.createElement('div');
  box.innerHTML = '<label>Guitar input <select id="sMic"><option value="">Default input</option></select></label><label class="row"><button class="btn small" id="sMicTest" type="button">Test the input</button> <span id="sMicRead">not listening</span></label><p class="pop-note">Plug the guitar into input 1 of your interface and choose the interface here. Set its gain so your loudest strum stays out of the red. Nothing is recorded.</p>';
  while (box.firstChild) pop.appendChild(box.firstChild);
  const sel = document.getElementById('sMic'), read = document.getElementById('sMicRead'), test = document.getElementById('sMicTest');
  const NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
  L.noteName = (m) => NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
  const fill = async () => { const ds = await L.devices(), cur = saved(); sel.innerHTML = '<option value="">Default input</option>' + ds.filter((d) => d.deviceId && d.deviceId !== 'default').map((d, k) => `<option value="${d.deviceId}"${d.deviceId === cur ? ' selected' : ''}>${(d.label || 'Input ' + (k + 1)).replace(/[<&]/g, '')}</option>`).join(''); };
  L.deviceId = saved;
  sel.addEventListener('change', () => { try { localStorage.setItem('fa.micdev', JSON.stringify(sel.value)); } catch (e) { /* storage unavailable */ } if (L.on) { L.stop(); L.start(sel.value); } });
  let off = null;
  test.addEventListener('click', async () => {
    if (off) { off(); off = null; L.stop(); read.textContent = 'not listening'; test.textContent = 'Test the input'; return; }
    read.textContent = 'opening…';
    if (!(await L.start(saved()))) { read.textContent = L.error; return; }
    await fill(); test.textContent = 'Stop the test';
    off = L.subscribe((p) => { read.textContent = p.note != null ? `${L.noteName(p.note)} ${p.cents >= 0 ? '+' : ''}${p.cents} cents` : p.rms > 0.006 ? 'sound, no clear note' : 'listening: play a note'; });
  });
  document.getElementById('settings').addEventListener('toggle', (e) => { if (e.target.open) fill(); });
})();
