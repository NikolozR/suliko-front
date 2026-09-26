---
name: verify
description: Build, serve and drive the Suliko front end (landing page and other public pages) to check a change at runtime.
---

# Verifying suliko-front

## Build and serve
The build needs Supabase env vars even for public pages; placeholders are enough:

```bash
export NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder
npx next build
npx next start -p 3200     # background; the default 3000 may be taken
```

Stop it with `kill <pid of next-server>`. Don't `pkill -f "next start"`: that pattern matches (and kills) your own shell.

## Drive
- Use Playwright with `executablePath: "/opt/pw-browsers/chromium"`. The bundled
  headless shell version is not installed, so a plain `chromium.launch()` fails.
- For the repo's e2e specs, the same override goes in a temporary config that spreads
  `playwright.config.ts`, with `DEPLOYMENT_URL=http://localhost:3200`.
- Default theme is dark (`defaultTheme="dark"`); set `localStorage.theme = "light"` in an init script to check light mode.
- Set `localStorage.bookDemoBubbleDismissed = "1"` so the demo bubble stays out of screenshots.
- Landing flows worth driving: hero demo loop (`[role="img"]`, ~11 s per loop, KA then PL),
  `#how-it-works` step buttons (`aria-pressed`), `#video`, Office feed ("Orders today"),
  footer newsletter (`footer form`), `reducedMotion: "reduce"`, `javaScriptEnabled: false`.

## Gotchas
- This Chromium has no H.264, so the MP4s never load (`readyState` 0). To check video
  behaviour, record a WebM with Playwright's `recordVideo` and `page.route("**/api/video2")` to it.
- `/api/newsletter` returns 500 without `RESEND_API_KEY`, so only the error path is observable
  here. Don't add a real key: success sends a real email.
