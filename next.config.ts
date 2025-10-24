import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  experimental: {
    mdxRs: false, // Disable MDX RS to avoid build issues
  },
};

export default withNextIntl(nextConfig);