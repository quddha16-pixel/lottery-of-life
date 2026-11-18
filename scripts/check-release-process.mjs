import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./prepare-site.mjs', import.meta.url));
const sha = '170323f831e340c4ee52997dc716cce910070fd5';
const html = '<!doctype html><html><head><title>Lottery of Life</title><script type="module" src="/lottery-of-life/assets/game.js"></script><link rel="stylesheet" href="/lottery-of-life/assets/game.css"></head><body><div id="root"></div></body></html>';
async function fixture(t) {
  const dir = await mkdtemp(path.join(tmpdir(), 'lottery-release-'));
  t.after(() => rm(dir, {recursive: true, force: true}));
  await mkdir(path.join(dir, 'dist/assets'), {recursive: true});
  await writeFile(path.join(dir, 'dist/index.html'), html);
  await writeFile(path.join(dir, 'dist/assets/game.js'), '/* original game bytes */');
  await writeFile(path.join(dir, 'dist/assets/game.css'), '/* original style bytes */');
  return dir;
}
function run(dir, channel, commit = sha) {
  return spawnSync(process.execPath, [script, channel, commit], {cwd: dir, encoding: 'utf8'});
}

test('production identification preserves the complete original game HTML and assets', async t => {
  const dir = await fixture(t);
  const result = run(dir, 'production');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await readFile(path.join(dir, 'dist/index.html'), 'utf8'), html);
  assert.equal(await readFile(path.join(dir, 'dist/assets/game.js'), 'utf8'), '/* original game bytes */');
  assert.equal(await readFile(path.join(dir, 'dist/assets/game.css'), 'utf8'), '/* original style bytes */');
  const meta = JSON.parse(await readFile(path.join(dir, 'dist/build-info.json'), 'utf8'));
  assert.equal(meta.commit, sha);
  assert.equal(meta.channel, 'production');
  await assert.rejects(access(path.join(dir, '.preview-site')));
});

test('preview labeling and nested hosting retain repository-base asset resolution', async t => {
  const dir = await fixture(t);
  const result = run(dir, 'preview');
  assert.equal(result.status, 0, result.stderr);
  const site = path.join(dir, '.preview-site');
  const page = await readFile(path.join(site, 'lottery-of-life/index.html'), 'utf8');
  assert.match(page, /Development preview/);
  assert.match(page, /Not a production release/);
  assert.match(page, /DEVELOPMENT PREVIEW/);
  assert.ok(page.includes(`<code data-source-commit`));
  assert.ok(page.includes(`>${sha}</code>`), 'Full source SHA must be visible, not only in an aria label');
  const manifest = JSON.parse(await readFile(path.join(site,'lottery-of-life/preview-manifest.json'),'utf8'));
  assert.equal(manifest.commit,sha);
  for (const [relative,digest] of Object.entries(manifest.files)) {
    assert.equal(createHash('sha256').update(await readFile(path.join(site,'lottery-of-life',relative))).digest('hex'),digest);
  }
  assert.ok(manifest.files['index.html']);
  assert.ok(manifest.files['build-info.json']);
  assert.ok(manifest.files['assets/game.js']);
  for (const [,url] of page.matchAll(/(?:src|href)="(\/lottery-of-life\/assets\/[^"]+)"/g)) {
    assert.ok((await readFile(path.join(site, url))).length > 0, url);
  }
  assert.equal(await readFile(path.join(site, 'lottery-of-life/assets/game.js'), 'utf8'), '/* original game bytes */');
  const meta = JSON.parse(await readFile(path.join(site, 'lottery-of-life/build-info.json'), 'utf8'));
  assert.equal(meta.channel, 'preview');
  assert.equal(meta.commit, sha);
  assert.match(await readFile(path.join(site, 'index.html'), 'utf8'), /url=\/lottery-of-life\//);
  assert.match(await readFile(path.join(site, '_headers'), 'utf8'), /noindex/);
});

test('invalid identities or channels cannot write a release artifact', async t => {
  const dir = await fixture(t);
  for (const [channel, id] of [['production','170323f'], ['preview','<script>'], ['release',sha]]) {
    assert.notEqual(run(dir, channel, id).status, 0);
  }
  assert.equal(await readFile(path.join(dir, 'dist/index.html'), 'utf8'), html);
  await assert.rejects(access(path.join(dir, 'dist/build-info.json')));
});

test('a preview cannot accidentally be promoted as production without a clean rebuild', async t => {
  const dir = await fixture(t);
  assert.equal(run(dir, 'preview').status, 0);
  assert.notEqual(run(dir, 'production').status, 0);
  const info = JSON.parse(await readFile(path.join(dir, 'dist/build-info.json'), 'utf8'));
  assert.equal(info.channel, 'preview');
});

test('online verifier rejects changed JavaScript even when source metadata still claims the correct SHA', async t => {
  const dir = await fixture(t);
  assert.equal(run(dir,'preview').status,0);
  const remote=path.join(dir,'remote');
  const {cp}=await import('node:fs/promises');
  await cp(path.join(dir,'.preview-site/lottery-of-life'),remote,{recursive:true});
  const stub=path.join(dir,'stub-fetch.mjs');
  await writeFile(stub,`import {readFile} from 'node:fs/promises';import path from 'node:path';
    globalThis.fetch=async url=>{const u=new URL(url);const relative=u.pathname.replace(/^\\/lottery-of-life\\//,'');const response=new Response(await readFile(path.join(process.env.PREVIEW_TEST_ROOT,relative)));Object.defineProperty(response,'url',{value:u.href});return response;};`);
  const verifier=fileURLToPath(new URL('./verify-preview.mjs',import.meta.url));
  const manifest=path.join(dir,'.preview-site/lottery-of-life/preview-manifest.json');
  const check=()=>spawnSync(process.execPath,['--import',stub,verifier,'https://test-only.pages.dev/',sha,manifest],{encoding:'utf8',env:{...process.env,PREVIEW_TEST_ROOT:remote}});
  let result=check();assert.equal(result.status,0,result.stderr);
  await writeFile(path.join(remote,'assets/game.js'),'/* wrong deployed bytes */');
  result=check();assert.notEqual(result.status,0);
  assert.match(result.stderr,/Deployed bytes differ/);
});

test('online verifier refuses non-HTTPS and production-site URLs before any request',async t=>{
  const dir=await fixture(t);assert.equal(run(dir,'preview').status,0);
  const verifier=fileURLToPath(new URL('./verify-preview.mjs',import.meta.url));
  const manifest=path.join(dir,'.preview-site/lottery-of-life/preview-manifest.json');
  for(const url of ['http://preview.pages.dev/','https://quddha16-pixel.github.io/lottery-of-life/']){
    const result=spawnSync(process.execPath,[verifier,url,sha,manifest],{encoding:'utf8'});
    assert.notEqual(result.status,0);assert.match(result.stderr,/separate HTTPS Cloudflare Pages/);
  }
});
