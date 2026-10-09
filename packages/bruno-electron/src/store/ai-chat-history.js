const Store = require('electron-store');

// Riwayat chat AI (per workspace -> daftar sesi). Disimpan terpisah dari
// preferences karena sifatnya sering berubah dan bisa membesar.
class AiChatHistoryStore {
  constructor() {
    this.store = new Store({
      name: 'ai-chat-history',
      clearInvalidConfig: true
    });
  }

  getHistory() {
    return this.store.get('history', { byWorkspace: {} });
  }

  saveHistory(history) {
    this.store.set('history', history);
  }
}

module.exports = new AiChatHistoryStore();
