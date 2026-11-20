import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'ka', 'pl', 'hy'],
  defaultLocale: 'ka',
  localeDetection: false
});