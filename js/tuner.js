// Tuner: plays a steady reference tone for each open string, to tune against by ear. It does not use the microphone.
(() => {
  'use strict';
  const G = (window.G = window.G || {});
  const STRINGS = [[40, 'E', 6], [45, 'A', 5], [50, 'D', 4], [55, 'G', 3], [59, 'B', 2], [64, 'E', 1]]; // midi, name, string number
  const hz = (midi, a4 = 440) => a4 * Math.pow(2, (midi - 69) / 12);
  G.Tuner = { hz, STRINGS };
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
    <p class="tu-read" id="tuRead">Tap a string to hear its note. Tap it again to stop.</p>
    <div class="tu-strings" id="tuStrings" role="group" aria-label="Strings: tap one to hear its pitch">${STRINGS.map(([m, nm, s]) => `<button data-tu="ref" data-m="${m}" aria-pressed="false"><b>${nm}</b><small>string ${s}</small></button>`).join('')}</div>
    <p class="tu-foot"><b>How to tune by ear.</b> Play the same open string on your guitar while the tone sounds. If you hear a slow wobble, the two are close: turn the peg until the wobble slows and disappears. Tune up to the note rather than down to it, so the string holds. Standard tuning, A = 440 Hz. Nothing is recorded; the microphone is not used.</p>`;
  document.body.appendChild(dlg);
  const $ = (id) => dlg.querySelector('#' + id);

  let voice = null, timer = 0;
  function stop() {
    clearTimeout(timer);
    if (voice) { const { out, oscs, ctx } = voice, t = ctx.currentTime; out.gain.cancelScheduledValues(t); out.gain.setTargetAtTime(0, t, 0.04); oscs.forEach((o) => o.stop(t + 0.3)); voice = null; }
    dlg.querySelectorAll('.tu-strings button').forEach((b) => { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); });
    $('tuName').textContent = '–'; $('tuOct').textContent = ''; dlg.dataset.state = '';
    $('tuRead').textContent = 'Tap a string to hear its note. Tap it again to stop.';
  }
  // A plain sine at the string's pitch, with two soft overtones so the low strings can be heard on a phone speaker.
  function play(midi, b) {
    const ctx = G.Audio && G.Audio.resume && G.Audio.resume();
    if (!ctx) { $('tuRead').textContent = 'Sound is not available in this browser.'; return; }
    const f = hz(midi), out = ctx.createGain(), vol = (G.Audio.settings && Number.isFinite(G.Audio.settings.volume) ? G.Audio.settings.volume : 0.8), t = ctx.currentTime;
    out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(0.32 * vol, t + 0.05); out.connect(ctx.destination);
    const oscs = [[1, 1], [2, 0.3], [3, 0.12]].map(([mult, level]) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f * mult; g.gain.value = level; o.connect(g); g.connect(out); o.start(t); return o; });
    voice = { out, oscs, ctx, midi };
    b.classList.add('on'); b.setAttribute('aria-pressed', 'true');
    const s = STRINGS.find((x) => x[0] === midi);
    $('tuName').textContent = s[1]; $('tuOct').textContent = Math.floor(midi / 12) - 1; dlg.dataset.state = 'ok';
    $('tuRead').textContent = `String ${s[2]}: ${s[1]}${Math.floor(midi / 12) - 1}, ${f.toFixed(1)} Hz. Tap again to stop.`;
    timer = setTimeout(stop, 30000); // never left droning
  }
  btn.addEventListener('click', () => { if (dlg.open) dlg.close(); else if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); });
  dlg.addEventListener('close', stop);
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) return dlg.close(); // a tap on the backdrop
    const b = e.target.closest('[data-tu]');
    if (!b) return;
    if (b.dataset.tu === 'close') return dlg.close();
    const m = +b.dataset.m, same = voice && voice.midi === m;
    stop();
    if (!same) play(m, b);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
})();
