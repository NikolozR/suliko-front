import { Card, CardContent } from "@/features/ui/components/ui/card";
import { Button } from "@/features/ui/components/ui/button";
import { Shield, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";

interface ProfileErrorProps {
  error: string;
  onRetry: () => void;
}

export const ProfileError = ({ error, onRetry }: ProfileErrorProps) => {
  const t = useTranslations('ErrorAlert');
  
  // Log actual error message to console for debugging
  if (error) {
    console.error('Profile error detected:', error);
  }
  
  return (
    <Card className="max-w-md mx-auto border-0 shadow-2xl">
      <CardContent className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold mb-4">{t('ups')}</h3>
        
        <Button
          onClick={onRetry}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('retry') || "სცადე თავიდან"}
        </Button>
      </CardContent>
    </Card>
  );
}; 