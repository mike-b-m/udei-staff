import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
 experimental: {
    cpus: 1,
    workerThreads: false,
    isrFlushToDisk: false, // Prevents writing massive amounts of data to the build disk
  },
};

module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nmdpobapzhsxagbxdckm.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/student_photo/**',
      },
    ],
  },
}
export default nextConfig;
