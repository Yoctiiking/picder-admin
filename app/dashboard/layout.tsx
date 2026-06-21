"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // ← nouveau

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      const adminDoc = await getDoc(doc(db, "admins", user.uid));
      if (!adminDoc.exists()) {
        await signOut(auth);
        router.push("/login");
        return;
      }
      setAuthorized(true);
      setChecking(false);
    });
    return () => unsubscribe();
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a1a2e] text-white">
        Chargement...
      </div>
    );
  }

  if (!authorized) return null;

  const navLinks = (
    <>
      <Link
        href="/dashboard/codes"
        className="text-white/70 hover:text-white"
        onClick={() => setMenuOpen(false)}
      >
        Codes promo
      </Link>
      <Link
        href="/dashboard/users"
        className="text-white/70 hover:text-white"
        onClick={() => setMenuOpen(false)}
      >
        Utilisateurs
      </Link>
      <Link
        href="/dashboard/admins"
        className="text-white/70 hover:text-white"
        onClick={() => setMenuOpen(false)}
      >
        Admins
      </Link>
      <button
        onClick={() => signOut(auth).then(() => router.push("/login"))}
        className="text-left text-white/70 hover:text-red-400"
      >
        Déconnexion
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      <nav className="border-b border-white/10 px-4 py-4 sm:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Picder Admin</h1>

          {/* ← Liens visibles directement sur grand écran */}
          <div className="hidden gap-6 sm:flex">{navLinks}</div>

          {/* ← Bouton hamburger visible uniquement sur mobile */}
          <button
            className="text-white sm:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* ← Menu déroulant mobile */}
        {menuOpen && (
          <div className="mt-4 flex flex-col gap-4 sm:hidden">{navLinks}</div>
        )}
      </nav>
      <main className="p-4 sm:p-8">{children}</main>
    </div>
  );
}