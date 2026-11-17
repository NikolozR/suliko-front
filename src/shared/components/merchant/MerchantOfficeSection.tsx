import { ArrowRight, ClipboardList, Users, Calculator, Wallet, LineChart, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import MerchantReveal from "./MerchantReveal";
import MerchantOfficeMockPanel from "./MerchantOfficeMockPanel";

const ITEMS = [
  { icon: ClipboardList, title: "Orders & statuses", body: "Every order from first request to pickup, with a status the whole team can see." },
  { icon: Users, title: "Translators & notaries", body: "Your translators and notaries with their language pairs, so each order goes to the right person." },
  { icon: Calculator, title: "Automatic pricing", body: "Translation and notary costs calculated from language pair, document type, pages and urgency." },
  { icon: Wallet, title: "Finance", body: "Client payments, translator and notary payouts, expenses and profit — reconciled automatically." },
  { icon: LineChart, title: "Reports", body: "Revenue, profit and volume by week and month, broken down by language pair and source." },
  { icon: ShieldCheck, title: "Team & roles", body: "Five roles, with staff access to what they need. Two-factor login and a full audit log." },
];

/**
 * The "don't lose the existing Office page" answer: this is an overview plus a live-style mock,
 * and its CTA sends people straight to the real, full `/office` page (its own hero, FAQ, live
 * demo booking and sign-in) — unchanged, still there, just one click deeper instead of the front door.
 */
export default function MerchantOfficeSection() {
  return (
    <section id="office" className="relative overflow-hidden bg-[#0a0a0a] py-24 text-white sm:py-28">
      <div className="glow-blob left-1/4 top-0 h-80 w-80 bg-[#3b59f3]/25" />
      <div className="glow-blob right-0 bottom-1/3 h-72 w-72 bg-[#ee6a45]/15" />
      <div className="absolute inset-0 bg-dot-grid-dark [mask-image:radial-gradient(ellipse_80%_50%_at_50%_30%,black,transparent)]" />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
          <MerchantReveal>
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#8fa2ff]">
              Suliko Office
            </p>
            <h2 className="mt-3 text-balance text-[clamp(1.7rem,3.4vw,2.6rem)] font-medium tracking-[-0.02em]">
              Run your translation bureau from one screen
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/70">
              Orders, translators, notaries, payments and clients in one system. Built and used
              daily by a working bureau — the document you just translated in Suliko lands here as
              a tracked order automatically.
            </p>
            <Link
              href="/office"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[14.5px] font-semibold text-[#0a0a0a] transition hover:bg-white/90"
            >
              Explore Suliko Office <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-3 text-[12.5px] text-white/40">
              Its own page, with the full tour, live demo and sign-in.
            </p>
          </MerchantReveal>

          <MerchantReveal delay={120}>
            <MerchantOfficeMockPanel />
          </MerchantReveal>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((it, i) => (
            <MerchantReveal key={it.title} delay={i * 60}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.06]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#aebcff]">
                  <it.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-[1.02rem] font-semibold text-white">{it.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/60">{it.body}</p>
              </div>
            </MerchantReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
