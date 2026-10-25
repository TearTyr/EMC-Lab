/* Rub the Balloon — Lesson 1 tiny toy. Drag the balloon across the hair
   strip: every stroke transfers whole electron parcels (q = n·e), the two
   counters tick in exact lockstep, and the room total stays 0. Neutral paper
   bits are then pulled to the balloon by polarisation (play-constant pull
   proportional to |q|/r², labelled as such in Full mode). One gesture teaches
   transfer, quantisation and conservation at once. */
(function () {
  const canvas = document.getElementById('toy-balloon');
  if (!canvas) return;

  EMC.whenNear(canvas, init);
  function init() {
    const { CONST, clamp, label, eng, unit } = EMC;
    const e = CONST.E;

    const state = {
      n: 0,                     // electrons moved from hair to balloon
      rate: 2e12,               // electrons per 100 px of rub
      bx: 0.28, by: 0.42,       // balloon centre (fractions of canvas)
      drag: false,
      bits: [],
      t: 0
    };
    for (let i = 0; i < 6; i++) {
      state.bits.push({ x: 0.62 + (i % 3) * 0.11, y: 0.3 + Math.floor(i / 3) * 0.34, stuck: false });
    }

    const qBalloon = () => -state.n * e;
    const el = id => document.getElementById(id);

    function readouts() {
      const qb = qBalloon();
      if (el('bl-q')) el('bl-q').textContent = `${qb <= 0 ? '−' : '+'}${eng(Math.abs(qb), 3)}C`;
      if (el('bl-h')) el('bl-h').textContent = `${qb <= 0 ? '+' : '−'}${eng(Math.abs(qb), 3)}C`;
      if (el('bl-total')) el('bl-total').textContent = '0 C';
      if (el('bl-n')) el('bl-n').textContent = `${eng(state.n, 3)} electrons moved`;
      const sub = el('bl-sub');
      if (sub) sub.innerHTML = `q = n·e = ${eng(state.n, 3)} × 1.602×10<sup>−19</sup> C = <b>${eng(Math.abs(qb), 3)} C</b> on the balloon, +the same on the hair`;
    }

    function render(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      /* hair strip */
      ctx.save();
      ctx.fillStyle = '#22242b';
      EMC.roundRect(ctx, w * 0.04, h * 0.12, w * 0.34, h * 0.76, 14);
      ctx.fill();
      ctx.strokeStyle = '#2e3138'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
      for (let i = 0; i < 14; i++) {
        const hx = w * (0.07 + (i % 7) * 0.045), hy = h * (0.2 + Math.floor(i / 7) * 0.5);
        ctx.save();
        ctx.strokeStyle = state.n > 0 ? '#f8aebe' : '#b9b7ae'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(hx, hy + 16); ctx.quadraticCurveTo(hx + 5, hy + 4, hx - 2, hy - 8); ctx.stroke();
        ctx.restore();
      }
      label(ctx, state.n > 0 ? 'hair: lost electrons (+)' : 'hair', w * 0.21, h * 0.95,
        { color: state.n > 0 ? '#fac0cd' : '#9a988e', size: 11 });

      /* paper bits: polarisation pull toward the charged balloon */
      const bx = state.bx * w, by = state.by * h;
      for (const bit of state.bits) {
        const px = bit.x * w, py = bit.y * h;
        if (bit.stuck) continue;
        const dx = bx - px, dy = by - py, r = Math.max(Math.hypot(dx, dy), 24);
        if (state.n > 0 && r < w * 0.3) {
          const pull = clamp(2600 * (state.n * e) / (r * r) * w, 0, 2.6);   // play constant, printed in Full
          bit.x += dx / r * pull * 0.004; bit.y += dy / r * pull * 0.004;
          if (r < 26) bit.stuck = true;
        }
      }
      for (const bit of state.bits) {
        const px = bit.stuck ? bx + 14 : bit.x * w, py = bit.stuck ? by + 10 : bit.y * h;
        ctx.save();
        ctx.fillStyle = '#e6e2d6'; ctx.strokeStyle = '#3a3d45'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.rect(px - 6, py - 7, 12, 14); ctx.fill(); ctx.stroke();
        ctx.restore();
      }

      /* balloon (flat sticker + knot) */
      const R = 30;
      ctx.save();
      ctx.beginPath(); ctx.arc(bx, by, R, 0, Math.PI * 2);
      ctx.fillStyle = state.n > 0 ? '#a8d3e0' : '#f8aebe';
      ctx.fill(); ctx.strokeStyle = '#3a3d45'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bx - 5, by + R - 2); ctx.lineTo(bx + 5, by + R - 2); ctx.lineTo(bx, by + R + 8);
      ctx.closePath(); ctx.fillStyle = '#3a3d45'; ctx.fill();
      ctx.restore();
      if (state.n > 0) {
        label(ctx, '−', bx, by - 6, { color: '#17181c', size: 18, weight: '800' });
        label(ctx, `${eng(state.n, 2)} e⁻`, bx, by + 10, { color: '#17181c', size: 9.5, weight: '700' });
      }
      label(ctx, state.n > 0 ? 'drag it back across the hair for more' : 'drag the balloon onto the hair and rub ↔',
        w * 0.5, 16, { color: 'rgba(169,186,214,.85)', size: 11.5, weight: '500' });
    }

    const stage = new EMC.Stage(canvas, render, { animate: true, intro: 320 });

    stage.onPointer(p => {
      const w = stage.w, h = stage.h;
      const bx = state.bx * w, by = state.by * h;
      if (p.type === 'down') {
        if (Math.hypot(p.x - bx, p.y - by) < 44) { state.drag = true; canvas.classList.add('dragging'); }
      } else if (p.type === 'move' && state.drag) {
        const nx = state.bx * w, ny = state.by * h;
        const dx = p.x - nx;
        state.bx = clamp(p.x / w, 0.06, 0.94); state.by = clamp(p.y / h, 0.1, 0.9);
        /* rubbing = horizontal movement while over the hair strip */
        const inHair = state.bx < 0.4;
        if (inHair && Math.abs(dx) > 0.5) {
          state.n = Math.min(9.99e15, state.n + Math.abs(dx) * state.rate / 100);
          readouts();
        }
        for (const bit of state.bits) bit.stuck = false;   // shake the bits loose again
      } else if (p.type === 'up' || p.type === 'leave') {
        state.drag = false; canvas.classList.remove('dragging');
      }
    });

    const rate = el('bl-rate');
    if (rate) stage.bindRange(rate, 'bl-ratev', v => { state.rate = v * 1e12; }, v => `${v.toFixed(0)}×10¹² e⁻ / stroke`);
    const reset = el('bl-reset');
    if (reset) stage.listen(reset, 'click', () => {
      state.n = 0;
      state.bits.forEach((b, i) => { b.x = 0.62 + (i % 3) * 0.11; b.y = 0.3 + Math.floor(i / 3) * 0.34; b.stuck = false; });
      readouts(); stage.draw();
      EMC.toast('Balloon discharged — the electrons went back to the hair');
    });

    readouts();
    stage.draw();
  }
})();
