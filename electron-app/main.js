const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
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
  const isDev = process.argv.includes('--dev');
  
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

  // Giám sát các lượt tải xuống từ trình duyệt Chromium
  mainWindow.webContents.session.on('will-download', (event, item) => {
    console.log('[Electron will-download] Bắt đầu tải:', item.getURL(), 'File:', item.getFilename());
    item.on('updated', (event, state) => {
      if (state === 'interrupted') {
        console.warn('[Electron will-download] Quá trình tải bị gián đoạn:', item.getFilename());
      } else if (state === 'progressing') {
        if (!item.isPaused()) {
          console.log(`[Electron will-download] ${item.getFilename()}: ${item.getReceivedBytes()}/${item.getTotalBytes()} bytes`);
        }
      }
    });
    item.once('done', (event, state) => {
      if (state === 'completed') {
        console.log('[Electron will-download] Đã tải xong:', item.getSavePath());
      } else {
        console.error(`[Electron will-download] Tải thất bại (${state}):`, item.getFilename());
      }
    });
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

// Xử lý tải video/file an toàn trực tiếp về máy người dùng
ipcMain.handle('download-file', async (event, { url, filename, title }) => {
  try {
    if (!url) {
      return { success: false, error: 'Thiếu đường dẫn tải video (URL)' };
    }

    const cleanFilename = (filename || `video-${Date.now()}.mp4`).replace(/[/\\?%*:|"<>]/g, '-');
    const ext = path.extname(cleanFilename).replace('.', '') || 'mp4';

    // Mở hộp thoại chọn nơi lưu file của hệ điều hành
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: title || 'Chọn vị trí lưu video tải về',
      defaultPath: cleanFilename,
      filters: [
        { name: 'Video', extensions: [ext, 'mp4', 'mkv', 'webm', 'mov'] },
        { name: 'Âm thanh', extensions: ['mp3', 'm4a', 'wav'] },
        { name: 'Tất cả tệp', extensions: ['*'] }
      ]
    });

    if (canceled || !filePath) {
      console.log('[Electron Download] Người dùng hủy chọn nơi lưu.');
      return { canceled: true };
    }

    console.log(`[Electron Download] Bắt đầu tải: ${cleanFilename} -> ${filePath}`);

    // Hàm tải hỗ trợ User-Agent và tự động theo redirect
    const fetchStream = async (targetUrl) => {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': '*/*'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response;
    };

    let response;
    try {
      response = await fetchStream(url);
    } catch (directErr) {
      console.warn(`[Electron Download] Tải trực tiếp thất bại (${directErr.message}), chuyển sang tải qua server proxy...`);
      const proxyUrl = `https://topify.vn/api/proxy-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(cleanFilename)}`;
      response = await fetchStream(proxyUrl);
    }

    const contentLength = response.headers.get('content-length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
    let receivedBytes = 0;

    const fileStream = fs.createWriteStream(filePath);

    // Stream trực tiếp dữ liệu vào ổ cứng để không bị tràn RAM
    for await (const chunk of response.body) {
      fileStream.write(chunk);
      receivedBytes += chunk.length;
      if (totalBytes > 0) {
        const percent = Math.min(100, Math.round((receivedBytes / totalBytes) * 100));
        mainWindow?.webContents?.send('download-progress', { url, percent, receivedBytes, totalBytes });
      }
    }

    await new Promise((resolve, reject) => {
      fileStream.end((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log(`[Electron Download] ✅ Tải thành công: ${filePath} (${receivedBytes} bytes)`);
    return {
      success: true,
      filePath,
      filename: path.basename(filePath),
      size: receivedBytes
    };
  } catch (error) {
    console.error('[Electron Download] ❌ Lỗi tải file:', error);
    return { success: false, error: error.message || 'Lỗi không xác định khi tải file' };
  }
});

// Mở thư mục chứa file vừa tải trên máy
ipcMain.handle('show-item-in-folder', async (event, filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      shell.showItemInFolder(filePath);
      return { success: true };
    }
    return { success: false, error: 'Không tìm thấy tệp tin trên máy tính' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

