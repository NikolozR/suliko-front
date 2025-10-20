"use client";
import React, { useMemo, useState } from "react";
import { updateUserProfile } from "@/features/auth/services/userService";

export type User = {
  id: string;
  userName: string;
  email?: string;
  phoneNUmber?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
  roleName?: string;
  balance?: number;
  createdAt?: string;
};

export default function UsersTable({ initialUsers }: { initialUsers: User[] }) {
  const [rows, setRows] = useState<User[]>(initialUsers || []);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [balanceSort, setBalanceSort] = useState<"none" | "asc" | "desc">("none");
  const [dateSort, setDateSort] = useState<"none" | "asc" | "desc">("none");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

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
        email: row.email || "",
        phoneNUmber: row.phoneNUmber || row.phoneNumber || "",
        firstName: row.firstName || "",
        lastName: row.lastName || "",
        roleId: row.roleId || "",
        balance: typeof row.balance === "number" ? row.balance : 0,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to save user";
      setError(message);
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
      { key: "createdAt", label: "Created At" },
      { key: "actions", label: "Actions" },
    ],
    []
  );

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((u) => {
      const name = `${u.firstName || ""} ${u.lastName || ""}`.trim().toLowerCase();
      const phone = (u.phoneNUmber || u.phoneNumber || "").toString().toLowerCase();
      const userName = (u.userName || "").toString().toLowerCase();
      return (
        name.includes(q) ||
        phone.includes(q) ||
        userName.includes(q)
      );
    });
  }, [rows, query]);

  const sortedRows = useMemo(() => {
    let copy = [...filteredRows];
    
    // Apply balance sorting
    if (balanceSort !== "none") {
      copy.sort((a, b) => {
        const av = typeof a.balance === "number" ? a.balance : -Infinity;
        const bv = typeof b.balance === "number" ? b.balance : -Infinity;
        if (balanceSort === "asc") return av - bv;
        return bv - av;
      });
    }
    
    // Apply date sorting
    if (dateSort !== "none") {
      copy.sort((a, b) => {
        const av = a.createdAt ? new Date(a.createdAt).getTime() : -Infinity;
        const bv = b.createdAt ? new Date(b.createdAt).getTime() : -Infinity;
        if (dateSort === "asc") return av - bv;
        return bv - av;
      });
    }
    
    return copy;
  }, [filteredRows, balanceSort, dateSort]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedRows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedRows = sortedRows.slice(startIndex, endIndex);

  // Reset to first page when search query changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  // Reset to first page when page size changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const handlePageSizeChange = (newPageSize: number) => {
    setItemsPerPage(newPageSize);
  };

  // CSV Export function
  const exportToCSV = () => {
    const csvHeaders = [
      'ID',
      'User Name',
      'Email',
      'Phone Number',
      'First Name',
      'Last Name',
      'Role ID',
      'Role Name',
      'Balance',
      'Created At'
    ];

    const csvRows = sortedRows.map(user => [
      user.id,
      user.userName || '',
      user.email || '',
      user.phoneNUmber || user.phoneNumber || '',
      user.firstName || '',
      user.lastName || '',
      user.roleId || '',
      user.roleName || '',
      user.balance || 0,
      user.createdAt ? new Date(user.createdAt).toLocaleString() : ''
    ]);

    // Escape CSV values
    const escapeCsvValue = (value: any) => {
      const stringValue = String(value || '');
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvContent = [
      csvHeaders.map(escapeCsvValue).join(','),
      ...csvRows.map(row => row.map(escapeCsvValue).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-lg border overflow-x-auto">
      <div className="p-3 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <input
            className="border rounded px-3 py-2 w-80"
            placeholder="Search by name or phone"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="pageSize" className="text-sm text-muted-foreground">
              Show:
            </label>
            <select
              id="pageSize"
              value={itemsPerPage}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-muted-foreground">per page</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {sortedRows.length} results (Page {currentPage} of {totalPages})
          </div>
        </div>
      </div>
      {error && <div className="text-red-600 text-sm p-2">{error}</div>}
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/30">
            {columns.map((c) => {
              if (c.key !== "balance" && c.key !== "actions" && c.key !== "createdAt") {
                return (
                  <th key={c.key} className="p-2 text-left">{c.label}</th>
                );
              }
              if (c.key === "balance") {
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
              }
              if (c.key === "createdAt") {
                return (
                  <th key={c.key} className="p-2 text-left">
                    <button
                      type="button"
                      onClick={() => setDateSort(dateSort === "none" ? "asc" : dateSort === "asc" ? "desc" : "none")}
                      className="inline-flex items-center gap-1 select-none hover:opacity-80"
                      aria-label="Sort by creation date"
                    >
                      <span>Created At</span>
                      <span className="inline-block w-3 text-xs">
                        {dateSort === "asc" ? "▲" : dateSort === "desc" ? "▼" : ""}
                      </span>
                    </button>
                  </th>
                );
              }
              return (
                <th key={c.key} className="p-2 text-right">{c.label}</th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {displayedRows.map((u: User) => (
            <tr key={u.id} className="border-t">
              <td className="p-2">{u.id}</td>
              <td className="p-2">{u.userName || "-"}</td>
              <td className="p-2">{u.email || "-"}</td>
              <td className="p-2">{u.phoneNUmber || u.phoneNumber || "-"}</td>
              <td className="p-2">{u.firstName || "-"}</td>
              <td className="p-2">{u.lastName || "-"}</td>
              <td className="p-2">{u.roleId || "-"}</td>
              <td className="p-2">{u.roleName || "-"}</td>
              <td className="p-2 text-right">
                <input
                  type="number"
                  step="0.01"
                  className="w-28 border rounded px-2 py-1 text-right"
                  value={typeof u.balance === "number" ? u.balance : 0}
                  onChange={(e) => handleBalanceChange(u.id, e.target.value)}
                />
              </td>
              <td className="p-2">
                {u.createdAt ? new Date(u.createdAt).toLocaleString() : "-"}
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
          {sortedRows.length === 0 && (
            <tr>
              <td className="p-3 text-center text-muted-foreground" colSpan={columns.length}>No users found</td>
            </tr>
          )}
        </tbody>
      </table>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm border rounded ${
                      currentPage === pageNum
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, sortedRows.length)} of {sortedRows.length} users
          </div>
        </div>
      )}
    </div>
  );
}


