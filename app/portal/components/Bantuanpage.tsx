"use client";
import { useState } from "react";
import {
  ACCENT, CARD_BG, CARD_BORDER, TEXT_PRIMARY, TEXT_MUTED,
  lStyle, iStyle, FAQS,
} from "@/lib/constants";
import { Icons } from "@/app/portal/components/icons";

interface Props {
  userEmail?: string;
}

export default function BantuanPage({ userEmail }: Props) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [msgForm, setMsgForm] = useState({ subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!msgForm.subject || !msgForm.message) return;
    // Simulate send
    setSent(true);
    setMsgForm({ subject: "", message: "" });
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: TEXT_PRIMARY, marginBottom: 4 }}>Pusat Bantuan</h1>
        <p style={{ fontSize: 13, color: TEXT_MUTED }}>Temukan jawaban atau hubungi tim kami.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18 }}>
        {/* FAQ */}
        <div style={{ background: CARD_BG, borderRadius: 14, border: `0.5px solid ${CARD_BORDER}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `0.5px solid ${CARD_BORDER}` }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>Pertanyaan Umum (FAQ)</h2>
          </div>
          <div style={{ padding: "8px 0" }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ borderBottom: `0.5px solid ${CARD_BORDER}` }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: "100%", background: "none", border: "none", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontFamily: "inherit", gap: 12 }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, textAlign: "left" }}>{faq.q}</span>
                  <span style={{ color: ACCENT, flexShrink: 0, transform: openFaq === i ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>
                    <Icons.ChevronRight />
                  </span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 20px 16px", fontSize: 13, color: TEXT_MUTED, lineHeight: 1.7 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Contact card */}
          <div style={{ background: CARD_BG, borderRadius: 14, border: `0.5px solid ${CARD_BORDER}`, padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 16 }}>Hubungi Kami</h3>
            {[
              { icon: <Icons.Phone size={15} />, label: "Telepon", value: "0821-xxxx-xxxx", sub: "Senin–Sabtu, 08.00–17.00" },
              { icon: <Icons.MessageCircle size={15} />, label: "WhatsApp", value: "0821-xxxx-xxxx", sub: "Respon cepat" },
              { icon: <Icons.Mail size={15} />, label: "Email", value: "walid@rentcar.id", sub: "Balasan 1×24 jam" },
            ].map((c) => (
              <div key={c.label} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(245,158,11,0.12)", color: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {c.icon}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: TEXT_MUTED }}>{c.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{c.value}</div>
                  <div style={{ fontSize: 11, color: TEXT_MUTED }}>{c.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Send message */}
          <div style={{ background: CARD_BG, borderRadius: 14, border: `0.5px solid ${CARD_BORDER}`, padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 16 }}>Kirim Pesan</h3>
            {userEmail && (
              <div style={{ marginBottom: 12 }}>
                <label style={lStyle}>Dari</label>
                <input type="text" value={userEmail} disabled style={{ ...iStyle, opacity: 0.5, cursor: "not-allowed" }} />
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <label style={lStyle}>Subjek</label>
              <input
                type="text"
                placeholder="Topik pertanyaan"
                value={msgForm.subject}
                onChange={(e) => setMsgForm((p) => ({ ...p, subject: e.target.value }))}
                style={iStyle}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={lStyle}>Pesan</label>
              <textarea
                placeholder="Tulis pesan Anda di sini…"
                value={msgForm.message}
                onChange={(e) => setMsgForm((p) => ({ ...p, message: e.target.value }))}
                rows={4}
                style={{ ...iStyle, resize: "vertical" }}
              />
            </div>

            {sent && (
              <div style={{ background: "rgba(34,197,94,0.1)", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#4ade80", display: "flex", alignItems: "center", gap: 8 }}>
                <Icons.CheckCircle size={16} /> Pesan terkirim! Kami akan segera merespons.
              </div>
            )}

            <button
              onClick={handleSend}
              style={{ width: "100%", background: ACCENT, color: "#fff", border: "none", borderRadius: 9, padding: "11px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >
              Kirim Pesan
            </button>
          </div>

          {/* Office info */}
          <div style={{ background: CARD_BG, borderRadius: 14, border: `0.5px solid ${CARD_BORDER}`, padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 12 }}>Lokasi Kantor</h3>
            <p style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.7 }}>
              Jl. Contoh No. 123, Banda Aceh,<br />
              Aceh, 23111<br /><br />
              <strong style={{ color: TEXT_PRIMARY }}>Jam Operasional:</strong><br />
              Senin – Sabtu: 08.00 – 17.00<br />
              Minggu: Tutup
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}