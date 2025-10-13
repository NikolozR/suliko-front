import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'ka', 'pl'],
  defaultLocale: 'ka',
  localeDetection: false
});