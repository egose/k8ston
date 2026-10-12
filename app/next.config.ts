import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* standalone server for the Docker image (see /Dockerfile) */
  output: 'standalone',
  // Without this, opening dev via 127.0.0.1 serves SSR HTML but silently
  // blocks hydration (dev-only option, no production effect).
  allowedDevOrigins: ['127.0.0.1'],
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
