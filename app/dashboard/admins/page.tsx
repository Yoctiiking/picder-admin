"use client";

import { useEffect, useMemo, useState } from "react";
import {
    collection,
    getDocs,
    query,
    where,
    doc,
    setDoc,
    deleteDoc,
    Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type AdminRow = {
    id: string; // UID
    email: string;
    addedAt: Timestamp | null;
};

type SortKey = "email" | "addedAt";
type SortDirection = "asc" | "desc";

export default function AdminsPage() {
    const [admins, setAdmins] = useState<AdminRow[]>([]);
    const [loading, setLoading] = useState(true);

    const [newEmail, setNewEmail] = useState("");
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [sortKey, setSortKey] = useState<SortKey>("addedAt");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
    const [showSortMenu, setShowSortMenu] = useState(false);

    const sortedAdmins = useMemo(() => {
        return [...admins].sort((a, b) => {
            let comparison = 0;
            if (sortKey === "email") {
                comparison = a.email.localeCompare(b.email);
            } else {
                const aTime = a.addedAt?.toMillis() ?? 0;
                const bTime = b.addedAt?.toMillis() ?? 0;
                comparison = aTime - bTime;
            }
            return sortDirection === "asc" ? comparison : -comparison;
        });
    }, [admins, sortKey, sortDirection]);

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

    async function loadAdmins() {
        setLoading(true);
        const snap = await getDocs(collection(db, "admins"));
        setAdmins(
            snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AdminRow, "id">) }))
        );
        setLoading(false);
    }

    useEffect(() => {
        loadAdmins();
    }, []);

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const email = newEmail.trim().toLowerCase();
        if (!email) {
            setError("Entre un email");
            return;
        }

        setAdding(true);
        try {
            // Cherche l'utilisateur par email dans la collection users
            const q = query(collection(db, "users"), where("email", "==", email));
            const snap = await getDocs(q);

            if (snap.empty) {
                setError("Aucun compte Picder trouvé avec cet email");
                setAdding(false);
                return;
            }

            const userDoc = snap.docs[0];
            const uid = userDoc.id;

            // Vérifie qu'il n'est pas déjà admin
            if (admins.some((a) => a.id === uid)) {
                setError("Cette personne est déjà admin");
                setAdding(false);
                return;
            }

            await setDoc(doc(db, "admins", uid), {
                email,
                addedAt: Timestamp.now(),
            });

            setNewEmail("");
            await loadAdmins();
        } catch (err) {
            setError("Erreur lors de l'ajout");
        } finally {
            setAdding(false);
        }
    }

    async function handleRemove(admin: AdminRow) {
        // ← Protection : empêche de retirer le dernier admin restant
        if (admins.length <= 1) {
            alert("Impossible de retirer le dernier admin restant.");
            return;
        }

        const confirmed = confirm(`Retirer les droits admin de ${admin.email} ?`);
        if (!confirmed) return;

        await deleteDoc(doc(db, "admins", admin.id));
        await loadAdmins();
    }

    const currentUid = auth.currentUser?.uid;

    return (
        <div>
            <h2 className="mb-6 text-2xl font-bold text-white">Administrateurs</h2>

            <form
                onSubmit={handleAdd}
                className="mb-10 flex flex-col gap-4 rounded-xl bg-[#16213e] p-6 sm:flex-row sm:items-end"
            >
                <div className="flex-1">
                    <label className="mb-1 block text-sm text-white/60">
                        Email d'un utilisateur Picder existant
                    </label>
                    <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="exemple@email.com"
                        className="w-full rounded-lg border border-white/10 bg-[#0f3460] px-3 py-2 text-white outline-none"
                    />
                </div>

                <button
                    type="submit"
                    disabled={adding}
                    className="rounded-lg bg-[#e94560] px-6 py-2 font-semibold text-white hover:bg-[#d63850] disabled:opacity-50"
                >
                    {adding ? "Ajout..." : "Ajouter comme admin"}
                </button>
            </form>

            {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

            {loading ? (
                <p className="text-white/60">Chargement...</p>
            ) : (
                <>
                    {/* ← Bouton de tri, mobile uniquement */}
                    <div className="mb-4 flex justify-end md:hidden">
                        <div className="relative">
                            <button
                                onClick={() => setShowSortMenu((s) => !s)}
                                className={`rounded-lg border px-3 py-3 transition-colors ${sortKey !== "addedAt" || sortDirection !== "desc" ? "border-[#e94560]/50 bg-[#e94560]/10 text-[#e94560]" : "border-white/10 bg-[#0f3460] text-white/70"}`}
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
                                                { key: "addedAt", label: "Admin depuis" },
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
                                    <th className="cursor-pointer select-none p-4 hover:text-white" onClick={() => handleSort("addedAt")}>
                                        Admin depuis{sortIndicator("addedAt")}
                                    </th>
                                    <th className="p-4">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedAdmins.map((a) => (
                                    <tr key={a.id} className="border-b border-white/5">
                                        <td className="p-4">
                                            {a.email}
                                            {a.id === currentUid && (
                                                <span className="ml-2 rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">
                                                    Toi
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-white/70">
                                            {a.addedAt && typeof a.addedAt.toDate === "function"
                                                ? a.addedAt.toDate().toLocaleDateString("fr-FR")
                                                : "—"}
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => handleRemove(a)}
                                                className="text-sm text-red-400/80 hover:text-red-400"
                                            >
                                                Retirer
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {admins.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="p-4 text-center text-white/40">
                                            Aucun admin
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ← Cartes, mobile uniquement */}
                    <div className="flex flex-col gap-3 md:hidden">
                        {sortedAdmins.map((a) => (
                            <div key={a.id} className="rounded-xl bg-[#16213e] p-4">
                                <div className="mb-2 flex items-center gap-2">
                                    <span className="truncate text-white">{a.email}</span>
                                    {a.id === currentUid && (
                                        <span className="shrink-0 rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">
                                            Toi
                                        </span>
                                    )}
                                </div>
                                <div className="mb-3 text-sm text-white/60">
                                    Admin depuis :{" "}
                                    {a.addedAt && typeof a.addedAt.toDate === "function"
                                        ? a.addedAt.toDate().toLocaleDateString("fr-FR")
                                        : "—"}
                                </div>
                                <button
                                    onClick={() => handleRemove(a)}
                                    className="w-full rounded-lg bg-red-500/10 py-2 text-center text-sm text-red-400 hover:bg-red-500/20"
                                >
                                    Retirer
                                </button>
                            </div>
                        ))}
                        {sortedAdmins.length === 0 && (
                            <p className="p-4 text-center text-white/40">Aucun admin</p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}