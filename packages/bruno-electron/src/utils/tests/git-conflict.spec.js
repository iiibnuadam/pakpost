const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const {
  getChangedFilesInCollectionGit,
  readConflictStages,
  checkPullStatus,
  resolveConflict,
  discardChanges
} = require('../git');

const CLEAN_ENV = {
  ...process.env,
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_SYSTEM: '/dev/null'
};

const git = (cwd, cmd) => execSync(`git ${cmd}`, { cwd, encoding: 'utf8', env: CLEAN_ENV, stdio: ['ignore', 'pipe', 'pipe'] });
const gitAllowFail = (cwd, cmd) => {
  try {
    git(cwd, cmd);
  } catch (err) {
    // misalnya `git merge` yang exit non-zero karena konflik
  }
};

let tmpDirs = [];

const makeTmpRepo = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pakpost-git-test-'));
  tmpDirs.push(dir);
  git(dir, 'init -b main');
  git(dir, 'config user.email test@example.com');
  git(dir, 'config user.name Test');
  git(dir, 'config commit.gpgsign false');
  return dir;
};

afterEach(() => {
  tmpDirs.forEach((dir) => fs.rmSync(dir, { recursive: true, force: true }));
  tmpDirs = [];
});

// UU conflict: kedua branch mengubah baris yang sama pada file yang sama.
const makeContentConflictRepo = () => {
  const dir = makeTmpRepo();
  fs.writeFileSync(path.join(dir, 'file.txt'), 'base\n');
  git(dir, 'add .');
  git(dir, 'commit -m base');
  git(dir, 'checkout -b feature');
  fs.writeFileSync(path.join(dir, 'file.txt'), 'theirs\n');
  git(dir, 'commit -am theirs');
  git(dir, 'checkout main');
  fs.writeFileSync(path.join(dir, 'file.txt'), 'ours\n');
  git(dir, 'commit -am ours');
  gitAllowFail(dir, 'merge feature');
  return dir;
};

describe('git conflict handling', () => {
  it('detects UU conflicts in git status', async () => {
    const dir = makeContentConflictRepo();

    const result = await getChangedFilesInCollectionGit(dir, dir);

    expect(result.conflicted.map((f) => f.path)).toContain('file.txt');
  });

  it('detects AA (both-added) conflicts in git status', async () => {
    const dir = makeTmpRepo();
    fs.writeFileSync(path.join(dir, 'seed.txt'), 'seed\n');
    git(dir, 'add .');
    git(dir, 'commit -m seed');
    git(dir, 'checkout -b feature');
    fs.writeFileSync(path.join(dir, 'new.txt'), 'added by theirs\n');
    git(dir, 'add .');
    git(dir, 'commit -m theirs-add');
    git(dir, 'checkout main');
    fs.writeFileSync(path.join(dir, 'new.txt'), 'added by ours\n');
    git(dir, 'add .');
    git(dir, 'commit -m ours-add');
    gitAllowFail(dir, 'merge feature');

    const result = await getChangedFilesInCollectionGit(dir, dir);

    expect(result.conflicted.map((f) => f.path)).toContain('new.txt');
  });

  it('reads conflict stages (base/ours/theirs) from the index', async () => {
    const dir = makeContentConflictRepo();

    const stages = await readConflictStages(dir, 'file.txt');

    expect(stages.base.trim()).toBe('base');
    expect(stages.ours.trim()).toBe('ours');
    expect(stages.theirs.trim()).toBe('theirs');
  });

  it('returns null stages for files that are not conflicted', async () => {
    const dir = makeTmpRepo();
    fs.writeFileSync(path.join(dir, 'clean.txt'), 'clean\n');
    git(dir, 'add .');
    git(dir, 'commit -m clean');

    const stages = await readConflictStages(dir, 'clean.txt');

    expect(stages.base).toBeNull();
    expect(stages.ours).toBeNull();
    expect(stages.theirs).toBeNull();
  });

  it('reports canFastForward=true when local is strictly behind the remote', async () => {
    const originDir = makeTmpRepo();
    fs.writeFileSync(path.join(originDir, 'file.txt'), 'one\n');
    git(originDir, 'add .');
    git(originDir, 'commit -m one');

    const localDir = `${originDir}-clone`;
    tmpDirs.push(localDir);
    execSync(`git clone "${originDir}" "${localDir}"`, { env: CLEAN_ENV, stdio: ['ignore', 'pipe', 'pipe'] });

    fs.writeFileSync(path.join(originDir, 'file.txt'), 'two\n');
    git(originDir, 'commit -am two');
    git(localDir, 'fetch origin');

    const pullStatus = await checkPullStatus(localDir, 'origin', 'HEAD');

    expect(pullStatus.behind).toBeGreaterThanOrEqual(1);
    expect(pullStatus.canFastForward).toBe(true);
    expect(pullStatus.isDiverged).toBe(false);
  });

  it('resolves the "both" strategy by keeping ours then appending theirs', async () => {
    const dir = makeContentConflictRepo();

    await resolveConflict(dir, 'file.txt', 'both');

    const content = fs.readFileSync(path.join(dir, 'file.txt'), 'utf8');
    expect(content).toContain('ours');
    expect(content).toContain('theirs');
    expect(content).not.toContain('<<<<<<<');
  });

  it('rejects the "both" strategy with a clear error when their side was deleted', async () => {
    const dir = makeTmpRepo();
    fs.writeFileSync(path.join(dir, 'file.txt'), 'base\n');
    git(dir, 'add .');
    git(dir, 'commit -m base');
    git(dir, 'checkout -b feature');
    git(dir, 'rm file.txt');
    git(dir, 'commit -m delete');
    git(dir, 'checkout main');
    fs.writeFileSync(path.join(dir, 'file.txt'), 'modified\n');
    git(dir, 'commit -am modify');
    gitAllowFail(dir, 'merge feature');

    await expect(resolveConflict(dir, 'file.txt', 'both')).rejects.toThrow(/Their side is unavailable/);
  });
});

describe('discardChanges', () => {
  const countChanged = (status) => status.staged.length + status.unstaged.length + status.conflicted.length;

  it('discards a plain modified tracked file (restore from HEAD)', async () => {
    const dir = makeTmpRepo();
    fs.writeFileSync(path.join(dir, 'file.txt'), 'base\n');
    git(dir, 'add .');
    git(dir, 'commit -m base');
    fs.writeFileSync(path.join(dir, 'file.txt'), 'modified\n');

    const result = await discardChanges(dir, ['file.txt']);

    expect(result.trackedFilesDiscarded).toBe(1);
    expect(countChanged(await getChangedFilesInCollectionGit(dir, dir))).toBe(0);
    expect(fs.readFileSync(path.join(dir, 'file.txt'), 'utf8')).toBe('base\n');
  });

  it('removes a staged-new file that also has worktree edits (the "success but still in Changes" bug)', async () => {
    const dir = makeTmpRepo();
    fs.writeFileSync(path.join(dir, 'seed.txt'), 'seed\n');
    git(dir, 'add .');
    git(dir, 'commit -m seed');
    fs.writeFileSync(path.join(dir, 'new.txt'), 'staged version\n');
    git(dir, 'add new.txt');
    fs.writeFileSync(path.join(dir, 'new.txt'), 'staged + edited version\n');

    const result = await discardChanges(dir, ['new.txt']);

    expect(result.trackedFilesDiscarded).toBe(1);
    expect(countChanged(await getChangedFilesInCollectionGit(dir, dir))).toBe(0);
    expect(fs.existsSync(path.join(dir, 'new.txt'))).toBe(false);
  });

  it('fully discards a tracked file with both staged and unstaged edits', async () => {
    const dir = makeTmpRepo();
    fs.writeFileSync(path.join(dir, 'file.txt'), 'base\n');
    git(dir, 'add .');
    git(dir, 'commit -m base');
    fs.writeFileSync(path.join(dir, 'file.txt'), 'staged edit\n');
    git(dir, 'add file.txt');
    fs.writeFileSync(path.join(dir, 'file.txt'), 'staged + unstaged edit\n');

    await discardChanges(dir, ['file.txt']);

    const status = await getChangedFilesInCollectionGit(dir, dir);
    expect(countChanged(status)).toBe(0);
    expect(fs.readFileSync(path.join(dir, 'file.txt'), 'utf8')).toBe('base\n');
  });

  it('deletes an untracked file from the filesystem', async () => {
    const dir = makeTmpRepo();
    fs.writeFileSync(path.join(dir, 'seed.txt'), 'seed\n');
    git(dir, 'add .');
    git(dir, 'commit -m seed');
    fs.writeFileSync(path.join(dir, 'untracked.txt'), 'untracked\n');

    const result = await discardChanges(dir, ['untracked.txt']);

    expect(result.untrackedFilesDeleted).toBe(1);
    expect(countChanged(await getChangedFilesInCollectionGit(dir, dir))).toBe(0);
    expect(fs.existsSync(path.join(dir, 'untracked.txt'))).toBe(false);
  });
});
