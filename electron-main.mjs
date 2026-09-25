import { app, BrowserWindow, dialog, shell, session } from 'electron';
import { createMedcadServer } from './server.mjs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const applicationRoot = dirname(fileURLToPath(import.meta.url));
const windows = new Set();
let server;
let appOrigin;
let closingServer = false;
let primaryWindow;
const desktopPort = 4174;

function createWindow(url) {
  const window = new BrowserWindow({
    width: 1500,
    height: 960,
    minWidth: 1120,
    minHeight: 720,
    backgroundColor: '#0b1117',
    show: false,
    title: 'medcad · design workstation',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      devTools: !app.isPackaged,
    },
  });
  windows.add(window);
  window.once('ready-to-show', () => window.show());
  window.on('closed', () => windows.delete(window));
  window.webContents.setWindowOpenHandler(({ url: target }) => {
    try {
      const parsed = new URL(target);
      if (parsed.origin === appOrigin) createWindow(target).catch((error) => console.error('Could not open local medcad page:', error));
      else if (parsed.protocol === 'https:') shell.openExternal(parsed.href).catch((error) => console.error('Could not open external link:', error));
    } catch { /* Invalid and non-HTTPS external URLs are denied. */ }
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', (event, target) => {
    try {
      const parsed = new URL(target);
      if (parsed.origin === appOrigin) return;
      event.preventDefault();
      if (parsed.protocol === 'https:') shell.openExternal(parsed.href).catch((error) => console.error('Could not open external link:', error));
    } catch { event.preventDefault(); }
  });
  if (!primaryWindow) primaryWindow = window;
  return window.loadURL(url);
}

async function startLocalServer() {
  server = createMedcadServer(applicationRoot);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(desktopPort, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Could not determine the local medcad server port.');
  const url = `http://127.0.0.1:${address.port}/`;
  appOrigin = new URL(url).origin;
  return url;
}

async function stopLocalServer() {
  if (!server || closingServer) return;
  closingServer = true;
  const activeServer = server;
  await new Promise((resolve, reject) => activeServer.close((error) => error ? reject(error) : resolve()));
  server = null;
}

app.setName('medcad');
app.enableSandbox();

const hasSingleInstance = app.requestSingleInstanceLock();
if (!hasSingleInstance) {
  app.quit();
} else {
  app.on('second-instance', () => primaryWindow?.focus());
  app.whenReady().then(async () => {
    session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    const url = await startLocalServer();
    await createWindow(url);
  }).catch(async (error) => {
    console.error('medcad startup failed:', error);
    dialog.showErrorBox('medcad could not start', `${error.message || String(error)}\n\nClose another medcad preview or application using local port ${desktopPort} and try again.`);
    try { await stopLocalServer(); } catch { /* The process is exiting after the startup error. */ }
    app.exit(1);
  });
}

app.on('window-all-closed', () => app.quit());
app.on('before-quit', (event) => {
  if (!server || closingServer) return;
  event.preventDefault();
  stopLocalServer().then(() => app.quit()).catch((error) => {
    console.error('medcad local server shutdown failed:', error);
    app.exit(1);
  });
});
