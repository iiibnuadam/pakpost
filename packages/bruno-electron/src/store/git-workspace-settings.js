const Store = require('electron-store');
const { encryptString, decryptString } = require('../utils/encryption');

// Settings git per workspace (autoCommit/autoPush/autoPull + kredensial).
// Token dienkripsi dengan kunci machine-id (pola sama seperti ai-keys/oauth2);
// username disimpan plaintext karena bukan secret.
class GitWorkspaceSettingsStore {
  constructor() {
    this.store = new Store({
      name: 'git-workspace-settings',
      clearInvalidConfig: true
    });
  }

  getAllSettings() {
    return this.store.get('workspaces', {}) || {};
  }

  // Seluruh settings dengan token sudah terdekripsi — untuk dikirim ke renderer.
  getAllSettingsDecrypted() {
    const all = this.getAllSettings();
    const result = {};
    for (const [workspaceUid, raw] of Object.entries(all)) {
      result[workspaceUid] = this.#deserialize(raw);
    }
    return result;
  }

  getSettings(workspaceUid) {
    const raw = this.getAllSettings()[workspaceUid];
    if (!raw) {
      return null;
    }
    return this.#deserialize(raw);
  }

  saveSettings(workspaceUid, settings = {}) {
    const all = this.getAllSettings();
    all[workspaceUid] = this.#serialize(settings);
    this.store.set('workspaces', all);
  }

  #serialize(settings) {
    const token = settings.gitToken || '';
    return {
      autoCommit: Boolean(settings.autoCommit),
      autoPush: Boolean(settings.autoPush),
      autoPull: Boolean(settings.autoPull),
      autoPullInterval: Number(settings.autoPullInterval) || 0,
      gitUsername: settings.gitUsername || '',
      gitToken: token ? encryptString(token) : ''
    };
  }

  #deserialize(raw) {
    let token = '';
    if (raw.gitToken) {
      try {
        token = decryptString(raw.gitToken);
      } catch (err) {
        console.error(`Failed to decrypt git token for workspace settings:`, err.message);
      }
    }
    return {
      autoCommit: raw.autoCommit,
      autoPush: raw.autoPush,
      autoPull: raw.autoPull,
      autoPullInterval: raw.autoPullInterval,
      gitUsername: raw.gitUsername || '',
      gitToken: token
    };
  }
}

module.exports = new GitWorkspaceSettingsStore();
