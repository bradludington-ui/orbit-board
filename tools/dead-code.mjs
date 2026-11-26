// DEAD CODE, FOUND BY A CALL GRAPH, NOT BY COUNTING NAMES (v2.24, item 163).
//
// Items 104 and 153 found that counting references finds nothing: a dead function is named by other dead functions and by
// comments, so every name is "used". This builds the graph instead, from a real parse (acorn, already installed with jsdom):
//
//   nodes   every top-level function, const, let, var and class of the board's scripts
//   edges   a name A reaches B when B's name appears in A's body -- as an identifier, OR as a word inside any string or template
//           A holds (that is how the board writes handlers into markup: '<button onclick="toggleFc()">', mRun(toggleEx) in a
//           string, setTimeout strings, window[fn] / typeof lookups by name)
//   roots   the scripts' top-level code (every statement that is not a declaration, and every initializer that is not a function
//           -- both run when the page loads), and every inline handler and word in the markup outside the scripts
//
// What is not reached from a root is dead -- unless a test or tool reaches it (a word in tools/**/*.mjs outside comments, but
// never mutate.mjs, whose find strings only name code): those are listed as KEPT FOR THE TESTS, with what they keep alive.
//
// Also reported:
//   undeclared  a name called (a CallExpression callee, or `name(` in a handler string) that nothing declares anywhere and the
//               browser does not provide -- must be zero
//   css         style rules in the page's <style> blocks whose every selector needs a class or id that appears nowhere else in
//               the page (markup, scripts, strings). A class built by concatenation counts if its words appear. Rules with SOME
//               dead selectors are listed apart, never removed by this report.
//   storage     keys written with lsSet / localStorage.setItem as a literal and never read as a literal (lsGet, getItem, a
//               key list); dynamic keys are not judged
//
//   node tools/dead-code.mjs [--board FILE] [--json]          (npm run deadcode)
// Exit 0 always: it reports; a person removes. A removal is verified by running it again.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const acorn = require('acorn');
const walk = require('acorn-walk');
const { JSDOM } = require('jsdom');

const ROOT = new URL('..', import.meta.url).pathname;
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const FILE = resolve(opt('--board') || join(ROOT, 'prioritization-board-grid.html'));
const JSON_OUT = args.includes('--json');
const html = readFileSync(FILE, 'utf8');

// ---- the page, parsed (nothing runs) -----------------------------------------------------------------------------------------
const dom = new JSDOM(html);                       // scripts are not run without runScripts
const doc = dom.window.document;
const scripts = [...doc.querySelectorAll('script')].filter(s => !s.type || /javascript|module/i.test(s.type)).map(s => s.textContent);
const styles = [...doc.querySelectorAll('style')].map(s => ({ id: s.id || '(no id)', text: s.textContent }));
// the markup without scripts and styles: handlers and words written there are roots
const markup = (() => { const d = new JSDOM(html).window.document; d.querySelectorAll('script,style').forEach(e => e.remove());
  // a <template>'s content is not in the tree: take its HTML too
  return d.documentElement.outerHTML + [...d.querySelectorAll('template')].map(t => t.innerHTML).join('\n'); })();

const WORD = /[A-Za-z_$][\w$]*/g;
const wordsOf = s => (String(s).match(WORD) || []);

// ---- declarations and edges --------------------------------------------------------------------------------------------------
const decl = new Map();      // name -> {kind, start, end, script}
const edges = new Map();     // name -> Set(names)
const rootRefs = new Set();  // names reached by code that runs at load
const allDeclared = new Set(); // every name declared anywhere (params, locals included): for the undeclared report
const calls = [];            // {name, where}
const add = (m, k, v) => { if (!m.has(k)) m.set(k, new Set()); m.get(k).add(v); };

function namesIn(node) {
  // every identifier and every word in a string or template inside node
  const out = new Set();
  walk.full(node, n => {
    if (n.type === 'Identifier') out.add(n.name);
    else if (n.type === 'Literal' && typeof n.value === 'string') wordsOf(n.value).forEach(w => out.add(w));
    else if (n.type === 'TemplateElement') wordsOf(n.value.cooked ?? n.value.raw).forEach(w => out.add(w));
  });
  return out;
}
function declaredIn(node) {
  walk.full(node, n => {
    if (n.type === 'VariableDeclarator') patNames(n.id).forEach(x => allDeclared.add(x));
    else if ((n.type === 'FunctionDeclaration' || n.type === 'FunctionExpression' || n.type === 'ArrowFunctionExpression')) {
      if (n.id) allDeclared.add(n.id.name); n.params.forEach(p => patNames(p).forEach(x => allDeclared.add(x))); }
    else if (n.type === 'CatchClause' && n.param) patNames(n.param).forEach(x => allDeclared.add(x));
    else if (n.type === 'ClassDeclaration' && n.id) allDeclared.add(n.id.name);
    else if (n.type === 'CallExpression' && n.callee.type === 'Identifier') calls.push(n.callee.name);
  });
}
function patNames(p) {
  const out = [];
  (function go(x) { if (!x) return;
    if (x.type === 'Identifier') out.push(x.name);
    else if (x.type === 'ObjectPattern') x.properties.forEach(pr => go(pr.type === 'RestElement' ? pr.argument : pr.value));
    else if (x.type === 'ArrayPattern') x.elements.forEach(go);
    else if (x.type === 'RestElement') go(x.argument);
    else if (x.type === 'AssignmentPattern') go(x.left);
  })(p);
  return out;
}
const isFn = n => n && (n.type === 'FunctionExpression' || n.type === 'ArrowFunctionExpression');
scripts.forEach((src, si) => {
  let ast;
  try { ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script', allowReturnOutsideFunction: true, allowAwaitOutsideFunction: true }); }
  catch (e) { console.error(`script ${si}: could not parse -- ${e.message}`); process.exitCode = 2; return; }
  declaredIn(ast);
  for (const st of ast.body) {
    if (st.type === 'FunctionDeclaration') { decl.set(st.id.name, { kind: 'function', start: st.start, end: st.end, si });
      namesIn(st.body).forEach(n => add(edges, st.id.name, n)); st.params.forEach(p => namesIn(p).forEach(n => add(edges, st.id.name, n))); }
    else if (st.type === 'ClassDeclaration') { decl.set(st.id.name, { kind: 'class', start: st.start, end: st.end, si });
      namesIn(st).forEach(n => add(edges, st.id.name, n)); }
    else if (st.type === 'VariableDeclaration') {
      for (const d of st.declarations) {
        const ns = patNames(d.id);
        ns.forEach(n => decl.set(n, { kind: st.kind, start: st.start, end: st.end, si, multi: st.declarations.length > 1 || ns.length > 1 }));
        if (!d.init) continue;
        if (isFn(d.init) && ns.length === 1) namesIn(d.init).forEach(n => add(edges, ns[0], n));
        else namesIn(d.init).forEach(n => rootRefs.add(n));   // an initializer that is not a function runs at load
      }
    }
    else namesIn(st).forEach(n => rootRefs.add(n));        // top-level code runs at load
  }
});
// a top-level `name = function(){…}` reassignment (render's wrapper) is top-level code: already a root by the rule above

// ---- roots from the markup ---------------------------------------------------------------------------------------------------
const markupWords = new Set(wordsOf(markup));
markupWords.forEach(w => rootRefs.add(w));

// ---- reach ---------------------------------------------------------------------------------------------------------------------
function reach(from) {
  const seen = new Set(), stack = [...from].filter(n => decl.has(n));
  while (stack.length) { const n = stack.pop(); if (seen.has(n)) continue; seen.add(n);
    (edges.get(n) || []).forEach(m => { if (decl.has(m) && !seen.has(m)) stack.push(m); }); }
  return seen;
}
const live = reach(rootRefs);
const unreached = [...decl.keys()].filter(n => !live.has(n));

// ---- the tests' entry points -------------------------------------------------------------------------------------------------
function filesUnder(d) { let out = []; for (const f of readdirSync(d)) { const p = join(d, f); const s = statSync(p);
  if (s.isDirectory()) { if (!/node_modules|vendor/.test(f)) out = out.concat(filesUnder(p)); }
  else if (/\.mjs$/.test(f) && !/^_/.test(f) && f !== 'mutate.mjs' && f !== 'dead-code.mjs') out.push(p); } return out; }
const stripComments = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
const testWords = new Set();
filesUnder(join(ROOT, 'tools')).forEach(f => wordsOf(stripComments(readFileSync(f, 'utf8'))).forEach(w => testWords.add(w)));
const testRoots = unreached.filter(n => testWords.has(n));
const keptByTests = reach(testRoots);
const dead = unreached.filter(n => !keptByTests.has(n));
const keptOnly = unreached.filter(n => keptByTests.has(n));

// ---- undeclared calls --------------------------------------------------------------------------------------------------------
const globals = new Set([...Object.getOwnPropertyNames(dom.window), ...Object.getOwnPropertyNames(globalThis),
  ...Object.getOwnPropertyNames(Object.getPrototypeOf(dom.window) || {}), 'require', 'structuredClone', 'queueMicrotask', 'showOpenFilePicker',
  'showSaveFilePicker', 'showDirectoryPicker', 'DecompressionStream', 'CompressionStream', 'Blob', 'Response', 'TextEncoder', 'TextDecoder']);
const handlerCalls = new Set();
// a bare call written into a markup handler (on*="…name(…)"); a method call (event.preventDefault()) and a keyword (if (…)) are not
const KEYWORDS = new Set(['if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'typeof', 'new', 'do', 'void', 'delete', 'in', 'of']);
(markup.match(/\bon[a-z]+="[^"]*"/g) || []).forEach(h => { for (const m of h.matchAll(/(^|[^.\w$])([A-Za-z_$][\w$]*)\s*(?=\()/g)) if (!KEYWORDS.has(m[2])) handlerCalls.add(m[2]); });
const undeclared = [...new Set([...calls, ...handlerCalls])].filter(n => !allDeclared.has(n) && !globals.has(n) && !decl.has(n));

// ---- CSS -----------------------------------------------------------------------------------------------------------------------
const nonCss = markup + '\n' + scripts.join('\n');
const tokens = new Set(String(nonCss).match(/[A-Za-z_][\w-]*/g) || []);
// a class built by concatenation ('ui-e'+w, 'band-b'+i, 'row t-'+lane): the last word of a string fragment that ends at a join is a
// PREFIX a class can grow from; a class counts as present when one of those prefixes starts it and the rest is word characters
const prefixes = new Set();
for (const m of String(scripts.join('\n')).matchAll(/(['"`])((?:\\.|(?!\1)[^\\\n])*)\1\s*\+/g)) {
  const last = (m[2].match(/[A-Za-z_][\w-]*$/) || [])[0]; if (last && last.length >= 2) prefixes.add(last); }
for (const m of String(scripts.join('\n')).matchAll(/([A-Za-z_][\w-]*)\$\{/g)) if (m[1].length >= 2) prefixes.add(m[1]);   // `ui-e${w}`
const present = n => tokens.has(n) || [...prefixes].some(p => n.length > p.length && n.startsWith(p) && /^[\w-]+$/.test(n.slice(p.length)));
function cssRules(text) {
  // flat rules {selector, body, at} from a stylesheet, @media / @supports blocks descended into; @keyframes / @font-face skipped
  const out = []; const t = text.replace(/\/\*[\s\S]*?\*\//g, '');
  (function go(s, at) { let i = 0;
    while (i < s.length) { const ob = s.indexOf('{', i); if (ob < 0) break;
      const head = s.slice(i, ob).trim(); let depth = 1, j = ob + 1;
      while (j < s.length && depth) { if (s[j] === '{') depth++; else if (s[j] === '}') depth--; j++; }
      const body = s.slice(ob + 1, j - 1);
      if (/^@(media|supports|layer)/.test(head)) go(body, head);
      else if (!/^@/.test(head) && head) out.push({ sel: head, body, at });
      i = j; } })(t, '');
  return out;
}
const needs = sel => { const req = []; sel.replace(/\[[^\]]*\]/g, '').replace(/::?[\w-]+(\([^)]*\))?/g, m => /^:(is|where|not|has)\(/.test(m) ? m : '')
  .replace(/([.#])([A-Za-z_][\w-]*)/g, (m, k, n) => { req.push(n); return m; }); return req; };
const cssDead = [], cssPartial = [];
styles.forEach(st => cssRules(st.text).forEach(r => {
  const alts = r.sel.split(/,(?![^(]*\))/).map(a => a.trim()).filter(Boolean);
  const deadAlts = alts.filter(a => needs(a).some(n => !present(n)));
  if (deadAlts.length === alts.length) cssDead.push({ style: st.id, sel: r.sel, at: r.at, missing: [...new Set(alts.flatMap(a => needs(a).filter(n => !present(n))))] });
  else if (deadAlts.length) cssPartial.push({ style: st.id, sel: r.sel, dead: deadAlts });
}));

// ---- storage keys --------------------------------------------------------------------------------------------------------------
const allSrc = scripts.join('\n');
const written = new Set(), read = new Set();
for (const m of allSrc.matchAll(/(?:lsSet|localStorage\.setItem|sessionStorage\.setItem)\(\s*'([^'+]+)'/g)) written.add(m[1]);
for (const m of allSrc.matchAll(/'([A-Za-z][\w.\-]*)'/g)) {
  // a literal read anywhere other than as the first argument of a write
  const before = allSrc.slice(Math.max(0, m.index - 40), m.index);
  if (!/(?:lsSet|localStorage\.setItem|sessionStorage\.setItem)\(\s*$/.test(before)) read.add(m[1]);
}
const storageDead = [...written].filter(k => !read.has(k));

// ---- report --------------------------------------------------------------------------------------------------------------------
const bytesOf = n => { const d = decl.get(n); return d ? d.end - d.start : 0; };
const rep = { board: FILE, scripts: scripts.length, declared: decl.size, live: live.size,
  dead: dead.map(n => ({ name: n, kind: decl.get(n).kind, bytes: bytesOf(n), shared: !!decl.get(n).multi })).sort((a, b) => a.name.localeCompare(b.name)),
  keptForTests: keptOnly.sort(), testEntryPoints: testRoots.sort(), undeclared: undeclared.sort(),
  cssDead, cssPartial, storageWrittenNeverRead: storageDead.sort() };
if (JSON_OUT) { console.log(JSON.stringify(rep, null, 1)); }
else {
  console.log(`DEAD CODE -- ${FILE}`);
  console.log(`  ${rep.scripts} scripts, ${rep.declared} top-level names, ${rep.live} reached from the page`);
  console.log(`\n  UNREACHABLE (${rep.dead.length}, ${rep.dead.reduce((a, d) => a + d.bytes, 0)} bytes):`);
  rep.dead.forEach(d => console.log(`    ${d.kind.padEnd(8)} ${d.name}  (${d.bytes} B${d.shared ? ', in a shared declaration' : ''})`));
  console.log(`\n  KEPT FOR THE TESTS (${keptOnly.length}; entry points: ${testRoots.join(', ') || 'none'}):`);
  keptOnly.forEach(n => console.log(`    ${n}`));
  console.log(`\n  CALLED, NOT DECLARED (${undeclared.length}): ${undeclared.join(', ') || 'none'}`);
  console.log(`\n  CSS RULES MATCHING NOTHING (${cssDead.length}):`);
  cssDead.forEach(c => console.log(`    [${c.style}]${c.at ? ' ' + c.at : ''} ${c.sel.slice(0, 140)}   -- missing ${c.missing.join(', ')}`));
  console.log(`  CSS RULES WITH SOME DEAD SELECTORS, kept (${cssPartial.length})`);
  cssPartial.slice(0, 40).forEach(c => console.log(`    [${c.style}] ${c.dead.join(' | ').slice(0, 140)}`));
  console.log(`\n  STORAGE KEYS WRITTEN, NEVER READ AS A LITERAL (${storageDead.length}): ${storageDead.join(', ') || 'none'}`);
}
