import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fkumkybdacmmlpoapvty.supabase.co',
        port: '',
        pathname: '/storage/v1/**',
      },
    ],
  },
};

export default nextConfig;
