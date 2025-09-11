"use client";

import { Card, CardContent } from "@/features/ui";
import { Brain, Shield, Zap, Users, Target, Award } from "lucide-react";

export default function AboutSection() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Intelligence",
      description: "Advanced neural networks trained on millions of documents for contextually accurate translations."
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption and privacy protection for all your sensitive documents and data."
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Process documents in seconds, not hours. Our optimized infrastructure delivers results instantly."
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Share translations, collaborate on projects, and maintain consistency across your organization."
    },
    {
      icon: Target,
      title: "Industry Expertise",
      description: "Specialized models for legal, medical, technical, and business documents with domain-specific accuracy."
    },
    {
      icon: Award,
      title: "Quality Assurance",
      description: "Multi-layer quality checks ensure every translation meets professional standards and accuracy requirements."
    }
  ];

  return (
    <section id="about" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Why Choose Suliko?
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            We&apos;re revolutionizing document translation with cutting-edge AI technology, 
            making professional-grade translations accessible to everyone, everywhere.
          </p>
        </div>

        {/* Mission Statement */}
        <div className="max-w-3xl mx-auto mb-16">
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-foreground mb-4">Our Mission</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                To break down language barriers and enable seamless communication across cultures, 
                industries, and borders through intelligent, accurate, and accessible translation technology.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">10M+</div>
            <div className="text-sm text-muted-foreground">Documents Translated</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">150+</div>
            <div className="text-sm text-muted-foreground">Languages Supported</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">50K+</div>
            <div className="text-sm text-muted-foreground">Happy Customers</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
            <div className="text-sm text-muted-foreground">Uptime Guarantee</div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h3 className="text-3xl font-bold text-foreground text-center mb-12">Our Core Values</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-xl font-semibold text-foreground mb-3">Precision</h4>
              <p className="text-muted-foreground">
                Every translation is crafted with meticulous attention to detail and context.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="text-xl font-semibold text-foreground mb-3">Trust</h4>
              <p className="text-muted-foreground">
                Your data security and privacy are our top priorities in everything we do.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="text-xl font-semibold text-foreground mb-3">Innovation</h4>
              <p className="text-muted-foreground">
                Continuously advancing our technology to deliver better results faster.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
