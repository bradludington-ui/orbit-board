## Exact diffs of everything I copied and changed, or built

`probes/rowmenu-probe-r2.mjs` against the builder's `p2/fix1/probes/rowmenu-probe.mjs`:

```
1c1
< // rowmenu-probe.mjs (resumed builder, scratch): where a row's ⋯ menu lands with the RECORD panel docked, on the final board
---
> // rowmenu-probe-r2.mjs (the verifier's copy of the builder's probe; only its three import paths changed: two to the verifier's dd15956 copy, and playwright-core by its full path, since a bare name does not resolve from this folder): where a row's ⋯ menu lands with the RECORD panel docked, on the final board
5,7c5,7
< import { chromium } from 'playwright-core';
< import { CHROME } from '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/p2/fix1/grid/copy-8783a2d/tools/chrome.mjs';
< import { buildPopulated } from '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/p2/fix1/grid/copy-8783a2d/tools/ia-fixture.mjs';
---
> import { chromium } from '/home/user/orbit-ui/node_modules/playwright-core/index.mjs';
> import { CHROME } from '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/verify-S1-S5/r2/copies/dd15956/tools/chrome.mjs';
> import { buildPopulated } from '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/verify-S1-S5/r2/copies/dd15956/tools/ia-fixture.mjs';
```

Each mutant board against `boards/final.html` (`diff`; one inserted or replaced line each):

```
== vR-dock-focus-lost (4a8ccdb6)
31427c31427
<     if(to) dlgFocus(to);
---
>     if(to && !document.documentElement.classList.contains('ui-dock')) dlgFocus(to);
== vR-dock-menu-cut (8f1ae465)
1388a1389
> html.ui-dock .menu .mdd{max-height:90px!important;overflow:hidden!important}
== vR-dock-narrowed-1600 (a53cabed)
1388a1389
> @media (max-width:1600px){html.ui-on.ui-dock .gridsplit{grid-template-columns:minmax(0,1fr)} html.ui-on.ui-dock .inspector{position:fixed;top:0;right:0;bottom:0;left:auto;width:min(460px,92vw);max-height:none;height:100%;z-index:60;transform:translateX(102%)}}
== vR-docked-rowmenu-clipped-narrow (5af3dc54)
1388a1389
> @media (min-width:1401px) and (max-width:1535px){html.ui-on.ui-dock #list .rowmenu.open > .mdd{clip-path:inset(0 0 50% 0)}}
== vR-room-no-dock (0c00eda9)
31911c31911
<   const dockW=(UI2.dock && w>1400 && uiMode!=='brief')? Math.min(600, Math.max(420, w*0.30))+10 : 0;
---
>   const dockW=0;
== vR-save-right-covered (a79c6c4d)
1388a1389
> #helpBtn{margin-left:-16px!important;position:relative;z-index:3}
== vS2b-created-only (372efd61)
32271c32271
<       if(!e.p.length || k==='removed') return null;
---
>       if((!e.p.length && e.a==null) || k==='removed') return null;
== vS2b-removed-len1 (e7f99752)
32271c32271
<       if(!e.p.length || k==='removed') return null;
---
>       if(!e.p.length || (k==='removed' && e.p.length===1)) return null;
== vS2b-removed-same-id (fa5b7d8f)
32271c32271
<       if(!e.p.length || k==='removed') return null;
---
>       if(!e.p.length || (k==='removed' && String(e.b)===String(id))) return null;
== fx-dock-ignored (d3039ebd, the builder's)
31885c31885
<   try{ UI2.dock = localStorage.getItem('prio27uiDock')==='1'; }catch(e){}
---
>   try{ UI2.dock = false; }catch(e){}
== fx-docked-note-cut (ea594a39, the builder's)
1454a1455
> html.ui-on.ui-dock #inspector .insp-split .drew{max-width:30px;overflow:hidden;white-space:nowrap}
== fx-docked-rowmenu-clipped (fc03a112, the builder's)
1454a1455
> html.ui-on.ui-dock #list .rowmenu.open > .mdd{clip-path:inset(0 0 50% 0)}
== fx-docked-rows-wide (12c13f25, the builder's)
1454a1455
> @media (min-width:1401px){html.ui-on.ui-dock #list .row{min-width:1200px}}
== fx-hdr-under-sidebar-60 (e3f26a85, the builder's)
1454a1455
> html.ui-on .hdr{margin-left:-60px}
== fx-docked-rowmenu-shift (afc07fa3, the builder's)
1454a1455
> html.ui-on.ui-dock #list .menu.open > .mdd{transform:translateX(420px)}
== fx-docked-rowmenu-offscreen (d1be0519, the builder's)
1454a1455
> html.ui-on.ui-dock #list .rowmenu.open > .mdd{transform:translateX(100vw)}
```

The 37 `v200-ui3-*` boards are each entry's own find → repl, applied once by `mkmut.py` (its record per board in `mut/<id>.json`).

My scripts and probes (blobs, `git hash-object`):

| File | Blob | What it does |
|---|---|---|
| `bin/run.sh` | 49b1672e | the lock wait (20 s polls, up to 30 min, then SKIPPED), `setsid -w timeout -k 10 <cap>`, the PIDs and their command lines (and the command as given) into `pids.txt`, start and end ET, exit and wall seconds into the log and `runs.txt` |
| `bin/audit-ui-vcount.mjs` | 5bd000fe | `audit-ui.mjs` at `dd15956` with a check counter (diff above) |
| `bin/buildmut.sh` | 1166c75f | the 37 `v200-ui3-*` boards, as text, by `mkmut.py` |
| `bin/mutlane.sh`, `bin/mutlane2.sh` | 8b22902f, 67c8a32b | the counted audit-ui on each board, one after another (`2`: after the restart, labels `@resume`) |
| `bin/laneG.sh` | 0dd89e8d | every verify:grid tool on its own, the chain first |
| `bin/laneJ.sh` | 4c9ec53f | the jsdom suites and `check` |
| `bin/laneP.sh` | 18aabb39 | the four preservation probes |
| `bin/myjs.sh` | a802b7b4 | my S2 mutants after the jsdom lane |
| `bin/brlane.sh`, `bin/brall.sh` | f84d95b1, ada64fd6 | the browser mutants (first attempt) |
| `bin/brlane2.sh`, `bin/br3.sh`, `bin/br4.sh` | 54c8fa61, 22ab4a0d, 4e2fd2e4 | the browser mutants and probes after the restart |
| `bin/mymut2.py`, `bin/mymut3.py` | 31c38af8, 9b47cb71 | my mutants, as text, each find matching exactly once or nothing written |
| `bin/tables.py` | 9b9ffb66 | the two tables at the end of this file, from `runs.txt` and `pids.txt` (text only) |
| `probes/rv-smoke-r2.mjs`, `rv2-probe-r2.mjs`, `rv2-m1-r2.mjs`, `openwrites-r2.mjs` | d7febecd, 4cb9d850, f76ee6ac, 4778f4bf | the chunk 1 and chunk 2 reviewers' preservation probes, with only the board path (`boards/final.html`) and `boot.mjs` (my `dd15956` copy's) changed |
| `probes/dockclick.mjs`, `dockreload.mjs`, `dockreload2.mjs` | 2159ef1b, c64fb442, 791bf38f | the docked setting by View's click against the tools' pre-set key; the reload and every write of the key |
| `probes/rowmenu-probe-r2.mjs` | bc452475 | the builder's probe (diff above) |
