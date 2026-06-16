"use client";
// components/Pengaturan.tsx

import { useState, useEffect } from "react";
import { PageHeader, Field, Input, Select, Btn, SuccessToast } from "./ui";
import { Icons } from "./icons";
import { supabase } from "@/lib/supabase/client"; // adjust path as needed

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProfileData {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  npwp: string;
}

interface AdminData {
  name: string;
  email: string;
  password: string;
  confirm: string;
}

interface PolicyData {
  rateMethod: string;
  lateFee: string;
  minDP: string;
  deposit: string;
}

interface Settings {
  id?: string;
  profile: ProfileData;
  policy: PolicyData;
}

// ─── Profile View Card ─────────────────────────────────────────────────────────
function ProfileViewCard({
  profile,
  policy,
  onEdit,
}: {
  profile: ProfileData;
  policy: PolicyData;
  onEdit: () => void;
}) {
  const initials = profile.businessName
    ? profile.businessName.slice(0, 2).toUpperCase()
    : "??";

  const infoRows: { label: string; value: string }[] = [
    { label: "Nama Pemilik", value: profile.ownerName || "—" },
    { label: "Nomor Telepon", value: profile.phone || "—" },
    { label: "Email Usaha", value: profile.email || "—" },
    { label: "Alamat", value: profile.address || "—" },
    { label: "NPWP", value: profile.npwp || "—" },
  ];

  const policyRows: { label: string; value: string }[] = [
    { label: "Metode Tarif", value: policy.rateMethod },
    { label: "Tarif Keterlambatan", value: policy.lateFee },
    { label: "Minimum DP", value: policy.minDP },
    { label: "Deposit Jaminan", value: policy.deposit },
  ];

  return (
    <div style={{ maxWidth: "640px" }}>
      {/* Business card header */}
      <div
        style={{
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: "16px",
          padding: "28px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "20px",
            marginBottom: "24px",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              fontWeight: 700,
              color: "#0f0f0f",
              flexShrink: 0,
              letterSpacing: "-0.5px",
            }}
          >
            {initials}
          </div>
          {/* Business name & badge */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#f1f5f9",
                margin: 0,
                marginBottom: "6px",
                wordBreak: "break-word",
              }}
            >
              {profile.businessName || "Nama Usaha Belum Diisi"}
            </h2>
            <span
              style={{
                display: "inline-block",
                background: "#1e293b",
                color: "#f59e0b",
                fontSize: "11px",
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: "20px",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Profil Aktif
            </span>
          </div>
          {/* Edit button */}
          <button
            onClick={onEdit}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              background: "transparent",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#94a3b8",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              flexShrink: 0,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "#f59e0b";
              (e.currentTarget as HTMLButtonElement).style.color = "#f59e0b";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "#334155";
              (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="m18.5 2.5 2.121 2.121L10 15H8v-2z" />
            </svg>
            Edit
          </button>
        </div>

        {/* Info rows */}
        <div
          style={{
            borderTop: "1px solid #1e293b",
            paddingTop: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {infoRows.map((row) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "16px",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  color: "#64748b",
                  flexShrink: 0,
                  minWidth: "120px",
                }}
              >
                {row.label}
              </span>
              <span
                style={{
                  fontSize: "13px",
                  color: "#e2e8f0",
                  textAlign: "right",
                  wordBreak: "break-word",
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Policy summary card */}
      <div
        style={{
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: "14px",
          padding: "20px 28px",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#64748b",
            margin: "0 0 14px",
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          Kebijakan Sewa
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px 32px",
          }}
        >
          {policyRows.map((row) => (
            <div key={row.label}>
              <p
                style={{
                  fontSize: "11px",
                  color: "#64748b",
                  margin: "0 0 2px",
                }}
              >
                {row.label}
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "#f1f5f9",
                  margin: 0,
                  fontWeight: 600,
                }}
              >
                {row.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Pengaturan() {
  const [tab, setTab] = useState<"profil" | "akun" | "kebijakan">("profil");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState(false); // NEW: profile view mode
  const [settingsId, setSettingsId] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileData>({
    businessName: "",
    ownerName: "",
    phone: "",
    email: "",
    address: "",
    npwp: "",
  });

  const [admin, setAdmin] = useState<AdminData>({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [policy, setPolicy] = useState<PolicyData>({
    rateMethod: "Per hari kalender",
    lateFee: "1x tarif sewa/hari",
    minDP: "50% dari total biaya",
    deposit: "Rp 500.000",
  });

  // ── Load settings on mount ──────────────────────────────────────────────────
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettingsId(data.id);
        if (data.profile) setProfile(data.profile);
        if (data.policy) setPolicy(data.policy);
        // If profile has been filled before, show view mode
        if (data.profile?.businessName) setViewMode(true);
      }
    } catch (err) {
      // Table might not exist yet — fail silently and stay in edit mode
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Save handler ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setError("");

    // Validate admin tab if password fields are filled
    if (tab === "akun" && admin.password && admin.password !== admin.confirm) {
      setError("Password dan konfirmasi password tidak cocok.");
      return;
    }

    setSaving(true);
    try {
      const payload = { profile, policy, updated_at: new Date().toISOString() };

      if (settingsId) {
        // Update existing row
        const { error } = await supabase
          .from("settings")
          .update(payload)
          .eq("id", settingsId);
        if (error) throw error;
      } else {
        // Insert new row
        const { data, error } = await supabase
          .from("settings")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        if (data) setSettingsId(data.id);
      }

      // Handle admin password change separately via Supabase Auth
      if (admin.password && admin.password === admin.confirm) {
        const { error: authError } = await supabase.auth.updateUser({
          password: admin.password,
          email: admin.email || undefined,
        });
        if (authError) throw authError;
        setAdmin((a) => ({ ...a, password: "", confirm: "" }));
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);

      // Switch to view mode after saving profil tab
      if (tab === "profil" && profile.businessName) {
        setTimeout(() => setViewMode(true), 600);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal menyimpan. Coba lagi.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <PageHeader title="Pengaturan" sub="Kelola profil usaha dan akun admin." />
        <div
          style={{
            color: "#64748b",
            fontSize: "14px",
            marginTop: "40px",
          }}
        >
          Memuat pengaturan...
        </div>
      </div>
    );
  }

  // ── Profile view mode ───────────────────────────────────────────────────────
  if (viewMode) {
    return (
      <div>
        <PageHeader title="Pengaturan" sub="Kelola profil usaha dan akun admin." />
        <SuccessToast msg={saved ? "Pengaturan berhasil disimpan!" : ""} />
        <ProfileViewCard
          profile={profile}
          policy={policy}
          onEdit={() => setViewMode(false)}
        />
      </div>
    );
  }

  // ── Edit mode ───────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader title="Pengaturan" sub="Kelola profil usaha dan akun admin." />
      <SuccessToast msg={saved ? "Pengaturan berhasil disimpan!" : ""} />

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: "10px",
          padding: "4px",
          marginBottom: "24px",
          width: "fit-content",
        }}
      >
        {(["profil", "akun", "kebijakan"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 18px",
              borderRadius: "7px",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              background: tab === t ? "#f59e0b" : "transparent",
              color: tab === t ? "#0f0f0f" : "#64748b",
              fontFamily: "inherit",
              transition: "all 0.15s",
              textTransform: "capitalize",
            }}
          >
            {t === "profil"
              ? "Profil Usaha"
              : t === "akun"
              ? "Akun Admin"
              : "Kebijakan Sewa"}
          </button>
        ))}
      </div>

      <div
        style={{
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: "14px",
          padding: "28px",
          maxWidth: "600px",
        }}
      >
        {/* ── Profil Tab ── */}
        {tab === "profil" && (
          <div>
            <h2
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#f1f5f9",
                marginBottom: "20px",
              }}
            >
              Informasi Usaha
            </h2>
            <Field label="Nama Usaha" required>
              <Input
                value={profile.businessName}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, businessName: e.target.value }))
                }
                placeholder="CV. Maju Jaya Rental"
              />
            </Field>
            <Field label="Nama Pemilik" required>
              <Input
                value={profile.ownerName}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, ownerName: e.target.value }))
                }
                placeholder="Hendra Setiawan"
              />
            </Field>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0 16px",
              }}
            >
              <Field label="Nomor Telepon">
                <Input
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, phone: e.target.value }))
                  }
                  placeholder="081299887766"
                />
              </Field>
              <Field label="Email Usaha">
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="info@rental.com"
                />
              </Field>
            </div>
            <Field label="Alamat Usaha">
              <Input
                value={profile.address}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, address: e.target.value }))
                }
                placeholder="Jl. Raya No.100, Jakarta"
              />
            </Field>
            <Field label="NPWP">
              <Input
                value={profile.npwp}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, npwp: e.target.value }))
                }
                placeholder="12.345.678.9-012.000"
              />
            </Field>
          </div>
        )}

        {/* ── Akun Tab ── */}
        {tab === "akun" && (
          <div>
            <h2
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#f1f5f9",
                marginBottom: "20px",
              }}
            >
              Manajemen Akun Admin
            </h2>
            <Field label="Nama Admin">
              <Input
                value={admin.name}
                onChange={(e) =>
                  setAdmin((a) => ({ ...a, name: e.target.value }))
                }
                placeholder="Admin Utama"
              />
            </Field>
            <Field label="Email Admin">
              <Input
                type="email"
                value={admin.email}
                onChange={(e) =>
                  setAdmin((a) => ({ ...a, email: e.target.value }))
                }
                placeholder="admin@rental.com"
              />
            </Field>
            <Field label="Password Baru">
              <Input
                type="password"
                value={admin.password}
                onChange={(e) =>
                  setAdmin((a) => ({ ...a, password: e.target.value }))
                }
                placeholder="Kosongkan jika tidak ingin mengubah"
              />
            </Field>
            <Field label="Konfirmasi Password">
              <Input
                type="password"
                value={admin.confirm}
                onChange={(e) =>
                  setAdmin((a) => ({ ...a, confirm: e.target.value }))
                }
                placeholder="Ulangi password baru"
              />
            </Field>
            {/* Password mismatch warning */}
            {admin.password &&
              admin.confirm &&
              admin.password !== admin.confirm && (
                <p
                  style={{
                    fontSize: "13px",
                    color: "#f87171",
                    marginTop: "-8px",
                    marginBottom: "12px",
                  }}
                >
                  Password tidak cocok.
                </p>
              )}
          </div>
        )}

        {/* ── Kebijakan Tab ── */}
        {tab === "kebijakan" && (
          <div>
            <h2
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#f1f5f9",
                marginBottom: "20px",
              }}
            >
              Kebijakan Penyewaan
            </h2>
            <Field label="Metode Perhitungan Tarif">
              <Select
                value={policy.rateMethod}
                onChange={(e) =>
                  setPolicy((p) => ({ ...p, rateMethod: e.target.value }))
                }
              >
                <option>Per hari kalender</option>
                <option>Per 24 jam</option>
              </Select>
            </Field>
            <Field label="Tarif Keterlambatan">
              <Select
                value={policy.lateFee}
                onChange={(e) =>
                  setPolicy((p) => ({ ...p, lateFee: e.target.value }))
                }
              >
                <option>1x tarif sewa/hari</option>
                <option>1.5x tarif sewa/hari</option>
                <option>2x tarif sewa/hari</option>
                <option>Flat Rp 100.000/hari</option>
              </Select>
            </Field>
            <Field label="Minimum Uang Muka (DP)">
              <Select
                value={policy.minDP}
                onChange={(e) =>
                  setPolicy((p) => ({ ...p, minDP: e.target.value }))
                }
              >
                <option>50% dari total biaya</option>
                <option>30% dari total biaya</option>
                <option>Tidak wajib DP</option>
              </Select>
            </Field>
            <Field label="Deposit Jaminan">
              <Select
                value={policy.deposit}
                onChange={(e) =>
                  setPolicy((p) => ({ ...p, deposit: e.target.value }))
                }
              >
                <option>Rp 500.000</option>
                <option>Rp 1.000.000</option>
                <option>Tanpa deposit</option>
              </Select>
            </Field>
          </div>
        )}

        {/* Error message */}
        {error && (
          <p
            style={{
              fontSize: "13px",
              color: "#f87171",
              marginTop: "8px",
              padding: "10px 14px",
              background: "rgba(248,113,113,0.08)",
              borderRadius: "8px",
              border: "1px solid rgba(248,113,113,0.2)",
            }}
          >
            {error}
          </p>
        )}

        {/* Action buttons */}
        <div
          style={{
            marginTop: "24px",
            paddingTop: "20px",
            borderTop: "1px solid #1e293b",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <Btn onClick={handleSave} icon={<Icons.save />} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </Btn>

          {/* View profile shortcut — only visible if data already exists */}
          {settingsId && profile.businessName && (
            <button
              onClick={() => setViewMode(true)}
              style={{
                padding: "8px 16px",
                background: "transparent",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#64748b",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#f1f5f9";
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "#64748b";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#64748b";
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "#334155";
              }}
            >
              Lihat Profil
            </button>
          )}
        </div>
      </div>
    </div>
  );
}