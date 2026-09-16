const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { runPlaywrightLogin, activeBrowsers } = require('./playwright-runner');
const { startAutomationTask, stopTask } = require('./automation-runner');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Tải giao diện Web (Development: Vite Dev Server, Production: File Build)
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  if (isDev) {
    // Chạy Vite dev server ở port 5173
    mainWindow.loadURL('http://localhost:5173');
    // Mở dev tools nếu cần
    // mainWindow.webContents.openDevTools();
    
    // Thêm logic tự động tải lại nếu Vite server chưa sẵn sàng (giúp tránh lỗi màn hình trắng)
    mainWindow.webContents.on('did-fail-load', (e, errorCode, errorDescription, validatedURL) => {
      if (validatedURL.includes('localhost:5173')) {
        console.log('[Electron] Vite server chưa sẵn sàng, đang thử lại...');
        setTimeout(() => {
          mainWindow.loadURL('http://localhost:5173');
        }, 1000);
      }
    });
  } else {
    // Trong môi trường Production, load file index.html đã build từ thư mục frontend/dist
    mainWindow.loadFile(path.join(__dirname, 'frontend/dist/index.html'));
  }

  // Quản lý popup OAuth (như Facebook/Google login)
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'allow' };
  });

  mainWindow.webContents.on('did-create-window', (childWindow) => {
    childWindow.on('closed', () => {
      // Khi cửa sổ OAuth đóng, tải lại cửa sổ chính để cập nhật trạng thái
      mainWindow.webContents.executeJavaScript('window.location.reload()');
    });
  });

  // Bắt console.log từ browser in ra terminal
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Browser Console] ${message} (at ${sourceId}:${line})`);
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Lắng nghe sự kiện từ giao diện Web
ipcMain.handle('run-facebook-login', async (event, accountData) => {
  try {
    console.log('[Electron IPC] Nhận yêu cầu login FB cho UID:', accountData.uid);
    const result = await runPlaywrightLogin(accountData);
    return result;
  } catch (error) {
    console.error('[Electron IPC] Lỗi:', error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('start-automation-task', async (event, taskData) => {
  try {
    console.log('[Electron IPC] Bắt đầu chạy Tự động hoá cho Task:', taskData.taskId);
    const result = await startAutomationTask(taskData);
    return result;
  } catch (error) {
    console.error('[Electron IPC] Lỗi automation:', error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-automation-task', async (event, { taskId, profileIds }) => {
  try {
    console.log(`[Electron IPC] Yêu cầu dừng Tự động hoá cho Task ${taskId}, profiles:`, profileIds);
    if (taskId) {
      await stopTask(taskId);
    }
    
    return { success: true };
  } catch (error) {
    console.error('[Electron IPC] Lỗi khi dừng task:', error.message);
    return { success: false, error: error.message };
  }
});
