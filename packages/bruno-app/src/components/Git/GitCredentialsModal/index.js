import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Modal from 'components/Modal';
import {
  hideGitCredentialsModal,
  updateGitWorkspaceSettings,
  getGitWorkspaceSettings
} from 'providers/ReduxStore/slices/git';
import StyledWrapper from './StyledWrapper';

const GitCredentialsModal = () => {
  const dispatch = useDispatch();
  const { workspaceUid, reason } = useSelector((state) => state.git.credentialsModal);
  const settings = useSelector((state) => getGitWorkspaceSettings(state, workspaceUid));
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    if (workspaceUid) {
      setUsername(settings.gitUsername || '');
      setToken(settings.gitToken || '');
    }
  }, [workspaceUid, settings.gitUsername, settings.gitToken]);

  if (!workspaceUid) return null;

  const handleSave = () => {
    dispatch(updateGitWorkspaceSettings(workspaceUid, { gitUsername: username, gitToken: token }));
    dispatch(hideGitCredentialsModal());
  };

  const handleCancel = () => {
    dispatch(hideGitCredentialsModal());
  };

  const title = reason === 'expired' ? 'Git Credentials Expired' : 'Git Credentials Required';
  const message = reason === 'expired'
    ? 'Your stored Git credentials are no longer valid. Please update them to continue pushing.'
    : 'Auto-push is enabled but no Git credentials are saved. Enter your credentials to continue.';

  return (
    <StyledWrapper>
      <Modal
        size="sm"
        title={title}
        confirmText="Save & Continue"
        cancelText="Cancel"
        handleConfirm={handleSave}
        handleCancel={handleCancel}
        confirmDisabled={!username.trim() || !token.trim()}
        dataTestId="git-credentials-modal"
      >
        <div className="git-credentials-modal-body">
          <p className="git-credentials-modal-message">{message}</p>
          <div className="git-credentials-modal-field">
            <label htmlFor="git-username">Username or email</label>
            <input
              id="git-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. your-github-username"
              autoFocus
            />
          </div>
          <div className="git-credentials-modal-field">
            <label htmlFor="git-token">Personal access token / password</label>
            <input
              id="git-token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="e.g. ghp_xxxxxxxxxxxx"
            />
          </div>
          <p className="git-credentials-modal-hint">
            Credentials are stored per workspace in app memory and are only used for HTTPS remotes.
          </p>
        </div>
      </Modal>
    </StyledWrapper>
  );
};

export default GitCredentialsModal;
