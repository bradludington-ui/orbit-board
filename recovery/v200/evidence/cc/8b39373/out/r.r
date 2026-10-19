   await settleBoards();
 })();
 // ==== end v2.00 (U14) ====
+// ==== v2.00 (U36): an RCN / EEIC title over 80 characters is refused, never cut ====
+// The registry-text review (U35): rcnSet cut a typed title to its first 80 characters without a word -- "kept" text the
+// person never saw go -- and the cut counted the two halves an emoji is stored as, so 79 letters and an emoji were kept as
+// 79 letters and HALF the emoji, which the workbook then printed as a replacement mark. Item 91 already refuses a code over
+// its limit rather than cutting it; the title now gets the same rule: refused, the list keeps what it had, the field keeps
+// what was typed, marked, and the status says the title was not changed. The limit is counted by Unicode code point, so an
+// emoji stored as two halves counts once (a joined emoji, a flag or a letter with a separate accent mark counts as several).
+// Once a value is kept in the list, that refusal leaves the status line, which would otherwise go on saying "not changed"
+// of a title just changed; any other message stays.
+// THE BOARD: O&M, services USAF / ANG / AFRC, one requirement R1 asking USAF 900, ANG 200, AFRC 0, pots of 5,000 each, so it
+// is funded in full; its award is in FYMON[2]. The list holds one combination, K1 = 11111 / AAAAA titled "base", and R1 is on
+// it, so RCN-EEIC by Month prints "11111 / AAAAA  base" (two spaces before the title) with USAF 900 and ANG 200 against it.
+// Each case types into a field of its own, the list put back to "base" first. Expected values are literals.
+// CONTROLS: an 80-letter title is kept, and so are 80 letters typed with spaces around them (the limit is on the title as
+// it is kept, trimmed); a padded title is kept trimmed; a title of markup and a leading = is kept and printed in the
+// workbook as the very text it is (it never begins a cell there: the codes come first); a title within the limit typed in
+// the panel is saved and drawn again, and the field has no maxlength; an empty title is kept empty; two spaces inside a
+// title are kept; a message other than the title's refusal stays on the line when a title is kept; and codes typed as
+// "=1+1" and "@a1", each a cell of its own in the Spend Plan Source, go out as text: no part of that file holds a formula.
+// FAILS ON d66dd60 (U14, the board of 7ee498a), 14 of its 24 checks: every over-80 title was cut to 80, saved, and nothing
+// was said, the field was not marked (the panel's own field redrawn), the 80-character emoji title was kept as 79 letters
+// and half an emoji, the workbook printed the cut titles, the saved file kept them, a file's 100-letter title was cut
+// to 80 by its first edit, and an over-80 title typed in the panel was cut where it should be refused and then corrected.
+// The 10 CONTROLS pass there and here.
+await (async () => {
+  const name = 'v2.00 (U36) — an RCN / EEIC title over 80 characters is refused, never cut';
+  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
+  const __bm = bootMark();
+  try {
+    const J = JSON.stringify;
+    const X = boot();
+    seed(X.ev, { services: ['USAF', 'ANG', 'AFRC'], items: [it('R1', 'AV', [900, 200, 0])], disc: [5000, 5000, 5000], mand: [0, 0, 0], order: ['R1'] });
+    X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
+      S.awards={R1:{mode:'single', d:FYMON[2][0], day:3}}; MS.rcn=[{k:'K1', rcn:'11111', eeic:'AAAAA', t:'base', svc:['USAF','ANG','AFRC']}];
+      S.rcnAsg={R1:'K1'}; applyState(S); save(); 'ok'`);
+    // [the title kept, the field marked, the field still holds what was typed, the status line]
+    const typed = t => JSON.parse(X.ev(`JSON.stringify((function(){ MS.rcn[0].t='base'; setStat(''); var el=document.createElement('input');
+      el.value=${J(t)}; rcnSet(0,'t',el.value,el);
+      return [MS.rcn[0].t, el.getAttribute('aria-invalid'), el.value===${J(t)}, document.getElementById('shareStat').textContent]; })())`));
+    // the workbook's RCN-EEIC by Month, from its bytes: [row label, TOTAL] for each combination row above the breakout
+    const sheet = async (W) => {
+      const bk = JSON.parse(await w6Book(W, 'exportExcel')); if (bk.__err) return bk.__err;
+      const rc = bk['RCN-EEIC by Month'] || [], iReq = rc.findIndex(r => w6Lbl(r) === 'WHICH REQUIREMENTS SIT UNDER EACH COMBINATION');
+      return rc.slice(0, iReq < 0 ? rc.length : iReq).filter(r => /^11111 \/ AAAAA/.test(w6Lbl(r))).map(r => [w6Lbl(r), num(r[14])]);
+    };
+    const A81 = 'A'.repeat(81), E80 = 'a'.repeat(79) + '\u{1F600}', E81 = 'a'.repeat(80) + '\u{1F600}', B200 = 'B'.repeat(200);
+    const no = (shown, n) => '⚠ RCN / EEIC title not changed. The title “' + shown + '…” is ' + n + ' characters; it can be at most 80. Nothing was changed.';
+    w5Chk(name, 'title typed as 81 letters', 'refused: the list keeps "base", the field keeps what was typed, marked, and the status says the title was not changed',
+      J(typed(A81)), J(['base', 'true', true, no('A'.repeat(60), 81)]));
+    w5Chk(name, 'title typed as 200 letters', 'refused, the same: nothing is cut to 80 and kept',
+      J(typed(B200)), J(['base', 'true', true, no('B'.repeat(60), 200)]));
+    w5Chk(name, 'title typed as 80 letters and an emoji', '81 characters (82 halves): refused, said as 81 characters',
+      J(typed(E81)), J(['base', 'true', true, no('a'.repeat(60), 81)]));
+    w5Chk(name, 'the workbook after the refusals', 'RCN-EEIC by Month still prints K1 as "11111 / AAAAA  base": USAF 900, ANG 200',
+      J(await sheet(X.w)), J([['11111 / AAAAA  base', 900], ['11111 / AAAAA  base', 200]]));
+    // A REFUSAL SAVES NOTHING: the board is not marked changed and its save stamp is not moved, so nothing reads as an edit
+    const quiet = JSON.parse(X.ev(`JSON.stringify((function(){ MS.rcn[0].t='base'; DIRTY=false; MS.ts=1; var el=document.createElement('input');
+      el.value=${J(A81)}; rcnSet(0,'t',el.value,el); return [MS.rcn[0].t, DIRTY, MS.ts]; })())`));
+    w5Chk(name, 'a refused title saves nothing', '81 letters typed: the list keeps "base", the board is not marked changed, its save stamp stays 1',
+      J(quiet), J(['base', false, 1]));
+    w5Chk(name, 'title typed as 79 letters and an emoji', '80 characters: kept whole, the emoji too (no half of one), the field not marked, nothing said',
+      J(typed(E80)), J([E80, null, true, '']));
+    w5Chk(name, 'the workbook with that title', 'RCN-EEIC by Month prints it whole, emoji and all: USAF 900, ANG 200',
+      J(await sheet(X.w)), J([['11111 / AAAAA  ' + E80, 900], ['11111 / AAAAA  ' + E80, 200]]));
+    const R = boot({ html: X.ev('buildSavedHtml()') });
+    w5Chk(name, 'saved and reopened', 'the file keeps the title whole, emoji and all',
+      J(JSON.parse(R.ev(`JSON.stringify(rcnReg().map(function(e){ return [e.k, e.t]; }))`))), J([['K1', E80]]));
+    // THE PANEL'S OWN FIELD: Setup's RCN / EEIC list, its title field changed the way a person changes it
+    const pf = JSON.parse(X.ev(`JSON.stringify((function(){ MS.rcn[0].t='base'; save(); rcnOpen=true; render();
+      var el=document.querySelector('#rcnBody input[placeholder="what this line funds"]'); if(!el) return 'no title field';
+      el.value=${J(A81)}; el.dispatchEvent(new Event('change'));
+      var r=[MS.rcn[0].t, el.getAttribute('aria-invalid'), el.value===${J(A81)}, el.isConnected]; rcnOpen=false; render(); return r; })())`));
+    w5Chk(name, 'the title field in the RCN / EEIC panel', '81 letters typed there: refused, and that same field stays on screen holding them, marked',
+      J(pf), J(['base', 'true', true, true]));
+    // THE LIMIT IS ON THE TITLE AS IT IS KEPT, trimmed, and the refusal quotes it so
+    w5Chk(name, 'title typed as 81 letters with spaces before them', 'refused, said as 81 characters, the status quoting the title trimmed, as it would be kept',
+      J(typed('   ' + 'A'.repeat(81))), J(['base', 'true', true, no('A'.repeat(60), 81)]));
+    // A TITLE THAT ARRIVED IN A FILE OVER 80 (kept whole on opening, U38) is shown whole in the panel, and retyping it there is
+    // held to the same limit: refused, the file's title kept. Before, any edit of it cut it to 80, and the next save kept the cut.
+    const L100 = 'L'.repeat(100), M100 = 'M'.repeat(100);
+    const FF = boot({ html: X.ev(`(function(){ MS.rcn[0].t=${J(L100)}; var h=buildSavedHtml(); MS.rcn[0].t='base'; return h; })()`) });
+    const ff = JSON.parse(FF.ev(`JSON.stringify((function(){ setStat(''); rcnOpen=true; render();
+      var el=document.querySelector('#rcnBody input[placeholder="what this line funds"]'); if(!el) return 'no title field';
+      var shown=el.value; el.value=${J(M100)}; el.dispatchEvent(new Event('change'));
+      var r=[shown===${J(L100)}, rcnReg()[0].t===${J(L100)}, el.getAttribute('aria-invalid'), document.getElementById('shareStat').textContent];
+      rcnOpen=false; render(); return r; })())`));
+    w5Chk(name, 'a 100-letter title from a file, retyped in the panel', 'the field shows all 100; 100 other letters typed there are refused, said as 100 characters, and the file\'s title is kept',
+      J(ff), J([true, true, 'true', no('M'.repeat(60), 100)]));
+    w5Chk(name, 'that file saved and reopened', 'its title is still the 100 letters it arrived with',
+      J(JSON.parse(boot({ html: FF.ev('buildSavedHtml()') }).ev(`JSON.stringify(rcnReg().map(function(e){ return [e.k, e.t]; }))`))), J([['K1', L100]]));
+    // THE COUNT IS BY CODE POINT, as the release notes say: a letter written with a separate accent mark counts as two
+    w5Chk(name, 'title typed as 41 letters, each with a separate accent mark', '82 code points: refused, said as 82 characters (a reader sees 41)',
+      J(typed('e\u0301'.repeat(41))), J(['base', 'true', true, no('e\u0301'.repeat(30), 82)]));
+    // A REFUSAL IS NOT LEFT STANDING once the title is corrected where it is: refused in the panel's own field, then corrected
+    // there. The corrected title is kept and drawn again, unmarked, and the status line no longer says the title was not changed.
+    const fx = JSON.parse(X.ev(`JSON.stringify((function(){ MS.rcn[0].t='base'; save(); setStat(''); rcnOpen=true; render();
+      var el=document.querySelector('#rcnBody input[placeholder="what this line funds"]'); if(!el) return 'no title field';
+      el.value=${J(A81)}; el.dispatchEvent(new Event('change')); var said=document.getElementById('shareStat').textContent;
+      el.value='good title'; el.dispatchEvent(new Event('change'));
+      var el2=document.querySelector('#rcnBody input[placeholder="what this line funds"]');
+      var r=[said, MS.rcn[0].t, el2? el2.value : null, el2? el2.getAttribute('aria-invalid') : 'no field', document.getElementById('shareStat').textContent];
+      rcnOpen=false; render(); return r; })())`));
+    w5Chk(name, 'a refused title corrected in its field', '81 letters refused there, then "good title" typed in the same field: kept, drawn again unmarked, and the refusal is gone from the status line',
+      J(fx), J([no('A'.repeat(60), 81), 'good title', 'good title', null, '']));
+    // CONTROLS
+    w5Chk(name, 'title typed as 80 letters with spaces around them', 'CONTROL — 80 once trimmed: kept as the 80 letters, the field not marked, nothing said',
+      J(typed('  ' + 'y'.repeat(80) + '  ')), J(['y'.repeat(80), null, true, '']));
+    w5Chk(name, 'title typed as 80 letters', 'CONTROL — kept exactly, the field not marked, nothing said',
+      J(typed('x'.repeat(80))), J(['x'.repeat(80), null, true, '']));
+    w5Chk(name, 'title typed as "  padded title  "', 'CONTROL — kept trimmed, as before',
+      J(typed('  padded title  ')), J(['padded title', null, true, '']));
+    const F = '=HYPERLINK("http://example.invalid","x") <b>&amp;';
+    w5Chk(name, 'title typed as markup and a leading =', 'CONTROL — kept exactly as typed, the field not marked, nothing said',
+      J(typed(F)), J([F, null, true, '']));
+    w5Chk(name, 'the workbook with that title', 'CONTROL — RCN-EEIC by Month prints it as the very text it is: USAF 900, ANG 200',
+      J(await sheet(X.w)), J([['11111 / AAAAA  ' + F, 900], ['11111 / AAAAA  ' + F, 200]]));
+    // A TITLE WITHIN THE LIMIT, typed in the panel's own field, is saved and drawn: the board is marked changed, its save stamp
+    // moves, and the panel is drawn again holding the new title. The field has no maxlength (a browser would cut a paste there).
+    const kp = JSON.parse(X.ev(`JSON.stringify((function(){ MS.rcn[0].t='base'; save(); rcnOpen=true; render();
+      var el=document.querySelector('#rcnBody input[placeholder="what this line funds"]'); if(!el) return 'no title field';
+      var ml=el.hasAttribute('maxlength'); DIRTY=false; MS.ts=1; el.value='kept title'; el.dispatchEvent(new Event('change'));
+      var el2=document.querySelector('#rcnBody input[placeholder="what this line funds"]');
+      var r=[MS.rcn[0].t, DIRTY, MS.ts>1, el.isConnected, el2? el2.value : null, ml]; rcnOpen=false; render(); return r; })())`));
+    w5Chk(name, 'a title within the limit, typed in the panel', 'CONTROL — kept, saved (the board marked changed, its save stamp moved) and drawn again; the field has no maxlength',
+      J(kp), J(['kept title', true, true, false, 'kept title', false]));
+    w5Chk(name, 'title cleared', 'CONTROL — an empty title is kept empty, nothing said',
+      J(typed('')), J(['', null, true, '']));
+    w5Chk(name, 'title typed with two spaces inside it', 'CONTROL — kept exactly as typed, the two spaces too',
+      J(typed('two  spaces')), J(['two  spaces', null, true, '']));
+    // ONLY THE TITLE'S OWN REFUSAL LEAVES THE LINE: any other message stays when a title is kept
+    const om = JSON.parse(X.ev(`JSON.stringify((function(){ MS.rcn[0].t='base'; setStat('✓ Saved to the shared folder automatically — 9:05 AM.');
+      var el=document.createElement('input'); el.value='other title'; rcnSet(0,'t',el.value,el);
+      return [MS.rcn[0].t, document.getElementById('shareStat').textContent]; })())`));
+    w5Chk(name, 'a title kept under another message', 'CONTROL — kept, and a message that is not the title\'s refusal stays on the line',
+      J(om), J(['other title', '✓ Saved to the shared folder automatically — 9:05 AM.']));
+    // A CELL THAT BEGINS WITH = OR @ GOES OUT AS TEXT, never a formula. A title never begins a cell (RCN-EEIC by Month puts the
+    // codes first), so the codes are used: an RCN typed as "=1+1" and an EEIC typed as "@a1" are kept (code text is warned
+    // about, never blocked), and each is a cell of its own in the Spend Plan Source. Every part of that file is read from its
+    // bytes: [formula elements, compressed parts (which could hide one), the cells that are exactly the two codes].
+    const fm = JSON.parse(X.ev(`JSON.stringify((function(){ MS.rcn[0].t='base'; setStat(''); var el=document.createElement('input');
+      rcnSet(0,'rcn','=1+1',el); rcnSet(0,'eeic','@a1',el); return [MS.rcn[0].rcn, MS.rcn[0].eeic, el.getAttribute('aria-invalid')]; })())`));
+    const sp = JSON.parse(await X.w.eval(`(async function(){
+      var cap=null,_B=window.Blob; window.alert=function(){}; window.confirm=function(){ return true; };
+      window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
+      try{ exportSrc(); }catch(e){ window.Blob=_B; return JSON.stringify('threw '+String((e&&e.message)||e)); }
+      window.Blob=_B; if(!cap) return JSON.stringify('no file');
+      var u=cap instanceof Uint8Array? cap : new Uint8Array(cap.buffer||cap), i=0, dec=new TextDecoder('utf-8'), f=0, packed=0, cells=[];
+      while(i+30<=u.length && u[i]===0x50 && u[i+1]===0x4b && u[i+2]===0x03 && u[i+3]===0x04){
+        var m=u[i+8]|(u[i+9]<<8), csz=(u[i+18]|(u[i+19]<<8)|(u[i+20]<<16)|(u[i+21]<<24))>>>0, nl=u[i+26]|(u[i+27]<<8), xl=u[i+28]|(u[i+29]<<8);
+        if(m) packed++; f+=(dec.decode(u.subarray(i+30+nl+xl, i+30+nl+xl+csz)).match(/<f[ >]/g)||[]).length; i+=30+nl+xl+csz; }
+      var rd=await xlsxRead(u.buffer.slice(u.byteOffset,u.byteOffset+u.byteLength));
+      Object.keys(rd).forEach(function(sn){ (rd[sn]||[]).forEach(function(r){ (r||[]).forEach(function(c){ if((c==='=1+1'||c==='@A1') && cells.indexOf(c)<0) cells.push(c); }); }); });
+      return JSON.stringify([f, packed, cells.sort()]); })()`));
+    w5Chk(name, 'codes typed as "=1+1" and "@a1", in the Spend Plan Source', 'CONTROL — kept as =1+1 and @A1; the file holds no formula, and each is a cell of exactly that text',
+      J([fm, sp]), J([['=1+1', '@A1', null], [0, 0, ['=1+1', '@A1']]]));
+  } catch (e) {
+    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
+  }
+  bootRelease(__bm, []);
+  await settleBoards();
+})();
+// ==== end v2.00 (U36) ====
 
 {
   const src = _selfRead(_selfPath(import.meta.url), 'utf8');
