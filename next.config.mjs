/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow large file uploads (2GB)
  experimental: {
    proxyClientMaxBodySize: '2000mb',
    serverActions: {
      bodySizeLimit: '2000mb',
    },
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
  serverExternalPackages: [
    'bullmq',
    'ioredis',
    '@ffmpeg-installer/ffmpeg',
    'fluent-ffmpeg',
    'playwright-extra',
    'puppeteer-extra-plugin-stealth',
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With' },
        ],
      },
    ];
  },
};

export default nextConfig;
