"use client";
// components/Dashboard.tsx

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Vehicle, Customer, Rental, Payment } from "../types/types";
import { StatusBadge, Loading, Empty, PageHeader, fmt, fmtShort, Td } from "./ui";
import { Icons } from "./icons";

export default function Dashboard() {
  const [vehicles,  setVehicles]  = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rentals,   setRentals]   = useState<Rental[]>([]);
  const [payments,  setPayments]  = useState<Payment[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [v, c, r, p] = await Promise.all([
        supabase.from("vehicles").select("*"),
        supabase.from("customers").select("*"),
        supabase.from("rentals").select("*").order("created_at", { ascending: false }).limit(10),
        supabase.from("payments").select("*"),
      ]);
      setVehicles(v.data ?? []);
      setCustomers(c.data ?? []);
      setRentals(r.data ?? []);
      setPayments(p.data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const revenue      = payments.filter(p => p.status === "Lunas").reduce((s, p) => s + p.amount, 0);
  const recentRental = rentals.slice(0, 6);

  const stats = [
    { label: "Total Armada",       value: String(vehicles.length),                                      sub: "Unit terdaftar",        icon: <Icons.car />,       color: "#60a5fa" },
    { label: "Sedang Disewa",      value: String(vehicles.filter(v => v.status === "Disewa").length),   sub: "Dari total armada",     icon: <Icons.rent />,      color: "#f59e0b" },
    { label: "Tersedia",           value: String(vehicles.filter(v => v.status === "Tersedia").length), sub: "Siap disewakan",        icon: <Icons.check />,     color: "#4ade80" },
    { label: "Total Pelanggan",    value: String(customers.length),                                     sub: "Pelanggan terdaftar",   icon: <Icons.customers />, color: "#a78bfa" },
    { label: "Pendapatan Lunas",   value: fmtShort(revenue),                                            sub: "Total diterima",        icon: <Icons.payment />,   color: "#f59e0b" },
  ];

  const vehicleStatus = [
    { label: "Tersedia",   val: vehicles.filter(v => v.status === "Tersedia").length,   color: "#4ade80", pct: vehicles.length ? vehicles.filter(v => v.status === "Tersedia").length / vehicles.length * 100 : 0 },
    { label: "Disewa",     val: vehicles.filter(v => v.status === "Disewa").length,     color: "#60a5fa", pct: vehicles.length ? vehicles.filter(v => v.status === "Disewa").length / vehicles.length * 100 : 0 },
    { label: "Maintenance",val: vehicles.filter(v => v.status === "Maintenance").length,color: "#fbbf24", pct: vehicles.length ? vehicles.filter(v => v.status === "Maintenance").length / vehicles.length * 100 : 0 },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" sub="Selamat datang kembali. Berikut ringkasan operasional hari ini." />

      {loading ? <Loading /> : (
        <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "16px", marginBottom: "28px" }}>
            {stats.map((s, i) => (
              <div key={i} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", padding: "20px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, right: 0, width: "80px", height: "80px", background: `radial-gradient(circle, ${s.color}15 0%, transparent 70%)`, borderRadius: "0 14px 0 80px" }} />
                <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: `${s.color}20`, border: `1px solid ${s.color}30`, display: "flex", alignItems: "center", justifyContent: "center", color: s.color, marginBottom: "12px" }}>
                  {s.icon}
                </div>
                <div style={{ fontSize: "26px", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.5px", marginBottom: "2px", fontFamily: "Syne, sans-serif" }}>{s.value}</div>
                <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#94a3b8", marginBottom: "2px" }}>{s.label}</div>
                <div style={{ fontSize: "11.5px", color: "#475569" }}>{s.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px" }}>
            {/* Recent rentals */}
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", overflow: "hidden" }}>
              <div style={{ padding: "18px 20px", borderBottom: "1px solid #1e293b" }}>
                <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#f1f5f9" }}>Transaksi Terbaru</h2>
                <p style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>10 transaksi terakhir</p>
              </div>
              {recentRental.length === 0 ? <Empty text="Belum ada transaksi." /> : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#0a0f1e" }}>
                        {["Pelanggan", "Kendaraan", "Periode", "Total", "Bayar", "Status"].map(h => (
                          <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentRental.map((r, i) => (
                        <tr key={i} style={{ borderTop: "1px solid #1e293b" }}>
                          <Td bold>{r.customer_name}</Td>
                          <Td>{r.vehicle_name}</Td>
                          <td style={{ padding: "13px 16px", fontSize: "12px", color: "#64748b", whiteSpace: "nowrap" }}>{r.start_date} → {r.end_date}</td>
                          <Td bold>{fmtShort(r.total_cost)}</Td>
                          <td style={{ padding: "13px 16px" }}><StatusBadge status={r.payment_status} /></td>
                          <td style={{ padding: "13px 16px" }}><StatusBadge status={r.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Armada status */}
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", padding: "20px" }}>
              <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#f1f5f9", marginBottom: "4px" }}>Status Armada</h2>
              <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "18px" }}>{vehicles.length} unit terdaftar</p>
              {vehicles.length === 0 ? <Empty text="Belum ada kendaraan." /> : (
                <>
                  {vehicleStatus.map((item, i) => (
                    <div key={i} style={{ marginBottom: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                        <span style={{ fontSize: "12.5px", color: "#94a3b8" }}>{item.label}</span>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: item.color }}>{item.val} unit</span>
                      </div>
                      <div style={{ height: "5px", background: "#1e293b", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${item.pct}%`, background: item.color, borderRadius: "3px", transition: "width 0.5s ease" }} />
                      </div>
                    </div>
                  ))}

                  <div style={{ borderTop: "1px solid #1e293b", paddingTop: "14px", marginTop: "6px" }}>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "10px" }}>Ringkasan Pembayaran</p>
                    {[
                      { label: "Lunas",        val: payments.filter(p => p.status === "Lunas").length,       color: "#4ade80" },
                      { label: "DP",           val: payments.filter(p => p.status === "DP").length,          color: "#60a5fa" },
                      { label: "Belum Bayar",  val: payments.filter(p => p.status === "Belum Bayar").length, color: "#f87171" },
                    ].map((item, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "7px" }}>
                        <span style={{ fontSize: "12.5px", color: "#64748b" }}>{item.label}</span>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: item.color }}>{item.val}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}