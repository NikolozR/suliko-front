import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, RefreshCw } from "lucide-react";

interface ProfileErrorProps {
  error: string;
  onRetry: () => void;
}

export const ProfileError = ({ error, onRetry }: ProfileErrorProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
      <Card className="max-w-md mx-auto border-0 shadow-2xl">
        <CardContent className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold mb-4">შეცდომა</h3>
          
          <Alert className="mb-6 text-left">
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          
          <Button
            onClick={onRetry}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            სცადე თავიდან
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}; 