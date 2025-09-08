"use client";

import { Card, CardContent } from "@/features/ui";
import { Star, Quote } from "lucide-react";

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Marketing Director",
      company: "TechCorp Solutions",
      avatar: "SJ",
      rating: 5,
      content: "Suliko has revolutionized our international marketing campaigns. The translation quality is exceptional, and the speed is incredible. We've reduced our translation costs by 60% while improving accuracy."
    },
    {
      name: "Michael Chen",
      role: "Legal Counsel",
      company: "Global Law Firm",
      avatar: "MC",
      rating: 5,
      content: "As a law firm dealing with international clients, accuracy is paramount. Suliko's legal document translations are precise and contextually perfect. It's become an indispensable tool for our practice."
    },
    {
      name: "Elena Rodriguez",
      role: "Content Manager",
      company: "Digital Media Co.",
      avatar: "ER",
      rating: 5,
      content: "The team collaboration features are fantastic. We can now manage multilingual content across our entire organization seamlessly. The API integration made our workflow so much more efficient."
    },
    {
      name: "David Kim",
      role: "Product Manager",
      company: "StartupXYZ",
      avatar: "DK",
      rating: 5,
      content: "From day one, Suliko has been a game-changer for our startup. The pricing is fair, the quality is outstanding, and the support team is incredibly responsive. Highly recommended!"
    },
    {
      name: "Anna Petrov",
      role: "Research Director",
      company: "Academic Institute",
      avatar: "AP",
      rating: 5,
      content: "We use Suliko for translating research papers and academic documents. The technical accuracy is impressive, and it handles complex scientific terminology beautifully. A must-have for researchers."
    },
    {
      name: "James Wilson",
      role: "Operations Manager",
      company: "Manufacturing Inc.",
      avatar: "JW",
      rating: 5,
      content: "The enterprise features are exactly what we needed. Custom glossaries, team management, and the ability to maintain consistency across all our technical documentation has been invaluable."
    }
  ];

  const getAvatarColor = (initials: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500", 
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-orange-500"
    ];
    const index = initials.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <section id="testimonials" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            What Our Customers Say
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Join thousands of satisfied customers who trust Suliko for their translation needs
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">4.9/5</div>
            <div className="text-sm text-muted-foreground">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">50K+</div>
            <div className="text-sm text-muted-foreground">Happy Customers</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">98%</div>
            <div className="text-sm text-muted-foreground">Customer Satisfaction</div>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                {/* Quote Icon */}
                <div className="flex justify-start mb-4">
                  <Quote className="h-8 w-8 text-primary/20" />
                </div>

                {/* Rating */}
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-full ${getAvatarColor(testimonial.avatar)} flex items-center justify-center text-white font-semibold mr-4`}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                    <div className="text-sm text-primary font-medium">
                      {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 pt-8 border-t border-border/50">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Trusted by Industry Leaders
            </h3>
            <p className="text-muted-foreground">
              Join companies worldwide who rely on Suliko for their translation needs
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-60">
            <div className="text-2xl font-bold text-foreground/40">Fortune 500</div>
            <div className="text-2xl font-bold text-foreground/40">Startups</div>
            <div className="text-2xl font-bold text-foreground/40">Universities</div>
            <div className="text-2xl font-bold text-foreground/40">Agencies</div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Ready to Join Them?
            </h3>
            <p className="text-muted-foreground mb-6">
              Start your free trial today and experience the difference professional AI translation can make.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/document">
                <button className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                  Start Free Trial
                </button>
              </a>
              <a href="#contact">
                <button className="border border-border text-foreground px-8 py-3 rounded-lg font-medium hover:bg-accent transition-colors">
                  Contact Sales
                </button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
