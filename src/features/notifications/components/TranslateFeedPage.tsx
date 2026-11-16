"use client";

import { useEffect } from "react";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { useNotificationFeed } from "../hooks/useNotificationFeed";
import { NotificationList } from "./NotificationList";

/**
 * Translate's feed on Office's notifications page (its "Translate" tab): the
 * latest entries, with "mark all as read". Rendered inside Translate's
 * messages (nested provider), with Office's card and button.
 */
export function TranslateFeedPage() {
  const t = useTranslations("Notifications");
  const { available, unread, items, error, load, markRead, markAllRead } = useNotificationFeed();

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-3">
      {available && unread > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => void markAllRead()}>
            {t("markAllRead")}
          </Button>
        </div>
      )}
      <Card className="overflow-hidden py-0">
        <CardContent className="p-0">
          {error ? (
            <p className="text-muted-foreground px-4 py-10 text-center text-sm">{t("loadError")}</p>
          ) : items === null ? (
            <p className="text-muted-foreground px-4 py-10 text-center text-sm">{t("loading")}</p>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <Bell className="text-muted-foreground/40 size-8" aria-hidden />
              <p className="text-muted-foreground max-w-sm text-sm">{t("empty")}</p>
            </div>
          ) : (
            <NotificationList items={items} onRead={(id) => void markRead(id)} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
