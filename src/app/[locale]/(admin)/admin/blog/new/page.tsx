import { isAdminRequest } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import BlogPostForm from "../BlogPostForm";

export default async function NewBlogPostPage() {
  if (!(await isAdminRequest())) redirect("/en/admin/login");

  return <BlogPostForm mode="new" />;
}
