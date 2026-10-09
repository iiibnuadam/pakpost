const { spawn } = require('child_process');

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;
const MAX_OUTPUT_CHARS = 1024 * 1024; // bound captured stdout/stderr (tail-kept)

// Node.js rejects spawn of .cmd/.bat with shell:false on Windows (CVE-2024-27980).
const isWindowsBatch = (filePath) => {
  if (process.platform !== 'win32') return false;
  const ext = (filePath || '').toLowerCase();
  return ext.endsWith('.cmd') || ext.endsWith('.bat');
};

// Keep only the trailing `cap` chars — errors usually surface at the end of output.
const appendCapped = (buffer, chunk) => {
  const next = buffer + chunk;
  return next.length > MAX_OUTPUT_CHARS ? next.slice(next.length - MAX_OUTPUT_CHARS) : next;
};

const quoteForShell = (arg) => `"${String(arg).replace(/"/g, '\\"')}"`;

/**
 * Spawn a CLI agent process. Returns immediately with:
 * - `done`: Promise resolving to { code, signal, stdout, stderr, timedOut, killed }
 * - `kill`:  best-effort abort (SIGTERM, then SIGKILL after a grace period)
 *
 * Never rejects; failures come back in the result object.
 */
const spawnCli = ({ command, args = [], cwd, timeoutMs = DEFAULT_TIMEOUT_MS, onChunk, env }) => {
  const childEnv = { ...process.env, ...(env || {}) };

  let child;
  if (isWindowsBatch(command)) {
    child = spawn([command, ...args].map(quoteForShell).join(' '), [], {
      cwd,
      env: childEnv,
      shell: true,
      windowsHide: true
    });
  } else {
    child = spawn(command, args, {
      cwd,
      env: childEnv,
      shell: false,
      windowsHide: true
    });
  }

  let stdout = '';
  let stderr = '';
  let settled = false;
  let killed = false;
  let timer = null;
  let killTimer = null;

  const done = new Promise((resolve) => {
    const finish = (result) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      if (killTimer) clearTimeout(killTimer);
      resolve(result);
    };

    timer = setTimeout(() => {
      killed = true;
      try {
        child.kill('SIGTERM');
      } catch (err) {
        // proses mungkin sudah berakhir
      }
      killTimer = setTimeout(() => {
        try {
          child.kill('SIGKILL');
        } catch (err) {
          // proses sudah berakhir
        }
      }, 5000);
    }, timeoutMs);

    child.stdout?.on('data', (chunk) => {
      const text = chunk.toString();
      stdout = appendCapped(stdout, text);
      try {
        onChunk?.({ stream: 'stdout', text });
      } catch (err) {
        // abaikan error handler renderer
      }
    });

    child.stderr?.on('data', (chunk) => {
      const text = chunk.toString();
      stderr = appendCapped(stderr, text);
      try {
        onChunk?.({ stream: 'stderr', text });
      } catch (err) {
        // abaikan error handler renderer
      }
    });

    child.on('error', (err) => {
      finish({ code: -1, signal: null, stdout, stderr: stderr || String(err?.message || err), timedOut: false, killed, spawnError: true });
    });

    child.on('close', (code, signal) => {
      finish({ code, signal, stdout, stderr, timedOut: killed, killed });
    });
  });

  const kill = () => {
    if (settled) return;
    killed = true;
    try {
      child.kill('SIGTERM');
    } catch (err) {
      // proses sudah berakhir
    }
  };

  return { done, kill, pid: child.pid };
};

module.exports = {
  spawnCli,
  DEFAULT_TIMEOUT_MS,
  MAX_OUTPUT_CHARS
};
