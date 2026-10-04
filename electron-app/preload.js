const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  runFacebookLogin: (accountData) => ipcRenderer.invoke('run-facebook-login', accountData),
  startAutomationTask: (taskData) => ipcRenderer.invoke('start-automation-task', taskData),
  stopAutomationTask: (data) => ipcRenderer.invoke('stop-automation-task', data),
  getRunningAutomationTasks: () => ipcRenderer.invoke('get-running-automation-tasks'),
  getActiveBrowsers: () => ipcRenderer.invoke('get-active-browsers'),
  closeActiveBrowser: (profileId) => ipcRenderer.invoke('close-active-browser', profileId),
  downloadFile: (data) => ipcRenderer.invoke('download-file', data),
  showItemInFolder: (filePath) => ipcRenderer.invoke('show-item-in-folder', filePath),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  onDownloadProgress: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on('download-progress', listener);
    return () => ipcRenderer.removeListener('download-progress', listener);
  },
  isDesktopApp: true
});
