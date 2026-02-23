import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

export default async function ChatPageRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [locale, { id }] = await Promise.all([getLocale(), params]);
  redirect({ href: id ? `/projects/${id}` : "/projects", locale });
}
