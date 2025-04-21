import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  readFile: (p: string) => ipcRenderer.invoke('fs:read', p),
  writeFile: (p: string, c: string) => ipcRenderer.invoke('fs:write', p, c),
  getAutosavePath: () => ipcRenderer.invoke('app:getAutosavePath'),
  getGitLog: () => ipcRenderer.invoke('git:getLog'),
});