// The test harness for APEX (until November 2026 the SFCB Spend Plan dashboard). Every test boots the tool from its SOURCES (build.mjs assemble),
// never from the built file on disk, so tests run by two builders at once cannot read a half-written page.
//
//   const t = loadTool({ modules: ['util','xlsx-read','import'] });   // only these modules
//   const t = loadTool();                                              // every module, as the built page
//   const t = loadTool({ state: {...} });                              // with a saved state in the spState tag
//   t.SP              the tool's public API (window.SP)
//   t.window          the jsdom window
//   t.errors          script errors jsdom reported (a test should assert this is empty)
//   t.close()
//
// What jsdom lacks and the tool needs (streams, Blob.stream, Response) is taken from Node, the SAME realm for all of them:
// a jsdom Blob piped into a Node stream does not interop, and that failure looks like a damaged workbook.
import { JSDOM, VirtualConsole } from 'jsdom';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assemble } from '../build.mjs';

export function pageHtml({ modules = null, state = null } = {}) {
  let html = assemble({ modules });
  if (state !== null && state !== undefined) {
    const json = JSON.stringify(state).replace(/</g, '\\u003c');
    html = html.replace('<script id="spState" type="application/json">null</script>',
      () => '<script id="spState" type="application/json">' + json + '</script>');
  }
  return html;
}

// §23: O&M FY2025 is left out entirely by default. The tests of the FY2025 O&M OBBBA rule (§15, §17) and of anything else
// that needs O&M FY2025 rows call keepEveryYear() first: every tool they load afterwards leaves nothing out, which is the
// tool with settings.leftOut = [].
let leftOutDefault;
export function keepEveryYear() { leftOutDefault = []; }
export function loadTool({ modules = null, state = null, html = null, url = 'file:///tmp/apex.html', quiet = true } = {}) {
  const vc = new VirtualConsole();
  const errors = [];
  vc.on('jsdomError', e => errors.push(e && (e.message || String(e))));
  if (!quiet) vc.sendTo(console);
  const src = html != null ? html : pageHtml({ modules, state });
  const dom = new JSDOM(src, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url,
    virtualConsole: vc,
    beforeParse(win) {
      for (const g of ['Blob', 'Response', 'Request', 'Headers', 'ReadableStream', 'WritableStream',
                       'TransformStream', 'DecompressionStream', 'CompressionStream', 'TextEncoder', 'TextDecoder']) {
        if (typeof globalThis[g] === 'function') win[g] = globalThis[g];
      }
      win.URL.createObjectURL = () => 'blob:stub';
      win.URL.revokeObjectURL = () => {};
      win.alert = () => {}; win.confirm = () => true; win.prompt = () => null;
    },
  });
  const w = dom.window;
  if (leftOutDefault !== undefined && w.SP) { w.SP.LEFT_OUT_DEFAULT = leftOutDefault.slice(); w.SP.KEEP_ZERO_DEFAULT = true; }   // §24: and keeps the $0.00 plan events
  return {
    window: w,
    SP: w.SP,
    errors,
    ev: expr => w.eval(expr),
    close: () => { try { w.close(); } catch {} },
  };
}

// a temporary directory for fixtures and exported workbooks; never inside the repository
export function scratchDir(prefix = 'sfcbsp-') {
  const d = mkdtempSync(join(tmpdir(), prefix));
  return { dir: d, rm: () => { try { rmSync(d, { recursive: true, force: true }); } catch {} } };
}

// a tiny check collector shared by every test file: chk(name, ok, detail) and done() which prints and exits
export function checks(title) {
  const fails = [];
  let n = 0;
  return {
    chk(name, ok, detail = '') { n++; if (!ok) fails.push(name + (detail ? ' — ' + detail : '')); return !!ok; },
    eq(name, got, want) {
      const a = JSON.stringify(got), b = JSON.stringify(want);
      return this.chk(name, a === b, 'got ' + (a && a.length > 300 ? a.slice(0, 300) + '…' : a) + ', want ' + (b && b.length > 300 ? b.slice(0, 300) + '…' : b));
    },
    done() {
      if (fails.length) {
        console.log(title + ': ' + fails.length + ' FAILING CHECK(S) of ' + n);
        fails.slice(0, 200).forEach(f => console.log('  ✗ ' + f));
        process.exitCode = 1;
      } else {
        console.log(title + ': ALL ' + n + ' CHECKS PASSED');
      }
    },
  };
}
