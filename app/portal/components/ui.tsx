"use client";
import { JSX } from "react";
import { ACCENT, CARD_BG, TEXT_MUTED, TEXT_SOFT } from "@/lib/constants";
import { getCarImg } from "@/lib/utils";
import type { Vehicle, Notification } from "types/types";
import { Icons } from "./icons";

// ─── Badge ────────────────────────────────────────────────────
const STATUS_MAP: Record<string, [string, string]> = {
  Aktif: ["rgba(59,130,246,0.15)", "#60a5fa"],
  Selesai: ["rgba(34,197,94,0.15)", "#4ade80"],
  Pending: ["rgba(245,158,11,0.15)", "#fbbf24"],
  Dibatalkan: ["rgba(239,68,68,0.15)", "#f87171"],
  Lunas: ["rgba(34,197,94,0.15)", "#4ade80"],
  DP: ["rgba(59,130,246,0.15)", "#60a5fa"],
  "Belum Bayar": ["rgba(239,68,68,0.15)", "#f87171"],
  Tersedia: ["rgba(34,197,94,0.15)", "#4ade80"],
  Disewa: ["rgba(239,68,68,0.15)", "#f87171"],
  Maintenance: ["rgba(245,158,11,0.15)", "#fbbf24"],
};

export const Badge = ({ status }: { status: string }) => {
  const [bg, color] = STATUS_MAP[status] ?? ["rgba(100,116,139,0.15)", "#94a3b8"];
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: bg, color, whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
};

// ─── StarRating ───────────────────────────────────────────────
export const StarRating = ({ value, onChange }: { value: number; onChange?: (v: number) => void }) => (
  <div style={{ display: "flex", gap: 4 }}>
    {[1, 2, 3, 4, 5].map((s) => (
      <span key={s} onClick={() => onChange?.(s)} style={{ cursor: onChange ? "pointer" : "default", color: s <= value ? ACCENT : "#334155", display: "flex" }}>
        <Icons.StarIcon filled={s <= value} size={20} />
      </span>
    ))}
  </div>
);

// ─── VehicleImg ───────────────────────────────────────────────
export const VehicleImg = ({ vehicle, style }: { vehicle?: Pick<Vehicle, "photo_url" | "name"> | null; style?: React.CSSProperties }) => (
  <img
    src={getCarImg(vehicle)}
    alt={vehicle?.name ?? "Kendaraan"}
    style={style}
    onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/400x200/131c2e/64748b?text=Kendaraan"; }}
  />
);

// ─── BrandIcon ────────────────────────────────────────────────
export const BrandIcon = ({ size = 36 }: { size?: number }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.28, background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-4h10l2 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="16.5" cy="17.5" r="2.5" />
    </svg>
  </div>
);

// ─── NotifIcon ────────────────────────────────────────────────
const NOTIF_CFG: Record<string, { bg: string; color: string; Icon: () => JSX.Element }> = {
  success: { bg: "rgba(34,197,94,0.12)", color: "#4ade80", Icon: Icons.CheckNotif },
  warning: { bg: "rgba(245,158,11,0.12)", color: "#fbbf24", Icon: Icons.WarnNotif },
  error:   { bg: "rgba(239,68,68,0.12)", color: "#f87171", Icon: Icons.ErrNotif },
  info:    { bg: "rgba(59,130,246,0.12)", color: "#60a5fa", Icon: Icons.InfoNotif },
};

export const NotifIcon = ({ type }: { type: Notification["type"] }) => {
  const { bg, color, Icon } = NOTIF_CFG[type];
  return (
    <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon />
    </div>
  );
};