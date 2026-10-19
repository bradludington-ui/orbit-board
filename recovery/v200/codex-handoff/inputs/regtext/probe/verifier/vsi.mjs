// vsi.mjs <copyRoot> [variantBoard] : U41 through a FILE (the builder measured applyState only; "a file carrying one was not
// built"). A saved file whose year holds S.si {R1:'at', R2:'EN'} is opened: is it refused, or opened with 'at' dropped and
// nothing said? Then saved and reopened: is the file's own value gone? Synthetic data only; literals for what is expected.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const root = resolve(process.argv[2]);
if (process.argv[3]) process.env.BOARD = resolve(process.argv[3]); else delete process.env.BOARD;
await import(pathToFileURL(root + '/runtime-encoding-shim.mjs').href);
const { boot, seed, BOARD } = await import(pathToFileURL(root + '/tools/export-audit/boot.mjs').href);
console.log('BOARD', BOARD);
const J = JSON.stringify;
const out = (k, v, want) => console.log(k.padEnd(58) + ' got ' + (typeof v === 'string' ? v : J(v)) + (want !== undefined ? '   want ' + J(want) + (J(v) === J(want) ? '  OK' : '  DIFFERS') : ''));
const it = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: 'Req ' + id, event: 'Ev ' + id, ccar: 'CC' + id, fy26: ask.map(() => 0), ask, alloc: null });
const SC = { services: ['USN', 'USMC'], items: [it('R1', 'AV', [900, 0]), it('R2', 'AV', [300, 0])], disc: [5000, 5000], mand: [0, 0], order: ['R1', 'R2'] };
const X = boot();
seed(X.ev, SC);
X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); 'ok'`);
out('slug / siApplies', X.ev(`JSON.stringify([mySlug(), siApplies()])`));
// the year's si map written as a file would carry it (no applyState after)
X.ev(`S.si={R1:'at', R2:'EN'}; MS.years[MS.cur]=S; 'ok'`);
const html = X.ev('buildSavedHtml()');
out('the file carries', JSON.parse(X.ev(`JSON.stringify(MS.years[MS.cur].si)`)), { R1: 'at', R2: 'EN' });
const R = boot({ html });
out('opened: errors', R.errors.slice(0, 3));
out('opened: S.si', JSON.parse(R.ev(`JSON.stringify(S.si||{})`)), { R1: 'at', R2: 'EN' });
out('opened: siOf R1, R2', JSON.parse(R.ev(`JSON.stringify([siOf(itemById('R1')), siOf(itemById('R2'))])`)));
out('opened: status line', R.ev(`document.getElementById('shareStat').textContent.slice(0,200)`));
out('opened: Needs attention kinds', R.ev(`JSON.stringify(Object.keys(attLists()||{}).filter(function(k){ return (attLists()[k]||[]).length; }))`));
const R2 = boot({ html: R.ev('buildSavedHtml()') });
out('saved there, reopened: S.si', JSON.parse(R2.ev(`JSON.stringify(S.si||{})`)), { R1: 'at', R2: 'EN' });
console.log('done');
