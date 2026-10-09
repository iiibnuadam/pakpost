import styled from 'styled-components';

const StyledWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  flex-shrink: 0;
  border-left: 1px solid ${(props) => props.theme.input.border};
  background: ${(props) => props.theme.bg};
  color: ${(props) => props.theme.text};

  .ai-chat-resize-handle {
    position: absolute;
    left: -3px;
    top: 0;
    bottom: 0;
    width: 6px;
    cursor: col-resize;
    z-index: 5;

    &:hover {
      background: ${(props) => props.theme.colors.accent}33;
    }
  }

  .ai-chat-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    border-bottom: 1px solid ${(props) => props.theme.input.border};
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;

    .ai-chat-title {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: ${(props) => props.theme.text};
    }

    .ai-chat-status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: ${(props) => props.theme.input.border};

      &.configured {
        background: ${(props) => props.theme.colors.text.green};
      }
    }

    .ai-chat-header-actions {
      margin-left: auto;
      display: inline-flex;
      gap: 2px;
    }
  }

  .ai-chat-session-row {
    display: flex;
    align-items: center;
    padding: 6px 8px;
    border-bottom: 1px solid ${(props) => props.theme.input.border};
    flex-shrink: 0;
  }

  .ai-chat-session-select {
    appearance: none;
    -webkit-appearance: none;
    width: 100%;
    padding: 4px 20px 4px 8px;
    font-size: 11.5px;
    font-family: inherit;
    border-radius: ${(props) => props.theme.border.radius.sm};
    border: 1px solid ${(props) => props.theme.input.border};
    background: ${(props) => props.theme.input.bg};
    color: ${(props) => props.theme.text};
    cursor: pointer;
    background-image: linear-gradient(45deg, transparent 50%, ${(props) => props.theme.colors.text.muted} 50%),
      linear-gradient(135deg, ${(props) => props.theme.colors.text.muted} 50%, transparent 50%);
    background-position: calc(100% - 12px) 55%, calc(100% - 8px) 55%;
    background-size: 4px 4px;
    background-repeat: no-repeat;

    &:hover:not(:disabled) {
      border-color: ${(props) => props.theme.colors.accent}80;
    }

    &:focus {
      outline: none;
      border-color: ${(props) => props.theme.input.focusBorder};
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }

  .ai-chat-btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border: none;
    border-radius: ${(props) => props.theme.border.radius.sm};
    background: transparent;
    color: ${(props) => props.theme.colors.text.muted};
    cursor: pointer;

    &:hover:not(:disabled) {
      background: ${(props) => props.theme.colors.accent}10;
      color: ${(props) => props.theme.text};
    }

    &.confirming,
    &.confirming:hover:not(:disabled) {
      color: #fff;
      background: ${(props) => props.theme.colors.bg.danger};
    }

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  }

  .ai-chat-messages {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .ai-chat-empty {
    margin: auto;
    text-align: center;
    color: ${(props) => props.theme.colors.text.muted};
    font-size: 12px;
    padding: 16px;

    .ai-chat-empty-icon {
      display: flex;
      justify-content: center;
      margin-bottom: 8px;
      color: ${(props) => props.theme.colors.accent};
    }
  }

  .ai-chat-msg {
    display: flex;

    &.user {
      justify-content: flex-end;
    }

    &.assistant,
    &.error {
      justify-content: flex-start;
    }
  }

  .ai-chat-bubble {
    position: relative;
    max-width: 92%;
    padding: 7px 10px;
    border-radius: ${(props) => props.theme.border.radius.md};
    font-size: 12px;
    line-height: 1.5;
    overflow-wrap: break-word;
    white-space: pre-wrap;

    .ai-chat-msg.user & {
      background: ${(props) => props.theme.colors.accent}18;
      border: 1px solid ${(props) => props.theme.colors.accent}40;
    }

    .ai-chat-msg.assistant & {
      background: ${(props) => props.theme.input.bg};
      border: 1px solid ${(props) => props.theme.input.border};
    }

    .ai-chat-msg.error & {
      background: ${(props) => props.theme.colors.bg.danger}15;
      border: 1px solid ${(props) => props.theme.colors.bg.danger}40;
      color: ${(props) => props.theme.colors.text.danger};
    }

    .markdown-body {
      font-size: 12px;
      background: transparent;
      padding: 0;
    }

    .ai-chat-thinking {
      color: ${(props) => props.theme.colors.text.muted};
      font-style: italic;
    }
  }

  .ai-md {
    font-size: 12px;
    line-height: 1.55;
    overflow-wrap: break-word;
    white-space: normal;

    > *:first-child {
      margin-top: 0;
    }

    > *:last-child {
      margin-bottom: 0;
    }

    p {
      margin: 5px 0;
      white-space: normal;
    }

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      margin: 10px 0 4px;
      font-weight: 600;
      line-height: 1.3;
      border-bottom: none;
      padding-bottom: 0;
    }

    h1 {
      font-size: 13.5px;
    }

    h2 {
      font-size: 13px;
    }

    h3,
    h4,
    h5,
    h6 {
      font-size: 12.5px;
    }

    ul,
    ol {
      margin: 5px 0;
      padding-left: 20px;

      li {
        margin: 2px 0;
        padding-left: 2px;

        p {
          margin: 0;
        }
      }

      // Preflight Tailwind me-reset list-style — kembalikan eksplisit.
      ul {
        list-style: circle;

        ul {
          list-style: square;
        }
      }

      ol {
        list-style: lower-alpha;

        ol {
          list-style: lower-roman;
        }
      }
    }

    ul {
      list-style: disc;
    }

    ol {
      list-style: decimal;
    }

    pre {
      position: relative;
      margin: 6px 0;
      padding: 8px 10px;
      padding-top: 26px;
      border-radius: ${(props) => props.theme.border.radius.sm};
      background: ${(props) => props.theme.sidebar.bg};
      border: 1px solid ${(props) => props.theme.input.border};
      font-size: 11px;
      line-height: 1.45;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;

      code {
        background: transparent;
        padding: 0;
        border: none;
        font-size: inherit;
      }
    }

    .ai-md-copy-btn {
      position: absolute;
      top: 4px;
      right: 4px;
      padding: 2px 8px;
      font-size: 10px;
      font-family: inherit;
      border: 1px solid ${(props) => props.theme.input.border};
      border-radius: ${(props) => props.theme.border.radius.sm};
      background: ${(props) => props.theme.input.bg};
      color: ${(props) => props.theme.colors.text.muted};
      cursor: pointer;

      &:hover {
        color: ${(props) => props.theme.text};
        border-color: ${(props) => props.theme.colors.accent}80;
      }

      &.copied {
        color: ${(props) => props.theme.colors.text.green};
        border-color: ${(props) => props.theme.colors.text.green};
      }
    }

    code {
      font-family: ${(props) => props.theme.font.monospace || 'monospace'};
      font-size: 11px;
      background: ${(props) => props.theme.sidebar.bg};
      border: 1px solid ${(props) => props.theme.input.border};
      border-radius: 3px;
      padding: 1px 4px;
    }

    table {
      margin: 6px 0;
      border-collapse: collapse;
      font-size: 11px;
      display: block;
      overflow-x: auto;
      max-width: 100%;

      th,
      td {
        border: 1px solid ${(props) => props.theme.input.border};
        padding: 4px 8px;
        text-align: left;
      }

      th {
        background: ${(props) => props.theme.input.bg};
        font-weight: 600;
      }
    }

    blockquote {
      margin: 6px 0;
      padding: 2px 10px;
      border-left: 3px solid ${(props) => props.theme.colors.accent};
      color: ${(props) => props.theme.colors.text.muted};
    }

    hr {
      margin: 10px 0;
      border: none;
      border-top: 1px solid ${(props) => props.theme.input.border};
      background: none;
      height: auto;
    }

    a {
      color: ${(props) => props.theme.colors.text.link};
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .ai-chat-copy-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 3px;
    border: none;
    border-radius: ${(props) => props.theme.border.radius.sm};
    background: transparent;
    color: ${(props) => props.theme.colors.text.muted};
    cursor: pointer;
    opacity: 0.45;

    &:hover {
      opacity: 1;
      background: ${(props) => props.theme.colors.accent}10;
      color: ${(props) => props.theme.text};
    }
  }

  .ai-chat-input-area {
    flex-shrink: 0;
    border-top: 1px solid ${(props) => props.theme.input.border};
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .ai-chat-input-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .ai-chat-input {
    flex: 1;
    resize: vertical;
    padding: 7px 9px;
    font-family: inherit;
    font-size: 12px;
    line-height: 1.4;
    max-height: 40vh;
    border-radius: ${(props) => props.theme.border.radius.md};
    border: 1px solid ${(props) => props.theme.input.border};
    background: ${(props) => props.theme.input.bg};
    color: ${(props) => props.theme.text};

    &::placeholder {
      color: ${(props) => props.theme.colors.text.muted};
      opacity: 0.7;
    }

    &:focus {
      outline: none;
      border-color: ${(props) => props.theme.input.focusBorder};
    }

    &:disabled {
      opacity: 0.6;
    }
  }

  .ai-chat-send {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    border: 1px solid ${(props) => props.theme.colors.accent};
    border-radius: ${(props) => props.theme.border.radius.md};
    background: ${(props) => props.theme.colors.accent};
    color: white;
    cursor: pointer;

    &:hover:not(:disabled) {
      opacity: 0.88;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &.stop {
      background: ${(props) => props.theme.colors.bg.danger};
      border-color: ${(props) => props.theme.colors.bg.danger};
    }
  }

  .ai-chat-hint {
    font-size: 10.5px;
    color: ${(props) => props.theme.colors.text.muted};
    display: flex;
    align-items: center;
    gap: 5px;

    .ai-chat-hint-warn {
      color: ${(props) => props.theme.colors.text.warning};
    }
  }
`;

export default StyledWrapper;
