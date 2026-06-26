import styled from 'styled-components';

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  padding: 1rem;

  .git-tab-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    gap: 1rem;
    flex-shrink: 0;
  }

  .git-tab-title {
    font-size: ${(props) => props.theme.font.size.lg};
    font-weight: 600;
    color: ${(props) => props.theme.text};
  }

  .git-branch-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .git-header-actions {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .git-auto-row {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    margin-bottom: 1rem;
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  .git-auto-toggle {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: ${(props) => props.theme.font.size.sm};
    color: ${(props) => props.theme.colors.text.muted};
    cursor: pointer;
    user-select: none;

    input[type='checkbox'] {
      cursor: pointer;
    }
  }

  .git-interval-select {
    padding: 0.25rem 0.5rem;
    border-radius: ${(props) => props.theme.border.radius.base};
    border: 1px solid ${(props) => props.theme.border.border1};
    background: ${(props) => props.theme.background.base};
    color: ${(props) => props.theme.text};
    font-size: ${(props) => props.theme.font.size.sm};
  }

  .git-credentials-btn {
    margin-left: auto;
  }

  .git-branch-select {
    min-width: 180px;
    padding: 0.375rem 0.5rem;
    border-radius: ${(props) => props.theme.border.radius.base};
    border: 1px solid ${(props) => props.theme.border.border1};
    background: ${(props) => props.theme.background.base};
    color: ${(props) => props.theme.text};
    font-size: ${(props) => props.theme.font.size.sm};
  }

  .git-badge {
    font-size: ${(props) => props.theme.font.size.xs};
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    background: ${(props) => props.theme.sidebar.bg};
    color: ${(props) => props.theme.colors.text.muted};
  }

  .git-badge-ahead {
    color: ${(props) => props.theme.colors.text.green};
  }

  .git-badge-behind {
    color: ${(props) => props.theme.colors.text.warning};
  }

  .git-recovery-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
    border-bottom: 1px solid ${(props) => props.theme.border.border1};
  }

  .git-recovery-label {
    font-size: ${(props) => props.theme.font.size.sm};
    color: ${(props) => props.theme.colors.text.muted};
    margin-right: 0.25rem;
  }

  .git-tabs {
    display: flex;
    gap: 0.5rem;
    border-bottom: 1px solid ${(props) => props.theme.border.border1};
    margin-bottom: 1rem;
    flex-shrink: 0;
  }

  .git-tab {
    padding: 0.5rem 1rem;
    font-size: ${(props) => props.theme.font.size.sm};
    color: ${(props) => props.theme.colors.text.muted};
    cursor: pointer;
    border-bottom: 2px solid transparent;
    user-select: none;

    &:hover {
      color: ${(props) => props.theme.text};
    }

    &.active {
      color: ${(props) => props.theme.text};
      border-bottom-color: ${(props) => props.theme.colors.text.link};
      font-weight: 500;
    }
  }

  .git-tab-content {
    flex: 1;
    min-height: 0;
    display: flex;
    gap: 1rem;
    overflow: hidden;
  }

  .git-tab-content-graph {
    gap: 0;
    padding: 0;
  }

  .git-init-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 1rem;
    margin: 0 1rem 1rem 1rem;
    border: 1px dashed ${(props) => props.theme.colors.text.link}40;
    border-radius: ${(props) => props.theme.border.radius.base};
    background: ${(props) => props.theme.colors.text.link}08;
    color: ${(props) => props.theme.text};
    font-size: ${(props) => props.theme.font.size.sm};
  }

  .git-init-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
    min-width: 0;
  }

  .git-init-title {
    font-weight: 500;
  }

  .git-init-remote-label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: ${(props) => props.theme.font.size.xs};
    color: ${(props) => props.theme.colors.text.muted};
  }

  .git-init-remote-input {
    width: 100%;
    max-width: 420px;
    padding: 0.5rem;
    border: 1px solid ${(props) => props.theme.border.border1};
    border-radius: ${(props) => props.theme.border.radius.base};
    background: ${(props) => props.theme.background.base};
    color: ${(props) => props.theme.text};
    font-size: ${(props) => props.theme.font.size.sm};
  }

  .git-tab-content-vertical {
    flex-direction: column;
    gap: 0;
    padding: 0;
  }

  .git-sidebar {
    width: 280px;
    min-width: 240px;
    max-width: 340px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow: hidden;
    border-right: 1px solid ${(props) => props.theme.border.border1};
    padding-right: 1rem;
  }

  .git-section {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .git-section-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    font-size: ${(props) => props.theme.font.size.xs};
    font-weight: 600;
    text-transform: uppercase;
    color: ${(props) => props.theme.colors.text.muted};
    margin-bottom: 0.5rem;
    flex-shrink: 0;
  }

  .git-state-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    margin-bottom: 0.5rem;
    border-radius: ${(props) => props.theme.border.radius.base};
    font-size: ${(props) => props.theme.font.size.sm};

    &.merge {
      background: ${(props) => props.theme.colors.text.warning}15;
      border: 1px solid ${(props) => props.theme.colors.text.warning}40;
      color: ${(props) => props.theme.colors.text.warning};
    }

    &.rebase {
      background: ${(props) => props.theme.colors.text.link}15;
      border: 1px solid ${(props) => props.theme.colors.text.link}40;
      color: ${(props) => props.theme.colors.text.link};
    }
  }

  .git-state-banner-text {
    flex: 1;
    min-width: 0;
  }

  .git-state-banner-actions {
    display: flex;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  .git-file-list {
    flex: 1;
    overflow: auto;
    font-size: ${(props) => props.theme.font.size.sm};
  }

  .git-file-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.5rem;
    border-radius: ${(props) => props.theme.border.radius.base};
    cursor: pointer;
    color: ${(props) => props.theme.text};

    &:hover {
      background: ${(props) => props.theme.sidebar.collection.item.hoverBg};
    }

    &.selected {
      background: ${(props) => props.theme.sidebar.collection.item.activeBg};
    }
  }

  .git-file-status {
    font-size: ${(props) => props.theme.font.size.xs};
    font-weight: 600;
    width: 1.25rem;
    text-align: center;
    text-transform: uppercase;
  }

  .git-file-status.added {
    color: ${(props) => props.theme.colors.text.green};
  }

  .git-file-status.modified {
    color: ${(props) => props.theme.colors.text.warning};
  }

  .git-file-status.deleted {
    color: ${(props) => props.theme.colors.text.danger};
  }

  .git-file-status.untracked {
    color: ${(props) => props.theme.colors.text.muted};
  }

  .git-file-path {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .git-file-actions {
    display: flex;
    gap: 0.25rem;
    opacity: 1;
  }

  .git-file-action-btn {
    padding: 0.125rem 0.5rem;
    font-size: ${(props) => props.theme.font.size.xs};
    border-radius: ${(props) => props.theme.border.radius.base};
    border: 1px solid ${(props) => props.theme.border.border1};
    background: ${(props) => props.theme.background.base};
    color: ${(props) => props.theme.text};
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s ease;

    &:hover {
      background: ${(props) => props.theme.sidebar.collection.item.hoverBg};
    }

    &.stage {
      color: ${(props) => props.theme.colors.text.green};
      border-color: ${(props) => props.theme.colors.text.green};

      &:hover {
        background: ${(props) => props.theme.colors.text.green};
        color: white;
      }
    }

    &.unstage {
      color: ${(props) => props.theme.colors.text.warning};
      border-color: ${(props) => props.theme.colors.text.warning};

      &:hover {
        background: ${(props) => props.theme.colors.text.warning};
        color: white;
      }
    }

    &.discard {
      color: ${(props) => props.theme.colors.text.danger};
      border-color: ${(props) => props.theme.colors.text.danger};

      &:hover {
        background: ${(props) => props.theme.colors.text.danger};
        color: white;
      }
    }

    &.ours {
      color: ${(props) => props.theme.colors.text.warning};
      border-color: ${(props) => props.theme.colors.text.warning};

      &:hover {
        background: ${(props) => props.theme.colors.text.warning};
        color: white;
      }
    }

    &.theirs {
      color: ${(props) => props.theme.colors.text.link};
      border-color: ${(props) => props.theme.colors.text.link};

      &:hover {
        background: ${(props) => props.theme.colors.text.link};
        color: white;
      }
    }
  }

  .git-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    font-size: ${(props) => props.theme.font.size.xs};
    border-radius: ${(props) => props.theme.border.radius.base};
    border: 1px solid ${(props) => props.theme.border.border1};
    background: ${(props) => props.theme.background.base};
    color: ${(props) => props.theme.text};
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover:not(:disabled) {
      background: ${(props) => props.theme.sidebar.collection.item.hoverBg};
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &.primary {
      background: ${(props) => props.theme.colors.text.link}15;
      border-color: ${(props) => props.theme.colors.text.link}40;
      color: ${(props) => props.theme.colors.text.link};

      &:hover:not(:disabled) {
        background: ${(props) => props.theme.colors.text.link};
        color: white;
      }
    }

    &.success {
      background: ${(props) => props.theme.colors.text.green}15;
      border-color: ${(props) => props.theme.colors.text.green}40;
      color: ${(props) => props.theme.colors.text.green};

      &:hover:not(:disabled) {
        background: ${(props) => props.theme.colors.text.green};
        color: white;
      }
    }

    &.danger {
      background: ${(props) => props.theme.colors.text.danger}15;
      border-color: ${(props) => props.theme.colors.text.danger}40;
      color: ${(props) => props.theme.colors.text.danger};

      &:hover:not(:disabled) {
        background: ${(props) => props.theme.colors.text.danger};
        color: white;
      }
    }

    &.info {
      background: ${(props) => props.theme.colors.text.warning}10;
      border-color: ${(props) => props.theme.colors.text.warning}40;
      color: ${(props) => props.theme.colors.text.warning};

      &:hover:not(:disabled) {
        background: ${(props) => props.theme.colors.text.warning};
        color: white;
      }
    }
  }

  .git-commit-btn {
    padding: 0.375rem 0.75rem;
    font-weight: 500;
    background: ${(props) => props.theme.colors.text.green}15;
    border-color: ${(props) => props.theme.colors.text.green}40;
    color: ${(props) => props.theme.colors.text.green};

    &:hover:not(:disabled) {
      background: ${(props) => props.theme.colors.text.green};
      color: white;
    }
  }

  .git-diff-pane {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .git-diff-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    flex-shrink: 0;
  }

  .git-diff-title {
    font-size: ${(props) => props.theme.font.size.sm};
    font-weight: 500;
    color: ${(props) => props.theme.text};
  }

  .git-diff-container {
    flex: 1;
    overflow: hidden;
  }

  .git-resize-handle {
    width: 6px;
    margin: -1rem 0;
    cursor: col-resize;
    background: transparent;
    flex-shrink: 0;
    position: relative;

    &:hover::before,
    &:active::before {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      left: 2px;
      width: 2px;
      background: ${(props) => props.theme.colors.text.link};
    }
  }

  .git-commit-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    border-bottom: 1px solid ${(props) => props.theme.border.border1};
    font-size: ${(props) => props.theme.font.size.sm};
    cursor: pointer;

    &:hover {
      background: ${(props) => props.theme.sidebar.collection.item.hoverBg};
    }

    &.selected {
      background: ${(props) => props.theme.sidebar.collection.item.activeBg};
    }
  }

  .git-commit-hash {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    color: ${(props) => props.theme.colors.text.muted};
    font-size: ${(props) => props.theme.font.size.xs};
  }

  .git-commit-message {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: ${(props) => props.theme.text};
  }

  .git-commit-meta {
    color: ${(props) => props.theme.colors.text.muted};
    font-size: ${(props) => props.theme.font.size.xs};
  }

  .git-commit-box {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
    flex-shrink: 0;
  }

  .git-commit-input {
    flex: 1;
    padding: 0.5rem;
    border-radius: ${(props) => props.theme.border.radius.base};
    border: 1px solid ${(props) => props.theme.border.border1};
    background: ${(props) => props.theme.background.base};
    color: ${(props) => props.theme.text};
    font-size: ${(props) => props.theme.font.size.sm};
    resize: vertical;
    font-family: inherit;
    line-height: 1.4;

    &:focus {
      outline: none;
      border-color: ${(props) => props.theme.colors.text.link};
    }
  }

  .git-stash-section {
    margin-top: 0.5rem;
  }

  .git-stash-create {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .git-stash-input {
    flex: 1;
    min-width: 0;
    padding: 0.375rem 0.5rem;
    border: 1px solid ${(props) => props.theme.border.border1};
    border-radius: ${(props) => props.theme.border.radius.base};
    background: ${(props) => props.theme.background.base};
    color: ${(props) => props.theme.text};
    font-size: ${(props) => props.theme.font.size.sm};

    &:focus {
      outline: none;
      border-color: ${(props) => props.theme.colors.text.link};
    }
  }

  .git-stash-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .git-stash-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.375rem 0.5rem;
    border-radius: ${(props) => props.theme.border.radius.base};
    background: ${(props) => props.theme.background.base};
    font-size: ${(props) => props.theme.font.size.sm};
  }

  .git-stash-message {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .git-stash-actions {
    display: flex;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  .git-stash-meta {
    font-size: ${(props) => props.theme.font.size.xs};
    color: ${(props) => props.theme.colors.text.muted};
    flex-shrink: 0;
  }

  .git-branch-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    overflow: auto;
  }

  .git-branch-create {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .git-branch-input {
    flex: 1;
    min-width: 0;
    padding: 0.375rem 0.5rem;
    border: 1px solid ${(props) => props.theme.border.border1};
    border-radius: ${(props) => props.theme.border.radius.base};
    background: ${(props) => props.theme.background.base};
    color: ${(props) => props.theme.text};
    font-size: ${(props) => props.theme.font.size.sm};
  }

  .git-branch-row-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: ${(props) => props.theme.border.radius.base};
    cursor: pointer;
    font-size: ${(props) => props.theme.font.size.sm};

    &:hover {
      background: ${(props) => props.theme.sidebar.collection.item.hoverBg};
    }

    &.current {
      background: ${(props) => props.theme.sidebar.collection.item.activeBg};
      cursor: default;
    }
  }

  .git-branch-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .git-branch-current-badge {
    font-size: ${(props) => props.theme.font.size.xs};
    color: ${(props) => props.theme.colors.text.green};
    font-weight: 500;
  }

  .git-branch-actions {
    display: flex;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  .git-empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: ${(props) => props.theme.colors.text.muted};
    font-size: ${(props) => props.theme.font.size.sm};
  }

  .git-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    height: 100%;
    color: ${(props) => props.theme.colors.text.muted};
  }

  .git-error {
    color: ${(props) => props.theme.colors.text.danger};
    padding: 1rem;
    font-size: ${(props) => props.theme.font.size.sm};
  }
`;

export default StyledWrapper;
