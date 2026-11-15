"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { AlertTriangle, Building2, Check, Landmark, Plus, Star, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  addBankAccountAction,
  deleteBankAccountAction,
  makePrimaryAction,
  saveCompanyAction,
  type CompanyFormState,
} from "@office/features/settings/company-actions";
import {
  type Company,
  type InvoiceReadiness,
} from "@office/features/settings/company-types";
import { describeInvoiceProblem } from "@office/features/settings/invoice-problems";
import { Field, FormAlert, SubmitButton } from "@office/shared/components/form/fields";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@office/shared/components/ui/card";
import { Checkbox } from "@office/shared/components/ui/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogFormClass,
} from "@office/shared/components/ui/dialog";
import { Input } from "@office/shared/components/ui/input";
import { Label } from "@office/shared/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@office/shared/components/ui/table";
import { cn } from "@office/shared/lib/utils";

/**
 * Settings → Companies.
 *
 * This is the only screen whose output leaves the building. Everything on it
 * ends up on an invoice a client — and their accountant — reads, so the tab
 * leads with whether an invoice can be issued at all rather than making
 * someone discover the gap at the moment they need one.
 */

function RowButton({ label, icon }: { label: string; icon: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="ghost" size="icon-sm" aria-label={label} disabled={pending}>
      {icon}
    </Button>
  );
}

function BankAccountDialog({ role, roleLabel }: { role: string; roleLabel: string }) {
  const t = useTranslations("settings");
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<CompanyFormState, FormData>(
    addBankAccountAction,
    {},
  );

  if (state.ok && open) setOpen(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus /> {t("companies.addAccount")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader icon={Landmark} hue="grey">
            <DialogTitle>{t("companies.addBankAccount")}</DialogTitle>
            <DialogDescription>{t("companies.addBankAccountFor", { role: roleLabel })}</DialogDescription>
          </DialogHeader>

          <form action={formAction} noValidate className={dialogFormClass}>
            <DialogBody className="space-y-4">
              <input type="hidden" name="role" value={role} />
              <FormAlert message={state.error} stepUp={state.stepUp} />

              <Field name="bank_name" label={t("companies.bank")}>
                <Input id="bank_name" name="bank_name" autoFocus maxLength={255} />
              </Field>

              <Field
                name="bank_iban"
                label="IBAN"
                hint={t("companies.ibanHint")}
              >
                <Input
                  id="bank_iban"
                  name="bank_iban"
                  required
                  maxLength={34}
                  className="font-mono"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field name="bank_swift" label="SWIFT">
                  <Input
                    id="bank_swift"
                    name="bank_swift"
                    maxLength={20}
                    className="font-mono"
                  />
                </Field>

                <Field name="account_name" label={t("companies.accountName")}>
                  <Input id="account_name" name="account_name" maxLength={255} />
                </Field>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox id="is_primary" name="is_primary" defaultChecked />
                <Label htmlFor="is_primary" className="font-normal">
                  {t("companies.primaryLabel")}
                </Label>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                {t("cancel")}
              </Button>
              <SubmitButton label={t("companies.addAccount")} icon={<Landmark />} />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CompanyForm({ company, personal }: { company: Company; personal: boolean }) {
  const t = useTranslations("settings");
  const [state, formAction] = useActionState<CompanyFormState, FormData>(
    saveCompanyAction,
    {},
  );
  // Their errors are shown now: "make primary" and "delete" used to discard
  // theirs, so a refused delete looked like a button that did nothing.
  const [primaryState, primaryAction] = useActionState<CompanyFormState, FormData>(
    makePrimaryAction,
    {},
  );
  const [deleteState, deleteAction] = useActionState<CompanyFormState, FormData>(
    deleteBankAccountAction,
    {},
  );

  // A freelancer is not a legal entity, but their invoices still need a seller:
  // same record, worded as "your details".
  const wording = personal ? `personal_${company.role}` : company.role;
  const meta = {
    label: t(`companies.${wording}`),
    help: t(`companies.${wording}Help`),
  };
  const value = (key: keyof Company) =>
    state.values?.[key] ?? (company[key] as string) ?? "";

  const isLegal = company.role === "legal_entity";

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Building2 className="text-muted-foreground size-4" aria-hidden />
          <CardTitle className="text-base">{meta.label}</CardTitle>
          {isLegal && company.missing_for_invoice.length > 0 && (
            <span className="bg-status-warning/15 text-status-warning inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
              {t("companies.incomplete")}
            </span>
          )}
        </div>
        <p className="text-muted-foreground mt-1 text-sm">{meta.help}</p>
      </CardHeader>

      <CardContent className="space-y-6">
        <form action={formAction} noValidate className="space-y-4">
          <input type="hidden" name="role" value={company.role} />

          <FormAlert message={state.error} stepUp={state.stepUp} />
          {state.ok && (
            <p className="border-status-success/40 bg-status-success/10 flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <Check className="text-status-success size-4 shrink-0" aria-hidden />
              {t("saved")}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              name={`${company.role}-name_ka`}
              label={t("companies.nameKa")}
              hint={isLegal ? t("companies.nameKaHint") : undefined}
            >
              <Input
                id={`${company.role}-name_ka`}
                name="name_ka"
                defaultValue={value("name_ka")}
                maxLength={255}
              />
            </Field>

            <Field name={`${company.role}-name_en`} label={t("companies.nameEn")}>
              <Input
                id={`${company.role}-name_en`}
                name="name_en"
                defaultValue={value("name_en")}
                maxLength={255}
              />
            </Field>

            <Field
              name={`${company.role}-id_number`}
              label={t("companies.idNumber")}
              hint={isLegal ? t("companies.idNumberHint") : undefined}
            >
              <Input
                id={`${company.role}-id_number`}
                name="id_number"
                defaultValue={value("id_number")}
                maxLength={50}
                className="font-mono"
              />
            </Field>

            <Field name={`${company.role}-site`} label={t("companies.website")}>
              <Input
                id={`${company.role}-site`}
                name="site"
                defaultValue={value("site")}
                maxLength={255}
              />
            </Field>

            <Field
              name={`${company.role}-address_ka`}
              label={t("companies.addressKa")}
              className="sm:col-span-2"
            >
              <Input
                id={`${company.role}-address_ka`}
                name="address_ka"
                defaultValue={value("address_ka")}
                maxLength={500}
              />
            </Field>

            <Field
              name={`${company.role}-address_en`}
              label={t("companies.addressEn")}
              className="sm:col-span-2"
            >
              <Input
                id={`${company.role}-address_en`}
                name="address_en"
                defaultValue={value("address_en")}
                maxLength={500}
              />
            </Field>

            <Field name={`${company.role}-director_ka`} label={t("companies.directorKa")}>
              <Input
                id={`${company.role}-director_ka`}
                name="director_ka"
                defaultValue={value("director_ka")}
                maxLength={255}
              />
            </Field>

            <Field name={`${company.role}-director_en`} label={t("companies.directorEn")}>
              <Input
                id={`${company.role}-director_en`}
                name="director_en"
                defaultValue={value("director_en")}
                maxLength={255}
              />
            </Field>

            <Field name={`${company.role}-email`} label={t("companies.email")}>
              <Input
                id={`${company.role}-email`}
                name="email"
                type="email"
                defaultValue={value("email")}
                maxLength={255}
              />
            </Field>

            <Field name={`${company.role}-phone`} label={t("companies.phone")}>
              <Input
                id={`${company.role}-phone`}
                name="phone"
                type="tel"
                defaultValue={value("phone")}
                maxLength={50}
              />
            </Field>

            <Field name={`${company.role}-whatsapp`} label="WhatsApp">
              <Input
                id={`${company.role}-whatsapp`}
                name="whatsapp"
                defaultValue={value("whatsapp")}
                maxLength={50}
              />
            </Field>
          </div>

          <SubmitButton label={t("companies.saveCompany")} />
        </form>

        {/* Bank accounts only matter for the entity that gets paid. */}
        {isLegal && (
          <div className="border-border border-t pt-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold">
                  {t("companies.bankAccounts")}{" "}
                  <span className="text-muted-foreground font-normal">
                    ({company.bank_accounts.length})
                  </span>
                </h4>
                <p className="text-muted-foreground text-xs">{t("companies.bankAccountsHint")}</p>
              </div>
              {company.id > 0 && (
                <BankAccountDialog role={company.role} roleLabel={meta.label} />
              )}
            </div>

            {company.id === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                {t("companies.saveFirst")}
              </p>
            ) : company.bank_accounts.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                {t("companies.noAccounts")}
              </p>
            ) : (
              <div className="custom_scroll">
                <FormAlert message={primaryState.error ?? deleteState.error} />
                <Table className="stack-mobile">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("companies.bank")}</TableHead>
                      <TableHead className="w-40">IBAN</TableHead>
                      <TableHead className="w-28">SWIFT</TableHead>
                      <TableHead className="w-24">{t("companies.primary")}</TableHead>
                      <TableHead className="w-20 text-right">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {company.bank_accounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell data-full className="font-medium">
                          {account.bank_name || "–"}
                          {account.account_name && (
                            <span className="text-muted-foreground block text-xs">
                              {account.account_name}
                            </span>
                          )}
                        </TableCell>
                        <TableCell data-label="IBAN" className="font-mono text-xs">
                          {account.bank_iban_masked ?? "–"}
                        </TableCell>
                        <TableCell data-label="SWIFT" className="font-mono text-xs">
                          {account.bank_swift || "–"}
                        </TableCell>
                        <TableCell data-label={t("companies.primary")}>
                          {account.is_primary ? (
                            <span className="text-status-success inline-flex items-center gap-1 text-xs font-medium">
                              <Star className="size-3 fill-current" aria-hidden />{" "}
                              {t("companies.primary")}
                            </span>
                          ) : (
                            <form action={primaryAction}>
                              <input type="hidden" name="id" value={account.id} />
                              <Button type="submit" variant="ghost" size="sm" className="h-7 text-xs">
                                {t("companies.makePrimary")}
                              </Button>
                            </form>
                          )}
                        </TableCell>
                        <TableCell data-label={t("actions")}>
                          <div className="flex justify-end">
                            <form
                              action={deleteAction}
                              onSubmit={(event) => {
                                const question = `${t("companies.deleteAccountTitle")}\n\n${t(
                                  "companies.deleteAccountBody",
                                  { bank: account.bank_name || account.bank_iban_masked || "" },
                                )}`;
                                if (!window.confirm(question)) event.preventDefault();
                              }}
                            >
                              <input type="hidden" name="id" value={account.id} />
                              <RowButton
                                label={t("companies.deleteAccountTitle")}
                                icon={<Trash2 />}
                              />
                            </form>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CompaniesTab({
  companies,
  readiness,
  personal = false,
}: {
  companies: Company[];
  readiness: InvoiceReadiness | null;
  /** A freelancer's workspace: worded as their own details, not a company's. */
  personal?: boolean;
}) {
  const t = useTranslations("settings");
  const tInvoice = useTranslations("invoice");
  return (
    <div className="space-y-4">
      {readiness && (
        <Card
          className={cn(
            readiness.ok
              ? "border-status-success/40 bg-status-success/[0.06]"
              : "border-status-warning/40 bg-status-warning/[0.06]",
          )}
        >
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            {readiness.ok ? (
              <Check className="text-status-success mt-0.5 size-4 shrink-0" aria-hidden />
            ) : (
              <AlertTriangle className="text-status-warning mt-0.5 size-4 shrink-0" aria-hidden />
            )}
            <div className="text-muted-foreground">
              {readiness.ok ? (
                <p>
                  <span className="text-foreground font-medium">
                    {t("companies.invoicesReady")}
                  </span>{" "}
                  {t("companies.invoicesReadyBody")}
                </p>
              ) : (
                <>
                  <p className="text-foreground font-medium">{t("companies.invoicesNotReady")}</p>
                  <ul className="mt-1 list-inside list-disc space-y-0.5">
                    {readiness.problems.map((problem) => (
                      <li key={problem}>{describeInvoiceProblem(problem, tInvoice)}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {companies
        // The "brand" record (a trading name distinct from the legal entity,
        // for the rare case they differ) is off by default — most tenants
        // only need the legal entity, and a second, mostly-empty card next
        // to it read as unfinished setup rather than an optional extra.
        // Nothing is deleted: existing data, if any, still generates
        // invoices with `seller_brand` exactly as before, and this filter is
        // the only thing standing between it and being editable again.
        .filter((company) => company.role !== "brand")
        .map((company) => (
          <CompanyForm key={company.role} company={company} personal={personal} />
        ))}
    </div>
  );
}
