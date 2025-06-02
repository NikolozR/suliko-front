import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
 
 
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default withNextIntl(nextConfig);