/* Field Painter — Lesson 3 main sandbox, grown from the old field explorer:
   paint any number of charges and watch arrows and lines form live; a
   PERSISTENT draggable ghost test charge q0 = +1 nC (the old hover-only probe
   was invisible on touch); a draggable E-probe and ruler; force arrows on
   demand; Release mode rides the ghost along the field ("leaf in the wind",
   labelled as a flow view, not Newton's law). The Lecture-replica preset
   loads the ±4 µC y-axis example with the probe pre-parked at P, where the
   readout reproduces E ≈ 7.55×10⁴ N/C (+y) from the live superposition.
   The old A/B potential integral is gone (beyond this lecture; archived). */
(function () {
  const canvas = document.getElementById('sim-fieldpaint');
  if (!canvas) return;

  EMC.whenNear(canvas, init);
  function init() {
    const box = EMC.Sandbox.create({
      canvasId: 'sim-fieldpaint',
      rootId: 'fp-panel',
      prefix: 'fp',
      worldM: 3,
      ruler: true,
      defaultToggles: ['arrows', 'lines', 'numbers'],
      emptyText: 'Paint charges anywhere — arrows and lines form live. Then drag the ghost to feel the field.',
      seed: [
        { type: 'pos', q: 4e-6, x: 1.1, y: 0.6 },
        { type: 'neg', q: -4e-6, x: 1.9, y: 0.6 },
        { type: 'pos', q: 2e-6, x: 1.5, y: 1.15 },
        { type: 'test', q: 1e-9, x: 1.5, y: 0.55 }
      ],
      presets: [
        { id: 'single', label: 'Single +4 µC', objects: [{ type: 'pos', q: 4e-6, x: 1.5, y: 0.7 }] },
        { id: 'dipole', label: 'Dipole ±5 µC', objects: [
          { type: 'pos', q: 5e-6, x: 1.2, y: 0.7 },
          { type: 'neg', q: -5e-6, x: 1.8, y: 0.7 }
        ] },
        { id: 'like', label: 'Two like +4 µC (hunt the zero)', objects: [
          { type: 'pos', q: 4e-6, x: 1.1, y: 0.7 },
          { type: 'pos', q: 4e-6, x: 1.9, y: 0.7 },
          { type: 'probe', q: 0, x: 1.5, y: 0.7 }
        ] },
        { id: 'unequal', label: 'Unequal +8 / −2 µC', objects: [
          { type: 'pos', q: 8e-6, x: 1.1, y: 0.7 },
          { type: 'neg', q: -2e-6, x: 1.9, y: 0.7 }
        ] },
        { id: 'lecture-y', label: 'Lecture replica: ±4 µC on the y-axis', objects: w => {
          const cy = w.h / 2;                          // keeps the 0.60 × 0.50 m geometry at any canvas size
          return [
            { type: 'neg', q: -4e-6, x: 1.2, y: cy - 0.50 },   // −4 µC “at y = +0.50 m” (screen-up)
            { type: 'pos', q: 4e-6, x: 1.2, y: cy + 0.50 },    // +4 µC “at y = −0.50 m”
            { type: 'probe', q: 0, x: 1.80, y: cy },           // P: 0.60 m off the axis
            { type: 'test', q: 1e-9, x: 2.2, y: cy }
          ];
        } }
      ],
      challenges: [
        {
          id: 'fp-zero',
          text: 'Park the ghost where E = 0',
          hint: 'Between two LIKE charges the fields oppose. Watch the ghost\u2019s arrow shrink — under 100 N/C counts, and the exact midpoint is the cleanest spot.',
          won: 'E = 0 with charges all around — the vectors cancel; the space is not empty, it is balanced.',
          test: api => {
            const g = api.objects.find(o => o.type === 'test');
            return !!g && api.objects.filter(o => o.q && o.type !== 'test').length >= 2 &&
              api.fieldAtM(g.x, g.y).mag < 100;
          }
        },
        {
          id: 'fp-lecture',
          text: 'Measure the lecture\u2019s 75.6 kN/C at P',
          hint: 'Load the Lecture-replica preset — the probe is already parked at P. Or build it: ±4 µC 1.00 m apart, probe 0.60 m off the axis.',
          won: 'That is the lecture answer: E(P) \u2248 7.55\u00D710\u2074 N/C along +y \u2014 measured by dragging, not memorised.',
          test: api => {
            const pr = api.objects.find(o => o.type === 'probe');
            if (!pr) return false;
            const m = api.fieldAtM(pr.x, pr.y).mag;
            return m > 7.0e4 && m < 8.0e4;
          }
        },
        {
          id: 'fp-dipole',
          text: 'Paint a clean dipole (one +, one −, equal)',
          hint: 'Erase everything, place one + and one − with the same magnitude, then switch on Field lines.',
          won: 'Lines run + \u2192 \u2212 and the pattern is symmetric \u2014 two point-charge fields, added.',
          test: api => {
            const q = api.objects.filter(o => o.q && o.type !== 'test');
            return q.length === 2 && Math.abs(q[0].q + q[1].q) < 1e-12 && Math.abs(q[0].q) >= 1e-6;
          }
        }
      ],
      discovery: {
        text: 'the field is real at every point \u2014 the ghost only reads the push that was already waiting there.',
        href: '#summary'
      },
      readouts: api => {
        /* the probe's live E — the number the lecture example is about */
        const el = id => document.getElementById(id);
        const pr = api.objects.find(o => o.type === 'probe');
        const eEl = el('fp-probe-e'), dEl = el('fp-probe-dir'), fEl = el('fp-probe-f');
        if (pr) {
          const f = api.fieldAtM(pr.x, pr.y);
          if (eEl) eEl.textContent = EMC.unit(f.mag, 'N/C', 3);
          if (dEl) {
            if (f.mag < 1e-6) dEl.textContent = 'zero \u2014 cancelled';
            else {
              const deg = (-Math.atan2(f.ey, f.ex) * 180 / Math.PI + 360) % 360;
              dEl.textContent = `${deg.toFixed(0)}\u00B0 from +x (${api.dirWord(f.ex, f.ey)})`;
            }
          }
          if (fEl) fEl.textContent = EMC.unit(f.mag * 1e-9, 'N', 2) + ' on +1 nC';
        } else {
          if (eEl) eEl.textContent = 'place the E probe';
          if (dEl) dEl.textContent = '\u2014';
          if (fEl) fEl.textContent = '\u2014';
        }
      }
    });
    if (box) window.__FP = box;
  }
})();
