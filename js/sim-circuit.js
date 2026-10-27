/* Circuit builder — brief R1, rebuilt from the ground up
   (docs/spec/r1-r2-ground-up-plan.md §4): drag/drop resistors, battery, light
   bulb onto ONE series loop of six sockets. The wire is a closed loop drawn
   through the occupied sockets; the solve is the single sentence R1 teaches —
   one loop ⇒ one current, resistances add, the bulb's glow is its power.
   Pointer drag from the palette (and drag-off to remove), with a complete
   keyboard path: palette buttons arm a part, socket buttons place/remove it,
   and every occupied socket gets a tuning row (− / + / ×).
   Visual pass: numbered sockets, a snap preview while dragging, hover
   feedback, batteries always drawn with the + plate downstream of the
   conventional current, a real glowing bulb, per-part voltage drops (V = IR,
   they add up to the supply), and the answer printed in the middle of the
   loop. Element ids, the solve and window.__CIRC are unchanged. */
(function () {
  const canvas = document.getElementById('sim-circuit');
  if (!canvas) return;

  EMC.whenNear(canvas, init);
  function init() {
    const { clamp, unit, eng, label } = EMC;
    const el = id => document.getElementById(id);
    const SOCKETS = 6;
    const PARTS = {
      bat:  { name: 'battery',  min: 1.5, max: 24,  step: 0.5, def: 12, unit: 'V' },
      res:  { name: 'resistor', min: 1,   max: 100, step: 1,   def: 22, unit: 'Ω' },
      bulb: { name: 'bulb',     min: 5,   max: 30,  step: 1,   def: 15, unit: 'Ω' }
    };
    const AMBER = '#f6d36b', PINK = '#f8aebe', CYAN = '#a8d3e0', LIME = '#e9ff47';
    const WIRE = '#3a3d45', WIRE_DK = '#25272d', MUTED = 'rgba(169,186,214,.85)';
    /* direction of conventional current (clockwise) at each socket, radians */
    const FLOW = [0, 0, Math.PI / 2, Math.PI, Math.PI, -Math.PI / 2];

    /* a live bench from the first paint: battery + resistor + bulb */
    const sockets = [
      { kind: 'bat', val: 12 }, { kind: 'res', val: 22 }, { kind: 'bulb', val: 15 },
      null, null, null
    ];
    let armed = null;          // palette part armed for keyboard placement
    let drag = null;           // { from: socketIndex|null, kind, val, x, y }
    let hover = -1;            // socket under the pointer

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
        const mk = (txt, lab, fn) => {
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'btn btn-sm'; b.textContent = txt;
          b.setAttribute('aria-label', lab); fn(b); return b;
        };
        row.appendChild(mk('−', `decrease ${p.name} value`, b => stage.listen(b, 'click', () => { s.val = clamp(+ (s.val - p.step).toFixed(2), p.min, p.max); readouts(); redraw(); })));
        const v = document.createElement('span');
        v.className = 'circ-row-val mono'; v.textContent = `${s.val} ${p.unit}`;
        row.appendChild(v);
        row.appendChild(mk('+', `increase ${p.name} value`, b => stage.listen(b, 'click', () => { s.val = clamp(+ (s.val + p.step).toFixed(2), p.min, p.max); readouts(); redraw(); })));
        row.appendChild(mk('×', `remove ${p.name} from socket ${i + 1}`, b => stage.listen(b, 'click', () => { sockets[i] = null; readouts(); redraw(); })));
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

    /* every state change wakes the Stage (it parks itself when nothing moves) */
    function redraw() { stage.setIdle(false); stage.draw(); }

    /* ---- geometry: six sockets around a rounded loop -------------------- */
    function layout(w, h) {
      const m = Math.min(w, h) * 0.16;
      const x0 = m, y0 = m, x1 = w - m, y1 = h - m;
      return [
        { x: x0 + (x1 - x0) * .25, y: y0 }, { x: x0 + (x1 - x0) * .75, y: y0 },
        { x: x1, y: (y0 + y1) / 2 },
        { x: x0 + (x1 - x0) * .75, y: y1 }, { x: x0 + (x1 - x0) * .25, y: y1 },
        { x: x0, y: (y0 + y1) / 2 }
      ];
    }
    const loc = (ang, lx, ly) => ({ x: Math.cos(ang) * lx - Math.sin(ang) * ly, y: Math.sin(ang) * lx + Math.cos(ang) * ly });
    function perimeterPoint(d, x0, y0, x1, y1) {
      const wt = x1 - x0, hr = y1 - y0;
      if (d < wt) return { x: x0 + d, y: y0 };
      d -= wt; if (d < hr) return { x: x1, y: y0 + d };
      d -= hr; if (d < wt) return { x: x1 - d, y: y1 };
      d -= wt; return { x: x0, y: y1 - d };
    }
    function chevron(ctx, x, y, ang, a) {
      if (a <= 0.02) return;
      ctx.save();
      ctx.translate(x, y); ctx.rotate(ang);
      ctx.strokeStyle = `rgba(233,255,71,${a.toFixed(3)})`;
      ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-5, -6); ctx.lineTo(3, 0); ctx.lineTo(-5, 6); ctx.stroke();
      ctx.restore();
    }

    /* one part, drawn in a frame whose +x axis is the conventional-current direction */
    function drawPart(ctx, kind, val, x, y, ang, s, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha == null ? 1 : alpha;
      ctx.translate(x, y); ctx.rotate(ang);
      if (kind === 'bat') {
        /* current leaves the LONG (+) plate: it sits on the downstream side */
        ctx.strokeStyle = AMBER; ctx.lineCap = 'round';
        ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(7, -18); ctx.lineTo(7, 18); ctx.stroke();
        ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-6, -9); ctx.lineTo(-6, 9); ctx.stroke();
      } else if (kind === 'res') {
        const heat = s && s.I != null ? clamp(Math.sqrt(s.I * s.I * val / 12), 0, 1) : 0;
        if (heat > 0.03) {
          ctx.fillStyle = `rgba(248,174,190,${(0.08 + 0.3 * heat).toFixed(3)})`;
          EMC.roundRect(ctx, -34, -19, 68, 38, 9); ctx.fill();
        }
        ctx.strokeStyle = PINK; ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        ctx.beginPath();
        const zw = 56, zh = 11, n = 6; ctx.moveTo(-zw / 2 - 6, 0); ctx.lineTo(-zw / 2, 0);
        for (let k = 0; k < n; k++) ctx.lineTo(-zw / 2 + zw * (k + .5) / n, k % 2 ? zh : -zh);
        ctx.lineTo(zw / 2, 0); ctx.lineTo(zw / 2 + 6, 0); ctx.stroke();
      } else {
        const glow = s && s.Pbulb != null ? clamp(Math.sqrt(s.Pbulb / 4), 0, 1) : 0;
        for (let g = 4; g >= 1; g--) {
          ctx.fillStyle = `rgba(246,211,107,${(glow * 0.34 / g).toFixed(3)})`;
          ctx.beginPath(); ctx.arc(0, 0, 15 + g * 9 * glow, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = glow > .04 ? `rgba(246,211,107,${(0.35 + 0.6 * glow).toFixed(3)})` : '#22242b';
        ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#edebe3'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.stroke();
        /* filament: a little coil between two posts */
        ctx.strokeStyle = glow > .04 ? '#fff6cf' : '#8d8f98'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-9, 5); ctx.lineTo(-9, -1);
        ctx.lineTo(-6, -5); ctx.lineTo(-3, 1); ctx.lineTo(0, -5); ctx.lineTo(3, 1); ctx.lineTo(6, -5); ctx.lineTo(9, -1); ctx.lineTo(9, 5);
        ctx.stroke();
      }
      ctx.restore();
    }

    /* where each socket's text sits: outside = value, inside = voltage drop */
    function textSpots(i, p) {
      if (i === 2) return { v: { x: p.x + 38, y: p.y, align: 'left' }, d: { x: p.x - 38, y: p.y, align: 'right' }, n: { x: p.x + 22, y: p.y - 28, align: 'left' } };
      if (i === 5) return { v: { x: p.x - 38, y: p.y, align: 'right' }, d: { x: p.x + 38, y: p.y, align: 'left' }, n: { x: p.x - 22, y: p.y - 28, align: 'right' } };
      if (i <= 1) return { v: { x: p.x, y: p.y - 28, align: 'center' }, d: { x: p.x, y: p.y + 30, align: 'center' }, n: { x: p.x, y: p.y - 14, align: 'center' } };
      return { v: { x: p.x, y: p.y + 28, align: 'center' }, d: { x: p.x, y: p.y - 30, align: 'center' }, n: { x: p.x, y: p.y + 14, align: 'center' } };
    }

    function render(ctx, w, h, stg) {
      ctx.clearRect(0, 0, w, h);
      const pts = layout(w, h);
      const m = Math.min(w, h) * 0.16;
      const x0 = m, y0 = m, x1 = w - m, y1 = h - m;
      const s = solve();
      const live = s.I != null ? clamp(s.I / 3, 0, 1) : 0;
      const t = performance.now() / 1000;

      /* wire: dark rail + core + amber energy overlay following I */
      ctx.save();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      EMC.roundRect(ctx, x0, y0, x1 - x0, y1 - y0, 18);
      ctx.lineWidth = 7; ctx.strokeStyle = WIRE_DK; ctx.stroke();
      ctx.lineWidth = 3.2; ctx.strokeStyle = WIRE; ctx.stroke();
      if (live > 0.01) { ctx.strokeStyle = `rgba(246,211,107,${(0.12 + 0.5 * live).toFixed(3)})`; ctx.stroke(); }
      ctx.restore();

      /* a part INSERTS into the wire: erase a gap at every occupied socket */
      pts.forEach((p, i) => {
        if (!sockets[i]) return;
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.translate(p.x, p.y); ctx.rotate(FLOW[i]);
        ctx.lineWidth = 12; ctx.lineCap = 'butt';
        ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(34, 0); ctx.stroke();
        ctx.restore();
      });

      /* snap target while dragging / hover */
      let snap = -1;
      if (drag) {
        let best = 30 * 30;
        pts.forEach((p, i) => {
          const d2 = (p.x - drag.x) ** 2 + (p.y - drag.y) ** 2;
          if (d2 < best && (!sockets[i] || i === drag.from)) { best = d2; snap = i; }
        });
      }
      const pulse = 0.5 + 0.5 * Math.sin(t * 5);

      pts.forEach((p, i) => {
        const soc = sockets[i];
        const spot = textSpots(i, p);
        if (!soc) {
          const hot = drag || armed;
          const isSnap = i === snap;
          if (hot) {
            ctx.strokeStyle = isSnap ? AMBER : `rgba(246,211,107,${(0.35 + 0.35 * pulse).toFixed(3)})`;
            ctx.lineWidth = isSnap ? 3 : 2;
            ctx.beginPath(); ctx.arc(p.x, p.y, isSnap ? 18 : 14, 0, Math.PI * 2); ctx.stroke();
          }
          ctx.fillStyle = hot ? AMBER : (i === hover ? '#8d8f98' : '#2e3138');
          ctx.beginPath(); ctx.arc(p.x, p.y, hot ? 7 : (i === hover ? 7 : 5.5), 0, Math.PI * 2); ctx.fill();
          label(ctx, String(i + 1), spot.n.x, spot.n.y, { color: 'rgba(169,186,214,.55)', size: 10, weight: '600', align: spot.n.align, halo: false });
          return;
        }
        if (drag && i === drag.from) {            // lifted: show where it came from
          ctx.strokeStyle = 'rgba(169,186,214,.4)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.arc(p.x, p.y, 20, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
          return;
        }
        drawPart(ctx, soc.kind, soc.val, p.x, p.y, FLOW[i], s, 1);
        if (soc.kind === 'bat') {            // polarity marks sit in the wire gap, along the flow
          const a = loc(FLOW[i], 19, 0), b = loc(FLOW[i], -19, 0);
          label(ctx, '+', p.x + a.x, p.y + a.y, { color: PINK, size: 13, weight: '800', halo: false });
          label(ctx, '−', p.x + b.x, p.y + b.y, { color: CYAN, size: 14, weight: '800', halo: false });
        }
        if (i === hover && !drag) {
          ctx.strokeStyle = 'rgba(168,211,224,.55)'; ctx.lineWidth = 1.8;
          EMC.roundRect(ctx, p.x - 34, p.y - 24, 68, 48, 12); ctx.stroke();
        }
        /* value outside, voltage drop inside */
        label(ctx, `${soc.val} ${PARTS[soc.kind].unit}`, spot.v.x, spot.v.y,
          { color: soc.kind === 'bat' ? AMBER : soc.kind === 'bulb' ? '#fff0b8' : PINK, size: 12, weight: '700', align: spot.v.align });
        if (s.I != null) {
          const txt = soc.kind === 'bat' ? `+${soc.val.toFixed(1)} V` : `−${(s.I * soc.val).toFixed(2)} V`;
          label(ctx, txt, spot.d.x, spot.d.y, { color: soc.kind === 'bat' ? 'rgba(246,211,107,.85)' : MUTED, size: 10.5, weight: '500', align: spot.d.align });
        }
      });

      /* chevrons: which way conventional current flows */
      const ca = live > 0 ? 0.35 + 0.5 * live : 0;
      chevron(ctx, (x0 + x1) / 2, y0, 0, ca);
      chevron(ctx, x1, y0 + (y1 - y0) * 0.22, Math.PI / 2, ca);
      chevron(ctx, x1, y0 + (y1 - y0) * 0.78, Math.PI / 2, ca);
      chevron(ctx, (x0 + x1) / 2, y1, Math.PI, ca);
      chevron(ctx, x0, y0 + (y1 - y0) * 0.22, -Math.PI / 2, ca);
      chevron(ctx, x0, y0 + (y1 - y0) * 0.78, -Math.PI / 2, ca);

      /* charge dots at speed ∝ I — one loop, one flow; hidden inside parts */
      if (s.I != null && s.I > 0) {
        const per = 2 * ((x1 - x0) + (y1 - y0));
        const speed = clamp(s.I, 0, 6) * 46;
        const gap = 34, count = Math.floor(per / gap);
        for (let i = 0; i < count; i++) {
          const d = (i * gap + t * speed) % per;
          const p = perimeterPoint(d, x0, y0, x1, y1);
          let hidden = false;
          for (let k = 0; k < SOCKETS; k++) {
            const dd = Math.hypot(p.x - pts[k].x, p.y - pts[k].y);
            if (dd < 10 || (sockets[k] && !(drag && k === drag.from) && dd < 30)) { hidden = true; break; }
          }
          if (hidden) continue;
          ctx.fillStyle = 'rgba(233,255,71,.16)';
          ctx.beginPath(); ctx.arc(p.x, p.y, 6.4, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = LIME;
          ctx.beginPath(); ctx.arc(p.x, p.y, 3.4, 0, Math.PI * 2); ctx.fill();
        }
      }

      /* the answer, in the middle of the loop */
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      const roomy = x1 - x0 > 200 && y1 - y0 > 120;
      if (s.I != null && roomy) {
        label(ctx, 'one loop, one current', cx, cy - 26, { color: MUTED, size: 11.5, weight: '600', halo: false });
        label(ctx, unit(s.I, 'A', 3), cx, cy, { color: CYAN, size: clamp((y1 - y0) * 0.16, 20, 30), weight: '800', halo: false });
        label(ctx, `${s.V.toFixed(1)} V ÷ ${s.Rsum.toFixed(1)} Ω`, cx, cy + 26, { color: AMBER, size: 11.5, weight: '700', halo: false });
      } else if (s.open || s.short) {
        label(ctx, s.short ? 'short circuit — add a resistor' : (s.open.indexOf('battery') >= 0 && !sockets.some(q => q && q.kind === 'bat') ? 'no battery → no current' : 'add the bulb to close the loop'),
          cx, cy, { color: '#b9b7ae', size: 13, weight: '700', halo: false });
      }

      /* the part under drag rides the pointer, with a snap preview */
      if (drag) {
        if (snap >= 0) drawPart(ctx, drag.kind, drag.val, pts[snap].x, pts[snap].y, FLOW[snap], s, 0.45);
        drawPart(ctx, drag.kind, drag.val, drag.x, drag.y, 0, s, 0.95);
        label(ctx, PARTS[drag.kind].name, drag.x, drag.y - 28, { color: '#e8eefb', size: 11, weight: '700' });
      }

      /* nothing moves without current, a drag or an armed part: park the loop */
      if (!(s.I > 0) && !drag && !armed && stg && stg.setIdle && stg.intro() >= 1) stg.setIdle(true);
    }

    const stage = new EMC.Stage(canvas, render, { animate: true, intro: 280 });

    /* ---- pointer: drag placed parts between sockets, or off the bench --- */
    stage.onPointer(p => {
      const w = stage.w, h = stage.h;
      const pts = layout(w, h);
      const near = (x, y, r) => pts.findIndex(q => (q.x - x) ** 2 + (q.y - y) ** 2 < r * r);
      if (p.type === 'down') {
        const i = near(p.x, p.y, 26);
        if (i >= 0 && sockets[i]) {
          if (armed) { sockets[i] = { kind: armed, val: PARTS[armed].def }; armed = null; readouts(); }
          else { drag = { from: i, kind: sockets[i].kind, val: sockets[i].val, x: p.x, y: p.y }; canvas.style.cursor = 'grabbing'; }
        } else if (i >= 0 && armed) {
          sockets[i] = { kind: armed, val: PARTS[armed].def }; armed = null; readouts();
        }
        redraw();
      } else if (p.type === 'move') {
        if (drag) { drag.x = p.x; drag.y = p.y; redraw(); }
        else {
          const i = near(p.x, p.y, 26);
          if (i !== hover) { hover = i; canvas.style.cursor = i >= 0 && sockets[i] ? 'grab' : ''; redraw(); }
        }
      } else if (p.type === 'leave') {
        if (hover !== -1) { hover = -1; canvas.style.cursor = ''; redraw(); }
      } else if (p.type === 'up' && drag) {
        const i = near(p.x, p.y, 30);
        if (i >= 0 && !sockets[i]) { sockets[i] = { kind: drag.kind, val: drag.val }; sockets[drag.from] = null; }
        else if (i < 0 && (p.x < 4 || p.y < 4 || p.x > w - 4 || p.y > h - 4)) {
          sockets[drag.from] = null;                       // dropped off the bench
        }                                                  // otherwise snap back
        drag = null; canvas.style.cursor = ''; readouts(); redraw();
      }
    });

    /* ---- palette: pointer-drag chips AND arm buttons for keyboard ------- */
    document.querySelectorAll('[data-circ-part]').forEach(chip => {
      const kind = chip.getAttribute('data-circ-part');
      /* keyboard-originated clicks (detail 0: Enter/Space on the button) arm
         the part; pointer taps arm via the pointerup path below — one arm
         action per interaction, never a double toggle */
      stage.listen(chip, 'click', e => {
        if (e.detail === 0) { armed = armed === kind ? null : kind; socketButtons(); redraw(); }
      });
      stage.listen(chip, 'pointerdown', e => {
        e.preventDefault();
        const sx = e.clientX, sy = e.clientY;
        let moved = false;
        /* the drag object only exists once the pointer has actually moved —
           creating it here parked a stray dot at (0,0) on every plain tap */
        const move = ev => {
          if (!moved && Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 6) {
            moved = true; drag = { from: null, kind, val: PARTS[kind].def, x: 0, y: 0 };
          }
          if (!moved) return;
          const r = canvas.getBoundingClientRect();
          drag.x = ev.clientX - r.left; drag.y = ev.clientY - r.top; redraw();
        };
        const up = ev => {
          document.removeEventListener('pointermove', move);
          document.removeEventListener('pointerup', up);
          document.removeEventListener('pointercancel', up);
          /* a tap (no drag) arms the part for the keyboard/click path —
             pointerdown preventDefault suppresses click in some browsers,
             so arming cannot wait for a click event */
          if (!moved) { armed = armed === kind ? null : kind; socketButtons(); redraw(); return; }
          const r = canvas.getBoundingClientRect();
          const x = ev.clientX - r.left, y = ev.clientY - r.top;
          const pts = layout(stage.w, stage.h);
          const i = pts.findIndex(q => (q.x - x) ** 2 + (q.y - y) ** 2 < 30 * 30);
          if (i >= 0 && !sockets[i]) { sockets[i] = { kind, val: PARTS[kind].def }; readouts(); }
          drag = null; redraw();
        };
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', up);
        document.addEventListener('pointercancel', up);
      });
    });
    for (let i = 0; i < SOCKETS; i++) {
      const b = el('circ-sk' + i);
      if (!b) continue;
      stage.listen(b, 'click', () => {
        if (armed) { sockets[i] = { kind: armed, val: PARTS[armed].def }; armed = null; }
        else if (sockets[i]) sockets[i] = null;
        readouts(); redraw();
      });
    }
    /* testability hook (the v1 builder exposed window.__CIRC too) */
    window.__CIRC = { get state() { return sockets; }, get armed() { return armed; }, solve };
    readouts(); stage.draw();
  }
})();
