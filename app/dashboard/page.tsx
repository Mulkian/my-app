"use client";
// app/dashboard/page.tsx

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

import { PageId } from "../types/types";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Dashboard from "../components/Dashboard";
import Armada from "../components/Armada";
import Penyewaan from "../components/Penyewaan";
import Pengembalian from "../components/Pengembalian";
import Pelanggan from "../components/Pelanggan";
import Pembayaran from "../components/Pembayaran";
import Laporan from "../components/Laporan";
import Pengaturan from "../components/Pengaturan";

export default function DashboardPage() {
  const router = useRouter();
  const [activePage, setActivePage] = useState<PageId>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [checking, setChecking] = useState(true);

  // Guard: hanya admin yang boleh masuk
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      if (data?.role !== "admin") {
        // Bukan admin → lempar ke portal
        router.replace("/portal");
        return;
      }

      setChecking(false);
    };
    check();
  }, [router]);

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":   return <Dashboard />;
      case "armada":      return <Armada />;
      case "penyewaan":   return <Penyewaan />;
      case "pengembalian":return <Pengembalian />;
      case "pelanggan":   return <Pelanggan />;
      case "pembayaran":  return <Pembayaran />;
      case "laporan":     return <Laporan />;
      case "pengaturan":  return <Pengaturan />;
      default:            return <Dashboard />;
    }
  };

  // Tampilkan loading selagi cek role
  if (checking) {
    return (
      <div style={{
        minHeight: "100vh", background: "#070c17",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 14,
        fontFamily: "'Outfit', sans-serif", color: "#f1f5f9",
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
          stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"
          style={{ animation: "spin 0.7s linear infinite" }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <p style={{ fontSize: 13, color: "#475569" }}>Memeriksa akses…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #070c17; font-family: 'Outfit', system-ui, sans-serif; color: #f1f5f9; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
        button { font-family: 'Outfit', system-ui, sans-serif; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#070c17" }}>
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          open={sidebarOpen}
        />

        <div style={{
          flex: 1,
          marginLeft: sidebarOpen ? "240px" : "68px",
          transition: "margin-left 0.25s ease",
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}>
          <Topbar
      activePage={activePage}
      onToggle={() => setSidebarOpen((p) => !p)}
      onNavigate={setActivePage}
      />

          <main
            key={activePage}
            style={{
              flex: 1,
              padding: "28px",
              overflowX: "auto",
              animation: "fadeIn 0.25s ease",
            }}
          >
            {renderPage()}
          </main>

          <footer style={{
            padding: "14px 28px",
            borderTop: "1px solid #1e293b",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span style={{ fontSize: "12px", color: "#334155" }}>
              © 2026 Walid Rent Car Management System
            </span>
            <span style={{ fontSize: "12px", color: "#334155" }}>v3.0.0</span>
          </footer>
        </div>
      </div>
    </>
  );
}