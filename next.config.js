/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['nanoid'],
  devIndicators: false,
  webpack: webpackConfig => {
    webpackConfig.resolve.extensionAlias = {
      '.js': ['.ts', '.js'],
      '.mjs': ['.mts', '.mjs'],
      '.cjs': ['.cts', '.cjs'],
      '.jsx': ['.tsx', '.jsx'],
    }

    return webpackConfig
  },
}
 
module.exports = nextConfig
