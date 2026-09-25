const UNIT_TO_MM = Object.freeze({ mm: 1, cm: 10, in: 25.4 });
const MAX_BYTES = 25 * 1024 * 1024;
const MAX_VERTICES = 60_000;
const MAX_TRIANGLES = 20_000;
const MAX_COORDINATE_MM = 10_000_000;
const MAX_OBJ_LINE = 1024 * 1024;

function fail(message) { throw new Error(message); }
function countMatches(text, pattern) { let count = 0; while (pattern.exec(text)) count += 1; return count; }
function scaleVertex(vertex, factor) {
  const scaled = vertex.map((value) => value * factor);
  if (!scaled.every(Number.isFinite) || scaled.some((value) => Math.abs(value) > MAX_COORDINATE_MM)) fail('Coordinates are non-finite or exceed the safe import range.');
  return scaled.map((value) => Object.is(value, -0) ? 0 : value);
}
function addTriangle(mesh, a, b, c) {
  mesh.triangles.push([a, b, c]);
  if (mesh.triangles.length > MAX_TRIANGLES) fail(`Surface exceeds the ${MAX_TRIANGLES.toLocaleString()} triangle import limit.`);
}
function internVertex(mesh, vertex, byPosition) {
  const key = vertex.join(',');
  if (byPosition.has(key)) return byPosition.get(key);
  if (mesh.vertices.length >= MAX_VERTICES) fail(`Surface exceeds the ${MAX_VERTICES.toLocaleString()} vertex import limit.`);
  const index = mesh.vertices.push(vertex) - 1;
  byPosition.set(key, index);
  return index;
}

function asciiStl(text, factor) {
  const mesh = { vertices: [], triangles: [] }, byPosition = new Map();
  const facetPattern = /\bfacet\s+normal\b([^]*?)\bendfacet\b/gi;
  let facet, facetCount = 0;
  while ((facet = facetPattern.exec(text))) {
    facetCount += 1;
    const points = [];
    for (const line of facet[1].split(/\r?\n/)) {
      const match = line.match(/^\s*vertex\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s*$/i);
      if (!match) continue;
      const vertex = match.slice(1).map(Number);
      if (!vertex.every(Number.isFinite)) fail('STL contains a non-finite vertex.');
      points.push(scaleVertex(vertex, factor));
    }
    if (points.length !== 3) fail('Each ASCII STL facet must contain exactly three vertices.');
    addTriangle(mesh, ...points.map((vertex) => internVertex(mesh, vertex, byPosition)));
  }
  if (!facetCount) fail('ASCII STL has no facet records.');
  const starts = countMatches(text, /\bfacet\b/gi), ends = countMatches(text, /\bendfacet\b/gi);
  const vertexLines = countMatches(text, /^\s*vertex\b/gim);
  if (starts !== facetCount || ends !== facetCount || vertexLines !== facetCount * 3) fail('ASCII STL has incomplete facets or vertices outside facet records.');
  return mesh;
}

function binaryStl(bytes, factor) {
  if (bytes.byteLength < 84) fail('Binary STL header is truncated.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const triangleCount = view.getUint32(80, true);
  const expectedBytes = 84 + triangleCount * 50;
  if (expectedBytes !== bytes.byteLength) fail('Binary STL size does not match its declared triangle count.');
  if (!triangleCount || triangleCount > MAX_TRIANGLES) fail(`Binary STL must contain 1–${MAX_TRIANGLES.toLocaleString()} triangles.`);
  const mesh = { vertices: [], triangles: [] }, byPosition = new Map();
  for (let face = 0; face < triangleCount; face += 1) {
    const offset = 84 + face * 50 + 12;
    const vertices = [];
    for (let corner = 0; corner < 3; corner += 1) {
      const pointOffset = offset + corner * 12;
      const vertex = [0, 4, 8].map((delta) => view.getFloat32(pointOffset + delta, true));
      if (!vertex.every(Number.isFinite)) fail('Binary STL contains a non-finite vertex.');
      vertices.push(scaleVertex(vertex, factor));
    }
    addTriangle(mesh, ...vertices.map((vertex) => internVertex(mesh, vertex, byPosition)));
  }
  return mesh;
}

function parseStl(bytes, factor) {
  if (bytes.byteLength >= 84) {
    const count = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(80, true);
    if (84 + count * 50 === bytes.byteLength) return binaryStl(bytes, factor);
  }
  let text;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { fail('STL is neither a size-consistent binary file nor valid UTF-8 ASCII STL.'); }
  if (text.includes('\0')) fail('STL contains binary data with an invalid size declaration.');
  return asciiStl(text, factor);
}

function parseObj(bytes, factor) {
  let text;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { fail('OBJ must be valid UTF-8 text.'); }
  const mesh = { vertices: [], triangles: [] };
  let offset = 0, lineIndex = 0;
  while (offset <= text.length) {
    const newline = text.indexOf('\n', offset), rawLine = newline === -1 ? text.slice(offset) : text.slice(offset, newline);
    offset = newline === -1 ? text.length + 1 : newline + 1;
    lineIndex += 1;
    if (rawLine.length > MAX_OBJ_LINE) fail(`OBJ line ${lineIndex} exceeds the ${MAX_OBJ_LINE / (1024 * 1024)} MB line limit.`);
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const record = /^\S+/.exec(line)[0];
    if (record === 'v') {
      const coordinates = /^\S+\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)/.exec(line);
      if (!coordinates) fail(`OBJ line ${lineIndex} has an incomplete vertex.`);
      const vertex = coordinates.slice(1).map(Number);
      if (!vertex.every(Number.isFinite)) fail(`OBJ line ${lineIndex} contains a non-finite vertex.`);
      if (mesh.vertices.length >= MAX_VERTICES) fail(`Surface exceeds the ${MAX_VERTICES.toLocaleString()} vertex import limit.`);
      mesh.vertices.push(scaleVertex(vertex, factor));
    } else if (record === 'f') {
      let tokenCount = 0;
      const tokenPattern = /\S+/g;
      while (tokenPattern.exec(line)) { tokenCount += 1; if (tokenCount > MAX_TRIANGLES + 3) fail(`OBJ line ${lineIndex} exceeds the ${MAX_TRIANGLES.toLocaleString()} triangle import limit.`); }
      const fields = line.split(/\s+/).slice(1);
      if (fields.length < 3) fail(`OBJ line ${lineIndex} has a face with fewer than three vertices.`);
      if (fields.length - 2 > MAX_TRIANGLES) fail(`OBJ line ${lineIndex} exceeds the ${MAX_TRIANGLES.toLocaleString()} triangle import limit.`);
      const indices = fields.map((field) => {
        const raw = field.split('/')[0];
        if (!/^[+-]?\d+$/.test(raw)) fail(`OBJ line ${lineIndex} has an invalid face index.`);
        const parsed = Number(raw);
        if (!Number.isSafeInteger(parsed) || parsed === 0) fail(`OBJ line ${lineIndex} has an invalid zero or oversized face index.`);
        const index = parsed > 0 ? parsed - 1 : mesh.vertices.length + parsed;
        if (index < 0 || index >= mesh.vertices.length) fail(`OBJ line ${lineIndex} refers to a vertex that is not defined.`);
        return index;
      });
      for (let corner = 1; corner < indices.length - 1; corner += 1) addTriangle(mesh, indices[0], indices[corner], indices[corner + 1]);
    }
  }
  if (!mesh.vertices.length || !mesh.triangles.length) fail('OBJ must contain vertices and at least one face.');
  return mesh;
}

export function inspectSurfaceMesh(mesh) {
  let indexValid = true, finite = true, degenerateTriangles = 0;
  const bounds = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
  for (const vertex of mesh.vertices) {
    if (!Array.isArray(vertex) || vertex.length !== 3 || !vertex.every(Number.isFinite)) { finite = false; continue; }
    for (let axis = 0; axis < 3; axis += 1) {
      bounds.min[axis] = Math.min(bounds.min[axis], vertex[axis]);
      bounds.max[axis] = Math.max(bounds.max[axis], vertex[axis]);
    }
  }
  const spans = bounds.min[0] === Infinity ? [0, 0, 0] : bounds.min.map((value, axis) => bounds.max[axis] - value);
  const diagonal = Math.hypot(...spans);
  const minimumDoubleArea = Math.max(diagonal * diagonal * 1e-12, Number.MIN_VALUE);
  const edges = new Map();
  for (const triangle of mesh.triangles) {
    if (!Array.isArray(triangle) || triangle.length !== 3 || triangle.some((index) => !Number.isInteger(index) || index < 0 || index >= mesh.vertices.length)) { indexValid = false; continue; }
    const [ia, ib, ic] = triangle;
    const a = mesh.vertices[ia], b = mesh.vertices[ib], c = mesh.vertices[ic];
    if (!a?.every(Number.isFinite) || !b?.every(Number.isFinite) || !c?.every(Number.isFinite)) { finite = false; continue; }
    const u = b.map((value, axis) => value - a[axis]), v = c.map((value, axis) => value - a[axis]);
    const cross = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    if (ia === ib || ib === ic || ia === ic || Math.hypot(...cross) <= minimumDoubleArea) degenerateTriangles += 1;
    for (const [from, to] of [[ia, ib], [ib, ic], [ic, ia]]) {
      const key = from < to ? `${from}:${to}` : `${to}:${from}`;
      edges.set(key, (edges.get(key) || 0) + 1);
    }
  }
  const edgeUseCounts = [...edges.values()];
  const boundaryEdges = edgeUseCounts.filter((count) => count === 1).length;
  const nonManifoldEdges = edgeUseCounts.filter((count) => count > 2).length;
  const invalidEdgeCounts = edgeUseCounts.filter((count) => count < 1 || count > 2).length;
  return {
    finite, indexValid, degenerateTriangles, boundaryEdges, nonManifoldEdges,
    closed: edgeUseCounts.length > 0 && boundaryEdges === 0 && nonManifoldEdges === 0 && indexValid,
    bounds: { min: bounds.min[0] === Infinity ? [0, 0, 0] : bounds.min, max: bounds.max[0] === -Infinity ? [0, 0, 0] : bounds.max, spans },
    vertexCount: mesh.vertices.length, triangleCount: mesh.triangles.length, invalidEdgeCounts,
  };
}

export function parseSurfaceFile({ name, bytes, units = 'mm' }) {
  if (!(bytes instanceof Uint8Array)) fail('Surface input must be supplied as bytes.');
  if (bytes.byteLength > MAX_BYTES) fail(`Surface exceeds the ${MAX_BYTES / (1024 * 1024)} MB import limit.`);
  const extension = name.toLowerCase().split('.').pop();
  if (extension !== 'stl' && extension !== 'obj') fail('Only STL and OBJ triangle surfaces are supported. DICOM and NIfTI are not parsed.');
  const factor = UNIT_TO_MM[units];
  if (!factor) fail('Choose explicit source units: mm, cm, or in.');
  const mesh = extension === 'stl' ? parseStl(bytes, factor) : parseObj(bytes, factor);
  if (!mesh.vertices.length || !mesh.triangles.length) fail('Surface must contain at least one vertex and triangle.');
  const analysis = inspectSurfaceMesh(mesh);
  if (!analysis.finite || !analysis.indexValid) fail('Surface has non-finite coordinates or invalid triangle indices.');
  if (analysis.degenerateTriangles) fail(`Surface contains ${analysis.degenerateTriangles} degenerate triangle(s).`);
  return { mesh, analysis, sourceUnits: units, scaleToMm: factor, format: extension.toUpperCase() };
}

export const surfaceImportLimits = Object.freeze({ maxBytes: MAX_BYTES, maxVertices: MAX_VERTICES, maxTriangles: MAX_TRIANGLES, maxCoordinateMm: MAX_COORDINATE_MM });
