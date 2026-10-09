import type { NextConfig } from "next";
const config: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  output: "standalone",
  async rewrites() {
    return [
      { source: "/account/edit", destination: "/account" },
      { source: "/personal-info/edit", destination: "/personal-info" },
      {
        source: "/web3/:path*",
        destination: `${process.env.API_ORIGIN ?? "http://127.0.0.1:8080"}/web3/:path*`,
      },
      {
        source: "/sanctum/csrf-cookie",
        destination: `${process.env.API_ORIGIN ?? "http://127.0.0.1:8080"}/sanctum/csrf-cookie`,
      },
      {
        source: "/storage/:media/:filename",
        destination: `${process.env.API_ORIGIN ?? "http://127.0.0.1:8080"}/storage/:media/:filename`,
      },
      {
        source: "/email/verify/:id/:hash",
        destination: `${process.env.API_ORIGIN ?? "http://127.0.0.1:8080"}/email/verify/:id/:hash`,
      },
      {
        source: "/password/reset/:token",
        destination: "/password/reset?token=:token",
      },
      {
        source: "/oauth/:path*",
        destination: `${process.env.API_ORIGIN ?? "http://127.0.0.1:8080"}/oauth/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${process.env.API_ORIGIN ?? "http://127.0.0.1:8080"}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          {
            key: "Content-Security-Policy",
            value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'",
          },
          ...(process.env.PUBLIC_URL?.startsWith("https://")
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains",
                },
              ]
            : []),
        ],
      },
    ];
  },
};
export default config;
