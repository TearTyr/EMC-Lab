# Intro v6 plan — the 21 s chorus compressed to 11.5 s, recreated with our content

**Status: IMPLEMENTED (2026-10-25), ship form (a) CSS-only.** Open questions 2–4
resolved by the implemented defaults: locked line not shipped in v6 (kept simple),
starbursts shipped as the star-sparkle wink, S9 end card left out (fade hands over). Reference footage authority: `Video/シェリーライド.mp4`
(LFS; local working copy `.scratch/footage/sherry-ride.mp4`, sha256-verified).
Frame numbers are 0-based 60 fps decode indices; `t ≈ f/60`.

## 1. Source window & goal

| | |
|---|---|
| window | f1260 → f4224 (**21.0 s → 70.4 s**, 49.4 s of footage): S4 tail (stamp slam + ramped flash #3) → S5 chorus collage A → S6 chorus B → S7 chorus C → S8 bookend → S9 end card |
| goal | **10–12 s** site intro (current v5 = 14.0 s covering only S5, near real-time) |
| ratio | 49.4 s → 11.5 s ≈ **1 : 4.3** |
| measured sections | S5 21.45–40.22 · S6 40.22–49.63 · S7 49.63–59.02 · S8 59.02–68.52 · S9 68.52–70.42 (verified by frame inspection 2026-10-25, sheets/keys in `.scratch/footage/`) |

## 2. Compression strategy — cut on beats, never time-stretch

Speeding 60 fps footage ×4.3 reads as fast-forward and destroys the phrase
pulse (≈1.15 s) that gives the edit its energy. The footage's OWN grammar is
already a jump-cut edit on that pulse: discrete pose/lyric swaps, 2-frame white
flashes at section seams, 1–2-frame whip smears between pose families. So we
compress with the same grammar the video uses:

1. **Keep whole beat phrases, drop repeats.** 49.4 s at a 1.15 s pulse ≈ 43 phrases;
   we keep the **10 strongest**, one per pulse → ≈11.5 s. Nothing is sped up;
   every kept phrase plays at native speed, so motion inside each phrase stays honest.
2. **Cut exactly on the footage's own cut frames** (beat onsets / flash frames),
   so every seam in our cut is a seam the source already authored — the flash
   grammar (2 white frames + decay; ramped 4-frame at #3) becomes the transition
   vocabulary between our jumps, exactly as in the source.
3. **Section seams carry flashes; inside-section jumps carry whips.** That keeps
   the viewer oriented (flash = new world, whip = new beat) even at 4.3:1.
4. **The locked elements do the continuity work.** S6's locked bottom hook line
   (held ~9 s in source) and the never-moving collage bed are what make a
   heavily-cut chorus still read as one composition — we reuse both (§4).

Proof-of-pacing render: `.scratch/footage/preview-cut-11.5s.mp4` (1080p60, audio
kept **as a pacing reference only** — the site intro contract stays silent).

## 3. The 10-beat map (source phrase → site recreation)

| # | new t | source frames (t) | source phrase (verified on frames) | EMC Lab recreation | elements |
|---|---|---|---|---|---|
| 1 | 0.00–1.00 | f1260–1319 (21.00–22.00) | S4 black-stamp slam → **ramped flash #3** (4-step 63→102→147→204→255) → decay reveals the chorus collage bed | unchanged from v5: bed present from frame 0 (navy field, 4 panel cards, waveform strips, zigzag wedges, name plate + OVERDRIVE chips) under the ramp flash | `.in-dip .in-bed .in-card .in-wave .in-wedge .in-chip` |
| 2 | 1.00–2.17 | f1320–1389 (22.00–23.17) | outlined lyric slam 「限界まで」 top-left over the bed | topic slam **CHARGE** (outlined white type, −8°, whip-in) | `.in-slam .in-s1` |
| 3 | 2.17–3.33 | f1410–1479 (23.50–24.67) | 1–2-frame whip smear → **mascot pose swap**; lyric 2 lands; first bubble words | whip CHARGE→**eq chip Coulomb** + mascot pose swap (squash) + bubble column 1 pops word-by-word | `.in-f1 .in-mascot-wrap .in-vcol1` |
| 4 | 3.33–4.83 | f1560–1649 (26.00–27.50) | **double vertical speech-bubble lyric columns** flank the mascot (the f1560 look) | bubble column 2 + topic slam **FIELD** + eq chip **E = F/q** | `.in-vcol2 .in-s2 .in-f2` |
| 5 | 4.83–6.00 | f1790–1859 (29.83–31.00) | title callback bottom-centre + **diagonal arrow-slash draw** (0.5 s) + four corner word-boxes slam in one beat | topic **CURRENT** + eq **V = IR**, then the callback lock-up **EMC LAB** + SVG arrow draw + corner cluster **CH·1 / CH·2 / CH·3 / QUIZ** (v5 had this at 12.1 s; compression pulls it to 5.4 s) | `.in-s3 .in-f3 .in-callback .in-arrow .in-cx` |
| 6 | 6.00–7.00 | f2010–2069 (33.50–34.50) | arc-curved outlined text sweeps across the top | arc sweep **ELECTROMAGNETICS IN MOTION** | `.in-arc` |
| 7 | 7.00–8.17 | f2413–2482 (40.22–41.38) | **flash #4** → S6: locked two-line hook lyric bottom (held 9 s in source) while centre pose swaps; chibi "fairies" orbit the edges and swap ~1/s | NEW grammar: **locked governing-equation line** `F = k\|q₁q₂\|/r² · E = F/\|q₀\|` bottom (never moves — the site's own hook), topic **FLUX** + eq **Φ = BA** centre, **two orbiting charge sprites** (e⁻/p⁺ glyphs) swapping edge slots on the beat | `.in-lockline` (new) `.in-s4 .in-f4 .in-orbit` (new) |
| 8 | 8.17–9.33 | f2978–3047 (49.63–50.80) | **flash #5** → S7: big outlined corner-word slams + white correction panels with **strikethrough-X draw** | NEW grammar: **misconception correction panel** — "current is used up ✗" with the strike draw (site already ships `mx-strike`), topic **INDUCTION** + eq **ε = −dΦ/dt** | `.in-correct` (new) `.in-s5 .in-f5` |
| 9 | 9.33–10.33 | f3270–3329 (54.50–55.50) | **black starburst badges** pop with scale overshoot (f3270, f3300) | NEW grammar: starburst badges **P = VI** and **q = ne** (site already ships `mx-badge`/`fbadge`) | `.in-burst` (new) |
| 10 | 10.33–11.05 | f3541–3610 (59.02–60.18) | **flash #6** → S8 bookend: the opening lock-up framing reused as closing motif (pose C) | bookend = callback lock-up + **Start CTA** pop, then the site-only **letterbox wipe** 11.05–11.50 hands over to the homepage | `.in-callback .in-start .in-bars` |

Picture 11.05 s + wipe 0.45 s = **TOTAL_MS 11500** (v5: 13450 + 450 = 14000).

**Cut from v5 to pay for the new grammar:** both diagonal speech panels
(4.35–9.9 s in v5 — their staged-lines grammar survives inside the bubble
columns), the navy feature-chip row (its info lives on the homepage now),
vcol stagger reduced to two columns, mascot pose swaps 6 → 4.
Net: v5's 14 s covered ~15.6 s of source (S5 only); v6 covers **49.4 s** of
source in 11.5 s — every section S5→S8 is represented, which is what makes the
compression read as "the whole chorus", not "one loop".

## 4. Why S6/S7 grammar is worth adding (not just more S5)

- **Locked line (S6):** one never-moving row under a swapping centre is the
  footage's own answer to "how do I cut 4:1 without losing the thread". Our
  version carries the two governing equations — content, not decoration. The
  site already ships the mechanism (`.mx-lockline`).
- **Correction + strike-X (S7):** the footage spends a whole section crossing
  things out; for a physics tutorial the honest equivalent is killing a
  misconception on the beat. `mx-strike` already exists.
- **Starburst badges (S7):** black star pops = the quiz's feedback-badge voice
  (`fbadge`), reused as equation stamps.
- **Orbiting sprites (S6 fairies):** two charge glyphs trading edge slots =
  free "this site is about charges" signalling between beats.

## 5. Implementation impact (when approved)

| surface | change |
|---|---|
| `js/intro.js` | `TOTAL_MS` 14000 → **11500**; nothing else — the clock-sync pause rule and `.lite` tiering keep working unchanged |
| `css/input.css` | re-grid every `--ti/--to` per the beat map; add `.in-lockline / .in-orbit / .in-correct / .in-burst` keyframes (**transform/opacity only — no new blur**, so `.lite` needs no new variants for them); update the reduced-motion poster set |
| gates re-point (§2 log, justification: master-clock change) | `intro-verify` auto-end window 13.6–16.6 s → **11.2–14.2 s** after load; `smoke-test` auto-end [13900,16300] → **[11400,13600]**; `capture-site-intro` loop cap 16 → 13; `capture-intro-video` 25 → 20 |
| docs | this file becomes the §4 timing map; v5 table moves to "retired" like v4 |
| unchanged | once-per-session, skip semantics, pointer-events contract, no-audio contract, `prefers-reduced-motion` poster, `.lite` low-tier cut, clock-sync pause |

## 6. Open questions (sign-off needed)

1. **Ship form:** (a) CSS-only recreation of this beat map (default — keeps zero
   shipped assets, reduced-motion and `.lite` intact); (b) embed the 11.5 s cut
   as a real `<video>` bed (~2–4 MB webm @720p + poster) with our topics as CSS
   overlay; (c) hybrid — video bed for the collage, CSS for every text/equation
   layer (best fidelity/weight tradeoff if you want the footage visible).
2. **Locked-line text:** both governing equations (proposed) vs the site tagline
   "learn it by playing with it".
3. **Starburst badge pair:** `P = VI` + `q = ne` (proposed) vs your pick.
4. Keep S9 end card out (wipe hands over — proposed) or hold it 0.5 s as a
   "Start" end-card?

## 7. Frame exports (this analysis)

- `frames/f1260.jpg … f4224.jpg` — **every frame from 21.0 s to the end** (2965), 320 px analysis JPEGs, named by absolute frame index
- `sheets/sheet_001…050.jpg` — contact sheets, 60 frames each: sheet N covers f(1260 + (N−1)·60) … f(1260 + N·60 − 1)
- `keys/f*.jpg` — 32 beat-onset frames at 960 px (flashes, slams, whips, panels, badges, bookend, end card)
- `preview-cut-11.5s.mp4` — the 10-segment compression proof (1080p60 + source audio for pacing)
- re-export from the authority MP4: `ffmpeg -i Video/シェリーライド.mp4 -map 0:v:0 -vf "select='gte(n\,1260)',scale=320:-2" -vsync vfr -start_number 1260 -q:v 4 frames/f%04d.jpg`

## 8. Song edit (2026-10-25) — "main melody, then the ending beat"

Measured from the extracted audio (44.1 kHz): 16th-note onset spacing ≈0.1505 s →
**beat ≈0.602 s (≈99.7 BPM), bar ≈2.408 s**; the section flashes sit on downbeats
(flash #3 ≈21.42 s, flash #6/bookend crash ≈59.02 s, end-card hit ≈68.52 s).

Edit (`.scratch/footage/song-edit-11.5s.{wav,mp3,m4a}`, exactly 11.50 s):

| part | source | length | why |
|---|---|---|---|
| main melody | 21.416 → 31.046 s | 9.63 s = **exactly 4 bars** of the chorus hook | ends on a bar line, so the jump reads as a drop, not a mistake |
| ending beat | 59.017 → 60.887 s | 1.87 s | the bookend crash — the same downbeat the visual finale (spin/tilt/wink) is cut from, so audio and picture land together; 0.45 s fade-out matches the overlay fade |

Splice hygiene: 8 ms fade-in at both joins, 12 ms fade at the melody tail,
450 ms fade-out at the end; peak −0.2 dBFS, RMS continuous across the seam
(verified numerically). `preview-cut-11.5s.mp4` carries this audio.

Re-render recipe:
```
ffmpeg -i Video/シェリーライド.mp4 -filter_complex \
 "[0:a]atrim=21.416:31.046,asetpts=PTS-STARTPTS,afade=t=in:d=0.008,afade=t=out:st=9.62:d=0.012[m]; \
  [0:a]atrim=59.017:60.887,asetpts=PTS-STARTPTS,afade=t=in:d=0.008,afade=t=out:st=1.42:d=0.45[e]; \
  [m][e]concat=n=2:v=0:a=1[a]" -map "[a]" song-edit.wav
```
Tweaking knobs: alternate ending beats — end-card hit 68.522 s (harder close) or
flash #5 downbeat 49.633 s; longer bed = 5 bars (12.04 s, over the 12 s cap only
if the ending beat adds on, so trim the ending to 0.9 s in that case).

Site integration note: the intro contract is currently **no audio**, and browser
autoplay policy blocks sound without a user gesture anyway. If the song edit
ever ships, it must sit behind an explicit sound-on control (e.g. a speaker
toggle on the intro), default muted — that is a contract change for BUG_AUDIT §2.
