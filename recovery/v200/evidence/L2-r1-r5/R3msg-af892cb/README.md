# The R3 status-message change (Brad approved it on 11 Oct): evidence at `af892cb12713dd22afd9a84c0ec604b30614f6ea`

**Draft check before committing** (`fail-before/`): the new block was run alone through the focused harness, at 6:01 PM ET,
with the sensitivity driver paused so nothing overlapped an audit-import.

| Board | Result |
|---|---|
| `7e0764d` (before the change) | exit 1, 2 failing: the two message checks. The data controls pass |
| the changed board | exit 0, all pass |
| v200-r3-landed-view-unsaid | caught, 2 failing: the message checks |
| v200-r3-landed-view-prefix | caught, 2 failing: the message checks |

**One expectation was removed before the commit:**
- A first version of the block also asserted that the screen reads saved after leaving the view. That failed on the
  changed board too (`focused-*` runs at 5:59 PM ET, kept in the scratch record).
- That behaviour is not part of the approved message change. It is the stale on-screen flag that is now tracked (see
  `../R3-late-window-8f22668/CORRECTION.md`). So the check was removed rather than asserted either way.

**Integrated validation at af892cb:**
- **Probes:** money 13/13, code 6/6, races 6/6.
- **The lead's cross-checks:** all three pass.
- **Mutation applicability:** 1,294 entries, each matching once.
- **The committed block:** byte-identical to the one run, and it passes alone (exit 0, 7.8 s).
- **Full audit-import.mjs at af892cb:** run alone, as the BASELINE of the sensitivity sequence that started at 6:03 PM ET in
  a git clone of the commit. It is recorded with that sequence.
