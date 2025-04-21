import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

const __dirname = path.resolve();

function createWindow() {
  const win = new BrowserWindow({
    width: 600,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'electron/dist/preload.js'),
      contextIsolation: true,
    },
  });
  win.webContents.openDevTools();
  win.loadURL('http://localhost:5173');
}

app.whenReady().then(() => {
  createWindow();

  // Handler für Autosave-Pfad
  ipcMain.handle('app:getAutosavePath', () => {
    const dir = path.join(app.getPath('userData'), 'ToDo-Tool');
    fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, 'autosave.json');
  });
});

ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openFile'] });
  return result.filePaths[0];
});

ipcMain.handle('fs:write', async (_, filepath: string, content: string) => {
  try { fs.writeFileSync(filepath, content); return true; }
  catch { return false; }
});

ipcMain.handle('fs:read', async (_, filepath: string) => {
  try { return fs.readFileSync(filepath, 'utf-8'); }
  catch { return null; }
});

ipcMain.handle('git:getLog', async () => {
  return new Promise<string>((resolve) => {
    exec('git log --pretty=format:"%h - %s (%ci)" --abbrev-commit', (err, stdout) => {
      resolve(err ? "⚠️ Git-Log nicht verfügbar: Projekt ist kein Git-Repo." : stdout);
    });
  });
});

export {};