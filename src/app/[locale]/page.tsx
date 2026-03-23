import LandingPageClient from "./_LandingPageClient";

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How accurate are the translations?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Suliko uses advanced AI models trained on professional translation corpora. Our accuracy rate is 98% for supported language pairs, and the editor lets you review and refine every segment before finalising your document.",
      },
    },
    {
      "@type": "Question",
      name: "Which languages are supported?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We currently support over 50 languages, including Georgian, English, French, Turkish, Polish, Ukrainian, Arabic, and many more. Georgian is a first-class citizen — our models are specifically fine-tuned for it.",
      },
    },
    {
      "@type": "Question",
      name: "What file formats can I upload?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You can upload PNG, JPG, JPEG, PDF, DOCX, and TXT files. The document is parsed automatically and presented in a side-by-side editor so you can see the original alongside the translation.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a free tier?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — every new user receives 25 free pages to translate. After that you can choose a monthly plan (Starter, Professional) or a pay-as-you-go option, whichever suits your workflow.",
      },
    },
    {
      "@type": "Question",
      name: "Is my document data secure?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Your documents are encrypted in transit (TLS 1.3) and at rest. We do not use your content to train our models, and you can request permanent deletion of your data at any time.",
      },
    },
    {
      "@type": "Question",
      name: "Why is Suliko especially good for Georgian?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Georgian is a morphologically complex language that most general-purpose AI systems handle poorly. Suliko's models are fine-tuned on Georgian legal, medical, and business texts, resulting in significantly better output than generic translation services.",
      },
    },
    {
      "@type": "Question",
      name: "Do you offer an API or business integrations?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Our Business and Enterprise plans include API access so you can integrate Suliko directly into your own workflows and applications. Contact our sales team for custom volume pricing and SLA options.",
      },
    },
  ],
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <LandingPageClient />
    </>
  );
}
