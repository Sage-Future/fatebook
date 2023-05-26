/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  eslint: {
    dirs: ['api', 'lib', 'pages', 'public', 'styles'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*', // because Slack profile pictures seem to be on different domains
        port: '',
        pathname: '**',
      },
      // Need this only for capacitor export (todo: control this with env var)
      //   unoptimized: true,
    ],
  }
}

export default nextConfig

