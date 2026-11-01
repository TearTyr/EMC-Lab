# Content and tests

## Content

- **Detail switch.** Anything that explains has two versions: `data-detail="tech"` (equations and units) and `data-detail="plain"` (everyday language). They are direct siblings, the plain one is not a copy, and it has at least 24 characters. A JS-filled readout pairs `id="x"` with `id="x-plain"`. Run `node tools/check.mjs parity`. Every new section on a page that explains things needs a pair, so flipping the switch visibly changes it.
- **Derived numbers.** Counts of chapters, simulations and questions come from `js/registry.js` and `js/quiz-data.js` through `js/home.js`. The HTML ships current values only as no-JS fallbacks.
- **Physics.** k = 8.99×10⁹, e = 1.602×10⁻¹⁹ C. The lecture values the UI must reproduce are in `docs/spec/brief-digest.md` (8,990 N; 5.69 N; 22.7 N at 24°; 2.19×10⁶ m/s; 75,595 N/C). Known lecture errors are corrected on the site; keep the correction notes.
- **Wording.** "Centripetal", never "centrifugal", for the Bohr force.
- **Links.** Every local `href`/`src` must resolve (`check.mjs links`). Simulation deep links use the existing `#…-panel` ids.

## Which suite covers what

| Change | Run |
|---|---|
| Anything | `node tools/check.mjs` |
| `js/intro.js`, intro CSS, `landing.js`, head gate | `verify intro motion loader` |
| Colours, tokens, themes | `check.mjs palette`, then `verify theme ui responsive` |
| Nav, shell, routes, registry | `verify nav shell smoke` |
| A simulation or sandbox | `verify sims interact values` |
| Quiz | `verify quiz values` |
| Layout, new section, new page | `verify responsive a11y assets` |
| Build, deploy, script names | `bun run build` then `verify prod` |

`smoke` and `shell` need no browser. Before opening a PR run `verify` (the everyday set) and say which suites did not pass or were not run.

## Gotchas

- `tools/suites/*.mjs` assertions are source-level in places (regexes over the HTML and JS). When a change renames a file or restructures markup they test, update the assertion in the same PR.
- Windows checkouts are CRLF. Write regexes with `\r?\n`.
- The intro plays on the bare home page, so browser suites that are not about it call `skipIntroOnLoad` from `tools/lib/harness.mjs`.
