import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import MerchantReveal from "./MerchantReveal";

export default function MerchantClosingCta() {
  return (
    <section className="relative overflow-hidden bg-[#0a0a0a] py-20 text-center text-white sm:py-24">
      <div className="glow-blob left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 bg-[#3b59f3]/20" />
      <div className="absolute inset-0 bg-dot-grid-dark [mask-image:radial-gradient(ellipse_60%_80%_at_50%_50%,black,transparent)]" />

      <MerchantReveal className="relative mx-auto max-w-2xl px-5 sm:px-8">
        <h2 className="text-balance text-[clamp(1.7rem,3.6vw,2.6rem)] font-medium tracking-[-0.02em]">
          Your first 10 pages are on us
        </h2>
        <p className="mt-3 text-[15px] text-white/70">
          Upload a document now and see the translation next to the original in a couple of minutes.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/document"
            className="inline-flex items-center gap-2 rounded-full bg-suliko-default-color px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(59,89,243,.7)] transition hover:bg-suliko-default-hover-color"
          >
            Start translating <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/office#demo"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3.5 text-[15px] font-semibold text-white transition hover:border-white/50"
          >
            Book a demo
          </Link>
        </div>
      </MerchantReveal>
    </section>
  );
}
