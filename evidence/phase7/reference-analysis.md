# Reference analysis — `Video/シェリーライド.mp4` (video ID `8CilACT9uFs`)

**Access status: FOOTAGE INSPECTED.** Source: `origin/main` commit `2e836f8`
("Create シェリーライド.mp4"), extracted with `git show` to `.scratch/ref/sherry.mp4`
(46,580,541 bytes; ISO MP4, `ftyp isom` — real media, not an LFS pointer or error page).
Decoded with ffmpeg 7.0.2 (imageio-ffmpeg static build). Frames viewed with the
agent's vision tool (`overview.png` 6×6 @ 2 s, `opening.png` 6×4 @ 0.5 s for 0–12 s,
`cutpairs.png` ±0.35 s around every detected cut). Audio decoded to WAV and analysed
numerically (RMS onset envelope); no melodic/harmonic claim is made beyond onset timing.

## Metadata (ffmpeg)
- Duration 70.47 s · 1920×1080 · 60 fps · h264 yuv420p bt709
- Audio: AAC-LC 44.1 kHz stereo 128 kb/s (present)
- Attached pic: png 1280×720 (cover art)

## Cut map (scene detection, thresholds 0.4 / 0.25)
Hard cuts at **12.12, 18.92, 21.42, 40.23, 49.65, 59.03, 68.52 s**.
Pairs inspected (`cutpairs.png`): 12.12 = yellow title field → yellow text-skit field;
18.92 = yellow skit → black/red insert (different visual world); 40.23 / 49.65 / 59.03
pass through **brief white flash frames** (white-dip section transitions); 68.52 = end
card → black. Inside sections there are no hard cuts — beats are carried by pose swaps,
type slams and panel rearrangements.

## Observed editing grammar (timestamped)
1. **0.0–0.5 s** flat saturated yellow field, nothing else. **0.5–1.5 s** small blue
   geometric confetti (triangles, dots, a music-note glyph) pops in one by one.
2. **~2.0 s** white flash, then the character cut-out + locked outlined title
   ("シェリーライド / Sherry ride", white fill + dark outline, *below* the figure)
   appear together; field carries a **faint horizontal strip of repeated silhouette
   copies** of the character plus tiny EQ-bar glyphs.
3. **2.5–12 s** paper-doll **pose swaps** of the central cut-out on the beat
   (singing mouth → waving arm + closed happy eyes → …), roughly every 1–1.5 s;
   title and composition stay locked. No smooth tweening — discrete frame swaps.
4. **12.1–18.9 s** skit interlude on the same yellow: handwritten-style text lines
   with a red "VS", plus **small tilted (3D-perspective) inset stills** of other footage.
5. **18.9–21.4 s** hard insert cut to a black field with a red banner strip and a
   3D-rendered face; tiny chibi cut-outs in corners; white caption text.
6. **21.4–59 s** chorus: busy **blue/white collage field** — repeated UI-panel
   rectangles containing character stills, a white **name-plate chip** ("TACHIBANA
   SHERRY") top, tiny "OVERDRIVE" chip bottom, yellow zigzag/wedge slashes at edges;
   **huge outlined lyric words slam in rotated** around the central cut-out one per
   beat (left, right, diagonal); white speech-bubble blobs and black starburst badges
   carry secondary text; central figure keeps pose-swapping; occasional motion-blur
   whip frames (~58 s).
7. **59–68.5 s** bookend callback: back to the flat yellow title field, same
   character+title lockup as the opening, pose swaps continue.
8. **68.5–70.5 s** end card: one small tilted still centred on yellow → black.

## Audio beat grid (onset envelope, 50 ms hops, Δ>0.22)
67 onsets. First onset **1.50 s** (opening sparse: mean env 0–6 s = 0.41). Chorus
20–40 s denser (0.54) with a steady **1.15–1.20 s phrase pulse** (12+11 occurrences)
and **0.30 s doublet fills**; median IOI 1.15 s. Visual slams/pose swaps align to this
pulse; section cuts land on phrase boundaries.

## Translation into the EMC Lab intro (v3 rebuild)
- Beat grid ≈ 1.16 s phrases (sub-beats 0.58/0.29) — section boundaries on phrase
  multiples, slams/pose swaps on sub-beats. Total kept inside the 3–6 s budget.
- Yellow field → EMC **pink** field (site identity), blue collage → plum/pink collage;
  structure and rhythm copied, palette mapped to the site's design tokens.
- Confetti-then-flash-then-lockup opening; title **below** the mascot, locked.
- Silhouette strip behind the title field (repeated faded mascot copies).
- Pose swaps per beat using the two drawn eye states + discrete tilt/scale alternation.
- Skit interlude with red VS + tilted inset sticker frames (formulas/mascot states).
- Short black/red insert cut (mascot sparkle + caption) before the collage chorus.
- Collage chorus: panel rectangles, top name-plate chip "EMC LAB", bottom chip,
  wedge slashes, four rotated outlined word/formula slams around the mascot.
- White-flash dips at section boundaries (1–2 frames), motion-blur whip approximated
  by a fast translate+scaleX stretch (no blur filters — flat-art rules).
- Bookend: pink title-field callback, then the existing two-panel wipe into the
  rendered homepage.

Artifacts (dev-only, outside production assets): `.scratch/ref/sherry.mp4`,
`.scratch/ref-analysis/*` (overview.png, opening.png, cutpairs.png, audio.wav, cut pairs).
The repository `Video/` folder (from origin/main) is a development reference and is
excluded from the built public output (see `build:public` gate).
