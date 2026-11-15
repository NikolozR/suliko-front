"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Pencil, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { saveLanguageAction } from "@office/features/settings/actions";
import type { Language } from "@office/features/settings/api";
import { ActiveDot } from "@office/features/settings/components/active-dot";
import { RowDialog, useRowEditor } from "@office/features/settings/components/row-dialog";
import { EmptyState } from "@office/shared/components/data/states";
import { Field } from "@office/shared/components/form/fields";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { Checkbox } from "@office/shared/components/ui/checkbox";
import { Input } from "@office/shared/components/ui/input";
import { Label } from "@office/shared/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@office/shared/components/ui/table";
import { sectionMark } from "@office/shared/config/navigation";

/**
 * The languages this bureau works in.
 *
 * The code is the identity: pricing rows and every order document join on it,
 * not on the id. Editing it is therefore a rename of the language itself, and
 * the API refuses one that would collide with an existing code.
 *
 * As with document types there is no delete, for the same reason — history
 * would stop being readable. Clearing Active is the way out.
 */
export function LanguagesTab({ languages }: { languages: Language[] }) {
  const t = useTranslations("settings");
  const locale = useLocale();
  const editor = useRowEditor<Language>();
  const row = editor.editing ?? null;
  const nameOf = (language: Language) => (locale === "ka" ? language.name_ka : language.name_en);

  return (
    <>
      <Card className="overflow-hidden py-0">
        <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
          <h2 className="text-sm font-semibold">
            {t("languages.title")}{" "}
            <span className="text-muted-foreground font-normal">({languages.length})</span>
          </h2>
          <Button variant="brand" size="sm" onClick={editor.add}>
            <Plus /> {t("languages.add")}
          </Button>
        </div>

        <CardContent className="p-0">
          {languages.length === 0 ? (
            <EmptyState
              hue={sectionMark("settings").hue}
              title={t("languages.emptyTitle")}
              body={t("languages.emptyBody")}
              action={
                <Button variant="brand" size="sm" onClick={editor.add}>
                  <Plus /> {t("languages.add")}
                </Button>
              }
            />
          ) : (
            <div className="custom_scroll">
              <Table className="stack-mobile">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">{t("languages.code")}</TableHead>
                    <TableHead>{t("documentTypes.nameKa")}</TableHead>
                    <TableHead>{t("documentTypes.nameEn")}</TableHead>
                    <TableHead className="w-24">{t("status")}</TableHead>
                    <TableHead className="w-16 text-right">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {languages.map((language) => (
                    <TableRow key={language.id}>
                      <TableCell data-full className="font-mono text-xs uppercase">
                        {language.code}
                      </TableCell>
                      <TableCell data-label={t("documentTypes.nameKa")} className="font-medium">{language.name_ka}</TableCell>
                      <TableCell data-label={t("documentTypes.nameEn")}>{language.name_en}</TableCell>
                      <TableCell data-label={t("status")}><ActiveDot active={language.is_active} /></TableCell>
                      <TableCell data-label={t("actions")}>
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t("editName", { name: nameOf(language) })}
                            onClick={() => editor.edit(language)}
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
        title={row ? t("editName", { name: nameOf(row) }) : t("languages.dialogAdd")}
        action={saveLanguageAction}
      >
        {(state) => {
          const errors = state.fieldErrors ?? {};
          const value = (field: string, fallback?: string) =>
            state.values?.[field] ?? fallback ?? "";

          return (
            <>
              {row && <input type="hidden" name="id" value={row.id} />}

              <Field
                name="code"
                label={t("languages.code")}
                errors={errors.code}
                hint={row ? t("languages.codeHintEdit") : t("languages.codeHintNew")}
              >
                <Input
                  id="code"
                  name="code"
                  defaultValue={value("code", row?.code)}
                  autoFocus={!row}
                  required
                  maxLength={5}
                  className="font-mono"
                />
              </Field>

              <Field name="name_en" label={t("documentTypes.nameEnLong")} errors={errors.name_en}>
                <Input
                  id="name_en"
                  name="name_en"
                  defaultValue={value("name_en", row?.name_en)}
                  autoFocus={Boolean(row)}
                  required
                  maxLength={100}
                />
              </Field>

              <Field name="name_ka" label={t("documentTypes.nameKaLong")} errors={errors.name_ka}>
                <Input
                  id="name_ka"
                  name="name_ka"
                  defaultValue={value("name_ka", row?.name_ka)}
                  required
                  maxLength={100}
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
                  {t("languages.activeLabel")}
                </Label>
              </div>
            </>
          );
        }}
      </RowDialog>
    </>
  );
}
