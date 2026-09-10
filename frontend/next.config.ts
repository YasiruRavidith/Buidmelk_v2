import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
      },
      {
        protocol: "https",
        hostname: "**.railway.app",
      },
      {
        protocol: "https",
        hostname: "**.up.railway.app",
      },
      {
        protocol: "http",
        hostname: "**.railway.app",
      },
      {
        protocol: "http",
        hostname: "**.up.railway.app",
      },
      {
        protocol: "https",
        hostname: "buidmelkv2-production.up.railway.app",
      },
      {
        protocol: "http",
        hostname: "buidmelkv2-production.up.railway.app",
      },
    ],
  },
};

export default nextConfig;
