import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    // AlaSQL has optional dependencies on react-native modules that
    // are not needed in a browser environment. Ignore them.
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        'react-native-fs': false,
        'react-native-fetch-blob': false,
        'react-native': false,
      };
    }
    return config;
  },
  // Turbopack resolution aliases to stub out react-native modules
  turbopack: {
    resolveAlias: {
      'react-native-fs': { browser: './lib/empty-module.ts' },
      'react-native-fetch-blob': { browser: './lib/empty-module.ts' },
      'react-native': { browser: './lib/empty-module.ts' },
    },
  },
};

export default nextConfig;
