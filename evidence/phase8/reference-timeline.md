# Reference transition timeline — `Video/シェリーライド.mp4` (§4)

Frame numbers = 0-based decode indices; times = `showinfo` pts seconds
(pts = idx/60 + 0.016). Evidence: `reference-review-log.md`, `sheets/`,
`strips/`, `intro-reference.gif`. Beat grid (phase-7 onset envelope):
phrase pulse 1.15–1.20 s, doublet fills 0.30 s, sub-beats 0.55–0.60 s.

## Section map

| # | pts range | section | field |
|---|---|---|---|
| 1 | 0.000–2.616 | confetti overture | flat yellow |
| 2 | 2.616–12.116 | title lockup + pose swaps | yellow + silhouette strip |
| 3 | 12.116–18.916 | handwritten skit + spinning insets | yellow |
| 4 | 18.916–21.449 | black/red insert (other world) | black + red banner |
| 5 | 21.449–40.216 | chorus collage A | blue/white panels |
| 6 | 40.216–49.633 | chorus collage B (locked lyric line) | blue/white panels |
| 7 | 49.633–59.016 | chorus collage C (badges/strikethrough) | blue/white panels |
| 8 | 59.016–68.516 | bookend callback (title lockup, pose C) | yellow + strip |
| 9 | 68.516–70.47 | end card (small centred still) → black | yellow → black |

## Event timeline (verified)

| frames | pts | event | transition type / parameters |
|---|---|---|---|
| 0–14 | 0.000–0.233 | empty yellow field | static hold |
| ~15,30,60,75,90,105,120,135 | 0.25–2.25 | confetti elements appear one-by-one (tri, tri, dot, dot, crescent+glyph, glyphs…) | **discrete pop-in**, no tween, 0.25–0.5 s spacing, elements ≤3 % width, flat light-blue |
| 156–157 | 2.616–2.633 | **white flash #1** | hard snap to pure white, 2 frames (33 ms), lum 255, d=0 between |
| 158–163 | 2.649–2.733 | dissolve out of white (~90 ms) | opacity ramp of whole new composition |
| 163,175,193 | 2.733/2.933/3.233 | staggered micro-pops: title glyphs → mascot → silhouette strip settle | stagger ≈0.2–0.3 s, discrete |
| ~198 | 3.300 | lockup complete; composition frozen | static hold; title locked below cut-out |
| 230,263,281,299,317,410 | 3.849/4.399/4.699/4.999/5.299/6.849 | paper-doll micro swaps (mouth/eye variants) inside pose A | **1-frame discrete swap**, 0.30 s doublet fills + 1.5 s macro |
| 440–447 | 7.349–7.466 | **whip-squash**: cut-out scaleX → ~0.1 for ~120 ms | squash-and-stretch between pose families |
| 448 | 7.483 | pose B lands (wave + ^-^ eyes) | discrete swap after whip |
| 460,550,640,661,678 | 7.683/9.183/10.683/11.033/11.316 | pose B micro swaps | discrete, 1.5 s macro + 0.3 s fills |
| 726–727 | 12.116–12.133 | **white flash #2** → skit | 2 white frames + 250 ms exponential decay (255→214 by f740) |
| 729+ | 12.15+ | skit text lines 1+2 present; inset still enters | inset **rotateY continuous spin**, period ≈2 s, perspective tilt, dark 3 px border |
| ~840 | 14.0 | red "VS" pops between line pairs | discrete pop, red on yellow |
| ~870 | 14.5 | line pair 2 + second inset spin-in (right) | staggered pop + spin loop |
| ~960 | 16.0 | third handwritten line replaces top | discrete swap |
| 1134 | 18.916 | **hard cut** → black/red insert | zero-frame switch, no flash (different-world rule) |
| 1140,1160 | 19.0/19.35 | chibi cut-out pose swaps flanking the 3D face | discrete swaps |
| ~1200 | 20.0 | red banner block + big thumbs-up chibi + outlined caption | staged slams ~0.3 s apart |
| 1284–1287 | 21.40–21.466 | **white flash #3 (ramped)** | 4-frame ramp-in (63→102→147→204→255) + ~300 ms decay |
| 1290+ | 21.5+ | chorus collage A assembles | panels/chips present at cut-decay; no entrance anim |
| 1320–1440 | 22.0–24.0 | rotated outlined word slams ("限界まで", "足掻いた", "ー/生") | **slam**: appears already rotated (±8–20°), 1 per beat, holds till next phrase |
| 1410–1440 | 23.5–24.0 | **motion-blur whip frame** into next pose | 1–2 frame horizontal smear |
| 1560–1740 | 26.0–29.0 | diagonal speech-bubble panels slide/rotate in, staggered lines | slide+rotate ≈0.3 s stagger, hold ~3 s, swap out |
| ~1800 | 30.0 | title callback + black arrow slash | lockup pops bottom-centre; diagonal arrow over it 0.5 s |
| 1860+ | 31.0+ | four rotated corner word-boxes slam | 4 slams in one beat, corners |
| 2010–2100 | 33.5–35.0 | arc-curved outlined text sweeps top | travel + rotation over ~1.5 s |
| 2130–2190 | 35.5–36.5 | dark-navy rounded chips slide in horizontally | chip variant, 0.3 s stagger |
| 2413–2414 | 40.216–40.233 | **white flash #4** | 2 white frames + ~200 ms decay |
| 2420+ | 40.3+ | chorus B: locked 2-line horizontal lyric bottom (holds ~9 s); orbiting chibi fairies swap positions ~1 s | long-lock lyric vs per-beat centre pose swaps |
| 2978–2979 | 49.633–49.650 | **white flash #5** | 2 white frames + ~300 ms decay |
| 3060+ | 51.0+ | white "correction" panels w/ strikethrough-X slam | slam + strikethrough draw |
| 3270+ | 54.5+ | black starburst badges pop ("吐いた", "言葉の") | discrete pop, slight scale overshoot |
| 3468 | 57.80 | motion-blur whip frame | smear |
| 3541–3542 | 59.016–59.033 | **white flash #6** → bookend | 2 white frames + ~150 ms decay |
| 3548+ | 59.1+ | bookend: same lockup as §2, pose C, strip returns | identical composition to opening (callback) |
| 3900–4100 | 65–68.3 | pose C micro swaps | discrete |
| 4110 | 68.516 | **hard cut** → end card | zero-frame switch |
| 4111–4220 | 68.53–70.35 | small bordered still centred on yellow | static hold |
| ~4222+ | 70.4+ | black | end |

## Flash grammar (numeric, consecutive frames)

All section-boundary flashes: **pure white for exactly 2 frames (33 ms)**,
then an exponential luminance decay into the new scene over 150–300 ms
(255→baseline). Exception: flash #3 ramps in over 4 frames instead of
snapping (used when entering the busiest section). Hard cuts (no white) are
reserved for "different world" moments: the black/red insert and the end card.

## Translation rules for EMC Lab (phase 8)

1. **Beat grid** → CSS custom props `--beat:1.16s; --sub:.58s; --fill:.29s`.
   UI interactions use *fractions* (120–300 ms); only hero/intro moments may
   spend a whole beat.
2. **White-flash dip** → route-change transition: 2-frame white snap + 250 ms
   decay overlay (`emc-flash`), pointer-events none, reduced-motion → none.
3. **Hard cut** → high-energy state flips (quiz verdict colours, sim preset
   jumps) switch with zero transition (`emc-cut`).
4. **Whip-squash** → pose/asset swaps (mascot reactions, panel content
   changes): scaleX→0.1 for 60–120 ms then new state pops (`emc-swap`).
5. **Discrete pop-in** → confetti, chips, badges: appear with no tween,
   staggered 0.2–0.3 s (`emc-pop` with `animation-duration:1ms`-style snap or
   steps(1) keyframes).
6. **Word slam** → section titles/hero words: appear pre-rotated, settle
   180 ms (`emc-slam`).
7. **rotateY spin loop** → inset/thumbnail frames: continuous slow Y-spin
   (~8 s period on the site, gentler than the reference's 2 s) (`emc-spin`).
8. **Staggered slide panels** → detail/notes panels: slide+rotate 0.3 s
   stagger (`emc-slide`).
9. **Bookend callback** → quiz results reuse the hero lockup composition.
10. **End card** → session-complete state: single small centred card.
11. Reduced motion: every pattern collapses to instant/fade-free final
    states; content never hidden (gates add classes only when motion OK).

Intentional deviations (identity/a11y/usability): pink palette instead of
yellow/blue; flashes dimmed to 85 % white and capped ≤260 ms (photosensitivity
comfort, still reads as a snap); spin period slowed; slams ≤8° rotation;
no motion-blur smear frames on the site (blur filters are banned by the
flat-art rules) — whip-squash replaces them.
