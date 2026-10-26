import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { formatPriceFromString } from "@/shared/utils/domainUtils";
import { cn } from "@/shared/lib/utils";

interface PricingCardProps {
  type: 'starter' | 'professional' | 'payAsYouGo' | 'custom' | 'business' | 'enterpriseBusiness';
  onSelect: () => void;
  /** The one plan the page recommends: a border in the brand colour, a badge and the filled button. */
  highlighted?: boolean;
  /** What the package saves, in GEL, against buying the same pages one by one. */
  savingsGel?: number;
}

export function PricingCard({ type, onSelect, highlighted = false, savingsGel }: PricingCardProps) {
  const t = useTranslations("Pricing");

  // Only what differs between the plans. The file formats and the 50+ languages are the
  // same in all of them, so they are said once under the cards, not in each.
  const differences = (): string[] => {
    const lines: string[] = [];
    if (type === 'starter') lines.push(t("landing.starterPerPage"));
    if (type === 'professional') lines.push(t("landing.professionalPerPage"));
    if (savingsGel && savingsGel > 0) {
      lines.push(
        t("landing.savesVsPayAsYouGo", {
          amount: savingsGel,
          plan: t("payAsYouGo.title"),
        })
      );
    }
    if (type === 'professional') {
      lines.push(t("professional.features.3"), t("professional.features.4"));
    }
    if (type === 'payAsYouGo') {
      lines.push(t("payAsYouGo.features.0"), t("payAsYouGo.features.1"));
    }
    return lines;
  };

  const renderCardContent = () => {
    if (type === 'custom') {
      return (
        <div>
          <h3 className="text-2xl font-semibold mb-4 text-card-foreground text-center">
            {t(`${type}.title`)}
          </h3>
          <p className="text-muted-foreground text-center">
            {t(`${type}.description`)}
          </p>
        </div>
      );
    }

    return (
      <div>
        <h3 className="text-2xl font-semibold mb-4 text-card-foreground text-center">
          {t(`${type}.title`)}
        </h3>
        <div className="mb-6 text-center">
          <span className="text-4xl font-semibold text-card-foreground">
            {formatPriceFromString(t(`${type}.price`))}
          </span>
          <span className="text-muted-foreground">
            {t(`${type}.period`)}
          </span>
        </div>
        <div className="text-center mb-6">
          <p className="text-card-foreground">
            {t(`${type}.documents`)}
          </p>
        </div>
        <div className="text-left">
          <p className="text-muted-foreground mb-4">
            {t(`${type}.description`)}
          </p>
          <ul className="space-y-2">
            {differences().map((line) => (
              <li key={line} className="flex items-start text-sm">
                <Check className="mt-0.5 h-4 w-4 text-green-500 mr-2 shrink-0" />
                <span className="text-muted-foreground">{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "relative bg-card rounded-2xl p-8 flex flex-col h-full transition-[border-color] duration-200",
        highlighted
          ? "border-2 border-suliko-default-color"
          : "border border-border/60 hover:border-primary/30"
      )}
    >
      {highlighted && (
        <span className="suliko-default-bg absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold text-white whitespace-nowrap">
          {t("mostPopular")}
        </span>
      )}
      {renderCardContent()}
      <div className="mt-auto pt-8">
        <button
          onClick={onSelect}
          className={cn(
            "w-full cursor-pointer font-semibold py-3 px-6 rounded-xl transition duration-200",
            highlighted
              ? "suliko-default-bg text-white hover:opacity-90"
              : "border border-border bg-transparent text-foreground hover:bg-muted"
          )}
        >
          {t(`${type}.cta`)}
        </button>
      </div>
    </div>
  );
}
