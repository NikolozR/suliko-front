import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import { Calculator, ClipboardList, Languages, ShieldCheck, Sparkles, Users, Wallet } from "lucide-react";
import { revealDelay } from "./sections";
import { CONTAINER, KICKER, TONES, type Tone } from "./tones";

/** Whether to show the built-in AI translation card. */
const SHOW_AI_CARD = true;

type Feature = { icon: LucideIcon; tone: Tone; title: string; body: string; tags?: string[]; formula?: boolean };

export default function OfficeFeatures() {
  const t = useTranslations("SulikoOffice");

  const features: Feature[] = [
    {
      icon: ClipboardList,
      tone: "blue",
      title: t("feat.f1t"),
      body: t("feat.f1d"),
      tags: [t("st.nw"), t("st.translator"), t("st.ready")],
    },
    {
      icon: Languages,
      tone: "amber",
      title: t("feat.f2t"),
      body: t("feat.f2d"),
      tags: ["KA ↔ EN", "KA ↔ RU", "KA ↔ DE"],
    },
    {
      icon: Calculator,
      tone: "green",
      title: t("feat.f3t"),
      body: t("feat.f3d"),
      tags: [t("feat.tagPair"), t("feat.tagDoc"), t("feat.tagUrg"), t("feat.tagCopies")],
      formula: true,
    },
    { icon: Wallet, tone: "green", title: t("feat.f4t"), body: t("feat.f4d") },
    {
      icon: Users,
      tone: "blue",
      title: t("feat.f5t"),
      body: t("feat.f5d"),
      tags: ["B2C", "B2B", t("feat.tagPortal")],
    },
    {
      icon: ShieldCheck,
      tone: "amber",
      title: t("feat.f6t"),
      body: t("feat.f6d"),
      tags: [t("feat.tagRoles"), t("feat.tag2fa"), t("feat.tagAudit")],
    },
  ];

  return (
    <section className="border-t border-border bg-white">
      <div className={`${CONTAINER} flex flex-col gap-12 py-20 lg:py-24`}>
        <div data-reveal className="flex max-w-[760px] flex-col gap-3.5">
          <p className={KICKER}>{t("feat.kicker")}</p>
          <h2 className="text-3xl leading-[1.15] font-bold text-foreground lg:text-[42px]">{t("feat.title")}</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={(i % 3) * 90} />
          ))}
        </div>

        {SHOW_AI_CARD && (
          <div data-reveal className="grid items-center gap-6 rounded-[18px] bg-suliko-default-color px-7 py-8 text-white sm:grid-cols-[72px_minmax(0,1fr)] sm:px-9">
            <span className="flex h-[72px] w-[72px] items-center justify-center rounded-[18px] bg-white/15">
              <Sparkles className="h-8 w-8" aria-hidden />
            </span>
            <div className="flex flex-col gap-2">
              <h3 className="text-2xl leading-[1.3] text-white">{t("feat.f7t")}</h3>
              <p className="text-[17px] leading-[1.55] text-white">{t("feat.f7d")}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function FeatureCard({ icon: Icon, tone, title, body, tags, formula, delay }: Feature & { delay: number }) {
  const c = TONES[tone];

  return (
    <div data-reveal style={revealDelay(delay)} className={`flex flex-col gap-4 rounded-[18px] p-8 ${c.card}`}>
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-white/10">
        <Icon className={`h-6 w-6 ${c.icon}`} aria-hidden />
      </span>
      <h3 className="text-[22px] leading-[1.3] text-foreground">{title}</h3>
      <p className={`text-base leading-[1.55] ${c.body}`}>{body}</p>
      {tags && (
        <div className="mt-auto flex flex-wrap items-center gap-1.5">
          {tags.map((tag, i) => (
            <span key={tag} className="contents">
              {formula && i > 0 && <span className={`text-[13px] ${c.icon}`}>+</span>}
              <span className={`rounded-full px-2.5 py-[5px] text-[13px] ${c.tag}`}>{tag}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
