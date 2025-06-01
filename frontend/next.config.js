/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export to enable proper client-side rendering
  // output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // Add React strict mode for better error detection
  reactStrictMode: true
};

module.exports = nextConfig;