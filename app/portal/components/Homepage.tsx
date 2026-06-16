"use client";
import type { Vehicle, Rental, Notification, ProfilState } from "types/types";
import {
  ACCENT, CARD_BG, CARD_BORDER, TEXT_PRIMARY, TEXT_MUTED, TEXT_SOFT,
} from "@/lib/constants";
import { fmt } from "@/lib/utils";
import { Icons } from "@/app/portal/components/icons";
import { Badge, VehicleImg } from "@/app/portal/components/ui";

interface Props {
  user: any;
  profil: ProfilState;
  vehicles: Vehicle[];
  rentals: Rental[];
  notifs: Notification[];
  unpaid: Rental[];
  onNavigate: (page: string) => void;
  onSelectVehicle: (v: Vehicle) => void;
}

export default function HomePage({
  user, profil, vehicles, rentals, notifs, unpaid, onNavigate, onSelectVehicle,
}: Props) {
  const userName = profil.name || user?.user_metadata?.full_name || user?.email || "Pelanggan";
  const activeRentals = rentals.filter((r) => r.status === "Aktif");
  const pendingRentals = rentals.filter((r) => r.status === "Pending");
  const availableVehicles = vehicles.filter((v) => v.status === "Tersedia");
  const unread = notifs.filter((n) => !n.read).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Welcome banner */}
      <div style={{ background: `linear-gradient(135deg, #1a2540 0%, #0f1724 100%)`, borderRadius: 16, border: `0.5px solid ${CARD_BORDER}`, padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 4 }}>Selamat datang kembali 👋</p>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: TEXT_PRIMARY, marginBottom: 8 }}>{userName}</h1>
          <p style={{ fontSize: 13, color: TEXT_SOFT }}>Sewa kendaraan mudah, cepat, dan terpercaya di Aceh.</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 40 }}>🚗</div>
          <p style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 4 }}>{availableVehicles.length} kendaraan tersedia</p>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {[
          { label: "Sewa Aktif", value: activeRentals.length, icon: <Icons.Car size={20} />, color: "#4ade80" },
          { label: "Menunggu", value: pendingRentals.length, icon: <Icons.Clock size={20} />, color: ACCENT },
          { label: "Belum Bayar", value: unpaid.length, icon: <Icons.Wallet size={20} />, color: "#f87171" },
          { label: "Notifikasi", value: unread, icon: <Icons.BellStat size={20} />, color: "#60a5fa" },
        ].map((s) => (
          <div key={s.label} style={{ background: CARD_BG, borderRadius: 12, border: `0.5px solid ${CARD_BORDER}`, padding: "18px 20px" }}>
            <div style={{ color: s.color, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: TEXT_PRIMARY, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Unpaid alert */}
      {unpaid.length > 0 && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
          <Icons.AlertTriangle />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#f87171" }}>
              {unpaid.length} tagihan belum dibayar
            </p>
            <p style={{ fontSize: 12, color: TEXT_MUTED }}>Segera lakukan pembayaran untuk menghindari denda.</p>
          </div>
          <button onClick={() => onNavigate("pembayaran")} style={{ background: "#f87171", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Bayar Sekarang
          </button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18 }}>
        {/* Available vehicles */}
        <div style={{ background: CARD_BG, borderRadius: 14, border: `0.5px solid ${CARD_BORDER}`, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `0.5px solid ${CARD_BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>Kendaraan Tersedia</h2>
            <button onClick={() => onNavigate("katalog")} style={{ background: "none", border: "none", color: ACCENT, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Lihat Semua →
            </button>
          </div>
          <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
            {availableVehicles.slice(0, 6).map((v) => (
              <div key={v.id} onClick={() => onSelectVehicle(v)} style={{ background: "#0f1724", borderRadius: 10, overflow: "hidden", cursor: "pointer", border: `0.5px solid ${CARD_BORDER}`, transition: "all 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.border = `0.5px solid ${ACCENT}`)}
                onMouseLeave={(e) => (e.currentTarget.style.border = `0.5px solid ${CARD_BORDER}`)}>
                <div style={{ height: 110, overflow: "hidden" }}>
                  <VehicleImg vehicle={v} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ padding: "10px 12px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 2 }}>{v.name}</div>
                  <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 6 }}>{v.plate}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: ACCENT }}>{fmt(v.rate)}<span style={{ fontSize: 10, color: TEXT_MUTED, fontWeight: 400 }}>/hari</span></div>
                </div>
              </div>
            ))}
            {availableVehicles.length === 0 && (
              <div style={{ gridColumn: "1/-1", padding: 32, textAlign: "center", color: TEXT_MUTED, fontSize: 13 }}>
                Tidak ada kendaraan tersedia saat ini.
              </div>
            )}
          </div>
        </div>

        {/* Recent rentals */}
        <div style={{ background: CARD_BG, borderRadius: 14, border: `0.5px solid ${CARD_BORDER}`, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `0.5px solid ${CARD_BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>Riwayat Terakhir</h2>
            <button onClick={() => onNavigate("riwayat")} style={{ background: "none", border: "none", color: ACCENT, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Semua →
            </button>
          </div>
          <div style={{ padding: "8px 0" }}>
            {rentals.slice(0, 5).map((r) => (
              <div key={r.id} style={{ padding: "12px 18px", borderBottom: `0.5px solid ${CARD_BORDER}`, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "#0f1724", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icons.Car size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_PRIMARY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.vehicle_name}</div>
                  <div style={{ fontSize: 11, color: TEXT_MUTED }}>{r.start_date} – {r.end_date}</div>
                </div>
                <Badge status={r.status} />
              </div>
            ))}
            {rentals.length === 0 && (
              <div style={{ padding: 32, textAlign: "center", color: TEXT_MUTED, fontSize: 13 }}>Belum ada riwayat sewa.</div>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ background: CARD_BG, borderRadius: 14, border: `0.5px solid ${CARD_BORDER}`, padding: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 16 }}>Aksi Cepat</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { label: "Booking Kendaraan", icon: <Icons.PlusSquare size={18} />, page: "booking" },
            { label: "Lihat Katalog", icon: <Icons.Search size={18} />, page: "katalog" },
            { label: "Riwayat Sewa", icon: <Icons.History />, page: "riwayat" },
            { label: "Pembayaran", icon: <Icons.CreditCard size={18} />, page: "pembayaran" },
            { label: "Bantuan", icon: <Icons.Help />, page: "bantuan" },
          ].map((a) => (
            <button key={a.page} onClick={() => onNavigate(a.page)} style={{ display: "flex", alignItems: "center", gap: 8, background: "#0f1724", border: `0.5px solid ${CARD_BORDER}`, borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = CARD_BORDER; e.currentTarget.style.color = TEXT_PRIMARY; }}>
              <span style={{ color: ACCENT }}>{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}