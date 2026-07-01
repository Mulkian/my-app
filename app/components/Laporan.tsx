"use client";
// components/Laporan.tsx

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Rental, Payment, Return } from "../types/types";
import { StatusBadge, Loading, Empty, PageHeader, Modal, Field, Input, Select, Btn, ErrAlert, fmt, fmtShort } from "./ui";
import { Icons } from "./icons";

// ─── Edit Rental Modal ────────────────────────────────────────────────────────
function EditRentalModal({
  data,
  onClose,
  onSaved,
}: {
  data: Rental;
  onClose: () => void;
  onSaved: (updated: Rental) => void;
}) {
  const [form, setForm] = useState({
    customer_name: data.customer_name ?? "",
    vehicle_name:  data.vehicle_name  ?? "",
    start_date:    data.start_date    ?? "",
    end_date:      data.end_date      ?? "",
    status:        data.status        ?? "Aktif",
    notes:         data.notes         ?? "",
  });
  const [err,    setErr]    = useState("");
  const [saving, setSaving] = useState(false);

  // Recalculate days & total_cost from dates
  const days = form.start_date && form.end_date
    ? Math.max(1, Math.ceil((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / 86400000))
    : data.days;
  const totalCost = days * (data.rate ?? 0);

  const handleSave = async () => {
    if (!form.customer_name || !form.start_date || !form.end_date) {
      setErr("Nama pelanggan, tanggal mulai dan selesai wajib diisi.");
      return;
    }
    if (new Date(form.end_date) <= new Date(form.start_date)) {
      setErr("Tanggal selesai harus setelah tanggal mulai.");
      return;
    }
    setSaving(true); setErr("");

    const patch = {
      customer_name: form.customer_name,
      vehicle_name:  form.vehicle_name,
      start_date:    form.start_date,
      end_date:      form.end_date,
      days,
      total_cost:    totalCost,
      status:        form.status,
      notes:         form.notes,
    };

    const { data: updated, error } = await supabase
      .from("rentals")
      .update(patch)
      .eq("id", data.id)
      .select()
      .single();

    if (error) { setErr(error.message); setSaving(false); return; }
    onSaved(updated);
    onClose();
  };

  return (
    <Modal title="Edit Transaksi Penyewaan" onClose={onClose}>
      <ErrAlert msg={err} />

      {/* Info readonly */}
      <div style={{ background: "#1e293b", borderRadius: "9px", padding: "11px 14px", marginBottom: "16px", fontSize: "12.5px", color: "#94a3b8" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span>Kendaraan</span>
          <strong style={{ color: "#f1f5f9" }}>{data.vehicle_name}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span>Tarif/hari</span>
          <strong style={{ color: "#f1f5f9" }}>{fmt(data.rate ?? 0)}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Durasi terhitung</span>
          <strong style={{ color: "#60a5fa" }}>{days} hari → {fmt(totalCost)}</strong>
        </div>
      </div>

      <Field label="Nama Pelanggan" required>
        <Input
          value={form.customer_name}
          onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))}
          placeholder="Nama pelanggan..."
        />
      </Field>

      <Field label="Nama Kendaraan">
        <Input
          value={form.vehicle_name}
          onChange={e => setForm(p => ({ ...p, vehicle_name: e.target.value }))}
          placeholder="Nama kendaraan..."
        />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label="Tanggal Mulai" required>
          <Input
            type="date"
            value={form.start_date}
            onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
          />
        </Field>
        <Field label="Tanggal Selesai" required>
          <Input
            type="date"
            value={form.end_date}
            onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
          />
        </Field>
      </div>

      <Field label="Status">
        <Select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as "Aktif" | "Selesai" | "Pending" | "Dibatalkan" }))}>
          <option>Aktif</option>
          <option>Selesai</option>
          <option>Dibatalkan</option>
        </Select>
      </Field>

      <Field label="Catatan">
        <Input
          value={form.notes}
          onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
          placeholder="Catatan tambahan..."
        />
      </Field>

      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>Batal</Btn>
        <Btn onClick={handleSave} icon={<Icons.save />} disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </Btn>
      </div>
    </Modal>
  );
}

// ─── Delete Rental Modal ──────────────────────────────────────────────────────
function DeleteRentalModal({
  data,
  onClose,
  onDeleted,
}: {
  data: Rental;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const [err,      setErr]      = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true); setErr("");

    // Hapus return terkait dulu (jika ada)
    await supabase.from("returns").delete().eq("rental_id", data.id);

    const { error } = await supabase.from("rentals").delete().eq("id", data.id);
    if (error) { setErr(error.message); setDeleting(false); return; }

    // Kembalikan status kendaraan ke Tersedia jika rental masih aktif
    if (data.status === "Aktif") {
      await supabase.from("vehicles").update({ status: "Tersedia" }).eq("id", data.vehicle_id);
    }

    onDeleted(data.id);
    onClose();
  };

  return (
    <Modal title="Hapus Transaksi Penyewaan" onClose={onClose}>
      <ErrAlert msg={err} />

      {/* Warning */}
      <div style={{ background: "#7f1d1d33", border: "1px solid #f8717155", borderRadius: "12px", padding: "16px", marginBottom: "18px" }}>
        <p style={{ fontSize: "14px", fontWeight: 700, color: "#f87171", marginBottom: "6px" }}>
          ⚠ Tindakan Ini Tidak Dapat Dibatalkan
        </p>
        <p style={{ fontSize: "12.5px", color: "#fca5a5", lineHeight: "1.6" }}>
          Data pengembalian yang terkait dengan transaksi ini juga akan ikut dihapus.
          Status kendaraan akan dikembalikan ke <strong>Tersedia</strong> jika sewa masih aktif.
        </p>
      </div>

      {/* Summary */}
      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "10px", padding: "14px", marginBottom: "18px" }}>
        <p style={{ fontSize: "11px", color: "#475569", fontWeight: 700, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Data Yang Akan Dihapus</p>
        {([
          ["Pelanggan",   data.customer_name],
          ["Kendaraan",   data.vehicle_name],
          ["Mulai",       data.start_date],
          ["Selesai",     data.end_date],
          ["Durasi",      `${data.days} hari`],
          ["Total Sewa",  fmt(data.total_cost ?? 0)],
          ["Status",      data.status],
        ] as [string, string][]).map(([label, value]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
            <span style={{ color: "#64748b" }}>{label}</span>
            <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>Batal</Btn>
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "8px 16px",
            background: deleting ? "#7f1d1d" : "#dc2626",
            border: "1px solid #b91c1c",
            borderRadius: "8px",
            color: "#fff", fontSize: "13px", fontWeight: 600,
            cursor: deleting ? "not-allowed" : "pointer",
            opacity: deleting ? 0.65 : 1,
            transition: "background 0.15s, opacity 0.15s",
          }}
        >
          <Icons.trash />
          {deleting ? "Menghapus..." : "Ya, Hapus Data"}
        </button>
      </div>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Laporan() {
  const [rentals,     setRentals]     = useState<Rental[]>([]);
  const [payments,    setPayments]    = useState<Payment[]>([]);
  const [returns,     setReturns]     = useState<Return[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState<"penyewaan" | "pendapatan">("penyewaan");
  const [editRental,  setEditRental]  = useState<Rental | null>(null);
  const [deleteRental,setDeleteRental]= useState<Rental | null>(null);
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

  // Callbacks
  const handleRentalUpdated = (updated: Rental) =>
    setRentals(p => p.map(r => (r.id === updated.id ? updated : r)));

  const handleRentalDeleted = (id: string) =>
    setRentals(p => p.filter(r => r.id !== id));

  // ── Kalkulasi ─────────────────────────────────────────────────────────────
  const returnMap = new Map<string, Return>();
  returns.forEach(r => returnMap.set(r.rental_id, r));

  const totalSewa       = rentals.reduce((s, r) => s + (r.total_cost ?? 0), 0);
  const totalDenda      = returns.reduce((s, r) => s + (r.late_fee ?? 0), 0);
  const totalKerusakan  = returns.reduce((s, r) => s + (r.damage_fee ?? 0), 0);
  const totalPendapatan = totalSewa + totalDenda + totalKerusakan;

  const monthlyMap: Record<string, { sewa: number; denda: number; rusak: number; count: number }> = {};
  rentals.forEach(r => {
    const key = r.start_date?.slice(0, 7) ?? "unknown";
    if (!monthlyMap[key]) monthlyMap[key] = { sewa: 0, denda: 0, rusak: 0, count: 0 };
    monthlyMap[key].sewa  += r.total_cost ?? 0;
    monthlyMap[key].count += 1;
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

  // ── Cetak ─────────────────────────────────────────────────────────────────
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

  // ── Inline action button style ────────────────────────────────────────────
  const actionBtn = (color: string): React.CSSProperties => ({
    background: "transparent",
    border: `1px solid ${color}33`,
    borderRadius: "7px",
    padding: "5px 9px",
    cursor: "pointer",
    color,
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    whiteSpace: "nowrap",
  });

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
                          {["Pelanggan", "Kendaraan", "Mulai", "Selesai", "Durasi", "Total Sewa", "Denda", "Biaya Rusak", "Total Bayar", "Status", "Aksi"].map(h => (
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
                              <td style={{ padding: "12px 14px", fontSize: "13px", color: "#94a3b8" }}>{fmt(r.total_cost)}</td>
                              <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: 700, color: ret?.late_fee ? "#f87171" : "#334155" }}>
                                {ret?.late_fee ? fmt(ret.late_fee) : "—"}
                              </td>
                              <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: 700, color: ret?.damage_fee ? "#fb923c" : "#334155" }}>
                                {ret?.damage_fee ? fmt(ret.damage_fee) : "—"}
                              </td>
                              <td style={{ padding: "12px 14px", fontSize: "14px", fontWeight: 800, color: "#f1f5f9" }}>
                                {fmt(grandTotal)}
                              </td>
                              <td style={{ padding: "12px 14px" }}><StatusBadge status={r.status} /></td>

                              {/* ── Aksi ── */}
                              <td style={{ padding: "12px 14px" }}>
                                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                  <button onClick={() => setEditRental(r)}   title="Edit"  style={actionBtn("#60a5fa")}><Icons.edit />  Edit</button>
                                  <button onClick={() => setDeleteRental(r)} title="Hapus" style={actionBtn("#f87171")}><Icons.trash /> Hapus</button>
                                </div>
                              </td>
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: "14px", marginBottom: "22px" }}>
                {[
                  { label: "Total Sewa",      val: fmtShort(totalSewa),       sub: "dari penyewaan", color: "#60a5fa" },
                  { label: "Total Denda",     val: fmtShort(totalDenda),      sub: "keterlambatan",  color: "#f87171" },
                  { label: "Biaya Kerusakan", val: fmtShort(totalKerusakan),  sub: "perbaikan",      color: "#fb923c" },
                  { label: "Total Pendapatan",val: fmtShort(totalPendapatan), sub: "keseluruhan",    color: "#f59e0b" },
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

      {/* ── Modals ── */}
      {editRental   && <EditRentalModal   data={editRental}   onClose={() => setEditRental(null)}   onSaved={handleRentalUpdated} />}
      {deleteRental && <DeleteRentalModal data={deleteRental} onClose={() => setDeleteRental(null)} onDeleted={handleRentalDeleted} />}
    </div>
  );
}