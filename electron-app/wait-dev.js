const http = require('http');

function check() {
  const req = http.get('http://localhost:5173', () => {
    process.exit(0);
  });
  req.on('error', () => {
    setTimeout(check, 300);
  });
}

check();
