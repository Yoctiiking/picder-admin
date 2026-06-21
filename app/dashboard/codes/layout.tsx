import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Codes promo",
};

export default function CodesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}