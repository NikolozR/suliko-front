/**
 * Wording for the pages Bank of Georgia returns the customer to. Every message is
 * shown in Georgian and English together, whatever language the site is set to:
 * someone paying with a foreign card on suliko.ge, or a Georgian card on suliko.io,
 * still reads what happened to their money.
 */

export interface Bilingual {
  ka: string;
  en: string;
}

/** Both languages, the site's own first. */
export function inOrder(text: Bilingual, locale: string): [string, string] {
  return locale === "ka" ? [text.ka, text.en] : [text.en, text.ka];
}

export const successText = {
  title: { ka: "გადახდა წარმატებით შესრულდა!", en: "Payment successful!" },
  body: {
    ka: "გმადლობთ. თქვენი გადახდა მიღებულია.",
    en: "Thank you. Your payment has been received.",
  },
  nextTitle: { ka: "რა ხდება შემდეგ?", en: "What's next?" },
  nextBody: {
    ka: "გვერდები თქვენს ბალანსს რამდენიმე წამში დაემატება და შეგიძლიათ თარგმნა დაიწყოთ.",
    en: "The pages are added to your balance within a few seconds, and you can start translating.",
  },
  startTranslating: { ka: "თარგმნის დაწყება", en: "Start translating" },
  viewProfile: { ka: "პროფილის ნახვა", en: "View profile" },
} satisfies Record<string, Bilingual>;

export const declineText = {
  title: { ka: "გადახდა ვერ შესრულდა", en: "Payment not completed" },
  checking: {
    ka: "ვამოწმებთ, რა უპასუხა ბანკმა...",
    en: "Checking what the bank said...",
  },
  notCharged: {
    ka: "უარყოფილი ან გაუქმებული გადახდისთვის თანხა არ ჩამოგეჭრებათ.",
    en: "A declined or cancelled payment is not charged.",
  },
  notCompleted: {
    ka: "გადახდა არ დასრულებულა. შესაძლოა, ის ბანკის გვერდზე გაუქმდა ან გვერდი დაიხურა.",
    en: "The payment was not completed. It may have been cancelled on the bank's page, or the page was closed.",
  },
  commonReasonsTitle: { ka: "ხშირი მიზეზები", en: "Common reasons" },
  bankCode: { ka: "ბანკის კოდი", en: "Bank code" },
  tryAgain: { ka: "თავიდან ცდა", en: "Try again" },
  goHome: { ka: "მთავარი გვერდი", en: "Go home" },
  helpTitle: { ka: "გჭირდებათ დახმარება?", en: "Need help?" },
  help: {
    ka: "თუ პრობლემა განმეორდა, მოგვწერეთ:",
    en: "If it keeps happening, write to us:",
  },
  helpWithCode: {
    ka: "თუ პრობლემა განმეორდა, მოგვწერეთ და მიუთითეთ ბანკის კოდი:",
    en: "If it keeps happening, write to us and include the bank code:",
  },
} satisfies Record<string, Bilingual>;

/** Shown when the bank has not (yet) told us why, so the customer has somewhere to start. */
export const commonDeclineReasons: Bilingual[] = [
  {
    ka: "ბარათზე არ არის საკმარისი თანხა.",
    en: "There is not enough money on the card.",
  },
  {
    ka: "ბარათზე ონლაინ გადახდები გამორთულია ან დაწესებულია ლიმიტი.",
    en: "Online payments are switched off on the card, or it has a spending limit.",
  },
  {
    ka: "გადახდა არ დადასტურდა ბანკის SMS კოდით ან აპლიკაციით (3-D Secure).",
    en: "The payment was not confirmed with the bank's SMS code or app (3-D Secure).",
  },
  {
    ka: "ბარათის მონაცემები არასწორად იყო შეყვანილი.",
    en: "The card details were entered incorrectly.",
  },
];

const contactBank = {
  ka: "შეცვალეთ ლიმიტი ბანკის აპლიკაციაში ან დაუკავშირდით ბარათის გამცემ ბანკს, ან სცადეთ სხვა ბარათი.",
  en: "Change the limit in your bank's app or contact the bank that issued the card, or use another card.",
};

const join = (a: Bilingual, b: Bilingual): Bilingual => ({
  ka: `${a.ka} ${b.ka}`,
  en: `${a.en} ${b.en}`,
});

const technical: Bilingual = {
  ka: "ბანკის მხარეს მოხდა ტექნიკური შეფერხება. სცადეთ თავიდან რამდენიმე წუთში.",
  en: "The bank had a technical problem with the payment. Please try again in a few minutes.",
};

const expired: Bilingual = {
  ka: "გადახდის ვადა ამოიწურა, რადგან ბანკის გვერდი დიდხანს იყო გახსნილი. დაიწყეთ გადახდა თავიდან.",
  en: "The payment timed out because the bank's page was open too long. Start the payment again.",
};

/**
 * BOG's payment response codes (api.bog.ge, "Payment Response Codes") as something a
 * customer can act on: what went wrong, then what to do about it.
 */
const byCode: Record<string, Bilingual> = {
  "101": {
    ka: "ბარათზე ამ ტიპის გადახდა შეზღუდულია (მაგალითად, გამორთულია ონლაინ გადახდები). დაუკავშირდით ბარათის გამცემ ბანკს.",
    en: "The card is restricted for this kind of payment (for example, online payments are switched off). Contact the bank that issued the card.",
  },
  "102": {
    ka: "შენახული ბარათი ვერ მოიძებნა. გადაიხადეთ ბარათის მონაცემების შეყვანით.",
    en: "The saved card could not be found. Pay by entering the card details instead.",
  },
  "103": {
    ka: "ბარათის მონაცემები არასწორია. გადაამოწმეთ ნომერი, მოქმედების ვადა და CVV, ან სცადეთ სხვა ბარათი.",
    en: "The card details are not valid. Check the number, expiry date and CVV, or use another card.",
  },
  "104": join(
    {
      ka: "გადახდა აჭარბებს ბარათზე დაწესებულ ტრანზაქციების ლიმიტს.",
      en: "The payment is over a transaction limit set on the card.",
    },
    contactBank
  ),
  "105": {
    ka: "ბარათს მოქმედების ვადა გაუვიდა. სცადეთ სხვა ბარათი.",
    en: "The card has expired. Use another card.",
  },
  "106": join(
    {
      ka: "თანხა აჭარბებს ბარათზე დაწესებულ ხარჯვის ლიმიტს (მაგალითად, დღიურ ან ონლაინ ლიმიტს).",
      en: "The amount is over a spending limit on the card (for example, a daily or online limit).",
    },
    contactBank
  ),
  "107": {
    ka: "ბარათზე არ არის საკმარისი თანხა. შეავსეთ ანგარიში ან სცადეთ სხვა ბარათი.",
    en: "There is not enough money on the card. Top up the account or use another card.",
  },
  "108": {
    ka: "გადახდა არ დადასტურდა ბანკის უსაფრთხოების შემოწმებით (3-D Secure). სცადეთ თავიდან და დაადასტურეთ ბანკის SMS კოდით ან აპლიკაციით.",
    en: "The payment did not pass the bank's security check (3-D Secure). Try again and confirm it with the bank's SMS code or app.",
  },
  "109": technical,
  "110": expired,
  "111": {
    ka: "უსაფრთხოების შემოწმების (3-D Secure) დრო ამოიწურა. სცადეთ თავიდან და დაადასტურეთ გადახდა დაუყოვნებლივ.",
    en: "The security check (3-D Secure) timed out. Try again and confirm the payment straight away.",
  },
  "112": technical,
  "122": {
    ka: "გადახდა უარყო გადახდის დამმუშავებელმა ბანკმა. სცადეთ სხვა ბარათი, ან მოგვწერეთ, თუ ეს განმეორდა.",
    en: "The payment was declined by the bank processing it. Use another card, or write to us if it keeps happening.",
  },
  "199": technical,
};

/**
 * Why a failed order failed, from what the bank put in its callback. Null when there
 * is nothing specific to say, so the page falls back to the common reasons.
 */
export function explainDecline(code?: string | null, rejectReason?: string | null): Bilingual | null {
  if (code && byCode[code]) return byCode[code];
  if (rejectReason === "expiration") return expired;
  return null;
}
