
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

