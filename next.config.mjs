/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'simple-icons',
      'framer-motion',
      'motion',
      '@radix-ui/react-separator',
      '@radix-ui/react-slot',
    ],
  },
};
export default nextConfig;
