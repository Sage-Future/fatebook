import  { withSentryConfig } from "@sentry/nextjs"

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  eslint: {
    dirs: ['api', 'lib', 'pages', 'public', 'styles', 'components'],
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
  },
  async headers() {
    return [
        {
            // matching all API routes
            source: "/api/v0/:path*",
            headers: [
                { key: "Access-Control-Allow-Credentials", value: "true" },
                { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
                { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Cookie" },
            ]
        }
    ]
  }
}

const sentryWebpackPluginOptions = {
  org: "sage",
  project: "fatebook",
  silent: true, // Suppresses all logs

  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options.
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);


