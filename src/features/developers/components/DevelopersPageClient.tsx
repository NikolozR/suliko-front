"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/features/ui/components/ui/card";
import { Code, Zap, Globe, Mail, CheckCircle2, BookOpen, Terminal, Lock } from "lucide-react";
import { Button } from "@/features/ui/components/ui/button";
import { Link } from "@/i18n/navigation";

// Languages list - sorted by ID for better readability
const languagesList = [
  { id: 1, name: "Georgian Language", nameGeo: "ქართული" },
  { id: 2, name: "English Language", nameGeo: "ინგლისური" },
  { id: 3, name: "Greek Language", nameGeo: "ბერძნული" },
  { id: 4, name: "Latvian Language", nameGeo: "ლატვიური" },
  { id: 5, name: "Slovenian Language", nameGeo: "სლოვენიური" },
  { id: 6, name: "Azerbaijani Language", nameGeo: "აზერბაიჯანული" },
  { id: 7, name: "Turkish Language", nameGeo: "თურქული" },
  { id: 8, name: "German Language", nameGeo: "გერმანული" },
  { id: 9, name: "Armenian Language", nameGeo: "სომხური" },
  { id: 11, name: "Slovak Language", nameGeo: "სლოვაკური" },
  { id: 12, name: "French Language", nameGeo: "ფრანგული" },
  { id: 13, name: "Italian Language", nameGeo: "იტალიური" },
  { id: 15, name: "Latin", nameGeo: "ლათინური" },
  { id: 16, name: "Russian Language", nameGeo: "რუსული" },
  { id: 17, name: "Japanese", nameGeo: "იაპონური" },
  { id: 18, name: "Chinese", nameGeo: "ჩინური" },
  { id: 19, name: "Serbian language", nameGeo: "სერბული" },
  { id: 20, name: "Urdu Language", nameGeo: "ურდუ" },
  { id: 21, name: "Spanish Language", nameGeo: "ესპანური" },
  { id: 22, name: "Hebrew Language", nameGeo: "ივრითი" },
  { id: 23, name: "Portuguese Language", nameGeo: "პორტუგალიური" },
  { id: 24, name: "Finish Language", nameGeo: "ფინური" },
  { id: 31, name: "Ukrainian Language", nameGeo: "უკრაინული" },
  { id: 32, name: "Polish Language", nameGeo: "პოლონური ენა" },
  { id: 33, name: "Arabic Language", nameGeo: "არაბული ენა" },
].sort((a, b) => a.id - b.id);

export default function DevelopersPageClient() {
  const t = useTranslations("Developers");

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Hero Section */}
      <div className="text-center mb-12 pt-20 sm:pt-24">
        <div className="flex justify-center mb-4">
          <Code className="h-12 w-12 text-suliko-default-color" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
          {t("hero.title")}
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          {t("hero.subtitle")}
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader>
            <Zap className="h-8 w-8 text-suliko-default-color mb-2" />
            <CardTitle>{t("features.speed.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{t("features.speed.description")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Globe className="h-8 w-8 text-suliko-default-color mb-2" />
            <CardTitle>{t("features.languages.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{t("features.languages.description")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Lock className="h-8 w-8 text-suliko-default-color mb-2" />
            <CardTitle>{t("features.security.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{t("features.security.description")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Start Section */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-suliko-default-color" />
            {t("quickStart.title")}
          </CardTitle>
          <CardDescription>{t("quickStart.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              {t("quickStart.step1.title")}
            </h3>
            <p className="text-muted-foreground mb-4">{t("quickStart.step1.description")}</p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              {t("quickStart.step2.title")}
            </h3>
            <p className="text-muted-foreground mb-4">{t("quickStart.step2.description")}</p>
            <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-green-400">
                <code>{t("quickStart.step2.endpoint")}</code>
              </pre>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              {t("quickStart.step3.title")}
            </h3>
            <p className="text-muted-foreground">{t("quickStart.step3.description")}</p>
          </div>
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-suliko-default-color" />
            {t("api.title")}
          </CardTitle>
          <CardDescription>{t("api.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Endpoint */}
          <div>
            <h3 className="font-semibold text-lg mb-2">{t("api.endpoint.title")}</h3>
            <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 overflow-x-auto mb-4">
              <pre className="text-sm text-green-400">
                <code>{t("api.endpoint.url")}</code>
              </pre>
            </div>
            <p className="text-sm text-muted-foreground">{t("api.endpoint.method")}</p>
          </div>

          {/* Request Body */}
          <div>
            <h3 className="font-semibold text-lg mb-3">{t("api.request.title")}</h3>
            <p className="text-muted-foreground mb-4">{t("api.request.description")}</p>
            <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-gray-300">
                <code>{`{
  "description": "Text to translate",
  "languageId": 2,
  "uniqueKey": "your-unique-key-here"
}`}</code>
              </pre>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex gap-2">
                <span className="font-mono text-sm font-semibold text-suliko-default-color">description:</span>
                <span className="text-sm text-muted-foreground">{t("api.request.fields.description")}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-mono text-sm font-semibold text-suliko-default-color">languageId:</span>
                <span className="text-sm text-muted-foreground">{t("api.request.fields.languageId")}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-mono text-sm font-semibold text-suliko-default-color">uniqueKey:</span>
                <span className="text-sm text-muted-foreground">{t("api.request.fields.uniqueKey")}</span>
              </div>
            </div>
          </div>

          {/* Response */}
          <div>
            <h3 className="font-semibold text-lg mb-3">{t("api.response.title")}</h3>
            <p className="text-muted-foreground mb-4">{t("api.response.description")}</p>
            <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-gray-300">
                <code>{`{
  "translatedText": "Translated text here",
  "status": "success"
}`}</code>
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhance Translate API */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-suliko-default-color" />
            {t("enhanceApi.title")}
          </CardTitle>
          <CardDescription>{t("enhanceApi.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Endpoint */}
          <div>
            <h3 className="font-semibold text-lg mb-2">{t("enhanceApi.endpoint.title")}</h3>
            <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 overflow-x-auto mb-4">
              <pre className="text-sm text-green-400">
                <code>{t("enhanceApi.endpoint.url")}</code>
              </pre>
            </div>
            <p className="text-sm text-muted-foreground">{t("enhanceApi.endpoint.method")}</p>
          </div>

          {/* Request Body */}
          <div>
            <h3 className="font-semibold text-lg mb-3">{t("enhanceApi.request.title")}</h3>
            <p className="text-muted-foreground mb-4">{t("enhanceApi.request.description")}</p>
            <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-gray-300">
                <code>{`{
  "userInput": "Original text to enhance",
  "translateOutput": "Translated text to enhance",
  "targetLanguageId": 2,
  "uniqueKey": "your-unique-key-here"
}`}</code>
              </pre>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex gap-2">
                <span className="font-mono text-sm font-semibold text-suliko-default-color">userInput:</span>
                <span className="text-sm text-muted-foreground">{t("enhanceApi.request.fields.userInput")}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-mono text-sm font-semibold text-suliko-default-color">translateOutput:</span>
                <span className="text-sm text-muted-foreground">{t("enhanceApi.request.fields.translateOutput")}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-mono text-sm font-semibold text-suliko-default-color">targetLanguageId:</span>
                <span className="text-sm text-muted-foreground">{t("enhanceApi.request.fields.targetLanguageId")}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-mono text-sm font-semibold text-suliko-default-color">uniqueKey:</span>
                <span className="text-sm text-muted-foreground">{t("enhanceApi.request.fields.uniqueKey")}</span>
              </div>
            </div>
          </div>

          {/* Response */}
          <div>
            <h3 className="font-semibold text-lg mb-3">{t("enhanceApi.response.title")}</h3>
            <p className="text-muted-foreground mb-4">{t("enhanceApi.response.description")}</p>
            <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-gray-300">
                <code>{`{
  "enhancedText": "Enhanced and improved translated text",
  "status": "success"
}`}</code>
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-6 w-6 text-suliko-default-color" />
            {t("examples.title")}
          </CardTitle>
          <CardDescription>{t("examples.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* JavaScript/TypeScript Example */}
          <div>
            <h3 className="font-semibold mb-3">JavaScript / TypeScript</h3>
            <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-gray-300">
                <code>{`async function translateText(text, languageId, uniqueKey) {
  const response = await fetch('${t("api.endpoint.url")}', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: text,
      languageId: languageId,
      uniqueKey: uniqueKey
    })
  });
  
  const result = await response.json();
  return result.translatedText;
}`}</code>
              </pre>
            </div>
          </div>

          {/* Python Example */}
          <div>
            <h3 className="font-semibold mb-3">Python</h3>
            <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-gray-300">
                <code>{`import requests

def translate_text(text, language_id, unique_key):
    url = "${t("api.endpoint.url")}"
    payload = {
        "description": text,
        "languageId": language_id,
        "uniqueKey": unique_key
    }
    
    response = requests.post(url, json=payload)
    result = response.json()
    return result["translatedText"]`}</code>
              </pre>
            </div>
          </div>

          {/* cURL Example */}
          <div>
            <h3 className="font-semibold mb-3">cURL</h3>
            <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-gray-300">
                <code>{`curl -X POST "${t("api.endpoint.url")}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "description": "Text to translate",
    "languageId": 2,
    "uniqueKey": "your-unique-key-here"
  }'`}</code>
              </pre>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200 dark:border-slate-700 my-8"></div>

          {/* Enhance Translate Examples */}
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4 text-foreground">{t("enhanceApi.examples.title")}</h2>
            <p className="text-muted-foreground mb-6">{t("enhanceApi.examples.description")}</p>

            {/* JavaScript/TypeScript Example */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">JavaScript / TypeScript</h3>
              <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-300">
                  <code>{`async function enhanceTranslation(userInput, translateOutput, targetLanguageId, uniqueKey) {
  const response = await fetch('${t("enhanceApi.endpoint.url")}', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userInput: userInput,
      translateOutput: translateOutput,
      targetLanguageId: targetLanguageId,
      uniqueKey: uniqueKey
    })
  });
  
  const result = await response.json();
  return result.enhancedText;
}`}</code>
                </pre>
              </div>
            </div>

            {/* Python Example */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Python</h3>
              <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-300">
                  <code>{`import requests

def enhance_translation(user_input, translate_output, target_language_id, unique_key):
    url = "${t("enhanceApi.endpoint.url")}"
    payload = {
        "userInput": user_input,
        "translateOutput": translate_output,
        "targetLanguageId": target_language_id,
        "uniqueKey": unique_key
    }
    
    response = requests.post(url, json=payload)
    result = response.json()
    return result["enhancedText"]`}</code>
                </pre>
              </div>
            </div>

            {/* cURL Example */}
            <div>
              <h3 className="font-semibold mb-3">cURL</h3>
              <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-300">
                  <code>{`curl -X POST "${t("enhanceApi.endpoint.url")}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "userInput": "Original text",
    "translateOutput": "Translated text",
    "targetLanguageId": 2,
    "uniqueKey": "your-unique-key-here"
  }'`}</code>
                </pre>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Getting Languages */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-suliko-default-color" />
            {t("languages.title")}
          </CardTitle>
          <CardDescription>{t("languages.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{t("languages.info")}</p>
          <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 overflow-x-auto mb-4">
            <pre className="text-sm text-green-400">
              <code>{t("languages.endpoint")}</code>
            </pre>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{t("languages.response")}</p>
          
          {/* Languages Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">{t("languages.table.id")}</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">{t("languages.table.english")}</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">{t("languages.table.georgian")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {languagesList.map((lang) => (
                    <tr key={lang.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono font-semibold text-suliko-default-color">{lang.id}</td>
                      <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">{lang.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">{lang.nameGeo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* JSON Response Example */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground mb-2">
              {t("languages.showJson")}
            </summary>
            <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 overflow-x-auto mt-2">
              <pre className="text-sm text-gray-300">
                <code>{JSON.stringify(languagesList.slice(0, 2), null, 2)}</code>
              </pre>
            </div>
          </details>
        </CardContent>
      </Card>

      {/* Get Started CTA */}
      <Card className="bg-gradient-to-r from-suliko-default-color to-suliko-default-hover-color text-white">
        <CardContent className="pt-6">
          <div className="text-center">
            <Mail className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">{t("cta.title")}</h2>
            <p className="mb-6 text-white/90">{t("cta.description")}</p>
            <Button 
              asChild 
              variant="outline" 
              className="bg-white text-suliko-default-color hover:bg-gray-100"
            >
              <a href="mailto:info@suliko.ge?subject=API Key Request - B2B Translation">
                {t("cta.button")}
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

