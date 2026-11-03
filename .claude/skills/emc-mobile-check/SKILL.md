---
name: emc-mobile-check
description: Check the EMC Lab intro and pages at phone sizes for overlaps, off-screen elements, oversized mascot and sideways scroll, with screenshots. Use after any intro, landing or layout change.
---

# emc-mobile-check

Viewports: 360×640, 390×844, 412×915 (portrait phones) and 844×390 (landscape). Use Playwright with `isMobile: true`, `hasTouch: true`, `deviceScaleFactor: 2`. Serve the repo with `serve()` from `tools/lib/harness.mjs`. Put scripts and screenshots in the session scratchpad, not the repo.

## Intro frames
`index.html?t=<seconds>` freezes the intro on one frame. Sample at t = 1.2, 3.2, 4.6, 6.2, 7.8, 9.4, 11, 12.4, 14.3, 15.3 (countdown, each phrase, title card, Start).

For each frame read bounding boxes and flag:
- any word `.kg.on .kw.m`, `#mk`, `#ttl`, `#sub`, `.chip`, `#go` outside `0..width × 0..height`
- a word box overlapping the mascot box `#mk` while the phrase is at rest
- two words of the same phrase overlapping
- `#go` far from the chips, or covering `#introSkip`

Then look at screenshots of at least three frames (a phrase, the title card, Start). Numbers miss ugly layouts.

## After the intro
- `document.documentElement.scrollWidth <= innerWidth` on `index.html`, `quiz.html`, both chapters.
- Hero mascot height 120 to 200 px at widths ≤ 640 px, taller on taller screens (44% of the width or 20% of the height, whichever is smaller).
- The Details switch, nav toggle and primary buttons are reachable and at least 44 px tall.

## Smoothness
CDP: `Emulation.setCPUThrottlingRate` 4, play the intro at 390×844, record frame deltas from `requestAnimationFrame`. Report the share of frames over 33 ms and the longest stall. Headless Chromium only approximates a phone; say so and ask for a check on the Vercel preview on a real device.
