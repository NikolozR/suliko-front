import { Upload, Type } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TextTranslationCard from "./TextTranslationCard";
import DocumentTranslationCard from "./DocumentTranslationCard";

const MainContent = () => {
  return (
    <div className="min-h-screen p-8 bg-suliko-main-content-bg-color">
      <div className="mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground">შენი თარჯიმანი</h1>
          <p className="text-muted-foreground mt-2">აირჩიე მეთოდი</p>
        </div>
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card">
            <TabsTrigger
              value="text"
              className="cursor-pointer flex items-center gap-2 data-[state=active]:!bg-suliko-default-color data-[state=active]:text-white"
            >
              <Type className="h-5 w-5" />
              ტექსტი
            </TabsTrigger>
            <TabsTrigger
              value="document"
              className="cursor-pointer flex items-center gap-2 data-[state=active]:!bg-suliko-default-color data-[state=active]:text-white"
            >
              <Upload className="h-5 w-5" />
              დოკუმენტი
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
