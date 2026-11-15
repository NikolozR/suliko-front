"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Check, Loader2, Search, UserPlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";

import { CLIENT_TYPES } from "@office/features/clients/schema";
import { ACQUISITION_SOURCES } from "@office/features/clients/sources";
import { quickCreateClientAction, searchClientsAction } from "@office/features/orders/actions";
import { Field, selectClass } from "@office/shared/components/form/fields";
import { OptionSelect } from "@office/shared/components/form/option-select";
import { QuickAddDialog } from "@office/shared/components/form/quick-add-dialog";
import { Button } from "@office/shared/components/ui/button";
import { Input } from "@office/shared/components/ui/input";
import { cn } from "@office/shared/lib/utils";
import { PHONE_PLACEHOLDER } from "@office/shared/lib/phone";

/**
 * Search-and-pick a client.
 *
 * A dropdown of every client is not an option — the bureau has thousands, and
 * the list is the kind that grows. So this queries the API as you type and
 * shows the first ten matches.
 *
 * The chosen id lives in a hidden input, which is what makes this work inside
 * a plain form action: React state does not serialise into FormData, so a
 * component that held the selection only in state would submit nothing.
 */

export interface PickedClient {
  id: number;
  /** Its number in the bureau, when known; never the id in its place. */
  number?: number;
  name: string;
  client_type: "B2B" | "B2C";
}

export function ClientPicker({
  name = "client_id",
  initial,
  invalid,
  onPick,
  canCreate = false,
  sourceOptions = [],
}: {
  name?: string;
  initial?: PickedClient | null;
  invalid?: boolean;
  /**
   * Also told about the selection, for forms that need it in React state —
   * the payment screen loads the client's orders as soon as one is chosen.
   * The hidden input stays the source of truth for the submit.
   */
  onPick?: (client: PickedClient | null) => void;
  /** Show the "+" next to the search box — gated on `clients.write`. */
  canCreate?: boolean;
  /** The bureau's own acquisition sources, for the new-client dialog. */
  sourceOptions?: readonly string[];
}) {
  const t = useTranslations("orders.picker");
  const te = useTranslations("enums.clientType");
  const tsrc = useTranslations("enums.acquisitionSource");
  const tf = useTranslations("clients.form");
  const [picked, setPicked] = useState<PickedClient | null>(initial ?? null);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<PickedClient[]>([]);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addNonce, setAddNonce] = useState(0);

  const choose = (client: PickedClient | null) => {
    setPicked(client);
    onPick?.(client);
  };

  // Debounced: typing a name should not be one request per keystroke.
  useEffect(() => {
    if (picked) return;
    const timer = setTimeout(() => {
      startTransition(async () => setResults(await searchClientsAction(term)));
    }, 300);
    return () => clearTimeout(timer);
  }, [term, picked]);

  const addDialog = canCreate && (
    <QuickAddDialog<PickedClient>
      key={addNonce}
      open={addOpen}
      onOpenChange={setAddOpen}
      title={t("addClient")}
      description={t("addClientDescription")}
      action={quickCreateClientAction}
      onCreated={(client) => {
        choose(client);
        setTerm("");
        setResults([]);
      }}
    >
      {(state) => {
        const errors = state.fieldErrors ?? {};
        return (
          <>
            <Field name="nc_name" label={t("clientName")} errors={errors.name}>
              <Input
                id="nc_name"
                name="name"
                autoFocus
                required
                maxLength={255}
                defaultValue={state.values?.name}
              />
            </Field>

            <Field name="nc_client_type" label={t("clientType")} errors={errors.client_type}>
              <select
                id="nc_client_type"
                name="client_type"
                className={selectClass}
                defaultValue={state.values?.client_type ?? "B2C"}
                required
              >
                {CLIENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {te(type.value)}
                  </option>
                ))}
              </select>
            </Field>

            <Field name="nc_phone" label={t("phone")} errors={errors.phone}>
              <Input
                id="nc_phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="off"
                placeholder={PHONE_PLACEHOLDER}
                defaultValue={state.values?.phone}
              />
            </Field>

            <Field name="nc_email" label={t("email")} errors={errors.email}>
              <Input
                id="nc_email"
                name="email"
                type="email"
                defaultValue={state.values?.email}
              />
            </Field>

            <Field
              name="nc_acquisition_source"
              label={tf("source")}
              errors={errors.acquisition_source}
            >
              <OptionSelect
                id="nc_acquisition_source"
                name="acquisition_source"
                list="acquisition_source"
                builtIns={ACQUISITION_SOURCES.map((key) => ({ value: key, label: tsrc(key) }))}
                custom={sourceOptions}
                defaultValue={state.values?.acquisition_source ?? ""}
                canAdd
              />
            </Field>
          </>
        );
      }}
    </QuickAddDialog>
  );

  if (picked) {
    return (
      <>
        <div
          className={cn(
            "border-input flex items-center justify-between gap-3 rounded-md border px-3 py-2",
            invalid && "border-destructive",
          )}
        >
          <input type="hidden" name={name} value={picked.id} />
          {/* Echoed back by a failed submit, so the picked client survives it. */}
          <input type="hidden" name={`${name}_label`} value={picked.name} />
          <input type="hidden" name={`${name}_type`} value={picked.client_type} />
          <span className="flex min-w-0 items-center gap-2 text-sm">
            <Check className="text-status-success size-4 shrink-0" aria-hidden />
            <span className="truncate font-medium">{picked.name}</span>
            <span className="text-muted-foreground shrink-0 text-xs">
              {te(picked.client_type)}
              {picked.number !== undefined && ` · #${picked.number}`}
            </span>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("change")}
            title={t("change")}
            onClick={() => {
              choose(null);
              setTerm("");
              setResults([]);
              // Focus the search box so changing your mind takes one click, not
              // a click and then a hunt for where the cursor went.
              requestAnimationFrame(() => inputRef.current?.focus());
            }}
          >
            <X />
          </Button>
        </div>
        {addDialog}
      </>
    );
  }

  return (
    <div className="space-y-2">
      {/* Empty, so a submit with nothing picked fails validation rather than
          silently posting an order against client 0. */}
      <input type="hidden" name={name} value="" />

      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            ref={inputRef}
            id={name}
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder={t("search")}
            className="pl-9"
            autoComplete="off"
            aria-invalid={invalid}
            aria-describedby={invalid ? `${name}-error` : undefined}
          />
          {isPending && (
            <Loader2 className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin" />
          )}
        </div>
        {canCreate && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            aria-label={t("addClient")}
            title={t("addClient")}
            onClick={() => {
              setAddNonce((n) => n + 1);
              setAddOpen(true);
            }}
          >
            <UserPlus />
          </Button>
        )}
      </div>

      {term.trim().length >= 2 && results.length === 0 && !isPending && (
        <p className="text-muted-foreground text-xs">
          {canCreate ? t("noMatchCreate") : t("noMatch")}
        </p>
      )}

      {results.length > 0 && (
        <ul className="border-border divide-border max-h-56 divide-y overflow-y-auto rounded-md border">
          {results.map((client) => (
            <li key={client.id}>
              <button
                type="button"
                onClick={() => choose(client)}
                className="hover:bg-accent flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors"
              >
                <span className="truncate font-medium">{client.name}</span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {te(client.client_type)}
                  {client.number !== undefined && ` · #${client.number}`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {addDialog}
    </div>
  );
}
