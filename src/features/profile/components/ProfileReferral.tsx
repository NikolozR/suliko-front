"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/ui/components/ui/card";
import { Button } from "@/features/ui/components/ui/button";
import { Input } from "@/features/ui/components/ui/input";
import { Gift, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

interface ProfileReferralProps {
  referralCode: string;
}

export const ProfileReferral: React.FC<ProfileReferralProps> = ({ referralCode }) => {
  const t = useTranslations("Profile");
  const locale = useLocale();
  const [shareableLink, setShareableLink] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    setShareableLink(`${window.location.origin}/${locale}/sign-in?ref=${referralCode}`);
  }, [locale, referralCode]);

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(referralCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareableLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-suliko-default-color" />
          {t("referral")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{t("referralDescription")}</p>
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <code className="flex-1 font-mono text-lg font-bold tracking-widest">
            {referralCode}
          </code>
          <Button variant="outline" size="sm" onClick={handleCopyCode} className="shrink-0">
            <Copy className="h-4 w-4 mr-1" />
            {codeCopied ? t("copied") : t("copyCode")}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Input value={shareableLink} readOnly className="font-mono text-xs" />
          <Button variant="outline" size="sm" onClick={handleCopyLink} className="shrink-0">
            <Copy className="h-4 w-4 mr-1" />
            {linkCopied ? t("copied") : t("copyLink")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
