# Motion

Full reference: `docs/reference/animation-reference.md`. These are the rules that must hold for any change.

1. **Animate `transform` and `opacity` only.** No animated `width`, `top`, `box-shadow`, `filter`, `clip-path` on large areas. (The intro's per-word `clip-path` for the `wipe` move is the one deliberate exception.)
2. **Every effect has a reduced-motion path.** `EMC.reducedMotion` in JS, `@media (prefers-reduced-motion: reduce)` in CSS: show the final state instantly. Nothing important is only reachable through motion.
3. **Nothing runs without JS and nothing hides content without JS.** Reveals are gated on `html.js` / `html.mx-js`.
4. **No idle work.** A settled page has zero running `requestAnimationFrame` chains and zero timers. Scroll-driven effects use one passive listener plus rAF, active only while their section is in view (IntersectionObserver). Hidden tabs pause.
5. **Do not read layout in a frame loop.** Measure once per run or resize, then only write transforms. Write through a per-element cache so unchanged values are not re-set.
6. **Background work waits for the intro.** Use `EMC.afterIntro(cb)` for anything heavy (typesetting, prefetch) so it cannot stall the timeline.
7. **Own cleanup.** Every listener, timer, observer and rAF a module adds is removed when it finishes. `tools/suites/page.mjs` (intro) checks for leaks.
8. **No new motion system.** Reveals use `[data-mx="rise|slam|slide|pop|flash|whip|spin|lines|corner|badge|words"]` from `js/motion.js`. Page changes use the title cards.
9. **Firefox is required.** Do not rely on CSS scroll-driven animations (`animation-timeline`) as the only implementation.

## Phones

- The intro stage uses container units (`cqw`) on `#st`; size with `svh` (with a `vh` fallback), never a fixed pixel height. Ignore height-only resizes (address bar).
- Check at 360×640, 390×844, 412×915 and 844×390 (`emc-mobile-check`). Nothing may overlap the mascot or leave the screen at rest.
- Profile before optimising: CPU-throttle (4×) at 390×844 and look at frame times. Do not drop an entrance move to fix lag; reduce what each move costs (fewer layers, no `will-change` at rest, smaller canvases).
- No lite mode and no phone-only removal of elements or frames: phones show what desktop shows. Cut cost with caching, layering and fewer layout reads.
- Reveal order on the landing page: intro, landing drop, hero text, then the rest. Each handoff is an event (`emc:intro-land`, `emc:landing-done`).
