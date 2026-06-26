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
    const message = error?.message || String(error);

    // Suppress expected errors when there is no published release yet.
    if (
      message.includes('No published versions') ||
      message.includes('latest.yml') ||
      message.includes('latest-mac.yml') ||
      message.includes('latest-win.yml') ||
      message.includes('latest-linux.yml')
    ) {
      console.log('[updater] suppressed expected error:', message);
      return;
    }

    console.error('[updater] error:', error);
    mainWindow?.webContents?.send('main:update-error', message);
  });

  ipcMain.handle('renderer:check-for-updates', async () => {
    try {
      return await autoUpdater.checkForUpdates();
    } catch (error) {
      console.error('[updater] check for updates failed:', error);
      const message = error?.message || String(error);

      // Return gracefully when no release has been published yet.
      if (message.includes('No published versions')) {
        return { updateInfo: null, cancellationToken: null };
      }

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
