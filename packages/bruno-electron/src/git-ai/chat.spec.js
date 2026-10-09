const { buildChatArgs, createChatStreamParser } = require('./chat');

const PROVIDER = { args: '-p {prompt}' };

describe('git-ai/chat', () => {
  describe('buildChatArgs', () => {
    it('builds claude stream-json args without a session', () => {
      expect(buildChatArgs({ providerId: 'claude', provider: PROVIDER, prompt: 'hi' })).toEqual([
        '-p',
        'hi',
        '--output-format',
        'stream-json',
        '--verbose'
      ]);
    });

    it('builds claude args with --resume when a session exists', () => {
      const args = buildChatArgs({
        providerId: 'claude',
        provider: PROVIDER,
        prompt: 'again',
        cliSessionId: 'sid-1'
      });
      expect(args).toContain('--resume');
      expect(args[args.indexOf('--resume') + 1]).toBe('sid-1');
    });

    it('builds kimi args with -S when a session exists', () => {
      const args = buildChatArgs({
        providerId: 'kimi',
        provider: PROVIDER,
        prompt: 'again',
        cliSessionId: 'sid-2'
      });
      expect(args).toEqual(['-p', 'again', '--output-format', 'stream-json', '-S', 'sid-2']);
    });

    it('uses the custom args template for the custom provider', () => {
      expect(
        buildChatArgs({ providerId: 'custom', provider: { args: '--ask {prompt}' }, prompt: 'hey' })
      ).toEqual(['--ask', 'hey']);
    });
  });

  describe('createChatStreamParser', () => {
    it('parses claude-style stream-json events', () => {
      const parser = createChatStreamParser();
      const events = [];
      events.push(
        ...parser.feed(
          '{"type":"system","subtype":"init","session_id":"abc"}\n'
          + '{"type":"assistant","message":{"content":[{"type":"text","text":"Hello"}]}}\n'
        )
      );
      events.push(...parser.flush());

      expect(events).toContainEqual({ type: 'session', sessionId: 'abc' });
      expect(events).toContainEqual({ type: 'delta', text: 'Hello' });
      expect(parser.finalText()).toBe('Hello');
      expect(parser.finalTextOrRaw('')).toBe('Hello');
    });

    it('parses kimi-style stream-json events', () => {
      const parser = createChatStreamParser();
      const events = [];
      events.push(
        ...parser.feed(
          '{"role":"meta","type":"system.version","version":"2.1.1"}\n'
          + '{"role":"assistant","content":"pong"}\n'
          + '{"role":"meta","type":"session.resume_hint","session_id":"k1"}\n'
        )
      );
      events.push(...parser.flush());

      expect(events).toContainEqual({ type: 'delta', text: 'pong' });
      expect(events).toContainEqual({ type: 'session', sessionId: 'k1' });
      expect(parser.finalTextOrRaw('')).toBe('pong');
    });

    it('handles events split across chunks', () => {
      const parser = createChatStreamParser();
      const events = [];
      events.push(...parser.feed('{"role":"assistant","con'));
      events.push(...parser.feed('tent":"he'));
      events.push(...parser.feed('llo"}\n{"role":"assis'));
      events.push(...parser.feed('tant","content":" world"}\n'));
      events.push(...parser.flush());

      expect(parser.finalText()).toBe('hello world');
    });

    it('joins multiple assistant blocks in one claude message', () => {
      const parser = createChatStreamParser();
      parser.feed(
        '{"type":"assistant","message":{"content":[{"type":"thinking","thinking":"hmm"},{"type":"text","text":"A"},{"type":"text","text":"B"}]}}\n'
      );
      parser.flush();
      expect(parser.finalText()).toBe('AB');
    });

    it('falls back to raw stdout for plain-text output', () => {
      const parser = createChatStreamParser();
      parser.feed('just some text\nwithout any json\n');
      parser.flush();
      expect(parser.finalTextOrRaw('just some text\nwithout any json')).toBe(
        'just some text\nwithout any json'
      );
    });

    it('returns empty final text when JSON produced no assistant content', () => {
      const parser = createChatStreamParser();
      parser.feed('{"type":"system","subtype":"init","session_id":"x"}\n');
      parser.flush();
      expect(parser.finalTextOrRaw('ignored raw')).toBe('');
    });
  });
});
