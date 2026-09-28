"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Facebook, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import { NOTARY_PHONE_DISPLAY } from "@/shared/constants/notary";
import { BOOK_DEMO_URL } from "@/shared/constants/booking";
import CompanyLegalInfo from "@/shared/components/CompanyLegalInfo";
import { COMPANY_ADDRESS_EN, COMPANY_ADDRESS_KA } from "@/shared/constants/company";

const SOCIAL_LINKS = [
  { icon: Facebook, href: "https://www.facebook.com/profile.php?id=61564358761003", label: "Facebook" },
  { icon: Linkedin, href: "https://www.linkedin.com/company/suliko-ai/?viewAsMember=true", label: "LinkedIn" },
];

const LINK = "text-sm text-muted-foreground transition-colors hover:text-foreground";
const HEADING = "mb-4 text-xs font-semibold tracking-[0.08em] text-foreground/70 uppercase";

/**
 * Site-wide footer. Always dark, bookending the dark hero: the `dark` class
 * switches the theme tokens (and the white logo) for everything inside it.
 */
export default function LandingFooter() {
  const t = useTranslations("LandingFooter");
  const tLanding = useTranslations("Landing");
  const tHeader = useTranslations("LandingHeader");
  const locale = useLocale();

  return (
    <footer id="contact" className="dark relative overflow-hidden bg-slate-950 text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-48 left-1/2 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-suliko-default-color/15 blur-[120px]"
      />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Brand + newsletter */}
        <div className="grid grid-cols-1 gap-10 border-b border-border py-12 lg:grid-cols-2 lg:items-end">
          <div className="flex max-w-md flex-col gap-4">
            <Link href="/" className="inline-flex items-center" aria-label="Suliko">
              <Image src="/Suliko_logo_white.svg" alt="" width={148} height={38} className="h-9 w-auto" />
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("description")}</p>
            <div className="flex gap-2">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-white/30 hover:text-foreground"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <NewsletterForm />
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 gap-10 py-12 md:grid-cols-4">
          <nav aria-labelledby="footer-product">
            <h3 id="footer-product" className={HEADING}>
              {t("links.product")}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/document" className={LINK}>
                  {tLanding("cta")}
                </Link>
              </li>
              <li>
                <Link href="/notary" className={LINK}>
                  {t("notary")}
                </Link>
              </li>
              <li>
                <Link href="/tms" className={LINK}>
                  {t("sulikoOffice")}
                </Link>
              </li>
              <li>
                <Link href={{ pathname: "/", hash: "pricing" }} className={LINK}>
                  {t("links.pricing")}
                </Link>
              </li>
              <li>
                <Link href="/developers" className={LINK}>
                  {t("developers")}
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-labelledby="footer-company">
            <h3 id="footer-company" className={HEADING}>
              {t("links.company")}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/blog" className={LINK}>
                  {t("blog")}
                </Link>
              </li>
              <li>
                <Link href={{ pathname: "/", hash: "testimonials" }} className={LINK}>
                  {t("testimonials")}
                </Link>
              </li>
              <li>
                <Link href={{ pathname: "/", hash: "faq" }} className={LINK}>
                  {tHeader("faq")}
                </Link>
              </li>
              <li>
                <Link href="/sign-in" className={LINK}>
                  {t("logIn")}
                </Link>
              </li>
            </ul>
          </nav>

          <div className="col-span-2">
            <h3 className={HEADING}>{t("contactUs")}</h3>
            <ul className="space-y-3">
              <li>
                <a href={`mailto:${t("email")}`} className={`flex items-center gap-2.5 ${LINK}`}>
                  <Mail className="h-4 w-4 shrink-0" aria-hidden />
                  {t("email")}
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" aria-hidden />
                <span className="whitespace-nowrap">{NOTARY_PHONE_DISPLAY}</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
                {/* Card processors require a readable postal address for the merchant. */}
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{locale === "ka" ? COMPANY_ADDRESS_KA : COMPANY_ADDRESS_EN}</span>
              </li>
            </ul>
            <a
              href={BOOK_DEMO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-blue-50"
            >
              {t("bookDemo")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-3 border-t border-border py-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1.5">
            <p className="text-sm text-muted-foreground">{t("bottom.copyright")}</p>
            <CompanyLegalInfo />
          </div>
          {/* The documents a card processor checks before lifting a merchant limit. */}
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {[
              { href: "/about", label: t("links.about") },
              { href: "/terms", label: t("links.termsOfService") },
              { href: "/privacy", label: t("links.privacyPolicy") },
              { href: "/refund-policy", label: t("links.refundPolicy") },
            ].map((link) => (
              <Link key={link.href} href={link.href} className={LINK}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/** Signs an address up through /api/newsletter. */
function NewsletterForm() {
  const t = useTranslations("LandingFooter.newsletter");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-3 lg:max-w-md lg:justify-self-end">
      <div>
        <p className="text-base font-semibold text-foreground">{t("title")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="footer-newsletter" className="sr-only">
          {t("placeholder")}
        </label>
        <input
          id="footer-newsletter"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("placeholder")}
          className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-white/5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-suliko-default-color focus:ring-2 focus:ring-suliko-default-color/40 focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="h-11 shrink-0 rounded-xl bg-suliko-default-color px-5 text-sm font-semibold text-white transition-colors hover:bg-suliko-default-hover-color disabled:opacity-60"
        >
          {status === "submitting" ? t("subscribing") : t("subscribe")}
        </button>
      </div>
      <p aria-live="polite" className="min-h-5 text-sm">
        {status === "success" && <span className="text-emerald-400">{t("success")}</span>}
        {status === "error" && <span className="text-red-400">{t("error")}</span>}
      </p>
    </form>
  );
}
