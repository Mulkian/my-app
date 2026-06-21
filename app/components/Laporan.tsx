"use client";
// components/Laporan.tsx

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Rental, Payment, Return } from "../types/types";
import { StatusBadge, Loading, Empty, PageHeader, Btn, fmt, fmtShort } from "./ui";
import { Icons } from "./icons";

export default function Laporan() {
  const [rentals,  setRentals]  = useState<Rental[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [returns,  setReturns]  = useState<Return[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<"penyewaan" | "pendapatan">("penyewaan");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [r, p, ret] = await Promise.all([
        supabase.from("rentals").select("*").order("created_at", { ascending: false }),
        supabase.from("payments").select("*").order("created_at", { ascending: false }),
        supabase.from("returns").select("*").order("created_at", { ascending: false }),
      ]);
      setRentals(r.data ?? []);
      setPayments(p.data ?? []);
      setReturns(ret.data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  // ── Kalkulasi pendapatan ─────────────────────────────────────────────────
  // Buat map rental_id → return data untuk lookup cepat
  const returnMap = new Map<string, Return>();
  returns.forEach(r => returnMap.set(r.rental_id, r));

  // Total pendapatan riil per rental = total_cost + late_fee + damage_fee (dari returns)
  const totalSewa      = rentals.reduce((s, r) => s + (r.total_cost ?? 0), 0);
  const totalDenda     = returns.reduce((s, r) => s + (r.late_fee ?? 0), 0);
  const totalKerusakan = returns.reduce((s, r) => s + (r.damage_fee ?? 0), 0);
  const totalPendapatan = totalSewa + totalDenda + totalKerusakan;

  // Pendapatan bulanan gabungan: group by bulan dari rentals (pakai start_date)
  const monthlyMap: Record<string, { sewa: number; denda: number; rusak: number; count: number }> = {};
  rentals.forEach(r => {
    const key = r.start_date?.slice(0, 7) ?? "unknown";
    if (!monthlyMap[key]) monthlyMap[key] = { sewa: 0, denda: 0, rusak: 0, count: 0 };
    monthlyMap[key].sewa  += r.total_cost ?? 0;
    monthlyMap[key].count += 1;
    // Tambahkan denda & kerusakan dari return yang berkaitan
    const ret = returnMap.get(r.id);
    if (ret) {
      monthlyMap[key].denda += ret.late_fee   ?? 0;
      monthlyMap[key].rusak += ret.damage_fee ?? 0;
    }
  });
  const monthly = Object.entries(monthlyMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, d]) => ({ month, total: d.sewa + d.denda + d.rusak, ...d }));

  const totalDays = rentals.reduce((s, r) => s + r.days, 0);
  const avgDays   = rentals.length ? (totalDays / rentals.length).toFixed(1) : "0";
  const maxRev    = Math.max(...monthly.map(m => m.total), 1);

  const monthLabel = (key: string) => {
    const [y, m] = key.split("-");
    return new Date(Number(y), Number(m) - 1).toLocaleDateString("id-ID", { month: "short", year: "numeric" });
  };

  // ── Cetak laporan ────────────────────────────────────────────────────────
  const handlePrint = () => {
    const now = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

    const rentalRows = rentals.map(r => {
      const ret = returnMap.get(r.id);
      const grandTotal = (r.total_cost ?? 0) + (ret?.late_fee ?? 0) + (ret?.damage_fee ?? 0);
      return `
        <tr>
          <td>${r.customer_name}</td>
          <td>${r.vehicle_name}</td>
          <td>${r.start_date}</td>
          <td>${r.end_date}</td>
          <td>${r.days} hari</td>
          <td>${fmt(r.total_cost)}</td>
          <td>${ret?.late_fee ? fmt(ret.late_fee) : "—"}</td>
          <td>${ret?.damage_fee ? fmt(ret.damage_fee) : "—"}</td>
          <td><strong>${fmt(grandTotal)}</strong></td>
          <td>${r.status}</td>
        </tr>`;
    }).join("");

    const monthRows = monthly.map((d, i) => `
      <tr style="${i === monthly.length - 1 ? "font-weight:700;color:#b45309;" : ""}">
        <td>${monthLabel(d.month)}</td>
        <td>${fmt(d.sewa)}</td>
        <td>${d.denda ? fmt(d.denda) : "—"}</td>
        <td>${d.rusak ? fmt(d.rusak) : "—"}</td>
        <td><strong>${fmt(d.total)}</strong></td>
        <td>${d.count}</td>
        <td>${d.count ? fmt(Math.round(d.total / d.count)) : "—"}</td>
      </tr>`).join("");

    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html><head>
        <meta charset="UTF-8"/>
        <title>Laporan Rental Mobil</title>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 32px; }
          h1 { font-size: 20px; font-weight: 800; margin-bottom: 2px; }
          h2 { font-size: 14px; font-weight: 700; margin: 24px 0 10px; border-bottom: 2px solid #111; padding-bottom: 4px; }
          .meta { font-size: 11px; color: #666; margin-bottom: 20px; }
          .summary { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
          .card { border: 1px solid #ddd; border-radius: 6px; padding: 12px 16px; min-width: 160px; }
          .card-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.05em; }
          .card-val { font-size: 20px; font-weight: 800; color: #b45309; margin: 4px 0 2px; }
          .card-sub { font-size: 11px; color: #999; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
          th { background: #f3f4f6; padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #555; border-bottom: 1px solid #ddd; }
          td { padding: 8px 10px; border-bottom: 1px solid #eee; font-size: 11px; }
          tr:last-child td { border-bottom: none; }
          .total-row td { background: #fef9ee; font-weight: 700; border-top: 2px solid #d97706; }
          .footer { margin-top: 32px; font-size: 11px; color: #888; text-align: center; }
          @media print { body { padding: 16px; } }
        </style>
      </head><body>
        <h1>🚗 Laporan Rental Mobil</h1>
        <p class="meta">Dicetak pada: ${now}</p>

        <div class="summary">
          <div class="card"><p class="card-label">Total Transaksi</p><p class="card-val">${rentals.length}</p><p class="card-sub">transaksi</p></div>
          <div class="card"><p class="card-label">Total Sewa</p><p class="card-val">${fmtShort(totalSewa)}</p><p class="card-sub">dari penyewaan</p></div>
          <div class="card"><p class="card-label">Total Denda</p><p class="card-val">${fmtShort(totalDenda)}</p><p class="card-sub">keterlambatan</p></div>
          <div class="card"><p class="card-label">Biaya Kerusakan</p><p class="card-val">${fmtShort(totalKerusakan)}</p><p class="card-sub">perbaikan</p></div>
          <div class="card" style="background:#fef9ee;border-color:#d97706"><p class="card-label">Total Pendapatan</p><p class="card-val">${fmtShort(totalPendapatan)}</p><p class="card-sub">keseluruhan</p></div>
        </div>

        <h2>Rincian Transaksi Penyewaan</h2>
        <table>
          <thead><tr>
            <th>Pelanggan</th><th>Kendaraan</th><th>Mulai</th><th>Selesai</th>
            <th>Durasi</th><th>Total Sewa</th><th>Denda</th><th>Biaya Rusak</th>
            <th>Total Bayar</th><th>Status</th>
          </tr></thead>
          <tbody>${rentalRows}</tbody>
        </table>

        <h2>Rekap Pendapatan Per Bulan</h2>
        <table>
          <thead><tr>
            <th>Bulan</th><th>Total Sewa</th><th>Denda</th><th>Biaya Rusak</th>
            <th>Total</th><th>Transaksi</th><th>Rata-rata</th>
          </tr></thead>
          <tbody>
            ${monthRows}
            <tr class="total-row">
              <td>TOTAL</td>
              <td>${fmt(totalSewa)}</td>
              <td>${totalDenda ? fmt(totalDenda) : "—"}</td>
              <td>${totalKerusakan ? fmt(totalKerusakan) : "—"}</td>
              <td>${fmt(totalPendapatan)}</td>
              <td>${rentals.length}</td>
              <td>—</td>
            </tr>
          </tbody>
        </table>

        <p class="footer">— Laporan ini digenerate otomatis oleh sistem rental mobil —</p>
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  return (
    <div ref={printRef}>
      <PageHeader
        title="Laporan"
        sub="Analisis penyewaan dan pendapatan usaha rental Anda."
        action={<Btn variant="secondary" icon={<Icons.print />} onClick={handlePrint}>Cetak Laporan</Btn>}
      />

      <div style={{ display: "flex", gap: "4px", background: "#0f172a", border: "1px solid #1e293b", borderRadius: "10px", padding: "4px", marginBottom: "24px", width: "fit-content" }}>
        {(["penyewaan", "pendapatan"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 20px", borderRadius: "7px", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer", background: tab === t ? "#f59e0b" : "transparent", color: tab === t ? "#0f0f0f" : "#64748b", fontFamily: "inherit", transition: "all 0.15s", textTransform: "capitalize" }}>
            {t === "penyewaan" ? "Laporan Penyewaan" : "Laporan Pendapatan"}
          </button>
        ))}
      </div>

      {loading ? <Loading /> : (
        <>
          {/* ── Tab Penyewaan ── */}
          {tab === "penyewaan" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: "14px", marginBottom: "22px" }}>
                {[
                  { label: "Total Transaksi",  val: String(rentals.length),       sub: "transaksi" },
                  { label: "Total Hari Sewa",  val: String(totalDays),            sub: "hari" },
                  { label: "Rata-rata Durasi", val: avgDays,                      sub: "hari/transaksi" },
                  { label: "Aktif Sekarang",   val: String(rentals.filter(r => r.status === "Aktif").length), sub: "transaksi aktif" },
                ].map((s, i) => (
                  <div key={i} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", padding: "16px" }}>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "6px" }}>{s.label}</p>
                    <p style={{ fontSize: "22px", fontWeight: 800, color: "#f59e0b", fontFamily: "Syne, sans-serif" }}>{s.val}</p>
                    <p style={{ fontSize: "12px", color: "#64748b" }}>{s.sub}</p>
                  </div>
                ))}
              </div>

              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e293b" }}>
                  <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#f1f5f9" }}>Rincian Transaksi Penyewaan</h2>
                </div>
                {rentals.length === 0 ? <Empty text="Belum ada transaksi." /> : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#0a0f1e" }}>
                          {["Pelanggan", "Kendaraan", "Mulai", "Selesai", "Durasi", "Total Sewa", "Denda", "Biaya Rusak", "Total Bayar", "Status"].map(h => (
                            <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rentals.map((r, i) => {
                          const ret = returnMap.get(r.id);
                          const grandTotal = (r.total_cost ?? 0) + (ret?.late_fee ?? 0) + (ret?.damage_fee ?? 0);
                          return (
                            <tr key={i} style={{ borderTop: "1px solid #1e293b" }}>
                              <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: 600, color: "#f1f5f9", whiteSpace: "nowrap" }}>{r.customer_name}</td>
                              <td style={{ padding: "12px 14px", fontSize: "13px", color: "#94a3b8", whiteSpace: "nowrap" }}>{r.vehicle_name}</td>
                              <td style={{ padding: "12px 14px", fontSize: "12px", color: "#64748b" }}>{r.start_date}</td>
                              <td style={{ padding: "12px 14px", fontSize: "12px", color: "#64748b" }}>{r.end_date}</td>
                              <td style={{ padding: "12px 14px", fontSize: "13px", color: "#94a3b8" }}>{r.days} hari</td>
                              {/* Total Sewa */}
                              <td style={{ padding: "12px 14px", fontSize: "13px", color: "#94a3b8" }}>{fmt(r.total_cost)}</td>
                              {/* Denda */}
                              <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: 700, color: ret?.late_fee ? "#f87171" : "#334155" }}>
                                {ret?.late_fee ? fmt(ret.late_fee) : "—"}
                              </td>
                              {/* Biaya Rusak */}
                              <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: 700, color: ret?.damage_fee ? "#fb923c" : "#334155" }}>
                                {ret?.damage_fee ? fmt(ret.damage_fee) : "—"}
                              </td>
                              {/* Total Bayar */}
                              <td style={{ padding: "12px 14px", fontSize: "14px", fontWeight: 800, color: "#f1f5f9" }}>
                                {fmt(grandTotal)}
                              </td>
                              <td style={{ padding: "12px 14px" }}><StatusBadge status={r.status} /></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Tab Pendapatan ── */}
          {tab === "pendapatan" && (
            <div>
              {/* Ringkasan 4 kartu */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: "14px", marginBottom: "22px" }}>
                {[
                  { label: "Total Sewa",        val: fmtShort(totalSewa),        sub: "dari penyewaan",    color: "#60a5fa" },
                  { label: "Total Denda",        val: fmtShort(totalDenda),       sub: "keterlambatan",    color: "#f87171" },
                  { label: "Biaya Kerusakan",    val: fmtShort(totalKerusakan),   sub: "perbaikan",        color: "#fb923c" },
                  { label: "Total Pendapatan",   val: fmtShort(totalPendapatan),  sub: "keseluruhan",      color: "#f59e0b" },
                ].map((s, i) => (
                  <div key={i} style={{ background: "#0f172a", border: `1px solid ${s.color}33`, borderRadius: "12px", padding: "16px" }}>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "6px" }}>{s.label}</p>
                    <p style={{ fontSize: "22px", fontWeight: 800, color: s.color, fontFamily: "Syne, sans-serif" }}>{s.val}</p>
                    <p style={{ fontSize: "12px", color: "#64748b" }}>{s.sub}</p>
                  </div>
                ))}
              </div>

              {monthly.length === 0 ? <Empty text="Belum ada data pendapatan." /> : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  {/* Bar chart */}
                  <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", padding: "22px" }}>
                    <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#f1f5f9", marginBottom: "4px" }}>Pendapatan Bulanan</h2>
                    <p style={{ fontSize: "22px", fontWeight: 800, color: "#f59e0b", marginBottom: "16px", fontFamily: "Syne, sans-serif" }}>{fmtShort(totalPendapatan)}</p>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "160px" }}>
                      {monthly.map((d, i) => (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}>
                          <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                            <div style={{ width: "100%", height: `${(d.total / maxRev) * 130}px`, background: i === monthly.length - 1 ? "#f59e0b" : "#334155", borderRadius: "4px 4px 0 0", minHeight: "6px", transition: "height 0.5s ease", position: "relative" }}>
                              <div style={{ position: "absolute", top: "-20px", left: "50%", transform: "translateX(-50%)", fontSize: "9px", fontWeight: 700, color: i === monthly.length - 1 ? "#f59e0b" : "#64748b", whiteSpace: "nowrap" }}>
                                {fmtShort(d.total)}
                              </div>
                            </div>
                          </div>
                          <span style={{ fontSize: "10px", color: "#64748b", marginTop: "6px", textAlign: "center" }}>{monthLabel(d.month).split(" ")[0]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tabel per bulan */}
                  <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", overflow: "hidden" }}>
                    <div style={{ padding: "18px 20px", borderBottom: "1px solid #1e293b" }}>
                      <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#f1f5f9" }}>Rekap Per Bulan</h2>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "#0a0f1e" }}>
                            {["Bulan", "Sewa", "Denda", "Rusak", "Total", "Trx"].map(h => (
                              <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {monthly.map((d, i) => (
                            <tr key={i} style={{ borderTop: "1px solid #1e293b", background: i === monthly.length - 1 ? "#f59e0b08" : "transparent" }}>
                              <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: i === monthly.length - 1 ? 700 : 400, color: i === monthly.length - 1 ? "#f59e0b" : "#f1f5f9", whiteSpace: "nowrap" }}>{monthLabel(d.month)}</td>
                              <td style={{ padding: "12px 14px", fontSize: "13px", color: "#94a3b8" }}>{fmtShort(d.sewa)}</td>
                              <td style={{ padding: "12px 14px", fontSize: "13px", color: d.denda ? "#f87171" : "#334155", fontWeight: d.denda ? 700 : 400 }}>{d.denda ? fmtShort(d.denda) : "—"}</td>
                              <td style={{ padding: "12px 14px", fontSize: "13px", color: d.rusak ? "#fb923c" : "#334155", fontWeight: d.rusak ? 700 : 400 }}>{d.rusak ? fmtShort(d.rusak) : "—"}</td>
                              <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: 800, color: "#f1f5f9" }}>{fmtShort(d.total)}</td>
                              <td style={{ padding: "12px 14px", fontSize: "13px", color: "#94a3b8" }}>{d.count}</td>
                            </tr>
                          ))}
                          {/* Baris total */}
                          <tr style={{ borderTop: "2px solid #334155", background: "#1e293b" }}>
                            <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: 700, color: "#f1f5f9" }}>Total</td>
                            <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: 700, color: "#60a5fa" }}>{fmtShort(totalSewa)}</td>
                            <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: 700, color: "#f87171" }}>{totalDenda ? fmtShort(totalDenda) : "—"}</td>
                            <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: 700, color: "#fb923c" }}>{totalKerusakan ? fmtShort(totalKerusakan) : "—"}</td>
                            <td style={{ padding: "12px 14px", fontSize: "14px", fontWeight: 800, color: "#f59e0b" }}>{fmtShort(totalPendapatan)}</td>
                            <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: 700, color: "#f1f5f9" }}>{monthly.reduce((s, d) => s + d.count, 0)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}