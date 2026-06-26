import React, { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { isElectron } from 'utils/common/platform';

const useAutoUpdater = () => {
  const downloadToastRef = useRef(null);

  useEffect(() => {
    if (!isElectron()) {
      return () => {};
    }

    const { ipcRenderer } = window;

    const handleUpdateAvailable = (info) => {
      const version = info?.version || 'new version';
      toast.custom(
        (t) => (
          <div className="flex items-center gap-3 px-4 py-3 bg-white rounded shadow-lg border border-gray-200">
            <span>⬆️</span>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Update tersedia</div>
              <div className="text-sm text-gray-600">Versi {version} sudah rilis.</div>
            </div>
            <button
              className="px-3 py-1 text-sm text-white bg-orange-500 rounded hover:bg-orange-600"
              onClick={() => {
                toast.dismiss(t.id);
                ipcRenderer.invoke('renderer:download-update').catch((err) => {
                  toast.error(err?.message || 'Gagal download update');
                });
              }}
            >
              Download
            </button>
          </div>
        ),
        { duration: 60000 }
      );
    };

    const handleUpdateDownloaded = () => {
      if (downloadToastRef.current) {
        toast.dismiss(downloadToastRef.current);
        downloadToastRef.current = null;
      }

      toast.custom(
        (t) => (
          <div className="flex items-center gap-3 px-4 py-3 bg-white rounded shadow-lg border border-gray-200">
            <span>🚀</span>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Siap install</div>
              <div className="text-sm text-gray-600">Update sudah di-download. Restart untuk install.</div>
            </div>
            <button
              className="px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700"
              onClick={() => {
                toast.dismiss(t.id);
                ipcRenderer.invoke('renderer:install-update');
              }}
            >
              Restart
            </button>
          </div>
        ),
        { duration: Infinity }
      );
    };

    const handleDownloadProgress = (progress) => {
      const percent = progress?.percent ? Math.round(progress.percent) : 0;
      if (!downloadToastRef.current) {
        downloadToastRef.current = toast.loading(`Download update ${percent}%`);
      } else {
        toast.loading(`Download update ${percent}%`, { id: downloadToastRef.current });
      }
    };

    const handleUpdateError = (message) => {
      if (downloadToastRef.current) {
        toast.dismiss(downloadToastRef.current);
        downloadToastRef.current = null;
      }
      toast.error(`Update error: ${message}`, { duration: 5000 });
    };

    const unsubscribeAvailable = ipcRenderer.on('main:update-available', handleUpdateAvailable);
    const unsubscribeDownloaded = ipcRenderer.on('main:update-downloaded', handleUpdateDownloaded);
    const unsubscribeProgress = ipcRenderer.on('main:update-download-progress', handleDownloadProgress);
    const unsubscribeError = ipcRenderer.on('main:update-error', handleUpdateError);

    // Cek update saat app mulai, tapi jangan ganggu kalau gagal.
    ipcRenderer.invoke('renderer:check-for-updates').catch((err) => {
      if (window.__IS_DEV__) {
        console.log('[auto-updater] check skipped:', err?.message);
      }
    });

    return () => {
      unsubscribeAvailable();
      unsubscribeDownloaded();
      unsubscribeProgress();
      unsubscribeError();
    };
  }, []);
};

export default useAutoUpdater;
