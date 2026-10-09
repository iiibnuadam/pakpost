import styled from 'styled-components';

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 560px;
  max-width: 720px;

  .suggestion-header {
    margin-bottom: 0.75rem;
    flex-shrink: 0;

    h3 {
      font-size: ${(props) => props.theme.font.size.lg};
      font-weight: 600;
      margin: 0;
    }

    .suggestion-path {
      font-size: ${(props) => props.theme.font.size.sm};
      color: ${(props) => props.theme.colors.text.muted};
      word-break: break-all;
    }
  }

  .suggestion-body {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    margin-bottom: 0.75rem;
  }

  .suggestion-row {
    display: flex;
    align-items: flex-start;
    gap: 0.625rem;

    p {
      margin: 0;
      font-size: ${(props) => props.theme.font.size.sm};
      line-height: 1.5;
    }
  }

  .suggestion-label {
    flex-shrink: 0;
    width: 52px;
    text-align: center;
    padding: 0.125rem 0.375rem;
    font-size: ${(props) => props.theme.font.size.xs};
    font-weight: 600;
    border-radius: ${(props) => props.theme.border.radius.base};

    &.ours {
      color: ${(props) => props.theme.colors.text.warning};
      background: ${(props) => props.theme.colors.text.warning}15;
    }

    &.theirs {
      color: ${(props) => props.theme.colors.text.link};
      background: ${(props) => props.theme.colors.text.link}15;
    }
  }

  .suggestion-reco {
    border: 1px solid ${(props) => props.theme.border.border1};
    border-radius: ${(props) => props.theme.border.radius.base};
    padding: 0.625rem 0.75rem;

    p {
      margin: 0.375rem 0 0;
      font-size: ${(props) => props.theme.font.size.sm};
      line-height: 1.5;
    }

    .reco-risks {
      color: ${(props) => props.theme.colors.text.warning};
    }
  }

  .suggestion-reco-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .reco-badge {
    padding: 0.125rem 0.5rem;
    font-size: ${(props) => props.theme.font.size.xs};
    font-weight: 600;
    border-radius: 9999px;
    color: ${(props) => props.theme.colors.text.link};
    background: ${(props) => props.theme.colors.text.link}15;

    &.merged {
      color: ${(props) => props.theme.colors.text.purple};
      background: ${(props) => props.theme.colors.text.purple}15;
    }
  }

  .reco-title {
    font-size: ${(props) => props.theme.font.size.xs};
    color: ${(props) => props.theme.colors.text.muted};
  }

  .suggestion-fallback {
    margin-bottom: 0.75rem;
    padding: 0.625rem 0.75rem;
    font-size: ${(props) => props.theme.font.size.sm};
    border: 1px dashed ${(props) => props.theme.border.border1};
    border-radius: ${(props) => props.theme.border.radius.base};
    color: ${(props) => props.theme.colors.text.muted};
  }

  .suggestion-actions {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .suggestion-btn {
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

    &:hover {
      background: ${(props) => props.theme.sidebar.collection.item.hoverBg};
    }

    &.primary {
      background: ${(props) => props.theme.colors.text.link}15;
      border-color: ${(props) => props.theme.colors.text.link}40;
      color: ${(props) => props.theme.colors.text.link};

      &:hover {
        background: ${(props) => props.theme.colors.text.link};
        color: white;
      }

      &.recommended {
        background: ${(props) => props.theme.colors.text.purple}15;
        border-color: ${(props) => props.theme.colors.text.purple}40;
        color: ${(props) => props.theme.colors.text.purple};

        &:hover {
          background: ${(props) => props.theme.colors.text.purple};
          color: white;
        }
      }
    }
  }
`;

export default StyledWrapper;
