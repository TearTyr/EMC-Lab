/* EMC Lab — kinetic text splitter (the one place text is cut into animated
   characters). Live text, never bitmaps, so letters stay sharp at any size and
   cost nothing after their first paint. The real string stays available to
   assistive tech through aria-label; the character spans are aria-hidden.
   G8321 has no Σ or subscripts, so `Σ` is a small drawn glyph at the same weight
   and `_d` is a small digit (R_1 reads as R with a subscript 1).
   API: EMC_KINETIC.ready() -> Promise (lettering font loaded)
        EMC_KINETIC.split(host, text) -> array of the character spans, in order */
(function () {
  if (window.EMC_KINETIC) return;

  let readyP = null;
  function ready() {
    if (readyP) return readyP;
    readyP = (document.fonts && document.fonts.load)
      ? document.fonts.load('700 64px G8321').catch(() => {})
      : Promise.resolve();
    return readyP;
  }

  const SIGMA = 'M58 16H14l30 34-30 34h44';
  function sigma() {
    const stroke = (dx, dy, cls) => `<path class="${cls}" transform="translate(${dx} ${dy})" d="${SIGMA}"/>`;
    return `<svg class="ks" viewBox="-14 0 84 100" aria-hidden="true">${stroke(-7, 7, 'ks-s')}${stroke(-3.5, 3.5, 'ks-s')}${stroke(0, 0, 'ks-f')}</svg>`;
  }

  function split(host, text) {
    const plain = text.replace(/_(\d)/g, '$1');
    host.setAttribute('role', 'img');
    host.setAttribute('aria-label', plain);
    host.textContent = '';
    const chars = [];
    let word = null;
    const push = (html, cls, isHtml) => {
      if (!word) { word = document.createElement('span'); word.className = 'kw-word'; word.setAttribute('aria-hidden', 'true'); host.appendChild(word); }
      const c = document.createElement('span');
      c.className = 'ch' + (cls ? ' ' + cls : '');
      c.style.setProperty('--i', chars.length);
      if (isHtml) c.innerHTML = html; else c.textContent = html;
      word.appendChild(c);
      chars.push(c);
    };
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === ' ') { word = null; host.appendChild(document.createTextNode(' ')); continue; }
      if (c === '_' && /\d/.test(text[i + 1] || '')) { push(text[++i], 'sb'); continue; }
      if (c === 'Σ') { push(sigma(), 'sg', true); continue; }
      push(c, '');
    }
    return chars;
  }

  window.EMC_KINETIC = { ready, split };
})();
