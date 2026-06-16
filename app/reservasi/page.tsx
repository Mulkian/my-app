"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface StatCard {
  label: string;
  value: string;
  change: string;
  changeType: "up" | "down" | "neutral";
  icon: React.ReactNode;
  badge: string;
  badgeColor: "blue" | "green" | "amber";
}

const CarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="2" />
    <path d="M16 8h4l3 5v3h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const DollarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const recentActivities = [
  { id: 1, type: "Pemesanan Baru", customer: "Budi Santoso", car: "Toyota Avanza 2023", date: "07 Mar 2024", duration: "3 hari", status: "Aktif", statusColor: "#22c55e" },
  { id: 2, type: "Pengembalian", customer: "Siti Rahayu", car: "Honda HR-V 2022", date: "06 Mar 2024", duration: "7 hari", status: "Selesai", statusColor: "#3b82f6" },
  { id: 3, type: "Pemesanan Baru", customer: "Ahmad Fauzi", car: "Mitsubishi Xpander 2023", date: "06 Mar 2024", duration: "2 hari", status: "Aktif", statusColor: "#22c55e" },
  { id: 4, type: "Pembayaran", customer: "Dewi Kartika", car: "Toyota Innova 2022", date: "05 Mar 2024", duration: "5 hari", status: "Lunas", statusColor: "#f59e0b" },
  { id: 5, type: "Pemesanan Baru", customer: "Rudi Hartono", car: "Suzuki Ertiga 2023", date: "05 Mar 2024", duration: "1 hari", status: "Menunggu", statusColor: "#94a3b8" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeNav, setActiveNav] = useState("dashboard");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      setUser(user);
      setIsLoading(false);
    };
    checkAuth();

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          router.replace("/login");
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0f1e",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid rgba(59,130,246,0.3)",
              borderTopColor: "#3b82f6",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }}
          />
          <p style={{ color: "#64748b", fontSize: "14px" }}>Memuat...</p>
        </div>
      </div>
    );
  }

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Pengguna";

  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const stats: StatCard[] = [
    {
      label: "Total Armada",
      value: "42",
      change: "+3 bulan ini",
      changeType: "up",
      icon: <CarIcon />,
      badge: "36 Tersedia",
      badgeColor: "green",
    },
    {
      label: "Aktif Disewa",
      value: "18",
      change: "+5 dari minggu lalu",
      changeType: "up",
      icon: <CalendarIcon />,
      badge: "Hari ini",
      badgeColor: "blue",
    },
    {
      label: "Total Pelanggan",
      value: "284",
      change: "+12 bulan ini",
      changeType: "up",
      icon: <UsersIcon />,
      badge: "Aktif",
      badgeColor: "blue",
    },
    {
      label: "Pendapatan Bulan Ini",
      value: "Rp 48,5 Jt",
      change: "+18% vs bulan lalu",
      changeType: "up",
      icon: <DollarIcon />,
      badge: "Maret 2024",
      badgeColor: "amber",
    },
  ];

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg> },
    { id: "armada", label: "Manajemen Armada", icon: <CarIcon /> },
    { id: "reservasi", label: "Reservasi", icon: <CalendarIcon /> },
    { id: "pelanggan", label: "Pelanggan", icon: <UsersIcon /> },
    { id: "laporan", label: "Laporan Keuangan", icon: <DollarIcon /> },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "260px",
          minHeight: "100vh",
          background: "#111827",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 40,
        }}
      >
        {/* Brand */}
        <div
          style={{
            padding: "24px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="2" />
                <path d="M16 8h4l3 5v3h-7V8z" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <div>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: "16px", color: "#f1f5f9", lineHeight: 1.2 }}>CarRent Pro</p>
              <p style={{ fontSize: "11px", color: "#475569" }}>Management System</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", padding: "0 8px", marginBottom: "8px" }}>
            Menu Utama
          </p>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeNav === item.id ? "active" : ""}`}
              onClick={() => setActiveNav(item.id)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* User info + logout */}
        <div
          style={{
            padding: "16px 12px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.03)",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
                fontWeight: 700,
                color: "white",
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div style={{ overflow: "hidden", flex: 1 }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#f1f5f9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {displayName}
              </p>
              <p style={{ fontSize: "11px", color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.email}
              </p>
            </div>
          </div>
          <button
            className="nav-item"
            onClick={handleLogout}
            disabled={isLoggingOut}
            style={{ color: isLoggingOut ? "#475569" : undefined }}
          >
            <LogoutIcon />
            {isLoggingOut ? "Keluar..." : "Keluar"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, marginLeft: "260px", minHeight: "100vh" }}>
        {/* Top bar */}
        <header
          style={{
            padding: "20px 32px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(10,15,30,0.8)",
            backdropFilter: "blur(10px)",
            position: "sticky",
            top: 0,
            zIndex: 30,
          }}
        >
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 600, color: "#f1f5f9" }}>
              Selamat Datang, {displayName.split(" ")[0]}! 👋
            </h1>
            <p style={{ fontSize: "13px", color: "#475569", marginTop: "2px" }}>
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="badge badge-green">
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e" }} />
              Sistem Online
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent",
                color: "#94a3b8",
                fontSize: "13px",
                fontWeight: 500,
                cursor: isLoggingOut ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
                e.currentTarget.style.color = "#fca5a5";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.color = "#94a3b8";
              }}
            >
              <LogoutIcon />
              {isLoggingOut ? "Keluar..." : "Logout"}
            </button>
          </div>
        </header>

        {/* Page content */}
        <div style={{ padding: "32px" }}>
          {/* Stats grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "20px",
              marginBottom: "32px",
            }}
          >
            {stats.map((stat, idx) => (
              <div key={idx} className="stat-card">
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: "rgba(59,130,246,0.15)",
                      border: "1px solid rgba(59,130,246,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#60a5fa",
                    }}
                  >
                    {stat.icon}
                  </div>
                  <span className={`badge badge-${stat.badgeColor}`}>
                    {stat.badge}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "#f1f5f9",
                    marginBottom: "4px",
                    fontFamily: "'DM Serif Display', serif",
                  }}
                >
                  {stat.value}
                </p>
                <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "6px" }}>
                  {stat.label}
                </p>
                <p style={{ fontSize: "12px", color: "#22c55e", display: "flex", alignItems: "center", gap: "4px" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15" /></svg>
                  {stat.change}
                </p>
              </div>
            ))}
          </div>

          {/* Recent activity */}
          <div
            style={{
              background: "#111827",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#f1f5f9" }}>
                  Aktivitas Terbaru
                </h2>
                <p style={{ fontSize: "13px", color: "#475569", marginTop: "2px" }}>
                  Riwayat transaksi 7 hari terakhir
                </p>
              </div>
              <button
                style={{
                  padding: "7px 14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(59,130,246,0.3)",
                  background: "rgba(59,130,246,0.1)",
                  color: "#93c5fd",
                  fontSize: "13px",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Lihat Semua
              </button>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                    {["Tipe", "Pelanggan", "Kendaraan", "Tanggal", "Durasi", "Status"].map(
                      (h) => (
                        <th
                          key={h}
                          style={{
                            padding: "12px 20px",
                            textAlign: "left",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#475569",
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {recentActivities.map((activity, i) => (
                    <tr
                      key={activity.id}
                      style={{
                        borderTop: "1px solid rgba(255,255,255,0.04)",
                        transition: "background 0.15s",
                        cursor: "default",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,0.02)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                          {activity.type}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "13px", color: "#f1f5f9", fontWeight: 500 }}>
                          {activity.customer}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                          {activity.car}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "13px", color: "#64748b" }}>
                          {activity.date}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                          {activity.duration}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 10px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: 500,
                            background: `${activity.statusColor}18`,
                            color: activity.statusColor,
                            border: `1px solid ${activity.statusColor}30`,
                          }}
                        >
                          <div
                            style={{
                              width: "5px",
                              height: "5px",
                              borderRadius: "50%",
                              background: activity.statusColor,
                            }}
                          />
                          {activity.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}