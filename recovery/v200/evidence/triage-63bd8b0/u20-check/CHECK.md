# CHECK of the U20 probe (`rec/L4/u20`), by an independent checker

**Result: I agree with the builder's verdict, REPRODUCED.** I re-ran the probe twice and got the builder's results byte for
byte. I also re-ran its route (ii-b) on product paths, with no harness shortcut. The harm reproduces there too: a refresh
during the wait records the folder's copy, and the waiting save writes over it without asking.

**Corrections to the builder's report (none of them changes the verdict):**
1. **Three of its five trigger scenarios reach their starting state through a harness shortcut.** BR-W, BR-Wtick and BR-Wh
   skip the opening's pull, which the README does not say. The effect does not depend on that shortcut; see section 4.
2. **The builder's controls (C1) differ from the trigger in more than the trigger.** I added controls that remove only the
   trigger, and they confirm that the failure comes from the uncounted wait.
3. **The builder's observation O4 is wider than it reports.** In one tab, the Live timer alone writes over the folder's copy
   without asking, one tick after saying "Nothing was written". It also means the builder's U20 correction **alone** does not
   keep the folder's copy when Live autosave is on.

**Scope.** Board `98eed7e8` (orbit-board `63bd8b0`). Checked from 11:38 to 11:57 AM ET and from 3:19 to 3:30 PM ET, Mon
12 Oct 2026, with a usage-limit break between the two. This file was written between 3:26 and 3:30 PM ET. The details of every
run are in `README.md`.

## 1. Re-running the builder's runs

The probe, mock, locktest, check, table and Chromium scripts in `rerun/` are byte-identical copies of the builder's (same
blobs, below), run against `b63/`, a `cp -a` of `../base`. Each node run was one `setsid -w timeout -k 10 600` call through
`q.sh`. `AUDIT_IMPORT_RUNNING` was checked first each time; it was never present.

| what | builder (r1, r2) | checker (c1, c2) | same? |
|---|---|---|---|
| `locktest.mjs` (the mock's own tests) | 19/19, 19/19 | 19/19, 19/19 | yes |
| 26 scenarios, `u20probe.mjs` `677d6f3f` | all exit 0 | all exit 0 (c1 11:42:19–11:46:47; c2 11:48:03–11:50:56 AM ET) | yes |
| `check.mjs` `11472aaf` | 369 checks: 354 pass, 15 fail (9 U20, 6 OUT) | the same | **`check-c1.log` = builder's `check-r1.log` and `check-c2.log` = `check-r2.log`, byte for byte (`cmp` exit 0)** |
| `table.mjs`, c1 vs c2 | identical for 26/26 | identical for 26/26, and the same as the builder's `table-r1.md` once digits are set aside | yes |
| `chromium-locks.mjs` `f325c6ea` (real Chromium, `/opt/pw-browsers/chromium`) | 19/19, 19/19 | 19/19, 19/19, the two logs identical | yes |

The builder's own counts also check out. Its `pids.txt` has 108 `timeout` processes and 30 children shown as `gone`. Its
`runs.txt` has 52 r1/r2 runs. Its non-zero exits are exactly the four it lists: `dev-BR-C2ah`, `locktest-dev`,
`chromium-dev` and `mkdiff`. No run waited or timed out.

## 2. Are the expected values hand-written literals?

**Yes, in `check.mjs`.** Every `want` is a literal: the fixtures' lineage tables and leaf lists are written by hand, and the
board is never run to produce an expected value. The one predicate, "wrote over a copy without asking", combines observed
values (`rec.before`, `rec.after`, `rec.asked`) with the hand-written lineage.

**One expected value was changed after the builder saw data.** At 10:48 AM ET the builder dropped N2-NEWER from AD-C2b's
leaf list, after the first check of r1. I find the change **justified**:
- in AD-C2b, X's save of N2 is refused at X by construction (WORKING landed first), so N2 never reaches this board's folder;
- the builder added a check that X's save was refused (it passes);
- the change is disclosed in its README.

It is still a post-hoc change, and I note it as such.

**My own literals (`x/xcheck.mjs`) are also hand-written.** They were last edited at 11:51:20 AM ET, before any check was
run on any of my outputs. Its header says it was written "before any added scenario was run", and that is **not accurate**:
- two development runs (`xdev-BR-Wreal`, `xdev-O4-tick`, 11:47 AM ET) had been run and viewed (`xshow-dev`) before then;
- pass xc1 had started at 11:51:01 AM ET.

Pass xc1 is a preview only, not evidence. Its first two runs used an earlier probe blob (`e06019f9`); the probe was edited at
11:51:11 AM ET to add BR-Wrealtickcount. **The evidence is passes xc2 and xc3:** all 22 runs used probe `795f0928`, and
`xcheck-c2.log` = `xcheck-c3.log` byte for byte.

## 3. Do the controls separate the trigger from the harness?

**The builder's controls are healthy.** CTL is 109 pass, 0 fail per pass, and PB-NL shows that without `navigator.locks`
nothing waits.

**But C1 differs from W in two ways, not one.** In C1, B's save is counted, and it is also already running, holding the lock
and stopped at its read of the folder. So C1 shows that a *running* save is protected. It does not show that counting alone
removes the harm.

**I added controls that change only the count** (`x/u20x.mjs`, the `*count` scenarios). Each is the W scenario exactly, with
B's `navigator.locks.request` wrapped so that B's own `_saveBusy` goes up when the lock is asked for and down when
`request()` settles. That is what the builder's `PROPOSAL.md` would do. The board file is untouched.

| control (xc2 and xc3) | the same as | observed | result |
|---|---|---|---|
| PB-Wcount | PB-W | ↶ Put back **refused** ("Not put back: a save was under way"); then S1's save lands | as PB-C1: pass |
| AD-Wcount | AD-W | the refresh **refused** ("was not loaded"); the save refuses with the choice | as AD-C1: pass |
| BR-Wcount | BR-W | the refresh records **nothing** (base 0); the save refuses with the choice | as BR-C1: pass |
| BR-Wrealcount | BR-Wreal (section 4) | as BR-Wcount | pass |

CNT is 45 pass, 0 fail in both xc2 and xc3. **The failure is attributable to the uncounted wait alone.** The lock mock was
never held twice: 0 violations, `maxHeld` 1, nothing unmodeled, and every grant released, in all 22 evidence runs.

## 4. Are the routes product paths? Where a shortcut could create or hide the effect

| step | in the builder's probe | could it create or hide the effect? | tested |
|---|---|---|---|
| B's connection, BR route (BR-W, BR-Wtick, BR-Wh, and controls C1, C1h, C2a, C2b, C2ah, C2bh) | the harness `connect()` sets `_driveDir` and `liveCfg` directly. **The opening's `driveAutoConnect` pull never runs.** X saved F0 **before** B opened F1. | **Could create it.** By code, a real opening with permission kept would find F0 newer than the screen and not DIRTY, so it **adopts F0 and records it** (`driveStorePull`, `driveBaseSet(…, theirs, true)`). B-EDIT would then descend from F0, and BR's starting state ("nothing recorded, B-EDIT not from F0") would not arise. | **Yes: BR-Wreal, BR-Wrealtick, BR-Wrealh.** B opens first and connects through the product's own `driveAutoConnect()`. The folder holds no O&M copy (`B:miss:spmt-2027-om.json`), so nothing is recorded. **Then** X saves F0, and **then** B types B-EDIT. The refresh is Live view's "↻ Refresh now" (`livePoll(false)`) or the Live timer (`liveTick`). **All three write over F0 without asking.** BR-Wrealh also loses F0 after the next Save. Control BR-C1real is healthy. **The shortcut did not create the effect.** |
| BR-Wperm, BR-Wpermh | `driveAutoConnect` with permission not kept stops at one click; the refresh is the bar's Connect (`driveConnectNow`) | product path already | (builder) |
| AD route | harness `connect()`, no opening pull | would hide nothing. By code, the opening pull finds F0, which equals the recorded base, so it does nothing; the starting state is the same. | by code |
| PB, PF routes | the page's own buttons (`#saveBtn`, `.keptbtn`, the status line's buttons); u2variants and u19 fixtures | — | — |
| questions | `window.confirm` answers OK (folder) or Cancel (file) | Answering OK could hide an unasked write as an asked one. Not here: every W route recorded 0 questions. | read from the JSON |
| Live autosave | the harness turns on `_liveCfg.on/auto` and `_driveLive`, and calls `liveTick()` directly | It is the same function the timer calls, so nothing is created or hidden. | — |
| tab A's held save | A's real 💾 Save, held at the close of its write by a hold in the folder mock | — | — |
| Chromium premise | the builder served the board at `https://orbit.invalid` by request interception | **Could hide it.** The board is opened from a **file**, so a `file:` origin might lack `navigator.locks` or not share it. | **Yes, `x/chromium-file.mjs`** (c1, c2 identical). Two tabs of the same `file://` path: `navigator.locks` is present and `orbit-save` is shared. B's waiting save stays uncounted: [A holds, A busy 1, B busy 0, B not run], then B runs counted inside. **2/2 PASS.** INFO, raw and not checked against literals: two **different** board files also shared the lock, so a tab of *any* ORBIT board opened from disk in that profile can be "tab A". |

**Routes neither the builder nor I tried:**
- Load theirs, or Save yours over theirs, as the waiting operation;
- ✍ Take the pen;
- the U24 paths (`sharedArrived`/`adoptShared`, `bootTakeFile`, `importBoards`);
- two tabs on the same appropriation;
- a tab closed while it holds the lock.

## 5. Does the verdict follow from the evidence?

**Yes, for the U20 harm on route (ii-b).** On `98eed7e8`, a refresh during another tab's save records the folder's copy.
B's waiting save then writes B-EDIT over that copy with no question. With a history copy under ten minutes old, that copy is
in no place the board can reach after the next Save, which is a P1 shape. The routes are:
- the builder's product routes, BR-Wperm and BR-Wpermh;
- my product routes, BR-Wreal, BR-Wrealtick and BR-Wrealh.

My copy of the builder's table agrees with its outcomes for routes (i) and (ii), which do no harm. The builder's
likelihood caveats stand, and likelihood was not measured.

**Where the report understates: O4 is wider, and it limits what the U20 correction protects.** The builder describes O4 as
"a refresh that comes **before** the first Save", and says "BR-C2b's first Save does ask". I measured the following (xc2 and
xc3 identical):

- **O4-tick and O4-tickh: one tab, no lock contention, no tab A, no button.** Live view and autosave are on, B-EDIT is
  unsaved, nothing is recorded, and F0 is in the folder.
  - Tick 1's autosave is refused: "⛔ Alice saved O&M FY27 … Nothing was written. Load theirs · Save yours over theirs".
  - The same tick's refresh then records F0.
  - **Tick 2's autosave writes B-EDIT over F0 without asking**, and says "✓ Saved to the shared folder automatically".
  - With history (O4-tickh), F0 is kept only as `-recent`, and **the next Save prunes it, so F0 ends in no copy.**
  - The question the board did ask is undone within one tick, with no action by the user.
- **BR-Wrealtickcount:** the waiting save is counted, standing in for the builder's U20 diff.
  - B's save is refused, as intended.
  - But tick 1's own refresh, which runs after that refusal, records F0.
  - **The next 💾 Save then writes over F0 without asking.** So with Live autosave on, the U20 correction alone does not
    keep F0. The builder says its correction "closes the U20 part only", which is true, but this consequence is not stated.

These are outside U20 (they are the v1.89 "taken as the base, as it always was" path). I put them as a separate proposal in
`PROPOSAL.md` here, which has not been applied or run: record the folder's copy as the base only when it is what is on
screen (`theirs===ours`).

## 6. Was any proposal applied?

**No.** The evidence:
- **The board is unchanged everywhere.** `../base`, the builder's `b63`, my `b63`, `63bd8b0:` and orbit-board `HEAD:` are
  all `98eed7e8`, re-hashed at 3:21 PM ET. The orbit-board HEAD is now `a386223`, from records-only commits made after the
  builder's run by other work; the board is unchanged. Its working tree is clean.
- **orbit-ui** shows ` M ui-concept/CHUNK3.md` and `?? node_modules`, from the separate UI session. Neither the builder nor I
  wrote there.
- **The builder's patched copy was never run.** It is `proposal/patched-copy-NEVER-RUN/…html`, blob `b00af156`. The
  builder's `pids.txt` has no node or Chromium run of it, only `mkdir`, `cp`, `chmod`, `diff` and `hash-object`.
- **The builder's diff is what it says it is.** `diff -u ../base … patched-copy` reproduces
  `proposal/U20-count-waiting-save.diff` byte for byte (`b3a5ff25`; `cmp` exit 0). `git apply --check` of it on my `b63`
  passes; that command writes nothing.
- **My own O4 diff was not applied either.** It was only `git apply --check`ed, alone and together with the U20 diff, and
  both pass. The first attempt failed on a malformed hunk in my diff text, which I then fixed.

## 7. Deviations (both sides, stated plainly)

**The builder** disclosed all of the following:
- read-only shell commands ran without the bound;
- one **unbounded `python3` one-liner** edited its own `locktest.mjs` at about 10:30 AM ET, with no PID recorded. This is a
  breach of the standing rule;
- the post-hoc correction to `check.mjs` (section 2).

**The checker (me):**
- Read-only commands ran without `setsid -w timeout`: before `q.sh` existed (before 11:38 AM ET), and at the start of the
  resumed session (3:19–3:24 PM ET: `ls`, `cat`, `sed -n`, `grep`, `diff`, `stat`, `ps`, and a `/proc` liveness loop over
  my own PIDs). No node, python or Chromium command ran unbounded.
- The inaccurate header in `xcheck.mjs` (section 2).
- The mixed-blob xc1 preview (section 2).
- **A reused PID.** At 3:23 PM ET, PID 21434, recorded in my `pids.txt` for `cmp-xcheck-c2-c3` (ended 11:55 AM ET), belonged
  to **another session's** `run.sh`. It was left alone. Nothing was killed by this check.
