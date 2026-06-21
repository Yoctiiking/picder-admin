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
          <div className="mb-4">
            <input
              type="text"
              placeholder="Rechercher un email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-sm rounded-lg border border-white/10 bg-[#0f3460] px-4 py-2 text-white placeholder-white/40 outline-none"
            />
          </div>

          <div className="overflow-x-auto rounded-xl bg-[#16213e]">
            <table className="w-full text-left text-white">
              <thead>
                <tr className="border-b border-white/10 text-sm text-white/60">
                  <th
                    className="cursor-pointer select-none p-4 hover:text-white"
                    onClick={() => handleSort("email")}
                  >
                    Email{sortIndicator("email")}
                  </th>
                  <th
                    className="cursor-pointer select-none p-4 hover:text-white"
                    onClick={() => handleSort("status")}
                  >
                    Statut{sortIndicator("status")}
                  </th>
                  <th
                    className="cursor-pointer select-none p-4 hover:text-white"
                    onClick={() => handleSort("proExpiresAt")}
                  >
                    Pro jusqu'au{sortIndicator("proExpiresAt")}
                  </th>
                  <th
                    className="cursor-pointer select-none p-4 hover:text-white"
                    onClick={() => handleSort("createdAt")}
                  >
                    Inscrit le{sortIndicator("createdAt")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedUsers.map((u) => (
                  <tr key={u.id} className="border-b border-white/5">
                    <td className="p-4">{u.email}</td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
                          isPro(u)
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-white/10 text-white/50"
                        }`}
                      >
                        {isPro(u) ? "Pro" : "Free"}
                      </span>
                    </td>
                    <td className="p-4 text-white/70">
                      {u.proExpiresAt
                        ? u.proExpiresAt.toDate().toLocaleDateString("fr-FR")
                        : "—"}
                    </td>
                    <td className="p-4 text-white/70">
                      {u.createdAt
                        ? u.createdAt.toDate().toLocaleDateString("fr-FR")
                        : "—"}
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
        </>
      )}
    </div>
  );
}