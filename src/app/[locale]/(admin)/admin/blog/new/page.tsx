import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import BlogPostForm from "../BlogPostForm";

export default async function NewBlogPostPage() {
  const cookieStore = await cookies();
  const adminAllowed = cookieStore.get("adminAllowed")?.value === "1";
  if (!adminAllowed) redirect("/en/admin/login");

  return <BlogPostForm mode="new" />;
}
