import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Administrateurs",
};

export default function AdminsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}