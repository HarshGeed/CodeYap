import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
         protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/det4iaj3p/image/upload/**",
      }
    ]
  }
};

export default nextConfig;
