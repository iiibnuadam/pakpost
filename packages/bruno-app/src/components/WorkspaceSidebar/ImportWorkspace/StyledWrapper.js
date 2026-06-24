import styled from 'styled-components';

const StyledWrapper = styled.div`
  .tabs {
    border-bottom: 1px solid ${(props) => props.theme.border.border1};
  }

  .tab {
    cursor: pointer;
    color: ${(props) => props.theme.colors.text.muted};
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
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

  .info-box {
    background: ${(props) => props.theme.sidebar.bg};
    border: 1px solid ${(props) => props.theme.border.border1};
    border-radius: ${(props) => props.theme.border.radius.base};
    padding: 0.5rem;
    overflow: auto;
    max-height: 120px;
    white-space: pre-wrap;
    word-break: break-word;
  }
`;

export default StyledWrapper;
