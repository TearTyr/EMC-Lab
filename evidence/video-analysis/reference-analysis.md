# Reference analysis — `Video/シェリーライド.mp4` (complete video)

Addendum-phase report. Supersedes the intro-only scope of
`evidence/phase8/gif-conversion-notes.md`; complements (and where noted,
corrects) `evidence/phase8/reference-timeline.md`. All observations below were
re-derived this session by an independent viewing pass (method §4), not copied.

## 1. Source facts (measured, this session)

| property | value | how measured |
|---|---|---|
| path | `Video/シェリーライド.mp4` (repo original) | located by filesystem search |
| duplicate | `.scratch/ref/sherry.mp4` — byte-identical (md5 match), **removed** in cleanup | `md5sum` |
| md5 | `28bb22f6cc290a110cb96f3256776f`… full: `28bb22f6cc290a110cb96f325677276f` (unchanged before/after all work) | `md5sum` |
| container duration | **70.47 s** (00:01:10.47), bitrate 5287 kb/s | `ffmpeg -i` |
| video stream | h264 High, yuv420p (tv, bt709, progressive), **1920×1080, 60 fps**, 5029 kb/s | `ffmpeg -i` |
| decoded video frames | **4225 frames, n=0…4224, last pts_time 70.416 s** | full `showinfo` decode |
| audio stream | AAC-LC, 44100 Hz, stereo, 128 kb/s | `ffmpeg -i` |
| extra stream | attached PNG cover art 1280×720 (stream 0:2) — must be excluded from conversions (`-map 0:v:0`) | `ffmpeg -i` |
| tail | **no black tail**: final 10 decoded frames (f4215–4224) are all the yellow end card (mean lum 217.7). The container's 70.47 s includes audio/cover padding beyond the last video frame. | direct decode of last frames |

Tool: ffmpeg 7.0.2 (imageio-ffmpeg static build, reinstalled this session;
playwright's bundled ffmpeg is a reduced build that cannot demux MP4).

**Correction of prior record:** `evidence/phase8/reference-timeline.md` lists
"~4222+ → black → end". Refuted: frames 4215–4224 are uniformly the end card.
All other prior timestamps re-confirmed by this session's pass.

## 2. Complete GIF coverage (verified)

All segments: 480×270, two-pass palette (64 colours, `dither=none`,
`scale=area`), `loop=0`, stored in `evidence/video-analysis/`.

| file | source range | fps | frames | decoded total | content spot-checks (first / mid / last) |
|---|---|---|---|---|---|
| `reference-full-01_t000.0-t018.9.gif` | 0.000–18.916 | 12 | 227 | 18.91 s | yellow overture / title lockup pose B / skit line 3 + edge-on insets |
| `reference-full-02_t018.9-t040.2.gif` | 18.916–40.216 | 12 | 256 | 21.33 s | hard cut into black/red insert / chorus A collage / speech-bubble panel pre-flash |
| `reference-full-03_t040.2-t059.0.gif` | 40.216–59.016 | 12 | 226 | 18.83 s | flash #4 decay / flash #5 (mid sample lands exactly on it) / chorus C corner slams |
| `reference-full-04_t059.0-t070.5.gif` | 59.016–70.433 (last frame) | **20** | 228 | 11.41 s | flash #6 decay / bookend lockup / end card at final frame |
| `reference-flashes_6x30fps.gif` | 6 × 1.4 s windows @ 2.62/12.12/21.45/40.22/49.63/59.02 | 30 | 252 | 8.40 s | all six windows contain near-pure-white frames (mean lum 250.8–252.8) |

Coverage check: segment boundaries 0 → 18.916 → 40.216 → 59.016 → end are
consecutive with no gap and no overlap; summed decoded duration 70.48 s ≈
70.47 s container / 70.433 s last-frame end. Seg4 re-encoded at 20 fps after
the 12 fps version's last slot fell 1 frame short of the true final frame;
its final GIF frame now equals source f4224 (end card). Per-frame checks
(PIL): no frozen run ≥1 s in any segment; distinct-frame hashes 213/241/226/126
of 227/256/226/228 — genuine animation throughout. Visual re-check sheets:
`.scratch/gifcheck/verify-*.png` (first/mid/last per segment + flash grid),
copied to `evidence/video-analysis/gifcheck/`.

33 ms white flashes are below Nyquist at 12 fps, hence the 30 fps montage;
frame-exact flash shapes are additionally in `evidence/phase8/strips/S00,S05,
S07,S10,S11,S13` (60 fps consecutive windows).

## 3. Method of the complete viewing pass (this session)

1. Full 4 fps sequential sheet pass: 282 frames (0→70.25 s slots, i.e. every
   source quarter-second) tiled 4×6 with per-cell absolute timestamps into
   `sheets/W01…W12.jpg`; **all twelve sheets read in chronological order**.
2. Slow-motion re-reads of every fast transition at consecutive-frame rate:
   strips S00 (flash #1 onset), S05 (flash #2 + spin-in), S06 (hard cut
   18.92), S07 (ramped flash #3), S13 (whip + flash #6 + bookend) — read this
   session; S01–S04, S08–S12, S14 moments verified in the 4 fps pass and in
   the numeric per-frame series of the phase-8 log.
3. Numeric: per-segment frame hashing / duration audit (PIL) and flash-window
   luminance audit (above). No real-time player exists in this environment;
   "replay" = sequential dense-frame inspection, stated plainly.

## 4. Chronological scene & transition timeline (full video)

Frame numbers = 0-based decode indices; t = pts s (≈ idx/60 + 0.016).

| # | range | section | what is on screen | motion / transitions |
|---|---|---|---|---|
| 1 | 0.000–2.616 | confetti overture | flat saturated yellow; nothing else until f14 | discrete pop-ins, one confetti element (triangle/dot/crescent/micro-glyph, ≤3 % width, light blue) per 0.25–0.5 s, **no tween**; field then static |
| 2 | 2.616–12.116 | title lockup | **flash #1**: pure white exactly 2 frames (f156–157) → ~90 ms staggered dissolve-out-of-white; outlined two-line title "シェリーライド / Sherry ride" locked below centred character cut-out; white silhouette strip + tiny EQ glyphs behind | paper-doll micro swaps (mouth/eye variants) as 1-frame discrete cuts on a 1.5 s macro + 0.30 s doublet-fill beat grid (f230,263,281,299,317,410…); **whip-squash** f440–447 (cut-out scaleX→~0.1, ~120 ms) between pose families A→B; pose B lands f448 |
| 3 | 12.116–18.916 | handwritten skit | **flash #2** (2 white frames + ~250 ms exponential decay); two handwritten black lines top-left; tilted 3D inset still (dark-red interior) left-of-centre | inset **continuous rotateY spin**, period ≈2 s (edge-on ↔ facing every ~0.5–1 s, verified f733→760, f840→870…); red "VS" discrete pop f≈840; second line pair + second inset staggered pop f≈870; third line discrete swap f≈960 |
| 4 | 18.916–21.449 | black/red insert | **hard cut, zero white frames** (f1134): black field, giant cropped 3D red-haired face, two pink chibi cut-outs flanking, tiny caption "大丈夫か？" | chibi pose swaps f1140→f1160 (discrete); staged slams ~0.3 s apart f≈1200: red banner block + big laughing thumbs-up chibi + outlined caption; black stamp glyph slam f1260 |
| 5 | 21.449–40.216 | chorus collage A | **flash #3, ramped**: 4-frame ramp-in (63→102→147→204→255, f1284–1287) + ~300 ms decay; blue/white panel collage, name plate chip "TACHIBANA SHERRY", "OVERDRIVE" chip, yellow zigzag wedges | rotated outlined lyric slams one per beat ("限界まで","足掻いた","人","は","生"…); 1–2 frame motion-blur whip into pose swaps (f1410–1440); vertical lyric bubble columns slam word-by-word (f≈1440/1500); **diagonal speech-bubble panels** slide+rotate in from top-left with staggered typed lines (name chip first, then 1–2 lines ~0.3 s apart), hold ~3 s, swap out (f1560–1740, second panel f≈2040…); title callback bottom-centre + black diagonal **arrow slash** drawn over it (f≈1800, 0.5 s); four rotated corner word-boxes slam in one beat (f≈1860, more pairs to f≈2280); arc-curved outlined text sweeps top with rotation+travel (f2010–2100); **dark-navy rounded chips** with white text slide in horizontally, 0.3 s stagger (f2130–2190: 吐いた/エラー/ずら), exit via whip-blur f≈2227 |
| 6 | 40.216–49.633 | chorus collage B | **flash #4** (2 white frames + ~200 ms decay) | **locked two-line horizontal lyric** bottom ("かっこいいシェリーソロ / Cool Sherry Solo") held ~9 s while centre pose swaps on the beat grid; small chibi "fairy" cut-outs **orbit the frame edges**, swapping positions ~every 1 s; name chip top-centre |
| 7 | 49.633–59.016 | chorus collage C | **flash #5** (2 white frames + ~300 ms decay) | white rounded "correction" panels slam in with scribble + **strikethrough-X draw** (f≈3060, second panel f≈2030 rel.); big blue corner words per beat (ばっ/か/持て/は/や/す…); **black starburst badges** with white text pop with slight scale overshoot (吐いた f≈3270, 言葉の); white diamond panels (裏なんて) swap with blur; bottom-line word slams (由もないだろう); **motion-blur whip** f3468 |
| 8 | 59.016–68.516 | bookend callback | **flash #6** (2 white frames + ~150 ms decay) → identical composition to §2 (yellow field, same lockup, silhouette strip) with pose C | pose micro-swaps on the grid (f≈3900, 3960, 4020…) — the opening's exact framing reused as closing motif |
| 9 | 68.516–70.433 | end card | **hard cut, zero white** (f4110): yellow field + one small (~15 % width) bordered still (thumbs-up pose, red bg) centred; static hold to the final frame f4224 | none (static hold); no black tail (see §1 correction) |

Pacing summary: phrase pulse ≈1.15–1.20 s; doublet fills ≈0.30 s; sub-beats
≈0.55–0.60 s (numeric onset grid, phase 7). Section lengths 2.6 / 9.5 / 6.8 /
2.5 / 18.8 / 9.4 / 9.4 / 9.5 / 1.9 s — the video front-loads identity (title),
spends the middle on dense per-beat collage, and closes with a quiet bookend +
minimal end card.

## 5. Effects inventory → see `transition-inventory.md`

## 6. Suitability for EMC Lab

**Adopt (already mapped in phase 8, re-confirmed):** beat-grid fractions for
UI timing; 2-frame white dip + decay for route/section change; zero-transition
hard cut for high-energy verdict flips; whip-squash for asset/pose swaps;
discrete staggered pop-in for confetti/chips/badges; pre-rotated word slam for
headings; slow rotateY loop for inset figures; staggered slide+rotate panels;
bookend callback for quiz results; single-card end state.

**Adopt now (new from the full-video pass, implemented this phase):**
- staged line reveal inside sliding panels (speech-bubble panels: chip first,
  then lines 0.3 s apart) → detail/notes panel content lines;
- strikethrough draw on correction panels → quiz wrong-option feedback;
- starburst badge pop with slight overshoot → quiz result badges;
- long-locked caption that persists while other elements swap (chorus B) →
  sim status/readout line that stays put during preset switches;
- corner word-box slam cluster (4 in one beat, pre-rotated ≤8°) → chapter
  card / stat grid entrances.

**Do not copy:** motion-blur smear frames (blur filters banned by flat-art
rules; whip-squash substitutes); arc-sweeping curved text (decorative, hurts
scanability); orbiting fairy cut-outs (continuous peripheral motion =
distraction + reduced-motion liability); full-white 255 flashes (dimmed to
≤85 % white on the site for photosensitivity comfort); 2 s spin period
(slowed to ~8 s); per-beat centre swaps in educational diagrams (content must
not flicker at beat rate).

## 7. Mapping reference → site (implemented state after this phase)

| reference technique | site element | class/hook |
|---|---|---|
| confetti pop-in | hero intro confetti | `emc-pop` (intro.js) |
| white-flash dip | page/section route change | `emc-flash` (motion.js) |
| hard cut | quiz verdict colour flips, sim preset jumps | `emc-cut` |
| whip-squash | mascot reaction swaps, panel content swaps | `emc-swap` |
| word slam | section titles, hero words | `emc-slam` |
| rotateY spin loop | inset figures / chapter art frames | `emc-spin` |
| staggered slide panels | detail-mode panels, notes | `emc-slide` |
| **staged line reveal** (new) | lines inside detail/notes panels | `emc-lines` |
| **strikethrough draw** (new) | quiz wrong-option marks | `emc-strike` |
| **starburst badge pop** (new) | quiz result badges | `emc-badge` |
| **locked caption** (new) | sim readout line during preset swaps | `emc-lockline` |
| **corner slam cluster** (new) | chapter/stat card grid entrance | `emc-corner` |
| bookend callback | quiz results reuse hero lockup | existing layout |
| end card | session-complete single card | existing layout |

Reduced motion: every pattern above collapses to its final state instantly
(gates in `js/motion.js` add classes only when motion is allowed); content is
never hidden behind an animation.
