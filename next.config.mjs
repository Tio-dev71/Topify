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
};

export default nextConfig;
