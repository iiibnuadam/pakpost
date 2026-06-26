const { execSync } = require('child_process');
const { app, dialog } = require('electron');
const path = require('path');

const getAppBundlePath = () => {
  // app.getPath('exe') di macOS: /Applications/Pakpost.app/Contents/MacOS/Pakpost
  // Naik 3 level sampai ke root .app bundle.
  return path.resolve(app.getPath('exe'), '..', '..', '..');
};

const isQuarantined = () => {
  if (process.platform !== 'darwin') {
    return false;
  }

  try {
    const output = execSync(`xattr -p com.apple.quarantine "${getAppBundlePath()}"`, {
      encoding: 'utf8'
    });
    return Boolean(output && output.trim());
  } catch {
    // xattr return error kalau atribut tidak ada = tidak quarantine.
    return false;
  }
};

const removeQuarantine = async (parentWindow) => {
  if (process.platform !== 'darwin') {
    return false;
  }

  try {
    execSync(`xattr -dr com.apple.quarantine "${getAppBundlePath()}"`);

    await dialog.showMessageBox(parentWindow || undefined, {
      type: 'info',
      title: 'Gatekeeper',
      message: 'Quarantine berhasil dihapus. Silakan restart Pakpost.'
    });

    return true;
  } catch (error) {
    dialog.showErrorBox('Gagal menghapus quarantine', error.message);
    return false;
  }
};

const promptAndRemoveQuarantine = async (parentWindow) => {
  if (process.platform !== 'darwin') {
    return false;
  }

  const { response } = await dialog.showMessageBox(parentWindow || undefined, {
    type: 'warning',
    buttons: ['Hapus Quarantine', 'Batal'],
    defaultId: 0,
    cancelId: 1,
    title: 'Pakpost terkena Gatekeeper',
    message:
      'macOS Gatekeeper menandai Pakpost sebagai quarantine, sehingga bisa muncul pesan "damaged". Hapus quarantine sekarang?'
  });

  if (response === 0) {
    return removeQuarantine(parentWindow);
  }

  return false;
};

module.exports = {
  getAppBundlePath,
  isQuarantined,
  removeQuarantine,
  promptAndRemoveQuarantine
};
