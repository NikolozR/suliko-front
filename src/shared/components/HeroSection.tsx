"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Button } from "@/features/ui";
import { ArrowRight, Sparkles, Globe, FileText } from "lucide-react";

export default function HeroSection() {
  const t = useTranslations("Landing");

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Logo */}
          <div className="mb-8">
            <Image
              src="/Suliko_logo_black.svg"
              alt="Suliko"
              width={120}
              height={120}
              className="mx-auto h-24 w-24 lg:h-32 lg:w-32"
            />
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            {t("title")}
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            {t("description")}
          </p>

          {/* Feature Highlights */}
          <div className="flex flex-wrap justify-center gap-6 mb-12 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span>AI-Powered Translation</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-green-500" />
              <span>100+ Languages</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-500" />
              <span>Document Support</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/document">
              <Button size="lg" className="px-8 py-4 text-lg group">
                {t("cta")}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="#pricing">
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                View Pricing
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 pt-8 border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-4">Trusted by professionals worldwide</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="text-2xl font-bold text-foreground/40">10K+</div>
              <div className="text-2xl font-bold text-foreground/40">50+</div>
              <div className="text-2xl font-bold text-foreground/40">99.9%</div>
              <div className="text-2xl font-bold text-foreground/40">24/7</div>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-8 text-xs text-muted-foreground mt-2">
              <span>Documents Translated</span>
              <span>Languages Supported</span>
              <span>Accuracy Rate</span>
              <span>Support Available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-foreground/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-foreground/50 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
}
