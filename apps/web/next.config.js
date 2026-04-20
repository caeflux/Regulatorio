/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@regtelecom/shared'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
