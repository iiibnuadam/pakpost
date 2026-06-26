import React, { useMemo } from 'react';
import StyledWrapper from './StyledWrapper';

const GitDiffViewer = ({ diff, emptyMessage = 'No diff to display' }) => {
  const lines = useMemo(() => {
    if (!diff) return [];
    return diff.split('\n');
  }, [diff]);

  const getLineClass = (line) => {
    if (line.startsWith('diff --git')) return 'diff-line-file';
    if (line.startsWith('index ')) return 'diff-line-meta';
    if (line.startsWith('--- ')) return 'diff-line-meta';
    if (line.startsWith('+++ ')) return 'diff-line-meta';
    if (line.startsWith('@@')) return 'diff-line-hunk';
    if (line.startsWith('+')) return 'diff-line-added';
    if (line.startsWith('-')) return 'diff-line-removed';
    return 'diff-line-context';
  };

  const getLinePrefix = (line, className) => {
    if (className === 'diff-line-added') return '+';
    if (className === 'diff-line-removed') return '-';
    return '';
  };

  if (!diff) {
    return (
      <StyledWrapper>
        <div className="git-diff-empty">{emptyMessage}</div>
      </StyledWrapper>
    );
  }

  return (
    <StyledWrapper>
      <div className="git-diff-viewer">
        {lines.map((line, index) => {
          const className = getLineClass(line);
          const prefix = getLinePrefix(line, className);
          const content = prefix ? line.slice(1) : line;

          return (
            <div key={index} className={`diff-line ${className}`}>
              <span className="diff-line-marker">{prefix || ' '}</span>
              <span className="diff-line-content">{content}</span>
            </div>
          );
        })}
      </div>
    </StyledWrapper>
  );
};

export default GitDiffViewer;
