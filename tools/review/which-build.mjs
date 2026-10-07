// WHICH RELEASE WROTE THIS BOARD FILE? Works on a blank release and on a saved board alike.
//
//   node tools/review/which-build.mjs [board.html] [--builds <builds.json>] [--json]
//
//   With no file it reads the repository's prioritization-board-grid.html. It computes the file's code
//   fingerprint (see fingerprint.mjs for what that covers and ignores) and looks it up in
//   review/builds.json. The first line printed is the release name, or exactly
//   "UNKNOWN BUILD: not a reviewed release". Exit status: 0 known, 1 unknown, 2 could not read.
//   Node built-ins only. It reads the file and writes nothing.
//
// WHAT A MATCH MEANS. The program in the file is the program of that release: every script, every inline
// handler and every attribute. It says nothing about the data in the file. Nor does the BUILD stamp the file
// prints: that is one line of text anyone can edit, so this tool reports it but never trusts it.
//
// WHAT NO MATCH MEANS. The file holds a program that is not in review/builds.json: an older or newer
// release not yet added, a copy someone edited, or a save from a browser that wrote into the page (see the
// LIMITS in fingerprint.mjs). When the scripts alone match a release, the tool says so, to show where to
// look. The answer is still UNKNOWN BUILD until the difference is explained.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BOARD, ROOT, SCHEME, argPath, describeBoard } from './lib.mjs';

const USAGE = 'usage: node tools/review/which-build.mjs [board.html] [--builds <builds.json>] [--json]';
const UNKNOWN = 'UNKNOWN BUILD: not a reviewed release';
const args = process.argv.slice(2);
if (args.includes('-h') || args.includes('--help')) { console.log(USAGE); process.exit(0); }
const json = args.includes('--json');
let buildsPath = join(ROOT, 'review', 'builds.json'), file = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--json') continue;
  if (args[i] === '--builds') { buildsPath = args[++i]; if (!buildsPath) { console.error(USAGE); process.exit(2); } buildsPath = argPath(buildsPath); continue; }
  if (args[i].startsWith('-') || file) { console.error(USAGE); process.exit(2); }
  file = argPath(args[i]);
}
file = file || BOARD;

let reg, d;
try {
  reg = JSON.parse(readFileSync(buildsPath, 'utf8'));
} catch (e) { console.error(`cannot read ${buildsPath}: ${e.message}`); process.exit(2); }
if (reg.scheme !== SCHEME) {
  console.error(`${buildsPath} holds fingerprints of scheme "${reg.scheme}", and this kit computes "${SCHEME}". Recompute every entry first.`);
  process.exit(2);
}
try { d = describeBoard(file); } catch (e) { console.error(`cannot read ${file}: ${e.message}`); process.exit(2); }

const builds = Array.isArray(reg.builds) ? reg.builds : [];
const hit = builds.find(b => b.code === d.code);
const scriptHit = hit ? null : builds.find(b => b.script === d.script);

// What kind of file this is, against the release it matched.
let kind = null;
if (hit) {
  if (d.sha256 === hit.fileSha256) kind = 'the release file itself, byte for byte';
  else if (d.data.populated) kind = 'a saved board of this release: the same program, with data in it';
  else kind = 'this release\'s program, not byte-identical to the release file (for example a save with no data, or a copy with Windows line endings)';
}

if (json) {
  console.log(JSON.stringify({
    file, known: !!hit, release: hit ? hit.release : null, commit: hit ? hit.commit : null, gate: hit ? hit.gate : null,
    kind, scriptsMatch: scriptHit ? scriptHit.release : null,
    code: d.code, script: d.script, sha256: d.sha256, buildStamp: d.build, data: d.data, warnings: d.warnings,
  }, null, 2));
  process.exit(hit ? 0 : 1);
}

if (hit) {
  console.log(hit.release);
  console.log(`  BUILD ${hit.build}, commit ${String(hit.commit).slice(0, 7)}, gate: ${hit.gate}`);
  console.log(`  this file is ${kind}`);
  if (d.build !== hit.build) console.log(`  WARNING: the file's BUILD stamp says "${d.build}"; the release says "${hit.build}". Check builds.json.`);
} else {
  console.log(UNKNOWN);
  console.log(`  the file's BUILD stamp says "${d.build || '(none)'}" -- a line of text, not proof of anything`);
  if (scriptHit) console.log(`  its scripts match ${scriptHit.release} (commit ${String(scriptHit.commit).slice(0, 7)}), but its markup does not. Compare the two with fingerprint.mjs --canon.`);
}
console.log(`  file             ${file}`);
console.log(`  code fingerprint ${d.code}`);
console.log(`  SHA-256 (file)   ${d.sha256}`);
console.log(`  data             pubState ${d.data.pubState}; pubMode ${d.data.pubMode}; APPNS ${d.data.appns}`);
for (const w of d.warnings) console.log(`  WARNING: ${w}`);
process.exit(hit ? 0 : 1);
