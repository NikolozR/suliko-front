import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { formatPriceFromString } from "@/shared/utils/domainUtils";

interface PricingCardProps {
  type: 'starter' | 'professional' | 'payAsYouGo' | 'custom' | 'business' | 'enterpriseBusiness';
  onSelect: () => void;
}

export function PricingCard({ type, onSelect }: PricingCardProps) {
  const t = useTranslations("Pricing");

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
          <span className="text-4xl font-bold text-card-foreground">
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

            {/* type === 'starter' ? 3 : 
                     type === 'professional' ? 3 : 
                     type === 'payAsYouGo' ? 2 : 3 
             */}

            {Array.from({
              length: type === 'payAsYouGo' ? 5 : 3
            }, (_, i) => (
              <li key={i} className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-muted-foreground">
                  {t(`${type}.features.${i}`)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-card rounded-lg shadow-lg p-8 border border-border flex flex-col h-full">
      {renderCardContent()}
      <div className="mt-auto pt-8">
        <button
          onClick={onSelect}
          className="w-full cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition duration-200"
        >
          {t(`${type}.cta`)}
        </button>
      </div>
    </div>
  );
}
