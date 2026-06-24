import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  IconLoader2,
  IconBrandGit,
  IconRefresh,
  IconDownload,
  IconUpload,
  IconCloudDownload,
  IconGitCommit,
  IconKey
} from '@tabler/icons';
import toast from 'react-hot-toast';
import StyledWrapper from './StyledWrapper';
import GitDiffViewer from '../GitDiffViewer';
import GitCommitDetail from '../GitCommitDetail';
import {
  fetchGitStatus,
  fetchGitDiff,
  clearGitDiff,
  stageGitFiles,
  unstageGitFiles,
  discardGitChanges,
  commitGitChanges,
  checkoutGitBranch,
  fetchGitChanges,
  pullGitChanges,
  pushGitChanges,
  resolveGitConflict,
  abortGitMerge,
  updateGitWorkspaceSettings,
  getGitWorkspaceSettings,
  showGitCredentialsModal
} from 'providers/ReduxStore/slices/git';

const AUTO_PULL_INTERVAL_OPTIONS = [
  { value: 60 * 1000, label: '1 minute' },
  { value: 5 * 60 * 1000, label: '5 minutes' },
  { value: 15 * 60 * 1000, label: '15 minutes' },
  { value: 30 * 60 * 1000, label: '30 minutes' },
  { value: 60 * 60 * 1000, label: '1 hour' }
];

const GitTab = ({ workspace }) => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('changes');
  const [commitMessage, setCommitMessage] = useState('');
  const [historySelectedHash, setHistorySelectedHash] = useState(null);
  const [historyPanelWidth, setHistoryPanelWidth] = useState(320);
  const [isDraggingHistory, setIsDraggingHistory] = useState(false);
  const [changesPanelWidth, setChangesPanelWidth] = useState(320);
  const [isDraggingChanges, setIsDraggingChanges] = useState(false);
  const autoPullTimerRef = useRef(null);
  const historySidebarRef = useRef(null);
  const changesSidebarRef = useRef(null);

  const gitTarget = useMemo(
    () => ({
      uid: workspace?.uid,
      pathname: workspace?.pathname,
      name: workspace?.name
    }),
    [workspace?.uid, workspace?.pathname, workspace?.name]
  );

  const workspaceUid = workspace?.uid;
  const gitState = useSelector((state) => state.git.collectionGit[gitTarget.uid]) || {};
  const settings = useSelector((state) => getGitWorkspaceSettings(state, workspaceUid));

  const { autoCommit, autoPush, autoPull, autoPullInterval, gitUsername, gitToken } = settings;

  const {
    status,
    logs,
    branches,
    currentBranch,
    diff,
    selectedFile,
    loading,
    error
  } = gitState;

  const hasLocalChanges = Boolean(
    status?.staged?.length || status?.unstaged?.length || status?.conflicted?.length
  );

  useEffect(() => {
    dispatch(fetchGitStatus(gitTarget));
  }, [gitTarget.uid, gitTarget.pathname]);

  // Clear diff view when the selected file is no longer in the changed files list
  useEffect(() => {
    if (!selectedFile || !status?.isGitRepo) return;

    const allChangedPaths = [
      ...(status.staged || []),
      ...(status.unstaged || []),
      ...(status.conflicted || [])
    ].map((f) => f.path);

    if (!allChangedPaths.includes(selectedFile)) {
      dispatch(clearGitDiff({ collectionUid: gitTarget.uid }));
    }
  }, [status, selectedFile, gitTarget.uid, dispatch]);

  const isViewingHistoryDetail = activeTab === 'history' && Boolean(historySelectedHash);

  // Interval-based auto-pull (paused while viewing a History commit detail)
  useEffect(() => {
    if (autoPullTimerRef.current) {
      clearInterval(autoPullTimerRef.current);
      autoPullTimerRef.current = null;
    }

    if (!autoPull || !status?.isGitRepo || !workspaceUid || isViewingHistoryDetail) return;

    const runPull = () => {
      if (hasLocalChanges) return;
      dispatch(pullGitChanges(gitTarget)).catch(() => {});
    };

    // Run once immediately if behind and clean
    if (!hasLocalChanges && status?.behind > 0) {
      dispatch(pullGitChanges(gitTarget)).catch(() => {});
    }

    autoPullTimerRef.current = setInterval(runPull, autoPullInterval);

    return () => {
      if (autoPullTimerRef.current) {
        clearInterval(autoPullTimerRef.current);
        autoPullTimerRef.current = null;
      }
    };
  }, [autoPull, autoPullInterval, status?.isGitRepo, hasLocalChanges, gitTarget, dispatch, workspaceUid, isViewingHistoryDetail]);

  // Refresh history logs only when entering the History tab so auto-pull doesn't disturb detail view
  useEffect(() => {
    if (activeTab === 'history' && status?.isGitRepo) {
      dispatch(fetchGitStatus(gitTarget));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, gitTarget, dispatch]);

  const handleHistoryResizeMove = useCallback((e) => {
    if (!historySidebarRef.current) return;
    const sidebarLeft = historySidebarRef.current.getBoundingClientRect().left;
    const newWidth = Math.max(200, Math.min(600, e.clientX - sidebarLeft));
    setHistoryPanelWidth(newWidth);
  }, []);

  const stopHistoryResize = useCallback(() => {
    setIsDraggingHistory(false);
  }, []);

  useEffect(() => {
    if (!isDraggingHistory) return;
    window.addEventListener('mousemove', handleHistoryResizeMove);
    window.addEventListener('mouseup', stopHistoryResize);
    return () => {
      window.removeEventListener('mousemove', handleHistoryResizeMove);
      window.removeEventListener('mouseup', stopHistoryResize);
    };
  }, [isDraggingHistory, handleHistoryResizeMove, stopHistoryResize]);

  const startHistoryResize = (e) => {
    e.preventDefault();
    setIsDraggingHistory(true);
  };

  const handleChangesResizeMove = useCallback((e) => {
    if (!changesSidebarRef.current) return;
    const sidebarLeft = changesSidebarRef.current.getBoundingClientRect().left;
    const newWidth = Math.max(200, Math.min(600, e.clientX - sidebarLeft));
    setChangesPanelWidth(newWidth);
  }, []);

  const stopChangesResize = useCallback(() => {
    setIsDraggingChanges(false);
  }, []);

  useEffect(() => {
    if (!isDraggingChanges) return;
    window.addEventListener('mousemove', handleChangesResizeMove);
    window.addEventListener('mouseup', stopChangesResize);
    return () => {
      window.removeEventListener('mousemove', handleChangesResizeMove);
      window.removeEventListener('mouseup', stopChangesResize);
    };
  }, [isDraggingChanges, handleChangesResizeMove, stopChangesResize]);

  const startChangesResize = (e) => {
    e.preventDefault();
    setIsDraggingChanges(true);
  };

  const updateSetting = (key, value) => {
    if (!workspaceUid) return;
    dispatch(updateGitWorkspaceSettings(workspaceUid, { [key]: value }));
  };

  const handleOpenCredentials = () => {
    if (!workspaceUid) return;
    dispatch(showGitCredentialsModal({ workspaceUid, reason: gitUsername ? 'expired' : 'missing' }));
  };

  const handleRefresh = () => {
    dispatch(fetchGitStatus(gitTarget));
  };

  const handleFetch = () => {
    dispatch(fetchGitChanges(gitTarget))
      .then(() => toast.success('Fetched'))
      .catch((err) => toast.error(err?.message || 'Failed to fetch'));
  };

  const handlePull = () => {
    dispatch(pullGitChanges(gitTarget))
      .then(() => toast.success('Pulled'))
      .catch((err) => toast.error(err?.message || 'Failed to pull'));
  };

  const handlePush = () => {
    if (autoPush && !gitUsername) {
      handleOpenCredentials();
      return;
    }
    dispatch(pushGitChanges(gitTarget))
      .then(() => toast.success('Pushed'))
      .catch((err) => toast.error(err?.message || 'Failed to push'));
  };

  const handleSelectFile = (file, type) => {
    dispatch(fetchGitDiff(gitTarget, file.path, type));
  };

  const handleStage = (file) => {
    dispatch(stageGitFiles(gitTarget, [file.path]))
      .then(() => toast.success('Staged'))
      .catch((err) => toast.error(err?.message || 'Failed to stage'));
  };

  const handleUnstage = (file) => {
    dispatch(unstageGitFiles(gitTarget, [file.path]))
      .then(() => toast.success('Unstaged'))
      .catch((err) => toast.error(err?.message || 'Failed to unstage'));
  };

  const handleDiscard = (file) => {
    if (!window.confirm(`Discard changes to ${file.path}?`)) return;
    dispatch(discardGitChanges(gitTarget, [file.path]))
      .then(() => {
        toast.success('Discarded');
        if (selectedFile === file.path) {
          dispatch(clearGitDiff({ collectionUid: gitTarget.uid }));
        }
      })
      .catch((err) => toast.error(err?.message || 'Failed to discard'));
  };

  const handleResolveConflict = (file, strategy) => {
    dispatch(resolveGitConflict(gitTarget, file.path, strategy))
      .then(() => toast.success(`Resolved ${file.path} (${strategy})`))
      .catch((err) => toast.error(err?.message || 'Failed to resolve conflict'));
  };

  const handleAbortMerge = () => {
    if (!window.confirm('Abort the current merge? This will discard all merge changes.')) return;
    dispatch(abortGitMerge(gitTarget))
      .then(() => toast.success('Merge aborted'))
      .catch((err) => toast.error(err?.message || 'Failed to abort merge'));
  };

  const handleCommit = () => {
    if (!commitMessage.trim()) {
      toast.error('Enter a commit message');
      return;
    }
    dispatch(commitGitChanges(gitTarget, commitMessage))
      .then(() => {
        setCommitMessage('');
        dispatch(clearGitDiff({ collectionUid: gitTarget.uid }));
        toast.success('Committed');
        if (autoPush) {
          return dispatch(pushGitChanges(gitTarget))
            .then(() => toast.success('Pushed'))
            .catch((err) => toast.error(err?.message || 'Auto-push failed'));
        }
      })
      .catch((err) => toast.error(err?.message || 'Failed to commit'));
  };

  const handleBranchChange = (e) => {
    const branchName = e.target.value;
    if (!branchName || branchName === currentBranch) return;
    dispatch(checkoutGitBranch(gitTarget, branchName))
      .then(() => toast.success(`Switched to ${branchName}`))
      .catch((err) => toast.error(err?.message || 'Failed to switch branch'));
  };

  const getFileStatusClass = (file) => {
    if (file.type === 'unstaged') return 'untracked';
    if (file.fileIndex === 'A') return 'added';
    if (file.fileIndex === 'D') return 'deleted';
    if (file.fileIndex === 'M') return 'modified';
    return 'modified';
  };

  const getFileStatusLabel = (file) => {
    if (file.type === 'unstaged') return 'U';
    if (file.fileIndex === 'A') return 'A';
    if (file.fileIndex === 'D') return 'D';
    if (file.fileIndex === 'M') return 'M';
    if (file.fileIndex === 'R') return 'R';
    return '?';
  };

  const stagedFiles = useMemo(() => status?.staged || [], [status]);
  const unstagedFiles = useMemo(() => status?.unstaged || [], [status]);
  const conflictedFiles = useMemo(() => status?.conflicted || [], [status]);

  const renderFileList = (files, type) => {
    if (!files.length) {
      return <div className="git-empty-state">No files</div>;
    }

    return (
      <div className="git-file-list">
        {files.map((file, index) => (
          <div
            key={`${file.path}-${index}`}
            className={`git-file-item ${selectedFile === file.path ? 'selected' : ''}`}
            onClick={() => handleSelectFile(file, type)}
          >
            <span className={`git-file-status ${getFileStatusClass(file)}`}>
              {getFileStatusLabel(file)}
            </span>
            <span className="git-file-path" title={file.path}>
              {file.path}
            </span>
            <div className="git-file-actions" onClick={(e) => e.stopPropagation()}>
              {type === 'conflicted' && (
                <>
                  <button className="git-file-action-btn ours" onClick={() => handleResolveConflict(file, 'ours')}>
                    Ours
                  </button>
                  <button className="git-file-action-btn theirs" onClick={() => handleResolveConflict(file, 'theirs')}>
                    Theirs
                  </button>
                </>
              )}
              {type === 'unstaged' && (
                <button className="git-file-action-btn stage" onClick={() => handleStage(file)}>
                  Stage
                </button>
              )}
              {type === 'staged' && (
                <button className="git-file-action-btn unstage" onClick={() => handleUnstage(file)}>
                  Unstage
                </button>
              )}
              {type !== 'staged' && type !== 'conflicted' && (
                <button className="git-file-action-btn discard" onClick={() => handleDiscard(file)}>
                  Discard
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderChangesTab = () => {
    if (loading && !status?.isGitRepo) {
      return (
        <div className="git-loading">
          <IconLoader2 className="animate-spin" size={18} strokeWidth={1.5} />
          Loading git status...
        </div>
      );
    }

    if (error) {
      return <div className="git-error">{error}</div>;
    }

    if (!status?.isGitRepo) {
      return (
        <div className="git-empty-state">
          This gitTarget is not inside a Git repository.
        </div>
      );
    }

    return (
      <div className="git-tab-content">
        <div
          className="git-sidebar"
          ref={changesSidebarRef}
          style={{ width: changesPanelWidth, minWidth: changesPanelWidth, maxWidth: 'none' }}
        >
          {conflictedFiles.length > 0 && (
            <div className="git-section">
              <div className="git-section-title">
                <span>Conflicted ({conflictedFiles.length})</span>
                <button className="git-action-btn" onClick={handleAbortMerge}>
                  Abort merge
                </button>
              </div>
              {renderFileList(conflictedFiles, 'conflicted')}
            </div>
          )}
          <div className="git-section">
            <div className="git-section-title">
              <span>Staged ({stagedFiles.length})</span>
              {stagedFiles.length > 0 && (
                <button className="git-action-btn" onClick={() => dispatch(unstageGitFiles(gitTarget, stagedFiles.map((f) => f.path)))}>
                  Unstage all
                </button>
              )}
            </div>
            {renderFileList(stagedFiles, 'staged')}
          </div>
          <div className="git-section">
            <div className="git-section-title">
              <span>Changes ({unstagedFiles.length})</span>
              {unstagedFiles.length > 0 && (
                <button className="git-action-btn" onClick={() => dispatch(stageGitFiles(gitTarget, unstagedFiles.map((f) => f.path)))}>
                  Stage all
                </button>
              )}
            </div>
            {renderFileList(unstagedFiles, 'unstaged')}
          </div>
          <div className="git-commit-box">
            <textarea
              className="git-commit-input"
              placeholder="Commit message"
              rows={3}
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
            />
            <button
              className="git-action-btn git-commit-btn"
              onClick={handleCommit}
              disabled={!commitMessage.trim() || stagedFiles.length === 0}
            >
              <IconGitCommit size={14} strokeWidth={1.5} />
              Commit
            </button>
          </div>
        </div>
        <div className="git-resize-handle" onMouseDown={startChangesResize} />
        <div className="git-diff-pane">
          <div className="git-diff-header">
            <div className="git-diff-title">{selectedFile || 'Select a file to view diff'}</div>
          </div>
          <div className="git-diff-container">
            <GitDiffViewer diff={diff} emptyMessage={selectedFile ? 'Loading diff...' : 'Select a file to view diff'} />
          </div>
        </div>
      </div>
    );
  };

  const renderHistoryTab = () => {
    if (loading) {
      return (
        <div className="git-loading">
          <IconLoader2 className="animate-spin" size={18} strokeWidth={1.5} />
          Loading history...
        </div>
      );
    }

    if (!logs || !logs.length) {
      return <div className="git-empty-state">No commits yet</div>;
    }

    const selectedCommit = logs.find((commit) => commit.hash === historySelectedHash);

    return (
      <div className="git-tab-content">
        <div
          className="git-sidebar"
          ref={historySidebarRef}
          style={{ width: historyPanelWidth, minWidth: historyPanelWidth, maxWidth: 'none' }}
        >
          <div className="git-file-list">
            {logs.map((commit) => (
              <div
                key={commit.hash}
                className={`git-commit-row ${historySelectedHash === commit.hash ? 'selected' : ''}`}
                onClick={() => setHistorySelectedHash(commit.hash)}
                title="Click to view details"
              >
                <span className="git-commit-hash">{commit.hash.slice(0, 7)}</span>
                <span className="git-commit-message" title={commit.message}>
                  {commit.message}
                </span>
                <span className="git-commit-meta">{commit.author_name}</span>
                <span className="git-commit-meta">
                  {new Date(commit.date).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="git-resize-handle" onMouseDown={startHistoryResize} />
        <GitCommitDetail gitTarget={gitTarget} commit={selectedCommit} onClose={() => setHistorySelectedHash(null)} />
      </div>
    );
  };

  return (
    <StyledWrapper>
      <div className="git-tab-header">
        <div className="git-tab-title">
          <IconBrandGit size={20} strokeWidth={1.5} className="inline mr-2" />
          Git
        </div>
        <div className="git-branch-row">
          {status?.isGitRepo && (
            <>
              <select className="git-branch-select" value={currentBranch || ''} onChange={handleBranchChange}>
                <option value="" disabled>
                  Select branch
                </option>
                {(branches || []).map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
              {status?.behind > 0 && (
                <span className="git-badge git-badge-behind" title={`${status.behind} commit(s) behind`}>
                  ↓ {status.behind}
                </span>
              )}
              {status?.ahead > 0 && (
                <span className="git-badge git-badge-ahead" title={`${status.ahead} commit(s) ahead`}>
                  ↑ {status.ahead}
                </span>
              )}
            </>
          )}
          <div className="git-header-actions">
            <button className="git-action-btn" onClick={handleFetch} title="Fetch">
              <IconCloudDownload size={14} strokeWidth={1.5} />
              Fetch
            </button>
            <button className="git-action-btn" onClick={handlePull} title="Pull">
              <IconDownload size={14} strokeWidth={1.5} />
              Pull
            </button>
            <button className="git-action-btn" onClick={handlePush} title="Push">
              <IconUpload size={14} strokeWidth={1.5} />
              Push
            </button>
            <button className="git-action-btn" onClick={handleRefresh} title="Refresh">
              <IconRefresh size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      <div className="git-auto-row">
        <label className="git-auto-toggle" title="Automatically commit all changes after every save">
          <input
            type="checkbox"
            checked={autoCommit}
            onChange={(e) => updateSetting('autoCommit', e.target.checked)}
          />
          Auto commit on save
        </label>
        <label className="git-auto-toggle" title="Automatically push after a successful auto-commit or manual commit">
          <input
            type="checkbox"
            checked={autoPush}
            onChange={(e) => updateSetting('autoPush', e.target.checked)}
          />
          Auto push
        </label>
        <label className="git-auto-toggle" title="Automatically pull on an interval">
          <input
            type="checkbox"
            checked={autoPull}
            onChange={(e) => updateSetting('autoPull', e.target.checked)}
          />
          Auto pull
        </label>
        {autoPull && (
          <select
            className="git-interval-select"
            value={autoPullInterval}
            onChange={(e) => updateSetting('autoPullInterval', Number(e.target.value))}
          >
            {AUTO_PULL_INTERVAL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
        <button className="git-action-btn git-credentials-btn" onClick={handleOpenCredentials}>
          <IconKey size={14} strokeWidth={1.5} />
          {gitUsername ? 'Update credentials' : 'Set credentials'}
        </button>
      </div>

      <div className="git-tabs">
        <div
          className={`git-tab ${activeTab === 'changes' ? 'active' : ''}`}
          onClick={() => setActiveTab('changes')}
        >
          Changes
        </div>
        <div
          className={`git-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </div>
      </div>
      {activeTab === 'changes' && renderChangesTab()}
      {activeTab === 'history' && renderHistoryTab()}
    </StyledWrapper>
  );
};

export default GitTab;
