# docs/spec — Source-of-truth documents

**Status: the two spec PDFs (course brief + lecture slides) were NOT provided.**
No PDF exists in the workspace, the repo, or anywhere in this sandbox
(`find / -name "*.pdf"` → nothing relevant). Per the operating rules ("If a tool is
missing … say so and use the closest honest substitute. Never fabricate results"),
the working source of truth is the requirement digest embedded in the task prompt:

- `brief-digest.md` — transcription of prompt §1.1 (R1–R11), §1.2 (lecture topics +
  check values + known lecture errors), §1.3 (chapter map, quiz 24 = 8/8/8).
- Precedence used everywhere: course brief → lecture slides → prompt → repo/deployment.
  Since the brief/slides themselves are unavailable, the digest stands in for all three
  document tiers; the repo/deployment never overrides it.

Prior practice in this repo agrees: `REDESIGN.md` §Sources records "the PDFs are not in
the workspace, so the brief's scope list is treated as the lecture's table of contents".

If the real PDFs are supplied later, diff them against `brief-digest.md` before trusting
any check value; everything derived (SCOPE_TRACE.md rows, quiz curation, sim targets)
cites the digest line, so re-verification is mechanical.
