"use client";
// components/Penyewaan.tsx

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Vehicle, Customer, Rental } from "../types/types";
import { StatusBadge, Loading, Empty, PageHeader, Modal, Field, Input, Select, Btn, ErrAlert, fmt } from "./ui";
import { Icons } from "./icons";

const BLANK = { customer_id: "", vehicle_id: "", start_date: "", days: 1, notes: "", payment_status: "Belum Bayar" as Rental["payment_status"] };

export default function Penyewaan() {
  const [rentals,   setRentals]   = useState<Rental[]>([]);
  const [vehicles,  setVehicles]  = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [show,      setShow]      = useState(false);
  const [form,      setForm]      = useState(BLANK);
  const [err,       setErr]       = useState("");
  const [saving,    setSaving]    = useState(false);

  // State untuk konfirmasi
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [rentalToConfirm, setRentalToConfirm] = useState<Rental | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [r, v, c] = await Promise.all([
      supabase.from("rentals").select("*").order("created_at", { ascending: false }),
      supabase.from("vehicles").select("*"),
      supabase.from("customers").select("*").order("name"),
    ]);
    setRentals(r.data ?? []);
    setVehicles(v.data ?? []);
    setCustomers(c.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const available = vehicles.filter(v => v.status === "Tersedia");
  const selectedVehicle  = vehicles.find(v => v.id === form.vehicle_id);
  const selectedCustomer = customers.find(c => c.id === form.customer_id);
  const totalCost        = selectedVehicle ? selectedVehicle.rate * form.days : 0;
  const endDate          = form.start_date ? new Date(new Date(form.start_date).getTime() + form.days * 86400000).toISOString().split("T")[0] : "";

  const handleSave = async () => {
    if (!form.customer_id || !form.vehicle_id || !form.start_date) { setErr("Pelanggan, kendaraan, dan tanggal mulai wajib diisi."); return; }
    if (!selectedCustomer || !selectedVehicle) return;
    setSaving(true); setErr("");

    const { data: newRental, error } = await supabase.from("rentals").insert({
      customer_id:    form.customer_id,
      customer_name:  selectedCustomer.name,
      vehicle_id:     form.vehicle_id,
      vehicle_name:   selectedVehicle.name,
      plate:          selectedVehicle.plate,
      start_date:     form.start_date,
      end_date:       endDate,
      days:           form.days,
      rate:           selectedVehicle.rate,
      total_cost:     totalCost,
      status:         "Aktif",
      payment_status: form.payment_status,
      notes:          form.notes,
    }).select().single();

    if (error) { setErr(error.message); setSaving(false); return; }

    await supabase.from("vehicles").update({ status: "Disewa" }).eq("id", form.vehicle_id);
    setRentals(p => [newRental, ...p]);
    setVehicles(p => p.map(v => v.id === form.vehicle_id ? { ...v, status: "Disewa" } : v));
    setForm(BLANK); setSaving(false); setShow(false);
  };

  // ── Konfirmasi Booking Pending → Aktif ──────────────────────
  const openConfirmModal = (rental: Rental) => {
    setRentalToConfirm(rental);
    setShowConfirmModal(true);
  };

  const handleKonfirmasi = async () => {
    if (!rentalToConfirm) return;
    setConfirmingId(rentalToConfirm.id);
    try {
      const { error } = await supabase
        .from("rentals")
        .update({ status: "Aktif" })
        .eq("id", rentalToConfirm.id);

      if (error) throw error;

      // Update status kendaraan jadi Disewa
      if (rentalToConfirm.vehicle_id) {
        await supabase
          .from("vehicles")
          .update({ status: "Disewa" })
          .eq("id", rentalToConfirm.vehicle_id);
      }

      setRentals(p =>
        p.map(r => r.id === rentalToConfirm.id ? { ...r, status: "Aktif" } : r)
      );
      setVehicles(p =>
        p.map(v => v.id === rentalToConfirm.vehicle_id ? { ...v, status: "Disewa" } : v)
      );
    } catch (e: any) {
      alert("Gagal konfirmasi: " + e.message);
    } finally {
      setConfirmingId(null);
      setShowConfirmModal(false);
      setRentalToConfirm(null);
    }
  };

  // ── Batalkan Booking Pending ─────────────────────────────────
  const handleBatalkan = async (rentalId: string) => {
    if (!confirm("Yakin ingin membatalkan booking ini?")) return;
    setCancelingId(rentalId);
    try {
      const { error } = await supabase
        .from("rentals")
        .update({ status: "Dibatalkan" })
        .eq("id", rentalId);
      if (error) throw error;
      setRentals(p =>
        p.map(r => r.id === rentalId ? { ...r, status: "Dibatalkan" } : r)
      );
    } catch (e: any) {
      alert("Gagal membatalkan: " + e.message);
    } finally {
      setCancelingId(null);
    }
  };

  const handleSelesai = async (rentalId: string, vehicleId: string) => {
    if (!confirm("Tandai sewa ini sebagai selesai?")) return;
    await Promise.all([
      supabase.from("rentals").update({ status: "Selesai" }).eq("id", rentalId),
      supabase.from("vehicles").update({ status: "Tersedia" }).eq("id", vehicleId),
    ]);
    setRentals(p => p.map(r => r.id === rentalId ? { ...r, status: "Selesai" } : r));
    setVehicles(p => p.map(v => v.id === vehicleId ? { ...v, status: "Tersedia" } : v));
  };

  const pendingCount = rentals.filter(r => r.status === "Pending").length;

  const chips = [
    { label: "Total",   val: rentals.length,                                       color: "#60a5fa" },
    { label: "Aktif",   val: rentals.filter(r => r.status === "Aktif").length,     color: "#f59e0b" },
    { label: "Pending", val: pendingCount,                                          color: "#f87171" },
    { label: "Selesai", val: rentals.filter(r => r.status === "Selesai").length,   color: "#4ade80" },
  ];

  return (
    <div>
      <PageHeader
        title="Penyewaan Mobil"
        sub="Kelola transaksi penyewaan kendaraan."
        action={
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
            <Btn onClick={() => { setForm(BLANK); setErr(""); setShow(true); }} icon={<Icons.plus />} disabled={available.length === 0 || customers.length === 0}>
              Buat Transaksi Sewa
            </Btn>
            {customers.length === 0 && <span style={{ fontSize: "11px", color: "#f87171" }}>Tambah pelanggan dulu</span>}
            {customers.length > 0 && available.length === 0 && <span style={{ fontSize: "11px", color: "#f87171" }}>Tidak ada kendaraan tersedia</span>}
          </div>
        }
      />

      {/* Pending alert banner */}
      {pendingCount > 0 && (
        <div style={{
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: "12px",
          padding: "12px 18px",
          marginBottom: "18px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}>
          <span style={{ fontSize: "20px" }}>⏳</span>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#f87171" }}>
              {pendingCount} booking menunggu konfirmasi admin
            </div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              Segera konfirmasi agar pelanggan dapat melanjutkan proses sewa.
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        {chips.map((c, i) => (
          <div key={i} style={{ padding: "10px 18px", background: "#0f172a", border: "1px solid #1e293b", borderRadius: "10px", display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ fontSize: "20px", fontWeight: 800, color: c.color, fontFamily: "Syne, sans-serif" }}>{c.val}</span>
            <span style={{ fontSize: "12.5px", color: "#64748b" }}>{c.label}</span>
          </div>
        ))}
      </div>

      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", overflow: "hidden" }}>
        {loading ? <Loading /> : rentals.length === 0 ? <Empty text="Belum ada transaksi penyewaan." /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#0a0f1e" }}>
                  {["Pelanggan", "Kendaraan", "Mulai", "Selesai", "Durasi", "Total", "Bayar", "Status", "Aksi"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rentals.map((r, i) => (
                  <tr
                    key={i}
                    style={{
                      borderTop: "1px solid #1e293b",
                      background: r.status === "Pending" ? "rgba(239,68,68,0.04)" : "transparent",
                    }}
                  >
                    <td style={{ padding: "13px 14px", fontSize: "13px", fontWeight: 600, color: "#f1f5f9", whiteSpace: "nowrap" }}>{r.customer_name}</td>
                    <td style={{ padding: "13px 14px" }}>
                      <div style={{ fontSize: "13px", color: "#f1f5f9" }}>{r.vehicle_name}</div>
                      <code style={{ fontSize: "11px", color: "#64748b" }}>{r.plate}</code>
                    </td>
                    <td style={{ padding: "13px 14px", fontSize: "12.5px", color: "#94a3b8", whiteSpace: "nowrap" }}>{r.start_date}</td>
                    <td style={{ padding: "13px 14px", fontSize: "12.5px", color: "#94a3b8", whiteSpace: "nowrap" }}>{r.end_date}</td>
                    <td style={{ padding: "13px 14px", fontSize: "13px", color: "#64748b" }}>{r.days} hari</td>
                    <td style={{ padding: "13px 14px", fontSize: "13px", fontWeight: 700, color: "#f1f5f9", whiteSpace: "nowrap" }}>{fmt(r.total_cost)}</td>
                    <td style={{ padding: "13px 14px" }}><StatusBadge status={r.payment_status} /></td>
                    <td style={{ padding: "13px 14px" }}><StatusBadge status={r.status} /></td>
                    <td style={{ padding: "13px 14px" }}>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "nowrap" }}>
                        {/* ── Tombol Konfirmasi (hanya untuk Pending) ── */}
                        {r.status === "Pending" && (
                          <>
                            <button
                              onClick={() => openConfirmModal(r)}
                              disabled={confirmingId === r.id}
                              style={{
                                padding: "5px 11px",
                                borderRadius: "6px",
                                background: confirmingId === r.id ? "#14532d22" : "#14532d55",
                                border: "1px solid #4ade8066",
                                color: "#4ade80",
                                cursor: confirmingId === r.id ? "not-allowed" : "pointer",
                                fontSize: "12px",
                                fontWeight: 700,
                                fontFamily: "inherit",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {confirmingId === r.id ? "..." : "✓ Konfirmasi"}
                            </button>
                            <button
                              onClick={() => handleBatalkan(r.id)}
                              disabled={cancelingId === r.id}
                              style={{
                                padding: "5px 10px",
                                borderRadius: "6px",
                                background: "rgba(239,68,68,0.12)",
                                border: "1px solid rgba(239,68,68,0.3)",
                                color: "#f87171",
                                cursor: cancelingId === r.id ? "not-allowed" : "pointer",
                                fontSize: "12px",
                                fontWeight: 600,
                                fontFamily: "inherit",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {cancelingId === r.id ? "..." : "✕ Tolak"}
                            </button>
                          </>
                        )}

                        {/* ── Tombol Selesai (hanya untuk Aktif) ── */}
                        {r.status === "Aktif" && (
                          <button
                            onClick={() => handleSelesai(r.id, r.vehicle_id)}
                            style={{
                              padding: "5px 10px",
                              borderRadius: "6px",
                              background: "#14532d33",
                              border: "1px solid #4ade8033",
                              color: "#4ade80",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: 600,
                              fontFamily: "inherit",
                            }}
                          >
                            ✓ Selesai
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal Konfirmasi Booking ─────────────────────────────── */}
      {showConfirmModal && rentalToConfirm && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.75)",
          zIndex: 300,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px",
        }}>
          <div style={{
            background: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "420px",
            overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{
              padding: "18px 22px",
              borderBottom: "1px solid #1e293b",
              display: "flex", alignItems: "center", gap: "12px",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "rgba(34,197,94,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px",
              }}>✓</div>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#f1f5f9" }}>
                  Konfirmasi Booking
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  Status akan berubah menjadi <strong style={{ color: "#4ade80" }}>Aktif</strong>
                </div>
              </div>
            </div>

            {/* Detail */}
            <div style={{ padding: "20px 22px" }}>
              {[
                ["Pelanggan", rentalToConfirm.customer_name],
                ["Kendaraan", `${rentalToConfirm.vehicle_name} · ${rentalToConfirm.plate}`],
                ["Periode", `${rentalToConfirm.start_date} – ${rentalToConfirm.end_date}`],
                ["Durasi", `${rentalToConfirm.days} hari`],
                ["Total", fmt(rentalToConfirm.total_cost)],
              ].map(([k, v]) => (
                <div key={k} style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>{k}</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#f1f5f9" }}>{v}</span>
                </div>
              ))}

              <div style={{
                marginTop: "16px",
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.25)",
                borderRadius: "10px",
                padding: "12px 14px",
                fontSize: "13px",
                color: "#4ade80",
                lineHeight: 1.6,
              }}>
                Setelah dikonfirmasi, status booking pelanggan akan otomatis berubah menjadi <strong>Aktif</strong> dan kendaraan akan ditandai <strong>Disewa</strong>.
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
                <button
                  onClick={() => { setShowConfirmModal(false); setRentalToConfirm(null); }}
                  style={{
                    flex: 1, padding: "11px",
                    borderRadius: "9px",
                    border: "1px solid #1e293b",
                    background: "#1a2540",
                    color: "#94a3b8",
                    fontSize: "14px", fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={handleKonfirmasi}
                  disabled={!!confirmingId}
                  style={{
                    flex: 2, padding: "11px",
                    borderRadius: "9px",
                    border: "none",
                    background: confirmingId ? "#14532d66" : "#16a34a",
                    color: "#fff",
                    fontSize: "14px", fontWeight: 700,
                    cursor: confirmingId ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  }}
                >
                  {confirmingId ? "Mengkonfirmasi…" : "✓ Ya, Konfirmasi Booking"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Buat Transaksi ─────────────────────────────────── */}
      {show && (
        <Modal title="Buat Transaksi Sewa Baru" onClose={() => setShow(false)}>
          <ErrAlert msg={err} />
          <Field label="Pelanggan" required>
            <Select value={form.customer_id} onChange={e => setForm(p => ({ ...p, customer_id: e.target.value }))}>
              <option value="">-- Pilih Pelanggan --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}
            </Select>
          </Field>
          <Field label="Kendaraan Tersedia" required>
            <Select value={form.vehicle_id} onChange={e => setForm(p => ({ ...p, vehicle_id: e.target.value }))}>
              <option value="">-- Pilih Kendaraan --</option>
              {available.map(v => <option key={v.id} value={v.id}>{v.name} ({v.plate}) — {fmt(v.rate)}/hari</option>)}
            </Select>
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Field label="Tanggal Mulai" required><Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} /></Field>
            <Field label="Durasi (Hari)" required><Input type="number" min="1" value={form.days} onChange={e => setForm(p => ({ ...p, days: Number(e.target.value) || 1 }))} /></Field>
          </div>
          <Field label="Status Pembayaran">
            <Select value={form.payment_status} onChange={e => setForm(p => ({ ...p, payment_status: e.target.value as Rental["payment_status"] }))}>
              <option value="Belum Bayar">Belum Bayar</option><option value="DP">DP</option><option value="Lunas">Lunas</option>
            </Select>
          </Field>
          <Field label="Catatan"><Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Keperluan sewa..." /></Field>
          {totalCost > 0 && (
            <div style={{ background: "#1e293b", borderRadius: "10px", padding: "14px", marginBottom: "16px", border: "1px solid #f59e0b33" }}>
              <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>
                {form.days} hari × {fmt(selectedVehicle?.rate ?? 0)}/hari{endDate && ` · s/d ${endDate}`}
              </p>
              <p style={{ fontSize: "22px", fontWeight: 800, color: "#f59e0b", fontFamily: "Syne, sans-serif" }}>{fmt(totalCost)}</p>
            </div>
          )}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setShow(false)}>Batal</Btn>
            <Btn onClick={handleSave} icon={<Icons.save />} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}