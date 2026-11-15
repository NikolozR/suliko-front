"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Check, Save } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import type { SiteString } from "@office/features/service-pages/api";
import {
  saveStringsAction,
  type StringsFormState,
} from "@office/features/service-pages/string-actions";
import { FormAlert } from "@office/shared/components/form/fields";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { Textarea } from "@office/shared/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@office/shared/components/ui/table";
import { cn } from "@office/shared/lib/utils";

/**
 * The site-string editor.
 *
 * A grid, not a form per string. There are hundreds of these and they are
 * edited in sweeps — someone fixes every label in one group, or fills in the
 * English side of a section translated only into Georgian. So the whole page
 * is one form that saves only what actually changed.
 *
 * Unsaved edits are tracked against the value each row loaded with, which is
 * what lets the Save button say how many rows are pending and lets a row
 * edited back to its original drop out of the batch entirely.
 */

function SaveButton({ count }: { count: number }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="brand" size="sm" disabled={pending || count === 0}>
      <Save />
      {count === 0 ? "No changes" : `Save ${count} change${count === 1 ? "" : "s"}`}
    </Button>
  );
}

export function StringsGrid({ strings }: { strings: SiteString[] }) {
  const [state, formAction] = useActionState<StringsFormState, FormData>(
    saveStringsAction,
    {},
  );

  /** Edited values, keyed by `${key}:${locale}`. Absent means untouched. */
  const [edits, setEdits] = useState<Record<string, string>>({});

  const original = useMemo(() => {
    const map: Record<string, string> = {};
    for (const row of strings) map[`${row.key}:${row.locale}`] = row.value;
    return map;
  }, [strings]);

  // A row typed back to what it was is not a change, so it leaves the batch.
  const pending = useMemo(
    () =>
      Object.entries(edits).filter(([id, value]) => value !== (original[id] ?? "")),
    [edits, original],
  );

  const rowsJson = JSON.stringify(
    pending.map(([id, value]) => {
      // Keys may contain dots; the locale is the last segment after the final
      // colon, and a colon is not legal inside a key.
      const separator = id.lastIndexOf(":");
      return { key: id.slice(0, separator), locale: id.slice(separator + 1), value };
    }),
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="rows" value={rowsJson} />

      <FormAlert message={state.error} />

      {state.saved !== undefined && state.saved > 0 && (
        <p className="border-status-success/40 bg-status-success/10 mb-4 flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <Check className="text-status-success size-4 shrink-0" aria-hidden />
          Saved {state.saved} string{state.saved === 1 ? "" : "s"}.
        </p>
      )}

      <Card className="overflow-hidden py-0">
        <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <h2 className="text-sm font-semibold">
            Strings <span className="text-muted-foreground font-normal">({strings.length})</span>
          </h2>
          <SaveButton count={pending.length} />
        </div>

        <CardContent className="p-0">
          <div className="custom_scroll">
            <Table className="stack-mobile">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-72">Key</TableHead>
                  <TableHead className="w-16">Locale</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {strings.map((row) => {
                  const id = `${row.key}:${row.locale}`;
                  const current = edits[id] ?? row.value;
                  const changed = current !== row.value;

                  return (
                    <TableRow key={row.id} className={cn(changed && "bg-status-warning/[0.06]")}>
                      <TableCell data-full className="align-top">
                        <code className="text-xs break-all">{row.key}</code>
                        {row.context_note && (
                          <p className="text-muted-foreground mt-1 text-xs">{row.context_note}</p>
                        )}
                      </TableCell>
                      <TableCell data-label="Locale" className="text-muted-foreground align-top font-mono text-xs uppercase">
                        {row.locale}
                      </TableCell>
                      <TableCell data-label="Value">
                        <Textarea
                          aria-label={`${row.key} (${row.locale})`}
                          value={current}
                          rows={Math.min(6, Math.max(1, Math.ceil(current.length / 60)))}
                          onChange={(event) =>
                            setEdits((now) => ({ ...now, [id]: event.target.value }))
                          }
                          // An empty value is a key someone added but never
                          // filled in — worth flagging, not an error.
                          className={cn(
                            "min-h-9 resize-y",
                            !current.trim() && "border-status-warning/50",
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
