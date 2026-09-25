import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, app] = await Promise.all([readFile(new URL('../index.html', import.meta.url), 'utf8'), readFile(new URL('../app.js', import.meta.url), 'utf8')]);
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
const selectors = [...app.matchAll(/\$\$?\('\#([A-Za-z0-9_-]+)/g)].map((match) => match[1]);
const missing = [...new Set(selectors)].filter((id) => !ids.has(id));
assert.deepEqual(missing, [], `app.js references missing DOM ids: ${missing.join(', ')}`);
assert.match(app, /function buildMesh\(\) \{ return state\.surfaceMesh \|\| buildMeshCore\(/, 'the viewport mesh builder selects the parsed source mesh');
assert.match(app, /state\.source\.kind === 'surface' \? 1 : 0/, 'the workflow step reflects a parsed surface');
assert.match(app, /Edge incidence only:.*winding, self-intersection, fit and solid validity not assessed/, 'the imported edge-incidence status states what it does not assess');
assert.match(app, /status: result\.nonManifoldEdges \? 'fail' : 'review'/, 'edge incidence alone never produces a passing validation status');
assert.match(app, /center = state\.surfaceAnalysis\?\.bounds\.min\.map/, 'the viewport centers and frames the input mesh using its measured bounds');
assert.match(html, /id="studyInput" accept="\.stl,\.obj"/, 'the scan input only advertises supported mesh formats');
assert.match(app, /function snapshot\(\) \{ const source = state\.source\.kind === 'template' \? state\.source : \{ kind: 'template'/, 'saved settings do not persist imported source names');
assert.match(app, /sourceName: state\.surfaceMesh \? null/, 'surface manifests omit raw source filenames');
assert.match(app, /label = state\.surfaceMesh \? 'Imported input surface'/, 'OBJ previews use a generic source label');
console.log(`dom-contract smoke test passed for ${ids.size} declared ids`);
