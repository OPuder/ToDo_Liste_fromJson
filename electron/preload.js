// electron/preload.ts
var import_electron = require("electron");
import_electron.contextBridge.exposeInMainWorld("electronAPI", {
  openFile: () => import_electron.ipcRenderer.invoke("dialog:openFile"),
  readFile: (path) => import_electron.ipcRenderer.invoke("fs:readFile", path),
  getGitLog: () => import_electron.ipcRenderer.invoke("git:getLog")
});
