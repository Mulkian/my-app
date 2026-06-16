"use client";
// components/Sidebar.tsx

import { PageId } from "../types/types";
import { Icons } from "./icons";


const NAV_ITEMS = [
  { id: "dashboard"    as PageId, label: "Dashboard",           Icon: Icons.dashboard  },
  { id: "armada"       as PageId, label: "Manajemen Armada",    Icon: Icons.car        },
  { id: "penyewaan"    as PageId, label: "Penyewaan Mobil",     Icon: Icons.rent       },
  { id: "pengembalian" as PageId, label: "Pengembalian Mobil",  Icon: Icons.return     },
  { id: "pelanggan"    as PageId, label: "Data Pelanggan",      Icon: Icons.customers  },
  { id: "pembayaran"   as PageId, label: "Pembayaran",          Icon: Icons.payment    },
  { id: "laporan"      as PageId, label: "Laporan",             Icon: Icons.report     },
  { id: "pengaturan"   as PageId, label: "Pengaturan",          Icon: Icons.settings   },
];

interface Props {
  activePage: PageId;
  onNavigate: (id: PageId) => void;
  open: boolean;
}

export default function Sidebar({ activePage, onNavigate, open }: Props) {
  return (
    <aside style={{
      width: open ? "240px" : "68px",
      minHeight: "100vh",
      background: "#0a0f1e",
      borderRight: "1px solid #1e293b",
      display: "flex",
      flexDirection: "column",
      position: "fixed",
      top: 0, bottom: 0, left: 0,
      zIndex: 50,
      transition: "width 0.25s ease",
      overflow: "hidden",
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", gap: "10px", minHeight: "65px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #f59e0b, #d97706)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 16px rgba(245,158,11,0.35)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f0f0f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-4h10l2 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/>
            <circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/>
          </svg>
        </div>
        {open && (
          <div style={{ overflow: "hidden" }}>
            <p style={{ fontSize: "14px", fontWeight: 800, color: "#f1f5f9", whiteSpace: "nowrap", fontFamily: "Syne, sans-serif" }}>Walid Rent Car</p>
            <p style={{ fontSize: "10.5px", color: "#475569", whiteSpace: "nowrap" }}>Management System</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto", overflowX: "hidden" }}>
        {open && (
          <p style={{ fontSize: "10px", fontWeight: 700, color: "#334155", letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 8px 8px", whiteSpace: "nowrap" }}>
            MENU UTAMA
          </p>
        )}
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const active = activePage === id;
          return (
            <button key={id} onClick={() => onNavigate(id)} title={!open ? label : ""} style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: open ? "9px 10px" : "11px",
              borderRadius: "9px", border: "none", width: "100%", textAlign: "left",
              cursor: "pointer", marginBottom: "2px",
              background: active ? "#f59e0b18" : "transparent",
              color: active ? "#f59e0b" : "#64748b",
              borderLeft: active ? "2px solid #f59e0b" : "2px solid transparent",
              fontFamily: "inherit", transition: "all 0.15s",
              justifyContent: open ? "flex-start" : "center",
            }}>
              <span style={{ flexShrink: 0, color: active ? "#f59e0b" : "#475569" }}><Icon /></span>
              {open && <span style={{ fontSize: "13px", fontWeight: active ? 700 : 500, whiteSpace: "nowrap" }}>{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: "12px 10px", borderTop: "1px solid #1e293b" }}>
        {open ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "9px", background: "#1e293b" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #f59e0b, #d97706)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, color: "#0f0f0f", flexShrink: 0 }}>A</div>
            <div style={{ overflow: "hidden", flex: 1 }}>
              <p style={{ fontSize: "12.5px", fontWeight: 700, color: "#f1f5f9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Admin</p>
              <p style={{ fontSize: "11px", color: "#475569" }}>Super Admin</p>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: "linear-gradient(135deg, #f59e0b, #d97706)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 800, color: "#0f0f0f" }}>A</div>
          </div>
        )}
      </div>
    </aside>
  );
}

export { NAV_ITEMS };