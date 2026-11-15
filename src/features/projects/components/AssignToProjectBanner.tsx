"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Folder, FolderPlus, X, Check } from "lucide-react";
import { Button } from "@/features/ui/components/ui/button";
import { Input } from "@/features/ui/components/ui/input";
import { moveChatToProject } from "@/features/chatHistory";
import { createProject, getProjects } from "../services/projectService";
import type { Project } from "../types/types.Project";

interface Props {
  chatId: string;
  /** Current project of the translation; the banner is hidden when already set. */
  projectId?: string | null;
  onAssigned?: (projectId: string) => void;
}

const dismissKey = (chatId: string) => `assign-project-dismissed:${chatId}`;

export function AssignToProjectBanner({ chatId, projectId, onAssigned }: Props) {
  const t = useTranslations("Projects");
  const [projects, setProjects] = useState<Project[]>([]);
  const [dismissed, setDismissed] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [doneName, setDoneName] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let wasDismissed = false;
    try { wasDismissed = sessionStorage.getItem(dismissKey(chatId)) === "1"; } catch { /* ignore */ }
    setDismissed(wasDismissed);
    if (wasDismissed || projectId) return;
    getProjects().then((r) => setProjects(r.data ?? [])).catch(() => {});
  }, [chatId, projectId]);

  if (dismissed || (projectId && !doneName)) return null;

  const dismiss = () => {
    try { sessionStorage.setItem(dismissKey(chatId), "1"); } catch { /* ignore */ }
    setDismissed(true);
  };

  const assign = async (id: string, label: string) => {
    setBusy(true);
    setError(false);
    try {
      await moveChatToProject(chatId, id);
      setDoneName(label);
      onAssigned?.(id);
      window.dispatchEvent(new Event("translations-updated"));
      setTimeout(dismiss, 3000);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const createAndAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(false);
    try {
      const res = await createProject(trimmed);
      await assign(res.data.id, res.data.name);
    } catch {
      setError(true);
      setBusy(false);
    }
  };

  return (
    <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-4" role="region" aria-label={t("assignTitle")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 font-medium">
          {doneName ? <Check className="h-4 w-4 text-emerald-600" /> : <Folder className="h-4 w-4 text-primary" />}
          {doneName ? t("assignedTo", { name: doneName }) : t("assignTitle")}
        </div>
        <button type="button" onClick={dismiss} aria-label={t("assignSkip")} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {!doneName && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {projects.slice(0, 6).map((p) => (
            <Button key={p.id} size="sm" variant="outline" disabled={busy} onClick={() => assign(p.id, p.name)} className="gap-1.5">
              <Folder className="h-3.5 w-3.5" /> <span className="max-w-[160px] truncate">{p.name}</span>
            </Button>
          ))}
          {creating ? (
            <form onSubmit={createAndAssign} className="flex items-center gap-2">
              <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={t("projectNamePlaceholder")} className="h-8 w-48" disabled={busy} />
              <Button type="submit" size="sm" disabled={busy || !name.trim()}>{t("assignCreateAdd")}</Button>
            </form>
          ) : (
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => setCreating(true)} className="gap-1.5">
              <FolderPlus className="h-3.5 w-3.5" /> {t("assignNew")}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={dismiss} className="text-muted-foreground">{t("assignSkip")}</Button>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-destructive">{t("assignError")}</p>}
    </div>
  );
}
