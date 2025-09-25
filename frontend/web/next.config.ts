import type { NextConfig } from 'next';
import path from 'node:path';
import { config as dotenvConfig } from 'dotenv';

// Load root-level env files so the app uses a single .env/.env.local at repo root
dotenvConfig({ path: path.resolve(__dirname, '../../.env.local') });
dotenvConfig({ path: path.resolve(__dirname, '../../.env') });

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    externalDir: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ['@shoppr/ui'],
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
  },
};

export default nextConfig;
