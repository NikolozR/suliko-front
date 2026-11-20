import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const COLUMNS = [
  {
    key: "product",
    links: [
      { key: "translate", href: "/document" },
      { key: "office", href: "/office" },
      { key: "developers", href: "/developers" },
      { key: "pricing", href: "/price" },
    ],
  },
  {
    key: "company",
    links: [
      { key: "about", href: "/about" },
      { key: "blog", href: "/blog" },
    ],
  },
  {
    key: "support",
    links: [
      { key: "help", href: "/help" },
      { key: "contact", href: "/feedback" },
    ],
  },
  {
    key: "legal",
    links: [
      { key: "privacy", href: "/privacy" },
      { key: "terms", href: "/terms" },
      { key: "refund", href: "/refund-policy" },
    ],
  },
] as const;

export default function MerchantFooter() {
  const t = useTranslations("Merchant.footer");
  return (
    <footer className="border-t border-border bg-white py-14">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Image src="/Suliko_logo_black.svg" alt="Suliko" width={112} height={29} className="h-6 w-auto" />
            <p className="mt-4 text-[13.5px] leading-relaxed text-muted-foreground">
              {t("tagline")}
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.key}>
              <h4 className="text-[13px] font-semibold text-foreground">{t(col.key)}</h4>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.key}>
                    <Link href={l.href} className="text-[13.5px] text-muted-foreground hover:text-foreground">
                      {t(l.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-[13px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>{t("copyright")}</span>
          <span className="text-muted-foreground/70">{t("inOnePlace")}</span>
        </div>
      </div>
    </footer>
  );
}
