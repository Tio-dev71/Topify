const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const frontendDir = path.join(__dirname, 'frontend');

console.log('🚀 [Dev Runner] Khởi động Vite Frontend...');
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: frontendDir,
  stdio: 'inherit',
  shell: true,
});

frontend.on('error', (err) => {
  console.error('❌ [Frontend Error]:', err);
});

let electronStarted = false;

function checkFrontend() {
  if (electronStarted) return;

  const req = http.get('http://localhost:5173', (res) => {
    electronStarted = true;
    console.log('✅ [Dev Runner] Frontend sẵn sàng! Khởi động Electron Desktop App...');

    const electron = spawn('npx', ['electron', '.', '--dev'], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true,
    });

    electron.on('error', (err) => {
      console.error('❌ [Electron Error]:', err);
    });

    electron.on('exit', (code) => {
      console.log(`[Dev Runner] Electron đã đóng (mã thoát: ${code}). Đang tắt frontend...`);
      frontend.kill();
      process.exit(code || 0);
    });
  });

  req.on('error', () => {
    if (!electronStarted) {
      setTimeout(checkFrontend, 350);
    }
  });
}

// Bắt đầu thăm dò frontend
checkFrontend();

// Xử lý khi người dùng nhấn Ctrl+C
process.on('SIGINT', () => {
  console.log('\n[Dev Runner] Đang dọn dẹp và dừng tiến trình...');
  frontend.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  frontend.kill();
  process.exit(0);
});
