> **SUPERSEDED (phase 9 addendum, 2026-10-24).** The intro-only GIF this note
> describes (`intro-reference.gif`, 0→12.12 s) was replaced by FULL-video
> segments covering 0→70.47 s: `evidence/video-analysis/reference-full-01…04`
> + 30 fps flash montage, all re-verified (see
> `evidence/video-analysis/reference-analysis.md` §2). The file itself was
> removed in phase-9 cleanup after the segments were verified; the commands
> below still reproduce it exactly if ever wanted again.

# Intro GIF conversion notes (§2)

**Source (authoritative):** `Video/シェリーライド.mp4` — 70.47 s, 1920×1080, 60 fps,
h264 yuv420p bt709 + AAC-LC stereo (ffmpeg 7.0.2, imageio-ffmpeg static build).
The MP4 was NOT modified or overwritten.

**Intro section chosen:** `0.00 s → 12.12 s`. Justification: frame-accurate scene
detection puts the first hard cut of the video at 12.12 s (yellow title field →
yellow skit field; see `reference-timeline.md` / phase-7 cut map). Everything the
site's intro re-creates (confetti pop-in, white flash, locked cut-out + outlined
title over a silhouette strip, beat-grid pose swaps) lives inside this opening
title sequence; the rest of the video is verse/skit/chorus material the intro
quotes in compressed form.

**Output:** `evidence/phase8/intro-reference.gif`

| setting | value |
|---|---|
| time range | `-ss 0 -t 12.12` (trim applied on the OUTPUT side) |
| frame rate | `fps=12` (145 frames; 80–90 ms per frame) |
| scale | `scale=960:-1:flags=lanczos` → 960×540 |
| palette | two-pass: `palettegen` (global stats) → `paletteuse=dither=bayer` |
| loop | infinite (`loop=0`) |
| size | 21,754,104 bytes |

Exact commands (FF = `python3 -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"`):

```bash
"$FF" -y -ss 0 -i "Video/シェリーライド.mp4" -t 12.12 -map 0:v:0 -an \
  -vf "fps=12,scale=960:-1:flags=lanczos,palettegen" -threads 2 /tmp/pal-intro.png
"$FF" -y -ss 0 -i "Video/シェリーライド.mp4" -i /tmp/pal-intro.png \
  -filter_complex "[0:v]fps=12,scale=960:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer[out]" \
  -map "[out]" -t 12.12 -threads 2 evidence/phase8/intro-reference.gif
```

Sandbox notes (why not the one-liner from the brief): the single-pass
`split[s0][s1];palettegen…;paletteuse` graph was OOM-killed (exit 137) in this
1 GB-RAM sandbox, so the standard two-pass palette workflow was used instead.
First attempts also exposed two option-placement traps, both fixed above:
`-t` between two `-i` inputs binds to the *second input* (produced a 155 MB
whole-video GIF), and a leftover `-map 0:v:0` next to `-map "[out]"`
double-mapped streams and failed the gif muxer (0 frames).

**Verification (PIL 12.3.0):** format GIF, size 960×540, `n_frames=145`,
`loop=0`, frame durations {80, 90} ms, 134 distinct 32×18 content hashes →
the file opens and genuinely animates; chronology preserved (sequential decode).

**Caveat:** the GIF is a review aid only — 12 fps drops 4 of every 5 source
frames and the 256-colour palette + bayer dither loses colour/temporal detail.
All final conclusions in this phase were drawn from the original MP4 frames
(see `reference-review-log.md`).
