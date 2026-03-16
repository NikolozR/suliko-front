import { Metadata } from 'next';
import { getAllPosts } from '@/lib/blog';
import { BlogGrid, NewsletterSection } from '@/components/blog';
import BlogBanner from '@/components/blog/BlogBanner';
import LandingHeader from '@/shared/components/LandingHeader';
import AuroraBackground from '@/shared/components/AuroraBackground';
import LandingFooter from '@/shared/components/LandingFooter';
import { Link } from '@/i18n/navigation';
import { ChevronLeft } from 'lucide-react';

// Allow dynamic generation for better Vercel compatibility
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Blog | Suliko',
  description: 'Read the latest insights, tips, and updates from the Suliko team.',
  openGraph: {
    title: 'Blog | Suliko',
    description: 'Read the latest insights, tips, and updates from the Suliko team.',
    type: 'website',
  },
};

export default function BlogPage() {
  const posts = getAllPosts();

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
              Back to home
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Blog
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Insights, tips, and updates from the Suliko team on AI translation technology.
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
