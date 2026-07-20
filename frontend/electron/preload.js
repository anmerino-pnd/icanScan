const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFileDialog: (suggestedName) => ipcRenderer.invoke('dialog:saveFile', suggestedName)
});
