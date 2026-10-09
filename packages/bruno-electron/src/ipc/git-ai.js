const { ipcMain } = require('electron');
const { getPreferences } = require('../store/preferences');
const { getActiveCliProvider, resolveBinaryPath, buildArgs } = require('../git-ai/cli-providers');
const {
  buildConflictResolutionPrompt,
  buildConflictAnalysisPrompt,
  parseResolution,
  parseAnalysis
} = require('../git-ai/prompt');
const { spawnCli, DEFAULT_TIMEOUT_MS } = require('../git-ai/spawn-cli');
const { buildChatArgs, createChatStreamParser } = require('../git-ai/chat');
const aiChatHistoryStore = require('../store/ai-chat-history');
const { getCollectionGitRootPath, readConflictFile, readConflictStages } = require('../utils/git');
const { withGitLock } = require('../utils/gitLock');

// Batasi total input ke CLI supaya prompt tidak menggila untuk file koleksi besar.
const MAX_TOTAL_INPUT_CHARS = 200 * 1024;

const activeRuns = new Map(); // streamId -> kill()

const prepareConflictRun = async ({ collectionPath, filePath }) => {
  const gitRootPath = getCollectionGitRootPath(collectionPath);
  if (!gitRootPath) {
    throw new Error('Not inside a git repository');
  }
  if (!filePath) {
    throw new Error('Missing file path');
  }

  const aiPreferences = getPreferences().ai || {};
  const provider = getActiveCliProvider(aiPreferences);
  if (!provider.command) {
    throw new Error('No CLI agent configured. Set one up in Preferences > AI > CLI agent.');
  }
  const binaryPath = await resolveBinaryPath(provider.command);
  if (!binaryPath) {
    throw new Error(
      `CLI "${provider.command}" was not found on your PATH. Install it or change the provider in Preferences > AI.`
    );
  }

  const [worktree, stages] = await Promise.all([
    readConflictFile(gitRootPath, filePath),
    readConflictStages(gitRootPath, filePath)
  ]);

  const base = stages?.base ?? null;
  const ours = stages?.ours ?? null;
  const theirs = stages?.theirs ?? null;

  const totalSize
    = (worktree?.length || 0) + [base, ours, theirs].reduce((sum, section) => sum + (section?.length || 0), 0);
  if (totalSize > MAX_TOTAL_INPUT_CHARS) {
    throw new Error('Conflicted file is too large for AI resolution (over 200 KB combined). Resolve it manually.');
  }

  return { gitRootPath, provider, binaryPath, base, ours, theirs };
};

const runCliPrompt = async ({ event, gitRootPath, binaryPath, argsTemplate, prompt, streamId }) => {
  const args = buildArgs(argsTemplate, prompt);
  const sender = event.sender;

  const { done, kill } = spawnCli({
    command: binaryPath,
    args,
    cwd: gitRootPath,
    onChunk: (chunk) => {
      if (streamId && !sender.isDestroyed()) {
        sender.send('main:ai-cli-chunk', { streamId, ...chunk });
      }
    }
  });

  if (streamId) {
    activeRuns.set(streamId, kill);
  }

  try {
    const result = await done;

    if (result.timedOut) {
      throw new Error(
        `The AI CLI timed out after ${Math.round(DEFAULT_TIMEOUT_MS / 60000)} minutes. Last output: ${(result.stderr || '').slice(-500)}`
      );
    }
    if (result.spawnError || result.code !== 0) {
      const detail = (result.stderr || result.stdout || '').slice(-800);
      throw new Error(`AI CLI failed (exit code ${result.code ?? 'n/a'}). ${detail}`.trim());
    }
    return result;
  } finally {
    if (streamId) {
      activeRuns.delete(streamId);
    }
  }
};

const registerGitAiIpc = () => {
  ipcMain.handle('renderer:ai-cli-status', async () => {
    const aiPreferences = getPreferences().ai || {};
    const provider = getActiveCliProvider(aiPreferences);
    const binaryPath = provider.command ? await resolveBinaryPath(provider.command) : null;
    return {
      provider: {
        id: provider.id,
        label: provider.label,
        command: provider.command,
        args: provider.args
      },
      found: Boolean(binaryPath),
      path: binaryPath
    };
  });

  ipcMain.handle('renderer:ai-cli-analyze-conflict', async (event, { collectionPath, filePath, streamId }) => {
    const run = async () => {
      const prepared = await prepareConflictRun({ collectionPath, filePath });
      const prompt = buildConflictAnalysisPrompt({
        filePath,
        base: prepared.base,
        ours: prepared.ours,
        theirs: prepared.theirs
      });
      const result = await runCliPrompt({
        event,
        gitRootPath: prepared.gitRootPath,
        binaryPath: prepared.binaryPath,
        argsTemplate: prepared.provider.args,
        prompt,
        streamId
      });

      const analysis = parseAnalysis(result.stdout);
      if (!analysis) {
        throw new Error('Could not parse the AI analysis. Try again or resolve manually.');
      }
      return { analysis };
    };

    const gitRootPath = getCollectionGitRootPath(collectionPath);
    return gitRootPath ? withGitLock(gitRootPath, run) : run();
  });

  ipcMain.handle('renderer:ai-cli-resolve-conflict', async (event, { collectionPath, filePath, streamId }) => {
    const run = async () => {
      const prepared = await prepareConflictRun({ collectionPath, filePath });
      const prompt = buildConflictResolutionPrompt({
        filePath,
        worktree: await readConflictFile(prepared.gitRootPath, filePath),
        base: prepared.base,
        ours: prepared.ours,
        theirs: prepared.theirs
      });
      const result = await runCliPrompt({
        event,
        gitRootPath: prepared.gitRootPath,
        binaryPath: prepared.binaryPath,
        argsTemplate: prepared.provider.args,
        prompt,
        streamId
      });

      const content = parseResolution(result.stdout);
      if (!content) {
        throw new Error('Could not extract a resolution from the CLI output. Try again or resolve manually.');
      }
      return { content };
    };

    const gitRootPath = getCollectionGitRootPath(collectionPath);
    return gitRootPath ? withGitLock(gitRootPath, run) : run();
  });

  ipcMain.handle('renderer:ai-cli-stop', async (_event, { streamId }) => {
    const kill = activeRuns.get(streamId);
    if (kill) {
      kill();
      activeRuns.delete(streamId);
    }
  });

  ipcMain.handle('renderer:ai-chat-send', async (event, { streamId, workspacePath, prompt, cliSessionId }) => {
    if (!prompt || !String(prompt).trim()) {
      throw new Error('Empty prompt');
    }
    if (!workspacePath) {
      throw new Error('No workspace is open');
    }

    const aiPreferences = getPreferences().ai || {};
    const provider = getActiveCliProvider(aiPreferences);
    if (!provider.command) {
      throw new Error('No CLI agent configured. Set one up in Preferences > AI > CLI agent.');
    }
    const binaryPath = await resolveBinaryPath(provider.command);
    if (!binaryPath) {
      throw new Error(
        `CLI "${provider.command}" was not found on your PATH. Install it or change the provider in Preferences > AI.`
      );
    }

    const args = buildChatArgs({ providerId: provider.id, provider, prompt: String(prompt), cliSessionId });
    const parser = createChatStreamParser();
    const sender = event.sender;

    const { done, kill } = spawnCli({
      command: binaryPath,
      args,
      cwd: workspacePath,
      onChunk: (chunk) => {
        if (sender.isDestroyed()) {
          return;
        }
        const events = parser.feed(chunk.text || '');
        for (const evt of events) {
          sender.send('main:ai-chat-event', { streamId, ...evt });
        }
      }
    });

    if (streamId) {
      activeRuns.set(streamId, kill);
    }

    try {
      const result = await done;
      const events = parser.flush();
      if (!sender.isDestroyed()) {
        for (const evt of events) {
          sender.send('main:ai-chat-event', { streamId, ...evt });
        }
      }

      if (result.timedOut) {
        throw new Error(
          `The AI CLI timed out after ${Math.round(DEFAULT_TIMEOUT_MS / 60000)} minutes. Last output: ${(result.stderr || '').slice(-500)}`
        );
      }
      if (result.spawnError || result.code !== 0) {
        const detail = (result.stderr || result.stdout || '').slice(-800);
        throw new Error(`AI CLI failed (exit code ${result.code ?? 'n/a'}). ${detail}`.trim());
      }

      const text = parser.finalTextOrRaw(result.stdout || '');
      if (!text) {
        throw new Error('The AI CLI returned an empty response. Try again.');
      }
      return { text, sessionId: parser.sessionId || cliSessionId || null };
    } finally {
      if (streamId) {
        activeRuns.delete(streamId);
      }
    }
  });

  ipcMain.handle('renderer:ai-chat-history-load', async () => {
    return aiChatHistoryStore.getHistory();
  });

  ipcMain.handle('renderer:ai-chat-history-save', async (_event, history) => {
    const safe = history && typeof history === 'object' && history.byWorkspace && typeof history.byWorkspace === 'object'
      ? { byWorkspace: history.byWorkspace }
      : { byWorkspace: {} };
    aiChatHistoryStore.saveHistory(safe);
  });
};

module.exports = registerGitAiIpc;
