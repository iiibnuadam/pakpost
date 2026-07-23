import styled from 'styled-components';

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 600px;
  max-width: 900px;
  height: 70vh;

  .git-conflict-editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.75rem;
    flex-shrink: 0;

    h3 {
      font-size: ${(props) => props.theme.font.size.lg};
      font-weight: 600;
      margin: 0;
    }

    .git-conflict-editor-path {
      font-size: ${(props) => props.theme.font.size.sm};
      color: ${(props) => props.theme.colors.text.muted};
      word-break: break-all;
    }
  }

  .git-conflict-editor-container {
    flex: 1;
    min-height: 0;
    border: 1px solid ${(props) => props.theme.border.border1};
    border-radius: ${(props) => props.theme.border.radius.base};
    overflow: hidden;

    .CodeMirror {
      height: 100%;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: ${(props) => props.theme.font.size.sm};
    }
  }

  .git-conflict-editor-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 0.75rem;
    flex-shrink: 0;
  }

  .git-conflict-editor-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.75rem;
    font-size: ${(props) => props.theme.font.size.sm};
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
  }
`;

export default StyledWrapper;
