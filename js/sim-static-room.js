/* Static Room — Lesson 1 main sandbox. Free-play attract/repel playground on
   the sandbox-core engine with the material rules of Lesson 1: insulators
   (balloon, sock, rod) hold their charge where you put it, neutral metal
   balls are pulled by polarisation (image-charge model) and share charge
   equally on contact. The room tally proves conservation: it cannot change,
   whatever the student does. Every force is the softened Coulomb pair force —
   computed per frame, never scripted. */
(function () {
  const canvas = document.getElementById('sim-static-room');
  if (!canvas) return;

  EMC.whenNear(canvas, init);
  function init() {
    const box = EMC.Sandbox.create({
      canvasId: 'sim-static-room',
      rootId: 'sr-panel',
      prefix: 'sr',
      worldM: 3,
      materials: true,
      ruler: false,
      defaultToggles: ['forces', 'numbers'],
      emptyText: 'Grab the sock. Drop a balloon. Flood the room — the tally on the right can never be broken.',
      seed: [
        { type: 'sock', q: -2e-6, x: 1.0, y: 0.6 },
        { type: 'ball', q: 0, x: 1.9, y: 0.8 }
      ],
      presets: [
        { id: 'cling', label: 'Balloon & sock', objects: [
          { type: 'balloon', q: -3e-6, x: 0.9, y: 0.6 },
          { type: 'sock', q: -2e-6, x: 1.5, y: 0.6 },
          { type: 'ball', q: 0, x: 2.2, y: 0.9 }
        ] },
        { id: 'touch', label: 'Two metal balls (one charged)', objects: [
          { type: 'ball', q: 6e-6, x: 1.2, y: 0.7 },
          { type: 'ball', q: -2e-6, x: 1.7, y: 0.7 }
        ] },
        { id: 'mix', label: 'Insulator mix', objects: [
          { type: 'balloon', q: -3e-6, x: 0.7, y: 0.5 },
          { type: 'rod', q: 2e-6, x: 1.5, y: 0.9 },
          { type: 'sock', q: -2e-6, x: 2.2, y: 0.5 },
          { type: 'pos', q: 4e-6, x: 1.5, y: 0.4 }
        ] }
      ],
      challenges: [
        {
          id: 'sr-polarise',
          text: 'Move a neutral ball WITHOUT touching it',
          hint: 'Park a charged object next to the ball, switch on Release and watch: the ball has q = 0 — so what is pulling it?',
          won: 'Polarisation win! The ball stayed neutral — its charges only shifted, and the nearer side won.',
          test: api => api.toggles.release &&
            api.objects.some(o => o.type === 'ball' && o.q === 0 && Math.hypot(o.vx, o.vy) > 0.05)
        },
        {
          id: 'sr-share',
          text: 'Touch two metal balls after charging one',
          hint: 'Drag a charged ball onto a neutral one. Identical conductors split the total equally: q\u2032 = (q\u2081+q\u2082)/2.',
          won: 'Contact sharing! Both balls now carry half the total — and the room tally never moved.',
          test: api => {
            const balls = api.objects.filter(o => o.type === 'ball' && o.q !== 0);
            return balls.length >= 2 && Math.abs(balls[0].q - balls[1].q) < 1e-12;
          }
        },
        {
          id: 'sr-crowd',
          text: 'Fill the room with 8+ objects',
          hint: 'Stamp anything you like — the tally at the top-right is watching.',
          won: 'Eight objects, a hundred pushes — and the room total is still exactly what you started with.',
          test: api => api.objects.length >= 8
        }
      ],
      discovery: {
        text: 'charge only ever moves — the room\u2019s total can never change, and neutral things are pulled by shifted charge.',
        href: '#charge-summary'
      }
    });
    if (box) window.__SR = box;   // debug handle (?debug), never used by the page
  }
})();
