/* Rub the Balloon — Lesson 1 tiny toy. Drag the balloon across the hair
   strip: every stroke transfers whole electron parcels (q = n·e), the two
   counters tick in exact lockstep, and the room total stays 0. Neutral paper
   bits are then pulled to the balloon by polarisation (play-constant pull
   that grows with the charge and falls off with distance, labelled as such in
   Full mode). One gesture teaches transfer, quantisation and conservation at
   once.
   Visual pass: electrons visibly fly from the hair to the balloon while you
   rub, the hair strands lean toward the balloon, − marks collect on the
   balloon and + marks on the hair (one mark per fixed parcel, so the picture
   and the counters agree), and a paper bit near the balloon shows its
   induced +/− sides — the actual reason a neutral object is attracted.
   FIX: the old pull was ~10⁻⁵ px per frame, so the bits never moved; the
   strength is now a bounded function of n and the motion is dt-based. */
(function () {
  const canvas = document.getElementById('toy-balloon');
  if (!canvas) return;

  EMC.whenNear(canvas, init);
  function init() {
    const { CONST, clamp, label, eng } = EMC;
    const e = CONST.E;
    const PINK = '#f8aebe', CYAN = '#a8d3e0', INK = '#17181c', EDGE = '#3a3d45';

    const state = {
      n: 0,                     // electrons moved from hair to balloon
      rate: 2e12,               // electrons per 100 px of rub
      bx: 0.28, by: 0.42,       // balloon centre (fractions of canvas)
      drag: false,
      bits: [],
      parts: [],                // flying electrons (cosmetic)
      lastDx: 0
    };
    const resetBits = () => {
      state.bits = [];
      for (let i = 0; i < 6; i++) {
        state.bits.push({ x: 0.62 + (i % 3) * 0.11, y: 0.3 + Math.floor(i / 3) * 0.34, stuck: false, ox: 0, oy: 0, near: 0 });
      }
    };
    resetBits();

    /* 7.16×10¹³ rather than "71.6 T": a count of electrons is not an SI-prefixed unit */
    const SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
    const sci = (x, sig = 3) => {
      if (!(x > 0)) return '0';
      let ex = Math.floor(Math.log10(x)), m = x / Math.pow(10, ex);
      if (Number(m.toFixed(sig - 1)) >= 10) { m /= 10; ex += 1; }
      if (ex > -2 && ex < 4) return String(Number(x.toPrecision(sig)));
      return `${m.toFixed(sig - 1)}×10${String(ex).split('').map(c => SUP[c] || c).join('')}`;
    };
    const qBalloon = () => -state.n * e;
    const el = id => document.getElementById(id);
    /* 0..1: how strongly the balloon attracts (bounded, log-like in n) */
    const strength = () => clamp(Math.log10(1 + state.n / 1e11) / 2.5, 0, 1);
    /* one mark per parcel of charge, so the picture tracks the counters */
    const marks = () => clamp(Math.round(Math.log10(1 + state.n / 1e11) * 3.2), 0, 10);

    function readouts() {
      const qb = qBalloon();
      if (el('bl-q')) el('bl-q').textContent = `${qb <= 0 ? '−' : '+'}${eng(Math.abs(qb), 3)}C`;
      if (el('bl-h')) el('bl-h').textContent = `${qb <= 0 ? '+' : '−'}${eng(Math.abs(qb), 3)}C`;
      if (el('bl-total')) el('bl-total').textContent = '0 C';
      if (el('bl-n')) el('bl-n').textContent = `${sci(state.n, 3)} electrons moved`;
      const sub = el('bl-sub');
      if (sub) sub.innerHTML = `q = n·e = ${sci(state.n, 3)} × 1.602×10<sup>−19</sup> C = <b>${eng(Math.abs(qb), 3)} C</b> on the balloon, +the same on the hair`;
    }

    const wake = () => { if (stage) stage.setIdle(false); };

    function render(ctx, w, h, stg, dt) {
      ctx.clearRect(0, 0, w, h);
      const step = clamp(dt || 1 / 60, 0, 0.05);
      const s = strength(), nm = marks();
      const bx = state.bx * w, by = state.by * h;
      const R = 30;
      let moving = false;

      /* ---- hair strip ---- */
      const hx0 = w * 0.04, hy0 = h * 0.12, hw = w * 0.34, hh = h * 0.76;
      ctx.save();
      ctx.fillStyle = '#22242b';
      EMC.roundRect(ctx, hx0, hy0, hw, hh, 14); ctx.fill();
      ctx.strokeStyle = '#2e3138'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
      const t = performance.now() / 1000;
      for (let i = 0; i < 14; i++) {
        const hx = w * (0.07 + (i % 7) * 0.045), hy = h * (0.2 + Math.floor(i / 7) * 0.5);
        /* strands lean toward the balloon when the hair is charged */
        const lean = s * 11 * clamp((bx - hx) / (w * 0.4), -1, 1) + Math.sin(t * 1.4 + i) * 0.6 * s;
        ctx.save();
        ctx.strokeStyle = state.n > 0 ? PINK : '#b9b7ae'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(hx, hy + 16);
        ctx.quadraticCurveTo(hx + 5 + lean * 0.5, hy + 4, hx - 2 + lean, hy - 8); ctx.stroke();
        ctx.restore();
        if (i < nm) {                                           // + marks: electrons the hair lost
          label(ctx, '+', hx - 2 + lean, hy - 15, { color: '#fac0cd', size: 12, weight: '800', halo: false });
        }
      }
      label(ctx, state.n > 0 ? 'hair: lost electrons (+)' : 'hair', w * 0.21, h * 0.95,
        { color: state.n > 0 ? '#fac0cd' : '#9a988e', size: 11 });

      /* ---- paper bits: polarisation pull, dt-based ---- */
      const range = w * (0.14 + 0.34 * s);
      for (const bit of state.bits) {
        let px = bit.x * w, py = bit.y * h;
        const dx = bx - px, dy = by - py, r = Math.max(Math.hypot(dx, dy), 1);
        bit.near = 0;
        if (bit.stuck) {
          bit.x = (bx + bit.ox) / w; bit.y = (by + bit.oy) / h;   // rides on the balloon
          bit.near = 1;
          continue;
        }
        if (s > 0.02 && r < range) {
          const speed = (36 + 300 * s) * clamp(120 / Math.max(r, 30), 0.35, 2.4);   // px/s — play constant
          const mv = Math.min(speed * step, r);
          bit.x += dx / r * mv / w; bit.y += dy / r * mv / h;
          moving = true;
          bit.near = clamp(1 - r / range, 0, 1);
          if (r < R + 8) {                                        // touch: stick on the side it arrived from
            bit.stuck = true;
            const a = Math.atan2(py - by, px - bx);
            bit.ox = Math.cos(a) * (R + 7); bit.oy = Math.sin(a) * (R + 7);
          }
        }
      }
      for (const bit of state.bits) {
        const px = bit.x * w, py = bit.y * h;
        const ang = Math.atan2(by - py, bx - px);
        ctx.save();
        ctx.translate(px, py); ctx.rotate(bit.stuck ? ang : ang * bit.near);
        ctx.fillStyle = '#e6e2d6'; ctx.strokeStyle = EDGE; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.rect(-6, -7, 12, 14); ctx.fill(); ctx.stroke();
        if (bit.near > 0.25 || bit.stuck) {        // induced charge: near side opposite, far side like
          /* local +x points at the balloon: a negative balloon pulls + to the near side */
          label(ctx, '+', 3.5, 0, { color: '#c0405a', size: 11, weight: '800', halo: false });
          label(ctx, '−', -3, 0, { color: '#2f7f99', size: 12, weight: '800', halo: false });
        }
        ctx.restore();
      }

      /* ---- flying electrons (hair → balloon) ---- */
      for (let i = state.parts.length - 1; i >= 0; i--) {
        const p = state.parts[i];
        p.t += step / p.dur;
        if (p.t >= 1) { state.parts.splice(i, 1); continue; }
        moving = true;
        const k = p.t * p.t * (3 - 2 * p.t);
        const x = p.x0 + (bx - p.x0) * k, y = p.y0 + (by - p.y0) * k - Math.sin(Math.PI * k) * p.lift;
        ctx.fillStyle = `rgba(168,211,224,${(0.9 * (1 - p.t * 0.4)).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x - 2.4, y); ctx.lineTo(x + 2.4, y); ctx.stroke();
      }

      /* ---- balloon (flat sticker + highlight + knot + string) ---- */
      ctx.save();
      ctx.strokeStyle = 'rgba(169,186,214,.45)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(bx, by + R + 8);
      ctx.bezierCurveTo(bx - 8, by + R + 28, bx + 8, by + R + 44, bx - 2, by + R + 64); ctx.stroke();
      ctx.beginPath(); ctx.arc(bx, by, R, 0, Math.PI * 2);
      ctx.fillStyle = state.n > 0 ? CYAN : PINK;
      ctx.fill(); ctx.strokeStyle = EDGE; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.28)';
      ctx.beginPath(); ctx.ellipse(bx - 10, by - 12, 6, 9, -0.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(bx - 5, by + R - 2); ctx.lineTo(bx + 5, by + R - 2); ctx.lineTo(bx, by + R + 8);
      ctx.closePath(); ctx.fillStyle = EDGE; ctx.fill();
      ctx.restore();
      for (let i = 0; i < nm; i++) {                            // − marks: the electrons it gained
        const a = i * 2.399 + 0.6, rr = (i % 2 ? 0.52 : 0.8) * (R - 8);
        label(ctx, '−', bx + Math.cos(a) * rr, by + Math.sin(a) * rr, { color: INK, size: 14, weight: '800', halo: false });
      }
      if (state.n > 0) {
        label(ctx, `${sci(state.n, 2)} e⁻`, bx, by + R + 22, { color: '#cfe9f2', size: 10.5, weight: '700' });
      }
      label(ctx, state.n > 0 ? 'drag it back across the hair for more' : 'drag the balloon onto the hair and rub ↔',
        w * 0.5, 16, { color: 'rgba(169,186,214,.85)', size: 11.5, weight: '500' });

      /* settled: no bit in motion, nothing flying, not being dragged → park the loop */
      if (!moving && !state.drag && state.parts.length === 0 && stg && stg.setIdle && stg.intro() >= 1) stg.setIdle(true);
    }

    const stage = new EMC.Stage(canvas, render, { animate: true, intro: 320 });

    stage.onPointer(p => {
      wake();
      const w = stage.w, h = stage.h;
      const bx = state.bx * w, by = state.by * h;
      if (p.type === 'down') {
        if (Math.hypot(p.x - bx, p.y - by) < 44) { state.drag = true; canvas.classList.add('dragging'); }
      } else if (p.type === 'move' && state.drag) {
        const nx = state.bx * w, ny = state.by * h;
        const dx = p.x - nx, dy = p.y - ny;
        state.bx = clamp(p.x / w, 0.06, 0.94); state.by = clamp(p.y / h, 0.1, 0.9);
        /* rubbing = horizontal movement while over the hair strip */
        const inHair = state.bx < 0.4;
        if (inHair && Math.abs(dx) > 0.5) {
          state.n = Math.min(9.99e15, state.n + Math.abs(dx) * state.rate / 100);
          readouts();
          if (state.parts.length < (EMC.lowTier ? 8 : 22)) {
            const cnt = Math.min(2, 1 + Math.floor(Math.abs(dx) / 8));
            for (let i = 0; i < cnt; i++) {
              state.parts.push({
                x0: w * (0.07 + Math.random() * 0.27), y0: h * (0.2 + Math.random() * 0.6),
                t: 0, dur: 0.38 + Math.random() * 0.22, lift: 10 + Math.random() * 22
              });
            }
          }
        }
        /* a vigorous shake throws the paper bits off; a gentle drag carries them */
        if (Math.hypot(dx, dy) > 22) for (const bit of state.bits) bit.stuck = false;
      } else if (p.type === 'up' || p.type === 'leave') {
        state.drag = false; canvas.classList.remove('dragging');
      }
    });

    const rate = el('bl-rate');
    if (rate) stage.bindRange(rate, 'bl-ratev', v => { state.rate = v * 1e12; }, v => `${v.toFixed(0)}×10¹² e⁻ / stroke`);
    const reset = el('bl-reset');
    if (reset) stage.listen(reset, 'click', () => {
      state.n = 0; state.parts.length = 0;
      resetBits();
      readouts(); wake(); stage.draw();
      EMC.toast('Balloon discharged — the electrons went back to the hair');
    });

    readouts();
    stage.draw();
  }
})();
