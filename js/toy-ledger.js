/* Charge Ledger — Lesson 1 tiny toy. A tray of charged balls: touch any two
   together and identical conductors split the total equally, q' = (q1+q2)/2.
   Randomise re-splits the SAME total; the big tally on top is computed from
   the balls every frame of interaction and provably never changes. This is
   conservation of charge as an unbeatable game. Pure DOM — no canvas. */
(function () {
  const panel = document.getElementById('toy-ledger');
  if (!panel) return;

  const { eng, unit } = EMC;
  const START = [6, -2, 3, -5, 1, 0];        // microcoulombs; total = +3 µC
  let balls = START.slice();
  let picks = [];
  let merges = 0;

  const el = id => document.getElementById(id);
  const tray = el('lg-tray');
  const total = () => balls.reduce((s, q) => s + q, 0);

  function render() {
    if (!tray) return;
    tray.textContent = '';
    balls.forEach((q, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'lg-ball' + (picks.includes(i) ? ' picked' : '');
      b.style.background = q > 0 ? '#f8aebe' : q < 0 ? '#a8d3e0' : '#c9c6bb';
      b.setAttribute('aria-label', `Ball ${i + 1}, ${q >= 0 ? '+' : '−'}${eng(Math.abs(q * 1e-6), 2)} coulomb — touch it with another ball to share charge`);
      b.innerHTML = `<b>${q >= 0 ? '+' : '−'}${Math.abs(q).toFixed(Math.abs(q % 1) > 0.009 ? 2 : 0)}</b><span>µC</span>`;
      b.addEventListener('click', () => touchBall(i));
      tray.appendChild(b);
    });
    if (el('lg-total')) el('lg-total').textContent = `${total() >= 0 ? '+' : '\u2212'}${unit(Math.abs(total() * 1e-6), 'C', 3)}`;
    if (el('lg-merges')) el('lg-merges').textContent = `${merges} touch${merges === 1 ? '' : 'es'} — total unchanged`;
  }

  function touchBall(i) {
    if (picks.length === 0) { picks = [i]; render(); return; }
    if (picks.length === 1 && picks[0] !== i) {
      const a = picks[0];
      const shared = (balls[a] + balls[i]) / 2;          // identical conductors
      const msg = `(${balls[a] >= 0 ? '+' : ''}${balls[a]} ${balls[a] * balls[i] < 0 ? '−' : '+'} ${Math.abs(balls[i]).toFixed(Math.abs(balls[i] % 1) > 0.009 ? 2 : 0)}) / 2 = ${shared >= 0 ? '+' : '−'}${Math.abs(shared).toFixed(Math.abs(shared % 1) > 0.009 ? 2 : 0)} µC each`;
      balls[a] = shared; balls[i] = shared;
      merges++;
      picks = [];
      render();
      EMC.toast(msg + ' — watch the tally: it did not move');
      return;
    }
    picks = [i]; render();
  }

  const rnd = el('lg-random');
  if (rnd) rnd.addEventListener('click', () => {
    /* re-split the SAME total randomly: conservation, not destruction */
    let left = total();
    balls = balls.map((_, i, arr) => {
      if (i === arr.length - 1) return Math.round(left * 100) / 100;
      const q = Math.round((Math.random() * 8 - 4) * 100) / 100;
      left -= q;
      return q;
    });
    picks = [];
    render();
    EMC.toast('New random split — the total is still the same number');
  });
  const reset = el('lg-reset');
  if (reset) reset.addEventListener('click', () => { balls = START.slice(); merges = 0; picks = []; render(); });

  render();
})();
