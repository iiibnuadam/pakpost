const { ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');

const registerUpdaterIpc = (mainWindow) => {
  autoUpdater.logger = console;
  autoUpdater.autoDownload = false;

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents?.send('main:update-available', info);
  });

  autoUpdater.on('update-not-available', (info) => {
    mainWindow?.webContents?.send('main:update-not-available', info);
  });

  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents?.send('main:update-download-progress', progress);
  });

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow?.webContents?.send('main:update-downloaded', info);
  });

  autoUpdater.on('error', (error) => {
    mainWindow?.webContents?.send('main:update-error', error?.message || String(error));
  });

  ipcMain.handle('renderer:check-for-updates', async () => {
    try {
      return await autoUpdater.checkForUpdates();
    } catch (error) {
      console.error('[updater] check for updates failed:', error);
      throw error;
    }
  });

  ipcMain.handle('renderer:download-update', async () => {
    try {
      return await autoUpdater.downloadUpdate();
    } catch (error) {
      console.error('[updater] download update failed:', error);
      throw error;
    }
  });

  ipcMain.handle('renderer:install-update', () => {
    autoUpdater.quitAndInstall(false, true);
  });
};

module.exports = registerUpdaterIpc;
