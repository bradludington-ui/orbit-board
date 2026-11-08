# ORBIT work assignments

Brad controls assignments and release scope. Read this file and AGENTS.md before starting. Share each assignment with both sessions: this file does not provide a live communication channel or locking mechanism. Update assignments only in an authorized interactive task; scheduled monitors never write here.

## Standing lanes

| Role | Default owner | Boundary |
|---|---|---|
| Release implementation and integration | Claude | Board edits only on Brad's go and approved release scope |
| Independent review | Codex | Read-only review of exact main and all relevant PR head SHAs |
| Assigned fixes or tests | Agent explicitly named by Brad | Exclusive editing window; outgoing editor must stop first |
| Release gate | One owner explicitly named by Brad | No duplicate long gates; retain pinned evidence |
| Windows and native export acceptance | Brad or designated human operator | Synthetic disposable files; record versions and tested SHA |
| Merge and publication | Brad-authorized operator | Review completion alone does not authorize either action |

## Current implementation assignment

- Task and approved scope: v2.14 -- the data-loss version, the first of three Brad approved on 3 Nov 2026 ("Let's push all of
  these", then "Three versions, data loss first"): item 140 (Save in one ORBIT file can write over another without asking),
  item 141 (a full import of a board larger than browser storage; Brad's Save writes into the file, so the file route is the
  main path), item 129's four findings (two-tab work recorded saved; the twin rule and the chain walk ignoring a copy's stamp;
  a rolled added requirement unseen by the same-work walk), item 124 (Put back by id; a hand-chosen "no SI code" in a copy is
  sent), and the ledger's U63, U64 (keep work aside when a folder copy replaces it; name where Save writes) and U35 (the
  registry box keeps typing across a redraw), as the handoff's decisions 11 and 13-15 recommend (Brad: "Accept all
  recommendations"). Next: v2.15 (items 137-139 and the small fixes), then v2.16 (item 133).
- Owner and outgoing owner's explicit stopped status: Claude (Claude Code session on ccr-26126337-csqb5v). v2.13's lead stopped
  at its merge (PR #32, bc5d2a2); the records after it merged as PR #33 (f95b2aa) and PR #31 (c863dc2).
- Allowed files and excluded scope: prioritization-board-grid.html, tools/**, NEXT-VERSION.md, CLAUDE.md, recovery/v214/**,
  this entry. Excluded: items 133 and 137-139 (later versions), items 100 and 107 (Brad: leave until hosting is chosen), E1
  (Brad: "Not needed this week").
- Isolated branch and base commit SHA: ccr-26126337-csqb5v, restarted from main c863dc2.
- Status: closed. Merged to main as PR #34 (8413a7b, a merge commit) on Brad's "Merge" of 8 Nov 2026.
- Required bounded checks and designated gate owner: npm run check; every suite whole; the browser checks (verify:grid, keys,
  dropdowns, dialogs, leftmenu, pmosave, pmoyears, pointer, standards, and the new checks this version adds); each new and
  retargeted mutation proved against its own check; mcount; review with skeptics; validate:nightly on the final tree. Gate
  owner Claude. The sweep's first batch (handoff decision 27, accepted) runs on a committed tree with nothing else running.
- Handoff commit SHA and changed files: dc8718d (the PR head; board as gated at 7c260e5). recovery/v214/HANDOFF.md is the
  handoff for v2.15.
- Commands, seeds, durations, exit statuses and results: NEXT-VERSION.md › Shipped › v2.14 (421 of 421 v2.14 mutations
  caught together; every suite whole; validate:nightly fails only layout's carried D x8, fuzz seed 344821819).
- Known risks, blocked checks and reviewer findings: Brad's Windows check was not reported before the merge; item 146 lists
  what was found and not built. The sweep was not run.
- Brad's integration/merge/publication authorization, if given: "Merge", 8 Nov 2026. Each version merges on Brad's word.

The four recurring monitors retain read-only scope.

## Assignment template

- Task and approved scope:
- Owner and outgoing owner's explicit stopped status:
- Allowed files and excluded scope:
- Isolated branch and base commit SHA:
- Status: assigned / editing / ready for review / returned for fixes / accepted / closed
- Required bounded checks and designated gate owner:
- Handoff commit SHA and changed files:
- Commands, seeds, durations, exit statuses and results:
- Known risks, blocked checks and reviewer findings:
- Brad's integration/merge/publication authorization, if given:

## Message to paste into both sessions

> Read AGENTS.md, CLAUDE.md and WORK-ASSIGNMENTS.md. Work only on Brad's explicitly assigned scope in an isolated branch. One editing agent at a time, including tests. Do not assume another session has stopped. Hand off an exact commit SHA, changes, actual validation results and unresolved risks. If ownership is unclear, continue read-only work and ask Brad before edits. Recurring monitors remain read-only.
