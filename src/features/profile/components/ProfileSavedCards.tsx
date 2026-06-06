"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/ui/components/ui/card";
import { Button } from "@/features/ui/components/ui/button";
import { Skeleton } from "@/features/ui/components/ui/skeleton";
import { CreditCard, Trash2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSavedCardsStore } from "@/features/pricing/store/savedCardsStore";
import { AddCardModal } from "@/features/pricing/components/AddCardModal";

export const ProfileSavedCards: React.FC = () => {
  const t = useTranslations("Profile");
  const { cards, loading, error, showAddModal, fetchCards, deleteCard, openAddModal, closeAddModal, saveCardLocally } = useSavedCardsStore();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleDeleteClick = (id: string) => {
    setConfirmingId(id);
  };

  const handleConfirmDelete = async (id: string) => {
    await deleteCard(id);
    setConfirmingId(null);
  };

  const handleCancelDelete = () => {
    setConfirmingId(null);
  };

  return (
    <>
    <Card className="border border-border/60 bg-card shadow-sm rounded-2xl">
      <CardHeader className="pb-2 pt-6 px-6 md:px-8">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <div className="p-1.5 rounded-lg bg-muted">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </div>
            {t("savedCards.title")}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={openAddModal}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("savedCards.addCard")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-6 md:px-8 pb-8 pt-2">
        {error && (
          <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        ) : cards.length === 0 ? (
          <div className="flex items-center gap-3 text-muted-foreground py-4">
            <CreditCard className="h-5 w-5 shrink-0" />
            <span className="text-sm">{t("savedCards.empty")}</span>
          </div>
        ) : (
          <div className="space-y-3">
            {cards.map((card) => (
              <div
                key={card.id}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <span className="text-sm font-medium">
                      {card.brand} {t("savedCards.masked")} {card.last4}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {t("savedCards.expires")}{" "}
                      {String(card.expMonth).padStart(2, "0")}/{card.expYear}
                      {card.isDefault && (
                        <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          {t("savedCards.default")}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {confirmingId === card.id ? (
                    <>
                      <span className="text-xs text-muted-foreground">{t("savedCards.confirmDelete")}</span>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleConfirmDelete(card.id)}
                        className="h-7 px-3 text-xs"
                      >
                        {t("savedCards.deleteButton")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelDelete}
                        className="h-7 px-3 text-xs"
                      >
                        {t("savedCards.cancelDelete")}
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteClick(card.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:border-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

    <AddCardModal
      open={showAddModal}
      onOpenChange={(open) => { if (!open) closeAddModal(); }}
      onSave={saveCardLocally}
    />
    </>
  );
};
