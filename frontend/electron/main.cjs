const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const http = require('http');

let mainWindow;
let serverProcess = null;

function killPort8000() {
  try {
    if (process.platform === 'win32') {
      execSync('for /f "tokens=5" %a in (\'netstat -aon ^| findstr :8000 ^| findstr LISTENING\') do taskkill /f /pid %a /t 2>nul', { shell: 'cmd.exe', stdio: 'ignore' });
    } else {
      execSync('lsof -t -i:8000 | xargs kill -9 2>/dev/null', { stdio: 'ignore' });
    }
  } catch (e) {
    // Port 8000 clean
  }
}

function waitForServer(url, maxWaitMs = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const req = http.get(url, (res) => {
        resolve(true);
      });
      req.on('error', (err) => {
        if (Date.now() - start > maxWaitMs) {
          reject(new Error('El servidor backend de Python no respondió a tiempo.'));
        } else {
          setTimeout(check, 250);
        }
      });
      req.end();
    };
    check();
  });
}

function startPythonBackend() {
  killPort8000(); // Guarantee zero stale python servers on port 8000 before startup
  const rootDir = path.join(__dirname, '..', '..');
  console.log('Starting Python backend process from:', rootDir);
  
  // Run uvicorn via python -m to bypass uv script trampoline canonicalization issues on Windows
  serverProcess = spawn('uv', ['run', 'python', '-m', 'uvicorn', 'icanscan.main:app', '--host', '127.0.0.1', '--port', '8000'], {
    cwd: rootDir,
    shell: true,
    stdio: 'inherit'
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
    icon: path.join(__dirname, process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
    backgroundColor: '#0b0d11',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
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

app.whenReady().then(async () => {
  startPythonBackend();

  try {
    console.log('Esperando a que el servidor de Python inicie en el puerto 8000...');
    await waitForServer('http://127.0.0.1:8000');
    console.log('¡Servidor Python listo! Abriendo ventana de la aplicación...');
    createWindow();
  } catch (err) {
    console.error('Error al conectar con el backend:', err);
    dialog.showErrorBox(
      'Error de Inicio - Doc Scan PDF Scanner',
      'No se pudo conectar con el servidor backend de Python.\nPor favor verifica la consola (terminal) para ver el error de inicio de uvicorn/python.'
    );
    app.quit();
  }

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

  ipcMain.handle('dialog:openFile', async (event, options = {}) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: options.title || 'Seleccionar Documentos PDF para Reducir',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Documentos PDF (*.pdf)', extensions: ['pdf'] },
        { name: 'Todos los archivos', extensions: ['*'] }
      ]
    });
    if (result.canceled) {
      return [];
    }
    return result.filePaths;
  });

  ipcMain.handle('dialog:openImage', async (event, options = {}) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: options.title || 'Seleccionar Imágenes (PNG/JPG)',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Imágenes (*.png, *.jpg, *.jpeg)', extensions: ['png', 'jpg', 'jpeg'] },
        { name: 'Todos los archivos', extensions: ['*'] }
      ]
    });
    if (result.canceled) {
      return [];
    }
    return result.filePaths;
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /f /t /pid ${serverProcess.pid} 2>nul`, { shell: 'cmd.exe', stdio: 'ignore' });
      } else {
        serverProcess.kill('SIGTERM');
      }
    } catch (e) {}
  }
  killPort8000();
  if (process.platform !== 'darwin') app.quit();
});
