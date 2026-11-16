// Brings Suliko Office modules into this app, one module at a time (phase 3 of
// making Suliko Translate and Suliko Office one system).
//
//   node scripts/sync-office.mjs <app.suliko.ge checkout> <module>[,<module>...]
//
// For each listed module (a folder under app.suliko.ge's src/app/[locale]/(app)),
// its pages go to src/app/app/[locale]/(office)/<module>, and everything they and
// the Office layouts import goes to src/office/<same path> with `@/` imports turned
// into `@office/`. Office's messages and stylesheet come along. Then the few lines
// that differ here are adapted (see ADAPT below). Shared files are overwritten
// with app.suliko.ge's current version: run it from an up to date master, list
// EVERY module moved so far, and review the diff.
//
// A moved module is frozen in app.suliko.ge from then on; changes are made here.
import fs from "node:fs";
import path from "node:path";

const [OFFICE, MODULES] = process.argv.slice(2);
if (!OFFICE || !MODULES) {
  console.error("usage: node scripts/sync-office.mjs <app.suliko.ge checkout> <module,...>");
  process.exit(1);
}
const modules = MODULES.split(",").filter(Boolean);
const FRONT = process.cwd();
const rd = (p) => fs.readFileSync(p, "utf8");

const HEADER =
  "// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it\n" +
  "// here: app.suliko.ge's copy is frozen.\n";

// ── which files ─────────────────────────────────────────────────────────────
const EXT = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];
const resolve = (f) => EXT.map((e) => f + e).find((c) => fs.existsSync(c) && fs.statSync(c).isFile());
const seen = new Set();
function walk(file) {
  if (seen.has(file)) return;
  seen.add(file);
  for (const m of rd(file).matchAll(/(?:from|import)\s*\(?\s*["'](@\/[^"']+|\.{1,2}\/[^"']+)["']/g)) {
    const p = m[1].startsWith("@/") ? path.join(OFFICE, "src", m[1].slice(2)) : path.join(path.dirname(file), m[1]);
    const r = resolve(p);
    if (r) walk(r);
  }
}
const appDir = path.join(OFFICE, "src/app/[locale]");
// Office's server routes (sign-in, files, invoices, exports): always all of
// them. Served here only for the names in OFFICE_LOCAL_API (office-zone.ts).
const apiDir = path.join(OFFICE, "src/app/api");
for (const f of fs.readdirSync(apiDir, { recursive: true })) {
  const full = path.join(apiDir, f);
  if (fs.statSync(full).isFile() && /\.tsx?$/.test(full)) walk(full);
}
for (const f of ["layout.tsx", "error.tsx", "(app)/layout.tsx", "(app)/error.tsx", "(app)/not-found.tsx"]) {
  walk(path.join(appDir, f));
}
for (const mod of modules) {
  // A folder of the signed-in app, (app); or a sign-in screen, (auth), with
  // that group's layout; or a screen with a layout of its own under [locale]
  // (onboarding, welcome).
  let dir = path.join(appDir, "(app)", mod);
  if (!fs.existsSync(dir) && fs.existsSync(path.join(appDir, "(auth)", mod))) {
    dir = path.join(appDir, "(auth)", mod);
    walk(path.join(appDir, "(auth)", "layout.tsx"));
  } else if (!fs.existsSync(dir) && ["onboarding", "welcome"].includes(mod)) {
    dir = path.join(appDir, mod);
  }
  if (!fs.existsSync(dir)) throw new Error(`no such module: ${mod}`);
  for (const f of fs.readdirSync(dir, { recursive: true })) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isFile() && /\.(tsx?|css)$/.test(full)) walk(full);
  }
  // Office's full-screen editor pages are a route group of their own, (editor),
  // with its own layout: orders' Word editor is /translations/<id>/.../editor/<file>.
  const editorDir = path.join(appDir, "(editor)", mod);
  if (fs.existsSync(editorDir)) {
    walk(path.join(appDir, "(editor)", "layout.tsx"));
    for (const f of fs.readdirSync(editorDir, { recursive: true })) {
      const full = path.join(editorDir, f);
      if (fs.statSync(full).isFile() && /\.(tsx?|css)$/.test(full)) walk(full);
    }
  }
}

function destFor(rel) {
  if (rel === "src/app/[locale]/layout.tsx") return "src/app/app/[locale]/layout.tsx";
  if (rel.startsWith("src/app/api/")) return `src/app/app/api/${rel.slice("src/app/api/".length)}`;
  if (rel === "src/app/[locale]/error.tsx") return "src/app/app/[locale]/error.tsx";
  const page = rel.match(/^src\/app\/\[locale\]\/\(app\)\/(.*)$/);
  if (page) return `src/app/app/[locale]/(office)/${page[1]}`;
  const editor = rel.match(/^src\/app\/\[locale\]\/\(editor\)\/(.*)$/);
  if (editor) return `src/app/app/[locale]/(editor)/${editor[1]}`;
  // Sign-in screens, (auth), and the screens with a layout of their own.
  const auth = rel.match(/^src\/app\/\[locale\]\/\(auth\)\/(.*)$/);
  if (auth) return `src/app/app/[locale]/(auth)/${auth[1]}`;
  const own = rel.match(/^src\/app\/\[locale\]\/(onboarding|welcome)\/(.*)$/);
  if (own && modules.includes(own[1])) return `src/app/app/[locale]/${own[1]}/${own[2]}`;
  // Another screen's component a moved page imports (settings uses onboarding's
  // plan choice): kept at its own path under src/office, which is not a route.
  // The one shell's shared definitions: this app has its own (src/shared/nav).
  if (rel.startsWith("src/shared/nav/")) return null;
  if (rel.startsWith("src/app/")) return rel.endsWith(".css") ? null : `src/office/${rel.slice("src/".length)}`;
  return `src/office/${rel.slice("src/".length)}`;
}

// Files changed here after the move (they say so at the top). The sync never
// overwrites them; bring Office's later changes over by hand if any.
const OWNED = new Set([
  // The one sidebar: Translate's section above Office's (shared/nav/workspace.ts).
  "src/office/shared/components/shell/sidebar.tsx",
  // The one phone bar: Translate's slot (Dashboard, Translate | + | Orders, Clients).
  "src/office/shared/components/shell/bottom-bar.tsx",
  // Clean addresses: /ka/clients for a moved module, /app/ka/... for the rest.
  "src/office/i18n/navigation.ts",
  // Deleted here: Office uses Translate's editor (src/features/editor/WordEditor.tsx).
  // Listed so the sync never brings Office's copy back.
  "src/office/features/orders/components/word-editor.tsx",
  // They import Translate's editor instead of Office's copy.
  "src/office/features/orders/components/translation-workspace.tsx",
  "src/office/features/orders/use-word-document.ts",
  // Saves as the person corrects, with SaveStatus (save-status.tsx, ours) instead of a Save button.
  "src/office/features/orders/components/translation-screen.tsx",
  // One control density: sizes from the --btn-* variables (src/app/globals.css).
  "src/office/shared/components/ui/button.tsx",
  // requireSession keeps the page to come back to after signing in again
  // (adminEntryPath already goes through withBasePath here).
  "src/office/shared/auth/guards.ts",
  // Its ended-session check also keeps the page to come back to (signInAgain).
  "src/app/app/[locale]/(office)/layout.tsx",
  // One Billing: the person's translation pages beside the Office package.
  "src/app/app/[locale]/(office)/billing/page.tsx",
  // A thin wrapper now: the renderer is src/shared/components/pdf/PdfPages.tsx.
  "src/office/features/orders/components/pdf-pages.tsx",
  // Phone: the status tiles fade at the right edge, so it shows more scroll in.
  "src/office/features/dashboard/components/status-pipeline.tsx",
  // Orders have their own icon (FileStack); 文A is Translate.
  "src/office/shared/config/navigation.ts",
  // One Orders: the "From bureaus" view (Translate's assignments) is wired in here.
  "src/app/app/[locale]/(office)/translations/(list)/page.tsx",
]);

// ── copy ────────────────────────────────────────────────────────────────────
let copied = 0;
for (const abs of seen) {
  const rel = path.relative(OFFICE, abs).split(path.sep).join("/");
  const dest = destFor(rel);
  if (!dest || OWNED.has(dest)) continue;
  let src = rd(abs).replace(/(from\s+|import\s*\(\s*|import\s+)(["'])@\//g, "$1$2@office/");
  const directive = /^["']use (client|server)["'];?\r?\n/.exec(src);
  src = directive ? directive[0] + HEADER + src.slice(directive[0].length) : HEADER + src;
  const out = path.join(FRONT, dest);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, src);
  copied++;
}
fs.mkdirSync(path.join(FRONT, "src/office/messages"), { recursive: true });
for (const l of ["ka", "en"]) {
  fs.copyFileSync(path.join(OFFICE, `messages/${l}.json`), path.join(FRONT, `src/office/messages/${l}.json`));
}
// Office's static files (app manifest, service worker, icons), which its layout
// links to under /app: served here from public/app.
fs.cpSync(path.join(OFFICE, "public"), path.join(FRONT, "public/app"), { recursive: true });
fs.mkdirSync(path.join(FRONT, "src/office/styles"), { recursive: true });
fs.copyFileSync(path.join(OFFICE, "src/app/globals.css"), path.join(FRONT, "src/office/styles/globals.css"));

// ── ADAPT: the lines that differ in this app ────────────────────────────────
// Here Office has no Next basePath: its pages are a real `app` folder. So /app is
// put in front of addresses by next-intl's locale prefixes (Link, redirect) and
// by withBasePath (everything else), never by Next.
function adapt(rel, pairs) {
  const p = path.join(FRONT, rel);
  let s = rd(p);
  for (const [from, to] of pairs) {
    if (!s.includes(from)) throw new Error(`adapt: not found in ${rel}: ${from.slice(0, 60)}`);
    s = s.split(from).join(to);
  }
  fs.writeFileSync(p, s);
}
adapt("src/office/shared/lib/base-path.ts", [
  [
    'export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\\/$/, "");',
    '// Inside suliko.ge Office is always under /app.\nexport const BASE_PATH = "/app";',
  ],
]);
adapt("src/office/i18n/routing.ts", [
  [
    '  localePrefix: "always",',
    '  // Under suliko.ge Office\'s pages are /app/ka/..., /app/en/...: the prefix\n  // carries the /app, so Link and redirect produce full addresses.\n  localePrefix: { mode: "always", prefixes: { ka: "/app/ka", en: "/app/en" } },',
  ],
]);
adapt("src/office/shared/lib/api.ts", [
  ['requireEnv("API_BASE_URL")', 'requireEnv("OFFICE_API_BASE_URL")'],
  ['import { redirect } from "next/navigation";', 'import { redirect } from "next/navigation";\nimport { withBasePath } from "@office/shared/lib/base-path";'],
  ["redirect(`/${locale}/two-factor?step_up=1&next=${encodeURIComponent(current)}`);", "redirect(withBasePath(`/${locale}/two-factor?step_up=1&next=${encodeURIComponent(current)}`));"],
]);
adapt("src/app/app/[locale]/layout.tsx", [
  ['import "../globals.css";', 'import "@office/styles/globals.css";'],
  ['src: "../../fonts/bpg_arial_2009.woff2"', 'src: "../../../../fonts/bpg_arial_2009.woff2"'],
  ['src: "../../fonts/bpg_mrgvlovani_caps_2010.woff2"', 'src: "../../../../fonts/bpg_mrgvlovani_caps_2010.woff2"'],
]);
adapt("src/app/app/[locale]/layout.tsx", [
  // Office's build owns every module except the moved ones; this one owns
  // only the moved ones that are switched on (OFFICE_LOCAL_MODULES).
  // Only modules whose code has moved: office/i18n/office-path.ts.
  [
    'const moved = (process.env.OFFICE_MOVED_MODULES ?? "")\n    .split(",")\n    .map((m) => m.trim())\n    .filter(Boolean);',
    "const moved = enabledLocalModules();",
  ],
  ['import { ZoneGuard } from "@office/shared/components/zone-guard";', 'import { ZoneGuard } from "@office/shared/components/zone-guard";\nimport { enabledLocalModules } from "@office/i18n/office-path";'],
  ["<ZoneGuard owns={{ except: moved }} />", "<ZoneGuard owns={{ only: moved }} />\n        {/* Which Office modules have clean addresses here (office/i18n/navigation.ts), before anything renders. */}\n        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: `window.__sulikoLocal=${JSON.stringify(moved)}` }} />"],
]);
adapt("src/office/shared/lib/revalidate.ts", [
  // The cached pages are /app/ka/..., not /ka/... (which are Translate's).
  ["const localised = path === \"/\" ? `/${locale}` : `/${locale}${path}`;", "const localised = path === \"/\" ? `/app/${locale}` : `/app/${locale}${path}`;"],
]);
if (modules.includes("onboarding")) {
  // Onboarding's plan choice is a route file here now, no longer under src/office.
  adapt("src/app/app/[locale]/(office)/settings/page.tsx", [
    ['"@office/app/[locale]/onboarding/plan-choice"', '"@/app/app/[locale]/onboarding/plan-choice"'],
  ]);
}
adapt("src/office/shared/auth/sso.ts", [
  // Without a Next basePath here, redirect() does not add /app: the start
  // route is the Office deployment's, at /app/api/auth/sso/start.
  ["  return `/api/auth/sso/start?${query.toString()}`;", "  return withBasePath(`/api/auth/sso/start?${query.toString()}`);"],
  ["  return withBasePath(ssoStartPath(locale, next, options));", "  return ssoStartPath(locale, next, options);"],
]);
if (modules.includes("welcome")) {
  // Welcome reuses the account page's password form, a route file here.
  adapt("src/app/app/[locale]/welcome/page.tsx", [
    ['"@office/app/[locale]/(app)/account/change-password-form"', '"@/app/app/[locale]/(office)/account/change-password-form"'],
  ]);
}
adapt("src/office/styles/globals.css", [['@import "./tokens.css";', '@import "../../app/tokens.css";']]);

console.log(`moved ${modules.join(", ")}: ${copied} files, messages, stylesheet`);
