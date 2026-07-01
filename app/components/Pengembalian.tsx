// components/Pengembalian.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Rental, Return } from "../types/types";
import { StatusBadge, Loading, Empty, PageHeader, Modal, Field, Input, Select, Btn, ErrAlert, fmt } from "./ui";
import { Icons } from "./icons";

// ─── Print Receipt ────────────────────────────────────────────────────────────
function PrintReceipt({ data, onClose }: { data: Return; onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML ?? "";
    const win = window.open("", "_blank", "width=420,height=750");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html><head>
        <meta charset="UTF-8"/>
        <title>Struk Pengembalian</title>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family:'Courier New',monospace; font-size:12px; color:#111; background:#fff; padding:20px; }
          .receipt { width:100%; max-width:320px; margin:0 auto; }
          .center { text-align:center; }
          .bold { font-weight:bold; }
          .divider { border-top:1px dashed #999; margin:8px 0; }
          .divider-solid { border-top:2px solid #111; margin:8px 0; }
          .row { display:flex; justify-content:space-between; margin:4px 0; gap:8px; }
          .label { color:#555; white-space:nowrap; }
          .value { text-align:right; font-weight:600; }
          .section-title { font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.08em; margin:8px 0 4px; }
          .late-box { border:1px dashed #c0392b; padding:6px 8px; margin:6px 0; }
          .damage-box { border:1px dashed #e67e22; padding:6px 8px; margin:6px 0; }
          .grand-total { display:flex; justify-content:space-between; font-size:15px; font-weight:800; margin:6px 0; }
          .footer { text-align:center; font-size:11px; color:#888; margin-top:6px; }
          h2 { font-size:15px; letter-spacing:1px; }
          h3 { font-size:12px; font-weight:600; }
        </style>
      </head><body>${content}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  const grandTotal = (data.total_cost ?? 0) + (data.late_fee ?? 0) + (data.damage_fee ?? 0);

  return (
    <Modal title="Struk Pengembalian" onClose={onClose}>
      <div
        ref={printRef}
        style={{ fontFamily: "'Courier New', monospace", fontSize: "12px", background: "#fff", color: "#111", padding: "20px 24px", borderRadius: "8px", maxWidth: "320px", margin: "0 auto" }}
      >
        <div className="receipt">
          <div className="center">
            <h2 className="bold">🚗 RENTAL MOBIL</h2>
            <h3 style={{ marginTop: "2px" }}>STRUK PENGEMBALIAN</h3>
            <div className="divider-solid" />
            <p style={{ fontSize: "11px", color: "#666" }}>
              {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
              {" "}
              {new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className="divider" />
          <div className="row"><span className="label">Pelanggan</span><span className="value bold">{data.customer_name}</span></div>
          <div className="row"><span className="label">Kendaraan</span><span className="value">{data.vehicle_name}</span></div>
          <div className="row"><span className="label">Kondisi</span><span className="value">{data.condition}</span></div>
          <div className="divider" />
          <p className="section-title">Detail Sewa</p>
          <div className="row"><span className="label">Tgl Jatuh Tempo</span><span className="value">{data.due_date}</span></div>
          <div className="row"><span className="label">Tgl Kembali</span><span className="value">{data.return_date}</span></div>
          <div className="row">
            <span className="label">Keterlambatan</span>
            <span className="value" style={{ color: data.late_days > 0 ? "#c0392b" : "#27ae60" }}>
              {data.late_days > 0 ? `${data.late_days} hari` : "Tepat Waktu"}
            </span>
          </div>
          <div className="divider" />
          <p className="section-title">Rincian Biaya</p>
          <div className="row">
            <span className="label">Total Sewa</span>
            <span className="value">{fmt(data.total_cost ?? 0)}</span>
          </div>
          {data.late_days > 0 && (
            <div className="late-box">
              <div className="row" style={{ color: "#c0392b", fontWeight: 700 }}>
                <span>Denda Keterlambatan ({data.late_days} hari)</span>
                <span>{fmt(data.late_fee ?? 0)}</span>
              </div>
            </div>
          )}
          {(data.damage_fee ?? 0) > 0 && (
            <div className="damage-box">
              <div className="row" style={{ color: "#e67e22", fontWeight: 700 }}>
                <span>Biaya Kerusakan</span>
                <span>{fmt(data.damage_fee ?? 0)}</span>
              </div>
              {data.damage_desc && (
                <p style={{ fontSize: "11px", color: "#888", marginTop: "3px" }}>Ket: {data.damage_desc}</p>
              )}
            </div>
          )}
          <div className="divider-solid" />
          <div className="grand-total">
            <span>TOTAL BAYAR</span>
            <span style={{ color: "#c0392b" }}>{fmt(grandTotal)}</span>
          </div>
          <div className="divider" />
          <p className="footer">Status: <strong>{data.status}</strong></p>
          <p className="footer" style={{ marginTop: "8px" }}>— Terima kasih atas kepercayaan Anda —</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "18px" }}>
        <Btn variant="secondary" onClick={onClose}>Tutup</Btn>
        <Btn onClick={handlePrint} icon={<Icons.print />}>Cetak Struk</Btn>
      </div>
    </Modal>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({
  data,
  onClose,
  onSaved,
}: {
  data: Return;
  onClose: () => void;
  onSaved: (updated: Return) => void;
}) {
  const [form, setForm] = useState({
    return_date: data.return_date ?? "",
    condition:   data.condition ?? "Baik",
    notes:       data.notes ?? "",
    damage_fee:  String(data.damage_fee ?? ""),
    damage_desc: data.damage_desc ?? "",
  });
  const [err,    setErr]    = useState("");
  const [saving, setSaving] = useState(false);

  // Recalculate late days/fee from original due_date vs new return_date
  const lateDays = form.return_date && data.due_date
    ? Math.max(0, Math.ceil((new Date(form.return_date).getTime() - new Date(data.due_date).getTime()) / 86400000))
    : data.late_days ?? 0;

  // We don't have rate stored on Return, so derive it from original late info
  const ratePerDay = data.late_days > 0 ? (data.late_fee ?? 0) / data.late_days : 0;
  const lateFee   = lateDays * ratePerDay;
  const damageFee = parseFloat(form.damage_fee || "0") || 0;
  const grandTotal = (data.total_cost ?? 0) + lateFee + damageFee;
  const hasDamage  = form.condition !== "Baik";

  const handleSave = async () => {
    if (!form.return_date) { setErr("Tanggal pengembalian wajib diisi."); return; }
    setSaving(true); setErr("");

    const patch = {
      return_date: form.return_date,
      condition:   form.condition,
      notes:       form.notes,
      late_days:   lateDays,
      late_fee:    lateFee,
      damage_fee:  damageFee,
      damage_desc: form.damage_desc,
    };

    const { data: updated, error } = await supabase
      .from("returns")
      .update(patch)
      .eq("id", data.id)
      .select()
      .single();

    if (error) { setErr(error.message); setSaving(false); return; }
    onSaved(updated);
    onClose();
  };

  return (
    <Modal title="Edit Data Pengembalian" onClose={onClose}>
      <ErrAlert msg={err} />

      {/* Info readonly */}
      <div style={{ background: "#1e293b", borderRadius: "9px", padding: "11px 14px", marginBottom: "16px", fontSize: "12.5px", color: "#94a3b8" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span>Pelanggan</span><strong style={{ color: "#f1f5f9" }}>{data.customer_name}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span>Kendaraan</span><strong style={{ color: "#f1f5f9" }}>{data.vehicle_name}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Jatuh Tempo</span><strong style={{ color: "#f1f5f9" }}>{data.due_date}</strong>
        </div>
      </div>

      <Field label="Tanggal Pengembalian" required>
        <Input
          type="date"
          value={form.return_date}
          onChange={e => setForm(p => ({ ...p, return_date: e.target.value }))}
        />
      </Field>

      <Field label="Kondisi Kendaraan">
        <Select value={form.condition} onChange={e => setForm(p => ({ ...p, condition: e.target.value }))}>
          <option>Baik</option>
          <option>Perlu Perbaikan Minor</option>
          <option>Rusak</option>
        </Select>
      </Field>

      {lateDays > 0 && (
        <div style={{ background: "#7f1d1d22", border: "1px solid #f8717133", borderRadius: "10px", padding: "14px", marginBottom: "14px" }}>
          <p style={{ fontSize: "12px", color: "#f87171", fontWeight: 700, marginBottom: "4px" }}>⚠ Keterlambatan</p>
          <p style={{ fontSize: "13px", color: "#fca5a5" }}>{lateDays} hari terlambat</p>
          <p style={{ fontSize: "18px", fontWeight: 800, color: "#f87171", marginTop: "4px" }}>Denda: {fmt(lateFee)}</p>
        </div>
      )}

      {hasDamage && (
        <div style={{ background: "#431407aa", border: "1px solid #fb923c55", borderRadius: "12px", padding: "16px", marginBottom: "14px" }}>
          <p style={{ fontSize: "12px", color: "#fb923c", fontWeight: 700, marginBottom: "12px" }}>🔧 Kerusakan — Biaya Perbaikan</p>
          <Field label="Biaya Kerusakan (Rp)">
            <Input
              type="number"
              min="0"
              placeholder="0"
              value={form.damage_fee}
              onChange={e => setForm(p => ({ ...p, damage_fee: e.target.value }))}
            />
          </Field>
          <Field label="Keterangan Kerusakan">
            <Input
              value={form.damage_desc}
              onChange={e => setForm(p => ({ ...p, damage_desc: e.target.value }))}
              placeholder="Contoh: Bumper depan penyok..."
            />
          </Field>
          {damageFee > 0 && (
            <p style={{ fontSize: "14px", fontWeight: 800, color: "#fb923c", marginTop: "4px" }}>
              Biaya Kerusakan: {fmt(damageFee)}
            </p>
          )}
        </div>
      )}

      {/* Ringkasan */}
      <div style={{ background: "#0a0f1e", border: "1px solid #334155", borderRadius: "10px", padding: "14px", marginBottom: "14px" }}>
        <p style={{ fontSize: "11px", color: "#475569", fontWeight: 700, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Ringkasan Tagihan</p>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#94a3b8", marginBottom: "6px" }}>
          <span>Total Sewa</span><span style={{ color: "#f1f5f9" }}>{fmt(data.total_cost ?? 0)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: lateFee > 0 ? "#f87171" : "#475569", marginBottom: "6px" }}>
          <span>Denda Keterlambatan{lateDays > 0 ? ` (${lateDays} hari)` : ""}</span>
          <span>{lateFee > 0 ? fmt(lateFee) : "—"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: damageFee > 0 ? "#fb923c" : "#475569", marginBottom: "6px" }}>
          <span>Biaya Kerusakan</span><span>{damageFee > 0 ? fmt(damageFee) : "—"}</span>
        </div>
        <div style={{ borderTop: "1px solid #1e293b", marginTop: "8px", paddingTop: "10px", display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: 800 }}>
          <span style={{ color: "#f1f5f9" }}>Total Bayar</span>
          <span style={{ color: "#60a5fa" }}>{fmt(grandTotal)}</span>
        </div>
      </div>

      <Field label="Catatan Tambahan">
        <Input
          value={form.notes}
          onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
          placeholder="Catatan lain jika ada..."
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

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({
  data,
  onClose,
  onDeleted,
}: {
  data: Return;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const [err,      setErr]      = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true); setErr("");
    const { error } = await supabase.from("returns").delete().eq("id", data.id);
    if (error) { setErr(error.message); setDeleting(false); return; }

    // Optionally restore rental + vehicle status back to "Aktif"/"Tersedia"
    await Promise.all([
      supabase.from("rentals").update({ status: "Aktif" }).eq("id", data.rental_id),
      supabase.from("vehicles").update({ status: "Disewa" }).eq("id", data.vehicle_id),
    ]);

    onDeleted(data.id);
    onClose();
  };

  const grandTotal = (data.total_cost ?? 0) + (data.late_fee ?? 0) + (data.damage_fee ?? 0);

  return (
    <Modal title="Hapus Data Pengembalian" onClose={onClose}>
      <ErrAlert msg={err} />

      {/* Warning banner */}
      <div style={{ background: "#7f1d1d33", border: "1px solid #f8717155", borderRadius: "12px", padding: "16px", marginBottom: "18px" }}>
        <p style={{ fontSize: "14px", fontWeight: 700, color: "#f87171", marginBottom: "6px" }}>
          ⚠ Tindakan Ini Tidak Dapat Dibatalkan
        </p>
        <p style={{ fontSize: "12.5px", color: "#fca5a5", lineHeight: "1.6" }}>
          Menghapus data pengembalian akan mengembalikan status transaksi sewa dan kendaraan ke kondisi <strong>Aktif / Disewa</strong>. Pastikan data ini memang perlu dihapus.
        </p>
      </div>

      {/* Summary card */}
      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "10px", padding: "14px", marginBottom: "18px" }}>
        <p style={{ fontSize: "11px", color: "#475569", fontWeight: 700, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Data Yang Akan Dihapus</p>
        {[
          ["Pelanggan",    data.customer_name],
          ["Kendaraan",    data.vehicle_name],
          ["Tgl Kembali",  data.return_date],
          ["Jatuh Tempo",  data.due_date],
          ["Kondisi",      data.condition],
          ["Total Bayar",  fmt(grandTotal)],
        ].map(([label, value]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
            <span style={{ color: "#64748b" }}>{label}</span>
            <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>Batal</Btn>
        // SESUDAH
<button
  onClick={handleDelete}
  disabled={deleting}
  style={{
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    background: deleting ? "#7f1d1d" : "#dc2626",
    border: "1px solid #dc2626",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "13px",
    fontWeight: 600,
    cursor: deleting ? "not-allowed" : "pointer",
    opacity: deleting ? 0.7 : 1,
    transition: "background 0.15s",
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
export default function Pengembalian() {
  const [returns,    setReturns]    = useState<Return[]>([]);
  const [rentals,    setRentals]    = useState<Rental[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [show,       setShow]       = useState(false);
  const [printData,  setPrintData]  = useState<Return | null>(null);
  const [editData,   setEditData]   = useState<Return | null>(null);
  const [deleteData, setDeleteData] = useState<Return | null>(null);
  const [form, setForm] = useState({
    rental_id:   "",
    return_date: "",
    condition:   "Baik",
    notes:       "",
    damage_fee:  "",
    damage_desc: "",
  });
  const [err,    setErr]    = useState("");
  const [saving, setSaving] = useState(false);

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

  const selected   = rentals.find(r => r.id === form.rental_id);
  const lateDays   = form.return_date && selected
    ? Math.max(0, Math.ceil((new Date(form.return_date).getTime() - new Date(selected.end_date).getTime()) / 86400000))
    : 0;
  const lateFee    = lateDays * (selected?.rate ?? 0);
  const damageFee  = parseFloat(form.damage_fee || "0") || 0;
  const totalSewa  = selected?.total_cost ?? 0;
  const grandTotal = totalSewa + lateFee + damageFee;
  const hasDamage  = form.condition !== "Baik";

  const handleSave = async () => {
    if (!form.rental_id || !form.return_date) {
      setErr("Transaksi dan tanggal pengembalian wajib diisi.");
      return;
    }
    if (!selected) return;
    setSaving(true); setErr("");

    const { data: newReturn, error } = await supabase.from("returns").insert({
      rental_id:     form.rental_id,
      customer_name: selected.customer_name,
      vehicle_name:  selected.vehicle_name,
      vehicle_id:    selected.vehicle_id,
      return_date:   form.return_date,
      due_date:      selected.end_date,
      total_cost:    selected.total_cost,
      late_days:     lateDays,
      late_fee:      lateFee,
      damage_fee:    damageFee,
      damage_desc:   form.damage_desc,
      condition:     form.condition,
      notes:         form.notes,
      status:        "Selesai",
    }).select().single();

    if (error) { setErr(error.message); setSaving(false); return; }

    await Promise.all([
      supabase.from("rentals").update({ status: "Selesai" }).eq("id", form.rental_id),
      supabase.from("vehicles").update({ status: "Tersedia" }).eq("id", selected.vehicle_id),
    ]);

    setReturns(p => [newReturn, ...p]);
    setRentals(p => p.filter(r => r.id !== form.rental_id));
    setForm({ rental_id: "", return_date: "", condition: "Baik", notes: "", damage_fee: "", damage_desc: "" });
    setSaving(false);
    setShow(false);
    setPrintData(newReturn);
  };

  const resetForm = () => {
    setForm({ rental_id: "", return_date: "", condition: "Baik", notes: "", damage_fee: "", damage_desc: "" });
    setErr("");
    setShow(true);
  };

  // Handlers for edit / delete callbacks
  const handleUpdated = (updated: Return) =>
    setReturns(p => p.map(r => (r.id === updated.id ? updated : r)));

  const handleDeleted = (id: string) =>
    setReturns(p => p.filter(r => r.id !== id));

  const COLS = ["Pelanggan", "Kendaraan", "Tgl Kembali", "Jatuh Tempo", "Total Sewa", "Keterlambatan", "Denda", "Biaya Rusak", "Total Bayar", "Kondisi", "Status", "Aksi"];

  // ── Inline action button style helper ──
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
    transition: "background 0.15s",
  });

  return (
    <div>
      <PageHeader
        title="Pengembalian Mobil"
        sub="Catat pengembalian dan hitung denda keterlambatan."
        action={
          <Btn onClick={resetForm} icon={<Icons.plus />} disabled={rentals.length === 0}>
            Catat Pengembalian
          </Btn>
        }
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

      {/* ── Tabel ── */}
      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", overflow: "hidden" }}>
        {loading ? <Loading /> : returns.length === 0 && rentals.length === 0 ? <Empty text="Belum ada data pengembalian." /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#0a0f1e" }}>
                  {COLS.map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Riwayat selesai */}
                {returns.map((r, i) => {
                  const rGrandTotal = (r.total_cost ?? 0) + (r.late_fee ?? 0) + (r.damage_fee ?? 0);
                  return (
                    <tr key={i} style={{ borderTop: "1px solid #1e293b" }}>
                      <td style={{ padding: "13px 14px", fontSize: "13px", fontWeight: 600, color: "#f1f5f9", whiteSpace: "nowrap" }}>{r.customer_name}</td>
                      <td style={{ padding: "13px 14px", fontSize: "13px", color: "#94a3b8", whiteSpace: "nowrap" }}>{r.vehicle_name}</td>
                      <td style={{ padding: "13px 14px", fontSize: "12.5px", color: "#94a3b8" }}>{r.return_date}</td>
                      <td style={{ padding: "13px 14px", fontSize: "12.5px", color: "#94a3b8" }}>{r.due_date}</td>
                      <td style={{ padding: "13px 14px", fontSize: "13px", color: "#94a3b8" }}>
                        {r.total_cost ? fmt(r.total_cost) : "—"}
                      </td>
                      <td style={{ padding: "13px 14px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: r.late_days > 0 ? "#f87171" : "#4ade80" }}>
                          {r.late_days > 0 ? `+${r.late_days} hari` : "Tepat Waktu"}
                        </span>
                      </td>
                      <td style={{ padding: "13px 14px", fontSize: "13px", fontWeight: 700, color: r.late_fee > 0 ? "#f87171" : "#64748b" }}>
                        {r.late_fee > 0 ? fmt(r.late_fee) : "—"}
                      </td>
                      <td style={{ padding: "13px 14px", fontSize: "13px", fontWeight: 700, color: r.damage_fee > 0 ? "#fb923c" : "#64748b" }}>
                        {r.damage_fee > 0 ? fmt(r.damage_fee) : "—"}
                      </td>
                      <td style={{ padding: "13px 14px", fontSize: "14px", fontWeight: 800, color: "#f1f5f9" }}>
                        {fmt(rGrandTotal)}
                      </td>
                      <td style={{ padding: "13px 14px", fontSize: "13px", color: "#94a3b8" }}>{r.condition}</td>
                      <td style={{ padding: "13px 14px" }}><StatusBadge status={r.status} /></td>

                      {/* ── Aksi ── */}
                      <td style={{ padding: "13px 14px" }}>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          {/* Struk */}
                          <button
                            onClick={() => setPrintData(r)}
                            title="Cetak Struk"
                            style={actionBtn("#94a3b8")}
                          >
                            <Icons.print /> Struk
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => setEditData(r)}
                            title="Edit"
                            style={actionBtn("#60a5fa")}
                          >
                            <Icons.edit /> Edit
                          </button>

                          {/* Hapus */}
                          <button
                            onClick={() => setDeleteData(r)}
                            title="Hapus"
                            style={actionBtn("#f87171")}
                          >
                            <Icons.trash /> Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Aktif */}
                {rentals.map((r, i) => (
                  <tr key={`active-${i}`} style={{ borderTop: "1px solid #1e293b", background: "#fbbf2408" }}>
                    <td style={{ padding: "13px 14px", fontSize: "13px", fontWeight: 600, color: "#f1f5f9" }}>{r.customer_name}</td>
                    <td style={{ padding: "13px 14px", fontSize: "13px", color: "#94a3b8" }}>{r.vehicle_name}</td>
                    <td style={{ padding: "13px 14px", fontSize: "12px", color: "#fbbf24" }}>Belum Kembali</td>
                    <td style={{ padding: "13px 14px", fontSize: "12.5px", color: "#94a3b8" }}>{r.end_date}</td>
                    <td style={{ padding: "13px 14px", fontSize: "13px", color: "#94a3b8" }}>{fmt(r.total_cost)}</td>
                    <td style={{ padding: "13px 14px", fontSize: "12px", color: "#fbbf24" }}>Aktif</td>
                    <td colSpan={3} style={{ padding: "13px 14px", fontSize: "13px", color: "#64748b" }}>—</td>
                    <td style={{ padding: "13px 14px" }}>—</td>
                    <td style={{ padding: "13px 14px" }}><StatusBadge status="Aktif" /></td>
                    <td />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Form Modal (Tambah) ── */}
      {show && (
        <Modal title="Catat Pengembalian Kendaraan" onClose={() => setShow(false)}>
          <ErrAlert msg={err} />
          <Field label="Transaksi Sewa Aktif" required>
            <Select value={form.rental_id} onChange={e => setForm(p => ({ ...p, rental_id: e.target.value }))}>
              <option value="">-- Pilih Transaksi --</option>
              {rentals.map(r => (
                <option key={r.id} value={r.id}>
                  {r.customer_name} · {r.vehicle_name} (jatuh tempo: {r.end_date})
                </option>
              ))}
            </Select>
          </Field>
          {selected && (
            <div style={{ background: "#1e293b", borderRadius: "9px", padding: "11px 14px", marginBottom: "14px", fontSize: "12.5px", color: "#94a3b8" }}>
              Jatuh tempo: <strong style={{ color: "#f1f5f9" }}>{selected.end_date}</strong>
              {" · "}Tarif: <strong style={{ color: "#f1f5f9" }}>{fmt(selected.rate)}/hari</strong>
              {" · "}Total Sewa: <strong style={{ color: "#60a5fa" }}>{fmt(selected.total_cost)}</strong>
            </div>
          )}
          <Field label="Tanggal Pengembalian" required>
            <Input type="date" value={form.return_date} onChange={e => setForm(p => ({ ...p, return_date: e.target.value }))} />
          </Field>
          <Field label="Kondisi Kendaraan">
            <Select value={form.condition} onChange={e => setForm(p => ({ ...p, condition: e.target.value }))}>
              <option>Baik</option>
              <option>Perlu Perbaikan Minor</option>
              <option>Rusak</option>
            </Select>
          </Field>
          {lateDays > 0 && (
            <div style={{ background: "#7f1d1d22", border: "1px solid #f8717133", borderRadius: "10px", padding: "14px", marginBottom: "14px" }}>
              <p style={{ fontSize: "12px", color: "#f87171", fontWeight: 700, marginBottom: "4px" }}>⚠ Keterlambatan Terdeteksi</p>
              <p style={{ fontSize: "13px", color: "#fca5a5" }}>{lateDays} hari terlambat</p>
              <p style={{ fontSize: "18px", fontWeight: 800, color: "#f87171", marginTop: "4px" }}>Denda: {fmt(lateFee)}</p>
            </div>
          )}
          {hasDamage && (
            <div style={{ background: "#431407aa", border: "1px solid #fb923c55", borderRadius: "12px", padding: "16px", marginBottom: "14px" }}>
              <p style={{ fontSize: "12px", color: "#fb923c", fontWeight: 700, marginBottom: "12px" }}>🔧 Kerusakan Terdeteksi — Tambah Biaya Perbaikan</p>
              <Field label="Biaya Kerusakan (Rp)">
                <Input type="number" min="0" placeholder="0" value={form.damage_fee} onChange={e => setForm(p => ({ ...p, damage_fee: e.target.value }))} />
              </Field>
              <Field label="Keterangan Kerusakan">
                <Input value={form.damage_desc} onChange={e => setForm(p => ({ ...p, damage_desc: e.target.value }))} placeholder="Contoh: Bumper depan penyok, kaca spion kiri retak..." />
              </Field>
              {damageFee > 0 && (
                <p style={{ fontSize: "14px", fontWeight: 800, color: "#fb923c", marginTop: "4px" }}>
                  Biaya Kerusakan: {fmt(damageFee)}
                </p>
              )}
            </div>
          )}
          {selected && (
            <div style={{ background: "#0a0f1e", border: "1px solid #334155", borderRadius: "10px", padding: "14px", marginBottom: "14px" }}>
              <p style={{ fontSize: "11px", color: "#475569", fontWeight: 700, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Ringkasan Tagihan</p>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#94a3b8", marginBottom: "6px" }}>
                <span>Total Sewa</span><span style={{ color: "#f1f5f9" }}>{fmt(totalSewa)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: lateFee > 0 ? "#f87171" : "#475569", marginBottom: "6px" }}>
                <span>Denda Keterlambatan{lateDays > 0 ? ` (${lateDays} hari)` : ""}</span>
                <span>{lateFee > 0 ? fmt(lateFee) : "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: damageFee > 0 ? "#fb923c" : "#475569", marginBottom: "6px" }}>
                <span>Biaya Kerusakan</span><span>{damageFee > 0 ? fmt(damageFee) : "—"}</span>
              </div>
              <div style={{ borderTop: "1px solid #1e293b", marginTop: "8px", paddingTop: "10px", display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: 800 }}>
                <span style={{ color: "#f1f5f9" }}>Total Bayar</span>
                <span style={{ color: "#60a5fa" }}>{fmt(grandTotal)}</span>
              </div>
            </div>
          )}
          <Field label="Catatan Tambahan">
            <Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Catatan lain jika ada..." />
          </Field>
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setShow(false)}>Batal</Btn>
            <Btn onClick={handleSave} icon={<Icons.save />} disabled={saving}>
              {saving ? "Menyimpan..." : "Konfirmasi & Cetak Struk"}
            </Btn>
          </div>
        </Modal>
      )}

      {/* ── Print Modal ── */}
      {printData  && <PrintReceipt data={printData}   onClose={() => setPrintData(null)} />}

      {/* ── Edit Modal ── */}
      {editData   && <EditModal   data={editData}   onClose={() => setEditData(null)}   onSaved={handleUpdated} />}

      {/* ── Delete Modal ── */}
      {deleteData && <DeleteModal data={deleteData} onClose={() => setDeleteData(null)} onDeleted={handleDeleted} />}
    </div>
  );
}