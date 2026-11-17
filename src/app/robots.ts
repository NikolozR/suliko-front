import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
      // AI search and answer engines: public pages may be read and cited.
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-SearchBot",
          "PerplexityBot",
          "Google-Extended",
        ],
        allow: ["/", "/llms.txt"],
        disallow: ["/api/", "/admin/"],
      },
    ],
    sitemap: [
      "https://suliko.ge/sitemap.xml",
      "https://suliko.ai/sitemap.xml",
    ],
  };
}
