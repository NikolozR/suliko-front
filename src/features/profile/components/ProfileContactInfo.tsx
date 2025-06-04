import { Card, CardContent, CardHeader, CardTitle } from "@/features/ui/components/ui/card";
import { Input } from "@/features/ui/components/ui/input";
import { Phone, Mail } from "lucide-react";
import { UpdateUserProfile, UserProfile } from "@/features/auth/types/types.User";
import { useTranslations } from "next-intl";
import { FieldErrors } from "react-hook-form";

interface ProfileContactInfoProps {
  userProfile: UserProfile;
  isEditing?: boolean;
  onChange?: (field: keyof UpdateUserProfile, value: string) => void;
  errors?: FieldErrors<{
    firstName: string;
    lastName: string;
    email: string;
    userName: string;
  }>;
}

export const ProfileContactInfo = ({ 
  userProfile, 
  isEditing, 
  onChange, 
  errors = {} 
}: ProfileContactInfoProps) => {
  const t = useTranslations("Profile");
  return (
    <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-2 pt-6 px-8">
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="p-2 bg-green-100 rounded-lg">
            <Mail className="h-5 w-5 text-green-600" />
          </div>
          {t("contactInformation")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-8 pb-8 pt-2">
        <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Phone className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {t("phoneNumber")}
            </label>
            <p className="text-lg font-medium text-foreground">
              {userProfile.phoneNUmber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Mail className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {t("email")}
            </label>
            {isEditing ? (
              <div className="space-y-1 mt-1">
                <Input
                  value={userProfile.email || ""}
                  onChange={e => onChange && onChange("email", e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  type="email"
                  className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
            ) : (
              <p className="text-lg font-medium text-foreground">
                {userProfile.email || (
                  <span className="text-muted-foreground italic">
                    {t("notSpecified")}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 