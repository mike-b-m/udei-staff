import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
 experimental: {
    cpus: 1,
    workerThreads: false,
    isrFlushToDisk: false, // Prevents writing massive amounts of data to the build disk
  },
};

export default nextConfig;
