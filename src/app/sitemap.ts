import { MetadataRoute } from "next";
import { getAllPostSlugs } from "@/lib/blog";

const DOMAIN_KA = "https://suliko.ge";
const DOMAIN_EN = "https://suliko.io";
const DOMAIN_PL = "https://suliko.ge"; // pl uses path prefix: /pl/

const staticPages = ["", "/blog"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const slugs = getAllPostSlugs();

  const localePages: MetadataRoute.Sitemap = staticPages.map((path) => ({
    url: `${DOMAIN_KA}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "" ? 1.0 : 0.8,
    alternates: {
      languages: {
        ka: `${DOMAIN_KA}${path}`,
        en: `${DOMAIN_EN}${path}`,
        pl: `${DOMAIN_PL}/pl${path}`,
        "x-default": `${DOMAIN_KA}${path}`,
      },
    },
  }));

  const blogPosts: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${DOMAIN_EN}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
    alternates: {
      languages: {
        en: `${DOMAIN_EN}/blog/${slug}`,
        "x-default": `${DOMAIN_EN}/blog/${slug}`,
      },
    },
  }));

  return [...localePages, ...blogPosts];
}
