import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Phone, Mail } from "lucide-react";
import { UserProfile } from "@/types/types.User";

interface ProfileContactInfoProps {
  userProfile: UserProfile;
  isEditing?: boolean;
  onChange?: (field: keyof UserProfile, value: string) => void;
}

export const ProfileContactInfo = ({ userProfile, isEditing, onChange }: ProfileContactInfoProps) => {
  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-2 pt-6 px-8">
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="p-2 bg-green-100 rounded-lg">
            <Mail className="h-5 w-5 text-green-600" />
          </div>
          საკონტაქტო ინფორმაცია
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-8 pb-8 pt-2">
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Phone className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              ტელეფონის ნომერი
            </label>
            <p className="text-lg font-medium text-gray-900">
              {userProfile.phoneNUmber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Mail className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              ელექტრონული ფოსტა
            </label>
            {isEditing ? (
              <Input
                value={userProfile.email || ""}
                onChange={e => onChange && onChange("email", e.target.value)}
                placeholder="შეიყვანეთ ელ. ფოსტა"
                type="email"
              />
            ) : (
              <p className="text-lg font-medium text-gray-900">
                {userProfile.email || (
                  <span className="text-gray-400 italic">
                    არ არის მითითებული
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