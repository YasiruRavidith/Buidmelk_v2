import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
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
        protocol: "https",
        hostname: "**.railway.app",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.up.railway.app",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "**.railway.app",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "**.up.railway.app",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "buidmelkv2-production.up.railway.app",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "buidmelkv2-production.up.railway.app",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";
    const backendOrigin = backendUrl.replace(/\/api\/?$/, "");
    return [
      {
        source: "/media/:path*",
        destination: `${backendOrigin}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;
