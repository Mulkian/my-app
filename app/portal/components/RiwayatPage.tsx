"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Rental, Vehicle } from "types/types";
import {
  ACCENT, CARD_BG, CARD_BORDER, TEXT_PRIMARY, TEXT_MUTED, TEXT_SOFT,
  lStyle, iStyle,
} from "@/lib/constants";
import { fmt, fmtDate } from "@/lib/utils";
import { Icons } from "../components/icons";
import { Badge, VehicleImg, StarRating } from "../components/ui";

interface Props {
  vehicles: Vehicle[];
  onPayNow: (rental: Rental) => void;
}

const STATUS_FILTERS = ["Semua", "Aktif", "Pending", "Selesai", "Dibatalkan"] as const;

export default function RiwayatPage({ vehicles, onPayNow }: Props) {
  const [rentals,         setRentals]         = useState<Rental[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [filter,          setFilter]          = useState("Semua");
  const [activeRental,    setActiveRental]    = useState<Rental | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [review,          setReview]          = useState({ rating: 5, comment: "" });

  // ── Fetch rentals milik user yang sedang login saja ──────────────────────
  useEffect(() => {
    const fetchMyRentals = async () => {
      setLoading(true);

      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("rentals")
        .select("*")
        .eq("user_id", user.id)          // ← hanya milik user ini
        .order("created_at", { ascending: false });

      if (!error) setRentals(data ?? []);
      setLoading(false);
    };

    fetchMyRentals();
  }, []);

  const getVehicleByName = (name: string) =>
    vehicles.find((v) => v.name === name) ?? { name, photo_url: undefined };

  const filtered = filter === "Semua"
    ? rentals
    : rentals.filter((r) => r.status === filter);

  if (loading) {
    return (
      <div style={{ padding: "80px 0", textAlign: "center", color: TEXT_MUTED }}>
        <p style={{ fontSize: 14 }}>Memuat riwayat sewa…</p>
      </div>
    );
  }

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
  rental: Rental; vehicle: any; onClose: () => void; onPayNow: () => void; onReview: () => void;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: CARD_BG, borderRadius: 16, border: `0.5px solid ${CARD_BORDER}`, width: "100%", maxWidth: 480, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `0.5px solid ${CARD_BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>Detail Sewa</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUTED, display: "flex" }}><Icons.Close /></button>
        </div>
        <div style={{ padding: 20 }}>
          <VehicleImg vehicle={vehicle} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 12, marginBottom: 16 }} />
          <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 4, color: TEXT_PRIMARY }}>{rental.vehicle_name}</h2>
          <p style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 16 }}>{rental.plate}</p>
          {([
            ["Periode", `${fmtDate(rental.start_date)} – ${fmtDate(rental.end_date)}`],
            ["Durasi",  `${rental.days} hari`],
            ["Tarif/Hari", fmt(rental.rate)],
            ["Total",   fmt(rental.total_cost)],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `0.5px solid rgba(255,255,255,0.04)` }}>
              <span style={{ fontSize: 13, color: TEXT_MUTED }}>{k}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{v}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `0.5px solid rgba(255,255,255,0.04)` }}>
            <span style={{ fontSize: 13, color: TEXT_MUTED }}>Status</span>
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
            {rental.payment_status === "Belum Bayar" && (
              <button onClick={onPayNow} style={{ flex: 1, padding: 10, borderRadius: 9, border: "none", background: ACCENT, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Bayar Sekarang
              </button>
            )}
            {rental.status === "Selesai" && (
              <button onClick={onReview} style={{ flex: 1, padding: 10, borderRadius: 9, border: `0.5px solid ${CARD_BORDER}`, background: "#1a2540", color: TEXT_PRIMARY, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Icons.StarIcon filled={false} size={14} /> Beri Ulasan
              </button>
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