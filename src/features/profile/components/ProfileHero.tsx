import { Button } from "@/features/ui/components/ui/button";
import { Avatar, AvatarFallback } from "@/features/ui/components/ui/avatar";
import { Plus } from "lucide-react";
import { UserProfile } from "@/features/auth/types/types.User";
import { useUser } from "@/features/auth/hooks/useUser";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatBalance } from "@/shared/utils/domainUtils";

interface ProfileHeroProps {
  userProfile: UserProfile;
}

export const ProfileHero = ({ userProfile }: ProfileHeroProps) => {
  const { displayName, initials } = useUser();
  const t = useTranslations("Profile");

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-6 md:p-8 mb-8 shadow-sm space-y-6">
      {/* Row 1: Avatar, name, username */}
      <div className="flex items-center gap-6 md:gap-8">
        <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-2 border-primary/30 shrink-0">
          <AvatarFallback className="bg-primary/15 text-primary text-2xl sm:text-3xl font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground truncate">
            {displayName}
          </h1>
          <p className="text-muted-foreground font-medium">
            @{userProfile.userName}
          </p>
        </div>
      </div>

      {/* Row 2: Balance and Fill Balance */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-primary/10">
        <div className="flex items-center justify-between sm:flex-col sm:items-start gap-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50 sm:min-w-[180px]">
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            {t("currentBalance")}
          </span>
          <Link
            href="/price"
            className="text-lg font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 transition-colors"
          >
            {formatBalance(userProfile.balance || 0)} {t("pages")}
          </Link>
        </div>
        <Link href="/price" className="shrink-0">
          <Button
            size="sm"
            className="w-full sm:w-auto h-10 px-4 gap-2 font-medium bg-emerald-600 hover:bg-emerald-700 text-white border-0"
          >
            <Plus className="h-4 w-4" />
            {t("fillBalance")}
          </Button>
        </Link>
      </div>
    </div>
  );
};
