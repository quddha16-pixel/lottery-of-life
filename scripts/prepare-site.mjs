import { readFile, writeFile, mkdir, cp, rm, readdir } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const [channel, commit] = process.argv.slice(2);
if (!['production', 'preview'].includes(channel) || !/^[0-9a-f]{40}$/.test(commit ?? '')) {
  throw new Error('Usage: node scripts/prepare-site.mjs production|preview FULL_COMMIT_SHA');
}
const toolingCommit = process.env.PREVIEW_TOOLING_SHA;
if (toolingCommit && !/^[0-9a-f]{40}$/.test(toolingCommit)) throw new Error('Invalid preview tooling SHA.');
const dist = path.resolve('dist');
const index = path.join(dist, 'index.html');
const original = await readFile(index, 'utf8');
if (original.includes('data-development-preview')) throw new Error('Build again before preparing another artifact.');
await writeFile(path.join(dist, 'build-info.json'), JSON.stringify({
  channel, commit, ...(toolingCommit ? {toolingCommit} : {}), base: '/lottery-of-life/', builtAt: new Date().toISOString(),
}, null, 2) + '\n');

// Production game HTML/JS/CSS is unchanged. Only a metadata file is added.
if (channel === 'production') process.exit(0);

// The preview is a different HTTPS origin. This ribbon changes only built HTML,
// never the game source, browser storage key, save schema or simulation.
const ribbon = `<aside data-development-preview role="note" aria-label="Development preview · ${commit} · Not a production release" style="padding:5px 8px;background:#35311e;color:#fff0bd;font:11px/1.4 system-ui,sans-serif;text-align:center"><strong>DEVELOPMENT</strong> · Not a production release<code data-source-commit style="display:block;font:11px/1.4 ui-monospace,SFMono-Regular,monospace;overflow-wrap:anywhere;user-select:all">${commit}</code></aside><style data-preview-layout>@media(max-width:760px){.wildlife-game .adventure-life .wildlife-scene{aspect-ratio:2.9}}</style>`;
const marked = original.replace(/<title>(.*?)<\/title>/s, '<title>DEVELOPMENT PREVIEW — $1</title>')
  .replace(/<body([^>]*)>/, `<body$1>${ribbon}`);
if (marked === original || !marked.includes(ribbon)) throw new Error('Could not label preview HTML.');
await writeFile(index, marked);

// Retain Vite's production repository base path on the separate preview host.
const site = path.resolve('.preview-site');
await rm(site, { recursive: true, force: true });
await mkdir(site, { recursive: true });
await cp(dist, path.join(site, 'lottery-of-life'), { recursive: true });
// Bind the visible identity to the exact static bytes. Verification compares
// this manifest with the trusted artifact, not just the live server's claim.
const app = path.join(site, 'lottery-of-life');
const files = {};
async function inventory(dir, prefix = '') {
  for (const entry of await readdir(dir, {withFileTypes:true})) {
    const relative = prefix + entry.name;
    if (entry.isDirectory()) await inventory(path.join(dir, entry.name), relative + '/');
    else files[relative] = createHash('sha256').update(await readFile(path.join(dir, entry.name))).digest('hex');
  }
}
await inventory(app);
await writeFile(path.join(app,'preview-manifest.json'),JSON.stringify({commit,files},null,2)+'\n');
await writeFile(path.join(site, 'index.html'), '<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=/lottery-of-life/"><title>Lottery of Life development preview</title><a href="/lottery-of-life/">Open development preview</a>\n');
await writeFile(path.join(site, '_headers'), '/*\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: no-store\n');
console.log(`Prepared ${channel} artifact for ${commit}`);
