"use client";
import React, { useMemo, useState, useMemo as useMemoAlias } from "react";
import { updateUserProfile } from "@/features/auth/services/userService";

type User = {
  id: string;
  userName: string;
  email: string;
  phoneNUmber?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
  roleName?: string;
  balance?: number;
};

export default function UsersTable({ initialUsers }: { initialUsers: User[] }) {
  const [rows, setRows] = useState<User[]>(initialUsers || []);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [balanceSort, setBalanceSort] = useState<"none" | "asc" | "desc">("none");

  const handleBalanceChange = (id: string, value: string) => {
    const numeric = value === "" ? undefined : Number(value);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, balance: Number.isFinite(numeric as number) ? (numeric as number) : (r.balance ?? 0) } : r)));
  };

  const saveRow = async (row: User) => {
    setError(null);
    setSavingId(row.id);
    try {
      await updateUserProfile({
        id: row.id,
        userName: row.userName,
        email: row.email,
        phoneNUmber: row.phoneNUmber || row.phoneNumber || "",
        firstName: row.firstName || "",
        lastName: row.lastName || "",
        roleId: row.roleId || "",
        balance: typeof row.balance === "number" ? row.balance : 0,
      });
    } catch (e: any) {
      setError(e?.message || "Failed to save user");
    } finally {
      setSavingId(null);
    }
  };

  const columns = useMemo(
    () => [
      { key: "id", label: "ID" },
      { key: "userName", label: "User Name" },
      { key: "email", label: "Email" },
      { key: "phoneNUmber", label: "Phone Number" },
      { key: "firstName", label: "First Name" },
      { key: "lastName", label: "Last Name" },
      { key: "roleId", label: "Role ID" },
      { key: "roleName", label: "Role Name" },
      { key: "balance", label: "Balance" },
      { key: "actions", label: "Actions" },
    ],
    []
  );

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((u) => {
      const name = `${u.firstName || ""} ${u.lastName || ""}`.trim().toLowerCase();
      const phone = (u.phoneNUmber || (u as any).phoneNumber || "").toString().toLowerCase();
      const userName = (u.userName || (u as any).username || "").toString().toLowerCase();
      return (
        name.includes(q) ||
        phone.includes(q) ||
        userName.includes(q)
      );
    });
  }, [rows, query]);

  const displayedRows = useMemo(() => {
    if (balanceSort === "none") return filteredRows;
    const copy = [...filteredRows];
    copy.sort((a, b) => {
      const av = typeof a.balance === "number" ? a.balance : -Infinity;
      const bv = typeof b.balance === "number" ? b.balance : -Infinity;
      if (balanceSort === "asc") return av - bv;
      return bv - av;
    });
    return copy;
  }, [filteredRows, balanceSort]);

  return (
    <div className="rounded-lg border overflow-x-auto">
      <div className="p-3 flex items-center gap-2 border-b">
        <input
          className="border rounded px-3 py-2 w-80"
          placeholder="Search by name or phone"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="text-sm text-muted-foreground">{filteredRows.length} results</div>
      </div>
      {error && <div className="text-red-600 text-sm p-2">{error}</div>}
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/30">
            {columns.map((c) => {
              if (c.key !== "balance") {
                return (
                  <th key={c.key} className={`p-2 ${c.key === "actions" ? "text-right" : "text-left"}`}>{c.label}</th>
                );
              }
              return (
                <th key={c.key} className="p-2 text-right">
                  <button
                    type="button"
                    onClick={() => setBalanceSort(balanceSort === "none" ? "asc" : balanceSort === "asc" ? "desc" : "none")}
                    className="inline-flex items-center gap-1 select-none hover:opacity-80"
                    aria-label="Sort by balance"
                  >
                    <span>Balance</span>
                    <span className="inline-block w-3 text-xs">
                      {balanceSort === "asc" ? "▲" : balanceSort === "desc" ? "▼" : ""}
                    </span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {displayedRows.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="p-2">{u.id}</td>
              <td className="p-2">{u.userName || (u as any).username || "-"}</td>
              <td className="p-2">{u.email || "-"}</td>
              <td className="p-2">{u.phoneNUmber || (u as any).phoneNumber || "-"}</td>
              <td className="p-2">{u.firstName || "-"}</td>
              <td className="p-2">{u.lastName || "-"}</td>
              <td className="p-2">{u.roleId || "-"}</td>
              <td className="p-2">{u.roleName || (u as any).role || "-"}</td>
              <td className="p-2 text-right">
                <input
                  type="number"
                  step="0.01"
                  className="w-28 border rounded px-2 py-1 text-right"
                  value={typeof u.balance === "number" ? u.balance : 0}
                  onChange={(e) => handleBalanceChange(u.id, e.target.value)}
                />
              </td>
              <td className="p-2 text-right">
                <button
                  className="suliko-default-bg text-primary-foreground px-3 py-1 rounded disabled:opacity-60"
                  disabled={savingId === u.id}
                  onClick={() => saveRow(u)}
                >
                  {savingId === u.id ? "Saving..." : "Save"}
                </button>
              </td>
            </tr>
          ))}
          {filteredRows.length === 0 && (
            <tr>
              <td className="p-3 text-center text-muted-foreground" colSpan={columns.length}>No users found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}


