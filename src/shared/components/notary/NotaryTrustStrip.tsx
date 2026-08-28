"use client";

import { useTranslations } from "next-intl";
import { ArrowLeftRight, Clock, ShieldCheck, Users } from "lucide-react";
import { useNotaryReference } from "@/shared/utils/useNotaryReference";

/**
 * The strip that sits directly under the hero — handoff §4.
 *
 * The language figure is the count of translation *directions* the partner
 * actually publishes, read live from the catalogue. A hardcoded "20+ languages"
 * drifts the moment the partner adds or retires a pair, and claiming languages
 * we cannot actually sell sends people into a dead end in the order wizard.
 */
export default function NotaryTrustStrip() {
  const t = useTranslations("NotaryPage.trust");
  const { directions } = useNotaryReference();

  const items = [
    { key: "clients", icon: Users, value: t("clientsValue"), label: t("clientsLabel") },
    {
      key: "directions",
      icon: ArrowLeftRight,
      // Falls back to the label alone until the catalogue lands, rather than
      // rendering a number that is about to change.
      value: directions > 0 ? String(directions) : "—",
      label: t("directionsLabel"),
    },
    { key: "accuracy", icon: ShieldCheck, value: t("accuracyValue"), label: t("accuracyLabel") },
    { key: "speed", icon: Clock, value: t("speedValue"), label: t("speedLabel") },
  ];

  return (
    <section className="border-y border-border bg-muted/40 py-6 sm:py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
          {items.map(({ key, icon: Icon, value, label }) => (
            <div key={key} className="flex flex-col items-center gap-1 text-center">
              <Icon className="mb-1 h-5 w-5 text-suliko-default-color" />
              <p className="text-xl font-extrabold leading-none text-foreground sm:text-2xl">
                {value}
              </p>
              <p className="text-xs leading-tight text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
