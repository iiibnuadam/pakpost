import React, { useState, useEffect } from 'react';
import { IconLoader2 } from '@tabler/icons';
import Modal from 'components/Modal';
import CodeEditor from 'components/CodeEditor';
import { useTheme } from 'providers/Theme';
import StyledWrapper from './StyledWrapper';

const getLanguageMode = (filePath) => {
  if (!filePath) return 'text/plain';
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.json') || lower.endsWith('.bru')) return 'application/ld+json';
  if (lower.endsWith('.js') || lower.endsWith('.ts')) return 'application/javascript';
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'text/html';
  if (lower.endsWith('.xml')) return 'application/xml';
  if (lower.endsWith('.yaml') || lower.endsWith('.yml')) return 'text/x-yaml';
  if (lower.endsWith('.md')) return 'text/x-markdown';
  return 'text/plain';
};

const GitConflictEditorModal = ({ file, content, onCancel, onSave, saving }) => {
  const { displayedTheme } = useTheme();
  const [editorContent, setEditorContent] = useState(content || '');

  useEffect(() => {
    setEditorContent(content || '');
  }, [content]);

  const handleSave = () => {
    onSave(editorContent);
  };

  return (
    <Modal handleCancel={onCancel} hideFooter disableCloseOnOutsideClick>
      <StyledWrapper>
        <div className="git-conflict-editor-header">
          <div>
            <h3>Resolve conflict</h3>
            <div className="git-conflict-editor-path">{file?.path}</div>
          </div>
        </div>
        <div className="git-conflict-editor-container">
          <CodeEditor
            theme={displayedTheme}
            value={editorContent}
            mode={getLanguageMode(file?.path)}
            onEdit={(val) => setEditorContent(val)}
            onSave={handleSave}
            collection={null}
          />
        </div>
        <div className="git-conflict-editor-actions">
          <button className="git-conflict-editor-btn" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button className="git-conflict-editor-btn primary" onClick={handleSave} disabled={saving}>
            {saving ? <IconLoader2 className="animate-spin" size={14} strokeWidth={1.5} /> : null}
            Save resolution
          </button>
        </div>
      </StyledWrapper>
    </Modal>
  );
};

export default GitConflictEditorModal;
