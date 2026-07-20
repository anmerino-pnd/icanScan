const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess = null;

function startPythonBackend() {
  const rootDir = path.join(__dirname, '..', '..');
  console.log('Starting Python backend process from:', rootDir);
  
  // Run uvicorn in completely isolated OS subprocess to guarantee zero freezing or GIL locks
  serverProcess = spawn('uv', ['run', 'uvicorn', 'icanscan.main:app', '--host', '127.0.0.1', '--port', '8000'], {
    cwd: rootDir,
    shell: true,
    stdio: 'ignore'
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to spawn Python backend:', err);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1420,
    height: 920,
    minWidth: 1050,
    minHeight: 650,
    title: 'Doc Scan PDF Scanner - Studio',
    backgroundColor: '#0b0d11',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load the FastAPI server root which serves both the API and our built React UI
  mainWindow.loadURL('http://127.0.0.1:8000');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startPythonBackend();

  // Give backend 1.5 seconds to initialize cleanly before opening the native window
  setTimeout(() => {
    createWindow();
  }, 1500);

  // Handle native Save As dialog requests from React
  ipcMain.handle('dialog:saveFile', async (event, suggestedName = 'DocScan_Reporte.pdf') => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Guardar Documento PDF de Alta Calidad',
      defaultPath: suggestedName,
      filters: [
        { name: 'Documento PDF (*.pdf)', extensions: ['pdf'] },
        { name: 'Todos los archivos', extensions: ['*'] }
      ]
    });
    if (result.canceled) {
      return null;
    }
    return result.filePath;
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    try {
      serverProcess.kill('SIGTERM');
    } catch (e) {
      console.error('Error killing Python backend process:', e);
    }
  }
  if (process.platform !== 'darwin') app.quit();
});
