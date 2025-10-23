"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Button } from "@/features/ui";
import { X, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/shared/components/LanguageSwitcher";
import { useTheme } from "next-themes";

// Navigation hook for smooth scrolling
function useSmoothScroll() {
  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId.replace('#', ''));
    if (element) {
      const headerHeight = 80; // Account for fixed header
      const elementPosition = element.offsetTop - headerHeight;
      
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  return { scrollToSection };
}

// Theme toggle component
function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="relative p-2 rounded-md hover:bg-accent transition-colors"
      type="button"
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute top-1/2 left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </button>
  );
}

// Navigation item component
function NavItem({ children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-foreground/80 hover:text-foreground transition-colors duration-200 font-medium text-sm lg:text-base py-2 px-1"
      type="button"
    >
      {children}
    </button>
  );
}

// Mobile nav item component
function MobileNavItem({ children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="block w-full text-left px-4 py-4 text-foreground/80 hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200 text-base font-medium border border-transparent hover:border-border/50"
      type="button"
    >
      {children}
    </button>
  );
}

export default function LandingHeader() {
  const t = useTranslations("LandingHeader");
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { scrollToSection } = useSmoothScroll();

  // Handle mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  // Navigation items
  const navItems = [
    { id: 'about', label: t("about") },
    { id: 'pricing', label: t("pricing") },
    { id: 'testimonials', label: t("testimonials") },
    { id: 'contact', label: t("contact") },
  ];

  // Handle navigation click
  const handleNavClick = (sectionId: string) => {
    // For section links, scroll to section
    scrollToSection(sectionId);
    setIsMobileMenuOpen(false);
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  if (!mounted) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center space-x-2">
              <div className="h-24 w-24 lg:h-32 lg:w-32 bg-muted animate-pulse rounded" />
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <nav className="container z-50 relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
          
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 relative z-50">
            <Image
              src={resolvedTheme === 'dark' ? "/Suliko_logo_white.svg" : "/Suliko_logo_black.svg"}
              alt="Suliko"
              width={120}
              height={120}
              className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-32 lg:w-32"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-center flex-1">
            {/* Navigation Items */}
            <div className="flex items-center space-x-8">
              {navItems.map((item) => (
                <NavItem
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => handleNavClick(`#${item.id}`)}
                >
                  <span className="cursor-pointer">{item.label}</span>
                </NavItem>
              ))}
            </div>
          </div>

          {/* Right Controls Group */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitcher />
            <ThemeToggle />
            <Link href="/document">
              <Button size="sm" className="text-sm">
                {t("getStarted")}
              </Button>
            </Link>
          </div>

          {/* Hamburger Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-foreground hover:bg-accent transition-colors relative z-50"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            type="button"
          >
            <div className="w-6 h-6 flex flex-col justify-center items-center">
              <span
                className={`block h-0.5 w-6 bg-current transition-all duration-300 ease-in-out ${
                  isMobileMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-1'
                }`}
              />
              <span
                className={`block h-0.5 w-6 bg-current transition-all duration-300 ease-in-out ${
                  isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`block h-0.5 w-6 bg-current transition-all duration-300 ease-in-out ${
                  isMobileMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-1'
                }`}
              />
            </div>
          </button>
        </div>

        {/* Mobile Navigation Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Menu Panel */}
            <div className="absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-background/95 backdrop-blur-md border-l border-border shadow-xl transform transition-transform duration-300 ease-in-out">
              <div className="flex flex-col h-full">
                {/* Menu Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h2 className="text-lg font-semibold text-foreground">Menu</h2>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-md hover:bg-accent transition-colors"
                    type="button"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Navigation Items */}
                <nav className="flex-1 px-4 py-6 space-y-2">
                  {navItems.map((item) => (
                    <MobileNavItem
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={() => handleNavClick(`#${item.id}`)}
                    >
                      {item.label}
                    </MobileNavItem>
                  ))}
                </nav>
                
                {/* Menu Footer */}
                <div className="p-4 border-t border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground/60">Theme</span>
                    <ThemeToggle />
                  </div>
                  
                  <Link href="/document" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full">
                      {t("getStarted")}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}