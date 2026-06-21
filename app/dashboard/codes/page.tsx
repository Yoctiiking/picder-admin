"use client";

import { useEffect, useMemo, useState } from "react";
import {
    collection,
    setDoc,
    getDocs,
    orderBy,
    query,
    Timestamp,
    doc,
    updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type PromoCode = {
    id: string;
    code: string;
    durationDays: number;
    maxUses: number;
    usedCount: number;
    isActive: boolean;
    expiresAt: Timestamp | null;
    createdAt: Timestamp | null;
};

type SortKey = "code" | "durationDays" | "usedCount" | "isActive";
type SortDirection = "asc" | "desc";

export default function CodesPage() {
    const [codes, setCodes] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);

    // Recherche et tri
    const [searchTerm, setSearchTerm] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("code");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
    const [showSortMenu, setShowSortMenu] = useState(false);

    // Champs du formulaire de création
    const [newCode, setNewCode] = useState("");
    const [durationDays, setDurationDays] = useState(30);
    const [maxUses, setMaxUses] = useState(-1);
    const [expiresAt, setExpiresAt] = useState("");
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function loadCodes() {
        setLoading(true);
        const q = query(collection(db, "promoCodes"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setCodes(
            snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PromoCode, "id">) }))
        );
        setLoading(false);
    }

    useEffect(() => {
        loadCodes();
    }, []);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const code = newCode.trim().toUpperCase();
        if (!code) {
            setError("Entre un code");
            return;
        }

        setCreating(true);
        try {
            await setDoc(doc(db, "promoCodes", code), {
                code,
                durationDays,
                maxUses,
                usedCount: 0,
                usedBy: [],
                expiresAt: expiresAt ? Timestamp.fromDate(new Date(expiresAt)) : null,
                createdAt: Timestamp.now(),
                isActive: true,
            });

            setNewCode("");
            setDurationDays(30);
            setMaxUses(-1);
            setExpiresAt("");
            await loadCodes();
        } catch (err) {
            setError("Erreur lors de la création du code");
        } finally {
            setCreating(false);
        }
    }

    async function toggleActive(code: PromoCode) {
        await updateDoc(doc(db, "promoCodes", code.id), {
            isActive: !code.isActive,
        });
        await loadCodes();
    }

    // Calcul de la liste filtrée et triée
    const filteredAndSortedCodes = useMemo(() => {
        let result = codes;

        if (searchTerm.trim()) {
            const term = searchTerm.trim().toUpperCase();
            result = result.filter((c) => c.code.includes(term));
        }

        result = [...result].sort((a, b) => {
            let comparison = 0;
            switch (sortKey) {
                case "code":
                    comparison = a.code.localeCompare(b.code);
                    break;
                case "durationDays":
                    comparison = a.durationDays - b.durationDays;
                    break;
                case "usedCount":
                    comparison = a.usedCount - b.usedCount;
                    break;
                case "isActive":
                    comparison = Number(a.isActive) - Number(b.isActive);
                    break;
            }
            return sortDirection === "asc" ? comparison : -comparison;
        });

        return result;
    }, [codes, searchTerm, sortKey, sortDirection]);

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
            <h2 className="mb-6 text-2xl font-bold text-white">Codes promo</h2>

            <form
                onSubmit={handleCreate}
                className="mb-10 grid grid-cols-1 gap-4 rounded-xl bg-[#16213e] p-6 md:grid-cols-2 lg:grid-cols-4"
            >
                <div>
                    <label className="mb-1 block text-sm text-white/60">Code</label>
                    <input
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value)}
                        placeholder="HUMORISTE2026"
                        className="w-full rounded-lg border border-white/10 bg-[#0f3460] px-3 py-2 text-white outline-none"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm text-white/60">Durée Pro (jours)</label>
                    <input
                        type="number"
                        value={durationDays}
                        onChange={(e) => setDurationDays(Number(e.target.value))}
                        className="w-full rounded-lg border border-white/10 bg-[#0f3460] px-3 py-2 text-white outline-none"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm text-white/60">
                        Utilisations max (-1 = illimité)
                    </label>
                    <input
                        type="number"
                        value={maxUses}
                        onChange={(e) => setMaxUses(Number(e.target.value))}
                        className="w-full rounded-lg border border-white/10 bg-[#0f3460] px-3 py-2 text-white outline-none"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm text-white/60">
                        Expiration du code (optionnel)
                    </label>
                    <input
                        type="date"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-[#0f3460] px-3 py-2 text-white outline-none"
                    />
                </div>

                {error && <p className="text-sm text-red-400 lg:col-span-4">{error}</p>}

                <button
                    type="submit"
                    disabled={creating}
                    className="rounded-lg bg-[#e94560] px-4 py-2 font-semibold text-white hover:bg-[#d63850] disabled:opacity-50 lg:col-span-4"
                >
                    {creating ? "Création..." : "Créer le code"}
                </button>
            </form>

            {loading ? (
                <p className="text-white/60">Chargement...</p>
            ) : (
                <>
                    <>
                        <div className="mb-4 flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Rechercher un code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full max-w-sm rounded-lg border border-white/10 bg-[#0f3460] px-4 py-2 text-white placeholder-white/40 outline-none"
                            />
                            <div className="relative md:hidden">
                                <button
                                    onClick={() => setShowSortMenu((s) => !s)}
                                    className={`rounded-lg border px-3 py-3 transition-colors ${sortKey !== "code" || sortDirection !== "asc" ? "border-[#e94560]/50 bg-[#e94560]/10 text-[#e94560]" : "border-white/10 bg-[#0f3460] text-white/70"}`}
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
                                                    { key: "code", label: "Code" },
                                                    { key: "durationDays", label: "Durée" },
                                                    { key: "usedCount", label: "Usages" },
                                                    { key: "isActive", label: "Statut" },
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

                        {/* ← Tableau, visible uniquement à partir de md (768px) */}
                        <div className="hidden overflow-x-auto rounded-xl bg-[#16213e] md:block">
                            <table className="w-full text-left text-white">
                                <thead>
                                    <tr className="border-b border-white/10 text-sm text-white/60">
                                        <th className="cursor-pointer select-none p-4 hover:text-white" onClick={() => handleSort("code")}>
                                            Code{sortIndicator("code")}
                                        </th>
                                        <th className="cursor-pointer select-none p-4 hover:text-white" onClick={() => handleSort("durationDays")}>
                                            Durée{sortIndicator("durationDays")}
                                        </th>
                                        <th className="cursor-pointer select-none p-4 hover:text-white" onClick={() => handleSort("usedCount")}>
                                            Usages{sortIndicator("usedCount")}
                                        </th>
                                        <th className="cursor-pointer select-none p-4 hover:text-white" onClick={() => handleSort("isActive")}>
                                            Statut{sortIndicator("isActive")}
                                        </th>
                                        <th className="p-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAndSortedCodes.map((c) => (
                                        <tr key={c.id} className="border-b border-white/5">
                                            <td className="p-4 font-mono">{c.code}</td>
                                            <td className="p-4">{c.durationDays} jours</td>
                                            <td className="p-4">
                                                {c.usedCount} / {c.maxUses === -1 ? "∞" : c.maxUses}
                                            </td>
                                            <td className="p-4">
                                                <span className={`rounded-full px-3 py-1 text-xs ${c.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                                                    {c.isActive ? "Actif" : "Inactif"}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => toggleActive(c)}
                                                    className="w-full rounded-lg bg-white/5 py-2 text-center text-sm text-white/70 hover:bg-white/10 hover:text-white"
                                                >
                                                    {c.isActive ? "Désactiver" : "Activer"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredAndSortedCodes.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-4 text-center text-white/40">
                                                {searchTerm ? "Aucun résultat" : "Aucun code créé pour l'instant"}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* ← Cartes, visibles uniquement en dessous de md */}
                        <div className="flex flex-col gap-3 md:hidden">
                            {filteredAndSortedCodes.map((c) => (
                                <div key={c.id} className="rounded-xl bg-[#16213e] p-4">
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="font-mono text-lg text-white">{c.code}</span>
                                        <span className={`rounded-full px-3 py-1 text-xs ${c.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                                            {c.isActive ? "Actif" : "Inactif"}
                                        </span>
                                    </div>
                                    <div className="mb-1 text-sm text-white/60">Durée : {c.durationDays} jours</div>
                                    <div className="mb-3 text-sm text-white/60">
                                        Usages : {c.usedCount} / {c.maxUses === -1 ? "∞" : c.maxUses}
                                    </div>
                                    <button
                                        onClick={() => toggleActive(c)}
                                        className="w-full rounded-lg bg-white/5 py-2 text-center text-sm text-white/70 hover:bg-white/10 hover:text-white"
                                    >
                                        {c.isActive ? "Désactiver" : "Activer"}
                                    </button>
                                </div>
                            ))}
                            {filteredAndSortedCodes.length === 0 && (
                                <p className="p-4 text-center text-white/40">
                                    {searchTerm ? "Aucun résultat" : "Aucun code créé pour l'instant"}
                                </p>
                            )}
                        </div>
                    </>
                </>
            )}
        </div>
    );
}