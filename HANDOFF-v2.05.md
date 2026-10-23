# ORBIT — handoff for v2.05

Written 23 Oct 2026, the day after v2.04 merged. **Read `CLAUDE.md` first, then `NEXT-VERSION.md`.** This file adds three
things they don't have:

- what was missed or left unchecked in earlier versions;
- the decisions still waiting on Brad;
- what has to happen before the hosted build.

It changes nothing in the board. Nothing in it is approved for building: under the queue rule (CLAUDE.md, *How changes
ship*), each item goes into `NEXT-VERSION.md`, and nothing in the board file changes until Brad says **go**.

---

## 1. Where things stand

| | |
|---|---|
| Version | **v2.04 (22 Oct 2026)**: `BUILD` at `prioritization-board-grid.html:3050` |
| `main` | `28a79e5`, the merge of PR #20 |
| Board file | 34,226 lines, 4.0 MB |
| Open PRs | none for the board (this handoff's draft PR aside) |
| Last nightly validation | 23 Oct, 07:04 UTC, on `28a79e5`, 52 min. **Failed 1 stage, which is the carried limit only**: layout-fits D ×8 (the first requirement sits 323–420 px down at 1920/1440/1366/1024 wide). Every other stage passed: 13 defects guarded by 43 mutations; money coverage 26/26; money map **119 proven / 209 n/a / 1 open**; trace matrix, 89 cells, all links hold; audit suites clean (42.4 min); fuzz seed 347170259; file verifier self-test held. |
| Last data-loss fuzz | 23 Oct, 09:07 UTC, on `28a79e5`. 12 rounds × 6 trips, clean, seed 385630940; 53 containers, `pmoOrder` excused. |
| Mutation sweep | **Not run since v1.99** (see §4.1). |

What v2.04 shipped (NEXT-VERSION › Shipped › v2.04 has the detail):

- **108:** the CCaR records list names the record.
- **109:** an AI review carried by hand, file in and file out.
- **106, in part:** Clear this computer, and a Content-Security-Policy.
- **110, 111:** Confluence, SharePoint and the JSON endpoint removed.
- **112:** the five-year spend plan workbook rebuilt.
- **113:** a house style for every report workbook.

---

## 2. Decisions waiting on Brad

Each needs an answer before the item can be built. Each is listed with its item number so it can be logged as asked.

### 2.1 Raised by v2.04, never put to him

1. **"Allocated" on the five-year workbook (item 112).** The spec said *what was allocated*. The build prints the
   **lane draw (d+m)**, because that is what a lock stores and what every other surface calls Funded (CLAUDE.md, *The
   funds flow's plan year is the lane draw*). The two differ on any requirement allocated above what the lanes paid.
   Ask him: keep the lane draw and rename the column *Funded*, or add the allocation (`svcAlloc`) as its own column?
2. **Three places item 112 was built differently from what was logged.** None was raised with him.
   - An empty year prints `0.000`. The log said `–`. Note that the year a plan *doesn't hold* does print `—`.
   - The PMO tabs file a requirement under **its own office**. A prime whose CLINs belong to several offices is not
     split by CLIN share, as `pmoSharesOf` would split it.
   - Wide sheets are not set to fit one page wide when printed.
3. **The 🎯 Priority Drill shows `###` in some narrow columns** once the house style's number formats apply. This is
   style only: the figures are right. Ask whether to widen those columns.

### 2.2 Open items with choices nobody has picked

Each is logged in `NEXT-VERSION.md` › Open with its options. Brad decided none of them.

- **63:**
  - the cost-estimate shared-name race;
  - an estimate's earlier copies, beyond v1.99 item 96;
  - an office's month sitting within $1 of its exact share (the v1.95 F4 rounding).
- **71:**
  - the conformance run opens only one box at a time;
  - the side-list read–merge–write window;
  - the Windows launcher sidecar, which was never run.
- **82:**
  - the funds-flow export's scope;
  - per-appropriation execution;
  - an ACE estimate-only office;
  - the ACE breakout carries the allocation;
  - a kept cycle fixes its services;
  - journal entries from before a service change;
  - side-list unsaved state lasting one session;
  - v1.96 reprogramming rows;
  - `bmSeedFromPp`;
  - items 77–79 tested only in jsdom.
- **84:**
  - an older version reading v1.98's CLIN choices;
  - a kept cycle's CLIN pointers;
  - Classify grid RCN;
  - RCN-EEIC prime proration.

**Suggestion:** put these to him as one short list with a recommended answer each. Several are probably "no change; say
so in Help".

---

## 3. Missed or left stale in earlier versions

Each was found while writing this handoff and checked against the repo at `28a79e5`.

### 3.1 In the board file (needs a go)

| # | What | Where | Fix |
|---|---|---|---|
| M1 | **The Help guide still describes the old five-year workbook.** Item 112 replaced By Requirement / By PMO / By Service and the v1.85 PMO tabs with Summary + appropriation + service + PMO tabs, but the guide's section still says *"📊 Export the workbook adds a tab for each office after the three summary sheets …"*. | `<section data-id="t-fydp" data-t="The five-year plan by PMO">` in `<template id="helpDoc">` | Rewrite the section to describe the new tabs, the base year and the four after it, `$M`, the lane draw as Allocated (or Funded, per §2.1.1), and `—` for a year not held. Then run `npm run menus` to check every path it names. |
| M2 | **One open money-map cell:** `aiExport` × Fiscal year (v2.04 item 109). It was recorded as a follow-up, not proven. | `tools/money-map.json` / `money-map.md` | Either a recon check that the AI request's per-year figures equal the engine's for each held year, or an `n/a` with the reason (if the request carries the year on screen only). |
| M3 | **CLAUDE.md's file map is years out of date**: line numbers from v1.31 (a 19,483-line file; it is now 34,226). | CLAUDE.md › *File map*, *Hand-edit points* | Use the `// §NN` section banners instead (v2.00 added 42; the table of sections is at §01) and drop the line numbers. Docs only, so no go is needed (§3.2). |

### 3.2 Outside the board (docs and tools; no go needed, but show Brad the diff)

| # | What | Fix |
|---|---|---|
| D1 | **`README.md` is stale**: "~25,500 lines · 3.2 MB", the 📁 File menu, the two-build era. | Bring it to v2.04: one file, the left menu, no outside connections. |
| D2 | **`WORK-ASSIGNMENTS.md` still describes the v2.00 assignment.** | Mark it historical at the top, or replace it with the v2.05 assignment when there is one. |
| D3 | **The money-coverage census reads only single-quoted mutation ids.** `tools/money-coverage.mjs` matches `{ id: '…'`; **1,223 of the 2,119 ids in `mutate.mjs` are double-quoted** (875 `v200-*`, 89 `v202-*`, 56 `v199-*`, 34 `v197w4-*`, 28 `v197w1-*`, 28 `v198-*`, 28 `w3-*`, 30 `door-*`, and more). Its "26/26 covered" was reached without them, so it may be under-reporting coverage rather than over-reporting. A surface covered only by double-quoted ids would show as a gap. None does today, but nothing stops one. | Make the reader accept either quote, and test it on a planted double-quoted id. Then re-run `coverage:money` and `money-map`: the counts may change, and an `n/a` may become provable. CLAUDE.md's v2.04 note ("ids are single-quoted") then becomes a description of the past. **Do not rewrite the ids in `mutate.mjs`:** catcher records and older reports key on them. |
| D4 | **The browser checks the nightly never reaches.** `verify:grid` stops at `layout`, whose 8 D results are the carried limit, so **`keys`, `dropdowns`, `dialogs`, `leftmenu` and `standards` do not run at night.** v2.03 found two checks that had been failing unseen since v2.02 because of exactly this. | Either run those five before `layout` in `verify:grid`, or have `layout` exempt D by name (as the carried limit) and fail only on anything else. The first is smaller and needs no judgement in code. |
| D5 | **Heap on this container.** Run alone here, recon and import die out of heap at the ~2 GB default (`exit 134`); they need `NODE_OPTIONS=--max-old-space-size=8192`. The 23 Oct nightly's suites stage passed without it, so the nightly container evidently has more room, but `validate-math.mjs` sets no heap of its own. The fuzz routine set the flag by hand. | Set the heap for those two suites inside `validate-math.mjs` (and `audit:suites`), as `mutate.mjs` and `sweep-shards.mjs` already do, so a pass does not depend on which container ran it. |
| D6 | **A shallow clone fails 2 recon checks by design.** D5's S1 and SF2 build a board from `7ee498a` out of history, and they say so by name. The nightly unshallows first; a new session may not. | One line in CLAUDE.md's *Before every commit*: `git fetch --unshallow` before the suites. |
| D7 | **CLAUDE.md gate timings and counts have drifted.** The *nightly math validation* section still says "~130 min, two sweeps of 250 mutations", "12 banners", "both builds". The later version sections are right, but the summary at the top is not. | Rewrite those summary lines to match the one-build, text-only rules of 20 Oct. |

---

## 4. Test and gate debt

### 4.1 The mutation sweep has not run since v1.99

- **Last full sweep:** v1.99, 7 Oct, 1,139 targets, all caught.
- **Since then:**
  - v2.00 added ~880 targets and v2.01–v2.04 more. Today: **2,119 ids** (v2.04's text count).
  - Each was proven only one at a time, against its own check, by `mkmut.py`.
  - No set has ever been swept, and the pre-v2.00 targets have not been swept against the new tree.
- **What we don't know:**
  - whether a v2.00+ target is caught only because its own check ran;
  - whether a later change quietly made an old target equivalent. v1.95's `excel-unf-vec` is the precedent: a consumer
    moved away from a line, and only the sweep saw it.

**Brad's plan (20 Oct):** sweep the v2.00/v2.01 targets first, then do a full sweep before the hosted rebuild. It runs
only on his **named go** (CLAUDE.md, *The sweep runs on Brad's named go*). The tool is the sharded sweep
(`sweep-shards.mjs`): saved batches, a committed tree, nothing else running. Allow most of a day.

**Recommendation:** ask for the go on the v2.00–v2.04 subset now, while nothing is being built. Its results decide how
much of the security work in §5 rests on checks that actually bite.

### 4.2 Never checked in the real environment

The math is proven in jsdom and Chromium on Linux. None of the following has been tried, and all of it matters to the
people who brief from it:

- **Exports opened in the programs that read them:**
  - Excel, for every report workbook, the new house style (v2.04 item 113) and the five-year workbook's chart (item
    112). These were checked in LibreOffice and by an XML parser only.
  - PowerPoint, for the deck.
  - CCaR, for the Spend Plan Source.
  - IDS, for the batch import.
  - The comptroller's process, for the 1A9A.
- **Windows and Edge:**
  - Segoe UI is only stood in for (`tools/font-standin.mjs`).
  - The File System Access save, the IndexedDB handle cache and the Web Lock across tabs are untested on the machines
    that will run them.
  - The Content-Security-Policy (v2.04) is untested on Edge, including from a `file://` shared drive.
- **The shared folder on real SharePoint/OneDrive sync**, including the clash and history paths of v1.89 / v1.95 /
  v1.97 under a sync client that delays and renames files.
- **The Windows launcher sidecar** (item 71).

NEXT-VERSION.md lines 84–86 already say this. It is repeated here because it has been carried for many versions.
**Suggestion:** one session with Brad at a work machine, working through a written checklist, recorded as an item.

### 4.3 Reviews not done

- **No independent review of v2.04.** The Codex reviews of v1.95–v2.00 each found real defects; v2.04 removed three
  network transports, added a CSP, added a file-in/file-out AI path (`aiImport` through `inboundCheck`) and rebuilt an
  export. Worth one, scoped to data loss, the door, and the five-year workbook's figures against `fydpData`.
- **From v2.00, still not done:**
  - the G22 cross-track review of the exports;
  - U37's tests review, round 8 (stopped; its money review was clean);
  - UI-C1's acceptance, repeated on the integrated tree.

---

## 5. Security and the hosted build

**The requirements apply to the Azure build (item 107), not to this file.** The file runs offline, makes no request to
another host, and v2.04's CSP enforces that in the browser.

**Done:**

- **v2.00:** imported text is drawn as text, and imported names cannot reach the prototype (27 sinks plus the key
  sweep; `audit-inject.mjs`).
- **v1.88:** the import door.
- **v2.04:** no outside connections, the CSP, and Clear this computer.

**Item 106's remainder, logged under Later, not approved:**

- a SHA-256 of each saved file;
- a hash-chained change journal;
- CUI markings, with wording from the security team;
- static analysis in the gate.

**Item 107, the Azure web build:** draft 1 of the plan exists outside git. Nothing has been built.

**Item 100, DoD standards for Azure (IL5, Zero Trust):** pending the security team.

**Questions to put to the security team** (none answered yet):

1. Is GenAI.mil approved for this data, and at what level? The v2.04 AI review assumes a person carries files by hand.
2. What exact CUI marking wording, and where: the banner, each export's title row, file names, the deck?
3. The 15 deployment questions and the plan's 8 questions, which Brad holds.
4. Which IL5 controls are inherited from the hosting enclave, and which the application must meet itself?
5. Which Zero Trust target level applies?
6. The hosting date, which sets when the full sweep (§4.1) and the real-environment checks (§4.2) must be done.

---

## 6. What runs on its own

| Routine | When | What | Note |
|---|---|---|---|
| Nightly ORBIT math validation (no sweep) | 07:00 UTC | `npm run validate:nightly` on `main`; reports, never changes code | It "fails" every night on layout D ×8, the carried limit. Read past that line for anything new (§3.2 D4 would make a real failure stand out). |
| Data-loss fuzz | 09:00 UTC | `npm run fuzz -- --rounds 12` on `main` | Clean on 23 Oct. |
| Weekly Interface Review | Mondays 08:00 UTC | `npm run ia`, plus a market scan; advisory only | WebSearch works; WebFetch and curl are blocked by policy. |

---

## 7. Rules the next session must keep

All of these are in CLAUDE.md; they are collected here because each one has been broken at least once.

- **Never commit a populated board.** `pubState` stays `null` and `APPNS` stays empty; `npm run check` enforces it.
- **Nothing in the board changes until Brad says go.** Log the item in `NEXT-VERSION.md` first.
- **`mutate.mjs` is text only.**
  - Build mutants with `recovery/v200/bin/mkmut.py` and count targets with `mcount.py` (`python3 -I`).
  - Never `import` the file, and never run `npm run mutate` or `validate:math` without his named go.
  - Count every target after every merge: a change can leave an old target matching nothing.
- **Show only what changed**: a diff or the changed lines, never a whole file reprinted.
- **Bump `BUILD` on every functional change.**
- **Before a commit:**
  - `npm run check`;
  - the suites the change touches, with `NODE_OPTIONS=--max-old-space-size=8192` for recon and import;
  - `keys`, `dropdowns`, `dialogs`, `leftmenu` and `standards` by hand, until D4 is fixed.
- **A new export that writes a workbook** passes `xlsxHouse`, or is named in audit-other's item-113 exception list
  with its reason.
- **A new storage key** starts `prio27` or `spmt`, or Clear this computer misses it.
- **A new `let` that `syncBtns` reads** is declared beside `let MS`.
- **A new network source is an Azure feature, not a hole in the CSP.**
- **Before pushing to a PR, check that it has not merged.** A follow-up to merged work goes on a fresh branch from
  `main`.
- **Never run `playwright install`.** Chromium is found by `tools/chrome.mjs`.

---

## 8. A suggested order for v2.05

This is a proposal for Brad; nothing in it is approved.

1. **Docs and tools, no go needed:** D1–D7, plus M3's table. One commit each, each shown to Brad as a diff.
2. **Put §2 to Brad** as one list with recommendations. Log each answer as an item.
3. **Ask for the sweep go** on the v2.00–v2.04 subset (§4.1).
4. **On go, build:** M1 (the Help section), M2 (the open money-map cell), and whatever §2 decides for item 112.
5. **The real-environment session** with Brad (§4.2), recorded as an item.
6. **An independent review of v2.04** (§4.3), before or alongside step 4.
7. **Security-team answers (§5)** decide item 106's remainder and the start of 107.
