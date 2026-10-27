# v2.09 second review — the five-years fixes, round 2 (item 126)

Branch `v209-rv2-years` from `bc3a0f6` (the board the second review read is `ba3c294`, byte-identical). Four confirmed findings
(the years reviewer's `repoint-no-provenance-lands-on-other-copy` and the meet reviewer's
`repoint-unstamped-link-takes-other-copys-proposal` are one defect, fixed once). Each fix has a block in `audit-import.mjs`'s W2
slot, named "v2.09 second review — …", that fails on `ba3c294` (26 failing checks there, every one that is not labelled CONTROL),
and mutations that undo it, proved CAUGHT by `recovery/v208/bin/prove.py` (`proofs-RV2-years.json`, `proved-RV2-years.jsonl`).
`BUILD` is not bumped here.

## What was fixed

1. **A link the team copied or rolled forward was re-pointed onto another copy's proposal**
   (`repoint-no-provenance-lands-on-other-copy` = `repoint-unstamped-link-takes-other-copys-proposal`; introduced by the first
   round's fix). `yearCopy()` carried a link as `{fy, id}` and nothing else, so a copy of a requirement whose link still named an
   office's provisional id (NEW-PSM-1) had no provenance to say which copy minted that id; `pmoRepointLinks()`' fallback for such
   a link took the one proposal it found under the id, from any copy. Two copies out at once number alike, so FY30's copy of copy
   B's Bravo was pointed at copy A's Alpha: it read "Continues FY28 NEW-1 — Alpha", Roll forward said Alpha was already in FY30
   and never put it there, and Bravo, accepted later, went into FY30 a second time.
   - **The stamp travels with the link.** `pmoLinkStamp(c)` names the copy that minted the id a link names: the link's own
     `pmo`/`pub`, else the requirement's provenance (`from`: an office's proposal links only to that office's own proposals,
     minted by the copy that sent it). `yearCopy()` — Copy to year, Move to year, Roll requirements forward — writes it onto the
     copy's link (`pmoLinkKeep`) while the link names a provisional id. `priorOk()` ignores extra keys, so the door takes it, and
     a saved board with such links passes `inboundCheck` (checked).
   - **One rule for what a link names, `pmoLinkTo(c)` → `pmoProvOne()`**, read by the re-point and by `priorLink()` (the RECORD
     panel's Continues line, the Priority Drill), so a link never reads as work the next Apply would not point it at. It is
     `pmoProvIn`'s rule made unambiguous for a link that is written: the same copy's proposal where the link says which copy;
     failing that, the one proposal accepted before stamps were kept (`pmoProvIn`'s own exception, now only where it is alone);
     and a link that says nothing of its copy only where the one proposal under its id says nothing either. Anything else leaves
     the link on the copy's id, which reads "PSM proposed it, and it has not been accepted" — true. Both sides choose from one
     candidate list, `pmoProvL()`.
   - **The re-point keeps the stamp** (`Object.assign({}, p, {fy, id})`), so the journal holds one change (the id) and Put back
     of it restores a link the next Apply can still read.
   - The fallback branch is gone: it was the looser second rule.
2. **A chain of links across years Apply starts named only the first duplicate** (`chained-unstarted-duplicate-not-named`).
   `pmoPriorHere()` was one link deep. A recurring requirement is brought in one year at a time (decision 5), so FY32's
   proposal continues the office's FY31 one, which continues FY30's A; FY32, rolled forward, held A, and the FY32 proposal went
   in beside it with nothing said, while the duplicate question named FY31's alone and its Cancel said the duplicate was left
   out. It now walks the chain: each link to what it names — a requirement this board holds (filed proposals through the
   provenance, as before; board ids by `yrItemOf`) or the office's proposal held for review that it has not filed yet
   (`pmoHeldProp`, ticked or not, by `pmoProvIn`'s rule on the package's office and stamp) — then that one's own link, until
   something the year holds is the same work, or the chain ends (twelve links at most, no link twice). The same walk serves the
   review (`.subroll`, `.subhere`), the change report, the roll-forward questions and the duplicate question, so Cancel leaves
   exactly the named ones out. Covered both ways it happens: two years Apply starts in one Apply, and the first proposal
   accepted (into a year started blank) an Apply before the second.
3. **A re-rank in a year the copy does not submit for went unsaid at Submit** (`outyear-ranking-silently-dropped`; older than
   v2.09). The office's own ranking is outside the change journal (`JRNL_SKIP`), so `pmoOutChanged()` never saw it. A copy now
   carries the office rankings of every year it holds outside the window as published (`mode.oord`, beside `yord`), and
   `pmoOutReranked(y)` counts such a year when the office's list there differs on the requirements both lists hold (the way
   `pmoRankBuild` reads a year it sends). With only the re-rank, Submit says "Nothing to send … FY27 is not one of them"
   instead of "Nothing to send yet … Re-ranking your own list is sent too". A copy published before this review carries no
   `oord` and is read from the journal alone, as before (a CONTROL).
4. **Submit said "Everything else you edited is still being sent" before a refusal that sent nothing**
   (`outyear-alert-before-name-check`, partly: the skeptic's core). The editor-name check ran after every withheld-edit alert.
   It now runs before them, where a package will be built; and the tail "Everything else you edited is still being sent" is
   said only when something is — with nothing else to send (another office's edit alone), the alert names what is withheld and
   the next says "Nothing to send yet", and no name is asked for. All four alerts (incomplete proposals, another office's,
   restored, the out-year) take the tail from one place (`rest`).

## Decided in the fix

- **The stamp lives on the link, not on the requirement's provenance.** A team copy has no `from` of its own, and giving it one
  would make it read as an office's proposal everywhere `from` is read (taken-as, the review). `prior.pmo`/`prior.pub` say only
  which copy minted the id the link names. An accepted proposal is not stamped twice: its `from` already says it.
- **A link from before stamps were kept is re-pointed only where nothing is ambiguous**: the one proposal under its id, itself
  accepted before stamps. A link with no stamp beside a proposal that carries one is left on the copy's id, which reads "PSM
  proposed it, and it has not been accepted". Such a link can come only from a board saved before this fix; v2.09 has not
  shipped, and on v2.08 a copy could not send a proposal for another year, so none can name an accepted proposal.
- **"Has the board taken it?" stays the loose reading** (`pmoProvIn`: the first match), because yes is the safe answer there (a
  proposal is never added twice), and so does the same-work walk (a duplicate named is the reviewer's call; one missed is
  counted twice). Only a link that is WRITTEN, or read as the work it continues, uses the strict one.
- **The chain is walked through every held proposal of the same office and copy, ticked or not**: what it continues is the
  same work whether or not this Apply takes it.
- **The name is asked first only where a package will be built.** A Submit with nothing to send is not asked for a name; the
  skeptic's simpler order (the name before everything) would have asked for one there too.

## Checks (audit-import, W2 slot, named "v2.09 second review — …")

| Block | Fails on ba3c294 |
|---|---|
| a link the team copies or rolls forward is re-pointed only to its own copy’s proposal | 10: the stamp on the rolled and copied links, neither re-pointed onto Alpha, the older unstamped link not guessed, the record text, Roll forward of Alpha creates it and lands, both copies re-pointed to B's Bravo once accepted, the older link left, Roll forward of Bravo finds it there, FY30 holds each once |
| a chain of links across years Apply starts names every duplicate, and Cancel leaves exactly those out | 10: both review rows, the report, the FY32 question, the duplicate question naming both, Cancel leaving both years holding A once, the line, ALREADY HOLDS through X once the years exist; and with X accepted an Apply before: the review, both questions, Cancel |
| a re-rank in a year the copy does not submit for is said at Submit | 4: the copy carries FY27's rankings, Submit with the re-rank alone, Submit with an edit in FY28 and its line |
| Submit asks the editor name before it says anything is still being sent | 2: no name, nothing else to send |

Controls: a link with no stamp is still re-pointed where the one proposal under its id carries none (legacy), and left where two
carry it; a saved board with stamped links passes the import check; a re-rank in FY29 is sent; an older copy reads the journal
alone; named, the package goes with every tail.

Changed on purpose: `audit-import.mjs` "v2.09 review — a link to another of the office’s proposals …", check "and so does Q’s copy
the team rolled into FY32" now reads the link's year and id (the link also carries the stamp, which the re-point keeps).

## Mutations (mutate.mjs W2 slot, `v209-rv2-years-*`)

12 new: `copy-drops-stamp` (yearCopy), `link-any-copy`, `unstamped-guessed` (pmoProvOne), `repoint-loose` (pmoLinkTo),
`prior-from-only` (priorLink), `chain-one-link`, `chain-filed-stops`, `chain-held-unread` (pmoPriorHere), `publish-no-oord`
(publishPmoCopy), `out-rank-uncounted` (pmoOutChanged), `name-after-alerts`, `rest-always` (pmoSubmit). Retargeted in place, each
with a comment: `v209-w2-link-not-repointed` (the re-point keeps the stamp), `v209-w2-link-proposal-said-gone` (the office is read
from the stamp), `v209-rv-years-repoint-needs-provenance` (its branch is gone; aimed at the stamp `pmoLinkStamp` reads). Every
existing v2.09 mutation whose find sits in a function changed here was proved again against its own check, with three v2.06 ones
in `yearCopy` and `pmoPriorHere`. No sweep was run.

## Run

- `npm run check`: all checks passed. `mcount.py`: 2,612 entries, each matching once.
- `prove.py` (JOBS=2, HEAP=4096): 32 of 32 CAUGHT, none by a throw (`proved-RV2-years.jsonl`).
- `audit-import`, slimmed to every block naming a function changed here (37 scenarios: the year copy, the PMO copy and
  handoff blocks, scoped submittals, v1.84, v1.86, v1.89, every v2.06, the v2.07 and v2.08 PMO-copy blocks, every v2.09 W2,
  review and second-review block): all pass but v1.86's File-menu block, which reads `V14` from the block before it; run with
  that block, it passes.
- `audit-board`, `audit-other`, `audit-hostile`, `audit-inject`, `audit-ui`: whole, all pass. `audit-recon` slimmed to the two
  blocks naming `publishPmoCopy`/`pmoSubmit` (U32/U33, U44), at an 8 GB heap: pass (at 4 GB it died out of heap, as CLAUDE.md
  says recon does).
- The round-trip fuzz: nothing lost (seed 40596006). `tools/pmo-years-render.mjs`: every check passes.
- The reviewers' own repro scripts (`rev2/years/p1b`, `p2`, `p5b`, `p5c`; `rev2/meet/r1b`; the skeptic's `unstarted1`,
  `twopass` and `direct` variants), pointed at this board: each now ends as the finding says it should.

## Known gaps

- `yearHas()`/`yearLinkOf()`'s "twin" rule (two requirements carrying the same link are the same work) compares the link's year
  and id only. Two copies' continuations, both still on the same provisional id, would read as one there until they are
  re-pointed. Not a finding of this review; noted for the next.
- A board written by a pre-fix v2.09 build that already re-pointed a link onto the wrong copy's proposal keeps that link (it no
  longer names a provisional id). v2.09 has not shipped; Put back of the re-point undoes it.
