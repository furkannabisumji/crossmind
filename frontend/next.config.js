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
  
  // Optimize chunk loading to prevent chunk load failures
  webpack: (config, { isServer }) => {
    // Optimize client-side chunk loading
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 90000,
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](@vercel\/analytics|react|react-dom|scheduler|next|use-sync-external-store)[\\/]/,
            priority: 40,
            enforce: true,
          },
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
            priority: 20,
          },
          lib: {
            test: /[\\/]node_modules[\\/]/,
            chunks: 'all',
            name(module) {
              const packageName = module.context.match(/[\\/]node_modules[\\/](.+?)(?:[\\/]|$)/)[1];
              return `npm.${packageName.replace('@', '')}`;
            },
            priority: 10,
          },
        },
      };
    }
    return config;
  },
};

module.exports = nextConfig;