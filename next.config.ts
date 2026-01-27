import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
    /* ppr: true,
    clientSegmentCache: true */
  }
};

export default nextConfig;
