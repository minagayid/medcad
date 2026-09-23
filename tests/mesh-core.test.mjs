import assert from 'node:assert/strict';
import { buildMesh, edgeCounts, orientedTriangles, validateMesh } from '../mesh-core.mjs';

const fixtures = [
  ['socket', 420, 4.5, [280, 520]],
  ['cranial', 142, 3.2, [80, 220]],
  ['finger', 52, 2.6, [25, 80]],
  ['orbit', 76, 2.8, [35, 120]],
  ['blank', 100, 4, [40, 260]],
];

for (const [part, length, thickness, range] of fixtures) {
  const mesh = buildMesh(part, length, thickness, 6);
  assert(mesh.vertices.length > 0, `${part} has vertices`);
  assert(mesh.triangles.length > 0, `${part} has triangles`);
  assert(mesh.vertices.every((vertex) => vertex.every(Number.isFinite)), `${part} has finite vertices`);
  assert([...edgeCounts(mesh).values()].every((count) => count === 2), `${part} is a closed surface`);
  assert(validateMesh(mesh, length, range, thickness, 2).closed, `${part} validates as closed`);
  assert(orientedTriangles(mesh).every(([a, b, c]) => a !== b && b !== c && a !== c), `${part} has non-degenerate faces`);
}

for (const [part, length, thickness] of fixtures) {
  const narrow = buildMesh(part, length, thickness, 2);
  const broad = buildMesh(part, length, thickness, 14);
  assert.notDeepEqual(narrow.vertices, broad.vertices, `${part} responds to blend radius`);
}

console.log(`mesh-core smoke test passed for ${fixtures.length} design kits`);
