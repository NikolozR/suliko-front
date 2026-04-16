"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { BlogPost } from "@/lib/blog-types";
import { formatDate } from "@/lib/format-date";
import { BookOpen, ArrowRight } from "lucide-react";

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  const t = useTranslations("Blog.card");

  return (
    <article className="group flex flex-col bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden hover:shadow-lg transition-[transform,box-shadow,border-color,background-color] duration-300 hover:border-primary/20 hover:bg-card [@media(hover:hover)]:hover:-translate-y-0.5">
      <Link href={`/blog/${post.slug}`} className="flex flex-col flex-1">
        {/* Image / fallback */}
        <div className="relative h-52 w-full overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 flex-shrink-0">
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-primary/20" />
            </div>
          )}
        </div>

        <div className="flex flex-col flex-1 p-5">
          {/* Meta */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <span>{formatDate(post.date)}</span>
            <span>·</span>
            <span>{post.readingTime}</span>
          </div>

          {/* Title */}
          <h2 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors duration-200 mb-2 line-clamp-2 leading-snug">
            {post.title}
          </h2>

          {/* Excerpt */}
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed flex-1">
            {post.excerpt}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border/40">
            <div className="flex flex-wrap gap-1">
              {post.tags?.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full"
                >
                  {tag}
                </span>
              ))}
              {(post.tags?.length ?? 0) > 2 && (
                <span className="text-xs text-muted-foreground">
                  +{(post.tags?.length ?? 0) - 2}
                </span>
              )}
            </div>

            <span className="flex items-center gap-1 text-xs text-primary font-medium group-hover:gap-2 transition-[gap] duration-200">
              {t("readMore")}
              <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
