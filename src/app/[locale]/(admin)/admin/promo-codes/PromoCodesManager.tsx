"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ChevronDown, ChevronRight, Copy, Link2, Plus, Shuffle } from "lucide-react";
import {
  createPromoCode,
  getPromoCodeRedemptions,
  listPromoCodes,
  updatePromoCode,
} from "@/features/promoCodes/services/promoCodeService";
import type { PromoCode, PromoCodeRedemption, PromoCodeType } from "@/features/promoCodes/types";

const TZ = "Asia/Tbilisi";
// Same look-alike-free alphabet the API uses when it generates a code.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** A date picked in the admin panel means "valid through the end of that day, Tbilisi time". */
function endOfDayTbilisi(date: string): string {
  return new Date(`${date}T23:59:59+04:00`).toISOString();
}

function toTbilisiDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: TZ });
}

function generateCode(): string {
  const bytes = new Uint32Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

const card: React.CSSProperties = {
  background: "#13151f",
  border: "1px solid #2a2d3a",
  borderRadius: 12,
  padding: "20px 24px",
};

const label: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 6,
};

const input: React.CSSProperties = {
  width: "100%",
  background: "#0f1117",
  border: "1px solid #2a2d3a",
  borderRadius: 8,
  padding: "9px 12px",
  color: "#f8fafc",
  fontSize: 14,
  outline: "none",
  colorScheme: "dark",
};

const ghostButton: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "5px 10px",
  background: "transparent",
  border: "1px solid #2a2d3a",
  borderRadius: 6,
  color: "#94a3b8",
  fontSize: 12,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const primaryButton: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  background: "#f59e0b",
  color: "#0f1117",
  border: "none",
  padding: "10px 18px",
  borderRadius: 8,
  fontFamily: "'Syne', sans-serif",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      style={{
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.25)",
        borderRadius: 10,
        padding: "12px 16px",
        color: "#fca5a5",
        fontSize: 13,
        marginBottom: 16,
      }}
    >
      {message}
    </div>
  );
}

function TypeBadge({ type }: { type: PromoCodeType }) {
  const referral = type === "Referral";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        background: referral ? "rgba(96,165,250,0.12)" : "rgba(251,191,36,0.12)",
        color: referral ? "#93c5fd" : "#fbbf24",
        border: `1px solid ${referral ? "rgba(96,165,250,0.3)" : "rgba(251,191,36,0.3)"}`,
      }}
    >
      {referral ? "Referral" : "Coupon"}
    </span>
  );
}

function StatusToggle({ code, busy, onToggle }: { code: PromoCode; busy: boolean; onToggle: () => void }) {
  const on = code.isActive;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button
        onClick={onToggle}
        disabled={busy}
        title={on ? "Turn off" : "Turn on"}
        aria-pressed={on}
        style={{
          position: "relative",
          width: 36,
          height: 20,
          borderRadius: 999,
          border: "none",
          background: on ? "#22c55e" : "#334155",
          cursor: busy ? "wait" : "pointer",
          opacity: busy ? 0.6 : 1,
          transition: "background 0.15s",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: on ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#f8fafc",
            transition: "left 0.15s",
          }}
        />
      </button>
      {code.isExpired ? (
        <span style={{ fontSize: 12, color: "#f87171" }}>Expired</span>
      ) : (
        <span style={{ fontSize: 12, color: on ? "#4ade80" : "#64748b" }}>{on ? "On" : "Off"}</span>
      )}
    </div>
  );
}

function CreateForm({ onCreated }: { onCreated: (code: PromoCode) => void }) {
  const [type, setType] = useState<PromoCodeType>("Coupon");
  const [code, setCode] = useState("");
  const [amount, setAmount] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = toTbilisiDate(new Date().toISOString());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const pages = Number(amount);
    if (!Number.isFinite(pages) || pages <= 0) return setError("Pages must be a positive number.");
    if (!expiresOn) return setError("Pick an expiration date.");

    setSaving(true);
    try {
      const created = await createPromoCode({
        code: code.trim() || undefined,
        type,
        amount: pages,
        expiresAt: endOfDayTbilisi(expiresOn),
      });
      onCreated(created);
      setCode("");
      setAmount("");
      setExpiresOn("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create code");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ ...card, marginBottom: 32 }}>
      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>New code</div>
      <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 18px" }}>
        {type === "Referral"
          ? "Entered at sign-up. Adds pages to the new user's balance."
          : "Entered by an existing user from the balance page. Each user can use it once."}
      </p>

      {error && <ErrorBox message={error} />}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, alignItems: "end" }}>
        <div>
          <span style={label}>Type</span>
          <div style={{ display: "flex", background: "#0f1117", border: "1px solid #2a2d3a", borderRadius: 8, padding: 3 }}>
            {(["Coupon", "Referral"] as PromoCodeType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                aria-pressed={type === t}
                style={{
                  flex: 1,
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "none",
                  background: type === t ? "#f59e0b" : "transparent",
                  color: type === t ? "#0f1117" : "#94a3b8",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={label} htmlFor="promo-code">Code</label>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              id="promo-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))}
              placeholder="Auto-generate"
              maxLength={32}
              autoComplete="off"
              style={{ ...input, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em" }}
            />
            <button type="button" onClick={() => setCode(generateCode())} title="Generate a random code" style={{ ...ghostButton, padding: "0 10px" }}>
              <Shuffle size={14} />
            </button>
          </div>
        </div>

        <div>
          <label style={label} htmlFor="promo-amount">Pages</label>
          <input
            id="promo-amount"
            type="number"
            min={1}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 20"
            style={input}
          />
        </div>

        <div>
          <label style={label} htmlFor="promo-expires">Expires on</label>
          <input
            id="promo-expires"
            type="date"
            min={today}
            value={expiresOn}
            onChange={(e) => setExpiresOn(e.target.value)}
            style={input}
          />
        </div>

        <button type="submit" disabled={saving} style={{ ...primaryButton, justifyContent: "center", opacity: saving ? 0.6 : 1 }}>
          <Plus size={14} />
          {saving ? "Creating…" : "Create"}
        </button>
      </div>
      <p style={{ color: "#475569", fontSize: 12, margin: "12px 0 0" }}>
        Valid through the end of the chosen day (Tbilisi time). Leave the code empty to generate one.
      </p>
    </form>
  );
}

function DetailsPanel({ code, onUpdated }: { code: PromoCode; onUpdated: (code: PromoCode) => void }) {
  const [redemptions, setRedemptions] = useState<PromoCodeRedemption[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [amount, setAmount] = useState(String(code.amount));
  const [expiresOn, setExpiresOn] = useState(toTbilisiDate(code.expiresAt));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    getPromoCodeRedemptions(code.id)
      .then(setRedemptions)
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Failed to load"));
  }, [code.id]);

  const dirty = Number(amount) !== code.amount || expiresOn !== toTbilisiDate(code.expiresAt);

  const save = async () => {
    setSaveError(null);
    const pages = Number(amount);
    if (!Number.isFinite(pages) || pages <= 0) return setSaveError("Pages must be a positive number.");
    setSaving(true);
    try {
      onUpdated(await updatePromoCode(code.id, { amount: pages, expiresAt: endOfDayTbilisi(expiresOn) }));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "16px 12px 20px 40px", background: "#0f1117", borderBottom: "1px solid #1a1d28" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 18 }}>
        <div style={{ width: 120 }}>
          <span style={label}>Pages</span>
          <input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} style={input} aria-label="Pages" />
        </div>
        <div style={{ width: 170 }}>
          <span style={label}>Expires on</span>
          <input type="date" value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} style={input} aria-label="Expires on" />
        </div>
        <button onClick={save} disabled={!dirty || saving} style={{ ...primaryButton, padding: "9px 16px", opacity: !dirty || saving ? 0.4 : 1 }}>
          {saving ? "Saving…" : "Save"}
        </button>
        <span style={{ fontSize: 12, color: "#475569" }}>Changing pages only affects future uses.</span>
      </div>
      {saveError && <ErrorBox message={saveError} />}

      <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
        Used by
      </div>
      {loadError && <ErrorBox message={loadError} />}
      {!loadError && redemptions === null && <div style={{ color: "#64748b", fontSize: 13 }}>Loading…</div>}
      {redemptions?.length === 0 && <div style={{ color: "#64748b", fontSize: 13 }}>Nobody has used this code yet.</div>}
      {redemptions && redemptions.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <tbody>
            {redemptions.map((r) => {
              const name = [r.firstName, r.lastName].filter(Boolean).join(" ");
              return (
                <tr key={`${r.userId}-${r.redeemedAt}`} style={{ borderTop: "1px solid #1a1d28" }}>
                  <td style={{ padding: "8px 0", color: "#f1f5f9" }}>{name || r.userName || r.userId}</td>
                  <td style={{ padding: "8px 12px", color: "#94a3b8" }}>{r.email && !r.email.endsWith("@example.com") ? r.email : r.userName}</td>
                  <td style={{ padding: "8px 12px", color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}>+{r.amount}</td>
                  <td style={{ padding: "8px 0", color: "#64748b", textAlign: "right" }}>
                    {new Date(r.redeemedAt).toLocaleString("en-GB", { timeZone: TZ, dateStyle: "medium", timeStyle: "short" })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function PromoCodesManager() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const [codes, setCodes] = useState<PromoCode[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(() => {
    listPromoCodes()
      .then((data) => {
        setCodes(data);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load promo codes"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const replace = (updated: PromoCode) =>
    setCodes((prev) => (prev ? prev.map((c) => (c.id === updated.id ? updated : c)) : prev));

  const toggle = async (code: PromoCode) => {
    setToggling(code.id);
    try {
      replace(await updatePromoCode(code.id, { isActive: !code.isActive }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setToggling(null);
    }
  };

  const copy = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 30, letterSpacing: "-0.02em", margin: 0 }}>
          Promo Codes
        </h1>
        <p style={{ color: "#64748b", marginTop: 6, fontSize: 14 }}>
          Referral codes for new sign-ups and coupons for existing users. Both add pages to the balance.
        </p>
      </div>

      <CreateForm onCreated={(c) => setCodes((prev) => [c, ...(prev ?? [])])} />

      {error && <ErrorBox message={error} />}

      {codes === null && !error && <div style={{ color: "#64748b", fontSize: 14 }}>Loading…</div>}

      {codes?.length === 0 && (
        <div style={{ color: "#64748b", padding: "32px 0", textAlign: "center", fontSize: 14 }}>
          No codes yet. Create your first one above.
        </div>
      )}

      {codes && codes.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 760 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2a2d3a" }}>
                {["", "Code", "Type", "Pages", "Expires", "Used", "Status"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      color: "#64748b",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      fontSize: 11,
                      letterSpacing: "0.07em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => {
                const open = expanded === c.id;
                const signUpLink = `${typeof window !== "undefined" ? window.location.origin : ""}/${locale}/sign-in?ref=${c.code}`;
                return (
                  <React.Fragment key={c.id}>
                    <tr style={{ borderBottom: open ? "none" : "1px solid #1a1d28", opacity: c.isActive && !c.isExpired ? 1 : 0.6 }}>
                      <td style={{ padding: "12px 4px 12px 12px", width: 28 }}>
                        <button
                          onClick={() => setExpanded(open ? null : c.id)}
                          aria-expanded={open}
                          aria-label={open ? "Hide details" : "Show details"}
                          style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", display: "flex", padding: 2 }}
                        >
                          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, color: "#f8fafc", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                            {c.code}
                          </span>
                          <button onClick={() => copy(`${c.id}-code`, c.code)} style={ghostButton} title="Copy code">
                            <Copy size={12} />
                            {copied === `${c.id}-code` ? "Copied" : "Copy"}
                          </button>
                          {c.type === "Referral" && (
                            <button onClick={() => copy(`${c.id}-link`, signUpLink)} style={ghostButton} title="Copy sign-up link with this code">
                              <Link2 size={12} />
                              {copied === `${c.id}-link` ? "Copied" : "Link"}
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <TypeBadge type={c.type} />
                      </td>
                      <td style={{ padding: "12px", color: "#f1f5f9", fontFamily: "'JetBrains Mono', monospace" }}>{c.amount}</td>
                      <td style={{ padding: "12px", color: c.isExpired ? "#f87171" : "#94a3b8", whiteSpace: "nowrap" }}>{formatDate(c.expiresAt)}</td>
                      <td style={{ padding: "12px", color: "#94a3b8", whiteSpace: "nowrap" }}>
                        {c.redemptionCount}
                        {c.redemptionCount > 0 && <span style={{ color: "#475569" }}> · {c.totalCredited} pages</span>}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <StatusToggle code={c} busy={toggling === c.id} onToggle={() => toggle(c)} />
                      </td>
                    </tr>
                    {open && (
                      <tr>
                        <td colSpan={7} style={{ padding: 0 }}>
                          <DetailsPanel code={c} onUpdated={replace} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
