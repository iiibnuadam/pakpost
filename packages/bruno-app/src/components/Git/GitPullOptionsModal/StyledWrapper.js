import styled from 'styled-components';

const StyledWrapper = styled.div`
  .git-pull-options-modal-body {
    padding: 0 1rem 1rem;
    min-width: 420px;
  }

  .git-pull-options-modal-message {
    font-size: ${(props) => props.theme.font.size.sm};
    color: ${(props) => props.theme.text};
    margin-bottom: 1rem;
    line-height: 1.5;
  }

  .git-pull-options-warning {
    background: ${(props) => props.theme.status.warning.background};
    border: 1px solid ${(props) => props.theme.status.warning.border};
    border-radius: ${(props) => props.theme.border.radius.base};
    padding: 0.75rem;
    margin-bottom: 1rem;
    font-size: ${(props) => props.theme.font.size.sm};
    color: ${(props) => props.theme.status.warning.text};
  }

  .git-pull-options-section {
    margin-bottom: 1rem;

    label {
      display: block;
      font-size: ${(props) => props.theme.font.size.sm};
      color: ${(props) => props.theme.colors.text.muted};
      margin-bottom: 0.5rem;
    }
  }

  .git-pull-options-strategies {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .git-pull-option {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.625rem;
    border: 1px solid ${(props) => props.theme.border.border1};
    border-radius: ${(props) => props.theme.border.radius.base};
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease;

    &:hover {
      border-color: ${(props) => props.theme.brand};
    }

    &.selected {
      border-color: ${(props) => props.theme.brand};
      background: ${(props) => props.theme.status.info.background};
    }

    input {
      margin-top: 0.125rem;
    }
  }

  .git-pull-option-content {
    display: flex;
    flex-direction: column;
  }

  .git-pull-option-title {
    font-size: ${(props) => props.theme.font.size.sm};
    font-weight: 600;
    color: ${(props) => props.theme.text};
  }

  .git-pull-option-description {
    font-size: ${(props) => props.theme.font.size.xs};
    color: ${(props) => props.theme.colors.text.muted};
    margin-top: 0.125rem;
  }

  .git-pull-options-checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem;
    border: 1px solid ${(props) => props.theme.border.border1};
    border-radius: ${(props) => props.theme.border.radius.base};
    cursor: pointer;

    input {
      margin: 0;
    }

    span {
      font-size: ${(props) => props.theme.font.size.sm};
      color: ${(props) => props.theme.text};
    }

    .git-pull-options-checkbox-hint {
      font-size: ${(props) => props.theme.font.size.xs};
      color: ${(props) => props.theme.colors.text.muted};
      margin-left: auto;
    }
  }

  .git-pull-options-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1.5rem;

    button {
      padding: 0.5rem 1rem;
      border-radius: ${(props) => props.theme.border.radius.base};
      font-size: ${(props) => props.theme.font.size.sm};
      cursor: pointer;
      transition: opacity 0.15s ease;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .btn-cancel {
      background: transparent;
      border: 1px solid ${(props) => props.theme.border.border1};
      color: ${(props) => props.theme.text};
    }

    .btn-pull {
      background: ${(props) => props.theme.brand};
      border: 1px solid ${(props) => props.theme.brand};
      color: ${(props) => props.theme.colors.text.white};
    }
  }
`;

export default StyledWrapper;
