import type { NextConfig } from 'next';

const config: NextConfig = {
  // le code partagé est en TypeScript brut : Next le compile avec le site
  transpilePackages: ['@virage/shared'],
};

export default config;
