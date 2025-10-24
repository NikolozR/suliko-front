import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllPostSlugs, getPostBySlug } from '@/lib/blog';
import { BlogPost } from '@/components/blog';
import LandingHeader from '@/shared/components/LandingHeader';
import LandingFooter from '@/shared/components/LandingFooter';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    console.log('=== STARTING generateStaticParams ===');
    console.log('CWD:', process.cwd());
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    const slugs = getAllPostSlugs();
    console.log('Found slugs:', slugs);
    
    const result = slugs.map((slug) => ({
      slug,
    }));
    
    console.log('=== SUCCESS generateStaticParams ===');
    return result;
  } catch (error) {
    console.error('=== ERROR in generateStaticParams ===');
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  try {
    console.log('=== STARTING generateMetadata ===');
    const { slug } = await params;
    console.log('Slug:', slug);
    
    const post = getPostBySlug(slug);
    console.log('Post found:', !!post);

    if (!post) {
      console.log('=== Post not found, returning default metadata ===');
      return {
        title: 'Post Not Found',
      };
    }

    console.log('=== SUCCESS generateMetadata ===');
    return {
      title: `${post.title} | Suliko Blog`,
      description: post.excerpt,
      openGraph: {
        title: post.title,
        description: post.excerpt,
        type: 'article',
        publishedTime: post.date,
        authors: [post.author],
        ...(post.coverImage && {
          images: [
            {
              url: post.coverImage,
              width: 1200,
              height: 630,
              alt: post.title,
            },
          ],
        }),
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.excerpt,
        ...(post.coverImage && {
          images: [post.coverImage],
        }),
      },
    };
  } catch (error) {
    console.error('=== ERROR in generateMetadata ===');
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  try {
    console.log('=== STARTING BlogPostPage ===');
    const { slug } = await params;
    console.log('Slug:', slug);
    
    const post = getPostBySlug(slug);
    console.log('Post found:', !!post);

    if (!post) {
      console.log('=== Post not found, calling notFound() ===');
      notFound();
    }

    console.log('=== SUCCESS BlogPostPage ===');

  return (
    <>
      {/* Header */}
      <LandingHeader />
      
      {/* Main Blog Post Page with Stars Background */}
      <main className="min-h-screen blog-stars-background">
        {/* Stars Background Layer */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 stars-layer-1" />
          <div className="absolute inset-0 stars-layer-2" />
        </div>

        {/* Content Layer */}
        <div className="relative z-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 mt-16">
            <BlogPost post={post} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <LandingFooter />
    </>
  );
  } catch (error) {
    console.error('=== ERROR in BlogPostPage ===');
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
}


{/* Commit ovverride */}