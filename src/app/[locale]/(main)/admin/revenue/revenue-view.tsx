"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  getRevenueTrend,
  listAllPayments,
  paymentsCsv,
  type AdminPaymentsPage,
  type PaymentFilters,
  type RevenueGranularity,
  type RevenueTrend,
} from "@/features/adminRevenue/services/adminRevenueService";
import { money } from "../payment-history";

const PAGE_SIZE = 50;

const STATUS: Record<string, { label: string; color: string }> = {
  succeeded: { label: "Paid", color: "var(--status-success)" },
  failed: { label: "Failed", color: "var(--destructive)" },
  refunded: { label: "Refunded", color: "var(--status-warning)" },
  created: { label: "Not finished", color: "var(--muted-foreground)" },
  pending: { label: "Pending", color: "var(--muted-foreground)" },
};

const card: React.CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "16px 18px",
};
const field: React.CSSProperties = {
  background: "var(--card)",
  color: "var(--foreground)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "6px 10px",
  fontSize: 13,
  colorScheme: "light dark",
};
const label: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--muted-foreground)" };
const h2: React.CSSProperties = { fontFamily: "inherit", fontWeight: 700, fontSize: 18, color: "var(--foreground)", margin: "0 0 12px" };

const isoToday = () => new Date().toISOString().slice(0, 10);

function when(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  });
}

function periodLabel(day: string, granularity: RevenueGranularity, long: boolean) {
  const d = new Date(day);
  if (granularity === "month") {
    return d.toLocaleDateString("en-GB", { month: long ? "long" : "short", year: long ? "numeric" : "2-digit", timeZone: "UTC" });
  }
  const start = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  return long ? `Week of ${start}` : start;
}

function niceCeil(n: number) {
  if (n <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(n));
  for (const step of [1, 2, 2.5, 5, 10]) if (step * pow >= n) return step * pow;
  return 10 * pow;
}

function Bars({ trend, currency }: { trend: RevenueTrend; currency: string }) {
  const width = 900;
  const height = 260;
  const pad = { top: 22, right: 12, bottom: 34, left: 52 };
  const values = trend.points.map((p) => p.revenue.find((r) => r.currency === currency)?.amount ?? 0);
  const top = niceCeil(Math.max(1, ...values));
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const slot = innerW / Math.max(1, trend.points.length);
  const barW = Math.min(46, slot * 0.64);
  const labelEvery = Math.max(1, Math.ceil(trend.points.length / 14));
  const showValues = trend.points.length <= 18;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(top * t));
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Revenue in ${currency} per ${trend.granularity}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {ticks.map((t) => {
        const y = pad.top + innerH - (t / top) * innerH;
        return (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="var(--border)" />
            <text x={pad.left - 8} y={y + 4} textAnchor="end" fontSize={11} fill="var(--muted-foreground)">{t.toLocaleString()}</text>
          </g>
        );
      })}
      {trend.points.map((p, i) => {
        const v = values[i];
        const h = (v / top) * innerH;
        const x = pad.left + slot * i + (slot - barW) / 2;
        const y = pad.top + innerH - h;
        return (
          <g key={p.periodStart}>
            <title>{`${periodLabel(p.periodStart, trend.granularity, true)}: ${money(v, currency)}`}</title>
            <rect x={x} y={y} width={barW} height={Math.max(h, v > 0 ? 1 : 0)} rx={3} fill="var(--accent-text)" opacity={i === trend.points.length - 1 ? 0.55 : 1} />
            {showValues && v > 0 && (
              <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize={11} fill="var(--foreground)">{Math.round(v).toLocaleString()}</text>
            )}
            {i % labelEvery === 0 && (
              <text x={x + barW / 2} y={height - 12} textAnchor="middle" fontSize={11} fill="var(--muted-foreground)">{periodLabel(p.periodStart, trend.granularity, false)}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function Segmented<T extends string>({ value, options, onChange, name }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; name: string }) {
  return (
    <div role="group" aria-label={name} style={{ display: "inline-flex", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} type="button" aria-pressed={on} onClick={() => onChange(o.value)}
            style={{ padding: "6px 14px", fontSize: 13, cursor: "pointer", border: "none", background: on ? "var(--accent-text)" : "var(--card)", color: on ? "var(--card)" : "var(--foreground)", fontWeight: on ? 600 : 400 }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Revenue per week or month, one currency at a time (EUR is never added to GEL). */
function TrendSection({ includeInternal }: { includeInternal: boolean }) {
  const [granularity, setGranularity] = useState<RevenueGranularity>("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [currency, setCurrency] = useState("GEL");
  const [trend, setTrend] = useState<RevenueTrend | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const today = isoToday();
  const invalid = Boolean(from && to && from > to);

  useEffect(() => {
    if (invalid) return;
    let live = true;
    setLoading(true);
    setError(null);
    getRevenueTrend(granularity, from, to, includeInternal)
      .then((t) => live && setTrend(t))
      .catch((e: unknown) => live && setError(e instanceof Error ? e.message : "Failed to load the revenue trend"))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [granularity, from, to, includeInternal, invalid]);

  const shown = trend?.currencies.includes(currency) ? currency : (trend?.currencies[0] ?? "GEL");
  const points = trend?.points ?? [];
  const sum = (c: string) => points.reduce((s, p) => s + (p.revenue.find((r) => r.currency === c)?.amount ?? 0), 0);
  const running = points.length > 0;

  return (
    <section style={{ marginBottom: 32 }} aria-labelledby="revenue-trend">
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <h2 id="revenue-trend" style={{ ...h2, margin: 0 }}>Revenue trend</h2>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
          <Segmented name="Group by" value={granularity} onChange={setGranularity} options={[{ value: "week", label: "Weeks" }, { value: "month", label: "Months" }]} />
          {trend && trend.currencies.length > 1 && (
            <Segmented name="Currency" value={shown} onChange={setCurrency} options={trend.currencies.map((c) => ({ value: c, label: c }))} />
          )}
          <label style={label}>From<input type="date" value={from} max={to || today} onChange={(e) => setFrom(e.target.value)} style={field} /></label>
          <label style={label}>To<input type="date" value={to} min={from || undefined} max={today} onChange={(e) => setTo(e.target.value)} style={field} /></label>
          <button type="button" onClick={() => { setFrom(""); setTo(""); }} style={{ ...field, cursor: "pointer" }}>Last 12 {granularity}s</button>
        </div>
      </div>
      {invalid && <p role="alert" style={{ color: "var(--destructive)", fontSize: 13 }}>The start date is after the end date.</p>}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8, fontSize: 13, color: "var(--muted-foreground)" }}>
          <span>Confirmed payments in {shown} per {granularity}</span>
          <span>{loading ? "Loading..." : running ? `Total in range: ${money(sum(shown), shown)}` : ""}</span>
        </div>
        {error ? (
          <p role="alert" style={{ color: "var(--destructive)", fontSize: 14, margin: "24px 0" }}>{error}</p>
        ) : trend && points.length > 0 ? (
          <div style={{ opacity: loading ? 0.5 : 1, transition: "opacity 0.15s" }}><Bars trend={trend} currency={shown} /></div>
        ) : !loading ? (
          <p style={{ color: "var(--muted-foreground)", fontSize: 14, margin: "24px 0" }}>No data for this range.</p>
        ) : null}
      </div>
    </section>
  );
}

const STATUS_OPTIONS = [
  { value: "confirmed", label: "Paid only" },
  { value: "all", label: "Every attempt" },
  { value: "failed", label: "Failed" },
  { value: "created", label: "Not finished" },
  { value: "pending", label: "Pending" },
  { value: "refunded", label: "Refunded" },
];

/** Revenue: what has come in over time, and every payment behind it. */
export default function RevenueView({ includeInternal }: { includeInternal: boolean }) {
  const [status, setStatus] = useState("confirmed");
  const [currency, setCurrency] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [typed, setTyped] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminPaymentsPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const today = isoToday();
  const invalid = Boolean(from && to && from > to);

  const filters = useMemo<PaymentFilters>(
    () => ({ status, currency, from, to, search, includeInternal }),
    [status, currency, from, to, search, includeInternal],
  );

  // The search waits for a pause in typing, and any filter change starts from page 1.
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(typed);
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [typed]);

  useEffect(() => {
    if (invalid) return;
    let live = true;
    setLoading(true);
    setError(null);
    listAllPayments(filters, page, PAGE_SIZE)
      .then((r) => live && setData(r))
      .catch((e: unknown) => live && setError(e instanceof Error ? e.message : "Failed to load payments"))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [filters, page, invalid]);

  const change = (apply: () => void) => {
    apply();
    setPage(1);
  };

  const exportCsv = async () => {
    setExporting(true);
    setNote(null);
    try {
      const { csv, truncated } = await paymentsCsv(filters);
      const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `payments-${isoToday()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      if (truncated) setNote("The file holds the newest 20,000 payments; narrow the dates to get the rest.");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "The export failed.");
    } finally {
      setExporting(false);
    }
  };

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const failed = data?.byStatus.failed ?? 0;
  const unfinished = (data?.byStatus.created ?? 0) + (data?.byStatus.pending ?? 0);
  const paidCount = data?.byStatus.succeeded ?? 0;
  const th: React.CSSProperties = { textAlign: "left", fontSize: 11, color: "var(--muted-foreground)", padding: "4px 14px 6px 0", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" };
  const td: React.CSSProperties = { padding: "8px 14px 8px 0", fontSize: 13, color: "var(--foreground)", whiteSpace: "nowrap" };
  const mono: React.CSSProperties = { fontFamily: "ui-monospace, monospace", fontSize: 12 };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "inherit", fontWeight: 800, fontSize: 30, color: "var(--foreground)", letterSpacing: "-0.02em", margin: 0 }}>Revenue</h1>
        <p style={{ color: "var(--muted-foreground)", marginTop: 6, fontSize: 14 }}>
          Card payments the bank confirmed, and every attempt behind them.{" "}
          {includeInternal ? "Our own accounts are included." : "Our own accounts are left out."}{" "}
          <a href={includeInternal ? "?" : "?internal=show"} style={{ color: "var(--accent-text)" }}>
            {includeInternal ? "Hide our accounts" : "Show our accounts"}
          </a>
        </p>
      </div>

      <TrendSection includeInternal={includeInternal} />

      <section aria-labelledby="all-payments">
        <h2 id="all-payments" style={h2}>All payments</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, marginBottom: 16 }}>
          {(data?.confirmed.length ? data.confirmed : [{ currency: "GEL", amount: 0, payments: 0 }]).map((c) => (
            <div key={c.currency} style={{ ...card, borderLeft: "3px solid var(--accent-text)" }}>
              <div style={{ fontSize: 12, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Confirmed {c.currency}</div>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 26 }}>{money(c.amount, c.currency)}</div>
              <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 6 }}>
                {c.payments.toLocaleString()} payments, average {c.payments ? money(c.amount / c.payments, c.currency) : "–"}
              </div>
            </div>
          ))}
          <div style={card}>
            <div style={{ fontSize: 12, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Attempts</div>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 26 }}>{(paidCount + failed + unfinished + (data?.byStatus.refunded ?? 0)).toLocaleString()}</div>
            <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 6 }}>
              {paidCount.toLocaleString()} paid, {failed.toLocaleString()} failed, {unfinished.toLocaleString()} not finished
            </div>
          </div>
        </div>
        <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: "-6px 0 12px" }}>
          These figures follow the dates, currency and search below, not the status.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <label style={label}>Show
            <select value={status} onChange={(e) => change(() => setStatus(e.target.value))} style={field}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label style={label}>Currency
            <select value={currency} onChange={(e) => change(() => setCurrency(e.target.value))} style={field}>
              <option value="">All</option>
              <option value="GEL">GEL</option>
              <option value="EUR">EUR</option>
            </select>
          </label>
          <label style={label}>From<input type="date" value={from} max={to || today} onChange={(e) => change(() => setFrom(e.target.value))} style={field} /></label>
          <label style={label}>To<input type="date" value={to} min={from || undefined} max={today} onChange={(e) => change(() => setTo(e.target.value))} style={field} /></label>
          <input type="search" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Name, email or order id" aria-label="Search payments" style={{ ...field, minWidth: 220 }} />
          <button type="button" onClick={exportCsv} disabled={exporting || invalid} style={{ ...field, cursor: exporting ? "wait" : "pointer", marginLeft: "auto" }}>
            {exporting ? "Preparing..." : "Export CSV"}
          </button>
        </div>
        {invalid && <p role="alert" style={{ color: "var(--destructive)", fontSize: 13 }}>The start date is after the end date.</p>}
        {note && <p role="status" style={{ color: "var(--muted-foreground)", fontSize: 13 }}>{note}</p>}

        <div style={{ ...card, padding: "12px 16px" }}>
          {error ? (
            <p role="alert" style={{ color: "var(--destructive)", fontSize: 14, margin: "16px 0" }}>{error}</p>
          ) : !data ? (
            <p style={{ color: "var(--muted-foreground)", fontSize: 14, margin: "16px 0" }}>Loading...</p>
          ) : data.items.length === 0 ? (
            <p style={{ color: "var(--muted-foreground)", fontSize: 14, margin: "16px 0" }}>No payments match.</p>
          ) : (
            <div style={{ overflowX: "auto", opacity: loading ? 0.5 : 1, transition: "opacity 0.15s" }}>
              <table style={{ borderCollapse: "collapse", minWidth: 760, width: "100%" }}>
                <thead>
                  <tr>
                    {["When (UTC)", "Who", "Amount", "Pages", "Status", "Order", "Via"].map((h) => (
                      <th key={h} style={{ ...th, textAlign: h === "Amount" || h === "Pages" ? "right" : "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((p) => {
                    const s = STATUS[p.status] ?? { label: p.status, color: "var(--muted-foreground)" };
                    return (
                      <tr key={p.orderId} style={{ borderTop: "1px solid var(--muted)" }}>
                        <td style={{ ...td, ...mono, color: "var(--muted-foreground)" }}>{when(p.createdAt)}</td>
                        <td style={td}>
                          {p.userName || p.email || "–"}
                          {p.userName && p.email && <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{p.email}</div>}
                        </td>
                        <td style={{ ...td, ...mono, textAlign: "right" }}>{money(p.amount, p.currency)}</td>
                        <td style={{ ...td, ...mono, textAlign: "right" }}>{p.pages !== null ? p.pages.toLocaleString("en-US") : "–"}</td>
                        <td style={td}>
                          <span style={{ background: `color-mix(in srgb, ${s.color} 12%, transparent)`, color: s.color, borderRadius: 4, padding: "2px 7px", fontSize: 11, fontWeight: 600 }}>{s.label}</span>
                        </td>
                        <td style={{ ...td, ...mono, fontSize: 11, color: "var(--muted-foreground)", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }} title={p.orderId}>{p.orderId}</td>
                        <td style={{ ...td, color: "var(--muted-foreground)", fontSize: 12 }}>{p.provider}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {data && data.total > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 12, fontSize: 13, color: "var(--muted-foreground)" }}>
              <span>
                {((page - 1) * data.pageSize + 1).toLocaleString()} to {Math.min(page * data.pageSize, data.total).toLocaleString()} of {data.total.toLocaleString()}
              </span>
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button type="button" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)} style={{ ...field, cursor: page <= 1 ? "default" : "pointer" }}>Previous</button>
                Page {page} of {pages}
                <button type="button" disabled={page >= pages || loading} onClick={() => setPage(page + 1)} style={{ ...field, cursor: page >= pages ? "default" : "pointer" }}>Next</button>
              </span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
