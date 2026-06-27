"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Rental, ProfilState } from "types/types";
import {
  ACCENT, CARD_BG, CARD_BORDER, TEXT_PRIMARY, TEXT_MUTED,
  lStyle, iStyle,
} from "@/lib/constants";
import { fmt } from "@/lib/utils";
import { Icons } from "@/app/portal/components/icons";
import { Badge } from "@/app/portal/components/ui";

interface Props {
  user: any;
  profil: ProfilState;
  setProfil: (p: ProfilState) => void;
  rentals: Rental[];
}

export default function ProfilPage({ user, profil, setProfil, rentals }: Props) {
  const [form, setForm] = useState<ProfilState>({ ...profil });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const totalSewa = rentals.length;
  const totalBayar = rentals.filter((r) => r.payment_status === "Lunas").reduce((s, r) => s + (r.total_cost ?? 0), 0);
  const aktif = rentals.filter((r) => r.status === "Aktif").length;

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const { error: err } = await supabase.from("customers").upsert({
      id: user.id,
      name: form.name,
      phone: form.phone,
      address: form.address,
      email: user.email,
    });
    if (err) {
      setError("Gagal menyimpan: " + err.message);
    } else {
      setProfil(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  const initial = (form.name || user?.email || "?")[0].toUpperCase();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: TEXT_PRIMARY, marginBottom: 4 }}>Profil Saya</h1>
        <p style={{ fontSize: 13, color: TEXT_MUTED }}>Kelola informasi pribadi dan lihat statistik akun Anda.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18 }}>
        {/* Edit form */}
        <div style={{ background: CARD_BG, borderRadius: 14, border: `0.5px solid ${CARD_BORDER}`, padding: 24 }}>
          {/* Avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
              {initial}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: TEXT_PRIMARY }}>{form.name || "Pelanggan"}</div>
              <div style={{ fontSize: 13, color: TEXT_MUTED }}>{user?.email}</div>
              <div style={{ fontSize: 11, color: ACCENT, marginTop: 2, fontWeight: 600 }}>Pelanggan Aktif</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { l: "Nama Lengkap", k: "name", placeholder: "Masukkan nama lengkap" },
              { l: "No. Telepon", k: "phone", placeholder: "08xx-xxxx-xxxx" },
              { l: "NIK", k: "nik", placeholder: "16 digit NIK" },
              { l: "Kontak Darurat", k: "emergency", placeholder: "No. HP darurat" },
            ].map((f) => (
              <div key={f.k}>
                <label style={lStyle}>{f.l}</label>
                <input
                  type="text"
                  placeholder={f.placeholder}
                  value={(form as any)[f.k]}
                  onChange={(e) => setForm((p) => ({ ...p, [f.k]: e.target.value }))}
                  style={iStyle}
                />
              </div>
            ))}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lStyle}>Alamat</label>
              <textarea
                placeholder="Alamat lengkap"
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                rows={3}
                style={{ ...iStyle, resize: "vertical" }}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lStyle}>Email</label>
              <input type="text" value={user?.email ?? ""} disabled style={{ ...iStyle, opacity: 0.5, cursor: "not-allowed" }} />
            </div>
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", borderRadius: 8, padding: "10px 14px", marginTop: 14, fontSize: 13, color: "#f87171" }}>{error}</div>
          )}

          {saved && (
            <div style={{ background: "rgba(34,197,94,0.1)", borderRadius: 8, padding: "10px 14px", marginTop: 14, fontSize: 13, color: "#4ade80", display: "flex", alignItems: "center", gap: 8 }}>
              <Icons.CheckCircle size={16} /> Profil berhasil disimpan!
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            style={{ marginTop: 20, background: ACCENT, color: "#fff", border: "none", borderRadius: 9, padding: "11px 28px", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, fontFamily: "inherit" }}
          >
            {saving ? "Menyimpan…" : "Simpan Perubahan"}
          </button>
        </div>

        {/* Stats sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Account stats */}
          <div style={{ background: CARD_BG, borderRadius: 14, border: `0.5px solid ${CARD_BORDER}`, padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 16 }}>Statistik Akun</h3>
            {[
              { label: "Total Pemesanan", value: totalSewa },
              { label: "Sewa Aktif", value: aktif },
              { label: "Total Pembayaran", value: fmt(totalBayar) },
            ].map((s) => (
              <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `0.5px solid ${CARD_BORDER}` }}>
                <span style={{ fontSize: 12, color: TEXT_MUTED }}>{s.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Contact info */}
          <div style={{ background: CARD_BG, borderRadius: 14, border: `0.5px solid ${CARD_BORDER}`, padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 16 }}>Kontak Kami</h3>
            {[
              { icon: <Icons.Phone size={14} />, text: "0812-6028-4230" },
              { icon: <Icons.Mail size={14} />, text: "info@walidrentcaraceh.online" },
              { icon: <Icons.MessageCircle size={14} />, text: "Live Chat (jam kerja)" },
            ].map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, fontSize: 12, color: TEXT_MUTED }}>
                <span style={{ color: ACCENT }}>{c.icon}</span>
                {c.text}
              </div>
            ))}
          </div>

          {/* Recent rentals */}
          <div style={{ background: CARD_BG, borderRadius: 14, border: `0.5px solid ${CARD_BORDER}`, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: `0.5px solid ${CARD_BORDER}` }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>Sewa Terakhir</h3>
            </div>
            {rentals.slice(0, 3).map((r) => (
              <div key={r.id} style={{ padding: "12px 18px", borderBottom: `0.5px solid ${CARD_BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_PRIMARY }}>{r.vehicle_name}</div>
                  <div style={{ fontSize: 11, color: TEXT_MUTED }}>{r.start_date}</div>
                </div>
                <Badge status={r.status} />
              </div>
            ))}
            {rentals.length === 0 && (
              <div style={{ padding: 20, textAlign: "center", fontSize: 12, color: TEXT_MUTED }}>Belum ada riwayat.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}