# EMC Lab

Interactive electricity tutorial for Calculus-based Physics 2. Plain HTML, CSS and JavaScript with
Canvas simulations. No framework, no runtime dependencies, no requests to other sites.
`README.md` has the full overview; this file is what you need to work in the repo safely.

## Commands

| Command | Use |
|---|---|
| `node tools/check.mjs` | Static checks (~1 s): links, Detail parity, scope and network purity, physics values |
| `node tools/verify.mjs` | Everyday runtime suites (jsdom + Chromium) |
| `node tools/verify.mjs intro ui` | Only these suites or groups. `--list` shows all, `--all` adds slow ones, `--browser firefox\|edge` switches engine |
| `node tools/verify.mjs live landing --url <base>` | Read-only checks of a deployed site (production or a preview) instead of the local server; only suites marked remote run. Screenshots go to `.scratch/live/`. A protected Vercel preview redirects to a login and fails with that reason |
| `npm run build:css` | Compile `css/input.css` to `css/site.css`. **Run after any CSS or Tailwind-scanned HTML change and commit `site.css`** |
| `bun run build` | CSS + `tools/build.mjs`, which assembles `public/` (hashed names) for Vercel. `public/` is generated, never commit it |

Browser suites need Playwright's Chromium (`npx playwright install chromium`) and start their own
server. Serve manually with `python3 -m http.server` if you need to look at the site.

## File map

- `index.html`, `quiz.html`, `topics/current.html` (chapter 1), `topics/fields.html` (chapter 2). `topics/charge|coulomb|field.html` are redirect stubs.
- `js/registry.js` is the single list of chapters and simulations (pure JSON; the build parses it). Counts, nav and quiz categories derive from it.
- `js/common.js` boots everything: the `EMC` API, loader, progress storage, theme, Detail mode. `js/shell.js` switches chapters on the home page.
- `js/intro.js` (intro engine), `js/landing.js` (mascot drop and hero reveal), `js/motion.js` (title cards, `[data-mx]` reveals), `js/kinetic.js` (lettering font loader), `js/mascot.js` (helper panel), `js/home.js` (home demos and dashboard).
- Simulations: `js/sim-*.js`, `js/toy-*.js`, shared engine `js/sandbox-core.js`. Quiz: `js/quiz.js`, `js/quiz-data.js`.
- `css/input.css` is the only hand-written stylesheet. `css/site.css` is its minified build.
- `tools/` has the checks, the build and `tools/suites/` (the runtime suites). `docs/spec/` is the brief and lecture. `docs/reference/animation-reference.md` documents the motion system.
- `test/` and `.scratch/` are local-only and git-ignored.

## Hard contracts (tests enforce these)

- Two chapters only (Circuits & Ohm's Law, Electric Fields & Coulomb's Law), six simulations, sixteen quiz questions. Other physics topics are out of scope (`check.mjs scope` fails on them).
- No request to any other origin. Fonts, KaTeX and Chart.js are vendored in `vendor/`.
- Every number on screen is computed from the equations, with k = 8.99×10⁹ N·m²/C² (the lecture's value). Chapter, simulation and question counts come from the registry and the quiz bank, never typed by hand.
- Every `data-detail="tech"` block has a `data-detail="plain"` sibling that says something different (`check-detail-parity`).
- The intro plays on every bare home load, stores nothing, and only Skip, Start or Escape end it.
- Progress lives in local storage only. No login, no backend.
- Required to work in Chrome, Firefox and Edge. Chromium is what runs here; say so when Firefox or Edge were not run.

## Working rules

- Match the surrounding code: comment density, naming, idiom. Files here are CRLF on Windows checkouts (`core.autocrlf`); the Edit tool can fail on multi-line matches, so use a small script when it does.
- New class names used only in JS must be listed in `tailwind.config.js` `content`, or hand-written in `input.css`.
- One branch and one PR per phase of a plan. Stacked PRs target the previous branch. Commit messages end with the Co-Authored-By line from the session.
- Report test results as they are. Say which suites were not run.

Detailed rules: `.claude/rules/design-system.md`, `.claude/rules/motion.md`, `.claude/rules/content-and-tests.md`.
Skills: `emc-verify`, `emc-mobile-check`, `emc-design-audit`, `emc-add-sim` in `.claude/skills/`.

## Always-on skills

At the start of every session, and for every task, invoke the `caveman` skill and the `ponytail` skill (Skill tool) before doing anything else, and keep both on until the user says "stop caveman" or "normal mode".

- `caveman`: terse replies, answer first, every technical fact kept.
- `ponytail`: the smallest change that fully solves the task; no extra abstractions or scope.

The hard contracts above still win over both: terse and small never means skipping a test, a parity pair or a reduced-motion path.
