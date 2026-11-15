"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Check, Copy, FileText, Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { BackLink } from "@office/shared/components/back-link";
import { Link } from "@office/i18n/navigation";
import type { Invoice } from "@office/features/settings/company-types";
import { Button } from "@office/shared/components/ui/button";
import { downloadInvoiceWord } from "@office/features/orders/components/invoice-word";
import { formatDate } from "@office/shared/lib/dates";
import { formatMoneyString } from "@office/shared/lib/money";
import { cn } from "@office/shared/lib/utils";
import { withBasePath } from "@office/shared/lib/base-path";

/**
 * The printable invoice.
 *
 * ## Why this is a page and not a PDF
 *
 * Generating a PDF server-side means a rendering library, a font that covers
 * Georgian, and a layout engine — a real dependency with real failure modes,
 * for a document whose only job today is to be printed or saved. The browser
 * already has all three. Print-to-PDF from here produces a correct Georgian
 * document with no new dependency, and the moment invoices need to be
 * *archived* rather than sent, that is a different feature with a numbering
 * sequence attached to it.
 *
 * ## The print rules are the point
 *
 * `print:hidden` on the app chrome and the toolbar, black-on-white forced,
 * and no page break inside a line row. Without those the printout carries the
 * sidebar and the dark theme, which is what makes most web "invoices"
 * unusable on paper.
 */

/**
 * Both locales share one key set, declared here so a label added to one and
 * forgotten in the other is a type error rather than a blank cell on a
 * client-facing document.
 */
interface Labels {
  invoice: string;
  number: string;
  issued: string;
  orderDate: string;
  dueDate: string;
  reference: string;
  from: string;
  to: string;
  idNumber: string;
  description: string;
  languages: string;
  pages: string;
  /** The column head when a line is in minutes: it can no longer say pages. */
  quantity: string;
  minutesShort: string;
  charactersShort: string;
  unitPrice: string;
  amount: string;
  documentsTotal: string;
  delivery: string;
  total: string;
  paid: string;
  balanceDue: string;
  payTo: string;
  bank: string;
  iban: string;
  swift: string;
  accountName: string;
  purpose: string;
  purposeText: string;
  signature: string;
  directorSignature: string;
}

const LABELS: Record<"ka" | "en", Labels> = {
  ka: {
    invoice: "ინვოისი",
    number: "ინვოისი №",
    issued: "გაცემის თარიღი",
    orderDate: "შეკვეთის თარიღი",
    reference: "მითითება",
    dueDate: "ვადა",
    from: "სერვისის მომწოდებელი",
    to: "სერვისის მიმღები",
    idNumber: "ს/ნ",
    description: "დასახელება",
    languages: "ენები",
    pages: "გვერდი",
    quantity: "რაოდენობა",
    minutesShort: "წთ",
    charactersShort: "სიმბ.",
    unitPrice: "ფასი",
    amount: "თანხა",
    documentsTotal: "დოკუმენტები",
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
    invoice: "Invoice",
    number: "Invoice no.",
    issued: "Issued",
    orderDate: "Order date",
    reference: "Reference",
    dueDate: "Due",
    from: "Service provider",
    to: "Service recipient",
    idNumber: "ID",
    description: "Description",
    languages: "Languages",
    pages: "Pages",
    quantity: "Qty",
    minutesShort: "min",
    charactersShort: "chars",
    unitPrice: "Unit price",
    amount: "Amount",
    documentsTotal: "Documents",
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
};

export function Party({
  title,
  name,
  address,
  idNumber,
  email,
  phone,
  site,
  labels,
}: {
  title: string;
  name: string;
  address: string;
  idNumber: string;
  email: string;
  phone: string;
  site?: string;
  labels: { idNumber: string };
}) {
  return (
    <div>
      <h2 className="text-muted-foreground print:text-black/60 text-xs font-semibold tracking-wide uppercase">
        {title}
      </h2>
      <p className="mt-1.5 font-semibold">{name || "–"}</p>
      {address && <p className="text-sm whitespace-pre-line">{address}</p>}
      {idNumber && (
        <p className="text-sm">
          {labels.idNumber}: <span className="font-mono">{idNumber}</span>
        </p>
      )}
      {email && <p className="text-sm">{email}</p>}
      {phone && <p className="text-sm">{phone}</p>}
      {site && <p className="text-sm">{site}</p>}
    </div>
  );
}

export function InvoiceDocument({ invoice }: { invoice: Invoice }) {
  const t = LABELS[invoice.locale];
  const ui = useTranslations("invoice");
  const other = invoice.locale === "ka" ? "en" : "ka";
  // What the client types as the transfer's purpose, so the payment can be
  // matched to this invoice when it shows up on the statement.
  const purpose = `${t.purposeText} ${invoice.number}`;
  const [copied, setCopied] = useState(false);

  return (
    <>
      {/* Toolbar — never printed. */}
      <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
        <BackLink href={`/translations/${invoice.order_id}`} label={ui("backToOrder")} />

        <Button variant="outline" size="sm" asChild title={ui("language")}>
          <Link href={`/translations/${invoice.order_id}/invoice?locale=${other}`}>
            {other === "en" ? "English" : "ქართული"}
          </Link>
        </Button>

        <Button variant="brand" size="sm" onClick={() => window.print()}>
          <Printer /> {ui("print")}
        </Button>

        {invoice.has_template ? (
          // The bureau's own file, filled in by the API.
          <Button variant="outline" size="sm" asChild>
            <a href={withBasePath(`/api/invoice/${invoice.order_id}?locale=${invoice.locale}`)}>
              <FileText /> {ui("wordOwn")}
            </a>
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => downloadInvoiceWord(invoice, t, purpose)}>
            <FileText /> {ui("word")}
          </Button>
        )}
      </div>

      {/* The document. White and black regardless of theme — it is paper. */}
      <div className="mx-auto max-w-3xl rounded-lg bg-white p-10 text-black shadow-sm print:max-w-none print:rounded-none print:p-[16mm] print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-black/10 pb-6">
          <div>
            <h1 className="text-2xl font-bold">{t.invoice}</h1>
            <p className="mt-1 text-sm">
              {t.number} <span className="font-mono font-semibold">{invoice.number}</span>
            </p>
            <p className="text-sm text-black/60">
              {t.issued} {formatDate(invoice.issued_on)}
            </p>
          </div>

          {/* No order number: the client pays the invoice, and a second
              number next to it only invites paying the wrong one. */}
          <div className="text-right text-sm">
            {invoice.reference && (
              <p className="font-medium">
                {t.reference}: <span className="font-mono">{invoice.reference}</span>
              </p>
            )}
            <p className="text-black/60">
              {t.orderDate} {formatDate(invoice.order_date)}
            </p>
            {invoice.due_date && (
              <p className="text-black/60">
                {t.dueDate} {formatDate(invoice.due_date)}
              </p>
            )}
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
            {/* Shown only when the trading name differs — otherwise it reads
                as a duplicate line. */}
            {invoice.seller_brand && (
              <p className="mt-1 text-sm text-black/60">{invoice.seller_brand}</p>
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
              <th className="py-2 pr-3 font-semibold">{t.description}</th>
              <th className="py-2 pr-3 font-semibold">{t.languages}</th>
              <th className="py-2 pr-3 text-right font-semibold">
                {invoice.lines.some((line) => line.unit === "minutes" || line.unit === "characters")
                  ? t.quantity
                  : t.pages}
              </th>
              <th className="py-2 pr-3 text-right font-semibold">{t.unitPrice}</th>
              <th className="py-2 text-right font-semibold">{t.amount}</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line, index) => (
              <tr
                key={`${line.description}-${index}`}
                className="border-b border-black/10 print:break-inside-avoid"
              >
                <td className="py-2 pr-3">{line.description}</td>
                <td className="py-2 pr-3">{line.languages}</td>
                <td className="py-2 pr-3 text-right tabular-nums">
                  {line.unit === "minutes"
                    ? `${line.pages} ${t.minutesShort}`
                    : line.unit === "characters"
                      ? `${line.pages.toLocaleString("en-US").replace(/,/g, " ")} ${t.charactersShort}`
                      : line.pages}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">
                  {formatMoneyString(line.unit_price)}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {formatMoneyString(line.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="mt-6 flex justify-end">
          <dl className="w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-black/60">{t.documentsTotal}</dt>
              <dd className="tabular-nums">{formatMoneyString(invoice.documents_total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-black/60">{t.delivery}</dt>
              <dd className="tabular-nums">{formatMoneyString(invoice.delivery_cost)}</dd>
            </div>
            <div className="flex justify-between border-t border-black/15 pt-1.5 text-base font-bold">
              <dt>{t.total}</dt>
              <dd className="tabular-nums">{formatMoneyString(invoice.total)}</dd>
            </div>
            {Number(invoice.paid) > 0 && (
              <>
                <div className="flex justify-between">
                  <dt className="text-black/60">{t.paid}</dt>
                  <dd className="tabular-nums">−{formatMoneyString(invoice.paid)}</dd>
                </div>
                <div className="flex justify-between border-t border-black/15 pt-1.5 font-bold">
                  <dt>{t.balanceDue}</dt>
                  <dd className="tabular-nums">{formatMoneyString(invoice.balance_due)}</dd>
                </div>
              </>
            )}
          </dl>
        </section>

        {invoice.bank && (
          <section className="mt-8 border-t border-black/10 pt-5">
            <h2 className="text-xs font-semibold tracking-wide uppercase text-black/60">
              {t.payTo}
            </h2>
            <dl className="mt-2 grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
              <div className="flex gap-2">
                <dt className="text-black/60">{t.bank}</dt>
                <dd>{invoice.bank.bank_name || "–"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-black/60">{t.iban}</dt>
                {/* In full. An invoice the client cannot pay from is not one. */}
                <dd className="min-w-0 font-mono break-all">{invoice.bank.iban}</dd>
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
        )}

        {/* Room to sign the printed copy. Kept on one page. */}
        <section className="mt-12 print:break-inside-avoid">
          <div className="w-full max-w-xs">
            <h2 className="text-xs font-semibold tracking-wide text-black/60 uppercase">
              {t.from}
            </h2>
            <div className="mt-12 border-b border-black/50" />
            {invoice.seller.director && (
              <p className="mt-1.5 text-sm font-medium">{invoice.seller.director}</p>
            )}
            <p className={cn("text-xs text-black/60", !invoice.seller.director && "mt-1.5")}>
              {invoice.seller.director ? t.directorSignature : t.signature}
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
