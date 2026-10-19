// normcmp.mjs -- reads two probe outputs and lists every leaf that differs after timestamps, clock text and
// timestamp-dependent hashes are rendered symbolically. Runs no board code. usage: node normcmp.mjs a.json b.json [skipKeysRegex]
import { readFileSync } from 'node:fs';
const [a, b, skip] = process.argv.slice(2);
const A = JSON.parse(readFileSync(a, 'utf8')), B = JSON.parse(readFileSync(b, 'utf8'));
const sk = skip ? new RegExp(skip) : null;
const norm = v => typeof v === 'string'
  ? v.replace(/\b1[78]\d{11}\b/g, '<T>').replace(/\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}:\d{2}\s?[AP]M/g, '<when>')
     .replace(/\b\d{1,2}:\d{2}\s?[AP]M\b/g, '<hm>').replace(/\b[0-9a-f]{40}\b/g, '<sha1>').replace(/\b(just now|\d+ (seconds?|minutes?) ago|a moment ago)\b/g, '<age>')
  : (typeof v === 'number' && v > 1.7e12 && v < 1.9e12) ? '<T>' : v;
const flat = (o, p = '', out = {}) => { if (o && typeof o === 'object') { for (const k of Object.keys(o)) flat(o[k], p ? p + '.' + k : k, out); if (!Object.keys(o).length) out[p] = Array.isArray(o) ? '[]' : '{}'; } else out[p] = norm(o); return out; };
const fa = flat(A), fb = flat(B);
const keys = [...new Set([...Object.keys(fa), ...Object.keys(fb)])].filter(k => !(sk && sk.test(k))).sort();
let n = 0;
for (const k of keys) if (JSON.stringify(fa[k]) !== JSON.stringify(fb[k])) { n++; if (n <= 60) console.log(k, '\n   A:', JSON.stringify(fa[k]), '\n   B:', JSON.stringify(fb[k])); }
console.log(`${n} differing leaves of ${keys.length}`);
