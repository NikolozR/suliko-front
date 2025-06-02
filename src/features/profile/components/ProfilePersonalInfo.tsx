import { Card, CardContent, CardHeader, CardTitle } from "@/features/ui/components/ui/card";
import { Separator } from "@/features/ui/components/ui/separator";
import { Input } from "@/features/ui/components/ui/input";
import { User } from "lucide-react";
import { UpdateUserProfile, UserProfile } from "@/features/auth/types/types.User";

export interface ProfilePersonalInfoProps {
  userProfile: UserProfile;
  isEditing?: boolean;
  onChange?: (field: keyof UpdateUserProfile, value: string) => void;
}

export const ProfilePersonalInfo: React.FC<ProfilePersonalInfoProps> = ({ userProfile, isEditing, onChange }) => {
  return (
    <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-2 pt-6 px-8">
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="p-2 bg-blue-100 rounded-lg">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          პერსონალური ინფორმაცია
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-8 pb-8 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              სახელი
            </label>
            {isEditing ? (
              <Input
                value={userProfile.firstName || ""}
                onChange={e => onChange && onChange("firstName", e.target.value)}
                placeholder="შეიყვანეთ სახელი"
              />
            ) : (
              <p className="text-lg font-medium text-foreground">
                {userProfile.firstName || (
                  <span className="text-muted-foreground italic">
                    არ არის მითითებული
                  </span>
                )}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              გვარი
            </label>
            {isEditing ? (
              <Input
                value={userProfile.lastName || ""}
                onChange={e => onChange && onChange("lastName", e.target.value)}
                placeholder="შეიყვანეთ გვარი"
              />
            ) : (
              <p className="text-lg font-medium text-foreground">
                {userProfile.lastName || (
                  <span className="text-muted-foreground italic">
                    არ არის მითითებული
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            მომხმარებლის სახელი
          </label>
          {isEditing ? (
            <Input
              value={userProfile.userName || ""}
              onChange={e => onChange && onChange("userName", e.target.value)}
              placeholder="შეიყვანეთ მომხმარებლის სახელი"
            />
          ) : (
            <p className="text-lg font-medium text-foreground">
              @{userProfile.userName}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 