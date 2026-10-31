# Animation reference

The site's motion lives in four places. Everything animates `transform` / `opacity`
only, every effect has a reduced-motion path, and nothing runs without JS.

| Piece | File | What it does |
|---|---|---|
| Intro (v10) | `js/intro.js`, `js/kinetic.js`, `#introOverlay` CSS | ~16.6 s Override-style opening on the home page |
| Landing sequence | `js/landing.js`, `.lp-*` CSS, inline `<head>` gate | mascot drops to the middle, title slams in, nav drops |
| Title-card transitions | `js/motion.js` (`cover`/`uncover`/`coverThenGo`), `.tc*` CSS | page and chapter changes show the destination's name |
| Motion presets | `js/motion.js`, `[data-mx]` CSS, `--mx-*` tokens | scroll / route reveals |

## Intro (v11)
- **Lettering:** the site's own G8321 Bold as live text: white fill, thin pink edge, solid
  `#e8507a` shadow. `EMC_KINETIC.split()` cuts a line into character spans (`R_1` draws a
  small digit, `Σ` is a drawn glyph because G8321 has no Σ) and keeps the real text in
  `aria-label`.
- **Timeline:** 0 – 3.5 s countdown, then six phrases on a 0.151 s grid (`BEAT0 = 3.5`,
  `BEAT = 0.604`, ~99 BPM), title at `TT` (~13.6 s), mascot jump at `TE = TT + 2.4`, end at
  `TE + 1.1` (~17 s). `?t=<s>` freezes one frame for tuning.
- **Motion grammar:** each phrase is one whole equation, laid out in place under the
  mascot; characters type on with a small slam, a caret and a sparkle; the first
  character is oversized; the phrase holds, then its characters whip away. Backgrounds go
  yellow rings → pink burst → torn paper, with a slash bar where the scene changes.
- **Ending:** crouch, stretch jump with speed lines, title letters whip up after the mascot,
  then the overlay lifts by transform with a soft curved edge.
- **Performance rules:** Characters, charges and exits are CSS animations on the compositor.
  Rings and the burst share one small canvas, because scaled ring layers and a rotating
  full-screen gradient dropped Firefox to single-digit frame rates. Every phrase
  is laid out once. Lettering is never transformed at rest, which keeps it sharp; the camera
  moves only the mascot and background. Layers are prepared before they are needed. The
  clock starts after the first frame has painted. Background work waits for `EMC.afterIntro`.
  The engine closure is dropped with the overlay. Lite mode covers slow devices.
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
