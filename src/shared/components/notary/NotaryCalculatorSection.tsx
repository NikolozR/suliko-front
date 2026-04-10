"use client";

import NotaryTabbedCalculator from "./NotaryTabbedCalculator";

export default function NotaryCalculatorSection() {
  return (
    <section id="calculator" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <NotaryTabbedCalculator />
      </div>
    </section>
  );
}
