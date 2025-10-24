import { redirect } from 'next/navigation';
import { routing } from '@/i18n/routing';

interface BlogPostRedirectProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostRedirect({ params }: BlogPostRedirectProps) {
  const { slug } = await params;
  // Redirect to the default locale blog post page
  redirect(`/${routing.defaultLocale}/blog/${slug}`);
}
