"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

type UserRow = {
  id: string;
  email: string;
  proExpiresAt: Timestamp | null;
  createdAt: Timestamp | null;
};

type SortKey = "email" | "status" | "proExpiresAt" | "createdAt";
type SortDirection = "asc" | "desc";

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    async function load() {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setUsers(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<UserRow, "id">) }))
      );
      setLoading(false);
    }
    load();
  }, []);

  function isPro(user: UserRow): boolean {
    if (!user.proExpiresAt) return false;
    return user.proExpiresAt.toDate() > new Date();
  }

  const filteredAndSortedUsers = useMemo(() => {
    let result = users;

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter((u) => u.email.toLowerCase().includes(term));
    }

    result = [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case "email":
          comparison = a.email.localeCompare(b.email);
          break;
        case "status":
          comparison = Number(isPro(a)) - Number(isPro(b));
          break;
        case "proExpiresAt": {
          const aTime = a.proExpiresAt?.toMillis() ?? 0;
          const bTime = b.proExpiresAt?.toMillis() ?? 0;
          comparison = aTime - bTime;
          break;
        }
        case "createdAt": {
          const aTime = a.createdAt?.toMillis() ?? 0;
          const bTime = b.createdAt?.toMillis() ?? 0;
          comparison = aTime - bTime;
          break;
        }
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [users, searchTerm, sortKey, sortDirection]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) return "";
    return sortDirection === "asc" ? " ↑" : " ↓";
  }

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-white">Utilisateurs</h2>

      {loading ? (
        <p className="text-white/60">Chargement...</p>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-2">
            <input
              type="text"
              placeholder="Rechercher un email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-sm rounded-lg border border-white/10 bg-[#0f3460] px-4 py-2 text-white placeholder-white/40 outline-none"
            />
            <div className="relative md:hidden">
              <button
                onClick={() => setShowSortMenu((s) => !s)}
                className={`rounded-lg border px-3 py-3 transition-colors ${sortKey !== "createdAt" || sortDirection !== "desc" ? "border-[#e94560]/50 bg-[#e94560]/10 text-[#e94560]" : "border-white/10 bg-[#0f3460] text-white/70"}`}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="7" y1="12" x2="17" y2="12" />
                  <line x1="11" y1="18" x2="13" y2="18" />
                </svg>
              </button>
              {showSortMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
                  <div className="absolute right-0 top-full z-50 mt-1 min-w-44 overflow-hidden rounded-xl border border-white/10 bg-[#16213e] shadow-xl">
                    {(
                      [
                        { key: "email", label: "Email" },
                        { key: "status", label: "Statut" },
                        { key: "proExpiresAt", label: "Pro jusqu'au" },
                        { key: "createdAt", label: "Inscrit le" },
                      ] as { key: SortKey; label: string }[]
                    ).map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => {
                          if (sortKey === opt.key) {
                            setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
                          } else {
                            setSortKey(opt.key);
                            setSortDirection("asc");
                          }
                          setShowSortMenu(false);
                        }}
                        className={`flex w-full items-center justify-between px-4 py-2.5 text-sm ${sortKey === opt.key ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
                      >
                        {opt.label}
                        {sortKey === opt.key && (
                          <span className="text-xs opacity-60">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ← Tableau, desktop uniquement */}
          <div className="hidden overflow-x-auto rounded-xl bg-[#16213e] md:block">
            <table className="w-full text-left text-white">
              <thead>
                <tr className="border-b border-white/10 text-sm text-white/60">
                  <th className="cursor-pointer select-none p-4 hover:text-white" onClick={() => handleSort("email")}>
                    Email{sortIndicator("email")}
                  </th>
                  <th className="cursor-pointer select-none p-4 hover:text-white" onClick={() => handleSort("status")}>
                    Statut{sortIndicator("status")}
                  </th>
                  <th className="cursor-pointer select-none p-4 hover:text-white" onClick={() => handleSort("proExpiresAt")}>
                    Pro jusqu'au{sortIndicator("proExpiresAt")}
                  </th>
                  <th className="cursor-pointer select-none p-4 hover:text-white" onClick={() => handleSort("createdAt")}>
                    Inscrit le{sortIndicator("createdAt")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedUsers.map((u) => (
                  <tr key={u.id} className="border-b border-white/5">
                    <td className="p-4">{u.email}</td>
                    <td className="p-4">
                      <span className={`rounded-full px-3 py-1 text-xs ${isPro(u) ? "bg-amber-500/20 text-amber-400" : "bg-white/10 text-white/50"}`}>
                        {isPro(u) ? "Pro" : "Free"}
                      </span>
                    </td>
                    <td className="p-4 text-white/70">
                      {u.proExpiresAt ? u.proExpiresAt.toDate().toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="p-4 text-white/70">
                      {u.createdAt ? u.createdAt.toDate().toLocaleDateString("fr-FR") : "—"}
                    </td>
                  </tr>
                ))}
                {filteredAndSortedUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-white/40">
                      {searchTerm ? "Aucun résultat" : "Aucun utilisateur pour l'instant"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ← Cartes, mobile uniquement */}
          <div className="flex flex-col gap-3 md:hidden">
            {filteredAndSortedUsers.map((u) => (
              <div key={u.id} className="rounded-xl bg-[#16213e] p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="truncate text-white">{u.email}</span>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs ${isPro(u) ? "bg-amber-500/20 text-amber-400" : "bg-white/10 text-white/50"}`}>
                    {isPro(u) ? "Pro" : "Free"}
                  </span>
                </div>
                <div className="text-sm text-white/60">
                  Pro jusqu'au : {u.proExpiresAt ? u.proExpiresAt.toDate().toLocaleDateString("fr-FR") : "—"}
                </div>
                <div className="text-sm text-white/60">
                  Inscrit le : {u.createdAt ? u.createdAt.toDate().toLocaleDateString("fr-FR") : "—"}
                </div>
              </div>
            ))}
            {filteredAndSortedUsers.length === 0 && (
              <p className="p-4 text-center text-white/40">
                {searchTerm ? "Aucun résultat" : "Aucun utilisateur pour l'instant"}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}