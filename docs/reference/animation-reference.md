# Animation reference — `Video/シェリーライド.mp4` → EMC Lab intro & motion system

One authoritative analysis of the reference video and its mapping onto the site.
Consolidates (and replaces) the former `evidence/video-analysis/*.md` set:
`reference-analysis.md`, `frame-timeline.md`, `transition-inventory.md`,
`intro-1to6-map.md`. All observations were derived by direct frame inspection
of the original MP4 (method in §7); the MP4 in `Video/` remains the authority —
if this document and the footage disagree, the footage wins.

## 1. Source facts (measured with ffmpeg 7.0.2)

| property | value |
|---|---|
| path | `Video/シェリーライド.mp4` (repo original, md5 `28bb22f6cc290a110cb96f325677276f`) |
| container duration | **70.47 s** (00:01:10.47), bitrate 5287 kb/s |
| video stream | h264 High, yuv420p (tv, bt709, progressive), **1920×1080, 60 fps** |
| decoded video frames | **4225 frames, n=0…4224, last pts_time 70.416 s** |
| audio | AAC-LC 44100 Hz stereo 128 kb/s |
| extra stream | attached PNG cover 1280×720 (stream 0:2) — exclude via `-map 0:v:0` |
| tail | **no black tail** — final frames f4215–4224 are the yellow end card |

Frame numbers below are 0-based decode indices; `t_ref ≈ f/60 + 0.016` s.

## 2. Scene & transition timeline (complete video)

| # | range (s) | section | on screen | motion / transitions |
|---|---|---|---|---|
| S1 | 0.000–2.616 | confetti overture | flat saturated yellow; nothing else until f14 | discrete pop-ins, one confetti element (triangle/dot/crescent/micro-glyph, ≤3 % width, light blue) per 0.25–0.5 s, **no tween**; field then static |
| S2 | 2.616–12.116 | title lockup | **flash #1**: pure white exactly 2 frames (f156–157) → ~90 ms staggered dissolve-out-of-white; outlined two-line title locked below centred character cut-out; white silhouette strip + tiny EQ glyphs behind | paper-doll micro swaps as 1-frame discrete cuts on a 1.5 s macro + 0.30 s doublet-fill beat grid (f230, 263, 281, 299, 317, 410…); **whip-squash** f440–447 (cut-out scaleX→~0.1, ~120 ms) between pose families A→B; pose B lands f448 |
| S3 | 12.116–18.916 | handwritten skit | **flash #2** (2 white frames + ~250 ms exponential decay); two handwritten black lines top-left; tilted 3D inset still (dark-red interior) left-of-centre | inset **continuous rotateY spin**, period ≈2 s (edge-on ↔ facing every ~0.5–1 s); red “VS” discrete pop f≈840; second line pair + second inset staggered pop f≈870; third line discrete swap f≈960 |
| S4 | 18.916–21.449 | black/red insert | **hard cut, zero white frames** (f1134): black field, giant cropped 3D red-haired face, two pink chibi cut-outs flanking, tiny caption 「大丈夫か？」 | chibi pose swaps f1140→f1160 (discrete); **staged slams ~0.3 s apart from f≈1200 (20.0 s)**: red banner block → big laughing thumbs-up chibi → outlined caption; black stamp glyph slam f1260 (21.0 s) |
| S5 | 21.449–40.216 | chorus collage A | **flash #3, ramped**: 4-frame ramp-in (63→102→147→204→255, f1284–1287) + ~300 ms decay; blue/white panel collage, name plate chip, “OVERDRIVE” chip, yellow zigzag wedges | rotated outlined lyric slams one per beat; 1–2 frame motion-blur whip into pose swaps (f1410–1440); vertical lyric bubble columns slam word-by-word (f≈1440/1500); diagonal speech-bubble panels slide+rotate in from top-left with staggered typed lines (chip first, then lines ~0.3 s apart), hold ~3 s, swap out; title callback bottom-centre + black diagonal arrow slash drawn over it (f≈1800, 0.5 s draw); four rotated corner word-boxes slam in one beat (f≈1860, more pairs to f≈2280); arc-curved outlined text sweeps top (f2010–2100); dark-navy chips slide in horizontally 0.3 s stagger (f2130–2190), exit via whip-blur f≈2227 |
| S6 | 40.216–49.633 | chorus collage B | **flash #4** (2 white frames + ~200 ms decay) | **locked two-line horizontal lyric** bottom held ~9 s while centre pose swaps on the beat grid; small chibi “fairy” cut-outs orbit the frame edges, swapping positions ~every 1 s; name chip top-centre |
| S7 | 49.633–59.016 | chorus collage C | **flash #5** (2 white frames + ~300 ms decay) | white rounded correction panels slam in with scribble + **strikethrough-X draw** (f≈3060); big blue corner words per beat; **black starburst badges** with white text pop with slight scale overshoot (f≈3270, f≈3300); white diamond panels swap with blur; bottom-line word slams; motion-blur whip f3468 |
| S8 | 59.016–68.516 | bookend callback | **flash #6** (2 white frames + ~150 ms decay) → identical composition to S2 (yellow field, same lockup, silhouette strip) with pose C | pose micro swaps on the grid (f≈3900, 3960, 4020…) — the opening’s exact framing reused as closing motif |
| S9 | 68.516–70.433 | end card | **hard cut, zero white** (f4110): yellow field + one small (~15 % width) bordered still (thumbs-up pose, red bg) centred | static hold to the final frame f4224; no black tail |

Pacing: phrase pulse ≈1.15–1.20 s; doublet fills ≈0.30 s; sub-beats ≈0.55–0.60 s.

### Frame-accurate onset notes (dense passages)

- **Flash #1 onset (S1→S2):** f0–14 flat yellow; confetti pops f15/30/60/75/90/105/120/135
  (0.25/0.50/1.00/1.25/1.50/1.75/2.00/2.25 s); f156–157 pure white ×2; f158–163 staggered
  dissolve-out (~90 ms): title glyphs → mascot → strip land in bursts. Lockup settled f198.
- **S2 pose grid:** micro swaps f230/263/281/299/317/410 (pose A); whip-squash sliver
  f440–447; pose B lands f448; micro swaps f460/550/640/661/678.
- **S3 skit:** f726–727 white ×2; f728–740 decay 255→214; f729+ lines 1+2 present, inset
  enters spinning (edge f733 → face f740 → edge f760; period ≈2 s, continuous to f1133);
  VS pop f≈840 (14.0 s); line pair 2 + inset 2 f≈870 (14.5 s); line 3 replaces the top
  pair f≈960 (16.0 s, 「ちょっと後者に行ってくる」).
- **S4 insert (the “00:20” passage):** f1134 (18.916 s) HARD CUT, zero white — black field +
  3D face + chibi pair + caption already composed on the first frame; chibi pose swap
  f1140→f1160 (19.0–19.3 s); from f≈1200 (20.0 s) three staged slams ~0.3 s apart
  (red banner → thumbs-up chibi → outlined caption); stamp glyph slam f1260 (21.0 s);
  ramped flash #3 f1284–1287 (21.40–21.45 s, 63→102→147→204→255) + ~300 ms decay into S5.
- **S5 chorus A:** collage present at decay f1290+; lyric slams 限界まで f≈1320, 足掻いた
  f≈1420, 人 f≈1470, は f≈1530, 生 f≈1540; whips f1410–1440, f≈1510; vertical bubble columns
  f≈1440 & f≈1500 word-by-word; speech panel 1 f1560–1740 (chip then lines 0.3 s stagger),
  panel 2 enters 28.0 s, both exit 29.5 s; title callback + arrow slash f≈1800 (30.0 s,
  0.5 s draw); corner boxes し/た/い/所 f≈1860 (31.0 s), だけ f≈1878, 現/実/は f≈1900;
  arc text f2010–2100 (33.5–35.0 s); navy chips 吐いた/エラー/ずら f2130–2190 (35.5–36.5 s),
  exit whip f2227 (37.1 s).
- **S6:** f2413–2414 white ×2 + ~200 ms decay; locked bottom lyric f2420→f2978 (~9.3 s,
  never moves); centre pose swaps on the grid; fairies swap edge positions ~1 s.
- **S7:** f2978–2979 white ×2 + ~300 ms decay; correction panels + X draw f≈2995–3075;
  corner words ばっ/か/持て/は/や/す f3048–3075; starbursts f≈3270 (54.5 s), f≈3300 (55.0 s);
  white diamonds f3330–3345, exit blur f≈3370; bottom-line slams f3420–3465; whip f≈3468.
- **S8:** f3541–3542 white ×2 + ~150 ms decay; f3544+ bookend lockup (pose C); micro swaps
  f≈3660/3720/3780/3900/3960/4020.
- **S9:** f4110 (68.516 s) hard cut, zero white; static end card to f4224 (70.416 s).

### Flash grammar (whole video)

Section-boundary flashes = pure white **exactly 2 frames (33 ms)** + exponential luminance
decay 150–300 ms into the new scene (decays: 90 / 250 / 300-ramped / 200 / 300 / 150 ms for
flashes #1–#6). Exception: flash #3 **ramps in** over 4 frames (entering the busiest section).
Hard cuts (zero white) are reserved for “different world” boundaries: f1134 (18.916 s) and
f4110 (68.516 s).

## 3. Transition technique inventory → site adaptation

Site classes live in `css/input.css` (motion system, after the intro block) and are gated by
`js/motion.js` (classes only added when motion is allowed; reduced-motion collapses every
pattern to its final state instantly — content is never hidden behind an animation).

| # | technique | reference parameters | site adaptation | class |
|---|---|---|---|---|
| 1 | discrete pop-in | appears in 1 frame, no tween; stagger 0.25–0.5 s; size ≤3 % field | confetti/chips/badges snap in, stagger 200–300 ms | `emc-pop` |
| 2 | white-flash dip | 2 frames pure white (33 ms) + exp decay 150–300 ms | 2-frame-equivalent snap to 85 % white + ≤260 ms decay, pointer-events none | `emc-flash` |
| 3 | ramped flash | 4-frame luminance ramp 63→255 then decay | intro S4→S5 boundary keeps the ramp; site-wide system keeps the single flash grammar | intro-only |
| 4 | hard cut | zero-frame switch, no white (different-world) | verdict/preset high-energy flips; intro S3→S4 and S8→S9 | `emc-cut` |
| 5 | whip-squash | scaleX→~0.1 for ~120 ms, new state pops | mascot/panel content swaps 60–120 ms | `emc-swap` |
| 6 | motion-blur whip | 1–2 frame horizontal smear | **banned** (flat-art rules); #5 substitutes | — |
| 7 | word slam | appears already rotated ±8–20°, 1/beat, holds ≥1 phrase | headings pre-rotated ≤8°, settle 180 ms | `emc-slam` |
| 8 | corner slam cluster | 4 rotated one-char boxes in one beat, corners | card-grid entrance: 4 cards, ≤8°, 60 ms stagger | `emc-corner` |
| 9 | rotateY spin loop | inset still, period ≈2 s, perspective + dark border | inset figures, period ~8 s | `emc-spin` |
| 10 | staggered slide panel | diagonal bubble, slide+rotate ~0.3 s, hold ~3 s | detail/notes panels | `emc-slide` |
| 11 | staged line reveal | chip first, then 1–2 text lines 0.3 s apart inside panel | panel inner lines stagger 120 ms | `emc-lines` |
| 12 | strikethrough-X draw | scribble + X drawn across white panel ~0.3 s | quiz wrong-option strike draw 240 ms | `emc-strike` |
| 13 | starburst badge pop | black starburst, slight scale overshoot | result badges, overshoot 1.08→1 | `emc-badge` |
| 14 | locked caption | 2-line lyric locked ~9 s while centre swaps per beat | sim readout stays locked during preset swaps | `emc-lockline` |
| 15 | arc sweep text | curved outlined text, travel+rotate ~1.5 s | **not adopted** (readability) | — |
| 16 | orbiting cut-outs | chibi fairies swap edge positions ~1 s | **not adopted** as continuous motion (peripheral distraction); intro discretises them | — |
| 17 | arrow slash | black diagonal arrow drawn over lockup 0.5 s | quiz-results emphasis stroke | existing |
| 18 | bookend callback | opening composition reused verbatim at close | quiz results reuse hero lockup; intro S8 | existing |
| 19 | end card | single small bordered still, static ~1.9 s | session-complete card; intro S9 | existing |
| 20 | beat grid | pulse 1.15–1.20 s, fills 0.30 s, sub 0.55–0.60 s | UI fractions 120–300 ms | CSS vars |

## 4. Site intro — v5 “chorus cut” from footage 21 s (current)

User directive 2026-10-24: redo the intro from the ground up, referencing the
video **but skipping to 21 s — “the main motion is there”** — and show the
**Topics and formulas in action, “with blur and stuff”**. The v4 1:6 whole-video
cut was removed entirely and rebuilt off the footage’s main-motion passage:
the ramped flash #3 (f1284–1287, 21.416 s) into chorus-collage A (§2 S5), run
at that section’s own beat grid (phrase pulse ≈1.15 s, fills 0.30 s). The lyric
layer is the site’s content in action — outlined topic slams and KaTeX equation
chips whip-swap around the centre mascot, vertical equation bubble columns pop
word-by-word, speech panels slide+rotate in with staged lines, a corner cluster
slams on one beat, an arc sweep crosses the top, navy feature chips slide in
and exit on a whip, then the callback lock-up + arrow slash + Start CTA and the
letterbox wipe hand over to the homepage. Every entrance/exit rides a ~120 ms
motion-blur whip (`in-whipin`/`in-whipout`, blur 14→0→12 px) — the footage’s
1–2 frame smears quoted as a real blur at the user’s request (§5.2 exception).
Master clock `js/intro.js` `TOTAL_MS = 14000` (13.45 s picture + 0.45 s wipe);
the once-per-session contract (§6) is unchanged. Collage bed (navy field,
bordered panel cards, waveform strips, zigzag wedges, name plate + OVERDRIVE
chips) is present from frame zero, like the footage’s S5 bed at flash decay.

**Clock sync (2026-10-25).** The CSS timeline is pinned to the JS master clock:
`#introOverlay:not(.play) *` holds every child animation at
`animation-play-state: paused` until intro.js adds `.play` (after the loader’s
single completion event). Without it the beat grid ran from page-parse time —
on a slow boot (up to the 1500 ms loader watchdog) the ramp flash and first
slams played invisibly, the viewer joined mid-composition, and the tail froze
on the closed letterbox until the JS dismiss fired. Verified: with an
artificially delayed boot every overlay animation reads `currentTime = 0` at
the `.play` instant.

**Low-tier `.lite` cut (2026-10-25).** On `EMC.lowTier` devices (small
high-DPR screens, or coarse pointer with ≤4 cores — the same tier that caps
Stage at 30 fps) intro.js adds `.lite`, swapping each whip’s keyframes for
blur-free `-lite` variants (name-swap only: every delay/duration/easing is
inherited, so the beat grid is bit-identical). An animated Gaussian blur
re-rasterises every moving layer per frame; it was the composition’s only
reliable frame-dropper on weak GPUs (~150 lost frames and a 1.0 s worst frame
on a mid-tier phone profile → ~44 % lower worst frame with `.lite`).
Full-fidelity machines keep the blur whips exactly as composed.

| t (s) | event |
|---|---|
| 0.000 | ramped flash #3 grammar: 4-step 25→40→58→80→100 % white (66 ms) + ~320 ms decay |
| 0.450–1.600 | topic slam CHARGE · 1.600–2.750 eq chip Coulomb (KaTeX) |
| 2.750–3.900 | topic FIELD · 3.300 vcol1 pops (E / = / F/q, 0.18 stag) · 3.900–5.050 eq E=F/q |
| 4.350–7.600 | speech panel 1 (chip 4.350, lines 4.650/4.950) · 5.050–6.200 topic CURRENT |
| 6.200–7.900 | eq V=IR · 6.600 vcol2 pops · 7.000–9.900 speech panel 2 (lines 7.300/7.600) |
| 7.900–8.600 | topic FLUX · 8.600–10.200 eq Φ=BA |
| 9.100 | corner cluster CH·1/CH·2/CH·3/QUIZ (0.06 stag, out 11.900) · 9.300 arc sweep letters (0.035 stag, out 11.600) |
| 10.200–10.900 | topic INDUCTION · 10.600 navy chips live sims/24 questions/zero rote (0.30 stag, out 12.300) · 10.900–12.850 eq ε=−dΦ/dt |
| 12.100/12.350/12.450 | callback lock-up / arrow-slash draw / Start CTA |
| 1.15…11.60 | mascot pose-swap blur whips (1.15/3.45/5.60/7.75/9.95/11.60) |
| 13.450 | letterbox wipe (0.45 s) → `.out` → overlay removed |

### 4.1 Retired: v4 1:6 cut with the S4 passage at footage tempo

Superseded 2026-10-24 by the v5 chorus cut (markup, CSS block and timing all
deleted; git history retains the implementation). Kept for provenance: v4 was a
uniform 1:6 time-compression of the complete video (user directive 2026-10-23
“near 1 to 1 with the reference video”), master 13.814 s, `TOTAL_MS = 14330`,
with the S4 insert at footage tempo (user directive 2026-10-24 00:20 fix).

| # | section | t_ref (s) | t_site (s) | boundary transition |
|---|---|---|---|---|
| S1 | confetti overture | 0.000–2.616 | 0.000–0.436 | — |
| S2 | title lock-up | 2.616–12.116 | 0.436–2.019 | flash #1 (33 ms + ~90 ms decay) |
| S3 | handwritten skit | 12.116–18.916 | 2.019–3.153 | flash #2 (33 ms + ~250 ms) |
| S4 | black insert | 18.916–21.416 | 3.153–5.653 | **hard cut f1134, zero white; FOOTAGE TEMPO** |
| S5 | chorus A collage | 21.449–40.216 | 5.653–8.781 | **flash #3, ramped** (66 ms ramp + ~300 ms decay) |
| S6 | chorus B locked lyric | 40.216–49.633 | 8.781–10.350 | flash #4 (33 ms + ~200 ms) |
| S7 | chorus C corrections | 49.633–59.016 | 10.350–11.914 | flash #5 (33 ms + ~300 ms) |
| S8 | bookend callback | 59.016–68.516 | 11.914–13.497 | flash #6 (33 ms + ~150 ms) |
| S9 | end card | 68.516–70.416 | 13.497–13.814 | hard cut f4110, zero white |

## 5. Standing deviations (policy — do not “fix” these back)

1. **Palette** stays the site’s pink identity (user choice 2026-10-23; footage yellow field →
   pink, blue → plum).
2. **Motion-blur smear frames → whip-squash** (`in-whipx`, 30 ms steps) site-wide; blur
   filters are banned by the flat-art rules (no gradients, backdrop-filter, shadowBlur,
   blur) — **except the intro overlay** (user directive 2026-10-24 “with blur and stuff”):
   the v5 chorus cut quotes the footage’s 1–2 frame smears as real ~120 ms filter:blur
   whips (`in-whipin`/`in-whipout`). The ban holds everywhere else and smoke-test asserts
   both halves of that split.
3. **Arc-swept curved text omitted site-wide** (decorative, hurts scanability) — the v5
   intro adopts one arc sweep (“ELECTROMAGNETICS IN MOTION”, 9.300–11.600 s) as a direct
   quote of footage f2010–2100; user directive supersedes the omission inside the intro.
4. **Orbiting fairies discretised** into 0.333 s position swaps (continuous peripheral
   motion stays a do-not-copy).
5. **Readability floors** where 1:6 scaling would be sub-perceptual: inset spin period
   0.5 s (scaled 0.333 s), arrow draw 0.15 s (scaled 0.083 s), slams ≥ 0.08 s.
5b. **S4 at footage tempo** (2026-10-24): the 00:20 insert keeps the footage’s own holds
   (1.1 s / 1.0 s / 0.37 s) instead of 1:6 — at 0.05 s spacing the sequence read as a
   flicker, not as the footage’s deliberate beat. S5–S9 shift +2.078 s accordingly.
6. **Site-only additions:** Start CTA on the bookend, letterbox wipe handover, skip button
   (always visible; any key/pointer dismisses).
7. Full-white 255 flashes dimmed to ≤85 % white **site-wide** for photosensitivity comfort
   (the intro keeps the frame grammar but the same cap).
8. **AI-generated electron backdrop** — retired with the v4 cut and deleted from
   `img/` in the 2026-10-24 cleanup. It was site-only decoration for the v4 opening
   lockup/bookend; the v5 chorus cut opens on the collage bed instead, matching the
   footage’s S5.

## 6. Contract/gate surface touched by the intro

- `js/intro.js` — `TOTAL_MS` (14000), once-per-session key, skip wiring, `emc:loader-done`
  order, arc-letter builder for `.in-arc[data-arc]`.
- `tools/intro-verify.mjs` — auto-end window 13.6–16.6 s after `load` (v5 lands inside it
  unchanged); overlay-removal waits 20 s. `tools/smoke-test.mjs` — jsdom removal window
  13.9–16.3 s, CSS markers `in-whipin`/`in-whipout`/`in-ramp`/`in-wipe`, beat onsets
  `--ti` of `.in-s1`/`.in-f5`, bed markers, and the no-blur-outside-intro split.
  `tools/screenshots.mjs` presets the intro key. `tools/capture-intro-video.mjs` removal
  wait 25 s. Every change is logged in the `BUG_AUDIT.md` test-change log with justification.

## 7. How to re-derive / verify

- The MP4 is the only source of truth. Extract windows with the imageio ffmpeg build
  (Playwright’s bundled ffmpeg cannot demux MP4):
  `ffmpeg -ss 18.9 -i Video/シェリーライド.mp4 -map 0:v:0 -frames:v N out%03d.png`.
- Site intro capture: `node tools/capture-site-intro.mjs` (real-time screenshot loop +
  timestamps into `/tmp/introcap`), `node tools/capture-intro-video.mjs` (webm).
- Gates: `npm run intro-verify`, `npm run motion-verify`, `npm run test`, `npm run check`.
- Former evidence piles (segment GIFs, 4 fps contact sheets W01–W12, 60 fps strips,
  phase logs) were pruned in the 2026-10-24 repository cleanup; regenerate on demand
  from the MP4 — they are derived artifacts, not sources.
