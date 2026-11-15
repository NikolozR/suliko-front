"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Pencil, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { saveDocumentTypeAction } from "@office/features/settings/actions";
import type { DocumentType } from "@office/features/settings/api";
import { RowDialog, useRowEditor } from "@office/features/settings/components/row-dialog";
import { ActiveDot } from "@office/features/settings/components/active-dot";
import { Field } from "@office/shared/components/form/fields";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { Checkbox } from "@office/shared/components/ui/checkbox";
import { Input } from "@office/shared/components/ui/input";
import { Label } from "@office/shared/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@office/shared/components/ui/table";
import { EmptyState } from "@office/shared/components/data/states";
import { sectionMark } from "@office/shared/config/navigation";

/**
 * Document types and their price multipliers.
 *
 * No delete. `order_documents.document_type_id` points here from every order
 * ever placed, so removing a type would leave historical orders describing a
 * document nobody can name. Clearing Active takes it out of the order builder
 * while history keeps reading correctly — which is what "remove" means for
 * reference data that is referenced.
 */
export function DocumentTypesTab({ types }: { types: DocumentType[] }) {
  const t = useTranslations("settings");
  const locale = useLocale();
  const editor = useRowEditor<DocumentType>();
  const row = editor.editing ?? null;
  const nameOf = (type: DocumentType) => (locale === "ka" ? type.name_ka : type.name_en);

  return (
    <>
      <Card className="overflow-hidden py-0">
        <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
          <h2 className="text-sm font-semibold">
            {t("documentTypes.title")}{" "}
            <span className="text-muted-foreground font-normal">({types.length})</span>
          </h2>
          <Button variant="brand" size="sm" onClick={editor.add}>
            <Plus /> {t("documentTypes.add")}
          </Button>
        </div>

        <CardContent className="p-0">
          {types.length === 0 ? (
            <EmptyState
              hue={sectionMark("settings").hue}
              title={t("documentTypes.emptyTitle")}
              body={t("documentTypes.emptyBody")}
              action={
                <Button variant="brand" size="sm" onClick={editor.add}>
                  <Plus /> {t("documentTypes.add")}
                </Button>
              }
            />
          ) : (
            <div className="custom_scroll">
              <Table className="stack-mobile">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("documentTypes.nameKa")}</TableHead>
                    <TableHead>{t("documentTypes.nameEn")}</TableHead>
                    <TableHead className="w-32 text-right">{t("documentTypes.multiplier")}</TableHead>
                    <TableHead className="w-24">{t("status")}</TableHead>
                    <TableHead className="w-16 text-right">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {types.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell data-full className="font-medium">{type.name_ka}</TableCell>
                      <TableCell data-label={t("documentTypes.nameEn")}>{type.name_en}</TableCell>
                      <TableCell data-label={t("documentTypes.multiplier")} className="text-right tabular-nums">
                        ×{type.price_multiplier}
                      </TableCell>
                      <TableCell data-label={t("status")}><ActiveDot active={type.is_active} /></TableCell>
                      <TableCell data-label={t("actions")}>
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t("editName", { name: nameOf(type) })}
                            onClick={() => editor.edit(type)}
                          >
                            <Pencil />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <RowDialog
        key={editor.key}
        open={editor.isOpen}
        onOpenChange={editor.close}
        icon={row ? Pencil : Plus}
        title={row ? t("editName", { name: nameOf(row) }) : t("documentTypes.dialogAdd")}
        description={t("documentTypes.dialogDescription")}
        action={saveDocumentTypeAction}
      >
        {(state) => {
          const errors = state.fieldErrors ?? {};
          const value = (field: string, fallback?: string) =>
            state.values?.[field] ?? fallback ?? "";

          return (
            <>
              {row && <input type="hidden" name="id" value={row.id} />}

              <Field name="name_en" label={t("documentTypes.nameEnLong")} errors={errors.name_en}>
                <Input
                  id="name_en"
                  name="name_en"
                  defaultValue={value("name_en", row?.name_en)}
                  autoFocus
                  required
                  maxLength={255}
                />
              </Field>

              <Field name="name_ka" label={t("documentTypes.nameKaLong")} errors={errors.name_ka}>
                <Input
                  id="name_ka"
                  name="name_ka"
                  defaultValue={value("name_ka", row?.name_ka)}
                  required
                  maxLength={255}
                />
              </Field>

              <Field
                name="price_multiplier"
                label={t("documentTypes.priceMultiplier")}
                errors={errors.price_multiplier}
                hint={t("documentTypes.multiplierHint")}
              >
                <Input
                  id="price_multiplier"
                  name="price_multiplier"
                  inputMode="decimal"
                  defaultValue={value("price_multiplier", row?.price_multiplier ?? "1.000")}
                  required
                />
              </Field>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_active"
                  name="is_active"
                  defaultChecked={
                    state.values ? state.values.is_active === "on" : (row?.is_active ?? true)
                  }
                />
                <Label htmlFor="is_active" className="font-normal">
                  {t("documentTypes.activeLabel")}
                </Label>
              </div>
            </>
          );
        }}
      </RowDialog>
    </>
  );
}
