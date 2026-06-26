const locks = new Map();

const getRepoQueue = (gitRootPath) => {
  if (!locks.has(gitRootPath)) {
    locks.set(gitRootPath, Promise.resolve());
  }
  return locks.get(gitRootPath);
};

const setRepoQueue = (gitRootPath, promise) => {
  locks.set(gitRootPath, promise);
};

const withGitLock = async (gitRootPath, operation) => {
  if (!gitRootPath) {
    return operation();
  }

  const current = getRepoQueue(gitRootPath);
  const next = current
    .catch(() => {})
    .then(() => operation())
    .finally(() => {
      if (getRepoQueue(gitRootPath) === next) {
        locks.delete(gitRootPath);
      }
    });

  setRepoQueue(gitRootPath, next);
  return next;
};

module.exports = {
  withGitLock
};
