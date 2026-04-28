"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "@/i18n/navigation";
import { CheckCircle, MessageCircle, ArrowLeft } from "lucide-react";

export default function NotaryThankYouPage() {
  const router = useRouter();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    toast.success("Files uploaded successfully!");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-md w-full text-center space-y-8">

        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Thank you for uploading a document
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            we will get back to you via email soon.
          </p>
        </div>

        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium px-6 py-3 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to the page
        </button>

        <p className="text-sm text-gray-500 dark:text-slate-400">
          In case of any questions{" "}
          <a
            href="https://wa.me/995591729911"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            contact us via WhatsApp
          </a>
        </p>

      </div>
    </div>
  );
}
