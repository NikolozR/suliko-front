import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import BlogPost from '@/features/blog/components/BlogPost';
import { BlogService } from '@/features/blog/services/blogService';
import LandingHeader from '@/shared/components/LandingHeader';
import LandingFooter from '@/shared/components/LandingFooter';
import SulikoParticles from '@/shared/components/SulikoParticles';
import ScrollToTop from '@/shared/components/ScrollToTop';

interface BlogPostPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateStaticParams() {
  const blogService = BlogService.getInstance();
  const posts = await blogService.getPosts();
  
  return posts.map((post) => ({
    slug: post.id,
  }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
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
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const blogService = BlogService.getInstance();
  const post = await blogService.getPostById(slug);

  if (!post) {
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
}
