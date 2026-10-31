/* EMC Lab — landing sequence (home page only).
   After the intro's mascot jumps out and its overlay lifts away, the page shows
   nothing but the background. The mascot falls to the middle of the screen with a
   growing shadow, squashes hard on impact (shockwave, sparks, a small page nudge,
   bounces twice and settles. Only then does it ride up to its slot
   while the title slams in and the rest of the hero, the nav and the page follow.
   A tiny inline <head> script sets `html.landing-pending` (hero text + nav hidden)
   on bare-home loads only; this file ALWAYS clears it: on the intro's landing
   event, immediately when the intro never played (bypass, not the home route,
   fatal boot, reduced motion) and after a hard failsafe. The mascot moves through
   the Web Animations API (transform only, nothing is measured during the
   sequence). Nothing is stored; one init per page; every timer is cleared. */
(function () {
  const html = document.documentElement;
  if (!html.classList.contains('landing-pending')) return;       // nothing to do (reduced motion, hash route, ?t=, no JS)
  if (window.__emcLanding) return;
  window.__emcLanding = 1;

  const DROP_MS = 1500, IMPACT_MS = 500, RIDE_MS = 800;
  const mascot = document.querySelector('.hero-mascot');
  const hero = document.querySelector('.hero');
  const title = document.getElementById('heroTitle');
  const lines = [...document.querySelectorAll('.hero .lp-line')];
  let timers = [];
  let done = false;
  let lpY = 0, mascotH = 160, stale = true;
  let drop = null, fx = null;
  const later = (fn, ms) => { timers.push(setTimeout(fn, ms)); };

  function clear() {
    done = true;
    html.classList.remove('landing-pending', 'lp-land', 'lp-reveal', 'lp-rest');
    if (mascot) {
      if (drop) drop.cancel();
      mascot.style.transformOrigin = '';
    }
    if (fx) { fx.remove(); fx = null; }
    timers.forEach(clearTimeout); timers = [];
    document.removeEventListener('emc:intro-land', onLand);
    removeEventListener('resize', markStale);
    document.dispatchEvent(new CustomEvent('emc:landing-done'));
  }

  /* instant: no animation (the intro never played, or the sequence failed) */
  function instant() {
    if (done) return;
    clear();
  }

  /* split the title into per-letter spans once (the real text stays readable for assistive tech) */
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

  /* Distance from the mascot's resting slot to the middle of the viewport. Read
     while the intro covers the page, never during the sequence. */
  function measure() {
    if (!mascot) return;
    const r = mascot.getBoundingClientRect();
    lpY = innerHeight / 2 - (r.top + r.height / 2);
    mascotH = r.height || mascotH;
    stale = false;
  }
  function markStale() { stale = true; }

  /* shadow, shockwave and sparks live in one element, built once at the impact point */
  function buildFx() {
    const el = document.createElement('div');
    el.className = 'lp-fx';
    el.setAttribute('aria-hidden', 'true');
    el.style.top = (innerHeight / 2 + mascotH * .5) + 'px';
    let html_ = '<i class="lp-shadow"></i><i class="lp-ring"></i>';
    for (let i = 0; i < 8; i++) html_ += `<i class="lp-spark" style="--a:${i * 45 + 22}deg"></i>`;
    el.innerHTML = html_;
    document.body.appendChild(el);
    return el;
  }

  function dropIn() {
    const y = lpY, h = mascotH, T = v => `translateY(${(y + v).toFixed(1)}px)`;
    const fall = -(innerHeight * 1.15);
    mascot.style.transformOrigin = '50% 100%';
    drop = mascot.animate([
      { offset: 0, transform: `${T(fall)} scale(.9, 1.16)`, easing: 'cubic-bezier(.5, 0, .9, .6)' },
      { offset: .333, transform: `${T(0)} scale(1.24, .7)`, easing: 'cubic-bezier(.2, .8, .3, 1)' },
      { offset: .46, transform: `${T(-h * .2)} scale(.93, 1.09)`, easing: 'cubic-bezier(.5, 0, .9, .6)' },
      { offset: .6, transform: `${T(0)} scale(1.1, .88)`, easing: 'cubic-bezier(.2, .8, .3, 1)' },
      { offset: .7, transform: `${T(-h * .05)} scale(.98, 1.03)`, easing: 'ease-in' },
      { offset: .8, transform: `${T(0)} scale(1.03, .97)`, easing: 'ease-out' },
      { offset: 1, transform: `${T(0)} scale(1, 1)` }
    ], { duration: DROP_MS, fill: 'forwards' });
  }

  function impact() {
    if (done) return;
    fx.classList.add('hit');
    if (hero && hero.animate) {
      hero.animate([{ transform: 'none' }, { transform: 'translateY(7px)' }, { transform: 'translateY(-2px)' }, { transform: 'none' }],
        { duration: 240, easing: 'ease-out' });
    }
  }

  function reveal() {
    if (done) return;
    splitTitle();
    lines.forEach((el, i) => el.style.setProperty('--i', i));
    /* the rest of the page (all below the fold) stays hidden one beat longer so the hero reveal only restyles the hero */
    html.classList.add('lp-reveal', 'lp-rest');
    html.classList.remove('lp-land', 'landing-pending');
    if (drop) { drop.cancel(); drop = null; }
    mascot.style.transformOrigin = '';
    fx.classList.add('off');
    mascot.animate([{ transform: `translateY(${lpY.toFixed(1)}px)` }, { transform: 'translateY(0)' }],
      { duration: RIDE_MS, easing: 'cubic-bezier(.2, .9, .25, 1.12)' });
    later(() => html.classList.remove('lp-rest'), 900);
    later(clear, 1800);                      /* sequence over: back to the page's own idle float */
  }

  function onLand(e) {
    if (done) return;
    document.removeEventListener('emc:intro-land', onLand);
    const played = !(e && e.detail && e.detail.played === false);
    if (!played || !mascot || !mascot.animate || (window.EMC && window.EMC.reducedMotion)) { instant(); return; }
    if (stale) measure();
    fx = buildFx();
    html.classList.add('lp-land');
    dropIn();
    later(impact, IMPACT_MS);
    later(reveal, DROP_MS + 40);
  }

  document.addEventListener('emc:intro-land', onLand);
  addEventListener('resize', markStale);
  if (document.readyState === 'complete') measure(); else addEventListener('load', measure, { once: true });

  /* the intro was already removed before we loaded (non-home route, bypass, fatal boot): no sequence */
  if (!document.getElementById('introOverlay')) instant();
  /* hard failsafe: the page can never stay hidden */
  else later(instant, 30000);

  window.EMC_LANDING = { state() { return { done, pending: html.classList.contains('landing-pending'), timers: timers.length }; }, skip: instant };
})();
