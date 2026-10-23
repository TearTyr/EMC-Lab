# docs/spec — Source-of-truth documents

**Status: the LECTURE PDF arrived on 2026-10-23 and is committed here**
(`PHYSICS2 LEC01 Electrostatic.pdf`, 24 slides, First Asia Institute of Technology
and Humanities — "Electric Forces and Electric Field"). The COURSE BRIEF PDF is
still missing; for the brief's rows (R1–R11) the prompt digest remains the
substitute source of truth.

The lecture PDF was verified slide-by-slide against `brief-digest.md` BEFORE any
further site change (see the verification log at the end of `brief-digest.md`,
rendered figure slides in `slides/`). Outcome: every digest value and both
"known lecture errors" confirmed; ONE site deviation found and fixed as
BUG_AUDIT DATA-04 (the slide-21 worked example had quoted a ×10³-rescaled field
strength; the lecture's real numbers are E = 2.0 N/C → 3.6×10⁻⁷ N / 4.8×10⁻⁷ N).

Original status note, kept for history: the two spec PDFs were NOT provided at
audit start. Per the operating rules ("If a tool is missing … say so and use the
closest honest substitute. Never fabricate results"), the working source of
truth was the requirement digest embedded in the task prompt:

- `brief-digest.md` — transcription of prompt §1.1 (R1–R11), §1.2 (lecture topics +
  check values + known lecture errors), §1.3 (chapter map, quiz 24 = 8/8/8).
- Precedence used everywhere: course brief → lecture slides → prompt → repo/deployment.
  Since the brief/slides themselves are unavailable, the digest stands in for all three
  document tiers; the repo/deployment never overrides it.

Prior practice in this repo agrees: `REDESIGN.md` §Sources records "the PDFs are not in
the workspace, so the brief's scope list is treated as the lecture's table of contents".

If the brief PDF is supplied later, diff it against `brief-digest.md` before trusting
any R-row; everything derived (SCOPE_TRACE.md rows, quiz curation, sim targets)
cites the digest line, so re-verification is mechanical.
