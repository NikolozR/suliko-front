"use client";

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/ui";
import { UKFlag, GeorgianFlag, PolishFlag } from "./flags/FlagIcon";

interface SidebarLanguageSelectorProps {
  isCollapsed: boolean;
}

export function SidebarLanguageSelector({ isCollapsed }: SidebarLanguageSelectorProps) {
  const t = useTranslations('LanguageSwitcher');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const onSelectChange = (value: string) => {
    setOpen(false);
    router.replace(pathname, { locale: value });
  };

  const localeNames: Record<string, string> = {
    en: t('english'),
    ka: t('georgian'),
    pl: t('polish'),
  };

  const getFlagIcon = (locale: string) => {
    switch (locale) {
      case 'en':
        return <UKFlag className="h-5 w-5 flex-shrink-0" />;
      case 'ka':
        return <GeorgianFlag className="h-5 w-5 flex-shrink-0" />;
      case 'pl':
        return <PolishFlag className="h-5 w-5 flex-shrink-0" />;
      default:
        return null;
    }
  };

  // When collapsed, show just the flag icon matching sidebar item style
  if (isCollapsed) {
    return (
      <div className="relative w-full">
        <Select value={locale} onValueChange={onSelectChange} open={open} onOpenChange={setOpen}>
          <SelectTrigger className="sidebar-item cursor-pointer w-full h-auto p-0 border-0 bg-transparent hover:bg-muted/50 rounded-md transition-all duration-200 justify-center px-3 py-2.5 group">
            <div className="transition-transform duration-200 group-hover:scale-105">
              {getFlagIcon(locale)}
            </div>
          </SelectTrigger>
          <SelectContent>
            {routing.locales.map((loc) => (
              <SelectItem className="cursor-pointer" key={loc} value={loc}>
                <div className="flex items-center gap-2">
                  {getFlagIcon(loc)}
                  <span>{localeNames[loc]}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // When expanded, show full selector matching sidebar style
  return (
    <div className="w-full">
      <Select value={locale} onValueChange={onSelectChange} open={open} onOpenChange={setOpen}>
        <SelectTrigger className="sidebar-item cursor-pointer w-full min-w-full border-0 bg-transparent hover:bg-muted/50 rounded-md px-3 py-2.5 transition-all duration-200 group text-xs sm:text-sm lg:text-base flex items-center gap-3">
          <div className="transition-transform duration-200 group-hover:scale-105">
            {getFlagIcon(locale)}
          </div>
          <span className="whitespace-nowrap flex-1 text-left">
            {localeNames[locale] || t('select')}
          </span>
        </SelectTrigger>
        <SelectContent>
          {routing.locales.map((loc) => (
            <SelectItem className="cursor-pointer" key={loc} value={loc}>
              <div className="flex items-center gap-2">
                {getFlagIcon(loc)}
                <span>{localeNames[loc]}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

