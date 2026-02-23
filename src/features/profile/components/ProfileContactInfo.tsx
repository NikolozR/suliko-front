import { Card, CardContent, CardHeader, CardTitle } from "@/features/ui/components/ui/card";
import { Input } from "@/features/ui/components/ui/input";
import { Button } from "@/features/ui/components/ui/button";
import { Phone, Mail, Edit } from "lucide-react";
import { UpdateUserProfile, UserProfile } from "@/features/auth/types/types.User";
import { useTranslations } from "next-intl";
import { FieldErrors } from "react-hook-form";

interface ProfileContactInfoProps {
  userProfile: UserProfile;
  isEditing?: boolean;
  onChange?: (field: keyof UpdateUserProfile, value: string) => void;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  isUpdating?: boolean;
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
  onEdit,
  onSave,
  onCancel,
  isUpdating,
  errors = {} 
}: ProfileContactInfoProps) => {
  const t = useTranslations("Profile");
  const needsEmailReminder = Boolean(
    userProfile?.email && userProfile.email.toLowerCase().includes("example.com")
  );
  
  return (
    <Card className="border border-border/60 bg-card shadow-sm rounded-2xl">
      <CardHeader className="pb-2 pt-6 px-6 md:px-8">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <div className="p-1.5 rounded-lg bg-muted">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            {t("contactInformation")}
          </CardTitle>
          {!isEditing && onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className={`flex items-center gap-2 ${needsEmailReminder ? "animate-flicker" : ""}`}
            >
              <Edit className="h-4 w-4" />
              {t("edit")}
            </Button>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={isUpdating}
              >
                {t("cancel")}
              </Button>
              <Button
                size="sm"
                onClick={onSave}
                disabled={isUpdating}
              >
                {isUpdating ? t("saving") : t("save")}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 px-6 md:px-8 pb-8 pt-2">
        <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border/40">
          <div className="p-2 rounded-lg bg-muted">
            <Phone className="h-4 w-4 text-muted-foreground" />
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

        <div className={`flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border/40 ${needsEmailReminder ? "animate-flicker" : ""}`}>
          <div className="p-2 rounded-lg bg-muted">
            <Mail className="h-4 w-4 text-muted-foreground" />
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