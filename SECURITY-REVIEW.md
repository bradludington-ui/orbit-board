# SECURITY-REVIEW.md — ORBIT v2.07

The reviewer's guide to ORBIT, for a security reviewer who has never seen it. It says what the program is,
how to prove you hold the file under review, how to read the code, where data comes in and goes out, what
stays on the computer, how HTML is written, what the tests prove, and a threat model.

It holds no findings. Which places are exploitable, how severe they are and how to reproduce them are in a
private annex held by the owner (section 11).

**Where things are named.** The board's main script is divided by 42 section banners, `// §01` to `// §42`,
listed at the top of the script; search the file for `§` and a number to jump to one. This guide names a
place by its banner and its function, then gives the line in `prioritization-board-grid.html` at commit
`f508fdb`, BUILD `v2.07 (25 Oct 2026)`. Lines move with every build; banners and function names do not
(section 3).

**This guide replaces the v1.99 edition.** The v1.99 edition is kept unchanged on the branch
`claude/security-review-kit` (commit `b6f1ffc`), as the record of what the security team was given in
October. What changed in the program since then and bears on review: a Content-Security-Policy (v2.04);
Confluence, SharePoint and the JSON endpoint removed, so the shared folder is the only way boards share
(v2.04); an AI review carried to GenAI.mil and back by hand (v2.04); "Clear this computer" (v2.04); the
PowerPoint deck and its 1.6 MB template removed (v2.05); escape-where-drawn and the import door's key rules
(v2.00); a file written by a newer version refused (v2.02); the reprogramming tracker removed but its log
still carried (v2.02).

---

## 1. What ORBIT is and how it runs today

ORBIT (Out-year Requirements & Budget Integration Tool, formerly SPMT) is a planning board for a
sustainment budget. People rank requirements, place funding by service and year, reconcile against
execution data, and export the workbooks review boards ask for. One board holds four appropriations: O&M,
Full Fund, Initial Spares and OPN.

**It is one HTML file.** `prioritization-board-grid.html`: 35,029 lines, 2,461,036 bytes. There is no build
step, no server and no dependency. The HTML is the source and is edited by hand. Nothing is loaded from
anywhere: no external script, stylesheet, font or image. The favicon is a `data:` URI (line 11). `npm run
check` fails if anything external is referenced.

**It sets a Content-Security-Policy** (line 9, a `<meta http-equiv>` before any script; section 5):

```
default-src 'self' data: blob:; script-src 'unsafe-inline'; style-src 'unsafe-inline';
img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' file: data: blob:;
frame-src 'self' about: data: blob:; object-src 'none'; base-uri 'none'; form-action 'none';
```

**How it runs today.** The team opens the file in Microsoft Edge from a synced folder or a shared drive,
with a `file://` address. The code turns that address into a Windows path to help people find the data
folder (`driveWinPath`, §25, line 13976). Work between saves is kept in the browser's storage.

> **The deployment model is under review.** The owner's security team asked whether ORBIT stays a file
> opened in Edge, or becomes a web application hosted in the Azure IL5 environment (`NEXT-VERSION.md`
> items 100 and 107). This guide describes today's model only. Sections 5, 6 and 9 change most if it is
> hosted.

**What is in the file.**

| Lines | Part |
|---|---|
| 1-11 | Head: charset, the Content-Security-Policy, title, inline SVG favicon |
| 12-1425 | The first `<style>`: theme tokens and the layout |
| 1426-1724 | The second `<style id="uiV2css">`: the left menu and the v2.00 layout layer. Neither style holds `url()`, `@import` or `expression()` |
| 1725-1751 | The theme script, run before the body paints |
| 1753-2480 | Body markup: header, left menu, dialog shells, the grid. Nine hidden file inputs at 1858-1865 and 1957, and one at 2476. The in-file help is a `<template id="helpDoc">` at 2021-2201 |
| 2481 | `<script type="application/json" id="pubState">`: the saved board data (`null` in a release) |
| 2484 | `<script type="application/json" id="pubMode">`: the PMO-copy mode (`null` in a release) |
| 2485-35028 | The main script, §01-§42. It carries the workbook writer's stylesheet as a string (line 26457 starts it) |

**How it saves: by rewriting its own source.**

1. The first statement of the main script (§01, line 2534) records the page's own text once, while it
   loads: `const SRC0 = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;`
2. `savedHtmlOf` (§15, line 7750) builds every board file the page writes: `SRC0` with the body of the
   `pubState` island replaced by `{appns, destDb, execDb, aceDb, rpDb, cycDb, budDb, writer}` as JSON. `<`
   is written as `<`, so the data cannot close the script element, and the replacement is a function,
   so `$` patterns in the data are inert. Save, the PMO copy, the work kept aside and the board as it was
   before a failed import all go through it.
3. 💾 Save (`saveInPlace` and `_saveInPlaceFileRun`, §17, lines 9109 and 9135) uses the File System Access
   API. The first time it asks for the file (`showSaveFilePicker`, line 9151) and keeps the handle in
   IndexedDB. Each time it reads the file back first, refuses to write over a file it cannot read or that is
   not a board, checks who wrote it last (section 9), then writes. In a browser without the API it
   downloads a copy instead. One save runs at a time, in the page and across tabs (`saveSerial`, §13, line
   7085, the Web Lock `orbit-save`).
4. Between saves, each appropriation's whole store sits in `localStorage` (`persist`, §13, line 7105).

So **a saved board is the program and the budget data in one file**, and the program it carries is the one
that saved it. Section 2 says how to check which program that is.

**Ways work moves between people, all by a person's action.**

- **A shared folder** the person picks (File System Access API). The page makes no HTTP request for it.
  This is the only transport the board has (section 5).
- **Files sent by hand:** a board file, a PMO copy, a submittal, an appropriation package, a band ladder.
- **The AI review**, carried by hand: the board writes a request file, the person gives it to GenAI.mil and
  saves the answer, and the board reads the answer back (section 4, "The AI review").

**Words used below.**

| Word | Meaning |
|---|---|
| store, `MS` | One appropriation's whole working state: every fiscal year, the journal, snapshots, positions |
| year state, `S` | One fiscal year's plan inside `MS` |
| side stores | Board-wide lists kept beside the stores: execution rows `EXDB`, cost estimates `ACEDB`, the BAE budget list `BUDDB`, the reprogramming log `RPDB` (carried, no longer shown), locked PPBE cycles `CYCDB`, destinations `DESTDB` |
| `PUB`, `PUBS` | The data read from this file's `pubState` island; `PUBS` holds every appropriation's slot |
| PMO copy | A copy of the board for one office (`pubMode` set, `SANDBOX` true, §02). The office edits it and sends back a submittal |
| submittal | A JSON file an office sends back from its PMO copy (`pmoSubmit`, §16, line 8172) |
| package | A JSON file carrying one appropriation between boards (`pkgIssue`, §18, line 9544) |
| journal | The change log inside the store (§14), with "Put back" |
| the door | The import check, `inboundCheck` and the functions it calls (§19), section 4 |

---

## 2. How to verify you are reviewing the right file

| | |
|---|---|
| File | `prioritization-board-grid.html` at commit `f508fdb6512b4ecdd8d0265b418b7737c9740979` |
| BUILD stamp (line 3181) | `v2.07 (25 Oct 2026)` |
| git blob (`git hash-object`) | `c758c586571ea117d010e9427024c1fd8a8760f2` |
| SHA-256 of the file | `990e0e90289050ebbbf587c9a07d04483af0e84145ad25365d6c26fe58a6d22b` |
| Code fingerprint (scheme `orbit-code-v1`) | `302101da9b334cad932562e284c64f2dff7c76d93dd51e3691945d1672ffdc47` |

`review/builds.json` holds the same values for every release from v1.99 to v2.07, each computed by the tool
below from the release file at its commit.

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
`990E0E90289050EBBBF587C9A07D04483AF0E84145AD25365D6C26FE58A6D22B`.

**With Node (no packages needed).** The review tools in `tools/review/` use Node built-ins only.

```
node tools/review/fingerprint.mjs [board.html ...] [--json] [--canon <file>]
node tools/review/which-build.mjs [board.html] [--builds <builds.json>] [--json]
```

- `fingerprint.mjs` prints the file's SHA-256, its git blob id, the code fingerprint and the script
  fingerprint (the executable scripts alone). `--canon` writes the canonical form it hashes, so two files can
  be compared line by line. Its header says exactly what the fingerprint covers and ignores.
- `which-build.mjs` computes the code fingerprint and looks it up in `review/builds.json`. Its first line is
  the release name, or exactly `UNKNOWN BUILD: not a reviewed release`. Exit status: 0 known, 1 unknown,
  2 could not read. It reads the file and writes nothing.
- The same tools run as `npm run review:fingerprint` and `npm run review:which` (put `--` before any
  arguments).

**What the code fingerprint covers.** Every `<script>` and `<style>` body byte for byte, every element and
attribute (inline handlers are code and are kept), every comment and piece of text, and anything after the
main script. **What it ignores:** the body of `pubState` (the data, written by every save), the body of
`pubMode` (a PMO copy's mode), the object after `const APPNS = ` only when it is plain JSON (line 2956 in
v2.07), `data-theme` on `<html>` (set by the theme script before `SRC0` is taken), and what a browser
rewrites when it serializes a page without changing what it does. The full list is at the top of
`tools/review/fingerprint.mjs`.

### A saved board runs the code that saved it

A user's saved board is `SRC0` plus data (section 1). It carries the program of the build that saved it, and
runs that program when opened. A board saved by an older build runs older code, even on a machine that also
holds the current release.

To check a user's board, run `which-build.mjs` on it:

- A release name from `review/builds.json`, and "a saved board of this release": the program is that
  release's. The data in it is not judged.
- `UNKNOWN BUILD`: the file holds a program not in `review/builds.json`. It may be a release older than
  v1.99, an edited copy, or a save from a browser that wrote into the page. When the scripts alone match a
  release, the tool says so, to show where to look.

Checked for v2.07 (26 Oct 2026, under jsdom): the blank release, a saved board, a PMO copy
(`pmoCopyHtml`) and a one-appropriation board (`oneAppnHtml`) built by the board's own code each name
v2.07.

To move a user's data onto the current program: open the blank board and use **Imports & exports › Import a full
board (new version)…** (`importFullBoard`, §20, line 10815). That reads the old
file's data through the import door and leaves its program behind. It takes boards saved by v1.80 or
later, and refuses one written by a newer version (`inNewerWhy`, §19, line 10700).

**Caveats.**

- The BUILD stamp is one line of text anyone can edit. `which-build.mjs` reports it and never trusts it.
- The canonical form was checked against saves written by the board's own save code under jsdom. It has not
  yet been checked against a save written by Edge. Do that once before relying on it: open the blank release
  in Edge, Save, and run `which-build.mjs` on the saved file.
- A browser extension that writes into the page before `SRC0` is taken puts its change into every save from
  that browser. Those saves will not match; `which-build.mjs` then says the scripts match but the markup
  does not.
- Never trust a fingerprint a board shows about itself. Compute it outside the file.
- Each entry in `review/builds.json` says how far that release was tested (its `gate` field): v1.99 passed
  the full gate with its mutation sweep; v2.00 to v2.07 passed the test suites without a sweep (section 8).
- A release is added to `review/builds.json` by hand when it ships. Nothing yet fails when one is missing.

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
| `board.css` | The two `<style>` bodies |
| `MANIFEST.txt` | The SHA-256 of the board and of each file, one per line in the form `sha256sum` writes |

The three text files are **padded, not cut**: line N of each is line N of the board, and columns are kept.
Whatever belongs to another file is blanked, so a scanner's "board.js line 10674" is board line 10674. The
tool reads the three files back and fails if, laid over each other, they do not give back every line of the
board. It refuses a saved board (one with data in it), so budget data never lands in the working tree.

Until v2.05 the bundle also unpacked the PowerPoint template the board carried in `TPL_PARTS`. v2.05 removed
the deck and the template; the bundle has no template step now. To bundle an older release with its
template unpacked, use the kit at commit `b6f1ffc`.

`node tools/review/sinks.mjs` writes `review/sinks.csv`, the list of HTML sinks (section 7). Both also run as
`npm run review:bundle` and `npm run review:sinks`.

When searching the board itself, cut long lines: `grep -n 'pattern' prioritization-board-grid.html | cut -c1-300`.

### A suggested order

1. The import door (§19) and the importers it guards (§18, §20, §24, §26; section 4).
2. Opening: §01-§04 (the boot of `PUB`, the side stores and the storage layer), §11 (loading a board), §13
   (the start-up restore).
3. HTML output: `esc` and `jsa` (§40, lines 30354 and 30360), `setStat` (§15, line 7448), then
   `review/sinks.csv` (section 7).
4. The shared folder (§25 for connecting, §38 for the engine).
5. The five-year plan's frames (§31, `fydpFrameMem` to `fydpTake`, lines 21439-21525).
6. The PMO copy and the submittal path (§02, §16).
7. The exports: the XLSX writer (§36), CSV (`csvCell`, §29), the AI review request (§41).

### The sections of the board

The banners, as the script lists them, and the lines each spans in v2.07. A banner names what the section
mostly holds; a few functions sit in a section named for its neighbours (the AI review and Clear this
computer are at the end of §41, under their own banner comments).

| § | Lines | Section |
|---|---|---|
| 01 | 2487-2604 | Start-up: `SRC0`, `PUB`, the error log |
| 02 | 2605-2708 | One writer per file; the PMO-copy sandbox flag |
| 03 | 2709-2949 | Browser storage: `lsSet`, `lsAll`, the side stores |
| 04 | 2950-3190 | Appropriation, cycle store and data pack at start-up |
| 05 | 3191-3562 | Fit, not-drawn and Needs attention |
| 06 | 3563-3679 | Money and colour utilities (`readableOn`) |
| 07 | 3680-3932 | Service list editing |
| 08 | 3933-4368 | ACE tie-out, WBS from execution, appearance |
| 09 | 4369-5650 | Funding realignment |
| 10 | 5651-5745 | RCN/EEIC, destinations and services panels |
| 11 | 5746-6551 | Loading a board: `applyState`, `awdNorm`, `svcGuardImport`, `applyStore` |
| 12 | 6552-7009 | Years |
| 13 | 7010-7120 | Start-up restore and saving to browser storage |
| 14 | 7121-7364 | Change journal |
| 15 | 7365-7758 | Save, status line, prompts, the saved file |
| 16 | 7759-9065 | PMO copies: publish, submit, review, apply |
| 17 | 9066-9288 | Outbound gate, in-place save and downloads |
| 18 | 9289-10255 | Import: several boards, appropriation packages, consolidated files |
| 19 | 10256-10795 | The import check |
| 20 | 10796-11390 | Full-board import, one appropriation out, the import router |
| 21 | 11391-11940 | Typed amounts, PMO list, chart of accounts |
| 22 | 11941-12484 | Classification, the landing rule, award dates |
| 23 | 12485-12940 | Spend-plan forecast and continuing resolution |
| 24 | 12941-13956 | Reading workbooks (`xlsxRead`, `importSrc`) |
| 25 | 13957-15038 | Shared-folder connection, budget list, IDS export, pre-flight |
| 26 | 15039-16076 | CCaR, WBS, ACE mapping, BAE import, execution helpers |
| 27 | 16077-18626 | Funds flow |
| 28 | 18627-19194 | Active-year execution and the Spend Plan Source export |
| 29 | 19195-20569 | Decision bands, QPE coverage, proposed order, two spend plans |
| 30 | 20570-20791 | Executive decision walk, written fields, help guide |
| 31 | 20792-23275 | PPBE cycles, five-year spend plan, budget positions, Spruills |
| 32 | 23276-23769 | Snapshots, budget management, CR and forecast panels |
| 33 | 23770-24300 | The lane engine |
| 34 | 24301-24765 | Budget authority, fit chart, trim |
| 35 | 24766-26415 | Row-level editors |
| 36 | 26416-26984 | Export writer: XLSX |
| 37 | 26985-28047 | Team summary, buy lines, main render, menus |
| 38 | 28048-29681 | Live view and shared folder |
| 39 | 29682-30272 | Budget list, diagnostics, IDS panel, companion link |
| 40 | 30273-31207 | Ordering, allocation edits, add and remove; `esc`, `jsa` |
| 41 | 31208-33180 | Excel workbooks; the AI review; Clear this computer |
| 42 | 33181-35028 | Grid inspector, focus, dialogs and the boot render |

### The biggest review hardships

- **One script, one global scope.** The main script runs about 32,500 lines. State is in global `let`/`const`
  names (`S`, `MS`, `PUB`, `PUBS`, `DATA`, `SVC`, `FH`), not properties of `window`. Core helpers sit far from
  their callers: `setStat` §15, `buildXlsx` §36, `diagClean` §39, `esc` and `jsa` §40.
- **HTML built as strings, with inline handlers.** Panels are built by string concatenation and template
  literals and written with `innerHTML`. Whether a value is safe has to be checked term by term (section 7).
  Some helpers take HTML by contract and insert their arguments as given: the menu builders `mi` and `grp`
  inside `syncBtns` (§37), `recSel` and `recBtn` (§35), `inspField` (§42), `driveCheckSay` (§25) and
  `setStat` (§15).
- **Code inside strings.** The five-year plan's frame shim (`fydpFrameHtml`, §31, line 21455) is JavaScript
  written as a string literal and spliced into a copy of the page. Linters and code-only scans do not see it.
- **Dispatch by name.** `fldSave` (§30, line 20712) calls `window[p.set](id, value)`, with `p.set` taken from
  the fixed `FLD_PARTS` list (line 20652). `uiFlyItems` (§42, line 34582) tests `typeof window[fn]` for names
  from fixed text. `render` is replaced by a wrapper (§42, line 33828) after `const renderBoard = render`
  (line 33579), so every `render()` call also runs focus restore, the inspector, menu fitting and the dialog
  controller.
- **Boot code between definitions.** Top-level code runs in the middle of the file as well as at its end, and
  order matters: several reads are guarded against the temporal dead zone.
- **Stale comments.** Comments still mention a card build, a lost Python build script and a packaged `.exe`
  build; they record why code is shaped as it is.

---

## 4. Where data comes in and goes out

"No inboundCheck" means the data does not pass the import door.

### The import check: `inboundCheck`, `inWalk`, `inShapeWhy`, `IN_KEY_BAD`

**Where.** §19, lines 10256-10795. It is called by `importBoards`, `consTakeApply` (§18), `fullImportText`,
`exportOneAppn`, `importState` (§20), `bandImport` (§29), `driveParse` (§38, every shared-folder read),
`aiRead` (§41, the AI answer), `loadShared` (§42, the legacy state file) and `uiSubMany` (§42, several
submittals at once). `inTooBig` (line 10708) refuses a file on its size before any of it is read. A refusal
goes through `inRefuse` (line 10787), one message, and nothing on the board changes.

`inboundCheckOwn(txt, own)` (line 10413) is the same check told whose file it is: `''` a file handed over
(every rule), `'board'` the person's own board brought across by a full import, `'copy'` the team's own copy
in the shared folder or beside the board. The difference is confined to two list rules (repeated RCN/EEIC
keys and destination-list repairs), which an older ORBIT saved without complaint; every other rule applies
to all three.

**What it checks.**

1. **Size.** Text longer than `IN_MAX_BYTES` (64 MB, counted in characters) is refused.
2. **Version.** A board file whose BUILD, or a JSON file whose `build`, is a newer (major, minor) than this
   board's is refused (`inNewerWhy`, v2.02).
3. **What it parses.** If the text starts with `<` (after any white space) or contains `id="pubState"`, it
   parses the first `pubState` island and the requirement lists that `extractPacks` (§18, line 9443) finds.
   Otherwise it parses the whole text as JSON. A part that does not parse is not checked here; the importer
   reports it in its own words.
4. **Every value** (`inWalk`, line 10653, iterative so deep nesting cannot overflow the stack):
   - more than 5,000,000 entries: refused;
   - numbers must be finite and within ±1e15 (`IN_MAX_NUM`);
   - text at most 200,000 characters (`IN_MAX_TEXT`);
   - nesting at most 64 (`IN_MAX_DEPTH`);
   - a key in `IN_KEY_BAD` (line 10293): refused. Since v2.00 that is `__proto__`, `prototype` and every
     name `Object.prototype` carries in this browser (`constructor`, `toString`, `valueOf`, `hasOwnProperty`
     and the rest), read from the browser itself. It is a `Set`, so the test is not answered by the
     prototype it guards.
5. **Recognised shapes** (`inShapeWhy`, line 10417), wherever they sit in the file: a requirement list, a
   year's plan (in a board, a cycle, a snapshot or a package), a band ladder, an office or service list, a
   submittal, a change journal entry. In those shapes:
   - **ids** (`inIdWhy`, line 10352): text of 1-80 characters with no control character, `<`, `>`, `"`,
     `'`, backquote, backslash or `|` (`IN_ID_BAD`, line 10286); not a name in `IN_KEY_BAD`; not beginning
     with two underscores. The keys of the per-requirement maps in `IN_ID_MAPS` (line 10297) and a
     submittal's item keys are held to the same rule;
   - **service, office and band names** (`inNameWhy`, line 10362): text of at most 200 characters with no
     control character, `<`, `>`, `"`, backquote or backslash (`IN_NAME_BAD`), and not a name in
     `IN_KEY_BAD`. Names typed into the board are held to the same rule;
   - **values used as keys** (`IN_VAL_KEYS`, line 10295: `id`, `nid`, `k`, `key`, `grp`, `pmo`, `svc`,
     `ap`): wherever such a field sits, its text value may not be a name in `IN_KEY_BAD`;
   - **amounts** (`inAmtWhy`, line 10369): a number within ±1e13 (`IN_MAX_AMT`), or text that reads as one
     ("1,234,567");
   - **band colours**: a `#` hex colour;
   - **awards**: `awdNorm` in door mode (§11, line 5984);
   - **journal paths**: a path through a name in `IN_KEY_BAD` is refused (`jrnlPathSafe`, §14, line 7230,
     guards Put back the same way);
   - **a link to an earlier requirement** (`prior`): a fiscal year and a requirement id (`inPriorWhy`, v2.06).
6. It only reads. A file it passes goes on exactly as it was.

**What it does not check.**

- **Fields it does not recognise pass unchanged**, as long as they meet the limits in point 4. This is on
  purpose (the comment at the top of §19): a newer version's fields must survive a trip through an older one.
- **Types outside the recognised shapes.** Any JSON value within the limits passes there.
- **Free text.** Titles, events, notes and descriptions may hold any character within the length limit. They
  are made safe where they are drawn (section 7), not at the door.
- **Workbooks.** The `.xlsx` imports do not pass the door. They are read cell by cell (`xlsxRead`, §24, line
  12998); maps keyed by a value read from a workbook are created with no prototype (section 7).
- **Data that arrives another way.** Browser storage read at opening, the kept-aside copy, other
  appropriations' stores, the board's own `pubState`, and the five-year plan's frame replies do not pass the
  door. Each row below says how it is checked instead.

### File imports (a person picks a file)

| Where | Function | What comes in | How it is checked |
|---|---|---|---|
| lines 1858-1865, 1957, 2476 | (markup) | Ten hidden `<input type="file">` elements, each calling an importer with `onchange` | See the importers below |
| §20, 11238 | `importState` | One file (`#stateFile`): a board HTML, a state JSON, a package, a submittal or a consolidated file | `inTooBig`, then `inboundCheck` before any route, then `JSON.parse`. Submittals go to `pmoTake`, packages to `pkgApply`. Some routes reload the page |
| §20, 10815, 10828 | `importFullBoard`, `fullImportText` | One whole board (`#fullFile`) | `inTooBig`, `inboundCheck`, the `pubState` pattern, a BUILD of v1.80 or later and not newer, a confirm per appropriation and one for the whole import. Every storage key written through `lsAll`, all or nothing. Reloads |
| §18, 9291 | `importBoards` | Several boards at once (`#multiFile`) | `inTooBig` and `inboundCheck` on each; one refused file refuses all. Two files for one appropriation are refused. `svcGuardImport` per appropriation; one `lsAll` commit |
| §18, 9430, 9443 | `_scanJson`, `extractPacks` | The requirement list after the first `const APPNS = ` or `const emb = ` in an imported board's script | A brace-matching scan, then `JSON.parse`. The door uses the same `extractPacks`, so it checks the object the importer uses |
| §16, 8659 | `pmoTake` | A submittal, routed from `importState`, or several at once (`uiSubMany`, §42, line 34906) | `ap` must match this board; `fy` checked; the service list is required when there are per-service figures and must match (a reorder is remapped by name); widths must equal the board's; every field normalised by `pmoNorm` (§16, line 7839); out-of-scope items dropped. Nothing is applied until a reviewer ticks it (`pmoApply`, line 8519) |
| §18, 9896 | `pkgApply` | A package, routed from `importState` | `spmtPkg===1`, `ap` and `ms` present, `seq` a whole number and `ap` one of the board's own keys; `svcGuardImport` against the target appropriation's services; a staleness test against the ledger; a preview confirm; locked baselines kept |
| §18, 10076, 10141 | `importStores`, `cycTake` | The side stores in an imported file | Execution: newer time wins per appropriation. Estimates: a missing key is taken, the same fingerprint is a no-op, a different one is reported. Reprogramming log: `rpMerge` (§38). Cycles: missing keys taken, held ones kept |
| §18, 10168, 10200 | `consTakePick`, `consTakeApply` | Appropriations picked from a consolidated file | `inboundCheck`, `svcGuardImport` per appropriation, a conflict confirm, a preview confirm, one `lsAll` commit with memory restore, then a reload |
| §27, 16615 | `destPkgIn` | A submittal's destination list and the destination keys on its items | Own-key lookups only; `destFold` (line 16361) turns names into text and allows known kinds only |
| §29, 19569 | `bandImport` | A band ladder `.json` (`#bandFile`) | `inTooBig`, `inboundCheck`, `JSON.parse`, then a field allowlist; colour must be a six-digit hex colour. Confirm before replacing |
| §24, 12998 | `xlsxRead` | Any `.xlsx` a person picks: the ZIP directory, headers, deflate streams and XML parts | Every offset is bounds-checked and each failure is named; entries inflated with `DecompressionStream('deflate-raw')`; OOXML's `_xHHHH_` escape read once, a code for a character a workbook cannot hold kept as written. XML read with regular expressions |
| §24, 13280 | `importSrc` | The CCaR QPE execution workbook (`#srcFile`) | Staged, committed only after every tab is read; cells normalised by `normSrcRow` |
| §26, 15573 | `importBud` | The BAE workbook (`#budFile`), its `Budget Name` column | Header required; names parsed by `budParseName`; confirm when budgets would be retired |
| §26, 15820 | `importCcarRecs` | The CCaR records workbook (`#ccarFile`) | `CCaR No` and `Title` headers required; keys normalised by `ccarNorm`; duplicates and conflicts flagged |
| §26, 15889 | `importAce` | The ACE cost-estimate workbook (`#aceFile`); the set key comes from the file name | `aceParse` reads fixed columns; appropriation, office and service through allowlists; a set name in `IN_KEY_BAD` is refused. Confirm before replacing a locked set |
| §41, 31615 | `aiImport` | The AI review answer (`#aiFile`), section "The AI review" below | `inTooBig`, then `aiRead`: `inboundCheck` on the JSON it finds, then each line checked against the board |
| §38, 28845 | `takePen` | The board's own file on disk, read through the stored handle | No inboundCheck. Only `writerShape(p.writer)` is used from it |

No file is taken by drag and drop: the row drag moves rows within the page.

### The AI review (v2.04, item 109)

**ORBIT makes no call to an AI service.** The file has no network route, and a credential would travel in
every save, so the round trip to GenAI.mil is carried by hand. All of it is in §41:

- `aiRequestText` (line 31511) builds a text file: instructions for the answer's format, then a JSON
  object holding the appropriation, the years the working plan holds, the services and, for every
  requirement on the board, its id, rank, title, record name, office, CCaR record, Mission Critical flag,
  description, impact statement, a few classification fields, and per year its requirement, allocation,
  funded and unfunded figures in whole dollars. `aiExport` (line 31552) downloads it. The status line tells
  the person it holds the board's figures and text and is to be handled as the board is.
- `aiImport` (line 31615) reads the answer the person saved. `aiExtract` takes the JSON object out of any
  prose around it; `aiRead` (line 31572) runs `inboundCheck` on it, requires `format` and a `findings` list
  of at most 5,000, cuts every text field to a fixed length, and checks each finding against the board: the
  requirement is on the board, the year is held, the measure and field are on fixed lists
  (own-key lookups), the value is one of the board's own, and a quoted figure equals the board's.
- The checked list (`AIREV`) lives in this tab's memory only. It is drawn with `esc()` and `jsa()`
  (`aiBody`). **Nothing from it is written to the board**: each line has a "Go to it" button and the person
  decides.

### Browser storage (`localStorage` and IndexedDB)

| Where | Function | Key and what it holds | How it is checked |
|---|---|---|---|
| theme script, line 1732 | (top level) | `spmtTheme` | Allowlist (navy, parchment, blueprint, harbor); anything else removes `data-theme` |
| §08, 4303, 4335 | `themeGet`, `uiLoad` | `spmtTheme`, `spmtMode`, `spmtDensity`, `spmtDetail` | Allowlists (`THEMES`, `UI_MODES`, `UI_DENS`); `spmtDetail` compared to `'1'` |
| §42, 34249-34251 | (top level) | `prio27uiRail`, `prio27uiDock`, `prio27uiCols`: the left menu's layout | Compared to `'1'`; `prio27uiCols` must be a plain object |
| §37, 27355 | `menuGrp` | `spmtMenuGroups` | Must be a plain object; used in equality tests only |
| §14, 7305 | `jrnlSeen` | `spmtSeen` | Coerced to a number |
| §02, 2624 | `writerKey` | `prio27writerKey` | Must match `^[0-9a-f]{32}$`, otherwise regenerated with `crypto.getRandomValues` (`Math.random` if that fails) |
| §03 | side-store boot | `prio27execdb`, `prio27acedb`, `prio27buddb`, `prio27destdb`, `prio27reprog`, `<key>-cyc`, each against the file's copy | `JSON.parse` in try/catch; the copy with the newer time wins; a small shape check each. No inboundCheck |
| §03, 2925 | `_impRep` | `prio27impRep`: the HTML report of a full import | Read once at opening and removed; built with `esc()` where it was written |
| §04, 2963, 2992 | `APPN`, `switchAppn` | `prio27appn`, and `PUB.only` | Checked against the appropriation tables; default O&M |
| §04, 3034 | `cycStoreOf` | Other appropriations' `-cyc` keys and the file's `cycDb.byAp` | `cycles` must be an object |
| §31, 20998 | `CYC_GO_KEY` | `prio27cycGo`: the appropriation a "Go to" under PPBE cycles is opening | Compared to this board's slug, then removed |
| §04, 3071 | `DATA` | `.dataPack` inside the stored store | Only `_hasData`. No inboundCheck |
| §13 | boot restore | `localStorage[<key>]`, the whole store, to `applyStore` | `JSON.parse` in try/catch; `applyStore` runs `svcGuardImport` and `applyState`'s repairs. No inboundCheck |
| §13, 7105 | `persist` | Writes the whole store to `localStorage[<key>]` | Refused while a locked cycle is on screen; a full-storage error is reported |
| §03, 2807, 2837, 2859 | `lsSet`, `lsAll`, `lsPutBack` | Every other write | One funnel: marks the board unsaved, records and reports a refused write. `lsAll` writes several keys all or nothing and rolls back |
| §15, 7528-7529 | `whoIs`, `whoAmI` | `prio27who`: the editor name the person types | Trimmed and cut. Stamped into the store, journal entries, packages and submittals |
| §15, 7558-7559 | `baseGet`, `baseSet` | `<key>.base`: the saved-copy checkpoint | Parsed in try/catch; must be an object |
| §15, 7579, 7612 | `keepAside`, `keptPutBack` | `<key>.kept`: one kept-aside store | Meta parsed in try/catch; the store goes to `applyStore`. No inboundCheck |
| §15, 7742 | `pubsFor` | Every other appropriation's store, embedded into every saved board | Shape test; newer time wins. No inboundCheck |
| §15, 7756-7757 | `_fhPut`, `_fhGet` | IndexedDB `prio-fh`, store `h`, key `FNAME`: the saved file's handle | Permission asked again before each use |
| §16, 7952, 7962 | `myPmo`, `pickMyPmo` | `prio27pmo` | `pickMyPmo` stores only a value from the office list |
| §18, 9498, 9537 | `pkgStoreOf`, `pkgPut` | Another appropriation's store (or `PUBS`), written with `lsSet` | Shape test only |
| §20, 11050 | `IMP_MIXED_KEY` | `prio27impMixed`: a failed import's hold | Parsed in try/catch; list checks |
| §29, 19391, 19506, 19522 | `bandsAdoptPending`, `bandPeers`, `bandCopyAll` | `prio27bands_<slug>`: a ladder another appropriation left pending; `bandCopyAll` rewrites each other appropriation's stored store after a confirm | Read, parsed, removed; adopted when its time is newer |
| §31, 21408 | `fydpStoreLocal` | Another appropriation's store, or `PUBS` when newer | Shape test |
| §31, 21439 | `fydpFrameMem` | Copies every `localStorage` key of this origin except `spmtLive`, `spmtLiveKey` and `*.kept` into the frame's memory | See "Frame messages" |
| §37, 27533 | `sideBootCheck` | `prio27sideOpen`: hashes of what opening wrote | Reset unless it matches this file's time |
| §38, 28089 | `liveCfg`, `liveSaveCfg` | `spmtLive`: live-view settings (mode, interval, on, the folder's name) | Parsed in try/catch; a machine set up for a removed transport is moved to the shared folder, off. `spmtLiveKey`, the key the removed transports used, is deleted on every read (line 28103) |
| §38, 28181-28193 | `driveIdb`, `drivePut`, `driveGet` | IndexedDB `prio-fh`, key `spmt-live-dir`: the shared folder's handle | Permission queried on each use (`driveDir`, line 28238) |
| §39 | `diagSecrets`, `diagStoreOf` | Every `prio27`/`spmt` key, for the redaction list and counts | Try/catch; shape tests |
| §42, 34144 | `loadShared` | `spmtSidecar`: opt-in for the legacy state file | Strictly `=== '1'` |

### Shared folder (File System Access API)

Every read of a folder file goes through `driveParse` (§38, line 28449): `inboundCheckOwn(txt, 'copy')`,
then `JSON.parse`.

| Where | Function | What comes in or goes out | How it is checked |
|---|---|---|---|
| §25, 14008; §38, 28197 | `driveOpenPicker`, `drivePick` | The folder, chosen in `showDirectoryPicker({mode:'read'})`; its name kept in `spmtLive` | The browser's own permission prompt; write permission is asked for separately |
| §25, 14028, 14062 | `driveAutoConnect`, `driveConnectNow` | On opening and on a click: pulls the store, execution rows and estimates | Only when write permission is already granted (automatic) or after a click |
| §25, 14116 | `driveWriteTest` | Writes, reads back and removes `spmt-check-xxxxx.txt` | Content must start with `ok ` |
| §25, 13962 | `liveLeaving` | On leaving the page, removes this board's lock file | Only with the live view on; errors ignored |
| §38, 28270, 28282 | `snapMatch`, `snapList` | Lists `history/` names | A pattern with the year and appropriation escaped |
| §38, 28346, 28352 | `driveWrite`, `driveRead` | Raw write (`createWritable`) and raw read of a named file | Callers decide; reads then go through `driveParse` |
| §38, 28362 | `drivePoll` | Peer lock files `spmt-<fy>-<ap>.lock.json` and peer boards `spmt-<fy>-<ap>.json` | `driveParse`; `liveTooNew`; a lock counts when `by` is set and its time is fresh |
| §38, 28399, 28406 | `driveHeartbeat`, `driveRelease` | Writes and removes this user's lock file `{by, ts, fy, ap}` | Outbound; errors ignored |
| §38, 28437, 28455 | `driveStoreRead`, `driveStorePull` | This appropriation's folder copy, adopted through `applyStore` | Only `NotFoundError` means absent; `driveParse`; `liveTooNew`; time against the store and the recorded base; refused over unsaved work; `keepAside` first; `svcGuardImport` |
| §38, 28576, 28582 | `driveStorePush`, `_driveStorePushRun` | The folder save, through `saveSerial`: `livePayload` (line 28166) = `pkgStrip(MS)` plus `by`, `ts` and `writer` | Target and year fixed before the first wait; a copy it cannot read is never overwritten; the base-time clash check; `writerMay`; the folder's copy kept in `history/` first, or nothing is written |
| §38, 29417 | `livePublish` | ⬆ Publish now: the same folder save | Refuses any mode but the shared folder |
| §38, 28781, 28787 | `driveResolve`, `_driveResolveRun` | Keeps theirs in history and saves over it, or adopts theirs | Confirm; `liveTooNew`; `keepAside` |
| §38, 28909 | `driveRestore` | A history copy chosen from a list | Name pinned to the year and appropriation; `driveParse`; `ap` and `fy` must equal the pinned values; the current copy kept first; unsaved work kept aside first |
| §38, 29014, 29036 | `driveExecPush`, `driveExecPull` | `spmt-exec.json` (execution rows) | Pull: `driveParse`; requires `exec` and a newer time |
| §38, 29086-29299 | `driveAceFile`, `driveAcePush`, `driveAceReplace`, `aceHistShow`, `aceRestore`, `driveAcePull` | `spmt-ace-<name>.json`, one per estimate set, and their history copies | `driveParse`; shape; fingerprint. Push only where the folder has none; replace after a confirm and a re-read, history first; restore checks the name and reads the kept copy back byte for byte |
| §31, 21419 | `fydpStoreFolder` | Another appropriation's folder copy, read only | `driveParse`; `liveTooNew`; used only when newer than the local copy |

The board no longer reads or writes the folder's reprogramming log (`spmt-reprog.json`); a copy already
there is left alone.

### The legacy state file beside the board

`loadShared` (§42, line 34136) is the one HTTP-style read the board still makes. It asks for
`prio-state-<slug>.json` (`STATEFILE`, §05, line 3194), relative to the board:

- **Opened from `file:`** (today's use): only when `localStorage.spmtSidecar` is exactly `'1'`, an
  `XMLHttpRequest` `GET STATEFILE?t=<time>` (line 34149). Without that setting no request is made.
- **Served over `http(s)`:** `fetch(STATEFILE, {cache:'no-store'})` (line 34158), every time the board opens.

Either way the answer passes `inboundCheckOwn(text, 'copy')`, then `JSON.parse`. `sharedArrived` (line 34194)
adopts it only through `applyStore`, never over work typed in this session, and keeps unsaved work aside
first (`sharedKeepMine`, §17, line 9260).

### Downloads (files the board writes through the browser)

| Where | Function | What goes out | What is checked first |
|---|---|---|---|
| §15, 7750 | `savedHtmlOf` | Every board file (section 1) | `<` written as `<`; a function replacer |
| §17, 9235, 9251 | `publishState`, `publishJson` | The board as HTML (when saving in place is not possible), or the raw store JSON | `sandboxBlock` and `cycBlock` |
| §16, 7918; §04, 3062 | `publishPmoCopy`, `pmoCopyHtml` | A PMO copy: the board plus a baseline, with `pubMode` written in, carrying one reference cycle as a projection only | Refused in a cycle view or a PMO copy; confirm. `pubMode` JSON has `<` escaped |
| §16, 8172 | `pmoSubmit` | A submittal JSON | The copy's own year only; office scope; required fields on new requirements; a name required |
| §18, 9544, 9661, 9683 | `pkgIssue`, `pkgSendBack`, `pkgReturn` | A package JSON | `pkgStrip` (line 9491) removes `execDb`, `aceDb`, `rpDb`, `cycDb` and `sync` |
| §15, 7688 | `keptSaveFile` | The kept-aside work as a board file | File name through `expName` |
| §20, 11036 | `fullImportRescue` | The board as it was before a failed import, or the imported file's own text | Offers back only text the person imported or the board built |
| §20, 11209, 11182 | `exportOneAppn`, `appnsOnlyIn` | One appropriation as a working board | `sandboxBlock` and the cycle view; the file written is put through `inboundCheck` so the message can say if a later import would refuse it; `appnsOnlyIn` writes `</` as `<\/` |
| §09, §16, §23, §25, §27, §28, §29, §31, §32, §41, §42 | `exportRlgPlan`, `pmoReport`, `crExport`, `exportIdsReq`, `exportFlow`, `exportExView`, `exportSrc`, `exportPlans`, `exportFydpPlan`, `exportCycCompare`, `exportFcView`, `exportCSV` (an `.xlsx` despite its name), `exportAceTieout`, `exportExcel`, `exportCoa` | `.xlsx` workbooks built by `buildXlsx` (§36, line 26822) | Text XML-escaped by `_xesc` (line 26449: `&`, `<`, `>`, `"`, and a carriage return as `&#13;`); every text cell an inline string, so no cell is a formula. `exportIdsReq` refuses in a cycle view, in a PMO copy, when its own reconciliation (`idsCheck`) fails, or when its prompt fails `idsFormProblems` |
| §29, 20551 | `exportProposedOrder` | The proposed 1-N order as `.csv` | Every cell through `csvCell` (line 20544): a leading apostrophe on a cell that starts (after any spaces) with `=`, `+`, `-`, `@` (or their full-width forms) or with a tab, CR or LF, unless it is a figure ORBIT formatted; quotes doubled; a BOM first |
| §29, 19561 | `bandExport` | The band ladder as JSON | File name stripped |
| §27, 18157 | `flowPng` | The funds-flow chart as PNG: its SVG drawn on a canvas | File name stripped |
| §41, 31552 | `aiExport` | The AI review request (`.txt`), section "The AI review" | File name through `expName` |
| §39, 30069 | `diagSave` | The diagnostics text file | Messages through `diagClean` (line 29934): by design it holds no dollar figure, title, name, CCaR record, PID or budget name |

### Clipboard

| Where | Function | What goes out | How it is checked |
|---|---|---|---|
| §25, 13998 | `driveCopyHint` | The data-folder path worked out from the page's address | Derived from `location.href` only |
| §25, 14971; §26, 15753 | `pfCopy`, `divCopy` | The pre-flight list or the reconciliation as plain text (titles, budget names) | Tags removed |

The board never reads the clipboard and has no paste handler.

### Frame messages

The five-year plan reads each other appropriation by running a copy of this page in a hidden frame
(`exportFydpPlan` → `fydpGather`, §31).

| Where | Function | What happens | How it is checked |
|---|---|---|---|
| §31, 21455 | `fydpFrameHtml` | Builds the frame's page from `SRC0`: `pubState` replaced with the side stores and one appropriation's slot, and a shim script inserted before the first `<script>`. The shim gives the frame an in-memory `localStorage`, removes `indexedDB`, stubs `alert`/`confirm`/`prompt`, and answers with `parent.postMessage(r,"*")` (line 21468) | Both JSON blobs have `<` escaped; the replacement uses a function |
| §31, 21439 | `fydpFrameMem` | The frame's in-memory storage: a copy of every `localStorage` key of this origin except `spmtLive`, `spmtLiveKey` and `*.kept`; `prio27appn` set; the folder copy added when newer | |
| §31, 21480 | `fydpFrame` | `<iframe sandbox="allow-scripts">`, hidden off screen, filled with `srcdoc`; a `message` listener | A message is taken only if `e.source` is the frame's window, the data is an object, and its `nonce` matches. Listener and frame removed when done; a time limit (`FYDP_FRAME_WAIT`) |
| §31, 21507 | `fydpTake` | The frame's answer | `ap` must match; `build === BUILD`; no lost data or restore error; `ts` equal to the expected stamp; the source asked for; lists where lists are expected |

The frame's origin is opaque (`sandbox` without `allow-same-origin`), so the browser keeps it out of the
page's own storage, IndexedDB and files. A `srcdoc` frame inherits the page's Content-Security-Policy. There
is no other `message` listener in the file.

### Page address

| Where | Function | What is read or done | How it is checked |
|---|---|---|---|
| §25, 13976, 13989, 14178 | `driveWinPath`, `driveHint`, `driveCheck` | `location.href` and `location.protocol`, turned into a Windows path | Only `file:` addresses; `decodeURIComponent` in try/catch |
| §39, 29974 | `diagReport` | `location.protocol`, `location.host`, and the browser name and major version (`diagBrowser`) | Reduced to a phrase |
| several | `switchAppn`, the importers, `driveStorePull`, `clearComputer` | `location.reload()` after a switch, an import or a clear | The reload reads browser storage again |

The board never reads the query string, the fragment, `window.name` or the referrer.

### New windows

| Where | Function | What is opened | How it is checked |
|---|---|---|---|
| §39, 30224-30270 | `linkOpenable`, `linkSet`, `linkOpen` | An `<a target="_blank" rel="noopener">` to `encodeURI(name)`, clicked by script. The name is typed in `linkSet` (Setup › Who and where › Linked tool…) and kept in the store, so it travels in the saved file | `linkOpenable`: the name must end in `.htm` or `.html`, and if it has a scheme it must be `file:`, `http:` or `https:` (a drive letter is not a scheme) |

There is no `window.open` in the file. A navigation is not a connection, so `connect-src` does not govern
the companion link.

### The file itself, and typed text

| Where | Function | What comes in | How it is checked |
|---|---|---|---|
| §01, 2534 | top level | `SRC0`, the page's own markup | Taken before the script changes the page |
| §01, 2564 | top level | `PUB = JSON.parse(pubState)`, this file's own data | Try/catch; a failure noted in `_bootLost`. No inboundCheck: it has the trust of the file's own code |
| §02, 2621 | `writerShape` | `PUB.writer` `{by, fp, t}`, and the same record from the file on disk at save time | `fp` text of 1-64 characters; `by` cut to 60; `t` a number |
| §02, 2676 | top level | `PMODE = JSON.parse(pubMode)` | Try/catch; `PMODE.ap` checked against the appropriation tables; `PMODE.ts` is used in storage key names |
| §01, 2593, 2597 | error listeners | `error` and `unhandledrejection` messages | Through `diagClean`; kept in memory only |
| §30, 20731-20739 | `helpSections`, `helpBody` | The in-file `<template id="helpDoc">`, written with `innerHTML` | Shipped content, not data |
| §15, 7398 | `uiPrompt` | Typed input: editor name, office name, base year, grouping, CCaR number, appropriation pick | Each caller checks its own input; office and service names through `inNameWhy` |
| §07, 3865, 3875 | `svcAdd`, `svcRen` | Typed service names | Trimmed; `inNameWhy`; duplicates refused without case |
| several | `editCcar`, `editPid`, `clinAdd`, `clinSetField`, `wbsQuick`, `rcnSet`, `editTitle`, `editRecName` | Typed codes and names | Codes through `codeTake` (§19, line 10308): refused over the limit, never cut; names trimmed |
| §21, 11432 | `amtReadM`, and `parseAmt` | Typed money | The whole entry read; rounded to a whole dollar and said; bounded by `IN_MAX_AMT` |
| §37, 27167 | `render` | The search box `#q` | Used only for lower-case substring matching |
| §31, 22020 | `cycView` | A cycle's stored years, deep-copied and run through `applyState` | The cycle must hold years |

---

## 5. Network use

**The Content-Security-Policy says what the browser may load or connect to** (line 9; `npm run check` holds
its text and `npm run csp`, `tools/csp-check.mjs`, proves in Chromium from a `file://` address that a fetch,
an image and a frame to another host are each refused by the policy, read from the
`securitypolicyviolation` event). Directive by directive:

| Directive | Allows | Effect |
|---|---|---|
| `connect-src 'self' file: data: blob:` | the page's own origin, `file:`, `data:` and `blob:` | `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource` and `sendBeacon` cannot reach another host |
| `script-src 'unsafe-inline'` | inline scripts and inline handlers only | No external script, from any host or from beside the file. The board's own code is inline, so this source is required; it does not stop an inline handler or script that reaches the page from running (section 7 is what stops that) |
| `style-src 'unsafe-inline'` | inline styles only | No external stylesheet |
| `img-src`, `font-src`, `default-src` | `'self'`, `data:`, `blob:` | No image, font or other resource from another host |
| `frame-src 'self' about: data: blob:` | the five-year plan's `srcdoc` frame | No frame from another host |
| `object-src 'none'`, `base-uri 'none'`, `form-action 'none'` | nothing | No plug-in, no `<base>`, no form submission |

A policy in a `<meta>` cannot set `frame-ancestors`, `report-uri` or `sandbox`, and this one sets none.

**Every request the page makes.** A scan of the running scripts finds one `fetch` and one `XMLHttpRequest`,
both in `loadShared` (section 4, "The legacy state file beside the board"), both relative to the board and
inside `connect-src`. No `WebSocket`, `EventSource` or `sendBeacon`, and no external URL in any `src` or
`href`.

**What was removed.** Until v2.04 the live view could publish to and read from Confluence, SharePoint or a
JSON endpoint, with an API key kept in browser storage, through a function that also used a packaged
desktop build's bridge (`window.spmtNet`) when present. v2.04 (items 110 and 111) removed all three
transports, the key and the bridge. A machine still set up for one opens on the shared folder, turned off,
and is told (`liveCfg`, §38, line 28089); its stored key is deleted. The live view now has one mode, the
shared folder (`LIVE_MODES`, line 28076).

**The shared folder is not network code.** It uses the File System Access API on a folder the person picks.
If that folder is synced by OneDrive or SharePoint, the sync client moves the files, outside the board.

**The live view is off by default.** Its settings live in `spmtLive`, per machine: `on` false, `mode`
`drive`, `every` 30 seconds (10 to 600). When it is on, `liveStart` (§38, line 28132) runs `liveTick`
(line 28143) on that interval: when the team works out of the folder and the board has unsaved changes, it saves
to the folder (`driveStorePush`), then refreshes from the folder.

---

## 6. What stays on the computer

### Browser storage

Everything below stays in the browser profile after the tab closes, until it is removed. In a PMO copy the
appropriation keys and `prio27destdb` carry a `-pmo<publish time>` suffix (§03, line 2904; §04, line 2986).

| Key | Written by | What it holds |
|---|---|---|
| `prio27om`, `prio27ff`, `prio27sp`, `prio27opn` | `persist` | Each appropriation's whole store: every year's requirements, money, notes, impact statements, the journal, snapshots, positions |
| `<key>.base` | `baseSet` | The saved-copy checkpoint: times and flags |
| `<key>.kept` | `keepAside` | One kept-aside copy of a whole store |
| `<key>-cyc` | `persistCyc` | Locked PPBE cycles |
| `prio27execdb` | `persistExdb` | Imported CCaR execution rows, all appropriations |
| `prio27acedb` | `persistAce` | Imported cost estimates |
| `prio27buddb` | `persistBud` | The BAE budget list |
| `prio27destdb` | `persistDest` | Destinations |
| `prio27reprog` | `persistRp` | The reprogramming log, carried since v2.02 though no longer shown |
| `prio27bands_<slug>` | `bandCopyAll` | A band ladder waiting for another appropriation |
| `prio27impRep` | `fullImportText` | The report of a full import, until the next opening |
| `prio27impMixed` | the import hold | A failed import's file names and keys |
| `prio27sideOpen` | `sideBootCheck` | Hashes of what opening wrote |
| `prio27appn` | `switchAppn` and importers | The appropriation on screen |
| `prio27cycGo` | PPBE cycles' Go to | The appropriation being opened, until it opens |
| `prio27who` | `whoAmI` | The editor name the person typed |
| `prio27pmo` | `pickMyPmo` | A PMO copy user's office |
| `prio27writerKey` | `writerKey` | A random key; a hash of it is this browser's writer fingerprint |
| `prio27uiRail`, `prio27uiDock`, `prio27uiCols` | the left menu | Layout preferences |
| `spmtLive` | `liveSaveCfg` | Live-view settings: mode, interval, on, the shared folder's name |
| `spmtTheme`, `spmtMode`, `spmtDensity`, `spmtDetail`, `spmtMenuGroups`, `spmtSeen` | preference setters | Display preferences |
| `spmtSidecar` | set by hand | The opt-in for the legacy state file |
| IndexedDB `prio-fh`, store `h` | `_fhPut`, `drivePut` | File System Access handles: the saved board file (key `FNAME`) and the shared folder (key `spmt-live-dir`) |

No cookies, Cache Storage or service worker are used. `sessionStorage` is only cleared (by Clear this
computer), never written. Setup › Save diagnostics reports how much browser storage the board's keys take.

### Files written

- **The board file** the person saves to, in place (section 1).
- **Downloads**, to the browser's download folder: board copies (`.html`), PMO copies, kept-aside work,
  rescue files, one-appropriation boards, state, package and submittal files (`.json`), band ladders
  (`.json`), workbooks (`.xlsx`), the proposed order (`.csv`), the chart (`.png`), the AI review request
  (`.txt`), diagnostics (`.txt`).
- **The shared folder**, when connected: `spmt-<fy>-<ap>.json` (the folder copy), lock files
  `spmt-<fy>-<ap>.lock.json`, `history/` copies (up to `SNAP_KEEP`, 24, spaced copies per appropriation and
  year, plus recent ones), `spmt-exec.json`, `spmt-ace-*.json` and their history copies, and a test file
  `spmt-check-xxxxx.txt` that is removed straight after.

Nothing is written to any remote service.

### Removing ORBIT data from a shared machine

This bears on media sanitization (NIST SP 800-88 Rev. 1, as the owner's security team named it; section
10).

**Clear this computer** (Setup › Clear this computer; `clearComputer`, §41, line 31690, since v2.04) removes,
in one action, every `localStorage` and `sessionStorage` key beginning `prio27` or `spmt` (`CLR_PREFIX`, line
31676) and deletes the IndexedDB database `prio-fh` (the remembered file and folder handles). It asks first,
naming unsaved changes and kept-aside work when there are any, and asks a second time if so; it is refused
while a locked cycle is on screen. It then reloads the page from the file, and reports any key it could not
remove. **It does not touch the board file**, the downloads or the shared folder, and it does not overwrite
anything before deleting it. A web page cannot sanitize a disk; that falls to the machine's owner.

**What a person must do:**

1. Close every other ORBIT tab, so no save or automatic save writes again.
2. Open the board and use Setup › Clear this computer. To confirm, open the blank board: it should open as an
   empty shell with no restored work, and Save diagnostics should show no storage in use by the board. Edge's
   **Cookies and other site data** clear removes the same storage.
3. Delete the board files and every download listed above. The browser's download list keeps the names.
4. Leave the shared folder and its `history/` to the team: those copies are shared records. Synced and
   SharePoint locations keep their own version history and recycle bin, outside the board.
5. Remove the AI review request from wherever it was carried, and its answer.

---

## 7. HTML output

**The rule since v2.00: escape where drawn.** A value that did not come from the board's own code is
escaped at the point it is written into markup, an attribute or an inline handler, however it arrived. The
import door is not relied on to have cleaned it (CLAUDE.md, "v2.00 (item 99)").

- **`esc()`** (§40, line 30354) is for text written into HTML and for quoted attribute values. It replaces `&`
  with `&amp;`, `<` with `&lt;`, `"` with `&quot;` and `'` with `&#39;`. It leaves `>` alone. It is used
  where text is parsed as HTML and nowhere else: a value is never escaped where it is built, nor in a
  `confirm()`/`alert()` message, a workbook cell, a file name or `document.title`.
- **`jsa()`** (§40, line 30360) is the only way a value goes into inline handler code:
  `esc(JSON.stringify(String(v)))`, with `null` and `undefined` as `''`, so the value reaches the handler as
  one string literal. `npm run check` fails on a value concatenated into handler code any other way.
- **Labels in two forms.** `blLblTxt`/`ppLblTxt` give a cycle or position label as text; `blLbl`/`ppLbl`
  (§31) return it escaped once, for markup.
- **Markup made plain.** Where markup has to become text (a confirm, the journal search, a copy to the
  clipboard), `diagPlain()` (§39, line 29827) decodes it through `DOMParser` into a separate inert document
  and reads the text back.
- **`setStat()`** (§15, line 7448) writes its argument into the status line with `innerHTML`. Its callers pass
  HTML, so each must escape the values it puts in.
- **Helpers that take HTML by contract** insert their arguments as given, so each caller must escape: `mi`,
  `grp`, `recSel`, `recBtn`, `inspField`, `driveCheckSay` (section 3).
- **Band colours** written into a `style` attribute go through `readableOn` (§06, line 3594), which keeps a hex
  colour or a `var(--name)` theme token and turns anything else into a neutral grey.
- **Maps keyed by imported text have no prototype.** A map keyed by a value from a file or a workbook (an
  execution row's office, an estimate's service, a BAE budget name, a cost element) is created with
  `Object.create(null)`, and a fixed table looked up by an imported value is read by own key
  (`Object.prototype.hasOwnProperty.call`). So a name such as `__proto__` or `toString` can neither read a
  built-in nor write onto every object in the page.
- **Exports.** XML text through `_xesc` (§36, line 26449); CSV cells through `csvCell` (§29, line 20544). See
  section 4, "Downloads".
- **No code from strings.** A scan of the running scripts finds no `eval`, `new Function` or timer given a
  string. `window[...]` is used twice: `fldSave` (§30, line 20712) names a setter from the fixed `FLD_PARTS`
  list, and `uiFlyItems` (§42, line 34582) tests names written in its own code. One
  `setAttribute('onclick', …)` (§37, line 27624) sets a fixed string.

**The sink list.** `node tools/review/sinks.mjs` writes `review/sinks.csv`: every place in the board's source
where a string is handed to the browser as HTML, with line, column, kind, the named functions around it,
whether it sits in code or in a string, and the source line. It holds no verdicts. Counts at `f508fdb`:

| Kind | Count |
|---|---:|
| `innerHTML =` | 210 |
| `innerHTML +=` | 1 |
| `setStat` call (writes with `innerHTML`) | 359 |
| `srcdoc` (the five-year plan's frame) | 1 |
| `DOMParser.parseFromString` (`diagPlain`: a separate document, text read back) | 1 |
| `outerHTML =` or `+=`, `insertAdjacentHTML`, `document.write`, `createContextualFragment`, `setHTMLUnsafe` | 0 |
| **Total** | **572**, in 261 functions |

Five more matches sit in comments and are not listed. A function that builds an HTML string and returns it is
not a row: its string becomes markup where it reaches one of the sinks above.

**The classification of each sink** (escaped, fixed text, numbers only, HTML by contract, or open) **is in
the owner's private annex**, not here (section 11). The annex was written against the v1.99 sink list; this
list is regenerated for v2.07, so its rows and line numbers differ from the ones the annex cites.

---

## 8. What the tests prove, and what they do not

### What runs

| Check | Command | What it proves |
|---|---|---|
| Invariants | `npm run check` (`tools/check.mjs`) | The script parses; the six appropriation tables agree; the save path can find its target; no board data is committed; nothing external is referenced; the Content-Security-Policy is present and unchanged; no value is concatenated into handler code without `jsa()`; every click handler is on a native control; dialogs have the one shape the dialog controller drives |
| jsdom suites | `npm run audit` | A start-up check (`boot-same.mjs`), then nine suites: `audit.mjs` (the workbook), `audit-other.mjs`, `audit-board.mjs`, `audit-import.mjs`, `audit-recon.mjs`, `legacy-fsrc.mjs`, `audit-hostile.mjs`, `audit-inject.mjs`, `audit-ui.mjs`. They drive the real board's code in jsdom and check every printed figure, the import paths, the round trips and the refusals |
| The hostile board | `audit-hostile.mjs` (jsdom) and `npm run hostile` (`tools/hostile-render.mjs`, Chromium) | Every hostile shape at every door its file type uses is refused, with browser storage and the store unchanged; every file the board writes passes the door; a board full of script-shaped text (`tools/export-audit/hostile.mjs`) is opened screen by screen, and no planted value becomes code. In Chromium an event handler in planted markup would also run, and is counted |
| Injection checks | `audit-inject.mjs` | One check per place v2.00 found a value from a file reaching the page as HTML, through the board's own renderer; probes of each structural guard; key checks that names such as `__proto__` and `toString` land on nothing built-in and every dollar is still counted |
| Browser checks | `npm run verify:grid` | The Chromium finder's self-test, the Content-Security-Policy (`csp`), then layout, menus, panels, keyboard, dialogs, the five-year plan's frames (`tools/fydp-frames.mjs`) and the hostile render, in Chromium |
| Round-trip fuzz | `npm run fuzz` (`tools/roundtrip-fuzz.mjs`) | Fills every container the board writes with awkward values (quotes, a literal `</script>`, long text, unicode), then saves, reopens, saves again, copies years and runs a PMO copy round trip. Nothing may be lost, and every board and PMO copy it saves must pass the door |
| Mutation targets | `tools/export-audit/mutate.mjs` | 2,317 deliberate code changes, each meant to be caught by a suite. The full sweep that runs them is section "What they do not prove" |
| Money map | `npm run money-map`, `tools/money-map.json` → `tools/money-map.md` | 43 money surfaces, 301 cells (surface × dimension): 108 proven, 192 not applicable, 1 open (the AI review request × fiscal year) |

### What they do not prove

- **No mutation sweep has run since v1.99.** The sweep proves the checks would notice a change. v1.99's gate
  ran it in full; from v2.00 the owner's rule is that a sweep runs only on his named go, and none has run
  since. Each new mutation of v2.00-v2.07 was run one at a time against its own check, never as a set
  (`review/builds.json`, `gate`).
- **jsdom is not a browser.** It has no layout and its HTML parser differs from Chromium's (it drops markup
  inside a `<select>`). The harness hands it the program text whole, so a `</script` or `<!--` inside the
  main script would not be noticed there; only the Chromium checks would see it.
- **Folders and files are stand-ins.** The shared folder is an in-memory directory handle, and the board
  file a stand-in file on disk. No test runs real OneDrive or SharePoint sync, file locking, permissions or
  version history.
- **No Windows, Edge or Office.** The browser checks run Chromium on Linux. Exports are read back as XML; no
  test opens them in Excel.
- **The legacy state file** is tested in jsdom; it was not run with the old launcher that enables it.
- **The AI review** is tested with answers written in the suite; no answer from GenAI.mil has been read.
- **The hostile fixture does not cover every field.** It plants script-shaped text in the fields it knows,
  plus hostile ids and names. It does not cover every field an imported file or browser storage can carry.
- **What a mutation sweep measures.** It shows the tests notice a change to the code. It does not show the
  code is safe against an input the tests never try.

---

## 9. Threat model (today's deployment)

> Written for today's model: one HTML file opened in Edge from a synced folder or a shared drive. **Revise it
> once the deployment option is chosen.** A hosted web application would add a server, sign-in, sessions and
> transport security, and would change the storage origin and how the board saves.

### Assumptions

- The blank release is trusted code. A saved board is trusted only as far as `which-build.mjs` shows its
  program is a release in `review/builds.json` (section 2).
- The browser, the operating system and the person's account are trusted. A page cannot defend against
  code already running with the person's rights.
- The shared folder's permissions decide who can write there. ORBIT's writer check (§02, `writerMay`, line
  2639; Audit › Take the pen, `takePen`) is cooperative: the file records a writer's name and a
  fingerprint (`pkgSig`, a non-cryptographic hash, of a key this browser keeps), and Save from another
  browser is refused. Its comments say so, and that the guarantee is the folder's permissions.
- Not established here: whether other local pages share the board's browser storage in the deployed Edge
  configuration. If they do, they can read and write everything listed in section 6.

### Assets

| | Asset | Where it lives |
|---|---|---|
| A1 | Budget data: requirements, money by service and year, notes, impact statements, the journal, positions, cycles, execution rows, cost estimates, the BAE list. The code calls it CUI | The board file; downloads; the shared folder; the AI review request wherever it is carried |
| A2 | The same data in browser storage: every appropriation's store, kept-aside copies, the side stores | The browser profile (section 6) |
| A3 | The integrity of the money math. Every figure is briefed to decision makers; money is whole dollars | The code; the money map (section 8) |
| A4 | Which program a person runs | The board file (a saved board carries its own code) |
| A5 | The person's work being there tomorrow | The board file, storage, the folder |

The v1.99 edition listed a credential (the live-view key). There is none since v2.04.

### Actors and entry points

| Actor | Can do | Entry points | What the board does today |
|---|---|---|---|
| **A sender of a crafted file** (email, Teams, a shared drive) | Send a board, state JSON, package, submittal, band ladder or workbook that someone imports. Or send a board someone opens directly: that runs the file's own program, and the import door does not apply | Section 4, "File imports"; opening a file at all | The door on every file import; a newer version refused; `awdNorm`; `svcGuardImport`; preview confirms on packages and submittals; all-or-nothing commits; escape where drawn and `jsa()`. `which-build.mjs` names the program in a file before anyone opens it |
| **A peer writing the shared folder** | Write any file in the folder: the folder copy, peers' files, locks, `history/`, execution rows, estimates. If the program file sits where they can write, the program too | Section 4, "Shared folder" | `driveParse` runs the door on every read; `liveTooNew`; time and base checks; work kept aside before adoption; history copies before replacement; the cooperative writer check |
| **The AI service, or whoever handles the request and answer** | Read the request; write an answer the person imports | Section 4, "The AI review" | The request is a file the person carries; the answer passes the door, is checked line by line against the board, is drawn escaped, and changes nothing on the board |
| **Someone writing the legacy state file** beside the board (only when `spmtSidecar` is set, or when served over http(s)) | Answer the board's one request | Section 4, "The legacy state file" | The door; never over work typed in this session; unsaved work kept aside first |
| **Someone with the machine after the person** (a shared PC, a later user, a lost laptop) | Read browser storage, the IndexedDB handles, the download folder and saved boards. Open the board and see the last work restored | Section 6 | Clear this computer removes the board's storage on request; nothing beyond what the operating system and browser provide otherwise |

### Goals an attacker would have

- Run script in the board's page, which can read and change every appropriation in browser storage (A1, A2).
  The Content-Security-Policy stops such script reaching another host to send data out; it does not stop
  inline script from running (section 5).
- Change a figure without anyone noticing (A3).
- Get a person to run an unreviewed program (A4).
- Stop the board opening, or overwrite work (A5).

Whether, and where, any of these can be reached is in the private annex.

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

**The traceability table is not done.** It is queued with the IL5 work (`NEXT-VERSION.md` item 100): each
behaviour this guide lists traced to the specific control, requirement, CWE or technique it bears on, cited
from the source; and, stated separately, what the hosting environment rather than the board must provide.
Which controls fall to the board and which to the platform depends on the deployment decision in section 1.

---

## 11. The private findings annex

A private findings annex exists. **The owner holds it. It is not in this repository**, and nothing in this
repository may quote it. It holds the classification of each sink in `review/sinks.csv` and the findings
register. It was written against the v1.99 edition of this guide and its line numbers; whether it is
refreshed for this edition is the owner's decision. Ask the owner for access.
