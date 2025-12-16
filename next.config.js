/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  staticPageGenerationTimeout: 1000,
  eslint: {
    dirs: ["api", "lib", "pages", "public", "styles", "components"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*", // because Slack profile pictures seem to be on different domains
        port: "",
        pathname: "**",
      },
      // Need this only for capacitor export (todo: control this with env var)
      //   unoptimized: true,
    ],
  },
  headers() {
    return [
      {
        // matching all API routes
        source: "/api/v0/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Cookie",
          },
        ],
      },
    ]
  },
}

export default nextConfig
