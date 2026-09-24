import { useTranslations } from "next-intl";
import { History, Layers, Smartphone } from "lucide-react";
import { revealDelay } from "./sections";
import { CONTAINER } from "./tones";

export default function OfficeSecurity() {
  const t = useTranslations("SulikoOffice.sec");

  const items = [
    { icon: Layers, title: t("i1t"), body: t("i1d") },
    { icon: Smartphone, title: t("i2t"), body: t("i2d") },
    { icon: History, title: t("i3t"), body: t("i3d") },
  ];

  return (
    <section className="bg-[#11289c] text-white">
      <div className={`${CONTAINER} flex flex-col gap-11 py-20 lg:py-[88px]`}>
        <div data-reveal className="flex max-w-[760px] flex-col gap-3.5">
          <p className="text-[15px] tracking-[0.3px] text-[#c9d2ff]">{t("kicker")}</p>
          <h2 className="text-3xl leading-[1.18] font-bold text-white lg:text-[38px]">{t("title")}</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map(({ icon: Icon, title, body }, i) => (
            <div key={title} data-reveal style={revealDelay(i * 90)} className="flex flex-col gap-3.5 rounded-2xl border border-white/15 bg-white/[0.07] p-7">
              <Icon className="h-7 w-7" aria-hidden />
              <h3 className="text-xl leading-[1.3] text-white">{title}</h3>
              <p className="text-base leading-[1.55] text-[#d6ddff]">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
