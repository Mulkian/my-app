"use client";
// components/Armada.tsx

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Vehicle } from "../types/types";
import { StatusBadge, Loading, Empty, PageHeader, Modal, Field, Input, Select, Btn, ErrAlert, Td } from "./ui";
import { Icons } from "./icons";

// ── Tambahkan field photo_url ke tipe Vehicle di types/types.ts jika belum ada ──
type VForm = Omit<Vehicle, "id" | "created_at"> & { photo_url?: string };
const BLANK: VForm = {
  name: "", plate: "", year: "", color: "",
  rate: 0, status: "Tersedia", odometer: "",
  fuel: "Bensin", transmission: "Manual", photo_url: "",
};

export default function Armada() {
  const [list,       setList]       = useState<Vehicle[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [filter,     setFilter]     = useState("Semua");
  const [show,       setShow]       = useState(false);
  const [editing,    setEditing]    = useState<Vehicle | null>(null);
  const [form,       setForm]       = useState<VForm>(BLANK);
  const [err,        setErr]        = useState("");
  const [saving,     setSaving]     = useState(false);
  const [imgPreview, setImgPreview] = useState<string>("");
  const [imgFile,    setImgFile]    = useState<File | null>(null);
  const [imgUploading, setImgUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchVehicles = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("vehicles")
      .select("*")
      .order("created_at", { ascending: false });
    setList(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchVehicles(); }, []);

  const filtered = list.filter(v => {
    const q = search.toLowerCase();
    return (v.name.toLowerCase().includes(q) || v.plate.toLowerCase().includes(q))
      && (filter === "Semua" || v.status === filter);
  });

  const openAdd = () => {
    setEditing(null);
    setForm(BLANK);
    setImgPreview("");
    setImgFile(null);
    setErr("");
    setShow(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setForm({
      name: v.name, plate: v.plate, year: v.year, color: v.color,
      rate: v.rate, status: v.status, odometer: v.odometer,
      fuel: v.fuel, transmission: v.transmission,
      photo_url: (v as any).photo_url ?? "",
    });
    setImgPreview((v as any).photo_url ?? "");
    setImgFile(null);
    setErr("");
    setShow(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus kendaraan ini?")) return;
    await supabase.from("vehicles").delete().eq("id", id);
    setList(p => p.filter(v => v.id !== id));
  };

  // ── Handle pilih file gambar ──
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErr("File harus berupa gambar."); return; }
    if (file.size > 5 * 1024 * 1024) { setErr("Ukuran gambar maksimal 5MB."); return; }
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
    setErr("");
  };

  // ── Upload gambar ke Supabase Storage ──
  const uploadImage = async (file: File): Promise<string> => {
    setImgUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `vehicle_${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("photo_url")
      .upload(fileName, file, { upsert: true });
    setImgUploading(false);
    if (error) throw new Error(error.message);
    const { data: urlData } = supabase.storage
      .from("photo_url")
      .getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.plate.trim()) { setErr("Nama dan plat nomor wajib diisi."); return; }
    if (form.rate <= 0) { setErr("Tarif harus lebih dari 0."); return; }
    setSaving(true); setErr("");

    let photoUrl = form.photo_url ?? "";
    if (imgFile) {
      try {
        photoUrl = await uploadImage(imgFile);
      } catch (e: any) {
        setErr("Gagal upload gambar: " + e.message);
        setSaving(false);
        return;
      }
    }

    const payload = { ...form, photo_url: photoUrl };

    if (editing) {
      const { data, error } = await supabase.from("vehicles").update(payload).eq("id", editing.id).select().single();
      if (error) { setErr(error.message); setSaving(false); return; }
      setList(p => p.map(v => v.id === editing.id ? data : v));
    } else {
      const { data, error } = await supabase.from("vehicles").insert(payload).select().single();
      if (error) { setErr(error.message); setSaving(false); return; }
      setList(p => [data, ...p]);
    }
    setSaving(false); setShow(false);
  };

  const set = (k: keyof VForm, val: string) =>
    setForm(p => ({ ...p, [k]: k === "rate" ? Number(val) : val }));

  return (
    <div>
      <PageHeader
        title="Manajemen Armada"
        sub="Kelola seluruh kendaraan rental Anda."
        action={<Btn onClick={openAdd} icon={<Icons.plus />}>Tambah Kendaraan</Btn>}
      />

      {/* Search & Filter */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "18px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}>
            <Icons.search />
          </span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama atau plat nomor..."
            style={{ width: "100%", background: "#0f172a", border: "1px solid #1e293b", borderRadius: "9px", padding: "9px 12px 9px 36px", color: "#f1f5f9", fontSize: "13px", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
          />
        </div>
        {["Semua", "Tersedia", "Disewa", "Maintenance"].map(f => (
          <button
            key={f} onClick={() => setFilter(f)}
            style={{ padding: "9px 16px", borderRadius: "9px", border: "1px solid", fontSize: "13px", fontWeight: 600, cursor: "pointer", background: filter === f ? "#f59e0b" : "transparent", color: filter === f ? "#0f0f0f" : "#64748b", borderColor: filter === f ? "#f59e0b" : "#1e293b", fontFamily: "inherit" }}
          >{f}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", overflow: "hidden" }}>
        {loading ? <Loading /> : filtered.length === 0 ? <Empty text="Belum ada kendaraan." /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#0a0f1e" }}>
                  {["Foto", "Kendaraan", "Plat Nomor", "Tahun", "Tarif/Hari", "Odometer", "Status", "Aksi"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((v, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #1e293b" }}>
                    {/* Kolom Foto */}
                    <td style={{ padding: "10px 16px" }}>
                      {(v as any).photo_url ? (
                        <img
                          src={(v as any).photo_url}
                          alt={v.name}
                          style={{ width: "56px", height: "40px", objectFit: "cover", borderRadius: "7px", border: "1px solid #1e293b", display: "block" }}
                        />
                      ) : (
                        <div style={{ width: "56px", height: "40px", borderRadius: "7px", background: "#1e293b", border: "1px solid #334155", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: "18px" }}>🚗</span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#f1f5f9" }}>{v.name}</div>
                      <div style={{ fontSize: "11.5px", color: "#64748b" }}>{v.color} · {v.transmission}</div>
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <code style={{ fontSize: "12px", background: "#1e293b", padding: "2px 8px", borderRadius: "5px", color: "#94a3b8" }}>{v.plate}</code>
                    </td>
                    <Td muted>{v.year}</Td>
                    <Td bold>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v.rate)}</Td>
                    <Td muted>{v.odometer || "—"}</Td>
                    <td style={{ padding: "13px 16px" }}><StatusBadge status={v.status} /></td>
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => openEdit(v)} style={{ padding: "5px 10px", borderRadius: "6px", background: "#1e293b", border: "1px solid #334155", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px" }}>
                          <Icons.edit /> Edit
                        </button>
                        <button onClick={() => handleDelete(v.id)} style={{ padding: "5px 8px", borderRadius: "6px", background: "#7f1d1d22", border: "1px solid #f8717133", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center" }}>
                          <Icons.trash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah / Edit */}
      {show && (
        <Modal title={editing ? "Edit Kendaraan" : "Tambah Kendaraan"} onClose={() => setShow(false)}>
          <ErrAlert msg={err} />

          {/* ── Upload Foto ── */}
          <div style={{ marginBottom: "18px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
              Foto Kendaraan
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: "2px dashed #334155", borderRadius: "12px", padding: "16px",
                display: "flex", alignItems: "center", gap: "14px", cursor: "pointer",
                background: "#0a0f1e", transition: "border-color 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "#f59e0b")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "#334155")}
            >
              {imgPreview ? (
                <img
                  src={imgPreview}
                  alt="preview"
                  style={{ width: "80px", height: "56px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: "80px", height: "56px", borderRadius: "8px", background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "24px" }}>
                  🚗
                </div>
              )}
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#94a3b8" }}>
                  {imgFile ? imgFile.name : imgPreview ? "Ganti foto" : "Klik untuk upload foto"}
                </div>
                <div style={{ fontSize: "11px", color: "#475569", marginTop: "3px" }}>
                  JPG, PNG, WEBP · Maks 5MB
                </div>
                {imgUploading && (
                  <div style={{ fontSize: "11px", color: "#f59e0b", marginTop: "3px" }}>Mengupload...</div>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageChange}
            />
            {imgPreview && (
              <button
                onClick={() => { setImgPreview(""); setImgFile(null); setForm(p => ({ ...p, photo_url: "" })); }}
                style={{ marginTop: "6px", fontSize: "11px", color: "#f87171", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                ✕ Hapus foto
              </button>
            )}
          </div>

          {/* Field lainnya */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Field label="Nama Kendaraan" required>
              <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Toyota Avanza" />
            </Field>
            <Field label="Plat Nomor" required>
              <Input value={form.plate} onChange={e => set("plate", e.target.value)} placeholder="B 1234 ABC" />
            </Field>
            <Field label="Tahun">
              <Input value={form.year} onChange={e => set("year", e.target.value)} placeholder="2023" />
            </Field>
            <Field label="Warna">
              <Input value={form.color} onChange={e => set("color", e.target.value)} placeholder="Hitam" />
            </Field>
            <Field label="Tarif/Hari (Rp)" required>
              <Input type="number" value={form.rate || ""} onChange={e => set("rate", e.target.value)} placeholder="350000" />
            </Field>
            <Field label="Odometer">
              <Input value={form.odometer} onChange={e => set("odometer", e.target.value)} placeholder="45.200 km" />
            </Field>
            <Field label="Bahan Bakar">
              <Select value={form.fuel} onChange={e => set("fuel", e.target.value)}>
                <option>Bensin</option><option>Solar</option><option>Hybrid</option>
              </Select>
            </Field>
            <Field label="Transmisi">
              <Select value={form.transmission} onChange={e => set("transmission", e.target.value)}>
                <option>Manual</option><option>Otomatis</option>
              </Select>
            </Field>
            <div style={{ gridColumn: "span 2" }}>
              <Field label="Status">
                <Select value={form.status} onChange={e => set("status", e.target.value)}>
                  <option>Tersedia</option><option>Disewa</option><option>Maintenance</option>
                </Select>
              </Field>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setShow(false)}>Batal</Btn>
            <Btn onClick={handleSave} icon={<Icons.save />} disabled={saving || imgUploading}>
              {saving ? "Menyimpan..." : imgUploading ? "Mengupload..." : "Simpan"}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}