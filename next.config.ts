import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  /* experimental: {
    ppr: true,
    clientSegmentCache: true
  } */
};

export default nextConfig;
