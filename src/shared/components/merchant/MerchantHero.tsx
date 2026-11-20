import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import MerchantWatchDemo from "./MerchantWatchDemo";

const STATS = [
  ["2M+", "documents"],
  ["50+", "languages"],
  ["99%+", "accuracy"],
] as const;

export default function MerchantHero() {
  const t = useTranslations("Merchant.hero");
  return (
    <section id="top" className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[#0a0a0a]">
      {/* Clean, silent loop built for this hero — the overlay text lives here in HTML, not baked into the file. */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        poster="/merchant-video/suliko_hero_poster.jpg"
      >
        <source src="/merchant-video/suliko_hero_web_720p.webm" type="video/webm" media="(max-width: 900px)" />
        <source src="/merchant-video/suliko_hero_web_720p.mp4" type="video/mp4" media="(max-width: 900px)" />
        <source src="/merchant-video/suliko_hero_web_1080p.mp4" type="video/mp4" />
      </video>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,10,12,.5) 0%, rgba(8,10,12,.08) 22%, rgba(8,10,12,.08) 48%, rgba(8,10,12,.42) 78%, rgba(8,10,12,.62) 100%)",
        }}
      />

      <div className="relative flex flex-1 flex-col items-center justify-end px-5 pb-16 pt-28 text-center sm:pb-20">
        <h1 className="max-w-3xl text-balance text-[clamp(2.1rem,5.2vw,4.25rem)] font-medium leading-[1.06] tracking-[-0.025em] text-white [text-shadow:0_2px_30px_rgba(0,0,0,.28)]">
          {t("title")}
        </h1>
        <p className="mt-5 max-w-xl text-pretty text-[clamp(1rem,1.5vw,1.3rem)] font-medium text-white/90">
          {t("subtitle")}
        </p>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/document"
            className="inline-flex items-center gap-2 rounded-full bg-suliko-default-color px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_6px_20px_rgba(20,30,90,.35)] transition hover:bg-suliko-default-hover-color"
          >
            {t("cta")}
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
              <ArrowRight className="h-3.5 w-3.5 text-suliko-default-hover-color" />
            </span>
          </Link>
          <MerchantWatchDemo />
        </div>

        <dl className="mt-14 grid w-full max-w-lg grid-cols-3 gap-4 border-t border-white/15 pt-7 sm:mt-16">
          {STATS.map(([value, key]) => (
            <div key={key}>
              <dt className="sr-only">{t(`stats.${key}`)}</dt>
              <dd className="text-[1.6rem] font-semibold text-white sm:text-[1.9rem]">{value}</dd>
              <div className="mt-1 text-[12.5px] font-medium text-white/65">{t(`stats.${key}`)}</div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
