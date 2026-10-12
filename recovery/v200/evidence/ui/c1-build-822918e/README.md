# UI-C1: the chunk 1 handler arguments go through jsa(). Build record

Brad, 12 Oct 2026, 7:12 AM ET: *"Approve UI-C1 as a separate commit: route the ten affected handler arguments through the existing jsa() helper. Preserve their behavior and leave the checker unchanged. Record before-fail/after-pass evidence, exercise the affected controls, and independently review the exact committed diff."*
Acceptance clarified by Brad (12 Oct, 7:1x AM ET, via the coordinator): the saved payload must be byte-identical, the program part of the saved file must differ only by the approved handler changes, every differing stamp must be listed, and the saved file must be reopened and its controls exercised.

| | |
|---|---|
| worktree / branch | `scratchpad/ui-c1-wt`, local branch `claude/v200-ui-c1`, **not pushed** |
| before | `c41a7c2`, board blob `ba8d020431afc0ead32cc6ee6fa66d6b301ce583` |
| **the commit** | **`822918ec4a2113f534fab3ac9dc78c9ae64c8979`** (one commit, parent c41a7c2), board blob **`21b2b9dd6823fc5f8ce6fd392c945f9d55cbfc26`** |
| base (for rv-smoke) | `4a6f7c7`, board blob `4d273c0680132caafc4cbc8ca09c1533735c86de` |
| tools/check.mjs | blob `b8e0ee7a82d87b9945f212b0e5eaab91188abe49` at c41a7c2 and at 822918e (`git diff c41a7c2 822918e -- tools` is empty) |
| files changed | `prioritization-board-grid.html` only, 5 lines (+5 bytes: 3,827,439 → 3,827,444) |

**Verdict.** `npm run check` failed at c41a7c2 (exit 1, "10 value(s) reach inline handler code without jsa()") and passes at 822918e (exit 0, "all checks passed"). Each of the five handler texts makes the same call with the same argument values and types, in the actual program in Chromium on the board and on its reopened saved file: same DOM, same state, same storage writes, same file chooser, no page errors, at c41a7c2 and at 822918e. The saved payload is byte-identical. The saved files differ only in the five changed program lines. boot-same, audit-ui, audit-other, audit and audit-recon all pass at 822918e (BOARD unset). rv-smoke (adapted) passes.

## What the ten are

The checker counts each hand-quoted argument twice: once for the value written straight after the opening `\'` and once for the value written straight before the closing `\'`. So the **ten hits are five handler arguments**. The checker prints only the first 8 hits. `rule-list.mjs` copies its four patterns verbatim (read only, not imported) and lists all ten (`logs/rule-list-before.log`):

```
hits: 10
 32097  after-open    uiColSet(\''+c[0]+'\', !this.checked)            Columns menu (chunk 1)
 32114  after-open    uiSetDensity(\''+d[0]+'\')                         Density menu
 32154  after-open    document.getElementById(\''+id+'\').click()        flyout file items
 32155  after-open    uiMenuSoon(\''+m+'\')                              flyout menu items
 32249  after-open    uiDTab(\''+t[0]+'\')                               RECORD panel tabs
 32097..32249  before-close  (the same five, closing quote)
```
At base 4a6f7c7: `hits: 0` (`logs/rule-list-base.log`). At 822918e: `hits: 0` (`logs/rule-list-after-wip.log`, the same bytes as the commit).

The values are the program's own constants. Columns: `pmo, band, cum, lane` (UI_COLS). Density: `comfortable, compact`. Flyout: `srcFile` (file item) and `reports, data` (menu items). Tabs: `overview, funding, history`.

## The exact committed diff (`git show 822918e`, also in `commit-822918e.diff`)

```diff
commit 822918ec4a2113f534fab3ac9dc78c9ae64c8979
Author: Claude <noreply@anthropic.com>
Date:   Mon Oct 12 11:24:45 2026 +0000

    v2.00 UI-C1: the five chunk 1 handler arguments go through jsa(), so npm run check passes again
    
    npm run check has failed since UI chunk 1 with "10 value(s) reach inline handler code without
    jsa()": five handler arguments in chunk 1's UI code were written between hand-made \' quotes,
    and the checker counts each twice (after the opening quote, before the closing one). Each now
    goes through the existing jsa() helper, the way the base board's own handlers do:
    
    - the Columns menu:       onchange="uiColSet('+jsa(c[0])+', !this.checked)"
    - the Density menu:       onclick="uiPopsClose();uiSetDensity('+jsa(d[0])+')"
    - the sidebar flyout:     document.getElementById('+jsa(id)+').click()  and  uiMenuSoon('+jsa(m)+')
    - the RECORD panel tabs:  onclick="uiDTab('+jsa(t[0])+')"
    
    The values are the program's own constants; each handler makes the same call with the same
    argument as before (the attribute now reads uiColSet("pmo", ...) where it read uiColSet('pmo', ...)).
    tools/check.mjs and every test tool are unchanged. Nothing else in the board changes.
    
    Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
    Claude-Session: https://claude.ai/code/session_01MqCBDiYHPZfnyapxhXKxBm

diff --git a/prioritization-board-grid.html b/prioritization-board-grid.html
index ba8d020..21b2b9d 100644
--- a/prioritization-board-grid.html
+++ b/prioritization-board-grid.html
@@ -32094,7 +32094,7 @@ function uiPopFill(id){
     const cs=UI_COLS.filter(function(c){ return map[c[0]]!==undefined; });
     p.innerHTML='<div class="uiFh">Columns</div>'
       + cs.map(function(c){ return '<label><input type="checkbox" '+(UI2.cols[c[0]]? '' : 'checked')
-        +' onchange="uiColSet(\''+c[0]+'\', !this.checked)"> '+c[1]+'</label>'; }).join('')
+        +' onchange="uiColSet('+jsa(c[0])+', !this.checked)"> '+c[1]+'</label>'; }).join('')
       + '<div class="note">#, Requirement, the money, ★ and ⋯ always show. Applies where the row has room for every column. '
       + 'Kept in this browser; the board file does not change.</div>';
   } else if(id==='uiCycPop'){
@@ -32111,7 +32111,7 @@ function uiPopFill(id){
   } else {
     p.innerHTML='<div class="uiFh">Density</div>'
       + [['comfortable','Comfortable'],['compact','Compact']].map(function(d){
-          return '<button type="button" class="o" aria-pressed="'+(uiDensity===d[0]?'true':'false')+'" onclick="uiPopsClose();uiSetDensity(\''+d[0]+'\')">'+d[1]+'</button>'; }).join('')
+          return '<button type="button" class="o" aria-pressed="'+(uiDensity===d[0]?'true':'false')+'" onclick="uiPopsClose();uiSetDensity('+jsa(d[0])+')">'+d[1]+'</button>'; }).join('')
       + (uiMode==='brief'? '<div class="note">Brief always reads at the presentation size.</div>' : '')
       + '<div class="uiFh" style="margin-top:6px">Record panel</div>'
       + [[false,'Slides over the table (default)'],[true,'Docked beside the table']].map(function(d){
@@ -32151,8 +32151,8 @@ function uiGo(k, btn){
 function uiFlyItems(k){
   const has=function(fn){ return typeof window[fn]==='function'; };
   const it=function(lbl, sub, fn){ return has(fn)? '<button type="button" onclick="uiFlyClose();mRun('+fn+')">'+lbl+(sub? '<small>'+sub+'</small>' : '')+'</button>' : ''; };
-  const file=function(lbl, sub, id){ return '<button type="button" onclick="uiFlyClose();mRun(function(){ document.getElementById(\''+id+'\').click(); })">'+lbl+'<small>'+sub+'</small></button>'; };
-  const menu=function(lbl, sub, m){ return '<button type="button" onclick="uiFlyClose();uiMenuSoon(\''+m+'\')">'+lbl+'<small>'+sub+'</small></button>'; };
+  const file=function(lbl, sub, id){ return '<button type="button" onclick="uiFlyClose();mRun(function(){ document.getElementById('+jsa(id)+').click(); })">'+lbl+'<small>'+sub+'</small></button>'; };
+  const menu=function(lbl, sub, m){ return '<button type="button" onclick="uiFlyClose();uiMenuSoon('+jsa(m)+')">'+lbl+'<small>'+sub+'</small></button>'; };
   const sep='<div class="uiFsep"></div>';
   if(k==='fydp') return '<div class="uiFh">FYDP</div>'
     + it('📊 Five-year spend plan…', 'by requirement · PMO · service — a locked cycle or the working plan', 'toggleFydp')
@@ -32246,7 +32246,7 @@ function uiDrawerTabs(){
   const bd=ins.querySelector('.insp-bd'); if(!bd || bd.querySelector('.uiDTabs')) return;
   const strip=document.createElement('div'); strip.className='uiDTabs'; strip.setAttribute('role','group'); strip.setAttribute('aria-label','Record sections');
   strip.innerHTML=[['overview','Overview'],['funding','Funding'],['history','History']].map(function(t){
-    return '<button type="button" data-k="'+t[0]+'" aria-pressed="'+(UI_DTAB===t[0]? 'true' : 'false')+'" onclick="uiDTab(\''+t[0]+'\')">'+t[1]+'</button>'; }).join('');
+    return '<button type="button" data-k="'+t[0]+'" aria-pressed="'+(UI_DTAB===t[0]? 'true' : 'false')+'" onclick="uiDTab('+jsa(t[0])+')">'+t[1]+'</button>'; }).join('');
   const meta=bd.querySelector('.insp-meta');
   if(meta && meta.parentNode===bd) bd.insertBefore(strip, meta.nextSibling); else bd.insertBefore(strip, bd.firstChild);
   const id=(typeof curRow!=='undefined' && curRow)? String(curRow) : '';
```

Each site now uses the base board's own pattern, `f('+jsa(x)+')`, as in `onclick="ndOpenRow('+jsa(g.id)+')"` (line 3234). `jsa(v)` = `esc(JSON.stringify(String(v)))` (line 28990). The attribute text changes from `uiColSet('pmo', …)` to `uiColSet(&quot;pmo&quot;, …)` in the markup string, and the browser holds `uiColSet("pmo", …)`. The `data-k="'+t[0]+'"` on the tab line is an attribute, not handler code, so the rule does not cover it. It is unchanged.

## Check before and after (`tools/check.mjs` unchanged)

At c41a7c2 (`logs/check-before-c41a7c2.log`, exit 1, 25 ok lines):
```
handler values
  FAIL  10 value(s) reach inline handler code without jsa(): line 32097 (a value written straight after a quote the handler opened); line 32114 (a value written straight after a quote the handler opened); line 32154 (a value written straight after a quote the handler opened); line 32155 (a value written straight after a quote the handler opened); line 32249 (a value written straight after a quote the handler opened); line 32097 (a value written straight before a quote the handler closes); line 32114 (a value written straight before a quote the handler closes); line 32154 (a value written straight before a quote the handler closes)

1 check(s) failed
```
At 822918e (`logs/check-after-822918e.log`, exit 0, 26 ok lines, worktree clean, HEAD board = worktree board = 21b2b9dd):
```
handler values
  ok    every value written into an inline handler goes through jsa()

all checks passed
```
All the other checks pass at both commits, including `pubState is null` and `APPNS is empty`, so the board is still the empty template.

## Controls exercised in the actual program (Chromium)

`ex.mjs` uses playwright-core 1.63.0 from the worktree's node_modules and `executablePath /opt/pw-browsers/chromium` (chromium-1194). Nothing was installed. Every context is fresh (empty storage), with viewport 1600×1000 and the clock fixed at 1790000000000 (`context.clock.setFixedTime`, the clock rv-smoke uses). Before the page's own script runs, an init script wraps `Storage.prototype.setItem/removeItem/clear` and `HTMLInputElement.prototype.click` and records each call with the phase it happened in. Page errors, console errors and warnings, dialogs and file choosers are recorded as well.

* **A**: the board file is opened and its opening is recorded. The rv-smoke synthetic seed (14 requirements, `seed()` from tools/export-audit/boot.mjs) goes into memory only. Then come the **person's clicks** with `page.click` and the keyboard. Columns: open the menu, untick each of the 4 boxes, then tick each again. Density: open, Compact, open, Comfortable. Sidebar FYDP flyout: "Reports & exports ▾" (`uiMenuSoon`), then Esc. Execution flyout: "Data ▾" (`uiMenuSoon`), then Esc. Execution flyout: "📥 Import CCaR QPE…" (`getElementById('srcFile').click()`). Then a click on row S03, which opens the RECORD panel, and its tabs Funding, History, Overview. Last, a census reads every handler the five sites render, in all five modes.
* **S**: the board, the same seed, then the board's own **⬇ Save a copy** (`publishState()`). The downloaded bytes are kept.
* **R**: that saved file is **reopened** from one fixed path (`reopen/FY27 Consolidated Prioritization Board.html`, the board's own suggested name, the same path for every run). It has no seed: its 14 rows come from the file. The same clicks and the same census follow.

After every step `ex.mjs` records the clicked control's handler attribute as the browser holds it, a state snapshot, the storage writes and input clicks of that step, and the **whole DOM**. In the DOM copy the script text is emptied and on* values are blanked (`dom-*.html`), and every on* attribute in document order is kept separately (`handlers-*.json`). `cmp.mjs` requires all of these to be identical, except on* values at the five sites. Each differing on* value has to differ from its counterpart by the quote character only. It is then **evaluated**: the handler's own text runs with stubs that record each call and its argument types and values, with `this.checked` both true and false. The calls must be identical.

Runs: `before` and `before-repeat` on the worktree at c41a7c2 (identical, which shows the harness is deterministic). `after` on the worktree at 822918e. `before2` and `after2` on the two blobs copied to one scratch path, with the census fix that reads the tabs before any mode change. Both pairs pass with `fails: []`, and the saved files are identical across paths. The table is from `out/cmp-before2-vs-after2.json`. `out/cmp-before-vs-after.json` matches it (its census did not read the tabs; they were still clicked and compared in every snapshot).


**Context A** (the board file, seeded in memory): every row identical at c41a7c2 and 822918e (state, whole DOM with on* values blanked, storage writes, input clicks, errors)

| step (the person's click) | handler at c41a7c2 | handler at 822918e | the call both make (evaluated) | state after the click | storage writes | input.click / chooser | same? |
|---|---|---|---|---|---|---|---|
| cols:open |  |  |  | boxes PMO ✓, Decision band ✓, Cumulative ✓, Lane ✓; --rowcols (none) | — | — | yes |
| cols:hide:PMO | `uiColSet('pmo', !this.checked)` | `uiColSet("pmo", !this.checked)` | `uiColSet("pmo", true)` | boxes PMO ✗, Decision band ✓, Cumulative ✓, Lane ✓; --rowcols `58px minmax(180px,1fr) 164px 104px 100px 112px 26px 26px` | `set prio27uiCols={"pmo":true}` | — | yes |
| cols:hide:Decision band | `uiColSet('band', !this.checked)` | `uiColSet("band", !this.checked)` | `uiColSet("band", true)` | boxes PMO ✗, Decision band ✗, Cumulative ✓, Lane ✓; --rowcols `58px minmax(180px,1fr) 104px 100px 112px 26px 26px` | `set prio27uiCols={"pmo":true,"band":true}` | — | yes |
| cols:hide:Cumulative | `uiColSet('cum', !this.checked)` | `uiColSet("cum", !this.checked)` | `uiColSet("cum", true)` | boxes PMO ✗, Decision band ✗, Cumulative ✗, Lane ✓; --rowcols `58px minmax(180px,1fr) 104px 112px 26px 26px` | `set prio27uiCols={"pmo":true,"band":true,"cum":true}` | — | yes |
| cols:hide:Lane | `uiColSet('lane', !this.checked)` | `uiColSet("lane", !this.checked)` | `uiColSet("lane", true)` | boxes PMO ✗, Decision band ✗, Cumulative ✗, Lane ✗; --rowcols `58px minmax(180px,1fr) 104px 26px 26px` | `set prio27uiCols={"pmo":true,"band":true,"cum":true,"lane":true}` | — | yes |
| cols:show:PMO | `uiColSet('pmo', !this.checked)` | `uiColSet("pmo", !this.checked)` | `uiColSet("pmo", false)` | boxes PMO ✓, Decision band ✗, Cumulative ✗, Lane ✗; --rowcols `58px 50px minmax(180px,1fr) 104px 26px 26px` | `set prio27uiCols={"band":true,"cum":true,"lane":true}` | — | yes |
| cols:show:Decision band | `uiColSet('band', !this.checked)` | `uiColSet("band", !this.checked)` | `uiColSet("band", false)` | boxes PMO ✓, Decision band ✓, Cumulative ✗, Lane ✗; --rowcols `58px 50px minmax(180px,1fr) 164px 104px 26px 26px` | `set prio27uiCols={"cum":true,"lane":true}` | — | yes |
| cols:show:Cumulative | `uiColSet('cum', !this.checked)` | `uiColSet("cum", !this.checked)` | `uiColSet("cum", false)` | boxes PMO ✓, Decision band ✓, Cumulative ✓, Lane ✗; --rowcols `58px 50px minmax(180px,1fr) 164px 104px 100px 26px 26px` | `set prio27uiCols={"lane":true}` | — | yes |
| cols:show:Lane | `uiColSet('lane', !this.checked)` | `uiColSet("lane", !this.checked)` | `uiColSet("lane", false)` | boxes PMO ✓, Decision band ✓, Cumulative ✓, Lane ✓; --rowcols (none) | `set prio27uiCols={}` | — | yes |
| dens:open:compact |  |  |  | uiDensity comfortable; pops open [uiDensPop] | — | — | yes |
| dens:compact | `uiPopsClose();uiSetDensity('compact')` | `uiPopsClose();uiSetDensity("compact")` | `uiPopsClose(); uiSetDensity("compact")` | uiDensity compact; pops open [] | `set spmtDensity=compact` | — | yes |
| dens:open:comfortable |  |  |  | uiDensity compact; pops open [uiDensPop] | — | — | yes |
| dens:comfortable | `uiPopsClose();uiSetDensity('comfortable')` | `uiPopsClose();uiSetDensity("comfortable")` | `uiPopsClose(); uiSetDensity("comfortable")` | uiDensity comfortable; pops open [] | `set spmtDensity=comfortable` | — | yes |
| fly:open:fydp:fly:menu:reports |  |  |  | openMenu null; flyout open | — | — | yes |
| fly:menu:reports | `uiFlyClose();uiMenuSoon('reports')` | `uiFlyClose();uiMenuSoon("reports")` | `uiFlyClose(); uiMenuSoon("reports")` | openMenu reports; flyout closed | — | — | yes |
| esc:after-reports |  |  |  | openMenu null; flyout closed | — | — | yes |
| fly:open:exec:fly:menu:data |  |  |  | openMenu null; flyout open | — | — | yes |
| fly:menu:data | `uiFlyClose();uiMenuSoon('data')` | `uiFlyClose();uiMenuSoon("data")` | `uiFlyClose(); uiMenuSoon("data")` | openMenu data; flyout closed | — | — | yes |
| esc:after-data |  |  |  | openMenu null; flyout closed | — | — | yes |
| fly:open:exec:fly:file:srcFile |  |  |  | openMenu null; flyout open | — | — | yes |
| fly:file:srcFile | `uiFlyClose();mRun(function(){ document.getElementById('srcFile').click(); })` | `uiFlyClose();mRun(function(){ document.getElementById("srcFile").click(); })` | `uiFlyClose(); mRun(function); document.getElementById("srcFile"); .click() on that element` | openMenu null; flyout closed | — | click #srcFile, chooser on #srcFile | yes |
| row:pick |  |  |  | curRow S03, UI_DTAB overview; tabs overview=true,funding=false,history=false; scrolled none | — | — | yes |
| dtab:funding | `uiDTab('funding')` | `uiDTab("funding")` | `uiDTab("funding")` | curRow S03, UI_DTAB funding; tabs overview=false,funding=true,history=false; scrolled none | — | — | yes |
| dtab:history | `uiDTab('history')` | `uiDTab("history")` | `uiDTab("history")` | curRow S03, UI_DTAB history; tabs overview=false,funding=false,history=true; scrolled none | — | — | yes |
| dtab:overview | `uiDTab('overview')` | `uiDTab("overview")` | `uiDTab("overview")` | curRow S03, UI_DTAB overview; tabs overview=true,funding=false,history=false; scrolled none | — | — | yes |

Opening writes (both): `remove prio27bands_om`, `set prio27destdb`; page/console errors at c41a7c2: 0, at 822918e: 0; dialogs: 0; on* attribute values that differ across all 26 whole-document snapshots: 228, all of these shapes: `uiColSet('…', !this.checked)`, `uiDTab('…')`, `uiPopsClose();uiSetDensity('…')`, `uiFlyClose();uiMenuSoon('…')`, `uiFlyClose();mRun(function(){ document.getElementById('…').click(); })`; census (handlers rendered at the five sites, every mode): cols:review 4, cols:rank 4, cols:fund 1, cols:compare 4, cols:brief 3, dens:review 2, dens:rank 2, dens:fund 2, dens:compare 2, dens:brief 2, fly:fydp 1, fly:exec 2, fly:hist 0, dtabs 3.

**Context R** (the saved file reopened): every row identical at c41a7c2 and 822918e (state, whole DOM with on* values blanked, storage writes, input clicks, errors)

| step (the person's click) | handler at c41a7c2 | handler at 822918e | the call both make (evaluated) | state after the click | storage writes | input.click / chooser | same? |
|---|---|---|---|---|---|---|---|
| cols:open |  |  |  | boxes PMO ✓, Decision band ✓, Cumulative ✓, Lane ✓; --rowcols (none) | — | — | yes |
| cols:hide:PMO | `uiColSet('pmo', !this.checked)` | `uiColSet("pmo", !this.checked)` | `uiColSet("pmo", true)` | boxes PMO ✗, Decision band ✓, Cumulative ✓, Lane ✓; --rowcols `58px minmax(180px,1fr) 164px 104px 100px 112px 26px 26px` | `set prio27uiCols={"pmo":true}` | — | yes |
| cols:hide:Decision band | `uiColSet('band', !this.checked)` | `uiColSet("band", !this.checked)` | `uiColSet("band", true)` | boxes PMO ✗, Decision band ✗, Cumulative ✓, Lane ✓; --rowcols `58px minmax(180px,1fr) 104px 100px 112px 26px 26px` | `set prio27uiCols={"pmo":true,"band":true}` | — | yes |
| cols:hide:Cumulative | `uiColSet('cum', !this.checked)` | `uiColSet("cum", !this.checked)` | `uiColSet("cum", true)` | boxes PMO ✗, Decision band ✗, Cumulative ✗, Lane ✓; --rowcols `58px minmax(180px,1fr) 104px 112px 26px 26px` | `set prio27uiCols={"pmo":true,"band":true,"cum":true}` | — | yes |
| cols:hide:Lane | `uiColSet('lane', !this.checked)` | `uiColSet("lane", !this.checked)` | `uiColSet("lane", true)` | boxes PMO ✗, Decision band ✗, Cumulative ✗, Lane ✗; --rowcols `58px minmax(180px,1fr) 104px 26px 26px` | `set prio27uiCols={"pmo":true,"band":true,"cum":true,"lane":true}` | — | yes |
| cols:show:PMO | `uiColSet('pmo', !this.checked)` | `uiColSet("pmo", !this.checked)` | `uiColSet("pmo", false)` | boxes PMO ✓, Decision band ✗, Cumulative ✗, Lane ✗; --rowcols `58px 50px minmax(180px,1fr) 104px 26px 26px` | `set prio27uiCols={"band":true,"cum":true,"lane":true}` | — | yes |
| cols:show:Decision band | `uiColSet('band', !this.checked)` | `uiColSet("band", !this.checked)` | `uiColSet("band", false)` | boxes PMO ✓, Decision band ✓, Cumulative ✗, Lane ✗; --rowcols `58px 50px minmax(180px,1fr) 164px 104px 26px 26px` | `set prio27uiCols={"cum":true,"lane":true}` | — | yes |
| cols:show:Cumulative | `uiColSet('cum', !this.checked)` | `uiColSet("cum", !this.checked)` | `uiColSet("cum", false)` | boxes PMO ✓, Decision band ✓, Cumulative ✓, Lane ✗; --rowcols `58px 50px minmax(180px,1fr) 164px 104px 100px 26px 26px` | `set prio27uiCols={"lane":true}` | — | yes |
| cols:show:Lane | `uiColSet('lane', !this.checked)` | `uiColSet("lane", !this.checked)` | `uiColSet("lane", false)` | boxes PMO ✓, Decision band ✓, Cumulative ✓, Lane ✓; --rowcols (none) | `set prio27uiCols={}` | — | yes |
| dens:open:compact |  |  |  | uiDensity comfortable; pops open [uiDensPop] | — | — | yes |
| dens:compact | `uiPopsClose();uiSetDensity('compact')` | `uiPopsClose();uiSetDensity("compact")` | `uiPopsClose(); uiSetDensity("compact")` | uiDensity compact; pops open [] | `set spmtDensity=compact` | — | yes |
| dens:open:comfortable |  |  |  | uiDensity compact; pops open [uiDensPop] | — | — | yes |
| dens:comfortable | `uiPopsClose();uiSetDensity('comfortable')` | `uiPopsClose();uiSetDensity("comfortable")` | `uiPopsClose(); uiSetDensity("comfortable")` | uiDensity comfortable; pops open [] | `set spmtDensity=comfortable` | — | yes |
| fly:open:fydp:fly:menu:reports |  |  |  | openMenu null; flyout open | — | — | yes |
| fly:menu:reports | `uiFlyClose();uiMenuSoon('reports')` | `uiFlyClose();uiMenuSoon("reports")` | `uiFlyClose(); uiMenuSoon("reports")` | openMenu reports; flyout closed | — | — | yes |
| esc:after-reports |  |  |  | openMenu null; flyout closed | — | — | yes |
| fly:open:exec:fly:menu:data |  |  |  | openMenu null; flyout open | — | — | yes |
| fly:menu:data | `uiFlyClose();uiMenuSoon('data')` | `uiFlyClose();uiMenuSoon("data")` | `uiFlyClose(); uiMenuSoon("data")` | openMenu data; flyout closed | — | — | yes |
| esc:after-data |  |  |  | openMenu null; flyout closed | — | — | yes |
| fly:open:exec:fly:file:srcFile |  |  |  | openMenu null; flyout open | — | — | yes |
| fly:file:srcFile | `uiFlyClose();mRun(function(){ document.getElementById('srcFile').click(); })` | `uiFlyClose();mRun(function(){ document.getElementById("srcFile").click(); })` | `uiFlyClose(); mRun(function); document.getElementById("srcFile"); .click() on that element` | openMenu null; flyout closed | — | click #srcFile, chooser on #srcFile | yes |
| row:pick |  |  |  | curRow S03, UI_DTAB overview; tabs overview=true,funding=false,history=false; scrolled none | — | — | yes |
| dtab:funding | `uiDTab('funding')` | `uiDTab("funding")` | `uiDTab("funding")` | curRow S03, UI_DTAB funding; tabs overview=false,funding=true,history=false; scrolled none | — | — | yes |
| dtab:history | `uiDTab('history')` | `uiDTab("history")` | `uiDTab("history")` | curRow S03, UI_DTAB history; tabs overview=false,funding=false,history=true; scrolled none | — | — | yes |
| dtab:overview | `uiDTab('overview')` | `uiDTab("overview")` | `uiDTab("overview")` | curRow S03, UI_DTAB overview; tabs overview=true,funding=false,history=false; scrolled none | — | — | yes |

Opening writes (both): `remove prio27bands_om`, `remove prio27bands_om`, `set prio27om.base`; page/console errors at c41a7c2: 0, at 822918e: 0; dialogs: 0; on* attribute values that differ across all 26 whole-document snapshots: 231, all of these shapes: `uiDTab('…')`, `uiColSet('…', !this.checked)`, `uiPopsClose();uiSetDensity('…')`, `uiFlyClose();uiMenuSoon('…')`, `uiFlyClose();mRun(function(){ document.getElementById('…').click(); })`; census (handlers rendered at the five sites, every mode): cols:review 4, cols:rank 4, cols:fund 1, cols:compare 4, cols:brief 3, dens:review 2, dens:rank 2, dens:fund 2, dens:compare 2, dens:brief 2, fly:fydp 1, fly:exec 2, fly:hist 0, dtabs 3.


Every row reads "yes" in both contexts. **Verdict: each affected control does exactly what it did before.** Opening writes are the same, with no `prio27ui*` key written at opening. `prio27ui*` is written only on the person's Columns clicks, with the same values. Density writes the same `spmtDensity`. The flyout opens the same menu (`openMenu`), and the file item clicks the same `#srcFile`, whose file chooser opens. The tabs press the same buttons. There are 0 page errors, 0 console errors, 0 dialogs and 0 harness errors at either commit. The census, the seed and the save phases write the same storage.

## The saved file, before (c41a7c2) and after (822918e), same seed and same clock

The saved file is the board's own **⬇ Save a copy** download (`publishState()` → `buildSavedHtml()` → `savedHtmlOf()`), made in Chromium context S. It is `out/before/saved.html` (3,836,566 bytes, sha256 `e66b5a24…2664`) and `out/after/saved.html` (3,836,571 bytes, sha256 `985834e9…be5c`). Both have the suggested name `FY27 Consolidated Prioritization Board.html` and 32,575 lines. Both are identical to their runs from the other path (`before2`, `after2`).

**1. The payload is byte-identical, and preferences behave the same.** I took the payload out two ways:
(a) As the board's writer puts it in: savedHtmlOf's own regex `/(<script type="application\/json" id="pubState">)[\s\S]*?(<\/script>)/`, group 2, applied to the downloaded bytes.
(b) As the board's reader takes it out: `document.getElementById('pubState').textContent` (line 2349: `PUB = JSON.parse(document.getElementById('pubState').textContent)`), read in Chromium from the reopened saved file (`out/*/pubstate-reader.txt`).
Before and after give **8,707 bytes, sha256 `408a4f57f12660a01d1e43766bbdb6b3150b7d7946c92949121b6a9dd64bf249`, both ways**. (a) equals (b) at each commit.
Preferences are the same. Context S, opening writes: `remove prio27bands_om`, `set prio27destdb`. Save writes: `set prio27om.base={"dirty":true}`, `set prio27om` (7,146 bytes, the same sha both). In contexts A and R, `prio27uiCols` is written only in the eight Columns steps, with identical values (table above), and `spmtDensity` only in the two Density steps. No `prio27ui*` key is written at opening of the board or of the saved file.

**2. The program part differs only by the approved handler changes.** `diff out/before/saved.html out/after/saved.html` (`out/saved-before-vs-after.diff`) gives exactly five changed lines and nothing else:

| saved-file line | source line | change |
|---|---|---|
| 32095 | 32097 | `uiColSet(\''+c[0]+'\', …)` → `uiColSet('+jsa(c[0])+', …)` |
| 32112 | 32114 | `uiSetDensity(\''+d[0]+'\')` → `uiSetDensity('+jsa(d[0])+')` |
| 32152 | 32154 | `getElementById(\''+id+'\')` → `getElementById('+jsa(id)+')` |
| 32153 | 32155 | `uiMenuSoon(\''+m+'\')` → `uiMenuSoon('+jsa(m)+')` |
| 32247 | 32249 | `uiDTab(\''+t[0]+'\')` → `uiDTab('+jsa(t[0])+')` |

`cmp.mjs` checks that each saved-file hunk is verbatim one of the five source changes (before line → after line). It also checks that with those five lines put back, the after file is **byte-identical** to the before file (`identicalWithChangesPutBack: true`). Together the five lines hold the ten checker hits. The saved file's lines are 2 lower than the source's because SRC0 is `'<!DOCTYPE html>\n' + outerHTML`.

**3. Timestamps and metadata.** None differ. The payload's stamps are the same at both commits, and all come from the fixed clock or are zero:
`appns.om.ts` 1790000000000; `appns.om.jrnl[0..5].t` 1790000000000 (by `unknown`); `appns.om.log[0].ts` 1790000000000 (by `unknown`); `appns.om.by` `unknown`; `destDb.ts`, `execDb.ts`, `aceDb.ts`, `rpDb.ts`, `cycDb.ts`, `cycDb.byAp.om.ts`, `budDb.ts` all 0. `writer` is absent: Save a copy claims no pen.
The program's version stamp `const BUILD='v2.00 (11 Oct 2026)'` is the same in both. Outside the five lines nothing differs (point 2), so no other stamp, fingerprint, the PowerPoint template line or the template fingerprint the checker verifies can differ. The download name is the same.
What does differ: the file **size** (+5 bytes, one per site: `\'`+`\'` (4 characters) becomes `jsa(`+`)` (5 characters)) and therefore the **whole-file sha256**. Both follow from the five lines.

**4. The saved file reopened.** Context R opens each commit's own saved file in Chromium and does the same clicks: Columns ×8, Density ×2, the flyout's uiMenuSoon ×2 and getElementById/srcFile, and the drawer tabs ×3. It has 14 rows from the file. Its opening writes are `remove prio27bands_om` ×2 and `set prio27om.base`, the same at both. DOM, state, storage writes, file chooser and errors (0) are identical at c41a7c2 and 822918e (the R table above). On every snapshot, the reopened file's on* values differ only at the five sites: 231 values in all, each evaluating to the same calls.

## The suites at 822918e (BOARD unset, cwd the worktree, 600 s caps)

| suite | result | exit | wall s |
|---|---|---|---|
| boot-same | "every page, source, save and error list is identical either way" | 0 | 10.0 |
| audit-ui | ALL CHECKS PASSED | 0 | 30.8 |
| audit-other | ALL CHECKS PASSED | 0 | 34.5 |
| audit | ALL CHECKS PASSED | 0 | 9.3 |
| audit-recon | ALL CHECKS PASSED | 0 | 51.5 |

audit-import.mjs and audit-board.mjs were not run, and neither was mutate.mjs (not imported, not executed).

## rv-smoke, adapted (`rv-smoke-c1.mjs`)

This is a copy of `uichunk1/rv-smoke.mjs`. The only changes are its paths: boot.mjs and jsdom from the worktree; BASE is `boards/base-4a6f7c7.html`, which `cmp` shows is identical to `uichunk1/rv-base.html`; NEW is argv[2] or the worktree's board. jsdom only, base 4a6f7c7 against the new board, the same seed and `Date.now = 1790000000000`.
* At 822918e: `fails: []`, exit 0. `savedPayloadSame: true` (the saved payload is byte-identical to base). Storage keys after opening are `["prio27destdb"]` for both, with no `prio27ui*` at opening. 0 errors at opening and after driving the UI. `src0SameApartFromStaticBlocks: true`, `savedUnchangedByUi: true`.
* At c41a7c2: the same, `fails: []`.

## Runs (Eastern time from the clock; every one `setsid -w timeout -k 10 <cap>` via `bin/run.sh`, lock checked first)

The `AUDIT_IMPORT_RUNNING` lock was never present (no `lockwaits.txt`).

| label | start (ET) | exit | wall s | log |
|---|---|---|---|---|
| check-before@c41a7c2 | 07:15:55 EDT | 1 | 3.2 | `logs/check-before-c41a7c2.log` |
| rule-list-before | 07:16:09 EDT | 0 | 0.3 | `logs/rule-list-before.log` |
| rule-list-base | 07:16:10 EDT | 0 | 0.3 | `logs/rule-list-base.log` |
| ex-before-try1 | 07:20:45 EDT | 0 | 41.6 | `logs/ex-before-try1.log` |
| ex-before@c41a7c2 | 07:22:43 EDT | 0 | 38.0 | `logs/ex-before.log` |
| ex-before-repeat@c41a7c2 | 07:23:21 EDT | 0 | 37.8 | `logs/ex-before-repeat.log` |
| cmp-before-vs-repeat | 07:23:59 EDT | 0 | 0.3 | `logs/cmp-before-vs-repeat.log` |
| check-pre-commit | 07:24:26 EDT | 0 | 3.7 | `logs/check-pre-commit.log` |
| rule-list-after-wip | 07:24:30 EDT | 0 | 0.3 | `logs/rule-list-after-wip.log` |
| check-after@822918e | 07:24:53 EDT | 0 | 3.1 | `logs/check-after-822918e.log` |
| ex-after@822918e | 07:24:57 EDT | 0 | 37.5 | `logs/ex-after.log` |
| cmp-before-vs-after | 07:25:34 EDT | 0 | 0.3 | `logs/cmp-before-vs-after.log` |
| ex-before2@c41a7c2-samepath | 07:26:07 EDT | 0 | 37.5 | `logs/ex-before2.log` |
| ex-after2@822918e-samepath | 07:26:44 EDT | 0 | 37.9 | `logs/ex-after2.log` |
| cmp-before2-vs-after2 | 07:27:22 EDT | 0 | 0.4 | `logs/cmp-before2-vs-after2.log` |
| *suites at 822918e board 21b2b9dd6823fc5f8ce6fd392c945f9d55cbfc26* | | | | |
| boot-same@822918e | 07:27:37 EDT | 0 | 10.0 | `logs/boot-same-822918e.log` |
| audit-ui@822918e | 07:27:47 EDT | 0 | 30.8 | `logs/audit-ui-822918e.log` |
| audit-other@822918e | 07:28:18 EDT | 0 | 34.5 | `logs/audit-other-822918e.log` |
| audit@822918e | 07:28:52 EDT | 0 | 9.3 | `logs/audit-822918e.log` |
| audit-recon@822918e | 07:29:02 EDT | 0 | 51.5 | `logs/audit-recon-822918e.log` |
| rv-smoke@822918e | 07:30:24 EDT | 0 | 12.1 | `logs/rv-smoke-822918e.log` |
| rv-smoke@c41a7c2 | 07:30:36 EDT | 0 | 11.6 | `logs/rv-smoke-c41a7c2.log` |
| table | 07:31:40 EDT | 0 | 0.4 | `logs/table.log` |
| table2 | 07:31:55 EDT | 0 | 0.3 | `logs/table2.log` |
| table3 | 07:32:09 EDT | 0 | 0.3 | `logs/table3.log` |

`ex-before-try1` was the harness's first run. It was superseded by `ex-before` once scroll positions were added to the snapshot. `table`, `table2` and `table3` only format the evidence table from the compare JSON. Total compute: about 7 min.

## PIDs (`pids.txt`: the timeout PID and its node child, with command lines; nothing was killed)

Runs shorter than 0.3 s (rule-list, cmp, table) had exited before `/proc/<pid>/cmdline` could be read. Their PID is recorded with an empty command, and the label names the command, which is also in each log's `# cmd:` line. Chromium processes are grandchildren of the node PID, inside the same `setsid` group, and ended with their runs. None of the 39 recorded PIDs is still alive.

```
18284 [timeout -k 10 600 node tools/check.mjs prioritization-board-grid.html ] label=check-before@c41a7c2 start=2026-10-12 07:15:55 EDT
  child 18288 [node tools/check.mjs prioritization-board-grid.html ]
18442 [] label=rule-list-before start=2026-10-12 07:16:09 EDT
18469 [] label=rule-list-base start=2026-10-12 07:16:10 EDT
20218 [timeout -k 10 600 node /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/ex.mjs before /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/ui-c1-wt/prioritization-board-grid.html /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/out/before-try1 ] label=ex-before-try1 start=2026-10-12 07:20:45 EDT
  child 20220 [node /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/ex.mjs before /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/ui-c1-wt/prioritization-board-grid.html /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/out/before-try1 ]
21200 [timeout -k 10 600 node /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/ex.mjs before /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/ui-c1-wt/prioritization-board-grid.html /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/out/before ] label=ex-before@c41a7c2 start=2026-10-12 07:22:43 EDT
  child 21202 [node /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/ex.mjs before /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/ui-c1-wt/prioritization-board-grid.html /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/out/before ]
21728 [timeout -k 10 600 node /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/ex.mjs before-repeat /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/ui-c1-wt/prioritization-board-grid.html /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/out/before-repeat ] label=ex-before-repeat@c41a7c2 start=2026-10-12 07:23:21 EDT
  child 21731 [node /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/ex.mjs before-repeat /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/ui-c1-wt/prioritization-board-grid.html /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/out/before-repeat ]
22056 [] label=cmp-before-vs-repeat start=2026-10-12 07:23:59 EDT
22394 [timeout -k 10 600 node tools/check.mjs prioritization-board-grid.html ] label=check-pre-commit start=2026-10-12 07:24:26 EDT
  child 22396 [node tools/check.mjs prioritization-board-grid.html ]
22442 [] label=rule-list-after-wip start=2026-10-12 07:24:30 EDT
22690 [timeout -k 10 600 node tools/check.mjs prioritization-board-grid.html ] label=check-after@822918e start=2026-10-12 07:24:53 EDT
  child 22692 [node tools/check.mjs prioritization-board-grid.html ]
22738 [timeout -k 10 600 node /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/ex.mjs after /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/ui-c1-wt/prioritization-board-grid.html /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/out/after ] label=ex-after@822918e start=2026-10-12 07:24:57 EDT
  child 22740 [node /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/ex.mjs after /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/ui-c1-wt/prioritization-board-grid.html /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/out/after ]
23076 [] label=cmp-before-vs-after start=2026-10-12 07:25:34 EDT
23320 [timeout -k 10 600 node /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/ex.mjs before2 /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/same/prioritization-board-grid.html /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/out/before2 ] label=ex-before2@c41a7c2-samepath start=2026-10-12 07:26:07 EDT
  child 23322 [node /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/ex.mjs before2 /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/same/prioritization-board-grid.html /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/out/before2 ]
23766 [timeout -k 10 600 node /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/ex.mjs after2 /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/same/prioritization-board-grid.html /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/out/after2 ] label=ex-after2@822918e-samepath start=2026-10-12 07:26:44 EDT
  child 23770 [node /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/ex.mjs after2 /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/same/prioritization-board-grid.html /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/out/after2 ]
24080 [timeout -k 10 300 node /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/cmp.mjs /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/out/before2 /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/out/after2 /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/out/cmp-before2-vs-after2.json ] label=cmp-before2-vs-after2 start=2026-10-12 07:27:22 EDT
  child 24082 [node /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/cmp.mjs /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/out/before2 /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/out/after2 /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/out/cmp-before2-vs-after2.json ]
24232 [timeout -k 10 600 node tools/export-audit/boot-same.mjs ] label=boot-same@822918e start=2026-10-12 07:27:37 EDT
  child 24234 [node tools/export-audit/boot-same.mjs ]
24277 [timeout -k 10 600 node tools/export-audit/audit-ui.mjs ] label=audit-ui@822918e start=2026-10-12 07:27:47 EDT
  child 24279 [node tools/export-audit/audit-ui.mjs ]
24402 [timeout -k 10 600 node tools/export-audit/audit-other.mjs ] label=audit-other@822918e start=2026-10-12 07:28:18 EDT
  child 24404 [node tools/export-audit/audit-other.mjs ]
24584 [timeout -k 10 600 node tools/export-audit/audit.mjs ] label=audit@822918e start=2026-10-12 07:28:52 EDT
  child 24586 [node tools/export-audit/audit.mjs ]
25125 [timeout -k 10 600 node tools/export-audit/audit-recon.mjs ] label=audit-recon@822918e start=2026-10-12 07:29:02 EDT
  child 25127 [node tools/export-audit/audit-recon.mjs ]
26012 [timeout -k 10 600 node /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/rv-smoke-c1.mjs ] label=rv-smoke@822918e start=2026-10-12 07:30:24 EDT
  child 26014 [node /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/rv-smoke-c1.mjs ]
26805 [timeout -k 10 600 node /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/rv-smoke-c1.mjs /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/boards/before-c41a7c2.html ] label=rv-smoke@c41a7c2 start=2026-10-12 07:30:36 EDT
  child 26807 [node /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/rv-smoke-c1.mjs /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/c1/boards/before-c41a7c2.html ]
28484 [] label=table start=2026-10-12 07:31:40 EDT
29495 [] label=table2 start=2026-10-12 07:31:55 EDT
30065 [] label=table3 start=2026-10-12 07:32:09 EDT
```

## Not done, and notes

* **Not pushed** (by instruction). The commit exists only on the local branch `claude/v200-ui-c1` in this worktree, which shares its object store with /home/user/orbit-board's repository. I did not touch /home/user/orbit-ui or /home/user/orbit-board's working tree.
* I did not change the checker or any test tool. The independent review of the committed diff is for another agent.
* In the drawer-tab steps no element scrolled at 1600×1000 (`scrolled none`, the same at both commits). The record fits the panel, so `uiDTab`'s `scrollIntoView` has nothing to move. The tab's pressed state and `UI_DTAB` show which branch was taken, and the evaluated argument is the same string.
* During one of the Chromium runs the agent proxy refused a connection to `android.clients.google.com:443`. That is Chromium's own background component check, not the page: the board makes no network requests (the checker's offline rule). It had no effect on any result.

## Files here

`README.md` (this file) · `commit-822918e.diff` · `commit-msg.txt` · `bin/run.sh` · `rule-list.mjs` · `ex.mjs` · `cmp.mjs` · `table.mjs` · `rv-smoke-c1.mjs` · `boards/` (before-c41a7c2, after-822918e, base-4a6f7c7) · `out/<run>/` (result.json, saved.html, pubstate-reader.txt, dom-*/handlers-* per snapshot) · `out/cmp-*.json` · `out/saved-before-vs-after.diff` · `out/table.md` · `logs/` · `runs.txt` · `pids.txt`
