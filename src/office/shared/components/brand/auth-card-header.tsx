// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import type { ReactNode } from "react";

import { SulikoLogo } from "@office/shared/components/brand/suliko-logo";
import { CardHeader } from "@office/shared/components/ui/card";

/**
 * The head of every signed-out card: brand gradient, the Suliko mark, and two
 * soft circles. Children are the page's own title lines.
 */
export function AuthCardHeader({ children }: { children: ReactNode }) {
  return (
    <CardHeader
      className="suliko-default-bg relative -mt-6 mb-2 overflow-hidden rounded-t-lg py-6 text-center text-white"
      style={{
        backgroundImage:
          "linear-gradient(135deg, #3b59f3 0%, #4f46e5 55%, #6d4af0 100%)",
      }}
    >
      <span
        aria-hidden
        className="absolute -top-10 -left-8 size-32 rounded-full bg-white/10"
      />
      <span
        aria-hidden
        className="absolute -right-6 -bottom-12 size-40 rounded-full bg-white/10"
      />
      <div className="relative space-y-1">
        <SulikoLogo className="mx-auto mb-3 h-6 w-auto text-white" />
        {children}
      </div>
    </CardHeader>
  );
}
