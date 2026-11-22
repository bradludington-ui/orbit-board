// Tagged spend plan PDFs (CONTRACT §51, Section 508): every PDF APEX publishes says it is tagged, carries a structure tree
// in reading order (the CUI marking, headings, paragraphs, tables with column and row headings), marks every text it draws
// as either that tree's content or an Artifact (rules, fills, the emblem, a header repeated on a continued page, the page
// frame), and every table's rows add up to the same number of columns once their spans are counted. The PDF is read here
// byte by byte, as a reader would, never through the code that wrote it. Invented data, long enough to run onto more pages.
//
//   node apex/test/pdf-tags.test.mjs
process.env.TZ = 'America/New_York';
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadTool, checks, scratchDir } from './harness.mjs';

const C = checks('pdf-tags');
const J = x => JSON.stringify(x);
const HEADERS = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc', 'Event Description',
  'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC', 'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code',
  'IPT', 'Spares WBS', 'Quantity', 'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element'];   // CONTRACT §2, restated
const q = v => { const s = v === undefined || v === null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = rows => [HEADERS.join(',')].concat(rows.map(o => HEADERS.map(h => q(o[h])).join(','))).join('\n');
const B = ['USAF O&M- Tessa Base Discretionary', 'USAF ANG O&M Tessa', 'USN STOVL O&M Tessa'];
const PMOS = ['Air Vehicle (AV)', 'Propulsion (PP)'];
// THE PLAN: O&M FY2027, 30 records (Tessa 01 to Tessa 30), each with plan events on two services, so the section runs onto
// several pages; Tessa 07 is USAF 1,234,567 and ANG 200,000
const OM = [];
for (let i = 1; i <= 30; i++) {
  const n = String(i).padStart(2, '0'), ccar = 'TS' + n, t = 'Tessa ' + n, pmo = PMOS[i % 2];
  OM.push({ FY: 2027, 'CCaR No': ccar, Title: t, Budget: B[0], 'Plan Event': 'Event ' + n + 'a', Date: '2026-12-01', Amount: i === 7 ? '1234567' : String(100000 * i), Alloc: 'Not Allocated', PMO: pmo });
  OM.push({ FY: 2027, 'CCaR No': ccar, Title: t, Budget: B[1 + (i % 2)], 'Plan Event': 'Event ' + n + 'b', Date: '2027-02-01', Amount: i === 7 ? '200000' : '50000', Alloc: 'Not Allocated', PMO: pmo });
}
// THE UNFUNDED LIST, O&M FY2027, $K: 1 Tessa 03 USAF 300 · 2 New thing (no plan) USAF 100
const K = k => k * 100000;
const UFR = { 2027: { fy: 2027, name: 'UFR.xlsx', lines: [
  { ap: 'om', fy: 2027, sheet: 'O&M', row: 10, rank: '1', title: 'Tessa 03', pmo: 'PP', ccar: 'TS03', cents: [K(300), 0, 0, 0, 0, 0, 0], total: K(300), status: 'Unfunded', exec: 'Yes', sfcb: '' },
  { ap: 'om', fy: 2027, sheet: 'O&M', row: 11, rank: '2', title: 'New thing', pmo: 'AV', ccar: 'TS99', cents: [K(100), 0, 0, 0, 0, 0, 0], total: K(100), status: 'Pending', exec: '', sfcb: 'Deferred' }] } };

// ---------------------------------------------------------------- a small PDF reader: objects, streams, the tree
function readPdf(u8) {
  const s = Buffer.from(u8).toString('latin1'), objs = new Map();
  const re = /(\d+) 0 obj\n([\s\S]*?)\nendobj\n/g;
  let m;
  while ((m = re.exec(s))) objs.set(Number(m[1]), m[2]);
  const dictOf = n => { const o = objs.get(n) || ''; return o.includes('\nstream\n') ? o.slice(0, o.indexOf('\nstream\n')) : o; };
  const streamOf = n => { const o = objs.get(n) || ''; const i = o.indexOf('\nstream\n'); return i < 0 ? '' : o.slice(i + 8, o.lastIndexOf('endstream')); };
  const ref = (d, k) => { const r = new RegExp('/' + k + ' (\\d+) 0 R').exec(d); return r ? Number(r[1]) : 0; };
  const cat = dictOf(1), pages = (/\/Kids \[([^\]]*)\]/.exec(dictOf(2)) || ['', ''])[1].match(/\d+(?= 0 R)/g).map(Number);
  return { s, objs, dictOf, streamOf, ref, cat, pages };
}
// text of a content stream between BT and ET, read back from the WinAnsi string: (...) with \( \) \\ escapes and \ddd
const unstr = t => t.replace(/\\([()\\])/g, '$1').replace(/\\(\d{3})/g, (_, o) => String.fromCharCode(parseInt(o, 8))).replace(/\x95/g, '\u2022');   // WinAnsi 149 is the bullet
function contentRuns(stream) {
  // every BT..ET with the marked content it sits in: {mcid} or 'art' or null (none)
  const out = [], stack = [];
  for (const line of stream.split('\n')) {
    let m;
    if ((m = /^\/(\w+) <<\/MCID (\d+)>> BDC$/.exec(line))) stack.push({ role: m[1], mcid: Number(m[2]) });
    else if (line === '/Artifact BMC') stack.push('art');
    else if (line === 'EMC') { if (!stack.length) out.push({ bad: 'EMC with nothing open' }); stack.pop(); }
    else if (/^BT /.test(line)) out.push({ in: stack.length ? stack[stack.length - 1] : null, depth: stack.length, text: unstr((/\((.*)\) Tj ET$/.exec(line) || ['', ''])[1]) });
  }
  if (stack.length) out.push({ bad: 'marked content left open' });
  return out;
}
function tree(P) {
  // the structure tree, from the root's /K, every element with its role, attributes, kids and its content (page, mcid)
  const root = P.ref(P.cat, 'StructTreeRoot'), rd = P.dictOf(root), top = P.ref(rd, 'K');
  const walk = n => {
    const d = P.dictOf(n), role = (/\/S \/(\w+)/.exec(d) || [])[1], pg = P.ref(d, 'Pg'), A = /\/A << ([^>]*) >>/.exec(d);
    const kraw = (/\/K (\[[^\]]*\]|\d+ 0 R|\d+)/.exec(d) || ['', '[]'])[1];
    const el = { n, role, pg, attrs: A ? A[1] : '', kids: [], mc: [], parent: P.ref(d, 'P') };
    const body = kraw.startsWith('[') ? kraw.slice(1, -1) : kraw;
    const toks = body.match(/<< \/Type \/MCR \/Pg \d+ 0 R \/MCID \d+ >>|\d+ 0 R|\d+/g) || [];
    for (const t of toks) {
      let x;
      if ((x = /\/Pg (\d+) 0 R \/MCID (\d+)/.exec(t))) el.mc.push([Number(x[1]), Number(x[2])]);
      else if ((x = /^(\d+) 0 R$/.exec(t))) { const k = walk(Number(x[1])); k.up = el; el.kids.push(k); }
      else el.mc.push([pg, Number(t)]);
    }
    return el;
  };
  return { root, rd, top: walk(top) };
}
const each = (el, fn) => { fn(el); for (const k of el.kids) each(k, fn); };

try {
  const t = loadTool({ modules: ['util', 'xlsx-read', 'import', 'engine', 'publish', 'pdf', 'store'] }), SP = t.SP;
  SP.storeInit();
  SP.applyImport(await SP.parseFiles([{ name: 'om.csv', data: csv(OM) }], { now: '2026-11-09T12:00:00.000Z' }));
  SP.setSettings({ asOf: '2026-10' });
  const M = SP.buildModel(SP.state.pulls.current, SP.state.settings, SP.defaultView(), null);
  const D = SP.publishData(M, UFR, null, { settings: SP.state.settings });
  const ctx = { program: 'Tessa Program', fm: { om: 'O. Lead' }, asOfLabel: M.asOfLabel, today: '2026-11-17', dataDay: '2026-11-09' };
  const tmp = scratchDir('apex-pdftags-');
  let docN = 0;
  for (const doc of D.docs) {
    docN++;
    const bytes = SP.publishPdf(doc, ctx), P = readPdf(bytes), who = doc.file + ': ';
    // 1 the catalog and the pages
    C.chk(who + 'the catalog says it is tagged, names its structure tree and its language', /\/MarkInfo << \/Marked true >>/.test(P.cat) && P.ref(P.cat, 'StructTreeRoot') > 0 && /\/Lang \(en-US\)/.test(P.cat), P.cat);
    C.chk(who + 'every page names its place in the parent tree, in page order, and asks for tab order by structure',
      P.pages.every((pg, i) => new RegExp('/StructParents ' + i + ' /Tabs /S').test(P.dictOf(pg))));
    // 2 every text drawn is content of the tree or an Artifact, never loose; marked content is balanced and never nested
    const runs = P.pages.map(pg => contentRuns(P.streamOf(P.ref(P.dictOf(pg), 'Contents'))));
    const all = runs.flat();
    C.chk(who + 'every text is inside marked content, one level deep, and every BDC and BMC is closed', all.every(r => !r.bad && r.in && r.depth === 1), J(all.filter(r => r.bad || !r.in || r.depth !== 1).slice(0, 3)));
    // 3 the tree and the parent tree agree, both ways: each MCID on a page is one element's content, and that element lists it
    const T = tree(P), byMc = new Map();
    each(T.top, el => { for (const [pg, mc] of el.mc) { const k = pg + ':' + mc; byMc.set(k, (byMc.get(k) || []).concat([el])); } });
    const pt = P.dictOf(P.ref(T.rd, 'ParentTree')), nums = [...pt.matchAll(/(\d+) \[([^\]]*)\]/g)].map(x => [Number(x[1]), (x[2].match(/\d+(?= 0 R)/g) || []).map(Number)]);
    let agree = true, why = '';
    runs.forEach((rs, i) => {
      const ids = rs.filter(r => r.in && r.in !== 'art').map(r => r.in.mcid), arr = (nums.find(x => x[0] === i) || [0, []])[1];
      if (J(ids) !== J(ids.map((_, k) => k))) { agree = false; why = 'page ' + i + ' MCIDs are not 0..n in order'; }
      ids.forEach(id => { const els = byMc.get(P.pages[i] + ':' + id) || [];
        if (els.length !== 1) { agree = false; why = 'page ' + i + ' MCID ' + id + ' is content of ' + els.length + ' elements'; }
        else if (arr[id] !== els[0].n) { agree = false; why = 'page ' + i + ' MCID ' + id + ': parent tree says ' + arr[id] + ', tree says ' + els[0].n; }
        else if (rs.find(r => r.in && r.in.mcid === id).in.role !== els[0].role) { agree = false; why = 'page ' + i + ' MCID ' + id + ' is marked ' + rs.find(r => r.in && r.in.mcid === id).in.role + ' in the page and is a ' + els[0].role; } });
    });
    C.chk(who + 'the tree, the parent tree and the pages agree on every piece of content', agree && byMc.size === all.filter(r => r.in && r.in !== 'art').length, why);
    C.chk(who + 'each element names its parent', (() => { let ok = true; each(T.top, el => { if (el.up && el.parent !== el.up.n) ok = false; }); return ok && T.top.parent === T.root; })());
    // 4 the reading order: the tree's text in order
    const textOf = new Map();
    runs.forEach((rs, i) => rs.forEach(r => { if (r.in && r.in !== 'art') textOf.set(P.pages[i] + ':' + r.in.mcid, r.text); }));
    const words = el => { const o = []; each(el, e => { for (const [pg, mc] of e.mc) o.push(textOf.get(pg + ':' + mc)); }); return o; };
    const order = words(T.top);
    C.eq(who + 'the document is read starting with its CUI marking, once', J([order[0], order.filter(w => w === SP.CUI).length]), J([SP.CUI, 1]));
    C.chk(who + 'and the page frame (file name, page numbers) is never read', !order.some(w => /^Page \d+ of \d+$/.test(w)) && !order.includes(doc.file.replace(/\.pdf$/i, '')));
    // 5 tables: each row covers the same number of columns once spans are counted; a TH always says its scope
    let tabsOk = true, twhy = '', nTables = 0;
    each(T.top, el => {
      if (el.role === 'TH' && !/\/Scope \/(Column|Row)/.test(el.attrs)) { tabsOk = false; twhy = 'a TH with no scope'; }
      if (el.role !== 'Table') return;
      nTables++;
      const rows = el.kids.filter(k => k.role === 'TR'), occ = rows.map(() => 0), width = [];
      if (rows.length !== el.kids.length) { tabsOk = false; twhy = 'a table holds something that is not a row'; }
      rows.forEach((tr, i) => {
        for (const c of tr.kids) {
          if (c.role !== 'TH' && c.role !== 'TD') { tabsOk = false; twhy = 'a row holds a ' + c.role; }
          const rs = Number((/\/RowSpan (\d+)/.exec(c.attrs) || [0, 1])[1]), cs = Number((/\/ColSpan (\d+)/.exec(c.attrs) || [0, 1])[1]);
          for (let k = 0; k < rs; k++) { if (i + k >= rows.length) { tabsOk = false; twhy = 'a cell spans past the table'; } else occ[i + k] += cs; }
        }
      });
      width.push(...new Set(occ));
      if (width.length !== 1) { tabsOk = false; twhy = 'rows of ' + J(occ.slice(0, 30)) + ' columns in one table (first: ' + words(rows[0]).join(' | ') + ')'; }
    });
    C.chk(who + 'every table is square: each row covers the same columns, spans counted; every heading cell has a scope', tabsOk && nTables > 0, twhy);
    // 6 the headings
    const heads = [];
    each(T.top, el => { if (/^H\d$/.test(el.role)) heads.push(el.role + ' ' + words(el).join(' / ')); });
    if (docN === 1) {
      C.eq(who + 'the headings, in order: the status page, its table, the section opener, the section, the unfunded list', J(heads),
        J(['H1 Tessa Program - Spend Plan / Operations & Maintenance', 'H2 O&M by fiscal year', 'H2 Each PMO in O&M',
          'H1 FY2027 Spend Plan / Operations & Maintenance', 'H2 Tessa Program - FY27 Spend Plan / Operations & Maintenance', 'H1 Unfunded requirements']));
      // 7 the spend plan table runs onto more pages, and its column headings are read once
      const sp = []; each(T.top, el => { if (el.role === 'Table' && el.kids[0] && words(el.kids[0]).includes('Award Date')) sp.push(el); });
      const pagesOfSp = new Set(); each(sp[0], el => { for (const [pg] of el.mc) pagesOfSp.add(pg); });
      C.eq(who + 'one spend plan table, over more than one page, its headings one row read once', J([sp.length, pagesOfSp.size > 1, words(sp[0].kids[0])]),
        J([1, true, ['PMO', 'Requirement Title', 'Description', 'Award Date', 'Service', 'Required', 'Approved', 'Obligated', 'Remaining', 'Delta (+/-)']]));
      C.chk(who + 'on a continued page the headings are drawn and are an Artifact', runs.slice(1).some(rs => rs.some(r => r.text === 'Requirement Title' && r.in === 'art')));
      // 8 a record: its title is a row heading over its rows, then its description and award dates, then each service row
      const rec = sp[0].kids.find(tr => tr.kids.some(c => c.role === 'TH' && words(c)[0] === 'Tessa 07'));
      const i0 = sp[0].kids.indexOf(rec), rr = [sp[0].kids[i0], sp[0].kids[i0 + 3], sp[0].kids[i0 + 6]];
      C.eq(who + 'Tessa 07: the title (a row heading spanning its 7 rows: six services and Total), its plan events, its dates, then each service with its figures', J(rr.map(tr => tr.kids.map(c => c.role + (/RowSpan (\d+)/.exec(c.attrs) ? '*' + /RowSpan (\d+)/.exec(c.attrs)[1] : '') + ':' + words(c).join(' ')))),
        J([[...(rec.kids[0].role === 'TD' && rec.kids.length === 10 ? [rec.kids[0].role + '*' + /RowSpan (\d+)/.exec(rec.kids[0].attrs)[1] + ':' + words(rec.kids[0]).join(' ')] : []),
          'TH*7:Tessa 07 CCaR TS07', 'TD*7:• Event 07a • Event 07b', 'TD*7:Dec-2026 Feb-2027', 'TH:USAF', 'TD:$ 1,234,567', 'TD:$ 1,234,567', 'TD:-', 'TD:$ 1,234,567', 'TD:-'],
          ['TH:USMC (F-35B)', 'TD:$ 200,000', 'TD:$ 200,000', 'TD:-', 'TD:$ 200,000', 'TD:-'],
          ['TH:Total', 'TD:$ 1,434,567', 'TD:$ 1,434,567', 'TD:-', 'TD:$ 1,434,567', 'TD:-']]));
      // 9 the unfunded list as a table: headings, the group row, a line with its title as the row heading, subtotal, total
      const ut = []; each(T.top, el => { if (el.role === 'Table' && el.kids[0] && words(el.kids[0]).includes('Funding Status')) ut.push(el); });
      C.eq(who + 'the unfunded table: headings, the group, each line (title a row heading), the subtotal and the total', J(ut[0].kids.map(tr => tr.kids.map(c => c.role + ':' + words(c).join(' ')).filter(x => !/^T[DH]:$/.test(x)))),
        J([['TH:FY', 'TH:Rank', 'TH:Requirement Title', 'TH:PMO', 'TH:CCaR Record', 'TH:USAF', 'TH:ANG', 'TH:AFRC', 'TH:STOVL', 'TH:USMC CV', 'TH:USN CV', 'TH:Total', 'TH:Funding Status', 'TH:Exec Ready?', 'TH:SFCB Action'],
          ['TD:O&M FY2027'],
          ['TD:FY27', 'TD:1', 'TH:Tessa 03', 'TD:Propulsion (PP)', 'TD:TS03', 'TD:300,000', 'TD:-', 'TD:-', 'TD:-', 'TD:-', 'TD:-', 'TD:300,000', 'TD:Unfunded', 'TD:Yes'],
          ['TD:FY27', 'TD:2', 'TH:New thing', 'TD:Air Vehicle (AV)', 'TD:TS99', 'TD:100,000', 'TD:-', 'TD:-', 'TD:-', 'TD:-', 'TD:-', 'TD:100,000', 'TD:Pending', 'TD:Deferred'],
          ['TH:Subtotal - O&M FY2027', 'TD:400,000', 'TD:-', 'TD:-', 'TD:-', 'TD:-', 'TD:-', 'TD:400,000'],
          ['TH:Total unfunded', 'TD:400,000', 'TD:-', 'TD:-', 'TD:-', 'TD:-', 'TD:-', 'TD:400,000']]));
      // 10 another program reads it as tagged, with no complaint
      writeFileSync(join(tmp.dir, 'om.pdf'), bytes);
      const pi = spawnSync('pdfinfo', [join(tmp.dir, 'om.pdf')], { encoding: 'utf8' });
      if (pi.status === null) C.chk('pdfinfo is not installed here: skipped', true);
      else {
        C.chk(who + 'poppler says it is tagged, with no complaint', /Tagged:\s+yes/.test(pi.stdout) && pi.stderr === '', pi.stdout + pi.stderr);
        const st = spawnSync('pdfinfo', ['-struct-text', join(tmp.dir, 'om.pdf')], { encoding: 'utf8' });
        C.chk(who + 'and reads its structure tree with no complaint, starting Document, P, the marking', st.status === 0 && st.stderr === '' && /^Document\n {2}P \(block\)\n {4}"CUI/.test(st.stdout), st.stderr || st.stdout.slice(0, 200));
      }
    }
  }
  // the same input gives the same bytes, tagged as untagged
  const d0 = D.docs[0];
  C.eq('the same input gives the same bytes', Buffer.compare(Buffer.from(SP.publishPdf(d0, ctx)), Buffer.from(SP.publishPdf(d0, ctx))), 0);
  C.chk('a drawing given no structure tree is written as before, claiming no tags', !/MarkInfo|StructTreeRoot|BDC|BMC/.test(Buffer.from(SP.pdfBytes({ title: 'x', pages: [{ w: 100, h: 100, ops: [{ t: 'text', x: 1, y: 9, s: 'Hi' }] }] })).toString('latin1')));
  C.eq('no script error', J(t.errors), '[]');
  t.close();
} catch (err) {
  console.error(err);
  C.chk('the test ran to its end', false, (err && err.message) || String(err));
}
C.done();
