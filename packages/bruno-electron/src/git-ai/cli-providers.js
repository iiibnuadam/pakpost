const { execFile } = require('child_process');
const fs = require('fs');

const CLI_PROVIDER_PRESETS = {
  claude: {
    id: 'claude',
    label: 'Claude Code CLI',
    command: 'claude',
    args: '-p {prompt}'
  },
  kimi: {
    id: 'kimi',
    label: 'Kimi CLI',
    command: 'kimi',
    args: '-p {prompt}'
  },
  antigravity: {
    id: 'antigravity',
    label: 'Antigravity CLI',
    command: 'antigravity',
    args: '-p {prompt}'
  }
};

const DEFAULT_PROVIDER_ID = 'claude';

const splitArgs = (template) => {
  const args = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let match;
  while ((match = re.exec(template)) !== null) {
    args.push(match[1] ?? match[2] ?? match[3]);
  }
  return args;
};

const buildArgs = (template, prompt) => {
  const args = splitArgs(template || '').map((arg) => arg.replaceAll('{prompt}', prompt));
  if (!args.some((arg) => arg.includes(prompt))) {
    // Template tanpa placeholder {prompt}: kirim prompt sebagai argumen terakhir.
    args.push(prompt);
  }
  return args;
};

const resolveBinaryPath = (command) => {
  return new Promise((resolve) => {
    if (!command || typeof command !== 'string') {
      resolve(null);
      return;
    }
    const trimmed = command.trim();
    if (!trimmed) {
      resolve(null);
      return;
    }

    // Path eksplisit (absolut/relatif): cukup cek keberadaan file-nya.
    if (trimmed.includes('/') || trimmed.includes('\\')) {
      resolve(fs.existsSync(trimmed) ? trimmed : null);
      return;
    }

    const checker = process.platform === 'win32' ? 'where' : 'which';
    execFile(checker, [trimmed], { timeout: 5000 }, (err, stdout) => {
      if (err) {
        resolve(null);
        return;
      }
      const first = stdout.split('\n')[0].trim();
      resolve(first || null);
    });
  });
};

const getActiveCliProvider = (aiPreferences) => {
  const cfg = aiPreferences?.cliResolver || {};
  const providerId = cfg.provider || DEFAULT_PROVIDER_ID;

  if (providerId === 'custom') {
    return {
      id: 'custom',
      label: 'Custom CLI',
      command: (cfg.custom?.command || '').trim(),
      args: cfg.custom?.args || '-p {prompt}'
    };
  }

  const preset = CLI_PROVIDER_PRESETS[providerId] || CLI_PROVIDER_PRESETS[DEFAULT_PROVIDER_ID];
  const overrides = cfg[preset.id] || {};
  return {
    ...preset,
    command: (overrides.command || '').trim() || preset.command,
    args: overrides.args || preset.args
  };
};

const listCliProviders = () => Object.values(CLI_PROVIDER_PRESETS);

module.exports = {
  CLI_PROVIDER_PRESETS,
  DEFAULT_PROVIDER_ID,
  buildArgs,
  resolveBinaryPath,
  getActiveCliProvider,
  listCliProviders
};
