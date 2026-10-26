"use client";

import { Keyboard } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/features/auth/store/authStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/features/ui/components/ui/dialog";
import { KbdCombo } from "@/shared/components/Kbd";
import { GO_TARGETS, SHORTCUTS, type ShortcutGroup } from "@/shared/shortcuts/definitions";
import { useShortcuts } from "@/shared/shortcuts/ShortcutsProvider";

const GROUPS: ShortcutGroup[] = ["navigation", "translation", "general"];

interface Row {
  key: string;
  label: string;
  keys: readonly string[];
}

/**
 * Press ? anywhere: every shortcut this person can use, grouped. Built from
 * the same definitions the sidebar and the key handler read, so the list
 * cannot drift from what works, and it leaves out the screens that need an
 * account when nobody is signed in.
 */
export default function ShortcutsDialog() {
  const t = useTranslations("Shortcuts");
  const token = useAuthStore((s) => s.token);
  const { helpOpen, setHelpOpen } = useShortcuts();

  const rows: Record<ShortcutGroup, Row[]> = {
    navigation: GO_TARGETS.filter((target) => !target.requiresAuth || token).map((target) => ({
      key: target.href,
      label: t(`items.${target.labelKey}`),
      keys: ["Alt", target.digit],
    })),
    translation: [],
    general: [],
  };
  for (const shortcut of SHORTCUTS) {
    rows[shortcut.group].push({
      key: shortcut.id,
      label: t(`items.${shortcut.labelKey}`),
      keys: shortcut.keys,
    });
  }

  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" aria-hidden />
            {t("title")}
          </DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 sm:grid-cols-2">
          {GROUPS.filter((group) => rows[group].length > 0).map((group) => (
            <section key={group}>
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {t(`groups.${group}`)}
              </h3>
              <ul className="space-y-1.5">
                {rows[group].map((row) => (
                  <li key={row.key} className="flex items-center justify-between gap-3 text-sm">
                    <span>{row.label}</span>
                    <KbdCombo keys={row.keys} className="shrink-0 opacity-100" />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
