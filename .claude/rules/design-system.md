# Design system

Dark charcoal is the default and the site's identity; light is opt-in (`html[data-theme="light"]`).
Colours are CSS custom properties in `css/input.css` (`:root` and `:root[data-theme="light"]`).
**CSS uses `var(--token)`, never a hex literal.** Canvas and script code cannot read CSS variables per frame;
it uses `EMC.PALETTE` (`js/common.js`). Page markup (inline SVG art, the self-contained boot styles) may use hex,
but only palette values. `node tools/check.mjs palette` fails anything else, so a new colour is added to the
token block (and `PALETTE` if scripts need it) first.

## Palette

| Token | Value | Use |
|---|---|---|
| `--bg` `--panel` `--panel-2` `--plate` | #17181c / #1b1d22 / #22242b / #101114 | Page, cards, raised cards, canvas and figure plates |
| `--line` `--edge` `--edge-strong` | #2e3138 / #3a3d45 / #4b4e57 | Borders; `--edge` is also the mascot's outline grey |
| `--text` `--text-dim` `--text-faint` | #edebe3 / #b9b7ae / #9a988e | Body, secondary, labels |
| `--ye` electric yellow | #e9ff47 | The one primary accent: main buttons, highlights, selection |
| `--amber`, `--hot` | #f6d36b / #e8507a | Field probes and test charges; the intro's coral sparks |
| `--ink`, `--on-ye`, `--on-pk`, `--on-sk`, `--on-mi` | #17181c, dark tints | Outlines and text on pastel fills. Fixed in both themes |
| `--on-plate`, `--on-plate-dim`, `--on-plate-faint` | #edebe3 / #b9b7ae / #9a988e | Text on the always-dark plates and figures |
| `--butter` (intro surface) | #fcefaa | Intro and loading background, mascot surface. Not for buttons |
| `--pk` pink / `--sk` sky / `--mi` mint / `--li` lilac | #f8aebe / #a8d3e0 / #b5d777 / #d5b8d8 | Candy pastels. Fills carry dark text |
| `--*-ink` | pastels in dark, darker inks in light | **Text and strokes** in an accent colour (keeps AA contrast in light theme) |
| `--*-t` / `--*-e` | 8% tint / 40% edge | Soft fills and borders per hue |

Meaning, kept consistent everywhere (UI, canvases, charts):
- Positive charge = pink, negative charge = sky, field probes, test charges and warnings = amber, correct = mint, wrong = the chart red. Electric yellow is for primary actions and highlights, not physics.
- Pink is also the secondary action colour (ghost buttons, the "Lab" in the brand).

Contrast: text must pass WCAG AA in both themes (`node tools/verify.mjs theme` checks it). Pastels are fills; use `--*-ink` for text.

## Lettering and type

- One family site-wide: G8321 (Thin 100 numerals, Regular 400 body, Bold 700 headings and UI), vendored in `vendor/fonts/`. The G8321 font has no `−`, `×`, `’`, `→`; use `-`, `x`, `'` in kinetic lettering or draw the shape.
- Brand and display text is **plain**: solid fill, at most one bold outline. No stacked shadows, no slant, no gradients or filters on text. Header: cream "EMC", pink "Lab". The hero copies it with a mascot-grey outline. Intro words are white with a dark outline.
- Banned site-wide (`check.mjs scope`): gradients, `backdrop-filter`, canvas `shadowBlur`, blur and drop-shadow filters.

## Mascot (Denki-chan)

- Source art: `img/mascot.png` (resting), `img/mascot-face-{sparkle,focus,happy}.png` (intro faces), `img/mascot-sparkle.png`. Do not redraw or recolour it.
- Faces mean something: happy = success or finished, focus = working or thinking, sparkle = discovery or a new thing.
- Size: header 28 to 34 px; hero at most 132 px on phones (width ≤ 640 px) and 240 px on desktop; at most one large mascot per viewport. Never covers text, controls or the nav.
- It reacts through the `emc:mascot` event (`{ kind: 'quiz', pct }`, `{ kind: 'chapter-done' }`) and the helper panel in `js/mascot.js`. It never blocks input.
- Decorative copies are `alt=""`. The meaningful one describes it as it looks: "Denki-chan, the EMC Lab mascot, a round cream creature with small ears".

## Components

Buttons: `.btn-primary` (yellow, main action, one per view), `.btn-ghost` (pink outline, secondary). Cards: `.card`, `.card-hover`, `.panel`. Chips: `.tag`, `.tag-*`. Keep touch targets at least 24 px (44 px for primary controls on phones). Focus rings use `--focus`.
