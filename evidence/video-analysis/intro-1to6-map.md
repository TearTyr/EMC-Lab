# Intro 1:6 map — site timeline vs reference (v4 "1:6 cut")

User request 2026-10-23: make the site intro "near 1 to 1 with the reference
video". Implemented as a **uniform 1:6 time-compression** of the complete
reference (`Video/シェリーライド.mp4`, 4225 frames, last pts 70.416 s):
every event fires at `t_site = t_ref / 6`, all nine sections in order.
Master composition length **11.736 s**, then the site-only letterbox wipe
(0.45 s) hands over to the homepage; `intro.js TOTAL_MS = 12250`.

Source columns: `reference-analysis.md` §4 (scene/transition table) and
`frame-timeline.md` (frame-accurate onsets). f = 0-based decoded frame at
60 fps (t_ref ≈ f/60 + 0.016).

## Section boundaries

| # | section | t_ref | t_site | boundary transition |
|---|---|---|---|---|
| S1 | confetti overture | 0.000–2.616 | 0.000–0.436 | — |
| S2 | title lock-up | 2.616–12.116 | 0.436–2.019 | **flash #1** (2 white frames + ~90 ms decay) |
| S3 | handwritten skit | 12.116–18.916 | 2.019–3.153 | **flash #2** (2f + ~250 ms) |
| S4 | black/red insert | 18.916–21.449 | 3.153–3.575 | **hard cut f1134, zero white** |
| S5 | chorus A collage | 21.449–40.216 | 3.575–6.703 | **flash #3, ramped** (4-frame ramp + ~300 ms) |
| S6 | chorus B locked lyric | 40.216–49.633 | 6.703–8.272 | **flash #4** (2f + ~200 ms) |
| S7 | chorus C corrections | 49.633–59.016 | 8.272–9.836 | **flash #5** (2f + ~300 ms) |
| S8 | bookend callback | 59.016–68.516 | 9.836–11.419 | **flash #6** (2f + ~150 ms) |
| S9 | end card | 68.516–70.416 | 11.419–11.736 | **hard cut f4110, zero white** |
| — | site-only wipe + handover | — | 11.74–12.19 | bars scaleY 1→7.2, then overlay `.out` |

## Event-level map (onsets)

### S1 overture — discrete confetti pops, no tween (f15–f135)
| f | t_ref | t_site | site event |
|---|---|---|---|
| 15 | 0.250 | 0.042 | confetti #1 pop (`.in-cf1`) |
| 30 | 0.500 | 0.083 | #2 | 
| 60 | 1.000 | 0.167 | #3 |
| 75 | 1.250 | 0.208 | #4 |
| 90 | 1.500 | 0.250 | #5 |
| 105 | 1.750 | 0.292 | #6 |
| 120 | 2.000 | 0.333 | #7 |
| 135 | 2.250 | 0.375 | #8 (micro-glyph star) |
| 156–157 | 2.616 | 0.436 | flash #1; confetti cleared 0.486 |

### S2 title lock-up (flash #1 → staggered burst-in f158–163)
| f | t_ref | t_site | site event |
|---|---|---|---|
| 158–163 | 2.63–2.73 | 0.470–0.560 | title lands 0.470 → mascot 0.500 → strip+EQ glyphs 0.560 (footage dissolve order) |
| 230 | 3.849 | 0.641 | paper-doll micro swap (grid: 1.5 s macro + 0.30 s doublet → 0.25 s + 0.05 s) |
| 263 / 281 / 299 / 317 | 4.40 / 4.70 / 5.00 / 5.30 | 0.733 / 0.783 / 0.833 / 0.883 | doublet-fill swaps |
| 410 | 6.849 | 1.141 | swap before the whip |
| 440–447 | 7.349–7.466 | 1.225–1.245 | **whip-squash** (scaleX→0.1 sliver, `.in-whipx` 30 ms steps) |
| 448 | 7.483 | 1.247 | pose B lands (sparkle art becomes the base) |
| 460 / 550 / 640 / 661 / 678 | 7.68 / 9.18 / 10.68 / 11.03 / 11.32 | 1.280 / 1.530 / 1.780 / 1.838 / 1.886 | pose-B micro swaps |

Pose/tilt toggles are generated `steps(1,end)` keyframes (`in-pose`,
`in-tilt`, master 11.736 s) — discrete 1-frame cuts, never tweened.

### S3 skit (flash #2)
| f | t_ref | t_site | site event |
|---|---|---|---|
| 729 | 12.15 | 2.025 | handwritten line pair 1 + inset 1 enter **spinning** |
| 733→760 | 12.2–12.7 | 2.03+ | continuous rotateY, edge-on↔facing; footage period 2 s → 0.333 s scaled, **floored to 0.5 s** (readability, documented deviation) |
| ≈840 | 14.0 | 2.333 | red VS discrete pop |
| ≈870 | 14.5 | 2.417 | line pair 2 + inset 2 (staggered) |
| ≈960 | 16.0 | 2.667 | line 3 swaps in, replaces the top pair |
| 1134 | 18.916 | 3.153 | **hard cut, zero white** |

### S4 black/red insert
| f | t_ref | t_site | site event |
|---|---|---|---|
| 1134 | 18.916 | 3.153 | cut: black field, giant cropped face, chibi pair, tiny caption |
| 1140→1160 | 19.0–19.3 | 3.167–3.222 | chibi pose swap (discrete) |
| ≈1200 | 20.0 | 3.333 / 3.383 / 3.433 | staged slams 0.3 s apart in footage → 0.05 s: red banner → thumbs-up chibi → outlined caption |
| 1260 | 21.0 | 3.500 | black stamp glyph slam |
| 1284–1287 | 21.40–21.45 | 3.575 | **ramped flash #3** (63→102→147→204→255 over 4 frames = 66 ms ramp, ~300 ms decay) |

### S5 chorus A (densest section; all onsets = t_ref/6)
| f | t_ref | t_site | site event |
|---|---|---|---|
| 1290+ | 21.5 | 3.583–3.683 | collage bursts in during the decay: panels, name chip, OHM-DRIVE chip, wedges |
| 1320 | 22.0 | 3.667 | word slam 1 (VOLTS) |
| 1410–1440 | 23.5–24.0 | 3.917–3.967 | whip (blur smear → whip-squash substitute) |
| 1420 | 23.67 | 3.944 | word slam 2 (AMPS) |
| 1440 | 24.0 | 4.000 | vertical bubble column 1, word-by-word (4.000/4.050/4.100) |
| 1470 | 24.5 | 4.083 | word slam 3 (OHMS) |
| 1500 | 25.0 | 4.167 | bubble column 2 (4.167/4.217/4.267) |
| 1510 | 25.17 | 4.194 | whip 2 |
| 1530 / 1540 | 25.5 / 25.67 | 4.250 / 4.278 | word slams 4–5 (FIELDS / FORCE) |
| 1560–1740 | 26.0–29.0 | 4.333–4.833 | speech panel 1: slide+rotate in, chip → lines 0.05 s apart (footage 0.3 s), swap out |
| ≈2040-slot | 28.0 | 4.667 | speech panel 2 in; both out 4.917 (f≈2070, 29.5 s) |
| ≈1800 | 30.0 | 5.000 | title callback bottom-centre + arrow slash drawn over it (draw floor 0.15 s; footage 0.5 s) |
| ≈1860 | 31.0 | 5.167 | **corner cluster: four pre-rotated boxes in ONE beat** |
| to 2280 | to 38.0 | 5.833 / 6.167 | further corner pairs |
| 2130–2190 | 35.5–36.5 | 5.917 / 6.042 / 6.083 | dark chips slide in horizontally, 0.05 s stagger |
| 2227 | 37.1 | 6.183 | chips whip-squash out (blur substituted), gone 6.25 |
| — | 33.5–35.0 | — | arc-swept curved text **omitted** (legibility, standing do-not-copy) |

### S6 chorus B (flash #4)
| f | t_ref | t_site | site event |
|---|---|---|---|
| 2420 | 40.33 | 6.722 | **locked two-line lyric** bottom ("cool ohm's law solo / V = I·R") — never moves until the section ends (footage holds ~9.3 s → 1.57 s) |
| 2420→2978 | 40.3–49.6 | 6.95–8.27 | centre mascot pose swaps on the grid (0.26 s spacing) |
| fairies | ~1 s swaps | 0.333 s jumps | edge fairies trade positions via discrete 90° container steps (upright counter-step); continuous orbit NOT copied (standing do-not-copy → discretised) |
| ≈2970 | 49.3 | 8.217 | corner word resumes just before flash #5 |

### S7 chorus C (flash #5)
| f | t_ref | t_site | site event |
|---|---|---|---|
| ≈2995–3010 | 49.9–50.2 | 8.317–8.450 | correction panel 1 slams, **strikethrough-X draws** (two bars, 0.12 s) |
| ≈3020 | 50.75 | 8.458 | correction panel 2 (X at 8.475/8.517) |
| 3048–3075 | 52.0–53.25 | 8.667 / 8.750 / 8.792 / 8.833 / 8.875 | corner words per beat (NO / ROTE / READ / ONLY / SIM!) |
| ≈3078–3096 | 53.3–54.0 | 8.917 / 8.958 | big centre slams (FIELDS! / NOW!) |
| ≈3270 | 54.5 | 9.083 | **starburst badge pop with overshoot** ("24 Qs") |
| ≈3300 | 55.0 | 9.167 | starburst 2 ("3 WORLDS") |
| 3330–3345 | 55.5–56.75 | 9.250 / 9.333 | white diamond panels swap in |
| ≈3370 | 56.5 | 9.417 | diamonds whip out (blur substituted), gone 9.467 |
| 3420–3465 | 57.0–58.25 | 9.500 / 9.583 / 9.667 | bottom-line word slams |
| ≈3468 | 57.8 | 9.625 | whip smear → group whip-squash |

### S8 bookend (flash #6) — composition identical to S2
| f | t_ref | t_site | site event |
|---|---|---|---|
| 3544 | 59.05 | 9.842 | lock-up returns (pose C = sparkle base); Start CTA slams 10.0 (site-only) |
| ≈3660/3720/3780 | 61.0/62.0/63.0 | 10.167 / 10.333 / 10.500 | micro swaps |
| ≈3900/3960/4020 | 65.0/66.0/67.0 | 10.833 / 11.000 / 11.167 | micro swaps |
| 4110 | 68.516 | 11.419 | **hard cut, zero white** → end card |

### S9 end card
| f | t_ref | t_site | site event |
|---|---|---|---|
| 4110–4224 | 68.516–70.416 | 11.419–11.736 | pink field + one small (~15 % width) bordered still centred, static hold — then the site-only wipe |

## Flash grammar (frame-quantised, NOT scaled)

Flashes are 2-frame events in the footage; scaling 33 ms by 1/6 would be
sub-frame, so all six keep the footage frame grammar: **33 ms full white +
the footage's own decay** (90 / 250 / 300-ramped / 200 / 300 / 150 ms).
Six 33 ms flashes across 11.7 s ≈ 0.5 Hz — far below photosensitivity
guidance; reduced motion shows none. Hard cuts (S4, S9) carry zero white,
exactly like f1134/f4110.

## Standing deviations (unchanged policy, re-confirmed for the 1:6 cut)

1. Palette stays the site's pink identity (user choice 2026-10-23; footage
   yellow field → pink, blue → plum).
2. Motion-blur smear frames → whip-squash (`in-whipx`, 30 ms steps); blur
   filters are banned by the flat-art rules.
3. Arc-swept curved text omitted (decorative, hurts scanability).
4. Orbiting fairies discretised into 0.333 s position swaps (continuous
   peripheral motion stays a do-not-copy).
5. Readability floors: inset spin period 0.5 s (scaled 0.333 s), arrow
   draw 0.15 s (scaled 0.083 s), slams ≥ 0.08 s.
6. Site-only additions: Start CTA on the bookend, letterbox wipe handover,
   skip button (always visible, any key/pointer dismisses).

## Contract/gate changes (logged in BUG_AUDIT.md test-change log)

- `js/intro.js` TOTAL_MS 5800 → 12250 (11.736 s + wipe + exit slack).
- `tools/intro-verify.mjs`: auto-end window 2.5–6.5 s → 11.5–14.5 s after
  `load`; overlay-removal waits 8/9 s → 18 s.
- `tools/smoke-test.mjs`: jsdom removal window 5.2–7.4 s → 11.8–14.2 s,
  poll cap 9 s → 15.5 s; CSS markers `in-titlevis` → `in-vis`/`in-hid`,
  spin period marker 4 s → 0.5 s.
- `tools/screenshots.mjs`: presets the once-per-session intro key (shots
  document page design; the intro is longer than any shot wait now).
- `tools/capture-intro-video.mjs`: removal wait 15 s → 22 s.
