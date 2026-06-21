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

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      <nav className="flex items-center justify-between border-b border-white/10 px-8 py-4">
        <h1 className="text-xl font-bold text-white">Picder Admin</h1>
        <div className="flex gap-6">
          <Link href="/dashboard/codes" className="text-white/70 hover:text-white">
            Codes promo
          </Link>
          <Link href="/dashboard/users" className="text-white/70 hover:text-white">
            Utilisateurs
          </Link>
          <Link href="/dashboard/admins" className="text-white/70 hover:text-white">
            Admins
          </Link>
          <button
            onClick={() => signOut(auth).then(() => router.push("/login"))}
            className="text-white/70 hover:text-red-400"
          >
            Déconnexion
          </button>
        </div>
      </nav>
      <main className="p-8">{children}</main>
    </div>
  );
}