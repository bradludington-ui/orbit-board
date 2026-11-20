// Pictures of a PMO's blocks (CONTRACT §41): the By PMO view has Copy picture and Save picture on each block, which draw that
// PMO's block and no other; the Slide blocks page says where they are and that a picture carries no CUI marking. What the
// picture holds is measured in pictures.test.mjs (Chromium); here, the buttons. Invented data.
//
//   node apex/test/pmo-pictures.test.mjs
process.env.TZ = 'America/New_York';
import { loadTool, pageHtml, checks } from './harness.mjs';

const C = checks('pmo-pictures');
const J = x => JSON.stringify(x);
const settle = (ms = 30) => new Promise(res => setTimeout(res, ms));
try {
  const t = loadTool({ html: pageHtml({}) });
  const W = t.window, doc = W.document, SP = t.SP;
  for (let i = 0; i < 200 && !doc.getElementById('uiMain'); i++) await settle(5);
  const H = SP.RAW_HEADERS, row = (fy, cc, title, pe, date, amt, pmo) => ({ FY: fy, 'CCaR No': cc, Title: title, Budget: 'USAF O&M- Tessa Base Discretionary', 'Plan Event': pe, Date: date, Amount: amt, Alloc: 'Not Allocated', PMO: pmo });
  const ROWS = [row(2027, 'TS1', 'Tessa A', 'E1', '2026-12-01', '1000000', 'Air Vehicle (AV)'), row(2027, 'TS2', 'Tessa B', 'E2', '2027-02-01', '700000', 'Air Vehicle (AV)'),
    row(2028, 'TS1', 'Tessa A', 'E3', '2027-12-01', '300000', 'Air Vehicle (AV)'), row(2027, 'TS3', 'Tessa C', 'E4', '2027-03-01', '400000', 'Propulsion (PP)')];
  const csv = [H.join(',')].concat(ROWS.map(o => H.map(h => (o[h] === undefined ? '' : o[h])).join(','))).join('\n');
  SP.applyImport(await SP.parseFiles([{ name: 'om.csv', data: csv }], { now: '2026-11-09T12:00:00.000Z' }));
  SP.setSettings({ asOf: '2026-10' });
  await settle(60);
  const main = () => doc.getElementById('uiMain');
  const click = async el => { el.dispatchEvent(new W.MouseEvent('click', { bubbles: true })); await settle(60); };
  // what was drawn and saved, in place of a canvas jsdom does not have
  const drawn = [], saved = [], copied = [];
  SP.blockPng = async (b, M, opt) => { drawn.push([b.apLabel + ' FY' + b.fy, opt && opt.pmo ? opt.pmo.label : null]); return new W.Blob(['x'], { type: 'image/png' }); };
  SP.copyBlockPicture = async (b, M, opt) => { copied.push([b.apLabel + ' FY' + b.fy, opt && opt.pmo ? opt.pmo.label : null]); return { ok: true, message: 'copied' }; };
  SP.download = (name, blob, mime) => { saved.push([name, mime]); return name; };

  await click(doc.querySelector('#uiNav [data-v=pmos]'));
  const secs = () => [...main().querySelectorAll('section.blk-sec')];
  C.eq('By PMO: Air Vehicle’s two blocks each have Copy picture and Save picture, named for the PMO and the block',
    J(secs().map(s => [s.getAttribute('aria-label'), [...s.querySelectorAll('.slidebtns button')].map(b => b.textContent + ' | ' + b.getAttribute('aria-label'))])),
    J([['O&M FY2027', ['Copy picture | Copy picture of PMO AV - O&M FY2027', 'Save picture | Save picture of PMO AV - O&M FY2027']],
      ['O&M FY2028', ['Copy picture | Copy picture of PMO AV - O&M FY2028', 'Save picture | Save picture of PMO AV - O&M FY2028']]]));
  await click(secs()[1].querySelector('button[data-act=savepic]'));
  C.eq('Save picture on the second block draws that PMO’s FY2028 block and saves it under its own name', J([drawn, saved]), J([[['O&M FY2028', 'Air Vehicle (AV)']], [['PMO AV - O&M FY2028.png', 'image/png']]]));
  await click(secs()[0].querySelector('button[data-act=copypic]'));
  C.eq('Copy picture on the first block copies that PMO’s FY2027 block', J(copied), J([['O&M FY2027', 'Air Vehicle (AV)']]));
  // another PMO picked: its buttons draw its block
  const sel = main().querySelector('select[data-act=pmo]');
  sel.value = String([...sel.options].findIndex(o => o.textContent === 'Propulsion (PP)'));
  sel.dispatchEvent(new W.Event('change', { bubbles: true })); await settle(60);
  drawn.length = 0; saved.length = 0;
  await click(secs()[0].querySelector('button[data-act=savepic]'));
  C.eq('with Propulsion picked, Save picture draws Propulsion’s block', J([drawn, saved]), J([[['O&M FY2027', 'Propulsion (PP)']], [['PMO PP - O&M FY2027.png', 'image/png']]]));
  // the Slide blocks page: an appropriation's buttons still draw the appropriation's block, and the page says where the PMO's are
  await click(doc.querySelector('#uiNav [data-v=slides]'));
  drawn.length = 0; saved.length = 0;
  await click(main().querySelector('button[data-act=savepic][data-b="0"]'));
  C.eq('Slide blocks: Save picture still draws the appropriation’s block, with no PMO', J([drawn, saved]), J([[['O&M FY2027', null]], [['O&M FY2027.png', 'image/png']]]));
  C.chk('Slide blocks says a picture carries no CUI marking, and that each PMO’s are on By PMO and in the zip', /carries no CUI marking: the slide it goes on is marked/.test(main().textContent)
    && /Each PMO’s blocks have the same two buttons on By PMO; Save all pictures holds them too, in a folder named By PMO\./.test(main().querySelector('#uiPmoPicNote').textContent));
  await click(main().querySelector('#uiPmoPicNote button'));
  C.chk('its By PMO button opens By PMO', /^PMO: /.test(main().querySelector('h2.title').textContent));
  C.eq('no script error on the page', J(t.errors.filter(x => !/^Not implemented: (Window's scrollTo\(\) method|HTMLInputElement\.prototype\.click|HTMLCanvasElement)/.test(String(x)))), '[]');
  t.close();
} catch (err) {
  console.error(err);
  C.chk('the test ran to its end', false, (err && err.message) || String(err));
}
C.done();
