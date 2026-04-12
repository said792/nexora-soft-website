import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // --- إضافة هامة جداً: السماح للموبايل بالاتصال أثناء التطوير ---
  allowedDevOrigins: ['192.168.1.100'],

  // --- إعدادات الصور (للسماح لصور Imgur و Postimages) ---
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
      },
      {
        protocol: 'https',
        hostname: 'imgur.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
};

export default nextConfig;