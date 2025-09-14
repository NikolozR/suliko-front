import { useTranslations } from "next-intl";

interface PricingCardProps {
  type: 'starter' | 'professional' | 'custom' | 'business' | 'enterpriseBusiness';
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
            {t(`${type}.price`)}
          </span>
          <span className="text-muted-foreground">
            {t(`${type}.period`)}
          </span>
        </div>
        <div className="text-left">
          <p className="text-card-foreground">
            {t(`${type}.documents`)}
          </p>
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
          {t("select")}
        </button>
      </div>
    </div>
  );
}
