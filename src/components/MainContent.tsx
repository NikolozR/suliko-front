'use client'
import { FC } from 'react';
import { Upload, Type } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const MainContent: FC = () => {
  return (
    <div className="min-h-screen p-8 bg-suliko-main-content-bg-color">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">თარჯიმანი</h1>
          <p className="text-gray-600 mt-2">აირჩიე მეთოდი</p>
        </div>
        
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white">
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

          <TabsContent value="text">
            <Card className="border-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Type className="h-5 w-5" />
                  შეიყვანე ტექსტი
                </CardTitle>
                <CardDescription className="text-gray-600">
                  რამე ტექსტი თარგმნის აღწერისთვის
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea 
                  className="min-h-[150px] mb-4 border-2 focus:border-suliko-default-color focus:ring-suliko-default-color" 
                  placeholder="რამე საცაცილო ტექსტი..."
                />
                <Button 
                  className="w-full suliko-default-bg hover:opacity-90 transition-opacity" 
                  size="lg"
                >
                  {/* <Type className="mr-2 h-5 w-5" /> */}
                  თარგმნე
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="document">
            <Card className="border-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Upload className="h-5 w-5" />
                  ატვირთე დოკუმენტი
                </CardTitle>
                <CardDescription className="text-gray-600">
                  რამე ტექსტი დოკუმენტების ატვირთვის აღწერისთვის (ფოტო, პდფ და ეგენი რო შეილება)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-suliko-default-color transition-colors cursor-pointer">
                  <div className="cursor-pointer">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4 text-sm text-gray-600">
                      Drag and drop your file here, or click to select
                    </p>
                    <Input 
                      type="file" 
                      className="hidden" 
                      id="file-upload"
                    />
                  </div>
                </div>
                <Button 
                  className="w-full mt-4 suliko-default-bg hover:opacity-90 transition-opacity" 
                  size="lg"
                >
                  {/* <Upload className="mr-2 h-5 w-5" /> */}
                  თარგმნე
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-12 border-none">
          <CardHeader>
            <CardTitle className="text-gray-900">Recent Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Your recently uploaded documents will appear here
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MainContent; 