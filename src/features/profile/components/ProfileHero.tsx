import { Button } from "@/features/ui/components/ui/button";
import { Badge } from "@/features/ui/components/ui/badge";
import { Avatar, AvatarFallback } from "@/features/ui/components/ui/avatar";
import { LogOut } from "lucide-react";
import { UserProfile } from "@/features/auth/types/types.User";
import { useUser } from "@/features/auth/hooks/useUser";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/shared/components/LanguageSwitcher";

interface ProfileHeroProps {
  userProfile: UserProfile;
  onLogout: () => void;
  isEditing?: boolean;
}

export const ProfileHero = ({ userProfile, onLogout, isEditing }: ProfileHeroProps) => {
  const { displayName, initials } = useUser();
  const t = useTranslations("Profile");

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 mb-8 shadow-2xl">
      <div className="absolute inset-0 bg-black/10"></div>

      <div className="absolute top-4 right-4 flex gap-2 z-20">
        {/* Language Selector */}
        <div className="bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
          <LanguageSwitcher />
        </div>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={onLogout}
          className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t("logout")}
        </Button>
      </div>

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-white/30 backdrop-blur-sm">
              <AvatarFallback className="bg-white/20 text-white text-4xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="text-center lg:text-left text-white flex-1 space-y-2">
            <div>
              <Badge variant="secondary" className="bg-white/20 text-white mb-1 pointer-events-none select-none">
                {t("fullName")}
              </Badge>
              <h1 className="text-4xl font-bold mb-2">
                {displayName}
              </h1>
            </div>
            <div>
              <Badge variant="secondary" className="bg-white/20 text-white mb-1 pointer-events-none select-none">
                {t("userName")}
              </Badge>
              <p className="text-xl text-white/80 mb-4">
                @{userProfile.userName}
              </p>
            </div>
            <div>
              <Badge variant="secondary" className="bg-white/20 text-white mb-1 pointer-events-none select-none">
                {t("currentBalance")}
              </Badge>
              <Link href="/price" className="block hover:opacity-80 transition-opacity cursor-pointer">
                <p className="text-xl text-white/80">
                  {Math.floor(userProfile.balance || 0)} {t("pages")}
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
    </div>
  );
};
