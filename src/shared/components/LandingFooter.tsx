"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Mail, Phone, Facebook, Linkedin } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/features/ui";

export default function LandingFooter() {
  const t = useTranslations("LandingFooter");
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const socialLinks = [
    { icon: Facebook, href: "https://www.facebook.com/profile.php?id=61564358761003", label: "Facebook" },
    { icon: Linkedin, href: "https://www.linkedin.com/company/suliko-ai/?viewAsMember=true", label: "LinkedIn" },
  ];

  return (
    <footer id="contact" className="bg-muted/50 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Col 1: Brand */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center">
              <Image
                src={mounted && resolvedTheme === 'dark' ? "/Suliko_logo_white.svg" : "/Suliko_logo_black.svg"}
                alt="Suliko"
                width={80}
                height={80}
                className="h-14 w-14"
              />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("description")}
            </p>
            <div className="flex gap-2 pt-1">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-background hover:bg-accent transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2: Resources */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">
              {t("resources")}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/developers" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t("developers")}
                </Link>
              </li>
              <li>
                <Link href="/sign-in" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t("logIn")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: About */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">
              {t("about")}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t("links.aboutUs")}
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t("blog")}
                </Link>
              </li>
              <li>
                <Link href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t("testimonials")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">
              {t("contactUs")}
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href={`mailto:${t("email")}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>{t("email")}</span>
                </a>
              </li>
              <li>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">{t("phone")}</span>
                </div>
              </li>
            </ul>
            <div className="mt-6">
              <Button
                size="sm"
                className="w-full"
                onClick={() => window.open('https://calendly.com/misha-suliko/30min', '_blank')}
              >
                {t("bookDemo")}
              </Button>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="py-5 border-t border-border flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
          <p className="text-sm text-muted-foreground">
            {t("bottom.copyright")}
          </p>
          <Link
            href="/terms"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("links.termsOfService")}
          </Link>
        </div>

      </div>
    </footer>
  );
}
