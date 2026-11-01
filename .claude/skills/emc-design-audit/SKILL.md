---
name: emc-design-audit
description: Audit an EMC Lab page or diff for palette, mascot, lettering and motion-rule violations. Use before a PR that touches styles, markup or animation, or when asked whether something "follows the theme".
---

# emc-design-audit

Rules live in `.claude/rules/design-system.md` and `.claude/rules/motion.md`. Read them first, then check the target (a page, or `git diff main...HEAD`).

## Palette
- `grep -nE '#[0-9a-fA-F]{3,8}\b'` over the changed CSS, HTML and JS. Every hit outside the `:root` token blocks must use a token or the shared palette object. Report each stray hex with the token it should become.
- Accent text and strokes use `--*-ink`, not the raw pastel (breaks light-theme contrast).
- Positive = pink, negative = sky, fields and forces = yellow. Butter is only the intro surface.

## Lettering
- No `text-shadow` stacks, slants or filters on brand, hero or intro text. One bold outline at most.

## Mascot
- At most one large mascot per viewport; phone hero at most 132 px; never over text or controls.
- Face matches meaning (happy = success, focus = working, sparkle = discovery).
- Decorative copies `alt=""`; the descriptive one matches the art.

## Motion
- Only `transform` and `opacity` animated. Reduced-motion path exists. No idle rAF. Cleanup present. Uses `[data-mx]` presets instead of a new system.

## Output
A short list: violation, file:line, the fix. Say what was checked and what was not (for example "light theme not rendered"). Finish by running `node tools/check.mjs` and, if colours changed, `node tools/verify.mjs theme`.
