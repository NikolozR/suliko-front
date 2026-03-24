"use client";

import { Mail, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/features/ui';

export default function NewsletterSection() {
  const t = useTranslations('Blog.newsletter');

  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-lg p-6 border border-border/50 shadow-sm">
      <div className="max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 text-primary mb-4">
          <Mail className="w-4 h-4" />
          <span className="text-sm font-medium">{t('label')}</span>
        </div>

        <h2 className="text-xl font-semibold text-foreground mb-3">
          {t('title')}
        </h2>

        <p className="text-sm text-muted-foreground mb-6">
          {t('subtitle')}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
          <input
            type="email"
            placeholder={t('placeholder')}
            className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
          <Button size="sm" className="px-4 py-2">
            <Send className="w-4 h-4 mr-1" />
            {t('subscribe')}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-3">
          {t('noSpam')}
        </p>
      </div>
    </div>
  );
}
