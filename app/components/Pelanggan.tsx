"use client";
// components/Pelanggan.tsx

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { Customer } from "../types/types";

import {
  StatusBadge,
  Loading,
  Empty,
  PageHeader,
  Modal,
  Field,
  Input,
  Select,
  Btn,
  ErrAlert,
} from "./ui";
import { Icons } from "./icons";

// ─── TYPES ────────────────────────────────────────────────────
type CForm = Pick<Customer, "name" | "phone" | "email" | "address" | "id_type" | "id_number">;
const BLANK: CForm = { name: "", phone: "", email: "", address: "", id_type: "KTP", id_number: "" };

// mode: "edit" = update text only | "add" = tambah pelanggan baru (dengan upload foto)
type ModalMode = "edit" | "add";

// ─── STORAGE ──────────────────────────────────────────────────
const BUCKET = "ktp_photos";

async function uploadDoc(file: File, customerId: string, type: "ktp" | "sim"): Promise<string | null> {
  const ext = file.name.split(".").pop();
  const path = `${customerId}/${type}_${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
  if (error) return null;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

// ─── PHOTO VIEWER (fullscreen) ────────────────────────────────
function PhotoViewer({ url, label, name, onClose }: { url: string; label: string; name: string; onClose: () => void }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)", cursor: "zoom-out" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 680, zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", fontFamily: "Syne, sans-serif" }}>Foto {label}</p>
            <p style={{ fontSize: 12, color: "#64748b" }}>{name}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a href={url} download target="_blank" rel="noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "#1e293b", border: "1px solid #334155", color: "#94a3b8", fontSize: 12, fontWeight: 600, textDecoration: "none", fontFamily: "inherit" }}>
              <Icons.download /> Unduh
            </a>
            <button onClick={onClose}
              style={{ width: 36, height: 36, borderRadius: 8, background: "#1e293b", border: "1px solid #334155", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icons.close />
            </button>
          </div>
        </div>
        <div style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 16, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 280 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={`${label} ${name}`} style={{ maxWidth: "100%", maxHeight: "72vh", objectFit: "contain", display: "block" }} />
        </div>
        <p style={{ textAlign: "center", marginTop: 10, fontSize: 11.5, color: "#334155" }}>Klik di luar atau tekan Esc untuk menutup</p>
      </div>
    </div>
  );
}

// ─── DOC THUMB ────────────────────────────────────────────────
function DocThumb({ url, label, name, onView }: { url: string | null; label: string; name: string; onView: () => void }) {
  if (!url) {
    return (
      <div style={{ borderRadius: 10, border: "1.5px dashed #1e293b", background: "#0a0f1e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: "20px 12px", textAlign: "center" }}>
        <span style={{ fontSize: 22 }}>🪪</span>
        <p style={{ fontSize: 12, color: "#334155" }}>Foto {label} belum tersedia</p>
      </div>
    );
  }
  return (
    <div onClick={onView} style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #1e293b", cursor: "zoom-in", position: "relative" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={label} style={{ width: "100%", height: 110, objectFit: "cover", display: "block", filter: "brightness(0.8)", transition: "filter 0.2s" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLImageElement).style.filter = "brightness(1)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLImageElement).style.filter = "brightness(0.8)"; }} />
      <div style={{ position: "absolute", bottom: 6, left: 8, right: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, color: "#f1f5f9" }}>{label}</span>
        <span style={{ background: "rgba(74,222,128,0.85)", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700, color: "#0a0a0a" }}>✓ Ada</span>
      </div>
    </div>
  );
}

// ─── UPLOAD ZONE ──────────────────────────────────────────────
function UploadZone({
  label, file, previewUrl, onFile,
}: {
  label: string;
  file: File | null;
  previewUrl: string | null;
  onFile: (f: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const display = file ? URL.createObjectURL(file) : previewUrl;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) onFile(f);
  };

  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</p>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          borderRadius: 10,
          border: `1.5px dashed ${dragging ? "#f59e0b" : display ? "#4ade80" : "#1e293b"}`,
          background: dragging ? "rgba(245,158,11,0.05)" : "#0a0f1e",
          cursor: "pointer",
          overflow: "hidden",
          transition: "border-color 0.2s",
          minHeight: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {display ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={display} alt={label} style={{ width: "100%", height: 100, objectFit: "cover", display: "block", filter: "brightness(0.75)" }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <span style={{ background: "rgba(0,0,0,0.6)", borderRadius: 8, padding: "3px 10px", fontSize: 11, color: "#4ade80", fontWeight: 700 }}>✓ {file ? "Siap upload" : "Ada"}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Klik untuk ganti</span>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "16px 12px" }}>
            <p style={{ fontSize: 22, marginBottom: 6 }}>📷</p>
            <p style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>Klik atau drag foto {label}</p>
            <p style={{ fontSize: 10, color: "#334155", marginTop: 3 }}>JPG, PNG, WEBP · Maks 5MB</p>
          </div>
        )}
      </div>
      {file && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
          <button onClick={(e) => { e.stopPropagation(); onFile(null); }}
            style={{ fontSize: 10, color: "#f87171", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
            Hapus foto
          </button>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
    </div>
  );
}

// ─── PROGRESS STEP ────────────────────────────────────────────
function SaveProgress({ step }: { step: number }) {
  // step: 0=idle 1=simpan data 2=upload ktp 3=upload sim 4=selesai
  const steps = ["Data disimpan", "Upload KTP", "Upload SIM"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, marginBottom: 14 }}>
      {steps.map((s, i) => {
        const done = step > i + 1;
        const active = step === i + 1;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: done ? "#4ade80" : active ? "#f59e0b" : "#1e293b",
              border: `2px solid ${done ? "#4ade80" : active ? "#f59e0b" : "#334155"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 800, color: done ? "#0a0f1e" : active ? "#0a0f1e" : "#475569",
              flexShrink: 0, transition: "all 0.3s",
            }}>
              {done ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: 11, color: done ? "#4ade80" : active ? "#f59e0b" : "#475569", fontWeight: 600, whiteSpace: "nowrap" }}>{s}</span>
            {i < steps.length - 1 && <span style={{ color: "#1e293b", fontSize: 12, margin: "0 2px" }}>→</span>}
          </div>
        );
      })}
    </div>
  );
}

// ─── DETAIL DRAWER ────────────────────────────────────────────
function DetailDrawer({ customer, ktpUrl, simUrl, onClose, onEdit }: {
  customer: Customer; ktpUrl: string | null; simUrl: string | null;
  onClose: () => void; onEdit: (c: Customer) => void;
}) {
  const [viewer, setViewer] = useState<{ url: string; label: string } | null>(null);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") { if (viewer) setViewer(null); else onClose(); } };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose, viewer]);

  const initials = customer.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const hue = (customer.name.charCodeAt(0) * 37) % 360;

  const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
    <div style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: "1px solid #1e293b" }}>
      <span style={{ fontSize: 14, width: 20, textAlign: "center", flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 13, color: "#e2e8f0", wordBreak: "break-word" }}>{value || "—"}</p>
      </div>
    </div>
  );

  return (
    <>
      <style>{`@keyframes drawerIn { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }`}</style>

      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 950, width: "100%", maxWidth: 420, background: "#0a0f1e", borderLeft: "1px solid #1e293b", boxShadow: "-20px 0 60px rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", animation: "drawerIn 0.3s cubic-bezier(.22,1,.36,1) both", overflowY: "auto" }}>

        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#0a0f1e", zIndex: 10 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", fontFamily: "Syne, sans-serif" }}>Detail Pelanggan</p>
            <p style={{ fontSize: 11, color: "#475569" }}>Data dari booking user</p>
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            <button onClick={() => { onClose(); onEdit(customer); }}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, background: "#1e293b", border: "1px solid #334155", color: "#94a3b8", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
              <Icons.edit /> Edit
            </button>
            <button onClick={onClose}
              style={{ width: 33, height: 33, borderRadius: 8, background: "#1e293b", border: "1px solid #334155", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icons.close />
            </button>
          </div>
        </div>

        {/* Avatar */}
        <div style={{ padding: "20px", borderBottom: "1px solid #1e293b", display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 54, height: 54, borderRadius: 14, background: `hsl(${hue},55%,20%)`, border: `2px solid hsl(${hue},55%,32%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: `hsl(${hue},75%,65%)`, flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#f8fafc", fontFamily: "Syne, sans-serif", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{customer.name}</p>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {customer.status && <StatusBadge status={customer.status} />}
              <span style={{ padding: "2px 8px", borderRadius: 20, background: "#1e293b", border: "1px solid #334155", fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                🪪 {customer.id_type || "KTP"}
              </span>
              {customer.source === "manual" && (
                <span style={{ padding: "2px 8px", borderRadius: 20, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", fontSize: 11, color: "#818cf8", fontWeight: 600 }}>
                  ✍️ Input Admin
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e293b" }}>
          <InfoRow icon="👤" label="Nama Lengkap" value={customer.name} />
          <InfoRow icon="🔢" label="NIK" value={customer.id_number || "—"} />
          <InfoRow icon="📞" label="Telepon" value={customer.phone} />
          <InfoRow icon="✉️" label="Email" value={customer.email || "—"} />
          <InfoRow icon="📍" label="Alamat" value={customer.address || "—"} />
          {customer.join_date && (
            <InfoRow icon="📅" label="Bergabung"
              value={new Date(customer.join_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} />
          )}
        </div>

        {/* Stats */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e293b" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Statistik</p>
          <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "12px 14px", display: "inline-block" }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: "#f59e0b", fontFamily: "Syne, sans-serif", lineHeight: 1.1, marginBottom: 3 }}>{customer.total_rent ?? 0}×</p>
            <p style={{ fontSize: 11, color: "#475569" }}>Total Sewa</p>
          </div>
        </div>

        {/* Dokumen — view only */}
        <div style={{ padding: "14px 20px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Dokumen Identitas</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <DocThumb url={ktpUrl} label="KTP" name={customer.name} onView={() => ktpUrl && setViewer({ url: ktpUrl, label: "KTP" })} />
            <DocThumb url={simUrl} label="SIM" name={customer.name} onView={() => simUrl && setViewer({ url: simUrl, label: "SIM" })} />
          </div>
          <p style={{ fontSize: 11, color: "#334155", marginTop: 10, textAlign: "center" }}>
            {customer.source === "manual" ? "Dokumen diunggah oleh admin" : "Dokumen diunggah penyewa saat booking"}
          </p>
        </div>
      </div>

      {viewer && <PhotoViewer url={viewer.url} label={viewer.label} name={customer.name} onClose={() => setViewer(null)} />}
    </>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────
export default function Pelanggan() {
  const [list, setList]       = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [show, setShow]       = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("edit");
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm]       = useState<CForm>(BLANK);
  const [err, setErr]         = useState("");
  const [saving, setSaving]   = useState(false);
  const [saveStep, setSaveStep] = useState(0); // progress for add mode
  const [detail, setDetail]   = useState<Customer | null>(null);
  const [docUrls, setDocUrls] = useState<Record<string, { ktp: string | null; sim: string | null }>>({});
  const [viewer, setViewer]   = useState<{ url: string; label: string; name: string } | null>(null);

  // Upload files — only used in "add" mode
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [simFile, setSimFile] = useState<File | null>(null);

  const buildDocUrls = useCallback((rows: Customer[]) => {
    const map: Record<string, { ktp: string | null; sim: string | null }> = {};
    for (const c of rows) {
      map[c.id] = {
        ktp: c.ktp_url || null,
        sim: c.sim_url || null,
      };
    }
    setDocUrls(map);
  }, []);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("customers").select("*").order("name");
    const rows = (data ?? []) as Customer[];
    setList(rows);
    buildDocUrls(rows);
    setLoading(false);
  }, [buildDocUrls]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const filtered = list.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  // ── Open edit modal ──
  const openEdit = (c: Customer) => {
    setModalMode("edit");
    setEditing(c);
    setForm({ name: c.name, phone: c.phone, email: c.email, address: c.address, id_type: c.id_type, id_number: c.id_number });
    setErr("");
    setSaveStep(0);
    setShow(true);
  };

  // ── Open add manual modal ──
  const openAdd = () => {
    setModalMode("add");
    setEditing(null);
    setForm(BLANK);
    setKtpFile(null);
    setSimFile(null);
    setErr("");
    setSaveStep(0);
    setShow(true);
  };

  // ── Save: edit mode ──
  const handleSaveEdit = async () => {
    if (!form.name.trim() || !form.phone.trim()) { setErr("Nama dan telepon wajib diisi."); return; }
    if (!editing) return;
    setSaving(true);
    setErr("");
    try {
      const { data, error } = await supabase.from("customers").update(form).eq("id", editing.id).select().single();
      if (error) throw new Error(error.message);
      const updated = data as Customer;
      setList((p) => p.map((c) => (c.id === editing.id ? updated : c)));
      if (detail?.id === editing.id) setDetail(updated);
      setShow(false);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  };

  // ── Save: add mode (insert + upload) ──
  const handleSaveAdd = async () => {
    if (!form.name.trim() || !form.phone.trim()) { setErr("Nama dan telepon wajib diisi."); return; }
    setSaving(true);
    setErr("");
    setSaveStep(1);

    try {
      // 1. Insert customer row
      const { data, error } = await supabase.from("customers").insert({
        ...form,
        source: "manual",
        join_date: new Date().toISOString(),
        status: "active",
        total_rent: 0,
      }).select().single();
      if (error) throw new Error(error.message);
      const newCustomer = data as Customer;

      let ktpUrl: string | null = null;
      let simUrl: string | null = null;

      // 2. Upload KTP
      setSaveStep(2);
      if (ktpFile) {
        ktpUrl = await uploadDoc(ktpFile, newCustomer.id, "ktp");
      }

      // 3. Upload SIM
      setSaveStep(3);
      if (simFile) {
        simUrl = await uploadDoc(simFile, newCustomer.id, "sim");
      }

      // 4. Update URLs if any were uploaded
      if (ktpUrl || simUrl) {
        await supabase.from("customers").update({ ktp_url: ktpUrl, sim_url: simUrl }).eq("id", newCustomer.id);
        newCustomer.ktp_url = ktpUrl ?? undefined;
        newCustomer.sim_url = simUrl ?? undefined;
      }

      setSaveStep(4);

      setList((p) => [...p, newCustomer].sort((a, b) => a.name.localeCompare(b.name)));
      setDocUrls((prev) => ({ ...prev, [newCustomer.id]: { ktp: ktpUrl, sim: simUrl } }));

      // small delay so user sees "selesai"
      await new Promise((r) => setTimeout(r, 600));
      setShow(false);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Terjadi kesalahan.");
      setSaveStep(0);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => modalMode === "add" ? handleSaveAdd() : handleSaveEdit();

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus pelanggan ini?")) return;
    await supabase.from("customers").delete().eq("id", id);
    setList((p) => p.filter((c) => c.id !== id));
    if (detail?.id === id) setDetail(null);
  };

  const set = (k: keyof CForm, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div>
      <PageHeader
        title="Data Pelanggan"
        sub="Data otomatis terisi dari booking user, atau tambah manual untuk sewa langsung."
      />

      {/* Top bar: search + tambah */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#64748b" }}><Icons.search /></span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama atau nomor telepon..."
            style={{ width: "100%", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 9, padding: "9px 12px 9px 36px", color: "#f1f5f9", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
        </div>

        {/* ── Tambah Pelanggan Manual ── */}
        <button onClick={openAdd}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 9, background: "linear-gradient(135deg, #f59e0b, #d97706)", border: "none", color: "#0a0f1e", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "Syne, sans-serif", whiteSpace: "nowrap", flexShrink: 0, boxShadow: "0 4px 14px rgba(245,158,11,0.3)" }}>
          <Icons.plus /> Tambah 
        </button>
      </div>

      {/* Grid */}
      {loading ? <Loading /> : filtered.length === 0 ? <Empty text="Belum ada data pelanggan." /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
          {filtered.map((c) => {
            const docs = docUrls[c.id] ?? { ktp: null, sim: null };
            const hue = (c.name.charCodeAt(0) * 37) % 360;
            const isManual = c.source === "manual";
            return (
              <div key={c.id} style={{ background: "#0f172a", border: `1px solid ${isManual ? "rgba(99,102,241,0.25)" : "#1e293b"}`, borderRadius: 14, overflow: "hidden" }}>

                {/* Doc strip — KTP | SIM side by side */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "#1e293b" }}>
                  {(["ktp", "sim"] as const).map((type) => {
                    const url = docs[type];
                    return url ? (
                      <div key={type} onClick={() => setViewer({ url, label: type.toUpperCase(), name: c.name })}
                        style={{ height: 64, cursor: "zoom-in", position: "relative", overflow: "hidden", background: "#0a0f1e" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={type} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(3px) brightness(0.45)" }} />
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: "#f1f5f9" }}>
                            🪪 {type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div key={type} style={{ height: 64, background: "#0a0f1e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 11, color: "#2d3f55" }}>No {type.toUpperCase()}</span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ padding: "14px 16px" }}>
                  {/* Name row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: `hsl(${hue},55%,22%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: `hsl(${hue},75%,65%)`, flexShrink: 0 }}>
                      {c.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</p>
                        {isManual && (
                          <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 10, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#818cf8", fontWeight: 700, flexShrink: 0 }}>Offline</span>
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: "#475569" }}>{c.id_number || "—"} · {c.id_type || "KTP"}</p>
                    </div>
                    {c.status && <StatusBadge status={c.status} />}
                  </div>

                  {/* Contact */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12, padding: "10px 12px", background: "#0f172a", borderRadius: 8, border: "1px solid #1e293b" }}>
                    <p style={{ fontSize: 12, color: "#94a3b8" }}>📞 {c.phone}</p>
                    {c.email && <p style={{ fontSize: 12, color: "#94a3b8" }}>✉ {c.email}</p>}
                    {c.address && <p style={{ fontSize: 11.5, color: "#64748b" }}>📍 {c.address}</p>}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <button onClick={() => setDetail(c)}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 6, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.22)", color: "#f59e0b", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
                      <Icons.eye /> Detail
                    </button>
                    <button onClick={() => openEdit(c)}
                      style={{ padding: "5px 10px", borderRadius: 6, background: "#1e293b", border: "1px solid #334155", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontFamily: "inherit" }}>
                      <Icons.edit /> Edit
                    </button>
                    <button onClick={() => handleDelete(c.id)}
                      style={{ padding: "5px 8px", borderRadius: 6, background: "#7f1d1d22", border: "1px solid #f8717133", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center" }}>
                      <Icons.trash />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Edit atau Tambah Manual ── */}
      {show && (
        <Modal
          title={modalMode === "add" ? "Tambah Pelanggan Manual" : "Edit Data Pelanggan"}
          onClose={() => !saving && setShow(false)}
          width="520px"
        >
          {/* Info banner */}
          {modalMode === "add" ? (
            <div style={{ fontSize: 12, color: "#818cf8", marginBottom: 16, padding: "10px 14px", background: "rgba(99,102,241,0.08)", borderRadius: 8, border: "1px solid rgba(99,102,241,0.2)", lineHeight: 1.6 }}>
              ✍️ <strong>Input Admin</strong> — Untuk pelanggan yang menyewa langsung tanpa booking online. Foto KTP & SIM bersifat opsional.
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "#475569", marginBottom: 16, padding: "8px 12px", background: "#0f172a", borderRadius: 8, border: "1px solid #1e293b" }}>
              ℹ️ Dokumen KTP & SIM diunggah langsung oleh penyewa saat booking dan tidak dapat diubah dari sini.
            </div>
          )}

          {/* Progress bar — only in add mode while saving */}
          {modalMode === "add" && saving && saveStep > 0 && <SaveProgress step={saveStep} />}

          <ErrAlert msg={err} />

          {/* ─ Form fields ─ */}
          <Field label="Nama Lengkap" required>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Nama lengkap sesuai KTP" disabled={saving} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Field label="Telepon" required>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="08XXXXXXXXXX" disabled={saving} />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@gmail.com" disabled={saving} />
            </Field>
          </div>
          <Field label="Alamat">
            <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Alamat lengkap" disabled={saving} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Field label="Jenis ID">
              <Select value={form.id_type} onChange={(e) => set("id_type", e.target.value)} disabled={saving}>
                <option>KTP</option><option>SIM</option><option>Passport</option>
              </Select>
            </Field>
            <Field label="Nomor ID">
              <Input value={form.id_number} onChange={(e) => set("id_number", e.target.value)} placeholder="Nomor identitas" disabled={saving} />
            </Field>
          </div>

          {/* ─ Upload section — only in add mode ─ */}
          {modalMode === "add" && (
            <>
              <div style={{ borderTop: "1px solid #1e293b", margin: "16px 0 14px" }} />
              <p style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                📷 Foto Dokumen <span style={{ color: "#334155", fontWeight: 500 }}>(opsional)</span>
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <UploadZone
                  label="KTP"
                  file={ktpFile}
                  previewUrl={null}
                  onFile={(f) => !saving && setKtpFile(f)}
                />
                <UploadZone
                  label="SIM"
                  file={simFile}
                  previewUrl={null}
                  onFile={(f) => !saving && setSimFile(f)}
                />
              </div>
            </>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setShow(false)} disabled={saving}>Batal</Btn>
            <Btn onClick={handleSave} icon={<Icons.save />} disabled={saving}>
              {saving
                ? modalMode === "add"
                  ? saveStep === 1 ? "Menyimpan data..." : saveStep === 2 ? "Upload KTP..." : saveStep === 3 ? "Upload SIM..." : "Selesai ✓"
                  : "Menyimpan..."
                : modalMode === "add" ? "Tambah Pelanggan" : "Simpan"}
            </Btn>
          </div>
        </Modal>
      )}

      {/* ── Detail Drawer ── */}
      {detail && (
        <DetailDrawer
          customer={detail}
          ktpUrl={docUrls[detail.id]?.ktp ?? null}
          simUrl={docUrls[detail.id]?.sim ?? null}
          onClose={() => setDetail(null)}
          onEdit={(c) => { setDetail(null); openEdit(c); }}
        />
      )}

      {/* ── Quick photo viewer (from card) ── */}
      {viewer && <PhotoViewer url={viewer.url} label={viewer.label} name={viewer.name} onClose={() => setViewer(null)} />}
    </div>
  );
}