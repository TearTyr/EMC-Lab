# EMC Lab — Electricity

Interactive tutorial website for **Calculus-based Physics 2** (Electricity group).
Plain HTML, CSS and JavaScript with Canvas simulations; no framework and no runtime dependencies.
The site makes no requests to other sites.

## What it covers

| Page | Contents | Source |
|---|---|---|
| Home | Navigation, formula reference, progress | Project brief |
| 1. Circuits & Ohm's Law (`topics/current.html`) | Current, voltage, resistance, power; **Ohm's law calculator** (change R and V, read I and P); **circuit builder** with battery, resistors and bulb; series and parallel | Project brief |
| 2. Electric Fields & Coulomb's Law (`topics/fields.html`) | Electric charge, Coulomb's law with superposition, electric field; four simulations (balloon, Coulomb arena, Bohr tuner, field painter) | Lecture PHYSICS2 LEC01 |
| Quiz (`quiz.html`) | 16 questions (8 per chapter), hints, worked explanations, Chart.js score charts, best score saved in the browser | Project brief |

**Scope.** The project brief lists only the Electricity group (circuit builder, Ohm's law calculator,
circuit quiz) and the lecture covers charge, Coulomb's law and the electric field. A magnetism and
induction chapter was built earlier but is in neither document, so it was removed.

All numbers on screen come from the equations. The Coulomb constant is k = 8.99×10⁹ N·m²/C²
(the lecture's value), so the readouts reproduce the lecture's worked answers: ±1 C at 1 km → 8,990 N;
5.69 N on the +3 µC line example; 22.7 N at 24° in 2-D; Bohr speed 2.19×10⁶ m/s; E = 75,595 N/C along +y.

## Run it

Serve the folder with any static server, for example `python3 -m http.server`, and open
`http://localhost:8000`. Progress is saved in the browser's local storage; no account is needed.

## Structure

- `js/registry.js` is the single list of chapters and simulations; navigation, counts and quiz
  categories are derived from it.
- `js/` has one file per simulation (`sim-*.js`, `toy-*.js`), the shared engines (`common.js`,
  `sandbox-core.js`), the quiz and the intro.
- `css/input.css` is compiled to `css/site.css` with Tailwind (`npm run build:css`).
  KaTeX and Chart.js are vendored in `vendor/`.
- `docs/spec/` has the project brief digest and the lecture PDF. `tools/` has the checks and the build.

## Checks

| Command | What it checks |
|---|---|
| `npm run check` | Links and ids, detail-toggle parity, scope and network purity, physics values |
| `npm run check:physics` | Lecture values, all quiz answers, force softening, banned wording |
| `npm test` | Full runtime test of both chapters, the simulations, the quiz and progress |
| `npm run test:browsers` | Core flows in Chrome, Firefox and Edge (needs those browsers installed) |

Other verification scripts (`a11y-verify`, `nav-verify`, `quiz-verify`, …) are in `tools/`.

## Browsers

The core flows pass in Chromium 141 (the Chrome engine). Firefox and Edge are in the same
`npm run test:browsers` script but have not been run yet: run it on a machine that has them and
record the result here before submitting.

## Deploy

Vercel runs `bun run build` and serves `public/`, where scripts and styles get content-hashed names.
Vercel deploys the production branch set in the project's Git settings, so push to that branch.

## Credits

Physics content follows the course lecture and standard calculus-based texts
(Halliday/Resnick/Walker, Serway, Young & Freedman).
