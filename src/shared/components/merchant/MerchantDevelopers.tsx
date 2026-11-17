import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import MerchantReveal from "./MerchantReveal";

export default function MerchantDevelopers() {
  return (
    <section id="developers" className="relative overflow-hidden bg-white py-24 sm:py-28">
      <div className="glow-blob left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 bg-[#3b59f3]/[0.07]" />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <MerchantReveal>
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-suliko-default-color">
              For developers
            </p>
            <h2 className="mt-3 text-balance text-[clamp(1.7rem,3.4vw,2.6rem)] font-medium tracking-[-0.02em] text-foreground">
              Translation API for developers
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
              Integrate AI translation into your own application in a few lines of code. Translate
              articles, on-site text and more with one request.
            </p>
            <Link
              href="/developers"
              className="mt-7 inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-[14.5px] font-semibold text-foreground transition hover:border-foreground/30"
            >
              Read the docs <ArrowRight className="h-4 w-4" />
            </Link>
          </MerchantReveal>

          <MerchantReveal delay={120}>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0d10] text-[13.5px] leading-relaxed text-white shadow-[0_30px_70px_-25px_rgba(16,24,40,.45)]">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
                <span className="ml-2 font-mono text-[12px] text-white/50">translate.sh</span>
              </div>
              <pre className="overflow-x-auto p-5 font-mono">
                <code>
                  <span className="rounded bg-black px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-white">
                    POST
                  </span>{" "}
                  <span className="text-white/90">/api/Content/translate</span>
                  {"\n"}
                  <span className="text-white/40">{"{"}</span>
                  {"\n  "}
                  <span className="text-white/90">&quot;description&quot;</span>
                  <span className="text-white/40">: </span>
                  <span className="text-[#7c93ff]">&quot;Payment is due within 10 business days.&quot;</span>
                  <span className="text-white/40">,</span>
                  {"\n  "}
                  <span className="text-white/90">&quot;languageId&quot;</span>
                  <span className="text-white/40">: </span>
                  <span className="text-[#f0b323]">2</span>
                  <span className="text-white/40">,</span>
                  {"\n  "}
                  <span className="text-white/90">&quot;uniqueKey&quot;</span>
                  <span className="text-white/40">: </span>
                  <span className="text-[#7c93ff]">&quot;your-unique-key&quot;</span>
                  {"\n"}
                  <span className="text-white/40">{"}"}</span>
                  {"\n\n"}
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[11px] font-bold text-emerald-300">
                    200 OK
                  </span>{" "}
                  <span className="text-white/40">{"{ "}</span>
                  <span className="text-white/90">&quot;translatedText&quot;</span>
                  <span className="text-white/40">: </span>
                  <span className="text-[#7c93ff]">&quot;Zahlung ist innerhalb von 10 Werktagen fällig.&quot;</span>
                  <span className="text-white/40">{" }"}</span>
                </code>
              </pre>
            </div>
          </MerchantReveal>
        </div>
      </div>
    </section>
  );
}
