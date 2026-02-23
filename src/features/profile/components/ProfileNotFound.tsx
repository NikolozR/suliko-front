import { Card, CardContent } from "@/features/ui/components/ui/card";
import { User } from "lucide-react";

export const ProfileNotFound = () => {
  return (
    <Card className="max-w-md mx-auto border border-border/60 shadow-sm rounded-2xl">
      <CardContent className="text-center py-12">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">პროფილი ვერ მოიძებნა</h3>
        <p className="text-muted-foreground">
          მომხმარებლის ინფორმაცია ვერ მოიძებნა
        </p>
      </CardContent>
    </Card>
  );
}; 