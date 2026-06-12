"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/features/ui/components/ui/dialog";
import { Input } from "@/features/ui/components/ui/input";
import { Button } from "@/features/ui/components/ui/button";

interface RenameProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  onRename: (name: string) => Promise<void> | void;
}

export function RenameProjectDialog({ open, onOpenChange, currentName, onRename }: RenameProjectDialogProps) {
  const t = useTranslations("Projects");
  const tCommon = useTranslations("Common");
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setName(currentName);
  }, [open, currentName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || loading || trimmed === currentName) return;

    setLoading(true);
    try {
      await onRename(trimmed);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (loading) return;
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("renameProject")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            autoFocus
            placeholder={t("projectNamePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={loading || !name.trim() || name.trim() === currentName}>
              {loading ? tCommon("saving") : tCommon("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
