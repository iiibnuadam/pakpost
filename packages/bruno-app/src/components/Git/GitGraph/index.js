import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IconLoader2, IconGitCommit, IconGitMerge, IconGitBranch } from '@tabler/icons';
import { fetchGitGraph, fetchCommitFiles, fetchCommitFileDiff } from 'providers/ReduxStore/slices/git';
import GitDiffViewer from '../GitDiffViewer';
import StyledWrapper from './StyledWrapper';

const COL_WIDTH = 120;
const ROW_HEIGHT = 56;
const NODE_RADIUS = 7;

const GitGraph = ({ gitTarget, initialHash, onInitialHashUsed }) => {
  const dispatch = useDispatch();
  const scrollRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [selectedHash, setSelectedHash] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const gitState = useSelector((state) => state.git.collectionGit[gitTarget.uid]) || {};
  const { graph, loading, error, commitFiles, commitFileDiffs } = gitState;

  // Measure scroll container so the SVG can fill the full available width
  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    dispatch(fetchGitGraph(gitTarget));
  }, [gitTarget.uid, gitTarget.pathname]);

  // Select a commit when navigated from the History tab
  useEffect(() => {
    if (!initialHash) return;

    setSelectedHash(initialHash);
    if (!commitFiles?.[initialHash]) {
      dispatch(fetchCommitFiles(gitTarget, initialHash));
    }
    onInitialHashUsed?.();
  }, [initialHash, gitTarget, dispatch, commitFiles, onInitialHashUsed]);

  const handleSelectCommit = (commit) => {
    setSelectedHash(commit.hash);
    setSelectedFile(null);
    if (!commitFiles?.[commit.hash]) {
      dispatch(fetchCommitFiles(gitTarget, commit.hash));
    }
  };

  const handleSelectFile = (file) => {
    setSelectedFile(file.path);
    if (!commitFileDiffs?.[`${selectedHash}:${file.path}`]) {
      dispatch(fetchCommitFileDiff(gitTarget, selectedHash, file.path));
    }
  };

  const layout = useMemo(() => {
    if (!graph?.commits?.length) return { nodes: [], links: [] };

    const mainNodes = graph.commits.map((commit, index) => ({
      ...commit,
      id: commit.hash,
      x: COL_WIDTH,
      y: index * ROW_HEIGHT + ROW_HEIGHT / 2,
      column: 0,
      index
    }));

    const mainByHash = new Map(mainNodes.map((n) => [n.hash, n]));
    const nodes = [...mainNodes];
    const links = [];

    // Main line parent links
    for (let i = 1; i < mainNodes.length; i++) {
      links.push({
        id: `main-${mainNodes[i].hash}-${mainNodes[i - 1].hash}`,
        from: mainNodes[i],
        to: mainNodes[i - 1],
        type: 'main'
      });
    }

    // Branches
    (graph.branches || []).forEach((branch, branchIndex) => {
      const mergeNode = mainByHash.get(branch.mergeCommitHash);
      if (!mergeNode || !branch.commits?.length) return;

      const branchNodes = branch.commits.map((commit, index) => ({
        ...commit,
        id: commit.hash,
        x: COL_WIDTH * (2 + (branchIndex % 2)),
        y: mergeNode.y + ROW_HEIGHT / 2 + (index + 1) * ROW_HEIGHT,
        column: 1 + (branchIndex % 2),
        index,
        isBranch: true,
        branchIndex
      }));

      nodes.push(...branchNodes);

      // Link merge commit to first branch commit
      links.push({
        id: `merge-out-${mergeNode.hash}-${branchNodes[0].hash}`,
        from: mergeNode,
        to: branchNodes[0],
        type: 'branch-start'
      });

      // Link branch commits vertically
      for (let i = 1; i < branchNodes.length; i++) {
        links.push({
          id: `branch-${branchNodes[i].hash}-${branchNodes[i - 1].hash}`,
          from: branchNodes[i],
          to: branchNodes[i - 1],
          type: 'branch'
        });
      }

      // Link last branch commit back to merge parent (main line)
      const lastBranchNode = branchNodes[branchNodes.length - 1];
      const mergeParent = mainByHash.get(mergeNode.parents?.[1]);
      if (mergeParent) {
        links.push({
          id: `branch-end-${lastBranchNode.hash}-${mergeParent.hash}`,
          from: lastBranchNode,
          to: mergeParent,
          type: 'branch-end'
        });
      }
    });

    return { nodes, links };
  }, [graph]);

  const svgWidth = useMemo(() => {
    const maxColumn = layout.nodes.reduce((max, node) => Math.max(max, node.column || 0), 0);
    const colBasedWidth = COL_WIDTH * (maxColumn + 2);
    return Math.max(containerWidth, colBasedWidth);
  }, [layout, containerWidth]);

  const svgHeight = useMemo(() => {
    if (!layout.nodes.length) return 0;
    const maxY = Math.max(...layout.nodes.map((n) => n.y));
    return maxY + ROW_HEIGHT;
  }, [layout]);

  const selectedCommit = useMemo(() => {
    return layout.nodes.find((n) => n.hash === selectedHash);
  }, [selectedHash, layout]);

  const renderGraph = () => {
    if (loading) {
      return (
        <div className="git-graph-loading">
          <IconLoader2 className="animate-spin" size={18} strokeWidth={1.5} />
          Loading graph...
        </div>
      );
    }

    if (error) {
      return <div className="git-graph-error">{error}</div>;
    }

    if (!graph?.commits?.length) {
      return <div className="git-graph-empty">No commits to display</div>;
    }

    return (
      <div className="git-graph-scroll" ref={scrollRef}>
        <svg width={svgWidth} height={svgHeight} className="git-graph-svg">
          {layout.links.map((link) => (
            <path
              key={link.id}
              d={`M ${link.from.x} ${link.from.y} C ${link.from.x} ${link.to.y}, ${link.to.x} ${link.from.y}, ${link.to.x} ${link.to.y}`}
              className={`git-graph-link ${link.type}`}
              fill="none"
            />
          ))}
          {layout.nodes.map((node) => (
            <g
              key={node.id}
              className={`git-graph-node ${selectedHash === node.hash ? 'selected' : ''} ${node.isMerge ? 'merge' : ''} ${node.isBranch ? 'branch' : ''}`}
              onClick={() => handleSelectCommit(node)}
              transform={`translate(${node.x}, ${node.y})`}
            >
              <circle r={NODE_RADIUS} className="git-graph-node-circle" />
              <foreignObject x={14} y={-10} width={svgWidth - node.x - 20} height={40}>
                <div className="git-graph-node-label">
                  <div className="git-graph-node-message" title={node.message}>
                    {node.message}
                  </div>
                  <div className="git-graph-node-meta">
                    {node.hash.slice(0, 7)} · {node.author_name}
                  </div>
                </div>
              </foreignObject>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  const renderDetail = () => {
    if (!selectedCommit) {
      return <div className="git-graph-detail-empty">Select a commit to view details</div>;
    }

    const files = commitFiles?.[selectedCommit.hash] || [];

    return (
      <div className="git-graph-detail">
        <div className="git-graph-detail-header">
          {selectedCommit.isMerge ? (
            <IconGitMerge size={18} strokeWidth={1.5} className="git-graph-detail-icon" />
          ) : selectedCommit.isBranch ? (
            <IconGitBranch size={18} strokeWidth={1.5} className="git-graph-detail-icon" />
          ) : (
            <IconGitCommit size={18} strokeWidth={1.5} className="git-graph-detail-icon" />
          )}
          <div className="git-graph-detail-title">
            <div className="git-graph-detail-hash">{selectedCommit.hash.slice(0, 7)}</div>
            <div className="git-graph-detail-message" title={selectedCommit.message}>
              {selectedCommit.message}
            </div>
          </div>
        </div>
        <div className="git-graph-detail-meta">
          <span>{selectedCommit.author_name}</span>
          <span>{new Date(selectedCommit.date).toLocaleString()}</span>
        </div>
        <div className="git-graph-detail-files">
          <div className="git-graph-detail-files-title">Changed files ({files.length})</div>
          {files.length === 0 ? (
            <div className="git-graph-detail-files-empty">No file data</div>
          ) : (
            files.map((file) => (
              <div
                key={file.path}
                className={`git-graph-detail-file status-${file.status} ${selectedFile === file.path ? 'selected' : ''}`}
                onClick={() => handleSelectFile(file)}
                title="Click to view diff"
              >
                <span className="git-graph-detail-file-status">{file.status?.[0]?.toUpperCase() || '?'}</span>
                <span className="git-graph-detail-file-path" title={file.path}>
                  {file.path}
                </span>
              </div>
            ))
          )}
        </div>
        {selectedFile && (
          <div className="git-graph-detail-diff">
            <div className="git-graph-detail-diff-header">
              <span className="git-graph-detail-diff-title" title={selectedFile}>
                {selectedFile}
              </span>
              <button className="git-graph-detail-diff-close" onClick={() => setSelectedFile(null)}>
                Close
              </button>
            </div>
            <div className="git-graph-detail-diff-body">
              <GitDiffViewer
                diff={commitFileDiffs?.[`${selectedHash}:${selectedFile}`]}
                emptyMessage="Loading diff..."
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <StyledWrapper>
      <div className="git-graph-toolbar">
        <div className="git-graph-title">
          <IconGitBranch size={18} strokeWidth={1.5} className="inline mr-2" />
          Commit Graph
        </div>
        <button className="git-graph-refresh" onClick={() => dispatch(fetchGitGraph(gitTarget))}>
          Refresh
        </button>
      </div>
      <div className="git-graph-body">
        {renderGraph()}
        {selectedCommit && renderDetail()}
      </div>
    </StyledWrapper>
  );
};

export default GitGraph;
