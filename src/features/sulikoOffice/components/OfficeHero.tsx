import type { CSSProperties, ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowRight, Calculator, UserCheck } from "lucide-react";
import OverviewDemo from "./demo/OverviewDemo";
import { CONTAINER, GHOST_BUTTON, PRIMARY_BUTTON } from "./tones";

/**
 * Staggers the hero's entrance. Inline on purpose: `.office-enter` sets the
 * `animation` shorthand in plain CSS, which would override a Tailwind delay
 * utility (layered) and reset it to zero.
 */
const delay = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

export default function OfficeHero() {
  const t = useTranslations("SulikoOffice.hero");

  return (
    <section className={`${CONTAINER} grid items-center gap-14 pt-14 pb-20 lg:pt-[88px] lg:pb-[104px] xl:grid-cols-[minmax(0,560px)_minmax(0,1fr)] xl:gap-16`}>
      {/* Above the demo column, whose drifting glow would otherwise wash over the headline. */}
      <div className="relative z-10 flex max-w-[640px] flex-col gap-7">
        <div
          className="inline-flex items-center gap-2 self-start rounded-full bg-[#eef1fe] px-3 py-[7px] text-sm text-[#2a44c9] office-enter dark:bg-[#3b59f3]/20 dark:text-[#c3ceff]"
          style={delay(0)}
        >
          <span aria-hidden className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-suliko-default-color opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-suliko-default-color" />
          </span>
          <span>{t("eyebrow")}</span>
        </div>
        <h1 className="text-[34px] leading-[1.08] font-bold text-foreground office-enter sm:text-5xl lg:text-[56px]" style={delay(90)}>
          {t("title")}
        </h1>
        <p className="text-lg leading-[1.55] text-muted-foreground office-enter lg:text-xl" style={delay(180)}>
          {t("sub")}
        </p>
        <div className="flex flex-wrap gap-3 office-enter" style={delay(270)}>
          <a href="#demo" className={`${PRIMARY_BUTTON} group h-14 w-full px-7 text-lg sm:w-auto`}>
            {t("primary")}
            <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden />
          </a>
          <a href="#journey" className={`${GHOST_BUTTON} group h-14 w-full px-6 text-lg sm:w-auto`}>
            {t("secondary")}
            <ArrowDown className="h-5 w-5 shrink-0 transition-transform group-hover:translate-y-0.5" aria-hidden />
          </a>
        </div>
        <p className="flex flex-wrap gap-1.5 text-[15px] text-muted-foreground office-enter" style={delay(360)}>
          <span>{t("already")}</span>
          <a href="https://app.suliko.ge" className="text-suliko-default-color underline-offset-2 hover:underline dark:text-[#8fa2ff]">
            {t("login")}
          </a>
        </p>
      </div>

      <div className="relative w-full max-w-3xl office-enter xl:max-w-none" style={delay(200)}>
        {/* A soft glow drifting behind the dashboard, wide enough to show around its frame. */}
        <div aria-hidden className="pointer-events-none absolute -inset-24 -z-10">
          <div className="h-full w-full rounded-full bg-[#c5d1ff] opacity-70 blur-3xl office-drift dark:bg-[#3b59f3]/30" />
        </div>

        <OverviewDemo />

        {/* Floating cards over the frame's edges: desktop only, where there is room. */}
        <FloatingCard className="top-[64%] -left-12" style={{}} tone="green" icon={<Calculator className="h-4 w-4" />}>
          <span className="text-xs text-muted-foreground">{t("badge1Title")}</span>
          <span className="text-sm text-foreground">{t("badge1Text")}</span>
        </FloatingCard>
        <FloatingCard className="-right-6 -bottom-9" style={{ animationDelay: "-1.8s" }} tone="blue" icon={<UserCheck className="h-4 w-4" />}>
          <span className="text-xs text-muted-foreground">{t("badge2Title")}</span>
          <span className="text-sm text-foreground">{t("badge2Text")}</span>
        </FloatingCard>
      </div>
    </section>
  );
}

function FloatingCard({
  className,
  style,
  tone,
  icon,
  children,
}: {
  className: string;
  style: CSSProperties;
  tone: "green" | "blue";
  icon: ReactNode;
  children: ReactNode;
}) {
  const iconTone =
    tone === "green"
      ? "bg-[#e7f6ec] text-[#1e7440] dark:bg-emerald-400/15 dark:text-emerald-300"
      : "bg-[#eef1fe] text-suliko-default-color dark:bg-[#3b59f3]/20 dark:text-[#aebcff]";

  return (
    <div aria-hidden className={`absolute z-20 hidden xl:block ${className}`}>
      <div
        className="flex items-center gap-3 rounded-2xl border border-border bg-background/95 py-3 pr-5 pl-3 shadow-[0_18px_40px_-18px_rgba(17,40,156,0.35)] backdrop-blur office-float"
        style={style}
      >
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconTone}`}>{icon}</span>
        <span className="flex flex-col gap-0.5">{children}</span>
      </div>
    </div>
  );
}
