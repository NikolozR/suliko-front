"use client";

import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { useAutoplay } from "@/shared/components/landing/useAutoplay";

const TESTIMONIALS = [
  { key: "translationHouse", avatar: "თს", color: "bg-suliko-default-color" },
  { key: "irakliVekua", avatar: "ივ", color: "bg-teal-700" },
  { key: "iuristi", avatar: "IG", color: "bg-violet-600" },
  { key: "nebulaAI", avatar: "NA", color: "bg-amber-700" },
  { key: "api24", avatar: "A24", color: "bg-pink-700" },
] as const;

type Testimonial = (typeof TESTIMONIALS)[number];

const ROW_A: Testimonial[] = [TESTIMONIALS[0], TESTIMONIALS[2], TESTIMONIALS[4]];
const ROW_B: Testimonial[] = [TESTIMONIALS[1], TESTIMONIALS[3], TESTIMONIALS[0]];

/**
 * Customer quotes in two rows drifting in opposite directions; hovering pauses
 * both. Cards size to their quote, so long ones never scroll inside a card.
 */
export default function TestimonialsSection() {
  const t = useTranslations("TestimonialsSection");
  const { ref, running } = useAutoplay<HTMLElement>();

  const card = (item: Testimonial, index: number, hidden: boolean) => (
    <figure
      key={`${item.key}-${index}`}
      aria-hidden={hidden || undefined}
      className="flex w-[300px] shrink-0 flex-col gap-4 rounded-2xl border border-[#dbe2f5] bg-card p-5 sm:w-[380px] sm:p-6 dark:border-slate-800"
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
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${item.color}`}
        >
          {item.avatar}
        </span>
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
      className="scroll-mt-24 overflow-hidden bg-[#f2f5ff] py-20 sm:py-24 dark:bg-slate-950"
    >
      <div className="container mx-auto mb-10 flex flex-col justify-between gap-6 px-4 sm:px-6 lg:flex-row lg:items-end lg:px-8">
        <div data-reveal className="flex flex-col gap-3">
          <span className="font-mono text-xs tracking-[0.08em] text-suliko-default-color uppercase">
            {t("eyebrow")}
          </span>
          <h2 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">{t("title")}</h2>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">{t("subtitle")}</p>
        </div>
        <dl data-reveal className="flex gap-10">
          <div className="flex flex-col-reverse">
            <dt className="text-xs text-muted-foreground">{t("stats.averageRating")}</dt>
            <dd className="text-2xl font-bold text-suliko-default-color dark:text-blue-300">4.9/5</dd>
          </div>
          <div className="flex flex-col-reverse">
            <dt className="text-xs text-muted-foreground">{t("stats.customerSatisfaction")}</dt>
            <dd className="text-2xl font-bold text-suliko-default-color dark:text-blue-300">98%</dd>
          </div>
        </dl>
      </div>

      <div className="lp-pause-on-hover relative flex flex-col gap-4">
        <div className="lp-marquee flex w-max items-start gap-4" style={{ ["--lp-marquee" as string]: "60s" }}>
          {row(ROW_A)}
        </div>
        <div
          className="lp-marquee-reverse -ml-40 flex w-max items-start gap-4"
          style={{ ["--lp-marquee" as string]: "70s" }}
        >
          {row(ROW_B)}
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-linear-to-r from-[#f2f5ff] to-transparent sm:w-32 dark:from-slate-950"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-linear-to-l from-[#f2f5ff] to-transparent sm:w-32 dark:from-slate-950"
        />
      </div>
    </section>
  );
}
