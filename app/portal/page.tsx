"use client";
// app/portal/page.tsx — Walid Rent Car Aceh · Portal Pelanggan

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { ReactNode } from "react";

// ── Lib ───────────────────────────────────────────────────────
import type {
  NavId,
  Vehicle,
  Rental,
  Notification,
  ProfilState,
} from "types/types";
import {
  ACCENT,
  CARD_BG,
  CARD_BORDER,
  SIDEBAR_BG,
  SIDEBAR_HOVER,
  SIDEBAR_ACTIVE_BG,
  PAGE_BG,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TOPBAR_BG,
} from "@/lib/constants";
import { fmt } from "@/lib/utils";

// ── Components ────────────────────────────────────────────────
import { Icons } from "./components/icons";
import { BrandIcon } from "./components/ui";

// ── Pages ─────────────────────────────────────────────────────
import HomePage from "./components/Homepage";
import KatalogPage from "./components/katalogPage";
import BookingPage from "./components/BookingPage";
import RiwayatPage from "./components/RiwayatPage";
import PembayaranPage from "./components/PembayaranPage";
import NotifikasiPage from "./components/Notifikasipage";
import ProfilPage from "./components/Profilepage";
import BantuanPage from "./components/Bantuanpage";

// ─── Nav config ───────────────────────────────────────────────
// Gunakan ReactNode bukan JSX.Element untuk menghindari error "Cannot find namespace JSX"
const NAV_ITEMS: { id: NavId; label: string; icon: ReactNode }[] = [
  { id: "home", label: "Beranda", icon: <Icons.Home /> },
  { id: "katalog", label: "Katalog", icon: <Icons.Catalog /> },
  { id: "booking", label: "Booking", icon: <Icons.Booking /> },
  { id: "riwayat", label: "Riwayat", icon: <Icons.History /> },
  { id: "pembayaran", label: "Pembayaran", icon: <Icons.Payment /> },
  { id: "notifikasi", label: "Notifikasi", icon: <Icons.Bell /> },
  { id: "profil", label: "Profil", icon: <Icons.UserNav /> },
  { id: "bantuan", label: "Bantuan", icon: <Icons.Help /> },
];

// ─── Helper: format waktu relatif dari timestamp ───────────────
function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Root Component ───────────────────────────────────────────
export default function PortalPage() {
  const router = useRouter();

  const [page, setPage] = useState<NavId>("home");
  const [user, setUser] = useState<any>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebar] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [preselectedRental, setPreselectedRental] = useState<Rental | null>(null);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [profil, setProfil] = useState<ProfilState>({
    name: "", phone: "", address: "", nik: "", emergency: "",
  });

  // ── Init ──────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }
      setUser(session.user);

      const [{ data: v }, { data: r }, { data: notifData }] = await Promise.all([
        supabase.from("vehicles").select("*, photo_url").order("name"),
        supabase.from("rentals").select("*").eq("customer_id", session.user.id).order("created_at", { ascending: false }),
        supabase.from("notifications").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }),
      ]);
      setVehicles(v ?? []);
      setRentals(r ?? []);
      setNotifs(
        (notifData ?? []).map((n: any) => ({
          ...n,
          time: formatRelativeTime(n.created_at),
        })),
      );

      const { data: cust } = await supabase
        .from("customers").select("name,phone,address").eq("id", session.user.id).single();
      setProfil(
        cust
          ? { name: cust.name ?? "", phone: cust.phone ?? "", address: cust.address ?? "", nik: "", emergency: "" }
          : { name: session.user.user_metadata?.full_name ?? "", phone: "", address: "", nik: "", emergency: "" },
      );
      setLoading(false);
    };
    init();
  }, [router]);

  // ── Realtime ──────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("portal-rentals-realtime")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rentals" }, (payload) => {
        setRentals((prev) =>
          prev.map((r) => r.id === payload.new.id ? { ...r, ...(payload.new as Rental) } : r),
        );
        if (payload.old?.status === "Pending" && payload.new?.status === "Aktif") {
          pushNotif("success", "Booking Dikonfirmasi! 🎉", `Booking ${payload.new.vehicle_name} Anda dikonfirmasi admin. Status: Aktif.`);
        }
        if (payload.old?.status === "Pending" && payload.new?.status === "Dibatalkan") {
          pushNotif("error", "Booking Ditolak", `Maaf, booking ${payload.new.vehicle_name} Anda ditolak admin.`);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Helpers ───────────────────────────────────────────────────
  // Insert notifikasi ke Supabase (persist per user) lalu update state lokal
  const pushNotif = async (type: Notification["type"], title: string, message: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("notifications")
      .insert({ user_id: user.id, type, title, message, read: false })
      .select()
      .single();

    if (error || !data) {
      // fallback: tetap tampilkan di UI walau insert gagal, supaya user tidak kehilangan info
      setNotifs((prev) => [
        { id: Date.now().toString(), type, title, message, time: "Baru saja", read: false } as Notification,
        ...prev,
      ]);
      return;
    }
    setNotifs((prev) => [{ ...data, time: "Baru saja" }, ...prev]);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  // navigate bertipe (string) => void agar kompatibel dengan semua komponen
  // yang mendeklarasikan onNavigate: (page: string) => void
  const navigate = (target: string) => setPage(target as NavId);

  // ── Derived ───────────────────────────────────────────────────
  const unread = notifs.filter((n) => !n.read).length;
  const unpaid = rentals.filter((r) => r.payment_status === "Belum Bayar");
  const profil_initial = (profil.name || user?.email || "?")[0].toUpperCase();

  // ── Loading screen ────────────────────────────────────────────
  if (loading)
    return (
      <div style={{ minHeight: "100vh", background: PAGE_BG, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
        <BrandIcon size={44} />
        <p style={{ fontSize: 14, color: TEXT_MUTED }}>Memuat portal…</p>
      </div>
    );

  // ── Page router ───────────────────────────────────────────────
  const renderPage = () => {
    switch (page) {
      case "home":
        return (
          <HomePage
            user={user}
            profil={profil}
            vehicles={vehicles}
            rentals={rentals}
            notifs={notifs}
            unpaid={unpaid}
            onNavigate={navigate}
            onSelectVehicle={(v: Vehicle) => { setSelectedVehicle(v); navigate("booking"); }}
          />
        );
      case "katalog":
        return (
          <KatalogPage
            vehicles={vehicles}
            onBookNow={(v: Vehicle) => { setSelectedVehicle(v); navigate("booking"); }}
          />
        );
      case "booking":
        return (
          <BookingPage
            vehicles={vehicles}
            user={user}
            profil={profil}
            selectedVehicle={selectedVehicle}
            setSelectedVehicle={setSelectedVehicle}
            onBookSuccess={(rental: Rental) => {
              setRentals((prev) => [rental, ...prev]);
              pushNotif("success", "Booking Berhasil", `Booking ${rental.vehicle_name} menunggu konfirmasi admin.`);
            }}
            onNavigate={navigate}
          />
        );
      case "riwayat":
        return (
          <RiwayatPage
            rentals={rentals}
            vehicles={vehicles}
            onPayNow={(rental: Rental) => { setPreselectedRental(rental); navigate("pembayaran"); }}
          />
        );
      case "pembayaran":
        return (
          <PembayaranPage
            rentals={rentals}
            vehicles={vehicles}
            preselectedRental={preselectedRental}
            onPaymentComplete={(updated: Rental[]) => { setRentals(updated); setPreselectedRental(null); }}
            onNotify={(n: { type: Notification["type"]; title: string; message: string }) =>
              pushNotif(n.type, n.title, n.message)
            }
          />
        );
      case "notifikasi":
        return (
          <NotifikasiPage
            notifs={notifs}
            onMarkRead={async (id: string) => {
              setNotifs((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
              await supabase.from("notifications").update({ read: true }).eq("id", id);
            }}
            onMarkAllRead={async () => {
              setNotifs((p) => p.map((n) => ({ ...n, read: true })));
              if (user) {
                await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
              }
            }}
          />
        );
      case "profil":
        return <ProfilPage user={user} profil={profil} setProfil={setProfil} rentals={rentals} />;
      case "bantuan":
        return <BantuanPage userEmail={user?.email} />;
      default:
        return null;
    }
  };

  // ─── Shell ────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${PAGE_BG}; font-family: 'Plus Jakarta Sans', sans-serif; -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: ${SIDEBAR_BG}; }
        ::-webkit-scrollbar-thumb { background: #1e2d45; border-radius: 3px; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(0.92); } }
        .nav-btn { display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:9px; cursor:pointer; font-size:13px; font-weight:600; color:${TEXT_MUTED}; border:none; background:none; width:100%; text-align:left; font-family:inherit; transition:all 0.12s; white-space:nowrap; }
        .nav-btn:hover { background:${SIDEBAR_HOVER}; color:${ACCENT}; }
        .nav-btn.active { background:${SIDEBAR_ACTIVE_BG}; color:${ACCENT}; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6); }
        select option { background: #0f1724; color: ${TEXT_PRIMARY}; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: PAGE_BG, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>

        {/* ── Sidebar ──────────────────────────────────────────── */}
        <div style={{ width: sidebarOpen ? 224 : 64, minHeight: "100vh", background: SIDEBAR_BG, borderRight: `1px solid ${CARD_BORDER}`, display: "flex", flexDirection: "column", transition: "width 0.22s ease", overflow: "hidden", position: "fixed", top: 0, left: 0, zIndex: 50 }}>
          {/* Brand */}
          <div style={{ padding: "18px 14px", borderBottom: `1px solid ${CARD_BORDER}`, display: "flex", alignItems: "center", gap: 10 }}>
            <BrandIcon size={36} />
            {sidebarOpen && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: TEXT_PRIMARY, lineHeight: 1.2 }}>Walid Rent Car</div>
                <div style={{ fontSize: 10, color: TEXT_MUTED, fontWeight: 500 }}>Aceh</div>
              </div>
            )}
          </div>

          {sidebarOpen && (
            <div style={{ padding: "16px 14px 6px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: TEXT_MUTED, textTransform: "uppercase" }}>
              MENU UTAMA
            </div>
          )}

          {/* Nav items */}
          <nav style={{ flex: 1, padding: "8px 8px", overflowY: "auto" }}>
            {NAV_ITEMS.map((n) => (
              <button key={n.id} className={`nav-btn ${page === n.id ? "active" : ""}`} onClick={() => setPage(n.id)}>
                <span style={{ flexShrink: 0, display: "flex" }}>{n.icon}</span>
                {sidebarOpen && <span>{n.label}</span>}
                {n.id === "notifikasi" && unread > 0 && sidebarOpen && (
                  <span style={{ marginLeft: "auto", background: ACCENT, color: "#fff", fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 20 }}>{unread}</span>
                )}
                {n.id === "pembayaran" && unpaid.length > 0 && sidebarOpen && (
                  <span style={{ marginLeft: "auto", background: "#f59e0b", color: "#fff", fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 20 }}>{unpaid.length}</span>
                )}
              </button>
            ))}
          </nav>

          {/* User + logout */}
          <div style={{ borderTop: `1px solid ${CARD_BORDER}` }}>
            {sidebarOpen && (
              <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                  {profil_initial}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_PRIMARY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {profil.name || "Pelanggan"}
                  </div>
                  <div style={{ fontSize: 11, color: TEXT_MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user?.email}
                  </div>
                </div>
              </div>
            )}
            <div style={{ padding: "8px 8px 12px" }}>
              <button className="nav-btn" style={{ color: "#f87171" }} onClick={handleLogout}>
                <span style={{ flexShrink: 0, display: "flex" }}><Icons.Logout /></span>
                {sidebarOpen && "Keluar"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Main content ──────────────────────────────────────── */}
        <div style={{ flex: 1, marginLeft: sidebarOpen ? 224 : 64, transition: "margin-left 0.22s ease", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          {/* Topbar */}
          <div style={{ height: 54, background: TOPBAR_BG, borderBottom: `1px solid ${CARD_BORDER}`, display: "flex", alignItems: "center", padding: "0 24px", gap: 14, position: "sticky", top: 0, zIndex: 40 }}>
            <button onClick={() => setSidebar((p) => !p)} style={{ background: "none", border: "none", color: TEXT_MUTED, cursor: "pointer", padding: 4, display: "flex", flexShrink: 0 }}>
              <Icons.Menu />
            </button>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>
                {NAV_ITEMS.find((n) => n.id === page)?.label}
              </span>
              <span style={{ fontSize: 12, color: TEXT_MUTED, marginLeft: 8 }}>
                {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
            {/* Bell */}
            <button onClick={() => setPage("notifikasi")} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
              <Icons.BellTopbar unread={unread} />
              {unread > 0 && (
                <span style={{ position: "absolute", top: 0, right: 0, width: 14, height: 14, borderRadius: "50%", background: ACCENT, color: "#fff", fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {unread}
                </span>
              )}
            </button>
            {/* Avatar */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#1a2540", borderRadius: 8, padding: "5px 10px 5px 5px" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>
                {profil_initial}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.2 }}>{profil.name || "Pelanggan"}</div>
                <div style={{ fontSize: 10, color: TEXT_MUTED }}>Pelanggan</div>
              </div>
            </div>
          </div>

          {/* Page content */}
          <main key={page} style={{ flex: 1, padding: 24, animation: "fadeUp 0.18s ease" }}>
            {renderPage()}
          </main>

          {/* Footer */}
          <footer style={{ padding: "14px 24px", borderTop: `1px solid ${CARD_BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: TEXT_MUTED }}>© 2026 Walid Rent Car Aceh. Hak cipta dilindungi.</span>
            <span style={{ fontSize: 12, color: TEXT_MUTED }}>v2.1</span>
          </footer>
        </div>
      </div>
    </>
  );
}