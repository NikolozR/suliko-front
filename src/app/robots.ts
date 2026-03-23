import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
    ],
    sitemap: [
      "https://suliko.ge/sitemap.xml",
      "https://suliko.io/sitemap.xml",
    ],
  };
}
