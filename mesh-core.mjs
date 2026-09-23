export function addVertex(vertices, x, y, z) { vertices.push([x, y, z]); return vertices.length - 1; }
export function addQuad(triangles, a, b, c, d, reverse = false) { if (reverse) triangles.push([a, c, b], [a, d, c]); else triangles.push([a, b, c], [a, c, d]); }

function makeSocketMesh(length, thickness, radius) {
  const vertices = [], triangles = [], segments = 28, rings = 18, outerRings = [], innerRings = [];
  for (let i = 0; i <= rings; i += 1) { const t = i / rings, y = (t - .5) * length, blend = Math.max(.88, Math.min(1.12, 1 + (radius - 8) / 80)), taper = (.78 + .25 * Math.sin(t * Math.PI)) * blend, rx = length * .21 * taper, rz = length * .17 * taper, innerRx = Math.max(4, rx - thickness * 1.8), innerRz = Math.max(4, rz - thickness * 1.8), outer = [], inner = []; for (let j = 0; j < segments; j += 1) { const a = j / segments * Math.PI * 2; outer.push(addVertex(vertices, Math.cos(a) * rx, y, Math.sin(a) * rz)); inner.push(addVertex(vertices, Math.cos(a) * innerRx, y, Math.sin(a) * innerRz)); } outerRings.push(outer); innerRings.push(inner); }
  for (let i = 0; i < rings; i += 1) for (let j = 0; j < segments; j += 1) { const n = (j + 1) % segments; addQuad(triangles, outerRings[i][j], outerRings[i][n], outerRings[i + 1][n], outerRings[i + 1][j]); addQuad(triangles, innerRings[i][j], innerRings[i + 1][j], innerRings[i + 1][n], innerRings[i][n]); }
  for (let j = 0; j < segments; j += 1) { const n = (j + 1) % segments; addQuad(triangles, outerRings[0][j], innerRings[0][j], innerRings[0][n], outerRings[0][n]); addQuad(triangles, outerRings[rings][j], outerRings[rings][n], innerRings[rings][n], innerRings[rings][j]); }
  return { vertices, triangles };
}

function makeEllipsoidMesh(length, thickness, radius) {
  const vertices = [], triangles = [], seg = 32, rings = 16, rx = length * .47, ry = length * .38, rz = Math.max(length * .12, thickness * 2.2, radius * 2.2), top = addVertex(vertices, 0, ry, 0), bottom = addVertex(vertices, 0, -ry, 0), ringIds = [];
  for (let i = 1; i < rings; i += 1) { const theta = i / rings * Math.PI, row = []; for (let j = 0; j < seg; j += 1) { const a = j / seg * Math.PI * 2; row.push(addVertex(vertices, rx * Math.sin(theta) * Math.cos(a), ry * Math.cos(theta), rz * Math.sin(theta) * Math.sin(a))); } ringIds.push(row); }
  for (let j = 0; j < seg; j += 1) { const n = (j + 1) % seg; triangles.push([top, ringIds[0][n], ringIds[0][j]]); }
  for (let i = 0; i < ringIds.length - 1; i += 1) for (let j = 0; j < seg; j += 1) { const n = (j + 1) % seg; addQuad(triangles, ringIds[i][j], ringIds[i + 1][j], ringIds[i + 1][n], ringIds[i][n], true); }
  for (let j = 0; j < seg; j += 1) { const n = (j + 1) % seg; triangles.push([ringIds[ringIds.length - 1][j], ringIds[ringIds.length - 1][n], bottom]); }
  return { vertices, triangles };
}

function makeCapsuleMesh(length, radius) {
  const vertices = [], triangles = [], seg = 24, rings = 20, r = Math.max(3, Math.min(length * .2, radius * 2.2)), top = addVertex(vertices, 0, length * .5, 0), bottom = addVertex(vertices, 0, -length * .5, 0), ids = [];
  for (let i = 1; i < rings; i += 1) { const t = i / rings, y = (t - .5) * length, radius = r * Math.sin(Math.PI * t) ** .72, row = []; for (let j = 0; j < seg; j += 1) { const a = j / seg * Math.PI * 2; row.push(addVertex(vertices, Math.cos(a) * radius, y, Math.sin(a) * radius * .82)); } ids.push(row); }
  for (let j = 0; j < seg; j += 1) { const n = (j + 1) % seg; triangles.push([top, ids[0][n], ids[0][j]]); }
  for (let i = 0; i < ids.length - 1; i += 1) for (let j = 0; j < seg; j += 1) { const n = (j + 1) % seg; addQuad(triangles, ids[i][j], ids[i][n], ids[i + 1][n], ids[i + 1][j]); }
  for (let j = 0; j < seg; j += 1) { const n = (j + 1) % seg; triangles.push([ids[ids.length - 1][j], ids[ids.length - 1][n], bottom]); }
  return { vertices, triangles };
}

function makeTorusMesh(length, thickness, radius) {
  const vertices = [], triangles = [], uSeg = 36, vSeg = 14, major = length * .28, minor = Math.max(thickness * 1.8, radius), ids = [];
  for (let i = 0; i < uSeg; i += 1) { const u = i / uSeg * Math.PI * 2, row = []; for (let j = 0; j < vSeg; j += 1) { const v = j / vSeg * Math.PI * 2, radial = major + minor * Math.cos(v); row.push(addVertex(vertices, radial * Math.cos(u), radial * Math.sin(u) * .72, minor * Math.sin(v))); } ids.push(row); }
  for (let i = 0; i < uSeg; i += 1) for (let j = 0; j < vSeg; j += 1) { const ni = (i + 1) % uSeg, nj = (j + 1) % vSeg; addQuad(triangles, ids[i][j], ids[ni][j], ids[ni][nj], ids[i][nj], true); }
  return { vertices, triangles };
}

function makeBoxMesh(length, radius) { const blend = Math.max(.85, Math.min(1.2, 1 + radius / 120)), w = length * .42 * blend, h = length * .5, d = length * .32 * blend, vertices = [[-w, -h, -d], [w, -h, -d], [w, -h, d], [-w, -h, d], [-w, h, -d], [w, h, -d], [w, h, d], [-w, h, d]], triangles = []; [[0, 1, 2, 3], [4, 7, 6, 5], [0, 4, 5, 1], [3, 2, 6, 7], [1, 5, 6, 2], [0, 3, 7, 4]].forEach((face) => addQuad(triangles, ...face)); return { vertices, triangles }; }

export function buildMesh(partId, length, thickness, radius = 6) { if (partId === 'socket') return makeSocketMesh(length, thickness, radius); if (partId === 'cranial') return makeEllipsoidMesh(length, thickness, radius); if (partId === 'finger') return makeCapsuleMesh(length, radius); if (partId === 'orbit') return makeTorusMesh(length, thickness, radius); return makeBoxMesh(length, radius); }
export function edgeCounts(mesh) { const counts = new Map(); for (const [a, b, c] of mesh.triangles) for (const [u, v] of [[a, b], [b, c], [c, a]]) { const key = u < v ? `${u}:${v}` : `${v}:${u}`; counts.set(key, (counts.get(key) || 0) + 1); } return counts; }
export function orientedTriangles(mesh) { const volume = mesh.triangles.reduce((sum, [ia, ib, ic]) => { const a = mesh.vertices[ia], b = mesh.vertices[ib], c = mesh.vertices[ic]; return sum + (a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6; }, 0); return volume >= 0 ? mesh.triangles : mesh.triangles.map(([a, b, c]) => [a, c, b]); }
export function validateMesh(mesh, length, range, thickness, minimumWall) { const counts = edgeCounts(mesh), closed = [...counts.values()].every((count) => count === 2), finite = mesh.vertices.every((vertex) => vertex.every(Number.isFinite)); return { closed, finite, inRange: length >= range[0] && length <= range[1], wall: thickness >= minimumWall }; }
