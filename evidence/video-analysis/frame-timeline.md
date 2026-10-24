# Frame timeline — complete video (verified this session)

t = pts seconds (≈ frame/60 + 0.016). Sources: 4 fps sheet pass W01–W12 (every
frame slot inspected), 60 fps strips S00/S05/S06/S07/S13 re-read this session,
segment first/mid/last visual checks, PIL numeric audits. Cross-checked
against `evidence/phase8/reference-timeline.md` (frame-accurate numeric pass);
discrepancies noted.

## 0.000–2.616 overture
- f0–14 (0.000–0.233): flat yellow, empty. Static.
- f15 (0.25) tri#1 pop; f30 (0.50) tri#2; f60 (1.00) dot#1; f75 (1.25) dot#2;
  f90 (1.50) crescent + "3"; f105 (1.75) "v"; f120 (2.00) "6/σ"; f135 (2.25)
  micro-glyphs. All discrete (no tween), light-blue on yellow. (W01)
- f156–157 (2.616–2.633): pure white ×2. f158–163: staggered dissolve-out
  (~90 ms): title glyphs → mascot → strip land in bursts. (S00)

## 2.616–12.116 title lockup
- f198 (3.30) lockup settled; static hold of composition.
- micro swaps pose A: f230, 263, 281, 299, 317, 410 (3.849…6.849). (W01/W02)
- f440–447 (7.349–7.466): whip-squash sliver (visible at W02 f29 = 7.25 slot).
- f448 (7.483) pose B lands; micro swaps f460, 550, 640, 661, 678. (W02)

## 12.116–18.916 skit
- f726–727 white ×2; f728–740 decay 255→214. (S05)
- f729+: lines 1+2 present; inset enters spinning (edge f733→face f740→edge
  f760; period ≈2 s, continuous to f1133). (W03, S05)
- f≈840 (14.0) red "VS" pop; f≈870 (14.5) line pair 2 + inset 2; f≈960 (16.0)
  line 3 replaces top pair ("ちょっと後者に行ってくる"). (W03)

## 18.916–21.449 insert (different world)
- f1134 (18.916): HARD CUT, zero white. Black field + 3D face + chibi pair +
  caption. (S06, W04)
- f1140→f1160 chibi pose swaps; f≈1200 (20.0) banner + thumbs-up chibi +
  outlined caption slams (~0.3 s apart); f1260 (21.0) stamp glyph. (W04)
- f1284–1287 (21.40–21.45): RAMPED flash (63→102→147→204→255; S07 shows ~85 %
  at f1286, full white f1288 at strip sampling) + ~300 ms decay.

## 21.449–40.216 chorus A
- f1290+: collage present at decay; name chip / OVERDRIVE chip / wedges.
- lyric slams per beat: 限界まで f≈1320, 足掻いた f≈1420, 人 f≈1470, は f≈1530,
  生 f≈1540…; whips f1410–1440, f≈1510. (W04/W05)
- vertical bubble columns f≈1440 (想像/よりも/狂っ) & f≈1500 (ているらい),
  word-by-word slams. (W05)
- diagonal speech-bubble panel 1 f1560–1740: chip then lines 綺麗な→生命の→
  閨闘で staggered 0.3 s; panel 2 f≈2040?? — correction: panel 2 (少々/ここまで)
  enters f≈112 slot (28.0 s); both exit f≈118 (29.5 s). (W05)
- title callback + arrow slash f≈1800 (30.0, W06 f120–123: arrow drawn over
  lockup in 0.5 s); corner boxes し/た/い/所 f≈1860; だけ f126; 現/実/は f130–131.
- arc text 上手くはいか f2010–2100 → ないようで f138–139 (34.5–34.75). (W06)
- navy chips 吐いた f142 (35.5), エラー f145, ずら f146; exit whip f147. (W06/W07)

## 40.216–49.633 chorus B
- f2413–2414 white ×2 + ~200 ms decay (flash #4; seg3 frame 0 = this decay).
- locked bottom lyric かっこいいシェリーソロ / Cool Sherry Solo f2420→f2978
  (~9.3 s, never moves); centre pose swaps f≈168,170,174,178… on grid;
  orbiting chibi fairies swap edge positions ~1 s (W07 f165–167, W08 all).
- corner words resume f198 (タガ) just before flash #5.

## 49.633–59.016 chorus C
- f2978–2979 white ×2 + ~300 ms decay (flash #5; seg3 mid frame = this).
- correction panels w/ strikethrough-X: panel 1 f≈199–203 (極限/書いた area),
  panel 2 (コード) f≈203; X draw visible f200–207. (W09)
- corner words ばっ f208, か f210, 持て f211, は f212, や/す f213; big
  ユーザー/よ slams f213–216. (W09/W10)
- starburst badges: 吐いた f≈218 (54.5), 言葉の f≈220; white diamonds 裏/裏なんて
  f222–227 (exit blur f226–227). (W10)
- bottom-line slams 由もないだろう f228–233; whip smear f≈231 (57.75). (W10)

## 59.016–68.516 bookend
- f3541–3542 white ×2 + ~150 ms decay (flash #6, S13).
- f3544+: yellow lockup field, pose C, strip — composition identical to §2
  (callback). Micro swaps f≈3900/3960/4020 + W11 f244/248/252. (W11)

## 68.516–70.433 end card
- f4110 (68.516): HARD CUT, zero white. Yellow + single small bordered still
  (thumbs-up, red bg). Static to f4224 (70.416, last decoded frame).
- **No black tail** (prior timeline corrected; W12 f274–281 + direct decode).

## Flash grammar (re-confirmed)
Section-boundary flashes = pure white exactly 2 frames (33 ms) + exponential
luminance decay 150–300 ms into the new scene. Exception: flash #3 ramps in
over 4 frames (entering busiest section). Hard cuts (zero white) reserved for
"different world" boundaries: 18.916 and 68.516.
