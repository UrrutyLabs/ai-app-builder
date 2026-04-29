/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ai", "@repo/db", "@repo/domain", "@repo/ui"],
};

export default nextConfig;
