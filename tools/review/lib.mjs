// THE REVIEW KIT'S SHARED READING OF A BOARD FILE. Imported by bundle.mjs, fingerprint.mjs,
// which-build.mjs and sinks.mjs. Node built-ins only: the kit must run where nothing is installed.
//
// Three things live here:
//   1. a small HTML tokenizer, enough to split the board into markup, styles, scripts and data islands
//      the way a browser does (a <script> ends at the first "</script", whatever its JavaScript says);
//   2. the CODE FINGERPRINT, which ties a saved board (program + data) to the release that wrote it;
//   3. a small JavaScript scanner that knows, for any position, whether it is code, a string or a
//      comment, and which named functions enclose it.
//
// None of it changes the board. Every function here reads text and returns values.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const KIT = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(KIT, '..', '..');
export const BOARD = join(ROOT, 'prioritization-board-grid.html');

export const sha256 = b => createHash('sha256').update(b).digest('hex');
// The id git gives the file's contents (what `git hash-object` prints). It names the exact blob in a commit.
export const gitBlobId = buf => createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');

export function readBoard(path) {
  const buf = readFileSync(path);
  return { buf, text: buf.toString('utf8') };
}

// A path given on the command line. Under `npm run`, the working directory is the repository, so a
// relative path is taken from the folder npm was started in (INIT_CWD), as the person typing it meant.
export function argPath(p) {
  const base = process.env.npm_lifecycle_event && process.env.INIT_CWD ? process.env.INIT_CWD : process.cwd();
  return resolve(base, p);
}

// ---- lines ---------------------------------------------------------------------------------------
// Line numbers here count the way an editor does: line 1 is the first, and a last line with no newline
// still counts.
export function lineStarts(text) {
  const a = [0];
  for (let i = text.indexOf('\n'); i >= 0; i = text.indexOf('\n', i + 1)) a.push(i + 1);
  return a;
}
export function lineOf(starts, pos) {
  let lo = 0, hi = starts.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= pos) lo = mid; else hi = mid - 1; }
  return lo + 1;
}

// ---- character references ------------------------------------------------------------------------
// The named references a board's markup could plausibly use. The v1.99 markup uses &amp; &mdash; and
// &#9656; only. A name not listed here is left as written and reported, because a browser would
// decode it and the fingerprint could then differ from a save for that reason alone.
const NAMED = {
  amp: 38, lt: 60, gt: 62, quot: 34, apos: 39, nbsp: 0xA0, iexcl: 0xA1, cent: 0xA2, pound: 0xA3,
  curren: 0xA4, yen: 0xA5, brvbar: 0xA6, sect: 0xA7, uml: 0xA8, copy: 0xA9, ordf: 0xAA, laquo: 0xAB,
  not: 0xAC, shy: 0xAD, reg: 0xAE, macr: 0xAF, deg: 0xB0, plusmn: 0xB1, sup2: 0xB2, sup3: 0xB3,
  acute: 0xB4, micro: 0xB5, para: 0xB6, middot: 0xB7, cedil: 0xB8, sup1: 0xB9, ordm: 0xBA, raquo: 0xBB,
  frac14: 0xBC, frac12: 0xBD, frac34: 0xBE, iquest: 0xBF, times: 0xD7, divide: 0xF7,
  AMP: 38, LT: 60, GT: 62, QUOT: 34, COPY: 0xA9, REG: 0xAE,
  ensp: 0x2002, emsp: 0x2003, thinsp: 0x2009, zwnj: 0x200C, zwj: 0x200D, lrm: 0x200E, rlm: 0x200F,
  ndash: 0x2013, mdash: 0x2014, lsquo: 0x2018, rsquo: 0x2019, sbquo: 0x201A, ldquo: 0x201C,
  rdquo: 0x201D, bdquo: 0x201E, dagger: 0x2020, Dagger: 0x2021, bull: 0x2022, hellip: 0x2026,
  permil: 0x2030, prime: 0x2032, Prime: 0x2033, lsaquo: 0x2039, rsaquo: 0x203A, euro: 0x20AC,
  trade: 0x2122, larr: 0x2190, uarr: 0x2191, rarr: 0x2192, darr: 0x2193, harr: 0x2194, crarr: 0x21B5,
  lArr: 0x21D0, rArr: 0x21D2, hArr: 0x21D4, minus: 0x2212, infin: 0x221E, asymp: 0x2248, ne: 0x2260,
  equiv: 0x2261, le: 0x2264, ge: 0x2265, loz: 0x25CA, starf: 0x2605, star: 0x2606, spades: 0x2660,
  clubs: 0x2663, hearts: 0x2665, diams: 0x2666, check: 0x2713, cross: 0x2717,
};
// The names a browser also decodes WITHOUT a semicolon (the historical set), among those above.
const LEGACY = ['amp', 'lt', 'gt', 'quot', 'nbsp', 'iexcl', 'cent', 'pound', 'curren', 'yen', 'brvbar',
  'sect', 'uml', 'copy', 'ordf', 'laquo', 'not', 'shy', 'reg', 'macr', 'deg', 'plusmn', 'sup2', 'sup3',
  'acute', 'micro', 'para', 'middot', 'cedil', 'sup1', 'ordm', 'raquo', 'frac14', 'frac12', 'frac34',
  'iquest', 'times', 'divide', 'AMP', 'LT', 'GT', 'QUOT', 'COPY', 'REG'].sort((a, b) => b.length - a.length);
// Numeric references in 0x80-0x9F mean the Windows-1252 character, as the HTML standard says.
const C1 = { 0x80: 0x20AC, 0x82: 0x201A, 0x83: 0x0192, 0x84: 0x201E, 0x85: 0x2026, 0x86: 0x2020,
  0x87: 0x2021, 0x88: 0x02C6, 0x89: 0x2030, 0x8A: 0x0160, 0x8B: 0x2039, 0x8C: 0x0152, 0x8E: 0x017D,
  0x91: 0x2018, 0x92: 0x2019, 0x93: 0x201C, 0x94: 0x201D, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
  0x98: 0x02DC, 0x99: 0x2122, 0x9A: 0x0161, 0x9B: 0x203A, 0x9C: 0x0153, 0x9E: 0x017E, 0x9F: 0x0178 };
const fromCp = cp => {
  if (cp === 0 || cp > 0x10FFFF || (cp >= 0xD800 && cp <= 0xDFFF)) return '\uFFFD';
  return String.fromCodePoint(C1[cp] || cp);
};
// Decode character references as a browser's parser would, for text (inAttr false) or an attribute value.
export function decodeRefs(s, inAttr, unknown) {
  if (s.indexOf('&') < 0) return s;
  return s.replace(/&(#[xX][0-9a-fA-F]+;?|#[0-9]+;?|[A-Za-z][A-Za-z0-9]*;?)/g, (m, body, at, whole) => {
    if (body[0] === '#') {
      const hex = body[1] === 'x' || body[1] === 'X';
      const cp = parseInt(body.slice(hex ? 2 : 1).replace(';', ''), hex ? 16 : 10);
      return fromCp(cp);
    }
    if (body.endsWith(';')) {
      const name = body.slice(0, -1);
      if (Object.hasOwn(NAMED, name)) return String.fromCodePoint(NAMED[name]);
      if (unknown) unknown.add('&' + body);                // left as written, and reported
      return m;
    }
    // No semicolon: the historical rule. A legacy name at the start is decoded, except in an attribute
    // value where the next character is "=" or a letter or digit.
    for (const name of LEGACY) {
      if (body.startsWith(name)) {
        const next = whole[at + 1 + name.length] || '';
        if (inAttr && /[=A-Za-z0-9]/.test(next)) return m;
        return String.fromCodePoint(NAMED[name]) + body.slice(name.length);
      }
    }
    return m;
  });
}

// ---- the HTML tokenizer ----------------------------------------------------------------------------
// Tokens: doctype, comment, start (with attributes), end, text, raw (the body of a <script>, <style> or
// other raw-text element) and rcdata (the body of a <textarea> or <title>). Every token carries its
// [start, end) offsets in the text it was given. Inside <svg> and <math> a <style>, <script> or <title>
// is an ordinary element, as in a browser.
const RAW = new Set(['script', 'style', 'xmp', 'iframe', 'noembed', 'noframes', 'noscript']);
const RCDATA = new Set(['textarea', 'title']);
const WS = /[\t\n\f\r ]/;

function parseTag(s, i, n) {
  let j = i;
  while (j < n && !/[\t\n\f\r />]/.test(s[j])) j++;
  const name = s.slice(i, j).toLowerCase();
  const attrs = [];
  let selfClosing = false;
  for (;;) {
    while (j < n && WS.test(s[j])) j++;
    if (j >= n) break;
    if (s[j] === '>') { j++; break; }
    if (s[j] === '/') { if (s[j + 1] === '>') { selfClosing = true; j += 2; break; } j++; continue; }
    const a = j; j++;
    while (j < n && !/[\t\n\f\r />=]/.test(s[j])) j++;
    const an = s.slice(a, j).toLowerCase();
    let k = j; while (k < n && WS.test(s[k])) k++;
    let raw = '', vs = -1, ve = -1;
    if (s[k] === '=') {
      j = k + 1; while (j < n && WS.test(s[j])) j++;
      if (s[j] === '"' || s[j] === "'") {
        const q = s[j]; vs = j + 1; const e = s.indexOf(q, vs); ve = e < 0 ? n : e; j = Math.min(n, ve + 1);
      } else { vs = j; while (j < n && !/[\t\n\f\r >]/.test(s[j])) j++; ve = j; }
      raw = s.slice(vs, ve);
    }
    attrs.push({ name: an, raw, vs, ve });
  }
  return { name, attrs, selfClosing, end: j };
}

export function tokenizeHtml(s) {
  const out = [], n = s.length;
  let i = 0, textStart = 0, foreign = 0;
  const flushText = upto => { if (upto > textStart) out.push({ type: 'text', start: textStart, end: upto }); };
  while (i < n) {
    const lt = s.indexOf('<', i);
    if (lt < 0) break;
    const c = s[lt + 1] || '';
    if (s.startsWith('<!--', lt)) {
      flushText(lt);
      let end, data;
      if (s.startsWith('<!-->', lt)) { end = lt + 5; data = ''; }
      else if (s.startsWith('<!--->', lt)) { end = lt + 6; data = ''; }
      else { const k = s.indexOf('-->', lt + 4); end = k < 0 ? n : k + 3; data = s.slice(lt + 4, k < 0 ? n : k); }
      out.push({ type: 'comment', start: lt, end, data });
      i = textStart = end; continue;
    }
    if (c === '!' || c === '?') {
      flushText(lt);
      const k = s.indexOf('>', lt); const end = k < 0 ? n : k + 1;
      if (/^<!doctype/i.test(s.slice(lt, lt + 9))) out.push({ type: 'doctype', start: lt, end });
      else out.push({ type: 'comment', start: lt, end, data: s.slice(lt + (c === '!' ? 2 : 1), k < 0 ? n : k), bogus: true });
      i = textStart = end; continue;
    }
    if (c === '/' && /[A-Za-z]/.test(s[lt + 2] || '')) {
      flushText(lt);
      const t = parseTag(s, lt + 2, n);
      out.push({ type: 'end', start: lt, end: t.end, name: t.name });
      if ((t.name === 'svg' || t.name === 'math') && foreign > 0) foreign--;
      i = textStart = t.end; continue;
    }
    if (c === '/' && s[lt + 2] === '>') { flushText(lt); i = textStart = lt + 3; continue; }   // "</>" is dropped
    if (/[A-Za-z]/.test(c)) {
      flushText(lt);
      const t = parseTag(s, lt + 1, n);
      const tok = { type: 'start', start: lt, end: t.end, name: t.name, attrs: t.attrs, selfClosing: t.selfClosing };
      out.push(tok);
      i = textStart = t.end;
      if ((t.name === 'svg' || t.name === 'math') && !t.selfClosing) { foreign++; continue; }
      if (!foreign && (RAW.has(t.name) || RCDATA.has(t.name))) {
        // The body runs to the first "</name" followed by a space, "/" or ">", whatever is inside it.
        const re = new RegExp('</' + t.name + '[\\t\\n\\f\\r />]', 'ig');
        re.lastIndex = i;
        const m = re.exec(s);
        const bodyEnd = m ? m.index : n;
        out.push({ type: RAW.has(t.name) ? 'raw' : 'rcdata', start: i, end: bodyEnd, name: t.name, tag: tok });
        i = textStart = bodyEnd;
      }
      continue;
    }
    i = lt + 1;                                     // a "<" that starts no tag is text
  }
  flushText(n);
  return out;
}

export const attrOf = (tok, name) => {
  const a = tok && tok.attrs && tok.attrs.find(x => x.name === name);
  return a ? decodeRefs(a.raw, true) : null;
};
// A <script> runs unless its type names something other than JavaScript (a data island).
export function isExecScript(tok) {
  const t = (attrOf(tok, 'type') || '').trim().toLowerCase();
  return t === '' || t === 'module' || /^(text|application)\/(x-)?(java|ecma)script$/.test(t) || t === 'text/jscript';
}

// The regions of a board: which offsets are CSS, executable JavaScript, a data island, or markup.
// Returns [{kind, start, end, tag}] for every style, script and data-island body, in file order.
export function regions(text) {
  const out = [];
  for (const t of tokenizeHtml(text)) {
    if (t.type !== 'raw') continue;
    if (t.name === 'style') out.push({ kind: 'css', start: t.start, end: t.end, tag: t.tag });
    else if (t.name === 'script') out.push({ kind: isExecScript(t.tag) ? 'js' : 'data', start: t.start, end: t.end, tag: t.tag, id: attrOf(t.tag, 'id') });
  }
  return out;
}

// ---- object literals: APPNS and TPL_PARTS ----------------------------------------------------------------
// The object that opens with the "{" at s[j], to its matching brace. Braces are counted outside
// double-quoted strings only, which is right for JSON (it has no other kind of string). This is how the
// board itself finds APPNS (appnsOnlyIn, board line 9849). Returns { start, end, json, value }, with end
// one past the closing brace and json true when the text parses as a plain JSON object; null when the
// braces never close before `to`.
export function objectLiteralAt(s, j, to = s.length) {
  let d = 0, inS = false, esc = false, end = -1;
  for (let k = j; k < to; k++) {
    const c = s[k];
    if (inS) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inS = false; continue; }
    if (c === '"') inS = true; else if (c === '{') d++; else if (c === '}') { d--; if (!d) { end = k + 1; break; } }
  }
  if (end < 0) return null;
  let value = null, json = false;
  try { value = JSON.parse(s.slice(j, end)); json = !!value && typeof value === 'object' && !Array.isArray(value); } catch { /* not data */ }
  return { start: j, end, json, value };
}

// `const APPNS = {...};` in the main script is a data slot: empty in a release, filled by the per-board
// builds of old, and re-written by "one appropriation out" (appnsOnlyIn, board line ~9849). Found the way
// the board finds it: the first 'const APPNS = ', then the object to its matching brace.
export function findAppns(s, from = 0, to = s.length) {
  const i = s.indexOf('const APPNS = ', from);
  if (i < 0 || i >= to) return null;
  const j = s.indexOf('{', i);
  if (j < 0 || j >= to) return null;
  return objectLiteralAt(s, j, to);
}

// What a board file holds besides the program. Used to refuse writing a populated board's text into the repo.
export function dataState(text) {
  const st = /<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/.exec(text);
  const md = /<script type="application\/json" id="pubMode">([\s\S]*?)<\/script>/.exec(text);
  const ap = findAppns(text);
  const appnsFilled = !!(ap && ap.json && Object.values(ap.value).some(p =>
    p && ((p.items && p.items.length) || (p.services && p.services.length) || (p.budget && p.budget.length))));
  const pubState = st ? st[1].trim() : null, pubMode = md ? md[1].trim() : null;
  return {
    pubState: pubState === null ? 'missing' : pubState === 'null' ? 'empty (null)' : `populated (${Buffer.byteLength(pubState)} bytes)`,
    pubMode: pubMode === null ? 'missing' : pubMode === 'null' ? 'empty (null)' : `set (${Buffer.byteLength(pubMode)} bytes)`,
    appns: !ap ? 'missing' : !ap.json ? 'not plain JSON' : appnsFilled ? 'populated' : 'empty',
    populated: (pubState !== null && pubState !== 'null') || (pubMode !== null && pubMode !== 'null') || appnsFilled || (ap && !ap.json),
  };
}
export const buildStamp = text => (/const BUILD='([^']*)'/.exec(text) || [])[1] || null;

// The file's bytes with the bodies of the two data islands emptied, found with the board's own patterns
// (the first exact '<script type="application/json" id="pubState">', as at lines 6945 and 2450). Worked on
// as latin1 so every byte outside the islands is kept as it is. This is the plain hash first proposed as
// the code fingerprint. It matches a byte-identical copy only, never a save: see fingerprint.mjs.
export function islandsEmptied(buf) {
  const s = buf.toString('latin1')
    .replace(/(<script type="application\/json" id="pubState">)[\s\S]*?(<\/script>)/, '$1$2')
    .replace(/(<script type="application\/json" id="pubMode">)[\s\S]*?(<\/script>)/, '$1$2');
  return sha256(Buffer.from(s, 'latin1'));
}

// ---- the CODE FINGERPRINT ------------------------------------------------------------------------
// What it covers, what it ignores and why are written out in full at the top of fingerprint.mjs. Keep the
// two in step: a change here is a new SCHEME name, and every entry in review/builds.json is recomputed.
//
// How it works: the file is cut into tokens as a browser would, and each token is written as one line of a
// CANONICAL FORM (S start tag, E kept end tag, T text, C comment, R raw script/style body). The form keeps
// what can change behaviour and drops what a browser re-writes when it serializes the page. The code
// fingerprint is the SHA-256 of that form; the script fingerprint is the SHA-256 of the executable scripts
// alone, as a second opinion when the markup differs.
export const SCHEME = 'orbit-code-v1';
const KEEP_END = new Set(['a', 'button', 'form', 'iframe', 'math', 'noscript', 'object', 'select', 'svg', 'template']);
const squash = s => s.replace(/[\t\n\f\r ]+/g, ' ').trim();

export function codeFingerprint(input) {
  const s = (Buffer.isBuffer(input) ? input.toString('utf8') : input).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const toks = tokenizeHtml(s);
  const lines = [], scripts = [], ignored = [], unknown = new Set(), warnings = [];
  const starts = lineStarts(s);
  let seenHtml = false, seenState = false, seenMode = false, seenAppns = false;
  for (const t of toks) {
    if (t.type === 'doctype') continue;
    if (t.type === 'comment') { if (seenHtml) lines.push('C ' + JSON.stringify(t.data)); continue; }
    if (t.type === 'end') { if (KEEP_END.has(t.name)) lines.push('E ' + t.name); continue; }
    if (t.type === 'text' || t.type === 'rcdata') {
      const v = squash(decodeRefs(s.slice(t.start, t.end), false, unknown));
      if (v) lines.push('T ' + JSON.stringify(v));
      continue;
    }
    if (t.type === 'start') {
      if (t.name === 'html') seenHtml = true;
      if (t.name === 'tbody' && t.attrs.length === 0) continue;
      const seen = new Set(), parts = [];
      for (const a of t.attrs) {
        if (seen.has(a.name)) continue;
        seen.add(a.name);
        if (t.name === 'html' && a.name === 'data-theme') { ignored.push(`data-theme on <html> (line ${lineOf(starts, t.start)})`); continue; }
        parts.push(a.name + '=' + JSON.stringify(decodeRefs(a.raw, true, unknown)));
      }
      lines.push('S ' + t.name + (parts.length ? ' ' + parts.join(' ') : ''));
      continue;
    }
    if (t.type === 'raw') {
      let body = s.slice(t.start, t.end);
      const line = lineOf(starts, t.start);
      if (t.name === 'script') {
        const type = (attrOf(t.tag, 'type') || '').trim().toLowerCase(), id = attrOf(t.tag, 'id');
        if (type === 'application/json' && id === 'pubState' && !seenState) {
          seenState = true; if (body.length) ignored.push(`pubState body, ${Buffer.byteLength(body)} bytes (line ${line})`); body = '';
        } else if (type === 'application/json' && id === 'pubMode' && !seenMode) {
          seenMode = true; if (body.length) ignored.push(`pubMode body, ${Buffer.byteLength(body)} bytes (line ${line})`); body = '';
        } else if (isExecScript(t.tag)) {
          if (!seenAppns) {
            const ap = findAppns(body);
            if (ap) {
              seenAppns = true;
              if (ap.json) {
                ignored.push(`APPNS literal, ${ap.end - ap.start} characters (line ${lineOf(starts, t.start + ap.start)})`);
                body = body.slice(0, ap.start) + '{}' + body.slice(ap.end);
              } else warnings.push('the APPNS literal is not plain JSON, so it is fingerprinted as code');
            }
          }
          if (body.indexOf('<!--') >= 0) warnings.push(`a script at line ${line} contains "<!--", which can change where a browser ends it`);
          scripts.push(body);
        }
      }
      lines.push('R ' + t.name + ' ' + JSON.stringify(body));
    }
  }
  if (unknown.size) warnings.push('character references this tool does not know were left as written: ' + [...unknown].slice(0, 8).join(' '));
  const canon = lines.join('\n');
  const scriptCanon = scripts.map((b, k) => `--- script ${k + 1}\n${b}`).join('\n');
  return {
    scheme: SCHEME,
    code: sha256(SCHEME + '\n' + canon),
    script: sha256(SCHEME + ' scripts\n' + scriptCanon),
    scripts: scripts.length,
    tokens: lines.length,
    ignored, warnings, canon,
  };
}

// Everything the kit says about one board file, in one object: what fingerprint.mjs prints and what
// which-build.mjs looks up.
export function describeBoard(path) {
  const { buf, text } = readBoard(path);
  const fp = codeFingerprint(buf);
  const d = dataState(text);
  return {
    file: path, bytes: buf.length,
    sha256: sha256(buf), gitBlob: gitBlobId(buf),
    build: buildStamp(text),
    data: { pubState: d.pubState, pubMode: d.pubMode, appns: d.appns, populated: !!d.populated },
    scheme: fp.scheme, code: fp.code, script: fp.script, islandsEmptied: islandsEmptied(buf),
    ignored: fp.ignored, warnings: fp.warnings, canon: fp.canon,
  };
}

// ---- the JavaScript scanner --------------------------------------------------------------------------
// Walks JavaScript source once and records: comments, string/template/regex literals (as intervals), and
// every function body with its name. Names come from the forms the board uses: function name(){},
// name = function(){}, name = (…) => {}, name: function(){}, and method shorthand name(){}. An anonymous
// callback is recorded with no name. Regex literals are told from division by the token before the "/".
// Good enough to say which function a line sits in; it is not a parser and does not judge the code.
const KW_BEFORE_REGEX = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw',
  'case', 'do', 'else', 'yield', 'await']);
const CONTROL = new Set(['if', 'for', 'while', 'switch', 'catch', 'with', 'return', 'typeof', 'function']);
const OPS = ['>>>=', '...', '===', '!==', '**=', '<<=', '>>=', '>>>', '&&=', '||=', '??=', '=>', '==', '!=', '<=', '>=',
  '&&', '||', '??', '?.', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '**', '<<', '>>'];
const ID0 = /[A-Za-z_$\u0080-\uFFFF]/, IDN = /[A-Za-z0-9_$\u0080-\uFFFF]/;

export function scanJs(s, a = 0, b = s.length) {
  const comments = [], literals = [], fns = [], toks = [], parens = [], braces = [];
  let i = a;
  const push = (t, v, pos) => toks.push({ t, v, pos });
  const nameFromAssign = h => {
    const q = toks[h];
    if (!q || q.t !== 'p' || !['=', ':', '||=', '??='].includes(q.v)) return null;
    const t = toks[h - 1];
    if (!t) return null;
    if (t.t === 's') return t.v;
    if (t.t !== 'id') return null;
    let name = t.v, k = h - 2;
    while (toks[k] && (toks[k].v === '.' || toks[k].v === '?.') && toks[k - 1] && toks[k - 1].t === 'id') { name = toks[k - 1].v + '.' + name; k -= 2; }
    return name;
  };
  const fnAt = () => {
    const p = toks[toks.length - 1];
    if (!p || p.t !== 'p') return null;
    if (p.v === '=>') {
      const q = toks[toks.length - 2];
      let head;
      if (q && q.t === 'p' && q.v === ')') head = q.open; else if (q && q.t === 'id') head = toks.length - 2; else return { name: null };
      let h = head - 1; if (toks[h] && toks[h].t === 'id' && toks[h].v === 'async') h--;
      return { name: nameFromAssign(h) };
    }
    if (p.v === ')' && p.open != null) {
      let h = p.open - 1; const q = toks[h];
      if (!q) return null;
      if (q.t === 'p' && q.v === '*') h--;
      const r = toks[h];
      if (r && r.t === 'id' && r.v === 'function') { let g = h - 1; if (toks[g] && toks[g].v === 'async') g--; return { name: nameFromAssign(g) }; }
      if (r && r.t === 'id') {
        if (CONTROL.has(r.v)) return null;
        const before = toks[h - 1];
        if (before && before.t === 'id' && before.v === 'function') return { name: r.v };
        if (before && before.t === 'p' && before.v === '*' && toks[h - 2] && toks[h - 2].v === 'function') return { name: r.v };
        // name(…) { — only a method definition has this shape in valid JavaScript.
        return { name: r.v, method: true };
      }
    }
    return null;
  };
  const regexOk = () => {
    const p = toks[toks.length - 1];
    if (!p) return true;
    if (p.t === 'n' || p.t === 's' || p.t === 'r' || p.t === 'tpl') return false;
    if (p.t === 'id') return KW_BEFORE_REGEX.has(p.v);
    if (p.v === ')') return !!p.kwParen;
    if (p.v === ']' || p.v === '++' || p.v === '--') return false;
    return true;
  };
  // Template literal text, from i (just after "`" or a "}" that closed "${"), to the closing "`" or a "${".
  const templateChunk = () => {
    const st = i;
    while (i < b) {
      const c = s[i];
      if (c === '\\') { i += 2; continue; }
      if (c === '`') { literals.push([st, i + 1, 'template']); i++; push('tpl', '', st); return; }
      if (c === '$' && s[i + 1] === '{') { literals.push([st, i, 'template']); braces.push({ pos: i, tpl: true }); i += 2; push('p', '${', i - 2); return; }
      i++;
    }
    literals.push([st, b, 'template']);
  };
  while (i < b) {
    const c = s[i];
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f' || c === '\v' || c === '\u00A0' || c === '\uFEFF' || c === '\u2028' || c === '\u2029') { i++; continue; }
    if (c === '/' && s[i + 1] === '/') { let e = s.indexOf('\n', i); if (e < 0 || e > b) e = b; comments.push([i, e]); i = e; continue; }
    if (c === '/' && s[i + 1] === '*') { let e = s.indexOf('*/', i + 2); e = e < 0 ? b : e + 2; comments.push([i, e]); i = e; continue; }
    if (c === '"' || c === "'") {
      const st = i; i++;
      while (i < b && s[i] !== c && s[i] !== '\n') { if (s[i] === '\\') i++; i++; }
      i++;
      literals.push([st, i, 'string']);
      push('s', i - st < 200 ? s.slice(st + 1, i - 1) : '', st);
      continue;
    }
    if (c === '`') { i++; templateChunk(); continue; }
    if (c === '/' && regexOk()) {
      const st = i; i++; let inClass = false;
      while (i < b) {
        const d = s[i];
        if (d === '\\') { i += 2; continue; }
        if (d === '\n') break;
        if (inClass) { if (d === ']') inClass = false; }
        else if (d === '[') inClass = true;
        else if (d === '/') { i++; break; }
        i++;
      }
      while (i < b && /[a-z]/i.test(s[i])) i++;
      literals.push([st, i, 'regex']); push('r', '', st);
      continue;
    }
    if (ID0.test(c)) { const st = i; i++; while (i < b && IDN.test(s[i])) i++; push('id', s.slice(st, i), st); continue; }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(s[i + 1] || ''))) { const st = i; i++; while (i < b && /[0-9A-Za-z_.]/.test(s[i])) i++; push('n', '', st); continue; }
    if (c === '(') { parens.push(toks.length); const prev = toks[toks.length - 1]; push('p', '(', i); toks[toks.length - 1].kw = !!(prev && prev.t === 'id' && ['if', 'while', 'for', 'with'].includes(prev.v)); i++; continue; }
    if (c === ')') { const o = parens.pop(); push('p', ')', i); const t = toks[toks.length - 1]; t.open = o; t.kwParen = o != null && toks[o].kw; i++; continue; }
    if (c === '{') { const f = fnAt(); braces.push({ pos: i, fn: f }); push('p', '{', i); i++; continue; }
    if (c === '}') {
      const top = braces.pop();
      if (top && top.tpl) { i++; templateChunk(); continue; }
      if (top && top.fn) fns.push({ start: top.pos, end: i + 1, name: top.fn.name });
      push('p', '}', i); i++; continue;
    }
    const op = OPS.find(o => s.startsWith(o, i));
    if (op) { push('p', op, i); i += op.length; continue; }
    push('p', c, i); i++;
  }
  while (braces.length) { const top = braces.pop(); if (top && top.fn) fns.push({ start: top.pos, end: b, name: top.fn.name, unclosed: true }); }
  fns.sort((x, y) => x.start - y.start || y.end - x.end);
  return { comments, literals, fns, unbalanced: braces.length };
}

// Where a position sits: in a comment, a literal (string/template/regex) or code; and the functions around it.
const inIntervals = (iv, pos) => {
  let lo = 0, hi = iv.length - 1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (iv[m][1] <= pos) lo = m + 1; else if (iv[m][0] > pos) hi = m - 1; else return iv[m]; }
  return null;
};
export function contextAt(scan, pos) {
  const c = inIntervals(scan.comments, pos);
  const l = c ? null : inIntervals(scan.literals, pos);
  const chain = scan.fns.filter(f => f.start <= pos && pos < f.end);
  return { where: c ? 'comment' : l ? l[2] : 'code', chain };
}
