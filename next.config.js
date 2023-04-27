/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  eslint: {
    dirs: ['api', 'lib', 'pages', 'public', 'styles'],
  },
  // Need this only for capacitor export (todo: control this with env var)
  // images: {
  //   unoptimized: true,
  // }
}

export default nextConfig

