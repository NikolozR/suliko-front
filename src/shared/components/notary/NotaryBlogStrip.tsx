"use client";

import { useTranslations } from "next-intl";
import { ArrowRight, BookOpen } from "lucide-react";
import { Link } from "@/i18n/navigation";
import BlogCard from "@/components/blog/BlogCard";
import type { BlogPost } from "@/lib/blog-types";

interface Props {
  posts: BlogPost[];
}

/**
 * Blog strip — handoff §4. Renders nothing when there is nothing published, so
 * an empty blog cannot leave a hole in the page.
 */
export default function NotaryBlogStrip({ posts }: Props) {
  const t = useTranslations("NotaryPage.blog");
  const featured = posts.slice(0, 3);

  if (featured.length === 0) return null;

  return (
    <section id="blog" className="bg-background py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <BookOpen className="h-3.5 w-3.5" />
            {t("sectionBadge")}
          </div>
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            {t("heading")}
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {t("subheading")}
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            {t("viewAll")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
