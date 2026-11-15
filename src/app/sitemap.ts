import { MetadataRoute } from "next";
import { getAllPostSlugs } from "@/lib/blog";

const DOMAIN_KA = "https://suliko.ge";
const DOMAIN_EN = "https://suliko.io";
const DOMAIN_PL = "https://suliko.ge"; // pl uses path prefix: /pl/

// The legal pages are listed so a card processor's review — and a search engine —
// can find them without walking the footer.
//
// The bare address is not listed: it redirects to Suliko Office, and a sitemap
// should hold only pages that answer 200. Each product has its own landing page.
const staticPages = [
  "/office",
  "/translate",
  "/blog",
  "/about",
  "/terms",
  "/privacy",
  "/refund-policy",
] as const;

/** The two product landing pages are the entry points; the legal pages are reference material. */
function priorityFor(path: string): number {
  if (path === "/office" || path === "/translate") return 1.0;
  if (path === "/blog") return 0.8;
  return 0.4;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // The blog slugs come from the API. If it cannot be read, the static pages,
  // the legal ones among them, still get listed rather than the whole sitemap
  // returning a 500.
  let enSlugs: string[] = [];
  try {
    const entries = await getAllPostSlugs();
    enSlugs = [...new Set(entries.filter((e) => e.locale === "en").map((e) => e.slug))];
  } catch (error) {
    console.error("sitemap: could not load blog slugs, listing static pages only", error);
  }

  const localePages: MetadataRoute.Sitemap = staticPages.map((path) => ({
    url: `${DOMAIN_KA}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/translate" || path === "/office" || path === "/blog" ? "weekly" : "yearly",
    priority: priorityFor(path),
    alternates: {
      languages: {
        ka: `${DOMAIN_KA}${path}`,
        en: `${DOMAIN_EN}${path}`,
        pl: `${DOMAIN_PL}/pl${path}`,
        "x-default": `${DOMAIN_KA}${path}`,
      },
    },
  }));

  const blogPosts: MetadataRoute.Sitemap = enSlugs.map((slug) => ({
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
