"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, X, Send, Check, FileText, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import emailjs from "@emailjs/browser";
import { useTranslations } from "next-intl";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 5;

interface Notification {
  type: "success" | "error";
  message: string;
}

export default function NotaryFileUploadForm() {
  const t = useTranslations("NotaryPage.calculator.uploadForm");

  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (newFiles: File[]) => {
    if (files.length + newFiles.length > MAX_FILES) {
      setNotification({ type: "error", message: t("tooManyFiles") });
      return false;
    }
    for (const file of newFiles) {
      if (file.size > MAX_FILE_SIZE) {
        setNotification({ type: "error", message: `${file.name}: ${t("fileTooLarge")}` });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;
    setIsSending(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("phone", phone);
      files.forEach((file) => formData.append("files", file));

      emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        {
          to_email: email,
          to_name: name,
          file_count: files.length,
          file_names: files.map((f) => f.name).join(", "),
        },
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      ).catch((err) => console.error("EmailJS confirmation error:", err));


      const res = await fetch("/api/notary-upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Unknown error");

      setNotification({ type: "success", message: t("success") });

      setFiles([]);
      setName("");
      setEmail("");
      setPhone("");
    } catch (error) {
      console.error("Submission error:", error);
      setNotification({ type: "error", message: t("error") });
    } finally {
      setIsSending(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (validateFiles(dropped)) setFiles((prev) => [...prev, ...dropped]);
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (validateFiles(selected)) setFiles((prev) => [...prev, ...selected]);
  };
  const removeFile = (index: number) => setFiles(files.filter((_, i) => i !== index));

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timer);
  }, [notification]);

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-4 md:px-6">
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Benefit badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {([t("benefit1"), t("benefit2"), t("benefit3")] as string[]).map((b) => (
            <div key={b} className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-blue-100 dark:border-slate-700 text-center shadow-sm">
              <Check className="w-5 h-5 mx-auto mb-2 text-blue-500" />
              <p className="text-xs sm:text-sm text-gray-700 dark:text-slate-300">{b}</p>
            </div>
          ))}
        </div>

        {/* Name */}
        <input
          type="text"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("name")}
          required
          className="w-full p-3 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 text-sm"
        />

        {/* Email */}
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("email")}
          required
          className="w-full p-3 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 text-sm"
        />

        {/* Phone */}
        <input
          type="tel"
          name="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t("phone")}
          className="w-full p-3 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 text-sm"
        />

        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 md:p-8 text-center transition-colors
            ${isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" : "border-gray-300 dark:border-slate-700"}`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInput}
            multiple
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
          />
          <Upload className="w-10 h-10 mx-auto mb-3 text-blue-500" />
          <p className="mb-2 text-sm text-gray-700 dark:text-slate-300">
            {t("dragDrop")}{" "}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-800 font-medium underline"
            >
              {t("browse")}
            </button>
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-500">{t("maxFiles")}</p>
        </div>

        {/* File list */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              {files.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700"
                >
                  <span className="flex items-center">
                    <FileText className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" />
                    <span className="truncate max-w-xs text-sm text-gray-700 dark:text-slate-300">{file.name}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <button
          type="submit"
          disabled={files.length === 0 || isSending}
          className={`w-full py-3.5 px-6 rounded-lg text-white font-medium flex items-center
            justify-center space-x-2 text-sm transition-all duration-300
            ${files.length === 0 || isSending
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg transform hover:scale-[1.01]"
            }`}
        >
          {isSending ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              <span>{t("sending")}</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>{t("send")}</span>
            </>
          )}
        </button>

        {/* Direct call fallback */}
        <div className="text-center text-sm text-gray-600 dark:text-slate-400">
          <p className="flex items-center justify-center gap-2">
            <span>{t("callUs")}</span>
            <a href="tel:+995591729911" className="text-blue-600 hover:text-blue-700 font-medium flex items-center">
              <Phone className="w-4 h-4 mr-1" />
              +995 591 729 911
            </a>
          </p>
        </div>

        {/* Toast notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed bottom-4 right-4 p-3 rounded-lg shadow-lg flex items-center space-x-2 max-w-xs z-50
                ${notification.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            >
              {notification.type === "success" ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
              <span>{notification.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
