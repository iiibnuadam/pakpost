const { buildArgs, getActiveCliProvider } = require('./cli-providers');

describe('git-ai/cli-providers', () => {
  describe('buildArgs', () => {
    it('replaces the {prompt} placeholder', () => {
      expect(buildArgs('-p {prompt}', 'hello world')).toEqual(['-p', 'hello world']);
    });

    it('appends the prompt when the template has no placeholder', () => {
      expect(buildArgs('--quiet', 'do it')).toEqual(['--quiet', 'do it']);
    });

    it('respects quoted segments', () => {
      expect(buildArgs('-p "{prompt}"', 'hi')).toEqual(['-p', 'hi']);
      expect(buildArgs('--flag \'{prompt}\'', 'hi')).toEqual(['--flag', 'hi']);
    });
  });

  describe('getActiveCliProvider', () => {
    it('returns the preset for a known provider id', () => {
      const provider = getActiveCliProvider({ cliResolver: { provider: 'kimi' } });
      expect(provider.id).toBe('kimi');
      expect(provider.command).toBe('kimi');
      expect(provider.args).toBe('-p {prompt}');
    });

    it('falls back to claude for unknown provider ids', () => {
      const provider = getActiveCliProvider({ cliResolver: { provider: 'nope' } });
      expect(provider.id).toBe('claude');
    });

    it('supports a fully custom provider from preferences', () => {
      const provider = getActiveCliProvider({
        cliResolver: { provider: 'custom', custom: { command: 'myagent', args: '--run {prompt}' } }
      });
      expect(provider.id).toBe('custom');
      expect(provider.command).toBe('myagent');
      expect(provider.args).toBe('--run {prompt}');
    });

    it('defaults to claude when nothing is configured', () => {
      expect(getActiveCliProvider(undefined).id).toBe('claude');
      expect(getActiveCliProvider({}).id).toBe('claude');
    });

    it('allows per-preset command/args overrides', () => {
      const provider = getActiveCliProvider({
        cliResolver: { provider: 'claude', claude: { args: '-p {prompt} --model opus' } }
      });
      expect(provider.command).toBe('claude');
      expect(provider.args).toBe('-p {prompt} --model opus');
    });
  });
});
