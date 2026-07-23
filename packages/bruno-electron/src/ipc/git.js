const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const {
  cloneGitRepository,
  initGitRepo,
  getCollectionGitRootPath,
  getChangedFilesInCollectionGit,
  getCollectionGitLogs,
  getCollectionGitBranches,
  getCurrentGitBranch,
  getStagedFileDiff,
  getUnstagedFileDiff,
  getRenamedFileDiff,
  getWorkingFileContentForVisualDiff,
  stageChanges,
  unstageChanges,
  commitChanges,
  discardChanges,
  checkoutGitBranch,
  createGitBranch,
  deleteGitBranch,
  mergeGitBranch,
  getAheadBehindCount,
  fetchChanges,
  pushGitChanges,
  pullGitChanges,
  checkPullStatus,
  resolveConflict,
  readConflictFile,
  saveConflictFile,
  abortConflictResolution,
  createStash,
  listStashes,
  applyStash,
  dropStash,
  popStash,
  continueRebase,
  abortRebase,
  getGitGraph,
  getCommitFiles,
  getCommitFileDiff
} = require('../utils/git');
const { createDirectory, removeDirectory } = require('../utils/filesystem');
const { uuid } = require('../utils/common');
const { withGitLock } = require('../utils/gitLock');

const registerGitIpc = (mainWindow) => {
  const withRepoLock = (handler) => async (event, args) => {
    const collectionPath = args?.collectionPath;
    const gitRootPath = collectionPath ? getCollectionGitRootPath(collectionPath) : null;
    if (!gitRootPath) {
      return handler(event, args);
    }
    return withGitLock(gitRootPath, () => handler(event, args));
  };

  ipcMain.handle('renderer:clone-git-repository', withRepoLock(async (event, { url, path, processUid }) => {
    let directoryCreated = false;
    try {
      await createDirectory(path);
      directoryCreated = true;
      await cloneGitRepository(mainWindow, { url, path, processUid });
      return 'Repository cloned successfully';
    } catch (error) {
      if (directoryCreated) {
        await removeDirectory(path);
      }
      return Promise.reject(error);
    }
  }));

  ipcMain.handle('renderer:init-git-repo', withRepoLock(async (event, { collectionPath, remoteUrl }) => {
    try {
      if (!collectionPath || !fs.existsSync(collectionPath)) {
        throw new Error('Collection path does not exist');
      }
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (gitRootPath) {
        throw new Error('This workspace is already a Git repository');
      }
      await initGitRepo(collectionPath, remoteUrl);
      return true;
    } catch (error) {
      return Promise.reject(error);
    }
  }));

  ipcMain.handle('renderer:get-collection-git-status', withRepoLock(async (event, { collectionPath }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        return { isGitRepo: false };
      }

      const [status, branches, currentBranch, aheadBehind] = await Promise.all([
        getChangedFilesInCollectionGit(gitRootPath, collectionPath),
        getCollectionGitBranches(gitRootPath, true),
        getCurrentGitBranch(gitRootPath),
        getAheadBehindCount(gitRootPath)
      ]);

      const mergeHeadPath = path.join(gitRootPath, '.git', 'MERGE_HEAD');
      const rebaseMergePath = path.join(gitRootPath, '.git', 'rebase-merge');
      const rebaseApplyPath = path.join(gitRootPath, '.git', 'rebase-apply');

      return {
        isGitRepo: true,
        gitRootPath,
        ...status,
        branches,
        currentBranch,
        ahead: aheadBehind.ahead,
        behind: aheadBehind.behind,
        isMerging: fs.existsSync(mergeHeadPath),
        isRebasing: fs.existsSync(rebaseMergePath) || fs.existsSync(rebaseApplyPath)
      };
    } catch (error) {
      return Promise.reject(error);
    }
  }));

  ipcMain.handle('renderer:get-collection-git-logs', withRepoLock(async (event, { collectionPath }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        return [];
      }
      return await getCollectionGitLogs(gitRootPath);
    } catch (error) {
      return Promise.reject(error);
    }
  }));

  ipcMain.handle('renderer:get-collection-git-diff', withRepoLock(async (event, { collectionPath, filePath, type }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        return { diff: '', visualDiff: null };
      }

      const fullFilePath = path.join(gitRootPath, filePath);
      let diff = '';

      if (type === 'staged') {
        diff = await getStagedFileDiff(gitRootPath, fullFilePath);
      } else if (type === 'renamed') {
        diff = await getRenamedFileDiff(gitRootPath, { to: fullFilePath });
      } else {
        diff = await getUnstagedFileDiff(gitRootPath, fullFilePath);
      }

      const visualDiff = await getWorkingFileContentForVisualDiff(gitRootPath, filePath, type === 'renamed' ? 'staged' : type);

      return { diff, visualDiff };
    } catch (error) {
      return Promise.reject(error);
    }
  }));

  ipcMain.handle('renderer:stage-git-files', withRepoLock(async (event, { collectionPath, filePaths }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        throw new Error('Not a git repository');
      }
      const absolutePaths = filePaths.map((fp) => path.join(gitRootPath, fp));
      await stageChanges(gitRootPath, absolutePaths);
      return true;
    } catch (error) {
      return Promise.reject(error);
    }
  }));

  ipcMain.handle('renderer:unstage-git-files', withRepoLock(async (event, { collectionPath, filePaths }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        throw new Error('Not a git repository');
      }
      const absolutePaths = filePaths.map((fp) => path.join(gitRootPath, fp));
      await unstageChanges(gitRootPath, absolutePaths);
      return true;
    } catch (error) {
      return Promise.reject(error);
    }
  }));

  ipcMain.handle('renderer:discard-git-changes', withRepoLock(async (event, { collectionPath, filePaths }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        throw new Error('Not a git repository');
      }
      const absolutePaths = filePaths.map((fp) => path.join(gitRootPath, fp));
      await discardChanges(gitRootPath, absolutePaths);
      return true;
    } catch (error) {
      return Promise.reject(error);
    }
  }));

  ipcMain.handle('renderer:commit-git-changes', withRepoLock(async (event, { collectionPath, message }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        throw new Error('Not a git repository');
      }
      return await commitChanges(gitRootPath, message);
    } catch (error) {
      return Promise.reject(error);
    }
  }));

  ipcMain.handle('renderer:checkout-git-branch', withRepoLock(async (event, { collectionPath, branchName }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        throw new Error('Not a git repository');
      }
      return await checkoutGitBranch(mainWindow, { gitRootPath, branchName });
    } catch (error) {
      return Promise.reject(error);
    }
  }));

  ipcMain.handle('renderer:fetch-git-changes', withRepoLock(async (event, { collectionPath, remote }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        throw new Error('Not a git repository');
      }
      return await fetchChanges(gitRootPath, remote || 'origin');
    } catch (error) {
      return Promise.reject(error);
    }
  }));

  ipcMain.handle('renderer:pull-git-changes', withRepoLock(async (event, { collectionPath, remote, remoteBranch, strategy, stashBeforePull }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        throw new Error('Not a git repository');
      }
      const processUid = uuid();
      return await pullGitChanges(mainWindow, {
        gitRootPath,
        processUid,
        remote: remote || 'origin',
        remoteBranch: remoteBranch || 'HEAD',
        strategy: strategy || '--ff-only',
        stashBeforePull: Boolean(stashBeforePull)
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }));

  ipcMain.handle('renderer:check-git-pull-status', withRepoLock(async (event, { collectionPath, remote, remoteBranch }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        throw new Error('Not a git repository');
      }
      return await checkPullStatus(gitRootPath, remote || 'origin', remoteBranch || 'HEAD');
    } catch (error) {
      return Promise.reject(error);
    }
  }));

  ipcMain.handle('renderer:push-git-changes', withRepoLock(async (event, { collectionPath, remote, remoteBranch, username, password }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        throw new Error('Not a git repository');
      }
      const processUid = uuid();
      return await pushGitChanges(mainWindow, {
        gitRootPath,
        processUid,
        remote: remote || 'origin',
        remoteBranch: remoteBranch || 'HEAD',
        username,
        password
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }));

  ipcMain.handle('renderer:get-collection-git-graph', withRepoLock(async (event, { collectionPath, branchName, limit }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        return { commits: [], branches: [], hasMore: false };
      }
      return await getGitGraph(gitRootPath, branchName, limit);
    } catch (error) {
      return Promise.reject(error);
    }
  }));

  ipcMain.handle('renderer:get-commit-files', withRepoLock(async (event, { collectionPath, commitHash }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        return [];
      }
      return await getCommitFiles(gitRootPath, commitHash);
    } catch (error) {
      return Promise.reject(error);
    }
  }));

  ipcMain.handle('renderer:get-commit-file-diff', withRepoLock(async (event, { collectionPath, commitHash, filePath }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        return '';
      }
      return await getCommitFileDiff(gitRootPath, commitHash, filePath);
    } catch (error) {
      return Promise.reject(error);
    }
  }));

  ipcMain.handle('renderer:resolve-git-conflict', withRepoLock(async (event, { collectionPath, filePath, strategy }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        throw new Error('Not a git repository');
      }
      await resolveConflict(gitRootPath, filePath, strategy);
      return true;
    } catch (error) {
      return Promise.reject(error);
    }
  }));

  ipcMain.handle('renderer:read-conflict-file', withRepoLock(async (event, { collectionPath, filePath }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        throw new Error('Not a git repository');
      }
      return await readConflictFile(gitRootPath, filePath);
    } catch (error) {
      return Promise.reject(error);
    }
  }));

  ipcMain.handle('renderer:save-conflict-file', withRepoLock(async (event, { collectionPath, filePath, content }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        throw new Error('Not a git repository');
      }
      await saveConflictFile(gitRootPath, filePath, content);
      return true;
    } catch (error) {
      return Promise.reject(error);
    }
  }));

  ipcMain.handle('renderer:abort-git-merge', withRepoLock(async (event, { collectionPath }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        throw new Error('Not a git repository');
      }
      await abortConflictResolution(gitRootPath);
      return true;
    } catch (error) {
      return Promise.reject(error);
    }
  }));

  ipcMain.handle('renderer:pop-git-stash', withRepoLock(async (event, { collectionPath, stashIndex = 0 }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        throw new Error('Not a git repository');
      }
      await popStash(gitRootPath, stashIndex);
      return true;
    } catch (error) {
      return Promise.reject(error);
    }
  }));

  ipcMain.handle('renderer:continue-git-rebase', withRepoLock(async (event, { collectionPath }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        throw new Error('Not a git repository');
      }
      await continueRebase(gitRootPath);
      return true;
    } catch (error) {
      return Promise.reject(error);
    }
  }));

  ipcMain.handle('renderer:abort-git-rebase', withRepoLock(async (event, { collectionPath }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        throw new Error('Not a git repository');
      }
      await abortRebase(gitRootPath);
      return true;
    } catch (error) {
      return Promise.reject(error);
    }
  }));

  ipcMain.handle('renderer:create-git-stash', withRepoLock(async (event, { collectionPath, message }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        throw new Error('Not a git repository');
      }
      await createStash(gitRootPath, message || 'WIP');
      return true;
    } catch (error) {
      return Promise.reject(error);
    }
  }));

  ipcMain.handle('renderer:list-git-stashes', withRepoLock(async (event, { collectionPath }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        return [];
      }
      return await listStashes(gitRootPath);
    } catch (error) {
      return Promise.reject(error);
    }
  }));

  ipcMain.handle('renderer:apply-git-stash', withRepoLock(async (event, { collectionPath, stashIndex }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        throw new Error('Not a git repository');
      }
      await applyStash(gitRootPath, stashIndex);
      return true;
    } catch (error) {
      return Promise.reject(error);
    }
  }));

  ipcMain.handle('renderer:drop-git-stash', withRepoLock(async (event, { collectionPath, stashIndex }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        throw new Error('Not a git repository');
      }
      await dropStash(gitRootPath, stashIndex);
      return true;
    } catch (error) {
      return Promise.reject(error);
    }
  }));

  ipcMain.handle('renderer:create-git-branch', withRepoLock(async (event, { collectionPath, branchName, sourceBranch }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        throw new Error('Not a git repository');
      }
      if (!branchName?.trim()) {
        throw new Error('Branch name is required');
      }
      await createGitBranch(gitRootPath, branchName.trim(), sourceBranch);
      return true;
    } catch (error) {
      return Promise.reject(error);
    }
  }));

  ipcMain.handle('renderer:delete-git-branch', withRepoLock(async (event, { collectionPath, branchName, force }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        throw new Error('Not a git repository');
      }
      await deleteGitBranch(gitRootPath, branchName, force);
      return true;
    } catch (error) {
      return Promise.reject(error);
    }
  }));

  ipcMain.handle('renderer:merge-git-branch', withRepoLock(async (event, { collectionPath, branchName }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        throw new Error('Not a git repository');
      }
      await mergeGitBranch(gitRootPath, branchName);
      return true;
    } catch (error) {
      return Promise.reject(error);
    }
  }));
};

module.exports = registerGitIpc;
