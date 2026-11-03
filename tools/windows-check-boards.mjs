// SYNTHETIC BOARDS FOR BRAD'S WINDOWS CHECK OF v2.14 (contract §12 Q2: "A Windows check before merge, which only you can do ...
// with synthetic disposable boards we provide"). Nothing here is budget data: every requirement, office, figure and estimate line
// is made up, and the files are written OUTSIDE the repository (.gitignore refuses board files anyway).
//
//   node tools/windows-check-boards.mjs [--out DIR]          (default: a new folder under the system temp directory)
//
// It writes, into DIR:
//   1. "ORBIT Test Big Board (saved by v2.12).html" -- a board saved by the v2.12 program (Brad's live version, 3 Nov 2026) with
//      O&M, Full Fund and Initial Spares, each locked under PB27, and a cost estimate large enough that the whole board cannot fit in
//      browser storage (5,242,880 characters): its full import into v2.13 is refused exactly as Brad's was, and v2.14 offers
//      "Write the imported board into a new file…".
//   2. "ORBIT Test Small Board.html" -- a small board saved by THIS program, for the first 💾 Save of a file (the Open window,
//      item 140): opening it runs v2.14's own code.
//   3. "ORBIT v2.14 candidate.html" -- the program in this working tree.
//   4. "READ ME FIRST.txt" -- the steps, and what to write down.
// and checks, in jsdom, that (1) is refused by the working tree's program for room and offered the new file, that (2) opens with
// its requirements, and that neither carries anything but the made-up content.
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { boot, seed } from './export-audit/boot.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const oi = process.argv.indexOf('--out');
const OUT = resolve(oi >= 0 ? process.argv[oi + 1] : mkdtempSync(join(tmpdir(), 'orbit-windows-check-')));
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
const J = JSON.stringify;
const V212 = execFileSync('git', ['-C', ROOT, 'show', 'fe0c83d:prioritization-board-grid.html'], { maxBuffer: 64 << 20 }).toString('utf8');
const PROG = readFileSync(join(ROOT, 'prioritization-board-grid.html'), 'utf8');
const LIMIT = 5242880;
let bad = 0;
const chk = (what, ok, detail) => { if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}${!ok && detail !== undefined ? '   ' + detail : ''}`); };

const SVC = ['USAF', 'ANG', 'AFRC'];
const OFFICES = ['AV', 'PSM', 'TSS', 'ENG'];
// a made-up requirement: whole dollars, uneven by service so the lanes do something
const req = (pre, n) => {
  const id = pre + String(n).padStart(3, '0');
  const k = (n * 7919) % 97 + 3;
  return { id, grp: OFFICES[n % OFFICES.length], team: OFFICES[n % OFFICES.length], sect: '', custom: false,
    title: 'Synthetic requirement ' + id, event: 'Test event ' + (n % 9 + 1), ccar: '', fy26: [0, 0, 0],
    ask: [k * 100000, Math.round(k * 23000), Math.round(k * 11000)], alloc: null };
};
// one appropriation of the board, built by the v2.12 program's own code and locked under PB27
const appn = (html, label, pre, count, disc) => {
  const items = Array.from({ length: count }, (_, i) => req(pre, i + 1));
  const B = boot({ html, appn: label });
  seed(B.ev, { services: SVC, items, disc, mand: disc.map(v => Math.round(v * 0.2)), order: items.map(i => i.id) });
  B.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S);
    S.notes[${J(items[0].id)}]='A made-up note on a made-up requirement'; save(); blCyc='PB'; blYr=MS.cur; cycLock(); 'ok'`);
  return B;
};

console.log(`\nbuilding into ${OUT}`);
// (1) THE BIG BOARD: Full Fund and Spares first, then O&M on top of the saved file, then the estimate
const F = appn(V212, 'FULL FUND', 'FF', 30, [60000000, 9000000, 4000000]);
const S2 = appn(F.ev('buildSavedHtml()'), 'INITIAL SPARES', 'SP', 15, [20000000, 3000000, 1500000]);
const O = appn(S2.ev('buildSavedHtml()'), 'O&M', 'OM', 60, [150000000, 30000000, 15000000]);
// a made-up cost estimate in pieces under the import check's 200,000-character text limit (the shape import-file.mjs uses)
O.ev(`(function(){ const blob=[]; for(let i=0;i<29;i++) blob.push('synthetic-estimate-piece-'+String(i).padStart(4,'0')+'-'+'x'.repeat(189970));
  ACEDB={ts:Date.now(), sets:{'2026 TEST ACE':{label:'2026 TEST ACE', ts:Date.now(), blob:blob}}}; return 'ok'; })()`);
const BIG = O.ev('buildSavedHtml()');
const BIGN = 'ORBIT Test Big Board (saved by v2.12).html';
writeFileSync(join(OUT, BIGN), BIG);
chk('the big board is saved by v2.12', /BUILD='v2\.12/.test(BIG));
chk('the big board is larger than browser storage holds', BIG.length > LIMIT, BIG.length);

// (2) THE SMALL BOARD
const SM = appn(PROG, 'O&M', 'SM', 8, [9000000, 2000000, 1000000]);
const SMALL = SM.ev('buildSavedHtml()');
const SMALLN = 'ORBIT Test Small Board.html';
writeFileSync(join(OUT, SMALLN), SMALL);
const smallState = ((SMALL.match(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/) || [])[1] || '').length;   // the board, not the program
chk('the small board is saved by this program, and its board is well inside browser storage', SMALL.includes(PROG.match(/BUILD='[^']*'/)[0]) && smallState > 0 && smallState < LIMIT / 10, smallState);

// (3) THE PROGRAM
writeFileSync(join(OUT, 'ORBIT v2.14 candidate.html'), PROG);
const build = (PROG.match(/BUILD='([^']*)'/) || [])[1] || '?';

// THE SELF-CHECK, in jsdom, with browser storage as large as Chrome's and Edge's
{
  const T = boot({ html: PROG, quota: LIMIT });
  await new Promise(r => setTimeout(r, 5));
  const r = JSON.parse(T.ev(`(function(){ window.confirm=function(){ return true; }; window.alert=function(){};
    const ret=fullImportText(${J(BIG)}, ${J(BIGN)});
    return JSON.stringify({ret:ret, offered:!!document.getElementById('impFileGo'), stat:(document.getElementById('shareStat')||{}).textContent||''}); })()`));
  chk('the program refuses the big board’s full import for room, and offers “Write the imported board into a new file…”', r.ret === false && r.offered, J(r));
  const SB = boot({ html: SMALL });
  chk('the small board opens with its eight requirements', SB.ev('S.order.length') === 8);
}
// nothing in either board but the made-up content
for (const [n, h] of [[BIGN, BIG], [SMALLN, SMALL]]) {
  const st = (h.match(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/) || [])[1] || '';
  const ids = new Set((st.match(/"(OM|FF|SP|SM)\d{3}"/g) || []).map(s => s.slice(1, -1)));
  chk(n + ': every requirement is a made-up one', ids.size > 0 && [...ids].every(i => /^(OM|FF|SP|SM)\d{3}$/.test(i)), [...ids].slice(0, 5).join(','));
}

writeFileSync(join(OUT, 'READ ME FIRST.txt'), `ORBIT ${build} -- the Windows check (made-up boards only; nothing here is budget data)

Put all four files in one new folder on your work computer, for example Documents\\ORBIT test.
Do the whole check in an InPrivate window (Edge: Ctrl+Shift+N) or an Incognito window (Chrome: Ctrl+Shift+N). That window has
browser storage of its own, so your real ORBIT files and what this browser keeps for them are not touched, and closing the
window throws the test away. Open each file by dragging it onto that window.

B FIRST -- THE FIRST SAVE OF A FILE (item 140)
 1. Open "${SMALLN}". Change one requirement's title, press Save.
    Expected: a window asking you to pick the file this board came from. Pick "${SMALLN}".
    The browser then asks whether ORBIT may edit that file -- allow it. Expected: Saved.
 2. Change another title and press Save again. Expected: nothing is asked; Saved.
 3. Close the tab.

A -- THE BIG IMPORT (item 141)
 1. Open "ORBIT v2.14 candidate.html".
 2. Imports & exports > Import a full board (new version)... > choose "${BIGN}".
    Expected: "Nothing was imported ... browser storage refused ..." and a box offering
    "Write the imported board into a new file...".
 3. Press it. The save window suggests a NEW name. Keep it. Do NOT pick the big board itself.
    Expected: "Saved ... read back whole", then a new tab or the page opens on the new file.
 4. In the new file: change one requirement's title on O&M, press Save (it asks you to pick the file, as in B -- pick the new
    file). Change another title, press Save again. Expected: the second Save asks nothing.
 5. Choose a PPBE cycle for every appropriation from the bar at the top, then switch to Full Fund.
    Expected: its 30 made-up requirements, on the cycle you chose.
 6. Close the window. That deletes everything the test kept in browser storage.

PLEASE WRITE DOWN
 - Chrome or Edge, and its version (... > Help and feedback > About).
 - Whether the browser says it is managed by your organisation (Settings shows "Your browser is managed by your organization").
 - In B1: did the browser ask on the first press of Save, or did you have to press Save a second time?
 - In A3: did Windows ask "replace?" for anything? Where was the new file written?
 - Whether your real board files open from a drive letter (C:\\...) or a \\\\server address.
 - Anything that said something you did not expect: a photo of the screen is perfect.
When done, delete the folder: nothing in it is needed afterwards.
`);
console.log(`\n${bad ? bad + ' FAILING CHECK(S)' : 'the Windows check boards are ready'} -- ${OUT}`);
process.exit(bad ? 1 : 0);
