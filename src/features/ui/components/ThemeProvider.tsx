'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes'

/**
 * Pages designed for the light theme only. They have no theme switch, so a
 * dark preference carried over from the rest of the site would only make them
 * look unfinished. next-themes applies a forced theme in its pre-paint script,
 * so there is no flash of dark on load.
 *
 * The bare locale root is included because that's the English merchant
 * landing page ([locale]/page.tsx) - light-only, same as /office. Georgian
 * and Polish never actually render it (middleware redirects their bare root
 * to /office first), so matching it there too is harmless.
 */
const LIGHT_ONLY = /^\/[a-z]{2}\/?$|^\/[a-z]{2}\/office(\/|$)/

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const pathname = usePathname()

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange={false}
      forcedTheme={LIGHT_ONLY.test(pathname ?? '') ? 'light' : undefined}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
} 