'use client';

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronDown } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useAuthStore } from "@/features/auth";
import { useUserStore } from "@/features/auth/store/userStore";
import { formatBalance } from "@/shared/utils/domainUtils";

/** The signed-in buyer's current pages, so "which package" is decided against what is left. */
export function PricingBalance() {
  const t = useTranslations("Pricing");
  const { token } = useAuthStore();
  const balance = useUserStore((s) => s.userProfile?.balance);
  // Both stores come from localStorage, which the server render cannot see.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !token || typeof balance !== "number") return null;

  return (
    <p className="mx-auto mt-4 w-fit rounded-full border border-border/60 bg-card px-4 py-1.5 text-sm text-card-foreground">
      {t("balance", { pages: formatBalance(balance) })}
    </p>
  );
}

/** The three answers a buyer wants next to the buttons: do pages expire, can I get a refund, is it safe to pay. */
export function PricingTrust() {
  const t = useTranslations("Pricing");
  const items = [t("trust.refund"), t("trust.payment")];

  return (
    <div className="mx-auto mt-6 max-w-3xl">
      <ul className="flex flex-col items-center justify-center gap-x-6 gap-y-2 text-sm text-foreground sm:flex-row sm:flex-wrap">
        {items.map((item) => (
          <li key={item} className="flex items-center">
            <Check className="mr-2 h-4 w-4 shrink-0 text-green-500" />
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-center text-sm">
        <Link
          href="/refund-policy"
          className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          {t("trust.refundLink")}
        </Link>
      </p>
    </div>
  );
}

/** Questions that stop a purchase when nobody answers them. Answers match the terms and refund policy. */
export function PricingFaq() {
  const t = useTranslations("Pricing");
  const items = ["expiry", "page", "refund", "more"] as const;

  return (
    <section className="mx-auto mt-14 max-w-2xl" aria-labelledby="pricing-faq-title">
      <h2 id="pricing-faq-title" className="mb-4 text-center text-xl font-semibold text-foreground">
        {t("faq.title")}
      </h2>
      <div className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-card">
        {items.map((key) => (
          <details key={key} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-card-foreground [&::-webkit-details-marker]:hidden">
              {t(`faq.${key}Q`)}
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm text-muted-foreground">
              {key === "more"
                ? t.rich("faq.moreA", {
                    email: t("email"),
                    mail: (chunks) => (
                      <a
                        href={`mailto:${t("email")}`}
                        className="underline underline-offset-4 hover:text-foreground"
                      >
                        {chunks}
                      </a>
                    ),
                  })
                : t(`faq.${key}A`)}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
