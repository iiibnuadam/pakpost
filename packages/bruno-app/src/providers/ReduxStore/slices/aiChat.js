import { createSlice } from '@reduxjs/toolkit';
import { uuid } from 'utils/common';
import { getAiCliStatus, aiCliChatSend } from 'utils/git-ai';

const MAX_MESSAGES_PER_SESSION = 200;
const MAX_SESSIONS_PER_WORKSPACE = 30;

const initialState = {
  isOpen: false,
  loaded: false,
  byWorkspace: {}
};

const makeSession = (title = '') => ({
  id: uuid(),
  title,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: [],
  cliSessionId: null
});

const ensureWorkspace = (state, workspacePath) => {
  const key = workspacePath || '_default';
  if (!state.byWorkspace[key]) {
    state.byWorkspace[key] = { sessions: [], activeSessionId: null, pending: false };
  }
  return state.byWorkspace[key];
};

const ensureActiveSession = (state, workspacePath) => {
  const workspace = ensureWorkspace(state, workspacePath);
  if (!workspace.activeSessionId || !workspace.sessions.find((s) => s.id === workspace.activeSessionId)) {
    const session = makeSession();
    workspace.sessions.unshift(session);
    workspace.activeSessionId = session.id;
    if (workspace.sessions.length > MAX_SESSIONS_PER_WORKSPACE) {
      workspace.sessions = workspace.sessions.slice(0, MAX_SESSIONS_PER_WORKSPACE);
    }
  }
  return workspace.sessions.find((s) => s.id === workspace.activeSessionId);
};

const titleFromMessage = (text) => {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) {
    return 'New chat';
  }
  return clean.length > 42 ? `${clean.slice(0, 42)}…` : clean;
};

export const aiChatSlice = createSlice({
  name: 'aiChat',
  initialState,
  reducers: {
    toggleAiChatPanel: (state) => {
      state.isOpen = !state.isOpen;
    },
    setAiChatOpen: (state, action) => {
      state.isOpen = Boolean(action.payload);
    },
    aiChatHistoryLoaded: (state, action) => {
      const incoming = action.payload?.byWorkspace;
      if (incoming && typeof incoming === 'object') {
        // Buang pesan yang tersimpan di tengah streaming (assistant tanpa isi).
        for (const workspace of Object.values(incoming)) {
          if (!Array.isArray(workspace?.sessions)) {
            continue;
          }
          for (const session of workspace.sessions) {
            session.messages = (session.messages || []).filter(
              (m) => !(m?.streaming && m?.role === 'assistant' && !m?.text)
            );
            for (const m of session.messages) {
              if (m) {
                m.streaming = false;
              }
            }
          }
          if (!workspace.sessions.find((s) => s.id === workspace.activeSessionId)) {
            workspace.activeSessionId = workspace.sessions[0]?.id || null;
          }
        }
        state.byWorkspace = incoming;
      }
      state.loaded = true;
    },
    aiChatSessionSwitched: (state, action) => {
      const { workspacePath, sessionId } = action.payload;
      const workspace = ensureWorkspace(state, workspacePath);
      if (workspace.sessions.find((s) => s.id === sessionId)) {
        workspace.activeSessionId = sessionId;
      }
    },
    aiChatNewSession: (state, action) => {
      const { workspacePath, title } = action.payload;
      const workspace = ensureWorkspace(state, workspacePath);
      const session = makeSession(title || '');
      workspace.sessions.unshift(session);
      workspace.activeSessionId = session.id;
      if (workspace.sessions.length > MAX_SESSIONS_PER_WORKSPACE) {
        workspace.sessions = workspace.sessions.slice(0, MAX_SESSIONS_PER_WORKSPACE);
      }
    },
    aiChatSessionDeleted: (state, action) => {
      const { workspacePath, sessionId } = action.payload;
      const workspace = ensureWorkspace(state, workspacePath);
      workspace.sessions = workspace.sessions.filter((s) => s.id !== sessionId);
      if (workspace.activeSessionId === sessionId) {
        workspace.activeSessionId = workspace.sessions[0]?.id || null;
      }
    },
    aiChatHistoryCleared: (state, action) => {
      const { workspacePath } = action.payload;
      const key = workspacePath || '_default';
      state.byWorkspace[key] = { sessions: [], activeSessionId: null, pending: false };
    },
    aiChatMessageAdded: (state, action) => {
      const { workspacePath, message } = action.payload;
      const session = ensureActiveSession(state, workspacePath);
      session.messages.push(message);
      session.updatedAt = Date.now();
      if (!session.title && message.role === 'user') {
        session.title = titleFromMessage(message.text);
      }
      if (session.messages.length > MAX_MESSAGES_PER_SESSION) {
        session.messages = session.messages.slice(-MAX_MESSAGES_PER_SESSION);
      }
    },
    aiChatMessageUpdated: (state, action) => {
      const { workspacePath, messageId, updates } = action.payload;
      const session = ensureActiveSession(state, workspacePath);
      const message = session.messages.find((m) => m.id === messageId);
      if (message && updates && typeof updates === 'object') {
        Object.assign(message, updates);
        session.updatedAt = Date.now();
      }
    },
    aiChatSetPending: (state, action) => {
      const { workspacePath, pending } = action.payload;
      ensureWorkspace(state, workspacePath).pending = Boolean(pending);
    },
    aiChatSetSessionId: (state, action) => {
      const { workspacePath, cliSessionId } = action.payload;
      if (cliSessionId) {
        const session = ensureActiveSession(state, workspacePath);
        session.cliSessionId = cliSessionId;
      }
    }
  }
});

export const {
  toggleAiChatPanel,
  setAiChatOpen,
  aiChatHistoryLoaded,
  aiChatSessionSwitched,
  aiChatNewSession,
  aiChatSessionDeleted,
  aiChatHistoryCleared,
  aiChatMessageAdded,
  aiChatMessageUpdated,
  aiChatSetPending,
  aiChatSetSessionId
} = aiChatSlice.actions;

// --- Run registry untuk tombol Stop (satu run aktif per workspace) ---
const activeRuns = new Map(); // workspaceKey -> stop()
const stoppingRuns = new Set();

export const stopAiChatRun = (workspacePath) => {
  const key = workspacePath || '_default';
  const stop = activeRuns.get(key);
  if (stop) {
    stoppingRuns.add(key);
    stop();
  }
};

// Custom provider tidak punya flag resume — history disisipkan ke prompt.
const buildCustomPrompt = (messages, text) => {
  const history = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
    .join('\n');
  return history ? `${history}\nUser: ${text}\nAssistant:` : text;
};

/**
 * Kirim pesan chat ke CLI agent. Bisa dipanggil dari komponen manapun
 * (panel chat, GitTab "Fix with AI", dsb). Streaming delta tetap masuk Redux
 * sehingga UI cukup membaca state.
 */
export const sendAiChatMessage = ({ workspacePath, text, newSessionTitle }) => async (dispatch, getState) => {
  const key = workspacePath || '_default';
  const body = String(text || '').trim();
  if (!body) {
    return;
  }

  const workspace = getState().aiChat.byWorkspace[key];
  if (workspace?.pending) {
    return;
  }

  if (newSessionTitle) {
    dispatch(aiChatNewSession({ workspacePath, title: newSessionTitle }));
  }

  const current = getState().aiChat.byWorkspace[key];
  const session = current?.sessions?.find((s) => s.id === current.activeSessionId);
  const cliSessionId = session?.cliSessionId || null;
  const prevMessages = session?.messages || [];

  const assistantId = uuid();
  dispatch(
    aiChatMessageAdded({ workspacePath, message: { id: uuid(), role: 'user', text: body, ts: Date.now() } })
  );
  dispatch(
    aiChatMessageAdded({
      workspacePath,
      message: { id: assistantId, role: 'assistant', text: '', streaming: true, ts: Date.now() }
    })
  );
  dispatch(aiChatSetPending({ workspacePath, pending: true }));

  let isCustom = false;
  try {
    const status = await getAiCliStatus();
    isCustom = status?.provider?.id === 'custom';
  } catch (err) {
    isCustom = false;
  }
  const prompt = isCustom ? buildCustomPrompt(prevMessages, body) : body;

  let accumulated = '';
  const { done, stop } = aiCliChatSend({
    workspacePath,
    prompt,
    cliSessionId,
    onEvent: (evt) => {
      if (evt.type === 'delta' && evt.text) {
        accumulated += evt.text;
        dispatch(
          aiChatMessageUpdated({ workspacePath, messageId: assistantId, updates: { text: accumulated } })
        );
      } else if (evt.type === 'session' && evt.sessionId) {
        dispatch(aiChatSetSessionId({ workspacePath, cliSessionId: evt.sessionId }));
      }
    }
  });
  activeRuns.set(key, stop);

  try {
    const { text: reply, sessionId } = await done;
    dispatch(
      aiChatMessageUpdated({
        workspacePath,
        messageId: assistantId,
        updates: { text: reply || accumulated, streaming: false }
      })
    );
    if (sessionId) {
      dispatch(aiChatSetSessionId({ workspacePath, cliSessionId: sessionId }));
    }
  } catch (err) {
    const stopped = stoppingRuns.has(key);
    dispatch(
      aiChatMessageUpdated({
        workspacePath,
        messageId: assistantId,
        updates: stopped
          ? { text: accumulated || '(Stopped)', streaming: false }
          : { role: 'error', text: err?.message || 'The AI CLI failed. Try again.', streaming: false }
      })
    );
  } finally {
    stoppingRuns.delete(key);
    activeRuns.delete(key);
    dispatch(aiChatSetPending({ workspacePath, pending: false }));
  }
};

export default aiChatSlice.reducer;
