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

  useEffect(() => {
    setMounted(true);
    // Kalau sudah login, redirect sesuai role
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.session.user.id)
        .single();
      router.replace(roleData?.role === "admin" ? "/dashboard" : "/portal");
    });

    // Ambil semua kendaraan (RLS harus izinkan anon SELECT)
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
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body { background: #060912; font-family: 'DM Sans', sans-serif; color: #f1f5f9; }

        @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        @keyframes drift   { 0%,100%{transform:translate(0,0)}50%{transform:translate(20px,-15px)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes fadeIn  { from{opacity:0}to{opacity:1} }

        .orb-x { animation: drift 10s ease-in-out infinite; }
        .orb-y { animation: drift 14s ease-in-out infinite reverse; }

        .d1 { animation: fadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.05s both; }
        .d2 { animation: fadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.10s both; }
        .d3 { animation: fadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.15s both; }
        .d4 { animation: fadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.20s both; }

        .ifield { transition: border-color 0.2s, box-shadow 0.2s; }
        .ifield:focus { outline: none; border-color: #f59e0b !important; box-shadow: 0 0 0 3px rgba(245,158,11,0.12) !important; }

        .card-vehicle {
          background: rgba(255,255,255,0.04);
          border: 0.5px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          overflow: hidden;
          transition: transform 0.15s, border-color 0.15s;
        }
        .card-vehicle:hover { transform: translateY(-3px); border-color: rgba(245,158,11,0.35); }
        .card-vehicle.unavail { opacity: 0.5; }
        .card-vehicle.unavail:hover { transform: none; border-color: rgba(255,255,255,0.08); }

        .btn-primary {
          background: linear-gradient(135deg,#f59e0b,#d97706);
          border: none; border-radius: 10px; color: #0a0a0a;
          font-family: 'DM Sans', sans-serif; font-weight: 700;
          cursor: pointer; transition: transform 0.18s, box-shadow 0.18s;
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(245,158,11,0.35); }
        .btn-outline {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 10px; color: #94a3b8;
          font-family: 'DM Sans', sans-serif; font-weight: 600;
          cursor: pointer; transition: border-color 0.18s, color 0.18s;
        }
        .btn-outline:hover { border-color: #f59e0b; color: #f59e0b; }

        .link-g { color: #f59e0b; text-decoration: none; font-weight: 600; transition: opacity 0.15s; }
        .link-g:hover { opacity: 0.8; }

        .modal-bg {
          position: fixed; inset: 0; z-index: 50;
          background: rgba(0,0,0,0.7);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          animation: fadeIn 0.2s ease;
        }
        .modal-card {
          background: rgba(10,15,30,0.97);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px; padding: 36px 32px;
          max-width: 400px; width: 100%; text-align: center;
          backdrop-filter: blur(20px);
        }

        .spin { animation: spin 0.7s linear infinite; }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#060912", position: "relative", overflow: "hidden" }}>
        {/* Orbs */}
        <div className="orb-x" style={{ position: "fixed", top: "-20%", right: "-10%", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle,rgba(245,158,11,0.06) 0%,transparent 65%)", pointerEvents: "none" }} />
        <div className="orb-y" style={{ position: "fixed", bottom: "-15%", left: "-8%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle,rgba(56,189,248,0.04) 0%,transparent 65%)", pointerEvents: "none" }} />
        <svg style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.3 }} xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* ── NAVBAR ── */}
        <nav style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(6,9,18,0.92)", backdropFilter: "blur(20px)", borderBottom: "0.5px solid rgba(255,255,255,0.07)", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#f59e0b,#d97706)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(245,158,11,0.35)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-4h10l2 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />
                <circle cx="7.5" cy="17.5" r="2.5" /><circle cx="16.5" cy="17.5" r="2.5" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#f8fafc", fontFamily: "Syne, sans-serif", lineHeight: 1 }}>Walid Rent Car</div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>Aceh</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button className="btn-outline" onClick={() => router.push("/login")} style={{ padding: "8px 20px", fontSize: 13 }}>
              Masuk
            </button>
            <button className="btn-primary" onClick={() => router.push("/register")} style={{ padding: "8px 20px", fontSize: 13 }}>
              Daftar Gratis
            </button>
          </div>
        </nav>

        {/* ── HERO ── */}
        <div className="d1" style={{ textAlign: "center", padding: "56px 24px 40px", position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(245,158,11,0.1)", border: "0.5px solid rgba(245,158,11,0.3)", borderRadius: 20, padding: "5px 16px", fontSize: 12, color: "#fbbf24", marginBottom: 20 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            Melayani seluruh wilayah Aceh
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "#f8fafc", fontFamily: "Syne, sans-serif", lineHeight: 1.2, marginBottom: 14 }}>
            Sewa Kendaraan <span style={{ color: "#f59e0b" }}>Mudah</span> &<br />Terpercaya di Aceh
          </h1>
          <p style={{ fontSize: 15, color: "#64748b", maxWidth: 480, margin: "0 auto 32px", lineHeight: 1.7 }}>
            Pilih kendaraan impian Anda dari armada terlengkap kami. Booking online, harga transparan, layanan profesional.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 40, flexWrap: "wrap" }}>
            {[
              { val: vehicles.length, lbl: "Total Armada" },
              { val: availCount, lbl: "Tersedia Sekarang" },
              { val: "4.9★", lbl: "Rating Pelanggan" },
            ].map((s) => (
              <div key={s.lbl} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#f59e0b", fontFamily: "Syne, sans-serif" }}>{s.val}</div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 3 }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FILTER BAR ── */}
        <div className="d2" style={{ position: "relative", zIndex: 1, padding: "0 32px 20px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 180, position: "relative", display: "flex", alignItems: "center" }}>
            <span style={{ position: "absolute", left: 13, color: "#334155", pointerEvents: "none" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </span>
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau plat…"
              className="ifield"
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px 10px 38px", color: "#f1f5f9", fontSize: 13, fontFamily: "inherit" }}
            />
          </div>
          {[
            { id: "trans", val: filterTrans, set: setFilterTrans, opts: [["", "Semua Transmisi"], ["Matic", "Matic"], ["Manual", "Manual"]] },
            { id: "sort", val: sortBy, set: setSortBy, opts: [["name", "Nama A–Z"], ["rate_asc", "Harga ↑"], ["rate_desc", "Harga ↓"]] },
          ].map((f) => (
            <select
              key={f.id} value={f.val} onChange={(e) => f.set(e.target.value)}
              className="ifield"
              style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#f1f5f9", fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}
            >
              {f.opts.map(([v, l]) => <option key={v} value={v} style={{ background: "#0f1724" }}>{l}</option>)}
            </select>
          ))}
          <span style={{ fontSize: 13, color: "#475569" }}>
            {loading ? "Memuat…" : `${filtered.length} kendaraan`}
          </span>
        </div>

        {/* ── GRID ── */}
        <div className="d3" style={{ position: "relative", zIndex: 1, padding: "0 32px 32px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "#475569" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" className="spin" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              <p style={{ marginTop: 12, fontSize: 13 }}>Memuat kendaraan…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "#334155" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}><path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-4h10l2 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" /><circle cx="7.5" cy="17.5" r="2.5" /><circle cx="16.5" cy="17.5" r="2.5" /></svg>
              <p style={{ fontSize: 15, color: "#475569" }}>Tidak ada kendaraan ditemukan</p>
              <p style={{ fontSize: 13, color: "#334155", marginTop: 4 }}>Coba ubah filter atau kata kunci pencarian</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {filtered.map((v) => (
                <VehicleCard key={v.id} vehicle={v} onBook={() => setShowModal(true)} />
              ))}
            </div>
          )}
        </div>

        {/* ── CTA BANNER ── */}
        <div className="d4" style={{ position: "relative", zIndex: 1, margin: "0 32px 48px", background: "rgba(245,158,11,0.07)", border: "0.5px solid rgba(245,158,11,0.2)", borderRadius: 16, padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#f8fafc", fontFamily: "Syne, sans-serif", marginBottom: 5 }}>Siap booking kendaraan favorit Anda?</h3>
            <p style={{ fontSize: 13, color: "#64748b" }}>Daftar gratis sekarang dan nikmati kemudahan sewa di Aceh.</p>
          </div>
          <button className="btn-primary" onClick={() => router.push("/register")} style={{ padding: "12px 28px", fontSize: 14, whiteSpace: "nowrap" }}>
            Daftar Sekarang →
          </button>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ position: "relative", zIndex: 1, borderTop: "0.5px solid rgba(255,255,255,0.06)", padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#334155" }}>© 2024 Walid Rent Car · Aceh</span>
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
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#f8fafc", fontFamily: "Syne, sans-serif", marginBottom: 10 }}>
              Login untuk melanjutkan
            </h3>
            <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, marginBottom: 24 }}>
              Untuk memesan kendaraan, Anda perlu masuk atau membuat akun terlebih dahulu. Proses daftar hanya 1 menit!
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-primary" onClick={() => router.push("/register")} style={{ flex: 1, padding: "11px", fontSize: 14 }}>
                Daftar Gratis
              </button>
              <button className="btn-outline" onClick={() => router.push("/login")} style={{ flex: 1, padding: "11px", fontSize: 14 }}>
                Sudah Punya Akun
              </button>
            </div>
            <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "#475569", fontSize: 12, cursor: "pointer", marginTop: 16, fontFamily: "inherit" }}>
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Vehicle Card ──────────────────────────────────────────────
function VehicleCard({ vehicle: v, onBook }: { vehicle: Vehicle; onBook: () => void }) {
  const unavail = v.status !== "Tersedia";
  return (
    <div className={`card-vehicle${unavail ? " unavail" : ""}`}>
      {/* Image / placeholder */}
      <div style={{ height: 140, background: "#0c1526", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {v.photo_url ? (
          <img src={v.photo_url} alt={v.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-4h10l2 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />
            <circle cx="7.5" cy="17.5" r="2.5" /><circle cx="16.5" cy="17.5" r="2.5" />
          </svg>
        )}
        {/* Status badge */}
        <span style={{
          position: "absolute", top: 10, right: 10,
          background: unavail ? "rgba(248,113,113,0.15)" : "rgba(74,222,128,0.15)",
          color: unavail ? "#f87171" : "#4ade80",
          border: `0.5px solid ${unavail ? "rgba(248,113,113,0.3)" : "rgba(74,222,128,0.3)"}`,
          fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 5,
        }}>{v.status}</span>
        {/* Transmission badge */}
        {v.transmission && (
          <span style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(0,0,0,0.65)", color: "#94a3b8", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 5 }}>
            {v.transmission}
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 2 }}>{v.name}</div>
        <div style={{ fontSize: 11, color: "#475569", marginBottom: 8 }}>{v.plate}</div>
        <div style={{ display: "flex", gap: 10, fontSize: 11, color: "#64748b", marginBottom: 12, flexWrap: "wrap" }}>
          {v.year && <span>📅 {v.year}</span>}
          {v.color && <span>🎨 {v.color}</span>}
          {v.fuel && <span>⛽ {v.fuel}</span>}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#f59e0b" }}>{fmt(v.rate)}</span>
            <span style={{ fontSize: 11, color: "#475569" }}>/hari</span>
          </div>
          {unavail ? (
            <span style={{ fontSize: 12, color: "#475569", background: "rgba(255,255,255,0.05)", padding: "6px 12px", borderRadius: 8 }}>Tidak Tersedia</span>
          ) : (
            <button
              className="btn-primary"
              onClick={onBook}
              style={{ padding: "7px 14px", fontSize: 12 }}
            >
              Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}