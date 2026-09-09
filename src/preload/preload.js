const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('qaToolkit', {
  appName: 'QA Toolkit',
  testJiraConnection: (credentials) => ipcRenderer.invoke('test-jira-connection', credentials),
  getJiraIssueCount: (payload) => ipcRenderer.invoke('get-jira-issue-count', payload),
  getProjectNames: () => ipcRenderer.invoke('get-project-names'),
  getTesters: () => ipcRenderer.invoke('get-testers'),
});
