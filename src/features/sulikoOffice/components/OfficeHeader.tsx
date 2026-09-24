"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { NAV_SECTIONS, type NavSection } from "./sections";
import { CONTAINER, PRIMARY_BUTTON } from "./tones";

const APP_URL = "https://app.suliko.ge";

/**
 * The page's own header rather than LandingHeader: that one has no room for
 * another control. This one carries links to the page's sections (lit up as
 * you scroll through them), language, log in and the demo CTA.
 */
export default function OfficeHeader() {
  const t = useTranslations("SulikoOffice.nav");
  const [menuOpen, setMenuOpen] = useState(false);
  const active = useActiveSection();

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div className={`${CONTAINER} flex h-[72px] items-center justify-between gap-4 lg:h-[84px]`}>
        <a href="#top" aria-label={t("home")} className="flex items-center gap-3">
          <Image src="/Suliko_logo_black.svg" alt="" width={148} height={38} priority className="h-8 w-auto lg:h-[38px] dark:hidden" />
          <Image src="/Suliko_logo_white.svg" alt="" width={148} height={38} priority className="hidden h-8 w-auto lg:h-[38px] dark:block" />
          <span className="rounded-lg bg-[#eef1fe] px-2.5 pt-[7px] pb-1.5 text-base leading-none text-suliko-default-color lg:text-lg dark:bg-[#3b59f3]/20 dark:text-[#c3ceff]">
            Office
          </span>
        </a>

        <nav aria-label={t("sections")} className="hidden items-center gap-7 xl:flex">
          {NAV_SECTIONS.map((id) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={active === id ? "location" : undefined}
              className={`group relative py-2 text-[15px] whitespace-nowrap transition-colors ${
                active === id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(`s.${id}`)}
              <span
                aria-hidden
                className={`absolute inset-x-0 -bottom-0.5 h-0.5 origin-left rounded-full bg-suliko-default-color transition-transform duration-300 ${
                  active === id ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100 group-hover:opacity-40"
                }`}
              />
            </a>
          ))}
        </nav>

        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
          <LanguageToggle label={t("language")} />
          <a href={APP_URL} className="px-1 py-3 text-base whitespace-nowrap text-foreground hover:text-suliko-default-color">
            {t("login")}
          </a>
          <a href="#demo" className={`${PRIMARY_BUTTON} h-[46px] px-[22px] text-base whitespace-nowrap`}>
            {t("demo")}
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? t("closeMenu") : t("menu")}
          aria-expanded={menuOpen}
          aria-controls="office-mobile-menu"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-foreground hover:bg-accent md:hidden"
        >
          {menuOpen ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
        </button>
      </div>

      {menuOpen && (
        <nav
          id="office-mobile-menu"
          aria-label="Main"
          className="border-t border-border bg-background px-4 pt-4 pb-6 md:hidden"
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              {NAV_SECTIONS.map((id) => (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={() => setMenuOpen(false)}
                  aria-current={active === id ? "location" : undefined}
                  className={`flex h-11 items-center rounded-lg px-3 text-base ${
                    active === id ? "bg-[#eef1fe] text-[#2a44c9] dark:bg-[#3b59f3]/20 dark:text-[#c3ceff]" : "text-foreground"
                  }`}
                >
                  {t(`s.${id}`)}
                </a>
              ))}
            </div>
            <LanguageToggle label={t("language")} />
            <a
              href={APP_URL}
              className="flex h-12 items-center rounded-xl border border-border px-4 text-base text-foreground"
            >
              {t("login")}
            </a>
            <a href="#demo" onClick={() => setMenuOpen(false)} className={`${PRIMARY_BUTTON} h-12 text-base`}>
              {t("demo")}
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}

/**
 * The section being read: the last one whose top has passed a line 35% down the
 * viewport. Sections without a nav link (features, security) keep the previous
 * one lit, and nothing is lit while the hero is on screen.
 */
function useActiveSection(): NavSection | null {
  const [active, setActive] = useState<NavSection | null>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.35;
      let current: NavSection | null = null;
      for (const id of NAV_SECTIONS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return active;
}

/** KA/EN switch. The page is written for those two; Polish visitors see English. */
function LanguageToggle({ label }: { label: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div role="group" aria-label={label} className="flex w-fit gap-0.5 rounded-[10px] border border-border p-[3px]">
      {(["ka", "en"] as const).map((code) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            onClick={() => !active && router.replace(pathname, { locale: code })}
            className={`h-[34px] min-w-11 rounded-[7px] px-2.5 text-sm transition-colors ${
              active
                ? "bg-[#111a3a] text-white dark:bg-white dark:text-[#111a3a]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
