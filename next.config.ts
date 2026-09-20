import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  // Allow large file uploads (2GB)
  experimental: {
    cpus: 1,
    memoryBasedWorkersCount: true,
    proxyClientMaxBodySize: '2000mb',
    serverActions: {
      bodySizeLimit: '2000mb',
    },
    optimizePackageImports: ['lucide-react', 'date-fns', 'framer-motion'],
  },
  // External packages that shouldn't be bundled
  serverExternalPackages: ['bullmq', 'ioredis', '@ffmpeg-installer/ffmpeg', 'fluent-ffmpeg', 'playwright-extra', 'puppeteer-extra-plugin-stealth'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
