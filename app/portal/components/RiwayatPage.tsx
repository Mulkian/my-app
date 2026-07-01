"use client";
import { useState } from "react";
import type { Rental, Vehicle } from "types/types";
import {
  ACCENT, CARD_BG, CARD_BORDER, TEXT_PRIMARY, TEXT_MUTED, TEXT_SOFT,
  lStyle, iStyle,
} from "@/lib/constants";
import { fmt, fmtDate } from "@/lib/utils";
import { Icons } from "../components/icons";
import { Badge, VehicleImg, StarRating } from "../components/ui";

interface Props {
  rentals: Rental[];
  vehicles: Vehicle[];
  onPayNow: (rental: Rental) => void;
}

const STATUS_FILTERS = ["Semua", "Aktif", "Pending", "Selesai", "Dibatalkan"] as const;

export default function RiwayatPage({ rentals, vehicles, onPayNow }: Props) {
  const [filter,          setFilter]          = useState("Semua");
  const [activeRental,    setActiveRental]    = useState<Rental | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [review,          setReview]          = useState({ rating: 5, comment: "" });

  const getVehicleByName = (name: string) =>
    vehicles.find((v) => v.name === name) ?? { name, photo_url: undefined };

  const filtered = filter === "Semua"
    ? rentals
    : rentals.filter((r) => r.status === filter);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: TEXT_PRIMARY, marginBottom: 4 }}>Riwayat Sewa</h1>
        <p style={{ fontSize: 13, color: TEXT_MUTED }}>{rentals.length} transaksi total</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {STATUS_FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: "7px 16px", borderRadius: 20, border: `0.5px solid ${CARD_BORDER}`, background: filter === f ? ACCENT : CARD_BG, color: filter === f ? "#fff" : TEXT_MUTED, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            {f} {f !== "Semua" && <span style={{ fontSize: 11 }}>({rentals.filter((r) => r.status === f).length})</span>}
          </button>
        ))}
      </div>

      {/* Detail modal */}
      {activeRental && (
        <DetailModal
          rental={activeRental}
          vehicle={getVehicleByName(activeRental.vehicle_name)}
          onClose={() => setActiveRental(null)}
          onPayNow={() => { onPayNow(activeRental); setActiveRental(null); }}
          onReview={() => { setActiveRental(null); setShowReviewModal(true); setReview({ rating: 5, comment: "" }); }}
        />
      )}

      {/* Review modal */}
      {showReviewModal && (
        <ReviewModal
          review={review}
          setReview={setReview}
          onClose={() => setShowReviewModal(false)}
          onSubmit={() => { alert("Ulasan berhasil dikirim! Terima kasih."); setShowReviewModal(false); }}
        />
      )}

      {/* Table */}
      <div style={{ background: CARD_BG, borderRadius: 14, border: `0.5px solid ${CARD_BORDER}`, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#0f1724" }}>
                  {["Kendaraan", "Periode", "Hari", "Total", "Bayar", "Status", ""].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: TEXT_MUTED, letterSpacing: "0.07em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={i}
                    style={{ borderTop: `0.5px solid rgba(255,255,255,0.04)`, background: r.status === "Pending" ? "rgba(245,158,11,0.04)" : "transparent", transition: "background 0.3s ease" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <VehicleImg vehicle={getVehicleByName(r.vehicle_name)} style={{ width: 52, height: 38, objectFit: "cover", borderRadius: 7, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>{r.vehicle_name}</div>
                          <div style={{ fontSize: 11, color: TEXT_MUTED }}>{r.plate}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: TEXT_SOFT, whiteSpace: "nowrap" }}>
                      {fmtDate(r.start_date)} – {fmtDate(r.end_date)}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: TEXT_PRIMARY }}>{r.days}h</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: ACCENT }}>{fmt(r.total_cost)}</td>
                    <td style={{ padding: "12px 16px" }}><Badge status={r.payment_status} /></td>
                    <td style={{ padding: "12px 16px" }}><Badge status={r.status} /></td>
                    <td style={{ padding: "12px 16px" }}>
                      <button onClick={() => setActiveRental(r)}
                        style={{ padding: "6px 12px", borderRadius: 7, border: `0.5px solid ${CARD_BORDER}`, background: "#1a2540", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: TEXT_SOFT }}>
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components (tidak berubah) ──────────────────────────────────────────

function DetailModal({ rental, vehicle, onClose, onPayNow, onReview }: {
  rental: Rental;
  vehicle: any;
  onClose: () => void;
  onPayNow: () => void;
  onReview: () => void;
}) {
  const statusConfig = {
    Pending: {
      bg:     "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.3)",
      color:  "#fbbf24",
      icon:   "⏳",
      title:  "Menunggu Konfirmasi Admin",
      desc:   "Booking Anda sedang ditinjau. Admin akan mengkonfirmasi dalam maks. 1×24 jam.",
    },
    Aktif: {
      bg:     "rgba(34,197,94,0.08)",
      border: "rgba(34,197,94,0.3)",
      color:  "#4ade80",
      icon:   "✅",
      title:  "Booking Dikonfirmasi!",
      desc:   "Sewa Anda telah aktif. Silakan lanjutkan pembayaran.",
    },
    Dibatalkan: {
      bg:     "rgba(239,68,68,0.08)",
      border: "rgba(239,68,68,0.3)",
      color:  "#f87171",
      icon:   "❌",
      title:  "Booking Ditolak",
      desc:   "Maaf, booking Anda tidak dapat dikonfirmasi oleh admin.",
    },
    Selesai: {
      bg:     "rgba(96,165,250,0.08)",
      border: "rgba(96,165,250,0.3)",
      color:  "#60a5fa",
      icon:   "🏁",
      title:  "Sewa Selesai",
      desc:   "Terima kasih telah menggunakan layanan kami.",
    },
  } as const;

  const cfg = statusConfig[rental.status as keyof typeof statusConfig] ?? statusConfig.Pending;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: CARD_BG, borderRadius: 16, border: `0.5px solid ${CARD_BORDER}`, width: "100%", maxWidth: 480, overflow: "hidden", maxHeight: "90vh", overflowY: "auto" }}>

        <div style={{ padding: "16px 20px", borderBottom: `0.5px solid ${CARD_BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>Detail Sewa</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUTED, display: "flex" }}><Icons.Close /></button>
        </div>

        <div style={{ padding: 20 }}>
          <VehicleImg vehicle={vehicle} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 12, marginBottom: 16 }} />
          <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 4, color: TEXT_PRIMARY }}>{rental.vehicle_name}</h2>
          <p style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 16 }}>{rental.plate}</p>

          <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 20 }}>{cfg.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: cfg.color }}>{cfg.title}</span>
            </div>
            <p style={{ fontSize: 12.5, color: cfg.color, opacity: 0.85, lineHeight: 1.5 }}>{cfg.desc}</p>

            {(rental.status === "Pending" || rental.status === "Aktif") && (
              <div style={{ display: "flex", alignItems: "center", marginTop: 14, gap: 0 }}>
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(34,197,94,0.15)", border: "2px solid #4ade80", color: "#4ade80", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, margin: "0 auto 6px" }}>✓</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#4ade80" }}>Dibuat</div>
                </div>

                <div style={{ flex: 1, height: 2, background: rental.status === "Aktif" ? "#4ade80" : "rgba(245,158,11,0.4)", marginBottom: 18 }} />

                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%",
                    background: rental.status === "Aktif" ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)",
                    border: rental.status === "Aktif" ? "2px solid #4ade80" : "2px solid rgba(245,158,11,0.5)",
                    color: rental.status === "Aktif" ? "#4ade80" : "#fbbf24",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, margin: "0 auto 6px",
                  }}>
                    {rental.status === "Aktif" ? "✓" : "⏳"}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: rental.status === "Aktif" ? "#4ade80" : "#fbbf24" }}>
                    {rental.status === "Aktif" ? "Dikonfirmasi" : "Menunggu"}
                  </div>
                </div>

                <div style={{ flex: 1, height: 2, background: rental.status === "Aktif" && rental.payment_status === "Lunas" ? "#4ade80" : "rgba(255,255,255,0.08)", marginBottom: 18 }} />

                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%",
                    background: rental.payment_status === "Lunas" ? "rgba(34,197,94,0.15)" : "#1a2540",
                    border: rental.payment_status === "Lunas" ? "2px solid #4ade80" : "2px solid rgba(255,255,255,0.1)",
                    color: rental.payment_status === "Lunas" ? "#4ade80" : TEXT_MUTED,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, margin: "0 auto 6px",
                  }}>
                    {rental.payment_status === "Lunas" ? "✓" : "💳"}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: rental.payment_status === "Lunas" ? "#4ade80" : TEXT_MUTED }}>Bayar</div>
                </div>
              </div>
            )}
          </div>

          {([
            ["Periode",    `${fmtDate(rental.start_date)} – ${fmtDate(rental.end_date)}`],
            ["Durasi",     `${rental.days} hari`],
            ["Tarif/Hari", fmt(rental.rate)],
            ["Total",      fmt(rental.total_cost)],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `0.5px solid rgba(255,255,255,0.04)` }}>
              <span style={{ fontSize: 13, color: TEXT_MUTED }}>{k}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{v}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `0.5px solid rgba(255,255,255,0.04)` }}>
            <span style={{ fontSize: 13, color: TEXT_MUTED }}>Status Sewa</span>
            <Badge status={rental.status} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `0.5px solid rgba(255,255,255,0.04)` }}>
            <span style={{ fontSize: 13, color: TEXT_MUTED }}>Pembayaran</span>
            <Badge status={rental.payment_status} />
          </div>

          {rental.notes && (
            <p style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Icons.FileText size={13} /> {rental.notes}
            </p>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            {rental.status === "Pending" && (
              <div style={{ flex: 1, padding: "12px 16px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, fontSize: 12.5, color: "#fbbf24", textAlign: "center", lineHeight: 1.5 }}>
                ⏳ Tombol pembayaran akan aktif setelah admin mengkonfirmasi booking Anda
              </div>
            )}

            {rental.status === "Aktif" && rental.payment_status !== "Lunas" && (
              <button onClick={onPayNow} style={{ flex: 1, padding: 12, borderRadius: 9, border: "none", background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                💳 Lanjutkan Pembayaran
              </button>
            )}

            {rental.status === "Selesai" && (
              <button onClick={onReview} style={{ flex: 1, padding: 12, borderRadius: 9, border: `0.5px solid ${CARD_BORDER}`, background: "#1a2540", color: TEXT_PRIMARY, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Icons.StarIcon filled={false} size={14} /> Beri Ulasan
              </button>
            )}

            {rental.status === "Dibatalkan" && (
              <div style={{ flex: 1, padding: "12px 16px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, fontSize: 12.5, color: "#f87171", textAlign: "center" }}>
                ❌ Booking ini telah ditolak oleh admin
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewModal({ review, setReview, onClose, onSubmit }: {
  review: { rating: number; comment: string }; setReview: (r: any) => void; onClose: () => void; onSubmit: () => void;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: CARD_BG, borderRadius: 16, border: `0.5px solid ${CARD_BORDER}`, width: "100%", maxWidth: 400, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: TEXT_PRIMARY }}>Beri Ulasan</h3>
        <label style={lStyle}>Rating</label>
        <div style={{ marginBottom: 16 }}>
          <StarRating value={review.rating} onChange={(v) => setReview((p: any) => ({ ...p, rating: v }))} />
        </div>
        <label style={lStyle}>Komentar</label>
        <textarea value={review.comment} onChange={(e) => setReview((p: any) => ({ ...p, comment: e.target.value }))} rows={4} placeholder="Bagikan pengalaman sewa Anda…" style={{ ...iStyle, resize: "vertical" }} />
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 10, borderRadius: 9, border: `0.5px solid ${CARD_BORDER}`, background: "#1a2540", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: TEXT_PRIMARY }}>Batal</button>
          <button onClick={onSubmit} style={{ flex: 1, padding: 10, borderRadius: 9, border: "none", background: ACCENT, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Kirim Ulasan</button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ padding: "80px 0", textAlign: "center", color: TEXT_MUTED }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12, color: "#1e2d45" }}>
        <Icons.Receipt size={48} />
      </div>
      <p style={{ fontSize: 15, fontWeight: 600, color: TEXT_SOFT }}>Belum ada riwayat sewa</p>
      <p style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 4 }}>Transaksi sewa Anda akan muncul di sini</p>
    </div>
  );
}