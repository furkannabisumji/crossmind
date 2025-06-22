/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export to enable proper client-side rendering
  // output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // Add React strict mode for better error detection
  reactStrictMode: true,

  // Next.js 15 optimizations
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },

  // Prevent CSS flashing during development
  compiler: {
    // Improve CSS stability
    reactRemoveProperties: process.env.NODE_ENV === "production",
  },

  // Optimization for Next.js 15 and Node.js compatibility
  webpack: (config, { isServer, dev }) => {
    // Add stability improvements for development
    if (!isServer) {
      // Ensure stable chunk IDs
      config.optimization.chunkIds = 'deterministic';
      
      // Improve module resolution stability
      config.optimization.moduleIds = 'deterministic';
      
      // Use single runtime chunk for better CSS stability
      config.optimization.runtimeChunk = 'single';

      // Polyfill or mock Node.js specific modules for browser environment
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // Mock 'fs' with an empty module
        'fs': false,
        // Mock 'worker_threads' with an empty module
        'worker_threads': false,
        // Add other Node.js modules that might be problematic
        'path': false,
        'crypto': false,
        'stream': false,
        'os': false,
        'util': require.resolve('util/'),
      };
    }
    return config;
  },
};

module.exports = nextConfig;
