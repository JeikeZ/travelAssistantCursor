import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Basic performance optimizations
  trailingSlash: false,
  poweredByHeader: false,
  compress: true,
  
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'clsx', 'tailwind-merge'],
  },
  
  // Simplified webpack configuration
  webpack: (config, { dev }) => {
    // Bundle analyzer (only if explicitly requested)
    if (process.env.ANALYZE === 'true' && !dev) {
      try {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'server',
            openAnalyzer: true,
          })
        )
      } catch (error) {
        console.warn('Bundle analyzer not available:', error instanceof Error ? error.message : String(error))
      }
    }
    
    return config
  },
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 year
  },
  
  // Headers for better caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      // User-specific endpoints - NO public caching
      {
        source: '/api/trips/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, must-revalidate',
          },
          {
            key: 'Vary',
            value: 'Cookie',
          },
        ],
      },
      {
        source: '/api/auth/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, must-revalidate',
          },
        ],
      },
      // Public endpoints - can be cached
      {
        source: '/api/(weather|cities|generate-packing-list)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=1800, stale-while-revalidate=3600',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
