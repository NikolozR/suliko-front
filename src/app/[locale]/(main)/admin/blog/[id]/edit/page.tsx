import { requireAdminPage } from "@/features/admin/access";
import { redirect, notFound } from "next/navigation";
import { getAdminBlogPost } from "@/lib/site-content-admin";
import BlogPostForm from "../../BlogPostForm";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage("/admin/blog");

  const { id } = await params;

  const post = await getAdminBlogPost(id);
  if (!post) notFound();

  return <BlogPostForm mode="edit" initialData={post} />;
}
