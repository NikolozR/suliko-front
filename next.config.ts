import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

// The API's address: keep it the same as src/shared/constants/api.ts. Not imported
// from there, because `next start` loads this config without compiling the
// TypeScript it imports.
const API_BASE_URL = "https://content.api24.ge/api";

const withNextIntl = createNextIntlPlugin();
const api = new URL(API_BASE_URL);

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  // Blog covers and images are served by the API (/api/files/{id}).
  images: {
    remotePatterns: [
      {
        protocol: api.protocol === "http:" ? "http" : "https",
        hostname: api.hostname,
        port: api.port,
        pathname: `${api.pathname.replace(/\/$/, "")}/files/**`,
      },
    ],
  },
  experimental: {
    mdxRs: false, // Disable MDX RS to avoid build issues
    serverActions: {
      bodySizeLimit: "11mb",
    },
  },
  // The upload address of the first File API guide, still used by integrations.
  // The API answers it in the old shapes. Passed through rather than handled
  // here: a Vercel function refuses request bodies over 4.5 MB, and these are
  // documents of up to 20 MB.
  async rewrites() {
    return [
      { source: "/api/gemini-upload", destination: `${API_BASE_URL}/Document/gemini-upload` },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);