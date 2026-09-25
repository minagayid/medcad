import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const defaultRoot = fileURLToPath(new URL('.', import.meta.url));
const defaultPort = Number(process.env.MEDCAD_PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join('; ');

export function createMedcadServer(rootDirectory = defaultRoot) {
  const root = resolve(rootDirectory);
  const rootPrefix = `${root}${sep}`;
  return createServer(async (request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405, { Allow: 'GET, HEAD' }); response.end('Method not allowed'); return; }
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url || '/', 'http://127.0.0.1').pathname); }
    catch { response.writeHead(400); response.end('Bad request'); return; }
    const requestedPath = pathname === '/' ? 'index.html' : pathname.replace(/^[/\\]+/, '');
    const candidate = resolve(root, requestedPath);
    const rel = relative(root, candidate);
    if (rel === '..' || rel.startsWith(`..${sep}`) || candidate !== root && !candidate.startsWith(rootPrefix)) { response.writeHead(403); response.end('Forbidden'); return; }
    try {
      const body = await readFile(candidate);
      response.writeHead(200, {
        'Content-Type': mime[extname(candidate).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store',
        'Content-Security-Policy': contentSecurityPolicy,
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
      });
      if (request.method === 'HEAD') response.end(); else response.end(body);
    } catch { response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end('Not found'); }
  });
}

const launchedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (launchedPath === import.meta.url) {
  const server = createMedcadServer();
  server.listen(defaultPort, '127.0.0.1', () => console.log(`medcad listening at http://127.0.0.1:${defaultPort}`));
}
