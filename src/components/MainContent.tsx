'use client'
import { FC, useState } from 'react';
import { Upload, Type } from "lucide-react";

const MainContent: FC = () => {
  const [activeTab, setActiveTab] = useState<'text' | 'document'>('text');

  return (
    <div className="min-h-screen p-8 bg-suliko-main-content-bg-color">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Welcome to Suliko</h1>
        
        <div className="">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('text')}
                className={`flex-1 px-6 py-4 text-center font-medium ${
                  activeTab === 'text'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center">
                  <Type className="w-5 h-5 mr-2" />
                  Text Input
                </div>
              </button>
              <button
                onClick={() => setActiveTab('document')}
                className={`flex-1 px-6 py-4 text-center font-medium ${
                  activeTab === 'document'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Document Upload
                </div>
              </button>
            </div>

            {/* Content */}
            <div className="p-8">
              {activeTab === 'text' ? (
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <Type className="mr-2" />
                    Enter Your Text
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Type or paste your text directly here
                  </p>
                  <textarea
                    className="w-full h-48 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your text here..."
                  />
                  <button className="mt-4 w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
                    <Type className="mr-2 h-5 w-5" />
                    Process Text
                  </button>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <Upload className="mr-2" />
                    Upload Document
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Upload your document to start working with Suliko. We support various document formats.
                  </p>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4 text-gray-600">
                      Drag and drop your file here, or click to select
                    </p>
                    <input type="file" className="hidden" />
                  </div>
                  <button className="mt-4 w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
                    <Upload className="mr-2 h-5 w-5" />
                    Upload Document
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Recent Documents</h2>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600">Your recently uploaded documents will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainContent; 