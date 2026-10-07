# SECURITY-REVIEW.md — ORBIT v1.99

The reviewer's guide to ORBIT, for a security reviewer who has never seen it. It says what the program is,
how to prove you hold the file under review, how to read the code, where data comes in and goes out, what
stays on the computer, how HTML is written, what the tests prove, and a threat model.

It holds no findings. Which places are exploitable, how severe they are and how to reproduce them are in a
private annex held by the owner (section 11).

**Line numbers** are the board `prioritization-board-grid.html` at commit `6de4432`, BUILD
`v1.99 (6 Oct 2026)`. Any later build moves them. Function spans were read from the code with
`tools/review/lib.mjs`; the section map and the trust-boundary list come from six independent readers of the
whole file, checked against the code at that commit.

---

## 1. What ORBIT is and how it runs today

ORBIT (Out-year Requirements & Budget Integration Tool, formerly SPMT) is a planning board for a
sustainment budget. People rank requirements, place funding by service and year, reconcile against
execution data, and export the workbooks and slides that review boards ask for. One board holds four
appropriations: O&M, Full Fund, Initial Spares and OPN.

**It is one HTML file.** `prioritization-board-grid.html`: 31,333 lines, 3,719,071 bytes. There is no
build step, no server and no dependency. The HTML is the source and is edited by hand (`README.md`, "The
HTML is the source"). Nothing is loaded from anywhere: no external script, stylesheet, font or image. The
favicon is a `data:` URI (line 6). `npm run check` fails if anything external is referenced. The file sets
no Content-Security-Policy.

**How it runs today.** The team opens the file in Microsoft Edge from SharePoint or OneDrive. The code
expects a page opened from a synced folder or a shared drive, with a `file://` address: it turns that address
into a Windows path to help people find the data folder (`driveWinPath`, 12485-12495). Work between saves is
kept in the browser's storage.

> **The deployment model is under review.** The owner's security team asked whether ORBIT stays a file
> opened in Edge, or becomes a web application hosted in the Azure IL5 environment. This guide describes
> today's model only. Sections 5, 6 and 9 change most if it is hosted.

**What is in the file.**

| Lines | Part |
|---|---|
| 1-6 | Head: charset, title, inline SVG favicon |
| 7-1279 | One `<style>`: two CSS layers. No `url()`, `@import` or `expression()` |
| 1280-1306 | The theme script, run before the body paints |
| 1308-1964 | Body markup: header, menus, dialog shells, the grid. Seven hidden file inputs at 1383-1389 and one at 1474. The in-file help is a `<template>` at 1533-1714 |
| 1967 | `<script type="application/json" id="pubState">`: the saved board data (`null` in a release) |
| 1970 | `<script type="application/json" id="pubMode">`: the PMO-copy mode (`null` in a release) |
| 1971-31331 | The main script, about 1,700 named functions. Line 24627 alone is the PowerPoint template (1.6 MB) |

**How it saves: by rewriting its own source.**

1. Line 1972, the first statement of the main script, records the page's own text once, while it loads:
   `const SRC0 = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;`
2. `savedHtmlOf` (6943-6947) builds every board file the page writes: `SRC0` with the body of the
   `pubState` island replaced by the board's data as JSON. `<` is written as `\u003c`, so the data cannot
   close the script element. Save, the PMO copy, the work kept aside and the board as it was before a failed
   import all go through it.
3. 💾 Save (`saveInPlace` 8189, `_saveInPlaceFileRun` 8209-8304) uses the File System Access API. The first
   time it asks for the file (`showSaveFilePicker`, 8225) and keeps the handle in IndexedDB. Each time it
   reads the file back first, refuses to write over a file it cannot read, checks who wrote it last, then
   writes (`createWritable`, 8278). In a browser without the API it downloads a copy instead (8212-8216).
4. Between saves, each appropriation's whole store sits in `localStorage` (`persist`, 6418-6432).

So **a saved board is the program and the budget data in one file**, and the program it carries is the one
that saved it. Section 2 says how to check which program that is.

**Ways to share work, all optional.** A shared folder the user picks (File System Access API, no HTTP from
the page). A "live view" that can publish to and read from Confluence, SharePoint or a JSON endpoint: off by
default (section 5). Files sent by hand: a PMO copy, a submittal, an appropriation package.

**Words used below.**

| Word | Meaning |
|---|---|
| store, `MS` | One appropriation's whole working state: every fiscal year, the journal, snapshots, positions |
| year state, `S` | One fiscal year's plan inside `MS` |
| side stores | Board-wide lists kept beside the stores: execution rows `EXDB`, cost estimates `ACEDB`, the BAE budget list `BUDDB`, the reprogramming log `RPDB`, locked PPBE cycles `CYCDB`, destinations `DESTDB` |
| `PUB`, `PUBS` | The data read from this file's `pubState` island; `PUBS` holds every appropriation's slot |
| PMO copy | A copy of the board for one office (`pubMode` set, `SANDBOX` true). The office edits it and sends back a submittal |
| submittal | A JSON file an office sends back from its PMO copy (`pmoSubmit`, 7292) |
| package | A JSON file carrying one appropriation between boards (`pkgIssue`, 8594) |
| journal | The change log inside the store (6433-6662), with "Put back" |
| the door | The import check, `inboundCheck` and the functions it calls (9271-9490), section 4 |

---

## 2. How to verify you are reviewing the right file

| | |
|---|---|
| File | `prioritization-board-grid.html` at commit `6de4432b83e7631022c5e04e2c325badba3d0bcc` |
| BUILD stamp (line 2563) | `v1.99 (6 Oct 2026)` |
| git blob (`git hash-object`) | `b160bc031c7f70a4492f64394893d9b74bb0f327` |
| SHA-256 of the file | `e3a8fe5f0a09fb30aa391b6570d834859ac0336a36430fa03dd87938922cd3bf` |
| Code fingerprint (scheme `orbit-code-v1`) | `e6a260ea42ed69376b1c248e7b69baf39f67891a9ddf6dcb8b7166b671ce6bff` |

**Two hashes, two questions.**

- The **SHA-256** answers "is this exactly that file?". Use it for the blank release.
- The **code fingerprint** answers "which release's program is inside this file?". A saved board's SHA-256
  changes on every save, because the data changes. The code fingerprint leaves the data out, so every save
  of one release gives the same value.

**On Windows, with nothing installed.** In PowerShell:

```
Get-FileHash -Algorithm SHA256 .\prioritization-board-grid.html
```

PowerShell prints the hash in capitals. It is the same number as the SHA-256 above:
`E3A8FE5F0A09FB30AA391B6570D834859AC0336A36430FA03DD87938922CD3BF`.

**With Node (no packages needed).** The review tools in `tools/review/` use Node built-ins only.

```
node tools/review/fingerprint.mjs [board.html ...] [--json] [--canon <file>]
node tools/review/which-build.mjs [board.html] [--builds <builds.json>] [--json]
```

- `fingerprint.mjs` prints the file's SHA-256, its git blob id, the code fingerprint and the script
  fingerprint (the executable scripts alone). `--canon` writes the canonical form it hashes, so two files can
  be compared line by line. Its header says exactly what the fingerprint covers and ignores.
- The same tools run as `npm run review:fingerprint` and `npm run review:which` (put `--` before any
  arguments). They need no packages installed.
- `which-build.mjs` computes the code fingerprint and looks it up in `review/builds.json`. Its first line is
  the release name, or exactly `UNKNOWN BUILD: not a reviewed release`. Exit status: 0 known, 1 unknown,
  2 could not read. It reads the file and writes nothing.

**What the code fingerprint covers.** Every `<script>` and `<style>` body byte for byte (the template
included), every element and attribute (inline handlers are code and are kept), every comment and piece of
text, and anything after the main script. **What it ignores:** the body of `pubState` (the data, written by
every save), the body of `pubMode` (a PMO copy's mode), the object after `const APPNS = ` only when it is
plain JSON, `data-theme` on `<html>` (set by the theme script before `SRC0` is taken), and what a browser
rewrites when it serializes a page without changing what it does. The full list is at the top of
`tools/review/fingerprint.mjs`.

### A saved board runs the code that saved it

A user's saved board is `SRC0` plus data (section 1). It carries the program of the build that saved it, and
runs that program when opened. A board saved by an older build runs older, unreviewed code, even on a machine
that also holds the reviewed release.

To check a user's board, run `which-build.mjs` on it:

- A release name from `review/builds.json`, and "a saved board of this release": the program is the
  reviewed one. The data in it is not judged.
- `UNKNOWN BUILD`: the file holds a program not in `review/builds.json`. It may be an older or newer release,
  an edited copy, or a save from a browser that wrote into the page. When the scripts alone match a release,
  the tool says so, to show where to look.

To move a user's data onto the reviewed program: open the reviewed blank board and use **📁 File → ⬅ Import a
full board (new version)…** (`importFullBoard`, 9507). That reads the old file's data through the import door
and leaves its program behind. It takes boards saved by v1.80 or later.

**Caveats.**

- The BUILD stamp (line 2563) is one line of text anyone can edit. `which-build.mjs` reports it and never
  trusts it.
- The canonical form was checked against saves written by the board's own save code under jsdom. It has not
  yet been checked against a save written by Edge. Do that once before relying on it: open the blank release
  in Edge, Save, and run `which-build.mjs` on the saved file.
- A browser extension that writes into the page before `SRC0` is taken puts its change into every save from
  that browser. Those saves will not match; `which-build.mjs` then says the scripts match but the markup
  does not.
- Never trust a fingerprint a board shows about itself. Compute it outside the file.
- `review/builds.json` records v1.99 as `gate: pending` until its full test gate passes.

---

## 3. How to read the code

### The review bundle

```
node tools/review/bundle.mjs [board.html] [--out <dir>]
```

It splits the board for scanners and writes to `review/out/` (ignored by git), or to `--out`:

| File | Holds |
|---|---|
| `board.js` | The bodies of the two running scripts (the theme script and the main script) |
| `board-markup.html` | Everything else: elements, inline handlers, inline styles, comments, the two data islands |
| `board.css` | The `<style>` body |
| `template/<part>` | The PowerPoint template's parts, decoded from base64 |
| `MANIFEST.txt` | The SHA-256 of the board, of each file and of each template part, one per line in the form `sha256sum` writes |

The three text files are **padded, not cut**: line N of each is line N of the board, and columns are kept.
Whatever belongs to another file is blanked. A scanner's "board.js line 6712" is board line 6712. The tool
reads the three files back and fails if, laid over each other, they do not give back every line of the
board. It refuses a saved board (one with data in it), so budget data never lands in the working tree. It
checks each template part's name, that its base64 is canonical, that `.xml` and `.rels` parts are
well-formed, and that images and OLE parts start with their format's signature.

`node tools/review/sinks.mjs` writes `review/sinks.csv`, the list of HTML sinks (section 7). Both also run as
`npm run review:bundle` and `npm run review:sinks`.

### The 1.6 MB template line, and how to skip it

Line 24627 is `const TPL_PARTS={...}`: one line of 1,619,071 characters, 43.5% of the file's bytes. It is
the PowerPoint template the deck export builds inside: 71 parts, 1,212,255 bytes decoded. The parts include
`docProps/*`, `customXml/*`, `ppt/authors.xml`, `ppt/changesInfos/changesInfo1.xml` and two OLE embeddings
(`ppt/embeddings/oleObject1.bin`, `oleObject2.bin`). No relationship part in it has `TargetMode="External"`.
Only `_b64bytes` (24665-24669) and `buildPptx` (24670-24695) read it; `buildPptx` copies every part
verbatim into each exported deck.

`board.js` still holds that line at 24627, so line numbers stay true. Many editors and scanners slow down
or stop on it. To skip it:

- Read the parts in `review/out/template/` instead, and tell your scanner to exclude line 24627 of
  `board.js`.
- Or make a working copy of `board.js` outside `review/out/` with that one line blanked. Line numbers do not
  move. In PowerShell:

  ```
  $n=0; Get-Content review\out\board.js | ForEach-Object { $n++; if($n -eq 24627){ '// TPL_PARTS: see review/out/template/' } else { $_ } } | Set-Content -Encoding UTF8 board-notemplate.js
  ```

  With a POSIX shell: `awk 'NR==24627{print "// TPL_PARTS: see review/out/template/"; next} {print}' review/out/board.js > board-notemplate.js`
- When searching the board itself, cut long lines: `grep -n 'pattern' prioritization-board-grid.html | cut -c1-300`.

### A suggested order

1. The import door (9271-9490) and the importers it guards (section 4).
2. Opening: the boot of `PUB`, the side stores and the storage layer (1971-2571), then the boot restore
   (6333-6432).
3. HTML output: `esc` (28469), `jsa` (28475), `setStat` (6707-6718), then `review/sinks.csv` (section 7).
4. The live view and shared-folder engine (26004-27804), and the network calls (section 5).
5. The five-year plan's frames (19081-19361).
6. The exports: the XLSX writer (24414-24622), CSV (`csvCell`, 18384-18390), the deck (24624-24905).

### Table of contents of the board

Built from the six readers' section map, merged where two readers covered the same lines. Where a span does
not start on the line after the one before it, the lines between are blank, or `</head>` (line 1307).

| Lines | Section | Purpose |
|---|---|---|
| 1-6 | Document head | Doctype, charset, title, and an inline SVG favicon as a data: URI. No external resources. |
| 7-112 | CSS: theme tokens | Colour tokens for five palettes (Midnight :root, navy, parchment, blueprint, harbor) and the --edge contrast tokens. No url(), @import or expression() anywhere in 7-1279. |
| 113-931 | CSS: original layout | Pre-v1.90 rules for the header, toolbar, score cards, grid, RECORD inspector, chips, panels, tables, dialogs and menus. Many selectors are redefined in 932-1279. |
| 932-1279 | CSS: v1.90 layout layer and help guide | Density and mode variables, the sticky top stack, status line, task bar, posture strip, grid columns per mode, focus, breakpoints and the help guide. It overrides much of the earlier layer. |
| 1280-1306 | Pre-body theme script | Reads localStorage 'spmtTheme' before the body paints and sets `<html data-theme>` only for an allowlisted value. Otherwise it removes the attribute, and if storage is refused it falls back to harbor. |
| 1308-1392 | Body markup: top stack (header, task bar, hidden file inputs) | The header (appropriation, year and office menus, search, filters, status line, Save, Help, File), mode tabs and tool groups, and seven hidden file inputs (1383-1389). Controls use inline `on*` handlers. |
| 1393-1532 | Body markup: posture, funding detail, first modal shells | Empty containers that script fills with innerHTML, and the first dialog shells. The hidden band-ladder file input is at 1474. |
| 1533-1714 | Body markup: `<template id=helpDoc>` | The static in-file user guide (office and team parts), using data-go, data-q and data-m navigation attributes. Static text only. |
| 1715-1964 | Body markup: remaining modal shells, add panel, uiPrompt, grid | The other dialog shells, the Add Requirement panel (1827-1838), the uiPrompt dialog (1840-1846), the grid, the inspector and the drawer. |
| 1967-1970 | JSON data islands | `<script type=application/json>` holders: pubState (the saved board) and pubMode (the PMO-copy sandbox mode, baked in when a copy is published). |
| 1971-2001 | Main script: SRC0 capture and appropriation constants | Captures the page's own markup (SRC0) for later self-rewrite on save, and defines the appropriation slugs and labels. |
| 2002-2035 | Boot diagnostics and pubState parse | _bootLost list, the in-memory DIAG log, window 'error' and 'unhandledrejection' listeners whose messages are cleaned by diagClean (defined at 28056), and JSON.parse of pubState into PUB. |
| 2036-2091 | One writer per board file | A cooperative writer lock. The file records {by, fp, t}, the fingerprint is pkgSig of a 32-hex key kept in localStorage, and writerMay decides whether Save may write and reports why not. The comments say the guarantee is the folder's permissions, and what ORBIT adds is cooperative. |
| 2092-2113 | PMO copy sandbox flag | Parses pubMode into PMODE and sets SANDBOX. In a PMO copy it adds a fixed `<style>` that greys out or hides money-moving controls by their handler names. The style is a visual aid; the writers check allocLocked() themselves. |
| 2114-2147 | Side-list boot diff helpers | Records each side store's file copy and the raw storage text before opening, so unsaved side lists can be detected later. |
| 2148-2157 | Execution store boot (EXDB) | Loads prio27execdb from browser storage or PUB.execDb, whichever has the newer ts. It checks only that .all exists. |
| 2158-2265 | Storage write layer | Every write to browser storage goes through lsSet, which captures during an import, marks the board dirty, records refusals and tells the user. lsAll writes several keys all-or-nothing with rollback, and lsPutBack undoes them. |
| 2266-2338 | Other side stores boot | ACEDB, BUDDB, DESTDB (key suffixed per PMO copy) and RPDB, each loaded as 'storage vs file, newer ts wins' with a minimal shape check. Also reads and deletes the full-import report (prio27impRep). |
| 2339-2387 | Appropriation selection and storage keys | Works out APPN from the PMO mode, PUB.only and localStorage prio27appn, each checked against the APPNS keys. Builds _AP and _SLUGMAP and suffixes the storage keys of a PMO copy. switchAppn writes prio27appn and reloads. |
| 2388-2452 | PPBE cycle store and PMO copy HTML | Loads CYCDB (storage vs file), the other appropriations' cycle stores and cycByAp for the saved file. Builds the reference-only cycle store for a copy, and pmoCopyHtml writes the sandbox mode into the copy's pubMode with '<' escaped. |
| 2453-2571 | Data pack boot, view prefs and PMO list | Narrows PUB to this appropriation. Picks DATA from the embedded APPNS, then browser storage, then the file. Also the service list, view preferences, office list, BUILD (2563) and dataPackOf. |
| 2572-2687 | Fit, shortfall, absorber and 'drew' helpers | Lane-fit tests and counts, per-service fit, shortfall and absorber arithmetic. Small HTML/tooltip builders show what a directed split actually drew. |
| 2688-2759 | Not-drawn data and chips | Computes every service/lane typed above what it drew (ndData) and renders the strip counter and the row chip. |
| 2760-2878 | Needs-attention lists | One pass builds the attention lists (impact, CCaR, obligation date, awards short or repaired, negative allocations, buy quantities, over-long codes). attBody renders the modal and attGo navigates to the record. |
| 2879-2933 | Not-drawn fix list | The fix-list modal and the set-to-drawn actions, which are journalled and blocked by allocLocked in a copy. |
| 2934-3043 | Money and colour utilities | Whole-dollar rounding (D$). readableOn adjusts colour contrast and also sanitizes a band colour written into a style attribute (any value that is neither a hex colour nor a `var(--name)` theme token becomes grey). Exact integer apportionment (apportion and apExact with BigInt), and the short money formatter. |
| 3044-3059 | UI globals and item lookup | Mutable UI state globals (filters, open flags), itemById and itemsOf. |
| 3060-3292 | Service list editing | Remaps every per-service vector when the service list is reordered, renamed or shortened (all years, base data, CLINs, data packs, held submittals, the reprogramming log, CLIN RCN overrides, filters). Refuses changes that would move a locked cycle's services. Prompts add, rename, delete and move. |
| 3293-3553 | ACE tie-out panel | Compares imported Annual Cost Estimate lines with board requirements by WBS, per PMO and year, with confirm, unmap and expand actions. |
| 3554-3647 | WBS from execution data | Previews and writes WBS paragraphs read from imported execution rows. |
| 3648-3724 | Appearance, mode and density preferences | Theme, workspace mode, density and funding-detail toggles. All are per-browser localStorage values, allowlisted on read, and none is saved into the file. |
| 3725-3991 | Funding realignment: inputs, UPL marks, timing, capacity | State and setters for sourcing a new requirement by moving whole requirements. UPL pot marks, obligation-date parsing, execution years and receiving-year capacity are all read from imported execution rows (fixed column indices). |
| 3992-4107 | Funding realignment: plan table and xlsx export | The per-service table, the plan rows, and the xlsx download of the funding plan. |
| 4108-4471 | Funding realignment: pool, credits, solvers, setters | Builds the movable pool (execution or board year) and the credits. Two solvers (per-service greedy, and single-amount greedy, bucket DP or window) return notes as pre-escaped HTML. Then the panel setters. |
| 4472-5000 | Funding realignment: panel renderer | One 529-line renderer for the whole realignment dialog: inputs, tables, solver answer, year effects, plan and vacate list. |
| 5001-5096 | RCN/EEIC, destinations, executive decision panels | The RCN/EEIC registry editor, the destination editor wrapper (it delegates to flowEntEditor at 15418), and the executive-decision cards and band chips. |
| 5097-5131 | Services panel and add-panel inputs | Renders the service list editor and the per-service inputs in the Add Requirement panel. |
| 5132-5190 | Import service-alignment helpers | defaultOrder, BANDS_LEGACY, packOfStore and arityOfState: find an imported file's service list and its per-service width. |
| 5191-5309 | Service-alignment guard for imported state | svcCheckPack, svcRemapState, svcRelabelPacks and svcGuardImport. Refuses a different set of services, asks before reordering by name, and permutes every per-service list in place. |
| 5310-5502 | Award check and repair (door mode and open mode) | One validator for award records. In door mode (imports) a bad award is refused with a reason. In open mode (applyState) nothing is refused: the award is repaired or flagged, and the original is kept as text in aw.fix.orig. |
| 5503-5742 | State normalisation on every load | applyState replaces containers of the wrong type, migrates legacy shapes, turns money strings into whole dollars, sizes per-service arrays to SVC, repairs awards, seeds one-time orderings, reconciles PMO overrides and per-PMO rankings. setGrp moves a requirement to another PMO. |
| 5744-5913 | FYDP store, import inventory report and wholesale adoption | Holds the multi-year store globals (MS, CYCVIEW), creates blank year states, counts what an imported file carried, and builds the HTML import report. applyStore is the single entry for every wholesale load: it runs the service guard, deep-copies, normalises and applies the current year. |
| 5914-6141 | Year switching and per-requirement year copy/move | Switches the fiscal year on screen (roll-forward or blank). REQ_MAPS lists every per-requirement container. Copies or moves one requirement into another year, mints NEW-n ids that never repeat, and purges data when an added requirement is removed. Also resets a year. |
| 6142-6332 | Roll-forward panel and year administration | Picks requirements and years for a bulk copy, previews the counts, applies after one confirm, and renders the panel. Also removes a year and sets the base year. |
| 6333-6383 | Boot-time restore (top-level code) | Runs when the script evaluates. Applies a default store, then restores from localStorage[_AP.key], then decides between this browser's copy and the file's own pubState (PUB), keeping unsaved browser work aside first. |
| 6385-6432 | Save serialisation and browser-storage persist | Runs one save at a time, across tabs (navigator.locks), and writes MS to localStorage. |
| 6433-6662 | Change journal | Diffs year states into journal entries {t,by,fy,p,a,b} that travel inside the saved board. Puts a value back by its path (jrnlSet/jrnlUndo) and renders the journal panel. |
| 6663-6789 | save(), status line, prompt, editor identity | save() stamps the time, author, data pack and log, then calls persist. setStat is the shared innerHTML sink for status messages. Also the prompt fallback, the status button behaviour, time formatting, and the editor name stored in localStorage. |
| 6790-6950 | Kept-aside work and saved-file assembly | Keeps the saved-copy checkpoint (.base) and one kept-aside copy (.kept) in localStorage, and puts it back, saves it as a file or discards it. Builds the self-rewriting board HTML (savedHtmlOf), merges other appropriations from storage (pubsFor), and stores the File System Access handle in IndexedDB. |
| 6951-7398 | PMO copy: contributable fields, baseline, publish and submit | Defines which fields a PMO copy may propose, normalises them per field (pmoNorm), publishes a sandboxed copy with a baseline, and builds and downloads the submittal JSON, including whole proposed requirements gated on mandatory fields. |
| 7399-7984 | Submittal intake, review rows, report and apply | pmoTake is the door for a submittal: year, services, widths, field normalisation, scope and dedupe. pmoRows diffs held submittals against the board, pmoReport exports an xlsx, and pmoApply writes ticked fields through jrnlSet, applyAskVec, pmoAcceptProposal and pmoApplyRank. |
| 7986-8146 | Submittal review panel UI and PMO-copy banner | Renders the review table with tick boxes and drop/clear actions, and renders the amber PMO-copy banner. |
| 8147-8349 | Outbound gate, in-place save, downloads, shared sidecar adopt | Stamps titles and file names for PMO copies and locked cycles, and refuses outbound saves in a sandbox. Saves in place through the File System Access API with collision and writer checks, falls back to download, downloads the JSON state, and adopts the shared sidecar state. |
| 8350-8519 | Import several boards and HTML scraping helpers | Imports several board files into the consolidated board, all or nothing (FileReader, inboundCheck, slug from `<title>`, pubState regex, packs scraped from embedded JS), and has a brace-matching JSON scanner. |
| 8520-9066 | Appropriation packages (issue, return, diff, apply) | Issue and return packages carry one appropriation, with a ledger (sync) and a canonical signature. Includes the change preview (pkgDiff), conflict detection from the journal, locked-baseline protection, the packages panel, and pkgApply (the package door and write). |
| 9067-9270 | Side stores and taking appropriations from a consolidated file | Merges execution data, cost estimates, the reprogramming log and locked cycles from an imported file, each under its own rule. Lets the user pick appropriations from a consolidated file and commit them all or nothing, then reload. |
| 9271-9490 | Import door (inboundCheck) and typed-code limits | inboundCheck/inWalk/inShapeWhy check a whole imported payload: size, depth, __proto__/constructor/prototype keys, numeric ranges, text length, id and name characters, amounts and awards. Also typed-code length limits (codeTake, codeIssues) and the refusal message. |
| 9491-9840 | Full-board import and failed-import recovery | Imports everything from a v1.80+ board: all appropriations, cycles, BAE, execution, ACE, reprogramming and destinations, as one all-or-nothing localStorage commit, then reloads. When storage refuses part-way it offers rescue downloads and holds saving (IMP_MIXED_KEY) until the user clears it. |
| 9841-9900 | Export one appropriation as a working board | Rewrites the saved HTML so it carries only one appropriation, blanking the other APPNS entries in the embedded JS, and downloads it. |
| 9901-10045 | importState: the main import router | Runs the single-file import: size check, inboundCheck, then routes to a submittal (pmoTake), a package (pkgApply), a consolidated pick, slot writes, the shell, or applyStore. Then reports with importReportHtml. |
| 10046-10112 | Typed amounts and display accessors | Parses typed money whole or refuses it (amtRead, parseAmt, amtNo, amtReadM). Provides the title, record-name, CCaR and PID accessors and a static SVG icon. |
| 10113-10270 | PMO list management | Add, rename, move, delete or reset the board's PMO list (MS.pmos), protecting offices the data homes requirements to. Renders the panel and the Add Requirement office picker. |
| 10272-10386 | Chart of accounts: the agreed design | Stores the agreed appropriation, office, grouping and CCaR design (MS.coaDef) and works out where the board differs from it. Writes nothing to the board. |
| 10387-10608 | Chart of accounts: grouping edits and setup panel | Adds, renames, moves and deletes groupings and the CCaR records filed under them, and draws the setup panel. Saves the design with coaDefSave(). |
| 10610-10848 | Per-requirement classification: SI codes, prime detection, RCN/EEIC registry and assignments | Works out Navy SI codes and LM/PW prime membership. Keeps the board-level RCN/EEIC registry (MS.rcn) and the per-year assignments at requirement, service, CLIN and CLIN-service level, and clears every pointer when a combination is deleted. |
| 10850-10924 | The one landing rule for funded dollars | Places each service's discretionary and mandatory dollars into award months: discretionary fills forward from the first award, mandatory fills backward from the last, and the rest is unscheduled. Also defines the award date sort (awdCmp) and the per-service monthly spread. |
| 10925-10974 | SI / prime-type / PID setters | Reads and writes the SI code (stores it only when it differs from the derived value), toggles PRIME/OGC, and edits the PID through uiPrompt with a length check (codeTake). |
| 10975-11101 | Award date editing | Single and incremental award dates, the per-service increment amounts, the residual 'fill last award', switching between single and incremental, and add/remove increment. |
| 11102-11283 | Spend-plan forecast and PMO shares | Builds the month-by-month forecast by PMO, by service and by prime rollup from landSvc. Also the deck chart series, and the split of a CLIN-backed prime across offices in whole dollars. |
| 11284-11505 | Continuing Resolution cash view and 1A9A return export | Half-month CR windows from each award's own day, the 1A9A CRA workbook export (download), and the list and clearing of old S.crHalf marks. |
| 11506-11631 | Minimal XLSX/ZIP reader | Parses an .xlsx ArrayBuffer by hand. It walks the ZIP central directory with bounds checks (need()), inflates entries with DecompressionStream('deflate-raw'), reads sharedStrings, workbook and rels with regexes, then reads each sheet's rows and cells. Records what it saw in XLSX_LAST. |
| 11632-11793 | Spend Plan Source constants and helpers | Column layout and number formats for the Spend Plan Source export, lane amounts per service, Excel date-serial helpers, the allocation-text rule, the export gap note, and mySlug() (the appropriation slug used throughout the file). |
| 11794-11860 | CCaR QPE (execution) import | Reads the QPE workbook. It matches the four appropriation tabs exactly or after normalising, builds per-year execution rows into a staged copy, then commits to EXDB.all, saves to browser storage (persistExdb) and reports. |
| 11861-11921 | ACE cost-estimate parsing | Maps ACE rows (fixed column indices) to appropriation, PMO and service, and collects $M fiscal-year vectors into totals and lines. |
| 11922-12467 | BAE budget registry, rule, resolver, RECORD-panel picker and families | Parses budget names structurally and keeps the registry: board-wide BUDDB, falling back to older stores including localStorage. Covers the auto-fill rule, the single resolver (budResolve) that judges stored choices, the per-line and per-family setters, and the RECORD-panel HTML. |
| 12468-12767 | Shared folder (File System Access) connection and diagnostics | Releases the lock file on unload, derives a Windows path hint from location.href, opens the directory picker, connects automatically or with one click (and pulls store, execution, ACE and RP data from the folder), asks for edit permission, write-tests the folder, and runs the step-by-step folder check. |
| 12768-12877 | Budget registry maintenance | Department scoping, use counts across every year, retired and orphan counts, the import diff, and the per-line assignment read/write plus per-line export stats. |
| 12879-13262 | IDS batch-import workbook export | Builds contributions per requirement, service and lane; resolves budget and control number; excludes rows with reasons; consolidates rows; self-checks the arithmetic (idsCheck). Then validates the prompt, writes the two-sheet workbook as a download, and keeps only the ORG number. |
| 13263-13537 | Pre-flight checks panel | Read-only list of blocks, fixes and notes before export: IDS exclusions, failed arithmetic, PMO-copy proposals, over-funding, unusable budget choices, missing band/consequence/award/PID, long codes, unfunded items, shared control numbers, CR moved marks. Renders the panel and copies it to the clipboard. |
| 13538-13574 | Obligation category and CCaR record accessors | Fixed obligation-category list and setter, and lookups into the imported CCaR records index (title, OPR, control number with reasons). |
| 13576-13701 | WBS from imported execution data | Parses WBS paragraphs from column 23 of the execution rows, matches rows to requirements and CLINs by record name or CCaR number, reports conflicts and unmatched rows, and writes only unanimous proposals that do not overwrite typed WBS. |
| 13702-13983 | ACE mapping: requirements to cost estimate | PMO alignment per estimate set, WBS suggestions (exact and rollup), confirmed mappings, per-line funding rows with the RCN/SI/cost-element classification, a temporary switch to another fiscal year (aceWithYear), the tie-out scan, and the estimate fingerprint and stamp. |
| 13984-14066 | BAE (Budget Allocation Extract) import | Reads the first sheet's 'Budget Name' column, filters and parses names, diffs against the registry by department, confirms only when budgets would be retired, then commits BUDDB and saves it (persistBud). |
| 14067-14230 | CCaR reconciliation panel | Compares the board's Spend Plan Source amounts, titles, OPRs and budgets with the last QPE pull by CCaR number, then renders the panel and copies it to the clipboard. |
| 14231-14290 | CCaR records import | Indexes the CCaR records workbook by normalised CCaR No (title, OPR, PMO, Control No, duplicate and conflict flags) into MS.ccarIdx. |
| 14291-14333 | ACE estimate import | Reads the ACE workbook, keys the set by the year in the file name (or the file name itself), confirms before replacing a locked set, stamps locked/by/file/fingerprint, and saves (persistAce, persist). |
| 14334-14470 | Execution panel helpers | OSD obligation goals, service and PMO from budget text, aggregation by PMO, title and service for the execution panel, and summary rows across appropriations. |
| 14471-14614 | Funds-flow configuration (categories, sub-rungs) | Default prime rules, the OGC category ladder, sub-category ladders and their show/hide state, with setters that write MS.flow. |
| 14615-15019 | Destination registry, cross-file key migration, MIPR and destination setters | Board-wide destination list (DESTDB). Folds lists from saved plans, cycles, other appropriations' stores and PMO submittal packages into it, re-points keys, saves to storage, and edits and deletes destinations with usage checks across appropriations. |
| 15020-15388 | Funds-flow calculation | Indexes plan events to requirements by title, classifies rows as LM/PW/OGC category or destination, handles scope (years and appropriations), executed versus planned years, OBBBA pseudo-year moves and the UPL policy, and produces the totals model. |
| 15389-15596 | Funds-flow editors, import report and SVG text helpers | Partner/FMS type-ins, rule and category setters, the destination editor, the panel body, the QPE import report, and the SVG palette, text and band helpers (flowT at 15582). |
| 15597-15696 | Funds-flow SVG primitives and view model | The clickable node wrapper (flowHit), the one view model every layout reads, the other-sources strip, the second tier and the outer `<svg>`. |
| 15698-16085 | Funds-flow chart layouts | Four SVG string builders (tree, Sankey, modern, top-down cascade) and the dispatcher. |
| 16087-16122 | Funds-flow PNG export | Reads the chart's SVG with outerHTML, loads it through a blob URL into an `<img>`, draws it onto a canvas at 2x and downloads a PNG. |
| 16124-16408 | Funds-flow drill-down and panel | Turns a chart selection into its plan-event rows, draws the drill table, and builds the whole Funds Flow panel: year, appropriation, layout and grouping chips, the matching-rules editor, the partner/FMS entry table and the explanatory text. |
| 16410-16519 | Funds-flow workbook export | Builds the funds-flow xlsx: a summary sheet, prime and OGC detail sheets, and one sheet per category. Downloads it and posts a status line. |
| 16520-16840 | Active-year execution panel and export | Grid geometry, the cumulative obligation curve against the OSD goal (data and SVG), the execution panel (summary or per-appropriation PMO/title/event drill, scope chips, by-service table) and its xlsx export. |
| 16841-17031 | Spend Plan Source export | Builds the 32-column CCaR Spend Plan Source rows (one per requirement, service, lane, CLIN and increment). Refuses the export when a chosen budget is invalid, asks before exporting rows with a blank Budget, then writes the xlsx. |
| 17032-17226 | Decision-band ladder model | The standard and local band definitions, the ladder getter (which also upgrades stored ladders), sub-band filing (`of`), letter numbering, normalisation, standard range labels, fallback band, the effective rank used for sorting, and the report of orphaned band ids. |
| 17227-17449 | Band administration, cross-appropriation copy and ladder file import/export | Edits the ladder: add, rename, move, delete, reset, install the standard set. Adopts a ladder that another appropriation left pending in localStorage. Compares and copies the ladder into other appropriations' localStorage stores. Exports and imports a ladder as JSON. |
| 17450-17633 | QPE column-coverage report | Reports which of the 32 CCaR columns come back filled in imported execution data, measured against a declared list of columns ORBIT reads and the columns the real export writes. Renders the report modal. |
| 17635-17731 | Band panel UI | Renders the band ladder editor modal: per-band rows, filing selects, move, add, rename and delete buttons, and the import/export/copy/reset buttons. |
| 17732-17758 | Proposed order by band | Minimum useful increment, the pure 'sort by band' order, and publishing that order to S.order after a confirm. |
| 17759-18300 | Two Spend Plans (A: discretionary only, B: discretionary + mandatory) | Prime what-if percentages, the funding-source direction vectors, the per-plan priority walk, the plan computation and row model, the scenario title tags, the panel, and the xlsx export. |
| 18301-18408 | Proposed-order preview and CSV export | Compares the current order with the proposed one (lane split under each), renders the preview, and exports it as CSV. Every CSV cell goes through csvCell, which neutralises formulas. |
| 18409-18481 | Executive-decision walk and per-requirement setters | Three-pass lane walk under the band rules, the decision totals (stoppage gap and others), and the setters for band, minimum increment and consequence text. |
| 18482-18557 | Written-field pop-up | Modal editor for Impact / Description / Note text. Writes only the fields that changed, calling the setter named in FLD_PARTS through window[p.set]. |
| 18558-18616 | In-file help guide and consequence textarea | Reads help sections from the in-file `<template id="helpDoc">`, renders the contents page or one section, and builds the inline consequence textarea used by the card build. |
| 18617-18638 | Spruills / ACE view-state helpers | View state for the Spruills and PPBE panels, and office keys and rows read from an imported cost estimate (ACEDB). |
| 18639-18790 | PPBE cycles: store, lock, migrate, retag | The CYCDB cycle store, cycle labels, the per-year projection, locking the FYDP window, lock/unlock and delete, a PMO's allocation under a cycle, migration of legacy one-year baselines, and the working-plan tag. |
| 18791-19080 | Five-year (FYDP) spend plan data and workbook | Reads the working plan or a locked cycle into one shape, puts PMO rows per year, builds subtotals, service view, PPBE position and ACE estimate columns, and the three-sheet workbook. The export then waits for the per-PMO tabs. |
| 19081-19361 | Reading other appropriations through sandboxed frames; per-PMO tabs | Reads each other appropriation's saved state (browser storage, the file, or the shared folder), runs a copy of this page in a hidden sandbox="allow-scripts" frame built with srcdoc, takes its answer by postMessage, checks it, and builds one workbook tab per office. |
| 19362-19418 | FYDP panel | Renders the five-year plan modal: source and estimate selectors, the PMO table, and position and estimate notes. |
| 19419-19637 | Compare two cycles | Per-requirement A / B / delta for every year both sources hold, with a check that the row deltas add up to the total delta. Panel and three-sheet workbook. |
| 19638-19800 | Deltas against the reference cycle | What changed since the reference lock: the row chip, the inspector block, who changed it (from the journal), the next-cycle retag, and the changes panel. |
| 19801-19886 | Viewing a locked cycle (read-only swap of MS) | Swaps the live store for a throwaway copy of a cycle's years, restores it on leave, and puts the pristine year back when a write is refused. cycBlock is the gate the outbound and inbound paths ask. |
| 19887-19985 | PPBE cycles panel | Renders the cycles modal: working tag, reference select, lock controls and the held-cycles table with view, compare, lock and delete actions. |
| 19986-20317 | PPBE Budget Positions editor | Cycle and year pickers, normalisation of legacy position shapes, per-service sub-designator lines (RCN/EEIC, SI, cost element), cell setters, and the editor and roll-up panel. |
| 20318-20800 | Spruills requirements-vs-controls view | Rolls primes up to their PMO and reads this board's years and other appropriations' states (localStorage / PUBS). Builds the per-appropriation tables, the PMO drill against a chosen control source (board, locked cycle or PPBE position), and the panel. |
| 20801-21117 | Dated snapshots (positions) | Freezes the year's whole plan state plus an aggregate of imported CCaR execution into MS.snaps, with lock/unlock/delete, and a modal that lists snapshots and diffs two of them. |
| 21119-21232 | Budget Management toggle and reprogramming tracker view | Opens the Budget Management panel. Renders the ATR/BTR reprogramming log as an editable table (selects and inputs per row) and as a net-by-appropriation summary. |
| 21233-21322 | Budget Management panel and ATR/BTR export | Draws the base discretionary and mandatory budget authority and the added funding sources, each with inputs. Exports the reprogramming log as an xlsx download. |
| 21323-21388 | CR cash needs panel | Shows continuing-resolution cash needs by half or full month, by service or PMO, with expandable per-requirement rows and a list of awards whose half-month moved. |
| 21389-21488 | Spend plan forecast panel and export | Draws the monthly forecast for the whole portfolio, one PMO or one service, with a view picker. Exports exactly that view as xlsx. |
| 21490-21581 | Requirement value and allocation readers and setters | Normalises ask vectors, writes typed asks (custom requirement vs S.asks), edits the CCaR record, and reads the per-service allocation (directed split, per-service or total apportioned). |
| 21583-21827 | Lane engine and funding math | The priority walk that draws each requirement's basis from per-service discretionary and then mandatory lanes. Also holds Mission Critical totals and need, unfunded, beyond and trim readings, and board totals. |
| 21828-21982 | Scoreboard, fit strip and funding posture | Builds the four score cards, the discretionary-fit chips, the lane filter chips, the unfunded-by-service warning, the minimised strip and the always-visible posture strip with Needs-attention buttons. |
| 21983-22149 | Seeding budget authority from a PPBE position | Copies a logged PPBE position's per-service figures into S.bm (only for the services the position covers), records where they came from, and reports untouched, edited or moved states. |
| 22151-22197 | Budget authority setters | Derives the effective discretionary and mandatory lanes from the base plus funding sources. Editors for the base totals, per-service base and funding sources. |
| 22198-22461 | Reprogramming tracker model | The standalone ATR/BTR log (RPDB): filters, per-appropriation service lists (including other boards' copies in localStorage), exact whole-dollar amount parsing with BigInt nets, check messages, the service picker, migration from the old per-year store, row add, edit and delete. Also the legacy S.reprog editors. |
| 22463-22634 | Discretionary-fit chart and service summary | Builds an inline SVG bar chart per service and the service table (ask, BA, drawn, remaining, MC need and total, unfunded). |
| 22635-22732 | Trim absorption panel | Walks the priority order to show which trimmed requirements the unspent discretionary lane could cover. |
| 22733-22803 | PMO menu helpers, realignment and service shortfall | Counts requirements per office for the PMO menu, a stub chips(), a hint for reassigning PMO, whole-requirement service realignment, and svcShort (beyond-lanes per service). |
| 22804-22930 | Award and obligation block | Splits funded dollars across award dates. Builds the award or incremental-award editor HTML and the repaired-award notice, keeps repair records across edits, and holds a retired svcTable stub. |
| 22932-23101 | Row setters, chip picker and row menu | Per-service allocation and note setters, zeroing or restoring a PMO's allocations, an unused chip picker, the row's overflow menu HTML, the cost-element prompt, and description and note toggles. |
| 23103-23334 | Prime CLIN drill model and editors | The working CLIN list over DATA.clins (meta overrides, additions, removals), the CLIN allocation map, the proration rule (clinSplit), and add, rename, request, remove, restore, reset, fill-from-row and apply-to-row editors. |
| 23336-23435 | WBS model | WBS lists per requirement or per CLIN: resolving them against the parent allocation, storing, and adding, deleting and editing lines. |
| 23436-23643 | Requirement record panel | Builds the classification fields for one requirement as HTML control strings (PMO, obligation category, cost element, WBS, RCN/EEIC, SI, destination, MIPR) and renders them in a modal. |
| 23645-23920 | Classification matrix | A grid of requirements by classification field that reuses the recFields controls, with a coverage count, filters and a bulk setter with preview and confirm. |
| 23922-23988 | WBS panel | A modal editor for the WBS split of a requirement or CLIN by service. |
| 23990-24146 | CLIN RCN/EEIC cells and CLIN table | RCN/EEIC pickers per CLIN and per service, and the CLIN grid HTML with reconciliation rows. |
| 24147-24207 | Renaming and cost elements | Renames the plan event or the CCaR record name through a prompt. Holds the COST_ELEMS list and an unused setter. |
| 24208-24413 | PMO, Special Interest and cost-element matrices | Read-only summary tables by PMO, by SI code (O&M) and by cost element, with per-service Disc/Mand, BA, remaining and unfunded rows. |
| 24414-24622 | Minimal XLSX writer | A dependency-free stored (uncompressed) ZIP writer, CRC32, XML escaping, the styles part and the workbook and sheet XML generation. |
| 24624-24905 | PPTX export | Builds slides inside the embedded PowerPoint template. Line 24627 is TPL_PARTS, one 1.6 MB line of base64 template parts. buildPptx copies the parts and adds slides; exportPPT downloads the deck. |
| 24906-24939 | Team summary | An ATL/BTL team rollup table. |
| 24941-25063 | Buy lines (aircraft and engine quantities) | Strict quantity parsing, exact quantity-times-cost dollars, a list of invalid saved values, recomputing the BUY-AC and BUY-ENG asks, setters, price lock and the buys panel HTML. |
| 25065-25178 | Command bar (typed or spoken) | Parses typed commands and writes to #cmdOut. Nothing in the file calls runCmd, and no element has that id; the test suites call it. |
| 25179-25374 | Rank entry and main render | Freezes the order in rank-entry mode and runs render(). render() calls every panel renderer, draws the grid header, cutlines and every requirement row as one HTML string, plus the PMO action buttons and the removed-requirements panel. |
| 25375-25540 | Menu state, layout fitting and global keyboard and click handlers | Menu group memory in localStorage, Find in Reports, fitting the toolbar and dropdowns to the window, sticky offsets, and document keydown, focusin and click handlers that close menus. |
| 25541-25641 | Save state and side-list boot check | Compares the side lists in browser storage at opening against the file's copies to decide the unsaved state, and draws the save-state indicator and Save button. |
| 25642-26002 | Toolbar menus | syncBtns() rebuilds every toolbar menu (year, office, filter, Reports & exports, Data, Setup, basis, mode tools, File) and the filter chips as HTML strings. |
| 26004-26171 | Live view: config, transport client, timer, payload | Per-machine live-view settings and API key in browser storage, the network client (fetch or the Electron bridge), the refresh timer (autosave, then poll), and the payload a publish sends: the whole appropriation store less its side stores. |
| 26172-26254 | Shared folder: handle storage and permissions | Keeps the File System Access directory handle in IndexedDB, opens the folder picker, and gets read/readwrite permission. |
| 26255-26352 | Shared folder: history copies and raw file I/O | Names, lists, keeps and thins history/ snapshot copies; the generic folder read and write helpers. |
| 26353-26417 | Shared folder: peer poll and advisory lock | Each tick: writes this user's lock heartbeat, pulls the store, exec data and reprog log when working out of the folder, then reads every peer file and lock file for the year. |
| 26418-26740 | Shared folder as the store: load, save, conflict, pen | Adopts a newer folder copy (with guards), saves to the folder with clash detection, writer/pen policy and a history copy kept first, resolves conflicts, and takes the pen. |
| 26741-26858 | Restore an earlier folder copy | Lists history copies and puts one back after pinning appropriation/year and keeping the current copy. |
| 26859-26887 | Execution data sharing | Writes EXDB to spmt-exec.json; pulls it and replaces EXDB wholesale when newer. |
| 26888-27183 | Cost estimate (ACE) sharing and history | One file per estimate set: validated read, share-if-absent, deliberate replace, history list and restore, and pull of sets not held. |
| 27184-27304 | Reprogramming log merge | Row-level merge with tombstones; push reads, keeps a history copy, merges and writes; pull merges. |
| 27305-27368 | Confluence transport | Lists, uploads and downloads JSON attachments on one wiki page with a bearer token or browser cookies. |
| 27369-27446 | SharePoint transport | SharePoint REST: request digest, folder list, file upload (overwrite) and per-file download. |
| 27447-27804 | Live publish/poll dispatch and Live panel UI | Picks the transport for publish and refresh, then builds the whole Live view panel as one HTML string. |
| 27806-27932 | Budget list panel | Shows where the BAE budget list came from, retired budgets and the list itself; clears retired assignments. |
| 27934-28201 | Save diagnostics | Builds a redacted plain-text support report: every string the board holds is collected and scrubbed out of logged messages, then the report is downloaded. |
| 28203-28333 | IDS batch import panel | Preview, reconciliation and export prompt for the IDS workbook. |
| 28335-28388 | Companion tool link | Stores a file name in MS.links and opens it in a new tab. |
| 28390-28442 | Ordering and drag | Master and per-PMO rank changes, drag handlers, reset order. |
| 28444-28637 | Allocation edits, add/remove requirement, esc and jsa | Allocation and split editors with the PMO-copy lock; the HTML escaper esc() (28469) and the inline-handler escaper jsa() (28475); add, remove and restore requirements. |
| 28639-28919 | Priority drill workbook and exec synopsis | Builds and downloads the band-grouped xlsx (exportCSV) and the CSV executive synopsis. |
| 28920-29251 | ACE tie-out workbook | Builds and downloads the ACE mapping/reconciliation xlsx. |
| 29252-30333 | Breakouts workbook | One function of about 1,080 lines that builds every breakout sheet (lists, matrices, bands, forecast, CR, month sheets, per-PMO tabs) and downloads the xlsx. |
| 30334-30340 | Boot: appropriation selector and labels | Top-level code that fills the appropriation `<select>` and the header labels. |
| 30342-30454 | Grid inspector plumbing | Row selection, the drawer below 1400px, and stripping row handlers after render. |
| 30456-30706 | Record inspector rendering, selection, J/K keys | Builds the RECORD panel HTML for the selected requirement; adds a document click delegate and J/K navigation. |
| 30708-30760 | Focus preservation across redraws | Records where keyboard focus was before render() and puts it back afterwards. |
| 30761-30954 | Dialog controller | Makes every .modal-bg a modal dialog: inert background, focus trap, Esc, and a discard-typing prompt. Driven by a MutationObserver and global capture listeners. |
| 30955-30983 | render() wrapper and boot render | Replaces render() with a wrapper that adds focus restore, the inspector, fitMenus and dlgSync; writes the PMO-copy banner; first render. |
| 30984-31182 | Chart of accounts workbook | Cross-appropriation CCaR structure report with flags, downloaded as xlsx. |
| 31184-31246 | Boot status message cascade | Top-level if/else that picks the first status message (restore error, mixed import, held/kept work, import report, repaired awards, orphan bands, shell, published state). |
| 31247-31331 | Sidecar state load and boot folder connect | Optional sidecar state file through XHR/fetch, its adoption rules, journal baseline, and the deferred shared-folder auto-connect. |

### The biggest review hardships

- **One script, one global scope.** The main script runs 1971-31331 with about 1,700 named functions and
  about 1,470 top-level ones. State is in global `let`/`const` names (`S`, `MS`, `PUB`, `PUBS`, `DATA`,
  `SVC`, `FH`), not properties of `window`. Core helpers sit far from their callers: `setStat` 6707,
  `buildXlsx` 24522, `diagClean` 28056, `esc` 28469, `jsa` 28475.
- **Very long functions.** `exportExcel` 29252-30333 (about 1,080 lines), `rlgBody` 4472-5000 (529),
  `syncBtns` 25642-26002 (361), `exportAceTieout` 28937-29251 (315), `liveBody` 27553-27804 (252),
  `pmoTake` 7746-7984 (239), `flowHtml` 16171-16408 (238), `inspectorBody` 30464-30683 (220),
  `applyState` 5503-5716 (214), `aceBody` 3343-3553 (211), `exportPPT` 24696-24905 (210), `exportCSV`
  28643-28851 (209), `preflight` 13272-13466 (195), `render` 25196-25374 (179).
- **HTML built as strings, with inline handlers.** Panels are built by string concatenation and template
  literals and written with `innerHTML`. About 550 inline handler attributes (`onclick=` and the like) appear
  in the markup and in the strings the script builds. Whether a value is safe has to be checked term by term.
  Some helpers take HTML by contract and insert their arguments as given: `mi` (23033, 25649), `grp`
  (25653), `recSel` (23447), `recBtn` (23450), `inspField` (30456), `driveCheckSay` (12684) and `setStat`
  (6707).
- **Code inside strings.** The five-year plan's frame shim (19166-19178) is JavaScript written as a string
  literal and spliced into a copy of the page. Linters and code-only scans do not see it.
- **Dispatch by name.** `fldSave` calls `window[p.set](id, value)` (18556), with `p.set` taken from the fixed
  `FLD_PARTS` list (18496). `render` is replaced by a wrapper at 30957-30974 after `const _renderCards =
  render` (30708), so every `render()` call also runs focus restore, the inspector, menu fitting and the
  dialog controller.
- **Boot code between definitions.** Top-level code runs in the middle of the file (6333-6383, 30334-30340,
  30955-30983, 31184-31331), and order matters: several reads are guarded against the temporal dead zone.
- **Seven copies of one boot rule.** The side stores load as "browser storage or file, newer time wins" in
  seven places (2148, 2267, 2284, 2302, 2323, 2397, and `cycStoreOf` 2420), each with its own small shape
  check.
- **Two CSS layers.** 113-931 and 932-1279 redefine many of the same selectors. The effective style is known
  only by reading both.
- **Near-duplicate transports.** The Confluence, SharePoint and JSON-endpoint clients (27305-27533) repeat
  the same naming, header and polling code.
- **Stale and misplaced comments.** Comments still mention a card build, `tools/parity.mjs` and a lost
  Python build script (see `README.md`), and some comment blocks sit above the wrong function.
- **Code nothing calls.** The readers found about 140 lines that nothing in the file calls, for example
  `chipBg`/`bandInk` (2981-2990), `rlgUplCount` (3786), `removeYear` (6307), `coaSetPmo` (10424),
  `bandRollup` (17153), `rpAdd`/`rpSet`/`rpDel` (22444-22461), `clinRowTot`/`clinGridTot` (23218-23220),
  `setCE` (24203) and `liveLockedByOther` (26397). Four that look unused are called by the test suites and
  must stay: `runCmd` (25113, the command bar 25065-25178), `setBATot` (22159), `setAwdDate` (10997) and
  `saveInPlaceFile` (8205).

---

## 4. Where data comes in and goes out

Every trust boundary the readers found (198 entries), checked against the code at `6de4432`. Rows of the
same kind and the same rule are merged. "No inboundCheck" means the data does not pass the import door.

### The import check: `inboundCheck`, `inWalk`, `inShapeWhy`, `IN_KEY_BAD`

**Where.** 9271-9490. It is called at 8459 (`importBoards`), 9521 (`fullImportText`), 9909 (`importState`),
17416 (`bandImport`), 26452 (`driveParse`, so every shared-folder read) and 31263 and 31270 (`loadShared`).
`inTooBig` (9483) refuses a file on its size before any of it is read. A refusal goes through `inRefuse`
(9485), one message, and nothing on the board changes.

**What it checks.**

1. **Size.** Text longer than `IN_MAX_BYTES` (64 MB, counted in characters) is refused (9468).
2. **What it parses.** If the text starts with `<` (after any white space) or contains `id="pubState"`, it
   parses the first `pubState` island and the requirement lists that `extractPacks` (8502-8510) finds after
   the first `const APPNS = ` or `const emb = `. Otherwise it parses the whole text as JSON. A part that does not
   parse is not checked here; the importer reports it in its own words.
3. **Every value** (`inWalk`, 9445-9463, iterative so deep nesting cannot overflow the stack):
   - more than 5,000,000 entries: refused;
   - numbers must be finite and within ±1e15 (`IN_MAX_NUM`);
   - text at most 200,000 characters (`IN_MAX_TEXT`);
   - nesting at most 64 (`IN_MAX_DEPTH`);
   - a key named `__proto__`, `constructor` or `prototype` (`IN_KEY_BAD`, a `Set`, line 9300): refused.
4. **Recognised shapes** (`inShapeWhy`, 9380-9442), wherever they sit in the file:
   - a requirement list (`items` with `services` or `budget`);
   - a year's plan (`order` with `discSvc`, `alloc`, `custom` or `mc`);
   - a band ladder (`bands`), an office list (`pmos`), a service list (`svc`);
   - a submittal (`spmtPkg` with `dir` `'submit'`).

   In those shapes:
   - **ids** (`inIdWhy`): text of 1-80 characters with no control character, `<`, `>`, `"`, `'`,
     backquote, backslash or `|` (`IN_ID_BAD`, 9297). A submittal's item keys follow the same rule. The
     keys of the per-requirement maps in `IN_ID_MAPS` (9302) are held to its character rule;
   - **service and office names** (`inNameWhy`): text of at most 200 characters with no control character,
     `<`, `>`, `"`, backquote or backslash (`IN_NAME_BAD`, 9297);
   - **amounts** (`inAmtWhy`): a number within ±1e13 (`IN_MAX_AMT`), or text that reads as one
     ("1,234,567");
   - **band colours**: `#` and 3-8 hex digits;
   - **awards**: `awdNorm` in door mode (5367-5502).
5. It only reads. A file it passes goes on exactly as it was.

**What it does not check.**

- **Fields it does not recognise pass unchanged**, as long as they meet the limits in point 3. This is on
  purpose (comment at 9293-9295; `CLAUDE.md`, "What a file may carry"): a newer version's fields must
  survive a trip through an older one.
- **Types outside the recognised shapes.** Any JSON value within the limits passes there.
- **Free text.** Titles, events, notes and descriptions may hold any character within the length limit.
  Only ids and the service and office names in recognised shapes are held to a character rule.
- **Object keys,** except the three forbidden names, the `IN_ID_MAPS` keys and a submittal's item keys.
- **Workbooks.** The `.xlsx` imports do not pass the door. They are read cell by cell (`xlsxRead`,
  11522-11631).
- **Data that arrives another way.** Browser storage read at opening, the kept-aside copy, other
  appropriations' stores, the board's own `pubState`, the replies of the Confluence, SharePoint and JSON
  endpoints, and the five-year plan's frame replies do not pass the door. Each row below says how it is
  checked instead.

### File imports (a person picks a file)

| Line | Function | What comes in | How it is checked |
|---|---|---|---|
| 1383-1389, 1474 | (markup) | Eight hidden `<input type="file">` elements, each calling an importer with `onchange` | See the importers below |
| 9901 | `importState` | One file (`#stateFile`): a board HTML, a state JSON, a package, a submittal or a consolidated file | `inTooBig`, then `inboundCheck` (9909) before any route, then `JSON.parse`. Routed by a leading `<` or `id="pubState"`. Submittals go to `pmoTake`, packages to `pkgApply`. Some routes reload the page (9991, 10022, 10032) |
| 9507, 9520 | `importFullBoard`, `fullImportText` | One whole board (`#fullFile`) | `inTooBig`, `inboundCheck` (9521), the `pubState` pattern, a BUILD of v1.80 or later, a confirm per appropriation and one for the whole import. Up to about ten storage keys written through `lsAll`, all or nothing. Reloads (9636) |
| 8350 | `importBoards` | Several boards at once (`#multiFile`) | `inTooBig` and `inboundCheck` (8459) on each; one refused file refuses all. The slug comes from the `<title>`, the state from the `pubState` pattern, the lists from `extractPacks`. Two files for one appropriation are refused. `svcGuardImport` per appropriation; one `lsAll` commit |
| 8489, 8502 | `_scanJson`, `extractPacks` | The requirement list after the first `const APPNS = ` or `const emb = ` in an imported board's script | A brace-matching scan, then `JSON.parse`. The door uses the same `extractPacks`, so it checks the object the importer uses |
| 7746 | `pmoTake` | A submittal, routed from `importState` | `ap` must match this board; `fy` an integer in 1990-2199 or confirmed; the service list is required when there are per-service figures and must match (a reorder is remapped); widths must equal the board's; every field normalised by `pmoNorm` (types, known groupings and bands, awards in door mode); out-of-scope items dropped. Nothing is applied until a reviewer ticks it (`pmoApply`, 7607) |
| 8926 | `pkgApply` | A package, routed from `importState` | `spmtPkg===1`, `ap` and `ms` present; on a single board `ap` must be this board's; `svcGuardImport`; a staleness test against the ledger's sequence; conflicts found from the journal or the signature; a preview confirm; locked baselines kept |
| 9092, 9157 | `importStores`, `cycTake` | The side stores in an imported file: `execDb`, `aceDb`, `rpDb`, `cycDb` | Execution: newer time wins per appropriation. Estimates: a missing key is taken, the same fingerprint is a no-op, a different one is reported. Reprogramming: `rpMerge`. Cycles: missing keys taken, held ones kept. Beyond that, the door's generic walk only |
| 9184, 9216 | `consTakePick`, `consTakeApply` | Appropriations picked from a consolidated file | `svcGuardImport` per appropriation, a conflict confirm, a preview confirm, locked baselines kept, one `lsAll` commit with memory restore, then a reload (9269) |
| 14835 | `destPkgIn` | A submittal's destination list and the destination keys on its items | Object type checks; `destFold` turns names into text and allows known kinds only |
| 17411 | `bandImport` | A band ladder `.json` (`#bandFile`, 1474) | `inTooBig`, `inboundCheck` (17416), `JSON.parse`, then a field allowlist (17423-17433): id reduced to `[a-z0-9]{1,12}` and de-duplicated, name cut to 60 and description to 120, rule one of full/min/skip, colour must match `^#[0-9a-fA-F]{6}$`. Confirm before replacing |
| 11522 | `xlsxRead` | Any `.xlsx` a person picks: the ZIP directory, headers, deflate streams and XML parts | Every directory and header offset is bounds-checked (`need()`); entries inflated with `DecompressionStream('deflate-raw')`; a missing workbook or rels part throws; a shared-string index past the end throws. XML is read with regular expressions |
| 11808 | `importSrc` | The CCaR QPE execution workbook (`#srcFile`) | Staged, and committed only after every tab is read. Cells normalised by `normSrcRow` (dates, amounts by `parseFloat`); year by `parseInt`. Tabs matched by name exactly or after removing non-alphanumerics. Saved with `persistExdb` |
| 13988 | `importBud` | The BAE workbook (`#budFile`), the `Budget Name` column | Header required; names trimmed, filtered and parsed by `budParseName`; de-duplicated; confirm when budgets would be retired. Saved with `persistBud` |
| 14231 | `importCcarRecs` | The CCaR records workbook (`#ccarFile`) | `CCaR No` and `Title` headers required; keys normalised by `ccarNorm`; duplicates and conflicts flagged; values kept as trimmed text |
| 14291 | `importAce` | The ACE cost-estimate workbook (`#aceFile`); the set key comes from the file name | `aceParse` reads fixed columns; appropriation, office and service through allowlists; years 1991-2099; values by `parseFloat`. Confirm before replacing a locked set. Saved with `persistAce` and `persist` |
| 3343, 3857 | `aceBody`; `rlgExecYears`, `rlgCapacity` 3885, `rlgUplScan` 3944, `rlgUplYearsOf` 3790, `rlgPool` 4109 | Imported estimates and execution rows read by panels, by fixed column index (`r[3]` title, `r[9]` amount, `r[18]` office and others) | Text by `String().trim()`, amounts by unary `+`, else 0, dates by the `rlgObYm` pattern |
| 20849 | `posExec` | Execution rows (`EXDB`) aggregated into a snapshot | Amounts by `+r[9]`, else 0; title, service and allocation through `flowTitleKey`, `svcOfBudget`, `isAlloc` |
| 26727 | `takePen` | The board's own file on disk, read through the stored handle; `pubState` taken by pattern | No inboundCheck. Only `writerShape(p.writer)` is used from it |

No file is taken by drag and drop: the row drag (28427-28437) moves rows within the page.

### Browser storage (`localStorage` and IndexedDB)

| Line | Function | Key and what it holds | How it is checked |
|---|---|---|---|
| 1287 | theme script | `spmtTheme` | Allowlist (navy, parchment, blueprint, harbor); anything else removes `data-theme` |
| 3665 | `themeGet`, `uiLoad` (3693-3695) | `spmtTheme`, `spmtMode`, `spmtDensity`, `spmtDetail` | Allowlists (`THEMES`, `UI_MODES`, `UI_DENS`); `spmtDetail` compared to `'1'` |
| 25380, 25384 | top level, `menuGrp` | `spmtMenuGroups` (which menu groups are open) | Must be a plain object; only text values copied; used in equality tests only |
| 6604 | `jrnlSeen` | `spmtSeen` | Coerced to a number |
| 2053, 2058 | `writerKey` | `prio27writerKey` | Must match `^[0-9a-f]{32}$`, otherwise regenerated with `crypto.getRandomValues` (`Math.random` if that fails) |
| 2149, 2268, 2285, 2303, 2324, 2398 | side-store boot | `prio27execdb`, `prio27acedb`, `prio27buddb`, `prio27destdb`, `prio27reprog`, `<key>-cyc`, each against the file's copy | `JSON.parse` in try/catch; the copy with the newer time wins; a small shape check each (`.all`; `.sets`; `rows` a list; `ents` objects with `k`; `entries` a list; `cycles` an object). No inboundCheck |
| 2320 | `_impRep` | `prio27impRep`: the HTML report of a full import, written at 9623 | Read once at opening and removed; shown at the end of opening (31222). Built with `esc()` where it is written (9617-9623) |
| 2351, 2387 | `APPN`, `switchAppn` | `prio27appn`, `prio27<slug>`, and `PUB.only` | Each checked against the `APPNS` keys; default O&M. `switchAppn` writes `prio27appn` directly, then reloads |
| 2422 | `cycStoreOf` | Other appropriations' `-cyc` keys and the file's `cycDb.byAp` | `cycles` must be an object |
| 2460 | `DATA` | `.dataPack` inside `localStorage[<key>]` | Only `_hasData` (items or services not empty). No inboundCheck |
| 6338 | boot restore | `localStorage[<key>]`, the whole store, to `applyStore` | `JSON.parse` in try/catch; `applyStore` runs `svcGuardImport` and `applyState`'s repairs. No inboundCheck |
| 6418 | `persist` | Writes the whole store to `localStorage[<key>]` | Refused while a locked cycle is on screen; a full-storage error is reported |
| 2205, 2234, 2256 | `lsSet`, `lsAll`, `lsPutBack` | Every other write | One funnel: staged during an import, marks the board unsaved, records and reports a refused write. `lsAll` writes several keys all or nothing and rolls back |
| 6766 | `whoIs`, `whoAmI` | `prio27who`: the editor name the person types | Trimmed and cut to 30 characters. It is stamped into the store, journal entries, packages and submittals |
| 6795 | `baseGet`, `baseSet` | `<key>.base`: the saved-copy checkpoint | Parsed in try/catch; must be an object; used as times and flags |
| 6816, 6845 | `keepAside`, `keptPutBack` | `<key>.kept`: one kept-aside store, as meta + newline + store JSON | Meta parsed in try/catch; the store goes to `applyStore`. No inboundCheck |
| 6937 | `pubsFor` | Every other appropriation's store, embedded into every saved board | Shape test (years or order); newer time wins. No inboundCheck |
| 6949 | `_fhPut`, `_fhGet` | IndexedDB `prio-fh`, store `h`, key `FY27 Consolidated Prioritization Board.html` (`FNAME`, 6762): the saved file's handle | Permission asked again before each use (8221) |
| 7140, 7150 | `myPmo`, `pickMyPmo` | `prio27pmo` | `pickMyPmo` stores only a value from `pmoChoices()` |
| 8557, 8587 | `pkgStoreOf`, `pkgPut` | Another appropriation's store (or `PUBS`); written with `lsSet` | Shape test only |
| 9662 | `impMixed*`, `fullImportUndone` | `prio27impMixed`: a failed import's hold | Parsed in try/catch; list checks; used as a flag and key list |
| 11984 | `budSrc` | Every appropriation's stored budget list | `rows` a non-empty list; newest wins; names parsed again by `budParseName` |
| 14810, 14830 | `destMigrate`, `flowEntUseMap` | Other stores and cycle stores; writes `DEST_KEY` and `CYC_KEY` | Type and list checks; entries without `k` skipped; kinds allowlisted; names turned into text |
| 17241 | `bandsAdoptPending` | `prio27bands_<slug>`: a ladder another appropriation left pending | Read, parsed and removed (17243); adopted when `bands` is a non-empty list and its time is newer (17245-17246) |
| 17354, 17382 | `bandPeers`, `bandCopyAll` | Other stores and pending ladders. `bandCopyAll` rewrites each other appropriation's stored store (17385-17392) | After a confirm (17369); refusals reported by `lsSet` |
| 18722 | `cycLock` and others | Writes `CYCDB` (18722, 18738, 18747, 18778) | Gated by `cycBlock` |
| 19118 | `fydpStoreLocal` | Another appropriation's store, or `PUBS` when newer | Years present or order a list |
| 19149 | `fydpFrameMem` | Copies every `localStorage` key and value of this origin, except `spmtLiveKey`, `spmtLive` and `*.kept`, into the frame's memory | See "Frame messages" |
| 20430 | `spDefs` | Other stores' PPBE positions, offered as budget sources | `years` must exist |
| 22241 | `rpSvcsOf` | Other stores' service lists | A non-empty list of text |
| 25556, 25590 | `sideBootCheck` | `prio27sideOpen`: hashes of what opening wrote | Reset unless it matches this file's time; values only compared or hashed |
| 26048, 26062 | `liveCfg`, `liveSaveCfg` | `spmtLive`: live-view settings (address, folder, page id, mode, interval, on) | Parsed in try/catch; defaults for missing fields; used as stored. The https-only rule is applied where the address is typed (`liveSet`, 26093-26099) |
| 26081, 26084 | `liveKey`, `liveSetKey` | `spmtLiveKey`: the live-view API key or bearer token, in plain text | Trimmed. Kept per machine, never in the board file (26025) |
| 26181 | `driveIdb`, `drivePut`, `driveGet` | IndexedDB `prio-fh`, key `spmt-live-dir`: the shared folder's handle | Permission queried on each use (`driveDir`, 26235-26253) |
| 26426 | `_driveBase` | `<key>.base`, the folder checkpoint | Copied; coerced with `+` on use |
| 28025, 28091, 28797 | `diagSecrets`, `diagStoreOf`, `exportCSV` | Every `prio*`/`spmt*` key (the redaction list); per-appropriation stores for counts | Try/catch; shape tests |
| 31257 | `loadShared` | `spmtSidecar`: opt-in for the sidecar file | Strictly `=== '1'` |
| 11848, 12755, 14045, 14321, 14899 | `importSrc`, `driveCheck`, `importBud`, `importAce`, flow setters | Writes after an import or a setting: `persistExdb`, the folder handle and name, `persistBud`, `persistAce`, `persistDest` | Through `lsSet`; a refused write is reported |

### Shared folder (File System Access API)

Every read of a folder file goes through `driveParse` (26451-26455): `inboundCheck`, then `JSON.parse`.

| Line | Function | What comes in or goes out | How it is checked |
|---|---|---|---|
| 12517, 26194 | `driveOpenPicker`, `drivePick` | The folder, chosen in `showDirectoryPicker({mode:'read'})`; its name kept in `spmtLive` | The browser's own permission prompt |
| 12537, 12572, 31291 | `driveAutoConnect`, `driveConnectNow`, boot timer | On opening and on a click: pulls the store, execution rows, estimates and the reprogramming log | Only when write permission is already granted (automatic) or after a click |
| 12627 | `driveWriteTest` (from 12647, 12759) | Writes, reads back and removes `spmt-check-xxxxx.txt` | Content must start with `ok ` |
| 12471 | `liveLeaving` | On leaving the page, removes this board's lock file | Only in folder mode with the live view on; errors ignored |
| 26279 | `snapList` | Lists `history/` names | `snapMatch` pattern, year and appropriation escaped |
| 26343, 26349 | `driveWrite`, `driveRead` | Raw write (`createWritable`) and raw read of a named file | Callers decide; reads then go through `driveParse` |
| 26359 | `drivePoll` | Peer lock files `spmt-<fy>-<ap>.lock.json` and peer boards `spmt-<fy>-<ap>.json`; `ap` from the file name | `driveParse`; `liveTooNew` for boards; a lock counts when `by` is set and its time is fresh. Peer stores kept for the Live panel |
| 26401, 26408 | `driveHeartbeat`, `driveRelease` | Writes and removes this user's lock file `{by, ts, fy, ap}` | Outbound; errors ignored |
| 26439, 26457 | `driveStoreRead`, `driveStorePull` | This appropriation's folder copy, adopted through `applyStore` | Only `NotFoundError` means absent; `driveParse`; requires `store`; `liveTooNew`; time against the store and the recorded base; refused with unsaved work; `_hasPack`; `keepAside` first; `svcGuardImport` |
| 26551, 8195 | `_driveStorePushRun` (the folder save, through `saveSerial`) | Writes `livePayload`: `pkgStrip(MS)` plus `by`, `ts` and `writer` | Target fixed before the first wait; a copy it cannot read is never overwritten; base-time clash check; `writerMay`; the folder's copy kept in history first (26617) |
| 26670 | `_driveResolveRun` | Keeps theirs in history and saves over it, or adopts theirs | Confirm; `liveTooNew`; `_hasPack`; `keepAside` |
| 26777 | `driveRestore` | A history copy chosen from a list | Name must match the pinned year and appropriation; `driveParse`; `liveTooNew`; `ap` and `fy` must equal the pinned values; the current copy kept first |
| 26860, 26874 | `driveExecPush`, `driveExecPull` | `spmt-exec.json` (execution rows) | Pull: `driveParse`; requires `exec` and a newer time; replaces `EXDB` and saves it to storage |
| 26920, 26942, 26991, 27029, 27078, 27133 | `driveAceFile`, `driveAcePush`, `driveAceReplace`, `aceHistShow`, `aceRestore`, `driveAcePull` | `spmt-ace-*.json`, one per estimate set, and their history copies | `driveParse`; shape (`key`, `set` object, `lines` list); fingerprint. Push only where the folder has none; replace after a confirm and a re-read, history first; restore checks the name against the key (27101); pull stages sets, then merges and saves (27160-27161) |
| 27210, 27238, 27288 | `rpMerge`, `driveRpPush`, `driveRpPull` | `spmt-reprog.json` | `driveParse`; `entries` a list; an entry needs `id`; a newer remote row's fields copied onto the local row; history first on push |
| 22211 | `rpAll` | The reprogramming log shared between boards | Amounts read exactly (`rpAmtOf`, `rpAmtText`, 22284-22320) with a strict pattern and the `IN_MAX_AMT` cap; services checked against their appropriation's list (`rpSvcOf`, 22253) |
| 19129 | `fydpStoreFolder` | Another appropriation's folder copy, read only | `driveParse`; `liveTooNew`; `_hasPack`; used only when newer than the local copy |

### Network

Details of each call are in section 5.

| Line | Function | What comes in | How it is checked |
|---|---|---|---|
| 26070-26076 | `liveNet` | Every live-view request and reply. Uses `window.spmtNet.request` when present (26072), otherwise `fetch` (26073) | The bridge is used whenever it is a function (26068) |
| 26077-26079 | `liveJson` | `JSON.parse` of a reply | Try/catch only. No inboundCheck |
| 27319, 27349 | `confList`, `confPoll` | The Confluence attachment list; each other appropriation's attachment | `JSON.parse` (27363). No inboundCheck, no `liveTooNew`; the store kept for the Live panel |
| 27406, 27429 | `spList`, `spPoll` | The SharePoint folder list; each other appropriation's file | `JSON.parse` (27441). No inboundCheck, no `liveTooNew`; the store kept for the Live panel |
| 27495 | `livePoll` (JSON endpoint) | `GET {url}/state?fy=` | `liveJson`; rows need `ap`. No inboundCheck, no `liveTooNew` |
| 31260, 31269 | `loadShared` | The sidecar state file `prio-state-<slug>.json` | `inboundCheck`, then `JSON.parse` |
| 31301, 8341 | `sharedArrived`, `adoptShared` | The sidecar state, adopted through `applyStore` | Needs years or an order list; not applied over unsaved work; times compared; local work kept aside first (`sharedKeepMine`, 8330) |

### Downloads (files the board writes through the browser)

| Function starts at | Function | What goes out | What is checked first |
|---|---|---|---|
| 6943 | `savedHtmlOf` | Every board file: `SRC0` with `pubState` = `{appns, destDb, execDb, aceDb, rpDb, cycDb, budDb, writer}` | `<` written as `\u003c`; a function replacer, so `$` patterns in the data are inert |
| 8305, 8321 | `publishState`, `publishJson` | The board as HTML (a download when saving in place is not possible), or the raw store JSON | `publishState`: `sandboxBlock` and `cycBlock`. `publishJson`: `cycBlock` |
| 7107, 2448 | `publishPmoCopy`, `pmoCopyHtml` | A PMO copy: the board plus a baseline, with `pubMode` written in | Refused in a cycle view or a PMO copy; confirm. `pubMode` JSON has `<` escaped |
| 7292 | `pmoSubmit` | A submittal JSON `{items, base, added, rank, svc, by, pmo, dest}` | Office scope, required fields on new requirements, a name required; file name stripped to `[A-Za-z0-9 _-]` |
| 8594, 8706, 8726 | `pkgIssue`, `pkgSendBack`, `pkgReturn` | A package JSON `{spmtPkg, dir, ap, seq, by, baseSig, ms}` | `pkgStrip` (8550-8555) removes `execDb`, `aceDb`, `rpDb`, `cycDb` and `sync` |
| 6884 | `keptSaveFile` | The kept-aside work as a board HTML or as JSON | File name through `expName` |
| 9703 | `fullImportRescue` | The board as it was before a failed import, or the imported file's own text | Offers back only text the person imported or the board built |
| 9876, 9849 | `exportOneAppn`, `appnsOnlyIn` | One appropriation as a working board | `sandboxBlock` and `CYCVIEW`; `appnsOnlyIn` writes `</` as `<\/` |
| 4052, 7541, 11408, 13221, 16410, 16786, 16957, 18149, 18959, 19491, 21261, 21459, 28643, 28937, 29252, 31120 | `exportRlgPlan`, `pmoReport`, `crExport`, `exportIdsReq`, `exportFlow`, `exportExView`, `exportSrc`, `exportPlans`, `exportFydpPlan`, `exportCycCompare`, `exportReprog`, `exportFcView`, `exportCSV` (an `.xlsx` despite its name), `exportAceTieout`, `exportExcel`, `exportCoa` | `.xlsx` workbooks built by `buildXlsx` (24522-24622) | Text XML-escaped by `_xesc` (24440: `&`, `<`, `>`, `"`); every text cell is an inline string (24597), so no cell is a formula. `exportSrc` refuses an invalid budget choice (16973) and confirms blank budgets (17015). `exportIdsReq` refuses in a cycle view, in a PMO copy, when `idsCheck` fails, or when the prompt fails `idsFormProblems`. `crExport` is O&M only |
| 18391, 28853 | `exportProposedOrder`, `execSynopsis` | `.csv` files | Every cell through `csvCell` (18384-18390): a leading apostrophe on a cell that starts (after any spaces) with `=`, `+`, `-`, `@` (or their full-width forms) or with a tab, CR or LF, unless it is a plain number; quotes doubled; a BOM first |
| 17403 | `bandExport` | The band ladder as JSON | File name stripped to `[A-Za-z0-9 &-]` |
| 24696 | `exportPPT` | A `.pptx`: the template parts copied verbatim plus generated slides | Slide text through `_xesc` |
| 16092 | `flowPng` | The funds-flow chart as PNG: its SVG serialized, drawn on a canvas | File name stripped to `[A-Za-z0-9 ]` |
| 28191 | `diagSave` | The diagnostics text file | Messages through `diagClean` (figures become `#`, held text an ellipsis). By design it holds no dollar figure, title, name, CCaR record, PID or budget name (27937-27939) |

### Clipboard

| Line | Function | What goes out | How it is checked |
|---|---|---|---|
| 12509, 27647 | `driveCopyHint` | The data-folder path worked out from the page's address | Derived from `location.href` only |
| 13482, 14174 | `pfCopy`, `divCopy` | The pre-flight list or the reconciliation as plain text (titles, budget names) | Tags removed with a pattern |

The board never reads the clipboard and has no paste handler.

### Frame messages

The five-year plan reads each other appropriation by running a copy of this page in a hidden frame.

| Line | Function | What happens | How it is checked |
|---|---|---|---|
| 19165-19183 | `fydpFrameHtml` | Builds the frame's page from `SRC0`: `pubState` replaced with the side stores and one appropriation's slot, and a shim script inserted before the first `<script>` (19181). The shim gives the frame an in-memory `localStorage`, removes `indexedDB`, stubs `alert`/`confirm`/`prompt`, and answers with `parent.postMessage(r,"*")` (19178) | Both JSON blobs have `<` escaped; the replacement uses a function |
| 19149-19160 | `fydpFrameMem` | The frame's in-memory storage: a copy of every `localStorage` key of this origin except `spmtLiveKey`, `spmtLive` and `*.kept`; `prio27appn` set; the folder copy added when newer | |
| 19190-19214 | `fydpFrame` | `<iframe sandbox="allow-scripts">` (19206), hidden off screen, filled with `srcdoc` (19209); a `message` listener (19203) | A message is taken only if `e.source` is the frame's window, the data is an object, and its `nonce` matches. Listener and frame removed when done; 120-second limit (`FYDP_FRAME_WAIT`) |
| 19217-19232 | `fydpTake` | The frame's answer | `ap` must match; `build === BUILD`; no lost data or restore error; `ts` equal to the expected stamp; `D.src` the source asked for; `held`, `years` and each `proj[y].reqs` must be lists |

There is no other `message` listener in the file.

### Page address

| Line | Function | What is read or done | How it is checked |
|---|---|---|---|
| 12485-12506, 12691 | `driveWinPath`, `driveHint`, `driveCheck` | `location.href` and `location.protocol`, turned into a Windows path | Only `file:` addresses; `decodeURIComponent` in try/catch |
| 28119-28120 | `diagReport` | `location.protocol`, `location.host`, and the browser name and major version (`diagBrowser`, 28080-28086) | Reduced to a phrase ("a file on this computer…"); protocol letters only |
| 2387, 9269, 9636, 9991, 10022, 10032, 26532 | `switchAppn`, importers, `driveStorePull` | `location.reload()` after a switch or an import | The reload reads browser storage again (6338) |

The board never reads the query string, the fragment, `window.name` or the referrer.

### New windows

| Line | Function | What is opened | How it is checked |
|---|---|---|---|
| 28367-28388 | `linkOpen` | An `<a target="_blank" rel="noopener">` to `encodeURI(name)` (28381), clicked by script. The name is typed in `linkSet` (28347) and kept in `MS.links`, part of the saved store | `linkOpenable` (28346): the name must end in `.htm` or `.html` |

There is no `window.open` in the file.

### The file itself, and typed text

| Line | Function | What comes in | How it is checked |
|---|---|---|---|
| 1972 | top level | `SRC0`, the page's own markup | Taken before the script changes the page |
| 2034 | top level | `PUB = JSON.parse(pubState)`, this file's own data | Try/catch; a failure noted in `_bootLost`. No inboundCheck: it has the trust of the file's own code |
| 2049-2050 | `writerShape` | `PUB.writer` `{by, fp, t}`, and the same record from the file on disk at save time (8271) | `fp` text of 1-64 characters; `by` turned into text and cut to 60; `t` a number |
| 2103 | top level | `PMODE = JSON.parse(pubMode)` | Try/catch; `PMODE.ap` checked against `APPNS` (2350). `PMODE.ts` is used in storage key names (2301, 2372) |
| 6368 | boot | `PUB` adopted when newer than browser storage | Years or order list, then `applyStore` |
| 2025-2033 | error listeners | `error` and `unhandledrejection` messages | Through `diagClean`; kept in memory only, the last 50 |
| 6401-6412 | `saveSerial` | `navigator.locks.request('orbit-save')`, one save at a time across tabs | Falls back to an in-page queue |
| 8209-8304 | `_saveInPlaceFileRun` | The target file read back before a save (`getFile().text()`, the `pubState` pattern, `JSON.parse`) | Refuses to write when it cannot read the file or it holds no readable `pubState`; the writer rule (`writerMay`); a confirm when another save came first. Only `ts`, `by` and `writer` are read from it |
| 18575-18610 | `helpSections`, `helpBody` | The in-file `<template id="helpDoc">`, written with `innerHTML` (18607) | Shipped content, not data |
| 24665-24669 | `_b64bytes` | `atob` of the template parts (24627) | Shipped content, not data |
| 6687 | `uiPrompt` | Typed input: editor name, office name, base year, grouping, CCaR number, appropriation pick | Each caller checks its own input. Office and grouping names typed here are not held to the door's `IN_NAME_BAD` rule |
| 3228, 3237, 4442, 4457 | `svcAdd`, `svcRen`, `rlgSet`, `rlgAddManual` | Typed service names, credit names, a plan label | Trimmed; service names checked for duplicates without case; the label cut to 80 |
| 10387-10446, 10966 | `coaAddGroup`, `coaRenGroup`, `coaAddRec`, `editPid` | Typed grouping names and record numbers; the PID | Trimmed; empty refused; duplicates refused; `editPid` through `codeTake('pid')` |
| 10662 | `rcnSet` | Typed RCN, EEIC and title | `codeTake` refuses an over-long code; EEIC upper-cased; title cut to 80. Pattern checks warn only |
| 15189, 15393 and others | flow setters | Typed funds-flow settings | `flowSetOther` through `amtReadM`; `flowSetPseudo` a year in 1901-2199; rule, category and name setters store text as given |
| 20912, 20995 and others | `posTake`, `posAsk`, `bmAddSrc`, `editCcar`, `pickCostElem`, `clinAdd`, `clinSetField`, `wbsQuick`, `editTitle`, `editRecName` | Typed labels, names and codes | Codes through `codeTake` (refused over the limit, never cut); names trimmed and cut (`bmAddSrc` 40, `posTake` 60); a cost element must be in `COST_ELEMS` |
| 25207 | `render` | The search box `#q` | Used only for lower-case substring matching |
| 25466 | keydown handler | Keys on elements with `role="button"` | Sends a click only for non-native `role="button"` elements; Escape closes menus |
| 28347 | `linkSet` | A typed companion-tool file name | Trimmed |
| 16547 and others | `oblCurve`, `exBody`, `qpeCoverage`, `spGather` | Execution rows (`EXDB`); `normSrcRow` (11783) keeps raw cell text except month, date and amount | `oblCurve` checks months with a pattern and coerces amounts |
| 18763 | `cycMigrateLegacy` | `MS.baselines` from the loaded store, turned into cycles | Each entry must be an object whose key is not already a cycle |
| 19814 | `cycView` | A cycle's stored years, deep-copied and run through `applyState` | The cycle must hold years; `cycRcnOf` keeps RCN entries that are objects with a text `k` (19850) |
| 20495 | `pmoDetail`, `spBodyDraw`, `fydpAceSum` | Imported estimate lines (`ACEDB.sets`) | Not checked here; values summed |
| 22015 | `bmPpVec` | `MS.ppbe[key]`: PPBE positions from the saved file or packages | Only the services the position lists are applied |
| 22362 | `rpMigrate` | `MS.years[y].reprog`, an older per-year log | Copied with `Object.assign`, given a new `ap`, `fy` and `id`, then saved |
| 18651-18654 | `blStore`, `blLbl`, `blList` | Cycle keys from `CYCDB.cycles`, made by locking, by full imports and by other appropriations' cycle stores. `blLbl` turns a key (a cycle name and a year) into its label | No format check on a key; the door refuses only the three forbidden names |

---

## 5. Network use

**All HTTP from the page goes through two functions.** `liveNet` (26070-26076) for the live view, and
`loadShared` (31247-31273) for the sidecar state file. A code scan finds no other `fetch`,
`XMLHttpRequest`, `WebSocket`, `EventSource` or `sendBeacon`, and no external URL in any `src` or `href`.

**The Electron bridge.** `liveNet` uses `window.spmtNet.request(url, opts)` instead of `fetch` whenever that
function exists (26067-26072). Comments say a packaged desktop build provided it, outside the browser's
cross-origin rules. That build is not in this repository and is not part of today's deployment; in Edge the
bridge is absent and `fetch` is used.

**The shared folder is not network code.** It uses the File System Access API on a folder the person picks.
If that folder is synced by OneDrive or SharePoint, the sync client moves the files, outside the board.

**The live view is off by default.** Its settings live in `spmtLive`, per machine (`liveCfg`,
26045-26060): `on` false, `mode` `drive` (the shared folder), `url` empty, `every` 30 seconds. Turning it on
in the Confluence, SharePoint or JSON-endpoint mode needs an address (26117-26118). `liveSet` refuses an
address that does not start with `https://` when it is typed (26093-26099). When it is on, `liveStart`
(26124-26131) runs `liveTick` (26135-26155) every `max(10, every)` seconds: in folder mode it saves first,
then it calls `livePoll`. **Publishing** to Confluence, SharePoint or the JSON endpoint happens only from the
⬆ Publish now button (27764).

**What a publish sends** (`livePayload`, 26158-26163): `{v, build, ap, fy, by, ts, store}`, where `store` is
`pkgStrip(MS)`: the whole appropriation store less the side stores (execution rows, estimates, the
reprogramming log, cycles and the package ledger). The code calls this data CUI (comment at 26094).

**The key.** `spmtLiveKey` (26025), typed in the Live panel and kept per machine in browser storage. When a
key is set, Confluence and SharePoint requests send it as `Authorization: Bearer` and omit cookies; when no
key is set they send the browser's cookies for that site (`credentials: 'include'`). The JSON endpoint gets
it as `x-api-key` and never cookies.

| Function (lines) | Mode | Destination | When it runs | Credentials | Body sent | On by default |
|---|---|---|---|---|---|---|
| `confList` (27319-27330) | Confluence | `GET {url}/rest/api/content/{page}/child/attachment?limit=200&expand=version` | Before each Confluence publish and poll | Bearer key, else the site's cookies (`confHdrs` 27311, `confCreds` 27318) | none | No |
| `confPublish` (27331-27348) | Confluence | `POST {url}/rest/api/content/{page}/child/attachment`, or `…/{id}/data` to update | Publish now | As above, plus `X-Atlassian-Token: nocheck` (27344) | Multipart: `spmt-<fy>-<ap>.json` = the payload; a comment with appropriation, year and editor name | No |
| `confPoll` (27349-27368) | Confluence | `GET confBase()` + each attachment's `_links.download` path, as the server's list gives it, for every other appropriation | Each refresh: the timer and ↻ Refresh now | As above | none | No |
| `spDigest` (27393-27404) | SharePoint | `POST {url}/_api/contextinfo` | Before a publish; kept 20 minutes | Bearer key, else the site's cookies (`spHdrs` 27385, `spCreds` 27391) | none | No |
| `spList` (27406-27414) | SharePoint | `GET {url}/_api/web/GetFolderByServerRelativeUrl('{dir}')/Files?$select=Name,TimeLastModified,ServerRelativeUrl` | Each refresh | As above | none | No |
| `spPublish` (27415-27428) | SharePoint | `POST …/Files/add(url='spmt-<fy>-<ap>.json',overwrite=true)` | Publish now | As above, plus `X-RequestDigest` (27421) | The payload | No |
| `spPoll` (27429-27446) | SharePoint | `GET …/GetFileByServerRelativeUrl('{dir}/{name}')/$value` for every other appropriation | Each refresh | As above | none | No |
| `livePublish` (27482) | JSON endpoint | `POST {url}/state` | Publish now | `x-api-key` if set (`liveHdrs` 26167-26171); `credentials: 'omit'` | The payload | No |
| `livePoll` (27507) | JSON endpoint | `GET {url}/state?fy=<year>` | Each refresh | As above | none | No |
| `loadShared` (31260-31263) | Sidecar, page opened from `file:` | XHR `GET prio-state-<slug>.json?t=<time>`, beside the board (`STATEFILE`, 2572) | At opening, only when `spmtSidecar` is `'1'` | None set by the code | none | No |
| `loadShared` (31269-31270) | Sidecar, page served over `http(s)` | `fetch('prio-state-<slug>.json', {cache:'no-store'})`, relative to the page | At opening, every time | `fetch` defaults (same-origin cookies) | none | Yes, when served over http(s); not in today's `file://` use |

Replies: Confluence and SharePoint files are parsed with `JSON.parse`, the JSON endpoint's with `liveJson`;
none of them passes the import door or `liveTooNew`. The sidecar passes `inboundCheck`. Each peer's store is
kept whole in `LIVEDB` and summarised in the Live panel.

---

## 6. What stays on the computer

### Browser storage

Everything below stays in the browser profile after the tab closes, until it is removed. In a PMO copy the
appropriation keys and `prio27destdb` carry a `-pmo<publish time>` suffix (2301, 2371-2375).

| Key | Written by | What it holds |
|---|---|---|
| `prio27om`, `prio27ff`, `prio27sp`, `prio27opn` | `persist` (6418) | Each appropriation's whole store: every year's requirements, money, notes, impact statements, the journal, snapshots, positions |
| `<key>.base` | `baseSet` (6796) | The saved-copy checkpoint: times and flags |
| `<key>.kept` | `keepAside` (6816) | One kept-aside copy of a whole store |
| `<key>-cyc` | `persistCyc` (2416) | Locked PPBE cycles |
| `prio27execdb` | `persistExdb` (2265) | Imported CCaR execution rows, all appropriations |
| `prio27acedb` | `persistAce` (2338) | Imported cost estimates |
| `prio27buddb` | `persistBud` (2294) | The BAE budget list |
| `prio27destdb` | `persistDest` (2321) | Destinations |
| `prio27reprog` | `persistRp` (2335) | The reprogramming log |
| `prio27bands_<slug>` | `bandCopyAll` | A band ladder waiting for another appropriation |
| `prio27impRep` | `fullImportText` (9623) | The report of a full import, until the next opening |
| `prio27impMixed` | the import hold (9717) | A failed import's file name and keys |
| `prio27sideOpen` | `sideBootCheck` | Hashes of what opening wrote |
| `prio27appn` | `switchAppn` and importers | The appropriation on screen |
| `prio27who` | `whoAmI` | The editor name the person typed |
| `prio27pmo` | `pickMyPmo` | A PMO copy user's office |
| `prio27writerKey` | `writerKey` | A random key; its signature is this browser's writer fingerprint |
| `spmtLive` | `liveSaveCfg` | Live-view settings: endpoint address, folder name, page id |
| `spmtLiveKey` | `liveSetKey` | The live-view API key or bearer token, in plain text |
| `spmtTheme`, `spmtMode`, `spmtDensity`, `spmtDetail`, `spmtMenuGroups`, `spmtSeen` | preference setters | Display preferences |
| `spmtSidecar` | set by hand | The opt-in for the sidecar file |
| IndexedDB `prio-fh`, store `h` | `_fhPut` (6949), `drivePut` (26188) | File System Access handles: the saved board file (key `FY27 Consolidated Prioritization Board.html`) and the shared folder (key `spmt-live-dir`) |

No cookies, `sessionStorage`, Cache Storage or service worker are used. File › Save diagnostics reports how
much browser storage the board's keys take (`diagReport`, 28133-28136).

### Files written

- **The board file** the person saves to, in place (section 1).
- **Downloads**, to the browser's download folder: board copies (`.html`), PMO copies, kept-aside work,
  rescue files, one-appropriation boards, state and package and submittal files (`.json`), band ladders
  (`.json`), workbooks (`.xlsx`), CSV files, the deck (`.pptx`), the chart (`.png`), diagnostics (`.txt`).
- **The shared folder**, when connected: `spmt-<fy>-<ap>.json` (the folder copy), lock files
  `spmt-<fy>-<ap>.lock.json`, `history/` copies (up to 24 spaced copies per appropriation, `SNAP_KEEP`
  26257, plus recent ones), `spmt-exec.json`, `spmt-ace-*.json` and their history copies,
  `spmt-reprog.json`, and a test file `spmt-check-xxxxx.txt` that is removed straight after.
- **Remote copies**, only if the live view publishes: Confluence attachments (Confluence keeps versions),
  SharePoint files, or whatever the JSON endpoint stores.

### Removing ORBIT data from a shared machine

This bears on media sanitization (NIST SP 800-88 Rev. 1, as the owner's security team named it; section 10).
**What the board offers today:** no single
"remove ORBIT data from this computer" command. It removes some things in normal use: the import report
after reading it (2320), kept-aside work when discarded (6902-6908), the import hold when cleared (9726,
9837), the live key when it is blanked (26085), a pending ladder when adopted (17243), the folder test file
(12633), and its lock file on leaving (12471-12478). It does not overwrite anything before deleting it. A web
page cannot sanitize a disk; that falls to the machine's owner.

**What a person must do:**

1. Close every ORBIT tab, so no save or automatic save writes again.
2. Clear the browser storage for the place the board was opened from. In Edge, clearing **Cookies and other
   site data** removes `localStorage` and IndexedDB. Then confirm it is gone: open the blank board; it
   should open as an empty shell with no restored work, and Save diagnostics should show no storage in use
   by the board.
3. Delete the board files and every download listed above. The browser's download list keeps the names.
4. Leave the shared folder and its `history/` to the team: those copies are shared records. Synced and
   SharePoint locations keep their own version history and recycle bin, outside the board.
5. Remove remote copies the live view published, on the Confluence page, SharePoint folder or endpoint.

---

## 7. HTML output

**The rules** (`AGENTS.md`, "Files from outside are data, never code"):

- **`esc()`** (28469) is for text written into HTML and for quoted attribute values. It replaces `&` with
  `&amp;`, `<` with `&lt;`, `"` with `&quot;` and `'` with `&#39;`. It leaves `>` alone.
- **`jsa()`** (28475) is the only way a value goes into inline handler code: `esc(JSON.stringify(String(v)))`,
  with `null` and `undefined` as `''`, so the value reaches the handler as one string literal. `npm run check`
  fails on a value concatenated into handler code any other way.
- **`setStat()`** (6707-6718) writes its argument into the status line with `innerHTML` (6712). Its callers
  pass HTML, so each must escape the values it puts in.
- **Helpers that take HTML by contract** insert their arguments as given, so each caller must escape: `mi`,
  `grp`, `recSel`, `recBtn`, `inspField`, `driveCheckSay` (lines in section 3).
- **Band colours** written into a `style` attribute go through `readableOn` (2962), which turns any value that
  is neither a hex colour nor a `var(--name)` theme token into a neutral grey.
- **Exports.** XML text through `_xesc` (24440); CSV cells through `csvCell` (18384-18390). See section 4,
  "Downloads".
- **No code from strings.** A scan of the running scripts finds no `eval`, `new Function` or timer given a
  string. One call goes through `window[...]` (`fldSave`, 18556), naming a setter from the fixed `FLD_PARTS`
  list. One `setAttribute('onclick', 'pmoSubmit()')` (25636) sets a fixed string.

**The sink list.** `node tools/review/sinks.mjs` writes `review/sinks.csv`: every place in the board's source
where a string is handed to the browser as HTML, with line, column, kind, the named functions around it,
whether it sits in code or in a string, and the source line. It holds no verdicts. Counts at `6de4432`:

| Kind | Count |
|---|---:|
| `innerHTML =` | 184 |
| `innerHTML +=` | 1 |
| `setStat` call (writes with `innerHTML`) | 349 |
| `srcdoc` (the five-year plan's frame, 19209) | 1 |
| `DOMParser.parseFromString` (`diagPlain`, 27952: a separate document, text read back) | 1 |
| `outerHTML =` or `+=`, `insertAdjacentHTML`, `document.write`, `createContextualFragment`, `setHTMLUnsafe` | 0 |
| **Total** | **536**, in 237 functions |

Two more matches sit in comments (5747, 19811) and are not listed. A function that builds an HTML string and
returns it is not a row: its string becomes markup where it reaches one of the sinks above.

**The classification of each sink** (escaped, fixed text, numbers only, HTML by contract, or open) **is in
the owner's private annex**, not here (section 11).

---

## 8. What the tests prove, and what they do not

### What runs

| Check | Command | What it proves |
|---|---|---|
| Invariants | `npm run check` (`tools/check.mjs`) | The script parses; the six appropriation tables agree; the save path can find its target; no board data is committed; nothing external is referenced; no value is concatenated into handler code without `jsa()`; dialogs have the one shape the dialog controller drives |
| 8 jsdom suites | `npm run audit` | A start-up check (`boot-same.mjs`), then the eight suites: `audit.mjs` (exports), `audit-ppt.mjs`, `audit-other.mjs`, `audit-board.mjs`, `audit-import.mjs`, `audit-recon.mjs`, `legacy-fsrc.mjs` and `audit-hostile.mjs`. They drive the real board's code in jsdom and check every printed figure, the import paths, the round trips and the refusals |
| The hostile board | `audit-hostile.mjs` (jsdom) and `npm run hostile` (`tools/hostile-render.mjs`, Chromium) | Every hostile shape at every door its file type uses is refused, with browser storage and the store unchanged; every file the board writes passes the door; a board full of script-shaped text (`tools/export-audit/hostile.mjs`) is opened screen by screen, and no planted value becomes code. In Chromium an event handler in planted markup would also run, and is counted |
| Browser checks | `npm run verify:grid` | The Chromium finder's self-test, then 13 checks in Chromium driven by `playwright-core`: layout, menus, panels, keyboard, dialogs, the five-year plan's frames (`tools/fydp-frames.mjs`), the hostile render |
| Round-trip fuzz | `npm run fuzz` (`tools/roundtrip-fuzz.mjs`) | Fills every container the board holds with awkward values (quotes, a literal `</script>`, long text, unicode), then saves, reopens, saves again, copies years and runs a PMO copy round trip. Nothing may be lost, and every board and PMO copy it saves must pass the door |
| Mutation sweep | `npm run validate:math` (the gate) | 1,139 deliberate code changes in `tools/export-audit/mutate.mjs`. Each must be caught by a suite, and each must still apply to the code, or the gate fails. 42 of them break the door and the escaping (`door-*`, `esc-quote`, `jsa-*`, `draw-*`) |
| Money map | `npm run money-map`, `tools/money-map.json` → `tools/money-map.md` | 47 money surfaces, 329 cells (surface × dimension): 123 proven (117 to the dollar, 6 at the surface's display precision), 206 not applicable, 0 open |

The full gate takes about six hours. Its result for v1.99 is recorded in `review/builds.json` (`gate: pending`
when this guide was written).

### What they do not prove

- **jsdom is not a browser.** It has no layout and its HTML parser differs from Chromium's (it drops markup
  inside a `<select>`). The harness hands it the program text whole, so a `</script` or `<!--` inside the
  main script would not be noticed there; only the Chromium checks would see it.
- **Folders and files are stand-ins.** The shared folder is an in-memory directory handle, and the board
  file a stand-in file on disk. No test runs real OneDrive or SharePoint sync, file locking, permissions or
  version history.
- **No Windows, Edge, SharePoint or Office.** The browser checks run Chromium on Linux. Exports are read back
  as XML; no test opens them in Excel or PowerPoint.
- **The network transports are untested.** Nothing in `tools/` names `confList`, `confPoll`, `spList`,
  `spPoll`, `livePoll` or `livePeerSum`. The Electron bridge is not tested.
- **The hostile fixture does not cover every field.** It plants script-shaped text in the fields it knows,
  plus one hostile requirement id, service name and office name. It does not cover every field an imported
  file, browser storage or a network reply can carry. The owner's private annex lists the gaps found in the
  6 Oct review.
- **What a mutation sweep measures.** It shows the tests notice a change to the code. It does not show the
  code is safe against an input the tests never try.

---

## 9. Threat model (today's deployment)

> Written for today's model: one HTML file opened in Edge from a SharePoint or OneDrive location. **Revise it
> once the deployment option is chosen.** A hosted web application would add a server, sign-in, sessions and
> transport security, and would change the storage origin and how the board saves.

### Assumptions

- The reviewed blank board is trusted code. A saved board is trusted only as far as `which-build.mjs` shows
  its program is a reviewed release (section 2).
- The browser, the operating system and the person's account are trusted. A page cannot defend against
  code already running with the person's rights.
- The shared folder's permissions decide who can write there. ORBIT's writer check (2036-2091) is
  cooperative. Its comments say so, and that the guarantee is the folder's permissions.
- Not established here: whether other local pages share the board's browser storage in the deployed Edge
  configuration. If they do, they can read and write everything listed in section 6.

### Assets

| | Asset | Where it lives |
|---|---|---|
| A1 | Budget data: requirements, money by service and year, notes, impact statements, the journal, positions, cycles, execution rows, cost estimates, the BAE list, the reprogramming log. The code calls it CUI | The board file; downloads; the shared folder; remote copies if published |
| A2 | The same data in browser storage: every appropriation's store, kept-aside copies, the side stores | The browser profile (section 6) |
| A3 | The integrity of the money math. Every figure is briefed to decision makers; money is whole dollars | The code; the money map (section 8) |
| A4 | Which program a person runs | The board file (a saved board carries its own code) |
| A5 | Credentials: the live key, and the browser's signed-in sessions the live view uses when no key is set | `spmtLiveKey`; the browser's cookies |
| A6 | The person's work being there tomorrow | The board file, storage, the folder |

### Actors and entry points

| Actor | Can do | Entry points | What the board does today |
|---|---|---|---|
| **A sender of a crafted file** (email, Teams, a shared drive) | Send a board, state JSON, package, submittal, band ladder or workbook that someone imports. Or send a board someone opens directly: that runs the file's own program, and the import door does not apply | Section 4, "File imports"; opening a file at all | The door on every file import; `awdNorm`; `svcGuardImport`; preview confirms on packages and submittals; all-or-nothing commits; `esc()`/`jsa()` on output. `which-build.mjs` names the program in a file before anyone opens it |
| **A peer writing the shared folder** | Write any file in the folder: the folder copy, peers' files, locks, `history/`, execution rows, estimates, the reprogramming log. If the program file sits where they can write, the program too | Section 4, "Shared folder" | `driveParse` runs the door on every read; `liveTooNew`; time and base checks; work kept aside before adoption; history copies before replacement; the cooperative writer check |
| **A compromised Confluence, SharePoint or JSON endpoint** (live view on) | Read every publish; answer every list and file request; decide which attachments the board downloads | Section 5 | Off by default; https-only when the address is typed; the person chooses the endpoint; replies are parsed as JSON and shown in the Live panel |
| **Someone with the machine after the person** (a shared PC, a later user, a lost laptop) | Read browser storage, the IndexedDB handles, the download folder and saved boards. Open the board and see the last work restored | Section 6 | Nothing beyond what the operating system and browser provide. Data stays until removed; the live key is stored in plain text |

### Goals an attacker would have

- Run script in the board's page, which can read and change every appropriation in browser storage (A1, A2).
- Change a figure without anyone noticing (A3).
- Get a person to run an unreviewed program (A4).
- Take or reuse a credential (A5).
- Stop the board opening, or overwrite work (A6).

Whether, and where, any of these can be reached today is in the private annex.

---

## 10. Standards the owner's security team named

The owner's security team asked that the work be measured against:

- NIST SP 800-53 Rev. 5, Security and Privacy Controls;
- the DISA Application Security and Development (ASD) STIG, and the STIGs for the operating system and
  technologies in use;
- DoD Instruction 8500.01, Cybersecurity;
- NIST SP 800-88 Rev. 1, Media Sanitization;
- the Common Weakness Enumeration (CWE) and the MITRE ATT&CK framework.

**Their rule: never fabricate a mapping.** Cite only controls and benchmarks that bear directly on observed
code behaviour, each from the source document. This guide follows that rule by making no mapping at all: it
names no control, STIG requirement, CWE entry or ATT&CK technique.

**The traceability table is not done.** It is planned for v2.00 and is not yet logged in `NEXT-VERSION.md`:
each behaviour this guide lists (every place outside data enters, every network call, what browser storage and
saved files hold, the change journal, the file fingerprint) traced to the specific control, requirement, CWE
or technique it bears on, cited from the source; and, stated separately, what the hosting environment rather
than the board must provide. Which controls fall to the board and which to the platform depends on the
deployment decision in section 1.

---

## 11. The private findings annex

A private findings annex exists. **The owner holds it. It is not in this repository**, and nothing in this
repository may quote it. It holds the classification of each sink in `review/sinks.csv` and the findings
register. Ask the owner for access.
