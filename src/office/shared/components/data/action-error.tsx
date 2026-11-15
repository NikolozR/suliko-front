// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { AlertCircle } from "lucide-react";

/**
 * A refusal handed back in the URL (`?error=`) by an action that redirects —
 * a delete the API would not allow, say. Rendered as text, never as HTML, so
 * a crafted link can only ever show a sentence.
 */
export function ActionError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="border-destructive/30 bg-destructive/10 text-destructive mb-4 flex items-start gap-2 rounded-md border px-3 py-2 text-sm"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{message.slice(0, 500)}</span>
    </div>
  );
}
