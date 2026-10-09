import { useEffect, useState } from 'react';
import get from 'lodash/get';
import { getAiCliStatus } from 'utils/git-ai';

const PROVIDER_OPTIONS = [
  { id: 'claude', label: 'Claude Code CLI' },
  { id: 'kimi', label: 'Kimi CLI' },
  { id: 'antigravity', label: 'Antigravity CLI' },
  { id: 'custom', label: 'Custom command' }
];

const GitResolverPane = ({ formik }) => {
  const provider = get(formik.values, 'cliResolver.provider', 'claude');
  const customCommand = get(formik.values, 'cliResolver.custom.command', '');
  const customArgs = get(formik.values, 'cliResolver.custom.args', '-p {prompt}');
  const [cliStatus, setCliStatus] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setChecking(true);
    getAiCliStatus()
      .then((status) => {
        if (!cancelled) setCliStatus(status);
      })
      .catch(() => {
        if (!cancelled) setCliStatus(null);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [provider, customCommand]);

  return (
    <div className="ai-tab-panel" role="tabpanel">
      <div className="ai-master flex items-center justify-between gap-4 px-3.5 py-3 mb-4">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[13px] font-semibold">CLI agent</span>
          <span className="ai-master-summary text-[11px]">
            One CLI agent powers both the AI Chat panel and the git conflict resolver — it runs with the
            login you already have on this machine, no API key needed.
          </span>
        </div>
      </div>

      <div className="ai-section-header text-[11px] font-medium uppercase tracking-wider mb-2">CLI agent</div>
      <div className="provider-row px-3.5 py-3 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <label className="key-section-label text-[11px] w-20 flex-shrink-0">Provider</label>
          <select
            className="model-select"
            value={provider}
            onChange={(e) => formik.setFieldValue('cliResolver.provider', e.target.value)}
            data-testid="git-resolver-provider"
          >
            {PROVIDER_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {provider === 'custom' && (
          <>
            <div className="flex items-center gap-3">
              <label className="key-section-label text-[11px] w-20 flex-shrink-0">Command</label>
              <input
                type="text"
                className="key-input flex-1 px-2 py-1 text-xs"
                placeholder="e.g. my-agent"
                value={customCommand}
                onChange={(e) => formik.setFieldValue('cliResolver.custom.command', e.target.value)}
                data-testid="git-resolver-command"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="key-section-label text-[11px] w-20 flex-shrink-0">Args</label>
              <input
                type="text"
                className="key-input flex-1 px-2 py-1 text-xs"
                placeholder="-p {prompt}"
                value={customArgs}
                onChange={(e) => formik.setFieldValue('cliResolver.custom.args', e.target.value)}
                data-testid="git-resolver-args"
              />
            </div>
          </>
        )}

        <div className="keyless-hint text-[11px]">
          {'{prompt}'} is replaced with the full conflict-resolution request. The CLI must support a
          non-interactive (print) mode.
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`status-dot ${cliStatus?.found ? 'configured' : ''}`}
            style={{ width: 8, height: 8, borderRadius: '50%', display: 'inline-block' }}
          />
          <span className={`provider-status ${cliStatus?.found ? 'configured' : ''} text-[11px]`}>
            {checking
              ? 'Checking…'
              : cliStatus?.found
                ? `${cliStatus.provider.command} found at ${cliStatus.path}`
                : cliStatus
                  ? `${cliStatus.provider.command || 'CLI'} not found on PATH — install it or pick another provider`
                  : 'Could not check CLI availability'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GitResolverPane;
