/**
 * Renderer-side helpers for the CLI-based AI conflict resolver.
 * The Electron main process spawns the configured CLI agent (claude / kimi /
 * antigravity / custom); these helpers wrap the IPC and its progress stream.
 */

export const getAiCliStatus = () => {
  const { ipcRenderer } = window;
  if (!ipcRenderer) {
    return Promise.reject(new Error('IPC not available'));
  }
  return ipcRenderer.invoke('renderer:ai-cli-status');
};

/**
 * Ask the configured CLI agent to ANALYZE a conflict (no resolution yet).
 * Returns a suggestion object: { oursSummary, theirsSummary, recommendation,
 * rationale, risks } — or null when the CLI gave nothing parseable.
 */
export const aiCliAnalyzeConflict = ({ collectionPath, filePath }) => {
  const { ipcRenderer } = window;
  if (!ipcRenderer) {
    return Promise.reject(new Error('IPC not available'));
  }
  return ipcRenderer
    .invoke('renderer:ai-cli-analyze-conflict', { collectionPath, filePath })
    .then((result) => result?.analysis || null);
};

/**
 * Ask the configured CLI agent to resolve one conflicted file.
 *
 * @returns {{ done: Promise<string>, stop: Function }}
 *   `done` resolves with the resolved file content (string) and rejects with
 *   an Error whose message is safe to show in a toast.
 *   `stop` aborts the underlying CLI process.
 */
export const aiCliResolveConflict = ({ collectionPath, filePath, onChunk }) => {
  const { ipcRenderer } = window;
  if (!ipcRenderer) {
    return { done: Promise.reject(new Error('IPC not available')), stop: () => {} };
  }

  const streamId = `gitai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  let unsub = null;
  if (typeof onChunk === 'function') {
    unsub = ipcRenderer.on('main:ai-cli-chunk', (payload) => {
      if (payload?.streamId !== streamId) return;
      onChunk(payload);
    });
  }

  const invokePromise = ipcRenderer
    .invoke('renderer:ai-cli-resolve-conflict', { collectionPath, filePath, streamId })
    .then((result) => result?.content || null);

  const done = Promise.resolve(invokePromise).finally(() => {
    if (unsub) unsub();
  });

  const stop = () => {
    ipcRenderer.invoke('renderer:ai-cli-stop', { streamId }).catch(() => {});
  };

  return { done, stop };
};

/**
 * Send a general chat message to the configured CLI agent.
 *
 * @returns {{ done: Promise<{text: string, sessionId: string|null}>, stop: Function }}
 *   `done` resolves with the assistant reply and the CLI session id (pass it
 *   back as `cliSessionId` on the next call to continue the conversation).
 *   `stop` aborts the underlying CLI process.
 */
export const aiCliChatSend = ({ workspacePath, prompt, cliSessionId, onEvent }) => {
  const { ipcRenderer } = window;
  if (!ipcRenderer) {
    return { done: Promise.reject(new Error('IPC not available')), stop: () => {} };
  }

  const streamId = `aichat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  let unsub = null;
  if (typeof onEvent === 'function') {
    unsub = ipcRenderer.on('main:ai-chat-event', (payload) => {
      if (payload?.streamId !== streamId) return;
      onEvent(payload);
    });
  }

  const invokePromise = ipcRenderer
    .invoke('renderer:ai-chat-send', { streamId, workspacePath, prompt, cliSessionId })
    .then((result) => ({ text: result?.text || '', sessionId: result?.sessionId || null }));

  const done = Promise.resolve(invokePromise).finally(() => {
    if (unsub) unsub();
  });

  const stop = () => {
    ipcRenderer.invoke('renderer:ai-cli-stop', { streamId }).catch(() => {});
  };

  return { done, stop };
};

export const loadAiChatHistory = () => {
  const { ipcRenderer } = window;
  if (!ipcRenderer) {
    return Promise.resolve({ byWorkspace: {} });
  }
  return ipcRenderer
    .invoke('renderer:ai-chat-history-load')
    .then((history) => (history?.byWorkspace ? history : { byWorkspace: {} }))
    .catch(() => ({ byWorkspace: {} }));
};

export const saveAiChatHistory = (byWorkspace) => {
  const { ipcRenderer } = window;
  if (!ipcRenderer) {
    return Promise.resolve();
  }
  return ipcRenderer.invoke('renderer:ai-chat-history-save', { byWorkspace }).catch(() => {});
};
