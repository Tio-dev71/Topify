import http from 'http'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

function checkIsTopify(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/api/settings`, { timeout: 500 }, (res) => {
      // Topify Next.js returns 401 Unauthorized for /api/settings without token; Stayea returns 404
      resolve(res.statusCode === 401 || res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

// https://vite.dev/config/
export default defineConfig(async () => {
  let target = process.env.VITE_BACKEND_TARGET || '';
  if (!target) {
    if (await checkIsTopify(3001)) {
      target = 'http://localhost:3001';
    } else if (await checkIsTopify(3000)) {
      target = 'http://localhost:3000';
    } else {
      target = process.env.VITE_BACKEND_TARGET || 'https://topify.vn';
    }
  }

  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
        },
        '/screenshots': {
          target,
          changeOrigin: true,
        },
      },
    },
  };
})
