"use client";
import { Avatar, AvatarFallback } from "@/features/ui/components/ui/avatar";
import type { UserProfile } from "@/features/auth/types/types.User";
import { useUser } from "@/features/auth/hooks/useUser";

/** Who is signed in. Balance lives under Billing; logout is in the sidebar. */
export const ProfileHero = ({ userProfile }: { userProfile: UserProfile }) => {
  const { displayName, initials } = useUser();

  return (
    <div className="mb-6 flex items-center gap-4">
      <Avatar className="h-16 w-16 shrink-0 border-2 border-primary/30">
        <AvatarFallback className="bg-primary/15 text-xl font-semibold text-primary">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">{displayName}</h1>
        <p className="truncate text-sm text-muted-foreground">
          @{userProfile.userName}
          {userProfile.email ? ` · ${userProfile.email}` : ""}
        </p>
      </div>
    </div>
  );
};
