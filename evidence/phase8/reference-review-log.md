> **Phase-9 note (2026-10-24):** the 2 fps `sheets/overview-*.jpg` batch referenced
> below was superseded by the denser 4 fps pass (`evidence/video-analysis/sheets/
> W01–W12`, every frame slot read) and removed in cleanup; strips remain here.
> One correction: the video has NO black tail (last decoded frames = end card);
> see `evidence/video-analysis/reference-analysis.md` §1.

# Reference review log — `Video/シェリーライド.mp4` (§3)

**Source:** `Video/シェリーライド.mp4` (repo, from origin/main `2e836f8`), 70.47 s,
1920×1080, h264 yuv420p, 60 fps nominal, AAC stereo. Decoded with ffmpeg 7.0.2
(imageio-ffmpeg static build). Frames viewed with the agent's vision tool.
Audio: NOT listened to (no listening capability); beat grid taken numerically
from the phase-7 RMS onset envelope (`audio.wav` in `.scratch/ref-analysis/`).

## Method (what was actually done)

1. **Full decode + per-frame numeric pass (ALL frames).** Every decoded frame
   (4226 of ~4228 expected; 1–2 frames lost to pipe startup, accounted for by
   index alignment below) was streamed at 160×90 through ffmpeg rawvideo into
   numpy; per-frame mean-abs diff and mean luminance series were computed and
   saved (`/tmp/diff.npy`, `/tmp/lum.npy`, regenerated per session). Events were
   clustered (gap ≤ 8 frames) → 111 transition clusters; white-flash candidates
   and cut frames identified from luminance spikes. This is a consecutive-frame
   inspection of the whole video at numeric resolution.
2. **PTS mapping (VFR check).** `ffmpeg -vf showinfo` per-frame `pts_time`
   captured for all 4225 presented frames: deltas are 16.7 ms except six
   anomalies (3× 0.0 ms, 3× 33.3 ms) → effectively CFR; decode index i ↔
   pts = i/60 + 0.016 s. All timestamps below are pts seconds; frame numbers
   are 0-based decode indices (the numbers `select=eq(n,…)` uses).
3. **Sequential visual batches (numbered, none skipped silently).**
   - Whole-video pass at 2 fps: frames sampled by the ffmpeg `fps` filter
     (which emits the last source frame within each slot's half-interval),
     tiled 4×4 with per-cell timestamps into `sheets/overview-1..9.jpg`
     (batches B1–B9, 16 frames each, covering 0→70.5 s). **All nine read.**
   - Intro-section pass at 4 fps, 0→12.12 s: `sheets/intro-1..4.jpg`
     (batches B10–B13; 16/16/16/1 frames). **intro-1..3 read; intro-4 is the
     single post-cut frame already covered by strip S05.**
   - Event strips (consecutive frames around every detected transition),
     `strips/S00..S14.jpg`, each cell labelled `f<idx> t=<pts>`:
     S00 f146–161 flash onset (**read**), S01 confetti 0.5–2.5 s (saved;
     content confirmed in B10 at 4 fps), S02 flash→reveal→first swap (**read**),
     S03/S04 pose swaps 3.8–11.4 s (saved; confirmed in B10/B11), S05 cut
     12.12 s (**read**), S06 hard cut 18.92 s (**read**), S07 flash 21.45 s
     (saved; confirmed in B3 + numeric luminance curve), S08/S09/S12 chorus
     beats (saved; confirmed in B4–B6), S10/S11 flashes 40.23/49.65 s (saved;
     numeric luminance curves inspected frame-by-frame + B6/B7 cells), S13
     whip+flash+bookend 56.3–59.2 s (saved; confirmed in B8), S14 bookend +
     end card (saved; confirmed in B9).
   - Strips not individually re-read are still on disk as evidence; every
     moment they cover was verified either in a sheet batch or numerically
     (luminance/diff curves are per-frame data, i.e. consecutive-frame level).
4. **Playback:** "normal speed / reduced speed replay" was performed as
   sequential frame inspection (2 fps = ~half speed perception of a 60 fps
   source for the overview; 4 fps for the intro; 60 fps consecutive frames in
   the strips and numeric series). No real-time video player exists in this
   agent session; this is stated plainly rather than over-claimed.

## Index alignment note (integrity)

The rawvideo diff series lost the first decoded frame (4226 vs 4228 expected),
so raw series index r maps to decode index i = r − 1. The `select`-based strips
and the showinfo PTS table use decode indices. Cross-check: white flash =
decode f156–157 (pts 2.616–2.633) appears as raw r157–158 in the diff series
and as the `t=2.50` cell of the 4 fps intro sheet (fps-filter slot rounding).
All three agree once aligned.

## Per-batch observations (frame / pts / content / motion / mismatch-vs-site)

### B10 intro-1 (0.00–3.75 s @4 fps) + S00/S01/S02
- f0 (0.000): flat saturated yellow field, nothing else. Static until f14.
- Confetti pops, one element per ~0.25–0.5 s, no tween (discrete appear):
  f≈15 tri#1 (left-centre), f≈30 tri#2 (right), f≈60 dot#1, f≈75 dot#2,
  f≈90 crescent + tiny "3" glyph, f≈105 "v" glyph, f≈120 "6"/"σ" glyphs,
  f≈135 extra micro-glyphs. Elements are small (≤3 % of width), light blue on
  yellow, outline-free. Diffs below 0.4 at 160×90 → invisible to coarse
  numeric scan; visible at 320×180 cells.
- f156–157 (2.616–2.633): **pure white snap, exactly 2 frames** (d=0 between
  them, lum 255).
- f158–163 (2.649–2.733): ~80–100 ms dissolve-out-of-white: composition
  appears ghosted (≈90 % white) then gains opacity in **staggered bursts**
  (dRGB peaks at f163 8.2, f175 7.1, f193 7.1 — i.e. title glyphs / mascot /
  strip land one after another ~0.2–0.3 s apart).
- f≈198 (3.30): lockup settled: character cut-out centred-upper, outlined
  two-line title ("シェリーライド" big, "Sherry ride" small) **locked below**
  the figure; faint horizontal strip of repeated white silhouette copies +
  tiny EQ glyphs across the field behind.
- Mismatch check vs site intro v3: site opens with confetti then flash then
  lockup — same order. Site's confetti are larger and outlined (readability
  deviation, intentional, logged in phase 7).

### B11 intro-2 (4.00–7.75 s)
- Pose A (singing open mouth, mic raised, eyes open) holds f198–439.
- Micro paper-doll part swaps inside pose A (mouth/eye variants): f230
  (3.849), f263 (4.399), f281 (4.699), f299 (4.999), f317 (5.299), f410
  (6.849) — single-frame discrete swaps, no tween; the 4.4–5.3 group is a
  0.30 s doublet-fill run matching the audio onset doublets.
- f440–447 (7.349–7.466): **whip-squash transition**: cut-out collapses to a
  ~10 %-width vertical sliver (horizontal scale ≈0.1, d=14) for ~120 ms.
- f448 (7.483): pose B lands (waving arm up, closed happy ^-^ eyes).
  → pose swaps are NOT plain cuts: A→B uses a squash-and-stretch whip.
- Mismatch: site v3 pose swaps are opacity cross-swaps; adding the whip
  squash is a phase-8 improvement (see MOTION-02).

### B12 intro-3 (8.00–11.75 s)
- Pose B holds with micro swaps f460 (7.683), f550 (9.183), f640 (10.683),
  f661 (11.033), f678–679 (11.316). Composition (title, strip) never moves.
- 1.5 s macro interval between pose families (7.48→9.18→10.68), 0.3 s fills
  inside — same beat grid as the audio onsets.

### B13 intro-4 (12.00 s single cell) + S05 (f725–760)
- f726–727 (12.116–12.133): white flash (2 frames) then ~250 ms exponential
  luminance decay (255→214 over f728–740) revealing the NEW section.
- New section (skit): two handwritten black text lines top-left
  ("くらい！/暗いですよー！") present from f729; a **tilted 3D inset still**
  (dark-red interior w/ character) enters spinning about the vertical axis
  (edge-on f733→facing f740→edge-on f760): continuous rotateY, period ≈2 s,
  with perspective + dark border. Inset ≈28 % of width, left-of-centre.
- Mismatch: site v3 insets appear with a one-shot tilt-in; the reference
  spins continuously → phase-8 change (continuous slow rotateY loop).

### B1/B2 overview-1/2 (0–15.5 s @2 fps)
- Confirms B10–B13 at coarser rate; adds skit staging: f≈840 (14.0) red "VS"
  appears between the line pairs; f≈870 (14.5) second line pair
  ("シェリーちゃん/可愛い大好き") + second inset spin-in right; f≈960 (16.0)
  third line ("ちょっと後者に行ってくる") replaces top lines; insets keep
  spinning throughout (facing 16.0/16.5, edge 17.0, facing 17.5/18.0, edge
  18.5) → spin is a loop, not an entrance.

### B3 overview-3 (16–23.5 s) + S06 (f1133–1210)
- f1134 (18.916): **hard cut, zero white**: yellow skit → black field, giant
  3D red-haired face cropped top-centre, two pink chibi cut-outs flanking
  (poses swap f1140→f1160), tiny white caption bottom-centre ("大丈夫か？").
- f≈1200 (20.0): red banner block slams behind top; big laughing thumbs-up
  chibi overlays centre with outlined caption line ("大丈夫ですよ"); f1260
  (21.0) black stamp glyph slams on the face.
- f1286–1287 (21.449–21.466): white flash — this one **ramps in over 4 frames**
  (lum 63→102→147→204→255) then decays ~300 ms into the chorus.
- Chorus arrival f1290+: blue/white collage — repeated UI-panel rectangles
  with face stills, white name-plate chip "TACHIBANA SHERRY" top-left,
  "OVERDRIVE" chip bottom-right, yellow zigzag wedge slashes at corners,
  huge blue-outlined lyric words ("限界まで" top-left, "足掻いた" bottom)
  slammed in rotated; central cut-out (white outfit, fingers-to-cheeks).
- f1410–1440 (23.5–24.0): **motion-blur whip frame** (horizontal smear) into
  next pose.

### B4 overview-4 (24–31.5 s)
- Vertical lyric bubble columns slam per beat (left column f≈1440, right
  column f≈1500); central pose swaps smile↔pout-closed-eyes on the 1.5 s grid.
- f≈1560–1740: diagonal white speech-bubble panels with typeset black lyric
  lines slide/rotate in from top-left in a stagger (name tag chip first, then
  1–2 lines each ~0.3 s apart); panels hold ~3 s then swap out.
- f≈1800 (30.0): title callback — "シェリーライド" outlined lockup reappears
  bottom-centre with a black diagonal **arrow slash** through it (0.5 s),
  then four rotated corner word-boxes slam (f≈1860, "し/た/い/所").

### B5 overview-5 (32–39.5 s)
- Corner word slams continue in pairs per beat; arc-curved outlined text
  ("上手くはいかないようで") sweeps across top f≈2010–2100 (rotation + travel).
- f≈2130–2190: **dark-navy rounded chips** with white text ("撒いた/エラー/ずら")
  slide in horizontally (chip variant of the bubble panels).
- f≈2280: blue outlined words + black starburst badges appear later (B7).

### B6 overview-6 (40–47.5 s) + S10 (numeric + cell)
- f2413–2414 (40.216–40.233): white flash, 2 full-white frames, ~200 ms decay.
- New chorus layout: locked two-line horizontal lyric bottom
  ("かっこいいシェリーソロ / Cool Sherry Solo") held ~9 s; centre pose C
  (pointing smile); small chibi "fairy" cut-outs orbit the frame edges,
  swapping positions every ~1 s; name chip top-centre; wedge slashes top-right.

### B7 overview-7 (48–55.5 s) + S11 (numeric)
- f2978–2979 (49.633–49.650): white flash (2 frames, 253→253), ~300 ms decay.
- White rounded "correction" panels with scribble + strikethrough-X slam in
  (f≈3060); big blue corner words ("ばっ/か/持て/はやす/ユーザー") per beat;
  **black starburst badges** with white text ("吐いた" "言葉の") pop at f≈3270.

### B8 overview-8 (56–63.5 s) + S13 (numeric)
- f3468 (57.80): motion-blur whip frame; f3541–3542 (59.016–59.033): white
  flash (2 frames 255) → **bookend callback**: flat yellow title field again,
  same outlined title lockup below the cut-out, now pose C (finger-to-cheek
  smile); silhouette strip returns; pose micro-swaps continue on the grid.

### B9 overview-9 (64–70.47 s) + S14
- Bookend holds with pose swaps (f≈3900, 3960, 4020…) to f4110 (68.516):
  **hard cut** to end card: yellow field + one small (~15 % width) bordered
  still (thumbs-up pose, red bg) centred; holds ~1.9 s; final ~0.1 s black.

## Numeric consecutive-frame evidence kept
- `/tmp/lum.npy`, `/tmp/diff.npy` (per-frame luminance + diff, regenerated per
  session), `/tmp/pts.json` (showinfo PTS table), `/tmp/clusters.json`
  (111 transition clusters). Flash shapes (lum per frame) transcribed in
  `reference-timeline.md` §Flash grammar.

## What this log does NOT claim
- No real-time playback (no player in session); "replay at reduced speed" =
  the 2/4 fps sequential sheet passes + 60 fps strips + per-frame numerics.
- No audio listening; onset grid is numeric-only (phase 7).
- Strips S01, S03, S04, S07–S13 were extracted and saved but their moments
  were concluded from sheet batches + numeric curves, not a separate read.
