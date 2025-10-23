"use client";

import { BlogPost } from '../types/types.Blog';
import { Skeleton } from '@/features/ui/components/ui/skeleton';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/features/ui/components/ui/button';
import { Calendar, Clock, User } from 'lucide-react';

interface BlogHeroProps {
  featuredPosts: BlogPost[];
  isLoading: boolean;
}

function BlogHeroSkeleton() {
  return (
    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-8 mb-8">
      <Skeleton className="h-8 w-48 mb-4" />
      <Skeleton className="h-12 w-full mb-4" />
      <Skeleton className="h-6 w-3/4 mb-6" />
      <div className="flex gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

export default function BlogHero({ featuredPosts, isLoading }: BlogHeroProps) {
  const locale = useLocale();
  const t = useTranslations('Blog');

  if (isLoading) {
    return <BlogHeroSkeleton />;
  }

  const featuredPost = featuredPosts[0];

  if (!featuredPost) {
    return (
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-8 mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Suliko Blog</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Discover insights, updates, and innovations in AI-powered translation.
        </p>
        <Link href={`/${locale}/blog`}>
          <Button size="lg">Explore All Posts</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/10 rounded-2xl overflow-hidden mb-12 border border-primary/20 shadow-2xl">
      {featuredPost.featuredImage && (
        <div className="absolute inset-0 opacity-30">
          <Image 
            src={featuredPost.featuredImage} 
            alt={featuredPost.title[locale] || featuredPost.title.en}
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>
      )}
      
      <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/70 to-transparent" />
      
      <div className="relative p-8 md:p-16">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm border border-primary/30 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            Featured Post
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground leading-tight">
            {featuredPost.title[locale] || featuredPost.title.en}
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 line-clamp-3 leading-relaxed">
            {featuredPost.excerpt[locale] || featuredPost.excerpt.en}
          </p>

          <div className="flex flex-wrap items-center gap-8 text-sm text-muted-foreground mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium">{featuredPost.author.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <span>{new Date(featuredPost.publishedAt).toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <span>{featuredPost.readTime} min read</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href={`/${locale}/blog/${featuredPost.id}`}>
              <Button size="lg" className="text-lg px-8 py-6 h-auto">
                {t('readFullPost')} →
              </Button>
            </Link>
            <Link href={`/${locale}/blog`}>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto border-primary/30 hover:bg-primary/10">
                {t('viewAllPosts')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
