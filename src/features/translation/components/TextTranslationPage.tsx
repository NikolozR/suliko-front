"use client";
import { Upload, Type } from "lucide-react";
import { useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { PageHeader } from "@office/shared/components/page-header";
import { usePathname, Link } from "@/i18n/navigation";
import TextTranslationCard from "./TextTranslationCard";
import { useUserStore } from "@/features/auth/store/userStore";

const TextTranslationPage = () => {
  const t = useTranslations('MainContent');
  const pathname = usePathname();
  const { userProfile } = useUserStore();



  return (
    <div className="min-h-screen px-4 py-6 md:px-6 bg-suliko-main-content-bg-color">
      <div className="mx-auto">
        {/* The same header as every other screen (Office's PageHeader). Was a 13-language slot-machine carousel inside a fixed 2rem box,
              which clipped its own glyphs — the container was shorter than the
              line it held, and got worse once the type scale was corrected.
              A greeting in the locale the user actually chose says the same
              thing without cycling through languages they did not pick. */}
        <PageHeader
          icon={Languages}
          hue="blue"
          title={userProfile?.firstName ? t('greeting', { name: userProfile.firstName }) : t('greetingAnonymous')}
          description={t('description')}
        />

        {/* Navigation Tabs */}
        <div className="w-full mb-6">
          <div className="bg-muted text-muted-foreground inline-flex h-[50px] w-full items-center justify-center rounded-lg p-0.75">
            <div className="grid h-full w-full grid-cols-2 gap-0">
              <Link
                href="/text"
                className={`cursor-pointer flex items-center gap-2 h-full flex-1 justify-center rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] border ${pathname.split('/')[pathname.split('/').length - 1] === 'text'
                    ? 'bg-suliko-default-color! text-white shadow-sm border-suliko-default-color z-10'
                    : 'text-foreground hover:bg-background/50 border-transparent'
                  }`}
              >
                <Type className="h-5 w-5" />
                {t('textTab')}
              </Link>
              <Link
                href="/document"
                className={`cursor-pointer flex items-center gap-2 h-full flex-1 justify-center rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] border ${pathname.split('/')[pathname.split('/').length - 1] === 'document'
                    ? 'bg-suliko-default-color! text-white shadow-sm border-suliko-default-color z-10'
                    : 'text-foreground hover:bg-background/50 border-transparent'
                  }`}
              >
                <Upload className="h-5 w-5" />
                {t('documentTab')}
              </Link>
            </div>
          </div>
        </div>

        <TextTranslationCard />
      </div>
    </div>
  );
};

export default TextTranslationPage; 