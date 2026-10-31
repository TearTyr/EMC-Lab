/* EMC Lab — landing sequence (home page only).
   After the intro's mascot jumps out and its overlay wipes away, the page
   shows nothing but the background; then the page's own mascot drops to the
   middle of the screen (squash + ring burst), rises to its slot while the
   title slams in letter by letter, the tagline / buttons / meta line follow
   and the nav drops down. A tiny inline <head> script sets
   `html.landing-pending` (hero text + nav hidden) on bare-home loads only; this
   file ALWAYS clears it: on the intro's landing event, immediately when the
   intro never played (skipped by a test/bypass, not the home route, fatal boot,
   reduced motion) and after a hard failsafe. Everything is transform/opacity.
   Nothing is stored; one init per page; every timer is cleared. */
(function () {
  const html = document.documentElement;
  if (!html.classList.contains('landing-pending')) return;       // nothing to do (reduced motion, hash route, ?t=, no JS)
  if (window.__emcLanding) return;
  window.__emcLanding = 1;

  const mascot = document.querySelector('.hero-mascot');
  const title = document.getElementById('heroTitle');
  const lines = [...document.querySelectorAll('.hero .lp-line')];
  let timers = [];
  let done = false;
  const later = (fn, ms) => { timers.push(setTimeout(fn, ms)); };

  function clear() {
    done = true;
    html.classList.remove('landing-pending', 'lp-land');
    if (mascot) { mascot.style.transform = ''; mascot.style.transition = ''; }
    document.querySelectorAll('.lp-ring').forEach(r => r.remove());
    timers.forEach(clearTimeout); timers = [];
    document.removeEventListener('emc:intro-land', onLand);
  }

  /* instant: no animation (the intro never played, or the sequence failed) */
  function instant() {
    if (done) return;
    clear();
    html.classList.remove('lp-reveal');
  }

  /* split the display title into per-letter spans once (the real text stays readable for assistive tech) */
  function splitTitle() {
    if (!title || title.querySelector('.lp-ch')) return;
    const text = title.textContent;
    title.setAttribute('aria-label', text);
    title.textContent = '';
    [...text].forEach((c, j) => {
      const s = document.createElement('span');
      s.className = 'lp-ch'; s.setAttribute('aria-hidden', 'true');
      s.textContent = c === ' ' ? ' ' : c;
      s.style.setProperty('--j', j);
      title.appendChild(s);
    });
  }

  /* distance from the mascot's resting slot to the middle of the viewport */
  function measure() {
    if (!mascot) return 0;
    const had = mascot.style.transform;
    mascot.style.transform = 'none';
    const r = mascot.getBoundingClientRect();
    mascot.style.transform = had;
    const y = innerHeight / 2 - (r.top + r.height / 2);
    html.style.setProperty('--lp-y', y.toFixed(1) + 'px');
    return y;
  }

  function reveal() {
    if (done) return;
    splitTitle();
    lines.forEach((el, i) => el.style.setProperty('--i', i));
    /* hold the mascot at the middle with an inline transform, drop the gate, then let it ride up to its slot */
    const y = measure();
    if (mascot) {
      mascot.style.transform = `translateY(${y}px)`;
      html.classList.remove('lp-land');
      html.classList.add('lp-reveal');
      html.classList.remove('landing-pending');
      void mascot.offsetWidth;
      mascot.style.transition = 'transform .8s cubic-bezier(.2,.9,.25,1.12)';
      mascot.style.transform = 'translateY(0px)';
    } else {
      html.classList.add('lp-reveal');
      html.classList.remove('landing-pending');
    }
    later(() => { clear(); }, 1800);          /* sequence over: back to the page's own idle float */
  }

  function onLand(e) {
    if (done) return;
    document.removeEventListener('emc:intro-land', onLand);
    const played = !(e && e.detail && e.detail.played === false);
    if (!played || !mascot || (window.EMC && window.EMC.reducedMotion)) { instant(); return; }
    measure();
    html.classList.add('lp-land');
    const ring = document.createElement('i');
    ring.className = 'lp-ring';
    ring.style.top = (innerHeight / 2 + mascot.getBoundingClientRect().height * .35) + 'px';
    document.body.appendChild(ring);
    later(() => ring.classList.add('go'), 590);     // impact frame of lp-drop (62% of .95 s)
    later(reveal, 1000);
  }

  document.addEventListener('emc:intro-land', onLand);

  /* the intro was already removed before we loaded (non-home route, bypass, fatal boot): no sequence */
  if (!document.getElementById('introOverlay')) instant();
  /* hard failsafe: the page can never stay hidden */
  else later(instant, 30000);

  window.EMC_LANDING = { state() { return { done, pending: html.classList.contains('landing-pending'), timers: timers.length }; }, skip: instant };
})();
