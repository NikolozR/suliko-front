import { requireAdminPage } from "@/features/admin/access";
import BlogPostForm from "../BlogPostForm";

export default async function NewBlogPostPage() {
  await requireAdminPage("/admin/blog/new");

  return <BlogPostForm mode="new" />;
}
