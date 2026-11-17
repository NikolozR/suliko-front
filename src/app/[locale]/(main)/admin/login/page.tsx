import { getLocale } from "next-intl/server";

import { requireAdminPage } from "@/features/admin/access";
import { redirect } from "@/i18n/navigation";

/**
 * The admin console used to have a sign-in of its own. Old links and bookmarks
 * go to the normal sign-in, and back to the console afterwards.
 */
export default async function OldAdminLoginPage() {
  await requireAdminPage("/admin");
  // Already an admin: straight to the console.
  redirect({ href: "/admin", locale: await getLocale() });
}
