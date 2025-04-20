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

  win.loadURL('http://localhost:5173');
}

app.whenReady().then(() => {
  createWindow();
});

ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openFile'] });
  return result.filePaths[0];
});

ipcMain.handle('fs:readFile', async (_, filePath) => {
  return fs.readFileSync(filePath, 'utf-8');
});

ipcMain.handle('git:getLog', async () => {
  return new Promise((resolve) => {
    exec('git log --pretty=format:"%h - %s (%ci)" --abbrev-commit', (err, stdout) => {
      if (err) {
        resolve("⚠️ Git-Log nicht verfügbar: Projekt ist kein Git-Repo.");
      } else {
        resolve(stdout);
      }
    });
  });
});