---
name: emc-add-sim
description: Add a new simulation or sandbox to EMC Lab end to end (script, registry entry, chapter panel, home card, Detail pairs, tests). Use when asked to add a simulation.
---

# emc-add-sim

Scope first: the course is electricity in two chapters. A simulation must belong to chapter 1 (circuits, Ohm's law) or chapter 2 (charge, Coulomb's law, electric field). If it does not, stop and ask. `check.mjs scope` rejects other topics.

1. **Script.** `js/sim-<name>.js` (canvas sandbox, built on `js/sandbox-core.js`) or `js/toy-<name>.js` (small toy). Copy the closest existing sim (`sim-ohm.js` for a calculator, `toy-bohr.js` for a tuner, `sim-arena.js` for a sandbox). It registers with the Stage helper in `js/common.js`, starts lazily through `whenNear`, and must clean up its listeners and rAF when the chapter unmounts.
2. **Colours.** Use the shared palette object, not literals. Positive pink, negative sky.
3. **Physics.** Compute from the equations with `EMC.CONST` (k = 8.99×10⁹). Readouts go through `EMC.unit()`. If the lecture has a check value, add it to `tools/suites/features.mjs` (`values`).
4. **Registry.** Add the id to the chapter's `sims` array in `js/registry.js` (pure JSON). Counts update everywhere from it.
5. **Page.** Add `<section id="<id>-panel">` to the chapter page with the canvas, controls, a keyboard path (focus canvas, arrow keys) and a live region. Add the script tag with `defer` in the same load order as its siblings.
6. **Detail.** Every explanation block gets a `tech`/`plain` pair (`node tools/check.mjs parity`).
7. **Home.** Add its card and link `topics/<chapter>.html#<id>-panel` (the sim scroller reads the registry list).
8. **Tests.** Extend `tools/suites/features.mjs` (`sims`): starts, responds to input, leaves no listeners or rAF after unmount. `responsive` and `a11y` cover layout and keyboard.
9. **Build.** `npm run build:css` if you added classes; `bun run build` then `node tools/verify.mjs prod` to confirm the hashed build still has every script.
10. Run `emc-verify`.
