import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { BlogPost } from '@/lib/blog';
import { formatDate } from '@/lib/blog';

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <article className="group bg-card/80 backdrop-blur-sm rounded-lg border border-border/50 overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/20 hover:bg-card">
      <Link href={`/blog/${post.slug}`} className="block">
        {post.coverImage && (
          <div className="relative h-48 w-full overflow-hidden">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        
        <div className="p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <span>{formatDate(post.date)}</span>
            <span>•</span>
            <span>{post.readingTime}</span>
          </div>
          
          <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-200 mb-3 line-clamp-2">
            {post.title}
          </h2>
          
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
            {post.excerpt}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">By {post.author}</span>
            </div>
            
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {post.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {post.tags.length > 2 && (
                  <span className="text-xs text-muted-foreground">
                    +{post.tags.length - 2} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
