import type { Metadata } from "next";
import { connection } from "next/server";
import AdminApp from "@/components/AdminApp";

export const metadata: Metadata = {
  title: "Admin | Tabish Ali Khan",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  // Render per request so every page load gets its own CSP nonce (see proxy.ts).
  await connection();
  return <AdminApp />;
}
