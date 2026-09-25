import assert from 'node:assert/strict';
import { inspectSurfaceMesh, parseSurfaceFile } from '../mesh-import.mjs';

const asciiTetra = `solid tetra
facet normal 0 0 -1
 outer loop
  vertex 0 0 0
  vertex 0 1 0
  vertex 1 0 0
 endloop
endfacet
facet normal 0 -1 0
 outer loop
  vertex 0 0 0
  vertex 1 0 0
  vertex 0 0 1
 endloop
endfacet
facet normal -1 0 0
 outer loop
  vertex 0 0 0
  vertex 0 0 1
  vertex 0 1 0
 endloop
endfacet
facet normal 1 1 1
 outer loop
  vertex 1 0 0
  vertex 0 1 0
  vertex 0 0 1
 endloop
endfacet
endsolid tetra`;
const bytes = (text) => new TextEncoder().encode(text);

const tetra = parseSurfaceFile({ name: 'tetra.stl', bytes: bytes(asciiTetra), units: 'cm' });
assert.equal(tetra.format, 'STL');
assert.equal(tetra.scaleToMm, 10);
assert.deepEqual(tetra.analysis.bounds.min, [0, 0, 0]);
assert.deepEqual(tetra.analysis.bounds.max, [10, 10, 10]);
assert.deepEqual(tetra.analysis.bounds.spans, [10, 10, 10]);
assert.equal(tetra.analysis.vertexCount, 4, 'STL duplicate coordinates are indexed for topology checks');
assert.equal(tetra.analysis.triangleCount, 4);
assert.equal(tetra.analysis.closed, true);
assert.equal(tetra.analysis.boundaryEdges, 0);

const contradictoryWinding = inspectSurfaceMesh({
  vertices: [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]],
  // A tetrahedron with one face reversed: each undirected edge still has two incident faces.
  triangles: [[0, 2, 1], [0, 1, 3], [0, 3, 2], [1, 2, 3]],
});
assert.equal(contradictoryWinding.boundaryEdges, 0);
assert.equal(contradictoryWinding.nonManifoldEdges, 0);
assert.equal(contradictoryWinding.closed, true, 'edge incidence passes despite contradictory face winding');

const obj = parseSurfaceFile({ name: 'tetra.obj', bytes: bytes(`v 0 0 0\nv 1 0 0\nv 0 1 0\nv 0 0 1\nf -4 -2 -1\nf -4 -3 -2\nf -4 -1 -3\nf -3 -1 -2`), units: 'in' });
assert.equal(obj.format, 'OBJ');
assert.equal(obj.scaleToMm, 25.4);
assert.equal(obj.analysis.bounds.max[0], 25.4);
assert.equal(obj.analysis.closed, true, 'OBJ negative indices resolve against prior vertices');
assert.equal(obj.mesh.triangles.length, 4);

const polygon = parseSurfaceFile({ name: 'quad.obj', bytes: bytes('v 0 0 0\nv 1 0 0\nv 1 1 0\nv 0 1 0\nf 1 2 3 4'), units: 'mm' });
assert.equal(polygon.mesh.triangles.length, 2, 'OBJ polygons are fan triangulated');
assert.equal(polygon.analysis.boundaryEdges, 4);

const binary = new Uint8Array(84 + 50);
new DataView(binary.buffer).setUint32(80, 1, true);
const binaryView = new DataView(binary.buffer);
for (const [offset, point] of [[96, [0, 0, 0]], [108, [2, 0, 0]], [120, [0, 3, 0]]]) point.forEach((value, index) => binaryView.setFloat32(offset + index * 4, value, true));
const binaryResult = parseSurfaceFile({ name: 'open.stl', bytes: binary, units: 'mm' });
assert.equal(binaryResult.format, 'STL');
assert.equal(binaryResult.analysis.boundaryEdges, 3);
assert.equal(binaryResult.analysis.closed, false);

assert.throws(() => parseSurfaceFile({ name: 'scan.dcm', bytes: bytes('not parsed') }), /Only STL and OBJ/);
assert.throws(() => parseSurfaceFile({ name: 'tetra.obj', bytes: bytes('v NaN 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3') }), /non-finite/);
assert.throws(() => parseSurfaceFile({ name: 'tetra.obj', bytes: bytes('v 0 0 0\nv 1 0 0\nv 2 0 0\nf 1 2 3') }), /degenerate/);
assert.throws(() => parseSurfaceFile({ name: 'bad.obj', bytes: bytes('v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 4') }), /not defined/);
assert.throws(() => parseSurfaceFile({ name: 'tetra.obj', bytes: bytes('v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3'), units: 'unknown' }), /explicit source units/);
assert.throws(() => parseSurfaceFile({ name: 'broken.stl', bytes: new Uint8Array(84) }), /must contain 1/);

const nonManifold = inspectSurfaceMesh({
  vertices: [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1]],
  triangles: [[0, 1, 2], [1, 0, 3], [0, 1, 4]],
});
assert.equal(nonManifold.nonManifoldEdges, 1, 'three faces on one indexed edge are reported');
assert.equal(nonManifold.closed, false);

console.log('mesh-import tests passed: STL/OBJ parsing, unit scaling, bounds, index/degenerate and edge-incidence-only screens');
