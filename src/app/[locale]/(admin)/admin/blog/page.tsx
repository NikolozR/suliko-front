import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import BlogPostsTable, { PostRow } from "./BlogPostsTable";

export default async function AdminBlogPage() {
  const cookieStore = await cookies();
  const adminAllowed = cookieStore.get("adminAllowed")?.value === "1";
  if (!adminAllowed) redirect("/en/admin/login");

  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .select("*, blog_post_translations(*)")
    .order("created_at", { ascending: false });

  const posts: PostRow[] = error ? [] : (data as PostRow[]);

  return <BlogPostsTable initialPosts={posts} />;
}
