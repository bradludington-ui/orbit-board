// mkext.mjs -- assembles verify/u2ext.mjs: the builder's u2probe.mjs up to (not including) its scenario loop, verbatim, + u2ext.tail.txt.
import { readFileSync, writeFileSync } from 'node:fs';
const [probe, tail, out] = process.argv.slice(2);
const src = readFileSync(probe, 'utf8');
const cut = src.indexOf("for (const [k, fn] of [['folder.race'");
if (cut < 0) throw new Error('loop not found');
const hdr = '// u2ext.mjs -- VERIFIER extension: lines 2..' + (src.slice(0, cut).split('\n').length - 1) + ' are the builder u2probe.mjs (blob 363beee7) verbatim; scenarios E1-E3 are new.\n';
writeFileSync(out, hdr + src.slice(0, cut) + readFileSync(tail, 'utf8'));
