"use client";
// components/Pengembalian.tsx

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Rental, Return } from "../types/types";
import { StatusBadge, Loading, Empty, PageHeader, Modal, Field, Input, Select, Btn, ErrAlert, fmt } from "./ui";
import { Icons } from "./icons";

export default function Pengembalian() {
  const [returns,  setReturns]  = useState<Return[]>([]);
  const [rentals,  setRentals]  = useState<Rental[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [show,     setShow]     = useState(false);
  const [form,     setForm]     = useState({ rental_id: "", return_date: "", condition: "Baik", notes: "" });
  const [err,      setErr]      = useState("");
  const [saving,   setSaving]   = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [ret, rent] = await Promise.all([
      supabase.from("returns").select("*").order("created_at", { ascending: false }),
      supabase.from("rentals").select("*").eq("status", "Aktif"),
    ]);
    setReturns(ret.data ?? []);
    setRentals(rent.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const selected      = rentals.find(r => r.id === form.rental_id);
  const lateDays      = form.return_date && selected
    ? Math.max(0, Math.ceil((new Date(form.return_date).getTime() - new Date(selected.end_date).getTime()) / 86400000))
    : 0;
  const lateFee = lateDays * (selected?.rate ?? 0);

  const handleSave = async () => {
    if (!form.rental_id || !form.return_date) { setErr("Transaksi dan tanggal pengembalian wajib diisi."); return; }
    if (!selected) return;
    setSaving(true); setErr("");

    const { data: newReturn, error } = await supabase.from("returns").insert({
      rental_id:     form.rental_id,
      customer_name: selected.customer_name,
      vehicle_name:  selected.vehicle_name,
      vehicle_id:    selected.vehicle_id,
      return_date:   form.return_date,
      due_date:      selected.end_date,
      late_days:     lateDays,
      late_fee:      lateFee,
      condition:     form.condition,
      status:        "Selesai",
    }).select().single();

    if (error) { setErr(error.message); setSaving(false); return; }

    await Promise.all([
      supabase.from("rentals").update({ status: "Selesai" }).eq("id", form.rental_id),
      supabase.from("vehicles").update({ status: "Tersedia" }).eq("id", selected.vehicle_id),
    ]);

    setReturns(p => [newReturn, ...p]);
    setRentals(p => p.filter(r => r.id !== form.rental_id));
    setForm({ rental_id: "", return_date: "", condition: "Baik", notes: "" });
    setSaving(false); setShow(false);
  };

  return (
    <div>
      <PageHeader
        title="Pengembalian Mobil"
        sub="Catat pengembalian dan hitung denda keterlambatan."
        action={<Btn onClick={() => { setForm({ rental_id: "", return_date: "", condition: "Baik", notes: "" }); setErr(""); setShow(true); }} icon={<Icons.plus />} disabled={rentals.length === 0}>Catat Pengembalian</Btn>}
      />

      {rentals.length > 0 && (
        <div style={{ background: "#78350f22", border: "1px solid #fbbf2433", borderRadius: "12px", padding: "14px 18px", marginBottom: "20px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <span style={{ color: "#fbbf24", marginTop: "1px" }}><Icons.warning /></span>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#fbbf24", marginBottom: "2px" }}>{rentals.length} kendaraan sedang aktif disewa</p>
            <p style={{ fontSize: "12px", color: "#92400e" }}>Pastikan kendaraan dikembalikan sesuai tanggal jatuh tempo.</p>
          </div>
        </div>
      )}

      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", overflow: "hidden" }}>
        {loading ? <Loading /> : returns.length === 0 && rentals.length === 0 ? <Empty text="Belum ada data pengembalian." /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#0a0f1e" }}>
                  {["Pelanggan", "Kendaraan", "Tgl Kembali", "Jatuh Tempo", "Keterlambatan", "Denda", "Kondisi", "Status"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {returns.map((r, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #1e293b" }}>
                    <td style={{ padding: "13px 14px", fontSize: "13px", fontWeight: 600, color: "#f1f5f9" }}>{r.customer_name}</td>
                    <td style={{ padding: "13px 14px", fontSize: "13px", color: "#94a3b8" }}>{r.vehicle_name}</td>
                    <td style={{ padding: "13px 14px", fontSize: "12.5px", color: "#94a3b8" }}>{r.return_date}</td>
                    <td style={{ padding: "13px 14px", fontSize: "12.5px", color: "#94a3b8" }}>{r.due_date}</td>
                    <td style={{ padding: "13px 14px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: r.late_days > 0 ? "#f87171" : "#4ade80" }}>
                        {r.late_days > 0 ? `+${r.late_days} hari` : "Tepat Waktu"}
                      </span>
                    </td>
                    <td style={{ padding: "13px 14px", fontSize: "13px", fontWeight: 700, color: r.late_fee > 0 ? "#f87171" : "#64748b" }}>
                      {r.late_fee > 0 ? fmt(r.late_fee) : "—"}
                    </td>
                    <td style={{ padding: "13px 14px", fontSize: "13px", color: "#94a3b8" }}>{r.condition}</td>
                    <td style={{ padding: "13px 14px" }}><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
                {rentals.map((r, i) => (
                  <tr key={`active-${i}`} style={{ borderTop: "1px solid #1e293b", background: "#fbbf2408" }}>
                    <td style={{ padding: "13px 14px", fontSize: "13px", fontWeight: 600, color: "#f1f5f9" }}>{r.customer_name}</td>
                    <td style={{ padding: "13px 14px", fontSize: "13px", color: "#94a3b8" }}>{r.vehicle_name}</td>
                    <td style={{ padding: "13px 14px", fontSize: "12px", color: "#fbbf24" }}>Belum Kembali</td>
                    <td style={{ padding: "13px 14px", fontSize: "12.5px", color: "#94a3b8" }}>{r.end_date}</td>
                    <td style={{ padding: "13px 14px", fontSize: "12px", color: "#fbbf24" }}>Aktif</td>
                    <td style={{ padding: "13px 14px", fontSize: "13px", color: "#64748b" }}>—</td>
                    <td style={{ padding: "13px 14px" }}>—</td>
                    <td style={{ padding: "13px 14px" }}><StatusBadge status="Aktif" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {show && (
        <Modal title="Catat Pengembalian Kendaraan" onClose={() => setShow(false)}>
          <ErrAlert msg={err} />
          <Field label="Transaksi Sewa Aktif" required>
            <Select value={form.rental_id} onChange={e => setForm(p => ({ ...p, rental_id: e.target.value }))}>
              <option value="">-- Pilih Transaksi --</option>
              {rentals.map(r => <option key={r.id} value={r.id}>{r.customer_name} · {r.vehicle_name} (jatuh tempo: {r.end_date})</option>)}
            </Select>
          </Field>
          {selected && (
            <div style={{ background: "#1e293b", borderRadius: "9px", padding: "11px 14px", marginBottom: "14px", fontSize: "12.5px", color: "#94a3b8" }}>
              Jatuh tempo: <strong style={{ color: "#f1f5f9" }}>{selected.end_date}</strong> · Tarif: <strong style={{ color: "#f1f5f9" }}>{fmt(selected.rate)}/hari</strong>
            </div>
          )}
          <Field label="Tanggal Pengembalian" required><Input type="date" value={form.return_date} onChange={e => setForm(p => ({ ...p, return_date: e.target.value }))} /></Field>
          <Field label="Kondisi Kendaraan">
            <Select value={form.condition} onChange={e => setForm(p => ({ ...p, condition: e.target.value }))}>
              <option>Baik</option><option>Perlu Perbaikan Minor</option><option>Rusak</option>
            </Select>
          </Field>
          {lateDays > 0 && (
            <div style={{ background: "#7f1d1d22", border: "1px solid #f8717133", borderRadius: "10px", padding: "14px", marginBottom: "14px" }}>
              <p style={{ fontSize: "12px", color: "#f87171", fontWeight: 700, marginBottom: "4px" }}>⚠ Keterlambatan Terdeteksi</p>
              <p style={{ fontSize: "13px", color: "#fca5a5" }}>{lateDays} hari terlambat</p>
              <p style={{ fontSize: "20px", fontWeight: 800, color: "#f87171", marginTop: "4px" }}>Denda: {fmt(lateFee)}</p>
            </div>
          )}
          <Field label="Catatan"><Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Catatan kondisi atau kerusakan..." /></Field>
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setShow(false)}>Batal</Btn>
            <Btn onClick={handleSave} icon={<Icons.save />} disabled={saving}>{saving ? "Menyimpan..." : "Konfirmasi Pengembalian"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}