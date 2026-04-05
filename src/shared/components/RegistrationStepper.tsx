import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

interface RegistrationStepperProps {
  currentStep: 1 | 2 | 3;
}

const STEP_COUNT = 3;

const RegistrationStepper = ({ currentStep }: RegistrationStepperProps) => {
  const t = useTranslations("Authorization");

  const labels = [
    t("stepperVerify"),
    t("stepperInfo"),
    t("stepperPassword"),
  ];

  return (
    <div className="flex items-center w-full mb-6">
      {Array.from({ length: STEP_COUNT }, (_, i) => {
        const step = (i + 1) as 1 | 2 | 3;
        const isDone = currentStep > step;
        const isActive = currentStep === step;

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 ${
                  isDone
                    ? "bg-suliko-default-color text-white"
                    : isActive
                    ? "bg-suliko-default-color text-white ring-4 ring-suliko-default-color/20"
                    : "bg-muted text-muted-foreground border-2 border-border"
                }`}
              >
                {isDone ? <Check size={14} strokeWidth={3} /> : step}
              </div>
              <span
                className={`text-[10px] font-medium whitespace-nowrap ${
                  isActive
                    ? "text-suliko-default-color"
                    : isDone
                    ? "text-suliko-default-color"
                    : "text-muted-foreground"
                }`}
              >
                {labels[i]}
              </span>
            </div>
            {step < STEP_COUNT && (
              <div
                className={`flex-1 h-px mx-2 mb-4 transition-all duration-200 ${
                  isDone ? "bg-suliko-default-color" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RegistrationStepper;
