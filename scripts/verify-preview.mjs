import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const [input,sha,manifestPath]=process.argv.slice(2);
if(!input||!/^[0-9a-f]{40}$/.test(sha??'')||!manifestPath)throw Error('Usage: node scripts/verify-preview.mjs HTTPS_PAGES_URL FULL_GAME_SHA TRUSTED_ARTIFACT_MANIFEST');
const base=new URL('/lottery-of-life/',input);
if(base.protocol!=='https:'||!base.hostname.endsWith('.pages.dev')||base.username||base.password)throw Error('Use the separate HTTPS Cloudflare Pages preview URL.');
const expected=JSON.parse(await readFile(manifestPath,'utf8'));
assert.equal(expected.commit,sha);
async function bytes(relative){
 if(relative.includes('..')||relative.startsWith('/')||/[?#\\]/.test(relative))throw Error('Invalid artifact path');
 const url=new URL(relative,base);url.searchParams.set('verify',sha);
 const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error(`${relative}: HTTP ${response.status}`);
 if(new URL(response.url).origin!==base.origin)throw Error('Unexpected cross-origin redirect');
 return Buffer.from(await response.arrayBuffer());
}
const info=JSON.parse((await bytes('build-info.json')).toString('utf8'));
assert.equal(info.commit,sha);assert.equal(info.channel,'preview');assert.equal(info.base,'/lottery-of-life/');
const manifest=JSON.parse((await bytes('preview-manifest.json')).toString('utf8'));
assert.deepEqual(manifest,expected);
for(const [relative,digest]of Object.entries(expected.files))assert.equal(createHash('sha256').update(await bytes(relative)).digest('hex'),digest,`Deployed bytes differ: ${relative}`);
const html=(await bytes('index.html')).toString('utf8');
assert.ok(html.includes('>DEVELOPMENT</strong>'));assert.ok(html.includes(`>${sha}</code>`));
console.log(JSON.stringify({url:base.href,commit:sha,channel:'preview',verifiedFiles:Object.keys(expected.files).length,https:true}));
console.log('Static identity verified. Actual browser navigation, actions, save/reload and Quentin’s iPhone review are separate checks.');
