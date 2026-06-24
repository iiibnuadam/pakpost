import styled from 'styled-components';

const StyledWrapper = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  border-left: 1px solid ${(props) => props.theme.border.border1};
  padding: 1rem;
  overflow: hidden;
  background: ${(props) => props.theme.sidebar.bg};
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  .git-commit-detail-header {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .git-commit-detail-icon {
    color: ${(props) => props.theme.colors.text.link};
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  .git-commit-detail-title {
    min-width: 0;
    flex: 1;
  }

  .git-commit-detail-close {
    margin-left: auto;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: ${(props) => props.theme.border.radius.base};
    border: 1px solid transparent;
    background: transparent;
    color: ${(props) => props.theme.colors.text.muted};
    cursor: pointer;

    &:hover {
      background: ${(props) => props.theme.sidebar.collection.item.hoverBg};
      color: ${(props) => props.theme.text};
    }
  }

  .git-commit-detail-hash {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: ${(props) => props.theme.font.size.xs};
    color: ${(props) => props.theme.colors.text.muted};
    margin-bottom: 0.25rem;
  }

  .git-commit-detail-message {
    font-weight: 600;
    color: ${(props) => props.theme.text};
    word-break: break-word;
  }

  .git-commit-detail-meta {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: ${(props) => props.theme.font.size.sm};
    color: ${(props) => props.theme.colors.text.muted};
    padding-bottom: 1rem;
    border-bottom: 1px solid ${(props) => props.theme.border.border1};
  }

  .git-commit-detail-files {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  .git-commit-detail-files-title {
    font-size: ${(props) => props.theme.font.size.xs};
    font-weight: 600;
    text-transform: uppercase;
    color: ${(props) => props.theme.colors.text.muted};
    margin-bottom: 0.5rem;
  }

  .git-commit-detail-file {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.5rem;
    font-size: ${(props) => props.theme.font.size.sm};
    border-bottom: 1px solid ${(props) => props.theme.border.border1};
    cursor: pointer;
    border-radius: ${(props) => props.theme.border.radius.base};

    &:hover {
      background: ${(props) => props.theme.sidebar.collection.item.hoverBg};
    }

    &.selected {
      background: ${(props) => props.theme.sidebar.collection.item.activeBg};
    }
  }

  .git-commit-detail-file-status {
    font-weight: 600;
    width: 1.25rem;
    text-align: center;
  }

  .git-commit-detail-file.status-added .git-commit-detail-file-status {
    color: ${(props) => props.theme.colors.text.green};
  }

  .git-commit-detail-file.status-deleted .git-commit-detail-file-status {
    color: ${(props) => props.theme.colors.text.danger};
  }

  .git-commit-detail-file.status-modified .git-commit-detail-file-status {
    color: ${(props) => props.theme.colors.text.warning};
  }

  .git-commit-detail-file-path {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: ${(props) => props.theme.text};
  }

  .git-commit-detail-diff {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    border-top: 1px solid ${(props) => props.theme.border.border1};
    padding-top: 0.75rem;
  }

  .git-commit-detail-diff-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .git-commit-detail-diff-title {
    font-size: ${(props) => props.theme.font.size.sm};
    font-weight: 500;
    color: ${(props) => props.theme.text};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .git-commit-detail-diff-close {
    padding: 0.125rem 0.5rem;
    font-size: ${(props) => props.theme.font.size.xs};
    border-radius: ${(props) => props.theme.border.radius.base};
    border: 1px solid ${(props) => props.theme.border.border1};
    background: ${(props) => props.theme.background.base};
    color: ${(props) => props.theme.text};
    cursor: pointer;

    &:hover {
      background: ${(props) => props.theme.sidebar.collection.item.hoverBg};
    }
  }

  .git-commit-detail-diff-body {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .git-commit-detail-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${(props) => props.theme.colors.text.muted};
    font-size: ${(props) => props.theme.font.size.sm};
  }

  .git-resize-handle-horizontal {
    height: 6px;
    margin: 0 -1rem;
    cursor: row-resize;
    background: transparent;
    flex-shrink: 0;
    position: relative;

    &:hover::before,
    &:active::before {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: 2px;
      height: 2px;
      background: ${(props) => props.theme.colors.text.link};
    }
  }
`;

export default StyledWrapper;
