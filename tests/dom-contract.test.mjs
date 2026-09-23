import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, app] = await Promise.all([readFile(new URL('../index.html', import.meta.url), 'utf8'), readFile(new URL('../app.js', import.meta.url), 'utf8')]);
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
const selectors = [...app.matchAll(/\$\$?\('\#([A-Za-z0-9_-]+)/g)].map((match) => match[1]);
const missing = [...new Set(selectors)].filter((id) => !ids.has(id));
assert.deepEqual(missing, [], `app.js references missing DOM ids: ${missing.join(', ')}`);
console.log(`dom-contract smoke test passed for ${ids.size} declared ids`);
