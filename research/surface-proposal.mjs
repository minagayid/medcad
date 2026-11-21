// Non-clinical surface proposals only. No socket, implant or load calculation.
const need=(ok,msg)=>{if(!ok)throw Error(msg);};
const point=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=a=>Math.hypot(...a);
export function planeFromLandmarks(points) {
  need(Array.isArray(points)&&points.length===3&&points.every(point),'Three finite plane landmarks required');
  const a=sub(points[1],points[0]),b=sub(points[2],points[0]),normal=cross(a,b);
  need(norm(a)>1e-8&&norm(b)>1e-8&&norm(normal)/(norm(a)*norm(b))>1e-3,'Plane landmarks are degenerate or nearly collinear');
  return {origin:[...points[0]],normal:normal.map(v=>v/norm(normal))};
}
export function inspectProposalMesh(mesh) {
  need(mesh&&Array.isArray(mesh.vertices)&&mesh.vertices.length>=3&&mesh.vertices.length<=60000,'Expected 3..60000 vertices');
  need(mesh.vertices.every(v=>point(v)&&v.every(x=>Math.abs(x)<=1e6)),'Invalid mesh coordinates');
  need(Array.isArray(mesh.triangles)&&mesh.triangles.length>0&&mesh.triangles.length<=20000,'Expected 1..20000 triangles');
  const edges=new Map();
  for(const f of mesh.triangles) {
    need(Array.isArray(f)&&f.length===3&&f.every(i=>Number.isInteger(i)&&i>=0&&i<mesh.vertices.length)&&new Set(f).size===3,'Invalid triangle indices');
    need(norm(cross(sub(mesh.vertices[f[1]],mesh.vertices[f[0]]),sub(mesh.vertices[f[2]],mesh.vertices[f[0]])))>1e-10,'Degenerate triangle');
    for(const [a,b] of [[f[0],f[1]],[f[1],f[2]],[f[2],f[0]]]) { const k=`${Math.min(a,b)}:${Math.max(a,b)}`; const e=edges.get(k)||{count:0,balance:0}; e.count++;e.balance+=a<b?1:-1;edges.set(k,e); }
  }
  return {boundaryEdges:[...edges.values()].filter(e=>e.count===1).length,nonManifoldEdges:[...edges.values()].filter(e=>e.count>2).length,inconsistentSharedEdges:[...edges.values()].filter(e=>e.count===2&&e.balance!==0).length,selfIntersection:'not-assessed',fit:'not-assessed'};
}
export function mirrorSurface(mesh,plane,{sourceSide='positive',planeToleranceMm=0.01}={}) {
  inspectProposalMesh(mesh);
  need(plane&&point(plane.origin)&&point(plane.normal),'Finite plane origin and normal required');
  const size=norm(plane.normal);need(size>1e-8,'Plane normal must be nonzero');
  need(['positive','negative'].includes(sourceSide),'Source side must be positive or negative');
  need(Number.isFinite(planeToleranceMm)&&planeToleranceMm>=0&&planeToleranceMm<=1,'Invalid plane tolerance');
  const n=plane.normal.map(v=>v/size), distances=mesh.vertices.map(p=>dot(sub(p,plane.origin),n));
  need(distances.every(d=>sourceSide==='positive'?d>=-planeToleranceMm:d<=planeToleranceMm),'Select or crop a source surface on one side before mirroring; whole-body scans are not automatically segmented');
  need(distances.some(d=>Math.abs(d)>planeToleranceMm),'Source surface lies entirely on the mirror plane');
  const result={vertices:mesh.vertices.map((p,i)=>p.map((v,j)=>v-2*distances[i]*n[j])),triangles:mesh.triangles.map(([a,b,c])=>[a,c,b])};
  return {mesh:result,plane:{origin:[...plane.origin],normal:n},metrics:inspectProposalMesh(result),method:'operator-plane-reflection',clinicalFit:'not-assessed'};
}
export async function proposeMirror({bytes,units,plane,region,sourceSide='positive',planeToleranceMm=0.01}) {
  need(bytes instanceof ArrayBuffer||ArrayBuffer.isView(bytes),'Source JSON bytes required');
  need(bytes.byteLength<=25*1024*1024,'Surface exceeds 25 MiB research limit');
  need(units==='mm','Convert declared source units to millimetres before proposal generation');
  need(['ear','nose','orbit','hand','leg','external-cleft-study'].includes(region),'Unsupported study region');
  const hash=await crypto.subtle.digest('SHA-256',bytes);
  const sourceSha256=Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
  const mesh=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  const result=mirrorSurface(mesh,plane,{sourceSide,planeToleranceMm});
  return {...result,manifest:{schema:'medcad.surface-proposal.v1',sourceSha256,units,region,sourceSide,planeToleranceMm,plane:result.plane,metrics:result.metrics,method:result.method,clinicalFit:'not-assessed',manufacturingReady:false,limitations:['No registration or segmentation','No attachment or tissue-interface surface','No pressure, load or biomechanical validation','Symmetry is a starting hypothesis, not a clinical fit']}};
    }
