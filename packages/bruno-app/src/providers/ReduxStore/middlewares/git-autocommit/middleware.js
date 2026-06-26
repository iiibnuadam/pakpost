import { autoCommitAndPush, findWorkspaceUidByCollectionUid, getGitWorkspaceSettings } from '../../slices/git';

// Actions that indicate a collection file was just created, saved, or deleted.
// File-watcher events are included so that any disk change (new request/folder/env,
// external edits, rename, delete) can trigger auto-commit.
const trackedActionTypes = [
  'collections/saveRequest',
  'collections/saveCollectionDraft',
  'collections/saveFolderDraft',
  'collections/saveEnvironment',
  'collections/collectionAddFileEvent',
  'collections/collectionChangeFileEvent',
  'collections/collectionUnlinkFileEvent',
  'collections/collectionAddDirectoryEvent',
  'collections/collectionUnlinkDirectoryEvent',
  'collections/collectionAddEnvFileEvent',
  'collections/collectionUnlinkEnvFileEvent'
];

// Global environment actions affect the workspace, so they should also trigger
// workspace-level auto-commit.
const trackedGlobalEnvActionTypes = [
  'global-environments/_saveGlobalEnvironment',
  'global-environments/_addGlobalEnvironment',
  'global-environments/_renameGlobalEnvironment',
  'global-environments/_deleteGlobalEnvironment'
];

const getCollectionUidFromAction = (action) => {
  if (action.payload?.collectionUid) {
    return action.payload.collectionUid;
  }

  const fileMeta = action.payload?.file?.meta;
  const directoryMeta = action.payload?.directory?.meta;
  const envMeta = action.payload?.meta;

  return fileMeta?.collectionUid || directoryMeta?.collectionUid || envMeta?.collectionUid;
};

const findWorkspaceByUid = (state, workspaceUid) => {
  return state.workspaces?.workspaces?.find((w) => w.uid === workspaceUid) || null;
};

// Debounce auto-commit per workspace so rapid saves across collections result in a single commit
const pendingTimers = {};

const scheduleAutoCommit = (workspaceUid, dispatch, getState) => {
  clearTimeout(pendingTimers[workspaceUid]);
  pendingTimers[workspaceUid] = setTimeout(() => {
    const state = getState();
    const workspace = findWorkspaceByUid(state, workspaceUid);
    if (!workspace?.pathname) return;

    const settings = getGitWorkspaceSettings(state, workspaceUid);
    if (!settings.autoCommit) return;

    const gitTarget = {
      uid: workspace.uid,
      pathname: workspace.pathname,
      name: workspace.name
    };

    dispatch(autoCommitAndPush(gitTarget, workspaceUid));
    delete pendingTimers[workspaceUid];
  }, 1000);
};

export const gitAutoCommitMiddleware = ({ dispatch, getState }) => (next) => (action) => {
  const result = next(action);

  const state = getState();
  let workspaceUid = null;

  if (trackedActionTypes.includes(action.type)) {
    const collectionUid = getCollectionUidFromAction(action);
    if (!collectionUid) return result;
    workspaceUid = findWorkspaceUidByCollectionUid(state, collectionUid);
  } else if (trackedGlobalEnvActionTypes.includes(action.type)) {
    workspaceUid = state.workspaces?.activeWorkspaceUid;
  } else {
    return result;
  }

  if (!workspaceUid) return result;

  const settings = getGitWorkspaceSettings(state, workspaceUid);
  if (!settings.autoCommit) return result;

  scheduleAutoCommit(workspaceUid, dispatch, getState);

  return result;
};
