"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/features/ui/components/ui/card";
import { Button } from "@/features/ui/components/ui/button";
import { Input } from "@/features/ui/components/ui/input";
import { Label } from "@/features/ui/components/ui/label";
import { Textarea } from "@/features/ui/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/ui/components/ui/select";
import { Mail, Phone, CheckCircle2, AlertCircle } from "lucide-react";

export default function FeedbackPageClient() {
  const t = useTranslations("FeedbackPage");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setShowSuccess(false);
    setError(null);

    try {
      // Send email via API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          subject: formData.subject || t("form.subjects.general"),
          message: formData.message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to send email');
      }

      // Show success message
      setShowSuccess(true);
      
      // Reset form after a delay
      setTimeout(() => {
        setFormData({ email: "", subject: "", message: "" });
        setShowSuccess(false);
      }, 5000);
    } catch (error) {
      console.error("Error sending email:", error);
      setError(error instanceof Error ? error.message : t("error.description"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-suliko-main-content-bg-color">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
            {t("title")}
          </h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Form - Takes 2 columns */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("form.title")}</CardTitle>
                <CardDescription>{t("form.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      {t("form.email")} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("form.emailPlaceholder")}
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  {/* Subject Field */}
                  <div className="space-y-2">
                    <Label htmlFor="subject">
                      {t("form.subject")} <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.subject}
                      onValueChange={(value) =>
                        setFormData({ ...formData, subject: value })
                      }
                      required
                    >
                      <SelectTrigger id="subject">
                        <SelectValue placeholder={t("form.subjectPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">{t("form.subjects.general")}</SelectItem>
                        <SelectItem value="technical">{t("form.subjects.technical")}</SelectItem>
                        <SelectItem value="billing">{t("form.subjects.billing")}</SelectItem>
                        <SelectItem value="feature">{t("form.subjects.feature")}</SelectItem>
                        <SelectItem value="bug">{t("form.subjects.bug")}</SelectItem>
                        <SelectItem value="other">{t("form.subjects.other")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Message Field */}
                  <div className="space-y-2">
                    <Label htmlFor="message">
                      {t("form.message")} <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      placeholder={t("form.messagePlaceholder")}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      rows={6}
                      required
                    />
                  </div>

                  {/* Success Message */}
                  {showSuccess && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          {t("success.title")}
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          {t("success.description")}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">
                          {t("error.title")}
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          {error}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <AlertCircle className="mr-2 h-4 w-4 animate-spin" />
                        {t("form.sending")}
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        {t("form.send")}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Info - Takes 1 column */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t("contact.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{t("contact.email")}</p>
                    <a
                      href="mailto:Info@suliko.ge"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Info@suliko.ge
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{t("contact.phone")}</p>
                    <a
                      href="tel:+995591729911"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      +995 591 729 911
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>{t("quickLinks.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link
                  href="/developers"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  → {t("quickLinks.apiDocs")}
                </Link>
                <Link
                  href="/price"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  → {t("quickLinks.pricing")}
                </Link>
                <Link
                  href="/blog"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  → {t("quickLinks.blog")}
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

