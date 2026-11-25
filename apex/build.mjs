#!/usr/bin/env node
// Builds APEX (until November 2026 the SFCB Spend Plan dashboard): one self-contained HTML file, apex.html, from apex/src.
//
//   node apex/build.mjs            write apex/apex.html
//   node apex/build.mjs --check    exit 1 if the committed file is not exactly what the sources build
//
// The page is src/shell.html with two markers filled in: /*@CSS@*/ takes src/style.css, and /*@JS@*/ takes every
// src/NN-name.js in file-name order, each under a banner naming its file.
//
// THE NOTES STAY IN THE SOURCES (Brad, 25 Nov 2026: "Go with A and B", of "leave the comments out of the built apex.html
// but keep them in the source"). The comments, about a quarter of the sources, explain why the code is as it is; nobody
// opening APEX reads them, and they made the one file on the share a quarter larger. The built page has every comment
// taken out (stripJs, stripCss) and nothing else changed: the code is the sources' token for token, each file under its
// banner, and the sources in apex/src are where the code is read and changed. stripJs reads the code token by token
// (strings, template literals with their ${…}, regular expressions), so a // inside an address or a pattern is never
// taken for a note; test/build-strip.test.mjs holds it to the cases that would fool a simpler reading.
//
// assemble({modules}) is what the tests use: it builds the page in memory, never on disk, so two builders testing at
// once never read a half-written file. `modules` (e.g. ['util','xlsx-read','import','engine']) keeps only those
// modules, so a module still being written by someone else cannot break a test that does not need it.
import { readFileSync, writeFileSync, readdirSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, 'src');
export const OUT = join(HERE, 'apex.html');

// every comment out of a script, and the blank lines that leaves; nothing else changes. A comment between two tokens on
// one line becomes a space, so `a/*x*/b` stays two tokens.
export function stripJs(src) {
  let out = '', i = 0, prev = '';                // prev: the last significant token's kind, to tell a regex from a division
  const n = src.length, tmpl = [];               // tmpl: for each open template's ${, the brace depth it was opened at
  let depth = 0;
  const regexAfter = t => t === '' || t === 'punct' || t === 'kw';
  const KW = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else', 'yield', 'await']);
  const readTemplate = () => {                   // from just after a backquote, or after the } closing a ${, to its end
    while (i < n) {
      const c = src[i];
      if (c === '\\') { out += src.slice(i, i + 2); i += 2; continue; }
      if (c === '`') { out += c; i++; prev = 'val'; return; }
      if (c === '$' && src[i + 1] === '{') { out += '${'; i += 2; tmpl.push(depth); depth++; prev = 'punct'; return; }
      out += c; i++;
    }
  };
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && (d === '/' || d === '*')) {
      // a comment is always outside a string or template here, so what came before it on its line is code: spaces before it
      // go, and a line it had to itself goes whole, newline and all
      if (d === '/') { while (i < n && src[i] !== '\n') i++; }
      else { const e = src.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; }
      const bol = out.lastIndexOf('\n') + 1, before = out.slice(bol);
      if (/^[ \t]*$/.test(before) && (i >= n || src[i] === '\n' || (d === '*' && /^[ \t]*\n/.test(src.slice(i))))) {
        out = out.slice(0, bol);
        while (i < n && (src[i] === ' ' || src[i] === '\t')) i++;
        if (src[i] === '\n') i++;
      } else if (d === '/') out = out.replace(/[ \t]+$/, '');
      else out += ' ';
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1; while (j < n && src[j] !== c) { if (src[j] === '\\') j++; j++; }
      out += src.slice(i, j + 1); i = j + 1; prev = 'val'; continue;
    }
    if (c === '`') { out += c; i++; readTemplate(); continue; }
    if (c === '/' && regexAfter(prev)) {         // a regular expression: to its closing /, past any class [...], then its flags
      let j = i + 1, cls = false;
      while (j < n) { const x = src[j]; if (x === '\\') { j += 2; continue; } if (x === '[') cls = true; else if (x === ']') cls = false; else if (x === '/' && !cls) break; else if (x === '\n') break; j++; }
      j++; while (j < n && /[a-z]/i.test(src[j])) j++;
      out += src.slice(i, j); i = j; prev = 'val'; continue;
    }
    if (/[A-Za-z_$\d]/.test(c)) {
      let j = i; while (j < n && /[\w$.]/.test(src[j]) && !(src[j] === '.' && !/\d/.test(c))) j++;
      const w = src.slice(i, j); out += w; i = j; prev = KW.has(w) ? 'kw' : 'val'; continue;
    }
    if (c === '{') { depth++; out += c; i++; prev = 'punct'; continue; }
    if (c === '}') {
      if (tmpl.length && tmpl[tmpl.length - 1] === depth - 1) { tmpl.pop(); depth--; out += c; i++; readTemplate(); continue; }
      depth--; out += c; i++; prev = 'punct'; continue;
    }
    if (c === ')' || c === ']') { out += c; i++; prev = 'val'; continue; }
    if (/\s/.test(c)) { out += c; i++; continue; }
    // ++ and -- after a value (i++) leave a value behind, so a / after them divides; before one (++i) they are an operator
    if ((c === '+' || c === '-') && d === c) { out += c + c; i += 2; prev = prev === 'val' ? 'val' : 'punct'; continue; }
    out += c; i++; prev = 'punct';
  }
  return out;
}
// every /* */ comment out of the style sheet (it has no strings holding one), and the blank lines that leaves
export function stripCss(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map(l => l.replace(/[ \t]+$/, '')).filter(l => l !== '').join('\n');
}

export function moduleFiles() {
  return readdirSync(SRC).filter(f => /^\d\d-[a-z0-9-]+\.js$/.test(f)).sort();
}

export function assemble({ modules = null, keepComments = false } = {}) {
  const shell = readFileSync(join(SRC, 'shell.html'), 'utf8');
  const css0 = readFileSync(join(SRC, 'style.css'), 'utf8'), css = keepComments ? css0 : stripCss(css0);
  let files = moduleFiles();
  if (modules) {
    const want = new Set(modules);
    files = files.filter(f => want.has(f.replace(/^\d\d-/, '').replace(/\.js$/, '')));
    const got = new Set(files.map(f => f.replace(/^\d\d-/, '').replace(/\.js$/, '')));
    const missing = modules.filter(m => !got.has(m));
    if (missing.length) throw new Error('assemble: no module named ' + missing.join(', '));
  }
  const js = files.map(f => {
    const code = readFileSync(join(SRC, f), 'utf8');
    // a literal closing script tag inside the program would end the page's script early and drop everything after it
    if (/<\/script/i.test(code)) throw new Error(f + ' contains a closing script tag; write it as <\\/script in a string');
    return '// ===== ' + f + ' =====\n' + (keepComments ? code : stripJs(code)).replace(/\s*$/, '\n');
  }).join('\n');
  if (!shell.includes('/*@CSS@*/') || !shell.includes('/*@JS@*/')) throw new Error('shell.html has lost a /*@CSS@*/ or /*@JS@*/ marker');
  // a function replacement, so a "$&" or "$1" in the sources is never read as a replacement pattern
  return shell.replace('/*@CSS@*/', () => css.replace(/\s*$/, '')).replace('/*@JS@*/', () => js.replace(/\s*$/, ''));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const html = assemble();
  if (process.argv.includes('--check')) {
    let have = '';
    try { have = readFileSync(OUT, 'utf8'); } catch {}
    if (have !== html) {
      console.error('apex/apex.html is not what apex/src builds. Run: node apex/build.mjs');
      process.exit(1);
    }
    console.log('apex/apex.html is current (' + html.length.toLocaleString() + ' characters)');
  } else {
    const tmp = OUT + '.tmp';
    writeFileSync(tmp, html);
    renameSync(tmp, OUT);
    console.log('wrote apex/apex.html (' + html.length.toLocaleString() + ' characters)');
  }
}
