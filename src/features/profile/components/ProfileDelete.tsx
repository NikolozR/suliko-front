"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/features/ui/components/ui/card";
import { Button } from "@/features/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/features/ui/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { deleteAccount } from "@/features/auth/services/userService";
import { useUserStore } from "@/features/auth/store/userStore";
import { useAuthStore } from "@/features/auth/store/authStore";
import ErrorAlert from "@/shared/components/ErrorAlert";

export const ProfileDeleteAccount: React.FC = () => {
  const t = useTranslations("Profile");
  const { token } = useAuthStore();
  const { userProfile } = useUserStore();

  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!userProfile || !token) {
      setError("მომხმარებლის მონაცემები ვერ მოიძებნა");
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAccount(userProfile.id);

      // You MUST clear auth state here in real life.
      // Redirecting alone is not enough.
      window.location.href = "/";
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "ანგარიშის წაშლა ვერ მოხერხდა";
      setError(msg);
    } finally {
      setIsDeleting(false);
      setOpen(false);
    }
  };

  return (
    <>
      <Card className="border border-border/60 bg-card shadow-sm rounded-2xl">
        <CardHeader className="pb-2 pt-6 px-6 md:px-8">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <div className="p-1.5 rounded-lg bg-destructive/10">
              <Trash2 className="h-4 w-4 text-destructive" />
            </div>
            {t("deleteAccount")}
          </CardTitle>
        </CardHeader>

        <CardContent className="px-6 md:px-8 pb-8 pt-2 space-y-4">
          {error && (
            <ErrorAlert message={error} onClose={() => setError(null)} />
          )}

          <p className="text-sm text-muted-foreground">
            {t("deleteAccountWarning")}
          </p>

          <Button
            onClick={() => setOpen(true)}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t("deleteAccount")}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-600">
              {t("deleteAccount")}
            </DialogTitle>
            <DialogDescription>
              {t("deleteAccountConfirm")}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isDeleting}
            >
              {t("cancel")}
            </Button>

            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? t("deleting") : t("confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
