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
        <div className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Left Pane */}
            <div className="space-y-8">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-2">
                <Image
                  src={mounted && resolvedTheme === 'dark' ? "/Suliko_logo_white.svg" : "/Suliko_logo_black.svg"}
                  alt="Suliko"
                  width={120}
                  height={120}
                  className="h-32 w-32"
                />
              </Link>
              
              {/* Description */}
              <div className="max-w-md">
                <p className="text-muted-foreground leading-relaxed text-base">
                  {t("description")}
                </p>
              </div>
              
              {/* Book A Demo Button */}
              <div>
                <Button 
                  size="lg" 
                  className="px-8 py-4 text-base"
                  onClick={() => window.open('https://calendly.com/mishkaten/suliko-meeting', '_blank')}
                >
                  {t("bookDemo")}
                </Button>
              </div>
            </div>

            {/* Right Pane */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Resources */}
              <div>
                <h3 className="font-semibold text-foreground mb-6 text-lg">{t("resources")}</h3>
                <ul className="space-y-4">
                  <li>
                    <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                      {t("logIn")}
                    </Link>
                  </li>
                </ul>
              </div>

              {/* About */}
              <div>
                <h3 className="font-semibold text-foreground mb-6 text-lg">{t("about")}</h3>
                <ul className="space-y-4">
                  <li>
                    <Link href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
                      {t("links.aboutUs")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/team" className="text-muted-foreground hover:text-foreground transition-colors">
                      {t("team")}
                    </Link>
                  </li>
                  <li>
                    <Link href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
                      {t("testimonials")}
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contact Us */}
              <div>
                <h3 className="font-semibold text-foreground mb-6 text-lg">{t("contactUs")}</h3>
                
                {/* Social Media Links */}
                <div className="flex space-x-4 mb-6">
                  {socialLinks.map((social, index) => (
                    <a
                      key={index}
                      href={social.href}
                      target={social.href.startsWith('http') ? '_blank' : undefined}
                      rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="p-2 rounded-full bg-background hover:bg-accent transition-colors"
                      aria-label={social.label}
                    >
                      <social.icon className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                    </a>
                  ))}
                </div>

                {/* Email */}
                <div className="flex items-center text-muted-foreground mb-3">
                  <Mail className="h-4 w-4 mr-3" />
                  <a href={`mailto:${t("email")}`} className="hover:text-foreground transition-colors">
                    {t("email")}
                  </a>
                </div>

                {/* Phone */}
                <div className="flex items-center text-muted-foreground">
                  <Phone className="h-4 w-4 mr-3" />
                  <span>{t("phone")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-border">
          <div className="flex justify-center items-center">
            <div className="text-muted-foreground text-sm">
              {t("bottom.copyright")}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
