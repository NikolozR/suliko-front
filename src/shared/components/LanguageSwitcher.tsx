'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/ui";
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
  const t = useTranslations('LanguageSwitcher');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const onSelectChange = (value: string) => {
    // Close the select to ensure its portal overlay unmounts before navigation
    setOpen(false);
    // Use i18n-aware router to switch locale
    router.replace(pathname, { locale: value });
  };

  return (
    <Select value={locale} onValueChange={onSelectChange} open={open} onOpenChange={setOpen}>
      <SelectTrigger className="cursor-pointer w-auto min-w-[120px] bg-background/80 backdrop-blur-sm border-border">
        <div className="flex items-center gap-2">
          <Languages className="h-4 w-4" />
          <SelectValue placeholder={t('select')} />
        </div>
      </SelectTrigger>
      <SelectContent>
        {routing.locales.map((loc) => (
          <SelectItem className="cursor-pointer" key={loc} value={loc}>
            {t(loc === 'en' ? 'english' : loc === 'ka' ? 'georgian' : 'polish')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}