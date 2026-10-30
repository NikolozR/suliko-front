"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { useAutoplay } from "@/shared/components/landing/useAutoplay";

// `logo` is the company's own mark (public/testimonials, taken from its website).
// Without one, or for a person, the card shows initials on a colour.
const TESTIMONIALS = [
  { key: "translationHouse", avatar: "თს", color: "bg-suliko-default-color", logo: "/testimonials/translation-house.png" },
  { key: "irakliVekua", avatar: "ივ", color: "bg-teal-700", logo: null },
  { key: "iuristi", avatar: "IG", color: "bg-violet-600", logo: "/testimonials/iuristi.png" },
  { key: "nebulaAI", avatar: "NA", color: "bg-amber-700", logo: "/testimonials/nebula.png" },
  { key: "api24", avatar: "A24", color: "bg-pink-700", logo: "/testimonials/api24.png" },
] as const;

type Testimonial = (typeof TESTIMONIALS)[number];

const ROW_A: Testimonial[] = [TESTIMONIALS[0], TESTIMONIALS[2], TESTIMONIALS[4]];
const ROW_B: Testimonial[] = [TESTIMONIALS[1], TESTIMONIALS[3]];

/**
 * Customer quotes in two rows drifting in opposite directions; hovering pauses
 * both. Every card in both rows is as tall as the tallest quote (measured, so
 * a long Georgian or Polish quote never scrolls or clips inside a card).
 */
export default function TestimonialsSection() {
  const t = useTranslations("TestimonialsSection");
  const { ref, running } = useAutoplay<HTMLElement>();

  // Cards are measured at their natural height, then all given the largest, so
  // the rows read as one grid whatever the language or screen width.
  useEffect(() => {
    const section = ref.current;
    if (!section) return;
    const cards = () => Array.from(section.querySelectorAll<HTMLElement>("figure[data-testimonial]"));
    const equalize = () => {
      if (section.offsetWidth === 0) return; // hidden: nothing to measure; resizing re-runs this
      const all = cards();
      all.forEach((el) => (el.style.height = "auto"));
      const tallest = Math.max(0, ...all.map((el) => el.offsetHeight));
      if (tallest > 0) all.forEach((el) => (el.style.height = `${tallest}px`));
    };
    equalize();
    const observer = new ResizeObserver(equalize);
    observer.observe(section);
    void document.fonts?.ready.then(equalize);
    return () => observer.disconnect();
  }, [ref, t]);

  const card = (item: Testimonial, index: number, hidden: boolean) => (
    <figure
      key={`${item.key}-${index}`}
      aria-hidden={hidden || undefined}
      data-testimonial
      className="flex w-[300px] shrink-0 flex-col gap-4 rounded-2xl border border-landing-line bg-card p-5 sm:w-[380px] sm:p-6 dark:border-slate-800"
    >
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-current text-amber-400" aria-hidden />
        ))}
        <span className="sr-only">5/5</span>
      </div>
      <blockquote className="text-[15px] leading-relaxed text-foreground/80">
        &ldquo;{t(`testimonials.${item.key}.content`)}&rdquo;
      </blockquote>
      <figcaption className="mt-auto flex items-center gap-3">
        {item.logo ? (
          <Image
            src={item.logo}
            alt=""
            width={36}
            height={36}
            // Already 96 px (crisp at 2x): no need to route 3 KB files through the optimizer.
            unoptimized
            className="h-9 w-9 shrink-0 rounded-full bg-white object-cover ring-1 ring-black/10"
          />
        ) : (
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${item.color}`}
          >
            {item.avatar}
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-foreground">
            {t(`testimonials.${item.key}.name`)}
          </span>
          <span className="block truncate text-xs text-muted-foreground">{t(`testimonials.${item.key}.role`)}</span>
        </span>
      </figcaption>
    </figure>
  );

  // Four copies per row: the loop moves by half, so the seam never shows on wide screens.
  const row = (items: Testimonial[]) =>
    [0, 1, 2, 3].flatMap((copy) => items.map((item, i) => card(item, copy * items.length + i, copy > 0)));

  return (
    <section
      id="testimonials"
      ref={ref}
      data-paused={!running || undefined}
      className="scroll-mt-24 overflow-hidden bg-landing-tint py-20 sm:py-24 dark:bg-slate-950"
    >
      <div className="container mx-auto mb-10 flex flex-col justify-between gap-6 px-4 sm:px-6 lg:flex-row lg:items-end lg:px-8">
        <div data-reveal className="flex flex-col gap-3">
          <span className="font-mono text-xs tracking-[0.08em] text-suliko-default-color uppercase">
            {t("eyebrow")}
          </span>
          <h2 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">{t("title")}</h2>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      <div className="lp-pause-on-hover relative flex flex-col gap-4">
        <div className="lp-marquee flex w-max items-stretch gap-4" style={{ ["--lp-marquee" as string]: "60s" }}>
          {row(ROW_A)}
        </div>
        <div
          className="lp-marquee-reverse -ml-40 flex w-max items-stretch gap-4"
          style={{ ["--lp-marquee" as string]: "70s" }}
        >
          {row(ROW_B)}
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-linear-to-r from-landing-tint to-transparent sm:w-32 dark:from-slate-950"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-linear-to-l from-landing-tint to-transparent sm:w-32 dark:from-slate-950"
        />
      </div>
    </section>
  );
}
