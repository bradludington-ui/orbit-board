# Independent C2 policy review

Source inspected: empty base 7ee498a46507972f803cd48ce9f27d5d668acb63 and supplied round-2 ledger/status text. No runtime tests, exports, font measurements, code changes or mutations were run by this reviewer. Ledger reproductions and the reported 14.6% font measurement remain reported evidence here.

## U9: the funded office figure

The source uses two different allocation grains. `pmoPartsOf` (base lines 11464 onward) first splits each service's ask among offices, then draws discretionary, mandatory and unfunded against the office capacities. `srcRowsOf` (17164 onward) emits each funded service, lane and incremental-award amount, then `clinSplit` apportions that amount to CLINs. Spend Plan Source includes BOTH discretionary and mandatory (`SRC_BASIS='funded'`, 11885; lane walk 17261). Do not compare a combined office funded total with discretionary-only source lines, an ask, or a different service/FY/award grain.

Important caveat: its current PMO column is the requirement's home (`r[18]=grpOf(it)`, 17242), not the CLIN-derived office. Therefore simply summing the current exported PMO column is not an independent statement of each CLIN-owning office's money. Mapping the CLIN to its office is part of the proposed policy.

Recommend a single funded-ownership basis: actual whole-dollar CLIN amounts per service, lane and dated award, grouped to office, summed consistently by all funded-office screens and exports. The current exact-split U9 arithmetic repair is a separate, already corroborated correction; this memo should not re-authorize or undo it. Existing entered budgets, CLIN asks and awards must remain unchanged. The policy change redistributes office attribution, not the requirement/service/lane grand total or stored funding.

The current capacity-first policy deliberately guarantees each office's discretionary + mandatory + unfunded = office ask. Independent lane/award rounding cannot always preserve that guarantee while matching actual source CLIN amounts. Literal illustration: two equal CLIN weights, ask $2, discretionary $1 and mandatory $1. Capacity-first gives offices $1/$1 funded; independent $1 lane apportionment with a fixed earlier-CLIN tie break gives office A $2 and B $0. Under a source-line policy, ask/unfunded must use a clearly specified compatible display definition, not silently clamp a negative residual or assert every office stays within the earlier apportioned ask. This is a real policy consequence, not a coding detail.

Required scope for approval: CLIN edits/additions, repeated office ownership, part funding, both lanes, every incremental award, no-CLIN service fallback and unlisted offices (U43). No grouping may omit an office just because it is absent from GROUPS. Preserve separate direct CLIN ownership, requirement home and office ask concepts.

## U19: the reopen header

Recommend current unsaved state as the primary label: "Unsaved changes in this browser" (or "Put-back work not yet saved" only while provenance supports it), with a separately labelled last saved-file timestamp. A historical `MS.ts` must never certify the restored present state. Base `saveStateShow` (25885 onward) bases its primary label on `DIRTY || sideUnsaved`; the ledger reports a reopen route whose durable base record is dirty while that predicate reads clean. This policy is about making the primary state reflect all applicable durable/current unsaved evidence, not deleting the old timestamp or changing the save protocol.

This header correction does not close the underlying U19 data-loss issue. Keep that fix and its retained-copy checks separate. An import hold, failed storage, or kept-aside work also cannot be presented as a current safe-save certification. The label must settle clean only after applicable bytes are actually saved.

## U28: font/environment validation

Recommend remove or bypass the container's forced Segoe UI-to-Inter alias for a separately pinned, documented validation environment, with the checker unchanged; preserve the substituted-font failure as a real result in the matrix. Do not call this a passing result until the bounded run completes. The reported mapping and 14.6% width are not independently measured by this memo.

Do not promise that disabling an alias reproduces every user's browser: a Linux fallback may still differ from genuine Segoe UI on Windows, and users may have other fonts/OS/browser versions. Record fontconfig/config identity, actual effective fonts, browser build, viewport/zoom and screenshots. A same-code, same-browser A/B plus a representative supported browser check is the evidential route to a container diagnosis. The options are (1) default environment retained with failure openly blocked, (2) documented representative environment while preserving both results, or (3) robust product layout accommodating both renderings. Never skip widths, suppress the money-visibility assertion or mark a failed original environment as passed. Changing test environment is not a product money/data change.

## U32/U33: immutable locked registries

Recommend the current refusal policy for handed-over partial files and preservation of the person's full-board original, with truthful diagnostics and safe once-per-key export grouping; no in-place edits to a locked cycle. Refusal preserves the destination's existing state. Full-board preservation must not silently repair, discard entries or claim an ambiguous registry is ordinary/clean. All export routes remain responsible for USAF $900 / ANG $200 exactly.

If a correction route is wanted, prefer an explicit NEW amended cycle/copy, keeping the original byte-for-byte, with old/new identity, reason, author/time and links visible on screen and exports. Record whether only labels are corrected or whether assignments/grouping changes too, because latter changes record meaning even if grand totals balance. It costs new provenance/version UI, serialization/backward-compatibility rules, tests and review; the old lock remains the old artifact, and the amendment is not the same immutable view. Silent in-place correction weakens the lock and makes old exports unreconstructible; unlock/relock has that same issue unless an immutable original is retained.

For this release, recommend defer amendment workflow unless users cannot recover from refusal using a corrected source or a separately named new cycle. This is a Brad policy decision; no code proposed in C2. B2 decides whether this particular snapshot actually meets its claimed refusal, money and wording contract.
