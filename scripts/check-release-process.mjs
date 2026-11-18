import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const script=fileURLToPath(new URL('./prepare-site.mjs',import.meta.url)),sha='79ca0bd1c0a19dbdc8b3d5f894943bf7425b2dc8';
async function fixture(t){const dir=await mkdtemp(path.join(tmpdir(),'lottery-production-'));t.after(()=>rm(dir,{recursive:true,force:true}));await mkdir(path.join(dir,'dist/assets'),{recursive:true});await writeFile(path.join(dir,'dist/index.html'),'<html><body>Original game</body></html>');await writeFile(path.join(dir,'dist/assets/game.js'),'original bytes');return dir;}
const run=(dir,channel='production',commit=sha)=>spawnSync(process.execPath,[script,channel,commit],{cwd:dir,encoding:'utf8'});
test('production identification leaves all game HTML/assets unchanged',async t=>{const dir=await fixture(t),result=run(dir);assert.equal(result.status,0,result.stderr);assert.equal(await readFile(path.join(dir,'dist/index.html'),'utf8'),'<html><body>Original game</body></html>');assert.equal(await readFile(path.join(dir,'dist/assets/game.js'),'utf8'),'original bytes');const meta=JSON.parse(await readFile(path.join(dir,'dist/build-info.json'),'utf8'));assert.equal(meta.commit,sha);assert.equal(meta.channel,'production');});
test('invalid identities, cancelled preview mode and development artifacts cannot prepare a production release',async t=>{const dir=await fixture(t);for(const [channel,id] of [['production','79ca0bd'],['preview',sha],['release',sha]])assert.notEqual(run(dir,channel,id).status,0);await writeFile(path.join(dir,'dist/index.html'),'<body><aside data-development-preview>DEVELOPMENT</aside></body>');assert.notEqual(run(dir).status,0);await assert.rejects(access(path.join(dir,'dist/build-info.json')));});
