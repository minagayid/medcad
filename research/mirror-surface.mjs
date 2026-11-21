import {readFile,writeFile,stat} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {proposeMirror} from './surface-proposal.mjs';
// Source is a cropped, explicitly millimetre-normalized JSON surface.
try {
  const [jobPath,outPath]=process.argv.slice(2);
  if(!jobPath||!outPath)throw Error('Usage: node research/mirror-surface.mjs job.json proposal.json');
  const job=JSON.parse(await readFile(jobPath,'utf8'));
  const surfacePath=resolve(dirname(jobPath),job.surfaceFile);
  if((await stat(surfacePath)).size>25*1024*1024)throw Error('Surface exceeds 25 MiB research limit');
  const bytes=await readFile(surfacePath);
  if(bytes.byteLength>25*1024*1024)throw Error('Surface exceeds 25 MiB research limit');
  const result=await proposeMirror({...job,bytes});
  await writeFile(outPath,JSON.stringify(result,null,2),{flag:'wx'});
  console.log('Research-only mirrored surface saved. Clinical fit and manufacturing remain unassessed.');
}catch(e){console.error(e.message);process.exitCode=1;}
