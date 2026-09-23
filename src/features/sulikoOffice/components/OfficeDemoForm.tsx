"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import { trackDemoRequest } from "@/shared/utils/metaPixel";
import { GHOST_BUTTON, PRIMARY_BUTTON } from "./tones";

type Status = "idle" | "sending" | "sent";

const FIELD =
  "rounded-[10px] border border-border bg-background text-base text-foreground focus:border-suliko-default-color focus:outline-2 focus:outline-offset-1 focus:outline-suliko-default-color";
const LABEL = "flex flex-col gap-2 text-[15px] text-foreground";

const TEAM_OPTIONS = ["t1", "t2", "t3", "t4"] as const;
const ORDER_OPTIONS = ["o1", "o2", "o3", "o4"] as const;

export default function OfficeDemoForm() {
  const t = useTranslations("SulikoOffice.form");
  const locale = useLocale();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;

    if (!data.name?.trim() || !data.company?.trim() || !data.email?.trim()) {
      setError(t("errorRequired"));
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(data.email.trim())) {
      setError(t("errorEmail"));
      return;
    }

    setStatus("sending");
    setError(null);

    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, locale }),
      });

      if (res.ok) {
        // Only an accepted request counts as a lead.
        trackDemoRequest();
        form.reset();
        setStatus("sent");
        return;
      }

      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(
        res.status === 429
          ? t("errorRateLimited")
          : body.error === "invalid_email"
            ? t("errorEmail")
            : t("errorGeneric")
      );
    } catch {
      setError(t("errorGeneric"));
    }
    setStatus("idle");
  }

  if (status === "sent") {
    return (
      <div role="status" className="flex min-h-[420px] flex-col items-center justify-center gap-[18px] text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e7f6ec] dark:bg-emerald-400/15">
          <Check className="h-8 w-8 text-[#1e7440] dark:text-emerald-300" aria-hidden />
        </span>
        <h3 className="text-[28px] leading-tight text-foreground">{t("okTitle")}</h3>
        <p className="max-w-[420px] text-[17px] leading-[1.55] text-muted-foreground">{t("okBody")}</p>
        <button type="button" onClick={() => setStatus("idle")} className={`${GHOST_BUTTON} h-[46px] px-5 text-[15px]`}>
          {t("again")}
        </button>
      </div>
    );
  }

  const sending = status === "sending";

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
      <label className={LABEL}>
        {t("name")}
        <input type="text" name="name" autoComplete="name" required maxLength={100} className={`${FIELD} h-[50px] px-3.5`} />
      </label>
      <label className={LABEL}>
        {t("company")}
        <input type="text" name="company" autoComplete="organization" required maxLength={150} className={`${FIELD} h-[50px] px-3.5`} />
      </label>
      <label className={LABEL}>
        {t("email")}
        <input type="email" name="email" autoComplete="email" required maxLength={200} className={`${FIELD} h-[50px] px-3.5`} />
      </label>
      <label className={LABEL}>
        {t("phone")}
        <input type="tel" name="phone" autoComplete="tel" placeholder="+995" maxLength={40} className={`${FIELD} h-[50px] px-3.5`} />
      </label>
      <label className={LABEL}>
        {t("team")}
        <select name="team" defaultValue="" className={`${FIELD} h-[50px] px-3`}>
          <option value="">{t("select")}</option>
          {TEAM_OPTIONS.map((key) => (
            <option key={key} value={key}>
              {t(key)}
            </option>
          ))}
        </select>
      </label>
      <label className={LABEL}>
        {t("orders")}
        <select name="orders" defaultValue="" className={`${FIELD} h-[50px] px-3`}>
          <option value="">{t("select")}</option>
          {ORDER_OPTIONS.map((key) => (
            <option key={key} value={key}>
              {t(key)}
            </option>
          ))}
        </select>
      </label>
      <label className={`${LABEL} sm:col-span-2`}>
        {t("message")}
        <textarea
          name="message"
          rows={4}
          maxLength={2000}
          placeholder={t("messagePh")}
          className={`${FIELD} resize-y px-3.5 py-3 leading-normal`}
        />
      </label>

      {/* Honeypot: off-screen and skipped by keyboard and screen readers, so only bots fill it. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          {t("honeypot")}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {error && (
        <p role="alert" className="text-[15px] text-red-600 sm:col-span-2 dark:text-red-400">
          {error}
        </p>
      )}

      <button type="submit" disabled={sending} className={`${PRIMARY_BUTTON} h-14 text-lg disabled:opacity-70 sm:col-span-2`}>
        {sending && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
        {sending ? t("sending") : t("submit")}
      </button>
      <p className="text-center text-sm text-muted-foreground sm:col-span-2">{t("note")}</p>
    </form>
  );
}
