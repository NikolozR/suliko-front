import { Wrench } from "lucide-react";
import { useTranslations } from "next-intl";

// Shown on the sign-in page while the backend is down. Remove its use in
// sign-in/page.tsx once the API is back.
export default function MaintenanceBanner() {
  const t = useTranslations("Maintenance");
  return (
    <div
      role="alert"
      className="absolute inset-x-0 top-0 z-50 flex items-start justify-center gap-3 border-b border-amber-300 bg-amber-50 px-4 py-3 text-amber-950"
    >
      <Wrench className="mt-0.5 size-5 shrink-0" aria-hidden />
      <p className="text-sm">
        <strong className="font-semibold">{t("title")}.</strong> {t("body")}
      </p>
    </div>
  );
}
