import test from 'node:test';
import assert from 'node:assert/strict';
import {planeFromLandmarks,inspectProposalMesh,mirrorSurface,proposeMirror} from './surface-proposal.mjs';
const mesh={vertices:[[1,0,0],[2,0,0],[1,1,0],[1,0,1]],triangles:[[0,2,1],[0,1,3],[1,2,3],[2,0,3]]};
const plane={origin:[0,0,0],normal:[1,0,0]};
const volume=m=>m.triangles.reduce((s,[i,j,k])=>{const a=m.vertices[i],b=m.vertices[j],c=m.vertices[k];return s+(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;},0);
test('mirror changes correct coordinate and preserves outward winding',()=>{const before=JSON.stringify(mesh);const p=mirrorSurface(mesh,plane);assert.deepEqual(p.mesh.vertices,mesh.vertices.map(([x,y,z])=>[-x,y,z]));assert.ok(Math.abs(volume(p.mesh)-volume(mesh))<1e-10);assert.equal(p.metrics.boundaryEdges,0);assert.equal(p.metrics.inconsistentSharedEdges,0);assert.equal(JSON.stringify(mesh),before);});
test('reflection twice returns original surface',()=>{const p=mirrorSurface(mesh,plane);assert.deepEqual(mirrorSurface(p.mesh,plane,{sourceSide:'negative'}).mesh,mesh);});
test('offset and non-unit normals are supported',()=>{const p=mirrorSurface(mesh,{origin:[3,0,0],normal:[7,0,0]},{sourceSide:'negative'});assert.deepEqual(p.mesh.vertices,mesh.vertices.map(([x,y,z])=>[6-x,y,z]));});
test('plane landmarks and non-axis reflection',()=>{assert.deepEqual(planeFromLandmarks([[0,0,0],[0,1,0],[0,0,1]]),plane);const p=mirrorSurface(mesh,{origin:[0,0,0],normal:[1,1,0]});p.mesh.vertices.forEach(([x,y,z],i)=>{assert.ok(Math.abs(x+mesh.vertices[i][1])<1e-12);assert.ok(Math.abs(y+mesh.vertices[i][0])<1e-12);assert.equal(z,mesh.vertices[i][2]);});assert.throws(()=>planeFromLandmarks([[0,0,0],[1,0,0],[2,0,0]]),/collinear/);});
test('whole bilateral scan, invalid plane or degenerate source rejected',()=>{assert.throws(()=>mirrorSurface({...mesh,vertices:[[-1,0,0],...mesh.vertices.slice(1)]},plane),/one side/);assert.throws(()=>mirrorSurface(mesh,{...plane,normal:[0,0,0]}),/nonzero/);assert.throws(()=>mirrorSurface(mesh,plane,{sourceSide:'left'}),/side/);assert.throws(()=>mirrorSurface({...mesh,triangles:[[0,1,1]]},plane),/indices/);});
test('edge screen detects a flipped face but is not solid validation',()=>{const reversed=structuredClone(mesh);reversed.triangles[0].reverse();assert.equal(inspectProposalMesh(reversed).inconsistentSharedEdges,3);assert.equal(inspectProposalMesh(mesh).selfIntersection,'not-assessed');});
test('manifest derives hash from exact source and keeps clinical/machine gates closed',async()=>{const bytes=new TextEncoder().encode(JSON.stringify(mesh));const p=await proposeMirror({bytes,units:'mm',plane,region:'ear'});assert.match(p.manifest.sourceSha256,/^[a-f0-9]{64}$/);assert.equal(p.manifest.manufacturingReady,false);assert.equal(p.manifest.clinicalFit,'not-assessed');await assert.rejects(proposeMirror({bytes,units:'cm',plane,region:'ear'}),/millimetres/);await assert.rejects(proposeMirror({bytes,units:'mm',plane,region:'organ'}),/region/);});
test('CLI generates a proposal and refuses overwrite',async()=>{
  const {mkdtemp,writeFile,readFile,rm}=await import('node:fs/promises');
  const {tmpdir}=await import('node:os');const {join}=await import('node:path');
  const {spawnSync}=await import('node:child_process');const dir=await mkdtemp(join(tmpdir(),'medcad-mirror-'));
  try{
    await writeFile(join(dir,'surface.json'),JSON.stringify(mesh));
    await writeFile(join(dir,'job.json'),JSON.stringify({surfaceFile:'surface.json',units:'mm',plane,region:'ear'}));
    const args=[new URL('./mirror-surface.mjs',import.meta.url).pathname,join(dir,'job.json'),join(dir,'out.json')];
    const run=spawnSync(process.execPath,args,{encoding:'utf8'});assert.equal(run.status,0,run.stderr);
    const output=JSON.parse(await readFile(join(dir,'out.json'),'utf8'));assert.equal(output.manifest.manufacturingReady,false);
    assert.equal(spawnSync(process.execPath,args,{encoding:'utf8'}).status,1);
  }finally{await rm(dir,{recursive:true,force:true});}
});
