# EMC Lab sync pack v12 - curriculum re-scope: the five documented modules, optics skipped

The project brief lists six interactive modules — Measurements & Vectors, Fluids,
Temperature & Heat, Waves & Sound, Optics and Electricity — and the group's remit is
the electromagnetics-backed build. This pack re-scopes the site to match the brief
exactly, **skipping Optics** as agreed:

* **Four new topics** with full tutorials and simulations: `topics/vectors.html`
  (vector addition bench with draggable arrows), `topics/fluids.html` (Archimedes
  buoyancy tank + aerofoil/venturi Bernoulli visualiser), `topics/heat.html`
  (draggable thermometer + conduction/convection/radiation lab) and
  `topics/waves.html` (transverse/longitudinal wave bench + playable WebAudio tone
  player). Electricity keeps `topics/current.html`, renumbered as Topic 5.
* **Removed** the topics the brief does not list: charges & fields, magnetism and
  electromagnetic induction, together with their six simulations (`sim-coulomb`,
  `sim-efield`, `sim-magnetfield`, `sim-lorentz`, `sim-induction`, `sim-generator`)
  and the now-unused vendored `vendor/p5/` (LGPL) — the remaining vendored libs are
  KaTeX and Chart.js, both MIT, both still same-origin.
* **Quiz bank rebuilt**: 30 questions, exactly six per topic, written to the brief's
  quiz specs (units & vector operations; pressure/density/buoyancy; temperature
  conversions & specific heat; wave types & wave speed; simple circuits).
* **Everything downstream updated**: progress registry (five topics), hero (animated
  travelling wave), topic cards, simulation index, formula sheet, social card artwork
  (regenerated with `bun run og:card`), nav/footers/pagers, README, TESTING and
  PRESENTATION-NOTES.
* Verified: `check-links` 0 errors / 0 warnings over 8 pages, `smoke-test`
  **292/292** (new physics assertions for every new sim), `build-public` deployable
  (57 files, 7 pages, 204 refs verified).

Everything below this entry describes the *previous* packs and is kept as history.

---

# EMC Lab sync pack v11 - friend-audit sweep: all 16 findings closed, everything same-origin

This pack closes every item on the external review list (4 medium bugs, 8 low,
1 cosmetic, plus the content/consistency items), verified end to end:
`check-links` 0/0, `smoke-test` **278/278**, `perf-audit` all budgets met, and a
real headless-Chrome pass over all six pages with **zero console errors and
zero third-party network requests**.

## What changed, by audit item

 1. **Dead quiz key `E`.** `js/quiz.js` had `KEYS = ['A','B','C','D','E']` while
    every question has exactly four options. Now `['A','B','C','D']`; the smoke
    suite asserts the four-label bank, and the browser probe asserts no `E`
    chip ever renders.
 2. **Uneven topic coverage.** Added two magnetism questions (ids 26, 27) built
    from Topic 3's own material - the motor effect `F = BIL` (0.30 N) and the
    speed-independent cyclotron period `T = 2πm/(|q|B)`. Coverage is now
    charges 6 · current 7 · magnetism 7 · induction 7 = **27**, and every
    "25 questions" mention (hero, quiz head, stat strip, footer, docs) says 27.
 3. **Three Coulomb constants.** One rule now: everything PRINTED (prose,
    worked examples, quiz, the Coulomb bench substitution line) shows
    **8.988×10⁹**; `js/common.js` keeps the full-precision `8.987551787e9` for
    simulation maths and says so in a comment. The quiz Q1 stem + explanation
    and `sim-coulomb.js` were the last stragglers on 8.99.
 4. **theme-color ≠ background.** All six pages now advertise `#17181c`, the
    exact `--bg` the body paints, instead of the retired navy `#060b16`.
 5. **Lilita One ghost.** No shipped face by that name existed; the stale
    references are gone from `tools/add-font.mjs`, `js/common.js`,
    `vendor/fonts/manifest.json` and `.gitignore`. If a `lilita-one-400.woff2`
    file still sits in your checkout, `tools/cleanup-repo.ps1` now plans its
    removal (and matches `lilita*.woff2` strays).
 6. **CDN scripts without SRI - solved better: no CDN at all.** Chart.js 4.4.3
    (MIT) and p5.js 1.9.4 (LGPL-2.1) are vendored under `vendor/chart/` and
    `vendor/p5/` exactly like KaTeX, licences included, so the site makes zero
    third-party requests and there is no integrity hash to rot. `sim-generator`
    still lazy-injects, but from the local copy. New guards: per-page smoke
    assertion + `cleanup-repo.ps1` health check 8h fail if any `<script>` or
    `<link>` ever points at `http(s)://` again.
 7. **"Quiz this topic" never filtered.** Those buttons now link to
    `quiz.html?topic=<id>`; `quiz.js` reads the parameter at boot, applies the
    filter, toasts "Filtered to …", and keeps the address bar truthful with
    `history.replaceState` whenever you change filters by hand. Unknown values
    are ignored, so a hand-edited URL can't break anything.
 8. **Name mismatch.** Decided and documented: the product is **EMC Lab**
    (UI, `og:site_name`, package `emc-lab`); `emc-physics.vercel.app` is only
    the hosting slug and stays, because renaming a live domain would break
    every shared link. If you ever want the domains to match, add an alias in
    Vercel -> Settings -> Domains and update the six canonical/og:url tags
    (the smoke suite asserts they all agree, so a half-done rename fails tests).
 9. **Alpha mass.** Prose in Topic 3 now says "m ≈ 4m_p - 3.97m_p to be exact,
    6.645×10⁻²⁷ kg, because bound nucleons weigh slightly less than four free
    ones"; `sim-lorentz.js` keeps the exact mass and the "factor of about 2"
    answer still holds (1.986).
10. **Silent 70 % auto-tick.** The rule is unchanged (the dashboard promises
    it) but it is no longer silent: scoring ≥ 70 % prints a note on the score
    card explaining that all four topics were just ticked and how to un-tick,
    and the home dashboard wording now says the same in plain words.
11. **Device-local progress.** The dashboard panel subtitle says "Saved on this
    device only … use Export to move it to another one", a second note explains
    that nothing leaves the browser, and **Export / Import** buttons move the
    snapshot as a validated JSON file (`Progress.exportJSON/importJSON`,
    sanitised field by field; corrupt or foreign files are refused).
12. **No social/SEO tags.** Every page now carries `canonical`, `og:type/
    site_name/locale/title/description/url/image(+width/height/alt)` and
    `twitter:card/title/description/image`. The shared image is a committed
    `img/og-card.png` (1200×630) whose artwork source is `tools/og-card.html`,
    regenerable with `bun run og:card` (headless Chrome screenshot, real G8321).
13. **No `<noscript>` fallback.** All six pages ship a `.noscript-note` banner
    ("the sims, dashboard and quiz need JavaScript; the text still reads").
    It is parsed only when scripting is off, and print styles hide it too.
14. **Phantom `\!btn` / `\!card` in the compiled CSS.** Tailwind was extracting
    those out of `if (!card) return` in `js/quiz.js` (it scans that file for
    class names). The null checks are explicit now, the two names are added to
    the Tailwind `blocklist`, and the smoke suite fails if any escaped
    important class selector ever reappears in `css/site.css`.
15. **Favicon ≠ header mascot.** The favicon data-URI now carries the exact
    header artwork (stroked ears, `rx=16 ry=15` face, eye/cheek positions) and a
    smoke assertion compares the decoded favicon against the header SVG on
    every page, so they can never drift apart again.
16. **Print overflow.** The print block now contains wide maths and tables:
    `.formula`/`.katex-display` get `max-width:100%` + hidden overflow and a
    smaller KaTeX size, `.table-scroll` stops scrolling and `table.data` goes
    fixed-width with wrapping cells. Verified with Chrome print emulation: no
    element's right edge passes the page width.

**Deliberately left alone** (the reviewer's "not bugs" list agrees): dipole
flux / Faraday maths, Lorentz sign conventions, the localStorage→memory
fallback, the `dt` clamp when a tab is hidden, and alpha charge +2e.

Repo weight note: `vendor/chart/` (+206 KB), `vendor/p5/` (+1.0 MB) and
`img/og-card.png` (+280 KB) are committed on purpose; compressed transfer is
unchanged per page (quiz ~214 KB, induction ~437 KB) because those files were
already being downloaded - from someone else's server - before.

## 1. Extract
Copy this zip's contents over D:\VS\EMC-Physics (overwrite when asked).
Paths inside the zip mirror the repo root.

Git Bash one-liner, if the zip is sitting in your Downloads folder:

    cd /d/VS/EMC-Physics
    tar -xf ~/Downloads/emc-sync-v11-full-repo.zip --strip-components=1   # zip has one top-level folder; Explorer works too

## 2. Verify locally before shipping
    bun install --frozen-lockfile   # never a plain `bun install`: Bun >= 1.4 rewrites bun.lock to v2
    bun run build     # Tailwind -> css/site.css, then tools/build-public.mjs -> public/
    bun run check     # link/asset/id audit - expect 0 errors, 0 warnings
    bun run test      # headless smoke test - expect 278/278
    bun run perf      # per-page transfer budgets - expect all green

Optional, if you want the repo-hygiene report (also deletes the stale
lilita/mochiy/m-plus woff2 stragglers if any survive in your checkout):

    powershell.exe -NoProfile -ExecutionPolicy Bypass -File ./tools/cleanup-repo.ps1 -DryRun

Eye checks: quiz shows 27 questions and only A-D key chips; Topic 1's "Quiz
this topic" opens the quiz already filtered to Charges with `?topic=charges`
in the bar; the home progress panel shows Export / Import next to Reset.

## 3. Commit + push
    git add -A
    git commit -m "audit sweep: 27-question bank, vendored Chart.js+p5 (no CDN, no SRI debt), deep links, social meta, noscript, export/import progress, print + favicon + theme-color fixes"
    git push

If `git push` dies with GitHub's `remote: Internal Server Error` again (that was
a GitHub-side 500, not your repo):

  1. First check nothing lives only on the server:
         git fetch origin
         git log --oneline HEAD..origin/main
     If that prints commits, DO NOT force - merge or back them up first.
  2. If it is empty, a normal retry usually lands. Three retries, then force the
     same payload (safe only because step 1 was empty):
         git push
         git push
         git config http.version HTTP/1.1 && git push
         git push --force-with-lease
     (`--force-with-lease`, never bare `--force`: it refuses if the remote moved.)
  3. Still 500ing? Check githubstatus.com, wait ~10 min, retry; quote the Request
     ID from the error to GitHub support if it persists.

## 4. The Vercel build fix ("No Output Directory named public found")
Still fixed IN THE REPO - no dashboard wrestling:

  * vercel.json pins "outputDirectory": "public"; per Vercel's docs the file
    OVERRIDES the dashboard setting, so a stale dashboard value cannot fail builds.
  * buildCommand is "bun run build" = build:css (Tailwind) + build:public
    (tools/build-public.mjs assembles public/ - now 54 files incl. vendor/chart,
    vendor/p5 and img/ - and verifies every local link).
  * public/ is gitignored - a build artifact, never committed.

Vercel rebuilds on push: bun install -> bun run build -> serves public/. If no
deployment starts: Deployments -> latest -> "..." -> Redeploy with "Use existing
Build Cache" UNTICKED.

## 5. After the deploy
    # Git Bash
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File ./tools/cleanup-repo.ps1 -CheckLive
Expect: /api/health NOT 200; g8321-400.woff2, g8321-700.woff2, css/site.css,
vendor/chart/chart.umd.min.js, vendor/p5/p5.min.js, img/og-card.png and / all
200; and health check 8h reporting "no third-party <script>/<link>". Then:

    bun run check
    bun run test      # expect 278/278

Two live spot checks: paste the deployed URL into any social debugger (or just
view-source) - the og:image resolves to /img/og-card.png; and open the quiz with
`?topic=magnetism` to see the filter pre-applied.

Reminder: untracking the .ttf files does NOT remove them from git history.
If the repo is public, the paid Yuruka binary is still downloadable from old
commits until you rewrite history (`tools/cleanup-repo.ps1` prints the exact
`git filter-repo` recipe when it finds them).

## Pack history
  * v11 - friend-audit sweep: all 16 findings closed, libs vendored (no CDN/SRI), 278 assertions
  * v10 - white-line fix: .hr dividers get the dark hairline rule, 219 assertions
  * v9 - one site-wide content column (topic width = home width), 217 assertions
  * v8 - 70% scoring rule, 4.6 energy answer, dead anchor, stat-strip fit, honest browser claims
  * v7 - blog-style reading rhythm, clean student copy, dropdown nav
  * v6 - G8321 single-family type system + licensed-face loader
  * v5 - Tailwind @layer pipeline, vercel.json output pin, bun.lock v1
  * v4 - repo cleanup tooling (cleanup-repo.ps1, build-public.mjs)
