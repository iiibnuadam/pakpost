const { buildArgs } = require('./cli-providers');

/**
 * Args untuk mode chat (stream-json) per provider preset.
 * - claude: butuh --verbose saat --print + stream-json (diverifikasi claude 2.1.x)
 * - kimi: resume pakai -S <id> (diverifikasi kimi 2.1.x)
 * - antigravity: mengikuti flag gaya claude (belum terverifikasi — CLI tidak
 *   terinstall; bila output bukan stream-json, parser jatuh ke plain text)
 * - custom: template args dari preferensi ({prompt}), output plain text
 */
const buildChatArgs = ({ providerId, provider, prompt, cliSessionId }) => {
  if (providerId === 'custom') {
    return buildArgs(provider?.args || '-p {prompt}', prompt);
  }

  if (providerId === 'kimi') {
    const args = ['-p', prompt, '--output-format', 'stream-json'];
    if (cliSessionId) {
      args.push('-S', cliSessionId);
    }
    return args;
  }

  const args = ['-p', prompt, '--output-format', 'stream-json', '--verbose'];
  if (cliSessionId) {
    args.push('--resume', cliSessionId);
  }
  return args;
};

/**
 * Parser output chat CLI. Dua format dikenali:
 * - claude-style stream-json: tiap baris satu event JSON; `system`/`result`
 *   membawa session_id, `assistant` membawa message.content[] blok teks.
 * - kimi-style stream-json: baris JSON dengan role; `assistant` punya
 *   content string, `meta` + `session.resume_hint` membawa session_id.
 * Bila tidak ada baris JSON yang valid sama sekali, seluruh output dianggap
 * plain text (custom provider / CLI yang tidak dikenal).
 *
 * feed(chunk) -> array event { type: 'session', sessionId } | { type: 'delta', text }
 * flush()     -> proses sisa buffer (panggil saat stream selesai)
 * finalText() -> gabungan teks assistant
 */
const createChatStreamParser = () => {
  let buffer = '';
  let sawJson = false;
  let sessionId = null;
  const textParts = [];

  const handleEvent = (event, events) => {
    if (!event || typeof event !== 'object') {
      return;
    }
    sawJson = true;

    // claude-style assistant message: message.content[] blok teks.
    if (event.type === 'assistant' && Array.isArray(event.message?.content)) {
      const text = event.message.content
        .filter((block) => block && (block.type === 'text' || typeof block.text === 'string'))
        .map((block) => block.text || '')
        .join('');
      if (text) {
        textParts.push(text);
        events.push({ type: 'delta', text });
      }
    }

    // kimi-style assistant message: content string.
    if (event.role === 'assistant' && typeof event.content === 'string' && event.content) {
      textParts.push(event.content);
      events.push({ type: 'delta', text: event.content });
    }

    // Hampir semua event claude-style membawa session_id di top level —
    // catat bila berubah, tapi jangan return dini (bisa memotong event assistant).
    const sid = event.session_id;
    if (typeof sid === 'string' && sid && sid !== sessionId) {
      sessionId = sid;
      events.push({ type: 'session', sessionId: sid });
    }
  };

  const feedLine = (line, events) => {
    if (!line) {
      return;
    }
    let event;
    try {
      event = JSON.parse(line);
    } catch (err) {
      return;
    }
    handleEvent(event, events);
  };

  const feed = (chunk) => {
    buffer += chunk;
    const events = [];
    let newlineIndex;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      feedLine(line, events);
    }
    return events;
  };

  const flush = () => {
    const events = [];
    const remaining = buffer.trim();
    buffer = '';
    if (remaining) {
      feedLine(remaining, events);
    }
    return events;
  };

  const finalText = () => textParts.join('');

  // Custom provider / CLI tak dikenal: seluruh output mentah dianggap jawaban.
  const finalTextOrRaw = (rawStdout) => {
    const text = finalText();
    if (text) {
      return text;
    }
    return sawJson ? '' : rawStdout.trim();
  };

  return { feed, flush, finalText, finalTextOrRaw, get sessionId() { return sessionId; } };
};

module.exports = {
  buildChatArgs,
  createChatStreamParser
};
