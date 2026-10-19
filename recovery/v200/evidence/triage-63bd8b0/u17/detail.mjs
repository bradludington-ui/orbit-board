// detail.mjs <out json> : read-only; prints the steps' statuses, flags and the folder at each step of one run
import { readFileSync } from 'node:fs';
const r = JSON.parse(readFileSync(process.argv[2], 'utf8')); const J = JSON.stringify;
const b = v => v && v.screen ? `screen=${v.screen.whose} DIRTY=${v.DIRTY} _baseDirty=${v._baseDirty} rec.dirty=${!!v.baseGet.dirty} base=${v.baseFolder} kept=${v.kept ? v.kept.whose + '(' + v.kept.meta.why + ')' : null} stored=${v.stored.whose} busy=${v._saveBusy} gen=${v._saveGen}\n      header: ${v.header.slice(0, 140)}\n      status: ${v.status.slice(0, 400)}` : '';
const f = x => x ? `head=${x.head && x.head.whose}@${x.head && x.head.ts} hist=[${(x.history || []).map(h => h.name.replace('spmt-2027-om-', '') + ':' + h.whose).join(', ')}]` : '';
console.log(r.scenario, r.next, r.board, r.startedET, '->', r.endedET);
for (const s of r.steps) {
  console.log('* ' + s.step + (s.how ? ' (' + J(s.how).slice(0, 160) + ')' : '') + (s.returned !== undefined ? ' returned=' + J(s.returned) : ''));
  for (const k of ['brad', 'mid', 'atHold', 'saveHeld', 'saved', 'before', 'after', 'afterPutBack', 'afterSave', 'afterConnect', 'afterRefresh']) if (s[k] && s[k].screen) console.log('   ' + k + ': ' + b(s[k]));
  if (s.folder) console.log('   folder: ' + f(s.folder));
  if (s.asked && s.asked.length) console.log('   asked: ' + J(s.asked).slice(0, 300));
  if (s.question) console.log('   question: ' + s.question.replace(/\n+/g, ' / ').slice(0, 400));
  if (s.where) console.log('   where: ' + J(s.where));
}
for (const k of ['u17state', 'nextFrom', 'v3parts', 'v4parts', 'whereNow']) if (r[k]) console.log(k + ' ' + J(r[k]));
