import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Prisma out of the bundler's file tracing — the generated clients use
  // dynamic requires for their query engine, which otherwise trips Next's NFT.
  serverExternalPackages: ["@prisma/client", "prisma", ".prisma/client"],
};

export default nextConfig;
