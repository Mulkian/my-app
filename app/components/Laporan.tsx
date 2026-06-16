"use client";
// components/Laporan.tsx

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Rental, Payment } from "../types/types";
import { StatusBadge, Loading, Empty, PageHeader, Btn, fmt, fmtShort } from "./ui";
import { Icons } from "./icons";

export default function Laporan() {
  const [rentals,  setRentals]  = useState<Rental[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<"penyewaan" | "pendapatan">("penyewaan");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [r, p] = await Promise.all([
        supabase.from("rentals").select("*").order("created_at", { ascending: false }),
        supabase.from("payments").select("*").order("created_at", { ascending: false }),
      ]);
      setRentals(r.data ?? []);
      setPayments(p.data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  // Group payments by month
  const monthlyMap: Record<string, { revenue: number; count: number }> = {};
  payments.filter(p => p.status === "Lunas").forEach(p => {
    const key = p.date?.slice(0, 7) ?? "unknown";
    if (!monthlyMap[key]) monthlyMap[key] = { revenue: 0, count: 0 };
    monthlyMap[key].revenue += p.amount;
    monthlyMap[key].count   += 1;
  });
  const monthly = Object.entries(monthlyMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, data]) => ({ month, ...data }));

  const totalRevenue = payments.filter(p => p.status === "Lunas").reduce((s, p) => s + p.amount, 0);
  const totalDays    = rentals.reduce((s, r) => s + r.days, 0);
  const avgDays      = rentals.length ? (totalDays / rentals.length).toFixed(1) : "0";
  const maxRev       = Math.max(...monthly.map(m => m.revenue), 1);

  const monthLabel = (key: string) => {
    const [y, m] = key.split("-");
    return new Date(Number(y), Number(m) - 1).toLocaleDateString("id-ID", { month: "short", year: "numeric" });
  };

  return (
    <div>
      <PageHeader
        title="Laporan"
        sub="Analisis penyewaan dan pendapatan usaha rental Anda."
        action={<Btn variant="secondary" icon={<Icons.download />}>Export Data</Btn>}
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
          {tab === "penyewaan" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px", marginBottom: "22px" }}>
                {[
                  { label: "Total Transaksi",  val: String(rentals.length),      suffix: "transaksi" },
                  { label: "Total Hari Sewa",  val: String(totalDays),           suffix: "hari" },
                  { label: "Rata-rata Durasi", val: avgDays,                     suffix: "hari/transaksi" },
                  { label: "Aktif Sekarang",   val: String(rentals.filter(r => r.status === "Aktif").length), suffix: "transaksi aktif" },
                ].map((s, i) => (
                  <div key={i} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", padding: "16px" }}>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "6px" }}>{s.label}</p>
                    <p style={{ fontSize: "22px", fontWeight: 800, color: "#f59e0b", fontFamily: "Syne, sans-serif" }}>{s.val}</p>
                    <p style={{ fontSize: "12px", color: "#64748b" }}>{s.suffix}</p>
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
                          {["Pelanggan", "Kendaraan", "Mulai", "Selesai", "Durasi", "Total", "Status"].map(h => (
                            <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rentals.map((r, i) => (
                          <tr key={i} style={{ borderTop: "1px solid #1e293b" }}>
                            <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: 600, color: "#f1f5f9" }}>{r.customer_name}</td>
                            <td style={{ padding: "12px 14px", fontSize: "13px", color: "#94a3b8" }}>{r.vehicle_name}</td>
                            <td style={{ padding: "12px 14px", fontSize: "12px", color: "#64748b" }}>{r.start_date}</td>
                            <td style={{ padding: "12px 14px", fontSize: "12px", color: "#64748b" }}>{r.end_date}</td>
                            <td style={{ padding: "12px 14px", fontSize: "13px", color: "#94a3b8" }}>{r.days} hari</td>
                            <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: 700, color: "#f1f5f9" }}>{fmt(r.total_cost)}</td>
                            <td style={{ padding: "12px 14px" }}><StatusBadge status={r.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "pendapatan" && (
            <div>
              {monthly.length === 0 ? <Empty text="Belum ada data pendapatan." /> : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  {/* Bar chart */}
                  <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", padding: "22px" }}>
                    <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#f1f5f9", marginBottom: "4px" }}>Pendapatan Bulanan</h2>
                    <p style={{ fontSize: "22px", fontWeight: 800, color: "#f59e0b", marginBottom: "16px", fontFamily: "Syne, sans-serif" }}>{fmtShort(totalRevenue)}</p>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "160px" }}>
                      {monthly.map((d, i) => (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}>
                          <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                            <div style={{ width: "100%", height: `${(d.revenue / maxRev) * 130}px`, background: i === monthly.length - 1 ? "#f59e0b" : "#334155", borderRadius: "4px 4px 0 0", minHeight: "6px", transition: "height 0.5s ease", position: "relative" }}>
                              <div style={{ position: "absolute", top: "-20px", left: "50%", transform: "translateX(-50%)", fontSize: "9px", fontWeight: 700, color: i === monthly.length - 1 ? "#f59e0b" : "#64748b", whiteSpace: "nowrap" }}>
                                {fmtShort(d.revenue)}
                              </div>
                            </div>
                          </div>
                          <span style={{ fontSize: "10px", color: "#64748b", marginTop: "6px", textAlign: "center" }}>{monthLabel(d.month).split(" ")[0]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Table */}
                  <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", overflow: "hidden" }}>
                    <div style={{ padding: "18px 20px", borderBottom: "1px solid #1e293b" }}>
                      <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#f1f5f9" }}>Rincian Per Bulan</h2>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "#0a0f1e" }}>
                            {["Bulan", "Pendapatan", "Transaksi", "Rata-rata"].map(h => (
                              <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {monthly.map((d, i) => (
                            <tr key={i} style={{ borderTop: "1px solid #1e293b", background: i === monthly.length - 1 ? "#f59e0b08" : "transparent" }}>
                              <td style={{ padding: "13px 16px", fontSize: "13px", fontWeight: i === monthly.length - 1 ? 700 : 400, color: i === monthly.length - 1 ? "#f59e0b" : "#f1f5f9" }}>{monthLabel(d.month)}</td>
                              <td style={{ padding: "13px 16px", fontSize: "13px", fontWeight: 700, color: "#f1f5f9" }}>{fmtShort(d.revenue)}</td>
                              <td style={{ padding: "13px 16px", fontSize: "13px", color: "#94a3b8" }}>{d.count}</td>
                              <td style={{ padding: "13px 16px", fontSize: "13px", color: "#64748b" }}>{d.count ? fmtShort(Math.round(d.revenue / d.count)) : "—"}</td>
                            </tr>
                          ))}
                          <tr style={{ borderTop: "2px solid #334155", background: "#1e293b" }}>
                            <td style={{ padding: "13px 16px", fontSize: "13px", fontWeight: 700, color: "#f1f5f9" }}>Total</td>
                            <td style={{ padding: "13px 16px", fontSize: "14px", fontWeight: 800, color: "#f59e0b" }}>{fmtShort(totalRevenue)}</td>
                            <td style={{ padding: "13px 16px", fontSize: "13px", fontWeight: 700, color: "#f1f5f9" }}>{monthly.reduce((s, d) => s + d.count, 0)}</td>
                            <td style={{ padding: "13px 16px", fontSize: "13px", color: "#64748b" }}>—</td>
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