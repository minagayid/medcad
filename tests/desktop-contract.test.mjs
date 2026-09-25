import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [manifestText, main, html] = await Promise.all([
  readFile(new URL('../package.json', import.meta.url), 'utf8'),
  readFile(new URL('../electron-main.mjs', import.meta.url), 'utf8'),
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
]);
const manifest = JSON.parse(manifestText);
assert.equal(manifest.name, 'medcad');
assert.equal(manifest.devDependencies.electron, '44.4.5');
assert.equal(manifest.devDependencies['electron-builder'], '26.15.3');
assert.equal(manifest.scripts['desktop:pack'], 'electron-builder --win portable --x64');
assert.deepEqual(manifest.build.win.target, ['portable']);
assert.match(manifest.build.win.artifactName, /^medcad-.*-portable\.exe$/);
assert.match(main, /contextIsolation: true/);
assert.match(main, /nodeIntegration: false/);
assert.match(main, /sandbox: true/);
assert.match(main, /webSecurity: true/);
assert.match(main, /requestSingleInstanceLock\(\)/);
assert.match(main, /server\.listen\(desktopPort, '127\.0\.0\.1'/);
assert.match(main, /parsed\.protocol === 'https:'/);
assert.doesNotMatch(html, /<img[^>]+src="https?:\/\//i, 'the shell does not require remote images at startup');
assert.doesNotMatch(html, /fonts\.googleapis\.com/, 'the shell does not fetch remote fonts');
console.log('desktop contract smoke test passed: portable x64 target, sandboxed renderer, loopback-only server, offline core assets');
