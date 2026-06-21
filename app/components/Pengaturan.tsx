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

// ─── Design tokens (premium dark) ──────────────────────────────────────────────
const palette = {
  bgPanel: "linear-gradient(165deg, #11151c 0%, #0a0d12 100%)",
  border: "#1f2530",
  borderSoft: "rgba(255,255,255,0.06)",
  gold: "#d4af6a",
  goldSoft: "rgba(212,175,106,0.12)",
  goldBorder: "rgba(212,175,106,0.35)",
  textPrimary: "#f3ede2",
  textMuted: "#8b8f99",
  textFaint: "#5b5f6a",
  danger: "#e08585",
};

const fadeIn: React.CSSProperties = {
  animation: "pengaturanFadeIn 0.35s ease both",
};

// One-time keyframes injection
function GlobalAnim() {
  return (
    <style>{`
      @keyframes pengaturanFadeIn {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes pengaturanShimmer {
        0% { background-position: -200px 0; }
        100% { background-position: 200px 0; }
      }
    `}</style>
  );
}

// ─── Section label (small caps, gold accent) ───────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "22px",
      }}
    >
      <span
        style={{
          width: "3px",
          height: "16px",
          borderRadius: "2px",
          background: `linear-gradient(180deg, ${palette.gold}, transparent)`,
        }}
      />
      <h2
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: palette.textPrimary,
          margin: 0,
          letterSpacing: "0.4px",
        }}
      >
        {children}
      </h2>
    </div>
  );
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
    <div style={{ maxWidth: "660px", ...fadeIn }}>
      <GlobalAnim />
      {/* Business card header */}
      <div
        style={{
          background: palette.bgPanel,
          border: `1px solid ${palette.border}`,
          borderRadius: "18px",
          padding: "32px",
          marginBottom: "18px",
          position: "relative",
          overflow: "hidden",
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.03) inset, 0 20px 40px -24px rgba(0,0,0,0.6)",
        }}
      >
        {/* subtle corner glow */}
        <div
          style={{
            position: "absolute",
            top: "-60px",
            right: "-60px",
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(212,175,106,0.10) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "20px",
            marginBottom: "26px",
            position: "relative",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "14px",
              background: `linear-gradient(135deg, ${palette.gold} 0%, #9c7a3f 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              fontWeight: 700,
              color: "#1a1208",
              flexShrink: 0,
              letterSpacing: "-0.5px",
              boxShadow: "0 8px 20px -8px rgba(212,175,106,0.5)",
            }}
          >
            {initials}
          </div>
          {/* Business name & badge */}
          <div style={{ flex: 1, minWidth: 0, paddingTop: "2px" }}>
            <h2
              style={{
                fontSize: "19px",
                fontWeight: 700,
                color: palette.textPrimary,
                margin: 0,
                marginBottom: "8px",
                wordBreak: "break-word",
                letterSpacing: "-0.2px",
              }}
            >
              {profile.businessName || "Nama Usaha Belum Diisi"}
            </h2>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: palette.goldSoft,
                color: palette.gold,
                fontSize: "10.5px",
                fontWeight: 600,
                padding: "4px 11px",
                borderRadius: "20px",
                letterSpacing: "0.6px",
                textTransform: "uppercase",
                border: `1px solid ${palette.goldBorder}`,
              }}
            >
              <span
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: palette.gold,
                }}
              />
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
              padding: "9px 16px",
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${palette.border}`,
              borderRadius: "9px",
              color: palette.textMuted,
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              flexShrink: 0,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                palette.goldBorder;
              (e.currentTarget as HTMLButtonElement).style.color =
                palette.gold;
              (e.currentTarget as HTMLButtonElement).style.background =
                palette.goldSoft;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                palette.border;
              (e.currentTarget as HTMLButtonElement).style.color =
                palette.textMuted;
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.02)";
            }}
          >
            <svg
              width="12"
              height="12"
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
            borderTop: `1px solid ${palette.borderSoft}`,
            paddingTop: "22px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            position: "relative",
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
                  fontSize: "12.5px",
                  color: palette.textFaint,
                  flexShrink: 0,
                  minWidth: "120px",
                  fontWeight: 500,
                }}
              >
                {row.label}
              </span>
              <span
                style={{
                  fontSize: "13px",
                  color: "#dcd6c9",
                  textAlign: "right",
                  wordBreak: "break-word",
                  fontWeight: 500,
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
          background: palette.bgPanel,
          border: `1px solid ${palette.border}`,
          borderRadius: "16px",
          padding: "24px 32px",
          boxShadow: "0 14px 30px -20px rgba(0,0,0,0.55)",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: palette.gold,
            margin: "0 0 16px",
            letterSpacing: "1.2px",
            textTransform: "uppercase",
          }}
        >
          Kebijakan Sewa
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px 32px",
          }}
        >
          {policyRows.map((row) => (
            <div key={row.label}>
              <p
                style={{
                  fontSize: "11px",
                  color: palette.textFaint,
                  margin: "0 0 4px",
                }}
              >
                {row.label}
              </p>
              <p
                style={{
                  fontSize: "13.5px",
                  color: palette.textPrimary,
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
        <GlobalAnim />
        <PageHeader title="Pengaturan" sub="Kelola profil usaha dan akun admin." />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: palette.textMuted,
            fontSize: "13.5px",
            marginTop: "40px",
            ...fadeIn,
          }}
        >
          <span
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              border: `2px solid ${palette.border}`,
              borderTopColor: palette.gold,
              display: "inline-block",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
  const tabMeta: { key: typeof tab; label: string }[] = [
    { key: "profil", label: "Profil Usaha" },
    { key: "akun", label: "Akun Admin" },
    { key: "kebijakan", label: "Kebijakan Sewa" },
  ];

  return (
    <div>
      <GlobalAnim />
      <PageHeader title="Pengaturan" sub="Kelola profil usaha dan akun admin." />
      <SuccessToast msg={saved ? "Pengaturan berhasil disimpan!" : ""} />

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          background: palette.bgPanel,
          border: `1px solid ${palette.border}`,
          borderRadius: "12px",
          padding: "5px",
          marginBottom: "26px",
          width: "fit-content",
          boxShadow: "0 10px 24px -18px rgba(0,0,0,0.6)",
        }}
      >
        {tabMeta.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: "9px 20px",
              borderRadius: "8px",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              background:
                tab === key
                  ? `linear-gradient(135deg, ${palette.gold}, #b8924f)`
                  : "transparent",
              color: tab === key ? "#1a1208" : palette.textMuted,
              fontFamily: "inherit",
              transition: "all 0.2s ease",
              letterSpacing: "0.1px",
            }}
            onMouseEnter={(e) => {
              if (tab !== key) {
                (e.currentTarget as HTMLButtonElement).style.color =
                  palette.textPrimary;
              }
            }}
            onMouseLeave={(e) => {
              if (tab !== key) {
                (e.currentTarget as HTMLButtonElement).style.color =
                  palette.textMuted;
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        key={tab}
        style={{
          background: palette.bgPanel,
          border: `1px solid ${palette.border}`,
          borderRadius: "16px",
          padding: "32px",
          maxWidth: "620px",
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.03) inset, 0 24px 48px -28px rgba(0,0,0,0.65)",
          ...fadeIn,
        }}
      >
        {/* ── Profil Tab ── */}
        {tab === "profil" && (
          <div>
            <SectionLabel>Informasi Usaha</SectionLabel>
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
            <SectionLabel>Manajemen Akun Admin</SectionLabel>
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
                    fontSize: "12.5px",
                    color: palette.danger,
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
            <SectionLabel>Kebijakan Penyewaan</SectionLabel>
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
              fontSize: "12.5px",
              color: palette.danger,
              marginTop: "10px",
              padding: "11px 15px",
              background: "rgba(224,133,133,0.07)",
              borderRadius: "9px",
              border: "1px solid rgba(224,133,133,0.2)",
              ...fadeIn,
            }}
          >
            {error}
          </p>
        )}

        {/* Action buttons */}
        <div
          style={{
            marginTop: "26px",
            paddingTop: "22px",
            borderTop: `1px solid ${palette.borderSoft}`,
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
                padding: "9px 18px",
                background: "transparent",
                border: `1px solid ${palette.border}`,
                borderRadius: "9px",
                color: palette.textMuted,
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color =
                  palette.gold;
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  palette.goldBorder;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color =
                  palette.textMuted;
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  palette.border;
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