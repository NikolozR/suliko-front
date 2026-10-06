import { isAdminRequest } from "@/lib/admin-auth";
import { redirect, notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import BlogPostForm from "../../BlogPostForm";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdminRequest())) redirect("/en/admin/login");

  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .select("*, blog_post_translations(*)")
    .eq("id", id)
    .single();

  if (error || !data) notFound();

  return <BlogPostForm mode="edit" initialData={data} />;
}
