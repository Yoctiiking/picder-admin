"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const uid = credential.user.uid;

      // Vérifie que cet utilisateur est bien un admin autorisé
      const adminDoc = await getDoc(doc(db, "admins", uid));

      if (!adminDoc.exists()) {
        await signOut(auth); // ← déconnecte immédiatement si pas admin
        setError("Ce compte n'est pas autorisé à accéder au dashboard.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1a1a2e]">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-[#16213e] p-8 shadow-xl"
      >
        <h1 className="mb-6 text-center text-2xl font-bold text-white">
          Picder Admin
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mb-4 w-full rounded-lg border border-white/10 bg-[#0f3460] px-4 py-3 text-white placeholder-white/40 outline-none"
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mb-4 w-full rounded-lg border border-white/10 bg-[#0f3460] px-4 py-3 text-white placeholder-white/40 outline-none"
        />

        {error && (
          <p className="mb-4 text-sm text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#e94560] py-3 font-semibold text-white transition hover:bg-[#d63850] disabled:opacity-50"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}