const { app, BrowserWindow, Notification, nativeTheme, shell, Menu, Tray, nativeImage, ipcMain } = require('electron');
const path = require('path');

// Ensure only one instance runs
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow = null;
let tray = null;

// Force dark mode to match the app's aesthetic
nativeTheme.themeSource = 'dark';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1060,
    height: 820,
    minWidth: 680,
    minHeight: 600,
    title: 'Desk Wellness',
    backgroundColor: '#0f0f0d',
    titleBarStyle: 'hiddenInset',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,  // keep setInterval running when window loses focus
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
  });

  mainWindow.loadFile('desk-wellness.html');

  // Open external links in the default browser rather than Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  // Use a simple template image for the tray icon (works on macOS in dark/light mode)
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
  try {
    const trayIcon = nativeImage.createFromPath(iconPath);
    const resized = trayIcon.isEmpty()
      ? nativeImage.createEmpty()
      : trayIcon.resize({ width: 16, height: 16 });

    tray = new Tray(resized);
  } catch {
    tray = new Tray(nativeImage.createEmpty());
  }

  tray.setToolTip('Desk Wellness');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Desk Wellness',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      accelerator: 'Cmd+Q',
      click: () => app.quit()
    }
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    } else {
      createWindow();
    }
  });
}

// macOS: recreate window if dock icon is clicked and no windows are open
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

// Second instance: focus existing window
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// Prevent app from quitting when all windows are closed on macOS
// (standard macOS app behavior — stays alive in tray/dock)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('open-external', (_event, url) => {
  shell.openExternal(url);
});

app.whenReady().then(() => {
  // Allow the app to show notifications on macOS
  app.setAppUserModelId('com.deskwellness.app');

  createWindow();
  createTray();

  // Application menu
  const menuTemplate = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
});
