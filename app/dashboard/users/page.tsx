"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

type UserRow = {
  id: string;
  email: string;
  proExpiresAt: Timestamp | null;
  createdAt: Timestamp | null;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-white">Utilisateurs</h2>

      {loading ? (
        <p className="text-white/60">Chargement...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-[#16213e]">
          <table className="w-full text-left text-white">
            <thead>
              <tr className="border-b border-white/10 text-sm text-white/60">
                <th className="p-4">Email</th>
                <th className="p-4">Statut</th>
                <th className="p-4">Pro jusqu'au</th>
                <th className="p-4">Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
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
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-white/40">
                    Aucun utilisateur pour l'instant
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}