const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');

const APP_URL = 'https://rezaulkarim12th.github.io/bk-busicare-ai-agent-system/';
const APP_ORIGIN = new URL(APP_URL).origin;

function openExternal(url) {
  try {
    const target = new URL(url);
    if (['https:', 'mailto:', 'tel:'].includes(target.protocol)) shell.openExternal(url);
  } catch {
    // Ignore malformed or unsupported external URLs.
  }
}

function isAllowedAppUrl(url) {
  if (!app.isPackaged && url.startsWith('file://')) return true;
  try {
    return new URL(url).origin === APP_ORIGIN;
  } catch {
    return false;
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 650,
    autoHideMenuBar: true,
    backgroundColor: '#0b1d34',
    webPreferences: {
      preload: path.join(__dirname, 'electron-preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  if (app.isPackaged) {
    // The packaged desktop client uses the HTTPS staging site so its origin
    // matches the server-side CORS allowlist and cloud authentication works.
    win.loadURL(APP_URL);
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!isAllowedAppUrl(url)) openExternal(url);
    return { action: 'deny' };
  });

  const guardNavigation = (event, url) => {
    if (!isAllowedAppUrl(url)) {
      event.preventDefault();
      openExternal(url);
    }
  };
  win.webContents.on('will-navigate', guardNavigation);
  win.webContents.on('will-redirect', guardNavigation);
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
