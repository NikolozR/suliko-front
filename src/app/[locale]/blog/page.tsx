import { Metadata } from 'next';
import { getAllPosts } from '@/lib/blog';
import { BlogGrid, NewsletterSection } from '@/components/blog';
import BlogBanner from '@/components/blog/BlogBanner';
import LandingHeader from '@/shared/components/LandingHeader';
import LandingFooter from '@/shared/components/LandingFooter';

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
      
      {/* Main Blog Page with Stars Background */}
      <main className="min-h-screen blog-stars-background">
         {/* Stars Background Layer */}
         <div className="fixed inset-0 -z-10">
           <div className="absolute inset-0 stars-layer-1" />
           <div className="absolute inset-0 stars-layer-2" />
         </div>

        {/* Content Layer */}
        <div className="relative z-10">
           {/* Page Header */}
           <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
             <div className="text-center mb-16 mt-16">
               <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                 Blog
               </h1>
               <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                 Discover insights, tips, and updates from the Suliko team. 
                 Stay informed about the latest in AI translation technology.
               </p>
             </div>
           </div>

          {/* Banner Section */}
          <BlogBanner postCount={posts.length} />

          {/* Blog Content */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            {/* Blog Grid */}
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
