// "What am I looking at?": a legend under the instrument that explains every marking on screen, for the page and instrument showing.
(() => {
  'use strict';
  const lay = document.getElementById('layout'), out = document.getElementById('explain');
  if (!lay || !out) return;
  // Each entry: [swatch markup, term, explanation]. Swatches reuse the app's own classes so they always match the drawing.
  const dot = (c) => `<i class="dot ${c}"></i>`, tag = (t, c = '') => `<i class="ex-tag ${c}">${t}</i>`;
  const COLOURS = [
    [dot('root'), 'Root', 'The note the chord or scale is named after. Find this first; everything else is measured from it.'],
    [dot('guide'), '3rd and 7th', 'The guide tones. They decide whether a chord is major, minor or dominant, so they matter more than any other note.'],
    [dot('fifth'), '5th', 'Adds body but not character. It is the first note to leave out when a shape is too big.'],
    [dot('ext'), 'Other tones', 'Everything else: 2nds, 4ths, 6ths, 9ths, 11ths and 13ths. They add colour on top of the chord.'],
  ];
  const LABELS = [
    [tag('1 3 5'), 'Numbers on the pegs', 'Each note’s place in the chord or scale, counted from the root. Switch to note names or fingers in the settings (the cog, top right).'],
    [tag('♭ ♯'), 'Flat and sharp', '♭ lowers a note by one fret (one key); ♯ raises it by one. ♭3 is the minor 3rd; ♭7 is the minor 7th, the one found in dominant and minor 7 chords.'],
  ];
  const NECK = [
    [tag('×'), '× at the nut', 'Do not play this string. Mute it or miss it with the picking hand.'],
    [tag('E'), 'A peg at the nut', 'An open string: play it without fretting anything.'],
    [tag('5', 'bold'), 'Bold fret numbers', 'The frets your hand covers for this shape, one finger per fret. The tinted band on the neck marks the same area.'],
    [tag('R', 'ghost'), 'Dashed R', 'The root of a rootless chord. It is shown so you can see where the shape sits, but you do not play it: the bass player does.'],
    [tag('▬'), 'Bar across the neck', 'The capo. Fret numbers and shapes are counted from it.'],
  ];
  const KEYS = [
    [dot('lh'), 'Heavy-outlined peg', 'Played by the left hand. Pegs with a thin outline belong to the right hand.'],
    [tag('C4'), 'Labels under the keys', 'Each C with its octave number. C4 is middle C.'],
    [tag('‹ ›'), 'Arrows under the keyboard', 'Slide the keyboard down or up to see lower or higher notes.'],
  ];
  const VIEW = {
    learn: [[tag('▶'), 'Guided lesson', 'Plays the whole lesson aloud and moves the notes for you. Touch anything to pause it; it carries on from where you stopped.']],
    chords: [
      [tag('1–44'), 'Voicings', 'One chord can be played in many places. Each numbered picture below is one way to play it; “Stretch” marks shapes with a wide reach.'],
      [tag('▦'), 'Chart', 'The same shape as a standard chord box, as you would see it in a songbook.'],
    ],
    scales: [
      [tag('●', 'dimmed'), 'Dimmed pegs', 'Notes that are in the scale but not in the chord you picked. Aim for the bright ones, travel through the dimmed ones.'],
      [tag('1–5'), 'Positions', 'The same scale split into hand-sized areas of the neck. Learn one until you can play it without looking, then join it to the next.'],
    ],
    circle: [
      [tag('◔'), 'Outer and inner ring', 'Outer ring: the twelve major keys, each a fifth above the last. Inner ring: the minor key that shares the same notes.'],
      [tag('▲'), 'Highlighted wedges', 'The chosen key and its two neighbours. Those three positions hold the I, IV and V chords, the three most used in the key.'],
      [tag('2♯'), 'Number in the middle', 'How many sharps or flats the key has.'],
    ],
    practice: [
      [tag('1–4'), 'Numbers in warm-ups', 'Which finger to use: 1 index, 2 middle, 3 ring, 4 little finger.'],
      [dot('root'), 'Gold in a quiz', 'The note you are asked about, or the right answer once you have answered.'],
      [dot('guide'), 'Red in a quiz', 'Your pick, when it was wrong.'],
      [dot('ext'), 'Teal in a quiz', 'The answer to an interval question: every place that interval sits from the gold note.'],
      [dot('fifth'), 'Grey “?”', 'The note you are asked to name.'],
      [tag('I V'), 'Bars of a progression', 'Tap a bar to hear its chord and see its shape. Roman numerals count the chord’s place in the key.'],
      [tag('♩'), 'Metronome', 'Exercises follow the metronome at the top. Start slower than feels necessary; speed comes from accuracy.'],
    ],
  };
  const row = ([sw, term, text]) => `<div class="ex-row"><span class="ex-sw">${sw}</span><p><b>${term}.</b> ${text}</p></div>`;
  const block = (title, rows) => (rows && rows.length ? `<h4>${title}</h4>${rows.map(row).join('')}` : '');
  let key = '';
  const draw = () => {
    const view = lay.dataset.view || 'learn', show = lay.dataset.show || 'guitar', k = view + ':' + show;
    if (k === key) return;
    key = k;
    out.innerHTML = view === 'practice' ? block('On this page', VIEW.practice) + block('On the neck', NECK.slice(0, 3))
      : block('Colours', COLOURS) + block('Labels', LABELS) +
        (show !== 'keys' ? block('On the neck', NECK) : '') + (show !== 'guitar' ? block('On the keyboard', KEYS) : '') +
        block('On this page', VIEW[view]);
  };
  new MutationObserver(draw).observe(lay, { attributes: true, attributeFilter: ['data-view', 'data-show'] });
  draw();
})();
