"use client";
import { Upload, Type } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, Link } from "@/i18n/navigation";
import DocumentTranslationCard from "./DocumentTranslationCard";
import { useUserStore } from "@/features/auth";

const DocumentTranslationPage = () => {
  const t = useTranslations('MainContent');
  const pathname = usePathname();
  const { userProfile } = useUserStore();

  const items = [
    'გამარჯობა',
    'Cześć',
    'Hello',
    'Bonjour',
    'Ciao',
    'Hallo',
    'Hola',
    "你好",
    'こんにちは',
    '안녕하세요',
    'مرحبا',
    'שלום',
    'नमस्ते',
  ]

  return (
    <div className="min-h-screen p-4 md:p-8 bg-suliko-main-content-bg-color">
      <div className="mx-auto">
        <div className="mb-8">
          {/* <h1 className="">{t('title')}</h1> */}
          <div className="text-2xl md:text-3xl font-semibold text-foreground slot-container flex gap-5">
            <div className="slot-track">
              {items.concat(items).map((item, i) => (
                <span key={i} className="slot-item">
                  {item}
                </span>
              ))}
            </div>
            <span className="absolute ml-48">{userProfile?.firstName}</span>
          </div>
          <p className="text-muted-foreground mt-2">{t('description')}</p>
        </div>

        <div className="w-full mb-6">
          <div className="bg-muted text-muted-foreground inline-flex h-9 w-full items-center justify-center rounded-lg p-[3px]">
            <div className="grid w-full grid-cols-2 gap-0">
              <Link
                href="/text"
                className={`cursor-pointer flex items-center gap-2 h-[calc(100%-1px)] flex-1 justify-center rounded-md px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] border ${pathname.split('/')[pathname.split('/').length - 1] === 'text'
                  ? '!bg-suliko-default-color text-white shadow-sm border-suliko-default-color z-10'
                  : 'text-foreground hover:bg-background/50 border-transparent'
                  }`}
              >
                <Type className="h-5 w-5" />
                {t('textTab')}
              </Link>
              <Link
                href="/document"
                className={`cursor-pointer flex items-center gap-2 h-[calc(100%-1px)] flex-1 justify-center rounded-md px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] border ${pathname.split('/')[pathname.split('/').length - 1] === 'document'
                  ? '!bg-suliko-default-color text-white shadow-sm border-suliko-default-color z-10'
                  : 'text-foreground hover:bg-background/50 border-transparent'
                  }`}
              >
                <Upload className="h-5 w-5" />
                {t('documentTab')}
              </Link>
            </div>
          </div>
        </div>

        <DocumentTranslationCard />
      </div>
    </div>
  );
};

export default DocumentTranslationPage; 