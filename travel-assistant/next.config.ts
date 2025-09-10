import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Minimal configuration for Vercel compatibility
  trailingSlash: false,
  poweredByHeader: false,
  compress: true,
  
  // Ensure proper routing
  async redirects() {
    return []
  },
  
  async rewrites() {
    return []
  }
};

export default nextConfig;
