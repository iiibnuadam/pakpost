import styled from 'styled-components';

const StyledWrapper = styled.div`
  .git-credentials-modal-body {
    padding: 0 1rem 1rem;
  }

  .git-credentials-modal-message {
    font-size: ${(props) => props.theme.font.size.sm};
    color: ${(props) => props.theme.text};
    margin-bottom: 1rem;
    line-height: 1.5;
  }

  .git-credentials-modal-field {
    margin-bottom: 1rem;

    label {
      display: block;
      font-size: ${(props) => props.theme.font.size.sm};
      color: ${(props) => props.theme.colors.text.muted};
      margin-bottom: 0.375rem;
    }

    input {
      width: 100%;
      padding: 0.5rem;
      border-radius: ${(props) => props.theme.border.radius.base};
      border: 1px solid ${(props) => props.theme.border.border1};
      background: ${(props) => props.theme.background.base};
      color: ${(props) => props.theme.text};
      font-size: ${(props) => props.theme.font.size.sm};

      &:focus {
        outline: none;
        border-color: ${(props) => props.theme.colors.text.link};
      }
    }
  }

  .git-credentials-modal-hint {
    font-size: ${(props) => props.theme.font.size.xs};
    color: ${(props) => props.theme.colors.text.muted};
    margin-top: 0.5rem;
  }
`;

export default StyledWrapper;
