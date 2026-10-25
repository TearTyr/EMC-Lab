/* Tug-of-War Arena — Lesson 2 main sandbox. Any number of point charges,
   anywhere: net force arrows on every charge (log-scaled, from the softened
   Coulomb pair sum), dashed per-pair component ghosts on the selected
   charge, a draggable ruler, and a Release mode that integrates F = ma with
   caps, edge bounce and a stability warning. Presets are shortcuts only —
   including the lecture's own line and 2-D examples, whose answers the
   readouts reproduce to display precision. */
(function () {
  const canvas = document.getElementById('sim-arena');
  if (!canvas) return;

  EMC.whenNear(canvas, init);
  function init() {
    const box = EMC.Sandbox.create({
      canvasId: 'sim-arena',
      rootId: 'ar-panel',
      prefix: 'ar',
      worldM: 3,
      ruler: true,
      defaultToggles: ['forces', 'numbers'],
      emptyText: 'Drop two charges and drag them around — every arrow is the computed Coulomb force, live.',
      seed: [{ type: 'pos', q: 4e-6, x: 1.5, y: 0.6 }],
      presets: [
        { id: 'pair', label: 'Two on a line (+3 / −2 µC, 0.30 m)', objects: [
          { type: 'pos', q: 3e-6, x: 1.2, y: 0.6 },
          { type: 'neg', q: -2e-6, x: 1.5, y: 0.6 }
        ], zoom: 2, cx: 1.35, cy: 0.6 },
        { id: 'lecture-line', label: 'Lecture: −4 / +3 / −7 µC, 0.20 + 0.15 m', objects: [
          /* the lecture's own layout: q₂ = −4 µC at x = 0, q₁ = +3 µC at
             x = 0.20 m, q₃ = −7 µC at x = 0.35 m — F₁₂ = 2.70 N (−x),
             F₁₃ = 8.39 N (+x), net on q₁ = 5.69 N (+x). */
          { type: 'neg', q: -4e-6, x: 1.30, y: 0.6 },
          { type: 'pos', q: 3e-6, x: 1.50, y: 0.6 },
          { type: 'neg', q: -7e-6, x: 1.65, y: 0.6 }
        ], zoom: 2, cx: 1.475, cy: 0.6 },
        { id: 'lecture-2d', label: 'Lecture: +4 / −6 / −5 µC, 0.15 m @ 73° + 0.10 m', objects: [
          /* the lecture's own layout: q₁ = +4 µC, q₂ = −6 µC 0.15 m away at
             73° above +x (canvas y grows downward, so "above" = smaller y),
             q₃ = −5 µC 0.10 m along +x — net on q₁ = 22.7 N at ≈24°
             above +x, matching the lecture figure's orientation. */
          { type: 'pos', q: 4e-6, x: 1.40, y: 0.50 },
          { type: 'neg', q: -6e-6, x: 1.4439, y: 0.3566 },   // screen-up = lecture's "73° above +x"
          { type: 'neg', q: -5e-6, x: 1.50, y: 0.50 }
        ], zoom: 3, cx: 1.45, cy: 0.43 },
        { id: 'orbit', label: 'Orbit seed (+8 µC, fast −1 µC)', objects: [
          { type: 'pos', q: 8e-6, x: 1.5, y: 0.7 },
          { type: 'neg', q: -1e-6, x: 2.2, y: 0.7 }
        ] }
      ],
      challenges: [
        {
          id: 'ar-balance',
          text: 'Balance one charge: net force ≈ 0',
          hint: 'Put a charge between two others so the pulls oppose. Fine-tune with the ruler — the net arrow shrinks to a dot below 0.02 N.',
          won: 'Balanced! Equal arrows, opposite directions — the vectors cancel, exactly like the lecture\u2019s line example.',
          test: api => {
            const others = api.objects.filter(o => o.q);
            return others.length >= 3 && others.some(o => api.forceOn(o).mag < 0.02);
          }
        },
        {
          id: 'ar-kilonewton',
          text: 'Push any net force past 1 kN',
          hint: 'F = k|q\u2081q\u2082|/r\u00B2: big charges, point-blank range (softening keeps it safe).',
          won: 'Over 1000 N from two little pucks — that is the inverse square at point-blank range.',
          test: api => api.objects.some(o => o.q && api.forceOn(o).mag >= 1000)
        },
        {
          id: 'ar-lecture',
          text: 'Reproduce the lecture 2-D answer (\u2248 23 N)',
          hint: 'Load the 2-D preset (or build it): +4 \u00B5C with −6 \u00B5C 0.15 m away at 73°, −5 \u00B5C 0.10 m along +x.',
          won: 'That is the lecture example: 9.6 N at 73° and 18.0 N along +x add as arrows to \u2248 22.7 N at \u224824°.',
          test: api => api.objects.some(o => Math.abs(o.q - 4e-6) < 1e-9 &&
            api.forceOn(o).mag > 22 && api.forceOn(o).mag < 25 &&
            api.objects.filter(b => b.q).length >= 3)
        },
        {
          id: 'ar-release',
          text: 'Let go: 3+ objects flying at once',
          hint: 'Flip the Release switch — the arrows you have been drawing become real acceleration (F = ma, play-mass pucks).',
          won: 'Forces became motion: every puck accelerates along its own net arrow.',
          test: api => api.toggles.release &&
            api.objects.filter(o => Math.hypot(o.vx, o.vy) > 1).length >= 3
        }
      ],
      discovery: {
        text: 'forces are arrows: they add by direction, fall as 1/r\u00B2, and always come in equal-and-opposite pairs.',
        href: '#coulomb-summary'
      }
    });
    if (box) window.__AR = box;
  }
})();
