"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      router.replace(user ? "/dashboard" : "/login");
    });
    return () => unsubscribe();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1a1a2e]">
      <div className="text-center">
        <h1 className="mb-2 text-2xl font-bold text-white">Picder Admin</h1>
        <p className="text-white/50">Redirection...</p>
      </div>
    </div>
  );
}