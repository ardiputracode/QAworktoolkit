const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('qaToolkit', {
  appName: 'QA Toolkit'
});