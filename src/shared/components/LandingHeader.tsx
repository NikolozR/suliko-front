"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Button } from "@/features/ui";
import { Menu, X, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/shared/components/LanguageSwitcher";
import { useTheme } from "next-themes";

// Custom ThemeToggle for header without fixed positioning
function HeaderThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
      }}
      className="cursor-pointer"
      type="button"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export default function LandingHeader() {
  const t = useTranslations("LandingHeader");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navigationItems = [
    { href: "#about", label: t("about") },
    { href: "#pricing", label: t("pricing") },
    { href: "#testimonials", label: t("testimonials") },
    { href: "#contact", label: t("contact") },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src={mounted && resolvedTheme === 'dark' ? "/Suliko_logo_white.svg" : "/Suliko_logo_black.svg"}
              alt="Suliko"
              width={120}
              height={120}
              className="h-24 w-24 lg:h-32 lg:w-32"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-foreground/80 hover:text-foreground transition-colors duration-200 font-medium"
              >
                {item.label}
              </a>
            ))}
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <HeaderThemeToggle />
            </div>
            <Link href="/document">
              <Button 
                className="ml-2"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                type="button"
              >
                {t("getStarted")}
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-foreground hover:bg-accent transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
            aria-label="Toggle mobile menu"
            type="button"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-background/95 backdrop-blur-md border-t border-border">
              {navigationItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2 text-foreground/80 hover:text-foreground hover:bg-accent rounded-md transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  {item.label}
                </a>
              ))}
              <div className="px-3 py-2 flex items-center gap-3">
                <LanguageSwitcher />
                <HeaderThemeToggle />
              </div>
              <div className="px-3 py-2">
                <Link href="/document" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button 
                    className="w-full"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    type="button"
                  >
                    {t("getStarted")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
