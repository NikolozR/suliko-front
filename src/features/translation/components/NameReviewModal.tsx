"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Building2, User, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/features/ui/components/ui/dialog";
import { Input } from "@/features/ui/components/ui/input";
import { Button } from "@/features/ui/components/ui/button";
import { NameTranslationItem } from "@/features/translation/types/types.Translation";

interface NameReviewModalProps {
  open: boolean;
  items: NameTranslationItem[];
  isSubmitting?: boolean;
  /** When true, copy reflects "new names being added to the project glossary". */
  isProjectContext?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (editedItems: NameTranslationItem[]) => void;
  onSkip: () => void;
}

const NameReviewModal: React.FC<NameReviewModalProps> = ({
  open,
  items,
  isSubmitting = false,
  isProjectContext = false,
  onOpenChange,
  onConfirm,
  onSkip,
}) => {
  const t = useTranslations("NameReviewModal");

  const title = isProjectContext ? t("projectTitle") : t("title");
  const description = isProjectContext ? t("projectDescription") : t("description");
  const skipLabel = isProjectContext ? t("projectSkip") : t("skip");
  const confirmLabel = isProjectContext ? t("projectConfirm") : t("confirm");

  const [rows, setRows] = useState<NameTranslationItem[]>(items);

  useEffect(() => {
    if (open) {
      setRows(items);
    }
  }, [open, items]);

  const updateTranslation = (index: number, value: string) => {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, translation: value } : row
      )
    );
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    const confirmed = rows.filter(
      (row) => row.original.trim() && row.translation.trim()
    );

    onConfirm(confirmed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-4 flex max-h-[90vh] w-full flex-col overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("emptyState")}
          </p>
        ) : (
          <div className="mt-4 flex-1 overflow-y-auto pr-1">
            <div className="space-y-3">
              {rows.map((row, index) => {
                const isOrg = row.type === "Organization";

                return (
                  <div
                    key={`${row.original}-${index}`}
                    className="rounded-lg border border-border/60 bg-card p-3"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                      <div className="flex min-w-0 flex-1 items-start gap-2">
                        <span
                          className="inline-flex shrink-0 items-center gap-1 rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground"
                          title={
                            isOrg ? t("organization") : t("person")
                          }
                        >
                          {isOrg ? (
                            <Building2 className="h-3 w-3" />
                          ) : (
                            <User className="h-3 w-3" />
                          )}

                          <span>
                            {isOrg
                              ? t("organization")
                              : t("person")}
                          </span>
                        </span>

                        <div className="min-w-0 flex-1">
                          <p
                            className="break-words whitespace-pre-wrap text-sm text-muted-foreground"
                            title={row.original}
                          >
                            {row.original}
                          </p>
                        </div>
                      </div>

                      <div className="hidden shrink-0 text-muted-foreground lg:block">
                        →
                      </div>

                      <div className="flex min-w-0 flex-1 items-start gap-2">
                        <Input
                          value={row.translation}
                          onChange={(e) =>
                            updateTranslation(
                              index,
                              e.target.value
                            )
                          }
                          placeholder={t(
                            "translationPlaceholder"
                          )}
                          className="min-w-0"
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeRow(index)}
                          aria-label={t("remove")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter className="mt-4 flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onSkip}
            disabled={isSubmitting}
          >
            {skipLabel}
          </Button>

          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? t("translating")
              : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NameReviewModal;