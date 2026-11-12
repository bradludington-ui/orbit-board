// STAND-INS for the export (60-export.js, builder C1) and the pictures (70-pictures.js, builder C3), used by ui.test.mjs
// ONLY when run with UI_STUBS=1 and only for a call the real module does not yet define. They exist so the screens'
// own handling of each result (the message, the file name, the download) can be proved before those modules land;
// they prove nothing about the workbook or the pictures themselves, which have their own tests.
(function () {
  const SP = window.SP;
  const model = () => SP.buildModel(SP.state.pulls.current, SP.state.settings, SP.getView());
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  if (typeof SP.exportExcel !== 'function') SP.exportExcel = async function () {
    const M = model();
    const name = SP.download('SCOPE FY' + M.E + ' - data through ' + M.asOfLabel + ' - ' + today() + (M.shown.all ? '' : ' [filtered]') + '.xlsx',
      new Uint8Array([0x50, 0x4b, 0x05, 0x06].concat(new Array(18).fill(0))), 'application/octet-stream');
    return { ok: true, message: 'Wrote “' + name + '” (test stand-in).' };
  };
  if (typeof SP.blockPng !== 'function') SP.blockPng = function (block) {
    const c = document.createElement('canvas'); c.width = 4; c.height = 2;
    return new Promise(res => c.toBlob(res, 'image/png'));
  };
  if (typeof SP.allPicturesZip !== 'function') SP.allPicturesZip = async function (M) {
    const files = M.blocks.map(b => ({ name: b.apLabel + ' FY' + b.fy + '.png', data: new Uint8Array([1, 2, 3]) }));
    const bytes = typeof SP.zipFiles === 'function' ? await SP.zipFiles(files) : new Uint8Array([0x50, 0x4b, 0x05, 0x06].concat(new Array(18).fill(0)));
    return new Blob([bytes], { type: 'application/zip' });
  };
  if (typeof SP.copyBlockPicture !== 'function') SP.copyBlockPicture = async function (block) {
    return { ok: false, message: 'The clipboard refused the picture of ' + block.apLabel + ' FY' + block.fy + ' (test stand-in). Use Save picture instead.' };
  };
})();
