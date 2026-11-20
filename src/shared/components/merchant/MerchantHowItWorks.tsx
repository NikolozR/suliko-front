import { Upload, FileCheck2, DownloadCloud } from "lucide-react";
import { useTranslations } from "next-intl";
import MerchantReveal from "./MerchantReveal";

const STEPS = [
  { icon: Upload, key: "upload" },
  { icon: FileCheck2, key: "translate" },
  { icon: DownloadCloud, key: "export" },
] as const;

export default function MerchantHowItWorks() {
  const t = useTranslations("Merchant.how");
  return (
    <section id="how-it-works" className="bg-white py-24 sm:py-28">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <MerchantReveal className="text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-suliko-default-color">
            {t("eyebrow")}
          </p>
          <h2 className="mt-3 text-balance text-[clamp(1.7rem,3.4vw,2.6rem)] font-medium tracking-[-0.02em] text-foreground">
            {t("title")}
          </h2>
        </MerchantReveal>

        <div className="relative mt-16">
          <div
            aria-hidden
            className="absolute left-0 right-0 top-[27px] hidden h-px sm:block"
            style={{
              background:
                "linear-gradient(90deg, transparent 8%, color-mix(in srgb, var(--suliko-default-color) 35%, transparent) 50%, transparent 92%)",
            }}
          />
          <ol className="grid gap-8 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <MerchantReveal key={s.key} delay={i * 90}>
                <li className="group relative h-full rounded-2xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-suliko-default-color/30 hover:shadow-[0_18px_40px_-18px_rgba(59,89,243,.3)]">
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-white ring-1 ring-border shadow-[0_6px_16px_-6px_rgba(16,24,40,.15)]">
                    <s.icon className="h-6 w-6 text-suliko-default-color" />
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-suliko-default-color to-suliko-default-hover-color text-[11px] font-bold text-white shadow-[0_4px_10px_-2px_rgba(59,89,243,.6)]">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 text-[1.15rem] font-semibold text-foreground">{t(`${s.key}.title`)}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{t(`${s.key}.body`)}</p>
                </li>
              </MerchantReveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
