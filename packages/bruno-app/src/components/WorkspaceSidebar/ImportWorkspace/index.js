import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import get from 'lodash/get';
import { IconFileZip, IconBrandGit, IconX, IconLoader2, IconAlertCircle, IconRefresh, IconCircleCheck } from '@tabler/icons';
import classnames from 'classnames';
import Modal from 'components/Modal';
import { browseDirectory } from 'providers/ReduxStore/slices/collections/actions';
import { importWorkspaceAction, importWorkspaceFromGitAction } from 'providers/ReduxStore/slices/workspaces/actions';
import { removeGitOperationProgress } from 'providers/ReduxStore/slices/app';
import { formatIpcError } from 'utils/common/error';
import { multiLineMsg, uuid } from 'utils/common/index';
import Help from 'components/Help';
import { isGitRepositoryUrl } from 'utils/git';
import StyledWrapper from './StyledWrapper';

const IMPORT_TABS = {
  ZIP: 'zip',
  GIT: 'git'
};

const ImportWorkspace = ({ onClose }) => {
  const dispatch = useDispatch();
  const preferences = useSelector((state) => state.app.preferences);
  const gitVersion = useSelector((state) => state.app.gitVersion);
  const [activeTab, setActiveTab] = useState(IMPORT_TABS.ZIP);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gitUrl, setGitUrl] = useState('');
  const [processUid, setProcessUid] = useState(uuid());
  const [gitSteps, setGitSteps] = useState([]);
  const fileInputRef = useRef(null);
  const locationInputRef = useRef(null);
  const gitUrlInputRef = useRef(null);

  const defaultLocation = get(preferences, 'general.defaultLocation', '');

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      workspaceLocation: defaultLocation
    },
    validationSchema: Yup.object({
      workspaceLocation: Yup.string().min(1, 'location is required').required('location is required')
    }),
    onSubmit: async (values) => {
      if (isSubmitting) return;

      if (activeTab === IMPORT_TABS.ZIP) {
        if (!selectedFile) return;
        try {
          setIsSubmitting(true);
          await dispatch(importWorkspaceAction(selectedFile.path, values.workspaceLocation));
          toast.success('Workspace imported successfully!');
          onClose();
        } catch (error) {
          toast.error(multiLineMsg('Failed to import workspace', formatIpcError(error)));
        } finally {
          setIsSubmitting(false);
        }
      } else {
        if (!gitUrl.trim()) {
          toast.error('Please enter a Git repository URL');
          return;
        }
        if (!isGitRepositoryUrl(gitUrl.trim())) {
          toast.error('Please enter a valid Git repository URL');
          return;
        }
        try {
          setIsSubmitting(true);
          setGitSteps([{ step: 'clone', title: 'Cloning repository', completed: false }]);
          const result = await dispatch(importWorkspaceFromGitAction(gitUrl.trim(), values.workspaceLocation, processUid));
          if (result.success) {
            toast.success('Workspace cloned and imported successfully!');
            onClose();
          }
        } catch (error) {
          toast.error(multiLineMsg('Failed to clone workspace', formatIpcError(error)));
          setGitSteps((prev) =>
            prev.map((step) =>
              step.step === 'clone' ? { ...step, title: 'Cloning failed', completed: true, error: true } : step
            )
          );
        } finally {
          setIsSubmitting(false);
          dispatch(removeGitOperationProgress(processUid));
        }
      }
    }
  });

  const progressData = useSelector((state) => state.app.gitOperationProgress[processUid]);

  useEffect(() => {
    if (progressData) {
      setGitSteps((prev) =>
        prev.map((step) =>
          step.step === 'clone' && !step.completed
            ? { ...step, title: 'Cloning repository', completed: false, info: progressData.progressData }
            : step
        )
      );
    }
  }, [progressData]);

  useEffect(() => {
    if (gitUrlInputRef.current) {
      gitUrlInputRef.current.focus();
    }
  }, [activeTab]);

  const handleTabSelect = (tab) => () => {
    setActiveTab(tab);
    setGitSteps([]);
  };

  const getTabClassname = (tabName) => {
    return classnames('flex tab items-center py-2 px-4', {
      active: tabName === activeTab
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const fileInfo = validateAndGetFilePath(e.dataTransfer.files[0]);
      if (fileInfo) {
        setSelectedFile(fileInfo);
      }
    }
  };

  const validateAndGetFilePath = (file) => {
    if (!file) return null;

    const isZip = file.name.endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed';
    if (!isZip) {
      toast.error('Please select a valid zip file');
      return null;
    }

    const filePath = window?.ipcRenderer?.getFilePath(file);
    if (!filePath) {
      toast.error('Could not get file path');
      return null;
    }

    return { name: file.name, path: filePath };
  };

  const handleBrowseFiles = () => {
    fileInputRef.current.click();
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const fileInfo = validateAndGetFilePath(e.target.files[0]);
      if (fileInfo) {
        setSelectedFile(fileInfo);
      }
    }
  };

  const browse = () => {
    dispatch(browseDirectory())
      .then((dirPath) => {
        if (typeof dirPath === 'string' && dirPath.length > 0) {
          formik.setFieldValue('workspaceLocation', dirPath);
        }
      })
      .catch((error) => {
        formik.setFieldValue('workspaceLocation', '');
        console.error(error);
      });
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (locationInputRef && locationInputRef.current) {
      locationInputRef.current.focus();
    }
  }, [locationInputRef]);

  const canSubmitZip = activeTab === IMPORT_TABS.ZIP && selectedFile && formik.values.workspaceLocation && !isSubmitting;
  const canSubmitGit = activeTab === IMPORT_TABS.GIT && gitUrl.trim() && formik.values.workspaceLocation && !isSubmitting && gitVersion;
  const canSubmit = canSubmitZip || canSubmitGit;

  const renderZipTab = () => (
    <>
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Workspace File</h3>
        {selectedFile ? (
          <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <IconFileZip size={20} className="text-gray-500" />
              <span className="text-gray-700 dark:text-gray-300">{selectedFile.name}</span>
            </div>
            <button
              type="button"
              className="text-gray-500 hover:text-red-500 text-sm"
              onClick={handleClearFile}
            >
              Remove
            </button>
          </div>
        ) : (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-lg p-6 transition-colors duration-200
              ${dragActive ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}
            `}
          >
            <div className="flex flex-col items-center justify-center">
              <IconFileZip
                size={28}
                className="text-gray-400 dark:text-gray-500 mb-3"
              />
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileInputChange}
                accept=".zip,application/zip,application/x-zip-compressed"
              />
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Drop workspace zip file here or{' '}
                <button
                  type="button"
                  className="text-blue-500 underline cursor-pointer"
                  onClick={handleBrowseFiles}
                >
                  choose a file
                </button>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Supports exported Bruno workspace zip files
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );

  const renderGitTab = () => (
    <>
      {!gitVersion && (
        <div className="mb-4 p-3 border rounded-md bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex gap-2">
            <IconAlertCircle className="text-red-500 flex-shrink-0" size={18} />
            <span className="text-sm text-red-700 dark:text-red-300">
              Git is not installed or not found in PATH. Please install Git to use this feature.
            </span>
          </div>
        </div>
      )}
      <div className="mb-4">
        <label htmlFor="git-repository-url" className="font-semibold mb-2 flex items-center">
          Git Repository URL
        </label>
        <input
          id="git-repository-url"
          ref={gitUrlInputRef}
          type="text"
          className="block textbox mt-2 w-full"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          placeholder="https://github.com/user/workspace-repo.git"
          value={gitUrl}
          onChange={(e) => setGitUrl(e.target.value)}
          disabled={isSubmitting}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Repository must contain a workspace.yml file at the root.
        </p>
      </div>
      {gitSteps.length > 0 && (
        <div className="mb-4">
          <ul>
            {gitSteps.map((step, index) => (
              <li key={index} className="flex-col items-center space-x-2 mt-1">
                <div className="flex text-sm">
                  {step.error ? (
                    <IconAlertCircle className="text-red-500" size={18} strokeWidth={1.5} />
                  ) : !step.completed ? (
                    <IconRefresh className="animate-spin" size={18} strokeWidth={1.5} />
                  ) : (
                    <IconCircleCheck size={18} strokeWidth={1.5} className="text-green-500" />
                  )}
                  <span className="ml-2">{step.title}</span>
                </div>
                {step.info && (
                  <div className="w-full mt-2">
                    <pre className="info-box ml-4 text-xs">{step.info}</pre>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );

  return (
    <Modal
      size="md"
      title="Import Workspace"
      confirmText={isSubmitting ? 'Importing...' : 'Import'}
      handleConfirm={formik.handleSubmit}
      handleCancel={onClose}
      confirmDisabled={!canSubmit}
    >
      <StyledWrapper className="flex flex-col h-full">
        <div className="flex w-full mb-6">
          <div className="flex justify-start w-full tabs">
            <div
              className={getTabClassname(IMPORT_TABS.ZIP)}
              onClick={handleTabSelect(IMPORT_TABS.ZIP)}
              data-testid="zip-tab"
            >
              <IconFileZip size={18} strokeWidth={1.5} className="mr-2" />
              Zip File
            </div>
            <div
              className={getTabClassname(IMPORT_TABS.GIT)}
              onClick={handleTabSelect(IMPORT_TABS.GIT)}
              data-testid="git-tab"
            >
              <IconBrandGit size={18} strokeWidth={1.5} className="mr-2" />
              Git Repository
            </div>
          </div>
        </div>

        {activeTab === IMPORT_TABS.ZIP ? renderZipTab() : renderGitTab()}

        <div className="mb-4">
          <label htmlFor="workspace-location" className="font-semibold mb-2 flex items-center">
            Extract Location
            <Help>
              <p>
                Choose the location where you want to extract this workspace.
              </p>
              <p className="mt-2">
                The workspace folder will be created at this location.
              </p>
            </Help>
          </label>
          <input
            id="workspace-location"
            type="text"
            name="workspaceLocation"
            ref={locationInputRef}
            readOnly={true}
            className="block textbox mt-2 w-full cursor-pointer"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            value={formik.values.workspaceLocation || ''}
            onClick={browse}
          />
          {formik.touched.workspaceLocation && formik.errors.workspaceLocation ? (
            <div className="text-red-500 text-sm mt-1">{formik.errors.workspaceLocation}</div>
          ) : null}
          <div className="mt-1">
            <span
              className="text-link cursor-pointer hover:underline"
              onClick={browse}
            >
              Browse
            </span>
          </div>
        </div>
      </StyledWrapper>
    </Modal>
  );
};

export default ImportWorkspace;
