import styled from 'styled-components';

const StyledWrapper = styled.div`
  height: 100%;
  overflow: auto;
  background: ${(props) => props.theme.background.base};
  border: 1px solid ${(props) => props.theme.border.border1};
  border-radius: ${(props) => props.theme.border.radius.base};

  .git-diff-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: ${(props) => props.theme.colors.text.muted};
    font-size: ${(props) => props.theme.font.size.sm};
  }

  .git-diff-viewer {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    font-size: ${(props) => props.theme.font.size.sm};
    line-height: 1.5;
  }

  .diff-line {
    display: flex;
    padding: 0 0.75rem;
    white-space: pre;
  }

  .diff-line-marker {
    flex-shrink: 0;
    width: 1.25rem;
    text-align: center;
    user-select: none;
    opacity: 0.7;
  }

  .diff-line-content {
    flex: 1;
    min-width: 0;
    overflow: visible;
  }

  .diff-line-file {
    background: ${(props) => props.theme.sidebar.bg};
    color: ${(props) => props.theme.text};
    font-weight: 600;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    border-top: 1px solid ${(props) => props.theme.border.border1};
  }

  .diff-line-meta {
    background: ${(props) => props.theme.sidebar.bg};
    color: ${(props) => props.theme.colors.text.muted};
  }

  .diff-line-hunk {
    background: ${(props) => props.theme.colors.text.link}15;
    color: ${(props) => props.theme.colors.text.link};
  }

  .diff-line-context {
    color: ${(props) => props.theme.text};
  }

  .diff-line-added {
    background: ${(props) => props.theme.status.success.background};
    color: ${(props) => props.theme.status.success.text};

    .diff-line-marker {
      color: ${(props) => props.theme.status.success.text};
      font-weight: 600;
    }
  }

  .diff-line-removed {
    background: ${(props) => props.theme.status.danger.background};
    color: ${(props) => props.theme.status.danger.text};

    .diff-line-marker {
      color: ${(props) => props.theme.status.danger.text};
      font-weight: 600;
    }
  }
`;

export default StyledWrapper;
