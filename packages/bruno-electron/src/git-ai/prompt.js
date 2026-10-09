const RESOLVED_START = '<<<PAKPOST_RESOLVED>>>';
const RESOLVED_END = '<<<END_PAKPOST_RESOLVED>>>';

const MAX_SECTION_CHARS = 80000;

const truncateSection = (label, content) => {
  if (!content) return `(${label} is not available)`;
  if (content.length <= MAX_SECTION_CHARS) return content;
  return content.slice(0, MAX_SECTION_CHARS) + `\n... [${label} truncated: file too large]`;
};

const buildConflictResolutionPrompt = ({ filePath, worktree, base, ours, theirs }) => {
  const isStructured = /\.(json|bru)$/i.test(filePath || '');

  return [
    'You are resolving a git merge conflict inside an API collection managed by Bruno (pakpost fork).',
    `File: ${filePath}`,
    '',
    isStructured
      ? 'This is a structured file. The merged output MUST be valid for its format (valid JSON for .json/.bru files) — never leave conflict markers in it.'
      : 'Produce a clean merged file — never leave conflict markers in it.',
    '',
    'Rules:',
    '- Understand the intent of BOTH sides and combine their changes semantically.',
    '- If the two sides edited the same area in compatible ways, keep both changes.',
    '- If they truly contradict each other, prefer "our" side and keep a sensible version of "their" change when possible.',
    '- Do NOT add explanations, comments about what you did, or any text outside the markers.',
    '',
    'Reply with ONLY the complete resolved file, wrapped exactly like this:',
    RESOLVED_START,
    '<full resolved file content>',
    RESOLVED_END,
    '',
    '=== CURRENT WORKTREE CONTENT (contains <<<<<<< conflict markers) ===',
    truncateSection('worktree', worktree),
    '',
    '=== BASE (common ancestor) ===',
    truncateSection('base', base),
    '',
    '=== OURS (current branch) ===',
    truncateSection('ours', ours),
    '',
    '=== THEIRS (incoming branch) ===',
    truncateSection('theirs', theirs),
    ''
  ].join('\n');
};

const stripCodeFence = (stdout) => {
  const match = stdout.match(/```[a-zA-Z0-9-]*\r?\n([\s\S]*?)```/);
  if (!match) return null;
  return match[1].replace(/\r?\n$/, '');
};

const parseResolution = (stdout) => {
  if (!stdout || typeof stdout !== 'string') return null;

  const start = stdout.indexOf(RESOLVED_START);
  const end = stdout.lastIndexOf(RESOLVED_END);
  if (start !== -1 && end !== -1 && end > start) {
    return stdout
      .slice(start + RESOLVED_START.length, end)
      .replace(/^\r?\n/, '')
      .replace(/\r?\n$/, '');
  }

  // Fallback: CLI mengabaikan sentinel tapi menjawab dalam satu code fence.
  return stripCodeFence(stdout);
};

const hasConflictMarkers = (content) => {
  return typeof content === 'string' && /^(<{7}|={7}|>{7}|\|{7})/m.test(content);
};

const ANALYSIS_START = '<<<PAKPOST_ANALYSIS>>>';
const ANALYSIS_END = '<<<END_PAKPOST_ANALYSIS>>>';

const RECOMMENDATION_VALUES = ['ours', 'theirs', 'both', 'merged'];

const buildConflictAnalysisPrompt = ({ filePath, base, ours, theirs }) => {
  return [
    'You are analyzing a git merge conflict so a human can decide how to resolve it.',
    `File: ${filePath}`,
    '',
    'Reply with ONLY a JSON object wrapped exactly like this (no prose outside the markers):',
    ANALYSIS_START,
    '{',
    '  "oursSummary": "1-2 sentences: what OUR side changed",',
    '  "theirsSummary": "1-2 sentences: what THEIR side changed",',
    '  "recommendation": "ours" | "theirs" | "both" | "merged",',
    '  "rationale": "1-3 sentences: why you recommend that option",',
    '  "risks": "optional: risk of following this recommendation, or empty string"',
    '}',
    ANALYSIS_END,
    '',
    'Meanings of recommendation:',
    '- "ours"   : resolve by keeping OUR version entirely',
    '- "theirs" : resolve by keeping THEIR version entirely',
    '- "both"   : resolve by keeping OUR version then appending THEIRS',
    '- "merged" : resolve by semantically combining the intent of both sides (pick this when both sides matter)',
    '',
    '=== BASE (common ancestor) ===',
    truncateSection('base', base),
    '',
    '=== OURS (current branch) ===',
    truncateSection('ours', ours),
    '',
    '=== THEIRS (incoming branch) ===',
    truncateSection('theirs', theirs),
    ''
  ].join('\n');
};

const parseAnalysis = (stdout) => {
  if (!stdout || typeof stdout !== 'string') return null;

  let raw = null;
  const start = stdout.indexOf(ANALYSIS_START);
  const end = stdout.lastIndexOf(ANALYSIS_END);
  if (start !== -1 && end !== -1 && end > start) {
    raw = stdout.slice(start + ANALYSIS_START.length, end).trim();
  } else {
    // Fallback: CLI menjawab JSON dalam satu code fence.
    raw = stripCodeFence(stdout);
  }
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      oursSummary: String(parsed.oursSummary || ''),
      theirsSummary: String(parsed.theirsSummary || ''),
      recommendation: RECOMMENDATION_VALUES.includes(parsed.recommendation) ? parsed.recommendation : 'merged',
      rationale: String(parsed.rationale || ''),
      risks: String(parsed.risks || '')
    };
  } catch (err) {
    return null;
  }
};

module.exports = {
  RESOLVED_START,
  RESOLVED_END,
  ANALYSIS_START,
  ANALYSIS_END,
  buildConflictResolutionPrompt,
  buildConflictAnalysisPrompt,
  parseResolution,
  parseAnalysis,
  hasConflictMarkers
};
