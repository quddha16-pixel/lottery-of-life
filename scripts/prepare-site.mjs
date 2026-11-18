import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const [channel,commit]=process.argv.slice(2);
if(channel!=='production'||!/^[0-9a-f]{40}$/.test(commit??''))throw Error('Usage: node scripts/prepare-site.mjs production FULL_MAIN_SHA');
const dist=path.resolve('dist'),html=await readFile(path.join(dist,'index.html'),'utf8');
if(html.includes('data-development-preview'))throw Error('A development preview cannot be published as production. Build the approved production source again.');
await writeFile(path.join(dist,'build-info.json'),JSON.stringify({channel,commit,base:'/lottery-of-life/',builtAt:new Date().toISOString()},null,2)+'\n');
