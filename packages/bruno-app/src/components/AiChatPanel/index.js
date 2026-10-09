import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IconWand, IconPlus, IconX, IconSend, IconSquare, IconTrash, IconTrashX, IconCopy } from '@tabler/icons';
import toast from 'react-hot-toast';
import debounce from 'lodash/debounce';
import { useResizablePanel } from 'hooks/useResizablePanel';
import { usePersistedState } from 'hooks/usePersistedState';
import ChatMarkdown from './ChatMarkdown';
import { getAiCliStatus, loadAiChatHistory, saveAiChatHistory } from 'utils/git-ai';
import {
  toggleAiChatPanel,
  setAiChatOpen,
  aiChatHistoryLoaded,
  aiChatSessionSwitched,
  aiChatNewSession,
  aiChatSessionDeleted,
  aiChatHistoryCleared,
  sendAiChatMessage,
  stopAiChatRun
} from 'providers/ReduxStore/slices/aiChat';
import StyledWrapper from './StyledWrapper';

const EMPTY_MESSAGES = [];

const sessionDisplayTitle = (session) => session?.title || 'New chat';

const copyToClipboard = (text) => {
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success('Copied to clipboard'))
    .catch(() => toast.error('Failed to copy'));
};

const AiChatPanel = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => state.aiChat.isOpen);
  const loaded = useSelector((state) => state.aiChat.loaded);
  const byWorkspace = useSelector((state) => state.aiChat.byWorkspace);
  const workspacePath = useSelector((state) => {
    const { workspaces, activeWorkspaceUid } = state.workspaces || {};
    return workspaces?.find((w) => w.uid === activeWorkspaceUid)?.pathname || null;
  });

  const workspace = useSelector((state) =>
    workspacePath ? state.aiChat.byWorkspace[workspacePath] : null
  );
  const sessions = workspace?.sessions || [];
  const activeSessionId = workspace?.activeSessionId || null;
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;
  const messages = activeSession?.messages || EMPTY_MESSAGES;
  const pending = Boolean(workspace?.pending);

  const [input, setInput] = useState('');
  const [cliStatus, setCliStatus] = useState(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [savedWidth, setSavedWidth] = usePersistedState({ key: 'ai-chat-panel-width', default: 360 });
  const { width, handleDragStart } = useResizablePanel({
    initialWidth: savedWidth,
    minWidth: 280,
    maxWidth: 700,
    direction: 'right',
    onResizeEnd: setSavedWidth
  });

  const inputRef = useRef(null);
  const listEndRef = useRef(null);

  // Muat riwayat chat dari disk sekali saat app dibuka.
  useEffect(() => {
    if (loaded) {
      return;
    }
    let cancelled = false;
    loadAiChatHistory().then((history) => {
      if (!cancelled) {
        dispatch(aiChatHistoryLoaded(history));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [loaded, dispatch]);

  // Persist riwayat setiap ada perubahan (debounced), hanya setelah load.
  const debouncedSave = useMemo(
    () =>
      debounce((next) => {
        saveAiChatHistory(next);
      }, 600),
    []
  );
  useEffect(() => () => debouncedSave.cancel(), [debouncedSave]);

  useEffect(() => {
    if (loaded) {
      debouncedSave(byWorkspace);
    }
  }, [loaded, byWorkspace, debouncedSave]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    let cancelled = false;
    getAiCliStatus()
      .then((status) => {
        if (!cancelled) setCliStatus(status);
      })
      .catch(() => {
        if (!cancelled) setCliStatus(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages.length, messages[messages.length - 1]?.text]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || pending || !workspacePath) {
      return;
    }
    setInput('');
    dispatch(sendAiChatMessage({ workspacePath, text }));
  }, [dispatch, workspacePath, input, pending]);

  const handleStop = useCallback(() => {
    stopAiChatRun(workspacePath);
  }, [workspacePath]);

  const handleNewChat = useCallback(() => {
    if (pending) {
      handleStop();
    }
    if (workspacePath) {
      dispatch(aiChatNewSession({ workspacePath }));
    }
  }, [dispatch, workspacePath, pending, handleStop]);

  const handleDeleteSession = useCallback(() => {
    if (!activeSessionId || !workspacePath) {
      return;
    }
    if (pending) {
      handleStop();
    }
    dispatch(aiChatSessionDeleted({ workspacePath, sessionId: activeSessionId }));
  }, [dispatch, workspacePath, activeSessionId, pending, handleStop]);

  // Konfirmasi 2 klik: klik pertama meng-arm, klik kedua menghapus seluruh
  // riwayat chat workspace ini (dari Redux + file history via debounced save).
  const handleClearAllHistory = useCallback(() => {
    if (!workspacePath || !sessions.length) {
      return;
    }
    if (!confirmClearAll) {
      setConfirmClearAll(true);
      setTimeout(() => setConfirmClearAll(false), 3000);
      return;
    }
    if (pending) {
      handleStop();
    }
    setConfirmClearAll(false);
    dispatch(aiChatHistoryCleared({ workspacePath }));
  }, [dispatch, workspacePath, sessions.length, pending, handleStop, confirmClearAll]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return null;
  }

  const cliFound = Boolean(cliStatus?.found);
  const hint = !cliFound
    ? cliStatus
      ? `"${cliStatus.provider.command || 'CLI'}" not found on PATH — set the provider in Preferences > AI.`
      : 'Checking CLI availability…'
    : null;

  return (
    <StyledWrapper style={{ width }} data-testid="ai-chat-panel">
      <div className="ai-chat-resize-handle" onMouseDown={handleDragStart} />
      <div className="ai-chat-header">
        <span className="ai-chat-title">
          <IconWand size={14} strokeWidth={1.5} />
          AI Chat
        </span>
        <span
          className={`ai-chat-status-dot ${cliFound ? 'configured' : ''}`}
          title={cliFound ? `${cliStatus.provider.command} ready` : 'CLI agent not found'}
        />
        <span className="ai-chat-header-actions">
          <button
            type="button"
            className={`ai-chat-btn-icon ${confirmClearAll ? 'confirming' : ''}`}
            onClick={handleClearAllHistory}
            disabled={!sessions.length}
            title={confirmClearAll ? 'Click again to confirm — deletes ALL chats in this workspace' : 'Clear all chat history in this workspace'}
            data-testid="ai-chat-clear-all"
          >
            <IconTrashX size={13} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className="ai-chat-btn-icon"
            onClick={handleDeleteSession}
            disabled={!activeSessionId || pending}
            title="Delete this chat session"
            data-testid="ai-chat-delete-session"
          >
            <IconTrash size={13} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className="ai-chat-btn-icon"
            onClick={handleNewChat}
            title="New chat session"
            data-testid="ai-chat-new"
          >
            <IconPlus size={14} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className="ai-chat-btn-icon"
            onClick={() => dispatch(toggleAiChatPanel())}
            title="Close AI Chat"
            data-testid="ai-chat-close"
          >
            <IconX size={14} strokeWidth={1.5} />
          </button>
        </span>
      </div>

      <div className="ai-chat-session-row">
        <select
          className="ai-chat-session-select"
          value={activeSessionId || ''}
          onChange={(e) =>
            dispatch(
              aiChatSessionSwitched({ workspacePath, sessionId: e.target.value })
            )}
          disabled={!sessions.length}
          data-testid="ai-chat-session-select"
        >
          {sessions.length === 0 && <option value="">No chats yet</option>}
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {sessionDisplayTitle(s)}
            </option>
          ))}
        </select>
      </div>

      <div className="ai-chat-messages">
        {messages.length === 0 ? (
          <div className="ai-chat-empty">
            <div className="ai-chat-empty-icon">
              <IconWand size={28} strokeWidth={1} />
            </div>
            <div>Ask anything.</div>
            <div style={{ marginTop: 4, fontSize: 11 }}>
              Runs with your logged-in CLI agent in this workspace — no API key.
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`ai-chat-msg ${m.role}`}>
              <div className="ai-chat-bubble">
                {m.role === 'assistant' && m.streaming ? (
                  m.text ? (
                    m.text
                  ) : (
                    <span className="ai-chat-thinking">Thinking…</span>
                  )
                ) : m.role === 'assistant' ? (
                  <ChatMarkdown content={m.text} />
                ) : (
                  m.text
                )}
                {m.role === 'assistant' && !m.streaming && m.text ? (
                  <button
                    type="button"
                    className="ai-chat-copy-btn"
                    onClick={() => copyToClipboard(m.text)}
                    title="Copy message"
                  >
                    <IconCopy size={12} strokeWidth={1.5} />
                  </button>
                ) : null}
              </div>
            </div>
          ))
        )}
        <div ref={listEndRef} />
      </div>

      <div className="ai-chat-input-area">
        {hint && (
          <div className="ai-chat-hint">
            <span className="ai-chat-hint-warn">{hint}</span>
          </div>
        )}
        <div className="ai-chat-input-row">
          <textarea
            ref={inputRef}
            className="ai-chat-input"
            rows={4}
            placeholder="Ask anything… (Enter to send, Shift+Enter for newline)"
            value={input}
            disabled={pending || !workspacePath}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            data-testid="ai-chat-input"
          />
          {pending ? (
            <button
              type="button"
              className="ai-chat-send stop"
              onClick={handleStop}
              title="Stop"
              data-testid="ai-chat-stop"
            >
              <IconSquare size={14} strokeWidth={2} />
            </button>
          ) : (
            <button
              type="button"
              className="ai-chat-send"
              onClick={handleSend}
              disabled={!input.trim() || !workspacePath}
              title="Send"
              data-testid="ai-chat-send"
            >
              <IconSend size={14} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </StyledWrapper>
  );
};

export default AiChatPanel;
