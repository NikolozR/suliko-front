import { getAllPosts, type BlogPost } from "@/lib/blog";
import NotaryPageClient from "./_NotaryPageClient";

export const revalidate = 3600;

/**
 * The blog strip is decoration on a conversion page, so it must not be able to
 * take the page down with it. getAllPosts already answers nothing when the API
 * cannot be read; the catch is for anything else.
 */
async function loadPosts(locale: string): Promise<BlogPost[]> {
  try {
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
