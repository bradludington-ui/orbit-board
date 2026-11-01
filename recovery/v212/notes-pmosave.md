# v2.12 -- tools/pmo-save.mjs failed now and then: the check, not the board

**Found:** 1 Nov 2026, running the browser checks `verify:grid` does not reach on the final tree (`d630240`). `npm run pmosave`
failed 6 of 7 runs on v2.12, in its two-tab sections (G and I's CONTROLs, J, K: "browser storage still holds Ann's save",
"the copy as published opens on her own work"), and had passed 3 of 3 on v2.11. Brad was told v2.12 was not ready to merge
until it was understood.

**Diagnosed** by an agent tracing every storage write on both boards, then reproduced by a second trying to refute it
(workflow `wf_048d42b2-dcc`; the scratch traces stayed in the session's scratch folder). Both agree.

## What it is

Every context in the check set its storage with an init script (`ctx.addInitScript(() => localStorage.setItem(...))`: in
`ctxOf`, and in G, H, I, J and K). An init script runs while a `file://` document is still being created, before any of the
page's own code. In Chromium 153 (Chrome for Testing 153.0.8010.12, Playwright 1.63) a storage access that early sometimes
binds the tab to a storage area of its own: the tab reads back its own writes, but nothing it writes reaches the other tabs, and
it never sees theirs. Sections G, I, J and K are the only ones that need two tabs to share one storage, so they are the only
ones that failed, and which checks failed followed which tab was cut off:

- K1 cut off: Ann's save never reached storage, so K2 read an empty storage ("storage changed").
- K3b cut off (the copy as published): it saw no saved work, opened its own published snapshot with no office, and Submit
  sent `pmo: null`. Her ATL file, opened in a tab that was not cut off, still opened on her work: the file is the record.
- J1 or J2 cut off: the work kept aside, or the plan written at opening, was not there for the next tab.
- G, I: the CONTROL read of "the browser's setting" in the first tab saw the old value.

In every case the board did what is right for the storage the browser gave it.

## The evidence

- **No board needed.** `recovery/v212/pmosave-repro-islands.mjs` opens six tiny `file://` tabs per context, 30 contexts, three
  ways: no init script, 0 contexts split; an init script reading storage at document start, 7 split (8 tabs on an area of
  their own); the same read on DOMContentLoaded, 0. The second agent's own test (storage events, a late tab): 0 / 5 / 0 of 25,
  and a page script at the top of `<head>`, as the board's theme code does, 0.
- **Not v2.12.** The unchanged check failed 4 of 6 runs on v2.11 (`bbb7ee9`) that day, and 3 of 5 on v2.12; the second agent
  measured 2 of 5 and 5 of 6. With the init script and every tab a board, 5 of 30 contexts split on v2.12 and 7 of 30 on v2.11;
  with none, 0 of 120 board tabs. The kinds of storage write (operation, key, calling functions) across G-K are the same 16 on
  both boards, and the board writes nothing to storage after opening (`baLiveAll`, `aceHealSay`, `fitModel`, `attLists` and
  the CLIN read write memory only). Earlier "v2.11 passes 3 of 3" was luck.
- **Every failure has a cut-off tab, in the place that explains it.** The unchanged check with one change -- each page, once
  open, writes a marker and lists the markers it can see -- over 19 runs on both boards: every failing run had a cut-off tab
  exactly where its failures say, and no check failed without one. Cut-off tabs in D, and in K3a, failed nothing: those checks
  never read another tab's storage.
- **A second, smaller race.** G and I read the first tab's setting straight after the second tab writes it; a write takes 3-37
  ms to reach another tab (an immediate read was stale 5 times in 300).
- **A person does not meet it in normal use.** A browser runs no injected script at document start; the board's first storage
  access is its theme code inside `<head>`, after 152 KB of CSS. Without an init script no tab was cut off, in 120 board tabs or
  180 small ones. A browser extension with file-URL access that runs a document_start script touching page storage could in
  principle set it off; the saved file stays the record either way.

## The fix (tools only; the board is unchanged)

`tools/pmo-save.mjs`:
1. `seedLs(ctx, set, rm, at)` sets a context's storage from a page of its own, once it has loaded, and closes it (H seeds
   through its own server's `/seed.html`). No init script in the file touches storage. Once is enough: nothing in these contexts
   changes `spmtTheme`, `prio27who`, `prio27pmo` or `prio27uiRail` but the sections' own choices, which they then read.
2. G and I wait for the other tab's write to arrive (`waitForFunction`, 2 s) before reading it; a write that never arrives still
   fails the read.
3. `openIn()` fails a tab that cannot see the name the seed page wrote, naming the harness ("what follows in this section proves
   nothing about the board") rather than the board.
4. The run stops before it opens a browser if an init script in the file touches storage (proved: one planted, it stops with
   "1 init script(s) … touch browser storage").

The other browser tools that set storage from an init script open one page per context, where a cut-off tab is harmless
(checked for pmo-years-render, layout-fits, editors-reachable and colour-check). **A browser check that opens two tabs in one
context seeds its storage the way pmo-save does.**

## Proved

The second agent's version of the fix: 20 of 20 runs on v2.12, 4 of 4 on v2.11, no cut-off tab in any context (12 of 19 runs of
the unchanged check had one); the same 76 checks with the same verdicts as a passing run of the old check. Against the boards
each section was written to fail on: `9bc5496` G fails 2, `ba3c294` I and J fail 4, `d3ce17d` K fails 5 -- as recorded in the
v2.09 notes. The fix as committed: see `## Runs` below.

## Runs
