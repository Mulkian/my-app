"use client";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Vehicle, Rental, BookForm, ProfilState } from "types/types";
import {
  ACCENT, CARD_BG, CARD_BORDER, TEXT_PRIMARY, TEXT_MUTED,
  lStyle, iStyle,
} from "@/lib/constants";
import { fmt, diffDays } from "@/lib/utils";
import { Icons } from "@/app/portal/components/icons";
import { Badge, VehicleImg } from "@/app/portal/components/ui";

// ─── Types ────────────────────────────────────────────────────
interface IdentityForm {
  fullName: string;
  nik: string;
  phone: string;
  address: string;
  simNumber: string;
  ktpFile: File | null;
  simFile: File | null;
  ktpPreview: string;
  simPreview: string;
}

interface Props {
  vehicles: Vehicle[];
  user: any;
  profil: ProfilState;
  selectedVehicle: Vehicle | null;
  setSelectedVehicle: (v: Vehicle | null) => void;
  onBookSuccess: (rental: Rental) => void;
  onNavigate: (page: string) => void;
}

// ─── Main Component ───────────────────────────────────────────
export default function BookingPage({
  vehicles,
  user,
  profil,
  selectedVehicle,
  setSelectedVehicle,
  onBookSuccess,
  onNavigate,
}: Props) {
  const [bookStep, setBookStep] = useState<1 | 2 | 3 | 4>(1);
  const [bookForm, setBookForm] = useState<BookForm>({ start: "", end: "", notes: "", withDriver: false, pickup: "" });
  const [identityForm, setIdentityForm] = useState<IdentityForm>({
    fullName: profil.name || user?.user_metadata?.full_name || "",
    nik: "",
    phone: profil.phone || "",
    address: "",
    simNumber: "",
    ktpFile: null,
    simFile: null,
    ktpPreview: "",
    simPreview: "",
  });
  const [bookLoading, setBookLoading] = useState(false);
  const [bookError, setBookError] = useState("");
  const [bookSuccess, setBookSuccess] = useState(false);

  const ktpRef = useRef<HTMLInputElement>(null);
  const simRef = useRef<HTMLInputElement>(null);

  const resetBooking = () => {
    setSelectedVehicle(null);
    setBookForm({ start: "", end: "", notes: "", withDriver: false, pickup: "" });
    setIdentityForm({ fullName: "", nik: "", phone: "", address: "", simNumber: "", ktpFile: null, simFile: null, ktpPreview: "", simPreview: "" });
    setBookSuccess(false);
    setBookStep(1);
    setBookError("");
  };

  // ── Upload helper ──────────────────────────────────────────
  const uploadDoc = async (file: File, docType: "ktp" | "sim"): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `documents/${user.id}/${docType}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("rental-docs").upload(path, file, { upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from("rental-docs").getPublicUrl(path);
    return data.publicUrl;
  };

  // ── Handle file pick ───────────────────────────────────────
  const handleFilePick = (type: "ktp" | "sim", file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      if (type === "ktp") setIdentityForm((p) => ({ ...p, ktpFile: file, ktpPreview: preview }));
      else setIdentityForm((p) => ({ ...p, simFile: file, simPreview: preview }));
    };
    reader.readAsDataURL(file);
  };

  // ── Validate identity step ─────────────────────────────────
  const validateIdentity = () => {
    if (!identityForm.fullName.trim()) return "Nama lengkap wajib diisi.";
    if (!identityForm.nik.trim() || identityForm.nik.length !== 16) return "NIK harus 16 digit.";
    if (!identityForm.phone.trim()) return "Nomor HP wajib diisi.";
    if (!identityForm.address.trim()) return "Alamat wajib diisi.";
    if (!identityForm.simNumber.trim()) return "Nomor SIM wajib diisi.";
    if (!identityForm.ktpFile) return "Foto KTP wajib diunggah.";
    if (!identityForm.simFile) return "Foto SIM wajib diunggah.";
    return null;
  };

  // ── Validate vehicle step ───────────────────────────────────
  const validateVehicle = () => {
    if (!selectedVehicle) return "Pilih kendaraan dulu.";
    return null;
  };

  // ── Cek apakah boleh pindah ke step tertentu ────────────────
  const canGoToStep = (target: number) => {
    if (target === 1) return true;
    if (target === 2) return !validateIdentity();
    if (target === 3) return !validateIdentity() && !validateVehicle();
    return false; // step 4 hanya via submit sukses, tidak lewat klik manual
  };

  // ── Handle klik tab step ─────────────────────────────────────
  const handleStepClick = (target: 1 | 2 | 3 | 4) => {
    if (target === bookStep) return;

    // Mundur ke step sebelumnya selalu boleh
    if (target < bookStep) {
      setBookError("");
      setBookStep(target);
      return;
    }

    // Maju ke step berikutnya harus lolos validasi dulu
    if (canGoToStep(target)) {
      setBookError("");
      setBookStep(target);
    } else {
      const err = target === 2 ? validateIdentity() : validateVehicle();
      setBookError(err || "Lengkapi step sebelumnya terlebih dahulu.");
    }
  };

  // ── Handle final booking ───────────────────────────────────
  const handleBook = async () => {
    if (!selectedVehicle || !bookForm.start || !bookForm.end || bookForm.end <= bookForm.start) {
      setBookError("Lengkapi semua field booking.");
      return;
    }
    setBookLoading(true);
    setBookError("");

    // Upload docs
    let ktpUrl = "", simUrl = "";
    if (identityForm.ktpFile) {
      const url = await uploadDoc(identityForm.ktpFile, "ktp");
      if (!url) { setBookError("Gagal upload foto KTP."); setBookLoading(false); return; }
      ktpUrl = url;
    }
    if (identityForm.simFile) {
      const url = await uploadDoc(identityForm.simFile, "sim");
      if (!url) { setBookError("Gagal upload foto SIM."); setBookLoading(false); return; }
      simUrl = url;
    }

    const days = diffDays(bookForm.start, bookForm.end);
    const total = days * selectedVehicle.rate + (bookForm.withDriver ? days * 150000 : 0);

    // Upsert customer
    const { data: ex } = await supabase.from("customers").select("id").eq("id", user.id).single();
    if (!ex) {
      await supabase.from("customers").insert({
        id: user.id,
        name: identityForm.fullName,
        phone: identityForm.phone,
        email: user.email,
        nik: identityForm.nik,
        address: identityForm.address,
        sim_number: identityForm.simNumber,
        ktp_url: ktpUrl,
        sim_url: simUrl,
      });
    } else {
      await supabase.from("customers").update({
        name: identityForm.fullName,
        phone: identityForm.phone,
        nik: identityForm.nik,
        address: identityForm.address,
        sim_number: identityForm.simNumber,
        ktp_url: ktpUrl,
        sim_url: simUrl,
      }).eq("id", user.id);
    }

    const { error } = await supabase.from("rentals").insert({
      customer_id: user.id,
      customer_name: identityForm.fullName,
      vehicle_id: selectedVehicle.id,
      vehicle_name: selectedVehicle.name,
      plate: selectedVehicle.plate,
      start_date: bookForm.start,
      end_date: bookForm.end,
      days,
      rate: selectedVehicle.rate,
      total_cost: total,
      status: "Pending",
      payment_status: "Belum Bayar",
      notes: (bookForm.notes + (bookForm.withDriver ? " [+Supir]" : "") + (bookForm.pickup ? " [Antar: " + bookForm.pickup + "]" : "")).trim(),
      ktp_url: ktpUrl,
      sim_url: simUrl,
    });

    if (error) {
      setBookError("Gagal: " + error.message);
   } else {
  // update total_rent customer
  const { data: currentCustomer } = await supabase
    .from("customers")
    .select("total_rent")
    .eq("id", user.id)
    .single();

  await supabase
    .from("customers")
    .update({ total_rent: (currentCustomer?.total_rent ?? 0) + 1 })
    .eq("id", user.id);

  // ambil rental milik user ini saja
  const { data: r } = await supabase
    .from("rentals")
    .select("*")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  if (r?.[0]) onBookSuccess(r[0]);
  setBookSuccess(true);
  setBookStep(4);
}
setBookLoading(false);
    setBookLoading(false);
  };

  // ── Success screen ────────────────────────────────────────
  if (bookStep === 4 && bookSuccess) {
  return (
    <div>
      <PageHeader title="Booking Kendaraan" subtitle="Isi formulir booking dengan lengkap" />
      <StepIndicator current={4} onStepClick={handleStepClick} />
      <div style={{ background: CARD_BG, borderRadius: 16, border: `0.5px solid ${CARD_BORDER}`, padding: "48px 32px", textAlign: "center" }}>

        {/* Icon animasi menunggu */}
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(245,158,11,0.12)", border: "2px solid rgba(245,158,11,0.4)", color: "#fbbf24", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 36 }}>
          ⏳
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 800, color: TEXT_PRIMARY, marginBottom: 8 }}>
          Booking Berhasil Dikirim!
        </h2>
        <p style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 28 }}>
          Dokumen identitas Anda telah tersimpan. Tunggu konfirmasi dari admin.
        </p>

        {/* Progress tracker */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, margin: "0 auto 28px", maxWidth: 420 }}>
          <TrackerStep icon="✓"  label="Booking Dibuat"    active done />
          <div style={{ flex: 1, height: 2, background: "rgba(245,158,11,0.4)", position: "relative", top: -14 }} />
          <TrackerStep icon="⏳" label="Konfirmasi Admin"  active pulse />
          <div style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.06)", position: "relative", top: -14 }} />
          <TrackerStep icon="💳" label="Pembayaran" />
          <div style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.06)", position: "relative", top: -14 }} />
          <TrackerStep icon="🚗" label="Sewa Aktif" />
        </div>

        {/* Status info box */}
        <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 12, padding: "18px 22px", marginBottom: 28, textAlign: "left", lineHeight: 1.7 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#fbbf24", marginBottom: 8 }}>⏳ Status: Menunggu Konfirmasi Admin</p>
          <p style={{ fontSize: 13, color: "#fbbf24", opacity: 0.85 }}>
            Admin akan memverifikasi booking dan dokumen Anda dalam maks. <strong>1×24 jam</strong>.
          </p>
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(245,158,11,0.2)" }}>
            <p style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 4 }}>Setelah dikonfirmasi, Anda akan bisa:</p>
            <p style={{ fontSize: 12, color: "#94a3b8" }}>✓ Melanjutkan pembayaran</p>
            <p style={{ fontSize: 12, color: "#94a3b8" }}>✓ Melihat detail kendaraan yang disewa</p>
          </div>
        </div>

        {/* Info jika ditolak */}
        <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "14px 18px", marginBottom: 28, textAlign: "left" }}>
          <p style={{ fontSize: 12, color: "#f87171", lineHeight: 1.6 }}>
            ❌ <strong>Jika booking ditolak</strong>, status akan berubah menjadi <strong>Dibatalkan</strong> dan Anda dapat melakukan booking ulang dengan kendaraan lain.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={resetBooking}            style={btnSecondary}>Booking Lagi</button>
          <button onClick={() => onNavigate("riwayat")} style={btnPrimary}>Cek Status Booking</button>
        </div>
      </div>
    </div>
  );
}

  // ── Main layout ───────────────────────────────────────────
  return (
    <div>
      <PageHeader title="Booking Kendaraan" subtitle="Isi formulir booking dengan lengkap" />
      <StepIndicator current={bookStep} onStepClick={handleStepClick} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 18 }}>

        {/* ── STEP 1: Data Diri & Dokumen ──────────────────── */}
        {bookStep === 1 && (
          <div style={{ background: CARD_BG, borderRadius: 14, border: `0.5px solid ${CARD_BORDER}`, overflow: "hidden" }}>
            <SectionHeader title="Data Diri & Dokumen Identitas" />
            <div style={{ padding: 22 }}>

              {/* Info banner */}
              <div style={{ background: "rgba(59,130,246,0.08)", border: "0.5px solid rgba(59,130,246,0.25)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 12, color: "#93c5fd", display: "flex", gap: 8 }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>ℹ️</span>
                <span>Data diri dan dokumen diperlukan untuk verifikasi identitas penyewa. Informasi Anda disimpan secara aman dan hanya digunakan untuk keperluan sewa.</span>
              </div>

              {/* Name & NIK */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={lStyle}>Nama Lengkap (sesuai KTP) <Req /></label>
                  <input type="text" placeholder="Nama sesuai KTP" value={identityForm.fullName}
                    onChange={(e) => setIdentityForm((p) => ({ ...p, fullName: e.target.value }))} style={iStyle} />
                </div>
                <div>
                  <label style={lStyle}>NIK (16 digit) <Req /></label>
                  <input type="text" maxLength={16} placeholder="3271XXXXXXXXXXXX" value={identityForm.nik}
                    onChange={(e) => setIdentityForm((p) => ({ ...p, nik: e.target.value.replace(/\D/g, "") }))} style={iStyle} />
                  <span style={{ fontSize: 11, color: TEXT_MUTED }}>{identityForm.nik.length}/16 digit</span>
                </div>
              </div>

              {/* Phone & SIM number */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={lStyle}>No. HP Aktif <Req /></label>
                  <input type="tel" placeholder="08XXXXXXXXXX" value={identityForm.phone}
                    onChange={(e) => setIdentityForm((p) => ({ ...p, phone: e.target.value }))} style={iStyle} />
                </div>
                <div>
                  <label style={lStyle}>Nomor SIM <Req /></label>
                  <input type="text" placeholder="Nomor pada SIM Anda" value={identityForm.simNumber}
                    onChange={(e) => setIdentityForm((p) => ({ ...p, simNumber: e.target.value }))} style={iStyle} />
                </div>
              </div>

              {/* Address */}
              <div style={{ marginBottom: 20 }}>
                <label style={lStyle}>Alamat Sesuai KTP <Req /></label>
                <textarea rows={2} placeholder="Jl. Contoh No. 1, Kota, Provinsi"
                  value={identityForm.address}
                  onChange={(e) => setIdentityForm((p) => ({ ...p, address: e.target.value }))}
                  style={{ ...iStyle, resize: "vertical" }} />
              </div>

              {/* Divider */}
              <div style={{ borderTop: `0.5px solid ${CARD_BORDER}`, marginBottom: 20 }} />

              {/* Document uploads */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
  <DocUpload
    label="Foto KTP"
    required
    hint="JPG/PNG, maks 5MB. Pastikan semua tulisan terbaca jelas."
    preview={identityForm.ktpPreview}
    icon="🪪"
    inputRef={ktpRef as React.RefObject<HTMLInputElement>}
    onPick={(f) => handleFilePick("ktp", f)}
    onClear={() =>
      setIdentityForm((p) => ({
        ...p,
        ktpFile: null,
        ktpPreview: "",
      }))
    }
  />

  <DocUpload
    label="Foto SIM"
    required
    hint="SIM A atau C yang masih berlaku."
    preview={identityForm.simPreview}
    icon="🚗"
    inputRef={simRef as React.RefObject<HTMLInputElement>}
    onPick={(f) => handleFilePick("sim", f)}
    onClear={() =>
      setIdentityForm((p) => ({
        ...p,
        simFile: null,
        simPreview: "",
      }))
    }
  />
</div>
              {bookError && <ErrorBox msg={bookError} />}

              <button
                onClick={() => {
                  const err = validateIdentity();
                  if (err) { setBookError(err); return; }
                  setBookError("");
                  setBookStep(2);
                }}
                style={{ ...btnPrimary, width: "100%", padding: 12 }}
              >
                Lanjut → Pilih Kendaraan
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Pilih Kendaraan ──────────────────────── */}
        {bookStep === 2 && (
          <div style={{ background: CARD_BG, borderRadius: 14, border: `0.5px solid ${CARD_BORDER}`, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: `0.5px solid ${CARD_BORDER}`, display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => setBookStep(1)} style={btnBack}>← Kembali</button>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>Pilih Kendaraan</h2>
            </div>
            <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 12 }}>
              {vehicles.map((v) => {
                const sel = selectedVehicle?.id === v.id;
                const unavail = v.status !== "Tersedia";
                return (
                  <div key={v.id} onClick={() => !unavail && setSelectedVehicle(v)}
                    style={{ background: sel ? "rgba(245,158,11,0.1)" : "#0f1724", border: `1.5px solid ${sel ? ACCENT : CARD_BORDER}`, borderRadius: 12, overflow: "hidden", cursor: unavail ? "not-allowed" : "pointer", opacity: unavail ? 0.5 : 1, transform: sel ? "scale(1.02)" : "scale(1)", transition: "all 0.15s" }}>
                    <div style={{ height: 120, position: "relative", overflow: "hidden" }}>
                      <VehicleImg vehicle={v} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div style={{ position: "absolute", top: 8, right: 8 }}><Badge status={v.status} /></div>
                      {sel && <div style={{ position: "absolute", top: 8, left: 8, background: ACCENT, color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20 }}>✓ Dipilih</div>}
                    </div>
                    <div style={{ padding: "10px 12px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 2 }}>{v.name}</div>
                      <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 6 }}>{v.plate} · {v.transmission ?? "-"}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: ACCENT }}>{fmt(v.rate)}<span style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 400 }}>/hari</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: "14px 18px", borderTop: `0.5px solid ${CARD_BORDER}` }}>
              <button
                onClick={() => {
                  if (!selectedVehicle) { setBookError("Pilih kendaraan dulu."); return; }
                  setBookError("");
                  setBookStep(3);
                }}
                style={{ ...btnPrimary, width: "100%", padding: 12 }}
              >
                Lanjut → Isi Detail
              </button>
              {bookError && <p style={{ fontSize: 12, color: "#f87171", marginTop: 8, textAlign: "center" }}>{bookError}</p>}
            </div>
          </div>
        )}

        {/* ── STEP 3: Detail Booking ────────────────────────── */}
        {bookStep === 3 && (
          <div style={{ background: CARD_BG, borderRadius: 14, border: `0.5px solid ${CARD_BORDER}`, padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <button onClick={() => setBookStep(2)} style={btnBack}>← Kembali</button>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>Isi Detail Booking</h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              {[{ l: "Tanggal Mulai", k: "start" }, { l: "Tanggal Selesai", k: "end" }].map((f) => (
                <div key={f.k}>
                  <label style={lStyle}>{f.l}</label>
                  <input type="date" value={(bookForm as any)[f.k]}
                    onChange={(e) => { setBookForm((p: BookForm) => ({ ...p, [f.k]: e.target.value })); setBookError(""); }}
                    style={iStyle} />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lStyle}>Layanan Tambahan</label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, background: "#0f1724", border: `1px solid ${bookForm.withDriver ? ACCENT : CARD_BORDER}`, borderRadius: 9, padding: "10px 14px", cursor: "pointer", fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY }}>
                <input type="checkbox" checked={bookForm.withDriver}
                  onChange={(e) => setBookForm((p: BookForm) => ({ ...p, withDriver: e.target.checked }))}
                  style={{ accentColor: ACCENT }} />
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Icons.UserNav /> Dengan Supir</span>
                <span style={{ color: TEXT_MUTED, fontSize: 12 }}>(+Rp 150k/hr)</span>
              </label>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lStyle}>Alamat Penjemputan (opsional)</label>
              <input type="text" placeholder="Kosongkan jika ambil di kantor" value={bookForm.pickup}
                onChange={(e) => setBookForm((p: BookForm) => ({ ...p, pickup: e.target.value }))} style={iStyle} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={lStyle}>Catatan Tambahan</label>
              <textarea value={bookForm.notes} onChange={(e) => setBookForm((p: BookForm) => ({ ...p, notes: e.target.value }))}
                rows={3} placeholder="Keperluan khusus, dll…" style={{ ...iStyle, resize: "vertical" }} />
            </div>

            {bookError && <ErrorBox msg={bookError} />}

            <button onClick={handleBook} disabled={bookLoading}
              style={{ ...btnPrimary, width: "100%", padding: 12, opacity: bookLoading ? 0.7 : 1, cursor: bookLoading ? "not-allowed" : "pointer" }}>
              {bookLoading ? "Memproses…" : "Konfirmasi Booking"}
            </button>
          </div>
        )}

        {/* Booking summary sidebar */}
        <BookingSummary vehicle={selectedVehicle} bookForm={bookForm} identity={identityForm} step={bookStep} />
      </div>
    </div>
  );
}

// ─── DocUpload component ──────────────────────────────────────
function DocUpload({ label, required, hint, preview, icon, inputRef, onPick, onClear }: {
  label: string; required?: boolean; hint: string; preview: string; icon: string;
  inputRef: React.RefObject<HTMLInputElement>;
  onPick: (f: File) => void; onClear: () => void;
}) {
  return (
    <div>
      <label style={{ ...lStyle, marginBottom: 6 }}>{label} {required && <Req />}</label>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); }} />
      {preview ? (
        <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: `1.5px solid rgba(34,197,94,0.4)` }}>
          <img src={preview} alt={label} style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, opacity: 0, transition: "opacity 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0"; }}>
            <button onClick={() => inputRef.current?.click()} style={{ ...btnSecondary, fontSize: 12, padding: "6px 14px" }}>Ganti</button>
            <button onClick={onClear} style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "#f87171", cursor: "pointer", fontFamily: "inherit" }}>Hapus</button>
          </div>
          <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(34,197,94,0.9)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: "#fff" }}>✓ Terupload</div>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()}
          style={{ width: "100%", height: 130, background: "#0f1724", border: `1.5px dashed ${CARD_BORDER}`, borderRadius: 10, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, transition: "border-color 0.15s", fontFamily: "inherit" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = ACCENT; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = CARD_BORDER; }}>
          <span style={{ fontSize: 28 }}>{icon}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY }}>Upload {label}</span>
          <span style={{ fontSize: 11, color: TEXT_MUTED }}>Klik untuk pilih file</span>
        </button>
      )}
      <p style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 5, lineHeight: 1.4 }}>{hint}</p>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────
function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: TEXT_PRIMARY, marginBottom: 4 }}>{title}</h1>
      <p style={{ fontSize: 13, color: TEXT_MUTED }}>{subtitle}</p>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ padding: "14px 18px", borderBottom: `0.5px solid ${CARD_BORDER}` }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>{title}</h2>
    </div>
  );
}

// ─── StepIndicator (clickable) ─────────────────────────────────
function StepIndicator({ current, onStepClick }: { current: number; onStepClick?: (n: 1 | 2 | 3 | 4) => void }) {
  const steps = [
    { n: 1, l: "Data Diri" },
    { n: 2, l: "Pilih Kendaraan" },
    { n: 3, l: "Detail Booking" },
    { n: 4, l: "Selesai" },
  ];
  return (
    <div style={{ display: "flex", gap: 0, marginBottom: 24, background: CARD_BG, borderRadius: 12, border: `0.5px solid ${CARD_BORDER}`, overflow: "hidden" }}>
      {steps.map((s, i) => {
        // Step 4 ("Selesai") tidak boleh diklik manual — hanya dicapai lewat submit booking sukses.
        // Step yang sedang aktif juga tidak perlu diklik.
        const clickable = s.n !== 4 && s.n !== current;
        return (
          <div
            key={s.n}
            onClick={() => clickable && onStepClick?.(s.n as 1 | 2 | 3 | 4)}
            style={{
              flex: 1,
              padding: "12px 10px",
              textAlign: "center",
              background: current === s.n ? ACCENT : current > s.n ? "rgba(245,158,11,0.1)" : CARD_BG,
              borderRight: i < 3 ? `0.5px solid ${CARD_BORDER}` : "none",
              cursor: clickable ? "pointer" : "default",
              transition: "background 0.15s",
              userSelect: "none",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: current === s.n ? "#fff" : current > s.n ? ACCENT : TEXT_MUTED }}>
              {current > s.n ? "✓ " : `${s.n}. `}{s.l}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TrackerStep({ icon, label, active = false, done = false, pulse = false }: { icon: string; label: string; active?: boolean; done?: boolean; pulse?: boolean }) {
  const bg = done ? "rgba(34,197,94,0.15)" : active ? "rgba(245,158,11,0.15)" : "#1a2540";
  const border = done ? "2px solid #4ade80" : active ? "2px solid rgba(245,158,11,0.5)" : "2px solid rgba(255,255,255,0.1)";
  const color = done ? "#4ade80" : active ? ACCENT : TEXT_MUTED;
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: bg, border, color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, margin: "0 auto 8px", ...(pulse ? { animation: "pulse 1.5s ease-in-out infinite" } : {}) }}>
        {icon}
      </div>
      <div style={{ fontSize: 11, fontWeight: done || active ? 700 : 600, color }}>{label}</div>
    </div>
  );
}

function BookingSummary({ vehicle, bookForm, identity, step }: {
  vehicle: Vehicle | null; bookForm: BookForm;
  identity: IdentityForm; step: number;
}) {
  return (
    <div style={{ background: CARD_BG, borderRadius: 14, border: `0.5px solid ${CARD_BORDER}`, overflow: "hidden", position: "sticky", top: 70 }}>
      <div style={{ padding: "14px 18px", borderBottom: `0.5px solid ${CARD_BORDER}` }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>Ringkasan</h3>
      </div>
      <div style={{ padding: 18 }}>

        {/* Identity summary (shown from step 2+) */}
        {step >= 2 && identity.fullName && (
          <div style={{ background: "#0f1724", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Data Penyewa</div>
            <Row label="Nama" value={identity.fullName} />
            <Row label="NIK" value={identity.nik || "-"} />
            <Row label="No. HP" value={identity.phone || "-"} />
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <DocBadge label="KTP" ready={!!identity.ktpFile} />
              <DocBadge label="SIM" ready={!!identity.simFile} />
            </div>
          </div>
        )}

        {/* Vehicle */}
        {vehicle ? (
          <>
            <VehicleImg vehicle={vehicle} style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 10, marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 800, color: TEXT_PRIMARY, marginBottom: 2 }}>{vehicle.name}</div>
            <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 12 }}>{vehicle.plate} · {vehicle.transmission ?? "-"}</div>
          </>
        ) : (
          <div style={{ background: "#0f1724", borderRadius: 10, padding: 20, textAlign: "center", color: TEXT_MUTED, fontSize: 12, marginBottom: 12 }}>
            {step === 1 ? "Lengkapi data diri dulu" : "← Pilih kendaraan"}
          </div>
        )}

        {/* Price breakdown */}
        {bookForm.start && bookForm.end && bookForm.end > bookForm.start && vehicle && (() => {
          const days = diffDays(bookForm.start, bookForm.end);
          const driverFee = bookForm.withDriver ? days * 150000 : 0;
          const total = days * vehicle.rate + driverFee;
          return (
            <div style={{ background: "#0f1724", borderRadius: 10, padding: 14 }}>
              <Row label={`Sewa ${days} hari`} value={fmt(days * vehicle.rate)} />
              {bookForm.withDriver && <Row label={`Supir ${days} hari`} value={fmt(driverFee)} />}
              <div style={{ borderTop: `0.5px solid ${CARD_BORDER}`, marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>Total</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: ACCENT }}>{fmt(total)}</span>
              </div>
            </div>
          );
        })()}

        <div style={{ marginTop: 14, padding: "12px 14px", background: "rgba(245,158,11,0.08)", border: "0.5px solid rgba(245,158,11,0.2)", borderRadius: 9, fontSize: 12, color: "#fbbf24", display: "flex", alignItems: "flex-start", gap: 8 }}>
          <span style={{ flexShrink: 0, marginTop: 1 }}><Icons.Info /></span>
          Booking berstatus <strong style={{ marginLeft: 3 }}>Pending</strong> hingga dikonfirmasi admin (maks. 1×24 jam)
        </div>
      </div>
    </div>
  );
}

function DocBadge({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, background: ready ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)", border: `0.5px solid ${ready ? "rgba(34,197,94,0.3)" : CARD_BORDER}`, borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 600, color: ready ? "#4ade80" : TEXT_MUTED }}>
      {ready ? "✓" : "○"} {label}
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{ background: "rgba(239,68,68,0.1)", borderRadius: 8, padding: "10px 12px", marginBottom: 14, fontSize: 13, color: "#f87171" }}>{msg}</div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
      <span style={{ fontSize: 11, color: TEXT_MUTED }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY, maxWidth: 160, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
    </div>
  );
}

function Req() {
  return <span style={{ color: "#f87171", marginLeft: 2 }}>*</span>;
}

// ─── Button styles ────────────────────────────────────────────
const btnPrimary: React.CSSProperties = {
  padding: "10px 24px", borderRadius: 9, border: "none", background: ACCENT,
  color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
};
const btnSecondary: React.CSSProperties = {
  padding: "10px 24px", borderRadius: 9, border: `0.5px solid ${CARD_BORDER}`,
  background: "#1a2540", color: TEXT_PRIMARY, fontSize: 14, fontWeight: 700,
  cursor: "pointer", fontFamily: "inherit",
};
const btnBack: React.CSSProperties = {
  background: "none", border: `0.5px solid ${CARD_BORDER}`, borderRadius: 8,
  padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", color: TEXT_MUTED,
};