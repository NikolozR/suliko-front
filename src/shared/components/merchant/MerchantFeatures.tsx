import { Sparkles, Globe2, ShieldCheck, PencilRuler } from "lucide-react";
import { useTranslations } from "next-intl";
import MerchantReveal from "./MerchantReveal";

/* The same colour family as the file icons in the promo video (blue / coral / amber), plus one
   emerald for privacy — a small deliberate link between the page and the footage it's built around. */
const TINT = {
  amber: "from-[#ffd65c] to-[#c98a06]",
  blue: "from-[#5a74ff] to-[#2a41c4]",
  coral: "from-[#ff8a68] to-[#c9482a]",
  emerald: "from-[#34d399] to-[#047857]",
} as const;

const FEATURES = [
  { icon: Sparkles, tint: "amber", key: "copilot" },
  { icon: Globe2, tint: "blue", key: "languages" },
  { icon: PencilRuler, tint: "coral", key: "format" },
  { icon: ShieldCheck, tint: "emerald", key: "privacy" },
] as const;

export default function MerchantFeatures() {
  const t = useTranslations("Merchant.features");
  return (
    <section id="product" className="relative overflow-hidden bg-suliko-main-content-bg-color py-24 sm:py-28">
      <div className="glow-blob -left-24 top-0 h-72 w-72 bg-[#3b59f3]/15" />
      <div className="glow-blob -right-20 bottom-0 h-72 w-72 bg-[#f0b323]/15" />
      <div className="absolute inset-0 bg-dot-grid [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <MerchantReveal className="max-w-2xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-suliko-default-color">{t("eyebrow")}</p>
          <h2 className="mt-3 text-balance text-[clamp(1.7rem,3.4vw,2.6rem)] font-medium tracking-[-0.02em] text-foreground">
            {t("title")}
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            {t("subtitle")}
          </p>
        </MerchantReveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <MerchantReveal key={f.key} delay={i * 70}>
              <div className="group h-full rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(16,24,40,.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-16px_rgba(16,24,40,.18)]">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-[0_8px_18px_-6px_rgba(20,25,40,.45)] ${TINT[f.tint]}`}
                >
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-[1.02rem] font-semibold text-foreground">{t(`${f.key}.title`)}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{t(`${f.key}.body`)}</p>
              </div>
            </MerchantReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
