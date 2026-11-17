import Image from "next/image";
import { Link } from "@/i18n/navigation";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Translate", href: "/document" },
      { label: "Suliko Office", href: "/office" },
      { label: "Developers", href: "/developers" },
      { label: "Pricing", href: "/price" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help center", href: "/help" },
      { label: "Contact", href: "/feedback" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Refund policy", href: "/refund-policy" },
    ],
  },
] as const;

export default function MerchantFooter() {
  return (
    <footer className="border-t border-border bg-white py-14">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Image src="/Suliko_logo_black.svg" alt="Suliko" width={112} height={29} className="h-6 w-auto" />
            <p className="mt-4 text-[13.5px] leading-relaxed text-muted-foreground">
              AI document translation, and the system to run a translation business on.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-[13px] font-semibold text-foreground">{col.title}</h4>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-[13.5px] text-muted-foreground hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-[13px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Suliko. All rights reserved.</span>
          <span className="text-muted-foreground/70">Translate and Suliko Office, in one place.</span>
        </div>
      </div>
    </footer>
  );
}
