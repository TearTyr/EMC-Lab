# Transition inventory — reference video → EMC Lab

Parameters measured from consecutive frames (strips + 4 fps pass). Site
values in the right-hand columns are what `css/input.css` implements after
this phase (`emc-*` classes, gated by `js/motion.js`).

| # | technique | reference parameters | site adaptation | class |
|---|---|---|---|---|
| 1 | discrete pop-in | element appears in 1 frame, no tween; stagger 0.25–0.5 s; size ≤3 % field | confetti/chips/badges snap in, stagger 200–300 ms | `emc-pop` |
| 2 | white-flash dip | 2 frames pure white (33 ms) + exp decay 150–300 ms | 2-frame-equivalent snap to 85 % white + ≤260 ms decay, pointer-events none | `emc-flash` |
| 3 | ramped flash | 4-frame luminance ramp 63→255 then decay (busy-section entry) | not used (single flash grammar kept for consistency) | — |
| 4 | hard cut | zero-frame switch, no white (different-world) | verdict/preset high-energy flips | `emc-cut` |
| 5 | whip-squash | scaleX→~0.1 for ~120 ms, new state pops | mascot/panel content swaps 60–120 ms | `emc-swap` |
| 6 | motion-blur whip | 1–2 frame horizontal smear | **banned** (flat-art rules); #5 substitutes | — |
| 7 | word slam | appears already rotated ±8–20°, 1/beat, holds ≥1 phrase | headings pre-rotated ≤8°, settle 180 ms | `emc-slam` |
| 8 | corner slam cluster | 4 rotated one-char boxes in one beat, corners | card-grid entrance: 4 cards, ≤8°, 60 ms stagger | `emc-corner` (new) |
| 9 | rotateY spin loop | inset still, period ≈2 s, perspective + dark border | inset figures, period ~8 s | `emc-spin` |
| 10 | staggered slide panel | diagonal bubble, slide+rotate ~0.3 s, hold ~3 s | detail/notes panels | `emc-slide` |
| 11 | staged line reveal | chip first, then 1–2 text lines 0.3 s apart inside panel | panel inner lines stagger 120 ms | `emc-lines` (new) |
| 12 | strikethrough-X draw | scribble + X drawn across white panel ~0.3 s | quiz wrong-option strike draw 240 ms | `emc-strike` (new) |
| 13 | starburst badge pop | black starburst, slight scale overshoot | result badges, overshoot 1.08→1 | `emc-badge` (new) |
| 14 | locked caption | 2-line lyric locked ~9 s while centre swaps per beat | sim readout stays locked during preset swaps | `emc-lockline` (new) |
| 15 | arc sweep text | curved outlined text, travel+rotate ~1.5 s | **not adopted** (readability) | — |
| 16 | orbiting cut-outs | chibi fairies swap edge positions ~1 s | **not adopted** (peripheral motion) | — |
| 17 | arrow slash | black diagonal arrow drawn over lockup 0.5 s | quiz-results emphasis stroke (existing bookend) | existing |
| 18 | bookend callback | opening composition reused verbatim at close | quiz results reuse hero lockup | existing |
| 19 | end card | single small bordered still, static ~1.9 s | session-complete card | existing |
| 20 | beat grid | pulse 1.15–1.20 s, fills 0.30 s, sub 0.55–0.60 s | UI fractions 120–300 ms; hero may spend a beat | CSS vars |

Reduced-motion: classes 1,2,4,5,7,8,9,10,11,12,13,14 all resolve to instant
final states under `prefers-reduced-motion`; gates never hide content.
