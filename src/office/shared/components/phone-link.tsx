// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { telHref } from "@office/shared/lib/phone";
import { cn } from "@office/shared/lib/utils";

/**
 * A phone number in a table or a detail: a tel: link when it is one, plain
 * text when an older record holds something that is not, "–" when empty.
 */
export function PhoneLink({ phone, className }: { phone: string | null | undefined; className?: string }) {
  if (!phone) return <span className="text-muted-foreground">–</span>;
  const href = telHref(phone);
  if (!href) return <span className={className}>{phone}</span>;
  return (
    <a href={href} className={cn("text-link hover:underline", className)}>
      {phone}
    </a>
  );
}
