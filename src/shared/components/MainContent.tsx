import { Upload, Type } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/features/ui/components/ui/tabs";
import TextTranslationCard from "@/features/translation/components/TextTranslationCard";
import DocumentTranslationCard from "@/features/translation/components/DocumentTranslationCard";
import { getTranslations } from "next-intl/server";

const MainContent = async () => {
  const t = await getTranslations('Index');


  return (
    <div className="min-h-screen p-8 bg-suliko-main-content-bg-color">
      <div className="mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">{t('description')}</p>
        </div>
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card">
            <TabsTrigger
              value="text"
              className="cursor-pointer flex items-center gap-2 data-[state=active]:!bg-suliko-default-color data-[state=active]:text-white"
            >
              <Type className="h-5 w-5" />
              {t('textTab')}
            </TabsTrigger>
            <TabsTrigger
              value="document"
              className="cursor-pointer flex items-center gap-2 data-[state=active]:!bg-suliko-default-color data-[state=active]:text-white"
            >
              <Upload className="h-5 w-5" />
              {t('documentTab')}
            </TabsTrigger>
          </TabsList>
          <TextTranslationCard />
          <DocumentTranslationCard />
        </Tabs>
      </div>
    </div>
  );
};

export default MainContent;
