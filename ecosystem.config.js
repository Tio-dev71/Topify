const path = require('path');
const dotenv = require('dotenv');

// Đọc file .env
const envConfig = dotenv.config({ path: path.join(__dirname, '.env') }).parsed || {};

module.exports = {
  apps: [
    {
      name: "Topify",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        ...envConfig
      }
    },
    {
      name: "Topify-Worker",
      script: "node_modules/tsx/dist/cli.mjs",
      args: "worker.ts",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        ...envConfig
      }
    }
  ]
};
