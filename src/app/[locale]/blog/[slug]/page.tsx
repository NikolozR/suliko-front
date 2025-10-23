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
  const slugs = getAllPostSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

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
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

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
}
