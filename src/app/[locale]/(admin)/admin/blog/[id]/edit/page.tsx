import { isAdminRequest } from "@/lib/admin-auth";
import { redirect, notFound } from "next/navigation";
import { getAdminBlogPost } from "@/lib/site-content-admin";
import BlogPostForm from "../../BlogPostForm";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdminRequest())) redirect("/en/admin/login");

  const { id } = await params;

  const post = await getAdminBlogPost(id);
  if (!post) notFound();

  return <BlogPostForm mode="edit" initialData={post} />;
}
