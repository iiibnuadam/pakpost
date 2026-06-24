import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IconGitCommit, IconX } from '@tabler/icons';
import { fetchCommitFiles, fetchCommitFileDiff } from 'providers/ReduxStore/slices/git';
import GitDiffViewer from '../GitDiffViewer';
import StyledWrapper from './StyledWrapper';

const MIN_FILES_RATIO = 0.2;
const MAX_FILES_RATIO = 0.8;

const GitCommitDetail = ({ gitTarget, commit, onClose }) => {
  const dispatch = useDispatch();
  const detailRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filesRatio, setFilesRatio] = useState(0.5);
  const [isDraggingDetail, setIsDraggingDetail] = useState(false);
  const dragStartRef = useRef({ startY: 0, startRatio: 0.5, containerHeight: 0 });
  const gitState = useSelector((state) => state.git.collectionGit[gitTarget.uid]) || {};
  const { commitFiles, commitFileDiffs } = gitState;

  useEffect(() => {
    setSelectedFile(null);
    if (!commit?.hash) return;
    if (!commitFiles?.[commit.hash]) {
      dispatch(fetchCommitFiles(gitTarget, commit.hash));
    }
  }, [commit?.hash, gitTarget, dispatch, commitFiles]);

  const handleDetailResizeMove = useCallback((e) => {
    const { startY, startRatio, containerHeight } = dragStartRef.current;
    if (!containerHeight) return;
    const deltaY = e.clientY - startY;
    const newRatio = Math.max(MIN_FILES_RATIO, Math.min(MAX_FILES_RATIO, startRatio + deltaY / containerHeight));
    setFilesRatio(newRatio);
  }, []);

  const stopDetailResize = useCallback(() => {
    setIsDraggingDetail(false);
  }, []);

  useEffect(() => {
    if (!isDraggingDetail) return;
    window.addEventListener('mousemove', handleDetailResizeMove);
    window.addEventListener('mouseup', stopDetailResize);
    return () => {
      window.removeEventListener('mousemove', handleDetailResizeMove);
      window.removeEventListener('mouseup', stopDetailResize);
    };
  }, [isDraggingDetail, handleDetailResizeMove, stopDetailResize]);

  const startDetailResize = (e) => {
    e.preventDefault();
    if (!detailRef.current) return;
    const rect = detailRef.current.getBoundingClientRect();
    const header = detailRef.current.querySelector('.git-commit-detail-header');
    const meta = detailRef.current.querySelector('.git-commit-detail-meta');
    const filesTitle = detailRef.current.querySelector('.git-commit-detail-files-title');
    const headerHeight = header?.offsetHeight || 0;
    const metaHeight = meta?.offsetHeight || 0;
    const titleHeight = filesTitle?.offsetHeight || 0;
    const gap = 12; // 0.75rem approx
    const containerHeight = rect.height - headerHeight - metaHeight - titleHeight - gap;
    dragStartRef.current = {
      startY: e.clientY,
      startRatio: filesRatio,
      containerHeight: Math.max(1, containerHeight)
    };
    setIsDraggingDetail(true);
  };

  if (!commit) {
    return (
      <StyledWrapper>
        <div className="git-commit-detail-empty">Select a commit to view details</div>
      </StyledWrapper>
    );
  }

  const files = commitFiles?.[commit.hash] || [];

  const handleSelectFile = (file) => {
    setSelectedFile(file.path);
    if (!commitFileDiffs?.[`${commit.hash}:${file.path}`]) {
      dispatch(fetchCommitFileDiff(gitTarget, commit.hash, file.path));
    }
  };

  return (
    <StyledWrapper ref={detailRef}>
      <div className="git-commit-detail-header">
        <IconGitCommit size={18} strokeWidth={1.5} className="git-commit-detail-icon" />
        <div className="git-commit-detail-title">
          <div className="git-commit-detail-hash">{commit.hash.slice(0, 7)}</div>
          <div className="git-commit-detail-message" title={commit.message}>
            {commit.message}
          </div>
        </div>
        {onClose && (
          <button className="git-commit-detail-close" onClick={onClose} title="Close detail">
            <IconX size={16} strokeWidth={1.5} />
          </button>
        )}
      </div>
      <div className="git-commit-detail-meta">
        <span>{commit.author_name}</span>
        <span>{new Date(commit.date).toLocaleString()}</span>
      </div>
      <div className="git-commit-detail-files" style={{ flex: filesRatio }}>
        <div className="git-commit-detail-files-title">Changed files ({files.length})</div>
        {files.length === 0 ? (
          <div className="git-empty-state">No file data</div>
        ) : (
          files.map((file) => (
            <div
              key={file.path}
              className={`git-commit-detail-file status-${file.status} ${selectedFile === file.path ? 'selected' : ''}`}
              onClick={() => handleSelectFile(file)}
              title="Click to view diff"
            >
              <span className="git-commit-detail-file-status">
                {file.status?.[0]?.toUpperCase() || '?'}
              </span>
              <span className="git-commit-detail-file-path" title={file.path}>
                {file.path}
              </span>
            </div>
          ))
        )}
      </div>
      {selectedFile && (
        <>
          <div className="git-resize-handle-horizontal" onMouseDown={startDetailResize} />
          <div className="git-commit-detail-diff" style={{ flex: 1 - filesRatio }}>
            <div className="git-commit-detail-diff-header">
              <span className="git-commit-detail-diff-title" title={selectedFile}>
                {selectedFile}
              </span>
              <button className="git-commit-detail-diff-close" onClick={() => setSelectedFile(null)}>
                Close
              </button>
            </div>
            <div className="git-commit-detail-diff-body">
              <GitDiffViewer
                diff={commitFileDiffs?.[`${commit.hash}:${selectedFile}`]}
                emptyMessage="Loading diff..."
              />
            </div>
          </div>
        </>
      )}
    </StyledWrapper>
  );
};

export default GitCommitDetail;
