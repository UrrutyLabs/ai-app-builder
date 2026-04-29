/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@repo/ai",
    "@repo/db",
    "@repo/domain",
    "@repo/repos",
    "@repo/ui",
  ],
};

export default nextConfig;
