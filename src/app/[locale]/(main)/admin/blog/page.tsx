import { isAdminRequest } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { getAdminBlogPosts } from "@/lib/site-content-admin";
import BlogPostsTable, { PostRow } from "./BlogPostsTable";

export default async function AdminBlogPage() {
  if (!(await isAdminRequest())) redirect("/en/admin/login");

  const posts: PostRow[] = (await getAdminBlogPosts()) ?? [];

  return <BlogPostsTable initialPosts={posts} />;
}
