"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Check, Copy, Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import type { MonthlyInvoice } from "@office/features/clients/monthly-invoice-types";
import { Party } from "@office/features/orders/components/invoice-document";
import { Link } from "@office/i18n/navigation";
import { BackLink } from "@office/shared/components/back-link";
import { Button } from "@office/shared/components/ui/button";
import { monthNames } from "@office/shared/lib/months";
import { formatDate } from "@office/shared/lib/dates";
import { formatMoneyString } from "@office/shared/lib/money";

/**
 * A client's invoice for one month, ready to print. Same paper rules as the
 * order invoice (white on black whatever the theme, nothing but the document
 * printed), with a body grouped by language pair and the notary cost in the
 * totals.
 */

const LABELS = {
  ka: {
    invoice: "ყოველთვიური ინვოისი",
    number: "ინვოისი №",
    issued: "გაცემის თარიღი",
    period: "პერიოდი",
    orders: "ჩაბარებული შეკვეთები",
    from: "სერვისის მომწოდებელი",
    to: "სერვისის მიმღები",
    idNumber: "ს/ნ",
    languages: "ენები",
    orderCount: "შეკვეთა",
    pages: "გვერდი",
    quantity: "რაოდენობა",
    minutesShort: "წთ",
    charactersShort: "სიმბ.",
    amount: "თანხა",
    translation: "თარგმანი",
    notary: "ნოტარიული ხარჯი",
    delivery: "მიტანა",
    total: "სულ",
    paid: "გადახდილი",
    balanceDue: "გადასახდელი",
    payTo: "გადახდის რეკვიზიტები",
    bank: "ბანკი",
    iban: "ანგარიშის ნომერი",
    swift: "SWIFT",
    accountName: "მიმღები",
    purpose: "დანიშნულება",
    purposeText: "თარგმნის მომსახურება, ინვოისი №",
    signature: "ხელმოწერა",
    directorSignature: "დირექტორი, ხელმოწერა",
  },
  en: {
    invoice: "Monthly invoice",
    number: "Invoice no.",
    issued: "Issued",
    period: "Period",
    orders: "Delivered orders",
    from: "Service provider",
    to: "Service recipient",
    idNumber: "ID",
    languages: "Languages",
    orderCount: "Orders",
    pages: "Pages",
    quantity: "Qty",
    minutesShort: "min",
    charactersShort: "chars",
    amount: "Amount",
    translation: "Translation",
    notary: "Notary cost",
    delivery: "Delivery",
    total: "Total",
    paid: "Paid",
    balanceDue: "Balance due",
    payTo: "Payment details",
    bank: "Bank",
    iban: "IBAN",
    swift: "SWIFT",
    accountName: "Account name",
    purpose: "Purpose",
    purposeText: "Translation services, invoice no.",
    signature: "Signature",
    directorSignature: "Director, signature",
  },
} as const;

/** "ოქტომბერი 2026", in the invoice's own language. */
function monthName(month: string, locale: "ka" | "en"): string {
  const [year, mon] = month.split("-").map(Number);
  return `${monthNames(locale)[mon - 1]} ${year}`;
}

export function MonthlyInvoiceDocument({
  invoice,
  clientId,
}: {
  invoice: MonthlyInvoice;
  clientId: number;
}) {
  const t = LABELS[invoice.locale];
  const ui = useTranslations("invoice");
  const other = invoice.locale === "ka" ? "en" : "ka";
  const purpose = `${t.purposeText} ${invoice.number}`;
  const [copied, setCopied] = useState(false);
  const period = monthName(invoice.month, invoice.locale);
  const mixedUnits = invoice.lines.some((line) => line.unit !== "pages");

  const quantity = (line: MonthlyInvoice["lines"][number]) =>
    line.unit === "minutes"
      ? `${line.quantity} ${t.minutesShort}`
      : line.unit === "characters"
        ? `${line.quantity.toLocaleString("en-US").replace(/,/g, " ")} ${t.charactersShort}`
        : line.quantity;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
        <BackLink href={`/clients/${clientId}`} label={ui("backToClient")} />
        <Button variant="outline" size="sm" asChild title={ui("language")}>
          <Link
            href={`/clients/${clientId}/monthly-invoice?month=${invoice.month}&locale=${other}`}
          >
            {other === "en" ? "English" : "ქართული"}
          </Link>
        </Button>
        <Button variant="brand" size="sm" onClick={() => window.print()}>
          <Printer /> {ui("print")}
        </Button>
      </div>

      <div className="mx-auto max-w-3xl rounded-lg bg-white p-10 text-black shadow-sm print:max-w-none print:rounded-none print:p-[16mm] print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-black/10 pb-6">
          <div>
            <h1 className="text-2xl font-bold">{t.invoice}</h1>
            <p className="mt-1 text-sm">
              {t.number}{" "}
              <span className="font-mono font-semibold">{invoice.number}</span>
            </p>
            <p className="text-sm text-black/60">
              {t.issued} {formatDate(invoice.issued_on)}
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="font-medium">
              {t.period}: {period}
            </p>
            <p className="text-black/60">
              {t.orders}: {invoice.order_count}
            </p>
          </div>
        </header>

        <section className="grid gap-8 py-6 sm:grid-cols-2">
          <div>
            <Party
              title={t.from}
              name={invoice.seller.name}
              address={invoice.seller.address}
              idNumber={invoice.seller.id_number}
              email={invoice.seller.email}
              phone={invoice.seller.phone}
              site={invoice.seller.site}
              labels={t}
            />
            {invoice.seller_brand && (
              <p className="mt-1 text-sm text-black/60">
                {invoice.seller_brand}
              </p>
            )}
          </div>
          <Party
            title={t.to}
            name={invoice.buyer.name}
            address={invoice.buyer.address}
            idNumber={invoice.buyer.id_number}
            email={invoice.buyer.email}
            phone={invoice.buyer.phone}
            labels={t}
          />
        </section>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-black/15 text-left">
              <th className="py-2 pr-3 font-semibold">{t.languages}</th>
              <th className="py-2 pr-3 text-right font-semibold">
                {t.orderCount}
              </th>
              <th className="py-2 pr-3 text-right font-semibold">
                {mixedUnits ? t.quantity : t.pages}
              </th>
              <th className="py-2 text-right font-semibold">{t.amount}</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line) => (
              <tr
                key={`${line.languages}-${line.unit}`}
                className="border-b border-black/10 print:break-inside-avoid"
              >
                <td className="py-2 pr-3">{line.languages}</td>
                <td className="py-2 pr-3 text-right tabular-nums">
                  {line.orders}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">
                  {quantity(line)}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {formatMoneyString(line.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="mt-6 flex justify-end print:break-inside-avoid">
          <dl className="w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-black/60">{t.translation}</dt>
              <dd className="tabular-nums">
                {formatMoneyString(invoice.translation_total)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-black/60">{t.notary}</dt>
              <dd className="tabular-nums">
                {formatMoneyString(invoice.notary_total)}
              </dd>
            </div>
            {Number(invoice.delivery_cost) > 0 && (
              <div className="flex justify-between">
                <dt className="text-black/60">{t.delivery}</dt>
                <dd className="tabular-nums">
                  {formatMoneyString(invoice.delivery_cost)}
                </dd>
              </div>
            )}
            <div className="flex justify-between border-t border-black/15 pt-1.5 text-base font-bold">
              <dt>{t.total}</dt>
              <dd className="tabular-nums">
                {formatMoneyString(invoice.total)}
              </dd>
            </div>
            {Number(invoice.paid) > 0 && (
              <>
                <div className="flex justify-between">
                  <dt className="text-black/60">{t.paid}</dt>
                  <dd className="tabular-nums">
                    −{formatMoneyString(invoice.paid)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-black/15 pt-1.5 font-bold">
                  <dt>{t.balanceDue}</dt>
                  <dd className="tabular-nums">
                    {formatMoneyString(invoice.balance_due)}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </section>

        <section className="mt-8 border-t border-black/10 pt-5 print:break-inside-avoid">
          <h2 className="text-xs font-semibold tracking-wide text-black/60 uppercase">
            {t.payTo}
          </h2>
          <dl className="mt-2 grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
            <div className="flex gap-2">
              <dt className="text-black/60">{t.bank}</dt>
              <dd>{invoice.bank.bank_name || "–"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-black/60">{t.iban}</dt>
              <dd className="min-w-0 font-mono break-all">
                {invoice.bank.iban}
              </dd>
            </div>
            {invoice.bank.swift && (
              <div className="flex gap-2">
                <dt className="text-black/60">{t.swift}</dt>
                <dd className="font-mono">{invoice.bank.swift}</dd>
              </div>
            )}
            {invoice.bank.account_name && (
              <div className="flex gap-2">
                <dt className="text-black/60">{t.accountName}</dt>
                <dd>{invoice.bank.account_name}</dd>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:col-span-2">
              <dt className="text-black/60">{t.purpose}</dt>
              <dd className="font-medium">{purpose}</dd>
              <Button
                variant="outline"
                size="sm"
                className="h-7 border-black/15 bg-white px-2 text-xs text-black hover:bg-black/5 hover:text-black dark:border-black/15 dark:bg-white dark:hover:bg-black/5 print:hidden"
                onClick={() => {
                  navigator.clipboard?.writeText(purpose).then(
                    () => setCopied(true),
                    () => setCopied(false),
                  );
                }}
              >
                {copied ? <Check /> : <Copy />}
                {copied ? ui("purposeCopied") : ui("copyPurpose")}
              </Button>
            </div>
          </dl>
        </section>

        <section className="mt-12 print:break-inside-avoid">
          <div className="w-full max-w-xs">
            <h2 className="text-xs font-semibold tracking-wide text-black/60 uppercase">
              {t.from}
            </h2>
            <div className="mt-12 border-b border-black/50" />
            {invoice.seller.director && (
              <p className="mt-1.5 text-sm font-medium">
                {invoice.seller.director}
              </p>
            )}
            <p className="text-xs text-black/60">
              {invoice.seller.director ? t.directorSignature : t.signature}
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
