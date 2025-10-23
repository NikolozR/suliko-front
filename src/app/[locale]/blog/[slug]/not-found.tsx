import Link from 'next/link';
import { Button } from '@/features/ui';

export default function BlogPostNotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
        <h2 className="text-xl font-semibold text-foreground mb-2">Blog Post Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The blog post you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="space-y-4">
          <Link href="/blog">
            <Button>View All Posts</Button>
          </Link>
          <div>
            <Link href="/" className="text-primary hover:underline">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
