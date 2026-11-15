// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { NotFoundState } from "@office/shared/components/data/not-found-state";

/**
 * A record that does not exist (`/translations/999999`): every detail page
 * calls `notFound()` on an API 404, and this renders inside the shell.
 */
export default function AppNotFound() {
  return <NotFoundState />;
}
