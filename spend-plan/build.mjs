#!/usr/bin/env node
// Builds the SFCB Spend Plan dashboard: one self-contained HTML file, sfcb-spend-plan.html, from spend-plan/src.
//
//   node spend-plan/build.mjs            write spend-plan/sfcb-spend-plan.html
//   node spend-plan/build.mjs --check    exit 1 if the committed file is not exactly what the sources build
//
// The page is src/shell.html with two markers filled in: /*@CSS@*/ takes src/style.css, and /*@JS@*/ takes every
// src/NN-name.js in file-name order, each under a banner naming its file. Nothing else is changed, so the built file is
// the sources, byte for byte, and a reviewer can read either.
//
// assemble({modules}) is what the tests use: it builds the page in memory, never on disk, so two builders testing at
// once never read a half-written file. `modules` (e.g. ['util','xlsx-read','import','engine']) keeps only those
// modules, so a module still being written by someone else cannot break a test that does not need it.
import { readFileSync, writeFileSync, readdirSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, 'src');
export const OUT = join(HERE, 'sfcb-spend-plan.html');

export function moduleFiles() {
  return readdirSync(SRC).filter(f => /^\d\d-[a-z0-9-]+\.js$/.test(f)).sort();
}

export function assemble({ modules = null } = {}) {
  const shell = readFileSync(join(SRC, 'shell.html'), 'utf8');
  const css = readFileSync(join(SRC, 'style.css'), 'utf8');
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
    return '// ===== ' + f + ' =====\n' + code.replace(/\s*$/, '\n');
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
      console.error('spend-plan/sfcb-spend-plan.html is not what spend-plan/src builds. Run: node spend-plan/build.mjs');
      process.exit(1);
    }
    console.log('spend-plan/sfcb-spend-plan.html is current (' + html.length.toLocaleString() + ' characters)');
  } else {
    const tmp = OUT + '.tmp';
    writeFileSync(tmp, html);
    renameSync(tmp, OUT);
    console.log('wrote spend-plan/sfcb-spend-plan.html (' + html.length.toLocaleString() + ' characters)');
  }
}
