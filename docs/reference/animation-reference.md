# Animation reference

The site's motion lives in four places. Everything animates `transform` / `opacity`
only, every effect has a reduced-motion path, and nothing runs without JS.

| Piece | File | What it does |
|---|---|---|
| Intro (v10) | `js/intro.js`, `js/kinetic.js`, `#introOverlay` CSS | ~16.6 s Override-style opening on the home page |
| Landing sequence | `js/landing.js`, `.lp-*` CSS, inline `<head>` gate | mascot drops to the middle, title slams in, nav drops |
| Title-card transitions | `js/motion.js` (`cover`/`uncover`/`coverThenGo`), `.tc*` CSS | page and chapter changes show the destination's name |
| Motion presets | `js/motion.js`, `[data-mx]` CSS, `--mx-*` tokens | scroll / route reveals |

## Intro (v10)
- **Lettering:** every word is a canvas sprite drawn once by `EMC_KINETIC.sprite()`
  (Noto Serif JP Black subset `vendor/fonts/emc-display-900.woff2`, white fill, coral
  edge, stepped extrusion, rough edges). `R_1` draws a subscript 1. Rebuild the font
  with `python tools/subset-display-font.py <NotoSerifJP[wght].ttf>`.
- **Timeline:** 0 – 3.5 s countdown, then six phrase groups on a 0.604 s beat grid
  (`BEAT0 = 3.5`, ~99 BPM), title at `TT`, mascot jump at `TE = TT + 2`, end at `TE + 1`
  (~16.6 s). `?t=<s>` freezes one frame for tuning.
- **Motion grammar:** text motion is sampled at 30 fps ("twos"); entrances are `slam`
  (oversized, cropped, ~4 frames), `type` (glyph by glyph), `whip`, `drop`, `arc`,
  `rise`, `spin`, `flip`, `slice`, `wipe`, `elastic`, `pop`. Slash bars cut between
  phrases; backgrounds go yellow rings → pink burst → torn red paper.
- **Performance rules:** all style writes go through the `S()` cache; nothing queries or
  measures the DOM inside the frame loop; hidden tokens are `display:none`; `will-change`
  only on live words; faces are decoded before the first swap; lite mode (no sparks,
  rings, extra particles) starts for low-tier devices and when frames stay slow.
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
