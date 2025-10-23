import Image from 'next/image';
import { MDXRemote } from 'next-mdx-remote/rsc';
import type { BlogPost } from '@/lib/blog';
import { formatDate } from '@/lib/blog';
import MDXComponents from './MDXComponents';
import BlogErrorBoundary from './BlogErrorBoundary';

interface BlogPostProps {
  post: BlogPost;
}

export default function BlogPost({ post }: BlogPostProps) {
  return (
    <article className="max-w-4xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        {post.coverImage && (
          <div className="relative h-64 md:h-96 w-full mb-8 rounded-lg overflow-hidden">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
        
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>By {post.author}</span>
            <span>•</span>
            <span>{formatDate(post.date)}</span>
            <span>•</span>
            <span>{post.readingTime}</span>
          </div>
          
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="prose prose-lg max-w-none dark:prose-invert">
        <BlogErrorBoundary
          fallback={
            <div className="text-center py-8">
              <p className="text-muted-foreground">Error loading blog content. Please try again.</p>
            </div>
          }
        >
          <MDXRemote source={post.content} components={MDXComponents} />
        </BlogErrorBoundary>
      </div>
    </article>
  );
}
