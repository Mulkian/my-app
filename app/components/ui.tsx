"use client";
// components/ui.tsx

import { ReactNode } from "react";
import { Icons } from "./icons";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
export const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export const fmtShort = (n: number) =>
  n >= 1_000_000 ? `Rp ${(n / 1_000_000).toFixed(1)}Jt` : `Rp ${(n / 1_000).toFixed(0)}Rb`;

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
const BADGE_MAP: Record<string, { bg: string; color: string; border: string }> = {
  Tersedia:      { bg: "#14532d22", color: "#4ade80", border: "#4ade8033" },
  Disewa:        { bg: "#1e3a5f22", color: "#60a5fa", border: "#60a5fa33" },
  Maintenance:   { bg: "#78350f22", color: "#fbbf24", border: "#fbbf2433" },
  Aktif:         { bg: "#1e3a5f22", color: "#60a5fa", border: "#60a5fa33" },
  Selesai:       { bg: "#14532d22", color: "#4ade80", border: "#4ade8033" },
  Pending:       { bg: "#78350f22", color: "#fbbf24", border: "#fbbf2433" },
  Diproses:      { bg: "#78350f22", color: "#fbbf24", border: "#fbbf2433" },
  Lunas:         { bg: "#14532d22", color: "#4ade80", border: "#4ade8033" },
  DP:            { bg: "#1e3a5f22", color: "#60a5fa", border: "#60a5fa33" },
  "Belum Bayar": { bg: "#7f1d1d22", color: "#f87171", border: "#f8717133" },
  Dibatalkan:    { bg: "#7f1d1d22", color: "#f87171", border: "#f8717133" },
};

export const StatusBadge = ({ status }: { status: string }) => {
  const s = BADGE_MAP[status] ?? { bg: "#1f2937", color: "#9ca3af", border: "#4b556333" };
  return (
    <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11.5px", fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
};

// ─── LOADING ──────────────────────────────────────────────────────────────────
export const Loading = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 20px", flexDirection: "column", gap: "12px" }}>
    <div style={{ width: "32px", height: "32px", border: "3px solid #1e293b", borderTopColor: "#f59e0b", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <span style={{ fontSize: "13px", color: "#475569" }}>Memuat data...</span>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ─── EMPTY ────────────────────────────────────────────────────────────────────
export const Empty = ({ text = "Belum ada data." }: { text?: string }) => (
  <div style={{ textAlign: "center", padding: "60px 20px" }}>
    <div style={{ fontSize: "36px", marginBottom: "10px" }}>📭</div>
    <p style={{ fontSize: "14px", color: "#475569" }}>{text}</p>
  </div>
);

// ─── ERROR ALERT ──────────────────────────────────────────────────────────────
export const ErrAlert = ({ msg }: { msg: string }) =>
  msg ? (
    <div style={{ background: "#7f1d1d22", border: "1px solid #f8717133", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "13px", color: "#f87171" }}>
      ⚠ {msg}
    </div>
  ) : null;

// ─── SUCCESS TOAST ────────────────────────────────────────────────────────────
export const SuccessToast = ({ msg }: { msg: string }) =>
  msg ? (
    <div style={{ background: "#14532d22", border: "1px solid #4ade8033", borderRadius: "10px", padding: "11px 16px", marginBottom: "18px", display: "flex", alignItems: "center", gap: "8px", color: "#4ade80", fontSize: "13px", fontWeight: 600 }}>
      <Icons.check /> {msg}
    </div>
  ) : null;

// ─── MODAL ────────────────────────────────────────────────────────────────────
export const Modal = ({ title, onClose, children, width = "520px" }: {
  title: string; onClose: () => void; children: ReactNode; width?: string;
}) => (
  <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} onClick={onClose} />
    <div style={{ position: "relative", width: "100%", maxWidth: width, background: "#0f172a", border: "1px solid #1e293b", borderRadius: "16px", boxShadow: "0 24px 80px rgba(0,0,0,0.8)", maxHeight: "90vh", overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #1e293b" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#f1f5f9" }}>{title}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "4px", borderRadius: "6px", display: "flex" }}>
          <Icons.close />
        </button>
      </div>
      <div style={{ padding: "24px" }}>{children}</div>
    </div>
  </div>
);

// ─── FIELD ────────────────────────────────────────────────────────────────────
export const Field = ({ label, children, required }: { label: string; children: ReactNode; required?: boolean }) => (
  <div style={{ marginBottom: "16px" }}>
    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#94a3b8", marginBottom: "6px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
      {label}{required && <span style={{ color: "#f87171", marginLeft: "3px" }}>*</span>}
    </label>
    {children}
  </div>
);

// ─── INPUT ────────────────────────────────────────────────────────────────────
export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", padding: "10px 14px", color: "#f1f5f9", fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
);

// ─── SELECT ───────────────────────────────────────────────────────────────────
export const Select = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) => (
  <select {...props} style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", padding: "10px 14px", color: "#f1f5f9", fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "inherit", cursor: "pointer" }}>
    {children}
  </select>
);

// ─── BUTTON ───────────────────────────────────────────────────────────────────
type BtnVariant = "primary" | "secondary" | "danger" | "success" | "ghost";

export const Btn = ({ children, onClick, variant = "primary", icon, small, disabled }: {
  children: ReactNode; onClick?: () => void; variant?: BtnVariant;
  icon?: ReactNode; small?: boolean; disabled?: boolean;
}) => {
  const styles: Record<BtnVariant, object> = {
    primary:   { background: "#f59e0b", color: "#0f0f0f", border: "none" },
    secondary: { background: "transparent", color: "#94a3b8", border: "1px solid #334155" },
    danger:    { background: "#7f1d1d33", color: "#f87171", border: "1px solid #f8717133" },
    success:   { background: "#14532d33", color: "#4ade80", border: "1px solid #4ade8033" },
    ghost:     { background: "transparent", color: "#64748b", border: "none" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: small ? "6px 12px" : "9px 18px", borderRadius: "8px", fontSize: small ? "12px" : "13px", fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, transition: "all 0.15s", whiteSpace: "nowrap", fontFamily: "inherit", ...styles[variant] }}>
      {icon && icon}{children}
    </button>
  );
};

// ─── PAGE HEADER ──────────────────────────────────────────────────────────────
export const PageHeader = ({ title, sub, action }: { title: string; sub: string; action?: ReactNode }) => (
  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.3px", marginBottom: "4px", fontFamily: "Syne, sans-serif" }}>{title}</h1>
      <p style={{ color: "#64748b", fontSize: "14px" }}>{sub}</p>
    </div>
    {action && <div>{action}</div>}
  </div>
);

// ─── TABLE WRAPPER ────────────────────────────────────────────────────────────
export const TableWrap = ({ headers, children, loading, empty, emptyText }: {
  headers: string[]; children: ReactNode; loading?: boolean; empty?: boolean; emptyText?: string;
}) => (
  <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", overflow: "hidden" }}>
    {loading ? <Loading /> : empty ? <Empty text={emptyText} /> : (
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Outfit, sans-serif" }}>
          <thead>
            <tr style={{ background: "#0a0f1e" }}>
              {headers.map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    )}
  </div>
);

export const Td = ({ children, bold, muted, mono }: { children: ReactNode; bold?: boolean; muted?: boolean; mono?: boolean }) => (
  <td style={{ padding: "13px 16px", fontSize: mono ? "12px" : "13px", color: muted ? "#64748b" : bold ? "#f1f5f9" : "#94a3b8", fontWeight: bold ? 700 : 400, whiteSpace: "nowrap", fontFamily: mono ? "monospace" : "inherit" }}>
    {children}
  </td>
);