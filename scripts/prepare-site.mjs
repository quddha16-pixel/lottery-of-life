import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import path from 'node:path';

const [channel, commit] = process.argv.slice(2);
if (!['production', 'preview'].includes(channel) || !/^[0-9a-f]{40}$/.test(commit ?? '')) {
  throw new Error('Usage: node scripts/prepare-site.mjs production|preview FULL_COMMIT_SHA');
}
const dist = path.resolve('dist');
const index = path.join(dist, 'index.html');
const original = await readFile(index, 'utf8');
if (original.includes('data-development-preview')) throw new Error('Build again before preparing another artifact.');
await writeFile(path.join(dist, 'build-info.json'), JSON.stringify({
  channel, commit, base: '/lottery-of-life/', builtAt: new Date().toISOString(),
}, null, 2) + '\n');

// Production game HTML/JS/CSS is unchanged. Only a metadata file is added.
if (channel === 'production') process.exit(0);

// The preview is a different HTTPS origin. This ribbon changes only built HTML,
// never the game source, browser storage key, save schema or simulation.
const ribbon = `<aside data-development-preview role="note" style="padding:9px 16px;background:#35311e;color:#fff0bd;font:13px/1.4 system-ui,sans-serif;text-align:center">Development preview · ${commit.slice(0, 7)} · Not a production release</aside>`;
const marked = original.replace(/<title>(.*?)<\/title>/s, '<title>DEVELOPMENT PREVIEW — $1</title>')
  .replace(/<body([^>]*)>/, `<body$1>${ribbon}`);
if (marked === original || !marked.includes(ribbon)) throw new Error('Could not label preview HTML.');
await writeFile(index, marked);

// Retain Vite's production repository base path on the separate preview host.
const site = path.resolve('.preview-site');
await rm(site, { recursive: true, force: true });
await mkdir(site, { recursive: true });
await cp(dist, path.join(site, 'lottery-of-life'), { recursive: true });
await writeFile(path.join(site, 'index.html'), '<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=/lottery-of-life/"><title>Lottery of Life development preview</title><a href="/lottery-of-life/">Open development preview</a>\n');
await writeFile(path.join(site, '_headers'), '/*\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: no-store\n');
console.log(`Prepared ${channel} artifact for ${commit}`);
