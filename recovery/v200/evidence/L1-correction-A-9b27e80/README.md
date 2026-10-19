# Layer 1: Correction A, fresh evidence (11 Oct 2026)

This is a reimplementation of the lost commit `4073d3e`, committed as **`9b27e8006ddf336b9ebefde54c9c3c4154e52370`**.
Every result below was run fresh in this session after the environment reset. None of it is reused from the lost work.

## Environment

- Node v22.22.0, jsdom 27.4.0, playwright-core 1.63.0.
  - These are the versions recorded before the reset.
  - They were installed with `npm install --no-save --no-package-lock`, so `package.json` is unchanged.
- Runner: `bin/run.sh`.
  - Each command runs in its own process group (`setsid`) under `timeout 600`, with its PID recorded.
  - The log header and footer give the command, start and end in UTC and ET, the exit code and the duration.
- Mutants were made with `bin/mkmut.py` on disposable copies outside the repository.
  - It reads one entry's `find` / `repl` from `mutate.mjs` **as text**; `mutate.mjs` is never imported or executed.
  - It writes the mutant only when the `find` text matches the board exactly once.

## Blobs

| File | Before (`309b16d` = product of `1c94537`) | After (`9b27e80`) |
|---|---|---|
| prioritization-board-grid.html | 42e81118… | 42e81118… (unchanged) |
| audit-hostile.mjs | d0b20c75… | d8cbc873… |
| audit-inject.mjs | eb9b6137… | 8ab05a68… |
| boot.mjs | 9c4f49ad… | 9c4f49ad… |
| mutate.mjs | 5fc81bf7… | 5fc81bf7… |

The full hashes are in `blobs-before.txt` and `blobs-after.txt`.

## Results

| Run | Board | Exit | Duration | Outcome |
|---|---|---|---|---|
| before-hostile | as at 1c94537 | 1 | 72.8 s | 1 failing check. The v1.88 "genuine" check wanted toString etc. to pass, and the board says "it carries a field named “isPrototypeOf” …". This reproduces the #12 correction. |
| before-inject | as at 1c94537 | 0 | 23.2 s | passes |
| before-inject + `v200-id-builtin-open` | mutant | 0 | 23.0 s | **not caught by audit-inject** |
| before-inject + `v200-spmt-pmo-open` | mutant | 0 | 23.1 s | **not caught by audit-inject** |
| after-hostile | 9b27e80 | 0 | 95.6 s | ALL CHECKS PASSED |
| after-inject | 9b27e80 | 0 | 33.5 s | ALL CHECKS PASSED |
| after-inject + `v200-id-builtin-open` | mutant | 1 | 32.9 s | caught: 1 failure, the new K1 assertion "a requirement id valueOf in a plan's priority order is refused as an id" |
| after-inject + `v200-spmt-pmo-open` | mutant | 1 | 33.6 s | caught: 1 failure, the new K1 assertion "a submittal from an office whose name carries markup is refused as a name" |
| after-hostile + `v200-keybad-three` | mutant | 1 | 95.7 s | caught: 4 failures, the reversed check for each of toString, valueOf, hasOwnProperty and isPrototypeOf |
| after-hostile + HA1 (hand mutant) | mutant | 1 | 95.4 s | caught: 1 failure, the lookalike control ("Constructor" refused) |

Notes on these results:
- **Applicability:** each mutation's target matched exactly once (the `*.json` files). Applicability is recorded
  separately from the catch.
- **HA1:** a hand mutant, not a catalog entry. It makes the door also refuse keys that only look like built-in names.
  It shows that the lookalike control is sensitive.
- **Concurrency:** the "after" runs were six in parallel on four CPUs, which is why audit-hostile took longer there.

## The other eight suites (fresh, `suites-at-764d288/`)

These ran at `764d288`. That commit only adds recovery notes on top of `9b27e80`: `git diff 9b27e80 764d288` is empty for
the board, `tools/` and `package.json`, and the blob list is in `blobs-764d288.txt`. They ran in two capped lanes:
`audit-import` alone, and the other seven one after another.

| Suite | Exit | Duration | Verdict |
|---|---|---|---|
| audit-import | 0 | 534.4 s | ALL CHECKS PASSED (**89% of the 600 s cap**) |
| audit-board | 0 | 158.8 s | ALL CHECKS PASSED |
| audit-recon | 0 | 53.6 s | ALL CHECKS PASSED |
| audit-other | 0 | 33.9 s | ALL CHECKS PASSED |
| audit (Excel) | 0 | 8.7 s | ALL CHECKS PASSED |
| boot-same | 0 | 11.7 s | identical either way |
| audit-ppt | 0 | 3.9 s | ALL CHECKS PASSED |
| legacy-fsrc | 0 | 2.8 s | every legacy Force setting computes exactly as before |

All ten jsdom suites have now passed fresh at the layer-1 tree: these eight, and `audit-hostile` and `audit-inject`
above.

## Not run at this SHA (pending)

- `verify:grid` and the standards check. The board is unchanged from `1c94537`, but every earlier result at that blob
  was lost, so none is reused.
- Presweep and full gate: paused (Brad).
