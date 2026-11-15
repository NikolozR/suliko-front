"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Loader2, Lock, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { ACQUISITION_SOURCES } from "@office/features/clients/sources";
import { addOptionAction, deleteOptionAction } from "@office/features/options/actions";
import type { CustomOption, OptionListKey } from "@office/features/options/api";
import { useStatusLabel } from "@office/shared/components/status-badge";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@office/shared/components/ui/card";
import { Input } from "@office/shared/components/ui/input";
import { SELECTABLE_STATUSES } from "@office/shared/lib/statuses";

/**
 * The bureau's own additions to its dropdowns. Built-in values are shown for
 * context but cannot be removed — code and reports depend on them. Removing
 * one of the bureau's own only takes it out of the dropdown: an order or
 * client already saved with it keeps it.
 */
export function ListsTab({
  statuses,
  sources,
}: {
  statuses: CustomOption[];
  sources: CustomOption[];
}) {
  const t = useTranslations("settings.lists");
  const statusLabel = useStatusLabel();
  const tsrc = useTranslations("enums.acquisitionSource");

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <OptionListCard
        list="order_status"
        title={t("statusesTitle")}
        description={t("statusesBody")}
        builtIns={SELECTABLE_STATUSES.map((status) => statusLabel(status))}
        initial={statuses}
      />
      <OptionListCard
        list="acquisition_source"
        title={t("sourcesTitle")}
        description={t("sourcesBody")}
        builtIns={ACQUISITION_SOURCES.map((key) => tsrc(key))}
        initial={sources}
      />
    </div>
  );
}

function OptionListCard({
  list,
  title,
  description,
  builtIns,
  initial,
}: {
  list: OptionListKey;
  title: string;
  description: string;
  builtIns: string[];
  initial: CustomOption[];
}) {
  const t = useTranslations("settings.lists");
  const [items, setItems] = useState(initial);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const add = () =>
    startTransition(async () => {
      setError("");
      const result = await addOptionAction(list, draft);
      if (result.error) {
        setError(result.error);
        return;
      }
      const option = result.option;
      if (option) {
        setItems((current) =>
          current.some((item) => item.id === option.id) ? current : [...current, option],
        );
      }
      setDraft("");
    });

  const remove = (item: CustomOption) => {
    if (!window.confirm(t("confirmRemove", { value: item.value }))) return;
    startTransition(async () => {
      setError("");
      const body = new FormData();
      body.set("list", list);
      body.set("id", String(item.id));
      const result = await deleteOptionAction({}, body);
      if (result.error) {
        setError(result.error);
        return;
      }
      setItems((current) => current.filter((other) => other.id !== item.id));
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium">{t("builtIn")}</p>
          <ul className="flex flex-wrap gap-1.5">
            {builtIns.map((label) => (
              <li
                key={label}
                className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs"
              >
                <Lock className="size-3" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium">{t("yours")}</p>
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("none")}</p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="border-suliko-default-color/30 bg-suliko-default-color/10 inline-flex items-center gap-1 rounded-full border py-1 pr-1 pl-2.5 text-xs font-medium"
                >
                  {item.value}
                  <button
                    type="button"
                    className="hover:bg-destructive/15 hover:text-destructive rounded-full p-0.5"
                    aria-label={t("remove", { value: item.value })}
                    title={t("remove", { value: item.value })}
                    disabled={pending}
                    onClick={() => remove(item)}
                  >
                    <X className="size-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form
          className="flex gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) add();
          }}
        >
          <Input
            value={draft}
            maxLength={60}
            placeholder={t("placeholder")}
            aria-label={t("placeholder")}
            onChange={(e) => setDraft(e.target.value)}
          />
          <Button type="submit" variant="brand" size="sm" className="h-9 shrink-0" disabled={pending || !draft.trim()}>
            {pending ? <Loader2 className="animate-spin" /> : <Plus />}
            {t("add")}
          </Button>
        </form>

        {error && (
          <p role="alert" className="text-destructive text-xs">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
