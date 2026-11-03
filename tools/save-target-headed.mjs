// THE OPEN WINDOW, BY HAND, IN A REAL BROWSER (v2.14 W1, item 140 a; contract §5, §9 D11 and §12 Q1). Run once per version and
// record what it prints in that version's notes; it is not a gate (no npm script). It needs a display: under Xvfb (it starts one
// when DISPLAY is unset) Chromium runs headed and shows its real GTK file chooser, which this script drives with XTest key
// presses, as a person would.
//
// What it records:
//   1. The board under test, filled to about the measured size (8.79 MB, padding in one note), opened from its file.
//   2. A real click on 💾 Save: the board's first Save of this file in this browser opens the Open window; the file it was opened
//      from is chosen there (Ctrl+L, its path, Enter).
//   3. The file's size and SHA-256 before, after the pick, and after the save settles: choosing a file in the Open window changes
//      nothing (the Save window empties it the moment it is chosen: 8,793,759 characters to 0, measured 2 Nov).
//   4. What queryPermission answered and whether requestPermission threw (logged from page code, after load, by wrapping the
//      browser's own FileSystemHandle methods), the board's message line, every dialog, and two screenshots -- so §12 Q1 can say
//      whether the browser asks on the first press or needs a second press of 💾 Save.
//   5. Chromium's version.
//
//   node tools/save-target-headed.mjs [--board FILE] [--out DIR] [--no-pad]
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { boot, seed } from './export-audit/boot.mjs';
import { CHROME } from './chrome.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const arg = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d; };
const FILE = resolve(arg('--board', join(ROOT, 'prioritization-board-grid.html')));
const OUT = resolve(arg('--out', mkdtempSync(join(tmpdir(), 'save-target-headed-'))));
const PAD = !process.argv.includes('--no-pad');
const TARGET = 8793759;          // the measured board's size, characters
mkdirSync(OUT, { recursive: true });
const J = JSON.stringify;
const sha = f => createHash('sha256').update(readFileSync(f)).digest('hex').slice(0, 16);
const look = f => ({ size: statSync(f).size, sha: sha(f) });

// ── XTest, by ctypes (the session's own way to drive the GTK chooser: no xdotool here) ─────────────────────────────────────
const XKEYS = join(OUT, 'xkeys.py');
writeFileSync(XKEYS, `import ctypes, sys, time
X=ctypes.cdll.LoadLibrary('libX11.so.6'); T=ctypes.cdll.LoadLibrary('libXtst.so.6')
X.XOpenDisplay.restype=ctypes.c_void_p; X.XStringToKeysym.restype=ctypes.c_ulong
X.XKeysymToKeycode.argtypes=[ctypes.c_void_p, ctypes.c_ulong]; X.XKeysymToKeycode.restype=ctypes.c_ubyte
T.XTestFakeKeyEvent.argtypes=[ctypes.c_void_p, ctypes.c_uint, ctypes.c_int, ctypes.c_ulong]
X.XFlush.argtypes=[ctypes.c_void_p]
T.XTestFakeMotionEvent.argtypes=[ctypes.c_void_p,ctypes.c_int,ctypes.c_int,ctypes.c_int,ctypes.c_ulong]
T.XTestFakeButtonEvent.argtypes=[ctypes.c_void_p,ctypes.c_uint,ctypes.c_int,ctypes.c_ulong]
d=X.XOpenDisplay(None)
if not d: print('no display'); sys.exit(1)
def kc(n): return X.XKeysymToKeycode(d, X.XStringToKeysym(n.encode()))
def press(ns):
    cs=[kc(n) for n in ns]
    for c in cs: T.XTestFakeKeyEvent(d,c,1,0)
    for c in reversed(cs): T.XTestFakeKeyEvent(d,c,0,0)
    X.XFlush(d); time.sleep(0.04)
M={'/':'slash','-':'minus','.':'period',' ':'space','(':'parenleft',')':'parenright'}
def typ(s):
    for ch in s:
        if ch=='_': press(['Shift_L','minus'])
        elif ch in '()': press(['Shift_L', {'(':'9',')':'0'}[ch]])
        elif ch.isupper(): press(['Shift_L',ch.lower()])
        else: press([M.get(ch,ch)])
for a in sys.argv[1:]:
    if a.startswith('type:'): typ(a[5:])
    elif a.startswith('sleep:'): time.sleep(float(a[6:]))
    elif a.startswith('click:'):
        x,y=map(int,a[6:].split(','))
        T.XTestFakeMotionEvent(d,-1,x,y,0); X.XFlush(d); time.sleep(0.2)
        T.XTestFakeButtonEvent(d,1,1,0); T.XTestFakeButtonEvent(d,1,0,0); X.XFlush(d); time.sleep(0.2)
    else: press(a.split('+'))
print('sent')
`);
const keys = (...a) => execFileSync('python3', ['-I', XKEYS, ...a]).toString().trim();
let xvfb = null;
if (!process.env.DISPLAY) {
  const n = 90 + Math.floor(Math.random() * 9);
  xvfb = spawn('Xvfb', [':' + n, '-screen', '0', '1600x1000x24', '-nolisten', 'tcp'], { stdio: 'ignore' });
  process.env.DISPLAY = ':' + n;
  await new Promise(r => setTimeout(r, 1500));
}
const shot = name => { const f = join(OUT, name); try { execFileSync('import', ['-window', 'root', f]); return f; } catch (e) { return 'no screenshot (' + e.message.split('\n')[0] + ')'; } };

// ── the board file: the board under test, filled, its requirements its own data ─────────────────────────────────────────
const it = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: 'Req ' + id, event: 'Ev ' + id, ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
const B = boot({ html: readFileSync(FILE, 'utf8'), appn: 'O&M' });
seed(B.ev, { services: ['USAF', 'ANG', 'AFRC'], items: [it('A', 'AV', [900, 200, 100]), it('B', 'PSM', [400, 100, 50])], disc: [1200, 300, 150], mand: [100, 20, 10], order: ['A', 'B'] });
B.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); 'ok'`);
let html = B.ev('buildSavedHtml()');
if (PAD && html.length < TARGET) {
  B.ev(`S.notes=S.notes||{}; S.notes.A='p'.repeat(${TARGET - html.length - 40}); MS.years[MS.cur]=S; save(); 'ok'`);
  html = B.ev('buildSavedHtml()');
}
const BOARDF = join(OUT, 'ORBIT Live.html');
writeFileSync(BOARDF, html);
const r = { board: FILE.split('/').pop(), file: BOARDF, before: look(BOARDF) };

const b = await chromium.launch({ executablePath: CHROME, headless: false, args: ['--no-sandbox'] });
r.chromium = b.version();
const ctx = await b.newContext({ viewport: { width: 1500, height: 900 } });
const p = await ctx.newPage(); const dialogs = [];
p.on('dialog', async d => { dialogs.push(d.type() + ': ' + d.message().slice(0, 200)); await d.accept(); });
await p.goto('file://' + BOARDF);
await p.waitForFunction(() => typeof saveInPlace === 'function' && document.documentElement.classList.contains('ui-on'), null, { timeout: 90000 });
await p.waitForTimeout(800);
// what the browser answers, logged from page code after load
await p.evaluate(() => { window.__perm = [];
  const H = window.FileSystemHandle && window.FileSystemHandle.prototype;
  if (!H) { window.__perm.push('no FileSystemHandle in this browser'); return; }
  const q0 = H.queryPermission, r0 = H.requestPermission;
  H.queryPermission = async function (o) { try { const v = await q0.call(this, o); window.__perm.push('queryPermission ' + J(o) + ' -> ' + v); return v; }
    catch (e) { window.__perm.push('queryPermission threw ' + e.name + ': ' + e.message); throw e; } };
  H.requestPermission = async function (o) { try { const v = await r0.call(this, o); window.__perm.push('requestPermission ' + J(o) + ' -> ' + v); return v; }
    catch (e) { window.__perm.push('requestPermission threw ' + e.name + ': ' + e.message); throw e; } };
  function J(o) { try { return JSON.stringify(o); } catch (e) { return String(o); } } });
r.openWindowExists = await p.evaluate(() => typeof window.showOpenFilePicker === 'function');
await p.click('#saveBtn');                                       // a real click: a user gesture
await p.waitForTimeout(2500);
r.shotDialog = shot('1-open-window.png');
r.sayWhileOpen = await p.evaluate(() => (document.getElementById('shareStat') || {}).textContent || '');
// focus follows the pointer here (no window manager): a click in the chooser's file list first, then the path typed -- a leading
// '/' opens GTK's location bar -- then the chooser's Open button (Return there cancelled it, measured)
r.keys = keys('click:600,300', 'sleep:0.4', 'type:' + BOARDF, 'sleep:0.8');
r.shotTyped = shot('1b-typed.png');
r.keys += ' ' + keys('click:1074,798');   // the chooser's Open button (its place in this Chromium's GTK chooser, 1600×1000)
await p.waitForTimeout(1500);
r.afterPick = look(BOARDF);
await p.waitForTimeout(6000);
r.shotAfter = shot('2-after-pick.png');
r.perm = await p.evaluate(() => window.__perm);
r.say = await p.evaluate(() => (document.getElementById('shareStat') || {}).textContent || '');
r.afterSettle = look(BOARDF);
// The browser's own question ("Save changes to ORBIT Live.html? file:/// will be able to edit ORBIT Live.html", measured 3 Nov on
// Chromium 153): answered Save changes, at its place in this window
keys('click:904,202');
await p.waitForTimeout(4000);
r.shotGranted = shot('3-after-save-changes.png');
r.permAfterAnswer = await p.evaluate(() => window.__perm.slice());
r.sayAfterAnswer = await p.evaluate(() => (document.getElementById('shareStat') || {}).textContent || '');
r.afterAnswer = look(BOARDF);
r.writtenOnTheFirstPress = r.afterAnswer.sha !== r.before.sha;
// the second press: the remembered file, no window
await p.evaluate(() => { window.__perm.length = 0; });
await p.click('#saveBtn'); await p.waitForTimeout(5000);
r.shotSecond = shot('4-second-save.png');
r.permSecond = await p.evaluate(() => window.__perm.slice());
r.saySecond = await p.evaluate(() => (document.getElementById('shareStat') || {}).textContent || '');
r.afterSecond = look(BOARDF);
r.dialogs = dialogs;
r.unchangedByThePick = r.afterPick.sha === r.before.sha;
await b.close();
if (xvfb) xvfb.kill();
writeFileSync(join(OUT, 'result.json'), J(r, null, 1));
console.log(J(r, null, 1));
console.log('\nresult and screenshots in ' + OUT);
