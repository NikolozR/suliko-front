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
    <Card className="max-w-md mx-auto border border-border/60 shadow-sm rounded-2xl">
      <CardContent className="text-center py-12">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-950/40 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-semibold mb-4">{t('ups')}</h3>
        
        <Button
          onClick={onRetry}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('retry') || "სცადე თავიდან"}
        </Button>
      </CardContent>
    </Card>
  );
}; 