+// ==== v2.00 (U42): a funds-flow sheet name never ends in half a character or begins or ends with an apostrophe ====
+// On the destination axis each destination gets a sheet named by exportFlow's tabName, cut to 28 UTF-16 units (26 when it
+// numbers a repeat). A cut through an emoji left its first half at the end, which the workbook wrote as U+FFFD; a name
+// with an apostrophe at either end, or a cut that left one there, became a sheet name a spreadsheet may not have.
+// THE BOARD: USAF/ANG/AFRC, R1 AV [900,000, 200,000, 0], funded, going to the last of seven destinations added by hand:
+//   D x27 + 😀 + "tail"        -> "D" x27            (the 28-unit cut ended on the emoji's first half)
+//   'Quoted depot'            -> Quoted depot       (an apostrophe at each end)
+//   E x25 + 😀 + "A-one"       -> E x25 + 😀 + "A"   (the emoji fits whole: kept)
+//   E x25 + 😀 + "A-two"       -> E x25 + " 2"       (a repeat of the one above; the 26-unit cut ended on the first half)
+//   F x27 + "'tail"           -> "F" x27            (the cut left an apostrophe at the end)
+//   O'Brien, Plain depot      -> unchanged          (an apostrophe inside a name is allowed)
+// Read from the workbook's own bytes (xl/workbook.xml), working and after a save and reopen: no U+FFFD anywhere in it,
+// every name 31 units or fewer and unique, the part parses. CONTROLS: the money (Funds Flow TOTAL FUNDING 1,100,000 =
+// 900,000 + 200,000, and R1's two rows on Plain depot's sheet) and the seven names as saved, never cut.
+// FAILS ON 7ee498a: the D, E-repeat and F names, Quoted depot, and U+FFFD in the part; the controls pass there too.
+await (async () => {
+  const name = 'v2.00 (U42) — a funds-flow sheet name never ends in half a character or begins or ends with an apostrophe';
+  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
+  const __bm = bootMark();
+  const keepBoards = () => [];
+  try {
+    const J = JSON.stringify, K = 1000;
+    const { inflateRawSync } = await import('node:zlib');
+    const cell = c => (c && typeof c === 'object' && 'v' in c) ? c.v : c;
+    const D27 = 'D'.repeat(27), E25 = 'E'.repeat(25), F27 = 'F'.repeat(27);
+    const names = [D27 + '\u{1F600}tail', "'Quoted depot'", E25 + '\u{1F600}A-one', E25 + '\u{1F600}A-two', F27 + "'tail", "O'Brien", 'Plain depot'];
+    const X = boot();
+    seed(X.ev, { services: ['USAF', 'ANG', 'AFRC'], items: [it('R1', 'AV', [900 * K, 200 * K, 0])], disc: [5000 * K, 5000 * K, 5000 * K], mand: [0, 0, 0], order: ['R1'] });
+    X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
+      applyState(S); save(); ${J(names)}.forEach(function(n){ flowAddEnt(); flowSetEnt(flowEnts().length-1,'n',n); });
+      S.dest={R1:{to:flowEnts()[flowEnts().length-1].k,end:''}}; flowSetAxis('dest'); 'ok'`);
+    const html = X.ev('buildSavedHtml()');
+    // the workbook's bytes (base64), and what the board's own reader makes of them
+    const flowBook = async B => JSON.parse(await B.w.eval(`(async function(){ var cap=null, _B=window.Blob;
+      window.alert=function(){}; window.confirm=function(){ return true; };
+      window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
+      try{ exportFlow(); }catch(e){ window.Blob=_B; return JSON.stringify({err:'threw '+String((e&&e.message)||e)}); }
+      window.Blob=_B; if(!cap) return JSON.stringify({err:'no file'});
+      var u=cap instanceof Uint8Array? cap : new Uint8Array(cap), s='';
+      for(var i=0;i<u.length;i+=8192) s+=String.fromCharCode.apply(null, Array.from(u.subarray(i,i+8192)));
+      return JSON.stringify({b64:btoa(s), book:await xlsxRead(u.buffer.slice(u.byteOffset,u.byteOffset+u.byteLength))}); })()`));
+    // one part of a ZIP, by its local headers (stored or deflated)
+    const part = (b64, want) => { const u = Buffer.from(b64, 'base64'); let i = 0;
+      while (i + 30 <= u.length && u.readUInt32LE(i) === 0x04034b50) {
+        const m = u.readUInt16LE(i + 8), sz = u.readUInt32LE(i + 18), nl = u.readUInt16LE(i + 26), xl = u.readUInt16LE(i + 28);
+        const d = u.subarray(i + 30 + nl + xl, i + 30 + nl + xl + sz);
+        if (u.subarray(i + 30, i + 30 + nl).toString('utf8') === want) return m === 0 ? d : inflateRawSync(d);
+        i += 30 + nl + xl + sz; }
+      return null; };
+    for (const [where, B] of [['working', X], ['saved and reopened', boot({ html })]]) {
+      const got = await flowBook(B);
+      const wb = got.b64 ? part(got.b64, 'xl/workbook.xml') : null;
+      const doc = wb ? new B.w.DOMParser().parseFromString(wb.toString('utf8'), 'application/xml') : null;
+      const nm = doc ? Array.from(doc.getElementsByTagName('sheet')).map(x => x.getAttribute('name')) : [];
+      w5Chk(name, where, 'the 28-unit cut through an emoji drops its first half: the sheet is "D" x27',
+        J(nm.filter(n => n.startsWith('DDDD'))), J([D27]));
+      w5Chk(name, where, 'xl/workbook.xml holds no U+FFFD (EF BF BD)', wb ? wb.includes(Buffer.from([0xef, 0xbf, 0xbd])) : 'NO PART', false);
+      w5Chk(name, where, 'an apostrophe at each end of a name, and one the cut left at the end, are gone: no name begins or ends with one',
+        J([nm.filter(n => /Quoted|^FFFF/.test(n)), nm.filter(n => /^'|'$/.test(n))]), J([['Quoted depot', F27], []]));
+      w5Chk(name, where, 'a repeat whose 26-unit cut ends on an emoji’s first half is "E" x25 + " 2"; the first, where the emoji fits, keeps it',
+        J(nm.filter(n => n.startsWith('EEEE'))), J([E25 + '\u{1F600}A', E25 + ' 2']));
+      w5Chk(name, where, 'CONTROL — an apostrophe inside a name stays, and Plain depot is unchanged',
+        J(nm.filter(n => n === "O'Brien" || n === 'Plain depot')), J(["O'Brien", 'Plain depot']));
+      w5Chk(name, where, 'CONTROL — the part parses; every name is 31 units or fewer and unique (any case); the first three are the summary sheets',
+        J([doc ? doc.getElementsByTagName('parsererror').length : 'NO PART', nm.every(n => n.length <= 31), new Set(nm.map(n => n.toLowerCase())).size === nm.length, nm.slice(0, 3)]),
+        J([0, true, true, ['Funds Flow', 'Prime Detail', 'OGC Detail']]));
+      const ff = (got.book || {})['Funds Flow'] || [], plain = (got.book || {})['Plain depot'] || [];
+      w5Chk(name, where, 'CONTROL — Funds Flow TOTAL FUNDING is 900,000 + 200,000 = 1,100,000',
+        J(ff.filter(r => cell((r || [])[0]) === 'TOTAL FUNDING' && typeof cell(r[1]) === 'number').slice(-1).map(r => cell(r[1]))), J([1100 * K]));
+      w5Chk(name, where, 'CONTROL — Plain depot’s sheet holds R1’s two service rows, its money unchanged',
+        J(plain.slice(1).filter(r => cell(r[0]) === 'Req R1').map(r => [cell(r[2]), cell(r[3]), cell(r[4]), cell(r[5])])),
+        J([['O&M', 'AV', 'USAF', 900 * K], ['O&M', 'AV', 'ANG', 200 * K]]));
+      w5Chk(name, where, 'CONTROL — the seven destinations keep their whole names in the board’s data',
+        B.ev('JSON.stringify(flowEnts().slice(-7).map(function(e){ return e.n; }))'), J(names));
+    }
+  } catch (e) {
+    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
+  }
+  bootRelease(__bm, keepBoards());
+  await settleBoards();
+})();
+// ==== end v2.00 (U42) ====
