import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { BlogService } from '@/features/blog/services/blogService';
import LandingHeader from '@/shared/components/LandingHeader';
import LandingFooter from '@/shared/components/LandingFooter';
import SulikoParticles from '@/shared/components/SulikoParticles';
import ScrollToTop from '@/shared/components/ScrollToTop';

// Dynamic import for better error handling
const BlogPost = dynamic(() => import('@/features/blog/components/BlogPost'), {
  loading: () => <div className="animate-pulse bg-muted h-96 rounded-lg" />,
  ssr: true
});

interface BlogPostPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateStaticParams() {
  try {
    const blogService = BlogService.getInstance();
    const posts = await blogService.getPosts();
    
    return posts.map((post) => ({
      slug: post.id,
    }));
  } catch (error) {
    console.error('Error generating static params for blog posts:', error);
    return [];
  }
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const blogService = BlogService.getInstance();
    const post = await blogService.getPostById(slug);

    if (!post) {
      return {
        title: 'Post Not Found - Suliko Blog',
      };
    }

    const locale = (await params).locale;
    const title = post.title[locale] || post.title.en;
    const description = post.excerpt[locale] || post.excerpt.en;

    return {
      title: `${title} - Suliko Blog`,
      description,
      openGraph: {
        title: `${title} - Suliko Blog`,
        description,
        type: 'article',
        publishedTime: post.publishedAt,
        modifiedTime: post.updatedAt,
        authors: [post.author.name],
        tags: post.tags,
        images: post.featuredImage ? [post.featuredImage] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} - Suliko Blog`,
        description,
        images: post.featuredImage ? [post.featuredImage] : undefined,
      },
    };
  } catch (error) {
    console.error('Error generating metadata for blog post:', error);
    return {
      title: 'Blog Post - Suliko',
      description: 'Read our latest blog post',
    };
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  try {
    const { slug } = await params;
    
    if (!slug) {
      console.error('No slug provided');
      notFound();
    }

    const blogService = BlogService.getInstance();
    const post = await blogService.getPostById(slug);

    if (!post) {
      console.error(`Blog post not found for slug: ${slug}`);
      notFound();
    }

    return (
      <div className="min-h-screen relative">
        {/* Background particles */}
        <SulikoParticles
          className="fixed inset-0 z-0"
          fullScreen={true}
          particleCount={60}
          speed={0.5}
          enableInteractions={true}
        />
        
        {/* Main content */}
        <div className="relative z-10">
          <LandingHeader />
          <main className="pt-20">
            <BlogPost post={post} />
          </main>
          <LandingFooter />
          <ScrollToTop />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering blog post page:', error);
    // Return a fallback page instead of calling notFound() immediately
    return (
      <div className="min-h-screen relative">
        <div className="relative z-10">
          <LandingHeader />
          <main className="pt-20">
            <div className="container mx-auto px-4 py-16 text-center">
              <h1 className="text-4xl font-bold mb-4">Blog Post Not Available</h1>
              <p className="text-xl text-muted-foreground mb-8">
                We&apos;re sorry, but this blog post is currently unavailable.
              </p>
              <Link 
                href="/blog" 
                className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Back to Blog
              </Link>
            </div>
          </main>
          <LandingFooter />
        </div>
      </div>
    );
  }
}
