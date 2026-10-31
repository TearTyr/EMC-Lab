/* EMC Lab — kinetic lettering sprites (shared by js/intro.js).
   The Override-style type is a very heavy serif, white fill, thin coral edge,
   a solid stepped extrusion and slightly rough edges. Each word is drawn ONCE
   to an offscreen canvas; after that the engine only moves/scales that canvas
   (transform + opacity), so there is no live text-stroke / text-shadow /
   SVG-filter cost per frame and it renders the same in Chrome, Firefox and Edge.
   `_d` inside a word draws the digit d as a subscript (R_1 -> R with a small 1,
   the display subset has no unicode subscripts).
   API: EMC_KINETIC.ready() -> Promise, EMC_KINETIC.sprite(text, px) -> {canvas, w, h, px}
   where w/h are the text box in sprite pixels (without padding), px the font size used. */
(function () {
  if (window.EMC_KINETIC) return;

  const FAMILY = '"EMC Display","Noto Serif JP","Hiragino Mincho ProN","Yu Mincho",serif';
  const FILL = '#ffffff', EDGE = '#f58fa6', EXTRUDE = '#e8507a';

  let readyP = null;
  function ready() {
    if (readyP) return readyP;
    readyP = (document.fonts && document.fonts.load)
      ? document.fonts.load('900 64px "EMC Display"', 'ABCRVIPΩΣ=0123456789').catch(() => {})
      : Promise.resolve();
    return readyP;
  }

  /* deterministic jitter so a word always roughens the same way */
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  function parts(text) {
    const out = [], re = /_(\d)/g;
    let last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) out.push({ t: text.slice(last, m.index), sub: false });
      out.push({ t: m[1], sub: true });
      last = m.index + m[0].length;
    }
    if (last < text.length) out.push({ t: text.slice(last), sub: false });
    return out;
  }

  function sprite(text, px) {
    px = Math.max(48, Math.round(px));
    const pad = Math.round(px * .16), ext = Math.max(3, Math.round(px * .05));
    const probe = document.createElement('canvas').getContext('2d');
    const ps = parts(text);
    const font = sz => `900 ${sz}px ${FAMILY}`;
    let w = 0;
    const widths = ps.map(p => { probe.font = font(p.sub ? px * .5 : px); const v = probe.measureText(p.t).width; w += v; return v; });
    const cap = px * .72;                       /* cap height: centre the caps, not the line box */
    const cw = Math.ceil(w + pad * 2 + ext), ch = Math.ceil(px * 1.05 + pad * 2);
    const base = document.createElement('canvas');
    base.width = cw; base.height = ch;
    const x = base.getContext('2d');
    x.textBaseline = 'alphabetic'; x.lineJoin = 'miter'; x.miterLimit = 2.5;
    const baseY = ch / 2 + cap / 2;
    const draw = (dx, dy, mode, color) => {
      let cx = pad + ext * .4;
      ps.forEach((p, i) => {
        x.font = font(p.sub ? px * .5 : px);
        const y = baseY + dy + (p.sub ? px * .22 : 0);
        if (mode === 'stroke') { x.strokeStyle = color; x.lineWidth = px * .035; x.strokeText(p.t, cx + dx, y); }
        else { x.fillStyle = color; x.fillText(p.t, cx + dx, y); }
        cx += widths[i];
      });
    };
    for (let i = ext; i >= 1; i--) { draw(-i * .7, i, 'fill', EXTRUDE); draw(-i * .7, i, 'stroke', EXTRUDE); }
    draw(0, 0, 'stroke', EDGE);
    draw(0, 0, 'fill', FILL);

    /* rough edges: shift thin horizontal bands by a small decaying random walk */
    const out = document.createElement('canvas');
    out.width = cw; out.height = ch;
    const y = out.getContext('2d');
    const rand = rng(hash(text));
    let dx = 0;
    const band = Math.max(2, Math.round(px / 70));
    for (let r = 0; r < ch; r += band) {
      dx = dx * .8 + (rand() - .5) * px * .02;
      y.drawImage(base, 0, r, cw, band, dx, r, cw, band);
    }
    return { canvas: out, w, h: px, px, cw, ch };
  }

  window.EMC_KINETIC = { ready, sprite };
})();
