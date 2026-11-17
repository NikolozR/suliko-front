"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Menu, X, ArrowRight } from "lucide-react";

const NAV = [
  { href: "#product", label: "Product" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#office", label: "Suliko Office" },
  { href: "#developers", label: "Developers" },
  { href: "#pricing", label: "Pricing" },
];

/**
 * The international (English) landing page's own header — a new, sharper design,
 * kept apart from `LandingHeader` so that one stays untouched for other locales.
 */
export default function MerchantHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || open ? "border-b border-border bg-white/90 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <a href="#top" className="flex shrink-0 items-center gap-2">
          <Image
            src={scrolled || open ? "/Suliko_logo_black.svg" : "/Suliko_logo_white.svg"}
            alt="Suliko"
            width={112}
            height={29}
            priority
            className="h-6 w-auto sm:h-7"
          />
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`text-[14.5px] font-medium transition-colors ${
                scrolled ? "text-muted-foreground hover:text-foreground" : "text-white/85 hover:text-white"
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <Link
            href="/sign-in"
            className={`text-[14.5px] font-medium ${
              scrolled ? "text-muted-foreground hover:text-foreground" : "text-white/85 hover:text-white"
            }`}
          >
            Sign in
          </Link>
          <Link
            href="/document"
            className="inline-flex items-center gap-1.5 rounded-full bg-suliko-default-color px-4 py-2 text-[14.5px] font-semibold text-white transition hover:bg-suliko-default-hover-color"
          >
            Start free
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <button
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          className={`-mr-2 p-2 lg:hidden ${scrolled || open ? "text-foreground" : "text-white"}`}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-white px-5 pb-6 pt-2 lg:hidden">
          <nav className="flex flex-col">
            {NAV.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-border py-3.5 text-[15px] font-medium text-foreground"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex items-center gap-3">
            <Link href="/sign-in" className="text-[14.5px] font-medium text-muted-foreground">
              Sign in
            </Link>
            <Link
              href="/document"
              className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-suliko-default-color px-4 py-2.5 text-[14.5px] font-semibold text-white"
            >
              Start free <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
