"use client";

import { useEffect, useState } from "react";

export default function PriceTestPage() {
  const [paymentMode, setPaymentMode] = useState<"prod" | "test">("prod");

  useEffect(() => {
    const stored = localStorage.getItem("paymentMode");
    if (stored === "test") setPaymentMode("test");
    else setPaymentMode("prod");
  }, []);

  const toggle = (mode: "prod" | "test") => {
    setPaymentMode(mode);
    localStorage.setItem("paymentMode", mode);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-card border border-border rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
        <h1 className="text-xl font-bold text-card-foreground mb-1">Payment Mode</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Controls how the pricing page handles payments
        </p>

        <div className="flex rounded-xl border border-border overflow-hidden mb-6">
          <button
            onClick={() => toggle("prod")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              paymentMode === "prod"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Prod
          </button>
          <button
            onClick={() => toggle("test")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              paymentMode === "test"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Test
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          {paymentMode === "prod"
            ? "Shows contact overlay instead of calling payment API"
            : "Calls the Flitt payment API directly"}
        </p>
      </div>
    </div>
  );
}
