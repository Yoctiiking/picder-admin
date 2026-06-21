"use client";

import { useEffect, useState } from "react";
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

export default function AdminsPage() {
    const [admins, setAdmins] = useState<AdminRow[]>([]);
    const [loading, setLoading] = useState(true);

    const [newEmail, setNewEmail] = useState("");
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                <div className="overflow-x-auto rounded-xl bg-[#16213e]">
                    <table className="w-full text-left text-white">
                        <thead>
                            <tr className="border-b border-white/10 text-sm text-white/60">
                                <th className="p-4">Email</th>
                                <th className="p-4">Admin depuis</th>
                                <th className="p-4">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {admins.map((a) => (
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
            )}
        </div>
    );
}