"use client";

import { useLocale, useTranslations } from 'next-intl';
import type { BlogPost } from '../types/types.Blog';
import { Badge } from '@/features/ui/components/ui/badge';
import { Calendar, Clock, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/features/ui/components/ui/button';
import { Separator } from '@/features/ui/components/ui/separator';

interface BlogPostProps {
  post: BlogPost;
}

export default function BlogPost({ post }: BlogPostProps) {
  const locale = useLocale();
  const t = useTranslations('Blog');

  const renderMarkdownContent = (content: string) => {
    // Simple markdown to HTML conversion for basic formatting
    return content
      .replace(/^# (.*$)/gim, '<h1 class="text-4xl font-bold mb-6">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-3xl font-semibold mb-4 mt-8">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-2xl font-semibold mb-3 mt-6">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/^\- (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/^(?!<[h|l])(.*$)/gim, '<p class="mb-4">$1</p>');
  };

  const content = post.content[locale] || post.content.en;
  const renderedContent = renderMarkdownContent(content);

  return (
    <article className="max-w-5xl mx-auto px-8 py-16 relative">
      {/* Background overlay for better text readability */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl -z-10 rounded-2xl" />
      {/* Back Button */}
      <div className="mb-8">
        <Link href="/blog">
          <Button variant="ghost" className="gap-2 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
{t('backToBlog')}
          </Button>
        </Link>
      </div>

      {/* Featured Image */}
      {post.featuredImage && (
        <div className="aspect-video bg-muted rounded-2xl mb-12 overflow-hidden shadow-2xl relative">
          <Image 
            src={post.featuredImage} 
            alt={post.title[locale] || post.title.en}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
          />
        </div>
      )}

      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
          {post.title[locale] || post.title.en}
        </h1>
        
        <p className="text-xl text-muted-foreground mb-6">
          {post.excerpt[locale] || post.excerpt.en}
        </p>

        {/* Author and Meta Info */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-6">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{post.author.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{new Date(post.publishedAt).toLocaleDateString(locale, {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{post.readTime} min read</span>
          </div>
        </div>

        <Separator />
      </header>

      {/* Content */}
      <div 
        className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-li:text-foreground"
        dangerouslySetInnerHTML={{ __html: renderedContent }}
      />

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Last updated: {new Date(post.updatedAt).toLocaleDateString(locale)}
          </div>
          <Link href="/blog">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
  {t('backToBlog')}
            </Button>
          </Link>
        </div>
      </footer>
    </article>
  );
}
