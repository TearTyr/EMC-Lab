# Phase-8 asset plan (§6)

Audit method: rendered every page (desktop 1280×900 + mobile 390×844) from the
local server and inspected what each page actually needs to *explain* itself
(`.scratch/pages/*.png`). Existing approved artwork reused wherever it already
does the job (drawn mascot = identity anchor: brand marks, hero, intro, cheers;
og-card; favicon set). No decorative image was added anywhere.

| # | target | purpose | subject / composition | dims & ratio | kind | source | file | integration | alt / decorative |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `topics/current.html` header | explain ch1 in one glance | one circuit loop: battery bars left, glowing bulb right, lime current chevrons on top wire | 480×480 (1:1), displayed ≤232 px | educational diagram | generated flat-sticker art, text-free; `+`/`−` terminal symbols added as HTML overlays | `img/art-ch1.png` (42 KB, palette PNG) | `<figure class="ch-art" data-mx="rise">` cream sticker card, `mx-spin` frame, caption | informative alt (94 chars) |
| 2 | `topics/fields.html` header | explain ch2 | two round charges, five field lines fanning + → −, one midpoint arrowhead each | same | educational diagram | generated; **regenerated once** (first draft had a double-headed field line = wrong physics) | `img/art-ch2.png` (59 KB) | same | informative alt |
| 3 | `topics/magind.html` header | explain ch3 | bar magnet, four closed field loops (consistent circulation), compass disc | same | educational diagram | generated; **regenerated once** (first draft mixed loop arrow directions) | `img/art-ch3.png` (42 KB) | same | informative alt |

Rejected/unused: none shipped; wrong-physics drafts remain in `.scratch/` as
process evidence. No hero/OG/thumbnail assets were regenerated (existing ones
verified by asset-verify).

Rules honoured: text-free generation + deterministic HTML/SVG symbols (labels
are always exact); no generated art substitutes a control or sim (all sims
remain live canvases); explicit `width/height` (zero CLS); eager loading
(above-the-fold header); lazy policy policed by asset-verify for everything
below the fold; palette-quantised PNGs 42–59 KB; brand styling preserved
(cream/plum/pink/lime, thick outlines, flat fills — no gradients/shadows).

Verification: `npm run asset-verify` (8 checks × 6 page passes) PASS;
rendered frames `evidence/phase8/strips/SITE-chapter-art.jpg`; mobile pass
included (fields @390 px).
