"use client";

import { useEffect, useState } from "react";
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

export default function CodesPage() {
    const [codes, setCodes] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);

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
                <div className="overflow-x-auto rounded-xl bg-[#16213e]">
                    <table className="w-full text-left text-white">
                        <thead>
                            <tr className="border-b border-white/10 text-sm text-white/60">
                                <th className="p-4">Code</th>
                                <th className="p-4">Durée</th>
                                <th className="p-4">Usages</th>
                                <th className="p-4">Statut</th>
                                <th className="p-4">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {codes.map((c) => (
                                <tr key={c.id} className="border-b border-white/5">
                                    <td className="p-4 font-mono">{c.code}</td>
                                    <td className="p-4">{c.durationDays} jours</td>
                                    <td className="p-4">
                                        {c.usedCount} / {c.maxUses === -1 ? "∞" : c.maxUses}
                                    </td>
                                    <td className="p-4">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs ${c.isActive
                                                    ? "bg-green-500/20 text-green-400"
                                                    : "bg-red-500/20 text-red-400"
                                                }`}
                                        >
                                            {c.isActive ? "Actif" : "Inactif"}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => toggleActive(c)}
                                            className="text-sm text-white/60 hover:text-white"
                                        >
                                            {c.isActive ? "Désactiver" : "Activer"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {codes.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-white/40">
                                        Aucun code créé pour l'instant
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