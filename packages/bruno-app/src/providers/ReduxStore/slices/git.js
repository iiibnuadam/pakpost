import { createSlice } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';

const initialState = {
  // Map of collectionUid -> { status, logs, branches, currentBranch, diff, selectedFile, visualDiff, graph, commitFiles, loading, error }
  collectionGit: {},
  // Map of workspaceUid -> { autoCommit, autoPush, autoPull, autoPullInterval, gitUsername, gitToken }
  workspaceSettings: {},
  // Credentials modal state
  credentialsModal: {
    workspaceUid: null,
    reason: null
  }
};

const DEFAULT_AUTO_PULL_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const gitSlice = createSlice({
  name: 'git',
  initialState,
  reducers: {
    setGitLoading: (state, action) => {
      const { collectionUid, loading } = action.payload;
      if (!state.collectionGit[collectionUid]) {
        state.collectionGit[collectionUid] = {};
      }
      state.collectionGit[collectionUid].loading = loading;
    },
    setGitError: (state, action) => {
      const { collectionUid, error } = action.payload;
      if (!state.collectionGit[collectionUid]) {
        state.collectionGit[collectionUid] = {};
      }
      state.collectionGit[collectionUid].error = error;
    },
    setGitStatus: (state, action) => {
      const { collectionUid, status } = action.payload;
      if (!state.collectionGit[collectionUid]) {
        state.collectionGit[collectionUid] = {};
      }
      state.collectionGit[collectionUid].status = status;
      state.collectionGit[collectionUid].error = null;
    },
    setGitLogs: (state, action) => {
      const { collectionUid, logs } = action.payload;
      if (!state.collectionGit[collectionUid]) {
        state.collectionGit[collectionUid] = {};
      }
      state.collectionGit[collectionUid].logs = logs;
    },
    setGitBranches: (state, action) => {
      const { collectionUid, branches, currentBranch } = action.payload;
      if (!state.collectionGit[collectionUid]) {
        state.collectionGit[collectionUid] = {};
      }
      state.collectionGit[collectionUid].branches = branches;
      state.collectionGit[collectionUid].currentBranch = currentBranch;
    },
    setGitDiff: (state, action) => {
      const { collectionUid, filePath, diff, visualDiff } = action.payload;
      if (!state.collectionGit[collectionUid]) {
        state.collectionGit[collectionUid] = {};
      }
      state.collectionGit[collectionUid].selectedFile = filePath;
      state.collectionGit[collectionUid].diff = diff;
      state.collectionGit[collectionUid].visualDiff = visualDiff;
    },
    clearGitDiff: (state, action) => {
      const { collectionUid } = action.payload;
      if (!state.collectionGit[collectionUid]) return;
      state.collectionGit[collectionUid].selectedFile = null;
      state.collectionGit[collectionUid].diff = null;
      state.collectionGit[collectionUid].visualDiff = null;
    },
    setGitGraph: (state, action) => {
      const { collectionUid, graph } = action.payload;
      if (!state.collectionGit[collectionUid]) {
        state.collectionGit[collectionUid] = {};
      }
      state.collectionGit[collectionUid].graph = graph;
    },
    setCommitFiles: (state, action) => {
      const { collectionUid, commitHash, files } = action.payload;
      if (!state.collectionGit[collectionUid]) {
        state.collectionGit[collectionUid] = {};
      }
      if (!state.collectionGit[collectionUid].commitFiles) {
        state.collectionGit[collectionUid].commitFiles = {};
      }
      state.collectionGit[collectionUid].commitFiles[commitHash] = files;
    },
    setCommitFileDiff: (state, action) => {
      const { collectionUid, commitHash, filePath, diff } = action.payload;
      if (!state.collectionGit[collectionUid]) {
        state.collectionGit[collectionUid] = {};
      }
      if (!state.collectionGit[collectionUid].commitFileDiffs) {
        state.collectionGit[collectionUid].commitFileDiffs = {};
      }
      state.collectionGit[collectionUid].commitFileDiffs[`${commitHash}:${filePath}`] = diff;
    },
    setGitWorkspaceSettings: (state, action) => {
      const { workspaceUid, settings } = action.payload;
      if (!state.workspaceSettings[workspaceUid]) {
        state.workspaceSettings[workspaceUid] = {};
      }
      state.workspaceSettings[workspaceUid] = {
        ...state.workspaceSettings[workspaceUid],
        ...settings
      };
    },
    showGitCredentialsModal: (state, action) => {
      const { workspaceUid, reason } = action.payload;
      state.credentialsModal = { workspaceUid, reason };
    },
    hideGitCredentialsModal: (state) => {
      state.credentialsModal = { workspaceUid: null, reason: null };
    },
    clearGitState: (state, action) => {
      const { collectionUid } = action.payload;
      delete state.collectionGit[collectionUid];
    }
  }
});

export const {
  setGitLoading,
  setGitError,
  setGitStatus,
  setGitLogs,
  setGitBranches,
  setGitDiff,
  clearGitDiff,
  setGitGraph,
  setCommitFiles,
  setCommitFileDiff,
  setGitWorkspaceSettings,
  showGitCredentialsModal,
  hideGitCredentialsModal,
  clearGitState
} = gitSlice.actions;

export const findWorkspaceUidByCollectionUid = (state, collectionUid) => {
  const workspaces = state.workspaces?.workspaces || [];
  for (const workspace of workspaces) {
    const collections = workspace.collections || [];
    if (collections.some((c) => c.uid === collectionUid)) {
      return workspace.uid;
    }
  }
  return state.workspaces?.activeWorkspaceUid || null;
};

export const getGitWorkspaceSettings = (state, workspaceUid) => {
  const settings = state.git.workspaceSettings[workspaceUid] || {};
  return {
    autoCommit: settings.autoCommit ?? true,
    autoPush: settings.autoPush ?? true,
    autoPull: settings.autoPull ?? true,
    autoPullInterval: settings.autoPullInterval ?? DEFAULT_AUTO_PULL_INTERVAL,
    gitUsername: settings.gitUsername || '',
    gitToken: settings.gitToken || ''
  };
};

export const fetchGitStatus = (collection, options = {}) => async (dispatch) => {
  if (!collection?.pathname) return;

  const { skipLogs, silent } = options;

  if (!silent) {
    dispatch(setGitLoading({ collectionUid: collection.uid, loading: true }));
  }
  try {
    const { ipcRenderer } = window;
    const status = await ipcRenderer.invoke('renderer:get-collection-git-status', {
      collectionPath: collection.pathname
    });
    dispatch(setGitStatus({ collectionUid: collection.uid, status }));

    if (status.isGitRepo) {
      if (!skipLogs) {
        const logs = await ipcRenderer.invoke('renderer:get-collection-git-logs', {
          collectionPath: collection.pathname
        });
        dispatch(setGitLogs({ collectionUid: collection.uid, logs }));
      }
      dispatch(setGitBranches({
        collectionUid: collection.uid,
        branches: status.branches || [],
        currentBranch: status.currentBranch
      }));
    }
  } catch (error) {
    console.error('[Git] Error fetching status:', error);
    dispatch(setGitError({ collectionUid: collection.uid, error: error.message }));
  } finally {
    if (!silent) {
      dispatch(setGitLoading({ collectionUid: collection.uid, loading: false }));
    }
  }
};

export const fetchGitDiff = (collection, filePath, type = 'unstaged') => async (dispatch) => {
  if (!collection?.pathname) return;

  try {
    const { ipcRenderer } = window;
    const result = await ipcRenderer.invoke('renderer:get-collection-git-diff', {
      collectionPath: collection.pathname,
      filePath,
      type
    });
    dispatch(setGitDiff({
      collectionUid: collection.uid,
      filePath,
      diff: result.diff,
      visualDiff: result.visualDiff
    }));
  } catch (error) {
    console.error('[Git] Error fetching diff:', error);
    dispatch(setGitError({ collectionUid: collection.uid, error: error.message }));
  }
};

export const stageGitFiles = (collection, filePaths) => async (dispatch) => {
  if (!collection?.pathname || !filePaths?.length) return;

  try {
    const { ipcRenderer } = window;
    await ipcRenderer.invoke('renderer:stage-git-files', {
      collectionPath: collection.pathname,
      filePaths
    });
    dispatch(fetchGitStatus(collection, { skipLogs: true }));
  } catch (error) {
    console.error('[Git] Error staging files:', error);
    throw error;
  }
};

export const unstageGitFiles = (collection, filePaths) => async (dispatch) => {
  if (!collection?.pathname || !filePaths?.length) return;

  try {
    const { ipcRenderer } = window;
    await ipcRenderer.invoke('renderer:unstage-git-files', {
      collectionPath: collection.pathname,
      filePaths
    });
    dispatch(fetchGitStatus(collection, { skipLogs: true }));
  } catch (error) {
    console.error('[Git] Error unstaging files:', error);
    throw error;
  }
};

export const discardGitChanges = (collection, filePaths) => async (dispatch) => {
  if (!collection?.pathname || !filePaths?.length) return;

  try {
    const { ipcRenderer } = window;
    await ipcRenderer.invoke('renderer:discard-git-changes', {
      collectionPath: collection.pathname,
      filePaths
    });
    dispatch(fetchGitStatus(collection, { skipLogs: true }));
  } catch (error) {
    console.error('[Git] Error discarding changes:', error);
    throw error;
  }
};

export const commitGitChanges = (collection, message) => async (dispatch) => {
  if (!collection?.pathname || !message?.trim()) return;

  try {
    const { ipcRenderer } = window;
    await ipcRenderer.invoke('renderer:commit-git-changes', {
      collectionPath: collection.pathname,
      message
    });
    dispatch(fetchGitStatus(collection, { skipLogs: true }));
  } catch (error) {
    console.error('[Git] Error committing changes:', error);
    throw error;
  }
};

export const checkoutGitBranch = (collection, branchName) => async (dispatch) => {
  if (!collection?.pathname || !branchName) return;

  try {
    const { ipcRenderer } = window;
    await ipcRenderer.invoke('renderer:checkout-git-branch', {
      collectionPath: collection.pathname,
      branchName
    });
    dispatch(fetchGitStatus(collection, { skipLogs: true }));
  } catch (error) {
    console.error('[Git] Error checking out branch:', error);
    throw error;
  }
};

export const resolveGitConflict = (collection, filePath, strategy) => async (dispatch) => {
  if (!collection?.pathname || !filePath || !strategy) return;

  try {
    const { ipcRenderer } = window;
    await ipcRenderer.invoke('renderer:resolve-git-conflict', {
      collectionPath: collection.pathname,
      filePath,
      strategy
    });
    await dispatch(fetchGitStatus(collection, { skipLogs: true }));
  } catch (error) {
    console.error('[Git] Error resolving conflict:', error);
    dispatch(setGitError({ collectionUid: collection.uid, error: error.message }));
    throw error;
  }
};

export const abortGitMerge = (collection) => async (dispatch) => {
  if (!collection?.pathname) return;

  try {
    const { ipcRenderer } = window;
    await ipcRenderer.invoke('renderer:abort-git-merge', {
      collectionPath: collection.pathname
    });
    await dispatch(fetchGitStatus(collection, { skipLogs: true }));
  } catch (error) {
    console.error('[Git] Error aborting merge:', error);
    dispatch(setGitError({ collectionUid: collection.uid, error: error.message }));
    throw error;
  }
};

export const fetchGitChanges = (collection, remote = 'origin') => async (dispatch) => {
  if (!collection?.pathname) return;

  dispatch(setGitLoading({ collectionUid: collection.uid, loading: true }));
  try {
    const { ipcRenderer } = window;
    await ipcRenderer.invoke('renderer:fetch-git-changes', {
      collectionPath: collection.pathname,
      remote
    });
    await dispatch(fetchGitStatus(collection));
  } catch (error) {
    console.error('[Git] Error fetching changes:', error);
    dispatch(setGitError({ collectionUid: collection.uid, error: error.message }));
    throw error;
  } finally {
    dispatch(setGitLoading({ collectionUid: collection.uid, loading: false }));
  }
};

export const pullGitChanges = (collection, options = {}) => async (dispatch) => {
  if (!collection?.pathname) return;

  dispatch(setGitLoading({ collectionUid: collection.uid, loading: true }));
  try {
    const { ipcRenderer } = window;
    await ipcRenderer.invoke('renderer:pull-git-changes', {
      collectionPath: collection.pathname,
      remote: options.remote || 'origin',
      remoteBranch: options.remoteBranch || 'HEAD',
      strategy: options.strategy || '--ff-only'
    });
    await dispatch(fetchGitStatus(collection));
  } catch (error) {
    console.error('[Git] Error pulling changes:', error);
    const message = error.message || 'Failed to pull';
    if (isConflictError(error)) {
      toast.error(`Git: Merge conflict detected. Please resolve conflicts manually.`);
    }
    dispatch(setGitError({ collectionUid: collection.uid, error: message }));
    throw error;
  } finally {
    dispatch(setGitLoading({ collectionUid: collection.uid, loading: false }));
  }
};

const isAuthError = (error) => {
  if (!error) return false;
  const message = typeof error === 'string' ? error : error.message || '';
  const lower = message.toLowerCase();
  return (
    lower.includes('authentication')
    || lower.includes('credential')
    || lower.includes('401')
    || lower.includes('403')
    || lower.includes('Unauthorized'.toLowerCase())
    || lower.includes('Forbidden'.toLowerCase())
    || lower.includes('could not resolve password')
    || lower.includes('could not resolve username')
    || lower.includes('terminal prompts disabled')
  );
};

const isBehindError = (error) => {
  if (!error) return false;
  const message = typeof error === 'string' ? error : error.message || '';
  const lower = message.toLowerCase();
  return (
    lower.includes('non-fast-forward')
    || lower.includes('rejected')
    || lower.includes('failed to push')
    || lower.includes('cannot fast-forward')
    || lower.includes('not possible to fast-forward')
    || lower.includes('would be overwritten')
    || lower.includes('remote contains work')
  );
};

const isConflictError = (error) => {
  if (!error) return false;
  const message = typeof error === 'string' ? error : error.message || '';
  const lower = message.toLowerCase();
  return (
    lower.includes('conflict')
    || lower.includes('merge conflict')
    || lower.includes('unmerged')
    || lower.includes('could not apply')
  );
};

export const pushGitChanges = (collection, options = {}) => async (dispatch, getState) => {
  if (!collection?.pathname) return;

  const state = getState();
  const workspaceUid = findWorkspaceUidByCollectionUid(state, collection.uid);
  const settings = getGitWorkspaceSettings(state, workspaceUid);

  dispatch(setGitLoading({ collectionUid: collection.uid, loading: true }));
  try {
    const { ipcRenderer } = window;
    await ipcRenderer.invoke('renderer:push-git-changes', {
      collectionPath: collection.pathname,
      remote: options.remote || 'origin',
      remoteBranch: options.remoteBranch || 'HEAD',
      username: settings.gitUsername,
      password: settings.gitToken
    });
    await dispatch(fetchGitStatus(collection, { skipLogs: true }));
  } catch (error) {
    console.error('[Git] Error pushing changes:', error);
    const message = error.message || 'Failed to push';
    if (isAuthError(error) && workspaceUid) {
      dispatch(showGitCredentialsModal({ workspaceUid, reason: settings.gitUsername ? 'expired' : 'missing' }));
    } else if (isBehindError(error)) {
      toast.error('Git: Remote has new commits. Please pull before pushing.');
      dispatch(setGitError({ collectionUid: collection.uid, error: 'Remote has new commits. Please pull before pushing.' }));
    } else if (isConflictError(error)) {
      toast.error('Git: Push blocked by merge conflict. Please resolve conflicts first.');
      dispatch(setGitError({ collectionUid: collection.uid, error: 'Push blocked by merge conflict. Please resolve conflicts first.' }));
    } else {
      dispatch(setGitError({ collectionUid: collection.uid, error: message }));
    }
    throw error;
  } finally {
    dispatch(setGitLoading({ collectionUid: collection.uid, loading: false }));
  }
};

const formatTimestamp = (date = new Date()) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const buildAutoCommitMessage = (collectionName, changedFiles) => {
  const timestamp = formatTimestamp();
  const fileList = changedFiles.length
    ? changedFiles.map((file) => `  - ${file.path}`).join('\n')
    : '  - (no files detected)';

  return [
    `Auto commit at ${timestamp}`,
    ``,
    `Workspace: ${collectionName || 'Untitled'}`,
    `Changed files (${changedFiles.length}):`,
    fileList
  ].join('\n');
};

export const autoCommitAndPush = (collection, workspaceUid) => async (dispatch, getState) => {
  if (!collection?.pathname) return;

  const state = getState();
  const resolvedWorkspaceUid = workspaceUid || findWorkspaceUidByCollectionUid(state, collection.uid);
  const settings = getGitWorkspaceSettings(state, resolvedWorkspaceUid);

  if (!settings.autoCommit) return;

  dispatch(setGitLoading({ collectionUid: collection.uid, loading: true }));
  try {
    const { ipcRenderer } = window;

    // Get current status
    const status = await ipcRenderer.invoke('renderer:get-collection-git-status', {
      collectionPath: collection.pathname
    });

    if (!status.isGitRepo) {
      return;
    }

    const conflicted = status.conflicted || [];
    if (conflicted.length > 0) {
      const message = 'Unresolved merge conflicts. Please resolve them before auto-commit.';
      dispatch(setGitError({ collectionUid: collection.uid, error: message }));
      toast.error(`Git: ${message}`);
      return;
    }

    const allChanged = [
      ...(status.staged || []),
      ...(status.unstaged || [])
    ];

    if (allChanged.length === 0) {
      return;
    }

    // Stage all changes
    const unstagedPaths = (status.unstaged || []).map((file) => file.path);
    if (unstagedPaths.length > 0) {
      await ipcRenderer.invoke('renderer:stage-git-files', {
        collectionPath: collection.pathname,
        filePaths: unstagedPaths
      });
    }

    // Build commit message with timestamp + changed files
    const commitMessage = buildAutoCommitMessage(collection.name, allChanged);

    // Commit
    await ipcRenderer.invoke('renderer:commit-git-changes', {
      collectionPath: collection.pathname,
      message: commitMessage
    });

    // Push if enabled
    if (settings.autoPush) {
      try {
        await ipcRenderer.invoke('renderer:push-git-changes', {
          collectionPath: collection.pathname,
          remote: 'origin',
          remoteBranch: 'HEAD',
          username: settings.gitUsername,
          password: settings.gitToken
        });
      } catch (pushError) {
        console.error('[Git] Auto push failed:', pushError);
        if (isAuthError(pushError) && workspaceUid) {
          dispatch(showGitCredentialsModal({ workspaceUid, reason: settings.gitUsername ? 'expired' : 'missing' }));
        } else if (isBehindError(pushError)) {
          toast.error('Git: Remote has new commits. Auto-push skipped; please pull first.');
          dispatch(setGitError({ collectionUid: collection.uid, error: 'Remote has new commits. Please pull before pushing.' }));
        } else if (isConflictError(pushError)) {
          toast.error('Git: Push blocked by merge conflict. Please resolve conflicts first.');
          dispatch(setGitError({ collectionUid: collection.uid, error: 'Push blocked by merge conflict. Please resolve conflicts first.' }));
        } else {
          dispatch(setGitError({ collectionUid: collection.uid, error: pushError.message || 'Auto-push failed' }));
        }
        // Don't fail the whole auto-commit just because push failed
      }
    }

    // Refresh status without disturbing the History view
    await dispatch(fetchGitStatus(collection, { skipLogs: true }));
  } catch (error) {
    console.error('[Git] Auto commit failed:', error);
    dispatch(setGitError({ collectionUid: collection.uid, error: error.message }));
    throw error;
  } finally {
    dispatch(setGitLoading({ collectionUid: collection.uid, loading: false }));
  }
};

export const fetchGitGraph = (collection, options = {}) => async (dispatch) => {
  if (!collection?.pathname) return;

  dispatch(setGitLoading({ collectionUid: collection.uid, loading: true }));
  try {
    const { ipcRenderer } = window;
    const graph = await ipcRenderer.invoke('renderer:get-collection-git-graph', {
      collectionPath: collection.pathname,
      branchName: options.branchName,
      limit: options.limit || 50
    });
    dispatch(setGitGraph({ collectionUid: collection.uid, graph }));
  } catch (error) {
    console.error('[Git] Error fetching graph:', error);
    dispatch(setGitError({ collectionUid: collection.uid, error: error.message }));
  } finally {
    dispatch(setGitLoading({ collectionUid: collection.uid, loading: false }));
  }
};

export const fetchCommitFiles = (collection, commitHash) => async (dispatch) => {
  if (!collection?.pathname || !commitHash) return;

  try {
    const { ipcRenderer } = window;
    const files = await ipcRenderer.invoke('renderer:get-commit-files', {
      collectionPath: collection.pathname,
      commitHash
    });
    dispatch(setCommitFiles({ collectionUid: collection.uid, commitHash, files }));
  } catch (error) {
    console.error('[Git] Error fetching commit files:', error);
  }
};

export const fetchCommitFileDiff = (collection, commitHash, filePath) => async (dispatch) => {
  if (!collection?.pathname || !commitHash || !filePath) return;

  try {
    const { ipcRenderer } = window;
    const diff = await ipcRenderer.invoke('renderer:get-commit-file-diff', {
      collectionPath: collection.pathname,
      commitHash,
      filePath
    });
    dispatch(setCommitFileDiff({ collectionUid: collection.uid, commitHash, filePath, diff }));
  } catch (error) {
    console.error('[Git] Error fetching commit file diff:', error);
  }
};

export const updateGitWorkspaceSettings = (workspaceUid, settings) => (dispatch) => {
  dispatch(setGitWorkspaceSettings({ workspaceUid, settings }));
};

export default gitSlice.reducer;
