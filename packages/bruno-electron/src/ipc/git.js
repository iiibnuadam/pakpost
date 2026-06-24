const { ipcMain } = require('electron');
const path = require('path');
const {
  cloneGitRepository,
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
  getAheadBehindCount,
  fetchChanges,
  pushGitChanges,
  pullGitChanges,
  resolveConflict,
  abortConflictResolution,
  getGitGraph,
  getCommitFiles,
  getCommitFileDiff
} = require('../utils/git');
const { createDirectory, removeDirectory } = require('../utils/filesystem');
const { uuid } = require('../utils/common');

const registerGitIpc = (mainWindow) => {
  ipcMain.handle('renderer:clone-git-repository', async (event, { url, path, processUid }) => {
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
  });

  ipcMain.handle('renderer:get-collection-git-status', async (event, { collectionPath }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        return { isGitRepo: false };
      }

      const [status, branches, currentBranch, aheadBehind] = await Promise.all([
        getChangedFilesInCollectionGit(gitRootPath, collectionPath),
        getCollectionGitBranches(gitRootPath),
        getCurrentGitBranch(gitRootPath),
        getAheadBehindCount(gitRootPath)
      ]);

      return {
        isGitRepo: true,
        gitRootPath,
        ...status,
        branches,
        currentBranch,
        ahead: aheadBehind.ahead,
        behind: aheadBehind.behind
      };
    } catch (error) {
      return Promise.reject(error);
    }
  });

  ipcMain.handle('renderer:get-collection-git-logs', async (event, { collectionPath }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        return [];
      }
      return await getCollectionGitLogs(gitRootPath);
    } catch (error) {
      return Promise.reject(error);
    }
  });

  ipcMain.handle('renderer:get-collection-git-diff', async (event, { collectionPath, filePath, type }) => {
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
  });

  ipcMain.handle('renderer:stage-git-files', async (event, { collectionPath, filePaths }) => {
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
  });

  ipcMain.handle('renderer:unstage-git-files', async (event, { collectionPath, filePaths }) => {
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
  });

  ipcMain.handle('renderer:discard-git-changes', async (event, { collectionPath, filePaths }) => {
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
  });

  ipcMain.handle('renderer:commit-git-changes', async (event, { collectionPath, message }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        throw new Error('Not a git repository');
      }
      return await commitChanges(gitRootPath, message);
    } catch (error) {
      return Promise.reject(error);
    }
  });

  ipcMain.handle('renderer:checkout-git-branch', async (event, { collectionPath, branchName }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        throw new Error('Not a git repository');
      }
      return await checkoutGitBranch(mainWindow, { gitRootPath, branchName });
    } catch (error) {
      return Promise.reject(error);
    }
  });

  ipcMain.handle('renderer:fetch-git-changes', async (event, { collectionPath, remote }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        throw new Error('Not a git repository');
      }
      return await fetchChanges(gitRootPath, remote || 'origin');
    } catch (error) {
      return Promise.reject(error);
    }
  });

  ipcMain.handle('renderer:pull-git-changes', async (event, { collectionPath, remote, remoteBranch, strategy }) => {
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
        strategy: strategy || '--ff-only'
      });
    } catch (error) {
      return Promise.reject(error);
    }
  });

  ipcMain.handle('renderer:push-git-changes', async (event, { collectionPath, remote, remoteBranch, username, password }) => {
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
  });

  ipcMain.handle('renderer:get-collection-git-graph', async (event, { collectionPath, branchName, limit }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        return { commits: [], branches: [], hasMore: false };
      }
      return await getGitGraph(gitRootPath, branchName, limit);
    } catch (error) {
      return Promise.reject(error);
    }
  });

  ipcMain.handle('renderer:get-commit-files', async (event, { collectionPath, commitHash }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        return [];
      }
      return await getCommitFiles(gitRootPath, commitHash);
    } catch (error) {
      return Promise.reject(error);
    }
  });

  ipcMain.handle('renderer:get-commit-file-diff', async (event, { collectionPath, commitHash, filePath }) => {
    try {
      const gitRootPath = getCollectionGitRootPath(collectionPath);
      if (!gitRootPath) {
        return '';
      }
      return await getCommitFileDiff(gitRootPath, commitHash, filePath);
    } catch (error) {
      return Promise.reject(error);
    }
  });

  ipcMain.handle('renderer:resolve-git-conflict', async (event, { collectionPath, filePath, strategy }) => {
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
  });

  ipcMain.handle('renderer:abort-git-merge', async (event, { collectionPath }) => {
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
  });
};

module.exports = registerGitIpc;
