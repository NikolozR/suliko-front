import { Card, CardContent, CardHeader, CardTitle } from "@/features/ui/components/ui/card";
import { Separator } from "@/features/ui/components/ui/separator";
import { Input } from "@/features/ui/components/ui/input";
import { Button } from "@/features/ui/components/ui/button";
import { User, Edit } from "lucide-react";
import { UpdateUserProfile, UserProfile } from "@/features/auth/types/types.User";
import { useTranslations } from "next-intl";
import { FieldErrors } from "react-hook-form";

export interface ProfilePersonalInfoProps {
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

export const ProfilePersonalInfo: React.FC<ProfilePersonalInfoProps> = ({ 
  userProfile, 
  isEditing, 
  onChange, 
  onEdit,
  onSave,
  onCancel,
  isUpdating,
  errors = {} 
}) => {
  const t = useTranslations("Profile");
  return (
    <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-2 pt-6 px-8">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            {t("personalInformation")}
          </CardTitle>
          {!isEditing && onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex items-center gap-2"
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
      <CardContent className="space-y-6 px-8 pb-8 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {t("name")}
            </label>
            {isEditing ? (
              <div className="space-y-1">
                <Input
                  value={userProfile.firstName || ""}
                  onChange={e => onChange && onChange("firstName", e.target.value)}
                  placeholder={t("namePlaceholder")}
                  className={errors.firstName ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName.message}</p>
                )}
              </div>
            ) : (
              <p className="text-lg font-medium text-foreground">
                {userProfile.firstName || (
                  <span className="text-muted-foreground italic">
                    {t("notSpecified")}
                  </span>
                )}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {t("surname")}
            </label>
            {isEditing ? (
              <div className="space-y-1">
                <Input
                  value={userProfile.lastName || ""}
                  onChange={e => onChange && onChange("lastName", e.target.value)}
                  placeholder={t("surnamePlaceholder")}
                  className={errors.lastName ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName.message}</p>
                )}
              </div>
            ) : (
              <p className="text-lg font-medium text-foreground">
                {userProfile.lastName || (
                  <span className="text-muted-foreground italic">
                    {t("notSpecified")}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {t("userName")}
          </label>
          <p className="text-lg font-medium text-foreground">
            @{userProfile.userName}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}; 