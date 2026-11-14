import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

// The API's address: keep it the same as src/shared/constants/api.ts. Not imported
// from there, because `next start` loads this config without compiling the
// TypeScript it imports.
const API_BASE_URL = "https://content.api24.ge/api";

/**
 * Suliko Office as a part of this site. With both set, every address under
 * OFFICE_PATH ("/app") is passed on to the Office deployment, which answers
 * under the same path (its NEXT_PUBLIC_BASE_PATH), so the browser never leaves
 * suliko.ge. With either unset nothing is passed on and Office keeps its own
 * address. Keep OFFICE_PATH the same as in src/features/sulikoOffice/lib/officeLinks.ts.
 */
const OFFICE_PATH = (process.env.NEXT_PUBLIC_OFFICE_PATH ?? "").replace(/\/$/, "");
const OFFICE_ZONE_URL = (process.env.OFFICE_ZONE_URL ?? "").replace(/\/$/, "");
const officeZone = Boolean(OFFICE_PATH && OFFICE_ZONE_URL);

const withNextIntl = createNextIntlPlugin();
const api = new URL(API_BASE_URL);

const nextConfig: NextConfig = {
  // Page title, description and canonical go in the <head> of the first chunk for
  // every visitor. Streamed metadata arrived ~100 KB into the document, where
  // PageSpeed and some crawlers do not see it.
  htmlLimitedBots: /.*/,
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
      ...(officeZone
        ? [
            { source: OFFICE_PATH, destination: `${OFFICE_ZONE_URL}${OFFICE_PATH}` },
            { source: `${OFFICE_PATH}/:path*`, destination: `${OFFICE_ZONE_URL}${OFFICE_PATH}/:path*` },
          ]
        : []),
    ];
  },
  // The Suliko Office landing page was /tms until October 2026. Old links,
  // bookmarks and search results keep working.
  async redirects() {
    return [
      { source: "/tms", destination: "/office", permanent: true },
      { source: "/:locale(en|ka|pl)/tms", destination: "/:locale/office", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        // Not under /app: Suliko Office answers there and sends its own,
        // stricter policy. Two values for one header cancel each other.
        source: "/((?!app/|app$).*)",
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