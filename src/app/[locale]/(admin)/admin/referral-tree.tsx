"use client";
import React, { useMemo, useState } from "react";
import { User } from "./users-table";

export function fmt(date?: string) {
  if (!date) return "–";
  return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function displayName(u: User) {
  const n = [u.firstName, u.lastName].filter(Boolean).join(" ");
  return n || u.userName || u.id;
}

export function matchesQuery(u: User, q: string) {
  if (!q) return true;
  const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase();
  return (
    name.includes(q) ||
    (u.email ?? "").toLowerCase().includes(q) ||
    (u.referralCode ?? "").toLowerCase().includes(q) ||
    (u.userName ?? "").toLowerCase().includes(q)
  );
}

export type ReferralNode = {
  key: string;
  /** Absent for a code no user owns: a promo code, or its owner was deleted. */
  user?: User;
  code: string;
  children: ReferralNode[];
  /** Everyone underneath, at any depth. */
  total: number;
};

const byBranchSize = (a: ReferralNode, b: ReferralNode) =>
  b.total - a.total || (a.user ? displayName(a.user) : a.code).localeCompare(b.user ? displayName(b.user) : b.code);

/**
 * Who brought in whom, as a forest.
 *
 * The roots are the people who referred someone and were not themselves
 * referred by anyone on the list. People who neither referred nor were
 * referred are left out: they are most users, and a tree of single leaves
 * says nothing. A code that no user owns still gets a root of its own, so
 * the people who signed up with it are not lost.
 */
export function buildReferralForest(users: User[]): { roots: ReferralNode[]; longestChain: number } {
  const byCode = new Map<string, User>();
  for (const u of users) if (u.referralCode && !byCode.has(u.referralCode)) byCode.set(u.referralCode, u);

  const referredBy = new Map<string, User[]>();
  for (const u of users) {
    if (!u.referredByCode) continue;
    const list = referredBy.get(u.referredByCode) ?? [];
    list.push(u);
    referredBy.set(u.referredByCode, list);
  }

  const placed = new Set<string>();
  let longestChain = 0;

  // `placed` also stops a loop in bad data (A referred B, B referred A) from
  // recursing for ever.
  const build = (user: User, depth: number): ReferralNode => {
    placed.add(user.id);
    longestChain = Math.max(longestChain, depth);
    const children = (user.referralCode ? referredBy.get(user.referralCode) ?? [] : [])
      .filter((c) => !placed.has(c.id))
      .map((c) => build(c, depth + 1))
      .sort(byBranchSize);
    return {
      key: user.id,
      user,
      code: user.referralCode ?? "",
      children,
      total: children.reduce((sum, c) => sum + 1 + c.total, 0),
    };
  };

  const roots: ReferralNode[] = [];
  for (const [code, referred] of referredBy) {
    const owner = byCode.get(code);
    if (owner) {
      const ownerIsReferred = owner.referredByCode && byCode.has(owner.referredByCode);
      if (!ownerIsReferred) roots.push(build(owner, 1));
      continue;
    }
    const children = referred.filter((c) => !placed.has(c.id)).map((c) => build(c, 1)).sort(byBranchSize);
    roots.push({ key: `code:${code}`, code, children, total: children.reduce((s, c) => s + 1 + c.total, 0) });
  }
  // Whoever is left sits in a loop with no way in from a root: start it anywhere.
  for (const [code] of referredBy) {
    const owner = byCode.get(code);
    if (owner && !placed.has(owner.id)) roots.push(build(owner, 1));
  }

  return { roots: roots.sort(byBranchSize), longestChain };
}

/** The branches that lead to a match, with every node on the way open. */
function prune(nodes: ReferralNode[], q: string): ReferralNode[] {
  const out: ReferralNode[] = [];
  for (const n of nodes) {
    const children = prune(n.children, q);
    const hit = n.user ? matchesQuery(n.user, q) : n.code.toLowerCase().includes(q);
    if (hit || children.length) out.push({ ...n, children });
  }
  return out;
}

function allKeys(nodes: ReferralNode[], into = new Set<string>()) {
  for (const n of nodes) {
    if (n.children.length) {
      into.add(n.key);
      allKeys(n.children, into);
    }
  }
  return into;
}

const chipStyle: React.CSSProperties = {
  background: "rgba(251,191,36,0.1)",
  color: "#fbbf24",
  borderRadius: 4,
  padding: "2px 8px",
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.08em",
  whiteSpace: "nowrap",
};

const toolButton: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #2a2d3a",
  borderRadius: 6,
  color: "#94a3b8",
  cursor: "pointer",
  fontSize: 12,
  padding: "4px 10px",
  fontFamily: "inherit",
};

function Branch({
  nodes,
  level,
  open,
  toggle,
  query,
}: {
  nodes: ReferralNode[];
  level: number;
  open: (key: string) => boolean;
  toggle: (key: string) => void;
  query: string;
}) {
  return (
    <>
      {nodes.map((n) => {
        const isOpen = n.children.length > 0 && open(n.key);
        const hit = !!query && (n.user ? matchesQuery(n.user, query) : n.code.toLowerCase().includes(query));
        return (
          <li key={n.key} style={{ listStyle: "none" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "7px 10px",
                marginTop: 4,
                borderRadius: 8,
                background: hit ? "rgba(251,191,36,0.08)" : level === 0 ? "#13151f" : "transparent",
                border: level === 0 ? "1px solid #2a2d3a" : "1px solid transparent",
              }}
            >
              {n.children.length > 0 ? (
                <button
                  type="button"
                  onClick={() => toggle(n.key)}
                  aria-expanded={isOpen}
                  aria-label={isOpen ? "Collapse" : "Expand"}
                  disabled={!!query}
                  style={{
                    ...toolButton,
                    width: 24,
                    height: 24,
                    padding: 0,
                    fontSize: 14,
                    lineHeight: 1,
                    flexShrink: 0,
                    cursor: query ? "default" : "pointer",
                    opacity: query ? 0.5 : 1,
                  }}
                >
                  {isOpen ? "▾" : "▸"}
                </button>
              ) : (
                <span style={{ width: 24, flexShrink: 0, textAlign: "center", color: "#334155" }}>•</span>
              )}

              <div style={{ minWidth: 0, flex: 1 }}>
                {n.user ? (
                  <>
                    <div style={{ color: "#f8fafc", fontWeight: 500, fontSize: 13 }}>{displayName(n.user)}</div>
                    <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>
                      {n.user.email ? `${n.user.email} · ` : ""}joined {fmt(n.user.createdAt)}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ color: "#94a3b8", fontWeight: 500, fontSize: 13 }}>No user owns this code</div>
                    <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>
                      A promo code, or its owner was deleted
                    </div>
                  </>
                )}
              </div>

              {n.code && <code style={chipStyle}>{n.code}</code>}

              <span
                title="Referred directly · everyone in this branch"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  color: n.children.length ? "#34d399" : "#334155",
                  whiteSpace: "nowrap",
                  minWidth: 92,
                  textAlign: "right",
                }}
              >
                {n.children.length
                  ? n.total > n.children.length
                    ? `${n.children.length} · ${n.total} in branch`
                    : `${n.children.length} referred`
                  : "–"}
              </span>
            </div>

            {isOpen && (
              <ul style={{ margin: 0, marginLeft: 21, paddingLeft: 16, borderLeft: "1px solid #2a2d3a" }}>
                <Branch nodes={n.children} level={level + 1} open={open} toggle={toggle} query={query} />
              </ul>
            )}
          </li>
        );
      })}
    </>
  );
}

export default function ReferralTree({ roots, query }: { roots: ReferralNode[]; query: string }) {
  // Roots start open, so the first level of each network shows at once.
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(roots.map((r) => r.key)));

  const shown = useMemo(() => (query ? prune(roots, query) : roots), [roots, query]);
  const every = useMemo(() => allKeys(roots), [roots]);

  // While searching, every branch that leads to a match is open; clearing
  // the search brings back what was open before.
  const open = (key: string) => (query ? true : expanded.has(key));
  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  if (roots.length === 0) {
    return (
      <div style={{ padding: "32px 12px", color: "#475569", textAlign: "center", fontSize: 14 }}>
        Nobody has referred anyone yet.
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button type="button" style={toolButton} disabled={!!query} onClick={() => setExpanded(new Set(every))}>
          Expand all
        </button>
        <button type="button" style={toolButton} disabled={!!query} onClick={() => setExpanded(new Set())}>
          Collapse all
        </button>
      </div>

      {shown.length === 0 ? (
        <div style={{ padding: "32px 12px", color: "#475569", textAlign: "center", fontSize: 14 }}>
          No one in the referral tree matches your search.
        </div>
      ) : (
        <ul style={{ margin: 0, padding: 0 }}>
          <Branch nodes={shown} level={0} open={open} toggle={toggle} query={query} />
        </ul>
      )}
    </div>
  );
}
