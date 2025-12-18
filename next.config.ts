import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "example.com" },
      {
        protocol: "https",
        hostname: "sieuthivina.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/**",
      },
      {
        protocol: 'http',
        hostname: '148.230.100.215', // Thêm IP server mới
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.sieuthivina.cloud',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
