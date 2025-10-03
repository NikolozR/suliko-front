"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Mail, Phone, MapPin, Facebook, Linkedin } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function LandingFooter() {
  const t = useTranslations("LandingFooter");
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('https://formsubmit.co/info@suliko.ge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          subject: 'Newsletter Subscription',
          message: `New newsletter subscription from: ${email}`,
          _captcha: 'false',
          _next: window.location.href,
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setEmail('');
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const footerLinks = {
    product: [
      { label: t("links.features"), href: "#about" },
      { label: t("links.pricing"), href: "#pricing" },
      { label: t("links.apiDocs"), href: "#" },
      { label: t("links.integrations"), href: "#" },
    ],
    company: [
      { label: t("links.aboutUs"), href: "#about" },
      { label: t("links.careers"), href: "#" },
      { label: t("links.blog"), href: "#" },
      { label: t("links.press"), href: "#" },
    ],
    support: [
      { label: t("links.helpCenter"), href: "#" },
      { label: t("links.contactSupport"), href: "#contact" },
      { label: t("links.status"), href: "#" },
      { label: t("links.community"), href: "#" },
    ],
    legal: [
      { label: t("links.privacyPolicy"), href: "#" },
      { label: t("links.termsOfService"), href: "#" },
      { label: t("links.cookiePolicy"), href: "#" },
      { label: t("links.gdpr"), href: "#" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: "https://www.facebook.com/profile.php?id=61564358761003", label: "Facebook" },
    { icon: Linkedin, href: "#", label: "https://www.linkedin.com/company/suliko-ai/?viewAsMember=true" },
  ];

  return (
    <footer id="contact" className="bg-muted/50 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center space-x-2 mb-6">
                <Image
                  src={mounted && resolvedTheme === 'dark' ? "/Suliko_logo_white.svg" : "/Suliko_logo_black.svg"}
                  alt="Suliko"
                  width={100}
                  height={100}
                  className="h-25 w-25"
                />
              </Link>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {t("description")}
              </p>
              
              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center text-muted-foreground">
                  <Mail className="h-4 w-4 mr-3" />
                  <a href={`mailto:${t("email")}`} className="hover:text-foreground transition-colors">
                    {t("email")}
                  </a>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Phone className="h-4 w-4 mr-3" />
                  <span>{t("phone")}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-3" />
                  <span>{t("location")}</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex space-x-4 mt-6">
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
            </div>

            {/* Footer Links */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <h3 className="font-semibold text-foreground mb-4">{t("links.product")}</h3>
                  <ul className="space-y-3">
                    {footerLinks.product.map((link, index) => (
                      <li key={index}>
                        <a
                          href={link.href}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-4">{t("links.company")}</h3>
                  <ul className="space-y-3">
                    {footerLinks.company.map((link, index) => (
                      <li key={index}>
                        <a
                          href={link.href}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-4">{t("links.support")}</h3>
                  <ul className="space-y-3">
                    {footerLinks.support.map((link, index) => (
                      <li key={index}>
                        <a
                          href={link.href}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-4">{t("links.legal")}</h3>
                  <ul className="space-y-3">
                    {footerLinks.legal.map((link, index) => (
                      <li key={index}>
                        <a
                          href={link.href}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="py-8 border-t border-border">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              {t("newsletter.title")}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t("newsletter.subtitle")}
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("newsletter.placeholder")}
                required
                className="flex-1 px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isSubmitting}
              />
              <button 
                type="submit"
                disabled={isSubmitting || !email}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? t("newsletter.subscribing") : t("newsletter.subscribe")}
              </button>
            </form>
            
            {/* Status Messages */}
            {submitStatus === 'success' && (
              <p className="mt-4 text-green-600 text-sm">
                {t("newsletter.success")}
              </p>
            )}
            {submitStatus === 'error' && (
              <p className="mt-4 text-red-600 text-sm">
                {t("newsletter.error")}
              </p>
            )}
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
