# Animation reference

The site's motion lives in four places. Everything animates `transform` / `opacity`
only, every effect has a reduced-motion path, and nothing runs without JS.

| Piece | File | What it does |
|---|---|---|
| Intro (v10) | `js/intro.js`, `js/kinetic.js`, `#introOverlay` CSS | ~16.6 s Override-style opening on the home page |
| Landing sequence | `js/landing.js`, `.lp-*` CSS, inline `<head>` gate | mascot drops to the middle, title slams in, nav drops |
| Title-card transitions | `js/motion.js` (`cover`/`uncover`/`coverThenGo`), `.tc*` CSS | page and chapter changes show the destination's name |
| Motion presets | `js/motion.js`, `[data-mx]` CSS, `--mx-*` tokens | scroll / route reveals |

## Intro (port of `test/emc-intro-final.html`)
- **Lettering:** the site's own G8321 Bold as live text: plain white fill with one bold dark
  outline (`-webkit-text-stroke` + `paint-order`), no shadow and no slant, the same look as the title
  card and the header brand. G8321 has no `−`, `×`, `’`, `―` or `→`, so the phrases use `-`, `x` and
  `'`, and the fraction bar and the arrow are drawn in CSS / SVG (`.fb`, `.ar`) with the same outline.
- **Timeline:** scene A (shape-face countdown, 3-2-1-GO on the 0.302 s grid) to `BEAT0 = 2.608`,
  then six phrases (charge, Coulomb's law, the field, Circuit Builder, Ohm's Law), the title at
  `TT` (~13.2 s), the mascot jump at `TE = TT + 2.4`, the overlay lift from `TE + .2`, end at
  `TE + 1.05` (~16.6 s). `BEAT = 0.604` (~99 BPM, measured from the reference track).
  `?t=<s>` freezes one frame for tuning.
- **Motion grammar:** the mascot changes face on every beat (the last phrase cycles twice as
  fast and lands on the happy face). Each phrase's words fly in one after another with eleven
  entrance moves (`slam`, `whip`, `drop`, `spin`, `flip`, `type`, `wipe`, `arc`, `rise`,
  `elastic`, `pop`; `type` adds a word one character at a time, each popping in with a soft overshoot, and never cuts
  a word; `wipe` is only used for the drawn fraction bar), stretched along the direction of travel with two fading smear trails and a
  burst of sparks per landing, then hold, then ease out. Lines are laid out in `fit()`: sizes
  scale to the screen, overlapping lines are pushed apart and shrunk until they clear. A slow
  camera dolly/pan/roll runs under it, rings drift behind, faint mascots and + / - charges
  drift on the compositor.
- **Ending:** crouch, stretch jump out of the top, then the overlay lifts away by transform.
- **Loading (before the timeline):** on a bare home load the inline gate in `index.html` sets
  `html.landing-pending`, and CSS shows `#introOverlay` at once on the butter yellow with a small bar
  (`#introLoad`), scroll locked, browser chrome (`theme-color`) yellow, and no dark `#bootOverlay` on
  top. `preload()` in `js/intro.js` fetches and decodes the lettering font, the three faces and the
  hero mascot and waits for `window.load`, with an 8 s deadline so a dead image can delay the intro but
  never hang it. Then the bar fades (`.ready`, 350 ms, same yellow) and the clock starts. Reduced motion
  skips the gate and draws the static end frame.
- **Phones (portrait):** the stage is the whole screen (`100svh`, so the sliding address bar never
  changes it) and the mascot is 32cqw. `fit()` keeps every phrase in a zone under the mascot and above the
  Skip button, with larger side margins; camera pan and roll are halved; three faint mascots hold still and
  four charges drift; the ring canvas is smaller and runs at 20 fps. `EMC_INTRO.layout()` returns every
  word's resting box; `tools/suites/page.mjs` (test 15) proves nothing leaves the screen or overlaps.
  Height-only resizes on touch devices are ignored.
- **Profiling:** measured at 390x844, 4x CPU throttle, software raster (a harsher stand-in for a phone):
  the drifting decoration was a third of the slow frames, the words and their outlines were not. Slow
  frames (over 33 ms) went from about 45-52% to about 20%. Re-measure before changing the cost of a move.
- **Performance rules:** only the phrase on screen is in the render tree (`.kg` groups are
  `display:none` otherwise); words are laid out once and then only transformed, each on its own
  layer while its group is on; smear trails exist only while a word travels; the rings are one
  small canvas at 30 fps (a full-screen repeating gradient dropped Firefox to single digits);
  charges and ghosts loop as CSS animations; the overlay lifts by transform instead of a
  clip-path; every style write goes through a per-element cache; nothing measures the DOM in the
  frame loop; layers are prepared before they are needed; the clock starts after the first frame
  has painted; background work waits for `EMC.afterIntro`; the engine closure is dropped with the
  overlay. Lite mode (slow devices) drops trails, sparks, and runs the text on twos.
- **Contract:** plays on every bare home load, stores nothing, Skip / Esc / Start end it,
  the rest of the page is `inert` while it plays, zero timers/listeners afterwards
  (`tools/intro-verify.mjs`).

## Landing sequence
`emc:intro-land` (`detail.played`) → `html.lp-land` (mascot drop + ring) → `html.lp-reveal`
(mascot rides up, `h1` letters slam, `.lp-line` rows and the header animate in).
`html.landing-pending` hides the hero text and nav until then; `landing.js` always clears it.

## Page transitions (title cards: "change the channel")
One fixed timeline for every boundary (chapter switch, quiz, back home), however fast the page loads:
**COVER** 480 ms (two ink shutters close on a yellow line like a TV switching off, speed streaks cross the
screen, a three-frame static canvas flickers, three comic panels slam in; then the destination's name lands
with an impact: a punch with squash, a pink/sky colour-split ghost, a shock ring, ten sparks, a spinning
Denki-chan and an on-screen tag such as `CH 02 · FIELDS`) → **HOLD** at least 420 ms fully covered (a slow
load only makes it longer) → **REVEAL** 560 ms (panels slide out, the static drops, a yellow band flashes as
the shutters open on the new page). About 1.5 s, the same cached or not. Constants: `EMC_MOTION.timing`.

**The page's text comes in with it.** While the card covers, `html.tc-wait` forces the destination's
`.reveal` and `[data-mx]` items to their start state, so nothing plays out of sight. 170 ms into the reveal
(as the shutters begin to open) the hold is released, so those reveals play now, and `enter()` choreographs
the rest of the first screen with the Web Animations API: the title is split into words and letters (the
full text stays in `aria-label`) and slams in letter by letter with the intro's overshoot, and the other
blocks rise one after another (70 ms apart). On the home page only the hero animates. Reduced motion skips
all of it.

- `cover(label)` returns a promise that settles when the page is fully covered; the page underneath is
  swapped only after it. `uncover()` lifts the card, never before the hold. A card already up is shared
  (the newest route wins). Reduced motion never creates it.
- Same-document switches: the shell (`js/shell.js`) dispatches `emc:view-leaving` with `detail.wait`
  (an array); the card pushes its cover promise there and the shell waits for it before tearing the old view
  down, fetching the chapter in the meantime, then jumps to the top instantly (`html` smooth scrolling would
  otherwise still be gliding when the card lifts). `detail.boot` (a deep link) skips the card.
  `emc:view-shown` lifts it. The browser Back button to the bare address returns Home.
- Full navigations: `EMC_MOTION.coverThenGo(label, go)` covers, stores `{label, osd, face}` in
  `sessionStorage['emc.tc']` (read and deleted by the next page) and navigates. A head gate on every page
  sets `html.tc-arrive` (CSS paints the ink cover on the first frame) and the arriving page builds its card
  already held, then lifts it. A 2.5 s timer clears the gate if the script never loads; a 7 s failsafe removes
  a stuck card. The bare home load is not covered (the intro owns it).
- Transform and opacity only; the card is `aria-hidden`; colours are tokens (ink, pink, sky, yellow). Ghost,
  ring and sparks use `fill-mode: forwards` (with `both` their first keyframe shows during the start delay).

## Presets (`[data-mx]`)
`rise`, `slam`, `slide`, `pop`, `flash`, `whip`, `spin`, `lines`, `corner`, `badge`, `words`
(headings split into staggered word reveals). Timing tokens: `--mx-snap/pop/slam/rise/flash/whip/slide`.
