import React from 'react';
import Modal from 'components/Modal';
import StyledWrapper from './StyledWrapper';

const RECOMMENDATION_LABELS = {
  ours: 'Use ours',
  theirs: 'Use theirs',
  both: 'Keep both',
  merged: 'AI merge'
};

const GitConflictSuggestionModal = ({ file, analysis, onPick, onCancel }) => {
  const recommendation = analysis?.recommendation;

  return (
    <Modal handleCancel={onCancel} hideFooter disableCloseOnOutsideClick>
      <StyledWrapper>
        <div className="suggestion-header">
          <h3>Resolve conflict — AI suggestion</h3>
          <div className="suggestion-path">{file?.path}</div>
        </div>

        {analysis ? (
          <div className="suggestion-body">
            <div className="suggestion-row">
              <span className="suggestion-label ours">Ours</span>
              <p>{analysis.oursSummary || 'No meaningful change detected on our side.'}</p>
            </div>
            <div className="suggestion-row">
              <span className="suggestion-label theirs">Theirs</span>
              <p>{analysis.theirsSummary || 'No meaningful change detected on their side.'}</p>
            </div>
            <div className="suggestion-reco">
              <div className="suggestion-reco-head">
                <span className={`reco-badge ${recommendation}`}>{RECOMMENDATION_LABELS[recommendation]}</span>
                <span className="reco-title">AI recommendation</span>
              </div>
              {analysis.rationale ? <p>{analysis.rationale}</p> : null}
              {analysis.risks ? <p className="reco-risks">Risk: {analysis.risks}</p> : null}
            </div>
          </div>
        ) : (
          <div className="suggestion-fallback">
            AI could not analyze this conflict. Pick a resolution strategy below.
          </div>
        )}

        <div className="suggestion-actions">
          <button className="suggestion-btn" onClick={() => onPick('ours')}>
            Use ours
          </button>
          <button className="suggestion-btn" onClick={() => onPick('theirs')}>
            Use theirs
          </button>
          <button className="suggestion-btn" onClick={() => onPick('both')}>
            Keep both
          </button>
          <button
            className={`suggestion-btn primary ${recommendation === 'merged' ? 'recommended' : ''}`}
            onClick={() => onPick('ai-merge')}
          >
            {recommendation === 'merged' ? 'AI merge (recommended)' : 'AI merge'}
          </button>
          <button className="suggestion-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </StyledWrapper>
    </Modal>
  );
};

export default GitConflictSuggestionModal;
