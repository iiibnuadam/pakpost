import React, { useState, useEffect } from 'react';
import Modal from 'components/Modal';
import StyledWrapper from './StyledWrapper';

const STRATEGIES = [
  {
    value: '--ff-only',
    label: 'Fast-forward only',
    description: 'Aman — hanya pull kalau tidak ada perubahan lokal yang bertabrakan.'
  },
  {
    value: '--rebase',
    label: 'Rebase',
    description: 'Terapkan commit lokal di atas commit remote. Riwayat tetap rapi, tapi bisa konflik.'
  },
  {
    value: '--no-rebase',
    label: 'Merge',
    description: 'Gabungkan perubahan lokal dan remote dalam satu merge commit.'
  }
];

const GitPullOptionsModal = ({ pullStatus, onCancel, onConfirm }) => {
  const [strategy, setStrategy] = useState('--ff-only');
  const [stashBeforePull, setStashBeforePull] = useState(false);

  useEffect(() => {
    if (pullStatus) {
      // Pre-select rebase/merge if fast-forward is not possible.
      if (!pullStatus.canFastForward && pullStatus.isDiverged) {
        setStrategy('--rebase');
      }
      // Pre-check stash if there are local changes.
      if (pullStatus.hasLocalChanges) {
        setStashBeforePull(true);
      }
    }
  }, [pullStatus]);

  const handleConfirm = () => {
    onConfirm({ strategy, stashBeforePull });
  };

  return (
    <Modal handleCancel={onCancel} hideFooter disableCloseOnOutsideClick>
      <StyledWrapper>
        <div className="git-pull-options-modal-body">
          <h3 className="text-lg font-semibold mb-2">Pull Options</h3>

          {!pullStatus?.canFastForward && pullStatus?.behind > 0 ? (
            <div className="git-pull-options-warning">
              Branch lokal dan remote sudah berbeda arah.
              Fast-forward tidak memungkinkan — pilih Rebase atau Merge.
            </div>
          ) : null}

          {pullStatus?.hasLocalChanges ? (
            <div className="git-pull-options-warning">
              Ada perubahan lokal yang belum di-commit.
            </div>
          ) : null}

          <div className="git-pull-options-section">
            <label>Pull strategy</label>
            <div className="git-pull-options-strategies">
              {STRATEGIES.map((s) => (
                <label
                  key={s.value}
                  className={`git-pull-option ${strategy === s.value ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="pull-strategy"
                    value={s.value}
                    checked={strategy === s.value}
                    onChange={() => setStrategy(s.value)}
                  />
                  <div className="git-pull-option-content">
                    <span className="git-pull-option-title">{s.label}</span>
                    <span className="git-pull-option-description">{s.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <label className="git-pull-options-checkbox">
            <input
              type="checkbox"
              checked={stashBeforePull}
              onChange={(e) => setStashBeforePull(e.target.checked)}
            />
            <span>Stash perubahan lokal sebelum pull</span>
          </label>

          <div className="git-pull-options-actions">
            <button className="btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button className="btn-pull" onClick={handleConfirm}>
              Pull
            </button>
          </div>
        </div>
      </StyledWrapper>
    </Modal>
  );
};

export default GitPullOptionsModal;
