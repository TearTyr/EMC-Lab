---
name: emc-verify
description: Pick and run the right EMC Lab checks and test suites for the change just made, and report results honestly. Use after editing code, before committing, and before opening a PR.
---

# emc-verify

1. List what changed: `git diff --name-only main...HEAD` plus `git status --short`.
2. Always run `node tools/check.mjs` first (about a second). Fix failures before running browsers.
3. Choose suites from the table in `.claude/rules/content-and-tests.md` ("Which suites cover what"). Run them in one command, for example `node tools/verify.mjs intro motion loader`.
   - Browser suites take minutes (`theme` ~4 min, `intro` ~1 min). Run long ones in the background and wait for the completion notice. Do not start a second copy.
   - Before a PR run the everyday set: `node tools/verify.mjs`.
   - After a CSS change run `npm run build:css` first and commit `css/site.css`.
   - After touching script names, the registry or the build: `bun run build`, then `node tools/verify.mjs prod`.
4. If a suite fails, read the `FAIL` line, decide whether your change caused it (rerun that suite alone: load-dependent failures pass alone), then fix the code or, if the assertion tests a source detail you intentionally changed, fix the assertion in the same change.
5. Report: which suites ran with pass counts, which failed and why, which were not run (release suites, Firefox, Edge, real devices). Never say "all green" if any were skipped.

Known baseline noise on this repo is recorded in the latest tooling PR description; compare against it before blaming a change.
