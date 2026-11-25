// Tuner: listens through the microphone, finds the pitch and shows how far it is from the nearest note.
// The sound never leaves the device: it is analysed here and nothing is recorded or sent anywhere.
(() => {
  'use strict';
  const G = (window.G = window.G || {});
  const NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
  const STRINGS = [[40, 'E', 6], [45, 'A', 5], [50, 'D', 4], [55, 'G', 3], [59, 'B', 2], [64, 'E', 1]]; // midi, name, string number
  const hz = (midi, a4 = 440) => a4 * Math.pow(2, (midi - 69) / 12);

  // Pitch of a block of samples in Hz, or 0 when there is no clear note. Normalised square difference (McLeod):
  // it is robust against a strong second harmonic, which a plucked low E has in abundance.
  function detect(buf, rate, lo = 60, hi = 1100) {
    const n = buf.length;
    let rms = 0;
    for (let i = 0; i < n; i++) rms += buf[i] * buf[i];
    if (Math.sqrt(rms / n) < 0.008) return 0; // too quiet to trust
    const minLag = Math.floor(rate / hi), maxLag = Math.min(Math.floor(rate / lo), n >> 1), nsdf = new Float32Array(maxLag + 2);
    for (let lag = minLag - 1; lag <= maxLag + 1; lag++) {
      let acf = 0, div = 0;
      for (let i = 0; i < n - lag; i++) { const a = buf[i], b = buf[i + lag]; acf += a * b; div += a * a + b * b; }
      nsdf[lag] = div ? 2 * acf / div : 0;
    }
    // every local maximum, then the first one that comes close to the highest: that is the true period, not a multiple of it
    const peaks = [];
    let top = 0;
    for (let lag = minLag; lag <= maxLag; lag++) if (nsdf[lag] > 0 && nsdf[lag] > nsdf[lag - 1] && nsdf[lag] >= nsdf[lag + 1]) { peaks.push(lag); if (nsdf[lag] > top) top = nsdf[lag]; }
    if (top < 0.6) return 0; // not periodic enough: noise, speech, or two strings at once
    const lag = peaks.find((p) => nsdf[p] >= top * 0.9), a = nsdf[lag - 1], b = nsdf[lag], c = nsdf[lag + 1], d = a - 2 * b + c;
    return rate / (lag + (d ? 0.5 * (a - c) / d : 0)); // parabolic fit between samples
  }
  // {midi, name, octave, cents} for a frequency
  function nearest(f, a4 = 440) {
    const m = 69 + 12 * Math.log2(f / a4), midi = Math.round(m);
    return { midi, name: NAMES[((midi % 12) + 12) % 12], octave: Math.floor(midi / 12) - 1, cents: (m - midi) * 100 };
  }
  G.Tuner = { detect, nearest, hz, STRINGS };
  if (typeof document === 'undefined') return;

  const right = document.querySelector('.topbar-right'), settings = document.getElementById('settings');
  if (!right) return;
  const btn = document.createElement('button');
  btn.className = 'icon-btn'; btn.id = 'tunerBtn'; btn.setAttribute('aria-label', 'Tuner'); btn.title = 'Tuner';
  btn.innerHTML = '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 1.5v5a3 3 0 0 0 6 0v-5M8 9.5v5"/></svg>';
  right.insertBefore(btn, settings || null);

  const dlg = document.createElement('dialog');
  dlg.className = 'tuner'; dlg.setAttribute('aria-label', 'Tuner');
  dlg.innerHTML = `<div class="tu-head"><b>Tuner</b><button class="icon-btn" data-tu="close" aria-label="Close the tuner">×</button></div>
    <div class="tu-note" aria-live="polite"><span id="tuName">–</span><small id="tuOct"></small></div>
    <div class="tu-meter" aria-hidden="true"><i class="tu-mid"></i><i class="tu-needle" id="tuNeedle"></i><span>♭</span><span>♯</span></div>
    <p class="tu-read" id="tuRead">Tap Start, then play one open string and let it ring.</p>
    <div class="tu-strings" id="tuStrings" role="group" aria-label="Strings: tap one to hear its pitch">${STRINGS.map(([m, nm, s]) => `<button data-tu="ref" data-m="${m}"><b>${nm}</b><small>string ${s}</small></button>`).join('')}</div>
    <button class="btn primary" data-tu="toggle" id="tuGo">Start listening</button>
    <p class="tu-foot">Standard tuning, A = 440 Hz. Tap a string to hear what it should sound like. The microphone is only used here on your device; nothing is recorded.</p>`;
  document.body.appendChild(dlg);
  const $ = (id) => dlg.querySelector('#' + id);

  let stream = null, src = null, an = null, raf = 0, buf = null, hist = [], quiet = 0;
  function paint(f) {
    const needle = $('tuNeedle');
    if (!f) { if (++quiet > 25) { $('tuName').textContent = '–'; $('tuOct').textContent = ''; needle.style.opacity = '.25'; dlg.dataset.state = ''; $('tuRead').textContent = 'Listening… play one string.'; dlg.querySelectorAll('.tu-strings button').forEach((b) => b.classList.remove('on')); } return; }
    quiet = 0;
    hist.push(f); if (hist.length > 5) hist.shift();
    const med = hist.slice().sort((a, b) => a - b)[hist.length >> 1], n = nearest(med), c = Math.max(-50, Math.min(50, n.cents)), ok = Math.abs(n.cents) < 5;
    $('tuName').textContent = n.name; $('tuOct').textContent = n.octave;
    needle.style.opacity = '1'; needle.style.left = (50 + c) + '%';
    dlg.dataset.state = ok ? 'ok' : c < 0 ? 'flat' : 'sharp';
    $('tuRead').textContent = ok ? 'In tune.' : `${Math.abs(Math.round(n.cents))} cents ${c < 0 ? 'flat: tighten the string' : 'sharp: loosen the string'}.`;
    dlg.querySelectorAll('.tu-strings button').forEach((b) => b.classList.toggle('on', +b.dataset.m === n.midi));
  }
  function loop() {
    an.getFloatTimeDomainData(buf);
    paint(detect(buf, an.context.sampleRate));
    raf = requestAnimationFrame(loop);
  }
  function stop() {
    cancelAnimationFrame(raf); raf = 0;
    if (src) { try { src.disconnect(); } catch (e) { /* already gone */ } src = null; }
    if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* not supported */ }
    $('tuGo').textContent = 'Start listening'; dlg.dataset.state = ''; hist = [];
  }
  async function start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { $('tuRead').textContent = 'This browser cannot use the microphone here. Open the site over https, or tune by ear with the string buttons.'; return; }
    try {
      try { if (navigator.audioSession) navigator.audioSession.type = 'play-and-record'; } catch (e) { /* not supported */ }
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const ctx = G.Audio && G.Audio.resume && G.Audio.resume();
      if (!ctx) throw new Error('no audio');
      src = ctx.createMediaStreamSource(stream); an = ctx.createAnalyser(); an.fftSize = 4096; buf = new Float32Array(an.fftSize);
      src.connect(an); // analysed only: never connected to the speakers
      $('tuGo').textContent = 'Stop listening'; $('tuRead').textContent = 'Listening… play one string.'; quiet = 0;
      loop();
    } catch (e) {
      stop();
      $('tuRead').textContent = e && (e.name === 'NotAllowedError' || e.name === 'SecurityError') ? 'Microphone access was refused. Allow it in the browser’s site settings, or tune by ear with the string buttons.' : 'No microphone could be opened. You can still tune by ear with the string buttons.';
    }
  }
  btn.addEventListener('click', () => { if (dlg.open) dlg.close(); else if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); });
  dlg.addEventListener('close', stop);
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) return dlg.close(); // a tap on the backdrop
    const b = e.target.closest('[data-tu]');
    if (!b) return;
    if (b.dataset.tu === 'close') dlg.close();
    else if (b.dataset.tu === 'toggle') (stream ? stop : start)();
    else if (b.dataset.tu === 'ref' && G.Audio && G.Audio.pluck) { G.Audio.resume(); G.Audio.pluck(+b.dataset.m, undefined, 1, STRINGS.findIndex((s) => s[0] === +b.dataset.m)); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && stream) stop(); });
})();
