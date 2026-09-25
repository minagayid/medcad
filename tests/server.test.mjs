import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { createMedcadServer } from '../server.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const server = createMedcadServer(root);
await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
const address = server.address();
assert(address && typeof address !== 'string');
const base = `http://127.0.0.1:${address.port}`;
try {
  const home = await fetch(`${base}/`);
  assert.equal(home.status, 200);
  assert.match(home.headers.get('content-security-policy'), /script-src 'self'/);
  assert.match(await home.text(), /medcad · design workstation/);

  const importer = await fetch(`${base}/mesh-import.mjs`);
  assert.equal(importer.status, 200);
  assert.match(await importer.text(), /export function parseSurfaceFile/);

  const post = await fetch(`${base}/`, { method: 'POST' });
  assert.equal(post.status, 405);
  const traversal = await fetch(`${base}/%2e%2e%2fpackage.json`);
  assert.equal(traversal.status, 403);
} finally {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
assert.equal(manifest.name, 'medcad');
assert.equal(manifest.scripts['desktop:pack'], 'electron-builder --win portable --x64');
assert.equal(manifest.build.win.target[0], 'portable');
console.log('server/desktop smoke test passed: loopback serving, CSP, traversal block, and portable target contract');
