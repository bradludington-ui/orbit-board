// The built page leaves the sources' comments out (build.mjs stripJs / stripCss; Brad, 25 Nov 2026: "Go with A and B").
// Taking a comment out must never change the code. Each case below is a piece of code a simpler reading would get wrong;
// each is run before and after and must give the same value, with its comments gone. Then the real page: built with and
// without its comments, it must run the same (the whole suite runs on the built page; here, that it opens and draws).
//
//   node apex/test/build-strip.test.mjs
import { stripJs, stripCss, assemble } from '../build.mjs';
import { loadTool, checks } from './harness.mjs';

const C = checks('build-strip');
const J = x => JSON.stringify(x);
const run = src => new Function(src)();
const CASES = [
  ['an address in a string', "// a note\nreturn 'https://example.mil/a//b' + \"//c\"; // after"],
  ['a pattern holding slashes, after return and after =', "const r = /\\/\\/x[/]y/g; // n\nreturn [r.source, (() => { return /a\\/b/.source })()];"],
  ['a division is not a pattern, and a note follows it', 'const a = 10, b = 2, c = 5; return a / b / c; // ten over two over five'],
  ['a template keeps its // and its blank line, and a note inside ${} goes', 'const x = 3;\nreturn `one // not a note\n\n${ x /* inner */ + 1 // real note\n} after`;'],
  ['a template inside a template', 'const a = 1; return `a${ `b${ a }c // still text` }d`; // gone'],
  ['a block note between two tokens leaves them apart', 'const a = 2; return typeof/* x */a;'],
  ['a note on its own lines, indented', 'function f() {\n  // one\n  /* two\n     lines */\n  return 7;\n}\nreturn f();'],
  ['an escaped quote and a backslash before a quote', "return ['it\\'s // fine', \"a\\\\\" + '//b'];"],
  ['a pattern with a class holding a slash, then flags', "return 'a/b//c'.replace(/[/]+/g, '|'); // note"],
  ['++ and -- before a division', 'let i = 4, j = 2; i++; j--; return i++ / j; // five over one'],
  ['a regex after a keyword and after an operator', "return [typeof /x/, 'ab'.split(/b/), 1 + /c/.source.length];"],
];
for (const [name, src] of CASES) {
  const out = stripJs(src);
  let a, b, err = '';
  try { a = run(src); b = run(out); } catch (e) { err = e.message; }
  const notes = /\/\/ (a note|after|n|ten|real note|gone|one|note|five)|\/\* (x|inner|two)/.test(out.replace(/`[^`]*`/g, '').replace(/'[^']*'/g, ''));
  C.chk('stripJs: ' + name + ': the same value, its notes gone', !err && J(a) === J(b) && !notes, err || J([a, b, out]));
}
C.eq('stripJs: a line a note had to itself goes whole; code keeps its own lines', stripJs('a();\n  // gone\nb(); // gone too\n/* gone */\nc();'), 'a();\nb();\nc();');
C.eq('stripCss: rules kept, notes and their lines gone', stripCss('/* head */\na{color:red} /* tail */\n\n/* x\n y */\nb{margin:0}'), 'a{color:red}\nb{margin:0}');

// the real page, with and without its notes: both open and draw, and the stripped one is the smaller by its notes
const full = assemble({ keepComments: true }), lean = assemble();
C.chk('the built page is smaller than the sources by at least a fifth', lean.length < full.length * 0.8, full.length + ' -> ' + lean.length);
C.chk('each source file still opens under its banner', ['10-util.js', '40-engine.js', '90-ui.js'].every(f => lean.includes('// ===== ' + f + ' =====')));
for (const [nm, html] of [['with its notes', full], ['without them', lean]]) {
  const t = loadTool({ html, url: 'http://localhost/apex.html' });
  for (let i = 0; i < 200 && !t.window.document.getElementById('uiMain'); i++) await new Promise(r => setTimeout(r, 5));
  C.chk('the page ' + nm + ' opens and draws, with no script error', !!t.window.document.getElementById('uiMain') && !t.errors.filter(e => !/^Not implemented/.test(String(e))).length, J(t.errors.map(String)));
  t.close();
}
C.done();
