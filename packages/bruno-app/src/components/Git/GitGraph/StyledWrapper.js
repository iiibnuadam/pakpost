import styled from 'styled-components';

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  .git-graph-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid ${(props) => props.theme.border.border1};
    flex-shrink: 0;
  }

  .git-graph-title {
    font-size: ${(props) => props.theme.font.size.lg};
    font-weight: 600;
    color: ${(props) => props.theme.text};
  }

  .git-graph-refresh {
    padding: 0.25rem 0.75rem;
    font-size: ${(props) => props.theme.font.size.sm};
    border-radius: ${(props) => props.theme.border.radius.base};
    border: 1px solid ${(props) => props.theme.border.border1};
    background: ${(props) => props.theme.background.base};
    color: ${(props) => props.theme.text};
    cursor: pointer;

    &:hover {
      background: ${(props) => props.theme.sidebar.collection.item.hoverBg};
    }
  }

  .git-graph-body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .git-graph-scroll {
    flex: 3 1 0;
    min-width: 0;
    min-height: 0;
    overflow: auto;
    padding: 1rem;
    background: ${(props) => props.theme.background.base};
  }

  .git-graph-svg {
    display: block;
    animation: git-graph-fade-in 0.35s ease-out;
  }

  @keyframes git-graph-fade-in {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .git-graph-link {
    stroke: ${(props) => props.theme.border.border1};
    stroke-width: 2;
    transition: d 0.4s ease, stroke 0.2s ease;
  }

  .git-graph-link.branch {
    stroke: ${(props) => props.theme.colors.text.warning};
    stroke-dasharray: 4 2;
  }

  .git-graph-link.branch-start,
  .git-graph-link.branch-end {
    stroke: ${(props) => props.theme.colors.text.warning};
  }

  .git-graph-node {
    cursor: pointer;
    transition: transform 0.4s ease, opacity 0.3s ease;
  }

  .git-graph-node-circle {
    fill: ${(props) => props.theme.colors.text.link};
    stroke: ${(props) => props.theme.background.base};
    stroke-width: 2;
    transition: fill 0.2s ease, stroke-width 0.2s ease, r 0.2s ease;
  }

  .git-graph-node.merge .git-graph-node-circle {
    fill: ${(props) => props.theme.colors.text.warning};
  }

  .git-graph-node.branch .git-graph-node-circle {
    fill: ${(props) => props.theme.colors.text.green};
  }

  .git-graph-node.selected .git-graph-node-circle {
    stroke: ${(props) => props.theme.text};
    stroke-width: 3;
  }

  .git-graph-node-label {
    font-size: ${(props) => props.theme.font.size.sm};
  }

  .git-graph-node-message {
    color: ${(props) => props.theme.text};
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .git-graph-node-meta {
    color: ${(props) => props.theme.colors.text.muted};
    font-size: ${(props) => props.theme.font.size.xs};
  }

  .git-graph-detail {
    flex: 2 1 0;
    min-width: 0;
    min-height: 0;
    border-top: 1px solid ${(props) => props.theme.border.border1};
    padding: 1rem;
    overflow: hidden;
    background: ${(props) => props.theme.sidebar.bg};
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .git-graph-detail-empty {
    flex: 2 1 0;
    min-width: 0;
    min-height: 0;
    border-top: 1px solid ${(props) => props.theme.border.border1};
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${(props) => props.theme.colors.text.muted};
    font-size: ${(props) => props.theme.font.size.sm};
  }

  .git-graph-detail-header {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .git-graph-detail-icon {
    color: ${(props) => props.theme.colors.text.link};
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  .git-graph-detail-title {
    min-width: 0;
  }

  .git-graph-detail-hash {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: ${(props) => props.theme.font.size.xs};
    color: ${(props) => props.theme.colors.text.muted};
    margin-bottom: 0.25rem;
  }

  .git-graph-detail-message {
    font-weight: 600;
    color: ${(props) => props.theme.text};
    word-break: break-word;
  }

  .git-graph-detail-meta {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: ${(props) => props.theme.font.size.sm};
    color: ${(props) => props.theme.colors.text.muted};
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid ${(props) => props.theme.border.border1};
  }

  .git-graph-detail-files {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  .git-graph-detail-files-title {
    font-size: ${(props) => props.theme.font.size.xs};
    font-weight: 600;
    text-transform: uppercase;
    color: ${(props) => props.theme.colors.text.muted};
    margin-bottom: 0.5rem;
  }

  .git-graph-detail-file {
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

  .git-graph-detail-file-status {
    font-weight: 600;
    width: 1.25rem;
    text-align: center;
  }

  .git-graph-detail-file.status-added .git-graph-detail-file-status {
    color: ${(props) => props.theme.colors.text.green};
  }

  .git-graph-detail-file.status-deleted .git-graph-detail-file-status {
    color: ${(props) => props.theme.colors.text.danger};
  }

  .git-graph-detail-file.status-modified .git-graph-detail-file-status {
    color: ${(props) => props.theme.colors.text.warning};
  }

  .git-graph-detail-file-path {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: ${(props) => props.theme.text};
  }

  .git-graph-loading,
  .git-graph-error,
  .git-graph-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: ${(props) => props.theme.colors.text.muted};
    font-size: ${(props) => props.theme.font.size.sm};
  }

  .git-graph-error {
    color: ${(props) => props.theme.colors.text.danger};
  }

  .git-graph-detail-diff {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    border-top: 1px solid ${(props) => props.theme.border.border1};
    padding-top: 0.75rem;
  }

  .git-graph-detail-diff-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .git-graph-detail-diff-title {
    font-size: ${(props) => props.theme.font.size.sm};
    font-weight: 500;
    color: ${(props) => props.theme.text};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .git-graph-detail-diff-close {
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

  .git-graph-detail-diff-body {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
`;

export default StyledWrapper;
