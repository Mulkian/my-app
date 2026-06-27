"use client";
// app/login/page.tsx

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm]       = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [showPass, setShowPass] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      await redirectByRole(data.session.user.id);
    });
  }, []);

  const redirectByRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    router.replace(data?.role === "admin" ? "/dashboard" : "/portal");
  };

  const set = (k: keyof typeof form, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    setError("");
  };

  const handleLogin = async () => {
    if (!form.email.trim())    { setError("Email wajib diisi."); return; }
    if (!form.password.trim()) { setError("Password wajib diisi."); return; }

    setLoading(true);
    setError("");

    const { data, error: authErr } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (authErr) {
      setError(
        authErr.message.includes("Invalid login")
          ? "Email atau password salah."
          : authErr.message
      );
      setLoading(false);
      return;
    }

    if (data.session) {
      await redirectByRole(data.session.user.id);
    }
    setLoading(false);
  };

  if (!mounted) return null;

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
        .orb-x{animation:drift 10s ease-in-out infinite}
        .orb-y{animation:drift 14s ease-in-out infinite reverse}
        .ifield{transition:border-color 0.2s,box-shadow 0.2s}
        .ifield:focus{outline:none;border-color:#f59e0b !important;box-shadow:0 0 0 3px rgba(245,158,11,0.12) !important}
        .btn-login{background:linear-gradient(135deg,#f59e0b,#d97706);transition:transform 0.18s,box-shadow 0.18s}
        .btn-login:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 28px rgba(245,158,11,0.38)}
        .eye-btn{background:none;border:none;color:#475569;cursor:pointer;display:flex;padding:4px;transition:color 0.15s}
        .eye-btn:hover{color:#94a3b8}
        .link-g{color:#f59e0b;text-decoration:none;font-weight:600;transition:opacity 0.15s}
        .link-g:hover{opacity:0.8}
      `}</style>

      <div style={{ minHeight:"100vh", background:"#060912", position:"relative", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", padding:"32px 24px" }}>
        <div className="orb-x" style={{ position:"fixed", top:"-20%", right:"-10%", width:"600px", height:"600px", borderRadius:"50%", background:"radial-gradient(circle,rgba(245,158,11,0.06) 0%,transparent 65%)", pointerEvents:"none" }} />
        <div className="orb-y" style={{ position:"fixed", bottom:"-15%", left:"-8%", width:"500px", height:"500px", borderRadius:"50%", background:"radial-gradient(circle,rgba(56,189,248,0.04) 0%,transparent 65%)", pointerEvents:"none" }} />

        <div style={{ width:"100%", maxWidth:"440px", position:"relative", zIndex:1 }}>
          {/* Logo */}
          <div className="d1" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"11px", marginBottom:"32px" }}>
            <div style={{ width:"40px", height:"40px", borderRadius:"11px", background:"linear-gradient(135deg,#f59e0b,#d97706)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 6px 18px rgba(245,158,11,0.38)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-4h10l2 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/></svg>
            </div>
            <span style={{ fontSize:"17px", fontWeight:800, color:"#f8fafc", fontFamily:"Syne, sans-serif" }}>CarRent Pro</span>
          </div>

          {/* Card */}
          <div style={{ background:"rgba(10,15,30,0.9)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"20px", padding:"36px 32px", backdropFilter:"blur(20px)", boxShadow:"0 40px 80px rgba(0,0,0,0.5)" }}>
            <div className="d2" style={{ marginBottom:"28px" }}>
              <h2 style={{ fontSize:"26px", fontWeight:800, color:"#f8fafc", letterSpacing:"-0.6px", marginBottom:"6px", fontFamily:"Syne, sans-serif" }}>Masuk</h2>
              <p style={{ fontSize:"14px", color:"#475569" }}>
                Belum punya akun?{" "}
                <a href="/register" className="link-g">Daftar di sini</a>
              </p>
            </div>

            {error && (
              <div style={{ background:"rgba(220,38,38,0.1)", border:"1px solid rgba(248,113,113,0.25)", borderRadius:"10px", padding:"11px 14px", marginBottom:"18px", display:"flex", gap:"9px", alignItems:"center" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span style={{ fontSize:"13.5px", color:"#fca5a5" }}>{error}</span>
              </div>
            )}

            {/* Email */}
            <div className="d3" style={{ marginBottom:"14px" }}>
              <label style={{ display:"block", fontSize:"11.5px", fontWeight:600, color:"#94a3b8", marginBottom:"7px", letterSpacing:"0.07em", textTransform:"uppercase" }}>Email</label>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:"13px", top:"50%", transform:"translateY(-50%)", color:"#334155", pointerEvents:"none" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </span>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="email@contoh.com" autoComplete="email" className="ifield" style={{ width:"100%", background:"rgba(15,23,42,0.8)", border:"1px solid #1e293b", borderRadius:"10px", padding:"12px 14px 12px 40px", color:"#f1f5f9", fontSize:"14px", fontFamily:"inherit" }} />
              </div>
            </div>

            {/* Password */}
            <div className="d4" style={{ marginBottom:"24px" }}>
              <label style={{ display:"block", fontSize:"11.5px", fontWeight:600, color:"#94a3b8", marginBottom:"7px", letterSpacing:"0.07em", textTransform:"uppercase" }}>Password</label>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:"13px", top:"50%", transform:"translateY(-50%)", color:"#334155", pointerEvents:"none" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input type={showPass ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="Password Anda" autoComplete="current-password" className="ifield" style={{ width:"100%", background:"rgba(15,23,42,0.8)", border:"1px solid #1e293b", borderRadius:"10px", padding:"12px 40px 12px 40px", color:"#f1f5f9", fontSize:"14px", fontFamily:"inherit" }} />
                <button className="eye-btn" onClick={() => setShowPass(p => !p)} style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)" }}>
                  {showPass
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                </button>
              </div>
            </div>

            <button className="btn-login d5" onClick={handleLogin} disabled={loading} style={{ width:"100%", padding:"13px", borderRadius:"11px", border:"none", fontSize:"15px", fontWeight:700, color:"#0a0a0a", cursor:loading ? "not-allowed" : "pointer", opacity:loading ? 0.75 : 1, fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:"9px" }}>
              {loading
                ? <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation:"spin 0.7s linear infinite" }} strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Masuk...</>
                : <>Masuk<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>}
            </button>
          </div>

          <p style={{ textAlign:"center", marginTop:"20px", fontSize:"12px", color:"#334155" }}>
            © 2026 CarRent Pro · Semua data dienkripsi & aman
          </p>
        </div>
      </div>
    </>
  );
}