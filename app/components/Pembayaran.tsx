"use client";
// components/Pembayaran.tsx

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Payment, Rental } from "../types/types";
import { StatusBadge, Loading, Empty, PageHeader, Modal, Field, Input, Select, Btn, ErrAlert, fmt, fmtShort } from "./ui";
import { Icons } from "./icons";

const BLANK = { rental_id: "", amount: 0, method: "Tunai", date: new Date().toISOString().split("T")[0] };

export default function Pembayaran() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [rentals,  setRentals]  = useState<Rental[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("Semua");
  const [show,     setShow]     = useState(false);
  const [form,     setForm]     = useState(BLANK);
  const [err,      setErr]      = useState("");
  const [saving,   setSaving]   = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [p, r] = await Promise.all([
      supabase.from("payments").select("*").order("created_at", { ascending: false }),
      supabase.from("rentals").select("*").neq("status", "Dibatalkan"),
    ]);
    setPayments(p.data ?? []);
    setRentals(r.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const unpaidRentals = rentals.filter(r => r.payment_status !== "Lunas");
  const selected      = rentals.find(r => r.id === form.rental_id);
  const totalRevenue  = payments.filter(p => p.status === "Lunas").reduce((s, p) => s + p.amount, 0);
  const filteredPay   = filter === "Semua" ? payments : payments.filter(p => p.status === filter);

  const handleSave = async () => {
    if (!form.rental_id || !form.amount || !form.date) { setErr("Semua field wajib diisi."); return; }
    if (form.amount <= 0) { setErr("Jumlah harus lebih dari 0."); return; }
    if (!selected) return;
    setSaving(true); setErr("");

    const newStatus: Payment["status"] = form.amount >= selected.total_cost ? "Lunas" : "DP";

    const { data: newPayment, error } = await supabase.from("payments").insert({
      rental_id:     form.rental_id,
      customer_name: selected.customer_name,
      amount:        form.amount,
      method:        form.method,
      date:          form.date,
      status:        newStatus,
    }).select().single();

    if (error) { setErr(error.message); setSaving(false); return; }

    await supabase.from("rentals").update({ payment_status: newStatus }).eq("id", form.rental_id);
    setPayments(p => [newPayment, ...p]);
    setRentals(p => p.map(r => r.id === form.rental_id ? { ...r, payment_status: newStatus } : r));
    setForm(BLANK); setSaving(false); setShow(false);
  };

  const handleLunas = async (p: Payment) => {
    await Promise.all([
      supabase.from("payments").update({ status: "Lunas" }).eq("id", p.id),
      supabase.from("rentals").update({ payment_status: "Lunas" }).eq("id", p.rental_id),
    ]);
    setPayments(prev => prev.map(x => x.id === p.id ? { ...x, status: "Lunas" } : x));
    setRentals(prev => prev.map(r => r.id === p.rental_id ? { ...r, payment_status: "Lunas" } : r));
  };

  const summaryStats = [
    { label: "Total Tagihan",  val: rentals.reduce((s, r) => s + r.total_cost, 0), color: "#60a5fa" },
    { label: "Sudah Lunas",    val: totalRevenue,                                   color: "#4ade80" },
    { label: "Belum Lunas",    val: rentals.filter(r => r.payment_status !== "Lunas").reduce((s, r) => s + r.total_cost, 0), color: "#f87171" },
  ];

  return (
    <div>
      <PageHeader
        title="Pembayaran"
        sub="Monitor status pembayaran seluruh transaksi."
        action={<Btn onClick={() => { setForm(BLANK); setErr(""); setShow(true); }} icon={<Icons.plus />} disabled={unpaidRentals.length === 0 || loading}>Catat Pembayaran</Btn>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "22px" }}>
        {summaryStats.map((s, i) => (
          <div key={i} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", padding: "18px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "6px" }}>{s.label}</p>
            <p style={{ fontSize: "22px", fontWeight: 800, color: s.color, fontFamily: "Syne, sans-serif" }}>{fmtShort(s.val)}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {["Semua", "Lunas", "DP", "Belum Bayar"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid", fontSize: "13px", fontWeight: 600, cursor: "pointer", background: filter === f ? "#f59e0b" : "transparent", color: filter === f ? "#0f0f0f" : "#64748b", borderColor: filter === f ? "#f59e0b" : "#1e293b", fontFamily: "inherit" }}>{f}</button>
        ))}
      </div>

      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", overflow: "hidden" }}>
        {loading ? <Loading /> : filteredPay.length === 0 ? <Empty text="Belum ada data pembayaran." /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#0a0f1e" }}>
                  {["Pelanggan", "ID Sewa", "Jumlah", "Metode", "Tanggal", "Status", "Aksi"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPay.map((p, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #1e293b" }}>
                    <td style={{ padding: "13px 16px", fontSize: "13px", fontWeight: 600, color: "#f1f5f9" }}>{p.customer_name}</td>
                    <td style={{ padding: "13px 16px" }}><code style={{ fontSize: "11px", background: "#1e293b", padding: "2px 7px", borderRadius: "4px", color: "#60a5fa" }}>{p.rental_id.slice(0, 8)}…</code></td>
                    <td style={{ padding: "13px 16px", fontSize: "14px", fontWeight: 800, color: "#f1f5f9", whiteSpace: "nowrap" }}>{fmt(p.amount)}</td>
                    <td style={{ padding: "13px 16px", fontSize: "12.5px", color: "#94a3b8" }}>{p.method}</td>
                    <td style={{ padding: "13px 16px", fontSize: "12.5px", color: "#64748b" }}>{p.date}</td>
                    <td style={{ padding: "13px 16px" }}><StatusBadge status={p.status} /></td>
                    <td style={{ padding: "13px 16px" }}>
                      {p.status !== "Lunas" && (
                        <button onClick={() => handleLunas(p)} style={{ padding: "5px 12px", borderRadius: "6px", background: "#14532d33", border: "1px solid #4ade8033", color: "#4ade80", cursor: "pointer", fontSize: "12px", fontWeight: 600, fontFamily: "inherit" }}>✓ Konfirmasi Lunas</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {show && (
        <Modal title="Catat Pembayaran" onClose={() => setShow(false)}>
          <ErrAlert msg={err} />
          <Field label="Transaksi Sewa" required>
            <Select value={form.rental_id} onChange={e => {
              const r = rentals.find(x => x.id === e.target.value);
              setForm(p => ({ ...p, rental_id: e.target.value, amount: r?.total_cost ?? 0 }));
            }}>
              <option value="">-- Pilih Transaksi --</option>
              {unpaidRentals.map(r => (
                <option key={r.id} value={r.id}>{r.customer_name} · {r.vehicle_name} · {fmt(r.total_cost)}</option>
              ))}
            </Select>
          </Field>
          {selected && (
            <div style={{ background: "#1e293b", borderRadius: "9px", padding: "10px 14px", marginBottom: "14px", fontSize: "12.5px", color: "#94a3b8" }}>
              Tagihan: <strong style={{ color: "#f59e0b" }}>{fmt(selected.total_cost)}</strong> · Status: <strong style={{ color: "#f1f5f9" }}>{selected.payment_status}</strong>
            </div>
          )}
          <Field label="Jumlah Dibayar (Rp)" required><Input type="number" value={form.amount || ""} onChange={e => setForm(p => ({ ...p, amount: Number(e.target.value) }))} placeholder="1000000" /></Field>
          <Field label="Metode Pembayaran">
            <Select value={form.method} onChange={e => setForm(p => ({ ...p, method: e.target.value }))}>
              <option>Tunai</option><option>Transfer Bank</option><option>QRIS</option><option>Kartu Debit</option>
            </Select>
          </Field>
          <Field label="Tanggal Pembayaran" required><Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></Field>
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setShow(false)}>Batal</Btn>
            <Btn onClick={handleSave} icon={<Icons.save />} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}