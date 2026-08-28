import type { BlogPost } from "@/lib/blog-types";
import NotaryPageClient from "./_NotaryPageClient";

export const revalidate = 3600;

/**
 * The blog strip is decoration on a conversion page, so it must not be able to
 * take the page down with it.
 *
 * `@/lib/blog` pulls in `@/lib/supabase`, which calls `createClient` at module
 * scope and throws when `NEXT_PUBLIC_SUPABASE_URL` is unset. A static import
 * would make that throw at page-module evaluation, where no try/catch here
 * could reach it — hence the env guard plus the dynamic import.
 */
async function loadPosts(locale: string): Promise<BlogPost[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return [];
  }

  try {
    const { getAllPosts } = await import("@/lib/blog");
    return await getAllPosts(locale);
  } catch (error) {
    console.error("[notary] could not load blog posts:", error);
    return [];
  }
}

export default async function NotaryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const posts = await loadPosts(locale);

  return <NotaryPageClient posts={posts} />;
}
