"use client";
// app/home/page.tsx — Halaman publik katalog kendaraan (tanpa login)

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

interface Vehicle {
  id: string;
  name: string;
  plate: string;
  year?: string;
  color?: string;
  rate: number;
  status: string;
  fuel?: string;
  transmission?: string;
  photo_url?: string;
}

function fmt(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export default function HomePage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTrans, setFilterTrans] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const isDark = theme === "dark";

  // ── Design tokens ──────────────────────────────────────────
  const bg = isDark ? "#05070d" : "#f7f8fa";
  const navBg = isDark ? "rgba(5,7,13,0.85)" : "rgba(247,248,250,0.85)";
  const borderColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.08)";
  const textPrimary = isDark ? "#f8fafc" : "#0f172a";
  const textSecondary = isDark ? "#cbd5e1" : "#334155";
  const textMuted = isDark ? "#64748b" : "#64748b";
  const cardBg = isDark ? "rgba(255,255,255,0.035)" : "#ffffff";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)";
  const cardShadow = isDark ? "none" : "0 1px 2px rgba(15,23,42,0.04)";
  const inputBg = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.12)";
  const inputColor = isDark ? "#f1f5f9" : "#0f172a";
  const accent = "#f59e0b";
  const accentDeep = "#b45309";

  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.session.user.id)
        .single();
      router.replace(roleData?.role === "admin" ? "/dashboard" : "/portal");
    });

    supabase
      .from("vehicles")
      .select("id,name,plate,year,color,rate,status,fuel,transmission,photo_url")
      .order("name")
      .then(({ data }) => {
        setVehicles(data ?? []);
        setLoading(false);
      });
  }, [router]);

  const filtered = vehicles
    .filter(
      (v) =>
        (!filterTrans || v.transmission === filterTrans) &&
        (v.name.toLowerCase().includes(search.toLowerCase()) ||
          v.plate.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) =>
      sortBy === "rate_asc"
        ? a.rate - b.rate
        : sortBy === "rate_desc"
          ? b.rate - a.rate
          : a.name.localeCompare(b.name)
    );

  const availCount = vehicles.filter((v) => v.status === "Tersedia").length;

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body { font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }

        @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
        @keyframes drift   { 0%,100%{transform:translate(0,0)}50%{transform:translate(24px,-18px)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes fadeIn  { from{opacity:0}to{opacity:1} }
        @keyframes scaleIn { from{opacity:0;transform:scale(0.96) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)} }

        .orb-x { animation: drift 12s ease-in-out infinite; }
        .orb-y { animation: drift 16s ease-in-out infinite reverse; }

        .d1 { animation: fadeUp 0.6s cubic-bezier(.22,1,.36,1) 0.05s both; }
        .d2 { animation: fadeUp 0.6s cubic-bezier(.22,1,.36,1) 0.12s both; }
        .d3 { animation: fadeUp 0.6s cubic-bezier(.22,1,.36,1) 0.18s both; }
        .d4 { animation: fadeUp 0.6s cubic-bezier(.22,1,.36,1) 0.24s both; }
        .d5 { animation: fadeUp 0.6s cubic-bezier(.22,1,.36,1) 0.30s both; }

        .ifield { transition: border-color 0.2s, box-shadow 0.2s, background 0.2s; }
        .ifield:focus { outline: none; border-color: #f59e0b !important; box-shadow: 0 0 0 3px rgba(245,158,11,0.14) !important; }
        .ifield::placeholder { color: #64748b; }

        .btn-primary {
          background: linear-gradient(135deg,#fbbf24,#d97706);
          border: none; border-radius: 10px; color: #171310;
          font-family: 'DM Sans', sans-serif; font-weight: 700;
          cursor: pointer; transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
        }
        .btn-primary:hover { transform: translateY(-1.5px); box-shadow: 0 10px 26px rgba(245,158,11,0.32); filter: brightness(1.03); }
        .btn-primary:active { transform: translateY(0); }

        .btn-outline {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 10px; color: #94a3b8;
          font-family: 'DM Sans', sans-serif; font-weight: 600;
          cursor: pointer; transition: border-color 0.18s, color 0.18s, background 0.18s;
        }
        .btn-outline:hover { border-color: #f59e0b; color: #f59e0b; background: rgba(245,158,11,0.06); }

        .link-g { color: #f59e0b; text-decoration: none; font-weight: 600; transition: opacity 0.15s; }
        .link-g:hover { opacity: 0.8; }

        .modal-bg {
          position: fixed; inset: 0; z-index: 50;
          background: rgba(0,0,0,0.72);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          animation: fadeIn 0.2s ease;
        }
        .modal-card {
          background: rgba(10,15,30,0.98);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px; padding: 38px 34px;
          max-width: 400px; width: 100%; text-align: center;
          backdrop-filter: blur(20px);
          box-shadow: 0 24px 60px rgba(0,0,0,0.5);
          animation: scaleIn 0.25s cubic-bezier(.22,1,.36,1) both;
        }

        .spin { animation: spin 0.8s linear infinite; }

        .card-hover {
          transition: transform 0.22s cubic-bezier(.22,1,.36,1), border-color 0.22s, box-shadow 0.22s;
        }

        .map-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 0;
        }

        @media (max-width: 768px) {
          .map-grid { grid-template-columns: 1fr; }
          h1.hero-title { font-size: 30px !important; }
        }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: bg,
        position: "relative",
        overflow: "hidden",
        transition: "background 0.3s ease",
        color: textPrimary,
      }}>
        {/* Orbs */}
        <div className="orb-x" style={{ position: "fixed", top: "-18%", right: "-8%", width: "620px", height: "620px", borderRadius: "50%", background: "radial-gradient(circle,rgba(245,158,11,0.07) 0%,transparent 65%)", pointerEvents: "none" }} />
        <div className="orb-y" style={{ position: "fixed", bottom: "-14%", left: "-6%", width: "520px", height: "520px", borderRadius: "50%", background: "radial-gradient(circle,rgba(56,189,248,0.045) 0%,transparent 65%)", pointerEvents: "none" }} />
        <svg style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: isDark ? 0.25 : 0.15 }} xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse"><path d="M 64 0 L 0 0 0 64" fill="none" stroke={isDark ? "rgba(255,255,255,0.035)" : "rgba(15,23,42,0.04)"} strokeWidth="1" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* ── NAVBAR ── */}
        <nav style={{
          position: "sticky", top: 0, zIndex: 40,
          background: navBg,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid ${borderColor}`,
          padding: "14px 32px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          transition: "background 0.3s ease, border-color 0.3s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: "linear-gradient(135deg,#fbbf24,#d97706)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 18px rgba(245,158,11,0.3)" }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#171310" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-4h10l2 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />
                <circle cx="7.5" cy="17.5" r="2.5" /><circle cx="16.5" cy="17.5" r="2.5" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15.5, fontWeight: 800, color: textPrimary, fontFamily: "Syne, sans-serif", lineHeight: 1.1, letterSpacing: "-0.01em", transition: "color 0.3s" }}>Walid Rent Car</div>
              <div style={{ fontSize: 11, color: textMuted, marginTop: 2, letterSpacing: "0.02em", transition: "color 0.3s" }}>Layanan Sewa Kendaraan · Aceh</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              title={isDark ? "Mode Terang" : "Mode Gelap"}
              style={{
                width: 38, height: 38,
                borderRadius: 10,
                background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)",
                border: `1px solid ${borderColor}`,
                color: isDark ? "#fbbf24" : "#0f172a",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
                flexShrink: 0,
              }}
            >
              {isDark ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            <button
              className="btn-outline"
              onClick={() => router.push("/login")}
              style={{
                padding: "9px 20px", fontSize: 13,
                borderColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.14)",
                color: isDark ? "#94a3b8" : "#475569",
              }}
            >
              Masuk
            </button>
            <button className="btn-primary" onClick={() => router.push("/register")} style={{ padding: "9px 20px", fontSize: 13 }}>
              Daftar Gratis
            </button>
          </div>
        </nav>

        {/* ── HERO ── */}
        <div className="d1" style={{ textAlign: "center", padding: "64px 24px 44px", position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.28)", borderRadius: 20, padding: "6px 16px", fontSize: 12, fontWeight: 600, color: "#fbbf24", marginBottom: 22 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            Melayani seluruh wilayah Aceh
          </div>
          <h1 className="hero-title" style={{ fontSize: 40, fontWeight: 800, color: textPrimary, fontFamily: "Syne, sans-serif", lineHeight: 1.18, letterSpacing: "-0.02em", marginBottom: 16, transition: "color 0.3s" }}>
            Sewa Kendaraan <span style={{ background: "linear-gradient(135deg,#fbbf24,#d97706)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Mudah</span> &<br />Terpercaya di Aceh
          </h1>
          <p style={{ fontSize: 15.5, color: textMuted, maxWidth: 500, margin: "0 auto 36px", lineHeight: 1.75, transition: "color 0.3s" }}>
            Pilih kendaraan impian Anda dari armada terlengkap kami. Booking online, harga transparan, layanan profesional.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 44, flexWrap: "wrap" }}>
            {[
              { val: vehicles.length, lbl: "Total Armada" },
              { val: availCount, lbl: "Tersedia Sekarang" },
              { val: "4.9★", lbl: "Rating Pelanggan" },
            ].map((s, i) => (
              <div key={s.lbl} style={{ textAlign: "center", position: "relative", paddingLeft: i > 0 ? 44 : 0 }}>
                {i > 0 && <div style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: 1, background: borderColor }} />}
                <div style={{ fontSize: 27, fontWeight: 800, color: accent, fontFamily: "Syne, sans-serif", letterSpacing: "-0.01em" }}>{s.val}</div>
                <div style={{ fontSize: 12, color: textMuted, marginTop: 4, transition: "color 0.3s" }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FILTER BAR ── */}
        <div className="d2" style={{
          position: "relative", zIndex: 1, margin: "0 32px 24px",
          padding: "16px", borderRadius: 14,
          background: cardBg, border: `1px solid ${cardBorder}`,
          display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center",
          transition: "background 0.3s, border-color 0.3s",
        }}>
          <div style={{ flex: 1, minWidth: 200, position: "relative", display: "flex", alignItems: "center" }}>
            <span style={{ position: "absolute", left: 13, color: isDark ? "#475569" : "#94a3b8", pointerEvents: "none" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </span>
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau plat kendaraan…"
              className="ifield"
              style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 10, padding: "10px 14px 10px 38px", color: inputColor, fontSize: 13, fontFamily: "inherit", transition: "background 0.3s, border-color 0.3s" }}
            />
          </div>
          {[
            { id: "trans", val: filterTrans, set: setFilterTrans, opts: [["", "Semua Transmisi"], ["Otomatis", "Otomatis"], ["Manual", "Manual"]] },
            { id: "sort", val: sortBy, set: setSortBy, opts: [["name", "Nama A–Z"], ["rate_asc", "Harga ↑"], ["rate_desc", "Harga ↓"]] },
          ].map((f) => (
            <select
              key={f.id} value={f.val} onChange={(e) => f.set(e.target.value)}
              className="ifield"
              style={{ background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 10, padding: "10px 14px", color: inputColor, fontSize: 13, fontFamily: "inherit", cursor: "pointer", transition: "background 0.3s" }}
            >
              {f.opts.map(([v, l]) => <option key={v} value={v} style={{ background: isDark ? "#0f1724" : "#ffffff", color: isDark ? "#f1f5f9" : "#0f172a" }}>{l}</option>)}
            </select>
          ))}
          <span style={{ fontSize: 13, color: textMuted, fontWeight: 500, padding: "0 4px" }}>
            {loading ? "Memuat…" : `${filtered.length} kendaraan ditemukan`}
          </span>
        </div>

        {/* ── GRID ── */}
        <div className="d3" style={{ position: "relative", zIndex: 1, padding: "0 32px 36px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "90px 0", color: textMuted }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" className="spin" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              <p style={{ marginTop: 14, fontSize: 13 }}>Memuat kendaraan…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "90px 0", color: textMuted }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 14, opacity: 0.6 }}><path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-4h10l2 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" /><circle cx="7.5" cy="17.5" r="2.5" /><circle cx="16.5" cy="17.5" r="2.5" /></svg>
              <p style={{ fontSize: 15, fontWeight: 600, color: textSecondary }}>Tidak ada kendaraan ditemukan</p>
              <p style={{ fontSize: 13, marginTop: 5, opacity: 0.8 }}>Coba ubah filter atau kata kunci pencarian</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 18 }}>
              {filtered.map((v) => (
                <VehicleCard key={v.id} vehicle={v} onBook={() => setShowModal(true)} isDark={isDark} cardBg={cardBg} cardBorder={cardBorder} cardShadow={cardShadow} textPrimary={textPrimary} textMuted={textMuted} />
              ))}
            </div>
          )}
        </div>

        {/* ── CTA BANNER ── */}
        <div className="d4" style={{
          position: "relative", zIndex: 1, margin: "0 32px 52px",
          background: isDark
            ? "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.03))"
            : "linear-gradient(135deg, rgba(245,158,11,0.09), rgba(245,158,11,0.02))",
          border: "1px solid rgba(245,158,11,0.22)", borderRadius: 18, padding: "30px 34px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap",
        }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: textPrimary, fontFamily: "Syne, sans-serif", marginBottom: 6, transition: "color 0.3s" }}>Siap booking kendaraan favorit Anda?</h3>
            <p style={{ fontSize: 13.5, color: textMuted, transition: "color 0.3s" }}>Daftar gratis sekarang dan nikmati kemudahan sewa kendaraan di Aceh.</p>
          </div>
          <button className="btn-primary" onClick={() => router.push("/register")} style={{ padding: "13px 30px", fontSize: 14, whiteSpace: "nowrap" }}>
            Daftar Sekarang →
          </button>
        </div>

        {/* ── LOKASI KAMI ── */}
        <div className="d5" style={{ position: "relative", zIndex: 1, padding: "0 32px 52px" }}>
          <div style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: 23, fontWeight: 800, color: textPrimary, fontFamily: "Syne, sans-serif", letterSpacing: "-0.01em", marginBottom: 6, transition: "color 0.3s" }}>
              Lokasi Kami
            </h2>
            <p style={{ fontSize: 13.5, color: textMuted, transition: "color 0.3s" }}>
              Kunjungi atau hubungi kami langsung di lokasi berikut
            </p>
          </div>

          <div
            className="map-grid"
            style={{
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: 18,
              overflow: "hidden",
              boxShadow: cardShadow,
              transition: "background 0.3s, border-color 0.3s",
            }}
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d26143.113960691953!2d95.34768370409847!3d5.551313154315664!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1sLr.%20Lampoh%20balee%20II%20no%2C18%2C%20Tj.%20Selamat%2C%20Kec.%20Darussalam%2C%20Kabupaten%20Aceh%20Besar%2C%20Aceh%2023373!5e1!3m2!1sid!2sid!4v1781598302506!5m2!1sid!2sid"
              width="100%"
              height="380"
              style={{ border: 0, display: "block", minHeight: 320, filter: isDark ? "grayscale(0.3) invert(0.92) contrast(0.9)" : "none" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            <div style={{ padding: 30, display: "flex", flexDirection: "column", gap: 22, borderLeft: `1px solid ${cardBorder}`, transition: "border-color 0.3s" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 7 }}>
                  📍 Alamat
                </div>
                <div style={{ fontSize: 14, color: textPrimary, lineHeight: 1.75, transition: "color 0.3s" }}>
                  Lr. Lampoh Balee II No. 18,<br />
                  Tj. Selamat, Kec. Darussalam,<br />
                  Kab. Aceh Besar, Aceh 23373
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 7 }}>
                  🕐 Jam Operasional
                </div>
                <div style={{ fontSize: 13.5, color: textMuted, lineHeight: 1.9 }}>
                  Senin – Sabtu: 08.00 – 20.00<br />
                  Minggu: 09.00 – 17.00
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 7 }}>
                  📞 Kontak
                </div>
                <div style={{ fontSize: 13.5, color: textMuted, lineHeight: 1.9 }}>
                  +62 812-6028-4230<br />
                  info@walidrentcaraceh.online
                </div>
              </div>

              <a
                href="https://maps.app.goo.gl/pR1ZiZji1pDUf7L89"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{
                  marginTop: "auto",
                  padding: "12px 20px",
                  fontSize: 13.5,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                🗺️ Buka di Google Maps
              </a>
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ position: "relative", zIndex: 1, borderTop: `1px solid ${borderColor}`, padding: "22px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, transition: "border-color 0.3s" }}>
          <span style={{ fontSize: 12, color: textMuted }}>© 2026 Walid Rent Car · Aceh. Seluruh hak cipta dilindungi.</span>
          <div style={{ display: "flex", gap: 20 }}>
            <a href="/login" className="link-g" style={{ fontSize: 12 }}>Masuk</a>
            <a href="/register" className="link-g" style={{ fontSize: 12 }}>Daftar</a>
          </div>
        </div>
      </div>

      {/* ── MODAL BOOKING ── */}
      {showModal && (
        <div className="modal-bg" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ width: 62, height: 62, borderRadius: "50%", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#f8fafc", fontFamily: "Syne, sans-serif", marginBottom: 10 }}>
              Login untuk melanjutkan
            </h3>
            <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.75, marginBottom: 26 }}>
              Untuk memesan kendaraan, Anda perlu masuk atau membuat akun terlebih dahulu. Proses daftar hanya 1 menit!
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-primary" onClick={() => router.push("/register")} style={{ flex: 1, padding: "12px", fontSize: 14 }}>
                Daftar Gratis
              </button>
              <button className="btn-outline" onClick={() => router.push("/login")} style={{ flex: 1, padding: "12px", fontSize: 14 }}>
                Sudah Punya Akun
              </button>
            </div>
            <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "#475569", fontSize: 12, cursor: "pointer", marginTop: 18, fontFamily: "inherit" }}>
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Vehicle Card ──────────────────────────────────────────────
function VehicleCard({
  vehicle: v,
  onBook,
  isDark,
  cardBg,
  cardBorder,
  cardShadow,
  textPrimary,
  textMuted,
}: {
  vehicle: Vehicle;
  onBook: () => void;
  isDark: boolean;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  textPrimary: string;
  textMuted: string;
}) {
  const unavail = v.status !== "Tersedia";
  return (
    <div
      className="card-hover"
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: cardShadow,
        opacity: unavail ? 0.55 : 1,
      }}
      onMouseEnter={(e) => {
        if (!unavail) {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(245,158,11,0.4)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = isDark
            ? "0 16px 32px rgba(0,0,0,0.35)"
            : "0 16px 32px rgba(15,23,42,0.1)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.borderColor = cardBorder;
        (e.currentTarget as HTMLDivElement).style.boxShadow = cardShadow;
      }}
    >
      {/* Image */}
      <div style={{ height: 148, background: isDark ? "#0a1220" : "#eef1f5", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.3s" }}>
        {v.photo_url ? (
          <img src={v.photo_url} alt={v.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#1e2c47" : "#cbd5e1"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-4h10l2 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />
            <circle cx="7.5" cy="17.5" r="2.5" /><circle cx="16.5" cy="17.5" r="2.5" />
          </svg>
        )}
        <span style={{
          position: "absolute", top: 10, right: 10,
          background: unavail ? "rgba(248,113,113,0.16)" : "rgba(74,222,128,0.16)",
          color: unavail ? "#f87171" : "#4ade80",
          border: `1px solid ${unavail ? "rgba(248,113,113,0.32)" : "rgba(74,222,128,0.32)"}`,
          fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6, backdropFilter: "blur(6px)",
        }}>{v.status}</span>
        {v.transmission && (
          <span style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(0,0,0,0.68)", color: "#e2e8f0", fontSize: 11, fontWeight: 600, padding: "4px 9px", borderRadius: 6, backdropFilter: "blur(6px)" }}>
            {v.transmission}
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "16px 17px" }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: textPrimary, marginBottom: 2, transition: "color 0.3s" }}>{v.name}</div>
        <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 10, fontVariantNumeric: "tabular-nums", transition: "color 0.3s" }}>{v.plate}</div>
        <div style={{ display: "flex", gap: 12, fontSize: 11.5, color: textMuted, marginBottom: 14, flexWrap: "wrap", transition: "color 0.3s" }}>
          {v.year && <span>📅 {v.year}</span>}
          {v.color && <span>🎨 {v.color}</span>}
          {v.fuel && <span>⛽ {v.fuel}</span>}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 17, fontWeight: 800, color: "#f59e0b", letterSpacing: "-0.01em" }}>{fmt(v.rate)}</span>
            <span style={{ fontSize: 11.5, color: textMuted }}>/hari</span>
          </div>
          {unavail ? (
            <span style={{ fontSize: 12, color: textMuted, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)", padding: "7px 13px", borderRadius: 8, fontWeight: 500 }}>Tidak Tersedia</span>
          ) : (
            <button className="btn-primary" onClick={onBook} style={{ padding: "8px 16px", fontSize: 12.5 }}>
              Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}