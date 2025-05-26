import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";

export const ProfileNotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
      <Card className="max-w-md mx-auto border-0 shadow-2xl">
        <CardContent className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">პროფილი ვერ მოიძებნა</h3>
          <p className="text-gray-600">
            მომხმარებლის ინფორმაცია ვერ მოიძებნა
          </p>
        </CardContent>
      </Card>
    </div>
  );
}; 