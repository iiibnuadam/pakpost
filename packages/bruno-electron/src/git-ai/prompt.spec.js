const {
  buildConflictResolutionPrompt,
  buildConflictAnalysisPrompt,
  parseResolution,
  parseAnalysis,
  hasConflictMarkers,
  RESOLVED_START,
  RESOLVED_END,
  ANALYSIS_START,
  ANALYSIS_END
} = require('./prompt');

describe('git-ai/prompt', () => {
  describe('buildConflictResolutionPrompt', () => {
    it('includes the file path, sentinel markers and all sections', () => {
      const prompt = buildConflictResolutionPrompt({
        filePath: 'collection/req.bru',
        worktree: '<<<<<<< HEAD\na\n=======\nb\n>>>>>>> feature',
        base: 'a',
        ours: 'a',
        theirs: 'b'
      });

      expect(prompt).toContain('collection/req.bru');
      expect(prompt).toContain(RESOLVED_START);
      expect(prompt).toContain(RESOLVED_END);
      expect(prompt).toContain('<<<<<<< HEAD');
      expect(prompt).toMatch(/valid JSON/);
    });

    it('marks missing sections as unavailable', () => {
      const prompt = buildConflictResolutionPrompt({
        filePath: 'x.txt',
        worktree: 'w',
        base: null,
        ours: 'o',
        theirs: null
      });

      expect(prompt).toContain('(base is not available)');
      expect(prompt).toContain('(theirs is not available)');
      expect(prompt).not.toContain('(ours is not available)');
    });

    it('truncates oversized sections', () => {
      const big = 'x'.repeat(100000);
      const prompt = buildConflictResolutionPrompt({
        filePath: 'x.json',
        worktree: big,
        base: null,
        ours: null,
        theirs: null
      });

      expect(prompt.length).toBeLessThan(big.length + 5000);
      expect(prompt).toContain('[worktree truncated');
    });
  });

  describe('parseResolution', () => {
    it('extracts content between sentinels', () => {
      const output = `Here you go:\n${RESOLVED_START}\n{"a": 1}\n${RESOLVED_END}\nDone.`;
      expect(parseResolution(output)).toBe('{"a": 1}');
    });

    it('falls back to a single markdown code fence', () => {
      expect(parseResolution('```json\n{"a":1}\n```')).toBe('{"a":1}');
    });

    it('returns null when nothing parseable is present', () => {
      expect(parseResolution('I could not resolve this.')).toBeNull();
      expect(parseResolution('')).toBeNull();
      expect(parseResolution(null)).toBeNull();
      expect(parseResolution(undefined)).toBeNull();
    });
  });

  describe('hasConflictMarkers', () => {
    it('detects conflict markers', () => {
      expect(hasConflictMarkers('a\n<<<<<<< HEAD\nb')).toBe(true);
      expect(hasConflictMarkers('clean content')).toBe(false);
    });
  });

  describe('buildConflictAnalysisPrompt', () => {
    it('includes the analysis sentinel and all three stages', () => {
      const prompt = buildConflictAnalysisPrompt({ filePath: 'a.bru', base: 'b', ours: 'o', theirs: 't' });

      expect(prompt).toContain(ANALYSIS_START);
      expect(prompt).toContain(ANALYSIS_END);
      expect(prompt).toContain('"recommendation"');
      expect(prompt).toContain('=== OURS (current branch) ===');
    });
  });

  describe('parseAnalysis', () => {
    it('parses a valid analysis JSON between sentinels', () => {
      const output = `${ANALYSIS_START}
{
  "oursSummary": "changed url",
  "theirsSummary": "changed method",
  "recommendation": "theirs",
  "rationale": "theirs is newer",
  "risks": ""
}
${ANALYSIS_END}`;

      expect(parseAnalysis(output)).toEqual({
        oursSummary: 'changed url',
        theirsSummary: 'changed method',
        recommendation: 'theirs',
        rationale: 'theirs is newer',
        risks: ''
      });
    });

    it('coerces an unknown recommendation to "merged"', () => {
      const output = `${ANALYSIS_START}
{"oursSummary": "", "theirsSummary": "", "recommendation": "banana"}
${ANALYSIS_END}`;

      expect(parseAnalysis(output).recommendation).toBe('merged');
    });

    it('falls back to a plain fenced JSON object', () => {
      expect(parseAnalysis('```json\n{"oursSummary":"x","theirsSummary":"y","recommendation":"ours"}\n```').recommendation).toBe(
        'ours'
      );
    });

    it('returns null for unparseable output', () => {
      expect(parseAnalysis('no json here')).toBeNull();
      expect(parseAnalysis('')).toBeNull();
      expect(parseAnalysis(null)).toBeNull();
    });
  });
});
