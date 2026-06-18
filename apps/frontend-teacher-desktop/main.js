const { app, BrowserWindow, shell } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

const WEB_BUILD_DIR = path.join(__dirname, 'web-build');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

// Expo's static export uses root-relative asset paths (e.g. "/_expo/...").
// Loading index.html via file:// resolves those against the filesystem root
// and breaks, so we serve the export over a local HTTP server instead.
function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
      const resolved = path.normalize(path.join(WEB_BUILD_DIR, urlPath === '/' ? 'index.html' : urlPath));

      if (!resolved.startsWith(WEB_BUILD_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      fs.readFile(resolved, (err, data) => {
        if (err) {
          // Client-side routes (e.g. "/login") have no matching file on a
          // hard reload — fall back to index.html and let expo-router's
          // client bundle render the route from window.location.
          fs.readFile(path.join(WEB_BUILD_DIR, 'index.html'), (fallbackErr, fallbackData) => {
            if (fallbackErr) {
              res.writeHead(404);
              res.end('Not found');
              return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(fallbackData);
          });
          return;
        }
        res.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(resolved)] || 'application/octet-stream' });
        res.end(data);
      });
    });

    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

let server;

async function createWindow() {
  const { port } = server.address();

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL(`http://127.0.0.1:${port}/`);

  // Keep external links (support, payment, etc.) out of the app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(async () => {
  server = await startServer();
  createWindow();
});

app.on('window-all-closed', () => {
  if (server) server.close();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
