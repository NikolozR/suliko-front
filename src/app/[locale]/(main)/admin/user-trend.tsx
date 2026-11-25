"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  getUserTrend,
  type TrendGranularity,
  type UserTrend,
  type UserTrendPoint,
} from "@/features/adminTrend/services/userTrendService";

type MetricKey = "newUsers" | "totalUsers" | "activeUsers" | "payingUsers";

const METRICS: { key: MetricKey; label: string; hint: string }[] = [
  { key: "newUsers", label: "New signups", hint: "Accounts created in the period" },
  { key: "totalUsers", label: "Total users", hint: "Accounts that existed at the end of the period" },
  { key: "activeUsers", label: "Active users", hint: "Users who sent at least one request in the period" },
  { key: "payingUsers", label: "Paying users", hint: "Users with a confirmed card payment in the period" },
];

const DAY = 24 * 60 * 60 * 1000;

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Label of one bar: the Monday of the week, or the month and year. */
function periodLabel(point: UserTrendPoint, granularity: TrendGranularity, long = false) {
  const d = new Date(point.periodStart);
  if (granularity === "month") {
    return d.toLocaleDateString("en-GB", { month: "short", year: long ? "numeric" : "2-digit", timeZone: "UTC" });
  }
  const start = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  return long ? `Week of ${start}` : start;
}

/** Percent change from the previous period; null when there is nothing to compare with. */
function periodEnd(periodStart: string, granularity: TrendGranularity) {
  const d = new Date(periodStart);
  return granularity === "week"
    ? d.getTime() + 7 * DAY
    : Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
}

function change(current: number, previous: number | undefined): number | null {
  if (previous === undefined || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function Change({ value }: { value: number | null }) {
  if (value === null) return <span style={{ color: "var(--muted-foreground)" }}>–</span>;
  const up = value > 0;
  const flat = Math.abs(value) < 0.05;
  const color = flat ? "var(--muted-foreground)" : up ? "var(--status-success)" : "var(--destructive)";
  return (
    <span style={{ color, fontVariantNumeric: "tabular-nums" }}>
      {flat ? "0%" : `${up ? "▲" : "▼"} ${Math.abs(value).toFixed(1)}%`}
    </span>
  );
}

const field: React.CSSProperties = {
  background: "var(--card)",
  color: "var(--foreground)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "6px 10px",
  fontSize: 13,
  colorScheme: "light dark",
};

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} style={{ display: "inline-flex", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            style={{
              padding: "6px 14px",
              fontSize: 13,
              cursor: "pointer",
              border: "none",
              background: on ? "var(--accent-text)" : "var(--card)",
              color: on ? "var(--card)" : "var(--foreground)",
              fontWeight: on ? 600 : 400,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Bars for one metric, with the value above each bar and the period under it. */
function BarChart({
  points,
  metric,
  granularity,
}: {
  points: UserTrendPoint[];
  metric: MetricKey;
  granularity: TrendGranularity;
}) {
  const width = 900;
  const height = 260;
  const pad = { top: 22, right: 12, bottom: 34, left: 44 };
  const values = points.map((p) => p[metric]);
  const max = Math.max(1, ...values);
  const top = niceCeil(max);
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const slot = innerW / Math.max(1, points.length);
  const barW = Math.min(46, slot * 0.64);
  const labelEvery = Math.max(1, Math.ceil(points.length / 14));
  const showValues = points.length <= 26;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(top * t));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${METRICS.find((m) => m.key === metric)?.label} per ${granularity}`}
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      {ticks.map((t) => {
        const y = pad.top + innerH - (t / top) * innerH;
        return (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="var(--border)" strokeWidth={1} />
            <text x={pad.left - 8} y={y + 4} textAnchor="end" fontSize={11} fill="var(--muted-foreground)">
              {t.toLocaleString()}
            </text>
          </g>
        );
      })}
      {points.map((p, i) => {
        const v = p[metric];
        const h = (v / top) * innerH;
        const x = pad.left + slot * i + (slot - barW) / 2;
        const y = pad.top + innerH - h;
        const isLast = i === points.length - 1;
        return (
          <g key={p.periodStart}>
            <title>{`${periodLabel(p, granularity, true)}: ${v.toLocaleString()}`}</title>
            <rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(h, v > 0 ? 1 : 0)}
              rx={3}
              fill="var(--accent-text)"
              opacity={isLast ? 0.55 : 1}
            />
            {showValues && (
              <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize={11} fill="var(--foreground)">
                {v.toLocaleString()}
              </text>
            )}
            {i % labelEvery === 0 && (
              <text x={x + barW / 2} y={height - 12} textAnchor="middle" fontSize={11} fill="var(--muted-foreground)">
                {periodLabel(p, granularity)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function niceCeil(n: number) {
  if (n <= 4) return 4;
  const pow = Math.pow(10, Math.floor(Math.log10(n)));
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (step * pow >= n) return step * pow;
  }
  return 10 * pow;
}

/**
 * Users over time, week over week or month over month: new signups, total,
 * active (sent a request) and paying (confirmed card payment). The latest bar
 * is the period still running, so it is drawn lighter and its change is
 * against a finished period.
 */
export default function UserTrendChart({ includeInternal }: { includeInternal: boolean }) {
  const [granularity, setGranularity] = useState<TrendGranularity>("month");
  const [metric, setMetric] = useState<MetricKey>("newUsers");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [trend, setTrend] = useState<UserTrend | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const today = isoDate(new Date());
  const rangeInvalid = Boolean(from && to && from > to);

  useEffect(() => {
    if (rangeInvalid) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getUserTrend(granularity, from, to, includeInternal)
      .then((data) => {
        if (!cancelled) setTrend(data);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load the user trend");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [granularity, from, to, includeInternal, rangeInvalid]);

  const points = useMemo(() => trend?.points ?? [], [trend]);
  const latest = points[points.length - 1];
  // The newest bar is usually the week or month still running, so the cards compare the
  // last finished period with the one before it, and show the running one beside them.
  const running = Boolean(latest) && periodEnd(latest.periodStart, granularity) > Date.now();
  const headline = running ? points[points.length - 2] : latest;
  const before = running ? points[points.length - 3] : points[points.length - 2];
  const per = granularity === "week" ? "week" : "month";
  const vs = granularity === "week" ? "WoW" : "MoM";

  const quick = (periods: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - periods * (granularity === "week" ? 7 : 31) * DAY);
    setFrom(isoDate(start));
    setTo("");
  };

  return (
    <section style={{ marginBottom: 40 }} aria-labelledby="user-trend-heading">
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <h2
          id="user-trend-heading"
          style={{ fontFamily: "inherit", fontWeight: 700, fontSize: 18, color: "var(--foreground)", letterSpacing: "-0.01em", margin: 0 }}
        >
          User trend
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
          <Segmented
            label="Group by"
            value={granularity}
            onChange={setGranularity}
            options={[
              { value: "week", label: "Weeks" },
              { value: "month", label: "Months" },
            ]}
          />
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--muted-foreground)" }}>
            From
            <input type="date" value={from} max={to || today} onChange={(e) => setFrom(e.target.value)} style={field} />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--muted-foreground)" }}>
            To
            <input type="date" value={to} min={from || undefined} max={today} onChange={(e) => setTo(e.target.value)} style={field} />
          </label>
          <button
            type="button"
            onClick={() => {
              setFrom("");
              setTo("");
            }}
            style={{ ...field, cursor: "pointer" }}
          >
            Last 12 {per}s
          </button>
          <button type="button" onClick={() => quick(granularity === "week" ? 26 : 24)} style={{ ...field, cursor: "pointer" }}>
            Last {granularity === "week" ? 26 : 24} {per}s
          </button>
        </div>
      </div>

      {rangeInvalid && (
        <p role="alert" style={{ color: "var(--destructive)", fontSize: 13, marginBottom: 12 }}>
          The start date is after the end date.
        </p>
      )}

      {/* One card per metric: this period, and the change against the one before. Click to chart it. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, marginBottom: 16 }}>
        {METRICS.map((m) => {
          const on = m.key === metric;
          return (
            <button
              key={m.key}
              type="button"
              aria-pressed={on}
              title={m.hint}
              onClick={() => setMetric(m.key)}
              style={{
                textAlign: "left",
                cursor: "pointer",
                background: "var(--card)",
                color: "var(--foreground)",
                border: `1px solid ${on ? "var(--accent-text)" : "var(--border)"}`,
                borderLeft: "3px solid var(--accent-text)",
                borderRadius: 12,
                padding: "14px 18px",
              }}
            >
              <div style={{ fontSize: 12, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                {m.label}
              </div>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 26, lineHeight: 1.1 }}>
                {headline ? headline[m.key].toLocaleString() : "–"}
              </div>
              <div style={{ fontSize: 12, marginTop: 6, color: "var(--muted-foreground)" }}>
                {headline ? (
                  <>
                    {periodLabel(headline, granularity, true)}: <Change value={change(headline[m.key], before?.[m.key])} /> {vs}
                  </>
                ) : (
                  "–"
                )}
              </div>
              {running && (
                <div style={{ fontSize: 12, marginTop: 2, color: "var(--muted-foreground)" }}>
                  So far this {per}: {latest[m.key].toLocaleString()}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "16px 18px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8, fontSize: 13, color: "var(--muted-foreground)" }}>
          <span>
            {METRICS.find((m) => m.key === metric)?.label} per {per}
          </span>
          <span>{loading ? "Loading..." : latest ? `Last bar: ${periodLabel(latest, granularity, true)}${running ? " (not finished)" : ""}` : ""}</span>
        </div>
        {error ? (
          <p role="alert" style={{ color: "var(--destructive)", fontSize: 14, margin: "24px 0" }}>
            {error}
          </p>
        ) : points.length === 0 && !loading ? (
          <p style={{ color: "var(--muted-foreground)", fontSize: 14, margin: "24px 0" }}>No data for this range.</p>
        ) : (
          <div style={{ opacity: loading ? 0.5 : 1, transition: "opacity 0.15s" }}>
            <BarChart points={points} metric={metric} granularity={granularity} />
          </div>
        )}
      </div>

      {points.length > 0 && !error && (
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: "pointer", fontSize: 13, color: "var(--muted-foreground)" }}>Show the numbers</summary>
          <div style={{ overflowX: "auto", marginTop: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, color: "var(--foreground)" }}>
              <thead>
                <tr style={{ textAlign: "right", color: "var(--muted-foreground)" }}>
                  <th style={{ textAlign: "left", padding: "6px 10px", fontWeight: 500 }}>{granularity === "week" ? "Week of" : "Month"}</th>
                  {METRICS.map((m) => (
                    <th key={m.key} colSpan={2} style={{ padding: "6px 10px", fontWeight: 500 }}>
                      {m.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...points].reverse().map((p, i, all) => {
                  const before = all[i + 1];
                  return (
                    <tr key={p.periodStart} style={{ borderTop: "1px solid var(--border)", textAlign: "right" }}>
                      <td style={{ textAlign: "left", padding: "6px 10px" }}>{periodLabel(p, granularity, true).replace("Week of ", "")}</td>
                      {METRICS.map((m) => (
                        <React.Fragment key={m.key}>
                          <td style={{ padding: "6px 4px 6px 10px", fontVariantNumeric: "tabular-nums" }}>{p[m.key].toLocaleString()}</td>
                          <td style={{ padding: "6px 10px 6px 4px", fontSize: 12, minWidth: 64 }}>
                            <Change value={change(p[m.key], before?.[m.key])} />
                          </td>
                        </React.Fragment>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}
