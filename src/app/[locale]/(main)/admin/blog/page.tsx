import { requireAdminPage } from "@/features/admin/access";
import { getAdminBlogPosts } from "@/lib/site-content-admin";
import BlogPostsTable, { PostRow } from "./BlogPostsTable";

export default async function AdminBlogPage() {
  await requireAdminPage("/admin/blog");

  const posts: PostRow[] = (await getAdminBlogPosts()) ?? [];

  return <BlogPostsTable initialPosts={posts} />;
}
