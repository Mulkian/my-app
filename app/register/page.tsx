"use client";
// app/register/page.tsx

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [mounted,  setMounted]  = useState(false);

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
      const dest = roleData?.role === "admin" ? "/dashboard" : "/portal";
      router.replace(dest);
    });
  }, [router]);

  const set = (k: keyof typeof form, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    setError("");
  };

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8)           s++;
    if (/[A-Z]/.test(p))         s++;
    if (/[0-9]/.test(p))         s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthConfig = [
    null,
    { label: "Lemah",       color: "#f87171" },
    { label: "Cukup",       color: "#fbbf24" },
    { label: "Kuat",        color: "#60a5fa" },
    { label: "Sangat Kuat", color: "#4ade80" },
  ];

  const handleRegister = async () => {
    if (!form.name.trim())              { setError("Nama lengkap wajib diisi."); return; }
    if (!form.email.trim())             { setError("Email wajib diisi."); return; }
    if (form.password.length < 8)       { setError("Password minimal 8 karakter."); return; }
    if (form.password !== form.confirm) { setError("Konfirmasi password tidak cocok."); return; }

    setLoading(true);
    setError("");

    // signUp → trigger handle_new_user() otomatis insert role = 'user'
    const { data, error: authErr } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name },
      },
    });

    if (authErr) {
      setError(
        authErr.message.includes("already registered")
          ? "Email ini sudah terdaftar. Silakan login."
          : authErr.message
      );
      setLoading(false);
      return;
    }

    // Jika email confirmation dimatikan di Supabase → langsung dapat session
    if (data.session) {
      await supabase.auth.signOut();
    }
    setSuccess(true);
    setLoading(false);
  };

  if (!mounted) return null;

  // ── Success screen ──────────────────────────────────────────
  if (success) return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #060912; font-family: 'DM Sans', sans-serif; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
        @keyframes pop    { 0%,100%{transform:scale(1)}40%{transform:scale(1.12)}70%{transform:scale(0.96)} }
        @keyframes ring   { 0%,100%{opacity:.3;transform:scale(1)}50%{opacity:.7;transform:scale(1.06)} }
        .success-card { animation: fadeUp 0.5s cubic-bezier(.22,1,.36,1) both; }
        .check-icon   { animation: pop   0.7s cubic-bezier(.22,1,.36,1) 0.3s both; }
        .ring         { animation: ring  2.5s ease-in-out infinite; }
      `}</style>
      <div style={{ minHeight:"100vh", background:"#060912", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px" }}>
        <div className="success-card" style={{ textAlign:"center", maxWidth:"440px", padding:"48px 32px" }}>
          <div style={{ position:"relative", width:"80px", height:"80px", margin:"0 auto 28px" }}>
            <div className="ring" style={{ position:"absolute", inset:"-10px", borderRadius:"50%", border:"2px solid rgba(74,222,128,0.2)" }} />
            <div className="check-icon" style={{ width:"80px", height:"80px", borderRadius:"50%", background:"rgba(74,222,128,0.1)", border:"2px solid rgba(74,222,128,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>
          <h2 style={{ fontSize:"28px", fontWeight:800, color:"#f8fafc", marginBottom:"12px", fontFamily:"Syne, sans-serif" }}>Pendaftaran Berhasil!</h2>
          <p style={{ fontSize:"15px", color:"#64748b", lineHeight:1.65, marginBottom:"36px" }}>
            Link konfirmasi telah dikirim ke{" "}
            <strong style={{ color:"#f59e0b" }}>{form.email}</strong>.
            <br />Cek inbox & klik link untuk mengaktifkan akun Anda.
          </p>
          {/* catatan: akun baru selalu masuk sebagai user (role: user) */}
          <p style={{ fontSize:"13px", color:"#334155", marginBottom:"28px" }}>
            Setelah verifikasi, Anda akan masuk sebagai <strong style={{ color:"#60a5fa" }}>Pelanggan</strong> dan bisa langsung melakukan booking kendaraan.
          </p>
          <a href="/login" style={{ display:"inline-flex", alignItems:"center", gap:"9px", padding:"13px 28px", borderRadius:"11px", background:"linear-gradient(135deg,#f59e0b,#d97706)", color:"#0a0a0a", fontSize:"14px", fontWeight:700, textDecoration:"none", fontFamily:"inherit", boxShadow:"0 6px 20px rgba(245,158,11,0.3)" }}>
            Ke Halaman Login
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </a>
        </div>
      </div>
    </>
  );

  // ── Register form ───────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body { background: #060912; font-family: 'DM Sans', sans-serif; color: #f1f5f9; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes drift  { 0%,100%{transform:translate(0,0)}50%{transform:translate(20px,-15px)} }
        .d1{animation:fadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.05s both}
        .d2{animation:fadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.1s  both}
        .d3{animation:fadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.15s both}
        .d4{animation:fadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.2s  both}
        .d5{animation:fadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.25s both}
        .d6{animation:fadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.3s  both}
        .d7{animation:fadeUp 0.5s cubic-bezier(.22,1,.36,1) 0.35s both}
        .orb-x{animation:drift 10s ease-in-out infinite}
        .orb-y{animation:drift 14s ease-in-out infinite reverse}
        .ifield{transition:border-color 0.2s,box-shadow 0.2s}
        .ifield:focus{outline:none;border-color:#f59e0b !important;box-shadow:0 0 0 3px rgba(245,158,11,0.12) !important}
        .btn-reg{background:linear-gradient(135deg,#f59e0b,#d97706);transition:transform 0.18s,box-shadow 0.18s}
        .btn-reg:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 28px rgba(245,158,11,0.38)}
        .btn-reg:active:not(:disabled){transform:translateY(0)}
        .eye-btn{background:none;border:none;color:#475569;cursor:pointer;display:flex;padding:4px;transition:color 0.15s}
        .eye-btn:hover{color:#94a3b8}
        .link-g{color:#f59e0b;text-decoration:none;font-weight:600;transition:opacity 0.15s}
        .link-g:hover{opacity:0.8}
      `}</style>

      <div style={{ minHeight:"100vh", background:"#060912", position:"relative", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", padding:"32px 24px" }}>
        {/* Background orbs */}
        <div className="orb-x" style={{ position:"fixed", top:"-20%", right:"-10%", width:"600px", height:"600px", borderRadius:"50%", background:"radial-gradient(circle,rgba(245,158,11,0.06) 0%,transparent 65%)", pointerEvents:"none" }} />
        <div className="orb-y" style={{ position:"fixed", bottom:"-15%", left:"-8%", width:"500px", height:"500px", borderRadius:"50%", background:"radial-gradient(circle,rgba(56,189,248,0.04) 0%,transparent 65%)", pointerEvents:"none" }} />
        <svg style={{ position:"fixed", inset:0, width:"100%", height:"100%", pointerEvents:"none", opacity:0.35 }} xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="g2" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#g2)" />
        </svg>

        <div style={{ width:"100%", maxWidth:"480px", position:"relative", zIndex:1 }}>
          {/* Logo */}
          <div className="d1" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"11px", marginBottom:"32px" }}>
            <div style={{ width:"40px", height:"40px", borderRadius:"11px", background:"linear-gradient(135deg,#f59e0b,#d97706)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 6px 18px rgba(245,158,11,0.38),inset 0 1px 0 rgba(255,255,255,0.18)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-4h10l2 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/></svg>
            </div>
            <span style={{ fontSize:"17px", fontWeight:800, color:"#f8fafc", fontFamily:"Syne, sans-serif" }}>CarRent Pro</span>
          </div>

          {/* Card */}
          <div style={{ background:"rgba(10,15,30,0.9)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"20px", padding:"36px 32px", backdropFilter:"blur(20px)", boxShadow:"0 40px 80px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.04)" }}>

            {/* Header */}
            <div className="d2" style={{ marginBottom:"28px" }}>
              <h2 style={{ fontSize:"26px", fontWeight:800, color:"#f8fafc", letterSpacing:"-0.6px", marginBottom:"6px", fontFamily:"Syne, sans-serif" }}>Buat Akun Pelanggan</h2>
              <p style={{ fontSize:"14px", color:"#475569" }}>
                Sudah punya akun?{" "}
                <a href="/login" className="link-g">Masuk di sini</a>
              </p>
            </div>

            {/* Role badge */}
            <div className="d2" style={{ display:"inline-flex", alignItems:"center", gap:"7px", background:"rgba(96,165,250,0.1)", border:"1px solid rgba(96,165,250,0.2)", borderRadius:"8px", padding:"7px 12px", marginBottom:"20px" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span style={{ fontSize:"12px", color:"#93c5fd", fontWeight:600 }}>Akun baru otomatis terdaftar sebagai Pelanggan</span>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background:"rgba(220,38,38,0.1)", border:"1px solid rgba(248,113,113,0.25)", borderRadius:"10px", padding:"11px 14px", marginBottom:"18px", display:"flex", gap:"9px", alignItems:"center" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span style={{ fontSize:"13.5px", color:"#fca5a5" }}>{error}</span>
              </div>
            )}

            {/* Name */}
            <div className="d3" style={{ marginBottom:"14px" }}>
              <label style={{ display:"block", fontSize:"11.5px", fontWeight:600, color:"#94a3b8", marginBottom:"7px", letterSpacing:"0.07em", textTransform:"uppercase" }}>Nama Lengkap *</label>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:"13px", top:"50%", transform:"translateY(-50%)", color:"#334155", pointerEvents:"none" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <input type="text" value={form.name} onChange={e => set("name", e.target.value)} onKeyDown={e => e.key === "Enter" && handleRegister()} placeholder="Hendra Setiawan" autoComplete="name" className="ifield" style={{ width:"100%", background:"rgba(15,23,42,0.8)", border:"1px solid #1e293b", borderRadius:"10px", padding:"12px 14px 12px 40px", color:"#f1f5f9", fontSize:"14px", fontFamily:"inherit" }} />
              </div>
            </div>

            {/* Email */}
            <div className="d4" style={{ marginBottom:"14px" }}>
              <label style={{ display:"block", fontSize:"11.5px", fontWeight:600, color:"#94a3b8", marginBottom:"7px", letterSpacing:"0.07em", textTransform:"uppercase" }}>Email *</label>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:"13px", top:"50%", transform:"translateY(-50%)", color:"#334155", pointerEvents:"none" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </span>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} onKeyDown={e => e.key === "Enter" && handleRegister()} placeholder="pelanggan@email.com" autoComplete="email" className="ifield" style={{ width:"100%", background:"rgba(15,23,42,0.8)", border:"1px solid #1e293b", borderRadius:"10px", padding:"12px 14px 12px 40px", color:"#f1f5f9", fontSize:"14px", fontFamily:"inherit" }} />
              </div>
            </div>

            {/* Password */}
            <div className="d5" style={{ marginBottom:"6px" }}>
              <label style={{ display:"block", fontSize:"11.5px", fontWeight:600, color:"#94a3b8", marginBottom:"7px", letterSpacing:"0.07em", textTransform:"uppercase" }}>Password *</label>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:"13px", top:"50%", transform:"translateY(-50%)", color:"#334155", pointerEvents:"none" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input type={showPass ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)} onKeyDown={e => e.key === "Enter" && handleRegister()} placeholder="Min. 8 karakter" autoComplete="new-password" className="ifield" style={{ width:"100%", background:"rgba(15,23,42,0.8)", border:"1px solid #1e293b", borderRadius:"10px", padding:"12px 40px 12px 40px", color:"#f1f5f9", fontSize:"14px", fontFamily:"inherit" }} />
                <button className="eye-btn" onClick={() => setShowPass(p => !p)} style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)" }}>
                  {showPass
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                </button>
              </div>
            </div>

            {/* Strength */}
            {form.password && (
              <div style={{ marginBottom:"14px" }}>
                <div style={{ display:"flex", gap:"4px", marginBottom:"5px" }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ flex:1, height:"3px", borderRadius:"2px", background: i <= strength && strengthConfig[strength] ? strengthConfig[strength]!.color : "#1e293b", transition:"background 0.3s" }} />
                  ))}
                </div>
                {strengthConfig[strength] && (
                  <span style={{ fontSize:"11.5px", fontWeight:600, color:strengthConfig[strength]!.color }}>{strengthConfig[strength]!.label}</span>
                )}
              </div>
            )}

            {/* Confirm password */}
            <div className="d6" style={{ marginBottom:"24px" }}>
              <label style={{ display:"block", fontSize:"11.5px", fontWeight:600, color:"#94a3b8", marginBottom:"7px", letterSpacing:"0.07em", textTransform:"uppercase" }}>Konfirmasi Password *</label>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:"13px", top:"50%", transform:"translateY(-50%)", color:"#334155", pointerEvents:"none" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                <input type={showConf ? "text" : "password"} value={form.confirm} onChange={e => set("confirm", e.target.value)} onKeyDown={e => e.key === "Enter" && handleRegister()} placeholder="Ulangi password" autoComplete="new-password" className="ifield" style={{ width:"100%", background:"rgba(15,23,42,0.8)", border:`1px solid ${form.confirm && form.confirm !== form.password ? "#f87171" : "#1e293b"}`, borderRadius:"10px", padding:"12px 40px 12px 40px", color:"#f1f5f9", fontSize:"14px", fontFamily:"inherit" }} />
                <button className="eye-btn" onClick={() => setShowConf(p => !p)} style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)" }}>
                  {showConf
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                </button>
              </div>
              {form.confirm && form.confirm !== form.password && (
                <p style={{ fontSize:"12px", color:"#f87171", marginTop:"5px" }}>Password tidak cocok</p>
              )}
            </div>

            {/* Submit */}
            <button className="btn-reg d7" onClick={handleRegister} disabled={loading} style={{ width:"100%", padding:"13px", borderRadius:"11px", border:"none", fontSize:"15px", fontWeight:700, color:"#0a0a0a", cursor:loading ? "not-allowed" : "pointer", opacity:loading ? 0.75 : 1, fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:"9px" }}>
              {loading
                ? <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation:"spin 0.7s linear infinite" }} strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Mendaftar...</>
                : <>Daftar Sekarang<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>}
            </button>
          </div>

          <p style={{ textAlign:"center", marginTop:"20px", fontSize:"12px", color:"#334155" }}>
            © 2024 CarRent Pro · Semua data dienkripsi & aman
          </p>
        </div>
      </div>
    </>
  );
}