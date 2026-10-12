import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import { API_BASE_URL } from "./src/shared/constants/api";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
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