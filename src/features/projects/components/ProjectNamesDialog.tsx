"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Building2, Loader2, Plus, User, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/features/ui/components/ui/dialog";
import { Input } from "@/features/ui/components/ui/input";
import { Button } from "@/features/ui/components/ui/button";
import type { NameTranslationType } from "@/features/translation/types/types.Translation";
import {
  deleteProjectName,
  getProjectNames,
  saveProjectNames,
} from "../services/projectService";
import type { ProjectNameTranslation } from "../types/types.Project";

interface ProjectNamesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

/**
 * Manage a project's consolidated name glossary: list, add, inline-edit, and delete the
 * name-rendering pairs that are auto-applied to every translation in the project.
 */
export function ProjectNamesDialog({ open, onOpenChange, projectId }: ProjectNamesDialogProps) {
  const t = useTranslations("ProjectNames");
  const tCommon = useTranslations("Common");

  const [rows, setRows] = useState<ProjectNameTranslation[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newOriginal, setNewOriginal] = useState("");
  const [newTranslation, setNewTranslation] = useState("");
  const [newType, setNewType] = useState<NameTranslationType>("Person");

  // Last-persisted translation per row id, so a blur only saves when the value actually changed.
  const savedMapRef = useRef<Record<string, string>>({});

  const applyRows = (data: ProjectNameTranslation[]) => {
    setRows(data);
    savedMapRef.current = Object.fromEntries(data.map((r) => [r.id, r.translation ?? ""]));
  };

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    getProjectNames(projectId)
      .then((data) => {
        if (active) applyRows(data);
      })
      .catch(() => {
        if (active) applyRows([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, projectId]);

  const handleAdd = async () => {
    const original = newOriginal.trim();
    const translation = newTranslation.trim();
    if (!original || !translation || saving) return;
    setSaving(true);
    try {
      const updated = await saveProjectNames(projectId, [{ original, translation, type: newType }]);
      applyRows(updated);
      setNewOriginal("");
      setNewTranslation("");
      setNewType("Person");
    } catch {
      // leave inputs intact so the user can retry
    } finally {
      setSaving(false);
    }
  };

  const updateRowTranslation = (id: string, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, translation: value } : r)));
  };

  const persistRowTranslation = async (row: ProjectNameTranslation, value: string) => {
    const translation = value.trim();
    if (!translation || translation === (savedMapRef.current[row.id] ?? "").trim()) return;
    try {
      const updated = await saveProjectNames(projectId, [
        { original: row.original, translation, type: row.type },
      ]);
      applyRows(updated);
    } catch {
      // keep the local edit; it will reconcile on next open
    }
  };

  const handleDelete = async (id: string) => {
    const previous = rows;
    setRows((prev) => prev.filter((r) => r.id !== id)); // optimistic
    try {
      await deleteProjectName(projectId, id);
      delete savedMapRef.current[id];
    } catch {
      setRows(previous); // revert on failure
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-4 flex max-h-[90vh] w-full flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder={t("originalPlaceholder")}
            value={newOriginal}
            onChange={(e) => setNewOriginal(e.target.value)}
            disabled={saving}
            className="min-w-0"
          />
          <span className="hidden shrink-0 text-muted-foreground sm:block">→</span>
          <Input
            placeholder={t("translationPlaceholder")}
            value={newTranslation}
            onChange={(e) => setNewTranslation(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
            disabled={saving}
            className="min-w-0"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => setNewType((p) => (p === "Person" ? "Organization" : "Person"))}
            title={newType === "Organization" ? t("organization") : t("person")}
            aria-label={newType === "Organization" ? t("organization") : t("person")}
          >
            {newType === "Organization" ? (
              <Building2 className="h-4 w-4" />
            ) : (
              <User className="h-4 w-4" />
            )}
          </Button>
          <Button
            type="button"
            onClick={handleAdd}
            disabled={saving || !newOriginal.trim() || !newTranslation.trim()}
            className="shrink-0 gap-1"
          >
            <Plus className="h-4 w-4" />
            {t("add")}
          </Button>
        </div>

        <div className="mt-2 flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            <div className="space-y-2">
              {rows.map((row) => {
                const isOrg = row.type === "Organization";
                return (
                  <div
                    key={row.id}
                    className="flex items-center gap-2 rounded-lg border border-border/60 bg-card p-2"
                  >
                    <span
                      className="inline-flex shrink-0 items-center rounded-md bg-muted px-2 py-1 text-muted-foreground"
                      title={isOrg ? t("organization") : t("person")}
                    >
                      {isOrg ? (
                        <Building2 className="h-3 w-3" />
                      ) : (
                        <User className="h-3 w-3" />
                      )}
                    </span>
                    <p
                      className="min-w-0 flex-1 truncate text-sm text-muted-foreground"
                      title={row.original}
                    >
                      {row.original}
                    </p>
                    <span className="shrink-0 text-muted-foreground">→</span>
                    <Input
                      className="min-w-0 flex-1"
                      value={row.translation}
                      onChange={(e) => updateRowTranslation(row.id, e.target.value)}
                      onBlur={(e) => persistRowTranslation(row, e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={tCommon("delete")}
                      onClick={() => handleDelete(row.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
