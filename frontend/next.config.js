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

  // Simple optimization for Next.js 15
  webpack: (config, { isServer, dev }) => {
    // Add stability improvements for development
    if (!isServer) {
      // Ensure stable chunk IDs
      config.optimization.chunkIds = 'deterministic';
      
      // Improve module resolution stability
      config.optimization.moduleIds = 'deterministic';
      
      // Use single runtime chunk for better CSS stability
      config.optimization.runtimeChunk = 'single';
    }
    return config;
  },
};

module.exports = nextConfig;
