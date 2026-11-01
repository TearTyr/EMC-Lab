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
- **Lettering:** the site's own G8321 Bold as live text, italic, white fill, dark outline, a
  pink then a dark stacked shadow (MAD / "Override" look). G8321 has no `−`, `×`, `’`, `―` or
  `→`, so the phrases use `-`, `x` and `'`, and the fraction bar and the arrow are drawn in CSS /
  SVG (`.fb`, `.ar`) in the same style.
- **Timeline:** scene A (shape-face countdown, 3-2-1-GO on the 0.302 s grid) to `BEAT0 = 2.608`,
  then six phrases (charge, Coulomb's law, the field, Circuit Builder, Ohm's Law), the title at
  `TT` (~13.2 s), the mascot jump at `TE = TT + 2.4`, the overlay lift from `TE + .2`, end at
  `TE + 1.05` (~16.6 s). `BEAT = 0.604` (~99 BPM, measured from the reference track).
  `?t=<s>` freezes one frame for tuning.
- **Motion grammar:** the mascot changes face on every beat (the last phrase cycles twice as
  fast and lands on the happy face). Each phrase's words fly in one after another with eleven
  entrance moves (`slam`, `whip`, `drop`, `spin`, `flip`, `slice`, `wipe`, `arc`, `rise`,
  `elastic`, `pop`), stretched along the direction of travel with two fading smear trails and a
  burst of sparks per landing, then hold, then ease out. Lines are laid out in `fit()`: sizes
  scale to the screen, overlapping lines are pushed apart and shrunk until they clear. A slow
  camera dolly/pan/roll runs under it, rings drift behind, faint mascots and + / - charges
  drift on the compositor.
- **Ending:** crouch, stretch jump out of the top, then the overlay lifts away by transform.
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

## Title cards
`EMC_MOTION.coverThenGo(label, go)` covers the page, stores the label in
`sessionStorage['emc.tc']` (read and deleted by the next page) and navigates; the new page
starts covered and reveals itself. The shell fires `emc:view-leaving` / `emc:view-shown` for
chapter switches. A failsafe removes a stuck card after 2.5 s. Reduced motion: no card.

## Presets (`[data-mx]`)
`rise`, `slam`, `slide`, `pop`, `flash`, `whip`, `spin`, `lines`, `corner`, `badge`, `words`
(headings split into staggered word reveals). Timing tokens: `--mx-snap/pop/slam/rise/flash/whip/slide`.
