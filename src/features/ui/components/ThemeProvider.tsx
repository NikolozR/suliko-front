'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes'

/**
 * Pages designed for the light theme only. They have no theme switch, so a
 * dark preference carried over from the rest of the site would only make them
 * look unfinished. next-themes applies a forced theme in its pre-paint script,
 * so there is no flash of dark on load.
 */
const LIGHT_ONLY = /^\/[a-z]{2}\/tms(\/|$)/

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