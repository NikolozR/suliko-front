"use client";



// MISHKA EDIT HEREEEEEEEEEEEEEE

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/features/ui";

export default function LandingPage() {
  const t = useTranslations("Landing");

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-3xl text-center py-10">
        <CardHeader>
          <div className="mx-auto mb-6">
            <Image src="/Suliko_logo_black.svg" alt="Suliko" width={120} height={120} />
          </div>
          <CardTitle className="text-3xl font-bold text-foreground">
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t("description")}
          </p>
          <Link href="/document">
            <Button size="lg" className="px-8">
              {t("cta")}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}


