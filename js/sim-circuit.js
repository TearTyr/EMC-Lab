/* Circuit builder — brief R1, rebuilt from the ground up
   (docs/spec/r1-r2-ground-up-plan.md §4): drag/drop resistors, battery, light
   bulb onto ONE series loop of six sockets. The wire is a closed loop drawn
   through the occupied sockets; the solve is the single sentence R1 teaches —
   one loop ⇒ one current, resistances add, the bulb's glow is its power.
   Pointer drag from the palette (and drag-off to remove), with a complete
   keyboard path: palette buttons arm a part, socket buttons place/remove it,
   and every occupied socket gets a tuning row (− / + / ×). The v1 lane/row
   Kirchhoff editor, challenge strip and parallel banks are cut (M2/M3). */
(function () {
  const canvas = document.getElementById('sim-circuit');
  if (!canvas) return;

  EMC.whenNear(canvas, init);
  function init() {
    const { clamp, unit, eng } = EMC;
    const el = id => document.getElementById(id);
    const SOCKETS = 6;
    const PARTS = {
      bat:  { name: 'battery',  min: 1.5, max: 24,  step: 0.5, def: 12, unit: 'V' },
      res:  { name: 'resistor', min: 1,   max: 100, step: 1,   def: 22, unit: 'Ω' },
      bulb: { name: 'bulb',     min: 5,   max: 30,  step: 1,   def: 15, unit: 'Ω' }
    };
    /* a live bench from the first paint: battery + resistor + bulb */
    const sockets = [
      { kind: 'bat', val: 12 }, { kind: 'res', val: 22 }, { kind: 'bulb', val: 15 },
      null, null, null
    ];
    let armed = null;          // palette part armed for keyboard placement
    let drag = null;           // { from: socketIndex|null, kind, val, x, y }

    /* ---- solve: one loop, one current ---------------------------------- */
    function solve() {
      const occ = sockets.filter(Boolean);
      const bats = occ.filter(s => s.kind === 'bat');
      const bulb = occ.find(s => s.kind === 'bulb');
      if (!bats.length) return { open: 'Drag the battery onto the loop — without a push there is no current.' };
      if (!bulb) return { open: 'Add the bulb to close the loop with something to power.' };
      const V = bats.reduce((a, b) => a + b.val, 0);
      const Rsum = occ.reduce((a, s) => a + (s.kind === 'bat' ? 0 : s.val), 0);
      if (Rsum <= 0) return { short: 'Battery with nothing to resist it — a short circuit. Add a resistor or the bulb.' };
      const I = V / Rsum;
      return { V, Rsum, I, Pbulb: I * I * bulb.val };
    }

    function readouts() {
      const s = solve();
      const note = el('circ-note');
      if (note) {
        const msg = s.open || s.short || '';
        note.hidden = !msg; note.textContent = msg;
      }
      if (el('circ-I')) el('circ-I').textContent = s.I != null ? unit(s.I, 'A', 3) : '0 A';
      if (el('circ-R')) el('circ-R').textContent = s.Rsum != null ? unit(s.Rsum, 'Ω', 3) : '—';
      if (el('circ-P')) el('circ-P').textContent = s.Pbulb != null ? unit(s.Pbulb, 'W', 3) : '0 W';
      const work = s.I != null
        ? `ΣR = ${s.Rsum.toFixed(1)} Ω · I = V/ΣR = ${s.V.toFixed(1)} V / ${s.Rsum.toFixed(1)} Ω = <b>${eng(s.I, 3)}</b> · P(bulb) = I²R = <b>${eng(s.Pbulb, 3)}</b>`
        : s.short ? '<b>short circuit</b> — R = 0' : '<b>open loop</b> — I = 0';
      if (el('circ-sub')) el('circ-sub').innerHTML = work;
      if (el('circ-sub-plain')) el('circ-sub-plain').textContent = s.I != null
        ? `One loop, one current: ${unit(s.I, 'A', 3)} flows through every part. The bulb glows with ${unit(s.Pbulb, 'W', 3)}.`
        : (s.open || s.short || '');
      rows(); socketButtons();
    }

    /* ---- tuning rows + socket buttons (the keyboard path) --------------- */
    function rows() {
      const host = el('circ-rows');
      if (!host) return;
      host.textContent = '';
      sockets.forEach((s, i) => {
        if (!s) return;
        const p = PARTS[s.kind];
        const row = document.createElement('div');
        row.className = 'circ-row';
        row.innerHTML = `<span class="circ-row-name">${p.name} <span class="tiny faint">socket ${i + 1}</span></span>`;
        const mk = (txt, label, fn) => {
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'btn btn-sm'; b.textContent = txt;
          b.setAttribute('aria-label', label); fn(b); return b;
        };
        row.appendChild(mk('−', `decrease ${p.name} value`, b => stage.listen(b, 'click', () => { s.val = clamp(+ (s.val - p.step).toFixed(2), p.min, p.max); readouts(); stage.draw(); })));
        const v = document.createElement('span');
        v.className = 'circ-row-val mono'; v.textContent = `${s.val} ${p.unit}`;
        row.appendChild(v);
        row.appendChild(mk('+', `increase ${p.name} value`, b => stage.listen(b, 'click', () => { s.val = clamp(+ (s.val + p.step).toFixed(2), p.min, p.max); readouts(); stage.draw(); })));
        row.appendChild(mk('×', `remove ${p.name} from socket ${i + 1}`, b => stage.listen(b, 'click', () => { sockets[i] = null; readouts(); stage.draw(); })));
        host.appendChild(row);
      });
    }
    function socketButtons() {
      for (let i = 0; i < SOCKETS; i++) {
        const b = el('circ-sk' + i);
        if (!b) continue;
        const s = sockets[i];
        b.textContent = s ? `${PARTS[s.kind].name.slice(0, 3)} ${s.val}` : '·';
        b.setAttribute('aria-label', `socket ${i + 1}: ${s ? PARTS[s.kind].name + ' ' + s.val + PARTS[s.kind].unit + (armed ? ' — place ' + PARTS[armed].name : ' — remove') : armed ? 'empty — place ' + PARTS[armed].name : 'empty'}`);
        b.classList.toggle('armed', !!armed);
      }
    }

    /* ---- geometry: six sockets around a rounded loop -------------------- */
    function layout(w, h) {
      const m = Math.min(w, h) * 0.16;
      const x0 = m, y0 = m, x1 = w - m, y1 = h - m;
      const cx = (x0 + x1) / 2;
      return [
        { x: x0 + (x1 - x0) * .25, y: y0 }, { x: x0 + (x1 - x0) * .75, y: y0 },
        { x: x1, y: (y0 + y1) / 2 },
        { x: x0 + (x1 - x0) * .75, y: y1 }, { x: x0 + (x1 - x0) * .25, y: y1 },
        { x: x0, y: (y0 + y1) / 2 }
      ];
    }

    function render(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const pts = layout(w, h);
      const m = Math.min(w, h) * 0.16;
      const s = solve();
      ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#3a3d45';
      EMC.roundRect(ctx, m, m, w - 2 * m, h - 2 * m, 18); ctx.stroke();

      /* empty sockets: quiet taps; occupied: part symbols */
      pts.forEach((p, i) => {
        const soc = sockets[i];
        if (!soc) {
          ctx.fillStyle = drag ? '#f6d36b' : '#2e3138';
          ctx.beginPath(); ctx.arc(p.x, p.y, drag ? 9 : 6, 0, 7); ctx.fill();
          return;
        }
        ctx.save(); ctx.translate(p.x, p.y);
        if (soc.kind === 'bat') {
          ctx.strokeStyle = '#f6d36b'; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(-14, -8); ctx.lineTo(14, -8); ctx.stroke();
          ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-7, 6); ctx.lineTo(7, 6); ctx.stroke();
          ctx.fillStyle = '#f6d36b'; ctx.font = '700 12px G8321, system-ui, sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(`${soc.val} V`, 0, -14);
        } else if (soc.kind === 'res') {
          ctx.strokeStyle = '#f8aebe'; ctx.lineWidth = 3.5; ctx.beginPath();
          const zw = 56, zh = 11, n = 6; ctx.moveTo(-zw / 2, 0);
          for (let k = 0; k < n; k++) ctx.lineTo(-zw / 2 + zw * (k + .5) / n, k % 2 ? zh : -zh);
          ctx.lineTo(zw / 2, 0); ctx.stroke();
          ctx.fillStyle = '#f8aebe'; ctx.font = '700 12px G8321, system-ui, sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(`${soc.val} Ω`, 0, 14);
        } else {
          const glow = s.Pbulb != null ? clamp(s.Pbulb / 6, 0, 1) : 0;
          for (let g = 3; g >= 1; g--) {
            ctx.fillStyle = `rgba(246,211,107,${(glow * .5 / g).toFixed(3)})`;
            ctx.beginPath(); ctx.arc(0, 0, 14 + g * 8 * glow, 0, 7); ctx.fill();
          }
          ctx.fillStyle = glow > .02 ? '#f6d36b' : '#22242b';
          ctx.beginPath(); ctx.arc(0, 0, 14, 0, 7); ctx.fill();
          ctx.strokeStyle = '#edebe3'; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.arc(0, 0, 14, 0, 7); ctx.stroke();
          ctx.strokeStyle = '#17181c'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-6, 4); ctx.lineTo(0, -4); ctx.lineTo(6, 4); ctx.stroke();
        }
        ctx.restore();
      });

      /* charge dots at speed ∝ I — one loop, one flow */
      if (s.I != null && s.I > 0) {
        const per = 2 * ((w - 2 * m) + (h - 2 * m));
        const speed = clamp(s.I, 0, 6) * 46;
        const t = performance.now() / 1000;
        const gap = 34, count = Math.floor(per / gap);
        ctx.fillStyle = '#e9ff47';
        for (let i = 0; i < count; i++) {
          const d = (i * gap + t * speed) % per;
          const p = perimeterPoint(d, m, m, w - m, h - m);
          ctx.beginPath(); ctx.arc(p.x, p.y, 3.4, 0, 7); ctx.fill();
        }
      }
      /* the part under drag rides the pointer */
      if (drag) {
        ctx.fillStyle = 'rgba(246,211,107,.85)';
        ctx.beginPath(); ctx.arc(drag.x, drag.y, 12, 0, 7); ctx.fill();
        ctx.fillStyle = '#17181c'; ctx.font = '700 11px G8321, system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(PARTS[drag.kind].name.slice(0, 3), drag.x, drag.y);
      }
    }
    function perimeterPoint(d, x0, y0, x1, y1) {
      const wt = x1 - x0, hr = y1 - y0;
      if (d < wt) return { x: x0 + d, y: y0 };
      d -= wt; if (d < hr) return { x: x1, y: y0 + d };
      d -= hr; if (d < wt) return { x: x1 - d, y: y1 };
      d -= wt; return { x: x0, y: y1 - d };
    }

    const stage = new EMC.Stage(canvas, render, { animate: true });

    /* ---- pointer: drag placed parts between sockets, or off the bench --- */
    stage.onPointer(p => {
      const rect = canvas.getBoundingClientRect();
      const pts = layout(rect.width, rect.height);
      const near = (x, y, r) => pts.findIndex(q => (q.x - x) ** 2 + (q.y - y) ** 2 < r * r);
      if (p.type === 'down') {
        const i = near(p.x, p.y, 26);
        if (i >= 0 && sockets[i]) {
          if (armed) { sockets[i] = { kind: armed, val: PARTS[armed].def }; armed = null; readouts(); }
          else drag = { from: i, kind: sockets[i].kind, val: sockets[i].val, x: p.x, y: p.y };
        } else if (i >= 0 && armed) {
          sockets[i] = { kind: armed, val: PARTS[armed].def }; armed = null; readouts();
        }
        stage.draw();
      } else if (p.type === 'move' && drag) {
        drag.x = p.x; drag.y = p.y; stage.draw();
      } else if ((p.type === 'up' || p.type === 'cancel') && drag) {
        const i = near(p.x, p.y, 30);
        if (i >= 0 && !sockets[i]) { sockets[i] = { kind: drag.kind, val: drag.val }; sockets[drag.from] = null; }
        else if (i < 0 && (p.x < 4 || p.y < 4 || p.x > rect.width - 4 || p.y > rect.height - 4)) {
          sockets[drag.from] = null;                       // dropped off the bench
        }                                                  // otherwise snap back
        drag = null; readouts(); stage.draw();
      }
    });

    /* ---- palette: pointer-drag chips AND arm buttons for keyboard ------- */
    document.querySelectorAll('[data-circ-part]').forEach(chip => {
      const kind = chip.getAttribute('data-circ-part');
      /* keyboard-originated clicks (detail 0: Enter/Space on the button) arm
         the part; pointer taps arm via the pointerup path above — one arm
         action per interaction, never a double toggle */
      stage.listen(chip, 'click', e => {
        if (e.detail === 0) { armed = armed === kind ? null : kind; socketButtons(); stage.draw(); }
      });
      stage.listen(chip, 'pointerdown', e => {
        e.preventDefault();
        const sx = e.clientX, sy = e.clientY;
        let moved = false;
        drag = { from: null, kind, val: PARTS[kind].def, x: 0, y: 0 };
        const move = ev => {
          if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 6) moved = true;
          const r = canvas.getBoundingClientRect();
          drag.x = ev.clientX - r.left; drag.y = ev.clientY - r.top; stage.draw();
        };
        const up = ev => {
          document.removeEventListener('pointermove', move);
          document.removeEventListener('pointerup', up);
          /* a tap (no drag) arms the part for the keyboard/click path —
             pointerdown preventDefault suppresses click in some browsers,
             so arming cannot wait for a click event */
          if (!moved) { armed = armed === kind ? null : kind; drag = null; socketButtons(); stage.draw(); return; }
          const r = canvas.getBoundingClientRect();
          const x = ev.clientX - r.left, y = ev.clientY - r.top;
          const pts = layout(r.width, r.height);
          const i = pts.findIndex(q => (q.x - x) ** 2 + (q.y - y) ** 2 < 30 * 30);
          if (i >= 0 && !sockets[i]) { sockets[i] = { kind, val: PARTS[kind].def }; readouts(); }
          drag = null; stage.draw();
        };
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', up);
      });
    });
    for (let i = 0; i < SOCKETS; i++) {
      const b = el('circ-sk' + i);
      if (!b) continue;
      stage.listen(b, 'click', () => {
        if (armed) { sockets[i] = { kind: armed, val: PARTS[armed].def }; armed = null; }
        else if (sockets[i]) sockets[i] = null;
        readouts(); stage.draw();
      });
    }
    /* testability hook (the v1 builder exposed window.__CIRC too) */
    window.__CIRC = { get state() { return sockets; }, get armed() { return armed; }, solve };
    readouts(); stage.draw();
  }
})();
