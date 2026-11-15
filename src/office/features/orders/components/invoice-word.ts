// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import type { Invoice } from "@office/features/settings/company-types";
import { formatDate } from "@office/shared/lib/dates";
import { formatMoneyString } from "@office/shared/lib/money";

/**
 * The invoice as a Word document.
 *
 * Word opens HTML saved under a .doc name (the translation page does the same),
 * which needs no library and no server step. It is built from tables rather
 * than from the page's markup: Word ignores flex and grid, so the screen layout
 * would arrive as a pile of stacked lines.
 */

interface WordLabels {
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
  signature: string;
  directorSignature: string;
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function party(
  title: string,
  who: { name: string; address: string; id_number: string; email: string; phone: string; site?: string },
  idLabel: string,
  brand?: string | null,
): string {
  const lines = [
    `<b>${esc(who.name || "–")}</b>`,
    who.address && esc(who.address).replace(/\n/g, "<br>"),
    who.id_number && `${esc(idLabel)}: ${esc(who.id_number)}`,
    who.email && esc(who.email),
    who.phone && esc(who.phone),
    who.site && esc(who.site),
    brand && `<span style="color:#666">${esc(brand)}</span>`,
  ].filter(Boolean);
  return `<p style="color:#666;font-size:9pt"><b>${esc(title)}</b></p><p>${lines.join("<br>")}</p>`;
}

/** A line's quantity as printed: pages bare, minutes and characters with their unit. */
function quantityOf(line: Invoice["lines"][number], t: WordLabels): string {
  if (line.unit === "minutes") return `${line.pages} ${esc(t.minutesShort)}`;
  if (line.unit === "characters") {
    return `${String(line.pages).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ${esc(t.charactersShort)}`;
  }
  return String(line.pages);
}

export function invoiceWordHtml(invoice: Invoice, t: WordLabels, purpose: string): string {
  const money = (value: string) => esc(formatMoneyString(value));
  const cell = "border-bottom:1px solid #ccc;padding:4pt 6pt;";
  const right = `${cell}text-align:right;`;

  const rows = invoice.lines
    .map(
      (line) =>
        `<tr><td style="${cell}">${esc(line.description)}</td><td style="${cell}">${esc(line.languages)}</td>` +
        `<td style="${right}">${quantityOf(line, t)}</td><td style="${right}">${money(line.unit_price)}</td>` +
        `<td style="${right}">${money(line.amount)}</td></tr>`,
    )
    .join("");

  const total = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:2pt 6pt">${bold ? "<b>" : ""}${esc(label)}${bold ? "</b>" : ""}</td>` +
    `<td style="padding:2pt 6pt;text-align:right">${bold ? "<b>" : ""}${value}${bold ? "</b>" : ""}</td></tr>`;

  const paid =
    Number(invoice.paid) > 0
      ? total(t.paid, `−${money(invoice.paid)}`) + total(t.balanceDue, money(invoice.balance_due), true)
      : "";

  const bank = invoice.bank
    ? `<p style="margin-top:18pt"><b>${esc(t.payTo)}</b></p><p>` +
      [
        `${esc(t.bank)}: ${esc(invoice.bank.bank_name || "–")}`,
        `${esc(t.iban)}: ${esc(invoice.bank.iban)}`,
        invoice.bank.swift && `${esc(t.swift)}: ${esc(invoice.bank.swift)}`,
        invoice.bank.account_name && `${esc(t.accountName)}: ${esc(invoice.bank.account_name)}`,
        `${esc(t.purpose)}: <b>${esc(purpose)}</b>`,
      ]
        .filter(Boolean)
        .join("<br>") +
      "</p>"
    : "";

  const dates = [
    invoice.reference && `${esc(t.reference)}: <b>${esc(invoice.reference)}</b>`,
    `${esc(t.orderDate)} ${esc(formatDate(invoice.order_date))}`,
    invoice.due_date && `${esc(t.dueDate)} ${esc(formatDate(invoice.due_date))}`,
  ]
    .filter(Boolean)
    .join("<br>");

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><title>${esc(t.invoice)} ${esc(invoice.number)}</title>
<style>
  @page { size: A4; margin: 18mm; }
  body { font-family: Sylfaen, Calibri, Arial, sans-serif; font-size: 10pt; color: #000; }
  table { border-collapse: collapse; }
  p { margin: 0 0 6pt 0; }
</style></head>
<body>
<table width="100%"><tr>
  <td valign="top"><p style="font-size:18pt"><b>${esc(t.invoice)}</b></p>
    <p>${esc(t.number)} <b>${esc(invoice.number)}</b><br><span style="color:#666">${esc(t.issued)} ${esc(formatDate(invoice.issued_on))}</span></p></td>
  <td valign="top" align="right" style="color:#666">${dates}</td>
</tr></table>
<table width="100%" style="margin-top:12pt"><tr>
  <td width="50%" valign="top">${party(t.from, invoice.seller, t.idNumber, invoice.seller_brand)}</td>
  <td width="50%" valign="top">${party(t.to, invoice.buyer, t.idNumber)}</td>
</tr></table>
<table width="100%" style="margin-top:12pt">
  <tr style="background:#f2f2f2"><th align="left" style="${cell}">${esc(t.description)}</th><th align="left" style="${cell}">${esc(t.languages)}</th>
  <th align="right" style="${cell}">${esc(invoice.lines.some((line) => line.unit === "minutes" || line.unit === "characters") ? t.quantity : t.pages)}</th><th align="right" style="${cell}">${esc(t.unitPrice)}</th><th align="right" style="${cell}">${esc(t.amount)}</th></tr>
  ${rows}
</table>
<table align="right" style="margin-top:10pt;width:200pt">
  ${total(t.documentsTotal, money(invoice.documents_total))}
  ${total(t.delivery, money(invoice.delivery_cost))}
  ${total(t.total, money(invoice.total), true)}
  ${paid}
</table>
<div style="clear:both"></div>
${bank}
<p style="margin-top:36pt"><b>${esc(t.from)}</b></p>
<p style="margin-top:28pt;border-bottom:1px solid #000;width:200pt">&nbsp;</p>
${invoice.seller.director ? `<p><b>${esc(invoice.seller.director)}</b></p>` : ""}
<p style="color:#666;font-size:9pt">${esc(invoice.seller.director ? t.directorSignature : t.signature)}</p>
</body></html>`;
}

/** Saves the invoice as `invoice-<number>.doc` for Word. */
export function downloadInvoiceWord(invoice: Invoice, t: WordLabels, purpose: string): void {
  const blob = new Blob(["﻿", invoiceWordHtml(invoice, t, purpose)], {
    type: "application/msword",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `invoice-${invoice.number}.doc`;
  link.click();
  URL.revokeObjectURL(url);
}
