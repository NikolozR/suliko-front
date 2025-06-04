'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/ui";
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
  const t = useTranslations('LanguageSwitcher');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const onSelectChange = (value: string) => {
    const pathWithoutLocale = pathname.replace(`/${locale}`, '');
    router.push(`/${value}${pathWithoutLocale}`);
  };

  return (
    <Select value={locale} onValueChange={onSelectChange}>
      <SelectTrigger className="cursor-pointer w-auto min-w-[120px] bg-background/80 backdrop-blur-sm border-border">
        <div className="flex items-center gap-2">
          <Languages className="h-4 w-4" />
          <SelectValue placeholder={t('select')} />
        </div>
      </SelectTrigger>
      <SelectContent>
        {routing.locales.map((loc) => (
          <SelectItem className="cursor-pointer" key={loc} value={loc}>
            {t(loc === 'en' ? 'english' : 'georgian')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 