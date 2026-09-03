const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('qaToolkit', {
  appName: 'QA Toolkit',
  testJiraConnection: (credentials) => ipcRenderer.invoke('test-jira-connection', credentials),
});
