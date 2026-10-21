# E2 handoff for Codex: decoding `_xHHHH_` when a workbook is imported

**From:** the v2.02 working session, 21 Oct 2026, for Brad to send to Codex.
**Repository:** `bradludington-ui/orbit-board`, branch `ccr-f11beb69-61ml9m`, at `55ba6f3` or later.
The board's code is the same as `main` (`c357911`) apart from v2.02's E1 to E7 fixes, none of which touch the workbook
reader or the XML writer.
**Asked of you:** a memo, not code. It is your P1 from the 19 Oct cut: *"write the memo first; build after the memo."*
Read `CLAUDE.md` first. Its section **v2.00 (item 99)** and the U37 entries in `NEXT-VERSION.md` are the background.

## 1. What happens today

ORBIT has its own XLSX reader (`xlsxRead`, about line 12560 of `prioritization-board-grid.html`) and its own writer
(`buildXlsx`, about line 26200). Neither handles the OOXML escape `_xHHHH_`.

**Reading.** In ECMA-376, text in a workbook part (`ST_Xstring`) may carry `_xHHHH_`. HHHH is the hex of one UTF-16 code
unit, used for a character XML cannot hold as written. A literal underscore that would otherwise start such a sequence is
written `_x005F_`. Excel and LibreOffice decode it. LibreOffice writes a U+000B as `_x000b_`, in lower case.
`xlsxRead` does not decode it. `_xunesc()` (about line 12550) decodes only `&lt; &gt; &quot; &apos; &#NN; &amp;`, so
`_x000b_` reaches the board as the seven characters `_x000b_`. That happens at three places:
- shared strings (line ~12600);
- inline strings (line ~12653);
- sheet names (`nameRaw`, line ~12633).

**A side finding in the same reader.** A cell with `t="str"` (a formula's string result, line ~12660) is taken as
`vm[1]` raw, not even through `_xunesc`. So `&amp;` in such a cell stays `&amp;`. Please say whether E2 should take this
too.

**The four imports that use the reader** all put workbook text into the board's stores:
- `importSrc` (the CCaR Spend Plan Source, line ~12846);
- `importBud` (the BAE budget list, ~15040);
- `importCcarRecs` (~15287);
- `importAce` (the cost estimate, ~15351).

These are not covered by the import check (`inboundCheck`). Their text is escaped where it is drawn (v2.00).

**Writing (U37, v2.00).** `_xesc()` escapes `& < > "` and writes a CR as `&#13;`, and nothing else. Before a byte is
made, `_xlsxRefused()` refuses the workbook (it does not clean or cut) in two cases:
- a sheet name or text cell holds a character XML 1.0 forbids (`XML_BADCH`);
- in a workbook only, a literal `_x[0-9A-Fa-f]{4}_` (`_xmlBad`, about line 26130), because a spreadsheet would show it as
  the one character it spells.

`_xmlShow` quotes the text around the problem, and `_xmlRefuse` says that nothing was made and nothing on the board
changed. A deck (`exportPPT`) refuses only the forbidden characters; it shows `_xHHHH_` as typed.

**The result, which is Brad's named limit of 19 Oct.** A CCaR or BAE workbook that another program wrote with a
`_x000b_` in a title imports with those seven characters in it. Every workbook export that later carries that text is
refused, naming the sheet and cell. The person has to correct the source file and import again. The 19 Oct decision put
"decode such codes at import" on the post-merge list, which is this item.

**Why the writer refused rather than escaped (19 Oct).** You proposed the refusal over the OOXML escape at the time. The
board's own reader keeps `_xHHHH_` as written, so if the writer escaped, the board would read its own workbooks back
differently from what it wrote. **If the reader decodes, that reason changes.** The memo should say whether the writer
should then escape too, or keep refusing. See question 6.

## 2. What the memo needs to settle

Please answer each one. Where a question is about what Excel or LibreOffice does, measure it or say that you did not.
`NEXT-VERSION.md` records that Office was not run for U37, and only LibreOffice 24.2 was.

1. **The grammar.**
   - Exactly which sequences decode: `_x` + four hex digits + `_`. Are both cases accepted?
   - Is `_x005F_` honoured as the escape for a literal underscore, so `_x005F_x0041_` reads `_x0041_`?
   - How is overlap handled (`_x0041__x0042_`, and `__x0041_`)? Is decoding left to right and single-pass?
2. **What a decoded unit may be.**
   - A surrogate pair across two escapes (`_xD83D__xDE00_`) gives one emoji. What about a lone surrogate?
   - What about `_x0000_`, a character XML forbids (U+000B), and U+FFFE/U+FFFF? Each one: decode, keep as written, or
     refuse the import?
   - A decoded forbidden character would then be refused by the writer as a forbidden character (`XML_BADCH`) instead of
     as `_xHHHH_`. Is that the right outcome, or should the import say so at the door?
3. **Where decoding applies.**
   - Shared strings, inline strings, sheet names, and `t="str"` cells (above)?
   - Anything else the reader takes text from? Number formats are not read today.
   - Is one helper (decode after `_xunesc`, in that order) correct, or does the order matter? `&amp;` is decoded last in
     `_xunesc`, for a reason stated in its comment.
4. **The board's own workbooks read back.**
   - Today ORBIT never writes `_xHHHH_`, because a literal one is refused. So decoding cannot change how the board reads
     its own output. Is that right?
   - Which existing checks read the board's workbooks back with `xlsxRead` and would notice? `audit-recon.mjs` and
     `audit-import.mjs` both call it.
5. **Text already on boards.**
   - Boards saved before E2 may hold a literal `_x000b_` that came in through an import. Should opening such a board
     convert it, or not? The board's posture is "repair and report on open, never zero" for awards (v1.95, R09), and
     "kept as saved" for codes and quantities (v1.99).
   - Can ORBIT even tell that such text came from a workbook?
6. **The writer.** Once the reader decodes, should `_xesc` write the forbidden characters as `_xHHHH_` (and a literal
   `_xHHHH_` as `_x005F_xHHHH_`), so that the workbook export stops refusing them? Or should it keep refusing?
   - What each choice does to U37's checks and its 87 mutations (`v200-u37-*`).
   - What it does to the deck, which has no such escape.
   - What it does to CR, which v2.01 writes as `&#13;` (Codex D4-1).
7. **What is said.** Does the import report how many cells it decoded, or say nothing? If it refuses something, how is
   that worded? Follow the existing `inRefuse` / status-line conventions.
8. **The checks the build needs.**
   - The fixtures: a workbook written the way Excel and LibreOffice write these. ORBIT's writer cannot make one, so the
     fixture has to build the XML itself.
   - Expected values are hand-written literals, never read back from the board.
   - Each new check must fail on `55ba6f3` and pass on the fix. CONTROLs pass on both.
   - Name the mutations, each matching once in the board.
9. **Scope and risk.**
   - Anything this touches that is money? A budget name, a CCaR record or a cost-estimate line name is a key the board
     matches on: the BAE name rule, `budResolve`, and `ccarNorm`.
   - Could decoding change which budget or record a line matches? For example, could a BAE name that matched only because
     both sides kept `_x0020_` stop matching?
   - Say whether the money map (`npm run money-map`) or the trace matrix (`npm run trace`) needs a new cell.

## 3. Rules for this work (from `CLAUDE.md` and `AGENTS.md`)

- The can't-fails are **data loss and money**. Nothing imported is ever silently cleaned, cut or zeroed.
- `tools/export-audit/mutate.mjs` is **read as text only**. Never import it; never run `npm run mutate` or
  `validate:math`. The sweep runs only on Brad's named go.
- Do not commit a populated board. Do not merge, deploy or publish anything; draft PRs only.
- `npm run check` must pass on any tree you propose.
- The memo goes in `recovery/v202/` (e.g. `E2-MEMO.md`). Mark each claim as **measured** (with the command or file) or
  **inferred**, the same as the earlier memos.

## 4. What happens after the memo

Brad decides each open choice in it, chiefly questions 5 and 6. Then E2 is built in the v2.02 session:
- with the checks named in question 8;
- with the mutations counted to match once each;
- through the usual `npm run audit` and `verify:grid` runs;
- recorded in `NEXT-VERSION.md` under E2.
