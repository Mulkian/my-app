"use client";
// components/Topbar.tsx

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { PageId } from "../types/types";
import { Icons } from "./icons";
import { NAV_ITEMS } from "./Sidebar";

interface Props {
  activePage: PageId;
  onToggle: () => void;
}

export default function Topbar({ activePage, onToggle }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(
    null,
  );
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const label = NAV_ITEMS.find((n) => n.id === activePage)?.label ?? "";
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Load user dari Supabase session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        const u = data.session.user;
        setUser({
          name: u.user_metadata?.full_name ?? u.email?.split("@")[0] ?? "Admin",
          email: u.email ?? "",
        });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        const u = session.user;
        setUser({
          name: u.user_metadata?.full_name ?? u.email?.split("@")[0] ?? "Admin",
          email: u.email ?? "",
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    setLogoutLoading(true);
    await supabase.auth.signOut();
    router.push("/home");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "A";

  return (
    <>
      <style>{`
        @keyframes menuFadeIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .topbar-icon-btn {
          transition: background 0.15s, color 0.15s;
        }
        .topbar-icon-btn:hover {
          background: #1e293b !important;
          color: #f1f5f9 !important;
        }
        .user-menu-enter {
          animation: menuFadeIn 0.18s cubic-bezier(.22,1,.36,1) both;
        }
        .dropdown-item {
          transition: background 0.12s, color 0.12s;
          cursor: pointer;
        }
        .dropdown-item:hover {
          background: rgba(255,255,255,0.04) !important;
          color: #f1f5f9 !important;
        }
        .dropdown-logout:hover {
          background: rgba(248,113,113,0.08) !important;
          color: #f87171 !important;
        }
        .topbar-search:focus {
          outline: none;
          border-color: #f59e0b !important;
          width: 220px !important;
        }
      `}</style>

      <header
        style={{
          height: "65px",
          background: "rgba(10,15,30,0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid #1e293b",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
      >
        {/* ── Kiri: toggle + judul halaman ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={onToggle}
            className="topbar-icon-btn"
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              padding: "7px",
              borderRadius: "9px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Icons.menu />
          </button>
          <div>
            <p
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#f1f5f9",
                fontFamily: "Syne, sans-serif",
                lineHeight: 1.2,
              }}
            >
              {label}
            </p>
            <p style={{ fontSize: "11px", color: "#334155" }}>{today}</p>
          </div>
        </div>

        {/* ── Kanan: search + bell + user menu ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#334155",
                pointerEvents: "none",
              }}
            >
              <Icons.search />
            </span>
            <input
              placeholder="Cari..."
              className="topbar-search"
              style={{
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: "9px",
                padding: "7px 12px 7px 32px",
                color: "#f1f5f9",
                fontSize: "13px",
                width: "180px",
                fontFamily: "inherit",
                transition: "border-color 0.2s, width 0.25s",
              }}
            />
          </div>

          {/* Bell */}
          <button
            className="topbar-icon-btn"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "9px",
              background: "#0f172a",
              border: "1px solid #1e293b",
              color: "#64748b",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <Icons.bell />
            <span
              style={{
                position: "absolute",
                top: "7px",
                right: "7px",
                width: "6px",
                height: "6px",
                background: "#f59e0b",
                borderRadius: "50%",
                border: "1.5px solid #0a0f1e",
              }}
            />
          </button>

          {/* ── User dropdown ── */}
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              onClick={() => setUserMenuOpen((p) => !p)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "5px 10px 5px 6px",
                background: userMenuOpen ? "#1e293b" : "#0f172a",
                border: `1px solid ${userMenuOpen ? "#334155" : "#1e293b"}`,
                borderRadius: "10px",
                cursor: "pointer",
                transition: "background 0.15s, border-color 0.15s",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "7px",
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#0a0a0a",
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>

              {/* Nama */}
              <div style={{ textAlign: "left" }}>
                <p
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 700,
                    color: "#f1f5f9",
                    lineHeight: 1.2,
                    maxWidth: "110px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user?.name ?? "Admin"}
                </p>
                <p
                  style={{
                    fontSize: "10.5px",
                    color: "#475569",
                    lineHeight: 1,
                  }}
                >
                  Admin
                </p>
              </div>

              {/* Chevron */}
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#475569"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: userMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                  flexShrink: 0,
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Dropdown */}
            {userMenuOpen && (
              <div
                className="user-menu-enter"
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: "240px",
                  background: "#0a0f1e",
                  border: "1px solid #1e293b",
                  borderRadius: "13px",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                  overflow: "hidden",
                  zIndex: 100,
                }}
              >
                {/* Header info user */}
                <div
                  style={{
                    padding: "14px 16px",
                    borderBottom: "1px solid #1e293b",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "9px",
                      background: "linear-gradient(135deg, #f59e0b, #d97706)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      fontWeight: 800,
                      color: "#0a0a0a",
                      flexShrink: 0,
                      boxShadow: "0 4px 12px rgba(245,158,11,0.3)",
                    }}
                  >
                    {initials}
                  </div>
                  <div style={{ overflow: "hidden" }}>
                    <p
                      style={{
                        fontSize: "13.5px",
                        fontWeight: 700,
                        color: "#f1f5f9",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {user?.name ?? "Admin"}
                    </p>
                    <p
                      style={{
                        fontSize: "11.5px",
                        color: "#475569",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {user?.email ?? ""}
                    </p>
                  </div>
                </div>

                {/* Menu items */}
                <div style={{ padding: "6px" }}>
                  <button
                    className="dropdown-item"
                    onClick={() => setUserMenuOpen(false)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "9px 10px",
                      borderRadius: "8px",
                      background: "transparent",
                      border: "none",
                      color: "#94a3b8",
                      fontSize: "13px",
                      fontFamily: "inherit",
                      textAlign: "left",
                    }}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Profil Saya
                  </button>

                  <button
                    className="dropdown-item"
                    onClick={() => setUserMenuOpen(false)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "9px 10px",
                      borderRadius: "8px",
                      background: "transparent",
                      border: "none",
                      color: "#94a3b8",
                      fontSize: "13px",
                      fontFamily: "inherit",
                      textAlign: "left",
                    }}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    Pengaturan
                  </button>
                </div>

                {/* Divider */}
                <div
                  style={{
                    height: "1px",
                    background: "#1e293b",
                    margin: "0 6px",
                  }}
                />

                {/* Logout */}
                <div style={{ padding: "6px" }}>
                  <button
                    className="dropdown-item dropdown-logout"
                    onClick={handleLogout}
                    disabled={logoutLoading}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "9px 10px",
                      borderRadius: "8px",
                      background: "transparent",
                      border: "none",
                      color: "#64748b",
                      fontSize: "13px",
                      fontFamily: "inherit",
                      textAlign: "left",
                      cursor: logoutLoading ? "not-allowed" : "pointer",
                      opacity: logoutLoading ? 0.7 : 1,
                    }}
                  >
                    {logoutLoading ? (
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        style={{ animation: "spin 0.7s linear infinite" }}
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    ) : (
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                    )}
                    {logoutLoading ? "Keluar..." : "Keluar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
