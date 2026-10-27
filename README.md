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

`npm run ui-verify` covers the chapter dropdown, active-chapter highlight, Details toggle and the
mascot helper. Other verification scripts (`a11y-verify`, `nav-verify`, `quiz-verify`, …) are in `tools/`.

### Quiz difficulty

The quiz keeps one 16-question bank (8 per chapter); modes only change what is in play.
**Easy** is the 8 questions tagged `easy` (4 per chapter) in lecture order, with hints and
instant marking. **Intermediate** (the default, and how the quiz always behaved) is all 16 with
hints and your own marking/timer choice. **Hard** is all 16 shuffled, with no hints, exam marking
and a locked 15-minute countdown that starts on the first answer and grades itself at 0:00.
Each question's `difficulty` lives in `js/quiz-data.js`. Saved best score and attempts are one
shared record across modes (a perfect Easy run counts toward the same best), and difficulty
cannot be changed mid-attempt. `npm run quiz-verify` covers the modes, submit, retake and timer.

### Mascot helper

The mascot in the top bar is its own button (`js/mascot.js`), separate from the home link. It opens
a small non-modal panel with a tip for the current page and shortcuts to the existing tools
(Esc, an outside click or tabbing away closes it). Other scripts make it react by dispatching
`emc:mascot` (`{ kind: 'quiz', pct }` or `{ kind: 'chapter-done' }`); it shows a short status
bubble and never blocks input. New class names used only in `mascot.js` must stay listed in
`tailwind.config.js` `content`, or Tailwind drops their styles.

### Landing intro

The intro (`js/intro.js`) plays on every full load or refresh of the bare landing page
(`/` or `index.html`). Nothing is stored to remember it, so repeat visits see it again.
It never runs on chapter routes (`#/ch1`, `#/ch2`) or other pages. While it plays the rest of
the page is inert; only the **Skip intro** button, the **Start** button (from ~10.3 s) or
**Escape** end it early. `npm run intro-verify` tests this contract. Other browser scripts
call `skipIntroOnLoad` from `tools/intro-bypass.mjs` to get past it.

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
