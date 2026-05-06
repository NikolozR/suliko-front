import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import BlogPostForm from "../../BlogPostForm";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const cookieStore = await cookies();
  const adminAllowed = cookieStore.get("adminAllowed")?.value === "1";
  if (!adminAllowed) redirect("/en/admin/login");

  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .select("*, blog_post_translations(*)")
    .eq("id", id)
    .single();

  if (error || !data) notFound();

  return <BlogPostForm mode="edit" initialData={data} />;
}
