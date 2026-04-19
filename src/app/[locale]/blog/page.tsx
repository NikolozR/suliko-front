import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getAllPosts } from '@/lib/blog';
import { BlogGrid, NewsletterSection } from '@/components/blog';
import BlogBanner from '@/components/blog/BlogBanner';
import LandingHeader from '@/shared/components/LandingHeader';
import AuroraBackground from '@/shared/components/AuroraBackground';
import LandingFooter from '@/shared/components/LandingFooter';
import { Link } from '@/i18n/navigation';
import { ChevronLeft } from 'lucide-react';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const domain = locale === 'ka' ? 'https://suliko.ge' : locale === 'en' ? 'https://suliko.io' : 'https://suliko.ge/pl';

  return {
    title: 'Blog | Suliko',
    description: 'Read the latest insights, tips, and updates from the Suliko team.',
    alternates: {
      canonical: `${domain}/blog`,
    },
    openGraph: {
      title: 'Blog | Suliko',
      description: 'Read the latest insights, tips, and updates from the Suliko team.',
      type: 'website',
    },
  };
}

export default async function BlogPage() {
  const posts = getAllPosts();
  const t = await getTranslations('Blog');

  return (
    <>
      {/* Header */}
      <LandingHeader />

      {/* Main Blog Page */}
      <main className="min-h-screen">
        <AuroraBackground />

        {/* Content */}
        <div className="relative z-10 pt-24">
          {/* Page Header */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ChevronLeft className="h-4 w-4" />
              {t('backToHome')}
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              {t('title')}
            </h1>
            <p className="text-muted-foreground max-w-xl">
              {t('subtitle')}
            </p>
          </div>

          {/* Stats Banner */}
          <BlogBanner postCount={posts.length} />

          {/* Blog Content */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <BlogGrid posts={posts} />

            {/* Newsletter Section */}
            <div className="mt-20">
              <NewsletterSection />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <LandingFooter />
    </>
  );
}
